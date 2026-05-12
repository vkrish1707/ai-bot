import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { requireDevice } from '../auth';
import { checkBudget, checkRateLimit } from '../cost-guard';
import { intentBody } from '../schemas';
import { PERSONA_SYSTEM, renderIntent } from '../prompts';
import { relayAnthropic } from '../anthropic';
import { EXTRACT_INTENT_TOOL } from '../tools';

export const intentRoute = new Hono<AppEnv>();

intentRoute.use('*', requireDevice);

intentRoute.post('/', async (c) => {
  const rateBlocked = await checkRateLimit(c);
  if (rateBlocked) return rateBlocked;

  const budgetBlocked = await checkBudget(c);
  if (budgetBlocked) return budgetBlocked;

  const json = await c.req.json().catch(() => null);
  const parsed = intentBody.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
  }
  const { transcript, current_intent } = parsed.data;

  const userPrompt =
    `The user just said:\n"${transcript}"\n\n` +
    `Update the shooting intent and reply with a short spoken acknowledgement. ` +
    `Use set_intent. Keep any fields the user did not change.`;

  return relayAnthropic(c, {
    model: c.env.DEFAULT_MODEL,
    max_tokens: 200,
    system: [
      {
        type: 'text',
        text: PERSONA_SYSTEM + renderIntent(current_intent),
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: [EXTRACT_INTENT_TOOL] as unknown as unknown[],
    tool_choice: { type: 'tool', name: EXTRACT_INTENT_TOOL.name } as unknown as Record<string, unknown>,
    messages: [{ role: 'user', content: userPrompt }],
    temperature: 0.2,
  });
});
