# Interaction C: Screen Economy and Anticipation

> _Created: 2026-07-29 · Last updated: 2026-08-03_

> Angle: the vertical axis, the fold, and the question the user has not asked yet.
> Written 2026-07-28 against the live tree. Every pixel figure below was derived from a token or a
> line of shipped code, and the derivation is shown. Nothing is estimated.
>
> Read first, as I did: `docs/planning/rebuild-2026-07/craft-law.md` (binding),
> `docs/planning/rebuild-2026-07/ia/FINAL-ia.md` (the IA contract), and all three of
> `docs/planning/rebuild-2026-07/adaptive/`. Code read: `src/lib/studio.functions.ts` (2103),
> `src/lib/prototypes.functions.ts` (188), `src/lib/design-scaffold.functions.ts` (474),
> `src/components/mission/faces.tsx` (2781), `src/components/mission/CanvasFace.tsx`,
> `src/components/mission/MissionShellView.tsx`, `src/components/mission/Spine.tsx`,
> `src/components/mission/primitives/SurfaceHeader.tsx`, `src/lib/ai/tools/registry.server.ts` (3243),
> `src/styles/ink.css`, `src/lib/briefing.functions.ts`, `src/lib/approvals-queue.functions.ts`.

---

## 0. What I own, what I hand off, and the one law

**I own** the block axis. How much of a surface a human sees before they move a finger, what they
are told about the rest, what the product knows before they ask, and the countable ceiling on how
much may compete for attention at once.

**I hand off:**

| Seam | To | What I promise | What I need back |
| --- | --- | --- | --- |
| Inline axis, region composition | `adaptive/` (A, B, C) | Every budget below is a `calc()` over their tokens. Retune the ramp and my budgets retune with it. | One shell-level custom property, `--work-h`, and the four chrome tokens resolved (§2). |
| Direct manipulation grammar | the sibling interaction angles | The manipulation layer gets zero new regions and zero new columns, and I show why that is a gift rather than a constraint (§9). | Gesture semantics and the selection model; I only rule on where they may live. |
| Words on every count, horizon, and peek | `language/` | Every scent affordance needs three words or fewer. | The nouns. I use FINAL-ia's ("Your call", "What we know", "What happened") as placeholders. |

**The one law, stated before anything else, because everything below is a consequence of it:**

> **The page never scrolls. Regions scroll. A region that scrolls says how much is below, in a
> number, before you scroll it. And no surface ever requires a scroll to reach its next action.**

---

## 1. The measurement: what a Supaprod screen actually is

### 1.1 Real shell heights, computed not guessed

The shell is `h-dvh` (`MissionShellView.tsx:255`). So the shell's block-size equals the browser's
`innerHeight`. That number is the screen minus the operating system's furniture minus the browser's
own chrome. Constants used: macOS menu bar 25, macOS Dock at default size 70, Chrome browser chrome
87 (tab strip plus omnibox, no bookmarks bar), Windows taskbar 40.

| Machine and window | Screen CSS px | Shell block-size |
| --- | --- | --- |
| 1280x800 laptop, macOS, maximized, Dock visible | 1280x800 | **618** |
| Windows 1366x768, Chrome maximized | 1366x768 | **641** |
| 1280x800, macOS, fullscreen | 1280x800 | 713 |
| MacBook Air 13" M2 (1470x956), maximized, Dock visible | 1470x956 | **774** |
| MacBook Pro 14" (1512x982), maximized, Dock visible | 1512x982 | **800** |
| MacBook Air 13", maximized, Dock hidden | 1470x956 | 844 |
| MacBook Pro 16" (1728x1117), maximized, Dock visible | 1728x1117 | 935 |
| Windows 1920x1080, Chrome maximized | 1920x1080 | **953** |
| 27" 1440p (2560x1440), macOS, maximized, Dock visible | 2560x1440 | 1258 |
| 34" ultrawide (3440x1440), same | 3440x1440 | 1258 |
| 1440-wide window at 200% browser zoom | 720x450 CSS | ~406 |

Two facts fall out and both matter.

1. **Moving to the ultrawide buys width, not height.** A 3440x1440 and a 2560x1440 present the
   identical 1258px of shell height. The founder's monitor solves the inline axis and does nothing
   at all for the block axis. Every proposal in `adaptive/` is about the inline axis. **Nobody has
   yet designed the axis that does not improve when you buy a bigger screen.** That is this
   document.
2. **The design floor is 600, not 448.** Adaptive C's H3 floor (448) is the height at which full
   chrome still fits. That is a different question from the height at which the product is good.
   Two real machines in the table land at 618 and 641. I set the contract floor at **600 CSS px of
   shell block-size** and hold the full contract there.

### 1.2 The chrome tax, derived from adaptive C's tokens

Adaptive C derives the vertical chrome from `--ink-control-*` (verified in `src/styles/ink.css:67-69`
as 32 / 36 / 40) and `--space-*` (verified `src/styles.css:2026-2030`). Resolved:

```
--topbar-h        = --ink-control-md + 2 * --space-2      = 36 + 16      = 52
--spine-h-full    = --ink-control-sm + --space-3 + --space-2 + 12        = 64
--spine-h-labeled = --ink-control-sm + --space-2                         = 40
--spine-h-numeric = --ink-control-sm                                     = 32
--strip-h         = --space-4 + (--fs-body * 1.3)         = 16 + 18      = 34
--dock-h          = --ink-control-lg + --space-3 + --space-4 = 40+12+16   = 68
```

At the 600px floor, with the composer at rest:

```
shell block-size                                600
  topbar                          52
  hairline                         1
  spine, full                     64
  hairline                         1
  WORK ROW                       378   <-- everything the product is about lives here
  hairline                         1
  working strip                   34
  hairline                         1
  composer, collapsed             68
                                 ---
                                 600
```

**The chrome tax is 222px, which is 37 percent of the floor screen.** That number is not a
complaint. Every one of those five regions is an invariant in adaptive C's §6.1 and each is
correct. It is a budget statement: the product has 378px to work in, and it has to be superb in
378px.

### 1.3 Inside the work row: the number that governs the whole rebuild

`CanvasFace.tsx:198-229` is the anatomy every face renders through. Header, optional working
triple, then one scroll container holding everything else.

```
WORK ROW                                       378
  SurfaceHeader (min-h-[52px], line 115)        52
  hairline                                       1
  face body, scrolls                           280
  hairline                                       1
  face footer                                   44   <-- proposed, §3.5; does not exist today
                                                ---
                                                378
```

> **At the contract floor, a Supaprod stage face has 280 vertical pixels.**
> **240 when anything is running.**

280px is **three 72px objects, or six 44px rows.** That is the whole first screen. It is not a
constraint to work around; it is the design. A face designed for three objects on a 1366x768
Windows laptop is a face that reads as calm on a 27" monitor. A face designed for the 27" monitor
is a wall on the laptop, and a wall is what the founder is looking at.

### 1.4 Four mechanical defects found in the live code, each a direct cause of "too much scroll"

Not opinions. Line numbers.

| # | Defect | Where | Consequence |
| --- | --- | --- | --- |
| **D1** | **The face footer is inside the scroll container.** `CanvasFace.tsx:212` wraps all `children` in one `overflow-y-auto`. Every face's `ReceiptLine` and `NextLine` live inside `children` (`faces.tsx:1330-1356` is the clearest case). | every face | **The receipt and the forward door scroll out of view.** The no-dead-end law (FINAL-ia §4.3) depends on a door that is, mechanically, below the fold. This one defect explains most of the complaint. |
| **D2** | **A scroll inside a scroll.** `SpecDoc` sets `max-h-[460px] overflow-y-auto` (`faces.tsx:682`) inside the body's `overflow-y-auto`. | Plan face | At the floor the outer body is 280 and the inner claims 460, so the inner never scrolls, the outer always does, and a wheel event lands on whichever the pointer happens to be over. This is the "which thing am I scrolling" feeling. |
| **D3** | **A fixed minimum taller than the whole body.** The prototype device frame is `min-h-[440px]` with a `min-h-[400px]` iframe (`faces.tsx:1249, 1285`). | Design face | On the surface whose entire job is to show the artifact, the artifact does not fit and must be scrolled to. |
| **D4** | **`max-h-56` on the build terminal** (`faces.tsx:1676`) plus `overflow-x-auto` diffs (`faces.tsx:1786`) inside the same scrolling body. | Build face | Three scroll axes in one region, none of them declared. |

