import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * A FILESYSTEM PATH IS NOT A URL COMPONENT, AND `.pathname` IS THE SECOND ONE.
 *
 * ── WHY THIS IS A GUARD AND NOT A COMMENT ─────────────────────────────────
 * On 2026-09-01 S3 found three failing tests on `main` that were green on my
 * machine and red on theirs. All three were mine. All three read a file with
 * `new URL("../x", import.meta.url).pathname`.
 *
 * **`.pathname` is percent-encoded by definition.** Their checkout lives under
 * `/Users/rohit/My Projects/My Builds/…`, so every read asked for a directory
 * literally named `My%20Projects` and got ENOENT:
 *
 *   .pathname      -> /Users/rohit/My%20Projects/My%20Builds/src/x.tsx
 *   fileURLToPath  -> /Users/rohit/My Projects/My Builds/src/x.tsx
 *
 * Mine is `/Users/rohitgajaraj/…` with no spaces, so the encoding was a no-op.
 * **My tests passed because of my username.**
 *
 * ── THE ARGUMENT FOR A GUARD, WHICH IS S3'S AND IS BETTER THAN MINE ───────
 * `src/components/discover/PublishTeardown.test.tsx:143` **already carried this
 * warning in full**, in a directory I own:
 *
 *   *"fileURLToPath, not `.pathname`: this repo lives under a path with spaces
 *   and `.pathname` hands back the percent-encoded form."*
 *
 * It was written down and it still did not reach me. S3's reading: *"the problem
 * is not diligence — a convention that lives only in one file's comment is not
 * discoverable by anyone who is not already reading that file. That is an
 * argument for the guard, not for trying harder."* This is that guard.
 *
 * ── WHY IT SCANS ALL OF `src/` RATHER THAN ONE PREFIX ─────────────────────
 * The defect is not confined to a prefix and **its failure blames the wrong
 * file**: the ENOENT names `TrackChain.tsx`, `driver.server.ts`, `Gate.tsx` —
 * all healthy. A contributor reads a stack trace pointing at working source.
 * Repo-wide scanning guards are an established pattern here
 * (`agent-vocabulary.test.ts` does exactly this for station slugs), and this one
 * is green today with **zero instances anywhere in `src/`**, so it costs no lane
 * a red it did not cause. A lane that adds one gets a failure naming its own
 * file and the one-line fix.
 */

const SRC = join(import.meta.dir, "..", "..");

/** Every shipped and test source file under `src/`. */
function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules") continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) sourceFiles(full, out);
    else if (/\.tsx?$/.test(entry.name)) out.push(full);
  }
  return out;
}

/**
 * `.pathname` taken off a `file:` URL, with or without a hand-rolled decode.
 *
 * The `.replace(/%20/g, " ")` workaround is matched deliberately: it survives a
 * space and still breaks on `#`, `?` or anything non-ASCII, so it is the same
 * defect with a longer fuse rather than a fix. `gate-order-is-an-invariant`
 * carried exactly that and is now on `fileURLToPath` like the rest.
 */
const OFFENDER = /import\.meta\.url\s*\)\s*\.pathname/;

/**
 * COMMENTS ARE STRIPPED, AND THE GUARD CAUGHT ITSELF TEACHING ME THAT.
 *
 * The first run failed on a clean tree with exactly one offender: **this file**,
 * because the header above quotes the bad pattern in prose to explain it. A
 * guard that cannot discuss the defect it prevents is a guard nobody can
 * maintain.
 *
 * `agent-vocabulary.test.ts` had already solved this and said why — it strips
 * comments because *"three files discuss this incident in prose"*, and notes
 * that a guard firing on them *"would have been turned off within a day."*
 * **So the convention I was writing a guard about had a second convention
 * attached to it, one file over, and I hit that one too.** Reused rather than
 * re-invented.
 */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}

describe("a filesystem path is never taken from URL.pathname", () => {
  it("no file under src/ reads one", () => {
    const offenders = sourceFiles(SRC)
      .filter((f) => OFFENDER.test(stripComments(readFileSync(f, "utf8"))))
      .map((f) => f.slice(f.indexOf("/src/") + 1));

    expect(
      offenders,
      "`.pathname` is percent-encoded. Use fileURLToPath(new URL(...)) from node:url, " +
        "or join(import.meta.dir, ...). These break on any checkout whose path contains " +
        "a space, and the error blames the file being READ, not the reader",
    ).toEqual([]);
  });

  it("the encoding it guards against is real, not folklore", () => {
    /*
     * Proving the mechanism in the guard itself, so nobody has to take the
     * header on faith or reproduce a checkout with spaces to check it. This is
     * the assertion that would still be true if every offender were gone.
     */
    const u = new URL("file:///Users/rohit/My Projects/x.tsx");
    expect(u.pathname).toBe("/Users/rohit/My%20Projects/x.tsx");
    expect(fileURLToPath(u)).toBe("/Users/rohit/My Projects/x.tsx");
    expect(u.pathname).not.toBe(fileURLToPath(u));
  });

  it("the scan reaches the directories the offenders were actually in", () => {
    /*
     * A guard that silently walks nothing is the exact failure it exists to
     * prevent -- green for an environmental reason rather than because the rule
     * holds. So it asserts its own reach over the three prefixes that carried
     * the bug.
     */
    const files = sourceFiles(SRC);
    expect(files.length).toBeGreaterThan(500);
    for (const dir of ["/components/track/", "/components/ship/", "/lib/"]) {
      expect(
        files.some((f) => f.includes(dir)),
        `scan never reached ${dir}`,
      ).toBe(true);
    }
  });
});
