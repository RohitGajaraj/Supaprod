import { describe, it, expect } from "bun:test";
import {
  shouldPublishChangelog,
  changelogTitleFor,
  changelogRowFor,
  groupByProduct,
  trackIdByChangeset,
  type ChangesetForChangelog,
} from "./changelog";

const cs = (over: Partial<ChangesetForChangelog>): ChangesetForChangelog => ({
  id: "c1",
  workspace_id: "w1",
  user_id: "u1",
  status: "merged",
  title: "Add export button",
  release_notes: "Adds a CSV export button to the report page.",
  release_notes_at: "2026-06-29T10:00:00.000Z",
  ...over,
});

describe("shouldPublishChangelog", () => {
  it("publishes a merged changeset with release notes", () => {
    expect(shouldPublishChangelog(cs({}))).toBe(true);
  });
  it("never publishes an unmerged changeset", () => {
    expect(shouldPublishChangelog(cs({ status: "pr_open" }))).toBe(false);
    expect(shouldPublishChangelog(cs({ status: "staged" }))).toBe(false);
    expect(shouldPublishChangelog(cs({ status: "abandoned" }))).toBe(false);
  });
  it("never publishes a merge without release copy", () => {
    expect(shouldPublishChangelog(cs({ release_notes: null }))).toBe(false);
    expect(shouldPublishChangelog(cs({ release_notes: "   " }))).toBe(false);
  });
});

describe("changelogTitleFor", () => {
  it("prefers the changeset title", () => {
    expect(changelogTitleFor(cs({}))).toBe("Add export button");
  });
  it("falls back to the first non-empty release-note line, stripping markdown headers", () => {
    expect(changelogTitleFor(cs({ title: "", release_notes: "## Release\nDid a thing" }))).toBe(
      "Release",
    );
  });
  it("falls back to a generic label when there is nothing", () => {
    expect(changelogTitleFor(cs({ title: "", release_notes: "\n\n" }))).toBe("Shipped an update");
  });
});

describe("changelogRowFor", () => {
  it("shapes a row for a publishable merge", () => {
    const row = changelogRowFor(cs({ product_id: "p1", prd_id: "prd1", pr_number: 42 }), "NOW");
    expect(row).toMatchObject({
      workspace_id: "w1",
      product_id: "p1",
      changeset_id: "c1",
      prd_id: "prd1",
      title: "Add export button",
      pr_number: 42,
      released_at: "2026-06-29T10:00:00.000Z",
    });
  });
  it("falls back released_at to now when release_notes_at is missing", () => {
    const row = changelogRowFor(cs({ release_notes_at: null }), "NOW");
    expect(row?.released_at).toBe("NOW");
  });
  it("returns null for a non-publishable changeset", () => {
    expect(changelogRowFor(cs({ status: "staged" }), "NOW")).toBeNull();
  });
});

describe("groupByProduct", () => {
  const entry = (over: Partial<{ id: string; product_name: string | null }>) => ({
    id: "e1",
    product_name: null,
    ...over,
  });

  it("groups entries by product_name, first-seen order", () => {
    const groups = groupByProduct([
      entry({ id: "a", product_name: "Supaprod" }),
      entry({ id: "b", product_name: "Loop" }),
      entry({ id: "c", product_name: "Supaprod" }),
    ]);
    expect(groups.map((g) => g.label)).toEqual(["Supaprod", "Loop"]);
    expect(groups[0].entries.map((e) => e.id)).toEqual(["a", "c"]);
    expect(groups[1].entries.map((e) => e.id)).toEqual(["b"]);
  });

  it("buckets a null/undefined product_name under Unassigned", () => {
    const groups = groupByProduct([entry({ id: "a", product_name: null })]);
    expect(groups).toEqual([{ label: "Unassigned", entries: [entry({ id: "a" })] }]);
  });

  it("returns an empty array for no entries", () => {
    expect(groupByProduct([])).toEqual([]);
  });
});

describe("trackIdByChangeset (P-14b, A-QUEUE.md)", () => {
  it("resolves a changeset to its mission's track", () => {
    const result = trackIdByChangeset(
      [{ id: "cs1", mission_id: "m1" }],
      [{ mission_id: "m1", track_id: "t1" }],
    );
    expect(result.get("cs1")).toBe("t1");
  });

  it("resolves to null when the mission's run never recorded a track -- the majority case (R-35)", () => {
    const result = trackIdByChangeset(
      [{ id: "cs1", mission_id: "m1" }],
      [{ mission_id: "m1", track_id: null }],
    );
    expect(result.get("cs1")).toBeNull();
  });

  it("resolves to null when the changeset carries no mission at all", () => {
    const result = trackIdByChangeset([{ id: "cs1", mission_id: null }], []);
    expect(result.has("cs1")).toBe(false);
  });

  it("takes the last non-null track across a mission's runs, ordered as given -- an earlier run that knew the track outranks a later one that predates the link", () => {
    const result = trackIdByChangeset(
      [{ id: "cs1", mission_id: "m1" }],
      [
        { mission_id: "m1", track_id: "t1" },
        { mission_id: "m1", track_id: null },
      ],
    );
    expect(result.get("cs1")).toBe("t1");
  });

  it("keeps two changesets on the same mission apart from two on different missions", () => {
    const result = trackIdByChangeset(
      [
        { id: "cs1", mission_id: "m1" },
        { id: "cs2", mission_id: "m1" },
        { id: "cs3", mission_id: "m2" },
      ],
      [
        { mission_id: "m1", track_id: "t1" },
        { mission_id: "m2", track_id: "t2" },
      ],
    );
    expect(result.get("cs1")).toBe("t1");
    expect(result.get("cs2")).toBe("t1");
    expect(result.get("cs3")).toBe("t2");
  });
});
