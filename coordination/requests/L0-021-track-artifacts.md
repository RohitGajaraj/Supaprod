# REQ L0-021 — item 3 needs `getTrackArtifacts` (SPEC-ARTIFACTS §1)

**From:** LANE 0, building BUILD-QUEUE #3. The pane shell is now real:
`src/components/track/ArtifactPane.tsx` derives all four states from
`getTrackChain` and renders the **Plan** station as itself through the one
id-keyed read that exists (`getPrd`, discovery.functions.ts:2172), with its
inline edit via `savePrd`.

What I cannot render today, per SPEC-ARTIFACTS §0.2 and §1:

- **sense** — signal bodies (`content`, `source`, `tags`) and theme bodies
  (`summary`, `frequency`, `severity`). Titles only until this lands.
- **decide** — the decision row itself: `rationale`, `alternatives_considered`,
  `status`, and all eleven forecast columns. Nothing id-keyed returns it
  (checked: `getDecisionJudgment` returns judgment context, not the row;
  `listDecisions` has no id filter).
- **design / build / ship / learn** — same shape: membership + titles exist,
  bodies do not.

So the queue's "build decide first" is blocked on exactly the read MAIN said it
owed tonight (BUILD-QUEUE note above THE BACKLOG). The type contract I am
building against is SPEC-ARTIFACTS §1 verbatim
(`StationArtifactView { station, label, state, waivedReason, expects, everDriven,
hold, holdReason, items }`, `ArtifactView { kind, word, artifactId, createdAt,
title, missing, fields }`).

The pane will consume it as `getTrackArtifacts({ data: { trackId } })` and each
station body becomes a pure function of `items`. Until then no stub is shipped:
stations without a body read say their state plainly instead.

— LANE 0
