import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Track } from '../../types';
import { darkColors, typography, borderRadius } from '../../theme';
import { formatTime } from '../../utils/formatTime';

interface TrackRowProps {
  track: Track;
  isPlaying?: boolean;
  isCurrent?: boolean;
  onPress: () => void;
  onToggleFavorite?: () => void;
  onAddToQueue?: () => void;
}

export const TrackRow: React.FC<TrackRowProps> = ({
  track,
  isPlaying,
  isCurrent,
  onPress,
  onToggleFavorite,
  onAddToQueue,
}) => {
  return (
    <TouchableOpacity
      style={[styles.container, isCurrent && styles.activeContainer]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.left}>
        <View style={styles.artContainer}>
          {track.artworkUri ? (
            <Image source={{ uri: track.artworkUri }} style={styles.artwork} />
          ) : (
            <View style={[styles.artwork, styles.artworkFallback]}>
              <Ionicons name="musical-note" size={20} color={darkColors.primary} />
            </View>
          )}

          {isCurrent && (
            <View style={styles.playingOverlay}>
              <Ionicons
                name={isPlaying ? 'volume-high' : 'pause'}
                size={16}
                color={darkColors.secondary}
              />
            </View>
          )}
        </View>

        <View style={styles.info}>
          <Text
            style={[styles.title, isCurrent && styles.activeTitle]}
            numberOfLines={1}
          >
            {track.title}
          </Text>
          <View style={styles.metaRow}>
            {track.isLocal && (
              <View style={styles.localTag}>
                <Text style={styles.localTagText}>LOCAL</Text>
              </View>
            )}
            <Text style={styles.artist} numberOfLines={1}>
              {track.artist}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.right}>
        <Text style={styles.duration}>{formatTime(track.duration)}</Text>

        {onToggleFavorite && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onToggleFavorite}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={track.isFavorite ? 'heart' : 'heart-outline'}
              size={18}
              color={track.isFavorite ? darkColors.accentPink : darkColors.textTertiary}
            />
          </TouchableOpacity>
        )}

        {onAddToQueue && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onAddToQueue}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="add-circle-outline" size={20} color={darkColors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: borderRadius.md,
    backgroundColor: 'transparent',
    marginVertical: 2,
  },
  activeContainer: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: darkColors.secondary,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  artContainer: {
    position: 'relative',
    width: 48,
    height: 48,
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
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  playingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(7, 9, 14, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
  },
  activeTitle: {
    color: darkColors.secondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  localTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  localTagText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.accent,
  },
  artist: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    flex: 1,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  duration: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textTertiary,
    minWidth: 36,
    textAlign: 'right',
  },
  actionBtn: {
    padding: 2,
  },
});
