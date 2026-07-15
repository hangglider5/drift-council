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

# Submission checklist

- [ ] **Source repository:** This checkout has no Git remote. Publish commit `docs: package Drift Council submission`, then paste the public repository URL into Devpost before submission.
- [x] **Public demo post:** https://www.reddit.com/r/driftcouncildemo/comments/1ux0n8c/drift_council_one_gust_each_one_voyage_together/
- [x] **App listing:** https://developers.reddit.com/apps/drift-council
- [ ] **Video URL:** Record from `VIDEO_SCRIPT.md`, upload publicly or unlisted, verify while signed out, then paste the working URL into Devpost.
- [x] **Technology tags:** Devvit Web, Phaser, TypeScript, Hono, Redis, Vite.
- [x] **Screenshots prepared:** `docs/media/thumbnail.png`, `docs/media/gameplay.png`, and `docs/media/commit.png`.
- [ ] **Official rules confirmation:** Re-read https://redditgameswithahook.devpost.com/rules immediately before submission and confirm eligibility, media, source, and deadline requirements in the Devpost UI.
- [ ] **Devpost receipt:** After the external submission is confirmed, save the confirmation screenshot and record the exact timestamp here.

Do not submit this checklist with any unchecked URL or confirmation item. The unchecked items require external accounts or UI and are intentionally left for the final controller pass; no URL has been invented.
