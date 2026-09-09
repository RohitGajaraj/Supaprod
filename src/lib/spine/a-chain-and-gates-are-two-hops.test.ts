/**
 * ── A CHAIN AND ITS GATES ARE TWO HOPS ──────────────────────────────────────
 *
 * The run page opens on `getTrackChain` and the consent card polls
 * `getTrackGates`. On 2026-09-09 each was three sequential Worker-to-PostgREST
 * round trips, at the ~275 ms warm / ~550 ms cold this deployment pays per
 * hop, and in each case one of the waits was the code's, not the data's:
 * the chain read the track and only then its members, though both key off
 * the request's own `trackId`; the gates read the approvals and only then
 * their pending peers, though the peers are scoped by workspace and caller,
 * both known from the track row. Driven here with the wire that counts
 * rounds on fixtures where every branch is live: two rounds each, and one
 * where there is nothing to wait for.
 *
 * The wire, and why a count rather than a source read, is
 * `src/__tests__/a-wire-that-counts-rounds.ts`.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { readTrackChain, readTrackGates } from "./track.functions";
import {
  FakeWire,
  drive,
  eqValue,
  inList,
  type Filter,
  type Row,
} from "@/__tests__/a-wire-that-counts-rounds";

const AT = "2026-09-09T10:00:00.000Z";
const TRACK = "0d1c2a4e-5b6f-4a7c-8d9e-0f1a2b3c4d5e";

const client = (wire: FakeWire) => wire as unknown as SupabaseClient<Database>;

const track = (extra: Row = {}): Row => ({
  id: TRACK,
  user_id: "user-1",
  workspace_id: "ws-1",
  title: "Ship the thing",
  origin: null,
  entry_station: "sense",
  station: "build",
  status: "open",
  path: ["sense", "decide", "define", "design", "build", "ship", "learn"],
  waived: [],
  updated_at: AT,
  last_hold: "Waiting on you to approve a call.",
  last_hold_because: null,
  driven_at: AT,
  attempts: 1,
  product_id: null,
  pending_gates: [],
  ...extra,
});

describe("a chain is two hops", () => {
  /** Two kinds on purpose: the title reads must share one round, not take one each. */
  const fixture = (table: string): Row[] => {
    switch (table) {
      case "spine_tracks":
        return [track()];
      case "spine_track_members":
        return [
          { artifact_kind: "prd", artifact_id: "p1", station: "define", created_at: AT },
          { artifact_kind: "task", artifact_id: "k1", station: "build", created_at: AT },
        ];
      case "prds":
        return [{ id: "p1", title: "The spec" }];
      case "tasks":
        return [{ id: "k1", title: "The task" }];
      default:
        throw new Error(`unexpected read of ${table}`);
    }
  };

  it("reads the track and its members together, then every title together", async () => {
    const wire = new FakeWire(fixture);
    const { result, rounds } = await drive(wire, readTrackChain(client(wire), TRACK));
    expect(rounds).toBe(2);
    expect(result.track?.id).toBe(TRACK);
    expect(result.chain.total).toBe(2);
    const titles = result.chain.stops.flatMap((s) => s.members.map((m) => m.title));
    expect(titles).toEqual(expect.arrayContaining(["The spec", "The task"]));
    for (const table of ["spine_tracks", "spine_track_members", "prds", "tasks"]) {
      expect(wire.reads.filter((t) => t === table)).toHaveLength(1);
    }
  });

  it("answers a track with nothing filed in one round, route and all", async () => {
    const wire = new FakeWire((table) => (table === "spine_track_members" ? [] : fixture(table)));
    const { result, rounds } = await drive(wire, readTrackChain(client(wire), TRACK));
    expect(rounds).toBe(1);
    expect(result.track?.id).toBe(TRACK);
    expect(result.chain.total).toBe(0);
    expect(result.chain.stops.length).toBeGreaterThan(0);
  });

  it("answers a track that does not exist in one round", async () => {
    const wire = new FakeWire((table) => (table === "spine_tracks" ? [] : fixture(table)));
    const { result, rounds } = await drive(wire, readTrackChain(client(wire), TRACK));
    expect(rounds).toBe(1);
    expect(result).toEqual({
      track: null,
      chain: { stops: [], orphans: [], total: 0 },
      summary: "",
    });
  });
});

describe("the gates inside one run are two hops", () => {
  /**
   * The worst case: two listed gates with different tools, one pending and one
   * already approved, and a workspace whose pending approvals include a peer
   * on the same tool, a peer on a tool no listed gate uses, and the gate
   * itself. The class count has to come out right from one unfiltered read.
   */
  const fixture = (table: string, _cols: string, filters: Filter[]): Row[] => {
    switch (table) {
      case "spine_tracks":
        return [
          track({
            pending_gates: [
              { id: "a1", station: "build" },
              { id: "a2", station: "ship" },
            ],
          }),
        ];
      case "agent_approvals": {
        if (inList(filters, "id")) {
          return [
            {
              id: "a1",
              tool_name: "repo.write",
              agent_slug: "builder",
              rationale: "Write the file.",
              status: "pending",
              created_at: AT,
              expires_at: null,
              expiry_default: "proceed",
              snoozed_until: null,
            },
            {
              id: "a2",
              tool_name: "studio.pr.merge",
              agent_slug: "shipper",
              rationale: "Merge it.",
              status: "approved",
              created_at: "2026-09-09T09:00:00.000Z",
              expires_at: null,
              expiry_default: "cancel",
              snoozed_until: null,
            },
          ];
        }
        expect(eqValue(filters, "workspace_id")).toBe("ws-1");
        expect(eqValue(filters, "user_id")).toBe("user-1");
        expect(eqValue(filters, "status")).toBe("pending");
        return [
          { id: "a1", tool_name: "repo.write" },
          { id: "x9", tool_name: "repo.write" },
          { id: "z1", tool_name: "some.other.tool" },
        ];
      }
      default:
        throw new Error(`unexpected read of ${table}`);
    }
  };

  it("reads the track, then the approvals and their peers together", async () => {
    const wire = new FakeWire(fixture);
    const { result, rounds } = await drive(wire, readTrackGates(client(wire), "user-1", TRACK));
    expect(rounds).toBe(2);
    expect(wire.reads.filter((t) => t === "agent_approvals")).toHaveLength(2);
    expect(result.unreadable).toBe(false);
    expect(result.holdReason).toBe("Waiting on you to approve a call.");
    expect(result.open.map((g) => g.approvalId)).toEqual(["a1"]);
    expect(result.settled.map((g) => g.approvalId)).toEqual(["a2"]);
  });

  /** The count the Decide-all button prints, unchanged by the fold. */
  it("still counts the class from the peers, and only the gate's own class", async () => {
    const wire = new FakeWire(fixture);
    const { result } = await drive(wire, readTrackGates(client(wire), "user-1", TRACK));
    const [open] = result.open;
    expect(open.toolName).toBe("repo.write");
    // x9 shares the tool; a1 is excluded from its own count; z1 is another class.
    expect(open.classPendingElsewhere).toBe(1);
    expect(result.settled[0].classPendingElsewhere).toBe(0);
  });

  it("answers a track with no gates listed in one round", async () => {
    const wire = new FakeWire((table) => (table === "spine_tracks" ? [track()] : []));
    const { result, rounds } = await drive(wire, readTrackGates(client(wire), "user-1", TRACK));
    expect(rounds).toBe(1);
    expect(wire.reads).toEqual(["spine_tracks"]);
    expect(result).toEqual({
      open: [],
      settled: [],
      holdReason: "Waiting on you to approve a call.",
      unreadable: false,
    });
  });
});
