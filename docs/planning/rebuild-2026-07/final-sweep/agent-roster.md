# The Agent Roster — the final concrete set (founder ruling A8)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> One agent per job, no duplicates, every question answered: what it does, when it runs, where its work appears, what tools it holds, how you instruct it. Ground truth behind every row: `audit/agent-roster-audit.md`. End users still experience one coherent system (§6.4); this roster is the admin/operator view.

## The 13

| Agent | Job (one line) | Invoked when | Work appears in | Tools it holds | How you instruct it |
| --- | --- | --- | --- | --- | --- |
| **Chief of Staff** (orchestrator) | Plans the mission, dispatches the right specialist, never does specialist work itself | Every command-bar intent that needs more than one step; re-plans stalled passes | The spine, the activity trace, Approvals | mission plan/dispatch/observe, handoff | Workspace memory + house rules shape its planning; its system prompt is versioned in the prompt store |
| **Watch** (discovery-scout) | Mines connected sources for signals and frames opportunities | Signal crons (sense), "watch X" intents | Evidence doors, what-to-build proposals | workspace search, signal log, memory | Connect or disconnect sources; house rules for what counts as signal |
| **Research** (researcher) | Answers one question across the web and the workspace | "research X" intents, plan-stage gaps | Plan documents, evidence lines | workspace + web search/fetch/crawl | Scope in the intent itself; memory recalls prior findings |
| **Listen** (customer-insights) | Clusters feedback into named themes | Feedback ingestion, "what are users saying" | Evidence doors, Grow digest | workspace search, signal log | Which feedback sources are bound in Settings |
| **Prioritize** (strategist) | Scores and ranks opportunities | After clustering; "what should we build next" | Proposal cards with ICE + reasoning | workspace search, task list | Rejecting proposals teaches it; ICE feedback loops from Learn |
| **Challenge** (critic) | Red-teams a decision or spec; ship, revise, or kill | Before any plan sign-off; on demand | Verdict chips on proposals and specs | read-only search | Its verdicts calibrate against your approvals over time |
| **Draft** (prd-writer) | Turns an approved call into a cited spec | Plan stage, after a proposal is approved | The plan document face | workspace search, notes | Edit the spec in place; your edits are its lessons |
| **Plan** (sprint-planner) | Decomposes a spec into ordered tasks | After spec approval | Build-stage pass list | tasks create/list | Task edits and reorderings feed back |
| **Design** (ux-architect) | Maps flows and screen states before build | Design stage, "design a mockup" intents | Design-stage previews | workspace search, notes | Design memory: approved patterns become its conventions |
| **Engineer** (builder) | Writes the change, stages it, opens the PR | Build stage passes | The code canvas, PRs, diffs | repo read/search, stage/commit/PR | Repo conventions from memory; per-tool approval modes |
| **Review** (qa) | Reviews the diff; ship or block | After Engineer stages work | CI verdicts on passes | repo read, CI read | Blocking reasons are recorded and learned |
| **Announce** (release) | Release notes, changelog, launch copy | Ship success triggers Launch drafting | The launch kit | notes | Edit any asset; tone corrections persist |
| **Measure** (data-analyst) | Compares predicted vs. actual outcomes | Grow stage, outcome windows closing | Grow digest, learnings | memory promote | Verdicts (validated/mixed/missed) train prioritization |

**Engine functions, not agents:** event routing ("reactor") and memory consolidation ("archivist") are plain platform functions; they stop being presented as agents until they log real runs under their own identity.

## How invocation actually works (one mechanism, three doors)

Every agent is reached the same way: **(intent or signal) → the Chief of Staff plans → specialists execute → gates in Approvals.** The user never picks an agent; the router does. Power users can address one directly through the command bar ("ask Research to..."), which simply constrains the plan.

## How you tweak an agent

1. **Approve and reject its work** — every decision is recorded and recalled (the memory loop).
2. **House rules** — plain-sentence conventions that graduate from memory candidates via Approvals.
3. **Per-agent autonomy** — trust arcs set how much runs unattended vs. gated (Settings → Agents).
4. **Prompt versions** — operator-level, in the prompt store with rollback (engine room · quality).

## Cleanup this sweep ships

- Settings renders the catalog names + jobs above (not raw DB names) so every agent is recognizable.
- The seed stops creating the six duplicate slugs (fix exists; production application is morning-queue item 8).
- Docs stop saying "19 agents"; the honest number is 13.
- Metric labels (`contract-analyst`, `spec-drafter`) get renamed so analytics stops inventing agents.
