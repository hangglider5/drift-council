# Drift Council Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and submit a polished Devvit Web interactive post in which each authenticated redditor contributes one daily gust to a deterministic shared voyage.

**Architecture:** Start from Reddit's official Phaser template and preserve its Vite client/Hono server split. Keep map generation, aggregation, validation, and simulation as pure shared TypeScript; let the Hono server own authenticated Redis commits and let Phaser render only serializable voyage state coordinated by a small DOM state machine.

**Tech Stack:** Node.js 22.2+, TypeScript 6, Devvit Web 0.13.7, Phaser 4.2, Hono 4.12, Vite 8, Vitest 3, `@devvit/test` 0.13.7, plain DOM/CSS.

## Global Constraints

- Submission deadline is 2026-07-16 09:00 CST; freeze features at 2026-07-16 06:00 CST, three hours before the deadline.
- Use display name `Drift Council`; prefer slug `drift-council`, falling back only to `drift-voyage` if the first slug is unavailable.
- The playfield is a deterministic 6×6 grid with only `N`, `E`, `S`, and `W` gusts.
- One authenticated Reddit user may commit exactly one immutable gust per UTC day.
- The server is authoritative; never accept a user ID, aggregate, map seed, or route from the client.
- Use only procedural Phaser geometry, CSS, SVG, typography, and particles; do not add third-party or generated art.
- Do not add React, audio, payments, external APIs, LLMs, scheduler jobs, realtime sockets, free text, comments, leaderboards, inventory, or a history gallery.
- All player-facing copy, README content, Devpost content, screenshots, and video captions are English.
- Mobile and desktop must use the same feature set without internal page scrolling.
- Core data expires after 30 days; public responses never contain usernames or user IDs.
- Remove ambient particles, impact prose, and previous-result animation—in that order—before cutting any core interaction or submission deliverable.
- Every implementation task follows red-green-refactor, runs focused tests before the full suite, and ends in a small commit.

---

## File Structure

The scaffold supplies `devvit.json`, Vite configuration, splash/game entrypoints, Hono server entrypoint, and template scenes. The implementation settles on these owned files:

```text
README.md                              Product, install, data-use, and play instructions
SUBMISSION.md                          Final Devpost fields and links checklist
VIDEO_SCRIPT.md                        45–55 second capture plan and voice/caption copy
devvit.json                            App slug, game/splash entrypoints, create-post menu
package.json                           Build, check, test, deploy, and playtest scripts
vitest.config.ts                       Node test configuration
src/shared/domain.ts                   Canonical serializable domain and API types
src/shared/random.ts                   Seed hashing and deterministic PRNG
src/shared/map.ts                      UTC day IDs and deterministic map generation
src/shared/aggregation.ts              Equal-weight cell gust aggregation
src/shared/simulation.ts               Effective field, bilinear sampling, route integration
src/shared/validation.ts               Runtime request and stored-gust validation
src/shared/*.test.ts                   Pure domain tests
src/server/store.ts                    Redis encoding, read, hSetNX commit, and TTL
src/server/voyage-service.ts           Authoritative state and commit orchestration
src/server/routes/api.ts               GET voyage and POST gust HTTP boundary
src/server/routes/api.test.ts          HTTP status and public error-envelope tests
src/server/core/post.ts                Creates the custom post with final title/entrypoint
src/server/store.test.ts               @devvit/test Redis integration tests
src/server/voyage-service.test.ts      Service validation and rollover tests
src/client/api.ts                      Typed fetch wrapper and recoverable API errors
src/client/state.ts                    Explicit client reducer and preview derivation
src/client/state.test.ts               Client transition tests
src/client/geometry.ts                 Canvas/grid coordinate conversion
src/client/geometry.test.ts            Responsive coordinate tests
src/client/hud.ts                      DOM bindings and accessible state rendering
src/client/scenes/DriftScene.ts        Phaser procedural field and route renderer
src/client/game.ts                     Client controller and scene/HUD orchestration
src/client/game.html                   Single-screen semantic DOM shell
src/client/game.css                    Night Current responsive layout and state styles
src/client/splash.html                 Compact post preview
src/client/splash.css                  Preview styling
src/client/splash.ts                   Expanded-mode request only
```

Delete the template-only `Boot.ts`, `Preloader.ts`, `MainMenu.ts`, `Game.ts`, and `GameOver.ts` once `DriftScene.ts` is connected. Delete the sample form and trigger routes and remove their configuration; keep only the create-post moderator menu and the two `/api` endpoints.

## Execution Clock

| Gate | Target | Hard evidence |
|---|---:|---|
| Scaffold and real playtest | 0:45 | Expanded Phaser post opens on Reddit |
| Pure domain complete | 3:00 | Shared tests green and deterministic |
| Redis/server complete | 4:15 | Atomic contribution tests green |
| Interactive client complete | 7:00 | Preview and commit work end-to-end |
| Responsive polish and deployment | 8:15 | Two viewers share state on public demo post |
| Docs, screenshots, video, Devpost | 10:00 | Submitted before deadline |

If a gate slips by more than 30 minutes, apply the stop rules from Global Constraints immediately.

---

### Task 1: Claim the App, Scaffold the Official Phaser Template, and Prove Playtest

**Files:**
- Create from template: `package.json`, `package-lock.json`, `devvit.json`, `tsconfig.json`, `vite.config.ts`, `eslint.config.js`, `.prettierrc`, `public/**`, `src/**`, `tools/**`
- Modify: `.gitignore`
- Modify: `package.json`
- Create: `vitest.config.ts`
- Delete after scaffold: `src/server/routes/forms.ts`, `src/server/routes/triggers.ts`
- Modify: `src/server/index.ts`, `src/server/routes/menu.ts`, `src/server/core/post.ts`, `devvit.json`

**Interfaces:**
- Consumes: approved slug choice and an authenticated Devvit CLI session.
- Produces: a buildable Devvit Phaser 0.13.7 project, `npm test`, and a real expanded-mode playtest post.

- [ ] **Step 1: Claim the app name in the Developer Portal**

Create the app at `https://developers.reddit.com/new` using the Phaser template. Enter `drift-council`; if the portal rejects it as unavailable, enter `drift-voyage`. Record the accepted slug immediately in `devvit.json` and do not rename it again during the sprint.

- [ ] **Step 2: Generate the official scaffold in a temporary directory**

Run:

```bash
cd /private/tmp
npm create devvit@latest --template=phaser drift-council
```

