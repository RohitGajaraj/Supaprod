/**
 * The rotation is the only scheduling this product's liveness layer has, and it
 * is a sort. These tests pin the four decisions in it, each of which could have
 * gone the other way and each of which changes what gets watched:
 *
 *   1. never-checked outranks every checked entry, however old
 *   2. otherwise oldest first
 *   3. an unreadable `checked_at` counts as never, not as now
 *   4. ties break on id, so a run is reproducible
 *
 * The third is the one that would rot silently. Treating an unparseable
 * timestamp as fresh means an entry whose row is subtly corrupt is never checked
 * again, and the page keeps reporting its last good verdict forever.
 */
import { describe, expect, test } from "bun:test";
import { selectDueEntries, ROTATION_BATCH, type RotationEntry } from "./rotation";

const cap = (id: string): RotationEntry => ({ id, kind: "capability" });

describe("selectDueEntries", () => {
  test("an unchecked entry outranks every checked one, however stale", () => {
    const due = selectDueEntries(
      [cap("old"), cap("new")],
      [{ capability_id: "old", checked_at: "1999-01-01T00:00:00.000Z" }],
      1,
    );
    // "new" has no row at all. Twenty-six years of staleness does not beat it.
    expect(due.map((d) => d.id)).toEqual(["new"]);
  });

  test("otherwise oldest first", () => {
    const due = selectDueEntries(
      [cap("a"), cap("b"), cap("c")],
      [
        { capability_id: "a", checked_at: "2026-08-20T03:00:00.000Z" },
        { capability_id: "b", checked_at: "2026-08-20T01:00:00.000Z" },
        { capability_id: "c", checked_at: "2026-08-20T02:00:00.000Z" },
      ],
      2,
    );
    expect(due.map((d) => d.id)).toEqual(["b", "c"]);
  });

  test("a checked_at nobody can parse is treated as never, not as now", () => {
    const due = selectDueEntries(
      [cap("broken"), cap("fresh")],
      [
        { capability_id: "broken", checked_at: "not a date" },
        { capability_id: "fresh", checked_at: "2026-08-20T03:00:00.000Z" },
      ],
      1,
    );
    /*
     * The safe reading of "I cannot tell when this was checked" is to check it.
     * The other reading strands the entry forever while the page keeps showing
     * its last good verdict.
     */
    expect(due.map((d) => d.id)).toEqual(["broken"]);
  });

  test("a null checked_at is treated as never", () => {
    const due = selectDueEntries(
      [cap("nulled"), cap("fresh")],
      [
        { capability_id: "nulled", checked_at: null },
        { capability_id: "fresh", checked_at: "2026-08-20T03:00:00.000Z" },
      ],
      1,
    );
    expect(due.map((d) => d.id)).toEqual(["nulled"]);
  });

  test("ties break on id, so a run is reproducible", () => {
    const same = "2026-08-20T03:00:00.000Z";
    const due = selectDueEntries(
      [cap("zeta"), cap("alpha"), cap("mid")],
      [
        { capability_id: "zeta", checked_at: same },
        { capability_id: "alpha", checked_at: same },
        { capability_id: "mid", checked_at: same },
      ],
      2,
    );
    expect(due.map((d) => d.id)).toEqual(["alpha", "mid"]);
  });

  test("every kind rotates in one pool, because they share the query budget", () => {
    const registry: RotationEntry[] = [
      { id: "c1", kind: "capability" },
      { id: "i1", kind: "integrity" },
      { id: "v1", kind: "vocabulary" },
    ];
    const due = selectDueEntries(registry, [], 3);
    expect(due.map((d) => d.kind).sort()).toEqual(["capability", "integrity", "vocabulary"]);
  });

  test("does not invent work when the registry is smaller than the batch", () => {
    expect(selectDueEntries([cap("only")], [], ROTATION_BATCH)).toHaveLength(1);
  });

  test("a limit of zero asks for nothing rather than everything", () => {
    // The off-by-one that turns a paused rotation into a full sweep.
    expect(selectDueEntries([cap("a"), cap("b")], [], 0)).toEqual([]);
  });

  test("stored rows for ids no longer in the registry are ignored, not returned", () => {
    const due = selectDueEntries(
      [cap("still-here")],
      [
        { capability_id: "deleted-last-week", checked_at: "1999-01-01T00:00:00.000Z" },
        { capability_id: "still-here", checked_at: "2026-08-20T03:00:00.000Z" },
      ],
      5,
    );
    // The registry is the source of truth for what exists. A stale row is not a
    // capability, and the rotation must not resurrect one.
    expect(due.map((d) => d.id)).toEqual(["still-here"]);
  });

  test("does not mutate the registry it was given", () => {
    const registry = [cap("b"), cap("a")];
    const before = registry.map((r) => r.id);
    selectDueEntries(registry, [], 2);
    // `sort` is in place; the caller passes the module-level TRACKED_* arrays.
    expect(registry.map((r) => r.id)).toEqual(before);
  });
});
