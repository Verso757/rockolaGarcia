import React, { useEffect, useRef, useState } from 'react';
import { SongItem } from '../types';
import QRCode from 'qrcode';
import {
  Play,
  Pause,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  AlertCircle,
  Search,
  Cast,
  Disc3,
} from 'lucide-react';

interface YouTubeJukeboxPlayerProps {
  currentSong: SongItem | null;
  isPlaying: boolean;
  onPlayPauseToggle: (playing: boolean) => void;
  onNextSong: () => void;
  onSongEnd: () => void;
  onOpenSearch: () => void;
  onOpenCast?: () => void;
  isHost?: boolean;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string | HTMLElement,
        options: {
          videoId?: string;
          playerVars?: Record<string, unknown>;
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: (event: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  loadVideoById: (id: string) => void;
  cueVideoById: (id: string) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  isMuted: () => boolean;
  mute: () => void;
  unMute: () => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
}

export const YouTubeJukeboxPlayer: React.FC<YouTubeJukeboxPlayerProps> = ({
  currentSong,
  isPlaying,
  onPlayPauseToggle,
  onNextSong,
  onSongEnd,
  onOpenSearch,
  onOpenCast,
  isHost = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isReady, setIsReady] = useState(false);
  const [volume, setVolume] = useState(90);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasError, setHasError] = useState<string | null>(null);
  const [needUserGesture, setNeedUserGesture] = useState(false);
  const playerElementId = 'youtube-jukebox-iframe-player';

  // Subtle QR watermark on video corner
  useEffect(() => {
    if (typeof window !== 'undefined' && qrCanvasRef.current) {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', 'guest');
      QRCode.toCanvas(
        qrCanvasRef.current,
        url.toString(),
        {
          width: 80,
          margin: 1,
          color: {
            dark: '#1a100a',
            light: '#ffffff',
          },
        },
        (err) => {
          if (err) console.error('Error rendering QR:', err);
        }
      );
    }
  }, []);

  // Initialize YouTube Iframe
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      try {
        playerRef.current = new window.YT.Player(playerElementId, {
          videoId: currentSong?.videoId || '',
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
          },
          events: {
            onReady: (event) => {
              setIsReady(true);
              event.target.setVolume(volume);
              if (currentSong) {
                try {
                  event.target.playVideo();
                } catch {
                  setNeedUserGesture(true);
                }
              }
            },
            onStateChange: (event) => {
              if (window.YT && window.YT.PlayerState) {
                if (event.data === window.YT.PlayerState.ENDED) {
                  onSongEnd();
                } else if (event.data === window.YT.PlayerState.PLAYING) {
                  onPlayPauseToggle(true);
                  setHasError(null);
                  setNeedUserGesture(false);
                } else if (event.data === window.YT.PlayerState.PAUSED) {
                  onPlayPauseToggle(false);
                }
              }
            },
            onError: (event) => {
              console.warn('YouTube Player error:', event.data);
              setHasError('Video restringido. Pasando al siguiente...');
              setTimeout(() => onNextSong(), 2500);
            },
          },
        });
      } catch (err) {
        console.error('Error creating YT player:', err);
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  // Update video when currentSong changes
  useEffect(() => {
    if (isReady && playerRef.current && currentSong?.videoId) {
      setHasError(null);
      try {
        playerRef.current.loadVideoById(currentSong.videoId);
        playerRef.current.playVideo();
      } catch (e) {
        console.warn('Error loading video:', e);
      }
    }
  }, [currentSong?.videoId, isReady]);

  // Sync play/pause prop
  useEffect(() => {
    if (!isReady || !playerRef.current) return;
    try {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    } catch {
      // ignore
    }
  }, [isPlaying, isReady]);

  // Track time
  useEffect(() => {
    const timer = setInterval(() => {
      if (playerRef.current && isReady) {
        try {
          const cur = playerRef.current.getCurrentTime() || 0;
          const dur = playerRef.current.getDuration() || 0;
          setCurrentTime(cur);
          setDuration(dur);
        } catch {
          // ignore
        }
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isReady]);

  const handlePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      onPlayPauseToggle(false);
    } else {
      playerRef.current.playVideo();
      onPlayPauseToggle(true);
      setNeedUserGesture(false);
    }
  };

  const handleStartMusic = () => {
    if (playerRef.current) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume);
      playerRef.current.playVideo();
      onPlayPauseToggle(true);
      setNeedUserGesture(false);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (playerRef.current) {
      playerRef.current.setVolume(newVol);
      if (newVol > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
      playerRef.current.setVolume(volume || 80);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const formatSeconds = (sec: number) => {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleFullscreen = () => {
    if (containerRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        containerRef.current.requestFullscreen();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col w-full rounded-2xl overflow-hidden bg-gradient-to-b from-[#241710] via-[#1a0f0a] to-[#120804] border-2 border-[#8b6528]/50 shadow-[0_15px_40px_rgba(0,0,0,0.8)]"
    >
      {/* Moldura superior estilo Rockola Clásica Mexicana con latón pulido */}
      <div className="relative px-4 py-2 border-b border-[#8b6528]/40 bg-[#160d07] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Remaches de latón */}
          <span className="h-2 w-2 rounded-full bg-[#c99738] shadow-[0_0_4px_#c99738]" />
          <span className="font-['Cinzel'] text-xs font-bold tracking-[0.2em] text-[#d4af37] uppercase">
            Ventana Principal • Discos de Acetato
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-[#a8894f] uppercase tracking-wider hidden sm:inline">
            {isPlaying ? '• EN REPRODUCCIÓN •' : '• EN ESPERA •'}
          </span>
          <span className="h-2 w-2 rounded-full bg-[#c99738] shadow-[0_0_4px_#c99738]" />
        </div>
      </div>

      {/* EL VENTANAL DE LA ROCKOLA (EL VIDEO OCUPA TODO EL CENTRO) */}
      <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center border-y border-[#3a2315]">
        {/* Actual YouTube IFrame */}
        <div id={playerElementId} className="h-full w-full" />

        {/* QR TENUE EN LA ESQUINA DEL CRISTAL */}
        <div className="absolute top-3 right-3 z-20 flex flex-col items-center bg-black/40 backdrop-blur-md rounded-xl p-1.5 border border-[#8b6528]/30 opacity-60 hover:opacity-100 transition duration-300">
          <div className="rounded bg-[#f9f7f2] p-0.5 shadow">
            <canvas ref={qrCanvasRef} className="block" />
          </div>
          <span className="text-[9px] font-bold text-[#e6ca85] mt-1 tracking-wider uppercase">
            Pedir Canción
          </span>
        </div>

        {/* Botón para activar audio de la TV */}
        {needUserGesture && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/85 backdrop-blur-sm p-6 text-center">
            <button
              onClick={handleStartMusic}
              className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] px-6 py-4 text-base font-bold text-[#140b04] shadow-2xl hover:brightness-110 transition focus:ring-4 focus:ring-[#d4af37] outline-none"
            >
              <Play className="h-6 w-6 fill-current" />
              <span>Activar Sonido de la TV</span>
            </button>
          </div>
        )}

        {/* Estado en blanco (cuando la lista no tiene canciones) */}
        {!currentSong && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0d0704] p-6 text-center">
            <div className="h-16 w-16 rounded-full border-2 border-[#8b6528]/50 bg-[#1f120a] flex items-center justify-center text-[#d4af37] mb-3 shadow-inner">
              <Disc3 className="h-9 w-9 text-[#d4af37] animate-spin [animation-duration:12s]" />
            </div>
            <h3 className="font-['Cinzel'] text-lg font-bold text-[#e6ca85] tracking-wide">
              Rockola Rafael García
            </h3>
            <p className="mt-1 text-xs text-[#a89078] max-w-sm">
              La rockola está lista. Busca una canción para comenzar la música.
            </p>
            <button
              onClick={onOpenSearch}
              className="mt-4 flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] px-5 py-2.5 text-xs font-bold text-[#140b04] shadow-lg hover:brightness-110 transition focus:ring-2 focus:ring-[#d4af37] outline-none"
            >
              <Search className="h-4 w-4" />
              <span>Buscar canción</span>
            </button>
          </div>
        )}

        {/* Notificación de error */}
        {hasError && (
          <div className="absolute inset-x-4 top-4 z-20 flex items-center justify-between rounded-xl bg-[#26150c]/90 border border-[#8b6528]/60 px-4 py-2 text-xs text-[#f0d499] backdrop-blur-md">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-[#d4af37]" />
              <span>{hasError}</span>
            </div>
            <button
              onClick={onNextSong}
              className="rounded-lg bg-[#3a2213] px-3 py-1 font-bold text-white hover:bg-[#4d2f1a]"
            >
              Siguiente
            </button>
          </div>
        )}
      </div>

      {/* CONTROLES DE LA ROCKOLA (Madera noble, latón y botones clásicos) */}
      <div className="p-3.5 bg-[#140a05] border-t border-[#8b6528]/40">
        {/* Información del tema */}
        {currentSong && (
          <div className="mb-2.5 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-base md:text-lg font-bold text-[#f5ebd7] font-['Playfair_Display']">
                {currentSong.title}
              </h2>
              {currentSong.artist && (
                <p className="truncate text-xs text-[#b89c72]">{currentSong.artist}</p>
              )}
            </div>

            <div className="font-mono text-xs text-[#a8894f] shrink-0">
              {formatSeconds(currentTime)} / {formatSeconds(duration)}
            </div>
          </div>
        )}

        {/* Barra de progreso ámbar clásico */}
        <div className="relative h-1.5 w-full bg-[#2a170c] rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#8b6528] via-[#d4af37] to-[#e6ca85] transition-all duration-300"
            style={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
            }}
          />
        </div>

        {/* Botones de control físico y de pantalla */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePlayPause}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#140b04] font-bold shadow-md hover:brightness-110 transition focus:ring-2 focus:ring-[#d4af37] outline-none active:scale-95"
              title={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
            </button>

            <button
              onClick={onNextSong}
              className="flex h-11 px-4 items-center justify-center gap-1.5 rounded-xl border border-[#8b6528]/50 bg-[#26150c] text-[#e6ca85] hover:bg-[#3a2012] transition focus:ring-2 focus:ring-[#d4af37] outline-none text-xs font-bold active:scale-95"
              title="Siguiente canción"
            >
              <SkipForward className="h-4 w-4" />
              <span className="hidden sm:inline">Siguiente</span>
            </button>
          </div>

          {/* Control de volumen */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className="text-[#b89c72] hover:text-[#e6ca85] transition focus:ring-2 focus:ring-[#d4af37] rounded p-1 outline-none"
              title={isMuted ? 'Activar sonido' : 'Silenciar'}
            >
              {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="h-1.5 w-20 md:w-28 cursor-pointer accent-[#d4af37] bg-[#2a170c] rounded-lg"
            />
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {onOpenCast && (
              <button
                onClick={onOpenCast}
                className="flex items-center gap-1.5 rounded-xl border border-[#8b6528]/50 bg-[#26150c] px-3 py-2 text-xs font-bold text-[#e6ca85] hover:bg-[#3a2012] transition focus:ring-2 focus:ring-[#d4af37] outline-none"
                title="Transmitir a la TV"
              >
                <Cast className="h-4 w-4" />
                <span className="hidden sm:inline">Enviar a TV</span>
              </button>
            )}

            <button
              onClick={handleFullscreen}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#8b6528]/50 bg-[#26150c] text-[#b89c72] hover:text-white transition focus:ring-2 focus:ring-[#d4af37] outline-none"
              title="Pantalla completa"
            >
              <Maximize className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
