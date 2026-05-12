import { RoundedRect } from '@shopify/react-native-skia';
import { useDerivedValue, type SharedValue } from 'react-native-reanimated';
import type { FaceBox } from '@/services/vision/types';

const MAX_RETICLES = 4;
const OFFSCREEN = -10000;

type Props = {
  faces: SharedValue<FaceBox[]>;
  frameSize: SharedValue<{ width: number; height: number }>;
  canvasWidth: number;
  canvasHeight: number;
};

export function FaceReticles({ faces, frameSize, canvasWidth, canvasHeight }: Props) {
  return (
    <>
      {Array.from({ length: MAX_RETICLES }).map((_, i) => (
        <FaceReticle
          key={i}
          index={i}
          faces={faces}
          frameSize={frameSize}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
        />
      ))}
    </>
  );
}

type SlotProps = Props & { index: number };

function FaceReticle({
  index,
  faces,
  frameSize,
  canvasWidth,
  canvasHeight,
}: SlotProps) {
  const x = useDerivedValue(() => {
    const f = faces.value[index];
    const fs = frameSize.value;
    if (!f || !fs.width) return OFFSCREEN;
    return (f.x / fs.width) * canvasWidth;
  });

  const y = useDerivedValue(() => {
    const f = faces.value[index];
    const fs = frameSize.value;
    if (!f || !fs.height) return OFFSCREEN;
    return (f.y / fs.height) * canvasHeight;
  });

  const width = useDerivedValue(() => {
    const f = faces.value[index];
    const fs = frameSize.value;
    if (!f || !fs.width) return 0;
    return (f.width / fs.width) * canvasWidth;
  });

  const height = useDerivedValue(() => {
    const f = faces.value[index];
    const fs = frameSize.value;
    if (!f || !fs.height) return 0;
    return (f.height / fs.height) * canvasHeight;
  });

  return (
    <RoundedRect
      x={x}
      y={y}
      width={width}
      height={height}
      r={12}
      color="rgba(255,221,102,0.9)"
      style="stroke"
      strokeWidth={2}
    />
  );
}
