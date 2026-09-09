/**
 * P-17'S TWO PROVABLE ACCEPTANCE LINES, PINNED AGAINST SOURCE.
 *
 * P-17 (A-QUEUE.md) asked for a tab covering the ceiling, the kill switch, and
 * the resolver's own tool-mode list. All three already existed before this
 * packet, mounted 2026-08-27 under S0 ruling A-006 as `BoundaryPane`
 * (BoundaryControls + BudgetsPanel + ControlsPanel). What did not exist is
 * this file's first check: the pane said nothing that survives regardless of
 * the arc, the ceiling, or the kill switch. The pane was Settings\' Autonomy
 * section until 2026-09-09; it is Team\'s boundary tab now, and every claim
 * below is about the pane rather than about where it is mounted.
 *
 * THE ONE HALF THAT ALWAYS HOLDS. `footerMode()`'s "Working on its own. It
 * will ask before it ships." reads as one sentence, and only the second half
 * is true independent of state -- see footer-mode.ts's own header for why
 * (R-27, a platform floor). This page has no single run to call "working on
 * its own" about, so it may only borrow the half that is true regardless, and
 * it must borrow it as an IMPORT rather than a second literal: a retyped copy
 * is exactly the kind of two-places-say-one-thing defect this codebase keeps
 * finding and fixing (P-13's driver.ts sweep is the same shape one packet
 * back). Scanning the raw route (not comment-stripped) for the import and for
 * the constant's use is what proves that, because a comment-stripped scan
 * cannot tell an import from a retyped literal near it.
 *
 * THE TOOL LIST'S MODE COMES FROM THE RESOLVER, NOT THE SEED. Reproducing
 * `resolveToolMode` in a component is the exact defect BoundaryControls.tsx's
 * own header documents fixing (see "THE SERVER NOW ANSWERS THIS" there): a
 * hand-rolled predicate that quoted one branch and silently missed the arc
 * dial. So this file also pins the two facts that make a regression here
 * impossible to miss: BoundaryControls reads `t.runsAs` (getBoundary's
 * resolver-computed field, see governance.functions.ts) for what a tool
 * actually does, and it names no import from `@/lib/ai/tools/defaults` -- the
 * seed table `resolveToolMode` composes over rather than restates.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";

/*
 * IT READS THE PANE, NOT THE ROUTE, SINCE 2026-09-09 (fifth review).
 *
 * `BoundaryPane` lived inside `_authenticated.settings.tsx` until Settings'
 * Autonomy group folded into Team. It moved whole into its own file, so the
 * claim below moves with it rather than being dropped: the pane must import
 * the invariant half of the footer sentence and must not retype it. Both
 * halves are still scanned raw (not comment-stripped), because a
 * comment-stripped scan cannot tell an import from a retyped literal near it.
 */
const pane = readFileSync(new URL("../BoundaryPane.tsx", import.meta.url), "utf8");
const boundaryControls = readFileSync(
  new URL("../../governance/BoundaryControls.tsx", import.meta.url),
  "utf8",
);
const footerMode = readFileSync(new URL("../../track/footer-mode.ts", import.meta.url), "utf8");

describe("the boundary pane's one sentence that holds regardless of the arc", () => {
  it("footer-mode.ts exports the invariant half as its own constant", () => {
    expect(footerMode).toContain(
      'export const WILL_ASK_BEFORE_IT_SHIPS = "It will ask before it ships."',
    );
  });

  it("both footer lines compose the invariant from the constant, not a second literal", () => {
    expect(footerMode).not.toContain("Working on its own. It will ask before it ships.");
    expect(footerMode.match(/Working on its own\. \$\{WILL_ASK_BEFORE_IT_SHIPS\}/g)?.length).toBe(
      2,
    );
  });

  it("the boundary pane imports the constant rather than retyping the sentence", () => {
    expect(pane).toContain(
      'import { WILL_ASK_BEFORE_IT_SHIPS } from "@/components/track/footer-mode"',
    );
    expect(pane).not.toContain('"It will ask before it ships."');
  });

  it("the boundary pane's heading actually uses the imported constant", () => {
    const paneStart = pane.indexOf("export function BoundaryPane(");
    expect(paneStart).toBeGreaterThan(-1);
    expect(pane.slice(paneStart)).toContain("${WILL_ASK_BEFORE_IT_SHIPS}");
  });
});

describe("every tool's mode comes from the runtime resolver, not the seed table", () => {
  it("BoundaryControls reads runsAs, the resolver-computed field, for what a tool does", () => {
    expect(boundaryControls).toContain("t.runsAs");
  });

  it("BoundaryControls names no import from the seed defaults table", () => {
    expect(boundaryControls).not.toContain("@/lib/ai/tools/defaults");
  });
});
