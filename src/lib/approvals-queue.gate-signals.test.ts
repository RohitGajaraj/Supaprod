/**
 * RPT-32 input half: the tray's gate-signal capture.
 *
 * These guards exist because the flywheel's failure mode is SILENT. A gate
 * event with a null agent_slug or a null workspace_id is accepted by the table,
 * counted in the overall total, and then dropped by every consumer that
 * matters: `readAgentSignals` filters the "(unattributed)" bucket out, and
 * every reader scopes `.eq("workspace_id", ...)`. So a regression here does not
 * throw and does not fail a gate - it just quietly stops the product learning,
 * which is exactly how the pre-2026-08-10 state survived: 113 rows in
 * production, 112 of them demo seed, and the single real one carrying a null
 * workspace that made it invisible.
 *
 * The stub below implements the full `.from().select().eq().maybeSingle()`
 * chain rather than a loose object, because a mock too loose to match the shape
 * it mocks cannot fail when that shape breaks.
 */
import { expect, test, describe } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { GATE_SOURCE, isAgentDrafted, readGateAttribution } from "./approvals-queue.functions";
import type { ApprovalKind } from "./approvals-queue.functions";

const ALL_KINDS: ApprovalKind[] = [
  "tool_call",
  "decision",
  "memory_candidate",
  "house_rule",
  "trust_graduation",
  "spec",
  "opportunity",
  "assumption_challenge",
  "design_gate",
  "playbook_proposal",
];

/** A Supabase stub that honours the exact chain readGateAttribution calls.
 *  Records the table and columns asked for, so a test can assert the read was
 *  aimed at the right row and not merely that something came back. */
function stubDb(row: Record<string, unknown> | null): {
  db: SupabaseClient;
  calls: Array<{ table: string; select: string; id: string }>;
} {
  const calls: Array<{ table: string; select: string; id: string }> = [];
  const db = {
    from(table: string) {
      return {
        select(select: string) {
          return {
            eq(_col: string, id: string) {
              return {
                async maybeSingle() {
                  calls.push({ table, select, id });
                  return { data: row, error: null };
                },
              };
            },
          };
        },
      };
    },
  } as unknown as SupabaseClient;
  return { db, calls };
}

describe("GATE_SOURCE: every federated family can be attributed", () => {
  test("all ten kinds the tray decides have a source row to read", () => {
    for (const kind of ALL_KINDS) {
      expect(GATE_SOURCE[kind], `${kind} has no source entry`).toBeTruthy();
    }
  });

  test("every family that can carry a workspace declares it", () => {
    // trust_graduation is the ONE documented exception: the table predates
    // workspace tenancy. If a migration ever adds the column, this test is the
    // thing that says the map must be updated with it.
    const withoutWorkspace = ALL_KINDS.filter((k) => GATE_SOURCE[k]?.hasWorkspace === false);
    expect(withoutWorkspace).toEqual(["trust_graduation"]);
  });

  test("a family declaring a workspace also selects the column", () => {
    for (const kind of ALL_KINDS) {
      const src = GATE_SOURCE[kind]!;
      if (src.hasWorkspace) {
        expect(src.select, `${kind} claims a workspace but never selects it`).toContain(
          "workspace_id",
        );
      }
    }
  });
});

describe("isAgentDrafted: a human's own draft is never scored as an agent error", () => {
  test("a manually authored decision is not an agent correction", () => {
    expect(isAgentDrafted("decision", { source_kind: "manual" })).toBe(false);
  });

  test("an agent-sourced decision is", () => {
    expect(isAgentDrafted("decision", { source_kind: "mission" })).toBe(true);
    expect(isAgentDrafted("decision", { source_kind: "critic" })).toBe(true);
  });

  test("memory candidates split on the literal user/agent source", () => {
    expect(isAgentDrafted("memory_candidate", { source_kind: "user" })).toBe(false);
    expect(isAgentDrafted("memory_candidate", { source_kind: "agent" })).toBe(true);
  });

  test("a spec is agent-drafted exactly when a model produced it", () => {
    expect(isAgentDrafted("spec", { model: "openai/gpt-5" })).toBe(true);
    expect(isAgentDrafted("spec", { model: null })).toBe(false);
    expect(isAgentDrafted("design_gate", { model: "google/gemini-2.5-pro" })).toBe(true);
  });

  test("families with no human-authored form default to agent-drafted", () => {
    expect(isAgentDrafted("tool_call", {})).toBe(true);
    expect(isAgentDrafted("house_rule", {})).toBe(true);
    expect(isAgentDrafted("playbook_proposal", {})).toBe(true);
  });

  test("an unreadable row is treated as agent-drafted, never silently skipped", () => {
    // Losing the read must not lose the event. The opposite default would make
    // an RLS hiccup look like a clean run of human-authored work.
    expect(isAgentDrafted("decision", null)).toBe(true);
  });
});

describe("readGateAttribution: the two fields that decide whether a row is ever read", () => {
  test("resolves the workspace off the gate's own row", async () => {
    const { db, calls } = stubDb({ workspace_id: "ws-9", source_kind: "mission" });
    const a = await readGateAttribution(db, "decision", "dec-1");
    expect(a.workspaceId).toBe("ws-9");
    expect(calls[0]).toEqual({ table: "decisions", select: "workspace_id,source_kind", id: "dec-1" });
  });

  test("never yields a null agent slug for a family with a station", async () => {
    // A null slug lands in "(unattributed)", which readAgentSignals filters
    // out - the row would be written and read by nobody. Each family falls back
    // to its station's specialist rather than to null.
    for (const kind of ALL_KINDS) {
      const { db } = stubDb({ workspace_id: "ws-1" });
      const a = await readGateAttribution(db, kind, "id-1");
      if (kind === "trust_graduation" || kind === "playbook_proposal") continue;
      expect(a.agentSlug, `${kind} resolved to an unattributed slug`).toBeTruthy();
    }
  });

  test("an explicit agent_slug on the row wins over the station fallback", async () => {
    const { db } = stubDb({ workspace_id: "ws-1", agent_slug: "scout", tool_name: "repo.read" });
    const a = await readGateAttribution(db, "tool_call", "ap-1");
    expect(a.agentSlug).toBe("scout");
    expect(a.toolName).toBe("repo.read");
  });

  test("trust_graduation reports no workspace rather than inventing one", async () => {
    // Filing an event under the wrong workspace is the WM-F1 defect: it is
    // recalled for the wrong future call, which is worse than not recalling it.
    const { db } = stubDb({ agent_slug: "builder" });
    const a = await readGateAttribution(db, "trust_graduation", "tg-1");
    expect(a.workspaceId).toBeNull();
    expect(a.agentSlug).toBe("builder");
  });

  test("a throwing read degrades to a recordable attribution, never a thrown gate", async () => {
    const db = {
      from() {
        throw new Error("RLS refused");
      },
    } as unknown as SupabaseClient;
    const a = await readGateAttribution(db, "spec", "prd-1");
    expect(a.agentDrafted).toBe(true);
    expect(a.workspaceId).toBeNull();
  });

  test("a missing row still attributes to the family's station", async () => {
    const { db } = stubDb(null);
    const a = await readGateAttribution(db, "spec", "prd-gone");
    expect(a.agentSlug).toBeTruthy();
    expect(a.agentDrafted).toBe(true);
  });
});