Expected: the wizard authenticates or reuses the saved token, downloads the Phaser starter, and creates `/private/tmp/drift-council/package.json` with `@devvit/web` and `devvit` `0.13.7`, Phaser `4.2.0`, Hono `4.12.28`, and Vite `8.1.3`. If the accepted slug is `drift-voyage`, select that existing app in the wizard while keeping the temporary folder name unchanged.

- [ ] **Step 3: Copy the scaffold into this repository without replacing Git history or design docs**

Run from the repository root:

```bash
rsync -a --exclude='.git' --exclude='.gitignore' /private/tmp/drift-council/ ./
```

Then extend `.gitignore` so it contains exactly these project exclusions in addition to its existing entries:

```gitignore
.devvit/
coverage/
*.log
```

- [ ] **Step 4: Add the test harness and scripts**

Run:

```bash
npm install --save-dev @devvit/test@0.13.7 vitest@3.2.4
```

Add these scripts to `package.json` without changing the template's build, deploy, dev, launch, lint, login, prettier, or type-check commands:

```json
{
  "scripts": {
    "check": "npm run type-check && npm run lint && npm test && npm run build",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

Create `vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    restoreMocks: true,
  },
});
```

- [ ] **Step 5: Strip template-only server capabilities and set final post creation**

Remove `forms` and `triggers` imports/routes from `src/server/index.ts`. In `devvit.json`, remove `forms`, `triggers`, and the `Example form` menu item; preserve `post`, `server`, and the moderator `Create a new post` item. Replace `src/server/core/post.ts` with:

```ts
import { context, reddit } from '@devvit/web/server';

export const createPost = async () => {
  if (!context.subredditName) throw new Error('subredditName is required');
  return reddit.submitCustomPost({
    subredditName: context.subredditName,
    title: 'Drift Council — One gust each. One voyage together.',
    entry: 'default',
  });
};
```

Delete `src/server/routes/forms.ts` and `src/server/routes/triggers.ts`. Keep the template menu handler but ensure it calls `createPost()` and returns a success response.

- [ ] **Step 6: Verify the untouched template builds before feature work**

Run:

```bash
npm run type-check
npm run lint
npm test
npm run build
```

Expected: type-check, lint, and build exit 0; Vitest exits 0 with no tests or the configured `passWithNoTests` behavior. If Vitest exits 1 for no tests, temporarily run `npm test -- --passWithNoTests` only for this step; Task 2 introduces the first tests.

- [ ] **Step 7: Prove Devvit playtest before modifying the game**

Run `npm run dev`, use the generated development subreddit, invoke `Create a new post`, and open expanded mode. Expected: the starter Phaser canvas loads on Reddit. Stop the playtest process after recording the post URL and one screenshot; do not leave two playtest sessions competing for port 5678.

- [ ] **Step 8: Commit the verified scaffold**

```bash
git add .gitignore package.json package-lock.json devvit.json tsconfig.json vite.config.ts eslint.config.js .prettierrc public src tools vitest.config.ts README.md LICENSE AGENTS.md
git commit -m "chore: scaffold Drift Council Devvit app"
```

---

### Task 2: Define the Domain and Generate Stable Daily Maps

**Files:**
- Create: `src/shared/domain.ts`
- Create: `src/shared/random.ts`
- Create: `src/shared/map.ts`
- Create: `src/shared/map.test.ts`
- Delete: `src/shared/api.ts`

**Interfaces:**
- Consumes: no application state; accepts `Date` or `dayId` explicitly.
- Produces: `getDayId(date): string`, `previousDayId(dayId): string`, `createMap(dayId): MapDefinition`, and all canonical serializable types used by every later task.

- [ ] **Step 1: Write failing map and calendar tests**

Create `src/shared/map.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the focused test and confirm the red state**

Run: `npm test -- src/shared/map.test.ts`

Expected: FAIL because `domain.ts` and `map.ts` do not exist.

- [ ] **Step 3: Add canonical domain types**

Create `src/shared/domain.ts` with these exact exported names:

```ts
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

export type CommitGustRequest = { dayId: string; cell: GridCell; direction: Direction };
export type CommitGustResponse = {
  status: 'committed' | 'idempotent';
  state: VoyageState;
};
export type ApiErrorBody = {
  status: 'error';
  code: 'UNAUTHENTICATED' | 'INVALID_GUST' | 'STALE_DAY' | 'ALREADY_COMMITTED' | 'INTERNAL';
  message: string;
  existing?: Gust;
};
```

- [ ] **Step 4: Implement deterministic hashing and PRNG**

Create `src/shared/random.ts`:

```ts
export function hashSeed(input: string): number {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function createRandom(seedText: string): () => number {
  let state = hashSeed(seedText);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 5: Implement UTC helpers and constrained map generation**

Create `src/shared/map.ts`. Use `getDayId(date) = date.toISOString().slice(0, 10)` and compute `previousDayId` by parsing `${dayId}T00:00:00.000Z`, subtracting 86,400,000 ms, and calling `getDayId`. In `createMap(dayId)`:

```ts
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
```

Return `{ dayId, mapVersion: MAP_VERSION, mapSeed: dayId, start, beacon, storms, ambient }`. Reject any `dayId` not matching `/^\d{4}-\d{2}-\d{2}$/` with `Error('Invalid dayId')`.

- [ ] **Step 6: Run focused and full tests**

Run:

```bash
npm test -- src/shared/map.test.ts
npm test
npm run type-check
```

Expected: all map tests pass and TypeScript exits 0.

- [ ] **Step 7: Commit the stable domain foundation**

```bash
git add src/shared
git commit -m "feat: add deterministic daily maps"
```

---

### Task 3: Aggregate Gusts and Simulate the Authoritative Route

**Files:**
- Create: `src/shared/aggregation.ts`
- Create: `src/shared/aggregation.test.ts`
- Create: `src/shared/simulation.ts`
- Create: `src/shared/simulation.test.ts`

**Interfaces:**
- Consumes: `Gust[]`, `MapDefinition`, and the domain constants from Task 2.
- Produces: `directionVector`, `aggregateGusts`, `withCandidateGust`, and `simulateRoute`; both client preview and server authority must call these exact functions.

- [ ] **Step 1: Write failing aggregation tests**

Create `src/shared/aggregation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { aggregateGusts, withCandidateGust } from './aggregation';

