# OBS-11 · ⌘K command palette + capability catalog

> _Created: 2026-07-02 · Last updated: 2026-07-02_

> _Spec created 2026-07-02 · self-contained build+implementation spec · read the hub [`README.md`](./README.md) once for shared canon; everything OBS-11 needs is embedded below._

## 1. Snapshot

| Field         | Value                                                                                                                                                                                                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ID            | OBS-11                                                                                                                                                                                                                                                                                                        |
| Rank          | #12                                                                                                                                                                                                                                                                                                           |
| Tier          | 2                                                                                                                                                                                                                                                                                                             |
| Status        | pending (pick after OBS-10 lands)                                                                                                                                                                                                                                                                             |
| Category      | Cockpit                                                                                                                                                                                                                                                                                                       |
| Depends on    | OBS-10 (route consolidation → the five canonical destinations must be real) · OBS-01/02/03 (tokens, shell, primitives)                                                                                                                                                                                        |
| Blocks        | nothing downstream                                                                                                                                                                                                                                                                                            |
| One-line what | Supersede the parchment cmdk palette with the glass ⌘K palette (560px, sections JUMP · ACT · ASK · CATALOG, mono index rows) plus the "What can it do?" capability catalog: every capability as a plain-words pitch with a "Try it on real data" action. The answer to 250+ features without growing the nav. |
| Dashboard row | [`../feature-dashboard.md`](../feature-dashboard.md) group G14, row OBS-11                                                                                                                                                                                                                                    |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md) (OBS-11 one-paragraph index)                                                                                                                                                                                                                           |

## 2. Why we are doing it

The product now has 250+ capabilities behind five destinations. If discovery lived in the nav, the rail would sprawl and the calm front would die. The palette is the pressure-release valve: **one keystroke reaches everything rare, and the nav never grows.** This is DESIGN-OBSIDIAN §12.1 stated as law ("rare = Cmd+K; new features never get nav items, badges, or banners") and the engine-room doctrine made literal · depth on demand, machinery behind one door.

It serves **Obsidian law 3 (depth on demand)** most directly: the palette is the quiet keystroke that reveals the whole surface area without ever putting it on screen. It also honors **law 1 (one object, one anatomy)** · result rows render objects (CALL · MISSION · SPEC) with the same mono-kind language they carry everywhere, and **law 2 (one queue for attention)** by refusing to become a second attention surface: the palette never nags, never badges, never proposes ember unless a Call is the match.

The felt outcome: a PM types ⌘K, thinks "what can this thing even do", reads the catalog in plain PM words ("Tear down a belief with receipts"), clicks **Try it on real data**, and watches it run against their own workspace. Discovery becomes a two-second reflex instead of a manual. This is the v11 guiding star's trust-at-the-point-of-action lens: the product proves each capability on the user's real data instead of describing it in marketing copy.

The current palette (`src/components/cadence/CommandPalette.tsx`) is a lucide-iconed parchment list of stale routes (`/product`, `/missions`, `Team`, `Calendar`) that predates the Obsidian IA. It is a fingerprint of the old system sitting one keystroke away on every screen. OBS-11 replaces it wholesale.

## 3. What we are building

**Scope IN**

- A new glass palette component that fully supersedes `CommandPalette.tsx`: 560px centered panel, `--raised` glass, four mono-caps sections **JUMP · ACT · ASK · CATALOG**, mono index rows, ember caret, focus trap + restore.
- Keyboard: `⌘K` / `Ctrl+K` toggles; `Esc` closes; arrow keys move the active row; `Enter` runs it; scrim click closes. Keep the existing `cadence:open-cmdk` window event so the rail "Jump to" affordance still opens it.
- **JUMP** section: the five canonical destinations + the three most-recent objects (shown on empty query).
- **ACT** section: the small set of verbs that act on the current context (Challenge a belief, Connect a source, Ask, Answer the current Call) · each a plain-words row that fires an existing route/event, not a new server fn.
- **ASK** section: a single row that summons the Ask panel (OBS-12) with the current query as its seed; degrades to navigate-to-Ask until OBS-12 ships.
- **CATALOG** section (the "What can it do?" mode): a static, searchable registry of capabilities, each row = plain-words pitch (13px) + a quiet **Try it** action that runs the capability on the user's real workspace via the surface it already lives on.
- Empty-query state (5 destinations + 3 recent objects) and the no-result instruction copy.
- The `GotoShortcuts` `g`-prefix handler stays but its route map is refreshed to the canonical five (it is co-located in the same file today; keep it working).
- New unit tests for the pure catalog registry + the query filter + the section grouping.

