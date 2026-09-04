# FINAL click register - the deciding audit

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Consolidated 2026-07-28 from `clicks-a-chrome.md` (44), `clicks-b-surfaces.md` (59),
> `clicks-c-conversation.md` (24). Raw 127 → **118 after dedup** (9 merges).
> Every claim below was re-verified at source. Schema claims were re-verified against the
> **live production database** via PostgREST, not against migrations.

---

## Scorecard

| Class | Count | What it means |
| --- | --- | --- |
| **LIES** | **41** | The control is present, the label/hint promises X, the handler does Y |
| **DEAD** | **34** | Present and clickable, does nothing - or renders but is unreachable |
| **SILENT** | **25** | The action happens (or fails) with no feedback the user can perceive |
| **ORPHAN** | **18** | A whole component with zero runtime importers, mounted nowhere |
| **WORKS** | **18** | Verified correct - the patterns to copy during the rebuild |
| **Total findings** | **118** | |

Blunt version: **100 of the 118 findings are a control that is present and does not behave.**
The app has 76 authenticated route files, **42 of which are pure `throw redirect` stubs**, and
**8 of the 41 redirect promises land somewhere other than what the link says.**

Two counts the source audits got wrong, corrected here:
- `toast.success(e.message)` appears at **18 sites across 8 files**, not 11. Full list in L-02.
- `AskPanel.tsx` has **zero** runtime importers. All 3 apparent hits are comments.

---

## 1. The demo path, worst first

Ranked by probability of being hit during: sign in → land → a gate needs you → approve →
agents work → an artifact appears → it ships → the brain records it.

| Rank | ID | Finding | Class | Step it breaks |
| --- | --- | --- | --- | --- |
| 1 | **D-01** | Ask shows no text and no chats, on every surface, for every user | DEAD | any moment you press ⌘J |
| 2 | **D-02** | Every send mints a brand-new conversation row | DEAD | the whole conversation |
| 3 | **D-03** | `/threads` renders raw markdown source (`## Heading`, `**bold**`) | LIES | "open the thread" |
| 4 | **D-04** | `/threads` shows `No threads match ""` with an empty search box | DEAD | "open the thread" |
| 5 | **D-05** | The room's Ask overlay throws away the box you typed into | LIES | ask anything in the room |
| 6 | **D-06** | `1` on a gate card labelled `Approve and run [1]` jumps the Canvas to Discover | LIES | **approve** |
| 7 | **D-07** | 18 failure handlers render a green success toast | LIES | any failure, on camera |
| 8 | **D-08** | `a` on Today approves **and** navigates to `/admin` | LIES | **approve** |
| 9 | **D-09** | Snooze / Send back report "turns on with the next release" on any error | LIES | **approve** |
| 10 | **D-10** | A banner drops the room's composer below the fold | DEAD | land |
| 11 | **D-11** | `/ship` has zero clickable controls under a hero promising preview + promote | LIES | **it ships** |
| 12 | **D-12** | The Spine renders 7 identical gray dots on a new/empty product | DEAD | land |
| 13 | **D-13** | The overlay answer never scrolls; 2nd+ answers stream below the fold | SILENT | ask anything off-room |
| 14 | **D-14** | Esc / ⌘J aborts the in-flight answer, silently and mid-sentence | SILENT | ask anything |
| 15 | **D-15** | `/fleet` and `/delegate` lens silently vanishes until a mission completes | SILENT | **agents work** |
| 16 | **D-16** | Scrolling up to re-read yanks you back to the bottom | SILENT | read the answer |
| 17 | **D-17** | Mission title renames on a stray click + blur, no confirm, no toast | SILENT | **artifact appears** |
| 18 | **D-18** | Today's `Shipped` door goes to `/brain?tab=learnings`; ship history is on `docs` and `/ship` | LIES | **it ships** |
| 19 | **D-19** | `/impact`, `insights`, `changelog` all land at the top of an unanchored multi-section tab | LIES | **the brain records it** |
| 20 | **D-20** | The rail button labelled `Search ⌘K` opens a chat box | LIES | land |
| 21 | **D-21** | Discover `?tab=queue` is hardcoded to Signals | LIES | discovery |
| 22 | **D-22** | Mobile `Brain` tab unmounts the tab bar that was just tapped | LIES | any phone demo |

---

## 2. The full register

### LIES - 41

