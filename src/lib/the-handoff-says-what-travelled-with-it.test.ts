/**
 * THE HANDOFF SAYS WHAT TRAVELLED WITH IT (S2 → S0, 2026-08-26).
 *
 * `SwarmHandoff` extracted only `payload.task`, so the board could say a handoff
 * happened but not what was handed over. §0.5 calls that out as the defect of the
 * whole phase — *"each of those links exists in the data and appears on no
 * surface"* — and this one is nearly free: `HandoffPayload` already carries
 * `artifacts` and `evidence_ids`, and the runtime already writes them.
 *
 * ── THE HALF THAT MATTERS MORE THAN THE COUNTS ─────────────────────────────
 * **`evidence_count` is 0 for every live handoff today.** `handoff.server.ts:86`
 * says so outright: the evidence gate is default-OFF until the founder flips
 * `HANDOFF_EVIDENCE_GATE`, and no handoff in the live loop carries `evidence_ids`.
 * A "0 evidence" badge would therefore read as *checked, and none found* when the
 * truth is *nobody was asked* — theatre, by the standard that ends a feature
 * rather than fixing it. The field ships because it becomes true the day the gate
 * flips; the warning ships with it so no surface draws it early.
 *
 * These assert the extraction contract, which is what a lane builds against.
 */
import { describe, expect, it } from "bun:test";

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const SWARM = read("./swarm.functions.ts");
const HANDOFF = read("./ai/handoff.server.ts");

/** The extraction, lifted from the mapper so the test exercises the real rule. */
const counts = (payload: unknown) => {
  const p = payload as { artifacts?: unknown; evidence_ids?: unknown } | null | undefined;
  return {
    artifact_count: Array.isArray(p?.artifacts) ? p.artifacts.length : 0,
    evidence_count: Array.isArray(p?.evidence_ids) ? p.evidence_ids.length : 0,
  };
};

describe("what travelled with the handoff", () => {
  it("counts the artifacts the sender attached", () => {
    const p = { task: "ship it", artifacts: [{ kind: "prd", id: "a" }, { kind: "theme", id: "b" }] };
    expect(counts(p).artifact_count).toBe(2);
  });

  it("a handoff carrying nothing counts zero rather than throwing", () => {
    expect(counts({ task: "ship it" })).toEqual({ artifact_count: 0, evidence_count: 0 });
  });

  it("free-form jsonb that is malformed reads as zero, never as a crash", () => {
    // `payload` is jsonb: a writer can put anything there, and `.length` on a
    // string would silently produce a character count rather than an item count.
    expect(counts({ artifacts: "not-an-array" }).artifact_count).toBe(0);
    expect(counts(null)).toEqual({ artifact_count: 0, evidence_count: 0 });
  });
});

describe("the fields are wired, and the zero is declared", () => {
  it("the mapper extracts both counts from the payload", () => {
    expect(SWARM).toContain("artifact_count: Array.isArray(h.payload?.artifacts)");
    expect(SWARM).toContain("evidence_count: Array.isArray(h.payload?.evidence_ids)");
  });

  it("the type warns that evidence_count is 0 on every live handoff", () => {
    // If this warning is ever deleted, a surface will draw "0 evidence" as a
    // checked-and-empty state. The warning is the load-bearing part.
    expect(SWARM).toContain("0 FOR EVERY LIVE HANDOFF TODAY");
  });

  it("and that warning is still true of the source it cites", () => {
    // Pinned to handoff.server.ts itself, so the day the gate stops being
    // default-off this test fails and the warning gets revisited rather than rotting.
    expect(HANDOFF).toContain("no handoff in the live loop carries `evidence_ids`");
    expect(HANDOFF).toContain("HANDOFF_EVIDENCE_GATE");
  });
});
