# Round 3 authoring brief — the shared law for screens 1b, 3b, 10–19

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Written 2026-07-23 (Fable session, founder-approved plan). Every Round-3 mockup is authored against THIS brief plus its per-file spec. Where this brief and an older mockup disagree, this brief wins (it encodes the founder rulings the old files predate).

## Read order for an authoring agent

1. This brief, fully.
2. `_shell-template.html` — the 5-region DOM contract and class vocabulary (adapt its DOM; note its TopBar is STALE, see §3).
3. `_shared.css` — copy the ENTIRE file verbatim into your `<style>` block, then add §2's override block, then your screen styles below an `/* END SHARED */` marker. Never modify shared rules in place.
4. `screen-9-threads-home.html` — the TopBar v2 pattern (§3) and the non-room shell precedent (no Spine/Thread on non-stage surfaces).
5. `design-language-spec.md` §2 (voices), §6 (primitives), §9 (CanvasFace contract) + Addenda 1.1/1.2/1.3.
6. Your per-file spec (in your work order / prompt).
7. For taste: `../../../design-reference/tempo-v5/research/_foundations.md` and the component spec matching what you're drawing (card.md, table.md, menu.md, empty-state.md, status-dot.md, …); `../research/` teardowns as referenced by your spec.

## §1 The ten standing rulings (founder, 2026-07-23 — binding)

1. **One ember locus per frame** — the gate if one exists, else the single primary CTA. Chips are slate. Everything else ink ramps. If your frame shows two ember elements, one is wrong.
2. **Spine is a room instrument** — only on `/m` stage frames; drop it on Brain/Threads/Library/Settings/Engine-room frames (screen-9 precedent). In deep-work states it collapses to a slim strip (§6).
3. **Focus model** — when the user commits to one area, non-essential panes collapse (Thread → 48px rail with unread tick; Working strip persists). Deep-work frames show the collapsed variant.
4. **Lineage is first-class** — every entity chip (SIG/BET/DEC/SPEC/REL/LRN/PROTO id) is a door, annotated with where it leads; every card names its agent; clusters explain themselves ("clustered by Watch from 22 signals — open them").
5. **Agentic capability shown, not told** — named agents visibly at work (working strip, lanes, receipts). One full-hue machine locus max; the rest dim.
6. **Anticipatory design** — the surface pre-answers the next question; NextLine tees up the next step pre-filled; nothing dead-ends.
7. **Fonts** — Geist Sans (UI, weight 500, sentence case), Geist Mono (ids/timestamps/counts/verbs/code, tabular), Geist Pixel = max ONE brand moment per file (some files: zero).
8. **Cost-quiet** — zero money/credits/tokens anywhere except screen-17's Plan & Usage pane. Driver/cost lines live behind CLOSED kebabs.
9. **Card law** — plain ink surface, hairline border, the one internal grid: chip row (label left / mono time right) → body → optional evidence chips → action row. NO edge strips. Source recognition = **Option A chip-only** (founder-closed 2026-07-23). Memory cards additionally wear the Vellum treatment (hairline + `Memory` chip) — always, orthogonal to A.
10. **Honesty** — believable timestamps from §4's timeline; no invented metrics; capability edges rendered as honest GAP states ("drafts only; nothing sends itself"), never fake controls. Grayscale test: attribution must survive with color off.

## §2 The ADDENDA OVERRIDES block (copy verbatim after the shared block)

