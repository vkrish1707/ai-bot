import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCameraStore } from '@/stores/cameraStore';
import type { CaptureMode } from '@/lib/types';

const MODES: CaptureMode[] = ['photo', 'video'];

export function ModeToggle() {
  const mode = useCameraStore((s) => s.mode);
  const setMode = useCameraStore((s) => s.setMode);

  return (
    <View style={styles.container}>
      {MODES.map((m) => (
        <Pressable key={m} onPress={() => setMode(m)} style={styles.item}>
          <Text style={[styles.text, mode === m && styles.active]}>
            {m.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', gap: 18 },
  item: { paddingVertical: 4, paddingHorizontal: 6 },
  text: { color: '#888', fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  active: { color: '#fff' },
});