All four are the same root cause: **no component knows how tall it is allowed to be, because no
token tells it.** Fixed in §2.

---

## 2. Reconciliation with `adaptive/`, honestly

The three adaptive proposals do not agree, and pretending otherwise would poison every number here.

| Quantity | Adaptive A | Adaptive B | Adaptive C |
| --- | --- | --- | --- |
| Column width | derived from a fluid root, no named column | `--container-col: 34rem` = **544** | `--col-ideal` = **459**, `--col-max` **518** |
| Band cap | `--shell-max`, >4096 | **2176** (4 lanes x 544) | **3159** (518+1602+518+518+3) |
| Type behaviour on a big screen | interpolates x1.0 to x1.2 | fixed, `rem` | fixed, `ch`-expressed |
| Vertical model | not addressed | two coarse thresholds at 34rem | **H0 to H3 tiers, floors 351 / 396 / 448** |

**My contract does not pick a winner and does not need to**, because it is expressed over three
named quantities rather than over any proposal's constants. What I need from whichever wins:

```css
/* Required of the winning adaptive proposal. One line each, none controversial. */
[data-shell] {
  --work-h: calc(100dvh - var(--topbar-h) - var(--spine-h) - var(--strip-h) - var(--dock-h) - 4px);
  --face-header-h: var(--ink-control-md) + 2 * var(--space-2);   /* 52 */
  --face-footer-h: calc(var(--ink-control-sm) + var(--space-3)); /* 44 */
  --face-lead-h:   calc(var(--ink-control-sm) + var(--space-2)); /* 40, the shared lead slot, §7.4 */
  --object-h:      calc(4 * var(--space-4) + var(--fs-body) * 1.3);  /* 72, a card */
  --row-h:         var(--hit-min);                                    /* 44, a row */
  --face-body-h:   calc(var(--work-h) - var(--face-header-h) - var(--face-footer-h) - var(--face-lead-h));
}
```

**Adaptive C is closest to correct on this axis** and I build on its H-tier machinery, with one
addition: C's tiers say when chrome compresses. They do not say when the *content* contract holds.
Those are different lines and both are needed.

| Line | Value | Meaning |
| --- | --- | --- |
| **Contract band** | shell block-size >= **600** | The full one-screen contract holds. Tuned, screenshotted, demoed. |
| **Degraded band** | **448 to 600** | The contract degrades along the stated fold ladder (§3.7). Every invariant present. |
| C's H2 / H1 / H0 | 448 / 396 / 351 | Chrome compression, C's machinery, unchanged. |

**One correction to adaptive C, found by running its own arithmetic on the block axis.** C's §6.2
demotion ladder is entirely inline. It has no block-axis ladder, so at 460px shell height the
product has 238px of work row and no stated answer for what leaves. §3.7 supplies it.

**One correction to FINAL-ia §2.2.** The depth rail is promised as "present on every room surface
and every workbench child, at every breakpoint, never `hidden`." Seven tiles at the 44px hit
minimum need 308px of block size. The work row is `shell - 222`. So the seven-tile rail fits only
when the shell is **at least 530px tall**. Below that the promise is arithmetically false. The
honest compression is in §3.6, and it preserves the thesis (permanent, counted, keyed) at one tile
instead of seven.

---

## 3. The one-screen contract

### 3.1 The law

> **On a shell 600px tall, at scroll position zero, with no gesture of any kind, every surface
> renders five things: what it is, what state it is in, the object it is about, the one next
> action, and an exact count of what is below. A surface missing any of the five is not done.**

The five, named, because they get referred to constantly below:

| # | Name | Rendered by |
| --- | --- | --- |
| 1 | **Identity** | `SurfaceHeader` stage marker plus title |
| 2 | **State** | `SurfaceHeader` state chip plus the agent attribution atom |
| 3 | **Subject** | at least one whole object, never a fragment of one |
| 4 | **Act** | the face footer's primary, pinned outside the scroll |
| 5 | **Horizon** | the count strip at the scroll container's bottom edge |

### 3.2 The rule that decides what goes above

Two rules, applied in order. They are short because a rule a designer cannot hold in their head at
2am is not a rule.

> **Rule 1, the Judgment Test.** A pixel earns a place above the fold if a competent user cannot
> make the next decision without it. Everything else goes below. There is no third category.
> "Useful to have up top" is exactly how a surface becomes a wall.

> **Rule 2, the Recurrence Rule.** When two things both pass Rule 1 and only one fits, the one seen
> **less** often goes above.

Rule 2 is counter-intuitive and it is the important one. Frequency builds memory. A daily user
already knows where the artifact title is and can find it with a saccade; they have never seen this
particular precedent warning and will not go looking for it. This is why a one-time warning outranks
a permanent label, why the gate outranks the artifact, and why the fourth journey card is a better
thing to lose than the first foresight line.

### 3.3 The never-above list

Written down because it is the half nobody writes, and it is where screens actually go wrong.

1. Anything with a zero count that has never had content in this workspace. (Its invitation lives
   in the expanded rail, per FINAL-ia's zero-count law. It does not get canvas.)
2. Any control that only becomes relevant after the primary action has been taken.
3. Any explanation of a thing that is itself visible on the same screen.
4. Any second rendering of a number already on screen. One count, one source, one place.
5. Decoration of any kind, including the drawn return edge on the Spine, which is the first thing
   adaptive C demotes and is correctly first.

### 3.4 The never-below list

1. The surface's primary action.
2. An open gate's claim, its evidence line, and both of its buttons. (Adaptive C invariant I1.)
3. The cancel of any destructive confirmation.
4. Any state that would change the meaning of the primary action. Concretely: if CI is red,
   `CiStrip` (`faces.tsx:1593`) is above `Approve`, never below it. Approving a change whose failing
   check is off-screen is a product defect, not a layout preference.
5. The horizon count itself.

### 3.5 The structural fix: `CanvasFace` gains a footer and loses the nested scroll

D1 is fixed by one change to the one component every face renders through.

```tsx
// src/components/mission/CanvasFace.tsx  (proposed anatomy)
<div data-face className="grid min-h-0 flex-1"
     style={{ gridTemplateRows: "var(--face-header-h) auto minmax(0,1fr) auto" }}>
  <SurfaceHeader ... />
  <FaceLead lead={working ?? foresight ?? null} />        {/* one shared 40px slot, §7.4 */}
  <div data-face-body data-scroll-type={scrollType}>{children}</div>
  <FaceFooter receipt={receipt} primary={primary} doors={doors} />   {/* never scrolls */}
</div>
```

`CanvasFaceProps` gains `receipt: ReceiptLineProps`, `primary: { label: string; onAct(): void }`,
`doors: JourneyDoor[]`, `scrollType: ScrollType`. `primary` and `scrollType` are **required**, and
that is the point: a face that cannot name its one next action does not compile.

D2, D3 and D4 are fixed by one lint rule, because they are one mistake: `no-fixed-block-size` fails
any `max-h-[...]`, `min-h-[...]`, `maxHeight` or `minHeight` inside `[data-face-body]` that is not
a `calc()` over `--face-body-h`. A child that wants the body's height asks for `100%`; a child that
wants to scroll declares a scroll type and inherits.

### 3.6 The composite first screen of the room

At 600x1366, at rest, before any gesture, the room shows exactly nine things. Nine is deliberately
at the edge of what a person can take in without triage. The tenth thing is why the previous
versions felt overwhelming, and every one of the nine has exactly one rendering.

| # | Thing | Region | Cost |
| --- | --- | --- | --- |
| 1 | Where the product is in its loop | Spine, 7 stages with per-stage state | 64 |
| 2 | What the machine is doing right now | WorkingStrip, one line | 34 |
| 3 | What waits on you | the ember, one count | 0, inside 1 and 7 |
| 4 | What this surface is and its state | SurfaceHeader | 52 |
| 5 | The object under work | first face object, whole | 72 |
| 6 | The one next action | face footer | 44 |
| 7 | What is behind each door | depth rail, 7 counted tiles | 0 block, 44 inline |
| 8 | Where to say something | composer | 68 |
| 9 | What the crew just did | Thread, top card, at least its first line | 0 block, 343 inline |

**The rail correction, resolved.** The rail needs 308px of block size and the work row at the floor
is 378. It fits, with 70px spare. Between 448 and 530 it does not fit, and the honest compression
is:

| Shell height | Rail |
| --- | --- |
| >= 530 | seven 44px tiles, each with icon and delta count |
| 448 to 530 | **one 44px tile** carrying the summed delta and a ring segmented into seven arcs, one per tile, each arc lit in proportion to its own delta. Click or `⌥D` opens a 7-row menu with the full scent triple on every row. |
| < 448 | the same single tile, moved into the composer's overflow, per adaptive C's H0 sheet behaviour |

The compressed tile keeps all four disclosure conditions from §6.2: it is named, counted, keyed, and
addressable (`?pane=` unchanged). It loses per-tile resolution at rest, which is the honest price,
and the arc ring gives back most of it without a number.

### 3.7 The fold ladder: what falls first as height shrinks

The block-axis analogue of adaptive C's §6.2, ordered by the same principle (distance from the
gate), and it is the thing C is missing.

