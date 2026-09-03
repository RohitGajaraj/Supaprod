/**
 * ── A `RETURNING` IS A READ, AND RLS CHECKS IT SEPARATELY ─────────────────
 *
 * `createWorkspace` inserts a workspace and asks for the row back:
 *
 *   .from("workspaces").insert([...]).select().single()
 *
 * PostgREST turns that `.select()` into `RETURNING`, and PostgreSQL applies the
 * table's SELECT policy to the row it hands back. So an insert of this shape
 * needs BOTH an INSERT policy and a SELECT policy that the brand-new row
 * satisfies, and `workspaces` had neither.
 *
 * The first fix (20260907010000) added only the INSERT policy. Probed against
 * production the statement still failed with the same 42501, and the message
 * still said the new row violated a policy -- while pointing at the insert,
 * which by then was allowed. The read was the half that failed:
 *
 *   "ws members read"  using (is_workspace_member(id))
 *
 * is false for a workspace whose membership row has not been written yet, and
 * it cannot have been: it references the workspace being inserted.
 * 20260908010000 adds `ws owner reads own`, and an owner reading the workspace
 * they own is correct on its own terms.
 *
 * ── WHAT THIS GUARD HOLDS, AND WHAT IT CANNOT ─────────────────────────────
 * Policies live in the database, so a unit test cannot execute them; both were
 * applied and verified against `pg_policy` and probed end to end in a rolled
 * back transaction. What a test CAN hold is that the three pieces stay
 * together, because each is separately deletable and any one of them going
 * missing puts the wall straight back:
 *
 *   the INSERT policy migration, the SELECT policy migration, and the fact
 *   that `createWorkspace` reads the row back at all.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";

const MIGRATIONS = readdirSync("supabase/migrations");
const SRC = readFileSync("src/lib/workspaces.functions.ts", "utf8");

/** `createWorkspace` only, so a match in another function cannot stand in. */
const CREATE = SRC.slice(
  SRC.indexOf("export const createWorkspace"),
  SRC.indexOf("export const renameWorkspace"),
);

describe("a person can make a second workspace", () => {
  it("keeps the INSERT policy migration", () => {
    const file = MIGRATIONS.find((f) => f.startsWith("20260907010000"));
    expect(file).toBeDefined();
    const sql = readFileSync(`supabase/migrations/${file}`, "utf8");
    expect(sql).toContain("ws owner creates own");
    expect(sql.replace(/\s+/g, " ")).toContain("owner_id = auth.uid()");
  });

  it("keeps the SELECT policy migration, which the RETURNING needs", () => {
    const file = MIGRATIONS.find((f) => f.startsWith("20260908010000"));
    expect(file).toBeDefined();
    const sql = readFileSync(`supabase/migrations/${file}`, "utf8");
    expect(sql).toContain("ws owner reads own");
    expect(sql.replace(/\s+/g, " ")).toContain("for select");
  });

  it("still reads the row back, which is why the SELECT policy is load-bearing", () => {
    /*
     * If this ever becomes a bare insert, the SELECT policy stops being needed
     * BY THIS PATH -- and the next person to read the migration would find a
     * policy with no visible reason and be tempted to drop it. Kept as an
     * assertion so the coupling is written down rather than remembered.
     */
    expect(CREATE.replace(/\s+/g, " ")).toContain(".insert(");
    expect(CREATE.replace(/\s+/g, " ")).toMatch(/\.select\([^)]*\)\s*\.single\(\)/);
  });

  it("writes the owner's membership row, without which the workspace is unreadable to anyone else's path", () => {
    // The workspace is readable by its owner through the new SELECT policy.
    // Every OTHER surface reads through `is_workspace_member`, so the
    // membership row is what makes it a workspace rather than an orphan.
    const flat = CREATE.replace(/\s+/g, " ");
    expect(flat).toContain('.from("workspace_members")');
    expect(flat).toContain('role: "owner"');
  });

  it("fails loudly when the membership row cannot be written", () => {
    // Fail-soft here would hand back a workspace that opens for its owner and
    // is invisible to every collaborator surface, with nothing said.
    expect(CREATE).toContain("memberError");
    expect(CREATE.replace(/\s+/g, " ")).toContain("The workspace was made but you were not added");
  });
});
