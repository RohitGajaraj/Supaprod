# OBS-01 · Tokens + fonts + motion foundation (the `[data-obsidian]` layer)

> _Spec created: 2026-07-02 · Group G14 (Obsidian port) · The strictly-ordered foundation. Nothing else in the port starts until this lands._
>
> **STATUS: ✅ SHIPPED 2026-07-02 (lane1).** The `[data-obsidian]` token layer is live in `src/styles.css` (5 token files verbatim + a shadcn semantic bridge; 53 hexes all inside the layer), Codystar + Caveat load from the root head (`src/routes/__root.tsx`), the 8 `cad*` keyframes + `--density-*` are in, and the legacy landing keyframe was renamed `cadFlutter` to `cadFlutterBrand` so the v3 `cadFlutter` lands verbatim. The layer is INERT until OBS-02 attaches the attribute to the shell. Verify manual: [`../../features/obsidian-port.md`](../../features/obsidian-port.md). **This spec is retained as the build record + reference of what was implemented;** the next foundation pick is OBS-02.

This is the complete, self-contained build package for OBS-01. It embeds every token value, font family, keyframe, and density rule verbatim from the frozen handoff so an implementing agent can build it cold without opening another file. Where it quotes a hex, a duration, or an easing, that value is copied from `design-reference/obsidian-v3/tokens/*.css` and is not to be reinterpreted.

---

## 1. Snapshot

| Field         | Value                                                                                                                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID            | OBS-01                                                                                                                                                                                                                                                |
| Rank          | #2                                                                                                                                                                                                                                                    |
| Tier          | 1 (foundation)                                                                                                                                                                                                                                        |
| Status        | In dev (claimed on lane1; this worktree has no Obsidian layer yet, see §4)                                                                                                                                                                            |
| Category      | Cockpit                                                                                                                                                                                                                                               |
| Depends on    | none (this is the root of the graph)                                                                                                                                                                                                                  |
| Blocks        | OBS-02 (shell consumes the tokens/fonts), and transitively every OBS-03..15                                                                                                                                                                           |
| One-line what | Port the 5 obsidian-v3 token files verbatim as app-scoped `[data-obsidian]` CSS custom properties, load the 2 new fonts, port the 8 `cad*` keyframes + the reduced-motion gate + the `data-density` attribute; the landing page stays byte-untouched. |
| Dashboard row | [`../feature-dashboard.md`](../feature-dashboard.md) group G14, row OBS-01                                                                                                                                                                            |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md)                                                                                                                                                                                                |
| Hub           | [`./README.md`](./README.md)                                                                                                                                                                                                                          |

---

## 2. Why we are doing it

Every Obsidian surface is a consumer of one shared vocabulary of color, type, space, and motion. If that vocabulary does not exist as real CSS custom properties, every downstream item (shell, primitives, the five surfaces) would hardcode hexes and drift. OBS-01 lays the single substrate so `--canvas`, `--ember`, `--glacier`, `--ease`, and the eight `cad*` keyframes are addressable by name everywhere the app renders. It ships no pixels the user sees on its own; it makes every later pixel possible and consistent.

This serves all three Obsidian laws at once. **One object, one anatomy** needs one token set so a Call card looks identical on Today and in Build. **One queue for attention** depends on `--ember` being reserved and defined exactly once, so ember can be enforced as the needs-a-human color and nothing else. **Depth on demand** rests on the surface ramp (`--canvas` to `--hover`) and the `cadSlideIn` keyframe that later powers the slide-over. The felt outcome is a calm instrument: warm asks, cool works, depth from tint not shadow. That restraint is the v11 guiding star made visual (trust at the point of decision) and the engine-room doctrine made literal (calm front, machinery behind one door).

The reason it is ranked at the very front: the v11 capability front is done and the product works, but it reads as scaffolding. Obsidian is the coherence pass. It is presentation plumbing only. **No feature work rides along.** OBS-01 touches zero server functions and zero data.

---

## 3. What we are building

**Scope IN**

