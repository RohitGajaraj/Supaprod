/**
 * F-66. THE TOOL SAID A PULL REQUEST WAS OPEN. IT WAS OPEN SOMEWHERE ELSE.
 *
 * Measured 2026-08-25 at 15:01:22, on the first build after the workspace was
 * re-bound. `studio.pr.open` answered `ok: true` with:
 *
 * ```json
 * {"cached": true, "changeset_id": "f9354439-…", "pr_number": 5,
 *  "pr_url": "https://github.com/RohitGajaraj/relay-homeowner-app/pull/5"}
 * ```
 *
 * The workspace was bound to `Supaprod/relay-homeowner-app`, which had **zero
 * pull requests and one branch** — `gh pr list --state all` empty,
 * `gh api …/branches` a single entry. The cached PR was on the OLD repository.
 *
 * The cache keyed on the CHANGESET and never asked the one question that would
 * have caught it: is this pull request even on the repo the binding resolves
 * to? A downstream session read `ok: true` and reported *"a PR is open on
 * Supaprod/relay-homeowner-app"*, and none of it was true — the platform half
 * of F-68, where an agent repeated a tool's stale answer rather than inventing
 * one.
 *
 * WHAT THIS FILE PINS, and the second is the reason the guard is not only at
 * `pr.open`:
 *
 *   · **`pr.open` resolves the binding BEFORE it trusts the cache.** The old
 *     order asked who we were talking to strictly after the wrong answer had
 *     been handed back, which is why no amount of care inside the cached branch
 *     could have caught this.
 *
 *   · **`pr.merge` refuses the same mismatch**, where it is worse. That tool
 *     takes a NUMBER off the changeset and merges
 *     `/repos/{bound repo}/pulls/{number}`. Today #5 does not exist on the new
 *     repo and GitHub answers 404 — luck. The day that repo has five pull
 *     requests, an integer would merge a stranger's work, unattended.
 *
 *   · **It refuses rather than re-opening**, and the refusal NAMES BOTH
 *     REPOSITORIES and what to say instead. F-24: a prohibition whose
 *     alternative the agent cannot see gets the same behaviour under a new name.
 */
import { afterAll, beforeEach, describe, expect, it, mock } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import * as githubProvider from "@/lib/connectors/providers/github.server";

// Captured BEFORE mock.module patches the namespace, so the delegate-by-default
// mock below cannot recurse into itself.
const realResolveGitHub = githubProvider.resolveGitHub;

/** The repo the BINDING resolves to. Null delegates to the real resolver, so
 *  other files sharing this bun process see unchanged behaviour. */
let boundRepo: string | null = null;

