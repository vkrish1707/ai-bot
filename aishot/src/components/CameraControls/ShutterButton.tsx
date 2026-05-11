import { Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useCameraStore } from '@/stores/cameraStore';

type Props = {
  onPress: () => void;
};

export function ShutterButton({ onPress }: Props) {
  const mode = useCameraStore((s) => s.mode);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={({ pressed }) => [styles.outer, pressed && { opacity: 0.85 }]}>
      <View style={[styles.inner, mode === 'video' && styles.video]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  video: { backgroundColor: '#e63946', borderRadius: 8, width: 28, height: 28 },
});
