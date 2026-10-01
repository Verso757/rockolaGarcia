import React, { useState, useEffect, useRef } from 'react';
import { SongItem, RockolaRoomState } from '../types';
import {
  Search,
  Plus,
  Play,
  Pause,
  SkipForward,
  Cast,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  History,
} from 'lucide-react';
import { sounds } from '../utils/audioEffects';

interface GuestRequestViewProps {
  roomState: RockolaRoomState;
  onAddSong: (song: Partial<SongItem> & { isPriority?: boolean }) => Promise<boolean | void>;
  onMoveToTop: (songId: string) => void;
  onPlayPauseToggle: (playing: boolean) => void;
  onNextSong: () => void;
  onOpenCast?: () => void;
  onBackToTV?: () => void;
}

interface YouTubeSearchResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
}

export const GuestRequestView: React.FC<GuestRequestViewProps> = ({
  roomState,
  onAddSong,
  onPlayPauseToggle,
  onNextSong,
  onOpenCast,
  onBackToTV,
}) => {
  const [activeTab, setActiveTab] = useState<'search' | 'suggestions'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchingYt, setIsSearchingYt] = useState(false);
  const [ytSearchResults, setYtSearchResults] = useState<YouTubeSearchResult[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<YouTubeSearchResult[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load smart suggestions
  const fetchSmartSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (res.ok && data.recommendations) {
        setSmartSuggestions(data.recommendations);
      }
    } catch {
      // ignore
    } finally {
      setLoadingSuggestions(false);
    }
  };

  useEffect(() => {
    fetchSmartSuggestions();
  }, []);

  const performYouTubeSearch = async (term: string) => {
    if (!term.trim()) {
      setYtSearchResults([]);
      return;
    }

    setIsSearchingYt(true);
    try {
      const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(term.trim())}`);
      const data = await res.json();
      if (res.ok && data.results) {
        setYtSearchResults(data.results);
      }
    } catch {
      // ignore
    } finally {
      setIsSearchingYt(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.trim().length >= 3) {
      searchTimeoutRef.current = setTimeout(() => {
        performYouTubeSearch(searchQuery);
      }, 450);
    } else {
      setYtSearchResults([]);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performYouTubeSearch(searchQuery);
    }
  };

  const handleAddSongDirect = async (
    song: { videoId: string; title: string; artist: string; thumbnail?: string },
    isPriority: boolean = false
  ) => {
    sounds.playCoinInsert();
    try {
      await onAddSong({
        videoId: song.videoId,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail || `https://img.youtube.com/vi/${song.videoId}/hqdefault.jpg`,
        isPriority,
      });

      setNotification(
        isPriority
          ? `Pasó al 1° puesto: ${song.title}`
          : `Agregada a la lista: ${song.title}`
      );
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0704] text-[#f5ebd7] flex flex-col max-w-lg mx-auto pb-20 font-sans">
      {/* Header móvil estilo Rockola Clásica */}
      <header className="sticky top-0 z-30 border-b-2 border-[#8b6528]/50 bg-gradient-to-r from-[#1c1008] via-[#2a170c] to-[#1c1008] px-4 py-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {onBackToTV && (
              <button
                onClick={onBackToTV}
                className="p-1.5 rounded-lg text-[#a88a5b] hover:text-[#d4af37]"
                title="Volver a la pantalla principal"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h1 className="font-['Cinzel'] text-sm md:text-base font-bold text-[#d4af37] uppercase tracking-wider">
              {roomState.name}
            </h1>
          </div>

          {onOpenCast && (
            <button
              onClick={onOpenCast}
              className="flex items-center gap-1.5 rounded-lg border border-[#8b6528]/60 bg-[#26150c] px-3 py-1.5 text-xs font-bold text-[#e6ca85] hover:bg-[#3a2012] transition"
              title="Transmitir a la TV"
            >
              <Cast className="h-3.5 w-3.5" />
              <span>Enviar a TV</span>
            </button>
          )}
        </div>

        {/* Barra de control remoto de la TV */}
        {roomState.currentSong && (
          <div className="mt-2.5 flex items-center justify-between gap-3 rounded-xl bg-[#140b06] border border-[#734e1e]/60 p-2.5 text-xs">
            <div className="min-w-0 flex-1 truncate">
              <span className="text-[#a88a5b]">Sonando en TV: </span>
              <span className="font-bold text-[#f5ebd7] font-['Playfair_Display']">
                {roomState.currentSong.title}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onPlayPauseToggle(!roomState.isPlaying)}
                className="p-2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#140b04] font-bold"
              >
                {roomState.isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
              </button>
              <button
                onClick={onNextSong}
                className="p-2 rounded-lg bg-[#26150c] text-[#e6ca85] hover:bg-[#3a2012] border border-[#734e1e]/50"
              >
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Pestañas: Buscar / Sugerencias Inteligentes */}
        <div className="mt-3 grid grid-cols-2 gap-1 rounded-xl bg-[#120804] p-1 border border-[#8b6528]/40">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              activeTab === 'search'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#140b04] shadow'
                : 'text-[#a88a5b] hover:text-[#e6ca85]'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Buscar Rola</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('suggestions');
              if (smartSuggestions.length === 0) fetchSmartSuggestions();
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              activeTab === 'suggestions'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#140b04] shadow'
                : 'text-[#a88a5b] hover:text-[#e6ca85]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sugerencias para ti</span>
          </button>
        </div>
      </header>

      {/* Notificación flotante */}
      {notification && (
        <div className="fixed top-24 inset-x-4 z-40 flex items-center gap-2 rounded-xl bg-[#1f1007] border-2 border-[#d4af37] p-3 text-xs text-[#e6ca85] shadow-2xl animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-[#d4af37] shrink-0" />
          <span className="truncate font-bold">{notification}</span>
        </div>
      )}

      {/* CONTENIDO DE LA PESTAÑA */}
      <div className="p-4 space-y-4">
        {activeTab === 'search' ? (
          <>
            <form onSubmit={handleManualSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar canción o artista en YouTube..."
                className="w-full rounded-xl border border-[#8b6528]/60 bg-[#140b06] pl-4 pr-20 py-3 text-sm text-[#f5ebd7] placeholder-[#8c7459] focus:border-[#d4af37] focus:outline-none transition shadow-inner"
              />
              <button
                type="submit"
                disabled={isSearchingYt || !searchQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] px-3.5 py-1.5 text-xs font-bold text-[#140b04] disabled:opacity-40 hover:brightness-110 transition shadow"
              >
                {isSearchingYt ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Buscar'}
              </button>
            </form>

            <div className="space-y-2">
              {searchQuery.trim() && (
                <div className="text-xs text-[#a88a5b] px-1 font-mono">
                  Resultados ({ytSearchResults.length}):
                </div>
              )}

              {ytSearchResults.map((video) => (
                <div
                  key={video.videoId}
                  className="flex flex-col gap-2 rounded-xl border border-[#734e1e]/60 bg-[#160c07] p-2.5 shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="h-12 w-16 rounded object-cover bg-black shrink-0 border border-[#543818]"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-bold text-[#f5ebd7] font-['Playfair_Display']">
                        {video.title}
                      </h4>
                      <p className="truncate text-[11px] text-[#a88a5b]">{video.artist}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-[#331c0e] pt-2">
                    <button
                      onClick={() => handleAddSongDirect(video, false)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-[#8b6528]/50 bg-[#26150c] py-2 text-xs font-bold text-[#e6ca85] hover:bg-[#3a2012] transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Poner</span>
                    </button>
                    <button
                      onClick={() => handleAddSongDirect(video, true)}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] py-2 text-xs font-bold text-[#140b04] hover:brightness-110 transition shadow"
                    >
                      <span>Pasar al 1° puesto</span>
                    </button>
                  </div>
                </div>
              ))}

              {!searchQuery.trim() && (
                <div className="py-12 text-center text-xs text-[#8c7459]">
                  Escribe el nombre de cualquier canción para buscarla en YouTube.
                </div>
              )}
            </div>
          </>
        ) : (
          /* PESTAÑA DE SUGERENCIAS INTELIGENTES */
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-[#d4af37]">
                Sugerencias basadas en lo que has escuchado:
              </span>
              <button
                onClick={fetchSmartSuggestions}
                disabled={loadingSuggestions}
                className="text-[11px] text-[#a88a5b] hover:text-[#d4af37]"
              >
                {loadingSuggestions ? 'Buscando...' : 'Actualizar'}
              </button>
            </div>

            {loadingSuggestions ? (
              <div className="py-16 text-center text-xs text-[#d4af37]">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                <span>Buscando sugerencias musicales...</span>
              </div>
            ) : smartSuggestions.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8c7459]">
                Pon tu primera canción para que la rockola empiece a sugerir temas similares.
              </div>
            ) : (
              smartSuggestions.map((song) => (
                <div
                  key={song.videoId}
                  className="flex flex-col gap-2 rounded-xl border border-[#8b6528]/50 bg-[#160c07] p-2.5 shadow-md"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="h-12 w-16 rounded object-cover bg-black shrink-0 border border-[#543818]"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-bold text-[#f5ebd7] font-['Playfair_Display']">
                        {song.title}
                      </h4>
                      <p className="truncate text-[11px] text-[#a88a5b]">{song.artist}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-[#331c0e] pt-2">
                    <button
                      onClick={() => handleAddSongDirect(song, false)}
                      className="flex items-center justify-center gap-1.5 rounded-lg border border-[#8b6528]/50 bg-[#26150c] py-2 text-xs font-bold text-[#e6ca85] hover:bg-[#3a2012] transition"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Poner</span>
                    </button>
                    <button
                      onClick={() => handleAddSongDirect(song, true)}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] py-2 text-xs font-bold text-[#140b04] hover:brightness-110 transition shadow"
                    >
                      <span>Pasar al 1° puesto</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
