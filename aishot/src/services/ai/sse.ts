export type SseEvent = {
  event?: string;
  data: string;
};

export type RawToolCall = { name: string; input: unknown };

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

export type CoachStreamEvent =
  | { kind: 'text'; text: string }
  | { kind: 'tool'; call: RawToolCall }
  | { kind: 'stop'; reason?: string };

type ContentBlockStartEvent = {
  type: 'content_block_start';
  index: number;
  content_block: {
    type: 'text' | 'tool_use';
    id?: string;
    name?: string;
    input?: unknown;
  };
};

type ContentBlockDeltaEvent = {
  type: 'content_block_delta';
  index: number;
  delta:
    | { type: 'text_delta'; text: string }
    | { type: 'input_json_delta'; partial_json: string };
};

type ContentBlockStopEvent = {
  type: 'content_block_stop';
  index: number;
};

type MessageStopEvent = {
  type: 'message_stop';
};

type MessageDeltaEvent = {
  type: 'message_delta';
  delta: { stop_reason?: string };
};

export async function* readCoachStream(
  response: Response,
): AsyncGenerator<CoachStreamEvent, void> {
  const blockNames = new Map<number, string>();
  const blockJson = new Map<number, string>();

  for await (const evt of readClaudeEvents(response)) {
    if (evt.type === 'content_block_start') {
      const e = evt as unknown as ContentBlockStartEvent;
      if (e.content_block.type === 'tool_use' && e.content_block.name) {
        blockNames.set(e.index, e.content_block.name);
        blockJson.set(e.index, '');
      }
    } else if (evt.type === 'content_block_delta') {
      const e = evt as unknown as ContentBlockDeltaEvent;
      if (e.delta.type === 'text_delta') {
        yield { kind: 'text', text: e.delta.text };
      } else if (e.delta.type === 'input_json_delta') {
        const prev = blockJson.get(e.index) ?? '';
        blockJson.set(e.index, prev + e.delta.partial_json);
      }
    } else if (evt.type === 'content_block_stop') {
      const e = evt as unknown as ContentBlockStopEvent;
      const name = blockNames.get(e.index);
      const json = blockJson.get(e.index);
      blockNames.delete(e.index);
      blockJson.delete(e.index);
      if (name && json !== undefined) {
        const parsed = safeParseJson(json);
        if (parsed !== undefined) {
          yield { kind: 'tool', call: { name, input: parsed } };
        }
      }
    } else if (evt.type === 'message_delta') {
      const e = evt as unknown as MessageDeltaEvent;
      if (e.delta?.stop_reason) {
        yield { kind: 'stop', reason: e.delta.stop_reason };
      }
    } else if (evt.type === 'message_stop') {
      const _e = evt as unknown as MessageStopEvent;
      void _e;
    }
  }
}

function safeParseJson(s: string): unknown {
  if (!s) return {};
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
}
