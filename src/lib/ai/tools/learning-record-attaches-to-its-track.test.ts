/**
 * An autonomous verdict must attach to the work it was about.
 *
 * WHY THIS EXISTS. A learning that carries no `prd_id` carries no
 * `opportunity_id` either, because the bet is resolved THROUGH the spec. An
 * unattached verdict cannot re-rank the bet that produced it, cannot reach
 * /decide (which drops any learning with no theme), and cannot reach the
 * promotion bar (which joins learnings -> opportunities -> themes). So it is a
 * verdict that taught the product nothing, which is the moat claim quietly
 * failing.
 *
 * `learning.record` had two recoveries for a missing `prd_id` and BOTH are dead on
 * the driver's route, as registry.server.ts documents at length: `missionId` is
 * null at Learn because the driver opens a mission only at Build, and the second
 * hop through `decisions.prd_id` is null by construction because at Decide the
 * spec does not exist yet. What remained was the driver naming the spec id in
 * `stationGoal` and the model choosing to copy it into a tool argument.
 *
 * That is a contract enforced by prose. Measured live and quoted in that file: the
 * one track that completed the loop autonomously recorded two verdicts with
 * prd_id, opportunity_id and mission_id ALL null. This file pins the structural
 * fix -- read the spec off the track the driver already filed it against -- and,
 * more importantly, pins the ORDER, because a fallback that overrides what the
 * agent explicitly said would be a worse bug than the one it fixes.
 */
import { describe, it, expect, afterAll, mock } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ToolDef } from "./registry.server";

const realMemory = await import("@/lib/ai/memory.server");
const realErrors = await import("@/lib/observability/errors");

// Both are stubbed for the same reason: this file is about which id the tool
// resolves, and the real versions embed text and write error rows. Restored in
// afterAll because bun's module mocks are process-wide.
mock.module("@/lib/ai/memory.server", () => ({
  ...realMemory,
  rememberOutcome: async () => ({ id: "mem-1", supersedes: [], error: null }),
}));
mock.module("@/lib/observability/errors", () => ({
  ...realErrors,
  recordErrorEvent: async () => true,
}));

const { TOOL_REGISTRY } = await import("./registry.server");
const learningRecord = TOOL_REGISTRY["learning.record"] as ToolDef;

const SPEC_ON_THE_TRACK = "11111111-1111-4111-8111-111111111111";
const SPEC_THE_AGENT_NAMED = "22222222-2222-4222-8222-222222222222";
const SPEC_VIA_MISSION = "33333333-3333-4333-8333-333333333333";

type Options = {
  /** What `spine_track_members` holds for this track, newest first. */
  trackSpecs?: string[];
  /** What the mission -> decision hop resolves to, when it resolves. */
  missionSpec?: string | null;
  /** Which bet each spec belongs to. */
  oppBySpec?: Record<string, string | null>;
};

