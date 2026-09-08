import { describe, it, expect } from "bun:test";
import { buildHeartbeat, isoWeekStart, type DecisionForHeartbeat } from "./changelog-heartbeat";
import type { ChangesetForChangelog } from "./changelog";

// nowIso is a Thursday (2026-07-09). Its ISO week starts Monday 2026-07-06.
const NOW = "2026-07-09T12:00:00.000Z";

function cs(overrides: Partial<ChangesetForChangelog>): ChangesetForChangelog {
  return {
    id: "cs-" + Math.random().toString(36).slice(2),
    workspace_id: "ws-1",
    status: "merged",
    title: "Shipped something",
    release_notes: "Release note body",
    release_notes_at: null,
    updated_at: null,
    pr_url: null,
    pr_number: null,
    prd_id: null,
    ...overrides,
  };
}

function dec(overrides: Partial<DecisionForHeartbeat>): DecisionForHeartbeat {
  return {
    title: "A decision",
    status: "approved",
    created_at: NOW,
    decided_by_agent_slug: null,
    ...overrides,
  };
}

describe("isoWeekStart", () => {
  it("maps a Thursday to that week's Monday", () => {
    expect(isoWeekStart("2026-07-09T12:00:00.000Z")).toBe("2026-07-06");
  });

  it("maps a Monday to itself", () => {
    expect(isoWeekStart("2026-07-06T00:00:00.000Z")).toBe("2026-07-06");
  });

  it("maps a Sunday back to the prior Monday, not forward", () => {
    // 2026-07-05 is the Sunday that closes the week starting 2026-06-29.
    expect(isoWeekStart("2026-07-05T23:59:59.000Z")).toBe("2026-06-29");
  });

  it("is timezone-stable: a UTC instant late in the day stays in its UTC week", () => {
    expect(isoWeekStart("2026-07-06T23:30:00.000Z")).toBe("2026-07-06");
  });
});

describe("buildHeartbeat bucketing", () => {
  it("buckets shipped changesets across a week boundary into different weeks", () => {
    // changelogTitleFor reads the notes first (P-124, changelog.ts) -- setting
    // `title` alone no longer reaches the shipped line, so each fixture's own
    // notes carry the distinguishing text this test buckets on.
    const thisWeek = cs({
      release_notes_at: "2026-07-08T10:00:00.000Z",
      release_notes: "This week",
    });
    const lastWeek = cs({
      release_notes_at: "2026-07-01T10:00:00.000Z",
      release_notes: "Last week",
    });
    const hb = buildHeartbeat([thisWeek, lastWeek], [], NOW, 6);

    expect(hb.weeks[0].week_of).toBe("2026-07-06");
    expect(hb.weeks[0].shipped.map((s) => s.title)).toEqual(["This week"]);
    expect(hb.weeks[1].week_of).toBe("2026-06-29");
    expect(hb.weeks[1].shipped.map((s) => s.title)).toEqual(["Last week"]);
  });

  it("prefers release_notes_at over updated_at for the bucket", () => {
    // release_notes_at is this week, updated_at is last week: the beat follows
    // when it shipped (release_notes_at), not when the row was last touched.
    const c = cs({
      release_notes_at: "2026-07-07T09:00:00.000Z",
      updated_at: "2026-07-01T09:00:00.000Z",
      release_notes: "Follows release date",
    });
    const hb = buildHeartbeat([c], [], NOW, 6);
    expect(hb.weeks[0].shipped.map((s) => s.title)).toEqual(["Follows release date"]);
    expect(hb.weeks[1].shipped).toEqual([]);
  });

  it("falls back to updated_at when release_notes_at is null", () => {
    const c = cs({ release_notes_at: null, updated_at: "2026-07-08T09:00:00.000Z" });
    const hb = buildHeartbeat([c], [], NOW, 6);
    expect(hb.weeks[0].shipped_count).toBe(1);
  });
});

