import { describe, it, expect } from 'vitest';
import {
  DEFAULT_EQ_PRESETS,
  EQ_FREQUENCIES,
  EQ_BAND_LABELS,
} from '../src/audio/engine/equalizerPresets';

describe('Equalizer System', () => {
  it('defines 10 standard audio frequencies and labels', () => {
    expect(EQ_FREQUENCIES.length).toBe(10);
    expect(EQ_BAND_LABELS.length).toBe(10);
    expect(EQ_FREQUENCIES[0]).toBe(32);
    expect(EQ_FREQUENCIES[9]).toBe(16000);
  });

  it('provides 7 required presets with 10 bands each within -12dB to +12dB', () => {
    expect(DEFAULT_EQ_PRESETS.length).toBe(7);

    const presetNames = DEFAULT_EQ_PRESETS.map((p) => p.name);
    expect(presetNames).toContain('Flat');
    expect(presetNames).toContain('Bass Boost');
    expect(presetNames).toContain('Treble Boost');
    expect(presetNames).toContain('Vocal Clarity');
    expect(presetNames).toContain('Rock');
    expect(presetNames).toContain('Jazz');
    expect(presetNames).toContain('Classical');

    for (const preset of DEFAULT_EQ_PRESETS) {
      expect(preset.bands.length).toBe(10);
      for (const gain of preset.bands) {
        expect(gain).toBeGreaterThanOrEqual(-12);
        expect(gain).toBeLessThanOrEqual(12);
      }
      expect(preset.preampGain).toBeGreaterThanOrEqual(-12);
      expect(preset.preampGain).toBeLessThanOrEqual(12);
    }
  });

  it('verifies Bass Boost emphasizes lower frequencies', () => {
    const bassPreset = DEFAULT_EQ_PRESETS.find((p) => p.name === 'Bass Boost')!;
    expect(bassPreset.bands[0]).toBeGreaterThan(bassPreset.bands[9]);
  });

  it('verifies Treble Boost emphasizes higher frequencies', () => {
    const treblePreset = DEFAULT_EQ_PRESETS.find((p) => p.name === 'Treble Boost')!;
    expect(treblePreset.bands[9]).toBeGreaterThan(treblePreset.bands[0]);
  });
});
