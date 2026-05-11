import { Group, Line, vec } from '@shopify/react-native-skia';

type Props = {
  width: number;
  height: number;
};

export function RuleOfThirdsGrid({ width, height }: Props) {
  const color = 'rgba(255,255,255,0.35)';
  const sw = 1;

  const v1 = width / 3;
  const v2 = (2 * width) / 3;
  const h1 = height / 3;
  const h2 = (2 * height) / 3;

  return (
    <Group>
      <Line p1={vec(v1, 0)} p2={vec(v1, height)} color={color} strokeWidth={sw} />
      <Line p1={vec(v2, 0)} p2={vec(v2, height)} color={color} strokeWidth={sw} />
      <Line p1={vec(0, h1)} p2={vec(width, h1)} color={color} strokeWidth={sw} />
      <Line p1={vec(0, h2)} p2={vec(width, h2)} color={color} strokeWidth={sw} />
    </Group>
  );
}
