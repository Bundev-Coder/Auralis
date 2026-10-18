import { Track, EqualizerPreset } from '../../types';

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering: boolean;
  positionSec: number;
  durationSec: number;
  volume: number; // 0.0 to 1.0
  playbackRate: number; // 0.5 to 2.0
  equalizerEnabled: boolean;
  equalizerPreset: EqualizerPreset;
  error: string | null;
}

export type PlaybackListener = (state: PlaybackState) => void;
export type TrackEndListener = () => void;
