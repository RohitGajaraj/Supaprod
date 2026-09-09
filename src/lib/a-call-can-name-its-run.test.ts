/**
 * ── A CALL CAN NAME ITS RUN ──────────────────────────────────────────────────
 *
 * Lane 1's fifth review, measured on production 2026-09-09: of 21 pending
 * calls, none could be traced to a run by any path, so the Inbox could not
 * open the work a call belongs to and the layers could not be stitched from
 * either side. The link was already on the write: the loop stamps
 * `agent_approvals.run_id` on every gate it raises, and `agent_runs.track_id`
 * on every spine run. Nothing read it. The govern read resolves it now in the
 * hop it already makes for the live-work check, and the queue carries it.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const GOVERN = readFileSync("src/lib/governance.functions.ts", "utf8");
const QUEUE = readFileSync("src/lib/approvals-queue.functions.ts", "utf8");
const LOOP = readFileSync("src/lib/ai/loop.server.ts", "utf8");

describe("a call can name its run", () => {
  it("the write records the run, which is what makes the link possible", () => {
    const at = LOOP.indexOf('.from("agent_approvals")\n        .insert({');
    expect(at).toBeGreaterThan(-1);
    const insert = LOOP.slice(at, LOOP.indexOf("})", at));
    expect(insert).toContain("run_id: runId");
  });

  it("the read carries run_id off the gate", () => {
    expect(GOVERN).toContain("created_at,decided_at,error,run_id");
    expect(GOVERN).toContain("run_id: string | null;");
  });

  it("and resolves the track in the hop it already makes, not a new one", () => {
    const at = GOVERN.indexOf("const [missions, runsRes, histRes, learningsRes]");
    expect(at).toBeGreaterThan(-1);
    const hop = GOVERN.slice(at, GOVERN.indexOf("]);", at));
    expect(hop).toContain('.select("id,mission_id,track_id,status,created_at")');
    expect(hop).toContain("mission_id.in.");
    expect(hop).toContain("id.in.");
    // One read for both questions: the live-work check and the run's track.
    expect(hop.match(/\.from\("agent_runs"\)/g) ?? []).toHaveLength(1);
  });

  it("the gate carries the track it belongs to, null when it has none", () => {
    expect(GOVERN).toContain("trackId: a.run_id ? (trackByRun.get(a.run_id) ?? null) : null,");
    expect(GOVERN).toContain("trackId: string | null;");
  });

  it("the queue's tool call carries it, and every other family declares it null", () => {
    expect(QUEUE).toContain("trackId: (a as { trackId?: string | null }).trackId ?? null,");
    // Declared on purpose per family, the rule gatesLiveWork already follows.
    const declared = QUEUE.match(/trackId: null,/g) ?? [];
    expect(declared.length).toBeGreaterThanOrEqual(8);
  });
});
