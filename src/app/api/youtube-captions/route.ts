import { NextRequest, NextResponse } from 'next/server';
import { YoutubeTranscript } from 'youtube-transcript';

export const runtime = 'nodejs';

interface RawSegment { text: string; offset: number; duration: number; }
export interface CaptionSegment { text: string; startMs: number; endMs: number; }

const NOISE = /^\[.*?\]$|^\(.*?\)$|^♪|^♫/;

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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId') ?? '';
  if (!videoId) return NextResponse.json({ error: 'videoId required' }, { status: 400 });

  let raw: RawSegment[] = [];
  for (const lang of ['en', 'en-US', 'en-GB', '']) {
    try {
      const result = await YoutubeTranscript.fetchTranscript(videoId, lang ? { lang } : {});
      if (result?.length) { raw = result as RawSegment[]; break; }
    } catch { /* try next */ }
  }

  if (!raw.length) {
    return NextResponse.json({ error: '이 영상에는 자막이 없거나 가져올 수 없어요.' }, { status: 404 });
  }

  const segments = groupIntoSegments(raw);

  // Close gaps between segments so caption display is continuous.
  // Without this, timeMs falls in a gap → found = -1 → wrong sentence shown.
  for (let i = 0; i < segments.length - 1; i++) {
    const gap = segments[i + 1].startMs - segments[i].endMs;
    if (gap > 0 && gap < 4000) {          // only close gaps shorter than 4 s
      segments[i].endMs = segments[i + 1].startMs;
    }
  }

  const rawText = raw.map(s => s.text.replace(/\n/g, ' ').trim()).join(' ');
  return NextResponse.json({ segments, rawText });
}
