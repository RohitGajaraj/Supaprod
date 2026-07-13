# Tempo V5 — authenticated-app port + design rulings (session record, 2026-07-13)

> _Created 2026-07-13._ The comprehensive record of the Tempo V5 design work applied to the
> **authenticated app** (the public marketing landing `src/routes/index.tsx` was deliberately
> never touched). This is the "why + what" companion to the contract: [`/DESIGN-TEMPO.md`](../../../DESIGN-TEMPO.md)
> is the law; this file is the reasoning behind each ruling applied in this build, so tomorrow's
> work knows the intent, not just the result. When this disagrees with the contract, the contract wins.
>
> **Verified green throughout:** `bunx tsc --noEmit` 0 · `bun test` 4696 pass / 0 fail / 311 files ·
> Playwright live QA across Today / the loop stages / Brain / Engine Room / Settings / auth, both themes.

---

## 0. Framing — what this session did and why

The authenticated app still carried Loom-v4 / Obsidian-v3 chrome after the Tempo contract was
adopted. This session ported it to Tempo and made a set of standing design rulings while doing so.
The goal (founder): a **launch-ready, zero-learning-curve, lifecycle-first** product surface where
the USPs are on-screen, the craft is enterprise-grade, and nothing is decorative. Full autonomy on
design was granted; prior conventions could be overridden **with reasoning** — that reasoning is
recorded below.

---

## 1. Information architecture — "The Cadence Loop"

**What.** `src/lib/nav-model.ts` defines **10 destinations in 3 narrative zones**, read top to
bottom as a story:

- **HOME** — Today.
- **THE LOOP** (`signal → shipped`) — the product-management lifecycle as numbered stages:
  **01 Discover · 02 Decide · 03 Plan · 04 Design · 05 Build · 06 Ship · 07 Learn**.
- **INTELLIGENCE** (`always on`) — **Brain** (`/brain`) and the **Engine Room** (spend, quality,
  safety, record).

Digit keys **1–9** jump to the first nine; the Engine Room (10th) uses **`g`** (no single digit
left). `navKeyHint()` is the single source for these hints (palette + command surfaces derive from it).

**Why.**
- **Lifecycle-first, not feature-first.** A first-time user should see the product's actual shape
  (how work flows from a signal to a shipped outcome) in the nav itself — the IA teaches the model
  of the product with zero onboarding.
- **Decide is a first-class stage (02), not a tab.** The judgment gate ("keep it or kill it") is the
  human's irreducible job; it earns its own destination (`_authenticated.decide.tsx` renders the
  OpportunityQueue). The old Discover "Queue" tab was removed so there is exactly one home for the call.
- **Memory → Brain.** "Brain" names the compounding intelligence layer in a person's words;
  "Memory" read as a storage mechanism. Renamed everywhere (route `/brain`, crumbs, meta, palette).
- **Ship + Learn are real routes** (`_authenticated.ship.tsx`, `_authenticated.learn.tsx`), not
  redirects — the loop must actually close on-screen, or the "loop" is a claim, not a surface.
- **No loop-continuity line down the rail.** A connecting thread implied gating/sequence (you can't
  do 04 before 03), which is false — you can enter the loop anywhere. Numbered nodes only.
- Unmarked rows (HOME, INTELLIGENCE) carry **no empty number slot** — alignment without a phantom index.

---

## 2. Color — de-purpling and the ember/blue grammar

**What.**
- **Ember is the only brand accent** (`--ember: oklch(0.65 0.18 50)`, the `#FF6B2C` family). It means
  **needs-human**: gates, calls, the one primary CTA per view, brand moments. At most one ember
  primary CTA per screen.
- **Rich blue is the machine voice** (`--action-blue: oklch(0.47 0.11 245)`, de-indigoed from hue
  ~265 → **245**; `--focus-blue: oklch(0.55 0.12 245)`): links, live/running state, focus ring, the
  agent's own activity. Purple/indigo is retired from every machine treatment (it survives ONLY as a
  categorical hue for knowledge-graph node kinds, never as an interaction color).
