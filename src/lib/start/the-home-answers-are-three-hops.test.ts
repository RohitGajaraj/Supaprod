/**
 * ── THE HOME'S ANSWERS ARE THREE HOPS ────────────────────────────────────────
 *
 * This read backs the three answer lines above the run list and the entry's
 * evidence region, and it gates the home's first paint alongside the queue.
 *
 * IT WAS EIGHT SEQUENTIAL ROUND TRIPS, and I added two of them. The handler
 * awaited the last look, arriving, the graded count, the releases, their
 * deployments, and then the re-score count and the closed loop I put in for the
 * evidence region. F-212 measured this deployment at roughly 275ms warm per
 * hop, so those two were about half a second added to the surface F-216 had
 * just spent a packet making fast.
 *
 * Only two of the reads depend on the last look, so the look stays its own hop
 * and everything else leaves together. Three: the look, the group, and the
 * deployments read that needs the release rows' own ids.
 *
 * WHY THIS TEST EXISTS RATHER THAN A COMMENT. The shape is one `await` away
 * from regressing and nothing about a sequential await looks wrong in a diff.
 * The same guard exists for the queue, the strip and six other reads, and it is
 * the only thing that has ever held any of them.
 *
 * It also required the extraction: the round-counting wire drives a plain
 * function and cannot reach inside a server function, so `readAnswers` had to
 * stop being a nested `createServerFn` before this could be written. That was
 * worth doing on its own, because `readHome` was paying for a second auth
 * middleware run on every arrival to call it.
 */
import { describe, expect, it } from "bun:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { readAnswers } from "./home-answers.functions";
import { FakeWire, drive, wireError } from "@/__tests__/a-wire-that-counts-rounds";

describe("the home's answers are three hops", () => {
  it("with a workspace named and no releases, the look and then one group", async () => {
    const wire = new FakeWire(() => []);
    const { rounds } = await drive(
      wire,
      readAnswers(wire as unknown as SupabaseClient, "user-1", "ws-1"),
    );
    // The deployments read is skipped entirely when nothing was released, so
    // two is the floor and three is the ceiling. Either way it is not eight.
    expect(rounds).toBe(2);
    expect(wire.reads).toContain("brain_last_seen");
    expect(wire.reads).toContain("themes");
    expect(wire.reads).toContain("decisions");
    expect(wire.reads).toContain("learnings");
    expect(wire.reads).toContain("changelog_entries");
  });

  it("adds exactly ONE hop when a release carries a changeset to resolve", async () => {
    const wire = new FakeWire((table) =>
      table === "changelog_entries"
        ? [{ title: "t", body: null, changeset_id: "cs-1", released_at: "2026-09-08T00:00:00Z" }]
        : [],
    );
    const { rounds } = await drive(
      wire,
      readAnswers(wire as unknown as SupabaseClient, "user-1", "ws-1"),
    );
    expect(rounds).toBe(3);
    expect(wire.reads).toContain("deployments");
  });

  /*
   * ── ONE READ FAILING MUST BLANK ONLY ITSELF ──────────────────────────────
   *
   * This file's own header says each read fails on its own and none may
   * degrade to zero, because `null` means "we could not find out" and the
   * shapes draw nothing for it while they draw an ALL-CLEAR for zero. Until
   * `wireError` existed (Lane 3, 2026-09-09) that could not be tested: a fake
   * that can only return rows cannot produce the difference between a refusal
   * and an empty answer, and that difference is what every finding on this
   * lane today turned on.
   *
   * So the hop guard above was measuring the shape of the reads and nothing
   * about their honesty. This is the half it was missing.
   */
  it("a refused learnings table withholds ONLY what it fed, never the counts beside it", async () => {
    const wire = new FakeWire((table) => (table === "learnings" ? wireError("refused") : []));
    const { result } = await drive(
      wire,
      readAnswers(wire as unknown as SupabaseClient, "user-1", "ws-1"),
    );
    const a = result as Awaited<ReturnType<typeof readAnswers>>;

    // What the refusal owns: both learnings reads, withheld rather than zeroed.
    expect(a.rescoredCount).toBeNull();
    expect(a.closed).toBeNull();
    expect(a.closedRead).toBe(false);

    // What it must NOT touch. Zero here is a real answer from a read that
    // worked, and the shapes are entitled to draw an all-clear for it.
    expect(a.arrivingCount).toBe(0);
    expect(a.learnedCount).toBe(0);
    expect(a.releases).toEqual([]);
  });

  it("a refused themes table does not blank the graded count or the evidence", async () => {
    // The mirror, so the test cannot pass by withholding everything.
    const wire = new FakeWire((table) => (table === "themes" ? wireError("refused") : []));
    const { result } = await drive(
      wire,
      readAnswers(wire as unknown as SupabaseClient, "user-1", "ws-1"),
    );
    const a = result as Awaited<ReturnType<typeof readAnswers>>;
    expect(a.arrivingCount).toBeNull();
    expect(a.learnedCount).toBe(0);
    expect(a.rescoredCount).toBe(0);
    expect(a.closedRead).toBe(true);
  });

  it("never reads anything when there is no workspace to read for", async () => {
    /*
     * Without a workspace there is nothing to count and nothing honest to say,
     * and the shapes must get null rather than zero.
     *
     * THIS TEST FOUND A REAL ONE. The default-workspace RPC's answer was taken
     * with `?? null`, which accepts any shape it returns, and an empty array is
     * truthy: it became the workspace id, every read filtered on it, and they
     * all answered ZERO. Zero is the one answer this file must never invent,
     * because the shapes draw an all-clear for it and draw nothing for null.
     * The id is checked to be a non-empty string now.
     */
    const wire = new FakeWire(() => []);
    const { result } = await drive(
      wire,
      readAnswers(wire as unknown as SupabaseClient, "user-1", null),
    );
    const answers = result as Awaited<ReturnType<typeof readAnswers>>;
    expect(answers.arrivingCount).toBeNull();
    expect(answers.learnedCount).toBeNull();
    expect(answers.rescoredCount).toBeNull();
    expect(answers.closed).toBeNull();
    // `closedRead` false and not true: nothing was looked at, so this is
    // "could not look" rather than "the loop never closed".
    expect(answers.closedRead).toBe(false);
  });
});