| # | What gives | How | Recovered by |
| --- | --- | --- | --- |
| 1 | Spine return edge and the `Starts from:` caps | hidden (already C's step 1) | nothing lost, it is ornament |
| 2 | The face's third object | falls below the fold | the horizon count, one flick |
| 3 | The face's second object | falls below the fold | same |
| 4 | The foresight line collapses into a **mark on the object it warns about** | 40 to 0 | hovering or focusing the marked object peeks the full sentence |
| 5 | The working triple's `Reading now` chips | hidden | the WorkingStrip still carries the live verb (invariant I3) |
| 6 | The working triple's plan | becomes `4/7` in the lead slot | the mission workbench child |
| 7 | The Spine goes labeled, then numeric | C's H2, then H1 | the popover on the Spine, `1` to `7` still work |
| 8 | The strip merges into the composer's top line | C's H1 | invariant I3 preserved at its floor |
| 9 | The rail compresses to one tile | §3.6 | the 7-row menu |
| 10 | The face footer's `ReceiptLine` collapses to its mono id | 44 stays, content halves | the kebab |
| **STOP** | | | |

At the stop, at 448px of shell, what remains is: identity, one whole object, the primary action, the
horizon, the composer, the live verb, the loop position, and one counted door. **Eight things, and it
is still the product.** That is the honest floor and it should be screenshotted so nobody has to
imagine it.

### 3.8 The per-surface contract

`ABOVE` = renders whole at the 600 floor without scrolling. `HORIZON` = the exact count shown at the
fold. `BELOW` = reachable by scroll or a door. Every `PRIMARY` is pinned in the face footer and never
scrolls.

**The seven stage faces** (component names are real: `faces.tsx` exports `EvidenceFace`,
`DecisionFace`, `SpecFace`, `PrototypeFace`, `CodeFace`, `ShipFace`, `GrowthFace`).

| Face | ABOVE (3 objects at the floor) | PRIMARY | HORIZON | BELOW | Scroll type |
| --- | --- | --- | --- | --- | --- |
| **01 Discover** `EvidenceFace` | the three top-ranked themes, each with its evidence count chip and its one-line why | `Rank these into bets` | `+9 more signals` | raw signal rows, the watch strip's sources, the recordings lane | T1 |
| **02 Decide** `DecisionFace` | the top bet with its Critic verdict and ICE bars; the precedent card beneath it; the second bet, clipped | the gate's `Keep it` / `Kill it` pair | `+4 more bets` | the rest of the queue, teardown detail, fanout branches | T1 |
| **03 Plan** `SpecFace` | the spec title, its outcome contract (3 lines), the first section heading | `Approve the spec` | `9 sections, 2 unread` | the whole document | **T2** |
| **04 Design** `PrototypeFace` | the device frame filling the entire body | `Approve the design` | none: the artifact does not have a below | the version trail, the critic notes rail | **T0 face, artifact scrolls inside itself** |
| **05 Build** `CodeFace` | the plan line (`4/7`), the changeset card with its three highest-risk files, `CiStrip` | `Approve the changeset` | `+11 files` | the diff, the terminal, other builds | T1 face, **T4** diff |
| **06 Ship** `ShipFace` | the promotion gate card, three lines of release notes, the armed outcome date | `Promote to production` | `+2 announcements` | the full launch kit, changelog history | T1 |
| **07 Learn** `GrowthFace` | the outcome form with the spec's assumptions pre-filled, the impact line | `Record how it landed` | `+3 learnings` | the impact ledger, support signal | T1 |

**A note on 04 Design, because it is the surface the founder pointed at.** The face has one object
and that object is the artifact. Everything else about the surface (states, version trail, critic
notes) is either chrome on the frame or lives in the annotation rail, which is inline, not block. At
the floor the artifact gets 280px of glass, which is small. The answer is not a taller minimum
(D3). The answer is **Stage mode** (§3.9), which is the only gesture in the product that changes the
chrome budget, and it exists only for artifact surfaces.

**The five workbench children.**

| Child | ABOVE | PRIMARY | HORIZON | Scroll type |
| --- | --- | --- | --- | --- |
| `spec/$id` | title, outcome contract, current section heading, the citation chips on the visible claims | `Approve the spec` | a **section rail** on the region's right edge with per-section read state, not a page count | **T2** |
| `mission/$id` | the live step with its honest time, the changeset summary, `CiStrip` | the open gate, or `Open the PR` | `+11 files`, `+38 steps` | T1, tab bodies vary |
| `trace/$id` | the current step centred in the list, one step of context each side | `Replay from here` | `step 14 of 38` | **T3, opens centred on the current step, never at the top** |
| `prototype/$id` | the artifact, full body, Stage mode on by default | `Approve the design` | none | T0 |
| `map` | the graph, full body, no scroll at all: pan and zoom | `Focus this node` | node count in the corner | **T0** |

**The seven depth panes.** A pane is 420px inline over the canvas and takes the full work row: 378 at
the floor. Header 44, search or filter row 44, so **290px of rows, which is six 44px rows whole plus
the horizon.**

| Pane | Landing shows at the floor | Horizon |
| --- | --- | --- |
| Your call (`?gate=open`) | the oldest gate whole (claim, evidence, precedent, both buttons: 186px), the next gate clipped | `+3 waiting` |
| What we know (`?pane=brain`) | **three beliefs** (a belief row is 88px: claim, confidence, what it changed) | `+14 beliefs, 3 expire in 6 days` |
| What happened | six receipt rows | `+120 since Tuesday` |
| What we made | six artifact rows | `+31` |
| What we said | six thread rows | `+18` |
| Who is working | six crew rows, the working ones first | `+7 idle` |
| How it is running | the one room on watch, whole, then the other two as summary rows | `2 rooms quiet` |

**First light, and a correction to FINAL-ia §3.2.** The IA promises "the seven journey cards, full
size. Not chips in a popover." At the floor, seven 72px cards need 504px and the body has 280. So the
promise is false at 600px of shell. The honest version, and it is better:

> First light shows **three journey cards whole and a horizon reading "+4 more ways in".** The three
> are not the first three in the array. They are **J1 (what should we build next), J3 (just write the
> PRD), J4 (build this feature)**, because those are the three the founder named as the real doors
> and because `FULL_LOOP_CHAIN` (`journeys.ts:201`) puts them first, third and fifth in the chain. At
> shell heights of 950 and up, all seven render. The count in the horizon is exact and the deep link
> is the same either way.

**The config overlay.** Full-screen scrim, so 600 minus a 52px overlay header equals 548. Five group
rows plus the active group's sections (at most four) is nine rows at 32px, which is 288. FINAL-ia's
two-click claim survives at the floor, as long as the overlay renders **one group's sections at a
time**, which `?config=<group>&section=<id>` already implies. No correction needed, but the
arithmetic should be in the test.

**The Thread column.** 343 to 380 inline, 378 block at the floor. A briefing card is 112, a gate card
132, one exchange 88. Three cards plus two 24px gaps is 356. It fits, barely.

> **The Thread's rule: at most three cards above the fold, and a gate card always displaces the
> oldest.** A gate is never below the fold in the Thread, in any state, at any height. This is
> invariant I1 expressed on the block axis.

### 3.9 Stage mode: the one sanctioned exception

`F`, or the frame's expand affordance. Available **only** on surfaces whose subject is a rendered
artifact: Design face, prototype child, map child, and the diff in canvas focus.

What it does, exactly: Spine goes numeric (64 to 32), the WorkingStrip merges into the composer's top
line (34 to 0), and the face lead slot is suppressed (40 to 0). **It buys 106 block pixels**, taking
the artifact from 280 to 386 at the floor, and it is combined with adaptive C's `⌘.` canvas focus,
which peels the Thread and gives the artifact the full inline width.

What it costs, stated so the trade is visible: you lose the Spine's stage labels (recoverable by
looking at the numbers, or `1` to `7`, or the Spine popover) and the strip's per-agent detail
(recoverable from the merged line's count). You do not lose the ember, the composer, or any
invariant.

It lives in the URL as `?stage_mode=1`, so a demo is recorded by pinning a param rather than by
resizing a window, which is the same principle adaptive C applies to `?focus=`.

**It is offered exactly once**, as a quiet line in the Design face footer the first time the artifact
is taller than the body: `Press F to give this the screen.` It never asks again. A product that
nags about its own affordances has admitted they are not discoverable.

---

## 4. The scroll typology

Every scrolling region declares its type in `data-scroll-type`. An undeclared one fails CI. This
exists because the four defects in §1.4 all come from regions that scroll without anyone having
decided what kind of scrolling they are.

| Type | Definition | Contract | Where |
| --- | --- | --- | --- |
| **T0 None** | fits at the floor, always | never scrolls, at any height, ever. If it would, it recomposes instead. | the gate card, the composer, the Spine, every face footer, the map, the prototype face |
| **T1 One reach** | at most two screens; the end is one flick away | the horizon carries an **exact** count; the end carries a terminal line, never a blank stop | every stage face body, every pane landing |
| **T2 Document** | a bounded artifact read top to bottom | a **section rail** on the region's right edge (not the page's) with a mark per section and per-section read state; the primary action stays pinned; position persists per artifact | the spec doc, release notes, a transcript |
| **T3 Ledger** | unbounded, reverse chronological, paged | never auto-loads more than two pages; a dated separator every day; a pinned `Jump to now` once you are more than one screen back | receipts, traces, threads, memory rows |
| **T4 Code** | scrolls on both axes, inside itself | `data-scroll="x"` per adaptive C; the page never scrolls horizontally; a **gutter minimap** carries one mark per hunk with its risk colour | diffs, terminal output, wide tables |

