# UNIT L0-013: MissionOrchestratorDetail's leading sits on Meridian's ladder

**Lane:** LANE 0
**Completed:** 2026-08-24T00:40+05:30
**Commit:** 4df367f62

## What this unit was

Eleven inline line-height literals across the founder's worst-reading
detail surface converted onto var(--mrd-lh-*) tokens. Three matched by
luck (pure swaps); the rest moved deliberately:

- mono rail rows 1.8 -> --mrd-lh-mono (1.7): the rail loses a tenth of
  slack onto its own family stop
- preStyle payload blocks 1.6 -> mono: code reads better with the family's
  air than stranded at an off-scale 1.6
- sentence beside the compounding numeral 1.4 -> snug (1.5): 1.4 is the
  exact value --mrd-lh-snug replaced; this is the founder's air arriving
- flex label 1.45 -> snug (nearest stop)
- page title h1 1.24 -> tight (1.15): headings sit on tight per the ladder
- stat numeral KEEPS lineHeight: 1 - single-line box height is not reading
  leading

## Gap noted, not faked

The h1 carries hand-written letter-spacing -0.028em, a display-size value
no Meridian token matches (--mrd-track is flat -0.14px for lowercase body,
--mrd-track-label is +0.06em). Left inline; if Meridian wants a display
tracking token that is a meridian-gap for MAIN LANE to rule on.

## Verification limits, stated plainly

tsc exit 0; bun test 10,650 pass, 0 fail. The rendered surface itself is
behind authentication, which no browser path in this repo can currently
reach (same gap answers/U005-U007 recorded: the eyeball pass needs the
founder). What IS verified: the tokens resolve - all four are shipped CSS
utilities per M13's production-bundle check - and tsc confirms the vars
typecheck as CSSProperties values. Snug/tight/mono deltas are small by
design; the largest visual movement is the rail rows' 1.8 -> 1.7.

## Handed forward

Remaining hierarchy work on this file, in priority order:
1. Spacing rhythm: literal margins (16/18/10/14) vs the five spacing roles;
   needs per-section browser verification, so its own unit.
2. Hand-rolled colour+size spans vs the five text roles.
3. LOOM_CARD composition from the studio layer (tracked debt).
