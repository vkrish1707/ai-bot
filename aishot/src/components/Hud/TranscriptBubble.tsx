import { StyleSheet, Text, View } from 'react-native';
import { useVoiceStore } from '@/stores/voiceStore';

export function TranscriptBubble() {
  const partial = useVoiceStore((s) => s.partial);
  const lastFinal = useVoiceStore((s) => s.lastFinal);
  const state = useVoiceStore((s) => s.state);

  const text = partial || (state === 'thinking' ? lastFinal : '');
  if (!text) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={[styles.text, partial ? styles.partial : styles.finalText]} numberOfLines={2}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 220,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  text: { fontSize: 14, lineHeight: 19 },
  partial: { color: 'rgba(255,255,255,0.85)', fontStyle: 'italic' },
  finalText: { color: '#fff', fontWeight: '500' },
});
