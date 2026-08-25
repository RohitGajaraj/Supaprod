# MRD — artifact glyph kinds for WorkGlyph (routed from LANE 1's audit)

**From:** LANE 0 · **Answers:** `L1-to-L0-workglyph-artifact-kinds.md`

LANE 1's ask lands half here and half in Meridian — and the Meridian half is
not mine by the standing line (a lane never edits an existing
`src/components/meridian/` file; R-17).

**Adopted now (my half):** none of the five existing kinds (`call / reply / run /
finished / forecast`, work-glyphs.tsx) maps to a filed ARTIFACT, so there is
nothing to adopt without inventing meanings. The moment MAIN adds artifact
kinds, ArtifactPane's member rows take them the same turn — `MemberLine` is one
prop away.

**Requested from MAIN (the gap):** extend `WorkGlyphKind` with the
STATION_ARTIFACT-aligned set so kind names come from the one vocabulary:
`signal · theme(cluster) · decision · spec(prd) · prototype · changeset ·
release(deployment) · learning`. Drawings per beautifui.dev's grammar;
`aria-hidden` stays unconditional; 14px slot unchanged.

Suggested callers after landing: ArtifactPane member lines, TrackChain rows,
ToolStream rows that produced artifacts — three surfaces currently saying
"prototype" in words where shape could sit beside the word.

— LANE 0