- Append one app-scoped token layer to `src/styles.css` under the `[data-obsidian]` selector, porting all five obsidian-v3 token files verbatim: surfaces + ink + role colors + working palette + pencil inks + semantic aliases (`colors.css`), the three type stacks + scale (`typography.css`), the 4px grid + radii (`geometry.css`), the one easing + three durations + shimmer gradient (`motion.css`).
- Port the eight `cad*` keyframes globally (keyframes cannot be attribute-scoped) with the `cad` prefix that keeps them collision-free.
- Port the `prefers-reduced-motion` gate, scoped to `[data-obsidian]` (the one intentional delta from the verbatim `*` selector, see §5 step 6 and §13).
- Add the two missing fonts (Codystar, Caveat) to the existing Google Fonts `<link>` in `src/routes/__root.tsx`; keep Newsreader, Schibsted Grotesk, JetBrains Mono.
- Establish the `data-density` attribute contract (`comfortable` default, `compact` override) as density-aware spacing tokens per `obsidian-extensions.md` §8, ready for OBS-03+ consumers.
- Add the focus-visible ring and the ember selection scoped to `[data-obsidian]`.

**Scope OUT (does not ride along)**

- Mounting `data-obsidian` onto a live DOM node. That is deferred to OBS-02 for a hard technical reason (§4, §13): parchment defines `--card`, `--canvas`, `--ember` and Tailwind maps them to utilities, so setting the attribute before the shell is Obsidian would re-resolve those utilities on still-parchment pages and break them. OBS-01 ships the layer dormant.
- Any component, rail, primitive, or surface (OBS-02+).
- Any change to the parchment "Ember Editorial" tokens, the `@theme inline` block, or the landing page. Those stay byte-for-byte identical.
- Self-hosting the fonts. Documented as a follow-up in §13, not a blocker; the Google Fonts CDN link is the shipping path for now.
- Any server function, query, or migration. OBS-01 reads and writes CSS and one `<link>` only.

---

## 4. Current state (real files, verified 2026-07-02)

- **`src/styles.css`** (1611 lines) is the parchment "Ember Editorial" system: Tailwind v4 `@import "tailwindcss"`, a `@theme inline` block mapping custom properties to utilities, oklch color tokens in `:root` and `.dark`, and parchment keyframes (`flowBreathe`, `agent-shimmer`). There is **no `[data-obsidian]` block, no `cadPulse`/`cadSlideIn`/`cadShimmer`, no Codystar or Caveat** in this file today. Despite OBS-01 being marked In dev on lane1, this worktree's `styles.css` has none of the Obsidian layer yet, so treat this as greenfield and append the full layer.
- **Collision fact (load-bearing).** Parchment defines `--card` (line 176 `--card: var(--canvas)`, line 280 `.dark --card: var(--surface-1)`), `--canvas` (lines 124, 236), and `--ember` (lines 119, 232), and the `@theme inline` block maps `--color-card: var(--card)` etc. Obsidian reuses those exact names with different values. Because they collide, redefining them under `[data-obsidian]` re-resolves the mapped Tailwind utilities (`bg-card`, `text-ember`, ...) for any element inside that scope. This is why the attribute is NOT mounted here (§3 scope-out, §13).
- **`src/routes/__root.tsx`** loads fonts via a Google Fonts `<link rel="stylesheet">` at line 122, with two `preconnect` links above it (lines 116-117). The current href carries JetBrains Mono, Newsreader (with italic + optical sizing), Schibsted Grotesk. Codystar and Caveat are absent.
- **`src/routes/_authenticated.tsx`** is the gated layout: `beforeLoad` auth + onboarding gate, then `AuthedLayout` renders `WorkspaceProvider > FlowModeProvider > BackendHealthBanner + BillingBanner + CommandPalette + GotoShortcuts + <Outlet>`. It renders **no rail** and carries **no `data-obsidian`** today. This is where OBS-02 will mount the attribute; OBS-01 leaves it alone.
- **What stays:** all parchment tokens, the `@theme inline` block, both parchment keyframes, the three already-loaded fonts, `_authenticated.tsx` structure.
- **What changes:** `src/styles.css` gains one appended Obsidian layer at end-of-file; `src/routes/__root.tsx` line 122 href gains two font families.

---

## 5. How · step by step

