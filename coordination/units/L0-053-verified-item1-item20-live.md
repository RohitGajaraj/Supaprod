# VERIFIED — item 1 (consent card), item 20 (hold + retry): production, with screenshots

**Verifier:** LANE 0 (R-11 pass 2) · **Against:** the deployed site (MAIN's
deploy of main; RL0-022b §4) · **Accounts:** meridian@ then voyage@ — both
burnable per RL0-022b · **No dev server started** (R-21 satisfied trivially).

## Item 1 — the consent card, exercised end to end

Track `aefa3a86…` (meridian@), approval `4b2ce96e…`:

- Card renders IN the run page above the preview pane; question is
  `gateHeadline("cluster.trigger")` ("Regroups this workspace's recent signals
  into themes."); **no tool name in any derived string**; marker "Waiting on
  you" + subject "Discover · Research"; age "Stopped for 4 days".
- Evidence lines all present: Reversibility+undo, risk driver ("it touches a
  lot at once"), the agent's rationale verbatim, and the expiry consequence
  ("Proceeded unasked: nobody answered by …declared default is to proceed…").
- Option rows numbered 1/2 with derived consequences; class button reads
  **"Answer all 2 questions like this one in this workspace"** (count AND
  workspace named); snooze present; no dismiss anywhere.
- **DECLINE**: "Don't run it" opened the reason field; commit verified DEAD
  while empty; committed with a reason → gate cleared from the page and the run
  RESUMED WITHOUT ANY SECOND CLICK (`driveTrackNow` fired via `onAnswered`;
  result row appeared in the polite status region). §8.3a and §8.5 both pass.
- **APPROVE**: track `0a19ba60…` — "Let it run" → gate cleared → run resumed.
- **CLASS**: voyage@ track `44f207cb…` (two gates) — "Answer all 2…" pressed;
  BOTH settled; run resumed automatically.

## Item 20 — hold reason + retry, exercised

Same voyage@ track, after its walk resumed and stalled:

- "Why it stopped" region: driver's own sentence ("This station ran and
  produced nothing several times, so it is being sent for a fix."), chip
  correctly **"On hold"** (stalled ≠ person-hold), "It last moved just now."
- Retry control present and working: "Let Discover try again" → receipt
  **"You released it"**, which SURVIVED the region clearing (the outside-the-
  region placement did its job).
- Contrast case proven earlier: on `waiting-on-a-person` (meridian track) the
  region showed NO retry button — the one-hold rule holds in production.

## Also confirmed on screen

Artifact pane tabs + Discover signal/cluster cards; transcript as
`role="log"`; item 1's drive invalidation chain updating panes without refresh.

## Two findings handed to MAIN (not defects in my scope)

1. **`Unknown agent: discovery-scout`**: after resume, sense held with
   "sense did not complete: Unknown agent: discovery-scout". A roster gap on
   these sample workspaces — every retry will re-stall until the seat exists.
2. **Settled history is ephemeral on THIS card**: once harvested out of
   `pending_gates`, getTrackGates no longer sees settled rows, so the card's
   settled list empties quickly (the /approvals record persists). If the card
   should keep showing "It ran." after harvest, that needs a read change — MAIN's call.
3. Note: my LAST two pushes (items 24/28/34 client bits) postdate MAIN's last
   deploy; their on-screen behaviour (copy control, auto-legs count) verifies
   after the next deploy. Everything asserted above was verifiable on the
   current build.

Screenshot saved: `.playwright-mcp` session artifacts +
`verify-item1-consent-card-voyage.png`.