**T2's section rail is the answer to the founder's "too much scroll" on documents.** A spec is
genuinely long and shortening it would be a lie. What is fixable is not knowing where you are in it,
how much is left, and which parts you have not read. The rail is 4px wide, costs nothing on either
axis, and answers all three. Sections you have scrolled through render solid; sections you have not
reached render as a hollow tick. The dot for the section containing the currently disputed claim
renders in the ember.

**T3's rule about not auto-loading** is a screen-economy rule, not a performance one. Infinite scroll
destroys the horizon: if the count is unknowable the scent is gone, and the user is reduced to
guessing. Two pages, then a counted `Show 50 more`.

---

## 5. Information scent

Three questions a user has, constantly, and never asks out loud. Answering all three is the whole
job. **Nothing may be discovered only by chance** is the acceptance criterion.

### 5.1 What is BELOW: the horizon

Every T1, T2, T3 and T4 region carries a **horizon**: a 24px strip pinned to the bottom edge of the
scroll container, inside it, holding a mono count and its noun.

```
+9 more signals
```

Rules, each of which exists because its absence is a specific failure I have watched happen:

1. **The count is exact, or it says it is not.** `+9 more signals`, or, while streaming,
   `more loading`. A rounded count (`9+`) is a guess wearing a number's clothes.
2. **The noun is always present.** `+9` alone forces the user to look up to remember what they are
   counting.
3. **It disappears at scroll end** and is replaced by the region's terminal line, which is the
   surface's own words, never `No more items`.
4. **It never overlaps content.** It is a grid row of the scroll container, not an absolutely
   positioned scrim. A gradient fade over text is decoration that makes the last line unreadable.
5. **Scrollbars are visible in the work row, never overlay.** This is a real, opinionated decision
   and most teams get it wrong. The scrollbar thumb is the single best proportional indicator of how
   much is below, and macOS overlay scrollbars hide it until you are already scrolling, which is
   after the moment it was useful. `scrollbar-gutter: stable` (adaptive B §5.6) already reserves the
   space, so making it visible costs nothing that has not already been paid.

**The horizon costs 24px out of 280.** It is worth it because it converts an unknown into a number,
and a number is the difference between scent and a guess.

### 5.2 What is BEHIND: the scent triple, and the delta

Every door in the product carries three facts, and two of three is not enough.

> **noun, count, age.** What is in there, how much of it, and how fresh.

A count without freshness is unreadable (`3 receipts` since when?). Freshness without a count is
anxiety. The noun alone is the 10-rail failure that FINAL-ia correctly diagnoses.

**The delta rule, which is my addition to FINAL-ia's counted-tile thesis.** A count is only scent if
it changes. `12 receipts` is inventory. `4 new` is scent. Both render, in two weights:

```
collapsed rail tile        expanded rail (240px)
┌────┐
│ ◈  │                     Your call        3 new · 7 total · 4m
│ 3  │                     What we know     2 new · 41 · 1h
└────┘                     What happened    4 new · 128 · 4m
```

The ember-weight number is the delta since your last look at that tile. The neutral number is the
total. Backing this needs one new table and one batched read, which is also FINAL-ia's own mitigation
for its risk R1:

```sql
create table rail_marks (
  user_id uuid not null,
  workspace_id uuid not null,
  tile text not null,               -- 'gate' | 'brain' | 'record' | 'made' | 'threads' | 'crew' | 'engine'
  seen_at timestamptz not null default now(),
  primary key (user_id, workspace_id, tile)
);
```

```ts
// src/lib/rail-counts.functions.ts  (new, one query key, 60s stale)
export const getRailCounts = createServerFn({ method: "GET" })
// returns Record<TileId, { total: number; sinceSeen: number; lastEventAt: string | null }>
```

`sinceSeen` is what the tile shows. A tile is marked seen when its pane has been open and focused for
600ms, not on click, so a mis-click does not silently destroy your unread state.

