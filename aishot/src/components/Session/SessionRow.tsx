import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import {
  captureCountForSession,
  getLatestCaptureForSession,
} from '@/db/queries';
import type { SessionRow as SessionRowType } from '@/db/schema';

type Props = {
  session: SessionRowType;
  onPress: () => void;
};

export function SessionRow({ session, onPress }: Props) {
  const [thumb, setThumb] = useState<string | null>(null);
  const [count, setCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const [latest, total] = await Promise.all([
        getLatestCaptureForSession(session.id),
        captureCountForSession(session.id),
      ]);
      if (cancelled) return;
      setThumb(latest?.localUri ?? null);
      setCount(total);
    })();
    return () => {
      cancelled = true;
    };
  }, [session.id]);

  const label = describeIntent(session) || 'no intent';
  const when = new Date(session.createdAt).toLocaleString();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.thumb}>
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.image} contentFit="cover" />
        ) : (
          <View style={styles.thumbEmpty} />
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.meta}>
          {count} shot{count === 1 ? '' : 's'} · {when}
        </Text>
      </View>
    </Pressable>
  );
}

function describeIntent(s: SessionRowType): string {
  const parts: string[] = [];
  if (s.intentSubject) parts.push(s.intentSubject);
  if (s.intentMood) parts.push(s.intentMood);
  if (s.intentStyle) parts.push(s.intentStyle);
  return parts.join(' · ');
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1a1a1a',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  thumbEmpty: { flex: 1 },
  image: { width: '100%', height: '100%' },
  body: { flex: 1, gap: 2 },
  label: { color: '#fff', fontSize: 15, fontWeight: '600' },
  meta: { color: '#888', fontSize: 12 },
});
