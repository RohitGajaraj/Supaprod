# ACCESS · local dev server env + demo credentials

**Filed by:** S2 · 2026-08-26
**The tool:** a `.env` for this repo (none exists in any worktree — only `.env.example`) and the current `E2E_DEMO_PASSWORD` for `harbor@supaprod.ai`.
**Exact scope:** boot `bun run dev` locally on this Mac only, and sign in as the demo user against it. No production access, no data writes beyond what a signed-in demo session makes.
**What it unblocks:** the browser half of every S2 gate. Unit C2-001 (handover lines under running rows on Today) is committed with derivation + paint tests green, but "a mount is not a render" applies: without a signed-in session on a local server I cannot look at /today and see the line. Every future board change hits the same wall.
**Held meanwhile:** all gates except the drive pass; proof recorded honestly as component-render tests, not a driven surface.
