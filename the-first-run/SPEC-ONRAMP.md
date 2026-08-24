> _Build spec, MAIN LANE 2026-08-25, produced against the real source. Every claim carries a
> file:line or says UNVERIFIED. **`the-first-run/RULINGS.md` remains the tiebreaker.**_

# BUILD SPEC — THE COMPOSER AND THE AUTHENTICATED LANDING

**Written by MAIN LANE, 2026-08-25. LANE 1 owns every line of this spec unless a line names LANE 0 or MAIN. Cited file:line is against `main` at `ff98e5905`. Anything I could not verify is marked UNVERIFIED.**

---

## 0. FOUR FACTS THAT ARE WRONG IN THE DOCS YOU ALREADY READ. Read these before anything else.

**0.1 — `POST /api/tracks` DOES NOT EXIST. `the-first-run/STATUS.md` is stale and `GOAL-lane-1.md` §L1-B points you at a dead endpoint.**
STATUS.md claims M-A shipped at `src/routes/api/tracks.ts`, commit `ba23bafbe`. That commit was **reverted at `6930bb94d`** ("Revert 'M-A, M-B, M-C…'", 658 deletions across `src/routes/api/tracks.ts`, `src/routes/api/tracks/$trackId.drive.ts`, `src/routes/api/tracks/$trackId.stream.ts`, `src/routeTree.gen.ts`). `ls src/routes/api/` today returns `__tests__ chat.ts mcp.ts plan-gate.ts public/ stripe/`. There is no tracks endpoint, no drive endpoint, and no SSE stream.
The intervening commit `31dc11d0c` names the reason: *"superseded: duplicates startTrack"*.
**Therefore: the composer calls the server function `startTrack` (`src/lib/spine/track.functions.ts:293`) via `useServerFn`. It does not fetch a URL.** Reading `src/lib/**` is allowed; calling an exported server fn is not writing it.

**0.2 — `startTrack` cannot set a workspace, and a track with no workspace is a crippled track.**
`startTrackCore` accepts `workspaceId` (`track.functions.ts:248`) and writes it (`:272`). The server fn wrapping it does **not**: its input validator accepts only `title`, `shape`, `origin`, `productId`, `projectId` (`track.functions.ts:294-303`) and its handler passes no `workspaceId` (`:305-313`). Every track ever started from the UI carries `workspace_id = null`.
Two consequences, both read rather than assumed:
- `src/lib/spine/driver.server.ts:674` — `if (!row.workspace_id) return null;` — the Build station can never create a mission. The run stops there permanently.
- `src/lib/spine/driver.server.ts:844` — `externalEvidence` returns `null` for a null workspace, and its own header (`:826-829`) says `null` is read as **not satisfied**, so Discover starves and escalates.
**This is a MAIN-lane blocker on mission acceptance criteria 4 and 5, filed below as REQ-1. LANE 1 must not work around it and must not fake it.**

**0.3 — `/track/:trackId` has zero inbound links in the entire repo.**
`grep -rn 'track/\$trackId' src/` returns exactly two hits, both inside `src/routes/_authenticated.track.$trackId.tsx` itself (`:8` a comment, `:27` the route definition). Nothing navigates there. The only way to reach the product's one address today is to type a UUID.

**0.4 — Waiving `decide` removes the forecast from the run, and four of five WorkShapes waive it.**
The forecast is written by the `decision.record` tool, whose description says *"Use at the Decide station once the call is genuinely made"* and which **refuses a decision with no forecast** (`src/lib/ai/tools/registry.server.ts:4045`, refusal string at `:4033`, the three columns at `:4098` and `:4216`). `suggestRoute` waives `decide` on `existing-feature`, `interface-change`, `under-the-hood` and `incident-fix` (`src/lib/spine/route.ts:194-279`). Only `new-capability` keeps it (`:189`).
**So any job card that maps to a shape other than `new-capability` starts a run that structurally cannot record a forecast.** This governs my card ruling in §1 and produces REQ-2.

---

## 1. THE LANDING

### 1.1 What owns it today, and it is `/today`

