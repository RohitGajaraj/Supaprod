# Implementation notes · Cadence App (Obsidian v3)

## State model (from the prototype)

```
surface: "today" | "discover" | "plan" | "build" | "brain" | "govern"
missionOpen: missionId | null      // slide-over
traceOpen: boolean                 // raw trace inside slide-over
answeredCalls: { [callId]: "ok" | "no" }
toast: string | null               // auto-clear after 3.6s
```

## Data objects

- **Call** `{ id, kind, expiry, title, body, ev: [{src, text}], okLabel,
noLabel, consequence, okToast, noToast }` — three kinds shown: SHIP IT?,
  WORTH BUILDING?, SPEND.
- **Mission** `{ id, title, agent, cost, status: working|gate|done|queued,
gateId?, verdict?, step, steps: [{n, agent, what, state}], trace: [line] }`
- Signals, opportunities, specs, roadmap bets, decisions, learnings, rooms:
  see the prototype's constants for canonical sample content and copy tone.

## Core behaviors

1. **Answering a call** (`decide(id, ok)`):
   - Marks the call answered; it leaves the Today queue immediately.
   - Nav badge count = unanswered calls; hidden at zero.
   - Today hero rewrites: "Two calls need your judgment today." →
     "One call…" → "All clear. The loop is running itself." (count word in
     ember Newsreader italic; the all-clear card gets a moss border).
   - Shows the call's voice-correct toast 3.6s.
   - "Calls answered" progress bar (ember fill) advances.
   - **Cross-object sync:** a mission whose `gateId` matches flips —
     approve → status done, step label "SHIPPED"/"MERGING"; send back →
     status working, label "REVISING". Its gate step in the slide-over
     flips too (gate → done or working). This linkage is the product's
     point: the Call, the mission row, and the slide-over are one object.
2. **Mission slide-over:** opens from any mission row (Build) or
   "machine right now" row (Today, which also switches surface to Build).
   Scrim click or Esc closes. Trace toggle is per-open (resets on open).
3. **Challenge (Discover):** fires toast "Critic engaged. The teardown lands
   on Today, receipts attached."
4. **Keyboard:** 1/2/3/4/5 = surfaces, g = Engine Room, Esc = close
   slide-over. Ignore when modifier held or focus is in an input/textarea.
   (Production: also implement ⌘K palette — the affordance exists in the rail.)
5. **Navigation side effect:** switching surface always closes the slide-over.

## Routing (target repo)

The repo uses TanStack Router. Suggested: one authenticated layout route
carrying the rail + top bar; child routes `/today`, `/discover`, `/plan`,
`/build`, `/brain`, `/engine-room`. `missionOpen` as search param
(`?mission=m2`) so slide-overs deep-link. Keyboard map navigates routes.

## Styling approach

- Copy `tokens/*.css` custom properties verbatim; map to Tailwind v4 theme
  vars if that matches the repo. Do NOT reuse the legacy parchment tokens
  (see REPO-LINKING.md; DESIGN.md is superseded for app surfaces).
- Dark-only. No shadows for depth (hairlines + surface tint); the only
  shadows are glows (role-colored) and the slide-over's drop.
- Fonts via Google Fonts: Newsreader, Schibsted Grotesk, JetBrains Mono,
  Codystar, Caveat. Self-host for production.

## Motion

- One easing `cubic-bezier(0.23,1,0.32,1)`; 140ms controls / 200ms panels /
  280ms pages.
- Keyframes to port: cadPulse, cadGlow, cadFlutter, cadShimmer, cadDriftA/B,
  cadRise, cadSlideIn (see tokens/motion.css — exact definitions).
- Self-animating things ONLY: live status pulses, the butterfly flutter, the
  shimmer working line, aurora drift, arrivals. Everything else moves only
  on interaction. Gate all of it behind `prefers-reduced-motion`.

## Accessibility

- Focus: 2px glacier outline, offset 2 (`:focus-visible`).
- Selection: ember at 28%.
- All rows/cards that act are real `<button>`s.
- Status never relies on color alone: every dot ships with its mono word.
- Slide-over: `role="dialog"` + `aria-modal`, focus trap, restore focus on
  close (prototype omits the trap; production must add it).
- Aurora blobs and glow layers: `aria-hidden="true"`.
- Contrast: body ink #B5AFA6 on #0A0A0B ≈ 7:1; faint ink #55524C is for
  non-essential metadata only.

## Copy rules (enforce; see DESIGN-OBSIDIAN.md §"humanized-output law")

No em/en dashes (middot instead) · no exclamation marks · no emoji · no
AI-cliche words · buttons are 1-2 plain words with consequence in helper
text · mono-caps metadata with middots ("SCOUT · STEP 2/5", "$0.84").
Suggested CI: grep new UI strings for `—`, `–`, and the banned-word list.

## Out of scope (design intentionally stubbed)

- ⌘K palette UI, Settings, onboarding, empty-workspace states (empty-call
  state IS designed: the all-clear card).
- Real data/agents: all content is static sample data in the prototype.
- Engine Room room detail views (cards are doors; only the glance exists).
