/**
 * Test suite for agent loop orchestration (loop.server.ts).
 * Coverage: runAgentLoop, resumeAgentLoop, executeApproval, loadVoiceAnchorBlock.
 *
 * Key scenarios:
 * - Fresh dispatch: agent lookup, workspace resolution, tool cap enforcement
 * - Concurrency: backpressure (MAX_RUNNING_PER_WORKSPACE), race conditions
 * - Resume paths: queued → running, approval-gated → running, checkpoint recovery
 * - Tool execution: approval modes (auto/confirm/review), tool registry lookup
 * - Error handling: DB failures, missing agents, governance halts, tool failures
 * - Credit refunds: abandoned runs (governance-halted, provider-failed)
 * - Voice anchor: load, format, error-safe fallback
 */

import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  runAgentLoop,
  resumeAgentLoop,
  executeApproval,
  loadVoiceAnchorBlock,
} from "./loop.server";

/**
 * Supabase mock builder — chainable .from().select().eq() pattern
 * following drift.server.test.ts conventions. Returns Promises of
 * shaped responses with {data, error}.
 */
function createMockSupabaseClient(): SupabaseClient {
  const responses = new Map<string, Record<string, unknown>>();
  const queries = new Map<string, Array<{ table: string; op: string }>>();

  const mockQueryBuilder = (table: string) => ({
    select: (columns?: string) => ({
      eq: (field: string, value: unknown) => ({
        maybeSingle: async () => {
          const key = `${table}|${field}=${JSON.stringify(value)}`;
          const data = responses.get(key);
          return { data, error: null };
        },
        single: async () => {
          const key = `${table}|${field}=${JSON.stringify(value)}`;
          const data = responses.get(key);
          if (!data) return { data: null, error: new Error(`No row found in ${table}`) };
          return { data, error: null };
        },
        in: (inField: string, inValues: unknown[]) => ({
          select: (selectCols?: string) => ({
            head: async () => ({
              count: 0,
              error: null,
            }),
          }),
        }),
      }),
      eq: (field: string, value: unknown) => ({
        maybeSingle: async () => {
          const key = `${table}|${field}=${JSON.stringify(value)}`;
          const data = responses.get(key);
          return { data, error: null };
        },
      }),
      order: (field: string, opts?: { ascending?: boolean }) => ({
        limit: (n: number) => ({
          maybeSingle: async () => {
            // Return the most recent checkpoint
            return { data: null, error: null };
          },
        }),
      }),
    }),
    insert: (row: Record<string, unknown>) => ({
      select: (cols?: string) => ({
        single: async () => {
          const inserted = { ...row, id: crypto.randomUUID() };
          return { data: inserted, error: null };
        },
      }),
    }),
    update: (patch: Record<string, unknown>) => ({
      eq: (field: string, value: unknown) => ({
        eq: (field2: string, value2: unknown) => ({
          select: (cols?: string) => ({
            __exec: async () => ({ data: [{ id: crypto.randomUUID() }], error: null }),
          }),
        }),
        select: (cols?: string) => ({
          __exec: async () => ({ data: [{ id: crypto.randomUUID() }], error: null }),
        }),
      }),
    }),
  });

  return {
    from: (table: string) => mockQueryBuilder(table),
    rpc: async (name: string) => {
      if (name === "current_user_default_workspace") {
        return { data: "default-ws-id", error: null };
      }
      return { data: null, error: null };
    },
  } as unknown as SupabaseClient;
}

