import { expect, test, vi } from 'vitest';
import type { Mock } from 'vitest';

import OpenAI from 'openai';
import { ResponsesWS as StableResponsesWS } from 'openai/resources/responses/ws';
import { ResponsesWS as BetaResponsesWS } from 'openai/resources/beta/responses/ws';
import * as WS from 'ws';

function CapturingWebSocket() {
  return {
    readyState: 0,
    on: vi.fn(),
    removeListener: vi.fn(),
    send: vi.fn(),
    close: vi.fn(),
  };
}

vi.mock('ws', () => ({ WebSocket: vi.fn(CapturingWebSocket) }));

const webSocketConstructor = WS.WebSocket as unknown as Mock;

function lastHeaders(): Record<string, string> {
  const [, options] = webSocketConstructor.mock.calls.at(-1) as [URL, WS.ClientOptions];
  return options.headers as Record<string, string>;
}

test.each([
  ['stable', StableResponsesWS],
  ['beta', BetaResponsesWS],
])('%s Responses WebSocket keeps generated bearer auth over caller headers', (_name, Responses) => {
  new Responses(new OpenAI({ apiKey: 'sdk-key' }), {
    headers: { Authorization: 'Bearer caller-key', 'X-Custom': 'value' },
  });

  expect(lastHeaders()).toMatchObject({
    Authorization: 'Bearer sdk-key',
    'X-Custom': 'value',
  });
});

test.each([
  ['stable', StableResponsesWS],
  ['beta', BetaResponsesWS],
])('%s Responses WebSocket preserves caller auth without an API key', (_name, Responses) => {
  new Responses(new OpenAI({ apiKey: null, adminAPIKey: 'admin-key' }), {
    headers: { Authorization: 'Basic caller-auth' },
  });

  expect(lastHeaders().Authorization).toBe('Basic caller-auth');
});
