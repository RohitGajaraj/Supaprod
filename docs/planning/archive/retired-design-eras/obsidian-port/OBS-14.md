# OBS-14 · Onboarding golden path (Arrival to Today in ten minutes)

> _Created: 2026-07-02 · Last updated: 2026-07-02_

> Self-contained build + implementation spec. Read [`README.md`](./README.md) (the hub) once for the shared canon, then build from here. Where a value below is quoted, it is copied verbatim from the hub, `docs/design/archive/obsidian-v3.md`, `design-reference/obsidian-extensions.md`, or the frozen prototype `design-reference/obsidian-v3/design-reference/cadence-app.html`. The prototype is the floor; additions only add.

## 1. Snapshot

| Field         | Value                                                                                                                                                                                                                                            |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| ID            | OBS-14                                                                                                                                                                                                                                           |
| Rank          | #15                                                                                                                                                                                                                                              |
| Tier          | 2                                                                                                                                                                                                                                                |
| Status        | pending (founder-gated on the demo seed)                                                                                                                                                                                                         |
| Category      | Cockpit                                                                                                                                                                                                                                          |
| Depends on    | OBS-10 (IA consolidation · the rail + `/today` destination are real), OBS-04 (lands on the ported Today, hosts the coach mark), OBS-03 (primitives: Button, MonoLabel, StatusDot), demo seed live (DEMO-SEED-RICH / `ONBOARDING_SEED_ENABLED=1`) |
| Blocks        | nothing downstream                                                                                                                                                                                                                               |
| One-line what | The five-screen golden path: Arrival (butterfly choreography) to track pick to one connection or seeded demo to point the Critic to land on Today with one glacier coach mark. Every step carries a time estimate. No tour.                      |
| Dashboard row | [`../feature-dashboard.md`](../../../feature-dashboard.md) group G14, row OBS-14                                                                                                                                                                       |
| Summary bible | [`../obsidian-port-plan.md`](../obsidian-port-plan.md)                                                                                                                                                                                           |

## 2. Why we are doing it

Onboarding is the first ten minutes, and the whole thesis has to be felt before any feature is explained: a calm instrument that judges with receipts. Today the first-run flow (`OnboardingFlow.tsx`) is the parchment Ember Editorial system on `var(--paper)` with lucide icons and a four-step setup wizard (connections, staff toggles, goal). It teaches configuration, not judgment. OBS-14 replaces it with the golden path from contract §11 and extensions §4: track pick to one connection (or seeded demo) to point the Critic at a belief to a cited teardown that lands on Today. The user does one real thing and watches the machine start working.

**Which of the three laws it serves.** **Law 2 (one queue for attention):** the path ends by pointing at the exact place decisions will arrive (the Today badge), and the only ember on any screen is the single forward CTA. **Law 3 (depth on demand):** nothing is explained until its trigger exists. There is no tour. The one coach mark appears on first landing and is dismissed forever. **Law 1 (one object, one anatomy):** the connection option uses the same Connect shelf anatomy as the Engine Room connection strip; the track cards use the standard quiet-card anatomy from OBS-03.

**The felt user outcome.** The user lands on a black canvas, the butterfly flies in and settles, one serif line names the promise ("Judgment, with receipts."), and a single ember Start begins a path with zero required setup. They pick a job, connect one source or take the seeded demo, hand the Critic a real belief, and arrive on Today watching the working shimmer live in the rail. The restraint is the reassurance: the product never nags, not even while onboarding.

**The v11 / engine-room tie.** This is the decision-and-outcome layer introducing itself (v11 guiding star): the first thing the product does is turn a belief into a cited teardown. The engine-room doctrine (calm front, deep engine, capability revealed on demand) is why there is no tour and only one coach mark. The empty-state law (an instruction with a time estimate) governs every option on the connection screen.

## 3. What we are building

**Scope IN**

