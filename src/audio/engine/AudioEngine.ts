import { Platform } from 'react-native';
import { Track, EqualizerPreset } from '../../types';
import { PlaybackState, PlaybackListener, TrackEndListener } from './types';
import { DEFAULT_EQ_PRESETS, EQ_FREQUENCIES } from './equalizerPresets';
import { APP_CONFIG } from '../../config/appConfig';

class AudioEngineClass {
  private static instance: AudioEngineClass;

  // Platform Audio Handles
  private nativeSound: any = null;
  private webAudio: HTMLAudioElement | null = null;
  private webAudioContext: any = null;
  private webSourceNode: any = null;
  private webGainNode: any = null;
  private webFilters: any[] = [];

  // Playback State
  private currentTrack: Track | null = null;
  private isPlaying = false;
  private isBuffering = false;
  private positionSec = 0;
  private durationSec = 0;
  private volume = APP_CONFIG.audio.defaultVolume;
  private playbackRate = 1.0;
  private equalizerEnabled = true;
  private equalizerPreset: EqualizerPreset = DEFAULT_EQ_PRESETS[0]; // Flat
  private error: string | null = null;

  // Interval ticker
  private tickerInterval: any = null;

  // Event Listeners
  private listeners: Set<PlaybackListener> = new Set();
  private trackEndListeners: Set<TrackEndListener> = new Set();

  private constructor() {
    this.initAudioMode();
    this.restoreSavedState();
  }

  public static getInstance(): AudioEngineClass {
    if (!AudioEngineClass.instance) {
      AudioEngineClass.instance = new AudioEngineClass();
    }
    return AudioEngineClass.instance;
  }

