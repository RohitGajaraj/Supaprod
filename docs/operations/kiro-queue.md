# The Kiro build queue

> _Created: 2026-08-19 · Last updated: 2026-08-19_

> ### PRIMITIVES BUILD BEFORE THE THINGS THAT USE THEM. This overrides the numbers.
>
> **Founder ruling 2026-08-20, and it is a standing rule rather than a one-off promotion.**
>
> **A primitive that lands after its consumers is a primitive nobody used.** By the time it exists, every feature that needed it has already invented a one-off, and now you have both: the primitive AND the debt it was supposed to prevent. That cost is paid quietly, forever, and no gate ever reports it. The same is true of a primitive that ships *wrong*: every consumer inherits the wrongness, and fixing it later means touching all of them instead of one.
>
> **So: any item that ADDS a missing primitive, or CORRECTS a shipped one, jumps the queue.** Its number records when it was written, not when it should be built. Numbers are a filing system, not a plan.
>
> **The jump list, in order. Take these before any lower-numbered item.**
>
> | | Why it jumps |
> | --- | --- |
> | ~~K-80 `Flowchart`~~ | **VERIFIED 2026-08-20.** Built from the reference's real source; six of my measured figures were wrong and it corrected all six. |
> | ~~K-85 `Flowchart` drag + violet ground~~ | **BUILT 2026-08-20, awaiting verdict.** The rescope K-80 predates. A graph you cannot rearrange is a picture. |
> | ~~K-81 `AgentPulse`~~ | **VERIFIED 2026-08-20.** Removed the brand mark the founder ruled against and pinned the label to one type stop. Its azure stayed. |
> | ~~K-82 `InsightCards` chart~~ | **DECLINED 2026-08-20**, under the permission the item gave. The chart already exists and one of the item's own criteria would have broken a correct decision. |
>
> | ~~K-83 glyphs and connectors~~ | **BUILT 2026-08-20, awaiting verdict.** One glyph was not a drawing of anything, the rail broke for 4px on every row, and no duration ever fitted the 40px clock column. |
> | ~~K-84 `PlanCard` step controls~~ | **BUILT 2026-08-20, awaiting verdict.** Skip on anything unrun, approve only where a step is itself asking, and a 1.63px alignment swing fixed in the shared rhythm. |
>
> **THE LIST IS EXHAUSTED FROM KIRO'S SIDE as of 2026-08-20**, so it is resuming by number at K-17. Four of the five are `BUILT` rather than `VERIFIED`: struck through here because there is nothing left for Kiro to take, not because a verdict has landed. Claude strikes a line properly when it verifies it.
>
> **When this list is empty, resume by number.** When a new primitive item is written, add it here in the same commit, or it will be built last by default and this ruling will have to be made again.

