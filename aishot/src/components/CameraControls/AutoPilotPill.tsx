import { Pressable, StyleSheet, Text } from 'react-native';
import { useCameraStore } from '@/stores/cameraStore';

export function AutoPilotPill() {
  const isAutoPilot = useCameraStore((s) => s.isAutoPilot);
  const toggle = useCameraStore((s) => s.toggleAutoPilot);

  return (
    <Pressable
      onPress={toggle}
      style={({ pressed }) => [
        styles.pill,
        isAutoPilot ? styles.on : styles.off,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Text style={[styles.text, isAutoPilot ? styles.textOn : styles.textOff]}>
        {isAutoPilot ? 'AUTO' : 'MANUAL'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  on: { backgroundColor: 'rgba(255,209,102,0.18)', borderColor: '#ffd166' },
  off: { backgroundColor: 'rgba(255,255,255,0.08)', borderColor: '#666' },
  text: { fontSize: 12, fontWeight: '800', letterSpacing: 1.5 },
  textOn: { color: '#ffd166' },
  textOff: { color: '#bbb' },
});
