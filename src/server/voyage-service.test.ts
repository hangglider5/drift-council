import { createDevvitTest } from '@devvit/test/server/vitest';
import { expect } from 'vitest';
import type { CommitGustRequest } from '../shared/domain';
import { readGusts, commitStoredGust } from './store';
import { buildVoyageState, commitGustForUser } from './voyage-service';

const test = createDevvitTest();
const now = new Date('2026-07-15T12:00:00Z');
const east: CommitGustRequest = {
  dayId: '2026-07-15',
  cell: { x: 2, y: 2 },
  direction: 'E',
};

test('builds an authoritative UTC state with the prologue fallback', async ({
  userId,
}) => {
  const state = await buildVoyageState(userId, now);

  expect(state.dayId).toBe('2026-07-15');
  expect(state.mapSeed).toBe('2026-07-15');
  expect(state.mapVersion).toBe(1);
  expect(state.playerContribution).toBeNull();
  expect(state.secondsRemaining).toBe(43_200);
  expect(state.previous).toStrictEqual({
    kind: 'prologue',
    dayId: 'prologue',
    outcome: 'reached',
    contributionCount: 12,
  });
});

test('commits once and makes an identical retry idempotent', async ({
  userId,
}) => {
  const committed = await commitGustForUser(userId, east, now);
  expect(committed.kind).toBe('committed');
  if (committed.kind !== 'committed') throw new Error('Expected commit');
  expect(committed.state.playerContribution).toStrictEqual({
    cell: east.cell,
    direction: east.direction,
  });
  expect(committed.state.contributionCount).toBe(1);

  const retried = await commitGustForUser(userId, east, now);
  expect(retried.kind).toBe('idempotent');
});

test('rejects a stale day without writing it', async ({ userId }) => {
  expect(
    await commitGustForUser(userId, { ...east, dayId: '2026-07-14' }, now)
  ).toStrictEqual({ kind: 'stale' });
  expect(await readGusts('2026-07-14')).toStrictEqual([]);
});

test('reports the immutable existing choice on a conflicting retry', async ({
  userId,
}) => {
  await commitGustForUser(userId, east, now);

  expect(
    await commitGustForUser(userId, { ...east, direction: 'N' }, now)
  ).toStrictEqual({
    kind: 'conflict',
    existing: { cell: east.cell, direction: east.direction },
  });
});

test('derives the prior-day voyage when canonical gusts exist', async ({
  userId,
}) => {
  await commitStoredGust('2026-07-14', userId, {
    cell: { x: 2, y: 2 },
    direction: 'E',
  });

  const state = await buildVoyageState(userId, now);
  expect(state.previous).toMatchObject({
    kind: 'previous',
    dayId: '2026-07-14',
    contributionCount: 1,
  });
  expect(state.previous.outcome).toMatch(/^(reached|storm|lost)$/);
});
