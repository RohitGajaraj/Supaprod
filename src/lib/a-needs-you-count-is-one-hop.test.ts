/**
 * ── A NEEDS-YOU COUNT IS ONE HOP ─────────────────────────────────────────────
 *
 * `countNeedsYouCalls` backs Today's badge, loop-health and the Inbox's live
 * line (`getLiveActivity`, six calls per Inbox load at ~1.1 s each inside the
 * Worker on 2026-09-08). It read the workspace's design-stage flag in a round
 * trip of its own BEFORE its ten counts, on every call. The flag rides the
 * same hop now and the design-gate count is zeroed after the barrier when
 * the stage is off. Driven with the wire that counts rounds.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { countNeedsYouCalls } from "./today.functions";
import { FakeWire, drive } from "@/__tests__/a-wire-that-counts-rounds";

describe("a needs-you count is one hop", () => {
  it("with a workspace named, every read leaves together", async () => {
    const wire = new FakeWire(() => []);
    const { rounds } = await drive(
      wire,
      countNeedsYouCalls(wire as unknown as SupabaseClient, "user-1", "ws-1"),
    );
    expect(rounds).toBe(1);
    expect(wire.reads).toContain("workspaces");
  });

  it("with no workspace given, the membership lookup is the only read ahead of the counts", async () => {
    const wire = new FakeWire((table) =>
      table === "workspace_members" ? [{ workspace_id: "ws-1" }] : [],
    );
    const { rounds } = await drive(
      wire,
      countNeedsYouCalls(wire as unknown as SupabaseClient, "user-1"),
    );
    expect(rounds).toBe(2);
  });
});
