/**
 * RPT-32 END TO END: a human decides, and a number the product acts on moves.
 *
 * The pieces of this loop each had their own test and the loop itself had none,
 * which is exactly how it ran starved for months while every part of it passed.
 * The table, the normalizer, the rollup, the writer and the consumer were all
 * green; nothing asserted that a decision at the tray becomes a correction rate
 * self-improve can read.
 *
 * So this test walks the whole path with no mocking of the logic under test:
 *
 *   decide at the tray
 *     -> readGateAttribution        (which agent, which workspace)
 *     -> buildGateEventRow          (the row that lands in human_gate_events)
 *     -> summarizeGateSignals       (the per-agent rollup)
 *     -> the correction rate self-improve's readAgentSignals consumes
 *
 * Only Supabase is stubbed, and it is stubbed faithfully enough to fail when
 * the shape changes: the insert captures the real row, and the reads honour the
 * real chains. A mock too loose to match the shape it mocks cannot fail when
 * that shape breaks, which is a lesson this repo already paid for once.
 */
import { expect, test, describe } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readGateAttribution } from "./approvals-queue.functions";
import type { ApprovalKind } from "./approvals-queue.functions";
import { recordGateSignalCore } from "./gate-signals.functions";
import { summarizeGateSignals } from "./gate-signals";

const USER = "11111111-1111-1111-1111-111111111111";
const WS = "22222222-2222-2222-2222-222222222222";

type Captured = Record<string, unknown>;

/** Supabase stub: real `.from().select().eq().maybeSingle()` for the
 *  attribution read, real `.from().insert()` capture for the write. */
