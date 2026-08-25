/**
 * F-49 — WE RENAMED THE PRODUCT AND SILENTLY STOPPED RECOGNISING THE ONLY REPO
 * THAT HAD EVER SHIPPED THROUGH US.
 *
 * `isSupaprodManaged` is the gate on the whole hosted-preview path:
 * `ci-poll-tick` builds a Deno preview only for a repo it recognises, and
 * `release.publish` refuses to promote without a successful preview at that
 * exact commit (`deployments.functions.ts` — *"Only a merged changeset can
 * promote"*, then a `provider='deno'` preview row). So this one GET decides
 * whether the seventh station is reachable at all.
 *
 * THE MEASUREMENT. `RohitGajaraj/Test-Project-Cadence` is the only repo that
 * has ever completed the chain — thirteen `provider='deno'` previews and one
 * production promote, 2026-07-08 to 2026-07-10. Its root today:
 * `.editorconfig · CHANGELOG.md · cadence.json · health.json · index.html ·
 * main.ts · package.json · tests`. It is unmistakably the template family, and
 * `GET /contents/supaprod.json` returns 404, because `c5d479fd6` renamed the
 * marker in our code seven weeks ago.
 *
 * WHAT THE PRODUCT SAID INSTEAD. Not "this repo is no longer recognised" —
 * *"No successful preview deploy exists for this changeset yet... try again
 * shortly."* A sentence about a missing artifact, for a repo whose artifact we
 * had stopped looking for. Same family as the scout returning `ok: true` while
 * dormant: the failure reports as a state of the world rather than as ours.
 *
 * WHAT THIS TEST IS NOT. Fixing the marker does **not** put the acceptance run
 * on the board: harbor's workspace is bound to `relay-homeowner-app`, which
 * carries neither marker and is a Bun/React app rather than a `Deno.serve`
 * program, so it could never have been hosted under either name. This closes a
 * live regression for repos already marked; the proof run needs a repo
 * scaffolded by `renderStarterTemplate`, which emits the current name.
 */
import { describe, test, expect, afterEach } from "bun:test";

import { isSupaprodManaged } from "@/lib/hosting/changeset-deploy.server";

const realFetch = globalThis.fetch;
afterEach(() => {
  globalThis.fetch = realFetch;
});

/** Records every path asked for and answers 200 for the named markers only. */
function githubWith(present: string[]): { asked: string[] } {
  const asked: string[] = [];
  globalThis.fetch = (async (url: string | URL | Request) => {
    const href = String(url);
    asked.push(href);
    const hit = present.some((marker) => href.includes(`/contents/${marker}?`));
    return new Response(hit ? "{}" : '{"message":"Not Found"}', { status: hit ? 200 : 404 });
  }) as typeof fetch;
  return { asked };
}

const REPO = { token: "t", repo: "RohitGajaraj/Test-Project-Cadence", ref: "abc123" };

describe("which repos Supaprod hosts", () => {
  test("a repo marked with the current name is recognised", async () => {
    githubWith(["supaprod.json"]);
    expect(await isSupaprodManaged(REPO)).toBe(true);
  });

  /**
   * THE REGRESSION ITSELF. Before the fix this returned false, the tick built
   * no preview, and Ship refused forever.
   */
  test("a repo marked before we renamed ourselves is still ours", async () => {
    githubWith(["cadence.json"]);
    expect(await isSupaprodManaged(REPO)).toBe(true);
  });

  test("a repo carrying neither marker is not ours", async () => {
    const { asked } = githubWith([]);
    expect(await isSupaprodManaged(REPO)).toBe(false);
    // Both were tried before answering no, so the answer is about the repo
    // rather than about which name we happened to check.
    expect(asked.length).toBe(2);
  });

  /**
   * THE COMMON PATH STAYS ONE REQUEST. Every repo scaffolded from
   * `renderStarterTemplate` carries the current name, so the legacy lookup must
   * cost nothing on the path almost every repo takes.
   */
  test("the current name is asked first and short-circuits", async () => {
    const { asked } = githubWith(["supaprod.json", "cadence.json"]);
    expect(await isSupaprodManaged(REPO)).toBe(true);
    expect(asked.length).toBe(1);
    expect(asked[0]).toContain("/contents/supaprod.json?");
  });

  test("asks at the commit it was given, encoded", async () => {
    const { asked } = githubWith([]);
    await isSupaprodManaged({ ...REPO, ref: "feature/a b" });
    for (const href of asked) {
      expect(href).toContain("ref=feature%2Fa%20b");
      expect(href).toContain("/repos/RohitGajaraj/Test-Project-Cadence/contents/");
    }
  });
});
