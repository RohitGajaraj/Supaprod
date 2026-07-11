import { describe, it, expect } from "bun:test";
import {
  composeProposals,
  type SelfImprovementSignals,
  type EvalSignal,
  type AgentSignal,
  type PlaybookSignal,
} from "@/lib/self-improve";

function signals(over: Partial<SelfImprovementSignals> = {}): SelfImprovementSignals {
  return { evals: [], agents: [], playbooks: [], ...over };
}

describe("composeProposals: empty and healthy", () => {
  it("returns nothing for empty input", () => {
    expect(composeProposals(signals())).toEqual([]);
  });

  it("returns nothing when every signal is healthy", () => {
    const healthy = signals({
      evals: [{ suite_id: "s1", name: "Checkout", pass_rate: 0.95, total: 12 }],
      agents: [{ agent_slug: "builder", correction_rate: 0.1, total: 40 }],
      playbooks: [{ playbook_key: "rice", station: "prioritization", win_rate: 0.8, runs: 10 }],
    });
    expect(composeProposals(healthy)).toEqual([]);
  });
});

describe("eval rule", () => {
  it("fires when total >= 3 and pass_rate < 0.6", () => {
    const out = composeProposals(
      signals({ evals: [{ suite_id: "s1", name: "Checkout", pass_rate: 0.4, total: 5 }] }),
    );
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("eval:s1");
    expect(out[0].kind).toBe("eval");
    expect(out[0].subject_ref).toBe("s1");
    expect(out[0].title).toBe("Eval suite Checkout is failing (40% of 5)");
    expect(out[0].evidence).toContain("pass_rate=0.4");
    expect(out[0].evidence).toContain("runs=5");
  });

  it("does not fire below the sample threshold (n=2), even with a terrible pass rate", () => {
    const out = composeProposals(
      signals({ evals: [{ suite_id: "s1", name: "Checkout", pass_rate: 0.0, total: 2 }] }),
    );
    expect(out).toEqual([]);
  });

  it("does not fire at n=1 (never flag on a single run)", () => {
    const out = composeProposals(
      signals({ evals: [{ suite_id: "s1", name: "Checkout", pass_rate: 0.0, total: 1 }] }),
    );
    expect(out).toEqual([]);
  });

  it("does not fire when pass_rate is at or above the floor", () => {
    const out = composeProposals(
      signals({ evals: [{ suite_id: "s1", name: "Checkout", pass_rate: 0.6, total: 9 }] }),
    );
    expect(out).toEqual([]);
  });

  it("scales severity: high at <= 0.3, medium at <= 0.45, low otherwise", () => {
    const mk = (id: string, pr: number): EvalSignal => ({
      suite_id: id,
      name: id,
      pass_rate: pr,
      total: 4,
    });
    const high = composeProposals(signals({ evals: [mk("a", 0.2)] }));
    const medium = composeProposals(signals({ evals: [mk("b", 0.45)] }));
    const low = composeProposals(signals({ evals: [mk("c", 0.55)] }));
    expect(high[0].severity).toBe("high");
    expect(medium[0].severity).toBe("medium");
    expect(low[0].severity).toBe("low");
  });
});

describe("agent rule", () => {
  it("fires when total >= 5 and correction_rate > 0.5", () => {
    const out = composeProposals(
      signals({ agents: [{ agent_slug: "builder", correction_rate: 0.6, total: 10 }] }),
    );
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("agent:builder");
    expect(out[0].kind).toBe("agent");
    expect(out[0].subject_ref).toBe("builder");
    expect(out[0].title).toBe("Agent builder is corrected by humans 60% of the time");
    expect(out[0].evidence).toContain("correction_rate=0.6");
    expect(out[0].evidence).toContain("decisions=10");
  });

  it("does not fire below the sample threshold (n=4)", () => {
    const out = composeProposals(
      signals({ agents: [{ agent_slug: "builder", correction_rate: 0.9, total: 4 }] }),
    );
    expect(out).toEqual([]);
  });

  it("does not fire at exactly 0.5 (rule is strictly greater than the ceiling)", () => {
    const out = composeProposals(
      signals({ agents: [{ agent_slug: "builder", correction_rate: 0.5, total: 20 }] }),
    );
    expect(out).toEqual([]);
  });

  it("scales severity: high at >= 0.75, medium at >= 0.6, low otherwise", () => {
    const mk = (slug: string, cr: number): AgentSignal => ({
      agent_slug: slug,
      correction_rate: cr,
      total: 8,
    });
    const high = composeProposals(signals({ agents: [mk("a", 0.8)] }));
    const medium = composeProposals(signals({ agents: [mk("b", 0.65)] }));
    const low = composeProposals(signals({ agents: [mk("c", 0.55)] }));
    expect(high[0].severity).toBe("high");
    expect(medium[0].severity).toBe("medium");
    expect(low[0].severity).toBe("low");
  });
});

