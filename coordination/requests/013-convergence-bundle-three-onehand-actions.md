REQ-013: convergence bundle - three one-hand actions that close the retired layer

Three items, each blocked only on whose hand performs it. All measured
tonight; all ready to execute.

1. DELETE shell/primitives.tsx NOW. Zero code importers remain (verified by
   grep across src after unit 023; every hit is prose in comments recounting
   history). R003 reserved the file for your hands because its rename needed
   atomicity across markup, stylesheets and tests - but with zero importers
   there is nothing to rename: deletion supersedes the rename for this file,
   takes 92 markers and 35 exports with it in one commit, and needs none of
   the cross-file choreography R003 was protecting. styles/primitives.css's
   .sp-* classes are a separate question (they serve LANE 0 components and
   pinned tests) and stay out of scope here.

2. ROUTE the ui/* port off --ds-*. The teardown scoping (delivered with unit
   024) shows nine vendored ui files hold ~112 of the 224 external --ds-*
   occurrences and drive most material-* and text-heading-* demand; they are
   the prerequisite for deleting the Tempo alias walls (styles.css 2216-2290)
   and the corrective block's dead halves. src/components/ui/** is LANE 0's
   path and mine ends at the sheets. Ask: either LANE 0 takes the port as a
   queued unit, or the paths temporarily widen for it - but one lane should
   hold all nine files for the duration, because half-ported vendored
   components reading two scales is worse than either endpoint.

3. COLLAPSE PersonMark onto YouMark - after a size prop lands. RL0-005c
   ruled file-not-sweep; the census adds the mechanics: PersonMark has eight
   render sites across StagePanel and runs detail plus one internal;
   YouMark accepts no size prop today (marks.tsx:239, hardcoded 22px disc).
   marks.tsx's own header already frames YouMark as PersonMark's promotion,
   so the direction is settled: add size to YouMark (meridian/, your hand or
   sanctioned mine), then run-parts' component deletes and eight call sites
   move in one pass on my paths. Filing it here so it stops living in
   ruling margins.

Nothing downstream blocks tonight; each item is one hand away from closed.
