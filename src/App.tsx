/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import { RockolaRoomState, SongItem, RockolaTheme } from './types';
import { RockolaHeader } from './components/RockolaHeader';
import { YouTubeJukeboxPlayer } from './components/YouTubeJukeboxPlayer';
import { QueueList } from './components/QueueList';
import { GuestRequestView } from './components/GuestRequestView';
import { SearchModal } from './components/SearchModal';
import { CastModal } from './components/CastModal';
import { ThemeModal } from './components/ThemeModal';
import { SongCuriousFactsTicker } from './components/SongCuriousFactsTicker';
import { useTvRemote } from './hooks/useTvRemote';
import { sounds } from './utils/audioEffects';
import { THEMES } from './utils/themeStyles';

const DEFAULT_STATE: RockolaRoomState = {
  name: 'Rockola Rafael García',
  currentSong: null,
  isPlaying: false,
  queue: [],
  history: [],
  autoPlayDj: true,
  theme: 'wurlitzer',
};

export default function App() {
  const [roomState, setRoomState] = useState<RockolaRoomState>(DEFAULT_STATE);
  const [mode, setMode] = useState<'tv' | 'guest'>('tv');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showCastModal, setShowCastModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [deviceId, setDeviceId] = useState<string>('');
  const [tvUrl, setTvUrl] = useState<string>('');

  // Detect mode & retrieve/generate deviceId
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const isMobileScreen = window.innerWidth <= 768;

      // Open directly in mobile/guest mode if launched as PWA or on phone
      if (params.get('mode') === 'guest' || isStandalone || (isMobileScreen && params.get('mode') !== 'tv')) {
        setMode('guest');
      } else if (params.get('mode') === 'tv') {
        setMode('tv');
      }

      setTvUrl(window.location.origin);

      let did = localStorage.getItem('rockola_device_id');
      if (!did) {
        did = 'dev_' + Math.random().toString(36).substring(2, 10);
        localStorage.setItem('rockola_device_id', did);
      }
      setDeviceId(did);
    }
  }, []);

  // Fetch initial state & connect SSE stream
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const res = await fetch('/api/state');
        if (res.ok) {
          const data = await res.json();
          setRoomState(data);
        }
      } catch (err) {
        console.warn('Backend /api/state not reachable yet, using initial data:', err);
      }
    };
    fetchInitial();

    let eventSource: EventSource | null = null;
    try {
      const deviceType = mode === 'guest' ? 'mobile' : 'tv';
      const deviceName = mode === 'guest' ? 'Celular' : 'Smart TV (Principal)';
      eventSource = new EventSource(`/api/stream?deviceType=${deviceType}&deviceName=${encodeURIComponent(deviceName)}`);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setRoomState((prev) => ({
            ...prev,
            ...data,
          }));
        } catch (e) {
          console.error('Error parsing SSE event:', e);
        }
      };
    } catch {
      // ignore
    }

    return () => {
      if (eventSource) eventSource.close();
    };
  }, []);

  // Handle adding a song
  const handleAddSong = useCallback(
    async (songData: Partial<SongItem> & { isPriority?: boolean }) => {
      try {
        const cleanId = songData.videoId || 'unknown';
        const res = await fetch('/api/queue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...songData,
            videoId: cleanId,
            title: songData.title || 'Canción',
            deviceId,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          setRoomState((prev) => ({
            ...prev,
            queue: data.queue,
            currentSong: data.currentSong || prev.currentSong,
            isPlaying: data.currentSong ? true : prev.isPlaying,
          }));
        }
      } catch (err) {
        console.error('Error adding song:', err);
        const cleanId = songData.videoId || 'unknown';
        const newSong: SongItem = {
          id: 'local_' + Date.now(),
          videoId: cleanId,
          title: songData.title || 'Canción',
          artist: songData.artist || '',
          thumbnail: songData.thumbnail || `https://img.youtube.com/vi/${cleanId}/hqdefault.jpg`,
          votes: songData.isPriority ? 10 : 1,
          voters: [deviceId],
          addedAt: Date.now(),
          isFirstPriority: songData.isPriority,
        };
        setRoomState((prev) => {
          if (!prev.currentSong) {
            return { ...prev, currentSong: newSong, isPlaying: true };
          }
          return {
            ...prev,
            queue: songData.isPriority ? [newSong, ...prev.queue] : [...prev.queue, newSong],
          };
        });
      }
    },
    [deviceId]
  );

  // Play next song
  const handleNextSong = useCallback(async () => {
    sounds.playNeedleDrop();
    try {
      const res = await fetch('/api/player/next', {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setRoomState((prev) => ({
          ...prev,
          currentSong: data.currentSong,
          queue: data.queue,
          isPlaying: !!data.currentSong,
        }));
      }
    } catch {
      setRoomState((prev) => {
        const current = prev.currentSong;
        const newHistory = current
          ? [{ ...current, playedAt: Date.now(), playCount: 1 }, ...prev.history].slice(0, 25)
          : prev.history;
        if (prev.queue.length > 0) {
          const [next, ...rest] = prev.queue;
          return {
            ...prev,
            currentSong: next,
            queue: rest,
            history: newHistory,
            isPlaying: true,
          };
        }
        return {
          ...prev,
          currentSong: null,
          history: newHistory,
          isPlaying: false,
        };
      });
    }
  }, []);

  // Play / Pause toggle
  const handlePlayPauseToggle = useCallback((playing: boolean) => {
    setRoomState((prev) => ({ ...prev, isPlaying: playing }));
    fetch('/api/player/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPlaying: playing }),
    }).catch(() => {});
  }, []);

  // Jump to song immediately
  const handlePlayNow = useCallback((song: SongItem) => {
    sounds.playNeedleDrop();
    setRoomState((prev) => {
      const newQueue = prev.queue.filter((s) => s.id !== song.id);
      const newHistory = prev.currentSong
        ? [{ ...prev.currentSong, playedAt: Date.now(), playCount: 1 }, ...prev.history].slice(0, 25)
        : prev.history;
      return {
        ...prev,
        currentSong: song,
        queue: newQueue,
        history: newHistory,
        isPlaying: true,
      };
    });

    fetch('/api/player/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentSong: song, isPlaying: true }),
    }).catch(() => {});
  }, []);

  // Move song to top (Pasar al primer puesto)
  const handleMoveToTop = useCallback(async (songId: string) => {
    sounds.playButtonTick();
    try {
      const res = await fetch(`/api/queue/${songId}/top`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.queue) {
          setRoomState((prev) => ({ ...prev, queue: data.queue }));
        }
      }
    } catch {
      setRoomState((prev) => {
        const idx = prev.queue.findIndex((s) => s.id === songId);
        if (idx > -1) {
          const q = [...prev.queue];
          const [song] = q.splice(idx, 1);
          song.isFirstPriority = true;
          q.unshift(song);
          return { ...prev, queue: q };
        }
        return prev;
      });
    }
  }, []);

  // Move song up
  const handleMoveUp = useCallback(async (songId: string) => {
    try {
      const res = await fetch(`/api/queue/${songId}/up`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.queue) {
          setRoomState((prev) => ({ ...prev, queue: data.queue }));
        }
      }
    } catch {
      setRoomState((prev) => {
        const idx = prev.queue.findIndex((s) => s.id === songId);
        if (idx > 0) {
          const q = [...prev.queue];
          const temp = q[idx];
          q[idx] = q[idx - 1];
          q[idx - 1] = temp;
          return { ...prev, queue: q };
        }
        return prev;
      });
    }
  }, []);

  // Move song down
  const handleMoveDown = useCallback(async (songId: string) => {
    try {
      const res = await fetch(`/api/queue/${songId}/down`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.queue) {
          setRoomState((prev) => ({ ...prev, queue: data.queue }));
        }
      }
    } catch {
      setRoomState((prev) => {
        const idx = prev.queue.findIndex((s) => s.id === songId);
        if (idx > -1 && idx < prev.queue.length - 1) {
          const q = [...prev.queue];
          const temp = q[idx];
          q[idx] = q[idx + 1];
          q[idx + 1] = temp;
          return { ...prev, queue: q };
        }
        return prev;
      });
    }
  }, []);

  // Remove song
  const handleRemoveSong = useCallback(async (songId: string) => {
    try {
      const res = await fetch(`/api/queue/${songId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.queue) {
          setRoomState((prev) => ({ ...prev, queue: data.queue }));
        }
      }
    } catch {
      setRoomState((prev) => ({
        ...prev,
        queue: prev.queue.filter((s) => s.id !== songId),
      }));
    }
  }, []);

  // Clear queue
  const handleClearQueue = useCallback(async () => {
    try {
      const res = await fetch('/api/queue/clear', {
        method: 'POST',
      });
      if (res.ok) {
        setRoomState((prev) => ({ ...prev, queue: [] }));
      }
    } catch {
      setRoomState((prev) => ({ ...prev, queue: [] }));
    }
  }, []);

  // PHYSICAL TV REMOTE CONTROL HOOK
  useTvRemote({
    onPlayPause: () => handlePlayPauseToggle(!roomState.isPlaying),
    onNext: handleNextSong,
    onOpenSearch: () => setShowSearchModal(true),
  });

  // Toggle AutoPlay DJ
  const handleToggleAutoPlayDj = useCallback(async () => {
    const nextVal = !roomState.autoPlayDj;
    try {
      await fetch('/api/settings/autoplay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoPlayDj: nextVal }),
      });
      setRoomState((prev) => ({ ...prev, autoPlayDj: nextVal }));
    } catch {
      setRoomState((prev) => ({ ...prev, autoPlayDj: nextVal }));
    }
  }, [roomState.autoPlayDj]);

  // Change theme in real-time
  const handleSelectTheme = useCallback(async (theme: RockolaTheme) => {
    try {
      await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      });
      setRoomState((prev) => ({ ...prev, theme }));
    } catch {
      setRoomState((prev) => ({ ...prev, theme }));
    }
  }, []);

  const activeTheme = THEMES[roomState.theme] || THEMES.wurlitzer;

  return (
    <div className={`min-h-screen ${activeTheme.pageBg} text-[#f5ebd7] font-sans selection:bg-[#d4af37] selection:text-black transition-colors duration-500`}>
      {/* Modo Control Móvil */}
      {mode === 'guest' ? (
        <GuestRequestView
          roomState={roomState}
          onAddSong={handleAddSong}
          onMoveToTop={handleMoveToTop}
          onPlayPauseToggle={handlePlayPauseToggle}
          onNextSong={handleNextSong}
          onSelectTheme={handleSelectTheme}
          onOpenCast={() => setShowCastModal(true)}
          onBackToTV={() => setMode('tv')}
        />
      ) : (
        /* Pantalla Principal TV (Rockola Clásica Mexicana) */
        <div className="flex min-h-screen flex-col">
          {/* Encabezado con placa de latón */}
          <RockolaHeader
            name={roomState.name}
            currentMode={mode}
            currentTheme={roomState.theme}
            onChangeMode={setMode}
            onOpenSearch={() => setShowSearchModal(true)}
            onOpenCast={() => setShowCastModal(true)}
            onOpenTheme={() => setShowThemeModal(true)}
            queueCount={roomState.queue.length}
          />

          {/* Gabinete de la Rockola (El video es el ventanal principal) */}
          <main className="mx-auto flex-1 w-full max-w-[1600px] p-3 md:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Ventana de la Rockola con el Video de YouTube */}
              <div className="lg:col-span-9 flex flex-col gap-3">
                <YouTubeJukeboxPlayer
                  currentSong={roomState.currentSong}
                  isPlaying={roomState.isPlaying}
                  currentTheme={roomState.theme}
                  onPlayPauseToggle={handlePlayPauseToggle}
                  onNextSong={handleNextSong}
                  onSongEnd={handleNextSong}
                  onOpenSearch={() => setShowSearchModal(true)}
                  onOpenCast={() => setShowCastModal(true)}
                  isHost={true}
                />
              </div>

              {/* Tarjetero de Tiras de Canciones (Compacto y elegante) */}
              <div className="lg:col-span-3 flex flex-col gap-2">
                <div className="h-[480px]">
                  <QueueList
                    queue={roomState.queue}
                    history={roomState.history}
                    currentSong={roomState.currentSong}
                    currentTheme={roomState.theme}
                    onRemove={handleRemoveSong}
                    onMoveToTop={handleMoveToTop}
                    onMoveUp={handleMoveUp}
                    onMoveDown={handleMoveDown}
                    onClearQueue={handleClearQueue}
                    onPlayNow={handlePlayNow}
                    onOpenSearch={() => setShowSearchModal(true)}
                  />
                </div>

                {/* Interruptor Modo DJ Continuo */}
                <button
                  onClick={handleToggleAutoPlayDj}
                  className={`flex items-center justify-between rounded-xl border p-2.5 text-xs transition ${
                    roomState.autoPlayDj
                      ? 'border-[#8b6528] bg-[#24150c] text-[#e6ca85]'
                      : 'border-[#4a2e18] bg-[#140b06] text-[#8c7459]'
                  }`}
                  title="Si la lista se queda vacía, la rockola sugiere y continúa la música automáticamente"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🔄</span>
                    <div className="text-left">
                      <span className="font-bold block">Modo DJ Continuo</span>
                      <span className="text-[10px] text-[#a88a5b]">
                        {roomState.autoPlayDj ? 'La música no se detiene' : 'En pausa al terminar'}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${roomState.autoPlayDj ? 'bg-[#d4af37] text-[#140b04]' : 'bg-[#2a170c] text-[#8c7459]'}`}>
                    {roomState.autoPlayDj ? 'ACTIVO' : 'OFF'}
                  </span>
                </button>

                {/* Lista de Datos Curiosos que corren automáticamente */}
                <SongCuriousFactsTicker
                  currentSong={roomState.currentSong}
                  isPlaying={roomState.isPlaying}
                />
              </div>
            </div>
          </main>
        </div>
      )}

      {/* Modal de Búsqueda Clásico */}
      {showSearchModal && (
        <SearchModal
          history={roomState.history}
          onClose={() => setShowSearchModal(false)}
          onAddSong={handleAddSong}
        />
      )}

      {/* Modal de Transmisión a TV */}
      {showCastModal && (
        <CastModal
          onClose={() => setShowCastModal(false)}
          tvUrl={tvUrl}
        />
      )}

      {/* Modal de Cambio de Tema */}
      {showThemeModal && (
        <ThemeModal
          currentTheme={roomState.theme}
          onClose={() => setShowThemeModal(false)}
          onSelectTheme={handleSelectTheme}
        />
      )}
    </div>
  );
}
