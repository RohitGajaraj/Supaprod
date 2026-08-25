/**
 * A 404 ON THE REPO ROOT OF A BOUND REPO IS A LOCKED DOOR, NOT A MISSING REPO.
 *
 * GitHub answers 404 — not 401, not 403 — for a private repository an App
 * installation cannot see, deliberately, so private repos do not leak their
 * existence. That choice defeats every credential-shaped refusal sign in
 * `REFUSAL_SIGNS`: the run that hit it read as "repo not found", burned its
 * attempts and was corrected backwards, when nothing about the WORK was wrong.
 *
 * Only the call site can know the 404 landed on the repository ROOT while a
 * workspace binding names that exact repo — a person typed this repo in, so
 * "not found" can only mean "not visible to this credential". So the tool
 * layer stamps ONE pinned sentence (`REPO_ROOT_ACCESS_REFUSED`, exported from
 * spine/driver.ts, spelled once) and the driver's classifier matches the
 * stamp. This file pins both halves of the narrowness:
 *
 *   · WHERE THE STAMP FIRES — the repo-root fetches that serve a run's own
 *     work: `getDefaultBranch` (threaded with `source` by repo.tree,
 *     studio.commit, studio.pr.open, studio.sync_branch) and github.pr.open's
 *     inline root lookup.
 *
 *   · WHERE IT DELIBERATELY DOES NOT — `changesetRef` and the pr.merge
 *     ship-stamp call `getDefaultBranch` WITHOUT `source`, on purpose. Both
 *     run after the root was already fetched successfully this run (checks
 *     read from a branch that exists; the merge has already landed), so a 404
 *     there is a transient or a deleted repo, not a binding refusal — and the
 *     ship-stamp is best-effort bookkeeping that must never dress itself as a
 *     refused station. A casually threaded `source` here fails this file.
 *
 * The behavioural block drives the REAL `getDefaultBranch` through repo.tree
 * with a mocked global fetch, because the source scan proves shape, not
 * behaviour, and the first version of F-41 shipped shape-correct and inert.
 */
import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { REPO_ROOT_ACCESS_REFUSED } from "@/lib/spine/driver";
import * as githubProvider from "@/lib/connectors/providers/github.server";

// Captured BEFORE mock.module patches the namespace, so the delegate-by-default
// mock below cannot recurse into itself.
const realResolveGitHub = githubProvider.resolveGitHub;

/**
 * When null, the mock delegates to the real resolver — so other test files in
 * the same bun process see unchanged behaviour. Set only inside this file's
 * behavioural tests, and only for the duration of one call.
 */
let fakeSource: "binding" | "user_connection" | "env" | null = null;

mock.module("@/lib/connectors/providers/github.server", () => ({
  ...githubProvider,
  resolveGitHub: (args: Parameters<typeof realResolveGitHub>[0]) =>
    fakeSource
      ? Promise.resolve({
          token: "test-token",
          repo: "o/r",
          source: fakeSource,
          actorLabel: "test",
        })
      : realResolveGitHub(args),
}));

// Imported AFTER the mock so requireGithub resolves through it.
const { TOOL_REGISTRY } = await import("@/lib/ai/tools/registry.server");

const REGISTRY_SOURCE = readFileSync(join(import.meta.dir, "registry.server.ts"), "utf8");

/** The full source of one tool def: from its `name:` to the next top-level const. */
function toolSource(name: string): string {
  const at = REGISTRY_SOURCE.indexOf(`name: "${name}"`);
  expect(at, `${name} has left the registry`).toBeGreaterThan(-1);
  const end = REGISTRY_SOURCE.indexOf("\nconst ", at);
  return REGISTRY_SOURCE.slice(at, end);
}

/** The body of a top-level function declaration, sliced to its closing brace. */
function fnSource(header: string): string {
  const at = REGISTRY_SOURCE.indexOf(header);
  expect(at, `${header} has left the registry`).toBeGreaterThan(-1);
  const end = REGISTRY_SOURCE.indexOf("\n}", at);
  return REGISTRY_SOURCE.slice(at, end + 2);
}

