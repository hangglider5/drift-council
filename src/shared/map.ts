import { GRID_SIZE, MAP_VERSION, type MapDefinition } from './domain';
import { createRandom } from './random';

export function getDayId(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function previousDayId(dayId: string): string {
  const date = new Date(`${dayId}T00:00:00.000Z`);
  return getDayId(new Date(date.getTime() - 86_400_000));
}

export function createMap(dayId: string): MapDefinition {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dayId)) {
    throw new Error('Invalid dayId');
  }

  const random = createRandom(`drift-council:v1:${dayId}`);
  const start = { x: 0.35, y: 1.5 + Math.floor(random() * 4) };
  const beacon = {
    center: { x: 5.55, y: 1.25 + random() * 3.5 },
    radius: 0.34,
  };
  const ambient = Array.from({ length: GRID_SIZE * GRID_SIZE }, () => ({
    x: 0.58 + random() * 0.22,
    y: (random() - 0.5) * 0.5,
  }));
  const storms = [2.25, 3.85].map((baseX, index) => ({
    center: {
      x: baseX + (random() - 0.5) * 0.45,
      y: 0.9 + random() * 4.2,
    },
    radius: index === 0 ? 0.44 : 0.5,
  }));

  return {
    dayId,
    mapVersion: MAP_VERSION,
    mapSeed: dayId,
    start,
    beacon,
    storms,
    ambient,
  };
}
