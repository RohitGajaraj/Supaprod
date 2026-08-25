/**
 * The boundary screen accepted a move the runtime would never honour.
 *
 * `updateToolMode` validated the tool, resolved the workspace and asserted the
 * workspace role — and never once looked at a governance floor, while its
 * sibling `setCrewToolMode` does.
 *
 * **IT WAS NOT A SECURITY BYPASS, and saying so precisely matters** because the
 * first read of this was wrong. The runtime re-applies the floor at dispatch:
 * `loop.server.ts:175` forces `"review"` for anything in
 * `HIGH_RISK_FORCE_REVIEW` whatever the stored row says. `release.publish` could
 * never have run unattended.
 *
 * What it WAS is its own kind of bad. A person could set `release.publish` to
 * `auto`, the row saved, the screen read `auto`, and the runtime quietly
 * enforced `review` forever. **The write succeeded and did nothing.** The
 * operator was told their governance was one thing while it was another — and
 * R-16 asks for a failure that names what failed. A silent success meaning the
 * opposite is the same defect in better clothes.
 *
 * REFUSED RATHER THAN CLAMPED. Clamping to the floor would also be honest, but
 * it answers a question nobody asked: they asked for `auto`, and the truthful
 * reply is that this tool cannot have it, and why.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { HIGH_RISK_FORCE_REVIEW, HIGH_RISK_MIN_CONFIRM } from "@/lib/ai/trust-ramp";

const SRC = readFileSync(
  fileURLToPath(new URL("./agent_loop.functions.ts", import.meta.url)),
  "utf8",
);
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the floor is checked where the boundary moves", () => {
  it("reads both floors, which it did not before", () => {
    expect(CODE).toContain("HIGH_RISK_FORCE_REVIEW");
    expect(CODE).toContain("HIGH_RISK_MIN_CONFIRM");
  });

  it("refuses anything but review on a review-pinned tool", () => {
    expect(CODE).toMatch(
      /HIGH_RISK_FORCE_REVIEW\.has\(data\.toolName\) && patch\.mode !== "review"/,
    );
  });

  it("refuses auto on a confirm-floored tool", () => {
    expect(CODE).toMatch(/HIGH_RISK_MIN_CONFIRM\.has\(data\.toolName\) && patch\.mode === "auto"/);
  });

  /** Only a mode move is floored. Toggling `enabled` is a different question. */
  it("only fires when a mode is actually being set", () => {
    expect(CODE).toContain("if (patch.mode) {");
  });
});

describe("the refusal names what failed, which is the whole point", () => {
  it("says it is a floor and not a default", () => {
    expect(SRC).toContain("This is a governance floor, not a default.");
  });

  it("says WHY the floor exists rather than just that it does", () => {
    expect(SRC).toContain("irreversible from inside the product and customers see it");
  });

  it("tells the person what they may choose instead", () => {
    expect(SRC).toContain("Choose confirm or review.");
  });
});

describe("the floors it defends are the real ones", () => {
  /**
   * Asserted against the live sets rather than a copy, so a tool added to a
   * floor is defended here the same day without anyone remembering to.
   */
  it("defends release.publish, which is the gate the loop turns on", () => {
    expect(HIGH_RISK_FORCE_REVIEW.has("release.publish")).toBe(true);
    expect(HIGH_RISK_FORCE_REVIEW.has("studio.pr.merge")).toBe(true);
  });

  it("has a confirm floor to defend at all", () => {
    expect(HIGH_RISK_MIN_CONFIRM.size).toBeGreaterThan(0);
  });
});
