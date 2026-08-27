/**
 * TWO EDITORS OF ONE KILL SWITCH CAN SHOW A PERSON THE OPPOSITE OF THE TRUTH.
 *
 * Until this was fixed, `ControlsPanel` carried a live pause toggle while
 * `BoundaryControls` drew a read-only "Everything is paused" line -- and U-026
 * mounted BOTH on the same settings pane. Each read its own query. One stale
 * read and the page showed a toggle saying the crew was running beside a line
 * saying it was stopped, with no way for the reader to know which was true.
 *
 * That is the one fact on that page nobody may be wrong about, so S0 ruled
 * (A-006 section 2): BoundaryControls is the ONLY editor, and it is the right
 * home because stopping everything is the outermost boundary there is.
 *
 * This asserts the ruling in the only way that survives a refactor: by counting
 * who can actually call the write. A comment saying "readout only" is not a
 * guarantee; not importing the mutation is.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const DIR = join(import.meta.dir, "..");

function componentsCalling(fn: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(DIR)) {
    if (!name.endsWith(".tsx")) continue;
    const src = readFileSync(join(DIR, name), "utf8");
    // useServerFn(x) is what makes the write callable from a component.
    if (src.includes(`useServerFn(${fn})`)) out.push(name);
  }
  return out.sort();
}

describe("the kill switch has exactly one editor", () => {
  it("only BoundaryControls can call setWorkspacePause", () => {
    expect(componentsCalling("setWorkspacePause")).toEqual(["BoundaryControls.tsx"]);
  });

  it("ControlsPanel still SHOWS the state, so removing the editor did not hide the fact", () => {
    const src = readFileSync(join(DIR, "ControlsPanel.tsx"), "utf8");
    expect(src).toContain('label="Agents may run"');
    // A readout, not a control: no Toggle bound to the pause state.
    expect(src).not.toContain("pauseMut.mutate");
  });

  it("BoundaryControls reads the pause state from the same read as the rest of its rows", () => {
    // The whole point of moving the editor here: the control and the state it
    // draws come from one read, so they cannot drift.
    const src = readFileSync(join(DIR, "BoundaryControls.tsx"), "utf8");
    expect(src).toContain("checked={!data.paused}");
  });
});