| ID | File · line | Label | Expect | Actual | Fix |
| --- | --- | --- | --- | --- | --- |
| L-01 | `src/components/mission/primitives/GateChip.tsx:173,186,195,222` + `MissionShell.tsx:432-451` | `Approve and run [1]` · `Send back [2]` · `Decline [3]` · `Open the evidence [⏎]` | `1` approves the gate on screen | The room binds bare digits to the Spine: `const idx = Number(e.key) - 1; onStageChange(SPINE_STAGES[idx].id)`. `1` navigates the Canvas to **01 Discover**. `⏎` does nothing. The keys only work inside `ApprovalsTray` (which sets `aria-modal` and suppresses the Spine handler). **Verified at source.** | Render the `Kbd` hints only when a `keysActive` prop is true; pass it from `ApprovalsTray` and nowhere else |
| L-02 | 18 sites, 8 files (below) | approve · send back · later · keep · drop · adopt · refresh brief · create task · capture · focus · mission actions · strategic brief | A failed action says it failed | `onError: (e: Error) => toast.success(e.message)`. Failures render as **green success toasts whose body is the error string**. `toast.error` exists and is simply not called. Compounded by `src/lib/notify.ts:71-74`, which **holds** non-critical success toasts during a focus block - so in Flow mode a failed approval produces *no output at all* | Replace all 18 with `toast.error(e.message)` |
| L-03 | `MissionShell.tsx:598-602` (no `children`) vs `GlobalComposer.tsx:133-151` | Room `Ask` / ⌘J | You type in the box and the answer appears there | Room passes `{...composerSurface}` with **no children**, so the overlay renders only an input. `submitIntent` fires then `setOverlayOpen(false)`. The box vanishes, the draft is cleared, the answer streams into the 380px rail below the day divider, the Briefing card and up to 3 gate cards. Off-room the *same* overlay renders the thread. One control, two behaviours. **Verified at source.** | Pass the same `ThreadMessage` list into the room's `ComposerOverlay`, or keep the overlay open while the answer streams |
| L-04 | `today.tsx:1071-1090` + `CommandPalette.tsx:419-452` | `A approves · S sends back` (`today.tsx:235`) | `a` approves the featured call | **Two window listeners fire.** Today's handler runs `current.props.onOk()` (approves, executes the tool server-side); `GotoShortcuts` matches `navKeyHint("/admin") === "a"` and **also** navigates to `/admin`. `s` rejects **and** navigates to `/settings`. `e.preventDefault()` does not stop a sibling `window` listener. **Verified at source, both handlers read.** | Namespace Today's keys, or make `GotoShortcuts` skip a route that declares its own single-letter bindings |
| L-05 | `MissionShell.tsx:232, 261` | `"Snooze is not live yet. It turns on with the next release."` / `"Send back turns on with the next release."` | An honest not-yet-shipped notice | Both server fns exist and are wired (`snoozeApprovalItem` writes `snoozed_until`; `sendBackApprovalItem`). These are the mutations' generic `onError` handlers, so **any** failure tells the user a shipped feature does not exist - after `onMutate` already removed the row | Use the real error text, styled as an error |
| L-06 | `ThreadsSurface.tsx` `createFolderMut.onError` / move-to-folder `onError` | `"Move to folder turns on with the next release."` / `"Folders turn on with the next release."` | An honest notice | `conversations.folder_id` and `conversation_folders` **both exist live** (verified: `200 []`). Any genuine failure now reports a lie | Surface the real error |
| L-07 | `AppShell.tsx:844-857` → `GlobalComposer.tsx:64-84` | Rail button **`Search`** with a `⌘K` badge | A search palette | Dispatches `supaprod:open-cmdk`. `CommandPalette.tsx` (454 lines, the actual search UI) has **zero importers**, so the only listener left is `GlobalComposer`, which opens a dialog whose accessible name is `aria-label="Ask Supaprod"`. A screen-reader user clicks "Search" and lands in "Ask Supaprod" | Relabel "Ask", or mount `CommandPalette` and give it back ⌘K |
| L-08 | `threads.functions.ts:138-143` vs `conversations.functions.ts:28`; `ThreadsSurface.tsx:303,309` vs `Thread.tsx:281-350` | Reading a thread in `/threads` | The same conversation, rendered the same way | Five divergences: 4 columns vs 7; asc vs desc-reversed; limit 200 vs 80; `/threads` renders `<div className="whitespace-pre-wrap">{m.content}</div>` - **raw markdown source** - while the composer renders `<ChatMarkdown>`; `/threads` labels the assistant **"Agent"**, the composer **"Supaprod"**. **Verified at source.** This is the founder's "if you open the thread, it's not properly designed" | One read function, `ChatMarkdown`, one speaker label |
| L-09 | `ship.tsx:87-92` vs `:106-125` | Hero: "Every merged change gets a **preview**, a **promote**, and a receipt" | Preview and promote controls | Three read-only panels. **Zero `onClick`, zero `<Link>`, zero `navigate(` in the whole file.** Preview/promote live on `/build/$missionId`. Loop stage 06 is a dead end | Mount the promote gate on Ship, or rewrite the hero and add a door to the mission that owns the gate |
| L-10 | `DiscoverSurface.tsx:162-163` | Discover `?tab=queue` | The ranked opportunity queue | `void tab; const activeTab = "signals" as ...` - **hardcoded**. Every `?tab=queue` renders Signals. `/opportunities` and Today's `rerank_bets` action both promise the queue and deliver a signal feed | Read the validated `tab`, or repoint every `?tab=queue` link at `/decide` |
| L-11 | `today.tsx:1483-1488` | `Shipped` door, "outcomes and what they cost" | The ship record | → `/brain?tab=learnings`. Ship history is on the **docs** tab and on `/ship`. The count is `lanesData.lane4.shipped_count`, so number and destination disagree | Point at `/ship` |
| L-12 | `build.$missionId.tsx:257-266` | `lands in Releases →` | A "Releases" surface | → `/brain?tab=docs`. **The word "Releases" appears nowhere in the product.** Docs has "Ship history" and "Changelog" as sections 5 and 6 of 6, no anchor | Point at `/ship`, label it "Ship history" |
| L-13 | `today.tsx:1344, 1361` | Open a pushed insight | The insight | `navigate({to:"/brain", search:{tab:"insights"} as never})` → `LEGACY_TABS.insights → "decisions"` → top of the Decisions ledger. The `as never` cast is what lets the dead tab id compile | Navigate to a tab that exists, carry the insight id |
| L-14 | `brain.tsx:106-136, 515` | Brain tab switch | Deep links survive | `LEGACY_TABS` folds ten historical ids onto four tabs; six distinct old destinations (`insights`, `impact`, `judgment`, `recall`, `calendar`, `brief`/`design`/`capabilities`) land at the **top** of a multi-section tab with no anchor. Every redirect "works"; none arrives | Give each folded section an `id` and scroll to it |
| L-15 | `impact.tsx:11` | `/impact` | The impact ledger | → Decisions top; `ImpactLedgerPanel` is section 3 with no anchor. A surface literally headed "Impact record" exists at `/learn` | Redirect `/impact` to `/learn` |
| L-16 | `calendar.tsx:8-12`, `meetings.$id.tsx:7-9` | `/calendar?meeting=X`, `/meetings/X` | That meeting, open | Both forward `{tab:"calendar", meeting:X}`. `brain.tsx` maps `calendar → decisions`; `meeting` is validated then **never read**. The id is silently dropped | Point at wherever meetings render, or drop the param |
| L-17 | `trust-ledger.tsx:13-18` → `engine-room-glance.ts:186-206` | Ledger deep links | The receipts / tamper-seal ledger | Sends `{room:"record"}` with **no view**; the front tab is `verify`. The comment explicitly claims receipts is the front tab. It is not | Send `{room:"record", view:"receipts"}` |
| L-18 | `analytics.tsx:6`, `budgets.tsx:6` | `/analytics`, `/budgets` | Usage rollup / budget caps | Both send bare `{room:"spend"}`; the front tab is `trend`. `legacy-redirects.ts:192-193` claims `view:"caps"`/`"usage"` - map and stubs disagree, nothing tests it | Add the `view` to the stubs |
| L-19 | `legacy-redirects.ts:136` + doc `:100-103` | `"/product": {to:"/discover"}` | Signed-in `/product` folds to Discover | `_authenticated.product.tsx` **does not exist**. `src/routes/product.tsx` is the **public marketing page**. A signed-in user gets the landing page with landing nav | Delete the entry, or add the authed stub |
| L-20 | `RoomChrome.tsx:56-131` + `MissionShellView.tsx:120-201` | Switcher pill `Helio Labs / Relay ▾` | Switch workspace **and** product | Dropdown lists `products` only (`aria-label="Products"`). No workspace row, no "New product/workspace". The workspace switch is three clicks deep in `AccountMenu`, and only renders when `workspaces.length > 1` - a single-workspace user has no workspace concept in the room at all | Show workspaces in the switcher, or shorten the label |
| L-21 | `threads.tsx:27`, `artifacts.tsx:22` | `Mission Control` door with `aria-current="page"` | The lit door is where you are | `<RoomChromeShell activeDoor="mission">` on both. Standing on `/threads`, the chrome insists you are in Mission Control; clicking the lit door navigates you away. There is no `Threads`/`Artifacts` door in `RoomTopBar` at all | Add the door ids, or stop lighting a door you are not on |
| L-22 | `AppShell.tsx:264-314` + `:680` | Mobile bottom nav `📌 🔍 📋 ⚡ 🧠` | Five tabs, same shell | `Brain` → `/brain`, classified as a reimagined surface, so `AppShell` **and the tab bar itself** unmount. Only 5 of 12 destinations reachable on mobile. Emoji glyphs violate the design contract. `position: fixed` with no compensating bottom padding, so the last row of every page sits under it | Drop `Brain` (or mount the bar in `RoomChromeShell`), lucide icons, pad the content column |
| L-23 | `AppShell.tsx:944-952` + `nav-model.ts:184-185` + `CommandPalette.tsx:441-444` | Rail hides `Admin console` for non-admins | A hidden destination is not reachable by shortcut | `GotoShortcuts` iterates `[...PRIMARY_NAV, ...FOOTER_NAV]` with **no role check**, so a non-admin pressing `a` lands on `/admin`. `a` is a common letter. **Verified at source.** | Gate the `a` binding on `amIAdmin` |
| L-24 | `ApprovalsTray.tsx:106-117, 215` | Footer `[1] Approve [2] Send back [3] Decline [H] Snooze` | The card you are looking at gets decided | `onMouseEnter={() => onFocusChange(item.id)}` on every card - focus follows the mouse. Move the pointer across the list, press `1`, approve whatever the cursor last crossed. No confirm, no undo; `decideApprovalItem` is a real write | Drop hover-to-focus, or gate the keys behind explicit focus |
| L-25 | `approvals.tsx:156-182` | **No keyboard hint whatsoever** | Typing does not change data | A single bare `a` **approves** the focused approval; `r` rejects. No confirmation, no undo, no on-screen hint, no visible focus until `focusedId` is set. **Verified at source.** | Require a modifier or focus-then-confirm; render the hints |
| L-26 | `ApprovalsTray.tsx:106-121` vs `approvals.tsx:163-178` vs `GateChip.tsx:173-224` | Three keyboard grammars for one action | One way to approve | Tray `1/2/3/H/J/K/⏎` with hints · `/approvals` `a/r/j/k` with **no hints** · `GateChip` hints for `1/2/3/H/⏎` on every instance including where unbound. A demo touching both surfaces teaches two contradictory things | Pick the tray's grammar, bind it on `/approvals`, render hints only where bound |
| L-27 | `Thread.tsx:152,154` vs `ApprovalsTray.tsx:239-245` | Inline gate `Send back` / `Open the evidence` | The same thing the tray's buttons do | In the Thread both are `onOpenApprovals` = `navigate({to:"/approvals"})` - leaves the room, no note prompt. In the tray, `Send back` opens a `prompt()` and calls `sendBackApprovalItem`; `Open the evidence` moves the Canvas. Identical labels, identical styling, three different behaviours | Wire the Thread's `InlineGate` to the tray's handlers |
| L-28 | `ApprovalsTray.tsx:118-121, 296` + `MissionShell.tsx:610-613` | `[⏎] Evidence` / `Open the evidence [⏎]` | The gate's evidence opens | `onStageChange(GATE_TO_STAGE[...]); onTrayChange(false);` - changes `?stage=` and **closes the tray**. Whether the stage face shows evidence for that gate is established nowhere; the gate is simply gone. The receipt chip is labelled with the *project name* and fires the same handler | Expand the gate into the Canvas, or relabel "Open the stage" |
| L-29 | `today.tsx:595-738` vs `approvals.tsx:127-152` | Approve / Send back - the same calls | One decision path | Today decides through six server fns (`resolveApproval`, `savePrd`, `updateOpportunity`, `resolveAssumptionChallenge`, `decidePlaybookProposal`, `decideDesignGate`); `/approvals` decides identical items through one (`decideApprovalItem`). Different toasts, invalidation sets, optimistic behaviour | Route Today's cards through `decideApprovalItem` |
| L-30 | `plan.spec.$id.tsx:345, 650` | CONTRACT / PROJECTIONS / EDIT / PREVIEW / FLOW / LAUNCH | A shareable, back-button-able tab | The tab is **local state**. The route declares `validateSearch` for `tab` and `/prds/$id` forwards it, but the surface **never writes back to the URL**. After one click the address bar lies; back does not undo; the copied link is wrong. `/prds/$id` also drops `?tab=projections` | Drive `mode` from `Route.useSearch()`; add `projections` to the stub whitelist |
| L-31 | `plan.spec.$id.tsx:775-783, 848-851` | `Generate task graph`; empty state "from **the approved spec**" | The action requires an approved spec | Enabled on drafts and rejected specs alike; nothing checks `prd.status` | Gate on `status === "approved"`, or fix the copy |
| L-32 | `build.index.tsx:690-694` vs `:206` | Hero "Approved specs in, merged PRs out" | The screen is about specs → PRs | `useState<"ship"\|"goal">("goal")` - the composer opens in **goal** mode, so the first thing under a spec-to-PR hero is a free-text goal box. Two stories on one screen | Pick one; if goal-first is right, rewrite the hero |
| L-33 | `settings.tsx:1143-1146` | Credits → "Your selection" + `Buy N credits · $X` | The bundle you picked | The lazy initializer runs **once on mount while `catalog` is loading**, so `BUNDLES` is `[]` and `selectedKey` is `""` forever. No card shows selected, while `selectedBundle` falls back to `BUNDLES[0]` - **the Buy button is armed for a bundle the user never chose** | Sync `selectedKey` in an effect once bundles arrive |
| L-34 | `settings.tsx:2382-2432` | "Tool reach" select per agent | Change the agent's blast radius | Immediate write, **no confirm, no undo**, reported with a neutral `toast(...)`. A mis-scroll over the select changes agent permissions | Confirm before widening reach |
| L-35 | `settings.tsx:3281-3307` + `use-avatar-choice.ts:12-35` | Avatar picker in Profile | An account setting saved with the form | Writes `localStorage["supaprod:avatar"]` immediately, **not part of the Profile form's Save**. Device-local. A demo on a second machine shows a different avatar; the Save button below implies it was saved | Persist to `profiles`, or label it "this device only" |
| L-36 | `sync.tsx:340-353` | `Keep Supaprod version` / `Keep <provider> version` | An irreversible choice, confirmed | Both fire `mResolve.mutate` directly. Resolving **discards one side of a document permanently**; no confirm, no diff, no undo. `Push and resolve` / `Pull and resolve` likewise write to Google Docs / Notion / Linear on one click | Show what will be discarded, then confirm |
| L-37 | `build.$missionId.tsx:678-681`; `design.tsx:48-51` | `Copy trace id`, `Copy link` | The value is on the clipboard | `void navigator.clipboard?.writeText(...); toast.success("... copied")` - promise not awaited, optional chain swallows a missing clipboard. In a non-secure context the toast still says "copied". `sync.tsx:626-630` does it correctly | Await and toast on rejection |
| L-38 | `approvals.tsx:189` | "One thing just came in. **Refresh to see it.**" | Manual refresh needed | The list refreshes itself - `RoomChrome.tsx:237-241` polls the same query key every 30s and the page shares it. There is no refresh control next to the instruction anyway | Drop the instruction |
| L-39 | `MachineViewToggle.tsx:3-6` + `MachineViewContainer.tsx` | Comment: *"Placed top-right on every page (landing header + authenticated TopBar)"* | A HUMAN/MACHINE toggle in the app | Imported by `LandingFooter.tsx` and `routes/index.tsx` only - **never by `TopBar`**. Machine view is enterable only by URL or landing-page `sessionStorage`. `MachineViewContainer` wraps `AppShell` only, so `?view=machine` on the room/Brain/Settings/Approvals/Threads/Artifacts silently renders normal UI - while `AppShell.tsx:510-519` advertises `/brain` as machine-readable | Mount it in both TopBars and wrap `RoomChromeShell`, or delete the claim |
| L-40 | `AppShell.tsx:52-63, 465-519` | Comments + machine-readable output | Match the product | The rail comment describes **six** loop stages and names the zone `Memory · Engine Room`; the real model is **seven** stages plus `Brain · Pulse`. `PAGE_DESCRIPTIONS` has no entry for `/design`, `/approvals`, `/threads`, `/artifacts`, `/admin`, so `?view=machine` emits the generic fallback while the route table claims `/design` is documented | Derive both from `PRIMARY_NAV` |
| L-41 | `engine-room.tsx:38,57,90` vs `MissionShellView.tsx:320`, `legacy-redirects.ts:182`, `traces.$traceId.tsx:28` | One destination, four names | A consistent name | Tab title **"Pulse"**, crumb **"Pulse"**, error **"Could not open Pulse"**, rail label **"Pulse"**, room button **"Under the hood"**, every redirect comment + trace crumb **"Engine Room"**, trace page title **"Activity"**, URL `/engine-room` | Pick one name |

