# UI/UX REVAMP — SESSION HANDOFF (resume here)

_Last updated 2026-07-14 · branch `main` · everything below is VERIFIED GREEN._ _(Latest: the 2026-07-14 platform UX pass — nav shortcuts + Pulse rename, Today hero + count/desk polish, TopBar weather, avatar library, button grammar, Ask redesign, and the CadenceMark brand logo + full GTM brand kit — see DONE items 15-24.)_

## How to resume (founder → agent)

1. `cd "/Users/rohitgajaraj/Projects/My Projects/My Builds/project_cadence_v5"`
2. Restart the Kiro CLI, then run **`/mcp`** and confirm **`playwright` = ✓ Initialized** (browser tools now available — added to `.kiro/settings/mcp.json`). First launch downloads Chromium once.
3. Start the app for visual QA: **`bunx vite dev`** → http://localhost:8080 (log in so the agent's browser can reach authenticated screens; auth/pricing/landing are reachable without login).
4. Paste this to the agent:
   > Resume the UI/UX revamp of project_cadence_v5. Read UI-REVAMP-HANDOFF.md. Now that Playwright is enabled and the dev server is running, do the VISUAL-QA pass: screenshot Today, the 6 loop stages, Memory, Engine Room, the command palette, and auth; then finish the remaining polish list with before/after screenshots. Keep tsc + bun test green.

## Verify commands (all currently pass)

