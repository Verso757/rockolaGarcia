import React from 'react';
import { X, Check, Palette } from 'lucide-react';
import { RockolaTheme } from '../types';
import { THEMES } from '../utils/themeStyles';
import { sounds } from '../utils/audioEffects';

interface ThemeModalProps {
  currentTheme: RockolaTheme;
  onClose: () => void;
  onSelectTheme: (theme: RockolaTheme) => void;
}

export const ThemeModal: React.FC<ThemeModalProps> = ({
  currentTheme,
  onClose,
  onSelectTheme,
}) => {
  const themeList = Object.values(THEMES);

  const handleSelect = (themeId: RockolaTheme) => {
    sounds.playButtonTick();
    onSelectTheme(themeId);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg rounded-2xl bg-[#140b07] border-2 border-[#8b6528]/70 p-5 shadow-2xl text-[#f5ebd7] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#8b6528]/40">
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-[#d4af37]" />
            <h3 className="font-['Cinzel'] text-sm md:text-base font-bold text-[#d4af37] tracking-wider uppercase">
              Cambiar Estilo de la Rockola
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#a88a5b] hover:text-[#d4af37]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="text-xs text-[#a88a5b] mt-2 mb-3">
          Elige el diseño visual. Cambiará al instante tanto en tu celular como en la pantalla de la TV sin interrumpir la música:
        </p>

        {/* Lista de temas */}
        <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 scrollbar-thin">
          {themeList.map((t) => {
            const isSelected = currentTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => handleSelect(t.id)}
                className={`w-full text-left rounded-xl p-3.5 border-2 transition flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'border-[#d4af37] bg-[#2a170c] shadow-md ring-1 ring-[#d4af37]'
                    : 'border-[#4a2e18] bg-[#1a0f0a] hover:border-[#8b6528] hover:bg-[#22130c]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-0.5">{t.icon}</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-xs md:text-sm text-[#f5ebd7]">
                        {t.name}
                      </h4>
                      {isSelected && (
                        <span className="rounded-full bg-[#d4af37] px-2 py-0.5 text-[9px] font-black text-[#140b04]">
                          ACTIVO EN TV
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-[#e6ca85] mt-0.5 font-medium">
                      {t.subtitle}
                    </p>
                    <p className="text-[11px] text-[#8c7459] mt-1 leading-snug">
                      {t.description}
                    </p>
                  </div>
                </div>

                <div className="shrink-0 mt-1">
                  {isSelected ? (
                    <div className="h-6 w-6 rounded-full bg-[#d4af37] text-[#140b04] flex items-center justify-center shadow">
                      <Check className="h-4 w-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="h-6 w-6 rounded-full border border-[#734e1e] bg-[#120804]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] py-2.5 text-xs font-bold text-[#140b04] hover:brightness-110 transition shadow"
        >
          Listo
        </button>
      </div>
    </div>
  );
};
