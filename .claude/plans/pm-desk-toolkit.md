# The PM Desk · Today toolkit + cross-surface focus engine — BUILD PLAN

> _Authored 2026-07-09 by the design/thinking pass (Fable). Executor: Sonnet 5._
> _Status: READY TO BUILD. Every decision below is settled; do not re-litigate design
> choices, re-derive placement, or invent alternatives. Where this doc is silent,
> DESIGN-LOOM.md wins, then DESIGN-OBSIDIAN.md._

---

## 0. Mission (the founder's goal, distilled)

The founder's ruling (2026-07-09, session "PM tools"):

1. **A PM should never leave Cadence for daily productivity tools.** Today's page must
   carry a first-class, EVIDENT toolkit: focus timer, task list, capture, and whatever
   else a power PM uses day in, day out.
2. **The focus timer is intent-based**: the PM types a one-line intent ("close the
   documentation activity"), sets minutes, starts. A **floating countdown follows them
   across EVERY authenticated page**. Color shifts when half the block is gone; the
   last 10% gets urgency (color + a soft sound). Notifications go quiet during a block.
3. **The current My-day strip is an anti-pattern** (founder's words): "it just looks
   like a strip where there is some information, but actually there is some tool behind
   it." Tools must read as tools — explicit card/widget design, not text rows.
4. **Reuse what exists.** Restructure freely where genuinely better.
5. **The current design system is the FLOOR, not the ceiling** — deliver above the Loom
   baseline (interfacecraft.dev / devouringdetails.com school), never below it.
6. Consider how a visiting agent sees/uses these tools.

## 1. The design thesis (why this shape)

**The engine already exists — the product just never shows it.** Recon found the
founder's asks are ~70% built, but scattered and invisible:

| Capability | Where it lives today | Gap |
|---|---|---|
| Focus timer w/ absolute deadline, reload resume | `FlowModeProvider` (`src/hooks/use-flow-mode.tsx`) | No intent line, invisible outside sidebar footer |
| Ambient sound (6 real recorded soundscapes) | `src/lib/flow/soundscape.ts` + `public/soundscape/*.mp3` | Buried in a sidebar popover |
| **Notification quieting during focus** | `src/lib/notify.ts` (hold buffer + `critical` passthrough) | Already exactly the founder's ask; nobody knows |
| Completion chime (C5→G5 soft two-note) | `src/lib/flow/chime.ts` | No threshold cues (50% / last 10%) |
| A SECOND, parallel timer (25/50 presets) | `src/components/today/FocusTimer.tsx`, localStorage `cadence.focus.timer` | Duplicate of FlowMode; a "one home per object" violation |
| Tasks (DB: priority, is_deep_work, due_date, **assignee_kind human/agent**) | `src/lib/tasks.functions.ts`; agent tools `workspace.list_tasks` + `tasks.create` already registered | UI is a hidden toggle inside the strip |
| Quick capture → signal | `src/components/today/QuickCapture.tsx` | A bare collapsed strip |
| Stakeholder update, server-composed, copy-ready | `src/components/today/StatusUpdateDialog.tsx` (`ShareStatusButton`) | **ORPHANED — zero references anywhere.** Loom §0.1.5 violation |
| Focus-next suggestion + dispatch-to-agent | `src/components/today/FocusNext.tsx` | Hidden behind a strip toggle |
| Shared feedback module | `src/lib/interaction-feedback.ts` (`fireFeedback`) | fine, reuse |

**Therefore: UNIFY, don't build new machinery.** One focus engine (FlowMode, extended
with intent + thresholds + history), one floating dock that makes it omnipresent, and
one explicit card toolkit on Today ("the Desk") that gives every buried tool structural
affordance. Retire the duplicate timer and the anti-pattern strips.

The strips also violate codified law: `SegmentButton` / `GhostButton` are literally the
"borderless, transparent, mono-uppercase text button" **banned** by DESIGN-LOOM §0.1.1.
Loom §0.1.B: "A surface that hides a real capability to look clean has failed."
Loom §0.1.A grants authority to correct the older enshrined strip design.

**IA note (docs/conventions/home-and-today-ia.md):** stances live in the chrome, actions
live on Today. Starting a block = an action (Desk card on Today). The running countdown
= chrome (the floating dock, on every page). The sidebar FlowWidget stays as the chrome
stance control — all three drive ONE provider, so state is always consistent.

---

## 2. What ships (five build parts)

### Part A — Focus engine upgrade (`use-flow-mode.tsx` + `lib/flow/*`)

**A1. Session model** (`src/lib/flow/session.ts`). Extend `FlowSession`:

```ts
export type FlowSession = {
  endsAt: number | null;      // existing; null = open-ended
  preset: SoundPreset;        // existing
  soundOn: boolean;           // existing
  intent?: string;            // NEW · the PM's one-line goal, max 120 chars
  startedAt?: number;         // NEW · epoch ms (needed for phase math + open-ended elapsed)
  plannedMin?: number;        // NEW · the chosen block length
  cued?: boolean;             // NEW · last-10% sound already fired (survives reload)
};
```

Add a pure phase helper + unit tests (`session.test.ts`):

```ts
export type FocusPhase = "early" | "past-half" | "closing";
// fraction elapsed f = (now - startedAt) / (endsAt - startedAt)
// early: f < 0.5 · past-half: 0.5 <= f < 0.9 · closing: f >= 0.9
// The closing threshold carries a 30-second floor (design-panel fold): for
// short blocks, "closing" begins at max(10% of planned, 30s) remaining, so a
// 5-minute block still gets a meaningful wrap-up window.
// Returns null for open-ended sessions or missing startedAt.
export function phaseOf(session: FlowSession | null, now: number): FocusPhase | null
```

Tolerate old stored sessions (missing new fields): `phaseOf` returns null, everything
else keeps working. Also delete the retired key `cadence.focus.timer` once during
provider hydrate (one `localStorage.removeItem`, wrapped in try/catch).

**A2. Cue sound** (`src/lib/flow/chime.ts`). Add alongside `playChime`:

```ts
// One soft single note (E5 ~659.25Hz, sine, vol 0.18, ~0.4s decay) — quieter and
// shorter than the completion chime. Same throwaway-AudioContext pattern.
export function playCue(volume = 0.18): void
```

**A3. Provider** (`src/hooks/use-flow-mode.tsx`). Changes:

- `enterFlow(patch?: Partial<FlowConfig> & { intent?: string })` — stores intent
  (trimmed, sliced to 120) + `startedAt: now` + `plannedMin: next.timerMin` + `cued:false`
  into the session.
- NEW `extendSession(minutes: number)`: if a finite session is running,
  `endsAt += minutes * 60_000`, reset `cued` to false if the extension moves the session
  out of the closing phase, persist. No-op otherwise.
- Context additions: `intent: string | null`, `startedAt: number | null`,
  `phase: FocusPhase | null` (recomputed on each tick), `extendSession`.
- **Threshold cue**: inside the existing 1s tick, when phase transitions into
  `"closing"` and `session.cued !== true`: `playCue()`, persist `cued: true`.
- **Completion toast copy** (existing zero-cross path): when the session had an intent,
  the success toast reads `Time called on "<intent>".` + the existing held-count tail;
  without intent keep the current copy exactly.
- **Session history** (NEW, localStorage `cadence.flow.history`, capped at 50 entries,
  newest first): on every exit write
  `{ intent: string|null, startedAt, endedAt: Date.now(), plannedMin, completed: boolean }`
  where `completed` = exit reason `"completed"`. Export a read helper
  `readFocusHistory(): FocusHistoryEntry[]` from `src/lib/flow/session.ts` (pure, tested:
  malformed JSON → `[]`).
- **Tab title countdown**: while a finite session runs, a provider effect sets
  `document.title = \`${remainingLabel} · ${intent ?? "Focus"} · Cadence\`` each tick;
  store the pre-session title on start and restore it on exit. (Route navigation may
  rewrite the title; the next tick reclaims it. Acceptable.)

**Do NOT touch** `src/lib/notify.ts` (the hold buffer already does notification
quieting) or `soundscape.ts`.

### Part B — FocusDock: the Wispr-style always-there dock (AMENDED, founder ref 2026-07-09)

> **Founder reference: Wispr Flow's docking mechanism.** A nearly invisible
> sliver sits at the bottom of EVERY screen; one shortcut key does everything;
> it expands only when needed. Seamless and simple, high value. The dock below
> follows that model — it is ALWAYS present (idle sliver), not only while a
> block runs.

NEW `src/components/cadence/FocusDock.tsx`. Mounted once in
`src/routes/_authenticated.tsx` right after `<AskPanel />` (line ~167), gated
`!isOnboarding`. Four states:

1. **Idle sliver** (default, every page): a tiny bottom-center presence at
   `bottom: 10px` — a 36px-wide 2px dotted hairline in `--text-faint` inside a
   comfortable hover/click target (~56x20px). On hover: the line brightens to
   `--text-muted` and a mono 9.5px hint fades in: `FOCUS · ⌥F`. Click or ⌥F
   opens the composer. `aria-label="Start a focus block (Option F)"`.
2. **Composer** (expanded from the sliver, 200ms scale 0.96 + opacity, from
   bottom): intent input (autofocused, placeholder `What are you closing in
   this block?`, maxLength 120) + duration chips `25` `50` `90` (bordered
   chips; selected drives `config.timerMin`) + secondary `Start the block`.
   Enter starts; Escape collapses back to the sliver. Panel skin: overlay
   depth + glass hairline, `--radius-card`, width ~340px.
3. **Running pill** (replaces the sliver at the same anchor): status dot
   (`flow-pulse`, glacier; ember in closing) + mono 13px tabular countdown
   (phase-colored) + truncated intent (12.5px `--text-body`, fallback
   `Focus block`) + optional `N held` mono chip + a 2px bottom progress line
   (scaleX = fraction remaining, transform-only, phase-colored). Open-ended
   blocks show elapsed count-up in `--text-muted`.
4. **Running controls** (⌥F or click while running; Radix Popover side=top):
   full intent, `7:42 LEFT · 25 MIN BLOCK` mono line, secondary Buttons
   `Add 5 minutes` (`extendSession(5)`) + `End the block` (`exitFlow()`),
   held-count line when > 0.

**The one shortcut**: a window keydown listener for `Alt+F` (`e.code === "KeyF"
&& e.altKey`, no meta/ctrl), `preventDefault()`, works everywhere including
inputs (a deliberate chord, like ⌘K): idle → open composer · composer → close
· running → toggle controls. Also listen for a `cadence:focus-compose`
CustomEvent (the palette's entry dispatches it) that opens the composer.

**Placement note**: bottom-center (the Wispr anchor). The obsidian toast
viewport is bottom-center at `bottom-8` (32px) with z50 — the dock sits BELOW
it at `bottom: 10px`, z45; transient toasts stack above without collision.

**Anatomy (the pill):**

- `position: fixed; right: 20px; bottom: 20px; zIndex: 45` (TopBar 30 < dock 45 <
  obsidian toast 50 — toasts must layer above; obsidian toast is bottom-CENTER and
  sonner is top-right, so the corner is free).
- Skin: `background: var(--card)`, `border: 1px solid var(--hairline-strong)`,
  `borderRadius: var(--radius-card)`, overlay depth
  `boxShadow: 0 24px 64px -16px rgba(0,0,0,0.65), var(--top-light)`,
  `padding: 10px 14px`. Max width 320px.
- Content row (flex, gap 10):
  1. a 6px status dot — glacier with the existing `flow-pulse` class while running;
     switches to `var(--ember)` (no pulse change) in the closing phase;
  2. countdown, JetBrains Mono 13px `tabular-nums`, phase-colored (see ladder below);
     open-ended sessions show elapsed count-up (from `startedAt`) in `--text-muted`;
  3. the intent, 12.5px `var(--text-body)`, single line, `truncate`, max ~24ch;
     fallback label when no intent: `Focus block`;
  4. when `heldCount > 0`: a quiet mono chip `N held` (10.5px, `--text-subtle`).
- A 2px progress line pinned to the pill's bottom edge (inside the radius):
  scaleX = fraction REMAINING, `transform-origin: left`, phase-colored, updated via
  inline style transform (transform-only, GPU-safe; never width animation).
- **Phase color ladder** (text + dot + progress line move together):
  `early` → `var(--glacier)` · `past-half` → `var(--text-primary)` (the brightening)
  · `closing` → `var(--ember-text)`. This is legal ember: the closing minutes genuinely
  ask the human to wrap up (role-color law holds).
- Entrance: one-time `opacity 0→1` + `translateY(8px)→0`, 200ms `var(--ease)`, on
  session start only. Gate ALL motion (entrance + pulse) on `prefers-reduced-motion`
  (colors stay). No per-second animation of any kind — the tick only swaps text.
- a11y: the ticking text carries `aria-live="off"`. Add ONE visually-hidden
  `role="status"` region that announces only phase transitions: "Half the block left."
  and "Closing minutes." — never the per-second value.

**Interaction:** the whole pill is a real button (`loom-press`, focus-visible glacier
ring, `aria-label="Focus block controls"`). Click opens a Radix Popover (side="top",
align="end") containing, in order:

1. full intent text (13px, `--text-body`; omit when none),
2. remaining + planned line in mono 10.5 caps (e.g. `7:42 LEFT · 25 MIN BLOCK`),
3. row of two secondary `Button`s: `Add 5 minutes` (→ `extendSession(5)`) and
   `End the block` (→ `exitFlow()`),
4. when `heldCount > 0`: `N updates waiting quietly` (11px, `--text-muted`).

Use the shared `Button` primitive (`@/components/obsidian`) — NEVER bespoke text-buttons
(Loom §0.1.1). Popover animates per Loom §5 (scale from trigger, 180ms).

### Part C — The Desk (Today's right rail, below the aurora card)

NEW directory `src/components/today/desk/`:

```
DeskRail.tsx        — composes the zone: header + FocusCard + TasksCard + MeetingsRow
                      + CaptureCard + StatusRow
FocusCard.tsx       — the hero tool
TasksCard.tsx       — the evident task list
MeetingsRow.tsx     — compact next-meeting row (renders null when no meetings)
CaptureCard.tsx     — quick capture, re-skinned from QuickCapture.tsx
StatusRow.tsx       — re-homes the orphaned ShareStatusButton
task-filters.ts     — pure due-today/overdue selectors extracted from MyDayStrip
task-filters.test.ts
```

**Zone placement** (`src/routes/_authenticated.today.tsx`): in the right-rail column
(currently `WatchLane` → `LoopHealthCard` → `StrategicBriefCard`, lines ~1282-1287),
insert `<DeskRail />` **between `LoopHealthCard` and `StrategicBriefCard`** — exactly
"below the aurora card" per the founder. Rail order becomes:
`WatchLane · LoopHealthCard · DeskRail · StrategicBriefCard`.

**Zone header** — match the sibling lane-header anatomy exactly (see the
"Needs your judgment" header, today route ~L1093-1121): mono-caps 11px h2 reading
`Your desk`, color `var(--text-subtle)` (NOT ember — ember headers are for the judgment
lane only), a flex-1 hairline rule after it.

**C1. FocusCard** (the hero — earns the featured treatment):

- Card chrome: `var(--card)` bg, hairline border, `var(--radius-card)`, `var(--top-light)`,
  padding 16px 18px, **plus the `loom-hairline-fade` gradient top-hairline** (legal home
  #5; Today then carries two fades — TodaySpotlight + this — exactly at the "at most two
  per screen" cap. Verify no other `loom-hairline-fade` exists on the route; if one
  does, drop the effect here.)
- **Idle state:**
  - kicker row: mono-caps 10.5px `Focus block` (`--text-subtle`) + (when history has
    entries from today) a right-aligned quiet mono `2 blocks · 75 min today`
    computed from `readFocusHistory()`;
  - intent input: full width, placeholder `What are you closing in this block?`, styling
    matches existing inputs (`--surface-card-deep` bg, `--hairline-strong` border,
    `--radius-control`, 13px, padding 8px 12px), maxLength 120, Enter = start;
  - duration chips: `25` `50` `90` (from `TIMER_QUICK_MIN`) + a 56px custom minutes
    input — REAL bordered chips (padding 4px 10px, `--radius-control`, hairline border;
    active: `--hairline-strong` border + `--raised` bg + `--text-primary`). Selected
    value drives `config.timerMin` via `setConfig`;
  - **"Until next meeting" chip** (design-panel fold): when today's events include a
    future event starting more than 5 minutes from now, add one more chip labelled
    `Until 2:30 PM` (the event's local start time) that sets timerMin to the clamped
    minutes until that event (`clampMinutes`). Reuses the `["calendar-today-events"]`
    query already needed by MeetingsRow. Hidden when no qualifying event;
  - sound row: a tertiary `Button` labelled with the current preset
    (`Sound · Ocean`) opening the same preset-grid popover pattern FlowWidget uses
    (7 pills incl. Off + volume slider when not Off). Reuse `SOUND_PRESETS`,
    `PRESET_LABEL` semantics from `FlowWidget.tsx`;
  - start: full-width **secondary** `Button`, label `Start the block`
    (NOT ember/primary — the screen's one primary CTA budget belongs to the call queue);
    onClick → `enterFlow({ timerMin, intent })`;
  - **the machine suggestion** (below a hairline divider, only when
    `getFocusNext` returns an insight — reuse the `["focus-next"]` query from
    MyDayStrip verbatim incl. `staleTime: 30 * 60 * 1000`): mono kicker
    `Cadence suggests`, the insight headline (13px serif or UI, `--text-body`,
    2-line clamp), then TWO tertiary Buttons side by side:
    `Focus on this` (prefills the intent input with the insight headline, focuses it)
    and `Send to an agent` (dispatches `startOrchestratedMission({ goal })`, the exact
    FocusNext behavior — keep its loading state and toast). This is the human/machine
    pairing that makes the card Cadence-native rather than a generic pomodoro.
- **Running state** (when `isFlowMode`):
  - countdown: JetBrains Mono 24px, `tabular-nums`, phase-colored (same ladder as the
    dock); open-ended shows elapsed;
  - the intent beneath it (13px, `--text-body`), or `Open block` when none;
  - a quiet line when `heldCount > 0`: `N updates waiting quietly` (11px `--text-muted`);
  - actions row: secondary `Add 5 minutes` + secondary `End the block`;
  - NO aurora, NO glow field on this card (LoopHealthCard holds the screen's one
    aurora; the hero glow-field is taken).
- Both states: every control is a real Button/input primitive. Zero bespoke text-buttons.

**C2. TasksCard:**

- Standard card chrome (no fade). Kicker row: mono-caps `Tasks today` + right-aligned
  count `N open` (mono 10.5, `--text-subtle`; when 0 open and 0 done → hide count).
- Move MyDayStrip's due-today/overdue/done-today filter logic VERBATIM into
  `task-filters.ts` as pure functions over `TaskRow` (type moves too), with unit tests
  (open due, overdue, done today, done yesterday excluded, null due_date excluded).
- Rows (max 5 visible, then a quiet inline expander `N more` — a tertiary button, inline
  expand, no navigation): checkbox (existing pattern: `accentColor: var(--moss)`,
  13px title, strikethrough + `--text-subtle` when done) + right-aligned quiet mono tags:
  `OVERDUE` in `var(--madder)` when overdue (existing); `HIGH` in `--text-muted` when
  priority === "high"; `DEEP` in `--text-muted` when is_deep_work; `AGENT` in
  `--text-muted` when assignee_kind === "agent". Tags are 9.5px mono-caps, gap 8.
- Toggle: keep MyDayStrip's optimistic mutation EXACTLY (cancelQueries → snapshot →
  setQueryData → rollback onError → invalidate onSettled), queryKey `["tasks"]`.
- Add row (ALWAYS visible at the card's foot — never behind a toggle): input placeholder
  `Add a task for today` + secondary `Add` Button (disabled < 2 chars, loading state);
  submits `createTask({ title, due_date: todayStr(), project_id: activeProductId ?? null })`.
- When zero due and zero done-today: the list area shows one line
  `Nothing due today. Add what matters.` (13px, `--text-muted`) above the add row.

**C3. MeetingsRow** — a thin row, NOT a card (variance dial; three identical cards in a
column is the slop tell): hairline-top separated row inside the Desk zone. Reads the
`["calendar-today-events"]` query (move from MyDayStrip verbatim). Content, one line:
mono-caps kicker `Meetings` + `3 today · next 2:30 PM Standup` (13px) as a single
real link-row button navigating to `/brain?tab=calendar` (existing target), with a
`→` affordance. Renders `null` when there are no events today. Error state: keep
MyDayStrip's per-segment error + retry pattern.

**C4. CaptureCard** — QuickCapture's exact write path (createSignal, source "manual",
`project_id: activeProductId`, same invalidations `["signals"]`, `["themes"]`, same
toasts), re-skinned: always-visible input (placeholder `What did you hear, and from
where?`) + secondary `Capture` Button in one row inside a quiet card (standard chrome,
padding 12px 14px). No collapsed state — the tool is evident (that was the founder's
whole point). Esc clears. Delete `QuickCapture.tsx` after the move.

**C5. StatusRow** — re-home the orphan: a thin hairline-top row like MeetingsRow:
mono-caps kicker `Stakeholders` + caption `A ready-to-send update from live state`
(12.5px `--text-muted`) + secondary `Share status` Button (right-aligned) that opens
the EXISTING dialog. Import `ShareStatusButton`'s dialog logic: refactor
`StatusUpdateDialog.tsx` so the dialog itself is exported (keep `ShareStatusButton`
export for compatibility, but the Desk renders its own trigger via the shared `Button`
primitive; the internal `btn btn-ghost` styling inside the dialog may stay as-is).
Pass `workspaceName={activeWorkspace?.name ?? null}` from `useWorkspace()`.

### Part D — Today route recomposition

In `src/routes/_authenticated.today.tsx`:

1. REMOVE `<MyDayStrip />` (L~1077) and `<QuickCapture />` (L~1078) and their imports.
   The page flow becomes: Hero → TodaySpotlight → LoopStrip → the two-column grid.
   (Everything the strips carried now lives in the Desk — "relocate and curate, never
   delete": meetings → MeetingsRow, tasks → TasksCard, focus-next + timer → FocusCard,
   capture → CaptureCard.)
2. INSERT `<DeskRail />` in the right rail between `<LoopHealthCard ... />` and
   `<StrategicBriefCard />`.
3. DELETE the now-orphaned files: `src/components/today/MyDayStrip.tsx`,
   `src/components/today/FocusTimer.tsx`, `src/components/today/QuickCapture.tsx`.
   FIRST grep for every import of each (including `src/components/**/__tests__/` and
   any `*.test.ts*` — recent sessions added component-test skeletons); update or remove
   those references. `FocusNext.tsx` STAYS (FocusCard consumes it — or inline its
   dispatch logic into FocusCard and delete it too if nothing else imports it; prefer
   keeping the component and rendering it inside FocusCard's suggestion slot only if
   its markup fits the new design — otherwise inline the mutation and delete).
4. The anti-scroll win: removing two strips lifts the triage queue higher — do not add
   anything else above the grid.

### Part E — Agent-native + reachability

1. **Machine view** (`src/components/cadence/AppShell.tsx`, `buildMachineContent`):
   append a `## Your desk` section: active focus session (intent, remaining, phase,
   held count — from `useFlowMode()`, already reachable in AppShell), tasks due today
   (title list, from a `useQuery({ queryKey: ["tasks"], enabled: isMachineView })` so
   the fetch only happens in machine view), and today's focus history line. State
   plainly when idle: `No focus block running.`
2. **`public/llms.txt`**: add a short Desk entry under the Today route description:
   the Desk tools exist; agents may read/create tasks via the registered
   `workspace.list_tasks` / `tasks.create` tools; the focus session is client-side
   state visible via machine view. (No new server tools in this build — a server-side
   `focus.status` is impossible for client-local state; do not fake one.)
3. **Command palette** (`src/components/cadence/CommandPalette.tsx`): add entries —
   `Start a focus block` (calls `enterFlow()` directly — the palette mounts inside
   FlowModeProvider; close the palette first), `Add a task` → navigate `/today`,
   `Capture a signal` → navigate `/today`, `Share status` → navigate `/today`. Follow
   the file's existing entry/catalog pattern exactly.
4. **Keyboard law**: palette-initiated `enterFlow` must not animate anything
   (Loom §5 — keyboard actions animate NOTHING; the dock's entrance is the exception
   as a state arrival, keep it but it must not exceed 200ms).

---

## 3. Copy table (humanized-output law: no em/en dashes, no emoji, no exclamation marks, sentence case)

| Where | String |
|---|---|
| Desk header | `Your desk` |
| Focus kicker | `Focus block` |
| Intent placeholder | `What are you closing in this block?` |
| Start | `Start the block` |
| Suggestion kicker | `Cadence suggests` |
| Suggestion actions | `Focus on this` · `Send to an agent` |
| Running fallback title | `Focus block` / `Open block` |
| Extend / end | `Add 5 minutes` · `End the block` |
| Held line | `3 updates waiting quietly` (pluralize) |
| Completion toast (with intent) | `Time called on "<intent>". 2 updates while you were focused.` |
| History line | `2 blocks · 75 min today` |
| Tasks kicker / count | `Tasks today` · `3 open` |
| Tasks empty | `Nothing due today. Add what matters.` |
| Task add placeholder / button | `Add a task for today` · `Add` |
| Task tags | `OVERDUE` `HIGH` `DEEP` `AGENT` |
| Expander | `4 more` |
| Meetings kicker / line | `Meetings` · `3 today · next 2:30 PM Standup` |
| Capture placeholder / button | `What did you hear, and from where?` · `Capture` |
| Status kicker / caption / button | `Stakeholders` · `A ready-to-send update from live state` · `Share status` |
| SR phase announcements | `Half the block left.` · `Closing minutes.` |

## 4. Design-law compliance (verify each before commit)

- **Ember discipline**: ember appears ONLY in the closing phase (dot + text + progress)
  — that moment genuinely needs the human. No ember buttons, headers, or accents
  anywhere in the Desk. The screen keeps exactly one solid-ember CTA (the featured
  call's). Grayscale test: phases still read via brightness ladder + dot + bar.
- **No banned text-buttons**: every action is the shared `Button`
  (secondary/tertiary) or a real bordered chip. This build REMOVES two files full of
  banned GhostButton/SegmentButton patterns — do not reintroduce any.
- **Motion**: transform/opacity only; one easing family (`var(--ease)` tokens);
  entrance 200ms once; nothing animates per-tick; `prefers-reduced-motion` drops
  movement, keeps color. Progress line moves via `transform: scaleX` only.
- **Restraint budget**: no new aurora (LoopHealth keeps the screen's one), no new glow
  field, at most the two gradient hairlines (Spotlight + FocusCard), status color only
  on actual status.
- **Anti-slop**: no side-stripe borders, no icon-tile-over-heading, no identical card
  grid (the Desk deliberately varies: hero card / standard card / thin rows / input
  card), no nested cards, comfortable padding ≥ 12px.
- **States**: TasksCard + MeetingsRow keep per-query error + retry (never an empty
  state lying about a failed fetch); loading = skeleton blocks matching layout (copy
  the MyDayStrip 40px skeleton pattern per card); FocusCard has no async idle
  dependency except the suggestion (which simply appears when ready — never blocks).
- **Voice**: plain PM words, consequence in helper text where an action has one.

## 5. Verification gates (run ALL, in order, before commit)

```bash
bunx tsc --noEmit          # 0 errors
bun run lint               # 0 new warnings in touched files
bun test                   # all pass; new tests: phaseOf, history read, task-filters
bun run build              # green
bun run design:slop        # no NEW findings in touched files
```

Then a manual dev-server pass (`bun run dev`):
1. Today renders: strips gone, Desk present below the aurora card, rail order correct.
2. Start a block with an intent → dock appears bottom-right; navigate to /discover,
   /plan, /build, /brain → dock persists with countdown ticking.
3. Start a short custom block (1 min) → watch: past-half brightening at 30s, closing
   ember + ONE soft cue at 54s, completion chime + toast naming the intent, dock
   disappears, history line increments.
4. During a block, trigger any success toast (e.g. add a task) → it is HELD (no toast);
   end the block → summary appears.
5. Tasks: add, toggle (optimistic), overdue tag, 6+ tasks → expander.
6. Capture writes a signal (check toast); Share status opens the dialog and copies.
7. Machine view (`?view=machine`) shows the Desk section. ⌘K entries work.
8. Reduced motion (macOS setting or devtools emulation): no pulse, no entrance slide,
   colors still shift.
9. Reload mid-block → session + intent + dock resume; the old
   `cadence.focus.timer` key is gone from localStorage.

## 6. Scope guards (do NOT)

- No DB migrations, no new tables, no server-function changes, no registry changes.
- No OS Notification API in this build (tab-title countdown covers the away case;
  noted as a possible follow-up, not scope).
- No pause/resume on the unified engine (FlowMode never had it; extend covers the
  need; do not port FocusTimer's pause).
- No Settings work, no new routes, no nav/rail items (placement law).
- Do not modify `notify.ts`, `soundscape.ts`, `LoopHealthCard`, `TriageQueue`,
  `TodaySpotlight`, `LoopStrip`, or the lanes.
- Do not restyle the sidebar FlowWidget beyond what compiles (it keeps working as the
  chrome control; a later polish pass may align it).
- Docs: BUILD-ONLY MODE — the ONLY doc trace is one feature-dashboard row (see §7).

## 7. Commit + ship discipline

- One branch-of-work, incremental commits are fine; each commit message carries a WHY.
  Suggested final message:
  `feat(today): the PM Desk + cross-surface focus dock — unify the two timers into the flow engine (intent, thresholds, cues), give every buried desk tool an evident card home, and float the countdown on every page (founder goal 2026-07-09)`
- Push explicitly: `git push origin <branch>:main` (see CLAUDE.md git discipline; the
  remote is project_cadence_v5).
- Feature dashboard: add/flip ONE row (group: Today/UX) with a one-line note, per
  BUILD-ONLY MODE. Nothing else.
- Overwrite `.remember/now.md` at the end with a short status per the standing order.

## 8. Follow-ups (recorded, NOT in scope)

1. Focus-session log as durable memory (a `focus_sessions` table + outcome reflection
   "did you close it?" feeding the decision brain) — needs a migration, founder-gated
   publish.
2. OS notifications opt-in for background-tab completion.
3. Multi-tab session sync via `storage` events.
4. A `focus.status` machine surface once sessions are server-side.
5. Sidebar FlowWidget visual alignment with the new Desk language.
