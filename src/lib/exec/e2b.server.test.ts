// The E2B execution backend.
//
// The tests that earn their keep here are the ones guarding a FALSE GREEN, because
// that is the only failure mode of a merge gate that actually costs anything. A red
// check is loud. A sandbox that never ran, reported as "nothing to gate on", is
// silent and merges unverified code.
//
// Everything runs against an injected fake sandbox, so the suite never touches the
// network and never spends a cent of the credit.

import { afterEach, describe, expect, it } from "bun:test";
import { checksFromResults, execVerdictFromRun, type ExecCommandResult } from "./provider";
import {
  clampOutput,
  defaultChecks,
  defaultSetup,
  E2B_DEFAULT_TIMEOUT_MS,
  E2B_MAX_TIMEOUT_MS,
  e2bAvailable,
  e2bProvider,
  redactSecrets,
  resolveTimeoutMs,
  runInE2B,
  toCommandResult,
  withGitToken,
} from "./e2b.server";

const res = (over: Partial<ExecCommandResult> = {}): ExecCommandResult => ({
  name: "test",
  exitCode: 0,
  stdout: "",
  stderr: "",
  durationMs: 10,
  ...over,
});

const originalKey = process.env.E2B_API_KEY;
afterEach(() => {
  if (originalKey === undefined) delete process.env.E2B_API_KEY;
  else process.env.E2B_API_KEY = originalKey;
});

describe("execVerdictFromRun: the false-green guards", () => {
  it("REFUSES when the sandbox itself failed, never falls through to neutral", () => {
    // overallFromChecks([]) is "neutral" and neutral ALLOWS the merge, because for
    // the GitHub Actions floor an empty list means "this repo has no CI". For a
    // sandbox it means "nothing was verified". Conflating the two merges blind.
    const v = execVerdictFromRun("e2b", [], "sandbox boot failed");
    expect(v.mayProceed).toBe(false);
    expect(v.overall).toBe("failure");
    expect(v.reason).toContain("sandbox boot failed");
  });

  it("REFUSES when zero checks ran, even with no infrastructure error", () => {
    const v = execVerdictFromRun("e2b", [], null);
    expect(v.mayProceed).toBe(false);
    expect(v.overall).toBe("failure");
  });

  it("allows only when every check passed", () => {
    const v = execVerdictFromRun("e2b", [res({ name: "typecheck" }), res({ name: "test" })], null);
    expect(v.mayProceed).toBe(true);
    expect(v.overall).toBe("success");
  });

  it("refuses on one red check and names it, so the agent knows what to fix", () => {
    const v = execVerdictFromRun(
      "e2b",
      [res({ name: "typecheck" }), res({ name: "test", exitCode: 1 })],
      null,
    );
    expect(v.mayProceed).toBe(false);
    expect(v.reason).toContain("test");
    expect(v.reason).not.toContain("typecheck");
  });

  it("treats a timed-out check as failing, not as pending-and-therefore-fine", () => {
    const v = execVerdictFromRun("e2b", [res({ name: "test", exitCode: 0, timedOut: true })], null);
    expect(v.mayProceed).toBe(false);
  });
});

describe("checksFromResults", () => {
  it("maps exit 0 to success and anything else to failure", () => {
    expect(checksFromResults([res(), res({ exitCode: 2 })])).toEqual([
      { status: "completed", conclusion: "success" },
      { status: "completed", conclusion: "failure" },
    ]);
  });

  it("maps a timeout to timed_out, which the shared gate already treats as failing", () => {
    expect(checksFromResults([res({ timedOut: true })])[0].conclusion).toBe("timed_out");
  });
});

describe("toCommandResult", () => {
  it("carries the exit code off a THROWN CommandExitError", () => {
    // The single most important behaviour in this file. e2b throws on a non-zero
    // exit rather than returning one (verified against the live API). Code that
    // assumed the return value would read every failing test suite as an
    // infrastructure error, which is a false green on the merge gate.
    const thrown = Object.assign(new Error("exit status 7"), {
      name: "CommandExitError",
      exitCode: 7,
      stderr: "3 tests failed",
    });
    const r = toCommandResult("test", 100, undefined, thrown);
    expect(r.exitCode).toBe(7);
    expect(r.stderr).toContain("3 tests failed");
  });

  it("treats a throw with NO exit code as a failure, never as a pass", () => {
    const r = toCommandResult("test", 10, undefined, new Error("socket hang up"));
    expect(r.exitCode).toBe(1);
    expect(r.stderr).toContain("socket hang up");
  });

  it("reads a resolved value's exit code and streams", () => {
    const r = toCommandResult("typecheck", 50, { exitCode: 0, stdout: "ok", stderr: "" });
    expect(r).toMatchObject({ exitCode: 0, stdout: "ok", name: "typecheck" });
  });

  it("defaults a shapeless resolved value to exit 0, matching the SDK contract", () => {
    expect(toCommandResult("x", 1, {}).exitCode).toBe(0);
  });
});

