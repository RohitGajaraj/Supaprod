# The Kiro build queue

> _Created: 2026-08-19 · Last updated: 2026-08-19_

**If you are Kiro and you have just been asked "what are you building next": read [§1 How to work](#1-how-to-work), then take the lowest-numbered item whose status is `TODO` and whose dependencies are all `VERIFIED`. That is your next build. Everything you need is in its row.**

Direction this queue implements: [`../planning/initiatives/agent-first-platform.md`](../planning/initiatives/agent-first-platform.md). Design contract: [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md). Build rules: [`../../AGENTS.md`](../../AGENTS.md).

---

## 0. Why this file exists

Two agents build this repo at once and they have **different capabilities**, so the work is split by capability rather than by feature.

| | **Kiro** (Amazon) | **Claude Code** |
| --- | --- | --- |
| Branch | **`main`** | `parallel/lane-0-fresh` |
| Database access | **none** | Lovable MCP, live SQL |
| MCP / external tools | **none** | full |
| Can verify against production | **no** | yes |
| Can run `bun test`, `tsc`, `build` | yes | yes |
| Share of the work | **~70%** | ~30% |

**Kiro builds blind.** That is not a limitation to work around, it is the sorting rule: **every item in this queue is one whose correctness can be established from the repo alone** — a component renders, a pure function returns the right value, a type checks, a test passes. Nothing here needs to know what is in a table.

**Claude verifies and wires.** Migrations, production queries, runtime behaviour, and anything whose truth lives in the database stay with Claude, because this repo has already shipped nine features that passed every test and did nothing in production. A green suite is evidence the code does what the test says, and nothing more.

---

## 1. How to work

### Kiro

1. **Pull first.** `git pull origin main`. Several tools write here.
2. **Take the lowest-numbered `TODO`** whose dependencies are all `VERIFIED`. Do not skip ahead; the order encodes dependency, not preference.
3. **Set its status to `IN PROGRESS`** and commit that change on its own before you start.
4. **Build only the files listed in `Owns`.** If the work genuinely needs a file outside that list, stop and add a line to §4 Blocked rather than editing it — a file outside `Owns` is owned by a Claude item and editing it will conflict.
5. **Run the gates before you commit:** `bunx tsc --noEmit`, `bun test`, `bun run build`. All three must be clean. `bun test` includes the Meridian ratchet, which will fail the build if a new file carries a retired token or a raw colour.
6. **Set status to `BUILT`** and append an entry to §3 Build log saying what you did, what you were unsure about, and anything you noticed that is not in the item.
7. **Push:** `git push origin main`.
8. **Never set `VERIFIED`.** That is Claude's to set, and it means "checked against production", which you cannot do.

### Claude

1. Read §3 Build log for entries with no verdict.
2. Verify against production and runtime, not against the test suite.
3. Move `BUILT` → `VERIFIED` or `REJECTED`, with a reason on the same line.
4. A `REJECTED` item goes back to `TODO` with a note saying what was wrong.

### Status values

`TODO` → `IN PROGRESS` → `BUILT` → `VERIFIED` | `REJECTED`

Kiro owns the first three transitions. Claude owns the last. Neither writes the other's.

### The rules that fail a build here

These are not style preferences; `bun test` enforces them.

- **Meridian is the only design system.** Tokens in `src/styles/meridian.css`, components in `src/components/meridian/`. A **new** file carrying `--sp-*`, `--ds-*`, `--text-*`, `--hairline`, `--madder*`, `--glacier`, `--font-pixel`, `--raised`, `data-obsidian`, or a raw colour (`#hex`, `rgb()`, `hsl()`) **fails the ratchet**. So does an existing file whose count grows.
- **Never widen the baseline to pass.** `bun run design:ratchet` is only for recording debt you removed.
- **No `--mrd-*` token fits? That is a gap in Meridian — build it there.** A token earns its place on the second caller, is named for meaning not appearance, and carries its argument in the file.
- **Colour carries status, never decorates.** Five status words only: `you` (a person is required), `agent` (a machine is working), `pass`/`fail` (an outcome that happened, never an intent), `hold` (waiting on a condition). It must survive a greyscale test.
- **Identity is shape, status is hue.** Never paint a station or agent identity as a colour ramp.
- **No native browser chrome.** No `alert`, `confirm`, `prompt`, or native `<dialog>`. ESLint-enforced.
- **Humanized output on anything a user reads.** No em or en dashes, no AI-cliché phrasing in UI copy, labels, empty states or errors. Not applicable to code comments or docs.
- **Every component with an early return carries `data-mrd=""` on that return too**, or its controls lose the focus ring.

---

## 2. The queue

**26 items. Dependencies are item numbers.** `Owns` is exhaustive — those are the only files to touch.

---

### Group A — Meridian primitives

The design system has no vocabulary for an agent working. Measured: `--mrd-you` has 97 usages and `--mrd-agent` 59, not because agents matter less but because there are five surfaces for "a person is required" and essentially one for "a machine is working." These nine items build the missing half.

---

**K-01 · `--mrd-stop`, the token an interrupt can wear**
`STATUS: TODO` · deps: none · size: S

**What.** Add one token to `src/styles/meridian.css` for a control that stops work in progress, plus its `@theme inline` binding. Measure it in both grounds and record the ratios in the token's own comment.

**Why.** There is currently **no token an interrupt control may legally wear.** The colour law reserves `--mrd-fail` for *outcomes that have happened* and forbids it for an *intent* — "roll back is not red, because red reports a result." So a stop button today has nothing to paint itself with, and that is the reason no stop button exists. This token is the precondition for K-02 and for the per-run stop.

**How.** Follow the file's own conventions exactly: OKLCH, a light value on bare `:root` and a dark value in the dark block, a comment saying why it exists and what it is not. It must be distinguishable from `--mrd-fail` (27°) and from `--mrd-hold` (78°) at a glance, and it must clear 3:1 against both grounds as a non-text control.

**Acceptance.**
- Token defined in both grounds with a `@theme inline` binding.
- Comment states the measured contrast in both grounds and names the second caller.
- `bun test` green, ratchet total unchanged.

**Owns.** `src/styles/meridian.css`

---

**K-02 · `Action` gains a `destructive` variant**
`STATUS: TODO` · deps: K-01 · size: S

**What.** Add a fourth variant to `Action` in `src/components/meridian/surface-parts.tsx`, wearing `--mrd-stop`.

**Why.** `Action` has `default | primary | quiet`, plus `Approve` for the case where a click unblocks something. None of them may carry "stop this run and discard forty minutes of work." Every stop control in the product needs this, and there is nowhere for one to sit today.

**How.** Match the existing variant implementation. Keep the `Approve` distinction intact — `Approve` is for a click that *unblocks*, `destructive` is for a click that *stops or removes*. Do not make destructive the loudest thing on the screen; distance plus a confirm is what protects a destructive act, not volume.

**Acceptance.**
- `<Action variant="destructive">` renders and is keyboard reachable with a visible focus state.
- Rendered in `src/routes/_authenticated.meridian.tsx` beside the other variants, in both grounds.
- No raw colour; the fill comes from K-01's token.

**Owns.** `src/components/meridian/surface-parts.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-03 · `Dialog`**
`STATUS: TODO` · deps: K-02 · size: M

**What.** A modal in `src/components/meridian/Dialog.tsx` — scrim, focus trap, Escape to dismiss, restore focus on close, `aria-modal`, a title, a body, and an actions row.

**Why.** `--mrd-scrim` and `--mrd-shadow-pane` are **defined in Meridian and consumed by nothing.** Every dialog in the product is still legacy. An agent-first product cannot ask "stop this run and discard the work?" without one, and native `<dialog>` is banned repo-wide.

**How.** Compose from `surface-parts`. Use `--mrd-scrim` for the backdrop and `--mrd-shadow-pane` for the panel — that is what they were measured for. Honour `prefers-reduced-motion`. The actions row takes `Action`/`Approve` children rather than hard-coding buttons.

**Acceptance.**
- Focus moves into the dialog on open and returns to the trigger on close.
- Escape closes; a click on the scrim closes; a click inside does not.
- Tab cycles within the dialog and cannot escape it.
- Rendered in the gallery in both grounds, including a destructive example using K-02.
- No `alert`/`confirm`/`prompt`/native `<dialog>` anywhere in the diff.

**Owns.** `src/components/meridian/Dialog.tsx`, `src/components/meridian/__tests__/dialog.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-04 · `RunTimeline`**
`STATUS: TODO` · deps: none · size: L

**What.** A component in `src/components/meridian/RunTimeline.tsx` that renders an ordered sequence of events against a real time axis. Props (shape is yours to finalise, this is the contract): a list of `{id, at, kind, label, detail?, agentSlug?, station?, durationMs?, state}` plus an optional `now` for live mode.

**Why.** `grep -il timeline src/components/meridian` returns **zero**. `TaskRows` is a flat list with no time axis; `Thinking` is a step list with no wall clock. Nothing in the system answers the one question a product lead actually opens the app with: **"what happened at 03:12, and what was it waiting on between 03:12 and 03:40?"** Gaps are the information — a run that idled for 28 minutes waiting on a person must look different from one that worked for 28 minutes.

**How.** `--mrd-fade-rail` and the `.mrd-fade-scroll` machinery already exist for a long dissolving column; this is what should consume them. Live mode ticks a counter, never a progress bar — a coding agent cannot know how long it will take and a bar that implies otherwise is a lie. Use `useElapsed`. State colour comes from the five status words only.

**Acceptance.**
- Renders 3, 40, and 200 events without the page scrolling sideways.
- A gap of more than a few minutes is visually distinct from contiguous work.
- Live mode: elapsed ticks; nothing implies a percentage.
- Composed states rendered in the gallery: empty, one event, a long run, a run that failed, a run held on a person.
- Greyscale test passes — the screen still makes sense with colour removed.

**Owns.** `src/components/meridian/RunTimeline.tsx`, `src/components/meridian/__tests__/run-timeline.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-05 · `ToolStream`**
`STATUS: TODO` · deps: none · size: M

**What.** An append-as-it-arrives log in `src/components/meridian/ToolStream.tsx`: rows arrive one at a time, the newest is visible, and the view pins to the bottom **unless the reader has scrolled up**, in which case it stays put and offers a "jump to latest" control.

**Why.** `ToolChips` takes a **finished array** and is wired only to the gallery. There is no component that shows work arriving. This is the single most important missing piece of "an agent is visible while it works," and the SSE `tool` frame that will feed it already exists in the protocol.

**How.** Compose the row from `ToolChips`' existing vocabulary so the two agree. Pin-to-bottom must not fight the reader: once they scroll up, stop following. Row states are `running | done | failed`; only running rows animate, and animation is declared inline so the reduced-motion block catches it.

**Acceptance.**
- Appending a row while scrolled to the bottom keeps the newest visible.
- Appending while scrolled up does **not** move the viewport, and a "jump to latest" appears.
- 500 appended rows do not degrade scrolling.
- Gallery shows: empty, streaming, a failed call, and a very long argument that must not break the layout.

**Owns.** `src/components/meridian/ToolStream.tsx`, `src/components/meridian/__tests__/tool-stream.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-06 · `PlanCard`**
`STATUS: TODO` · deps: none · size: M

**What.** A forward-looking list of steps an agent commits to **before** acting: each step has a label, an owning agent, a station, and a state of `pending | active | done | skipped | failed | needs-approval`.

**Why.** Every step display in the system is **retrospective**. `Thinking` variant `Steps` shows what happened. `TaskStatus` is `running | done | failed | blocked` — it has **no `pending` and no `skipped`**, and `taskStatus()` collapses every unrecognised value to `blocked`, which misreports a step that has not started yet as stuck. The product needs to show a plan and wait on it, which is how one approval at the top replaces a queue of fourteen later.

**How.** Do not extend `TaskStatus`; this is a different concept and conflating them is what produced the `blocked` bug. A `skipped` step must be able to carry a reason, because a founder ruling requires that a skipped station is a decision on the record with a reason.

**Acceptance.**
- All six states render distinctly and survive greyscale.
- A skipped step shows its reason.
- `needs-approval` uses `--mrd-you`; `active` uses `--mrd-agent`. Nothing else uses either.
- Gallery: a five-step plan in mixed states, and a one-step plan.

**Owns.** `src/components/meridian/PlanCard.tsx`, `src/components/meridian/__tests__/plan-card.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-07 · `Spend`**
`STATUS: TODO` · deps: none · size: S

**What.** A component rendering cost against a ceiling: amount spent, cap, and proximity to it.

**Why.** **Nothing in the system renders spend**, in a product that meters credits and enforces three separate ceilings (account, per-mission $10, per-track $5). Meridian's own colour law names "a cap nearly spent" as a canonical `--mrd-hold` case — the case exists in the doctrine and has no component.

**How.** `--mrd-hold` as the ceiling approaches, per the law. Never `--mrd-fail` until the cap has actually been hit, because fail reports a result. Currency formatting must be locale-safe and use `tabular-nums`.

**Acceptance.**
- Renders $0.00 of $5.00, a near-cap state, and an at-cap state.
- No layout shift as digits change.
- Greyscale test passes — proximity is not carried by hue alone.

**Owns.** `src/components/meridian/Spend.tsx`, `src/components/meridian/__tests__/spend.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-08 · `MarkStack` takes a state per mark**
`STATUS: TODO` · deps: none · size: M

**What.** Change `MarkStack` in `src/components/meridian/marks.tsx` so each mark carries its own `MarkState` instead of the stack sharing one.

**Why.** `MarkStack` has **37 importers** — it is the product's real presence layer — and it currently takes **one shared state for the whole stack**. It therefore *cannot render three agents in three different states*, which is the normal case for a seven-station loop. This is a structural limit on showing multi-agent work, sitting in the most-used component in the system.

**How.** This is a breaking change across 37 files, so keep the old signature working: accept either a shared state or a per-mark one, and migrate call sites in a later item rather than in this one. Do not change any call site here beyond what typechecking forces.

**Acceptance.**
- A stack renders three marks in three different states simultaneously.
- Every existing call site still compiles and renders identically.
- Gallery shows a mixed-state stack beside a uniform one.
- Ratchet total unchanged.

**Owns.** `src/components/meridian/marks.tsx`, `src/components/meridian/__tests__/agent-marks-are-distinct.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-09 · Type-size tokens get `@theme inline` bindings**
`STATUS: TODO` · deps: none · size: M

**What.** Add `--text-mrd-*` bindings for all 13 type-size tokens, then replace the off-ladder arbitrary values in `src/components/meridian/`.

**Why.** Meridian documents a 13-stop type ladder and **cannot enforce it**: `@theme` exposes colours, radii, shadows, spacing and fonts, but no type sizes. The result is **277 hand-written `text-[Npx]` values inside the design system's own components, 13 of them off the ladder entirely** (`text-[13.5px]`, `text-[16px]`, `text-[8px]`, `text-[9px]`, `text-[9.5px]`). The ratchet cannot see arbitrary Tailwind values, so this debt is invisible to the gate that exists to catch exactly this.

**How.** Add the bindings first. Then fix only the **13 off-ladder** values, snapping each to the nearest ladder stop — do not mass-rewrite the 264 on-ladder ones in this item, because a 264-file diff cannot be reviewed. Note in the build log which stops you snapped to and whether any looked visually wrong afterwards.

**Acceptance.**
- All 13 sizes usable as `text-mrd-*` utilities.
- Zero off-ladder `text-[...]` values remain in `src/components/meridian/`.
- The gallery renders identically apart from the 13 deliberate snaps.

**Owns.** `src/styles/meridian.css`, all files under `src/components/meridian/` **except** those owned by K-02 through K-08

---

### Group B — Pure logic, no database

Correctness here is provable from the repo. Claude wires the results to real data afterwards.

---

**K-10 · The approval policy engine, as pure functions**
`STATUS: TODO` · deps: none · size: L

**What.** A new module `src/lib/ai/approval-policy.ts` exporting a pure `resolveApprovalPolicy(input) => { decision, reason }` where decision is `never-ask | earn-it | always-human | disabled`, plus exhaustive unit tests.

**Why.** **This is the highest-leverage item in the queue.** At zero real users the product holds 53 pending approvals, 39 over 24 hours old, blocking 14 missions, with the oldest at **627 hours**. Classified against the record: only **26%** of all 313 approvals ever raised were for something a human genuinely had to rule on. The governance doctrine already says *"a long approvals queue is a policy failure to surface, not a workload to render"* — this module is that sentence expressed as code.

**How.** Two axes the codebase already models, read from `src/lib/tool-consequences.ts`: **reversibility** and whether the action **leaves the workspace**.

```
                    reversible?
                 yes            no
leaves    no   never-ask     earn-it
workspace yes  earn-it       always-human
```

Plus three rules:
1. `always-human` **never graduates**, regardless of record. This is deliberate and matches GitHub Copilot's cloud agent, which structurally cannot approve its own PR.
2. A tool whose record is **all rejections** resolves `disabled`, not `earn-it`. Asking a question whose answer you already have, seven times, is worse than not offering it.
3. **Demotion is automatic, promotion is not.** N consecutive rejections drops a rung; a rise always requires a person. This asymmetry is the only automated autonomy movement any shipped product has, and inventing automatic promotion would put us ahead of the entire industry on the risky side.

Take the track record as a plain argument (`{approved, rejected, consecutiveRejections}`). **Do not read the database** — Claude supplies those numbers.

**Acceptance.**
- Pure: no imports from `.server.ts`, no Supabase, no I/O. A test importing this module must not pull in the AI runtime.
- Every branch covered, including: a perfect record on an irreversible tool still returns `always-human`; an all-rejection record returns `disabled`; an empty record returns the axis default.
- Each returned `reason` is a sentence a user could read.

**Owns.** `src/lib/ai/approval-policy.ts`, `src/lib/ai/approval-policy.test.ts`

---

**K-11 · Catalogue the 17 uncatalogued tools**
`STATUS: TODO` · deps: none · size: M

**What.** Add `CONSEQUENCES` and `RISK_PROFILE` entries in `src/lib/tool-consequences.ts` for the 17 tools that have none: `cluster.trigger`, `critic.evaluate`, `github.ci.read`, `mission.observe`, `repo.read`, `repo.search`, `repo.tree`, `signals.list`, `sources.connect`, `sources.status`, `studio.checks.run`, `themes.list`, `web.fetch`, `web.map`, `web.search`, `workspace.list_tasks`, `workspace.search`. Add a test asserting **registry ⊆ catalogue** so this cannot recur.

**Why.** `toolRisk` **fails closed to `high`** for anything uncatalogued. The live consequence is measurable and absurd: `cluster.trigger` was deliberately set to `auto` on 2026-08-03 *because* it was 24 of 60 pending approvals — and because it is uncatalogued it scores `high`, `resolveToolMode` demotes it back to `confirm`, and it queues anyway. **It is 18 of the 53 currently pending, 34% of the whole queue.** A fix that was already made is being silently reversed by a missing table row.

**How.** Most of these 17 are obviously read-only (`repo.*`, `web.*`, `themes.list`, `signals.list`, `workspace.*`, `github.ci.read`, `mission.observe`) — reversible, no external write. `sources.connect` and `studio.checks.run` deserve thought. Follow the shape of the 42 existing entries exactly. No test currently asserts the registry is fully catalogued; add one, because that absence is why this happened.

**Acceptance.**
- All 59 registry tools present in both catalogues.
- A new test fails if a tool is added to the registry without a catalogue entry.
- `toolRisk("cluster.trigger")` no longer returns `high`.
- No behaviour change to the 42 already catalogued.

**Owns.** `src/lib/tool-consequences.ts`, `src/lib/__tests__/tool-risk-six-dimensions.test.ts`

---

**K-12 · One enumerated set of run statuses**
`STATUS: TODO` · deps: none · size: M

**What.** A single exported union and a normaliser in `src/lib/run-status.ts`, plus a test pinning every historical spelling to its canonical form.

**Why.** `agent_runs.status` carries **six distinct spellings in production, including both `complete` and `completed`.** `missions.status` has **eleven words and no CHECK constraint anywhere**. Downstream this has already cost real bugs: `agent-fleet.ts` had to special-case the singular `"complete"` or those runs fell into an "other" bucket, and `mission_steps.status='ready'` is documented in a migration and written by nothing. Every surface that reads a status re-derives its own mapping, and they disagree.

**How.** Do **not** write a migration and do **not** change any writer — Claude owns that, because it needs production data to know what is safe to collapse. Your job is the canonical type, the normaliser, and the test. Read the existing mappings in `src/components/runs/run-state.ts`, `src/lib/agent-fleet.ts`, `src/components/obsidian/build-status.ts` and `src/lib/run-analytics.ts`, and reconcile them into one.

**Acceptance.**
- One exported union; one `normalizeRunStatus(raw: string)`.
- A test enumerating every spelling found in those four files, asserting its canonical form.
- An unknown value normalises to an explicit `unknown`, never silently to `blocked` or `failed`.
- No writer changed.

**Owns.** `src/lib/run-status.ts`, `src/lib/run-status.test.ts`

---

**K-13 · `decision.record` gains forecast fields**
`STATUS: TODO` · deps: none · size: M

**What.** Extend the `argsSchema` of `decision.record` in `src/lib/ai/tools/registry.server.ts` with `forecast_claim`, `forecast_how_we_will_know` and `forecast_horizon_date`, refused as a set (all three or none) and refusing a horizon at or before now. Update the tool description to say why.

**Why.** **This is the moat, and it is one schema field from existing.** `decisions` carries eleven forecast columns, an immutability trigger, a refusal guard and a partial index — and **1 row of 304 uses them**. The cause is that `decision.record`, the tool the Decide crew is explicitly told to call, has no forecast parameter. So **303 of 304 decisions were recorded by an agent through a tool that cannot express the one thing the strategy calls defensible.**

The argument is already written in this tool's own description, applied to a different field: *"Requires at least one rejected alternative — a choice with nothing weighed against it is an assertion, not a decision, and is refused."* The identical logic applies. **A decision with no forecast is an opinion, not a bet.**

**How.** Mirror `forecastRefusal` in `src/lib/decisions.functions.ts` — the validation rules already exist for the human path; reuse them rather than re-deriving. Extend the `preview` string so the approval card shows the forecast. **Write the schema and the insert only.** Do not attempt to verify anything against the database.

**Acceptance.**
- All three fields accepted; a partial forecast is refused with a readable message; a past horizon is refused.
- The columns are included in the insert.
- `preview` names the claim and the horizon.
- The description states why a forecast is required, in the voice of the existing sentence about alternatives.

**Owns.** `src/lib/ai/tools/registry.server.ts` (the `decision.record` entry only), `src/lib/ai/tools/__tests__/decision-record-forecast.test.ts`

> **Claude does after:** confirm the immutability trigger accepts agent writes, confirm RLS, then measure `decisions_with_forecast_claim` moving off 1.

---

**K-14 · Close the `uncertain` verdict crash**
`STATUS: TODO` · deps: none · size: S

**What.** Narrow the `verdict` enum on `learning.record` from four values to the three the database actually permits, and change the tool description that currently instructs the agent to use the fourth.

**Why.** **This is a live crash.** `learning.record` accepts `verdict: z.enum(["validated","missed","mixed","uncertain"])` and its description actively tells the agent *"Say uncertain rather than guessing."* The `learnings.verdict` CHECK constraint permits **three** values and no migration ever widened it. The insert result is checked with `if (error) throw`, so **an obedient agent following the tool's own instruction gets a 23514 and the whole tool call fails.**

**How.** Narrowing the enum is the safe half and it is yours. The product question — whether "too early to tell" deserves a fourth value — is settled elsewhere: a migration already ruled that a deferral is *the absence of an outcome rather than a kind of one*, and is expressed as a future check date, not a verdict. So narrow, and point the description at deferral instead of inventing a verdict.

**Acceptance.**
- Enum has exactly three values.
- Description no longer instructs the agent to say `uncertain`.
- A test asserts the enum matches the three permitted values, and names the CHECK constraint in its failure message.

**Owns.** `src/lib/ai/tools/registry.server.ts` (the `learning.record` entry only), `src/lib/ai/tools/__tests__/learning-record-verdict.test.ts`

---

**K-15 · Emit the two dead SSE frames**
`STATUS: TODO` · deps: none · size: M

**What.** Emit `station` and `tool` frames from `src/routes/api/chat.ts` at the points where the information already exists.

**Why.** The SSE protocol **defines** both frames. The client **parses** both and **accumulates** both. **Nothing emits either.** This single gap is why a user cannot see what an agent is doing while it does it — tool names only appear after the fact, via a four-second poll. Separately, the correct station is already computed by `routeIntent` at line ~819 and then **discarded** on the next line with `void routed;`.

**How.** The frame shapes are already declared in `src/lib/ask-sse.ts` — match them exactly; do not invent fields. Emit `station` once the route is resolved, and `tool` per tool call. Note that `AskLanding` and `AskTurn` carry stale comments claiming the `landing` frame is unemitted; it is emitted now. Fix those comments while you are in the file.

**Acceptance.**
- Both frames emitted with the declared shapes.
- The client's existing accumulators receive them with no client change.
- `void routed;` is gone and the resolved station is on the wire.
- Stale comments in `AskLanding.tsx` and `AskTurn.tsx` corrected.

**Owns.** `src/routes/api/chat.ts`, `src/components/ask/AskLanding.tsx`, `src/components/ask/AskTurn.tsx`

> **Claude does after:** watch a live run and confirm the frames arrive in order and at the right moments.

---

**K-16 · Repair the dead dispatch branch**
`STATUS: TODO` · deps: K-15 · size: M

**What.** Make `intent: "do"` able to promote a request to a mission on its own, and make the silent-degrade path explicit.

**Why.** "Hand it over" works **by accident.** The client prefixes the literal string `@cos`, which resolves to the orchestrator and skips the classifier. The branch designed for this is dead: line ~681 requires `startingAgent`, which is only ever assigned inside the `if (isMission)` block **above** it, so it can never fire. The consequence is real: with no seeded orchestrator, **"Hand it over" silently returns prose and starts nothing.**

**How.** Make `forcedDo` sufficient on its own. Then make every pre-flight downgrade (no workspace, unseeded orchestrator, zero enabled specialists) surface as a **named state the user can act on**, not a system message injected into a chat answer. A button that silently does something else is worse than a button that says it cannot run yet.

**Acceptance.**
- `intent: "do"` dispatches without depending on the `@cos` prefix.
- Each downgrade path produces a distinct, readable state naming what is missing and what to do.
- The existing `@cos` path still works.
- A test covers each downgrade condition.

**Owns.** `src/routes/api/chat.ts`, `src/hooks/use-ask-stream.ts`, `src/routes/api/__tests__/chat-dispatch.test.ts`

---

### Group C — Wiring what already exists

---

**K-17 · Wire `StreamingText` and `ToolChips` out of the gallery**
`STATUS: TODO` · deps: K-05 · size: M

**What.** Mount `StreamingText` and `ToolChips` on the run detail surface.

**Why.** Both components are **fully built, ported from the reference, and wired only to the gallery**. The two components whose entire subject is an agent working are used nowhere in the product. This is the cheapest possible increase in agent visibility: no new components, just doors.

**How.** The run surface is deliberately organised as report-first, transcript-behind-a-tab — that ordering is a documented 2026-08-10 decision and is correct. Do not invert it. These go **inside the existing tab row**, not above the report.

**Acceptance.**
- Both render with real run data on `/runs/$missionId`.
- The report still lands first; the tab row is still collapsed on arrival.
- Empty, streaming and failed states composed, not merely handled.

**Owns.** `src/routes/_authenticated.runs.$missionId.tsx`

---

**K-18 · Give the sixteen hold reasons a surface**
`STATUS: TODO` · deps: none · size: M

**What.** Render a held track's hold reason and its operator sentence wherever a held run appears.

**Why.** The spine driver has **16 distinct hold reasons, each with an operator sentence already written** at `src/lib/spine/driver.ts:652-684` — `waiting-on-a-person`, `stalled`, `out-of-credit`, `no-agent`, `produced-nothing`, `nothing-to-hand-on` and ten more. **None of them surfaces anywhere.** A user sees work stop and cannot learn why, while the exact sentence explaining it sits unused in the codebase.

**How.** The sentences exist — use them verbatim; do not write new copy. Distinguish the two kinds with the colour law: a hold waiting on **a person** is `--mrd-you`; a hold waiting on **a condition** (credit, time, a missing input) is `--mrd-hold`. That distinction is the whole reason both tokens exist. `StalledWork` already models this and is the component to extend or follow.

**Acceptance.**
- Every one of the 16 reasons renders with its own sentence.
- Person-holds and condition-holds are visually distinct and survive greyscale.
- A gallery entry shows all 16.

**Owns.** `src/components/meridian/StalledWork.tsx`, `src/routes/_authenticated.runs.index.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-19 · Doors for the six orphan routes**
`STATUS: TODO` · deps: none · size: S

**What.** Give an inbound link to `/artifacts`, `/m`, `/meridian`, `/missions/$missionId`, `/prds/$id`, `/studio/$missionId`.

**Why.** These six authenticated routes have **zero inbound links** anywhere in the codebase — reachable only by typing a URL. `AGENTS.md` names *"a capability with no door"* as **the dominant defect in this repo**, and a route-reachability test exists specifically to catch it. Six got through.

**How.** Check each one first: `/m` and `/studio/$missionId` may be redirect stubs, in which case the correct fix is deleting them, not linking them. Say which is which in the build log. Do **not** add rail rows — nav is contract-controlled and features never add nav items. Link from inside the surface each one belongs to.

**Acceptance.**
- Each of the six is either reachable from a rendered control, or removed as a dead stub with a note saying why.
- No new primary nav rows.
- The route-reachability test passes without being weakened.

**Owns.** whichever surfaces provide the links, listed in the build log before you start

---

**K-20 · The Run Map**
`STATUS: TODO` · deps: K-06 · size: L

**What.** A component rendering a run's route as a horizontal station spine, expandable into its step DAG. Three modes: **editable** before start, **live** during, **replay** after.

**Why.** A founder ruling already requires that **a skipped station is a decision on the record with a reason, never a silent omission** — and today that is a policy with no interaction, so nothing enforces it. On a map, dragging a station out of the route *is* the gesture and the reason prompt is the natural next beat. The canvas turns an unenforced policy into a control.

**The constraint that keeps this legal.** Engine-Room doctrine: the user meets the **output** of the machine, never the machine. Nodes are labelled by **outcome** — "read Intercom and PostHog for verify-step drop-off" — and **never** by tool name. A node graph of tool calls is exactly the machine leaking into the experience, and it is what makes most agent-workflow UIs feel like developer tooling.

**This is explicitly not a workflow builder.** No trigger palette, no conditions, no branches, no user-authored automations. The director decides the route; the user adjusts and approves it. If a user has to draw the graph, the director layer is dead.

**How.** Station identity is the **glyph**, never a colour ramp — `station-glyphs.tsx` exists and law 4 has been violated on this three separate times. Steps come from `PlanCard`'s vocabulary so the two agree. Removing a station must require a reason before it commits.

**Acceptance.**
- Renders a seven-station route and a three-station route.
- Editable mode: a station can be removed and the removal demands a reason.
- Live mode: the active station is `--mrd-agent`, a held one shows K-18's reason, and nothing implies a percentage.
- No tool name appears anywhere in the rendered output.
- Horizontal overflow scrolls inside its own container; the page body never scrolls sideways.

**Owns.** `src/components/meridian/RunMap.tsx`, `src/components/meridian/__tests__/run-map.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

### Group D — Roster and documentation drift

---

**K-21 · Fix the agent roster drift**
`STATUS: TODO` · deps: none · size: S

**What.** In `src/lib/agent-vocabulary.ts` and the driver's guard: resolve the duplicate **"Engineer"** display name, and extend `driver.test.ts` to cover `tier: "crew"`.

**Why.** Three defects, all invisible to the current guards. `engineer` is `status: "deprecated"` yet **seeded into all 16 workspaces**, and **both `builder` and `engineer` render as "Engineer" at the Build station** — two agents in one workspace whose names do not distinguish them, which is the one thing a job-verb naming scheme exists to prevent. Separately `reactor` and `archivist` are `status: "active"` and seeded **nowhere**; `driver.test.ts` only guards `tier: "cast"`, so it cannot see them.

**Important: do not merge any agents.** An earlier draft of the direction proposed consolidating the roster and that was wrong. The maker→reader pairing at each write station is the mitigation for a **21.3%** failure category (task verification), while role-disobedience is **0.5%**. Merging the pairs would optimise a 0.5% problem by deleting the guard on a 21% one. The roster shape is correct; only the drift is wrong.

**How.** The display-name collision and the test guard are yours. **Unseeding `engineer` from the 16 workspaces is a data change and belongs to Claude** — flag it in the build log rather than writing a migration.

**Acceptance.**
- No two agents share a display name at one station.
- `driver.test.ts` fails if an `active` agent of any tier is dispatched by nothing.
- No agent merged, renamed to a persona, or removed from the catalogue.

**Owns.** `src/lib/agent-vocabulary.ts`, `src/lib/spine/driver.test.ts`

---

**K-22 · Correct the three stale architecture contracts**
`STATUS: TODO` · deps: none · size: M

**What.** Fix `architecture/orchestration.md`, `architecture/runtime.md` and `architecture/observability.md` where they describe things the code does not do.

**Why.** These are the files a new agent reads to learn the system, and each currently teaches something false. **`orchestration.md` documents only the mission layer and never mentions the spine** — which is the layer that actually walks all seven stations. `runtime.md` names `ai_traces` as canon; **that table does not exist anywhere in the repo**. `observability.md` documents the trust score's evaluation leg as live; it queries two columns that do not exist, so **20% of every agent's trust score is a frozen constant**.

**How.** Read the code, not the docs. Confirmed corrections to make: there are **two** orchestration layers with different drivers and heartbeats; `ai_traces` does not exist and spans are two columns on `ai_events`; the eval leg is broken and should be marked so rather than deleted, since Claude is fixing it. Do **not** fix the trust query itself — that needs schema verification and is Claude's.

**Acceptance.**
- No contract describes a table that does not exist.
- The spine layer is documented alongside the mission layer.
- Anything known-broken is marked broken with a pointer, not silently removed.
- `bun run docs:check` clean.

**Owns.** `architecture/orchestration.md`, `architecture/runtime.md`, `architecture/observability.md`

---

### Group E — Patterns lifted from the reference class

Each of these is a mechanic measured in a shipped product, not an idea. The evidence sits in the item.

---

**K-23 · `PlanGate` — one gate, three answers, and the dial is the forecast**
`STATUS: TODO` · deps: K-06 · size: L

**What.** A component that presents a plan and takes **one** decision with three answers:

```
  Start it, and let it run           →  auto within policy, report at the end
  Start it, check with me on writes  →  confirm at each external write
  Keep planning                      →  redirect before any spend
```

It renders the plan (K-06 `PlanCard`), the route (K-20 `RunMap` when present), the spend ceiling (K-07 `Spend`), and returns the chosen autonomy level plus any edits.

**Why.** **This is the highest-value component in the queue and it closes two separate problems with one interaction.**

*It fixes approvals.* Anthropic's instrumented sessions show users make **~70% of planning decisions and only ~20% of execution decisions**, while one prompt triggers around ten agent actions. People want to own the plan and delegate the execution. And a step-level gate cannot be rescued by better design: **93% of permission prompts are approved** — Anthropic names it approval fatigue. **A gate that gets clicked through is worse than no gate, because it manufactures the appearance of review while producing none of it.** Our own record agrees: six agents at a 100% approval rate, eleven tools asked 130 times and answered zero times.

*It captures the moat.* Choosing how much rope a run gets, **before the outcome is known**, is a recorded belief about that work. That is exactly "what a team believed would happen, recorded before the outcome was known" — the one thing the strategy says a competitor cannot reconstruct, because it leaves no trace unless something catches it at the moment of the call. **The forecast stops needing a form and becomes the by-product of a gate that has to exist anyway.**

**How.** One decision, three answers, one keystroke each — do not split it into a confirm plus a settings toggle. The plan must be **editable in place** before the choice commits; a gate you cannot redirect is a speed bump. Return the chosen level as a value; **do not persist anything** — Claude wires it to `agent_autonomy` and to the decision record.

**Acceptance.**
- Three answers, each reachable by keyboard, each stating its consequence in plain words.
- The plan is editable before committing, and removing a station demands a reason.
- Spend ceiling shown before the choice, never after.
- Returns `{ autonomy, editedPlan, reason? }` and writes nothing.
- Gallery: a five-step plan, a one-step plan, and a plan whose route was edited.

**Owns.** `src/components/meridian/PlanGate.tsx`, `src/components/meridian/__tests__/plan-gate.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-24 · `AgentInbox` — sorted by who needs you, not by who is working**
`STATUS: TODO` · deps: K-08 · size: L

**What.** A list component grouping agent sessions as **needs input → ready for review → working → done**, with one-line present-participle summaries, reply-in-place without navigating away, idle rows self-hiding, and everything past three collapsing to "N idle agents".

**Why.** The instinct in an agent product is to render every agent working at once. The evidence says that is the wrong surface. **Showing many agents *working* is bad; showing many agents *needing you* is good.** Cursor shipped eight-way parallelism with no compare-and-pick surface and per-turn review died with it. Human active focus caps at three or four items. Anthropic's sizing guidance is blunt: *"three focused teammates often outperform five scattered ones."*

Separately, the review surface is now the actual bottleneck: across 22,000 developers over two years, throughput rose **33.7%** while median review time rose **441.5%** and PRs merged with zero review rose **31.3%**. Generation is commoditised. **The review surface is the product.**

**How.** This is what `/` (Home) becomes, and it is a different object from a dashboard of activity. Grouping is by **what it needs from a person**, never by station or agent. Status verbs are present participles ("reading Intercom", "waiting on you"), never adjectives. Use K-08's per-mark state — this surface is the reason that change matters. Reply-in-place must not navigate.

**Acceptance.**
- Four groups, in that order, with empty groups hidden entirely.
- More than three idle rows collapse to a single summary row.
- Reply-in-place works without a route change.
- Renders 3, 12 and 60 sessions without the page scrolling sideways.
- Composed: nothing running, everything blocked on one person, and one agent failed.
- Greyscale test passes.

**Owns.** `src/components/meridian/AgentInbox.tsx`, `src/components/meridian/__tests__/agent-inbox.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-25 · Correct Meridian's motion, weight and loading policy**
`STATUS: TODO` · deps: none · size: M

**What.** Three token-level corrections in `src/styles/meridian.css`, each with its reasoning written into the file.

**Why.** Meridian's standing rule is that the reference class is the floor. These three were never ported because they live in a token file rather than in a component, so no parity pass could see them.

1. **Motion is roughly twice as slow as the reference, and the asymmetry is inverted.** Meridian ships `--mrd-d-press: 120ms`, `--mrd-d-move: 220ms`, `--mrd-d-enter: 420ms`. Linear's shipped scale is `0s / 0.15s / 0.1s / 0.25s / 0.35s` — the whole scale sits **below** Material's 200-500ms band, and the governing choice is **enter 0s, exit 0.15s**. That inversion is the finding: **things should appear instantly and leave gently.** Waiting 420ms for a panel to fade in reads as the software thinking; watching it leave over 150ms reads as considered.
2. **Body weight should be 450, not 400.** The reference sets running text at 450 and caps its scale at 15px. On Meridian's neutral OKLCH ground, 400 at 14px reads thin rather than quiet.
3. **There is no loading policy.** The reference shows **no loader at all for the first 1000ms**, adds explanatory text 800ms later, dismisses in 0.1s, and **disables all animation in the error state**. Supaprod shows `BrandWait` after 150ms with a 300ms minimum, so a 200ms navigation is *guaranteed* to flash a loader for 300ms — slower-feeling than showing nothing. The design contract's own outstanding item 6 says "fix the latency, not the spinner"; this is that, at the token layer.

**How.** Change the tokens and the `BrandWait` thresholds only. **Do not retune individual components** — the whole point is that these are system-level. Note in the build log anything that looked wrong afterwards, because a faster scale will expose animations that were leaning on the slow enter to hide a layout shift.

**Acceptance.**
- Enter approaches zero; exit and movement carry the easing budget.
- `--mrd-w-regular` is 450, and the gallery still reads correctly at every size.
- No loader appears before 1000ms; none animates in an error state.
- Each change carries its reasoning and its source in the file, per Meridian's own rule.
- Ratchet total unchanged.

**Owns.** `src/styles/meridian.css`, `src/components/supaprod/BrandWait.tsx`

---

**K-26 · One activity vocabulary for agent sessions**
`STATUS: TODO` · deps: none · size: M

**What.** A pure module `src/lib/agent-activity.ts` defining the emittable activity types, the derived session states, and a pure `deriveSessionState(activities, now)`.

**Why.** The product has **six spellings of run status**, eleven mission-status words with no constraint, and every surface re-deriving its own mapping. Linear solved exactly this and publishes the schema: five emittable activity types (`thought`, `action`, `elicitation`, `response`, `error`, plus a user-only `prompt`), six **auto-derived** session states, an `ephemeral` flag for transient rows, and hard timing contracts — **acknowledge within 10 seconds or show unresponsive; stale at 30 minutes; stale is recoverable.**

Deriving state from activity rather than storing it is what stops the six-spellings problem recurring: there is no status field for a writer to invent a new word in.

**How.** Lift the vocabulary close to verbatim; this is the standing "research the best proven product in that category and lift its information model and verbs outright" rule, and Linear is that product for this object. Keep `ephemeral` — it is what lets a thinking row disappear without leaving litter in the timeline. Encode the three timing contracts as named constants with their reasoning.

**Pure only.** No database, no writers changed. K-12's normaliser maps today's spellings onto this; that is Claude's wiring job afterwards.

**Acceptance.**
- Types exported; `deriveSessionState` is pure and total.
- Unresponsive at 10s, stale at 30min, and stale is recoverable — each a named constant with a comment.
- Tests cover every state transition including recovery from stale.
- No import from any `.server.ts`; no I/O.

**Owns.** `src/lib/agent-activity.ts`, `src/lib/agent-activity.test.ts`

---

## 3. Build log

Kiro appends one entry per item on completion. Claude appends a verdict under it.

> _Format:_
> `### K-NN · <title> · BUILT <date>`
> **Did.** What you built, in two or three sentences.
> **Unsure.** Anything you guessed at, or a decision that could reasonably have gone another way.
> **Noticed.** Anything true that is not in the item — a defect nearby, a stale comment, a surprise.
> **Gates.** tsc / test / build results.
>
> _Claude replies:_ `**VERDICT: VERIFIED** <what was checked in production>` or `**VERDICT: REJECTED** <what was wrong>`

_(empty)_

---

## 4. Blocked

Anything Kiro cannot proceed on. One line each: item, what is blocking, what is needed.

_(empty)_

---

## 5. What Claude keeps, and why

Not a backlog — the complement of this queue, listed so Kiro knows these are covered and must not start them.

| Work | Why it cannot be built blind |
| --- | --- |
| Every migration, and applying it | Applied through Lovable; committed SQL is not applied SQL |
| Fixing the trust score's eval leg | Needs the live `ai_evals` schema to confirm the real column names |
| Per-run stop with `AbortController` | Runtime behaviour; must confirm a stopped run refunds its credit draw |
| Giving all seven stations a `missionId` | Orchestration change verified by watching real runs |
| Widening or narrowing any CHECK constraint | Migration plus a production read of existing values |
| Unseeding `engineer` from 16 workspaces | Data change |
| Cleaning the incoherent `decided_at` timestamps | Data repair |
| Restarting and alarming `eval-tick` | Cron state lives in the database |
| Surfacing tick failures | Needs to know which failures are real |
| Every acceptance number in the direction doc | Production queries |
| Navigation collapse | Depends on K-17 to K-20 landing and proving out first |

---

## Related

- [`../planning/initiatives/agent-first-platform.md`](../planning/initiatives/agent-first-platform.md) — the direction this queue implements, with the evidence for every "why" above
- [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md) — the Meridian contract and the ratchet
- [`../../AGENTS.md`](../../AGENTS.md) — build rules, gates, and the traps this repo has already paid for
