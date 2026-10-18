import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Track } from '../../types';
import { getActiveLyricsIndex } from '../../utils/lrcParser';
import { darkColors, typography, borderRadius, spacing } from '../../theme';

interface LyricsModalProps {
  visible: boolean;
  onClose: () => void;
  track: Track;
  positionSec: number;
  onSeek: (seconds: number) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const LyricsModal: React.FC<LyricsModalProps> = ({
  visible,
  onClose,
  track,
  positionSec,
  onSeek,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [fontSizeOffset, setFontSizeOffset] = useState(0); // -4 to +8

  const syncedLyrics = track.syncedLyrics || [];
  const hasLyrics = syncedLyrics.length > 0;
  const activeIndex = hasLyrics ? getActiveLyricsIndex(syncedLyrics, positionSec) : -1;

  // Auto scroll to active lyric line
  useEffect(() => {
    if (visible && hasLyrics && activeIndex >= 0 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index: activeIndex,
          animated: true,
          viewPosition: 0.4, // Center vertically
        });
      } catch {
        // Fallback if measurement not ready
      }
    }
  }, [activeIndex, visible, hasLyrics]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={darkColors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.titleBox}>
            <Text style={styles.title} numberOfLines={1}>
              {track.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {track.artist}
            </Text>
          </View>

          {/* Font Size Adjusters */}
          <View style={styles.fontControls}>
            <TouchableOpacity
              style={styles.fontBtn}
              onPress={() => setFontSizeOffset((prev) => Math.max(-4, prev - 2))}
            >
              <Text style={styles.fontBtnText}>A-</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fontBtn}
              onPress={() => setFontSizeOffset((prev) => Math.min(8, prev + 2))}
            >
              <Text style={styles.fontBtnText}>A+</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Synced Lyrics List */}
        {hasLyrics ? (
          <FlatList
            ref={flatListRef}
            data={syncedLyrics}
            keyExtractor={(_, index) => `lyric-${index}`}
            contentContainerStyle={styles.lyricsList}
            onScrollToIndexFailed={() => {}}
            renderItem={({ item, index }) => {
              const isActive = index === activeIndex;
              const isPast = index < activeIndex;

              return (
                <TouchableOpacity
                  style={[styles.lyricRow, isActive && styles.activeLyricRow]}
                  onPress={() => onSeek(item.timeSec)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.lyricText,
                      { fontSize: 18 + fontSizeOffset, lineHeight: 28 + fontSizeOffset },
                      isActive && styles.activeLyricText,
                      isPast && styles.pastLyricText,
                    ]}
                  >
                    {item.text}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        ) : (
          <View style={styles.noLyricsBox}>
            <Ionicons name="musical-notes-outline" size={56} color={darkColors.textTertiary} />
            <Text style={styles.noLyricsTitle}>Instrumental Track</Text>
            <Text style={styles.noLyricsSubtitle}>
              {track.lyrics
                ? track.lyrics
                : 'No synchronized LRC lyrics available for this audio file.'}
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleBox: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  artist: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  fontControls: {
    flexDirection: 'row',
    gap: 6,
  },
  fontBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  fontBtnText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textSecondary,
  },
  lyricsList: {
    paddingHorizontal: 28,
    paddingVertical: SCREEN_HEIGHT * 0.25,
  },
  lyricRow: {
    paddingVertical: 12,
  },
  activeLyricRow: {
    transform: [{ scale: 1.05 }],
  },
  lyricText: {
    fontSize: 20,
    fontWeight: typography.fontWeight.semibold,
    color: 'rgba(255, 255, 255, 0.3)',
    textAlign: 'center',
  },
  activeLyricText: {
    color: darkColors.secondary,
    fontWeight: typography.fontWeight.heavy,
    textShadowColor: 'rgba(0, 242, 254, 0.7)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  pastLyricText: {
    color: 'rgba(255, 255, 255, 0.55)',
  },
  noLyricsBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  noLyricsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
    marginTop: 16,
  },
  noLyricsSubtitle: {
    fontSize: typography.fontSize.sm,
    color: darkColors.textTertiary,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});
