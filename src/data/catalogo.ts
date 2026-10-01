export interface SongCatalogItem {
  videoId: string;
  title: string;
  artist: string;
  category: 'don_rafa' | 'rancheras' | 'cumbias' | 'baladas' | 'karaoke';
  year?: string;
  duration?: string;
  isDonRafaFavorite?: boolean;
}

export const RAFAEL_NAME_SUGGESTIONS = [
  {
    name: 'La Rockola de Rafael García',
    subtitle: 'Fiesta, Familia & Amigos',
    slogan: '¡Aquí se canta, se baila y se disfruta en familia!',
    icon: '👑',
    badge: 'La Oficial de Don Rafa',
    tag: 'Principal',
  },
  {
    name: 'Rockola Don Rafa: ¡Puro Sabor Familiar!',
    subtitle: 'Reuniones de los García',
    slogan: 'El anfitrión pone la casa y la rockola... ¡ustedes pongan el ambiente!',
    icon: '🔥',
    badge: 'Fiestera & Parrandera',
    tag: 'Parranda',
  },
  {
    name: 'La Rockola de los García',
    subtitle: 'Donde Manda Don Rafa García',
    slogan: 'Canción pedida, canción cantada con el corazón.',
    icon: '🏡',
    badge: 'Orgullo Familiar',
    tag: 'Familiar',
  },
  {
    name: 'El Rincón Musical de Don Rafa',
    subtitle: 'Bohemia, Asados & Recuerdos',
    slogan: 'Noches de buena música, anécdotas y tragos con amigos.',
    icon: '🎸',
    badge: 'Bohemia de Oro',
    tag: 'Bohemia',
  },
  {
    name: 'Rockola Familiar Don Rafa',
    subtitle: '¡Música, Asado y Bochinche!',
    slogan: 'Para los cumpleaños, las navidades y los domingos de asado.',
    icon: '🥩',
    badge: 'Para los Asados',
    tag: 'Domingos',
  },
  {
    name: 'El Templo de Rafael García',
    subtitle: 'Solo Éxitos Inmortales',
    slogan: 'Aquí no hay música fea: si está en la rockola de Rafa, ¡es un éxito!',
    icon: '⭐',
    badge: 'Solo Clásicos',
    tag: 'VIP',
  },
];

export const CATALOGO_FAMILIAR_DON_RAFA: SongCatalogItem[] = [
  // Las Consentidas de Don Rafa García
  {
    videoId: 'yv7qK42oZ8Q',
    title: 'Hermoso Cariño',
    artist: 'Vicente Fernández',
    category: 'don_rafa',
    year: '1971',
    duration: '2:35',
    isDonRafaFavorite: true,
  },
  {
    videoId: 'lJNtNOC81oA',
    title: 'Mi Gran Noche',
    artist: 'Raphael',
    category: 'don_rafa',
    year: '1968',
    duration: '2:58',
    isDonRafaFavorite: true,
  },
  {
    videoId: 'zndvqTc4P9k',
    title: '17 Años',
    artist: 'Los Ángeles Azules ft. Jay de la Cueva',
    category: 'don_rafa',
    year: '2013',
    duration: '3:45',
    isDonRafaFavorite: true,
  },
  {
    videoId: 'rT7_4-m5P4U',
    title: 'Escándalo',
    artist: 'Raphael',
    category: 'don_rafa',
    year: '1992',
    duration: '4:15',
    isDonRafaFavorite: true,
  },

  // Rancheras & Mariachi para el Asado
  {
    videoId: 'yv7qK42oZ8Q',
    title: 'Acá Entre Nos',
    artist: 'Vicente Fernández',
    category: 'rancheras',
    year: '1992',
    duration: '3:15',
  },
  {
    videoId: 'F7t9bXU29z8',
    title: 'Querida',
    artist: 'Juan Gabriel',
    category: 'rancheras',
    year: '1984',
    duration: '5:27',
  },
  {
    videoId: 'd0uYq3b7tXU',
    title: 'Amor Eterno (En Vivo Bellas Artes)',
    artist: 'Juan Gabriel',
    category: 'rancheras',
    year: '1990',
    duration: '6:50',
  },
  {
    videoId: 'c_K7b9nIe0s',
    title: 'Como Yo Te Amo',
    artist: 'Raphael',
    category: 'rancheras',
    year: '1980',
    duration: '4:20',
  },

  // Cumbias & Para que Baile la Familia
  {
    videoId: 'r8Z4Q7QYqj4',
    title: 'El Listón de Tu Pelo',
    artist: 'Los Ángeles Azules',
    category: 'cumbias',
    year: '1999',
    duration: '3:30',
  },
  {
    videoId: 'O2_k8rD3q4A',
    title: 'La Chona',
    artist: 'Los Tucanes de Tijuana',
    category: 'cumbias',
    year: '1995',
    duration: '3:15',
  },
  {
    videoId: 'wJ8kP9a5x_0',
    title: 'Los Caminos de la Vida',
    artist: 'Celso Piña',
    category: 'cumbias',
    year: '2001',
    duration: '4:05',
  },
  {
    videoId: 'V3291Q9E1lM',
    title: 'La Bilirrubina',
    artist: 'Juan Luis Guerra',
    category: 'cumbias',
    year: '1990',
    duration: '4:02',
  },

  // Baladas del Recuerdo & Bohemias
  {
    videoId: 'l6Fq1hS6X7o',
    title: 'El Triste',
    artist: 'José José',
    category: 'baladas',
    year: '1970',
    duration: '4:10',
  },
  {
    videoId: 'r4q2_B_u3wE',
    title: 'Tu Cárcel',
    artist: 'Los Bukis / Marco Antonio Solís',
    category: 'baladas',
    year: '1987',
    duration: '3:40',
  },
  {
    videoId: 'FvviLwJj1g4',
    title: 'Como La Flor',
    artist: 'Selena',
    category: 'baladas',
    year: '1992',
    duration: '3:05',
  },
  {
    videoId: 'T_FkEw27XJ0',
    title: 'De Música Ligera',
    artist: 'Soda Stereo',
    category: 'baladas',
    year: '1990',
    duration: '3:35',
  },

  // Modo Karaoke (Pistas con letra para la fiesta)
  {
    videoId: 'Zan1my-1uSw',
    title: 'Mi Gran Noche (Karaoke con Letra)',
    artist: 'Pista Karaoke',
    category: 'karaoke',
    duration: '2:59',
  },
  {
    videoId: 'yv7qK42oZ8Q',
    title: 'Hermoso Cariño (Pista Mariachi / Karaoke)',
    artist: 'Mariachi Karaoke',
    category: 'karaoke',
    duration: '2:40',
  },
];
