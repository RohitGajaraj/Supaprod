/**
 * P-25 follow-up (A1, live on `supaprod.ai`, 2026-09-03): the empty-search
 * line named five kinds while the search returns six groups -- "Findings and
 * themes" was searched and not named, because the sentence was written as a
 * literal string rather than built from the group list. A1's own fix
 * direction: "build the sentence from the group list rather than a string."
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { NOTHING_NAMED_THAT } from "./FindAnything";
import { GROUP_LABEL } from "@/lib/spine/find-anything";

describe("the empty-search line names every group findAnything actually searches", () => {
  it("mentions all six group labels, not a hand-picked subset", () => {
    for (const label of Object.values(GROUP_LABEL)) {
      expect(NOTHING_NAMED_THAT.toLowerCase()).toContain(label.toLowerCase());
    }
  });

  it("reads as one sentence, not a bare comma dump", () => {
    expect(NOTHING_NAMED_THAT.startsWith("Nothing named that.")).toBe(true);
    expect(NOTHING_NAMED_THAT).toContain(" and ");
    expect(NOTHING_NAMED_THAT.endsWith("are searched.")).toBe(true);
  });
});

/**
 * P-64b: EVERY GROUP TAKES THE WORKSPACE IT STANDS IN, NOT EVERY WORKSPACE.
 *
 * Read live 05:51 IST 09-04, from the probe workspace: "address" returned
 * the probe's own two runs beside Helio Labs' runs, decisions and
 * prototypes. P-64 had scoped `conversations` (P-67's own guard caught that
 * one while it was being built); the five older groups still leaked, and so
 * did the new `people` group -- the same class of defect on six surfaces
 * instead of one.
 *
 * Source-text, not a live DB read: `findAnything`'s handler is one function
 * in `track.functions.ts`, so this checks that each group's query chain
 * carries `workspace_id` somewhere in its own block, the same coarse
 * per-block scan `a-read-names-its-workspace.test.ts` already uses for the
 * repo-wide version of this rule. `doors` (pure, no I/O -- PRIMARY_NAV
 * filtered in memory) and `sources` (`sync_mappings` has no `workspace_id`
 * column at all; it is user-scoped, checked against the live schema) are
 * the two groups this cannot apply to, and each says why rather than being
 * silently skipped.
 */
describe("every Find Anything group takes the active workspace", () => {
  const SRC = readFileSync("src/lib/spine/track.functions.ts", "utf8");

  /**
   * Which SOURCE BLOCK actually decides each group's scoping, found by
   * reading the handler rather than assumed: `prd`, `decision`, `prototype`,
   * `changeset`, `signal` and `theme` all route through the ONE
   * `searchArtifactTable` helper (checking `workspace_id` once there covers
   * all six, and is the honest reflection of the code -- a per-call-site
   * check would either miss it or duplicate a check that lives one level
   * up). `findings` is signal+theme merged client-side, no query of its
   * own. `runs` and `people` each have a distinct block; `conversations`
   * spans two (`conversations` and `messages`), both checked.
   */
  const BLOCK_MARKER: Partial<Record<string, string>> = {
    prd: "const searchArtifactTable = async (",
    decision: "const searchArtifactTable = async (",
    prototype: "const searchArtifactTable = async (",
    changeset: "const searchArtifactTable = async (",
    runs: 'let q = supabase.from("spine_tracks")',
    people: "const searchPeople = async (",
    conversations: "const searchConversations = async (",
  };

  const NOT_WORKSPACE_SCOPED: Record<string, string> = {
    doors: "Pure, no I/O -- PRIMARY_NAV filtered in memory by searchDoors, no table to scope.",
    sources: "sync_mappings has no workspace_id column; it is scoped by user_id instead.",
    findings: "signal + theme merged client-side, not a query of its own -- see signal/theme.",
  };

  it("finds findAnything's own handler at all, so a moved function cannot pass vacuously", () => {
    expect(SRC).toContain("export const findAnything = createServerFn(");
  });

  it("searchArtifactTable itself (prd/decision/prototype/changeset/signal/theme) filters on workspace_id", () => {
    const at = SRC.indexOf("const searchArtifactTable = async (");
    expect(at).toBeGreaterThan(-1);
    const end = SRC.indexOf("\n    };", at);
    expect(SRC.slice(at, end === -1 ? at + 800 : end)).toContain("workspace_id");
  });

  it("the runs read (spine_tracks) filters on workspace_id", () => {
    const at = SRC.indexOf('let q = supabase.from("spine_tracks")');
    expect(at).toBeGreaterThan(-1);
    expect(SRC.slice(at, at + 300)).toContain("workspace_id");
  });

  it("searchPeople filters on workspace_id, not a fan-out across every membership", () => {
    const at = SRC.indexOf("const searchPeople = async (");
    expect(at).toBeGreaterThan(-1);
    const end = SRC.indexOf("\n    };", at);
    const block = SRC.slice(at, end === -1 ? at + 1200 : end);
    expect(block).toContain("workspace_id");
    // The P-64b defect this replaced: a Promise.all fan-out over every
    // workspace the caller belongs to, not just the one on screen.
    expect(block).not.toContain("workspaceIds.map");
  });

  it("searchConversations filters both conversations and messages on workspace_id", () => {
    const at = SRC.indexOf("const searchConversations = async (");
    expect(at).toBeGreaterThan(-1);
    const end = SRC.indexOf("\n    };", at);
    const block = SRC.slice(at, end === -1 ? at + 2500 : end);
    expect(block.match(/workspace_id/g)?.length ?? 0).toBeGreaterThanOrEqual(2);
    // Replaced by P-64b: current_user_default_workspace can name a
    // different workspace than the one the search was run from. Comments
    // are allowed to explain that history; only CODE reaching for the RPC
    // again is the regression this checks for.
    const code = block.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(code).not.toContain("current_user_default_workspace");
  });

  for (const group of Object.keys(GROUP_LABEL)) {
    if (!(group in NOT_WORKSPACE_SCOPED)) continue;
    it(`${GROUP_LABEL[group as keyof typeof GROUP_LABEL]} (${group}): not workspace-scoped, and says why`, () => {
      expect(NOT_WORKSPACE_SCOPED[group]!.length).toBeGreaterThan(20);
    });
  }

  it("accounts for every group findAnything actually has -- scoped, exempt, or nothing slips through", () => {
    const accounted = new Set([...Object.keys(BLOCK_MARKER), ...Object.keys(NOT_WORKSPACE_SCOPED)]);
    for (const group of Object.keys(GROUP_LABEL)) {
      expect(
        accounted.has(group),
        `${group} is neither scoped-and-checked nor a stated exception`,
      ).toBe(true);
    }
  });
});
