import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type DialProps = {
  label: string;
  value: string;
  isLocked: boolean;
  onLockToggle: () => void;
  min: number;
  max: number;
  current: number;
};

export function Dial({ label, value, isLocked, onLockToggle, min, max, current }: DialProps) {
  const fillPct = useMemo(() => {
    if (max <= min) return 0;
    return Math.min(1, Math.max(0, (current - min) / (max - min)));
  }, [current, min, max]);

  return (
    <Pressable
      onPress={onLockToggle}
      style={({ pressed }) => [styles.container, pressed && { opacity: 0.8 }]}
    >
      <View style={styles.row}>
        <Text style={[styles.label, isLocked && styles.locked]}>{label}</Text>
        {isLocked && <Text style={styles.lockBadge}>LOCK</Text>}
      </View>
      <Text style={styles.value}>{value}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${fillPct * 100}%` }]} />
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
