import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api/apiClient';
import { usePlaylistStore } from '../../state/usePlaylistStore';
import { UserProfile } from '../../types';
import { darkColors, typography, borderRadius } from '../../theme';
import { APP_CONFIG } from '../../config/appConfig';

interface ProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ visible, onClose }) => {
  const { playlists } = usePlaylistStore();

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthMode, setIsAuthMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      checkExistingSession();
    }
  }, [visible]);

  const checkExistingSession = async () => {
    try {
      const profile = await apiClient.getProfile();
      if (profile) {
        setCurrentUser(profile);
      }
    } catch {
      // offline / not logged in
    }
  };

  const handleAuthSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Required Fields', 'Please enter both email and password.');
      return;
    }

    try {
      setIsLoading(true);
      if (isAuthMode === 'register') {
        const res = await apiClient.register(email, password, displayName || 'Auralis Explorer');
        setCurrentUser(res.user);
        Alert.alert('Welcome!', `Account created for ${res.user.displayName}`);
      } else {
        const res = await apiClient.login(email, password);
        setCurrentUser(res.user);
        Alert.alert('Signed In', `Welcome back, ${res.user.displayName}!`);
      }
    } catch (err: any) {
      Alert.alert('Authentication Failed', err.message || 'Please verify credentials or server status.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    setEmail('audiophile@auralis.audio');
    setPassword('neural2026');
    setDisplayName('Cyber Listener');
    try {
      setIsLoading(true);
      const res = await apiClient.login('audiophile@auralis.audio', 'neural2026');
      setCurrentUser(res.user);
    } catch {
      // Create local mock user if backend is offline
      const mockUser: UserProfile = {
        id: 'usr-demo',
        email: 'audiophile@auralis.audio',
        displayName: 'Cyber Listener',
        avatarUri: undefined,
        createdAt: Date.now(),
        favoriteGenres: ['Synthwave', 'Lo-Fi Chill'],
        subscriptionTier: 'premium',
      };
      setCurrentUser(mockUser);
      Alert.alert('Offline Mode Active', 'Signed in locally with Auralis Hi-Fi demo profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloudSync = async () => {
    if (!currentUser) return;
    try {
      setIsSyncing(true);
      const result = await apiClient.syncPlaylists(playlists);
      setLastSyncTime(new Date(result.syncedAt).toLocaleTimeString());
      Alert.alert(
        'Playlists Synchronized',
        `Successfully synced ${result.mergedPlaylists.length} playlist(s) with Auralis Cloud.`
      );
    } catch (err: any) {
      Alert.alert('Cloud Sync Note', err.message || 'Server currently unreachable in local environment.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSignOut = async () => {
    await apiClient.logout();
    setCurrentUser(null);
    setEmail('');
    setPassword('');
  };

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
          <Text style={styles.headerTitle}>Account & Cloud Sync</Text>
          <View style={{ width: 36 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {currentUser ? (
            /* Logged-In User Profile Card */
            <View style={styles.profileSection}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={44} color={darkColors.secondary} />
                <View style={styles.proBadge}>
                  <Ionicons name="shield-checkmark" size={14} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.displayName}>{currentUser.displayName}</Text>
              <Text style={styles.emailText}>{currentUser.email}</Text>

              <View style={styles.tierPill}>
                <Ionicons name="sparkles" size={12} color={darkColors.accent} />
                <Text style={styles.tierText}>AURALIS HI-FI SUBSCRIBER</Text>
              </View>

              {/* Cloud Sync Status Card */}
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="cloud-done-outline" size={20} color={darkColors.secondary} />
                  <Text style={styles.cardTitle}>Cloud Library Synchronization</Text>
                </View>
                <Text style={styles.cardDesc}>
                  Playlists, favorites, and AI recommendation history are securely backed up.
                </Text>
                {lastSyncTime && (
                  <Text style={styles.lastSyncText}>Last synced today at {lastSyncTime}</Text>
                )}

                <TouchableOpacity
                  style={styles.syncBtn}
                  onPress={handleCloudSync}
                  disabled={isSyncing}
                >
                  {isSyncing ? (
                    <ActivityIndicator size="small" color={darkColors.textInverse} />
                  ) : (
                    <>
                      <Ionicons name="sync" size={18} color={darkColors.textInverse} />
                      <Text style={styles.syncBtnText}>Sync Playlists Now</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={18} color={darkColors.accentPink} />
                <Text style={styles.signOutText}>Sign Out of Auralis</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Authentication Form */
            <View style={styles.authSection}>
              <View style={styles.brandIconBox}>
                <Ionicons name="infinite" size={36} color={darkColors.secondary} />
              </View>

              <Text style={styles.authTitle}>Sync Across Devices</Text>
              <Text style={styles.authSubtitle}>
                Sign in to backup your custom playlists, AI presets, and listening history.
              </Text>

              <View style={styles.tabSwitch}>
                <TouchableOpacity
                  style={[styles.tabBtn, isAuthMode === 'login' && styles.tabBtnActive]}
                  onPress={() => setIsAuthMode('login')}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      isAuthMode === 'login' && styles.tabBtnTextActive,
                    ]}
                  >
                    Sign In
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabBtn, isAuthMode === 'register' && styles.tabBtnActive]}
                  onPress={() => setIsAuthMode('register')}
                >
                  <Text
                    style={[
                      styles.tabBtnText,
                      isAuthMode === 'register' && styles.tabBtnTextActive,
                    ]}
                  >
                    Create Account
                  </Text>
                </TouchableOpacity>
              </View>

              {isAuthMode === 'register' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Display Name</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Cyber Explorer"
                    placeholderTextColor={darkColors.textTertiary}
                    value={displayName}
                    onChangeText={setDisplayName}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="audiophile@auralis.audio"
                  placeholderTextColor={darkColors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={darkColors.textTertiary}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAuthSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={darkColors.textInverse} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isAuthMode === 'login' ? 'Sign In' : 'Create Free Account'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.demoBtn}
                onPress={handleDemoSignIn}
                disabled={isLoading}
              >
                <Ionicons name="sparkles" size={16} color={darkColors.secondary} />
                <Text style={styles.demoBtnText}>Quick Demo Sign In</Text>
              </TouchableOpacity>

              <Text style={styles.privacyNote}>
                Account is completely optional. You can always enjoy local device audio playback without signing in.
              </Text>
            </View>
          )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  scrollContent: {
    padding: 24,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 16,
  },
  proBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: darkColors.accent,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#07090E',
  },
  displayName: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.heavy,
    color: darkColors.textPrimary,
  },
  emailText: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginTop: 4,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: borderRadius.pill,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    marginTop: 12,
  },
  tierText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.accent,
    letterSpacing: 1,
  },
  card: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 20,
    marginTop: 28,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textPrimary,
  },
  cardDesc: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  lastSyncText: {
    fontSize: 10,
    color: darkColors.secondary,
    marginBottom: 14,
  },
  syncBtn: {
    flexDirection: 'row',
    backgroundColor: darkColors.secondary,
    borderRadius: borderRadius.pill,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  syncBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textInverse,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 32,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  signOutText: {
    fontSize: typography.fontSize.sm,
    color: darkColors.accentPink,
    fontWeight: typography.fontWeight.semibold,
  },
  authSection: {
    alignItems: 'center',
  },
  brandIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.heavy,
    color: darkColors.textPrimary,
  },
  authSubtitle: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  tabSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: borderRadius.pill,
    padding: 4,
    marginBottom: 20,
    width: '100%',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: borderRadius.pill,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
  },
  tabBtnText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.textTertiary,
  },
  tabBtnTextActive: {
    color: darkColors.secondary,
    fontWeight: typography.fontWeight.bold,
  },
  inputGroup: {
    width: '100%',
    marginBottom: 16,
  },
  label: {
    fontSize: typography.fontSize.xs,
    color: darkColors.textSecondary,
    marginBottom: 6,
    fontWeight: typography.fontWeight.medium,
  },
  input: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: darkColors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  submitBtn: {
    width: '100%',
    backgroundColor: darkColors.secondary,
    borderRadius: borderRadius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textInverse,
  },
  demoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingVertical: 10,
  },
  demoBtnText: {
    fontSize: typography.fontSize.xs,
    color: darkColors.secondary,
    fontWeight: typography.fontWeight.semibold,
  },
  privacyNote: {
    fontSize: 10,
    color: darkColors.textTertiary,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 14,
    paddingHorizontal: 16,
  },
});
