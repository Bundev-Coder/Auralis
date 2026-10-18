import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioStore } from '../../state/useAudioStore';
import { darkColors, typography, borderRadius } from '../../theme';

interface MiniPlayerProps {
  onExpand: () => void;
}

export const MiniPlayer: React.FC<MiniPlayerProps> = ({ onExpand }) => {
  const { currentTrack, isPlaying, togglePlayPause, next, positionSec, durationSec } =
    useAudioStore();

  if (!currentTrack) return null;

  const rawProgress =
    durationSec && Number.isFinite(durationSec) && durationSec > 0 && Number.isFinite(positionSec)
      ? (positionSec / durationSec) * 100
      : 0;
  const progress = Math.max(0, Math.min(100, Number.isFinite(rawProgress) ? rawProgress : 0));
  const progressPercent = `${progress.toFixed(2)}%` as any;

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity
        style={styles.container}
        onPress={onExpand}
        activeOpacity={0.9}
      >
        {/* Top Progress Line */}
        <View style={styles.progressBarTrack}>
          <View style={[styles.progressBarFill, { width: progressPercent }]} />
        </View>

        <View style={styles.contentRow}>
          {/* Artwork */}
          <View style={styles.artworkContainer}>
            {currentTrack.artworkUri ? (
              <Image source={{ uri: currentTrack.artworkUri }} style={styles.artwork} />
            ) : (
              <View style={[styles.artwork, styles.artworkFallback]}>
                <Ionicons name="musical-notes" size={18} color={darkColors.secondary} />
              </View>
            )}
          </View>

          {/* Track Info */}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          {/* Quick Controls */}
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.playBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                togglePlayPause();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={22}
                color={darkColors.textPrimary}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.nextBtn}
              onPress={(e) => {
                e.stopPropagation?.();
                next();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="play-skip-forward" size={20} color={darkColors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    paddingHorizontal: 12,
    paddingBottom: 6,
  },
  container: {
    backgroundColor: 'rgba(20, 26, 42, 0.94)',
    borderRadius: borderRadius.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  progressBarTrack: {
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: darkColors.secondary,
    shadowColor: darkColors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  artworkContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  artworkFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
  },
  artist: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  playBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextBtn: {
    padding: 6,
  },
});
