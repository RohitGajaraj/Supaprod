/**
 * P-47 (A-QUEUE.md). DRIVES THE REAL HOOK, NOT A SOURCE-SCAN OF ITS TEXT.
 *
 * `scripts/check-humanized.sh`'s own header says passing a markdown path
 * explicitly is "the deliberate opt-in" for scanning a public page authored
 * as `.md` (the automatic staged-diff sweep otherwise skips `.md`/`.sql`
 * entirely). It was not: `scan_file_args` still filtered every explicit
 * argument through the same extension allowlist the sweep uses, so a
 * one-line `.md` with a bare em dash, passed explicitly, reported clean.
 * Confirmed with that exact repro (A3, P-46) before this packet existed.
 *
 * Fixed by dropping the extension check from `scan_file_args` only --
 * `scan_staged_diff` (the automatic sweep) is untouched, so a markdown file
 * that merely gets staged and committed, without anyone naming its path on
 * the command line, still does not trip this guard. The two tests below
 * pin exactly that split: the same file, explicit argument fails, staged
 * diff still passes.
 *
 * This file lives under `src/__tests__/` rather than beside the script in
 * `scripts/` for the reason `the-push-guard-tells-not-fetched-from-no-
 * ancestor.test.ts` already gives: `bunfig.toml`'s `[test]` root is `src`,
 * so a test outside it is invisible to a plain `bun test`.
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const SCRIPT = join(import.meta.dir, "..", "..", "scripts", "check-humanized.sh");
const EM_DASH_LINE = "plain text with an em dash — right here.\n";

function git(cwd: string, args: string[]): string {
  const proc = Bun.spawnSync(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  if (proc.exitCode !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed in ${cwd}: ${proc.stderr.toString()}${proc.stdout.toString()}`,
    );
  }
  return proc.stdout.toString().trim();
}

/** Runs the real script, with the given cwd and argv, STRICT=1 so a hit is a real exit code. */
function runScript(cwd: string, args: string[]): { code: number; out: string } {
  const proc = Bun.spawnSync(["bash", SCRIPT, ...args], {
    cwd,
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, STRICT: "1" },
  });
  return { code: proc.exitCode ?? -1, out: proc.stdout.toString() + proc.stderr.toString() };
}

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "check-humanized-test-"));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("an explicit markdown path is scanned whatever its extension", () => {
  it("a one-line .md with an em dash, passed explicitly, fails", () => {
    const file = join(root, "dashtest.md");
    writeFileSync(file, EM_DASH_LINE);

    const { code, out } = runScript(root, [file]);

    expect(code).not.toBe(0);
    expect(out).toContain("em-dash");
    expect(out).toContain("dashtest.md");
  });

  it("the same em dash inside a fenced code block is not flagged", () => {
    // The scanner's fence-tracking is extension-independent; this pins that
    // dropping the extension filter did not also drop fence-awareness.
    const file = join(root, "fenced.md");
    writeFileSync(file, "```\n" + EM_DASH_LINE + "```\n");

    const { code } = runScript(root, [file]);

    expect(code).toBe(0);
  });

  it("a clean .md file, passed explicitly, still passes", () => {
    const file = join(root, "clean.md");
    writeFileSync(file, "plain text with no banned characters at all.\n");

    const { code, out } = runScript(root, [file]);

    expect(code).toBe(0);
    expect(out).toContain("clean");
  });
});

describe("the automatic sweep is unchanged: only an explicit path opts in", () => {
  it("the same file, staged and committed under docs/lanes/, still passes as today", () => {
    const dir = join(root, "sweep-repo");
    git(root, ["init", "-q", "-b", "main", dir]);
    git(dir, ["config", "user.email", "test@example.com"]);
    git(dir, ["config", "user.name", "Test"]);

    const lanesDir = join(dir, "docs", "lanes");
    Bun.spawnSync(["mkdir", "-p", lanesDir]);
    const file = join(lanesDir, "dashtest.md");
    writeFileSync(file, EM_DASH_LINE);
    git(dir, ["add", "docs/lanes/dashtest.md"]);

    // No file arguments: this is the staged-diff sweep, TEXT_EXT_RE/CONSUMER_RE
    // still govern it, and .md is not in either allowlist.
    const { code, out } = runScript(dir, []);

    expect(code).toBe(0);
    expect(out).not.toContain("em-dash");
  });
});
