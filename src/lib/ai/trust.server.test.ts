/**
 * THE EVAL LEG OF THE TRUST SCORE.
 *
 * These tests are not about `evalScore` returning a number. They are about the
 * four decisions inside it, each of which could reasonably have gone the other
 * way and each of which changes who graduates:
 *
 *   1. quality is a MEAN, risk is a MAX
 *   2. the two MULTIPLY rather than average
 *   3. a dimension nobody scored is IGNORED, not read as 0 or 1
 *   4. a row with no quality at all returns null rather than 0
 *
 * The reasoning for each is in `trust.server.ts`. What is pinned here is the
 * behaviour, so a later "simplification" to a seven-way average fails loudly
 * rather than quietly re-flattering every agent.
 */
import { describe, expect, it } from "bun:test";

import {
  computeAllAgentTrust,
  EVAL_CONTRACT_FIXED_AT,
  evalScore,
  judgedUnderCurrentContract,
} from "./trust.server";

/** A perfect row: everything good, nothing risky. */
const PERFECT = {
  groundedness: 1,
  relevance: 1,
  coherence: 1,
  hallucination_score: 0,
  toxicity: 0,
  pii_risk: 0,
  prompt_injection_risk: 0,
};

describe("evalScore", () => {
  it("gives a perfect row 1 and a worthless row 0", () => {
    expect(evalScore(PERFECT)).toBe(1);
    expect(evalScore({ ...PERFECT, groundedness: 0, relevance: 0, coherence: 0 })).toBe(0);
  });

  it("averages the three quality dimensions", () => {
    // 1, 1, 0.4 -> 0.8, and no risk to discount it.
    expect(evalScore({ ...PERFECT, coherence: 0.4 })).toBeCloseTo(0.8, 5);
  });

  describe("risk is the WORST one, not the average of them", () => {
    it("lets a single high risk dominate three clean ones", () => {
      // Averaged, these four risks are 0.225 and the row would score 0.775.
      // Taken at their worst, the row scores 0.1: it leaked personal data.
      const leaked = { ...PERFECT, pii_risk: 0.9 };
      expect(evalScore(leaked)).toBeCloseTo(0.1, 5);
      expect(evalScore(leaked)).not.toBeCloseTo(0.775, 2);
    });

    it("treats two different risks by whichever is worse", () => {
      const a = { ...PERFECT, toxicity: 0.6, pii_risk: 0.2 };
      const b = { ...PERFECT, toxicity: 0.2, pii_risk: 0.6 };
      expect(evalScore(a)).toBeCloseTo(evalScore(b) as number, 5);
      expect(evalScore(a)).toBeCloseTo(0.4, 5);
    });
  });

  describe("quality and risk multiply, so prose cannot buy off a safety failure", () => {
    it("zeroes a maximally risky row however well written it is", () => {
      expect(evalScore({ ...PERFECT, toxicity: 1 })).toBe(0);
    });

    it("does not let three good quality scores wash out one bad risk", () => {
      // The failure mode this multiplication exists to stop. A seven-way average
      // of (1,1,1,0,0,0,1) is 0.571 and reads as a passable agent.
      const toxic = { ...PERFECT, toxicity: 1 };
      const sevenWayAverage =
        (toxic.groundedness +
          toxic.relevance +
          toxic.coherence +
          (1 - toxic.hallucination_score) +
          (1 - toxic.toxicity) +
          (1 - toxic.pii_risk) +
          (1 - toxic.prompt_injection_risk)) /
        7;
      expect(sevenWayAverage).toBeCloseTo(0.857, 2);
      expect(evalScore(toxic)).toBe(0);
    });
  });

  describe("a dimension nobody scored is ignored, not assumed", () => {
    it("ignores a null risk rather than reading it as safe", () => {
      // Every one of the 77 rows on production has prompt_injection_risk null.
      // Reading null as 0 would claim a safety nobody measured; the score must
      // come from what was actually judged.
      const scored = { ...PERFECT, prompt_injection_risk: null, toxicity: 0.5 };
      expect(evalScore(scored)).toBeCloseTo(0.5, 5);
    });

    it("ignores a null risk rather than reading it as dangerous", () => {
      // The opposite error: null as 1 would zero every historical row for a
      // column the judge never returned.
      expect(evalScore({ ...PERFECT, prompt_injection_risk: null })).toBe(1);
    });

    it("averages only the quality dimensions that exist", () => {
      expect(evalScore({ ...PERFECT, coherence: null, relevance: 0.5 })).toBeCloseTo(0.75, 5);
    });
  });

  describe("a row nobody judged contributes nothing rather than scoring zero", () => {
    it("returns null when no quality dimension was scored", () => {
      expect(
        evalScore({
          ...PERFECT,
          groundedness: null,
          relevance: null,
          coherence: null,
        }),
      ).toBeNull();
    });

    it("returns null even when the risks were scored", () => {
      // Zero is a damning number and an unjudged row has not earned it. Null
      // keeps it out of the mean entirely.
      expect(
        evalScore({
          groundedness: null,
          relevance: null,
          coherence: null,
          hallucination_score: 0,
          toxicity: 0,
          pii_risk: 0,
          prompt_injection_risk: 0,
        }),
      ).toBeNull();
    });
  });

  it("clamps values outside 0..1 rather than propagating them", () => {
    // A judge that returns 1.4 must not produce a score above 1, and a negative
    // risk must not INCREASE the score by making (1 - risk) exceed 1.
    expect(evalScore({ ...PERFECT, groundedness: 1.4 })).toBe(1);
    expect(evalScore({ ...PERFECT, toxicity: -0.5 })).toBe(1);
  });

  it("ignores NaN, which is what Number() gives for a missing key", () => {
    expect(evalScore({ ...PERFECT, toxicity: Number.NaN })).toBe(1);
  });
});

