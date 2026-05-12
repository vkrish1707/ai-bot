import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  getSession,
  listCaptures,
  listMessages,
} from '@/db/queries';
import type { CaptureRow, MessageRow, SessionRow } from '@/db/schema';
import { PhotoGrid } from '@/components/Session/PhotoGrid';
import { TranscriptList } from '@/components/Session/TranscriptList';
import { CritiquesList } from '@/components/Session/CritiquesList';

export default function SessionDetail() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const id = params.id ?? '';

  const [session, setSession] = useState<SessionRow | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [captures, setCaptures] = useState<CaptureRow[]>([]);

  const load = useCallback(async () => {
    if (!id) return;
    const [s, m, c] = await Promise.all([
      getSession(id),
      listMessages(id),
      listCaptures(id),
    ]);
    setSession(s ?? null);
    setMessages(m);
    setCaptures(c);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!session) {
    return (
      <SafeAreaView style={styles.root}>
        <Header onBack={() => router.back()} title="Session" />
        <Text style={styles.dim}>Loading…</Text>
      </SafeAreaView>
    );
  }

  const title = describe(session);
  const when = new Date(session.createdAt).toLocaleString();

  return (
    <SafeAreaView style={styles.root}>
      <Header onBack={() => router.back()} title={title} />
      <ScrollView contentContainerStyle={styles.body}>
        <Text style={styles.when}>{when}</Text>

        <Section title="Photos">
          {captures.length === 0 ? (
            <Text style={styles.dim}>No shots in this session.</Text>
          ) : (
            <PhotoGrid captures={captures} />
          )}
        </Section>

        <Section title="Critique">
          <CritiquesList captures={captures} />
          {captures.every((c) => !c.critique) && (
            <Text style={styles.dim}>No critiques yet.</Text>
          )}
        </Section>

        <Section title="Transcript">
          <TranscriptList messages={messages} />
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function Header({ onBack, title }: { onBack: () => void; title: string }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack}>
        <Text style={styles.back}>‹ Back</Text>
      </Pressable>
      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.headerSpacer} />
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function describe(s: SessionRow): string {
  const parts: string[] = [];
  if (s.intentSubject) parts.push(s.intentSubject);
  if (s.intentMood) parts.push(s.intentMood);
  if (s.intentStyle) parts.push(s.intentStyle);
  return parts.length ? parts.join(' · ') : 'Session';
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1a1a1a',
  },
  back: { color: '#ffd166', fontSize: 16, width: 70 },
  headerSpacer: { width: 70 },
  title: { flex: 1, color: '#fff', fontSize: 16, fontWeight: '600', textAlign: 'center' },
  body: { paddingBottom: 60, gap: 24 },
  when: { color: '#666', fontSize: 12, paddingHorizontal: 16, marginTop: 8 },
  section: { gap: 10 },
  sectionTitle: {
    color: '#888',
    fontSize: 11,
    letterSpacing: 1.5,
    fontWeight: '700',
    paddingHorizontal: 16,
    textTransform: 'uppercase',
  },
  dim: { color: '#666', fontSize: 13, paddingHorizontal: 16 },
});
