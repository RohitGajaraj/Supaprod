import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A COLUMN DEFAULT IS A GUESS ABOUT THE WRITER, NEVER ABOUT THE ROW.
 *
 * THE DEFECT, found 2026-08-06 and measured on the live database.
 * `promoteThemeToOpportunity` builds an opportunity out of a theme -- its
 * title, its problem, its impact and its confidence are all read off it -- and
 * carefully carried the theme's `project_id` and `product_id`, with a comment
 * above them about having learned that lesson once already. It never carried
 * `workspace_id`.
 *
 * Omitting the column did not leave it blank. `opportunities.workspace_id` is
 * NOT NULL with a default of `current_user_default_workspace()`, so it filled
 * silently with the PROMOTER'S DEFAULT workspace. A person who belongs to more
 * than one, standing in workspace B and promoting one of B's themes, created
 * the bet in workspace A -- their oldest membership, where the evidence the bet
 * is made of does not exist.
 *
 * Measured: 2 of 86 promoted opportunities were sitting apart from their own
 * theme. Those rows are deliberately not moved -- see the comment at the insert
 * for why a partial re-home is worse than the original defect -- so this guard
 * protects the thing that actually changed: the write.
 *
 * NOTHING COULD SEE IT. Every type checked, because the column is optional to
 * the client. The insert succeeded, because the default satisfied NOT NULL. The
 * row appeared, because the promoter could read their own default workspace.
 * The only way to notice is to compare two rows that no single query joined.
 */

const SRC = join(import.meta.dir, "..");
const discovery = readFileSync(join(SRC, "discovery.functions.ts"), "utf8");

/** The body of `promoteThemeToOpportunity`, so a match somewhere else in a
 *  1,000-line file cannot stand in for the one insert under test. */
function promoteBody(): string {
  const start = discovery.indexOf("export const promoteThemeToOpportunity");
  expect(start).toBeGreaterThan(-1);
  const next = discovery.indexOf("\nexport const ", start + 10);
  return discovery.slice(start, next === -1 ? undefined : next);
}

describe("a promoted bet lands in the workspace its evidence lives in", () => {
  it("passes the theme's workspace explicitly rather than letting the default guess", () => {
    const body = promoteBody();
    expect(body).toContain("workspace_id: theme.workspace_id");
  });

  it("carries every scope the theme has, not two of the three", () => {
    // project_id and product_id were already carried; workspace_id was the one
    // that was missed, and it is the one that crosses a tenant boundary rather
    // than a list boundary.
    const body = promoteBody();
    for (const field of ["project_id: theme.project_id", "product_id: theme.product_id"]) {
      expect(body).toContain(field);
    }
  });

  it("sets the scope on the insert itself, not after the fact", () => {
    // A follow-up UPDATE would leave a window in which the row exists in the
    // wrong tenant, and any trigger or realtime subscriber firing on INSERT
    // would already have seen it there.
    const body = promoteBody();
    const insertAt = body.indexOf('.from("opportunities")');
    const scopeAt = body.indexOf("workspace_id: theme.workspace_id");
    // `.select(` alone, not the literal `.select()`: P-35 (A-QUEUE.md) gave
    // this call a real column list instead of a bare select, so the select
    // this test needs to land AFTER the scope now takes an argument.
    const selectAt = body.indexOf(".select(", insertAt);
    expect(insertAt).toBeGreaterThan(-1);
    expect(scopeAt).toBeGreaterThan(insertAt);
    expect(scopeAt).toBeLessThan(selectAt);
  });
});
