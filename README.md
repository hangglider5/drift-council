# Drift Council

## What it is

Drift Council is a daily community voyage inside a Reddit post. A deterministic 6×6 wind field appears every UTC day, and every authenticated redditor can add one immutable north, east, south, or west gust. The server combines those equal-weight choices into one shared route toward an amber beacon.

## The hook

One gust each. One voyage together.

The interaction takes seconds, but its consequence is collective: preview how your gust bends the route, commit once, then watch the same authoritative outcome that everyone else sees.

## How to play

1. Open the expanded Drift Council post.
2. Select one of the 36 wind-field cells.
3. Choose north, east, south, or west.
4. Preview the resulting community route.
5. Commit the gust. It cannot be changed until the next UTC day.
6. Replay the shared route and see whether the council reaches the beacon, crosses a squall, or drifts away.

## How it works

The UTC date deterministically creates the same map for every viewer. Existing gusts are aggregated with equal weight, then a fixed-step simulation traces the shared route through the field. A candidate gust is simulated locally for an immediate preview, but only the server can accept a contribution and return the committed result.

## Architecture

- **Devvit Web** hosts the custom Reddit post and authenticated server context.
- **Hono** exposes `GET /api/voyage` and `POST /api/gust`.
- **Devvit Redis** atomically stores one gust per Reddit user and UTC day with `hSetNX`.
- **Pure TypeScript** owns deterministic map generation, validation, aggregation, and route simulation.
- **Phaser** renders the procedural wind field, route, storms, beacon, and Driftling.
- **Plain DOM and CSS** provide the responsive HUD and accessible controls.

The client sends only a day ID, grid cell, and cardinal direction. It never supplies an identity, aggregate, seed, or authoritative route.

## Local development

Node.js 22.2 or later is required.

```bash
npm install
npm run dev
```

`npm run dev` starts a Devvit playtest and prints the development subreddit URL. Sign in with `npm run login` first if the CLI requests authentication.

## Testing

```bash
npm run check
```

The check gate runs TypeScript, ESLint, the Vitest suite, and the production Vite build. Tests cover deterministic daily maps, aggregation and simulation, validation, Redis idempotency and conflicts, HTTP error envelopes, UTC rollover, client transitions, responsive geometry, interaction gating, and required UI copy.

## Deployment

```bash
npm run deploy
```

Deployment type-checks and lints before uploading a new Devvit version. The stable public demo installation currently uses `drift-council@0.0.2` in `r/driftcouncildemo`.

## Data use and privacy

Reddit user IDs are used only as Redis hash fields to enforce one contribution per UTC day. The stored value is only the chosen grid cell and direction. Daily Redis data expires after 30 days. User IDs and usernames are never returned to clients, and Drift Council uses no external runtime service, analytics service, advertising SDK, or generative-art pipeline.

## Moderator installation

Moderators can install Drift Council from the [Devvit app listing](https://developers.reddit.com/apps/drift-council) after launch approval. For an authorized development subreddit, the corresponding CLI command is:

```bash
npx devvit install <subreddit-name> drift-council@0.0.2
```

Use the subreddit moderator menu item **Create a new post** to create the interactive post.

## Hackathon submission

- [Live demo post](https://www.reddit.com/r/driftcouncildemo/comments/1ux0n8c/drift_council_one_gust_each_one_voyage_together/)
- [Devvit app listing](https://developers.reddit.com/apps/drift-council)
- [Reddit's Games with a Hook Hackathon](https://redditgameswithahook.devpost.com/)

Submission copy, media inventory, and the final external-link checklist are in [SUBMISSION.md](SUBMISSION.md). The 45–55 second capture plan is in [VIDEO_SCRIPT.md](VIDEO_SCRIPT.md).
