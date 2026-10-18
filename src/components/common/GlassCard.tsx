import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { darkColors, borderRadius } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: 'subtle' | 'elevated' | 'glow';
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, style, variant = 'subtle' }) => {
  return (
    <View
      style={[
        styles.base,
        variant === 'elevated' && styles.elevated,
        variant === 'glow' && styles.glow,
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(19, 24, 38, 0.72)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 16,
    overflow: 'hidden',
  },
  elevated: {
    backgroundColor: 'rgba(26, 33, 51, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    backgroundColor: 'rgba(19, 24, 38, 0.85)',
    borderColor: 'rgba(0, 242, 254, 0.3)',
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
});
