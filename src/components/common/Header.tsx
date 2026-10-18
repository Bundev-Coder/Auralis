import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors, typography, spacing } from '../../theme';
import { APP_CONFIG } from '../../config/appConfig';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onOpenEqualizer?: () => void;
  onOpenDownloads?: () => void;
  onOpenSettings?: () => void;
  onOpenProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  subtitle,
  onOpenEqualizer,
  onOpenDownloads,
  onOpenSettings,
  onOpenProfile,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleContainer}>
        <View style={styles.brandRow}>
          <Text style={styles.brandTitle}>{title || APP_CONFIG.appName}</Text>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>PRO</Text>
          </View>
        </View>
        <Text style={styles.subtitle}>{subtitle || APP_CONFIG.tagline}</Text>
      </View>

      <View style={styles.actionRow}>
        {onOpenEqualizer && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onOpenEqualizer}
            accessibilityLabel="Equalizer"
          >
            <Ionicons name="options-outline" size={20} color={darkColors.textPrimary} />
          </TouchableOpacity>
        )}

        {onOpenDownloads && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onOpenDownloads}
            accessibilityLabel="Downloads"
          >
            <Ionicons name="cloud-download-outline" size={20} color={darkColors.textPrimary} />
          </TouchableOpacity>
        )}

        {onOpenSettings && (
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onOpenSettings}
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={20} color={darkColors.textPrimary} />
          </TouchableOpacity>
        )}

        {onOpenProfile && (
          <TouchableOpacity
            style={[styles.iconButton, styles.profileBtn]}
            onPress={onOpenProfile}
            accessibilityLabel="Account Profile"
          >
            <Ionicons name="person-circle-outline" size={22} color={darkColors.secondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: 12,
    paddingBottom: 16,
  },
  titleContainer: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.heavy,
    color: darkColors.textPrimary,
    letterSpacing: 2,
  },
  brandBadge: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1,
    borderColor: darkColors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  brandBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.secondary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileBtn: {
    borderColor: 'rgba(0, 242, 254, 0.3)',
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
  },
});