describe('aggregateGusts', () => {
  it('gives equal weight and cancels opposite votes', () => {
    const aggregate = aggregateGusts([
      { cell: { x: 2, y: 3 }, direction: 'N' },
      { cell: { x: 2, y: 3 }, direction: 'S' },
      { cell: { x: 2, y: 3 }, direction: 'E' },
    ]);
    expect(aggregate).toStrictEqual([
      { cell: { x: 2, y: 3 }, vector: { x: 1 / 3, y: 0 }, count: 3 },
    ]);
  });

  it('adds a preview without mutating the authoritative aggregate', () => {
    const base = [{ cell: { x: 1, y: 1 }, vector: { x: 1, y: 0 }, count: 1 }];
    const preview = withCandidateGust(base, { cell: { x: 1, y: 1 }, direction: 'N' });
    expect(base[0]?.count).toBe(1);
    expect(preview[0]).toStrictEqual({
      cell: { x: 1, y: 1 },
      vector: { x: 0.5, y: -0.5 },
      count: 2,
    });
  });
});
```

- [ ] **Step 2: Write failing route outcome tests**

Create `src/shared/simulation.test.ts`, importing `aggregateGusts` from `./aggregation` and `simulateRoute` from `./simulation`, with a `constantMap(vector, storms = [])` fixture containing 36 copies of `vector`, start `{x: 0.35, y: 3}`, beacon `{center: {x: 5.55, y: 3}, radius: 0.34}`, and the supplied storms. Assert:

```ts
expect(simulateRoute(constantMap({ x: 0.75, y: 0 }), []).outcome).toBe('reached');
expect(
  simulateRoute(constantMap({ x: 0.75, y: 0 }, [{ center: { x: 2.5, y: 3 }, radius: 0.5 }]), []).outcome,
).toBe('storm');
expect(simulateRoute(constantMap({ x: -0.75, y: 0 }), []).outcome).toBe('lost');
expect(simulateRoute(constantMap({ x: 0.75, y: 0 }), [])).toStrictEqual(
  simulateRoute(constantMap({ x: 0.75, y: 0 }), []),
);

const crowd = aggregateGusts(Array.from({ length: 1000 }, (_, index) => ({
  cell: { x: index % 6, y: Math.floor(index / 6) % 6 },
  direction: index % 2 === 0 ? 'N' as const : 'S' as const,
})));
expect(simulateRoute(constantMap({ x: 0.75, y: 0 }), crowd).points.flatMap(({ x, y }) => [x, y]).every(Number.isFinite)).toBe(true);
```

- [ ] **Step 3: Run both tests and confirm the red state**

Run: `npm test -- src/shared/aggregation.test.ts src/shared/simulation.test.ts`

Expected: FAIL because both modules are missing.

- [ ] **Step 4: Implement equal-weight aggregation**

In `src/shared/aggregation.ts`, export:

```ts
export const directionVector: Record<Direction, Vec2> = {
  N: { x: 0, y: -1 },
  E: { x: 1, y: 0 },
  S: { x: 0, y: 1 },
  W: { x: -1, y: 0 },
};

export function aggregateGusts(gusts: Gust[]): CellAggregate[];
export function withCandidateGust(base: CellAggregate[], candidate: Gust): CellAggregate[];
```

`aggregateGusts` groups by `${x}:${y}`, sums unit vectors, divides each axis by the group count, and returns cells sorted first by `y`, then by `x`. `withCandidateGust` reconstructs each existing cell's vector sum by multiplying its average by `count`, adds the candidate unit vector, divides by `count + 1`, and returns a new sorted array without mutating `base`.

- [ ] **Step 5: Implement fixed-step bilinear route integration**

In `src/shared/simulation.ts`, use these exact constants and exports:

```ts
const DT_SECONDS = 0.12;
const MAX_STEPS = 100;
const MAX_MAGNITUDE = 1.2;

export function buildEffectiveField(map: MapDefinition, aggregate: CellAggregate[]): Vec2[];
export function sampleField(field: Vec2[], position: Vec2): Vec2;
export function simulateRoute(map: MapDefinition, aggregate: CellAggregate[]): RouteResult;
```

`buildEffectiveField` adds `GUST_WEIGHT * aggregate.vector` to the corresponding ambient cell and magnitude-clamps every result to `MAX_MAGNITUDE`. `sampleField` converts continuous position to center-relative grid coordinates with `gx = clamp(position.x - 0.5, 0, 5)` and `gy = clamp(position.y - 0.5, 0, 5)`, then bilinearly interpolates the four neighboring vectors. `simulateRoute`:

1. starts with `points = [{...map.start}]`;
2. on each step samples the field and advances `position += vector * DT_SECONDS`;
3. appends the new position;
4. returns `reached` when distance to beacon center is at most its radius;
5. returns `storm` when distance to any storm center is at most its radius;
6. returns `lost` when `x < 0 || y < 0 || x >= 6 || y >= 6`;
7. returns `lost` after 100 steps if no earlier terminal result occurs;
8. reports `durationSeconds = stepCount * DT_SECONDS` rounded to two decimals.

- [ ] **Step 6: Verify the pure game engine**

Run:

```bash
npm test -- src/shared/aggregation.test.ts src/shared/simulation.test.ts
npm test
npm run type-check
```

Expected: the three terminal outcomes, determinism, cancellation, and preview immutability tests pass.

- [ ] **Step 7: Commit the simulation engine**

```bash
git add src/shared
git commit -m "feat: add shared wind simulation"
```

---

### Task 4: Enforce One Daily Gust Atomically and Expose Authoritative APIs

**Files:**
- Create: `src/shared/validation.ts`
- Create: `src/shared/validation.test.ts`
- Create: `src/server/store.ts`
- Create: `src/server/store.test.ts`
- Create: `src/server/voyage-service.ts`
- Create: `src/server/voyage-service.test.ts`
- Replace: `src/server/routes/api.ts`
- Create: `src/server/routes/api.test.ts`

**Interfaces:**
- Consumes: `context.userId`, Devvit Redis, pure shared domain functions, and explicit `Date` arguments in service tests.
- Produces: `GET /api/voyage`, `POST /api/gust`, `readGusts`, `commitStoredGust`, `buildVoyageState`, and `commitGustForUser`.

- [ ] **Step 1: Write failing request validation tests**

Create `src/shared/validation.test.ts` and assert that `parseCommitGust` accepts `{dayId:'2026-07-15', cell:{x:0,y:5}, direction:'W'}` and rejects fractional coordinates, coordinates outside `0..5`, directions other than `N/E/S/W`, malformed day IDs, arrays, strings, and missing properties with `Error('Invalid gust')`.

- [ ] **Step 2: Write failing Redis atomicity tests**

Create `src/server/store.test.ts`:

```ts
import { createDevvitTest } from '@devvit/test/server/vitest';
import { expect } from 'vitest';
import { commitStoredGust, readGusts } from './store';