describe("bounds", () => {
  it("clamps a requested timeout to the supported ceiling", () => {
    expect(resolveTimeoutMs(99 * 60_000)).toBe(E2B_MAX_TIMEOUT_MS);
  });

  it("falls back to the default for a missing or nonsense value", () => {
    expect(resolveTimeoutMs(undefined)).toBe(E2B_DEFAULT_TIMEOUT_MS);
    expect(resolveTimeoutMs(0)).toBe(E2B_DEFAULT_TIMEOUT_MS);
    expect(resolveTimeoutMs(-5)).toBe(E2B_DEFAULT_TIMEOUT_MS);
    expect(resolveTimeoutMs(NaN)).toBe(E2B_DEFAULT_TIMEOUT_MS);
  });

  it("truncates a chatty build and says how much it dropped", () => {
    const out = clampOutput("x".repeat(50_000));
    expect(out.length).toBeLessThan(50_000);
    expect(out).toContain("truncated");
  });

  it("is total against a non-string", () => {
    expect(clampOutput(undefined)).toBe("");
    expect(clampOutput(null)).toBe("");
  });
});

describe("credential handling: the sandbox runs UNTRUSTED code", () => {
  const TOKEN = "ghs_abcdefghijklmnopqrstuvwxyz0123456789";

  it("never puts the token in any command string", () => {
    // `bun install` runs the repo's postinstall scripts and `bun test` runs its test
    // files. Anything interpolated into a command is visible to all of it.
    const setup = withGitToken(defaultSetup("acme/app", "main"), TOKEN);
    for (const c of [...setup, ...defaultChecks()]) {
      expect(c.run).not.toContain(TOKEN);
    }
  });

  it("scopes the token to the CLONE step and to nothing else", () => {
    const setup = withGitToken(defaultSetup("acme/app", "main"), TOKEN);
    const withToken = setup.filter((c) => Object.values(c.envs ?? {}).includes(TOKEN));
    expect(withToken.map((c) => c.name)).toEqual(["clone"]);
    // deps runs untrusted postinstall scripts; it must not see the credential.
    expect(setup.find((c) => c.name === "deps")!.envs ?? {}).toEqual({});
  });

  it("SCRUBS the credential out of .git/config, which git persists on clone", () => {
    // `git clone https://user:tok@host/r` writes the credential into .git/config,
    // where any postinstall script can read it. The rewrite must happen in the same
    // command, before anything else runs.
    const clone = defaultSetup("acme/app", "main").find((c) => c.name === "clone")!.run;
    expect(clone).toContain("git remote set-url origin");
    expect(clone).toContain("https://github.com/acme/app.git");
  });

  it("ASSERTS the scrub worked, so a survivor fails the run instead of leaking", () => {
    const clone = defaultSetup("acme/app", "main").find((c) => c.name === "clone")!.run;
    expect(clone).toContain('! grep -q "x-access-token" .git/config');
  });

  it("redacts a declared token from captured output", async () => {
    process.env.E2B_API_KEY = "e2b_test";
    const f = fakeSandbox({
      "git clone": {
        exitCode: 128,
        // git really does echo the remote URL on a failed clone.
        stderr: `fatal: could not read from 'https://x-access-token:${TOKEN}@github.com/acme/app.git'`,
      },
    });
    const out = await runInE2B(
      { setup: withGitToken(defaultSetup("acme/app", "main"), TOKEN), commands: defaultChecks() },
      { createSandbox: async () => f.sbx },
    );
    // The infra error is what reaches the model, the run record and the next prompt.
    expect(out.infraError).not.toContain(TOKEN);
    expect(out.infraError).toContain("redacted");
  });

  it("redacts a declared literal that matches no known credential shape", () => {
    // The primary mechanism. Patterns are the backstop for credentials we were
    // never handed; a declared literal must be removed whatever it looks like.
    const odd = "s3cr3t-deploy-value-not-matching-any-pattern";
    expect(redactSecrets(`env had ${odd} in it`, [odd])).toBe("env had [redacted] in it");
  });

  it("redacts a token it was never told about, by shape", () => {
    const leaked = "ghp_ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ";
    expect(redactSecrets(`remote rejected, using ${leaked}`)).not.toContain(leaked);
  });

  it("redacts a credential embedded in a URL while keeping the URL readable", () => {
    const out = redactSecrets("cloning https://x-access-token:sekrit@github.com/a/b.git");
    expect(out).not.toContain("sekrit");
    expect(out).toContain("github.com/a/b.git");
  });

  it("does not blank out ordinary build output over a short literal", () => {
    // Redacting a 3-char "secret" would gut normal output and teach everyone to
    // distrust the redaction.
    expect(redactSecrets("3 tests failed in api", ["api"])).toBe("3 tests failed in api");
  });
});

