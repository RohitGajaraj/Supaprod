/**
 * ── A RUN'S DECISIONS ARE TWO HOPS ───────────────────────────────────────────
 *
 * Lane 2's ask (2026-09-09): for one run, the ordered decisions the agents
 * made with their reasons, not the tool calls. `readTrackDecisions` answers
 * from the track's record: the decisions written on it and the ones made on
 * its missions, oldest first, deduplicated, each with its reasons and its bet.
 * Driven on the wire that counts rounds.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { readTrackDecisions } from "./decisions.functions";
import {
  FakeWire,
  drive,
  inList,
  type Filter,
  type Row,
} from "@/__tests__/a-wire-that-counts-rounds";

const decision = (id: string, at: string, extra: Row = {}): Row => ({
  id,
  title: `Decision ${id}`,
  rationale: `because ${id}`,
  alternatives_considered: [{ option: "wait" }],
  decided_by_agent_slug: "strategist",
  status: "approved",
  source_kind: "mission",
  mission_id: null,
  created_at: at,
  forecast_claim: null,
  forecast_how_we_will_know: null,
  forecast_horizon_date: null,
  forecast_resolution: null,
  forecast_resolution_rationale: null,
  forecast_resolved_at: null,
  ...extra,
});

const fixture = (table: string, _cols: string, filters: Filter[]): Row[] => {
  if (table === "spine_track_members") {
    return [
      { artifact_kind: "decision", artifact_id: "d2" },
      { artifact_kind: "mission", artifact_id: "m1" },
    ];
  }
  if (table === "decisions") {
    if (inList(filters, "id")) return [decision("d2", "2026-09-09T02:00:00.000Z")];
    if (inList(filters, "mission_id")) {
      return [
        decision("d1", "2026-09-09T01:00:00.000Z", {
          mission_id: "m1",
          forecast_claim: "Churn falls",
        }),
        decision("d2", "2026-09-09T02:00:00.000Z", { mission_id: "m1" }),
      ];
    }
  }
  throw new Error(`unexpected read of ${table}`);
};

describe("a run's decisions are two hops", () => {
  it("reads the record, then the decisions on it and on its missions, oldest first, once each", async () => {
    const wire = new FakeWire(fixture);
    const { result, rounds } = await drive(
      wire,
      readTrackDecisions(wire as unknown as SupabaseClient<Database>, "t1"),
    );
    expect(rounds).toBe(2);
    expect(result.decisions.map((d) => d.id)).toEqual(["d1", "d2"]);
    expect(result.decisions[0].via).toBe("mission");
    expect(result.decisions[0].forecast.claim).toBe("Churn falls");
    expect(result.decisions[1].via).toBe("track");
    expect(result.decisions[1].rationale).toBe("because d2");
    expect(result.decisions[1].alternatives_considered).toEqual([{ option: "wait" }]);
  });

  it("a run with no record answers empty in one hop", async () => {
    const wire = new FakeWire((table) =>
      table === "spine_track_members" ? [] : fixture(table, "", []),
    );
    const { result, rounds } = await drive(
      wire,
      readTrackDecisions(wire as unknown as SupabaseClient<Database>, "t1"),
    );
    expect(rounds).toBe(1);
    expect(result.decisions).toEqual([]);
  });
});
