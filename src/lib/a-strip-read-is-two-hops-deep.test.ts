/**
 * ── A STRIP READ IS TWO HOPS DEEP ────────────────────────────────────────────
 *
 * The shell's station strip mounts `listStudioSessions` on every
 * authenticated page. On 2026-09-08 its Server-Timing read worker-total
 * 3,734 ms and 3,856 ms on Helio Labs while every query in it takes
 * single-digit milliseconds: the handler awaited eleven reads one after
 * another. Eleven became three that day, and three became two on 09-09,
 * because the third round existed only to run four joins whose keys the
 * database already held.
 *
 * This drives the read with the wire that counts rounds
 * (`src/__tests__/a-wire-that-counts-rounds.ts`) on a fixture where every
 * branch that ever cost a hop is live: a builder run and another agent's run
 * on two missions, a proposed mission with a routed agent, a changeset with
 * files, a spec in the lineage, a trace with cost events, and a pending gate.
 *
 * THE FIXTURE THROWS ON THE READS THAT WENT. `studio_changes`, `prds`,
 * `artifact_lineage`, `agent_run_checkpoints`, `ai_events` and `agents` are
 * no longer read from this handler at all: their answers arrive inside the
 * second round, from one PostgREST aggregate and the three functions of
 * migration 20260909101000. If one of them comes back, this file says so by
 * name rather than by a round count that could be read as noise.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readStudioSessions } from "./studio.functions";
import {
  FakeWire,
  argValue,
  drive,
  eqValue,
  wireError,
  type Filter,
  type Row,
} from "@/__tests__/a-wire-that-counts-rounds";

const AT = "2026-09-08T10:00:00.000Z";
const EARLIER = "2026-09-08T09:00:00.000Z";

const fixture = (table: string, _cols: string, filters: Filter[]): Row[] => {
  switch (table) {
    case "agent_runs": {
      const builder = eqValue(filters, "agent_slug") === "builder";
      return builder
        ? [
            {
              id: "r1",
              mission_id: "m1",
              status: "completed",
              created_at: EARLIER,
              agent_slug: "builder",
              /* Null on runs older than the column: their trace lives only on
                 the checkpoint, and `run_trace_costs` reads both places. */
              trace_id: null,
            },
          ]
        : [
            {
              id: "r2",
              mission_id: "m2",
              status: "running",
              created_at: AT,
              agent_slug: "shipper",
              trace_id: "trace-2",
            },
          ];
    }
    case "missions":
      if (eqValue(filters, "status") === "proposed") return [{ id: "m3" }];
      return [
        {
          id: "m1",
          title: "Build it",
          goal: "g",
          status: "running",
          created_at: EARLIER,
          updated_at: AT,
          archived_at: null,
          current_agent_id: null,
        },
        {
          id: "m2",
          title: "Ship it",
          goal: "g",
          status: "running",
          created_at: EARLIER,
          updated_at: AT,
          archived_at: null,
          current_agent_id: null,
        },
        {
          id: "m3",
          title: "Proposed",
          goal: "g",
          status: "proposed",
          created_at: EARLIER,
          updated_at: EARLIER,
          archived_at: null,
          current_agent_id: "agent-9",
        },
      ];
    case "studio_changesets":
      return [
        {
          id: "cs1",
          product_id: "p",
          mission_id: "m1",
          status: "open",
          repo: "r",
          branch: "b",
          pr_url: null,
          pr_number: null,
          title: "t",
          summary: null,
          created_at: AT,
          /* PostgREST's aggregate shape for the embed. */
          studio_changes: [{ count: 2 }],
        },
      ];
    case "agent_approvals":
      return [{ id: "ap1", mission_id: "m1" }];
    case "rpc:mission_spec_titles":
      return [{ mission_id: "m1", prd_id: "prd1", title: "The spec" }];
    case "rpc:mission_routed_stations":
      return [{ mission_id: "m3", agent_slug: "builder" }];
    default:
      throw new Error(`unexpected read of ${table}`);
  }
};

const run = (wire: FakeWire) =>
  drive(
    wire,
    readStudioSessions(wire as unknown as SupabaseClient, "user-1", {
      includeArchived: false,
      workspaceId: "ws-1",
    }),
  );

