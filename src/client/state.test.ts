import { describe, expect, it } from 'vitest';
import type { Direction, Gust, VoyageState } from '../shared/domain';
import { createMap } from '../shared/map';
import { simulateRoute } from '../shared/simulation';
import { initialClientState, reduceClientState } from './state';

const dayId = '2026-07-15';

function voyage(playerContribution: Gust | null = null): VoyageState {
  const map = createMap(dayId);
  return {
    dayId,
    mapVersion: map.mapVersion,
    mapSeed: map.mapSeed,
    aggregate: [],
    contributionCount: playerContribution ? 1 : 0,
    playerContribution,
    route: simulateRoute(map, []),
    previous: {
      kind: 'prologue',
      dayId: 'prologue',
      outcome: 'reached',
      contributionCount: 12,
    },
    secondsRemaining: 900,
  };
}

function previewState(direction: Direction = 'E') {
  const loaded = reduceClientState(initialClientState, {
    type: 'loaded',
    voyage: voyage(),
  });
  const selected = reduceClientState(loaded, {
    type: 'selectCell',
    cell: { x: 2, y: 3 },
  });
  return reduceClientState(selected, { type: 'chooseDirection', direction });
}

describe('client voyage reducer', () => {
  it('loads a new voyage into the ready phase', () => {
    const loaded = reduceClientState(initialClientState, {
      type: 'loaded',
      voyage: voyage(),
    });

    expect(loaded).toMatchObject({
      phase: 'ready',
      voyage: { dayId },
      selectedCell: null,
      pending: null,
      previewRoute: null,
      error: null,
    });
  });

  it('selects a cell while remaining ready', () => {
    const loaded = reduceClientState(initialClientState, {
      type: 'loaded',
      voyage: voyage(),
    });

    expect(
      reduceClientState(loaded, {
        type: 'selectCell',
        cell: { x: 2, y: 3 },
      })
    ).toMatchObject({
      phase: 'ready',
      selectedCell: { x: 2, y: 3 },
      pending: null,
    });
  });

  it('previews a gust direction and recomputes it when the cell changes', () => {
    const preview = previewState('N');
    expect(preview.phase).toBe('preview');
    expect(preview.pending).toStrictEqual({
      cell: { x: 2, y: 3 },
      direction: 'N',
    });
    expect(preview.previewRoute).not.toBeNull();

    const moved = reduceClientState(preview, {
      type: 'selectCell',
      cell: { x: 4, y: 1 },
    });
    expect(moved.phase).toBe('preview');
    expect(moved.pending).toStrictEqual({
      cell: { x: 4, y: 1 },
      direction: 'N',
    });
    expect(moved.previewRoute).not.toBeNull();
  });

  it('submits a preview and accepts the authoritative committed state', () => {
    const submitting = reduceClientState(previewState(), { type: 'submit' });
    expect(submitting.phase).toBe('submitting');

    const authoritative = voyage({ cell: { x: 2, y: 3 }, direction: 'E' });
    expect(
      reduceClientState(submitting, {
        type: 'commitSucceeded',
        voyage: authoritative,
      })
    ).toMatchObject({
      phase: 'committed',
      voyage: authoritative,
      pending: null,
      previewRoute: null,
      error: null,
    });
  });

  it('retains a failed commit for retry', () => {
    const submitting = reduceClientState(previewState('W'), {
      type: 'submit',
    });
    const failed = reduceClientState(submitting, {
      type: 'commitFailed',
      message: 'The current shifted unexpectedly. Please retry.',
    });

    expect(failed).toMatchObject({
      phase: 'error',
      pending: { cell: { x: 2, y: 3 }, direction: 'W' },
      error: 'The current shifted unexpectedly. Please retry.',
    });
    expect(reduceClientState(failed, { type: 'retryCommit' }).phase).toBe(
      'submitting'
    );
  });

  it('clears interactive state on stale rollover', () => {
    const stale = reduceClientState(previewState(), { type: 'staleDay' });

    expect(stale).toMatchObject({
      phase: 'loading',
      voyage: null,
      selectedCell: null,
      pending: null,
      previewRoute: null,
      error: "That voyage just closed. Loading today's field…",
    });
  });

  it('hydrates an existing contribution directly into committed', () => {
    const committed = reduceClientState(initialClientState, {
      type: 'loaded',
      voyage: voyage({ cell: { x: 1, y: 1 }, direction: 'S' }),
    });

    expect(committed).toMatchObject({
      phase: 'committed',
      pending: null,
      previewRoute: null,
    });
  });

  it('ignores selection and direction changes while submitting or committed', () => {
    const submitting = reduceClientState(previewState(), { type: 'submit' });
    expect(
      reduceClientState(submitting, {
        type: 'selectCell',
        cell: { x: 5, y: 5 },
      })
    ).toBe(submitting);
    expect(
      reduceClientState(submitting, {
        type: 'chooseDirection',
        direction: 'S',
      })
    ).toBe(submitting);

    const committed = reduceClientState(initialClientState, {
      type: 'loaded',
      voyage: voyage({ cell: { x: 1, y: 1 }, direction: 'S' }),
    });
    expect(
      reduceClientState(committed, {
        type: 'selectCell',
        cell: { x: 5, y: 5 },
      })
    ).toBe(committed);
  });
});
