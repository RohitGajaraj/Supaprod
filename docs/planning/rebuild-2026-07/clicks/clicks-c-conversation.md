# Click audit C - the conversation layer

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Static analysis, 2026-07-28. Scope: the Ask panel, the composer chain, threads, and the streaming path.
> Schema claims in this document were verified against the **live production database**
> (`ysszyrczxanuzhiohygx.supabase.co`) via PostgREST, not inferred from migrations.

**Files audited in full:** `src/components/obsidian/AskPanel.tsx` (1438) · `src/hooks/use-ask-stream.ts` (555) ·
`src/lib/ask-stream-core.ts` (156) · `src/lib/ask-thread.ts` (103) · `src/lib/ask-sse.ts` ·
`src/lib/ask-context.tsx` · `src/components/mission/composer/*` (GlobalComposer, Composer,
ComposerOverlay, Thread, JourneyChips, SuggestionPopover) · `src/routes/_authenticated.threads.tsx` ·
`src/components/mission/ThreadsSurface.tsx` (633) · `src/lib/threads.functions.ts` (310) ·
`src/lib/conversations.functions.ts` · `src/routes/api/chat.ts` (1186) ·
`src/components/mission/MissionShell.tsx` + `MissionShellView.tsx` (the 2026-07-27 scroll patch).

---

## The one-paragraph answer

**The Ask surface is not "designed badly". It is running against two database columns that do not
exist.** `getConversation` - the only history read either Ask surface has - selects
`messages.mission_id` and `messages.metadata`. Live PostgREST returns
`{"code":"42703","message":"column messages.mission_id does not exist"}` and the same for `metadata`.
The server function `throw`s on that error. The hydration query therefore rejects on every call, for
every user, for every conversation, and **nothing anywhere reads `hydration.error`**. The panel falls
through to its empty state and reads as "my chats are gone". The same failure makes
`ensureConversation` fall into its `catch` and mint a **brand-new conversation row on every single
send**, which is why `/threads` fills with one-exchange stubs. Meanwhile `getThread` (the `/threads`
read) deliberately selects only columns that exist - so the exact same conversation renders fine in
`/threads` and blank in Ask. That asymmetry is the founder's complaint, verbatim, and it has a
two-token fix.

---

## Answers to the four assigned questions

### (a) When does Ask history hydrate, and every way the guard fails

The guard is `use-ask-stream.ts:225` / `AskPanel.tsx:827`:

```ts
enabled: enabled && !!storedConvId && messages.length === 0,
```

Enumerating every way this path fails to put history on screen:

| # | Condition | Result | Real today? |
| --- | --- | --- | --- |
| 1 | `queryFn` rejects (`getConversation` throws on the missing columns) | `data` stays `undefined`, effect returns at `if (!data ...)`, thread stays empty, **no error shown** | **YES - always, 100% of calls** |
| 2 | `storedConvId` null because `readScopedConversationId` returned nothing for this scope | empty panel, new conversation on send | YES - every scope switch |
| 3 | `messages.length > 0` before the query resolves | query is disabled; survives ONLY because `ensureConversation`'s `fetchQuery` shares the key and back-fills the cache - but that fetch also rejects (#1), so nothing back-fills | YES |
| 4 | `enabled`/`isOpen` false (surface closed) | never fetches; correct by design | by design |
| 5 | `hydratedRef.current === storedConvId` already set from a previous open | effect returns early; harmless because state persists | latent |
| 6 | `data.conversation` falsy (RLS/foreign id) | `rememberConversationId(null)` silently wipes the stored id | latent |
| 7 | scope key changes (product/workspace switch, `ask-stream-core.ts:103-107`) | `setMessages([])` + re-read; the new bucket is usually empty | YES |
| 8 | AskPanel reads key **v1**, the hook writes key **v2**; `conversationIdForScope:142` only bridges v1→v2 and only for non-product scopes | the two never converge | moot (AskPanel is orphaned - see C-03) |
| 9 | `localStorage` unavailable (private mode) | both reads swallow and return `{}` | edge |

**Failure #1 is the bug.** Everything else is secondary.

### (b) Is partial text painted, and is the scroll correct?

