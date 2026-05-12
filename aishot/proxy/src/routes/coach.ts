import { Hono } from 'hono';
import type { AppEnv } from '../env';
import { requireDevice } from '../auth';
import { checkBudget, checkRateLimit } from '../cost-guard';
import { coachBody } from '../schemas';
import { COACH_TOOLS_HINT, PERSONA_SYSTEM, renderIntent } from '../prompts';
import { relayAnthropic } from '../anthropic';
import { COACH_TOOLS } from '../tools';

export const coachRoute = new Hono<AppEnv>();

coachRoute.use('*', requireDevice);

coachRoute.post('/', async (c) => {
  const rateBlocked = await checkRateLimit(c);
  if (rateBlocked) return rateBlocked;

  const budgetBlocked = await checkBudget(c);
  if (budgetBlocked) return budgetBlocked;

  const json = await c.req.json().catch(() => null);
  const parsed = coachBody.safeParse(json);
  if (!parsed.success) {
    return c.json({ error: 'invalid_body', issues: parsed.error.flatten() }, 400);
  }
  const { intent, features, tracker, image_base64, last_messages } = parsed.data;

  const userText =
    `Live scene snapshot:\n` +
    `- fps=${features.fps.toFixed(0)}\n` +
    `- faces=${features.face_count}\n` +
    `- horizon=${features.horizon_deg.toFixed(1)}°\n` +
    `- motion=${(features.motion_score * 100).toFixed(0)}%` +
    (features.mean_luma !== undefined ? `\n- mean_luma=${features.mean_luma.toFixed(0)}` : '') +
    (tracker?.subject_id
      ? `\n- tracked_subject=${tracker.subject_id} conf=${tracker.confidence?.toFixed(2) ?? '?'}`
      : '') +
    `\nDecide the next action.`;

  const previous = (last_messages ?? []).map((m) => ({
    role: m.role,
    content: m.content,
  }));

  return relayAnthropic(c, {
    model: c.env.DEFAULT_MODEL,
    max_tokens: 384,
    system: [
      {
        type: 'text',
        text: PERSONA_SYSTEM + '\n\n' + COACH_TOOLS_HINT + renderIntent(intent),
        cache_control: { type: 'ephemeral' },
      },
    ],
    tools: COACH_TOOLS as unknown as unknown[],
    messages: [
      ...previous,
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
          { type: 'text', text: userText },
        ],
      },
    ],
    temperature: 0.5,
  });
});
