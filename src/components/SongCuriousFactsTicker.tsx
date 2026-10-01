import React, { useState, useEffect, useRef } from 'react';
import { SongItem } from '../types';
import { Sparkles, Radio, ChevronLeft, ChevronRight, Pause, Play, Music, Flame } from 'lucide-react';

interface SongCuriousFactsTickerProps {
  currentSong: SongItem | null;
  isPlaying: boolean;
}

interface FactItem {
  id: string;
  category: string;
  badgeColor: string;
  icon: string;
  headline: string;
  fact: string;
}

const GENERAL_ROCKOLA_FACTS: FactItem[] = [
  {
    id: 'gen_1',
    category: 'TRADICIÓN FAMILIAR',
    badgeColor: 'border-amber-500/50 bg-amber-950/60 text-amber-300',
    icon: '👑',
    headline: 'La Regla de Oro de Don Rafa',
    fact: 'En la casa de Don Rafa García, canción pedida es canción que se canta con el corazón y una copa en la mano.',
  },
  {
    id: 'gen_2',
    category: 'HISTORIA DE LA MÚSICA',
    badgeColor: 'border-red-500/50 bg-red-950/60 text-red-300',
    icon: '🎺',
    headline: 'El Ídolo Vicente Fernández',
    fact: 'Don Vicente Fernández grabó más de 100 álbumes y popularizó la famosa frase: "Mientras ustedes no dejen de aplaudir, su Chente no deja de cantar".',
  },
  {
    id: 'gen_3',
    category: 'ÉPOCA DE ORO',
    badgeColor: 'border-purple-500/50 bg-purple-950/60 text-purple-300',
    icon: '⭐',
    headline: 'El Divo Juan Gabriel',
    fact: 'Juan Gabriel compuso más de 1,800 canciones a lo largo de su carrera y llenó el Palacio de Bellas Artes rompiendo todos los esquemas.',
  },
  {
    id: 'gen_4',
    category: 'ROCKOLAS CLÁSICAS',
    badgeColor: 'border-emerald-500/50 bg-emerald-950/60 text-emerald-300',
    icon: '📻',
    headline: 'El Origen del Jukebox',
    fact: 'Las primeras rockolas automáticas funcionaban con monedas de níquel y acetatos de 78 RPM en las tabernas y salones de baile de los años 30.',
  },
  {
    id: 'gen_5',
    category: 'RITMO & SABOR',
    badgeColor: 'border-blue-500/50 bg-blue-950/60 text-blue-300',
    icon: '🪗',
    headline: 'Los Ángeles Azules',
    fact: 'Nacieron en Iztapalapa en 1976 y lograron llevar la cumbia sonidera a los escenarios más prestigiosos del mundo con orquestas sinfónicas.',
  },
];