**Partial text: yes, correctly.** `use-ask-stream.ts:356-363` accumulates `acc` and patches
`{content: acc}` on every `delta` frame, patching **by message id, never by index**. `Thread.tsx:334`
renders `<ChatMarkdown content={msg.content}/>` the moment content is non-empty. The SSE reader
re-buffers on chunk-boundary JSON splits (`:333-337`). The protocol is sound.

**Scroll: no.** The 2026-07-27 patch (`MissionShellView.tsx:229-252`) has two effects, and the commit
message describes a guard that only one of them has. Detail in **C-09**. Partial text is painted; it
is painted where you cannot see it.

### (c) How many inputs claim to be "ask"?

**Eight entry points, three of them dead, two live hook instances that fork state.**

| Entry | File | Reaches | State |
| --- | --- | --- | --- |
| `ComposerOverlay` via Cmd+J / Cmd+K / `supaprod:open-ask` / `supaprod:open-cmdk` | `GlobalComposer.tsx:70-86` | ~68 old-app routes | `useAskStream` instance **A** (scope = `activeProductId`) |
| Docked `Composer` strip | `MissionShellView.tsx:425` | the room | `useAskStream` instance **B** (scope = routed product) |
| Room `ComposerOverlay` (Cmd+J/K in the room) | `MissionShell.tsx:398-427` | the room | instance **B** (shared - correct) |
| `TopBar` Ask button | `TopBar.tsx:53` | old-app routes | fires `supaprod:open-ask` → A |
| `RoomChrome` Ask button | `RoomChrome.tsx:277` | Threads/Artifacts/Settings/Approvals/Brain | fires `supaprod:open-ask` → A |
| `/m` index WarmSlot | `_authenticated.m.index.tsx:51` | `/m` | → A |
| `AskProvider` Cmd+J + `supaprod:open-ask` | `ask-context.tsx:96-115` | everywhere | **DEAD** - sets state nothing renders (C-04) |
| `AskPanel` composer | `AskPanel.tsx:436-735` | nowhere | **ORPHAN** (C-03) |
| `CommandPalette` ASK row | `CommandPalette.tsx:149` | nowhere | ORPHAN (already known) |

**A and B are separate hook instances with separate `messages` arrays.** They agree only through the
localStorage conversation id - which, because of C-01, can never be turned back into messages. Ask in
the room, walk to `/today`, press Cmd+J: empty box.

### (d) Does `/threads` show the same content as the panel that created it?

**No - and the `getThread` note is exactly the right thread to pull.**

`threads.functions.ts:121-124` says it verbatim:

```
// Deliberately selects ONLY columns that exist on messages here (the shared getConversation
// selects messages.mission_id, which is absent in this database)
```

That note is **correct and load-bearing**. `getThread` works because it avoids the columns.
`getConversation` does not avoid them, so it always throws. Confirmed live:

```
GET /rest/v1/messages?select=id,mission_id&limit=1  -> 400
{"code":"42703","message":"column messages.mission_id does not exist"}
GET /rest/v1/messages?select=id,metadata&limit=1    -> 400
{"code":"42703","message":"column messages.metadata does not exist"}
GET /rest/v1/messages?select=id,role,content,model,created_at&limit=1 -> 200 []
```

Beyond the availability gap, the two renderings differ in five ways (C-07): different column set,
different sort, different window (200 asc vs 80 desc reversed), raw text vs `ChatMarkdown`, and a
different speaker label ("Agent" vs "Supaprod").

---

## Findings - worst first

