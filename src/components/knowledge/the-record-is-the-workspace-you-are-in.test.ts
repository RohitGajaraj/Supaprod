/**
 * ── ONE PAGE MUST NOT COUNT TWO POPULATIONS ───────────────────────────────
 *
 * READ ON THE SERVED /outcomes, 2026-09-09, standing in "A1 delete probe".
 * The page said, in its largest type:
 *
 *   8 decisions are on the record, and nothing has come back yet.
 *
 * and six hundred pixels below, in the ledger on the same page:
 *
 *   57 of 75 decisions on this list carry a forecast, written before the
 *   outcome was known.
 *   Show 67 more
 *
 * MEASURED on the live database at 16:26 UTC: that workspace holds 8
 * decisions; the USER holds 75 across every workspace on the account. The
 * headline was right. The list was showing 67 rows from workspaces the reader
 * was not standing in, and no reader could make the two numbers agree.
 *
 * ── THE SERVER COULD ALWAYS SCOPE. NOBODY ASKED IT TO ─────────────────────
 * `readDecisions` has carried `if (data?.workspaceId) q = q.eq("workspace_id",
 * ...)` all along. Every other read on that route passes `activeWorkspaceId`;
 * `<DecisionsPanel />` is mounted with no props and is the only call site. An
 * omission, not a decision -- which is exactly the kind that survives review,
 * because the code that would be wrong is code nobody wrote.
 *
 * ── WHAT THESE PIN, IN TWO HALVES THAT NEED EACH OTHER ────────────────────
 * The first half drives the real read and shows the filter is a filter: given
 * a workspace it constrains the query, and given none it does NOT. That second
 * assertion is the one worth having, because it is the mechanism of the defect
 * rather than its symptom, and it says plainly that an unscoped call still
 * reads wide. Nothing here "fixes" that by making the parameter mandatory: the
 * agent-facing callers legitimately read across workspaces.
 *
 * The second half pins the caller, because the caller is the half that was
 * wrong.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readDecisions } from "@/lib/decisions.functions";
import { FakeWire, drive, eqValue, type Filter } from "@/__tests__/a-wire-that-counts-rounds";
import type { Database } from "@/integrations/supabase/types";

/** Records the filters the read applied to `decisions`, and answers nothing. */
function wireWatchingDecisions() {
  const seen: Filter[][] = [];
  const wire = new FakeWire((table, _cols, filters) => {
    if (table === "decisions") seen.push(filters);
    return [];
  });
  return { wire, seen };
}

describe("the read can be scoped, and says so both ways", () => {
  it("constrains to the workspace it is given", async () => {
    const { wire, seen } = wireWatchingDecisions();
    await drive(
      wire,
      readDecisions(wire as unknown as SupabaseClient<Database>, { workspaceId: "ws-1" }),
    );
    expect(seen.length).toBeGreaterThan(0);
    expect(eqValue(seen[0], "workspace_id")).toBe("ws-1");
  });

  it("reads across every workspace when it is given none, which is the defect's mechanism", async () => {
    // Not a bug in this function. It is why the CALLER has to pass one, and
    // why the guards below are about the caller.
    const { wire, seen } = wireWatchingDecisions();
    await drive(wire, readDecisions(wire as unknown as SupabaseClient<Database>, {}));
    expect(seen.length).toBeGreaterThan(0);
    expect(eqValue(seen[0], "workspace_id")).toBeUndefined();
  });
});

describe("the ledger on /outcomes asks for the workspace it is standing in", () => {
  const SRC = readFileSync(join(import.meta.dir, "DecisionsPanel.tsx"), "utf8");
  /* Comments only: stripping strings would erase the very literals below. */
  const code = SRC.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

  it("passes the active workspace into the read", () => {
    expect(code).toContain("const { activeWorkspaceId } = useWorkspace()");
    expect(code).toMatch(/workspaceId:\s*activeWorkspaceId\s*\?\?\s*undefined/);
  });

  it("waits rather than reading wide while the workspace is unknown", () => {
    /*
     * Without this the panel draws all 75 for a beat on every arrival and then
     * cuts to 8, which is the defect happening in miniature rather than fixed.
     */
    expect(code).toMatch(/enabled:\s*!!activeWorkspaceId/);
  });

  it("keys the cache on the workspace, so switching cannot serve the last one", () => {
    // `listInput` carries `workspaceId` and IS the key, so a switch is a new
    // key rather than a stale hit.
    const key = code.match(/queryKey:\s*\["decisions",\s*listInput\]/);
    expect(key, "the key moved; re-point this test").not.toBeNull();
    const input = code.match(/const listInput = \{[\s\S]*?\};/);
    expect(input, "listInput moved; re-point this test").not.toBeNull();
    expect(input![0]).toContain("workspaceId");
  });

  /*
   * THE MIRROR. Everything above would also pass if the panel simply stopped
   * reading. It must still be a ledger: the read is still made, and it is
   * still `listDecisions`.
   */
  it("still reads the ledger it is a ledger of", () => {
    expect(code).toContain("useServerFn(listDecisions)");
    expect(code).toContain("queryFn: () => fList({ data: listInput })");
  });
});