describe("the stamp fires exactly where the root is fetched for a run's own work", () => {
  it("repo.tree threads the credential's source into getDefaultBranch", () => {
    // The stamp can only be honest if the call site says WHOSE credential hit
    // the door. A repo.tree that drops `source` silently downgrades every
    // binding refusal back to "repo not found".
    const src = toolSource("repo.tree");
    expect(src).toContain("const { token, repo, source } = await requireGithub(ctx);");
    expect(src).toContain("getDefaultBranch(repo, headers, source)");
  });

  it("getDefaultBranch consults repoRootRefusal on 404 BEFORE the generic throw", () => {
    // Order is the invariant: if the generic `!res.ok` throw ran first, the
    // 404 would never reach the refusal translation and the stamp would be
    // dead code — precisely how the first version of F-41 shipped inert.
    const src = fnSource("async function getDefaultBranch(");
    const at404 = src.indexOf("res.status === 404");
    const atRefusal = src.indexOf("repoRootRefusal(repo, source)");
    const atGeneric = src.indexOf("GitHub ${res.status} on /repos/");
    expect(at404).toBeGreaterThan(-1);
    expect(atRefusal).toBeGreaterThan(at404);
    expect(atGeneric).toBeGreaterThan(atRefusal);
  });

  it("github.pr.open's inline root lookup carries the same 404 branch", () => {
    // The Builder path fetches the root itself rather than through
    // getDefaultBranch, so it needs its own copy of the branch — and losing it
    // would put the ONE write tool most likely to hit a fresh binding back on
    // the produced-nothing treadmill.
    const src = toolSource("github.pr.open");
    const at404 = src.indexOf("repoRes.status === 404");
    const atRefusal = src.indexOf("repoRootRefusal(repo, source)");
    expect(at404).toBeGreaterThan(-1);
    expect(atRefusal).toBeGreaterThan(at404);
  });
});

describe("and deliberately does NOT fire where a 404 is not a binding verdict", () => {
  // These two omissions are design, not oversight — see the file header. A
  // casually threaded `source` turns a best-effort read into a false "your
  // connection is broken" verdict, so this block fails the thread-it-everywhere
  // refactor before it ships.

  it("changesetRef calls getDefaultBranch without a source", () => {
    const src = fnSource("async function changesetRef(");
    expect(src).toContain("changeset.branch ?? (await getDefaultBranch(repo, headers))");
    expect(src).not.toContain("getDefaultBranch(repo, headers,");
  });

  it("the pr.merge ship-stamp calls getDefaultBranch without a source", () => {
    const at = REGISTRY_SOURCE.indexOf("await stampSpecShippedOnStudioMerge(supabase, {");
    expect(at).toBeGreaterThan(-1);
    const callSite = REGISTRY_SOURCE.slice(at, REGISTRY_SOURCE.indexOf("});", at));
    expect(callSite).toContain("defaultBranch: await getDefaultBranch(repo, headers)");
    expect(callSite).not.toContain("getDefaultBranch(repo, headers,");
  });
});

// ── behaviour, through the real getDefaultBranch ───────────────────────────

const originalFetch = globalThis.fetch;
let fetchQueue: Response[] = [];
let fetchedUrls: string[] = [];

beforeEach(() => {
  fakeSource = null;
  fetchQueue = [];
  fetchedUrls = [];
  globalThis.fetch = (async (url: string | URL | Request) => {
    fetchedUrls.push(String(url));
    const next = fetchQueue.shift();
    if (!next) throw new Error(`unexpected fetch call to ${String(url)}`);
    return next;
  }) as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
  fakeSource = null;
});

const ctx = { supabase: {} as never, userId: "u1", workspaceId: "w1", missionId: null } as never;

const runTree = () => TOOL_REGISTRY["repo.tree"]!.run({}, ctx);

describe("what the door actually says (mocked global fetch)", () => {
  it("root 404 on a BOUND repo throws the pinned refusal sentence", async () => {
    fakeSource = "binding";
    fetchQueue.push(new Response("Not Found", { status: 404 }));
    // Matched against the imported constant, never a retyped sentence: this is
    // the same regex REFUSAL_SIGNS holds, so passing here proves the thrown
    // error will be classified `tools-refused` by the driver.
    await expect(runTree()).rejects.toThrow(new RegExp(REPO_ROOT_ACCESS_REFUSED, "i"));
  });

  it("root 404 on an ENV repo stays an ordinary GitHub 404", async () => {
    // No binding means nobody named this repo on Connectors, so "not found"
    // proves nothing about access — the honest report is the plain 404.
    fakeSource = "env";
    fetchQueue.push(new Response("Not Found", { status: 404 }));
    let message = "";
    try {
      await runTree();
      throw new Error("repo.tree did not throw on a 404");
    } catch (e) {
      message = e instanceof Error ? e.message : String(e);
    }
    expect(message).toContain("GitHub 404 on /repos/o/r");
    expect(message.toLowerCase()).not.toContain(REPO_ROOT_ACCESS_REFUSED.toLowerCase());
  });

  it("a 200 answers the default branch and the run proceeds on it", async () => {
    fakeSource = "binding";
    fetchQueue.push(
      new Response(JSON.stringify({ default_branch: "trunk" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    fetchQueue.push(
      new Response(JSON.stringify({ tree: [], truncated: false }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const out = (await runTree()) as { ref: string };
    expect(out.ref).toBe("trunk");
    // The tree read proves getDefaultBranch RETURNED rather than merely not
    // throwing: the second fetch is keyed on the branch it answered.
    expect(fetchedUrls[1]).toContain("/git/trees/trunk");
  });
});
