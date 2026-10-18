/**
 * Auralis Futuristic Theme & Color Tokens
 * Dark Obsidian / Midnight with smoky violet, electric cyan, and emerald accents
 */

export const darkColors = {
  // Backgrounds
  background: '#07090E',
  backgroundSecondary: '#0E111A',
  surface: '#131826',
  surfaceElevated: '#1A2133',
  surfaceGlass: 'rgba(20, 26, 42, 0.75)',
  surfaceGlassUltra: 'rgba(255, 255, 255, 0.04)',

  // Accents & Brand
  primary: '#8B5CF6', // Electric Violet
  primaryGradientStart: '#8B5CF6',
  primaryGradientEnd: '#00F2FE', // Neon Cyan
  secondary: '#00F2FE', // Electric Cyan
  accent: '#10B981', // Emerald Mint
  accentPink: '#F43F5E', // Rose Quartz
  accentAmber: '#F59E0B',

  // Audio specific
  waveformActive: '#00F2FE',
  waveformInactive: '#1E293B',
  eqSliderTrack: '#1E293B',
  eqSliderFill: '#8B5CF6',
  lyricsActiveGlow: 'rgba(0, 242, 254, 0.3)',

  // Typography
  textPrimary: '#F8FAFC',
  textSecondary: '#94A3B8',
  textTertiary: '#64748B',
  textMuted: '#475569',
  textInverse: '#07090E',

  // Borders & Dividers
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.15)',
  borderActive: 'rgba(0, 242, 254, 0.5)',

  // Status & Feedback
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',

  // Shadows / Glow
  glowPrimary: 'rgba(139, 92, 246, 0.4)',
  glowSecondary: 'rgba(0, 242, 254, 0.35)',
};

export const lightColors = {
  background: '#F8FAFC',
  backgroundSecondary: '#F1F5F9',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceGlass: 'rgba(255, 255, 255, 0.85)',
  surfaceGlassUltra: 'rgba(0, 0, 0, 0.03)',

  primary: '#7C3AED',
  primaryGradientStart: '#7C3AED',
  primaryGradientEnd: '#0284C7',
  secondary: '#0284C7',
  accent: '#059669',
  accentPink: '#E11D48',
  accentAmber: '#D97706',

  waveformActive: '#0284C7',
  waveformInactive: '#E2E8F0',
  eqSliderTrack: '#E2E8F0',
  eqSliderFill: '#7C3AED',
  lyricsActiveGlow: 'rgba(2, 132, 199, 0.2)',

  textPrimary: '#0F172A',
  textSecondary: '#475569',
  textTertiary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#F8FAFC',

  borderSubtle: 'rgba(0, 0, 0, 0.08)',
  borderLight: 'rgba(0, 0, 0, 0.14)',
  borderActive: 'rgba(124, 58, 237, 0.4)',

  success: '#059669',
  warning: '#D97706',
  error: '#DC2626',
  info: '#2563EB',

  glowPrimary: 'rgba(124, 58, 237, 0.2)',
  glowSecondary: 'rgba(2, 132, 199, 0.15)',
};

export type ThemeColors = typeof darkColors;
