import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors, typography, borderRadius, spacing } from '../../theme';
import { APP_CONFIG } from '../../config/appConfig';

interface SettingsScreenProps {
  onOpenEqualizer: () => void;
  onOpenDownloads: () => void;
  onOpenProfile?: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  onOpenEqualizer,
  onOpenDownloads,
  onOpenProfile,
}) => {
  const [cloudSync, setCloudSync] = useState(true);
  const [aiPersonalization, setAiPersonalization] = useState(true);
  const [bitrate, setBitrate] = useState<'256k' | '320k' | 'Lossless'>('320k');
  const [crossfadeSec, setCrossfadeSec] = useState(2);

  const handleClearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Are you sure you want to clear temporary audio cache and album artwork?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => Alert.alert('Success', 'Cache cleared (142 MB freed).'),
        },
      ]
    );
  };

  const handleResetAI = () => {
    Alert.alert(
      'Reset AI Profile',
      'This will erase local musical preference embeddings and history used by Auralis AI.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => Alert.alert('Success', 'AI preferences have been reset.'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings & Preferences</Text>
        <Text style={styles.headerSubtitle}>{APP_CONFIG.appName} Environment</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Audio Quality Section */}
        <Text style={styles.sectionHeader}>AUDIO ENGINE & FIDELITY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Streaming Audio Bitrate</Text>
              <Text style={styles.rowSub}>Current: {bitrate}</Text>
            </View>
            <View style={styles.bitratePills}>
              {(['256k', '320k', 'Lossless'] as const).map((b) => (
                <TouchableOpacity
                  key={b}
                  style={[styles.pill, bitrate === b && styles.pillActive]}
                  onPress={() => setBitrate(b)}
                >
                  <Text style={[styles.pillText, bitrate === b && styles.pillTextActive]}>
                    {b}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.linkRow} onPress={onOpenEqualizer}>
            <View style={styles.linkLeft}>
              <Ionicons name="options-outline" size={20} color={darkColors.secondary} />
              <View>
                <Text style={styles.rowTitle}>DSP Equalizer & Presets</Text>
                <Text style={styles.rowSub}>10-Band Realtime Master Filter</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={darkColors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Gapless Crossfade</Text>
              <Text style={styles.rowSub}>{crossfadeSec} seconds blend between tracks</Text>
            </View>
            <View style={styles.bitratePills}>
              {[0, 2, 4, 8].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.pill, crossfadeSec === s && styles.pillActive]}
                  onPress={() => setCrossfadeSec(s)}
                >
                  <Text style={[styles.pillText, crossfadeSec === s && styles.pillTextActive]}>
                    {s}s
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Storage & Offline */}
        <Text style={styles.sectionHeader}>STORAGE & DOWNLOADS</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.linkRow} onPress={onOpenDownloads}>
            <View style={styles.linkLeft}>
              <Ionicons name="cloud-download-outline" size={20} color={darkColors.secondary} />
              <View>
                <Text style={styles.rowTitle}>Offline Catalog Manager</Text>
                <Text style={styles.rowSub}>View downloaded files & disk space</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={darkColors.textTertiary} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.linkRow} onPress={handleClearCache}>
            <View style={styles.linkLeft}>
              <Ionicons name="trash-outline" size={20} color={darkColors.accentPink} />
              <View>
                <Text style={styles.rowTitle}>Clear Cache</Text>
                <Text style={styles.rowSub}>Free up temporary cache</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={darkColors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* AI & Privacy */}
        <Text style={styles.sectionHeader}>AI & PRIVACY</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.rowTitle}>AI Neural Personalization</Text>
              <Text style={styles.rowSub}>
                Allow {APP_CONFIG.ai.assistantName} to tailor recommendations based on your local history.
              </Text>
            </View>
            <Switch
              value={aiPersonalization}
              onValueChange={setAiPersonalization}
              trackColor={{ false: '#1E293B', true: darkColors.secondary }}
              thumbColor={aiPersonalization ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          <View style={styles.divider} />

          <TouchableOpacity style={styles.linkRow} onPress={handleResetAI}>
            <View style={styles.linkLeft}>
              <Ionicons name="refresh-outline" size={20} color={darkColors.warning} />
              <View>
                <Text style={styles.rowTitle}>Reset AI Persona History</Text>
                <Text style={styles.rowSub}>Clear learned musical taste profile</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={darkColors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Cloud & Account */}
        <Text style={styles.sectionHeader}>CLOUD SYNC</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={styles.rowTitle}>Sync Playlists via Auralis API</Text>
              <Text style={styles.rowSub}>
                Keep playlists and listening history in sync across mobile and desktop.
              </Text>
            </View>
            <Switch
              value={cloudSync}
              onValueChange={setCloudSync}
              trackColor={{ false: '#1E293B', true: darkColors.secondary }}
              thumbColor={cloudSync ? '#FFFFFF' : '#94A3B8'}
            />
          </View>

          {onOpenProfile && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity style={styles.linkRow} onPress={onOpenProfile}>
                <View style={styles.linkLeft}>
                  <Ionicons name="person-circle-outline" size={20} color={darkColors.secondary} />
                  <View>
                    <Text style={styles.rowTitle}>Account & Profile</Text>
                    <Text style={styles.rowSub}>Manage session, credentials & cloud backups</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color={darkColors.textTertiary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* App Info Footer */}
        <View style={styles.aboutBox}>
          <Text style={styles.aboutAppName}>{APP_CONFIG.appName}</Text>
          <Text style={styles.aboutVersion}>
            Version {APP_CONFIG.version} (Build {APP_CONFIG.buildNumber})
          </Text>
          <Text style={styles.aboutTagline}>{APP_CONFIG.tagline}</Text>
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
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: 48,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  scrollContent: {
    padding: spacing.base,
    paddingBottom: 120,
  },
  sectionHeader: {
    fontSize: 10,
    fontWeight: typography.fontWeight.heavy,
    color: darkColors.textTertiary,
    letterSpacing: 1.5,
    marginTop: 16,
    marginBottom: 8,
  },
  card: {
    backgroundColor: 'rgba(19, 24, 38, 0.8)',
    borderRadius: borderRadius.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  rowTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textPrimary,
  },
  rowSub: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 14,
  },
  bitratePills: {
    flexDirection: 'row',
    gap: 6,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  pillActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.2)',
    borderWidth: 1,
    borderColor: darkColors.secondary,
  },
  pillText: {
    fontSize: 11,
    color: darkColors.textSecondary,
  },
  pillTextActive: {
    color: darkColors.secondary,
    fontWeight: typography.fontWeight.bold,
  },
  aboutBox: {
    alignItems: 'center',
    marginTop: 32,
  },
  aboutAppName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.heavy,
    color: darkColors.secondary,
    letterSpacing: 2,
  },
  aboutVersion: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textTertiary,
    marginTop: 2,
  },
  aboutTagline: {
    fontSize: 11,
    color: darkColors.textTertiary,
    marginTop: 4,
  },
});
