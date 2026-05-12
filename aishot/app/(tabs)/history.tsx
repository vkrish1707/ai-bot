import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { listSessions } from '@/db/queries';
import type { SessionRow as SessionRowType } from '@/db/schema';
import { SessionRow } from '@/components/Session/SessionRow';
import { useSessionStore } from '@/stores/sessionStore';

export default function HistoryScreen() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionRowType[]>([]);
  const newSession = useSessionStore((s) => s.newSession);

  const refresh = useCallback(async () => {
    const rows = await listSessions();
    setSessions(rows);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void refresh();
    }, [refresh]),
  );

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Pressable
          onPress={() => {
            newSession();
            router.push('/');
          }}
        >
          <Text style={styles.new}>New session</Text>
        </Pressable>
      </View>
      <FlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        renderItem={({ item }) => (
          <SessionRow
            session={item}
            onPress={() => router.push(`/session/${item.id}` as never)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.empty}>No sessions yet. Take a shot to start one.</Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1a1a1a',
  },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  new: { color: '#ffd166', fontSize: 14, fontWeight: '600' },
  empty: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 60,
    paddingHorizontal: 40,
  },
});
