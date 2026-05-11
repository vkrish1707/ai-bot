import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { Canvas } from '@shopify/react-native-skia';
import type { SharedValue } from 'react-native-reanimated';
import type { FaceBox } from '@/services/vision/types';
import { RuleOfThirdsGrid } from './RuleOfThirdsGrid';
import { HorizonLine } from './HorizonLine';
import { FaceReticles } from './FaceReticles';

type Props = {
  faces: SharedValue<FaceBox[]>;
  frameSize: SharedValue<{ width: number; height: number }>;
  horizon: SharedValue<number>;
};

export function SkiaOverlay({ faces, frameSize, horizon }: Props) {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
      {size.width > 0 && size.height > 0 && (
        <Canvas style={StyleSheet.absoluteFill}>
          <RuleOfThirdsGrid width={size.width} height={size.height} />
          <HorizonLine width={size.width} height={size.height} horizon={horizon} />
          <FaceReticles
            faces={faces}
            frameSize={frameSize}
            canvasWidth={size.width}
            canvasHeight={size.height}
          />
        </Canvas>
      )}
    </View>
  );
}
