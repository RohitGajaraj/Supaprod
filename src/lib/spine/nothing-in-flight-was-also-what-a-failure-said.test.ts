/**
 * F-126: "NOTHING IS IN FLIGHT" WAS ALSO WHAT A FAILED READ SAID.
 *
 * `listTracks` was `if (error || !data) return []`, so a PostgREST error, an RLS
 * refusal and an empty workspace produced the same answer and no caller could
 * tell them apart. S1 found the consequence on the surface: the shell's
 * live-work strip and `TrackStart` both render that empty array as **"Nothing is
 * in flight"**, beside work that may be moving.
 *
 * `getTrack` was worse and is the highest-stakes instance of this shape found so
 * far: **it did not destructure `error` at all.** It read only `row`, so a failed
 * read returned null and the run screen reported that a piece of work **does not
 * exist** about a track that does. That is the read behind the screen a person
 * opens to watch one piece of work move.
 *
 * ── HOW IT WAS HANDED OVER, WHICH IS WHY IT GOT FIXED ──────────────────────
 * S1 could not reproduce it and said so plainly rather than asserting a bug: on
 * the auth path the middleware throws before the handler runs, so it needs a
 * failure that reaches the query while the guard passes. It is real by
 * inspection regardless — the two states are indistinguishable in the return
 * type — and the fix costs nothing whether or not the path is reachable today.
 *
 * The split is F-120's, now SHARED rather than copied: a missing column is a
 * deployment-ordering fact and falls soft, anything else is raised so `useQuery`
 * can set `isError`.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { failSoftOrThrow, isPreMigration } from "@/lib/read-failure";

const SRC = readFileSync(fileURLToPath(new URL("./track.functions.ts", import.meta.url)), "utf8");
const CODE = SRC.split("\n")
  .filter((l) => {
    const t = l.trim();
    return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
  })
  .join("\n");

describe("the shared rule", () => {
  it("a missing column falls soft, in both PostgREST spellings", () => {
    expect(isPreMigration({ code: "42703" })).toBe(true);
    expect(isPreMigration({ code: "PGRST204" })).toBe(true);
    expect(failSoftOrThrow({ code: "42703", message: "no such column" }, "Anything")).toBe(true);
  });

  it("anything else is raised, with the thing named and the cause carried", () => {
    expect(() =>
      failSoftOrThrow({ code: "57014", message: "statement timeout" }, "The work"),
    ).toThrow(/The work could not be read: statement timeout/);
  });

  it("an error with no code at all is raised, because unknown is not benign", () => {
    // Every gate in this house fails on absence. A driver that reports a message
    // and no code has still failed.
    expect(() => failSoftOrThrow({ message: "boom" }, "The work")).toThrow(/could not be read/);
  });

  it("an error with no message still says something usable", () => {
    expect(() => failSoftOrThrow({ code: "500" }, "The work")).toThrow(
      /the database refused the read/,
    );
  });

  it("no error at all is not a failure", () => {
    expect(failSoftOrThrow(null, "The work")).toBe(true);
  });
});

describe("listTracks tells a failure from an empty board", () => {
  it("the swallow is gone", () => {
    expect(CODE).not.toContain("if (error || !data) return [];");
  });

  it("and it names what could not be read, in a person's words", () => {
    expect(CODE).toContain('failSoftOrThrow(error, "The work in flight")');
  });

  it("an empty result is still an empty board, not an error", () => {
    // The fix must not turn "you have no open work" into a failure. That is a
    // real and common state and it has its own honest sentence on the surface.
    expect(CODE).toContain("(data ?? [])");
  });
});

describe("getTrack no longer reports an unreadable track as a missing one", () => {
  it("it destructures error at all, which it did not before", () => {
    expect(CODE).toContain("const { data: row, error } = await supabase");
  });

  it("and raises rather than returning null", () => {
    expect(CODE).toContain('failSoftOrThrow(error, "This piece of work")');
  });

  it("a genuinely absent track is still null", () => {
    // "This work does not exist" is a true and necessary answer. The defect was
    // saying it about work that does.
    expect(CODE).toContain("return row ? rowToTrack(row as unknown as TrackRow) : null;");
  });
});

describe("the bare catches cannot swallow the distinction", () => {
  it("neither catch discards a read failure", () => {
    /*
     * `catch { return [] }` and `catch { return null }` would have swallowed the
     * throw along with everything else, making the whole fix invisible while
     * every test above still passed. This is the half most likely to be lost in
     * a later refactor.
     */
    expect(CODE).not.toContain("} catch {\n      return [];");
    expect(CODE).not.toContain("} catch {\n      return null;");
    /*
     * ── FOUR SINCE 2026-09-03, AND EACH ONE IS THE RULE SPREADING ────────────
     * This counted two, and it is a canary rather than a cap: a new soft-catch
     * in this file has to be REVIEWED before the number moves, because the
     * whole point is that a read failure must not leave through one.
     *
     * The third is `listRunsForStart`, which feeds `/start`'s run rows. It is
     * the same shape as the two above and for the sharper reason: those rows are
     * the front door's whole content, so "you have no runs" and "we could not
     * read your runs" are the two sentences a person must never see confused.
     * Reviewed 2026-09-02: it re-raises the read failure and degrades only on
     * something genuinely unexpected.
     *
     * The fourth is `listMovingTracks` (P-18, A-QUEUE.md), which feeds the
     * shell top bar's "N runs are moving". Same shape, same reason: "nothing is
     * moving" and "we could not tell what is moving" are different facts, and
     * the header is the highest-traffic surface in the product for a false
     * calm to hide in. Reviewed 2026-09-03: it re-raises on a genuine read
     * failure and degrades to an empty list only on something unexpected, the
     * same split every catch above already keeps.
     *
     * The fifth is `listGatesOnTracks` (P-18a, A-QUEUE.md), which feeds the
     * same header's "N decisions are ready for you" -- the sentence beside
     * the one the fourth entry names, on the same surface, for the same
     * reason: "nothing needs you" and "we could not tell what needs you" must
     * never collapse into one silence. Reviewed 2026-09-03: it re-raises on a
     * genuine read failure and degrades to an empty list only on something
     * unexpected, the same split every catch above already keeps.
     *
     * The sixth is `listProductRepos` (P-16b, A-QUEUE.md), which feeds
     * Start's own composer -- which product a sentence matches against.
     * "This product has no known repo" and "we could not read your
     * products' repos" are different facts too: the first is silent (the
     * picker just offers nothing), the second would otherwise look
     * identical while quietly matching against a stale or empty list.
     * Reviewed 2026-09-03: it re-raises on a genuine read failure and
     * degrades to an empty list only on something unexpected, the same
     * split every catch above already keeps.
     *
     * The seventh is `listProductGoals` (P-85, A-QUEUE.md), which feeds
     * Start's middle example tier -- a product's own stated goal. "This
     * product has no stated goal yet" and "we could not read your
     * products' goals" are different facts for the same reason the sixth
     * is: the first falls through to the generic tier silently, the
     * second would otherwise look identical while quietly showing generic
     * examples for a read that actually failed. Added 2026-09-04: it
     * re-raises on a genuine read failure and degrades to an empty list
     * only on something unexpected, the same split every catch above
     * already keeps.
     */
    /* WAS 7, NOW 8 (P-127): `listRunningNow` joined them. It asks `agent_runs`
       what is working, and returning an empty list on a failed read would have
       been this very defect committed inside the packet that exists to remove
       it -- the header saying "Nothing running" for a second, quieter reason. */
    /*
     * WAS 8, NOW 10 (Lane 2, 2026-09-09), and this is a RATCHET that only ever
     * goes up: every entry is one more place where a refused read stopped
     * wearing the empty state's clothes.
     *
     * The ninth is `readTrackChain`, the run screen's right pane. It
     * destructured no `error` from either of its two reads and wrapped the rest
     * in a bare catch, so an expired JWT or an RLS refusal resolved as a
     * SUCCESSFUL `{ track: null, chain: empty }`. The pane's own honest
     * branches never fired and it landed on its last resort: **"That work could
     * not be found." in red, with no control, under a header that was drawing
     * the run's title, its status chip and its road**, because the route's own
     * `getTrack` had succeeded. That sentence can never be true in that
     * position -- the route unmounts both panes for a genuinely absent row
     * before they render -- so a read failure was the only way to produce it.
     *
     * The tenth is `getTrackArtifacts`, its sibling. Same bare catch, and its
     * empty answer is read by two surfaces that both then say something false:
     * every station panel reads "has not run yet", and the header's road draws
     * all seven stops as `pending`, so a FINISHED run reads as one that never
     * started, under a chip saying Finished. A person following a shared
     * `?artifact=` link is told the run does not hold that artifact -- the one
     * case where they arrived with a reason to believe it does.
     */
    expect(CODE.split('e.message.includes("could not be read")').length - 1).toBe(10);
  });

  it("but anything genuinely unexpected still degrades rather than breaking every surface", () => {
    expect(CODE).toContain("return [];");
    expect(CODE).toContain("return null;");
  });
});