const test = createDevvitTest();
const east = { cell: { x: 2, y: 2 }, direction: 'E' as const };
const north = { cell: { x: 2, y: 2 }, direction: 'N' as const };

test('inserts once and makes identical retries idempotent', async ({ userId }) => {
  expect(await commitStoredGust('2026-07-15', userId, east)).toStrictEqual({ kind: 'inserted' });
  expect(await commitStoredGust('2026-07-15', userId, east)).toStrictEqual({ kind: 'same', gust: east });
  expect(await readGusts('2026-07-15')).toStrictEqual([east]);
});

test('rejects a different second choice', async ({ userId }) => {
  await commitStoredGust('2026-07-15', userId, east);
  expect(await commitStoredGust('2026-07-15', userId, north)).toStrictEqual({ kind: 'conflict', gust: east });
});

test('isolates UTC days', async ({ userId }) => {
  await commitStoredGust('2026-07-15', userId, east);
  expect(await commitStoredGust('2026-07-16', userId, north)).toStrictEqual({ kind: 'inserted' });
});
```

- [ ] **Step 3: Run validation and store tests to confirm red state**

Run: `npm test -- src/shared/validation.test.ts src/server/store.test.ts`

Expected: FAIL because validation and store modules do not exist.

- [ ] **Step 4: Implement strict request and stored-value validation**

Create `src/shared/validation.ts` with:

```ts
import { GRID_SIZE, type CommitGustRequest, type Direction, type Gust } from './domain';

const directions = new Set<Direction>(['N', 'E', 'S', 'W']);

export function parseCommitGust(value: unknown): CommitGustRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid gust');
  const input = value as Record<string, unknown>;
  const cell = input.cell as Record<string, unknown> | undefined;
  if (
    Object.keys(input).sort().join(',') !== 'cell,dayId,direction' ||
    !cell || Object.keys(cell).sort().join(',') !== 'x,y' ||
    typeof input.dayId !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(input.dayId) ||
    !Number.isInteger(cell.x) || !Number.isInteger(cell.y) ||
    (cell.x as number) < 0 || (cell.x as number) >= GRID_SIZE ||
    (cell.y as number) < 0 || (cell.y as number) >= GRID_SIZE ||
    typeof input.direction !== 'string' || !directions.has(input.direction as Direction)
  ) throw new Error('Invalid gust');
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
```

- [ ] **Step 5: Implement the Redis store around hSetNX**

Create `src/server/store.ts` using `redis` from `@devvit/web/server`. Use key `voyage:${dayId}:gusts`. `readGusts` calls `hGetAll`, decodes the values, and ignores/logs only corrupt stored values. `readPlayerGust` calls `hGet`. `commitStoredGust` must:

```ts
const inserted = await redis.hSetNX(key, userId, encodeGust(gust));
if (inserted === 1) {
  await redis.expire(key, DATA_TTL_SECONDS);
  return { kind: 'inserted' } as const;
}
const existingValue = await redis.hGet(key, userId);
if (!existingValue) throw new Error('Contribution disappeared after hSetNX conflict');
const existing = decodeGust(existingValue);
return encodeGust(existing) === encodeGust(gust)
  ? { kind: 'same', gust: existing } as const
  : { kind: 'conflict', gust: existing } as const;
```

Do not maintain a secondary aggregate counter; derive the aggregate from canonical stored gusts.

- [ ] **Step 6: Run store tests and confirm atomic behavior**

Run: `npm test -- src/server/store.test.ts`

Expected: all three `@devvit/test` Redis cases pass.

- [ ] **Step 7: Write failing voyage-service tests**

Create `src/server/voyage-service.test.ts` with `createDevvitTest()` cases that:

- call `buildVoyageState(userId, new Date('2026-07-15T12:00:00Z'))` and expect `dayId === '2026-07-15'`, `playerContribution === null`, `secondsRemaining === 43200`, and `previous.kind === 'prologue'`;
- call `commitGustForUser` once and expect `kind === 'committed'`, then retry and expect `kind === 'idempotent'`;
- submit a request with `dayId: '2026-07-14'` and expect `{kind:'stale'}` without a Redis write;
- submit a different second choice and expect `{kind:'conflict', existing}`;
- stage a prior-day gust through `commitStoredGust` and expect `previous.kind === 'previous'` with `contributionCount === 1`.

- [ ] **Step 8: Implement authoritative voyage orchestration**

Create `src/server/voyage-service.ts`:

```ts
export async function buildVoyageState(userId: string, now: Date): Promise<VoyageState>;
export async function commitGustForUser(
  userId: string,
  request: CommitGustRequest,
  now: Date,
): Promise<
  | { kind: 'committed' | 'idempotent'; state: VoyageState }
  | { kind: 'stale' }
  | { kind: 'conflict'; existing: Gust }
