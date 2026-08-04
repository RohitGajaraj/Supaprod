# OBS-06 · Discover ported (the evidence desk)

> _Spec created: 2026-07-02 · Group G14 · the Obsidian port · self-contained build+implementation spec._
> Read the shared substrate once: [`README.md`](./README.md) (the foundation hub). Everything below embeds the exact values this surface needs, so you do not have to open the tokens or `components.md` to build it. When this spec and the frozen contract disagree, the contract wins; when a fine visual detail differs between the contract text and the runnable prototype, the prototype's rendering is the founder-approved outcome.

## 1. Snapshot

| Field | Value |
| --- | --- |
| ID | OBS-06 |
| Rank | #7 |
| Tier | 1 |
| Status | pending |
| Category | Sense |
| Depends on | OBS-03 (core primitives) |
| Blocks | nothing downstream (OBS-10 folds legacy routes into this surface once it exists) |
| One-line what | Discover as the evidence desk: two-column 1160px surface, a signal feed (blossom source pills, verbatim quotes, theme lines) on the left and ICE-ranked opportunity rows (Newsreader score, verdict chip, Challenge action, one pencil on the top bet) on the right, Critic verdict inline, column footers in the house voice. |
| Dashboard row | [`../SOURCE-OF-TRUTH.md`](../../../SOURCE-OF-TRUTH.md) group G14, row OBS-06 |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md) |

## 2. Why we are doing it

Discover is where a raw signal becomes a Critic-checked decision. Today the same data wears the parchment "Ember Editorial" clothes: a capture form, a bento evidence table, ICE rows with dropdowns and icon buttons. It works, but it reads like a spreadsheet, not like judgment. The Obsidian pass turns it into a calm evidence desk: signal on the left, judgment on the right, and the only warm thing on the screen is a decision that genuinely needs a human.

This serves all three Obsidian laws. **One object, one anatomy:** the Signal and the Opportunity each get exactly one card, identical to their appearance everywhere else. **One queue for attention:** Discover never asks for a decision inline; a bet's verdict is stated (moss SHIP, ember REVISE, madder KILL) and the actual ask lives as a Call on Today, so ember stays reserved. **Depth on demand:** the desk is layer one (a quiet, scannable list); deeper drill (full ICE breakdown, rescore history, lineage) is layer two, opened on demand, never crammed into the row.

The felt outcome ties straight to the v11 guiding star (the decision-and-outcome layer, trust at the point of decision) and the engine-room doctrine (calm front, deep engine): a PM glances at the desk, trusts the ranking because every quote is verbatim and every verdict cites, and can red-team any bet with one plain button. The restraint is the point: the machine ranked twelve opportunities overnight, and the screen is 90% neutral ink because none of that ranking is nagging the user.

## 3. What we are building

**Scope IN**

- A new Discover surface at `/discover`, built to prototype parity at 1440px: the 1160px container, the Newsreader hero, the two-column grid (signal feed + opportunity queue), both column footers.
- A signal feed (left): live-feed header with a "128 THIS WEEK" glacier count, verbatim signal cards (source pill, timestamp, quote, theme line), the verbatim footer line.
- An opportunity queue (right): queue header with a "RE-RANKED 2H AGO" note, ICE-ranked rows (Newsreader ICE score, title, sub, verdict chip, Challenge button), exactly ONE pencil annotation on the top bet, the challenge-any-bet footer line.
- The Challenge action: invokes the existing `runCriticReview` server fn (read-consuming an existing capability, no new server fn) and shows the singleton toast "Critic engaged. The teardown lands on Today, receipts attached." for 3.6s.
- The no-sources empty state and the loading / error states, all in the house voice.

**Scope OUT (no feature work rides along)**