mock.module("@/lib/connectors/providers/github.server", () => ({
  ...githubProvider,
  resolveGitHub: (args: Parameters<typeof realResolveGitHub>[0]) =>
    boundRepo
      ? Promise.resolve({
          token: "test-token",
          repo: boundRepo,
          source: "binding" as const,
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
  return REGISTRY_SOURCE.slice(at, REGISTRY_SOURCE.indexOf("\nconst ", at));
}

/** The exact two repositories from the measurement. */
const OLD_REPO = "RohitGajaraj/relay-homeowner-app";
const NEW_REPO = "Supaprod/relay-homeowner-app";
const CACHED_PR_URL = `https://github.com/${OLD_REPO}/pull/5`;

// ── the order that made the defect possible ────────────────────────────────

describe("the binding is resolved before the cache is believed", () => {
  it("pr.open calls requireGithub above its cached return, not below it", () => {
    const src = toolSource("studio.pr.open");
    const resolveAt = src.indexOf("await requireGithub(ctx)");
    const cacheAt = src.indexOf("changeset.pr_number && changeset.pr_url");
    expect(resolveAt).toBeGreaterThan(-1);
    expect(cacheAt).toBeGreaterThan(-1);
    // The whole finding in one inequality. Reversed, the tool cannot know which
    // repository it is answering about until after it has answered.
    expect(cacheAt).toBeGreaterThan(resolveAt);
  });

  it("the cached answer names its repo, like the fresh one always did", () => {
    // The asymmetry that let "a PR is open on Supaprod/relay-homeowner-app" get
    // written down: the fresh branch returned `repo` and the cached branch did
    // not, so the one answer a reader could not check was the one they had no
    // reason to doubt.
    const src = toolSource("studio.pr.open");
    const cached = src.slice(src.indexOf("changeset.pr_number && changeset.pr_url"));
    expect(cached.slice(0, cached.indexOf("cached: true"))).toContain("repo,");
  });

  it("pr.merge asks the same question before it acts on a stored number", () => {
    const src = toolSource("studio.pr.merge");
    const guardAt = src.indexOf("stalePrPointerRefusal(changeset, repo)");
    const fetchAt = src.indexOf("api.github.com/repos/${repo}/pulls/");
    expect(guardAt).toBeGreaterThan(-1);
    expect(fetchAt).toBeGreaterThan(guardAt);
  });
});

// ── behaviour ──────────────────────────────────────────────────────────────

const originalFetch = globalThis.fetch;
let fetchedUrls: string[] = [];

/**
 * A changeset carrying a cached pointer at `prUrl`.
 *
 * ROUTED BY TABLE, and `idempotency_keys` in particular must answer EMPTY: a
 * client that hands the same row to every table makes `withIdempotency` report
 * a replay, and the tool returns without ever reaching GitHub — which would
 * make the "opens nothing" assertions below pass for the wrong reason.
 */
function fakeSupabase(prUrl: string | null) {
  const row = {
    id: "f9354439-1111-4111-8111-111111111111",
    mission_id: "m1",
    repo: OLD_REPO,
    branch: "studio/m1-f9354439",
    base_sha: "abc",
    status: "pr_open",
    title: "checkout address step",
    pr_url: prUrl,
    pr_number: prUrl ? 5 : null,
    product_id: null,
  };
  const make = (table: string) => {
    const b: Record<string, unknown> = {};
    for (const m of ["select", "eq", "neq", "in", "is", "order", "limit", "update", "insert"]) {
      b[m] = () => b;
    }
    const payload = table === "studio_changesets" ? row : null;
    b.maybeSingle = async () => ({ data: payload, error: null });
    b.single = async () => ({ data: payload, error: null });
    b.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: payload ? [payload] : [], error: null, count: 0 }).then(resolve);
    return b;
  };
  return { from: (table: string) => make(table) } as never;
}

const ctxWith = (prUrl: string | null) =>
  ({
    supabase: fakeSupabase(prUrl),
    userId: "u1",
    workspaceId: "w1",
    missionId: "11111111-1111-4111-8111-111111111111",
    runId: null,
  }) as never;

const openPr = (prUrl: string | null) =>
  TOOL_REGISTRY["studio.pr.open"]!.run(
    { title: "Checkout address step", body: "The work order's change." },
    ctxWith(prUrl),
  );

const mergePr = (prUrl: string | null) => TOOL_REGISTRY["studio.pr.merge"]!.run({}, ctxWith(prUrl));

beforeEach(() => {
  boundRepo = null;
  fetchedUrls = [];
  globalThis.fetch = (async (url: string | URL | Request) => {
    fetchedUrls.push(String(url));
    throw new Error(`unexpected fetch call to ${String(url)}`);
  }) as typeof fetch;
});

afterAll(() => {
  globalThis.fetch = originalFetch;
  boundRepo = null;
});

describe("a cached pointer on another repository is refused, not returned", () => {
  it("refuses the exact answer measured at 15:01:22", async () => {
    boundRepo = NEW_REPO;
    await expect(openPr(CACHED_PR_URL)).rejects.toThrow(/Refused/i);
  });

  it("names BOTH repositories, because naming one explains nothing", async () => {
    boundRepo = NEW_REPO;
    let message = "";
    try {
      await openPr(CACHED_PR_URL);
      throw new Error("studio.pr.open returned a pull request on the wrong repo");
    } catch (e) {
      message = e instanceof Error ? e.message : String(e);
    }
    expect(message).toContain(OLD_REPO);
    expect(message).toContain(NEW_REPO);
    expect(message).toContain("#5");
  });

  it("gives the agent somewhere to go, which is the half F-24 says gets dropped", async () => {
    boundRepo = NEW_REPO;
    let message = "";
    try {
      await openPr(CACHED_PR_URL);
    } catch (e) {
      message = e instanceof Error ? e.message : String(e);
    }
    // Two things a station can act on: say this, and do not do that.
    expect(message).toMatch(/say exactly that/i);
    expect(message).toMatch(/a person has to settle which repository/i);
    expect(message).toMatch(/do not open, commit or report a pull request/i);
  });

  it("opens nothing on the new repository while refusing", async () => {
    // The refusal must not be a re-open wearing a warning. If any GitHub call
    // leaves this tool on the mismatch path, a customer's repo has a branch or
    // a pull request on it that nobody ordered.
    boundRepo = NEW_REPO;
    await expect(openPr(CACHED_PR_URL)).rejects.toThrow();
    expect(fetchedUrls).toEqual([]);
  });

  it("refuses at the merge gate too, where being wrong is irreversible", async () => {
    boundRepo = NEW_REPO;
    await expect(mergePr(CACHED_PR_URL)).rejects.toThrow(/Refused/i);
    expect(fetchedUrls).toEqual([]);
  });
});

describe("and stays out of the way when the pointer is honest", () => {
  it("returns the cached pull request when it is on the bound repo", async () => {
    boundRepo = OLD_REPO;
    const out = (await openPr(CACHED_PR_URL)) as Record<string, unknown>;
    expect(out.cached).toBe(true);
    expect(out.pr_number).toBe(5);
    expect(out.pr_url).toBe(CACHED_PR_URL);
    // And it says which repository that is, so the next reader does not guess.
    expect(out.repo).toBe(OLD_REPO);
    expect(fetchedUrls).toEqual([]);
  });

  it("does not refuse over capitalisation, which GitHub does not care about", async () => {
    // A false alarm on the one path whose whole purpose is to stop false
    // answers would be worse than the bug: the crew would learn to route
    // around it.
    boundRepo = "rohitgajaraj/Relay-Homeowner-App";
    const out = (await openPr(CACHED_PR_URL)) as Record<string, unknown>;
    expect(out.cached).toBe(true);
  });

  it("lets a changeset with no pull request through to open one", async () => {
    // No pointer, nothing to be stale about. It must reach GitHub — proven by
    // the fetch that the harness refuses, not by a silent pass.
    boundRepo = NEW_REPO;
    await expect(openPr(null)).rejects.toThrow(/unexpected fetch call/);
    expect(fetchedUrls.join(" ")).toContain(NEW_REPO);
  });
});
