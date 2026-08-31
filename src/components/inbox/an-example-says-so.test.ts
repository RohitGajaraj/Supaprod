import { describe, it, expect } from "bun:test";
import { provenanceOf, exampleNote, exampleTally, type WorkspaceFlag } from "./an-example-says-so";

const real: WorkspaceFlag = { id: "w-real", is_sample: false };
const sample: WorkspaceFlag = { id: "w-sample", is_sample: true };
/** The column arrived after the read schema did; `use-workspace.tsx:21` types it optional. */
const preMigration: WorkspaceFlag = { id: "w-old" };
const both = [real, sample, preMigration];

describe("where a due forecast came from", () => {
  it("marks a row on a sample workspace as an example", () => {
    expect(provenanceOf("w-sample", both)).toBe("example");
  });

  it("marks a row on a real workspace as real", () => {
    expect(provenanceOf("w-real", both)).toBe("real");
  });

  it("reads an absent flag as real, not as unknown", () => {
    /*
     * `is_sample` is optional on `Workspace` because the workspaces query
     * selects "*" and the column arrived with a migration. Absent means the
     * read schema predates it, which is every workspace before the flag
     * existed, and none of those is a fixture. Treating absence as unknown
     * would put a "we cannot tell" on the whole product for one deploy.
     */
    expect(provenanceOf("w-old", both)).toBe("real");
  });

  it("refuses to classify a workspace this caller is not in", () => {
    /*
     * `listDueForecasts` is cross-workspace by design. A row whose workspace is
     * not in the caller's list cannot be classified, and the important half is
     * that it is NOT called real: "real" is the claim on trial, and drawing an
     * unproven one is the defect S4-166 found.
     */
    expect(provenanceOf("w-elsewhere", both)).toBe("unknown");
    expect(provenanceOf(null, both)).toBe("unknown");
    expect(provenanceOf(undefined, both)).toBe("unknown");
    expect(provenanceOf("w-real", [])).toBe("unknown");
  });

  it("says nothing at all for real and for unknown", () => {
    // Mislabelling a genuine forecast as fiction is the worse of the two
    // errors, so silence is the answer wherever we cannot prove "example".
    expect(exampleNote("real")).toBeNull();
    expect(exampleNote("unknown")).toBeNull();
    expect(exampleNote("example")).toBe("an example, not your product");
  });
});

describe("the line above the group", () => {
  it("says nothing when nothing on screen is an example", () => {
    expect(exampleTally(["real", "real"]).line).toBeNull();
    expect(exampleTally([]).line).toBeNull();
    // Unknown is not an example and must not be counted as one.
    expect(exampleTally(["real", "unknown"]).line).toBeNull();
  });

  it("names the whole-desk case, which is what six of seven accounts see", () => {
    /*
     * The case S4-166 actually found. A per-row mark alone leaves this reading
     * as a full desk of real work until you check every row, and it is the
     * commonest state in the product.
     */
    expect(exampleTally(["example", "example", "example"]).line).toBe(
      "Every call here is an example that came with your workspace, not your product.",
    );
    expect(exampleTally(["example"]).line).toBe(
      "The one call here is an example that came with your workspace, not your product.",
    );
  });

  it("counts rather than generalises when the desk is mixed", () => {
    // 2 of 16 accounts belong to both a sample and a real workspace, and this
    // read is cross-workspace, so a mixed desk is a real state, not a spare
    // branch. It reports both numbers rather than rounding to "some".
    const t = exampleTally(["example", "real", "example", "unknown"]);
    expect(t.examples).toBe(2);
    expect(t.total).toBe(4);
    expect(t.line).toBe(
      "2 of these 4 came with your workspace as examples, not from your product.",
    );
  });
});
