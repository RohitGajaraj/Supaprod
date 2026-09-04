# Adaptive C - The Shell's Adaptive Choreography

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Angle: the app frame. How the shell RE-COMPOSES as space changes.
> Status: proposal, buildable contract. Written 2026-07-28 against the live tree.
> Verified against: `tailwindcss@4.3.3`, `src/styles.css` (3715 lines), `src/styles/ink.css`,
> `src/routes/__root.tsx`, `src/routes/_authenticated.tsx`, `src/components/mission/MissionShellView.tsx`,
> `src/components/mission/Spine.tsx`, `src/components/mission/WorkingStrip.tsx`,
> `src/routes/_authenticated.build.index.tsx`, `src/routes/_authenticated.settings.tsx`,
> `e2e/03-surfaces-responsive.spec.ts`, `playwright.config.ts`, `.github/workflows/ci.yml`,
> `eslint.config.js`, `bunfig.toml`, `test/setup.ts`.

---

## 0. What I own, and where I hand off

**I own:** the frame. The list of regions, their widths, which of them are resident at a given
size, the order in which they give way, the transitions between compositions, focus mode, and
what survives a resize. I produce a container named `pane` around every slot and guarantee its
width. That is my contract's edge.

**I hand off:**

| Seam | Who | What I promise them | What I need from them |
| --- | --- | --- | --- |
| Type + spacing scale | Proposal A (scale/density) | I consume `--fs-body`, `--space-*`, `--ink-control-*`, and `data-density`. Every width I compute is a `calc()` over their tokens, so if they retune the ramp my layout retunes with it and CI re-checks the algebra. | One canonical `--fs-body` (today `--tempo-text-base: 13px`) and a pinned per-font `ch` correction constant. |
| Inside a pane | Proposal B (surface adaptation) | Every slot is `container: pane / inline-size` with a known `--pane-w`. A face may assume it is between `--col-min` and `--canvas-max` and never anything else. | Faces query `@container pane`, never `@media`. Faces never set their own width. |
| Content primitives | Proposal B | Slot width, a `data-scroll="x"` opt-out for genuinely wide content (diffs, terminals, wide tables). | Every horizontally-overflowing element carries `data-scroll="x"`, or my CI gate fails it. |

Nothing in this document decides typography, color, iconography, or what a Canvas face
looks like. It decides only where things go and what leaves first.

---

## 1. The thesis: the Column Field

The existing app is not "designed for 1440". It is designed for *no width at all* - it has no
width model. It has 5 breakpoint utilities across ~75 authenticated route files, 0 container
queries, and 992 inline `style={{}}` objects in those routes. A fixed artboard was the only
possible outcome.

The fix is not "add breakpoints". Breakpoints keyed to devices reproduce the same defect one
device later. The fix is a width **model**:

> **The shell is a field of measure columns. Every region is an integer number of columns.
> Surplus space buys columns; it never stretches one. Every column is capped at reading measure.**

Three consequences fall straight out of that, and they are the whole design:

1. **Nothing is ever "too wide."** No text column can exceed 75 characters because a column's
   max IS 75 characters. A 3440px monitor and a 1280px laptop run the same rule.
2. **Growth is composition, not scale.** Widening promotes a drawer into a column and a tray
   into a column. It does not inflate the thread.
3. **Shrinking is demotion along one ordered ladder,** and that ladder is derived from the
   product's job, not from taste.

The job, stated once because everything below is justified against it:

> **A human is in this app to make judgment calls at gates.** Everything else - the loop rail,
> the activity strip, the canvas, the receipts - exists so that judgment is informed. Therefore
> **the gate is the last thing to give way, and it never gives way.** A layout that hides the
> decision to preserve the dashboard has inverted the product.

---

## 2. The target range, and what happens outside it

Declared in CSS pixels of the **shell element**, not the device. This matters: OS display
scaling, browser zoom, and a split-screen half-window all change exactly this number, so one
mechanism covers all three and there is no separate "zoom story".

| Band | Range (shell inline-size) | Commitment |
| --- | --- | --- |
| **Designed** | `1054px` - `3159px` | Tuned, screenshotted, demoed. Covers 1280×800 laptops, 1440/1512 MacBooks, 1920 and 2560 desktops, 3440 ultrawide. |
| **Supported** | `431px` - `5120px` | Fully functional, every invariant present, CI-swept. Covers a half-window of a 1440 display (720), a 13" laptop at 175% zoom (823), a 1920 at 200% zoom (960), a 5K in landscape. |
| **Survived** | `360px` - unbounded | Usable, not tuned. Phone-width stack. Not screenshotted, not demoed, no visual regression baseline. |
| **Outside, low** | `< 360px` | The shell **stops recomposing**. It pins to a 360px stack and the page scrolls horizontally. This is an honest floor, not a "please rotate your device" wall. Nothing is hidden; you pan. |
| **Outside, high** | `> 3159px` | The band caps at `--shell-band-max` and centers, with symmetric empty gutters. Deliberate. §10 justifies it. |

**Vertical**, same idea, because 200% zoom is mostly a height problem:

| Band | Range (shell block-size) | Commitment |
| --- | --- | --- |
| Designed | `448px` - unbounded | Full chrome. |
| Supported | `351px` - `448px` | Chrome compresses along §6's vertical ladder. A 1440×900 display at 200% zoom is 720×450 → supported on both axes. |
| Outside, low | `< 351px` | Bottom docks (activity strip + composer) become one overlay sheet summoned by `⌘J`; the work area keeps the whole viewport. Still no wall. |

**Browser zoom to 200% is not a special case.** At 200% on a 1440×900 display, the shell measures
720×450 CSS px *and* body text measures 26 physical px. The layout demotes exactly as it does at
720×450 physically, and the measure math still holds because measure is expressed in `ch`, which
scales with the type. That is the entire argument for expressing widths in `ch` rather than px.

**What we explicitly do not do:** ask the user to pick a window size, ship a "best viewed at"
note, or record a demo at a fixed viewport. The demo is recorded at whatever the machine is,
and `?focus=` (§7) scripts the composition instead of the window manager.

---

## 3. The token algebra - every value derives

Lives in a new `src/styles/shell.css`, imported by `src/styles.css` after `./styles/ink.css`.
Declared on the shell root (not `:root`) so `1ch` resolves against the shell's own `font-size`.

