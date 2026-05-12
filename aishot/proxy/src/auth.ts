import type { MiddlewareHandler } from 'hono';
import type { AppEnv, DeviceRecord } from './env';

const TOKEN_PREFIX = 'device:';

export function deviceKey(token: string): string {
  return `${TOKEN_PREFIX}${token}`;
}

export const requireDevice: MiddlewareHandler<AppEnv> = async (c, next) => {
  const header = c.req.header('Authorization') ?? '';
  const match = header.match(/^Bearer\s+([A-Za-z0-9._-]+)$/);
  if (!match) {
    return c.json({ error: 'missing_bearer_token' }, 401);
  }
  const token = match[1]!;

  const raw = await c.env.AISHOT_KV.get(deviceKey(token));
  if (!raw) {
    return c.json({ error: 'invalid_token' }, 401);
  }

  const device = JSON.parse(raw) as DeviceRecord;
  c.set('token', token);
  c.set('device', device);

  await next();
};
