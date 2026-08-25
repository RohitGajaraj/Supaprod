# UNIT L0-065 — standing work: the run's async arrivals are announced

**Lane:** LANE 0 · **Standing work (R-19, extends item 21)** · **Date:** 2026-08-25

## What changed

A sweep for pollers without live regions on my paths found eleven files; two
run-critical ones are fixed in this unit:

- **`TrackConsent`**: the card list is now a polite live region — a gate that
  opens while the person watches is SAID ("questions arrive as additions"),
  and settled churn does not chatter.
- **`ArtifactPane`**: the shown station's panel is polite — a spec saved or a
  decision recorded during a walk is announced rather than silently
  repainting.

Both are additions-only announcements on data that only changes when something
actually happened.

## Triaged, queued (not forgotten)

Nine remaining silent pollers triaged by whether a person tracks their changes:
`ChangesPanel`/`PreviewPanel`/`MissionOrchestratorDetail` (studio workbench,
4s polls) — next unit; `AskRunCard`, `AgentRelay`, `LivePulse`, `AgentRosterPanel`,
`ControlsPanel`, `HeldClaims` — each needs a per-file judgement of what its
change means to say, which is exactly the work R-19 wants done properly.

## Gates

`tsc` 0 · full suite **10,932 pass / 0 fail** · eslint clean · no dev server.
