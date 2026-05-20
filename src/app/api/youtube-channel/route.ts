import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/* ─────────────────────── HTML fetch helper ─────────────────────── */

async function fetchHTML(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': UA,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  }
}

/* ─────────────────────── ytInitialData extraction ─────────────────────── */

// YouTube now embeds all page data as a JS variable in the HTML
function extractYtInitialData(html: string): Record<string, unknown> | null {
  // Use [\s\S] instead of /s flag to avoid es2018 target requirement
  const match = html.match(/var ytInitialData = ([\s\S]+?);<\/script>/);
  if (!match) return null;
  try {
    return JSON.parse(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/* ─────────────────────── Relative-date → ISO ─────────────────────── */

function relativeToISO(rel: string): string {
  const now = Date.now();
  const m = rel.match(/(\d+)\s+(second|minute|hour|day|week|month|year)/);
  if (!m) return new Date(now).toISOString();
  const n = parseInt(m[1], 10);
  const unit = m[2];
  const ms: Record<string, number> = {
    second: 1000, minute: 60_000, hour: 3_600_000,
    day: 86_400_000, week: 604_800_000, month: 2_592_000_000, year: 31_536_000_000,
  };
  return new Date(now - n * (ms[unit] ?? 0)).toISOString();
}

/* ─────────────────────── Video list extraction ─────────────────────── */

interface VideoEntry {
  videoId: string;
  title: string;
  thumbnail: string;
  description: string;
  publishedAt: string;
  views: string;
  channelId: string;
  channelName: string;
}

// Navigate the deeply nested ytInitialData to pull out video cards.
// YouTube periodically changes the renderer names; we handle both old
// (videoRenderer) and new (lockupViewModel) formats.
function extractVideos(
  data: Record<string, unknown>,
  channelId: string,
  channelName: string,
): VideoEntry[] {
  const tabs = (
    (data?.contents as Record<string, unknown>)
      ?.twoColumnBrowseResultsRenderer as Record<string, unknown>
  )?.tabs as Record<string, unknown>[] | undefined;

  if (!tabs) return [];

  const videosTab = tabs.find(
    (t) =>
      (t?.tabRenderer as Record<string, unknown>)?.title === 'Videos' ||
      (t?.tabRenderer as Record<string, unknown>)?.selected === true,
  );

  const contents = (
    (
      (videosTab?.tabRenderer as Record<string, unknown>)
        ?.content as Record<string, unknown>
    )?.richGridRenderer as Record<string, unknown>
  )?.contents as Record<string, unknown>[] | undefined;

  if (!contents) return [];

  const videos: VideoEntry[] = [];

  for (const item of contents) {
    const richItem = (item as Record<string, unknown>)?.richItemRenderer as
      | Record<string, unknown>
      | undefined;
    if (!richItem) continue;
    const content = richItem.content as Record<string, unknown> | undefined;
    if (!content) continue;

    // ── New format: lockupViewModel ──
    if (content.lockupViewModel) {
      const vm = content.lockupViewModel as Record<string, unknown>;
      const videoId = vm.contentId as string | undefined;
      if (!videoId) continue;

      const meta = (
        (vm.metadata as Record<string, unknown>)
          ?.lockupMetadataViewModel as Record<string, unknown>
      );
      const title =
        (meta?.title as Record<string, unknown>)?.content as string ?? '';

      const sources = (
        (
          (
            (vm.contentImage as Record<string, unknown>)
              ?.thumbnailViewModel as Record<string, unknown>
          )?.image as Record<string, unknown>
        )?.sources as Record<string, unknown>[]
      ) ?? [];
      const thumbnail =
        (sources[sources.length - 1]?.url as string) ??
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const rows = (
        (
          (meta?.metadata as Record<string, unknown>)
            ?.contentMetadataViewModel as Record<string, unknown>
        )?.metadataRows as Record<string, unknown>[]
      ) ?? [];
      const parts0 = (rows[0]?.metadataParts as Record<string, unknown>[]) ?? [];
      const views = (
        (parts0[0]?.text as Record<string, unknown>)?.content as string
      )?.replace(/\D+$/, '') ?? '';
      const dateRel = (
        (parts0[1]?.text as Record<string, unknown>)?.content as string
      ) ?? '';

      videos.push({
        videoId,
        title,
        thumbnail,
        description: '',
        publishedAt: relativeToISO(dateRel),
        views,
        channelId,
        channelName,
      });
      continue;
    }

    // ── Old format: videoRenderer ──
    if (content.videoRenderer) {
      const vr = content.videoRenderer as Record<string, unknown>;
      const videoId = vr.videoId as string | undefined;
      if (!videoId) continue;

      const titleRuns = (
        (vr.title as Record<string, unknown>)?.runs as Record<string, unknown>[]
      ) ?? [];
      const title = titleRuns.map((r) => r.text as string).join('');

      const thumbs = (
        (vr.thumbnail as Record<string, unknown>)
          ?.thumbnails as Record<string, unknown>[]
      ) ?? [];
      const thumbnail =
        (thumbs[thumbs.length - 1]?.url as string) ??
        `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

      const views =
        ((vr.viewCountText as Record<string, unknown>)
          ?.simpleText as string) ?? '';
      const dateRel =
        ((vr.publishedTimeText as Record<string, unknown>)
          ?.simpleText as string) ?? '';

      const descSnip =
        (
          (vr.descriptionSnippet as Record<string, unknown>)
            ?.runs as Record<string, unknown>[]
        )
          ?.map((r) => r.text as string)
          .join('')
          .slice(0, 400) ?? '';

      videos.push({
        videoId,
        title,
        thumbnail,
        description: descSnip,
        publishedAt: relativeToISO(dateRel),
        views: views.replace(/\D+$/, ''),
        channelId,
        channelName,
      });
    }
  }

  return videos;
}

/* ─────────────────────── Channel ID resolution ─────────────────────── */

async function resolveChannelId(input: string): Promise<string | null> {
  const clean = input.trim();

  if (/^UC[a-zA-Z0-9_-]{20,}$/.test(clean)) return clean;

  const directMatch = clean.match(/youtube\.com\/channel\/(UC[a-zA-Z0-9_-]{20,})/);
  if (directMatch) return directMatch[1];

  let fetchUrl = clean;
  if (!clean.startsWith('http')) {
    fetchUrl = `https://www.youtube.com/@${clean.replace(/^@/, '')}`;
  }

  const html = await fetchHTML(fetchUrl);
  if (!html) return null;

  // The RSS <link> tag is the most reliable source of the channel ID
  for (const pattern of [
    /feeds\/videos\.xml\?channel_id=(UC[a-zA-Z0-9_-]{20,})/,
    /"channelId":"(UC[a-zA-Z0-9_-]{20,})"/,
    /"externalId":"(UC[a-zA-Z0-9_-]{20,})"/,
    /\/channel\/(UC[a-zA-Z0-9_-]{22,})/,
  ]) {
    const m = html.match(pattern);
    if (m) return m[1];
  }

  return null;
}

/* ─────────────────────── Full channel data from page HTML ─────────────────────── */

async function fetchChannelData(channelUrl: string) {
  const videosUrl = channelUrl.replace(/\/?$/, '/videos');
  const html = await fetchHTML(videosUrl);
  if (!html) return null;

  const data = extractYtInitialData(html);
  if (!data) return null;

  // Channel metadata sits in the header renderer
  const header = (data?.header as Record<string, unknown>);
  const channelName: string =
    (
      (header?.pageHeaderRenderer as Record<string, unknown>)
        ?.pageTitle as string
    ) ??
    (
      (header?.c4TabbedHeaderRenderer as Record<string, unknown>)
        ?.title as string
    ) ??
    'Unknown Channel';

  // Channel ID — prefer the RSS link tag embedded in the HTML
  const channelIdMatch = html.match(/feeds\/videos\.xml\?channel_id=(UC[a-zA-Z0-9_-]{20,})/);
  const channelId = channelIdMatch?.[1] ?? '';

  const videos = extractVideos(data, channelId, channelName);

  return { channelId, channelName, videos };
}

/* ─────────────────────── Build channel URL from input ─────────────────────── */

function buildChannelUrl(input: string): string {
  const clean = input.trim();
  if (clean.startsWith('http')) {
    // Strip trailing path fragments that aren't the channel root
    const url = new URL(clean);
    // Keep @handle or /channel/UC paths; strip /videos, /shorts, etc.
    const parts = url.pathname.split('/').filter(Boolean);
    if (parts[0]?.startsWith('@') || parts[0] === 'channel') {
      return `${url.origin}/${parts.slice(0, 2).join('/')}`;
    }
    return `${url.origin}/${parts[0]}`;
  }
  return `https://www.youtube.com/@${clean.replace(/^@/, '')}`;
}

/* ─────────────────────── GET handler ─────────────────────── */

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const channelParam = searchParams.get('channel') ?? '';

  if (!channelParam) {
    return NextResponse.json({ error: 'channel parameter required' }, { status: 400 });
  }

  // If it looks like a raw channel ID already, fetch videos directly
  const isRawId = /^UC[a-zA-Z0-9_-]{20,}$/.test(channelParam.trim());
  const channelUrl = isRawId
    ? `https://www.youtube.com/channel/${channelParam.trim()}`
    : buildChannelUrl(channelParam);

  try {
    const result = await fetchChannelData(channelUrl);

    if (!result || !result.channelId) {
      // Fallback: try resolveChannelId then re-fetch
      const channelId = await resolveChannelId(channelParam);
      if (!channelId) {
        return NextResponse.json(
          { error: 'YouTube 채널을 찾을 수 없어요. 올바른 채널 URL인지 확인해주세요.' },
          { status: 404 },
        );
      }
      const fallback = await fetchChannelData(
        `https://www.youtube.com/channel/${channelId}`,
      );
      if (!fallback) {
        return NextResponse.json(
          { error: 'YouTube 채널 데이터를 불러올 수 없어요. 잠시 후 다시 시도하세요.' },
          { status: 502 },
        );
      }
      return NextResponse.json(fallback, {
        headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
      });
    }

    return NextResponse.json(result, {
      headers: { 'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'unknown';
    console.error('[youtube-channel] error:', msg);
    return NextResponse.json({ error: `서버 오류: ${msg}` }, { status: 500 });
  }
}
