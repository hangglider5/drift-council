import { aggregateGusts } from '../shared/aggregation';
import {
  MAP_VERSION,
  type CommitGustRequest,
  type Gust,
  type PreviousVoyage,
  type PrologueVoyage,
  type VoyageState,
} from '../shared/domain';
import { createMap, getDayId, previousDayId } from '../shared/map';
import { simulateRoute } from '../shared/simulation';
import { commitStoredGust, readGusts, readPlayerGust } from './store';

const prologue: PrologueVoyage = {
  kind: 'prologue',
  dayId: 'prologue',
  outcome: 'reached',
  contributionCount: 12,
};

function secondsToNextUtcDay(now: Date): number {
  const nextMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1
  );
  return Math.max(0, Math.floor((nextMidnight - now.getTime()) / 1000));
}

async function buildPreviousVoyage(
  dayId: string
): Promise<PreviousVoyage | PrologueVoyage> {
  const previousId = previousDayId(dayId);
  const gusts = await readGusts(previousId);
  if (gusts.length === 0) return prologue;

  const aggregate = aggregateGusts(gusts);
  return {
    kind: 'previous',
    dayId: previousId,
    outcome: simulateRoute(createMap(previousId), aggregate).outcome,
    contributionCount: gusts.length,
  };
}

export async function buildVoyageState(
  userId: string,
  now: Date
): Promise<VoyageState> {
  const dayId = getDayId(now);
  const [gusts, playerContribution, previous] = await Promise.all([
    readGusts(dayId),
    readPlayerGust(dayId, userId),
    buildPreviousVoyage(dayId),
  ]);
  const aggregate = aggregateGusts(gusts);

  return {
    dayId,
    mapVersion: MAP_VERSION,
    mapSeed: dayId,
    aggregate,
    contributionCount: gusts.length,
    playerContribution,
    route: simulateRoute(createMap(dayId), aggregate),
    previous,
    secondsRemaining: secondsToNextUtcDay(now),
  };
}

export async function commitGustForUser(
  userId: string,
  request: CommitGustRequest,
  now: Date
): Promise<
  | { kind: 'committed' | 'idempotent'; state: VoyageState }
  | { kind: 'stale' }
  | { kind: 'conflict'; existing: Gust }
> {
  if (request.dayId !== getDayId(now)) return { kind: 'stale' };

  const gust = { cell: request.cell, direction: request.direction };
  const result = await commitStoredGust(request.dayId, userId, gust);
  if (result.kind === 'conflict') {
    return { kind: 'conflict', existing: result.gust };
  }

  return {
    kind: result.kind === 'inserted' ? 'committed' : 'idempotent',
    state: await buildVoyageState(userId, now),
  };
}
