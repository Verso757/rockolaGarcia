import React from 'react';
import { X, Cast, Tv, Check } from 'lucide-react';

interface CastModalProps {
  onClose: () => void;
  tvUrl: string;
}

export const CastModal: React.FC<CastModalProps> = ({ onClose, tvUrl }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tvUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md rounded-2xl bg-gradient-to-b from-[#22130b] via-[#1a0e07] to-[#120703] border-2 border-[#8b6528]/70 p-6 text-[#f5ebd7] shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#a88a5b] hover:text-[#d4af37] rounded-lg"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2.5 text-[#d4af37] mb-2">
          <div className="p-2 rounded-xl bg-[#26150c] border border-[#8b6528]/50">
            <Tv className="h-5 w-5 text-[#d4af37]" />
          </div>
          <h3 className="font-['Cinzel'] text-base font-bold tracking-wide uppercase">
            Ver en la Pantalla de la TV
          </h3>
        </div>

        <p className="text-xs text-[#b89c72] mt-1">
          Disfruta de la Rockola en tu Smart TV mientras pones canciones desde el celular:
        </p>

        <div className="mt-5 space-y-3">
          {/* Opción 1: Navegador de la Smart TV */}
          <div className="rounded-xl border border-[#734e1e]/60 bg-[#160c07] p-3.5">
            <div className="flex items-center gap-2 font-bold text-xs text-[#e6ca85] mb-1">
              <Tv className="h-4 w-4" />
              <span>Opción 1: En el navegador de tu Smart TV</span>
            </div>
            <p className="text-xs text-[#a88a5b]">
              Abre el navegador de tu TV (Samsung, LG, Android TV o Roku) y pon este enlace:
            </p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={tvUrl}
                className="flex-1 bg-[#120804] border border-[#734e1e] rounded-lg px-2.5 py-1.5 text-xs text-[#e6ca85] select-all font-mono"
              />
              <button
                onClick={handleCopy}
                className="rounded-lg bg-gradient-to-r from-[#d4af37] to-[#b8860b] px-3 py-1.5 text-xs font-bold text-[#140b04] hover:brightness-110"
              >
                {copied ? <Check className="h-4 w-4" /> : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Opción 2: Duplicar pantalla */}
          <div className="rounded-xl border border-[#734e1e]/60 bg-[#160c07] p-3.5">
            <div className="flex items-center gap-2 font-bold text-xs text-[#e6ca85] mb-1">
              <Cast className="h-4 w-4" />
              <span>Opción 2: Duplicar pantalla desde el celular</span>
            </div>
            <p className="text-xs text-[#a88a5b]">
              Desliza el panel de tu celular y toca <strong>"Transmitir pantalla"</strong> o <strong>"AirPlay"</strong> hacia tu Smart TV.
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] py-2.5 text-xs font-bold text-[#140b04] hover:brightness-110 transition shadow"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
};
