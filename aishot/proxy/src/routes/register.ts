import { Hono } from 'hono';
import type { AppEnv, DeviceRecord } from '../env';
import { dailyCapUsd } from '../env';
import { deviceKey } from '../auth';
import { registerBody } from '../schemas';

export const registerRoute = new Hono<AppEnv>();

registerRoute.post('/', async (c) => {
  const json = await c.req.json().catch(() => null);
  const parsed = registerBody.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
  }

  const token = generateToken();
  const record: DeviceRecord = {
    device_id: parsed.data.device_id,
    created_at: Date.now(),
  };
  await c.env.AISHOT_KV.put(deviceKey(token), JSON.stringify(record));

  return c.json({ token, daily_cap_usd: dailyCapUsd(c.env) });
});

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

function base64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
