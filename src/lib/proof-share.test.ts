import { expect, test, describe } from "bun:test";
import { toPublicDecisionList } from "./decisions-share.functions";

describe("toPublicDecisionList — the /proof Trust Ledger row filter (RPT-07)", () => {
  const base = {
    title: "Ship the thing",
    status: "approved",
    decided_by_agent_slug: "critic",
    created_at: "2026-07-01T00:00:00Z",
  };

  test("excludes rows from a sample (seeded/demo) workspace", () => {
    const rows = [
      { ...base, share_slug: "real-1", workspace_id: "ws-real", is_public: true },
      { ...base, share_slug: "seed-1", workspace_id: "ws-sample", is_public: true },
    ];
    const out = toPublicDecisionList(rows, new Set(["ws-sample"]));
    expect(out.map((r) => r.share_slug)).toEqual(["real-1"]);
  });

  test("excludes rows without a share_slug or not actually public", () => {
    const rows = [
      { ...base, share_slug: null, workspace_id: "ws-real", is_public: true },
      { ...base, share_slug: "not-public", workspace_id: "ws-real", is_public: false },
      { ...base, share_slug: "ok", workspace_id: "ws-real", is_public: true },
    ];
    const out = toPublicDecisionList(rows, new Set());
    expect(out.map((r) => r.share_slug)).toEqual(["ok"]);
  });

  test("never leaks workspace_id in the projected result", () => {
    const rows = [{ ...base, share_slug: "s1", workspace_id: "ws-real", is_public: true }];
    const out = toPublicDecisionList(rows, new Set());
    expect(out[0]).not.toHaveProperty("workspace_id");
    expect(Object.keys(out[0]!)).toEqual([
      "title",
      "status",
      "decided_by_agent_slug",
      "created_at",
      "share_slug",
    ]);
  });

  test("caps the result at the given limit", () => {
    const rows = Array.from({ length: 30 }, (_, i) => ({
      ...base,
      share_slug: `s${i}`,
      workspace_id: "ws-real",
      is_public: true,
    }));
    expect(toPublicDecisionList(rows, new Set(), 20)).toHaveLength(20);
  });

  test("empty input is safe", () => {
    expect(toPublicDecisionList([], new Set())).toEqual([]);
  });

  test("a null workspace_id is not accidentally treated as a sample id", () => {
    const rows = [{ ...base, share_slug: "s1", workspace_id: null, is_public: true }];
    // the empty-string sentinel used internally must never collide with a real sample id
    expect(toPublicDecisionList(rows, new Set(["ws-sample"]))).toHaveLength(1);
    expect(toPublicDecisionList(rows, new Set([""]))).toHaveLength(0);
  });
});
