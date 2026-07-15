import { describe, expect, it } from 'vitest';
import { parseCommitGust } from './validation';

describe('parseCommitGust', () => {
  it('accepts a complete gust in the legal grid', () => {
    expect(
      parseCommitGust({
        dayId: '2026-07-15',
        cell: { x: 0, y: 5 },
        direction: 'W',
      })
    ).toStrictEqual({
      dayId: '2026-07-15',
      cell: { x: 0, y: 5 },
      direction: 'W',
    });
  });

  it.each([
    [
      'fractional x',
      { dayId: '2026-07-15', cell: { x: 0.5, y: 5 }, direction: 'W' },
    ],
    [
      'fractional y',
      { dayId: '2026-07-15', cell: { x: 0, y: 4.5 }, direction: 'W' },
    ],
    [
      'negative coordinate',
      { dayId: '2026-07-15', cell: { x: -1, y: 5 }, direction: 'W' },
    ],
    [
      'coordinate past the grid',
      { dayId: '2026-07-15', cell: { x: 0, y: 6 }, direction: 'W' },
    ],
    [
      'unknown direction',
      { dayId: '2026-07-15', cell: { x: 0, y: 5 }, direction: 'NW' },
    ],
    [
      'malformed day',
      { dayId: '2026-7-15', cell: { x: 0, y: 5 }, direction: 'W' },
    ],
    ['array', []],
    ['string', 'west'],
    ['missing day', { cell: { x: 0, y: 5 }, direction: 'W' }],
    [
      'missing cell property',
      { dayId: '2026-07-15', cell: { x: 0 }, direction: 'W' },
    ],
    [
      'extra property',
      {
        dayId: '2026-07-15',
        cell: { x: 0, y: 5 },
        direction: 'W',
        userId: 't2_spoofed',
      },
    ],
  ])('rejects %s', (_label, value) => {
    expect(() => parseCommitGust(value)).toThrow(new Error('Invalid gust'));
  });
});
