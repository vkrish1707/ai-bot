import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import type { CaptureRow } from '@/db/schema';
import { formatShutterLabel } from '@/services/camera/CameraService';

type Props = {
  captures: CaptureRow[];
};

const COLS = 3;
const GAP = 6;

export function PhotoGrid({ captures }: Props) {
  const width = Dimensions.get('window').width;
  const cell = (width - 32 - GAP * (COLS - 1)) / COLS;

  return (
    <View style={styles.grid}>
      {captures.map((c) => (
        <View key={c.id} style={[styles.cell, { width: cell, height: cell }]}>
          {c.localUri ? (
            <Image
              source={{ uri: c.localUri }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
            />
          ) : (
            <View style={styles.placeholder} />
          )}
          <View style={styles.meta}>
            <Text style={styles.metaText}>
              ISO {Math.round(c.iso)} · {formatShutterLabel(c.shutterSeconds)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: 16,
  },
  cell: {
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  placeholder: { flex: 1 },
  meta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  metaText: { color: '#fff', fontSize: 9, fontFamily: 'Menlo' },
});
