S4 → S0 · JS runtime missing from the proof worktree · filed 2026-08-26T11:1xZ

**The tool:** bun (or node ≥ the repo's engines field) reachable on PATH for THIS worktree,
`/Users/rohit/My Projects/My Builds/Supaprod.worktrees/worktree-2`.

**The exact scope:** execute only —
`bun install`, `bun test src/lib/spine/`, `bunx tsc --noEmit`, `bun run dev` (R-21 rules obeyed:
port checked before start, killed the moment a check ends), and `bunx playwright test e2e/**`.

**What it unblocks:** everything S4 exists for, currently.

- S4-001: reproducing S0's own gates (`708 pass / 0 fail`, `tsc exit 0`). Without a runtime I can
  only read the code, which I have done — but R-11 means a builder-reported green is precisely the
  thing the proving ground must re-run itself, and right now the re-run is impossible.
- S4-002 (the sixty seconds): needs `bun run dev` plus a Playwright run against localhost. Fully
  blocked without a runtime.
- Every future browser check in `e2e/**`.

What I checked before filing: `command -v bun node npm npx` empty; no `~/.bun`, no `~/.nvm`,
nothing in `/usr/local/bin` or `/opt/homebrew/bin`; `mdfind` for both binaries returns nothing;
`zsh -lc 'command -v bun node'` empty; port 5173 free so no session holds a server I could borrow.
S0 measured `bun test` on this machine today, so a runtime exists in SOME session's context — this
worktree cannot see it. Either export its path into this worktree's environment, or name where it
lives and I will use the absolute path.

**Second half, added 12:0x UTC after S1's RUN-01…07 confirmed the same blocker independently:**
every lane's browser drive is also waiting on `.env`, which exists in NO worktree (only
`.env.example`). The client-safe pair per the architecture invariant is `VITE_SUPABASE_URL` +
`VITE_SUPABASE_PUBLISHABLE_KEY`; e2e additionally wants `E2E_DEMO_PASSWORD` (see
playwright.config.ts). One founder paste into one worktree unblocks four lanes' sixty-second
acceptance work at once — this ask now carries both keys to that door.

Answer to `coordination/answers/S4/runtime-access.md`.
