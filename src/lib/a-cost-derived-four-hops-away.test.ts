/**
 * F-145: A FOUR-HOP DERIVATION REPORTED $0.00 OVER REAL SPEND.
 *
 * S1 measured it on `/inbox`: **"Workspace spend: $0.00" for a workspace whose
 * 622 runs each carry a populated `spend_used_usd`, totalling $8.31.**
 *
 * The path was mission → runs → NEWEST checkpoint per run → `state.traceId` →
 * `ai_events.est_cost_usd`. Four hops, and a break at any one produced a mission
 * that **cost nothing** rather than one whose cost was **unknown**. Summing
 * those gives a confident zero — the same false-negative shape as every other
 * read fixed tonight: a narrow lookup returning empty and the surface reading
 * empty as fact.
 *
 * The `seenRun` dedupe made it worse invisibly: only the newest checkpoint per
 * run was consulted, so a run whose LAST checkpoint carried no `traceId`
 * contributed nothing even when an earlier one did.
 *
 * ── WHY THE RUN COLUMN IS CANONICAL, AND IT IS NOT ONLY ROBUSTNESS ─────────
 * Measured: `spend_used_usd` is populated on **all 2,847 runs**, total $30.35.
 * One hop, complete.
 *
 * But the deciding argument is what the two numbers MEAN. `est_cost_usd` is an
 * ESTIMATE attached to a model event; `spend_used_usd` is what was RECORDED
 * against the run. This surface asks "what did this work cost", and the recorded
 * spend is the answer while the estimate is a model of it. **A surface should
 * not prefer a model of a fact it already holds.**
 *
 * S1 declined to switch it themselves, deliberately, on the grounds that two
 * cost sources on one screen is how the 7-versus-41 problem happens. Right, and
 * this is not that: it REPLACES the derivation rather than joining it, so there
 * is still exactly one answer to the question.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(
  fileURLToPath(new URL("./missions.functions.ts", import.meta.url)),
  "utf8",
);
const CODE = SRC.split("\n")
  .filter((l) => {
    const t = l.trim();
    return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
  })
  .join("\n");

describe("cost comes from the run that spent it", () => {
  it("the runs read fetches the recorded spend", () => {
    expect(CODE).toContain("agent_slug,track_id,spend_used_usd");
  });

  it("and cost is summed from it directly", () => {
    expect(CODE).toContain("const spend = Number(r.spend_used_usd ?? 0);");
    expect(CODE).toContain(
      "costByMission.set(r.mission_id, (costByMission.get(r.mission_id) ?? 0) + spend)",
    );
  });
});

describe("the four-hop chain is gone, not merely bypassed", () => {
  it("no checkpoint read for cost, on either surface", () => {
    /*
     * Left in place it would be a second cost source on one screen, which is
     * exactly what S1 refused to create. Replaced, so there is one answer.
     *
     * `est_cost_usd` is gone from the FILE, not just the list: my first version
     * fixed only `listMissions` and this assertion caught that `getMission`, the
     * detail page, carried the identical defect.
     */
    expect(CODE).not.toContain("missionByTrace");
    expect(CODE).not.toContain("est_cost_usd");
  });

  it("but tokens still come from ai_events, which is the only place they exist", () => {
    /*
     * Not two cost sources on one screen: one source per QUESTION. Cost is
     * asked of the thing that spent it, tokens of the thing that counted them.
     */
    expect(CODE).toContain('.select("prompt_tokens,completion_tokens")');
    expect(CODE).toContain("usage.tokens_in += e.prompt_tokens ?? 0;");
  });

  it("and the detail page sums cost from its own runs", () => {
    expect(CODE).toContain("if (Number.isFinite(spend) && spend > 0) usage.cost_usd += spend;");
  });

  it("and the newest-checkpoint dedupe that hid runs is gone with it", () => {
    // `seenRun` took only the latest checkpoint per run, so a run whose last
    // checkpoint carried no traceId contributed nothing even if an earlier
    // one did. Invisible from the code and fatal to the total.
    expect(CODE).not.toContain("const seenRun = new Set<string>();");
  });
});

describe("a missing or absurd value contributes nothing rather than corrupting the total", () => {
  it("null, NaN and negatives are skipped", () => {
    /*
     * `Number(null)` is 0 and `Number(undefined)` is NaN, and a NaN added to a
     * running total makes the whole workspace figure NaN — one bad row silently
     * destroying every number on the page. Guarded rather than trusted.
     */
    expect(CODE).toContain("if (!Number.isFinite(spend) || spend <= 0) continue;");
  });

  it("which is a skip, not a zero written into the map", () => {
    // A mission with no spend must stay ABSENT from `costByMission` so the
    // surface can tell "nothing spent" from "nothing known", which is the
    // distinction S1's surface fix depends on.
    const block = CODE.slice(CODE.indexOf("const spend = Number("));
    expect(block.slice(0, 300)).not.toContain("costByMission.set(r.mission_id, 0)");
  });
});
