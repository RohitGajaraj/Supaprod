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
  it("nothing renders the in-app feed yet, which is why the column is held", () => {
    const consumers = surfaces.filter((f) => {
      /*
       * COMMENTS STRIPPED FIRST. The pane's own note explains this hold and
       * names both symbols, so the first version of this test reported the file
       * it is guarding as a consumer of the thing it is holding. Third guard of
       * mine tonight to trip over its own documentation, and each time the
       * tempting fix is to delete the explanation.
       */
      const s = readFileSync(f, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      return /import[^;]*\bgetNotifications\b[^;]*from/.test(s) || /\bAppNotification\b/.test(s);
    });
    expect(
      consumers.map((f) => f.split("/src/")[1]),
      [
        "A surface renders the feed now, so the hold is over. Re-enable App for",
        "BUDGET and DRIFT ONLY in NotificationsSection, and leave Approvals and",
        "Health disabled. S2 shipped SystemAlerts on /today (eb161ca85) drawing",
        "those two kinds and no others, and the reasons the other two stay are",
        "not oversights:",
        "  approvals - Today's What-needs-you lane reads agent_approvals",
        "    DIRECTLY and never consults getNotifications, so switching that",
        "    toggle off would not stop Today showing approvals. The control",
        "    would promise power it does not have, which is this same defect",
        "    pointing the other way.",
        "  health - the running lane already prints each run's own clock, so a",
        "    stall alert would be a second voice on rows that already speak.",
      ].join("\n"),
    ).toEqual([]);
  });

  it("the App column is disabled while that is true", () => {
    const pane = readFileSync(join(import.meta.dir, "..", "NotificationsSection.tsx"), "utf8");
    expect(pane).toContain('disabled={ch.key === "app"}');
  });

  it("Email and Digest are NOT disabled, because they do deliver", () => {
    const pane = readFileSync(join(import.meta.dir, "..", "NotificationsSection.tsx"), "utf8");
    expect(pane).not.toContain('disabled={ch.key === "email"}');
    expect(pane).not.toContain('disabled={ch.key === "digest"}');
  });
});
