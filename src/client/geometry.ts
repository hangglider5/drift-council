import { GRID_SIZE, type GridCell, type Vec2 } from '../shared/domain';

export type PlayfieldBounds = { x: number; y: number; size: number };

export function pointToCell(
  point: Vec2,
  bounds: PlayfieldBounds
): GridCell | null {
  if (
    point.x < bounds.x ||
    point.y < bounds.y ||
    point.x >= bounds.x + bounds.size ||
    point.y >= bounds.y + bounds.size
  ) {
    return null;
  }

  const cellSize = bounds.size / GRID_SIZE;
  return {
    x: Math.floor((point.x - bounds.x) / cellSize),
    y: Math.floor((point.y - bounds.y) / cellSize),
  };
}

export function cellCenter(cell: GridCell, bounds: PlayfieldBounds): Vec2 {
  const cellSize = bounds.size / GRID_SIZE;
  return {
    x: bounds.x + (cell.x + 0.5) * cellSize,
    y: bounds.y + (cell.y + 0.5) * cellSize,
  };
}
