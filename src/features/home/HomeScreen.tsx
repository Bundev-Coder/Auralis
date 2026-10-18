import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioStore } from '../../state/useAudioStore';
import { usePlaylistStore } from '../../state/usePlaylistStore';
import { Header } from '../../components/common/Header';
import { TrackRow } from '../../components/common/TrackRow';
import { PlaylistDetailModal } from '../../components/player/PlaylistDetailModal';
import { Playlist } from '../../types';
import { darkColors, typography, borderRadius, spacing } from '../../theme';
import { APP_CONFIG } from '../../config/appConfig';

interface HomeScreenProps {
  onOpenEqualizer: () => void;
  onOpenDownloads: () => void;
  onOpenSettings: () => void;
  onNavigateToAI: () => void;
  onOpenProfile?: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onOpenEqualizer,
  onOpenDownloads,
  onOpenSettings,
  onNavigateToAI,
  onOpenProfile,
}) => {
  const { currentTrack, isPlaying, playTrack } = useAudioStore();
  const { allTracks, playlists, recentTrackIds, toggleFavorite } = usePlaylistStore();
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const recentTracks = recentTrackIds
    .map((id) => allTracks.find((t) => t.id === id))
    .filter(Boolean) as typeof allTracks;

  const displayTracks = recentTracks.length > 0 ? recentTracks : allTracks;

  return (
    <View style={styles.container}>
      <Header
        onOpenEqualizer={onOpenEqualizer}
        onOpenDownloads={onOpenDownloads}
        onOpenSettings={onOpenSettings}
        onOpenProfile={onOpenProfile}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero AI Daily Mix Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroGlow} />
          <View style={styles.heroContent}>
            <View style={styles.heroTag}>
              <Ionicons name="sparkles" size={12} color={darkColors.secondary} />
              <Text style={styles.heroTagText}>AURALIS NEURAL FLOW</Text>
            </View>
            <Text style={styles.heroTitle}>Midnight Cyber Session</Text>
            <Text style={styles.heroDesc}>
              Curated by {APP_CONFIG.ai.assistantName} based on your recent ambient frequencies.
            </Text>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={styles.heroPlayBtn}
                onPress={() => {
                  if (allTracks.length > 0) {
                    playTrack(allTracks[0], allTracks);
                  }
                }}
              >
                <Ionicons name="play" size={18} color={darkColors.textInverse} />
                <Text style={styles.heroPlayText}>Play Flow</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroAiBtn}
                onPress={onNavigateToAI}
              >
                <Ionicons name="chatbubbles-outline" size={16} color={darkColors.textPrimary} />
                <Text style={styles.heroAiText}>Ask AI</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Featured Playlists Carousel */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>FEATURED PLAYLISTS</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
        >
          {playlists.map((playlist) => {
            const playlistTracks = playlist.trackIds
              .map((id) => allTracks.find((t) => t.id === id))
              .filter(Boolean) as typeof allTracks;

            return (
              <TouchableOpacity
                key={playlist.id}
                style={styles.playlistCard}
                onPress={() => setSelectedPlaylist(playlist)}
                activeOpacity={0.8}
              >
                <View style={styles.playlistCoverBox}>
                  {playlist.coverUri ? (
                    <Image source={{ uri: playlist.coverUri }} style={styles.playlistCover} />
                  ) : (
                    <View style={[styles.playlistCover, styles.playlistCoverFallback]}>
                      <Ionicons name="disc" size={36} color={darkColors.primary} />
                    </View>
                  )}
                  <View style={styles.playlistBadge}>
                    <Text style={styles.playlistBadgeText}>{playlist.trackCount} TRACKS</Text>
                  </View>
                </View>
                <Text style={styles.playlistName} numberOfLines={1}>
                  {playlist.name}
                </Text>
                <Text style={styles.playlistDesc} numberOfLines={1}>
                  {playlist.description || 'Custom Collection'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Quick Picks / Library Highlights */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>RECENT & RECOMMENDED</Text>
          <Text style={styles.sectionSub}>{displayTracks.length} tracks</Text>
        </View>

        <View style={styles.trackList}>
          {displayTracks.slice(0, 8).map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              isCurrent={currentTrack?.id === track.id}
              isPlaying={isPlaying && currentTrack?.id === track.id}
              onPress={() => playTrack(track, displayTracks)}
              onToggleFavorite={() => toggleFavorite(track.id)}
            />
          ))}
        </View>
      </ScrollView>

      <PlaylistDetailModal
        visible={!!selectedPlaylist}
        playlist={selectedPlaylist}
        onClose={() => setSelectedPlaylist(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  heroCard: {
    marginHorizontal: spacing.base,
    marginTop: 4,
    marginBottom: 24,
    position: 'relative',
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: '#131826',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  heroGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(139, 92, 246, 0.35)',
  },
  heroContent: {
    padding: 20,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  heroTagText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.heavy,
    color: darkColors.secondary,
    letterSpacing: 1.5,
  },
  heroTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  heroDesc: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
  },
  heroPlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: darkColors.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  heroPlayText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textInverse,
  },
  heroAiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: borderRadius.full,
  },
  heroAiText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: typography.fontWeight.heavy,
    color: darkColors.textTertiary,
    letterSpacing: 1.5,
  },
  sectionSub: {
    fontSize: 11,
    color: darkColors.textTertiary,
  },
  carousel: {
    paddingHorizontal: spacing.base,
    gap: 14,
    paddingBottom: 20,
  },
  playlistCard: {
    width: 150,
  },
  playlistCoverBox: {
    width: 150,
    height: 150,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  playlistCover: {
    width: '100%',
    height: '100%',
  },
  playlistCoverFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  playlistBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: 'rgba(7, 9, 14, 0.8)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  playlistBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.secondary,
  },
  playlistName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
    marginTop: 8,
  },
  playlistDesc: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  trackList: {
    paddingHorizontal: 6,
  },
});