| # | File:line | Label / control | Expected | Actual | Class | Fix |
| --- | --- | --- | --- | --- | --- | --- |
| C-01 | `src/lib/conversations.functions.ts:28` | (Ask history hydration) | Opening Ask shows the prior conversation | `.select("id,role,content,model,created_at,mission_id,metadata")` - both trailing columns are absent live (42703). `if (msgRes.error) throw` fires every call. The `useQuery` at `use-ask-stream.ts:222` rejects, `data` is `undefined` forever, the hydrate effect returns at `if (!data \|\| !storedConvId ...)`, `messages` stays `[]`, empty state renders. `hydration.error`/`isError` is read **nowhere** in either consumer. | **DEAD** | Drop `,mission_id,metadata` from the select (or apply the two `ADD COLUMN IF NOT EXISTS` migrations that never landed). |
| C-02 | `use-ask-stream.ts:195-220`, `AskPanel.tsx:796-822` | (send, any Ask input) | The message lands in the existing thread | `try { fetchQuery(getConversation) } catch { /* fall through */ }` then `fCreate({data:{}})`. C-01 makes the fetch always reject, so the `catch` always fires: **every question mints a new `conversations` row** and overwrites the stored id. Also costs `retry: 1` = two failed round trips of latency before each stream starts. | **DEAD** | Fixed by C-01. Separately, distinguish "not found" from "read failed" so a transient error never silently forks the thread. |
| C-03 | `src/components/obsidian/AskPanel.tsx` (whole file, 1438 lines) | "Ask Supaprod" panel | Cmd+J opens the panel the code describes | **Zero non-test importers.** `_authenticated.tsx:204`: *"The retired CommandPalette and AskPanel components stay in the tree source but are unmounted"*. Unreachable with it: "New" conversation (`:1221`), scope chip (`:1264`), product-scope chip (`:1291`), slash palette (`:527`), "Start a project from this" (`:661`), `PendingApprovalsStrip` (`:1326`), suggested asks (`:1363`), day dividers (`:1390`), meta footer + "How I got this →" (`:317-357`), read-aloud (`:296`), "Open in Build →" (`:252`), `MissionCanvasBlocks` (`:251`), and the correct `nearBottomRef` scroll (`:1125`). `AskPanel.test.tsx` runs 6 green integration tests against it. | **ORPHAN** | Delete the file + its test, or re-mount it. Green tests on dead code are worse than no tests. |
| C-04 | `src/lib/ask-context.tsx:96-115`; `AppShell.tsx:323` | Cmd+J, `supaprod:open-ask` | One handler, one visible result | `AskProvider` binds Cmd/Ctrl+J → `toggle()` and `supaprod:open-ask` → `summon()`/`runIntent()`. Its `isOpen` has exactly **one** consumer: `const { isOpen: askOpen } = useAsk();` at `AppShell.tsx:323` - `askOpen` is then **never referenced again** (grep: single occurrence). So Cmd+J fires two listeners; only `GlobalComposer`'s does anything. `pendingIntent` set by `runIntent` is never cleared (only the orphaned AskPanel called `clearPendingIntent`) and leaks forever. | **DEAD** (duplicated affordance) | Delete `AskProvider`'s key + event bindings, or delete the provider. |
| C-05 | `GlobalComposer.tsx:57-60` vs `MissionShell.tsx:350-354`; `ask-stream-core.ts:98-100,142` | (the Ask box, everywhere) | One conversation follows you across the app | Two independent `useAskStream` instances with two `messages` arrays. A omits `productId` → falls back to `useWorkspace().activeProductId`; B passes the **routed** product. They agree only via the localStorage id, which C-01 makes unusable. Third fork: AskPanel uses key `supaprod.ask.conversation.v1`, the hook uses map `supaprod.ask.conversations.v2`; `conversationIdForScope:142` bridges v1→v2 only, and never for `product:` scopes. `activeProductId` flipping null↔set silently re-buckets the thread (`askScopeKey:103-107`). | **SILENT** | One hook instance hoisted to the authenticated shell; one scope key. |
| C-06 | `ThreadsSurface.tsx` (`useState<"product"\|"all">("product")`, `filtered`) | "This product" scope on `/threads` | The list shows this product's threads | `conversations.product_id` is **never written by any code path** - `createConversation` inserts only `user_id, title, model, project_id` (grep confirms no writer in `chat.ts`, the hooks, or the functions file). Every Ask conversation has `product_id = null`. Default scope is `"product"`, so `filtered` drops all of them while `threads` is non-empty → the component falls to the `filtered.length === 0` branch and renders the literal string **`No threads match ""`** with an empty search box. | **DEAD + LIES** | Either stamp `product_id` on create, or default the scope to `"all"` until it is stamped. Fix the empty-state copy so it never quotes an empty query. |
| C-07 | `threads.functions.ts:138-143` vs `conversations.functions.ts:28`; `ThreadsSurface.tsx` ThreadPreview vs `Thread.tsx:281-350` | Reading a thread in `/threads` | The same conversation, rendered the same way | Five divergences: (1) `getThread` selects 4 columns, `getConversation` 7; (2) asc vs desc-reversed; (3) limit 200 vs 80; (4) `/threads` renders `<div className="whitespace-pre-wrap">{m.content}</div>` - **raw markdown source** (`## Heading`, `**bold**`, `- bullets`, `[1]`) - while the composer renders `<ChatMarkdown>`; (5) `/threads` labels the assistant **"Agent"**, the composer labels it **"Supaprod"**. This is the founder's "if you open the thread, it's not properly designed". | **LIES** | Render `/threads` with `ChatMarkdown`, one speaker label, one read function. |
| C-08 | `chat.ts:576-577`, `:623-630`; `Thread.tsx:346` | "You can track its progress and approve decisions inline below." | Mission tracking renders below the answer | The only renderer honoring it is the **orphaned** `AskPanel.tsx:249-267` (`MissionCanvasBlocks` + "Open in Build →"). The live `ThreadMessage` uses `msg.mission_id` **only to suppress the promote row** - no canvas, no link, nothing below. Worse: `chat.ts:623-630` persists that reply with `mission_id: mission.id` (absent column) and **discards the `{error}`** - `await msgInsert.insert({...})` with no error check, unlike every other insert in the file. The mission reply is never saved; reload loses it and `/threads` shows only the user's question. | **LIES + DEAD** | Drop `mission_id` from the insert and check its error; port the mission link + canvas into `ThreadMessage`, or change the sentence. |
| C-09 | `MissionShellView.tsx:239-244` and `:247-252` | (streaming scroll, the 2026-07-27 patch) | "only while the reader is already near the bottom" (commit `5131c947`) | **Effect 1 has no near-bottom guard at all** - `useEffect(..., [messageCount])` calls `el.scrollTo({top: scrollHeight, behavior:"smooth"})` unconditionally, yanking a reader out of history on every new message. The commit message's guard claim applies only to effect 2. **Effect 2's guard is measured after the fact**: `distanceFromBottom = scrollHeight - scrollTop - clientHeight` runs post-paint, so one token that adds >240px (a code block, a table, a bulleted section) pushes distance past the threshold and the pin **permanently disengages for the rest of that answer**. The two also fight: effect 1 starts a smooth animation, effect 2 cancels it next frame with a direct `scrollTop` write. The correct pattern - a pre-update `nearBottomRef` fed by `onScroll` - exists at `AskPanel.tsx:1125-1131` and was not carried over. | **SILENT** | Port `nearBottomRef` + the `onScroll` handler from the orphan; one effect, one behavior, guard read before the update. |
| C-10 | `Thread.tsx:208`, `:353`; `GlobalComposer.tsx:143` | (thread rendering during a stream) | Settled messages stay put while one streams | `ThreadMessage` and `Thread` are plain functions - no `React.memo`. `messages.map` re-renders **every** message on **every** delta frame, each re-parsing markdown via `ChatMarkdown` and re-running `clockTime` (`new Date` + `toLocaleTimeString`). The orphan memoized exactly this (`AskPanel.tsx:95`, `:134`, with the comment *"so a streaming assistant reply ... never re-renders the already-settled user turns above it"*). `GlobalComposer.tsx:143` also hands the shared `liveStatus` to every message instead of only the streaming one, invalidating them all on each status tick. | **SILENT** (jank) | `React.memo` both, pass `liveStatus` only to the streaming message. |
| C-11 | `palette-sections.ts:30`; `GlobalComposer.tsx:96`; `Composer.tsx` `pick` | "Ask about this screen" | Asks about the current screen | `if (run.event === "supaprod:open-ask") return;` returns **before** `setOpen(false)` and before any navigation. `pick` then unconditionally calls `onDraftChange("")`. Net effect: your typed text is wiped, the overlay is unchanged, nothing runs. In the room (`MissionShell.tsx:386-389`) it at least re-expands the dock - but still discards the draft. | **DEAD** | Feed the draft into `sendIntent` instead of returning, or remove the row from `ACT_VERBS`. |
| C-12 | `use-ask-stream.ts:246-252` | (missing) "New conversation" | A user can deliberately start a fresh thread | `startNewConversation` is exported and consumed by **zero** live components (grep across `src/components/mission/` and `src/routes/_authenticated.tsx`). The only "New" button is `AskPanel.tsx:1221-1239` - orphaned. There is no way to start a fresh thread on any reachable Ask surface. | **DEAD** | Add the control to `ComposerSurface`. |
| C-13 | `use-ask-stream.ts:484-514` | (missing) "Start a project from this" | The founder ruling of 2026-07-18 is on screen | `startProjectFromIntent` + `startingProject` are exported and consumed by **zero** live components. The only rendered instance is `AskPanel.tsx:661-680`. `AskPanel.tsx:487-490` records this as a founder ruling ("THE SENTENCE BOX FOLDS INTO ASK"). It is not reachable. | **DEAD** | Wire the chip into `ComposerSurface`. |
| C-14 | `JourneyChips.tsx:44-66`; `GlobalComposer.tsx:110-118` | "Build this feature →", "Design this →", "Launch what we shipped →", 7 chips | The named journey starts | `if (activeProductId) openRoom(id, {search:{stage, journey}}); else void navigate({to:"/m"})`. With no active product the chip closes the overlay and drops you on the `/m` product index - no journey, no stage, no explanation. The chip's enabled state does not reflect whether it can work. | **LIES** | Disable the chips (or route to a product picker that resumes the journey) when `activeProductId` is null. |
| C-15 | `use-ask-stream.ts:414-459`; `Thread.tsx:189-199` | "Log decision" / "Make task" / "Save as note" | A reversible save | One click creates a real record. `createDecision` carries stage-event + tracking side effects (per the code's own comment). **No confirm, no undo, no delete affordance anywhere in the conversation surface.** Additionally `toast("Task created.")` at `:449` sits **outside** the `if (id)` guard - an insert that returns no id still reports success. `Thread.tsx:161` gives the decision chip `doneLabel: ""`, so an empty `formatAuditId` renders an empty bordered box. | **SILENT** (destructive-ish write, no undo) | Move the task toast inside the `if (id)`; add an undo action to the toast. |
| C-16 | `chat.ts:1091-1109`; comments at `:85-86` vs `:1077` | (answer footer + typed blocks) | Meta and blocks survive a reload | `insert({...row, metadata: persistedMeta})` always errors (column absent), logs, and re-inserts without. Every answer permanently loses model / latency / cost / sources and its typed blocks. The file contradicts itself: `:85-86` says *"messages has no `metadata` jsonb column ... meta is streamed live only, not persisted"*; `:1077` says *"Meta survives reloads via metadata (20260612120000)"*. `ask-thread.ts:47-52` promises receipts survive a refresh. The database settles it: they do not. | **DEAD** | Apply the `metadata` migration or delete the false comments and the dead fallback. |
| C-17 | `ThreadsSurface.tsx` ThreadPreview title input | "Rename" | The new title saves | `onBlur={() => setEditing(false)}` with no save. Type a new title, click anywhere, the edit vanishes - no toast, no prompt, no trace. Enter saves; nothing on screen says so. | **SILENT** | Save on blur, or warn on dirty-blur. |
| C-18 | `ThreadsSurface.tsx` `<select aria-label="Move to folder">` and `createFolderMut.onError` | "Move to folder" / "New folder" | Shows where the thread lives; honest errors | `value=""` always, so it never displays the current folder. Selecting mutates immediately - no confirm, no undo. Both error handlers hardcode a pre-migration excuse: *"Move to folder turns on with the next release"* / *"Folders turn on with the next release"* - but `conversations.folder_id` and `conversation_folders` **exist live** (verified: both return `200 []`). So any genuine failure now reports a lie. | **LIES** | Bind the select to `thread.folderId`; surface the real error. |
| C-19 | `MissionShell.tsx:541` (only link) | (missing) a Threads door | History is reachable from anywhere | `/threads` is linked from exactly one place: the room's top bar. Nothing in `AppShell`/`TopBar` reaches it. A user standing on any of the ~68 old-app routes has no door to their own conversation history. | **ORPHAN** (surface) | Add a Threads door to the old-app chrome, or to the composer overlay. |
| C-20 | `use-ask-stream.ts:552-553` | (missing) thread identity | The box says which conversation you are in | `conversationId` and `scopeKey` are returned and consumed by **zero** components. The overlay never shows a title, never links to the thread in `/threads`, and never indicates whether you are continuing or starting. | **DEAD** | Render the title + an "open in Threads" link in the overlay header. |
| C-21 | `ComposerOverlay.tsx:50-53` vs `AskPanel.tsx:1336-1384` | (empty Ask overlay) | Examples and an explanation of what it can read | `{children}` renders nothing when `messages.length === 0`, so an opened Ask overlay with no history is a bare textarea plus journey chips. The `suggestedAsksForContext(context)` chips and the "I can also read {context} in front of you" copy live only on the orphan. | **ORPHAN** (content) | Port the empty state into `ComposerOverlay`. |
| C-22 | `use-ask-stream.ts:518-525` | Mic button | Closing the overlay stops the mic | The `!enabled` effect calls `readAloud.stop()` but **never** `dictation.stop()`. `useDictation` only tears down on unmount (`use-voice.ts:72-85`), and the overlay stays mounted. Start dictation, press Escape: the mic keeps listening and keeps appending into a draft you cannot see. | **SILENT** | Add `dictation.stop()` to the `!enabled` effect. |
| C-23 | `ComposerOverlay.tsx:26-33` + `Composer.tsx` `onKeyDown` | Escape | One close per press | Escape is bound twice for the overlay (window listener + textarea handler); both call the same `onClose`, so it is harmless today. But the **docked** `Composer` has only the textarea handler - Escape does nothing when focus sits on the mic button or a journey chip. | **SILENT** | One Escape owner per surface. |
| C-24 | `JourneyChips` inside every `ComposerSurface`; `SuggestionPopover` JUMP rows from `PRIMARY_NAV` | (always-visible, sometimes meaningless) | Controls mean something where they appear | Same class as the Spine. The 7 journey chips render in the global overlay on Settings, Approvals, Brain, Threads and Artifacts, where activating one navigates you out of what you were doing. `SuggestionPopover`'s JUMP rows derive from `PRIMARY_NAV` - the **old-app 7-rail** - so on reimagined surfaces the composer offers jumps back into the retired shell. | **LIES** | Gate the chip set and the JUMP rows on the surface family. |

---

## Cross-cutting flags requested

**Always visible, only sometimes meaningful** - C-24 (journey chips + JUMP rows on every surface),
C-14 (chips whose enabled state does not match whether they can work), C-18 (a "Move to folder"
select that never shows the current folder).

**Duplicated affordances doing the same thing two ways** - C-04 (`AskProvider` and `GlobalComposer`
both own Cmd+J), C-05 (two `useAskStream` instances, three localStorage schemes), C-03/C-21
(two complete Ask UIs, one of them unreachable), C-07 (two conversation readers with different
column sets and different renderers), C-23 (Escape bound twice).

**Changes data with no confirmation and no undo** - C-15 (promote chips create real
decisions/tasks/notes; the task toast fires even without an id), C-18 (move-to-folder mutates on
select change), C-17 (rename silently discards on blur), C-02 (every send silently forks a new
conversation row).

---

## Recommended fix order for the demo

1. **C-01** - delete `,mission_id,metadata` from the `getConversation` select. One line. It fixes
   C-01, C-02, and half of the founder's complaint.
2. **C-08** - delete `mission_id` from the `chat.ts:623` insert and check its error.
3. **C-06** - default `/threads` scope to `"all"`, and fix the `No threads match ""` copy.
4. **C-07** - render `/threads` messages with `ChatMarkdown` and one speaker label.
5. **C-09** - port the `nearBottomRef` scroll from `AskPanel.tsx:1125-1131`; delete the two fighting effects.
6. **C-11** - make "Ask about this screen" send the draft instead of eating it.
7. **C-03 / C-04** - delete `AskPanel.tsx`, its test, and `AskProvider`'s dead key bindings, or re-mount them.