**L-02, the 18 sites in full:** `today.tsx:529, 619, 645, 663, 681, 698, 716, 737` ·
`approvals.tsx:147` · `FocusDock.tsx:159` · `today/desk/TasksCard.tsx:81, 112` ·
`today/desk/CaptureCard.tsx:45` · `today/desk/FocusCard.tsx:148` ·
`obsidian/MissionSlideOver.tsx:122, 135` · `obsidian/today/StrategicBriefCard.tsx:67, 73`.

---

### DEAD - 34

| ID | File · line | Control | Actual | Fix |
| --- | --- | --- | --- | --- |
| **X-01** | `conversations.functions.ts:28` | Ask history hydration | `.select("id,role,content,model,created_at,mission_id,metadata")` - **both trailing columns are absent from the live database** (42703, verified). `if (msgRes.error) throw` fires **every call, every user, every conversation**. `hydration.error`/`isError` is read **nowhere**. Falls through to the empty state | Drop `,mission_id,metadata` from the select |
| **X-02** | `use-ask-stream.ts:195-220` | (send, any Ask input) | `try { fetchQuery(getConversation) } catch { }` then `fCreate({data:{}})`. X-01 makes the fetch always reject, so **every question mints a new `conversations` row** and overwrites the stored id. This is why `/threads` fills with one-exchange stubs | Fixed by X-01; separately distinguish "not found" from "read failed" |
| **X-03** | `ThreadsSurface.tsx:334, 404, 594-596` | `/threads` "This product" scope | `conversations.product_id` is **never written by any code path** (`createConversation` inserts only `user_id, title, model, project_id`; verified across all 18 `from("conversations")` sites). Default scope is `"product"`, so with an active product selected - the demo state - every thread is filtered out and the component renders the literal string **`No threads match ""`** with an empty search box | Stamp `product_id` on create, or default the scope to `"all"`; fix the copy |
| **X-04** | `chat.ts:623-630` | Mission reply persistence | `await msgInsert.insert({... mission_id: mission.id ...})` - absent column, and **the `{error}` is discarded** (no error check, unlike every other insert in the file). The mission reply is never saved; reload loses it and `/threads` shows only the user's question | Drop `mission_id`, check the error |
| **X-05** | `chat.ts:1091-1109` | Answer meta + typed blocks | `insert({...row, metadata: persistedMeta})` always errors, logs, re-inserts without. Every answer permanently loses model / latency / cost / sources and its blocks. The file contradicts itself: `:85-86` says metadata is not persisted, `:1077` says it survives reloads. The database settles it | Apply the migration, or delete the false comments and the dead fallback |
| **X-06** | `MissionShellView.tsx:368-371` | The 7-stage Spine | `{/* the Spine. The whole loop, always. */}` with **no condition**. `loopStages` is `loopState?.stages ?? []`, so while loading, on error, and on a new empty product `resolveLoopState` fabricates seven `quiet` nodes - seven identical gray dots plus a caption about a loop that has never run. Contradicts the 2026-07-23 room-instrument-only ruling | Render only when `loopStages.length > 0`; collapse to a one-line summary when nothing is active |
| **X-07** | `MissionShellView.tsx:373` | The room's two-column body | `gridTemplateColumns: "380px minmax(0, 1fr)"` - hardcoded, no breakpoint, no min-width guard, not resizable. At 1024px the Canvas gets 644px; below ~800px it is unusable with no fallback | `minmax(320px, 30%) minmax(0, 1fr)`, stack below `lg` |
| **X-08** | `nav-model.ts:72-146` at `AppShell.tsx:879-890` | THE LOOP - 7 rows | Render on **every** AppShell route unconditionally, including `/sync`, `/traces/$traceId`, `/admin/*`, `/design`, `/engine-room`, where none is meaningful. **This is the founder's literal question** | Collapse to the active stage plus a disclosure; hide on non-loop surfaces |
| X-09 | `_authenticated.tsx:191-192` vs `RoomChrome.tsx:270` / `MissionShellView.tsx:255` | Backend-health + billing banners | Render as siblings **above** a `h-dvh` shell, so any banner pushes a full-viewport element down by its own height - document-level scrollbar, and the docked Composer drops below the fold. They also use Obsidian tokens on an ink canvas | Move inside each shell's flex column; retokenize |
| X-10 | `use-confirm.tsx:99-142` + `alert-dialog.tsx:34` + `CommandPalette.tsx:430-435` / `MissionShell.tsx:437-442` | The `Leave "X"?` / `Delete "X"?` confirm | The guard is `[role="dialog"][data-state="open"], [role="dialog"][aria-modal="true"]`. Radix `AlertDialog.Content` renders **`role="alertdialog"`**, which does not match. With a destructive confirm open, `3` navigates to `/plan` underneath it, `s` opens Settings | Add `[role="alertdialog"]` to both guards |
| X-11 | `CommandPalette.tsx:430-435` + `dropdown-menu.tsx` | Workspace dropdown | The guard only looks for `role="dialog"`; Radix `DropdownMenuContent` renders `role="menu"` and its typeahead does not stop propagation. With the menu open, typing `s` → `/settings`, `1` → `/discover`. Same hole for the `FocusDock` idle composer (a plain `div`) | Extend the guard to `[role="menu"][data-state="open"], [role="alertdialog"]` |
| X-12 | `RoomChrome.tsx:32-37` + `MissionShellView.tsx:36-41` | Room top bar's four doors | Once on `/settings`, `/brain`, `/approvals`, `/threads`, `/artifacts`, the entire 12-row rail is unmounted and **nothing links back** to any of the 10 loop or intelligence destinations. The only escape is the room's `Under the hood` button, which is `hidden ... sm:flex`. The browser back button is the real answer | Add the loop destinations to the room top bar |
| X-13 | `_authenticated.tsx:193` + `nav-model.ts:174-191` + `SuggestionPopover.tsx:60-66` | Key hints `0-9 s a` in the rail and on every composer JUMP row | `{!isOnboarding && !isReimaginedSurface && <GotoShortcuts />}` - bindings unmounted on all 7 room-shell paths, yet the composer keeps rendering the hints. On `/settings`, `/brain`, `/approvals`, `/threads`, `/artifacts`, pressing `3` does nothing. In the room `3` moves the Spine. `8` and `9` do nothing anywhere in the room | Mount room-aware bindings, or strip `hint` where not live |
| X-14 | `ask-context.tsx:96-115`; `AppShell.tsx:323` | ⌘J, `supaprod:open-ask` | `AskProvider` binds both. Its `isOpen` has exactly one consumer - `const { isOpen: askOpen } = useAsk();` - and `askOpen` is **never referenced again**. So ⌘J fires two listeners; only `GlobalComposer`'s does anything. `pendingIntent` is never cleared (only the orphaned AskPanel called `clearPendingIntent`) and leaks | Delete the provider's key + event bindings |
| X-15 | `palette-sections.ts:30`; `GlobalComposer.tsx:96`; `Composer.tsx` `pick` | **`Ask about this screen`** | `if (run.event === "supaprod:open-ask") return;` returns **before** `setOpen(false)` and before any navigation, while `pick` unconditionally calls `onDraftChange("")`. Net: your typed text is wiped, the overlay is unchanged, nothing runs. It never passes screen context either | Feed the draft into `sendIntent`, or remove the row |
| X-16 | `use-ask-stream.ts:246-252` | (missing) "New conversation" | `startNewConversation` is exported and consumed by **zero** live components. The only "New" button is on the orphaned AskPanel. **There is no way to start a fresh thread on any reachable Ask surface** | Add the control to `ComposerSurface` |
| X-17 | `use-ask-stream.ts:484-514` | (missing) "Start a project from this" | `startProjectFromIntent` + `startingProject` consumed by **zero** live components. `AskPanel.tsx:487-490` records this as a founder ruling of 2026-07-18 ("THE SENTENCE BOX FOLDS INTO ASK"). It is not reachable | Wire the chip into `ComposerSurface` |
| X-18 | `use-ask-stream.ts:552-553` | (missing) thread identity | `conversationId` and `scopeKey` are returned and consumed by **zero** components. The overlay never shows a title, never links to the thread, never indicates whether you are continuing or starting | Render the title + an "open in Threads" link |
| X-19 | `settings.tsx:2689-2721` | Per-agent on/off switch, `role="switch"` with `aria-checked` | `onClick` calls **only** `toast(...)`: "...stays on. Disabling agents is gated in Autonomy & approvals." The thumb never moves, `aria-checked` never changes. A switch that cannot switch, once per agent | Make it a read-only status pill with a link |
| X-20 | `DiscoverSurface.tsx:69-141, 190-196, 276-299` | Discover tab row | `TabBar` is **never rendered**; `selectTab` is **never called**; the queue branch is unreachable. ~90 lines of tablist with roving tabindex, Home/End and ARIA that no user can see | Delete or wire |
| X-21 | `build.$missionId.tsx:446` | Full execution log → `SessionTimeline` | `approvals={[]}` is **hardcoded empty**, so `SessionTimeline.tsx:273` (`approvals.filter(a => a.status === "pending")`) is permanently empty. Gates render separately at `:817-821`; the timeline branch is dead | Pass the real `approvals`, or drop the prop |
| X-22 | `legacy-redirects.ts:201` | `"/governance"` → Safety room | **There is no `_authenticated.governance.tsx`.** `/governance` falls through to `AuthedNotFound`. The "single source of truth" advertises a route that 404s | Add the stub or delete the entry |
| X-23 | `legacy-redirects.ts:1-5` | "`legacy-redirects.test.ts` ... reads this map so there is exactly one place that names 'where did X go'" | **The test file does not exist.** Nothing verifies the map - which is why L-17, L-18, L-19, X-22 and the `/changelog`, `/impact`, `/guardrails` drifts all survive | Write the test, or delete the claim |
| X-24 | `AccountMenu.tsx:342-350, 156-174` | The account menu | `onPanelKeyDown` is on the panel `<div>`, but opening leaves focus on the **trigger button**, a sibling. Keydowns never reach the handler. Immediately after opening, `Escape` does nothing and `ArrowDown` does nothing | Focus the first `[role="menuitem"]` on open |
| X-25 | `RoomChrome.tsx:79-92` + `MissionShellView.tsx:147-160` | Product switcher popover | No keyboard handling at all; only `mousedown` dismisses. Escape does nothing, arrows do nothing. ARIA is broken: `role="listbox"` with `<button role="option">` children, no `aria-activedescendant`, not focusable | Reuse Radix `DropdownMenu` for both |
| X-26 | `settings.tsx:468-504` | Settings → Workspace → **Memory** | The section renders a card saying "Memory lives in Brain" with an "Open Brain →" link. A permanent nav row whose only content is a redirect notice | Remove the section id; normalize `?section=memory` to Brain |
| X-27 | `settings.tsx:1967-1973, 2047-2053` | "Adapter-ready (platform / enterprise key)" models | `<option ... disabled>` inside an optgroup. Models you can read and cannot pick, no inline reason, no upgrade door | Remove, or add "requires an enterprise key" with the door |
| X-28 | `settings.tsx:2807-2815, 2829-2836` | "The per-tool grant matrix lands with the agent-access work." / "Per-product instructions ... are not wired yet." | Honest, but two permanent "not built" notices inside the agent detail a demo will open | Hide the unbuilt slots |
| X-29 | `approvals.tsx:262-266` | `N more in other workspaces` | A plain `<p>`. Reads as a link, behaves as text; no way to reach those items except a workspace switch in a control on a different shell | Make it an affordance or drop the line |
| X-30 | `RoomTour.tsx` + `MissionShell.tsx:301-314` | The 20-second room tour | `setTourOpen(true)` is called from exactly one place - the first-run offer. Once `dismissTourOffer()` writes `TOUR_SEEN_KEY`, `RoomTour` (159 lines, five stops) is **permanently unreachable**, despite its own doc comment promising "a first-run offer or a replay affordance" | Add "Replay the tour" to `AccountMenu` |
| X-31 | `AppShell.tsx:1030` + `AuditLineageSheet.tsx:61` | Any `PREFIX·XXXXXX` audit chip | The sheet is mounted **inside `AppShell` only**. On the 7 room-shell paths `supaprod:open-lineage` has no listener. The room's own minted audit id (`Thread.tsx:185`) is rendered as an inert `<span>`, not an `AuditTag` - **the id the product just minted is the one you cannot trace** | Mount the sheet in `_authenticated.tsx`; use `AuditTag` in `PromoteRow` |
| X-32 | `AppShell.tsx:101, 113, 216-218, 887` | `LoopRail`, `NavRow.spine` | `function LoopRail({children}) { return <div>{children}</div>; }` - a no-op wrapper; `spine?: boolean` destructured and never read. Leftovers from the retired spine treatment, in the most-read shell file | Delete both |
| X-33 | `AppShell.tsx:65-92, 879, 891` | `ZoneHeader({label, caption})` | `caption` is never passed at either call site. Dead prop plus 12 lines of dead JSX | Delete the prop |
| X-34 | `nav-model.ts:220-225` + `govern.tsx` / `trust-ledger.tsx` | The `Pulse` rail row's active state | `ENGINE_ROOM_PATHS` includes `/govern` and `/trust-ledger`, both **pure `throw redirect` stubs**. The active-state math depends on two paths that can never be a resting location | Trim to `/engine-room` and `/sync` |

