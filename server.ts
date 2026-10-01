import express, { Request, Response } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

const ai = new GoogleGenAI({});

export interface SongItem {
  id: string;
  videoId: string;
  title: string;
  artist?: string;
  thumbnail: string;
  duration?: string;
  requestedBy?: string;
  votes: number;
  voters: string[];
  addedAt: number;
  isFirstPriority?: boolean;
}

export interface PlayedSongRecord extends SongItem {
  playedAt: number;
  playCount: number;
}

export interface RockolaRoomState {
  name: string;
  currentSong: SongItem | null;
  isPlaying: boolean;
  queue: SongItem[];
  history: PlayedSongRecord[];
  autoPlayDj: boolean;
}

// Initial state starts blank as requested
const state: RockolaRoomState = {
  name: 'Rockola Rafael García',
  currentSong: null,
  isPlaying: false,
  queue: [],
  history: [],
  autoPlayDj: true,
};

// SSE Listeners
interface SSEClient {
  id: string;
  res: Response;
}
let sseClients: SSEClient[] = [];

function broadcastState(eventType: string = 'state') {
  const data = JSON.stringify({
    ...state,
    _eventType: eventType,
  });
  const payload = `data: ${data}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

// SSE stream
app.get('/api/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const clientId = 'c_' + Math.random().toString(36).substring(2, 9);
  const client: SSEClient = { id: clientId, res };
  sseClients.push(client);

  res.write(`data: ${JSON.stringify(state)}\n\n`);

  req.on('close', () => {
    sseClients = sseClients.filter((c) => c.id !== clientId);
  });
});

// GET current state
app.get('/api/state', (_req: Request, res: Response) => {
  res.json(state);
});

// Helper to extract YouTube video ID from links or raw strings
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

// Scrape YouTube for 1 search term (helper for search and recommendations)
async function searchYouTube(query: string, maxResults = 10) {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    const ytResponse = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      },
    });

    if (!ytResponse.ok) return [];

    const html = await ytResponse.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/);

    const results: Array<{
      videoId: string;
      title: string;
      artist: string;
      thumbnail: string;
      duration?: string;
    }> = [];

    if (match && match[1]) {
      const parsedData = JSON.parse(match[1]);
      const contents =
        parsedData.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
          ?.contents;

      if (Array.isArray(contents)) {
        for (const section of contents) {
          const itemSection = section.itemSectionRenderer?.contents;
          if (Array.isArray(itemSection)) {
            for (const item of itemSection) {
              if (item.videoRenderer && item.videoRenderer.videoId) {
                const vr = item.videoRenderer;
                const vId = vr.videoId;
                const title =
                  vr.title?.runs?.[0]?.text ||
                  vr.title?.accessibility?.accessibilityData?.label ||
                  'Video';
                const channel = vr.ownerText?.runs?.[0]?.text || 'YouTube';
                const duration = vr.lengthText?.simpleText || '';
                const thumb =
                  vr.thumbnail?.thumbnails?.[0]?.url ||
                  `https://img.youtube.com/vi/${vId}/hqdefault.jpg`;

                results.push({
                  videoId: vId,
                  title,
                  artist: channel,
                  thumbnail: thumb,
                  duration,
                });

                if (results.length >= maxResults) break;
              }
            }
          }
          if (results.length >= maxResults) break;
        }
      }
    }
    return results;
  } catch (e) {
    console.warn('searchYouTube error:', e);
    return [];
  }
}

// LIVE YOUTUBE SEARCH ENDPOINT
app.get('/api/youtube-search', async (req: Request, res: Response) => {
  const query = (req.query.q as string || '').trim();
  if (!query) {
    return res.json({ results: [] });
  }

  const directId = extractYouTubeId(query);
  if (directId) {
    return res.json({
      results: [
        {
          videoId: directId,
          title: `Video de YouTube (${directId})`,
          artist: 'YouTube',
          thumbnail: `https://img.youtube.com/vi/${directId}/hqdefault.jpg`,
          duration: '',
        },
      ],
    });
  }

  const results = await searchYouTube(query, 20);
  return res.json({ results });
});

