/**
 * Auralis Core Domain Types
 */

export type AudioSourceType = 'local' | 'stream' | 'cached' | 'downloaded';

export interface LyricsLine {
  timeMs: number; // in milliseconds
  timeSec: number; // in seconds
  text: string;
}

export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // in seconds
  artworkUri?: string;
  sourceUri: string;
  sourceType: AudioSourceType;
  isLocal: boolean;
  bitrate?: string;
  format?: 'mp3' | 'm4a' | 'flac' | 'wav' | 'aac' | 'ogg';
  genre?: string;
  year?: number;
  lyrics?: string; // raw LRC or plain text
  syncedLyrics?: LyricsLine[];
  playCount?: number;
  isFavorite?: boolean;
  addedAt: number;
  fileSizeBytes?: number;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  coverUri?: string;
  trackIds: string[];
  trackCount: number;
  totalDurationSec: number;
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
  isSmart?: boolean;
  smartFilter?: {
    genre?: string;
    artist?: string;
    minPlayCount?: number;
    limit?: number;
  };
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface EqualizerBand {
  frequency: number; // e.g. 32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000 Hz
  label: string; // e.g. "32Hz", "1kHz"
  gain: number; // -12dB to +12dB
}

export interface EqualizerPreset {
  id: string;
  name: string;
  preampGain: number; // -12dB to +12dB
  bands: number[]; // 10 gain values corresponding to the 10 standard frequencies
  isCustom?: boolean;
}

export type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'failed' | 'paused';

export interface DownloadItem {
  id: string;
  trackId: string;
  trackTitle: string;
  artist: string;
  progress: number; // 0.0 to 1.0
  status: DownloadStatus;
  localFilePath?: string;
  downloadedBytes: number;
  totalBytes: number;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  suggestedTrackIds?: string[];
  generatedPlaylist?: {
    name: string;
    description: string;
    tracks: Track[];
  };
  explanation?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUri?: string;
  createdAt: number;
  favoriteGenres: string[];
  subscriptionTier?: 'free' | 'premium';
}

export interface AudioInterruptionEvent {
  type: 'incoming_call' | 'duck' | 'unduck' | 'headphone_disconnected' | 'focus_loss';
}
