import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  AUTOMATION_FLAGS,
  automationFlag,
  automationFlagColumns,
  needsSpendApproval,
} from "./workspace-automation";
import { setWorkspaceAutomationImpl } from "./workspace-automation.functions";

/**
 * THE GUARD THIS CLASS OF DEFECT NEEDED.
 *
 * `auto_derive_enabled` was read as a filter by two live cron jobs and written
 * by nothing, anywhere, for six weeks. Every existing test passed the whole
 * time, because each one asked "does this code do what it says" and none asked
 * "can this switch ever be flipped". Production on 2026-08-14: 21 workspaces,
 * 0 enabled, so calibration, brier scoring and the entire forecast audit had
 * never executed for a single workspace.
 *
 * The scan below reads the source tree the way the bug did: it finds every
 * `.eq("<something>_enabled", true)` filter against `workspaces` and demands
 * that the column be in the settable catalogue. A future gating flag with no
 * writer fails here instead of going quietly dark.
 */

const SRC = join(import.meta.dir, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === "__tests__") continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

describe("workspace automation flags", () => {
  test("every workspace flag used as a gate can actually be turned on", () => {
    /**
     * THE INVARIANT, stated as the bug would have to violate it: a column the
     * code branches on must be a column some code can write. Membership of this
     * module's catalogue is NOT the test -- that would flag the four healthy
     * flags that are set elsewhere and teach the next reader to widen the
     * catalogue rather than fix the gap. What matters is that a writer exists
     * somewhere.
     */
    const readFilter = /\.eq\(\s*["']([a-z_]*_enabled)["']\s*,\s*true\s*\)/g;
    const files = walk(SRC);
    const sources = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

    const gated = new Set<string>();
    for (const [file, text] of sources) {
      if (!text.includes('from("workspaces")')) continue;
      for (const m of text.matchAll(readFilter)) gated.add(m[1]);
    }
    // If this is empty the scan itself broke, and a green test would be a lie.
    expect(gated.size).toBeGreaterThan(0);

    const unwritable = [...gated].filter((column) => {
      if (automationFlagColumns.includes(column)) return false;
      const writer = new RegExp(`update\\(\\s*\\{[^}]*\\b${column}\\b`, "s");
      for (const text of sources.values()) if (writer.test(text)) return false;
      return true;
    });

    expect(unwritable).toEqual([]);
  });

  test("the catalogue covers the two flags that were already live", () => {
    expect(automationFlagColumns).toContain("auto_sense_enabled");
    expect(automationFlagColumns).toContain("auto_derive_enabled");
  });

  test("every flag says what goes dark when it is off", () => {
    for (const f of AUTOMATION_FLAGS) {
      expect(f.darkWhenOff.length).toBeGreaterThan(20);
      expect(f.label.length).toBeGreaterThan(0);
    }
  });

  /**
   * The spend classification is load bearing, not documentation. It is what lets
   * an automated caller arm sensing on its own and decline to arm grading, so a
   * wrong value here spends money without asking.
   */
  test("grading is marked as costing model calls and sensing is not", () => {
    expect(needsSpendApproval("auto_derive_enabled")).toBe(true);
    expect(needsSpendApproval("auto_sense_enabled")).toBe(false);
  });

  test("an unknown column is treated as spending, not as free", () => {
    // Fail safe: a flag nobody classified must not be armable by a batch caller.
    expect(needsSpendApproval("something_nobody_catalogued")).toBe(true);
    expect(automationFlag("something_nobody_catalogued")).toBeUndefined();
  });
});

describe("setWorkspaceAutomationImpl", () => {
  const okDb = (captured: { patch?: Record<string, unknown> }) =>
    ({
      from: () => ({
        update: (patch: Record<string, unknown>) => {
          captured.patch = patch;
          return {
            eq: () => ({ select: async () => ({ data: [{ id: "w1" }], error: null }) }),
          };
        },
      }),
    }) as never;

  test("refuses a column that is not an automation flag", async () => {
    const captured = {};
    await expect(
      setWorkspaceAutomationImpl(okDb(captured), {
        workspaceId: "w1",
        column: "is_sample",
        enabled: true,
      }),
    ).rejects.toThrow(/not a workspace automation flag/);
    // Nothing reached the query builder.
    expect(captured).toEqual({});
  });

  test("arming grading also clears the sweep clock so it runs on the next tick", async () => {
    const captured: { patch?: Record<string, unknown> } = {};
    await setWorkspaceAutomationImpl(okDb(captured), {
      workspaceId: "w1",
      column: "auto_derive_enabled",
      enabled: true,
    });
    expect(captured.patch).toEqual({ auto_derive_enabled: true, last_auto_derive_at: null });
  });

  test("disarming does not touch the clock", async () => {
    const captured: { patch?: Record<string, unknown> } = {};
    await setWorkspaceAutomationImpl(okDb(captured), {
      workspaceId: "w1",
      column: "auto_derive_enabled",
      enabled: false,
    });
    expect(captured.patch).toEqual({ auto_derive_enabled: false });
  });

  /**
   * The pin that matters most. supabase-js hands back `{data: [], error: null}`
   * for an RLS refusal, so the naive version of this function reports success to
   * a member who is not an owner and changes nothing. Proven by planting it:
   * remove the zero-row check and this test goes green on a lie.
   */
  test("a refused write is an error, not a silent success", async () => {
    const refusingDb = {
      from: () => ({
        update: () => ({
          eq: () => ({ select: async () => ({ data: [], error: null }) }),
        }),
      }),
    } as never;
    await expect(
      setWorkspaceAutomationImpl(refusingDb, {
        workspaceId: "w1",
        column: "auto_derive_enabled",
        enabled: true,
      }),
    ).rejects.toThrow(/owner or admin/);
  });
});