---

### SILENT - 25

| ID | File · line | Control | Actual | Fix |
| --- | --- | --- | --- | --- |
| **S-01** | `MissionShellView.tsx:239-244` and `:247-252` | Streaming scroll (the 2026-07-27 patch) | **Effect 1 has no near-bottom guard at all** - `el.scrollTo({top: scrollHeight, behavior:"smooth"})` on every `messageCount` change, yanking a reader out of history. The commit's guard claim applies only to effect 2. **Effect 2's guard is measured after the fact**, so one token adding >240px (a code block, a table) pushes distance past the threshold and the pin **permanently disengages for the rest of that answer**. The two fight: effect 1 starts a smooth animation, effect 2 cancels it next frame with a direct `scrollTop` write. The correct pattern (a pre-update `nearBottomRef` fed by `onScroll`) exists at `AskPanel.tsx:1125-1131` and was not carried over. **Verified at source.** | Port `nearBottomRef`; one effect, one behaviour, guard read before the update |
| **S-02** | `GlobalComposer.tsx:133-136` | Ask overlay answer area | `<div className="mb-2 flex max-h-[45vh] flex-col gap-3 overflow-y-auto">` has **no ref and no scroll effect**. The 2026-07-27 fix landed only in the room. On all ~68 AppShell routes - where the founder actually presses ⌘J - the second and later answers stream below the fold of a 45vh box that never moves | Port the `MissionShellView` scroll pair into the overlay thread |
| **S-03** | `use-ask-stream.ts:517-525` + `GlobalComposer.tsx:56` (`enabled: open`) | Ask overlay | `enabled:false` runs `abortControllerRef.current.abort()`. Pressing Esc, clicking away, or hitting ⌘J again **kills the in-flight answer**. The partial bubble stays in state, no toast, no "cancelled" line. Reopening shows a truncated answer with no explanation. **This is the founder's "I typed, it vanished".** | Keep the stream alive while the conversation is open; mark cancelled answers |
| S-04 | `use-ask-stream.ts:518-525` | Mic button | The `!enabled` effect calls `readAloud.stop()` but **never** `dictation.stop()`. `useDictation` only tears down on unmount, and the overlay stays mounted. Start dictation, press Escape: the mic keeps listening and keeps appending into a draft you cannot see | Add `dictation.stop()` |
| S-05 | `Composer.tsx:79-82` | `Send ⏎` and the textarea | While an answer streams, Enter is a **silent no-op** - no toast, no shake, no disabled styling. The Send button *is* disabled but the keyboard path gives no feedback. The user retypes and presses Enter again | Disable/annotate the textarea while streaming, or queue the intent |
| S-06 | `GlobalComposer.tsx:57-60` vs `MissionShell.tsx:350-354`; `ask-stream-core.ts:98-142` | The Ask box, everywhere | **Two independent `useAskStream` instances with two `messages` arrays.** A falls back to `useWorkspace().activeProductId`; B passes the routed product. They agree only via the localStorage id, which X-01 makes unusable. Third fork: AskPanel key `...conversation.v1` vs hook map `...conversations.v2`, bridged v1→v2 only and never for `product:` scopes. `activeProductId` flipping null↔set silently re-buckets the thread. Ask in the room, walk to `/today`, press ⌘J: empty box | One hook instance hoisted to the authenticated shell; one scope key |
| S-07 | `Thread.tsx:208, 353`; `GlobalComposer.tsx:143` | Thread rendering during a stream | `ThreadMessage` and `Thread` are plain functions - **no `React.memo`**. `messages.map` re-renders every message on every delta frame, each re-parsing markdown and re-running `new Date().toLocaleTimeString()`. The orphan memoized exactly this. `GlobalComposer.tsx:143` also hands the shared `liveStatus` to every message instead of only the streaming one | `React.memo` both; pass `liveStatus` only to the streaming message |
| S-08 | `use-ask-stream.ts:414-459`; `Thread.tsx:161, 189-199` | "Log decision" / "Make task" / "Save as note" | One click creates a real record; `createDecision` carries stage-event + tracking side effects. **No confirm, no undo, no delete affordance anywhere in the conversation surface.** `toast("Task created.")` sits **outside** the `if (id)` guard - an insert returning no id still reports success. The decision chip's `doneLabel: ""` renders an empty bordered box | Move the toast inside the guard; add undo |
| S-09 | `ThreadsSurface.tsx` ThreadPreview title input | "Rename" | `onBlur={() => setEditing(false)}` with **no save**. Type a new title, click anywhere, the edit vanishes - no toast, no prompt, no trace. Enter saves; nothing says so | Save on blur, or warn on dirty-blur |
| S-10 | `_authenticated.tsx:216` + `FocusDock.tsx:285-301` + `use-flow-mode.tsx:168, 251` | The running focus block | `{!isOnboarding && !isReimaginedSurface && <FocusDock />}` and `FlowWidget` lives in the unmounted rail. On the 7 room-shell paths there is **no timer, no glow, no exit, no held counter** - but `setFlowActive(true)` is global, so every non-critical toast is still swallowed. Start a block on `/today`, walk into the room, and the app silently stops talking to you | Mount a minimal indicator in `RoomTopBar`, or clear the hold when the dock is absent |
| S-11 | `palette-sections.ts:35` → `MissionShell.tsx:389` / `GlobalComposer.tsx:99` | **`Start a focus block`** | Both run handlers dispatch `supaprod:focus-compose` then `return` **without navigating**. The only listener is `FocusDock`, unmounted on all 7 room-shell paths. On the room, Settings, Brain, Approvals, Threads or Artifacts this row closes the overlay and does nothing | Navigate to `/today` when the dock is absent |
| S-12 | `fleet.tsx:7` / `delegate.tsx:8` → `build.index.tsx:670` | `/fleet` → By Agent, `/delegate` → By Lane | `const viewMode = hasCompletedMission ? (search.view ?? "missions") : "missions";` - on a workspace with no completed mission the lens **and its tab row** silently vanish, no message. **The exact demo-day state** | Say so instead of falling through |
| S-13 | `plan.spec.$id.tsx:365-386, 731-752` | AI `rewrite` / `expand` / `shorten` / `critique` | The four buttons render on **every** tab, but `taRef.current` is null outside `mode === "edit"`. `mutationFn` falls back to `sel = body`, **makes a real paid model call**, then `onSuccess` hits `if (!ta) return;` and **discards the result**. No toast, no error, credits spent | Hide/disable unless `mode === "edit"` |
| S-14 | `plan.spec.$id.tsx:568-588, 674-692, 915-938` | Spec title + body editor | `title`/`body` are local state with an explicit `Save`. **No dirty flag, no beforeunload guard, no router blocker.** Clicking a crumb or the AI assist on the wrong tab loses the edit with no prompt. `WorkspaceBriefSection` does track `dirty` | Track dirty and block navigation, or autosave |
| S-15 | `build.$missionId.tsx:548-562, 620-646` | Mission title `<h1 role="button">`, `title="Click to rename"` | A single click swaps it for an input; `onBlur` commits. `renameMut.onSuccess` is `() => invalidate()` - **no toast**. A stray click plus a click elsewhere renames the mission with no confirmation, no feedback, no undo | Explicit edit affordance, success toast, visible Esc-to-cancel |
| S-16 | `settings.tsx:2139-2145, 2341-2349` | **`Remove`** on a BYO AI key | `mDelKey` fires straight from `onClick` - **no `useConfirm`** (the file imports and uses it elsewhere) and **no `onError` handler at all**. A failed delete is completely silent: no toast, the row stays, the user clicks again. Violates the repo's own destructive-actions convention | Add the confirm and an `onError` toast |
| S-17 | `admin.people.tsx:357-366, 538-541` | `GrantCreditsForm` submit | **No confirm**, while the sibling "Reset monthly cycle" and "Suspend sign-in" both confirm. The one money-moving control on the page is the one without a gate | Add `useConfirm` with the delta and the target user |
| S-18 | `admin.routing.tsx:54-63` | Routing policy bar | `policyMutation.onSuccess` only invalidates - **no toast**, unlike its sibling `pinMutation`. Changing the platform-wide routing policy looks like nothing happened | Add the success toast |
| S-19 | `settings.tsx:408` | Settings nav click | `setTab = (id) => navigate({search: {section: id}})` builds a **fresh** search object, dropping `?connector=` and `?checkout=`. Landing from a Stripe return and clicking any nav row loses the state driving the confirmation toast | Use the functional updater |
| S-20 | `plan.spec.$id.tsx:1029-1058` → `discover.tsx:17-24` | Source-signal buttons under "Why this spec · source evidence" | Sends `{tab:"signals", focus: s.id}`, but Discover's `validateSearch` returns **only** `tab` - `focus` is dropped at parse time and never read. The code comment admits the honoring "lands in the sibling W2-DISCOVER lane"; it never landed | Add `focus` to `validateSearch` and scroll/highlight, or make the row non-clickable |
| S-21 | `build.$missionId.tsx:584, 772` | Orchestrator (goal-run) missions | `!isOrchestratorMission &&` gates the entire header (title, rename, cost, trace id, the brief), the `JourneyStrip`, **and** the five sub-tabs. A goal-run detail page has no title, no cost, no copyable trace, no tabs - and `?tab=` carried in from `/studio/$missionId` is silently discarded | Give the branch the shared header, or say why the tabs are absent |
| S-22 | `studio.$missionId.tsx:10-11` | `/studio/X?tab=preview` | The stub whitelists only `changes\|pr\|cost`; the live route supports `changes\|pr\|preview\|cost\|receipts`. `?tab=preview` and `?tab=receipts` are dropped | Widen the stub's `TABS` |
| S-23 | `sync.tsx:148-166` | `/sync` page chrome | **No `<TopBar>` at all** - only a back-link to Settings. Every sibling work surface renders `<TopBar crumbs={...}>`. The breadcrumb strip simply disappears | Add the TopBar |
| S-24 | `WorkingStrip.tsx:118` | `N agents working, M waiting on you` | `activeLines.slice(0, 2)` - only the first two lines render, with **no "+N more"**, while the summary still counts all of them. With three active stages the strip says "3 agents working" and shows two. Each line is a `<button>` with no visible affordance styling | Add a `+N` chip and a hover/focus treatment |
| S-25 | `ComposerOverlay.tsx:26-33` + `Composer.tsx` `onKeyDown` | Escape | Bound twice for the overlay (window listener + textarea handler); harmless today. But the **docked** `Composer` has only the textarea handler - Escape does nothing when focus sits on the mic button or a journey chip | One Escape owner per surface |