- A five-screen Obsidian onboarding, full-viewport, dark-only, scoped under `[data-obsidian]`, replacing the parchment `OnboardingFlow` render at `/onboarding`:
  1. **Arrival** · black canvas, the butterfly arrival choreography (fly in, four wing beats, land, settle), Newsreader 34px "Judgment, with receipts.", muted sub, one ember "Start".
  2. **Track pick** · three quiet cards, plain-words jobs; picking one seeds the examples (never limits capability).
  3. **One connection** · a single Connect shelf, with the equal-weight seeded-demo action "Use demo data instead · 0 setup"; every option carries a time estimate.
  4. **Point the Critic** · one input pre-filled with a real belief from the connected/seeded source, one ember "Challenge this", consequence line naming what happens.
  5. **Land on Today** · navigate to `/today` with the working shimmer live in the rail and exactly one glacier coach mark, dismissed forever.
- A name-capture pre-gate (reused, re-skinned to Obsidian) for any signup path missing `display_name`, shown before Arrival. It is not one of the five counted screens.
- One new reusable coach-mark primitive, hosted by OBS-04's Today, keyed to dismiss-forever local storage.
- A per-screen progress affordance (four ember segments, Arrival is unnumbered) matching the prototype's mono-caps step register.

**Scope OUT (no feature work rides along)**

- No server functions are written or changed. OBS-14 consumes these existing ones read-only or via their existing mutations: `getProfile` (`["profile"]`, the name pre-gate), `seedWorkspaceForTrack` (track pick seeding, existing mutation), `listConnections` + the existing connect mutations (`startGatewayConnect` / `saveGatewayConnection` / `startGithubAppConnect` and the calendar trio), `runCriticReview` (`src/lib/discovery.functions.ts:20`, the Critic challenge), `completeOnboarding` (`src/lib/onboarding.functions.ts:229`, the finish), and `markOnboarded` (`src/lib/onboarding-gate.ts`). The seeded demo relies on the founder-gated seed (`seedWorkspace` / DEMO-SEED-RICH under `ONBOARDING_SEED_ENABLED=1`).
- No new Critic kind, no new schema, no new columns, no new track. The staff-toggle step and the goal step from the parchment wizard are dropped, not re-skinned (staff config lives in Settings; the goal becomes the Critic belief).
- The Today surface itself is OBS-04. OBS-14 adds only the coach mark host and the "just landed" trigger to it; it does not restyle Today.
- The nav-model and route folds are OBS-02 / OBS-10, not here.

## 4. Current state

Real files as of 2026-07-02:

- **Route:** `src/routes/_authenticated.onboarding.tsx` renders `<OnboardingFlow />` full-viewport with no shell. The `_authenticated` `beforeLoad` gate redirects `profiles.onboarded === false` here (via `needsOnboarding`). Route stays; only the rendered component changes.
- **The gate:** `src/lib/onboarding-gate.ts` reads `profiles.onboarded` once per user (cached), self-heals a missing row to `onboarded=false`, and exposes `markOnboarded(userId)` to release the gate on finish. Fully reused, unchanged.
- **Current component:** `src/components/onboarding/OnboardingFlow.tsx` (~592 lines) is parchment: `background: var(--paper)`, a `StepShell` anatomy (mono-label "Setup · step N of 4", four `var(--ember)` progress bars, `font-display` 30px title), lucide icons (`Check`, `Plus`, `Loader2`), and a four-branch flow: gate 0 `BasicDetailsStep` (name/role), step 0 `TrackSelector` (seeds via `seedWorkspaceForTrack`), step 2 connections, step 3 staff toggles, step 4 goal. It calls `completeOnboarding` then `markOnboarded` then `navigate({ to: "/" })`.
- **Track seeding:** `TrackSelector.tsx` calls `seedWorkspaceForTrack` with an `OnboardingTrack`, using `getTrackSeed` / `trackDescriptions` from `src/lib/onboarding/track-seeds.ts`. Reused for the new track-pick screen (three cards).
- **Connections:** the connect mutations and `listConnections` / calendar trio are wired in `OnboardingFlow` today (lines 151 to 220). Lift the mutation logic into the new connection screen; the connect UX (OAuth popup / GitHub App redirect) is unchanged.
- **Critic:** `runCriticReview` (`src/lib/discovery.functions.ts:20`) already exists and produces the teardown that will surface on Today. Consumed as-is.
- **Butterfly assets:** `design-reference/obsidian-v3/assets/butterfly-idle.svg` (ash wings `#8A8580` / `#6E6A64`, porcelain body `#F2F0ED`, 24-unit viewBox, transform-origin implied 12,12), `butterfly-working.svg` (violet `#C77DFF`), `butterfly-ember.svg`. Never redraw. Arrival uses the idle asset.
- **What is parchment / lucide / per-page-shell here:** all of `OnboardingFlow.tsx` (paper background, lucide, parchment tokens). It is superseded, not re-skinned.
- **What stays:** the route file, the gate, `markOnboarded`, `getProfile`, `seedWorkspaceForTrack`, the connect mutations, `runCriticReview`, `completeOnboarding`. Only the presentation layer changes.
- **Coach mark:** none exists (`grep CoachMark` is empty). OBS-14 creates it.

