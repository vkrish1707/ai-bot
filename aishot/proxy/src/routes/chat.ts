import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { requireDevice } from '../auth';
import { checkBudget, checkRateLimit } from '../cost-guard';
import { chatBody } from '../schemas';
import { PERSONA_SYSTEM, renderIntent } from '../prompts';
import { relayAnthropic } from '../anthropic';

export const chatRoute = new Hono<AppEnv>();

chatRoute.use('*', requireDevice);

chatRoute.post('/', async (c) => {
  const rateBlocked = await checkRateLimit(c);
  if (rateBlocked) return rateBlocked;

  const budgetBlocked = await checkBudget(c);
  if (budgetBlocked) return budgetBlocked;

  const json = await c.req.json().catch(() => null);
  const parsed = chatBody.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
  }
  const { messages, intent, use_opus } = parsed.data;

  const model = use_opus ? c.env.OPUS_MODEL : c.env.DEFAULT_MODEL;

  return relayAnthropic(c, {
    model,
    max_tokens: 512,
    system: [
      {
        type: 'text',
        text: PERSONA_SYSTEM + renderIntent(intent),
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
    temperature: 0.7,
  });
});