---

### ORPHAN - 18

Components with **zero runtime importers**. Every one calls real server functions or renders real UI.

| ID | File | Size | What is lost | Fix |
| --- | --- | --- | --- | --- |
| **O-01** | `src/components/obsidian/AskPanel.tsx` | 1438 lines | The complete Ask UI. **Zero non-test importers - all 3 apparent hits are comments** (`ShimmerText.tsx:7`, `use-ask-stream.ts:42`, `_authenticated.chat.tsx:6`). Unreachable with it: "New" conversation, scope chip, product-scope chip, slash palette, "Start a project from this", `PendingApprovalsStrip`, suggested asks, day dividers, the meta footer + "How I got this →", read-aloud, "Open in Build →", `MissionCanvasBlocks`, and **the correct `nearBottomRef` scroll**. `AskPanel.test.tsx` runs 6 green integration tests against dead code | Delete file + test, or remount as the single Ask implementation |
| **O-02** | `src/components/supaprod/CommandPalette.tsx` (the dialog) | 336 of 454 lines | A five-section palette (JUMP / SETTINGS / ACT / RECENT / CATALOG / ASK) with arrow navigation, `Try it` buttons, an empty state, `getRecents()` and `filterCatalog()`. Its ⌘K binding and `supaprod:open-cmdk` listener never register. **Only `GotoShortcuts` from the same file is live** | Mount it, or delete it and stop referencing "the palette" in comments across 8 files |
| **O-03** | `src/components/supaprod/AttentionBell.tsx` | 97 lines | The notification bell. Calls `getNotifications` on a 60s poll. **The authenticated app has no notification bell at all** | Mount in both TopBars, or delete it and the server fn |
| O-04 | `src/components/observe/TracesPanel.tsx` | - | The Record room's traces view. `RecordRoom` does not use it; the only hit is its own `export function` line | Delete or mount |
| O-05 | `src/components/supaprod/CookingBanner.tsx` | - | A "something is running" ticker; self-fetches `getLiveRunCounts`. Carries a `ConstructionPill` with a "remove at GA" note | Delete |
| O-06 | `src/components/supaprod/AmbientChip.tsx` | - | Self-fetches `fetchWeather` | Delete |
| O-07 | `src/components/supaprod/BudgetBar.tsx` | - | Self-fetches `getBudgetSummary`. **The spend cap has no visible bar anywhere** | Mount where the cap matters |
| O-08 | `src/components/ink/Spine.tsx` | - | A duplicate Spine with its own `SpineStageState` union and `STATE_WORD` map, exported from the `@/components/ink` barrel. Two Spines can drift; one already has | Delete or fold into `@/components/mission` |
| O-09 | `src/components/ink/CommandBar.tsx` | - | A third search surface. Zero importers, **two test files** | Delete with its tests |
| O-10 | `src/components/ink/Modal.tsx` | - | - | Delete |
| O-11 | `src/components/ink/ModeToggle.tsx` | - | - | Delete |
| O-12 | `src/components/ink/ActivityTrace.tsx` | - | - | Delete |
| O-13 | `src/components/ink/AgentActivityTimeline.tsx` | - | - | Delete |
| O-14 | `MachineViewToggle` in the authenticated app | - | The HUMAN/MACHINE toggle is mounted only on the landing surfaces (see L-39) | Mount in both TopBars |
| O-15 | `ProductMasthead` in `today.tsx:16` | - | Imported and **never rendered**. Its backing `getProductContext` query still fires on every Today load, as does `useQuery({queryKey:["projects"]})` whose result is never read. **Two wasted round-trips per page view** | Delete the import and both dead queries |
| O-16 | `ProductMasthead` in `build.index.tsx:48` | - | Same pattern - imported, never rendered | Delete the import |
| O-17 | `RoomTour` after first dismissal | 159 lines | Five tour stops, permanently unreachable (see X-30) | Add a replay affordance |
| O-18 | `AuditLineageSheet` on all 7 room-shell paths | - | Mounted inside `AppShell` only (see X-31) | Mount in `_authenticated.tsx` |

