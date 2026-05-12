import Constants from 'expo-constants';

const fromExpo = Constants.expoConfig?.extra?.proxyUrl as string | undefined;
const fromProcess = process.env.EXPO_PUBLIC_PROXY_URL;

export const PROXY_URL =
  fromProcess ?? fromExpo ?? 'http://localhost:8787';