```css
/* src/styles/shell.css */
@layer shell {
  [data-shell] {
    /* --- inputs, all owned by Proposal A ------------------------------ */
    font-size: var(--fs-body, var(--tempo-text-base, 13px));

    /* ch-correction: CSS `1ch` is the advance of the "0" glyph, which for a
       proportional face is wider than the average character the 45-75 rule
       counts. Pinned per font family, measured once by
       scripts/measure-ch-correction.mjs, re-verified in CI (Gate 3d). */
    --ch-corr: 0.83;                      /* Geist Sans */
    --char: calc(var(--ch-corr) * 1ch);   /* == 6.474px at 13px Geist Sans */

    /* --- the measure scale (Bringhurst 45-75; 66 is the target) -------- */
    --chars-min: 48;
    --chars-ideal: 66;
    --chars-max: 75;

    --pane-pad: var(--space-4);           /* 16px, from the 4px grid */
    --pane-chrome: calc(2 * var(--pane-pad));

    --col-min:   calc(var(--chars-min)   * var(--char) + var(--pane-chrome));  /* 343px */
    --col-ideal: calc(var(--chars-ideal) * var(--char) + var(--pane-chrome));  /* 459px */
    --col-max:   calc(var(--chars-max)   * var(--char) + var(--pane-chrome));  /* 518px */

    /* --- the canvas is n sub-columns of the same scale ----------------- */
    --canvas-cols-min: 2;   /* below 2, it is a list, not a canvas */
    --canvas-cols-max: 3;   /* above 3, it is a second task, not a wider canvas */
    --sub-gutter: var(--space-6);         /* 24px */

    --canvas-min:   calc(2 * var(--col-min)   + 1 * var(--sub-gutter));  /*  710px */
    --canvas-ideal: calc(2 * var(--col-ideal) + 1 * var(--sub-gutter));  /*  942px */
    --canvas-max:   calc(3 * var(--col-max)   + 2 * var(--sub-gutter));  /* 1602px */

    /* --- rails + separators ------------------------------------------- */
    --hairline: 1px;                      /* justified: device pixel boundary */
    --hit-min: 44px;                      /* justified: WCAG 2.5.5 AAA / Apple HIG,
                                             a physical-ergonomics constant (~9mm finger
                                             pad). Does NOT scale with the type ramp. */
    --rail-w: max(calc(var(--ink-control-sm) + 2 * var(--space-1)), var(--hit-min)); /* 44px */

    /* --- vertical chrome, all derived --------------------------------- */
    --topbar-h:  calc(var(--ink-control-md) + 2 * var(--space-2));   /* 52px - the shipped
                                                                       h-[52px] turns out to be
                                                                       exactly this; keep the
                                                                       derivation, drop the literal */
    --spine-h-full:    calc(var(--ink-control-sm) + var(--space-3) + var(--space-2) + 12px);
    --spine-h-labeled: calc(var(--ink-control-sm) + var(--space-2));
    --spine-h-numeric: var(--ink-control-sm);
    --strip-h:   calc(var(--space-4) + calc(var(--fs-body) * 1.3));
    --dock-h:    calc(var(--ink-control-lg) + var(--space-3) + var(--space-4));  /* 64px */
    --dock-max-block: 30cqb;              /* no bottom dock may eat >30% of the shell */

    /* --- the band cap (see §10) --------------------------------------- */
    --shell-band-max: calc(
      var(--col-max) + var(--canvas-max) + var(--col-max) + var(--col-max)
      + 3 * var(--hairline)
    );                                     /* 3159px */

    /* --- transition behaviour ----------------------------------------- */
    --tier-dur: var(--dur-panel, 200ms);
    --focus-dur: var(--dur-page, 280ms);
    --tier-ease: var(--ease, cubic-bezier(0.23, 1, 0.32, 1));
  }
}
```

**Every number above is a `calc()` over an existing token.** Two literals survive and both are
justified in-line: `1px` (a device pixel boundary is not a design choice) and `44px` (an
ergonomic constant tied to a finger, not to a type ramp - it must NOT scale when the type does,
which is exactly why it cannot be expressed in `ch`).

Resolved at today's shipped tokens (13px Geist Sans, `--space-*` from `src/styles.css`):

```
--col-min 343   --col-ideal 459   --col-max 518
--canvas-min 710   --canvas-ideal 942   --canvas-max 1602
--rail-w 44   --topbar-h 52   --shell-band-max 3159
```

---

## 4. The composition table - one source, three consumers

The single defect to avoid is CSS and JS disagreeing about what is on screen. So the tier table
is written **once, in TypeScript**, and it feeds (a) a CSS codegen, (b) a runtime predicate for
keyboard/aria/intent-clamping, (c) the tests. Nothing hand-writes a breakpoint.

```ts
// src/lib/shell/composition.ts
export type RegionId = "thread" | "canvas" | "context" | "ledger";
export type TierId = "S0" | "S1" | "S2" | "S3" | "S4";
export type VTierId = "H0" | "H1" | "H2" | "H3";

/** Resolved token values, generated from shell.css by scripts/read-shell-tokens.mjs
 *  so the algebra can never drift from the stylesheet. */
export const T = {
  colMin: 343, colIdeal: 459, colMax: 518,
  canvasMin: 710, canvasIdeal: 942, canvasMax: 1602,
  rail: 44, hairline: 1,
} as const;

/** CORE regions may run at their min so the pair can exist at all.
 *  AUXILIARY regions are promoted only when every incumbent is at least IDEAL - *  an inspector never starves the thread. This is the one promotion law. */
export const REGIONS = {
  thread:  { rank: 1, kind: "core", min: T.colMin,    ideal: T.colIdeal,    max: T.colMax },
  canvas:  { rank: 0, kind: "core", min: T.canvasMin, ideal: T.canvasIdeal, max: T.canvasMax },
  context: { rank: 2, kind: "aux",  min: T.colMin,    ideal: T.colIdeal,    max: T.colMax },
  ledger:  { rank: 3, kind: "aux",  min: T.colMin,    ideal: T.colIdeal,    max: T.colMax },
} as const;

export const TIERS: { id: TierId; resident: RegionId[] }[] = [
  { id: "S0", resident: [] },
  { id: "S1", resident: ["canvas"] },
  { id: "S2", resident: ["thread", "canvas"] },
  { id: "S3", resident: ["thread", "canvas", "context"] },
  { id: "S4", resident: ["thread", "canvas", "context", "ledger"] },
];

/** The floor of a tier, computed - never typed by hand. */
export function tierFloor(id: TierId): number {
  if (id === "S0") return 0;
  if (id === "S1") return T.colMin + 2 * T.rail;               // 431
  const resident = TIERS.find((t) => t.id === id)!.resident;
  const seps = (resident.length - 1) * T.hairline;
  const newcomer = resident[resident.length - 1];
  return seps + resident.reduce((sum, r) => {
    const spec = REGIONS[r];
    if (r === newcomer && spec.kind === "aux") return sum + spec.min;
    return sum + (spec.kind === "core" && id === "S2" ? spec.min : spec.ideal);
  }, 0);
}

export const BAND_MAX = 2 * T.colMax + T.canvasMax + T.colMax + 3 * T.hairline; // 3159

export function tierFor(width: number): TierId {
  for (const t of [...TIERS].reverse()) if (width >= tierFloor(t.id)) return t.id;
  return "S0";
}
```

Resolved floors:

