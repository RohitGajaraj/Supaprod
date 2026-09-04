# The long tail, the orphans, and how many surfaces this product should have

> _Created: 2026-08-14 · Last updated: 2026-08-14_

> _Audit pass, 2026-08-14. Raw output, saved as it finished. The audit document is the conclusion; this is evidence._

## The headline

**The product does not have ~110 surfaces. It has 34, and it should have 14.**

83 `_authenticated.*` route files, of which **46 are redirect stubs** and 3 are layouts. Of the remaining 34: 11 admin, 2 first-run, leaving **21 daily-product surfaces**. The product's own `PRIMARY_NAV` (`nav-model.ts:111`) declares 12 doors plus Settings and Admin. That is the number to hold it to.

**The redirect layer is the best-maintained part of this codebase**, not the problem. Most stubs carry a dated ruling explaining where the thing went and why. `impact.tsx` was re-pointed specifically because "a link that lands somewhere real and wrong is worse than one that fails". That principle is right and is currently violated in exactly four places.

## P0 — a new user with no workspace gets an infinite spinner on `/today`

All three Today reads are `enabled: Boolean(workspaceId)` (`today.tsx:345,351,355`). A disabled react-query v5 query is `isPending: true, isError: false, data: undefined` — case 1 in `query-state.ts`'s own docblock — so `stillWaiting()` returns **true forever** (`query-state.ts:91`). All three lanes render a permanent `<Loading>`, with no `<Failed>` and no retry.

**And it is reachable.** `needsOnboarding()` keys on `profiles.onboarded`, **not on workspace membership**, and returns `false` on any read error (`onboarding-gate.ts:44,58`). `use-workspace.tsx:132` resolves `activeWorkspaceId` to `null` for a user in zero workspaces. **No surface in the codebase handles `workspaceId === null`** — the only hit is `ObsidianOnboarding.tsx:920`.

Note the inconsistency, which is what makes this hard to spot: `FocusNext.tsx:50` and `PushedInsights.tsx:82` gate on `isLoading` (false when disabled) and silently vanish; Today's lanes gate on `isPending` and hang.

## Four redirect destinations that land somewhere real and wrong

| Route | Promises | Actually lands | Why it is broken |
| --- | --- | --- | --- |
| `/calendar` | `/brain?tab=calendar` | Brain **Decisions** | `LEGACY_TABS.calendar = "decisions"` (`brain.tsx:458`). Forwards `?meeting=` which `brain.tsx:558` parses and never reads. |
| `/meetings` | `/brain?tab=calendar` | Brain Decisions | `brain.tsx:439` claims meetings "moved to Today's PM Desk". **No PM Desk exists.** Zero files import `meetings.functions`. |
| `/stakeholder` | `/plan?view=stakeholders` | "not on Plan any more", door → `/brain` | **Brain holds no stakeholder pack** (grep: zero hits). Three hops, no content. The stub's own comment is false. |
| Plan `MOVED_VIEWS` | `?view=goals` → Settings, `?view=loops` → Engine Room | neither holds them | The docblock argues at length against silent no-ops, then hands users doors to content none of those pages hold. |

Fixing four destinations is roughly an hour and removes the entire class.

## The three surfaces that actually render

**`/today` (1080 lines) is the best screen in the product.** Purpose legible in ~2 seconds, one Gate, one queue, four verbs with keyboard bindings (`a`/`d`/`z`, `j`/`k`), and genuine multi-select bulk settle (`DecisionQueue.tsx:400-408`). It should *absorb* `/approvals`, not the reverse — `/approvals` is a 545-line second copy of the same lane on the same query key, with a filter row Today lacks and no Send Back, which Today has. Two implementations of one queue is how you get two behaviours.

**`/threads` (738 lines) is a good surface that is effectively hidden.** Its empty, loading and error states are exemplary: three states across three primitives on both reads, retry on every failure arm, and a copy-link receipt that is honest that a thread is private. It has exactly **one** inbound link app-wide (`AskSwitcher.tsx:151`), three clicks deep inside a summonable panel. The rail lights *Brain* for it while Brain offers no way in, so the shell claims a parent that does not exist. It should become Brain's Conversations tab.

**`/sync` (555 lines) is sharp and correctly scoped.** Error-before-loading-before-content on both reads, with retry, and a `followedGone` state telling you the conflict you followed was already resolved. Two blemishes: it toasts where the rest of the product writes receipts (and `threads.tsx:94` states the rule explicitly), and `listSyncMappings` is called with no workspace argument on a query key carrying no workspace, so switching workspace does not refetch.

## The orphaned server layer: 28 modules, 5,177 lines

Larger than first reported. **Every table they touch exists** — 536 migrations checked; `goals`, `loops`, `calendar_events`, `meetings`, `audio_transcripts`, `funnel_milestones`, `fanout_batches`, `workspace_briefs` all have real `CREATE TABLE`s. **This is missing UI, not missing backend.**

**WIRE (13 modules, 2,935 LOC)** — a real capability one screen away:
`calendar` (723), `meetings` (229), `audio` (393) are one coherent feature that two live URLs already advertise · `goals` (190) and `loops` (184), both still advertised by Plan's moved-views table · `strategy-registry` (211) and `researcher` (75), a watchlist for a station whose whole job is signals · `rework` (141), which reads tables **Today's Send Back button is writing into right now with no reader** · `cost-per-outcome` (101) and `loop-health` (96), both falsely registered `live` · `run-analytics` (86) · `fanout` (175), the only genuinely differentiated agentic capability on the list · `design-interchange` (326).

**DELETE (15 modules, 2,242 LOC)** — second copies of things that shipped better:
`today-lanes` (558) is the sharpest case, a whole server-side Today IA that is worse than the Today that exists · `dashboard`, `copilot`, `briefing`, `funnel` (a straight duplicate of the live `activation-funnel.server.ts`), `greeting` (4 client-side lines do it correctly), `ambient`, `moat`, `changelog-heartbeat`, `task-graph`, `workspace-automation`, `delegate-desk`, `delegate-poll`, `product-context`, `shared-premise`.

## Why 28 orphans passed CI

`surface-registry.ts` is 985 lines, 160 entries, exactly 1:1 with the 160 `*.functions.ts` modules, **68 live / 92 planned**. Its header says its purpose is no-orphan enforcement: *"a capability nobody can reach from the screen is a bug, and this file is where that bug surfaces."*

Three ways it fails:

1. **It is imported by nothing in production.** Its only importer is its own test.
2. **`status` does not track orphanhood.** Of 92 `planned`, only 24 are orphans; the other 68 have live importers. "Planned" is stale metadata, not a finding. And three orphans are registered `live`, asserting screens that do not exist.
3. **The guard is toothless.** The test asserts every module *has an entry with a non-empty `opensFrom` string*. It never checks the module is imported.

**The one-line fix is worth more than the file:** make the test assert an actual import rather than a declared intention.

## Dead machinery worth noting

`ROOM_ROUTE_IDS` is now empty (`room-url.test.ts:73` asserts `[]`), so `isReimaginedSurface` at `_authenticated.tsx:211` is permanently `false`. The three-shell machinery it guards, plus `MissionShellView.tsx` and `RoomChrome.tsx`, is dead code that the comment at `:194` has not noticed.

## The work

Delete 2,242 lines. Wire 2,935. Fix four redirect destinations. Make `surface-registry.test.ts` assert an import. Defend a count of 14 doors.
