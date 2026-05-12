import * as SecureStore from 'expo-secure-store';
import { PROXY_URL } from './config';

const TOKEN_KEY = 'aishot.proxy.token';
const DEVICE_ID_KEY = 'aishot.device.id';

type RegisterResponse = {
  token: string;
  daily_cap_usd: number;
};

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = generateUuid();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  return id;
}

export async function getProxyToken(): Promise<string> {
  const existing = await SecureStore.getItemAsync(TOKEN_KEY);
  if (existing) return existing;

  const deviceId = await getOrCreateDeviceId();
  const res = await fetch(`${PROXY_URL}/v1/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ device_id: deviceId }),
  });
  if (!res.ok) {
    throw new Error(`register_failed: ${res.status} ${await res.text()}`);
  }
  const data = (await res.json()) as RegisterResponse;
  await SecureStore.setItemAsync(TOKEN_KEY, data.token);
  return data.token;
}

export async function clearProxyToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

function generateUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
