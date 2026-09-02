/**
 * PROMOTE SHIPPED WHATEVER THE NEWEST PREVIEW ROW SAID, AND NEVER ASKED WHAT MERGED.
 *
 * ── THE DEFECT, IN ONE LINE OF THE OLD CODE ───────────────────────────────
 * `promoteChangesetToProductionCore` took the newest successful preview row for
 * the changeset and used its `commit_sha` verbatim as the production ref. There
 * was no comparison against the merged commit anywhere in the function.
 * `landedShaForChangeset` has read the PR's own `merge_commit_sha` since it was
 * written, and it was called only from the capture path.
 *
 * So a changeset whose preview was built at an earlier commit -- a fix pushed
 * after the preview, a branch synced, a second CI run that did not finish --
 * promoted THAT commit to production and recorded it as the released sha.
 * Nothing anywhere would have said otherwise. On the one path in this product
 * that is irreversible and that customers see.
 *
 * ── AND THE CHECK IS WHAT LETS ANY PROVIDER THROUGH ───────────────────────
 * `provider = "deno"` was a proxy for "we built it, so we know what is in it".
 * Being at the merged commit is the thing that proxy stood in for, and it is
 * strictly stronger: it is true of a preview whoever built it. That is why the
 * same change both tightens the safety property and widens what can ship.
 *
 * ── WHY THIS IS A SOURCE GUARD, SAID PLAINLY ──────────────────────────────
 * The function resolves a GitHub token, fetches a PR, and deploys. Driving it
 * end to end means mocking the network on the one path where a wrong mock is
 * worse than no test, and A1 checks the real thing against `deployments` and
 * `track_drives` after the run. What a unit test can hold is the SHAPE of the
 * decision: that the merged sha is read at all, that it filters the preview,
 * that a failed read does not quietly loosen the gate, and that the refusal
 * names both commits. Each of those is a line somebody could delete without
 * noticing, which is exactly what a guard is for.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(
  fileURLToPath(new URL("./deployments.functions.ts", import.meta.url)),
  "utf8",
);
const flat = SRC.replace(/\s+/g, " ");

/** The promote path only, so a match in the capture path cannot stand in for it. */
const PROMOTE = SRC.slice(
  SRC.indexOf("async function promoteChangesetToProductionCore"),
  SRC.indexOf("export const promoteChangesetToProduction"),
);
const promoteFlat = PROMOTE.replace(/\s+/g, " ");

describe("promote reads what actually merged", () => {
  it("calls landedShaForChangeset, which it never did", () => {
    /*
     * The function existed and was reachable only from capture. This assertion
     * is on the PROMOTE slice specifically, because a match anywhere in the file
     * would have passed before this change and proved nothing.
     */
    expect(promoteFlat).toContain("const landedSha = await landedShaForChangeset(db, userId, {");
  });

  it("selects pr_number, without which the merged commit cannot be read", () => {
    // The select is the reason it never checked: the column was not on the row.
    expect(promoteFlat).toContain("id,mission_id,workspace_id,product_id,prd_id,repo,pr_number,");
  });
});

describe("the preview has to be at that commit", () => {
  it("filters the preview by the merged sha when it knows it", () => {
    expect(promoteFlat).toContain('previewQuery.eq("commit_sha", landedSha)');
  });

  it("keeps the old provider gate when the commit cannot be read, and does not loosen", () => {
    /*
     * THE ONE THAT MATTERS MOST. `landedShaForChangeset` returns null on an
     * unreadable PR, a missing repo or PR number, or a GitHub refusal. In every
     * one of those we cannot prove what merged, so the provider gate stays
     * exactly as it was. Loosening on a failed read is how a safety check
     * becomes a formality, and it is the direction this file has been repaired
     * for before: "a failed read is not an answer about the customer's
     * pipeline".
     */
    expect(promoteFlat).toContain(': previewQuery.eq("provider", "deno")');
    expect(promoteFlat).toContain("landedSha ? previewQuery");
  });

  it("no longer hard-codes the provider as the only way in", () => {
    // Being at the merged commit is strictly stronger than being ours, so a
    // preview built by the customer's own pipeline at that commit may ship.
    expect([...promoteFlat.matchAll(/\.eq\("provider", "deno"\)/g)].length).toBe(1);
  });
});

describe("what it says when the preview is one commit behind", () => {
  it("names both commits, because 'a different commit' cannot be acted on", () => {
    expect(promoteFlat).toContain("The preview on file was built at");
    expect(promoteFlat).toContain("String(stale.commit_sha).slice(0, 7)");
    expect(promoteFlat).toContain("landedSha.slice(0, 7)");
  });

  it("checks that before the 'your own pipeline built it' sentence", () => {
    /*
     * Order is the correctness here. With the sha filter in place that older
     * sentence is reachable for a completely different reason -- a perfectly
     * good Supaprod preview sitting one commit behind -- and saying it would be
     * false and would send the person to promote somewhere with nothing to
     * promote.
     */
    expect(promoteFlat.indexOf("The preview on file was built at")).toBeLessThan(
      promoteFlat.indexOf("This preview was published by your own pipeline"),
    );
  });

  it("says nothing was published, because nothing was", () => {
    expect(promoteFlat).toContain("nothing was published");
  });
});

describe("what the change did not touch", () => {
  it("still refuses to promote a changeset that is not merged", () => {
    expect(promoteFlat).toContain("Only a merged changeset can promote. Merge the PR first.");
  });

  it("still rethrows a failed read rather than reading it as 'no rows'", () => {
    // Promote is the one irreversible path here, and a swallowed PostgREST
    // failure is indistinguishable from an empty result.
    expect(promoteFlat).toContain("if (denoErr) throw new Error(denoErr.message);");
  });

  it("still writes the production row at the preview's own commit", () => {
    // Which is now provably the merged one wherever the PR could be read.
    expect(flat).toContain("commit_sha: preview.commit_sha,");
  });
});