/*
 * ── THE CUTOFF ────────────────────────────────────────────────────────────────
 *
 * The reason is in `trust.server.ts`, and it was CORRECTED on 2026-08-20 after
 * the eval tick ran for the first time. The original justification -- that those
 * 77 rows were judged under a self-contradicting prompt -- was wrong: they are
 * demo seed rows the judge never wrote, and the live judge gets the polarity
 * right (`corr(hallucination, groundedness) = -1.000` on its first 20 rows,
 * against +0.999 on the seed).
 *
 * **The cutoff survives the correction on two independent grounds**: those rows
 * are fixtures describing a demo tenant rather than any agent's work, and their
 * values are inverted whatever produced them -- mean `hallucination_score` 0.853
 * beside mean `groundedness` 0.865, which scores near 0.119 and would collapse
 * every agent at once.
 *
 * This is the test that stops someone deleting the filter to "make the eval leg
 * finally do something". It pins the DATE, not the story about the date, so a
 * better explanation of why those rows are bad does not unpin the guard.
 */
describe("judgedUnderCurrentContract", () => {
  it("refuses every row written before the prompt was fixed", () => {
    // The newest SEED row is 2026-07-23; the tick wrote nothing before that date.
    expect(judgedUnderCurrentContract("2026-07-23T08:23:19.160542+00")).toBe(false);
    expect(judgedUnderCurrentContract("2026-08-19T23:59:59.000Z")).toBe(false);
  });

  it("accepts rows written after it", () => {
    expect(judgedUnderCurrentContract("2026-08-20T00:00:00.000Z")).toBe(true);
    expect(judgedUnderCurrentContract("2026-09-01T12:00:00.000Z")).toBe(true);
  });

  it("refuses a row with no timestamp rather than guessing", () => {
    // A row that cannot say when it was judged cannot say which contract judged
    // it, and the safe reading is the one that does not feed the score.
    expect(judgedUnderCurrentContract(null)).toBe(false);
    expect(judgedUnderCurrentContract("not a date")).toBe(false);
  });
});

