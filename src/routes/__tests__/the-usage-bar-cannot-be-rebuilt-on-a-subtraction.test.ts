import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * "0 OF 10,000 USED THIS MONTH" WHILE 23,218 CREDITS HAD BEEN SPENT.
 *
 * THE DEFECT. The Credits region drew a consumption bar fed by
 * `used = Math.max(0, monthlyGrantCredits - balanceCredits)`. That subtraction
 * does not measure consumption. It measures the CURRENT DIP BELOW A NOMINAL
 * GRANT, so any grant landing mid-cycle, or a reset, lifts the balance and the
 * number forgets every credit already spent. `Math.max(0, ...)` then absorbs the
 * negative and reports a confident zero.
 *
 * ── MEASURED LIVE, 2026-08-31, ACROSS ALL SIXTEEN ACCOUNTS ────────────────
 * Four have ever spent a credit. The bar understated all four:
 *
 *     account     bar said    debited since cycle_anchor
 *     5731ab6f           0                        23,218
 *     164e0692       3,508                        16,020
 *     5d5cc377           0                         4,250
 *     1a8da78c           6                         4,247
 *
 * Two read a flat ZERO after thousands of credits of real work. The other
 * twelve accounts agreed with the ledger only because they have never spent
 * anything — F-159's rule exactly: **it was right for environmental reasons,
 * not because it computed anything.** A check that samples an idle account
 * would have called this correct.
 *
 * It ran in the direction that flatters us, on the page where a company decides
 * what Supaprod costs. Craft bar standard #7 deletes such a claim rather than
 * softening it, so the bar and its one component went.
 *
 * ── WHY THIS GUARD IS SHAPED AS A TWO-WAY RELATIONSHIP ────────────────────
 * The honest figure is a server-side sum over `credit_ledger` since
 * `cycle_anchor`, and it does not exist on `CreditsView` yet (filed to S0). The
 * `ledger` array on that view CANNOT stand in: it is `.limit(20)` for display
 * and the live account holds 6,461 rows, so summing it would swap one wrong
 * number for a smaller wrong number.
 *
 * So this pins both directions. While no true per-cycle spend field exists, the
 * surface may not print a consumption figure; and the moment somebody adds one,
 * the last test here fails and tells them the bar is now worth reconsidering.
 * That is the same shape as `a-limit-nothing-enforces-is-not-a-limit`, and it is
 * deliberately NOT a guard on the retired wording — SESSION-3's trap list: *"Pin
 * the claim, not the spelling."*
 */

const ROUTE = join(import.meta.dir, "..", "_authenticated.settings.tsx");
const RAW = readFileSync(ROUTE, "utf8");

/*
 * COMMENTS ARE STRIPPED, AND THIS FILE IS THE REASON THE RULE EXISTS.
 * The explanation left at the deletion site quotes the retired expression
 * verbatim, because a comment that cannot name the defect is not worth reading.
 * F-159 corollary: a JSX comment comes out WITH its braces, so the `{ ... }`
 * form is stripped first — dropping only `/* ... *\/` leaves a stray brace that
 * silently disabled this lane's rename guard until a mutation test caught it.
 */
const CODE = RAW.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, " ")
  .replace(/\/\*[\s\S]*?\*\//g, " ")
  .replace(/^\s*\/\/.*$/gm, "");

/**
 * The subtraction itself, tolerant of spacing, of either operand order, and of
 * the qualifier in front of each operand.
 *
 * THAT LAST ALLOWANCE IS THE WHOLE GUARD, AND THE FIRST VERSION LACKED IT. It
 * put `\w*` between the operands, which cannot cross the dot in
 * `data.monthlyGrantCredits - data.balanceCredits` — the exact spelling that
 * shipped the defect. Mutation testing is what caught it: restoring the real
 * line left this suite GREEN. A guard that matches every way of writing the bug
 * except the one that was actually written is worse than no guard, because it
 * reports the clean result with authority.
 */
const SUBTRACTION =
  /monthlyGrantCredits\s*-\s*[\w.?]*balanceCredits|balanceCredits\s*-\s*[\w.?]*monthlyGrantCredits/i;

describe("the credits surface does not derive consumption from a subtraction", () => {
  it("reads the real route, so a path typo cannot make this vacuous", () => {
    expect(CODE.length).toBeGreaterThan(10_000);
    expect(CODE).toContain("monthlyGrantCredits");
  });

  it("never computes spend as grant minus balance", () => {
    expect(SUBTRACTION.test(CODE)).toBe(false);
  });

  it("does not mount a usage bar on any derived number", () => {
    expect(CODE).not.toContain("UsageIndicator");
  });

  /**
   * The guards above are all satisfied by deleting the whole region, which would
   * hide the one number here that IS authoritative. The balance is read straight
   * from `account_credits` and was never in doubt.
   */
  it("still shows the balance, which was never the thing that was wrong", () => {
    expect(CODE).toContain('title="Balance"');
    expect(CODE).toContain("balanceCredits");
    expect(CODE).toContain("credits left in this cycle.");
  });

  /**
   * And it still says where spend IS measured, rather than going quiet. R-20 §6:
   * a surface that removes an answer must not leave a dead end.
   */
  it("points the reader at the region that measures spend truthfully", () => {
    expect(CODE).toContain("Spend and runway");
    const region = CODE.slice(CODE.indexOf('title="Balance"'));
    expect(region.slice(0, region.indexOf("</Region>"))).toContain("Spend and runway");
  });
});

/**
 * THE OTHER HALF: when the true number lands, this stops being right.
 *
 * If S0 adds a per-cycle spend field to `CreditsView`, the reason for deleting
 * the bar is gone and somebody should decide, deliberately, whether to draw it
 * again with a number that means what it says. This fails at that moment and
 * says so — rather than leaving the surface permanently silent because of a
 * limitation that has since been lifted.
 */
describe("and the reason it was deleted is still true", () => {
  const VIEW = readFileSync(
    join(import.meta.dir, "..", "..", "lib", "payments.functions.ts"),
    "utf8",
  );

  it("CreditsView still carries no per-cycle spend figure", () => {
    const decl = VIEW.slice(VIEW.indexOf("export type CreditsView"));
    const body = decl.slice(0, decl.indexOf("};"));
    for (const field of ["cycleSpentCredits", "spentThisCycle", "creditsSpentThisCycle"]) {
      expect(body).not.toContain(field);
    }
  });

  /**
   * And the ledger on that view is still truncated, which is why it may not be
   * summed into one. If this limit is ever lifted, summing it becomes possible
   * and that is a different conversation from the field above.
   */
  it("and its ledger is still a display slice rather than the whole record", () => {
    const fn = VIEW.slice(VIEW.indexOf("getMyCreditsView"));
    const reads = fn.slice(0, fn.indexOf("const cred ="));
    expect(reads).toContain("credit_ledger");
    expect(reads).toMatch(/\.limit\(\d+\)/);
  });
});