**The expansion law.** Hovering or focusing the rail expands it to 240px. **Expansion adds words,
never numbers.** If expansion revealed a fact the collapsed state did not carry, the collapsed state
was lying, and the user learns not to trust it. Expansion reveals the label and the age; it never
reveals a new count.

### 5.3 What is INSIDE: the peek, with real timings

Three levels, and the level between "read the label" and "commit to opening" is the one every
previous version of this product skipped. Its absence is why counted doors still do not get opened:
without a peek, every open is a gamble on whether it was worth losing your place.

| Level | Gesture | What renders | Fetches? | URL |
| --- | --- | --- | --- | --- |
| **0 Trace** | none, at rest | noun, count, age | no | no |
| **1 Peek** | 180ms hover hold, or `Space` on a focused row | a 320px card anchored to the row: the first three facts and the receipt | **never** | no |
| **1.5 Consequence** | hover an irreversible button | one sentence stating what will change, from real data | no | no |
| **2 Open** | click, or the door's letter key | the surface | yes | `?pane=` |
| **3 Row** | click a row, or `Enter` | an in-place peel | maybe | `&item=` |
| **4 Work** | `O`, or the row's Open affordance | the workbench child | yes | child route |

**The 180ms hold is not a round number picked for tidiness.** Below roughly 150ms peeks fire on
pointer pass-through and the screen strobes as you move the mouse across a list. Above roughly 250ms
the user has already clicked and the peek arrives as an annoyance behind the thing they opened.
180ms, with a 60ms fade in on `--ease` and no fade out, is where it feels like the interface
anticipated you rather than lagged you.

**Peek sessions.** Once one peek has opened, the next is instant, until 400ms passes with no peek
target under the pointer. This is exactly how a native menu bar behaves and it is the detail that
separates something a person tuned from something a machine generated. It costs about fifteen lines
in one hook.

**A peek never fetches.** It renders only from data the list already has. If the list does not carry
enough to peek, the answer is to widen the list query by three fields, not to add a spinner. A peek
that spins is worse than no peek, because it teaches the user that pointing at things costs time.

**Level 1.5, the consequence line, is "a peek before commit".** It is not a tooltip explaining what
a button is. It is a statement of what will happen, built from real data:

| Button | Consequence line | Source |
| --- | --- | --- |
| `Approve the changeset` | `Opens PR on relay/main. 7 files, 2 outside your touch list.` | `getChangesetDiff`, `enforceTouchList` policy report |
| `Send it back` | `Returns to Engineer with your note. The branch stays; nothing is lost.` | `sendBackApprovalItem` |
| `Promote to production` | `Live for everyone. Last time you skipped the canary it cost 2 days.` | `promoteToProduction` plus the Brain's belief row |
| `Kill it` | `Records the decision with your reason. The evidence chain stays readable.` | `decideApprovalItem` |
| `Approve the design` | `Build inherits this mockup. Design parity is checked against it.` | `decideDesignGate`, `checkDesignParity` |

**No confirmation dialog exists for anything whose consequence line is accurate and whose action is
reversible.** The consequence line replaces the dialog. That is a real saving: a dialog costs the
entire screen, momentarily, and it costs the user their place.

### 5.4 The scent ledger

Every navigable target in the product appears in one table, and `scent.test.ts` walks it.

| Target class | Level 0 trace | Peek | Count | Age |
| --- | --- | --- | --- | --- |
| rail tile | 44px tile, always | yes, 7-row summary | delta and total | yes |
| Spine stage | numbered node with per-stage state | yes, that stage's receipts | gate count when nonzero | last event |
| face object row | the row itself | yes | its own children count | its receipt |
| thread card | the card | no, it is already the content | n/a | its timestamp |
| journey card | the card, or the horizon count | yes, the journey's `startState` | steps | n/a |
| workbench child door | quiet `Open` on the row | yes | n/a | last touched |
| config section | the group row | no | changed-recently pip | n/a |
| a `?focus=` peel | the mono chip (`SPEC-52`) | **yes, and this is the important one** | n/a | n/a |

The last row matters most. FINAL-ia's link grammar says a trace link is a mono chip that peels open.
**Every mono chip peeks on hold**, so a user can read what `SIG-204` is without opening anything.
That single behaviour is what makes the chain grammar usable rather than a set of dares.

---

## 6. Progressive disclosure that is not hiding

### 6.1 The two failures, named precisely

**The 10-rail was overwhelming** because everything sat at level 0 and therefore nothing had rank.
Ten equally weighted doors is not ten choices, it is one hard choice repeated ten times. And per
FINAL-ia §2.2, `nav-model.ts`'s ten rows carried no counts at all, so they were simultaneously
crowded and silent.

**The 2026-07-18 rebuild read as empty** because depth moved to level 2 behind a palette while
leaving no level-0 trace. The mechanism was `hidden sm:flex` recessed doors with no count, no key
and no URL. A capability with no trace does not exist, regardless of how few keystrokes reach it.

Both failures are the same error in opposite directions: **treating disclosure as a question about
how many clicks, when it is a question about what remains visible at rest.**

### 6.2 The line, as a law

> **Depth may move down a level. It may never lose its level-0 trace.**
> Disclosure changes how much of a thing you see. Hiding removes the evidence that it exists.

A disclosure is legitimate only if it satisfies **all six** conditions. Four are FINAL-ia's, restated
because they are correct. Two are mine and they are the ones the last rebuild lacked.

| # | Condition | Failure it prevents |
| --- | --- | --- |
| 1 | **Named** at rest, in the user's own words, never an icon alone and never `More` | the unlabelled kebab |
| 2 | **Counted** at rest, with a delta | the silent rail row |
| 3 | **Keyed**, reachable without hunting with a pointer | the mouse-only door |
| 4 | **Addressable**, opening it changes the URL | the state you cannot send to a colleague |
| 5 | **Reversible in one gesture.** `Escape` returns exactly, nothing lost, scroll and drafts intact | the door people stop opening because it costs their place |
| 6 | **Cheap to peek.** A level-1 answer exists between reading the label and committing to open | the door people stop opening because opening is a gamble |

Conditions 5 and 6 are the difference between a product where people explore and one where they
learn a single path and never leave it. The 10-rail had rows with neither. The palette rebuild had
neither. **This is the actual line, and it is not about depth at all: a thing three levels down that
is named, counted, keyed, addressable, reversible and peekable is more present than a thing one
level down that is none of those.**

### 6.3 The ladder, with its pixel cost

| Level | Block cost | Inline cost | Reflows? |
| --- | --- | --- | --- |
| 0 Trace | 44 for a tile, 0 for a chip or a count on something already drawn | 44 rail | no |
| 1 Peek | **0** | 0, it overlays | **no, ever** |
| 1.5 Consequence | **0** | 0 | no |
| 2 Open pane | 0, it takes the work row it is given | 420 over the canvas | no, the canvas is not resized |
| 3 Row peel | grows the row in place | 0 | **yes, in place only**, and the row scrolls itself into view |
| 4 Workbench child | the whole work row | the whole canvas | it is a route |

**Hard cap: four levels from the room.** Room, child, tab, row peel. Compatible with FINAL-ia §6.4.
No level 5 exists, and `no-fifth-level.test.ts` fails when a peel opens a peel.

**Levels 1 and 1.5 must not reflow.** This is a screen-economy rule with teeth: if a peek pushed
content, then hovering a list would move the list, and pointing at things would become dangerous.
Peeks are overlays with `position: fixed` anchored by a floating-element strategy, and they are
allowed to escape the pane's container. That is the one sanctioned escape from adaptive B's
containment model, and it needs `[data-popover-body]` to declare its own container, which adaptive B
§5.1 already does.

### 6.4 The anti-hiding test

```ts
// e2e/disclosure.spec.ts
// For every capability in surface-registry.ts, at 1366x600 (contract floor), at rest,
// with no gesture: assert a level-0 trace is present, visible, has an accessible name,
// carries a count element, and has a keyboard route in the key table.
// A capability whose only trace requires opening something FAILS.
```

