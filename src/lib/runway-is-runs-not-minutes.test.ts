/**
 * Runway is denominated in RUNS, and a null is the honest answer.
 *
 * LANE 0 asked for item 29's figure as `minutesLeft`. It is rejected, and the
 * reason is measured rather than argued. At one instant on 2026-08-25 06:46:19
 * UTC one account read **0.000 credits/min over 15 minutes, 0.100 over an hour,
 * 2.085 over a day and 1.299 over a week**, while a second account read
 * **6.133 / 11.350 / 0.547 / 0.510** — a **22x spread on one account at one
 * moment** — and `runwayMinutes()` returns **Infinity** for the live workspace
 * whenever the last debit is an hour old.
 *
 * A run is a near-uniform unit of cost. Over 360 runs in seven days:
 * mean `0.006662`, median `0.006022` (**ratio 1.11**), p90 `0.012373`, p99
 * `0.018124`, max `0.021456`. That is the argument for the unit.
 *
 * WHAT THIS FILE GUARDS is the null. `runsLeft` must never be Infinity and must
 * never be a fabricated 0 — **a zero reads as "you are out" and would be a lie
 * told at exactly the wrong moment.**
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

const SRC = readFileSync(fileURLToPath(new URL("./billing.functions.ts", import.meta.url)), "utf8");
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the unit is runs", () => {
  it("returns runsLeft, and does not return minutes", () => {
    expect(CODE).toContain("runsLeft: number | null");
    expect(CODE).not.toContain("minutesLeft");
  });

  it("carries the window it measured over, so the number can be checked", () => {
    expect(CODE).toContain("windowDays: number");
  });

  it("reads through the RPC rather than joining three tables client-side", () => {
    expect(CODE).toContain('supabase.rpc("credit_runway"');
  });
});

describe("null is the honest answer and must survive", () => {
  /**
   * THE ASSERTION THAT MATTERS. Both nullable fields must stay nullable: a
   * `?? 0` on either would turn "we cannot say" into "you are out".
   */
  it("keeps creditsPerRun and runsLeft nullable", () => {
    expect(CODE).toContain("creditsPerRun: number | null");
    expect(CODE).toContain("runsLeft: number | null");
    expect(CODE).not.toMatch(/runsLeft:\s*[^,\n]*\?\?\s*0/);
    expect(CODE).not.toMatch(/creditsPerRun:\s*[^,\n]*\?\?\s*0/);
  });

  it("returns null rather than a zero runway when the definer refuses", () => {
    expect(CODE).toContain("if (!r) return null;");
  });

  it("claims nothing when its own reads fail", () => {
    expect(CODE).toContain("if (wsErr || !accountId) return null;");
    expect(CODE).toContain("if (error) return null;");
  });
});

describe("tenancy", () => {
  /**
   * The workspace read runs on the CALLER's client, so their right to see the
   * account is proved before the definer function is asked anything. The RPC
   * re-checks `is_account_member` as well, which makes this belt-and-braces
   * rather than the only gate.
   */
  it("resolves the account through the caller's own client", () => {
    expect(CODE).toContain('.from("workspaces")');
    expect(CODE).toContain('.select("account_id")');
    expect(CODE).toContain('.eq("id", data.workspaceId)');
  });

  it("is behind auth like every other billing read", () => {
    expect(CODE).toContain("requireSupabaseAuth");
  });
});

describe("the measurements stay with the decision", () => {
  it("records why minutes were rejected", () => {
    const prose = SRC.replace(/\n\s*\* ?/g, " ").replace(/\s+/g, " ");
    expect(prose).toContain("22x spread");
    expect(prose).toContain("1.11");
  });
});