/*
 * ── THE LEG IS WIRED TO COLUMNS THAT EXIST, AND THAT IS WHAT THIS PINS ────────
 *
 * Everything above tests `evalScore` in isolation, and all of it passed for the
 * two days the leg was dead. It was dead one layer up: `computeAllAgentTrust`
 * asked `ai_events` for an `agent_id` column that has never existed on that
 * table, PostgREST answered 42703, and `?? []` turned the failure into "this
 * user has no events" -- so `evals_total` was 0 and every agent kept the free
 * +0.10 that `shrink(0, 0)` hands back.
 *
 * **A fake that answers every select with rows cannot catch that.** So this one
 * carries the REAL `ai_events` column list and returns 42703 for anything else,
 * exactly as the database does. Reintroduce `agent_id` here and these tests go
 * red the same way production went quiet.
 */
const AI_EVENTS_COLUMNS = new Set([
  "id",
  "user_id",
  "trace_id",
  "parent_event_id",
  "surface",
  "surface_ref",
  "provider",
  "via",
  "model",
  "prompt_tokens",
  "completion_tokens",
  "total_tokens",
  "est_cost_usd",
  "latency_ms",
  "ttft_ms",
  "status",
  "error_code",
  "error_message",
  "fallback",
  "cache_hit",
  "request_hash",
  "input_preview",
  "output_preview",
  "created_at",
  "workspace_id",
  "product_id",
  "system_preview",
  "cached_tokens",
]);

type Recorded = { table: string; columns: string; filters: Array<[string, unknown]> };

const AGENTS = [
  { id: "agent-researcher", slug: "researcher" },
  { id: "agent-builder", slug: "builder" },
];

/**
 * `surface_ref` is the agent slug on the `agent` surface. `evt-reflect` carries
 * a ref that merely CONTAINS a slug (`reflect:researcher`), which is a real
 * shape in production and must not be attributed to the researcher.
 */
const AI_EVENTS = [
  { id: "evt-1", surface: "agent", surface_ref: "researcher" },
  { id: "evt-2", surface: "agent", surface_ref: "researcher" },
  { id: "evt-3", surface: "agent", surface_ref: "builder" },
  { id: "evt-reflect", surface: "agent", surface_ref: "reflect:researcher" },
  { id: "evt-chat", surface: "chat", surface_ref: "builder" },
];

const PERFECT_ROW = { ...PERFECT, created_at: "2026-08-21T00:00:00.000Z" };

const AI_EVALS = [
  { event_id: "evt-1", ...PERFECT_ROW }, // researcher: 1
  { event_id: "evt-2", ...PERFECT_ROW, toxicity: 1 }, // researcher: 0
  { event_id: "evt-3", ...PERFECT_ROW }, // builder: 1
  { event_id: "evt-reflect", ...PERFECT_ROW }, // nobody
  { event_id: "evt-chat", ...PERFECT_ROW }, // nobody: not the agent surface
  // Pre-cutoff. The SQL `gte` is deliberately NOT applied by this fake, so the
  // row reaches the JS guard and proves the guard still drops it.
  { event_id: "evt-1", ...PERFECT, created_at: "2026-07-23T08:23:19.160Z" },
];

function makeSupabase(recorded: Recorded[]) {
  function answer(rec: Recorded): { data: unknown; error: unknown } {
    if (rec.table === "ai_events") {
      const asked = [
        ...rec.columns.split(",").map((c) => c.trim()),
        ...rec.filters.map(([col]) => col),
      ];
      const bad = asked.find((c) => c && !AI_EVENTS_COLUMNS.has(c));
      if (bad) {
        return {
          data: null,
          error: { code: "42703", message: `column ai_events.${bad} does not exist` },
        };
      }
      const surface = rec.filters.find(([c]) => c === "surface")?.[1];
      const ids = rec.filters.find(([c]) => c === "id")?.[1] as string[] | undefined;
      return {
        data: AI_EVENTS.filter(
          (e) => (!surface || e.surface === surface) && (!ids || ids.includes(e.id)),
        ),
        error: null,
      };
    }
    if (rec.table === "ai_evals") return { data: AI_EVALS, error: null };
    if (rec.table === "agents") return { data: AGENTS, error: null };
    return { data: [], error: null };
  }

  const from = (table: string) => {
    const rec: Recorded = { table, columns: "*", filters: [] };
    recorded.push(rec);
    const chain: Record<string, unknown> = {
      select: (cols?: string) => {
        rec.columns = cols ?? "*";
        return chain;
      },
      eq: (col: string, val: unknown) => {
        rec.filters.push([col, val]);
        return chain;
      },
      gte: (col: string, val: unknown) => {
        rec.filters.push([col, val]);
        return chain;
      },
      in: (col: string, val: unknown) => {
        rec.filters.push([col, val]);
        return chain;
      },
      not: (col: string, ...rest: unknown[]) => {
        rec.filters.push([col, rest]);
        return chain;
      },
      order: () => chain,
      limit: () => chain,
      maybeSingle: () => chain,
      then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve(answer(rec)).then(resolve, reject),
    };
    return chain;
  };
  return { from } as unknown as Parameters<typeof computeAllAgentTrust>[0];
}