**Scope OUT (no feature work rides along)**

- No new server functions, no new AI surface, no new `CallSurface` literal. The palette **consumes read-only**: TanStack Router `navigate` for JUMP/CATALOG destinations, the existing `cadence:open-cmdk` and (new, client-only) `cadence:open-ask` window events, and whatever cheap client-side "recent objects" source already exists (a `sessionStorage`/`localStorage` recents list or a lightweight query key that is already populated by the surfaces). If no recents source exists yet, ship the 3-recent slot reading from a client `recents` helper seeded by navigation · **do not** add a server fn to compute recents.
- No changes to the Ask panel itself (OBS-12 owns it); OBS-11 only summons it.
- No route redirects or nav-model route changes (OBS-10 owns those); OBS-11 reads the already-canonical routes.
- No changes to the surfaces the catalog "Try it" points at · it navigates to them with a query param or fires a client event they already listen for.

## 4. Current state

Real files as of 2026-07-02:

- **`src/components/cadence/CommandPalette.tsx`** (220 lines) · the parchment palette to supersede. It imports **13 lucide icons** (`Home, Bot, Brain, MessageCircle, Hammer, ListTodo, Settings, Sparkles, Search, Telescope, ShieldAlert, Activity, Calendar`), renders via `cmdk` (`Command`, `Command.Input`, `Command.List`, `Command.Group`, `Command.Item`, `Command.Empty`), uses parchment classes (`bg-card/95`, `hairline`, `text-muted-foreground`, `aria-selected:bg-secondary`), a `max-w-xl` (~576px) panel at `pt-[14vh]`, placeholder "Search Cadence: navigate, ask AI, run agents...", and stale groups **Navigate** (points at `/`, `/chat`, `/product`, `/govern`, `/missions`, `/knowledge`, `/settings`) + **Quick actions**. It listens for `keydown` (⌘K, Esc) and the `cadence:open-cmdk` window event. **This whole component is replaced.**
- **`GotoShortcuts`** · exported from the **same file** (lines 174-220). A vim `g`-prefix handler mapping `d→/`, `c→/chat`, `a→/missions`, `b→/build`, `t→/`, `s→/settings`, `p→/product`, `k/m/l→/knowledge`, `v→/govern`. It ignores keystrokes inside inputs/textareas and when a modifier is held. **Kept, but the route map is refreshed to the canonical five (post-OBS-10).**
- **`src/routes/_authenticated.tsx`** (50 lines) · mounts `<CommandPalette />` and `<GotoShortcuts />` inside `FlowModeProvider`. **The mount point stays; the import path stays; only the component internals change.**
- **`src/lib/nav-model.ts`** · the pure nav model. `PRIMARY_NAV` currently lists `Today(/today) · Ask(/chat) · Product(/product) · Build(/build) · Brain(/knowledge)`. Post-OBS-10 the canonical destinations are **Today · Discover · Plan · Build · Brain**. OBS-11 reads the destination list; it does not edit nav-model routes (OBS-10 does).
- **The runnable prototype (`design-reference/obsidian-v3/design-reference/cadence-app.html`) does NOT implement the palette.** The palette is a stub-surface: its design is fully specified in [`obsidian-extensions.md`](../../../design-reference/obsidian-extensions.md) §1, and its glass chrome mirrors the mission slide-over glass in [`components.md`](../../../design-reference/obsidian-v3/components.md). Parity is therefore against the **glass/chrome idiom the prototype establishes elsewhere** (slide-over glass, scrim, focus ring, mono labels, `cadRise`/`cadSlideIn`) plus the exact extensions §1 spec · not against a palette rendering in the HTML.
- **`data-obsidian`** scoping and the five fonts / eight keyframes land in OBS-01; OBS-11 assumes they exist.

## 5. How · step by step

