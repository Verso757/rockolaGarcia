import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share2, PlusSquare, X, Check } from 'lucide-react';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'header' | 'compact' | 'card';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  // If already running inside standalone PWA mode, don't show prompt
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const ok = await install();
      if (ok) {
        setInstallSuccess(true);
        setTimeout(() => setInstallSuccess(false), 3000);
      }
    } else if (isIOS) {
      setShowIOSGuide(true);
    } else {
      // General fallback guide
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={`flex items-center gap-1.5 rounded-xl border border-[#d4af37]/60 bg-gradient-to-r from-[#2c190e] via-[#3a2012] to-[#2c190e] px-3 py-1.5 text-xs font-bold text-[#ffd166] shadow hover:brightness-110 active:scale-95 transition ${className}`}
        title="Instalar Rockola en tu celular o pantalla"
      >
        {installSuccess ? (
          <>
            <Check className="h-4 w-4 text-emerald-400" />
            <span className="text-emerald-300">¡Instalada!</span>
          </>
        ) : (
          <>
            <Download className="h-3.5 w-3.5 text-[#d4af37] animate-bounce" />
            <span>Instalar App</span>
          </>
        )}
      </button>

      {/* Modal Guía para iOS Safari o navegadores que requieren añadir manualmente */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#22130b] via-[#1a0e07] to-[#120703] border-2 border-[#8b6528]/80 p-5 text-[#f5ebd7] shadow-2xl">
            <button
              onClick={() => setShowIOSGuide(false)}
              className="absolute top-4 right-4 p-1.5 text-[#a88a5b] hover:text-[#ffd166] rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-3 text-[#d4af37]">
              <div className="p-2 rounded-xl bg-[#2a170c] border border-[#8b6528]/60">
                <Download className="h-5 w-5 text-[#d4af37]" />
              </div>
              <div>
                <h3 className="font-['Cinzel'] text-sm font-bold tracking-wide uppercase">
                  Instalar en tu Pantalla de Inicio
                </h3>
                <p className="text-[11px] text-[#a88a5b]">
                  Úsala en pantalla completa sin barra de navegador
                </p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-[#d8be8d] bg-[#140b06] border border-[#734e1e]/60 p-3.5 rounded-xl">
              <div className="flex items-start gap-2">
                <div className="p-1 rounded bg-[#2b170d] text-[#ffd166] shrink-0 mt-0.5">
                  <Share2 className="h-3.5 w-3.5" />
                </div>
                <div>
                  <strong className="text-[#ffd166]">Paso 1:</strong> Toca el botón <strong>Compartir</strong> en la barra inferior de tu navegador (Safari / Chrome).
                </div>
              </div>

              <div className="flex items-start gap-2">
                <div className="p-1 rounded bg-[#2b170d] text-[#ffd166] shrink-0 mt-0.5">
                  <PlusSquare className="h-3.5 w-3.5" />
                </div>
                <div>
                  <strong className="text-[#ffd166]">Paso 2:</strong> Baja en la lista y selecciona <strong>"Agregar a Inicio"</strong> (o "Instalar aplicación").
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-[#d4af37] to-[#b8860b] py-2.5 text-xs font-bold text-[#140b04] hover:brightness-110 shadow"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
