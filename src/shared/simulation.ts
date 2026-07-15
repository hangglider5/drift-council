import {
  GRID_SIZE,
  GUST_WEIGHT,
  type CellAggregate,
  type MapDefinition,
  type RouteResult,
  type Vec2,
} from './domain';

const DT_SECONDS = 0.12;
const MAX_STEPS = 100;
const MAX_MAGNITUDE = 1.2;

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(Math.max(value, minimum), maximum);
}

function clampMagnitude(vector: Vec2): Vec2 {
  const magnitude = Math.hypot(vector.x, vector.y);
  if (magnitude <= MAX_MAGNITUDE) return vector;

  const scale = MAX_MAGNITUDE / magnitude;
  return { x: vector.x * scale, y: vector.y * scale };
}

function distance(left: Vec2, right: Vec2): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function durationSeconds(stepCount: number): number {
  return Math.round(stepCount * DT_SECONDS * 100) / 100;
}

export function buildEffectiveField(
  map: MapDefinition,
  aggregate: CellAggregate[]
): Vec2[] {
  const gusts = new Map(
    aggregate.map((cellAggregate) => [
      `${cellAggregate.cell.x}:${cellAggregate.cell.y}`,
      cellAggregate.vector,
    ])
  );

  return map.ambient.map((ambient, index) => {
    const x = index % GRID_SIZE;
    const y = Math.floor(index / GRID_SIZE);
    const gust = gusts.get(`${x}:${y}`);
    return clampMagnitude({
      x: ambient.x + (gust?.x ?? 0) * GUST_WEIGHT,
      y: ambient.y + (gust?.y ?? 0) * GUST_WEIGHT,
    });
  });
}

export function sampleField(field: Vec2[], position: Vec2): Vec2 {
  const gx = clamp(position.x - 0.5, 0, 5);
  const gy = clamp(position.y - 0.5, 0, 5);
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const x1 = Math.min(x0 + 1, 5);
  const y1 = Math.min(y0 + 1, 5);
  const tx = gx - x0;
  const ty = gy - y0;

  const topLeft = field[y0 * GRID_SIZE + x0];
  const topRight = field[y0 * GRID_SIZE + x1];
  const bottomLeft = field[y1 * GRID_SIZE + x0];
  const bottomRight = field[y1 * GRID_SIZE + x1];

  if (!topLeft || !topRight || !bottomLeft || !bottomRight) {
    throw new Error('Field must contain one vector for every grid cell');
  }

  const top = {
    x: topLeft.x + (topRight.x - topLeft.x) * tx,
    y: topLeft.y + (topRight.y - topLeft.y) * tx,
  };
  const bottom = {
    x: bottomLeft.x + (bottomRight.x - bottomLeft.x) * tx,
    y: bottomLeft.y + (bottomRight.y - bottomLeft.y) * tx,
  };

  return {
    x: top.x + (bottom.x - top.x) * ty,
    y: top.y + (bottom.y - top.y) * ty,
  };
}

export function simulateRoute(
  map: MapDefinition,
  aggregate: CellAggregate[]
): RouteResult {
  const field = buildEffectiveField(map, aggregate);
  const points = [{ ...map.start }];
  let position = { ...map.start };

  for (let stepCount = 1; stepCount <= MAX_STEPS; stepCount += 1) {
    const vector = sampleField(field, position);
    position = {
      x: position.x + vector.x * DT_SECONDS,
      y: position.y + vector.y * DT_SECONDS,
    };
    points.push(position);

    if (distance(position, map.beacon.center) <= map.beacon.radius) {
      return {
        points,
        outcome: 'reached',
        durationSeconds: durationSeconds(stepCount),
      };
    }

    if (
      map.storms.some(
        (storm) => distance(position, storm.center) <= storm.radius
      )
    ) {
      return {
        points,
        outcome: 'storm',
        durationSeconds: durationSeconds(stepCount),
      };
    }

    if (
      position.x < 0 ||
      position.y < 0 ||
      position.x >= 6 ||
      position.y >= 6
    ) {
      return {
        points,
        outcome: 'lost',
        durationSeconds: durationSeconds(stepCount),
      };
    }
  }

  return {
    points,
    outcome: 'lost',
    durationSeconds: durationSeconds(MAX_STEPS),
  };
}
