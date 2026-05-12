import { StyleSheet, Text, View } from 'react-native';
import type { MessageRow } from '@/db/schema';

type Props = {
  messages: MessageRow[];
};

export function TranscriptList({ messages }: Props) {
  if (messages.length === 0) {
    return <Text style={styles.empty}>No transcript yet.</Text>;
  }
  return (
    <View style={styles.list}>
      {messages.map((m) => (
        <View
          key={m.id}
          style={[styles.row, m.role === 'user' ? styles.user : styles.assistant]}
        >
          <Text style={styles.role}>{m.role === 'user' ? 'you' : 'ai'}</Text>
          <Text style={styles.text}>{m.content}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, gap: 8 },
  empty: { color: '#666', fontSize: 13, paddingHorizontal: 16, marginTop: 8 },
  row: {
    padding: 10,
    borderRadius: 10,
    gap: 4,
    maxWidth: '88%',
  },
  user: { alignSelf: 'flex-end', backgroundColor: '#1f2933' },
  assistant: { alignSelf: 'flex-start', backgroundColor: '#111' },
  role: {
    fontSize: 9,
    letterSpacing: 1.4,
    color: '#888',
    fontWeight: '700',
  },
  text: { color: '#fff', fontSize: 14, lineHeight: 19 },
});
