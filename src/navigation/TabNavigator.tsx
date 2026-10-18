import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { HomeScreen } from '../features/home/HomeScreen';
import { DiscoverScreen } from '../features/discover/DiscoverScreen';
import { LibraryScreen } from '../features/library/LibraryScreen';
import { AIAssistantScreen } from '../features/ai-assistant/AIAssistantScreen';
import { MediaStudioScreen } from '../features/studio/MediaStudioScreen';
import { OmniToolsScreen } from '../features/omnitools/OmniToolsScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { MiniPlayer } from '../components/player/MiniPlayer';
import { NowPlayingModal } from '../components/player/NowPlayingModal';
import { EqualizerModal } from '../components/equalizer/EqualizerModal';
import { DownloadsModal } from '../components/downloads/DownloadsModal';
import { ProfileModal } from '../components/profile/ProfileModal';
import { darkColors, typography } from '../theme';

export type TabKey = 'home' | 'library' | 'studio' | 'tools' | 'settings';

export const TabNavigator: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [showNowPlaying, setShowNowPlaying] = useState(false);
  const [showEqualizer, setShowEqualizer] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onOpenEqualizer={() => setShowEqualizer(true)}
            onOpenDownloads={() => setShowDownloads(true)}
            onOpenSettings={() => setActiveTab('settings')}
            onNavigateToAI={() => setActiveTab('studio')}
            onOpenProfile={() => setShowProfile(true)}
          />
        );
      case 'library':
        return <LibraryScreen />;
      case 'studio':
        return <MediaStudioScreen />;
      case 'tools':
        return <OmniToolsScreen />;
      case 'settings':
        return (
          <SettingsScreen
            onOpenEqualizer={() => setShowEqualizer(true)}
            onOpenDownloads={() => setShowDownloads(true)}
            onOpenProfile={() => setShowProfile(true)}
          />
        );
    }
  };

  const navItems = [
    { key: 'home', label: 'Trang Chủ', icon: 'musical-notes', iconOutline: 'musical-notes-outline' },
    { key: 'library', label: 'Thư Viện', icon: 'library', iconOutline: 'library-outline' },
    { key: 'studio', label: 'Media Studio', icon: 'film', iconOutline: 'film-outline' },
    { key: 'tools', label: 'OmniTools', icon: 'apps', iconOutline: 'apps-outline' },
    { key: 'settings', label: 'Cài Đặt', icon: 'settings', iconOutline: 'settings-outline' },
  ] as const;

  return (
    <View style={styles.container}>
      {/* Screen Area */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Mini Player Docked Above Navigation */}
      <View style={styles.dockedMiniPlayer}>
        <MiniPlayer onExpand={() => setShowNowPlaying(true)} />
      </View>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        {navItems.map((item) => {
          const isActive = activeTab === item.key;

          return (
            <TouchableOpacity
              key={item.key}
              style={styles.tabButton}
              onPress={() => setActiveTab(item.key)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? (item.icon as any) : (item.iconOutline as any)}
                size={22}
                color={isActive ? darkColors.secondary : darkColors.textTertiary}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Full-Screen Modals */}
      <NowPlayingModal
        visible={showNowPlaying}
        onClose={() => setShowNowPlaying(false)}
      />

      <EqualizerModal
        visible={showEqualizer}
        onClose={() => setShowEqualizer(false)}
      />

      <DownloadsModal
        visible={showDownloads}
        onClose={() => setShowDownloads(false)}
      />

      <ProfileModal
        visible={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
  screenContainer: {
    flex: 1,
  },
  dockedMiniPlayer: {
    position: 'absolute',
    bottom: 60,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  tabBar: {
    height: 64,
    flexDirection: 'row',
    backgroundColor: 'rgba(11, 13, 20, 0.98)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 8,
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: typography.fontWeight.medium,
    color: darkColors.textTertiary,
    marginTop: 4,
  },
  tabLabelActive: {
    color: darkColors.secondary,
    fontWeight: typography.fontWeight.bold,
  },
});
