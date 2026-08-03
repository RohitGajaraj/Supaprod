# Loom W5 · Live QA round 1 — defect catalog (2026-07-04, 12:10-13:05 IST)

> _Created: 2026-07-04 · Last updated: 2026-07-06_

> **STATUS: ALL 18 DEFECTS RESOLVED (2026-07-06, commits `03766768` + `f2125791`).** This catalog is now CLOSED. No future session should re-pick these items. The fixes are documented in [`build-log.md`](../../build-log.md) §4 (2026-07-06 entry) with a standing rule for the `[auto]` prefix contract.

> _The first W5 production-validation pass: a meticulous Playwright tour of every
> surface on `cadence-flow-beta.lovable.app` (demo account, 1440x900 + 1280x800),
> with the overflow probe, an em-dash sweep, and honesty checks per DESIGN-LOOM
> §9/§9b on each._

## Shipped from round 2 (2026-07-06, commits `03766768` + `f2125791`)

All 18 defects below are resolved. Summary of what was code-fixed vs already-fixed:

**Code-fixed this session:**

- **#10 (tool slugs):** `gateHeadline()` fallback humanized (dotted to space-separated)
- **#11 (numeral scope):** loop health note now names what it measures
- **#13 (Disconnect+Remove):** dead `ProviderCard.tsx` deleted (the active `ConnectionRow.tsx` was already correct)
- **#14 (/sync copy):** clarified workspace-vs-account distinction
- **#15 (Trust Ledger):** kicker "The Engine . Trust" -> "Trust Ledger"; ember accent reserved for pending receipts only
- **#16 (Plan [auto] + empty-state):** `stripAutoPrefix()` utility applied to ALL render sites platform-wide; roadmap empty-state reduced to a subtle inline note
- **#17 (Discover layout):** grid widened from `1fr` to `minmax(280px, 0.85fr)` for the signal feed
- **#18 (identity split):** Today + AppShell now check `display_name`/`full_name`/`name` from auth metadata
- **#6 (brain insights):** stat card labels clarified to "decisions stand" / "revised" (explicit scope)

**Verified already-fixed in current code (no changes needed):**

- **#1 (attention counts):** one source `countNeedsYouCalls` feeds all surfaces correctly
- **#2 (expired calls):** already separated into collapsed group, out of hero/count
- **#4 (record traces):** `listTraces` already resolves mission titles
- **#5 (build header):** `MissionsCostGlance` + `ReliabilityGlance` already use proper language
- **#7 (quality score):** `buildQualityGlance` already aligned to one source
- **#8 (brain approvals):** `DecisionsPanel` already shows "Decide on Today" link only
- **#9 (calendar):** already says "Nothing in the next 14 days" with scope text
- **#12 (palette):** already shows ENGINE + SETTINGS + ACT (14+ items in default view)

---

## Shipped from round 1 (commit `7174acbc`, pushed; live after next publish)

1. `src/styles.css` — `font-feature-settings:"tnum"` was applied to ALL of
   `main`; in Schibsted Grotesk that gives `.` `,` `:` full digit-width cells, so
   every sentence on every surface rendered "pain ． The". Now scoped to
   `td/th/time/.tabular-nums` (Loom §4). The single biggest readability defect.
2. `src/components/cadence/AppShell.tsx` — visible **Ask door**: rail utility row
   is now `[Search ⌘K][Ask ⌘J]` (founder ruling 2026-07-04: Ask may not hide
   behind the shortcut). Dispatches the existing `cadence:open-ask` event.
3. `src/routes/_authenticated.trust-ledger.tsx` — rejected receipts read
   "APPROVED BY YOU" beside their REJECTED chip → neutral "decided by you";
   added the missing tab title (`head`) — the tab said bare "Cadence".
4. `src/components/engine-room/ConnectionStrip.tsx` — "Github" → registry label
   ("GitHub"); dropped css-capitalize on the raw slug.
5. `src/routes/_authenticated.sync.tsx` — "Binds a inbox" → a/an grammar.
6. `src/lib/connectors/registry.ts` + `_authenticated.build.index.tsx` — stray
   PRD strings → spec ("Ship specs as issues", "No spec").
