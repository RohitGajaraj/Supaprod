import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * PRESS "BUILD THIS", WAIT OUT A FULL AGENT RUN, AND LAND WHERE YOU STARTED.
 *
 * Two defects in one call, found by a 40-agent station audit on 2026-08-06 and
 * confirmed by reading both sides of each.
 *
 * 1. THE RETURN FIELD WAS NEVER READ. `dispatchBuilderMission` returns
 *    `{ ...result, mission_id, issue_number, issue_url }`. `ReadyToBuild` read
 *    `r.missionId`, which is `undefined` on every dispatch, so the navigate to
 *    the run never fired. The dispatch holds the request open for the whole
 *    inline agent loop, so the visible behaviour was: press the button, wait out
 *    a real builder run, get no toast, no route change, and a row still reading
 *    "Approved. Build opens the issue as it starts." The natural response is to
 *    press again -- which starts a SECOND builder mission against the same
 *    reused `github_issue_url`. Two agents on one issue, and the founder pays
 *    for both.
 *
 *    `as { missionId?: string }` is why it typechecked. A cast asserts a shape
 *    rather than verifying it, so naming a field the server never sends silenced
 *    the one tool that catches this instantly. Removing the cast made tsc fail
 *    on the wrong name, which is the real fix; the field name is the symptom.
 *
 * 2. THE PANEL AND THE DISPATCH RESOLVED DIFFERENT REPOSITORIES. The panel calls
 *    `canDispatchToRepo` WITH the active product and prints "Where the next build
 *    lands: owner/repo" off a product-scoped binding. The dispatch called
 *    `resolveGitHub` WITHOUT `productId`, which that function documents as the
 *    "most specific, wins over workspace" override -- so it skipped the product
 *    branch and fell through to the workspace binding, filtered
 *    `.is("product_id", null)`.
 *
 *    With no workspace binding it throws NOT_CONNECTED_ERROR and prints "GitHub
 *    is not connected" directly under a panel naming the repository. WITH one it
 *    SUCCEEDS and opens the issue, and later the PR, in the wrong repository --
 *    a customer's, silently. That second outcome is why this ranks where it does.
 */

const ROOT = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/**
 * COMMENTS STRIPPED BEFORE ASSERTING, and this file is the third time in one
 * session that omitting this produced a red test against correct code. A test
 * that documents the bad pattern in prose and then greps for the bad pattern
 * finds its own prose. `derive-tick.test.ts` learned it the same way, and so did
 * a `github_issue_url` grep on 2026-08-05. Code only, every time.
 */
const stripComments = (src: string) =>
  src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n");

const PANEL = stripComments(read(join("components", "build", "ReadyToBuild.tsx")));
const SERVER = read(join("lib", "build.functions.ts"));

describe("the dispatch's answer is actually read", () => {
  it("reads the field the server sends", () => {
    expect(PANEL).toMatch(/const missionId = r\?\.mission_id;/);
  });

  it("does not read the field it never sent", () => {
    expect(PANEL).not.toMatch(/\?\.missionId\b/);
  });

  it("no cast stands between the response and the typechecker", () => {
    // The cast is the actual defect. With it gone, renaming the field
    // server-side turns this line red instead of turning the button into a
    // no-op. Verified by re-adding `missionId` and watching tsc fail.
    expect(PANEL).not.toMatch(/as \{ missionId\?: string \}/);
  });

  it("the server still returns that exact key", () => {
    // If the server ever renames it, this test says so even though tsc would
    // too -- the point is that BOTH sides are pinned to one name.
    //
    // ASSERTS THE KEY, NOT THE LINE. This was
    // `/return \{ \.\.\.result, mission_id: missionId/` and it went red on
    // 2026-08-06 when the dispatch grew a SECOND return site so that a failure
    // after the agent started reports differently from one before it -- the
    // shape changed, the contract did not. That is the third formatting-brittle
    // grep test this repo has paid for (see `derive-tick.test.ts`, which pinned
    // a single-line ternary that `eslint --fix` then wrapped). Whitespace is
    // collapsed and every return site is required to carry the key, which is
    // strictly stronger than pinning one of them.
    // SCOPED TO THE DISPATCH, and that scoping is not incidental. A first
    // version of this swept the whole file and went red on `listBuilderRuns`,
    // which returns `mission_id: r.mission_id` and is entirely correct to do so
    // -- the read maps a row, the dispatch reports the mission it just made.
    // Two different contracts, one column name. `the-gate-records-why` slices to
    // `recordJudgment` for the same reason.
    const dispatch = SERVER.slice(SERVER.indexOf("export const dispatchBuilderMission")).replace(
      /\s+/g,
      " ",
    );
    const returns = dispatch.match(/return \{[^}]*mission_id:[^}]*\}/g) ?? [];
    expect(returns.length).toBeGreaterThan(0);
    for (const r of returns) expect(r).toMatch(/mission_id: missionId/);
  });

  it("still only navigates when there is somewhere to go", () => {
    // A dispatch that produced no mission (no workspace, or no builder agent)
    // must not navigate to /runs/undefined.
    //
    // The guard was `if (missionId)` and is now `if (missionId && r?.run_started)`,
    // which is STRICTER: a mission can exist while the agent loop never entered,
    // and /runs/<id> for a mission with no run is an empty page. So this asserts
    // the invariant -- every navigate to the run page is gated on missionId --
    // rather than one spelling of it, and a future tightening will not go red.
    const navs =
      PANEL.replace(/\s+/g, " ").match(
        /if \([^)]*\) \{? ?void navigate\(\{ to: "\/runs\/\$missionId"/g,
      ) ?? [];
    expect(navs.length).toBeGreaterThan(0);
    for (const n of navs) expect(n).toMatch(/missionId/);
  });
});

describe("the panel and the dispatch resolve the same repository", () => {
  it("the dispatch passes a product to the GitHub resolve", () => {
    expect(SERVER).toMatch(/productId: prd\?\.product_id \?\? null,/);
  });

  it("and actually selects the column it passes", () => {
    // Passing `prd.product_id` without selecting it yields undefined -> null,
    // which is silently the OLD behaviour: workspace-scoped, wrong repo, no
    // error. This is the half that would have made the fix cosmetic.
    expect(SERVER).toMatch(
      /\.select\("id,title,body_md,github_issue_url,workspace_id,product_id,contract"\)/,
    );
  });

  it("the type carries it, so the read cannot drift back to undefined", () => {
    const ctx = SERVER.slice(SERVER.indexOf("type PrdCtx = {"), SERVER.indexOf("let prd: PrdCtx"));
    expect(ctx).toMatch(/product_id: string \| null;/);
  });

  it("the panel is still the product-scoped side of the pair", () => {
    // If the PANEL ever drops productId the two diverge again, in the other
    // direction: a panel promising the workspace repo while the build uses the
    // product's.
    expect(read(join("routes", "_authenticated.build.index.tsx"))).toMatch(
      /fCanDispatch\(\{ data: \{ productId: activeProductId \?\? undefined \} \}\)/,
    );
  });
});