>;
```

`buildVoyageState` derives today's map, canonical gusts, aggregate, route, current player's stored gust, seconds to next UTC midnight, and previous-day result. It returns `mapVersion: MAP_VERSION` and `mapSeed: dayId`; it does not duplicate the full deterministic map in the response. Use the Prologue `{kind:'prologue', dayId:'prologue', outcome:'reached', contributionCount:12}` only when the prior hash has no valid gusts. `commitGustForUser` checks `request.dayId === getDayId(now)` before storage, delegates atomic commit, and rebuilds state after inserted/same results.

- [ ] **Step 9: Replace the sample API routes**

Replace `src/server/routes/api.ts` with a Hono router that:

- `GET /voyage`: returns 401 `UNAUTHENTICATED` when `context.userId` is absent; otherwise returns `buildVoyageState(context.userId, new Date())`.
- `POST /gust`: parses JSON and `parseCommitGust`; returns 400 `INVALID_GUST`, 401 `UNAUTHENTICATED`, 409 `STALE_DAY`, or 409 `ALREADY_COMMITTED` with `existing`; returns 201 `{status:'committed', state}` or 200 `{status:'idempotent', state}`.
- catches unexpected exceptions, logs the full server error, and returns 500 `INTERNAL` with the public message `The current shifted unexpectedly. Please retry.`
- rejects a request before validation when `JSON.stringify(rawBody).length > 256`, returning 400 `INVALID_GUST`.

The JSON error envelope must always match `ApiErrorBody`; do not expose stack traces, Redis keys, or user IDs.

Create `src/server/routes/api.test.ts` with `createDevvitTest()` and `api.request()` cases for a valid GET, malformed POST, stale POST, and oversized POST. Create a second test instance with `userId: ''` and assert GET returns 401 `UNAUTHENTICATED`. For every non-2xx response, assert the JSON body contains exactly `status`, `code`, `message`, plus `existing` only for `ALREADY_COMMITTED`.

- [ ] **Step 10: Verify server authority and commit**

Run:

```bash
npm test -- src/shared/validation.test.ts src/server/store.test.ts src/server/voyage-service.test.ts src/server/routes/api.test.ts
npm test
npm run type-check
npm run lint
```

Expected: all validation, UTC rollover, idempotency, conflict, previous-voyage, and Redis isolation cases pass.

```bash
git add src/shared src/server
git commit -m "feat: persist authoritative daily gusts"
```

---

### Task 5: Build the Accessible Client State Machine and API Adapter

**Files:**
- Create: `src/client/api.ts`
- Create: `src/client/state.ts`
- Create: `src/client/state.test.ts`
- Create: `src/client/hud.ts`
- Replace: `src/client/game.html`
- Modify: `src/client/game.ts`

**Interfaces:**
- Consumes: `VoyageState`, shared simulation functions, `GET /api/voyage`, and `POST /api/gust`.
- Produces: a tested reducer, typed network adapter, DOM HUD controller, and callbacks consumed by `DriftScene` in Task 6.

- [ ] **Step 1: Write failing state transition tests**

Create `src/client/state.test.ts` with a minimal `VoyageState` fixture and assert these transitions:

```ts
loading -> loaded -> ready
ready + selectCell -> ready with selectedCell
ready + chooseDirection -> preview with pending Gust and previewRoute
preview + submit -> submitting
submitting + commitSucceeded -> committed with authoritative state and no pending gust
submitting + commitFailed -> error while retaining pending gust
error + retryCommit -> submitting
any interactive state + staleDay -> loading with pending gust cleared and error `That voyage just closed. Loading today's field…`
```

Also assert that a loaded voyage with non-null `playerContribution` enters `committed`, never `ready`.

- [ ] **Step 2: Run the state test and confirm red state**

Run: `npm test -- src/client/state.test.ts`

Expected: FAIL because `state.ts` does not exist.

- [ ] **Step 3: Implement the explicit reducer**

Create `src/client/state.ts` with:

```ts
export type ClientPhase = 'loading' | 'ready' | 'preview' | 'submitting' | 'committed' | 'error';
export type ClientState = {
  phase: ClientPhase;
  voyage: VoyageState | null;
  selectedCell: GridCell | null;
  pending: Gust | null;
  previewRoute: RouteResult | null;
  error: string | null;
};

export type ClientAction =
  | { type: 'loaded'; voyage: VoyageState }
  | { type: 'loadFailed'; message: string }
  | { type: 'selectCell'; cell: GridCell }
  | { type: 'chooseDirection'; direction: Direction }
  | { type: 'submit' }
  | { type: 'commitSucceeded'; voyage: VoyageState }
  | { type: 'commitFailed'; message: string }
  | { type: 'retryCommit' }
  | { type: 'staleDay' };

export const initialClientState: ClientState;
export function reduceClientState(state: ClientState, action: ClientAction): ClientState;
```

On `chooseDirection`, create the pending gust from `selectedCell`, call `withCandidateGust(voyage.aggregate, pending)`, regenerate the map with `createMap(voyage.mapSeed)`, and calculate `previewRoute = simulateRoute(map, previewAggregate)`. When `selectCell` runs in `preview` or recoverable `error`, retain the existing pending direction, replace its cell, and recompute the preview immediately. Ignore selection/direction actions in `submitting` or `committed`. Preserve the pending gust only for recoverable commit failures.

- [ ] **Step 4: Implement typed fetch and error classification**

Create `src/client/api.ts`:

```ts
export class ApiError extends Error {
  constructor(
    public readonly httpStatus: number,
    public readonly body: ApiErrorBody,
  ) {
    super(body.message);
  }
}

async function readJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T | ApiErrorBody;
  if (!response.ok) throw new ApiError(response.status, body as ApiErrorBody);
  return body as T;
}

export async function fetchVoyage(): Promise<VoyageState> {
  return readJson(await fetch('/api/voyage'));
}

export async function commitGust(request: CommitGustRequest): Promise<CommitGustResponse> {
  return readJson(await fetch('/api/gust', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(request),
  }));
}
```

- [ ] **Step 5: Replace game.html with the semantic single-screen shell**

The body must contain exactly one `main#app` with:

```html
<header class="status-bar">
  <div><p class="eyebrow">TODAY'S VOYAGE</p><h1>Drift Council</h1></div>
  <div class="status-metrics" aria-live="polite">
    <span id="previous-result">Prologue: the beacon was reached</span>
    <span id="contribution-count">0 gusts</span><span id="time-left">--:--:--</span>
  </div>
</header>
<section id="game-region" aria-label="Shared wind field">
  <div id="game-container" role="application" tabindex="0" aria-label="Six by six wind grid. Use arrow keys to move the tile cursor, then choose a gust direction below."></div>
  <div id="loading-panel" role="status">Reading the currents…</div>
</section>
<section id="action-tray" aria-labelledby="instruction">
  <div><p id="instruction">Tap a tile to place today's gust.</p><p id="impact" aria-live="polite"></p></div>
  <div id="direction-pad" aria-label="Gust direction">
    <button data-direction="N" aria-label="Blow north">↑</button>
    <button data-direction="W" aria-label="Blow west">←</button>
    <button data-direction="S" aria-label="Blow south">↓</button>
    <button data-direction="E" aria-label="Blow east">→</button>
  </div>
  <button id="commit-button" class="primary" disabled>Commit gust</button>
  <button id="replay-button" hidden>Replay route</button>
  <button id="retry-button" hidden>Retry</button>
</section>
```

Keep the template's module script loading `game.ts` and viewport metadata. Do not add a modal, navigation, or scrolling content.

- [ ] **Step 6: Implement the HUD renderer**