- `src/routes/login.tsx:26` — `const SIGNED_IN_HOME = "/today"`, thrown as a redirect at `:63`.
- `src/routes/_authenticated.tsx:69-74` — the onboarding gate diverts to `/onboarding` first; `ObsidianOnboarding.tsx:1038` and `:1180` then land on `/today`.
- `src/components/shell/AppFrame.tsx:321` — the rail's first row.
- `src/lib/legacy-redirects.ts:178-180` — `/tasks`, `/inbox` and `/chat` all redirect to `/today`.
- The surface is `src/routes/_authenticated.today.tsx`, 1732 lines, component `Today` at `:558`.

**LANE 1 rewrites `_authenticated.today.tsx` in place. Do not create a new landing route.** Five inbound paths and a test (§4.1) name that file. A new route would leave five doors on the old one.

### 1.2 The composition, top to bottom

```
PageHeading            — title only, no state sentence
RunComposer            — one box. §2.
JobCards               — four cards. §1.3.
YourRuns               — only when listTracks() returns rows. §5.
```

Everything currently between `PageHeading` (`today.tsx:1371`) and the composer block (`:1699`) comes off this surface: `FocusNext`, `DecisionQueue`, `PushedInsights`, `QuietMorning`, `RunState`/`ShippedState`, `CriticBrief`, the approvals queue, `SendBackSheet`, the learnings region. That is the briefing dashboard `DESIGN-DIRECTION.md` rejected — *"a beautiful read-only status board for a machine you cannot touch."* It moves to `/approvals` and `/brain`, which already exist and already render it. **Delete the imports; do not delete the components — they are LANE 0's path.**

### 1.3 The four cards — exact copy, and the WorkShape each one maps to

Each card sets `shape` and nothing else. The person's typed sentence supplies `title` and, where the shape needs one, `origin`.

| # | `lead` (exact) | `sub` (exact) | WorkShape | `suggestRoute().entry` | origin required |
|---|---|---|---|---|---|
| 1 | `I have a problem and I do not know what to build` | `It reads your sources first and comes back with what the pattern actually is.` | `new-capability` | `sense` (`route.ts:189`) | **No** (`validateRoute` `:469` only fires below `sense`) |
| 2 | `I know what to build. Write it up.` | `The call is already made, so it starts on the written spec.` | `existing-feature` | `define` (`route.ts:194-208`) | **Yes** |
| 3 | `Change something people see` | `It starts on the screen itself, not on the problem behind it.` | `interface-change` | `design` (`route.ts:211-231`) | **Yes** |
| 4 | `Something is broken right now` | `It goes straight to the fix. Nothing gets decided first.` | `incident-fix` | `build` (`route.ts:267-279`) | **Yes** |

**Every `sub` above is that shape's own waiver reason from `route.ts`, paraphrased.** Card 2's sub is `:203` *"The call to build it is already made"*. Card 3's is `:222`. Card 4's is `:271` *"A break does not need a business case"*. **Do not invent a fifth sentence; if you change a card, change it to match its waiver reason, or the card is describing a route the product will not take.**

**`under-the-hood` gets no card, deliberately.** `WORK_SHAPE_LABEL["under-the-hood"]` is *"A change nobody sees directly"* (`route.ts:179`) — a property of the work, not a job somebody arrives with. It stays reachable by typing (§2.4). Four cards, four jobs, is the standard `LIVE-PREVIEW.md` §4 sets.

**No station name appears on any card face.** Check against `AGENT_STATIONS` (`src/lib/agent-vocabulary.ts:113-170`): the banned faces are `Discover`, `Decide`, `Plan`, `Design`, `Build`, `Ship`, `Learn` used **as nouns**. "what to build" and "the fix" are verbs and objects and are fine.

**Copy check against the canon** (`docs/strategy/positioning-locked-2026-08.md`): no *receipts · ledger · company brain · decision layer · unattended · first run · provenance*; no *remembers · stores · logs*; no present-tense claim of accumulated learning. Card 4's sub deliberately does **not** promise a grade, because zero of 59 tracks have reached `learn` and promising it would be the claim the record cannot support.

### 1.4 Cards 2, 3 and 4 ship with a forecast hole, and it must be visible

Per §0.4, only card 1 produces a run that can record a forecast. **LANE 1 ships all four cards anyway** — one card is not a landing, and the other three describe the majority of real work. But the run those three open must say so once, in the disclosure line (§2.6), and it must say it from the route, never from a guess:

> `This one skips the decision, so nothing is being forecast on it.`

Derived, not written: the sentence renders when `waiverFor(track.route, "decide")` is non-null (`route.ts:302`). It is a fact about a row the run wrote.

