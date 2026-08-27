/**
 * F-136: 117 OF 119 SPECS CARRIED AN EMPTY CONTRACT, AND ONE DOOR EXPLAINS IT.
 *
 * S1 measured it: 117 of 119 `prds` rows carry `contract` as `{}`. Not null.
 * The 2 that are filled carry the entire designed shape — `intent`,
 * `success_metrics`, `non_goals`, `version`, `drafted_by`, `drafted_at`,
 * `budget`, `ambiguity_policy` — so nothing about the feature is unfinished.
 *
 * ── ONE OF THE TWO DOORS NEVER USED IT ─────────────────────────────────────
 * `generatePrd` extracts a contract from the body it just wrote. **`prd.draft`,
 * the door every AGENT comes through, inserted eight columns and no contract**,
 * so the `{}` default landed on every spec the loop has ever produced.
 *
 * ── WHY IT IS THE CENTRAL CLAIM AND NOT A FIELD ────────────────────────────
 * The contract is, in the spec pane's own words, *"the part Build is measured
 * against and Ship reads"*. Empty on 117 of 119 means Build was measured against
 * nothing on nearly every spec here, while the product's whole claim is that a
 * verdict is measured against a forecast. `spec-gate.ts` gate 9 refuses a spec
 * whose success metrics nothing can check — without this it would have refused
 * every agent-written spec for a reason about our own plumbing.
 *
 * **The information was never missing, only unstructured**: of those 117, all
 * 117 have a body and 94 set out success metrics or acceptance criteria under a
 * heading. Define was writing the contract in prose and nothing lifted it, which
 * is why this is an extraction rather than a feature.
 *
 * ── AND IT CORRECTS F-117, WHICH I WROTE ───────────────────────────────────
 * F-117 added the oracle compile to `generatePrd`, calling it *"the path every
 * agent-written spec comes down"*. **It is not.** `generatePrd` is a
 * `createServerFn` called from `DiscoverSurface.tsx` and nowhere else — the
 * human door. So that fix has never run on an agent-written spec. Third time in
 * one night I asserted which path something takes without tracing the callers.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  CONTRACT_FROM_SPEC_SYSTEM,
  contractFromSpecUserMessage,
  contractStrings,
} from "@/lib/ai/contract-prompt";

const REGISTRY = readFileSync(
  fileURLToPath(new URL("./registry.server.ts", import.meta.url)),
  "utf8",
);
/** prd.draft's body only, so a match in another tool cannot satisfy these. */
const DRAFT = (() => {
  const a = REGISTRY.indexOf('name: "prd.draft"');
  const b = REGISTRY.indexOf('name: "prd.revise"', a);
  expect(a).toBeGreaterThan(-1);
  expect(b).toBeGreaterThan(a);
  return REGISTRY.slice(a, b);
})();

describe("the agent door writes a contract", () => {
  it("it extracts one from the body it just wrote", () => {
    expect(DRAFT).toContain("CONTRACT_FROM_SPEC_SYSTEM");
    expect(DRAFT).toContain("contractFromSpecUserMessage");
  });

  it("and files it on the row", () => {
    expect(DRAFT).toContain("...(contract ? { contract, contract_migrated_at:");
  });

  it("using the SAME prompt as the other door, from one module", () => {
    /*
     * `spec-sections.ts` exists for this exact reason and says so: two server
     * files that must not import each other still need one answer. Two copies of
     * an extraction prompt is how the two doors start producing different
     * contracts from the same spec.
     */
    expect(CONTRACT_FROM_SPEC_SYSTEM).toContain("Outcome Contract");
    expect(CONTRACT_FROM_SPEC_SYSTEM).toContain("Never invent a metric");
  });
});

describe("an empty contract is not filed as though it were one", () => {
  it("only a contract that says something is written", () => {
    // An intent-less shell with no metrics is the `{}` this fix exists to stop,
    // wearing more keys.
    expect(DRAFT).toContain("if (intent || metrics.length > 0) {");
  });

  it("and a failed extraction loses the contract, never the spec", () => {
    /*
     * The body is written and real by then. Refusing to file it because the
     * summary of it did not come back would throw away the work to protect the
     * index of it.
     */
    expect(DRAFT).toContain("contract extraction failed, spec filed without one");
    expect(DRAFT).toContain("let contract: Record<string, unknown> | null = null;");
  });
});

describe("the oracles compile on the door the loop actually uses", () => {
  it("prd.draft compiles them", () => {
    expect(DRAFT).toContain("compileContractOraclesCore");
  });

  it("only when there is a contract to compile", () => {
    expect(DRAFT).toContain("if (contract) {\n      void compileContractOraclesCore(");
  });

  it("and its failure is logged, because nobody is watching this one", () => {
    expect(DRAFT).toContain("oracle compile failed for prd.draft spec");
  });
});

describe("the shared helpers behave", () => {
  it("strings are trimmed, capped and emptied", () => {
    expect(contractStrings(["  a  ", "", "b", "c"], 2)).toEqual(["a", "b"]);
    expect(contractStrings("not an array", 5)).toEqual([]);
    expect(contractStrings([1, 2, "keep"], 5)).toEqual(["keep"]);
  });

  it("the user message carries title and body, and bounds the body", () => {
    const msg = contractFromSpecUserMessage("T", "x".repeat(20000));
    expect(msg).toContain("TITLE: T");
    expect(msg.length).toBeLessThan(12200);
  });
});
