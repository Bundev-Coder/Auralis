import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioStore } from '../../state/useAudioStore';
import { usePlaylistStore } from '../../state/usePlaylistStore';
import { TrackRow } from '../../components/common/TrackRow';
import { PlaylistDetailModal } from '../../components/player/PlaylistDetailModal';
import { Playlist } from '../../types';
import { darkColors, typography, borderRadius, spacing } from '../../theme';

type LibraryTab = 'tracks' | 'playlists' | 'favorites' | 'local';

export const LibraryScreen: React.FC = () => {
  const { currentTrack, isPlaying, playTrack } = useAudioStore();
  const {
    allTracks,
    playlists,
    favoriteTrackIds,
    toggleFavorite,
    importLocalFiles,
    createPlaylist,
  } = usePlaylistStore();

  const [activeTab, setActiveTab] = useState<LibraryTab>('tracks');
  const [isImporting, setIsImporting] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);

  const favoriteTracks = allTracks.filter((t) => favoriteTrackIds.has(t.id));
  const localTracks = allTracks.filter((t) => t.isLocal);

  const handleImportMusic = async () => {
    try {
      setIsImporting(true);
      const imported = await importLocalFiles();
      if (imported.length > 0) {
        Alert.alert('Import Success', `Successfully imported ${imported.length} audio file(s) into your Auralis Library.`);
      }
    } catch (err: any) {
      Alert.alert('Import Notice', err.message || 'File selection was canceled or unavailable.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleCreateNewPlaylist = async () => {
    const name = `Custom Mix #${playlists.length + 1}`;
    await createPlaylist(name, 'Created in Auralis Library');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Your Library</Text>
          <Text style={styles.subtitle}>
            {allTracks.length} tracks • {playlists.length} playlists
          </Text>
        </View>

        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={handleImportMusic}
            disabled={isImporting}
          >
            <Ionicons name="folder-open-outline" size={18} color={darkColors.secondary} />
            <Text style={styles.actionBtnText}>
              {isImporting ? 'Importing...' : 'Import Files'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {(['tracks', 'playlists', 'favorites', 'local'] as LibraryTab[]).map((tab) => {
          const isActive = activeTab === tab;
          const labels: Record<LibraryTab, string> = {
            tracks: 'All Tracks',
            playlists: 'Playlists',
            favorites: 'Favorites',
            local: 'Local Storage',
          };

          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, isActive && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {labels[tab]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Contents */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {activeTab === 'tracks' && (
          <View style={styles.trackList}>
            {allTracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                onPress={() => playTrack(track, allTracks)}
                onToggleFavorite={() => toggleFavorite(track.id)}
              />
            ))}
          </View>
        )}

        {activeTab === 'playlists' && (
          <View style={styles.playlistGrid}>
            <TouchableOpacity
              style={styles.createPlaylistCard}
              onPress={handleCreateNewPlaylist}
            >
              <Ionicons name="add" size={32} color={darkColors.secondary} />
              <Text style={styles.createPlaylistText}>New Playlist</Text>
            </TouchableOpacity>

            {playlists.map((pl) => {
              const plTracks = pl.trackIds
                .map((id) => allTracks.find((t) => t.id === id))
                .filter(Boolean) as typeof allTracks;

              return (
                <TouchableOpacity
                  key={pl.id}
                  style={styles.playlistGridCard}
                  onPress={() => setSelectedPlaylist(pl)}
                >
                  <View style={styles.gridCoverBox}>
                    {pl.coverUri ? (
                      <Image source={{ uri: pl.coverUri }} style={styles.gridCover} />
                    ) : (
                      <View style={[styles.gridCover, styles.gridCoverFallback]}>
                        <Ionicons name="musical-notes" size={28} color={darkColors.primary} />
                      </View>
                    )}
                  </View>
                  <Text style={styles.gridPlName} numberOfLines={1}>
                    {pl.name}
                  </Text>
                  <Text style={styles.gridPlMeta}>
                    {pl.trackCount} {pl.trackCount === 1 ? 'track' : 'tracks'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {activeTab === 'favorites' && (
          <View style={styles.trackList}>
            {favoriteTracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                onPress={() => playTrack(track, favoriteTracks)}
                onToggleFavorite={() => toggleFavorite(track.id)}
              />
            ))}

            {favoriteTracks.length === 0 && (
              <View style={styles.emptyBox}>
                <Ionicons name="heart-dislike-outline" size={48} color={darkColors.textTertiary} />
                <Text style={styles.emptyTitle}>No Favorite Tracks</Text>
                <Text style={styles.emptySubtitle}>
                  Tap the heart icon on any song to save it here.
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'local' && (
          <View style={styles.trackList}>
            <View style={styles.localInfoBanner}>
              <Ionicons name="hardware-chip-outline" size={20} color={darkColors.secondary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.localBannerTitle}>Device Storage Files</Text>
                <Text style={styles.localBannerSubtitle}>
                  Import audio files directly from your smartphone or local computer.
                </Text>
              </View>
            </View>

            {localTracks.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                isCurrent={currentTrack?.id === track.id}
                isPlaying={isPlaying && currentTrack?.id === track.id}
                onPress={() => playTrack(track, localTracks)}
                onToggleFavorite={() => toggleFavorite(track.id)}
              />
            ))}

            {localTracks.length === 0 && (
              <View style={styles.emptyBox}>
                <Ionicons name="folder-outline" size={48} color={darkColors.textTertiary} />
                <Text style={styles.emptyTitle}>No Local Music Imported</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "Import Files" above to load MP3, M4A, or FLAC files stored on your device.
                </Text>
              </View>
            )}
          </View>
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: 48,
    paddingBottom: 16,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  headerBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  actionBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.secondary,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabItem: {
    paddingVertical: 10,
    marginRight: 18,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: darkColors.secondary,
  },
  tabText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: darkColors.textTertiary,
  },
  tabTextActive: {
    color: darkColors.secondary,
    fontWeight: typography.fontWeight.bold,
  },
  scrollContent: {
    paddingBottom: 110,
    paddingTop: 12,
  },
  trackList: {
    paddingHorizontal: 6,
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    gap: 14,
  },
  createPlaylistCard: {
    width: '47%',
    height: 160,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 242, 254, 0.04)',
  },
  createPlaylistText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.secondary,
    marginTop: 8,
  },
  playlistGridCard: {
    width: '47%',
  },
  gridCoverBox: {
    width: '100%',
    height: 140,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  gridCover: {
    width: '100%',
    height: '100%',
  },
  gridCoverFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  gridPlName: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
    marginTop: 6,
  },
  gridPlMeta: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  localInfoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 10,
    marginBottom: 12,
    padding: 12,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(19, 24, 38, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  localBannerTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  localBannerSubtitle: {
    fontSize: 11,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
});