**If you are Kiro and you have just been asked "what are you building next": read [§1 How to work](#1-how-to-work). Take the jump list above first, in its order. Then take the lowest-numbered item whose status is `TODO` and whose dependencies are all `VERIFIED`. Everything you need is in its row.**

**Every item's `Why` comes from the findings register: [`../planning/initiatives/audit-reports/agent-audit-2026-08.md`](../planning/initiatives/audit-reports/agent-audit-2026-08.md).** If an item's premise looks wrong to you, that file is where to check it — it records what was measured, when, and against what. It also names which existing docs are stale, which matters because several items exist only because a doc claimed something the code stopped doing.

Direction this queue implements: [`../planning/initiatives/agent-first-platform.md`](../planning/initiatives/agent-first-platform.md). **Its §5 traces every surface end to end — purpose, inputs, agent, backend, writes, handoff, learning loop — and §2 carries the object model.** Read §5's entry for the station you are touching before building anything that renders run state, station state, or a hold: that is **K-04, K-06, K-18, K-20, K-23, K-24, K-26, K-49, K-51 and K-60 to K-63**. For the rest, the direction is context rather than required reading. Design contract: [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md). Build rules: [`../../AGENTS.md`](../../AGENTS.md).

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

> **Corrected 2026-08-19: Kiro can write documentation and can search the web.** An earlier version of this file reserved both for Claude, which was wrong and cost the queue four research items it could have taken. What Kiro cannot reach is **the database, the MCP servers, and the live app** — nothing else.

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
6. **Append a `BUILT` entry to [`ledger/kiro-log.md`](./ledger/kiro-log.md)** — what you did, what you were unsure about, what you noticed. **In the same commit as the code**, never separated, or the log describes work that is not there.
7. **Push to `main`.**
8. **Never write `VERIFIED`.** That is Claude's verb and it means "checked against production", which you cannot do. **You do not set status anywhere else either** — an item's state is derived from the latest log entry naming it, so there is no status field for the two of you to fight over.

### Claude

1. Read [`ledger/kiro-log.md`](./ledger/kiro-log.md) for `BUILT` entries with no verdict.
2. Verify against **production and the running app**, not against the diff or the suite.
3. Append `VERIFIED` or `REJECTED` to [`ledger/claude-log.md`](./ledger/claude-log.md), saying **what was checked**, not that it looked right.
4. A `REJECTED` item is picked up again by Kiro from the reason in the entry.

### How the two lanes meet, concretely

**Kiro works on `main` directly.** Not a long-lived copy of it, and not a fork.

> **Corrected 2026-08-19.** An earlier version of this file told Kiro to cut a `kiro/K-NN-slug` branch per item. That convention **does not exist on the remote** — it was written as though it did, which is exactly the kind of claim this repo has a rule against. Working on `main` is simpler, and it is what makes the work visible: **Lovable deploys only `main`**, so an item that has not landed there is an item nobody can look at.

**What is still refused is a long-lived copy of `main`** that both agents build on for weeks and swap in at the end. **The code can be branched and the database cannot** — there is one Supabase instance and migrations applied through Lovable are live immediately, so such a branch either applies its migrations to the database `main` is running on, in which case `main` was never protected, or does not apply them, in which case it cannot run at all. Full reasoning: [`../design/agent-first-surface-brief.md`](../design/agent-first-surface-brief.md) §6.

**`main` is never retired, replaced, or force-pushed.** That orphaned 4,124 commits on 2026-07-27 and a `pre-push` hook blocks it now.

**Claude works in a separate worktree on its own lane**, pulls `main` to verify, and pushes its verdict. Different folders on disk is the one rule with no exception: two agents in one working tree race each other's writes and neither can tell.

**Where the safety actually comes from, since it is not the branch:**

| Risk | What contains it |
| --- | --- |
| A broken commit reaching `main` | The three gates, run **before** merge, every time |
| A user seeing a half-built surface | **Anything user-visible ships behind a flag.** `feature_flags` exists and holds zero rows |
| Two agents editing one file | **`Owns` is exhaustive per item.** Never touch a file another item lists |
| Something passing tests and doing nothing in production | Claude's verification pass, which queries the database rather than reading the diff |

**Most of this queue is not user-visible at all** — Meridian components land in the gallery before they are wired, deletions change no rendered output, pure modules have no surface, tests have no surface. The flag rule bites on the route ports (**K-47 to K-59**) and on anything that changes a shipped screen.

### Running both agents at once

**Yes, both can run simultaneously. Three rules make it safe, and one of them is not obvious.**

**1. Different folders. Non-negotiable.**
Two agents in one working tree race each other's file writes and neither can tell. Kiro works in one checkout, Claude in another. Same repo, same branch lineage, **different directories on disk.** This is the only rule with no exception.

**2. Most of Claude's parallel work does not touch the repo at all.**
This is the part that makes concurrency workable, and it is easy to miss. Verification means **querying production and reading code** — read-only. Claude's actual writes during a build cycle are:

- **migrations**, which are new files and can never conflict
- **verdicts in §3 Build log**, which are appends
- **docs**, which Kiro does not own

So the collision surface is far smaller than the file lists suggest.

**3. Three files are genuinely contested. Each has a rule.**

| File | Owned by | Rule |
| --- | --- | --- |
| **`src/__tests__/meridian-ratchet.baseline.json`** | **33 items** | **Never hand-merge it. Ever.** It is generated. On any conflict, take either side, then run `bun run design:ratchet` and commit what it produces. Regenerating is always correct; merging generated JSON by hand is always wrong |
| **`src/routes/_authenticated.meridian.tsx`** | **13 items** | **Append-only.** Every item adds its gallery section at the end and edits nothing above. A conflict here is two additions and resolves by keeping both |
| **`src/styles/meridian.css`** | 6 items | **One item at a time.** Token additions are small and sequential; do not start a second meridian.css item while one is `IN PROGRESS` |

**And the protocol for this file**, which both agents write to constantly:

- **Kiro** edits its own item's `STATUS`, and **appends** to §3 Build log. Nothing else.
- **Claude** appends verdicts under those entries, and edits item bodies **only when the item is `TODO`** — never while it is `IN PROGRESS` or `BUILT`.
- **Neither rewrites another agent's log entry.** Corrections go in a new entry that references the old one.

**4. When Claude must touch a file Kiro's item owns.**
It happens — an urgent fix, a founder ruling landing mid-build. The rule is **announce, do not surprise**: Claude adds a `> **Rebase note.**` line to that item saying what changed and that it is safe to pull. This has already happened once, on **K-02**, when the illustration ban was lifted and `surface-parts.tsx` needed a comment change.

**5. Pull before you start an item, and push when it is green.**
A branch cut from a stale `main` is how a merge conflict becomes a merge problem. Both agents pull first, commit small, and push often.

### What Claude is doing while you build

So you know what is covered and do not attempt it:

| Claude's lane | Why it cannot be yours |
| --- | --- |
| **Every migration**, and applying it through Lovable | Applied SQL is not committed SQL; the bot applies migrations too |
| **Verifying each `BUILT` item against production** | Nine features once shipped passing every test and doing nothing. None was found by reading code |
| **Runtime behaviour**: the SSE frames arriving in order, a run stopping mid-tool-call, a steer reaching a non-Build station | Needs a live run |
| **Deciding how seven eval dimensions compose into one trust number** | A product decision requiring the live schema |
| **Stamping `product_id` on `credit_ledger`** and the multi-product migrations | Writes |
| **Reference research for Discover, Design, Ship and Brain** | Four stations have no reference product researched yet, and the standing rule is to lift an information model rather than invent one |
| **The forecast wiring**, once K-13 lands | Schema plus a production read |

**The division is not seniority, it is access.** You can prove a component renders, a function returns, a type checks and a test passes. You cannot prove a column is populated, a tick is scheduled, or a surface shows the truth. That is the whole line.

### You are expected to judge, not to comply

**Every item carries a `Why` for one reason: so you can tell when it is wrong.** The `What` is a proposal from someone who read the code and could still have misread it. You are reading it fresh, at build time, with the file actually open. That is a better vantage point than the one the item was written from.

**Push back when any of these is true.** Do it in the build log, before or instead of building:

- **The premise does not hold.** The count is different, the line has moved, the defect was already fixed, the file does not say what the item claims. Report the real number. Several items in this queue exist *because* an earlier document asserted something the code had stopped doing.
- **The fix is wrong even though the problem is real.** Say what you would do instead and why. An item that names a bad remedy for a true defect is the most common failure mode here, and you are better placed to catch it than the person who wrote it.
- **It cannot be done without a database after all.** Move it to §4 Blocked and say which line needs the live answer. A guess dressed as a build is worse than a blocked item.
- **Doing it would break something the item did not consider.** Stop. K-28 is the worked example: the obvious move on that item ships a visible regression, and the only reason it is written down is that somebody checked the cascade instead of trusting the instruction.
- **The acceptance criteria cannot actually be checked**, or they would pass while the thing stayed broken. Say so. A criterion that green-lights a defect is worse than none.

**What you owe back on every item, in §3 Build log:**

1. **Did** — what you built, in two or three sentences.
2. **Unsure** — anything you guessed at, and any decision that could reasonably have gone the other way. **This is the most valuable field.** It is where verification gets aimed, and an empty one on a genuinely ambiguous item reads as not having looked.
3. **Noticed** — anything true that is not in the item. A nearby defect, a stale comment, a count that did not match, a file that surprised you. This is how the queue grows correctly.
4. **Gates** — tsc, test, build.

**What you do not decide alone:** anything touching a migration, production data, or a claim about what is live. Those are not judgment calls, they are things the repo has already been burned by guessing at. Nine features once shipped that passed every test and did nothing in production, and none was found by reading code.

### The bar is beautifui.dev, and it is a floor rather than an inspiration

**Founder ruling, 2026-08-19, stated three times in one session because the work kept missing it.** Meridian is not "inspired by" beautifui.dev. **It is ported from it.** Where a pattern exists there, the job is to mimic it, not to reinterpret it. Where one does not, the job is to build something that would not look out of place beside it.

> *"Just randomly, we cannot code and create some buttons, some random components. It needs to be a world-class, top-notch product."*

**Port from the real source, never from a screenshot.** A screenshot preserves the look and loses the mechanics, and the mechanics are the part that is hard: the easing curve, the stagger, what happens at 200 rows, what the empty state does, where focus goes on Escape.

**The failure this is aimed at is not ugliness. It is arbitrariness.** A component that renders correctly, passes its tests and clears the ratchet can still be **randomly assembled** — spacing that came from whatever looked fine, a glyph chosen because it was to hand, a label format that differs from the one three components over. Every one of those passes every gate this repo has.

**What follows is six EXAMPLES of that failure, not a checklist, and the difference decides whether this rule works.** Each one was found by looking at what has already shipped here. **Satisfying these six and nothing else is the same failure one level up** — a component assembled to pass a list rather than designed. The instruction is to acquire the lens these six were seen through and then apply it to everything, including every defect of this kind that is not written down and never will be.

**The test, on any element you are about to ship: can you say why it is exactly there, exactly that size, exactly that word?** If the honest answer is "it looked fine", it is not finished. That question is the rule. The six below are only worked examples of asking it.

1. **Does every column line up with the one above it?** Measured, not eyeballed. A duration that sits in the label column while every sibling row puts its number in the time column is the single most visible tell that a component was assembled rather than designed. *This is live in `RunTimeline` today: the `28m 0s` on a silence row does not sit on the clock column that every event row uses.*
2. **Is one idea expressed one way everywhere in the component?** An agent credited as `Research · Discover` on one row and `Challenge` on the next is two formats. Pick the format, state it in the file, apply it to every row including the ones where half of it is missing.
3. **Would an icon carry this better than a letter?** Cryptic ASCII markers (`[]`, `→`, `⇄`, `H`) are placeholders, not iconography. **Use the mark of the thing being named:** a pull request wears the source-host mark, a test run wears the test-runner's, a web fetch wears a globe, a human gate wears the person mark that already exists. And having chosen one, align it optically to the text baseline rather than to its own bounding box.
4. **Does it sit in the same rhythm as its neighbours?** `PlanCard`, `RunTimeline` and `ToolStream` are three views of one run and today they read as three products. Same row height, same gutter, same label scale, same place for a timestamp, or the set is not a set.
5. **What does it do at the sizes nobody drew?** Zero rows, one row, 200 rows, a 90-character label, a 6-hour duration. *`useElapsed` renders an 86-hour hold as `5160m 0.0s` because it has no hours branch, and that was found by reading rather than by looking.*
6. **Does colour still mean something in greyscale?** Structure carries meaning; hue confirms it. If removing colour removes the meaning, the structure was never doing its job.

#### The reference, measured off the live site 2026-08-19, not read off a screenshot

Run against `https://www.beautifului.dev/`, 424 sampled elements, via `getComputedStyle`:

| | beautifului.dev | Meridian components today |
| --- | --- | --- |
| Dominant row height | **20px** (156 of 424), then 23 · 29 · 28 · 32 · 36 | RunTimeline **29** · ToolStream **44/28** · PlanCard **48** · Spend **21** |
| Type sizes actually in use | **14 · 13 · 12.5 · 12 · 11.5** | **14px, and nothing else** |
| Gap scale | **4 · 5 · 6 · 8 · 10** | mixed |
| Radii | **6 · 7 · 8** | mixed |
| Body | Inter, weight 400, 14px | — |

**Two things to take from this, and the second is the important one.**

1. **The reference is far denser.** Our rows run 1.5x to 2.4x taller than its dominant 20px. Density is not crowding; it is how a run of forty tool calls stays readable without becoming a scroll.
2. **The reference runs a real type hierarchy and we do not.** It uses five sizes down to half-pixel steps; every Meridian component measured uses **one size, 14px, for everything**. That single fact explains most of "it looks flat and randomly placed" better than any spacing tweak: with no size hierarchy nothing declares its rank, so the eye has no path through the row and every element reads as equally important, which means none of them reads as important.

**Sibling components must share a base row height.** Four views of one run currently use four. Pick one, put it in the file, and let the exceptions be deliberate.

> **One number in the audit register did not reproduce.** `agent-audit-2026-08.md` §6 records "Body weight 400 vs **the reference's 450**" and queues K-25 to change body weight on the strength of it. Measured on the live site, `document.body` computes **400**. Re-measure before acting on K-25; changing body weight repo-wide on a number that does not reproduce is exactly the class of mistake that register exists to prevent.

**Status colour now has chips.** `--mrd-{status}-chip` and `--mrd-{status}-on-chip` exist in both grounds as of 2026-08-19. **On paper, coloured TEXT cannot carry status** — the gamut will not allow a vivid colour at the lightness the contrast floor demands, so amber resolves to brown. The chip carries the colour, the label carries the legibility, and both grounds use it so the component is one component. The argument and every measured figure are in `src/styles/meridian.css`.

---

### Status is derived, not stored

`TODO` → `STARTED` → `BUILT` → `VERIFIED` | `REJECTED`

**There is no status field.** An item's state is **the most recent log entry naming it**, across both ledgers. Kiro may write `STARTED` `BUILT` `BLOCKED` `QUESTION`; Claude may write `VERIFIED` `REJECTED` `RULED` `LANDED`. Neither writes the other's verbs.

This exists because both agents write constantly and **a file with one writer cannot conflict.** Protocol: [`ledger/README.md`](./ledger/README.md).

### The rules that fail a build here

These are not style preferences; `bun test` enforces them.

- **MERIDIAN IS THE ONLY DESIGN SYSTEM. FIVE OTHERS ARE RETIRED AND NONE OF THEM IS A REFERENCE.**

  Retired, permanently: **v1 Ember**, **v3 Obsidian**, **v4 Loom**, **v5 Tempo**, and **Cadence/ink**. Their vocabularies are `--sp-*`, `--ds-*`, `--text-*`, `--hairline`, `--madder*`, `--glacier`, `--font-pixel`, `--raised`, `[data-obsidian]`, `src/components/shell/primitives.tsx` and `src/components/ui/`.

  **Build only from `src/styles/meridian.css` and `src/components/meridian/`.**

  **THE TRAP, and it is the reason this rule needs five lines instead of one.** Those systems **still run**, deliberately — deleting them in one move is how the 2026-07 rebuild failed. So **5,864 occurrences across 285 files are still in the tree, and you will open one.** A file using `--sp-ink` is not showing you the house style; it is showing you debt that has not been paid yet. **Reading a retired pattern is never permission to copy it**, and neither is a comment inside a retired file arguing for itself — one such comment calls its own hairline rule *"a rule, not decoration"*, and the founder has ruled that retired files arguing with Meridian lose. **When a retired file disagrees with Meridian, Meridian wins and the retired file is wrong.**

  **This is enforced, not requested.** `src/__tests__/meridian-ratchet.test.ts` fails `bun test` when a **new** file carries any retired marker or a raw colour (`#hex`, `rgb()`, `hsl()`), and when an **existing** file's count grows. **Never widen the baseline to pass** — `bun run design:ratchet` is only for recording debt you removed.

  **No `--mrd-*` token fits? That is a gap in Meridian, and you build it there** (standing founder ruling). A token earns its place on the second caller, is named for meaning rather than appearance, is measured in both grounds, and carries its argument in the file. Reaching back to a retired token because it already has the value you want is the single move this whole migration exists to stop.
- **Never widen the baseline to pass.** `bun run design:ratchet` is only for recording debt you removed.
- **No `--mrd-*` token fits? That is a gap in Meridian — build it there.** A token earns its place on the second caller, is named for meaning not appearance, and carries its argument in the file.
- **Colour carries status, never decorates.** Five status words only: `you` (a person is required), `agent` (a machine is working), `pass`/`fail` (an outcome that happened, never an intent), `hold` (waiting on a condition). It must survive a greyscale test.
- **Identity is shape, status is hue.** Never paint a station or agent identity as a colour ramp.
- **No native browser chrome.** No `alert`, `confirm`, `prompt`, or native `<dialog>`. ESLint-enforced.
- **Humanized output on anything a user reads.** No em or en dashes, no AI-cliché phrasing in UI copy, labels, empty states or errors. Not applicable to code comments or docs.
- **Every component with an early return carries `data-mrd=""` on that return too**, or its controls lose the focus ring.

---

## 2. The queue

**79 items. Dependencies are item numbers.** `Owns` is exhaustive — those are the only files to touch.

---

### Group A — Meridian primitives

The design system has no vocabulary for an agent working. Measured: `--mrd-you` has 97 usages and `--mrd-agent` 59, not because agents matter less but because there are five surfaces for "a person is required" and essentially one for "a machine is working." These nine items build the missing half.

---

**K-01 · `--mrd-stop`, the token an interrupt can wear**
`STATUS: VERIFIED 2026-08-19` · deps: none · size: S

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
`STATUS: VERIFIED 2026-08-19` · deps: K-01 · size: S

**What.** Add a fourth variant to `Action` in `src/components/meridian/surface-parts.tsx`, wearing `--mrd-stop`.

**Why.** `Action` has `default | primary | quiet`, plus `Approve` for the case where a click unblocks something. None of them may carry "stop this run and discard forty minutes of work." Every stop control in the product needs this, and there is nowhere for one to sit today.

**How.** Match the existing variant implementation. Keep the `Approve` distinction intact — `Approve` is for a click that *unblocks*, `destructive` is for a click that *stops or removes*. Do not make destructive the loudest thing on the screen; distance plus a confirm is what protects a destructive act, not volume.

**Acceptance.**
- `<Action variant="destructive">` renders and is keyboard reachable with a visible focus state.
- Rendered in `src/routes/_authenticated.meridian.tsx` beside the other variants, in both grounds.
- No raw colour; the fill comes from K-01's token.

**Owns.** `src/components/meridian/surface-parts.tsx`, `src/routes/_authenticated.meridian.tsx`

> **Rebase note.** Claude edited the `NothingHere` doc comment in this file on 2026-08-19 to lift the illustration ban (founder ruling, recorded in [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md) §2a). Comment-only, no behaviour change. Pull before you start.

---

**K-03 · `Dialog`**
`STATUS: REJECTED 2026-08-20` · deps: K-02 · size: M

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
`STATUS: VERIFIED 2026-08-19` · deps: none · size: L

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
`STATUS: VERIFIED 2026-08-20` · deps: none · size: M

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
`STATUS: VERIFIED 2026-08-20` · deps: none · size: M

**What.** A forward-looking list of steps an agent commits to **before** acting: each step has a label, an owning agent, a station, and a state of `pending | active | done | skipped | failed | needs-approval`.

**Why.** Every step display in the system is **retrospective**. `Thinking` variant `Steps` shows what happened. `TaskStatus` is `running | done | failed | blocked` — it has **no `pending` and no `skipped`**, and `taskStatus()` collapses every unrecognised value to `blocked`, which misreports a step that has not started yet as stuck. The product needs to show a plan and wait on it, which is how one approval at the top replaces a queue of fourteen later.

**How.** Do not extend `TaskStatus`; this is a different concept and conflating them is what produced the `blocked` bug. A `skipped` step must be able to carry a reason, because a founder ruling requires that a skipped station is a decision on the record with a reason.

**Acceptance.**
- All six states render distinctly and survive greyscale.
- A skipped step shows its reason.
- `needs-approval` uses `--mrd-you`; `active` uses `--mrd-agent`. Nothing else uses either.
- Gallery: a five-step plan in mixed states, and a one-step plan.

**Owns.** `src/components/meridian/PlanCard.tsx`, `src/components/meridian/__tests__/plan-card.test.tsx`, `src/routes/_authenticated.meridian.tsx`
· built also with `src/components/meridian/run-rows.tsx` (`RUN_LINE` and `GLYPH_SLOT`, where the alignment defect actually lives), which carried the fix into `RunTimeline.tsx` and `ToolStream.tsx` too.

---

**K-07 · `Spend`**
`STATUS: REJECTED 2026-08-20` · deps: none · size: S

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
`STATUS: VERIFIED 2026-08-20` · deps: none · size: M

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
`STATUS: VERIFIED 2026-08-20` · deps: none · size: M

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
`STATUS: VERIFIED 2026-08-20` · deps: none · size: L

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
`STATUS: VERIFIED 2026-08-20` · deps: none · size: M

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
`STATUS: VERIFIED 2026-08-20` · deps: none · size: M

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
`STATUS: VERIFIED 2026-08-20` · deps: none · size: M

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
`STATUS: VERIFIED 2026-08-20` · deps: none · size: S

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
`STATUS: VERIFIED 2026-08-20` · deps: none · size: M

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
`STATUS: VERIFIED 2026-08-20` · deps: K-15 · size: M

**What.** Make `intent: "do"` able to promote a request to a mission on its own, and make the silent-degrade path explicit.

**Why.** "Hand it over" works **by accident.** The client prefixes the literal string `@cos`, which resolves to the orchestrator and skips the classifier. The branch designed for this is dead: line ~681 requires `startingAgent`, which is only ever assigned inside the `if (isMission)` block **above** it, so it can never fire. The consequence is real: with no seeded orchestrator, **"Hand it over" silently returns prose and starts nothing.**

**How.** Make `forcedDo` sufficient on its own. Then make every pre-flight downgrade (no workspace, unseeded orchestrator, zero enabled specialists) surface as a **named state the user can act on**, not a system message injected into a chat answer. A button that silently does something else is worse than a button that says it cannot run yet.

**Acceptance.**
- `intent: "do"` dispatches without depending on the `@cos` prefix.
- Each downgrade path produces a distinct, readable state naming what is missing and what to do.
- The existing `@cos` path still works.
- A test covers each downgrade condition.

**Owns.** `src/routes/api/chat.ts`, `src/hooks/use-ask-stream.ts`, `src/routes/api/__tests__/chat-dispatch.test.ts`
· built also with `src/lib/chat-dispatch.ts` (new; a route module cannot be imported by a test here, so the predicate and the five sentences live where they can be executed) and one stale comment in `src/lib/ask-sse.ts`.

---

### Group C — Wiring what already exists

---

**K-17 · ~~Wire `StreamingText` and `ToolChips` out of the gallery~~**
`STATUS: WITHDRAWN 2026-08-20` · deps: K-05 · size: M

> **WITHDRAWN, not deferred. Do not build this and do not come back to it.**
>
> The premise held: both components have **zero product callers**, confirmed. The prescription did not. On the run route both would say something twice -- `ToolChips` against the steps ledger that already renders every tool call, `StreamingText` against `ReturnSummary` -- and `StreamingText` would animate prose that arrived minutes ago off a 4-second poll, asserting "this is being written now" about a finished string.
>
> **The decisive evidence is that the surface it would have gone to already refuses this exact pattern in writing.** `AskTurn.tsx:261-268` states there is deliberately no second branch for the in-flight case, because *"a separate 'streaming text' path is exactly how a surface ends up showing raw hashes for the eight seconds a person is actually watching it, and then tidying itself up once they have stopped."*
>
> **A component with no home is not a defect to be fixed by finding it one.** They stay as reference ports in the gallery. Full ruling in the Claude log, 2026-08-20 05:45.

**What.** Mount `StreamingText` and `ToolChips` on the run detail surface.

**Why.** Both components are **fully built, ported from the reference, and wired only to the gallery**. The two components whose entire subject is an agent working are used nowhere in the product. This is the cheapest possible increase in agent visibility: no new components, just doors.

**How.** The run surface is deliberately organised as report-first, transcript-behind-a-tab — that ordering is a documented 2026-08-10 decision and is correct. Do not invert it. These go **inside the existing tab row**, not above the report.

**Acceptance.**
- Both render with real run data on `/runs/$missionId`.
- The report still lands first; the tab row is still collapsed on arrival.
- Empty, streaming and failed states composed, not merely handled.

**Owns.** `src/routes/_authenticated.runs.$missionId.tsx`

---

**K-18 · A gate waiting on YOU is painted amber, which means it is not on you**
`STATUS: VERIFIED 2026-08-20` · deps: none · size: S

> **REWRITTEN 2026-08-20 after Kiro's BLOCKED entry, which was right on both counts.** The original asked for "the sixteen hold reasons" to be given a surface. **There are fifteen**, so its acceptance could never be satisfied; **one of them is `done`**, which is not a hold and would have rendered finished work as stuck; and **all fifteen already reach a surface** via `holdLine` -> `rowToTrack` -> `TrackStart.tsx:472`. The gap it described was closed. What follows is the defect it found instead.

**What.** Paint the station chip by WHICH hold it is, not by whether there is one.

**Why.** `TrackStart.tsx:487` reads `tone={t.hold ? "hold" : "quiet"}`. **Every hold gets amber, including `waiting-on-a-person`.** So a gate waiting on *you* renders in the token meaning **stopped, and not on you** -- the one distinction those two tokens exist to draw, inverted for the case where it matters most. The file already computes `waitingOnAPerson` at `:452` to decide whether to draw a control, and does not use it for the tone.

**How.** The split, argued from `meridian.css`'s own enumeration rather than from how the sentences sound:

| | reasons |
| --- | --- |
| **orchid**, a decision on THIS work releases it | `waiting-on-a-person`, `station-cannot-finish`, `corrections-spent`, `given-up` |
| **amber**, a condition elsewhere, or it resolves itself | `paused`, `no-agent`, `produced-nothing`, `nothing-to-hand-on`, `stalled`, `over-budget`, `out-of-time`, `out-of-credit`, `needs-evidence`, `needs-a-waived-station` |
| **neither** | `done`, which is not a hold |

**The test for the hard cases is who releases it.** You top up an account; you do not *decide* this track. So `over-budget` and `out-of-credit` are amber despite sentences that sound like a request. `StalledWork`'s header argues the same from production: **26 tracks were starved of evidence while the product told their owners to go inspect a station**, which is why `needs-evidence` must not wear orchid.

**Acceptance.**
- Orchid for exactly the four, amber for the ten, neither for `done`.
- A test asserts the classification **by reason** rather than by rendered class name, so it survives a copy change.
- Greyscale survives, because the reason sentence already says which it is.

**Owns.** `src/components/spine/TrackStart.tsx`, and a colocated test.
· built also with `src/lib/spine/driver.ts` (the classification, beside `HOLD_LINE`, so `StalledWork`'s private two-value copy can read one set) and `src/lib/spine/track.functions.ts` (`holdReason` on `Track`: the component cannot classify what it is not given). **And not by painting the `Value`** -- it refuses a `you` tone on purpose, so the status moved onto a `StatusChip` and the station name went back to `quiet`.

---

**K-19 · Doors for the six orphan routes**
`STATUS: VERIFIED 2026-08-20` · deps: none · size: S

> **Six of the seven paths named here are redirect stubs, and a redirect stub with no inbound link is
> doing its job.** It catches links that already exist outside the codebase. Adding one would manufacture
> traffic to an address we have decided against; deleting one fails `AGENTS.md`'s delete test on every
> ground, because they are not superseded, they ARE the supersession mechanism. All six verified pointing
> at live routes. **`/meridian` was the one real orphan** (3,047 lines, zero inbound links) and now has a
> door in the Engine Room, per doctrine 1.3: a component gallery is machinery. Measurements in the Kiro log.

**What.** Give an inbound link to `/artifacts`, `/m`, `/meridian`, `/missions/$missionId`, `/prds/$id`, `/studio/$missionId`.

**Why.** These six authenticated routes have **zero inbound links** anywhere in the codebase — reachable only by typing a URL. `AGENTS.md` names *"a capability with no door"* as **the dominant defect in this repo**, and a route-reachability test exists specifically to catch it. Six got through.

**How.** Check each one first: `/m` and `/studio/$missionId` may be redirect stubs, in which case the correct fix is deleting them, not linking them. Say which is which in the build log. Do **not** add rail rows — nav is contract-controlled and features never add nav items. Link from inside the surface each one belongs to.

**Acceptance.**
- Each of the six is either reachable from a rendered control, or removed as a dead stub with a note saying why.
- No new primary nav rows.
- The route-reachability test passes without being weakened.

**Owns.** whichever surfaces provide the links, listed in the build log before you start
· built with `src/routes/_authenticated.engine-room.tsx` only, because five of the six needed nothing.

---

**K-20 · The Run Map**
`STATUS: VERIFIED 2026-08-20` · deps: K-06 · size: L

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
· built also with `src/components/meridian/station-glyphs.tsx` (the `AgentStation` to `StationGlyphKind` map, which was declared twice already in `CrewChrome.tsx` and `AppFrame.tsx`; both now read the shared one rather than a third copy being written here).

---

### Group D — Roster and documentation drift

---

**K-21 · Fix the agent roster drift**
`STATUS: BUILT` · deps: none · size: S

**What.** In `src/lib/agent-vocabulary.ts` and the driver's guard: resolve the duplicate **"Engineer"** display name, and extend `driver.test.ts` to cover `tier: "crew"`.

**Why.** Three defects, all invisible to the current guards. `engineer` is `status: "deprecated"` yet **seeded into all 16 workspaces**, and **both `builder` and `engineer` render as "Engineer" at the Build station** — two agents in one workspace whose names do not distinguish them, which is the one thing a job-verb naming scheme exists to prevent. Separately `reactor` and `archivist` are `status: "active"` and seeded **nowhere**; `driver.test.ts` only guards `tier: "cast"`, so it cannot see them.

**Important: do not merge any agents.** An earlier draft of the direction proposed consolidating the roster and that was wrong. The maker→reader pairing at each write station is the mitigation for a **21.3%** failure category (task verification), while role-disobedience is **0.5%**. Merging the pairs would optimise a 0.5% problem by deleting the guard on a 21% one. The roster shape is correct; only the drift is wrong.

**How.** The display-name collision and the test guard are yours. **Unseeding `engineer` from the 16 workspaces is a data change and belongs to Claude** — flag it in the build log rather than writing a migration.

**Acceptance.**
- No two agents share a display name at one station.
- `driver.test.ts` fails if an `active` agent of any tier is dispatched by nothing.
- No agent merged, renamed to a persona, or removed from the catalogue.

**Owns.** `src/lib/agent-vocabulary.ts`, `src/lib/spine/driver.test.ts`
· built also with `src/routes/_authenticated.meridian.tsx`: the new dispatch guard found two gallery fixtures using deprecated slugs (`planner`, `designer`), and fixing the fixtures was the right answer rather than excluding the gallery from the sweep.
· **Claude still owns the data half:** `engineer` is `deprecated` in the catalogue and seeded into all 16 workspaces, which is what makes two agents render as "Engineer" at Build. No code change can clear that row.

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

## 2b. The debt is mostly dead code, not a porting job

**Measured by the sweep on 2026-08-19, and it changes the shape of the work.** The Meridian ratchet reports 5,864 occurrences across 285 files, and that figure reads as a large migration. It is not.

- **`src/components/ui` holds 455 occurrences and 322 of them are unreachable.** A transitive import walk rooted outside the folder leaves nine live modules; the other 39 are imported by nothing. Two of them, `badge.tsx` at 35 and `menubar.tsx` at 34, are the 11th and 13th largest debt files in the entire repo and have zero importers.
- **`src/styles.css` carries three top-level theme blocks, not two**, and the earliest is dead in full: `:root` at line 3220 sits *between* the two light blocks and beats the first on source order. Deleting it drops the file 1224 → 1022 with zero behaviour change.
- **`[data-obsidian]` is declared four times at top level.** 56 declarations in the earliest block are shadowed by a later one and paint nothing.

**So the first move is deletion, not migration.** It is cheaper, it is permanent, and it is the only debt reduction that cannot regress.

> **One rule governs every deletion item.** `meridian-ratchet.test.ts` rule 3 **fails when a count goes DOWN** and the baseline still permits the old number, because reclaimed ground is re-frozen. So a deletion goes red until `bun run design:ratchet` records the lower count, and **the lowered `meridian-ratchet.baseline.json` ships in the same commit.** That script is local file I/O with no network. It is only ever for recording debt you removed; never run it to clear a growth failure.

---

### Group F — Dead code, and the four tests something must pass before it is deleted

> **FOUNDER RULING, 2026-08-19, and it governs every item in this group.** *"I do not want you to blindly delete it. If it is a duplicate, I am okay with it. If it is required, let us keep it rather than deleting it."*
>
> **Unused is not a reason to delete. It is a reason to ask why the door is missing.** This repo's own most common defect is *a capability built correctly and reachable from nowhere* — `AGENTS.md` §4 names it outright. Deleting such a thing removes the evidence of the gap and guarantees somebody rewrites it later.
>
> **DELETE only when one of these four holds. Name which one in the build log.**
>
> 1. **SHADOWED.** A later declaration of the same thing wins, so this one never executes. Removing it cannot change behaviour. *(K-28, K-29, K-30, and the shadowed half of K-33.)*
> 2. **REGENERABLE.** Vendored library code that one command restores. Nothing authored here is lost. *(K-27: `bunx shadcn@latest add <name>` brings any of the 39 back.)*
> 3. **SUPERSEDED.** A live Meridian equivalent already exists and is in use. The old one is not a spare, it is a second answer to a settled question. *(K-31, K-32, most of K-33.)*
> 4. **BROKEN AS WRITTEN.** It cannot be adopted without a rewrite, so what is being kept is not a capability, it is a defect somebody may copy. **Say what is broken.** *(K-35: the mock harness keys on `serverFn.name`, which is not stable for `createServerFn` wrappers, and ignores the mutation key. K-36: 60 unexercised lines carrying a live status-mapping bug.)*
>
> **KEEP, and build the door instead, when:**
>
> - The capability **works** and is only unreachable. File it as a missing door, not as dead code.
> - The **intent is good and only the wiring is missing.** Deleting removes a broken promise; wiring it removes the broken promise *and* delivers the feature. That is a product decision and it is not yours to take by default. **K-37 is now this case — see its note.**
>
> **If you are unsure which bucket something is in, it is a KEEP.** Deleting is only cheap when it is provably one of the four.

Every item here removes lines. The measured Meridian debt in this repo is **not mostly a porting job**: `src/components/ui` alone is 455 occurrences of which 322 are unreachable, and `src/styles.css` carries three separate blocks that are overridden before they paint. Deleting is cheaper, safer and permanent, and it is the only kind of debt reduction that cannot regress.

**One rule governs every item in this group.** `src/__tests__/meridian-ratchet.test.ts:99` — "keeps the ground that has been gained" — **fails when a count goes DOWN and the baseline still permits the old number.** So every deletion here goes red on `bun test` until you run `bun run design:ratchet` and commit the lowered `src/__tests__/meridian-ratchet.baseline.json` in the same commit. That script is local file I/O, no network. **It is only ever for recording debt you removed. Never run it to make a growth failure go away.**

---

**K-27 · Delete the 39 dead shadcn modules in `src/components/ui`**
`STATUS: TODO` · deps: none · size: S

**What.** Delete the 39 unreachable modules under `src/components/ui`: `accordion`, `alert`, `aspect-ratio`, `avatar`, `badge`, `breadcrumb`, `calendar`, `card`, `carousel`, `chart`, `checkbox`, `collapsible`, `context-menu`, `dot-pattern`, `drawer`, `form`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `pagination`, `progress`, `radio-group`, `resizable`, `scroll-area`, `select`, `separator`, `shader-animation`, `sidebar`, `skeleton`, `slider`, `sonner`, `switch`, `table`, `tabs`, `textarea`, `toggle`, `toggle-group`, `tooltip`. In the same commit change `src/__tests__/client-storage-consent.test.ts:303` — the assertion that `writers` equals exactly `["src/components/ui/sidebar.tsx"]` becomes `[]` — and correct `docs/operations/security/cookie-and-storage-policy.md`, which states at line 15 and again in the table at line 32 that the only `document.cookie` write in the tree is `sidebar_state` at `src/components/ui/sidebar.tsx:86`.

**Why.** A transitive import walk rooted at every file **outside** `src/components/ui` leaves nine live modules (`alert-dialog`, `button`, `command`, `dialog`, `dropdown-menu`, `input`, `label`, `popover`, `sheet`). The other 39 are reachable from nothing. They carry **322 of the folder's 455 debt occurrences**, including `ui/badge.tsx` at 35 and `ui/menubar.tsx` at 34 — the #11 and #13 files on the whole debt table, both pure `--ds-*` token debt with zero importers. The only references anywhere outside the folder are six mentions in `./design-reference/tempo-v5/*.md`, which is retired pattern documentation, not code.

**How.** The policy doc is the part that is easy to miss and the part that matters: **it is the supporting document for a shipped privacy policy, and deleting `sidebar.tsx` makes it false.** `scripts/docs-doctor.sh` only link-checks `.md` targets, so a dead link to a `.tsx` passes silently — nothing will catch this for you. Leave the second assertion in that test block (`mounted` `toEqual([])`) alone; it stays valid. Roughly 28 npm dependencies (most `@radix-ui/*`, `embla-carousel-react`, `vaul`, `sonner`, `recharts`, `input-otp`, `react-day-picker`, `react-hook-form`, `react-resizable-panels`) become unimported — **do not remove them in this item**, note them in the build log.

**Acceptance.**
- 39 files gone; the nine live modules untouched.
- `bunx tsc --noEmit` clean — nothing outside the folder imported any of them.
- `client-storage-consent.test.ts` passes with the empty-writers expectation.
- The cookie policy doc names no deleted path and carries no dead link; `bun run docs:check` clean.
- Baseline re-frozen lower, in the same commit.

**Owns.** the 39 files above under `src/components/ui/`, `src/__tests__/client-storage-consent.test.ts`, `docs/operations/security/cookie-and-storage-policy.md`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-28 · Delete the early light-theme block in `styles.css`, and move nothing out of it**
`STATUS: TODO` · deps: none · size: S

**What.** Delete `styles.css` lines **1856–1991** — the first `[data-theme="light"], .light-theme` block — in full. **Move neither property out of it.**

**Why.** There are three blocks, not two. `:root { … }` occupies lines **3220–3564** (260 custom properties) *between* the two light blocks. `:root` and `[data-theme="light"]` are both specificity (0,1,0), both match `<html>`, and all three are unlayered plain CSS — the file's `@layer base` and `@layer utilities` open at 475 and 602 and close well before 1856. So `:root@3220` already beats the early block on source order and **all 106 of its properties are dead**, not 104. Measured by simulating the deletion through the ratchet's own `debtInCss` counter: `src/styles.css` goes **1224 → 1022**, a 202-occurrence drop (93 raw hex, 109 `--ds-`) with zero behaviour change.

**How.** The trap is the "move the two unique properties" instruction that looks obvious and ships a visible regression. `--ds-focus-ring` is harmless — `:root@3220` carries the byte-identical value. **`--ds-contrast-fg` is not.** It is `#000` in the early block and `#fff` at `:root@3220`, so light theme computes `#fff` today; placing `#000` into the later block at 3567 makes it win **for the first time** and flips light-theme text on every solid chip from white to black — `src/components/ui/badge.tsx` lines 43, 49, 55, 65, 72, 77, 83, 93 and `src/components/ui/tooltip.tsx` lines 27, 31 all pair `text-(--ds-contrast-fg)` with a `--ds-*-800`/`-700` fill. Black on `--ds-red-800` is the regression. Both properties are already covered at the values light theme renders today. If `#000` is genuinely wanted, that is a separate design ruling, not cascade arithmetic. (If K-27 has landed, some of those badge call sites are gone; the rule stands either way.)

**Acceptance.**
- Lines 1856–1991 removed; no property relocated.
- `bun run dev` and compare light ground before and after: no visible change on any chip, tooltip or focus ring.
- Baseline re-frozen; `src/styles.css` records the lower number.

**Owns.** `src/styles.css`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-29 · Delete the shadowed declarations in the early `[data-obsidian]` block**
`STATUS: TODO` · deps: K-28 · size: S

**What.** `styles.css` declares `[data-obsidian]` at top level **four** times — 2096, 2358, 2567 (the Loom v4 block) and 3711 — plus `html[data-obsidian]` at 3013. Compute the set of property names in the block at **2096–2354** that any *later* `[data-obsidian]` block redeclares, and delete those lines from the early block only. Do not touch the later blocks.

**Why.** Identical selector, identical specificity, later source order: for every shadowed name the early declaration is unconditionally overridden and paints nothing. **The count is 56, not the 51 you get from diffing against 3711 alone** — the Loom block at 2567 shadows five more (`--shadow-elevated`, `--shadow-glass`, `--tempo-text-base`, `--text-h2`, `--text-hero`) that 3711 does not touch. Simulated: `styles.css` **1224 → 1181**. Small in isolation, but this two-block structure has already caused two documented production defects in this file — `src/styles.css` header lines 27–41 and the block comment at 2366–2372 record both, and the fix in each case was to re-alias, leaving these lines behind.

**How.** **Compute the shadowed set, do not take it from a list** — the early block holds 160 declarations (it also carries `color-scheme: dark`, so 109 are unique to it, not 108). A five-line script that parses the four blocks and prints the intersection is the right tool; paste its output into the build log. Do not delete any of the 109 unique properties.

**Acceptance.**
- Every deleted name is provably redeclared in a `[data-obsidian]` block that appears later in the file.
- 109 unique properties remain in the early block.
- Obsidian ground renders identically in `bun run dev`.
- Baseline re-frozen lower.

**Owns.** `src/styles.css`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-30 · Delete the unreachable `--ds-*` and `--text-*` token names from `styles.css`**
`STATUS: TODO` · deps: K-29 · size: M

**What.** Write a throwaway reachability script: strip comments from every `.css`, `.ts` and `.tsx` under `src/`, plus `index.html` and `public/`, capture **both** `var(--x)` and `var(--x, fallback)` forms, seed the live set with every token named outside `styles.css`, then close over token-to-token references until fixed. Delete the declaration lines for everything not in the closure. Run the script, do not trust any pre-written list.

**Why.** These are declarations no renderer can reach, re-declared across the `:root`, `[data-theme="light"]` and `[data-obsidian]` blocks so each dead name costs two or three lines. Verified-clean whole families: **`--ds-teal-*`, `--ds-ember-100..500`, `--ds-amber-300/500/1000`, `--ds-green-300/500/1000`, `--ds-red-300/500/1000`, `--ds-gray-alpha-600..1000`**, and the six dead Obsidian type tokens `--text-hero`, `--text-h1`, `--text-h2`, `--text-emphasis`, `--text-mono-floor`, `--text-mono-micro`. Also dead and easy to miss: `--ds-blue-400/500`, `--ds-shadow-xs/2xs/xl/2xl`, `--text-helper`, `--ds-ember-bg-hover`, `--ds-ember-bg-subtle`. `styles.css` is the largest debt file in the repo at 1224.

**How.** **Four families look dead and are not.** `--ds-pink-*` is live: `styles.css:3783` declares `--pencil-blossom: var(--ds-pink-900)`, consumed by `src/components/obsidian/pencil-mark.tsx:13` and `pencil.tsx:8` and asserted in `__tests__/pencil-mark.test.tsx:4`; `--ds-pink-700` is read at 3554 (`--chart-4`) and 3777 (`--fuchsia`). `--ds-purple-*` is live via `--violet-soft` at 3518. In the motion family, `--ds-motion-overlay-scale/timing` and `--ds-motion-popover-timing` are dead but the adjacent `--ds-motion-overlay-duration` and `--ds-motion-popover-duration` are **live**. And `--ds-page-width` is referenced at 3400 inside `--ds-page-width-with-margin`, so it is dead only transitively and the pair must go together — which is exactly what the closure step is for. Exclude `design-reference/` and `videos/` from the roots: they are docs and captured build output, not code.

**Acceptance.**
- The script is in the build log with its output, so the set is reproducible.
- Zero deleted name appears in any `var()` anywhere in `src/`, `index.html` or `public/`.
- Pencil marks, charts and both motion durations render unchanged in dev.
- Baseline re-frozen lower.

**Owns.** `src/styles.css`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-31 · Delete the 75 dead class families in `styles.css`**
`STATUS: TODO` · deps: K-30 · size: M

**What.** Delete the rule blocks for the 75 of `styles.css`'s 152 declared classes that no component references, and the `@keyframes` they orphan. Whole retired eras: the 12 `.ambient-weather--*` variants plus `.ambient-weather` and `.weather-live`; the Loom atmosphere (`.loom-atmosphere`, `.loom-details`, `.loom-details-chevron`, `.loom-thread-active`); the hero layer (`.hero-aurora`, `.hero-aurora-a/b`, `.hero-editorial`, `.hero-ghost-mark`, `.hero-watermark-spin`, `.animate-aurora`); the Tempo type scale (`.text-heading-32/40/48/56/64/72`, `.text-copy-16/18/20/24`, `.text-copy-13-mono`, `.text-label-14-mono/18/20`, `.text-ink-subtle`, `.text-balance`); the retired button set (`.btn-agentic`, `.btn-approve`, `.btn-lg`, `.btn-link`, `.btn-tertiary`, `.btn-pill`, `.btn-pill-outline`, `.btn-reject`); material and elevation presets (`.material-base`, `.material-fullscreen`, `.shadow-glass`, `.glass-panel`); the cad motion utilities (`.cad-flutter`, `.cad-flutter-l`, `.cad-focus-glow`, `.flow-pulse`, `.stagger-rise`, `.rise-3`, `.float-soft`, `.hover-lift`); and the singles (`.ai-pulse-mark`, `.ai-working-word`, `.receipt-card`, `.neural-gradient`, `.neural-text`, `.construction-pill`, `.cooking-banner`, `.band-stone`, `.station-row`, `.stream-caret`, `.rule-hairline`, `.rule-strong`, `.hairline-strong`, `.surface-3`).

**Why.** 110 rule blocks, roughly 668 lines — **a sixth of the file's length** — for 37 measured occurrences. The debt-per-line is low and the line count is the point: several of these names now survive only inside docblocks explaining that the component already ported off them, and a retired vocabulary sitting in the stylesheet with an explanatory comment is precisely how the next reader re-adopts it.

**How.** **The trap is a class name that collides with a live custom property.** `.hairline-strong` the class is dead — it exists only at `styles.css:606-608` as `border-color: var(--hairline-strong)`. `--hairline-strong` the **token** is live in 20+ non-comment call sites (`MissionGraph`, `CommandPalette`, `Avatar`, `Sketch`, `AuditTag`, `InvitationsPanel`, `VouchersPanel`, `obsidian/aurora`, `obsidian/citation`, `obsidian/spotlight`, `obsidian/graph-slider`, `MissionOrchestratorDetail`) and is declared at lines 251, 382, 2116, 3505 and 3726 — all **outside** the class rule. Delete the rule, keep every declaration. Same care for `.rule-hairline` (1020) and `.rule-strong` (1023). Grep each name with a leading `.` and confirm the hit is in `className`, not in `var()`.

**Acceptance.**
- Each deleted class has zero `className` references under `src/`.
- Every `--hairline-strong` declaration still present; `bunx tsc --noEmit` and dev render unchanged on the surfaces listed above.
- No orphaned `@keyframes` left behind.
- Baseline re-frozen lower.

**Owns.** `src/styles.css`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-32 · Delete the dead codediff, term and split families from `primitives.css`**
`STATUS: TODO` · deps: none · size: M

**What.** Delete `primitives.css` lines **1417–1836** (the whole span; no non-target top-level selector lives inside it, including the bare `.sp-term` at 1558) and **1904–1930** (`.sp-agrid` from 1904, `.sp-acard` and its hover 1909–1919, `.sp-aname`/`.sp-asub` 1920–1930), plus `.sp-filename`. Then repoint the three assertions in `src/__tests__/surface-discipline.test.ts:123-130` — `ruleBody(css, '.sp-codediff-row[data-kind="add"]')`, its `del` twin, and `expect(css).toContain(".sp-codediff-sign")` — at `CodeDiff.tsx`, exactly as the §1 test in that same file was already repointed at `.cd-body`.

**Why.** `CodeDiff.tsx` moved its paint into its own `<style href="mrd-code-diff">` sheet (`.cd-row`, `.cd-sign`, `.cd-body`) and `ChangesPanel.tsx` ported off `.sp-split*`; both recorded it in their docblocks (`CodeDiff.tsx:48-52`, `ChangesPanel.tsx:103` and `:249`). Simulated deletion drops `primitives.css` from **509 to 444** measured occurrences for roughly 447 lines of classes nothing renders. **The guard pinned to the moved string is the repo's own documented failure mode, already recorded once inside this very test file** — leaving it pinned means the next port trips over the same thing.

**How.** `CodeDiff.tsx:310-344` already carries `.cd-row[data-kind="add"]` → `--mrd-pass`, `[data-kind="del"]` → `--mrd-fail` and `.cd-sign`, so the repointed assertions have a real target and must still fail if that mapping is broken. **Do not weaken them into a `toBeDefined`** — the whole value is that they assert add is pass-hued and del is fail-hued. `primitives.css:1934` carries a live explanatory comment inside the `.sp-grid` docblock — "the only grid in the system was `.sp-agrid` / `.sp-acard` below" — which becomes false; correct it. `docs/operations/session-handoff.md:93` still describes these as open; leave it, Claude owns that file.

**Acceptance.**
- Named ranges deleted; no other selector removed.
- `surface-discipline.test.ts` asserts the same two hues and the sign class against `CodeDiff.tsx`, and goes red if either mapping is inverted.
- `bun test` green; baseline re-frozen lower.

**Owns.** `src/styles/primitives.css`, `src/__tests__/surface-discipline.test.ts`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-33 · Delete the unreachable `--sp-*` declarations and the five dead rules in `ink.css` and `shell.css`**
`STATUS: TODO` · deps: none · size: M

**What.** Two sweeps in one commit because they share a file and a re-freeze. (a) `ink.css` holds 180 `--sp-*` declaration **lines** over 159 unique names (21 are second-mode re-declarations). Run a comment-stripped `var()` sweep across every `.css`/`.ts`/`.tsx` under `src/`, plus `index.html` and `public/`, capturing both the bare and fallback forms, and delete every declaration line for a name with zero references — **65 names across 73 lines** when last measured. (b) Delete `.sp-iconbtn` (`shell.css:437-455`, three rules), and in `ink.css` `.ink-hairline-b` (876), `.ink-kicker` (886), `.ink-input-focus` (855-865) **together with its sole consumer token `--ink-input-ring` at 858**, and `.ink-skeleton` across **915–933** — that range covers `@keyframes ink-skeleton` (915-922), the rule (924-928) **and the `@media (prefers-reduced-motion: reduce)` override at 929-933**, which is orphaned if you stop at 930.

**Why.** `ink.css` is the token-definition file the whole retired Cadence/ink layer reads, so shrinking it is what eventually makes the file **deletable** rather than merely tidier: simulated, it goes **302 → 217**, an 85-occurrence drop including 40 of its raw-hex literals. Whole abandoned sub-systems come out — the ring geometry (`--sp-ring`, `--sp-ring-gap`, `--sp-ring-lg/sm`, `--sp-ring-stroke`, `--sp-ring-stroke-sm`), the agent-mark sizing left behind when marks moved to Meridian (`--sp-mark-glyph`, `--sp-mark-lg`, `--sp-text-monogram`, `--sp-text-wordmark`, `--sp-track-monogram`, `--sp-track-wordmark`), the greeting ramp, the score/seen/tint ramps, five z-index tokens, four durations, the rail and grid widths, three unused spacing rungs, and the stage/eviq colours (`--sp-stage-design/plan/ship`, `--sp-eviq-mine/borrowed/inferred`, `--sp-star`, `--sp-ctx-split`, `--sp-pane-settings-w` — which `primitives.tsx:15` already documents as declared-and-unimplemented). `shell.css` is otherwise **100% live**: 121 of its 124 class names render, so after (b) it holds no dead paint at all.

**How.** The baseline records `ink.css` at `{"--sp-": 195}`, not 180, because the ratchet counts every `--sp-` occurrence in code — declarations **plus** `ink.css`'s own internal `var()` references — so the re-frozen number is not "180 minus the deleted lines". Do not compute it; run `bun run design:ratchet`. Two comments go dangling: `--sp-space-9` is discussed in a `today.css` comment and `--sp-score-strong` in a `queue-instruments.test.tsx` comment; note them in the build log, do not chase them here. `shell.css` drops on two markers, because `.sp-iconbtn svg` reads `var(--sp-icon)`.

**Acceptance.**
- Every deleted name has zero `var()` references in the sweep, and the sweep script is in the build log.
- `.ink-skeleton`'s reduced-motion override is gone with it; no orphaned keyframes or tokens remain.
- `bun test` green with both files re-frozen at their new numbers.

**Owns.** `src/styles/ink.css`, `src/styles/shell.css`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-34 · Swap the 262 exactly one-to-one `--sp-*` references to their Meridian tokens**
`STATUS: TODO` · deps: K-32, K-33 · size: M

**What.** `ink.css` declares 23 `--sp-*` tokens whose entire value is `var(--mrd-…)` — `--sp-ink`, `--sp-mute`, `--sp-line`, `--sp-pass`, `--sp-fail`, the `--sp-solid*` set, the five `--sp-radius-*` and the rest. Textually replace each `var(--sp-X)` with `var(--mrd-Y)` at the **262 stylesheet reference sites**: `primitives.css` (211), `today.css` (50), `shell.css` (1). Then delete the eight aliases no component references either — `--sp-font-sans`, `--sp-radius-chip`, `--sp-radius-row`, `--sp-sheet`, `--sp-solid`, `--sp-solid-edge`, `--sp-solid-hover`, `--sp-solid-ink` — from `ink.css`. The other 15 aliases stay until their component call sites port.

**Why.** The single biggest pure-CSS lever in the layer: **270 occurrences retired** (262 references plus 8 alias declarations) across three files, and it moves `primitives.css` and `today.css` toward deletion rather than shuffling debt sideways. Provably a no-op: all 46 relevant declarations sit only at `:root` or a root-level `[data-theme="light"]` (`ink.css` 580 and 799, `meridian.css` 627), none of which redeclares any of the 23 aliases — the light values now come from `meridian.css:628-715` under the same root-level selector. So every reference resolves to the same computed value before and after.

**How.** `ink.css` chains 11 of its own declarations off these aliases — lines 86, 295, 297, 303, 304, 492, 494, 518, 522, 653, 661, e.g. `--sp-score-strong: var(--sp-pass)` and `--sp-font-px: "Geist Pixel Square", var(--sp-font-mono)`. **They are deliberately out of scope**, and none of the eight deletion candidates appears among them, so the deletions stay safe. `.output/public/assets/*` and `videos/supaprod-film/capture/extracted/page.html` carry hundreds of stale `--sp-*` references; they are build output and a capture, are scanned by neither guard, and **must not be edited**.

**Acceptance.**
- Zero `var(--sp-X)` remains in the three stylesheets for any of the 23 aliased names.
- The eight unreferenced aliases are gone; the other 15 still declared.
- Both grounds render identically in `bun run dev` — this is the assertion, since the computed values are unchanged by construction.
- Baseline re-frozen lower on all four files.

**Owns.** `src/styles/primitives.css`, `src/styles/today.css`, `src/styles/shell.css`, `src/styles/ink.css`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-35 · Delete the unused TanStack query harness**
`STATUS: TODO` · deps: none · size: S

**What.** Delete `src/lib/testing/tanstack-query-mocks.ts`.

**Why.** 189 lines, **zero importers**. Grep for `tanstack-query-mocks`, `TanstackMockManager`, `createTanstackMocks`, `createMockUseQuery`, `createMockUseMutation` and `createMockUseServerFn` across `src`, `test`, `e2e` and `scripts` returns only the defining file. The only other references are `docs/operations/testing/archive/coverage-gaps-late-july.md` — the document that commissioned it, now in `archive/` — and the graphify wiki. Its sibling `src/lib/testing/threads-mock.ts` is imported by `src/components/ask/__tests__/AskPane.test.tsx:16`, so the directory is live and this one file is the outlier.

**How.** **Do not try to wire it in instead.** It cannot be adopted as written: `createMockUseMutation` ignores the mutation key and always reads the hardcoded `"default"` slot, and `createMockUseServerFn` keys on `serverFn.name`, which is not a stable identifier for TanStack `createServerFn` wrappers. Two independent panels needed this harness and neither used it, and the pattern that actually works elsewhere — 8 real `mock.module` calls in `src/components/ask/__tests__/AskPane.test.tsx`, 5 in `src/components/mission/composer/__tests__/GlobalComposer.test.tsx` — does not import it. Also do not take `ApprovalsPanel.test.tsx` at its word: its 26 apparent `mock.module` sites are **comment lines**, 25 of them `// TODO: needs the mock.module harness`, and the whole suite of 27 tests contains exactly one `expect`. That file is a separate problem and is not yours here.

**Acceptance.**
- File deleted; `bunx tsc --noEmit`, `bun test` and `bun run build` clean.
- Build log names `AskPane.test.tsx` as the working pattern, so the next agent looking for a harness finds it.

**Owns.** `src/lib/testing/tanstack-query-mocks.ts`

---

**K-36 · Delete two dead exports sitting in live modules**
`STATUS: TODO` · deps: none · size: S

**What.** Delete `rollUpStations` and its `StationState` type from `src/lib/relay.ts` **52–110**, and `describeTurn` from `src/lib/spine/activity.ts` **148–167**.

**Why.** `relay.ts`'s four other exports (`toRelaySteps`, `relayByStation`, `stationActiveRun`, `miniRelay`) are all imported by `src/components/agents/AgentRelay.tsx`; `rollUpStations` is imported by nothing, and `relay.ts` has no test file, so nothing pins it either. `describeTurn` has zero references anywhere in `src`, `test`, `e2e` or `scripts` — the module's two importers (`src/components/spine/TrackActivity.tsx:37`, `src/lib/spine/track.functions.ts:60`) take `countKinds` and `Turn`, and `src/lib/spine/activity.test.ts` imports `buildActivity`, `countKinds` and `liveTurn`. **That is 60 lines of unexercised logic carrying a live status-mapping bug** (`relay.ts:36-38` misreads `complete` and `completed_with_failures`), so keeping it means keeping a defect nobody can hit and everybody can copy.

**How.** Use **148**–167 for `describeTurn`, not 155–167: its JSDoc block sits at 148–154 ("One line per turn, in the product's voice…") and deleting from 155 leaves the comment dangling above `countKinds`. Deleting `relay.ts` 52–110 leaves two consecutive blank lines at 51 and 111; close them. And do not treat grep as the verification — run the gates. **`git status` under-reports in this worktree**: it showed clean while a file was in a deleted state, and only `git diff-index --name-status HEAD` revealed it. Use plumbing for any repo-state claim in the build log.

**Acceptance.**
- Both symbols gone, with their doc comments, and no stray blank-line pairs.
- `bunx tsc --noEmit` exit 0, `bun test` fully green, `bun run build` clean.

**Owns.** `src/lib/relay.ts`, `src/lib/spine/activity.ts`

---

**K-37 · The palette's two unwired mechanisms: one deletion, one decision**
`STATUS: NEEDS A RULING` · deps: none · size: S

> **RECLASSIFIED 2026-08-19 under the Group F rule.** This item was written as a deletion and only half of it is one.
>
> **`palette-recents.ts` is a genuine delete.** `pushRecent` is called nowhere, so the storage key is never written and `getRecents()` has returned an empty array for every user since it shipped. Nothing is lost, because nothing was ever stored. It is BROKEN AS WRITTEN.
>
> **`desk-compose.ts` and the four ACT verbs are NOT.** "Add a task", "Capture a signal", "Share status" and "Start a focus block" are good palette verbs. The consuming half has zero callers and the event literals have no listener, so **the palette currently offers four actions that silently do nothing** — which is worse than not offering them. But the fix could equally be to **wire the listener**, and that ships a real feature instead of removing one.
>
> **Do not decide this alone.** Build the `palette-recents.ts` half, leave the verbs, and put the choice in the build log with what wiring would cost. The founder or Claude rules on it.

**What.** Delete `src/lib/palette-recents.ts` and the `getRecents()` call plus its `RECENT` section in `src/components/supaprod/CommandPalette.tsx`. Delete `src/lib/desk-compose.ts` and the four dead ACT verbs it serves — "Add a task", "Capture a signal", "Share status" and "Start a focus block" — from `src/lib/palette-sections.ts:37-40`, together with the early-return branches that exist only to suppress navigation for them at `CommandPalette.tsx:168` and `GlobalComposer.tsx:142`.

**Why.** Both are half-wired mechanisms that claim an action they cannot perform. `pushRecent` is called nowhere, so `sessionStorage` key `supaprod:recents` is never written and `getRecents().map(recentToRow)` has returned an empty array for every user since the module shipped. `desk-compose.ts` is the mirror image: the consuming half — `consumePendingDeskCompose`, `resetDeskComposeForTest`, `useDeskComposeIntent` — has **zero callers**, and grep for the event literals `supaprod:task-compose`, `supaprod:signal-compose` and `supaprod:status-compose` returns only their declarations at `desk-compose.ts:16-18`. So three verbs dispatch an event with no listener, set a pending flag nothing reads, then navigate to `/today` — **the exact behaviour the module header says it was written to stop.** The fourth is worse: "Start a focus block" fires `supaprod:focus-compose` and `desk-compose.ts:6` asserts `FocusDock` listens globally, but `find src -name "FocusDock*"` returns nothing — the file is gone, and both call sites return early on that event, so the verb is a complete no-op.

**How.** **Do not build the writers instead.** Both candidate writer sites are dead code: `<CommandPalette` is mounted nowhere (`_authenticated.tsx:262` records it as retired-in-tree, and only `GotoShortcuts` is imported from that file), and `GlobalComposerHost` is referenced only inside its own comments (`GlobalComposer.tsx:62-66`: "the overlay is unreachable rather than merely discouraged"). Wiring would convert "index with no writer" into "index with an unreachable writer". The types confirm it independently — `PaletteRun` (`palette-sections.ts:13`) carries no `id`, `label` or `kind`, so a `RecentObject` cannot be constructed at `onRun` without changing the overlay signature. The live path for the verbs is `SuggestionPopover.tsx:99` → `GlobalComposer.onRun`, so that is where their removal must show. **Three raw-text guards read `CommandPalette.tsx` as source** — `AppFrame.station-keys.test.ts:40`, `no-synthetic-key-dispatch.test.ts:75`, `route-inventory.test.ts:155` — keep them green; they are all offline.

**Acceptance.**
- Both lib modules gone; no dangling import anywhere.
- The four verbs no longer appear in the palette or the composer, and no early-return branch survives that exists only for them.
- The three source-text guards pass unweakened; baseline re-frozen if `CommandPalette.tsx`'s recorded count drops.
- `bunx tsc --noEmit`, `bun test`, `bun run build` clean.

**Owns.** `src/lib/palette-recents.ts`, `src/lib/desk-compose.ts`, `src/lib/palette-sections.ts`, `src/components/supaprod/CommandPalette.tsx`, `src/components/mission/composer/GlobalComposer.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

### Group G — The Meridian gaps, then the components blocked behind them

79 component files import `src/components/shell/primitives`. Of the 29 distinct symbols they use, **all but four already have a Meridian equivalent**. K-38 builds those four; everything after it is a mechanical port that was impossible before.

**Two standing notes for this group and the next.**

- **K-09 claims all of `src/components/meridian/` in its `Owns`.** Any item below that edits that folder carries `deps: K-09` so the two never hold the same file open.
- **`AppFrame`'s 50 remaining `.sp-*` class names are NOT in this queue and must not be started.** `src/styles/shell.css:36` states the opposite decision in the sheet's own header — "THE CLASS NAMES STAY `sp-`. Four colocated guards read them out of this file and out of AppFrame.tsx as SOURCE TEXT… Renaming the vocabulary would make three guards about shipped defects pass vacuously, which is a worse outcome than a legacy prefix." The shell already **paints** in Meridian (`shell.css` carries 387 `--mrd-*` references against 26 `--sp-*`). Renaming that layer is a ruling, not a port. K-46 takes the six occurrences that are not the class-name argument and stops there.

---

**K-38 · Build `Pre`, `Grid`, `Cell` and a row `SelectionBar`**
`STATUS: TODO` · deps: K-09 · size: M

**What.** Add to `src/components/meridian`: (1) a `Pre` for plain preformatted monospace output; (2) a `Grid`; (3) a `Cell` carrying shell/primitives' `mark`/`lead`/`sub`/`onClick`/`selected`/`disabled`/`tone` contract, rendering a **real `<button>`** when `onClick` is present; (4) a bulk-row selection bar taking the `Selection` object from `src/components/shell/use-selection.ts` plus a row count, under a name that does **not** collide with the existing `SelectionActions`. Draw them on Meridian Tailwind utilities the way `Region` does (`rounded-mrd-xs`, `text-mrd-mute`, `gap-mrd-4`), never on `.sp-*` classes.

**Why.** I diffed the symbols every consumer imports from `shell/primitives` against every export under `src/components/meridian`. 29 symbols are in use and 25 already map (`Block`→`Region`, `PageHead`→`PageHeading`, `Empty`→`NothingHere`/`NothingYet`, `Failed`→`ReadFailed`, `Loading`→`LoadingState`, `Button`→`Action`/`Approve`, `Record`→`RecordSpeaks`, `Select`→`Picker`, `Switch`→`Toggle`, plus 20 exact-name matches). **The four gaps are `Pre` (9 consumers), `Cell` (5), `Grid` (3) and `SelectionBar` (3)**, and without them `AccountConnectionsSection` (51 occurrences), `RoadmapColumns` (35), `IntegrationsTab` (27) and `TeamCard` (15) cannot be ported at all.

**How.** **`SelectionBar` is the trap.** Meridian already exports `SelectionActions`, but `src/components/meridian/SelectionActions.tsx:213` takes `range: Range | null` and a `containerRef` — it is a floating **prose-editing** toolbar, an unrelated concept wearing a colliding name. `shell/primitives.tsx:1291` is the row-selection bar. Pick a distinct name and say so in the build log. **Read `src/styles/primitives.css` as well as the `.tsx`**: half the source contract lives there — `.sp-pre` at 1392, `.sp-grid` at 1941, `.sp-cell` at 1958 including the hover computed from `--sp-cell-bg` that the `Cell` doc comment says is the entire reason `tone` works, and `.sp-selbar` at 2385. A port from the `.tsx` alone drops those mechanics. Before building `Pre`, **evaluate `src/components/meridian/CodeBlock.tsx`** — it is Meridian's preformatted-code block, built to replace an uncapped `<pre>`; its API is tokenised and streaming (`filename: string`, pre-tokenised `lines: CodeToken[][]`), which is the wrong shape for a raw deploy log, but that judgement belongs in the build log rather than being assumed.

**Escape-to-clear has no existing test and you must write one.** The contract does **not** live in `use-selection.ts` — that module exports only `type Selection` and `useSelection`, and grep for `escape|keydown` in it returns nothing. Escape-to-clear lives inside the `SelectionBar` component body in `shell/primitives.tsx` as a `React.useEffect` window listener gated behind `if (count === 0) return;`. No test in the repo renders that component, so nothing today asserts Escape clears a selection, that `count === 0` returns null, or that "Select all N" only appears when `!allSelected && total > count`. Pin all three.

**Acceptance.**
- Four components exported, each rendered in `src/routes/_authenticated.meridian.tsx` in both grounds.
- `Cell` renders `<button>` when `onClick` is present and a non-interactive element otherwise; `tone` still drives the hover.
- New render tests cover the selection bar's Escape-to-clear, its empty early return, and the select-all gate.
- No `.sp-*` class and no retired token in any new file — new files must be born clean under ratchet rule 1.

**Owns.** `src/components/meridian/surface-parts.tsx`, `src/components/meridian/__tests__/` (new test files for the four), `src/routes/_authenticated.meridian.tsx`

---

**K-39 · The seven settings panels off `shell/primitives`**
`STATUS: TODO` · deps: K-38 · size: M

**What.** Port `IntegrationsTab`, `DataSection`, `DiagnosticsSection`, `NotificationsSection`, `TeamCard`, `ProductsTab` and `MembersCard` to Meridian imports. The union of symbols across all seven is exactly: `Block`→`Region`, `Button`→`Action`/`Approve`, `Empty`→`NothingHere`/`NothingYet`, `Failed`→`ReadFailed`, `Loading`→`LoadingState`, `PageHead`→`PageHeading`, `Select`→`Picker`, `Switch`→`Toggle`, `Field`/`Input`/`Receipt` keeping their names, and `Pre` (K-38) in `IntegrationsTab` and `TeamCard`. Then clear the residual inline `--sp-*` tokens: 8 in `IntegrationsTab`, 4 in `MembersCard`, 3 in `DataSection`, 2 in `DiagnosticsSection`, 1 each in `TeamCard` and `ProductsTab`.

**Why.** `settings/*` is **131 occurrences across 8 files, of which 107 is `import:` plus `usage:shell/primitives`** — the mechanical half of the whole folder. Checking the imported symbol set per file, exactly one symbol in the folder has no Meridian equivalent, and K-38 built it. `NotificationsSection.tsx` is the cleanest single win in the repo at 16 occurrences that are 100% primitives usage with zero token or class debt.

**How.** The folder already has a behavioural harness in `src/lib/settings-search.test.ts`, which pins these panels **by name** and in places reads them as source text for keyword coverage — copy deleted during a port can fail it, so keep user-visible strings intact. The baseline tracks `import:shell/primitives` and `usage:shell/primitives` per file **in addition to** `--sp-`; drive all three to zero per file and re-freeze, rather than leaving the old counts standing.

**Acceptance.**
- Zero `shell/primitives` imports across the seven files.
- `settings-search.test.ts` green without modification.
- Each of the seven renders unchanged in `bun run dev` under `/settings`.
- Baseline re-frozen lower on all seven.

**Owns.** `src/components/settings/IntegrationsTab.tsx`, `src/components/settings/DataSection.tsx`, `src/components/settings/DiagnosticsSection.tsx`, `src/components/settings/NotificationsSection.tsx`, `src/components/settings/TeamCard.tsx`, `src/components/settings/ProductsTab.tsx`, `src/components/settings/MembersCard.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-40 · `WorkspaceClaimCard` and `CreditCapsCard`**
`STATUS: TODO` · deps: none · size: M

**What.** Swap both files' `shell/primitives` imports for Meridian. `WorkspaceClaimCard` uses `Block`, `Button`, `Checkbox`, `Empty`, `Failed`, `Loading`, `Value`; `CreditCapsCard` uses `Block`, `Button`, `Empty`, `Failed`, `Field`, `Input`, `Select` and carries 5 inline `--sp-*` refs. Additionally replace the raw `<select className="sp-select">` at `WorkspaceClaimCard.tsx:303-319` with `Picker` and give it an id of its own.

**Why.** These are the two densest pure-swap files in the tree by usage — `WorkspaceClaimCard` is 30 of its 32 occurrences in `usage:shell/primitives`, `CreditCapsCard` 25 of 31 — and neither needs `Pre`, `Grid`, `Cell` or the selection bar, so unlike `AccountConnectionsSection` they are blocked on nothing. Both are pinned by name in `src/lib/settings-search.test.ts` and mounted from `src/routes/_authenticated.settings.tsx`.

**How.** **Do not assume tsc will catch a mismapping; for most of this port it cannot.** Meridian's `Picker` is `React.SelectHTMLAttributes<HTMLSelectElement>` and `Input` is `React.InputHTMLAttributes<HTMLInputElement>`, structurally identical to the shell versions — `Select`→`Picker` and `Input`→`Input` produce **zero** typecheck signal. The compiler helps in exactly three places, and each needs a decision rather than a rename: `Button variant="ghost"` (6 sites across the two files; `ActionVariant` is `"default" | "primary" | "quiet"` with no ghost), `Value tone="live"` (2) and `tone="warn"` (1) against Meridian's `"quiet" | "pass" | "fail" | "hold" | "agent"` — likely `live`→`agent` and `warn`→`hold`, stated in the build log — and `Field`, where Meridian requires `htmlFor: string` that shell left optional, so real ids must be minted.

**Acceptance.**
- Zero `shell/primitives` imports and zero `sp-select` in either file.
- Every `Field` has a real `htmlFor` bound to a real control id.
- The three tone/variant remaps are named in the build log with the reasoning.
- `settings-search.test.ts` green; baseline re-frozen lower.

**Owns.** `src/components/billing/WorkspaceClaimCard.tsx`, `src/components/billing/CreditCapsCard.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-41 · `AccountConnectionsSection`, the largest primitives consumer in the tree**
`STATUS: TODO` · deps: K-38 · size: M

**What.** Port the settings connections panel: 38 rendered primitives across `Block`, `Button`, `Cell`, `Empty`, `Failed`, `Grid`, `Input`, `Loading`, `PageHead`, `Select`, plus 4 inline `--sp-*` refs and 8 `.sp-*` classes.

**Why.** 51 occurrences, sixth-heaviest file in the tree, and **38 of them are `usage:shell/primitives` — the most rendered retired UI in any single file.** It is also the concrete reason `Grid` and `Cell` were worth building rather than hand-rolling: the connector grid is exactly the shape `Cell` was written for, and `shell/primitives.tsx:251` records why — "tinted, never bordered… nineteen bordered cells in one region is nineteen bordered containers" — and that lanes were writing an eight-property inline reset each time before it existed. Losing that reasoning to a per-file reimplementation is how the cap gets broken again.

**How.** **Two tests read this file as source text and will fail on an innocent refactor.** `src/lib/connectors/providers/gateway-era-adapters.test.ts:111` `readFileSync`s it and asserts four literals: `const primary = conns[0]` (line 1052) and `mVerify.mutate(primary.id)` (line 1154) must remain **present**, `mVerify.mutate(suite` and `mVerify.mutate(account.id)` must remain **absent**. Renaming the `primary` local or restructuring the Verify call fails it. `src/lib/settings-search.test.ts:179` likewise reads it for keyword coverage. The connector list comes from `buildConnectorCatalog()` in `src/lib/connectors/catalog.ts` (call site at line 497), which reads the registry — `src/lib/connectors/catalog.test.ts` is what proves the tile set is static, so the panel can be reasoned about entirely offline. Its sole consumer is `src/routes/_authenticated.settings.tsx:218-220`; touch it only if the props change, and if they do, this item is blocked on K-58.

**Acceptance.**
- Zero `shell/primitives` imports; the grid renders through K-38's `Grid`/`Cell`, not a local reimplementation.
- `gateway-era-adapters.test.ts` and `settings-search.test.ts` green, unmodified.
- Connector tiles render identically in dev, including hover tint.
- Baseline re-frozen lower.

**Owns.** `src/components/connections/AccountConnectionsSection.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-42 · `RoadmapColumns` and `CommitCeremony`**
`STATUS: TODO` · deps: K-38 · size: M

**What.** Port both plan-board files off `shell/primitives`. `RoadmapColumns` uses `Button`, `Choices`, `Empty`, `Failed`, `Receipt` and the selection bar, plus 22 inline `--sp-*` refs; `CommitCeremony` uses six primitive call sites across three components (`Button` ×2, `Field` ×2, `Input` ×2) plus 22 `--sp-*` refs.

**Why.** 64 occurrences together, and the `plan` folder is 106 of which `BetCard` (K-44) is the other 42. The selection-bar dependency is worth naming precisely **because it looks satisfied and is not**: five files reference `SelectionBar` — `DiscoverSurface`, `DecisionQueue`, `RoadmapColumns`, and the `decide` and `today` routes — and an agent scanning Meridian's exports finds `SelectionActions` and assumes it is the target. It is not: `src/components/meridian/SelectionActions.tsx:213` takes a DOM `Range` and a container ref for highlighting prose.

**How.** `CommitCeremony`'s raw `--sp-*` grep returns 25; three of those are docblock prose the scanner correctly excludes, so the code count is 22 — port the 22 and leave the prose. `DecisionQueue.tsx` and `DiscoverSurface.tsx` are in `Owns` only because they are the other consumers of the same bar; **change them only if K-38's chosen name forces an import edit**, and say so in the build log if you touch them at all.

**Acceptance.**
- Both plan-board files free of `shell/primitives`.
- The bulk-selection behaviour is unchanged, proved by K-38's new render tests rather than by inspection.
- `bunx tsc --noEmit`, `bun test`, `bun run build` clean; baseline re-frozen lower.

**Owns.** `src/components/plan/RoadmapColumns.tsx`, `src/components/plan/CommitCeremony.tsx`, `src/components/today/DecisionQueue.tsx`, `src/components/discover/DiscoverSurface.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-43 · `AuditLineageSheet`: 45 class names, all defined in one stylesheet**
`STATUS: TODO` · deps: K-34 · size: M

**What.** Port the lineage pane's 29 distinct `.sp-*` class names (`sp-lineage-*`, `sp-chain-*`, `sp-trail-*`) onto Meridian utilities, deleting the matching rule blocks from `src/styles/shell.css` as each one goes.

**Why.** Fourth-heaviest component file at 45 and the cleanest single-file class port in the tree: every one of its class names resolves into `src/styles/shell.css`, a sheet already 387 `--mrd-*` references deep with only 38 occurrences of debt overall. **The paint under this component is already Meridian; only the naming layer is retired.** The file's own header records that it was ported once before off Loom v4 and shadcn Sheet, so the design intent ("the pane, not a modal sheet", "no ember") is written down and does not need re-deciding.

**How.** **One class must survive the port.** `src/components/ask/AskPane.tsx:359` carries the literal selector `".sp-lineage"` in its `KEEPS_IT_OPEN` pointerdown list. If the pane root loses that class, **any press inside the lineage pane dismisses Ask** — and no test catches it, because `AskPane.test.tsx:1013` builds its own synthetic `<div class="sp-lineage">` fixture and stays green regardless of what the real component renders. Keep the class on the root, or edit both sides in this commit and say which you did. Second trap: `escape-layers.test.tsx:64` does `strip(read(...AuditLineageSheet.tsx))` — it asserts on the component's **source text**, so it constrains how the Escape binding is written, not only what it does. Third: the CSS half is not token-free — the lineage rule blocks reference `--sp-header-h`, `--sp-pane-ask-w` and `--sp-pane-inset` (6 occurrences), so `shell.css`'s recorded debt drops and must be re-frozen with the port. Its colocated test is `src/components/supaprod/__tests__/lineage-chain.test.ts`.

**Acceptance.**
- 29 class names gone from the component; their rule blocks gone from `shell.css`.
- Ask stays open on a pointerdown inside the lineage pane, verified in `bun run dev`.
- `lineage-chain.test.ts`, `AskPane.test.tsx` and `escape-layers.test.tsx` green.
- Baseline re-frozen lower on both files.

**Owns.** `src/components/supaprod/AuditLineageSheet.tsx`, `src/styles/shell.css`, `src/components/supaprod/__tests__/lineage-chain.test.ts`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-44 · `BetCard`: 42 occurrences and no data hooks**
`STATUS: TODO` · deps: none · size: M

**What.** Replace the 33 inline `--sp-*` references in `src/components/plan/BetCard.tsx` with Meridian tokens, swap the 5 `shell/primitives` markers (1 import, 4 usages) for `forms.Checkbox`/`forms.Input`, and re-home the 4 `.sp-*` classes.

**Why.** 42 occurrences, **zero data hooks** (grep for `useQuery|useMutation|useServerFn|supabase` returns 0), 400 lines — the best ratio of debt to risk among the non-trivial component files. Its header already documents the design rulings the port must preserve (the promise leads, ember is a 2px rule not a chip, no mono caps, the Checkbox is a real one), so the visual intent is fixed and only the vocabulary moves.

**How.** **Seven colour tokens alias straight through and the size tokens do not.** Clean: `ink.css:311` `--sp-lift`→`--mrd-lift`, `:312` `--sp-sink`→`--mrd-sink`, `:338` `--sp-ink`→`--mrd-ink`, `:339` `--sp-body`→`--mrd-body`, `:340` `--sp-mute`→`--mrd-mute`, `:343` `--sp-line`→`--mrd-line`, `:268` `--sp-gate`→`--mrd-you`. **Not clean, and this is where a mechanical swap breaks the layout:** Meridian's spacing scale is `--mrd-s1..s8` = 2/4/6/10/16/24/40/64px, so `--sp-space-1..4` (4/8/12/16px) does **not** map positionally — that swap shrinks every gap — and 8px and 12px have no exact stop anywhere in the scale. Type needs care too: `--sp-text-meta` 13px → `--mrd-t-base`, `--sp-text-data` 12px → `--mrd-t-small` (**not** `--mrd-t-data`, which is 11.5px), `--sp-text-data-sm` 11.5px → `--mrd-t-data`; `--mrd-t-meta` and `--mrd-t-data-sm` **do not exist**. `--sp-radius-card` is 10px against `--mrd-r-card` 12px. Only `--sp-weight-strong` 600 → `--mrd-w-semi` is exact. Five more occurrences are unmapped by any rule: `--sp-line-soft` ×2 (a **raw rgba** at `ink.css:366` with a second light-ground declaration at 603, so it needs a genuine Meridian decision, not a find-and-replace), `--sp-eviq-rule`, `--sp-leading-row`, `--sp-font-mono`. **Where no `--mrd-*` fits, build it in `meridian.css` with its argument in the file. Never widen the baseline.** Note also that `.sp-check` and `.sp-block-more` live in `src/styles/primitives.css` (2115 and 139), not `ink.css`; `src/components/meridian/forms.tsx` exports `Checkbox` and `Input` and is the real target.

**Acceptance.**
- Every one of the 33 refs is either mapped to an existing `--mrd-*` or to a token newly built in `meridian.css` with its reasoning.
- Spacing and radius changes are deliberate and listed in the build log with before/after px, not silent.
- Card renders side by side with `main` in dev at the same width.
- Baseline re-frozen lower.

**Owns.** `src/components/plan/BetCard.tsx`, `src/styles/meridian.css`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-45 · `PlanPicker`**
`STATUS: TODO` · deps: K-09 · size: S

**What.** Swap the 27 inline `--sp-*` refs for Meridian tokens and move the five class names onto Meridian components: `sp-tabs`/`sp-tab` → `src/components/meridian/Tabs.tsx`, `sp-field-label` → Meridian `Field`, `sp-block-more` → `Region`'s `goTo`/`toggle` control face, and `sp-hint` → a Meridian equivalent.

**Why.** 15th on the debt table at 32, mounted from two routes (`_authenticated.settings.tsx` and `_authenticated.admin.pricing.tsx`), pinned by `src/lib/entitlements.test.ts`, and its header at line 5 records the narrow true claim that makes it safe to work on offline: **"Driven by entitlements + billing-tier; no DB catalog dependency"** — plan definitions are not fetched from a table. The header also records the four things removed on the last port and why, so the port has a stated design floor.

**How.** `sp-hint` resolves in **none** of `styles.css`, `ink.css`, `primitives.css` or `shell.css` — it is painting nothing today, so removing it is free and adding a Meridian equivalent is a new decision, not a port; the honest move is to delete it and say so. The other three (`sp-block-more` 139, `sp-field-label` 921, `sp-tabs` 1849 in `primitives.css`) **do** paint, so removing them changes rendering — compare in dev. Verify this file by **static source scan, not by rendering it**: `PlanPicker` imports `StripeEmbeddedCheckout`, which imports `createCheckoutSession`/`createTopUpCheckout` from `@/lib/payments.functions`, which pulls in `requireSupabaseAuth` and `supabaseAdmin`. Nothing in this port touches that import and no test mounts the component, but do not add one that does.

**Acceptance.**
- Zero `--sp-*` and zero `.sp-*` in the file.
- Tabs answer ArrowLeft/ArrowRight/Home/End through `meridian/Tabs`, which already implements roving focus.
- `entitlements.test.ts` green; no new test mounts the component.
- Baseline re-frozen lower.

**Owns.** `src/components/billing/PlanPicker.tsx`, `src/components/meridian/Tabs.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-46 · `AppFrame`: the six occurrences that are not the class-name argument**
`STATUS: TODO` · deps: none · size: S

**What.** Swap the four `--sp-*` refs in the `KEYCAP` object at `src/components/shell/AppFrame.tsx:567` — `--sp-font-mono`→`--mrd-mono`, `--sp-text-kbd`→`--mrd-t-micro`, `--sp-weight-regular`→`--mrd-w-regular`, `--sp-radius-xs`→`--mrd-r-xs`. Then kill the two scanner artefacts: line 1620 renders the command glyph as the HTML entity `&#8984;`, whose `#8984` is what the raw-colour regex counts, so emit the literal glyph; line 1818 carries `key="sp-tier-rule"`, a React key matched by the `class:sp-` pattern — rename it.

**Why.** The shell is the most-seen surface and `AppFrame` carries 63 occurrences, third-highest in the tree. Running the real scanner over it gives `{"--sp-":4,"class:sp-":58,"raw-colour":1}` — so **six of the 63 come off in one small, provably safe edit before anyone has to argue about the other 57**, which are the contested class-name layer this queue does not touch.

**How.** Three of the four are exact: `--sp-font-mono` (`ink.css:85`) and `--sp-radius-xs` (`ink.css:222`) are literal `var()` aliases of the Meridian tokens, and `--sp-weight-regular` and `--mrd-w-regular` are both 400. **`--sp-text-kbd` is not an exact equivalence and must not be described as one**: `ink.css:105` is 11px, `meridian.css:534` `--mrd-t-micro` is 10.5px, and the exact-value match is `--mrd-t-tiny` at 11px. `--mrd-t-micro` is still the defensible choice on meaning — its own comment reads "keycaps, the quietest meta" — but it changes rendered keycap text from 11px to 10.5px. Make the call, state it as a deliberate semantic port in the build log, and screenshot the keycaps.

**Acceptance.**
- `AppFrame`'s baseline entry goes from `{"--sp-": 4, "class:sp-": 58, "raw-colour": 1}` to `{"class:sp-": 57}` via `bun run design:ratchet`.
- The command glyph renders identically; the renamed React key does not change list identity or remount rows.
- No `.sp-*` class name renamed anywhere in the diff.

**Owns.** `src/components/shell/AppFrame.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

### Group H — Route ports

1005 of the repo's occurrences sit in route files. These items take the densest of them. Every one carries the same closing step — `bun run design:ratchet`, baseline committed with the port — and the same hazard: **a `Button`→`Action` swap is never a pure rename**, because shell's `variant` union is `"default" | "primary" | "ghost"` and `ActionVariant` (`surface-parts.tsx:360`) is `"default" | "primary" | "quiet"`. Every `ghost` becomes `quiet`. Likewise `Value`'s tone union differs: shell has `quiet|pass|warn|fail|live`, Meridian has `quiet|pass|fail|hold|agent`, so every `warn` needs a semantic decision (usually `hold`) and every `live` one too (usually `agent`).

---

**K-47 · The two public money pages: `/pricing` and `/checkout`**
`STATUS: TODO` · deps: none · size: M

**What.** Replace every ink-era colour in `src/routes/pricing.tsx` and `src/routes/checkout.tsx` with `--mrd-*`: `var(--ink-subtle,#6b6457)`→`var(--mrd-mute)`, `var(--ink,#1f1b16)`→`var(--mrd-ink)`, `var(--paper,#f6f2ea)`→`var(--mrd-bg)`, `var(--hairline,rgba(0,0,0,0.09))`→`var(--mrd-line)`, `var(--canvas)`→ its Meridian ground, `var(--moss-success,#4f8a59)`→`var(--mrd-pass)`. Replace **all 13** `--ember` occurrences in `pricing.tsx` — lines 100, 101, 102 (the chip near the top), 367 and 370 (the recommended card's border and background tint), 392, 393, 394 (the tier-icon chip), 404 and 405 (the "Popular" badge, whose text is at 410), 627 and 629 (the primary CTA), and 732 — with `--mrd-solid` / `--mrd-you`. **Then delete the `inkTheme` object at `pricing.tsx:724-733` and its spread into the page root at line 745.**

**Why.** 120 of the repo's 1005 route-file occurrences sit in these two files (`pricing.tsx` 83, `checkout.tsx` 37) and neither carries a single retired *component*, so this is pure colour work on the two pages a stranger sees before they pay. **The hex fallbacks are provably dead**: `src/styles.css:161` is a bare `:root` block defining `--paper`, `--ink`, `--ink-subtle` and `--hairline`, so `var(--paper, #f6f2ea)` can never reach its fallback — the parchment values have not painted anything since that block landed. And the ember usage contradicts a standing ruling: **ember stays in the logo and must not share a token with an interaction state.**

**How.** The `inkTheme` object is the largest single cluster of raw hex in the file and the item is worthless without it: it declares `--paper:#0a0a0a`, `--canvas`, `--soft-stone`, `--ink`, `--ink-subtle`, `--ink-muted`, `--hairline`, `--ember:#FF6B2C` and `--moss-success` as literal hex. Note that its `--ember` is `#FF6B2C` while every consumer fallback in the same file is `#c2622e` or `#c2602e` — **the shim and its fallbacks already disagree**, which is the clearest possible evidence nobody can predict what these pages paint. Once the consumers read `--mrd-*`, the object is dead code; leaving it means the raw-colour count barely moves. `checkout.tsx` has **zero** `--ember` and **zero** `--moss-success` — it carries only `--ink-subtle` (9), `--ink` (5), `--paper` (4), `--hairline` (7). Keep the five SimpleIcons connector brand hexes at `pricing.tsx` lines 24, 31, 38, 45, 52 exactly as they are, and **name the gap in the build log**: Meridian has no escape hatch for a third-party brand mark, and the scanner's only exemption covers `--brand-mark-*` declarations in `styles.css`.

**Acceptance.**
- Zero `--ember`, `--paper`, `--ink*`, `--hairline`, `--canvas`, `--moss-success` in either file; `inkTheme` gone.
- The five connector hexes remain, and the build log states the exemption gap.
- Both pages screenshotted before and after in `bun run dev`, in both grounds.
- Baseline re-frozen substantially lower on both.

**Owns.** `src/routes/pricing.tsx`, `src/routes/checkout.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-48 · The public shared-decision page**
`STATUS: TODO` · deps: none · size: S

**What.** In `src/routes/d.$slug.tsx` replace the ink-era palette with `--mrd-*`: `var(--paper,#f6f2ea)`→`var(--mrd-bg)` (61), `var(--ink,#1f1b16)`→`var(--mrd-ink)` (62), the three `var(--hairline,…)` borders (74, 107, 216)→`var(--mrd-line)`, `--ink-subtle` (113, 214, 244), `--ink-faint` (96, 148, 160, 225), `--ink-muted` (137, 233), and all **three** `var(--emerald,#2f8f6b)` sites — 49 in `STATUS`, plus 215 and 216 where it sets the "Still stands" chip and appears inside a `color-mix()` in a template-literal border. Map the `STATUS` table at 49–51 onto the status ladder: emerald→`--mrd-pass`, `var(--rose,#b4493f)`→`--mrd-fail`, pending's `--ink-faint`→`--mrd-hold`.

**Why.** 22 occurrences in 261 lines — **the densest debt-per-line of any route**. It is also the clearest case of a page speaking two palettes at once: every fallback hex is parchment, while line 64 spreads `PUBLIC_INK_THEME`, which overrides `--paper` to `#0a0a0a`. The fallbacks are unreachable anyway (`src/styles.css:161`). And the `STATUS` map is the substantive part: **approved/rejected/pending is exactly the pass/fail/hold ladder Meridian already defines**, so it stops being three ad-hoc hexes on the one page an outsider is shown as evidence.

**How.** **Do not collapse `--ink-subtle` and `--ink-muted` onto `--mrd-mute`.** The ink theme separates them deliberately (#a1a1aa vs #8f959e, re-pitched 2026-08-07 for WCAG AA) and Meridian has `--mrd-faint` available to preserve the ramp. On the `PUBLIC_INK_THEME` spread at line 64: **unspreading it is not covered by any gate here and needs a dev-server eyeball.** `inkTheme.ts` publishes sixteen custom properties onto the root, which cascade to `LandingBackdrop`, `SupaprodMark`, `PreSignupCTA` and the global `.bento`, `.btn btn-ghost btn-sm`, `.mono-label`, `.font-display` classes; eleven of those are never named in this route file, so "the page reads Meridian tokens directly" does not make the spread redundant. Removing it removes no literal, lowers no count, and tsc will not notice. **Four other surfaces share the constant** — `LegalPageShell.tsx:59`, `film.tsx:69`, `demo.tsx:417`, `proof.tsx:64`, `t.$slug.tsx:89` — so it must not be deleted, only unspread here, and only if the page still looks right.

**Acceptance.**
- Zero raw hex and zero ink-era token in the file.
- Approved/rejected/pending read as pass/fail/hold and survive a greyscale check.
- The page screenshotted before and after with the spread removed; if it regresses, the spread stays and the build log says so.
- Baseline re-frozen lower.

**Owns.** `src/routes/d.$slug.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-49 · Observability: status words become `Value` tones**
`STATUS: TODO` · deps: none · size: M

**What.** In `src/routes/_authenticated.admin.observability.tsx` replace the `shell/primitives` import at line 116: `Value`→`surface-parts.Value` (10), `Block`→`Region` (9), `Empty`→`NothingHere` (5), `Failed`→`ReadFailedLine` (3), `Loading`→`Reading` (3), `Switch`→`Toggle` (1). Convert the six inline status spans at lines 295, 338, 364, 529, 561, 613 — two of which are ternaries carrying both classes — into `<Value tone="hold">` and `<Value tone="fail">`. Swap the two `var(--sp-font-mono)` (528, 560) for `var(--mrd-mono)` and `var(--text-subtle)` at 784 for `var(--mrd-mute)`.

**Why.** 43 occurrences, third-highest route file, and the cleanest demonstration of the hole the ratchet's own header describes: **this file carries only 3 token occurrences but 8 retired CSS class strings, all of them status words.** `sp-fail` and `sp-warn` are painted by `src/styles/primitives.css:275-279` off `--sp-fail`/`--sp-warn`, a retired layer whose end state is deletion. Meridian answers them exactly — `surface-parts.Value:1007` takes `quiet|pass|fail|hold|agent`, and **`hold` is precisely the amber "stopped, and not on you" meaning `sp-warn` was standing in for.**

**How.** One call site is a judgement, not a rename: the `<Block>` at line 263 passes `more`/`onMore` (269–277). `Region` has no `more`/`onMore` — its header controls are `goTo`/`onGoTo` (navigates), `toggle`/`onToggle`/`toggled` (discloses, emits `aria-expanded`) and `act`/`onAct`/`acting` (dispatches work). That site is a "Show all N" / "Only what is wrong" **disclosure**, so it becomes `toggle`/`onToggle`/`toggled` and now owes an `aria-expanded` state it never had. tsc catches it if you miss it.

**Acceptance.**
- Zero `shell/primitives` and zero `sp-warn`/`sp-fail` in the file.
- The disclosure control emits `aria-expanded` and answers Enter and Space.
- Every converted span survives greyscale — hold and fail must not be distinguishable by hue alone.
- Baseline re-frozen with all five markers at zero.

**Owns.** `src/routes/_authenticated.admin.observability.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-50 · Threads: retire the hand-rolled context column**
`STATUS: TODO` · deps: none · size: M

**What.** In `src/routes/_authenticated.threads.tsx` replace the `shell/primitives` import at line 143: `Button`→`Action` (6), `Empty`→`NothingHere` (4), `Failed`→`ReadFailedLine` (4), `Block`→`Region` (2), `Input`→`forms.Input` (2), `Loading`→`Reading` (2), `PageHead`→`PageHeading` (1), `Switch`→`Toggle` (1), plus `Surface` and `Receipt` as import-line swaps. Replace the seven hand-written `sp-ctx-*` divs at 478–520 with `CtxHead`/`CtxRow`/`CtxBody` from `@/components/meridian/ContextColumn`. Map the ten `--sp-*` tokens, including **`--sp-body` at line 260**, which no prefix rule reaches.

**Why.** 42 occurrences, fourth-highest. The interesting half is the 7 `sp-ctx` class strings: **this file reimplements the context column as raw divs** (`sp-ctx-head`, `sp-ctx-row`, `sp-ctx-name`, `sp-ctx-sub`, `sp-ctx-body`) rather than composing it, so the debt survives any component-level port — exactly the failure mode the ratchet's fourth-hole note records. `ContextColumn` already exports all three and is in use by 7 other routes, so the template is in-repo.

**How.** There is **no "frozen count of 42"**: `meridian-ratchet.baseline.json:1014` is four independently ratcheted markers — `--sp-`: 10, `class:sp-`: 7, `import:shell/primitives`: 1, `usage:shell/primitives`: 24 — compared separately. A completed port takes all four to zero, which means `bun test` goes **red** with "GOOD NEWS, AND THE BASELINE IS NOW STALE" until you re-freeze. The route does not call `getConversation`; it imports `listThreads`, `getThread` and `searchConversations` from `@/lib/threads.functions` and binds them at 283–285 as `fetchThreads`, `fetchThread`, `runSearch`, so line 328 is `runSearch`. And `src/lib/ask-open.test.ts:58` reads this route as source text and requires the literals `"openAskConversation"` and `"Continue in Ask"` to survive the `Button`→`Action` swap.

**Acceptance.**
- All four baseline markers at zero and re-frozen.
- The context column composes `CtxHead`/`CtxRow`/`CtxBody`; no `sp-ctx-*` string remains.
- `--sp-body` mapped, not skipped.
- `ask-open.test.ts` green.

**Owns.** `src/routes/_authenticated.threads.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-51 · Trace detail: one query, four context blocks**
`STATUS: TODO` · deps: none · size: M

**What.** In `src/routes/_authenticated.traces.$traceId.tsx` replace line 133's import: `Button`→`Action` (4), `PageHead`→`PageHeading` (4), `Surface`→`meridian/Surface` (4), `Block`→`Region` (3), `CtxHead` (3), `CtxBody` (2), `CtxRow` (2) → `meridian/ContextColumn`, `Empty`→`NothingHere` (2), `Failed`→`ReadFailedLine` (2), `Loading`→`Reading` (1).

**Why.** 28 occurrences with the simplest data shape of any route candidate: a **single** `useQuery(getTrace)` at line 466 and no mutations at all, so there is no write path to reason about. Its 7 context-column usages make it the natural pair to K-50, and `ContextColumn` is already in use by 7 routes so the target API is established rather than newly adopted. The file already imports `meridian/rows` and `meridian/marks` (120–121, 134), so half the vocabulary is present.

**How.** Three of the four `Button` uses pass `variant="ghost"` (597, 614, 697) and must become `quiet`. `meridian/Surface` is a verbatim move of `primitives.Surface` — same markup, same class names, same props — so those four carry zero visual risk. This route still imports `CtxRow` from `shell/primitives`, so if K-70 has landed, the Meridian `CtxRow` it now uses renders a real `<button>` when given `onClick`; this route passes none, so nothing changes here.

**Acceptance.**
- Zero `shell/primitives` in the file; all four baseline markers at zero and re-frozen.
- Every `ghost` is `quiet`; no `variant` string survives that `ActionVariant` does not name.
- The trace detail page renders identically in dev against the same trace.

**Owns.** `src/routes/_authenticated.traces.$traceId.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-52 · The two admin roster panes, ported together**
`STATUS: TODO` · deps: none · size: M

**What.** Port `src/routes/_authenticated.admin.people.tsx` and `src/routes/_authenticated.admin.workspaces.tsx` in one pass — they import the identical primitive set at lines 117 and 114. `Button`→`Action`, `Block`→`Region`, `Field`→`forms.Field`, `Input`→`forms.Input`, `Value`→`surface-parts.Value`, `Empty`→`NothingHere`, `Failed`→`ReadFailedLine`, `Loading`→`Reading`, `Select`→`Picker`, `Receipt`→`meridian/Receipt`. Replace the hand-rolled tablist at `people.tsx:147-160` (`sp-tabs` plus two `sp-tab` buttons with `role="tablist"`) with `meridian/Tabs`, and the two `sp-fail` spans — `people.tsx:258` and `workspaces.tsx:280` — with `<Value tone="fail">`.

**Why.** 68 occurrences combined (41 + 27) across two files that are structurally the same surface — a debounced search list beside a detail pane — with the same ten-symbol import line, so porting them apart means solving the same mapping twice. **`people.tsx:147` is the concrete upgrade**: it hand-writes `role="tablist"` with two `sp-tab` buttons and no keyboard handling, while `meridian/Tabs.tsx:88-108` implements roving focus for ArrowLeft/ArrowRight/Home/End and is already used by 4 routes.

**How.** Both files already import from `meridian` (`rows` for `Row`/`Line`, `surface-parts` for `Num`/`Actions`), so this **finishes a partial port rather than starting one** and `surface-parts` is an existing import line. Neither file uses a `tone=` prop anywhere today, so the divergent tone unions cause no collision — `fail` exists in both. `meridian/Receipt.tsx:64-81` has a parameter list identical to `primitives.tsx:452-469`, so that swap cannot regress.

**Acceptance.**
- Both files free of `shell/primitives`; `class:sp-` at zero on both (4 and 1 today).
- The tablist answers ArrowLeft/ArrowRight/Home/End and moves focus, not just selection.
- Baseline re-frozen with both entries lower (usage counts 36 and 25 → 0).

**Owns.** `src/routes/_authenticated.admin.people.tsx`, `src/routes/_authenticated.admin.workspaces.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-53 · Admin pricing and the admin overview, ported as one**
`STATUS: TODO` · deps: none · size: M

**What.** Port `src/routes/_authenticated.admin.pricing.tsx` (import at 127) and `src/routes/_authenticated.admin.index.tsx` (import at 78) together. pricing: `Button`→`Action` (7), `Field`→`forms.Field` (5), `Input`→`forms.Input` (5), `Block`→`Region` (4), `Failed`→`ReadFailedLine` (3), `Checkbox`→`forms.Checkbox` (2), `Empty`→`NothingHere` (2), `Loading`→`Reading` (1), `Receipt`→`meridian/Receipt` (1). index: `Button`→`Action` (4), `Block`→`Region` (2), `Failed`→`ReadFailedLine` (2), `Loading`→`Reading` (2), `Empty`→`NothingHere` (1), `Field`→`forms.Field` (1), `Gate`→`meridian/Gate` (1), `Input`→`forms.Input` (1). Convert the six inline status spans (index 230, 235, 276, 339; pricing 379, 644) to `<Value tone>` and rewrite `checkClass` at `admin.index.tsx:98-99` — which literally returns the strings `"sp-fail"`/`"sp-warn"` — into a tone-returning helper.

**Why.** 54 occurrences combined. **`checkClass` is worth calling out on its own: a helper that hands back the retired class name as a string means the retired vocabulary is being *computed* rather than written, and every call site inherits it.** Both files are the same admin form-and-status shape and both use only the plain `<Loading>` form. `meridian/Gate.tsx:52-67` has a parameter list identical to `primitives.tsx:360-371`, so that swap is an import-line edit.

**How.** Two mappings need a decision. `admin.index.tsx:355` uses `<Button variant="ghost">` ("Retry the checks") → `quiet`. And **the Meridian tone union has no `warn`**: `GoLiveCheck["status"]` includes `warn` and `checkClass` maps it to `sp-warn`, so the new helper must map `warn`→`hold`. Note there are two exported `Value`s — `shell/primitives.tsx:942` *does* have a `warn` tone, and importing that one would defeat the whole port. Take the helper's return type to the Meridian tone union so the compiler enforces it.

**Acceptance.**
- `checkClass` returns a `Value` tone, not a class string, and its type is Meridian's union.
- Zero `sp-*` class occurrences across the two files (8 today).
- No `variant="ghost"` survives.
- Baseline re-frozen lower on both.

**Owns.** `src/routes/_authenticated.admin.pricing.tsx`, `src/routes/_authenticated.admin.index.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-54 · Admin platform: the proof that `meridian/forms` is complete**
`STATUS: TODO` · deps: K-38 · size: M

**What.** In `src/routes/_authenticated.admin.platform.tsx` swap the thirteen-symbol import at line 96: `Button`→`Action` (5), `Input`→`forms.Input` (5), `Failed`→`ReadFailedLine` (4), `Field`→`forms.Field` (4), `Block`→`Region` (3), `Loading`→`Reading` (3), `Empty`→`NothingHere` (2), `Select`→`Picker` (2), `Switch`→`Toggle` (2), `Checkbox`→`forms.Checkbox` (1), `Value`→`surface-parts.Value` (1), `Gate`→`meridian/Gate` (1), `Pre`→K-38's `Pre` (1). Swap the one `var(--sp-font-mono)` for `var(--mrd-mono)`.

**Why.** 36 occurrences, and uniquely broad: **this one file exercises every control in the retired forms layer at once** — `Field`, `Input`, `Select`, `Switch`, `Checkbox` — so porting it is the strongest available check that `@/components/meridian/forms.tsx` and `surface-parts`' `Picker`/`Toggle` actually cover the surface area. If something is missing, it shows here first.

**How.** Two traps. `forms.Field:123` makes `htmlFor` **required** where `primitives.Field:677` made it optional, so all four fields need real ids minted and bound. And line 425 is `<Button variant="ghost">` → `quiet`; a literal tag-name swap fails tsc there. The `<Pre>` is why this waits on K-38 — do not hand-roll a local `<pre>` to unblock yourself, and do not force the log through `CodeBlock`, whose `filename: string` plus pre-tokenised `lines: CodeToken[][]` shape is wrong for a raw deploy log.

**Acceptance.**
- All 13 symbols resolved to Meridian; four `htmlFor` ids minted and each pointing at a control that exists.
- The deploy log renders through K-38's `Pre` with no local `<pre>` in the diff.
- Baseline re-frozen with all markers at zero.

**Owns.** `src/routes/_authenticated.admin.platform.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-55 · Sync: kill the two hand-written `sp-btn` controls**
`STATUS: TODO` · deps: K-38 · size: M

**What.** In `src/routes/_authenticated.sync.tsx` replace line 99's import: `Button`→`Action` (13), `Empty`→`NothingHere` (4), `Block`→`Region` (2), `Failed`→`ReadFailedLine` (2), `Loading`→`Reading` (2), `PageHead`→`PageHeading` (2), `Surface`→`meridian/Surface` (2), `Gate`→`meridian/Gate` (1), `Pre`→K-38's `Pre` (1). Then fix the two controls that skipped the component entirely: **line 278 is an anchor** — `<a className="sp-btn" data-variant="ghost" href={m.external_url} target="_blank" rel="noreferrer">Read both first</a>` — and line 304 is a `<Link className="sp-btn">`. Both need Meridian's `CONTROL_SHAPE` face; the anchor keeps `href`/`target`/`rel` and its `ghost` intent, not an `onClick` it never had.

**Why.** 32 occurrences, and **`Button` alone is 13 of them — the highest single-symbol concentration in any route here**, which makes it the cheapest debt-per-decision port on the list. The two `sp-btn` strings are the interesting part: `.sp-btn` is defined in `src/styles/primitives.css:437`, a fully retired stylesheet, so **those two controls keep the old paint no matter how many components are swapped**.

**How.** Seven sites use `variant="ghost"` (264, 269, 368, 375, 512, 521, plus the anchor's `data-variant`) and all become `quiet` — the "13, identical swap" framing understates the edit. `meridian/Surface` documents that it is a verbatim move of `primitives.Surface`, so those two carry zero visual risk. Note that with `Pre` present from K-38 the shell import can be deleted outright; if K-38 chose a different name for it, say so in the build log rather than leaving `import:shell/primitives` at 1.

**Acceptance.**
- Both `sp-btn` controls render through Meridian's control face, keyboard reachable with the Meridian focus ring, and the anchor still opens in a new tab with `rel="noreferrer"`.
- No `variant="ghost"` survives; `import:shell/primitives` at zero.
- Baseline re-frozen lower.

**Owns.** `src/routes/_authenticated.sync.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-56 · Boundary: the first route adoption of `meridian/MoreMenu`**
`STATUS: TODO` · deps: none · size: L

**What.** `src/routes/_authenticated.boundary.tsx` already imports `meridian/Surface` at line 88; finish it by replacing line 87's `shell/primitives` import. `Block`→`Region` (8), `Empty`→`NothingHere` (4), `Input`→`forms.Input` (3), `MoreItem`→`meridian/MoreMenu.MoreItem` (3), `Value`→`surface-parts.Value` (3), `CtxBody`/`CtxHead`→`meridian/ContextColumn` (2 each), `Loading`→`Reading` (2), `PageHead`→`PageHeading` (2), `Failed`→`ReadFailedLine` (1), `MoreMenu`→`meridian/MoreMenu` (1), `Receipt`→`meridian/Receipt` (1).

**Why.** 33 occurrences and a file that already proves the pattern works — a previous pass moved it onto `meridian/Surface` and stopped, leaving 32 usages of one retired import behind. That is the exact half-ported shape `meridian/Surface.tsx`'s own header documents (one shared judgement call held six finished surfaces on the retired layer). It is also **the only route that would put `@/components/meridian/MoreMenu` into the route tree for the first time**: the component exists and is exported, but `grep -rl meridian/MoreMenu src/routes/` returns zero, so its 4 usages here are the adoption test.

**How.** Three swaps are not renames. (a) `Value`: the route passes `tone="warn"` at line 625 and `tone={o.tone}` at 209, where `outcomeLabel` returns `"warn"` for both the declined and expired outcomes — tsc errors until `warn` is remapped, most likely to `hold`. (b) `Block` at 186 and 610 passes `more`/`onMore`, which `Region` names `toggle`/`onToggle` and which additionally wants `toggled` to emit `aria-expanded`. (c) `MoreItem`'s prop is `onClick`, not `onSelect`; the shape is otherwise identical. One build hazard: `tool-override-insert-is-complete.test.ts` matches mutation blocks with `/useMutation\(\{[\s\S]*?\n  \}\);/` and asserts none lacks `onError`, so **reindenting a mutation while editing JSX can silently break that guard** — leave mutation blocks' indentation alone.

**Acceptance.**
- `import:shell/primitives` and `usage:shell/primitives` (32) both at zero.
- `MoreMenu` renders from Meridian and its items answer keyboard.
- `outcomeLabel`'s return type is Meridian's tone union, so the remap is compiler-enforced rather than spot-fixed.
- `tool-override-insert-is-complete.test.ts` green; baseline re-frozen lower.

**Owns.** `src/routes/_authenticated.boundary.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-57 · Take the Obsidian `Button` out of the two routes that still render one**
`STATUS: TODO` · deps: none · size: S

**What.** `src/routes/_authenticated.admin.invites.tsx:59` and `src/routes/_authenticated.admin.tsx:50` both do `import { Button } from "@/components/obsidian"`. Replace both with `surface-parts.Action`, mapping obsidian's `variant="accent"` → `primary`, `variant="secondary"` → `default`, and its `loading` prop → `disabled={mutation.isPending}` — the pattern already used at `src/routes/_authenticated.crew.tsx:850,853`. **invites has two call sites, not one**: line 190 (`secondary`, already `disabled={revoke.isPending}`) and line 334 (`accent`, `loading={mint.isPending}`, `disabled={mint.isPending || !note.trim()}`); admin.tsx's is line 206. While there, finish invites' `shell/primitives` import at 58 (`Field`→`forms.Field` 4, `Input`→`forms.Input` 4, `Block`→`Region` 3, `Empty`→`NothingHere` 2, `Failed`→`ReadFailedLine` 1, `Loading`→`Reading` 1), the three `var(--sp-font-mono)` at 180/350/358 and `var(--text-body)`/`var(--text-primary)` at 347/351. In admin.tsx replace the eight `--text-*` and two `--hairline` occurrences (120, 134–144, 184, 191, 194, 210) and swap `PageHead`→`PageHeading`, `Surface`→`meridian/Surface`.

**Why.** 34 occurrences across two small files (367 and 218 lines), and `admin.tsx:120-144` hand-draws a tab strip out of `--text-primary`/`--text-subtle` and a 2px border-bottom, which is what `meridian/Tabs` exists for.

**How.** **Do not claim the route tree becomes obsidian-free.** `src/routes/_authenticated.runs.$missionId.tsx:230` still imports `TestStationPanel` from `@/components/obsidian/TestStationPanel`, and six components outside `src/routes/` still import the obsidian `Button`. Also: **the ratchet cannot see this eviction at all.** Both markers in `src/__tests__/meridian-ratchet-scan.ts` require a subpath — `import:components/obsidian` is `/from\s+["'](?:@\/components|\.{1,2}\/[^"']*)\/obsidian\/[^"']+["']/` at line 208, and `RETIRED_MODULES` uses `source: /\/obsidian\/[^/]+$/` at 248 — while both files import the **barrel** `"@/components/obsidian"`, which matches neither. That is why neither file carries an obsidian entry in the baseline. Verify the eviction with grep and say so; the ratchet will only confirm the `--sp-`/`--text-`/`--hairline`/shell-primitives drops. One real loss to record: obsidian's `Button` sets `aria-busy={true}` from `loading` (asserted in `src/components/obsidian/button-consolidation.test.tsx`) and `Action` has no equivalent, **so the busy announcement is dropped** — note it in the build log as a Meridian gap.

**Acceptance.**
- `grep -rn "components/obsidian" src/routes/` returns only the `TestStationPanel` import and the `chat.tsx` comment.
- All three obsidian `Button` call sites render through `Action` with the right variant and a pending-disabled state.
- The admin tab strip uses `meridian/Tabs` and answers arrow keys.
- Baseline re-frozen lower on both files.

**Owns.** `src/routes/_authenticated.admin.invites.tsx`, `src/routes/_authenticated.admin.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-58 · Settings: the largest single block of route debt**
`STATUS: TODO` · deps: K-38 · size: L

**What.** Swap the one `@/components/shell/primitives` import at **`src/routes/_authenticated.settings.tsx:241`** for Meridian equivalents and rename the call sites: `Button`→`Action` (21), `PageHead`→`PageHeading` (17), `Block`→`Region` (15, `more`/`onMore` → `goTo`/`onGoTo`), `Empty`→`NothingHere` (10), `Input`→`forms.Input` (9), `Loading`→`Reading` (9), `Failed`→`ReadFailedLine` (8), `Field`→`forms.Field` (4), `Select`→`Picker` (3), `Textarea`→`forms.Textarea` (2). Map the 34 `--sp-*` tokens (`--sp-ink`/`--sp-mute`→`--mrd-ink`/`--mrd-mute`, `--sp-space-N`→`--mrd-sN`, `--sp-text-*`→`--mrd-t-*`, `--sp-font-mono`→`--mrd-mono`, `--sp-radius-card`→`--mrd-r-card`, `--sp-line`→`--mrd-line`, `--sp-lift`→`--mrd-lift`) and the 9 `sp-` class strings: `sp-pass`/`sp-fail`/`sp-warn` become `<Value tone="pass|fail|hold">`.

**Why.** 142 occurrences — **the single biggest route file in the baseline, 14% of all route debt and 59 more than the next file.** It is also already half-Meridian: it imports `meridian/rows`, `meridian/surface-parts`, `meridian/SidebarNav`, `meridian/AgentCards` and `meridian/NeedsSetup` at lines 159–214, and `src/routes/__tests__/settings-nav-is-meridian.test.ts` already pins part of it. The remaining 98 shell/primitives usages are the last thing holding a mostly-ported surface on the retired layer.

**How.** **The `<Surface>` swap is not a drop-in at the page body, and doing it as written breaks a shipped test.** There are two hand-rolled `sp-inner`/`sp-main` pairs: 293–294 (inside `errorComponent`) and 496/512 (the page body). `src/components/meridian/Surface.tsx` accepts only `{children, context, wide}` and renders `<div className="sp-inner"><div className={wide ? "sp-wide" : "sp-main"}>` with **no prop pass-through**, while the body pair carries `id={PANE_ID}`, `tabIndex={-1}` and inline styles (`display:flex`, `flexWrap:wrap`, `gap: var(--sp-space-6) var(--sp-ctx-gap)`, `flex: 1 1 460px`). `settings-nav-is-meridian.test.ts:67` asserts `ships("id={PANE_ID}")` and `:63` asserts the skip link, so a naive swap kills the skip link and the test. **Only the `errorComponent` pair is a clean `<Surface>`**; the body either needs an extended `Surface` (a real Meridian gap, argued in the file) or keeps its hand-rolled divs. Two tokens are unmapped by the table above and are live code, not comments: `--sp-ctx-gap` (501) and `--sp-weight-medium` (2657) — if no `--mrd-*` fits, build it in Meridian. All nine `<Loading>` sites (729, 1067, 1346, 1904, 2162, 2327, 2554, 2601, 2729) use the plain form with no `working` prop, so that one **is** a literal rename. `Button`'s `icon` prop (`primitives.tsx:406-410`) has no counterpart on `Action` (`surface-parts.tsx:402-412`), but this route never passes it — the only "icon" hit, line 807, is in a comment — so it is a heads-up for other files, not a blocker here.

**Acceptance.**
- `settings-nav-is-meridian.test.ts` green **unmodified**, skip link included.
- `--sp-ctx-gap` and `--sp-weight-medium` both resolved, either mapped or newly built in `meridian.css` with their argument.
- All three status classes replaced by `Value` tones, greyscale-safe.
- Baseline re-frozen lower; no marker left standing.

**Owns.** `src/routes/_authenticated.settings.tsx`, `src/styles/meridian.css`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-59 · Today, together with the stylesheet that paints it**
`STATUS: TODO` · deps: K-34 · size: L

**What.** Port `src/routes/_authenticated.today.tsx` and `src/styles/today.css` as one unit, because `today.tsx:39` imports the sheet. Route: `Failed`→`ReadFailedLine` (6), `Block`→`Region` (5), `Button`→`Action` (4), `Loading`→`Reading` (3), `PageHead`→`PageHeading` (3), `Surface`→`meridian/Surface` (3), `Empty`→`NothingHere` (1), `Receipt`→`meridian/Receipt` (1), `Value`→`surface-parts.Value` (1). Stylesheet: remap the remaining `--sp-*` declarations to `--mrd-*`. Port `src/routes/__tests__/today-states-its-wait.test.ts` in the same commit.

**Why.** The largest unit in the queue at 223 occurrences (29 route, 194 stylesheet), second only to `styles.css` and `primitives.css` across the whole baseline. Porting the route alone is **the exact failure the ratchet's third-hole note warns about — "a port that swaps components and leaves the paint behind moves the debt rather than clearing it"** — and `today.css` is 810 lines that only this route loads, so it can go in the same commit with no blast radius.

**How.** **Do not add `onClick` and `title` to `RecordSpeaks`. That design has been ruled against twice, on the record.** `src/routes/_authenticated.decide.tsx:2955-2965` states it verbatim: "The retired `Record` took an `onClick` and a `title` and made the WHOLE recess clickable, which is how this surface's one checkable claim ended up with an affordance nobody could see: a paragraph that happens to be a button announces nothing and looks like prose. Meridian's `RecordSpeaks` deliberately has no onClick." `DiscoverSurface.tsx:2885` repeats it and `surface-parts.tsx:900-913` gives the reason. `decide.tsx` shows the sanctioned port for exactly this shape: `<RecordSpeaks>` with a named `<Door>` underneath that names the destination — and `today.tsx` already imports `Door` at line 2. So `today.tsx:1181` becomes RecordSpeaks-plus-Door, `surface-parts.tsx` is **not** in `Owns`, and 10+ existing `RecordSpeaks` call sites stay as they are.

Second: `today-states-its-wait.test.ts` pins the literal component spellings — `<Loading` at L98 and L119, `jsx.indexOf("<Loading>Reading what it learned.</Loading>")` at L182 and L197, `<Block title` at L199. `Loading`→`Reading` and `Block`→`Region` break all of them. **Re-pin the test to the property, not the new spelling**, so the next rename does not repeat this. Third: `today.tsx:328` passes `variant="ghost"` → `quiet`, and `today.tsx:357` passes `more`/`onMore` → `goTo`/`onGoTo`. Fourth: the stylesheet is a semantic remap, not a prefix swap — of the 43 distinct `--sp-*` tokens in `today.css` only 8 have a same-named `--mrd-` twin, and at least four have **no Meridian equivalent at all**: `--sp-space-9` (`meridian.css` stops at `--mrd-s8`), `--sp-stage-discover`, `--sp-stage-decide`, and `--sp-warn` (nearest is `--mrd-hold`). Those are gaps to build in `meridian.css`, each with its argument in the file.

**Acceptance.**
- `today.css` carries no `--sp-*`; every gap is a new `--mrd-*` token with its reasoning, not a widened baseline.
- `today-states-its-wait.test.ts` asserts the wait behaviour, names no component spelling, and still fails if a read renders without stating its wait.
- No `onClick` or `title` added to `RecordSpeaks`; the record's action sits in a `Door` beneath it.
- `/today` screenshotted before and after in both grounds.
- Baseline re-frozen lower on both files.

**Owns.** `src/routes/_authenticated.today.tsx`, `src/styles/today.css`, `src/routes/__tests__/today-states-its-wait.test.ts`, `src/styles/meridian.css`, `src/__tests__/meridian-ratchet.baseline.json`

---

### Group I — The status vocabulary, and the guards that missed it

`agent_runs.status` and `missions.status` are different vocabularies that look alike, and **every defect below is a reader keying on a word its writer never writes, or a writer's word no reader knows.** K-12 builds the canonical type. These items fix the specific readers, and pin them.

A standing distinction for the whole group, because it is the thing that has repeatedly gone wrong: `complete` is an **agent_runs** status (`src/lib/agents.functions.ts:211`). `planning`, `blocked`, `shipped` and `draft` are **missions** statuses. `skipped` is a **mission_steps** status. `waiting_approval` is a run status; the mission-table gate value is `blocked` — `src/components/obsidian/build-status.test.ts:35` says so in as many words.

---

**K-60 · `runBucket` is blind to 41% of runs**
`STATUS: TODO` · deps: none · size: S

**What.** Add `halted → "failed"` and `waiting_approval → "queued"` to `RUN_STATE` in `src/lib/agent-fleet.ts`, and add a case per key to `src/lib/agent-fleet.test.ts`, which names neither today. Then delete the special-case `bucketOf()` at `src/lib/crew.functions.ts:161-166` and its comment, which claims `runBucket` "does not carry" `complete` — `agent-fleet.ts:77` has carried it since.

**Why.** `RUN_STATE` has keys for neither `halted` nor `waiting_approval`, so `runBucket()` returns `"other"` for them. `computeAgentFleet` still does `total += 1` at line 145 but never increments `running`/`queued`/`done`/`failed`, so **`FleetAgent.total` stops reconciling with its own four tallies** and `summary.withExceptions` misses every halted run. The file's own comment at 73–76 explains that a missing key made runs "uncounted as finished wherever the fleet model is read" — **that fix landed on the 2-run `complete` case and left the rest of the table half-filled.** `src/lib/crew.functions.ts:45` imports `runBucket`, so the hole is in the crew tallies too, and the local `bucketOf` wrapper is now dead code whose comment states something false about the module it wraps.

**How.** **Do not add `blocked` or `skipped`.** Neither is an `agent_runs` status — `src/components/runs/run-state.ts:22-27` says `blocked` is the mission table's word, and `skipped` is a `mission_steps` value — so both would be dead keys, and a test asserting `runBucket("blocked") === "queued"` is a tautology proving nothing. **And `completed_with_failures` is explicitly out of scope for this item.** It is the 452-run case and it is genuinely contested in the repo: six sites treat it as stopped (`AgentRosterPanel.tsx:81`, `AgentInspector.tsx:58`, `run-state.ts:32`, `obsidian/build-status.ts:31`, `ask-blocks.server.ts:290`, and `mission-advance.server.ts`, which deliberately excludes it from `RUN_SUCCESS_STATUSES`), two treat it as delivered (`credit-policy.ts:161`, `run-analytics.ts:74`). Because `computeAgentFleet`'s `failed` tally drives `withExceptions` — the supervise-by-exception signal — bucketing it either way makes the fleet view contradict the governance roster over the same rows. **Flag it in §4 Blocked for a ruling; do not decide it in a port.**

**Acceptance.**
- `runBucket("halted")` and `runBucket("waiting_approval")` return a real bucket, each with its own test case.
- `bucketOf` and its comment gone from `crew.functions.ts`; crew tallies unchanged in output.
- `completed_with_failures` untouched, with a §4 Blocked line naming the two camps and the six/two split.

**Owns.** `src/lib/agent-fleet.ts`, `src/lib/agent-fleet.test.ts`, `src/lib/crew.functions.ts`

---

**K-61 · The delegate desk files finished missions under Queued**
`STATUS: TODO` · deps: none · size: S

**What.** Add `halted: "attention"` to `STATUS_TO_LANE` in `src/lib/delegate-desk.ts` (80–118), add `complete` to `STEP_DONE` (line 128), and extend `src/lib/delegate-desk.test.ts` with a case for each.

**Why.** `laneForStatus` (line 123) falls to `DEFAULT_LANE = "awaiting"` for any unknown status, and "awaiting" is labelled **"Queued — Handed off, waiting to start"** (`LANE_META`, line 72), so a halted mission reads as not yet started. And `STEP_DONE` has `completed`/`done` but not `complete`, so **every step finished through `src/lib/agents.functions.ts:211` understates `missionProgress`** — which `src/components/shell/BoardPanel.tsx:75` renders as a percentage. A progress bar that under-reports is worse than no bar.

**How.** Three of the four keys that look obviously missing must **not** be added to `STATUS_TO_LANE`. `complete` is an `agent_runs` status, so it belongs in `STEP_DONE` (load-bearing: the step strip falls back to `agent_runs` rows when a mission has no `mission_steps`) and is inert in the lane map. `waiting_approval` is not a mission status either — `src/lib/reliability/gate-state.ts:5-11` records that the loop "marks the RUN `waiting_approval` without touching the parent mission", and the gate-sync reconciler writes `missions.status='blocked'`, which is **already** mapped to `needsYou` at line 84, so adding it would commit the exact defect K-63 exists to fix. `completed_with_failures` is contested — the attention lane's own blurb is "Stopped early. Failed or cancelled.", so routing a partly-failed mission to "Done. Finished." over-claims. Leave it, and reference K-60's §4 Blocked line.

**Acceptance.**
- A halted mission lands in `attention`, not `awaiting`, with a test.
- `missionProgress` counts a step finished as `complete`, with a test.
- No key added for a status that no mission writer produces.

**Owns.** `src/lib/delegate-desk.ts`, `src/lib/delegate-desk.test.ts`

---

**K-62 · Terminal statuses the runaway detector calls active**
`STATUS: TODO` · deps: none · size: S

**What.** Add `halted` and `completed_with_failures` to `TERMINAL_STATUSES` in `src/lib/reliability/runaway.ts:66`, add a case per status to `src/lib/reliability/runaway.test.ts` asserting severity `"watch"` rather than `"runaway"` for a breached-but-finished mission, and correct `docs/features/runaway-detection.md`, which documents terminal as "(done/failed/cancelled)".

**Why.** Line 66 is `new Set(["done","completed","failed","cancelled","canceled"])` under the comment "Anything not listed is treated as ACTIVE", and line 72 defines the consequence: **"runaway = breached AND still active (actionable now); watch = breached but terminal (post-hoc)."** So a mission that breached a spend or hop ceiling and then halted is escalated as **actionable-now forever** instead of settling to post-hoc watch. This is the false-alarm generator sitting inside the mechanism whose whole job is to tell an operator what needs them now.

**How.** **Do not add `complete`.** The only writer of the singular form is `src/lib/agents.functions.ts:211`, which updates `agent_runs`, not `missions`; every mission-terminal list in the repo uses `completed` (`missions.functions.ts:615`, `build/native.server.ts:93`, `MissionOrchestratorDetail.tsx:929`). Adding it is unevidenced and cuts against the file's own "anything not listed is ACTIVE, fail loud toward visibility" design note. This is `completed_with_failures`'s one uncontested reading: whatever bucket it belongs in for the fleet model, it is unambiguously **finished**, so it cannot be actionable-now. Note that the doc already misstates the suite size as "18 cases" when it is 22, which shows `docs:check` does not enforce it — fix both while you are there.

**Acceptance.**
- A breached mission at `halted` or `completed_with_failures` returns `watch`, each with a test.
- `complete` not added.
- `runaway-detection.md` names the real terminal set and the real suite size; `bun run docs:check` clean.

**Owns.** `src/lib/reliability/runaway.ts`, `src/lib/reliability/runaway.test.ts`, `docs/features/runaway-detection.md`

---

**K-63 · The ghost status `awaiting_approval`, and the mission words leaking into run readers**
`STATUS: TODO` · deps: none · size: S

**What.** Replace `LIVE_STATUS` at `src/components/governance/AgentRosterPanel.tsx:80` with the canonical set that already exists at `src/lib/governance.functions.ts:349` — `LIVE_RUN_STATUSES = new Set(["queued", "running", "waiting_approval"])` — importing it rather than re-declaring. Fix `src/components/cockpit/AgentInspector.tsx:43` and `:57` the same way, including the `status === "running" || status === "planning"` branch at 56. **Delete** the dead `awaiting_approval` key from `STATUS_TO_LANE` in `src/lib/delegate-desk.ts:86` and add nothing in its place. Then add a guard test asserting that every status string a reader keys on is one a writer writes **to that same column**.

**Why.** `awaiting_approval` has **four occurrences across `src/` and `supabase/`, and all four are readers.** There is no writer anywhere: the only status written for a gate is `waiting_approval` (`src/lib/ai/loop.server.ts:1429`). Consequence: `AgentRosterPanel`'s `stateFor` (148–154) can never return `"running"` for a gated run, so **an agent waiting on the user wears the idle mark** — the exact opposite of the one signal the roster exists to give. `AgentInspector`'s `runStatusLabel` never prints "Waiting on a decision from you" and falls through to the raw column value. And `LIVE_STATUS` carries a **second** ghost: `planning` is a mission status and a tool category, never an `agent_runs` value, while the set omits the real live values `queued` and `dispatched`.

**How.** **The guard test must be scoped per column or it has no teeth on the defect it exists to catch.** "Every status a reader keys on is one some writer writes" passes trivially against the union of all vocabularies — `planning` *is* written, just to `missions.status`. Build three sets (run status, mission status, step status) from the writers, and assert each reader against the right one. And on `delegate-desk.ts:86`: deleting the dead key is correct, but **adding `waiting_approval` there would introduce a key no mission writer ever produces** — `STATUS_TO_LANE` maps mission status, and the existing `blocked: "needsYou"` already covers the mission gate.

**Acceptance.**
- `grep -rn awaiting_approval src/ supabase/` returns nothing.
- A gated run renders as live on the roster and prints its "waiting on a decision from you" label in the inspector.
- The guard fails if a reader keys on a word written only to a different column, proved by planting `planning` back into a run-status set.
- No mission-status map gains a run-status key.

**Owns.** `src/components/governance/AgentRosterPanel.tsx`, `src/components/cockpit/AgentInspector.tsx`, `src/lib/delegate-desk.ts`, `src/lib/__tests__/status-vocabulary-per-column.test.ts`

---

**K-64 · Two of the four normalisers have no tests, and three of the four disagree**
`STATUS: TODO` · deps: K-12, K-60 · size: M

**What.** Write `src/lib/__tests__/one-run-status-vocabulary.test.ts`. Build one table of every spelling the repo writes or reads — `complete`, `completed`, `completed_with_failures`, `done`, `succeeded`, `failed`, `halted`, `cancelled`, `running`, `queued`, `waiting_approval`, `blocked`, `proposed` — and drive all four normalisers over it: `runState` (`src/components/runs/run-state.ts:34`), `runBucket` (`src/lib/agent-fleet.ts:91`), `classifyRunOutcome` (`src/lib/run-analytics.ts:69`), `taskStatus` (`src/components/meridian/TaskRows.tsx:103`). Assert the three things they must agree on — which spellings are **terminal**, which are **successful**, which mean **a person is required** — then fix the two branches that are wrong and pin `taskStatus`'s not-yet-started case explicitly.

**Why.** Three of the four disagree, and each was measured by running it.

**`runState("complete") === "queued"`.** Line 42 tests `status === "completed" || status === "done"` and never the singular, which `src/lib/agents.functions.ts:211` writes on the single-agent happy path. So a finished run reads **Queued** in both the Runs list and the Runs board — and `run-state.ts`'s own header says the failure mode it exists to prevent is "a run reads Working in the list and sits under Done on the board, which destroys trust in both at once." `runBucket` and `classifyRunOutcome` both get it right; this file is the only one that does not.

**`classifyRunOutcome("cancelled") === null`**, i.e. still in flight. `run-analytics.test.ts:45-47` pins `running`, `waiting_approval` and `null` as in-flight and never tests `cancelled`. `agent-fleet.ts:83` maps it to `failed`, `run-state.ts:31` to `stopped`. **A cancelled run is dropped from every station success rate forever.**

**`taskStatus` has zero tests** — grep returns three non-file callers and no test file. Its `default: return "blocked"` (`TaskRows.tsx:122`) sends `queued`, `proposed` and `pending` to the label "Waiting on you" in `--mrd-you`, **the hue reserved for a person being required**, and `proposed` is the majority mission state.

**How.** The strongest evidence these are known-incomplete is that call sites already patch around them: `src/components/today/RunState.tsx:86-90` wraps `taskStatus` in a `STOPPED` map for `cancelled`/`halted` with a comment saying both were arriving as "waiting on you, in ORCHID". **Each fix was applied at one caller and never at the mapping, which is how the next caller inherits the bug** — so fix the mapping, then check whether the wrapper is still needed and say so. K-60 removes the same pattern in `crew.functions.ts`; do not re-add it. Note `run-state.ts` value-imports `agentDisplayName`/`agentRelayVerb` and `run-analytics.ts` imports `agentStation`, both from `@/lib/agent-vocabulary` — that chain bottoms out at `@/lib/ai/tools/defaults` with zero imports, so the whole test stays pure, but do not assume it: assert it.

**Acceptance.**
- One table, four normalisers, three agreement assertions, offending spellings printed by name rather than counted.
- `runState("complete")` is terminal; `classifyRunOutcome("cancelled")` is not in-flight.
- `taskStatus` has a not-yet-started case that is not `blocked` and does not wear `--mrd-you`.
- The test imports nothing from a `.server.ts` and does no I/O.

**Owns.** `src/lib/__tests__/one-run-status-vocabulary.test.ts`, `src/components/runs/run-state.ts`, `src/components/meridian/TaskRows.tsx`, `src/lib/run-analytics.ts`, `src/lib/run-analytics.test.ts`, `src/components/runs/run-state.test.ts`, `src/components/today/RunState.tsx`

---

**K-65 · Seven copies of `initialsFrom`**
`STATUS: TODO` · deps: none · size: S

**What.** Move `initialsFrom` into its own pure module under `src/lib` and import it from the seven call sites: `src/components/memory/MemoryReviewQueue.tsx:83`, `src/components/ask/AskPane.tsx:150`, `src/components/knowledge/DecisionsPanel.tsx:154`, `src/components/engine-room/rooms/ReceiptsPanel.tsx:107`, `src/routes/_authenticated.threads.tsx:196`, `src/routes/_authenticated.runs.$missionId.tsx:400`, `src/components/shell/AppFrame.tsx:586`. Widen the signature to the `AppFrame` variant, the only one that accepts `undefined`.

**Why.** Seven non-test files carry a byte-identical seven-line body, and `src/routes/_authenticated.settings.tsx:813` carries a comment pointing at the `AppFrame` copy as the reference — **a cross-file dependency held together by prose.** `ReceiptsPanel.tsx:105-106` states the invariant that makes the duplication a real risk rather than mere untidiness: "Your initials, derived the same way the app header derives them, so the disc on a receipt you settled is the same disc you see in the corner." Seven copies is seven chances for that to stop being true silently.

**How.** Give it a dedicated file rather than co-locating in `src/lib/agent-vocabulary.ts`: that module imports `TOOL_DEFAULTS` from `@/lib/ai/tools/defaults`, and while `AppFrame`, `threads.tsx`, `runs.$missionId.tsx` and `ReceiptsPanel` already import it, `AskPane`, `MemoryReviewQueue` and `DecisionsPanel` do not — co-locating adds a module edge to three files for no reason. Move the doc comment with the function. `ReceiptsPanel.tsx` is not in the baseline at all, so it is governed by ratchet **rule 1** (a file the baseline has never seen must be born clean), not rule 2 — do not introduce a token there.

**Acceptance.**
- One definition; seven importers; the `settings.tsx` comment updated to name the module instead of a file it does not import.
- Signature accepts `undefined`; every call site compiles unchanged otherwise.
- No new debt in any touched file; `bun test` green.

**Owns.** `src/lib/initials.ts`, `src/components/shell/AppFrame.tsx`, `src/components/ask/AskPane.tsx`, `src/components/memory/MemoryReviewQueue.tsx`, `src/components/knowledge/DecisionsPanel.tsx`, `src/components/engine-room/rooms/ReceiptsPanel.tsx`, `src/routes/_authenticated.threads.tsx`, `src/routes/_authenticated.runs.$missionId.tsx`

---

**K-66 · A declared default must survive the runtime**
`STATUS: TODO` · deps: K-11 · size: M

**What.** Write `src/lib/ai/tools/a-declared-default-must-survive-the-runtime.test.ts` with three assertions, each proved by planting the defect — delete one catalogue row and watch it go red.

**(a) Declared auto must resolve auto.** For every `TOOL_DEFAULTS` entry with `mode: "auto"`, assert `resolveToolMode(name, "auto", "ambient", false) === "auto"`. **Print the offending names, not a count** — knowing which tool needs a row is the whole work of fixing it.
**(b) Declared confirm/review must be able to reach the gate.** For every entry whose mode is not `auto`, assert its `TOOL_REGISTRY` category is one the loop's approval branch admits (`write` | `planning`), or that it is a named control-flow exemption.
**(c) A risk cap must not block reads while permitting writes.** Assert `filterToolsByRisk(allTools, "low").allowed` contains the core read tools (`workspace.search`, `repo.read`, `signals.list`) and is not composed exclusively of write-category tools.

Add a floor test (`Object.keys(TOOL_DEFAULTS).length > 40`) so an emptied registry cannot make the loops pass vacuously — the convention `every-tool-can-be-named.test.ts` and `tool-consequences.test.ts` already use.

**Why.** Measured by running it: **18 tools declare `mode: "auto"` and resolve to `confirm` on `ambient`, the most permissive arc.** `CONSEQUENCES` holds 42 keys against `TOOL_DEFAULTS`'s 59; `toolRisk` (`src/lib/tool-consequences.ts:391`) fails closed to `high`; `resolveToolMode` (`src/lib/ai/loop.server.ts:186-192`) demotes high+auto to `confirm`. So `cluster.trigger`, set to `auto` on 2026-08-03 with a fifteen-line argument at `src/lib/ai/tools/defaults.ts:107-121`, queues an approval anyway. **The existing guard cannot see any of this**: `src/lib/tool-consequences.test.ts:187` scopes itself to `d.mode !== "auto"` on purpose, so all 18 are outside it by construction.

**The cap inversion is the sharpest of the three and is documented nowhere.** `filterToolsByRisk(all, "low")` returns 24 tools **and every one is a write** — `decision.record`, `prd.draft`, `tasks.create`, `studio.stage`, `memory.promote` — while blocking `workspace.search`, `signals.list`, `repo.read`, `web.search`, `sources.status`. **A risk cap tightens an agent by removing its ability to read and keeping its ability to write.** `src/lib/tool-consequences.ts:74-78` predicts exactly this failure in its own comment and nothing checks it. (b) is the same root cause running the other way: `memory.promote` declares `mode: "confirm"` at `defaults.ts:189` and runs unattended, because `isWrite` at `loop.server.ts:1379` is `category === "write" || category === "planning"` and its category is `memory`.

**How.** `CONSEQUENCES` (`tool-consequences.ts:21`) and `RISK_PROFILE` (:498) are **module-private**, so the test must go through the public surface: `CATALOGUED_TOOLS` (:888), `PROFILED_TOOLS` (:889), `toolConsequence`, `toolRiskProfile`, `toolRisk`, `filterToolsByRisk`. **(a) and (c) are red on a clean tree and go green only because K-11 filled the catalogue** — that is the dependency, and it is why this item comes second rather than being folded into K-11. (b) yields exactly two offenders on the current tree, `memory.promote` (category `memory`) and `web.crawl` (category `read`); decide whether each is a named exemption or a category correction and say which in the build log.

**Acceptance.**
- Three assertions plus the floor test; each proved red by planting the defect, with the planting described in the build log.
- Offending tool names printed, never counted.
- Test imports only the public surface of `tool-consequences.ts`.
- Green on the post-K-11 tree.

**Owns.** `src/lib/ai/tools/a-declared-default-must-survive-the-runtime.test.ts`

---

**K-67 · Every nav door resolves to a route file**
`STATUS: TODO` · deps: none · size: S

**What.** Add cases to `src/lib/nav-model.test.ts` asserting that every `to` in `PRIMARY_NAV`, `FOOTER_NAV` and `ENGINE_ROOM_PATHS` resolves to a route file on disk.

**Why.** All 18 nav paths resolve today — this is a ratchet, not a fix, and it is worth saying so plainly. `nav-model.test.ts:152-161` spot-checks exactly **two** of them (`/runs`, `/crew`), so the other 16 are unguarded and currently correct. `AGENTS.md` §4 names "a capability with no door" as the dominant defect in this repo, and the inverse — a door onto nothing — is the failure that ships a 404 in the primary rail. **The measured cleanliness is the argument for pinning it now**: the list is short today and will not be short after the next feature.

**How.** **Do not write a new authenticated-route inventory file.** That work already exists: `src/lib/__tests__/route-inventory.test.ts` covers the authenticated half, added 2026-07-30 after the Artifacts incident, and already defines `AUTH_EXEMPT` (with written reasons for `/start`, `/onboarding`, `/m`, `/meridian`), `RETIRED_LINKERS` so a link from dead chrome does not count, `isRedirectStub()`, `authRouteFiles()` and `authRoutePath()`, and generates one test per non-stub non-exempt authenticated route. Adding a second file creates a second `EXEMPT` list that will drift from the first. If you need its redirect-stub rule, copy the one it uses — `content.includes("throw redirect") && content.split("\n").length < 45` — and not a line-count heuristic; files containing `redirect(` span 8 to 94 lines continuously, so there is no gap to split on.

**Acceptance.**
- One case per nav constant, failing with the offending `to` value named.
- No new inventory test file; no second exemption list.
- Green on the current tree, and red if a nav entry is pointed at a path with no route file.

**Owns.** `src/lib/nav-model.test.ts`

---

### Group J — States, focus, and the two surfaces every failure lands on

`DESIGN-SYSTEM.md:128` names seven states — "Empty, partial, failed, denied, very long, very short, slow" — **each one composed, not merely handled.** Meridian composes four. These items close two of the gaps and fix three surfaces that left the system entirely.

---

**K-68 · The app's two universal failure surfaces render entirely outside Meridian**
`STATUS: TODO` · deps: K-09 · size: M

**What.** Port `AuthedError` (`_authenticated.tsx:95-135`) and `AuthedNotFound` (`:137-156`), and the root `NotFoundComponent` (`__root.tsx:48-81`) and `ErrorComponent` (`:83-118`), onto Meridian: rebuild them from `ReadFailed`/`NothingHere` plus `Action`, put `data-mrd=""` on each root, and delete `fallbackWrap` (`_authenticated.tsx:83-93`) and `BoundaryShell` (`__root.tsx:24`).

**Why.** Four early returns rendering outside the design system, and **every one of them is a failed read or an empty workspace at the highest-traffic point in the product.** They were missed by every early-return sweep because they are route **options** (`errorComponent:`), not `return` statements in a component body. `_authenticated.tsx:79-80` is the error and notFound boundary for all 94 authenticated routes; `__root.tsx:294-295` is the boundary for all 112. Measured: `_authenticated.tsx` carries 17 retired occurrences (`--text-` 5, `--hairline` 1, `data-obsidian` 5, `class:sp-` 1, raw-colour 5) and `__root.tsx` 10 (`--ds-` 1, `--text-` 6, `--font-pixel` 1, `data-obsidian` 1, raw-colour 1) — **27 across three retired systems.** Concretely: raw hex `#C6C0B8` at 102/127/140 and `#A39D94` at 111/147; `--hairline` at 125, banned by name on 2026-08-18; `var(--font-pixel)` and `var(--ds-gray-1000)` at `__root.tsx:56/59`. **Neither file carries `data-mrd` anywhere**, so "Reload the page" (117), "Back to Today" (143), "Try again" (`__root.tsx:102`) and "Go home" (:112) all fall through to the legacy `[data-obsidian] :focus-visible` at `styles.css:2388` instead of the Meridian ring. `__root.tsx:52` also cites the **retired v5 Tempo design contract** as its authority, naming that archived file directly, which `CLAUDE.md` forbids outright.

**How.** All six components are **module-local and not exported**, so "render them in both grounds to prove it" requires extracting them first — do that deliberately, into the same file or a small colocated module, and say which. The root `ErrorComponent` takes a second prop, `reset: () => void`, and calls `router.invalidate()` alongside `reset()`; **the Meridian rebuild must preserve that retry wiring**, not just the error prop. Take the baseline down by the reclaimed count.

**Acceptance.**
- All four surfaces render Meridian components with `data-mrd=""` on the root.
- Every button in them takes the Meridian focus ring, checked in dev with Tab.
- Retry still calls both `reset()` and `router.invalidate()`.
- The citation of the retired v5 contract is gone, replaced by the live one; baseline re-frozen 27 lower.

**Owns.** `src/routes/_authenticated.tsx`, `src/routes/__root.tsx`, `src/components/meridian/surface-parts.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-69 · 58 focus rings that paint nothing, because the utility loses to an unlayered rule**
`STATUS: TODO` · deps: none · size: M

**What.** Replace per-component `focus-visible:outline-*` Tailwind utilities with `data-mrd=""` on the component root in the 28 files that declare a ring and carry no `data-mrd`, starting with the live surfaces: `RoomCard.tsx:42`, `ConnectionStrip.tsx`, `RowActions.tsx`, `DrawingsTable.tsx`, `AuditTag.tsx`, `BillingBanner.tsx`, `_authenticated.admin.tsx:132`. Then add a guard asserting no file declares a `focus-visible:outline` utility without `data-mrd`.

**Why.** Confirmed in the repo's own words. `src/styles.css:2368-2369` states that its `[data-obsidian] :focus-visible` rule at 2388 "is unlayered plain CSS (it sits after both explicit `@layer base` and `@layer utilities` close earlier in this file)", and `meridian.css:1063-1070` states "Tailwind emits utilities into its own `utilities` layer, so `focus-visible:outline-[var(--mrd-edge-focus)]` could not win no matter what colour it named." `AuthedLayout` mounts `data-obsidian` on `<html>` for the whole authenticated tree, so **every one of these is overridden in the running app.** Measured: 53 lines declare such a utility across 46 files; 109 utility tokens exist under `src/`; **58 of them sit in 28 files carrying no `data-mrd`.** `RoomCard.tsx:42` is the clearest case — it declares `focus-visible:[outline-color:var(--focus-ring)]`, which loses the cascade **and** names the legacy alias rather than the Meridian neutral, so it would be wrong even if it won. The 18 tokens in already-tagged Meridian files are equally inert, but they name the colour the winning rule already paints, so they are invisible no-ops rather than broken rings — fold them into the guard's scope and delete them as noise.

**How.** `src/styles/meridian.css` is **read-only** here: the winning rule at line 1089 already exists and needs no edit. The one grep hit to exclude is `src/components/supaprod/__tests__/sketch-components.test.tsx:345`, a hand-built props fixture inside a test, not a component declaring a ring. Verify by Tab, not by reading CSS — the whole finding exists because the CSS reads correct and paints nothing.

**Acceptance.**
- Every one of the 28 files either carries `data-mrd` on its root or has its dead utility removed.
- Tabbing through `RoomCard`, `RowActions`, `AuditTag` and the admin tab strip in dev shows the Meridian ring.
- The guard fails on a planted `focus-visible:outline` in a file with no `data-mrd`.
- Baseline re-frozen where any count dropped.

**Owns.** `src/components/engine-room/RoomCard.tsx`, `src/components/engine-room/ConnectionStrip.tsx`, `src/components/runs/RowActions.tsx`, `src/components/design/DrawingsTable.tsx`, `src/components/supaprod/AuditTag.tsx`, `src/components/billing/BillingBanner.tsx`, `src/routes/_authenticated.admin.tsx`, `src/__tests__/focus-ring-is-inherited.test.ts`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-70 · Meridian's `CtxRow` is announced as a button and does nothing**
`STATUS: TODO` · deps: K-09 · size: S

**What.** Make `CtxRow` in `src/components/meridian/ContextColumn.tsx` render a real `<button type="button">` when `onClick` is present, instead of `<div role="button" tabIndex={0}>`. While there, drop the dead `data-mrd` token from the className string at line 34 — it is a class name, not the attribute, and no `.data-mrd` rule exists in any stylesheet.

**Why.** Lines 56–66 render `<div onClick={onClick} role={onClick ? "button" : undefined} tabIndex={onClick ? 0 : undefined}>` **with no `onKeyDown`**. A div does not natively activate on Enter or Space, so the row is reachable by Tab, announces itself to a screen reader as a button, takes the focus ring — and does nothing when operated. **Focusable-and-announced-but-inert is worse than not being focusable at all.** This is a regression against the floor: the retired Cadence/ink `CtxRow` it replaced returns a real `<button>` at `primitives.tsx:1221`, and its docblock at `primitives.tsx:239` states the rule — "It is a REAL `<button>` when it does something, so it is tabbable, it answers Space and Enter, and it takes the app-wide focus ring" — which `OpportunityRow.test.tsx:223` restates. **The Meridian replacement lost it.** No caller passes `onClick` today across the 9 call sites in `DiscoverSurface`, `decide`, `learn` and `plan.index`, which is precisely why it is cheap now and expensive after the first caller lands.

**How.** **The obvious test does not work in this runner and would pass on nothing.** I probed it: `fireEvent.keyDown(nativeButton, {key:"Enter"})` fires the handler **0 times** while `fireEvent.click` fires it once — neither happy-dom nor jsdom synthesises Enter/Space activation of a native button, that is browser behaviour. And `getByRole("button")` already matches the existing div, so role is not a discriminator either. Assert `expect(screen.getByRole("button").tagName).toBe("BUTTON")` plus `type="button"`, and use `fireEvent.click` for the handler. Two scope notes: three separate `CtxRow` exports exist (`meridian/ContextColumn.tsx:32`, `shell/primitives.tsx:1182`, `crew/CrewChrome.tsx:452`) — **only the Meridian one is in scope and `shell/primitives.tsx` stays read-only** — and `traces.$traceId.tsx` and `governance/CriticBadge.tsx` still import from the shell one, so this fix does not reach them. Finally, the className string carries no `text-left`, so a native button will centre the row text; fix that in the same change.

**Acceptance.**
- `tagName === "BUTTON"` and `type="button"` when `onClick` is present; a plain element when it is not.
- Row text stays left-aligned.
- The dead `data-mrd` class token is gone from the string; the attribute is unaffected.
- Test green, and red if the element reverts to a div.

**Owns.** `src/components/meridian/ContextColumn.tsx`, `src/components/meridian/__tests__/context-column.test.tsx`

---

**K-71 · `Refused` — the denied state has no component**
`STATUS: TODO` · deps: K-09 · size: S

**What.** Add a `Refused` component to `src/components/meridian/surface-parts.tsx` beside `ReadFailed`, for the case where a read **succeeded** and the answer is "you may not see this", and adopt it at `src/routes/_authenticated.admin.tsx`, the one surface that already distinguishes the case by hand.

**Why.** `DESIGN-SYSTEM.md:128` names seven states. Meridian composes `Reading` (slow), `NothingHere` and `NothingYet` (empty), `ReadFailed`/`ReadFailedLine` (failed), and `NeedsSetup` covers precondition-missing. **There is no denied**: a case-insensitive grep for `denied|forbidden|noaccess|unauthori` across `src/components/meridian/` returns zero. The product needs it and one surface already knows — `_authenticated.admin.tsx:29-31` writes the rule out: "an operator cannot tell a failed permission CHECK from a 'you are not an admin' VERDICT. That distinction is already honoured below (register D-11) and must stay: **an error must never wear another state's clothes**" — and then honours it with a locally-built `AdminErrorCard`. **The right distinction made once, by hand, where the system has no word for it, is how it drifts back.**

**How.** `NoAccessCard` is **not** purely presentational and must not be swallowed: it carries the bootstrap claim path (`bootstrapSelfAdmin` gated on `anyAdminExists`), and the route's header reads "KEEP the bootstrap claim path. A workspace with zero admins is unadministrable, and this is the only way out of it." So `Refused` needs a children or action slot and the adoption keeps that branch intact. The flag is a prop, so this stays offline. Note the swap lowers retired-token counts in a baselined file — re-freeze in the same commit.

**Acceptance.**
- `Refused` exported, rendered in the gallery in both grounds, visually distinct from `ReadFailed` — a refusal is not an error.
- The admin bootstrap claim path still renders and still works.
- Copy states what is refused and what to do, in practitioner language.
- Baseline re-frozen lower.

**Owns.** `src/components/meridian/surface-parts.tsx`, `src/routes/_authenticated.admin.tsx`, `src/components/meridian/__tests__/refused.test.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-72 · `EmptyRow` left the system**
`STATUS: TODO` · deps: none · size: S

**What.** Add `data-mrd=""` to `EmptyRow` at `src/components/engine-room/RoomDetail.tsx:99-101`.

**Why.** Line 100 returns `<p className="py-mrd-5 text-[13px] leading-relaxed text-mrd-mute">{message}</p>` — **no `data-mrd`**. Every other member of the read-state family carries it: `Reading` (`surface-parts.tsx:663`), `NothingHere` (:699), `NothingYet` (:725), `ReadFailed` (:780), `ReadFailedLine` (:820), `PanelReading` (`EngineChrome.tsx:402`). `EmptyRow` is the single exception, **and it is the empty state — what production shows most often.** It is swapped in after a read resolves at seven call sites across four Engine Room rooms, several of them early returns (`VerifyCockpit.tsx` 179, 252, 392, 471; `RecordRoom.tsx:63`; `SpendRoom.tsx:128`; `RoutinesPanel.tsx:95`). `ApprovalCard.tsx:143-148` documents the mechanism from the 2026-08-15 sweep: "An early return is how a component root quietly loses it."

**How.** **Add the attribute and nothing else.** Do not add `role="status" aria-live="polite"`: only the pending and failed members carry those, and the two empty states, `NothingHere` and `NothingYet`, deliberately do not. Copying the pending pattern would make this the only empty state in the system that announces itself, and `VerifyCockpit` renders it at four sites on one screen — four polite live regions competing. Do not write the sweeping "every exported state component carries `data-mrd`" guard either: `VerdictSentence`, `ErrorRetry`'s wrapper div and `Row`'s non-interactive branch all lack it in this same file, and `DESIGN-SYSTEM.md:186` says `data-mrd` exists so **controls** inherit the focus ring — a `<p>` with no focusable child does not need one. Pinning a rule with no defect behind it is how a guard starts costing more than it catches.

**Acceptance.**
- `EmptyRow` carries `data-mrd=""`; no aria attributes added.
- No sweeping guard added; the other three gaps in the file are named in the build log with the reason each may be correct as-is.
- `bun test` green, ratchet total unchanged.

**Owns.** `src/components/engine-room/RoomDetail.tsx`

---

### Group K — Multi-product context scope

**Read [`../planning/initiatives/agent-first-platform.md`](../planning/initiatives/agent-first-platform.md) §2.3 before starting any of these.** It carries the ruling and the measurement behind it. The short version: **evidence is product-scoped and never promotes; method is workspace-scoped and promotes deliberately.** Multi-product is already the majority state — 11 of 17 workspaces have more than one product, 7 have four.

**The two migrations this group depends on are Claude's** (`product_id` on `learnings` and `agent_memory`; `workspace_id` on `agent_autonomy`). Every item below is buildable and testable before they land, because each is either pure logic or a client change.

---

**K-73 · `resolveMemoryScope`, as a pure function**
`STATUS: TODO` · deps: none · size: M

**What.** A new pure module `src/lib/memory-scope.ts` exporting `resolveMemoryScope({kind, origin}) => { scope: "product" | "workspace", promotable: boolean, reason: string }`, plus exhaustive tests.

**Why.** The scope rule currently exists nowhere, so every writer picks a scope implicitly and they disagree. Production shows `agent_memory.scope` holding `agent` (1,083), `workspace` (81) and `global` (11) — three values that do not answer the question this ruling asks, which is *whose evidence is this*. Getting it wrong in either direction is expensive: leaking evidence between products makes the director rank on another product's measurements, and for an agency running three clients in one workspace that is a confidentiality breach; while scoping *method* to a product means every product re-learns the same lesson, which kills the compounding claim outright.

**How.** The rule maps onto the existing `kind` column and is written out in §2.3. **Evidence never promotes** — `precedent` and anything outcome-derived is a measurement, and a measurement about product A is not true of product B. **Method promotes** — `reflection` and `correction` are about how to work. `note` is genuinely ambiguous, so it takes a declared scope and **defaults to product**, which is the safe direction.

Make `reason` a sentence a person could read in a promotion prompt, because it will be shown in one. **Do not read the database** and do not import anything `.server.ts` — Claude supplies the rows.

**Acceptance.**
- Pure: no Supabase, no I/O, no `.server.ts` import. A test importing it must not pull the AI runtime.
- Every `kind` covered, including an unknown kind, which must default to `product` rather than throwing.
- A test asserts evidence kinds return `promotable: false`. **This is the one that matters most** — it is the confidentiality guarantee expressed as a test.
- Each `reason` reads as a sentence, not a token.

**Owns.** `src/lib/memory-scope.ts`, `src/lib/memory-scope.test.ts`

---

**K-74 · Ask retrieves workspace-wide no matter where you are standing**
`STATUS: TODO` · deps: none · size: S

**What.** Set `retrievalProductId` from the resolved scope in `src/components/ask/AskPane.tsx`, and show which product Ask is answering from.

**Why.** `retrievalProductId` is a **real, working option on `useAskStream`** and the pane **never sets it**. `AskPane` also forces `productId: null` for conversation persistence, which is correct and separate. So Ask retrieves across the whole workspace regardless of the product you are looking at — and the pane's own comments describe a product chip that was never carried over from an earlier version. **Any multi-product story is wrong until this is wired**, and with 11 of 17 workspaces already multi-product this is live today, not a future concern.

**How.** `scopeForPath` in `src/lib/ask-context.tsx` already resolves scope from the URL and returns a `label` — extend it to carry the product, and pass it through. Keep the persistence `productId: null` exactly as it is; it is deliberate and has its reasoning in place. **Show the product Ask is scoped to**, because silent scoping is how someone gets an answer from the wrong product and never learns it.

**Acceptance.**
- On a product-scoped route, retrieval is scoped to that product.
- Workspace-wide retrieval still happens where no product is resolvable, and the UI says which of the two is in force.
- Conversation persistence is unchanged.
- A test covers both branches.

**Owns.** `src/components/ask/AskPane.tsx`, `src/lib/ask-context.tsx`, `src/lib/__tests__/ask-context-product-scope.test.ts`

---

**K-75 · `PromotionCard`: a lesson graduating is an event, not an accident**
`STATUS: TODO` · deps: K-73 · size: M

**What.** A Meridian component rendering one proposed promotion: the lesson, the product it was learned in, the evidence under it, what it would change if approved, and approve / not-yet / never controls.

**Why.** This is the compounding claim made visible, and it is the honest version of it. The canon forbids saying the product *"remembers"*; what it may say is that **a lesson earned in one product graduated to the workspace, and here is who approved it.** The machinery already exists and is not product-aware: `memory_candidates` is the staging table (20 rows) and `house_rules` is the workspace-level standing rule with a `pending → approved` flow that **reaches every agent's system prompt**. What is missing is the surface where a person sees the graduation and rules on it.

It also matters for governance rather than only for delight: promotion is the moment evidence could cross a product boundary, so it is exactly where a person belongs. Business tier sells "who may promote", and this is that control.

**How.** `Approve` is the correct control here and `Action` is not — the distinction in `surface-parts.tsx` is that `Approve` is for a click that **unblocks** something held, which this is. **"Never" must be a real third option**, distinct from "not yet": a lesson that is wrong should be refusable permanently, or the queue fills with the same rejected candidate. Take the promotion decision as a callback; **persist nothing** — Claude wires it.

**Acceptance.**
- All three outcomes render and are keyboard reachable.
- The card names the product the lesson came from, and what approving would change.
- Composed states: no candidates, one, and a lesson whose evidence failed to load.
- Uses `Approve` for approve and `Action` for the other two.
- Greyscale test passes.

**Owns.** `src/components/meridian/PromotionCard.tsx`, `src/components/meridian/__tests__/promotion-card.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

### Group L — The reference research nobody has done

**These are Kiro's because Kiro can search the web**, and they were wrongly reserved for Claude until 2026-08-19.

The standing rule since 2026-08-01: **research the best proven product in that category and lift its information model and verbs outright, even close to literally.** Name the reference before building; originality is not the goal. Every pass is appended to [`../design/REFERENCE-PATTERNS.md`](../design/REFERENCE-PATTERNS.md) **in the same session**, so it is never paid for twice.

`REFERENCE-PATTERNS.md` records the state: Discover, Design and Build researched 2026-08-01, Decide partially. **Plan, Ship and Learn have never been done**, and **Brain is not in that table at all.** Four surfaces with no reference floor, which is why the design brief refuses to let them be invented.

> **One thing to fix while you are in that file:** its header instructs the reader to express findings *"in our own `--sp-*` primitives"*. `--sp-*` is **retired vocabulary** and this is a live document teaching it. Correct it to Meridian in whichever of these items lands first, and say in your log that you did.

**Each item follows the same shape.** Read an existing section of `REFERENCE-PATTERNS.md` first — Discover or Build — and match its depth and structure. What is wanted is **the information model and the verbs**, with URLs, not a visual description. Never copy visual style.

---

**K-76 · Research the Plan station**
`STATUS: TODO` · deps: none · size: M

**What.** Research and append a Plan section to `REFERENCE-PATTERNS.md`. Reference class already named in that file: **Linear cycles, Productboard roadmap**. Add whatever else genuinely earns a place.

**Why.** Plan is where a decision becomes a spec somebody could build from, and it is the station whose output every later station consumes. It has no reference floor, so the surface has been designed from first principles by whoever touched it last. The specific questions it must answer: how is scope shown without becoming a Gantt chart, how does a spec show its citations, how is sequencing expressed, and what does a spec look like while an agent is still writing it.

**Acceptance.** URLs for every claim · information model and verbs, not visuals · matches the depth of the existing Discover section · appended, never a new file.

**Owns.** `docs/design/REFERENCE-PATTERNS.md`

---

**K-77 · Research the Ship station**
`STATUS: TODO` · deps: K-76 · size: M

**What.** Research and append a Ship section. Named class: **changelog and release-notes tooling**. Worth adding: Vercel and Netlify deploy surfaces, LaunchDarkly and Statsig rollout controls, GitHub Releases.

**Why.** Ship holds the one call that cannot be undone, and `release.publish` is pinned to review in three places and never graduates. So this surface has to make an irreversible decision feel safe rather than fast, which is a genuinely different design problem from the other six. Specific questions: how is a release's blast radius shown before the click, how is a flag-gated rollout expressed, and what does the surface say when a deploy is green but the flag is still off.

**Acceptance.** As K-76.

**Owns.** `docs/design/REFERENCE-PATTERNS.md`

---

**K-78 · Research the Learn station**
`STATUS: TODO` · deps: K-77 · size: M

**What.** Research and append a Learn section. Named class: **Amplitude and experiment readouts**. Worth adding: Statsig and Eppo results surfaces, and how forecasting tools show a resolved prediction against its claim.

**Why.** **This is the station the whole company rests on** and it is the least researched. A readout has to say what was believed, what happened, and whether the two agree — without letting a person retro-fit the belief, which is the failure mode every experiment tool has fought. Specific questions: how is a forecast shown against its outcome, how is *not yet conclusive* expressed without reading as failure, and how does a readout show what it changed downstream.

**Acceptance.** As K-76, plus: **it must cover how a settled result is shown to change something else**, because that is the loop closing and it is the part generic analytics tools do not have.

**Owns.** `docs/design/REFERENCE-PATTERNS.md`

---

**K-79 · Research Brain, which is in no reference table at all**
`STATUS: TODO` · deps: K-78 · size: M

**What.** Add a **Brain** row to the reference-class table and research it. Candidate class: **Notion AI and its knowledge surfaces, Glean, Guru, Obsidian's graph, and how coding agents surface what they retrieved** (Cursor's context pills, Claude Code's file reads).

**Why.** Brain is the layer the strategy calls the only defensible one, and it is the only major surface with **no reference class named anywhere** — the table in `REFERENCE-PATTERNS.md` has seven station rows and does not mention it. Specific questions: how does a surface show *what the system knows* without becoming a search box, how is a retrieved memory shown at the point it influenced something, and how does a system show that it learned something without claiming more than it did.

**Note the constraint before you research:** the vocabulary canon **bans "remembers", "stores" and "logs"** as verbs of the brain, because they claim less than the product delivers. So a reference that models itself as storage is a counter-example rather than a template.

**Acceptance.** As K-76, plus a **Brain** row added to the reference-class table.

**Owns.** `docs/design/REFERENCE-PATTERNS.md`

---

### Group M — The one reference component that was never ported

**K-80 · `Flowchart`, the twentieth component**
`STATUS: VERIFIED 2026-08-20` · deps: K-09 · size: L · **PRIORITY: BUILD THIS NEXT, ahead of its number**

> **This item jumps the queue** (founder ruling 2026-08-20, restated at the top of this file). Its number records when it was written, not when it should be built. A primitive that does not exist is a primitive nobody builds a feature with, so every day it is missing, some later item quietly invents a one-off graph instead.

**What.** Build `src/components/meridian/Flowchart.tsx`: a node-and-edge canvas for showing a branching sequence, with a dotted ground, typed nodes, and orthogonal connectors.

**Why.** **The reference ships twenty components and Meridian has nineteen.** `agent-audit-2026-08.md` §6 records "All 19 beautifui.dev components ported", which was true when written. Enumerated off the live site on 2026-08-20 there are **twenty**: Loading State · Thinking · Streaming Text · Approval Card · Tool Chips · Task Rows · Chat · Prompt Bar · Recommendation Card · Context Cards · Diff Table · Records Table · Filter Table · Sidebar Nav · Search · **Flowchart** · Insight Cards · Code Block · Fine-tune Card · Selection Actions. Every one but `Flowchart` has a Meridian file. `grep -rli flowchart src/` returns only `station-glyphs.tsx`, which is an icon, and the repo has **no graph library at all** (`reactflow`, `dagre`, `elkjs` all return nothing), so there is nothing to lean on.

It also happens to be the primitive the direction already asked for. [`../planning/initiatives/agent-first-platform.md`](../planning/initiatives/agent-first-platform.md) §6.3 specifies **the Run Map, "a canvas for watching, not authoring"**, and there is currently no component that can draw one.

**How. Port it, do not design it.** Measured off the live reference on 2026-08-20, so build to these and only deviate with a reason in the log:

- **Nodes are a fixed 300px wide**, in two heights: **58px** for a plain step and **88px** for one carrying a second line of description. Fixed width is the point; it is what keeps the connectors orthogonal and the canvas legible.
- **Connectors are SVG paths, dominant stroke `1.8px`**, with `2.4px` used for the emphasised path. 16 paths in the reference's own example. No dashes.
- **The ground is dotted**, not gridded and not plain.
- **Two node kinds in the reference example**, `Trigger` and `If / Else`, the second being a branch with labelled outgoing edges. A small **60x28** pill carries the kind.
- **Dragging and the violet ground moved to K-85**, because this item was built before that rescope existed and it built what it was given. See K-85.

**The rules from §1 apply here harder than anywhere**, because this component has no existing sibling to copy rhythm from: fixed node width, one type ladder, connectors that meet nodes at a consistent anchor rather than wherever the maths lands.

**Acceptance.**
- Renders a branching sequence of at least six nodes with at least one two-way branch, in the gallery, in both grounds.
- Node width is a single constant, and both heights derive from content rather than from a second constant.
- No raw colour; connectors and ground draw from `--mrd-*` only.
- Degrades sanely at 40 nodes and at 1 node.
- `bunx tsc --noEmit`, `bun test`, `bun run build` clean; ratchet total unchanged.

**Owns.** `src/components/meridian/Flowchart.tsx`, `src/components/meridian/__tests__/flowchart.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-85 · `Flowchart` gains dragging and a violet ground**
`STATUS: VERIFIED 2026-08-20` · deps: none · size: L · **PRIORITY: jump list, second**

**What.** Make the nodes draggable with the connectors following, and give the dotted canvas a faint violet cast in both grounds.

**Why.** Founder ruling 2026-08-20, overriding the original K-80 scope, which I had written as "a watching surface, not an editor. No drag." **He is right and my scope was wrong:** a graph you cannot rearrange is a picture, and a run map the reader cannot untangle is not a map. K-80 is `VERIFIED` and built correctly to the item as it stood; this is the rescope, filed separately rather than reopening a finished build.

**How.**

- **Port the drag from the reference's source, not from its behaviour.** K-80 established that the full TypeScript is embedded in beautifului.dev's own document -- searching that page for `FLOWCHART — an agent workflow` returns it, and `Flowchart.tsx`'s provenance note records how to re-fetch. **That source is the port target.** K-80 proved the cost of measuring the rendered page instead: six of the figures I measured that way were wrong.
- **Connectors re-route live and stay on their anchors.** `PILL_OFFSET = 30` already puts a node's top anchor 30px below its top edge; dragging must respect it or every edge detaches on the first move.
- **Still no authoring.** No creating nodes, no drawing edges, no delete. Dragging is how a reader untangles what is already there.
- **The ground takes a faint violet cast and it must not be `--mrd-you`.** That token is the orchid at 315 and it means "a person is required". A canvas background means nothing, and a background wearing a status word is the exact failure the colour law exists to stop. Use `--mrd-viz-*` or argue a new canvas token in the file, measured in both grounds so the dots stay visible on paper without the wash reading as a status.

**Acceptance.**
- A node can be dragged and every connected edge follows without detaching from its anchor.
- Dragging works in both grounds and does not fire on a keyboard-only path.
- The ground reads as faintly violet in both grounds, and no status token paints it.
- `prefers-reduced-motion` is honoured: dragging still works, it just does not animate.
- The 27 existing tests pass unmodified. If one must change, say why in the log.

**Owns.** `src/components/meridian/Flowchart.tsx`, `src/components/meridian/__tests__/flowchart.test.tsx`, `src/routes/_authenticated.meridian.tsx`
· built also with `src/styles/meridian.css` (the new `--mrd-map` token, which the item asks for and which cannot live anywhere else).

> **Rebase note, 2026-08-20 02:55. `src/styles/meridian.css` moved twice under you and you are editing it.**
>
> Announced rather than left to a conflict, per §1's rule. Your worktree is six commits behind `origin/main` and both of these are in that gap:
>
> 1. **A ground now sets `color: var(--mrd-ink)`, in both blocks** (`1c5f8946`). This is the fix for glyphs measuring **1.00 contrast on paper** -- 65 of them were painting white on white, because entering `[data-theme="light"]` re-declared every token and never re-bound the `color` property, so every `currentColor` glyph inherited the dark ground's ink. **Your Flowchart's connectors and node text read `currentColor` too**, so this is the line that makes them visible on paper; do not remove it, and do not paint around it.
> 2. **Twenty status-chip tokens** (`485a18e4`), `--mrd-{status}-chip` and `--mrd-{status}-on-chip` in both grounds, plus their `@theme inline` bindings. Additive only; nothing existing changed.
>
> Both are additions near the top of each block, so a rebase should apply cleanly. **If it conflicts, keep both sides** -- neither touches a token you would be adding for the violet canvas ground.
>
> And the standing constraint from that work still holds for your ground token: **it must not be `--mrd-you`**. That hue means "a person is required" and a canvas background means nothing.

---

**K-81 · `AgentPulse` keeps its azure and loses the brand mark**
`STATUS: VERIFIED 2026-08-20` · deps: K-09 · size: S · **PRIORITY: jump list, second**

> **REWRITTEN 2026-08-20 after Kiro's QUESTION, which was right.** The original item named `LoadingState` and every one of its four criteria was already met there: monochrome `bg-mrd-ink` cells, a 13px label over a 12px mono elapsed, and Drive/Dots/Orbit with Surfer already skipped. **The component being described was `AgentPulse`.** The original also cited a founder ruling to `DESIGN-SYSTEM.md`, where `grep -ci brand` returns 0. Full correction in the Claude log.

**What.** Remove the brand-mark option from `AgentPulse`, and bring its label onto the same type stop `LoadingState` uses. Leave its colour alone.

**Why. One thing goes, one thing explicitly stays, and the difference is the item.**

- **The brand mark goes.** Founder, 2026-08-19, verbatim: *"That circle gear icon is not good. I don't want to use that."* Ruled in the room; it needs no document behind it.
- **The azure stays.** Do not repaint the lattice in ink. The founder's complaint that "the logos are not visible in light mode" was a different defect entirely -- the light ground re-declared every token and never re-bound `color`, so glyphs inherited the dark ink and measured **1.00 contrast on paper**. That is fixed in `meridian.css`. **Measured after: the azure lattice is 7.02 on dark and 5.62 on paper.** It was never the thing that was invisible.
  - It is also the canonical use of `--mrd-agent`, which the audit counts at 59 against `--mrd-you`'s 97 and names as the imbalance to close. Taking azure off the agent indicator removes the one surface that says "a machine is working".
  - And the file's own argument is right: `LoadingState` reports a job, which has no actor; this reports an agent. In ink the two become one component with a rotating word.

**How.**

1. **Delete the `glyph="mark"` option from `AgentPulse` itself**, not just its use in the gallery. Half-applying it leaves the prop in place and the ruling unenforced, which is worse than either end.
2. **Overturn the argument in the file, in the file.** `AgentPulse.tsx`'s header claims a standing ruling that what a person watches while waiting should be the brand. **That claim is what this reverses.** Edit it in place, cite the founder and the date, or the next reader finds a file arguing against the code it contains.
3. **Label to 13px.** `AgentPulse.tsx:226` uses `text-mrd-body` at 14px where `LoadingState` uses 13px for the same job. Two indicators, one type stop.
4. **Remove the "Agent at work, two marks" gallery panel's mark cases**, since there is now one mark rather than two, and rename the section for what it shows.

**Acceptance.**
- No path renders the brand asterisk in an interaction state; the `glyph` prop no longer offers it.
- `AgentPulse` still paints `--mrd-agent`, and a test asserts it, so the next reader cannot "tidy" it to ink.
- The file's header no longer claims a ruling that has been reversed.
- Label sits on the same stop as `LoadingState`'s.
- `AgentPulse` has five callers outside the gallery; all five still render. Ratchet unchanged or lower.

**Owns.** `src/components/meridian/AgentPulse.tsx`, `src/components/meridian/__tests__/agent-pulse.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-82 · A trend chart in `InsightCards`, and permission to decline it**
`STATUS: DECLINED 2026-08-20` · deps: K-09 · size: M

> **CLOSED, not deferred.** Kiro took the permission this item offered and was right to. The chart already exists, with keyboard scrubbing and series toggles, and every acceptance criterion was already met. One criterion I wrote would have BROKEN a correct decision: I said no status token may be a series colour, but these two lines are semantic (a forecast against what happened, coloured by whether it held) rather than categorical, so semantic colour is right and the criterion was wrong. Nothing to come back to. Full reasoning in the Claude log.

> **Jumps feature work, but it is third and the order matters.** It is an addition to a tuned component rather than a primitive that is missing or wrong, so it outranks anything that merely consumes the design system and outranks nothing else. **Jumping the queue does not raise the bar for declining it** — the permission below is unchanged, and "this would degrade the card" remains the correct answer if it is the true one.

> **READ THIS BEFORE STARTING.** The founder's instruction, verbatim in substance: *"If you can add value, only touch the current insight cards. If not, don't touch and spend much time and damage the existing one. I do not want to damage the existing one. It has already gone through a lot of fine-tuning."*
>
> **So this item may be declined, and declining it is a legitimate outcome that costs you nothing.** `InsightCards.tsx` is 56KB, the largest file in Meridian, and it is already tuned. If the chart cannot be added without disturbing what is there, write that in the log with what you found and stop. A `BLOCKED` entry saying "this would degrade the card and here is the line where it breaks" is a better result than a chart that ships and makes the card worse.

**What.** Add a small multi-series trend chart to the insight card, of the shape the reference uses.

**Why.** The card today states a movement in words and numbers and never shows it. The reference pairs the same sentence with a two-series line chart, and the founder's read is that a reader relates to the shape faster than to the figure.

**The reference's version, from its own section:** headline sentence with the subject inline, then two named series side by side each with a percentage and an absolute (`Mint Chip -4.41% / -$2,377.66` beside `Pistachio +1.15% / +$617.22`), then a panel labelled "Trend snapshot" carrying two smoothed lines with a dot at each series end and a dashed extension to the axis, series toggles as small pills, and a follow-up question as a pill below. It describes itself as "scrub-ready live charts", so the line is intended to be interrogated rather than decorative.

**How, and the constraints are the interesting part.**
- **No chart library.** The repo has none and this item is not the place to add one. It is two smoothed paths in an SVG.
- **Series colour is the hard problem and it is already solved elsewhere.** Two series need two hues that are NOT status, and the status palette is five words with fixed meanings. `--mrd-viz-*` exists in `meridian.css` for exactly this, under a founder ruling that a chart series answers "which of these is which" rather than "what does this mean". Use it. A series painted `--mrd-pass` would assert an outcome.
- **It must survive the light ground**, where a thin line at mid lightness reads as grey. The status chips added on 2026-08-19 exist for the same reason; a 1.8px line is closer to a glyph than to an area, so check it in both grounds before believing it.

**Acceptance.**
- Two series render with a dot at each end, in both grounds, at a size that fits the existing card without changing the card's outer dimensions.
- No raw colour and no status token used as a series colour.
- Every existing `InsightCards` test still passes **unmodified**. If a test must change, that is the signal to stop and file `BLOCKED` instead.
- The card renders identically to today when no series data is supplied.

**Owns.** `src/components/meridian/InsightCards.tsx`, `src/components/meridian/__tests__/insight-cards.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

**K-83 · The glyphs name the wrong things, and nothing connects one step to the next**
`STATUS: VERIFIED 2026-08-20` · deps: K-09 · size: M · **PRIORITY: jump list, fourth**

**What.** Two changes to the run views, both about the same thing: a row should say what it touched, and a reader should be able to see that one row led to another.

**Why. Founder review 2026-08-20, and the invisibility half is already fixed.** The glyphs were painting `currentColor` against a `color` the light ground never re-bound, so 65 of them measured **1.00 contrast on paper**, which is white on white. That was a hole in the theme contract, it is closed in `meridian.css`, and glyph contrast now measures 15.63 on paper. **The two things below are what remains, and both are about meaning rather than visibility.**

1. **The mark does not name the thing.** "Opened the pull request" wears a generic repo glyph, and the founder's read is that it does not say GitHub. A row that names an outside system should wear that system's mark: the source host for a pull request, the test runner for a check, a globe for a web fetch, the person mark that already exists for a human gate. Where no mark exists, a letter is not the fallback -- a shape that names the *kind* is.
   - **Align it optically, not geometrically, and the measurement says which.** The glyph BOX is already centred: measured on five rendered rows, glyph centre against text centre is **0.6px**, and the gap to the label is a consistent 8px. So this is not a layout defect. What the founder is seeing is **the ink inside the 14x14 viewBox sitting off-centre**, which no amount of flexbox fixes. Centre the drawn path within its own viewBox, or give the container a deliberate optical offset with the reason in the file. Do not "fix" it by nudging the layout, which would then break every glyph whose ink IS centred.

3. **A duration in the clock column wraps to three lines.** Founder, reading the 90-character-label case: *"6 hours, 11 minutes, 0 seconds ... why is it basically three lines?"* Measured, and the cause is exact:

   - The row grid is `grid-cols-[var(--mrd-s7)_14px_1fr]`. The first column is `--mrd-s7` = **40px**, which is the width of `13:59` and is what that column is for.
   - The silence row puts `6h 11m 00s` in that same 40px column. The identical string renders **68px** wide where it has room, so at 40px it wraps to **3 lines and 52px tall**, against 17px for every clock beside it.
   - **The column is sized for a clock and is being handed a duration.** Those are different things: the clock column answers *when*, and a duration answers *how long*, which is a *what*. Either the duration moves to the content column where every other "what" lives, or the format sheds precision nobody wants at that scale -- **seconds are noise at six hours** -- but "let it wrap to three lines" is not an option, and neither is `nowrap`, which would just overflow 40px.
   - Whichever is chosen, **one silence row must not render two different ways**: the 28-minute case already puts its duration in the content column while the 6-hour case puts it in the clock column, which is the same component disagreeing with itself.
2. **Nothing connects one row to the next.** The reference draws a continuous rail through its thinking and timeline states so a sequence reads as a sequence. `RunTimeline` already has a rail for silences; extend the idea so a reader can follow a run down the page rather than reading a list of unrelated lines. Port the mechanics from the reference, do not invent them.

**Acceptance.**
- Every glyph clears 3:1 in both grounds, checked by measurement rather than by eye.
- No row wears a glyph that names something it did not touch.
- A multi-step run reads as connected, in both grounds, and survives greyscale.
- Ratchet total unchanged or lower.

**Owns.** `src/components/meridian/station-glyphs.tsx`, `src/components/meridian/RunTimeline.tsx`, `src/components/meridian/ToolStream.tsx`, `src/routes/_authenticated.meridian.tsx`
· built also with `src/components/meridian/run-rows.tsx` and its test, which is where all three parts actually live. `station-glyphs.tsx` needed no change: its seven marks measure within 0.10 of centre and both outliers were in `run-rows.tsx`.

---

**K-84 · A plan step states what it is and offers nothing to do about it**
`STATUS: VERIFIED 2026-08-20` · deps: K-09 · size: M · **PRIORITY: jump list, fifth**

**What.** Give a `PlanCard` step the two controls a person needs on it, the context to decide, and an alignment that holds.

**Why. Founder review 2026-08-20**, reading the shipped card: *"for one step, there should be a little approval button and a skip with no reason on it. There should be a little context, and the alignment needs to be properly put. It just says, 'Plan one step: open the pull request. Engineer up to the plan.' It's not properly aligned."*

Three things in that, and they compound:

1. **A step is read-only.** It states an intent and offers no way to act on it. The direction's whole argument is that the gate belongs at the plan rather than at the steps (§3.4, and the external finding that users make ~70% of planning decisions and ~20% of execution decisions). **The plan is exactly where a control belongs**, and there is none.
2. **Skipping needs a reason and the reason is the point.** A skip with no recorded why is a decision that leaves no trace, in a product whose claim is that the record can be trusted. Reason optional makes it a shrug; reason required makes it evidence.
3. **The row does not align.** The agent credit, the step text and whatever sits to the right are not on a common grid. **This is the alignment rule from §1, and `PlanCard` is measurably the best-aligned component in the set already** (5 distinct row heights against RunTimeline's 13), which is why the remaining gap is the visible one.

**How.** `Approve` already exists for a click that unblocks, and K-02 added `destructive` for one that stops. A skip is neither -- it is a `quiet` action that opens a small reason field. Do not invent a fourth face for it.

**Acceptance.**
- A step renders an approve control and a skip control, both keyboard reachable with a visible focus state.
- Skip captures a reason and will not complete without one.
- Enough context renders on the step to decide without leaving the card.
- Every row in the card sits on one grid, checked by measuring rendered geometry rather than by reading the class list.

**Owns.** `src/components/meridian/PlanCard.tsx`, `src/components/meridian/__tests__/plan-card.test.tsx`, `src/routes/_authenticated.meridian.tsx`

---

## 3. Build log

**Moved to [`ledger/`](./ledger/README.md) on 2026-08-19.** Both agents were writing this section, which guarantees conflicts. Each now appends to its own single-writer file:

- **[`ledger/kiro-log.md`](./ledger/kiro-log.md)** — Kiro only
- **[`ledger/claude-log.md`](./ledger/claude-log.md)** — Claude only

## 4. Blocked

Anything Kiro cannot proceed on. One line each: item, what is blocking, what is needed.

> **Both entries cleared 2026-08-20, and the round trip is worth recording because it worked.** Kiro
> filed K-17 and K-18 as blocked with the measurements rather than guessing; Claude ruled on both within
> the hour. **K-17 is WITHDRAWN** (a component with no home is not a defect to be fixed by finding it
> one) and **K-18 was rewritten to the defect Kiro found instead** and is now `BUILT`. Neither needed
> database access, which is the test for whether a block belongs here at all: if it turns on a judgement,
> file it and carry on.

_(empty)_

---

## 5. What Claude keeps, and why

Not a backlog — the complement of this queue, listed so Kiro knows these are covered and must not start them.

| Work | Why it cannot be built blind |
| --- | --- |
| Every migration, and applying it | Applied through Lovable; committed SQL is not applied SQL |
| Deciding how the trust score's eval leg composes | Verified 2026-08-19: `ai_evals` has `event_id` and **no `score` column at all**, only seven named dimensions. This is a product decision about what agent quality means, not a rename |
| Per-run stop with `AbortController` | Runtime behaviour; must confirm a stopped run refunds its credit draw |
| Giving all seven stations a `missionId` | Orchestration change verified by watching real runs |
| Widening or narrowing any CHECK constraint | Migration plus a production read of existing values |
| Unseeding `engineer` from 16 workspaces | Data change |
| Cleaning the incoherent `decided_at` timestamps | Data repair |
| Restarting and alarming `eval-tick` | Cron state lives in the database |
| Surfacing tick failures | Needs to know which failures are real |
| Every acceptance number in the direction doc | Production queries |
| `product_id` on `learnings` and `agent_memory` | Migration, and it needs a production read of what exists before backfilling |
| `workspace_id` on `agent_autonomy` | Migration. Autonomy is keyed per user today, so a graduated agent arrives untrusted for the next person |
| Wiring promotion through `memory_candidates` to `house_rules` | Writes, and it crosses a product boundary |
| Navigation collapse | Depends on K-17 to K-20 landing and proving out first |

---

**K-86 · The scout writes down that it failed and nothing reads the column**
`STATUS: OPEN` · deps: none · size: M

**What.** Surface the scout's per-run outcome so a workspace can see that its scout errored, or was cut short by its own daily cap, without an admin present.

**Why.** Measured 2026-08-20 while taking §10 criteria 12 and 13 (`claude-log.md`, 06:19). There are exactly two queries against `scout_runs` in the entire codebase:

```
.select("fetch_count")   // sum today's fetches, for the daily cap
.insert({ workspace_id, target_id, kind, outcome, changed,
          signal_id, snapshot_id, fetch_count, detail })
```

**The rate limiter reads one column. The other six are written every run and read by nothing.** `outcome` is an enum and two of its values are **`"error"`** and **`"skipped-cap"`**.

So a scout that is failing on every target, or silently truncated by its cap, records exactly that and shows it to nobody -- **not even an admin**, which makes it worse than criterion 12, where a tick failure at least reaches the admin health page. This is criterion 13's single remaining orphan and it is really a criterion 12 failure one level down.

**How.**

- **Read the outcome where the scout's output already appears**, rather than building a new page. Signals are what a scout produces; the natural place to say "this ran, 4 targets errored" is beside them.
- **Distinguish the three unhappy outcomes, because they need different actions.** `error` is broken and someone must look. `skipped-cap` is working correctly and the cap is too low -- **that is a settings link, not an alarm**, and painting it as a failure would be the amber/orchid confusion K-18 already found. `unchanged` is the healthy quiet case and must not shout.
- **Colour law applies.** `--mrd-you` means a person is required; a cap that truncated a run does require one, an error may not. Argue the token in the file.
- **No new table and no new column.** Everything needed is already written on every run. This item is a reader, which is the entire point of it.

**Acceptance.**
- A non-admin member of a workspace can tell, from the product, that the last scout run errored -- and separately, that it hit its cap.
- The three outcomes are visually distinct and `skipped-cap` does not read as a fault.
- No write path changes: `scout-tick.ts` is untouched except by test.
- With no `scout_runs` rows at all the surface says so plainly rather than rendering an empty shape.

**Owns.** the signals surface it lands on, plus its test. **Not** `src/routes/api/public/hooks/scout-tick.ts`, which is the writer and stays as it is.


---

**K-87 · A third of finished runs are drawn as idle, on two live surfaces**
`STATUS: OPEN` · deps: none · size: S

**What.** Give `mapRelayStatus` (`src/lib/relay.ts:26-49`) a done arm that covers every spelling
production actually writes, and a test that pins the mapping to measured values rather than to a
guessed list.

**Why.** Found by K-36, which correctly declined to widen its own diff, and confirmed against
production on 2026-08-20 (`claude-log.md`). The done arm is exactly:

```ts
case "completed":
case "done":
  return "done";
...
default:
  return "idle";
```

`agent_runs.status` over **1,825** rows holds six spellings:

| status | runs | share | maps to |
| --- | --- | --- | --- |
| `completed` | 690 | 37.8% | `done` |
| **`completed_with_failures`** | **618** | **33.9%** | **`idle`** |
| `failed` | 500 | 27.4% | `failed` |
| `halted` | 8 | 0.4% | `failed` |
| `waiting_approval` | 7 | 0.4% | `gate` |
| **`complete`** | **2** | 0.1% | **`idle`** |

**620 runs, 34.0%, are finished and drawn as idle.** And `done`, the arm the code does carry,
**occurs zero times in production** -- it handles a status nothing writes while missing one that is
a third of all runs.

**It is not latent.** `mapRelayStatus` is called at eight sites inside `relay.ts`, feeding
`miniRelay` and `stationActiveRun`; `AgentRelay` is mounted at `DiscoverSurface.tsx:1967` and
`MissionOrchestratorDetail.tsx:1324`. Both surfaces are wrong today.

**How.** `completed_with_failures` is the judgement call and it should NOT simply join the `done`
arm without a thought: a run that finished with failures is finished, but it is not a clean success,
and `RelayStatus` has no word for that today. **Decide deliberately and say why in the file** --
either it is `done` (finished is finished, and the failure belongs to the run detail rather than the
relay), or `RelayStatus` gains a sixth word. Do not invent a seventh spelling anywhere.

**Keep `done` in the arm.** It costs nothing and something may yet write it; the defect is the
absence of the other two, not its presence.

**Pin the test to the measured list.** The reason this survived is that no test enumerated what
production writes. A test that asserts `mapRelayStatus` is non-`idle` for every one of the six
measured spellings is the guard, and it is the thing that stops the seventh spelling landing quietly.

**Acceptance.**
- Every one of the six measured spellings maps to something other than `idle`.
- The `completed_with_failures` decision is argued in the file, not just made.
- A test enumerates the six and fails if any maps to `idle`.
- `bun test` covers the `complete` / `completed` / `completed_with_failures` trio explicitly.

**Owns.** `src/lib/relay.ts`, and a test file for it.

**Not owned:** `src/lib/ai/mission-advance.server.ts`, whose comment at :90-92 quotes **1,135** runs.
That figure is stale -- it is 1,825 now -- but the file is not yours for this item.


---

**K-88 · The admin pages were ported and their error state was left behind**
`STATUS: OPEN` · deps: none · size: S

**What.** Port `src/components/admin/admin-ui.tsx` off the retired vocabulary. The baseline
records four occurrences: `--text-` x2, `--madder` x1, `--raised` x1.

**Why.** The Group H admin ports (K-49, K-52 and the rest of that commit) moved
`_authenticated.admin*.tsx` and left the shared component they all render their failure state
through. **So every ported admin page now draws its error message in v1/v3 tokens inside an
otherwise-Meridian page.**

Measured 2026-08-20 in a real browser, colours resolved through a canvas:

| surface | string | paper | dark |
| --- | --- | --- | --- |
| `/admin`, `/admin/observability`, `/admin/invites` | "Could not load your admin access" | **2.79 : 1** | passes |

**AA wants 4.5. It is the lowest-contrast text on those pages and it is the error state** --
the one string somebody reads *because* something already went wrong.

**It passed unnoticed because `--madder` is tuned for the dark ground and these routes were
dark-only until the port made them theme-responsive.** The port did not introduce the token; it
removed the thing that was hiding it.

**How.** `--madder` is the retired error red. Its Meridian equivalent is `--mrd-fail`, which
`AgentScorecardPanel.tsx:187` already uses for exactly this job (`text-mrd-fail` on a "Could not
load the scorecard." string). **Use the same token so the two failure states agree.**
`--text-muted` becomes `--mrd-mute`, `--raised` becomes the Meridian elevation for the
container it sits in.

**Check it on paper, not only on dark**, because dark is where this defect hid.

**Acceptance.**
- Zero retired tokens in the file; its baseline entry disappears.
- The error string clears 4.5:1 on the paper ground, measured rather than eyeballed.
- The failure state uses the same token as the scorecard's, so two error surfaces agree.
- `bun run design:ratchet` re-frozen with the port.

**Owns.** `src/components/admin/admin-ui.tsx`.


# Group M · the three findings that were nobody's item

**Written 2026-08-21, after the queue was exhausted.** These were recorded as findings during Groups
A to L, each noticed while building something else, and none was ever written up as an item. All three
are **repo-only**, which is why they are Kiro's: a class is declared or it is not, a guard sees a file
or it does not, a component imports a retired system or it does not.

**Each finding as recorded was partly wrong, and the corrections are in the `Why` lines.** That is the
reason to write them up rather than act on the note: two of the three were filed with a blast radius the
code does not support.

**K-86 · Two heading classes that are declared in no stylesheet**
`STATUS: TODO` · deps: none · size: S
**What.** In `src/components/supaprod/Primitives.tsx`, `SurfaceHeader` (line 185) sets
`className="text-heading-26"` on its `<h1>` and `DrillHeader` (line 364) sets `className="text-heading-21"`
on its title `<div>`. **Neither class is declared anywhere.** The declared scale is
`text-heading-14/16/20/24` and `text-copy-13/14`, all six in `src/styles.css` around 2692-2751. Move the
two call sites onto the scale that exists: **26 becomes `text-heading-24`, 21 becomes `text-heading-20`.**
Then add the guard, which is the durable half.
**Why.** **A class declared nowhere is not a fallback, it is nothing**, and Tailwind's preflight resets
`h1` to inherit its size, so `SurfaceHeader`'s page title would paint at body size and `DrillHeader`'s
`<div>` title always would. **The finding as filed said "two headings paint nothing", which is true, and
implied it is visible today, which it is not:** `SurfaceHeader`, `DrillHeader`, `TabRow`, `EmptyState`,
`RiskTag`, `SubTabs` and `Cite` all have **zero importers**, measured across `src`, so nothing renders
either one. Only `MonoLabel`, `StatusBadge`, `StepDot` and `VerdictChip` are live out of that file. **So
this is a trap rather than a defect: it costs nothing until somebody gives `SurfaceHeader` the door it is
missing, and then it costs a page title.** Fix it while it is free. **Do not delete the seven doorless
exports** (AGENTS.md §6: unused is not a reason to delete, and this repo's dominant defect is a capability
reachable from nowhere).
**How.** The two renames are one line each. **The guard is the point of the item.**
`src/styles/__tests__/every-token-used-is-defined.test.ts` already proves this exact class of defect for
`var(--sp-*)`, and its own header explains why nothing else could catch it: CSS has no notion of an
undeclared name, so an unresolvable reference is the empty string rather than an error. **A utility class
behaves the same way and no guard covers it.** Extend that file, do not create a second one: collect every
`text-heading-*` and `text-copy-*` literal appearing in a `className` across `src`, collect every
`.text-heading-*` / `.text-copy-*` rule declared in `src/styles.css` **and** `src/styles/*.css`, and fail
on the difference. **Read the root sheet explicitly**, because §9's trap applies and the existing
`declaredTokens()` in that same file reads only `src/styles/` the directory. Include the load-bearing
assertion the file already models: prove the collector finds the six declared classes, so the guard cannot
pass by finding nothing.
**Acceptance.**
- No `className` in `src` names a `text-heading-*` or `text-copy-*` that no stylesheet declares.
- The new guard **fails when the defect is planted**, and the log says it was planted and seen.
- The guard reads `src/styles.css` as well as `src/styles/`, and a comment says why.
- The seven doorless exports are still exported.
- Baseline unchanged, because it tracks `--ds-`, `--text-`, `--font-pixel` and imports, not classes.
**Owns.** `src/components/supaprod/Primitives.tsx`, `src/styles/__tests__/every-token-used-is-defined.test.ts`

---

**K-87 · The ratchet cannot see the top of `src/`**
`STATUS: TODO` · deps: none · size: S
**What.** `src/__tests__/meridian-ratchet-scan.ts:68` sets `SCAN_ROOTS = ["src/components", "src/routes"]`,
so **every file directly in `src/` is invisible to the ratchet.** `src/router.tsx` carries three retired
`--text-*` uses at lines 60, 71 and 87. Replace them with Meridian and **widen the roots to cover
top-level `src` files**, so the guard meant to stop this multiplying can see where it happened.
**Why.** **The guard that exists to stop retired tokens spreading has a blind spot at the top of the tree
it is guarding**, the same shape as §9's `src/styles.css`-versus-`src/styles/` trap, one level up.
`router.tsx` is not a marginal file: it owns `RouteError`, the route-level error fallback that **mounts on
public parchment routes as well as dark ones.** **The finding as filed called it "a fifth copy of the
failure surface", and that is the part to treat carefully:** its own header states that nothing in it
animates and that this is a rule rather than an oversight, and it uses inline styles with literal fallbacks
deliberately, because it renders before the token layers load. **So do not consolidate it onto a shared
component.** The token names are the defect; the inline-style approach is a decision with a reason on the
record.
**How.** `--text-body` becomes `--mrd-body` (declared `supporting prose`), `--text-muted` becomes
`--mrd-faint` (`the quietest stop that is still AA`). **Keep every literal fallback exactly as it is**,
byte for byte: they are what actually paints before the token layers arrive, which is the whole reason they
are there. This is a raw `var()` in an inline style, so it is **not** exposed to the `text-mrd-body` utility
collision recorded against the Meridian sweep. Then add the top of `src` to `SCAN_ROOTS`. **Fix the
occurrences rather than re-freezing the baseline upward** (DESIGN-SYSTEM: never widen the baseline to pass).
Two more are in `src/server.ts:29` **inside a comment**, and the scanner strips comments before counting, so
they need nothing; confirm that rather than assuming it.
**Acceptance.**
- Zero retired tokens in `src/router.tsx`, fallbacks unchanged.
- The top of `src` is scanned, and the scanner is shown to actually read `src/router.tsx` rather than assumed to.
- `RouteError` still animates nothing.
- **Corrected 2026-08-21, after measuring.** This originally read *"and the baseline total does not rise"*, and
  the measurement falsified it: widening the roots exposes **12 pre-existing `raw-colour` occurrences**, 4 in
  `src/router.tsx` and 8 in `src/server.ts`. **All 12 are literal colours inside documents that render before
  the token layer is reachable**, and both files say so in their own comments: `router.tsx` mounts on public
  routes before token layers load, and `server.ts`'s `renderBrandedErrorPage()` is the catastrophic 500
  fallback, a standalone HTML document whose comment states the app stylesheet may not be reachable and that
  its hex values mirror the Tempo dark tokens. **So they must be recorded, not removed**, and the criterion
  was wrong rather than the code. **This is not the forbidden move.** DESIGN-SYSTEM bans widening the baseline
  *to pass*, which means adding debt and then raising the ceiling. Here no code changed and no debt was added:
  the guard's eyes changed. The 12 become visible and labelled where a reader can audit them, instead of
  invisible, and from now on a *new* retired token or raw colour in either file fails the build. **That is the
  whole value of the item.** An exemption was considered and rejected: `isExempt` is path-based, so exempting
  these two files would also blind the guard to `--ds-`, `--sp-` and every other marker in them.
**Owns.** `src/router.tsx`, `src/__tests__/meridian-ratchet-scan.ts`, `src/__tests__/meridian-ratchet.baseline.json`

---

**K-88 · The connect-moment trust dialog is still Tempo v5**
`STATUS: TODO` · deps: none · size: M
**What.** `src/components/connections/ConnectTrustDialog.tsx`, 78 lines, is built entirely from the retired
stack: `@/components/ui/dialog` and `@/components/ui/button` (shadcn) plus the Tempo v5 class
`text-copy-13`. Port it onto Meridian: `src/components/meridian/Dialog.tsx` and the Meridian control set in
`surface-parts.tsx`.
**Why.** **This is the interstitial a person reads at the exact moment they decide whether to trust us with
an account**, and it is the one surface the Engine-Room doctrine names directly: users connect their own
sources through one Connect button and never touch keys or wiring. **It is live at three call sites** in
`AccountConnectionsSection.tsx` (835, 1104, 1314), so unlike most of the retired-stack files in this queue
it is not a doorless leftover. `registry.ts:706` notes that this component renders a withdrawal string
verbatim, so the copy is load-bearing and comes from `trustCopyFor`.
**How.** **Change no copy.** Every string comes from `trustCopyFor` in `@/lib/connect-trust` or from the
provider registry, and `registry.ts:706` states the withdrawal sentence is rendered verbatim on purpose; a
port that improves the wording breaks a documented contract. Keep `ProviderLogo` as it is. The `Button`
becomes the Meridian control, and **the primary action is the one that grants access, so it is the filled
face rather than `Approve`**: orchid is spent on one meaning, a person is required to unblock stopped work,
and a dialog the user opened is not stopped work. **Look at it in both grounds**, because a trust surface
that reads wrong on paper is worse than one that reads plain.
**Acceptance.**
- Zero `@/components/ui/*` imports and zero Tempo v5 classes in the file; its baseline entry shrinks.
- Every string identical to before, `trustCopyFor` untouched.
- All three call sites still render, and the dialog opens and dismisses.
- Checked on both grounds, and the log says which was checked rather than that it looked right.
- Baseline re-frozen lower.
**Owns.** `src/components/connections/ConnectTrustDialog.tsx`, `src/__tests__/meridian-ratchet.baseline.json`

---

# Group N · the founder ruling on K-17

**K-89 · Delete `StreamingText` and `ToolChips`, and leave the argument where the code was**
`STATUS: TODO` · deps: K-17 · size: M
**What.** **Founder ruling 2026-08-21, recorded at `ledger/claude-log.md` under "K-17 · RULED · delete
both".** K-17 asked for these two to be mounted, Kiro refused, and the refusal was upheld. Delete
`src/components/meridian/StreamingText.tsx` and `src/components/meridian/ToolChips.tsx`, their gallery
cases in `src/routes/_authenticated.meridian.tsx`, and **fix every comment that names them**, in the same
commit.
**Why.** **All four grounds for the block held, and the one only production could answer held hardest.**
`StreamingText`'s `sources` input has no data source **anywhere in the product**: measured across the whole
database, 0 of 90 `prds` carry citations and the run record has no citation column at all. `ai_evals.citations`
is populated but holds a judge's citations about an evaluation, a different object from an agent's answer
sources. **So "mount it later when citations exist" was never an option that was waiting.** `ToolChips` is a
fourth view of a run where three were deliberately unified and are pinned together by
`one-run-one-rhythm.test.tsx`, and the steps ledger already renders every tool call. And the Ask pane, the
one surface with real token streaming, **has ruled against a per-word reveal in writing.**
This is the narrow case §6 allows: **broken as written**, because adopting either would need a rewrite and a
data source that does not exist. It is not the forbidden "unused, so delete" move.
**How.** **The deletion is nine files, not two, and the comments are the reason.** Nothing imports either
component outside the gallery, but **nine files reference them and the prose ones are load-bearing**:
- `src/components/meridian/ToolStream.tsx` — **four** references (23, 24, 133, 171), including a whole
  header section titled why `ToolChips` could not be this component.
- `src/components/meridian/DiffTable.tsx:306` — cross-reference to `StreamingText`'s source rows.
- `src/components/meridian/SelectionActions.tsx:52` — "Streaming belongs to StreamingText, which owns the reveal timing".
- `src/components/engine-room/AgentScorecardPanel.tsx:82-83` — **the worst one.** It explains that its chips
  are named `ToolApprovalChips` to avoid colliding with `ToolChips`. Delete the component and this justifies a
  name with no reason behind it. **Keep the rename, lose the collision:** the name is still the better one.
- `src/components/meridian/__tests__/tool-stream.test.tsx:228` — a `describe` reading "the empty state uses
  ToolChips' own words". The assertion stays; only the sentence naming a deleted component changes.
- `src/styles/meridian.css:845` and `:961` — two token-history notes naming `StreamingText`.
**Record the argument where the code was**, per the ruling: Kiro's block is the best statement of why these
two have no honest home, and it must not survive only as a log entry. **`ToolStream.tsx` is where it belongs**,
since it already carries the section explaining the distinction and is the surviving component.
**Do not** rewrite a comment into a lie by simply removing the name; say what is true afterwards.
**Acceptance.**
- Both files gone; zero references to either name anywhere in `src`, including comments and CSS.
- `ToolStream.tsx` carries the argument, in enough detail that a reader who never saw `ToolChips` understands
  why a finished-array component is not this one.
- `AgentScorecardPanel.tsx` still explains its name without citing a component that no longer exists.
- `tool-stream.test.tsx` keeps every assertion; only prose changes.
- **The baseline does not move**, and that is a check rather than a hope: neither file has a baseline entry.
- `bunx tsc --noEmit`, `bun test`, `bun run build` all clean, and the gallery route still renders.
**Owns.** `src/components/meridian/StreamingText.tsx`, `src/components/meridian/ToolChips.tsx`,
`src/routes/_authenticated.meridian.tsx`, `src/components/meridian/ToolStream.tsx`,
`src/components/meridian/DiffTable.tsx`, `src/components/meridian/SelectionActions.tsx`,
`src/components/engine-room/AgentScorecardPanel.tsx`,
`src/components/meridian/__tests__/tool-stream.test.tsx`, `src/styles/meridian.css`

---

## Related

- [`../planning/initiatives/agent-first-platform.md`](../planning/initiatives/agent-first-platform.md) — the direction this queue implements, with the evidence for every "why" above
- [`../design/DESIGN-SYSTEM.md`](../design/DESIGN-SYSTEM.md) — the Meridian contract and the ratchet
- [`../../AGENTS.md`](../../AGENTS.md) — build rules, gates, and the traps this repo has already paid for