describe("loop.server.ts", () => {
  let mockSupabase: SupabaseClient;
  const userId = "user-123";
  const workspaceId = "ws-123";
  const agentSlug = "builder";

  beforeEach(() => {
    mockSupabase = createMockSupabaseClient();
  });

  describe("loadVoiceAnchorBlock", () => {
    it("returns empty string when no voice anchor is set", async () => {
      const result = await loadVoiceAnchorBlock(mockSupabase, userId);
      expect(result).toBe("");
    });

    it("formats and returns voice anchor text when present", async () => {
      // TODO: Mock the profiles query to return voice_anchor_text
      // Expected: includes the text wrapped in --- markers
      // `--- Voice anchor (operator-set, follow this tone and stance) ---\n${text}\n--- End voice anchor ---`
    });

    it("trims whitespace from voice anchor", async () => {
      // TODO: Test that leading/trailing whitespace is removed before formatting
    });

    it("returns empty string on DB error (non-fatal)", async () => {
      // TODO: Mock Supabase error in profiles.select query
      // Expected: error logged to console.error, empty string returned
    });

    it("handles null voice_anchor_text gracefully", async () => {
      // TODO: Mock profiles query returning { voice_anchor_text: null }
      // Expected: empty string
    });
  });

  describe("runAgentLoop", () => {
    it("throws when agent not found", async () => {
      // TODO: Mock agents query to return null
      // Expected: throws `Unknown agent: ${agentSlug}`
    });

    it("throws when agent is disabled", async () => {
      // TODO: Mock agents query to return { ...agent, enabled: false }
      // Expected: throws `Agent is disabled: ${agentSlug}`
    });

    it("creates agent_runs row with correct fields", async () => {
      // TODO: Verify that agent_runs.insert is called with:
      // - user_id, agent_id, agent_slug, agent_name
      // - input (goal), status="running", workspace_id
      // - mission_id, mission_spend_cap_usd, mission_token_cap
      // - model (resolved or input.model)
    });

    it("resolves model to 'auto' → vault-aware resolver", async () => {
      // TODO: Test that input.model='auto' triggers resolveBestAgentModelForUser
      // Expected: the resolved model is persisted in agent_runs
    });

    it("uses input.model when provided (override)", async () => {
      // TODO: Test that input.model='qwen/qwen-plus' skips resolver, uses value directly
    });

    it("applies backpressure when MAX_RUNNING_PER_WORKSPACE exceeded", async () => {
      // TODO: Mock agent_runs.select(...).count to return count >= 5
      // Expected: returns LoopResult with status="queued", no run steps
      // Expected: agent_runs.insert called with status="queued"
    });

    it("caps tools by agent.max_tool_risk", async () => {
      // TODO: Mock agent with max_tool_risk='medium'
      // TODO: Mock agent_tools to return mix of low/medium/high tools
      // Expected: tools passed to loop only include low/medium, not high
    });

    it("throws on agent_runs insert error (defense-in-depth)", async () => {
      // TODO: Mock agent_runs.insert to return error
      // Expected: throws `agent_runs insert failed: ${error.message}`
    });

    it("initializes loop with system prompt + tools", async () => {
      // TODO: Test that describeToolsForPrompt is called with enabled tools
      // Expected: steps include initial system/tool prompt
    });
  });

  describe("resumeAgentLoop", () => {
    it("throws when run not found", async () => {
      // TODO: Mock agent_runs query to return null
      // Expected: throws `run not found: ${runId}`
    });

    it("throws when agent not found for run", async () => {
      // TODO: Mock agent_runs query success, agents query null
      // Expected: throws `agent not found for run ${runId}`
    });

    it("returns early when run.status=waiting_approval and blocking approvals exist", async () => {
      // TODO: Mock run.status='waiting_approval'
      // TODO: Mock agent_approvals.select with count > 0 (pending/approved status)
      // Expected: returns LoopResult with final="Still waiting on operator approval."
      // Expected: does NOT promote status to running
    });

    it("promotes queued → running via compare-and-swap", async () => {
      // TODO: Mock run.status='queued'
      // TODO: Mock agent_runs.update to match on status='queued'
      // Expected: compare-and-swap guards race condition (only one resumer proceeds)
    });

    it("promotes waiting_approval → running after all approvals executed", async () => {
      // TODO: Mock run.status='waiting_approval'
      // TODO: Mock agent_approvals query to return count=0 (no pending/approved)
      // Expected: agent_runs.update called with status='running'
    });

    it("returns early if another worker already promoted run", async () => {
      // TODO: Mock agent_runs.update to return empty promoted[] (compare-and-swap lost)
      // Expected: returns LoopResult with final="Already being resumed by another worker."
    });

    it("resolves model: stored run.model > checkpoint state > vault resolver", async () => {
      // TODO: Test all three fallback levels
      // Expected: run.model used if present, else checkpoint.state.model, else resolved
    });

    it("loads and resumes from latest checkpoint", async () => {
      // TODO: Mock agent_run_checkpoints query to return state with conv/steps/counters
      // Expected: continues from checkpoint.step_index (not from 0)
    });

    it("starts fresh (step 0) when no checkpoint exists", async () => {
      // TODO: Mock agent_run_checkpoints to return null
      // Expected: startStep = 0, builds system prompt from scratch
    });
  });

  describe("executeApproval", () => {
    it("throws when approval not found", async () => {
      // TODO: Mock agent_approvals query to return null
      // Expected: throws `Approval not found`
    });

    it("throws when approval.status != 'approved'", async () => {
      // TODO: Mock approval with status='pending'
      // Expected: throws `Approval is pending, not approved`
    });

    it("throws when tool not in TOOL_REGISTRY", async () => {
      // TODO: Mock approval with tool_name='unknown.tool'
      // Expected: throws `Unknown tool: unknown.tool`
    });

    it("validates args against tool.argsSchema", async () => {
      // TODO: Mock approval with args that fail schema validation
      // Expected: throws `Bad args: ${parseRes.error.message}`
    });

    it("calls tool.run with correct ToolCtx", async () => {
      // TODO: Mock approval for a known tool (e.g., 'read.file')
      // TODO: Verify tool.run receives ToolCtx with:
      // - supabase, userId, agentSlug, agentId
      // - traceId, runId, missionId, workspaceId
    });

    it("updates approval to executed on success", async () => {
      // TODO: Mock tool.run to return { success: true }
      // Expected: agent_approvals.update called with:
      // - status='executed'
      // - escalation_state='resolved' (fixes live "needs you" count)
      // - result: tool result
    });

    it("marks run as failed if tool execution throws", async () => {
      // TODO: Mock tool.run to throw error
      // Expected: agent_runs.update called with status='failed', output=error.message
    });

    it("marks mission as halted if tool execution throws", async () => {
      // TODO: Mock tool.run to throw error on mission context
      // Expected: missions.update called with status='halted'
      // Expected: recordStageEvent called
    });

    it("updates approval to failed on tool error", async () => {
      // TODO: Mock tool.run to throw
      // Expected: agent_approvals.update called with:
      // - status='failed'
      // - escalation_state='resolved'
      // - error: error.message
    });

    it("clears escalation_state on resolution (bug fix 2026-07-08)", async () => {
      // TODO: Test both success and failure paths
      // Expected: escalation_state='resolved' in both cases
      // Expected: prevents live "needs you" from counting executed gates
    });
  });

  describe("Credit refunds (refundIfAbandoned)", () => {
    it("refunds credits when run is governance-halted", async () => {
      // TODO: Test runAgentLoop with GovernanceHaltError
      // Expected: refundAbandonedRunCredits called with runId
    });

    it("refunds credits when run is provider-failed", async () => {
      // TODO: Test runAgentLoop with provider error
      // Expected: refundAbandonedRunCredits called with runId
    });

    it("is best-effort (never throws)", async () => {
      // TODO: Mock refundAbandonedRunCredits to throw
      // Expected: error logged, loop continues (non-fatal)
    });

    it("no-op when runId is null", async () => {
      // TODO: Test refundIfAbandoned with runId=null
      // Expected: no refund call, returns early
    });

    it("resolves credit account before refunding", async () => {
      // TODO: Test that resolveCreditAccountId is called
      // Expected: no refund if account resolution fails
    });
  });

  describe("Tool mode resolution (resolveToolMode)", () => {
    it("applies seeded mode (user-wide setting)", async () => {
      // TODO: Test agent with tools in different seeded modes (auto/confirm/review)
      // Expected: modeOf map reflects user-wide settings
    });

    it("applies graduated mode override (per-agent-tool)", async () => {
      // TODO: Mock agent_tool_modes table with graduated modes
      // Expected: graduated modes override seeded modes
      // Expected: safety floors still apply after override
    });

    it("applies HIGH_RISK_FORCE_REVIEW floor", async () => {
      // TODO: Test high-risk tool that would be graduated to confirm
      // Expected: final mode is review (floor wins)
    });

    it("applies HIGH_RISK_MIN_CONFIRM floor", async () => {
      // TODO: Test high-risk tool that would be auto
      // Expected: final mode is confirm (floor wins)
    });

    it("applies per-agent max_tool_risk cap", async () => {
      // TODO: Test scoped agent with max_tool_risk='low'
      // TODO: Include tools with risk > low
      // Expected: high-risk tools dropped from registry before enabling
    });

    it("handles pre-migration (agent_tool_modes absent gracefully)", async () => {
      // TODO: Mock agent_tool_modes query to error (table doesn't exist)
      // Expected: logs error, seeded modes stand
      // Expected: loop continues
    });
  });

  describe("Orchestration control flow (ORCHESTRATION_CONTROL_FLOW_TOOLS)", () => {
    it("bypass approval gating for mission.plan", async () => {
      // TODO: Test agent executing mission.plan tool
      // Expected: tool executes inline, never queued for approval
    });

    it("bypass approval gating for mission.dispatch", async () => {
      // TODO: Test agent executing mission.dispatch tool
      // Expected: tool executes inline
    });

    it("bypass approval gating for critic.evaluate", async () => {
      // TODO: Test agent executing critic.evaluate tool
      // Expected: tool executes inline (advisory, side-effect-free)
    });

    it("still gate non-orchestration tools per approval mode", async () => {
      // TODO: Test agent executing studio.commit (not in ORCHESTRATION set)
      // Expected: respects approval mode (auto/confirm/review)
    });
  });

  describe("Studio pause-on-approval gates (PAUSE_ON_APPROVAL_TOOLS)", () => {
    it("pauses run when studio.commit is queued for approval", async () => {
      // TODO: Test tool='studio.commit' with mode='confirm'
      // Expected: agent_runs.status='waiting_approval'
      // Expected: resumeAgentLoop blocks until approval executed
    });

    it("pauses run when studio.pr.open is queued for approval", async () => {
      // TODO: Test tool='studio.pr.open' with mode='confirm'
      // Expected: agent_runs.status='waiting_approval'
    });

    it("pauses run when studio.pr.merge is queued for approval", async () => {
      // TODO: Test tool='studio.pr.merge' with mode='review'
      // Expected: agent_runs.status='waiting_approval'
    });

    it("pauses run when delegate.openhands is queued for approval", async () => {
      // TODO: Test tool='delegate.openhands' with mode='review'
      // Expected: agent_runs.status='waiting_approval'
    });

    it("non-gated tools do NOT pause run (queued but loop continues)", async () => {
      // TODO: Test tool='read.file' with mode='confirm'
      // Expected: agent_runs.status='running' (NOT waiting_approval)
      // Expected: loop continues planning
    });
  });

  describe("Step budget (6-step limit)", () => {
    it("enforces max 6 steps before finalizing", async () => {
      // TODO: Test agent with 6 tool calls
      // Expected: final message "Reached step limit without finalizing."
    });

    it("counts planning thought as a step", async () => {
      // TODO: Mock model to return thought
      // Expected: step counter increments
    });

    it("counts tool call as a step", async () => {
      // TODO: Mock model to return tool_call action
      // Expected: step counter increments, tool executes
    });

    it("final response does not consume step budget", async () => {
      // TODO: Test agent finalizing on step 6
      // Expected: loop stops on final, no "step limit" message
    });
  });

  describe("Edge cases and errors", () => {
    it("handles concurrent identical resume requests (race condition)", async () => {
      // TODO: Simulate two resume workers racing on same run
      // Expected: compare-and-swap ensures only one promotes
    });

    it("logs and recovers from transient tool failures", async () => {
      // TODO: Mock tool to throw temporary error
      // Expected: error logged, agent offered to retry
    });

    it("halts run on governance error (GovernanceHaltError)", async () => {
      // TODO: Mock tool to throw GovernanceHaltError
      // Expected: run marked halted with halted reason
      // Expected: credits refunded
    });

    it("handles missing voice anchor gracefully", async () => {
      // TODO: Mock loadVoiceAnchorBlock to fail
      // Expected: loop continues with empty anchor block
    });
  });
});
