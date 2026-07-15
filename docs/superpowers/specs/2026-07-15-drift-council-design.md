# Drift Council — Hackathon Design Specification

**Status:** Approved for implementation planning

**Date:** 2026-07-15

**Submission deadline:** 2026-07-16 09:00 CST

**Display name:** Drift Council

**Preferred Devvit slug:** `drift-council`; if unavailable at creation time, use `drift-voyage`

## 1. Product statement

Drift Council is a one-screen asynchronous community experiment built as a Reddit interactive post. A luminous creature, the Driftling, must cross a shared wind field and reach a beacon before the UTC day ends. Every redditor may contribute exactly one bounded gust per day. Their gust immediately changes the community's predicted route, but no single player controls the result.

The project is designed for Reddit's Games with a Hook Hackathon. Its primary competitive positioning is a distinctive Reddit-native community contribution loop, with retention and Phaser presentation as supporting strengths. It is not a conventional solo arcade game with a leaderboard.

## 2. Goals and acceptance outcomes

The MVP must satisfy all of the following:

1. A first-time judge understands the objective and available action within ten seconds.
2. A player can complete the daily interaction on mobile or desktop in 30–60 seconds.
3. Previewing a gust visibly changes the predicted route before commitment.
4. A committed gust persists in Redis and affects every subsequent player viewing that day's voyage.
5. The same map and contribution set always produce the same route and outcome.
6. The application remains useful with one player and becomes more interesting as contributions accumulate.
7. A public subreddit post runs the game without external accounts, external APIs, payments, LLMs, or restricted permissions.
8. The submission includes a detailed English README, screenshots, a public demo post, an app listing, and a 45–55 second demonstration video.

## 3. Scope and non-goals

The deadline-constrained MVP includes one current voyage, one previous/prologue result, one contribution per user per UTC day, deterministic route simulation, a community success/failure outcome, and a polished single-screen presentation.

The following are explicitly deferred:

- personal scores, rankings, currencies, inventory, upgrades, achievements, or rewards;
- free-text user content, comment posting, notifications, sharing flows, and subreddit flair;
- audio, purchased art, generative art assets, and an asset-heavy animation pipeline;
- diagonal gusts, variable gust strength, more than one action per user, or editable committed actions;
- a history gallery, multi-day streak calculation, scheduled jobs, live realtime sockets, and external services;
- multiple game modes, settings screens, tutorial modals, lore pages, and separate mobile/desktop feature sets.

If implementation time runs short, visual embellishments are removed before any core interaction, persistence, responsive behavior, README, deployment, or video work.

## 4. Player fantasy and daily loop

The community acts as a council of invisible winds. The Driftling is a small bioluminescent seed-like creature that moves continuously through a field of ambient currents. Storm regions are dangerous, and the warm beacon is the shared destination.

The daily interaction is:

1. **Observe:** Load today's 6×6 field, current community gusts, storm regions, beacon, and predicted route.
2. **Select:** Tap any cell and choose north, east, south, or west.
3. **Preview:** Re-run the pure client simulation with the proposed gust and animate the before/after route delta. The player may change the uncommitted cell or direction.
4. **Commit:** Submit once. The server validates the authenticated user, day, cell, and direction before persisting.
5. **Witness:** Reload the authoritative aggregate, animate the updated route, and show a short impact message.
6. **Return:** Later visits show how subsequent community contributions have changed the route. The next UTC day produces a new deterministic field and shows the previous voyage result.

The initial installation shows a clearly labeled **Prologue Voyage** when no previous real voyage exists. It demonstrates the result presentation without pretending that synthetic contributions came from real redditors.

## 5. Game rules and deterministic simulation

### 5.1 Map

Each UTC day maps to a stable `dayId` in `YYYY-MM-DD` format. A seeded pseudorandom generator derives the following from `dayId`:

- a 6×6 ambient vector field;
- a start point on the left side of the field;
- a beacon on the right side;
- two circular storm regions placed away from the start and beacon;
- a map seed/version stored in the response contract.

The generator uses fixed bounds and rejection rules so every map has an initially visible route and is not immediately terminal. Map generation is pure and must be covered by deterministic fixtures.

### 5.2 Community wind

Every contribution is a unit vector in one cardinal direction associated with one cell. For each cell:

```text
communityVector = sum(playerUnitVectors) / max(1, contributionCount)
effectiveVector = ambientVector + 0.9 * communityVector
```

The effective vector is magnitude-clamped before simulation. Averaging ensures that every user has equal weight, opposite choices cancel naturally, and a large crowd cannot create unbounded velocity. Ambient wind keeps a one-player field meaningful.

### 5.3 Route integration

The simulator bilinearly samples the effective grid field at the Driftling's continuous position. It advances at a fixed timestep for a maximum rendered duration of 8–12 seconds and returns a serializable route array plus one terminal result:

- `reached`: entered the beacon radius;
- `storm`: entered a storm radius;
- `lost`: exited the map or exceeded the maximum step count.

