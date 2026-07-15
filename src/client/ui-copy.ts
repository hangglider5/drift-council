import type { RouteOutcome } from '../shared/domain';

export const LOAD_FAILURE_MESSAGE = 'The current is hard to read. Retry.';
export const COMMIT_FAILURE_MESSAGE = 'Gust not committed — retry.';

const committedOutcomeCopy: Record<RouteOutcome, string> = {
  reached: 'Your gust joined the council. The beacon is within reach.',
  storm: 'Your gust joined the council. The route still crosses the squall.',
  lost: 'Your gust joined the council. The Driftling still needs help.',
};

export function committedOutcomeMessage(outcome: RouteOutcome): string {
  return committedOutcomeCopy[outcome];
}