---

### WORKS - 18 (the patterns to copy)

1. **Workspace delete** - typed confirm (`AppShell.tsx:588-594`). *The reference destructive pattern.*
2. Mission delete confirm (`build.index.tsx:962-986`)
3. Playbook dismiss confirm (`today.tsx:739-748`)
4. Charging toggle confirm (`admin.index.tsx:123-134`)
5. Subscription cancel confirm (`settings.tsx:619-631`)
6. Token rotate / revoke confirm (`sync.tsx:748, 768`)
7. Clipboard write done correctly, `.then(ok, fail)` (`sync.tsx:626-630`)
8. `/briefing` deep link - resolves through `LEGACY_SECTION_MAP`, scrolls, highlights with an ember ring (`settings.tsx:441, 2849-2853`)
9. **`getThread`'s tolerant column select** (`threads.functions.ts:121-143`) - the one read that survives the schema drift, *and its comment names the exact bug in `getConversation`*
10. SSE delta accumulation patched **by message id, never by index** (`use-ask-stream.ts:356-363`)
11. SSE reader re-buffers on chunk-boundary JSON splits (`use-ask-stream.ts:333-337`)
12. `ChatMarkdown` renders partial content the moment it is non-empty (`Thread.tsx:334`) - **partial text IS painted correctly; it is painted where you cannot see it**
13. The room's docked Composer and room overlay correctly share one `useAskStream` instance
14. `AccountMenu` is deliberately never hidden at small widths because it carries the app's only `signOut` on room surfaces (`MissionShellView.tsx:592-598`)
15. The approvals queue auto-refreshes - `RoomChrome.tsx:237-241` polls the shared query key every 30s
16. Esc closes the overlay, tray, crew drawer and tour in the room
17. `useConfirm` + `typedConfirm` exist and are correct where called
18. **33 of the 41 redirect stubs land exactly where the link promises**