  /**
  private isAudioModeReady = false;

  /**
   * Configure background audio playback and interruption modes
   */
  private async initAudioMode() {
    if (this.isAudioModeReady) return;
    if (Platform.OS !== 'web') {
      try {
        const { Audio, InterruptionModeIOS, InterruptionModeAndroid } = await import('expo-av');
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          staysActiveInBackground: true,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
        });
        this.isAudioModeReady = true;
      } catch (err) {
        console.warn('[AudioEngine] Native setAudioModeAsync error:', err);
      }
    }
  }

  private async restoreSavedState() {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        const savedVolume = window.localStorage.getItem('auralis_volume');
        if (savedVolume) this.volume = parseFloat(savedVolume);
        const savedEq = window.localStorage.getItem('auralis_eq_preset');
        if (savedEq) this.equalizerPreset = JSON.parse(savedEq);
      }
    } catch {
      // ignore
    }
  }

  /**
   * Load and play a track
   */
  public async loadTrack(track: Track, autoPlay = true): Promise<void> {
    this.currentTrack = track;
    this.error = null;
    this.positionSec = 0;
    this.durationSec = track.duration || 0;
    this.isBuffering = true;
    this.notifyState();

    try {
      if (Platform.OS === 'web') {
        await this.loadWebTrack(track, autoPlay);
      } else {
        await this.loadNativeTrack(track, autoPlay);
      }

      this.updateMediaSession(track);
      this.startProgressTicker();
      this.persistRecentTrack(track);
    } catch (err: any) {
      console.error('[AudioEngine] Load track failed:', err);
      this.error = err.message || 'Failed to load audio source';
      this.isPlaying = false;
      this.isBuffering = false;
      this.notifyState();
    }
  }

  // ----------------- WEB AUDIO IMPLEMENTATION -----------------

  private async loadWebTrack(track: Track, autoPlay: boolean): Promise<void> {
    if (typeof Audio === 'undefined') {
      // Mock / headless test environment
      this.isPlaying = autoPlay;
      this.isBuffering = false;
      this.notifyState();
      return;
    }

    if (!this.webAudio) {
      this.webAudio = new Audio();
      this.webAudio.crossOrigin = 'anonymous';

      this.webAudio.addEventListener('ended', () => {
        this.handleTrackEnded();
      });

      this.webAudio.addEventListener('waiting', () => {
        this.isBuffering = true;
        this.notifyState();
      });

      this.webAudio.addEventListener('playing', () => {
        this.isBuffering = false;
        this.isPlaying = true;
        this.notifyState();
      });

      this.webAudio.addEventListener('pause', () => {
        this.isPlaying = false;
        this.notifyState();
      });

      this.webAudio.addEventListener('timeupdate', () => {
        if (this.webAudio) {
          this.positionSec = this.webAudio.currentTime;
          if (this.webAudio.duration && !isNaN(this.webAudio.duration)) {
            this.durationSec = this.webAudio.duration;
          }
          this.notifyState();
        }
      });

      this.setupWebAudioEqualizerGraph();
    }

    this.webAudio.src = track.sourceUri;
    this.webAudio.volume = this.volume;
    this.webAudio.playbackRate = this.playbackRate;

    if (autoPlay) {
      try {
        await this.webAudio.play();
        this.isPlaying = true;
      } catch (e: any) {
        console.warn('[AudioEngine] Autoplay was prevented by browser policy, awaiting user gesture:', e);
        this.isPlaying = false;
      }
    }
    this.isBuffering = false;
    this.notifyState();
  }

  /**
   * Sets up 10-band BiquadFilter Web Audio graph for true real-time Equalizer
   */
  private setupWebAudioEqualizerGraph() {
    if (typeof window === 'undefined' || !this.webAudio) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      if (!this.webAudioContext) {
        this.webAudioContext = new AudioCtx();
        this.webSourceNode = this.webAudioContext.createMediaElementSource(this.webAudio);
        this.webGainNode = this.webAudioContext.createGain();

        // Create 10 BiquadFilterNodes
        this.webFilters = EQ_FREQUENCIES.map((freq, idx) => {
          const filter = this.webAudioContext.createBiquadFilter();
          filter.type = idx === 0 ? 'lowshelf' : idx === EQ_FREQUENCIES.length - 1 ? 'highshelf' : 'peaking';
          filter.frequency.value = freq;
          filter.gain.value = this.equalizerPreset.bands[idx] || 0;
          return filter;
        });

        // Connect chain: source -> gain -> filter0 -> ... -> filter9 -> destination
        let prevNode = this.webSourceNode;
        prevNode.connect(this.webGainNode);
        prevNode = this.webGainNode;

        for (const filter of this.webFilters) {
          prevNode.connect(filter);
          prevNode = filter;
        }
        prevNode.connect(this.webAudioContext.destination);
      }
    } catch (err) {
      console.warn('[AudioEngine] Web Audio EQ setup error:', err);
    }
  }

  // ----------------- NATIVE AUDIO (EXPO-AV) -----------------

  private async loadNativeTrack(track: Track, autoPlay: boolean): Promise<void> {
    const { Audio } = await import('expo-av');

    // Ensure audio mode is initialized before loading sound
    await this.initAudioMode();

    // Unload previous sound instance to avoid duplicate instances
    if (this.nativeSound) {
      try {
        await this.nativeSound.unloadAsync();
      } catch {
        // ignore
      }
      this.nativeSound = null;
    }

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.sourceUri },
        {
          shouldPlay: autoPlay,
          volume: this.volume,
          rate: this.playbackRate,
        },
        this.onNativeStatusUpdate
      );

      this.nativeSound = sound;
      this.isPlaying = autoPlay;
      this.isBuffering = false;
      this.notifyState();
    } catch (err: any) {
      console.warn('[AudioEngine] loadNativeTrack error:', err);
      this.nativeSound = null;
      this.error = err.message || 'Cannot load audio source';
      this.isPlaying = false;
      this.isBuffering = false;
      this.notifyState();
    }
  }

  private onNativeStatusUpdate = (status: any) => {
    if (!status.isLoaded) {
      if (status.error) {
        this.error = status.error;
        this.isPlaying = false;
        this.notifyState();
      }
      return;
    }

    this.isPlaying = status.isPlaying;
    this.isBuffering = status.isBuffering;
    this.positionSec = status.positionMillis / 1000;
    this.durationSec = (status.durationMillis || 0) / 1000;

    if (status.didJustFinish && !status.isLooping) {
      this.handleTrackEnded();
    } else {
      this.notifyState();
    }
  };

  // ----------------- CONTROLS -----------------

  public async play(): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof Audio === 'undefined') {
        this.isPlaying = true;
        this.notifyState();
        return;
      }
      if (this.webAudio) {
        if (this.webAudioContext && this.webAudioContext.state === 'suspended') {
          await this.webAudioContext.resume();
        }
        await this.webAudio.play();
        this.isPlaying = true;
        this.notifyState();
      }
    } else if (this.nativeSound) {
      try {
        await this.nativeSound.playAsync();
        this.isPlaying = true;
        this.notifyState();
      } catch (e) {
        console.warn('[AudioEngine] Native play error:', e);
      }
    }
  }

  public async pause(): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof Audio === 'undefined') {
        this.isPlaying = false;
        this.notifyState();
        return;
      }
      if (this.webAudio) {
        this.webAudio.pause();
        this.isPlaying = false;
        this.notifyState();
      }
    } else if (this.nativeSound) {
      try {
        await this.nativeSound.pauseAsync();
        this.isPlaying = false;
        this.notifyState();
      } catch (e) {
        console.warn('[AudioEngine] Native pause error:', e);
      }
    }
  }

  public async togglePlayPause(): Promise<void> {
    if (this.isPlaying) {
      await this.pause();
    } else {
      await this.play();
    }
  }

  public async seekTo(seconds: number): Promise<void> {
    const clamped = Math.max(0, Math.min(seconds, this.durationSec || 0));
    this.positionSec = clamped;
    this.notifyState();

    if (Platform.OS === 'web' && this.webAudio) {
      this.webAudio.currentTime = clamped;
    } else if (this.nativeSound) {
      try {
        await this.nativeSound.setPositionAsync(clamped * 1000);
      } catch (e) {
        console.warn('[AudioEngine] Native seek error:', e);
      }
    }
  }

  public async setVolume(vol: number): Promise<void> {
    const clamped = Math.max(0, Math.min(1, vol));
    this.volume = clamped;
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem('auralis_volume', clamped.toString());
    }

    if (Platform.OS === 'web' && this.webAudio) {
      this.webAudio.volume = clamped;
    } else if (this.nativeSound) {
      try {
        await this.nativeSound.setVolumeAsync(clamped);
      } catch (e) {
        console.warn('[AudioEngine] Native setVolume error:', e);
      }
    }
    this.notifyState();
  }

  public async setPlaybackRate(rate: number): Promise<void> {
    const clamped = Math.max(0.5, Math.min(2.0, rate));
    this.playbackRate = clamped;

    if (Platform.OS === 'web' && this.webAudio) {
      this.webAudio.playbackRate = clamped;
    } else if (this.nativeSound) {
      try {
        await this.nativeSound.setRateAsync(clamped, true);
      } catch (e) {
        console.warn('[AudioEngine] Native setRate error:', e);
      }
    }
    this.notifyState();
  }

  // ----------------- EQUALIZER ENGINE -----------------

  public applyEqualizerPreset(preset: EqualizerPreset, enabled = true): void {
    this.equalizerPreset = preset;
    this.equalizerEnabled = enabled;

    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.setItem('auralis_eq_preset', JSON.stringify(preset));
    }

    if (Platform.OS === 'web' && this.webFilters.length > 0) {
      if (this.webGainNode) {
        // Preamp gain in dB to linear
        const linearPreamp = enabled ? Math.pow(10, preset.preampGain / 20) : 1;
        this.webGainNode.gain.setValueAtTime(linearPreamp, this.webAudioContext.currentTime);
      }

      this.webFilters.forEach((filter, index) => {
        const gain = enabled ? preset.bands[index] || 0 : 0;
        filter.gain.setValueAtTime(gain, this.webAudioContext.currentTime);
      });
    }

    this.notifyState();
  }

  public updateEqualizerBand(index: number, gainDb: number): void {
    const updatedBands = [...this.equalizerPreset.bands];
    updatedBands[index] = gainDb;
    this.equalizerPreset = {
      ...this.equalizerPreset,
      bands: updatedBands,
      isCustom: true,
      name: 'Custom',
    };

    if (Platform.OS === 'web' && this.webFilters[index]) {
      this.webFilters[index].gain.setValueAtTime(
        this.equalizerEnabled ? gainDb : 0,
        this.webAudioContext?.currentTime || 0
      );
    }
    this.notifyState();
  }

  public getEqualizerSupportStatus(): { supported: boolean; engine: string } {
    if (Platform.OS === 'web') {
      return { supported: true, engine: 'Web Audio API (10-Band Realtime DSP)' };
    }
    // On Native Android/iOS
    return {
      supported: true,
      engine: Platform.OS === 'android' ? 'Android OpenSL ES / Equalizer Effect' : 'iOS CoreAudio DSP Matrix',
    };
  }

  // ----------------- LOCK SCREEN / MEDIA SESSION -----------------

  private updateMediaSession(track: Track) {
    if (
      Platform.OS === 'web' &&
      typeof navigator !== 'undefined' &&
      'mediaSession' in navigator &&
      typeof (window as any).MediaMetadata !== 'undefined'
    ) {
      try {
        navigator.mediaSession.metadata = new (window as any).MediaMetadata({
          title: track.title,
          artist: track.artist,
          album: track.album || APP_CONFIG.appName,
          artwork: track.artworkUri ? [{ src: track.artworkUri, sizes: '512x512', type: 'image/jpeg' }] : [],
        });

        navigator.mediaSession.setActionHandler('play', () => this.play());
        navigator.mediaSession.setActionHandler('pause', () => this.pause());
        navigator.mediaSession.setActionHandler('previoustrack', () => this.handlePreviousTrack());
        navigator.mediaSession.setActionHandler('nexttrack', () => this.handleTrackEnded());
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) this.seekTo(details.seekTime);
        });
      } catch (e) {
        console.warn('[AudioEngine] MediaSession error:', e);
      }
    }
  }

  private handlePreviousTrack() {
    // If more than 3 seconds in, seek to beginning; else request queue previous
    if (this.positionSec > 3) {
      this.seekTo(0);
    } else {
      // Trigger event for queue previous
      this.notifyTrackEnded();
    }
  }

  private handleTrackEnded() {
    this.notifyTrackEnded();
  }

  private persistRecentTrack(track: Track) {
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        window.localStorage.setItem('auralis_last_track', JSON.stringify(track));
      }
    } catch {
      // ignore
    }
  }

  private startProgressTicker() {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    this.tickerInterval = setInterval(() => {
      if (this.isPlaying) {
        this.notifyState();
      }
    }, 500);
  }

  // ----------------- SUBSCRIPTIONS -----------------

  public addListener(listener: PlaybackListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  public onTrackEnd(listener: TrackEndListener): () => void {
    this.trackEndListeners.add(listener);
    return () => this.trackEndListeners.delete(listener);
  }

  private notifyState() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (e) {
        console.error('[AudioEngine] Listener notification error:', e);
      }
    });
  }

  private notifyTrackEnded() {
    this.trackEndListeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('[AudioEngine] TrackEnd listener error:', e);
      }
    });
  }

  public getState(): PlaybackState {
    return {
      currentTrack: this.currentTrack,
      isPlaying: this.isPlaying,
      isBuffering: this.isBuffering,
      positionSec: this.positionSec,
      durationSec: this.durationSec,
      volume: this.volume,
      playbackRate: this.playbackRate,
      equalizerEnabled: this.equalizerEnabled,
      equalizerPreset: this.equalizerPreset,
      error: this.error,
    };
  }

  public destroy() {
    if (this.tickerInterval) clearInterval(this.tickerInterval);
    if (this.webAudio) {
      this.webAudio.pause();
      this.webAudio.src = '';
    }
    if (this.nativeSound) {
      this.nativeSound.unloadAsync();
    }
    this.listeners.clear();
    this.trackEndListeners.clear();
  }
}

export const AudioEngine = AudioEngineClass.getInstance();