function stubDb(sourceRow: Record<string, unknown> | null): {
  db: SupabaseClient;
  inserted: Captured[];
} {
  const inserted: Captured[] = [];
  const db = {
    from(table: string) {
      return {
        select(_sel: string) {
          return {
            eq(_c: string, _v: string) {
              return {
                async maybeSingle() {
                  return { data: sourceRow, error: null };
                },
              };
            },
          };
        },
        async insert(row: Captured) {
          if (table !== "human_gate_events") {
            throw new Error(`unexpected insert into ${table}`);
          }
          inserted.push(row);
          return { error: null };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { db, inserted };
}

/** One trip through the real path: attribute the gate, then record it. */
async function decideAndRecord(
  kind: ApprovalKind,
  sourceRow: Record<string, unknown> | null,
  verdict: "approve" | "reject",
): Promise<Captured[]> {
  const { db, inserted } = stubDb(sourceRow);
  const a = await readGateAttribution(db, kind, "subject-1");
  if (!a.agentDrafted) return inserted; // a human's own draft is not scored
  await recordGateSignalCore(db, USER, {
    gateType: verdict === "approve" ? "approval" : "rejection",
    subjectType: kind,
    subjectRef: "subject-1",
    agentSlug: a.agentSlug,
    toolName: a.toolName,
    verdict: verdict === "approve" ? "approved" : "rejected",
    workspaceId: a.workspaceId,
  });
  return inserted;
}

describe("a decision at the tray reaches the table, in a form a reader can use", () => {
  test("the row carries the two fields that decide whether anyone ever reads it", async () => {
    const rows = await decideAndRecord(
      "tool_call",
      { workspace_id: WS, agent_slug: "builder", tool_name: "repo.write" },
      "reject",
    );
    expect(rows).toHaveLength(1);
    const r = rows[0];
    // Workspace: every consumer scopes `.eq("workspace_id", ...)`. The one real
    // row this product ever captured carried NULL here and was invisible.
    expect(r.workspace_id).toBe(WS);
    // Agent: readAgentSignals filters the "(unattributed)" bucket OUT, so a
    // null slug is a row that is stored and read by nobody.
    expect(r.agent_slug).toBe("builder");
    expect(r.gate_type).toBe("rejection");
    expect(r.subject_type).toBe("tool_call");
    expect(r.user_id).toBe(USER);
  });

  test("a family with no explicit slug still attributes, never to null", async () => {
    // `decision` carries no agent_slug column; it must fall back to its
    // station's specialist rather than landing unattributed.
    const rows = await decideAndRecord(
      "decision",
      { workspace_id: WS, source_kind: "mission" },
      "approve",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].agent_slug).toBeTruthy();
    expect(rows[0].agent_slug).not.toBe("(unattributed)");
  });

  test("a human judging their OWN draft writes nothing at all", async () => {
    // Not a silent skip of telemetry: it is a refusal to score a human's own
    // work as an agent's error, which would bias every rate downstream.
    const rows = await decideAndRecord(
      "decision",
      { workspace_id: WS, source_kind: "manual" },
      "reject",
    );
    expect(rows).toHaveLength(0);
  });
});

describe("the rows become the number self-improve acts on", () => {
  test("four decisions on one agent produce its real correction rate", async () => {
    const src = { workspace_id: WS, agent_slug: "builder", tool_name: "repo.write" };
    const rows: Captured[] = [];
    // One clean approval and three interventions: the human had to step in on
    // three of four calls.
    rows.push(...(await decideAndRecord("tool_call", src, "approve")));
    rows.push(...(await decideAndRecord("tool_call", src, "reject")));
    rows.push(...(await decideAndRecord("tool_call", src, "reject")));
    rows.push(...(await decideAndRecord("tool_call", src, "reject")));

    const { perAgent, overall } = summarizeGateSignals(rows as never);
    expect(perAgent.builder.total).toBe(4);
    expect(perAgent.builder.approved).toBe(1);
    expect(perAgent.builder.corrected).toBe(3);
    expect(perAgent.builder.correctionRate).toBeCloseTo(0.75, 5);
    expect(overall.total).toBe(4);
  });

  test("two agents are ranked apart, which is the whole point of attributing", async () => {
    const rows: Captured[] = [];
    rows.push(
      ...(await decideAndRecord(
        "tool_call",
        { workspace_id: WS, agent_slug: "trusted" },
        "approve",
      )),
    );
    rows.push(
      ...(await decideAndRecord(
        "tool_call",
        { workspace_id: WS, agent_slug: "trusted" },
        "approve",
      )),
    );
    rows.push(
      ...(await decideAndRecord("tool_call", { workspace_id: WS, agent_slug: "shaky" }, "reject")),
    );
    rows.push(
      ...(await decideAndRecord("tool_call", { workspace_id: WS, agent_slug: "shaky" }, "reject")),
    );

    const { perAgent } = summarizeGateSignals(rows as never);
    expect(perAgent.trusted.correctionRate).toBe(0);
    expect(perAgent.shaky.correctionRate).toBe(1);
    // The ordering is the product behaviour: a lower rate is a more
    // trustworthy agent, and this is what promotion decisions read.
    expect(perAgent.trusted.correctionRate).toBeLessThan(perAgent.shaky.correctionRate);
  });

  test("every row survives readAgentSignals' unattributed filter", async () => {
    // readAgentSignals drops the "(unattributed)" bucket before building
    // proposals. A loop that writes rows which all land in that bucket is
    // indistinguishable, from the consumer's side, from the starved state this
    // work fixed. So assert the bucket is empty across every family.
    const families: Array<[ApprovalKind, Record<string, unknown>]> = [
      ["tool_call", { workspace_id: WS, agent_slug: "builder" }],
      ["decision", { workspace_id: WS, source_kind: "mission" }],
      ["spec", { workspace_id: WS, model: "openai/gpt-5" }],
      ["design_gate", { workspace_id: WS, model: "openai/gpt-5" }],
      ["memory_candidate", { workspace_id: WS, source_kind: "agent" }],
      ["house_rule", { workspace_id: WS, agent_slug: "librarian" }],
      ["opportunity", { workspace_id: WS }],
      ["assumption_challenge", { workspace_id: WS }],
    ];
    const rows: Captured[] = [];
    for (const [kind, src] of families) {
      rows.push(...(await decideAndRecord(kind, src, "reject")));
    }
    expect(rows.length).toBe(families.length);

    const { perAgent, overall } = summarizeGateSignals(rows as never);
    expect(perAgent["(unattributed)"]).toBeUndefined();
    // And the totals reconcile: nothing was dropped on the way through.
    const summed = Object.values(perAgent).reduce((n, s) => n + s.total, 0);
    expect(summed).toBe(overall.total);
    expect(overall.total).toBe(families.length);
  });
});

describe("the send-back note, which is the only gate that records a reason", () => {
  test("the human's own words reach the row self-improve reads back verbatim", async () => {
    const { db, inserted } = stubDb({ workspace_id: WS, model: "openai/gpt-5" });
    const a = await readGateAttribution(db, "spec", "prd-1");
    await recordGateSignalCore(db, USER, {
      gateType: "rejection",
      subjectType: "spec",
      subjectRef: "prd-1",
      agentSlug: a.agentSlug,
      verdict: "sent_back",
      diffSummary: "The success metric is not measurable. Name the event.",
      workspaceId: a.workspaceId,
    });
    expect(inserted).toHaveLength(1);
    // loadFlagEvidence renders this string into the proposal as "the human
    // changed: ...". It is the highest-signal text the product ever captures.
    expect(inserted[0].diff_summary).toBe("The success metric is not measurable. Name the event.");
    expect(inserted[0].verdict).toBe("sent_back");
    expect(inserted[0].workspace_id).toBe(WS);
    // A send-back is an intervention, so it must count as a correction.
    const { overall } = summarizeGateSignals(inserted as never);
    expect(overall.corrected).toBe(1);
    expect(overall.correctionRate).toBe(1);
  });
});
