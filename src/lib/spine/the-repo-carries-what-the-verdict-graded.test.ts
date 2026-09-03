/**
 * P-21's SECOND HALF: THE FILES REACH THE REPO, AND ONE COMPOSER MAKES THEM.
 *
 * The claim P-21 exists to make good is that a team on Anthropic's AI-native
 * SDLC playbook can drop our output into their repo with no adapter. That is
 * only true if the files are (a) real bytes a person can take, and (b) the same
 * bytes in the pull request as on the screen.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { PLAYBOOK_FILES, playbookPath } from "@/lib/spine/playbook-files";

const COMPOSER = readFileSync("src/lib/spine/playbook-files.server.ts", "utf8");
const REGISTRY = readFileSync("src/lib/ai/tools/registry.server.ts", "utf8");
const PANEL = readFileSync("src/components/track/PlaybookFiles.tsx", "utf8");

describe("one composer, two readers", () => {
  it("the Plan tab and studio.stage call the same function", () => {
    /*
     * THE ASSERTION THAT MATTERS MOST HERE. Composed twice they drift, and the
     * drift is invisible in the worst way: the screen shows one `intent.md` and
     * the repo holds another, both plausible, with nothing to compare them
     * against until somebody does and cannot say which is real.
     */
    expect(REGISTRY).toContain("await playbookFilesForTrack(");
    const TRACK_FNS = readFileSync("src/lib/spine/track.functions.ts", "utf8");
    expect(TRACK_FNS).toContain("await playbookFilesForTrack(supabase, data.trackId, title)");
  });

  it("reads the contract through the same reader the Plan tab uses", () => {
    // So the "How we will know" section in the file and the one on screen cannot
    // disagree about what the spec's contract says.
    expect(COMPOSER).toContain("specContract(p.contract)");
  });

  it("takes the FIRST decision, not the newest", () => {
    /*
     * `intent.md` is the handoff that started the work. A revision recorded
     * later is a change to the same bet, and rendering the newest would make the
     * file describe a decision the work was not begun on.
     */
    const block = COMPOSER.slice(COMPOSER.indexOf('.from("decisions")'));
    expect(block).toContain('.order("created_at", { ascending: true })');
  });

  it("takes the plan's own order, which is what a reader works down", () => {
    const block = COMPOSER.slice(COMPOSER.indexOf('.from("tasks")'));
    expect(block).toContain('.order("seq", { ascending: true })');
  });

  it("fails soft into an empty section rather than throwing", () => {
    // A file saying "not recorded yet" under a heading is honest and useful; a
    // Plan tab that fails to render because a spec was deleted is neither.
    expect(COMPOSER).toContain("[playbook] could not read");
  });
});

describe("Build puts them in the pull request", () => {
  const stageBlock = REGISTRY.slice(
    REGISTRY.indexOf("THE RECORD THE VERDICT WAS GRADED AGAINST GOES IN THE REPO"),
    REGISTRY.indexOf("const patch: Record<string, unknown> = { updated_at:"),
  );

  it("stages all three under .supaprod/", () => {
    expect(stageBlock).toContain("for (const name of PLAYBOOK_FILES)");
    expect(stageBlock).toContain("path: playbookPath(name)");
    expect(playbookPath("intent.md")).toBe(".supaprod/intent.md");
  });

  it("re-stages on every stage, so an edited spec is not frozen at the branch's first commit", () => {
    expect(stageBlock).toContain('onConflict: "changeset_id,path"');
  });

  it("writes nothing when the record holds nothing", () => {
    // Three files of "not recorded yet" in a pull request is noise rather than a
    // record of anything.
    expect(stageBlock).toContain("if (book.anything)");
  });

  it("never fails the stage over a document", () => {
    /*
     * These files are a record OF the work, not the work. A track whose spec
     * cannot be read still has a real change to ship, and refusing the stage to
     * protect a document would stop the loop for the wrong reason.
     */
    expect(stageBlock).toContain("could not stage the playbook files:");
    expect(stageBlock).toContain("console.error");
  });

  it("stages at stage, not at commit, so one place decides what is in a changeset", () => {
    const commitAt = REGISTRY.indexOf('name: "studio.commit"');
    const stageAt = REGISTRY.indexOf("THE RECORD THE VERDICT WAS GRADED AGAINST GOES IN THE REPO");
    expect(stageAt).toBeGreaterThan(-1);
    expect(stageAt).toBeLessThan(commitAt);
  });
});

describe("a person can take them", () => {
  it("offers copy AND download, which are different actions", () => {
    /*
     * Copy is for pasting one file into a chat. Download is for dropping it into
     * a repo WITH ITS NAME, which is the whole claim — a file named wrongly is
     * not the playbook's shape any more.
     */
    expect(PANEL).toContain("<CopyButton");
    expect(PANEL).toContain("a.download = name;");
  });

  it("shows the raw bytes rather than a second rendering of the spec", () => {
    // The Plan tab already renders the spec as prose above this. What a person
    // needs from this block is the exact text.
    expect(PANEL).toContain("<pre");
    expect(PANEL).toContain("font-mrd-mono");
  });

  it("revokes the blob url, and uses one rather than a data uri", () => {
    // A spec body runs to tens of kilobytes, and a data URI that long is refused
    // by some browsers with no error the page can see.
    expect(PANEL).toContain("URL.createObjectURL");
    expect(PANEL).toContain("URL.revokeObjectURL(url)");
  });

  it("scrolls inside itself, so a long spec cannot push the tab sideways", () => {
    // The defect this surface has already been repaired for twice.
    expect(PANEL).toContain("overflow-auto");
    expect(PANEL).toContain("min-w-0");
  });

  it("draws nothing until there is something to draw", () => {
    // A read that has not answered is not an empty result, and three files of
    // "not recorded yet" tell a person the product failed.
    expect(PANEL).toContain("if (!q.data?.anything) return null;");
  });

  it("names all three, from the one list", () => {
    expect(PANEL).toContain("PLAYBOOK_FILES.map");
    expect(PLAYBOOK_FILES).toEqual(["intent.md", "spec.md", "plan.md"]);
  });
});