describe("a strip read is two hops deep", () => {
  it("answers the full fixture in two rounds", async () => {
    const wire = new FakeWire(fixture);
    const { result, rounds } = await run(wire);
    expect(rounds).toBe(2);
    expect(result.bounded).toBe(false);
    const byId = new Map(result.sessions.map((s) => [s.mission_id, s]));
    expect([...byId.keys()].sort()).toEqual(["m1", "m2", "m3"]);
    // Each kind keeps its own status.
    expect(byId.get("m1")?.kind).toBe("build");
    expect(byId.get("m1")?.run_status).toBe("completed");
    expect(byId.get("m2")?.kind).toBe("mission");
    expect(byId.get("m2")?.run_status).toBe("running");
    // The changeset carries its file count, the mission its spec and its gate.
    expect(byId.get("m1")?.changeset?.file_count).toBe(2);
    expect(byId.get("m1")?.prd).toEqual({ id: "prd1", title: "The spec" });
    expect(byId.get("m1")?.pending_approvals).toBe(1);
    // The proposed mission stands where its routed agent stands, not at the
    // first stage the proposed fallback would give it.
    expect(byId.get("m3")?.station).toBe("build");
  });

  it("asks each function about exactly the ids the round before it produced", async () => {
    const asked = new Map<string, unknown>();
    const wire = new FakeWire((table, cols, filters) => {
      if (table.startsWith("rpc:")) asked.set(table, argValue(filters, "p_mission_ids"));
      return fixture(table, cols, filters);
    });
    await run(wire);
    // Every mission in the window, and no second call to narrow it afterwards.
    for (const fn of ["rpc:mission_spec_titles", "rpc:mission_routed_stations"]) {
      expect(wire.reads.filter((t) => t === fn)).toHaveLength(1);
      expect(asked.get(fn)).toEqual(["m1", "m2", "m3"]);
    }
  });

  it("never asks what a run cost, because nothing renders it", async () => {
    /* `run_trace_costs` was built this morning to fold the cost sum out of a
       third round, and withdrawn the same day (20260909101100): the field it
       fed was rendered by no surface, so the most-mounted read in the product
       was computing money on every page and dropping it. The fixture throws on
       an unexpected read, so a call coming back names itself. */
    const wire = new FakeWire(fixture);
    await run(wire);
    expect(wire.reads.filter((t) => t.startsWith("rpc:"))).toHaveLength(2);
  });

  it("never reads the six tables whose joins moved into the database", async () => {
    const wire = new FakeWire(fixture);
    await run(wire);
    for (const gone of [
      "studio_changes",
      "prds",
      "artifact_lineage",
      "agent_run_checkpoints",
      "ai_events",
      "agents",
    ]) {
      expect(wire.reads).not.toContain(gone);
    }
  });

  it("answers an empty workspace in one round", async () => {
    const wire = new FakeWire((table, cols, filters) =>
      table === "agent_runs" || table === "missions" ? [] : fixture(table, cols, filters),
    );
    const { result, rounds } = await run(wire);
    expect(rounds).toBe(1);
    expect(result.sessions).toEqual([]);
  });
});

/**
 * The two rows the LEFT JOINs exist for. Both are real on production: six
 * missions point at an agent row that no longer exists, and a spec the caller
 * cannot read would have taken its mission's whole lineage link with it if the
 * join had been an inner one.
 */
describe("a join that finds nothing weakens the claim, it does not drop the row", () => {
  it("a mission routed to an agent that is gone falls back to where an unstarted mission stands", async () => {
    const wire = new FakeWire((table, cols, filters) =>
      table === "rpc:mission_routed_stations"
        ? [{ mission_id: "m3", agent_slug: null }]
        : fixture(table, cols, filters),
    );
    const { result } = await run(wire);
    const m3 = result.sessions.find((s) => s.mission_id === "m3");
    // Position zero in the spine: a proposed mission has not moved, which is a
    // fact about the ordering rather than a guess at the work.
    expect(m3?.station).toBe("sense");
  });

  it("a spec whose title did not come back keeps the link and says the word", async () => {
    const wire = new FakeWire((table, cols, filters) =>
      table === "rpc:mission_spec_titles"
        ? [{ mission_id: "m1", prd_id: "prd1", title: null }]
        : fixture(table, cols, filters),
    );
    const { result } = await run(wire);
    expect(result.sessions.find((s) => s.mission_id === "m1")?.prd).toEqual({
      id: "prd1",
      title: "Spec",
    });
  });
});