1. **Create the capability registry** `src/lib/palette-catalog.ts` (pure, no JSX, no server import). Export a typed `CATALOG: CatalogEntry[]` where `CatalogEntry = { id: string; pitch: string; kind?: "CALL"|"MISSION"|"SPEC"|"BELIEF"|"SOURCE"; run: { to: string; search?: Record<string,string>; event?: string } }`. Seed it with the real capabilities (Challenge a belief, Connect a source, Tear down with receipts, Export my record, Point the Critic, Answer a Call, and the rest that map to live surfaces). `run` is a navigate target and/or a client event name · never a server call. Also export a pure `filterCatalog(query: string): CatalogEntry[]` (case-insensitive substring over `pitch`, stable order).
2. **Create the destinations + actions data** in the same module or a sibling `src/lib/palette-sections.ts`: `JUMP_DESTINATIONS` (the five canonical routes with plain labels + mono kind) and `ACT_VERBS` (Challenge, Connect, Answer the current Call, each `run` = route/event). Keep these pure so they unit-test without React.
3. **Create the recents helper** `src/lib/palette-recents.ts` (client-only): `pushRecent(obj)` / `getRecents(): RecentObject[]` backed by `sessionStorage` under key `cadence:recents`, capped at 3, deduped by id. If a recents source already exists, wrap it instead. This is client-only; no server fn.
4. **Rewrite `src/components/cadence/CommandPalette.tsx`** as the glass palette:
   - Remove all 13 lucide imports and the `cmdk` `Command.*` chrome. Build the panel with plain elements + Radix `Dialog` for the focus-trap contract (or a hand-rolled focus trap · see §7 a11y), styled with Obsidian tokens.
   - Keep the `open` state, the `⌘K`/`Ctrl+K` toggle, `Esc` close, and the `cadence:open-cmdk` window listener exactly as they are.
   - Render: scrim → glass panel → bare input row (ember caret, `ESC` mono hint right) → grouped result list (JUMP, ACT, ASK, CATALOG), each group headed by a mono-caps label, each row `[mono index] [label / pitch] [right mono hint or kind]`.
   - Empty query → show JUMP (5 destinations) + the 3 recents. Non-empty query → filter all four sections; catalog rows carry the **Try it** action.
   - Keyboard: maintain an `activeIndex` across the flattened visible rows; `ArrowDown`/`ArrowUp` move it (wrap), `Enter` runs the active row, `Home`/`End` optional. The active row gets bg `#1A1A1E` + ember index + the 2px glacier focus ring.
   - Selecting a row: JUMP/CATALOG → `navigate({to, search})` then close; ACT/ASK → dispatch the client event (`cadence:open-ask`, `cadence:challenge`, etc.) then close.
5. **Keep `GotoShortcuts` in the same file**; update its `map` to the canonical five: `d→/today`, `p→/discover` (Discover), `n→/plan` (Plan) · align the letters with the canonical routes OBS-10 establishes; verify against the shipped `nav-model.ts` at build time and keep `s→/settings`, `v→/govern`. Do not invent routes OBS-10 has not created; if a canonical path is not yet live, point at its current home and leave a `// TODO(OBS-10)` note.
6. **No change to `_authenticated.tsx`** beyond confirming the import still resolves (same export names `CommandPalette`, `GotoShortcuts`).
7. **Add `cadence:open-ask` dispatch** from the ASK row and the ACT "Ask" verb · a plain `window.dispatchEvent(new CustomEvent("cadence:open-ask", { detail: { seed } }))`. OBS-12 will listen; until then, the row falls back to `navigate({ to: "/chat" })` guarded by a feature check (`typeof window` + a simple `askPanelMounted` flag or a try/navigate default).
8. **Tests** (`src/lib/palette-catalog.test.ts`): `filterCatalog` returns matches case-insensitively, returns `[]` for a nonsense query, preserves order; every `CATALOG[].run.to` is one of the known canonical routes (guards against a dead link); `JUMP_DESTINATIONS` has exactly five entries; `ACT_VERBS` are non-empty and each has a `run`.
9. **Manual verification** (§12): open at 1440px, tab through, screenshot side by side with the mission slide-over glass to confirm the same glass idiom; run the grayscale + restraint audit; grep the new strings for banned characters.

## 6. Structure

Component tree (the palette overlay):

```
<CommandPalette>                         // src/components/cadence/CommandPalette.tsx (rewritten)
  {open && (
    <div.scrim onClick=close>            // fixed inset-0, rgba(4,4,5,0.6) + blur(3px)
      <div.palette role="dialog" aria-modal onClick=stop>   // 560px glass, cadRise 200ms, focus-trapped
        <InputRow>                        // bare row, ember caret, ESC mono hint
        <List>                            // max-height, scroll
          <Section label="JUMP">   <Row/>…   // 5 destinations (+ 3 recents on empty)
          <Section label="ACT">    <Row/>…   // context verbs
          <Section label="ASK">    <Row/>    // summon Ask (⌘J)
          <Section label="CATALOG"><CatalogRow/>… // pitch + Try it
          <Empty/>                          // "Nothing by that name…" instruction
</div></div>)}
</CommandPalette>
<GotoShortcuts/>                          // same file, route map refreshed
```