**REQ-2 to MAIN (`coordination/requests/`):** take `decide` off the `waive` list of `existing-feature`, `interface-change` and `under-the-hood` in `SHAPES` (`src/lib/spine/route.ts:194-262`). Three lines. It costs a station per run and it is the difference between a product that captures the forecast and one that captures it on one path in five. `incident-fix` may keep the waiver — a break genuinely does not need a business case — and then card 4 is the one card that honestly carries the sentence above.

### 1.5 Meridian gaps — MAIN builds these in `src/components/meridian/`

**GAP-1 · A job card whose lines wrap.** `Cell` truncates both its lead and its sub unconditionally — `surface-parts.tsx:1720` and `:1724` both carry `block truncate`, and the component header states *"A cell in a grid never should [wrap]… So there is no prop."* Four cards across a 1440px work region is roughly 250px each; `I have a problem and I do not know what to build` truncates at about half. **Meridian needs a `JobCard`: a `Cell`-derived button whose lead wraps to two lines and whose sub wraps to two, keeping `Cell`'s tone table (`CELL_GROUND`, `:1619-1622`), its ring-not-fill selection, and its 44px floor.** Do not solve this by shortening the copy to fit — the copy is the feature.

**GAP-2 · A composer field that is the page's primary object.** `Input` is `h-8 … text-[13px]` (`forms.tsx:72`, applied at `:157-165`) — a single-line control sized to sit beside `Picker` and `Action`. `Textarea` is `min-h-20 resize-y` (`:180-189`), a form field. Neither is a hero. **Meridian needs a `Composer`: an auto-growing field, one line to three, at the prose type step, that submits on Enter and newlines on Shift+Enter.** UNVERIFIED whether `--mrd-*` already carries a type step between `--mrd-t-base` and the `PageHeading` step; MAIN confirms when building.

**No gap filed for the disclosure line** — `Row` with `tight` (`src/components/meridian/rows.tsx`) serves it, and `TrackStart.tsx:401-407` already uses exactly that shape for exactly this job.

### 1.6 Where LANE 1 puts the code

`src/components/today/**` is LANE 0's path. `src/routes/**` and `src/components/shell/**` are LANE 1's.

- `src/components/shell/RunComposer.tsx` — the composer (§2).
- `src/components/shell/JobCards.tsx` — the four cards.
- `src/routes/_authenticated.today.tsx` — composes them.

`shell/` rather than the route file because the route is already 1732 lines, and because under this ruling the composer **is** the shell's front door. `src/components/today/AskComposer.tsx` is not yours and is not being changed.

---

## 2. THE COMPOSER

### 2.1 The shape

One field. One placeholder. One submit. **No workspace picker, no product picker, no shape picker, no origin field, no "advanced" disclosure.** The five-option `Choices` group at `TrackStart.tsx:366-372` and the required origin `Textarea` at `:376-389` do not appear anywhere on this surface.

```
placeholder (no card selected): "What are you changing, and what should it do?"
```
That sentence is ruled in `REIMAGINING.md` §3 Step 1. Keep it verbatim.

When a card is selected the placeholder becomes that card's own prompt — this is not configuration, it is the same field answering a narrower question:

| card | placeholder |
|---|---|
| 1 | `What is going wrong?` |
| 2 | `What are you building, and what should it do?` |
| 3 | `What should change on the screen, and what should it do?` |
| 4 | `What is broken?` |