---

## 3. Always visible, rarely meaningful

The founder's own question, answered in full. See §"Question 3" in the handback.

## 4. Corrections carried forward

- **The Spine does not render on Brain, Threads, Artifacts, Settings or Approvals.** Those five use
  `RoomChromeShell` (`RoomChrome.tsx:224-282`), which renders `RoomTopBar` and nothing else. The
  always-on Spine is real but **confined to the loop room** (`MissionShellView`). The brief's
  finding 1 is right about the defect and wrong about the blast radius. It is still a violation of
  the 2026-07-23 ruling - inside the room, on stages the active journey does not touch.
- **`CommandPalette.tsx` is not entirely dead** - its `GotoShortcuts` export **is** mounted
  (`_authenticated.tsx:4, 193`) and is half of L-04 and L-23. Only the palette dialog is unreachable.
- **`/briefing` is not broken.** It works.
- **The `toast.success(e.message)` count is 18, not 11.** Audits A and B both undercounted.
- **`AskPanel.tsx` has zero runtime importers**, confirmed: all three `grep` hits are comments.

## 5. Live schema verification (PostgREST, production)

```
GET /rest/v1/messages?select=id,mission_id&limit=1
  -> 400 {"code":"42703","message":"column messages.mission_id does not exist"}
GET /rest/v1/messages?select=id,metadata&limit=1
  -> 400 {"code":"42703","message":"column messages.metadata does not exist"}
GET /rest/v1/messages?select=id,role,content,model,created_at&limit=1   -> 200 []
GET /rest/v1/conversations?select=id,product_id&limit=1                 -> 200 []
GET /rest/v1/conversations?select=id,folder_id&limit=1                  -> 200 []
GET /rest/v1/conversation_folders?select=id&limit=1                     -> 200 []
```

`messages.mission_id` and `messages.metadata` **do not exist**. `conversations.product_id`,
`conversations.folder_id` and `conversation_folders` **all exist** - so the two
"turns on with the next release" error strings (L-06) are lying about shipped tables.
