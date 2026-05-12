import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000' },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="modal/intent"
          options={{ presentation: 'modal', headerShown: false }}
        />
        <Stack.Screen name="session/[id]" options={{ headerShown: false }} />
      </Stack>
    </GestureHandlerRootView>
  );
}
