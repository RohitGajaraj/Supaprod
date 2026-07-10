# Launch-sprint cold-build specs — every remaining G17 row, Sonnet-executable

> _Created: 2026-07-10 late. Companion to [`coherence-cluster-specs.md`](./coherence-cluster-specs.md) (PC-28..33). **Purpose: the thinking is done HERE (Fable, once) so execution runs on Sonnet sessions** — each spec is decision-complete with a verify-first step where the authoring session lacked file-level certainty. Lane prompts: [`research-sprint-lane-briefs.md`](./research-sprint-lane-briefs.md). Shared laws: BUILD-ONLY gates · Love Gate · claim-never-outruns-wiring · humanized UI strings · LOOM visuals untouched._
>
> **The model doctrine (founder economics, 2026-07-10):** 1 Fable + 3 Sonnet. The Fable lane builds ONLY the two danger rows (PC-05 billing, PC-07 chokepoint) and runs the review gate on every other lane's risky ships (chokepoint-adjacent diffs, each surface's Love-Gate walkthrough). Everything else executes on Sonnet against these specs. If a Sonnet lane hits a genuine judgment fork the spec doesn't answer: write the question + your recommendation on the row, pick the reversible option, continue — never block.

---

## PC-03 — Public homepage + positioning refresh (Sonnet)

