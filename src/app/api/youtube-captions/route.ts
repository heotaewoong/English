import { NextRequest, NextResponse } from 'next/server';
import { request as httpsRequest } from 'https';

export const runtime = 'nodejs';

// ─── Low-level HTTP helpers (bypass Next.js fetch extensions that trigger YouTube 429) ───

function httpsGet(url: string, headers: Record<string, string | number>, maxRedirects = 5): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = httpsRequest({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'GET',
      headers,
    }, (res) => {
      if (
        (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) &&
        res.headers.location &&
        maxRedirects > 0
      ) {
        const next = res.headers.location.startsWith('http')
          ? res.headers.location
          : `https://${parsed.hostname}${res.headers.location}`;
        res.resume();
        resolve(httpsGet(next, headers, maxRedirects - 1));
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.end();
  });
}

function httpsPost(url: string, body: string, headers: Record<string, string | number>): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const bodyBuf = Buffer.from(body, 'utf8');
    const req = httpsRequest({
      hostname: parsed.hostname,
      path: parsed.pathname + parsed.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': bodyBuf.length },
    }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

// ─── Types ───

interface RawSegment { text: string; offset: number; duration: number; }
export interface CaptionSegment { text: string; startMs: number; endMs: number; }

interface CaptionTrack {
  languageCode: string;
  kind?: string;
  baseUrl: string;
  name?: { simpleText?: string };
}

// ─── Constants ───

const NOISE = /^\[.*?\]$|^\(.*?\)$|^♪|^♫/;

const TIMEDTEXT_HEADERS = {
  'User-Agent': 'com.google.android.youtube/21.03.36 (Linux; U; Android 14)',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive',
};

// ─── Helpers ───

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

function parseXmlTranscript(xml: string): RawSegment[] {
  const results: RawSegment[] = [];

  // srv3 format: <p t="ms" d="ms">...<s>word</s>...</p>
  const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pRegex.exec(xml)) !== null) {
    const startMs = parseInt(match[1], 10);
    const durMs = parseInt(match[2], 10);
    const inner = match[3];
    let text = '';
    const sRegex = /<s[^>]*>([^<]*)<\/s>/g;
    let sMatch;
    while ((sMatch = sRegex.exec(inner)) !== null) text += sMatch[1];
    if (!text) text = inner.replace(/<[^>]+>/g, '');
    text = decodeEntities(text).trim();
    if (text) results.push({ text, offset: startMs, duration: durMs });
  }

  if (results.length > 0) return results;

  // Classic format: <text start="s" dur="s">...</text>
  const textRegex = /<text start="([^"]*)" dur="([^"]*)"[^>]*>([^<]*)<\/text>/g;
  while ((match = textRegex.exec(xml)) !== null) {
    const text = decodeEntities(match[3]).trim();
    if (text) {
      results.push({
        text,
        offset: Math.round(parseFloat(match[1]) * 1000),
        duration: Math.round(parseFloat(match[2]) * 1000),
      });
    }
  }

  return results;
}

function groupIntoSegments(raw: RawSegment[]): CaptionSegment[] {
  const groups: CaptionSegment[] = [];
  let buf = '';
  let startMs = 0;
  let endMs = 0;

  const flush = () => {
    const trimmed = buf.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    // Accept segments with ≥2 words for Korean (shorter words) or ≥3 for English
    if (wordCount >= 2) groups.push({ text: trimmed, startMs, endMs });
    buf = '';
  };

  for (const seg of raw) {
    const cleaned = seg.text.replace(/\n/g, ' ').trim();
    if (!cleaned || NOISE.test(cleaned)) continue;

    if (!buf) {
      buf = cleaned;
      startMs = seg.offset;
      endMs = seg.offset + seg.duration;
      continue;
    }

    buf += ' ' + cleaned;
    endMs = seg.offset + seg.duration;

    const totalDuration = endMs - startMs;
    const wordCount = buf.split(/\s+/).filter(Boolean).length;
    const endsWithStrong = /[.!?。！？]$/.test(buf.trim());
    const endsWithWeak = /[,;:，；]$/.test(buf.trim());

    const shouldFlush =
      (endsWithStrong && wordCount >= 4 && totalDuration >= 2000) ||
      (endsWithWeak && wordCount >= 8 && totalDuration >= 3500) ||
      (wordCount >= 14) ||
      (totalDuration > 8000 && wordCount >= 3);

    if (shouldFlush) flush();
  }

  if (buf.trim()) flush();
  return groups;
}

// ─── Supadata API (most reliable on Vercel) ───

async function fetchViaSupadata(videoId: string): Promise<RawSegment[] | null> {
  const apiKey = process.env.SUPADATA_API_KEY;
  if (!apiKey) return null;

  try {
    const text = await httpsGet(
      `https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}`,
      { 'x-api-key': apiKey, 'Accept': 'application/json' },
    );
    const data = JSON.parse(text);
    // Response: { content: [{ text, offset, duration, lang }], lang, availableLangs }
    if (!Array.isArray(data?.content) || data.content.length === 0) return null;
    return (data.content as { text: string; offset: number; duration: number }[]).map(s => ({
      text: s.text,
      offset: s.offset,
      duration: s.duration,
    }));
  } catch { return null; }
}

// ─── InnerTube player API — try multiple clients ───

async function fetchCaptionTracks(videoId: string): Promise<CaptionTrack[] | null> {
  const clients = [
    {
      clientName: 'ANDROID',
      clientVersion: '21.03.36',
      androidSdkVersion: 36,
      userAgent: 'com.google.android.youtube/21.03.36 (Linux; U; Android 14)',
    },
    {
      clientName: 'IOS',
      clientVersion: '20.11.6',
      deviceModel: 'iPhone16,2',
      osVersion: '16.7.7.20H330',
      userAgent: 'com.google.ios.youtube/20.11.6 (iPhone16,2; U; CPU iOS 16_7_7 like Mac OS X)',
    },
    {
      clientName: 'WEB',
      clientVersion: '2.20250101.01.00',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    },
  ];

  for (const client of clients) {
    try {
      const { userAgent, ...clientFields } = client;
      const text = await httpsPost(
        'https://www.youtube.com/youtubei/v1/player?prettyPrint=false',
        JSON.stringify({ context: { client: clientFields }, videoId }),
        { 'Content-Type': 'application/json', 'User-Agent': userAgent, 'Accept': '*/*' },
      );
      const data = JSON.parse(text);
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (Array.isArray(tracks) && tracks.length > 0) return tracks;
    } catch { /* try next client */ }
  }

  return null;
}

// ─── HTML scraping fallback — fetch the watch page and extract ytInitialPlayerResponse ───

async function fetchCaptionTracksViaHTML(videoId: string): Promise<CaptionTrack[] | null> {
  const html = await httpsGet(
    `https://www.youtube.com/watch?v=${videoId}&hl=en&gl=US`,
    {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
    },
  );

  if (!html || html.includes('class="g-recaptcha"')) return null;

  // Extract ytInitialPlayerResponse JSON from the page
  const startToken = 'var ytInitialPlayerResponse = ';
  const startIndex = html.indexOf(startToken);
  if (startIndex === -1) {
    // Try alternate form
    const altToken = 'ytInitialPlayerResponse = ';
    const altIndex = html.indexOf(altToken);
    if (altIndex === -1) return null;
    return extractTracksFromJsonSlice(html, altIndex + altToken.length);
  }
  return extractTracksFromJsonSlice(html, startIndex + startToken.length);
}

function extractTracksFromJsonSlice(html: string, jsonStart: number): CaptionTrack[] | null {
  let depth = 0;
  let jsonEnd = -1;
  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) { jsonEnd = i; break; }
    }
  }
  if (jsonEnd === -1) return null;
  try {
    const data = JSON.parse(html.slice(jsonStart, jsonEnd + 1));
    const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (Array.isArray(tracks) && tracks.length > 0) return tracks;
  } catch { /* parse failed */ }
  return null;
}