That single test would have failed the 2026-07-18 rebuild on day one.

---

## 7. Anticipation: the answer is already on the screen

The founder's sentence is the specification: *"even before you feel 'I should know information about
this, where should I look', it needs to be there."*

That is not a feature. It is an ordering constraint. It means the answer is **rendered at rest, at
rest weight, in the place the eye will land**, before the question forms. Not fetched on demand, not
announced, not popped.

### 7.1 The three laws

> **A1. The answer arrives before the question, as a quiet fact, never as an interruption.**
> The product gets **one** interruption per session, and it is spent on the repeat-mistake warning
> (FINAL-ia §5.7: "you shipped something like this in March; here is how it landed"). Everything else
> is already drawn.

> **A2. Anticipation is pre-render, not pre-fetch.** The precedent, the citation, the parity check
> and the scaffold are computed before they are wanted and are sitting in the data the surface
> already loads. `prepareScaffoldSpeculative` (`design-scaffold.functions.ts:294`) is the existing
> proof of this pattern in the codebase: fire and forget, never awaited, idempotent upsert, never
> throws into its caller. **Generalise it as the named pattern `speculative prep`** and apply it to
> precedent lookup, design parity, and citation resolution.

> **A3. An anticipated answer must be layout-neutral.** It is resolved in the same query pass as the
> surface's own data, so it is present at first paint or it is never present. **Nothing may be
> injected after paint.** An anticipation that arrives late and pushes the primary action below the
> fold has done more harm than the question it answered.

A3 is where anticipation meets screen economy, and it is the reason most "smart" interfaces feel
chaotic: they know things, and they tell you at the wrong moment, and the layout jumps.

### 7.2 The next-question table

Each row: the moment, the specific question forming, where the answer already is, and the real source.

| Moment | The question | Where the answer already sits | Source |
| --- | --- | --- | --- |
| First frame after sign-in | *What happened while I was gone?* | the rail deltas and the Thread's briefing card, both painted before you focus anything | `getRailCounts`, `getBriefing` (`briefing.functions.ts:249`) |
| Scanning a bet in Decide | *Have we tried this before?* | the precedent card under the bet, at rest, not behind a click | `PrecedentNudge`, `decision-precedent.functions` |
| Reading a spec | *What did I not read?* | the T2 section rail: hollow ticks for sections you never reached | scroll tracking on the doc region |
| Hovering `Approve the spec` | *What am I actually agreeing to?* | the consequence line: assumptions that go on watch, with their dates | `decisions.functions` assumption rows |
| A build is running | *How long, and can I leave?* | the lead slot's `4/7` plus the WorkingStrip's honest time | `getStudioSession().steps` |
| A build went green | *What actually changed?* | the file list is already open, **ranked by risk, not alphabetically** | `getStudioSession().changes`, `enforceTouchList` policy |
| Staring at a diff | *Which hunk is the risky one?* | the gutter minimap mark, ember where a hunk touches a file outside the touch list | `studio_changeset_constraints`, `applyHunkSelection` |
| Prototype rendered | *Is this on brand?* | the critic's verdict is already **three pins on the artifact**, not a panel beside it | `runScaffoldDesignCritic`, `design-memory.functions` |
| A gate is open | *What happens if I say no?* | the `Send it back` consequence line | `sendBackApprovalItem` |
| Just shipped | *When will I know if it worked?* | the armed date in the Ship footer and repeated in the Thread handoff | the outcome check arm date |
| An error | *Is this me or them?* | the blocked `ReceiptLine` names the actor and the recovery verb | `CanvasFace` error slot, already correct |
| Opening any pane | *Is there anything new in here?* | the delta count told you before you opened it | `getRailCounts` |
| Typing in the composer | *Does this fight something we decided?* | the contradiction warning, inline, while typing | `contradiction-auditor.functions`, `SharedPremiseNudge` |
| A run failed | *Do I have to start over?* | the terminal state's door is `Try again with what we learned`, prefilled | FINAL-ia §4.3 terminal register |
| Hovering any mono chip | *What is `SIG-204`?* | the level-1 peek | §5.3 |

### 7.3 What anticipation is not

- Not a suggestion carousel. Not "you might also like".
- Not a proactive modal. There is one interruption and it has a job.
- Not a prediction of the next click. Predicting a click and pre-drawing a wrong answer costs more
  attention than it saves.
- Not a chatbot volunteering. The crew speaks in the Thread, in receipts, in past tense.

### 7.4 The lead slot: one 40px line, shared, with a stated priority

Anticipation needs somewhere to render that cannot damage the layout. So: **one slot, 40px, directly
under the `SurfaceHeader`, shared by three claimants with a fixed priority.**

| Priority | Claimant | Example |
| --- | --- | --- |
| 1 | **Working** (a run is live on this stage) | `4/7 · Engineer is writing tests · 40s` |
| 2 | **Foresight** (the Brain has something you need before you act) | `You shipped something like this in March. It moved retention 0.4 points.` |
| 3 | **empty** | the slot collapses to 0 and the body gains 40px |

Only one may render. Working beats foresight because a live machine outranks a memory, and the
foresight demotes to a **mark on the object it concerns** (fold ladder step 4), where it peeks.

This resolves the cost problem honestly: **anticipation is paid for out of the object budget, not out
of a permanent reservation.** When a foresight line is present, the third object falls below the
fold. That is the Recurrence Rule applied: a one-time warning outranks a third row you have seen
before. Say it out loud rather than pretending it is free.

The working triple's current three-part rendering (`CanvasFace.tsx:129-165`) survives intact at
shell heights of 700 and above, and compresses into this one line below that. Same component, two
presentations, chosen by `--work-h`, never remounted.

---

## 8. The overwhelm budget

Countable, so it can be enforced. Each number has a reason, and the reason is not taste.

| # | Budget | Limit | Why this number |
| --- | --- | --- | --- |
| 1 | Primary actions per screen | **1** | Already the repo's law. Two primaries is no primary. |
| 2 | Secondary actions visible at once | **3** | One primary plus three secondaries is four choices, the top of comfortable choice without triage. The fourth goes in the kebab. |
| 3 | Whole objects above the fold, per face | **3** | Derived: 280px body / 72px object at the 600 floor. Not a preference. |
| 4 | Whole rows above the fold, per pane | **6** | Derived: 290px pane body / 44px row. |
| 5 | Cards above the fold in the Thread | **3** | Derived: 378px / (112 + 132 + 88 + gaps). |
| 6 | Attention hues on one screen | **2** | Ember means "needs you". Machine blue means "working". Anything a third colour would say is already said by position or by type. |
| 7 | Verdict hues on one screen | **1** | Pass green and fail red never appear together at the same rank. A red check outranks and suppresses green siblings, because you are only going to act on the red one. |
| 8 | Simultaneous live regions (things that change without you) | **2** | One locus (the WorkingStrip) plus one stream (whatever you chose to watch). A third is measured as noise, and a user cannot attend to three changing regions without losing the one they care about. |
| 9 | `aria-live` regions mounted | **2** | Same limit, same reason, and a screen reader user suffers a third one worse than anyone. |
| 10 | Numbers on the composite first screen | **9** | Seven rail deltas, one gate ember, one face count. A tenth number is a second copy of one of those, which breaks one-count-one-source. |
| 11 | Distinct type sizes per surface | **4** | Header, body, meta, mono. Craft law §3: type does the hierarchy before colour is reached for. |
| 12 | Continuous motion at rest | **1** | One: the working pulse. Everything else moves only to confirm a transition, and stops. |
| 13 | Interruptions per session | **1** | The repeat-mistake warning. Spend it once. |
| 14 | Depth doors visible at once | **7** | The rail. Fixed. An eighth requires removing one, and that argument has to be won. |
| 15 | Simultaneously scrolling regions | **2** | Thread plus one. A third means one of them is not earning its space. |
| 16 | Nested scroll containers | **0** | D2 is what this costs. A scroll inside a scroll has no correct wheel behaviour. |
| 17 | Hover-only affordances | **0** | Every hover reveal has a visible or focus equivalent. Adaptive C §9 already lints this. |
| 18 | Words in a primary button | **3** | `Approve`, `Send it back`, `Write the spec`. |
| 19 | Confirmation dialogs per reversible act | **0** | The consequence line (§5.3) replaces them. Dialogs are for irreversible and destructive only. |
| 20 | Shell regions | **8** | topbar, spine, thread, canvas, rail, strip, composer, and one overlay slot. A feature may not add a ninth. §9.4. |

