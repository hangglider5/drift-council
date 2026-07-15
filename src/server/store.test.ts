import { createDevvitTest } from '@devvit/test/server/vitest';
import { redis } from '@devvit/web/server';
import { expect, vi } from 'vitest';
import { DATA_TTL_SECONDS } from '../shared/domain';
import { commitStoredGust, readGusts } from './store';

const test = createDevvitTest();
const east = { cell: { x: 2, y: 2 }, direction: 'E' as const };
const north = { cell: { x: 2, y: 2 }, direction: 'N' as const };

test('inserts once and makes identical retries idempotent', async ({
  userId,
}) => {
  expect(await commitStoredGust('2026-07-15', userId, east)).toStrictEqual({
    kind: 'inserted',
  });
  expect(await commitStoredGust('2026-07-15', userId, east)).toStrictEqual({
    kind: 'same',
    gust: east,
  });
  expect(await readGusts('2026-07-15')).toStrictEqual([east]);
});

test('rejects a different second choice', async ({ userId }) => {
  await commitStoredGust('2026-07-15', userId, east);
  expect(await commitStoredGust('2026-07-15', userId, north)).toStrictEqual({
    kind: 'conflict',
    gust: east,
  });
});

test('isolates UTC days', async ({ userId }) => {
  await commitStoredGust('2026-07-15', userId, east);
  expect(await commitStoredGust('2026-07-16', userId, north)).toStrictEqual({
    kind: 'inserted',
  });
});

test('expires canonical gust storage after thirty days', async ({ userId }) => {
  await commitStoredGust('2026-07-15', userId, east);

  const secondsUntilExpiry =
    (await redis.expireTime('voyage:2026-07-15:gusts')) -
    Math.floor(Date.now() / 1000);

  expect(secondsUntilExpiry).toBeGreaterThan(DATA_TTL_SECONDS - 5);
  expect(secondsUntilExpiry).toBeLessThanOrEqual(DATA_TTL_SECONDS + 1);
});

test('ignores corrupt values while retaining valid stored gusts', async () => {
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  await redis.hSet('voyage:2026-07-15:gusts', {
    t2_valid: '2,2,E',
    t2_corrupt: 'not-a-gust',
  });

  expect(await readGusts('2026-07-15')).toStrictEqual([east]);
  expect(error).toHaveBeenCalledOnce();
  expect(error).toHaveBeenCalledWith(
    'Ignoring corrupt stored gust',
    expect.any(Error)
  );
});
