import { expect, it } from 'vitest';
import type { VoyageState } from '../shared/domain';
import { displayedDirection } from './hud';
import { initialClientState, type ClientState } from './state';

const authoritativeVoyage: VoyageState = {
  dayId: '2026-07-15',
  mapVersion: 1,
  mapSeed: '2026-07-15',
  aggregate: [],
  contributionCount: 1,
  playerContribution: { cell: { x: 2, y: 3 }, direction: 'W' },
  route: { points: [], outcome: 'lost', durationSeconds: 12 },
  previous: {
    kind: 'prologue',
    dayId: 'prologue',
    outcome: 'reached',
    contributionCount: 12,
  },
  secondsRemaining: 900,
};

it('shows the pending direction before the authoritative contribution', () => {
  const committed: ClientState = {
    ...initialClientState,
    phase: 'committed',
    voyage: authoritativeVoyage,
    selectedCell: authoritativeVoyage.playerContribution?.cell ?? null,
  };
  expect(displayedDirection(committed)).toBe('W');

  const preview: ClientState = {
    ...committed,
    phase: 'preview',
    pending: { cell: { x: 1, y: 1 }, direction: 'N' },
  };
  expect(displayedDirection(preview)).toBe('N');
  expect(displayedDirection(initialClientState)).toBeNull();
});
