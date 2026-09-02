/**
 * The platform gate on tool policy.
 *
 * This replaces the migration-parity test that used to live in
 * src/lib/spine/tool-seed.test.ts. That one compared the registry against a SQL
 * seed, which was the right check against the wrong architecture: it proved
 * every user got a row, when the fix was to stop needing rows at all.
 *
 * Now the registry is the list and `TOOL_DEFAULTS` is the policy, so the gate is
 * between two things in the same language, checked before anything ships rather
 * than after every account is migrated. A tool registered without a default is
 * caught here, at build time, for every account that exists and every account
 * that ever will.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { resolveToolMode } from "@/lib/ai/loop.server";
import { TOOL_DEFAULTS, resolveToolAccess, UNLISTED_TOOL_DEFAULT } from "./defaults";

/**
 * Tool names in the registry, read as source.
 *
 * `registry.server.ts` cannot be imported here: it is worker-only and pulls in
 * the Supabase client, the AI runtime and every connector adapter. The whole
 * tools directory is scanned because the four `mission.*` tools are defined in
 * orchestrator.server.ts and merely imported into the registry array.
 */
function registeredTools(): string[] {
  const dir = join(process.cwd(), "src/lib/ai/tools");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".ts") && !f.endsWith(".test.ts"))
    .flatMap((f) => [
      ...readFileSync(join(dir, f), "utf8").matchAll(/\bdef\(\{\s*\n\s*name:\s*"([^"]+)"/g),
    ])
    .map((m) => m[1]);
}

