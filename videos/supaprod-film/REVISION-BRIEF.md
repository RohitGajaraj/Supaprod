# v4 frame-revision brief — the standing ground truth

> Every revision agent reads this FIRST, then its frame-specific note. The founder's two real-app
> screenshots are the fidelity law: `assets/reference/real-app-collapsed-rail.png` (icon rail
> collapsed) and `assets/reference/real-app-expanded-rail.png` (rail expanded). Read both images.

## The real app shell (match this, not the old kit sidebar)

- **Top bar**: `✻ Supaprod` (bare mark + wordmark, NO box/plate behind the mark) · breadcrumb
  "harbor / checkout ⌄" style (workspace / product) · center: a slim notification strip (tiny colored
  glyphs + one sentence like "19 decisions are ready for you · 3h ago") · right: an `Ask ⌘K` pill +
  round avatar chip "MR".
- **The seven-station strip is HORIZONTAL, full width, directly under the top bar** — the platform's
  spine: `01 Discover · 02 Decide · 03 Plan · 04 Design · 05 Build · 06 Ship · 07 Learn`, numbers in
  small mono above the name, thin vertical hairlines between cells, an ember dot on active stations,
  and status sublines in ember where the story needs them ("86 runs waiting on you", "2 runs waiting
  on you"), muted grey otherwise ("7 runs"). The current frame's station carries the dot + status.
- **Left nav is a NARROW ICON RAIL** (~2.8cqw): 5 stacked glyphs (Today, Runs, Brain, Crew, Engine
  room — simple line icons), active one on a soft panel; bottom cluster: 3–4 utility glyphs.
  NEVER a wide sidebar; the stations NEVER appear in the left nav. Content gets the full width.
- **Content style** (from the screenshots): a quiet greeting line, then ONE big statement headline
  ("19 decisions are ready for your review."), muted meta line under it, then sections with title +
  one-line explanation in muted text ("4 live and waiting on nobody. Undoing one costs a rollback."),
  rows with small green "done" states, and review cards with chips (Research · This workspace · low
  risk · 1 of 19). Ember for status/attention, pass-green for done, everything else calm.

## Standing rules (all frames)

1. **Context coherence**: every visible panel/chart/row belongs to THIS beat's story. No decorative
   graphs. If a chart appears it is the chart the VO implies.
2. **Micro-interactions**: real clicks (cursor + `cursor-click-ripple`), popovers opening, chips
   settling, statuses flipping — at least one authentic interaction per product frame, on a VO cue.
3. **Color**: station color leads its own screen; ember only for brand/attention moments; pass green
   for done/accepted; fail red sparingly for rejected/killed. Richer than ember-everywhere.
4. **Camera never sleeps** (macro move + micro-drift; blur-streak pans; DOF focus pulls) — but leave
   deliberate settled holds where the storyboard marks breathers.
5. All prior contracts stay: template transport, #root styling, ground clips, one paused timeline,
   fromTo, no CSS transitions/repeat/random, cqw/cqh sizing, top-83% keep-out, locked durations.
6. Fonts: frame.md @font-face verbatim. Tokens: frame.md §"Product screen tokens".

## v5 duration table (LOCKED — build your frame to THIS duration; Vesper VO + breathing air)

F1 8.8 · F2 12.1 · F3 13.7 · F4 11.3 · F5 6.9 · F6 11.0 · F7 6.4 · F8 22.8 · F9 10.8 · F10 10.8 ·
F11 11.8 · F12 6.4 · F13 9.3 — film total 142.1s (v10 FROZEN — founder-approved script; VO plays at 1.05x pitch-preserved). STORYBOARD durations already match.

## Agent presence + seam law (founder, 2026-08-12)

- Every station surface shows AGENTS WORKING: small "agent · <verb>ing" live indicators, console/terminal
  textures where natural (Build especially), steps ticking themselves. The film's world is agent-driven
  from Discover to Learn — visible, not narrated.
- SEAM LAW: no frame-connecting scaffolding may ever be visible in the final picture — no stray
  connector lines, no adjacent-frame edges peeking during transitions. QA checks every seam.

## Frame-specific notes (one agent per frame, sequential)

- **04-supaprod** (fidelity anchor — FULL REBUILD of the opening): the founder ruled the logo-draw +
  ember punch-through reads as a TV commercial, not an enterprise teaser. NEW shape — introduce the
  product THROUGH the product: Scene 1 (0–2.2s) the app home already on screen, deeply out of focus;
  the bare ✻ mark + "supaprod" wordmark rise as a QUIET lower-left film title as the VO says the
  name (no center ceremony, no fire ring, no Seedance clip). Scene 2 (2.2–5.4s) a slow rack focus
  INTO the working home screen (the reveal IS the focus pull), while three thesis chips land under
  the lockup on their VO cues: "knows what to build · runs the lifecycle · learns and guides".
  Scene 3 (5.4–10.8s) the home pan as designed (calls queue, gate chip pulse on "you make the
  calls") with the title lockup receding to a small corner mark. Home screen matches the
  screenshots' surface almost literally — greeting, "3 calls waiting on you." headline, Shipped
  section, review card — plus the real shell. Lower-third audience line stays.
- **05-signals-become-bets**: shell correction; Discover station active with "24 new signals" status;
  keep pain-point inbox + wide connector categories; sources include product data AND market
  analysis AND insights (breadth); one real interaction: cursor opens the evidence popover (already
  there — keep). Station color teal leads.
- **06-it-disagrees**: shell correction; Decide active; keep the 4.0/8.0 kill; the pass/kill moment
  gets fail-red strike + pass-green advance (real accept/reject states).
- **07-the-forecast**: shell correction (dimmed behind the modal); keep the commit form beat intact.
- **08-the-route**: Build shows its INPUT ("from spec 03 · checkout-fix" chip — interconnection visible) and a subtle tests line ("tests · writing themselves · 214 passing"); agent notes labeled "the agent's take"; shell correction on all three station screens (Plan/Design?/Build/Ship); DEEPEN:
  Build shows an agent run console with steps ticking, a real diff, tests passing, one boundary
  refusal ("schema drop — blocked · outside boundary" in fail red) = governed depth; ADD a Design
  station moment (the 7-hit flyover already passes it — give Design a real mini-surface: a prototype
  canvas with frames + a comment pin); Ship keeps release notes + GTM ticks. The wide gets
  lower-third "the complete product lifecycle — one platform."
- **09-the-loop-closes**: (already revised once) shell correction + keep the labeled thread work; the verdict visibly flows INTO the Brain icon on the rail (glyph pulses, count ticks — the shared memory absorbing it); agent note labeled "the agent's take".
- **10-it-stops-you**: shell correction; Decide active; precedent panel stays; the precedent panel opens as GUIDANCE ("similar calls · 3 on the record · what worked / what didn't") and escalates to the stop; card body carries "Q3 last year · shipped · missed" precisely; one real interaction: cursor hovers "view the
  record".
- **11-what-cant-be-reconstructed**: THE ASK PAYOFF (founder-ruled): the frame OPENS with Supaprod's
  Ask bar (the ⌘K pill expanded) and the caret typing the film's oldest question — "why did we build
  this?" (F3's exact words, same caret motif) — and THIS time the record answers: the two-plane
  record surfaces beneath as the response. Left plane "What happened", right plane retitled "What
  you believed · what worked · what didn't — and why" (matches the new VO); a small "shared brain"
  mono chip; rack-focus argument stays. Shell correction if the shell is visible. Ask is shown as
  the door to the brain — never as a feature tour.
- **03-you-know-the-feeling**: NOT a Supaprod screen (the pain desktop) — no shell. Swap window
  identities to the new-age cast with glyphs from assets/logos/: Linear board (linear.svg), Intercom
  inbox (intercom.svg), interview notes (no glyph), analytics dashboard (googleanalytics.svg),
  Notion-flavored roadmap (notion.svg), chat thread (text identity), and ONE Claude Code terminal
  session mid-agent-run (claude.svg) — the modern PM stack.
- **02-worth-building**: keep; verify the chart is unmistakably THE activation-flat argument
  (context coherence); lower-third already carries "knowing what to build".
- **12-the-promise**: highlight "deciding" — the word gets weight/ember-ink emphasis on its cue;
  everything else stays.
- **13-close**: slow product moment behind the lockup (gentler recede), keep the typed URL; the
  spoken line no longer mentions demo/login (visual URL only).
