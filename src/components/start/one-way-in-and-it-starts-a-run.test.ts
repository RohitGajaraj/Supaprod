/**
 * EVERY WAY IN STARTS A TRACK, AND NONE OF THEM CREATES A MISSION.
 *
 * ── THE TWO OBJECTS, AND WHY ONE OF THEM HAD TO STOP BEING A FRONT DOOR ───
 * R-24 makes a TRACK the unit of work: the thing that walks seven stations,
 * carries a forecast and can be sent to somebody. A MISSION is the older object
 * and it is still real inside Build, where the driver opens one so Build's own
 * tool will run at all. What it must not be any more is something a person
 * creates by typing a sentence, because then the product has two units of work
 * with two front doors and the one most people met was the one being retired.
 *
 * ── WHAT THE PALETTE DID ─────────────────────────────────────────────────
 * "Hand it over" posted `"do"` to `/api/chat`, which called `createMission` and
 * streamed back a LANDING FRAME: a link to `/build` that the person then had to
 * press. So the product's most direct instruction, typed from anywhere, neither
 * started a track nor took anybody anywhere.
 *
 * ── AND WHY THIS IS A SOURCE GUARD ───────────────────────────────────────
 * The claim is about REACHABILITY -- "no path from the UI reaches
 * `createMission`" -- and reachability is a fact about the code rather than
 * about one render. A DOM test could only show that one press did the right
 * thing on one day; this shows that the wire the old press used is not
 * connected to anything a person can touch.
 *
 * The server branch is NOT deleted and this does not assert that it is. It is a
 * route no packet holds, it still serves the classifier's own path, and
 * "unreachable from the UI" is the claim. Removing it is a different packet.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");
const flat = (s: string) => s.replace(/\s+/g, " ");

const PANE = read("../ask/AskPane.tsx");
const START = read("../../routes/_authenticated.start.tsx");
const STREAM = read("../../hooks/use-ask-stream.ts");

describe("the palette hands work over by starting a track", () => {
  it("calls the same server fn the composer calls, not a second path", () => {
    /*
     * One path, because a second one has to be kept in step with it. It is also
     * why this does not go through `/api/plan-gate`: a gate in front of a start
     * the composer does not have would make the same sentence behave differently
     * depending on which box it was typed into.
     */
    expect(PANE).toContain('import { startTrack } from "@/lib/spine/track.functions";');
    expect(START).toContain(
      'import { listRunsForStart, startTrack } from "@/lib/spine/track.functions";',
    );
  });

  it("navigates to the run it started, rather than rendering a link to press", () => {
    const f = flat(PANE);
    expect(f).toContain('to: "/track/$trackId"');
    expect(f).toContain("search: { start: true }");
  });

  it("puts the sentence back in the box when nothing was started", () => {
    /*
     * The pane is a modal over whatever the person was doing. On success it
     * navigates and is gone, so a failure that also closed it would leave them
     * where they began with no sentence and no run, and nothing said.
     */
    const f = flat(PANE);
    expect(f).toContain("setHandoverProblem(");
    expect(f).toContain("setDraft(text);");
  });
});

describe("and no path from the UI reaches createMission", () => {
  it("emits no `do` intent from the pane", () => {
    expect(flat(PANE)).not.toContain('sendIntent(contentForIntent(text, intent), "do")');
  });

  it("leaves `sendIntent` with nothing in the UI that asks it for one", () => {
    /*
     * `use-ask-stream` still ACCEPTS "do" -- it is a hook, and narrowing its
     * type is a change to a module this packet does not hold. What matters is
     * that nothing on a surface passes it, which is what the two assertions
     * here and above together say.
     */
    expect(STREAM).toContain("sendIntent");
    const callers = ["../ask/AskPane.tsx"].map(read).map(flat);
    for (const c of callers) expect(c).not.toMatch(/sendIntent\([^;]*"do"/);
  });

  it("does not import createMission into any surface", () => {
    /*
     * The IMPORT, not the word. Both files name it in a comment explaining what
     * they stopped doing, and a guard that forbade the word would push the next
     * author to delete the explanation -- which is the one thing that makes this
     * change legible a year from now. The one caller is `routes/api/chat.ts`,
     * which is a server route.
     */
    for (const src of [PANE, START]) {
      expect(src).not.toMatch(/^import .*createMission/m);
      expect(src).not.toMatch(/createMission\s*\(/);
    }
  });
});