| Tier | Resident regions | Floor | Derivation |
| --- | --- | --- | --- |
| **S0** | - (out of range) | `< 431` | below one column plus two rails |
| **S1 Stack** | one focused pane + two rails | `≥ 431` | `col-min + 2·rail` |
| **S2 Pair** | thread, canvas | `≥ 1054` | `col-min + canvas-min + 1` |
| **S3 Triad** | thread, canvas, context | `≥ 1746` | `col-ideal + canvas-ideal + col-min + 2` |
| **S4 Field** | thread, canvas, context, ledger | `≥ 2206` | `col-ideal + canvas-ideal + col-ideal + col-min + 3` |
| cap | band centers | `> 3159` | all four at max + 3 hairlines |

Vertical, same machinery (`VTIERS` in the same file):

| VTier | Chrome | Floor | Derivation |
| --- | --- | --- | --- |
| **H0** | docks become a summoned sheet | `< 351` | |
| **H1 Compressed** | spine numeric, strip merged into the composer's top line | `≥ 351` | `topbar + spine-numeric + dock + work-floor` |
| **H2 Standard** | spine labeled, strip one line | `≥ 396` | |
| **H3 Full** | spine full with the drawn return edge, strip up to 3 lines | `≥ 448` | |

`work-floor = 207px` = three thread blocks (`2 body lines + attribution + gap`), the smallest
window in which a conversation reads as a conversation.

**Codegen.** `scripts/gen-shell-css.ts` (run by `prebuild`, output committed and diffed in CI)
turns `TIERS` into the container-query blocks below, and stamps each with
`--shell-tier-active: S2` so a browser test can read back which tier CSS actually applied and
assert it equals `tierFor(width)`. That single assertion is what makes CSS/JS drift impossible.

---

## 5. The real grid definitions

The shell is one grid. Regions are edge-to-edge with hairline separators - this is an app frame,
not a page, so there is no outer gutter and each region carries its own `--pane-pad`.

```tsx
// src/components/shell/AppShell.tsx  (structure only)
<div data-shell data-tier-hint={ssrTierHint} data-focus={focus ?? undefined}>
  <header  data-region="topbar" />
  <nav     data-region="spine" />
  <aside   data-region="thread"  data-resident />
  <section data-region="canvas"  data-resident />
  <aside   data-region="context" />
  <aside   data-region="ledger" />
  <div     data-region="strip" />
  <div     data-region="composer" />
  {/* drawers + tray render INTO the region nodes above, never as siblings - see §8.2 */}
</div>
```

```css
@layer shell {
  [data-shell] {
    container: shell / size;      /* inline + block; the shell is h-dvh so size is determinate */
    display: grid;
    block-size: 100dvh;
    max-inline-size: var(--shell-band-max);
    margin-inline: auto;          /* the cap in §10 */
    background: var(--ink-bg);
    color: var(--ink-body);

    grid-template-rows:
      var(--topbar-h)                     /* topbar - never sacrificed */
      auto                                /* spine - condenses, never removed */
      minmax(0, 1fr)                      /* work - the panes */
      auto                                /* strip - compresses to one line */
      auto;                               /* composer - never sacrificed */
    grid-template-areas:
      "topbar   topbar  topbar   topbar"
      "spine    spine   spine    spine"
      "thread   canvas  context  ledger"
      "strip    strip   strip    strip"
      "composer composer composer composer";
  }

  /* Every region is a container for the face inside it. THIS is the handoff to Proposal B. */
  [data-region] { container: pane / inline-size; min-inline-size: 0; min-block-size: 0; }

  /* ---------- S1 Stack: one pane, two rails, nothing removed ---------- */
  @container shell (max-width: 1053.98px) {
    [data-shell] {
      --shell-tier-active: S1;
      grid-template-columns: var(--rail-w) minmax(0, 1fr) var(--rail-w) 0;
    }
    [data-region="thread"]  { --peel: 1; }
    [data-region="context"] { --peel: 1; }
    [data-region="ledger"]  { display: none; }   /* lives in the tray, its permanent home */
  }
  /* the focused pane takes the middle; the other two are rails */
  @container shell (max-width: 1053.98px) {
    [data-shell][data-focus="thread"]  { grid-template-columns: minmax(0,1fr) var(--rail-w) var(--rail-w) 0; }
    [data-shell][data-focus="thread"]  [data-region="thread"] { --peel: 0; }
    [data-shell][data-focus="thread"]  [data-region="canvas"] { --peel: 1; }
  }

  /* ---------- S2 Pair ---------- */
  @container shell (min-width: 1054px) {
    [data-shell] {
      --shell-tier-active: S2;
      /* 32.8cqi is GENERATED from colIdeal / (colIdeal + canvasIdeal) - never typed.
         Fluid inside the tier, so there is no dead zone between breakpoints. */
      grid-template-columns:
        clamp(var(--col-min), 32.8cqi, var(--col-ideal))
        minmax(var(--canvas-min), 1fr)
        0 0;
    }
    [data-region="context"], [data-region="ledger"] { display: none; }
  }

  /* ---------- S3 Triad ---------- */
  @container shell (min-width: 1746px) {
    [data-shell] {
      --shell-tier-active: S3;
      /* 24.5cqi = colIdeal / (colIdeal + canvasIdeal + colIdeal), generated. */
      grid-template-columns:
        clamp(var(--col-min), 24.5cqi, var(--col-max))
        minmax(var(--canvas-min), 1fr)
        clamp(var(--col-min), 24.5cqi, var(--col-max))
        0;
    }
    [data-region="context"] { display: flex; }
    [data-region="ledger"]  { display: none; }
  }

  /* ---------- S4 Field ---------- */
  @container shell (min-width: 2206px) {
    [data-shell] {
      --shell-tier-active: S4;
      /* 19.4cqi = colIdeal / (2·colIdeal + canvasIdeal + colIdeal), generated. */
      grid-template-columns:
        clamp(var(--col-min), 19.4cqi, var(--col-max))
        minmax(var(--canvas-min), 1fr)
        clamp(var(--col-min), 19.4cqi, var(--col-max))
        clamp(var(--col-min), 19.4cqi, var(--col-max));
    }
    [data-region="context"], [data-region="ledger"] { display: flex; }
  }

  /* ---------- the canvas is a column field, at every tier ---------- */
  [data-region="canvas"] > [data-canvas-field] {
    display: grid;
    gap: var(--sub-gutter);
    grid-template-columns: repeat(auto-fit, minmax(var(--col-min), 1fr));
    max-inline-size: var(--canvas-max);   /* caps auto-fit at --canvas-cols-max naturally */
  }

  /* ---------- peel: a region never disappears, it becomes an edge ---------- */
  [data-region][style*="--peel"], [data-region] { --peel: 0; }
  [data-region]:where([data-region="thread"], [data-region="context"], [data-region="ledger"]) {
    transition: inline-size var(--tier-dur) var(--tier-ease);
  }
  [data-region][data-peeled="true"] > [data-pane-body] { display: none; }
  [data-region][data-peeled="true"] > [data-pane-rail] { display: flex; }
  /* CSS-only unpeel for keyboard: focusing anything inside a rail expands it. */
  [data-region][data-peeled="true"]:focus-within {
    inline-size: clamp(var(--col-min), 32.8cqi, var(--col-max));
  }
  [data-region][data-peeled="true"]:focus-within > [data-pane-body] { display: flex; }
}
```

