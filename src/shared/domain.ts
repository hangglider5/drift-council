export const GRID_SIZE = 6;
export const MAP_VERSION = 1 as const;
export const GUST_WEIGHT = 0.9;
export const DATA_TTL_SECONDS = 30 * 24 * 60 * 60;

export type Direction = 'N' | 'E' | 'S' | 'W';
export type Vec2 = { x: number; y: number };
export type GridCell = { x: number; y: number };
export type Gust = { cell: GridCell; direction: Direction };
export type CellAggregate = { cell: GridCell; vector: Vec2; count: number };
export type Storm = { center: Vec2; radius: number };

export type MapDefinition = {
  dayId: string;
  mapVersion: typeof MAP_VERSION;
  mapSeed: string;
  start: Vec2;
  beacon: { center: Vec2; radius: number };
  storms: Storm[];
  ambient: Vec2[];
};

export type RouteOutcome = 'reached' | 'storm' | 'lost';
export type RouteResult = {
  points: Vec2[];
  outcome: RouteOutcome;
  durationSeconds: number;
};

export type PreviousVoyage = {
  kind: 'previous';
  dayId: string;
  outcome: RouteOutcome;
  contributionCount: number;
};

export type PrologueVoyage = {
  kind: 'prologue';
  dayId: 'prologue';
  outcome: 'reached';
  contributionCount: 12;
};

export type VoyageState = {
  dayId: string;
  mapVersion: typeof MAP_VERSION;
  mapSeed: string;
  aggregate: CellAggregate[];
  contributionCount: number;
  playerContribution: Gust | null;
  route: RouteResult;
  previous: PreviousVoyage | PrologueVoyage;
  secondsRemaining: number;
};

export type CommitGustRequest = {
  dayId: string;
  cell: GridCell;
  direction: Direction;
};
export type CommitGustResponse = {
  status: 'committed' | 'idempotent';
  state: VoyageState;
};
export type ApiErrorBody = {
  status: 'error';
  code:
    | 'UNAUTHENTICATED'
    | 'INVALID_GUST'
    | 'STALE_DAY'
    | 'ALREADY_COMMITTED'
    | 'INTERNAL';
  message: string;
  existing?: Gust;
};