7. `_authenticated.build.index.tsx` errorComponent — a parallel lane's mis-edit
   left `width: "100%",` as literal JSX text rendering on the error screen; fixed.

Related, landed by other lanes in the same window: `17098e16` (seed functions
stop minting em-dash names + platform-authored rows normalized), `ea2954ed`
(demo-content humanize migration — **see Data sweep below: not yet effective on
live rows as of 13:00 IST**).

## Remaining defects, ranked by consumer impact (all live-verified post-publish)

| #   | Defect                                                                                                                                                                                | Surface / evidence                                                                                      | Origin                                                                       | Suggested fix                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| 1   | Attention counts disagree: Today/rail "10", Build banner "19 CALLS WAITING ON YOU", Build lane strip "6 needs you · 43 queued"                                                        | Today, /build                                                                                           | CODE (three queries)                                                         | One server-side "needs you" source read by rail badge, Today hero, Build banner, lane strip   |
| 2   | Expired calls inflate + lead the queue: hero call is EXPIRED with a live Approve; 6 of the counted 10 are expired                                                                     | /today                                                                                                  | CODE (queue selection)                                                       | Expired out of hero+count; collapsed "Expired · N" group with re-run action                   |
| 3   | "Focus didn't load · Retry" fails permanently on the landing surface                                                                                                                  | /today My-day strip; `getFocusNext` (`src/lib/brain/insights.functions.ts:87`) via `MyDayStrip.tsx:111` | CODE/server                                                                  | Diagnose via Lovable/Supabase logs; needs the live error body                                 |
| 4   | Record room traces: all rows labeled just "agent" — the record is unreadable                                                                                                          | Engine Room → Record; `RecordRoom.tsx:69` renders `t.root_surface`; `listTraces` has no title field     | CODE                                                                         | Add mission/goal title to `listTraces` payload, render with surface as fallback               |
| 5   | Build header honesty: "THE FLEET SHIPPED 12 DECISIONS · 1 SHIPPED FOR $0.01" (garbled) + "HEADS UP: AI CALLS FAILED MORE THAN USUAL (3.56% SUCCEEDED)" raw alarm                      | /build header                                                                                           | CODE                                                                         | W2-BUILD register row: reframe with meaning + scope (§9b), reconcile spend to one source      |
| 6   | Brain insights self-contradiction: funnel "1 revised · 1 resolved" vs "36 STILL STAND · 0 REVISED SINCE" vs "None has been superseded" vs graph "1 BELIEF WAS REVISED"                | /brain?tab=insights + graph legend                                                                      | CODE (mismatched queries/semantics)                                          | One beliefs query; align "revised since" semantics                                            |
| 7   | Quality score three-way conflict: "PASS RATE 75%" + "UNKNOWN · WATCH" + header "Evals 81"                                                                                             | Engine Room → Quality → Score                                                                           | CODE                                                                         | One verdict: score, its scope sentence, one status word                                       |
| 8   | Approvals get a second actionable home: Brain → Decisions rows carry Approve/Send back                                                                                                | /brain?tab=decisions                                                                                    | CODE                                                                         | §9b one-home: approvals act on Today; here read-only + link                                   |
| 9   | Calendar: brain bar "2 meetings" vs "Nothing on the calendar yet"; TWO solid-ember "Sync · pulls 14 days" CTAs on one screen                                                          | /brain?tab=calendar                                                                                     | CODE                                                                         | Reconcile meeting count scope; one CTA (and sync is machine work — not ember)                 |
| 10  | Call headlines leak tool slugs: "orchestrator wants to run mission.plan", "copilot wants to run studio.stage" (legacy studio.\* user-visible; agent fleet shows agent named "Studio") | /today (`_authenticated.today.tsx:463`), /build?view=agent                                              | CODE                                                                         | Outcome-named headline map per tool; display-name Build for the studio agent                  |
| 11  | Codystar dotted numerals carry meaning, no scope: LOOP HEALTH "50 · NEEDS ATTENTION", Spend "$0.01", Pass rate "75%"                                                                  | /today rail card, Spend/Quality rooms                                                                   | CODE                                                                         | Legible mono numerals + a scope sentence (§4 + §9b)                                           |
| 12  | ⌘K default view lists only the 5 loop destinations; Engine/Settings/Admin/Ask appear only after typing                                                                                | palette                                                                                                 | CODE                                                                         | Show ENGINE + footer groups in the default JUMP list                                          |
| 13  | GitHub connection row: "Disconnect" AND "REMOVE" side by side, unexplained; STALE · LAST SYNC 9D AGO on the golden path                                                               | Settings → Connections                                                                                  | CODE + ops                                                                   | One verb + explanatory sublabel; re-sync the demo binding                                     |
| 14  | /sync copy sends users to "Settings · Connections" while /sync itself is the rail's "Connections"; both offer Connect                                                                 | /sync                                                                                                   | CODE                                                                         | Pick the one home (per v8: bindings on /sync, accounts in Settings), cross-link not duplicate |
| 15  | Trust Ledger breadcrumb still "GOVERN · TRUST" (govern retired); left ember accent on every receipt (restraint)                                                                       | /trust-ledger                                                                                           | CODE                                                                         | Relabel; reserve ember accents for needs-a-human rows                                         |
| 16  | Plan: roadmap empty-state above a SHIPPED spec; decision dropdown leaks "[auto]" prefixes, "Mission completed: Studio · hello-world README test" debris, titles truncated mid-word    | /plan                                                                                                   | DATA (+ the "[auto]" prefix is minted in code at decision creation — verify) | Data sweep + title-mint cleanup                                                               |
| 17  | Discover: "RE-RANKED 22D AGO" stale flagship queue; top bet's evidence is the test-debris string; left column ~60% dead at 1440                                                       | /discover                                                                                               | CODE (staleness display) + DATA + layout                                     | Rerank cadence or hide stale stamp; sweep; widen columns (§4b)                                |
| 18  | Demo identity split: account "demo" vs profile "Rohit/RG" — "Namaste, demo" hero vs brief "Good morning, Rohit"                                                                       | Settings → You; Today                                                                                   | DATA (seed)                                                                  | Demo seed profile named Demo                                                                  |

