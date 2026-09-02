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
 *
 * ── IT DID LIFT ONCE, AND THIS IS BACK TO THE ORIGINAL SHAPE (P-14) ────────
 * `SystemAlerts` on the old `/today` briefly called `getNotifications` for
 * Budget and Drift. That component was mounted by
 * `components/today/Board.tsx`, which had zero importers anywhere in the
 * codebase for the whole time it existed -- never actually reachable from a
 * live route after the fold to `/start` -- so nothing was really delivering
 * before it was deleted with the rest of that dead cluster. The blanket hold
 * this file was first written to assert is what is honestly true again.
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
   * THE ORIGINAL TRIPWIRE, RESTORED (P-14, A-QUEUE.md). It briefly needed to
   * assert the opposite -- "something does render the feed now" -- while
   * SystemAlerts on the old /today genuinely called getNotifications. That
   * component was mounted by components/today/Board.tsx, which had zero
   * importers anywhere in the codebase for the whole time it existed, so
   * nothing was really delivering before it was deleted with the rest of
   * that dead cluster. This goes off again if a real surface ever renders
   * the feed, which is the honest fix (driving Start's own "What needs you"
   * feed from these preferences) whenever that gets built.
   */
  it("nothing renders the in-app feed, so the blanket hold is correct", () => {
    const consumers = surfaces.filter((f) => {
      /*
       * COMMENTS STRIPPED FIRST. The pane's own note explains this hold and
       * names both symbols, so a naive scan reports the file guarding the
       * hold as a consumer of the thing it is holding.
       */
      const s = readFileSync(f, "utf8")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      return /import[^;]*\bgetNotifications\b[^;]*from/.test(s) || /\bAppNotification\b/.test(s);
    });
    expect(
      consumers.map((f) => f.split("/src/")[1]),
      "Something renders the feed now, so the App column should lift for exactly the categories it draws.",
    ).toEqual([]);
  });

  it("App is held for all four categories, because nothing delivers", () => {
    const pane = readFileSync(join(import.meta.dir, "..", "NotificationsSection.tsx"), "utf8");
    expect(pane).toContain("const APP_DELIVERS: ReadonlySet<Category> = new Set<Category>();");
    expect(pane).toContain('disabled={ch.key === "app" && !APP_DELIVERS.has(c.key)}');
  });

  it("and the page says in-app alerts are not switched on yet", () => {
    // A held control explaining itself is honest. Claiming delivery a dead
    // component used to provide is not.
    const pane = readFileSync(join(import.meta.dir, "..", "NotificationsSection.tsx"), "utf8");
    expect(pane).toContain("In-app alerts are not switched on yet");
    expect(pane).not.toContain("Two of these show up in the app, two do not yet");
  });

  it("Email and Digest are NOT disabled, because they do deliver", () => {
    const pane = readFileSync(join(import.meta.dir, "..", "NotificationsSection.tsx"), "utf8");
    expect(pane).not.toContain('disabled={ch.key === "email"}');
    expect(pane).not.toContain('disabled={ch.key === "digest"}');
  });
});