Follow top to bottom. Every value is quoted in §7; copy from there, do not retype from memory.

1. **`src/styles.css` · append the surface + ink + role-color + palette + pencil + alias block.** At the very end of the file, open a clearly-commented section and a `[data-obsidian] { ... }` rule. Paste the color tokens from §7.1 verbatim (surfaces, hairlines, ink, role colors, working palette, pencil inks, semantic aliases). Do not touch anything above.
2. **Append the type tokens** inside the same `[data-obsidian] { ... }` rule: the five font-family stacks and the full scale + leading + tracking from §7.2.
3. **Append the geometry tokens** in the same rule: `--space-*`, `--radius-*` from §7.3.
4. **Append the motion tokens** in the same rule: `--ease`, the three durations, `--shimmer-gradient` from §7.4.
5. **Append the density-aware spacing tokens** in the same rule (comfortable defaults), then a second rule `[data-obsidian][data-density="compact"] { ... }` with the compact overrides from §7.6.
6. **Append the eight `cad*` keyframes** at the top level of the file (keyframes are global; the `cad` prefix keeps them from colliding with `flowBreathe`/`agent-shimmer`). Copy all eight from §7.5 verbatim. Then append the reduced-motion gate **scoped to `[data-obsidian]`** (not the verbatim `*`): `@media (prefers-reduced-motion: reduce) { [data-obsidian] *, [data-obsidian] *::before, [data-obsidian] *::after { animation-duration: 0.001ms !important; animation-iteration-count: 1 !important; transition-duration: 0.001ms !important; } }`.
7. **Append the focus ring + selection**, scoped: `[data-obsidian] :focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px; }` and `[data-obsidian] ::selection { background: var(--selection); }`.
8. **`src/routes/__root.tsx` line 122 · add the two fonts.** Extend the existing href by inserting `&family=Codystar:wght@300;400&family=Caveat:wght@500;600;700` immediately before `&display=swap`. Keep the three existing families and the two `preconnect` links. Do not add a second stylesheet link.
9. **Verify locally (temporary, do not commit a mount).** Run `bun run dev`, open the app, and in devtools set `data-obsidian` on the authenticated wrapper element, then confirm `getComputedStyle(el).getPropertyValue('--canvas')` returns `#0A0A0B` and `--ember` returns `#FF6B2C`. Remove the attribute afterward. This proves the layer resolves without shipping a live mount.
10. **Add the unit test** `src/styles.obsidian.test.ts` (§6) asserting the tokens, keyframes, and fonts are present in the CSS/route source.
11. **Run the gates** (§12) and update the docs loop (§10 of the hub): flip the dashboard row + all four sections, update this folder, `../obsidian-port-plan.md`, and `plan.md` §4.

---

## 6. Structure

No component tree (this item renders nothing). The change surface is two existing files plus one new test.

```
src/
  styles.css                 (EDIT · append the [data-obsidian] token layer + cad* keyframes + density rules)
  styles.obsidian.test.ts    (NEW · assert tokens/keyframes/fonts present)
  routes/
    __root.tsx               (EDIT · add Codystar + Caveat to the fonts <link>, line 122)
    _authenticated.tsx       (UNCHANGED here · OBS-02 mounts data-obsidian)
```

**New file:** `src/styles.obsidian.test.ts`. A `bun test` reading the raw source of `src/styles.css` and `src/routes/__root.tsx` and asserting on strings (no DOM, no build). Named assertions:

- `styles.css` contains `[data-obsidian]` and the sentinels `--canvas: #0A0A0B`, `--ember: #FF6B2C`, `--glacier: #7FD1DC`, `--font-serif`, `--radius-card: 12px`, `--ease: cubic-bezier(0.23, 1, 0.32, 1)`, `--shimmer-gradient`.
- `styles.css` contains all eight keyframe names: `cadPulse`, `cadGlow`, `cadShimmer`, `cadFlutter`, `cadDriftA`, `cadDriftB`, `cadRise`, `cadSlideIn`.
- `styles.css` contains `[data-obsidian][data-density="compact"]` and the reduced-motion block is scoped to `[data-obsidian]` (assert the string `[data-obsidian] *` appears inside a `prefers-reduced-motion` block, and that no new unscoped global `* {` reduced-motion block was added).
- `__root.tsx` fonts href contains `Codystar` and `Caveat` and still contains `Newsreader`, `Schibsted+Grotesk`, `JetBrains+Mono`.

