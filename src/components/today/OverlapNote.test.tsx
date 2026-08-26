/**
 * THE PAINT HALF OF THE OVERLAP MARK, RENDERED, NOT ONLY DERIVED.
 *
 * `overlaps.test.ts` proves which overlaps are worth a mark and what each
 * sentence says. This file proves the half a row-level line owes on top of
 * that: it takes space only when there is a fact, and it draws the fact it was
 * handed rather than a composed stand-in.
 *
 * ── WHAT A BROWSER COULD NOT PROVE ON 2026-08-26, SAID PLAINLY ─────────────
 * The board was driven live on port 8081 and `getWorkspaceAnchors` fired and
 * answered 200 on its interval, so the wiring is confirmed. **No mark rendered,
 * because the workspace held zero active runs** — and the honest way to reach
 * one would have been to write `agent_runs` rows into a shared production
 * tenant, which S0 has standing guidance against. So the drawn mark is proven
 * here and its absence live is recorded rather than papered over.
 */

import { describe, expect, it } from "bun:test";
import { render } from "@testing-library/react";

import { OverlapLine } from "./OverlapNote";

describe("OverlapLine", () => {
  it("draws the sentence when somebody else is on the same thing", () => {
    const { container } = render(<OverlapLine line="Plan is changing the same file: src/app.ts" />);
    expect(container.textContent).toContain("Plan is changing the same file");
    expect(container.textContent).toContain("src/app.ts");
  });

  it("takes no space at all when nobody else is on it", () => {
    const { container } = render(<OverlapLine line={null} />);
    expect(container.textContent).toBe("");
  });

  it("carries the token that already means 'off-nominal, look at it'", () => {
    // Amber, the same one `ChangesPanel` uses for a scope breach. Asserted so a
    // later restyle cannot quietly demote the mark to body copy — the whole
    // point is that it reads differently from the handover line above it.
    const { container } = render(<OverlapLine line="Plan is changing the same spec" />);
    expect(container.firstElementChild?.className).toContain("text-mrd-hold");
  });
});
