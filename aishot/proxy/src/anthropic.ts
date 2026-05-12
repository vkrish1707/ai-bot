import type { Context } from 'hono';
import type { AppEnv } from './env';
import { estimateCostUsd, recordSpend } from './cost-guard';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

export type AnthropicMessage = {
  role: 'user' | 'assistant';
  content: string | unknown[];
};

export type AnthropicRequest = {
  model: string;
  max_tokens: number;
  system?: string | unknown[];
  messages: AnthropicMessage[];
  temperature?: number;
  tools?: unknown[];
  tool_choice?: Record<string, unknown>;
};

export async function relayAnthropic(
  c: Context<AppEnv>,
  params: AnthropicRequest,
): Promise<Response> {
  const upstream = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'x-api-key': c.env.ANTHROPIC_API_KEY,
      'anthropic-version': ANTHROPIC_VERSION,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ ...params, stream: true }),
  });

  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => '');
    return c.json(
      { error: 'anthropic_upstream', status: upstream.status, body: text.slice(0, 500) },
      502,
    );
  }

  const [toClient, toMeter] = upstream.body.tee();

  c.executionCtx.waitUntil(
    parseUsage(toMeter).then((usage) => {
      const cost = estimateCostUsd(params.model, usage.input_tokens, usage.output_tokens);
      return recordSpend(c.env, c.get('token'), cost);
    }),
  );

  return new Response(toClient, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
    },
  });
}

type Usage = { input_tokens: number; output_tokens: number };

async function parseUsage(body: ReadableStream<Uint8Array>): Promise<Usage> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let inputTokens = 0;
  let outputTokens = 0;

  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let nl;
    while ((nl = buffer.indexOf('\n\n')) !== -1) {
      const eventBlock = buffer.slice(0, nl);
      buffer = buffer.slice(nl + 2);
      const dataLine = eventBlock
        .split('\n')
        .find((l) => l.startsWith('data:'));
      if (!dataLine) continue;
      const payload = dataLine.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;
      try {
        const evt = JSON.parse(payload) as {
          type?: string;
          message?: { usage?: { input_tokens?: number; output_tokens?: number } };
          usage?: { output_tokens?: number };
        };
        if (evt.type === 'message_start' && evt.message?.usage) {
          inputTokens = evt.message.usage.input_tokens ?? inputTokens;
          outputTokens = evt.message.usage.output_tokens ?? outputTokens;
        } else if (evt.type === 'message_delta' && evt.usage) {
          outputTokens = evt.usage.output_tokens ?? outputTokens;
        }
      } catch {
        // ignore parse failures
      }
    }
  }

  return { input_tokens: inputTokens, output_tokens: outputTokens };
}
