/**
 * THE DEMO PREDICATE HAD A THIRD OPINION, AND IT WAS THE INVERSE OF THE OTHER TWO.
 *
 * "Is this workspace owner a demo account?" decides whether sense-tick writes the
 * synthetic DEMO_FEED into a workspace. Until 2026-08-11 it was answered in three places
 * in two languages:
 *
 *   1. `public.demo_account_emails()`             — the canonical SQL allowlist
 *   2. `_authenticated.admin.workspaces.tsx`      — a hand-copied mirror, deliberate and
 *                                                    documented: it only decides whether
 *                                                    to RENDER the reset control, and if
 *                                                    it drifts the SQL wins and the button
 *                                                    throws. Safe by construction.
 *   3. `sense-tick.ts`                            — a domain match on the retired demo
 *                                                    domain. Not safe in any direction: it
 *                                                    was the only gate on a WRITE.
 *
 * (3) was not merely stale. Measured against production on 2026-08-11 it was INVERTED —
 * it and the SQL allowlist selected disjoint sets. The two retired logins matched (3) and
 * were absent from (1); `harbor@supaprod.ai`, the live demo account and the only one with
 * `auto_sense_enabled`, was in (1) and matched nothing in (3). Overlap: zero.
 *
 * Nothing had visibly broken, which is why it survived. Every candidate workspace sits
 * above the top-up threshold, so no top-up was due. The cost was latent and specific:
 * `admin_reset_demo_workspace` DELETEs a workspace's signals and is allowlisted to
 * exactly the accounts in (1), so a reset emptied the demo and (3) then refused to refill
 * it. Reset and refill disagreed about who is a demo account, making "reset the demo" a
 * one-way door.
 *
 * WHY THIS GUARD STRIPS COMMENTS WHEN ITS SIBLING DELIBERATELY DOES NOT.
 * `the-browser-suite-cannot-carry-a-password.test.ts` scans comments too, and explains at
 * length that stripping them is backwards — because its question is "is this credential
 * PRESENT", and a comment is present. The question HERE is the opposite one: "is this
 * domain USED as a predicate". A comment recording that the domain was retired is the
 * explanation that stops this recurring, and four files carry one on purpose. A guard
 * that failed on those would force deleting the institutional memory to go green. Same
 * repo, two guards, opposite comment policies, each correct for its own question.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

import { normalizeDemoEmails, isDemoAccountEmail } from "./sense-tick";

/**
 * Comments stripped. Duplicated from `the-browser-suite-cannot-carry-a-password.test.ts`
 * rather than imported, DELIBERATELY: importing a symbol from a `.test.ts` module
 * EXECUTES that module's suite here too. The first version of this file did import it and
 * ran 25 tests where 12 exist, silently re-running the sibling's 13 and reporting a count
 * that described nothing. Two lines of duplication cost less than a suite that misreports
 * its own size — in a repo that has already found five enforcement layers green while
 * measuring nothing.
 */
function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const SRC = join(import.meta.dir, "..", "..", "..", "..");

/**
 * The retired demo domain, matched as a domain rather than as either address, so this
 * guard does not reproduce the logins it exists to keep out of live code.
 */
const RETIRED_DOMAIN = /@redcadence\.app/;

/** Product source only: tests and generated router output are not predicates. */
function productSources(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "__tests__") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      productSources(full, out);
      continue;
    }
    if (!/\.tsx?$/.test(entry)) continue;
    if (/\.test\.tsx?$/.test(entry)) continue;
    if (entry === "routeTree.gen.ts") continue;
    out.push(full);
  }
  return out;
}

describe("normalizeDemoEmails", () => {
  it("lowercases and trims, because the allowlist is hand-typed in a migration", () => {
    const set = normalizeDemoEmails(["  Harbor@Supaprod.ai ", "voyage@supaprod.ai"]);
    expect(set.has("harbor@supaprod.ai")).toBe(true);
    expect(set.has("voyage@supaprod.ai")).toBe(true);
  });

  it("drops empty entries rather than admitting an empty-string member", () => {
    // An empty-string member would match an account whose email read as "" and is
    // pure downside; there is no case where the allowlist means to contain one.
    expect(normalizeDemoEmails(["", "   ", "harbor@supaprod.ai"]).size).toBe(1);
  });
});

