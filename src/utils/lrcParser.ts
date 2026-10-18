import { LyricsLine } from '../types';

/**
 * Robust LRC Synced Lyrics Parser
 * Handles:
 * - Standard [mm:ss.xx] and [mm:ss.xxx] timestamps
 * - Multiple timestamps per line [00:12.00][00:45.00]Chorus
 * - Metadata tags [ti:], [ar:], [al:]
 * - Out-of-order timestamps by sorting numerically
 */
export function parseLRC(rawLrc: string): LyricsLine[] {
  if (!rawLrc || typeof rawLrc !== 'string') return [];

  const lines = rawLrc.split(/\r?\n/);
  const parsedLines: LyricsLine[] = [];
  const timeRegex = /\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check if line contains timestamp
    const matches = [...trimmed.matchAll(timeRegex)];
    if (matches.length === 0) continue;

    // Extract text after all timestamp tags
    const text = trimmed.replace(timeRegex, '').trim();

    for (const match of matches) {
      const minutes = parseInt(match[1], 10);
      const seconds = parseInt(match[2], 10);
      let ms = 0;
      if (match[3]) {
        // Normalize 2-digit to 3-digit (e.g. .50 is 500ms)
        const msStr = match[3].padEnd(3, '0').slice(0, 3);
        ms = parseInt(msStr, 10);
      }

      const totalMs = minutes * 60 * 1000 + seconds * 1000 + ms;
      parsedLines.push({
        timeMs: totalMs,
        timeSec: totalMs / 1000,
        text: text || '♪',
      });
    }
  }

  // Sort chronologically
  parsedLines.sort((a, b) => a.timeMs - b.timeMs);
  return parsedLines;
}

/**
 * Finds current active line index for a given playback position in seconds
 */
export function getActiveLyricsIndex(lyrics: LyricsLine[], currentSec: number): number {
  if (!lyrics || lyrics.length === 0) return -1;
  const currentMs = currentSec * 1000;

  // If before first line
  if (currentMs < lyrics[0].timeMs) return 0;

  let activeIndex = 0;
  for (let i = 0; i < lyrics.length; i++) {
    if (lyrics[i].timeMs <= currentMs) {
      activeIndex = i;
    } else {
      break;
    }
  }
  return activeIndex;
}
