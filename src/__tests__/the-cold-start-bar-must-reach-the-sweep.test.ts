/**
 * A BAR THAT SCALES IN A PURE FUNCTION AND NEVER REACHES THE SWEEP CHANGES NOTHING.
 *
 * `coldStartBarFor` is unit-tested in `autonomy-policy.test.ts` and every one of
 * those cases would still pass if `cluster-tick` never called it. That is the
 * exact shape of the defect this repo keeps paying for: nine features shipped
 * that passed every test and did nothing in production, and `auto_derive_enabled`
 * read by two crons and written by nothing for six weeks.
 *
 * Measured 2026-08-22, which is why the wiring exists at all: across all nine
 * real workspaces there are 27 themes, average frequency 1.26 and maximum 3,
 * against a shipped promotion bar of 8. No real workspace has ever held a
 * `spine_tracks` row.
 *
 * So this reads the tick's source and asserts the four things that make the
 * feature real, rather than merely present.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const TICK = join(import.meta.dir, "../routes/api/public/hooks/cluster-tick.ts");
const src = readFileSync(TICK, "utf8");

describe("the cold start bar reaches the promotion sweep", () => {
  it("the tick imports the scaler", () => {
    expect(src).toMatch(/import\s*\{[^}]*coldStartBarFor[^}]*\}\s*from\s*["']@\/lib\/autonomy-policy["']/);
  });

  it("the bar handed to the sweep is the variable the scaler can rewrite, not a fresh call", () => {
    // `promoteClustersOnce(..., promotionBarFor(policy))` would inline the
    // unscaled bar and silently strand the scaler, which is how this feature
    // would look wired and do nothing.
    expect(src).toMatch(/promoteClustersOnce\(\s*supabaseAdmin,\s*ws\.owner_id,\s*bar,?\s*\)/);
    expect(src).not.toMatch(/promoteClustersOnce\([^)]*promotionBarFor\(/);
  });

  it("scaling is gated on the per-workspace flag, so it is off unless someone chose it", () => {
    expect(src).toContain("coldStartWorkspaceIds");
    const gate = src.indexOf("coldStartWorkspaceIds.has(ws.id)");
    const call = src.indexOf("coldStartBarFor(");
    expect(gate).toBeGreaterThan(-1);
    expect(call).toBeGreaterThan(gate); // the scale happens INSIDE the gate
  });

  it("a failed corpus count must not loosen the bar", () => {
    // An unknown corpus has to resolve to the shipped behaviour. Treating a
    // failed count as zero would scale the bar to its floor for every workspace
    // the read happened to fail on, which is the opposite of safe.
    expect(src).toMatch(/if\s*\(!countErr\s*&&\s*typeof count === "number"\)/);
  });
});
