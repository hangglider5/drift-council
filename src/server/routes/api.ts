import { context } from '@devvit/web/server';
import { Hono, type Context } from 'hono';
import type { ApiErrorBody, Gust } from '../../shared/domain';
import { parseCommitGust } from '../../shared/validation';
import { buildVoyageState, commitGustForUser } from '../voyage-service';

const messages = {
  UNAUTHENTICATED: "Sign in to join today's voyage.",
  INVALID_GUST: 'Choose one valid grid cell and cardinal direction.',
  STALE_DAY: "This voyage has ended. Refresh to join today's current.",
  ALREADY_COMMITTED: 'Your gust for this UTC day is already set.',
  INTERNAL: 'The current shifted unexpectedly. Please retry.',
} as const;

type ApiErrorCode = ApiErrorBody['code'];

function publicError(
  c: Context,
  status: 400 | 401 | 409 | 500,
  code: ApiErrorCode,
  existing?: Gust
): Response {
  const body: ApiErrorBody = {
    status: 'error',
    code,
    message: messages[code],
    ...(existing ? { existing } : {}),
  };
  return c.json(body, status);
}

function unexpected(c: Context, error: unknown): Response {
  console.error('Voyage API error', error);
  return publicError(c, 500, 'INTERNAL');
}

export const api = new Hono();

api.get('/voyage', async (c) => {
  if (!context.userId) {
    return publicError(c, 401, 'UNAUTHENTICATED');
  }

  try {
    return c.json(await buildVoyageState(context.userId, new Date()));
  } catch (error) {
    return unexpected(c, error);
  }
});

api.post('/gust', async (c) => {
  if (!context.userId) {
    return publicError(c, 401, 'UNAUTHENTICATED');
  }

  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return publicError(c, 400, 'INVALID_GUST');
  }

  if (JSON.stringify(rawBody).length > 256) {
    return publicError(c, 400, 'INVALID_GUST');
  }

  let request;
  try {
    request = parseCommitGust(rawBody);
  } catch {
    return publicError(c, 400, 'INVALID_GUST');
  }

  try {
    const result = await commitGustForUser(context.userId, request, new Date());
    if (result.kind === 'stale') {
      return publicError(c, 409, 'STALE_DAY');
    }
    if (result.kind === 'conflict') {
      return publicError(c, 409, 'ALREADY_COMMITTED', result.existing);
    }

    return c.json(
      { status: result.kind, state: result.state },
      result.kind === 'committed' ? 201 : 200
    );
  } catch (error) {
    return unexpected(c, error);
  }
});
