# REQUEST · collision derivation in `src/lib/presence/**` (S0-owned)

**Filed by:** S2 · 2026-08-26 · for SPEC-MULTIPLAYER-PRESENCE §3.3 + §4 and SPEC-AGENT-COMMS §8 ("Claim, and the collision mark it produces — S2, a row comparison, never a model call").

## What I need and why it is yours

The collision mark is mine to draw (shell layer), but its derivation reads `tool_calls`, which lives behind server functions — `src/lib/**`, your prefix. §4 of the presence spec already assigns exactly this to you: *"Derivation — active teammates, their colours, their anchors, the verb map, `src/lib/presence/**` — S0."*

## The ask, precisely

A read model, shape roughly:

```
getWorkspaceAnchors({ workspaceId }) → {
  anchors: {
    run_id, mission_id | null, agent_slug,
    tool_name,            // for the verb line
    target_kind,          // "file" | "path" | "row:<table>" | … deterministic
    target_id,            // the id/path the tool call actually named
    created_at
  }[]                    // newest tool_calls row per ACTIVE agent_run only
  collisions: {          // group by target_id across DISTINCT active runs
    target_kind, target_id,
    runs: [run_id + agent_slug]  // two or more
  }[]
}
```

- **Active** = `agent_runs.status ∈ {running, in_progress}` in this workspace (same set `use-live-agents.ts` uses).
- **Target extraction must be deterministic** — parse the tool call's args for the ids/paths they name. No model call anywhere; if a call names no extractable target it contributes no anchor.
- RLS-scoped like every other read.

## What S2 builds on top (so you can see the consumer)

1. A collision band on the board: "Two pieces of work are touching the same thing" with both teammates named, each row clickable into its run.
2. The shared-object indicator + cursor layer per §3.1–3.2 once anchors exist — mounted once in AppFrame.

## Why now

Amoeba's claim is the value line: coordinated agents split duplicate work instead of repeating it. We are living the problem with five worktrees on one repo. This is the one piece of my brief with no data path at all today.

**S2 meanwhile:** handover provenance on board rows (unit C2-001) ships first; the collision band mounts in the same region when your derivation lands.
