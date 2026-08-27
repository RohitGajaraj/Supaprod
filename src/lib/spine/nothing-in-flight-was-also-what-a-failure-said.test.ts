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
    expect(CODE.split('e.message.includes("could not be read")').length - 1).toBe(2);
  });

  it("but anything genuinely unexpected still degrades rather than breaking every surface", () => {
    expect(CODE).toContain("return [];");
    expect(CODE).toContain("return null;");
  });
});
