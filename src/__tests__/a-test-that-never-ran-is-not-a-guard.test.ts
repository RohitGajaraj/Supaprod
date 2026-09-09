/**
 * A TEST FILE THAT NAMES A RUNNER FUNCTION IT DID NOT IMPORT LOSES THOSE TESTS
 * SILENTLY, AND THE SUITE STILL SAYS GREEN.
 *
 * ── THE DEFECT, TWICE ─────────────────────────────────────────────────────
 * First sighting: `hero-copy.test.ts` called `test` without importing it and
 * had NEVER run (F-219). Second sighting, 2026-09-09:
 * `what-learn-is-waiting-for.test.ts` imported `describe, test, expect` and
 * then wrote three cases with `it`. Eighteen tests were declared in that file
 * and FIFTEEN ran, measured by running the pre-fix version from git against
 * the fixed one. The three that did not run are the three that assert what the
 * Learn desk says to a person.
 *
 * ── WHY NOBODY NOTICED, WHICH IS THE WHOLE POINT ──────────────────────────
 * Bun reports the loss as `1 error` on a line of its own, NOT as a failure, so
 * the summary reads `0 fail` and every gate passes. That number had been in
 * this suite all day and was checked against a clean tree, found to be
 * pre-existing, and set aside. **Pre-existing is not the same as harmless**,
 * and a count of errors that nothing attributes to a file is a number nobody
 * can act on.
 *
 * The failure is also silent in the other direction: the three lost cases
 * PASSED once they ran. So nothing was broken, which means nothing would ever
 * have drawn attention to them, and the guard they were written to be simply
 * was not standing. That is the same shape as `.mrd-focus` being undefined and
 * the retired-linker rule in `route-inventory.test.ts`: a thing that looks like
 * coverage and is not is worse than an absence, because nobody goes looking.
 *
 * ── WHY IT IS A GREP AND NOT A LINT RULE ──────────────────────────────────
 * A file that imports NOTHING from `bun:test` gets the runner's globals and is
 * fine; this only bites a file that has an explicit import list and then reads
 * past it, which is exactly what makes it look correct. Deliberately
 * synchronous, no runner introspection: the thing being checked is whether a
 * file would load, so the check must not depend on loading it.
 *
 * Comments and string literals are stripped first. Without that the reader
 * returns thirteen files, every one of them the English word "it" followed by
 * a parenthesis in a prose comment, which is how this repo writes.
 */
import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SRC = join(import.meta.dir, "..");

/** Every name the runner provides that a file could call without importing. */
const RUNNER_GLOBALS = [
  "it",
  "test",
  "describe",
  "expect",
  "beforeEach",
  "afterEach",
  "beforeAll",
  "afterAll",
  "mock",
  "spyOn",
] as const;

function testFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.endsWith(" 2")) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) testFiles(full, out);
    else if (/\.test\.(ts|tsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

/** Block comments, line comments and string literals go, so the word "it" in
 *  a sentence is not read as a call. The `[^:]` guard on the line comment
 *  keeps `https://` intact. */
function codeOnly(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''");
}

function importedFromBunTest(source: string): string[] {
  return [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*"bun:test"/g)]
    .flatMap((m) => (m[1] ?? "").split(",").map((name) => name.trim().split(" as ")[0]!.trim()))
    .filter(Boolean);
}

describe("a test that never ran is not a guard", () => {
  const files = testFiles(SRC);

  test("the reader found the suite (the tree moved, or the filter broke)", () => {
    expect(files.length).toBeGreaterThan(500);
  });

  test("every runner function a test file CALLS, it also imports", () => {
    const offenders: string[] = [];
    for (const file of files) {
      const raw = readFileSync(file, "utf8");
      const imported = importedFromBunTest(raw);
      // No import list at all means the runner's globals apply and nothing is lost.
      if (imported.length === 0) continue;
      const code = codeOnly(raw);
      for (const name of RUNNER_GLOBALS) {
        // A call in statement position: start of a line, then the bare name.
        const called = new RegExp(`^\\s*${name}(\\.\\w+)?\\s*\\(`, "m").test(code);
        if (called && !imported.includes(name)) {
          offenders.push(`${file.split("/src/")[1]} calls ${name}() and does not import it`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
