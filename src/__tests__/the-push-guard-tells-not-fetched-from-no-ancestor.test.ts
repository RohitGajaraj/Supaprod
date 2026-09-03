/**
 * P-27 (A-QUEUE.md). DRIVES THE REAL HOOK AGAINST REAL GIT REPOS.
 *
 * Not a source-scan of the script's text: these tests build actual temp git
 * repositories, feed the hook the exact stdin git pipes to pre-push (one line
 * per ref: `<local ref> <local sha> <remote ref> <remote sha>` -- see
 * githooks(5)), and read its real exit code and output. A string match on
 * "does this contain merge-base" would have let the original bug (treating a
 * missing object the same as a genuine orphan) pass every test, because the
 * buggy version and the fixed version both call merge-base; only running them
 * against the two real situations tells them apart.
 *
 * TWO CASES, MATCHING THE PACKET'S OWN WORDS:
 *   (a) a concurrent push -- the remote moved and this checkout has not
 *       fetched the new tip. Must block, must say "fetch and rebase", must
 *       NOT say the ORPHAN case's own wording.
 *   (b) a true orphan -- two histories that share no common commit, and the
 *       remote commit IS present locally (so the hook can even ask the
 *       question). Must block, must say "orphan".
 *
 * The hook itself is a tracked file (scripts/hooks/pre-push.sh), not a
 * heredoc string inside the installer, precisely so this test can execute
 * it directly. This file lives under src/__tests__/ rather than beside the
 * hook in scripts/hooks/ because bunfig.toml's [test] root is "src", and
 * only src/ -- a test outside it is invisible to a plain `bun test`.
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const HOOK = join(import.meta.dir, "..", "..", "scripts", "hooks", "pre-push.sh");
const ZERO = "0".repeat(40);

function git(cwd: string, args: string[]): string {
  const proc = Bun.spawnSync(["git", ...args], { cwd, stdout: "pipe", stderr: "pipe" });
  if (proc.exitCode !== 0) {
    throw new Error(
      `git ${args.join(" ")} failed in ${cwd}: ${proc.stderr.toString()}${proc.stdout.toString()}`,
    );
  }
  return proc.stdout.toString().trim();
}

/**
 * A throwaway repo with one commit on main, real enough for git to reason
 * about. `seed` becomes the file's content, so two repos always commit
 * different trees -- content, author, committer and message alone are not
 * enough: a commit's hash also folds in the timestamp, and two of these
 * built back to back can land in the same second, which made an earlier
 * version of this test occasionally build two "different" repos whose HEAD
 * commits hashed identically and were therefore trivially "already present"
 * in each other.
 */
function initRepo(dir: string, seed = "seed"): string {
  git(dir, ["init", "-q", "-b", "main"]);
  git(dir, ["config", "user.email", "test@example.com"]);
  git(dir, ["config", "user.name", "Test"]);
  Bun.write(join(dir, "seed.txt"), `${seed}\n`);
  git(dir, ["add", "seed.txt"]);
  git(dir, ["commit", "-q", "-m", `seed: ${seed}`]);
  return git(dir, ["rev-parse", "HEAD"]);
}

/** Runs the real hook, in the given repo, with the given ref line on stdin. */
function runHook(
  cwd: string,
  line: string,
  env: Record<string, string> = {},
): { code: number; out: string } {
  const proc = Bun.spawnSync(["bash", HOOK], {
    cwd,
    stdin: new TextEncoder().encode(line + "\n"),
    stdout: "pipe",
    stderr: "pipe",
    env: { ...process.env, ...env },
  });
  return { code: proc.exitCode ?? -1, out: proc.stdout.toString() + proc.stderr.toString() };
}

let root: string;

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), "pre-push-hook-test-"));
});

afterAll(() => {
  rmSync(root, { recursive: true, force: true });
});

