import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { darkColors, typography } from '../../theme';
import { APP_CONFIG } from '../../config/appConfig';

interface SplashScreenProps {
  onFinish?: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const pulseAnim = useRef(new Animated.Value(0.95)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Soundwave bars animation
  const bar1 = useRef(new Animated.Value(12)).current;
  const bar2 = useRef(new Animated.Value(24)).current;
  const bar3 = useRef(new Animated.Value(36)).current;
  const bar4 = useRef(new Animated.Value(20)).current;
  const bar5 = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    // Fade in text
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse logo glow
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.7,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // Wave bars dancing animation
    const animateBar = (anim: Animated.Value, min: number, max: number, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: max,
            duration,
            useNativeDriver: false,
          }),
          Animated.timing(anim, {
            toValue: min,
            duration,
            useNativeDriver: false,
          }),
        ])
      ).start();
    };

    animateBar(bar1, 8, 38, 450);
    animateBar(bar2, 14, 48, 520);
    animateBar(bar3, 20, 56, 380);
    animateBar(bar4, 10, 42, 600);
    animateBar(bar5, 12, 46, 490);

    // Auto complete splash after 1.8 seconds if onFinish callback provided
    if (onFinish) {
      const timer = setTimeout(() => {
        onFinish();
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [pulseAnim, glowAnim, fadeAnim, bar1, bar2, bar3, bar4, bar5, onFinish]);

  return (
    <View style={styles.container}>
      {/* Background radial glow */}
      <Animated.View
        style={[
          styles.glowCircle,
          {
            opacity: glowAnim,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Futuristic Icon Badge */}
        <Animated.View
          style={[
            styles.logoContainer,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          <View style={styles.logoInner}>
            <Ionicons name="infinite" size={54} color={darkColors.secondary} />
          </View>
        </Animated.View>

        {/* Brand Name */}
        <Text style={styles.brandTitle}>{APP_CONFIG.appName}</Text>
        <Text style={styles.brandSubtitle}>{APP_CONFIG.tagline.toUpperCase()}</Text>

        {/* Animated Soundwave Equalizer */}
        <View style={styles.waveContainer}>
          {[bar1, bar2, bar3, bar4, bar5].map((bar, idx) => (
            <Animated.View
              key={idx}
              style={[
                styles.waveBar,
                {
                  height: bar,
                  backgroundColor:
                    idx % 2 === 0 ? darkColors.secondary : darkColors.primary,
                },
              ]}
            />
          ))}
        </View>

        {/* Technology Tag */}
        <View style={styles.techBadge}>
          <Text style={styles.techText}>10-BAND DSP • NEURAL AI • HI-RES</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07090E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: Math.min(SCREEN_WIDTH * 0.8, 340),
    height: Math.min(SCREEN_WIDTH * 0.8, 340),
    borderRadius: 170,
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
  },
  content: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: 'rgba(0, 242, 254, 0.1)',
    borderWidth: 2,
    borderColor: 'rgba(0, 242, 254, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    shadowColor: '#00F2FE',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
  },
  logoInner: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#0E131F',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: typography.fontWeight.heavy,
    color: '#FFFFFF',
    letterSpacing: 8,
    textAlign: 'center',
  },
  brandSubtitle: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: darkColors.secondary,
    marginTop: 8,
    letterSpacing: 2,
    textAlign: 'center',
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 60,
    gap: 6,
    marginTop: 36,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
  },
  techBadge: {
    marginTop: 40,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  techText: {
    fontSize: 9,
    fontWeight: typography.fontWeight.bold,
    color: darkColors.textTertiary,
    letterSpacing: 1.5,
  },
});