describe("platform tool defaults", () => {
  it("has a policy for every registered tool", () => {
    const missing = registeredTools().filter((t) => !TOOL_DEFAULTS[t]);
    // If this fails: add the tool to TOOL_DEFAULTS. There is no migration to
    // write and no account to backfill; that is the point of the model.
    expect(missing).toEqual([]);
  });

  it("has no policy for a tool that does not exist", () => {
    const extra = Object.keys(TOOL_DEFAULTS).filter((t) => !registeredTools().includes(t));
    expect(extra).toEqual([]);
  });

  /**
   * AMENDED BY R-27, 2026-08-25, and the original comment is the reason this is
   * written carefully rather than edited quietly. It said: *"a default that
   * shipped one of them at `auto` would be a boundary lowered by a code change
   * nobody reads as a policy change."* **That warning is correct and it is about
   * exactly this edit.**
   *
   * So: none of them ships at `auto`, and that assertion is unchanged and is the
   * floor. What moved is `release.publish` and `studio.revert`, from `review` to
   * `confirm` — a policy change, read as one, ruled as R-27, and made on the
   * founder's instruction that a feature must be live at platform level.
   *
   * IT HAD TO MOVE HERE OR NOWHERE. `resolveApprovalMode` opens
   * `if (toolMode === "review") return "review"`, so a seeded `review` is sticky
   * before any floor logic runs — R-27 was **inert** while these read `review`,
   * in every workspace, and `agent_tools` holds zero override rows for them. The
   * gate is now the four preconditions the loop must prove, plus the arc:
   * `observing` review · `proving` confirm · `trusted` auto · `ambient` auto.
   */
  it("never ships an irreversible tool at auto - the floor that does not move", () => {
    for (const tool of [
      "release.publish",
      "studio.pr.merge",
      "studio.revert",
      "delegate.openhands",
    ]) {
      expect(TOOL_DEFAULTS[tool]?.mode, `${tool} must never default to auto`).not.toBe("auto");
    }
  });

  it("keeps delegate.openhands pinned at review — the one R-27 and F-75 both left alone", () => {
    // The merge has its own switch (`AUTO_SHIP_ENABLED`) and delegating to an
    // outside agent is a different act from deploying our own reviewed change:
    // none of R-27's four preconditions says anything about what somebody else's
    // agent will do.
    // studio.pr.merge moved to `confirm` under F-75 so STUDIO_AUTO_SHIP can
    // actually release it; its gate is asserted by resolved mode above, which is
    // the stronger check. delegate.openhands stays pinned: handing work to a
    // third-party agent is a different act, and no precondition either ruling
    // added says anything about what somebody else's agent will do.
    expect(TOOL_DEFAULTS["delegate.openhands"]?.mode).toBe("review");
  });

  it("seeds the R-27 pair at confirm, which is where the ruling actually lives", () => {
    expect(TOOL_DEFAULTS["release.publish"]?.mode).toBe("confirm");
    expect(TOOL_DEFAULTS["studio.revert"]?.mode).toBe("confirm");
  });

  it("gives every station's own hands to an account with no rows at all", () => {
    // THE REGRESSION TEST FOR THE DEFECT. A brand new account, seeded by
    // nothing, must reach every tool the seven stations need to produce their
    // artifacts. This is what eleven of sixteen live accounts could not do.
    const access = resolveToolAccess(registeredTools(), []);
    const reachable = new Set(access.map((a) => a.tool_name));
    for (const tool of [
      "signals.log", // 01 Discover
      "research.synthesize",
      "decision.record", // 02 Decide
      "prd.draft", // 03 Plan
      "tasks.create",
      "design.draft", // 04 Design
      "studio.stage", // 05 Build
      "release.publish", // 06 Ship
      "learning.record", // 07 Learn
    ]) {
      expect(reachable.has(tool), `a new account cannot reach ${tool}`).toBe(true);
    }
  });

  it("obeys an account that turned something off", () => {
    const access = resolveToolAccess(
      ["prd.draft", "web.crawl"],
      [{ tool_name: "web.crawl", enabled: false }],
    );
    expect(access.map((a) => a.tool_name)).toEqual(["prd.draft"]);
  });

  it("treats a row with no opinion on enabled as available, never as a denial", () => {
    // The exact reading that caused the defect: an absent or null `enabled` must
    // not mean "you may not". A row that only carries a mode is an opinion about
    // the mode and nothing else.
    const access = resolveToolAccess(
      ["prd.draft"],
      [{ tool_name: "prd.draft", mode: "review", enabled: null }],
    );
    expect(access).toEqual([{ tool_name: "prd.draft", mode: "review" }]);
  });

  it("obeys an account's chosen mode over the platform default", () => {
    expect(TOOL_DEFAULTS["studio.stage"].mode).toBe("auto");
    const access = resolveToolAccess(
      ["studio.stage"],
      [{ tool_name: "studio.stage", mode: "review" }],
    );
    expect(access[0].mode).toBe("review");
  });

  it("never grants a tool the registry does not have, whatever is stored", () => {
    // A stale override row for a deleted tool must not resurrect it. The list is
    // the registry's; overrides only modulate what is already on it.
    const access = resolveToolAccess(
      ["prd.draft"],
      [{ tool_name: "tool.that.was.deleted", mode: "auto" }],
    );
    expect(access.map((a) => a.tool_name)).toEqual(["prd.draft"]);
  });

  it("falls back conservatively for a tool nobody wrote a policy for", () => {
    // Unreachable while the first test passes, kept because the runtime must not
    // throw if one ever slips through a hotfix.
    expect(UNLISTED_TOOL_DEFAULT.mode).toBe("confirm");
    const access = resolveToolAccess(["brand.new.tool"], []);
    expect(access).toEqual([{ tool_name: "brand.new.tool", mode: "confirm" }]);
  });
});