Simulation state is independent of Phaser. Phaser renders the returned route and result but never owns or mutates the authoritative rules.

## 6. Single-screen experience

The approved composition is **Tactical Field** with the **Night Current** visual language.

### 6.1 Layout

The expanded post contains three persistent regions:

1. **Compact top status:** Drift Council mark, contribution count, and time remaining in the UTC voyage.
2. **Protected central playfield:** Phaser canvas containing the grid, ambient currents, storms, beacon, predicted route, and Driftling.
3. **Bottom action tray:** Contextual instruction, four direction controls, preview state, and the single primary Commit action.

There is no internal scrolling. At narrow widths the tray wraps vertically while the playfield preserves a readable aspect ratio. The first meaningful frame contains the objective, map, and action prompt; it does not open a modal or menu.

### 6.2 Interaction states

The client has six explicit states:

- `loading`: lightweight branded loading treatment;
- `ready`: map visible and a short prompt to select a cell;
- `preview`: selected cell/direction highlighted and candidate route animated;
- `submitting`: controls disabled while retaining the chosen gust visually;
- `committed`: authoritative route shown, controls replaced by impact copy and Replay;
- `error`: inline recovery message with one Retry action.

Pointer and touch map to the same semantic actions: `select-cell`, `choose-direction`, `commit`, and `replay`. Keyboard users can operate the four direction buttons and Commit action through native DOM controls.

### 6.3 Visual identity

Night Current uses a dark blue-black field, cyan route and Driftling glow, a warm amber beacon, translucent violet-red storms, and thin low-contrast grid lines. Strong movement is reserved for route changes, storm collision, and beacon arrival. Ambient particles remain subtle and respect `prefers-reduced-motion`.

All visual assets are procedural Phaser geometry, CSS, SVG, typography, and particles. The project does not depend on third-party art or obvious generated imagery. Color is paired with icons, labels, and shape differences so state is not encoded by color alone.

All player-facing copy and submission materials are English. Core copy includes:

- `Place one gust. Change today's voyage.`
- `Tap a tile, choose a direction, then commit.`
- `Your gust bent the route north.`
- `Gust not committed — retry.`
- `The council reached the beacon.`
- `The voyage was lost to the squall.`

## 7. Architecture

The implementation starts from Reddit's official Devvit Phaser template and keeps four boundaries:

1. **Shared domain:** serializable types, seeded map generation, simulation, aggregation, and validation.
2. **Client UI:** DOM status/action tray and explicit interaction state machine.
3. **Phaser renderer:** scene objects, particles, route drawing, camera-free animation, and pointer-to-cell mapping.
4. **Server/storage:** authenticated state and commit endpoints plus Redis persistence.

Recommended module layout:

```text
src/
  shared/
    types.ts
    map.ts
    simulation.ts
    validation.ts
  client/
    main.ts
    game/DriftScene.ts
    ui/hud.ts
    ui/styles.css
  server/
    index.ts
    routes/voyage.ts
    routes/gust.ts
    store.ts
```

The exact template entrypoint names may differ, but these responsibilities must remain separate. The HUD uses plain TypeScript and DOM/CSS so the project does not add React solely for two controls. Rendering objects are never stored in application state or Redis.

## 8. API and persistence contracts

### 8.1 Read voyage

`GET /api/voyage` returns:

```ts
type VoyageState = {
  dayId: string;
  mapVersion: 1;
  mapSeed: string;
  aggregate: CellAggregate[];
  contributionCount: number;
  playerContribution: Gust | null;
  route: RouteResult;
  previous: PreviousVoyage | PrologueVoyage;
  secondsRemaining: number;
};
```

The server derives the authenticated user from Devvit context. No user ID is accepted from the client.

### 8.2 Commit gust

`POST /api/gust` accepts:

```ts
type CommitGustRequest = {
  dayId: string;
  cell: { x: number; y: number };
  direction: "N" | "E" | "S" | "W";
};
```

The server validates the current UTC `dayId`, integer cell bounds, permitted direction, and absence of a different existing contribution. A retry carrying the same contribution is idempotent and returns the current authoritative state. A second, different contribution returns a conflict response containing the already committed contribution. A stale day returns a stale-voyage response that causes the client to reload.

### 8.3 Redis

The server commits a gust with Devvit Redis `hSetNX("voyage:<dayId>:gusts", userId, encodedGust)`. A return value of `1` means the gust was inserted; `0` means that user already has a value, which the server reads back to distinguish an identical idempotent retry from a conflicting second choice. The server reads the day's hash with `hGetAll` and derives aggregate vectors from those canonical gusts, so a partial secondary-counter update cannot corrupt the result.

After a successful insert, the server applies a 30-day expiry to the day's hash. Devvit namespaces Redis data to the subreddit installation, which is the intended shared-community boundary. Previous-voyage display exposes only anonymous aggregate vectors and the derived outcome; it does not expose usernames. No public identity, profile image, comment, free text, or external personal data is stored.

