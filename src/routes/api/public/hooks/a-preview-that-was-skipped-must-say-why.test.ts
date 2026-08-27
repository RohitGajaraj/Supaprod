/**
 * F-125: THE STEP THAT MAKES SHIP'S ONLY PROOF HAD THREE SILENT EXITS.
 *
 * `release.publish` accepts exactly one thing as evidence: a `deployments` row
 * with `provider='deno'`, `environment='preview'`, `status='success'`.
 * `ci-poll-tick` is the only writer of that row, and three of its four ways to
 * not write one said nothing at all:
 *
 *   · the repo could not be read            -> bare `continue`
 *   · its default branch head could not be  -> bare `continue`
 *   · the repo carries no `supaprod.json`   -> `if (managed) {...}` with no else
 *
 * So "we could not reach it", "this repo is not ours to deploy" and "there was
 * nothing to do" were **one indistinguishable outcome** in the job report.
 *
 * ── THE COST, MEASURED THE HARD WAY ────────────────────────────────────────
 * This check has run every two minutes for weeks. Asked today whether
 * `Supaprod/relay-homeowner-app` — the one repo the loop actually builds into —
 * carries the marker, **nothing in the system could answer**. The repo is
 * private to the App installation, so it cannot be read from outside either. A
 * check that has run thousands of times and recorded nothing about what it found
 * is a check nobody can learn from, and it left the last unknown on the critical
 * path (F-124) unanswerable from inside the product.
 *
 * ── WHY THE UNMARKED CASE IS REPORTED EVERY TIME, NOT ONCE ─────────────────
 * It is not our failure and its sentence says so. It is also not transient: a
 * merged changeset in an unmarked repo can NEVER reach production through us, so
 * it is a permanent stall somebody has to be told about. `canHost` has already
 * narrowed this to merged changesets under a retry backoff, so the volume is
 * bounded, and the sentence names the one file that would fix it.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./ci-poll-tick.ts", import.meta.url)), "utf8");
/** Comments stripped: the header quotes the very shapes being asserted against. */
const CODE = SRC.split("\n")
  .filter((l) => {
    const t = l.trim();
    return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
  })
  .join("\n");

describe("no exit from the preview step is silent any more", () => {
  it("an unreadable repo says so", () => {
    expect(CODE).toContain("could not read ${cs.repo} (${repoInfoRes.status})");
  });

  it("an unreadable head says so, and names the branch it tried", () => {
    // Without the branch, "could not read the head" cannot be acted on: the
    // default branch is read from the repo and may not be what anyone expects.
    expect(CODE).toContain("could not read ${cs.repo}@${defaultBranch}");
  });

  it("an unmarked repo says so, and names the file that would fix it", () => {
    expect(CODE).toContain("has no supaprod.json at its root");
  });

  it("and says what it MEANS, not just what was missing", () => {
    // A missing file is a fact. "This change cannot reach production through us"
    // is the consequence, and it is the half that makes someone act.
    expect(CODE).toContain("cannot reach production through us");
  });
});

describe("they are reported through the channel that already surfaces", () => {
  it("all three push onto `failures`", () => {
    const step = CODE.slice(CODE.indexOf("if (canHost) {"));
    const region = step.slice(0, step.indexOf("previewsDeployed") + 200);
    expect((region.match(/failures\.push\(/g) ?? []).length).toBeGreaterThanOrEqual(3);
  });

  it("none of them throws, because one bad repo must not end the batch", () => {
    /*
     * The surrounding code already learned this: a single throw "abandoned every
     * remaining forecast silently, so rows 1..k got drafts and k+1..10 got
     * nothing and nobody learned which". Same rule here, one table over.
     */
    const step = CODE.slice(CODE.indexOf("if (canHost) {"));
    const region = step.slice(0, step.indexOf("previewsDeployed"));
    expect(region).not.toContain("throw new Error");
  });
});

describe("the bare continues are gone", () => {
  it("neither fetch guard exits without a sentence", () => {
    expect(CODE).not.toContain("if (!repoInfoRes.ok) continue;");
    expect(CODE).not.toContain("if (!refRes.ok) continue;");
  });

  it("and the marker check is a guard clause rather than a bodiless skip", () => {
    // `if (managed) { ...50 lines... }` had no else and could not grow one
    // without re-indenting the whole block, which is how the silence persisted.
    expect(CODE).toContain("if (!managed) {");
  });
});
