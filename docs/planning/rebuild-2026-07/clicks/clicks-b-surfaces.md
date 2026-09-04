# Click audit B - the work surfaces

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Static analysis, 2026-07-28. Scope: every real authenticated work surface and its deep
> sub-pages - Today, Build (index + detail), Plan (index + spec editor), Settings (all 16
> section ids), Approvals, Brain, Design, Discover, Decide, Ship, Learn, Engine Room, Sync,
> Trace detail, the whole `/admin` group, plus all 41 redirect stubs in
> `src/lib/legacy-redirects.ts`.
>
> **59 findings.** LIES 21 · DEAD 13 · SILENT 12 · ORPHAN 7 · ALWAYS-ON 3 · DUPLICATE 3.
>
> Two findings were given as already-confirmed and are not re-derived (the unconditional
> Spine at `MissionShellView.tsx:368-371`, the hardcoded `380px minmax(0, 1fr)` at
> `MissionShellView.tsx:373`). One correction to the brief is recorded in
> [§4 Corrections](#4-corrections-to-the-brief).

---

## 1. The findings table

Worst first. "Label" is what the user sees; "Expect" is what the label promises; "Actual" is
what the handler does.

| # | File · line | Label | Expect | Actual | Class | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `src/routes/_authenticated.today.tsx:1071-1090` + `src/components/supaprod/CommandPalette.tsx:419-452` | `A approves · S sends back` (rendered at `today.tsx:235`) | Press `a` to approve the featured call | **Two window listeners fire.** Today's handler runs `current.props.onOk()` (approves, executes the tool server-side); `GotoShortcuts` matches `navKeyHint("/admin") === "a"` and **also** navigates to `/admin`. `s` rejects the call **and** navigates to `/settings`. `e.preventDefault()` does not stop a sibling `window` listener. No confirm, no undo, and the user is yanked off Today mid-decision. | LIES | Namespace the Today keys (or make `GotoShortcuts` skip a route that declares its own single-letter bindings); `a`/`s` on Today must not double as global nav. |
| 2 | `today.tsx:529, 619, 645, 663, 681, 698, 716, 737` and `_authenticated.approvals.tsx:147` | approve / send back / later / keep / drop / adopt / refresh brief | A failed decision says it failed | Every one of these nine mutations has `onError: (e: Error) => toast.success(e.message)`. A rejected approval, a failed spec save, a failed snooze all render as a **green success toast whose body is the error string**. `src/lib/notify.ts` exposes a real `toast.error`; it is simply not called. | LIES | Replace all nine with `toast.error(e.message)`. |
| 3 | `src/hooks/use-ask-stream.ts:517-525` + `src/components/mission/composer/GlobalComposer.tsx:56` (`enabled: open`) | Ask overlay (⌘J / ⌘K / the TopBar Ask button) | Closing the panel leaves the answer to finish | `enabled:false` runs `abortControllerRef.current.abort()`. Pressing Esc, clicking away, or hitting ⌘J again **kills the in-flight answer**. The partial assistant bubble stays in state, no toast, no "cancelled" line. Reopening shows a truncated answer with no explanation. This is the founder's "I typed, it vanished". | SILENT | Keep the stream alive while the conversation is open (abort only on unmount / explicit stop), and mark a cancelled answer in the thread. |
| 4 | `GlobalComposer.tsx:133-136` | Ask overlay answer area | The newest answer scrolls into view | `<div className="mb-2 flex max-h-[45vh] flex-col gap-3 overflow-y-auto">` has **no ref and no scroll effect**. The 2026-07-27 "scroll the Ask answer into view" fix landed only in `MissionShellView.tsx:238-252` (the room). On all ~68 AppShell routes - where the founder actually presses ⌘J - the second and later answers stream below the fold of a 45vh box that never moves. | SILENT | Port the `MissionShellView` scroll-into-view pair (`messageCount` effect + streaming near-bottom effect) into the overlay thread. |
| 5 | `src/components/supaprod/AppShell.tsx:845-857` | **`Search`  ⌘K** | A search box | `onClick` dispatches `supaprod:open-cmdk`. `CommandPalette.tsx:98` listens for it but the component has **zero importers**, so it is never mounted. `GlobalComposer.tsx:33` also listens (`OPEN_COMPOSER_EVENTS`) and opens the **Ask composer**. The one visible search door on ~68 routes opens a chat box. | LIES | Either mount the palette or relabel the control "Ask" and drop the ⌘K hint. |
| 6 | `src/components/discover/DiscoverSurface.tsx:162-163` | Discover `?tab=queue` | The ranked opportunity queue | `void tab; const activeTab = "signals" as "signals" \| "queue";` - the tab is **hardcoded**. Every `?tab=queue` arrival renders Signals. Knock-on: `/opportunities` (`_authenticated.opportunities.tsx:7`) and Today's `rerank_bets` insight action (`today.tsx:1357`) both promise the queue and deliver a signal feed. | LIES | Read the validated `tab` instead of discarding it, or delete the queue branch and repoint every `?tab=queue` link at `/decide`. |
| 7 | `DiscoverSurface.tsx:69-141` (`TabBar`), `:190-196` (`selectTab`), `:276-299` (queue branch), `:62` (`TABS` has one entry) | Discover tab row | Two tabs, arrow-key navigable | `TabBar` is **never rendered** anywhere in the file; `selectTab` is **never called**; the queue branch is unreachable because of #6. ~90 lines of tablist with roving tabindex, Home/End, and ARIA that no user can see. | DEAD | Delete `TabBar`, `TABS`, `selectTab` and the queue branch, or wire them. |
| 8 | `_authenticated.settings.tsx:2689-2721` (Settings → Agents → Roster) | Per-agent on/off switch, `role="switch"` with `aria-checked` | Toggling turns the agent off | `onClick` calls **only** `toast(...)`: "...stays on. Disabling agents is gated in Autonomy & approvals." The thumb never moves, `aria-checked` never changes. A switch that cannot switch, once per agent, 13 rows deep. | DEAD | Make it a read-only status pill with a link to Autonomy & approvals, or wire the enable/disable write. |
| 9 | `_authenticated.plan.spec.$id.tsx:365-386, 731-752` | AI `rewrite` / `expand` / `shorten` / `critique` | Rewrites the selection | The four buttons render on **every** tab (contract, projections, flow, launch), but `taRef.current` is null outside `mode === "edit"`. `mutationFn` falls back to `sel = body`, **makes a real paid model call**, then `onSuccess` hits `if (!ta) return;` and **discards the result**. No toast, no error, credits spent. | SILENT | Hide or disable the AI row unless `mode === "edit"`, and surface a result when `ta` is missing. |
| 10 | `_authenticated.ship.tsx:87-92` vs `:106-125` | Hero: "Every merged change gets a **preview**, a **promote**, and a receipt" | Preview and promote controls on Ship | The surface is three read-only panels (`ShipHistoryPanel`, `AnnouncementsPanel`, `ChangelogPanel`). **Zero `onClick`, zero `<Link>`, zero `navigate(` in the whole file.** Preview/promote live on `/build/$missionId` (`PreviewPanel`, `EngineRoomDisclosure`). Loop stage 06 in the rail is a dead end. | LIES | Either mount the promote gate on Ship or rewrite the hero to what the page actually shows, with a door to the mission that owns the gate. |
| 11 | `_authenticated.trust-ledger.tsx:13-18` → `_authenticated.engine-room.tsx:85-86` → `src/lib/engine-room-glance.ts:186-206` | Old Ledger deep links | The receipts / tamper-seal ledger | The stub sends `{ room: "record" }` with **no view**. `ROOM_TAB_META.record[0]` is `verify` ("What just happened"), not `receipts`. The comment at `engine-room-glance.ts:193-198` explicitly claims "/trust-ledger 301s to this room, so its old deep links land on this front tab" - receipts is **not** the front tab. | LIES | Send `{ room: "record", view: "receipts" }`. |
| 12 | `_authenticated.analytics.tsx:6` and `_authenticated.budgets.tsx:6` | `/analytics`, `/budgets` | Full usage rollup / budget caps | Both send bare `{ room: "spend" }`; the front tab is `trend` ("Over time"). `LEGACY_REDIRECTS` (`legacy-redirects.ts:192-193`) claims `view:"caps"` and `view:"usage"` - the map and the stubs disagree, and nothing tests it. | LIES | Add `view: "usage"` / `view: "caps"` to the stubs. |
| 13 | `src/lib/legacy-redirects.ts:201` | `"/governance": { to: "/engine-room", search: { room: "safety", view: "controls" } }` | `/governance` lands in the Safety room | **There is no `_authenticated.governance.tsx` route file.** `/governance` falls through to `AuthedNotFound` ("This page does not exist"). The "single source of truth" advertises a route that 404s. | DEAD | Add the stub or delete the map entry. |
| 14 | `src/lib/legacy-redirects.ts:136` + the module doc at `:100-103` | `"/product": { to: "/discover" }`; doc references "the route stub `src/routes/_authenticated.product.tsx`" | Signed-in `/product` folds to Discover | That file **does not exist**. `src/routes/product.tsx` is the **public marketing** page ("How Supaprod Builds Your Product", `ssr: true`). A signed-in user hitting `/product` gets the landing page with the landing nav, not Discover. | LIES | Delete the map entry and the doc paragraph, or add the authenticated stub. |
| 15 | `_authenticated.calendar.tsx:8-12`, `_authenticated.meetings.$id.tsx:7-9` | `/calendar?meeting=X`, `/meetings/X` | That meeting, open | Both forward `{ tab: "calendar", meeting: X }`. `brain.tsx:125-136` maps `calendar → decisions`; `meeting` is validated at `:360` and then **never read anywhere in `MemoryPage`**. The user lands on the Decisions ledger; the meeting id is silently dropped. The route comment at `brain.tsx:9-10` says meetings "live on Today's PM Desk now". | LIES | Point both stubs at wherever meetings actually render, or delete the `meeting` param from the chain. |
| 16 | `_authenticated.impact.tsx:11` | `/impact` | The impact ledger | Sends `{ tab: "insights" }` → `LEGACY_TABS.insights → "decisions"` → the user lands at the **top** of a three-section Decisions tab; `ImpactLedgerPanel` is the third section (`brain.tsx:633-636`) with no scroll anchor. Meanwhile a surface literally headed "Impact record" exists at `/learn` (`learn.tsx:116-121`). Same panel, two homes, and the redirect picks the unlabelled one. | LIES | Redirect `/impact` to `/learn`, or give Brain's section a scroll anchor the redirect targets. |
| 17 | `_authenticated.fleet.tsx:7` / `_authenticated.delegate.tsx:8` → `_authenticated.build.index.tsx:670` | `/fleet` → By Agent, `/delegate` → By Lane | The agent / lane lens | `const viewMode = hasCompletedMission ? (search.view ?? "missions") : "missions";` - on a workspace with no completed mission the lens **and its tab row** silently vanish and the user gets the Missions list with no message. The exact demo-day state. | SILENT | When `view` is requested but gated, say so ("By Agent appears after your first completed mission") instead of falling through. |
| 18 | `plan.spec.$id.tsx:345` (`useState<ModeTab>(initialTab ?? "contract")`) + `:650` (`onClick={() => setMode(m.id)}`) | CONTRACT / PROJECTIONS / EDIT / PREVIEW / FLOW / LAUNCH | A shareable, back-button-able tab | The tab is **local state**. The route declares `validateSearch` for `tab` (`:129-134`) and `/prds/$id` carefully forwards it (`_authenticated.prds.$id.tsx:20-25`), but the surface **never writes back to the URL**. After one click the address bar lies; back does not undo the tab; the link you copy is wrong. Also `/prds/$id` validates only `edit\|preview\|contract\|flow\|launch` (`:10`), so `?tab=projections` is silently dropped. | LIES | Drive `mode` from `Route.useSearch()` and `navigate({ search: prev => ({...prev, tab}) })`; add `projections` to the stub's whitelist. |
| 19 | `plan.spec.$id.tsx:568-588` (title input), `:915-938` (body textarea), `:674-692` (Save) | Spec title + body editor | Leaving warns about unsaved work | `title`/`body` are local state with an explicit `Save`. There is **no dirty flag, no beforeunload guard, no router blocker**. Clicking a crumb, a tab in the sticky bar that re-renders, or the AI assist on the wrong tab loses the edit with no prompt. Compare `WorkspaceBriefSection` (`settings.tsx:2994, 3052-3055`) which does track `dirty`. | SILENT | Track dirty and block navigation, or autosave. |
| 20 | `_authenticated.build.$missionId.tsx:620-646` + `:548-552` | Mission title `<h1 role="button">`, `title="Click to rename"` | A rename with confirmation | A single click on the page's `<h1>` swaps it for an input; `onBlur` commits (`commitTitleRename`, `:558-562`). `renameMut.onSuccess` is `() => invalidate()` - **no toast**. A stray click plus a click elsewhere renames the mission with no confirmation, no feedback, and no undo. | SILENT | Add an explicit edit affordance, a success toast, and Esc-to-cancel messaging (Esc works but is undiscoverable). |
| 21 | `settings.tsx:2139-2145, 2341-2349` | **`Remove`** on a BYO AI key | A confirm, then removal | `mDelKey` fires straight from `onClick` - **no `useConfirm`** (the file imports and uses it elsewhere, `:64`), and it has **no `onError` handler at all**. A failed delete is completely silent: no toast, the row stays, the user clicks again. Violates the repo's own destructive-actions convention. | SILENT | Add the destructive confirm and an `onError` toast. |
| 22 | `settings.tsx:1143-1146` | Credits → "Your selection" + `Buy N credits · $X` | The bundle you picked | `useState(() => BUNDLES.find(b => b.credits === 2500)?.key ?? BUNDLES[0]?.key ?? "")` - the lazy initializer runs **once, on mount, while `catalog` is still loading**, so `BUNDLES` is `[]` and `selectedKey` is `""` forever. `BundleGrid` therefore shows **no card selected**, while `selectedBundle` falls back to `BUNDLES[0]` (`:1146`) so the Buy button is armed for a bundle the user never chose. The intended 2500 default never applies. | LIES | Sync `selectedKey` to the catalog in an effect once bundles arrive. |
| 23 | `settings.tsx:2382-2432` (`AgentToolCap`) | "Tool reach" select per agent | Change the agent's blast-radius cap | `onChange={(e) => m.mutate(e.target.value)}` - an immediate write that changes what tools an agent may call, with **no confirm and no undo**, reported with a neutral `toast(...)` (not `toast.success`). A mis-scroll over the select changes agent permissions. | LIES | Confirm before widening reach; use `toast.success` / `toast.error`. |
| 24 | `_authenticated.admin.routing.tsx:54-63` | Routing policy bar | Confirmation that the policy changed | `policyMutation.onSuccess` only invalidates - **no toast**, unlike its sibling `pinMutation` (`:48`) which toasts "Routing setting updated." Changing the platform-wide routing policy looks like nothing happened. | SILENT | Add the success toast. |
| 25 | `_authenticated.admin.people.tsx:357-366, 538-541` | `GrantCreditsForm` submit | Grant/deduct credits | `onSubmit={(delta, reason) => grant.mutate({ delta, reason })}` - **no confirm**, while the sibling "Reset monthly cycle" (`:545-555`) and "Suspend sign-in" (`:606-620`) both confirm. The one money-moving control on the page is the one without a gate. | SILENT | Add `useConfirm` with the delta and the target user in the body. |
| 26 | `_authenticated.sync.tsx:340-353` | `Keep Supaprod version` / `Keep <provider> version` | An irreversible choice, confirmed | Both fire `mResolve.mutate` directly. Resolving a sync conflict **discards one side of a document permanently**; there is no confirm, no diff, and no undo. `Push and resolve` / `Pull and resolve` (`:360-385`) likewise write to an external tool (Google Docs, Notion, Linear) on one click. | LIES | Show what will be discarded and confirm before resolving. |
| 27 | `_authenticated.build.$missionId.tsx:678-681`; `_authenticated.design.tsx:48-51` | `Copy trace id`, `Copy link` | The value is on the clipboard | `void navigator.clipboard?.writeText(...); toast.success("... copied");` - the promise is not awaited and the optional chain swallows a missing clipboard. In a non-secure context or with permission denied the toast still says "copied". Contrast `sync.tsx:626-630`, which does it correctly with `.then(ok, fail)`. | LIES | Await the promise and toast on rejection. |
| 28 | `_authenticated.build.$missionId.tsx:257-266` | `lands in Releases →` | A "Releases" surface | Navigates to `/brain?tab=docs`. **The word "Releases" appears nowhere in the product.** The docs tab has "Ship history" and "Changelog" as sections 5 and 6 of 6, with no anchor - and `/ship` is the actual named home for both. | LIES | Point at `/ship` and label it "Ship history". |
| 29 | `today.tsx:1483-1488` | `Shipped` door, hint "outcomes and what they cost" | The ship record | Navigates to `/brain?tab=learnings`. Ship history lives on the **docs** tab (`brain.tsx:686-689`) and on `/ship`. The count shown is `lanesData.lane4.shipped_count`, so the number and the destination disagree. | LIES | Point at `/ship`. |
| 30 | `today.tsx:1344, 1361` (`onInsightOpen`, `onInsightAct` default) | Open a pushed insight | The insight | `navigate({ to: "/brain", search: { tab: "insights" } as never })` → `LEGACY_TABS.insights → "decisions"` → the top of the Decisions ledger. The `as never` cast is what lets the dead tab id compile. | LIES | Navigate to a tab that exists and carry the insight id. |
| 31 | `plan.spec.$id.tsx:1029-1058` → `_authenticated.discover.tsx:17-24` | Source-signal buttons under "Why this spec · source evidence" | Discover, focused on that signal | The button sends `{ tab: "signals", focus: s.id }`, but Discover's `validateSearch` returns **only** `tab` - `focus` is dropped at parse time, and `DiscoverSurface` never reads it (`useSearch` destructures `{ tab }` only). The code comment at `plan.spec.$id.tsx:1032-1034` admits the honoring "lands in the sibling W2-DISCOVER lane" - it never landed. | SILENT | Add `focus` to Discover's `validateSearch` and scroll/highlight the signal, or drop the param and make the row non-clickable. |
| 32 | `src/components/obsidian/AskPanel.tsx` (58 KB, 1400+ lines) | - | - | **Zero runtime importers.** Every hit is a test, a comment, or an extracted-from note (`use-ask-stream.ts:42`, `ask-stream-core.ts:2`, `ask-sse.ts:6`, `ask-thread.ts:2`). The live Ask is `GlobalComposer` + `ComposerOverlay` off-room and `MissionShell` + `Thread` in-room. Its 6-case test file still runs against dead code. | ORPHAN | Delete it (and its test) or restore it as the single Ask implementation. |
| 33 | `src/components/observe/TracesPanel.tsx` | - | - | **Zero importers.** `RecordRoom` does not use it; the only `TracesPanel` hit in the repo is its own `export function` line. | ORPHAN | Delete or mount in the Record room's `traces` view. |
| 34 | `today.tsx:16` (`ProductMasthead`), `:518-522` (`productContext`), `:48/469/489` (`listProjects`) | - | - | `ProductMasthead` is imported and **never rendered** (PC-32 block 2 was removed from the render tree). Its backing query `getProductContext` still fires on every Today load, as does `useQuery({queryKey:["projects"]})` whose result is never read. Two wasted round-trips per page view plus a dangling import. | ORPHAN | Delete the import and both dead queries, or re-mount the masthead. |
| 35 | `build.index.tsx:48` | - | - | Same pattern: `ProductMasthead` imported from `@/components/obsidian/ProductMasthead`, never rendered. (`PlanSurface.tsx:5` is the only surface that actually uses it.) | ORPHAN | Delete the import. |
| 36 | `src/components/mission/MissionShellView.tsx:368-371` | The 7-stage Spine | The loop rail where the loop is meaningful | *(given as confirmed)* `{/* the Spine. The whole loop, always. */}` with no condition. Correction for the record: `/settings`, `/approvals`, `/brain`, `/threads`, `/artifacts` render `RoomChromeShell` (`RoomChrome.tsx:224`), which has **no Spine** - the always-on Spine is confined to the loop room. The 2026-07-23 "room instrument only" ruling is violated inside the room, on stages the active journey does not touch. | ALWAYS-ON | Render only the active journey's slice, or gate on a journey being active. |
| 37 | `MissionShellView.tsx:373` | - | - | *(given as confirmed)* `gridTemplateColumns: "380px minmax(0, 1fr)"` - a hardcoded, non-responsive, non-resizable thread column. | ALWAYS-ON | Token or user-resizable width with a min/max. |
| 38 | `src/lib/nav-model.ts:72-146` rendered at `AppShell.tsx:879-890` | THE LOOP - 01 Discover · 02 Decide · 03 Plan · 04 Design · 05 Build · 06 Ship · 07 Learn | Stages relevant to what you are doing | The seven loop rows render on **every** AppShell route unconditionally - including `/sync`, `/traces/$traceId`, `/admin/*`, `/design`, `/engine-room`, where none of them is meaningful. This is the founder's "on every screen we have the top bar for those seven sections. Is it really required on every screen?" | ALWAYS-ON | Collapse the loop zone to the active stage plus a disclosure, or hide it on non-loop surfaces. |
| 39 | `AppShell.tsx:264-314`, rendered at `:1024` | Mobile bottom nav | The product's navigation on a phone | Five hardcoded destinations with **emoji glyphs** (`📌 🔍 📋 ⚡ 🧠`) against a design system that mandates lucide + Geist. Design, Decide, Ship, Learn, Engine Room, Settings and Admin are **unreachable on mobile** except through in-page links. The bar is `position: fixed` with no compensating bottom padding on `children`, so the last row of every page sits under it. | DEAD | Replace the emoji with lucide icons, cover the full destination set (or an overflow), and pad the content column. |
| 40 | `AppShell.tsx:216-218` | - | - | `function LoopRail({ children }) { return <div>{children}</div>; }` - a component whose entire body is a passthrough `<div>`, left behind when the connecting spine was removed (see its own doc comment at `:212-215`). | DEAD | Delete and inline. |
| 41 | `settings.tsx:468-504` (Settings → Workspace → **Memory**) | A nav entry named "Memory" | Memory settings | The section renders a card that says "Memory lives in Brain" with an "Open Brain →" link. A permanent nav row whose only content is a redirect notice. | DEAD | Remove the section id from `SETTINGS_GROUPS` and let `/settings?section=memory` normalize to Brain. |
| 42 | `approvals.tsx:189` | "One thing just came in. **Refresh to see it.**" | Manual refresh needed | The list refreshes itself: `RoomChromeShell` (`RoomChrome.tsx:237-241`) polls the **same** query key `["approvals","queue",activeWorkspaceId]` every 30 s, and the page shares it. The instruction is stale, and there is no refresh control next to it anyway. | LIES | Drop the instruction, or add an explicit refresh button. |
| 43 | `approvals.tsx:262-266` | `N more in other workspaces` | Click to see them | A plain `<p>`. Reads as a link, behaves as text; there is no way to get to those items other than switching workspace in a control on a different shell. | DEAD | Make it a workspace-switch affordance or drop the line. |
| 44 | `today.tsx:595-620, 653-664, 686-699, 703-717, 724-738` vs `approvals.tsx:127-152` | Approve / Send back - the same calls | One decision path | Today decides through five different server functions (`resolveApproval`, `savePrd`, `updateOpportunity`, `resolveAssumptionChallenge`, `decidePlaybookProposal`, `decideDesignGate`); `/approvals` decides the identical items through one (`decideApprovalItem`). Different toasts, different invalidation sets, different optimistic behaviour, two chances to drift. | DUPLICATE | Route Today's cards through `decideApprovalItem` too. |
| 45 | `_authenticated.decide.tsx:47` and `DiscoverSurface.tsx:298` | The ranked queue | One home | `OpportunityQueue` is mounted on both `/decide` (a real page) and Discover's queue branch. `discover.tsx:2-3` still claims "the `/decide` route 301-redirects here" - `/decide` has been a first-class 70-line surface since 2026-07-13. Stale comment plus a second (currently unreachable) mount. | DUPLICATE | Delete the Discover mount and fix the comment. |
| 46 | `settings.tsx:450, 1699, 1811-1821` and `:448-458` | Workspace bindings | One place to manage bindings | Bindings render three times: `WorkspaceBindingsSection` under `?section=sync`, `WorkspaceBindingsSummary` under `?section=connections`, and again in full on `/sync`. Two of the three carry their own "open /sync" link. | DUPLICATE | Keep the `/sync` home and one summary. |
| 47 | `settings.tsx:408` | Settings nav click | Stay where you are, change section | `setTab = (id) => navigate({ search: { section: id } })` builds a **fresh** search object, dropping `?connector=` and `?checkout=`. Landing from a Stripe return (`?checkout=success`) and clicking any nav row loses the state that drives the confirmation toast at `:559-569`. | SILENT | Use the functional updater and preserve siblings. |
| 48 | `plan.spec.$id.tsx:775-783` + `:848-851` | `Generate task graph`; empty state "Generate a graph from **the approved spec**" | The action requires an approved spec | The button is enabled on drafts and rejected specs alike; nothing checks `prd.status`. Either the copy is wrong or the button should be gated. | LIES | Gate on `status === "approved"` with an explaining title, or fix the copy. |
| 49 | `build.index.tsx:690-694` vs `:206` | Hero "Approved specs in, merged PRs out"; composer default | The screen is about specs → PRs | `const [mode, setMode] = useState<"ship" \| "goal">("goal")` - the composer opens in **goal** mode, so the first thing under a spec-to-PR hero is a free-text goal box. Two stories on one screen. | LIES | Pick one; if goal-first is right, rewrite the hero. |
| 50 | `build.$missionId.tsx:446` | Full execution log → `SessionTimeline` | Gates shown inline in the timeline | `<SessionTimeline runs={runs} steers={steers} approvals={[]} onChanged={...} />` - approvals is **hardcoded empty**, so `SessionTimeline.tsx:273` (`approvals.filter(a => a.status === "pending")`) is permanently empty. Gates are rendered separately at `:817-821`, so the timeline branch is dead code. | DEAD | Pass the real `approvals` or drop the prop. |
| 51 | `build.$missionId.tsx:584, 772` | Orchestrator (goal-run) missions | The same detail chrome as a build mission | `!isOrchestratorMission &&` gates the entire header (title, rename, cost, trace id, "the brief"), the `JourneyStrip`, **and** the five sub-tabs. A goal-run detail page has no title, no cost, no copyable trace, no tabs - and `?tab=` carried in from `/studio/$missionId` (`_authenticated.studio.$missionId.tsx:18-23`) is silently discarded. | SILENT | Give the orchestrator branch the shared header, or say why the tabs are absent. |
| 52 | `_authenticated.studio.$missionId.tsx:10-11` | `/studio/X?tab=preview` | The Preview tab | The stub whitelists only `changes \| pr \| cost`; the live route supports `changes \| pr \| preview \| cost \| receipts` (`build.$missionId.tsx:52-53`). `?tab=preview` and `?tab=receipts` are dropped and the user lands on Changes. | SILENT | Widen the stub's `TABS` to match. |
| 53 | `settings.tsx:1967-1973, 2047-2053` | "Adapter-ready (platform / enterprise key)" model options | Selectable models | Rendered as `<option ... disabled>` inside an optgroup. A list of models you can read and cannot pick, with no inline reason and no upgrade door next to them. | DEAD | Remove them, or add a one-line "requires an enterprise key" with the door. |
| 54 | `settings.tsx:3281-3307` + `src/hooks/use-avatar-choice.ts:12-35` | Avatar picker in Profile | An account setting saved with the form | `chooseAvatar(i)` writes `localStorage["supaprod:avatar"]` immediately and is **not part of the Profile form's Save**. The choice is device-local (documented in the hook, invisible in the UI): a demo on a second machine shows a different avatar, and the Save button below implies it was saved. | LIES | Persist to `profiles`, or label it "this device only". |
| 55 | `_authenticated.sync.tsx:148-166` | `/sync` page chrome | The same crumbs every work surface has | No `<TopBar>` at all - only a back-link to Settings. Every sibling work surface (`today`, `build`, `plan`, `design`, `ship`, `learn`, `discover`, `decide`, `engine-room`, `traces/$traceId`, `admin`) renders `<TopBar crumbs={...}>`. On `/sync` the breadcrumb strip simply disappears. | SILENT | Add the TopBar with `[workspace, Settings, Sync]`. |
| 56 | `_authenticated.engine-room.tsx:38, 57, 90` vs `MissionShellView.tsx:320`, `legacy-redirects.ts:182`, `traces.$traceId.tsx:28` | One destination, four names | A consistent name | The tab title is **"Pulse"**, the crumb is **"Pulse"**, the error copy is **"Could not open Pulse"**; the rail label is **"Pulse"** (`nav-model.ts:145`); the room top bar button is **"Under the hood"**; every redirect stub comment and the trace crumb say **"Engine Room"**; the trace page title is **"Activity"**; the URL is `/engine-room`. | LIES | Pick one name and apply it to label, crumb, title, and error copy. |
| 57 | `src/lib/legacy-redirects.ts:1-5` ("`legacy-redirects.test.ts` ... reads this map so there is exactly one place that names 'where did X go'") | - | A test keeps the map and the stubs in sync | **`src/routes/__tests__/legacy-redirects.test.ts` does not exist** (the directory contains only `integration.discover.test.tsx`). Nothing verifies the map, which is why findings 11-14 and the `/changelog`→`docs` vs `changelog`, `/impact`→`insights` vs `impact`, `/guardrails`→`rules` drifts all survive. | DEAD | Write the test, or delete the claim and demote the file to documentation. |
| 58 | `settings.tsx:2807-2815` (Agents → expand → Tool access) and `:2829-2836` (Knowledge & instructions → Per product) | "The per-tool grant matrix lands with the agent-access work." / "Per-product instructions ... are not wired yet." | - | Honest, but they are two permanent "not built" notices inside the agent detail a demo will open. Nothing is broken; it reads as unfinished. | DEAD | Hide the unbuilt slots until they exist. |
| 59 | `_authenticated.brain.tsx:106-136` + `:515` | Brain tab switch | Deep links survive a tab switch | `setTab = (next) => navigate({ search: { tab: next } })` builds a fresh object (documented, intentional), but combined with `LEGACY_TABS` folding ten historical ids onto four tabs, six distinct old destinations (`insights`, `impact`, `judgment`, `recall`, `calendar`, plus `brief`/`design`/`capabilities`) all land on the **top** of a multi-section tab with no anchor. Every one of those redirects "works" and none of them arrives. | LIES | Give each folded section an `id` and scroll to it from the mapped legacy tab. |

---

## 2. The 41 redirect stubs - verdicts

Verified against each stub's `beforeLoad`, the target route's `validateSearch`, and the target
surface's actual rendering. **8 of 41 do not honour the link's promise.**

| Stub | Sends | Lands on | Verdict |
| --- | --- | --- | --- |
| `/discovery` | `/discover?tab=signals` | Signals | OK |
| `/opportunities` | `/discover?tab=queue` | **Signals** (tab hardcoded) | **BROKEN** - #6 |
| `/product` | - | **the public marketing page** (no authed stub) | **BROKEN** - #14 |
| `/prds` | `/plan?view=specs` | Plan specs section | OK |
| `/prds/$id` | `/plan/spec/$id?tab=` | Spec editor; `projections` dropped | Partial - #18 |
| `/roadmap` | `/plan?view=roadmap` | Plan roadmap | OK |
| `/stakeholder` | `/plan?view=stakeholders` | Plan stakeholders | OK |
| `/knowledge` | `/brain` + all search | Brain | OK |
| `/memory` | `/brain?tab=memory` → `learnings` | Learnings tab | OK |
| `/docs` | `/brain?tab=docs` | Docs tab, top of 6 sections | Partial - #59 |
| `/outcome` | `/learn` | Learn | OK |
| `/calendar` | `/brain?tab=calendar&meeting=` | Decisions; **`meeting` dropped** | **BROKEN** - #15 |
| `/meetings` | `/brain?tab=calendar` | Decisions | **BROKEN** - #15 |
| `/meetings/$id` | `/brain?tab=calendar&meeting=$id` | Decisions; **id dropped** | **BROKEN** - #15 |
| `/impact` | `/brain?tab=insights` → `decisions` | Decisions top; the named "Impact record" is on `/learn` | **BROKEN** - #16 |
| `/changelog` | `/brain?tab=docs` (map says `changelog`) | Docs tab, section 5 of 6, no anchor | Partial - #59 |
| `/cockpit` | `/build` | Build | OK |
| `/missions` | `/build` | Build | OK |
| `/missions/$missionId` | `/build/$missionId` | Mission detail (headerless if orchestrator) | Partial - #51 |
| `/fleet` | `/build?view=agent` | **Missions** until a mission completes | **BROKEN** - #17 |
| `/delegate` | `/build?view=lane` | **Missions** until a mission completes | **BROKEN** - #17 |
| `/studio` | `/build` | Build | OK |
| `/studio/$missionId` | `/build/$missionId?tab=` | `preview`/`receipts` dropped | Partial - #52 |
| `/tasks` | `/today` | Today | OK |
| `/inbox` | `/today` | Today | OK |
| `/chat` | `/today` | Today (Ask is ⌘J) | OK |
| `/govern` | `/engine-room?room=&view=` per 14-way map | Correct room + view | OK |
| `/agents` | `?room=safety&view=team` | Who can act | OK |
| `/swarm` | `?room=safety&view=team` | Who can act | OK |
| `/evals` | `?room=quality&view=suites` | What we test | OK |
| `/eval-health` | `?room=quality&view=score` | Right now | OK |
| `/drift` | `?room=quality&view=drift` | Is it slipping | OK |
| `/guardrails` | `?room=safety` (no view) | `rules` is the front tab - correct by luck | OK |
| `/budgets` | `?room=spend` (map says `caps`) | **Over time**, not Limits | **BROKEN** - #12 |
| `/analytics` | `?room=spend` (map says `usage`) | **Over time**, not Full usage | **BROKEN** - #12 |
| `/observe` | glance, or `?tab=` → room+view | Correct | OK |
| `/prompts` | `?room=quality&view=prompts` | Its instructions | OK |
| `/governance` | *(map entry only)* | **404 - no route file** | **BROKEN** - #13 |
| `/trust-ledger` | `?room=record` (no view) | **What just happened**, not the ledger | **BROKEN** - #11 |
| `/traces` (index only) | `?room=record&view=traces` | Every run | OK |
| `/notifications` | `/settings?section=notifications` | Notifications | OK |
| `/briefing` | `/settings?section=brief` → `workspace` | Brief & voice, scrolled + highlighted (`settings.tsx:441, 2849-2853`) | OK |
| `/integrations` | `/settings?section=interop` | Agent access | OK |

---

## 3. Cross-cutting flags

**Always visible, only sometimes meaningful**
- The seven loop rows on every AppShell route (#38) - the founder's own question.
- The Spine on every room render regardless of journey (#36).
- The `Ask ⌘J` button in both TopBars and the `Search ⌘K` button in the rail - three doors, one overlay (#5).
- Every Settings section's nav row is always present including the pure-redirect "Memory" row (#41).

**Duplicated affordances**
- Today vs `/approvals` decide the same items through different server functions (#44).
- `OpportunityQueue` on `/decide` and (unreachably) on Discover (#45).
- Workspace bindings in three places (#46).
- `ImpactLedgerPanel` on `/learn` and inside Brain's Decisions tab (#16).
- `ShipHistoryPanel` + `ChangelogPanel` + `AnnouncementsPanel` on `/ship` **and** in Brain's Docs tab.
- ⌘K and ⌘J both toggle the same overlay, so ⌘K mid-answer closes it and aborts the stream (#3, #5).

**Data changed with no confirmation and no undo**
| Control | File · line |
| --- | --- |
| `a` / `s` on Today - approve, executes the tool server-side | `today.tsx:1080-1086` |
| `a` / `r` on Approvals | `approvals.tsx:172-177` |
| Remove BYO AI key | `settings.tsx:2346` |
| Agent tool-reach cap | `settings.tsx:2410` |
| Mission rename on blur | `build.$missionId.tsx:593` |
| Sync conflict resolve / push / pull | `sync.tsx:343, 350, 363, 376, 519, 533` |
| Prototype make public / private | `design.tsx:84` |
| Admin grant credits | `admin.people.tsx:540` |
| Avatar choice | `settings.tsx:3288` |

Correctly gated for contrast: workspace delete (typed confirm, `AppShell.tsx:588-594`), mission
delete (`build.index.tsx:962-986`), playbook dismiss (`today.tsx:739-748`), charging toggle
(`admin.index.tsx:123-134`), subscription cancel (`settings.tsx:619-631`), token rotate/revoke
(`sync.tsx:748, 768`).

---

## 4. Corrections to the brief

- **The Spine does not render on Brain, Threads, Artifacts, Settings or Approvals.** Those five
  use `RoomChromeShell` (`RoomChrome.tsx:224-282`), which renders `RoomTopBar` and nothing else.
  The always-on Spine is real but confined to the loop room (`MissionShellView`). Finding #36.
- **`/briefing` is not broken.** `?section=brief` resolves through `LEGACY_SECTION_MAP`
  (`src/lib/settings-sections.ts:130`) to `workspace`, and `settings.tsx:441` passes
  `scrollToBrief` so the brief card scrolls into view with an ember ring. It works.
- **`/calendar` and `/meetings/$id` do not fold to a Decisions *tab* by design** - they fold to
  `calendar`, which `LEGACY_TABS` maps to `decisions`. The `?meeting=` drop is confirmed.
- **`/impact`'s panel is on Brain's Decisions tab**, not missing - but its *named* home
  ("Impact record") is `/learn`, so the redirect still lands on the wrong surface. Finding #16.
- **`CommandPalette.tsx` is not entirely dead**: its `GotoShortcuts` export **is** mounted
  (`_authenticated.tsx:4, 193`) and is half of finding #1. Only the palette dialog itself is
  unreachable.
