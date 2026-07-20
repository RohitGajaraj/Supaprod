# The Love-Gate · reimagined Mission Control

> _Created: 2026-07-20 · Last updated: 2026-07-20_

The Love-Gate is the standing companion from `AGENTS.md`: a surface is not done
until it is **enterprise-credible AND consumer-grade at the same time**, verified
on a **fresh production account**. This file is the concrete, repeatable gate for
the front-end reimagining (the `/m` room, its seven faces, the Approvals tray,
Threads, Artifacts, the reclustered Settings, and the one-question onboarding),
plus the pre-deploy dry-run recorded against the sandbox branch
`sandbox/mission-control-v2`.

Honesty note on scope: the **binding** run is on a fresh production account, and
that can only happen after the Gate-2 merge deploys this branch. Until then this
is a **dry run on the dev server** (Node 26, `localhost:8080`, demo account).
Every item below is marked with what was actually observed.

---

## The checklist (run top to bottom on a fresh account)

### Consumer-grade (would a smart non-technical person feel this is for them?)

1. **One primary action per screen.** Ember marks exactly one thing; everything
   else is quiet. No screen presents two competing calls to action.
2. **No pressure, no cognitive load.** First-run asks at most one optional
   question; no forward path is ever disabled or gated behind input.
3. **Calm, humanized voice.** No AI-tell, no em/en dashes, no boilerplate
   onboarding ("Welcome to X", "Let's get started"). Copy sounds like a person.
4. **Empty states teach.** Every empty surface names who acts next and the one
   action that fills it, never a blank panel.
5. **Loading is shaped, not blank.** Skeletons match the arriving content.
6. **Costs stay quiet.** No credit/token/dollar figures inline on any surface
   (behind Details only).
7. **Chromeless moments stay chromeless.** A first-run / focus moment shows no
   nav rail, banner, or dock.

### Enterprise-credible (would a buyer trust it with real work?)

8. **Honest states.** No mocked data; errors surface plainly with a recovery
   verb; a failed read never wears an empty state's clothes.
9. **No claim outruns wiring.** Every verb the UI shows performs a real backend
   action, or is not shown (or degrades with an honest message).
10. **Governance is visible.** Approvals, autonomy/oversight modes, and the
    receipts are reachable, not hidden.
11. **Accessibility holds.** Focus rings on every interactive element, real
    labels, keyboard paths.
12. **Zero console errors** on every surface.

---

## Dry-run results (sandbox branch, 2026-07-20)

| Surface | Result | Notes |
| --- | --- | --- |
| One-question onboarding (`/start`) | PASS (after fix) | One optional question; forward action never disables ("Walk me in" / "Continue"); distinctive voice ("Step one of one", "This isn't a form"); **fixed**: was rendering inside the app shell (nav rail + Sample-data banner + focus dock), now clean full-viewport. 0 errors. |
| The room (`/m/$productId`) | PASS | Seven faces render real data; one ember locus; Spine reads real loop state; optimistic decide (signature moment) fires; 0 errors (verified across the session). |
| Approvals tray | PASS | Approve / Send back (revisable only) / Decline / Snooze, each honest; send-back + snooze degrade with an honest message until their tables land at Gate-2. |
| Threads (`/threads`) | PASS, one follow-on | Real day-grouped conversations, search, read preview, rename, copy-link; 0 errors. FOLLOW-ON: renders inside the old Obsidian AppShell chrome rather than a room-consistent/chromeless frame (visual consistency, not a blocker; the whole app adopts the reimagined shell at Gate-2). |
| Artifacts (`/artifacts`) | PASS, same follow-on | 23 real artifacts, kind chips, open links; 0 errors. Same shell-consistency follow-on as Threads. |
| Settings (5 groups + Autonomy & approvals) | PASS | Five groups render; every legacy section reachable; Autonomy surface shows kill switch + per-tool oversight modes; 0 errors. |
| Seed richness | PASS | v1 already covers 20+ surfaces on two products; v2 adds the review-status spec so the tray's full verb set + signature moment are experienceable (applies at Gate-2). |

## Flagged for the binding run (fresh production account, post-Gate-2)