- No server functions are written or modified. This surface consumes, read-only: `listSignals`, `listThemes`, `listOpportunities`, `listLearnings` (query). The one action it fires is the pre-existing `runCriticReview` (already the engine behind `CriticBadge`); it is wired, not authored.
- The legacy `/product` route and its `SignalsPanel` / `OpportunitiesPanel` capture form, bulk import, cluster button, promote-to-opportunity, draft-spec, status dropdown, lineage drawer, and delete stay live and byte-untouched. OBS-06 does not delete or move them. Their relocation (so nothing is lost when `/product` folds) is an OBS-10 decision, flagged in §13.
- No route redirect, no nav-model edit, no `routeTree.gen.ts` change beyond the generator adding the new route file. Folding `/product` · `/discovery` · `/opportunities` into `/discover` is OBS-10.
- Not the Spec / roadmap tabs (those are Plan, OBS-07). Not the slide-over drill for a signal or opportunity (deferred; the row stays layer one for this item, with drill wiring left to OBS-10 / a later pass).

## 4. Current state (the real files today)

- **The real Discover is the `/product` route.** `src/routes/_authenticated.discovery.tsx` is a redirect to `/product?tab=signals`; `src/routes/_authenticated.opportunities.tsx` is a redirect to `/product?tab=opportunities`. There is no `/discover` (no "y") route yet · that path is free.
- **`src/routes/_authenticated.product.tsx`** renders the parchment surface: `AppShell` + `TopBar`, a `SurfaceHeader` (mono kicker "Loop · Sense", lucide `Compass` icon, serif title "Product"), a `PortfolioBoard`, and a `TabRow` with five tabs (signals · opportunities · roadmap · specs · releases). Tab bodies mount `SignalsPanel`, `OpportunitiesPanel`, `RoadmapBoard`, `SpecsPanel`, `ReleasesPanel`. Drill state rides `?signal=` / `?opp=` search params.
- **`src/components/product/SignalsPanel.tsx`** (625 lines): a capture form, bulk-import composer, auto-cluster toggle, and a bento evidence table (`GRID` columns, chevron expand, ember confidence bar, per-row "Draft spec" ghost button, promote / lineage / delete). Query keys `["signals", activeProductId]` and `["themes", activeProductId]`; server fns `listSignals` / `listThemes` / `clusterSignals` / `createSignal` / `promoteThemeToOpportunity` / `generatePrd`. Uses lucide `ChevronDown` · `ChevronRight` · `Radar`.
- **`src/components/product/OpportunitiesPanel.tsx`** (305 lines): ICE-ranked bento rows with a big serif rank number (ember for #1), a lane `<select>`, a rescore `VerdictChip`, a `CriticBadge`, mono ICE-input labels, the serif ICE score, a "Generate PRD" primary, lineage + delete icon buttons. Query keys `["opportunities"]` and `["learnings"]`; server fns `listOpportunities` / `updateOpportunity` / `deleteOpportunity` / `generatePrd` / `listLearnings`. Uses lucide `GitBranch` · `Lightbulb` · `Trash2`.
- **The Critic engine already exists.** `runCriticReview` (POST) lives in `src/lib/discovery.functions.ts:20` and is already fired by `src/components/governance/CriticBadge.tsx`. OBS-06's Challenge button reuses it. No critic code is written.
- **What stays:** all four server fns and the whole parchment `/product` surface (untouched until OBS-10). **What changes:** a new, additive Obsidian Discover surface is created alongside; it is dark, lucide-free, and consumes the same read data through the same query keys.

## 5. How · step by step

Build top to bottom. Each step names the file and the change. This assumes OBS-01 (tokens + `[data-obsidian]` + fonts), OBS-02 (shell + rail), and OBS-03 (primitives: `VerdictChip`, `MonoLabel`, `PencilNote`, `Toast`) have landed. If OBS-03's primitive names differ at build time, adapt the imports; the anatomies below are the contract.

1. **Create `src/components/discover/format.ts`.** Pure helpers, no server calls: `relTimeCaps(iso)` returning mono-caps like `12M AGO` / `1H AGO` / `3H AGO`; `sourceCaps(source)` upcasing (`intercom` -> `INTERCOM`); `verdictFor(opp)` mapping a production opportunity to one of `SHIP | REVISE | KILL | WATCH | PENDING` (derive from `critic_review.verdict` when present, else from status: `shipped`/`now` -> SHIP, `dropped` -> KILL, `next`/`later` with a pending critic -> WATCH, else PENDING). Unit-test this file.
2. **Create `src/components/discover/SignalCard.tsx`.** Props `{ src, when, quote, theme }`. Renders the signal anatomy in §7 (source pill, timestamp, verbatim quote, theme line). No interactivity; it is a read row.
3. **Create `src/components/discover/SignalFeed.tsx`.** Consumes `listSignals` (`["signals", activeProductId]`) and `listThemes` (`["themes", activeProductId]`) via `useServerFn` + `useQuery`, exactly the keys `SignalsPanel` already uses (share the cache). Build the feed: newest signals first, each mapped to `{ src: sourceCaps(s.source), when: relTimeCaps(s.created_at), quote: s.content, theme: themeLine(s) }` where `themeLine` is `→ THEME TITLE · N SIGNALS` in mono caps (from the signal's theme, if any; omit the line when unclustered). Render the feed header ("Live signal feed" · the glacier "128 THIS WEEK" derived from `signals.length` this week) and the verbatim footer. Handle loading (four placeholder cards) / error / empty (see §7, §9).
4. **Create `src/components/discover/OpportunityRow.tsx`.** Props `{ ice, title, sub, verdict, hasPencil, onChallenge, challengePending }`. Renders the opportunity anatomy in §7 (ICE block, title + sub, verdict chip, Challenge button, the pencil when `hasPencil`). The whole row is a real element; the Challenge button `stopPropagation`s.
5. **Create `src/components/discover/OpportunityQueue.tsx`.** Consumes `listOpportunities` (`["opportunities"]`) and `listLearnings` (`["learnings"]`), same keys as `OpportunitiesPanel`. Sort by `ice_score` desc; the row at index 0 gets `hasPencil` (the single "best bet" pencil · max one, §7). Build each `sub` from the real fields (signal count, spec/critic state, and the latest learning delta, e.g. `23 signals · spec in Critic review · +1.4 after the checkout learning`). `onChallenge` calls the `runCriticReview` mutation (see step 6). Render the queue header ("The opportunity queue · ranked by ICE" · "RE-RANKED 2H AGO" derived from the newest rescore learning) and the challenge footer. Handle loading / error / empty.
6. **Wire Challenge to the Critic.** In `OpportunityQueue.tsx`, `const mCritic = useServerFn(runCriticReview)` and a `useMutation` calling `mCritic({ data: { target: { kind: "opportunity", id } } })` (match the shape `CriticBadge` uses). `onMutate`/`onSuccess`: show the singleton toast "Critic engaged. The teardown lands on Today, receipts attached." for 3.6s and `invalidateQueries(["opportunities"])` so the inline verdict chip refreshes. Do NOT author any new server logic.
7. **Create `src/components/discover/DiscoverSurface.tsx`.** The orchestrator: the 1160px container with `cadRise`, the Newsreader hero, and the two-column grid (`1fr 1.15fr`, gap 20, align-items start) mounting `SignalFeed` and `OpportunityQueue`. Owns the surface-level empty state (when both feeds are empty -> the no-sources instruction, §9).
8. **Create `src/routes/_authenticated.discover.tsx`.** A TanStack route at `/_authenticated/discover` rendering `DiscoverSurface` inside the shell. If OBS-02 hoisted the shell into `_authenticated.tsx`, the route renders only `<DiscoverSurface />`; otherwise wrap in the Obsidian `AppShell` + top bar. `head: () => ({ meta: [{ title: "Discover · Supaprod" }] })`. Add an `errorComponent` in the house voice. Let the router plugin regenerate `routeTree.gen.ts` (never hand-edit it).
9. **Restraint + grayscale pass.** Confirm exactly one ember element candidate on the screen is actually ember only when a bet's verdict is REVISE (ember chip is status, allowed); zero ember decoration; one pencil; one glacier machine voice ("128 THIS WEEK", the italic hero word). Screenshot in grayscale and confirm every verdict still reads by its word, not its color.
10. **Tests.** Add `src/components/discover/format.test.ts` (relTimeCaps buckets, sourceCaps, verdictFor mapping) and a render smoke test that the top opportunity gets exactly one pencil and no other row does. Run `tsc --noEmit`, `bun test`, and the side-by-side parity walk (§11).

## 6. Structure

```
src/routes/_authenticated.discover.tsx        (NEW · route, mounts DiscoverSurface in the shell)
src/components/discover/
├── DiscoverSurface.tsx                        (NEW · 1160 container, hero, two-column grid, surface empty state)
├── SignalFeed.tsx                             (NEW · left column · consumes listSignals + listThemes)
│   └── SignalCard.tsx                         (NEW · one verbatim signal card)
├── OpportunityQueue.tsx                       (NEW · right column · consumes listOpportunities + listLearnings + runCriticReview)
│   └── OpportunityRow.tsx                     (NEW · one ICE row + verdict chip + Challenge + optional pencil)
├── format.ts                                  (NEW · relTimeCaps · sourceCaps · verdictFor)
└── format.test.ts                             (NEW · unit tests)
```

Consumed from OBS-03 (imported, not rebuilt): `VerdictChip`, `MonoLabel`, `PencilNote`, `Toast` (or the app toast at `src/lib/notify`). Consumed from OBS-02: the shell / rail / top bar. `SignalCard` and `OpportunityRow` are surface-specific and live here (they are not OBS-03 primitives).

**Data flow (all read-only, shared cache):** `listSignals`/`["signals", activeProductId]` and `listThemes`/`["themes", activeProductId]` feed `SignalFeed`; `listOpportunities`/`["opportunities"]` and `listLearnings`/`["learnings"]` feed `OpportunityQueue`; `activeProductId` comes from `useWorkspace()`. The only write is the pre-existing `runCriticReview` mutation fired by Challenge. **Server fns are consumed, never modified.** No new query key is introduced (reuse the existing four so the surface shares the parchment surface's cache and stays consistent).

## 7. Design elements (exact values, embedded)

Tokens quoted from hub §5. Port as `[data-obsidian]`-scoped custom properties (OBS-01); the literal hexes below are the resolved values, do not invent others.

**Surface container.** `max-width: 1160px; margin: 0 auto; padding: 36px 32px 64px; animation: cadRise 260ms cubic-bezier(0.23, 1, 0.32, 1) both`.

**Hero (h1).** `font-family: "Newsreader", ui-serif, Georgia, serif; font-weight: 430; font-size: 28px; letter-spacing: -0.015em; color: #F2F0ED; margin: 0 0 24px`. Text: `The evidence desk. <em>Signal</em> on the left, judgment on the right.` The one italic word `Signal` is `font-style: italic; color: #7FD1DC` (glacier · the machine's own word). Exactly one italic word on this screen.

**Column grid.** `display: grid; grid-template-columns: 1fr 1.15fr; gap: 20px; align-items: start`.

### Left column · signal feed

- **Panel:** `background: #111113; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 18px 20px`.
- **Header row:** `display: flex; align-items: baseline; margin-bottom: 14px`. Left label mono `font-size: 9px; letter-spacing: 0.12em; color: #7D786F; text-transform: uppercase; flex: 1` = `Live signal feed`. Right count mono `font-size: 9px; letter-spacing: 0.08em; color: #7FD1DC` = `128 THIS WEEK` (glacier; derive the number from real signals this week).
- **Body:** `display: grid; gap: 14px`.
- **Signal card (`SignalCard`):** `display: grid; gap: 5px; padding-bottom: 13px; border-bottom: 1px solid rgba(255,255,255,0.05)` (omit the border on the last card).
  - Meta row `display: flex; align-items: center; gap: 8px`: source pill mono `font-size: 8.5px; letter-spacing: 0.08em; color: #E5BDDF; border: 1px solid rgba(229,189,223,0.35); border-radius: 99px; padding: 1px 7px` (blossom = information); timestamp mono `font-size: 8.5px; letter-spacing: 0.08em; color: #55524C`.
  - Quote `font-size: 13px; line-height: 1.6; color: #B5AFA6` (verbatim, kept as-is, with its curly quotes).
  - Theme line mono `font-size: 8.5px; letter-spacing: 0.08em; color: #7D786F` = `→ MOBILE QUICK-CAPTURE · 23 SIGNALS`.
- **Column footer:** `font-size: 11.5px; color: #55524C; margin-top: 12px` = `Every quote is verbatim and keeps its source. Nothing here is a summary.`

### Right column · opportunity queue

- **Wrapper:** `display: grid; gap: 12px`.
- **Header row:** `display: flex; align-items: baseline; padding: 0 4px`. Left mono `9px / 0.12em / #7D786F / uppercase / flex: 1` = `The opportunity queue · ranked by ICE`. Right mono `9px / 0.08em / #55524C` = `RE-RANKED 2H AGO`.
- **Opportunity row (`OpportunityRow`):** `position: relative; background: #111113; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px 18px; display: flex; gap: 16px; align-items: center; transition: background 140ms`. Hover: `background: #141416` (tonal one-step lift, nothing translates).
  - **Pencil (top bet only):** `position: absolute; top: -11px; right: 14px; font-family: "Caveat", cursive; font-size: 17px; font-weight: 600; color: #CDE07A; transform: rotate(-2deg); text-shadow: 0 0 12px rgba(205,224,122,0.4); border-bottom: 2px solid rgba(205,224,122,0.75); padding: 0 2px`. Text `best bet`. Exactly ONE on the screen (rank 0); the hub caps pencils at two, this surface uses one.
  - **ICE block:** `flex: none; width: 56px; text-align: center`. Score `font-family: "Newsreader", serif; font-size: 23px; font-weight: 460; color: #F2F0ED; line-height: 1`; label under it mono `font-size: 7.5px; letter-spacing: 0.14em; color: #55524C; margin-top: 3px` = `ICE`.
  - **Middle:** `flex: 1; min-width: 0`. Title `font-size: 13.5px; font-weight: 600; color: #F2F0ED; margin-bottom: 3px`; sub `font-size: 12px; line-height: 1.5; color: #7D786F`.
  - **Verdict chip:** mono `font-size: 9px; letter-spacing: 0.1em; font-weight: 600; border-radius: 99px; padding: 2px 9px; flex: none`, colored by verdict:
    - `SHIP` -> text `#8FD9A0`, border `rgba(127,191,142,0.45)`, fill `rgba(127,191,142,0.12)` (moss).
    - `REVISE` -> text `#FF8B52`, border `rgba(255,107,44,0.45)`, fill `rgba(255,107,44,0.12)` (ember; this is status, the one allowed ember).
    - `KILL` -> text `#EE7A6C`, border `rgba(224,101,87,0.45)`, fill `rgba(224,101,87,0.12)` (madder).
    - `WATCH` -> text `#E8B44C`, border `rgba(232,180,76,0.45)`, fill `rgba(232,180,76,0.12)` (marigold, in-review).
    - `PENDING` -> transparent fill, faint text `#7D786F`, `1px solid rgba(255,255,255,0.09)` border.
  - **Challenge button:** `font-family: inherit; font-size: 12px; font-weight: 500; color: #F2F0ED; background: #1D1D21; border: 1px solid rgba(255,255,255,0.09); border-radius: 7px; padding: 6px 13px; cursor: pointer; flex: none; transition: background 140ms`. Hover `background: #242429`. `title="The Critic red-teams this bet · receipts attached"`. It is a secondary button (never ember).
- **Column footer:** `font-size: 11.5px; color: #55524C; padding: 0 4px` = `Challenge any bet, even your own. The Critic answers with evidence, never with vibes.`

### Toast (Challenge)

Fixed bottom-center, `background: #17171A`, `border: 1px solid rgba(127,191,142,0.4)` + moss glow, `font-size: 13px; color: #F2F0ED`, `cadRise` 200ms in, auto-dismiss 3.6s, singleton (a new Challenge replaces the current toast, resetting the 3.6s timer). Text in §9.

### Interaction states

- **Hover:** opportunity rows lift to `#141416`; Challenge button to `#242429`. Tonal only · nothing moves.
- **Focus:** every actionable element (Challenge button, and any row that becomes actionable later) shows `:focus-visible` `outline: 2px solid #7FD1DC; outline-offset: 2px` (glacier focus ring). Signal cards are non-interactive and take no focus.
- **Active / pressed:** Challenge is a secondary button, so no ember-deep press; keep the `#242429` hover fill, no scale transform (scale(0.985) is reserved for the ember primary, which this surface does not render).
- **Loading:** feed shows four placeholder signal cards (neutral `#111113` blocks, `1px rgba(255,255,255,0.05)` divider, a faint mono `Reading signals` line, no spinner theatrics); queue shows four placeholder rows (the ICE block and title as neutral bars). No shimmer here (the shimmer is reserved for an agent actively working, max one per screen; a plain read is not that).
- **Error:** replace the affected column body with a quiet card `background: #111113; border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 20px`, a madder mono label, the message in muted body ink, and a secondary Retry button with a consequence helper (§9).
- **Empty (no sources at all):** the surface-level instruction in §9 with one Connect button, replacing both columns.

## 8. Restructuring / renaming / modification

- **New files only** (listed in §6). No file is renamed, moved, or deleted by OBS-06.
- **No route redirect and no nav-model edit.** `/product`, `/discovery`, `/opportunities` keep their current behavior; the rail is not re-pointed to `/discover` yet. Both are OBS-10.
- **No lucide removal in this item's new files** because none of them import lucide (the Obsidian iconography law: no icon set, mono affordances `→` and the middot only). The lucide imports in the parchment `SignalsPanel` / `OpportunitiesPanel` / `_authenticated.product.tsx` are left in place (they die when OBS-10 folds `/product`).
- **`routeTree.gen.ts`** is regenerated by the router plugin when `_authenticated.discover.tsx` is added. Do not hand-edit it.
- If none of the above applies to a reviewer's checklist item, the answer is "none, by design · OBS-06 is additive; the fold and the deletions are OBS-10."

## 9. Copy / voice (humanized, exact strings)

All strings below are final. No em or en dashes, no exclamation marks, no emoji; mono-caps metadata uses the middot `·`.

- **Hero:** `The evidence desk. Signal on the left, judgment on the right.` (`Signal` is the one italic glacier word).
- **Left header:** `Live signal feed` · right count `128 THIS WEEK` (real count).
- **Signal theme line (pattern):** `→ MOBILE QUICK-CAPTURE · 23 SIGNALS` (mono caps, real theme + count).
- **Left footer:** `Every quote is verbatim and keeps its source. Nothing here is a summary.`
- **Right header:** `The opportunity queue · ranked by ICE` · right note `RE-RANKED 2H AGO` (real relative time of the last rescore; omit if never rescored).
- **Verdict chips:** `SHIP` · `REVISE` · `KILL` · `WATCH` · `PENDING` (word carries the meaning; color is redundant).
- **Pencil (top bet):** `best bet`.
- **Challenge button:** `Challenge` · tooltip `The Critic red-teams this bet · receipts attached`.
- **Right footer:** `Challenge any bet, even your own. The Critic answers with evidence, never with vibes.`
- **Challenge toast:** `Critic engaged. The teardown lands on Today, receipts attached.`
- **Empty (no sources):** title/body as one instruction with a time estimate: `Nothing sensed yet. Plug in Intercom and give it ten minutes.` One secondary button `Connect a source` with helper `Opens Connections · Scout starts reading as soon as it is linked`.
- **Loading:** feed `Reading signals` · queue `Ranking opportunities` (faint mono, no ellipsis-as-decoration beyond a plain word).
- **Error (feed):** label `Could not load signals` · button `Retry` · helper `Reloads the feed · nothing is lost`. **Error (queue):** label `Could not load opportunities` · button `Retry` · helper `Reloads the queue`.

## 10. Acceptance criteria

- [ ] `/discover` renders the two-column evidence desk at 1160px, indistinguishable from the prototype at 1440px (layout, spacing, type, color, footers).
- [ ] The hero reads exactly as §9 with `Signal` italic in glacier `#7FD1DC`.
- [ ] The signal feed shows real verbatim signals (source pill blossom, timestamp, quote unaltered, theme line) newest first, with the live "N THIS WEEK" glacier count and the verbatim footer.
- [ ] The opportunity queue shows real opportunities ranked by ICE descending, each with the Newsreader score, title, sub, and a verdict chip whose color matches the §7 map, plus the challenge-any-bet footer.
- [ ] Exactly ONE pencil annotation (`best bet`, Caveat lime, rotated -2deg) sits on the top bet; no other row carries a pencil.
- [ ] Challenge fires `runCriticReview` for that opportunity and shows the singleton toast "Critic engaged. The teardown lands on Today, receipts attached." for 3.6s; the inline verdict chip refreshes when the review lands.
- [ ] No ember appears except a REVISE verdict chip (status); zero ember decoration; one glacier machine voice; the screen is ~90% neutral.
- [ ] Empty, loading, and error states render the §9 copy; the no-sources empty state offers one Connect button.
- [ ] No new or modified server function; the four read queries reuse the existing query keys; the legacy `/product` surface is byte-untouched.
- [ ] Keyboard: `2` reaches this surface (via the rail map); `:focus-visible` shows the 2px glacier ring on the Challenge button; reduced-motion zeroes `cadRise` and the toast entrance.
- [ ] Grayscale screenshot still reads (every verdict legible by its word).

## 11. Prototype-parity checklist (the last gate, tailored)

Open `design-reference/obsidian-v3/design-reference/cadence-app.html` (Discover) and `/discover` side by side at 1440px:

1. **Rail:** 236px, mono index 01-05, Discover = index `02` active (bg `#1A1A1E`, ember index); the one Today badge unchanged; user chip present.
2. **Surface chrome:** 52px top bar; container max-width 1160px; padding 36/32/64; `cadRise` 260ms entrance.
3. **Type:** hero Newsreader 28px/430 with the single glacier italic `Signal`; ICE score Newsreader 23px/460; titles 13.5px/600; quotes 13px/1.6; mono labels 8.5-9px caps with middots.
4. **Color:** zero hexes outside the tokens; ember only on a REVISE chip; verdict chip hues match the §7 map exactly; pencil lime `#CDE07A` with its `0 0 12px` glow; blossom source pills `#E5BDDF`.
5. **Motion:** row hover 140ms tonal to `#141416`; Challenge hover 140ms to `#242429`; screen entry 260ms; the toast `cadRise` 200ms then 3.6s dismiss; reduced-motion kills all.
6. **Behavior:** Challenge fires the Critic and the singleton toast; only one toast at a time; the top bet carries exactly one pencil; keyboard `2` selects the surface.
7. **Copy:** every string matches §9 (verbatim quotes, plain-word Challenge, consequence tooltip, mono-caps metadata, no em dashes, no exclamation marks).
8. **Grayscale + restraint:** grayscale screenshot reads; restraint budget audited (one ember-status max, one pencil, one glacier voice, no aurora, no shimmer).

## 12. Verification + gates

- **Types:** `tsc --noEmit` = 0.
- **Tests:** `bun test` green, including the new `src/components/discover/format.test.ts` (relTimeCaps buckets, sourceCaps upcasing, verdictFor mapping incl. the WATCH/PENDING fallbacks) and the single-pencil render smoke test.
- **Build:** `bun run build` is RED in lane worktrees on the pre-existing node20-vs-ESM `lovable-tagger` `require() ` error (hub §11) · in a worktree treat `tsc` + `bun test` as the real gates; run the full build on the primary checkout before publish. Do not chase the lovable-tagger error.
- **Grayscale test:** screenshot with color removed; every verdict must still read by its word.
- **Restraint budget (hub §4):** at most one ember (a REVISE chip), one pencil, one glacier machine voice; no aurora, no shimmer; ~90% neutral.
- **Humanized-output (`impeccable`):** grep every new UI string for `-`, `-`, `!`, and the banned words (seamlessly, leverage, empower, robust, unlock, delve). Zero hits.
- **Manual:** load `/discover` against real seeded data (see `docs/operations/demo-credentials.md`); confirm verbatim quotes are unaltered, the top bet has the pencil, Challenge shows the toast and refreshes the chip, and the empty state renders when a fresh workspace has no signals. Attach the side-by-side prototype screenshots (Discover) to the ship report.

## 13. Risks · gotchas · founder-gates

- **Honesty of the Challenge promise (verify).** The toast says the teardown "lands on Today, receipts attached." Confirm `runCriticReview` actually surfaces a Call / teardown on Today via the existing reactor. If it only attaches an inline `critic_review` and does not reach Today yet, either (a) confirm the existing Today wiring picks it up, or (b) soften the toast to what is true and file the Today-landing as a follow-up. Claim never outruns wiring.
- **Capture/cluster/promote/draft relocation is an OBS-10 open question, not OBS-06's job.** The parchment `/product` surface owns signal capture, bulk import, clustering, promote-to-opportunity, draft-spec, status changes, lineage, and delete. The Obsidian evidence desk (per the prototype) is read + Challenge only. Before OBS-10 redirects `/product` -> `/discover`, those actions must be relocated (⌘K acts in OBS-11, a quiet capture affordance, or a slide-over) so nothing is lost. Flag this to the founder as a dependency of OBS-10, not a gap in OBS-06.
- **Signal-feed shape.** The prototype feed lists individual verbatim signals with a theme line, not the parchment table of clustered themes. Build the feed from `listSignals` (each signal a card) and use `listThemes` only to resolve the theme line; do not reproduce the bento table.
- **Shared cache.** Reuse the exact existing query keys so `/discover` and the still-live `/product` never show divergent data. Do not introduce a parallel key.
- **Reduced motion.** `cadRise` and the toast entrance must gate on `prefers-reduced-motion`; verify the media block zeroes them.
- **No founder gate on this item itself** beyond the two flags above (both really OBS-10 concerns). OBS-06 ships as a pure additive surface.

## 14. Interlinks

- **Hub / shared substrate:** [`README.md`](./README.md) (§4 restraint budget, §5 tokens/type/motion, §5.9 parity checklist, §6 IA target, §7 codebase map).
- **Depends on:** [`OBS-03.md`](./OBS-03.md) (primitives: `VerdictChip`, `MonoLabel`, `PencilNote`, `Toast`).
- **Build-order neighbors:** [`OBS-05.md`](./OBS-05.md) (Build cockpit sibling), [`OBS-07.md`](./OBS-07.md) (Plan sibling, shares the 1160px two-column pattern and the Newsreader hero).
- **Route fold:** [`OBS-10.md`](./OBS-10.md) (folds `/product` · `/discovery` · `/opportunities` -> `/discover`; owns the capture-relocation decision).
- **Canon anchors:** `docs/design/archive/obsidian-v3.md` §8 (Discover in the IA) and §9 (component anatomies); `design-reference/obsidian-v3/components.md` -> "Signal card (Discover, left column)", "Opportunity row (Discover, right column)", "Verdict chips", "Toast"; `design-reference/obsidian-v3/implementation-notes.md` §Core behaviors item 3 (Challenge fires the Critic toast); `design-reference/obsidian-extensions.md` §9 (Discover, no-sources empty state).
- **Doctrine:** [`../../conventions/engine-room-doctrine.md`](../../../../conventions/engine-room-doctrine.md) · [`../../conventions/humanized-output.md`](../../../../conventions/humanized-output.md) · strategy tie [`../../strategy/v11-guiding-star.md`](../../../../strategy/v11-guiding-star.md).
