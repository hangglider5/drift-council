import { describe, expect, it } from 'vitest';
import type { VoyageState } from '../shared/domain';
import { commitRequestForPhase } from './interaction';
import type { ClientState } from './state';

const voyage: VoyageState = {
  dayId: '2026-07-15',
  mapVersion: 1,
  mapSeed: '2026-07-15',
  aggregate: [],
  contributionCount: 0,
  playerContribution: null,
  route: { points: [], outcome: 'lost', durationSeconds: 12 },
  previous: {
    kind: 'prologue',
    dayId: 'prologue',
    outcome: 'reached',
    contributionCount: 12,
  },
  secondsRemaining: 900,
};

const pending = { cell: { x: 2, y: 3 }, direction: 'W' } as const;

function state(phase: ClientState['phase']): ClientState {
  return {
    phase,
    voyage,
    selectedCell: pending.cell,
    pending,
    previewRoute: null,
    error: phase === 'error' ? 'Gust not committed — retry.' : null,
  };
}

describe('commit request gating', () => {
  it('starts a preview commit once before the state becomes submitting', () => {
    expect(commitRequestForPhase(state('preview'), 'preview')).toStrictEqual({
      dayId: voyage.dayId,
      cell: pending.cell,
      direction: pending.direction,
    });
    expect(commitRequestForPhase(state('submitting'), 'preview')).toBeNull();
  });

  it('retries the retained identical request once from the error phase', () => {
    expect(commitRequestForPhase(state('error'), 'error')).toStrictEqual({
      dayId: voyage.dayId,
      cell: pending.cell,
      direction: pending.direction,
    });
    expect(commitRequestForPhase(state('submitting'), 'error')).toBeNull();
  });
});
