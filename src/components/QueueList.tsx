import React from 'react';
import { SongItem, PlayedSongRecord, RockolaTheme } from '../types';
import {
  ListMusic,
  Trash2,
  Play,
  ArrowUp,
  ArrowDown,
  Search,
} from 'lucide-react';
import { sounds } from '../utils/audioEffects';
import { THEMES } from '../utils/themeStyles';

interface QueueListProps {
  queue: SongItem[];
  history: PlayedSongRecord[];
  currentSong: SongItem | null;
  currentTheme?: RockolaTheme;
  onRemove: (songId: string) => void;
  onMoveToTop: (songId: string) => void;
  onMoveUp: (songId: string) => void;
  onMoveDown: (songId: string) => void;
  onClearQueue: () => void;
  onPlayNow?: (song: SongItem) => void;
  onOpenSearch: () => void;
}

export const QueueList: React.FC<QueueListProps> = ({
  queue,
  currentTheme = 'wurlitzer',
  onRemove,
  onMoveToTop,
  onMoveUp,
  onMoveDown,
  onClearQueue,
  onPlayNow,
  onOpenSearch,
}) => {
  const theme = THEMES[currentTheme] || THEMES.wurlitzer;
  // Convert index to jukebox selection code (A-1, A-2, B-1...)
  const getJukeboxCode = (idx: number) => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    const letter = letters[Math.floor(idx / 5)] || 'Z';
    const num = (idx % 5) + 1;
    return `${letter}-${num}`;
  };

  return (
    <div className={`flex flex-col h-full rounded-2xl border-2 p-3.5 shadow-xl transition-all duration-500 ${theme.cabinetBg} ${theme.borderColor}`}>
      {/* Tarjetero Header */}
      <div className="flex items-center justify-between border-b border-[#8b6528]/40 pb-2.5 mb-2.5">
        <div className="flex items-center gap-2">
          <ListMusic className="h-4 w-4 text-[#d4af37]" />
          <h3 className={`text-xs font-bold text-[#e6ca85] tracking-wider uppercase ${theme.fontHeader}`}>
            Tarjetero de Canciones ({queue.length})
          </h3>
        </div>

        {queue.length > 0 && (
          <button
            onClick={onClearQueue}
            className="text-[11px] text-[#a88a5b] hover:text-rose-400 transition"
          >
            Limpiar lista
          </button>
        )}
      </div>

      {/* Lista de tiras de rockola */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-2 text-center">
            <span className="text-2xl mb-1">🎶</span>
            <p className="font-['Playfair_Display'] text-sm text-[#e6ca85]">
              Tarjetero en blanco
            </p>
            <p className="text-[11px] text-[#8c7459] mt-1">
              No hay canciones en la lista.
            </p>
            <button
              onClick={onOpenSearch}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-[#8b6528]/50 bg-[#2a170c] px-3 py-1.5 text-xs font-bold text-[#e6ca85] hover:bg-[#3d2212] transition"
            >
              <Search className="h-3.5 w-3.5" />
              <span>Buscar canción</span>
            </button>
          </div>
        ) : (
          queue.map((song, idx) => {
            const isFirst = idx === 0;
            const isLast = idx === queue.length - 1;
            const code = getJukeboxCode(idx);

            return (
              <div
                key={song.id}
                className="group flex flex-col gap-1.5 rounded-xl border border-[#734e1e]/60 bg-[#160c07] p-2 hover:border-[#d4af37]/60 transition shadow-sm"
              >
                <div className="flex items-center gap-2.5">
                  {/* Código de Rockola tradicional A-1, B-2... */}
                  <span className="font-mono text-xs font-black text-[#140b04] bg-[#d4af37] px-1.5 py-0.5 rounded shadow-inner shrink-0">
                    {code}
                  </span>

                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="h-10 w-14 rounded object-cover bg-black shrink-0 border border-[#543818]"
                  />

                  <div className="min-w-0 flex-1">
                    <h5 className="truncate text-xs font-bold text-[#f5ebd7] font-['Playfair_Display']">
                      {song.title}
                    </h5>
                    <p className="truncate text-[11px] text-[#a88a5b]">{song.artist}</p>
                  </div>

                  {/* Reproducir ya & Eliminar */}
                  <div className="flex items-center gap-1 shrink-0">
                    {onPlayNow && (
                      <button
                        onClick={() => {
                          sounds.playNeedleDrop();
                          onPlayNow(song);
                        }}
                        className="p-1.5 rounded text-[#d4af37] hover:bg-[#2b170c] transition"
                        title="Tocar ahora"
                      >
                        <Play className="h-3.5 w-3.5 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => onRemove(song.id)}
                      className="p-1.5 rounded text-[#8c7459] hover:text-rose-400 hover:bg-[#2b170c] transition"
                      title="Quitar"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Acciones de orden */}
                <div className="flex items-center justify-between border-t border-[#331c0e] pt-1 text-[11px]">
                  {!isFirst ? (
                    <button
                      onClick={() => onMoveToTop(song.id)}
                      className="text-[#d4af37] hover:underline font-bold"
                    >
                      Pasar al 1° puesto
                    </button>
                  ) : (
                    <span className="text-[#a88a5b] font-mono text-[10px]">
                      ▶ Siguiente en sonar
                    </span>
                  )}

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onMoveUp(song.id)}
                      disabled={isFirst}
                      className="p-1 text-[#a88a5b] hover:text-white disabled:opacity-20"
                      title="Subir"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => onMoveDown(song.id)}
                      disabled={isLast}
                      className="p-1 text-[#a88a5b] hover:text-white disabled:opacity-20"
                      title="Bajar"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