describe("setup and checks", () => {
  it("installs bun, because the default E2B template does not carry it", () => {
    // Verified against a live sandbox: `which bun` finds nothing; node, npm, python
    // and git are present. Dropping this step makes every check fail on "bun: not
    // found" and look like a broken repo.
    expect(defaultSetup("acme/app", "main").map((c) => c.name)).toEqual([
      "install-bun",
      "clone",
      "deps",
    ]);
  });

  it("pins the lockfile so a sandbox cannot resolve a different tree than CI", () => {
    expect(defaultSetup("acme/app", "main").find((c) => c.name === "deps")!.run).toContain(
      "--frozen-lockfile",
    );
  });

  it("clones the requested ref rather than whatever HEAD happens to be", () => {
    // Now quoted, so the assertion moves with it.
    expect(defaultSetup("acme/app", "feat/a").find((c) => c.name === "clone")!.run).toContain(
      "--branch 'feat/a'",
    );
  });

  /*
   * A BRANCH NAME WAS A WAY TO RUN A COMMAND NEXT TO A WRITE TOKEN.
   *
   * `ref` is `changeset.branch` or the repo's `default_branch` from the GitHub
   * API -- a name the repo's owner chooses -- and it was interpolated unquoted
   * into the ONE command in this file carrying `$SUPAPROD_GIT_TOKEN`, before
   * the `remote set-url` scrub and the `! grep -q "x-access-token"` assertion
   * that follow it. `git check-ref-format --branch` accepts every payload below.
   */
  const INJECTIONS = [
    "main;id",
    "main$(id)",
    "main`id`",
    "main|id",
    "main&&id",
    "main'id",
    "main\ntouch /tmp/pwned",
    "--upload-pack=id",
    "../../../etc/passwd",
    "main.lock",
    "/main",
    "main/",
  ];

  it.each(INJECTIONS)("refuses a ref that could run a command: %j", (ref) => {
    expect(() => defaultSetup("acme/app", ref)).toThrow(/not a usable git ref/);
  });

  it("never lets an unquoted ref reach the command carrying the token", () => {
    // The control: a legitimate ref still clones, and it is quoted.
    const run = defaultSetup("acme/app", "release/2026.08")!.find((c) => c.name === "clone")!.run;
    expect(run).toContain("--branch 'release/2026.08'");
    // And the token is still on that same line, which is why the quoting matters.
    expect(run).toContain("x-access-token");
  });

  it("accepts the ref shapes real repositories actually use", () => {
    for (const ref of ["main", "master", "feat/a-b_c.1", "v1.2.3", "release/2026.08"]) {
      expect(() => defaultSetup("acme/app", ref)).not.toThrow();
    }
  });

  it("runs typecheck, test and lint", () => {
    expect(defaultChecks().map((c) => c.name)).toEqual(["typecheck", "test", "lint"]);
  });
});

// A sandbox double that records what ran and whether it was killed.
function fakeSandbox(
  script: Record<string, { exitCode?: number; throws?: unknown; stderr?: string }> = {},
) {
  const ran: string[] = [];
  let killed = 0;
  return {
    ran,
    killed: () => killed,
    sbx: {
      sandboxId: "sbx_test",
      commands: {
        run: async (cmd: string) => {
          ran.push(cmd);
          // `key !== undefined`, not `key ?`: a match on the empty-string key is a
          // legitimate "every command" script and `""` is falsy.
          const key = Object.keys(script).find((k) => cmd.includes(k));
          const s = key !== undefined ? script[key] : undefined;
          if (s?.throws) throw s.throws;
          if (s?.exitCode && s.exitCode !== 0) {
            throw Object.assign(new Error("exit"), {
              name: "CommandExitError",
              exitCode: s.exitCode,
              stderr: s.stderr ?? "boom",
            });
          }
          return { exitCode: 0, stdout: "ok", stderr: "" };
        },
      },
      kill: async () => {
        killed++;
      },
    },
  };
}

