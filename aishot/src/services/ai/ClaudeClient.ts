import { PROXY_URL } from './config';
import { clearProxyToken, getProxyToken } from './deviceToken';
import { readCoachStream, readTextDeltas, type CoachStreamEvent } from './sse';
import type {
  Budget,
  ChatMessage,
  FeatureSnapshot,
  Intent,
  TrackerSnapshot,
} from './types';

type ChatArgs = {
  sessionId: string;
  messages: ChatMessage[];
  intent?: Intent;
  useOpus?: boolean;
};

type CoachArgs = {
  sessionId: string;
  intent?: Intent;
  features: FeatureSnapshot;
  tracker?: TrackerSnapshot;
  imageBase64: string;
  lastMessages?: ChatMessage[];
};

type CritiqueArgs = {
  sessionId: string;
  imageBase64: string;
  settings: {
    iso: number;
    shutterSeconds: number;
    ev: number;
    wbKelvin: number;
  };
};

export class ClaudeClient {
  async streamChat(args: ChatArgs): Promise<AsyncIterable<string>> {
    const res = await this.post('/v1/chat', {
      session_id: args.sessionId,
      messages: args.messages,
      intent: args.intent,
      use_opus: args.useOpus ?? false,
    });
    return readTextDeltas(res);
  }

  async streamCoach(
    args: CoachArgs,
    signal?: AbortSignal,
  ): Promise<AsyncIterable<CoachStreamEvent>> {
    const res = await this.post(
      '/v1/coach',
      {
        session_id: args.sessionId,
        intent: args.intent,
        features: args.features,
        tracker: args.tracker,
        image_base64: args.imageBase64,
        last_messages: args.lastMessages,
      },
      signal,
    );
    return readCoachStream(res);
  }

  async streamCritique(args: CritiqueArgs): Promise<AsyncIterable<string>> {
    const res = await this.post('/v1/critique', {
      session_id: args.sessionId,
      image_base64: args.imageBase64,
      settings_used: {
        iso: args.settings.iso,
        shutter_seconds: args.settings.shutterSeconds,
        ev: args.settings.ev,
        wb_kelvin: args.settings.wbKelvin,
      },
    });
    return readTextDeltas(res);
  }

  async getBudget(): Promise<Budget> {
    const token = await getProxyToken();
    const res = await fetch(`${PROXY_URL}/v1/budget`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`budget_failed: ${res.status}`);
    return (await res.json()) as Budget;
  }

  async resetToken(): Promise<void> {
    await clearProxyToken();
  }

  private async post(
    path: string,
    body: unknown,
    signal?: AbortSignal,
  ): Promise<Response> {
    const token = await getProxyToken();
    const res = await fetch(`${PROXY_URL}${path}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
        Accept: 'text/event-stream',
      },
      body: JSON.stringify(body),
      signal,
    });
    if (res.status === 401) {
      await clearProxyToken();
      throw new Error('auth_failed: token cleared, retry');
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`proxy_error: ${res.status} ${text}`);
    }
    return res;
  }
}

export const claudeClient = new ClaudeClient();