`Section`, `Row`, `CatalogRow`, `InputRow` are small local components inside `CommandPalette.tsx` (no new component files needed for chrome · mirror how the old file kept `Item` local).

**New files to create**

- `src/lib/palette-catalog.ts` · `CatalogEntry` type, `CATALOG`, `filterCatalog`.
- `src/lib/palette-sections.ts` · `JUMP_DESTINATIONS`, `ACT_VERBS` (may be folded into `palette-catalog.ts` if small; keep pure).
- `src/lib/palette-recents.ts` · client recents helper.
- `src/lib/palette-catalog.test.ts` · unit tests.

**Files modified**

- `src/components/cadence/CommandPalette.tsx` · full rewrite of the render + the `GotoShortcuts` route map.

**Files unchanged (consumed read-only)**

- `src/routes/_authenticated.tsx` · mount point untouched.
- `src/lib/nav-model.ts` · destination list read, not edited (OBS-10 owns route edits).
- All target surfaces (Discover/Plan/Build/Brain/Engine Room) · reached via `navigate` / client events, not modified.

**Data flow.** Everything is pure client-side: `filterCatalog(query)` runs synchronously on the in-memory `CATALOG`; JUMP/CATALOG rows call `navigate()`; ACT/ASK rows dispatch `window` `CustomEvent`s; recents read `sessionStorage`. **No server functions, no TanStack Query keys, no `callModel`.** The palette is a router-and-event dispatcher over static data.

## 7. Design elements

All values below are the exact tokens from the hub (§5) and extensions §1 · do not invent a hex, radius, or duration.

**Scrim.** `background: rgba(4,4,5,0.6)`; `backdrop-filter: blur(3px)`. `fixed inset-0`, `z-index: 80` (keep the existing z). Click closes. `aria-hidden` on the scrim layer only, not the panel.

**Panel (glass).** Width `560px`, `max-width: 92vw`. Centered horizontally, top offset `18vh` (extensions §1; the old `14vh` is replaced). Background `--raised #17171A`. `backdrop-filter: blur(20px)`. Border `1px solid rgba(255,255,255,0.08)` (the 8% glass hairline). `border-radius: var(--radius-panel) = 14px`. Entrance `cadRise` 200ms `var(--ease) cubic-bezier(0.23,1,0.32,1)` (translateY 10px→0, fade). No drop shadow beyond the tint depth; the glass hairline + blur carry the elevation.

**Input row.** Bare, no box. Schibsted Grotesk (`--font-ui`) 15px, `--text-primary #F2F0ED`. `caret-color: var(--ember) #FF6B2C`. Placeholder `--text-muted #9C978F`: "Search, act, or ask what it can do". Row padding `14px 16px`. Bottom hairline `--hairline rgba(255,255,255,0.07)`. Right end: a mono `ESC` hint · `--font-mono`, 9.5px, caps, `letter-spacing 0.10em`, `--text-subtle #7D786F`, in a `--radius-control 8px` hairline chip.

**Section header.** Mono-caps label: `--font-mono` 9.5px, `letter-spacing 0.11em`, uppercase, `--text-subtle #7D786F`, padding `12px 16px 6px`. The four labels verbatim: `JUMP` · `ACT` · `ASK` · `CATALOG`.

**Result row.** Grid: `[mono index]  [label]  [right hint]`. Padding `9px 16px`. Height ~36px. Left mono index (`01`…`08`) `--font-mono` 9.5px, `--text-faint #55524C`, **turns `--ember #FF6B2C` on the active row**. Label `--font-ui` 13px, `--text-primary` (active/hover) / `--text-body #B5AFA6` (rest). Right hint right-aligned mono 9.5px `--text-subtle`: either the shortcut (for JUMP) or the object kind (`CALL` · `MISSION` · `SPEC` · `BELIEF` · `SOURCE`). Max 8 rows visible per the list, then the list scrolls (`max-height` ~= 8 rows + headers, `overflow-y: auto`, thin scrollbar).

