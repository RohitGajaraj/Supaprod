# OBS-07 · Plan ported to Obsidian (cited specs + outcome roadmap)

> _Created: 2026-07-02 · Self-contained build + implementation spec. Pick this cold and build it. It embeds the exact tokens, anatomies, states, copy, file paths, and gates. It links out only for the shared canon (the hub) and sibling build-order items._

## 1. Snapshot

| Field | Value |
| --- | --- |
| ID | OBS-07 |
| Rank | #8 |
| Tier | 1 |
| Status | Pending (not started) |
| Category | Define |
| Depends on | OBS-03 (Obsidian primitives) · assumes OBS-01 (tokens/fonts) + OBS-02 (shell) landed |
| Blocks | nothing downstream (OBS-10 folds routes into this destination) |
| One-line what | Plan as the definition desk: a 1160px surface with an outcome-declared roadmap (Now / Next / Later, each bet carrying its mono measure line, Now ember-tinted, Later deep and dimmed) plus a cited spec list (state chips, blossom cites count, serif body in a read slide-over), and a commit-to-Now ceremony that states the promise + measure before a bet lands. |
| Dashboard row | [`../SOURCE-OF-TRUTH.md`](../../../SOURCE-OF-TRUTH.md) line 238 (group G14) |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md) (OBS-07 entry) |
| Hub | [`./README.md`](./README.md) |

## 2. Why we are doing it

Plan is where a signal that survived Discover becomes a **committed bet with a promise**. Today that lives across three parchment surfaces (`/product?tab=roadmap`, `/product?tab=specs`, `/prds/$id`) built in the retired Ember Editorial idiom. This item ports the Plan destination (IA index 03) to Obsidian so the definition ritual reads as one calm instrument, not a kanban.

It serves all three Obsidian laws (contract §0). **One object, one anatomy:** the Spec and the Outcome each render with their single canonical anatomy (§9 below), identical to everywhere else. **Depth on demand:** the roadmap is a quiet list of bets; a spec opens a slide-over showing its serif body with margin citations; the full editor is one layer deeper. Layer one never shows more than one bet's worth of information. **One queue for attention:** Plan holds no approvals. Anything needing a human is a Call on Today, never a badge here. Ember appears on this surface in exactly one place: the commit-to-Now ceremony CTA, because committing is a promise a human is making.

The felt outcome ties straight to the v11 guiding star (the decision-and-outcome layer): a roadmap that refuses to hold a bet without a declared measure is the anti-feature-factory posture made visible. The measure line under every bet (`DROP-OFF -20% BY AUG 1`) is the product thesis rendered in mono. The engine-room doctrine holds too: no machinery is exposed here (no drag scaffolding, no bulk toolbars, no sprint math). The surface names the outcome, not the mechanism.

## 3. What we are building

**Scope IN**

