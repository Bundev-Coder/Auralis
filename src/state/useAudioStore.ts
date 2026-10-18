import { create } from 'zustand';
import { Track, RepeatMode, EqualizerPreset } from '../types';
import { AudioEngine } from '../audio/engine/AudioEngine';
import { QueueManager } from '../audio/queue/QueueManager';
import { PlaybackState } from '../audio/engine/types';
import { DEFAULT_EQ_PRESETS } from '../audio/engine/equalizerPresets';
import { dbRecordHistory } from '../database/db';

interface AudioStoreState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  positionSec: number;
  durationSec: number;
  volume: number;
  queue: Track[];
  currentIndex: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  equalizerPreset: EqualizerPreset;
  equalizerEnabled: boolean;
  error: string | null;

  // Actions
  play: () => Promise<void>;
  pause: () => Promise<void>;
  togglePlayPause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  setVolume: (vol: number) => Promise<void>;
  next: () => void;
  previous: () => void;
  playTrack: (track: Track, newQueue?: Track[]) => void;
  addToQueue: (track: Track) => void;
  playNext: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  applyEqualizerPreset: (preset: EqualizerPreset, enabled?: boolean) => void;
  updateEqualizerBand: (index: number, gainDb: number) => void;
}

export const useAudioStore = create<AudioStoreState>((set, get) => {
  // Subscribe to AudioEngine events
  AudioEngine.addListener((engineState: PlaybackState) => {
    set({
      currentTrack: engineState.currentTrack,
      isPlaying: engineState.isPlaying,
      isBuffering: engineState.isBuffering,
      positionSec: engineState.positionSec,
      durationSec: engineState.durationSec,
      volume: engineState.volume,
      equalizerPreset: engineState.equalizerPreset,
      equalizerEnabled: engineState.equalizerEnabled,
      error: engineState.error,
    });

    if (engineState.currentTrack && engineState.isPlaying) {
      dbRecordHistory(engineState.currentTrack.id);
    }
  });

  // Subscribe to QueueManager events
  QueueManager.addListener((qState) => {
    set({
      queue: qState.tracks,
      currentIndex: qState.currentIndex,
      repeatMode: qState.repeatMode,
      isShuffled: qState.isShuffled,
      currentTrack: qState.tracks[qState.currentIndex] || null,
    });
  });

  return {
    currentTrack: null,
    isPlaying: false,
    isBuffering: false,
    positionSec: 0,
    durationSec: 0,
    volume: 0.85,
    queue: [],
    currentIndex: -1,
    repeatMode: 'all',
    isShuffled: false,
    equalizerPreset: DEFAULT_EQ_PRESETS[0],
    equalizerEnabled: true,
    error: null,

    play: async () => AudioEngine.play(),
    pause: async () => AudioEngine.pause(),
    togglePlayPause: async () => AudioEngine.togglePlayPause(),
    seekTo: async (sec) => AudioEngine.seekTo(sec),
    setVolume: async (vol) => AudioEngine.setVolume(vol),
    next: () => QueueManager.next(),
    previous: () => QueueManager.previous(),

    playTrack: (track: Track, newQueue?: Track[]) => {
      if (newQueue && newQueue.length > 0) {
        const idx = newQueue.findIndex((t) => t.id === track.id);
        QueueManager.setQueue(newQueue, idx >= 0 ? idx : 0, true);
      } else {
        const curQueue = get().queue;
        const existingIdx = curQueue.findIndex((t) => t.id === track.id);
        if (existingIdx >= 0) {
          QueueManager.playTrackAtIndex(existingIdx);
        } else {
          QueueManager.addToQueue(track);
          QueueManager.playTrackAtIndex(curQueue.length);
        }
      }
    },

    addToQueue: (track: Track) => QueueManager.addToQueue(track),
    playNext: (track: Track) => QueueManager.playNext(track),
    removeFromQueue: (index: number) => QueueManager.removeTrack(index),
    toggleShuffle: () => QueueManager.toggleShuffle(),
    toggleRepeat: () => QueueManager.toggleRepeat(),

    applyEqualizerPreset: (preset, enabled = true) => {
      AudioEngine.applyEqualizerPreset(preset, enabled);
    },
    updateEqualizerBand: (index, gainDb) => {
      AudioEngine.updateEqualizerBand(index, gainDb);
    },
  };
});
