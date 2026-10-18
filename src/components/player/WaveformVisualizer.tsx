import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { darkColors } from '../../theme';

interface WaveformVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  height?: number;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  isPlaying,
  barCount = 28,
  height = 42,
}) => {
  const [barHeights, setBarHeights] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 0.2 + Math.random() * 0.4)
  );

  useEffect(() => {
    if (!isPlaying) {
      setBarHeights(Array.from({ length: barCount }, () => 0.15));
      return;
    }

    const interval = setInterval(() => {
      setBarHeights(
        Array.from({ length: barCount }, (_, i) => {
          // Sine curve modulation combined with random jitter
          const base = Math.sin((i / barCount) * Math.PI) * 0.6;
          const jitter = Math.random() * 0.4;
          return Math.max(0.12, Math.min(1.0, base + jitter));
        })
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isPlaying, barCount]);

  return (
    <View style={[styles.container, { height }]}>
      {barHeights.map((scale, idx) => (
        <View
          key={idx}
          style={[
            styles.bar,
            {
              height: height * scale,
              backgroundColor: isPlaying
                ? idx % 3 === 0
                  ? darkColors.primary
                  : darkColors.secondary
                : darkColors.waveformInactive,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    width: '100%',
    paddingVertical: 8,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
    minHeight: 4,
  },
});
