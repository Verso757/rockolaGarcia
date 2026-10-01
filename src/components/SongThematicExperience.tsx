import React, { useState, useEffect } from 'react';
import { SongItem } from '../types';
import { Sparkles, Disc3 } from 'lucide-react';

interface SongThematicExperienceProps {
  currentSong: SongItem | null;
  isPlaying: boolean;
}

interface SongTrivia {
  videoId: string;
  year: string;
  album: string;
  genre: string;
  curiosity: string;
  eraStyle: 'vinyl' | 'cassette' | 'modern' | 'party';
}

export const SongThematicExperience: React.FC<SongThematicExperienceProps> = ({
  currentSong,
  isPlaying,
}) => {
  const [trivia, setTrivia] = useState<SongTrivia | null>(null);
  const [visualMode, setVisualMode] = useState<'auto' | 'vinyl' | 'cassette' | 'off'>('auto');

  // Fetch trivia when current song changes to auto-tune vinyl/cassette style
  useEffect(() => {
    if (!currentSong) {
      setTrivia(null);
      return;
    }

    let isMounted = true;
    const fetchTrivia = async () => {
      try {
        const query = new URLSearchParams({
          title: currentSong.title,
          artist: currentSong.artist || '',
          videoId: currentSong.videoId,
        });
        const res = await fetch(`/api/song-trivia?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.trivia) {
            setTrivia(data.trivia);
          }
        }
      } catch {
        // ignore
      }
    };

    fetchTrivia();

    return () => {
      isMounted = false;
    };
  }, [currentSong?.videoId]);

  if (!currentSong) return null;

  // Determine effective visual style (Vinyl vs Cassette vs Modern)
  const effectiveStyle: 'vinyl' | 'cassette' | 'party' =
    visualMode === 'vinyl'
      ? 'vinyl'
      : visualMode === 'cassette'
      ? 'cassette'
      : visualMode === 'off'
      ? 'party'
      : trivia?.eraStyle === 'cassette'
      ? 'cassette'
      : 'vinyl';

  return (
    <div className="relative w-full">
      {/* 1. SECCIÓN DE EFECTO VISUAL TEMÁTICO (VINILO O CASSETTE GIRATORIO) */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5 bg-gradient-to-r from-[#180e08]/90 via-[#24140b]/90 to-[#180e08]/90 border-t border-[#8b6528]/40 rounded-b-xl shadow-inner">
        {/* Lado izquierdo: Animación dinámica del formato musical */}
        <div className="flex items-center gap-3.5 min-w-0">
          {effectiveStyle === 'vinyl' && (
            /* VINILO GIRATORIO 45 RPM */
            <div className="relative flex items-center gap-3 shrink-0">
              <div
                className={`relative h-12 w-12 rounded-full bg-neutral-950 border-2 border-[#333] shadow-[0_4px_10px_rgba(0,0,0,0.8)] flex items-center justify-center ${
                  isPlaying ? 'animate-spin [animation-duration:3.2s]' : ''
                }`}
                style={{
                  backgroundImage:
                    'radial-gradient(circle, #1a1a1a 18%, #111 20%, #222 24%, #111 32%, #222 40%, #111 50%, #222 65%, #0d0d0d 80%)',
                }}
              >
                {/* Ranuras de brillo de acetato */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-white/10 via-transparent to-white/10 pointer-events-none" />

                {/* Etiqueta central con foto del disco */}
                <div className="h-5 w-5 rounded-full overflow-hidden border border-[#d4af37] bg-[#1a0f07] flex items-center justify-center">
                  <img
                    src={currentSong.thumbnail}
                    alt={currentSong.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                {/* Agujero central */}
                <div className="absolute h-1.5 w-1.5 rounded-full bg-black border border-[#555]" />
              </div>

              <div className="hidden sm:flex flex-col">
                <span className="text-[11px] font-bold text-[#e6ca85] flex items-center gap-1">
                  <span>💿</span>
                  <span>Acetato 45 RPM</span>
                </span>
                <span className="text-[10px] text-[#a88a5b]">
                  {trivia?.year ? `Época: ${trivia.year}` : 'Sonido Analógico'}
                </span>
              </div>
            </div>
          )}

          {effectiveStyle === 'cassette' && (
            /* CASSETTE RETRO 80S */
            <div className="relative flex items-center gap-3 shrink-0">
              <div className="relative h-10 w-16 rounded-md bg-[#2b1f18] border border-[#d4af37]/60 shadow-md p-1 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[8px] font-mono text-[#d4af37] font-bold">SIDE A</span>
                  <span className="text-[7px] text-[#8c7459] font-mono">TYPE I</span>
                </div>

                {/* Ventana de carretes de cinta */}
                <div className="flex items-center justify-around bg-[#120804] rounded px-1 py-0.5 border border-[#442b1a]">
                  {/* Carrete izquierdo */}
                  <div
                    className={`h-4 w-4 rounded-full border border-white/40 flex items-center justify-center text-[7px] text-white/70 ${
                      isPlaying ? 'animate-spin [animation-duration:2.5s]' : ''
                    }`}
                  >
                    ⚙
                  </div>
                  <div className="h-1 w-4 bg-[#7a4825] rounded-full" />
                  {/* Carrete derecho */}
                  <div
                    className={`h-4 w-4 rounded-full border border-white/40 flex items-center justify-center text-[7px] text-white/70 ${
                      isPlaying ? 'animate-spin [animation-duration:2.5s]' : ''
                    }`}
                  >
                    ⚙
                  </div>
                </div>

                <div className="text-[7px] text-center text-[#e6ca85] truncate font-mono">
                  {currentSong.title}
                </div>
              </div>

              <div className="hidden sm:flex flex-col">
                <span className="text-[11px] font-bold text-[#e6ca85] flex items-center gap-1">
                  <span>📼</span>
                  <span>Cinta Magnética 80s</span>
                </span>
                <span className="text-[10px] text-[#a88a5b]">
                  {trivia?.year ? `Lanzamiento: ${trivia.year}` : 'Éxito Retro'}
                </span>
              </div>
            </div>
          )}

          {effectiveStyle === 'party' && (
            /* MODO FIESTA / CHISPAS */
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#ffd166] animate-pulse" />
              <div className="hidden sm:flex flex-col">
                <span className="text-[11px] font-bold text-[#ffd166]">Modo Escenario</span>
                <span className="text-[10px] text-[#a88a5b]">Alta fidelidad de fiesta</span>
              </div>
            </div>
          )}
        </div>

        {/* Lado derecho: Selector de formato y botón de trivia */}
        <div className="flex items-center gap-2">
          {/* Selector de Efecto (Vinilo / Cassette) */}
          <div className="flex items-center rounded-lg bg-[#140b06] border border-[#734e1e]/60 p-0.5 text-[10px]">
            <button
              onClick={() => setVisualMode('vinyl')}
              className={`px-2 py-0.5 rounded font-bold transition ${
                effectiveStyle === 'vinyl'
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-[#a88a5b] hover:text-[#e6ca85]'
              }`}
              title="Efecto Disco de Vinilo"
            >
              Vinilo
            </button>
            <button
              onClick={() => setVisualMode('cassette')}
              className={`px-2 py-0.5 rounded font-bold transition ${
                effectiveStyle === 'cassette'
                  ? 'bg-[#d4af37] text-black shadow'
                  : 'text-[#a88a5b] hover:text-[#e6ca85]'
              }`}
              title="Efecto Cassette Retro"
            >
              Cassette
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
