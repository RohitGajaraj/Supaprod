/**
 * The export handed a customer the verdict and not the forecast it graded.
 *
 * `exportWorkspace` shipped for months reading eight tables:
 *
 *   grep -o 'from("[a-z_]*")' over the handler
 *   -- agent_memory · learnings · opportunities · prds · projects
 *      signals · tasks · workspace_members
 *
 * **`learnings` was there and `decisions` was not.** A learning is a verdict on
 * a forecast, and every `forecast_*` column lives on `decisions` — eleven of
 * them, and nowhere else. So a person taking their own data out received the
 * grade and not the prediction, and **could not reconstruct "what did we expect,
 * and what actually happened"**, which is the one question this product exists
 * to answer.
 *
 * The WORK was missing too: no `spine_tracks`, so nothing said which piece of
 * work the artifacts belonged to, and no `spine_track_members`, so nothing said
 * which station produced what or in what order.
 *
 * `security.tsx:116` and `privacy.tsx:83` both promise export in open formats.
 * **Both claims were true.** The promise was kept and the contents were not,
 * which is the harder kind of gap to notice — checked before this was written,
 * because the first suspicion was that Settings had no export at all and that
 * would have been the wrong finding.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

const SRC = readFileSync(
  fileURLToPath(new URL("./projects.functions.ts", import.meta.url)),
  "utf8",
);
/**
 * The handler alone. The end anchor is searched FROM the start index because
 * "U6-AUDIT" also appears a hundred lines earlier, and anchoring on its first
 * occurrence silently produced an empty slice that passed one assertion and
 * failed nine — a reminder that a source-reading test can be wrong about WHERE
 * it is looking as easily as about what it finds.
 */
const FN_START = SRC.indexOf("export const exportWorkspace");
const FN = SRC.slice(FN_START, SRC.indexOf("U6-AUDIT", FN_START));

describe("the decision record is in the export", () => {
  it("reads decisions", () => {
    expect(FN).toContain('from("decisions")');
  });

  /**
   * THE PAIR IS THE POINT. Either both travel or the export answers half a
   * question, and half of this particular question is worse than none: a verdict
   * with no prediction reads as a fact rather than as a grade.
   */
  it("never ships learnings without decisions", () => {
    const hasLearnings = FN.includes('from("learnings")');
    const hasDecisions = FN.includes('from("decisions")');
    expect(hasLearnings).toBe(hasDecisions);
  });

  it("returns them on the payload and counts them", () => {
    expect(FN).toContain('decisions: want("decisions") ? dec : []');
    expect(FN).toContain('if (want("decisions")) counts.decisions = dec.length');
  });
});

describe("the work travels with the artifacts", () => {
  it("reads the track and its members", () => {
    expect(FN).toContain('from("spine_tracks")');
    expect(FN).toContain('from("spine_track_members")');
  });

  /**
   * `spine_track_members` has no `workspace_id` of its own, so it is fetched by
   * the track ids already resolved. Scoping it by a column it does not have
   * would typecheck and throw.
   */
  it("keys members off the resolved track ids rather than a workspace column", () => {
    expect(FN).toContain('.in("track_id", trackIds)');
    expect(FN).not.toContain('from("spine_track_members").select("*").eq("workspace_id"');
  });

  it("skips the member read entirely when there are no tracks", () => {
    expect(FN).toContain("trackIds.length");
  });

  it("carries the rest of the chain", () => {
    for (const t of ["themes", "prototypes", "studio_changesets", "deployments"]) {
      expect(FN).toContain(`from("${t}")`);
    }
  });
});

describe("a newer table must not empty an older export", () => {
  /**
   * The original reads throw on error, and those tables are load-bearing and
   * older than the spine. These are newer. **A person asking for their data
   * during a migration window should get everything that exists**, not a
   * failure, so each of the new reads falls back to `[]` and the count reports
   * what actually came back rather than what was asked for.
   */
  it("falls back to empty rather than throwing on the new reads", () => {
    for (const v of ["decisions.data ?? []", "tracks.data ?? []", "themes.data ?? []"]) {
      expect(FN).toContain(v);
    }
  });

  it("still throws on the reads that were always load-bearing", () => {
    expect(FN).toContain("if (ownErr) throw new Error(ownErr.message)");
  });
});

describe("the empty-workspace answer stays a complete shape", () => {
  /**
   * A caller with no workspace gets every key, empty. Returning a partial object
   * would make "no workspace" and "this table is missing" indistinguishable to
   * whatever reads the file.
   */
  it("returns every section even when there is no workspace", () => {
    const empty = FN.slice(
      FN.indexOf("if (!workspaceId)"),
      FN.indexOf("const { data: projectRows"),
    );
    for (const k of ["decisions: []", "tracks: []", "track_members: []", "deployments: []"]) {
      expect(empty).toContain(k);
    }
  });
});
