import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

type DialProps = {
  label: string;
  format: (n: number) => string;
  value: SharedValue<number>;
  isLocked: boolean;
  onLockToggle: () => void;
  min: number;
  max: number;
};

const SAMPLE_INTERVAL_MS = 33;

export function Dial({
  label,
  format,
  value,
  isLocked,
  onLockToggle,
  min,
  max,
}: DialProps) {
  const [displayText, setDisplayText] = useState(() => format(value.value));

  useAnimatedReaction(
    () => ({ t: Math.floor(Date.now() / SAMPLE_INTERVAL_MS), v: value.value }),
    (curr, prev) => {
      if (prev && curr.t === prev.t) return;
      runOnJS(setDisplayText)(format(curr.v));
    },
    [format],
  );

  const fillStyle = useAnimatedStyle(() => {
    const range = Math.max(0.0001, max - min);
    const pct = Math.min(1, Math.max(0, (value.value - min) / range));
    return { width: `${pct * 100}%` };
  });

  return (
    <Pressable
      onPress={onLockToggle}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.row}>
        <Text style={[styles.label, isLocked && styles.locked]}>{label}</Text>
        {isLocked && <Text style={styles.lockBadge}>LOCK</Text>}
      </View>
      <Text style={styles.value}>{displayText}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 10,
    marginHorizontal: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: '#bbb', fontSize: 11, letterSpacing: 1, fontWeight: '600' },
  locked: { color: '#ffd166' },
  lockBadge: {
    color: '#ffd166',
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: 'rgba(255,209,102,0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  value: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 },
  track: {
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 1,
    marginTop: 6,
    overflow: 'hidden',
  },
  fill: { height: '100%', backgroundColor: '#fff' },
});
