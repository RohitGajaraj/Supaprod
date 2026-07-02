import { describe, it, expect } from "bun:test";
import { buildGlance, type GlanceInputs } from "../engine-room-glance";

describe("engine-room-glance buildGlance", () => {
  it("falls back to the prototype literals on empty input", () => {
    const rooms = buildGlance({});
    expect(rooms.map((r) => r.key)).toEqual(["spend", "quality", "safety", "record"]);
    expect(rooms.every((r) => r.state === "healthy")).toBe(true);
    expect(rooms.find((r) => r.key === "spend")?.verdict).toBe("$482 of $600 · trending +12%");
    expect(rooms.find((r) => r.key === "quality")?.verdict).toBe("Evals 94 / 88 / 91 · no drift");
    expect(rooms.find((r) => r.key === "safety")?.verdict).toBe("3 guardrails on · 0 incidents");
    expect(rooms.find((r) => r.key === "record")?.verdict).toBe("1,284 traces · ledger intact");
  });

  it("flags Spend as watch when usage crosses 80% of the cap", () => {
    const inputs: GlanceInputs = {
      spend: {
        global: { daily_usd_cap: null, monthly_usd_cap: 100, monthly_usd_used: 81 },
        costThisWeek: 20,
        costTrailing14d: 40,
      },
    };
    const [spend] = buildGlance(inputs);
    expect(spend.state).toBe("watch");
    expect(spend.verdict).toContain("$81 of $100");
  });

  it("keeps Spend healthy under 80% of the cap", () => {
    const inputs: GlanceInputs = {
      spend: {
        global: { daily_usd_cap: null, monthly_usd_cap: 100, monthly_usd_used: 40 },
        costThisWeek: 10,
        costTrailing14d: 20,
      },
    };
    const [spend] = buildGlance(inputs);
    expect(spend.state).toBe("healthy");
  });

  it("reports spend honestly with no cap configured", () => {
    const inputs: GlanceInputs = {
      spend: {
        global: { daily_usd_cap: null, monthly_usd_cap: null },
        costThisWeek: 12,
        costTrailing14d: 20,
      },
    };
    const [spend] = buildGlance(inputs);
    expect(spend.state).toBe("healthy");
    expect(spend.verdict).toBe("$12 this week · no cap set");
  });

  it("flags Quality as watch when a suite falls below its own pass threshold", () => {
    const inputs: GlanceInputs = {
      quality: {
        suites: [
          { pass_threshold: 90, last_run: { avg_score: 82 } },
          { pass_threshold: 80, last_run: { avg_score: 88 } },
        ],
        driftOpenCount: 0,
      },
    };
    const quality = buildGlance(inputs)[1];
    expect(quality.state).toBe("watch");
    expect(quality.verdict).toBe("Evals 82 / 88 · no drift");
  });

  it("flags Quality as watch when drift is open even with passing scores", () => {
    const inputs: GlanceInputs = {
      quality: {
        suites: [{ pass_threshold: 80, last_run: { avg_score: 91 } }],
        driftOpenCount: 2,
      },
    };
    const quality = buildGlance(inputs)[1];
    expect(quality.state).toBe("watch");
    expect(quality.verdict).toBe("Evals 91 · drift open");
  });

  it("flags Safety as watch on any open incident", () => {
    const inputs: GlanceInputs = {
      safety: {
        rules: [{ enabled: true }, { enabled: true }, { enabled: false }],
        incidentCount: 1,
      },
    };
    const safety = buildGlance(inputs)[2];
    expect(safety.state).toBe("watch");
    expect(safety.verdict).toBe("2 guardrails on · 1 incident");
  });

  it("keeps Safety healthy with zero incidents", () => {
    const inputs: GlanceInputs = {
      safety: { rules: [{ enabled: true }], incidentCount: 0 },
    };
    const safety = buildGlance(inputs)[2];
    expect(safety.state).toBe("healthy");
    expect(safety.verdict).toBe("1 guardrail on · 0 incidents");
  });

  it("reports Record as healthy when the ledger verifies", () => {
    const inputs: GlanceInputs = {
      record: { traceCount: 1284, ledgerVerifies: true },
    };
    const record = buildGlance(inputs)[3];
    expect(record.state).toBe("healthy");
    expect(record.verdict).toBe("1,284 traces · ledger intact");
  });

  it("surfaces an unverified ledger honestly without changing room state", () => {
    const inputs: GlanceInputs = {
      record: { traceCount: 3, ledgerVerifies: false },
    };
    const record = buildGlance(inputs)[3];
    expect(record.verdict).toBe("3 traces · ledger unverified");
  });
});