The embedded `_shared.css` predates the founder color locks (it still carries gold memory + ember chips). Every Round-3 file adds this immediately after it (values verified against `src/styles/ink.css`, the app's live tokens):

```css
/* ============================================================
   ADDENDA OVERRIDES (founder-locked; Round 3 baseline)
   Memory = Vellum. Chips = slate silver. Ember only at the locus.
   ============================================================ */
:root, [data-theme="dark"] {
  --voice-memory: #d3c39c;
  --voice-memory-dim: #8f8060;
  --voice-memory-border: rgba(211, 195, 156, 0.32);
  --voice-memory-soft: #211c10;
  --voice-memory-faint: #16130b;
  --chip-fg: #b9c4d4;
  --chip-dim: #79828f;
  --chip-border: rgba(185, 196, 212, 0.28);
  --chip-soft: #171b21;
  --chip-faint: #101317;
}
[data-theme="light"] {
  --voice-memory: #7d6c42;
  --voice-memory-dim: #a8996f;
  --voice-memory-border: rgba(125, 108, 66, 0.35);
  --voice-memory-soft: #f2eddf;
  --voice-memory-faint: #f8f5ec;
  --chip-fg: #3f4c60;
  --chip-dim: #77839a;
  --chip-border: rgba(63, 76, 96, 0.28);
  --chip-soft: #edf0f4;
  --chip-faint: #f5f7fa;
}
/* Chips wear slate (Addendum 1.3). Verify these selectors against the
   shared block you embedded and extend if your screen adds chip kinds. */
.sp-gate-chip, .sp-tray-count, .sp-artifact-chip, .sp-label-chip, .sp-source-chip {
  color: var(--chip-fg);
  border-color: var(--chip-border);
  background: var(--chip-soft);
}
/* Ember KEEPS: .sp-btn-accent, spine .is-gate node treatment, spine caps,
   focus rings, the WarmSlot single action. Nothing else. */
```

Gold `#e8b44c` may appear in exactly one place: the brand mark's center bead in the TopBar SVG.

## §3 TopBar v2 contract (supersedes `_shell-template.html`'s TopBar)

Use screen-9's TopBar with the avatar upgraded to a button (the account-menu anchor). Canonical markup:

```html
<header class="sp-topbar">
  <div class="sp-topbar-brand"><!-- 7-dot SVG mark, gold center bead --><span class="sp-brand-name">Supaprod</span></div>
  <div class="sp-topbar-divider"></div>
  <button class="sp-product-switcher">Helio Labs / Relay <span style="color:var(--ink-faint);font-size:9px">&#9662;</span></button>
  <nav class="sp-topbar-nav">
    <a class="sp-nav-item" href="#">Mission Control</a>
    <a class="sp-nav-item" href="#">Approvals <span class="sp-tray-count">N</span></a>
    <a class="sp-nav-item" href="#">Brain</a>
    <a class="sp-nav-item" href="#">Settings</a>
  </nav>
  <div class="sp-topbar-right">
    <button class="sp-btn">Ask <span class="sp-kbd">A</span></button>
    <button class="sp-icon-btn" title="Past threads · G T">&#8635;</button>
    <button class="sp-icon-btn" title="Shortcuts">?</button>
    <button class="sp-avatar" title="Account">MO</button>
  </div>
</header>
```

Rules: nav is exactly these 4 doors; the Approvals count is the ONE gate count (same number as every other rendering of it in your frame); mark `.is-active` on the door your surface lives under; the avatar menu renders OPEN only in screen-15 Frame B (closed everywhere else). Admin console and Sign out live inside the avatar menu, never in nav.

## §4 The master timeline (Helio Labs fiction — stay inside it)

Products: **Relay** (support tooling, mid-loop), **Atlas** (webhooks, shipping today), **Comet** (fresh/empty), **Beacon** (imported). Agents (mono chips): Chief of Staff, Watch, Listen, Prioritize, Challenge, Draft, Plan, Design, Engineer, Review, Announce, Measure, Research.

Canon (existing screens): DEC-19 "deprioritize macros" (May) · Wed 11:02a SPEC-47 approved, 11:33a Engineer mid-build · Thu 2:41p PROTO-7 design gate · Fri 4:12p SPEC-52 saved replies shipped (REL-19) · Sun rest/tray/threads · **Mon Jul 20**: 6:00a Watchtower sweep, 37 signals · 8:30a briefing (Chief of Staff + Memory) · 9:00a Measure's weekend read (41% adoption vs 40%/14d contract) · 9:05a SPEC-52 attestation gate · 9:12a recorded: LRN-13 written, DEC-19 challenged, return arrow fires · 9:41a Watch's 4 theme clusters done · 10:05a the case for BET-35 ready (keep/kill gate) · 11:40a Atlas REL-20 staged, CI green · 11:52a promote gate; Announce drafting launch kit · 12:15p Atlas 1.9 live 10→100% · ~12:30p Brain shows the morning's record.

New ids (do not collide with SPEC-47/49/52/55/58/61, BET-12/29/31/33/34, DEC-19/22/44, REL-18/19, PROTO-7/12, LRN-12, SIG-07/88/142/208): **BET-35** auto-triage billing (ICE 8.4, Critic Ship 82%) · **BET-36** CSAT pulse (6.9, Revise) · **BET-37** Slack-connect (5.2, Kill, cites DEC-44) · **SPEC-62** · **REL-20** Atlas webhook retries (commit 4f2c9ab, 400 replays 0 dropped) · **LRN-13** "shared replies beat personal 7:1" · **DEC-45** "saved replies stay workspace-scoped" (born 9:12a) · **LOOP-2** nightly sweep / **LOOP-5** Monday digest · **LK-3** Atlas launch kit · **SIG-214** ("Charged twice after the plan switch", zendesk, 7:02a) / **SIG-221** ("Webhook payload missing plan_id since 1.8", github, 6:48a) / **SIG-230** ("Acme wants exportable audit trails", sales notes, Fri 4:51p).

## §5 File anatomy convention

Top-of-file HTML comment block:

```
SCREEN <n>: <name>
THE MOMENT: <one sentence — when in the product's life this frame happens>
STATE SHOWN: <rest / active / empty / focus — per frame>
FUNCTIONAL CONTRACT:
  Primary question: <what the user came to answer>
  Primary action(s): <the one-two things they do here>
  Lineage in/out: <which chips door where, one step up + one step down>
  Agents & attribution: <who acts, how it's shown>
  Focus/collapse: <what collapses when, if applicable>
  Empty/loading/blocked: <the honest states>
WHAT THE FOUNDER SHOULD EVALUATE: <numbered, 3-6 items>
CHARTER REQUIREMENTS DEMONSTRATED: <ids from problem-statement §requirements where known>
RESTRAINT NOTE: <what was deliberately NOT added>
```

Frames: fixed 1440×900 `.sp-frame`, dark default, `data-theme="light"` flip must work. Multi-frame files use screen-5's labeled-frames pattern (`jf-frame-label`). Believable content only — no lorem, no "TODO".

## §6 Focus-collapse pattern (new in Round 3 — screen-3b defines it, others reuse)

Deep-work state: `.sp-main` column A narrows to a 48px vertical rail (`.sp-thread-rail`): top = back-to-thread glyph with unread count tick, bottom = the day's timestamps as dots. Spine collapses to `.sp-spine-strip.is-slim` (18px: seven dots + the active node's label only). Canvas takes the freed width. The Working strip NEVER collapses. Escape/click restores. Author the collapsed state as its own frame or a clearly-annotated inset.