Create `src/client/hud.ts` exporting `bindHud(callbacks)` and returning `{ render(state), destroy() }`. Direction buttons call `callbacks.onDirection(direction)`, Commit calls `onCommit`, Replay calls `onReplay`, and Retry calls `onRetry`. `render` must:

- show loading panel only in `loading`;
- use `state.error` as loading-panel text during stale rollover, otherwise use `Reading the currents…`;
- disable directions until a cell is selected and during `submitting/committed`;
- enable Commit only in `preview`;
- show `Committing your gust…` during submission;
- show `Your gust is part of the council. Replay the route anytime.` after commit;
- show Replay only in `committed` and hide Commit in that phase;
- show the retained error plus Retry in `error`;
- render `contributionCount` and `secondsRemaining` without usernames;
- render `Prologue: the beacon was reached` or `Yesterday: reached the beacon / crossed the squall / drifted away` from `voyage.previous`;
- maintain one local one-second interval that decrements the displayed countdown, resetting it only when a newly loaded server value differs by more than two seconds and clearing it in `destroy()`;
- use `aria-pressed=true` on the chosen direction and visible focus rings via CSS.

- [ ] **Step 7: Add the controller skeleton in game.ts**

Replace template menu/game-over setup with one Phaser game containing only `DriftScene`. Keep state in a `let state = initialClientState`, centralize changes in `dispatch(action)`, and make `dispatch` call both `hud.render(state)` and `scene.renderVoyage(state)`. Implement `load`, `selectCell`, `chooseDirection`, `commit`, `replay`, and `retry` handlers. Replay calls `scene.replayRoute()` and never performs a fetch. For `error instanceof ApiError && error.body.code === 'STALE_DAY'`, dispatch `staleDay` and call `load()` once; for `ALREADY_COMMITTED`, call `load()` so the authoritative contribution hydrates. Add `keydown` handling on `#game-container`: Arrow keys move a clamped 0–5 cell cursor starting at `{x:0,y:0}`, dispatch `selectCell`, and prevent page movement.

- [ ] **Step 8: Verify reducer behavior and static checks**

Run:

```bash
npm test -- src/client/state.test.ts
npm test
npm run type-check
npm run lint
```

Expected: all reducer transitions pass; type-check may still require the Task 6 `DriftScene` public interface, so create only a compiling class stub with `renderVoyage(_state: ClientState): void {}`, `replayRoute(): void {}`, and the cell-selection callback constructor, then replace it fully in Task 6.

- [ ] **Step 9: Commit the client control plane**

```bash
git add src/client src/shared/domain.ts
git commit -m "feat: add voyage client state machine"
```

---

### Task 6: Render and Animate the Night Current Phaser Field

**Files:**
- Create: `src/client/geometry.ts`
- Create: `src/client/geometry.test.ts`
- Replace: `src/client/scenes/DriftScene.ts`
- Modify: `src/client/game.ts`
- Delete: `src/client/scenes/Boot.ts`, `src/client/scenes/Preloader.ts`, `src/client/scenes/MainMenu.ts`, `src/client/scenes/Game.ts`, `src/client/scenes/GameOver.ts`

**Interfaces:**
- Consumes: `ClientState`, `VoyageState`, preview route, and `onCellSelected(cell)`.
- Produces: pointer-to-cell conversion and `DriftScene.renderVoyage(state)` with procedural field, route, result, and reduced-motion behavior.

- [ ] **Step 1: Write failing responsive geometry tests**

Create `src/client/geometry.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { cellCenter, pointToCell } from './geometry';

describe('playfield geometry', () => {
  it('maps canvas points to the six by six grid', () => {
    expect(pointToCell({ x: 100, y: 50 }, { x: 40, y: 20, size: 360 })).toStrictEqual({ x: 1, y: 0 });
    expect(pointToCell({ x: 399, y: 379 }, { x: 40, y: 20, size: 360 })).toStrictEqual({ x: 5, y: 5 });
  });
  it('rejects points outside the protected square', () => {
    expect(pointToCell({ x: 39, y: 100 }, { x: 40, y: 20, size: 360 })).toBeNull();
  });
  it('returns the exact visual center of a cell', () => {
    expect(cellCenter({ x: 2, y: 3 }, { x: 40, y: 20, size: 360 })).toStrictEqual({ x: 190, y: 230 });
  });
});
```

- [ ] **Step 2: Run the geometry test and confirm red state**

Run: `npm test -- src/client/geometry.test.ts`

Expected: FAIL because `geometry.ts` is missing.

- [ ] **Step 3: Implement responsive coordinate conversion**

Create `src/client/geometry.ts` with `PlayfieldBounds = {x:number; y:number; size:number}`. `pointToCell` checks the inclusive left/top and exclusive right/bottom bounds, divides local coordinates by `size / 6`, floors both axes, and returns `GridCell | null`. `cellCenter` returns the bounds origin plus `(cell axis + 0.5) * size / 6`.

- [ ] **Step 4: Implement the single DriftScene**

`DriftScene` must extend `Phaser.Scene`, use key `DriftScene`, regenerate the deterministic map with `createMap(voyage.mapSeed)`, and own these members:

```ts
private currentState: ClientState | null = null;
private bounds = { x: 0, y: 0, size: 0 };
private fieldLayer!: Phaser.GameObjects.Graphics;
private routeLayer!: Phaser.GameObjects.Graphics;
private markerLayer!: Phaser.GameObjects.Graphics;
private driftling!: Phaser.GameObjects.Arc;
private routeTween?: Phaser.Tweens.Tween;
private readonly reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

constructor(private readonly onCellSelected: (cell: GridCell) => void) {
  super('DriftScene');
}

create(): void;
renderVoyage(state: ClientState): void;
private layout(width: number, height: number): void;
private drawField(voyage: VoyageState): void;
private drawRoute(route: RouteResult, preview: boolean): void;
private animateDriftling(route: RouteResult): void;
replayRoute(): void;
```

Use Phaser `Graphics` only. `layout` sets `size = min(width - 32, height - 24)`, centers the square, and redraws after the scale manager emits `resize`. `drawField` renders:

- background `#07101f` and 6×6 lines at alpha 0.22;
- ambient arrows in `#43617d` with length proportional to vector magnitude;
- community arrows in `#39d5ff`, with opacity `min(0.35 + count * 0.08, 0.9)`;
- two translucent storm discs `#8c3cff` plus a red-violet outline;
- an amber beacon disc/ring `#ffbd59`;
- a cyan selected-cell outline and cardinal arrow for the pending gust.