// ─── Pick the best track (priority: en manual > en ASR > any en-* > ko > first) ───

function pickBestTrack(tracks: CaptionTrack[]): { track: CaptionTrack; lang: string } {
  // 1) English manual
  const enManual = tracks.find(t => t.languageCode === 'en' && !t.kind);
  if (enManual) return { track: enManual, lang: 'en' };

  // 2) English ASR
  const enAsr = tracks.find(t => t.languageCode === 'en');
  if (enAsr) return { track: enAsr, lang: 'en' };

  // 3) Any en-* variant (en-US, en-GB, etc.)
  const enVariant = tracks.find(t => t.languageCode.startsWith('en'));
  if (enVariant) return { track: enVariant, lang: 'en' };

  // 4) Korean (common for Korean English-learning channels)
  const ko = tracks.find(t => t.languageCode === 'ko');
  if (ko) return { track: ko, lang: 'ko' };

  // 5) Fallback
  return { track: tracks[0], lang: tracks[0].languageCode };
}

// ─── Try to get English translated captions from a non-English track ───

async function fetchTranslatedCaptions(track: CaptionTrack, targetLang: string): Promise<string | null> {
  try {
    // YouTube supports &tlang= parameter for auto-translation
    const separator = track.baseUrl.includes('?') ? '&' : '?';
    const translatedUrl = `${track.baseUrl}${separator}tlang=${targetLang}`;
    const text = await httpsGet(translatedUrl, TIMEDTEXT_HEADERS);
    if (text.length > 100 && (text.includes('<timedtext') || text.includes('<text '))) {
      return text;
    }
  } catch { /* translation not available */ }
  return null;
}