## 5. How · step by step

1. **New file `src/components/onboarding/ObsidianOnboarding.tsx`.** The full five-screen flow, wrapping everything in a `<div data-obsidian className="ob-onboard">` so the Obsidian token layer (OBS-01) applies. Internal state: `type Phase = "name" | "arrival" | "track" | "connect" | "critic"`; a `useState<Phase>("arrival")`, plus `useState` for the picked track and the chosen belief. Land on Today by `navigate` (never a sixth phase).
2. **Name pre-gate.** Reuse the `getProfile` query and the `needsDetails` check (no `display_name`). If it needs details, render an Obsidian-styled name capture (re-skin `BasicDetailsStep` or inline a minimal Newsreader + one field), then set phase to `"arrival"`. This screen is not numbered.
3. **Screen 1 · Arrival.** Black `--canvas` full-viewport, centered. Render the idle butterfly (56px) with the arrival choreography (step 7 below). Below it: Newsreader 34px "Judgment, with receipts." (one screen, no italic word needed here); a `--text-muted` 13px sub; one ember Button "Start" (OBS-03 Button, primary). Start advances to `"track"`. Nothing else on the screen.
4. **Screen 2 · Track pick.** Header (mono eyebrow "STEP 1 OF 4", Newsreader 28px "What are you here to do?"), then three quiet cards (radius 12, hover lifts one surface step) in a single column, each a plain-words job with a one-line sub. Clicking a card calls `seedWorkspaceForTrack` (existing mutation) with that track, shows a quiet inline pending state on that card, and on success advances to `"connect"`. Picking never limits capability; note that in the sub copy only if it fits the register (it does not need to be stated).
5. **Screen 3 · One connection.** Header ("STEP 2 OF 4", "Give it something to read."). One Connect shelf: the real provider list (`listConnections` availability), each row a Connect action that carries a time estimate in mono ("INTERCOM · ABOUT 2 MINUTES"). Below, equal-weight, a single quiet action "Use demo data instead · 0 setup" that requires the seed to be live. Connecting any source, or taking the demo, advances to `"critic"`. At zero connections the demo action is the unmistakable no-friction path (weight-equal to Connect, per the founder ruling that connecting is never a gate).
6. **Screen 4 · Point the Critic.** Header ("STEP 3 OF 4", "Point the Critic at a belief."). One input pre-filled with a real belief string derived from the connected/seeded source (fallback constant "Mobile capture is our biggest gap"). One ember Button "Challenge this". A `--text-subtle` consequence line: "The teardown lands on Today · receipts attached". Clicking calls `runCriticReview` with the belief, then `completeOnboarding`, then `markOnboarded(userId)`, sets a one-shot flag `sessionStorage["supaprod.onboarding.justLanded"] = "1"`, and `navigate({ to: "/today" })`.
7. **New file `src/components/onboarding/ArrivalButterfly.tsx`.** Renders `butterfly-idle.svg` inline (imported as a component or `<img>` from the asset), size 56. Applies a one-shot arrival animation `cadArrive` (opacity 0 to 1, translateY 18px to 0, scale 0.92 to 1, over 900ms `--ease`), followed by four wing beats via `cadFlutter` (from `motion.css`, transform-origin 12px 12px), settling to the slow idle flutter. Under `prefers-reduced-motion` the butterfly renders static, fully visible, no fly-in, no flutter.
8. **New file `src/components/onboarding/TodayCoachMark.tsx`.** A small glass panel (backdrop blur 20, 8% hairline, `--glacier` hairline accent) anchored to the Today Call badge with a glacier tail/arrow. Copy: "Your first teardown is being built. This badge is where decisions find you." One quiet dismiss ("Got it"). On dismiss, write `localStorage["supaprod.coachmark.today-badge"] = "1"` so it never returns.
9. **Wire the coach mark into OBS-04's Today** (`src/routes/_authenticated.today.tsx`): on mount, if `sessionStorage["supaprod.onboarding.justLanded"] === "1"` AND `localStorage["supaprod.coachmark.today-badge"]` is unset, render `<TodayCoachMark />` anchored to the badge, then clear the session flag. This is the only Today edit OBS-14 makes.
10. **Swap the route render.** In `src/routes/_authenticated.onboarding.tsx`, change `<OnboardingFlow />` to `<ObsidianOnboarding />`. Delete or archive the parchment `OnboardingFlow.tsx` once the new flow passes (see §8).
11. **Tests.** Add `src/components/onboarding/ObsidianOnboarding.test.tsx` (phase transitions: name to arrival to track to connect to critic; demo action gated on seed; finish calls `completeOnboarding` + `markOnboarded` + navigate) and `src/components/onboarding/TodayCoachMark.test.tsx` (renders once when the just-landed flag is set, never after dismiss). Keep server fns mocked; this is presentation logic.
12. **Verify** `tsc --noEmit` = 0, `bun test` green, then the manual walk of §12 with side-by-side screenshots.

