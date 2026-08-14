import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * DO THE SPEC PAGE AND THE BUILD STATION AGREE ABOUT WHAT MAY BE BUILT?
 *
 * They did not. The Approve control on the spec page carries a tooltip reading
 * "approve the spec, SO BUILD CAN PICK IT UP", and the Build station honours
 * exactly that: `ReadyToBuild` filters to `status === "approved"`. But the spec
 * page's own dispatch checked only the DESIGN gate, with no status test at all.
 *
 * So a person could send a draft straight to Build from the spec page, spend a
 * billed builder run on work nobody had approved, then walk to Build and not
 * find the spec in "ready". Two incompatible doctrines on the handoff the
 * lifecycle depends on most, with one page asserting the other page's rule in a
 * tooltip while breaking it in code.
 *
 * The server settles nothing: `dispatchBuilderMission` never moves
 * `prds.status`, deliberately, because only the ship stamp does. So the two
 * surfaces ARE the doctrine, and they have to agree.
 *
 * COMMENTS ARE STRIPPED BEFORE ANY ASSERTION. The first draft of a sibling test
 * in this directory went green against a comment describing the very thing it
 * was meant to forbid. A test that reads prose is not reading the code, which is
 * the same defect class this session found five times in the product.
 */
function code(path: string): string {
  return readFileSync(path, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const SRC = join(import.meta.dir, "..", "..");
const specPage = code(join(SRC, "routes", "_authenticated.plan.spec.$id.tsx"));
const readyToBuild = code(join(SRC, "components", "build", "ReadyToBuild.tsx"));

describe("the spec page and the Build station agree on what may be built", () => {
  test("the Build station offers only approved specs", () => {
    // The rule, as the Build station states it. If this ever changes, the spec
    // page's blocker has to change with it, which is what this file exists for.
    expect(readyToBuild).toMatch(/status\s*===\s*"approved"/);
  });

  test("the spec page refuses to dispatch a spec the Build station would not offer", () => {
    // The blocker must consult status, not only the design gate.
    expect(specPage).toMatch(/status\s*!==\s*"approved"/);
  });

  test("the refusal names the remedy, which is one click away on the same page", () => {
    // A refusal that does not say what to do is a dead end. The Approve control
    // is in the Actions row on this same screen.
    expect(specPage).toContain("Approve the spec first.");
  });

  /**
   * A SHIPPED SPEC IS NOT A DRAFT. Only the ship stamp moves `prds.status`
   * onward from approved, so refusing `shipped` would block re-building
   * something that has already been through the whole loop, which is a
   * legitimate act.
   */
  test("an already-shipped spec is not treated as unapproved", () => {
    expect(specPage).toMatch(/status\s*!==\s*"shipped"/);
  });

  /**
   * THE FAIL-SAFE DIRECTION, and it is the opposite of the obvious one. An
   * unreadable spec must NOT refuse: a failed read masquerading as a governance
   * decision is the class of bug this repo has paid for repeatedly, and it would
   * make a transient database error look like a policy the user cannot satisfy.
   * The guard is `status &&`, so an absent status falls through.
   */
  test("an unreadable spec does not become a governance refusal", () => {
    expect(specPage).toMatch(/const status = prdQ\.data\?\.prd\?\.status;/);
    expect(specPage).toMatch(/if \(status && status !== "approved"/);
  });
});
