import { describe, test, expect } from "bun:test";
import { assembleChain, type ChainEvidence } from "./trust-chain.functions";

function row(detail: string) {
  return { id: `id-${detail}`, at: "2026-07-08T00:00:00Z", detail };
}

const statusOf = (chain: ReturnType<typeof assembleChain>, key: string) =>
  chain.steps.find((s) => s.key === key)!.status;

describe("assembleChain (SW-5 B: honest present/skipped/missing/pending)", () => {
  test("a fully-shipped mission walks unbroken; design skipped when off", () => {
    const ev: ChainEvidence = {
      signal: row("sig"),
      decision: row("dec"),
      contract: row("prd"),
      design: null,
      designOff: true,
      build: row("cs"),
      test: row("test"),
      merge: row("merge"),
      deploy: row("deploy"),
      outcome: row("outcome"),
    };
    const chain = assembleChain("m1", "Ship it", ev);
    expect(chain.unbroken).toBe(true);
    expect(statusOf(chain, "signal")).toBe("present");
    expect(statusOf(chain, "outcome")).toBe("present");
    expect(statusOf(chain, "design")).toBe("skipped");
    expect(chain.steps.filter((s) => s.status === "missing")).toHaveLength(0);
  });

  test("an in-progress mission shows later links as pending, not missing", () => {
    const ev: ChainEvidence = {
      signal: row("sig"),
      decision: row("dec"),
      designOff: true,
    };
    const chain = assembleChain("m2", "Early", ev);
    expect(chain.unbroken).toBe(true); // nothing before the furthest link is absent
    expect(statusOf(chain, "decision")).toBe("present");
    expect(statusOf(chain, "contract")).toBe("pending");
    expect(statusOf(chain, "deploy")).toBe("pending");
    // design before the reached index (decision=1, design=3 > 1) is pending, but
    // designOff makes it skipped regardless.
    expect(statusOf(chain, "design")).toBe("skipped");
  });

  test("a real gap (merge absent but deploy present) renders as missing and breaks the chain", () => {
    const ev: ChainEvidence = {
      signal: row("sig"),
      decision: row("dec"),
      contract: row("prd"),
      designOff: true,
      build: row("cs"),
      // test + merge deliberately absent
      deploy: row("deploy"),
    };
    const chain = assembleChain("m3", "Broken", ev);
    expect(chain.unbroken).toBe(false);
    expect(statusOf(chain, "test")).toBe("missing"); // index 5 < deploy index 7
    expect(statusOf(chain, "merge")).toBe("missing"); // index 6 < deploy index 7
    expect(statusOf(chain, "deploy")).toBe("present");
    expect(statusOf(chain, "outcome")).toBe("pending"); // index 8 > deploy index 7
  });

  test("empty evidence → all pending, nothing missing, reachedIndex -1", () => {
    const chain = assembleChain("m4", "Nothing", { designOff: true });
    expect(chain.reachedIndex).toBe(-1);
    expect(chain.unbroken).toBe(true);
    expect(chain.steps.every((s) => s.status === "pending" || s.status === "skipped")).toBe(true);
  });

  test("nine links, canonical order", () => {
    const chain = assembleChain("m5", "Order", { designOff: true });
    expect(chain.steps.map((s) => s.key)).toEqual([
      "signal",
      "decision",
      "contract",
      "design",
      "build",
      "test",
      "merge",
      "deploy",
      "outcome",
    ]);
  });
});
