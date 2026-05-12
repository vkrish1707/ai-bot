import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useVoiceStore, type VoiceState } from '@/stores/voiceStore';

const SIZE = 28;

export function VoiceOrb() {
  const state = useVoiceStore((s) => s.state);
  const userSpeaking = useVoiceStore((s) => s.userSpeaking);

  const pulse = useSharedValue(0);
  const ring = useSharedValue(0);

  useEffect(() => {
    cancelAnimation(pulse);
    cancelAnimation(ring);
    if (state === 'speaking') {
      pulse.value = withRepeat(
        withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        -1,
        true,
      );
    } else if (state === 'thinking') {
      pulse.value = withRepeat(withTiming(1, { duration: 800 }), -1, true);
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
    if (userSpeaking) {
      ring.value = withRepeat(
        withTiming(1, { duration: 350, easing: Easing.out(Easing.quad) }),
        -1,
        false,
      );
    } else {
      ring.value = withTiming(0, { duration: 150 });
    }
  }, [state, userSpeaking, pulse, ring]);

  const coreStyle = useAnimatedStyle(() => ({
    opacity: 0.55 + pulse.value * 0.45,
    transform: [{ scale: 0.85 + pulse.value * 0.25 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 1 - ring.value,
    transform: [{ scale: 1 + ring.value * 1.6 }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.ring, ringStyle]} pointerEvents="none" />
      <Animated.View style={[styles.core, coreStyle, colorFor(state)]} />
    </View>
  );
}

function colorFor(state: VoiceState) {
  switch (state) {
    case 'listening':
      return { backgroundColor: '#ffffff' };
    case 'thinking':
      return { backgroundColor: '#9ad' };
    case 'speaking':
      return { backgroundColor: '#ffd166' };
    case 'error':
      return { backgroundColor: '#ff6b6b' };
    default:
      return { backgroundColor: '#555' };
  }
}

const styles = StyleSheet.create({
  container: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  ring: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
