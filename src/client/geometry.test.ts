import { describe, expect, it } from 'vitest';
import { cellCenter, pointToCell } from './geometry';

describe('playfield geometry', () => {
  it('maps canvas points to the six by six grid', () => {
    expect(
      pointToCell({ x: 100, y: 50 }, { x: 40, y: 20, size: 360 })
    ).toStrictEqual({ x: 1, y: 0 });
    expect(
      pointToCell({ x: 399, y: 379 }, { x: 40, y: 20, size: 360 })
    ).toStrictEqual({ x: 5, y: 5 });
  });

  it('rejects points outside the protected square', () => {
    expect(
      pointToCell({ x: 39, y: 100 }, { x: 40, y: 20, size: 360 })
    ).toBeNull();
  });

  it('returns the exact visual center of a cell', () => {
    expect(
      cellCenter({ x: 2, y: 3 }, { x: 40, y: 20, size: 360 })
    ).toStrictEqual({ x: 190, y: 230 });
  });
});
