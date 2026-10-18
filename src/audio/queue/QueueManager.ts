import { Track, RepeatMode } from '../../types';
import { AudioEngine } from '../engine/AudioEngine';

export interface QueueState {
  tracks: Track[];
  originalTracks: Track[]; // Used when un-shuffling
  currentIndex: number;
  repeatMode: RepeatMode;
  isShuffled: boolean;
  history: Track[];
}

export type QueueListener = (state: QueueState) => void;

class QueueManagerClass {
  private static instance: QueueManagerClass;

  private tracks: Track[] = [];
  private originalTracks: Track[] = [];
  private currentIndex = -1;
  private repeatMode: RepeatMode = 'all';
  private isShuffled = false;
  private history: Track[] = [];
  private listeners: Set<QueueListener> = new Set();

  private constructor() {
    // Connect to AudioEngine track finished event
    AudioEngine.onTrackEnd(() => {
      this.handleTrackEnded();
    });
  }

  public static getInstance(): QueueManagerClass {
    if (!QueueManagerClass.instance) {
      QueueManagerClass.instance = new QueueManagerClass();
    }
    return QueueManagerClass.instance;
  }

  public setQueue(tracks: Track[], startIndex = 0, autoPlay = true): void {
    if (!tracks || tracks.length === 0) return;

    this.tracks = [...tracks];
    this.originalTracks = [...tracks];
    this.isShuffled = false;
    this.currentIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));

    const currentTrack = this.tracks[this.currentIndex];
    AudioEngine.loadTrack(currentTrack, autoPlay);
    this.notify();
  }

  public getCurrentTrack(): Track | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.tracks.length) {
      return this.tracks[this.currentIndex];
    }
    return null;
  }

  public playTrackAtIndex(index: number): void {
    if (index >= 0 && index < this.tracks.length) {
      this.currentIndex = index;
      const track = this.tracks[index];
      AudioEngine.loadTrack(track, true);
      this.notify();
    }
  }

  public next(): void {
    if (this.tracks.length === 0) return;

    if (this.repeatMode === 'one') {
      AudioEngine.seekTo(0);
      AudioEngine.play();
      return;
    }

    if (this.currentIndex < this.tracks.length - 1) {
      this.currentIndex++;
    } else if (this.repeatMode === 'all') {
      this.currentIndex = 0;
    } else {
      // Repeat off and reached end of queue
      return;
    }

    const nextTrack = this.tracks[this.currentIndex];
    AudioEngine.loadTrack(nextTrack, true);
    this.notify();
  }

  public previous(): void {
    if (this.tracks.length === 0) return;

    const state = AudioEngine.getState();
    if (state.positionSec > 3) {
      AudioEngine.seekTo(0);
      return;
    }

    if (this.currentIndex > 0) {
      this.currentIndex--;
    } else if (this.repeatMode === 'all') {
      this.currentIndex = this.tracks.length - 1;
    }

    const prevTrack = this.tracks[this.currentIndex];
    AudioEngine.loadTrack(prevTrack, true);
    this.notify();
  }

  public playNext(track: Track): void {
    const insertIndex = this.currentIndex + 1;
    this.tracks.splice(insertIndex, 0, track);
    this.originalTracks.splice(insertIndex, 0, track);
    this.notify();
  }

  public addToQueue(item: Track | Track[]): void {
    const newItems = Array.isArray(item) ? item : [item];
    this.tracks.push(...newItems);
    this.originalTracks.push(...newItems);

    if (this.currentIndex === -1 && this.tracks.length > 0) {
      this.currentIndex = 0;
      AudioEngine.loadTrack(this.tracks[0], true);
    }
    this.notify();
  }

  public removeTrack(index: number): void {
    if (index < 0 || index >= this.tracks.length) return;

    this.tracks.splice(index, 1);
    if (index < this.currentIndex) {
      this.currentIndex--;
    } else if (index === this.currentIndex) {
      if (this.currentIndex >= this.tracks.length) {
        this.currentIndex = this.tracks.length - 1;
      }
      if (this.currentIndex >= 0) {
        AudioEngine.loadTrack(this.tracks[this.currentIndex], true);
      }
    }
    this.notify();
  }

  public moveTrack(fromIndex: number, toIndex: number): void {
    if (
      fromIndex < 0 ||
      fromIndex >= this.tracks.length ||
      toIndex < 0 ||
      toIndex >= this.tracks.length
    ) {
      return;
    }

    const [moved] = this.tracks.splice(fromIndex, 1);
    this.tracks.splice(toIndex, 0, moved);

    if (this.currentIndex === fromIndex) {
      this.currentIndex = toIndex;
    } else if (fromIndex < this.currentIndex && toIndex >= this.currentIndex) {
      this.currentIndex--;
    } else if (fromIndex > this.currentIndex && toIndex <= this.currentIndex) {
      this.currentIndex++;
    }

    this.notify();
  }

  public toggleShuffle(): void {
    this.isShuffled = !this.isShuffled;

    if (this.isShuffled) {
      const currentTrack = this.getCurrentTrack();
      const otherTracks = this.tracks.filter((_, idx) => idx !== this.currentIndex);

      // Fisher-Yates shuffle
      for (let i = otherTracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [otherTracks[i], otherTracks[j]] = [otherTracks[j], otherTracks[i]];
      }

      this.tracks = currentTrack ? [currentTrack, ...otherTracks] : otherTracks;
      this.currentIndex = currentTrack ? 0 : -1;
    } else {
      // Restore original order
      const currentTrack = this.getCurrentTrack();
      this.tracks = [...this.originalTracks];
      if (currentTrack) {
        this.currentIndex = this.tracks.findIndex((t) => t.id === currentTrack.id);
      }
    }

    this.notify();
  }

  public toggleRepeat(): void {
    if (this.repeatMode === 'off') {
      this.repeatMode = 'all';
    } else if (this.repeatMode === 'all') {
      this.repeatMode = 'one';
    } else {
      this.repeatMode = 'off';
    }
    this.notify();
  }

  public clearQueue(): void {
    this.tracks = [];
    this.originalTracks = [];
    this.currentIndex = -1;
    this.notify();
  }

  private handleTrackEnded(): void {
    if (this.repeatMode === 'one') {
      AudioEngine.seekTo(0);
      AudioEngine.play();
    } else {
      this.next();
    }
  }

  public addListener(listener: QueueListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error('[QueueManager] Listener error:', e);
      }
    });
  }

  public getState(): QueueState {
    return {
      tracks: [...this.tracks],
      originalTracks: [...this.originalTracks],
      currentIndex: this.currentIndex,
      repeatMode: this.repeatMode,
      isShuffled: this.isShuffled,
      history: [...this.history],
    };
  }
}

export const QueueManager = QueueManagerClass.getInstance();
