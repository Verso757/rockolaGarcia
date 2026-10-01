export type RockolaTheme = 'wurlitzer' | 'synthwave' | 'jazzclub' | 'studio54' | 'minimal_dark';

export interface SongItem {
  id: string;
  videoId: string;
  title: string;
  artist?: string;
  thumbnail: string;
  duration?: string;
  requestedBy?: string;
  votes: number;
  voters: string[];
  addedAt: number;
  isFirstPriority?: boolean;
}

export interface PlayedSongRecord extends SongItem {
  playedAt: number;
  playCount: number;
}

export interface RockolaRoomState {
  name: string;
  currentSong: SongItem | null;
  isPlaying: boolean;
  queue: SongItem[];
  history: PlayedSongRecord[];
  autoPlayDj: boolean;
  theme: RockolaTheme;
}
