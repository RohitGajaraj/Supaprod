import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

/**
 * SPEC-MULTIPLAYER-PRESENCE 3.4, AND THE LAW IT IS MOST ABLE TO BREAK.
 *
 * Section 2: "A cursor that moves when nothing is happening is theatre, and
 * theatre is the one regression that deletes a feature rather than fixing it...
 * If you cannot name the row a position came from, do not draw the position."
 * Section 4 names S2 as the owner of this layer and S4 as the standing check.
 *
 * These assert the properties that make it unfakeable, not its wording.
 */

const CREW = readFileSync("src/components/shell/RailCrew.tsx", "utf8");
const FRAME = readFileSync("src/components/shell/AppFrame.tsx", "utf8");
const READ = readFileSync("src/lib/approvals-queue.functions.ts", "utf8");
const code = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

describe("no teammate without a row", () => {
  it("DRAWS FROM ANCHORS ONLY, which the read ties to a live run", () => {
    // The guarantee is structural, not careful: there is no input to this
    // component that carries a teammate without a row behind it.
    expect(code(CREW)).toContain("crewFromAnchors(anchors.data?.anchors)");
  });

  it("and the read admits only running runs", () => {
    const at = READ.indexOf("getWorkspaceAnchors");
    const handler = READ.slice(at, at + 1400);
    expect(handler).toContain('.in("status", ["running", "in_progress"])');
  });

  it("has no timer, no interval position, no interpolation", () => {
    // Section 2 bans a random walk, idle drift and interpolation by name. The
    // only clock here is the refetch, which changes what is READ, never where
    // something is drawn.
    const c = code(CREW);
    expect(c).not.toContain("setInterval");
    expect(c).not.toContain("setTimeout");
    expect(c).not.toContain("Math.random");
  });
});

describe("it never shows a calm room on a dead feed", () => {
  it("says it cannot see, when the read errors", () => {
    expect(code(CREW)).toContain("Cannot see who is working");
  });

  it("OFFERS A DOOR RATHER THAN CLAIMING AN EMPTY ROOM", () => {
    /*
     * The spec's words are "Nothing running: the rail is the door to /start",
     * and the door is safe while the SENTENCE is not.
     * `getWorkspaceAnchors` swallows a failed `agent_runs` read and returns
     * `{ anchors: [], unknowableRuns: 0 }` rather than throwing, so `isError`
     * stays false and the empty branch is reached by BOTH "nobody is working"
     * and "we could not find out". They are byte-identical at the client.
     */
    expect(code(CREW)).toContain("Start a run");
    expect(code(CREW)).not.toContain("Nothing running.");
  });

  it("counts the runs it cannot speak for, and only upward", () => {
    // A live run with no `trace_id` has no action to name. Omitting it would
    // undercount the crew on the one control that answers "how many". A
    // positive count is provable; zero is not, so it only ever draws upward.
    expect(code(CREW)).toContain("unknowable > 0 ?");
    expect(code(CREW)).toContain("are running and not saying what");
  });
});

describe("mounted once, for everyone", () => {
  it("lives in the shell, not on a route", () => {
    // Section 4: "Cross-surface, so it lives with the shell. One
    // implementation, never per-route."
    expect(code(FRAME)).toContain("<RailCrew workspaceId={workspaceId} />");
  });

  it("reads from the shared presence key", () => {
    // "OverlapNote drew collisions from the same read" left this case (P-14,
    // A-QUEUE.md): `components/today/OverlapNote.tsx` was exclusively owned by
    // `components/today/Board.tsx`, unmounted (zero importers) and deleted
    // with the cluster it alone belonged to. RailCrew's own key stands alone.
    expect(code(CREW)).toContain('queryKey: ["presence", "anchors", workspaceId]');
  });

  it("carries the verb in the accessible name, not only beside the mark", () => {
    // "Engineer, writing the change" is the whole fact; the name alone is half.
    expect(code(CREW)).toContain("aria-label={`${name}, ${m.verb}`}");
  });

  it("backs its poll off like every other live read in this lane", () => {
    expect(code(CREW)).toContain("pollMs(10_000, q.state.fetchFailureCount)");
  });

  it("offers no door to the surface the reader is already standing on", () => {
    /*
     * Found on the rendered shell, not in this file: standing on the home, the
     * quiet crew state offered "Start a piece of work" while the composer sat
     * three inches to the right, already focused. R-20's "no dead end" asks a
     * surface to offer the next action, and an action landing you where you
     * already are is that defect wearing the remedy's clothes.
     *
     * Asserted against the CONSTANT rather than the string "/start", for the
     * same reason F-144 was fixed by derivation: if the home moves and this
     * comparison does not, the door comes back on the new home and nothing
     * fails.
     */
    expect(code(CREW)).toContain("if (pathname === SIGNED_IN_HOME) return null;");
    expect(code(CREW)).toContain('from "@/components/shell/post-auth-home"');
  });

  it("still claims nothing in that branch, because the read swallows its failure", () => {
    /*
     * THE REASON IT RENDERS NOTHING RATHER THAN A SENTENCE, pinned so a future
     * edit that "improves" it has to answer this first.
     *
     * `getWorkspaceAnchors` returns an empty result on a failed `agent_runs`
     * read instead of throwing, so `isError` stays false and this branch is
     * reached by BOTH "nobody is working" and "we could not find out". A
     * sentence here is a false all-clear on a dead feed, which SPEC-MULTIPLAYER
     * -PRESENCE §2 forbids by name. Drawing nothing claims nothing.
     *
     * The guard reads the SERVER function, so the day S0 makes that read throw,
     * this test fails and tells whoever is standing there that the quiet branch
     * can finally speak.
     */
    const fn = readFileSync("src/lib/approvals-queue.functions.ts", "utf8");
    expect(fn).toContain(
      "if (runsErr || !runs) return { anchors: [], collisions: [], unknowableRuns: 0 };",
    );
  });
});
