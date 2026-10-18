import { describe, it, expect } from 'vitest';
import { AIEngine } from '../src/services/ai/AIEngine';
import { Track } from '../src/types';

const catalog: Track[] = [
  {
    id: 't-lofi-1',
    title: 'Coffee Beans',
    artist: 'LoFi Chillers',
    album: 'Study Beat',
    duration: 180,
    sourceUri: 'https://example.com/lofi.mp3',
    sourceType: 'stream',
    isLocal: false,
    genre: 'Lo-Fi Chill',
    addedAt: 1000,
  },
  {
    id: 't-synth-1',
    title: 'Neon Cruiser',
    artist: 'Retro Wave',
    album: 'Night Ride',
    duration: 220,
    sourceUri: 'https://example.com/synth.mp3',
    sourceType: 'stream',
    isLocal: false,
    genre: 'Synthwave',
    addedAt: 2000,
  },
  {
    id: 't-ambient-1',
    title: 'Starlight Silence',
    artist: 'Deep Void',
    album: 'Space Ambient',
    duration: 300,
    sourceUri: 'https://example.com/ambient.mp3',
    sourceType: 'stream',
    isLocal: false,
    genre: 'Space Ambient',
    addedAt: 3000,
  },
];

describe('AIEngine', () => {
  it('correctly maps study/focus prompt to Lo-Fi or Ambient tracks', () => {
    const res = AIEngine.localCuratePlaylist({
      prompt: 'Tạo playlist nhạc nhẹ để tập trung học trong 45 phút',
      availableTracks: catalog,
    });

    expect(res.tracks.length).toBeGreaterThan(0);
    // All recommended tracks must come strictly from existing catalog
    for (const t of res.tracks) {
      expect(catalog.some((c) => c.id === t.id)).toBe(true);
    }
    // High probability of matching Lo-Fi
    expect(res.tracks[0].genre).toMatch(/Lo-Fi Chill|Space Ambient/);
  });

  it('correctly maps night drive prompt to Synthwave', () => {
    const res = AIEngine.localCuratePlaylist({
      prompt: 'Nhạc synthwave lái xe đêm',
      availableTracks: catalog,
    });

    expect(res.tracks.length).toBeGreaterThan(0);
    expect(res.tracks[0].genre).toBe('Synthwave');
    expect(res.playlistName).toContain('Midnight');
  });

  it('guarantees no fake tracks or URLs are ever generated', () => {
    const res = AIEngine.localCuratePlaylist({
      prompt: 'Non-existent psychedelic trance polka 2099',
      availableTracks: catalog,
    });

    for (const t of res.tracks) {
      expect(catalog.map((c) => c.id)).toContain(t.id);
      expect(t.sourceUri).toMatch(/^https?:\/\//);
    }
  });

  it('calculates similar tracks based on genre and artist affinity', () => {
    const similar = AIEngine.getSimilarTracks(catalog[0], catalog, 2);
    expect(similar.length).toBeLessThanOrEqual(2);
    expect(similar.some((t) => t.id === catalog[0].id)).toBe(false); // Does not contain target track itself
  });
});
