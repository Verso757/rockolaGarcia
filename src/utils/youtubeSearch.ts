import { CATALOGO_FAMILIAR_DON_RAFA } from '../data/catalogo';

export interface SearchVideoResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
}

// Extract YouTube ID from link or raw text
export function extractYouTubeId(urlOrId: string): string | null {
  if (!urlOrId) return null;
  const str = urlOrId.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }
  const patterns = [
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

// List of public CORS-friendly YouTube / Invidious search mirrors
const CORS_INVIDIOUS_MIRRORS = [
  'https://invidious.f5.si',
  'https://inv.tux.pizza',
  'https://invidious.drgns.space',
  'https://invidious.einfachzocken.eu',
];

export async function searchYouTubeUniversal(query: string): Promise<SearchVideoResult[]> {
  const cleanQuery = query.trim().toLowerCase();
  if (!cleanQuery) return [];

  // 1. Direct YouTube link or 11-char ID
  const directId = extractYouTubeId(cleanQuery);
  if (directId) {
    return [
      {
        videoId: directId,
        title: `Video de YouTube (${directId})`,
        artist: 'YouTube',
        thumbnail: `https://img.youtube.com/vi/${directId}/hqdefault.jpg`,
        duration: '',
      },
    ];
  }

  // 2. Local Catalog Instant Matches
  const localMatches: SearchVideoResult[] = CATALOGO_FAMILIAR_DON_RAFA
    .filter(
      (item) =>
        item.title.toLowerCase().includes(cleanQuery) ||
        item.artist.toLowerCase().includes(cleanQuery)
    )
    .map((item) => ({
      videoId: item.videoId,
      title: item.title,
      artist: item.artist,
      thumbnail: `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
      duration: item.duration || '',
    }));

  // 3. Try local Node.js backend (/api/youtube-search)
  try {
    const localRes = await fetch(`/api/youtube-search?q=${encodeURIComponent(query.trim())}`, {
      signal: AbortSignal.timeout(3500),
    });
    if (localRes.ok) {
      const data = await localRes.json();
      if (Array.isArray(data.results) && data.results.length > 0) {
        // Merge without duplicates
        const seen = new Set(data.results.map((r: SearchVideoResult) => r.videoId));
        const combined = [...data.results];
        for (const lm of localMatches) {
          if (!seen.has(lm.videoId)) {
            combined.unshift(lm);
          }
        }
        return combined;
      }
    }
  } catch {
    // Backend /api/ is not available (e.g. static hosting on Hostinger/Vercel)
  }

  // 4. Fallback: Client-side direct query to high-availability Invidious search mirrors
  for (const mirror of CORS_INVIDIOUS_MIRRORS) {
    try {
      const mirrorRes = await fetch(
        `${mirror}/api/v1/search?q=${encodeURIComponent(query.trim())}&type=video`,
        {
          signal: AbortSignal.timeout(4000),
        }
      );
      if (mirrorRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawResults = (await mirrorRes.json()) as any[];
        if (Array.isArray(rawResults) && rawResults.length > 0) {
          const mapped = rawResults.slice(0, 18).map((item) => ({
            videoId: item.videoId,
            title: item.title || 'Video',
            artist: item.author || 'YouTube',
            thumbnail:
              item.videoThumbnails?.[0]?.url ||
              `https://img.youtube.com/vi/${item.videoId}/hqdefault.jpg`,
            duration: item.lengthSeconds
              ? `${Math.floor(item.lengthSeconds / 60)}:${String(item.lengthSeconds % 60).padStart(2, '0')}`
              : '',
          }));

          const seen = new Set(mapped.map((r) => r.videoId));
          const combined: SearchVideoResult[] = [...mapped];
          for (const lm of localMatches) {
            if (!seen.has(lm.videoId)) {
              combined.unshift(lm);
            }
          }
          return combined;
        }
      }
    } catch {
      // Try next mirror
    }
  }

  return localMatches;
}
