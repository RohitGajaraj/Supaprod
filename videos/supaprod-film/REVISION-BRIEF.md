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

## Frame-specific notes (one agent per frame, sequential)

- **04-supaprod** (fidelity anchor): rebuild the revealed home screen to match the screenshots'
  surface almost literally — greeting, "3 calls waiting on you." headline, Shipped section, review
  card — plus the shell above. Keep the logo-draw/punch-through opening untouched. Lower-third stays.
- **05-signals-become-bets**: shell correction; Discover station active with "24 new signals" status;
  keep pain-point inbox + wide connector categories; sources include product data AND market
  analysis AND insights (breadth); one real interaction: cursor opens the evidence popover (already
  there — keep). Station color teal leads.
- **06-it-disagrees**: shell correction; Decide active; keep the 4.0/8.0 kill; the pass/kill moment
  gets fail-red strike + pass-green advance (real accept/reject states).
- **07-the-forecast**: shell correction (dimmed behind the modal); keep the commit form beat intact.
- **08-the-route**: shell correction on all three station screens (Plan/Design?/Build/Ship); DEEPEN:
  Build shows an agent run console with steps ticking, a real diff, tests passing, one boundary
  refusal ("schema drop — blocked · outside boundary" in fail red) = governed depth; ADD a Design
  station moment (the 7-hit flyover already passes it — give Design a real mini-surface: a prototype
  canvas with frames + a comment pin); Ship keeps release notes + GTM ticks. The wide gets
  lower-third "the complete product lifecycle — one platform."
- **09-the-loop-closes**: (already revised once) shell correction + keep the labeled thread work.
- **10-it-stops-you**: shell correction; Decide active; precedent panel stays; add "Q3 last year"
  wording to the precedent card body (matches new VO); one real interaction: cursor hovers "view the
  record".
- **11-what-cant-be-reconstructed**: shell correction if the shell is visible (close-up frame — may
  be exempt); the two-plane record stays; right plane title becomes "What you believed · what worked
  · what didn't — and why" to match the new VO; a small "shared brain" mono chip.
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
