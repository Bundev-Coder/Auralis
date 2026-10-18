import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioStore } from '../../state/useAudioStore';
import { usePlaylistStore } from '../../state/usePlaylistStore';
import { darkColors, typography, borderRadius, spacing } from '../../theme';
import { ProgressBar } from '../common/ProgressBar';
import { WaveformVisualizer } from './WaveformVisualizer';
import { LyricsModal } from '../lyrics/LyricsModal';
import { EqualizerModal } from '../equalizer/EqualizerModal';
import { QueueModal } from './QueueModal';

interface NowPlayingModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ARTWORK_SIZE = Math.min(SCREEN_WIDTH - 64, 320);

export const NowPlayingModal: React.FC<NowPlayingModalProps> = ({ visible, onClose }) => {
  const {
    currentTrack,
    isPlaying,
    positionSec,
    durationSec,
    repeatMode,
    isShuffled,
    togglePlayPause,
    seekTo,
    next,
    previous,
    toggleShuffle,
    toggleRepeat,
  } = useAudioStore();

  const { favoriteTrackIds, toggleFavorite, startDownload } = usePlaylistStore();

  const [showLyrics, setShowLyrics] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showQueue, setShowQueue] = useState(false);

  if (!currentTrack) return null;

  const isFavorite = favoriteTrackIds.has(currentTrack.id);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.circleBtn}
            onPress={onClose}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-down" size={24} color={darkColors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.headerInfo}>
            <Text style={styles.headerSubtitle}>NOW PLAYING</Text>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {currentTrack.album || 'Auralis Audio'}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.circleBtn}
            onPress={() => setShowQueue(true)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="list" size={20} color={darkColors.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Glowing Artwork Container */}
          <View style={styles.artworkWrapper}>
            <View style={styles.ambientGlow} />
            <View style={styles.artworkBox}>
              {currentTrack.artworkUri ? (
                <Image source={{ uri: currentTrack.artworkUri }} style={styles.artwork} />
              ) : (
                <View style={[styles.artwork, styles.artworkFallback]}>
                  <Ionicons name="musical-notes" size={72} color={darkColors.primary} />
                </View>
              )}
            </View>
          </View>

          {/* Track Info & Quality Badge */}
          <View style={styles.trackDetails}>
            <View style={styles.trackTitleBox}>
              <Text style={styles.trackTitle} numberOfLines={2}>
                {currentTrack.title}
              </Text>
              <Text style={styles.trackArtist} numberOfLines={1}>
                {currentTrack.artist}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.favBtn}
              onPress={() => toggleFavorite(currentTrack.id)}
            >
              <Ionicons
                name={isFavorite ? 'heart' : 'heart-outline'}
                size={26}
                color={isFavorite ? darkColors.accentPink : darkColors.textTertiary}
              />
            </TouchableOpacity>
          </View>

          {/* Audio Bitrate & Codec Badges */}
          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Ionicons name="flash-outline" size={11} color={darkColors.secondary} />
              <Text style={styles.badgeText}>{currentTrack.bitrate || '320 kbps'}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{currentTrack.format?.toUpperCase() || 'MP3'}</Text>
            </View>
            {currentTrack.genre && (
              <View style={[styles.badge, styles.genreBadge]}>
                <Text style={styles.badgeText}>{currentTrack.genre}</Text>
              </View>
            )}
          </View>

          {/* Real-time Waveform Spectrum */}
          <WaveformVisualizer isPlaying={isPlaying} barCount={32} height={36} />

          {/* Progress Seek Bar */}
          <View style={styles.progressSection}>
            <ProgressBar
              positionSec={positionSec}
              durationSec={durationSec}
              onSeek={(sec) => seekTo(sec)}
            />
          </View>

          {/* Core Playback Controls */}
          <View style={styles.controlsRow}>
            {/* Shuffle */}
            <TouchableOpacity
              style={[styles.smallControlBtn, isShuffled && styles.controlActive]}
              onPress={toggleShuffle}
            >
              <Ionicons
                name="shuffle"
                size={22}
                color={isShuffled ? darkColors.secondary : darkColors.textTertiary}
              />
            </TouchableOpacity>

            {/* Previous */}
            <TouchableOpacity style={styles.stepBtn} onPress={previous}>
              <Ionicons name="play-skip-back" size={28} color={darkColors.textPrimary} />
            </TouchableOpacity>

            {/* Play / Pause Giant Button */}
            <TouchableOpacity
              style={styles.giantPlayBtn}
              onPress={togglePlayPause}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={34}
                color={darkColors.textInverse}
                style={{ marginLeft: isPlaying ? 0 : 3 }}
              />
            </TouchableOpacity>

            {/* Next */}
            <TouchableOpacity style={styles.stepBtn} onPress={next}>
              <Ionicons name="play-skip-forward" size={28} color={darkColors.textPrimary} />
            </TouchableOpacity>

            {/* Repeat */}
            <TouchableOpacity
              style={[styles.smallControlBtn, repeatMode !== 'off' && styles.controlActive]}
              onPress={toggleRepeat}
            >
              <Ionicons
                name={repeatMode === 'one' ? 'repeat-outline' : 'repeat'}
                size={22}
                color={repeatMode !== 'off' ? darkColors.secondary : darkColors.textTertiary}
              />
              {repeatMode === 'one' && <Text style={styles.repeatBadge}>1</Text>}
            </TouchableOpacity>
          </View>

          {/* Bottom Utility Bar: Lyrics, EQ, Download */}
          <View style={styles.utilityBar}>
            <TouchableOpacity
              style={styles.utilityBtn}
              onPress={() => setShowLyrics(true)}
            >
              <Ionicons name="chatbox-ellipses-outline" size={20} color={darkColors.textPrimary} />
              <Text style={styles.utilityBtnText}>Lyrics</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.utilityBtn}
              onPress={() => setShowEqualizer(true)}
            >
              <Ionicons name="options-outline" size={20} color={darkColors.textPrimary} />
              <Text style={styles.utilityBtnText}>Equalizer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.utilityBtn}
              onPress={() => startDownload(currentTrack)}
            >
              <Ionicons name="download-outline" size={20} color={darkColors.textPrimary} />
              <Text style={styles.utilityBtnText}>Offline</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Nested Feature Modals */}
        <LyricsModal
          visible={showLyrics}
          onClose={() => setShowLyrics(false)}
          track={currentTrack}
          positionSec={positionSec}
          onSeek={seekTo}
        />

        <EqualizerModal
          visible={showEqualizer}
          onClose={() => setShowEqualizer(false)}
        />

        <QueueModal
          visible={showQueue}
          onClose={() => setShowQueue(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: 48,
    paddingBottom: 12,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 12,
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.secondary,
    letterSpacing: 2,
  },
  headerTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  artworkWrapper: {
    position: 'relative',
    marginVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ambientGlow: {
    position: 'absolute',
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: borderRadius.xl,
    backgroundColor: 'rgba(139, 92, 246, 0.25)',
    shadowColor: darkColors.primary,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.8,
    shadowRadius: 36,
  },
  artworkBox: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    elevation: 12,
  },
  artwork: {
    width: '100%',
    height: '100%',
  },
  artworkFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#131826',
  },
  trackDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginTop: 12,
  },
  trackTitleBox: {
    flex: 1,
    marginRight: 16,
  },
  trackTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  trackArtist: {
    fontSize: typography.fontSize.base,
    color: darkColors.textSecondary,
    marginTop: 4,
  },
  favBtn: {
    padding: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 8,
    marginVertical: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  genreBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderColor: 'rgba(0, 242, 254, 0.2)',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textSecondary,
  },
  progressSection: {
    width: '100%',
    marginTop: 8,
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 20,
    paddingHorizontal: 8,
  },
  smallControlBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    position: 'relative',
  },
  controlActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
  },
  repeatBadge: {
    position: 'absolute',
    top: 6,
    right: 8,
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.secondary,
  },
  stepBtn: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  giantPlayBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: darkColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: darkColors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 16,
    elevation: 8,
  },
  utilityBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  utilityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  utilityBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: darkColors.textPrimary,
  },
});
