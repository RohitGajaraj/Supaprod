/**
 * F-144: THE SUITE IS GREEN BY ACCIDENT OF ORDERING, AND HERE IS THE MAP.
 *
 * S1 removed three genuinely dead files from their own prefix and the full suite
 * went red in `-_auth.server.test.ts`, a file they had not touched. They reverted
 * rather than push red, and diagnosed it correctly as order-dependent without
 * being able to prove the mechanism.
 *
 * **I reproduced it and got a DIFFERENT failure**: "connection reset" inside
 * `ask-blocks.server.ts`. Same cause, different casualty. That is worse than one
 * flaky test and it is the reason this file exists.
 *
 * ── THE MECHANISM ──────────────────────────────────────────────────────────
 * `mock.module` in Bun is **process-wide and persists for the run**. Bun executes
 * every test file in one process, so when two files mock the same module with
 * different implementations, **whichever loads last wins for everything after
 * it** — including files that never asked for a mock at all and expect the real
 * module.
 *
 * `AskPane`'s own docblock already records an instance of this in prose:
 * *"That swap is PROCESS-WIDE: whenever that file loaded before AskPane's own
 * suite, AskPane's tests imported the stub."*
 *
 * Adding or removing ANY test file reshuffles the order, so a lane's unrelated
 * change can turn the suite red somewhere else entirely — and it reads as "your
 * change broke the hooks test", which is exactly what it looked like to S1 for
 * ten minutes.
 *
 * ── WHAT THIS GUARD DOES, AND WHAT IT HONESTLY DOES NOT ────────────────────
 * It does **not** fix the seven collisions below. Rewriting thirteen test files
 * to stop sharing process state is real work with real risk, and doing it in the
 * same stretch as a four-lane integration is how a suite gets a new class of
 * failure rather than fewer.
 *
 * It makes the hazard **visible and bounded**: the current set is frozen, and a
 * new module joining it fails this test with both filenames. Same argument as
 * the Meridian ratchet — debt that cannot grow gets paid down; debt nobody can
 * see grows quietly and surfaces as somebody else's mystery.
 *
 * **The first place to look** when a test fails in a file you did not touch is
 * the list below.
 */
import { describe, expect, it } from "bun:test";
import { Glob } from "bun";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = fileURLToPath(new URL("..", import.meta.url));

/** Every module path any test file installs a process-wide mock for. */
function mocksByModule(): Map<string, string[]> {
  const out = new Map<string, string[]>();
  const files = [...new Glob("**/*.{ts,tsx}").scanSync({ cwd: SRC, absolute: true })].filter(
    (f) => f.includes(".test.") || f.includes("__tests__"),
  );
  for (const f of files) {
    let s: string;
    try {
      s = readFileSync(f, "utf8");
    } catch {
      continue;
    }
    for (const m of s.matchAll(/mock\.module\(\s*["']([^"']+)["']/g)) {
      const rel = f.slice(SRC.length);
      const list = out.get(m[1]!) ?? [];
      if (!list.includes(rel)) list.push(rel);
      out.set(m[1]!, list);
    }
  }
  return out;
}

/**
 * The collisions that exist today, frozen.
 *
 * Every entry is a module two or more test files replace process-wide. Not one
 * of them is a bug on its own; together they are why the suite's greenness
 * depends on file order. **This list may shrink and must never grow.**
 */
const KNOWN_SHARED: readonly string[] = [
  /*
   * `@/lib/ai/memory.server` and `@/lib/observability/errors` WERE here and are
   * resolved (F-147): the two `learning.record` files that both owned them are
   * now one file. The reverse-direction test below is what forced this line to
   * be deleted rather than left as a stale description of a fixed problem.
   */
  "@tanstack/react-router",
  "@tanstack/react-start",
  "@/hooks/use-workspace",
  "@/lib/ai/runtime.server",
  "@/lib/connectors/providers/github.server",
];

describe("the scan sees the real test tree", () => {
  it("finds mocks at all, so a broken scan cannot read as clean", () => {
    const all = mocksByModule();
    expect(all.size).toBeGreaterThan(10);
  });

  it("and finds the instance AskPane's own docblock records", () => {
    // That file names this hazard in prose and is one of the files causing it.
    const shared = [...mocksByModule().entries()].filter(([, fs]) => fs.length > 1);
    expect(shared.some(([, fs]) => fs.some((f) => f.includes("AskPane")))).toBe(true);
  });
});

describe("THE RATCHET: no new module joins the process-wide set", () => {
  it("the shared set has not grown", () => {
    const shared = [...mocksByModule().entries()]
      .filter(([, fs]) => fs.length > 1)
      .map(([mod]) => mod)
      .sort();
    const added = shared.filter((m) => !KNOWN_SHARED.includes(m));
    expect(
      added,
      [
        `A module is now mocked by more than one test file: ${added.join(", ")}`,
        "",
        "`mock.module` is PROCESS-WIDE in Bun and every test file runs in one",
        "process, so the file that loads last wins for everything after it,",
        "including files that expect the real module. Adding or removing any",
        "test file reshuffles that order.",
        "",
        "Either mock it in one file only, or inject the dependency so neither",
        "file has to replace a module the whole run shares.",
      ].join("\n"),
    ).toEqual([]);
  });

  it("and the frozen list stays honest as files are deleted", () => {
    /*
     * The other direction. If a collision is resolved, this fails and the entry
     * gets removed — so the list cannot quietly become a description of a
     * problem somebody already fixed, which is how a baseline stops being read.
     */
    const shared = new Set(
      [...mocksByModule().entries()].filter(([, fs]) => fs.length > 1).map(([mod]) => mod),
    );
    const stale = KNOWN_SHARED.filter((m) => !shared.has(m));
    expect(stale, `No longer shared, remove from KNOWN_SHARED: ${stale.join(", ")}`).toEqual([]);
  });
});
