import { describe, expect, it } from 'vitest';
import { aggregateGusts, withCandidateGust } from './aggregation';

describe('aggregateGusts', () => {
  it('gives equal weight and cancels opposite votes', () => {
    const aggregate = aggregateGusts([
      { cell: { x: 2, y: 3 }, direction: 'N' },
      { cell: { x: 2, y: 3 }, direction: 'S' },
      { cell: { x: 2, y: 3 }, direction: 'E' },
    ]);
    expect(aggregate).toStrictEqual([
      { cell: { x: 2, y: 3 }, vector: { x: 1 / 3, y: 0 }, count: 3 },
    ]);
  });

  it('adds a preview without mutating the authoritative aggregate', () => {
    const base = [{ cell: { x: 1, y: 1 }, vector: { x: 1, y: 0 }, count: 1 }];
    const preview = withCandidateGust(base, {
      cell: { x: 1, y: 1 },
      direction: 'N',
    });
    expect(base[0]?.count).toBe(1);
    expect(preview[0]).toStrictEqual({
      cell: { x: 1, y: 1 },
      vector: { x: 0.5, y: -0.5 },
      count: 2,
    });
  });
});
