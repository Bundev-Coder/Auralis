import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioStore } from '../../state/useAudioStore';
import { usePlaylistStore } from '../../state/usePlaylistStore';
import { TrackRow } from '../../components/common/TrackRow';
import { darkColors, typography, borderRadius, spacing } from '../../theme';

const GENRES = [
  { name: 'All', color: darkColors.secondary },
  { name: 'Synthwave', color: '#8B5CF6' },
  { name: 'Lo-Fi Chill', color: '#00F2FE' },
  { name: 'Electronic', color: '#EC4899' },
  { name: 'Modern Classical', color: '#10B981' },
  { name: 'Space Ambient', color: '#6366F1' },
  { name: 'Future Bass', color: '#F59E0B' },
];

export const DiscoverScreen: React.FC = () => {
  const { currentTrack, isPlaying, playTrack } = useAudioStore();
  const { allTracks, toggleFavorite } = usePlaylistStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedSource, setSelectedSource] = useState<'all' | 'online' | 'local'>('all');

  const filteredTracks = allTracks.filter((track) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesQuery =
      query === '' ||
      track.title.toLowerCase().includes(query) ||
      track.artist.toLowerCase().includes(query) ||
      track.album?.toLowerCase().includes(query) ||
      track.genre?.toLowerCase().includes(query) ||
      (track.lyrics && track.lyrics.toLowerCase().includes(query));

    const matchesGenre =
      selectedGenre === 'All' ||
      track.genre?.toLowerCase() === selectedGenre.toLowerCase();

    const matchesSource =
      selectedSource === 'all' ||
      (selectedSource === 'online' && !track.isLocal) ||
      (selectedSource === 'local' && track.isLocal);

    return matchesQuery && matchesGenre && matchesSource;
  });

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchHeader}>
        <Text style={styles.headerTitle}>Discover Sounds</Text>
        <View style={styles.searchInputBox}>
          <Ionicons name="search" size={18} color={darkColors.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder="Search tracks, artists, genres..."
            placeholderTextColor={darkColors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={darkColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Source Filter: All / Licensed Online Streams / Local Files */}
        <View style={styles.sourceSelectorRow}>
          {[
            { id: 'all', label: 'All Sources' },
            { id: 'online', label: 'Cloud Streams' },
            { id: 'local', label: 'Local Files' },
          ].map((s) => {
            const isSelected = selectedSource === s.id;
            return (
              <TouchableOpacity
                key={s.id}
                style={[styles.sourcePill, isSelected && styles.sourcePillActive]}
                onPress={() => setSelectedSource(s.id as any)}
              >
                <Text style={[styles.sourcePillText, isSelected && styles.sourcePillTextActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Genre Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.genrePillsRow}
        >
          {GENRES.map((g) => {
            const isSelected = selectedGenre === g.name;
            return (
              <TouchableOpacity
                key={g.name}
                style={[
                  styles.genrePill,
                  isSelected && { backgroundColor: 'rgba(0, 242, 254, 0.15)', borderColor: darkColors.secondary },
                ]}
                onPress={() => setSelectedGenre(g.name)}
              >
                <Text
                  style={[
                    styles.genrePillText,
                    isSelected && { color: darkColors.secondary, fontWeight: typography.fontWeight.bold },
                  ]}
                >
                  {g.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Results Count */}
        <View style={styles.resultCountRow}>
          <Text style={styles.resultCountText}>
            {filteredTracks.length} {filteredTracks.length === 1 ? 'Track' : 'Tracks'} Found
          </Text>
        </View>

        {/* Tracks List */}
        <View style={styles.trackList}>
          {filteredTracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              isCurrent={currentTrack?.id === track.id}
              isPlaying={isPlaying && currentTrack?.id === track.id}
              onPress={() => playTrack(track, filteredTracks)}
              onToggleFavorite={() => toggleFavorite(track.id)}
            />
          ))}

          {filteredTracks.length === 0 && (
            <View style={styles.emptyBox}>
              <Ionicons name="search-outline" size={48} color={darkColors.textTertiary} />
              <Text style={styles.emptyTitle}>No matching frequencies</Text>
              <Text style={styles.emptySubtitle}>Try searching for a different keyword or genre.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  searchHeader: {
    paddingHorizontal: spacing.base,
    paddingTop: 48,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
    marginBottom: 12,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19, 24, 38, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.base,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
  },
  input: {
    flex: 1,
    color: darkColors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  sourceSelectorRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    gap: 8,
    marginBottom: 6,
  },
  sourcePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sourcePillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: darkColors.secondary,
  },
  sourcePillText: {
    fontSize: 11,
    color: darkColors.textTertiary,
    fontWeight: typography.fontWeight.medium,
  },
  sourcePillTextActive: {
    color: darkColors.secondary,
    fontWeight: typography.fontWeight.bold,
  },
  genrePillsRow: {
    paddingHorizontal: spacing.base,
    gap: 8,
    paddingVertical: 8,
  },
  genrePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  genrePillText: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  resultCountRow: {
    paddingHorizontal: spacing.base,
    marginTop: 12,
    marginBottom: 6,
  },
  resultCountText: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textTertiary,
  },
  trackList: {
    paddingHorizontal: 6,
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
