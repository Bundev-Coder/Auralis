import { Track, LyricsLine } from '../../types';

export interface IMusicProvider {
  id: string;
  name: string;
  isAvailable(): Promise<boolean>;
  searchTracks(query: string): Promise<Track[]>;
  getTrackById(id: string): Promise<Track | null>;
}

export interface ILocalMusicProvider extends IMusicProvider {
  pickAndImportFiles(): Promise<Track[]>;
  scanDirectory?(directoryUri: string): Promise<Track[]>;
}

export interface ILicensedStreamingProvider extends IMusicProvider {
  getFeaturedTracks(): Promise<Track[]>;
  getTracksByGenre(genre: string): Promise<Track[]>;
  resolvePlayableStreamUrl(trackId: string): Promise<string>;
}

export interface ILyricsProvider {
  getLyrics(track: Track): Promise<{ rawLrc?: string; syncedLines?: LyricsLine[]; isStatic: boolean }>;
}

export interface IArtworkProvider {
  getArtworkUri(track: Partial<Track>): string;
}
