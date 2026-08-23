# UNIT L0-019: MissionOrchestratorDetail spacing onto the scale; R005 follow-ups land

**Lane:** LANE 0
**Completed:** 2026-08-24T03:30+05:30
**Commits:** 06999f394 (spacing + font snaps + R005 follow-ups, 8 files)

## Spacing pass

28 exact-match literals swapped to var(--mrd-sN) with zero visual change;
~20 near-misses snapped to nearest stop per the UL0-002 discipline
(12->s4/10px, 14->s5/16px, 18->s5, 22->s6, ties down). Two agent snaps
REVERTED before commit as judgment calls needing eyes: the rail's
paddingLeft: 22 is geometry (aligns under the chevron column), and the
hero card's 32px horizontal padding sits at a delta-8 tie between s6/s7 -
an 8px tightening on this page's largest card should not ship unseen.
Both keep literals with reasons recorded beside them.

## Font snaps (nearest-stop, disclosed)

25->h2 (exact), 26->h2, 19->h3, 21->h3, 15->prose x4, 13.5->prose/base by
role. RewindButton carried an in-code comment defending its 19px literal;
snapped anyway per the ladder - the comment needs reconciliation by
whoever owns that rationale.

## R005 follow-ups

run-parts LINK_AS_CONTROL now re-exports ACTION_LINK_FACE.default after
byte-identical verification; route consumers untouched.

AgentMark investigated: imports ZERO shell symbols already (header's
ADAPTER claim is stale); flagged not fixed - line 89 reads retired
var(--sp-space-2) which ink.css aliases to gap-mrd-inline.

EvalScoreChips sp-grid swap STOPPED cleanly: column arithmetic matches but
gap differs 8px vs Grid's 10px and Grid adds data-mrd scoping. DetailKit
StatStrip flagged with the same caveat - both need eyes or a ruling.

## Measured

Ratchet unchanged 2,447/189 (spacing literals are not retired vocabulary).
tsc exit 0; bun test 10,650 pass, 0 fail.
