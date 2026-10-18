import { darkColors, lightColors, ThemeColors } from './colors';
import { typography } from './typography';

export { darkColors, lightColors, ThemeColors, typography };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  base: 14,
  lg: 18,
  xl: 24,
  full: 9999,
  pill: 9999,
};

export const theme = {
  colors: darkColors,
  typography,
  spacing,
  borderRadius,
};
