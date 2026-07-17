# Component inventory · Supaprod App (Obsidian v3)

All values below are exact. Tokens in parentheses refer to `tokens/colors.css`
etc. Reference render: `design-reference/cadence-app.html`.

## Shell

### Rail (sidebar)

- 236px fixed, `--rail` #0D0D0F, 1px right hairline (7% white).
- Header: Butterfly mark 24px (wing-flutter animation `cadFlutter` 3.4s,
  ember drop-shadow) + "Supaprod" 13.5px/700 + workspace name 10.5px subtle.
- Search affordance: card surface, radius 8, "Search … ⌘K" (mono 9.5px).
- Nav: five items, each = mono index (01-05, 9.5px) + label (13px) + optional
  badge. Active: bg #1A1A1E, text primary, weight 600, index turns ember.
  Hover: bg #17171A. The ONLY badge in the app sits on Today: ember pill,
  mono 9.5px/700, dark ink, glow 0 0 10px rgba(255,107,44,0.4), shows count
  of unanswered Calls; hidden at zero.
- Footer: shimmer working line ("2 agents working", 7-stop gradient clipped
  to text, 5s drift, with a pulsing 5px glacier dot); Engine Room door
  (hairline button, mono "G" shortcut hint, right-aligned state "ALL CLEAR"
  in faint mono); user chip (24px round avatar with ember hairline, name,
  6px moss presence dot).

### Top bar

52px, bottom hairline. Surface title 13.5px/600 + subtitle 12px faint;
right side: date in mono caps ("WED · JUL 2") + workspace pill ("LUMEN",
mono 9px in a hairline pill).

### Surface container

max-width 1060px (1160 for Discover/Plan), padding 36/32/64. Every surface
enters with `cadRise` 260ms (translateY 10px → 0).

## Objects

### CallCard — the atomic unit

Container: `--surface-card-deep` #0E0E10, border 1px rgba(255,107,44,0.25),
radius 12, padding 20/22.
Anatomy top-to-bottom:

1. Kind chip: mono 9px caps ember, ember-hairline pill ("SHIP IT?",
   "WORTH BUILDING?", "SPEND") + expiry in faint mono caps ("EXPIRES IN 6H").
2. Title: Newsreader 20px/460, lh 1.3 ("Ship the checkout fix?").
3. Body: 13px/1.65 muted.
4. Evidence rows: source pill (blossom mono 8.5px, blossom hairline) +
   verbatim quote 12.5px body ink.
5. Actions: primary ember button + secondary + consequence helper 11.5px
   subtle ("Opens the pull request · nothing ships without you").
   Same anatomy inside the mission slide-over gate (slightly compressed:
   "YOUR CALL" chip, title 17px).

### Buttons

- Primary: ember fill, ink #0A0A0B, 13px/600, radius 8, padding 9/18;
  hover → `--ember-deep` #C2571F. ONE per screen.
- Secondary: #1D1D21 fill, 9% white border, text primary, 13px/500,
  padding 8/18; hover #242429.
- Quiet/inline: mono-caps glacier text links ("OPEN →", "HOW I GOT THIS →");
  hover → #EAF6FF.

### Status dots

6px circles + mono word. working=glacier+`cadPulse` 2s+glow; gate/waiting=
ember+`cadGlow` 1.8s+glow; done=moss (static glow); queued=#55524C flat.
Step labels take the dot's color ("SCOUT · STEP 2/5" glacier, "WAITING ON
YOU" ember).

### Verdict chips

