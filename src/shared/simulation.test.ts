import { describe, expect, it } from 'vitest';
import { aggregateGusts } from './aggregation';
import {
  MAP_VERSION,
  type MapDefinition,
  type Storm,
  type Vec2,
} from './domain';
import { simulateRoute } from './simulation';

function constantMap(vector: Vec2, storms: Storm[] = []): MapDefinition {
  return {
    dayId: '2026-07-15',
    mapVersion: MAP_VERSION,
    mapSeed: 'constant',
    start: { x: 0.35, y: 3 },
    beacon: { center: { x: 5.55, y: 3 }, radius: 0.34 },
    storms,
    ambient: Array.from({ length: 36 }, () => ({ ...vector })),
  };
}

describe('simulateRoute', () => {
  it('reaches the beacon in a following wind', () => {
    expect(simulateRoute(constantMap({ x: 0.75, y: 0 }), []).outcome).toBe(
      'reached'
    );
  });

  it('ends when the route enters a storm', () => {
    expect(
      simulateRoute(
        constantMap({ x: 0.75, y: 0 }, [
          { center: { x: 2.5, y: 3 }, radius: 0.5 },
        ]),
        []
      ).outcome
    ).toBe('storm');
  });

  it('is lost when the route leaves the field', () => {
    expect(simulateRoute(constantMap({ x: -0.75, y: 0 }), []).outcome).toBe(
      'lost'
    );
  });

  it('is deterministic for identical inputs', () => {
    expect(simulateRoute(constantMap({ x: 0.75, y: 0 }), [])).toStrictEqual(
      simulateRoute(constantMap({ x: 0.75, y: 0 }), [])
    );
  });

  it('keeps every route point finite for a large crowd', () => {
    const crowd = aggregateGusts(
      Array.from({ length: 1000 }, (_, index) => ({
        cell: { x: index % 6, y: Math.floor(index / 6) % 6 },
        direction: index % 2 === 0 ? ('N' as const) : ('S' as const),
      }))
    );
    expect(
      simulateRoute(constantMap({ x: 0.75, y: 0 }), crowd)
        .points.flatMap(({ x, y }) => [x, y])
        .every(Number.isFinite)
    ).toBe(true);
  });
});