### Vertical ladder

```css
@layer shell {
  @container shell (max-height: 447.98px) {
    [data-shell] { --shell-vtier-active: H2; }
    [data-region="spine"] { --spine-mode: labeled; }
    [data-region="spine"] [data-spine-return] { display: none; }   /* decoration goes first */
  }
  @container shell (max-height: 395.98px) {
    [data-shell] { --shell-vtier-active: H1; }
    [data-region="spine"] { --spine-mode: numeric; }
    [data-region="strip"] { display: none; }
    [data-region="composer"] [data-strip-inline] { display: flex; } /* the summary survives here */
  }
  @container shell (max-height: 350.98px) {
    [data-shell] { --shell-vtier-active: H0; }
    [data-region="strip"], [data-region="composer"] { position: fixed; inset-block-end: 0; }
    [data-shell]:not([data-dock-open]) [data-region="composer"] [data-composer-body] { display: none; }
  }
  [data-region="composer"] { max-block-size: var(--dock-max-block); }
}
```

`--dock-max-block: 30cqb` is the law that stops an expanded composer from eating the gate.
It is a proportion of the shell, so it holds at every height.

---

## 3159 to 431: how you actually feel it

At 2560 the shell is a triad with a fat canvas. Drag to 2206 and the ledger slides in from the
right. Drag to 1746 and the context column slides in. Between 1746 and 2206 nothing snaps: the
columns breathe on `cqi` until they hit their `clamp` caps. Below 1054 the thread peels to an
edge with a badge. Below 431 the shell stops and you pan. No step is a device.

---

## 6. The priority order

### 6.1 The invariant set - never sacrificed at any width or height

| # | Invariant | Why it cannot go |
| --- | --- | --- |
| I1 | **The open gate**: its claim, its evidence line, and both buttons | This is the product. A layout that hides the decision has inverted the job. |
| I2 | **The composer** (collapsed strip at minimum) | If the human cannot answer, the app is broken. |
| I3 | **The activity truth** - at minimum `N working · M waiting on you` | Honesty rule already in `WorkingStrip`: the machine must never work invisibly. It may compress to a count. It may never become nothing. |
| I4 | **Escape** - the account control (sign-out) and the way back to the room | Already learned the hard way when the retired `AppShell` stranded `signOut`; see the comment at `MissionShellView.tsx:359-364`. |
| I5 | **Loop position** - the current stage, in some form | Without it, the user does not know where in the loop they are, and every gate becomes context-free. Allowed to become a single `03/07 Plan ▾` chip. Not allowed to vanish. |

CI asserts all five are present, visible, and inside the viewport at every swept width (§12, Gate 3b).

### 6.2 The demotion ladder - what gives way, cheapest first

Ordering rule, stated once: **rank by distance from the gate.** A thing is cheap to demote when
(a) it is decoration, (b) it has a permanent home elsewhere that is one click away, or (c) it is
recoverable from what remains on screen.

| # | What gives | How | Justification |
| --- | --- | --- | --- |
| 1 | Spine return-edge caption + `Starts from:` / `Ends with:` caps | hidden | Pure ornament. `Spine.tsx` already renders them behind optional props. |
| 2 | Topbar recessed doors - Crew, Under the hood, Artifacts, Threads | collapse into one `More` menu | Already off-nav by the Engine-Room doctrine; they are depth, not chrome. Today they use `hidden sm:flex`, which is the right instinct with the wrong query. |
| 3 | **Ledger column** | back to the approvals tray | The column is a *promoted view of the tray*. The tray is its permanent home and is one key away (`⌘K` → Approvals, or the topbar pill). |
| 4 | Spine receipts + state words (`SPEC-52`, `writing the change`) | dot + number + label only | Receipts are one click in, and the WorkingStrip still carries the live verb. |
| 5 | **Context column** | back to its drawer | Engine-Room doctrine: depth on demand behind one door. Same component, different presentation (§8.2). |
| 6 | Product-switcher label | mark + chevron | The name is recoverable from the canvas masthead. |
| 7 | Spine labels | dot + number, full loop in a popover | The number preserves I5 wayfinding at a third of the width. |
| 8 | **Thread column** | peels to a `--rail-w` edge carrying: unread pip, last agent line (truncated), **gate marker** | The thread is where gates land inline, so it may never be *removed*. As an edge it still announces a gate, and `:focus-within` unpeels it with zero JS. |
| 9 | Activity strip detail lines | one summary line | I3 preserved at its floor. |
| 10 | Canvas sub-columns | `auto-fit` drops a column, then the field becomes internal tabs | Content stays reachable; only simultaneity is lost. |
| - | **STOP** | | Below this, only I1 - I5 remain. There is nothing further to take. |

### 6.3 The promotion ladder - what gains presence, in order

The exact reverse, and it is the same code path read the other way. This is the half most design
systems never write down, and it is the half the founder actually asked for.

| # | What arrives | At |
| --- | --- | --- |
| 1 | Canvas gains a sub-column (2 → 3) | continuously, via `auto-fit`, from ~1750 up |
| 2 | **Context** promotes from drawer to resident column | S3, `≥ 1746` |
| 3 | Spine gains receipts, state words, and the drawn return edge | H3, `≥ 448` tall |
| 4 | **Ledger** promotes from tray to resident column | S4, `≥ 2206` |
| 5 | Thread reaches its widest measure (`--col-max`, 75ch) | S3+, and stops there forever |
| 6 | Activity strip shows up to 3 per-agent lines instead of the summary | S3 + H3 |

Note what is **not** on this list: nothing gets bigger. Type does not grow, padding does not
grow, the thread does not exceed 75 characters. Abundance buys *more*, never *larger*. That is
the single rule that makes an ultrawide feel designed rather than zoomed.

---

## 7. Focus mode

**Definition.** `focus ∈ { null, "thread", "canvas", "context", "ledger" }`. When set, the
focused region takes the whole work row; every other region peels to a `--rail-w` edge. Topbar,
spine, strip, and composer are unaffected - they are chrome and invariants, not competitors.

**The elegant part: focus is not a special mode.** S1 *is* focus mode, made mandatory by width.
So there is one code path, not two:

```
resolvedFocus = intent.focus ?? (tier === "S1" ? gateRegion ?? "thread" : null)
```

