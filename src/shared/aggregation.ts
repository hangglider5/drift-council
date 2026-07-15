import type { CellAggregate, Direction, Gust, Vec2 } from './domain';

export const directionVector: Record<Direction, Vec2> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

function compareCells(left: CellAggregate, right: CellAggregate): number {
  return left.cell.y - right.cell.y || left.cell.x - right.cell.x;
}

export function aggregateGusts(gusts: Gust[]): CellAggregate[] {
  const groups = new Map<
    string,
    { cell: Gust['cell']; sum: Vec2; count: number }
  >();

  for (const gust of gusts) {
    const key = `${gust.cell.x}:${gust.cell.y}`;
    const vector = directionVector[gust.direction];
    const group = groups.get(key);

    if (group) {
      group.sum.x += vector.x;
      group.sum.y += vector.y;
      group.count += 1;
    } else {
      groups.set(key, {
        cell: { ...gust.cell },
        sum: { ...vector },
        count: 1,
      });
    }
  }

  return Array.from(groups.values(), ({ cell, sum, count }) => ({
    cell,
    vector: { x: sum.x / count, y: sum.y / count },
    count,
  })).sort(compareCells);
}

export function withCandidateGust(
  base: CellAggregate[],
  candidate: Gust
): CellAggregate[] {
  const key = `${candidate.cell.x}:${candidate.cell.y}`;
  const vector = directionVector[candidate.direction];
  let found = false;

  const preview = base.map((aggregate) => {
    if (`${aggregate.cell.x}:${aggregate.cell.y}` !== key) {
      return {
        cell: { ...aggregate.cell },
        vector: { ...aggregate.vector },
        count: aggregate.count,
      };
    }

    found = true;
    const count = aggregate.count + 1;
    return {
      cell: { ...aggregate.cell },
      vector: {
        x: (aggregate.vector.x * aggregate.count + vector.x) / count,
        y: (aggregate.vector.y * aggregate.count + vector.y) / count,
      },
      count,
    };
  });

  if (!found) {
    preview.push({
      cell: { ...candidate.cell },
      vector: { ...vector },
      count: 1,
    });
  }

  return preview.sort(compareCells);
}
