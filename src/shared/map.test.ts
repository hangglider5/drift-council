import { describe, expect, it } from 'vitest';
import { GRID_SIZE } from './domain';
import { createMap, getDayId, previousDayId } from './map';

describe('UTC voyage calendar', () => {
  it('uses UTC rather than local midnight', () => {
    expect(getDayId(new Date('2026-07-15T23:30:00-07:00'))).toBe('2026-07-16');
    expect(previousDayId('2026-03-01')).toBe('2026-02-28');
  });
});

describe('daily map generation', () => {
  it('is stable for a day and changes on the next day', () => {
    expect(createMap('2026-07-15')).toStrictEqual(createMap('2026-07-15'));
    expect(createMap('2026-07-16')).not.toStrictEqual(createMap('2026-07-15'));
  });

  it('keeps every element inside the legal field', () => {
    for (const dayId of ['2026-01-01', '2026-07-15', '2026-12-31']) {
      const map = createMap(dayId);
      expect(map.ambient).toHaveLength(GRID_SIZE * GRID_SIZE);
      expect(map.start.x).toBeGreaterThanOrEqual(0);
      expect(map.start.y).toBeGreaterThanOrEqual(0);
      expect(map.beacon.center.x).toBeLessThan(GRID_SIZE);
      expect(map.beacon.center.y).toBeLessThan(GRID_SIZE);
      expect(map.storms).toHaveLength(2);
      for (const storm of map.storms) {
        expect(storm.center.x - storm.radius).toBeGreaterThan(0);
        expect(storm.center.x + storm.radius).toBeLessThan(GRID_SIZE);
        expect(storm.center.y - storm.radius).toBeGreaterThan(0);
        expect(storm.center.y + storm.radius).toBeLessThan(GRID_SIZE);
      }
    }
  });
});
