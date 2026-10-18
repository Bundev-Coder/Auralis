import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Playlist, Track } from '../../types';
import { useAudioStore } from '../../state/useAudioStore';
import { usePlaylistStore } from '../../state/usePlaylistStore';
import { darkColors, typography, borderRadius, spacing } from '../../theme';
import { formatTime } from '../../utils/formatTime';

interface PlaylistDetailModalProps {
  visible: boolean;
  onClose: () => void;
  playlist: Playlist | null;
}

export const PlaylistDetailModal: React.FC<PlaylistDetailModalProps> = ({
  visible,
  onClose,
  playlist,
}) => {
  const { currentTrack, isPlaying, playTrack } = useAudioStore();
  const {
    allTracks,
    deletePlaylist,
    removeTrackFromPlaylist,
    addTrackToPlaylist,
    toggleFavorite,
  } = usePlaylistStore();

  const [showAddPicker, setShowAddPicker] = useState(false);

  if (!playlist) return null;

  const playlistTracks = playlist.trackIds
    .map((id) => allTracks.find((t) => t.id === id))
    .filter(Boolean) as Track[];

  const availableToAdd = allTracks.filter(
    (t) => !playlist.trackIds.includes(t.id)
  );

  const handlePlayAll = () => {
    if (playlistTracks.length > 0) {
      playTrack(playlistTracks[0], playlistTracks);
      onClose();
    }
  };

  const handleShufflePlay = () => {
    if (playlistTracks.length > 0) {
      const shuffled = [...playlistTracks].sort(() => Math.random() - 0.5);
      playTrack(shuffled[0], shuffled);
      onClose();
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Playlist',
      `Are you sure you want to delete "${playlist.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePlaylist(playlist.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header Navigation */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.circleBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color={darkColors.textPrimary} />
          </TouchableOpacity>

          <Text style={styles.headerTitle} numberOfLines={1}>
            Playlist Details
          </Text>

          <TouchableOpacity style={styles.circleBtn} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={darkColors.accentPink} />
          </TouchableOpacity>
        </View>

        {/* Playlist Hero Info */}
        <View style={styles.hero}>
          <View style={styles.coverBox}>
            {playlist.coverUri ? (
              <Image source={{ uri: playlist.coverUri }} style={styles.coverImg} />
            ) : (
              <View style={[styles.coverImg, styles.coverFallback]}>
                <Ionicons name="disc" size={54} color={darkColors.primary} />
              </View>
            )}
          </View>

          <View style={styles.heroMeta}>
            <Text style={styles.playlistName} numberOfLines={2}>
              {playlist.name}
            </Text>
            {playlist.description && (
              <Text style={styles.playlistDesc} numberOfLines={2}>
                {playlist.description}
              </Text>
            )}
            <Text style={styles.statsText}>
              {playlistTracks.length} {playlistTracks.length === 1 ? 'track' : 'tracks'} • {formatTime(playlist.totalDurationSec)}
            </Text>
          </View>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.playBtn, playlistTracks.length === 0 && styles.btnDisabled]}
            onPress={handlePlayAll}
            disabled={playlistTracks.length === 0}
          >
            <Ionicons name="play" size={18} color={darkColors.textInverse} />
            <Text style={styles.playBtnText}>Play All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shuffleBtn, playlistTracks.length === 0 && styles.btnDisabled]}
            onPress={handleShufflePlay}
            disabled={playlistTracks.length === 0}
          >
            <Ionicons name="shuffle" size={18} color={darkColors.textPrimary} />
            <Text style={styles.shuffleBtnText}>Shuffle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setShowAddPicker(true)}
          >
            <Ionicons name="add" size={20} color={darkColors.secondary} />
            <Text style={styles.addBtnText}>Add Song</Text>
          </TouchableOpacity>
        </View>

        {/* Track List */}
        <FlatList
          data={playlistTracks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const isCurrent = currentTrack?.id === item.id;
            return (
              <View style={[styles.trackRow, isCurrent && styles.trackRowActive]}>
                <Text style={styles.trackIndex}>{index + 1}</Text>

                <TouchableOpacity
                  style={styles.trackInfo}
                  onPress={() => {
                    playTrack(item, playlistTracks);
                    onClose();
                  }}
                >
                  <Text
                    style={[styles.trackTitle, isCurrent && styles.trackTitleActive]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {item.artist} • {formatTime(item.duration)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => removeTrackFromPlaylist(playlist.id, item.id)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="remove-circle-outline" size={20} color={darkColors.textTertiary} />
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="musical-notes-outline" size={48} color={darkColors.textTertiary} />
              <Text style={styles.emptyTitle}>This playlist is empty</Text>
              <Text style={styles.emptyDesc}>Tap "+ Add Song" above to add tracks from your library.</Text>
            </View>
          }
        />

        {/* Add Songs Picker Submodal */}
        <Modal
          visible={showAddPicker}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowAddPicker(false)}
        >
          <View style={styles.pickerContainer}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Add to "{playlist.name}"</Text>
              <TouchableOpacity onPress={() => setShowAddPicker(false)}>
                <Ionicons name="close" size={24} color={darkColors.textPrimary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableToAdd}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerRow}
                  onPress={async () => {
                    await addTrackToPlaylist(playlist.id, item.id);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trackTitle}>{item.title}</Text>
                    <Text style={styles.trackArtist}>{item.artist}</Text>
                  </View>
                  <Ionicons name="add-circle" size={24} color={darkColors.secondary} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyTitle}>No more songs to add</Text>
                  <Text style={styles.emptyDesc}>All songs in your library are already in this playlist.</Text>
                </View>
              }
            />
          </View>
        </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hero: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  coverBox: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  coverImg: {
    width: '100%',
    height: '100%',
  },
  coverFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  heroMeta: {
    flex: 1,
  },
  playlistName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
    color: darkColors.textPrimary,
  },
  playlistDesc: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 4,
  },
  statsText: {
    fontSize: typography.fontSize.xs,
    color: darkColors.secondary,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 6,
  },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  playBtn: {
    flex: 1.2,
    flexDirection: 'row',
    backgroundColor: darkColors.secondary,
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  playBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textInverse,
  },
  shuffleBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  shuffleBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
  },
  addBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  addBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.secondary,
  },
  btnDisabled: {
    opacity: 0.4,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
    gap: 12,
  },
  trackRowActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 8,
  },
  trackIndex: {
    width: 24,
    fontSize: typography.fontSize.sm,
    color: darkColors.textTertiary,
    textAlign: 'center',
    fontWeight: typography.fontWeight.bold,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
  },
  trackTitleActive: {
    color: darkColors.secondary,
  },
  trackArtist: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    padding: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 8,
  },
  emptyTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textSecondary,
  },
  emptyDesc: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  pickerContainer: {
    flex: 1,
    backgroundColor: '#07090E',
    paddingTop: 16,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  pickerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
});