/**
 * ── A READ THAT FAILED IS NOT A READ THAT FOUND NOTHING ──────────────────────
 *
 * Every read here but the two run queries used to destructure `{ data }`
 * alone, so an error and an empty answer reached the surface as the same
 * thing. Two of them decide what a person believes about work that is waiting,
 * and they answer it differently on purpose.
 */
describe("a read that failed is not a read that found nothing", () => {
  const failing = (table: string) => (t: string, cols: string, filters: Filter[]) =>
    t === table ? (wireError(`${table} refused`) as unknown as Row[]) : fixture(t, cols, filters);

  it("the wire can refuse a read, which is what the three claims below rest on", async () => {
    /*
     * THE PREREQUISITE, ASSERTED RATHER THAN ASSUMED. A fake that can only
     * return rows cannot produce the difference between a refusal and an empty
     * answer, and that difference is the only thing the tests below measure.
     * If `wireError` is ever simplified back to rows, they would stop measuring
     * anything while staying green, so this says out loud what the tool does.
     */
    const wire = new FakeWire(failing("agent_approvals"));
    type Answer = { data: unknown; error: { message: string } | null };
    /* The builder registers with the wire in a microtask, so let one pass
       before flushing: `drive` does the same thing, by condition. */
    const ask = async (table: string): Promise<Answer> => {
      const pending = Promise.resolve(wire.from(table).select("id") as unknown as Promise<Answer>);
      await new Promise<void>((r) => setImmediate(r));
      wire.flush();
      return pending;
    };
    const refused = await ask("agent_approvals");
    expect(refused.error?.message).toBe("agent_approvals refused");
    expect(refused.data).toBeNull();
    // And a table the fixture did not fail still answers with rows.
    const answered = await ask("studio_changesets");
    expect(answered.error).toBeNull();
    expect(answered.data).toHaveLength(1);
  });

  it("throws when the missions read fails, because the missions ARE the answer", async () => {
    /* An empty list is drawn as seven stations with no work in them, which is
       a claim about the workspace. The strip's own failure state says "count
       unavailable" instead, and it is only reachable by throwing. */
    const wire = new FakeWire(failing("missions"));
    await expect(run(wire)).rejects.toThrow("missions refused");
  });

  /*
   * THESE TWO ARE MIRRORS, and the pairing is the point (Lane 1's shape,
   * 2026-09-09). A handler that withholds EVERYTHING whenever any read fails
   * would pass a single-direction test and be its own defect: the surface
   * would lose facts that were read perfectly well. So each refusal is checked
   * for what it takes AND for what it leaves standing, and the two refusals
   * take opposite things.
   */
  it("a refused gate read withholds the gate count and nothing else", async () => {
    const wire = new FakeWire(failing("agent_approvals"));
    const { result, rounds } = await run(wire);
    expect(rounds).toBe(2);
    // Every session still lists: losing the strip over a gate count would cost
    // more than the count is worth.
    expect(result.sessions).toHaveLength(3);
    // Not one of them says zero, which is what "nothing is waiting" looks like
    // on a surface that cannot tell the difference.
    for (const s of result.sessions) expect(s.pending_approvals).toBeNull();
    // And everything the gate read never fed is exactly where it was.
    const byId = new Map(result.sessions.map((x) => [x.mission_id, x]));
    expect(byId.get("m1")?.prd).toEqual({ id: "prd1", title: "The spec" });
    expect(byId.get("m1")?.changeset?.file_count).toBe(2);
    expect(byId.get("m1")?.run_status).toBe("completed");
    expect(byId.get("m3")?.station).toBe("build");
  });

  it("a refused spec read withholds the spec link and leaves the gate count real", async () => {
    const wire = new FakeWire(failing("rpc:mission_spec_titles"));
    const { result } = await run(wire);
    const byId = new Map(result.sessions.map((x) => [x.mission_id, x]));
    // The mirror: the count that survived a gate refusal is the one that goes
    // here, and the link that survived here is the one that went there.
    expect(byId.get("m1")?.prd).toBeNull();
    expect(byId.get("m1")?.pending_approvals).toBe(1);
    expect(byId.get("m1")?.changeset?.file_count).toBe(2);
    expect(byId.get("m3")?.station).toBe("build");
  });

  it("counts the gates as zero when the read answered and found none", async () => {
    const wire = new FakeWire((t, cols, filters) =>
      t === "agent_approvals" ? [] : fixture(t, cols, filters),
    );
    const { result } = await run(wire);
    for (const s of result.sessions) expect(s.pending_approvals).toBe(0);
  });
});
