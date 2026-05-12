import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { dailyCapUsd, endOfDayExpirationSeconds } from '../env';
import { getSpentUsd } from '../cost-guard';
import { requireDevice } from '../auth';

export const budgetRoute = new Hono<AppEnv>();

budgetRoute.use('*', requireDevice);

budgetRoute.get('/', async (c) => {
  const token = c.get('token');
  const used = await getSpentUsd(c.env, token);
  const cap = dailyCapUsd(c.env);
  const resetsIn = endOfDayExpirationSeconds();
  return c.json({
    used_usd: Number(used.toFixed(6)),
    cap_usd: cap,
    resets_at: new Date(Date.now() + resetsIn * 1000).toISOString(),
  });
});