**Catalog row.** Pitch in `--font-ui` 13px `--text-body`; the **Try it** action is a quiet secondary control right-aligned: `--font-ui` 12px, `--text-muted`, hairline border, `--radius-control 8px`, no fill; on hover it lifts to `--hover #1D1D21` and hairline brightens to `--hairline-strong rgba(255,255,255,0.09)`. Try it never goes ember (running a capability is not a human-gated decision).

**Interaction states (design every one).**

- **Hover (row):** background lifts one step to `--hover #1D1D21`; hairline is not drawn per-row (rows are separated by space, not borders); label brightens to `--text-primary`. Tonal only · nothing translates.
- **Active / keyboard-selected row:** background `#1A1A1E`; mono index turns ember; a **2px glacier (`#7FD1DC`) focus ring, offset 2** on the row (`:focus-visible` idiom, applied to the active row as it scrolls into view). Arrow keys move it; the list auto-scrolls to keep it visible.
- **Press (a JUMP/CATALOG row):** the row's action fires immediately on `Enter`/click; no scale transform on rows (scale(0.985) is reserved for buttons · the Try it chip may use it: press → `scale(0.985)` 140ms).
- **Focus (input):** caret is ember; the input itself needs no ring (it is the default focus target); the panel traps focus.
- **Empty query (default open state):** show JUMP with the five destinations, then a thin `--hairline-faint rgba(255,255,255,0.05)` divider, then up to three recents (each a Row with its object kind on the right). No CATALOG/ACT noise until the user types.
- **Loading:** none · the catalog is static and synchronous. (If recents ever read async, show nothing rather than a spinner; recents are non-essential.)
- **No result:** the empty block renders the instruction copy (see §9), `--text-muted`, 13px, centered, padding `24px 16px`. Never a dead end, never an illustration.
- **Reduced motion:** `cadRise` duration zeroes under `prefers-reduced-motion` (inherited from OBS-01's media block); the palette still opens, just without the rise.

**Restraint budget for this surface:** the palette is neutral glass end to end. The **only** ember is the active-row mono index (a single-pixel accent marking focus) and, if the top match is a pending Call, that one row's kind chip. No aurora, no shimmer, no pencil. Status words never rely on color: object kinds are mono words, not colored dots.

## 8. Restructuring / renaming / modification

- **Delete** all 13 `lucide-react` imports from `CommandPalette.tsx` (`Home, Bot, Brain, MessageCircle, Hammer, ListTodo, Settings, Sparkles, Search, Telescope, ShieldAlert, Activity, Calendar`). This is a chrome-lucide removal per hub §9 · after OBS-11, `CommandPalette.tsx` imports zero lucide.
- **Remove** the `cmdk` dependency usage in this file (`Command`, `Command.Input`, `Command.List`, `Command.Group`, `Command.Item`, `Command.Empty`). If `cmdk` is used nowhere else, note it for a later dep prune; do not remove the package in this item (out of scope, could break another surface). Grep `cmdk` before deciding.
- **Modify** the `GotoShortcuts` route map to the canonical five (see §5 step 5). Keep the input-guard and modifier-guard logic verbatim.
- **No file moves, no route folds, no redirects, no nav-model route edits** · those are OBS-10's. OBS-11 only reads the canonical destinations OBS-10 produced.
- **Retire the stale strings**: the old placeholder ("Search Cadence: navigate, ask AI, run agents..."), the stale group names ("Navigate", "Quick actions"), and the stale destinations ("Team", "Calendar", "Missions · live agents and runs", "Product · signals, opportunities, specs") are all removed with the rewrite.

## 9. Copy / voice

Humanized: no em/en dashes, no exclamation marks, plain-words controls, mono-caps metadata with middots.

- **Input placeholder:** `Search, act, or ask what it can do`
- **ESC hint:** `ESC` (mono caps)
- **Section labels (mono caps):** `JUMP` · `ACT` · `ASK` · `CATALOG`
- **JUMP rows (label · right shortcut hint):** `Today · 1` · `Discover · 2` · `Plan · 3` · `Build · 4` · `Brain · 5` · `Engine Room · G`
- **ACT rows (plain-words verbs):** `Challenge a belief` · `Connect a source` · `Answer the current Call` · `Ask about this screen`
- **ASK row:** `Ask Cadence` with right hint `⌘J`
- **CATALOG rows (pitch + Try it):** examples, plain PM words, never a mechanism name:
  - `Tear down a belief with receipts` · Try it
  - `Rank what to build next` · Try it
  - `Turn 48 hours of tickets into signals` · Try it
  - `Export my decision record` · Try it
  - `Point the Critic at a claim` · Try it
  - Try it action label: `Try it` (helper on hover, mono micro: `RUNS ON YOUR WORKSPACE`)
- **Empty state / no result (instruction, never a dead end):** `Nothing by that name. Try a verb, like challenge or connect.`
- **Recents divider context (screen-reader label only):** `Recent` (mono caps, matches the section idiom; visually just a faint divider + three rows).
- **Object kind chips (right-aligned mono caps):** `CALL` · `MISSION` · `SPEC` · `BELIEF` · `SOURCE`

Metadata rendering example (mono caps with middots): `SCOUT · MISSION` on a recent mission row.

## 10. Acceptance criteria

- ⌘K / Ctrl+K opens the glass palette from any authenticated surface; Esc, scrim click, and running a row all close it.
- The `cadence:open-cmdk` window event still opens the palette (the rail "Jump to" affordance keeps working).
- The panel is 560px (max 92vw), centered, top 18vh, `--raised` glass with blur 20 and the 8% hairline, radius 14, entering with `cadRise` 200ms.
- Four sections render in this order with mono-caps labels: JUMP · ACT · ASK · CATALOG.
- Empty query shows exactly the five destinations plus up to three recent objects; no catalog noise before typing.
- Typing filters all sections; catalog rows show a plain-words pitch + a Try it action that navigates or fires a client event running the capability on real data (no server fn added).
- Arrow keys move the active row (wrapping); the active row gets bg `#1A1A1E`, an ember mono index, and a 2px glacier focus ring; Enter runs it.
- No result shows the instruction copy "Nothing by that name. Try a verb, like challenge or connect." · never a blank box.
- `CommandPalette.tsx` imports zero lucide icons; the palette renders with mono index + unicode affordances only.
- `GotoShortcuts` still works and points only at canonical live routes (no landing on a redirect).
- Focus is trapped inside the open palette and restored to the trigger on close; the panel is `role="dialog"` `aria-modal`.
- The only ember on the surface is the active-row index (and a single Call-kind chip if the top match is a Call); grayscale screenshot still reads.
- New unit tests pass: `filterCatalog`, the five-destination invariant, every catalog `run.to` is a known route.

## 11. Prototype-parity checklist (the last gate, tailored)

The palette is a stub-surface (not in the runnable HTML), so parity is against extensions §1 + the prototype's glass idiom. At 1440px verify:

1. **Rail unaffected:** opening the palette does not disturb the 236px mono-index rail behind the scrim; the rail is dimmed by the scrim only.
2. **Glass chrome matches the mission slide-over:** same `--raised`/`#101013`-family tint, same 8% hairline, same scrim `rgba(4,4,5,0.6)` + blur(3px), same `--radius-panel` 14 · open both side by side to confirm one glass language.
3. **Type:** input Schibsted 15px; section labels mono 9.5px caps 0.11em; rows 13px UI; indexes mono 9.5px. No serif here (the palette carries no hero).
4. **Color:** zero hexes outside tokens; ember appears only on the active-row index (and a Call-kind chip if matched); glacier only as the focus ring.
5. **Motion:** entrance `cadRise` 200ms; hover one-step tonal lift 140ms; no per-row translate; reduced-motion kills the rise.
6. **Behavior:** ⌘K toggles, ⌘J summons Ask from the ASK row, Esc closes, arrows move, Enter runs; the `cadence:open-cmdk` event still opens it; g-prefix shortcuts land on live routes.
7. **Copy:** plain-words rows, consequence in helper (`RUNS ON YOUR WORKSPACE`), mono-caps kinds with middots, no em dashes, no exclamation marks, the exact no-result instruction.
8. **Grayscale** screenshot reads (kinds are words, not colors); restraint budget audited (one ember accent max).

## 12. Verification + gates

- **`tsc --noEmit` = 0.**
- **`bun test`** green, including the new `src/lib/palette-catalog.test.ts` (filterCatalog behavior, five-destination invariant, catalog `run.to` route validity, ACT_VERBS non-empty).
- **`bun run build`** · RED in lane worktrees on the pre-existing node20-vs-ESM `lovable-tagger` `require()` error (hub §11). In a lane worktree treat **tsc + bun test** as the real gates; run the full build on the primary checkout before publish. Do not chase the lovable-tagger error.
- **Grayscale test:** screenshot the open palette, remove color · object kinds and section labels must still carry all meaning.
- **Restraint budget:** confirm one ember accent max (active index), no aurora/shimmer/pencil.
- **`impeccable` / humanized-output scan:** grep every new UI string for em dashes, en dashes, exclamation marks, and the banned-word list (seamlessly, leverage, empower, robust, unlock, delve). The strings in §9 are the source of truth.
- **Manual checks:** ⌘K from Today, Discover, Plan, Build, Brain, and inside a slide-over; type a verb and a nonsense string; run a JUMP row, an ACT verb, an ASK row, and a CATALOG Try it; tab-trap and Esc-restore; `cadence:open-cmdk` from the rail; g-prefix shortcuts.
- **Side-by-side screenshots in the ship report:** the open palette next to the mission slide-over (glass parity) + the no-result state + the catalog mode, at 1440px, plus a grayscale frame.

## 13. Risks · gotchas · founder-gates

- **Depends on OBS-10 for canonical routes.** If OBS-11 is picked before OBS-10 lands, the canonical paths (`/discover`, `/plan`, `/brain`) may not exist. Mitigation: read the shipped `nav-model.ts` at build time; for any not-yet-live path, point at its current home (`/product`, `/knowledge`) with a `// TODO(OBS-10)` and confirm no row lands on a 404. Do not create routes here.
- **`cmdk` removal scope.** Removing the `cmdk` chrome from this file is safe; removing the package is out of scope (grep first · other surfaces may use it). Leave a dep-prune note.
- **Recents source.** If no client recents helper exists, the 3-recent slot must ship from a new client-only `palette-recents.ts` (sessionStorage). Do not add a server fn for recents; if that feels wrong, ship the palette with an empty recents slot (JUMP-only empty state) and flag it · an empty recents slot is acceptable, a new server fn is not.
- **Ask summon before OBS-12.** The ASK row dispatches `cadence:open-ask`; until OBS-12 listens, it must fall back to navigating to the current Ask home so the row is never dead. Verify the fallback.
- **Focus trap.** The old palette had no trap; production requires it (hub §5.12). Prefer Radix `Dialog` for the trap + restore rather than hand-rolling, to avoid a11y regressions.
- **Founder-gates:** none specific to OBS-11 beyond the OBS-10 route dependency the founder was already told about. No new founder decision is required.

## 14. Interlinks

- **Hub / shared canon:** [`./README.md`](./README.md) (§5 tokens · §5.9 parity checklist · §5.12 a11y · §6 IA target · §9 lucide-removal law · §11 build-gate).
- **Sibling OBS items (build-order neighbors):**
  - [`./OBS-10.md`](./OBS-10.md) · **dependency**: IA consolidation catches the rare/orphaned surfaces and sets the canonical five routes the palette JUMPs to.
  - [`./OBS-12.md`](./OBS-12.md) · the Ask (⌘J) panel the ASK section summons via `cadence:open-ask`.
  - [`./OBS-03.md`](./OBS-03.md) · the primitive set (glass/slide-over chrome, StatusDot, MonoLabel) the palette reuses.
- **Canon anchors:**
  - [`../../../design-reference/obsidian-extensions.md`](../../../design-reference/obsidian-extensions.md) **§1** (Command palette + capability catalog · the exact panel/input/rows/catalog/voice spec).
  - [`../../../DESIGN-OBSIDIAN.md`](../../../DESIGN-OBSIDIAN.md) **§11** (the catalog + journey/discovery) and **§12.1** (rare = Cmd+K; features never get nav items).
  - [`../../../design-reference/obsidian-v3/components.md`](../../../design-reference/obsidian-v3/components.md) · "Mission slide-over" (the glass/scrim/`cadSlideIn` idiom the palette mirrors) and the mono-label/StatusDot anatomies.
- **Board + strategy:** [`../feature-dashboard.md`](../feature-dashboard.md) (G14, OBS-11) · [`../obsidian-port-plan.md`](../obsidian-port-plan.md) · [`../../strategy/v11-guiding-star.md`](../../strategy/v11-guiding-star.md) · [`../../conventions/engine-room-doctrine.md`](../../conventions/engine-room-doctrine.md) · [`../../conventions/humanized-output.md`](../../conventions/humanized-output.md).
