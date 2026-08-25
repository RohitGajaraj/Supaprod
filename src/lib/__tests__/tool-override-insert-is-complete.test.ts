import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * THE ONLY WRITER OF agent_tools MUST SUPPLY EVERY COLUMN THE ROW NEEDS.
 *
 * THE DEFECT THIS PREVENTS, found 2026-08-05 and verified against the live
 * database. `updateToolMode` upserted five columns:
 *
 *     { user_id, tool_name, built_in, enabled, mode }
 *
 * `agent_tools.display_name` and `.description` are both NOT NULL with NO
 * DEFAULT, and `workspace_id` is required by the role-aware write policy
 * (`can_manage_workspace(workspace_id)`, which returns FALSE for null).
 *
 * It went unnoticed because it was latent for two months: while every account
 * carried a seeded row for every tool, the upsert always took the UPDATE branch,
 * where missing columns are simply not written. Migration 20260801234500 then
 * deleted all 864 seeded rows and moved to a pure override model, in which a row
 * exists ONLY as a deviation. Live count afterwards: 7 rows across 2 users,
 * against ~55 tools in TOOL_REGISTRY. From that moment the first move of any
 * tool's boundary took the INSERT branch and died on a not-null violation, and
 * /boundary printed the raw Postgres text into its receipt.
 *
 * NOTHING COULD SEE IT. The write goes through an untyped SupabaseClient, so the
 * generated Insert type — which correctly marks both columns as required — never
 * constrains it. No test inserted a fresh override for a tool with no row, which
 * is the only case that fails.
 *
 * This is a source scan rather than a unit test because `updateToolMode` is a
 * createServerFn wrapping middleware, and the thing worth pinning is the SHAPE
 * of the row it writes.
 */

const SRC = join(import.meta.dir, "..", "..");
const source = readFileSync(join(SRC, "lib", "agent_loop.functions.ts"), "utf8");

/** Comments discuss the missing columns at length; strip before scanning. */
const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/** The upsert call, flattened so one regex can read a multi-line object. */
const upsert = (() => {
  const at = code.indexOf('.from("agent_tools")');
  expect(at).toBeGreaterThan(-1);
  return code.slice(at, at + 1200).replace(/\s+/g, " ");
})();

describe("updateToolMode writes a complete agent_tools row", () => {
  /**
   * Every column that is NOT NULL with no default, plus workspace_id, which the
   * RLS policy requires. Verified against the live schema on 2026-08-05; the
   * columns that DO carry defaults (category, mode, enabled, config, built_in,
   * created_at, updated_at, id) are deliberately absent from this list.
   */
  for (const column of ["user_id", "tool_name", "display_name", "description", "workspace_id"]) {
    it(`supplies ${column}, which the row cannot be inserted without`, () => {
      expect(upsert).toContain(`${column}:`);
    });
  }

  it("selects after writing, so an RLS refusal is not reported as success", () => {
    // A write refused by RLS RESOLVES rather than throwing. Without .select()
    // the caller gets ok:true having changed nothing, and the screen reports a
    // boundary that did not move.
    expect(upsert).toMatch(/\.select\(/);
    expect(code).toMatch(/written\.length === 0|!written/);
  });

  it("asserts the role the policy enforces, so a refusal is a readable sentence", () => {
    expect(code).toMatch(/assertWorkspaceRole\(/);
    expect(code).toMatch(/GOVERNED_WRITES\.agent_tools/);
  });
});

describe("the boundary controls never print a raw database error to a person", () => {
  // SUBJECT MOVED 2026-08-25 (item 22 fold; retargeted by LANE 1 -- MAIN owns
  // this file): the governed writes left `_authenticated.boundary.tsx` for
  // `governance/BoundaryControls.tsx`, which the Safety room renders. The
  // property is unchanged: no raw Postgres text reaches a receipt.
  const boundary = readFileSync(join(SRC, "components", "governance", "BoundaryControls.tsx"), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

  it("routes every write failure through humanWriteError", () => {
    expect(boundary).toMatch(/import\s*\{[^}]*humanWriteError/);
    // `consequence: e.message` is the exact shape that leaked
    // `new row violates row-level security policy for table "agent_tools"`
    // into a receipt headed "The boundary did not move".
    expect(boundary).not.toMatch(/consequence:\s*e\.message/);
  });

  it("gives every governed mutation an onError, so no write fails in silence", () => {
    // setTrackCap shipped with no onError at all: a refused spend-ceiling write
    // produced no receipt and no change, leaving the previous success on screen.
    const mutations = boundary.match(/useMutation\(\{[\s\S]*?\n  \}\);/g) ?? [];
    expect(mutations.length).toBeGreaterThan(3);
    const silent = mutations.filter((m) => /mutationFn:/.test(m) && !/onError:/.test(m));
    expect(silent).toEqual([]);
  });
});