## 9. Daily rollover

The MVP does not use scheduler jobs. Every request computes the current UTC `dayId`. Today's map and state are therefore available immediately after rollover without background work.

The previous result is derived from the prior day's deterministic map and aggregate gusts when requested. If there is no prior real day, the server returns the packaged Prologue Voyage. The client treats a server stale-voyage response as a normal rollover, reloads once, and clears any uncommitted preview.

## 10. Failure handling and integrity

- A failed initial load shows one Retry action and never leaves a blank canvas.
- A failed commit preserves the local selection but labels it uncommitted; it never displays a success animation.
- Duplicate identical requests are safe and idempotent.
- Conflicting repeat submissions hydrate the already committed state.
- A day change during commit reloads the new voyage and explains that the prior voyage closed.
- The server ignores all client-computed routes and recomputes the authoritative route from persisted contributions.
- Malformed coordinates, directions, seeds, identities, and oversized payloads are rejected.
- Simulation exceptions are caught at the route boundary and return a recoverable error rather than crashing the post.

## 11. Privacy, safety, and platform compliance

Drift Council uses no free-text input, external fetch, LLM, payment, advertising, gambling, age-sensitive content, external account, or outbound gameplay link. The app uses authenticated Reddit identity only to enforce one daily contribution and applies a 30-day TTL to that data.

The README explains the game, data use, moderator installation, deployment, and interaction flow in plain English. The public demo runs in a subreddit with fewer than 200 members. User posting or commenting is not required for progress.

## 12. Test strategy

### 12.1 Automated tests

- server and Redis integration tests use `@devvit/test` with Vitest;
- map generation is identical for the same day and differs across known day fixtures;
- all generated maps keep start, beacon, and storms within legal bounds;
- aggregate vectors average equal-weight votes and cancel opposites;
- route simulation is deterministic and covers `reached`, `storm`, and `lost`;
- boundary, maximum-step, zero-contribution, and high-contribution cases remain finite;
- API validation rejects stale days, invalid cells, invalid directions, and unauthenticated requests;
- the same user cannot contribute two different gusts for one day;
- retrying the same gust is idempotent and different days are isolated.

### 12.2 Playtest checklist

- desktop Chrome: first load, selection, preview, commit, replay, reload;
- narrow mobile viewport: no clipping, overlap, internal scrolling, or undersized controls;
- at least two Reddit accounts or equivalent authenticated test contexts show shared state;
- slow/failing network exposes the recoverable error state;
- reduced-motion mode removes nonessential particles while preserving route comprehension;
- fresh public demo post works after Devvit upload and from a non-developer viewer when possible;
- type-check, tests, production build, upload, and demo-link verification pass immediately before submission.

## 13. Video and submission design

The demonstration video is 45–55 seconds and uses the actual running app. A development-only fixture may preload aggregate gusts for capture; it must not write synthetic users into production Redis or appear as real community participation.

Suggested sequence:

1. 0–5s: title and one-sentence hook;
2. 5–15s: show the shared route and objective;
3. 15–27s: select a cell and direction, preview the changed path;
4. 27–37s: commit and show authoritative community update;
5. 37–47s: show success/failure result and previous-voyage return hook;
6. 47–55s: end card with `One gust each. One voyage together.`

The Devpost elevator pitch should use the same message: **Every redditor contributes one gust to guide a shared creature through today's storm. The route belongs to the whole community.**

## 14. Timebox and stop rules

Implementation work is budgeted in relative work-hours:

1. Environment, Devvit app claim, template, and first playtest: 0.75 hour.
2. Pure map/simulation code and tests: 2 hours.
3. Phaser playfield and route animation: 1.5 hours.
4. DOM interaction states and responsive layout: 1.25 hours.
5. Server validation and Redis persistence: 1.25 hours.
6. Integrated playtest, deployment, and critical fixes: 1.25 hours.
7. README, screenshots, Devpost fields, and public demo verification: 0.75 hour.
8. Video capture, edit, upload, and final submission check: 1.25 hours.

This is a 10-hour execution budget. Any remaining working time is contingency for Devvit setup, upload, authentication, or recording friction rather than permission to add scope.

Features freeze three hours before the Devpost deadline. After the freeze, only submission-blocking defects, deployment, documentation, media, and form completion are allowed. If the timeline slips, remove ambient particles, route-impact prose, and previous-result animation in that order. Do not remove persistence, preview, authoritative commit, mobile usability, README, demo post, or video.

## 15. Definition of done

Drift Council is ready to submit only when:

- the public demo post loads and accepts a real authenticated contribution;
- a second viewer sees the committed shared change;
- reload preserves the player's committed state;
- desktop and mobile-width layouts remain fully usable;
- automated tests, type-check, and production build pass;
- the app listing and root README are complete;
- the demo video is public and shorter than one minute;
- all Devpost required fields and links have been reviewed in preview mode;
- the final submission has been received before the deadline.