- `::selection` and `.input:focus` were neutralized / blued (they were ember before — see Why).
- An ambient **ember + blue canvas wash** sits on the app atmosphere layer for depth without chroma
  on content.

**Why.**
- **A legible human/machine grammar.** If ember always means "a human is needed here" and blue always
  means "the machine is acting/linking," the user learns the whole product's state language from two
  colors. This is the single most load-bearing color decision in the app.
- **Ember is precious.** Text selection and input-focus are constant, ambient events; painting them
  ember cheapened the accent and diluted the "needs-human" signal. Neutral selection + blue focus
  keep ember rare and therefore meaningful.
- **De-indigo** because indigo read as a second brand color competing with ember; hue-245 is
  unmistakably "machine blue," not "brand."
- ≥90% of any screen stays neutral (the restraint budget); chromatic color appears only with meaning.

---

## 3. Materials — glass, calmly

**What.** A reusable **`.glass-panel`** utility (translucent fill + backdrop blur + saturate + hairline)
in `styles.css`. Applied to the **sidebar rail** and the **sticky TopBar**; used sparingly elsewhere.

**Why.** Glass reads as premium and gives the ambient wash somewhere to show through, but it only
reads over an atmosphere or on overlapping layers — on a flat content card it just muddies contrast.
So glass is a **chrome** material (rail, top bar, overlays), not a content-card default. Elevation is
still a preset from the materials tokens, not an ad-hoc shadow.

---

## 4. Typography — Geist Pixel as the brand face

**What.** Three faces, three jobs (contract §3): Geist Sans (UI), Geist Mono (data/refs/code),
**Geist Pixel (brand display)**. This session uses Pixel **prominently and deliberately** for
metrics, page titles, and agent names (now in ~24 surfaces). `PageHeader` sets its title in Pixel
with an ember accent word; headline metric numerals (e.g. the Engine Room figure, the Decide ICE
score) are Pixel; agent **names** render in Pixel at ~14px (via `AgentBadge`'s `pixelName`).

**Why.** Pixel is the one place the product gets to feel *branded* rather than generically clean.
Reserving it for the moments that matter — the number a buyer reads, the stage title, the agent's
name — makes those moments feel authored and distinct without adding color. Variations in size are
allowed; the rule is that Pixel appears where identity should be felt, at least once per screen,
never as body text.

---

## 5. Iconography & identity — monotone sources, liquid-glass agents

**What.**
- **Source/provider logos are monotone** (`ProviderLogo.tsx` renders `fill="currentColor"`), with a
  first-letter monogram fallback. A brand-color version was built and then **reverted**.
- **Agent icons are liquid-glass "gems"** (`AgentMark.tsx`): gradient depth, a catch-light edge, a
  soft shadow — a small, premium, recognizable object per agent.

**Why (the monotone reversion, recorded so it is not re-litigated).** Three reasons the brand-colored
provider logos were reverted to monotone: **(1) IP** — reproducing third-party brand marks in their
trademarked colors across our UI is a licensing/branding hazard; a monotone glyph is a neutral
reference, not a reproduction. **(2) Cognitive load** — a row of full-color vendor logos pulls the eye
to the vendors, not to the user's own work; monotone keeps the source a quiet attribute. **(3)
Friction** — matching, maintaining, and theming dozens of exact brand palettes across dark/light is
ongoing cost for negative value. Agents, by contrast, are *ours*, so they earn crafted, gem-like
identity.

---

## 6. Chrome — TopBar and PageHeader on every surface

**What.**
- **`TopBar`** (`components/cadence/TopBar.tsx`): breadcrumb + **ThemeToggle** (light/dark/system) +
  **AskButton** (fires `cadence:open-ask`) + **DayWeather** (day/date/live clock + keyless IP-based
  weather, no geolocation prompt) + LiveTicker. Now on **every** surface, including Discover and the
  Engine Room (both were previously bare). It is a **glass** surface.
- **`PageHeader`** (`components/cadence/PageHeader.tsx`): mono eyebrow + **Pixel title with an ember
  accent** + an always-visible **USP capsule**, on all 8 stage surfaces, with consistent stage numbers
  01–07.

**Why.**
- **Consistency is trust.** A user should never land on a surface that looks like a different app;
  uniform chrome (same breadcrumb, same theme/ask/weather cluster) makes the whole product feel like
  one thing. Discover and the Engine Room being bare broke that.
- **USPs on-screen.** The PageHeader USP capsule keeps the reason-this-surface-matters visible at all
  times — the launch bar was "the value is legible without a tour."
- **Ask must be discoverable**, not hidden behind a shortcut — hence a visible AskButton.
- **Weather without a prompt**: an interruption permission dialog on load is hostile; a keyless
  IP-based fallback shows the widget immediately.

---

## 7. Homelessness closure & component hygiene

**What.**
- Both orphaned panels were given a real home: **CalendarPanel → Today's Desk** (`DeskRail`
  `DeskCalendar`), **ProductAnalyticsPanel → OpportunityDetailSheet**.
