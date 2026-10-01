import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, Sparkles, History, Music } from 'lucide-react';
import { PlayedSongRecord } from '../types';
import { sounds } from '../utils/audioEffects';
import { searchYouTubeUniversal } from '../utils/youtubeSearch';

interface SearchModalProps {
  history: PlayedSongRecord[];
  onClose: () => void;
  onAddSong: (song: { videoId: string; title: string; artist?: string; thumbnail?: string; isPriority?: boolean }) => void;
}

interface YouTubeSearchResult {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  duration?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({ history, onClose, onAddSong }) => {
  const [activeTab, setActiveTab] = useState<'search' | 'suggestions' | 'history'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<YouTubeSearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<YouTubeSearchResult[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (activeTab === 'search') {
      inputRef.current?.focus();
    }
  }, [activeTab]);

  // Fetch AI smart recommendations based on what has been played
  const fetchSmartSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const res = await fetch('/api/recommendations');
      const data = await res.json();
      if (res.ok && data.recommendations) {
        setSuggestions(data.recommendations);
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

  const performSearch = async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const data = await searchYouTubeUniversal(term);
      setResults(data);
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (searchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        performSearch(searchQuery);
      }, 400);
    } else {
      setResults([]);
    }
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [searchQuery]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  };

  const handleSelectSong = (
    song: { videoId: string; title: string; artist?: string; thumbnail?: string },
    isPriority: boolean
  ) => {
    sounds.playCoinInsert();
    onAddSong({
      videoId: song.videoId,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail,
      isPriority,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl rounded-2xl bg-gradient-to-b from-[#22130b] via-[#1a0e07] to-[#120703] border-2 border-[#8b6528]/70 p-5 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header estilo placa de rockola */}
        <div className="flex items-center justify-between pb-3 border-b border-[#8b6528]/40">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#d4af37]" />
            <h3 className="font-['Cinzel'] text-sm font-bold text-[#d4af37] tracking-wider uppercase">
              Seleccionador de Canciones
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a88a5b] hover:text-[#d4af37]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Pestañas: Buscar / Sugerencias Inteligentes / Memoria */}
        <div className="mt-3 grid grid-cols-3 gap-1 rounded-xl bg-[#120804] p-1 border border-[#8b6528]/40">
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              activeTab === 'search'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#140b04] shadow'
                : 'text-[#a88a5b] hover:text-[#e6ca85]'
            }`}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Buscar</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('suggestions');
              if (suggestions.length === 0) fetchSmartSuggestions();
            }}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              activeTab === 'suggestions'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#140b04] shadow'
                : 'text-[#a88a5b] hover:text-[#e6ca85]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Sugerencias IA</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#140b04] shadow'
                : 'text-[#a88a5b] hover:text-[#e6ca85]'
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>En Memoria ({history.length})</span>
          </button>
        </div>

        {/* TAB 1: BUSCADOR LIBRE */}
        {activeTab === 'search' && (
          <div className="mt-3 flex-1 flex flex-col min-h-0">
            <form onSubmit={handleSubmit} className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Escribe el cantante o canción..."
                className="w-full rounded-xl border border-[#8b6528]/60 bg-[#120804] px-4 py-3 text-sm text-[#f5ebd7] placeholder-[#8c7459] focus:border-[#d4af37] focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSearching || !searchQuery.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] px-3.5 py-1.5 text-xs font-bold text-[#140b04] disabled:opacity-30 hover:brightness-110"
              >
                {isSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Buscar'}
              </button>
            </form>

            <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {results.map((song) => (
                <div
                  key={song.videoId}
                  className="flex items-center justify-between gap-3 rounded-xl border border-[#734e1e]/50 bg-[#140b06] p-2.5 hover:border-[#d4af37]/60 transition"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="h-11 w-16 rounded object-cover bg-black shrink-0 border border-[#543818]"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-xs font-bold text-[#f5ebd7] font-['Playfair_Display']">
                        {song.title}
                      </h4>
                      <p className="truncate text-[11px] text-[#a88a5b]">{song.artist}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleSelectSong(song, false)}
                      className="rounded-lg border border-[#8b6528]/50 bg-[#26150c] px-3 py-1.5 text-xs font-bold text-[#e6ca85] hover:bg-[#3a2012] transition"
                    >
                      Poner
                    </button>
                    <button
                      onClick={() => handleSelectSong(song, true)}
                      className="rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] px-3 py-1.5 text-xs font-bold text-[#140b04] hover:brightness-110 transition shadow"
                    >
                      Pasar al 1° puesto
                    </button>
                  </div>
                </div>
              ))}

              {!searchQuery.trim() && (
                <div className="py-12 text-center text-xs text-[#a88a5b]">
                  Escribe cualquier canción de YouTube o toca en «Sugerencias IA».
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: SUGERENCIAS INTELIGENTES BASADAS EN MEMORIA */}
        {activeTab === 'suggestions' && (
          <div className="mt-3 flex-1 flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs text-[#e6ca85] font-semibold flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#d4af37]" />
                Recomendadas para Don Rafa (en base a lo último que sonó)
              </span>
              <button
                onClick={fetchSmartSuggestions}
                disabled={loadingSuggestions}
                className="text-[11px] text-[#a88a5b] hover:text-[#d4af37] font-bold"
              >
                {loadingSuggestions ? 'Analizando...' : 'Actualizar'}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {loadingSuggestions ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-xs text-[#d4af37]">
                  <Loader2 className="h-6 w-6 animate-spin mb-2" />
                  <span>La rockola está eligiendo canciones similares...</span>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#a88a5b]">
                  Pon tu primera canción para que la rockola empiece a sugerirte temas parecidos.
                </div>
              ) : (
                suggestions.map((song) => (
                  <div
                    key={song.videoId}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#8b6528]/50 bg-[#160c07] p-2.5 hover:border-[#d4af37] transition"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="h-11 w-16 rounded object-cover bg-black shrink-0 border border-[#543818]"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-bold text-[#f5ebd7] font-['Playfair_Display']">
                          {song.title}
                        </h4>
                        <p className="truncate text-[11px] text-[#a88a5b]">{song.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSelectSong(song, false)}
                        className="rounded-lg border border-[#8b6528]/50 bg-[#26150c] px-3 py-1.5 text-xs font-bold text-[#e6ca85] hover:bg-[#3a2012] transition"
                      >
                        Poner
                      </button>
                      <button
                        onClick={() => handleSelectSong(song, true)}
                        className="rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] px-3 py-1.5 text-xs font-bold text-[#140b04] hover:brightness-110 transition shadow"
                      >
                        Pasar al 1° puesto
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* TAB 3: CANCIONES EN MEMORIA HISTÓRICA */}
        {activeTab === 'history' && (
          <div className="mt-3 flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {history.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#a88a5b]">
                  Aún no hay canciones en memoria. A medida que suenen, se guardarán aquí para volverlas a poner con 1 toque.
                </div>
              ) : (
                history.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-[#734e1e]/50 bg-[#160c07] p-2.5"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <img
                        src={song.thumbnail}
                        alt={song.title}
                        className="h-10 w-14 rounded object-cover bg-black shrink-0 border border-[#543818]"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-xs font-bold text-[#f5ebd7] font-['Playfair_Display']">
                          {song.title}
                        </h4>
                        <p className="truncate text-[11px] text-[#a88a5b]">
                          {song.artist} • Tocada {song.playCount} {song.playCount === 1 ? 'vez' : 'veces'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleSelectSong(song, false)}
                        className="rounded-lg border border-[#8b6528]/50 bg-[#26150c] px-3 py-1.5 text-xs font-bold text-[#e6ca85] hover:bg-[#3a2012]"
                      >
                        Repetir
                      </button>
                      <button
                        onClick={() => handleSelectSong(song, true)}
                        className="rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] px-3 py-1.5 text-xs font-bold text-[#140b04]"
                      >
                        1° puesto
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