function fakeDb(opts: Options = {}) {
  const inserted: Array<Record<string, unknown>> = [];
  const reads: string[] = [];
  const client = {
    from(table: string) {
      reads.push(table);
      if (table === "spine_track_members") {
        // select -> eq(track) -> eq(kind) -> order -> limit -> maybeSingle
        return {
          select: () => ({
            eq: () => ({
              eq: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({
                      data: opts.trackSpecs?.length
                        ? { artifact_id: opts.trackSpecs[0] }
                        : null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "decisions") {
        return {
          select: () => ({
            eq: () => ({
              not: () => ({
                order: () => ({
                  limit: () => ({
                    maybeSingle: async () => ({
                      data: opts.missionSpec ? { prd_id: opts.missionSpec } : null,
                      error: null,
                    }),
                  }),
                }),
              }),
            }),
          }),
        };
      }
      if (table === "prds") {
        return {
          select: () => ({
            eq: (_c: string, id: unknown) => ({
              maybeSingle: async () => ({
                data: {
                  id: String(id),
                  workspace_id: "ws-1",
                  opportunity_id: opts.oppBySpec?.[String(id)] ?? null,
                  title: "Saved address at checkout",
                },
                error: null,
              }),
            }),
          }),
        };
      }
      if (table === "opportunities") {
        return {
          select: () => ({
            eq: (_c: string, id: unknown) => ({
              maybeSingle: async () => ({
                data: {
                  id: String(id),
                  impact: 4,
                  confidence: 5,
                  ease: 3,
                  ice_score: 60,
                  title: "Stop losing the saved address",
                },
                error: null,
              }),
            }),
          }),
          update: () => ({ eq: async () => ({ error: null }) }),
        };
      }
      if (table === "learnings") {
        return {
          insert: (row: Record<string, unknown>) => {
            inserted.push(row);
            return {
              select: () => ({
                single: async () => ({ data: { id: "learning-1" }, error: null }),
              }),
            };
          },
        };
      }
      throw new Error(`unexpected table in this test: ${table}`);
    },
  } as unknown as SupabaseClient;
  return { client, inserted, reads };
}

type Ctx = {
  missionId?: string | null;
  trackId?: string | null;
  prdArg?: string;
};

async function record(db: SupabaseClient, ctx: Ctx) {
  return (await learningRecord.run(
    {
      summary: "The saved address still drops for returning customers.",
      verdict: "missed",
      ...(ctx.prdArg ? { prd_id: ctx.prdArg } : {}),
    },
    {
      supabase: db,
      userId: "user-1",
      agentSlug: "analyst",
      missionId: ctx.missionId ?? null,
      trackId: ctx.trackId ?? null,
      workspaceId: "ws-1",
    },
  )) as {
    learning_id: string;
    opportunity_id: string | null;
  };
}

afterAll(() => {
  mock.module("@/lib/ai/memory.server", () => realMemory);
  mock.module("@/lib/observability/errors", () => realErrors);
});

describe("a verdict recorded by the driver finds its own spec", () => {
  it("reads the spec off the track when the agent named none", async () => {
    // THE DEFECT, exactly. This is the driver's route: no prd_id argument, no
    // mission at Learn, and until now no third option.
    const { client, inserted } = fakeDb({
      trackSpecs: [SPEC_ON_THE_TRACK],
      oppBySpec: { [SPEC_ON_THE_TRACK]: "opp-7" },
    });

    await record(client, { trackId: "track-1" });

    expect(inserted[0].prd_id).toBe(SPEC_ON_THE_TRACK);
  });

  it("reaches the bet through that spec, which is the whole point", async () => {
    // An unattached verdict is not merely untidy. `opportunity_id` is what lets it
    // re-rank the bet, reach /decide, and reach the promotion bar. Asserting the
    // prd_id alone would pass while the thing it exists for stayed broken.
    const { client, inserted } = fakeDb({
      trackSpecs: [SPEC_ON_THE_TRACK],
      oppBySpec: { [SPEC_ON_THE_TRACK]: "opp-7" },
    });

    const out = await record(client, { trackId: "track-1" });

    expect(out.opportunity_id).toBe("opp-7");
    expect(inserted[0].opportunity_id).toBe("opp-7");
  });

  it("never overrides a spec the agent named itself", async () => {
    // The dangerous direction. A fallback that won over an explicit argument would
    // file verdicts against the wrong spec, which is worse than filing none: it
    // would move a miss onto work that did not earn it.
    const { client, inserted } = fakeDb({
      trackSpecs: [SPEC_ON_THE_TRACK],
      oppBySpec: { [SPEC_THE_AGENT_NAMED]: "opp-agent" },
    });

    await record(client, { trackId: "track-1", prdArg: SPEC_THE_AGENT_NAMED });

    expect(inserted[0].prd_id).toBe(SPEC_THE_AGENT_NAMED);
  });

  it("does not go looking at the track when the agent already said which spec", async () => {
    // Not just the same answer, the same WORK. A read on every call would be a
    // query per verdict for an id already in hand.
    const { client, reads } = fakeDb({
      trackSpecs: [SPEC_ON_THE_TRACK],
      oppBySpec: { [SPEC_THE_AGENT_NAMED]: "opp-agent" },
    });

    await record(client, { trackId: "track-1", prdArg: SPEC_THE_AGENT_NAMED });

    expect(reads).not.toContain("spine_track_members");
  });

  it("keeps the mission hop ahead of the track, so the human path is unchanged", async () => {
    // The existing recovery works on the mission-shaped routes and must keep
    // winning there. This file adds a route, it does not reorder the ones that
    // already worked.
    const { client, inserted } = fakeDb({
      trackSpecs: [SPEC_ON_THE_TRACK],
      missionSpec: SPEC_VIA_MISSION,
      oppBySpec: { [SPEC_VIA_MISSION]: "opp-mission" },
    });

    await record(client, { trackId: "track-1", missionId: "mission-1" });

    expect(inserted[0].prd_id).toBe(SPEC_VIA_MISSION);
  });

  it("falls through to the track when the mission hop finds nothing", async () => {
    // The live shape on the driver's route if a mission ever were attached: the
    // first hop resolves, the second is null by construction, and the track is
    // what is left.
    const { client, inserted } = fakeDb({
      trackSpecs: [SPEC_ON_THE_TRACK],
      missionSpec: null,
      oppBySpec: { [SPEC_ON_THE_TRACK]: "opp-7" },
    });

    await record(client, { trackId: "track-1", missionId: "mission-1" });

    expect(inserted[0].prd_id).toBe(SPEC_ON_THE_TRACK);
  });

  it("still records the verdict when nothing resolves at all", async () => {
    // FAIL-SOFT, unchanged. An unlinked outcome is worth less than a linked one and
    // far more than a lost one, so no resolution attempt may block the write.
    const { client, inserted } = fakeDb({});

    const out = await record(client, {});

    expect(out.learning_id).toBe("learning-1");
    expect(inserted[0].prd_id).toBeNull();
    expect(inserted[0].opportunity_id).toBeNull();
  });

  it("survives a track that has not filed a spec yet", async () => {
    // Reachable in practice: a route where Plan was waived, or a Learn run on a
    // track whose spec write was refused. It must record the verdict, not throw.
    const { client, inserted } = fakeDb({ trackSpecs: [] });

    const out = await record(client, { trackId: "track-1" });

    expect(out.learning_id).toBe("learning-1");
    expect(inserted[0].prd_id).toBeNull();
  });
});