**Data flow:** none. No server functions, no query keys, no TanStack Query. This item is consumed-by-name only: OBS-02+ reference `var(--...)` and the `cad*` animations. Server functions are neither consumed nor modified.

---

## 7. Design elements (embedded verbatim · copy these exact values)

### 7.1 Color tokens (from `tokens/colors.css`)

```
Surfaces:  --canvas #0A0A0B · --rail #0D0D0F · --card #111113 · --raised #17171A · --hover #1D1D21
           --surface-canvas var(--canvas) · --surface-rail var(--rail) · --surface-card var(--card)
           --surface-card-deep #0E0E10 · --surface-raised var(--raised) · --surface-hover var(--hover)
Hairlines: --hairline rgba(255,255,255,0.07) · --hairline-strong rgba(255,255,255,0.09) · --hairline-faint rgba(255,255,255,0.05)
Ink:       --text-primary #F2F0ED · --text-body #B5AFA6 · --text-muted #9C978F · --text-subtle #7D786F · --text-faint #55524C
Role:      --ember #FF6B2C · --ember-deep #C2571F · --ember-soft #FFA477
           --glacier #7FD1DC · --violet-shimmer #C77DFF
           --blossom #E5BDDF · --fuchsia #C2337E
           --moss #7FBF8E · --moss-bright #8FD9A0
           --madder #E06557 · --madder-bright #EE7A6C
           --marigold #E8B44C · --blush #F3C1C1
Working:   --tangerine #F97316 · --marigold-data #E8A33D · --melon #FF9466
           --scarlet #E23D33 · --poppy #F0533F
           --flamingo #F26B8A · --magenta #C2337E · --rose #E89AB0
           --mauve #B78BC7 · --amethyst #7E5AA6
           --cornflower #6B8AFD · --cobalt #3B5BDB
           --lemon #F2E27A · --daffodil #F5D94E
           --teal #2E9E8F
           --pearl #EDEAE4 · --ash #A8A29A · --slate #6E6A64
Pencil:    --pencil-lime #CDE07A · --pencil-blossom #E5BDDF · --pencil-apricot #FFB27A
Aliases:   --cta var(--ember) · --cta-pressed var(--ember-deep) · --cta-ink #0A0A0B
           --machine var(--glacier) · --link var(--blossom) · --focus-ring var(--glacier)
           --selection rgba(255,107,44,0.28)
```

### 7.2 Type tokens (from `tokens/typography.css`)

```
--font-serif  "Newsreader", ui-serif, Georgia, serif                       (display, heroes, spec bodies, ICE scores; 400-470; one italic word/screen)
--font-ui     "Schibsted Grotesk", ui-sans-serif, system-ui, sans-serif    (all UI; 13px base, 1.55 line height, 600 headings)
--font-mono   "JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace  (metadata; 9.5-10px caps, 0.10-0.12em tracking, middot separators)
--font-dotted "Codystar", cursive                                          (dotted numerals on aurora score cards ONLY)
--font-pencil "Caveat", cursive                                            (pencil annotations ONLY)

--text-hero 34px · --text-h2 28px · --text-card-title 20px · --text-score 52px
--text-base 13px · --text-sm 12px · --text-helper 11.5px · --text-mono-label 9.5px · --text-mono-micro 8.5px
--leading-body 1.55 · --leading-display 1.15 · --tracking-mono 0.12em · --tracking-display -0.015em
```

### 7.3 Geometry tokens (from `tokens/geometry.css`)

```
--space-1 4px · --space-2 8px · --space-3 12px · --space-4 16px · --space-6 24px · --space-10 40px
--radius-control 8px · --radius-card 12px · --radius-panel 14px · --radius-pill 99px · --radius-aurora 16px
```

### 7.4 Motion tokens (from `tokens/motion.css`)

