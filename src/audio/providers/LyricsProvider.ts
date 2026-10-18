import { ILyricsProvider } from './types';
import { Track, LyricsLine } from '../../types';
import { parseLRC } from '../../utils/lrcParser';

export class LyricsProvider implements ILyricsProvider {
  async getLyrics(track: Track): Promise<{
    rawLrc?: string;
    syncedLines?: LyricsLine[];
    isStatic: boolean;
  }> {
    if (track.lyrics) {
      const parsed = parseLRC(track.lyrics);
      if (parsed.length > 0) {
        return {
          rawLrc: track.lyrics,
          syncedLines: parsed,
          isStatic: false,
        };
      }
      return {
        rawLrc: track.lyrics,
        syncedLines: [],
        isStatic: true,
      };
    }

    // Default instrumental / no lyrics found message
    return {
      rawLrc: undefined,
      syncedLines: [],
      isStatic: true,
    };
  }
}
