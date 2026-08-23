REQ-007: public pages that pin dark need status hues that do not flip

Found while closing the mixed-ground defect on /d/$slug (public decision
archive). The fleet convention is now explicit and consistent: every public
page pins its ground dark via the PUBLIC_INK_THEME spread, because nothing
on a public route scopes Meridian's adaptive tokens.

The ink family survives this fine: the spread pins --ink/--ink-subtle/
--ink-muted/--ink-faint/--hairline, so all neutrals resolve dark regardless
of stored theme. d.$slug now reads exactly those.

The residue is the outcome ladder. A decision archive's whole job is showing
approved / rejected / pending, and Meridian's pass / fail / hold are the
right semantics, so the page kept var(--mrd-pass/fail/hold). But the
[data-theme="light"] block in meridian.css re-declares all three light-tuned,
and they are not in the spread, so a light-theme visitor sees muted status
colour on the dark ground. Not white-on-white; degraded contrast on three
labels, on one low-traffic page. Recorded in the file beside the STATUS map.

Two shapes of fix, MAIN LANE's call since meridian.css is yours:

1. A non-flipping public-status trio in meridian.css, e.g.
   --mrd-pass-fixed / -fail-fixed / -hold-fixed declared once from the dark
   values, for pinned-dark public surfaces to read. Three tokens, one rule
   of when they may be used (only under a literal-dark ground).
2. Or a sanctioned pin pattern: a scope attribute that re-declares the full
   mrd ramp dark inside itself, so a page could stamp it and keep reading
   plain --mrd-* names. Heavier, but it would also cover .bento internals
   and any future public surface wanting Meridian's whole vocabulary.

Until ruled, d.$slug ships with the neutral conversion done and the status
flip recorded as known residue; subprocessors carries two var(--mrd-edge)
border reads at :46 and :140 with the same exposure (edge flips light-tuned
against its new pinned ground), held rather than half-fixed because they are
hairline-weight and the wrong fix is worse than the wait.

No urgency: default-theme users see correct rendering everywhere today.
