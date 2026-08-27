import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * THE ALERT FEED THAT COMPUTED FOR NOBODY.
 *
 * `getNotifications` builds four classes of alert against `agent_approvals`,
 * `agent_runs`, `ai_budgets` and `drift_incidents`, RLS-scoped and degrading
 * safely. Verified 2026-08-27 with a complete count, not a capped one: it had
 * exactly ONE mention in all of `src/` — its own definition. Meanwhile Settings
 * wrote four "App" preferences whose only reader was that function. The
 * preference saved, the feed computed, nothing rendered.
 *
 * ── WHY THIS READS SOURCE ──────────────────────────────────────────────────
 * The component is three lines of markup over a server-fn read; standing up a
 * router, a query client and that runtime would test the harness. What can go
 * silently wrong is the two decisions in the file, and both are checkable here:
 * which classes it draws, and whether the door it builds is the shape this
 * router takes.
 */

const SRC = readFileSync("src/components/today/SystemAlerts.tsx", "utf8");
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the alert feed finally has a reader", () => {
  it("calls the function that had none", () => {
    expect(CODE).toContain("getNotifications");
  });

  it("draws ONLY the classes this board does not already answer", () => {
    // `approval` is the whole "What needs you" lane. Drawing it here would be
    // two answers to one question on the one surface where that is worst.
    const shown = CODE.match(/SHOWN\s*=\s*new Set<[^>]*>\(\[([^\]]*)\]\)/);
    expect(shown, "the SHOWN set is gone; re-point this test").not.toBeNull();
    const kinds = shown![1]!;
    expect(kinds).toContain("budget");
    expect(kinds).toContain("drift");
    expect(kinds).not.toContain("approval");
  });

  it("SPLITS the href, because this router takes `to` and `search` separately", () => {
    // The feed stores a whole URL, `/engine-room?room=spend&view=caps`. Handing
    // that to `to` typechecks and lands on the right page in the WRONG state,
    // which is worse than a door that fails visibly.
    expect(CODE).toContain("splitHref");
    expect(CODE).toMatch(/search=\{search\}/);
    expect(CODE, "the raw href is being passed straight to the router again").not.toMatch(
      /to=\{n\.href\}/,
    );
  });

  it("says nothing when there is nothing to say", () => {
    expect(CODE).toMatch(/alerts\.length === 0/);
  });
});
