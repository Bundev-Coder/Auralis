import { describe, it, expect, beforeEach } from 'vitest';
import { QueueManager } from '../src/audio/queue/QueueManager';
import { Track } from '../src/types';

const mockTracks: Track[] = [
  {
    id: 't-1',
    title: 'Cyber Horizon',
    artist: 'Neon Pulse',
    album: 'Album 1',
    duration: 200,
    sourceUri: 'https://example.com/1.mp3',
    sourceType: 'stream',
    isLocal: false,
    addedAt: 1000,
  },
  {
    id: 't-2',
    title: 'Midnight Rain',
    artist: 'Aether Echo',
    album: 'Album 2',
    duration: 180,
    sourceUri: 'https://example.com/2.mp3',
    sourceType: 'stream',
    isLocal: false,
    addedAt: 2000,
  },
  {
    id: 't-3',
    title: 'Quantum Resonance',
    artist: 'HyperDrive',
    album: 'Album 3',
    duration: 240,
    sourceUri: 'https://example.com/3.mp3',
    sourceType: 'stream',
    isLocal: false,
    addedAt: 3000,
  },
];

describe('QueueManager', () => {
  beforeEach(() => {
    QueueManager.clearQueue();
  });

  it('sets queue and sets current track', () => {
    QueueManager.setQueue(mockTracks, 0, false);
    const state = QueueManager.getState();
    expect(state.tracks.length).toBe(3);
    expect(state.currentIndex).toBe(0);
    expect(QueueManager.getCurrentTrack()?.id).toBe('t-1');
  });

  it('advances next track in queue', () => {
    QueueManager.setQueue(mockTracks, 0, false);
    QueueManager.next();
    expect(QueueManager.getCurrentTrack()?.id).toBe('t-2');
  });

  it('handles repeat modes: off, all, one', () => {
    QueueManager.setQueue(mockTracks, 2, false); // Last track
    QueueManager.next(); // Repeat all is default -> loops to 0
    expect(QueueManager.getCurrentTrack()?.id).toBe('t-1');

    QueueManager.toggleRepeat(); // all -> one
    expect(QueueManager.getState().repeatMode).toBe('one');

    QueueManager.toggleRepeat(); // one -> off
    expect(QueueManager.getState().repeatMode).toBe('off');
  });

  it('toggles shuffle and restores original track order on un-shuffle', () => {
    QueueManager.setQueue(mockTracks, 0, false);
    QueueManager.toggleShuffle();
    expect(QueueManager.getState().isShuffled).toBe(true);
    // Current track remains playing at index 0
    expect(QueueManager.getCurrentTrack()?.id).toBe('t-1');

    QueueManager.toggleShuffle(); // Un-shuffle
    expect(QueueManager.getState().isShuffled).toBe(false);
    expect(QueueManager.getState().tracks.map((t) => t.id)).toEqual(['t-1', 't-2', 't-3']);
  });

  it('plays next track immediately via playNext', () => {
    QueueManager.setQueue(mockTracks, 0, false);
    const newTrack: Track = {
      id: 't-instant',
      title: 'Instant Hit',
      artist: 'DJ Swift',
      album: 'Single',
      duration: 120,
      sourceUri: 'https://example.com/instant.mp3',
      sourceType: 'stream',
      isLocal: false,
      addedAt: 4000,
    };

    QueueManager.playNext(newTrack);
    const state = QueueManager.getState();
    expect(state.tracks[1].id).toBe('t-instant');
  });

  it('moves and reorders track in queue', () => {
    QueueManager.setQueue(mockTracks, 0, false);
    QueueManager.moveTrack(0, 2);
    const state = QueueManager.getState();
    expect(state.tracks[2].id).toBe('t-1');
    expect(state.currentIndex).toBe(2);
  });

  it('removes track from queue', () => {
    QueueManager.setQueue(mockTracks, 0, false);
    QueueManager.removeTrack(1); // remove t-2
    const state = QueueManager.getState();
    expect(state.tracks.length).toBe(2);
    expect(state.tracks.map((t) => t.id)).toEqual(['t-1', 't-3']);
  });
});