## 6. Structure

```
src/routes/_authenticated.onboarding.tsx      (edit: render ObsidianOnboarding)
└─ ObsidianOnboarding.tsx                      (NEW · the five-screen flow, [data-obsidian])
   ├─ <NamePreGate/>                            (re-skin of BasicDetailsStep, Obsidian; not counted)
   ├─ Screen 1 Arrival
   │  └─ ArrivalButterfly.tsx                   (NEW · idle asset + cadArrive + cadFlutter)
   ├─ Screen 2 Track pick   → seedWorkspaceForTrack   (existing mutation)
   ├─ Screen 3 One connection → listConnections + connect mutations (existing)
   │                          └─ "Use demo data instead" → seeded demo (ONBOARDING_SEED_ENABLED)
   └─ Screen 4 Point the Critic → runCriticReview → completeOnboarding → markOnboarded → /today

src/routes/_authenticated.today.tsx            (edit: host TodayCoachMark on justLanded)
└─ TodayCoachMark.tsx                           (NEW · glass panel, dismiss-forever)
```

- **New files:** `src/components/onboarding/ObsidianOnboarding.tsx`, `src/components/onboarding/ArrivalButterfly.tsx`, `src/components/onboarding/TodayCoachMark.tsx`, `src/components/onboarding/ObsidianOnboarding.test.tsx`, `src/components/onboarding/TodayCoachMark.test.tsx`.
- **Edited files:** `src/routes/_authenticated.onboarding.tsx` (render swap), `src/routes/_authenticated.today.tsx` (coach-mark host, one gated block).
- **Superseded:** `src/components/onboarding/OnboardingFlow.tsx` (parchment; removed after cutover). `TrackSelector.tsx` / `BasicDetailsStep.tsx` / `ConciergeContextStep.tsx` / `GettingStartedChecklist.tsx` are parchment helpers; reuse their server-fn logic, do not import their parchment JSX into the Obsidian flow.
- **Data flow (all consumed, none modified):** `["profile"]` (getProfile), `seedWorkspaceForTrack` mutation, `["connections"]` + `["calendar-connections"]` and the connect mutations, `runCriticReview` mutation, `completeOnboarding` mutation, `markOnboarded`. Primitives (Button, MonoLabel, StatusDot) come from OBS-03; do not rebuild them.

