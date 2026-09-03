/**
 * ── FOUR PLACES SAID THE SHELL LABELLED THE SAMPLE. NONE OF THEM DID ──────
 *
 * P-33, 2026-09-03. A person on an empty desk is offered "Explore a sample
 * workspace". Pressing it does not open a preview beside their own: the
 * mutation calls `setActiveWorkspaceId`, which writes that id to localStorage,
 * so it is a MOVE and a sticky one. Every later visit lands in the sample.
 *
 * Nothing on any screen said so. `ScopeMenu` rendered `activeWorkspace.name`
 * alone, so a workspace full of an invented company's decisions was
 * indistinguishable from the person's own. And the door's own copy claimed the
 * data was "labelled example data" while `seed_sample_workspace` wrote every
 * row with no `is_sample` column: 2,144 rows in production, none marked, so the
 * row-level Example marks this product renders had never once fired.
 *
 * The reason this needs a guard rather than just a fix is the shape of how it
 * survived. FOUR separate places in the codebase asserted the tag and banner
 * already existed -- `use-workspace.tsx`'s type comment ("so the shell can
 * label it (a tag + a banner)"), `_authenticated.tsx` ("no sample banner"),
 * `seed-workspace.server.ts`, and the label migration. Every one of them was a
 * comment, and a comment is the least reliable thing in a repository because it
 * is the one part nothing executes. These assertions execute.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

const MARKS = strip(readFileSync("src/components/meridian/marks.tsx", "utf8"));
const BANNER = strip(readFileSync("src/components/meridian/SampleBanner.tsx", "utf8"));
const SCOPE = strip(readFileSync("src/components/shell/ScopeMenu.tsx", "utf8"));
const FRAME = strip(readFileSync("src/components/shell/AppFrame.tsx", "utf8"));
const DISCOVER = strip(readFileSync("src/components/discover/DiscoverSurface.tsx", "utf8"));

describe("the shell says which workspace you are standing in", () => {
  it("has a workspace-level Sample mark at all", () => {
    expect(MARKS).toContain("export function SampleTag");
  });

  it("renders it beside the active workspace name", () => {
    expect(SCOPE.replace(/\s+/g, " ")).toContain(
      'activeWorkspace.is_sample ? <SampleTag size="inline" /> : null',
    );
  });

  it("renders it on every row of the switcher, not only the active one", () => {
    // The moment to know which of these is a fixture is BEFORE pressing it.
    expect(SCOPE.replace(/\s+/g, " ")).toContain("w.is_sample ? <SampleTag /> : null");
  });
});

describe("the banner says what to do about it", () => {
  it("is mounted in the shell, on the sample and only on the sample", () => {
    expect(FRAME.replace(/\s+/g, " ")).toContain("activeWorkspace?.is_sample ? ( <SampleBanner");
  });

  it("names the workspace it sends you back to", () => {
    // "Go back" would be the same omission in a shorter sentence.
    expect(BANNER).toContain("Back to {ownWorkspaceName}");
    expect(FRAME.replace(/\s+/g, " ")).toContain(
      "ownWorkspaceName={firstOwnWorkspace?.name ?? null}",
    );
  });

  it("drops the return control when there is nowhere to return to", () => {
    // The door is offered ON an empty desk, so plenty of accounts hold only
    // the sample. A control pointing nowhere is worse than no control.
    expect(BANNER.replace(/\s+/g, " ")).toContain("onReturn && ownWorkspaceName ?");
    expect(FRAME.replace(/\s+/g, " ")).toContain("firstOwnWorkspace ? () => setActiveWorkspaceId");
  });

  it("is a status and not an alarm, because being here is a normal choice", () => {
    expect(BANNER).toContain('role="status"');
    expect(BANNER).not.toContain('role="alert"');
    // No failure colouring: it would tell a person they had done something wrong.
    expect(BANNER).not.toContain("text-mrd-fail");
  });

  it("cannot be dismissed in a way that loses the fact", () => {
    // Dismissing hides the sentence for the session. The tag in the switcher
    // is permanent and has no dismiss path at all, which is the division of
    // labour between them.
    expect(BANNER).toContain("setDismissed");
    expect(MARKS.slice(MARKS.indexOf("export function SampleTag"))).not.toContain("dismiss");
  });
});

describe("the door describes what pressing it actually does", () => {
  it("says it is a move rather than a preview", () => {
    const flat = DISCOVER.replace(/\s+/g, " ");
    expect(flat).toContain("The sample is a move, not a preview");
    // The old sentence read as a window onto a workspace standing beside
    // yours. `setActiveWorkspaceId` persists the choice; it is a relocation.
    expect(flat).not.toContain("The sample opens a separate Explore workspace");
  });

  it("does not promise the rows are labelled, because they are not", () => {
    // 2,144 seeded rows carry is_sample = false. The migration fixes future
    // seeds only, so a labelling promise would be false for anyone reading it
    // today.
    expect(DISCOVER).not.toContain("labelled example data");
    expect(DISCOVER.replace(/\s+/g, " ")).toContain("Nothing inside it is marked as an example");
  });

  it("names the way back", () => {
    expect(DISCOVER.replace(/\s+/g, " ")).toContain("Pick your own workspace there to come back");
  });

  it("uses a verb that matches the event", () => {
    const flat = DISCOVER.replace(/\s+/g, " ");
    expect(flat).toContain("Switch to the sample");
    expect(flat).not.toContain("Explore a sample workspace");
  });

  it("does not tell a person they were moved when the switch failed", () => {
    // The switch happens only in onSuccess, so on the error branch they are
    // still in their own workspace.
    expect(DISCOVER.replace(/\s+/g, " ")).toContain("did not open, so you are still in your own");
  });
});
