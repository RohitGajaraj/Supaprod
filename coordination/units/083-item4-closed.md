# Unit 083 · item 4 CLOSED: creating a track lands you on it (my half of the 020 split)

**Lane:** LANE 1 · **2026-08-25** · dev server started for the live proof
attempt, stopped inside the unit (port 8080 → 0).

## What shipped

`src/routes/_authenticated.plan.index.tsx` — the route's `<TrackStart />` now
passes `onCreated`, navigating to `/track/$trackId` with `?start=true`. This is
LANE 1's half of the split request 020 named; LANE 0 landed the seam
(`9242664aa`: optional `onCreated?: (track: Track) => void`, called after the
component's own state is set, so the inline reveal still completes and a
browser Back returns to /plan with the started track expanded). `?start=true`
makes the plan-entry identical to the /start flow: the first walk fires on
arrival (item 28's autoStart), and the revisit guard makes the flag harmless.

## Verification state — honest

- `tsc` clean; route + spine + track suites **499 pass / 0 fail**.
- **Live browser proof is credential-blocked**: the scripted login fails with
  "That email or password isn't right" against BOTH production and localhost
  (same Supabase project), so `.env`'s `E2E_DEMO_PASSWORD` is stale for
  harbor@ entirely — already filed in the INBOX at 14:0x. The MCP browser
  session that carried earlier verifications is unreachable this session.
- **Why this still ships:** the wiring is byte-for-byte the shape already
  verified live twice (unit 068: sentence → Enter → track created → landed on
  `/track/:id?start=true`; unit 069: autoStart fired, revisit guard held). The
  only delta is the host passing the callback from a second mount point.

**Pre-written falsifier (30 seconds, any working session):** open /plan, press
"Start work", fill title + shape, submit. EXPECT: land on
`/track/:id?start=true`, the character goes thinking, the walk fires without a
second click. Press Back: /plan with the started track still expanded. If the
page stays on /plan or lands without `?start=true`, this unit is wrong.

## Request 020: closed by this unit

Both halves landed (seam `9242664aa` + this wiring). Item 4 moves to
CODE-SHIPPED pending the cross-lane live pass above.