// SMART RECOMMENDATIONS ENDPOINT (Memoria y Sugerencias de Canciones)
// Analiza las canciones recientes y sugiere canciones similares usando Gemini 2.5 Flash
app.get('/api/recommendations', async (_req: Request, res: Response) => {
  // Collect context from recent plays
  const recent = [
    ...(state.currentSong ? [state.currentSong] : []),
    ...state.history.slice(0, 5),
  ];

  const recentListText = recent.length > 0
    ? recent.map((s) => `"${s.title}" de ${s.artist || 'desconocido'}`).join(', ')
    : 'Música mexicana clásica, rancheras, mariachi, cumbias de salón y boleros';

  try {
    const prompt = `Actúa como el experto curador musical de una rockola clásica mexicana de cantina y reuniones familiares para Don Rafael García.
Las últimas canciones escuchadas o de preferencia son: ${recentListText}.
Sugiere 5 canciones mexicanas o latinas clásicas ideales que sigan ese mismo ritmo y ambiente (rancheras, boleros, mariachi o cumbias clásicas).
Responde ÚNICAMENTE en formato JSON válido como una lista de objetos: [{"title": "Nombre", "artist": "Artista"}]`;

    const aiResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = aiResponse.text || '';
    const jsonMatch = text.match(/\[[\s\S]*\]/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]) as Array<{ title: string; artist: string }>;
      const searchPromises = parsed.slice(0, 4).map(async (item) => {
        const results = await searchYouTube(`${item.title} ${item.artist}`, 1);
        return results[0] || null;
      });
      const resolved = await Promise.all(searchPromises);
      const recommendedSongs = resolved.filter(Boolean);

      if (recommendedSongs.length > 0) {
        return res.json({ recommendations: recommendedSongs });
      }
    }
  } catch (error) {
    console.warn('Gemini recommendation error, fallback to classical Mexican rotation:', error);
  }

  // Fallback classic recommendations
  const fallbackQueries = [
    'Vicente Fernandez Acá Entre Nos',
    'Juan Gabriel Amor Eterno Bellas Artes',
    'Los Angeles Azules 17 Años',
    'Jose Jose El Triste',
  ];

  const resolvedFallback = await Promise.all(
    fallbackQueries.map(async (q) => {
      const res = await searchYouTube(q, 1);
      return res[0] || null;
    })
  );
  return res.json({ recommendations: resolvedFallback.filter(Boolean) });
});

// Add song to queue
app.post('/api/queue', (req: Request, res: Response) => {
  const { videoId, title, artist, thumbnail, requestedBy, deviceId, isPriority } = req.body;

  const cleanVideoId = extractYouTubeId(videoId);
  if (!cleanVideoId) {
    return res.status(400).json({ error: 'Video de YouTube inválido' });
  }

  const newSong: SongItem = {
    id: 'song_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    videoId: cleanVideoId,
    title: (title || 'Canción').trim(),
    artist: (artist || '').trim(),
    thumbnail: thumbnail || `https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg`,
    requestedBy: (requestedBy || '').trim(),
    votes: isPriority ? 10 : 1,
    voters: deviceId ? [deviceId] : [],
    addedAt: Date.now(),
    isFirstPriority: isPriority,
  };

  if (!state.currentSong) {
    state.currentSong = newSong;
    state.isPlaying = true;
    recordSongInHistory(newSong);
  } else if (isPriority) {
    state.queue.unshift(newSong);
  } else {
    state.queue.push(newSong);
  }

  broadcastState('song_added');
  res.status(201).json({ ok: true, song: newSong, queue: state.queue, currentSong: state.currentSong });
});

function recordSongInHistory(song: SongItem) {
  const existing = state.history.find((s) => s.videoId === song.videoId);
  if (existing) {
    existing.playCount += 1;
    existing.playedAt = Date.now();
  } else {
    state.history.unshift({
      ...song,
      playedAt: Date.now(),
      playCount: 1,
    });
    if (state.history.length > 50) state.history.pop();
  }
}

