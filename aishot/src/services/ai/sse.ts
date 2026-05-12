export type SseEvent = {
  event?: string;
  data: string;
};

export type ClaudeEvent =
  | { type: 'content_block_delta'; delta: { type: 'text_delta'; text: string } }
  | { type: 'message_start'; message: { usage?: { input_tokens: number } } }
  | { type: 'message_delta'; delta: { stop_reason?: string }; usage?: { output_tokens: number } }
  | { type: 'message_stop' }
  | { type: 'ping' }
  | { type: string; [k: string]: unknown };

export async function* readSse(response: Response): AsyncGenerator<SseEvent, void> {
  if (!response.body) throw new Error('no_response_body');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let nl;
      while ((nl = buffer.indexOf('\n\n')) !== -1) {
        const block = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 2);
        yield parseEventBlock(block);
      }
    }
    if (buffer.trim().length > 0) {
      yield parseEventBlock(buffer);
    }
  } finally {
    reader.releaseLock();
  }
}

function parseEventBlock(block: string): SseEvent {
  let event: string | undefined;
  const dataLines: string[] = [];
  for (const line of block.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim();
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim());
    }
  }
  return { event, data: dataLines.join('\n') };
}

export async function* readClaudeEvents(
  response: Response,
): AsyncGenerator<ClaudeEvent, void> {
  for await (const sse of readSse(response)) {
    if (!sse.data || sse.data === '[DONE]') continue;
    try {
      yield JSON.parse(sse.data) as ClaudeEvent;
    } catch {
      // skip malformed events
    }
  }
}

export async function* readTextDeltas(
  response: Response,
): AsyncGenerator<string, void> {
  for await (const evt of readClaudeEvents(response)) {
    if (evt.type === 'content_block_delta' && evt.delta?.type === 'text_delta') {
      yield evt.delta.text;
    }
  }
}
