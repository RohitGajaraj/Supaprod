/**
 * A CALL THAT BELONGS TO NOTHING IS NOT TOLD IT BELONGS TO THE WORKSPACE.
 *
 * ── THE RULE WAS WRITTEN DOWN AND THEN BROKEN IN THE SAME FILE ─────────────
 * `subjectOf` in `_authenticated.inbox.tsx` states it in its own docstring:
 *
 *   *"Null on the families that are workspace wide (memory, house rules, trust,
 *    assumption challenges, playbooks), and null is drawn as nothing rather
 *    than as 'Workspace', because inventing a container for a call that has
 *    none says something the read never said."*
 *
 * Four hundred lines below it, the same file rendered
 * `where={subjectOf(focused) ?? "This workspace"}` under a heading that reads
 * "Where this call came from". Measured on production, 2026-09-09: 17 of Helio
 * Labs' 57 pending design gates carry no project, so every one of them was
 * given a container the read had never mentioned.
 *
 * ── WHY IT IS A SOURCE READ AND NOT A RENDER ──────────────────────────────
 * The defect is a FALLBACK, and a fallback is invisible to a render test unless
 * the test happens to supply the null that triggers it — which is exactly the
 * input a person writing the fallback does not think of. Reading the call site
 * asserts the shape instead: whatever `where` is handed, it is handed straight
 * through. `one-station-display-on-the-run-screen.test.ts` reads source for the
 * same reason and set the precedent.
 *
 * This is deliberately narrow. It does not test wording, it does not test which
 * subject is chosen, and a future change is free to give these calls a REAL
 * container — a run title, a station, anything the read actually returns. It
 * fails only on a literal invented at the call site.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

/* `fileURLToPath`, not `.pathname`: this repo's path contains spaces and a
   URL keeps those percent-encoded, so the read fails with ENOENT. */
const read = (rel: string): string =>
  readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const ROUTE = read("../../routes/_authenticated.inbox.tsx");
const CONTEXT = read("./CallContext.tsx");

describe("a call with no container is not given one", () => {
  it("reads the two files it is about, so this scan covers something", () => {
    expect(ROUTE).toContain("CallContext");
    expect(CONTEXT).toContain("Where this call came from");
  });

  it("hands CallContext whatever the read returned, with no fallback", () => {
    const call = ROUTE.match(/where=\{([^}]*)\}/);
    expect(call, "the approvals route no longer passes a `where` to CallContext").not.toBeNull();
    const expr = (call?.[1] ?? "").trim();
    expect(
      expr,
      [
        `The approvals route passes: where={${expr}}`,
        "",
        "`??` or `||` here means a call that belongs to no project is told it",
        "belongs to something. `subjectOf`'s own docstring forbids that, and",
        "the heading above this value promises to say where the call came from.",
        "If these calls should carry a subject, give them a real one in the",
        "read — a run title, a station — rather than a literal at the call site.",
      ].join("\n"),
    ).not.toMatch(/\?\?|\|\|/);
  });

  it("keeps the prop nullable, which is what makes the honest call site typecheck", () => {
    /*
     * The direction of causation, pinned. `where: string` is what FORCED the
     * fallback: the caller held a null and the type would not take it, so the
     * invention was written at the only place TypeScript left for it. Widen the
     * type back and the next caller does the same thing again.
     */
    expect(CONTEXT).toMatch(/where:\s*string\s*\|\s*null/);
  });

  it("draws nothing rather than an empty line when there is no container", () => {
    // The other half: a nullable prop that still rendered `{where}` would print
    // an empty element, which is a hole in the layout rather than an absence.
    expect(CONTEXT).toMatch(/\{where\s*\?\s*\(/);
  });
});

/**
 * THE OTHER HALF OF THE SAME HEADING: a call that DID come from somewhere says
 * where, and the somewhere is openable.
 *
 * Lane 1's fifth review, findings [0] and [7]: a call raised inside a run
 * reached this pane with no way back to it, so a person could answer the
 * question and have nowhere to go and watch the work carry on. Lane 3 landed
 * the link; this pins the door on it.
 */
describe("a call that came from a run can be opened at it", () => {
  it("passes both the address and the words, or neither", () => {
    /*
     * BOTH OR NEITHER IS THE RULE, not a style. A door carrying an id and no
     * words names no destination, which is the same defect one layer along from
     * the invented container above: the person is asked to press something on
     * faith. The route reads the run's title for the focused call and passes
     * the pair only when it has both.
     */
    expect(ROUTE).toContain("runHref=");
    expect(ROUTE).toContain("runTitle=");
    expect(ROUTE).toMatch(/runHref=\{focused\.trackId && runTitle \?/);
    expect(CONTEXT).toMatch(/\{runHref && runTitle \?/);
  });

  it("reads the title for the FOCUSED call only, never for the whole queue", () => {
    /*
     * The queue read is hop-counted and answers a different question at a
     * different rate. Widening it to carry a title for six hundred rows nobody
     * looks at would pay for the door on every row to serve the one in front of
     * the person. `enabled` on the focused call's own id is what keeps that
     * true, so it is asserted rather than left to a reviewer.
     */
    expect(ROUTE).toMatch(/enabled:\s*Boolean\(focused\?\.trackId\)/);
  });

  it("takes the title from the run screen's own read, so the two cannot drift", () => {
    // `getTrack` is what /track/$trackId renders its header from. A second
    // source here would let the door and the page it opens disagree about the
    // name of the same run.
    expect(ROUTE).toContain('from "@/lib/spine/track.functions"');
    expect(ROUTE).toContain("getTrack");
  });
});