## §6b ROUND-3.1 QUALITY ADDENDUM (founder directive, 2026-07-24 — overrides anything softer above)

The first Round-3 outputs were judged **below the bar**: overly simplistic, visually inconsistent, lacking the depth and craftsmanship of a premium enterprise product. The corrective law:

1. **The benchmark is the EXISTING screens, studied deeply — not the template alone.** Before writing a line, read `screen-2-room-rest.html`, `screen-3-room-building.html`, and `screen-4-room-gated-tray.html` END TO END and extract their concrete craft: the spacing rhythm, information density per panel, chip anatomy, receipt-line texture, annotation voice, how much believable content fills a frame (they run 60-75KB for a reason), how restraint and density coexist. Your file must sit beside them WITHOUT looking simpler. Match that standard first, then exceed it. Never design below it.
2. **Typography serves the product, not a mandate.** Use the type system exactly as the existing mockups use it (`_shared.css`: Geist Sans UI at the established sizes/weights, Geist Mono for ids/times/counts/code). **Geist Pixel is now OPTIONAL, default ZERO uses** — include a Pixel moment only where it genuinely elevates (a first-run hero, an empty-state brand beat); when in doubt, none. Consistency, readability, hierarchy over font novelty.
3. **Screens must communicate BEHAVIOR, not just layout.** Every file adds a **behavior rail**: a compact labeled strip (below the frames, card-spec style) showing the screen's core components in their key states — hover, focus-visible, active/pressed, disabled, loading skeleton, empty, error/validation, success — plus inline annotations in the frames for keyboard paths, tooltips, progressive disclosure, drag where relevant, and motion guidance (duration/easing per the motion budget). Primary frames stay believable and realistic; the rail carries the state grammar. What exists in the frame must answer: primary action? secondary? no data? loading? failure? recovery? what stays quiet?
4. **The craft floor:** intentional spacing rhythm and alignment on the token grid; correct optical proportions; hairline borders and elevation per the existing screens; realistic content everywhere (no filler that "fills space"); AA contrast both themes; visible focus treatment on every interactive element; the file reads as the definitive UX spec an engineer implements without asking questions.
5. **The company it keeps:** the finished file should feel at home beside Linear, Notion, Vercel, Stripe, Figma, Arc, Perplexity — the same attention to detail, interaction quality, and product thinking. Calm, confident, premium.
6. **HTML quality:** clean, modular, readable, well-structured — the markup itself is a reference implementation (semantic regions, consistent class reuse from `_shared.css`, comments only where they carry the functional contract or an annotation).