- The **Engine Room `RoomRail` is an accordion** — only the active room expands its sub-views; others
  collapse to their label.
- The MissionChain / Record dropdown was moved to a **themed Radix `Select`**.

**Why.** A launch-ready app has no dead components and no orphaned surfaces — everything the code
builds must be reachable and homed where it belongs in the lifecycle. The accordion keeps the Engine
Room (a deep, machine-dense area) calm: one room's detail at a time, per the engine-room doctrine
(calm front, deep engine).

---

## 8. The audit trace-tag chip — every id is a door

**What.** The static `PREFIX·XXXXXX` mono chip became the clickable **`AuditTag`** — click opens the
entity's verifiable lineage; a `copyable` variant adds copy-the-full-id in detail views. Rolled out
across every entity surface. Full pattern: [`patterns/audit-trace-tag.md`](../patterns/audit-trace-tag.md).
Full feature (resolver / lineage / mission-chain): [`docs/features/audit-id-lineage.md`](../../../docs/features/audit-id-lineage.md).

**Why.** Founder ruling 2026-07-13: "everything should have a traceable audit id generated out of this
platform." Trust is verifiable provenance; an id that only *looks* auditable is a broken promise.
Making the existing chip a control (rather than adding new chrome) delivered universal traceability
while keeping the surface calm. It renders as `<span role="button">` specifically so it can nest
inside clickable rows without invalid DOM nesting — see the pattern doc.

---

## 9. Retired-remnant purge & copy law (standing guards)

**What.** App-wide, outside the off-limits landing: **0** `--font-serif`, **0** editorial 420/430
font weights, **0** light-theme neutral utility classes (`bg-white` / `text-slate-*` / `bg-indigo-*`).
UI copy carries **no em/en dashes** and no AI-cliché phrasing (humanized-output convention).

**Why.** A design system is only real if the old system is actually gone; stray serif/editorial/
light-neutral tokens are how a "ported" app silently reverts. These are enforced as grep-able guards
so a regression is caught, not shipped. The dash/voice rules keep generated and static copy free of
AI fingerprints.

---

## 10. How to extend (for tomorrow)

- **New surface?** Wrap it in the standard chrome (TopBar breadcrumb + PageHeader with a USP capsule),
  obey the color grammar (ember = needs-human, blue = machine), use Pixel for its title/metric, and
  test both themes before shipping.
- **New entity kind?** Add one row to `AUDIT_KINDS` (`src/lib/audit-id.ts`) and its chip becomes a
  live audit tag everywhere automatically.
- **New pattern?** Add a doc under [`patterns/`](../patterns/) marked `Extension` with its sources,
  composing core tokens — never redefining them (contract §9).
- **Tempted by a new color?** Don't. Neutral by default; ember or blue only with the meaning above;
  categorical hues only for graph node kinds.

## Related

- Contract: [`/DESIGN-TEMPO.md`](../../../DESIGN-TEMPO.md) · portable brief: [`../TEMPO.md`](../TEMPO.md)
- Pattern library: [`../patterns/`](../patterns/) (new: `audit-trace-tag.md`)
- Feature: [`docs/features/audit-id-lineage.md`](../../../docs/features/audit-id-lineage.md)
- Session handoff (full DONE list): [`/UI-REVAMP-HANDOFF.md`](../../../UI-REVAMP-HANDOFF.md)


