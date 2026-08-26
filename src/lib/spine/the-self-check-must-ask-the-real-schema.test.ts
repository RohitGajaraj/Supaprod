/**
 * THE SELF-CHECK MUST ASK THE REAL SCHEMA (S0-002, 2026-08-26).
 *
 * ── WHAT THIS EXISTS BECAUSE OF ────────────────────────────────────────────
 * S0-001 shipped the self-verifying spine: before a station may hand on, it
 * checks its own output. The idea is the highest-value change in the product
 * and it is not in question here. What shipped with it was a set of checks
 * written against a schema nobody asked, and five of the seven could never
 * pass. Measured 2026-08-26 against the live database and all 1,516
 * `spine_track_members` rows:
 *
 *   decide  wanted `decisions.forecast_text`  the column is `forecast_claim`
 *   define  wanted `prds.brief`               the column is `body_md`
 *   design  wanted kind `design_memory`       design files `prototype` (19)
 *   ship    wanted kind `deployment`          never filed once — that is F-36
 *   learn   wanted kind `verdict`             learn files `learning` (4)
 *
 * PostgREST rejects a select naming a column that does not exist, and the code
 * read only `data`, so `data ?? []` turned "the query failed" into "the work is
 * empty". A decision carrying a real claim with a 2026-09-15 horizon failed the
 * forecast check.
 *
 * ── WHY 22 TESTS DID NOT CATCH IT ──────────────────────────────────────────
 * Because they never loaded the code. Both S0-001 test files imported nothing
 * but `vitest`, asserted on inline mock objects, and printed a narrative ending
 * "MISSION GATE MET" with a hardcoded acceptance count of 1. `verifyStationOutput`
 * was not even exported, so it could not have been called. They have been
 * deleted; this file replaces them and imports the function it is about.
 *
 * ── THE TWO GUARDS ─────────────────────────────────────────────────────────
 * 1. Behaviour: the function is called, with the artifact kinds stations really
 *    file, through a client that answers the way PostgREST answers.
 * 2. Schema drift: every column the checks name must exist in the generated
 *    `types.ts`, which mirrors the real database. That guard is what would have
 *    caught this on the day it was written, and it costs nothing to keep.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { verifyStationOutput } from "@/lib/spine/driver.server";
import type { Attachment } from "@/lib/spine/attach";
import type { AgentStation } from "@/lib/agent-vocabulary";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const DRIVER = read("./driver.server.ts");
const TYPES = read("../../integrations/supabase/types.ts");

const filed = (kind: string, station: AgentStation): Attachment =>
  ({ artifactKind: kind, artifactId: `id-${kind}`, station }) as unknown as Attachment;

/**
 * A client shaped like the one the driver holds. `rows` is what the select
 * resolves to; `failWith` makes it answer the way PostgREST answers a select
 * naming a column that does not exist — `data: null` and an error.
 */
const clientReturning = (rows: unknown[] | null, failWith?: string) =>
  ({
    from: () => ({
      select: () => ({
        in: async () =>
          failWith
            ? { data: null, error: { message: failWith } }
            : { data: rows, error: null },
      }),
    }),
  }) as never;

describe("the kinds the checks name are the kinds stations actually file", () => {
  it("design passes on `prototype`, which is the only kind design has ever filed", async () => {
    const out = await verifyStationOutput(clientReturning([]), "design", [
      filed("prototype", "design"),
    ]);
    expect(out.passed).toBe(true);
  });

  it("design still fails when nothing design-shaped was filed at all", async () => {
    const out = await verifyStationOutput(clientReturning([]), "design", [
      filed("signal", "design"),
    ]);
    expect(out.passed).toBe(false);
  });

  it("learn passes on `learning`, which is the only kind learn has ever filed", async () => {
    const out = await verifyStationOutput(clientReturning([]), "learn", [
      filed("learning", "learn"),
    ]);
    expect(out.passed).toBe(true);
  });

  it("ship does not demand a kind that has never been filed once", async () => {
    // F-36: `deployment` has never appeared in 1,516 member rows, while
    // `deployments` holds 42 successful ones. Ship's real proof is enforced at
    // release.publish under R-27, not here.
    const out = await verifyStationOutput(clientReturning([]), "ship", [
      filed("decision", "ship"),
    ]);
    expect(out.passed).toBe(true);
  });
});