describe("case (a): a concurrent push, not an orphan", () => {
  it("blocks, says fetch-and-rebase, and never says the orphan case's own wording", () => {
    // A repo that has one commit -- this checkout's own view of main -- and
    // NEVER learns about a second commit made "on the remote" (git init -q
    // with no second repo needed: the point is only that the sha in the ref
    // line is absent from THIS repo's object database, which a sha this repo
    // never created guarantees on its own).
    const dir = join(root, "concurrent");
    git(root, ["init", "-q", "-b", "main", dir]);
    const localSha = initRepo(dir);

    // A sha that is well-formed but genuinely unknown to this repo: another
    // repo's real commit, created and thrown away, so it is not a fabricated
    // string (git would reject a non-hex non-object sha differently) but is
    // certifiably absent from `dir`'s object store.
    const otherDir = join(root, "concurrent-other");
    git(root, ["init", "-q", "-b", "main", otherDir]);
    const foreignSha = initRepo(otherDir, "a different repo entirely");

    const { code, out } = runHook(dir, `refs/heads/main ${localSha} refs/heads/main ${foreignSha}`);

    expect(code).not.toBe(0);
    // The hook's own message says "NOT an orphan finding" as reassurance, so
    // banning the bare word would fail on the hook explaining itself
    // correctly; what must be absent is the ORPHAN CASE's own wording.
    expect(out.toLowerCase()).toContain("not an orphan finding");
    expect(out.toLowerCase()).not.toContain("no common ancestor");
    expect(out.toLowerCase()).not.toContain("orphan history");
    expect(out).not.toContain("wiped 4,124 commits");
    expect(out.toLowerCase()).toContain("fetch and rebase");
    expect(out).toContain(`git fetch origin && git rebase origin/main`);
  });

  it("passes clean once the checkout actually has the remote object", () => {
    // Same shape as above, except this time the "remote" sha is fetched into
    // the local repo first (as a real push would after `git fetch`), and it
    // IS an ancestor relationship (a fast-forward), so the hook must not
    // block at all.
    const dir = join(root, "concurrent-fetched");
    git(root, ["init", "-q", "-b", "main", dir]);
    const base = initRepo(dir);
    Bun.write(join(dir, "second.txt"), "second\n");
    git(dir, ["add", "second.txt"]);
    git(dir, ["commit", "-q", "-m", "second"]);
    const ahead = git(dir, ["rev-parse", "HEAD"]);

    // The object IS present (it is this repo's own HEAD), and it is a real
    // ancestor of itself trivially -- exercising the "object present, real
    // history" branch rather than the missing-object branch.
    const { code, out } = runHook(dir, `refs/heads/main ${ahead} refs/heads/main ${base}`);
    expect(code).toBe(0);
    expect(out.toLowerCase()).not.toContain("orphan");
    expect(out.toLowerCase()).not.toContain("fetch and rebase");
  });
});

describe("case (b): a true orphan, correctly told apart from case (a)", () => {
  it("blocks and says orphan, when the object is present but shares no history", () => {
    const dir = join(root, "orphan");
    git(root, ["init", "-q", "-b", "main", dir]);
    const localSha = initRepo(dir);

    // A second, disconnected root commit IN THE SAME REPO, so its object is
    // certifiably present in this repo's own store (git cat-file -e will
    // find it) -- the one condition that distinguishes this from case (a).
    git(dir, ["checkout", "-q", "--orphan", "unrelated-root"]);
    git(dir, ["rm", "-rf", "-q", "."]);
    Bun.write(join(dir, "unrelated.txt"), "unrelated\n");
    git(dir, ["add", "unrelated.txt"]);
    git(dir, ["commit", "-q", "-m", "an unrelated root, sharing no history with main"]);
    const orphanSha = git(dir, ["rev-parse", "HEAD"]);
    git(dir, ["checkout", "-q", "main"]);

    const { code, out } = runHook(dir, `refs/heads/main ${localSha} refs/heads/main ${orphanSha}`);

    expect(code).not.toBe(0);
    expect(out.toLowerCase()).toContain("orphan");
    expect(out).toContain("wiped 4,124 commits");
    expect(out.toLowerCase()).not.toContain("fetch and rebase");
  });

  it("ALLOW_ORPHAN_MAIN=1 still lets a genuine orphan through", () => {
    const dir = join(root, "orphan-allowed");
    git(root, ["init", "-q", "-b", "main", dir]);
    const localSha = initRepo(dir);

    git(dir, ["checkout", "-q", "--orphan", "unrelated-root"]);
    git(dir, ["rm", "-rf", "-q", "."]);
    Bun.write(join(dir, "unrelated.txt"), "unrelated\n");
    git(dir, ["add", "unrelated.txt"]);
    git(dir, ["commit", "-q", "-m", "an unrelated root"]);
    const orphanSha = git(dir, ["rev-parse", "HEAD"]);
    git(dir, ["checkout", "-q", "main"]);

    const { code } = runHook(dir, `refs/heads/main ${localSha} refs/heads/main ${orphanSha}`, {
      ALLOW_ORPHAN_MAIN: "1",
    });
    expect(code).toBe(0);
  });
});

describe("scope: only refs/heads/main is guarded, and a branch delete never blocks", () => {
  it("a push to a non-main ref is never checked, even against an unknown sha", () => {
    const dir = join(root, "non-main");
    git(root, ["init", "-q", "-b", "main", dir]);
    const localSha = initRepo(dir);

    const { code, out } = runHook(
      dir,
      `refs/heads/worktree-2 ${localSha} refs/heads/worktree-2 ${"f".repeat(40)}`,
    );
    expect(code).toBe(0);
    expect(out).toBe("");
  });

  it("deleting main (local sha all zero) is never checked", () => {
    const dir = join(root, "delete-main");
    git(root, ["init", "-q", "-b", "main", dir]);
    initRepo(dir);

    const { code } = runHook(dir, `refs/heads/main ${ZERO} refs/heads/main ${"a".repeat(40)}`);
    expect(code).toBe(0);
  });
});