// ─── Main API handler ───

export async function GET(req: NextRequest) {
  try {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId') ?? '';
  if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

  // ── Strategy 1: Supadata (가장 안정적 — Vercel에서도 동작) ──
  const supadataRaw = await fetchViaSupadata(videoId);
  if (supadataRaw && supadataRaw.length > 0) {
    const segments = groupIntoSegments(supadataRaw);
    for (let i = 0; i < segments.length - 1; i++) {
      const gap = segments[i + 1].startMs - segments[i].endMs;
      if (gap > 0 && gap < 4000) segments[i].endMs = segments[i + 1].startMs;
    }
    const rawText = supadataRaw.map(s => s.text.replace(/\n/g, ' ').trim()).join(' ');
    return NextResponse.json({ segments, rawText, captionLang: 'en', isTranslated: false, availableTracks: [] });
  }

  // ── Strategy 2: YouTube InnerTube API + HTML scraping ──
  const tracks = await fetchCaptionTracks(videoId) ?? await fetchCaptionTracksViaHTML(videoId);
  if (!tracks) {
    return NextResponse.json({ error: '이 영상에는 자막이 없거나 가져올 수 없어요.' }, { status: 404 });
  }

  const { track: bestTrack, lang: bestLang } = pickBestTrack(tracks);

  let xml = '';
  let captionLang = bestLang;
  let isTranslated = false;

  if (bestLang !== 'en') {
    const translatedXml = await fetchTranslatedCaptions(bestTrack, 'en');
    if (translatedXml) {
      xml = translatedXml;
      captionLang = 'en';
      isTranslated = true;
    }
  }

  if (!xml) {
    const candidates = [bestTrack, ...tracks.filter(t => t !== bestTrack)];
    for (const track of candidates) {
      try {
        const text = await httpsGet(track.baseUrl, TIMEDTEXT_HEADERS);
        if (text.length > 100 && (text.includes('<timedtext') || text.includes('<text '))) {
          xml = text;
          captionLang = track.languageCode;
          break;
        }
      } catch { /* try next */ }
    }
  }

  if (!xml) {
    return NextResponse.json({
      error: '이 영상에는 자막이 없거나 가져올 수 없어요.',
      availableTracks: tracks.map(t => ({
        lang: t.languageCode,
        kind: t.kind ?? 'manual',
        name: t.name?.simpleText ?? '',
      })),
    }, { status: 404 });
  }

  const raw = parseXmlTranscript(xml);
  if (!raw.length) {
    return NextResponse.json({ error: '자막을 파싱할 수 없어요.' }, { status: 404 });
  }

  const segments = groupIntoSegments(raw);

  for (let i = 0; i < segments.length - 1; i++) {
    const gap = segments[i + 1].startMs - segments[i].endMs;
    if (gap > 0 && gap < 4000) segments[i].endMs = segments[i + 1].startMs;
  }

  const rawText = raw.map((s) => s.text.replace(/\n/g, ' ').trim()).join(' ');

  return NextResponse.json({
    segments,
    rawText,
    captionLang,
    isTranslated,
    availableTracks: tracks.map(t => ({
      lang: t.languageCode,
      kind: t.kind ?? 'manual',
    })),
  });
  } catch (err) {
    console.error('[youtube-captions]', err);
    return NextResponse.json({ error: '자막을 가져오는 중 오류가 발생했어요.' }, { status: 500 });
  }
}
