# Adaptive Proposal B - Container Queries as the Primary Mechanism

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Angle B of three. Written against verified code on 2026-07-28. Every file, line number, count
> and version below was read or run this session, not recalled.
> Verified stack: `tailwindcss@4.3.3` (node_modules), Vite 7, TanStack Start, React 19,
> `ssr: false` on `src/routes/_authenticated.tsx:22`, viewport meta correct at
> `src/routes/__root.tsx:124`.

---

## 0. The one-sentence thesis

**A component must respond to the width it was handed, not to the width of the window, because in
this app the same component is handed 272px, 380px, 544px, 900px and 3060px on the same screen at
the same instant - and a viewport media query cannot tell those five cases apart.**

Everything below is the buildable form of that sentence: the container hierarchy, the size ladder
and where its numbers come from, seven archetype contracts in real CSS, the exact places where a
viewport media query is still the right tool, the escape from 275-inline-styles-per-file, the
first-paint story under `ssr: false`, and the CI that fails when any of it breaks.

---

## 1. The proof that viewport queries cannot work here

This is not a stylistic preference. It is arithmetic on the live shell.

`src/components/mission/MissionShellView.tsx:365`:

```tsx
<div className="grid min-h-0 flex-1" style={{ gridTemplateColumns: "380px minmax(0, 1fr)" }}>
```

One shell, two regions. Run the numbers for the canvas region across the founder's real range:

