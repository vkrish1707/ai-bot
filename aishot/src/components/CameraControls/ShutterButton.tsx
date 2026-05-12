import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Canvas,
  Path,
  Skia,
  type SkPath,
} from '@shopify/react-native-skia';
import {
  Easing,
  cancelAnimation,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useCameraStore } from '@/stores/cameraStore';
import { useAiStore } from '@/stores/aiStore';

const SIZE = 92;
const STROKE = 5;
const INNER = 60;

type Props = {
  onPress: () => void;
};

export function ShutterButton({ onPress }: Props) {
  const mode = useCameraStore((s) => s.mode);
  const autoFire = useAiStore((s) => s.autoFire);
  const cancelAutoFire = useAiStore((s) => s.cancelAutoFire);

  const progress = useSharedValue(0);

  useEffect(() => {
    if (autoFire.state === 'arming') {
      progress.value = 0;
      progress.value = withTiming(1, {
        duration: autoFire.durationMs,
        easing: Easing.linear,
      });
    } else {
      cancelAnimation(progress);
      progress.value = withTiming(0, { duration: 150 });
    }
  }, [autoFire, progress]);

  const arcPath = useDerivedValue<SkPath>(() => {
    const p = Skia.Path.Make();
    const r = (SIZE - STROKE) / 2;
    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const angle = Math.max(0.001, progress.value) * 360;
    p.addArc(
      { x: cx - r, y: cy - r, width: r * 2, height: r * 2 },
      -90,
      angle,
    );
    return p;
  });

  const handlePress = () => {
    if (autoFire.state === 'arming') {
      cancelAutoFire();
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={20}>
      <View style={styles.outer}>
        <Canvas style={StyleSheet.absoluteFill}>
          <Path
            path={arcPath}
            style="stroke"
            strokeWidth={STROKE}
            strokeCap="round"
            color="rgba(255,209,102,0.95)"
          />
        </Canvas>
        <View style={styles.ring} />
        <View style={[styles.inner, mode === 'video' && styles.video]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: SIZE,
    height: SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: SIZE - STROKE,
    height: SIZE - STROKE,
    borderRadius: (SIZE - STROKE) / 2,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  inner: {
    width: INNER,
    height: INNER,
    borderRadius: INNER / 2,
    backgroundColor: '#fff',
  },
  video: { backgroundColor: '#e63946', borderRadius: 8, width: 28, height: 28 },
});