### 8.1 How each is enforced

| Budget | Enforcement |
| --- | --- |
| 1, 2 | `overwhelm.spec.ts` counts `[data-primary]` and `[data-secondary]` per `[data-region="canvas"]` |
| 3, 4, 5 | `fold.spec.ts` at 1366x600 counts elements whose bounding box lies entirely above the region's fold |
| 6, 7 | computed-style sweep: collect every non-neutral colour in the work row, assert the set size |
| 8, 9 | count `[aria-live]` plus `[data-live]` mounted at rest |
| 10 | count elements matching `[data-count]` in the composite first screen |
| 11 | computed `font-size` set size per surface |
| 12 | `getAnimations()` on the document at rest, filtered to infinite iteration |
| 15, 16 | walk the DOM for `overflow-y: auto | scroll`, assert count and assert no ancestor chain has two |
| 17 | the existing lint rule in `shell.css` extended to all component CSS |
| 20 | `no-new-region.spec.ts` asserts `[data-region]` count is exactly 8 |

---

## 9. The manipulation layer costs zero pixels, and that is why it wins

The founder's mandate is that the artifact should be the interface: click the thing, comment on the
thing, edit the thing. My angle owns the argument for **why that is the only affordable design**, not
merely the nicer one.

### 9.1 The argument, for the board

Every alternative to direct manipulation costs a region. A properties panel is a column. A comment
sidebar is a column. A chat pane beside the canvas is a column. At the 600px floor there are 378
block pixels and, at 1366 inline, exactly two columns: the Thread and the Canvas. **There is no third
column to give away.**

So the choice is not "direct manipulation, or a panel". The choice is "direct manipulation, or the
feature does not fit". Every gesture below costs zero block pixels and zero inline pixels because the
manipulation layer is an **overlay on the object**, never a region beside it.

> **The law: the manipulation layer is an overlay on the object. A gesture that requires a new region
> has failed the screen economy and must be redesigned.** Enforced by budget 20.

This is also the reason it feels the way Lovable, v0 and Claude artifacts feel. Those products are
not doing something expensive. They are doing something cheap, and the cheapness is the point:
selection carries the context, so the conversation does not have to restate it, so the conversation
does not need a column of its own.

### 9.2 The prototype: click it, say it, edit it

**Ground truth.** `PrototypeFace` already renders generated UI in a same-origin `srcDoc` iframe with
`sandbox="allow-scripts"` (`faces.tsx:1280-1287`). The HTML is ours, produced by
`buildDesignScaffoldHtml` and stored in `prd_scaffolds` (`design-scaffold.functions.ts:268-283`).
Tables `prototype_messages` and `prototype_attachments` exist with workspace scoping and RLS
(`supabase/migrations/20260619212731_*.sql:430-452`) and have **zero references anywhere in `src/`**.
Someone intended commenting on prototypes and stopped.

**The mechanism.** Because we generate the scaffold, we inject a bridge at generation time. About
forty lines appended by `buildDesignScaffoldHtml`, inside the sandbox, communicating by
`postMessage`. No `allow-same-origin`, so the sandbox holds.

```
parent -> frame   { type: "select", selector }        highlight, scroll into view
parent -> frame   { type: "setText", selector, text } apply an inline edit
parent -> frame   { type: "measure" }                 report the document height for Fit
frame  -> parent  { type: "picked", selector, rect, tag, text, path }
frame  -> parent  { type: "edited", selector, text }
```

**The gestures, and what each does to the underlying data.**

| Gesture | Key | On screen | Underlying data |
| --- | --- | --- | --- |
| Click an element | pointer | a 2px ember outline and a 28px pin at its top right. Selection goes in the URL as `?sel=<selector-hash>`. | nothing yet |
| Move selection | `Tab` / `Shift+Tab` siblings, `⌥↑` parent, `⌥↓` first child | the outline moves | nothing |
| Start typing with a selection | any character | the composer's placeholder becomes `Change the selected primary button...` and the pin turns solid | nothing until send |
| Send | `⌘Enter` | the pin gets a count badge; the Thread gains one card | `INSERT prototype_messages (prototype_id, role='human', body, anchor jsonb)` where `anchor = { selector, rect, scaffold_updated_at, path }`. Uses the empty table as designed. |
| Dispatch to the agent | the pin's `Do it`, or `⌘⇧Enter` | the frame cross-fades to the new render | `generateDesignScaffold({ prdId, specBody })` with the anchored instruction folded into the prompt, then `UPDATE prd_scaffolds` |
| Double-click text | `Enter` on a selection whose node is a text leaf | in-place `contenteditable` on the mirrored node, with a 1px ember caret | on commit: a new revision row, then `UPDATE prd_scaffolds SET html` |
| Clear | `Escape` | outline gone, composer returns to its own placeholder | nothing |
| Fit / actual size | `F` toggles Stage mode (§3.9); the frame's `Fit` scales via the bridge's `measure` | | nothing |

**One backend gap, stated plainly.** `prd_scaffolds` is a single row per PRD with no history
(`maybeSingle` read, upsert write). An inline edit therefore has nothing to undo to. The pattern
already exists for code: `getChangesetRevisions` and `revertToRevision`
(`studio.functions.ts:1036, 1235`). **Mirror it: add `prd_scaffold_revisions (prd_id, html,
source, created_by, created_at)`, write one on every edit and every generate, and expose
`revertScaffoldToRevision`.** Without it, direct editing is a one-way door and nobody will use it
twice.

**The critic renders on the artifact, not beside it.** `runScaffoldDesignCritic` already produces a
`DesignCriticReview`. Its findings render as **three pins on the artifact**, ember for the one it
would block on, neutral for the rest. Hovering a pin peeks the finding. This is anticipation (§7.2)
and it is why the Design face needs no critic panel, which is why it fits.

### 9.3 The diff: judge it in the gutter

**Ground truth.** `getChangesetDiff`, `applyStagedHunkSelection`, `rejectStagedFile`,
`enforceTouchList`, `setChangesetConstraints`, `getChangesetRevisions`, `revertToRevision` and
`steerStudioSession` all exist and are real (`studio.functions.ts:974-1276, 1816-2011`).
`applyStagedHunkSelection` even carries optimistic concurrency via `expectedUpdatedAt`. **Hunk-level
accept and reject is already built in the backend and has no interface.**

| Gesture | Key | On screen | Underlying data |
| --- | --- | --- | --- |
| Move between hunks | `↓` / `↑` with the diff focused | the hunk band highlights; the gutter minimap mark follows | nothing |
| Accept a hunk | `A` | the hunk goes solid; the file's count decrements | nothing (accepted is the default state) |
| Reject a hunk | `X` | the hunk goes struck and dim; the count decrements | `applyStagedHunkSelection({ changesetId, path, rejectedHunkIds, expectedUpdatedAt })` |
| Reject a whole file | `X` on the file header | the file collapses to a struck row | `rejectStagedFile({ changesetId, path })` |
| Comment on a line | `.` | a 32px inline composer opens between the lines, pushing nothing outside the diff | `steerStudioSession({ sessionId, note, anchor: { path, line } })`. The loop consumes the steer after its checkpoint persists, so it is never both applied and lost. |
| Snap back to scope | the lead slot's `2 files outside your touch list` action | the out-of-scope files disappear | `enforceTouchList({ changesetId })` |
| Undo a whole revision | `⌘Z` at the changeset level | the file list repaints | `revertToRevision` |

