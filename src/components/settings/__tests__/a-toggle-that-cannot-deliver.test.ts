/**
 * FOUR TOGGLES A PERSON COULD PRESS THAT COULD NOT AFFECT ANYTHING.
 *
 * The notifications pane offers App / Email / Digest for each of four
 * categories. Traced end to end:
 *
 *   the pane writes  in_app_approvals, in_app_health, in_app_budget, in_app_drift
 *   the only reader  getNotifications (notifications.functions.ts)
 *   its consumers    NONE in src/components or src/routes
 *
 * The preference is saved, the feed is computed, and no surface renders it. A
 * closed loop with no output, and a person pressing App believed they had asked
 * to be told something. An affordance is a promise.
 *
 * HELD, NOT DELETED. Today already has a "What needs you" feed, so the honest
 * fix is to drive that from these preferences rather than build a second feed,
 * which would be two answers to one question. Deleting the column would hide
 * the gap and discard settings people already saved.
 *
 * THIS TEST IS THE THING THAT UN-HOLDS IT. The moment a surface renders
 * getNotifications, the first assertion fails and tells whoever wired it to
 * re-enable the column. It is written to go off when the gap CLOSES, which is
 * the opposite of most guards here.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..", "..", "..");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (name === "__tests__" || name === "node_modules") continue;
      out.push(...walk(p));
    } else if ((name.endsWith(".tsx") || name.endsWith(".ts")) && !name.includes(".test.")) {
      out.push(p);
    }
  }
  return out;
}

const surfaces = [...walk(join(SRC, "components")), ...walk(join(SRC, "routes"))];

describe("a toggle that cannot deliver does not pretend to", () => {
  /*
   * ── THE TRIPWIRE FIRED, AND THIS IS WHAT REPLACED IT ─────────────────────
   *
   * This test used to assert that NOTHING renders the in-app feed, and to fail
   * the moment something did, carrying instructions for whoever hit it. It fired
   * at the first integration that put S2's lane and this one in one tree:
   * `SystemAlerts` on /today (eb161ca85) calls `getNotifications`.
   *
   * A tripwire that has been tripped and acted on must not stay armed, or the
   * suite stays red forever over a condition somebody already handled. So it is
   * replaced by the invariant that matters AFTER the lift, which is strictly
   * more useful than the one before it: **the categories the toggle claims to
   * control must be the categories something actually draws.**
   *
   * Before, the risk was a control promising delivery nobody performed. Now the
   * risk is the two sets drifting apart in either direction — a toggle enabled
   * for a kind nothing renders, or a kind rendered that a person cannot switch
   * off. Both are the same defect and this catches both.
   */
  it("something does render the in-app feed now, so the blanket hold is over", () => {
    const consumers = surfaces.filter((f) => {
      /*
       * COMMENTS STRIPPED FIRST. The pane's own note explains this hold and
       * names both symbols, so the first version of this test reported the file
       * it is guarding as a consumer of the thing it is holding.
       */
      const s = readFileSync(f, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      return /import[^;]*\bgetNotifications\b[^;]*from/.test(s) || /\bAppNotification\b/.test(s);
    });
    expect(
      consumers.map((f) => f.split("/src/")[1]),
      "Nothing renders the feed any more, so the App column should go back to being held entirely.",
    ).not.toEqual([]);
  });

  it("App is held for exactly the two categories nothing delivers", () => {
    /*
     * THE HOLD LIFTED AT INTEGRATION, which is the event this file was written
     * to catch. `SystemAlerts` on /today (eb161ca85) draws budget and drift, so
     * those two toggles now have real power and the blanket
     * `disabled={ch.key === "app"}` this used to assert would be a control
     * refusing to work for a channel that works.
     *
     * Approvals and Health stay held for the reasons above, so the rule is a
     * property of the CATEGORY rather than of the column.
     */
    const pane = readFileSync(join(import.meta.dir, "..", "NotificationsSection.tsx"), "utf8");
    expect(pane).toContain(
      'const APP_DELIVERS: ReadonlySet<Category> = new Set<Category>(["Budget", "Drift"])',
    );
    expect(pane).toContain('disabled={ch.key === "app" && !APP_DELIVERS.has(c.key)}');
    expect(pane, "the blanket hold must be gone, not merely joined").not.toContain(
      'disabled={ch.key === "app"}',
    );
  });

  it("and the page no longer says in-app alerts are switched off", () => {
    // A held control explaining itself is honest. The same explanation left
    // standing after the hold lifts is a page arguing with its own switches.
    const pane = readFileSync(join(import.meta.dir, "..", "NotificationsSection.tsx"), "utf8");
    expect(pane).not.toContain("In-app alerts are not switched on yet");
    expect(pane).toContain("Two of these show up in the app, two do not yet");
  });

  it("Email and Digest are NOT disabled, because they do deliver", () => {
    const pane = readFileSync(join(import.meta.dir, "..", "NotificationsSection.tsx"), "utf8");
    expect(pane).not.toContain('disabled={ch.key === "email"}');
    expect(pane).not.toContain('disabled={ch.key === "digest"}');
  });
});