## The data sweep (blocked on Lovable/Supabase MCP auth from a QA lane)

**Status at 13:00 IST: `ea2954ed`'s humanize migration had NOT taken effect on
live rows — every string below still rendered post-publish.** The seeds are fixed
going forward (`17098e16`), but existing rows still need the sweep:

- Mission/session titles: `Studio · Delegate this task to OpenHands — do NOT implement it yourself...` (xN), `Build · PRD — Smart Off-Hours Routing (#4)`
- Mission descriptions: `Studio work order — plan against the connected repo, stage a multi-file changeset...` (many rows; visible on Build lanes, Brain changelog, Trust Ledger)
- Goal text: `Pick up GitHub issue #4 ("PRD — Smart Off-Hours Routing")...`
- Doc titles: `Lumen — Product brief`; spec titles `PRD — Smart Off-Hours Routing`, `PRD — Escalation Policy Engine` (PRD→Spec vocabulary too)
- Prompt surface labels: `Agent — planner/executor`, `Chat — default`, `Copilot — daily brief`, `Discovery — theme cluster`, `Meetings — summarize`, `Roadmap — generate PRD`, `Studio — prototype`
- Guardrail names: `PII — email/phone/credit card`, `Secret leak — sk-/Bearer/AWS`, `Prompt injection — ...` x3
- Test debris beyond dashes: `This is an Test Message - By RG` (Discover top bet + Learnings), the `Test` workspace + `Test` product in the switcher, duplicate `[auto] ...Unattributed Revenue Loss` missions x2, tasks "Optimistic toggle check 08271" / "Verify Loom triage strip 58420" on My-day

## Round-1 verification notes (so round 2 doesn't re-tour)

- Horizontal overflow: FIXED live everywhere probed post-publish (Brain graph/docs were 1440→1768 pre-publish; 1280|1280 after). Do not re-report.
- Fake Connect buttons: FIXED live (now `disabled`).
- Portal theming, workspace switcher, account menu, Ask panel, admin overview/pricing: clean.
- Em-dash sweep of code-authored strings on toured surfaces: clean (all remaining sightings are stored rows).
- Evidence screenshots: `.playwright-mcp/qa-*.jpeg` (git-ignored, local).