At S1 with an open gate, focus lands on the region holding the gate. That is I1 expressed at the
tightest tier: **when there is exactly one pane's worth of room, the pane you get is the one with
the decision in it.**

```css
@layer shell {
  [data-shell][data-focus] { transition: grid-template-columns var(--focus-dur) var(--tier-ease); }
  [data-shell][data-focus="canvas"] { grid-template-columns: var(--rail-w) minmax(0,1fr) var(--rail-w) var(--rail-w); }
  [data-shell][data-focus="thread"] { grid-template-columns: minmax(0,1fr) var(--rail-w) var(--rail-w) var(--rail-w); }
  /* in focus the canvas field is allowed its full column count */
  [data-shell][data-focus="canvas"] [data-canvas-field] { max-inline-size: none; }
}
```

**Focus unlocks composition, not size.** A side-by-side diff needs two 100-column mono
tracks ≈ 1440px, which exceeds `--canvas-max` (1602 is fine, but only in focus is the canvas
allowed to *use* it without starving the thread). So: **side-by-side diff is a canvas-focus
capability**, unified diff is the everywhere default. That is a real product consequence falling
out of the width model rather than a preference toggle.

**Focus lives in the URL** as `?focus=canvas`, so it survives reload, is linkable, is scriptable,
and - the point - **a demo is recorded by pinning `?focus=`, not by pinning the window size.**
That directly retires the workaround the founder called out.

**Entering and leaving.** `⌘.` toggles focus on the region containing `document.activeElement`
(pointer-free). `Esc` exits. `⌘1` - `⌘4` go straight to a region. `⌘J` focuses the composer from
anywhere, focused or not. `⌘G` jumps to the oldest open gate and focuses its primary button,
unpeeling whatever it lives in.

---

## 8. Transitions, and what survives a resize

### 8.1 State model - one rule that makes resize reversible

```ts
// src/lib/shell/intent.ts
type Intent  = { focus: RegionId | null; contextOpen: boolean; ledgerOpen: boolean;
                 threadPeeled: boolean };
type Capacity = { tier: TierId; vtier: VTierId };

/** THE RULE: capacity clamps intent for rendering, and NEVER writes back into it. */
export function resolve(intent: Intent, cap: Capacity): Resolved { /* pure */ }
```

Because capacity never mutates intent, **shrinking and re-growing returns to the exact previous
composition.** Drag a window narrow and back and you get your columns back, in the state you
left them. This is the single most-noticed behaviour of a good adaptive shell and the single
most-common bug in a bad one.

Persistence: `focus` in the URL search param; the rest in
`localStorage["supaprod.shell.intent.<workspaceId>"]`. A pre-paint inline script in
`__root.tsx` (alongside the existing theme stamp) writes `data-shell-intent` on `<html>` before
first paint - necessary because the authenticated subtree runs `ssr: false`, so React is not
there to prevent a flash.

### 8.2 What survives, mechanically

**Promotion and demotion are the same component in a different presentation, not two
components.** A region never unmounts when it moves between column and overlay, so scroll
position, form drafts, expanded rows, text selection, and in-flight streams all survive.

This forbids using Radix `Dialog` for the three promotable regions. Radix portals to
`document.body` and remounts on open - the state dies. So:

```tsx
// src/components/shell/ShellRegion.tsx
// One DOM node, three presentations. No portal, no remount.
export function ShellRegion({ id, presentation, children }: {
  id: RegionId;
  presentation: "column" | "overlay" | "rail";
  children: ReactNode;
}) {
  return (
    <aside data-region={id} data-presentation={presentation}
           data-peeled={presentation === "rail"}
           aria-hidden={presentation === "rail" ? undefined : undefined}
           role={presentation === "overlay" ? "dialog" : "complementary"}>
      <div data-pane-rail hidden={presentation !== "rail"}><RegionRail id={id} /></div>
      <div data-pane-body>{children}</div>
    </aside>
  );
}
```

```css
[data-region][data-presentation="overlay"] {
  position: absolute; inset-block: 0; inset-inline-end: 0;
  inline-size: min(clamp(var(--col-min), 60cqi, var(--col-max)), 100cqi);
  z-index: 40; box-shadow: var(--shadow-elevated);
}
```

Radix `Dialog` remains correct for genuinely modal things (destructive confirms, the command
palette). It is wrong for a region that has a resident form.

### 8.3 The transitions themselves

| Change | Motion | Duration |
| --- | --- | --- |
| Within a tier (columns breathe on `cqi`) | none; the `clamp()` tracks it continuously | - |
| Peel / unpeel | `inline-size` on the region | `--tier-dur` 200ms |
| Tier change (a column arrives) | grid track count changes → **grid snaps instantly**; the arriving region does `opacity 0→1` + `translateX(1rem→0)` from its own edge | `--tier-dur` 200ms |
| Tier change (a column leaves) | the leaving region does the reverse with `transition-behavior: allow-discrete` + `@starting-style` | `--tier-dur` |
| Focus enter / exit | `grid-template-columns` interpolates (track count is constant in focus) | `--focus-dur` 280ms |
| Active window drag | **all of the above suppressed** | - |

Grid track *counts* cannot interpolate, so we do not pretend they can. The columns snap and the
new content fades in; that reads as intentional, whereas a half-interpolated grid reads broken.

**Suppression during drag** is the only JS the layout needs, and it exists to stop a strobe when
a window drag crosses a tier boundary. CSS container queries have no hysteresis, so:

```ts
// src/components/shell/useResizeSettle.ts - ~15 lines, one job
const ro = new ResizeObserver(() => {
  root.setAttribute("data-resizing", "");
  clearTimeout(t);
  t = setTimeout(() => root.removeAttribute("data-resizing"), 120);
});
```
```css
[data-shell][data-resizing] *, [data-shell][data-resizing] { transition: none !important; }
@media (prefers-reduced-motion: reduce) { [data-shell] *, [data-shell] { transition: none !important; } }
```

Layout itself stays pure CSS - no JS in the paint path, therefore no first-paint flash despite
`ssr: false`.

### 8.4 The asymmetry law

> **Growing reveals. Shrinking never covers.**

If context was open as a column at S3 and the window shrinks to S2, it demotes to a **closed
rail with a "kept" pip** - never to an auto-opened overlay, which would suddenly cover the canvas
the user was reading. If context was open as an overlay at S1 and the window grows to S3, it
promotes to an open column, because revealing more of what you asked for is always welcome.

---

## 9. Keyboard and pointer differences

**Hit area, not chrome size.** The existing `e2e/03-surfaces-responsive.spec.ts` asserts every
interactive element's *bounding rect* is ≥ 44×44, and `styles.css:1546` forces
`min-height: 44px` on `.loom-press` under `max-width: 768px`. That is why the app inflates on
narrow screens. The standard is about *target* size, not *visual* size. Correct implementation:

```css
@media (pointer: coarse) {
  [data-shell] :is(button, a, [role="button"], input, select)::after {
    content: ""; position: absolute; inset: 50% auto auto 50%;
    translate: -50% -50%;
    inline-size: max(100%, var(--hit-min)); block-size: max(100%, var(--hit-min));
  }
  [data-shell] :is(button, a, [role="button"]) { position: relative; }
}
```

The 32px control stays 32px. The finger gets 44px. The CI assertion changes from "measure the
box" to "probe the four corners of a 44px square with `elementFromPoint` and confirm they hit
the same control" (§12, Gate 3c).

| Input | Behaviour |
| --- | --- |
| `pointer: fine` | Column separators become drag handles; dragging re-proportions within `[min, max]` and writes the result into `intent` as a `cqi` override. Hover previews a peeled rail (translucent peek at 30% width, no state change). |
| `pointer: coarse` | No drag handles (a 1px handle is a lie on a touchscreen). No hover-peek; peeled rails get a persistent chevron affordance instead of a hover-revealed one. Peel toggles on tap. |
| `hover: none` | Every hover-only affordance in the shell gets a visible equivalent. Enforced by a lint rule: `:hover` in `shell.css` must be paired with a `:focus-visible` or a `[data-touch]` sibling rule. |
| Keyboard | DOM order **is** priority order - topbar → spine → thread → canvas → context → ledger → strip → composer. `tabindex` is never manipulated, so the tab order and the demotion ladder are literally the same list. |
| Keyboard, peeled regions | `:focus-within` unpeels in CSS (§5). A keyboard user is never blocked by a peel and never needs to know peeling exists. |
| Keyboard, invariants | `⌘G` → oldest open gate, focusing its primary button. `⌘J` → composer. Both work at every tier, from inside focus mode, from inside a peeled rail. |
| Screen reader | A peeled region is `aria-expanded="false"` on its rail button and its body stays in the a11y tree (never `aria-hidden`) - a gate hidden behind a peel must still be announced. Tier changes fire one polite live-region message: `Context panel now shown as a column.` |

---

## 10. The ultrawide answer

**The question:** on a 3440px monitor, cap, fill, or recompose?

**The answer: recompose, with every column capped and the band capped at 3159px.** Concretely:
fill the monitor with *more columns*, never with wider ones; stop adding columns at four; center
the surplus.

### The reading-measure half

A line of body text beyond ~75 characters measurably degrades reading: the return sweep from
line-end to the next line-start loses its target and the reader re-reads or skips. This is not a
preference; it is why `--col-max` is `75 × --char + 2 × --pane-pad` and not a number someone
liked. **A stretched thread on a 3440 monitor is objectively worse than a capped one**, and any
system that "fills" by widening its text column has made the ultrawide a downgrade.

So: no column exceeds 75ch, ever, at any width, in any tier, in focus mode, on any monitor.

### The eye-travel half

At a typical 60-70cm desk distance, a 3440px 34" ultrawide subtends roughly 60° of horizontal
visual angle. Comfortable scanning without head movement is roughly the central 30°, i.e. about
half the screen width. Content that must be **correlated** - the gate, the evidence it refers
to, and the composer you answer in - has to live inside that central band. Content that is only
**monitored** - a queue, a live feed, a status ledger - may live outside it, because glance-and-
recognize does not need foveal resolution; a color and a count are enough.

That is why the ledger is the *outermost* column and the thread + canvas are central: the
promotion ladder is ordered by how much foveal attention a region needs, not by how much space
is left over.

### The arithmetic, and where it lands

```
thread (col-max)   518
canvas (canvas-max) 1602    = 3 sub-columns of 518 + 2 gutters of 24
context (col-max)   518
ledger (col-max)    518
hairlines             3
                  -----
--shell-band-max   3159
```

On a 3440 display at 100%: **3159 used, 281 of symmetric gutter (140 a side).** The derivation
was run from measure and cognition, not from the founder's monitor, and it lands within 8% of
it. That is a check on the model, not a target of it.

### Why it stops at four columns

`--canvas-cols-max: 3` and four regions are not arbitrary caps; they are the point at which
adding space stops adding capability. A fourth *canvas* sub-column and a fifth *region* both
cross out of what one person tracks simultaneously - at that point you do not have a wider
workspace, you have a second task, and a second task belongs in a second window or a second
product. Beyond `--shell-band-max`, `margin-inline: auto` centers the band and the surplus is
**deliberately empty**. We say that out loud rather than inventing filler.

### What we explicitly reject