`drawRoute` draws the authoritative route as a 3 px cyan polyline and preview route as a 4 px dashed/alternating bright cyan polyline. `animateDriftling` uses a 7 px cyan circle with a 14 px low-alpha halo, tweening through route points for `min(5000, route.durationSeconds * 500)` ms. `replayRoute` reruns `animateDriftling` against the current authoritative route without changing state or calling the server. Reduced motion skips particles and places the Driftling at the terminal point while preserving the full route. On pointer down, convert the pointer's scene coordinates through `pointToCell` and call `onCellSelected` only in `ready`, `preview`, or `error` phases.

- [ ] **Step 5: Connect Phaser config and controller**

Configure Phaser with transparent background, `Phaser.Scale.RESIZE`, parent `game-container`, and only the constructed `DriftScene`. Avoid camera movement. After construction, `game.ts` must pass every reducer state to `scene.renderVoyage(state)`; selecting a new cell while previewing keeps the current direction and immediately recomputes the preview for the new cell.

- [ ] **Step 6: Delete unused template scenes and assets**

Delete all five template scenes and remove unused template image/audio files from `public/assets`. Keep only files referenced by splash/game HTML. Run `rg "Boot|Preloader|MainMenu|GameOver|logo\.png" src public` and expect no stale imports or references.

- [ ] **Step 7: Verify rendering logic and build**

Run:

```bash
npm test -- src/client/geometry.test.ts
npm test
npm run type-check
npm run lint
npm run build
```

Expected: geometry, shared, server, and state tests pass; production client/server bundles build successfully.

- [ ] **Step 8: Commit the procedural game field**

```bash
git add src/client public
git commit -m "feat: render the shared drift field"
```

---

### Task 7: Finish Responsive UX, Error States, and Live Shared-State Playtest

**Files:**
- Replace: `src/client/game.css`
- Replace: `src/client/splash.html`
- Replace: `src/client/splash.css`
- Replace: `src/client/splash.ts`
- Modify: `src/client/game.ts`
- Modify: `src/client/hud.ts`
- Modify: `src/server/routes/api.ts`

**Interfaces:**
- Consumes: the full app from Tasks 1–6.
- Produces: submission-quality desktop/mobile UI, recovery behavior, real Redis persistence, and a public demo post URL.

- [ ] **Step 1: Implement the Night Current layout tokens and responsive shell**

In `game.css`, define:

```css
:root {
  color-scheme: dark;
  --ink: #07101f;
  --panel: #0d1a2d;
  --panel-2: #13243a;
  --cyan: #39d5ff;
  --amber: #ffbd59;
  --text: #f4f8ff;
  --muted: #9ab0c8;
  font-family: Inter, ui-sans-serif, system-ui, sans-serif;
}
* { box-sizing: border-box; }
html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: var(--ink); }
#app { height: 100dvh; display: grid; grid-template-rows: auto minmax(0, 1fr) auto; }
.status-bar, #action-tray { background: color-mix(in srgb, var(--panel) 94%, transparent); }
#game-region, #game-container { min-height: 0; width: 100%; height: 100%; position: relative; }
button { min-width: 44px; min-height: 44px; }
button:focus-visible { outline: 3px solid var(--amber); outline-offset: 2px; }
@media (max-width: 640px) {
  .status-bar { padding: 10px 14px; }
  #action-tray { grid-template-columns: 1fr auto; gap: 8px 12px; padding: 10px 14px max(10px, env(safe-area-inset-bottom)); }
  #commit-button, #replay-button, #retry-button { grid-column: 1 / -1; width: 100%; }
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
```

Complete the desktop tray as a single horizontal row, keep text contrast at least 4.5:1, and ensure no control is smaller than 44×44 px.

- [ ] **Step 2: Replace the compact-post splash**

The inline splash must show the Drift Council title, `One gust each. One voyage together.`, a procedural cyan/amber current mark, and one button `Enter today's voyage`. `splash.ts` imports only `requestExpandedMode` and calls `requestExpandedMode(event, 'game')`; remove all external navigation links from the starter.

- [ ] **Step 3: Complete recovery and rollover behavior**

Exercise these exact user-visible strings:

- initial load failure: `The current is hard to read. Retry.`
- commit failure: `Gust not committed — retry.`
- stale day: `That voyage just closed. Loading today's field…`
- committed reached: `Your gust joined the council. The beacon is within reach.`
- committed storm: `Your gust joined the council. The route still crosses the squall.`
- committed lost: `Your gust joined the council. The Driftling still needs help.`

Prevent double submit by disabling controls synchronously before `fetch`. Never animate success until the POST response is successful. The Retry action for a failed commit must resubmit the retained identical request; initial-load Retry calls GET again.

- [ ] **Step 4: Run the full local quality gate**

Run:

```bash
npm run prettier
npm run check
git diff --check
```

Expected: formatting changes are intentional; tests, type-check, lint, build, and whitespace check pass.

- [ ] **Step 5: Start one Devvit playtest and execute the desktop matrix**

Run `npm run dev`. On Reddit, create a fresh post and verify in desktop Chrome:

1. splash enters expanded mode;
2. first load shows map/objective within ten seconds;
3. selecting a cell and direction visibly changes preview route;
4. changing the cell retains direction and recalculates preview;
5. Commit changes to submitting then committed;
6. reload preserves the contribution and disables new commits;
7. Replay reruns the route without writing Redis;
8. DevTools network throttling produces the intended recoverable state.

Record the post URL and browser console output. Expected: no uncaught errors and no failed `/api` responses during the happy path.

- [ ] **Step 6: Execute mobile and shared-state matrix**

At 390×844 and 360×640 viewports, verify no clipping, internal scrolling, overlap, or undersized control. Use a second Reddit account or an equivalent authenticated viewer: viewer B must see viewer A's contribution count and route change; viewer B can commit once; viewer A then reloads and sees the two-gust aggregate. Do not fake this acceptance test with local fixture data.

- [ ] **Step 7: Deploy the stable version and verify a non-developer view**

Stop playtest, run:

```bash
npm run deploy
```

Install/use the uploaded version in a subreddit under 200 members, create the final demo post, and open it from a non-developer viewer when possible. Save the final post URL. If deployment fails, fix only the blocker, rerun `npm run check`, redeploy, and do not add features.

- [ ] **Step 8: Commit the submission candidate**

```bash
git add src/client src/server package.json package-lock.json devvit.json
git commit -m "feat: polish Drift Council for submission"
```