describe("the columns the checks name are the columns that exist", () => {
  it("decide passes on a decision carrying forecast_claim", async () => {
    const out = await verifyStationOutput(
      clientReturning([{ id: "d1", forecast_claim: "checkout completion will fall", forecast_horizon_date: null }]),
      "decide",
      [filed("decision", "decide")],
    );
    expect(out.passed).toBe(true);
  });

  it("decide still fails on a decision with no forecast at all", async () => {
    const out = await verifyStationOutput(
      clientReturning([{ id: "d1", forecast_claim: null, forecast_horizon_date: null }]),
      "decide",
      [filed("decision", "decide")],
    );
    expect(out.passed).toBe(false);
  });

  it("define passes on a spec carrying body_md", async () => {
    const out = await verifyStationOutput(
      clientReturning([{ id: "p1", title: null, body_md: "## the spec" }]),
      "define",
      [filed("prd", "define")],
    );
    expect(out.passed).toBe(true);
  });

  it("no check names a column the generated schema does not have", () => {
    // The guard that would have caught S0-001 on the day it was written.
    const check = DRIVER.slice(
      DRIVER.indexOf("export async function verifyStationOutput("),
      DRIVER.indexOf("export async function driveTrackOnce("),
    );
    /*
     * Read what the code ASKS FOR, not what it talks about. The comments in
     * there name the wrong column on purpose, to say it was wrong — a guard
     * that greps the whole slice fails on its own explanation.
     */
    const asked = [
      ...[...check.matchAll(/\.select\(\s*"([^"]+)"/g)].map((m) => m[1]),
      ...[...check.matchAll(/byKind\.get\(\s*"([^"]+)"/g)].map((m) => m[1]),
    ].join(" | ");

    for (const phantom of ["forecast_text", "brief", "design_memory", "verdict", "deployment"]) {
      expect(asked).not.toContain(phantom);
    }
    for (const real of ["forecast_claim", "body_md", "prototype", "learning"]) {
      expect(asked).toContain(real);
    }
    // And the real ones are real because the generated types carry them.
    expect(TYPES).toContain("forecast_claim");
    expect(TYPES).toContain("body_md");
    expect(TYPES).not.toContain("forecast_text");
  });
});

describe("a check that could not run must not fail the station", () => {
  it("a broken forecast query passes rather than stranding the work", async () => {
    const out = await verifyStationOutput(
      clientReturning(null, 'column decisions.nope does not exist'),
      "decide",
      [filed("decision", "decide")],
    );
    expect(out.passed).toBe(true);
  });

  it("a broken spec query passes rather than stranding the work", async () => {
    const out = await verifyStationOutput(
      clientReturning(null, 'column prds.nope does not exist'),
      "define",
      [filed("prd", "define")],
    );
    expect(out.passed).toBe(true);
  });
});

describe("the self-check hold is bounded", () => {
  it("the self-check write counts an attempt, because attempts is the only bound", () => {
    // Left at 0, MAX_STATION_ATTEMPTS never trips, `given-up` never fires,
    // decideCorrection is never reached, and every stuck-work alarm keyed on the
    // counter stays silent while each tick re-runs the crew at real cost.
    const body = DRIVER.slice(DRIVER.indexOf("export async function driveTrackOnce("));
    const at = body.indexOf('last_hold: "self-check-failed"');
    expect(at).toBeGreaterThan(-1);
    const write = body.slice(at - 500, at + 100);
    expect(write).toContain("attempts: (row.attempts ?? 0) + 1");
  });

  it("the clock-based wait is still exempt, because waiting on a date costs nothing", () => {
    const body = DRIVER.slice(DRIVER.indexOf("export async function driveTrackOnce("));
    const at = body.indexOf('last_hold: "needs-evidence"');
    const write = body.slice(at - 400, at + 100);
    expect(write).toContain("attempts deliberately UNCHANGED");
  });
});