Clicking a card selects it, sets the placeholder, and focuses the field. It does not submit. The selected card renders `selected` (`Cell`'s `selected` prop, `surface-parts.tsx`) and the field is the only thing that starts anything.

### 2.2 Submit — the exact call

```ts
const start = useServerFn(startTrack);          // src/lib/spine/track.functions.ts:293
const { activeProductId } = useWorkspace();     // src/hooks/use-workspace.tsx:208, :233

const sentence = value.trim();
const shape: WorkShape = selectedCard ?? "new-capability";
const needsOrigin = shape !== "new-capability";

const res = await start({
  data: {
    title: sentence.slice(0, 200),                 // z.string().trim().min(1).max(200) — :296
    shape,                                          // SHAPE — :297
    origin: needsOrigin ? sentence : undefined,     // z.string().trim().max(2000).optional() — :298
    productId: activeProductId ?? undefined,        // z.string().uuid().optional() — :301
  },
});
// res: { track: Track | null; problems: string[] }
if (res.track) navigate({ to: "/track/$trackId", params: { trackId: res.track.id } });
else /* render res.problems verbatim in a Receipt, failed */
```

**`title` is capped at 200 by the validator (`:296`). A longer sentence throws a Zod error rather than being truncated, so slice before sending and put the whole sentence in `origin`.**

### 2.3 The one sentence is also the origin. This is the mechanism that makes zero configuration legal.

`validateRoute` refuses any route whose `entry !== "sense"` with an empty `origin` — code `origin-required`, message *"Work that starts below Discover has to say where it came from."* (`route.ts:469-474`), and `startTrackCore` returns `{ track: null, problems: [...] }` before touching the database (`track.functions.ts:257-258`). Three of four cards enter below `sense`. **If you send `origin: undefined` on those, the composer silently produces nothing.**

Sending the same sentence as both `title` and `origin` is not a trick to satisfy a validator. The origin rule's own stated purpose (`route.ts:81-87`) is that Learn has something to grade the outcome against, and the person's sentence is precisely that. It also removes the second question `TrackStart` asks (`:376-389`), which is the question its own file header (`TrackStart.tsx:17-22`) argues nobody should be asked before they have used the product.

### 2.4 The default shape, ruled, with the argument

**When no card is selected, `shape = "new-capability"`.**

Not because it is the safe default — because it is the **only** shape of the five that keeps `decide` on the path (`route.ts:189` waives nothing; `:194`, `:211`, `:247`, `:267` all waive `decide`), and `decide` is where `decision.record` writes the forecast (§0.4). A default that waived `decide` would make the product's one defensible artifact reachable only by a person who happened to click card 1.

**The counter-argument, recorded so MAIN can overturn this in one line:** 58 of 59 tracks entered at `sense` and none left it, so defaulting to `sense` defaults into the measured failure. That argument loses to the forecast argument today, and it stops losing the moment REQ-2 lands — at which point the default should be reconsidered as `existing-feature`.

### 2.5 What is defaulted, and what is not asked

| thing | value | source |
|---|---|---|
| workspace | `activeWorkspaceId` | `use-workspace.tsx:208` — **but see REQ-1: `startTrack` cannot carry it today** |
| product | `activeProductId` | `use-workspace.tsx:208`; accepted at `track.functions.ts:301` |
| project | `null` | not asked, not defaulted |
| shape | card, or `new-capability` | §2.4 |
| origin | the typed sentence | §2.3 |

**If `activeWorkspaceId` is null the composer does not submit.** `today.tsx:1355-1359` already renders `NeedsSetup kind="no-workspace"` with a primary action to `/onboarding`. Keep that branch exactly as it is; it is the one gate that is genuinely required.

**REQ-1 to MAIN (blocker, file it first):** add `workspaceId: z.string().uuid().optional()` to `startTrack`'s validator (`track.functions.ts:294-303`) and pass it through at `:305-313`. `startTrackCore` already takes it (`:248`) and writes it (`:272`). Without this every run started from the composer carries `workspace_id = null`, Build returns null at `driver.server.ts:674`, and mission acceptance criteria 4 and 5 are unreachable by construction. LANE 1 passes `workspaceId` from the day the validator accepts it and not before — sending an unknown key trips Zod.

### 2.6 The disclosure, which happens AFTER and on the run, never before and never here

Nothing is disclosed on the landing. The composer navigates immediately. **`src/routes/_authenticated.track.$trackId.tsx` is LANE 1's file** — put one `Row tight` between `PageHeading` (`:48-51`) and `<TrackRun />` (`:52`), reading, in this order, only the parts that are true:

```
Running in {activeWorkspace.name}[ · on {activeProduct.name}]. [{decideWaivedSentence}]
```

- workspace name from `useWorkspace().activeWorkspace` (`use-workspace.tsx:207`).
- product clause only when `productsVisible` is true (`use-workspace.tsx:210`) — naming the product to somebody who has one product is noise.
- `decideWaivedSentence` from §1.4, rendered only when `waiverFor(track.route, "decide")` returns a waiver.
- read the track with `getTrack` (`track.functions.ts:335`), which returns `Track | null` and never throws.

**No control on this line.** There is no working door to change a track's workspace or to put `decide` back — `setStationWaiver` has no caller anywhere in the repo and passes no `force`, so `reopen` refuses it at `route.ts:364`; the module header at `:59-74` carries the verification. A control that reported success and wrote nothing is the exact defect this codebase keeps deleting.

### 2.7 Arriving on a run that is already walking

`TrackRun` does not drive on mount. It renders an `Action` labelled "Run it now" and drives on click (`TrackRun.tsx:93`). So navigating alone gives you a track that exists and is not moving — and `driveTrackOnce`'s only other caller is the cron (`src/routes/api/public/hooks/track-tick.ts`), which is hours.

**REQ-3 to LANE 0 (`coordination/requests/`):** add `autoStart?: boolean` to `TrackRun`'s props (`src/components/track/TrackRun.tsx:65`), defaulting `false`, which fires `run.mutate()` once on mount when true and the track has never been driven. LANE 1 then adds `validateSearch` to `_authenticated.track.$trackId.tsx` for `{ start?: boolean }`, the composer navigates with `search: { start: true }`, and the route passes `autoStart={search.start === true}`.

**Do not solve this by calling `driveTrackNow` from the route.** Two concurrent walks on one track double-spend, and `driveTrackNow` (`track.functions.ts:1139`) has no in-flight guard. **Do not solve it by awaiting the drive before navigating** — the walk is the thing the person came to watch, and awaiting it means watching the composer instead.

**Until REQ-3 lands, ship without autostart and count the extra click honestly (§3).**

---

## 3. THE CLICK AND DECISION COUNT

### 3.1 Before — counted by reading `TrackStart.tsx`, not by estimate

From `/today` (`login.tsx:26`) to a track that is walking:

| # | act | evidence |
|---|---|---|
| 1 | click the `Plan` chip on the spine strip | `run-strip.tsx:194` `define: "/plan"`; `use-spine-strip.ts:213-215` navigates. **Decision 1: which of seven chips, all named in station vocabulary** (`run-strip.tsx:316-324`) |
| — | scroll ~900 lines of page | `TrackStart` is mounted at `_authenticated.plan.index.tsx:893` |
| 2 | click `Start work` | `TrackStart.tsx:285` — the form is closed by default (`:83` `useState(false)`) |
| — | type the title | `:325-332` |
| 3 | click one of five shapes | `:366-372`. **Decision 2, and it requires knowing the model — the file's own header says so at `:17-22`** |
| — | type the origin, required for 4 of 5 shapes | `:274` gates the button; `:376-389` |
| 4 | click `Start it` | `:394-399`. **Decision 3 (why are we doing it), for 4 of 5 shapes** |
| 5 | click the new row to expand it | `:480` — reveals `TrackChain` + `TrackActivity` inline. **This is not `/track/:id`** |
| — | **there is no link to the run** | `grep -rn 'track/\$trackId' src/` → two hits, both inside the route file itself |
| 6 | hand-type `/track/<uuid>` | no surface prints the id |
| 7 | click `Run it now` | `TrackRun.tsx:93` |

**Before: 6 clicks and 3 decisions on the model — plus one step that cannot be performed from any surface in the product.** `TrackStart.tsx` contains no `useNavigate` and no `Link`; starting work sets local state and invalidates a query (`:121-133`) and that is all. Counting the un-navigable step as impossible rather than as a click, **the honest before-count is: the run view is unreachable.**

### 3.2 After

| path | clicks | decisions |
|---|---|---|
| card + sentence + Enter, with REQ-3 landed | **1** | **0 about the model** |
| card + sentence + Enter, before REQ-3 | **2** (card, then `Run it now`) | 0 |
| sentence + Enter, no card | **0** | 0 |

The one decision left is which of four jobs describes your situation, expressed in your own words — and skipping it is legal, which is what makes it not a gate.

**Put this table in your unit file with these file:line citations. `L1-1`'s acceptance criterion 3 asks for the count before and after; a count without its source is the same defect as a number without its query.**

---

## 4. WHAT BREAKS

### 4.1 `one-prompt-per-screen.test.ts` — it breaks on a *path*, not on an assertion

`src/components/ask/__tests__/one-prompt-per-screen.test.ts:34` does `readFileSync(join(ROOT, "routes", "_authenticated.today.tsx"))` at module scope. **If you rename, move or delete that file the test throws ENOENT before a single assertion runs** — it does not fail, it explodes, and it takes the file down with it. This is the strongest reason §1.1 rewrites `today.tsx` in place.

The three live assertions:
- `:39-41` — `_authenticated.today.tsx` must contain the string `data-page-composer`. **Your `RunComposer` wrapper carries it**, exactly as `today.tsx:1699` does now: `<div data-page-composer>`. It must be in the route file's own source text, not only in `shell/RunComposer.tsx`, or the regex misses it. Put the attribute on the wrapper in the route and let `RunComposer` render inside it — which is the split the current code already documents at `AskComposer.tsx:50-54`.
- `:43-45` and `:47-52` — assertions about `src/styles/shell.css`. That file is yours (`src/styles/**` except `meridian.css`). Both rules exist today at `shell.css:1950-1956`. **Do not touch them.**
- `:54-61` and `:63-67` — assertions about `src/components/ask/AskDock.tsx`. Not your path. Do not touch it.

**Why this matters beyond the test:** `AskDock` renders a persistent dock row reading `What should we build?` (`AskDock.tsx:91`), mounted app-wide by `GlobalComposer` at `_authenticated.tsx:232`. Without `data-page-composer` your landing asks the same question twice in two controls that do different things — and the second one calls `openAsk` (`AskComposer.tsx:65` → `ask-open.ts:53`), which opens a chat pane and **starts no track**. That is the exact defect the test was written for, arriving from the other direction.

### 4.2 The seven station chips are rendered as navigation on every authenticated screen

`AppFrame` mounts `WorkspaceSpine` unconditionally (`use-spine-strip.ts:241-247`), which publishes the full spine with nothing lit; the strip draws `Discover · Decide · Plan · Design · Build · Ship · Learn` (`run-strip.tsx:316-324`) and each chip navigates (`use-spine-strip.ts:213-215` → `STATION_ROUTE`, `run-strip.tsx:192-200`). `today.tsx:570` calls `useSpineStrip(null)` to opt into it.

**This is station vocabulary as navigation, which the ruling forbids, and it sits about ten pixels above whatever you build.** `src/components/shell/**` is your path, so this is yours to fix.

**Fix, in this order:** (1) delete `useSpineStrip(null)` from `today.tsx:570`; (2) stop `AppFrame` mounting `WorkspaceSpine` — the strip becomes something a *run* publishes, never something the shell asserts. **Do not delete `run-strip.tsx`.** The same component in `mode: "live"` is what `RunMap` needs to draw the Emergent step list inside one run (`DESIGN-DIRECTION.md` §2), which is the ruled home for this vocabulary. `STAGE_LABEL` and `AGENT_STATION_ORDER` stay; only the shell-wide *nav* mount goes.

**One at a time, one commit each.** `src/components/shell/AppFrame.rail-covers-keys.test.ts` and the nav-model suite parse `AppFrame.tsx`'s source text between `const RAIL = [` and `] as const;` (documented at `AppFrame.tsx` immediately below `:410`), and `AppFrame.nav-keys.test.ts:126` names `"/plan"` literally. Both will move when you touch the rail or retire `/plan`. Read them before you edit, not after.

### 4.3 Everything else that names `/today`

`login.tsx:63`, `AppFrame.tsx:321`, `MissionOnboarding.tsx:63` and `:72`, `ObsidianOnboarding.tsx:1038` and `:1180`, `DecisionsPanel.tsx:477`, `legacy-redirects.ts:178-180`, `nav-model.ts:122`, `palette-sections.ts:67-68`, `palette-catalog.ts:51` and `:95`, plus five route files that `throw redirect({ to: "/today" })`. **Rewriting `today.tsx` in place keeps every one of them correct.** Four of those files are not yours (`src/lib/**`, `src/components/onboarding/**`) — another reason not to move the route.

### 4.4 What does not break, checked so you do not defend it twice

`today.css` is yours (`src/styles/**` except `meridian.css`) and `.today-composer` at `:632-641` is a two-column grid built for a label beside a small field. Your composer is one column and the field is the hero. Rewrite the rule; do not fight it. `--today-quiet` and `--today-section-gap` are locals defined in that file, not retired tokens — grep them before assuming a violation.

---

## 5. THE EMPTY STATE — CAN IT SHOW A REAL RUNNING EXAMPLE?

### 5.1 The answer is: for a returning person yes, for a new account no, and there is no honest third option.

**What a real run could be read from.** `listTracks` (`track.functions.ts:317-333`) — `status = "open"`, ordered `updated_at desc`, limit 50, no workspace filter, scoped to the caller by RLS through `requireSupabaseAuth`. It returns `Track[]`, never throws, and returns `[]` pre-migration (`:331`). Per-run detail comes from `getTrackActivity` (`:941`), which `TrackActivity` already polls every 10s (`TrackActivity.tsx:86-92`).

**So: when `listTracks()` is non-empty, the landing renders those runs live, above the cards.** That is a real running example, it is the person's own work, it costs one query you are already entitled to, and it closes `L1-4` ("from any surface, a live run is one click away") on the surface that matters most. Row copy comes from the row: `t.title` as lead, `t.hold ?? t.summary` as sub — the same honesty rule `TrackStart.tsx:487-491` already applies, where the hold outranks the route because *silence and "still running" look identical, and only one of them is true*.

**When `listTracks()` is empty, the landing shows the composer and the four cards and nothing else.** No illustration, no fabricated run, no "here's what a run looks like".

### 5.2 Why not a seeded example

- **There is no finished run in the database to show.** Zero of 59 tracks have ever reached `learn`. An example of a run finishing would have to be manufactured, and `DESIGN-DIRECTION.md` §1 rules that the pane *"renders a row the run actually wrote. It never renders an optimistic guess."*
- **Reading the sample workspace from a surface is a shape this repo has already removed once.** `src/routes/demo.tsx:1-27` records it in full: three live sections read `DEMO_WORKSPACE_ID` through `supabaseAdmin`, no RLS behind it, and the fix was to delete the sections rather than guard them, because *"deleting the sections removes the risk rather than guarding it."* Do not reintroduce that shape on the authenticated landing.
- **Seed data has produced three false proofs in this repo already.** `MISSION.md` acceptance rule 6 and `BUILD-QUEUE.md` acceptance rule 2 both say so. A landing whose example is seeded is a landing that teaches the product's one banned habit.

### 5.3 What the empty state may carry instead

- The four cards. `LIVE-PREVIEW.md` §4 is explicit: **the empty state IS the onboarding.**
- One line of restrained line art, if LANE 1 wants it, at the `sentry-restrained-illustration.webp` register — small, beside the content, never performing at it (`DESIGN-DIRECTION.md` §2b). Mascots are refused. This is optional and it is not a substitute for a run.
- **Nothing that says "nothing is running".** `DESIGN-DIRECTION.md`'s rejection names *"The crew is idle, and that is fine"* as the sentence that has the product backwards. An empty landing whose job is to start work does not narrate its own emptiness; it offers four doors.

### 5.4 UNVERIFIED

I have no database access this session. I have not queried `spine_tracks` and cannot confirm the row count, the workspace distribution, or that zero tracks carry `station = 'learn'` — I am taking those from the task brief and from `DIAGNOSIS.md`. **MAIN must run the SQL before any lane cites a number.** I also have not verified that `spine_tracks` rows exist in any `is_sample` workspace; if they do, §5.2's second bullet still stands on the shape argument alone.

---

## 6. THE REQUESTS THIS SPEC GENERATES, IN ORDER

| id | to | ask | blocks |
|---|---|---|---|
| **REQ-1** | MAIN | `workspaceId` through `startTrack`'s validator and handler (`track.functions.ts:294-313`) | mission acceptance 4 and 5 |
| **REQ-2** | MAIN | drop `decide` from three shapes' waive lists (`route.ts:194-262`) | the forecast on 3 of 4 cards |
| **GAP-1** | MAIN | `JobCard` in `src/components/meridian/` — a `Cell` whose lines wrap | the card copy in §1.3 |
| **GAP-2** | MAIN | `Composer` in `src/components/meridian/` — the hero field | §2.1 |
| **REQ-3** | LANE 0 | `autoStart?: boolean` on `TrackRun` (`TrackRun.tsx:65`) | one-click-to-a-*running*-track |

**None of the five blocks LANE 1 from starting.** Ship the landing against `Cell` and `Input` with the copy shortened to fit, file all five, and swap in the primitives when they land. **Do not widen the Meridian baseline to pass, and do not shorten the card copy permanently** — record in the unit file that the short copy is a placeholder against GAP-1, or the placeholder becomes the product.