import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioStore } from '../../state/useAudioStore';
import { usePlaylistStore } from '../../state/usePlaylistStore';
import { AIAssistantScreen } from '../ai-assistant/AIAssistantScreen';
import { Track } from '../../types';
import { darkColors, typography, borderRadius, spacing } from '../../theme';

type StudioSubTab = 'downloader' | 'tts' | 'assistant';

interface ExtractedMedia {
  platform: 'tiktok' | 'youtube' | 'douyin' | 'soundcloud' | 'facebook';
  title: string;
  author: string;
  duration: number; // in sec
  coverUri: string;
  audioUrl: string;
  videoUrl?: string;
  bitrate: string;
  fileSizeBytes: number;
}

const VOICE_PRESETS = [
  { id: 'google_vi', name: 'Chị Google', gender: 'Nữ', tag: 'Chuẩn Việt', icon: 'mic' },
  { id: 'reviewer_viral', name: 'Reviewer Phim', gender: 'Nam', tag: 'Trầm Ấm Viral', icon: 'film' },
  { id: 'female_south', name: 'Nữ Nam Bộ', gender: 'Nữ', tag: 'Dịu Dàng', icon: 'heart' },
  { id: 'male_north', name: 'Nam Bắc Bộ', gender: 'Nam', tag: 'Thời Sự / Podcast', icon: 'radio' },
  { id: 'story_epic', name: 'Kiếm Hiệp / Kể Chuyện', gender: 'Nam', tag: 'Hào Hùng', icon: 'book' },
  { id: 'cyber_robot', name: 'Cyber Robot', gender: 'AI', tag: 'Tương Lai', icon: 'hardware-chip' },
];

const SCRIPT_TEMPLATES = [
  {
    label: '🎬 Review Phim',
    text: 'Chào mừng các bạn đã quay trở lại với kênh tóm tắt phim đỉnh cao. Hôm nay chúng ta sẽ cùng khám phá một siêu phẩm giật gân khiến người xem phải nín thở từng giây...',
  },
  {
    label: '📢 Thông Báo',
    text: 'Xin trân trọng thông báo đến toàn thể thành viên. Bản cập nhật mới nhất đã chính thức phát hành với hàng loạt tính năng siêu việt và bảo mật nâng cao.',
  },
  {
    label: '🧘 Thiền Thư Giãn',
    text: 'Hãy nhắm mắt lại, hít một hơi thật sâu và từ từ thở ra. Để mọi mệt mỏi và âu lo tan biến theo từng nốt nhạc êm dịu xung quanh bạn...',
  },
];

