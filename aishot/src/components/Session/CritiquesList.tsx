import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { CaptureRow } from '@/db/schema';
import { formatShutterLabel } from '@/services/camera/CameraService';

type Props = {
  captures: CaptureRow[];
};

export function CritiquesList({ captures }: Props) {
  const withCritiques = captures.filter((c) => c.critique);
  if (withCritiques.length === 0) return null;

  return (
    <View style={styles.list}>
      {withCritiques.map((c) => (
        <View key={c.id} style={styles.card}>
          {c.localUri && (
            <Image source={{ uri: c.localUri }} style={styles.thumb} contentFit="cover" />
          )}
          <View style={styles.body}>
            <Text style={styles.settings}>
              ISO {Math.round(c.iso)} · {formatShutterLabel(c.shutterSeconds)} · EV{' '}
              {c.ev >= 0 ? '+' : ''}
              {c.ev.toFixed(1)}
            </Text>
            <Text style={styles.critique}>{c.critique}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 16, gap: 12 },
  card: {
    flexDirection: 'row',
    gap: 10,
    padding: 8,
    backgroundColor: '#0f0f0f',
    borderRadius: 10,
  },
  thumb: { width: 56, height: 56, borderRadius: 6, backgroundColor: '#111' },
  body: { flex: 1, gap: 4 },
  settings: {
    color: '#888',
    fontSize: 10,
    fontFamily: 'Menlo',
    letterSpacing: 0.5,
  },
  critique: { color: '#fff', fontSize: 13, lineHeight: 18 },
});
