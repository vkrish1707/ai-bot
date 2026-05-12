import { Group, Line, vec } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';

type Props = {
  width: number;
  height: number;
  horizon: SharedValue<number>;
};

const LEVEL_THRESHOLD_DEG = 1.2;

export function HorizonLine({ width, height, horizon }: Props) {
  const cx = width / 2;
  const cy = height / 2;
  const half = width * 0.18;

  const transform = useDerivedValue(() => [
    { rotate: (horizon.value * Math.PI) / 180 },
  ]);

  const color = useDerivedValue(() =>
    Math.abs(horizon.value) <= LEVEL_THRESHOLD_DEG
      ? 'rgba(120,220,160,0.95)'
      : 'rgba(255,255,255,0.7)',
  );

  return (
    <Group origin={vec(cx, cy)} transform={transform}>
      <Line
        p1={vec(cx - half, cy)}
        p2={vec(cx + half, cy)}
        color={color}
        strokeWidth={2}
      />
    </Group>
  );
}