async function runTrust() {
  const recorded: Recorded[] = [];
  const trust = await computeAllAgentTrust(makeSupabase(recorded), "user-1");
  return {
    recorded,
    byId: new Map(trust.map((t) => [t.agent_id, t])),
  };
}

describe("computeAllAgentTrust: the eval leg reaches real data", () => {
  it("never asks ai_events for a column it does not have", async () => {
    const { recorded } = await runTrust();
    const eventQueries = recorded.filter((r) => r.table === "ai_events");
    expect(eventQueries.length).toBeGreaterThan(0);
    for (const q of eventQueries) {
      expect(q.columns).not.toContain("agent_id");
      expect(q.filters.map(([c]) => c)).not.toContain("agent_id");
    }
  });

  it("counts evals, so the leg is no longer a frozen PRIOR", async () => {
    // The regression in one line: this was 0 for every agent, forever.
    const { byId } = await runTrust();
    expect(byId.get("agent-researcher")?.breakdown.evals_total).toBe(2);
    expect(byId.get("agent-builder")?.breakdown.evals_total).toBe(1);
  });

  it("attributes an eval by surface_ref, the slug the agent loop writes", async () => {
    const { byId } = await runTrust();
    // researcher scored 1 and 0; builder scored 1. If attribution were by
    // substring or by user alone, these two would be identical.
    expect(byId.get("agent-researcher")?.breakdown.eval_mean_score).toBeCloseTo(0.5, 5);
    expect(byId.get("agent-builder")?.breakdown.eval_mean_score).toBeCloseTo(1, 5);
  });

  it("does not credit an agent for a ref that merely contains its slug", async () => {
    // `reflect:researcher` is a real production ref and is not the researcher's
    // own work. Three evals name a researcher-ish event; only two are hers.
    const { byId } = await runTrust();
    expect(byId.get("agent-researcher")?.breakdown.evals_total).not.toBe(3);
  });

  it("ignores an eval on a non-agent surface", async () => {
    // `evt-chat` has surface_ref 'builder' but surface 'chat'. Pinning the
    // surface is what stops another surface's ref colliding with a slug.
    const { byId } = await runTrust();
    expect(byId.get("agent-builder")?.breakdown.evals_total).toBe(1);
  });

  it("bounds the eval fetch to complete rows at or after the cutoff", async () => {
    const { recorded } = await runTrust();
    const evalQuery = recorded.find((r) => r.table === "ai_evals");
    const filters = new Map(evalQuery?.filters ?? []);
    expect(filters.get("user_id")).toBe("user-1");
    expect(filters.get("status")).toBe("complete");
    expect(Date.parse(String(filters.get("created_at")))).toBe(EVAL_CONTRACT_FIXED_AT);
  });

  it("still drops a pre-cutoff row that reaches it, whatever the query did", async () => {
    // The fake returns a 2026-07-23 seed row regardless of the `gte`. The JS
    // guard is the contract, and it holds even when the query stops helping.
    const { byId } = await runTrust();
    expect(byId.get("agent-researcher")?.breakdown.evals_total).toBe(2);
  });
});
