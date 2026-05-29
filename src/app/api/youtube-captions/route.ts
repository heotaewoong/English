import { NextRequest, NextResponse } from 'next/server';
import { request as httpsRequest } from 'https';

export const runtime = 'nodejs';

// Use Node.js https directly — Next.js's fetch extension injects headers that trigger YouTube 429
function httpsGet(url: string, headers: Record<string, string>, maxRedirects = 5): Promise<string> {
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
    });
    req.on('error', reject);
    req.end();
  });
}

function httpsPost(url: string, body: string, headers: Record<string, string>): Promise<string> {
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
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

interface RawSegment { text: string; offset: number; duration: number; }
export interface CaptionSegment { text: string; startMs: number; endMs: number; }

const NOISE = /^\[.*?\]$|^\(.*?\)$|^♪|^♫/;

function decodeEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
}

function groupIntoSegments(raw: RawSegment[]): CaptionSegment[] {
  const groups: CaptionSegment[] = [];
  let buf = '';
  let startMs = 0;
  let endMs = 0;

  const flush = () => {
    const trimmed = buf.trim();
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    if (wordCount >= 3) groups.push({ text: trimmed, startMs, endMs });
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
    const endsWithStrong = /[.!?]$/.test(buf.trim());
    const endsWithWeak = /[,;:]$/.test(buf.trim());

    const shouldFlush =
      (endsWithStrong && wordCount >= 6 && totalDuration >= 2500) ||
      (endsWithWeak && wordCount >= 10 && totalDuration >= 4000) ||
      (wordCount >= 15) ||
      (totalDuration > 9000 && wordCount >= 5);

    if (shouldFlush) flush();
  }

  if (buf.trim()) flush();
  return groups;
}

async function fetchCaptionTracks(videoId: string): Promise<Array<{ languageCode: string; kind?: string; baseUrl: string }> | null> {
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

function parseXmlTranscript(xml: string): RawSegment[] {
  const results: RawSegment[] = [];

  // srv3 format: <p t="ms" d="ms">...</p>
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
  const textRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
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

const TIMEDTEXT_HEADERS = {
  'User-Agent': 'com.google.android.youtube/21.03.36 (Linux; U; Android 14)',
  'Accept': '*/*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Connection': 'keep-alive',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId') ?? '';
  if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

  const tracks = await fetchCaptionTracks(videoId);
  if (!tracks) {
    return NextResponse.json({ error: '이 영상에는 자막이 없거나 가져올 수 없어요.' }, { status: 404 });
  }

  // Prefer manually-created EN track, then ASR EN, then first track
  const enTrack =
    tracks.find((t) => t.languageCode === 'en' && !t.kind) ||
    tracks.find((t) => t.languageCode === 'en') ||
    tracks[0];

  // Fetch the track's native URL directly — adding &tlang= triggers a rate-limited translation endpoint
  let xml = '';
  const candidates = [enTrack, ...tracks.filter((t) => t !== enTrack && t.languageCode?.startsWith('en'))];
  for (const track of candidates) {
    try {
      const text = await httpsGet(track.baseUrl, TIMEDTEXT_HEADERS);
      if (text.length > 100 && text.includes('<timedtext')) { xml = text; break; }
    } catch { /* try next */ }
  }

  if (!xml) {
    return NextResponse.json({ error: '이 영상에는 자막이 없거나 가져올 수 없어요.' }, { status: 404 });
  }

  const raw = parseXmlTranscript(xml);
  if (!raw.length) {
    return NextResponse.json({ error: '이 영상에는 자막이 없거나 가져올 수 없어요.' }, { status: 404 });
  }

  const segments = groupIntoSegments(raw);

  // Close small gaps so caption display is continuous
  for (let i = 0; i < segments.length - 1; i++) {
    const gap = segments[i + 1].startMs - segments[i].endMs;
    if (gap > 0 && gap < 4000) segments[i].endMs = segments[i + 1].startMs;
  }

  const rawText = raw.map((s) => s.text.replace(/\n/g, ' ').trim()).join(' ');
  return NextResponse.json({ segments, rawText });
}