- `bunx tsc --noEmit` → exit 0
- `bun test` → 4696 pass / 0 fail / 311 files
- dev server boots clean (no CSS/runtime errors)
- retired remnants app-wide = 0 (`grep -rl "var(--font-serif)" src` outside styles.css/PageHeader; 0 editorial 420/430 weights; 0 light-theme `bg-white`/`text-slate`/`bg-indigo` outside the off-limits landing)
- The public marketing landing `src/routes/index.tsx` is NOT part of this app-UI pass — but it is no longer frozen: its rebuild is planned and founder-directed. Any landing work follows [`docs/planning/landing-page-v2-plan.md`](./docs/planning/landing-page-v2-plan.md) (strategy + copy deck + phases; awaits the founder's §9 decisions).
- Adding a route requires regenerating `src/routeTree.gen.ts` (start `bunx vite dev` ~30s then stop; it regenerates on boot).

## DONE (verified) — 66 files changed

1. **IA = "The Supaprod Loop"** — `src/lib/nav-model.ts`: 10 destinations, 3 zones (HOME=Today · THE LOOP 01 Discover · 02 Decide · 03 Plan · 04 Design · 05 Build · 06 Ship · 07 Learn · INTELLIGENCE Brain+Engine Room). Digit keys 1-9 + Engine Room `g` (10th, no single digit). `Decide` (Option B, 2026-07-13) is a first-class stage = the judgment gate, real page at `_authenticated.decide.tsx` rendering `OpportunityQueue`. Memory was renamed to **Brain** everywhere (route `/brain`). Tests: `nav-model.test.ts`, `__tests__/nav-model.test.ts`, `legacy-redirects.test.ts`, `palette-catalog.test.ts`.
2. **App shell** — `src/components/cadence/AppShell.tsx`: 3 narrative zones; numbered loop nodes (NO continuity line — it implied gating); Memory/Engine Room have no empty number slot; glass sidebar rail.
3. **Shared Tempo header** — `src/components/cadence/PageHeader.tsx` (mono eyebrow + Geist Sans title + ember accent + always-visible USP capsule) on all 8 stage surfaces.
4. **Ship + Learn = real pages** — `src/routes/_authenticated.ship.tsx` (new), `_authenticated.learn.tsx` (converted from redirect). `/outcome` → `/learn`.
5. **Command palette** — `CommandPalette.tsx` shows each stage's tagline (lifecycle map).
6. **Top-bar day/weather widget** — `src/components/cadence/DayWeather.tsx` (day/date/live clock + keyless Open-Meteo weather, condition-colored icon, no auto-prompt).
7. **Today** — `src/components/today/TodayHeroCard.tsx` (glass/gradient hero, Pixel moment, one ember CTA); desk/focus-dock rehomed to an EVIDENT right rail (`DeskRail compact`) via a responsive grid; full desk (Notepad/Meetings/Status/Calendar) in the Desk slide-over.
8. **Palette de-purpled** — `styles.css`: `--action-blue`/`--focus-blue` indigo(265-270)→clean blue(240-245); `::selection` + `--selection` ember→neutral; `.input:focus` ember→blue. Ambient ember+blue canvas wash on `.loom-atmosphere`. Reusable `.glass-panel` utility. Glass top bar.
9. **Homelessness closed** — both orphans mounted: `CalendarPanel`→Desk (DeskRail `DeskCalendar`), `ProductAnalyticsPanel`→`OpportunityDetailSheet`. 3 light-theme panels (`AudioTranscriptPanel`, `DesignScaffoldPanel`, `ProductAnalyticsPanel`) remapped to theme-aware Tempo utilities.
10. **TopBar on every surface** — `src/components/cadence/TopBar.tsx` (breadcrumb + ThemeToggle light/dark/system + a visible Ask button firing `cadence:open-ask` + DayWeather + LiveTicker), a glass surface; added to the previously-bare Discover and Engine Room too, so chrome is uniform app-wide. Mounts the global `<AuditLineageSheet/>` via AppShell.
11. **Agent identity + Pixel** — agent icons are liquid-glass gems (`AgentMark.tsx`); agent NAMES render in Geist Pixel (~14px, `AgentBadge` `pixelName`, passed by `PresenceChip`). Headline metric numerals (Engine Room, Decide ICE) are Pixel.
12. **Engine Room** — `RoomRail` is an accordion (only the active room expands its sub-views); the MissionChain / Record dropdown moved to a themed Radix `Select`.
13. **AUDIT-ID — verifiable audit id + one-click lineage (founder ruling 2026-07-13).** Every entity's `PREFIX·XXXXXX` chip is now a clickable `AuditTag` that opens its verifiable lineage in a global sheet; a mission id also renders the full nine-link trust chain; Ask detects a named id and opens it with no model call. P1 resolver `src/lib/audit-id.ts` (12 kinds, 9 tests) · P2 `getEntityLineage` (RLS-scoped, generic) · P3 `AuditLineageSheet` + `AuditTag` + Ask id-detection. Chip rollout across Discover / Decide / Plan / Build / Learn / Today / Brain (incl. the graph node story + call-detail sheet; kinds with no standalone entity stay plain refs). `AuditTag` is a `<span role="button">` so it nests inside clickable rows. Feature: `docs/features/audit-id-lineage.md`; pattern: `design-reference/tempo-v5/patterns/audit-trace-tag.md`.
14. **Design-system documentation** — the full app-port design rulings + rationale ("why + what" for tomorrow's builds) are captured in `design-reference/tempo-v5/applied/2026-07-13-app-port-and-design-rulings.md`; DESIGN-TEMPO §9, the tempo-v5 README, the `docs/features/README.md` index, and `feature-dashboard.md` (#401) are all updated + interlinked (trust-ledger / o1-provenance / knowledge-graph-explorer).

## PASS 2 — platform UX + brand (2026-07-14, founder-directed, all VERIFIED GREEN + pushed)

15. **Nav shortcuts fixed + "Engine Room" → "Pulse"** — the rail shortcut now equals the visible number (Today 0, loop 1-7, Brain 8, Pulse 9, Settings s, Admin a), derived from `navKeyHint`; pressing 2 opens Decide (verified). "Engine Room" renamed to **Pulse** (single word, pairs with Brain as the living-system Intelligence layer; route `/engine-room` unchanged). Zone captions simplified.
16. **Today hero** — full **Geist Pixel** headline (ember lead + white tail), the person's name in Pixel, a calm slow ambient **aurora** (ember/maroon; moss/gold at all-clear) that gels in both themes; sheen + emblem removed per founder.
17. **Count/desk/metric polish** — reusable **`PixelStat`** (Geist Pixel numerals, tone + glow, sized to sit with labels); needs-your-judgment count + answered/open + "N more waiting" now Pixel; **blue = the data/attention number tone**, ember reserved for needs-human/CTA + hero. "Your desk" header highlighted.
18. **TopBar** — weather chip = colored, condition-animated glyph + status + **locale-unit temperature** (°F for verified holdouts, °C else) + **location**, no date/time; **ThemeToggle** moved to the far right by "Waiting on you".
19. **Avatar library** — `Avatar` (8 theme-token orbs muted into the surface, calm in both themes) with a per-account default + a **user picker in Settings → You** (`useAvatarChoice`).
20. **Button color grammar** — first-class ember **`accent`** Button variant + documented one-rule grammar (accent=primary/human · default=neutral · secondary/tertiary=support · link=blue/machine · destructive/warning=risk; one accent per screen).
21. **Icon-only copy** — "Copy link" is icon-only in the share clusters (teardown, decision receipt); Share/Unshare stay labeled.
22. **Ask panel redesign** — "Ask Supaprod" framing (platform-wide, current screen as a secondary cue), ember sparkle + ambient wash, and a liquid-glass composer with an ember send button + focus glow.
23. **CadenceMark brand logo + loader** — `src/components/cadence/CadenceMark.tsx`: a seven-petal spiral (the loop) around a glowing ember/gold core (Brain + Pulse); theme-aware metallic (silver/white on dark, black on light); the animated `CadenceLoader` plays in the sidebar/ticker/Ask (via `AiWorking`) wherever AI works.
24. **Brand kit (GTM)** — `docs/Growth Strategy/branding/`: the mark in every form (SVG + PNG at all sizes + favicon.ico + apple-touch/PWA icons + dark/light OG social) + an animated HTML reference + `generate.ts` + a full guidelines README. `.gitignore` exception keeps the raster set committed.

Design record for this pass: `design-reference/tempo-v5/applied/2026-07-13-app-port-and-design-rulings.md` (2026-07-14 addendums 11-19).

25. **Favicon** — the actual Supaprod mark, transparent (NO box), theme-aware (white on dark tabs / black on light) + ember/gold core (`public/favicon.svg`); raster fallbacks (`public/favicon.png`, `apple-touch-icon.png`, `favicon.ico`) + `__root.tsx` updated; retired Butterfly favicon + its R2 png import removed.
26. **Hero brand watermark + crisp mark** — a large monochrome mark bleeds subtly into the Today hero's bottom-right (cropped, ~7% opacity, very slow turn, `.hero-watermark-spin`); the in-app mark is now crisp white/black (not dull silver).

## PENDING (tomorrow's pickup — nothing blocking; foundations in place)

- **Brand revisit (founder-owned):** the founder will revisit the brand mark/logo + the brand-kit logo files later; the favicon + app mark are set. The full GTM brand kit is at `docs/Growth Strategy/branding/` (SVG/PNG/favicon/social + `generate.ts` + guidelines README).
- **Liquid-glass / 3D-embossed rollout** to more content cards (`.glass-panel` + embossed hero/composer/avatar exist; extend to Today Spotlight, Pulse/Engine RoomCards, ui/card — glass only reads over the ambient wash, don't muddy flat cards).
- **Metrics → Geist Pixel sweep:** finish applying `PixelStat` (blue = data tone) to every remaining numeral (Today + Pulse headline done; foundation + rule set).
- **Migrate ad-hoc ember buttons to `variant="accent"`** (grammar defined in `src/components/ui/button.tsx`).
- **Deeper Today "reduce overwhelm"** + make `src/components/today/desk/FocusCard.tsx` genuinely useful (founder wants a real refactor).
- **Per-detail-screen polish** (OpportunityRow/ThemeRow/SpecList/SpecDetail/RoomDetail, settings tabs, admin.*, pricing/PlanPicker, onboarding) + a **multi-persona visual walkthrough** once screens are shot.

## Design law (obey)

DESIGN-TEMPO.md is the contract: dark-first, Geist Sans/Mono/Pixel (Pixel = brand moments, ≥ once), ember = only brand accent (one primary CTA/view), rich blue = machine voice, purple ONLY for categorical graph nodes, ≥90% neutral. Humanized copy (no em/en dashes in UI strings).