describe("runInE2B", () => {
  it("refuses with no API key, and never pretends the checks passed", async () => {
    delete process.env.E2B_API_KEY;
    const out = await runInE2B({ commands: defaultChecks() });
    expect(out.infraError).toContain("E2B_API_KEY");
    expect(out.verdict.mayProceed).toBe(false);
    expect(e2bAvailable()).toBe(false);
  });

  it("runs setup then checks, and kills the sandbox", async () => {
    process.env.E2B_API_KEY = "e2b_test";
    const f = fakeSandbox();
    const out = await runInE2B(
      { setup: [{ name: "clone", run: "git clone x" }], commands: defaultChecks() },
      { createSandbox: async () => f.sbx },
    );
    expect(f.ran[0]).toContain("git clone");
    expect(out.results.map((r) => r.name)).toEqual(["typecheck", "test", "lint"]);
    expect(out.verdict.mayProceed).toBe(true);
    expect(f.killed()).toBe(1);
  });

  it("treats a SETUP failure as infrastructure, and runs no checks at all", async () => {
    // A failed clone says nothing about the code. Reporting it as a red check would
    // send an agent off to "fix" source that was never even fetched.
    process.env.E2B_API_KEY = "e2b_test";
    const f = fakeSandbox({ "git clone": { exitCode: 128 } });
    const out = await runInE2B(
      { setup: [{ name: "clone", run: "git clone x" }], commands: defaultChecks() },
      { createSandbox: async () => f.sbx },
    );
    expect(out.infraError).toContain("clone");
    expect(out.results).toEqual([]);
    expect(out.verdict.mayProceed).toBe(false);
    expect(f.killed()).toBe(1);
  });

  it("treats a FAILING CHECK as evidence, not as an infrastructure error", async () => {
    process.env.E2B_API_KEY = "e2b_test";
    const f = fakeSandbox({ "bun test": { exitCode: 1 } });
    const out = await runInE2B({ commands: defaultChecks() }, { createSandbox: async () => f.sbx });
    expect(out.infraError).toBeNull();
    expect(out.results.find((r) => r.name === "test")!.exitCode).toBe(1);
    expect(out.verdict.mayProceed).toBe(false);
    expect(out.verdict.reason).toContain("test");
  });

  it("kills the sandbox even when creation succeeded and everything after threw", async () => {
    // An orphaned sandbox bills per second until its own timeout expires, so the
    // kill must survive any failure path.
    process.env.E2B_API_KEY = "e2b_test";
    const f = fakeSandbox({ "": { throws: new Error("network gone") } });
    const out = await runInE2B(
      { commands: [{ name: "test", run: "bun test" }] },
      { createSandbox: async () => f.sbx },
    );
    expect(f.killed()).toBe(1);
    expect(out.verdict.mayProceed).toBe(false);
  });

  it("never throws when the sandbox cannot be created", async () => {
    process.env.E2B_API_KEY = "e2b_test";
    const out = await runInE2B(
      { commands: defaultChecks() },
      {
        createSandbox: async () => {
          throw new Error("capacity");
        },
      },
    );
    expect(out.infraError).toContain("capacity");
    expect(out.verdict.mayProceed).toBe(false);
  });

  it("does not let a failed kill turn a good run bad", async () => {
    process.env.E2B_API_KEY = "e2b_test";
    const f = fakeSandbox();
    f.sbx.kill = async () => {
      throw new Error("already gone");
    };
    const out = await runInE2B(
      { commands: [{ name: "test", run: "bun test" }] },
      { createSandbox: async () => f.sbx },
    );
    expect(out.infraError).toBeNull();
    expect(out.verdict.mayProceed).toBe(true);
  });
});

describe("e2bProvider descriptor", () => {
  it("reports availability from the key at ACCESS time, not at module load", async () => {
    delete process.env.E2B_API_KEY;
    expect(e2bProvider.available).toBe(false);
    process.env.E2B_API_KEY = "e2b_test";
    expect(e2bProvider.available).toBe(true);
  });

  it("executes, and deliberately does not preview", () => {
    // Not an oversight. The build agent works in the CUSTOMER's repo and their pull
    // requests already carry their own preview deploys, so a preview from us would
    // duplicate infrastructure they own. See docs/decisions/build-sandbox-vendor.md.
    expect(e2bProvider.executes).toBe(true);
    expect(e2bProvider.previewsBuilds).toBe(false);
  });

  it("names the place a build ran without leaking the vendor into the UI", () => {
    expect(e2bProvider.label).toBe("Supaprod sandbox");
  });
});
