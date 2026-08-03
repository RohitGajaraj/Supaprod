// Semantic search over the workspace's judgment record.
//
// The tests that matter here are not the formatting ones. They are the three that
// pin the properties this feature exists for: it must never search without a
// workspace (fail closed, or a service_role caller reads every tenant), it must never
// compare vectors across embedding models (that is arithmetic without meaning), and a
// failed kind must be REPORTED rather than silently returning "nothing found" - the
// exact failure that let memory recall sit dead in production for weeks.

import { describe, expect, it } from "bun:test";
import {
  DEFAULT_JUDGMENT_KINDS,
  formatWorkspaceRecord,
  JUDGMENT_THRESHOLD,
  rankJudgment,
  searchWorkspaceRecord,
  toHits,
  type JudgmentHit,
} from "./judgment-search.server";

const hit = (over: Partial<JudgmentHit> = {}): JudgmentHit => ({
  kind: "decision",
  id: "11111111-1111-1111-1111-111111111111",
  title: "Ship the digest behind a flag",
  body: "Support asked twice and the flag lets us roll back in a minute.",
  verdict: null,
  status: "decided",
  agentSlug: null,
  createdAt: "2026-08-01T00:00:00.000Z",
  similarity: 0.8,
  ...over,
});

// A supabase double that records the RPC arguments it was handed.
function fakeDb(
  responses: Record<string, { data?: unknown[]; error?: { message: string } }> = {},
) {
  const calls: Array<{ fn: string; args: Record<string, unknown> }> = [];
  return {
    calls,
    client: {
      rpc: async (fn: string, args: Record<string, unknown>) => {
        calls.push({ fn, args });
        const r = responses[fn];
        if (!r) return { data: [], error: null };
        return { data: r.data ?? null, error: r.error ?? null };
      },
    },
  };
}

const embedOk =
  (model = "cohere/embed-v4.0") =>
  async () => ({ vectors: [[0.1, 0.2, 0.3]], model });

describe("rankJudgment", () => {
  it("drops anything below the threshold", () => {
    const out = rankJudgment([hit({ similarity: 0.9 }), hit({ id: "b", similarity: 0.1 })]);
    expect(out.map((h) => h.id)).toEqual(["11111111-1111-1111-1111-111111111111"]);
  });

  it("ranks on similarity across kinds, never on kind order", () => {
    // A weaker DECISION must not outrank a stronger OUTCOME just by being asked first.
    const out = rankJudgment([
      hit({ id: "weak-decision", kind: "decision", similarity: 0.4 }),
      hit({ id: "strong-outcome", kind: "learning", similarity: 0.92 }),
    ]);
    expect(out.map((h) => h.id)).toEqual(["strong-outcome", "weak-decision"]);
  });

  it("caps the block so one busy workspace cannot flood a prompt", () => {
    const many = Array.from({ length: 40 }, (_, i) => hit({ id: `d${i}`, similarity: 0.9 }));
    expect(rankJudgment(many).length).toBe(6);
  });

  it("admits a row sitting exactly on the threshold", () => {
    expect(rankJudgment([hit({ similarity: JUDGMENT_THRESHOLD })]).length).toBe(1);
  });
});

describe("toHits", () => {
  it("reads a decision's rationale as the body, and keeps its status and agent", () => {
    const [h] = toHits("decision", [
      {
        id: "d1",
        title: "Drop the v1 importer",
        rationale: "Two users, both migrated.",
        status: "decided",
        decided_by_agent_slug: "critic",
        created_at: "2026-07-01T00:00:00.000Z",
        similarity: 0.7,
      },
    ]);
    expect(h.body).toBe("Two users, both migrated.");
    expect(h.status).toBe("decided");
    expect(h.agentSlug).toBe("critic");
    expect(h.verdict).toBeNull();
  });

  it("reads an outcome's verdict, which is the whole point of searching learnings", () => {
    const [h] = toHits("learning", [
      { id: "l1", summary: "Adoption never moved.", verdict: "missed", similarity: 0.6 },
    ]);
    expect(h.verdict).toBe("missed");
    expect(h.body).toBe("Adoption never moved.");
    // learnings has no title column; the summary carries the meaning.
    expect(h.title).toBeNull();
  });

  it("takes the body from the right column for each kind", () => {
    expect(toHits("opportunity", [{ id: "o", problem: "Onboarding drops at step 3." }])[0].body).toBe(
      "Onboarding drops at step 3.",
    );
    expect(toHits("prd", [{ id: "p", body_md: "## Goal\nCut it to one step." }])[0].body).toBe(
      "## Goal\nCut it to one step.",
    );
  });

  it("skips a row with no id rather than emitting an unusable hit", () => {
    expect(toHits("decision", [{ title: "no id here" }])).toEqual([]);
  });

  it("treats a missing similarity as zero, so it cannot pass the threshold by accident", () => {
    expect(toHits("decision", [{ id: "d" }])[0].similarity).toBe(0);
  });
});

