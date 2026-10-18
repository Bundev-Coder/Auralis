import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioStore } from '../../state/useAudioStore';
import { darkColors, typography, borderRadius, spacing } from '../../theme';
import { formatTime } from '../../utils/formatTime';

interface QueueModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QueueModal: React.FC<QueueModalProps> = ({ visible, onClose }) => {
  const { queue, currentIndex, playTrack, removeFromQueue } = useAudioStore();

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
            <Text style={styles.title}>Play Queue</Text>
            <Text style={styles.subtitle}>{queue.length} tracks</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        {/* Queue List */}
        <FlatList
          data={queue}
          keyExtractor={(item, idx) => `${item.id}-${idx}`}
          contentContainerStyle={styles.listContent}
          renderItem={({ item, index }) => {
            const isPlayingThis = index === currentIndex;

            return (
              <View
                style={[styles.itemRow, isPlayingThis && styles.activeItemRow]}
              >
                <TouchableOpacity
                  style={styles.itemMain}
                  onPress={() => playTrack(item, queue)}
                >
                  <View style={styles.indexBox}>
                    {isPlayingThis ? (
                      <Ionicons name="volume-high" size={16} color={darkColors.secondary} />
                    ) : (
                      <Text style={styles.indexText}>{index + 1}</Text>
                    )}
                  </View>

                  <View style={styles.artBox}>
                    {item.artworkUri ? (
                      <Image source={{ uri: item.artworkUri }} style={styles.art} />
                    ) : (
                      <View style={[styles.art, styles.artFallback]}>
                        <Ionicons name="musical-note" size={14} color={darkColors.primary} />
                      </View>
                    )}
                  </View>

                  <View style={styles.infoBox}>
                    <Text
                      style={[styles.itemTitle, isPlayingThis && styles.activeTitle]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    <Text style={styles.itemArtist} numberOfLines={1}>
                      {item.artist}
                    </Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.rightActions}>
                  <Text style={styles.itemDuration}>{formatTime(item.duration)}</Text>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeFromQueue(index)}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={darkColors.textTertiary} />
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
              <Ionicons name="musical-notes-outline" size={48} color={darkColors.textTertiary} />
              <Text style={styles.emptyText}>Queue is empty</Text>
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
    backgroundColor: '#0E111A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: 20,
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
  listContent: {
    padding: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: borderRadius.md,
    marginVertical: 2,
  },
  activeItemRow: {
    backgroundColor: 'rgba(0, 242, 254, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: darkColors.secondary,
  },
  itemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  indexBox: {
    width: 24,
    alignItems: 'center',
  },
  indexText: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textTertiary,
  },
  artBox: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    marginLeft: 8,
    backgroundColor: '#1E293B',
  },
  art: {
    width: '100%',
    height: '100%',
  },
  artFallback: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
  },
  infoBox: {
    marginLeft: 12,
    flex: 1,
  },
  itemTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
  },
  activeTitle: {
    color: darkColors.secondary,
  },
  itemArtist: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  itemDuration: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textTertiary,
  },
  removeBtn: {
    padding: 4,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    color: darkColors.textTertiary,
    marginTop: 12,
  },
});
