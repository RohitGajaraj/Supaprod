# VERIFIED · items 34 and 20 on a real track (R-11 pass 2, LANE 1 verifying LANE 0)

Verifier: LANE 1 · 2026-08-25 · dev server `bun run dev` on :8080, signed in as
**harbor@supaprod.ai** (session identity checked via the auth-token storage key
before any write), track `e976e60e-be6f-423e-b640-4ca26a469e11`.
**Server stopped at 05:3x, immediately after the check** — one server, one
purpose. Screenshot: `.playwright-mcp/verify-item34-held-no-continue.png`
(also copied to repo root as `verify-item34-held-no-continue.png`, gitignored
location pending).

## Item 34 (auto-continue) — what was exercised

Pressed "Run it now" once on a held track (`out-of-time` hold at Design).

- **The hold-guard held in the negative case**: the walk returned `held`, and it
  did NOT auto-continue — control handed straight back, exactly per the ruled
  rule "never after held/stalled/finished". The falsifier "continuation firing
  after a hold" was tried for real and did not fire.
- **The result is announced politely**: the outcome rows sit inside a
  `role="status"` region; "It stopped and is waiting on something." rendered with
  the driver's own words beneath.
- NOT verified live: the positive path (multi-leg continuation on
  `out-of-window + more`), "Stop after this leg", and the 8-leg cap message.
  The named fixture `8391835f…` is not visible under harbor — navigating to it
  bounced to /discover — and this harbor track cannot reach a second leg until
  the defect below clears. MAIN's fixture or deploy per RL0-022b §4 still owed.

## Defect found while verifying — file with MAIN

**"design did not complete: Unknown agent: ux-architect"** — the driver attempted
to seat an agent slug that does not exist in the roster, so Design can never
complete on this track and every drive returns held-instantly. This is a
roster/seed/driver defect (`src/lib/**` or the roster seed), not surface. It is
also the reason this verification could not proceed to the positive case.

## Items verified in passing, all rendering live on the same page

- Unit 056/055 surfaces: disclosure line reads "Running in Helio Labs · on
  Relay"; /start's open-runs row navigated to this track correctly.
- Item 20 (L0): "Why it stopped" region renders the hold sentence verbatim +
  "It last moved 3d ago." + On hold chip + release control ("Let Design try
  again").
- Items 3/7 (L0): artifact pane with station tabs; Design selected showing the
  prototype as itself; chain summary honest about missing members ("2 of them no
  longer resolves to anything we can show").
- Transcript carries handoffs ("picked up from Design") and item 29's history is
  visible in the wild: repeated "Account credit balance (0) is below the
  projected cost (17)" stop entries.

## Item 29 (exhausted state) — partial

No billing banner renders on harbor (no exhausted state to show without MAIN's
zeroed fixture), so the new EXHAUSTED branch could not be exercised live. The
code branch exists as described; live screenshot remains owed against MAIN's
fixture, matching L0-051's own note.
