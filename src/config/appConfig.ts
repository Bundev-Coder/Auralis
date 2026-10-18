/**
 * Auralis Central Application Configuration
 * All app branding, names, feature toggles, and API endpoints are configured here
 * so that rebranding or white-labeling is seamless.
 */

export interface AppConfig {
  appName: string;
  tagline: string;
  version: string;
  buildNumber: string;
  bundleId: string;
  supportEmail: string;
  websiteUrl: string;
  api: {
    baseUrl: string;
    timeoutMs: number;
    retryAttempts: number;
  };
  audio: {
    defaultVolume: number;
    defaultCrossfadeSec: number;
    defaultEqualizerPreset: string;
    enableWebAudioEQ: boolean;
    streamBitrate: '128k' | '256k' | '320k' | 'lossless';
    maxCacheSizeBytes: number; // 500 MB
  };
  ai: {
    assistantName: string;
    model: string;
    localFallbackEnabled: boolean;
    maxContextTokens: number;
  };
  features: {
    enableCloudSync: boolean;
    enableEqualizer: boolean;
    enableLyricsSync: boolean;
    enableAIPlaylistGen: boolean;
    enableOfflineDownloads: boolean;
    enableLocalMusicImport: boolean;
  };
}

export const APP_CONFIG: AppConfig = {
  appName: 'AURALIS',
  tagline: 'Next-Generation Immersive Audio Experience',
  version: '1.0.0',
  buildNumber: '100',
  bundleId: 'com.auralis.music',
  supportEmail: 'support@auralis.audio',
  websiteUrl: 'https://auralis.audio',
  api: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000/api',
    timeoutMs: 10000,
    retryAttempts: 3,
  },
  audio: {
    defaultVolume: 0.85,
    defaultCrossfadeSec: 2,
    defaultEqualizerPreset: 'Flat',
    enableWebAudioEQ: true,
    streamBitrate: '320k',
    maxCacheSizeBytes: 500 * 1024 * 1024,
  },
  ai: {
    assistantName: 'Auralis AI',
    model: 'auralis-neural-curator-v1',
    localFallbackEnabled: true,
    maxContextTokens: 4096,
  },
  features: {
    enableCloudSync: true,
    enableEqualizer: true,
    enableLyricsSync: true,
    enableAIPlaylistGen: true,
    enableOfflineDownloads: true,
    enableLocalMusicImport: true,
  },
};
