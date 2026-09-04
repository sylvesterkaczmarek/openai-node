import { describe, expect, test } from 'vitest';

import { decodeWebSocketTextData } from 'openai/internal/ws';

describe('decodeWebSocketTextData', () => {
  test('returns string frames unchanged', () => {
    expect(decodeWebSocketTextData('{"type":"response.completed"}')).toBe(
      '{"type":"response.completed"}',
    );
  });

  test('decodes ArrayBuffer text frames as UTF-8', () => {
    const bytes = new TextEncoder().encode('{"type":"response.completed","text":"café"}');

    expect(decodeWebSocketTextData(bytes.buffer)).toBe('{"type":"response.completed","text":"café"}');
  });

  test('decodes typed-array views using their byte offset and length', () => {
    const payload = '{"type":"response.completed","text":"✓"}';
    const wrapped = new TextEncoder().encode(`xx${payload}yy`);
    const view = wrapped.subarray(2, wrapped.byteLength - 2);

    expect(decodeWebSocketTextData(view)).toBe(payload);
  });
});
