/**
 * A WORKSPACE MUST NOT INHERIT ANOTHER TENANT'S REPOSITORY (2026-08-27).
 *
 * `GITHUB_REPO` is ONE repository for the whole deployment. `resolveGitHub` fell
 * through to it whenever a workspace had no binding of its own, which means any
 * unbound workspace would stage, commit and open pull requests against whatever
 * repository that variable happens to name.
 *
 * ── MEASURED, NOT HYPOTHETICAL ─────────────────────────────────────────────
 * `studio_changesets` holds rows against `RohitGajaraj/Test-Project-Cadence`
 * from **four different workspaces** — `0b792d52`, `482bdbb2`, `11ea33b6`,
 * `b90da531` — and **none of them is bound to it**. Four tenants writing code
 * into one repository through a shared default.
 *
 * Harmless so far because those are fixtures and that token is dead. The path is
 * real and what it writes is code.
 *
 * ── HOW IT WAS FOUND ───────────────────────────────────────────────────────
 * By chasing a 401. Two tracks failed against `Test-Project-Cadence` while a
 * third opened a real PR against `Supaprod/relay-homeowner-app`. The difference
 * was not the credential — which is what I first reported, wrongly — it was that
 * one workspace had a binding and the other did not, and the unbound one had
 * silently borrowed a repo.
 *
 * ── THE DIRECTION TO BE WRONG IN ───────────────────────────────────────────
 * Refusing costs a person one trip to Connectors. The alternative writes a
 * customer's spec into a repository belonging to somebody else.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./github.server.ts", import.meta.url)), "utf8");

describe("a named workspace is never given the deployment-wide repo", () => {
  it("refuses before any env repo is used", () => {
    expect(SRC).toContain("if (args.workspaceId && !envRepoIsBoundTo(args.workspaceId))");
  });

  it("and the rule answers no for every workspace", () => {
    // One repo for the whole deployment cannot be right for two tenants.
    expect(SRC).toContain("function envRepoIsBoundTo(_workspaceId: string): boolean");
    const at = SRC.indexOf("function envRepoIsBoundTo");
    expect(SRC.slice(at, at + 200)).toContain("return false;");
  });

  it("the refusal names the fix and the thing it will not do", () => {
    expect(SRC).toContain("No repository is connected for this workspace");
    expect(SRC).toContain("will not borrow another workspace's repository");
  });
});

describe("what is deliberately still allowed", () => {
  it("a bound workspace is untouched", () => {
    // The binding path returns before the guard is reached.
    const bindingAt = SRC.indexOf('resolved.source === "workspace_binding"');
    const guardAt = SRC.indexOf("envRepoIsBoundTo(args.workspaceId)");
    expect(bindingAt).toBeGreaterThan(-1);
    expect(bindingAt).toBeLessThan(guardAt);
  });

  it("and a call with NO workspace context can still use the env repo", () => {
    // A script or a dev shell has no tenant to be wrong about. The guard is
    // conditioned on `args.workspaceId` precisely so that path survives.
    expect(SRC).toContain("args.workspaceId &&");
  });
});
