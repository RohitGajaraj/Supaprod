/**
 * A FIX THAT CHANGES NOTHING IS A REVERT — F-153 and F-154, 2026-08-31.
 *
 * Two CI repair runs were dispatched against PRs #2 and #3. Both did what they
 * were asked, reported `completed` with `failure_kind` null, and summarised a
 * fix as "restoring syntactic validity". Neither had fixed anything: each staged
 * a file byte-identical to its `base_content`, so committing would have written
 * the pristine file over the changeset's own work and turned CI green because
 * the change was undone rather than the bug fixed.
 *
 * Two defects, and both are covered here because either alone lets it happen:
 *
 *   F-153 — the CAUSE. Both `repo.read` calls carried no `ref`, so both read the
 *   default branch, where the code compiles. F-54 had already ruled that a
 *   station on a branch must pass `ref`, and wrote that sentence into exactly
 *   one brief (Build's, gated `station === "build"`). The CI fix brief puts an
 *   agent in front of the same branch and never heard it — while PRINTING the
 *   branch name ten lines above the instruction that needed it.
 *
 *   F-154 — the CLASS. A commit whose staged content equals what the change
 *   started from is refused, whatever caused it. This is what makes it safe to
 *   stop relying on the approval gate that had only ever blocked this by
 *   accident (F-152), and it is SESSION-0 §1's self-check at the seam that
 *   commits.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { readOnBranchInstruction } from "./repo-ref-brief";
import { stagedRevertPaths, revertRefusalMessage } from "./studio-staged-revert";

describe("F-154 · a staged file identical to where it started is an undo", () => {
  it("names the path whose staged content equals its base", () => {
    expect(
      stagedRevertPaths([
        { path: "src/checkout/AddressStep.tsx", base_content: "same", new_content: "same" },
      ]),
    ).toEqual(["src/checkout/AddressStep.tsx"]);
  });

  it("says nothing about a real fix", () => {
    expect(
      stagedRevertPaths([{ path: "a.ts", base_content: "before", new_content: "after" }]),
    ).toEqual([]);
  });

  it("A FILE THIS CHANGE CREATED IS NOT A REVERT, and null is not a value to compare", () => {
    /*
     * `base_content` is null for a path the changeset added. There is no
     * "before" for it to be identical to, and treating null == null as equality
     * would refuse every commit that adds a file — which is most of them.
     */
    expect(stagedRevertPaths([{ path: "new.ts", base_content: null, new_content: null }])).toEqual(
      [],
    );
    expect(
      stagedRevertPaths([{ path: "new.ts", base_content: null, new_content: "content" }]),
    ).toEqual([]);
  });

  it("catches the mixed case, which is the dangerous one", () => {
    /*
     * The real changeset shape on 2026-08-31: one path genuinely changed, one
     * staged back to base. Committing the pair looks like progress and undoes
     * work, so the commit is refused whole rather than partly applied.
     */
    expect(
      stagedRevertPaths([
        { path: "real-fix.ts", base_content: "before", new_content: "after" },
        {
          path: "src/checkout/checkout.test.ts",
          base_content: "pristine",
          new_content: "pristine",
        },
        { path: "added.ts", base_content: null, new_content: "brand new" },
      ]),
    ).toEqual(["src/checkout/checkout.test.ts"]);
  });

  it("a missing or empty stage is not a revert", () => {
    expect(stagedRevertPaths(null)).toEqual([]);
    expect(stagedRevertPaths(undefined)).toEqual([]);
    expect(stagedRevertPaths([])).toEqual([]);
  });

  it("THE REFUSAL TELLS THE AGENT THE ONE THING IT CANNOT SEE", () => {
    /*
     * From where the agent stands, "I read the file and it was fine" is a TRUE
     * sentence — about the wrong branch. A refusal that only said "identical"
     * would send it back to stage the same thing again, so the message names the
     * branch confusion and the remedy.
     */
    const msg = revertRefusalMessage(["src/checkout/AddressStep.tsx"]);
    expect(msg).toContain("src/checkout/AddressStep.tsx");
    expect(msg).toContain("BRANCH");
    expect(msg).toContain("ref");
    expect(msg).toContain("the staged file is");
  });

  it("and it reads correctly for more than one path", () => {
    expect(revertRefusalMessage(["a.ts", "b.ts"])).toContain("these staged files are");
  });
});

describe("F-153 · the sentence that says which copy of the project to read", () => {
  it("names the branch and the three tools that take a ref", () => {
    const s = readOnBranchInstruction("studio/ffc8c482-102b4c9107f8");
    expect(s).toContain("studio/ffc8c482-102b4c9107f8");
    expect(s).toContain('ref: "studio/ffc8c482-102b4c9107f8"');
    for (const tool of ["repo.tree", "repo.read", "repo.search"]) expect(s).toContain(tool);
  });

  it("says nothing when there is no branch to name", () => {
    expect(readOnBranchInstruction(null)).toBe("");
    expect(readOnBranchInstruction(undefined)).toBe("");
    expect(readOnBranchInstruction("")).toBe("");
  });
});

describe("F-153 · and BOTH briefs carry it, which is the whole point", () => {
  /*
   * The defect was not that the sentence was wrong. It was that it existed in
   * one brief and not the other, so this asserts the shape rather than the
   * wording: each site IMPORTS the one sentence. A third brief that forgets is
   * then a missing import, which a reader can see.
   */
  const read = (rel: string) =>
    readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8").replace(/\s+/g, " ");

  it("the Build station brief imports it rather than spelling it out", () => {
    const src = read("./spine/driver.ts");
    expect(src).toContain("readOnBranchInstruction");
    expect(src).not.toContain("not on the default branch. Pass");
  });

  it("THE CI FIX BRIEF IMPORTS IT TOO, which it never did before F-153", () => {
    const src = read("../routes/api/public/hooks/ci-poll-tick.ts");
    expect(src).toContain("readOnBranchInstruction(cs.branch)");
  });

  it("and the fix brief warns against staging a file back unchanged", () => {
    const src = read("../routes/api/public/hooks/ci-poll-tick.ts");
    expect(src).toContain("is not a fix");
  });
});
