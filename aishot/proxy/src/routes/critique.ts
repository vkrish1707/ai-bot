import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { requireDevice } from '../auth';
import { checkBudget, checkRateLimit } from '../cost-guard';
import { critiqueBody } from '../schemas';
import { PERSONA_SYSTEM } from '../prompts';
import { relayAnthropic } from '../anthropic';

export const critiqueRoute = new Hono<AppEnv>();

critiqueRoute.use('*', requireDevice);

critiqueRoute.post('/', async (c) => {
  const rateBlocked = await checkRateLimit(c);
  if (rateBlocked) return rateBlocked;

  const budgetBlocked = await checkBudget(c);
  if (budgetBlocked) return budgetBlocked;

  const json = await c.req.json().catch(() => null);
  const parsed = critiqueBody.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
  }
  const { image_base64, settings_used } = parsed.data;

  const summary =
    `Shot taken at ISO ${settings_used.iso}, ` +
    `shutter ${formatShutter(settings_used.shutter_seconds)}, ` +
    `EV ${settings_used.ev >= 0 ? '+' : ''}${settings_used.ev.toFixed(1)}, ` +
    `WB ${Math.round(settings_used.wb_kelvin)}K. ` +
    `One short critique: what worked, one thing to try next.`;

  return relayAnthropic(c, {
    model: c.env.DEFAULT_MODEL,
    max_tokens: 160,
    system: [
      {
        type: 'text',
        text: PERSONA_SYSTEM,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: image_base64,
            },
          },
          { type: 'text', text: summary },
        ],
      },
    ],
    temperature: 0.6,
  });
});

function formatShutter(seconds: number): string {
  if (seconds >= 1) return `${seconds.toFixed(1)}s`;
  return `1/${Math.round(1 / seconds)}`;
}