- Re-run every row above on a genuinely fresh signup (not the demo), with the
  seed flags on (`SAMPLE_WORKSPACE_ENABLED=1`), so the sample-workspace path and
  the migrations (`approval_snoozes`, `approval_feedback`, `sample-mc-v2`) are
  live and the gate interactions are exercised end to end.
- Resolve the Threads/Artifacts shell-consistency follow-on as part of the
  app-wide reimagined-shell adoption.

## Related

- [`docs/features/sample-workspace-seed.md`](../../features/sample-workspace-seed.md) · the rich seed the room stands on
- [`AGENTS.md`](../../../AGENTS.md) · the standing Love-Gate companion

---

## Fidelity rebuild (2026-07-20, overnight run) · mockups as the floor, beyond them

Founder ruling: the mockup HTMLs are the BASELINE, and the delivered surfaces
must meet and exceed them, wired to real data. The Phase 3 faces had shipped as
thin lists; this run rebuilt them rich. All on `sandbox/mission-control-v2`,
each tsc-clean + live-verified with 0 console errors, committed and pushed.

| Surface | Rebuilt to | Real data | Commit |
| --- | --- | --- | --- |
| Build face | live build-deck: plan flow (done/now/next), files-changed rail, session card, changeset, CI checks, terminal | `getStudioSession` | `50f47b8c` |
| Decide face | ranked, red-teamed board: ICE bars, verdict chip, the Critic's risks + kill-criteria inline | `listOpportunities` + `critic_review` | `c82c0f5c` |
| Design face | design workbench: prototype switcher + provenance + live prototype in a browser-chrome device frame | `listPrototypes` + `getPersistedScaffold` | `28a0bbdd` |
| Threads | 3-pane home: rail (Views: All / Today / This week, live counts) + list + preview | `listThreads` / `getThread` | `b7cf3af0` |
| Room rest face (new) | product-at-rest Canvas: computed headline, facts, the loop stage-by-stage (clickable), Shipped | `getLoopState` + `listDeployments` | `cef02bf5` |
| Learn / Evidence / Ship | Learn: "what the loop learned" (re-scored bets) + launches; Evidence: source-grouped summary; Ship: release summary | `getOutcomeData` / `listSignals` / `listDeployments` | `e42d1b6a` |
| Gated room + tray (screen-4) | already satisfied by the Phase 3/4 gate card + send-back work (verified live: rich gate cards, keyboard legend, one-count-one-source) | `getApprovalsQueue` | prior |

Full sweep at close: `tsc --noEmit` clean, 148 mission/surface/seed tests pass,
`bun run build` succeeds.

### Deliberately not changed
- **Onboarding (`/start`) kept minimal.** `screen-1-first-run` is richer, but the
  founder explicitly steered onboarding to a frictionless, delightful,
  one-question screen. Keeping that win is the right call, not a richness pass.

### Remaining (documented, not silently cut)
- **Settings Brand feed — DONE** (`e5cac045`, no migration): Workspace > Brand
  renders the design-memory feed (import URL / paste / defaults, learns from
  approve/reject).
- **Journey / flow (`screen-5`) — ADDRESSED**: screen-5 is the room during a
  journey (the plan/reading/output triple + handoff), not a standalone view.
  Met by the Build plan-flow, the Plan face's spec document, and the NextLine
  journey handoffs. No separate all-journeys overview exists in the mockups.
- **Onboarding (`screen-1`) — deliberately kept minimal** per founder steering
  (frictionless one-question `/start`).
- **Migration-bearing follow-ons (apply at the Gate-2 merge, still open):**
  Artifacts versions + rename/delete + per-product tab; Threads folders + FTS +
  save-to-brain; Settings Memory->Brain move + `/sync` fold. Each needs a new
  table/column, so they land with the merge; the reads must degrade gracefully
  until then (the snooze/feedback pattern).

## Final verification (2026-07-20)
`tsc --noEmit` clean · `bun run build` succeeds · full `bun test` = 5295 pass
with only the 16 pre-existing fails + 10 errors (proven pre-existing via
`git stash`, not from this work; every touched scope, 148 mission/surface/
settings/seed tests, passes). Branch `sandbox/mission-control-v2` is clean and
HEAD == origin. Not merged to main; held for the founder's Gate-2 review.