## 7. Design elements

All values below are quoted from hub §5. Scope every token to `[data-obsidian]`. Never invent a hex, duration, or easing.

**Surfaces / ink.** Canvas `--canvas #0A0A0B` (every screen background). Cards `--card #111113`, hover fill `--hover #1D1D21`, hairline `--hairline rgba(255,255,255,0.07)`, hairline-strong `rgba(255,255,255,0.09)`. Primary ink `--text-primary #F2F0ED`, body `--text-body #B5AFA6`, muted `--text-muted #9C978F`, subtle `--text-subtle #7D786F`, faint `--text-faint #55524C`.

**Roles.** Ember `--ember #FF6B2C` (pressed `--ember-deep #C2571F`, text-on-fill `--cta-ink #0A0A0B`): the one forward CTA per screen and nothing else. Glacier `--glacier #7FD1DC`: the coach mark accent, the focus ring, the rail working state. Selection `rgba(255,107,44,0.28)`.

**Type.** `--font-serif "Newsreader"` for the Arrival hero at `--text-hero 34px` (weight 420 to 440, -0.015em, line-height 1.15) and the per-screen 28px `--text-h2` headings. `--font-ui "Schibsted Grotesk"` for all UI at `--text-base 13px` / 1.55, 600 headings. `--font-mono "JetBrains Mono"` for the step eyebrow and time estimates at `--text-mono-label 9.5px`, 0.10 to 0.12em tracking, uppercase, middot `·` separators.

**Geometry.** 4px grid; rhythm `--space-1..6` = 4/8/12/16/24/40. Radii: track cards and connection rows `--radius-card 12`; the coach-mark panel `--radius-panel 14`; the ember Start `--radius-control 8`; step segments `--radius-pill 99`. Container width for the framed screens 600px max (matches the current onboarding column); Arrival is centered with no frame.

**Motion.** One easing `--ease cubic-bezier(0.23,1,0.32,1)`. Screen entrances use `cadRise` (translateY 10px to 0, 260ms). Hover on cards is a 140ms one-step surface lift + brightened hairline, tonal, never spatial. Press on the ember CTA: fill to `--ember-deep`, scale(0.985) for 140ms. `cadFlutter` (3.4s, transform-origin 12px 12px) for the butterfly rest; the bespoke `cadArrive` (900ms, opacity/translateY 18px to 0/scale 0.92 to 1) for the fly-in. All motion gates on `prefers-reduced-motion` (zeroed) and the in-product toggle.

**Component anatomies.**

- **Arrival hero:** butterfly 56px centered; 24px gap to the Newsreader 34px line; 12px to the muted 13px sub; 24px to the ember Start (control radius 8, 12px/20px padding, `--cta-ink` text). No card, no border, pure canvas.
- **Track card:** `--card` fill, 1px `--hairline` border, radius 12, padding 14px/16px, left-aligned. Title Schibsted 15px/550, sub `--text-muted` 12px. Hover lifts to `--hover` and brightens the hairline to `--hairline-strong`. Pending state: a quiet glacier dot + "SEEDING" mono label, no spinner icon.
- **Connection row:** `--card` fill, 1px hairline, radius 12, padding 13px/14px. Left: provider label Schibsted 13.5px/550 + a mono time estimate ("INTERCOM · ABOUT 2 MINUTES") in `--text-faint`. Right: a "Connect" text affordance (`→` unicode in mono, no lucide). Unconfigured providers drop to opacity 0.45 with helper "Admin setup required". The demo action is a full-width quiet row below the shelf, equal weight, no ember.
- **Critic input:** one full-width input, `--raised #17171A` fill, 1px hairline, radius 8, pre-filled belief in `--text-body`; focus shows the 2px glacier ring offset 2. Ember "Challenge this" below-right; consequence line `--text-subtle` 11.5px to its left.
- **Coach mark:** glass panel (backdrop-filter blur 20, background `rgba(17,17,19,0.72)`, 1px `rgba(255,255,255,0.08)` hairline, radius 14, padding 12px/14px), a 1px `--glacier` accent hairline on the anchored edge and a small glacier arrow pointing at the badge. Copy in `--text-body` 13px; a quiet "Got it" text button in `--text-muted`.

