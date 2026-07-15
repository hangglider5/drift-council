import { createDevvitTest } from '@devvit/test/server/vitest';
import { redis } from '@devvit/web/server';
import { expect, vi } from 'vitest';
import { getDayId, previousDayId } from '../../shared/map';
import { api } from './api';

const test = createDevvitTest();
const unauthenticatedTest = createDevvitTest({ userId: '' as never });

const messages = {
  UNAUTHENTICATED: "Sign in to join today's voyage.",
  INVALID_GUST: 'Choose one valid grid cell and cardinal direction.',
  STALE_DAY: "That voyage just closed. Loading today's field…",
  ALREADY_COMMITTED: 'Your gust for this UTC day is already set.',
  INTERNAL: 'The current shifted unexpectedly. Please retry.',
} as const;

function postJson(body: unknown): RequestInit {
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  };
}

function expectExactKeys(
  body: Record<string, unknown>,
  expected: string[]
): void {
  expect(Object.keys(body).sort()).toStrictEqual(expected.sort());
}

test('GET /voyage returns the authoritative state', async () => {
  const response = await api.request('/voyage');
  const body = await response.json();

  expect(response.status).toBe(200);
  expect(body).toMatchObject({
    dayId: getDayId(new Date()),
    mapVersion: 1,
    playerContribution: null,
  });
  expect(body).not.toHaveProperty('userId');
  expect(body).not.toHaveProperty('username');
});

test('POST /gust returns 201, then 200 for an identical retry', async () => {
  const request = {
    dayId: getDayId(new Date()),
    cell: { x: 2, y: 2 },
    direction: 'E',
  };

  const first = await api.request('/gust', postJson(request));
  expect(first.status).toBe(201);
  expect(await first.json()).toMatchObject({
    status: 'committed',
    state: { playerContribution: { cell: { x: 2, y: 2 }, direction: 'E' } },
  });

  const retry = await api.request('/gust', postJson(request));
  expect(retry.status).toBe(200);
  expect(await retry.json()).toMatchObject({ status: 'idempotent' });
});

test('POST /gust rejects malformed input with an exact public envelope', async () => {
  const response = await api.request(
    '/gust',
    postJson({
      dayId: getDayId(new Date()),
      cell: { x: 2.5, y: 2 },
      direction: 'E',
    })
  );
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body).toStrictEqual({
    status: 'error',
    code: 'INVALID_GUST',
    message: messages.INVALID_GUST,
  });
  expectExactKeys(body, ['status', 'code', 'message']);
});

test('POST /gust rejects malformed JSON as INVALID_GUST', async () => {
  const response = await api.request('/gust', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{',
  });
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body).toStrictEqual({
    status: 'error',
    code: 'INVALID_GUST',
    message: messages.INVALID_GUST,
  });
  expectExactKeys(body, ['status', 'code', 'message']);
});

test('POST /gust rejects stale UTC days without committing', async () => {
  const response = await api.request(
    '/gust',
    postJson({
      dayId: previousDayId(getDayId(new Date())),
      cell: { x: 2, y: 2 },
      direction: 'E',
    })
  );
  const body = await response.json();

  expect(response.status).toBe(409);
  expect(body).toStrictEqual({
    status: 'error',
    code: 'STALE_DAY',
    message: messages.STALE_DAY,
  });
  expectExactKeys(body, ['status', 'code', 'message']);
});

test('POST /gust rejects oversized parsed bodies before field validation', async () => {
  const response = await api.request(
    '/gust',
    postJson({ padding: 'x'.repeat(300) })
  );
  const body = await response.json();

  expect(response.status).toBe(400);
  expect(body).toStrictEqual({
    status: 'error',
    code: 'INVALID_GUST',
    message: messages.INVALID_GUST,
  });
  expectExactKeys(body, ['status', 'code', 'message']);
});

test('POST /gust returns only the immutable existing gust on conflict', async () => {
  const request = {
    dayId: getDayId(new Date()),
    cell: { x: 2, y: 2 },
    direction: 'E',
  };
  await api.request('/gust', postJson(request));

  const response = await api.request(
    '/gust',
    postJson({ ...request, direction: 'N' })
  );
  const body = await response.json();

  expect(response.status).toBe(409);
  expect(body).toStrictEqual({
    status: 'error',
    code: 'ALREADY_COMMITTED',
    message: messages.ALREADY_COMMITTED,
    existing: { cell: { x: 2, y: 2 }, direction: 'E' },
  });
  expectExactKeys(body, ['status', 'code', 'message', 'existing']);
});

unauthenticatedTest('GET /voyage requires an authenticated user', async () => {
  const response = await api.request('/voyage');
  const body = await response.json();

  expect(response.status).toBe(401);
  expect(body).toStrictEqual({
    status: 'error',
    code: 'UNAUTHENTICATED',
    message: messages.UNAUTHENTICATED,
  });
  expectExactKeys(body, ['status', 'code', 'message']);
});

test('GET /voyage hides unexpected storage details', async ({ userId }) => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  await redis.hSet(`voyage:${getDayId(new Date())}:gusts`, {
    [userId]: 'corrupt',
  });

  const response = await api.request('/voyage');
  const body = await response.json();

  expect(response.status).toBe(500);
  expect(body).toStrictEqual({
    status: 'error',
    code: 'INTERNAL',
    message: messages.INTERNAL,
  });
  expectExactKeys(body, ['status', 'code', 'message']);
  expect(error).toHaveBeenCalled();
  expect(JSON.stringify(body)).not.toContain(userId);
  expect(JSON.stringify(body)).not.toContain('voyage:');
});
