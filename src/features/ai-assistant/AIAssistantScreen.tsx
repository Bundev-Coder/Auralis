import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioStore } from '../../state/useAudioStore';
import { usePlaylistStore } from '../../state/usePlaylistStore';
import { AIEngine } from '../../services/ai/AIEngine';
import { AIAssistantMessage, Track } from '../../types';
import { darkColors, typography, borderRadius, spacing } from '../../theme';
import { APP_CONFIG } from '../../config/appConfig';
import { formatTime } from '../../utils/formatTime';

const SUGGESTION_CHIPS = [
  'Tạo playlist lofi 45 phút học tập',
  'Synthwave lái xe ban đêm',
  'Thư giãn sâu hạ stress',
  'Nhạc tập trung lập trình',
];

export const AIAssistantScreen: React.FC = () => {
  const { playTrack } = useAudioStore();
  const { allTracks, recentTrackIds, favoriteTrackIds, createPlaylist } = usePlaylistStore();

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<AIAssistantMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `Xin chào! Tôi là ${APP_CONFIG.ai.assistantName}. Bạn muốn nghe giai điệu thế nào hôm nay? Tôi có thể phân tích tâm trạng, bối cảnh và tạo danh sách phát tức thời cho bạn.`,
      timestamp: Date.now(),
    },
  ]);

  const handleSend = async (promptToSend?: string) => {
    const text = (promptToSend || inputPrompt).trim();
    if (!text || isLoading) return;

    setInputPrompt('');

    const userMsg: AIAssistantMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await AIEngine.processUserQuery(
        text,
        allTracks,
        recentTrackIds,
        favoriteTrackIds
      );
      setMessages((prev) => [...prev, response]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Xin lỗi, đã xảy ra sự cố khi kết nối bộ xử lý gợi ý. Vui lòng thử lại.',
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAIPlaylist = async (playlistData: { name: string; tracks: Track[] }) => {
    const created = await createPlaylist(playlistData.name, 'Tạo bởi Auralis AI');
    // Add tracks to playlist
    for (const t of playlistData.tracks) {
      // automatically saved
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.aiBadge}>
          <Ionicons name="sparkles" size={16} color={darkColors.secondary} />
          <Text style={styles.aiBadgeText}>{APP_CONFIG.ai.assistantName.toUpperCase()}</Text>
        </View>
        <Text style={styles.headerSubtitle}>Neural Music Curator & Generator</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.chatScroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Suggestion Chips */}
        <View style={styles.chipsSection}>
          <Text style={styles.chipsLabel}>PROMPT SUGGESTIONS</Text>
          <View style={styles.chipsGrid}>
            {SUGGESTION_CHIPS.map((chip, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.chip}
                onPress={() => handleSend(chip)}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={13} color={darkColors.secondary} />
                <Text style={styles.chipText}>{chip}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message Stream */}
        {messages.map((msg) => {
          const isUser = msg.role === 'user';

          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubbleWrapper,
                isUser ? styles.userBubbleWrapper : styles.assistantBubbleWrapper,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  isUser ? styles.userBubble : styles.assistantBubble,
                ]}
              >
                <Text style={[styles.messageText, isUser && styles.userMessageText]}>
                  {msg.content}
                </Text>

                {/* AI Generated Playlist Card */}
                {msg.generatedPlaylist && (
                  <View style={styles.playlistCard}>
                    <View style={styles.playlistHeader}>
                      <Ionicons name="disc" size={20} color={darkColors.secondary} />
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.playlistCardTitle}>
                          {msg.generatedPlaylist.name}
                        </Text>
                        <Text style={styles.playlistCardSub}>
                          {msg.generatedPlaylist.description}
                        </Text>
                      </View>
                    </View>

                    {/* Tracks preview list */}
                    <View style={styles.playlistTracks}>
                      {msg.generatedPlaylist.tracks.map((t, i) => (
                        <TouchableOpacity
                          key={t.id}
                          style={styles.trackItem}
                          onPress={() =>
                            playTrack(t, msg.generatedPlaylist?.tracks || [])
                          }
                        >
                          <Text style={styles.trackIndex}>{i + 1}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.trackTitle} numberOfLines={1}>
                              {t.title}
                            </Text>
                            <Text style={styles.trackArtist} numberOfLines={1}>
                              {t.artist}
                            </Text>
                          </View>
                          <Text style={styles.trackDuration}>{formatTime(t.duration)}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Action button */}
                    <TouchableOpacity
                      style={styles.playAllBtn}
                      onPress={() => {
                        const tracks = msg.generatedPlaylist?.tracks || [];
                        if (tracks.length > 0) playTrack(tracks[0], tracks);
                      }}
                    >
                      <Ionicons name="play" size={16} color={darkColors.textInverse} />
                      <Text style={styles.playAllBtnText}>Play Generated Mix</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {msg.explanation && (
                  <View style={styles.explanationBox}>
                    <Ionicons name="information-circle-outline" size={14} color={darkColors.secondary} />
                    <Text style={styles.explanationText}>{msg.explanation}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {isLoading && (
          <View style={styles.loadingBubble}>
            <ActivityIndicator size="small" color={darkColors.secondary} />
            <Text style={styles.loadingText}>Auralis AI đang thiết kế playlist...</Text>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.textInput}
          placeholder="Mô tả tâm trạng hoặc yêu cầu playlist..."
          placeholderTextColor={darkColors.textTertiary}
          value={inputPrompt}
          onChangeText={setInputPrompt}
          onSubmitEditing={() => handleSend()}
        />
        <TouchableOpacity
          style={[styles.sendBtn, !inputPrompt.trim() && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!inputPrompt.trim() || isLoading}
        >
          <Ionicons name="arrow-up" size={20} color={darkColors.textInverse} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: 48,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiBadgeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.heavy,
    color: darkColors.secondary,
    letterSpacing: 1.5,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  chatScroll: {
    paddingHorizontal: spacing.base,
    paddingTop: 16,
    paddingBottom: 110,
  },
  chipsSection: {
    marginBottom: 16,
  },
  chipsLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(19, 24, 38, 0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  chipText: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
  },
  messageBubbleWrapper: {
    marginVertical: 6,
    width: '100%',
  },
  userBubbleWrapper: {
    alignItems: 'flex-end',
  },
  assistantBubbleWrapper: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '92%',
    padding: 14,
    borderRadius: borderRadius.lg,
  },
  userBubble: {
    backgroundColor: darkColors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    backgroundColor: 'rgba(19, 24, 38, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: typography.fontSize.sm,
    color: darkColors.textPrimary,
    lineHeight: 20,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  playlistCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(7, 9, 14, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  playlistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  playlistCardTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.secondary,
  },
  playlistCardSub: {
    fontSize: 11,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  playlistTracks: {
    gap: 6,
    marginVertical: 8,
  },
  trackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  trackIndex: {
    fontSize: 11,
    color: darkColors.textTertiary,
    width: 20,
  },
  trackTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
  },
  trackArtist: {
    fontSize: 10,
    color: darkColors.textSecondary,
  },
  trackDuration: {
    fontSize: 10,
    color: darkColors.textTertiary,
  },
  playAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: darkColors.secondary,
    paddingVertical: 9,
    borderRadius: borderRadius.sm,
    marginTop: 8,
  },
  playAllBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textInverse,
  },
  explanationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  explanationText: {
    fontSize: 11,
    color: darkColors.textSecondary,
    flex: 1,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: 'rgba(19, 24, 38, 0.7)',
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginVertical: 8,
  },
  loadingText: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
  },
  inputBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(14, 17, 26, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  textInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.base,
    paddingHorizontal: 14,
    color: darkColors.textPrimary,
    fontSize: typography.fontSize.sm,
    marginRight: 10,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: darkColors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