| Viewport | Thread pane | Canvas pane | Same `lg:` fires? |
| --- | --- | --- | --- |
| 1280 (split half of 2560) | 380 | 900 | yes |
| 1470 (13" MacBook Air, default scaling) | 380 | 1090 | yes |
| 1920 (external 1080p) | 380 | 1540 | yes |
| 2560 (27" 1440p) | 380 | 2180 | yes |
| 3440 (34" ultrawide - the founder's case) | 380 | 3060 | yes |

The canvas varies by **3.4x** while every viewport breakpoint returns the identical answer. A card
placed in the canvas has no way to know whether it has 900px or 3060px. Meanwhile the Thread is
**380px at every one of those widths** - so a `lg:grid-cols-3` on a card inside the Thread fires at
3440 and produces three 120px columns.

Now add the third placement. `src/components/obsidian/MissionSlideOver.tsx` and the approvals tray
hand the *same* mission card roughly 520px regardless of screen. And
`src/routes/_authenticated.settings.tsx:2599` renders a seven-column roster grid:

```tsx
gridTemplateColumns: "132px minmax(0,1fr) 46px 104px 132px 40px 22px"
```

Fixed columns sum to 476px; with six 12px gaps that is 548px before the flexible column gets a
single pixel. That table is legible in the canvas at 1540px and destroyed in the Thread at 380px
and in a drawer at 520px - **at the same viewport width**. No media query can express the
difference. A container query expresses it in one line.

There is a fourth, subtler proof already sitting in the code as a bug.
`MissionShellView.tsx:307-344` hides four top-bar doors with `hidden sm:flex` - a *viewport*
decision about whether a *flex row* has room. On a 3440px ultrawide those buttons show whether or
not the row is crowded; on a 900px window they vanish even when there is room, because the product
switcher happens to be short. The deciding quantity is the row's own free space. (For that
particular case the right answer is neither query - see §6, "the third category".)

**Measured baseline for the record:** 5 total Tailwind breakpoint usages across ~75
`src/routes/_authenticated*.tsx` files (`build.$missionId` x2, `today` x2, `engine-room` x1),
0 container queries anywhere in `src/`. The app is not "badly responsive". It is **not responsive
at all**, and the mechanism that would have made it responsive has never been used.

---

## 2. The target range, stated as a guarantee

### 2.1 Inline (width)

| Band of the **frame** | CSS px | Real situations | Status |
| --- | --- | --- | --- |
| below `rail` (272) | < 272 | nothing real | **unsupported.** Content scrolls; no guarantee. |
| `rail` -> `col` | 272 - 544 | phone portrait, a 1440p half-window at 400% zoom | **functional.** One pane, thread as a sheet, no depth lane. Not the design target. |
| `col` -> `duo` | 544 - 1088 | 13" laptop at 200% zoom (1470/2 = 735), half of a 1080p window (960), iPad portrait | **fully supported, single-pane composition.** |
| `duo` -> `trio` | 1088 - 1632 | 13"/14"/16" laptops at every scaling mode, half of a 1440p (1280), half of a 4K (1920) | **fully supported, the primary composition.** Thread + Canvas. |
| `trio` -> `quad` | 1632 - 2176 | 1080p and 1440p full-screen, 4K at 200% scaling | **fully supported, 3 lanes.** Depth becomes a permanent column. |
| `quad` and above | >= 2176 | 27" 1440p (2560), 34" ultrawide (3440), 5K (2560 logical), 49" super-ultrawide (5120) | **fully supported, 4 lanes, then only gutters grow.** |

### 2.2 Block (height)

The frame is the only thing that queries height, and only at two coarse thresholds so that mobile
URL-bar `dvh` jitter can never cross one:

- `>= 34rem` (544px) block: the composer docks, the working strip is persistent.
- `< 34rem` block: the composer collapses into the thread tail, the working strip becomes a single
  line. This is the landscape-phone and short-split-window case.

### 2.3 Zoom and OS scaling

- **Browser zoom 100-200% is already covered and needs no extra code.** Browser zoom multiplies the
  CSS pixel, so a 1440px window at 200% presents **720 CSS px** to the page. That walks *down* the
  band ladder into `col`, which is a fully supported band. The equivalence
  `effective CSS px = physical px / zoom` is exact, and §9 uses it to test zoom without any zoom API.
- **OS display scaling** (macOS "More Space"/"Larger Text", Windows 125/150/175%) changes the CSS px
  count the same way. Same mechanism, no extra code.
- **User default font size** (a user who sets 20px base in browser settings) is the case where `rem`
  earns its keep: because every band threshold is in `rem`, a larger base font shifts every
  threshold up, so that user gets the simpler composition at the same physical width. Their text
  stays readable instead of a three-lane layout crushing 20px type into 272px columns. **A px-based
  ladder gets this exactly backwards.** This is the reason the ladder is `rem` and not `px`.

### 2.4 What happens outside the range

Above `quad + 2 x gutter-max`, **nothing new happens, and that is the guarantee.** A 3440px monitor
and a 5120px monitor render the identical composition; only the outer gutter width differs. The
promise we make to the founder is not "it keeps growing forever" - it is "there is no width at
which it looks wrong, and no width at which you have to reach for a window-resize workaround."

Below 272px inline we declare it unsupported and do not test it. Saying so is the point: an
undeclared floor is how you end up shipping a 1440x900-only app by accident.

---

## 3. The ultrawide answer

**On 3440px we neither cap-and-letterbox nor stretch. We recompose: extra inline size buys more
lanes of different content, never wider lanes of the same content. Each lane caps at one reading
measure. Lane count stops at four. Beyond that, gaps grow to a cap and then symmetric gutters
absorb the remainder - and the right-hand gutter is where genuinely peripheral content lives.**

### 3.1 Why not stretch

Reading measure is not taste, it is a return-sweep failure. Past roughly 75-80 characters the eye
loses the line it is returning to and re-reads or skips. At 3440px a single prose column is ~400
characters. It is not "wide", it is unreadable. The same effect hits data rows: a table row whose
label is at x=0 and whose value is at x=3300 cannot be scanned as one row.

### 3.2 Why not cap-and-letterbox

The founder's exact complaint is that moving to the extended monitor should *do something*. Capping
content at 1280px and painting 2160px of background is the visual signature of an app designed for
a laptop. It also wastes the one thing an ultrawide actually gives you: **parallel context**. Five
agents building in parallel is a five-lane problem, and the founder owns the monitor for it.

### 3.3 The eye-travel arithmetic that sets the cap at four lanes

A 34" 3440x1440 ultrawide is ~800mm of glass viewed at ~600mm. That subtends ~67 degrees
horizontally. The region a reader can take in without turning the head is roughly +/- 15 degrees
from fixation - about +/- 160mm, so ~320mm total, which on this panel is **~1380 CSS px**. Comfortable
saccadic scanning without head movement extends to roughly +/- 30 degrees, about **~2700 CSS px**.

So:

- Content the user must *read and act on* should sit inside ~1400px around the working fixation.
- Content the user *scans between* can occupy up to ~2700px.
- Content beyond ~2700px is peripheral: it can carry motion and state change, but never a required
  read and never a control.

Four lanes of one measure each = `4 x 34rem = 136rem = 2176px`, plus three gaps. That lands the
whole actionable composition inside the ~2700px scanning cone with room to spare, and keeps the
two central lanes (the thread and the active canvas, ~1100px) inside the ~1400px no-head-turn cone.
**136rem is not a preference, it is where the fourth lane still fits inside the scanning cone.**

### 3.4 The composition ladder, as a formula

```css
/* One lane is one measure. Lane count is a pure function of the band.
 * Gaps are fluid within a token-bounded range so the step between bands
 * is absorbed continuously rather than snapping. */
[data-lanes] {
  display: grid;
  grid-template-columns: repeat(var(--lanes, 1), minmax(0, var(--container-col)));
  column-gap: clamp(var(--gap-min), 2cqi, var(--gap-max));
  justify-content: center;          /* excess becomes symmetric gutter, not a wider lane */
}
@container measure (width >= 68rem)  { [data-lanes] { --lanes: 2; } }
@container measure (width >= 102rem) { [data-lanes] { --lanes: 3; } }
@container measure (width >= 136rem) { [data-lanes] { --lanes: 4; } }
/* No rule above 136rem. This is the cap, expressed as an absence. */
```

There is no `max-width` anywhere in that block. The cap emerges from "lanes stop being added" plus
`justify-content: center`. That is what "no magic numbers" means in practice: the limit is a
consequence of the rule, not a number typed at the end.

### 3.5 The peripheral lane

At `>= quad`, the right-hand gutter is wide enough (>= ~500px on a 3440) to host `[data-peripheral]`:
the live activity ticker, the run ledger, the cost meter. Rules, enforced in §9:

- Nothing in the peripheral lane may be the only path to an action.
- Nothing in it may be the only rendering of a required piece of information.
- It is dismissible, and dismissal persists.
- It renders in `--ink-subtle` and below; it never carries `--voice-human` (the ember is the
  needs-you colour and needs-you must never live in peripheral vision).

That is the honest answer to "use the monitor": put in the periphery only what belongs in the
periphery.

---

## 4. The size ladder, and where every number comes from

### 4.1 One measured seed, seven derived steps

```css
/* src/styles/adaptive.css - the ONLY file allowed to define a size threshold. */
@theme {
  /* THE SEED. Machine-measured, never hand-typed.
   * Definition: the rendered inline size of 66ch of Geist Sans at --text-body (0.875rem)
   * plus 2 x --pane-pad. Regenerate with `bun run adaptive:calibrate`; CI asserts it
   * (e2e/adaptive/measure.spec.ts) and fails the build if the type scale or the font drifts. */
  --container-col: 34rem;      /* 544px - 1 measure. THE ANCHOR. */

  /* Every other step is an exact multiple of the anchor. No independent values exist. */
  --container-nub:  8.5rem;    /* 136px - col x 0.25 */
  --container-rail: 17rem;     /* 272px - col x 0.5  */
  --container-slat: 25.5rem;   /* 408px - col x 0.75 */
  --container-wide: 51rem;     /* 816px - col x 1.5  */
  --container-duo:  68rem;     /* 1088px - col x 2    */
  --container-trio: 102rem;    /* 1632px - col x 3    */
  --container-quad: 136rem;    /* 2176px - col x 4    */
}
```

Registering these under Tailwind v4's `--container-*` namespace does two jobs at once, and the
coincidence is the point:

1. It creates the container-query variants `@nub: @rail: @slat: @col: @wide: @duo: @trio: @quad:`.
2. It creates the matching width utilities `max-w-col`, `max-w-duo`, ...

So **the width at which a component changes composition is literally the same token as the width it
caps its content to.** A component switches to two columns exactly when a second full column would
fit. There is no scenario where the switch point and the cap can drift apart, because they are one
custom property.

### 4.2 The supporting scale

```css
@theme {
  --measure-prose: 66ch;        /* the real cap on prose. Font-metric-correct at any size/zoom. */
  --pane-pad:  1.5rem;          /* 24px = --space-6, the existing scale (styles.css:2030) */
  --card-pad:  1rem;            /* 16px = --space-4 */
  --gap-min:   1rem;            /* 16px */
  --gap-max:   2.5rem;          /* 40px = --space-10 */
  --label-col: 14ch;            /* form label column: content-derived, not px */
}
```

### 4.3 The three px values that survive, and why each is genuinely invariant

Every other px literal in the adaptive layer is banned by CI (§9.3). These three stay:

| Value | Where | Why it is invariant |
| --- | --- | --- |
| `1px` | hairlines (`--ink-hairline`) | A hairline is "the thinnest visible line". It is a device concept, not a layout concept, and it must not scale with the type ramp or it stops being a hairline. |
| `2px` | focus ring (`.ink-focus`, ink.css:126) | WCAG 2.2 SC 2.4.13 specifies a minimum ring thickness in CSS px. Deriving it from a content scale would let a small-type surface ship a sub-minimum ring. |
| `44px` | minimum touch target under `pointer: coarse` | A fingertip is ~9mm. This is a human anatomy constant, not a design token, and it is already the threshold asserted in `e2e/03-surfaces-responsive.spec.ts:39`. |

Note what is *not* on that list: the current `52px` top bar, the `380px` thread, the `248px`
sidebar, the `1060px` content cap, the `132px/46px/104px` roster columns, the `150px`/`120px`/`240px`
`auto-fit` minimums. All of those become derived values (§7).

### 4.4 Band names, and what each one means

Bands are how a designer reasons; thresholds are how CSS reasons. Each archetype declares which
bands it uses; most use two or three, never all eight.

| Band | Inline size of the nearest `measure` container | What becomes possible |
| --- | --- | --- |
| `nub` | < 8.5rem | icon only, no text |
| `rail` | 8.5 - 17rem | one line, primary text truncated |
| `slat` | 17 - 25.5rem | stacked block, secondary meta hidden |
| `col` | 25.5 - 34rem | full single column, meta visible |
| `wide` | 34 - 51rem | content at measure + a side meta rail |
| `duo` | 51 - 68rem | two content columns |
| `trio` | 68 - 102rem | three |
| `quad` | >= 136rem | four; composition stops |

---

## 5. The container hierarchy

### 5.1 The declaration table - who declares a container, and why

The rule is one sentence: **a box declares a container if and only if it allocates width to
content it does not itself control.** Allocators declare. Consumers only read. A component that
does both (a card holding a stat row) declares.

| Element | Selector | `container-type` | `container-name` | Why |
| --- | --- | --- | --- | --- |
| App frame | `[data-frame]` | `size` | `frame` | Owns region composition and the only block-size decisions. Has a definite `100dvh` height, so `size` is legal. |
| Region pane | `[data-pane]` | `inline-size` | `pane measure` | Thread, canvas, drawer body, tray, sheet. Allocates to arbitrary caller content. |
| Lane | `[data-lane]` | `inline-size` | `pane measure` | A lane inside a pane is itself an allocator; a card in the left lane must ask the lane, not the canvas. |
| Card | `[data-card]` | `inline-size` | `card measure` | Allocates to its own children. |
| Table | `[data-table]` | `inline-size` | `table measure` | Rows must query the table, not the pane, because the table may scroll horizontally inside the pane. |
| Popover body | `[data-popover-body]` | `inline-size` | `pane measure` | Radix portals to `document.body`, escaping every container. Giving popover content its own container is what makes archetypes work inside menus and dialogs. |
| Everything else | - | none | - | consumers |

### 5.2 The dual-name trick

`container-name` takes a **list**. Every allocator carries a specific name *and* the shared alias
`measure`:

```css
@layer components {
  [data-frame] {
    container-type: size;
    container-name: frame;
    block-size: 100dvh;
    inline-size: 100%;
    display: grid;
    overflow: clip;
  }

  [data-pane],
  [data-lane] {
    container-type: inline-size;
    container-name: pane measure;
    min-inline-size: 0;            /* the grid-blowout guard; without it a pane never shrinks */
    scrollbar-gutter: stable;      /* see §5.6 - prevents the container query oscillation loop */
  }

  [data-card] {
    container-type: inline-size;
    container-name: card measure;
    min-inline-size: 0;
  }

  [data-table] {
    container-type: inline-size;
    container-name: table measure;
    min-inline-size: 0;
  }

  [data-popover-body] {
    container-type: inline-size;
    container-name: pane measure;
  }
}
```

A named container query resolves to the **nearest ancestor carrying that name**. So:

- `@container measure (...)` = "the box that immediately allocated my width", whatever kind it is.
  This is what almost every archetype uses, and it is what makes one component work unchanged in a
  rail, a card, a drawer and a full canvas.
- `@container pane (...)` = "the region", skipping any intervening card. Used by things that must
  align to the region (a sticky surface header).
- `@container table (...)` = "the table", used only by rows and cells.
- `@container frame (...)` = "the whole app", used only by shell chrome.

Naming is not optional. An **unnamed** `@container (...)` binds to the nearest container of any
name, which under nesting will silently be the card when you meant the pane. Unnamed container
queries are banned by CI in the app tree (§9.3).

### 5.3 A component may not query itself

CSS forbids a container from being styled by its own query - otherwise the query would change the
size that the query reads. So every allocator renders exactly one structural child that carries the
query-driven layout:

```tsx
export function Pane({ children, ...rest }: PaneProps) {
  return (
    <div data-pane {...rest}>
      <div data-pane-body className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)]">
        {children}
      </div>
    </div>
  );
}
```

`[data-pane]` measures. `[data-pane-body]` composes. Same for `[data-card]` /
`[data-card-body]`. This is the single most common way teams get container queries wrong, so it is
structural in the primitive rather than a rule people have to remember.

### 5.4 The fallback when a component is used outside any container

Per spec, if no ancestor matches the queried name, **the query never matches** - it does not throw,
it does not fall back to viewport, it simply contributes nothing. Therefore:

> **Every archetype's default (unqueried) styles are its narrowest correct composition.**

A card dropped into a page with no `[data-pane]` above it renders in `slat` form: stacked, single
column, meta hidden, nothing clipped, nothing overlapping. It looks under-used, never broken. That
is a safe failure and it is the reason narrow-first is a rule here rather than a style.

Plus two guards:

```tsx
// src/app/_primitives/useContainerGuard.ts - dev only, tree-shaken in production.
export function useContainerGuard(ref: React.RefObject<HTMLElement>, archetype: string) {
  if (import.meta.env.PROD) return;
  useEffect(() => {
    let el = ref.current?.parentElement ?? null;
    while (el) {
      const t = getComputedStyle(el).containerType;
      if (t && t !== "normal") return;
      el = el.parentElement;
    }
    console.warn(
      `[adaptive] <${archetype}> has no container ancestor. It will render in its narrowest ` +
        `band forever. Wrap it in <Pane> or <Card>.`,
    );
  }, [ref, archetype]);
}
```

and a runtime CI sweep that asserts the same thing across every real surface (§9.2, check 3).

### 5.5 The `contain` side effects, stated so nobody trips on them

`container-type: inline-size` implies `contain: layout inline-size style`. Three consequences that
must be written down or they become bugs:

1. **`position: fixed` descendants are trapped.** `contain: layout` makes the element a containing
   block for fixed and absolute positioning. Today `FocusDock` is "fixed bottom-center"
   (`_authenticated.tsx:216` comment) and would pin to whatever pane contains it.
   **Rule:** `position: fixed` is legal only as a direct child of `[data-frame]`. Everywhere else it
   is banned and enforced (§9.3). Overlays portal.
2. **Each container is a stacking context.** z-index inside a pane is scoped to that pane. This is a
   feature - it kills the global z-index arms race - but it means a card cannot raise itself above
   the pane's sibling. Cross-region elevation portals to the frame.
3. **Margins do not collapse across a container boundary.** Panes must use `gap`, not margins, or
   spacing changes when a box gains a container. The archetypes below use `gap` exclusively.

`container-type: size` on the frame adds `contain: size`, meaning contents cannot grow the frame.
That is exactly what we want (regions scroll internally, the page never does) and it is only legal
because the frame's size is set explicitly.

### 5.6 The oscillation trap

The classic container-query infinite loop: a query at 544px reveals a column that makes content
taller, a scrollbar appears and takes 15px, the container is now 529px, the query un-matches, the
scrollbar goes away, repeat. The browser's containment prevents a true infinite loop, but the user
sees flicker.

Fix, applied on every pane above: `scrollbar-gutter: stable`. The gutter is reserved whether or not
the scrollbar is present, so the container's inline size never depends on its own content's height.
CI check 6 in §9.2 catches any pane that lacks it.

---

## 6. Where viewport media queries are still correct, wrong, or beside the point

### 6.1 STILL CORRECT - properties of the human, the device, or the session

None of these are about how much room a component got, so none of them are container questions.
They stay in `@media`, they live in one file, and they are allowlisted by CI.

```css
/* src/styles/environment.css - the ONLY file permitted to contain @media. */

/* 1. Motion preference. Already correct in the repo (styles.css:512, 1577, 1836, ink.css:178). */
@media (prefers-reduced-motion: reduce) { /* ... */ }

/* 2. Colour scheme, contrast, transparency, forced colours. */
@media (prefers-color-scheme: dark) { /* ... */ }
@media (prefers-contrast: more) { :root { --ink-hairline: rgba(255,255,255,0.22); } }
@media (forced-colors: active) { /* system palette takeover */ }

/* 3. Pointer and hover - input modality, not size.
 *    Already used correctly at styles.css:1313 and 1354. */
@media (hover: hover) and (pointer: fine) {
  /* hover-reveal row actions may exist at all */
}
@media (pointer: coarse) {
  :root { --ink-control-sm: 44px; --ink-control-md: 44px; --ink-control-lg: 48px; }
  /* the 44px human constant from §4.3 */
}

/* 4. Installed-app chrome. */
@media (display-mode: standalone) { [data-frame] { padding-block-end: env(safe-area-inset-bottom); } }

/* 5. No-JS. Relevant precisely because the authenticated tree is ssr:false. */
@media (scripting: none) { [data-frame] { display: none; } .noscript-notice { display: grid; } }

/* 6. Print. */
@media print { [data-pane="thread"], [data-region="composer"] { display: none; } }

/* 7. Resolution, for raster asset swaps only. */
@media (min-resolution: 2dppx) { /* ... */ }
```

`env(safe-area-inset-*)` belongs to the same category and is already correct in the repo
(`--safe-area-bottom`, styles.css).

### 6.2 WRONG - every size decision about a component

Any `min-width` / `max-width` media query that decides how a component composes itself is a bug in
the new app, and CI fails the build on one (§9.3). The three existing examples are all in the
"wrong" column and get migrated:

- `styles.css:394` and `:401` - `@media (max-width: 768px|640px)` shrinking `--page-inset-*`. Page
  inset is a property of the *pane*, not the window. A drawer at 520px inside a 3440px screen wants
  the small inset. Becomes a container rule on `[data-pane]`.
- `styles.css:1536` - `@media (max-width: 1100px)`. Same class of error.
- `styles.css:2418` - `@media (max-width: 768px)`. Same.
- `MissionShellView.tsx:307-344` - `hidden sm:flex`. Wrong axis (see below).

Rule of thumb that always resolves it: **if resizing the browser window would change the answer but
moving the same component into a drawer would not, it is a media query. Otherwise it is a container
query.** Every layout decision in this app fails that test.

### 6.3 The third category - NEITHER, because the browser already measures better than you

A real failure mode of container-query enthusiasm is replacing intrinsic layout with queries.
Do not. These are already adaptive and need no query at all:

- `grid-template-columns: repeat(auto-fit, minmax(<token>, 1fr))` - this **is** a container query
  with better ergonomics. It already responds to the parent's width, not the viewport. The repo
  uses it correctly at `settings.tsx:960, 1435, 2175, 2774`; the only defect there is that the
  minimums are magic px (150/120/240) instead of tokens.
- `flex-wrap: wrap` with `min-inline-size` on items.
- `text-overflow: ellipsis` + `min-inline-size: 0`.
- **An overflow menu.** The correct fix for `MissionShellView.tsx:307-344` is not a container query
  at all: the top bar's doors go into a `[data-overflow-row]` where items move into a `...` menu
  when they do not fit, measured by the browser (a single `ResizeObserver` on the row is acceptable
  here because it is a *content-fit* question with no CSS answer, and it changes nothing about
  layout composition). Reach for a query only when the *composition* changes, not when a list is
  merely long.

Use a container query when a component must become a **structurally different thing**. Use
intrinsic layout when it must become the **same thing, resized**.

---

## 7. The seven archetypes

Each archetype declares its container-name dependency, its band set, and its narrowest-first
default. All of it lives in `src/styles/archetypes.css` inside `@layer components` so Tailwind
utilities can still override per-instance (this matters - see §8.2).

### 7.1 Work card - `[data-card="work"]`

The mission/run card. Reads `measure` (so it works in the thread, the canvas, a drawer and a lane);
declares `card measure` for its own children.

```css
@layer components {
  /* DEFAULT = rail band. Narrowest correct composition, used whenever no container matches. */
  [data-card="work"] > [data-card-body] {
    display: grid;
    gap: var(--gap-min);
    grid-template-areas:
      "status title"
      "status meta"
      "actions actions";
    grid-template-columns: max-content minmax(0, 1fr);
    padding: var(--card-pad);
  }
  [data-card="work"] [data-slot="title"]   { grid-area: title; min-inline-size: 0;
                                             overflow: hidden; text-overflow: ellipsis;
                                             white-space: nowrap; }
  [data-card="work"] [data-slot="meta"]    { grid-area: meta; display: none; }
  [data-card="work"] [data-slot="actions"] { grid-area: actions; }
  [data-card="work"] [data-slot="preview"] { display: none; }

  /* slat: the meta line appears. */
  @container measure (width >= 25.5rem) {
    [data-card="work"] [data-slot="meta"] { display: flex; gap: var(--gap-min); flex-wrap: wrap; }
  }

  /* wide: title and meta share a row; actions move to the trailing edge. */
  @container measure (width >= 34rem) {
    [data-card="work"] > [data-card-body] {
      grid-template-areas: "status title actions" "status meta actions";
      grid-template-columns: max-content minmax(0, 1fr) max-content;
    }
    [data-card="work"] [data-slot="meta"] { flex-wrap: nowrap; }
  }

  /* duo: the inline preview strip (diff summary, CI dots, file count) earns its place. */
  @container measure (width >= 51rem) {
    [data-card="work"] > [data-card-body] {
      grid-template-areas: "status title  preview actions" "status meta   preview actions";
      grid-template-columns:
        max-content minmax(0, 1fr) minmax(var(--container-rail), var(--container-col)) max-content;
    }
    [data-card="work"] [data-slot="preview"] { grid-area: preview; display: block; }
  }
}
```

Tailwind equivalent for a one-off variant, using the registered scale:

```tsx
<article data-card="work" className="rounded-[var(--ink-radius-panel)] border border-[var(--ink-hairline)]">
  <div data-card-body>
    <h3 data-slot="title" className="truncate text-[0.8125rem] @col/measure:text-sm">{title}</h3>
    <div data-slot="meta" className="@slat/measure:flex hidden gap-2 @wide/measure:flex-nowrap" />
  </div>
</article>
```

### 7.2 Data table - `[data-table]`

This replaces `settings.tsx:2599/2648`. Two changes: **column widths become content-derived**, and
**columns carry priorities so the table degrades instead of clipping**. Below `col` it stops being a
table and becomes a stacked list - which is the only honest thing a 7-column table can do at 380px.

```css
@layer components {
  [data-table] {
    /* Columns in ch (text) and control units (actions). No px. The old 132/46/104/132/40/22
     * becomes 6 declarations whose widths track the type ramp automatically. */
    --col-agent:    minmax(10ch, max-content);
    --col-job:      minmax(0, 1fr);
    --col-stage:    4ch;
    --col-approval: minmax(8ch, max-content);
    --col-activity: minmax(10ch, max-content);
    --col-toggle:   var(--ink-control-sm);
    --col-chevron:  1.5ch;
  }

  /* DEFAULT = stacked list. Cells become label/value rows. */
  [data-table] [data-row] { display: grid; gap: 2px; padding: var(--card-pad);
                            border-block-end: 1px solid var(--ink-hairline); }
  [data-table] [data-cell] { display: grid; grid-template-columns: var(--label-col) minmax(0, 1fr);
                             gap: var(--gap-min); }
  [data-table] [data-cell]::before { content: attr(data-label); color: var(--ink-faint); }
  [data-table] [data-head] { display: none; }
  [data-table] [data-cell][data-priority="3"],
  [data-table] [data-cell][data-priority="4"] { display: none; }

  /* col: becomes a real table, priority 1+2 only. */
  @container table (width >= 34rem) {
    [data-table] [data-head] { display: grid; }
    [data-table] [data-head],
    [data-table] [data-row] {
      grid-template-columns: var(--col-agent) var(--col-job) var(--col-toggle);
      align-items: center; gap: var(--gap-min);
    }
    [data-table] [data-cell] { display: block; min-inline-size: 0;
                               overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    [data-table] [data-cell]::before { content: none; }
  }

  /* wide: priority 3 columns join. */
  @container table (width >= 51rem) {
    [data-table] [data-head],
    [data-table] [data-row] {
      grid-template-columns:
        var(--col-agent) var(--col-job) var(--col-stage) var(--col-approval) var(--col-toggle);
    }
    [data-table] [data-cell][data-priority="3"] { display: block; }
  }

  /* duo: the full roster, priority 4 included. */
  @container table (width >= 68rem) {
    [data-table] [data-head],
    [data-table] [data-row] {
      grid-template-columns:
        var(--col-agent) var(--col-job) var(--col-stage) var(--col-approval)
        var(--col-activity) var(--col-toggle) var(--col-chevron);
    }
    [data-table] [data-cell][data-priority="4"] { display: block; }
  }
}
```

Column priority is a product decision expressed in markup, which is where it belongs:

```tsx
<div data-cell data-label="Job"  data-priority="1">{blurb}</div>
<div data-cell data-label="Stage" data-priority="3">{stage}</div>
<div data-cell data-label="Last activity" data-priority="4">{when}</div>
```

**The table never scrolls the page.** If a caller insists on all columns in a narrow pane, the
wrapper `[data-table-scroll] { overflow-x: auto; }` scrolls *inside* the pane. Because
`[data-table]` is the container (not the pane), the columns still measure against the table's own
inline size, so the query answers stay correct while scrolled.

### 7.3 Stat row - `[data-statrow]`

The `repeat(auto-fit, minmax(150px, 1fr))` pattern is kept - it is already the right mechanism - with the magic minimum replaced by a token and the *cell's own* composition made adaptive.

```css
@layer components {
  [data-statrow] {
    display: grid;
    gap: var(--gap-min);
    grid-template-columns: repeat(auto-fit, minmax(var(--container-nub), 1fr));
  }
  /* wide and above, a stat wants room to breathe rather than more of them per row. */
  @container measure (width >= 51rem) {
    [data-statrow] { grid-template-columns: repeat(auto-fit, minmax(var(--container-rail), 1fr)); }
  }

  /* Each cell is its own container: label position depends on the CELL, not the row. */
  [data-stat] { container-type: inline-size; container-name: stat measure; }
  [data-stat] > [data-stat-body] { display: grid; gap: 2px; }
  [data-stat] [data-slot="label"] { text-wrap: balance; color: var(--ink-subtle); }
  @container stat (width >= 17rem) {
    [data-stat] > [data-stat-body] {
      grid-template-columns: minmax(0, 1fr) max-content; align-items: baseline;
    }
  }
}
```

### 7.4 Detail panel - `[data-pane="detail"]`

The slide-over body, the mission detail, the trace detail. The canonical "same component at 520px
in a drawer and 1900px in a canvas" case.

```css
@layer components {
  /* DEFAULT: one scroll column. Meta is a disclosure at the top. */
  [data-pane="detail"] > [data-pane-body] {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--gap-min);
    padding-inline: var(--pane-pad);
  }
  [data-pane="detail"] [data-slot="prose"] { max-inline-size: var(--measure-prose); }
  [data-pane="detail"] [data-slot="meta"]  { order: -1; }
  [data-pane="detail"] [data-slot="meta"] > details { display: block; }

  /* wide: a sticky meta rail appears; prose stays at measure, the rail takes the overflow. */
  @container pane (width >= 51rem) {
    [data-pane="detail"] > [data-pane-body] {
      grid-template-columns: minmax(0, var(--container-col)) minmax(var(--container-rail), 1fr);
      column-gap: clamp(var(--gap-min), 3cqi, var(--gap-max));
    }
    [data-pane="detail"] [data-slot="meta"] { order: 0; position: sticky; inset-block-start: 0; }
    [data-pane="detail"] [data-slot="meta"] > details { display: contents; }  /* no longer folded */
  }

  /* trio: a third utility lane (history / related / receipts) instead of a wider prose column. */
  @container pane (width >= 102rem) {
    [data-pane="detail"] > [data-pane-body] {
      grid-template-columns:
        minmax(0, var(--container-col)) minmax(0, var(--container-col)) minmax(var(--container-rail), 1fr);
      justify-content: center;
    }
    [data-pane="detail"] [data-slot="related"] { display: block; }
  }
}
```

Note `display: contents` on the `<details>` at `wide`: the same DOM is a disclosure when narrow and
a flat list when wide, with no conditional rendering, so **no state is lost when the pane resizes**.
That is a container-query-only trick and it is why this must not be done in JS.

### 7.5 Form - `[data-form]`

`settings.tsx:3351` currently hardcodes `gridTemplateColumns: "1fr 1fr"` with no condition. In a
520px drawer that is two 250px fields. This is the fix.

```css
@layer components {
  /* DEFAULT: stacked. Label above field. Always correct. */
  [data-form] { display: grid; gap: var(--gap-min); }
  [data-field] { display: grid; gap: 4px; }
  /* An input is never wider than a measure, at any container size. A 2000px text input is a defect. */
  [data-field] :is(input, select, textarea) { inline-size: 100%; max-inline-size: var(--container-col); }

  /* col: label beside field. The label column is ch-derived, so it tracks the type ramp. */
  @container measure (width >= 34rem) {
    [data-field] {
      grid-template-columns: minmax(var(--label-col), max-content) minmax(0, var(--container-col));
      align-items: baseline;
      column-gap: var(--gap-min);
    }
  }

  /* duo: two field columns; short fields pair up, long ones span. */
  @container measure (width >= 68rem) {
    [data-form] { grid-template-columns: repeat(2, minmax(0, var(--container-wide))); justify-content: start; }
    [data-field][data-span="full"] { grid-column: 1 / -1; }
  }
}
```

A settings section and a drawer form are now literally the same JSX. No prop, no variant, no
`isDrawer` boolean. That deletion is the whole argument for this proposal in one component.

### 7.6 List row - `[data-row="list"]`

The densest, most-reused unit: thread items, approvals, artifacts, search results. Pure consumer - declares no container, reads `measure`, so it composes for the rail, the drawer or the canvas
without knowing which.

```css
@layer components {
  /* DEFAULT = nub. Icon only. */
  [data-row="list"] {
    display: grid; align-items: center; gap: var(--gap-min);
    grid-template-columns: max-content;
    min-block-size: var(--ink-control-md);
    padding-inline: var(--card-pad);
  }
  [data-row="list"] :is([data-slot="primary"], [data-slot="secondary"],
                        [data-slot="trailing"], [data-slot="actions"]) { display: none; }

  @container measure (width >= 8.5rem) {   /* rail: primary text, truncated */
    [data-row="list"] { grid-template-columns: max-content minmax(0, 1fr); }
    [data-row="list"] [data-slot="primary"] {
      display: block; min-inline-size: 0;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
  }
  @container measure (width >= 25.5rem) {  /* slat: trailing value */
    [data-row="list"] { grid-template-columns: max-content minmax(0, 1fr) max-content; }
    [data-row="list"] [data-slot="trailing"] { display: block; }
  }
  @container measure (width >= 34rem) {    /* col: secondary line, stacked */
    [data-row="list"] { grid-template-areas: "icon primary trailing" "icon secondary trailing"; }
    [data-row="list"] [data-slot="secondary"] { display: block; grid-area: secondary; }
  }
  @container measure (width >= 51rem) {    /* wide: secondary inline; hover actions */
    [data-row="list"] {
      grid-template-areas: "icon primary secondary actions trailing";
      grid-template-columns: max-content minmax(0, 2fr) minmax(0, 3fr) max-content max-content;
    }
  }
  /* Hover-reveal actions exist ONLY where hover exists - a media question, not a container one. */
  @media (hover: hover) and (pointer: fine) {
    @container measure (width >= 51rem) {
      [data-row="list"] [data-slot="actions"] { display: block; opacity: 0; }
      [data-row="list"]:is(:hover, :focus-within) [data-slot="actions"] { opacity: 1; }
    }
  }
}
```

That last block is the clean demonstration of the split: **`@media` decides whether the affordance
may exist at all; `@container` decides whether there is room for it.** Both, nested, each answering
its own question.

### 7.7 Diff viewer - `[data-diff]`

The hardest archetype, and the one where a viewport query is most obviously wrong: a diff in the
canvas at 3060px and a diff in the approvals tray at 520px are the same component on the same
screen.

```css
@layer components {
  /* DEFAULT: unified diff. One column, +/- in the gutter. Correct at any width down to rail. */
  [data-diff] {
    /* Gutter is derived from the actual line count. --digits is set inline (see §8.1) - * the only legitimate inline style: a runtime-computed value, never a declaration. */
    --gutter: calc(var(--digits, 3) * 1ch + 2 * 0.5rem);
    display: grid;
    grid-template-columns: var(--gutter) minmax(0, 1fr);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.6;
  }
  [data-diff] [data-side="right"] { display: none; }        /* unified: one text column */
  [data-diff] [data-line] { white-space: pre; }             /* code never wraps by default */
  [data-diff-scroll] { overflow-x: auto; overscroll-behavior-x: contain; }
  /* The diff scrolls inside itself. The page never scrolls horizontally. Asserted in CI. */

  /* duo: split diff. Two code columns of one measure each is exactly 2 x col. */
  @container measure (width >= 68rem) {
    [data-diff] {
      grid-template-columns: var(--gutter) minmax(0, 1fr) var(--gutter) minmax(0, 1fr);
    }
    [data-diff] [data-side="right"] { display: block; }
    [data-diff] [data-slot="marker"] { display: none; }      /* +/- markers are redundant when split */
  }

  /* trio: split diff plus the review rail (comments, CI, blame) as a third lane. */
  @container measure (width >= 102rem) {
    [data-diff-frame] {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(var(--container-rail), var(--container-col));
      column-gap: clamp(var(--gap-min), 2cqi, var(--gap-max));
    }
    [data-diff-frame] [data-slot="review"] { display: block; }
  }

  /* Soft wrap is a user preference, not a size decision. It composes with every band. */
  [data-diff][data-wrap="on"] [data-line] { white-space: pre-wrap; overflow-wrap: anywhere; }
}
```

Note the threshold: split diff turns on at exactly `2 x col`, because that is exactly when two code
columns of one measure each fit. The switch point is not chosen, it is computed.

---

## 8. The escape from inline styles

### 8.1 The measured problem, and the single rule that fixes it

Measured this session: 275 `style={{` occurrences in `_authenticated.settings.tsx`, 54 in
`build.index.tsx`, 49 in `today.tsx`. Broken down for settings:

| Shape | Count | Verdict |
| --- | --- | --- |
| `style={{ fontSize: ... }}` | 44 | must become a class |
| `style={{ display: ... }}` | 37 | must become a class |
| `style={{ color: "var(--...)" }}` | 34 | must become a class |
| `marginTop` / `marginBottom` | 37 | must become a class (also: should be `gap`) |
| `padding` | 19 | must become a class |
| `flex` / `flexShrink` / `height` / `width` / `gap` / `borderColor` | 24 | must become a class |

Inline styles cannot carry an at-rule. Not `@media`, not `@container`, not `:hover`, not
`:focus-visible`. **This is the mechanical reason the app cannot adapt** - it is not that nobody
wrote breakpoints, it is that ~90% of the layout lives somewhere a breakpoint is syntactically
impossible.

The codebase already knows this. `settings.tsx:2190`:

```tsx
// Border color lives in classes (not inline) so hover can win;
// inline styles would beat the hover utility.
```

One instance of the correct instinct, applied once, in a 3433-line file.

**The rule, and it is one line:**

> `style` may contain **custom properties only**. Any key not starting with `--` is a build error.

```tsx
// BANNED - a declaration. Cannot be queried, cannot be hovered, wins over every class.
<div style={{ display: "grid", gridTemplateColumns: "380px minmax(0,1fr)", color: "var(--ink-body)" }} />

// CORRECT - a computed value handed to CSS, which then owns all the conditionals.
<div data-pane style={{ "--digits": String(lineCount).length } as CSSProperties} />
```

The rule works because it splits the problem exactly along the real fault line. Runtime-computed
*values* (a progress percentage, a diff gutter's digit count, a virtualized row's offset, a stagger
index) genuinely belong in JS and are fine as custom properties - CSS then consumes them inside
container queries, hover states and media queries freely. Static *declarations* never belong in JS.

### 8.2 The bridge: make the tokens into utilities

The reason people reach for `style={{ color: "var(--ink-subtle)" }}` is that the ink tokens are not
registered with Tailwind - `src/styles/ink.css` defines 40+ `--ink-*` / `--voice-*` custom
properties and `@theme inline` in `styles.css` registers none of them. So today the alternatives are
an inline style or `text-[var(--ink-subtle)]` arbitrary syntax (which `MissionShellView` uses
heavily). Register them once:

```css
/* Append to the existing @theme inline block in src/styles.css */
@theme inline {
  --color-ink-bg: var(--ink-bg);
  --color-ink-panel: var(--ink-panel);
  --color-ink-raised: var(--ink-raised);
  --color-ink-text: var(--ink-text);
  --color-ink-body: var(--ink-body);
  --color-ink-subtle: var(--ink-subtle);
  --color-ink-faint: var(--ink-faint);
  --color-ink-hairline: var(--ink-hairline);
  --color-ink-hairline-soft: var(--ink-hairline-soft);
  --color-voice-human: var(--voice-human);
  --color-voice-machine: var(--voice-machine);
  --color-voice-memory: var(--voice-memory);
  --color-chip-fg: var(--chip-fg);
  --color-verdict-pass: var(--verdict-pass);
  --color-verdict-fail: var(--verdict-fail);
  --radius-control: var(--ink-radius-control);
  --radius-panel: var(--ink-radius-panel);
  --spacing-control-sm: var(--ink-control-sm);
  --spacing-control-md: var(--ink-control-md);
  --spacing-control-lg: var(--ink-control-lg);
}
```

Now `text-ink-subtle`, `bg-ink-panel`, `border-ink-hairline`, `rounded-panel`, `h-control-md` exist,
and the mechanical codemod becomes a lookup table:

| Inline (found in the tree today) | Replacement |
| --- | --- |
| `style={{ color: "var(--ink-subtle)" }}` | `className="text-ink-subtle"` |
| `style={{ background: "var(--ink-raised)" }}` | `className="bg-ink-raised"` |
| `style={{ borderColor: "var(--ink-hairline)" }}` | `className="border-ink-hairline"` |
| `style={{ fontSize: 12.5 }}` | `className="text-[0.78125rem]"` -> then onto the type scale |
| `style={{ display: "grid", gap: 8 }}` | `className="grid gap-2"` |
| `style={{ marginTop: 10 }}` | delete; the parent owns `gap` |
| `style={{ gridTemplateColumns: "380px minmax(0,1fr)" }}` | `[data-frame]` composition rule (§3.4) |

`className={cn(...)}` already exists (`src/lib/utils`) and is used throughout, so this is a
find-and-replace with a type check, not a redesign.

### 8.3 Sequencing, given that this is a rebuild from zero

The new authenticated app lives in `src/app/**`. That tree's budget is **zero non-custom-property
inline styles from commit one**, enforced by CI, so the debt cannot re-accumulate. The old tree is
handled as a ratchet, not a migration project:

1. **Day 0** - land `src/styles/adaptive.css` + `archetypes.css` + `environment.css`, the `@theme`
   registrations above, and the three static CI gates (§9.3). Old tree is grandfathered by a
   checked-in baseline count per file.
2. **Per surface, as it is rebuilt** - the surface moves to `src/app/**` and its baseline entry is
   deleted. The baseline file only ever shrinks; CI fails if any number goes up.
3. **Never** a big-bang codemod across the old tree. Every surface it touches is a surface being
   deleted anyway.

The ratchet matters more than the codemod. The measured 5-breakpoints-across-75-files number is what
happens when there is no gate.

---

## 9. SSR and first paint under `ssr: false`

### 9.1 Why container queries are the *only* mechanism that survives this

`src/routes/_authenticated.tsx:22` sets `ssr: false` for the whole authenticated subtree. The server
sends no app markup; React renders after the client bundle boots. There are exactly two ways to make
a layout adapt, and only one of them works here:

| Mechanism | Works before hydration? | Behaviour on first paint |
| --- | --- | --- |
| JS measurement (`useMediaQuery`, `window.innerWidth`, `ResizeObserver` -> state) | **No** | Renders a guessed default, then reflows once JS measures. A visible snap on every load, and worse on a cold Worker start. |
| CSS container queries | **Yes** | Correct at the first paint, with zero JS. |

The stylesheet is `<link>`ed from `__root.tsx:18` (`import appCss from "../styles.css?url"`), so it
is render-blocking and present *before* the first paint of anything. Container queries evaluate
during that first layout pass. **The composition is correct before React exists.** That is the
strongest single argument for this proposal in the context of `ssr: false`, and it is why the
answer must not be a JS breakpoint hook.

Corollary, enforced by CI: **`window.innerWidth`, `window.matchMedia` for size, and
`ResizeObserver` are banned in the layout path** in `src/app/**`. The allowlist is narrow and
documented: virtualization row measurement, canvas/chart drawing, and the overflow-row from §6.3.
None of those decide composition.

### 9.2 The skeleton that makes the first paint correct

Because composition is pure CSS, we can server-render a *correct* frame before the app tree exists:

```tsx
// src/routes/__root.tsx - INSIDE the SSR'd shell, ABOVE the ssr:false boundary.
<body suppressHydrationWarning>
  <div data-frame data-booting>
    <div data-region="topbar"   className="ink-skeleton" />
    <div data-region="spine"    className="ink-skeleton" />
    <div data-pane="thread"     className="ink-skeleton" />
    <div data-pane="canvas"     className="ink-skeleton" />
    <div data-region="composer" className="ink-skeleton" />
    {children}   {/* the ssr:false app mounts here and removes data-booting */}
  </div>
  <Scripts />
</body>
```

Three properties follow, and each removes a real first-paint defect:

1. **No flash of wrong composition.** At 3440 the skeleton already shows three lanes; at 900 it
   already shows one. The bands are decided by CSS on a DOM that arrived in the HTML.
2. **No reflow when the app mounts.** The skeleton boxes are the same boxes; React fills them.
   Nothing is inserted that changes the grid.
3. **The dark-first bootstrap already in place keeps working** (`__root.tsx:197` ships
   `className="dark"`, `:218` runs the pre-hydration theme script), so the skeleton is on-brand from
   frame one rather than a white flash.

### 9.3 The font-metric hazard, which is specific to `ch` and `measure`

`--measure-prose: 66ch` and the table's `10ch` columns are font-metric-dependent. Geist is
self-hosted (`public/fonts/geist/Geist-Variable.woff2`), preloaded (`__root.tsx:171-179`) and
declared `font-display: swap` (`styles.css:2946`). `swap` means the fallback renders first with
different metrics, so every `ch`-derived width **shifts when Geist arrives** - which can flip a
container band and cause a visible recomposition.

Fix, both parts required:

```css
/* 1. A metric-matched fallback so ch widths do not move on swap. */
@font-face {
  font-family: "Geist Fallback";
  src: local("Helvetica Neue"), local("Arial");
  size-adjust: 96.5%;          /* calibrated by bun run adaptive:calibrate */
  ascent-override: 95%;
  descent-override: 25%;
  line-gap-override: 0%;
}
:root { --font-sans: "Geist", "Geist Fallback", ui-sans-serif, system-ui, sans-serif; }
```

```css
/* 2. Band thresholds are rem, never ch. ch is used for CONTENT CAPS only.
 *    A font swap may nudge a prose cap by a character. It may never flip a band. */
```

That separation is the rule: **`rem` decides composition; `ch` decides measure.** A font change can
never cause a layout recomposition, only a slightly different wrap point.

### 9.4 The remaining first-paint checklist

- `scrollbar-gutter: stable` on every pane (§5.6) so the first content render cannot oscillate.
- No `content-visibility: auto` on any container - it defers layout, which defers container
  evaluation, which produces exactly the flash we removed. Allowed only on off-screen list items
  *inside* a pane, never on a pane.
- The frame uses `100dvh`. Block-size queries sit at 34rem, far from any URL-bar delta, so mobile
  chrome collapse cannot flip a band.
- Radix content portals to `body`, outside all containers. Every popover/dialog/sheet body carries
  `data-popover-body` (§5.1) so archetypes inside them still resolve `measure`. Without this, a form
  inside a dialog silently renders in its narrowest band forever - the exact failure mode §5.4
  describes, appearing where it is least expected.

---

## 10. Verification - how this is proved by CI, not by eye

Five gates. Three are sub-second and static; two need a browser. All wire into
`bun run test:adaptive`, which joins `prebuild`.

### 10.1 Gate 1 - the proof harness (the load-bearing one)

The problem with testing adaptivity on real surfaces is that you need a workspace, a session and
data. The fix is a dev-only route that renders **one archetype inside a pane of an exact width**:

```tsx
// src/routes/__proof.$archetype.tsx - dev + CI only; excluded from the production build.
export const Route = createFileRoute("/__proof/$archetype")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({ w: Number(s.w ?? 544), fixture: String(s.fixture ?? "default") }),
  component: Proof,
});

function Proof() {
  const { archetype } = Route.useParams();
  const { w, fixture } = Route.useSearch();
  const Archetype = PROOF_REGISTRY[archetype];   // one entry per archetype, with fixtures
  return (
    <div data-frame>
      {/* The pane is the unit under test. Its width is the independent variable. */}
      <div data-pane style={{ "--proof-w": `${w}px` } as CSSProperties} className="w-[var(--proof-w)]">
        <div data-pane-body><Archetype fixture={fixture} /></div>
      </div>
    </div>
  );
}
```

```ts
// e2e/adaptive/archetypes.spec.ts
const BANDS = [136, 272, 408, 544, 816, 1088, 1632, 2176, 3060];   // the ladder, in px
const ARCHETYPES = ["work-card", "data-table", "stat-row", "detail-panel", "form", "list-row", "diff"];
const FIXTURES = ["empty", "typical", "overflowing", "longest-strings", "rtl"];

for (const a of ARCHETYPES) {
  for (const w of BANDS) {
    for (const f of FIXTURES) {
      test(`${a} @ ${w}px / ${f}`, async ({ page }) => {
        await page.goto(`/__proof/${a}?w=${w}&fixture=${f}`);
        await page.waitForFunction(() => document.fonts.status === "loaded");
        await expect(page.locator("[data-pane]")).toHaveScreenshot(`${a}-${w}-${f}.png`, {
          maxDiffPixelRatio: 0.01,
        });
        await expectNoOverflow(page, "[data-pane]");
        await expectNoClippedText(page);
        await expectContainerAncestor(page);
      });
    }
  }
}
```

7 archetypes x 9 widths x 5 fixtures = **315 assertions per run**, each ~200ms, no login, no
database, no seeded workspace. This is the thing that fails the build when a surface breaks at a
size, and it exists because container queries made the archetype testable in isolation. A viewport-
query design cannot be tested this way at all - you would have to resize the browser for each case
and boot the whole app.

Shared assertions:

```ts
// e2e/adaptive/assertions.ts
export async function expectNoOverflow(page: Page, sel: string) {
  const bad = await page.$$eval(sel, (els) =>
    els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.outerHTML.slice(0, 200)));
  expect(bad, `content overflows its pane:\n${bad.join("\n")}`).toEqual([]);
}

export async function expectNoClippedText(page: Page) {
  // Anything NOT explicitly opted into truncation must fit.
  const bad = await page.$$eval("[data-slot]:not([data-truncate])", (els) =>
    els.filter((el) => el.scrollWidth > el.clientWidth + 1).map((el) => el.textContent?.slice(0, 60) ?? ""));
  expect(bad, `text clipped without data-truncate: ${bad.join(" | ")}`).toEqual([]);
}

export async function expectContainerAncestor(page: Page) {
  // The §5.4 fallback guard, as a hard failure.
  const orphans = await page.$$eval("[data-card],[data-row],[data-statrow],[data-form],[data-diff]", (els) =>
    els.filter((el) => {
      let p = el.parentElement;
      while (p) { if (getComputedStyle(p).containerType !== "normal") return false; p = p.parentElement; }
      return true;
    }).map((el) => el.getAttribute("data-card") ?? el.tagName));
  expect(orphans, `archetype with no container ancestor: ${orphans.join(", ")}`).toEqual([]);
}
```

### 10.2 Gate 2 - real surfaces across the whole range

Extends the existing `e2e/03-surfaces-responsive.spec.ts` (which already has `checkHorizontalScroll`
and the 44px touch check) from its current 768/320 pair to the full ladder, and replaces the
`console.warn` at line 76 with a hard failure.

```ts
// playwright.config.ts - replaces the current 3 projects
const LADDER = [
  { name: "col",   width: 544,  height: 800 },
  { name: "wide",  width: 816,  height: 800 },
  { name: "duo",   width: 1280, height: 800 },   // laptop, and 2560 at 200% zoom
  { name: "trio",  width: 1728, height: 1080 },  // 16" MacBook Pro
  { name: "quad",  width: 2560, height: 1440 },  // 27" 1440p
  { name: "ultra", width: 3440, height: 1440 },  // THE founder's monitor
  { name: "zoom200-laptop", width: 720, height: 450 },  // 1440x900 at 200% (see §2.3)
  { name: "half-1440p",     width: 1280, height: 1440 },
  { name: "coarse", width: 1280, height: 800, hasTouch: true, isMobile: false },
];
```

Per surface, per rung:

1. `documentElement.scrollWidth <= clientWidth` - no horizontal page scroll, ever.
2. No `[data-pane]` overflows.
3. No prose block exceeds `--container-col` (`expectMeasure`) - catches the ultrawide stretch
   regression directly.
4. Lane count matches the band: `getComputedStyle(lanes).gridTemplateColumns.split(" ").length`
   equals the expected value for that rung. This is what makes §3.4 a *tested* claim rather than a
   described one.
5. On the `coarse` rung, every interactive box is >= 44px.
6. `expectContainerAncestor` again, on real DOM this time.
7. **The peripheral-lane rule (§3.5):** at `ultra`, assert every `[data-peripheral]` control has a
   duplicate outside the peripheral lane (`[data-peripheral] button[data-action]` -> the same
   `data-action` must exist elsewhere in the DOM).

### 10.3 Gate 3 - static, sub-second, `bun test`

```ts
// src/__tests__/adaptive-static.test.ts
import { Glob } from "bun";
import { expect, test } from "bun:test";

const APP = [...new Glob("src/app/**/*.tsx").scanSync(".")];
const CSS = [...new Glob("src/styles/**/*.css").scanSync(".")];

test("no inline style declarations (custom properties only)", async () => {
  const bad: string[] = [];
  for (const f of APP) {
    const src = await Bun.file(f).text();
    for (const m of src.matchAll(/style=\{\{([^}]*)\}\}/g)) {
      const keys = [...m[1].matchAll(/(?:^|,)\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z][\w]*))\s*:/g)]
        .map((k) => k[1] ?? k[2] ?? k[3]);
      const decls = keys.filter((k) => !k.startsWith("--"));
      if (decls.length) bad.push(`${f}: ${decls.join(", ")}`);
    }
  }
  expect(bad, `inline style declarations cannot carry a container query:\n${bad.join("\n")}`).toEqual([]);
});

test("no viewport breakpoints in the app tree", async () => {
  const bad: string[] = [];
  for (const f of APP) {
    const src = await Bun.file(f).text();
    const hits = src.match(/(?:^|["'\s:])(?:sm|md|lg|xl|2xl):[a-z[]/g);
    if (hits) bad.push(`${f}: ${[...new Set(hits)].join(" ")}`);
  }
  expect(bad, `use @container variants (@col: @duo: ...), not viewport breakpoints`).toEqual([]);
});

test("@media only in environment.css, and only for allowlisted features", async () => {
  const ALLOWED = /prefers-|pointer|hover|forced-colors|display-mode|scripting|print|min-resolution|monochrome/;
  const bad: string[] = [];
  for (const f of CSS) {
    if (f.endsWith("environment.css")) continue;
    const src = await Bun.file(f).text();
    for (const m of src.matchAll(/@media([^{]+)\{/g)) {
      if (!ALLOWED.test(m[1])) bad.push(`${f}: @media${m[1].trim()}`);
    }
  }
  expect(bad, `size media queries are banned; use @container`).toEqual([]);
});

test("no unnamed container queries", async () => {
  const bad: string[] = [];
  for (const f of CSS) {
    const src = await Bun.file(f).text();
    for (const m of src.matchAll(/@container\s+([^{]+)\{/g)) {
      if (/^\s*\(/.test(m[1])) bad.push(`${f}: @container ${m[1].trim()}`);
    }
  }
  expect(bad, `name the container (measure|pane|card|table|frame) or nesting will bind it wrong`).toEqual([]);
});

test("the ladder is exact multiples of the anchor", async () => {
  const css = await Bun.file("src/styles/adaptive.css").text();
  const rem = (k: string) => Number(css.match(new RegExp(`--container-${k}:\\s*([\\d.]+)rem`))![1]);
  const col = rem("col");
  const EXPECTED = { nub: 0.25, rail: 0.5, slat: 0.75, wide: 1.5, duo: 2, trio: 3, quad: 4 };
  for (const [k, mult] of Object.entries(EXPECTED)) {
    expect(rem(k), `--container-${k} must be ${mult} x --container-col`).toBeCloseTo(col * mult, 5);
  }
});

test("no magic px in layout properties", async () => {
  const LAYOUT = /(?:inline-size|block-size|width|height|max-width|min-width|max-inline-size|min-inline-size|grid-template-columns|grid-template-rows|flex-basis|gap|column-gap|row-gap)\s*:\s*([^;]+);/g;
  const OK = /var\(|calc\(|clamp\(|minmax\(|repeat\(|%|ch\b|rem\b|fr\b|auto|max-content|min-content|100dvh|100svh|\b[12]px\b|\b44px\b/;
  const bad: string[] = [];
  for (const f of CSS) {
    const src = await Bun.file(f).text();
    for (const m of src.matchAll(LAYOUT)) if (/\d+px/.test(m[1]) && !OK.test(m[1])) bad.push(`${f}: ${m[0]}`);
  }
  expect(bad, `derive it from the ladder or justify it in §4.3`).toEqual([]);
});

test("position: fixed only at the frame", async () => {
  const bad: string[] = [];
  for (const f of APP) {
    const src = await Bun.file(f).text();
    if (/\bfixed\b/.test(src) && !/data-frame/.test(src) && !/createPortal/.test(src)) bad.push(f);
  }
  expect(bad, `contain: layout traps fixed children inside a pane; portal instead (§5.5)`).toEqual([]);
});

test("every pane reserves its scrollbar gutter", async () => {
  const css = await Bun.file("src/styles/adaptive.css").text();
  expect(css, "without scrollbar-gutter: stable, panes oscillate across a band edge (§5.6)")
    .toContain("scrollbar-gutter: stable");
});

test("no JS measurement in the layout path", async () => {
  const bad: string[] = [];
  for (const f of APP) {
    const src = await Bun.file(f).text();
    if (/window\.innerWidth|matchMedia\(\s*["'`]\(m(?:in|ax)-width/.test(src)) bad.push(f);
    if (/new ResizeObserver/.test(src) && !/adaptive-allow: resize-observer/.test(src)) bad.push(f);
  }
  expect(bad, `size decisions must be CSS, or the first paint under ssr:false is wrong (§9.1)`).toEqual([]);
});
```

### 10.4 Gate 4 - the calibration test that keeps the seed honest

```ts
// e2e/adaptive/measure.spec.ts
test("--container-col still equals 66ch of Geist + 2 x pane padding", async ({ page }) => {
  await page.goto("/__proof/measure");
  await page.waitForFunction(() => document.fonts.status === "loaded");
  const { measured, token } = await page.evaluate(() => {
    const probe = document.createElement("span");
    probe.style.cssText =
      "position:absolute;visibility:hidden;white-space:pre;font:var(--text-body)/1 var(--font-sans)";
    probe.textContent = "0".repeat(66);
    document.body.append(probe);
    const cs = getComputedStyle(document.documentElement);
    const pad = parseFloat(cs.getPropertyValue("--pane-pad")) * 16;
    const measured = probe.getBoundingClientRect().width + 2 * pad;
    probe.remove();
    return { measured, token: parseFloat(cs.getPropertyValue("--container-col")) * 16 };
  });
  expect(Math.abs(measured - token) / token,
    `--container-col drifted. Run: bun run adaptive:calibrate`).toBeLessThan(0.02);
});
```

This is what makes "no magic numbers" a mechanical property rather than a promise. The one seed
constant in the whole system is machine-measured, and if anyone changes the body type size or the
font, the build fails with the command that regenerates it.

### 10.5 Gate 5 - the environment matrix

```ts
test.describe("environment", () => {
  for (const m of ["reduce", "no-preference"] as const)
    test(`reduced-motion: ${m}`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: m });
      /* ... assert no animation on [data-frame] descendants when reduce ... */
    });
  test("forced-colors", async ({ page }) => {
    await page.emulateMedia({ forcedColors: "active" });
    /* ... assert every band boundary still renders, hairlines still visible ... */
  });
});
```

Browser zoom needs no API: §2.3 establishes `effective CSS px = physical px / zoom`, so the
`zoom200-laptop` rung in §10.2 *is* the 200% zoom test. Saying so, instead of building a fake zoom
harness, is the honest engineering call.

### 10.6 Wiring

```jsonc
// package.json
"scripts": {
  "test:adaptive": "bun test src/__tests__/adaptive-static.test.ts && playwright test e2e/adaptive",
  "adaptive:calibrate": "playwright test e2e/adaptive/measure.spec.ts --update-snapshots -g calibrate",
  "prebuild": "bash scripts/check-migrations.sh && bun test src/__tests__/adaptive-static.test.ts"
}
```

Static gates run on every build (sub-second, no browser). Browser gates run in CI and on
`test:adaptive`. The screenshot baselines live under `e2e/adaptive/__screenshots__/` and a
composition change requires an explicit `--update-snapshots`, which is exactly the review moment we
want.

---

## 11. Handoff

### 11.1 What I own

- The container hierarchy: who declares `container-type`, the names (`frame` / `pane` / `card` /
  `table` / `measure`), the dual-name alias, the self-query prohibition, the containment side
  effects, the fallback semantics.
- The size ladder: one measured seed, seven derived steps, and the ban on any threshold defined
  anywhere else.
- The seven archetype composition contracts in §7.
- The media-vs-container-vs-neither split in §6.
- The inline-style rule and the token-to-utility bridge in §8.
- The first-paint story under `ssr: false` in §9.
- The CI in §10.

### 11.2 What I hand to the fluid / intrinsic-sizing angle

I specify the **switch points**. That angle specifies the **behaviour between them**: `clamp()`
curves for type and spacing, `cqi` vs `vi` unit choice, `minmax()` and `auto-fit` minimums,
`text-wrap: balance` vs `pretty`, and how a band change is absorbed continuously rather than
snapping. The shared interface is the `--container-*` ladder and `--measure-prose`. Two hard
constraints from my side, and only two:

1. Fluid ranges are bounded by ladder tokens, never by new numbers.
2. No fluid formula may change an element's *composition* - that is what a band switch is for. If a
   `clamp()` makes a column disappear, it belongs in a query.

### 11.3 What I hand to the shell / composition angle

I give the frame primitive: `[data-frame]` with `container-type: size`, `container-name: frame`,
`100dvh`, and the lane formula in §3.4. That angle decides **which regions exist**, what fills each
lane at each band, whether the thread is a rail or an overlay at `wide`, who owns scroll and focus,
and where the drawers and the approvals tray attach. Two constraints:

1. Every region that holds caller content is a `[data-pane]`. No exceptions, or archetypes inside it
   silently fall back to their narrowest band.
2. Region composition is decided by `@container frame (...)`, never by a media query or JS, or the
   first paint under `ssr: false` is wrong.

### 11.4 What none of the three of us has solved yet, named so it does not get lost

1. **Transition across a band switch.** When a pane crosses 68rem the diff goes unified -> split.
   Today that is an instant reflow. Whether it should be animated, and how without layout thrash, is
   unowned. My instinct: do not animate composition; animate only opacity on the newly revealed
   lane, and never during a drag-resize.
2. **Focus and scroll survival across recomposition.** `display: contents` on the detail panel's
   `<details>` (§7.4) preserves DOM and therefore focus. Any archetype that *conditionally renders*
   instead will drop focus and scroll position on resize. Needs a rule, and probably a test.
3. **Virtualized lists inside containers.** A virtualizer measures row height in JS; a band switch
   changes row height in CSS. The invalidation path between them is real work and belongs to
   whoever owns the list surface.
4. **Persisted user sizing.** If the thread becomes drag-resizable, the persisted width must be
   clamped into the ladder rather than stored as raw px, or a user restores a 900px thread onto a
   1280px laptop. Store the *band*, restore a width.
