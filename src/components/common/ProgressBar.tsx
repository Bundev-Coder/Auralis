import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { darkColors, typography } from '../../theme';
import { formatTime } from '../../utils/formatTime';

interface ProgressBarProps {
  positionSec: number;
  durationSec: number;
  onSeek: (seconds: number) => void;
  showTimeLabels?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  positionSec,
  durationSec,
  onSeek,
  showTimeLabels = true,
}) => {
  const rawRatio =
    durationSec && Number.isFinite(durationSec) && durationSec > 0 && Number.isFinite(positionSec)
      ? positionSec / durationSec
      : 0;
  const progressRatio = Math.min(1, Math.max(0, Number.isFinite(rawRatio) ? rawRatio : 0));
  const progressPercent = `${(progressRatio * 100).toFixed(2)}%` as any;

  const handlePress = (e: GestureResponderEvent) => {
    // Calculate seek position from tap layout
    const { locationX } = e.nativeEvent;
    // We measure relative to width in layout
    // For standard responsive width, handle via target measurement or layout width
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.touchArea}
        activeOpacity={1}
        onPress={(e) => {
          // Native or web touch relative calculation
          const { locationX } = e.nativeEvent;
          // Target width approximate or direct
          const target = e.currentTarget as any;
          const width = target?.offsetWidth || 300;
          const ratio = Math.max(0, Math.min(1, locationX / width));
          onSeek(ratio * durationSec);
        }}
      >
        <View style={styles.track}>
          <View style={[styles.fill, { width: progressPercent }]} />
          <View style={[styles.thumb, { left: progressPercent }]} />
        </View>
      </TouchableOpacity>

      {showTimeLabels && (
        <View style={styles.timeRow}>
          <Text style={styles.timeText}>{formatTime(positionSec)}</Text>
          <Text style={styles.timeText}>{formatTime(durationSec)}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 6,
  },
  touchArea: {
    height: 24,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    position: 'relative',
    overflow: 'visible',
  },
  fill: {
    height: '100%',
    backgroundColor: darkColors.secondary,
    borderRadius: 2,
    shadowColor: darkColors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
  },
  thumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    marginLeft: -6,
    shadowColor: darkColors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textTertiary,
  },
});