export const MediaStudioScreen: React.FC = () => {
  const { playTrack } = useAudioStore();
  const { addCustomTrack } = usePlaylistStore();

  const [activeTab, setActiveTab] = useState<StudioSubTab>('downloader');

  // --- Downloader State ---
  const [inputUrl, setInputUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedMedia, setExtractedMedia] = useState<ExtractedMedia | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);

  // --- TTS State ---
  const [ttsText, setTtsText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('reviewer_viral');
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [isSynthesizing, setIsSynthesizing] = useState(false);

  // --- Handle Media Extraction ---
  const handleExtractMedia = () => {
    const url = inputUrl.trim();
    if (!url) {
      Alert.alert('Chưa nhập liên kết', 'Vui lòng dán link TikTok, Douyin, YouTube hoặc SoundCloud để tiếp tục.');
      return;
    }

    setIsExtracting(true);
    setExtractedMedia(null);

    setTimeout(() => {
      setIsExtracting(false);

      const isTikTok = url.includes('tiktok.com') || url.includes('douyin.com');
      const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

      const mockData: ExtractedMedia = {
        platform: isTikTok ? 'tiktok' : isYouTube ? 'youtube' : 'soundcloud',
        title: isTikTok
          ? 'Trendy Phonk & Viral Dance Beat (No Watermark)'
          : isYouTube
          ? 'Deep Focus Lo-Fi Chill Beats for Midnight Code'
          : 'Melodic Ambient Dreamscape',
        author: isTikTok ? '@viral_creator_vn' : isYouTube ? 'Lofi Girl / Studio Auralis' : 'SoundCloud Artist',
        duration: isTikTok ? 95 : 240,
        coverUri: isTikTok
          ? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'
          : 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
        audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112191.mp3',
        videoUrl: isTikTok ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' : undefined,
        bitrate: '320 kbps',
        fileSizeBytes: 1024 * 1024 * 6.5,
      };

      setExtractedMedia(mockData);
    }, 1200);
  };

  // --- Download & Add to Auralis Library ---
  const handleDownloadAndPlay = async (asAudio = true) => {
    if (!extractedMedia) return;

    setDownloadProgress(0.1);
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev === null) return 0.2;
        if (prev >= 0.9) {
          clearInterval(interval);
          finishDownload(asAudio);
          return 1.0;
        }
        return prev + 0.25;
      });
    }, 250);
  };

  const finishDownload = async (asAudio: boolean) => {
    if (!extractedMedia) return;
    setDownloadProgress(null);

    const newTrack: Track = {
      id: `download-${Date.now()}`,
      title: extractedMedia.title,
      artist: extractedMedia.author,
      album: `${extractedMedia.platform.toUpperCase()} Studio Grab`,
      duration: extractedMedia.duration,
      artworkUri: extractedMedia.coverUri,
      sourceUri: extractedMedia.audioUrl,
      sourceType: 'downloaded',
      isLocal: true,
      bitrate: extractedMedia.bitrate,
      format: 'mp3',
      genre: 'Downloaded Media',
      addedAt: Date.now(),
      fileSizeBytes: extractedMedia.fileSizeBytes,
    };

    await addCustomTrack(newTrack);

    Alert.alert(
      'Tải Về Thành Công!',
      `Đã lưu "${extractedMedia.title}" vào Thư viện Auralis. Bạn có muốn phát ngay bây giờ?`,
      [
        { text: 'Để sau', style: 'cancel' },
        {
          text: 'Phát Ngay',
          onPress: () => playTrack(newTrack),
        },
      ]
    );
  };

  // --- TTS Generation ---
  const handleSynthesizeTTS = () => {
    const text = ttsText.trim();
    if (!text) {
      Alert.alert('Nội dung trống', 'Vui lòng nhập văn bản hoặc chọn kịch bản mẫu.');
      return;
    }

    setIsSynthesizing(true);
    setTimeout(async () => {
      setIsSynthesizing(false);

      const voice = VOICE_PRESETS.find((v) => v.id === selectedVoice);
      const voiceTrack: Track = {
        id: `tts-${Date.now()}`,
        title: text.slice(0, 32) + (text.length > 32 ? '...' : ''),
        artist: `AI Voice: ${voice?.name || 'CapCut'} (${speechSpeed}x)`,
        album: 'CapCut AI Voice Studio',
        duration: Math.max(15, Math.floor(text.split(' ').length * 0.45)),
        artworkUri: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
        sourceUri: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=atmospheric-piano-20626.mp3',
        sourceType: 'downloaded',
        isLocal: true,
        bitrate: '256 kbps',
        format: 'mp3',
        genre: 'AI Voiceover',
        addedAt: Date.now(),
      };

      await addCustomTrack(voiceTrack);

      Alert.alert(
        'Đã Tạo Giọng Đọc Thành Công!',
        `Audio đã được lồng tiếng bằng ${voice?.name} (${speechSpeed}x) và thêm vào danh sách phát.`,
        [
          { text: 'Đóng', style: 'cancel' },
          { text: 'Nghe Ngay', onPress: () => playTrack(voiceTrack) },
        ]
      );
    }, 1500);
  };

  const handleShareAudio = async () => {
    try {
      await Share.share({
        message: `Nghe bản thu âm lồng tiếng AI tạo từ Auralis Media Studio: ${ttsText.slice(0, 80)}...`,
        title: 'Auralis AI Voice Export',
      });
    } catch {
      // Ignored
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View>
          <View style={styles.titleRow}>
            <Text style={styles.headerTitle}>Media &amp; AI Studio</Text>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>ULTRA</Text>
            </View>
          </View>
          <Text style={styles.headerSubtitle}>Tải video/nhạc không logo &amp; Lồng tiếng CapCut AI</Text>
        </View>
      </View>

      {/* Subtab Segment Switcher */}
      <View style={styles.segmentBar}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'downloader' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('downloader')}
        >
          <Ionicons
            name="cloud-download"
            size={16}
            color={activeTab === 'downloader' ? '#00F2FE' : darkColors.textTertiary}
          />
          <Text style={[styles.segmentText, activeTab === 'downloader' && styles.segmentTextActive]}>
            Downloader
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'tts' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('tts')}
        >
          <Ionicons
            name="mic"
            size={16}
            color={activeTab === 'tts' ? '#EC4899' : darkColors.textTertiary}
          />
          <Text style={[styles.segmentText, activeTab === 'tts' && styles.segmentTextActive]}>
            CapCut TTS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'assistant' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('assistant')}
        >
          <Ionicons
            name="sparkles"
            size={16}
            color={activeTab === 'assistant' ? '#8B5CF6' : darkColors.textTertiary}
          />
          <Text style={[styles.segmentText, activeTab === 'assistant' && styles.segmentTextActive]}>
            AI Music Chat
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      {activeTab === 'assistant' ? (
        <AIAssistantScreen />
      ) : activeTab === 'downloader' ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Card: URL Input */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Dán Liên Kết Cần Trích Xuất</Text>
            <Text style={styles.cardSubtitle}>
              Hỗ trợ TikTok (sạch logo), Douyin, YouTube, SoundCloud, Facebook Reels
            </Text>

            <View style={styles.inputContainer}>
              <Ionicons name="link" size={20} color={darkColors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Dán link https://www.tiktok.com/... hoặc youtube..."
                placeholderTextColor={darkColors.textTertiary}
                value={inputUrl}
                onChangeText={setInputUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {inputUrl.length > 0 && (
                <TouchableOpacity onPress={() => setInputUrl('')}>
                  <Ionicons name="close-circle" size={18} color={darkColors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Demo Links */}
            <View style={styles.quickLinksRow}>
              <Text style={styles.quickLinkLabel}>Thử nhanh:</Text>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => setInputUrl('https://www.tiktok.com/@trend/video/7382910')}
              >
                <Text style={styles.quickChipText}>TikTok Viral</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickChip}
                onPress={() => setInputUrl('https://www.youtube.com/watch?v=jfKfPfyJRdk')}
              >
                <Text style={styles.quickChipText}>YouTube Lo-Fi</Text>
              </TouchableOpacity>
            </View>

            {/* Action Button */}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={handleExtractMedia}
              disabled={isExtracting}
            >
              {isExtracting ? (
                <ActivityIndicator color="#07090E" size="small" />
              ) : (
                <>
                  <Ionicons name="flash" size={18} color="#07090E" />
                  <Text style={styles.actionBtnText}>Trích Xuất Siêu Tốc</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Extracted Preview Card */}
          {extractedMedia && (
            <View style={styles.mediaCard}>
              <View style={styles.mediaRow}>
                <Image source={{ uri: extractedMedia.coverUri }} style={styles.mediaCover} />
                <View style={styles.mediaMeta}>
                  <View style={styles.badgeRow}>
                    <View style={styles.platformBadge}>
                      <Text style={styles.platformBadgeText}>{extractedMedia.platform.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.qualityText}>{extractedMedia.bitrate}</Text>
                  </View>
                  <Text style={styles.mediaTitle} numberOfLines={2}>
                    {extractedMedia.title}
                  </Text>
                  <Text style={styles.mediaAuthor}>{extractedMedia.author}</Text>
                </View>
              </View>

              {downloadProgress !== null && (
                <View style={styles.progressBox}>
                  <Text style={styles.progressText}>
                    Đang tải về: {Math.round(downloadProgress * 100)}%
                  </Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${downloadProgress * 100}%` }]} />
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.buttonGrid}>
                <TouchableOpacity
                  style={styles.downloadAudioBtn}
                  onPress={() => handleDownloadAndPlay(true)}
                  disabled={downloadProgress !== null}
                >
                  <Ionicons name="musical-notes" size={18} color="#FFFFFF" />
                  <Text style={styles.downloadBtnText}>Lưu MP3 Vào Auralis</Text>
                </TouchableOpacity>

                {extractedMedia.videoUrl && (
                  <TouchableOpacity
                    style={styles.downloadVideoBtn}
                    onPress={() => handleDownloadAndPlay(false)}
                    disabled={downloadProgress !== null}
                  >
                    <Ionicons name="videocam" size={18} color="#00F2FE" />
                    <Text style={[styles.downloadBtnText, { color: '#00F2FE' }]}>Video Sạch Logo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Feature Highlights */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={styles.featureItemText}>Triệt tiêu 100% Logo &amp; Watermark TikTok/Douyin</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="disc" size={20} color="#00F2FE" />
              <Text style={styles.featureItemText}>Tự động nhúng Cover Art chất lượng cao vào file nhạc</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="phone-portrait" size={20} color="#EC4899" />
              <Text style={styles.featureItemText}>Nghe nền khi khóa màn hình iPhone không lo gián đoạn</Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        /* TTS Tab */
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Card: Text Input */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Soạn Kịch Bản Lồng Tiếng CapCut AI</Text>
            <Text style={styles.cardSubtitle}>
              Chuyển văn bản thành giọng đọc truyền cảm với công nghệ âm thanh ByteDance
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder="Nhập nội dung bạn muốn lồng tiếng vào đây..."
              placeholderTextColor={darkColors.textTertiary}
              value={ttsText}
              onChangeText={setTtsText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {/* Template Chips */}
            <Text style={styles.sectionLabel}>Mẫu kịch bản có sẵn:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll}>
              {SCRIPT_TEMPLATES.map((tmpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.templateChip}
                  onPress={() => setTtsText(tmpl.text)}
                >
                  <Text style={styles.templateChipText}>{tmpl.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Voice Selection */}
            <Text style={styles.sectionLabel}>Chọn Giọng Đọc AI:</Text>
            <View style={styles.voiceGrid}>
              {VOICE_PRESETS.map((v) => {
                const isSelected = selectedVoice === v.id;
                return (
                  <TouchableOpacity
                    key={v.id}
                    style={[styles.voiceCard, isSelected && styles.voiceCardActive]}
                    onPress={() => setSelectedVoice(v.id)}
                  >
                    <View style={[styles.voiceIconBox, isSelected && styles.voiceIconBoxActive]}>
                      <Ionicons
                        name={v.icon as any}
                        size={18}
                        color={isSelected ? '#07090E' : darkColors.secondary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.voiceName, isSelected && styles.voiceNameActive]}>
                        {v.name}
                      </Text>
                      <Text style={styles.voiceTag}>{v.tag}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Speed Adjuster */}
            <View style={styles.speedRow}>
              <Text style={styles.speedLabel}>Tốc độ đọc: {speechSpeed}x</Text>
              <View style={styles.speedPills}>
                {[0.75, 1.0, 1.25, 1.5].map((speed) => (
                  <TouchableOpacity
                    key={speed}
                    style={[styles.speedPill, speechSpeed === speed && styles.speedPillActive]}
                    onPress={() => setSpeechSpeed(speed)}
                  >
                    <Text
                      style={[
                        styles.speedPillText,
                        speechSpeed === speed && styles.speedPillTextActive,
                      ]}
                    >
                      {speed}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* TTS Action Buttons */}
            <View style={styles.ttsButtonRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleSynthesizeTTS}
                disabled={isSynthesizing}
              >
                {isSynthesizing ? (
                  <ActivityIndicator color="#07090E" size="small" />
                ) : (
                  <>
                    <Ionicons name="play-circle" size={18} color="#07090E" />
                    <Text style={styles.actionBtnText}>Tạo Giọng &amp; Lưu Vào Thư Viện</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.shareBtn} onPress={handleShareAudio}>
                <Ionicons name="share-social-outline" size={20} color={darkColors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: 50,
    paddingBottom: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  proBadge: {
    backgroundColor: '#00F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  proBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: '#07090E',
  },
  headerSubtitle: {
    fontSize: 12,
    color: darkColors.textTertiary,
    marginTop: 2,
  },
  segmentBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    padding: 3,
    marginBottom: spacing.md,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    gap: 6,
  },
  segmentBtnActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    color: darkColors.textTertiary,
  },
  segmentTextActive: {
    color: darkColors.textPrimary,
    fontWeight: typography.fontWeight.bold,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
    gap: spacing.md,
  },
  card: {
    backgroundColor: 'rgba(18, 22, 34, 0.75)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 12,
    color: darkColors.textTertiary,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 9, 14, 0.8)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing.xs,
  },
  inputIcon: {
    marginRight: spacing.xs,
  },
  textInput: {
    flex: 1,
    height: 44,
    color: darkColors.textPrimary,
    fontSize: 13,
  },
  quickLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: spacing.xs,
  },
  quickLinkLabel: {
    fontSize: 11,
    color: darkColors.textTertiary,
  },
  quickChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  quickChipText: {
    fontSize: 11,
    color: darkColors.secondary,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#00F2FE',
    borderRadius: borderRadius.md,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: spacing.xs,
  },
  actionBtnText: {
    color: '#07090E',
    fontWeight: typography.fontWeight.bold,
    fontSize: 13,
  },
  mediaCard: {
    backgroundColor: 'rgba(18, 22, 34, 0.9)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.25)',
  },
  mediaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  mediaCover: {
    width: 76,
    height: 76,
    borderRadius: borderRadius.sm,
  },
  mediaMeta: {
    flex: 1,
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  platformBadge: {
    backgroundColor: '#FF0050',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  platformBadgeText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  qualityText: {
    fontSize: 11,
    color: '#00F2FE',
    fontWeight: typography.fontWeight.medium,
  },
  mediaTitle: {
    fontSize: 14,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  mediaAuthor: {
    fontSize: 12,
    color: darkColors.textTertiary,
    marginTop: 2,
  },
  progressBox: {
    marginTop: spacing.sm,
  },
  progressText: {
    fontSize: 11,
    color: '#00F2FE',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00F2FE',
  },
  buttonGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  downloadAudioBtn: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    borderRadius: borderRadius.md,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  downloadVideoBtn: {
    flex: 1,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderRadius: borderRadius.md,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.3)',
  },
  downloadBtnText: {
    fontSize: 12,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  featuresList: {
    backgroundColor: 'rgba(18, 22, 34, 0.5)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureItemText: {
    fontSize: 12,
    color: darkColors.textSecondary,
  },
  textArea: {
    backgroundColor: 'rgba(7, 9, 14, 0.8)',
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    color: darkColors.textPrimary,
    fontSize: 13,
    minHeight: 80,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: typography.fontWeight.medium,
    color: darkColors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: 6,
  },
  templateScroll: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  templateChip: {
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    marginRight: 8,
  },
  templateChipText: {
    fontSize: 11,
    color: '#EC4899',
    fontWeight: typography.fontWeight.medium,
  },
  voiceGrid: {
    gap: 6,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(7, 9, 14, 0.6)',
    borderRadius: borderRadius.md,
    padding: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  voiceCardActive: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    borderColor: '#EC4899',
  },
  voiceIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceIconBoxActive: {
    backgroundColor: '#EC4899',
  },
  voiceName: {
    fontSize: 13,
    fontWeight: typography.fontWeight.medium,
    color: darkColors.textPrimary,
  },
  voiceNameActive: {
    color: '#EC4899',
    fontWeight: typography.fontWeight.bold,
  },
  voiceTag: {
    fontSize: 10,
    color: darkColors.textTertiary,
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  speedLabel: {
    fontSize: 12,
    color: darkColors.textSecondary,
  },
  speedPills: {
    flexDirection: 'row',
    gap: 4,
  },
  speedPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  speedPillActive: {
    backgroundColor: '#EC4899',
  },
  speedPillText: {
    fontSize: 11,
    color: darkColors.textTertiary,
  },
  speedPillTextActive: {
    color: '#FFFFFF',
    fontWeight: typography.fontWeight.bold,
  },
  ttsButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: spacing.sm,
  },
  shareBtn: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
});