```
--ease cubic-bezier(0.23, 1, 0.32, 1)
--dur-control 140ms · --dur-panel 200ms · --dur-page 280ms
--shimmer-gradient linear-gradient(90deg, #7FD1DC, #5B7CFA, #8B5CF6, #C77DFF, #EAF6FF, #3B5BDB, #7FD1DC)   (pair at background-size 280%, 5s drift; max one shimmer per screen)
```

### 7.5 The eight keyframes (from `tokens/motion.css`, verbatim, ported at top level)

```
cadPulse   0/100 scale(1) opacity 1 · 50 scale(1.55) opacity 0.45          (working status dots, 2s)
cadGlow    0/100 opacity 0.5 · 50 opacity 1                                 (waiting-on-you / thinking, 1.8s)
cadShimmer 0 bg-position 0% 50% · 50 100% 50% · 100 0% 50%                  (AI shimmer drift, 5s, with --shimmer-gradient)
cadFlutter 0/100 scaleX(1) · 50 scaleX(0.72)                               (butterfly wing, 3.4s, transform-origin 12px 12px)
cadDriftA  0/100 translate(0,0) scale(1) · 50 translate(18px,10px) scale(1.12)   (aurora blob, 9s)
cadDriftB  0/100 translate(0,0) scale(1.08) · 50 translate(-16px,-9px) scale(1)  (aurora blob, 12s)
cadRise    from translateY(10px) · to translateY(0)                        (entrance, 260ms pages / 200ms toasts, stagger 30ms/row, cap 6 rows)
cadSlideIn from translateX(60px) opacity 0.4 · to translateX(0) opacity 1  (slide-over from right, 240ms)
```

### 7.6 Density tokens (from `obsidian-extensions.md` §8)

Density is a spacing decision, never a font size decision. Comfortable is the default; compact drops one rhythm step on rows and cards, type and mono labels untouched, loop strip and top bar exempt. OBS-01 exposes the contract as tokens for OBS-03+ to consume:

```
[data-obsidian]                          (comfortable, default)
  --density-row-pad-y 14px · --density-row-pad-x 18px · --density-card-pad 20px · --density-list-gap 13px
[data-obsidian][data-density="compact"]  (compact)
  --density-row-pad-y 10px · --density-row-pad-x 14px · --density-card-pad 16px · --density-list-gap 9px
```

### 7.7 Interaction states this item establishes (consumed downstream)

OBS-01 renders nothing, so it designs no per-component hover/empty/error. It establishes the two global affordances every later control inherits:

- **Focus:** `:focus-visible` inside `[data-obsidian]` gets a 2px `--glacier` outline, offset 2px. Never a browser default, never a glow-only focus.
- **Selection:** text selection inside `[data-obsidian]` is `--selection` (ember at 28%).

Hover, active, empty, loading, and error states are the responsibility of the primitives (OBS-03) and surfaces (OBS-04+); they are out of scope here and are not designed in this file. The one rule OBS-01 enforces for them: hover is tonal (one surface step up + brighter hairline), never spatial; press on ember goes to `--ember-deep` with `scale(0.985)` for 140ms.

---

## 8. Restructuring / renaming / modification

- **No renames, no moves, no deletions, no route folds, no redirects.** OBS-01 is purely additive.
- **No lucide-import removal here.** That begins in OBS-02 (app chrome). OBS-01 removes zero imports.
- **No nav-model edit.** `src/lib/nav-model.ts` is untouched (OBS-02/OBS-10 own it).
- **One intentional non-verbatim delta:** the `prefers-reduced-motion` block is scoped to `[data-obsidian]` rather than the token file's global `*`. Reason: a global reduced-motion `*` block would reach the parchment landing page, violating "landing byte-untouched," and parchment already ships its own reduced-motion handling. This delta is logged in the ship report so the contract absorbs it.
- **One additive edit to `__root.tsx`:** two font families appended to one existing href. The three existing families and both preconnects are unchanged.

---

## 9. Copy / voice

OBS-01 ships **no user-facing strings** (no UI renders). The only authored text is source comments. Keep them humanized (no em or en dashes, use the middot `·`, no exclamation marks, no emoji, no AI-cliche words). Suggested section header comment for the appended block:

```
/* ============================================================
 * Cadence · Obsidian v3 · app-scoped token layer (OBS-01).
 * Ported verbatim from design-reference/obsidian-v3/tokens/*.css.
 * Scoped to [data-obsidian] so the parchment landing page is untouched.
 * Dark-only cockpit. Never invent a hex, a duration, or an easing here.
 * ============================================================ */
```

There is no empty state to author (nothing renders). The empty-state instruction law applies to consuming surfaces, not to this foundation.

---

## 10. Acceptance criteria

- [ ] `src/styles.css` contains a single appended `[data-obsidian] { ... }` block with every token from §7.1-§7.4 and §7.6, values matching the source token files exactly.
- [ ] All eight `cad*` keyframes are present at top level, verbatim from `motion.css`.
- [ ] The `prefers-reduced-motion` gate is present and scoped to `[data-obsidian]` (not global `*`).
- [ ] `[data-obsidian] :focus-visible` (2px glacier, offset 2) and `[data-obsidian] ::selection` (ember 28%) are present.
- [ ] `[data-obsidian][data-density="compact"]` overrides exist with the four density tokens.
- [ ] The `__root.tsx` fonts `<link>` href includes Codystar and Caveat and still includes Newsreader, Schibsted Grotesk, JetBrains Mono; no second stylesheet link was added.
- [ ] Parchment tokens, the `@theme inline` block, both parchment keyframes, and the landing page are byte-for-byte unchanged (git diff shows only appended lines in `styles.css` and one edited href line).
- [ ] `data-obsidian` is NOT mounted on any live DOM node (deferred to OBS-02).
- [ ] With `data-obsidian` set on an element in devtools, `getComputedStyle` resolves `--canvas` to `#0A0A0B` and `--ember` to `#FF6B2C`; removed after the check.
- [ ] `src/styles.obsidian.test.ts` passes with the assertions in §6.
- [ ] `tsc --noEmit` is 0; `bun test` is green; grayscale and restraint budget are trivially satisfied (nothing renders).

---

## 11. Prototype-parity checklist (tailored)

OBS-01 renders no surface, so the eight-point visual parity walk against `design-reference/obsidian-v3/design-reference/cadence-app.html` does not apply to a screen here. The equivalent foundation gate is a **token-fidelity diff**: open each of the five `tokens/*.css` files beside the appended `[data-obsidian]` block and confirm, name by name, that every custom property and every keyframe matches (value, unit, spelling). The parity that matters for this item is that a later surface built on these tokens can be pixel-indistinguishable from the prototype; if any token value differs from source, that guarantee is void. Specifically re-verify against the prototype's own token usage:

1. Surface ramp hexes exact (`#0A0A0B` / `#0D0D0F` / `#111113` / `#17171A` / `#1D1D21`).
2. Ember exactly `#FF6B2C`, deep `#C2571F`, glacier `#7FD1DC`.
3. Type scale exact (hero 34 / card-title 20 / base 13 / mono-label 9.5).
4. `--ease cubic-bezier(0.23, 1, 0.32, 1)`; durations 140 / 200 / 280.
5. Shimmer gradient stop order exact; keyframe percentages exact.
6. Reduced-motion gate present and scoped.
7. No stray hex introduced that is not in the token files.
8. Fonts requested match the five named stacks.

---

## 12. Verification + gates

- **`tsc --noEmit`** returns 0 (no TS surface changed; the new test is TS).
- **`bun test`** green, including the new `src/styles.obsidian.test.ts`.
- **`bun run build`** is RED in a lane worktree on the pre-existing node20-vs-ESM `lovable-tagger` `require()` error, unrelated to this item. In the worktree treat `tsc --noEmit` + `bun test` as the real gates; run full `bun run build` on the primary checkout before publish. Do not chase the lovable-tagger error.
- **Grayscale test:** trivially passes (no rendered screen).
- **Restraint budget:** trivially passes (no rendered screen); the budget is enforced by consumers.
- **`impeccable` / humanized-output scan:** grep the diff for the em dash character, the en dash character, the exclamation mark, and the banned-word list; the only authored text is comments. Confirm clean.
- **Manual checks:** git diff shows only appended lines in `styles.css` plus the one href edit in `__root.tsx`; the parchment landing page (`/`) renders unchanged in `bun run dev`; the devtools resolve check in §5 step 9 confirms `--canvas`/`--ember` resolve under `[data-obsidian]`; Codystar and Caveat load (Network tab shows the font requests when a `--font-dotted`/`--font-pencil` element is rendered, or confirm the CSS2 response lists both families).
- **Side-by-side screenshots:** not applicable (no surface). The ship report records the token-fidelity diff result and the reduced-motion scoping delta instead.