## §6c COLOR ALIVENESS · FOCUS · CONSEQUENCE · ASK (founder review of the first Learn face, 2026-07-24 — binding)

1. **Restraint ≠ monochrome.** The ember law (ONE human-move locus) stands. But the other voices must LIVE: machine blue wherever agents genuinely work (working spine node, pulse lines, live verbs, working-strip activity), Vellum wherever memory speaks, verdict green/red on real verdicts, slate chips as texture, blue mono numerals on real counts. A frame holding real state should carry 3-4 quiet color presences. If a frame renders near-grayscale, it is over-drained — that is a DEFECT (blandness), not restraint. Use elevation/surface contrast (chrome vs panel vs raised) for depth alongside hue.
2. **Density with focus (the overwhelm cure).** The eye lands in three beats: (1) the primary story, (2) the one action, (3) supporting evidence. Lead with the story — for Learn, the outcome-vs-contract metrics treatment (founder-praised: "something similar to this is what we need") is the named lead pattern. Progressive-disclose the plumbing: receipt lists, secondary evidence, raw trails sit behind closed expanders ("Show the receipts") rendered closed. A frame may be RICH but never presents everything at one visual priority.
3. **Every clickable names its consequence.** Any interactive element (button, chip, link — e.g. "Connect analytics") carries: its DOOR (where it goes: `/settings?section=connections`), its consequence line ("the next sweep reads it"), and its states in the behavior rail. No affordance without a designed destination; where the destination does not exist in code yet, the annotation states the honest GAP. This extends the lineage law from ids to EVERYTHING interactive.
4. **Ask: docked where speaking is primary, summoned everywhere else (founder-refined 2026-07-24 — supersedes the earlier "raised composer" wording).** (a) The composer renders DOCKED only on surfaces where talking to the product is the primary action: the room's stage faces, the rest room, first-run, and the Brain (ask-the-record). The dock is QUIET — single-line height, hairline surface, small always-visible ⌘J chip, inviting placeholder, contextual journey chips. No elevation theatrics, no glow, no stolen canvas height. (b) Everywhere else (Settings, Library, Engine room, Threads, and deep-work focus states) there is NO docked composer: Ask lives as the constant TopBar button with its visible ⌘J hint, and ⌘J summons a transient overlay (drops from the TopBar, Escape dismisses) — the Linear/Raycast summon pattern; annotate the summon behavior once per non-room file. (c) Discoverability comes from constancy (same TopBar spot every screen + the tour teaches it once), not from size. Presence must be earned by primary use — ask per surface "would users speak here?", and default to the summon.

## §6d BRAND & MATERIAL TRUTH (founder review of screen-15, 2026-07-24 — binding; NEVER invent brand assets)

