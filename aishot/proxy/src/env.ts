export type Bindings = {
  AISHOT_KV: KVNamespace;
  ANTHROPIC_API_KEY: string;
  DAILY_CAP_USD: string;
  RATE_LIMIT_PER_SEC: string;
  DEFAULT_MODEL: string;
  OPUS_MODEL: string;
};

export type DeviceRecord = {
  device_id: string;
  created_at: number;
};

export type AppEnv = {
  Bindings: Bindings;
  Variables: {
    token: string;
    device: DeviceRecord;
  };
};

export function dailyCapUsd(env: Bindings): number {
  const n = Number(env.DAILY_CAP_USD);
  return Number.isFinite(n) && n > 0 ? n : 2;
}

export function rateLimitPerSec(env: Bindings): number {
  const n = Number(env.RATE_LIMIT_PER_SEC);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

export function todayKey(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function endOfDayExpirationSeconds(now: Date = new Date()): number {
  const end = new Date(now);
  end.setUTCHours(23, 59, 59, 999);
  return Math.max(60, Math.ceil((end.getTime() - now.getTime()) / 1000));
}