---

## Addendum — 2026-07-14 UX pass (founder feedback)

A second wave of founder-directed polish. New standing rulings, with the why:

### 11. Button color grammar (one rule, platform-wide)
A button's color states its role. Codified in `src/components/ui/button.tsx` (new `accent` variant):
- **accent (ember)** = the SINGLE primary "needs-human" CTA per view. Prefer `variant="accent"` over ad-hoc inline ember so the brand action is identical everywhere.
- **default (neutral high-contrast invert)** = ordinary confirmations (Save, Apply, Add).
- **secondary / tertiary / ghost / outline** = supporting, low-emphasis.
- **link (blue)** = navigation / the machine's voice.
- **destructive (red) / warning (amber)** = risk + caution.
- At most one accent button per screen; everything else stays neutral. _Why:_ the founder asked "what is the logic?" — inconsistency came from primary CTAs being ad-hoc inline while everything else used the neutral variant. A first-class accent variant makes the grammar enforceable.

### 12. Number tone — blue is data, ember is human
All metric numerals render in **Geist Pixel** via the reusable `PixelStat` (`src/components/cadence/PixelStat.tsx`): tabular figures, tone + optional glow, sized to sit WITH their label (never an oversized floating number), center-aligned. **Blue is the number/attention tone** (the landing "Receipt" data blue) — numbers are data/machine output. **Ember stays for needs-human/CTA + the single hero brand moment.** _Why:_ founder ruling that numbers should read consistently and use the blue data tone; ember was over-applied and numerals were misaligned/oversized.

### 13. Account avatar = a theme-aligned orb library
`src/components/cadence/Avatar.tsx`: a library of orb templates built from theme tokens **muted into the surface** (`color-mix` with `--card`), so each is calm and on-theme in BOTH light and dark — never a loud saturated disc. A default is assigned per account (seed hash); the user picks their own in **Settings → You** (`useAvatarChoice`, device-local, live-syncing). _Why:_ founder rejected both the too-subtle single style and the too-loud cosmic gradients; wanted per-user distinctness that still respects the calm theme, plus user control.

### 14. TopBar weather chip
`DayWeather`: **weather icon + status + temperature + location**, no date/time (the OS has those). Colored, condition-tinted (overcast = calm slate-blue, not flat gray), gently animated (`.weather-live` breath). Temperature unit follows the **country** (Fahrenheit for the US + verified holdouts, Celsius elsewhere).

### 15. Ask panel — platform-wide + liquid-glass
`AskPanel`: framed **"Ask Cadence · Anything in the platform · reads {screen}"** (the whole platform, with the current screen as a secondary cue), an ember sparkle + soft ember/blue header wash, and a liquid-glass composer with an ember send button + `.ask-composer:focus-within` glow. _Why:_ founder said Ask is for the whole platform (not just the screen) and the old input read like a bland placeholder.

### 16. Intelligence layer names + nav shortcuts
"Memory" → **Brain**; "Engine Room" → **Pulse** (a single word from the same living-system family as Brain — the Brain is what the product knows, the Pulse is how it lives; route `/engine-room` + doctrine unchanged). The rail shortcut now **equals the visible number**: Today 0, the loop 1-7, Brain 8, Pulse 9, Settings s, Admin a — displayed hint and key binding both derive from `navKeyHint`. Zone captions simplified to clean section labels.

### 17. Ambient aurora (Today hero)
A calm, slow ambient aurora (ember/maroon when a call needs you, moss/gold at all-clear) that drifts like air; no left-to-right shimmer sweep, no emblem (both removed as "cheap"). Tuned to gel in light mode (opacity pulled back so it tints, not stains). Liquid-glass embossed card retained.

### Icon-only affordances
"Copy link" is icon-only in the share clusters (teardown, decision receipt); Share/Unshare stay labeled (state toggles, not one-shot actions).

### Still open (this pass)
- Migrate remaining ad-hoc ember buttons to `variant="accent"` (grammar is defined; rollout is ongoing).
- Broader liquid-glass / 3D-embossed rollout across more content cards.
- Extend the `PixelStat` metric tone to every remaining numeral surface.