- A new Plan surface at `/plan`, built to prototype parity at 1440px: the 1160px container, the Newsreader hero, an outcome roadmap of three columns (Now / Next / Later), and the cited spec list below it (match the prototype's section order).
- The **roadmap columns**: Now (ember header + ember-tinted card borders), Next (neutral), Later (deep cards, dimmer ink). Each bet card carries its title and a mono-caps **measure line**.
- The **commit-to-Now ceremony**: a confirm dialog that states the promise (outcome) and the measure before a bet moves into Now; it requires both when they are missing.
- The **spec list**: a row per spec with a state chip (APPROVED moss / CRITIC REVIEW marigold / DRAFTING glacier), a blossom mono cites count (`11 SOURCES`), and a note.
- A **spec detail slide-over** (depth layer two): the spec body rendered in Newsreader serif with margin citations, read-only, plus a quiet `Open full spec →` link to the existing editor.
- Empty states for both sections as instructions with time estimates; loading and error states; the full interaction-state set.

**Scope OUT (no feature work rides along)**

- No server function is modified. This item **consumes read-only** `listSpecs` → `["prds"]`, `getRoadmap` → `["roadmap"]`, and `getPrd` → `["prd", id]`. It **calls** two existing roadmap mutations for the commit path (`commitRoadmapItem`, `updateRoadmapItem`) with no signature change; nothing else writes.
- No drag-and-drop, no bulk re-prioritize bar, no backlog column, no brief→PRD composer, no rename/delete/lineage/task-graph, no Linear push. Those are parchment `RoadmapBoard` / `SpecsPanel` / `/prds/$id` affordances that stay live until OBS-10 relocates them (see §13).
- No route redirect, no nav-model edit, no `routeTree.gen.ts` hand-edit. Folding `/product` · `/prds` · `/roadmap` into `/plan` is OBS-10.

## 4. Current state (real files read 2026-07-02)

- **There is no `/plan` route today.** The path is free. `src/routes/_authenticated.roadmap.tsx` redirects to `/product?tab=opportunities`; `src/routes/_authenticated.prds.index.tsx` redirects to `/product?tab=specs`; `src/routes/_authenticated.prds.tsx` is a bare `<Outlet />` layout.
- **The real Plan lives in `/product`.** `src/routes/_authenticated.product.tsx` renders the parchment surface: `AppShell` + `TopBar`, a `SurfaceHeader` (mono kicker "Loop · Sense", **lucide `Compass`**, serif title "Product"), a `PortfolioBoard`, and a `TabRow` (signals · opportunities · roadmap · specs · releases). The `roadmap` tab mounts `RoadmapBoard`; the `specs` tab mounts `SpecsPanel`.
- **`src/components/product/RoadmapBoard.tsx`** · parchment four-column board (Backlog / Now / Next / Later) with native HTML5 drag, a bulk re-prioritize bar, inline outcome+measure edit, parchment `MonoLabel` + `VerdictChip`. Data via `getRoadmap()` → `["roadmap"]`; writes via `updateRoadmapItem` (lenient move) and `commitRoadmapItem` (governed: requires outcome + measure) and `bulkUpdateRoadmapItems`. `RoadmapItem = { id, title, ice_score: number|null, bucket: "now"|"next"|"later"|null, outcome: string|null, measure: string|null }`; the query returns `{ items, governanceGaps }`.
- **`src/components/product/SpecsPanel.tsx`** · parchment bento table (Spec / State / Critic / Cites / Updated / actions), `StatusBadge` state mapping, `CriticBadge`, lucide icons, a brief→PRD composer, row nav to `/prds/$id`. Data via `listSpecs()` → `["prds"]`; each row has `id, title, status, citations[], critic_review, updated_at, github_issue_url`.
- **`src/routes/_authenticated.prds.$id.tsx`** · the full parchment spec editor (markdown edit/preview, lucide everywhere, sticky action bar, `CitationsCard`, provenance, `OutcomeCard`). Data via `getPrd({ data: { id } })` → `["prd", id]` with `title, body_md, status, updated_at, citations, github_issue_url, critic_review`. **This editor stays intact** (OBS-07 links into it, does not replace it).
- All of the above are parchment: wrong palette, lucide icons, parchment class names. **None are edited by OBS-07.** They keep working on `/product` and `/prds/$id` until OBS-10.

## 5. How, step by step

Build top to bottom. Each step names the file and the change. This assumes OBS-01 (`[data-obsidian]` + fonts + keyframes in `src/styles.css` / `__root.tsx`), OBS-02 (shell + rail), and OBS-03 (`VerdictChip`, `MonoLabel`, `Button`, `SlideOver`, `Citation`, `Toast` under `src/components/obsidian/`) have landed. **Verify first:** grep `src/styles.css` for `data-obsidian`, `--canvas`, `cadSlideIn`. If OBS-03 primitive names differ at build time, adapt the imports; the anatomies below are the contract.

1. **Create `src/components/plan/format.ts`.** Pure helpers, no server calls:
   - `stateChip(status: string): { label: string; tone: "moss" | "marigold" | "glacier" }` · `approved` → `{ APPROVED, moss }`, `shipped` → `{ SHIPPED, moss }`, `review` → `{ CRITIC REVIEW, marigold }`, else (`draft`/null) → `{ DRAFTING, glacier }`.
   - `citesLabel(citations: unknown): string | null` · `Array.isArray` guard; `N SOURCES` (or `1 SOURCE`), `null` when zero.
   - `measureCaps(measure: string | null): string | null` · upcases a user-authored measure for the mono line; `null` when empty. Render verbatim otherwise (never rewrite the human's words).
     Unit-test this file.
2. **Create `src/components/plan/BetCard.tsx`.** Props `{ title, measure, outcome, column, iceScore, onMoveTo, hasOutcome }`. Renders the bet anatomy in §7 (title + measure mono line + the ember `Needs outcome` VerdictChip when `!hasOutcome`, and the three quiet mono move controls). Tint follows `column` (Now ember border, Next neutral, Later deep + dim). The whole card is a real element; move controls `stopPropagation`.
3. **Create `src/components/plan/CommitCeremony.tsx`.** A `role="dialog"` `aria-modal` centered glass panel (focus-trapped, Esc + scrim close, restore focus). Props `{ bet, onConfirm, onCancel }`. If the bet already has `outcome` + `measure`, the body **states the promise** and the CTA commits directly. If either is missing, the body shows two inputs (outcome, measure) and the CTA is disabled until both are filled (mirrors the governed `commitRoadmapItem` contract). Copy in §9.
4. **Create `src/components/plan/RoadmapColumns.tsx`.** Consumes `getRoadmap` (`["roadmap"]`, the exact key `RoadmapBoard` uses, to share the cache). Filter items to buckets `now | next | later` (ignore `bucket === null` backlog items on this surface · backlog placement is parchment scope, §13). Render three columns in order Now / Next / Later; within each, order by `ice_score` desc. Each item → `BetCard`. `onMoveTo("now")` opens `CommitCeremony`; on confirm, call `commitRoadmapItem({ data: { id, bucket: "now", outcome, measure } })`, invalidate `["roadmap"]`, fire the Toast. `onMoveTo("next" | "later")` calls `updateRoadmapItem({ data: { id, bucket } })` (lenient), invalidate + Toast. Handle loading (three ghost columns), error (house-voice retry), and the empty roadmap instruction (§9).
5. **Create `src/components/plan/SpecList.tsx`.** Consumes `listSpecs` (`["prds"]`, the exact key `SpecsPanel` uses). Render a quiet list; each spec row is a real `<button>` that opens the spec detail slide-over (step 6). Cells: title 13px/600 · `stateChip` → `VerdictChip` · `citesLabel` in blossom mono · a note (relative-updated in mono). Handle loading (four ghost rows), error, and the no-specs instruction (§9).
6. **Create `src/components/plan/SpecDetail.tsx`.** A `SlideOver` (OBS-03 chassis, `cadSlideIn` 240ms, focus trap + restore, Esc + scrim close). Props `{ id, onClose }`. Consumes `getPrd` (`["prd", id]`). Header: mono `SPEC` label + `stateChip` + Newsreader 21px/460 title. Body: `body_md` rendered in **Newsreader serif** with **margin citations** · each `citations[]` entry a superscript blossom `Citation` chip in the right margin, verbatim quote on hover/focus. Footer: quiet `Open full spec →` glacier link to `/prds/$id` (editing stays in the existing editor). Read-only; no save, no AI, no task graph here.
7. **Create `src/components/plan/PlanSurface.tsx`.** The orchestrator: the 1160px container with `cadRise`, the Newsreader hero (`Plan` with the one ember italic word, per the prototype), then `RoadmapColumns`, then `SpecList` (match the prototype's vertical order). Owns the spec-detail open state (`specOpen: id | null`) and renders `SpecDetail`. One `Toast` host at the surface root (singleton).
8. **Create `src/routes/_authenticated.plan.tsx`.** A TanStack route at `/_authenticated/plan` rendering `PlanSurface` inside the shell. If OBS-02 hoisted the shell into `_authenticated.tsx`, render only `<PlanSurface />`; otherwise wrap in the Obsidian `AppShell` + top bar. `head: () => ({ meta: [{ title: "Plan · Supaprod" }] })`. Add an `errorComponent` in the house voice. Let the router plugin regenerate `routeTree.gen.ts` (never hand-edit).
9. **Tests.** Add `src/components/plan/format.test.ts` (stateChip mapping incl. the four branches, citesLabel singular/plural/zero, measureCaps upcasing + null) and a render smoke test: a bet with no `outcome` shows the ember `Needs outcome` chip and moving it to Now opens the ceremony; a bet with both commits directly. Run `tsc --noEmit`, `bun test`, and the side-by-side parity walk (§11).

## 6. Structure

```
src/routes/_authenticated.plan.tsx        (NEW · route, mounts PlanSurface in the shell)
src/components/plan/
├── PlanSurface.tsx                        (NEW · 1160 container, hero, roadmap + spec list, toast host, spec-detail state)
├── RoadmapColumns.tsx                     (NEW · Now/Next/Later, consumes ["roadmap"], commit + move writes)
├── BetCard.tsx                            (NEW · title + measure mono line, column tint, move controls)
├── CommitCeremony.tsx                     (NEW · commit-to-Now confirm dialog, states promise + measure)
├── SpecList.tsx                           (NEW · spec rows, consumes ["prds"], opens SpecDetail)
├── SpecDetail.tsx                         (NEW · slide-over, Newsreader body + margin citations, consumes ["prd", id])
├── format.ts                              (NEW · stateChip, citesLabel, measureCaps)
└── format.test.ts                         (NEW · unit + render smoke tests)
```

**Data flow (all query keys shared with the still-live parchment surfaces · never introduce a parallel key):**

- `RoadmapColumns` → `getRoadmap()` → `["roadmap"]` (read) · `commitRoadmapItem` / `updateRoadmapItem` (write, existing fns, unchanged).
- `SpecList` → `listSpecs()` → `["prds"]` (read).
- `SpecDetail` → `getPrd({ data: { id } })` → `["prd", id]` (read).

**Server functions are consumed, not modified.** OBS-07 is explicitly allowed to _call_ `commitRoadmapItem` and `updateRoadmapItem` (the commit ceremony and column moves) because those already exist and carry the governance rule; it changes neither signature nor behavior.

## 7. Design elements

> Tokens quoted from hub §5. Port as `[data-obsidian]`-scoped custom properties (OBS-01); the literal hexes below are the resolved values. Never invent a hex, duration, or easing.

**Surface container.** `max-width: 1160px; margin: 0 auto; padding: 36px 32px 64px; animation: cadRise 260ms cubic-bezier(0.23,1,0.32,1) both`. Top bar 52px with a bottom hairline (from the shell). Hero: Newsreader `--text-hero 34px`, weight 420, `-0.015em`, line 1.15, `--text-primary #F2F0ED`, with exactly **one italic emotional word** (per the prototype's Plan hero). Sub line `--text-body #B5AFA6` 13px.

**Roadmap columns.** Three-column CSS grid, `gap: 16px (--space-4)`. Column header: `MonoLabel` 9.5px caps, `0.11em` tracking, middot separators. Card `--radius-card 12`, padding `16px 18px`, gap between cards `12px`.

| Column | Header color | Card background | Card border | Ink |
| --- | --- | --- | --- | --- |
| **Now** | `--ember #FF6B2C` | `--card #111113` | `1px rgba(255,107,44,0.25)` (ember-tinted) | `--text-primary` title |
| **Next** | `--text-primary #F2F0ED` | `--card #111113` | `1px --hairline rgba(255,255,255,0.07)` | `--text-primary` title |
| **Later** | `--text-muted #9C978F` | `--surface-card-deep #0E0E10` | `1px --hairline-faint rgba(255,255,255,0.05)` | `--text-muted` title (dimmed) |

**Bet card anatomy** (`BetCard`, from components.md "Roadmap columns"):

1. Title: 13px/600, `--text-primary` (Later: `--text-muted`), single line ellipsis.
2. Measure line: `--font-mono` **8px caps**, `0.11em` tracking, `--text-faint #55524C` with the number in `--glacier #7FD1DC` (the machine's declared target). Example render: `DROP-OFF -20% BY AUG 1`. Rendered verbatim from the human's measure; omit the line if none.
3. When `!hasOutcome`: an ember `VerdictChip` reading `NEEDS OUTCOME` (mono 8.5px caps, ember fill 12%, 45%-alpha ember border), leading the card · an annotation, not a badge.
4. Move controls: three quiet mono links `NOW · NEXT · LATER` (`--text-subtle`, hover `--glacier`), the card's current bucket rendered inert. `NOW` opens the ceremony; `NEXT`/`LATER` move immediately.

**Spec list row** (`SpecList`, from components.md "Spec list"): a real `<button>`, full width, `14px 18px` padding, bottom `--hairline`, hover fill `--hover #1D1D21` (tonal lift one step, 140ms, nothing translates). Cells: title 13px/600 `--text-primary` (ellipsis) · `VerdictChip` state chip · cites count `--font-mono` 9px caps in `--blossom #E5BDDF` (`11 SOURCES`) · note (relative-updated) `--font-mono` 9px `--text-faint`.

**State chip tones** (OBS-03 `VerdictChip`): APPROVED / SHIPPED `--moss #7FBF8E` (text `--moss-bright #8FD9A0`) · CRITIC REVIEW `--marigold #E8B44C` · DRAFTING `--glacier #7FD1DC`. Pill `--radius-pill 99`, 12% tinted fill, 45%-alpha border of the same hue, no icon.

**Spec detail slide-over** (`SpecDetail`): 480px (max 92vw), fixed right, `bg #101013`, left `--hairline-strong rgba(255,255,255,0.09)`, `cadSlideIn 240ms`. Scrim `rgba(4,4,5,0.6)` + `blur(3px)`. Body: `body_md` in `--font-serif "Newsreader"` ~15px, line 1.7, `--text-body #B5AFA6`; headings Newsreader `--text-primary`. **Margin citations:** superscript blossom `Citation` chips in a right gutter, verbatim quote + source in a glass popover on hover/focus (backdrop blur 20, 8% white hairline). Footer: `Open full spec →` quiet glacier mono link + `Esc closes` in `--text-faint` 11px.

**Commit ceremony dialog** (`CommitCeremony`): centered, 480px (max 92vw), glass (`--raised #17171A` base, blur 20, 8% white hairline), `--radius-panel 14`, `cadRise 200ms`. Header Newsreader 20px/460. Body states the promise + measure (or the two inputs when missing). CTA: **the one ember button on this surface** (`--ember` fill, `--cta-ink #0A0A0B`, 13px/600, `--radius-control 8`, padding 9/18; hover `--ember-deep #C2571F`; press scale(0.985) 140ms). Secondary `Not yet` (`--hover #1D1D21` fill, 9% white border). Consequence helper 11.5px `--text-subtle`.

**Interaction states (every control answers the cursor):**

- _Hover:_ background lifts one surface step + hairline brightens, 140ms `--ease`. Tonal, not spatial · nothing translates.
- _Focus:_ `:focus-visible` 2px `--glacier` outline, offset 2, on every bet card, spec row, move control, and dialog control.
- _Active/press:_ ember CTA → `--ember-deep`, `transform: scale(0.985)` 140ms.
- _Selection:_ `--selection rgba(255,107,44,0.28)`.
- _Empty:_ the instruction cards in §9 (never a blank box, never an illustration).
- _Loading:_ roadmap = three ghost columns (hairline card outlines, no spinner); spec list = four ghost rows; spec detail = a three-line shimmer on the serif body (the one shimmer budget, `cadShimmer` 5s).
- _Error:_ a `--surface-card-deep` card, mono `--madder` label ("Couldn't load Plan"), the message, and a quiet `Retry · reloads the surface` link.
- _Motion:_ all of the above gate on `prefers-reduced-motion` (durations zeroed) and the in-product toggle.

**Restraint budget audit (hub §4):** one ember CTA (the ceremony) · zero aurora cards · at most one shimmer (the spec-body loading state) · zero pencil annotations on this surface · status color only on state chips and the Needs-outcome chip · one machine voice (glacier on the measure number and move-control hover). Grayscale test: every state chip ships its word, every measure ships its text, so the screen reads with color removed.

## 8. Restructuring / renaming / modification

- **New files only** (all listed in §6). No existing file is renamed, moved, or deleted by OBS-07.
- **No route redirect, no nav-model edit.** `/product`, `/prds`, `/prds/$id`, `/roadmap` keep their current behavior; the rail is not re-pointed to `/plan` yet. All of that is OBS-10.
- **No lucide removal in this item's new files** because none of them import lucide (the Obsidian iconography law: no icon set, mono affordances `→` and the middot `·` only). The lucide imports in parchment `RoadmapBoard` / `SpecsPanel` / `_authenticated.product.tsx` / `_authenticated.prds.$id.tsx` are left in place; they die when OBS-10 folds `/product` and `/prds`.
- **No parchment `Primitives.tsx` edit.** OBS-07 imports the Obsidian set from `@/components/obsidian`; do not import the parchment `VerdictChip` / `MonoLabel` / `Citation` by muscle memory (name collision, OBS-03 §13).
- **`routeTree.gen.ts`** is regenerated by the router plugin when `_authenticated.plan.tsx` is added. Do not hand-edit it.

## 9. Copy / voice

Humanized: no em/en dashes (middot `·` or a plain hyphen), no exclamation marks, no emoji, plain-words buttons, consequence in helper text, mono-caps metadata with middots.

- **Hero (roadmap section):** `The bets you have committed to.` with one ember italic word per the prototype (for example _committed_). Sub: `Every bet declares an outcome and a measure. Nothing hides in a backlog.`
- **Column headers:** `NOW` · `NEXT` · `LATER` (mono caps).
- **Bet measure line (example, rendered verbatim from the human):** `DROP-OFF -20% BY AUG 1`.
- **Needs-outcome chip:** `NEEDS OUTCOME`.
- **Move controls:** `NOW` · `NEXT` · `LATER`.
- **Commit ceremony (bet already has outcome + measure):**
  - Title: `Commit this to Now`
  - Body: `You are promising: [outcome]. Measured by [measure].`
  - CTA: `Commit to Now` · Secondary: `Not yet`
  - Helper: `Now is the one thing the team builds next · everything else waits.`
- **Commit ceremony (outcome or measure missing):**
  - Title: `Name the promise first`
  - Body inputs: placeholder `Outcome · what changes for the user` and `Measure · how you will know`
  - CTA (disabled until both filled): `Commit to Now`
  - Helper: `A bet in Now needs a promise and a number · that is the whole point.`
- **Commit toast:** `Committed to Now. The team builds this next.` · Move-to-Next/Later toast: `Moved to [Next|Later].`
- **Spec list section header:** `Specs, with their receipts.`
- **Cites count:** `11 SOURCES` (mono caps, blossom).
- **Spec detail footer link:** `Open full spec →`
- **Empty state · no specs on the roadmap yet** (roadmap section): `No bets on the roadmap yet. Commit a ranked opportunity from Discover and give it an outcome · about a minute.`
- **Empty state · no specs** (spec list, from extensions §9): `No specs yet. Approve an opportunity and Scribe drafts the first one, cited, in about five minutes.`
- **Error card:** label `Couldn't load Plan` · action `Retry · reloads the surface`.

## 10. Acceptance criteria

- [ ] `/plan` renders the roadmap (Now / Next / Later) and the cited spec list at 1160px, indistinguishable from the prototype Plan surface at 1440px (layout, spacing, type, color).
- [ ] Now uses the ember header + ember-tinted card border; Next is neutral; Later is the deep `#0E0E10` card with dimmed `--text-muted` ink.
- [ ] Every bet card shows its title and, when present, its mono-caps measure line (glacier number, verbatim text); a bet with no outcome shows the ember `NEEDS OUTCOME` chip.
- [ ] Moving a bet to Now opens the commit ceremony; if the bet lacks an outcome or measure the ceremony collects both and the CTA is disabled until both are filled; confirming calls `commitRoadmapItem` and refreshes `["roadmap"]`.
- [ ] Moving a bet to Next or Later calls `updateRoadmapItem` and refreshes without a ceremony.
- [ ] Each spec row shows title + a state chip (APPROVED/SHIPPED moss · CRITIC REVIEW marigold · DRAFTING glacier) + a blossom `N SOURCES` cites count + a mono note; clicking opens the spec detail slide-over.
- [ ] The spec detail slide-over renders the spec body in Newsreader serif with margin citations (verbatim quote on hover/focus) and a quiet `Open full spec →` link to `/prds/$id`; it is read-only.
- [ ] Both empty states render as instructions with a time estimate; loading and error states render per §7.
- [ ] Exactly one ember element on the surface (the ceremony CTA). No aurora card. Grayscale screenshot still reads. Restraint budget audited.
- [ ] Query keys `["roadmap"]`, `["prds"]`, `["prd", id]` are shared with the parchment surfaces (no divergent data).
- [ ] `tsc --noEmit` = 0; `bun test` green including the new `format.test.ts`; no em/en dash, exclamation mark, or banned word in any new string.

## 11. Prototype-parity checklist (last gate · hub §5.9, tailored)

Open `design-reference/obsidian-v3/design-reference/cadence-app.html` (Plan) and `/plan` side by side at 1440px:

1. **Rail:** 236px, mono index with Plan (03) active (bg `#1A1A1E` + ember index) · from the shell; confirm Plan is the active destination.
2. **Surface chrome:** 52px top bar; container max-width 1160px; padding 36/32/64; `cadRise` 260ms entrance.
3. **Type:** hero Newsreader 34px with one ember italic word; bet titles 13px/600; spec body Newsreader ~15px/1.7; measure line mono 8px caps; cites mono 9px; mono labels 9.5px caps with middots.
4. **Color:** zero hexes outside the tokens; ember only on the ceremony CTA and the Now tint + Needs-outcome chip; state chips moss/marigold/glacier match; blossom on the cites count and citation chips.
5. **Motion:** hover 140ms one-step lift (nothing translates); slide-over `cadSlideIn` 240ms; ceremony `cadRise` 200ms; loading shimmer only on the spec body; reduced-motion kills all.
6. **Behavior:** clicking a spec opens the slide-over; Esc/scrim closes and restores focus; the commit ceremony gates on outcome + measure; the roadmap and the still-live `/product` never show divergent data.
7. **Copy:** plain-words buttons (`Commit to Now`, `Not yet`), consequence helpers, mono-caps metadata, no em dashes, no exclamation marks.
8. **Grayscale** screenshot still reads (every chip and measure carries its word); restraint budget audited (one ember, no aurora, at most one shimmer, zero pencils).

## 12. Verification + gates

- **tsc:** `bun run tsc --noEmit` = 0 (or the repo's `tsc` script).
- **Tests:** `bun test` green, including the new `src/components/plan/format.test.ts` (stateChip four branches, citesLabel singular/plural/zero, measureCaps upcasing + null) and the ceremony render smoke test (no-outcome bet → ceremony collects fields; complete bet → commits directly).
- **Build:** run `bun run build` on the primary checkout / before publish. In a lane worktree `bun run build` is RED on the pre-existing node20-vs-ESM `lovable-tagger` `require()` error (hub §11) · treat `tsc --noEmit` + `bun test` as the real gates there; do not chase the lovable-tagger error.
- **Grayscale:** screenshot `/plan` with color removed; confirm meaning survives (chips carry words, measures carry text).
- **Restraint budget:** audit per hub §4 · one ember CTA, no aurora, at most one shimmer, zero pencils, status color only on status.
- **impeccable / humanized-output:** grep every new UI string for `-`, `-`, `!`, and the banned words (seamlessly, leverage, empower, robust, unlock, delve). Zero hits.
- **Manual:** load `/plan` against seeded data (`docs/operations/demo-credentials.md`); confirm a bet with no outcome shows the ember chip and the ceremony collects both fields; confirm a spec opens the serif slide-over with margin citations; confirm both empty states render on a fresh workspace. Attach the side-by-side prototype screenshots (Plan) to the ship report.
- **On completion:** flip the dashboard row + all four dashboard sections, remove the Active-claims line, update this folder + `../obsidian-port-plan.md` + `docs/features/obsidian-port.md` + `docs/planning/archive/build-log.md` §4 in the same unit of work.

## 13. Risks · gotchas · founder-gates

- **Backlog / capture relocation is an OBS-10 concern, not OBS-07's.** The parchment `RoadmapBoard` owns the backlog column, drag-drop, and bulk re-prioritize; `SpecsPanel` owns brief→PRD drafting, rename/delete, task-graph, and lineage. The Obsidian Plan surface (per the prototype) is read + move + commit + read-detail only. Before OBS-10 redirects `/product` → `/plan`, those write affordances must be relocated (⌘K acts in OBS-11, a quiet capture affordance, or a slide-over). Flag this to the founder as a dependency of OBS-10, not a gap in OBS-07.
- **Shared cache.** Reuse the exact existing query keys (`["roadmap"]`, `["prds"]`, `["prd", id]`) so `/plan` and the still-live `/product` never diverge. Do not introduce a parallel key.
- **The measure line is user-authored.** Render it verbatim (the human's own words and numbers); `measureCaps` only upcases for the mono style. Do not fabricate an example measure into real data.
- **The ceremony must honor the governance contract.** `commitRoadmapItem` already rejects a committed item without both outcome and measure; the dialog must collect both before enabling the CTA, or the server call throws and the toast surfaces the error.
- **Migration-tolerant reads.** `getRoadmap` is pre-migration tolerant (items may read as `bucket: null` before the roadmap columns land). Filtering to `now|next|later` means a fresh/unmigrated workspace shows the empty-roadmap instruction, which is correct.
- **No founder gate on OBS-07 itself.** The route rename/fold (and telling the founder the URL changes) is OBS-10's founder-gated step.

## 14. Interlinks

- **Hub (shared canon):** [`./README.md`](./README.md) · tokens (§5), restraint budget (§4), parity checklist (§5.9), IA target (§6), codebase map (§7).
- **Build-order neighbors:** [`OBS-03.md`](./OBS-03.md) (the primitives this consumes: `VerdictChip`, `MonoLabel`, `Button`, `SlideOver`, `Citation`, `Toast`) · [`OBS-06.md`](./OBS-06.md) (Discover sibling; shares the 1160px container and the Newsreader hero) · [`OBS-05.md`](./OBS-05.md) (Build cockpit sibling; the slide-over chassis pattern).
- **Route fold:** [`OBS-10.md`](./OBS-10.md) (folds `/product` · `/prds` · `/roadmap` → `/plan`; owns the backlog/capture relocation decision).
- **Canon anchors:** [`design/archive/obsidian-v3.md`](../../../../design/archive/obsidian-v3.md) §8 (Plan: cited specs, ceremony) · §9 (Verdict chips, Citations, Buttons) · §10 (voice) · [`/design-reference/obsidian-v3/components.md`](../../../design-reference/obsidian-v3/components.md) "Roadmap columns (Plan)", "Spec list (Plan)", "Mission slide-over" (slide-over chrome) · [`/design-reference/obsidian-extensions.md`](../../../../../design-reference/obsidian-extensions.md) §9 (no-specs empty state) · [`/design-reference/obsidian-v3/design-reference/cadence-app.html`](../../../design-reference/obsidian-v3/design-reference/cadence-app.html) (the Plan surface · the floor).