**Screen economy consequence, adopted from adaptive C §7.** Side-by-side diff needs two 100-column
mono tracks, roughly 1440 inline pixels, which exceeds `--canvas-max`. So **unified diff is the
default everywhere and side-by-side is a canvas-focus capability** reached with `⌘.`. That is a
product decision falling out of the width model rather than a toggle in settings, and it is the right
kind of decision: the system knows the answer.

**The gutter minimap** (scroll type T4) carries one mark per hunk, coloured by risk: ember where the
hunk touches a file outside the declared touch list, neutral otherwise. That is the anticipation for
*which hunk is the risky one*, and it costs 6 inline pixels.

### 9.4 The spec: select it, act on it

tiptap is already a dependency. Selecting text in the spec workbench raises a 32px floating bar with
exactly three verbs, and three is budget 2.

| Verb | Underlying data |
| --- | --- |
| `Rewrite` | `prdAssist` on the selection only, returning a suggestion rendered as an inline diff the user accepts with `Enter` |
| `Cite` | opens the citation picker as a peek; on pick, writes an `artifact_lineage` edge with relation `cites` via `recordLineage` |
| `Challenge` | `decisions.functions.resolveAssumptionChallenge`, which puts the claim on watch with a date |

Zero regions added. The bar overlays. The section rail (§4, T2) is 4px.

### 9.5 The arbitration law for bare keys

FINAL-ia gives digits `1`-`7` to the Spine and letters `g k r m t c e` to the rail. Adaptive C gives
`⌘.` to focus, `⌘1`-`⌘4` to regions, `⌘G` to the oldest gate, `⌘J` to the composer, `⌘K` to the
palette. The manipulation verbs above use `A`, `X`, `.`, `F`, `O`, `Enter`, `Space`, `Escape` and
arrows. `A`, `X`, `.`, `F` and `O` do not collide with the rail set. To make that safe permanently:

> **Bare letters belong to the innermost focused surface. Rail letters fire when focus is in the
> shell chrome or in a face body, and always fire with `⌥` from anywhere, including inside an
> artifact.** A `keymap.test.ts` asserts no two bindings collide in the same focus context.

---

## 10. The enforcement battery

Written so it can be handed to an engineer as-is. Every test runs at **1366x600 (contract floor)**
and **1512x800 (the founder's laptop)** at minimum, and `fold.spec.ts` sweeps the whole table in §1.1.

| Test | Fails when |
| --- | --- |
| `one-screen.spec.ts` | at either reference size, at `scrollTop: 0`, any surface's `[data-primary]` bounding box is not fully inside the viewport, or any of the five contract elements (§3.1) is absent |
| `fold.spec.ts` | a face renders more than 3 whole objects, or a pane more than 6 whole rows, above its region's fold at the floor |
| `horizon.spec.ts` | a region with `scrollHeight > clientHeight + 1` has no `[data-horizon]` carrying a numeric count and a noun |
| `scroll-typology.spec.ts` | a scrolling region has no `data-scroll-type`, or a T0 region scrolls, or any element has two scrolling ancestors |
| `face-footer.spec.ts` | a `ReceiptLine` or `NextLine` has a scrolling ancestor inside `[data-region="canvas"]` |
| `scent.spec.ts` | a door's accessible name lacks the scent triple, or a mono chip has no `data-peek` payload |
| `peek.spec.ts` | a level-1 peek issues a network request, or reflows its container (measured: no layout shift in the region) |
| `disclosure.spec.ts` | a `surface-registry.ts` capability has no level-0 trace at rest at the floor (§6.4) |
| `no-fifth-level.spec.ts` | a peel opens a peel |
| `overwhelm.spec.ts` | any of the twenty budgets in §8 is exceeded |
| `no-new-region.spec.ts` | `[data-region]` count is not exactly 8 |
| `foresight.spec.ts` | any element enters the work row after first paint (cumulative layout shift inside `[data-region="canvas"]` is greater than 0) |
| `no-fixed-block-size.ts` (lint) | a `max-h-[..]`, `min-h-[..]`, `maxHeight` or `minHeight` inside `[data-face-body]` that is not a `calc()` over `--face-body-h` |
| `rail-fit.spec.ts` | the seven-tile rail renders when `--work-h < 308` |
| `keymap.test.ts` | two bindings collide within one focus context |

**The screenshot set.** Four heights, screenshotted every release and diffed: 600 (the floor), 800
(the founder's laptop), 953 (a 1920 desktop), 1258 (the 27"). Plus one at 448, the honest stop, so
nobody has to imagine it.

---

## 11. What I got wrong in the inputs, and what is still open

**Corrections I am making to documents that outrank me on their own axes.** Each is arithmetic, not
opinion, and each is offered with the fix attached.

1. **FINAL-ia §2.2**: the seven-tile rail cannot be present "at every breakpoint" below 530px of
   shell height. Fix in §3.6, thesis preserved.
2. **FINAL-ia §3.2**: seven full-size journey cards do not fit at the floor. Fix in §3.8: three
   named cards plus an exact horizon, all seven above 950.
3. **Adaptive C §6**: the demotion ladder is inline only. The block-axis ladder is §3.7.
4. **Adaptive A/B/C**: none exposes `--work-h`, so no component can know how tall it may be, which is
   the mechanical root of all four defects in §1.4. Requested in §2.

**Open, and I will not pretend otherwise.**

| # | Open question | Why it is not mine to close |
| --- | --- | --- |
| O1 | The inline width of the peek (I say 320) needs to survive whichever adaptive proposal wins, since 320 exceeds nothing in A or C but is over half a `--container-rail` in B. | It is an inline decision. |
| O2 | Whether the T2 section rail belongs on the region's right edge or its left. Right places it beside the scrollbar (redundant channel) and left places it beside the text (competes with the measure). I lean right. | Needs a real spec at real length in front of a real reader. |
| O3 | The `rail_marks` seen-at semantics for multi-device use. If you read the gates on your phone, does the laptop's delta clear? I think yes, per user, not per device, but that is a product call. | Founder call. |
| O4 | Whether Stage mode should persist per surface or per session. Persisting per surface is more helpful and less predictable. | Needs to be used before it is decided. |
| O5 | The scaffold bridge changes the sandbox's threat surface. It is our own generated HTML, no `allow-same-origin`, and only four message types, but a security review should sign it off before P-whatever ships. | Security, not design. |

---

## 12. One paragraph for the founder

You have three hundred and seventy eight pixels of height on the laptop you actually use, and buying
a bigger monitor does not give you one more, so every screen in this product is designed for three
objects and one action and nothing else. Whatever surface you are on, the same five things are there
before you touch anything: what it is, what state it is in, the thing itself, the one next move, and
a number telling you exactly how much is below. Nothing is ever cut off silently. Every door on the
right edge says what is behind it, how much, and how fresh, and holding your pointer on any of them
for a fifth of a second shows you the first three facts without opening it or losing your place. The
product answers the question before you ask it: the precedent is already under the bet, the risky
file is already at the top of the list, the failing check is already above the approve button, and
the design critic's objections are already pinned on the mockup, not filed in a panel. When you want
to change something you point at it. Click the button in the prototype and type; the agent knows what
"this" means because you selected it. Double-click the label and edit it yourself. Press X on a hunk
you do not want and it is gone from the change before it ever reaches your repo. None of that costs a
single pixel of screen, because all of it happens on top of the thing rather than beside it, and that
is exactly why it fits.