describe("isDemoAccountEmail", () => {
  const allow = normalizeDemoEmails(["harbor@supaprod.ai", "voyage@supaprod.ai"]);

  it("matches an allowlisted account regardless of case", () => {
    expect(isDemoAccountEmail("HARBOR@supaprod.ai", allow)).toBe(true);
  });

  it("refuses a real staff account on the SAME domain", () => {
    // The whole reason the database uses an allowlist and not '%@supaprod.ai'.
    // A domain match here would authorise writing invented signals into the
    // founder's own workspace.
    expect(isDemoAccountEmail("founder@supaprod.ai", allow)).toBe(false);
  });

  it("refuses when the allowlist could not be read", () => {
    // null is "could not establish", never "no". Fails CLOSED: a real signup can
    // never receive the synthetic feed; at worst a demo account misses a top-up.
    expect(isDemoAccountEmail("harbor@supaprod.ai", null)).toBe(false);
  });

  it("refuses a missing email", () => {
    expect(isDemoAccountEmail(null, allow)).toBe(false);
    expect(isDemoAccountEmail(undefined, allow)).toBe(false);
    expect(isDemoAccountEmail("", allow)).toBe(false);
  });

  it("does not match a lookalike domain by suffix", () => {
    // `endsWith` was the old mechanism. An attacker-registered or typo'd
    // `notharbor@supaprod.ai` is a different account and must not match.
    expect(isDemoAccountEmail("notharbor@supaprod.ai", allow)).toBe(false);
    expect(isDemoAccountEmail("harbor@supaprod.ai.evil.test", allow)).toBe(false);
  });
});

describe("the retired demo domain is not a live predicate anywhere in src/", () => {
  const files = productSources(SRC);

  it("finds product sources at all, so a passing run means something", () => {
    // Five enforcement layers in this repo were found green while measuring
    // nothing. This one refuses to pass vacuously if the walker breaks.
    expect(existsSync(SRC), `no src/ at ${SRC}`).toBe(true);
    expect(files.length).toBeGreaterThan(100);
  });

  it("no product source matches the retired domain in CODE", () => {
    const offenders = files
      .filter((f) => RETIRED_DOMAIN.test(codeOf(readFileSync(f, "utf8"))))
      .map((f) => f.slice(SRC.length + 1));

    expect(
      offenders,
      "Those logins were retired and suspended on 2026-07-25, so a predicate keyed " +
        "on that domain does not select the live demo accounts — it selects dead ones. " +
        "Ask the database instead: supabaseAdmin.rpc('demo_account_emails'). Do NOT " +
        "swap the domain to the current one; migration 20260730000500 refused exactly " +
        "that, because every real staff account shares it and a domain match would " +
        "widen the gate to include the thing it protects.",
    ).toEqual([]);
  });
});

describe("sense-tick resolves the allowlist from the database", () => {
  const source = readFileSync(join(import.meta.dir, "sense-tick.ts"), "utf8");

  it("calls demo_account_emails() rather than keeping its own list", () => {
    // The NEGATIVE guard above is satisfiable by deleting the domain and leaving
    // the predicate broken — exactly how a sibling fix went wrong tonight, when
    // removing a retired email address would have passed its guard while leaving
    // every login unauthenticated. So assert the replacement MECHANISM positively.
    expect(codeOf(source)).toMatch(/\.rpc\(\s*["']demo_account_emails["']\s*\)/);
  });

  it("does not re-introduce a domain-suffix test on the owner email", () => {
    // `endsWith(SOME_DOMAIN)` is the shape of the defect, independent of which
    // domain is written. Catching the shape outlives catching the string, and
    // that is not theoretical: planting the defect back with the CURRENT domain
    // is caught by this line and would sail past every check keyed on the
    // retired one.
    expect(codeOf(source)).not.toMatch(/email[^\n]*\.endsWith\(/);
  });

  it("the owner check REACHES the allowlist rather than merely declaring it", () => {
    /**
     * FOUND BY PLANTING THE DEFECT, and the plant is the only reason this test
     * exists. Rewriting `isDemoWorkspaceOwner` to hardcode a domain again left
     * `demoAccountEmails()` defined but uncalled — so the positive assertion
     * above, which asks whether the FILE contains `.rpc("demo_account_emails")`,
     * still passed. Presence in the file is not reachability from the predicate.
     *
     * That is the same green-while-measuring-nothing shape this repo has now
     * found six times, reproduced inside the guard written to prevent it, within
     * an hour of writing it. Scoping the assertion to the function BODY is what
     * makes it measure the thing it claims to.
     */
    const body = codeOf(source).match(/async function isDemoWorkspaceOwner\([\s\S]*?\n\}/);
    expect(body, "isDemoWorkspaceOwner is gone or was renamed").not.toBeNull();
    expect(body![0]).toContain("demoAccountEmails()");
    expect(body![0]).toContain("isDemoAccountEmail(");
  });
});