**Interaction states.**

- **Hover:** cards and rows lift one surface step (`--card` to `--hover`), hairline brightens; no translate.
- **Focus:** 2px `--glacier` outline, offset 2 (`:focus-visible`) on every card, row, input, and button.
- **Active/press:** ember CTA to `--ember-deep` + scale(0.985) 140ms.
- **Empty (connection screen with nothing configured):** the demo action is the primary path; helper "You can connect a real source anytime in Settings."
- **Loading (track seeding, Critic running):** an inline glacier dot + mono label on the acting element, never a full-screen spinner, never a lucide `Loader2`.
- **Error (seed unavailable, connect failed, Critic failed):** a quiet inline `--text-muted` line under the acting element ("Could not reach that source · try demo data"); never a red toast unless a real status. The flow never traps: any failure still allows the demo path and Finish.

## 8. Restructuring / renaming / modification

- **Render swap:** `src/routes/_authenticated.onboarding.tsx` renders `<ObsidianOnboarding />` instead of `<OnboardingFlow />`.
- **Deletion:** remove `src/components/onboarding/OnboardingFlow.tsx` (parchment, superseded) after the new flow passes §12. If a staged cutover is preferred, keep it one commit and delete in the same PR; do not leave two live onboarding components.
- **Lucide removal:** the new flow imports zero lucide. The parchment `OnboardingFlow` imported `Check`, `Plus`, `Loader2` from `lucide-react`; those go with the file. Replace with the mono `→`/`·` affordances and glacier dots (iconography law, hub §5.8).
- **Parchment token removal:** no `var(--paper)`, `var(--ink)`, `var(--surface-2)`, `.mono-label`, `.btn`, `.lift`, `.fade-up`, or `.font-display` parchment classes in the new files. Use `[data-obsidian]` tokens and OBS-03 primitives.
- **Reuse (not rename):** `seedWorkspaceForTrack`, `runCriticReview`, `completeOnboarding`, `markOnboarded`, `getProfile`, `listConnections`, the connect mutations, `getTrackSeed` / `trackDescriptions` / `OnboardingTrack`.
- **Redirects:** none. `/onboarding` stays; the gate logic is unchanged.
- **Nav-model edits:** none (that is OBS-02 / OBS-10). Onboarding is off-shell and off-rail.
- **Route folds:** none.

## 9. Copy / voice

Humanized: no em or en dashes, middot `·` as separator, no exclamation marks, plain-words buttons, consequence in helper text, mono-caps metadata.

- **Arrival:** hero "Judgment, with receipts." · sub "Supaprod reads your signals, argues with your beliefs, and shows its work. Ten minutes to your first teardown." · CTA "Start".
- **Track pick:** eyebrow "STEP 1 OF 4" · heading "What are you here to do?" · cards:
  - "Find what to build next" · sub "Supaprod clusters your signals and ranks the opportunities."
  - "Ship what is decided" · sub "Turn a decision into a cited spec and a live mission."
  - "Prove what worked" · sub "Track outcomes against the bet you made."
- **One connection:** eyebrow "STEP 2 OF 4" · heading "Give it something to read." · per-row estimate e.g. "INTERCOM · ABOUT 2 MINUTES", "GITHUB · ABOUT 1 MINUTE" · demo action "Use demo data instead · 0 setup" · demo helper "A seeded workspace with real-shaped signals · nothing to connect." · unconfigured helper "Admin setup required · ask your workspace admin."
- **Point the Critic:** eyebrow "STEP 3 OF 4" · heading "Point the Critic at a belief." · input pre-fill (from source, fallback) "Mobile capture is our biggest gap" · consequence line "The teardown lands on Today · receipts attached." · CTA "Challenge this".
- **Coach mark (Today):** "Your first teardown is being built. This badge is where decisions find you." · dismiss "Got it".
- **Empty state (connection screen, nothing configured):** an instruction with a time estimate, not a blank box: "Nothing connected yet. Take the demo in 0 setup, or connect a real source in about 2 minutes. You can add sources anytime in Settings."
- **Seed-unavailable inline (founder gate not yet live):** "Demo data is not enabled yet · connect a real source to continue."