describe("playbook rule", () => {
  it("fires when runs >= 3 and win_rate < 0.5", () => {
    const out = composeProposals(
      signals({
        playbooks: [{ playbook_key: "rice", station: "prioritization", win_rate: 0.3, runs: 6 }],
      }),
    );
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe("playbook:rice");
    expect(out[0].kind).toBe("playbook");
    expect(out[0].subject_ref).toBe("rice");
    expect(out[0].title).toBe("Playbook rice at prioritization wins 30% of the time");
    expect(out[0].evidence).toContain("win_rate=0.3");
    expect(out[0].evidence).toContain("runs=6");
  });

  it("does not fire below the sample threshold (runs=2)", () => {
    const out = composeProposals(
      signals({
        playbooks: [{ playbook_key: "rice", station: "prioritization", win_rate: 0.0, runs: 2 }],
      }),
    );
    expect(out).toEqual([]);
  });

  it("does not fire when win_rate is at or above the floor", () => {
    const out = composeProposals(
      signals({
        playbooks: [{ playbook_key: "rice", station: "prioritization", win_rate: 0.5, runs: 9 }],
      }),
    );
    expect(out).toEqual([]);
  });

  it("scales severity: high at <= 0.2, medium at <= 0.35, low otherwise", () => {
    const mk = (key: string, wr: number): PlaybookSignal => ({
      playbook_key: key,
      station: "prd",
      win_rate: wr,
      runs: 5,
    });
    const high = composeProposals(signals({ playbooks: [mk("a", 0.1)] }));
    const medium = composeProposals(signals({ playbooks: [mk("b", 0.35)] }));
    const low = composeProposals(signals({ playbooks: [mk("c", 0.45)] }));
    expect(high[0].severity).toBe("high");
    expect(medium[0].severity).toBe("medium");
    expect(low[0].severity).toBe("low");
  });
});

describe("id stability", () => {
  it("produces the same deterministic id across recomputes", () => {
    const s = signals({ evals: [{ suite_id: "abc", name: "X", pass_rate: 0.1, total: 5 }] });
    const a = composeProposals(s);
    const b = composeProposals(s);
    expect(a[0].id).toBe("eval:abc");
    expect(b[0].id).toBe(a[0].id);
  });

  it("id is a slug of kind and subject, independent of the display name", () => {
    const s1 = composeProposals(
      signals({ evals: [{ suite_id: "abc", name: "First name", pass_rate: 0.1, total: 5 }] }),
    );
    const s2 = composeProposals(
      signals({ evals: [{ suite_id: "abc", name: "A different name", pass_rate: 0.1, total: 5 }] }),
    );
    expect(s1[0].id).toBe(s2[0].id);
  });
});

describe("sorting", () => {
  it("orders by severity (high, medium, low) first", () => {
    const out = composeProposals(
      signals({
        evals: [
          { suite_id: "low", name: "low", pass_rate: 0.55, total: 4 }, // low
          { suite_id: "high", name: "high", pass_rate: 0.1, total: 4 }, // high
          { suite_id: "med", name: "med", pass_rate: 0.4, total: 4 }, // medium
        ],
      }),
    );
    expect(out.map((p) => p.severity)).toEqual(["high", "medium", "low"]);
  });

  it("within the same severity, more data (bigger sample) comes first", () => {
    const out = composeProposals(
      signals({
        evals: [
          { suite_id: "small", name: "small", pass_rate: 0.1, total: 3 },
          { suite_id: "big", name: "big", pass_rate: 0.1, total: 50 },
        ],
      }),
    );
    expect(out.map((p) => p.subject_ref)).toEqual(["big", "small"]);
  });

  it("is fully deterministic across kinds (stable id tie-break)", () => {
    const s = signals({
      evals: [{ suite_id: "e", name: "e", pass_rate: 0.1, total: 5 }],
      agents: [{ agent_slug: "a", correction_rate: 0.9, total: 5 }],
      playbooks: [{ playbook_key: "p", station: "prd", win_rate: 0.1, runs: 5 }],
    });
    const first = composeProposals(s).map((p) => p.id);
    const second = composeProposals(s).map((p) => p.id);
    expect(first).toEqual(second);
    // all high severity, equal sample of 5, so the id tie-break decides order
    expect(first).toEqual(["agent:a", "eval:e", "playbook:p"]);
  });
});
