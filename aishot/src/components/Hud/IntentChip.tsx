import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSessionStore } from '@/stores/sessionStore';

export function IntentChip() {
  const router = useRouter();
  const intent = useSessionStore((s) => s.intent);

  const label = describe(intent);

  return (
    <Pressable
      onPress={() => router.push('/modal/intent')}
      style={({ pressed }) => [styles.chip, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.dot} />
      <Text style={styles.text} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

function describe(intent: ReturnType<typeof useSessionStore.getState>['intent']): string {
  const parts: string[] = [];
  if (intent.subject) parts.push(intent.subject);
  if (intent.mood) parts.push(intent.mood);
  if (intent.style) parts.push(intent.style);
  if (parts.length === 0) return 'set intent';
  return parts.join(' · ');
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14,
    maxWidth: 220,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffd166' },
  text: { color: '#fff', fontSize: 12, fontWeight: '600' },
});