Mono 8.5-9px caps 600, pill, 12% tinted fill, 45%-alpha border of same hue:
SHIP/VALIDATED/KEPT moss (#8FD9A0 text) · KILL/MISSED madder (#EE7A6C) ·
REVISE ember (#FF8B52) · CRITIC REVIEW/WATCH marigold · DRAFTING glacier ·
PENDING neutral (transparent fill, faint text).

### Aurora score card (Loop Health)

Radius 16, bg #0F1B12 (healthy), two drifting radial blobs (marigold 0.34 +
moss 0.4, `cadDriftA` 9s / `cadDriftB` 12s), outer glow 0 0 55px moss 9%.
Content: mono-caps label, Codystar 52px numeral, mono-caps note
("ON TRACK · +3.2 THIS WEEK"). Max one per screen.

### Mission row (Build)

Full-width row button, 14/18 padding, bottom hairline, hover #141416.
Cells: status dot · title 13.5px/600 primary (ellipsis) · verdict chip
(done missions only) · step label mono 9px right-aligned 96px · cost mono
9px faint 44px right.

### Mission slide-over

480px (max 92vw), fixed right, bg #101013, left hairline 9% white, shadow
−30px 0 60px black 50%, `cadSlideIn` 240ms. Scrim: rgba(4,4,5,0.6) +
blur(3px), click closes; Esc closes.

- Header: "MISSION" mono label + status word (colored) + cost + Close button;
  title Newsreader 21px/460.
- Step list: mono index 01-05 + status dot + description 13px (ink follows
  state: working/gate = primary, done = muted, queued = subtle) + agent name
  mono 8px right.
- Gate block: compressed CallCard (see above) when the mission waits on a call.
- Trace toggle: "SHOW THE RAW TRACE →" glacier mono; expands #0B0B0D card
  with mono 10.5px log lines ("02:14 scout.pull intercom · 312 tickets · $0.22").
- Footer strip: 11px faint "Every hop cites the memory it drew on · Esc closes".

### Toast

Fixed bottom-center, #17171A pill, moss 40% border + moss glow, 13px primary
text, `cadRise` 200ms, auto-dismiss 3.6s. Voice: "Good call. The PR is open."

### Loop pills (Today)

Horizontal strip: SENSE → DECIDE → DEFINE → BUILD → LEARN as mono-caps pill
buttons joined by faint "→". Each jumps to its surface. DECIDE goes ember
(border 50%, glow) when calls are pending; BUILD carries a pulsing glacier
dot; the rest neutral hairline.

### Signal card (Discover, left column)

Source pill (blossom) + timestamp mono faint · verbatim quote 13px/1.6 ·
theme line mono 8.5px subtle ("→ MOBILE QUICK-CAPTURE · 23 SIGNALS").
Column footer: "Every quote is verbatim and keeps its source."

### Opportunity row (Discover, right column)

Card row: ICE number Newsreader 23px + "ICE" micro-label · title + sub ·
verdict chip · "Challenge" secondary button. The top bet carries a pencil
annotation ("best bet", Caveat 17px lime, rotated −2°, neon underline)
floating at top-right (-11px).

### Roadmap columns (Plan)

NOW (ember header, ember-tinted card borders) / NEXT (neutral) / LATER
(deep cards, dimmer ink). Each bet card: title 13px/600 + measure in mono
8px caps ("DROP-OFF −20% BY AUG 1").

### Spec list (Plan)

Row: title + state chip (APPROVED moss / CRITIC REVIEW marigold / DRAFTING
glacier) · cites count in blossom mono ("11 SOURCES") + note.

### Stats + record (Brain)

Stat trio: Newsreader 24px numeral + mono micro-label (128 CALLS MADE ·
71% VALIDATED · $214k SAVED BY KILLS) + "Export my record" secondary button.
Decision rows: title + date mono + verdict chip + note. Learning rows:
verdict chip + text + moved-line in glacier mono ("RE-RANKED USAGE-BASED
ALERTS +1.1 ICE").

### Room cards (Engine Room)

2×2 grid: name 14px/700 + state chip (HEALTHY moss / WATCH marigold) +
question 12px faint + verdict line mono 10px ("$482 of $600 · trending +12%").
Below: GitHub connection strip (#0E0E10) with live moss pulse
("LIVE · SYNCED 4 MIN AGO").