describe("buildHeartbeat shipped filtering", () => {
  it("counts only changesets that actually shipped (shouldPublishChangelog)", () => {
    const shipped = cs({ release_notes_at: NOW, status: "merged", release_notes: "Done" });
    const draft = cs({ release_notes_at: NOW, status: "staged", release_notes: "Not merged" });
    const mergedNoNotes = cs({ release_notes_at: NOW, status: "merged", release_notes: null });
    const mergedBlankNotes = cs({ release_notes_at: NOW, status: "merged", release_notes: "   " });

    const hb = buildHeartbeat([shipped, draft, mergedNoNotes, mergedBlankNotes], [], NOW, 6);
    expect(hb.weeks[0].shipped_count).toBe(1);
    expect(hb.totals.shipped).toBe(1);
  });

  it("shapes a shipped line with title, pr_url, and a note distinct from the title", () => {
    const c = cs({
      release_notes_at: NOW,
      title: "Dark mode",
      release_notes: "# Dark mode\nToggle now lives in Settings.",
      pr_url: "https://example.test/pr/1",
    });
    const hb = buildHeartbeat([c], [], NOW, 6);
    const line = hb.weeks[0].shipped[0];
    expect(line.title).toBe("Dark mode");
    expect(line.pr_url).toBe("https://example.test/pr/1");
    expect(line.notes).toBe("Toggle now lives in Settings.");
  });
});

describe("buildHeartbeat decisions grouping", () => {
  it("groups decisions by their created week and maps the agent", () => {
    const withAgent = dec({
      title: "Adopt Postgres",
      created_at: "2026-07-07T10:00:00.000Z",
      decided_by_agent_slug: "architect",
    });
    const withoutAgent = dec({
      title: "Ship Friday",
      created_at: "2026-07-08T10:00:00.000Z",
      decided_by_agent_slug: null,
    });
    const priorWeek = dec({ title: "Old call", created_at: "2026-06-30T10:00:00.000Z" });

    const hb = buildHeartbeat([], [withAgent, withoutAgent, priorWeek], NOW, 6);

    expect(hb.weeks[0].decided_count).toBe(2);
    // Newest first inside the week.
    expect(hb.weeks[0].decided.map((d) => d.title)).toEqual(["Ship Friday", "Adopt Postgres"]);
    const agents = hb.weeks[0].decided.map((d) => d.agent);
    expect(agents).toContain("architect");
    expect(agents).toContain("human"); // null slug becomes "human"
    expect(hb.weeks[1].decided.map((d) => d.title)).toEqual(["Old call"]);
  });
});

describe("buildHeartbeat window, empties, totals, and order", () => {
  it("includes empty weeks inside the window", () => {
    const only = cs({ release_notes_at: NOW });
    const hb = buildHeartbeat([only], [], NOW, 4);
    expect(hb.weeks).toHaveLength(4);
    // Weeks 2 and 3 are quiet but still present.
    expect(hb.weeks[2].shipped).toEqual([]);
    expect(hb.weeks[2].decided).toEqual([]);
    expect(hb.weeks[2].shipped_count).toBe(0);
    expect(hb.weeks[3].shipped_count).toBe(0);
  });

  it("honors the N-weeks window and drops items older than it", () => {
    // 8 weeks before the current Monday (2026-07-06) is 2026-05-11, outside a
    // 6-week window.
    const old = cs({ release_notes_at: "2026-05-12T10:00:00.000Z", release_notes: "Ancient" });
    const recent = cs({ release_notes_at: NOW, release_notes: "Recent" });
    const hb = buildHeartbeat([old, recent], [], NOW, 6);

    expect(hb.weeks).toHaveLength(6);
    const allTitles = hb.weeks.flatMap((w) => w.shipped.map((s) => s.title));
    expect(allTitles).toEqual(["Recent"]);
    expect(hb.totals.shipped).toBe(1);
  });

  it("changing the weeks parameter changes the number of week buckets", () => {
    expect(buildHeartbeat([], [], NOW, 3).weeks).toHaveLength(3);
    expect(buildHeartbeat([], [], NOW, 12).weeks).toHaveLength(12);
  });

  it("computes totals as the sum of what the returned weeks contain", () => {
    const s1 = cs({ release_notes_at: "2026-07-08T10:00:00.000Z" });
    const s2 = cs({ release_notes_at: "2026-07-01T10:00:00.000Z" });
    const d1 = dec({ created_at: "2026-07-07T10:00:00.000Z" });
    const d2 = dec({ created_at: "2026-07-02T10:00:00.000Z" });
    const d3 = dec({ created_at: "2026-06-30T10:00:00.000Z" });
    const hb = buildHeartbeat([s1, s2], [d1, d2, d3], NOW, 6);
    expect(hb.totals).toEqual({ shipped: 2, decided: 3 });
  });

  it("orders weeks newest first", () => {
    const hb = buildHeartbeat([], [], NOW, 5);
    const order = hb.weeks.map((w) => w.week_of);
    expect(order).toEqual(["2026-07-06", "2026-06-29", "2026-06-22", "2026-06-15", "2026-06-08"]);
    for (let i = 0; i < order.length - 1; i++) {
      expect(order[i] > order[i + 1]).toBe(true);
    }
  });
});
