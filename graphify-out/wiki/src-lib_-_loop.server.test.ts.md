# src/lib - loop.server.test.ts

> 66 nodes · cohesion 0.03

## Key Concepts

- **loop.server.test.ts** (70 connections) — `src/lib/ai/loop.server.test.ts`
- **createMockSupabaseClient()** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock the profiles query to return voice_anchor_text** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Test that leading/trailing whitespace is removed before formatting** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock Supabase error in profiles.select query** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock profiles query returning { voice_anchor_text: null }** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock agents query to return null** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock agents query to return { ...agent, enabled: false }** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Verify that agent_runs.insert is called with:** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Test that input.model='auto' triggers resolveBestAgentModelForUser** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Test that input.model='qwen/qwen-plus' skips resolver, uses value directly** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock agent_runs.select(...).count to return count >= 5** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock agent with max_tool_risk='medium'** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock agent_tools to return mix of low/medium/high tools** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock agent_runs.insert to return error** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Test that describeToolsForPrompt is called with enabled tools** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock agent_runs query success, agents query null** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock run.status='waiting_approval'** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock agent_approvals.select with count > 0 (pending/approved status)** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock run.status='queued'** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock agent_runs.update to match on status='queued'** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock agent_approvals query to return count=0 (no pending/approved)** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock agent_runs.update to return empty promoted[] (compare-and-swap lost)** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Test all three fallback levels** (1 connections) — `src/lib/ai/loop.server.test.ts`
- **TODO: Mock agent_run_checkpoints query to return state with conv/steps/counters** (1 connections) — `src/lib/ai/loop.server.test.ts`
- *... and 41 more nodes in this community*

## Relationships

- [src/lib - loop.server.ts](src-lib_-_loop.server.ts.md) (5 shared connections)

## Source Files

- `src/lib/ai/loop.server.test.ts`

## Audit Trail

- EXTRACTED: 135 (100%)
- INFERRED: 0 (0%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*