- **Fill by stretching.** Violates measure. A 3440-wide thread is unreadable.
- **Cap at 1240/1520 and letterbox** (what `--container-standard` / `--container-work` do today,
  and what the retired `AppShell`'s 1060px cap did). Wastes 62% of the founder's monitor and
  makes the extended display strictly worse than the laptop - the exact complaint.
- **A user "wide mode" toggle.** A toggle is an admission that the system does not know the
  answer. It knows the answer.

---

## 11. The escape from inline styles

### The measurement

Run against the real tree this session:

| Count | What |
| --- | --- |
| **992** | `style={{` occurrences in `src/routes/_authenticated*.tsx` |
| **255** | of those carrying *any* layout property |
| **97** | of those carrying a **reflow-critical** property (`gridTemplateColumns`, `gridTemplateRows`, `minWidth`, `maxWidth`, `flexBasis`) |

**The escape is a 97-site problem, not a 992-site problem.** Most inline styles are `color`,
`background`, `borderColor`, `fontSize` - token reads that carry no layout and are already
theme-adaptive because they resolve to custom properties. They can stay indefinitely.

### The three rules

**Rule 1 - new shell code: zero inline layout.** `src/components/shell/*` and
`src/styles/shell.css` are the only places the frame's geometry lives, addressed by
`data-region` / `data-slot` attributes. The existing `MissionShellView` already stamps
`data-region="topbar" | "spine" | "thread" | "canvas" | "composer"` - the hooks are there; only
the CSS is missing.

**Rule 2 - existing surfaces: the custom-property bridge, not a rewrite.** An inline style cannot
carry `@media` or `@container`. But it *can* assign a custom property, and a class-based rule
inside a container query can read it. So a dense grid migrates in one line:

```tsx
// before - cannot respond to its container (settings.tsx:2599, and 96 siblings)
<div style={{ display: "grid", gridTemplateColumns: "132px minmax(0,1fr) 46px 104px 132px 40px 22px" }}>

// after - the shape is declared as data; the CSS decides which shape applies at which width
<div data-grid="agent-roster" style={{ "--cols-wide": "132px minmax(0,1fr) 46px 104px 132px 40px 22px" } as CSSProperties}>
```

```css
@layer shell {
  [data-grid="agent-roster"] { display: grid; gap: var(--space-3); grid-template-columns: var(--cols-narrow, 1fr auto); }
  @container pane (min-width: 640px)  { [data-grid="agent-roster"] { grid-template-columns: var(--cols-mid, 132px minmax(0,1fr) 132px); } }
  @container pane (min-width: 900px)  { [data-grid="agent-roster"] { grid-template-columns: var(--cols-wide); } }
}
```

Note `@container pane`, not `@media`: that roster now adapts to *its slot*, so it works
identically in the canvas at S2, in the context column at S4, and in a drawer at S1. That is the
thing a media query can never give you, and it is why this is the right escape rather than
"convert everything to Tailwind."

**Rule 3 - a one-way ratchet, enforced.** Extend the existing `no-restricted-syntax` block in
`eslint.config.js`:

```js
{
  selector:
    "JSXAttribute[name.name='style'] Property[key.name=/^(width|minWidth|maxWidth|height|minHeight|maxHeight|gridTemplate|gridTemplateColumns|gridTemplateRows|gridTemplateAreas|flexBasis|columnCount)$/]",
  message:
    "Layout in style={{}} cannot answer a container query. Use a data-* hook in src/styles/shell.css, " +
    "or pass the shape as a custom property (--cols-*) and let CSS choose. See adaptive-c-shell-adaptation.md §11.",
}
```

New code fails immediately. The 97 existing sites are held by a **count ratchet**, not a
grandfather list, so the pressure is continuous:

```js
// scripts/check-layout-ratchet.mjs - runs in CI next to tsc + bun test
// Recounts reflow-critical inline properties across src/routes and src/components.
// Fails if count > baseline. Rewrites the baseline down when count < baseline.
// baseline: layout-ratchet.json  { "reflowCriticalInlineStyles": 97 }
```

Because the ratchet only ever goes down and the lint rule blocks new ones, the number reaches
zero on its own schedule without a stop-the-world migration - which matters given BUILD-ONLY
MODE is active.

**Order of migration** (highest reflow risk first, from the measured file list):
`_authenticated.settings.tsx` (2 fixed 7-track grids + 4 `auto-fit` grids) →
`_authenticated.admin.pricing.tsx` (4 fixed grids, worst offender per line) →
`_authenticated.traces.$traceId.tsx` (`hopGrid`, computed at runtime) →
`_authenticated.engine-room.tsx` (`196px minmax(0,1fr)`) →
`components/mission/faces.tsx:2654` (`1fr 1fr`) →
`_authenticated.build.index.tsx` (`--container-work` cap, which the band cap replaces).

---

## 12. Verification - how this fails CI when a surface breaks at a size

Today CI (`.github/workflows/ci.yml`) runs `bunx tsc --noEmit` and `bun test`. Playwright exists
(`playwright.config.ts`, 3 **fixed** viewports: 1280/768/320) but is not in CI, and fixed
viewports are precisely how a fixed-artboard app passes its own tests. Four gates, in cost order.

### Gate 1 - the token algebra (`bun test`, no browser, milliseconds)

Proves the layout is internally consistent before anything renders.

```ts
// src/lib/shell/composition.test.ts
import { test, expect } from "bun:test";
import { TIERS, REGIONS, tierFloor, tierFor, BAND_MAX, T } from "./composition";

test("every region: min <= ideal <= max", () => {
  for (const [id, r] of Object.entries(REGIONS))
    expect(r.min <= r.ideal && r.ideal <= r.max, id).toBe(true);
});

test("tier floors are strictly increasing", () => {
  const f = TIERS.map((t) => tierFloor(t.id));
  expect(f).toEqual([...f].sort((a, b) => a - b));
  expect(new Set(f).size).toBe(f.length);
});

test("every tier's residents fit at their floor", () => {
  for (const t of TIERS.filter((t) => t.resident.length > 1)) {
    const need = t.resident.reduce((s, r) => s + REGIONS[r].min, 0)
               + (t.resident.length - 1) * T.hairline;
    expect(tierFloor(t.id)).toBeGreaterThanOrEqual(need);
  }
});

test("auxiliary regions never starve a core region", () => {
  for (const t of TIERS) {
    const aux = t.resident.filter((r) => REGIONS[r].kind === "aux");
    if (!aux.length) continue;
    const coreIdeal = t.resident.filter((r) => REGIONS[r].kind === "core")
      .reduce((s, r) => s + REGIONS[r].ideal, 0);
    expect(tierFloor(t.id)).toBeGreaterThanOrEqual(coreIdeal);
  }
});

test("the band cap equals every region at max", () => {
  expect(BAND_MAX).toBe(2 * T.colMax + T.canvasMax + T.colMax + 3 * T.hairline);
});

test("the generated cqi coefficients match the ideal proportions", () => {
  // reads the generated shell.css; catches a hand-edited breakpoint
  const css = Bun.file("src/styles/shell.generated.css");
  // ... asserts 32.8 == colIdeal/(colIdeal+canvasIdeal)*100 within 0.1, per tier
});
```

Catches: someone retunes `--fs-body` and S3's floor slips under S2's; someone hand-edits a
breakpoint; someone adds a region without a min.

### Gate 2 - composition monotonicity (`bun test` + happy-dom, already configured)

Exhaustive over the whole supported range, in a single sweep, no browser.

```ts
// src/lib/shell/composition.monotonic.test.ts
test("resident set never shrinks as width grows, 360..5120, every 1px", () => {
  let prev = new Set<RegionId>();
  for (let w = 360; w <= 5120; w++) {
    const now = new Set(TIERS.find((t) => t.id === tierFor(w))!.resident);
    for (const r of prev) expect(now.has(r), `${r} lost at ${w}px`).toBe(true);
    prev = now;
  }
});

test("the invariant set survives every width and every intent", () => {
  for (let w = 360; w <= 5120; w += 7)
    for (const intent of INTENT_MATRIX) {           // 16 combinations
      const r = resolve(intent, { tier: tierFor(w), vtier: vtierFor(800) });
      expect(r.composerPresent).toBe(true);
      expect(r.activitySummaryPresent).toBe(true);
      expect(r.escapePresent).toBe(true);
      expect(r.loopIndicator).not.toBe("none");
      if (intent.hasOpenGate) expect(r.gateVisibleIn).not.toBeNull();
    }
});

test("resize is reversible: capacity never mutates intent", () => {
  const intent = { focus: null, contextOpen: true, ledgerOpen: true, threadPeeled: false };
  const before = structuredClone(intent);
  for (const w of [3440, 1200, 700, 420, 700, 1200, 3440]) resolve(intent, { tier: tierFor(w), vtier: "H3" });
  expect(intent).toEqual(before);                    // the reversibility law, asserted
});

test("shrinking never covers: a demoted open region parks closed", () => {
  const r = resolve({ focus: null, contextOpen: true, ledgerOpen: false, threadPeeled: false },
                    { tier: "S1", vtier: "H3" });
  expect(r.regions.context.presentation).toBe("rail");   // never "overlay"
});
```

**~4,800 assertions, no browser, runs in the existing `bun test` step.** This is the gate that
would have caught the original defect.

### Gate 3 - the browser sweep (Playwright, nightly + on any `src/styles/**` or `src/components/shell/**` diff)

Replaces three fixed viewports with a **derived, boundary-aware sweep**: every tier floor, every
floor − 1 and + 1, every vtier floor, plus 24 pseudo-random widths seeded per run so drift gets
found rather than memorized.

```ts
// e2e/10-adaptive-sweep.spec.ts
import { TIERS, tierFloor, BAND_MAX } from "../src/lib/shell/composition";

const WIDTHS = [
  360, 431,
  ...TIERS.flatMap((t) => { const f = tierFloor(t.id); return [f - 1, f, f + 1]; }),
  1280, 1440, 1512, 1920, 2560, 3440, BAND_MAX, BAND_MAX + 1, 5120,
  ...seededSample(24, 380, 5120),
].filter((w) => w >= 360).sort((a, b) => a - b);

const HEIGHTS = [351, 396, 448, 800, 1440];

for (const w of WIDTHS) for (const h of [800, ...(w === 1440 ? HEIGHTS : [])]) {
  test(`shell holds at ${w}x${h}`, async ({ page }) => {
    await page.setViewportSize({ width: w, height: h });
    await page.goto("/");

    // 3a. no unintended horizontal overflow, page OR component level
    const overflow = await page.evaluate(() =>
      [...document.querySelectorAll<HTMLElement>("*")]
        .filter((el) => el.scrollWidth > el.clientWidth + 1 && el.dataset.scroll !== "x")
        .map((el) => el.tagName + "." + (el.className?.toString().slice(0, 40) ?? ""))
        .slice(0, 10));
    expect(overflow, `clipped at ${w}px`).toEqual([]);

    // 3b. the invariant set: present, visible, inside the viewport
    for (const sel of ['[data-region="composer"]', '[data-invariant="activity"]',
                       '[data-invariant="escape"]', '[data-invariant="loop"]']) {
      const box = await page.locator(sel).boundingBox();
      expect(box, `${sel} missing at ${w}px`).not.toBeNull();
      expect(box!.y + box!.height).toBeLessThanOrEqual(h + 1);
      expect(box!.x).toBeGreaterThanOrEqual(-1);
    }
    // and the gate, when one is open
    await seedOpenGate(page);
    await expect(page.locator('[data-invariant="gate"] button[data-primary]')).toBeInViewport();

    // 3c. touch target = HIT AREA, not box size (replaces the inflating assertion)
    if (await page.evaluate(() => matchMedia("(pointer: coarse)").matches)) {
      const misses = await page.evaluate((HIT) => { /* probe 4 corners of a HIT-px square
        around each control's center with elementFromPoint; a miss is a violation */ }, 44);
      expect(misses).toEqual([]);
    }

    // 3d. reading measure: no text run exceeds --chars-max
    const long = await page.evaluate(() => { /* Range.getBoundingClientRect() per text node,
      divided by the measured avg advance; report any > 75 chars */ });
    expect(long, `over-measure lines at ${w}px`).toEqual([]);

    // 3e. CSS and JS agree about the tier - closes the drift loop
    const cssTier = await page.evaluate(() =>
      getComputedStyle(document.querySelector("[data-shell]")!)
        .getPropertyValue("--shell-tier-active").trim());
    expect(cssTier).toBe(tierFor(w));
  });
}
```

Plus one zoom pass (`page.evaluate(() => document.body.style.zoom = "2")` at 1440×900 and
2560×1440) asserting 3a + 3b only, because zoom's job is to prove the demotion ladder fires, not
to re-prove measure.

Playwright projects become `chromium-desktop` (unchanged) plus `chromium-adaptive` running this
one spec - the sweep is a single spec, so it is one job, not 50.

### Gate 4 - the ratchet (`bun test` or a CI step)

`scripts/check-layout-ratchet.mjs`, §11 Rule 3. Fails the build if the count of reflow-critical
inline styles rises above the committed baseline.

### What each gate would have caught

| Gate | Would have caught |
| --- | --- |
| 1 | a hand-typed `1440px` breakpoint anywhere in the shell |
| 2 | "the context panel disappears between 1740 and 1760"; "the gate is unreachable at 700px"; "shrink-then-grow lost my columns" |
| 3a | the `132px minmax(0,1fr) 46px 104px 132px 40px 22px` roster clipping at any pane width |
| 3b | the retired `AppShell` stranding sign-out |
| 3c | the 44px `min-height` inflating every control below 768px |
| 3d | a thread stretched to 3440px on an ultrawide |
| 3e | CSS saying S3 while JS-driven aria says S2 |
| 4 | the 98th inline `gridTemplateColumns` |

---

## 13. Build order

| # | Deliverable | Depends on | Gate it unlocks |
| --- | --- | --- | --- |
| 1 | `src/lib/shell/composition.ts` + `intent.ts` (pure, no React) | - | 1, 2 |
| 2 | `src/styles/shell.css` token block (§3) + `scripts/read-shell-tokens.mjs` | 1 | 1 |
| 3 | `scripts/gen-shell-css.ts` → `src/styles/shell.generated.css`, wired into `prebuild` | 1, 2 | 1 |
| 4 | `src/components/shell/AppShell.tsx` + `ShellRegion.tsx` + `useResizeSettle.ts` | 1-3 | 2 |
| 5 | Port `MissionShellView`'s five regions onto `AppShell` (the `data-region` hooks already exist) | 4 | 3 |
| 6 | `context` and `ledger` regions: same component, three presentations | 5 | 2, 3 |
| 7 | Focus mode + `?focus=` + the keymap (`⌘.` `⌘1-4` `⌘J` `⌘G` `Esc`) | 5 | 3 |
| 8 | `e2e/10-adaptive-sweep.spec.ts` + the `chromium-adaptive` project | 5 | 3 |
| 9 | ESLint layout rule + `layout-ratchet.json` baseline at 97 | - | 4 |
| 10 | Migrate the 6 files in §11's order to `data-grid` + `@container pane` | 9 | 4 |

Steps 1-3 ship no UI and are safe to land first; they make every later step falsifiable.

---

## 14. The five sentences a reviewer should be able to repeat back

1. The shell is a field of measure columns; surplus space buys columns, never width.
2. The gate never collapses, because judgment at gates is the job; the ladder that decides what
   collapses is ordered by distance from the gate.
3. Ultrawide is answered by recomposing to four capped columns totalling 3159px and centering
   the remainder - because 75 characters is a reading limit and half the screen is a scanning
   limit, neither of which a wider monitor changes.
4. Capacity clamps intent and never writes back, so shrinking and re-growing a window returns
   you exactly where you were.
5. The tier table is written once in TypeScript and generates the CSS, so a 4,800-assertion
   browser-free test proves the composition at every pixel from 360 to 5120 before anything
   renders.