**Why:** the doorway for the listing; unblocks Google verification (needs a live homepage + privacy policy).
**Verify first:** current landing at `src/routes/index.tsx` (parchment, DESIGN.md contract) — inventory its sections before editing.
**Build:** (1) Hero: the anchor one-liner — "What Cursor did for writing code, Cadence does for deciding what to build." + sub: "Agents do the product work end to end. You make the calls. The ledger proves what worked." + ONE CTA ("Tear down your pet feature — free") → signup/demo. (2) The contrast block: chatbots draft and wait vs an OS that owns the loop (v11 §14.3's approved structure). (3) PROOF over claims: an embedded real teardown example + a live Ledger share link (the `d.$slug`/`t.$slug` share routes exist) + the calibration line. (4) **The data-trust answer above the fold's fold**: what we read / what we never touch / one-click revoke / no training on your data / BYO keys (the 43% blocker — research). (5) The multi-product line (PC-33's story): "One PM. Five products." (6) Privacy policy + terms pages (plain-language; templates fine, honest specifics) — REQUIRED for Google verification. (7) Footer: security page stub, /ard, GitHub-style changelog link.
**Copy source:** `docs/pitch/one-pager.md` verbatim where possible (PROVEN-tagged claims only).
**Accept:** live on prod domain; 10-second "what is this?" test on 3 cold readers; verification submittable; every claim PROVEN-tagged.

## PC-04 — Try-without-signup demo (Sonnet)

**Verify first:** the demo seed state (`DEMO-SEED-RICH` shipped; demo accounts in `docs/operations/demo-credentials.md`) and whether a read-only session pattern exists (grep `demo` in auth middleware/routes).
**Build:** a `/demo` route: enters a READ-ONLY view of the seeded demo workspace — no auth, no writes (server fns behind a `demoGuard` that rejects mutations; simplest: a dedicated read-only server-fn set reusing the demo account's user context via service-role reads scoped to the demo workspace id — never expose the service client broadly). Show: Today (warm), one teardown, the Ledger, one mission trace. Sticky banner: "You're in the demo — make it yours" → signup. Instrument `demo_viewed`/`demo_to_signup` events.
**Accept:** zero-auth demo renders warm in <3s; no mutation path exists (attempt returns friendly refusal); conversion events flow.

## PC-05 — Billing go-live pack (FABLE — danger row)

**Why Fable:** touches the dormant credits engine + money. **Gated input:** the founder's merchant-of-record account (Paddle recommended). Build everything up to the live-key seam regardless.
**Verify first:** the credit engine's go-live runbook (`docs/operations/credit-engine-go-live.md`), `credits_enabled()` flag, the pricing catalog tables (`pricing_plans/bundles/topup_bundles`), the existing Stripe webhook handler location.
**Build:** (1) a `PaymentsProvider` seam mirroring the house adapter pattern: `createCheckout`, `verifyWebhook`, `grantFromEvent` — Stripe impl refactored INTO it, Paddle impl beside it (Paddle Billing API: checkout link + webhook signature verify). (2) Pricing page per `pricing-strategy.md` (4 tiers, credit dropdown, annual toggle; Critic-on-Free per the G18 canon edit). (3) The go-live checklist automated where possible: balances backfill check, `credits_enabled()` flip guard (refuse if any account would hit 0), a dry-run mode. (4) Refund path: provider refund → credits clawback entry (never negative-lock a workspace; floor at 0 with a ledger note).
**Accept:** with test keys end-to-end: checkout → webhook → credits granted → visible in UI → refund claws back; the flip runbook rehearsed on staging/demo; live keys slot in without code changes.

## PC-06 — Activation funnel instrumentation (Sonnet)

**Verify first:** what the shipped "PC-06 foundation" commit (`39f6779a`) added — read its diff first; extend, don't duplicate.
**Build:** canonical event names: `signup_completed`, `source_connected` (or `notes_pasted`), `first_teardown_viewed`, `first_mission_dispatched`, `week2_return` (computed). Write to `product_analytics` via one `trackActivation(event, props)` helper; wire at the five moments (onboarding steps, teardown render, dispatch fn). Funnel view in Engine Room (Spend-room chart pattern): counts + conversion per step, 7/30-day toggle. The weekly digest gains a funnel line.
**Accept:** a fresh signup traces all five events; the funnel renders live; zero PII in event props.

## PC-07 — Goal-until-verified missions (FABLE — chokepoint row)

**Why Fable:** edits `loop.server.ts` (pinned). The design is decided; execution needs attended-grade care + adversarial self-review.
**Design (decided):** a mission whose PRD has a compiled Outcome Contract (CNV-02 oracles exist) may run in `verify_until_green` mode: after the actor loop completes a cycle, a SEPARATE verifier pass (distinct `agent_run`, `role=verifier`, temperature-low) evaluates the oracle checklist against artifacts/tests; on fail → structured feedback becomes the next cycle's input; on pass → mission completes. **Caps (hard):** max 3 verify cycles, existing step ceilings per cycle, credit budget cap per mission (read the account cap helpers); every cycle logged as steps; the trust ramp untouched (verify mode never loosens approvals).
**Verify first:** CNV-02's oracle compile shape (`requirement oracle` fns), `advanceMissionCore`'s finalize path, where mission completion is decided.
**Accept:** demo: a mission with a deliberately failing oracle iterates ≤3 cycles to green; the trace shows actor/verifier separation; caps enforced (test the cutoff); zero regression in the 3 existing mission-flow test files.

## PC-08 — Routines, productized (Sonnet)

**Verify first:** the cron registry ground truth — the 30-job audit list (this file's authoring session) vs `cron.job` live; the user-facing candidates: sense sweep, cluster, derive/learnings, outcome check, digest, scout/competitor, researcher brief, steward.
**Build:** a `routines` catalog (code constant, not a new table): id, plain name ("Overnight signal sweep"), what-it-does line, cast owner (PC-29 map), schedule (from the cron), per-workspace toggle (one small `workspace_routine_prefs` table: workspace_id, routine_id, enabled) — ticks check the pref before acting for that workspace. Surface: Engine Room band or Brain>Capabilities adjunct (follow PC-30's placement; if PC-30 unbuilt, Engine Room "Routines" panel): each routine = name · owner byline · last run + receipt · next run · toggle. NEVER expose raw cron syntax.
**Accept:** panel lists ≥8 real routines with live last/next; toggling off suppresses that workspace's next tick action (test one); receipts link to evidence.

## PC-10 — One-key rewind, finish (Sonnet)

**State:** server fns + migration shipped (prds/decisions; roadmaps leg deferred — table doesn't exist; see the row note). Remaining: capture-on-write + UI.
**Build:** (1) capture-on-write: where agents write prds/decisions (grep the write fns: prd draft/update, decision create/supersede via agent paths), snapshot the prior state into `snapshot_before` (only when actor is an agent). (2) UI: a "Rewind" affordance on agent-touched PRD/decision detail views (byline row: "Drafted by Scribe · 2h ago · Rewind") → confirm sheet → calls the fn → toast + Ledger receipt renders. (3) The Ledger shows rewind entries (`artifact.rewind` inserts exist).
**Accept:** end-to-end on demo: agent edit → rewind → content restored → receipt visible; non-agent edits show no rewind.

## PC-11 — Confidence-gated execution, generalized (Sonnet)

**Verify first:** the outcome-suggestion confidence pattern (`generateOutcomeSuggestion` tiers) — reuse its vocabulary.
**Build:** a shared `confidence` field convention (`high|medium|low`) on agent-drafted artifacts (PRD drafts, pushed insights, playbook proposals — start with these three writers); low → auto-routes to the review queue (the existing approvals/triage lane) instead of landing silently; UI chip on drafts ("Cadence is unsure — review first"). No new scoring model: writers already produce or can cheaply produce a self-assessment via the existing structured outputs; where absent, default `medium` (no gate).
**Accept:** a low-confidence draft lands in triage, not on the surface; chips render; high-confidence flow unchanged.

## PC-12 — Parallel fan-out → one review queue (Sonnet, Fable-reviewed)

**Design (decided):** one "explore this from all sides" dispatch (from AskInContext on a bet/spec): spawns up to 3 parallel child runs (draft/eval/risks) via the existing handoff machinery; a reconciler step (the orchestrator) merges into ONE review item (a single approval card carrying the three sections), not three notifications.
**Verify first:** `agent.spawn`/handoff envelope shape; how child runs attach to a parent mission; the approval card's content model.
**Build:** a `fanout` mission template + the reconciler prompt + the composite review card. Cap: 3 children, existing budgets apply.
**Accept:** one ask → one composite review in the judgment lane; trace shows 3 children + merge; Fable lane reviews the diff before merge (touches dispatch, not the pinned loop core — if it does need loop.server.ts, hand to Lane A).

## PC-15 — In-product feedback pulse (Sonnet)

**Build:** a tiny `PulsePrompt` ("Was this useful?" 👍👎 + optional line) on: teardown results, the morning brief, composite reviews. Writes to `signals` with `source_kind='product_pulse'` (the signals sink exists) — dogfood: our feedback IS a signal into our own loop. A "You said → we changed" section on the public changelog page fed by shipped rows tagged `from_pulse`.
**Accept:** pulse writes signals (visible in Discover for the Cadence workspace); the changelog section renders ≥1 real entry post-beta.

## PC-16 — Judgment-memory hero moments (Sonnet, Fable-reviewed for copy)

**State:** RF-01..08 wired (outcome-weighted retrieval + ranking); the FELT layer is missing.
**Build:** (1) On Decide cards where ranking used outcome memory (the RF comparator exposes its inputs — verify the rationale fields on ranked opportunities), render the citation line: "Your last N similar bets: X validated, Y missed — this mirrors [link]." Honest when sparse ("First bet in this area — no history yet"). (2) The weekly digest gains "What Cadence learned": the week's learnings + any re-ranks they caused (learnings + ice_adjustments exist). (3) Brain surfaces the same on the decision record.
**Accept:** an account with ≥3 outcomes shows citations on ranked bets; sparse accounts show the honest line; digest section ships.

## PC-22 — Eng receipts chain + SW-7 fold (Sonnet)

**Build:** (1) One view (Build detail or `/build` tab): spec → PR → CI runs → merge → deploy → outcome window as a single receipted chain (stage_events + studio_changesets + learnings joins — verify the join keys). (2) SW-7's non-gated remainder: drive the `studio.pr.merge` trust-ramp counter 4/5 → 5/5 through the REAL approval flow (dispatch a low-stakes mission, approve via UI); exercise CI self-correct on a genuinely failing test (inject a failing test in a scratch branch mission; watch the red→green retry); re-verify `ci-poll-tick` live. Document each in the row note; flip SW-7 ✅ when all three land.
**Accept:** the chain view renders for a real merged mission; SW-7 closes with evidence lines.

## PC-27 — The YC application assembly (Sonnet draft, FOUNDER voice-pass)

**State change:** `docs/pitch/yc/` now contains the strategy + scripts — this row is assembly, not authoring.
**Build:** draft every application field per `application-strategy.md` §3 into `docs/pitch/yc/application-draft.md`, pulling PROVEN claims + live numbers at draft time; flag every [NUMBER-AT-SUBMIT] slot. Founder does the voice pass + submits post-launch (W27).
**Accept:** a complete draft with zero unfilled claims except tagged number slots.

## PC-13 / PC-14 / PC-26 (Sonnet — GTM lane; specs live in the plan §2 + pitch room)

Already execution-grade: PC-13 seeds from the research §12 cohort (25 targets, receipts-first kit; NOTHING sends without the founder); PC-14 builds the listing assets against `demo-script.md`'s Show-HN variant + the PROVEN tags + the Google-tiles "request access" guard; PC-26 follows plan §6 (arm's-length HyperAgent rig). Verify-first for PC-13: the HyperAgent account's grant expiry terms.

---

## The lane cut (v3 — 1 Fable + 3 Sonnet)

- **Lane A (FABLE):** PC-05 → PC-07 → then standing REVIEW GATE: each surface's Love-Gate walkthrough after Lane B ships it + diff review on PC-12/PC-16 before merge.
- **Lane B (SONNET):** the coherence cluster PC-32→33→28→29→30→31 against `coherence-cluster-specs.md` (decision-complete; Love-Gate verified by Lane A per surface).
- **Lane C (SONNET):** PC-03 → 04 → 06 → 08 → 10 → 11 → 15 → 12 → 16 → 22 against THIS file.
- **Lane D (SONNET):** PC-13 → 14 → 26 → PC-27 draft → the G18 sweep by rank.

Collision law unchanged (B owns the 7 surface routes/nav/vocabulary; A owns chokepoints; C backend/feature files; D docs/GTM). Paste-ready prompts: [`research-sprint-lane-briefs.md`](./research-sprint-lane-briefs.md) — v3 blocks.
