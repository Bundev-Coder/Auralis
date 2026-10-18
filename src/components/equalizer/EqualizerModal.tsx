import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAudioStore } from '../../state/useAudioStore';
import { DEFAULT_EQ_PRESETS, EQ_BAND_LABELS } from '../../audio/engine/equalizerPresets';
import { AudioEngine } from '../../audio/engine/AudioEngine';
import { darkColors, typography, borderRadius, spacing } from '../../theme';

interface EqualizerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const EqualizerModal: React.FC<EqualizerModalProps> = ({ visible, onClose }) => {
  const {
    equalizerPreset,
    equalizerEnabled,
    applyEqualizerPreset,
    updateEqualizerBand,
  } = useAudioStore();

  const platformStatus = AudioEngine.getEqualizerSupportStatus();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={24} color={darkColors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.titleBox}>
            <Text style={styles.title}>10-Band Equalizer</Text>
            <Text style={styles.subtitle}>Studio Sound Mastering</Text>
          </View>
          <View style={styles.switchBox}>
            <Switch
              value={equalizerEnabled}
              onValueChange={(val) => applyEqualizerPreset(equalizerPreset, val)}
              trackColor={{ false: '#1E293B', true: darkColors.secondary }}
              thumbColor={equalizerEnabled ? '#FFFFFF' : '#94A3B8'}
            />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Engine Capability Status Badge */}
          <View style={styles.statusCard}>
            <View style={styles.statusIndicator} />
            <Text style={styles.statusText}>Engine: {platformStatus.engine}</Text>
          </View>

          {/* Preset Pills */}
          <Text style={styles.sectionTitle}>AUDIO PRESETS</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.presetsRow}
          >
            {DEFAULT_EQ_PRESETS.map((p) => {
              const isSelected = equalizerPreset.id === p.id && !equalizerPreset.isCustom;
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.presetPill, isSelected && styles.presetPillActive]}
                  onPress={() => applyEqualizerPreset(p, true)}
                >
                  <Text
                    style={[styles.presetPillText, isSelected && styles.presetPillTextActive]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Preamp Dial Section */}
          <View style={styles.preampCard}>
            <View style={styles.preampHeader}>
              <Text style={styles.preampTitle}>Preamp Gain</Text>
              <Text style={styles.preampValue}>
                {equalizerPreset.preampGain > 0 ? `+${equalizerPreset.preampGain}` : equalizerPreset.preampGain} dB
              </Text>
            </View>
            <View style={styles.preampBtns}>
              <TouchableOpacity
                style={styles.preampStep}
                onPress={() => {
                  const updated = {
                    ...equalizerPreset,
                    preampGain: Math.max(-12, equalizerPreset.preampGain - 1),
                  };
                  applyEqualizerPreset(updated, equalizerEnabled);
                }}
              >
                <Text style={styles.preampStepText}>- 1 dB</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.preampStep}
                onPress={() => {
                  const updated = { ...equalizerPreset, preampGain: 0 };
                  applyEqualizerPreset(updated, equalizerEnabled);
                }}
              >
                <Text style={styles.preampStepText}>Reset 0 dB</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.preampStep}
                onPress={() => {
                  const updated = {
                    ...equalizerPreset,
                    preampGain: Math.min(12, equalizerPreset.preampGain + 1),
                  };
                  applyEqualizerPreset(updated, equalizerEnabled);
                }}
              >
                <Text style={styles.preampStepText}>+ 1 dB</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 10 Frequency Sliders */}
          <Text style={styles.sectionTitle}>FREQUENCY BANDS (-12dB to +12dB)</Text>
          <View style={styles.slidersContainer}>
            {EQ_BAND_LABELS.map((label, index) => {
              const gain = equalizerPreset.bands[index] || 0;
              // Map -12..12 dB to percentage 0..100%
              const heightPercent = ((gain + 12) / 24) * 100;

              return (
                <View key={label} style={styles.sliderCol}>
                  <Text style={styles.gainLabel}>
                    {gain > 0 ? `+${gain}` : `${gain}`}
                  </Text>

                  <View style={styles.verticalTrack}>
                    <View
                      style={[
                        styles.verticalFill,
                        {
                          height: `${heightPercent}%`,
                          backgroundColor: equalizerEnabled
                            ? darkColors.secondary
                            : darkColors.textTertiary,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.bandAdjusters}>
                    <TouchableOpacity
                      style={styles.miniBtn}
                      onPress={() => updateEqualizerBand(index, Math.min(12, gain + 1))}
                    >
                      <Ionicons name="chevron-up" size={14} color={darkColors.textPrimary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.miniBtn}
                      onPress={() => updateEqualizerBand(index, Math.max(-12, gain - 1))}
                    >
                      <Ionicons name="chevron-down" size={14} color={darkColors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.freqLabel}>{label}</Text>
                </View>
              );
            })}
          </View>
        </ScrollView>
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
  switchBox: {
    width: 40,
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 20,
    gap: 8,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: darkColors.accent,
  },
  statusText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: darkColors.accent,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 18,
  },
  presetPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  presetPillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderColor: darkColors.secondary,
  },
  presetPillText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textSecondary,
  },
  presetPillTextActive: {
    color: darkColors.secondary,
  },
  preampCard: {
    backgroundColor: 'rgba(19, 24, 38, 0.7)',
    borderRadius: borderRadius.lg,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  preampHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  preampTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
  },
  preampValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.secondary,
  },
  preampBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  preampStep: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
  },
  preampStepText: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  slidersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(19, 24, 38, 0.7)',
    borderRadius: borderRadius.lg,
    paddingVertical: 18,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sliderCol: {
    alignItems: 'center',
    flex: 1,
  },
  gainLabel: {
    fontSize: 9,
    color: darkColors.textTertiary,
    marginBottom: 6,
  },
  verticalTrack: {
    width: 6,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 3,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  verticalFill: {
    width: '100%',
    borderRadius: 3,
  },
  bandAdjusters: {
    flexDirection: 'column',
    marginTop: 6,
    gap: 2,
  },
  miniBtn: {
    padding: 2,
    alignItems: 'center',
  },
  freqLabel: {
    fontSize: 9,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textSecondary,
    marginTop: 6,
  },
});