1. **The mark is the seven-petal epitrochoid — NOT a dot circle, NOT anything improvised.** Verbatim SVG (viewBox `0 0 100 100`; silver-gradient stroke + ember radial core, from `src/components/supaprod/SupaprodMark.tsx`):
```html
<svg viewBox="0 0 100 100" width="20" height="20" fill="none" style="overflow:visible" aria-label="Supaprod">
  <defs>
    <linearGradient id="spk-pet" x1="15%" y1="0%" x2="85%" y2="100%">
      <stop offset="0%" stop-color="#f2f0ed"/><stop offset="52%" stop-color="#7d786f"/><stop offset="100%" stop-color="#f2f0ed"/>
    </linearGradient>
    <radialGradient id="spk-core" cx="42%" cy="36%" r="72%">
      <stop offset="0%" stop-color="#ffb894"/><stop offset="56%" stop-color="#ff6b2c"/><stop offset="100%" stop-color="#c24d1c"/>
    </radialGradient>
  </defs>
  <path d="M90.0 50.0 L89.5 47.6 L88.0 45.6 L85.6 43.9 L82.6 43.0 L79.0 42.9 L75.1 43.8 L71.2 45.6 L67.6 48.2 L64.5 51.7 L62.0 55.8 L60.4 60.3 L59.6 64.9 L59.8 69.4 L60.8 73.5 L62.5 77.1 L64.8 79.8 L67.5 81.6 L70.2 82.5 L72.8 82.3 L74.9 81.3 L76.5 79.4 L77.2 76.9 L77.0 74.1 L75.8 71.1 L73.6 68.2 L70.5 65.7 L66.7 63.8 L62.4 62.7 L57.7 62.4 L53.0 63.0 L48.4 64.5 L44.4 66.8 L40.9 69.7 L38.3 73.1 L36.7 76.7 L36.0 80.2 L36.2 83.4 L37.2 86.1 L38.9 88.0 L41.1 89.0 L43.5 89.0 L45.9 88.0 L48.0 86.1 L49.6 83.3 L50.4 79.8 L50.5 75.9 L49.6 71.7 L47.8 67.6 L45.1 63.7 L41.7 60.4 L37.7 57.8 L33.4 56.1 L28.9 55.2 L24.7 55.3 L20.8 56.2 L17.6 57.8 L15.3 60.0 L13.8 62.5 L13.4 65.0 L14.0 67.4 L15.4 69.3 L17.7 70.5 L20.5 70.9 L23.7 70.4 L27.0 68.9 L30.1 66.5 L32.8 63.2 L34.9 59.2 L36.2 54.7 L36.7 50.0 L36.2 45.3 L34.9 40.8 L32.8 36.8 L30.1 33.5 L27.0 31.1 L23.7 29.6 L20.5 29.1 L17.7 29.5 L15.4 30.7 L14.0 32.6 L13.4 35.0 L13.8 37.5 L15.3 40.0 L17.6 42.2 L20.8 43.8 L24.7 44.7 L28.9 44.8 L33.4 43.9 L37.7 42.2 L41.7 39.6 L45.1 36.3 L47.8 32.4 L49.6 28.3 L50.5 24.1 L50.4 20.2 L49.6 16.7 L48.0 13.9 L45.9 12.0 L43.5 11.0 L41.1 11.0 L38.9 12.0 L37.2 13.9 L36.2 16.6 L36.0 19.8 L36.7 23.3 L38.3 26.9 L40.9 30.3 L44.4 33.2 L48.4 35.5 L53.0 37.0 L57.7 37.6 L62.4 37.3 L66.7 36.2 L70.5 34.3 L73.6 31.8 L75.8 28.9 L77.0 25.9 L77.2 23.1 L76.5 20.6 L74.9 18.7 L72.8 17.7 L70.2 17.5 L67.5 18.4 L64.8 20.2 L62.5 22.9 L60.8 26.5 L59.8 30.6 L59.6 35.1 L60.4 39.7 L62.0 44.2 L64.5 48.3 L67.6 51.8 L71.2 54.4 L75.1 56.2 L79.0 57.1 L82.6 57.0 L85.6 56.1 L88.0 54.4 L89.5 52.4 L90.0 50.0 Z" stroke="url(#spk-pet)" stroke-width="3.2" stroke-linejoin="round"/>
  <circle cx="50" cy="50" r="7" fill="url(#spk-core)"/>
</svg>
```
   **Animation rule (from the landing, `MarkGlint.tsx`): the logo path itself NEVER rotates.** Brand moments (auth pages, first-run hero, empty-state beats) get the landing treatment: an ambient layer revolving at 150s linear + a specular glint traveling the curve (~28-45s); TopBar/mark-at-16-20px stays fully static; everything static under `prefers-reduced-motion`. Working/loading moments may use the loader treatment (petals revolve + core pulses) — that is the AiWorking state, not the resting brand.
