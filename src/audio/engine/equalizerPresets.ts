import { EqualizerPreset } from '../../types';

export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_BAND_LABELS = ['32Hz', '64Hz', '125Hz', '250Hz', '500Hz', '1kHz', '2kHz', '4kHz', '8kHz', '16kHz'];

export const DEFAULT_EQ_PRESETS: EqualizerPreset[] = [
  {
    id: 'preset-flat',
    name: 'Flat',
    preampGain: 0,
    bands: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    isCustom: false,
  },
  {
    id: 'preset-bass-boost',
    name: 'Bass Boost',
    preampGain: -1,
    bands: [7, 6, 5, 3, 1, 0, 0, 0, 0, 0],
    isCustom: false,
  },
  {
    id: 'preset-treble',
    name: 'Treble Boost',
    preampGain: -1,
    bands: [0, 0, 0, 0, 1, 2, 4, 6, 7, 8],
    isCustom: false,
  },
  {
    id: 'preset-vocal',
    name: 'Vocal Clarity',
    preampGain: 0,
    bands: [-2, -1, 1, 3, 5, 4, 3, 1, 0, -1],
    isCustom: false,
  },
  {
    id: 'preset-rock',
    name: 'Rock',
    preampGain: -1,
    bands: [5, 4, 2, 0, -1, 0, 2, 4, 5, 6],
    isCustom: false,
  },
  {
    id: 'preset-jazz',
    name: 'Jazz',
    preampGain: 0,
    bands: [3, 2, 1, 2, -1, -1, 0, 1, 3, 4],
    isCustom: false,
  },
  {
    id: 'preset-classical',
    name: 'Classical',
    preampGain: 0,
    bands: [4, 3, 2, 1, -1, -1, 0, 2, 3, 3],
    isCustom: false,
  },
];
