/**
 * ── A SETTLED GATE STOPS CLAIMING A WAIT ─────────────────────────────────────
 *
 * Measured on production 2026-09-09 (Lane 2 found it, Lane 1 re-ran it): six
 * open tracks carried a `pending_gates` entry pointing at an `agent_approvals`
 * row that had settled weeks before, four expired unanswered, one cancelled,
 * one executed. Track `197769e8` on the founder's own workspace had been held
 * at `waiting-on-a-person` since 21 August over an approval that expired on
 * 27 August: the product was telling a person to answer a gate no surface
 * could ever show them, and no press could clear it.
 *
 * The prune exists and is correct (`harvestAnsweredGates`), but it only runs
 * inside a drive, and four of the six are held at `station-cannot-finish`,
 * which `track-tick` excludes as terminal by design. The hold hid the record
 * that said the hold was over. `repairStaleGates` is the pass that reaches
 * them: it harvests and prunes, drives nothing, and ends the one hold whose
 * claim a settled gate makes false.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const DRIVER = readFileSync("src/lib/spine/driver.server.ts", "utf8");
const SWEEP = readFileSync("src/routes/api/public/hooks/resume-runs.ts", "utf8");
const at = DRIVER.indexOf("export async function repairStaleGates");
const REPAIR = DRIVER.slice(at, DRIVER.indexOf("\nexport ", at + 1));

describe("a settled gate stops claiming a wait", () => {
  it("the repair reads open tracks that still point at a gate, bounded", () => {
    expect(at).toBeGreaterThan(-1);
    expect(REPAIR).toContain('.eq("status", "open")');
    expect(REPAIR).toContain('.not("pending_gates", "is", null)');
    /* The empty array is the thing to exclude: `pending_gates` defaults to
       `[]`, so filtering on null alone filled the window with tracks that had
       nothing to prune and left a real one out of reach (measured on
       production, five repaired and the sixth at row 54 of a 50-row read). */
    expect(REPAIR).toContain('.neq("pending_gates", "[]")');
    expect(REPAIR).toContain(".limit(limit * 5)");
  });

  it("prunes through the driver's own harvest, so an executed gate still files its work", () => {
    // Not a second implementation of what is pending: the same harvest, which
    // attaches the artifact an executed gate produced before it drops the id.
    expect(REPAIR).toContain("harvestAnsweredGates(supabase, row as unknown as DriveRow)");
  });

  it("drives nothing, so a terminal hold stays terminal", () => {
    expect(REPAIR).not.toContain("driveTrackOnce(");
  });

  it("ends only the hold a settled gate makes false, and hands the track its next turn", () => {
    expect(REPAIR).toContain('row.last_hold === "waiting-on-a-person"');
    expect(REPAIR).toContain("keep.length === 0");
    expect(REPAIR).toContain("last_hold: null");
    expect(REPAIR).toContain("driven_at: null");
  });

  it("a track that throws is reported, never fatal to the pass", () => {
    expect(REPAIR).toContain("failed.push(");
    expect(REPAIR).toContain("return { pruned, released, failed };");
  });

  it("the minute sweep runs it and says what it repaired", () => {
    expect(SWEEP).toContain("repairStaleGates(admin as unknown as SupabaseClient, 10)");
    expect(SWEEP).toContain("gatesPruned: gateRepair.pruned");
    expect(SWEEP).toContain("gatesReleased: gateRepair.released");
    expect(SWEEP).toContain("gatesFailed: gateRepair.failed");
  });
});