## 10. Acceptance criteria

- [ ] `/onboarding` renders the Obsidian five-screen flow under `[data-obsidian]` on `--canvas`, dark-only, no shell, no lucide.
- [ ] Arrival shows the idle butterfly flying in (four wing beats, land, settle), the Newsreader 34px line, and one ember Start; nothing else.
- [ ] Track pick shows exactly three quiet cards; picking one seeds via `seedWorkspaceForTrack` and advances; capability is never described as limited by the pick.
- [ ] Connection screen shows a Connect shelf where every option carries a time estimate, plus an equal-weight "Use demo data instead · 0 setup" action.
- [ ] The demo action requires the seed live; when the seed is not enabled it shows the seed-unavailable line and does not trap the user.
- [ ] Point the Critic pre-fills a real belief, and "Challenge this" runs `runCriticReview`, then `completeOnboarding`, then `markOnboarded`, then navigates to `/today`.
- [ ] On landing, exactly one glacier coach mark anchors to the Today Call badge; "Got it" dismisses it and it never returns (localStorage flag).
- [ ] There is no tour and no second coach mark. Nothing is explained until its trigger exists.
- [ ] Every screen has at most one ember element (the forward CTA). The grayscale screenshot still reads.
- [ ] `prefers-reduced-motion` renders the butterfly static and zeroes all animation; the flow still completes.
- [ ] The flow never traps: any connect/seed/Critic failure still allows the demo path and finishing.

## 11. Prototype-parity checklist (the last gate, tailored)

Onboarding is off-shell, so the rail/top-bar points apply only to the landing on Today. Walk these side by side at 1440px with the frozen prototype and screenshots in the ship report:

1. **Rail (on Today landing):** 236px, mono index 01 to 05, the ONE Today badge present, the working shimmer line live (a teardown is running).
2. **Surface chrome:** onboarding is centered full-viewport, 600px framed screens, Arrival unframed; each screen enters with `cadRise` 260ms.
3. **Type:** Arrival hero Newsreader 34px; screen headings 28px; UI 13px/1.55; mono step eyebrow and time estimates 9 to 9.5px caps with middots.
4. **Color:** zero hexes outside the tokens; ember only on the single forward CTA per screen; the coach mark glacier hairline + arrow only.
5. **Motion:** butterfly `cadArrive` fly-in then `cadFlutter` settle; hover 140ms one-step lift; reduced-motion kills all.
6. **Behavior:** Start to track to connect to critic to Today; demo path equal weight; coach mark shows once and dismisses forever; the just-landed session flag is one-shot.
7. **Copy:** plain-words buttons (Start, Challenge this, Got it), consequence helpers, mono-caps metadata, no em dashes, no exclamation marks.
8. **Grayscale** screenshot still reads; restraint budget audited (one ember, no aurora, no shimmer on onboarding screens; the shimmer lives only in the rail on landing).

## 12. Verification + gates

- **tsc:** `bunx tsc --noEmit` = 0.
- **Tests:** `bun test src/components/onboarding/ObsidianOnboarding.test.tsx src/components/onboarding/TodayCoachMark.test.tsx` green. Cover: phase transitions, the demo-gated action, finish calls `completeOnboarding` + `markOnboarded` + navigate, coach mark renders once and never after dismiss.
- **Build:** `bun run build` is RED in lane worktrees on the pre-existing node20-vs-ESM `lovable-tagger` error (hub §11) · treat `tsc` + `bun test` as the real gates in a worktree; run the full build on the primary checkout before publish. Do not chase the lovable-tagger error.
- **Grayscale test:** screenshot each screen with color removed · meaning must survive · if it lives in color alone, add the word.
- **Restraint budget:** one ember CTA per screen, no aurora, no shimmer on onboarding screens, status color only on real status.
- **impeccable / humanized scan:** grep every new string for `-`, `-`, `!`, and the banned words (seamlessly, leverage, empower, robust, unlock, delve). Zero hits.
- **Manual checks:** with the seed live, walk Arrival to Today; confirm the butterfly choreography, the demo path, the pre-filled belief, the teardown appearing on Today, and the single coach mark dismissing forever. Repeat with `prefers-reduced-motion` on. Repeat with the seed disabled to confirm the never-trap path. Side-by-side prototype screenshots in the ship report.
- **On completion:** flip the OBS-14 dashboard row + all four dashboard sections, remove the Active-claims line, update this folder + `../obsidian-port-plan.md` + `docs/features/obsidian-port.md` + `docs/planning/archive/build-log.md` §4, in the same unit of work.

