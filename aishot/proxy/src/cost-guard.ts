import type { Context } from 'hono';
import type { AppEnv, Bindings } from './env';
import {
  dailyCapUsd,
  endOfDayExpirationSeconds,
  rateLimitPerSec,
  todayKey,
} from './env';

const SPEND_PREFIX = 'spend:';
const RATE_PREFIX = 'rate:';

export function spendKey(token: string, day: string): string {
  return `${SPEND_PREFIX}${token}:${day}`;
}

export function rateKey(token: string): string {
  return `${RATE_PREFIX}${token}`;
}

const MODEL_PRICES_USD_PER_MTOK: Record<string, { input: number; output: number }> = {
  'claude-sonnet-4-6': { input: 3, output: 15 },
  'claude-opus-4-7': { input: 15, output: 75 },
  'claude-haiku-4-5-20251001': { input: 1, output: 5 },
};

export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const price = MODEL_PRICES_USD_PER_MTOK[model] ?? MODEL_PRICES_USD_PER_MTOK['claude-sonnet-4-6']!;
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

export async function getSpentUsd(env: Bindings, token: string): Promise<number> {
  const raw = await env.AISHOT_KV.get(spendKey(token, todayKey()));
  if (!raw) return 0;
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

export async function checkBudget(c: Context<AppEnv>): Promise<Response | null> {
  const token = c.get('token');
  const spent = await getSpentUsd(c.env, token);
  const cap = dailyCapUsd(c.env);
  if (spent >= cap) {
    return c.json(
      { error: 'daily_cap_exceeded', spent_usd: spent, cap_usd: cap },
      429,
    );
  }
  return null;
}

export async function checkRateLimit(c: Context<AppEnv>): Promise<Response | null> {
  const token = c.get('token');
  const key = rateKey(token);
  const last = await c.env.AISHOT_KV.get(key);
  const now = Date.now();
  const minIntervalMs = 1000 / rateLimitPerSec(c.env);
  if (last && now - Number(last) < minIntervalMs) {
    return c.json({ error: 'rate_limited' }, 429);
  }
  await c.env.AISHOT_KV.put(key, String(now), { expirationTtl: 60 });
  return null;
}

export async function recordSpend(
  env: Bindings,
  token: string,
  costUsd: number,
): Promise<number> {
  const day = todayKey();
  const key = spendKey(token, day);
  const prev = Number((await env.AISHOT_KV.get(key)) ?? '0');
  const next = (Number.isFinite(prev) ? prev : 0) + costUsd;
  await env.AISHOT_KV.put(key, next.toFixed(6), {
    expirationTtl: endOfDayExpirationSeconds(),
  });
  return next;
}