export const SongCuriousFactsTicker: React.FC<SongCuriousFactsTickerProps> = ({
  currentSong,
  isPlaying,
}) => {
  const [facts, setFacts] = useState<FactItem[]>(GENERAL_ROCKOLA_FACTS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch song trivia when currentSong changes
  useEffect(() => {
    if (!currentSong) {
      setFacts(GENERAL_ROCKOLA_FACTS);
      setCurrentIndex(0);
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
            const t = data.trivia;
            const newFacts: FactItem[] = [];

            // 1. Curiosity principal
            if (t.curiosity) {
              newFacts.push({
                id: 'curiosity',
                category: 'DATO CURIOSO',
                badgeColor: 'border-amber-400/60 bg-amber-950/80 text-amber-300',
                icon: '💡',
                headline: `Sobre "${currentSong.title}"`,
                fact: t.curiosity,
              });
            }

            // 2. Historia y Año
            if (t.year) {
              newFacts.push({
                id: 'history',
                category: 'HISTORIA & ÉPOCA',
                badgeColor: 'border-yellow-500/60 bg-yellow-950/70 text-yellow-300',
                icon: '📅',
                headline: `Lanzamiento • ${t.year}`,
                fact: `Esta obra pertenece al álbum "${t.album || 'Producción de Estudio'}" y se consagró como un clásico inmortal del género ${t.genre || 'musical'}.`,
              });
            }

            // 3. Estilo musical
            if (t.genre) {
              newFacts.push({
                id: 'genre',
                category: 'GÉNERO & ESTILO',
                badgeColor: 'border-purple-500/60 bg-purple-950/70 text-purple-300',
                icon: '🎵',
                headline: t.genre,
                fact: `Sonido característico ${t.eraStyle === 'vinyl' ? 'de la Época de Oro del Acetato (Vinilo)' : t.eraStyle === 'cassette' ? 'ochentero y noventero en cinta Cassette' : 'de fiesta y parranda familiar'} que ha marcado a varias generaciones.`,
              });
            }

            // 4. Dato del Artista o Don Rafa
            newFacts.push({
              id: 'artist',
              category: 'EN LA ROCKOLA',
              badgeColor: 'border-red-500/60 bg-red-950/70 text-red-300',
              icon: '👑',
              headline: currentSong.artist || 'Gran Clásico',
              fact: `Interpretado por ${currentSong.artist || 'artistas legendarios'}. Infaltable en la rockola de Rafael García para cantar a coro en familia.`,
            });

            if (newFacts.length > 0) {
              setFacts(newFacts);
              setCurrentIndex(0);
              setProgress(0);
            }
          }
        }
      } catch {
        // Keep existing or general facts
      }
    };

    fetchTrivia();

    return () => {
      isMounted = false;
    };
  }, [currentSong?.videoId, currentSong?.title, currentSong?.artist]);

  // Automated running ticker: cycles every 7 seconds
  const DURATION_MS = 7000;
  const STEP_MS = 100;

  useEffect(() => {
    if (isPaused || facts.length <= 1) return;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + (STEP_MS / DURATION_MS) * 100;
        if (next >= 100) {
          setCurrentIndex((idx) => (idx + 1) % facts.length);
          return 0;
        }
        return next;
      });
    }, STEP_MS);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, facts.length, currentIndex]);

  const handleNext = () => {
    setProgress(0);
    setCurrentIndex((idx) => (idx + 1) % facts.length);
  };

  const handlePrev = () => {
    setProgress(0);
    setCurrentIndex((idx) => (idx - 1 + facts.length) % facts.length);
  };

  const currentFact = facts[currentIndex] || facts[0];

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className="relative overflow-hidden rounded-xl border border-[#8b6528]/50 bg-gradient-to-b from-[#1c1008] via-[#140b05] to-[#0c0603] p-3 text-amber-50 shadow-md transition hover:border-[#d4af37]/80"
    >
      {/* Header con indicador de datos automáticos */}
      <div className="flex items-center justify-between gap-2 border-b border-[#4a2e18]/60 pb-2 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-['Cinzel'] text-[10px] font-bold uppercase tracking-wider text-[#d4af37]">
            Datos Curiosos en Vivo
          </span>
        </div>

        {/* Controles de navegación manual y pausa */}
        <div className="flex items-center gap-1 text-[10px] text-[#a88a5b]">
          <span className="text-[10px] font-mono mr-1">
            {currentIndex + 1}/{facts.length}
          </span>
          <button
            onClick={handlePrev}
            className="rounded p-0.5 hover:bg-[#2e190d] hover:text-[#ffd166] transition"
            title="Dato anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="rounded p-0.5 hover:bg-[#2e190d] hover:text-[#ffd166] transition"
            title={isPaused ? 'Reanudar ciclo automático' : 'Pausar'}
          >
            {isPaused ? <Play className="h-3 w-3 text-amber-400" /> : <Pause className="h-3 w-3" />}
          </button>
          <button
            onClick={handleNext}
            className="rounded p-0.5 hover:bg-[#2e190d] hover:text-[#ffd166] transition"
            title="Siguiente dato"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Contenido del Dato Curioso Activo */}
      <div className="min-h-[72px] flex flex-col justify-center">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-base select-none">{currentFact.icon}</span>
          <span
            className={`inline-block rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase border ${currentFact.badgeColor}`}
          >
            {currentFact.category}
          </span>
          <span className="text-[11px] font-semibold text-[#f3e5cb] truncate">
            {currentFact.headline}
          </span>
        </div>

        <p className="text-xs text-[#eedec3] font-serif leading-snug italic line-clamp-3 pl-1 border-l-2 border-[#d4af37]/70">
          "{currentFact.fact}"
        </p>
      </div>

      {/* Barra de progreso de cambio automático */}
      <div className="mt-2.5 flex items-center justify-between gap-2 pt-1 border-t border-[#331c0e]/60">
        <div className="flex items-center gap-1">
          {facts.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setProgress(0);
                setCurrentIndex(i);
              }}
              className={`h-1.5 rounded-full transition-all ${
                i === currentIndex ? 'w-4 bg-[#d4af37]' : 'w-1.5 bg-[#4a2e18] hover:bg-[#8b6528]'
              }`}
              title={`Ir al dato ${i + 1}`}
            />
          ))}
        </div>

        <span className="text-[9px] text-[#8c7459] font-medium">
          {isPaused ? 'Pausado (pasa el cursor)' : 'Avanzando automáticamente'}
        </span>
      </div>

      {/* Barra de progreso continua */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#241309]">
        <div
          className="h-full bg-gradient-to-r from-[#8b6528] to-[#d4af37] transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