// Move song to the top
app.post('/api/queue/:id/top', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = state.queue.findIndex((s) => s.id === id);
  if (idx > -1) {
    const [song] = state.queue.splice(idx, 1);
    song.isFirstPriority = true;
    state.queue.unshift(song);
    broadcastState('queue_reordered');
    return res.json({ ok: true, queue: state.queue });
  }
  res.status(404).json({ error: 'Canción no encontrada' });
});

// Move song up
app.post('/api/queue/:id/up', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = state.queue.findIndex((s) => s.id === id);
  if (idx > 0) {
    const temp = state.queue[idx];
    state.queue[idx] = state.queue[idx - 1];
    state.queue[idx - 1] = temp;
    broadcastState('queue_reordered');
    return res.json({ ok: true, queue: state.queue });
  }
  res.json({ ok: true, queue: state.queue });
});

// Move song down
app.post('/api/queue/:id/down', (req: Request, res: Response) => {
  const { id } = req.params;
  const idx = state.queue.findIndex((s) => s.id === id);
  if (idx > -1 && idx < state.queue.length - 1) {
    const temp = state.queue[idx];
    state.queue[idx] = state.queue[idx + 1];
    state.queue[idx + 1] = temp;
    broadcastState('queue_reordered');
    return res.json({ ok: true, queue: state.queue });
  }
  res.json({ ok: true, queue: state.queue });
});

// Clear queue
app.post('/api/queue/clear', (_req: Request, res: Response) => {
  state.queue = [];
  broadcastState('queue_cleared');
  res.json({ ok: true, queue: state.queue });
});

// Toggle AutoPlay DJ mode
app.post('/api/settings/autoplay', (req: Request, res: Response) => {
  const { autoPlayDj } = req.body;
  if (typeof autoPlayDj === 'boolean') {
    state.autoPlayDj = autoPlayDj;
    broadcastState('settings_updated');
  }
  res.json({ ok: true, autoPlayDj: state.autoPlayDj });
});

// Remove song
app.delete('/api/queue/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  state.queue = state.queue.filter((s) => s.id !== id);
  broadcastState('song_removed');
  res.json({ ok: true, queue: state.queue });
});

// Player playback sync
app.post('/api/player/sync', (req: Request, res: Response) => {
  const { currentSong, isPlaying } = req.body;

  if (currentSong !== undefined) {
    state.currentSong = currentSong;
  }
  if (typeof isPlaying === 'boolean') {
    state.isPlaying = isPlaying;
  }

  broadcastState('player_sync');
  res.json({ ok: true, state });
});

// Next song
app.post('/api/player/next', async (_req: Request, res: Response) => {
  if (state.currentSong) {
    recordSongInHistory(state.currentSong);
  }

  if (state.queue.length > 0) {
    const nextSong = state.queue.shift()!;
    state.currentSong = nextSong;
    state.isPlaying = true;
  } else if (state.autoPlayDj && state.currentSong) {
    // AUTO-PLAY DJ: The queue was empty, so automatically pick a recommended song
    try {
      const searchTerm = `${state.currentSong.artist || 'Mariachi'} mix clasico`;
      const suggestions = await searchYouTube(searchTerm, 3);
      const pick = suggestions.find((s) => s.videoId !== state.currentSong?.videoId) || suggestions[0];
      if (pick) {
        state.currentSong = {
          id: 'auto_' + Date.now(),
          videoId: pick.videoId,
          title: pick.title,
          artist: pick.artist,
          thumbnail: pick.thumbnail,
          duration: pick.duration,
          votes: 1,
          voters: [],
          addedAt: Date.now(),
        };
        state.isPlaying = true;
      } else {
        state.currentSong = null;
        state.isPlaying = false;
      }
    } catch {
      state.currentSong = null;
      state.isPlaying = false;
    }
  } else {
    state.currentSong = null;
    state.isPlaying = false;
  }

  broadcastState('song_changed');
  res.json({ ok: true, currentSong: state.currentSong, queue: state.queue });
});

// Start Server
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Rockola Rafael García corriendo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
