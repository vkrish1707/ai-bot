import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAnimatedReaction, runOnJS, type SharedValue } from 'react-native-reanimated';
import { HISTOGRAM_BINS } from '@/services/vision/types';

const SAMPLE_INTERVAL_MS = 200;

type Props = {
  fps: SharedValue<number>;
  faces: SharedValue<{ id: string }[]>;
  histogram: SharedValue<number[]>;
  motionScore: SharedValue<number>;
  horizon: SharedValue<number>;
};

type Snapshot = {
  fps: number;
  faceCount: number;
  motionScore: number;
  horizon: number;
  histogram: number[];
};

export function DebugHud({ fps, faces, histogram, motionScore, horizon }: Props) {
  const [snap, setSnap] = useState<Snapshot>({
    fps: 0,
    faceCount: 0,
    motionScore: 0,
    horizon: 0,
    histogram: [],
  });

  useAnimatedReaction(
    () => ({
      t: Math.floor(Date.now() / SAMPLE_INTERVAL_MS),
      fps: fps.value,
      faceCount: faces.value.length,
      motionScore: motionScore.value,
      horizon: horizon.value,
      histogram: histogram.value,
    }),
    (curr, prev) => {
      if (prev && curr.t === prev.t) return;
      runOnJS(setSnap)({
        fps: curr.fps,
        faceCount: curr.faceCount,
        motionScore: curr.motionScore,
        horizon: curr.horizon,
        histogram: curr.histogram,
      });
    },
    [],
  );

  const maxBin = Math.max(1, ...snap.histogram);

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.text}>{snap.fps.toFixed(0).padStart(2, ' ')} FPS</Text>
      <Text style={styles.text}>{snap.faceCount} face{snap.faceCount === 1 ? '' : 's'}</Text>
      <Text style={styles.text}>
        {snap.horizon >= 0 ? '+' : ''}
        {snap.horizon.toFixed(1)}°
      </Text>
      <Text style={styles.text}>motion {(snap.motionScore * 100).toFixed(0)}%</Text>
      <View style={styles.histogram}>
        {Array.from({ length: HISTOGRAM_BINS }).map((_, i) => {
          const v = snap.histogram[i] ?? 0;
          return (
            <View
              key={i}
              style={[styles.bar, { height: 2 + (v / maxBin) * 22 }]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: 8,
    alignItems: 'flex-end',
    minWidth: 100,
  },
  text: {
    color: '#fff',
    fontSize: 11,
    fontFamily: 'Menlo',
    letterSpacing: 0.5,
    lineHeight: 14,
  },
  histogram: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 26,
    marginTop: 6,
    gap: 1,
  },
  bar: { width: 4, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 1 },
});
