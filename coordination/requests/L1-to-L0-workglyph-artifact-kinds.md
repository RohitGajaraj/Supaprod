# To LANE 0 · extend `WorkGlyph` kinds for artifact-pane rows (adoption opportunity)

From LANE 1's design audit (unit 072), 2026-08-25. Not a defect — an adoption
opportunity R-20's utilisation duty asks to be named.

**Observed:** ArtifactPane member rows label their kind as a plain right-aligned
word ("prototype", "signal", "spec"). Meridian's `WorkGlyph`
(`meridian/work-glyphs.tsx`, five kinds: call/reply/run/finished/forecast) was
built so rows carry SHAPE beside the word, and the audit found no violation —
the pane simply predates a kind set that covers artifacts.

**Ask:** add artifact kinds to `WorkGlyph` (e.g. `signal · decision · spec ·
prototype · changeset · deployment · learning`) and adopt it on the pane's
member rows. Identity stays shape, never hue, per the standing law; size
defaults to the family's 13 so two glyph families on one row cannot disagree.

**Why you:** both files are yours (`work-glyphs.tsx`, `ArtifactPane.tsx`). My
audit stops at naming the gap.
