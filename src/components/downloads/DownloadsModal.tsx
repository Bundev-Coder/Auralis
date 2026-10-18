import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlaylistStore } from '../../state/usePlaylistStore';
import { darkColors, typography, borderRadius, spacing } from '../../theme';
import { formatBytes } from '../../utils/formatTime';

interface DownloadsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DownloadsModal: React.FC<DownloadsModalProps> = ({ visible, onClose }) => {
  const { downloads, removeDownload } = usePlaylistStore();

  const totalBytes = downloads.reduce((acc, d) => acc + (d.downloadedBytes || 0), 0);
  const completedCount = downloads.filter((d) => d.status === 'completed').length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={darkColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Offline Storage</Text>
            <Text style={styles.subtitle}>Downloaded Audio Catalog</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Storage Summary Card */}
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <Ionicons name="server-outline" size={20} color={darkColors.secondary} />
            <Text style={styles.storageTitle}>Local Device Storage</Text>
          </View>
          <Text style={styles.storageStat}>
            {formatBytes(totalBytes)} used • {completedCount} offline tracks
          </Text>
          <View style={styles.storageBar}>
            <View style={[styles.storageBarFill, { width: '35%' }]} />
          </View>
        </View>

        {/* Downloaded List */}
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.downloadRow}>
              <View style={styles.statusIcon}>
                <Ionicons
                  name={item.status === 'completed' ? 'checkmark-circle' : 'cloud-download'}
                  size={22}
                  color={item.status === 'completed' ? darkColors.accent : darkColors.secondary}
                />
              </View>

              <View style={styles.info}>
                <Text style={styles.itemTitle} numberOfLines={1}>
                  {item.trackTitle}
                </Text>
                <Text style={styles.itemArtist} numberOfLines={1}>
                  {item.artist} • {formatBytes(item.downloadedBytes)} / {formatBytes(item.totalBytes)}
                </Text>

                {item.status !== 'completed' && (
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressFill,
                        { width: `${Math.floor(item.progress * 100)}%` },
                      ]}
                    />
                  </View>
                )}
              </View>

              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => removeDownload(item.trackId)}
              >
                <Ionicons name="trash-outline" size={18} color={darkColors.textTertiary} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="cloud-offline-outline" size={56} color={darkColors.textTertiary} />
              <Text style={styles.emptyTitle}>No Offline Content</Text>
              <Text style={styles.emptySubtitle}>
                Tap the download icon on any track in Now Playing to listen without network.
              </Text>
            </View>
          }
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: 24,
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
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  storageCard: {
    margin: 16,
    padding: 16,
    borderRadius: borderRadius.lg,
    backgroundColor: 'rgba(19, 24, 38, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  storageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storageTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
  },
  storageStat: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 8,
  },
  storageBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 10,
    overflow: 'hidden',
  },
  storageBarFill: {
    height: '100%',
    backgroundColor: darkColors.secondary,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  downloadRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusIcon: {
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
  },
  itemArtist: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 3,
  },
  progressTrack: {
    height: 3,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: darkColors.secondary,
  },
  deleteBtn: {
    padding: 8,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: typography.fontSize.sm,
    color: darkColors.textTertiary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 20,
  },
});
