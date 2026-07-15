import {
  GRID_SIZE,
  type CommitGustRequest,
  type Direction,
  type Gust,
} from './domain';

const directions = new Set<Direction>(['N', 'E', 'S', 'W']);

export function parseCommitGust(value: unknown): CommitGustRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid gust');
  }

  const input = value as Record<string, unknown>;
  const cell = input.cell as Record<string, unknown> | undefined;
  if (
    Object.keys(input).sort().join(',') !== 'cell,dayId,direction' ||
    !cell ||
    Object.keys(cell).sort().join(',') !== 'x,y' ||
    typeof input.dayId !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(input.dayId) ||
    !Number.isInteger(cell.x) ||
    !Number.isInteger(cell.y) ||
    (cell.x as number) < 0 ||
    (cell.x as number) >= GRID_SIZE ||
    (cell.y as number) < 0 ||
    (cell.y as number) >= GRID_SIZE ||
    typeof input.direction !== 'string' ||
    !directions.has(input.direction as Direction)
  ) {
    throw new Error('Invalid gust');
  }

  return input as CommitGustRequest;
}

export function encodeGust(gust: Gust): string {
  return `${gust.cell.x},${gust.cell.y},${gust.direction}`;
}

export function decodeGust(value: string): Gust {
  const match = /^(\d),(\d),(N|E|S|W)$/.exec(value);
  if (!match) throw new Error('Invalid stored gust');

  const parsed = parseCommitGust({
    dayId: '2000-01-01',
    cell: { x: Number(match[1]), y: Number(match[2]) },
    direction: match[3],
  });
  return { cell: parsed.cell, direction: parsed.direction };
}