describe("formatWorkspaceRecord", () => {
  it("returns empty string for no hits, so the caller omits the block entirely", () => {
    expect(formatWorkspaceRecord([])).toBe("");
  });

  it("labels each line by kind and state so the model can weigh them differently", () => {
    const out = formatWorkspaceRecord(
      [
        hit({ status: "decided" }),
        hit({ id: "l", kind: "learning", title: null, verdict: "missed", body: "No lift." }),
      ],
      new Date("2026-08-03T00:00:00.000Z"),
    );
    expect(out).toContain("[DECISION DECIDED]");
    expect(out).toContain("[OUTCOME MISSED]");
  });

  it("states the age, because a decision from last year is weaker evidence", () => {
    const out = formatWorkspaceRecord(
      [hit({ createdAt: "2025-08-03T00:00:00.000Z" })],
      new Date("2026-08-03T00:00:00.000Z"),
    );
    expect(out).toContain("1y ago");
  });

  it("survives a null createdAt without printing an empty bracket", () => {
    const out = formatWorkspaceRecord([hit({ createdAt: null, agentSlug: null })]);
    expect(out).not.toContain("()");
  });

  it("truncates a long body so one verbose spec cannot dominate", () => {
    const out = formatWorkspaceRecord([hit({ body: "x".repeat(2000) })]);
    expect(out.length).toBeLessThan(500);
    expect(out).toContain("...");
  });
});

describe("searchWorkspaceRecord", () => {
  it("FAILS CLOSED with no workspace: no embed spend, no RPC, nothing returned", async () => {
    // This is the security-relevant case. A service_role caller bypasses RLS, so a
    // workspace-less search reaching the RPC would read every tenant's judgment.
    let embedCalled = false;
    const db = fakeDb();
    const res = await searchWorkspaceRecord(
      db.client as never,
      { userId: "u1", workspaceId: null, text: "should not run" },
      {
        embed: (async () => {
          embedCalled = true;
          return { vectors: [[1]], model: "x" };
        }) as never,
      },
    );
    expect(res.hits).toEqual([]);
    expect(db.calls).toEqual([]);
    expect(embedCalled).toBe(false);
  });

  it("returns nothing for blank text rather than embedding whitespace", async () => {
    const db = fakeDb();
    const res = await searchWorkspaceRecord(
      db.client as never,
      { userId: "u1", workspaceId: "w1", text: "   " },
      { embed: embedOk() as never },
    );
    expect(res.hits).toEqual([]);
    expect(db.calls).toEqual([]);
  });

  it("PINS the query to the model that produced it, so vector spaces cannot mix", async () => {
    const db = fakeDb();
    await searchWorkspaceRecord(
      db.client as never,
      { userId: "u1", workspaceId: "w1", text: "ship the digest" },
      { embed: embedOk("cohere/embed-v4.0") as never },
    );
    expect(db.calls.length).toBe(2);
    for (const c of db.calls) expect(c.args.for_model).toBe("cohere/embed-v4.0");
  });

  it("passes the workspace and the exclusion through to every RPC", async () => {
    const db = fakeDb();
    await searchWorkspaceRecord(
      db.client as never,
      { userId: "u1", workspaceId: "w1", text: "q", excludeId: "self" },
      { embed: embedOk() as never },
    );
    for (const c of db.calls) {
      expect(c.args.for_workspace).toBe("w1");
      expect(c.args.exclude_id).toBe("self");
    }
  });

  it("defaults to decisions and outcomes - what was decided and what happened", async () => {
    const db = fakeDb();
    await searchWorkspaceRecord(
      db.client as never,
      { userId: "u1", workspaceId: "w1", text: "q" },
      { embed: embedOk() as never },
    );
    expect(db.calls.map((c) => c.fn).sort()).toEqual(["match_decisions", "match_learnings"]);
    expect(DEFAULT_JUDGMENT_KINDS).toEqual(["decision", "learning"]);
  });

  it("REPORTS a failed kind instead of passing it off as an empty record", async () => {
    // A recall path that returns [] on error is indistinguishable from a workspace
    // with nothing to recall. That ambiguity is what hid the dead match_agent_memory
    // overload for weeks, so failure is surfaced here rather than swallowed.
    const db = fakeDb({
      match_decisions: { data: [{ id: "d1", title: "t", rationale: "r", similarity: 0.9 }] },
      match_learnings: { error: { message: "PGRST203 could not choose a best candidate" } },
    });
    const res = await searchWorkspaceRecord(
      db.client as never,
      { userId: "u1", workspaceId: "w1", text: "q" },
      { embed: embedOk() as never },
    );
    expect(res.failedKinds).toEqual(["learning"]);
    // and the kind that DID work still returns its rows
    expect(res.hits.map((h) => h.id)).toEqual(["d1"]);
  });

  it("returns empty rather than throwing when embedding is down", async () => {
    const db = fakeDb();
    const res = await searchWorkspaceRecord(
      db.client as never,
      { userId: "u1", workspaceId: "w1", text: "q" },
      {
        embed: (async () => {
          throw new Error("cohere 429");
        }) as never,
      },
    );
    expect(res).toEqual({ hits: [], failedKinds: [], model: null });
    expect(db.calls).toEqual([]);
  });

  it("returns empty when the embedder yields no vector, without calling any RPC", async () => {
    const db = fakeDb();
    const res = await searchWorkspaceRecord(
      db.client as never,
      { userId: "u1", workspaceId: "w1", text: "q" },
      { embed: (async () => ({ vectors: [], model: "m" })) as never },
    );
    expect(res.hits).toEqual([]);
    expect(db.calls).toEqual([]);
  });
});
