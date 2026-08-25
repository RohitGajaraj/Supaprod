# BUILDLOG — LANE 0

> _Honest ledger, written for the auditor, not for credit. Last updated 2026-08-25._
> **Legend:** VERIFIED-LIVE (seen rendering/behaving on production or a dev
> server by me or another lane) · CODE-SHIPPED (gates green, wired to real
> reads/writes, never seen rendered) · BLOCKED (waiting on MAIN/L1).

## Session 2026-08-25 (units L0-038 → L0-067)

| Item | Unit | What shipped | True state |
| --- | --- | --- | --- |
| Queue #20 hold reason + retry | L0-038 | Hold banner from `getTrack`, retry via `retryStation`, menu fix in TrackStart | **VERIFIED-LIVE** (production, L0-053: driver words, chip tones, retry click → release receipt) |
| Queue #21 transcript a11y | L0-039 | `role="log"` on transcript, polite walk-result region | **CODE-SHIPPED** (structure asserted in tests; no screen-reader session run) |
| Queue #3 artifact pane slice 1 | L0-040 | Tabbed pane shell, four states from chain rows, Plan body via `getPrd` + `savePrd` edit | **VERIFIED-LIVE** (tabs + states seen on prod; Plan edit control seen but its WRITE not exercised end-to-end) |
| Queue #11 transcript motion | L0-041 | Transcript composed onto `run-rows.tsx`; arrival animation on `--mrd-d-enter`; live elapsed clock | **CODE-SHIPPED** (motion itself never observed — needs a live walk or dev-server watch; clock logic covered by `useElapsed`'s own tests) |
| Queue #3 slice 2 Decide card | L0-042 | Decision card, forecast block, forecast form, approve/reject | **VERIFIED-LIVE partially** (MAIN's fixture track showed card fields; forecast form + approve/reject writes NOT exercised against a real decision) |
| Queue #1 consent card | L0-043 | `TrackConsent`: CallGate per gate, decline+steer, class button, snooze, resume-on-answer | **VERIFIED-LIVE** (production: decline w/ reason, approve, answer-all-2 all settled real gates and resumed runs; screenshots) |
| Queue #15 adoption evaluations | L0-044 | InsightCards/PromotionCard/PairMark rejected with reasons | Complete as an evaluation; nothing built |
| Queue #9 Learn verdict card | L0-045 | Predicted/actually/believed join + settle/defer/reopen controls | **CODE-SHIPPED, NEVER SEEN WITH REAL DATA** — zero graded forecasts exist; the join fix from D-9.8 is untested against two-decision tracks |
| Item 7 reveal-in-pane | L0-046 | Chain row click switches pane tab | **CODE-SHIPPED** (not clicked in a browser yet); D-7.4 correction restored `/plan` to byte-original |
| R027 alignment | L0-066 | Banner yields while legs continue | **CODE-SHIPPED** (logic reviewed against MAIN's driver change; not observed mid-walk) |
| Queue #34 auto-continue | L0-050 | Legs continue on `out-of-window+more`, cap 8 said aloud, Stop control | **PARTIALLY VERIFIED** — negative case (hold stops legs) verified by LANE 1 unit 071; positive multi-leg case and cap message NEVER observed; production deploy predates this commit |
| Items 28 + 24 | L0-052 | `autoStart` guard; copy-summary control | **28 VERIFIED by LANE 1 (unit 069)** incl. revisit-guard; **24 CODE-SHIPPED** — clipboard write never exercised, control not in any deployed build yet |
| Queue #23 review verdict | L0-063 | ChangesetCard with verdict/findings from `code_review` | **CODE-SHIPPED, EMPTY-STATE ONLY BY NECESSITY** — `studio.review` has never succeeded anywhere (0 of 45), so the populated render has never been seen by anyone including me |
| Queue #29 exhausted + runway | L0-051/064/b | Undismissable zero-state banner; runway-in-runs line via `getCreditRunway` | **CODE-SHIPPED** — exhausted banner never seen (needs a real zeroed account); runway figure never rendered (deploy predates wrapper) |
| Standing: dead components | L0-047/054 | Deleted `supaprod/PageHeader`, `supaprod/EmptyState`, `ask/AskWorkLine`; ratchet re-frozen −8−1 | Verified by absence (grep + gates) |
| Standing: retired-token ports | L0-048/057/058/059/060/061 | ~45 retired reads removed across 15 files; Primitives at zero | **CODE-SHIPPED**; MissionGraph/GraphCanvasView remapped BLIND — both-theme visual check still owed |
| Standing: poller a11y | L0-065/067 | Consent arrivals, pane changes, preview frame, file list announced | **CODE-SHIPPED**; triage verdicts recorded for 5 remaining files |
| E2E acceptance pass | L0-062 | Production walkthrough: one sentence → run page → walk fired → held honestly at Discover | **NEGATIVE RESULT RECORDED** — route could not leave Discover (engine window vs scout appetite, MAIN's dial); deploy also predates items 24/28/34 |

## Half-done / stubbed / owed — the list an auditor would ask for

1. **Nothing is mocked or faked.** Every control is wired to a shipped server
   function; every empty state reflects a real read. The honest failures are
   omissions below, not fabrications.
2. **Populated review card never seen** (item 23): impossible until
   `studio.review` succeeds once anywhere. Empty sentence ships instead.
3. **Learn settle path never exercised** (item 9): needs M-3's first graded
   forecast or a due seeded one.
4. **Items 24/28/34 UI + item 29 figure**: in main, not in any deploy I can
   see. All four falsifiers are pre-written in their units.
5. **Graph canvas visual check owed both themes** (L0-061).
6. **Transcript motion never observed** (L0-041).
7. **Copy control clipboard permissions untested** (L0-052).
8. **TrackConsent expiry line prints a raw ISO instant**
   (`by 2026-08-27T10:11:04.084Z`) — honest but ugly; flagged as polish debt,
   needs MAIN's preferred date rendering.
9. **`expiresAtIso` deviation** (L0-043 §Deviations): I convert epoch→ISO
   client-side rather than adding the field MAIN specified. Unobjected so far;
   still open.

---

# LANE 1 BUILDLOG — honest status, 2026-08-25

Written under the context shift. No past work is protected; corrections included.

## Completed and verified (proof: unit files in `coordination/units/`, live Playwright sessions on harbor@)

- **Item 2 · `/start` landing** — gate removed; composer + 4 WorkShape job cards + live open-runs. Core flow proven live twice: sentence → Enter → track created → landed on `/track/:id`. Unit 055, corrected 063, proven 068.
- **Item 28 route half** — `?start=true` → TrackRun `autoStart`; revisit guard verified live on an already-driven track. Unit 069. (TrackRun's mutation side is LANE 0's, L0-052.)
- **Item 10** — header sees mission-less walks via `driven_at` freshness; live line opens `/track/:id`. Units 056/064.
- **Items 12/13/14 design reviews** — written rulings incl. the four held lifts placed (unit 065).
- **Item 32** — swapped to Meridian `PickCard`/`Composer`; locals deleted; adoption 43/48.
- **Run header (SPEC-LAYOUT §2 slice)** — title, Now/Next, `holdTone`-derived chip. Unit 070. Header drift defect caught live and fixed by sharing TrackRun's polled cache key (unit 071).
- **Route census** (unit 061 + addendum): prds trio is load-bearing — do not delete.

## Built but NOT verifiable without DB / MAIN

- **Item 26 surface (`RunwaySection` in settings billing pane)** — renders MAIN's `getCreditRunway` RPC with honest nulls. The RPC numbers themselves need MAIN's SQL verification (the RPC had a burn-filter bug my request `025` caught; corrected version shipped after my last test run). **Uncommitted at context shift; committed now with a guard fix** (queryKey reordered — it tripped `settings-has-one-list-of-sections`).

## Half-done / blocked, with the named unblocker

- **Item 8 two-pane layout** — header slice SHIPPED (unit 070); panes wait on LANE 0's TrackRun split (request `024`). Workbench geometry designed in SPEC-LAYOUT §1.
- **Item 22 boundary fold** — waits on MAIN's governance-floor fix for `updateToolMode` (per R024-025-022) AND LANE 0's controls-into-Safety-room (`022`).
- **Item 6 deletions** — blocked by ruling until a run finishes end to end. Census done; deletable set currently EMPTY (prds trio is load-bearing).
- **Item 34 positive path** — blocked on driver semantics: window closes return `out-of-time` (a hold), not `out-of-window + more`, so auto-continue never engages. Filed `027`; MAIN answered R027 "fixed on my side" — **needs a live re-run to confirm legs chain**, which I will do next session.

## Claimed done that is actually stubbed or mocked

**None.** No mocks, no stubs, no fabricated data anywhere in my units. Every surface reads and writes real tables through server functions. The honest gaps are the blocked items above, not fakes.

## Known defects I filed rather than fixed

- `026` Unknown-agent holds → ROOT CAUSE was an RLS policy hiding null-workspace agent rows from their owners (R026, FIXED by MAIN); my front-door re-test confirmed stations run past Discover.
- `027` out-of-time mutes auto-continue (above).