## 13. Risks · gotchas · founder-gates

- **Founder gate · the demo seed.** OBS-14 needs DEMO-SEED-RICH live (`ONBOARDING_SEED_ENABLED=1` / WM-S5). The current `seedWorkspace` (`src/lib/onboarding/seed-workspace.server.ts`) is the lightweight WM-S1 seed, gated and off by default. Build the flow fully; gate the demo action behind the env flag; surface the seed-unavailable line when it is off. Do not block shipping the rest of the flow on the seed. Tell the founder the flag must be set before the demo path is real.
- **Butterfly choreography accuracy.** The idle SVG has no per-wing animation nodes; the "four wing beats" is a CSS treatment on the whole mark (`cadFlutter` + `cadArrive`), not an edit to the asset. Never redraw or re-color the asset. If the flutter reads wrong, tune the CSS, not the SVG.
- **Never-trap law.** The gate (`onboarding-gate.ts`) already refuses to block on transient errors. Mirror that in the flow: every screen must be completable even if a source, the seed, or the Critic fails. The demo path plus Finish is always reachable.
- **Coach-mark anchoring depends on OBS-04.** The badge element must exist and be stable in the ported Today. Coordinate the anchor target (a stable selector or ref on the Call badge) with OBS-04; if OBS-04 is not merged, land the `TodayCoachMark` component and wire it in a follow-up commit rather than guessing the badge markup.
- **Name pre-gate double render.** Keep the `getProfile` read a single cached query (as the parchment flow did) so the pre-gate does not flash then swap. Hold on a calm canvas while the profile read is in flight.
- **Critic latency.** `runCriticReview` may take seconds. Show the acting element in a glacier pending state and navigate to Today optimistically once `completeOnboarding` succeeds; the teardown finishes arriving on Today (that is the whole point of the coach mark copy "is being built").

## 14. Interlinks

- **Hub:** [`README.md`](./README.md) · shared canon: restraint budget §4, tokens/type/motion §5, iconography §5.8, parity checklist §5.9, keyboard map §5.11, a11y §5.12.
- **Sibling OBS items (build-order neighbors):** [`OBS-10.md`](./OBS-10.md) (dependency · the rail and `/today` destination must be real), [`OBS-04.md`](./OBS-04.md) (lands here · hosts the coach mark · owns the badge anchor), [`OBS-13.md`](./OBS-13.md) (Settings · where connections and staff config live after onboarding), [`OBS-06.md`](./OBS-06.md) (Discover · where Challenge is first-class and the teardown surfaces).
- **Canon anchors:** `docs/design/archive/obsidian-v3.md` §11 (journey and capability discovery · golden path, contextual reveal, no tours) and §7 (the mark · arrival choreography · iconography); `design-reference/obsidian-extensions.md` §4 (onboarding, screen by screen · the five screens verbatim) and §8 (Connect shelf anatomy for the connection screen); `design-reference/obsidian-v3/tokens/*.css` (the exact token values); `design-reference/obsidian-v3/assets/butterfly-idle.svg` (the arrival mark, never redraw).
- **Doctrine / strategy:** [`../../conventions/engine-room-doctrine.md`](../../../../conventions/engine-room-doctrine.md) (calm front, reveal on demand), [`../../conventions/humanized-output.md`](../../../../conventions/humanized-output.md) (the string law), [`../../strategy/v11-guiding-star.md`](../../../../strategy/v11-guiding-star.md) (the decision-and-outcome layer).