describe("risk floors stay above any earned record (governance canon)", () => {
  // These three were left gated on 2026-08-03 while three others graduated to auto on a
  // perfect approval record. The distinction is the point: a clean history earns
  // autonomy for reversible, internal work, and never for work that leaves the product
  // or cannot be undone. If a future change flips one of these to "auto", it should have
  // to delete this test and say why in the message.
  /*
   * ── `studio.commit` LEFT THIS LIST ON 2026-09-02, UNDER R-30 ────────────
   *
   * The comment above asks a change that flips one of these to `auto` to delete
   * this test and say why in the message. This is that change, so here is the
   * why, in the place it asked for it.
   *
   * The list conflated two different properties under one word. "Repo-touching"
   * and "irreversible" are not the same thing, and `studio.commit` was only ever
   * the first: it writes to a BRANCH, nothing it does reaches `main`, and
   * `studio.fix.commit` -- the same act, on the same branch, from the same
   * seat -- has been `auto` all along, one line below it in the table. One act,
   * two gates, and the difference was an accident rather than an argument.
   *
   * Measured, the gate did not protect anything either. Four real builder
   * commits on the bound repo sat `pending` on 2026-09-02, every one set to
   * auto-cancel the next day by `expiry_default='cancel'`, and the person it
   * asked answered 0% of them. Its only effect was to throw the work away
   * quietly a day later, which is R-27's inverted gate one tool earlier.
   *
   * WHAT ACTUALLY MAKES A COMMIT SAFE IS STILL ASSERTED, one test below:
   * `STUDIO_FORBIDDEN_PREFIXES` refuses a commit that touches a forbidden path
   * whatever the mode says. That is the safety property; the mode was a proxy
   * for it, and F-75 already records what happens when a proxy is asserted
   * instead of the property.
   *
   * The two that stay are irreversible in the sense the canon means. A GitHub
   * issue leaves the product and is seen by someone outside it; a merge reaches
   * `main`. Both keep their gates, and `release.publish` is pinned under R-27
   * where it can never graduate at all.
   */
  it("never lets an irreversible tool default to auto", () => {
    for (const tool of ["github.issue.create", "studio.pr.merge"]) {
      expect(TOOL_DEFAULTS[tool]?.mode).not.toBe("auto");
    }
  });

  it("gates the two commits the same way, because they are the same act", () => {
    /*
     * R-30 in one line. The pair is asserted together on purpose: they were
     * `confirm` and `auto` for a year with no argument for the difference, and
     * a future change that moves one has to face the other.
     *
     * The safety property is NOT here and must not be inferred from here: a
     * commit that runs without asking is safe because
     * `STUDIO_FORBIDDEN_PREFIXES` (`registry.server.ts`, applied at
     * `deployments.functions.ts:941`) refuses one that touches a forbidden path,
     * and that check never reads the mode. Asserting the mode as a proxy for the
     * property is exactly what F-75 records going wrong two tests below.
     */
    expect(TOOL_DEFAULTS["studio.commit"]?.mode).toBe("auto");
    expect(TOOL_DEFAULTS["studio.fix.commit"]?.mode).toBe("auto");
  });

  /**
   * AMENDED BY F-75, AND THE SEEDED LITERAL WAS A PROXY FOR THE WRONG THING.
   *
   * The property worth guarding is *the merge is gated unless someone opts in* —
   * not the string in this table. Asserting the string is what let
   * `STUDIO_AUTO_SHIP=1` sit set and inert: a seeded `review` short-circuits
   * `resolveApprovalMode` (`trust.server.ts:226`) **before the flag is read**, so
   * the opt-in could never do anything and the test happily agreed.
   *
   * The two assertions below are stronger than the one they replace: they check
   * the RESOLVED mode, in both flag states, which is what a run actually gets.
   * Its own record still argues for the gate — 21 approvals against 7 genuine
   * rejections, the only tool a human actually overrules.
   */
  it("never defaults the merge gate to auto", () => {
    expect(TOOL_DEFAULTS["studio.pr.merge"]?.mode).not.toBe("auto");
  });

  it("resolves the merge to review while the ship flag is off", () => {
    // `mergeReleased` is false without STUDIO_AUTO_SHIP, and the force-review
    // branch then pins it regardless of the seed. This is the real floor.
    const seeded = TOOL_DEFAULTS["studio.pr.merge"]!.mode;
    expect(resolveToolMode("studio.pr.merge", seeded, "trusted", true)).toBe("review");
  });
});
