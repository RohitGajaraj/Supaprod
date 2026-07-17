# Obsidian port · implementation specs (group G14) · the foundation hub

> _Created: 2026-07-02 · Last updated: 2026-07-02_
>
> **This folder is the finest-grain, self-contained build+implementation spec set for the Obsidian v3 port.** One file per pending item (`OBS-01.md` … `OBS-15.md`), each written so an implementing agent (or a human) can pick it cold and know exactly what to build, why, how, what the structure is, which design elements to add, and every rename/restructure/modification it entails - without opening any other file. This `README.md` is the shared substrate every per-item spec assumes: the design DNA, the codebase map, the sequencing, and the spec template. The umbrella board row **OBS-PORT** points here; each **OBS-0X** row points at its own file.

## How to use this folder

- **"pick `OBS-0X`"** → open [`OBS-0X.md`](#the-per-item-index). It is the complete package. It embeds the exact token values, component anatomies, states, copy, file paths, and gates it needs. It links back here only for the shared canon (this hub) and to sibling items for build-order.
- This is the **detailed layer**. The one-paragraph-per-ID summary bible is [`../obsidian-port-plan.md`](../obsidian-port-plan.md) (still valid; it is the fast index). The **design law** is [`/DESIGN-OBSIDIAN.md`](../../../DESIGN-OBSIDIAN.md); the frozen handoff package (tokens, `components.md`, `implementation-notes.md`, the runnable prototype, the specimen) is [`/design-reference/obsidian-v3/`](../../../design-reference/obsidian-v3/); the stub-surface specs are [`/design-reference/obsidian-extensions.md`](../../../design-reference/obsidian-extensions.md); the agent entry point is the `supaprod-design` skill. **When any spec here disagrees with the contract, the contract wins.** When a fine visual detail (a duration, a tint) differs between the contract text and the runnable prototype, the **prototype's rendering is the founder-approved outcome** - note the delta in the ship report so the contract absorbs it.

---

## 1. Why we are doing this (the theme, the goal, the north star)

Supaprod's app surfaces are being ported, surface by surface, from the parchment **"Ember Editorial"** system (kept ONLY for the public landing page) to **v3 "Obsidian"**, adopted as doctrine by founder ruling 2026-07-02.

**The design idea (the thing every screen must feel like):** _a calm instrument. A jet-black cockpit where the machine's work glows softly in glacier blue, and the only thing that ever asks for attention, in ember orange, is a decision that genuinely needs a human._ Warm asks, cool works. This is the felt expression of the v11 guiding star (the decision-and-outcome layer, trust at the point of decision) and the engine-room doctrine (calm front, deep engine behind one door). The visual restraint IS the product thesis: a PM tool that reduces the babysitting tax must itself never nag.

**Three laws answer every design question** (contract §0):

1. **One object, one anatomy.** Everything is one of seven objects - Signal, Opportunity, Spec, Mission, Call, Outcome, Learning. Each has exactly one card, one detail view, one status language, identical everywhere.
2. **One queue for attention.** Every gate, approval, and decision request is a **Call** in one queue with one badge. **Ember is reserved exclusively for it.**
3. **Depth on demand.** Three layers everywhere - quiet list → slide-over panel → full view. Layer one never shows more than one decision's worth of information.

**Why now / why it is ranked #1-#16:** the v11 capability front is complete; the product works but looks like scaffolding. Obsidian is the coherence pass that makes the working machine legible and trustworthy. It is presentation + IA wiring only - **no feature work rides along** (no server functions, no data-flow changes) except where an item explicitly says otherwise.

---

## 2. Standing constraints (bind EVERY item - non-negotiable)

1. **THE PROTOTYPE IS THE FLOOR (founder ruling 2026-07-02).** The shipped surface must be visually and behaviorally **indistinguishable** from `design-reference/obsidian-v3/design-reference/cadence-app.html` at 1440px: layout, spacing, hierarchy, type sizes, colors, glows, motion timing, keyboard behavior, hover/press states, and copy register. Anything we add goes **on top**; additions never move, remove, restyle, or simplify what the prototype shows. "Close enough" or a reinterpretation is an automatic **FAIL** (a prior handoff diverged from the reference and missed much of it; this rule exists so that never repeats). The **last gate of every surface** is the prototype opened side by side with the built surface, walking the parity checklist (§8 below), with screenshots in the ship report.
2. **Dark-only on app surfaces.** The landing page (`/`, `p.$slug`) keeps parchment and is **out of scope** - it must stay byte-untouched. Obsidian tokens are scoped to the authenticated app (`[data-obsidian]`), never global.
3. **Surgical diffs.** Every item gates on `tsc` 0 + `bun run build` (see the build-gate note in §11) + tests + the **grayscale test** + the **restraint budget** (§4) + `impeccable` (the humanized-output scan) on every string.
4. **Surface by surface, revertible per surface.** NOT a big-bang token flip. Mixed parchment/obsidian is expected mid-initiative and acceptable; the shell (OBS-02) flips first so the frame is coherent immediately.
5. **No feature work rides along.** A port item changes presentation and IA wiring, never server functions or data flow, unless the item says otherwise.
6. **Humanized-output law on every string** (§7). Enforced by the runtime sanitizer at the AI chokepoint AND by authored-copy review.

---

## 3. Sequencing and dependency graph

```
OBS-01  tokens+fonts ──▶ OBS-02  shell ──▶ OBS-03  primitives ──┐
(foundation, strictly ordered)                                  │
                                                                ▼
        ┌───────────────┬───────────────┬───────────────┬───────────────┬───────────────┐
     OBS-04          OBS-05          OBS-06          OBS-07          OBS-08          OBS-09
     Today           Build           Discover        Plan            Brain           Engine Room
     (ritual)        (cockpit)       (evidence)      (roadmap)       (record)        (four rooms)
        └───────────────┴───────────────┴───────────────┴───────────────┴───────────────┘
                                                                │  (surfaces 04..09 parallelize; one lane each)
                                                                ▼
                                                     OBS-10  IA consolidation (all routes → 5 + one door)
                                                                │
                        ┌───────────────┬───────────────┬───────────────┬───────────────┐
                     OBS-11          OBS-12          OBS-13          OBS-14          OBS-15
                     ⌘K palette      Ask (⌘J)        Settings        Onboarding      Chart grammar
                     +catalog        panel           +Admin door     golden path     (rides 05/08/09)
```

- **OBS-01 → 02 → 03 are strictly ordered foundation.** Nothing else starts until OBS-03 lands the primitives.
- **OBS-04..09 parallelize** after OBS-03 (one lane per surface; claim in the dashboard). Each surface consumes the OBS-03 primitives; it does not rebuild them.
- **OBS-10 (IA/route consolidation) lands after the five surfaces exist** (it needs the destinations real before it folds legacy routes into them).
- **OBS-11..14 follow OBS-10.** OBS-14 (onboarding) also needs the demo seed live + OBS-04 (it lands the user on Today).
- **OBS-15 (chart grammar) rides with the data surfaces** (OBS-05/08/09) - it is a cross-cutting rule set, not a standalone screen.
- **Founder-gated points:** OBS-10's route renames (redirects make it safe, but the founder must be told the URLs change) and OBS-14's demo-seed dependency. Nothing else is founder-gated.

---

## 4. The restraint budget (hard law, audited on every surface)

- **≥ 90% of any screen is neutral** (canvas, ink, hairlines).
- **One ember CTA** per screen · **at most one aurora card** · **at most one shimmering element** · **at most two pencil annotations** · **status color only on actual status**.
- **One machine voice: glacier.**
- **Grayscale test before shipping:** the screen must make complete sense with color removed. If meaning lives in color alone, add the word.

---

## 5. Shared design foundation (embedded verbatim - every item assumes these values)

> These are the exact token values from `design-reference/obsidian-v3/tokens/*.css`. **Never invent a hex, a duration, or an easing.** Port them as CSS custom properties scoped to `[data-obsidian]` (OBS-01). Per-item specs quote only the subset they use; the full set lives here.

### 5.1 Surfaces (depth from tint, never shadow)

| Token                 | Value                    | Use                                            |
| --------------------- | ------------------------ | ---------------------------------------------- |
| `--canvas`            | `#0A0A0B`                | page background                                |
| `--rail`              | `#0D0D0F`                | sidebar                                        |
| `--card`              | `#111113`                | default card                                   |
| `--surface-card-deep` | `#0E0E10`                | alternating rows, CallCard base                |
| `--raised`            | `#17171A`                | raised surface, table header, secondary button |
| `--hover`             | `#1D1D21`                | hover fill, avatar chip                        |
| `--hairline`          | `rgba(255,255,255,0.07)` | replaces shadows                               |
| `--hairline-strong`   | `rgba(255,255,255,0.09)` | slide-over / raised edges                      |
| `--hairline-faint`    | `rgba(255,255,255,0.05)` | faint dividers                                 |

Glass (slide-overs, hover cards): backdrop blur 20, 8% white hairline.

### 5.2 Ink

`--text-primary #F2F0ED` · `--text-body #B5AFA6` · `--text-muted #9C978F` · `--text-subtle #7D786F` · `--text-faint #55524C` (non-essential metadata only). Body ink on canvas ≈ 7:1.

### 5.3 Role colors (each has exactly ONE job - never repurpose)

- **Ember** `--ember #FF6B2C` (`--ember-deep #C2571F` pressed, `--ember-soft #FFA477` tints): **needs a human**. Calls, gates, the one primary CTA. Never decoration, never a label color.
- **Glacier** `--glacier #7FD1DC`: **the machine voice.** Live state, agent presence, mono-caps label accent, status pulses, the focus ring.
- **Royal violet** `--violet-shimmer #C77DFF`: ONLY inside the shimmer gradient and the working butterfly. Never a standalone accent.
- **Blossom** `--blossom #E5BDDF` (`--fuchsia #C2337E` depth): **information.** Links, citation chips (superscript).
- **Moss** `--moss #7FBF8E` (`--moss-bright #8FD9A0` chip text): outcomes only, positive (validated, shipped, kept).
- **Madder** `--madder #E06557` (`--madder-bright #EE7A6C`): outcomes only, negative (missed, failed, killed).
- **Marigold** `--marigold #E8B44C`: in-review status only.
- **Blush** `--blush #F3C1C1`: alternate light tint for small mono-caps labels.
- Semantic aliases: `--cta`=ember · `--cta-ink #0A0A0B` (text on ember fill) · `--machine`=glacier · `--link`=blossom · `--focus-ring`=glacier · `--selection rgba(255,107,44,0.28)`.

### 5.4 Working palette (data only - role colors NEVER plot data)

Spend/cost: `--tangerine #F97316` · `--marigold-data #E8A33D` · `--melon #FF9466`. Safety severity only: `--scarlet #E23D33` · `--poppy #F0533F`. User-behavior: `--flamingo #F26B8A` · `--magenta #C2337E` · `--rose #E89AB0`. Agent identity (one fixed shade per face): `--mauve #B78BC7` · `--amethyst #7E5AA6`. Benchmarks/baselines: `--cornflower #6B8AFD` · `--cobalt #3B5BDB`. Annotations/density: `--lemon #F2E27A` · `--daffodil #F5D94E`. The machine's data series: `--teal #2E9E8F`. Axes/grids/disabled: `--pearl #EDEAE4` · `--ash #A8A29A` · `--slate #6E6A64`. Pencil inks: `--pencil-lime #CDE07A` (best bet) · `--pencil-blossom #E5BDDF` (pet feature) · `--pencil-apricot #FFB27A` (scope creep). **Laws: max three families per chart; caramel/brown is banned.**

### 5.5 Type

| Token           | Value                                              | Voice                                                                                             |
| --------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `--font-serif`  | `"Newsreader", ui-serif, Georgia, serif`           | display, heroes, spec bodies, ICE scores. 400-470. **One italic emotional word per screen, max.** |
| `--font-ui`     | `"Schibsted Grotesk", ui-sans-serif, system-ui`    | ALL UI. 13px base, 1.55 line height, 600 headings.                                                |
| `--font-mono`   | `"JetBrains Mono", ui-monospace, "SF Mono", Menlo` | metadata. 9.5-10px caps, 0.10-0.12em tracking, middot `·` separators.                             |
| `--font-dotted` | `"Codystar", cursive`                              | dotted-matrix numerals on **aurora score cards only**.                                            |
| `--font-pencil` | `"Caveat", cursive`                                | **pencil annotations only.**                                                                      |

Scale: `--text-hero 34px` (Newsreader 420-440, -0.015em, 1.15) · `--text-h2 28px` · `--text-card-title 20px` (Newsreader 450-460, 1.3) · `--text-score 52px` (Codystar) · `--text-base 13px` (1.55) · `--text-sm 12px` · `--text-helper 11.5px` · `--text-mono-label 9.5px` · `--text-mono-micro 8.5px`. Never Inter, Roboto, or Fraunces.

### 5.6 Geometry, density, motion

- **Grid:** 4px. Rhythm `--space-1..10` = 4/8/12/16/24/40.
- **Radii:** `--radius-control 8` · `--radius-card 12` · `--radius-panel 14` · `--radius-pill 99` · `--radius-aurora 16`.
- **Interaction states (every control answers the cursor):** hover lifts the background one surface step and brightens the hairline (tonal, **not spatial** - nothing translates on hover); live elements add their role-color glow. Press: ember → `--ember-deep`, transform scale(0.985) for 140ms. Focus: **2px glacier outline, offset 2** (`:focus-visible`). Selection: ember at 28%.
- **One easing** `--ease cubic-bezier(0.23,1,0.32,1)`; durations `--dur-control 140ms` / `--dur-panel 200ms` / `--dur-page 280ms`.
- **Only three things move on their own:** live pulse on working agents, step progress, arrival of something new. **Decoration never animates.** Entrances are transform-first, staggered 30ms/row, capped at six rows.
- **The eight keyframes to port** (from `motion.css`, verbatim): `cadPulse` (working dots, 2s), `cadGlow` (waiting/thinking, 1.8s), `cadShimmer` (AI shimmer drift, pair with `--shimmer-gradient` at 280% size, 5s), `cadFlutter` (butterfly, 3.4s, transform-origin 12px 12px), `cadDriftA`/`cadDriftB` (aurora blobs, 9s/12s), `cadRise` (entrance, translateY 10px→0, 260ms pages / 200ms toasts), `cadSlideIn` (slide-over from right, 240ms).
- **The AI shimmer gradient:** `linear-gradient(90deg,#7FD1DC,#5B7CFA,#8B5CF6,#C77DFF,#EAF6FF,#3B5BDB,#7FD1DC)`, background-size 280%, 5s drift. Only on text/marks representing the machine actively working; **max one per screen**.
- **Aurora score cards:** multi-hue drifting radial washes + Codystar numeral, glow bleeding slightly past the card. Only on score moments (loop health, teardown confidence, outcome scores). Hue encodes state: moss-forward healthy, ember-forward needs attention, madder-forward failing.
- **All motion gates on `prefers-reduced-motion`** (the media block zeroes animation/transition durations) AND an in-product toggle.

### 5.7 Voice + humanized-output law

- A sharp PM's voice: calm, contractions, PM vocabulary (backlog, scope, ship, bet), **one wink per screen max**, always plain at trust moments. Examples: _"Zero calls. Enjoy the quiet roadmap."_ · _"Good call. The PR is open."_ · _"Scout is reading 48 hours of tickets so you don't have to."_
- **Buttons are one or two plain human words** (Approve, Send back, Build this, Start, Challenge). **Mechanism names are banned on controls**; the consequence goes in helper text (_"Opens the pull request · nothing ships without you"_).
- **Humanized-output law (hard, UI + everything agents generate):** no em or en dashes (use the middot `·`), no invisible Unicode, no AI-cliché words (seamlessly, leverage, empower, robust, unlock, delve), **no exclamation marks**, no emoji. Mono-caps metadata with middots (`SCOUT · STEP 2/5`, `$0.84`).
- **Empty states are instructions with a time estimate**, never a blank box, never an illustration.

### 5.8 Iconography law (a deliberate signature)

**There is NO icon set.** The nav uses the **mono numeral index (01-05)**. The only pictorial element is the **Butterfly mark** (`design-reference/obsidian-v3/assets/butterfly-*.svg` - idle/working/ember; **never redraw**). Affordances are unicode in mono: `→`, `⌘K`, the middot `·`. **Status is a 6px glowing dot + a mono-caps word, never an icon.** This is why the port removes `lucide-react` from app chrome (see §9).

### 5.9 The prototype-parity checklist (run at the END of every surface item)

Open the prototype and the built surface side by side at 1440px and verify:

1. **Rail:** 236px, mono index 01-05, active state bg `#1A1A1E` + ember index, the ONE Today badge, working shimmer line, Engine Room door, user chip.
2. **Surface chrome:** 52px top bar, container max-width (1060 / 1160 for Discover·Plan), 36/32/64 padding, `cadRise` entrance.
3. **Type:** hero Newsreader 34px with the one ember italic word; card titles 20px/460; UI 13px/1.55; mono labels 9-9.5px caps with middots.
4. **Color:** zero hexes outside the tokens; ember only on needs-a-human moments; glows match (badge `0 0 10px`, gate dot `0 0 10px 2px`, moss/glacier dots).
5. **Motion:** hover 140ms one-step lift; slide-over `cadSlideIn` 240ms; screen entry 260ms; pulses/glows only on live status; reduced-motion kills all.
6. **Behavior:** keyboard map (1-5, g, Esc), call answering rewrites hero + badge + progress + linked mission, slide-over gate sync, toast 3.6s singleton.
7. **Copy:** the register matches (plain-words buttons, consequence helpers, mono-caps metadata, no em dashes, no exclamation marks).
8. **Grayscale** screenshot still reads; restraint budget audited.

### 5.10 State model + core behaviors (from the prototype)

```
surface: "today" | "discover" | "plan" | "build" | "brain" | "govern"
missionOpen: missionId | null      // slide-over (deep-linked as ?mission=)
traceOpen: boolean                 // raw trace inside slide-over (resets per open)
answeredCalls: { [callId]: "ok" | "no" }
toast: string | null               // auto-clear after 3.6s, singleton
```

**Object shapes.** Call `{ id, kind, expiry, title, body, ev:[{src,text}], okLabel, noLabel, consequence, okToast, noToast }` (kinds: SHIP IT?, WORTH BUILDING?, SPEND). Mission `{ id, title, agent, cost, status: working|gate|done|queued, gateId?, verdict?, step, steps:[{n,agent,what,state}], trace:[line] }`.

**Answering a call** (`decide(id, ok)`): the call leaves the Today queue immediately; nav badge = unanswered count, hidden at zero; Today hero rewrites (count word in ember Newsreader italic; all-clear card gets a moss border); the voice-correct toast shows 3.6s; the "calls answered" progress bar advances; **cross-object sync** - a mission whose `gateId` matches flips (approve → done, step label "SHIPPED"/"MERGING"; send back → working, "REVISING") and its gate step in the slide-over flips too. **This linkage is the product's point: the Call, the mission row, and the slide-over are one object.** Switching surface always closes the slide-over.

### 5.11 Keyboard map

`1`-`5` switch the five surfaces · `g` opens the Engine Room · `⌘K` opens the command palette (acts) · `⌘J` summons Ask · `A`/`S` answer the current Call · `Esc` closes overlays. Ignore when a modifier is held or focus is in an input/textarea. Shortcuts reveal on hover in mono.

### 5.12 Accessibility contract

Focus 2px glacier outline offset 2 (`:focus-visible`). Selection ember 28%. **All rows/cards that act are real `<button>`s.** Status never relies on color alone (every dot ships its mono word). Slide-over / palette / Ask panel: `role="dialog"` + `aria-modal`, **focus trap, restore focus on close** (the prototype omits the trap; production MUST add it), Esc + scrim click close. Aurora blobs and glow layers `aria-hidden="true"`.

---

## 6. The IA target (five destinations + Ask + one door)

**Features NEVER add nav items.** The rail is fixed at five outcome-named destinations, mono-indexed:

| Index | Destination           | What it is                                                                                                                        | Ported by |
| ----- | --------------------- | --------------------------------------------------------------------------------------------------------------------------------- | --------- |
| 01    | **Today**             | the ritual - Call queue, what changed, machine status, the loop strip                                                             | OBS-04    |
| 02    | **Discover**          | signal feed + ICE-ranked opportunities, Critic verdict inline, Challenge as first-class                                           | OBS-06    |
| 03    | **Plan**              | cited specs (serif body) + outcome-declared roadmap (Now/Next/Later, each bet with its measure)                                   | OBS-07    |
| 04    | **Build**             | ONE cockpit for all missions - numbered steps, live pulses, inline gate, trace, cost                                              | OBS-05    |
| 05    | **Brain**             | decisions with outcome verdicts, learnings with what-they-moved, belief graph, exportable record                                  | OBS-08    |
| -     | **Ask** (⌘J)          | context-aware AI panel over any screen - **a panel, never a destination**                                                         | OBS-12    |
| door  | **Engine Room** (`g`) | one door → health summary → four rooms (Spend, Quality, Safety, Record). **Approvals never live here** (they are Calls on Today). | OBS-09    |
| -     | **Settings**          | four panes (You · Workspace · Connections · Plan) + role-gated Admin door                                                         | OBS-13    |

---

## 7. Current codebase map (what exists today, what the port changes)

> Grounding facts as of 2026-07-02, so specs name real files and capture exact restructures. Verify against the tree before editing - the codebase moves.

- **Styles:** `src/styles.css` (~47KB) is the parchment **"Ember Editorial"** system (Tailwind v4 `@theme inline`, oklch). OBS-01 **appends** an app-scoped Obsidian token layer under `[data-obsidian]`; the parchment tokens are untouched (landing page depends on them).
- **Fonts:** loaded via a Google Fonts `<link>` in `src/routes/__root.tsx` (~line 122): currently JetBrains Mono, Newsreader (incl. italic), Schibsted Grotesk. OBS-01 adds **Codystar** + **Caveat**.
- **Layout route:** `src/routes/_authenticated.tsx` mounts providers (`WorkspaceProvider`, `FlowModeProvider`), `BackendHealthBanner`, `BillingBanner`, `CommandPalette`, `GotoShortcuts`, `<Outlet>`. It does **NOT** render the rail today. The `[data-obsidian]` attribute belongs on this layout's root element (OBS-01/02).
- **Shell:** `src/components/supaprod/AppShell.tsx` + `TopBar.tsx` are imported and wrapped **per-page in ~50 routes** (today, build.index, settings, chat, sync, impact, fleet, changelog, …). OBS-02 must decide + document: **hoist one shell into `_authenticated.tsx`** (preferred - single source of chrome) vs. re-skin per-page. Either way the rail loses lucide and gains the mono index.
- **Nav model:** `src/lib/nav-model.ts` (pure, unit-tested `nav-model.test.ts`). Today it ships 5 destinations **Today · Ask(/chat) · Product(/product) · Build(/build) · Brain(/knowledge)** + an Engine Room door(`/govern`), **each with a lucide icon**. The Obsidian target reshapes this to **Today · Discover · Plan · Build · Brain**, drops the icons (mono index), and removes **Ask** from the rail (it becomes the ⌘J panel, OBS-12). This is a rename + reshape + icon-removal, handled across OBS-02 (render) and OBS-10 (route fold).
- **`lucide-react` footprint:** imported in **~140 files** including every shell component (`AppShell`, `TopBar`, `CommandPalette`, `LoopThread`, `AttentionBell`, `BudgetBar`, …). The port removes lucide from **app chrome**; "Done means" requires lucide gone from chrome (per-surface, not a big-bang delete).
- **Routes to fold (OBS-10):** ~60 `_authenticated.*` routes exist, e.g. `/today`, `/chat`, `/product`, `/build`(+`.$missionId`), `/discovery`, `/opportunities`, `/prds`(+`.$id`), `/roadmap`, `/knowledge`, `/memory`, `/agents`, `/traces`(+`.$traceId`), `/evals`, `/eval-health`, `/guardrails`, `/drift`, `/govern`, `/governance`, `/budgets`, `/analytics`, `/impact`, `/stakeholder`, `/trust-ledger`, `/sync`, `/integrations`, `/settings`, `/onboarding`, `/fleet`, `/swarm`, `/cockpit`, `/delegate`, `/inbox`, `/notifications`, `/tasks`, `/calendar`, `/meetings`, `/changelog`, `/docs`, `/learn`, `/observe`, `/outcome`, `/studio`(+`.$missionId`), `/missions`(+`.$missionId`), `/prompts`, `/briefing`. OBS-10 maps each to Today / Discover / Plan / Build / Brain / Engine Room and redirects the legacy path (no 404s; `routeTree.gen.ts` is regenerated, never hand-edited).
- **Existing primitives:** `src/components/supaprod/Primitives.tsx` + `CommandPalette.tsx` + `LoopThread.tsx` exist in the parchment idiom. OBS-03 builds the Obsidian primitive set (may extend or supersede these); OBS-11 supersedes `CommandPalette.tsx` with the glass palette.
- **`data-obsidian` does not exist yet** - OBS-01 introduces it. (OBS-01 is 🔨 in dev on lane1; check its actual progress before continuing it.)

---

## 8. The per-item index

| ID     | Rank | Tier | Depends on        | What it delivers                                                                                                                      | Spec                       |
| ------ | ---- | ---- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| OBS-01 | #2   | 1    | -                 | Tokens + fonts foundation (`[data-obsidian]` layer, 5 fonts, 8 keyframes, density attr)                                               | [`OBS-01.md`](./OBS-01.md) |
| OBS-02 | #3   | 1    | 01                | App shell (236px mono-index rail, no icons, top bar, keyboard map)                                                                    | [`OBS-02.md`](./OBS-02.md) |
| OBS-03 | #4   | 1    | 02                | Core primitives (Button, StatusDot, VerdictChip, MonoLabel, Toast, SlideOver, CallCard, MissionRow, AuroraCard, Citation, PencilNote) | [`OBS-03.md`](./OBS-03.md) |
| OBS-04 | #5   | 1    | 03                | Today ported (hero, Call queue, what-changed, loop strip, Loop Health aurora)                                                         | [`OBS-04.md`](./OBS-04.md) |
| OBS-05 | #6   | 1    | 03                | Build ported (mission rows + slide-over, inline gate, trace, `?mission=`)                                                             | [`OBS-05.md`](./OBS-05.md) |
| OBS-06 | #7   | 1    | 03                | Discover ported (signal feed + ICE opportunity rows, Challenge, one pencil)                                                           | [`OBS-06.md`](./OBS-06.md) |
| OBS-07 | #8   | 1    | 03                | Plan ported (cited spec list + Now/Next/Later roadmap, commit ceremony)                                                               | [`OBS-07.md`](./OBS-07.md) |
| OBS-08 | #9   | 1    | 03                | Brain ported (stat trio + export, decisions, learnings, belief graph)                                                                 | [`OBS-08.md`](./OBS-08.md) |
| OBS-09 | #10  | 1    | 03                | Engine Room ported (health + 2×2 rooms + room-detail pattern + connection strip)                                                      | [`OBS-09.md`](./OBS-09.md) |
| OBS-10 | #11  | 1    | 04-09             | IA consolidation (all routes → 5 destinations + one door; redirects)                                                                  | [`OBS-10.md`](./OBS-10.md) |
| OBS-11 | #12  | 2    | 10                | ⌘K palette + capability catalog (glass panel, JUMP·ACT·ASK·CATALOG)                                                                   | [`OBS-11.md`](./OBS-11.md) |
| OBS-12 | #13  | 2    | 10                | Ask (⌘J) summonable AI panel                                                                                                          | [`OBS-12.md`](./OBS-12.md) |
| OBS-13 | #14  | 2    | 10                | Settings four panes + role-gated Admin door                                                                                           | [`OBS-13.md`](./OBS-13.md) |
| OBS-14 | #15  | 2    | 10, 04, demo seed | Onboarding golden path                                                                                                                | [`OBS-14.md`](./OBS-14.md) |
| OBS-15 | #16  | 2    | 05/08/09          | Chart grammar adoption (incl. the pencil layer)                                                                                       | [`OBS-15.md`](./OBS-15.md) |

---

## 9. The spec template (every `OBS-0X.md` follows this - the reason picking one item is enough)

Each per-item file carries these sections, in order:

1. **Snapshot** - ID · rank · tier · status · category · depends-on / blocks · the one-line what · dashboard row link.
2. **Why we are doing it** - the goal + theme alignment (which of the three laws, which felt outcome, the v11/engine-room tie).
3. **What we are building** - scope IN and scope OUT; what rides, what explicitly does not; the "no feature work" boundary for this item.
4. **Current state** - the exact files/routes that exist today for this surface, what is parchment/lucide, what stays, what changes.
5. **How - step by step** - numbered, surgical, file-by-file build order.
6. **Structure** - component tree, new files, file moves/renames, data flow (server fns are consumed, not changed, unless stated).
7. **Design elements** - the exact tokens, type, spacing, radii, motion, and glow values this surface uses (embedded); and every interaction state designed: hover, focus, active, empty, loading, error.
8. **Restructuring / renaming / modification** - explicit list of renames, moves, deletions, redirects, lucide removals, nav-model edits.
9. **Copy / voice** - the exact strings (humanized), including empty states with time estimates.
10. **Acceptance criteria** - checkable, behavior-level.
11. **Prototype-parity checklist** - the 8 points (§5.9), tailored to this surface, as the last gate.
12. **Verification + gates** - tsc / build / tests / grayscale / restraint budget / impeccable / the specific manual checks + side-by-side screenshots.
13. **Risks · gotchas · founder-gates** - what could go wrong, what needs the founder.
14. **Interlinks** - back to this hub, to sibling OBS items, to the exact canon sections (contract §, components.md anatomy, extensions §).

---

## 10. Gates every item shares

`tsc --noEmit` = 0 · `bun test` green (new tests per item) · `bun run build` (see §11) · the **grayscale test** · the **restraint budget** audit (§4) · `impeccable` / humanized-output scan on every new string (grep new UI strings for `-`, `-`, and the banned-word list) · the **8-point prototype-parity checklist** with side-by-side screenshots in the ship report. On completion: flip the dashboard row + all four dashboard sections, remove the Active-claims line, update this folder + `../obsidian-port-plan.md` + `docs/features/obsidian-port.md` (the how-to-verify manual, created as the port lands) + `plan.md` §4, in the same unit of work.

## 11. Build-gate note (worktree reality)

`bun run build` is RED in lane worktrees on a pre-existing node20-vs-ESM `lovable-tagger` `require()` error, unrelated to any port work. In a lane worktree treat **`tsc --noEmit` + `bun test` as the real gates**; run the full `bun run build` on the primary checkout / before publish. Do not chase the lovable-tagger error.

---

## 12. Interlinks

- **Design law:** [`/DESIGN-OBSIDIAN.md`](../../../DESIGN-OBSIDIAN.md) · **handoff package:** [`/design-reference/obsidian-v3/`](../../../design-reference/obsidian-v3/) (`tokens/`, `components.md`, `implementation-notes.md`, the runnable `design-reference/cadence-app.html`, the `obsidian-specimen.html`) · **stub-surface specs:** [`/design-reference/obsidian-extensions.md`](../../../design-reference/obsidian-extensions.md) · **skill:** `supaprod-design`.
- **Board:** [`../feature-dashboard.md`](../feature-dashboard.md) (group G14, rows OBS-PORT + OBS-01..15) · **summary bible:** [`../obsidian-port-plan.md`](../obsidian-port-plan.md) · **SSOT:** [`../SOURCE-OF-TRUTH.md`](../SOURCE-OF-TRUTH.md).
- **Strategy tie:** [`../../strategy/v11-guiding-star.md`](../../strategy/v11-guiding-star.md) · **doctrine:** [`../../conventions/engine-room-doctrine.md`](../../conventions/engine-room-doctrine.md) · [`../../conventions/design-context.md`](../../conventions/design-context.md) · [`../../conventions/humanized-output.md`](../../conventions/humanized-output.md).