2. **Google sign-in uses the official 4-color G** (viewBox `0 0 18 18`): `#4285F4 M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.2 1.13-.84 2.08-1.8 2.72v2.26h2.91c1.7-1.57 2.69-3.87 2.69-6.62z` · `#34A853 M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.26c-.8.54-1.84.86-3.05.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z` · `#FBBC05 M3.96 10.71A5.41 5.41 0 0 1 3.68 9c0-.59.1-1.17.28-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3-2.33z` · `#EA4335 M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58z`. Never a lone letter "g".
3. **Typography truth:** `--font-pixel` falls back to MONOSPACE when Geist Pixel isn't installed — a Pixel headline in a standalone file renders as broken monospace (the founder's "disaligning font"). Therefore: auth pages and any standalone-critical text use the SANS display scale for titles (larger size + weight per the existing screens' heading treatment), Pixel NOWHERE on auth. Sans/mono stacks stay exactly `_shared.css`'s.
4. **Avatars are the app's orb library** (`src/components/supaprod/Avatar.tsx`): a soft two-hue gradient orb mixed heavily into the surface — `radial-gradient(circle at 30% 24%, rgba(255,255,255,.16) 0%, transparent 48%), linear-gradient(140deg, <hueA muted into card> 0%, <hueB muted into card> 100%)` — with the initials in primary text color. Muted pair examples for mockups (dark): ember/gold `#3a2318→#38301a`, blue/moss `#1a2634→#222c1f`, madder/ember `#331d20→#3a2318`. Calm tints, never saturated discs. Name display follows the app: the orb + the name in Sans, email in mono dim.
5. **Copy passes the stranger test.** Every line must mean something to a first-time reader. The screen-15 sub-line becomes: `Sign in to get back to what your agents are doing.` (or omit the sub-line). Ban vague poetry on functional pages.
6. **Spacing economy:** auth cards and minis HUG their content — no fixed heights, no orphan vertical gaps between field → helper → button beyond one spacing step. If a frame has visible dead bands, that is a §7 blocker.
7. **Focus-visible is subtle:** a 1px hairline ring (`--ink-border-strong` equivalent) with 2px offset, at most a faint outer glow — NEVER a thick high-contrast outline box. Focus must be findable, not shouting.

## §7 Review gates (self-check before you finish; a verifier will re-check)

- [ ] Shared block byte-identical; overrides block present; screen styles below `/* END SHARED */`
- [ ] TopBar v2 (§3); Approvals count consistent everywhere it renders in the frame
- [ ] Exactly ONE ember locus per frame; zero ember chips; chips slate; memory = Vellum only
- [ ] Max one full-hue machine locus; grayscale test passes (attribution via chips/glyphs)
- [ ] Max one Pixel moment; fonts per ruling 7; timestamps mono right-aligned in chip rows
- [ ] Card law (§1.9); no edge strips; kebabs closed; no money outside screen-17
- [ ] Functional contract header complete; every id chip annotated with its door
- [ ] Timeline/id consistency with §4; no colliding ids; no purple anywhere
- [ ] Both themes render correctly; WarmSlot (never bare empty); honest GAP states
- [ ] Starfield ONLY if your spec sanctions it (idle/empty/onboarding/Brain-idle)
- [ ] §6b: the file sits beside screen-2/3/4 without looking simpler (density + craft parity)
- [ ] §6b: behavior rail present (hover/focus/active/disabled/loading/empty/error/success for core components) + keyboard/tooltip/motion annotations in-frame
- [ ] §6b: Pixel uses = 0 unless genuinely elevating (max 1); type system matches the existing mockups exactly
- [ ] §6c: color aliveness — frames with real state carry their voices (machine blue live, Vellum on memory, verdicts colored); near-grayscale frame = BLOCKER
- [ ] §6c: three-beat focus — story → action → evidence; plumbing behind closed expanders; nothing at uniform priority
- [ ] §6c: EVERY clickable has its door + consequence line (+ behavior-rail states); zero unexplained affordances
- [ ] §6c: Ask placement earns its presence — docked (quiet, single-line, visible ⌘J chip) ONLY on speak-primary surfaces (stage faces, rest, first-run, Brain); all other surfaces use the TopBar button + ⌘J summon overlay (annotated), with NO docked composer
- [ ] §6d: the mark is the verbatim epitrochoid SVG (never dots, never improvised); logo never rotates (glint treatment on brand moments only); official Google G; no Pixel on auth; avatars = the orb library recipe; no dead spacing bands; focus rings subtle hairline (no thick boxes); copy passes the stranger test
```