Tag the known-good local commit only after Task 8's final verification.

---

### Task 8: Package README, Devpost Copy, Screenshots, Video, and Final Submission

**Files:**
- Replace: `README.md`
- Create: `SUBMISSION.md`
- Create: `VIDEO_SCRIPT.md`
- Create: `docs/media/thumbnail.png`
- Create: `docs/media/gameplay.png`
- Create: `docs/media/commit.png`
- Modify only if required by portal: `devvit.json`

**Interfaces:**
- Consumes: final demo post URL, app listing URL, screenshots, actual running behavior, and build/deploy evidence.
- Produces: complete public repository documentation, <60-second video, Devpost entry, final upload, and submission receipt.

- [ ] **Step 1: Write the launch-ready README**

Use these exact sections: `What it is`, `The hook`, `How to play`, `How it works`, `Architecture`, `Local development`, `Testing`, `Deployment`, `Data use and privacy`, `Moderator installation`, and `Hackathon submission`. State plainly that Reddit user IDs are used only as Redis hash fields to enforce one contribution per UTC day, expire after 30 days, and are never returned to clients. Include commands `npm install`, `npm run dev`, `npm run check`, and `npm run deploy`. Include the demo post and app listing links only after they exist.

- [ ] **Step 2: Write final Devpost copy in SUBMISSION.md**

Use:

```markdown
# Project name
Drift Council

# Elevator pitch
Every redditor contributes one gust to guide a shared creature through today's storm. The route belongs to the whole community.

# Inspiration
Reddit is most compelling when thousands of small opinions become one surprising collective outcome. Drift Council turns that behavior into a daily, playable weather system.

# What it does
Each UTC day creates a deterministic 6×6 wind field. Every authenticated redditor can place exactly one north, east, south, or west gust. Before committing, they preview how their choice bends the shared route. After committing, the authoritative route updates for everyone.

# How we built it
Devvit Web hosts a Hono server and Phaser client. Pure TypeScript generates the map, aggregates equal-weight gusts, and runs a fixed-step simulation. Devvit Redis uses hSetNX to atomically enforce one immutable daily contribution per user.

# Challenges
The hardest part was making a crowd-controlled result understandable in under a minute while keeping every player equal and every preview deterministic.

# Accomplishments
The experience works with one player, becomes more expressive with a crowd, survives reloads, supports desktop and mobile, and uses no external services or art pipeline.

# What we learned
Collective play feels most Reddit-native when contribution is tiny, consequence is visible, and no individual owns the final answer.

# What's next
After the hackathon: multi-day voyage history, opt-in subreddit themes, and richer result ceremonies—without changing the one-gust democratic core.
```

Append checklist fields for source repository, public demo post, app listing, video URL, technology tags, screenshots, and official rules confirmation. Replace every blank with a real URL before submission; do not submit unresolved markers.

- [ ] **Step 3: Capture three truthful images**

Capture at device-pixel ratio 1 or 2:

- `thumbnail.png`: 3:2 crop, title + luminous route + amber beacon, under 5 MB;
- `gameplay.png`: full desktop expanded view in ready/preview state;
- `commit.png`: committed state showing the updated community route.

Use the actual app. Development fixture gusts may be used only in a clearly isolated capture subreddit and must not be described as real users. Verify text is readable after Devpost thumbnail scaling.

- [ ] **Step 4: Write and record the 45–55 second video**

Create `VIDEO_SCRIPT.md` with this timeline and exact captions:

1. 0–5s — `One gust each. One voyage together.`
2. 5–15s — `A new shared wind field appears every UTC day.`
3. 15–27s — `Choose one tile and one direction. Preview the consequence before you commit.`
4. 27–37s — `Devvit Redis commits one immutable gust per redditor, then everyone sees the new route.`
5. 37–47s — `Reach the beacon—or watch the council drift into the squall.`
6. 47–55s — `Drift Council. A Reddit community experiment built with Devvit Web and Phaser.`

Record the real expanded post at 1080p/30fps, remove dead time, keep the cursor deliberate, add captions, export H.264 MP4, and upload publicly/unlisted where Devpost accepts it. Confirm the URL works in a signed-out browser.

- [ ] **Step 5: Run the immutable final verification**

From a clean terminal:

```bash
npm ci
npm run check
git status --short
```

Expected: `npm ci` succeeds, all checks pass, and only intentional media/docs changes remain. Reopen the deployed post on desktop and mobile-width, perform one read-only replay, and verify the app/video/repository links from an incognito window.

- [ ] **Step 6: Commit, tag, and upload the final candidate**

```bash
git add README.md SUBMISSION.md VIDEO_SCRIPT.md docs/media
git commit -m "docs: package Drift Council submission"
npm run deploy
git tag hackathon-submission
```

If the deployed code changed after the previous acceptance pass, rerun the two-viewer smoke test before proceeding.

- [ ] **Step 7: Complete and submit Devpost**

Copy reviewed text from `SUBMISSION.md`, upload the 3:2 thumbnail and gameplay media, add source/app/demo/video links, select the accurate Devvit/Phaser categories, preview every page, and submit. Save a screenshot of the confirmation page and record the submission timestamp in `SUBMISSION.md` locally.

- [ ] **Step 8: Request launch review without risking the submission**

After the Devpost submission is confirmed, run `npm run launch` to publish/request app review. This must not replace or delay the already-working under-200-member demo post. If launch review is unavailable or slow, preserve the confirmed Devpost submission and deployed demo as the terminal success state.

---

## Final Acceptance Matrix

| Requirement | Evidence |
|---|---|
| One gust per user/day | `store.test.ts` hSetNX idempotency/conflict tests plus two-account playtest |
| Shared community outcome | Viewer B sees viewer A; viewer A sees B after reload |
| Deterministic map/route | map and simulation fixture tests |
| Preview before commitment | reducer test plus recorded video segment |
| Server authority | client sends only day/cell/direction; server rebuilds route |
| UTC rollover | calendar and voyage-service tests |
| Mobile/desktop parity | 390×844, 360×640, and desktop screenshots/checklist |
| Failure recovery | throttled GET/POST playtest and reducer transitions |
| Privacy | README disclosure, 30-day TTL, no identity fields in API types |
| Submission completeness | public demo, app listing, repo, screenshots, <60s video, Devpost receipt |

No extra feature work is permitted after every row above has evidence. Remaining time belongs to upload retry, link verification, and submission confirmation.
