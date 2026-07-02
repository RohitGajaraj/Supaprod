# Critic agent (F-CRITIC-AGENT, v4 stations DEC-02 · DEF-03 · v12 DSN-02)

> _Created: 2026-06-11 · Last updated: 2026-07-03_

The Critic is an adversarial reviewer that red-teams every new opportunity and every freshly drafted PRD before it reaches a human approval gate. It is the demo moment the Strategist → operator-approval handoff needs: instead of approving a raw ICE score, the operator approves a score plus a verdict, top risks, kill criteria, and a list of missing evidence.

**Three lenses (same infra).** Opportunities get the **bet-evaluation** lens (DEC-02). Specs get a **spec-specific red-team** lens (DEF-03): ambiguity, untestable/unmeasurable acceptance criteria, scope creep, unstated assumptions, and missing edge cases, guard-railed to judge only what the spec actually says, never to invent requirements. PRDs and DEF-04 scaffolds additionally get the **design lens** (DSN-02, see below).

## DSN-02 — the design lens

The Critic gains a design dimension, folded onto the existing `CriticReview` shape as an optional `design` field:

- **Heuristic evaluation**: hierarchy (a clear primary action or not), accessibility floors (missing labels, color-only status, icon-only controls with no text), IA laws (inconsistent navigation, redundant destinations).
- **Consistency vs design memory** (DSN-01): when the target's workspace has approved design memory, the lens is handed the same `formatDesignMemoryContext` block DEF-04 scaffolds use, and flags a screen that introduces a pattern the workspace's own standing decisions already settled differently.
- **Receipts**: each finding names the violated `principle` (hierarchy / accessibility / ia / consistency) and, for a consistency violation, the exact `standing_decision` title it conflicts with — never an opaque id.

**Where it runs:**
- **PRDs** — folded directly into `runCritic` (`src/lib/ai/critic.server.ts`): every PRD critic run (inline on `generatePrd`, or a manual re-run) also calls `runDesignCriticLens` and persists the result as `critic_review.design`. Best-effort: a failed design pass never drops the base spec red-team verdict.
- **Scaffolds** — `runScaffoldDesignCritic` (`src/lib/design-scaffold.functions.ts`), a standalone server fn called from a "Check design consistency" button under a generated DEF-04 mockup (`DesignScaffoldPanel.tsx`). Scaffolds have no persisted row (DEF-04 is generate-on-demand), so this runs the lens directly on the mockup's HTML and returns the result to the client, non-persisted.

**Cost note:** the design lens is a second, independent model call (`google/gemini-2.5-flash`, cheaper than the base Critic's `gemini-2.5-pro`) — every PRD critic run now makes two calls instead of one. Accepted as the cost of the feature the spec asked for; the scaffold path is opt-in (a button), so it never rides along uninvited.

**UI:** `CriticBadge.tsx`'s sheet gains a "Design consistency" section (only rendered when `review.design` is present) listing each finding with its principle and standing-decision citation, using the exact same list styling as the existing risk/kill-criteria/missing-evidence sections.

## What ships

- New `critic` agent seeded per user (rose-toned, role-only, no UI presence beyond the badge).
- `runCritic(supabase, userId, target)` helper in `src/lib/ai/critic.server.ts` (moved there in DEC-02-LOOP; re-exported from `discovery.functions.ts` for back-compat), calls Gemini 2.5 Pro with a strict-JSON red-team prompt and writes the result to `opportunities.critic_review` / `prds.critic_review`.
- Auto-attached inline to `promoteThemeToOpportunity`, `promoteSignalToOpportunity`, and `generatePrd` so the verdict lands before the row is shown.
- `runCriticReview` server fn for manual UI re-runs.
- `CriticBadge` component (`src/components/governance/CriticBadge.tsx`) rendered in `OpportunitiesPanel` rows and the PRD detail metadata row.
- **DEF-03 spec lens:** when `runCritic`'s target is a PRD it uses a spec red-team prompt (ambiguity · untestable criteria · scope creep · unstated assumptions · edge cases) instead of the bet prompt; the JSON shape is unchanged (reuses `critic_review`), and `CriticBadge` relabels its sections per kind: the generic "Missing evidence" becomes "Untestable criteria & open questions", and the sheet reads "Spec red-team". The opportunity path is unchanged.

## Verdict shape

```json
{
  "verdict": "ship | revise | kill",
  "summary": "max 240 chars",
  "risks": ["..."],
  "kill_criteria": ["..."],
  "missing_evidence": ["..."],
  "confidence": 0.0,
  "reviewer_model": "google/gemini-2.5-pro",
  "reviewed_at": "ISO timestamp"
}
```

## How to use / verify

- **Find it:** `/product?tab=opportunities` (chip under each title) and `/prds/$id` (chip in the metadata row).
- **Open:** click any chip → side sheet with risks, kill criteria, missing evidence, and a "Re-run Critic" button.
- **Server enforcement:** `runCritic` is best-effort. Failures are swallowed so a missing Critic never blocks the upstream write. Per-row reads use existing `opportunities` / `prds` RLS.
- **Verify:**
  1. Promote a theme via `/product?tab=signals` → open `/product?tab=opportunities` → new row has a verdict chip within ~5s.
  2. Click the chip → side sheet renders the four sections.
  3. Generate a PRD from the opportunity → PRD detail metadata row has a verdict chip.
  4. Click "Re-run Critic" → toast confirms and the chip refreshes with a new `reviewed_at`.

## Routable in-loop (DEC-02-LOOP, 2026-06-17)

Beyond the inline auto-attach, the Critic is a **registered agent-loop tool**: `critic.evaluate` (`{ target_kind: "opportunity" | "prd"; target_id }`) in `TOOL_REGISTRY`, backed by `runCriticTool` in `src/lib/ai/critic.server.ts`. The orchestrator or any specialist can call it to red-team a target **in-loop**, persisting the same `critic_review` — not only via the three inline promotion/spec paths. It is seeded into every user's `agent_tools` (mode `auto`, `built_in`; migration `20260617160000`, new + backfilled users) and is **gating-exempt** (listed in `ORCHESTRATION_CONTROL_FLOW_TOOLS` in `loop.server.ts`) because the verdict is advisory and side-effect-free beyond the row's own column, so it runs inline and can never strand a run waiting on an approval. The verdict never auto-fails dependent work; the caller decides. Promoting the Critic to a full `mission_steps` DAG node (a routed specialist step) is the deferred Phase 2 — it would touch the handoff completion-guard and retry machinery, so it was scoped out to keep this increment's blast radius near zero.

## Related

- [`prd-rag-citations.md`](./prd-rag-citations.md): the companion slice that gives the Scribe its evidence trail.
- [`../strategy/archive/v4-feature-map.md`](../strategy/archive/v4-feature-map.md): DEC-02 (opportunities) + DEF-03 (specs) entries.
- [`../planning/archive/feature-backlog.md`](../planning/archive/feature-backlog.md): live status board entry.