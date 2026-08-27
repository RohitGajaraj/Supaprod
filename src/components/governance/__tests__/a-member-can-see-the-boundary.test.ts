/**
 * A MEMBER COULD NOT SEE WHETHER THE AGENTS WERE RUNNING.
 *
 * Two whole regions of BoundaryControls sat inside `data.isOwner`: the ceiling
 * (per-run and per-track spend caps, and the kill switch) and the two bars that
 * decide what starts without anybody clicking. A member opened the page that
 * answers "what can these agents do without asking me" and was shown the tool
 * list and nothing else.
 *
 * THREE THINGS WERE WRONG WITH THAT, and only the first is obvious.
 *
 * The kill switch is the most important fact on the page. Whether the crew is
 * stopped is not a privilege.
 *
 * It fails the SAFE reading. R-22 says an unset ceiling is the default and
 * never "unlimited", and that absent values resolve to the safe reading -- but
 * a member shown no ceiling at all concludes there is no limit. That is the
 * unsafe reading arrived at by omission instead of by a claim, which is worse,
 * because nothing on screen can be pointed at as wrong.
 *
 * And the reader already existed. `getBoundary` returns capUsd, trackCapUsd,
 * paused and the caller's `role` to EVERYONE, and the comment on `role` in
 * governance.functions.ts says it is there "so the surface can say why a
 * control is absent". It was built for this and the surface never used it.
 *
 * Seeing the boundary is the question this page exists to answer. Changing it
 * is the privilege. This asserts the split stays that way round.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const panel = readFileSync(join(import.meta.dir, "..", "BoundaryControls.tsx"), "utf8");

/**
 * The file WITHOUT its comments.
 *
 * The R-22 assertion below looks for the word "unlimited" reaching a screen,
 * and the first version failed on the comment that QUOTES R-22 while explaining
 * why the word is banned. That is a guard tripping over its own documentation,
 * and the tempting fix -- delete the explanation -- makes the file worse. So it
 * reads the code.
 */
const code = panel.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("a member can see the boundary they cannot change", () => {
  it("no Region is gated behind ownership", () => {
    // The defect shape, exactly: an owner check wrapping a whole region.
    const gatedRegion = /data\.isOwner \? \(\s*(<>\s*)?<Region/.test(panel);
    expect(gatedRegion, "show the fact and gate the control, not the region").toBe(false);
  });

  it("the kill switch state is readable without owning the workspace", () => {
    // The Toggle is owner-only; the state must still be rendered for everyone.
    expect(panel).toContain('{data.paused ? "Paused" : "Running"}');
  });

  it("the spend ceilings render a value when the input is not offered", () => {
    expect(panel).toContain('data.capUsd === null ? "not set"');
    expect(panel).toContain('data.trackCapUsd === null ? "not set"');
    // R-22: never the word "unlimited" for an unset ceiling.
    expect(code.toLowerCase()).not.toContain("unlimited");
  });

  it("says who may move them, using the role the server already sends", () => {
    expect(panel).toContain("Who can move these");
    expect(panel).toContain("data.role");
  });
});