---

## 13. Risks · gotchas · founder-gates

- **Token-name collision (the big one).** Parchment defines `--card`, `--canvas`, and `--ember`, and Tailwind's `@theme inline` maps them to utilities (`bg-card`, `text-ember`, ...). Redefining them under `[data-obsidian]` re-resolves those utilities for any element inside the scope. Consequence: **do not mount `data-obsidian` on `_authenticated.tsx` in this item.** Merely defining the vars is inert (no existing element reads `var(--card)` directly; the utilities only flip when the attribute is on an ancestor). OBS-02 owns the mount and must handle the mixed-period fallout (obsidian shell over still-parchment pages) at that point. This is the single most important constraint in the spec.
- **Keyframes are global.** They cannot be scoped to an attribute. The `cad` prefix is the collision guard; confirm no existing `cad*` keyframe exists (none does) before appending.
- **Reduced-motion scope.** The verbatim token file uses a global `*` reduced-motion block. Porting it verbatim would touch the landing page. Scope it to `[data-obsidian]` (§8) and log the delta.
- **Font weight ranges.** Codystar ships only `300;400` and Caveat `500;600;700` (per `fonts.css`). Request exactly those; requesting unavailable weights bloats the CSS2 response or 404s a face.
- **Do not add a second `<link>`.** Extend the existing href so there is one font request, matching the current pattern and avoiding a render-blocking duplicate.
- **Follow-up, not a blocker: self-host fonts.** `implementation-notes.md` and `fonts.css` both flag self-hosting for production (removes the CDN dependency and the third-party preconnect). Track it as a later hardening item; the CDN link ships now.
- **Founder-gates: none.** OBS-01 changes no URLs, no data, no behavior a user sees. It needs no founder sign-off beyond the standing port ruling.

---

## 14. Interlinks

- **Hub (shared substrate, this item assumes it):** [`./README.md`](./README.md) · tokens §5, keyframes §5.6, codebase map §7, sequencing §3, gates §10, build-gate note §11.
- **Next item (consumes this):** [`./OBS-02.md`](./OBS-02.md) · the app shell mounts `data-obsidian` and consumes `--rail`, the mono index, the keyboard map; it inherits the collision-mount responsibility flagged in §13.
- **Design law:** [`../../../DESIGN-OBSIDIAN.md`](../../../DESIGN-OBSIDIAN.md) · §1 surfaces, §2 role colors, §3 working palette, §5 type, §6 geometry and motion.
- **Token source of truth (port verbatim):** [`../../../design-reference/obsidian-v3/tokens/`](../../../design-reference/obsidian-v3/tokens/) · `colors.css`, `typography.css`, `geometry.css`, `motion.css`, `fonts.css`.
- **Implementation notes:** [`../../../design-reference/obsidian-v3/implementation-notes.md`](../../../design-reference/obsidian-v3/implementation-notes.md) · Styling approach, Motion, Accessibility.
- **Density + empty-state law:** [`../../../design-reference/obsidian-extensions.md`](../../../design-reference/obsidian-extensions.md) · §8 density modes, §9 empty-state catalog.
- **Board + bible:** [`../feature-dashboard.md`](../feature-dashboard.md) (group G14) · [`../obsidian-port-plan.md`](../obsidian-port-plan.md) · [`../SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md).
- **Strategy + doctrine:** [`../../strategy/v11-guiding-star.md`](../../strategy/v11-guiding-star.md) · [`../../conventions/engine-room-doctrine.md`](../../conventions/engine-room-doctrine.md) · [`../../conventions/humanized-output.md`](../../conventions/humanized-output.md).
