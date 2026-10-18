import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors, typography, borderRadius } from '../../theme';
import { APP_CONFIG } from '../../config/appConfig';

interface OnboardingModalProps {
  visible: boolean;
  onComplete: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDES = [
  {
    id: 'slide-1',
    icon: 'options-outline',
    badge: 'STUDIO FIDELITY',
    title: '10-Band DSP Equalizer',
    desc: 'Shape your acoustic spectrum with high-precision biquad filters, 7 studio master presets, and preamp gain calibration.',
    highlights: ['True Web Audio & Native DSP', 'Lossless 320kbps Stream Quality', 'Zero Lag Gapless Engine'],
  },
  {
    id: 'slide-2',
    icon: 'folder-open-outline',
    badge: 'UNIVERSAL FREEDOM',
    title: 'Local & Cloud Harmony',
    desc: 'Seamlessly import high-res audio files (FLAC, MP3, M4A) directly from your device storage into unified playlists alongside legal streaming.',
    highlights: ['Storage Access Framework', 'Offline Downloads Manager', 'No Forced Account Required'],
  },
  {
    id: 'slide-3',
    icon: 'sparkles-outline',
    badge: 'NEURAL CURATOR',
    title: APP_CONFIG.ai.assistantName,
    desc: 'Generate perfect mood playlists using natural language prompts. Every track is verified against real catalog sources — zero AI hallucinations.',
    highlights: ['Contextual Prompt Curation', 'On-Device Privacy First', 'Automated Smart Playlists'],
  },
];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({ visible, onComplete }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleNext = () => {
    if (currentSlideIndex < SLIDES.length - 1) {
      setCurrentSlideIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    try {
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        localStorage.setItem('auralis_onboarded', 'true');
      }
    } catch {
      // ignore
    }
    onComplete();
  };

  const slide = SLIDES[currentSlideIndex];

  return (
    <Modal
      visible={visible}
      animationType="fade"
      presentationStyle="fullScreen"
      onRequestClose={handleFinish}
    >
      <View style={styles.container}>
        {/* Top Skip Button */}
        <View style={styles.topBar}>
          <Text style={styles.brandText}>{APP_CONFIG.appName}</Text>
          <TouchableOpacity onPress={handleFinish} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Slide Content */}
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Ionicons name={slide.icon as any} size={48} color={darkColors.secondary} />
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>{slide.badge}</Text>
          </View>

          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.desc}>{slide.desc}</Text>

          {/* Highlights checklist */}
          <View style={styles.highlightsBox}>
            {slide.highlights.map((h, i) => (
              <View key={i} style={styles.highlightRow}>
                <Ionicons name="checkmark-circle" size={16} color={darkColors.accent} />
                <Text style={styles.highlightText}>{h}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Pagination & Action */}
        <View style={styles.bottomBar}>
          <View style={styles.paginationDots}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  currentSlideIndex === i && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <TouchableOpacity style={styles.actionBtn} onPress={handleNext}>
            <Text style={styles.actionBtnText}>
              {currentSlideIndex === SLIDES.length - 1 ? 'Launch Auralis' : 'Continue'}
            </Text>
            <Ionicons
              name={currentSlideIndex === SLIDES.length - 1 ? 'play' : 'arrow-forward'}
              size={18}
              color={darkColors.textInverse}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.heavy,
    color: darkColors.textPrimary,
    letterSpacing: 3,
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    color: darkColors.textTertiary,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.primary,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 26,
    fontWeight: typography.fontWeight.heavy,
    color: darkColors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  desc: {
    fontSize: typography.fontSize.sm,
    color: darkColors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  highlightsBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 16,
    gap: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  highlightText: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paginationDots: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dotActive: {
    width: 24,
    backgroundColor: darkColors.secondary,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: darkColors.secondary,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: borderRadius.pill,
  },
  actionBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textInverse,
  },
});
