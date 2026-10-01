import React from 'react';
import { Search, Cast, Monitor, Smartphone, Palette } from 'lucide-react';
import { sounds } from '../utils/audioEffects';
import { RockolaTheme } from '../types';
import { THEMES } from '../utils/themeStyles';
import { PWAInstallButton } from './PWAInstallButton';

interface RockolaHeaderProps {
  name: string;
  currentMode: 'tv' | 'guest';
  currentTheme: RockolaTheme;
  onChangeMode: (mode: 'tv' | 'guest') => void;
  onOpenSearch: () => void;
  onOpenCast: () => void;
  onOpenTheme: () => void;
  queueCount: number;
}

export const RockolaHeader: React.FC<RockolaHeaderProps> = ({
  name,
  currentMode,
  currentTheme,
  onChangeMode,
  onOpenSearch,
  onOpenCast,
  onOpenTheme,
  queueCount,
}) => {
  const theme = THEMES[currentTheme] || THEMES.wurlitzer;

  return (
    <header className="relative z-20 border-b-2 border-[#8b6528]/50 bg-gradient-to-r from-[#1c1008] via-[#2a170c] to-[#1c1008] px-4 py-2.5 shadow-xl transition-colors duration-500">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
        {/* Placa metálica clásica de la Rockola */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 rounded-lg border px-3.5 py-1.5 shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)] ${theme.badgeContainer}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" />
            <h1 className={`text-sm md:text-base font-bold tracking-[0.15em] uppercase ${theme.badgeTextColor} ${theme.fontHeader}`}>
              {name}
            </h1>
            <span className="h-1.5 w-1.5 rounded-full bg-[#d4af37]" />
          </div>

          <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-[#a88a5b] bg-[#120804] px-2 py-0.5 rounded-full border border-[#8b6528]/30">
            <span>{theme.icon}</span>
            <span>{theme.name}</span>
          </span>
        </div>

        {/* Acciones de la rockola */}
        <div className="flex items-center gap-2">
          {/* Botón Buscar Canción */}
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 rounded-xl border border-[#8b6528]/60 bg-[#26150c] px-3 py-1.5 text-xs font-bold text-[#e6ca85] hover:bg-[#3a2012] transition shadow-sm"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Buscar</span>
          </button>

          {/* Botón Cambiar Tema */}
          <button
            onClick={onOpenTheme}
            className="flex items-center gap-1.5 rounded-xl border border-[#8b6528]/60 bg-[#26150c] px-3 py-1.5 text-xs font-bold text-[#e6ca85] hover:bg-[#3a2012] transition shadow-sm"
            title="Cambiar diseño de la Rockola"
          >
            <Palette className="h-3.5 w-3.5 text-[#d4af37]" />
            <span className="hidden sm:inline">Tema</span>
          </button>

          {/* Botón Transmitir a la TV */}
          <button
            onClick={onOpenCast}
            className="flex items-center gap-1.5 rounded-xl border border-[#8b6528]/60 bg-[#26150c] px-3 py-1.5 text-xs font-bold text-[#e6ca85] hover:bg-[#3a2012] transition shadow-sm"
            title="Transmitir a la TV"
          >
            <Cast className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">TV</span>
          </button>

          {/* Botón Instalar PWA */}
          <PWAInstallButton className="hidden md:flex" />

          {/* Selector TV / Celular */}
          <div className="flex items-center rounded-xl border border-[#8b6528]/50 bg-[#120804] p-0.5 shadow-inner">
            <button
              onClick={() => {
                sounds.playButtonTick();
                onChangeMode('tv');
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                currentMode === 'tv'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#140b04] shadow'
                  : 'text-[#a88a5b] hover:text-[#e6ca85]'
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">TV</span>
            </button>

            <button
              onClick={() => {
                sounds.playButtonTick();
                onChangeMode('guest');
              }}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                currentMode === 'guest'
                  ? 'bg-gradient-to-r from-[#d4af37] to-[#b8860b] text-[#140b04] shadow'
                  : 'text-[#a88a5b] hover:text-[#e6ca85]'
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Celular</span>
              {queueCount > 0 && (
                <span className="ml-1 rounded-full bg-[#26150c] px-1.5 py-0.2 text-[10px] text-[#e6ca85] border border-[#8b6528]">
                  {queueCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
