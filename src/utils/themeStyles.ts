import { RockolaTheme } from '../types';

export interface ThemeConfig {
  id: RockolaTheme;
  name: string;
  subtitle: string;
  icon: string;
  pageBg: string;
  cabinetBg: string;
  borderColor: string;
  badgeContainer: string;
  badgeTextColor: string;
  accentButton: string;
  secondaryButton: string;
  accentColor: string;
  fontDisplay: string;
  fontHeader: string;
  tagColor: string;
  description: string;
}

export const THEMES: Record<RockolaTheme, ThemeConfig> = {
  wurlitzer: {
    id: 'wurlitzer',
    name: 'Rockola Clásica Diner 50s',
    subtitle: 'Cromo pulido, tubos ámbar y espíritu Rock & Roll de los 50',
    icon: '🎶',
    pageBg: 'bg-[#0f0b17]',
    cabinetBg: 'bg-gradient-to-b from-[#241336] via-[#170c24] to-[#0c0614]',
    borderColor: 'border-[#ff007f]/50 shadow-[0_0_35px_rgba(255,0,127,0.25)]',
    badgeContainer: 'border-[#ffb703]/70 bg-gradient-to-r from-[#330f2b] via-[#1a0818] to-[#330f2b]',
    badgeTextColor: 'text-[#ffd166]',
    accentButton: 'bg-gradient-to-r from-[#ff007f] to-[#ffb703] text-black font-extrabold shadow-lg',
    secondaryButton: 'border-[#ff007f]/40 bg-[#250d24] text-[#ffd166] hover:bg-[#381436]',
    accentColor: '#ffb703',
    fontDisplay: "font-['Outfit']",
    fontHeader: "font-['Outfit']",
    tagColor: 'bg-[#ffb703] text-black',
    description: 'La mítica jukebox americana de los 50s con molduras cromadas y tubos de luz cálida.',
  },
  synthwave: {
    id: 'synthwave',
    name: 'Retro 80s Synth & Neón',
    subtitle: 'Magenta eléctrico, azul cian y sintetizadores de época',
    icon: '⚡',
    pageBg: 'bg-[#090714]',
    cabinetBg: 'bg-gradient-to-b from-[#180f33] via-[#0d091e] to-[#06040d]',
    borderColor: 'border-[#00f0ff]/50 shadow-[0_0_35px_rgba(0,240,255,0.25)]',
    badgeContainer: 'border-[#ff0055] bg-gradient-to-r from-[#290022] via-[#12001a] to-[#290022]',
    badgeTextColor: 'text-[#00f0ff]',
    accentButton: 'bg-gradient-to-r from-[#ff0055] to-[#7928ca] text-white font-extrabold shadow-[0_0_15px_rgba(255,0,85,0.4)]',
    secondaryButton: 'border-[#00f0ff]/40 bg-[#160c2b] text-[#00f0ff] hover:bg-[#251545]',
    accentColor: '#00f0ff',
    fontDisplay: "font-['Outfit']",
    fontHeader: "font-['Outfit']",
    tagColor: 'bg-[#00f0ff] text-black',
    description: 'Estilo Miami Vice y synthpop ochentero con neones vibrantes y contrastes nocturnos.',
  },
  jazzclub: {
    id: 'jazzclub',
    name: 'Midnight Jazz & Blues Club',
    subtitle: 'Azul medianoche, latón ahumado y atmósfera de club acústico',
    icon: '🎷',
    pageBg: 'bg-[#050b14]',
    cabinetBg: 'bg-gradient-to-b from-[#0e1d33] via-[#081221] to-[#040912]',
    borderColor: 'border-[#48cae4]/40 shadow-[0_15px_40px_rgba(0,0,0,0.9)]',
    badgeContainer: 'border-[#e0a96d]/60 bg-gradient-to-b from-[#12233b] to-[#070e17]',
    badgeTextColor: 'text-[#e0a96d]',
    accentButton: 'bg-gradient-to-r from-[#e0a96d] to-[#b37d44] text-[#050b14] font-bold shadow-md',
    secondaryButton: 'border-[#48cae4]/30 bg-[#0c1a2e] text-[#90e0ef] hover:bg-[#142845]',
    accentColor: '#e0a96d',
    fontDisplay: "font-['Playfair_Display']",
    fontHeader: "font-['Cinzel']",
    tagColor: 'bg-[#e0a96d] text-black',
    description: 'La elegancia de los clubes de jazz de Nueva York y Chicago con terciopelo azul y latón.',
  },
  studio54: {
    id: 'studio54',
    name: 'Disco & Funk 70s',
    subtitle: 'Oro champán, destellos dorados y ritmo funk de pista de baile',
    icon: '🪩',
    pageBg: 'bg-[#0d0a06]',
    cabinetBg: 'bg-gradient-to-b from-[#2a1c0d] via-[#1a1107] to-[#0d0804]',
    borderColor: 'border-[#e5a93b]/60 shadow-[0_0_35px_rgba(229,169,59,0.25)]',
    badgeContainer: 'border-[#ffd700] bg-gradient-to-r from-[#362106] via-[#1e1203] to-[#362106]',
    badgeTextColor: 'text-[#ffe066]',
    accentButton: 'bg-gradient-to-r from-[#ffd700] to-[#ff9e00] text-black font-extrabold shadow-lg',
    secondaryButton: 'border-[#e5a93b]/40 bg-[#241708] text-[#ffe066] hover:bg-[#38230b]',
    accentColor: '#ffd700',
    fontDisplay: "font-['Outfit']",
    fontHeader: "font-['Cinzel']",
    tagColor: 'bg-[#ffd700] text-black',
    description: 'Inspirado en la era Studio 54, música disco, funk y el glamour dorado de los 70s.',
  },
  minimal_dark: {
    id: 'minimal_dark',
    name: 'Cinema Dark Lounge',
    subtitle: 'Negro carbón mate, líneas finas y protagonismo máximo al video',
    icon: '🎬',
    pageBg: 'bg-[#030303]',
    cabinetBg: 'bg-gradient-to-b from-[#161616] via-[#0d0d0d] to-[#040404]',
    borderColor: 'border-[#ffffff]/20 shadow-[0_20px_50px_rgba(0,0,0,0.95)]',
    badgeContainer: 'border-white/30 bg-[#111111]',
    badgeTextColor: 'text-white',
    accentButton: 'bg-white text-black font-bold shadow-md hover:bg-neutral-200',
    secondaryButton: 'border-white/20 bg-[#1a1a1a] text-neutral-200 hover:bg-[#282828]',
    accentColor: '#ffffff',
    fontDisplay: "font-['Outfit']",
    fontHeader: "font-['Outfit']",
    tagColor: 'bg-white text-black',
    description: 'Estética contemporánea premium ultra limpia: el video ocupa el centro del escenario.',
  },
};
