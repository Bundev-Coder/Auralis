import { describe, it, expect } from 'vitest';
import { parseLRC, getActiveLyricsIndex } from '../src/utils/lrcParser';

describe('LRC Parser', () => {
  it('parses standard [mm:ss.xx] timestamps accurately', () => {
    const rawLrc = `
      [00:10.50]First line of song
      [00:25.00]Second line of song
      [01:05.250]Third line after one minute
    `;

    const result = parseLRC(rawLrc);
    expect(result.length).toBe(3);
    expect(result[0].timeSec).toBe(10.5);
    expect(result[0].text).toBe('First line of song');
    expect(result[1].timeSec).toBe(25.0);
    expect(result[2].timeSec).toBe(65.25);
  });

  it('handles multiple timestamps per line and sorts chronologically', () => {
    const rawLrc = `
      [00:50.00][00:15.00]Chorus line repeated
      [00:30.00]Verse line
    `;

    const result = parseLRC(rawLrc);
    expect(result.length).toBe(3);
    // Should sort so 15s comes first, then 30s, then 50s
    expect(result[0].timeSec).toBe(15.0);
    expect(result[1].timeSec).toBe(30.0);
    expect(result[2].timeSec).toBe(50.0);
  });

  it('ignores metadata tags like [ar:Artist] and [ti:Title]', () => {
    const rawLrc = `
      [ti:Cyber Horizon]
      [ar:Neon Pulse]
      [00:05.00]Actual lyrics start
    `;

    const result = parseLRC(rawLrc);
    expect(result.length).toBe(1);
    expect(result[0].text).toBe('Actual lyrics start');
  });

  it('correctly identifies the active lyrics line for a given playback second', () => {
    const lyrics = [
      { timeMs: 5000, timeSec: 5.0, text: 'Line 1' },
      { timeMs: 15000, timeSec: 15.0, text: 'Line 2' },
      { timeMs: 30000, timeSec: 30.0, text: 'Line 3' },
    ];

    expect(getActiveLyricsIndex(lyrics, 2.0)).toBe(0); // Before first line
    expect(getActiveLyricsIndex(lyrics, 7.5)).toBe(0); // Within line 1
    expect(getActiveLyricsIndex(lyrics, 15.0)).toBe(1); // Exactly line 2
    expect(getActiveLyricsIndex(lyrics, 22.0)).toBe(1); // Within line 2
    expect(getActiveLyricsIndex(lyrics, 35.0)).toBe(2); // Within line 3
  });
});
