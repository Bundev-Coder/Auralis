import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TabNavigator } from './src/navigation/TabNavigator';
import { usePlaylistStore } from './src/state/usePlaylistStore';
import { SplashScreen } from './src/components/common/SplashScreen';
import { OnboardingModal } from './src/features/onboarding/OnboardingModal';

export default function App() {
  const { initialize, isLoading } = usePlaylistStore();
  const [isSplashDone, setIsSplashDone] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    initialize();

    // Check if user has completed onboarding before
    try {
      if (Platform.OS === 'web') {
        if (typeof localStorage !== 'undefined') {
          const onboarded = localStorage.getItem('auralis_onboarded');
          if (!onboarded) {
            setShowOnboarding(true);
          }
        }
      }
    } catch {
      // fallback
    }
  }, [initialize]);

  if (isLoading || !isSplashDone) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <SplashScreen onFinish={() => setIsSplashDone(true)} />
      </View>
    );
  }

  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar style="light" />
      <TabNavigator />
      <OnboardingModal
        visible={showOnboarding}
        onComplete={() => setShowOnboarding(false)}
      />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
  },
});
