import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { stillWaiting } from "../query-state";

/**
 * A RETURNING USER WAS TOLD TO CONNECT THEIR FIRST SOURCE.
 *
 * SEEN IN A BROWSER ON PRODUCTION, 2026-08-06, at supaprod.ai/discover. The
 * workspace held 97 signals, 41 themes and 34 opportunities. For a beat after
 * load the surface rendered the FIRST-RUN screen -- "No opportunities found
 * yet.", "Which source should it read first?", "Connect a source" -- while the
 * spine directly above it read "79 runs waiting on you" and the right column
 * listed five live sources with counts. Two panels of the same screen disagreed
 * about whether the workspace had ever been used.
 *
 * Nothing in the repo could have caught this. tsc passed, 8,037 tests passed,
 * the build was clean, and the surface renders correctly once the data lands.
 * It took opening the page and watching it load.
 *
 * WHY `isLoading` MISSED IT. react-query v5 defines `isLoading` as
 * `isPending && isFetching`, so it is false whenever a query is pending but not
 * actively fetching, and false the moment a fetch resolves -- including a fetch
 * that resolves SUCCESSFULLY WITH NOTHING, which is what a read scoped by RLS
 * returns if it lands before the Supabase session is restored. No error either,
 * so the error branch does not fire and every `length === 0` branch reads as
 * "this workspace is empty".
 *
 * SIX SURFACES HAD IT, and five of them are stations: Discover, Decide, Build,
 * Ship, Learn, Today. Each owns a first-run or empty state, so each could tell
 * an established user they had nothing.
 */

describe("stillWaiting refuses to call an absent answer 'none'", () => {
  const answered = { isPending: false, data: { rows: [1, 2, 3] } };

  it("waits while a query is pending", () => {
    expect(stillWaiting({ isPending: true, data: undefined })).toBe(true);
  });

  it("waits while a query is PENDING BUT NOT FETCHING", () => {
    // The case `isLoading` gets wrong: paused with no network, or not yet
    // started. isLoading would be false here and the empty state would render.
    expect(stillWaiting({ isPending: true, data: undefined })).toBe(true);
  });

  it("waits when data is present but the query is STILL PENDING", () => {
    /**
     * THE CASE THAT MAKES `isPending` LOAD BEARING, and my first version of this
     * file did not have it. Planting the defect proved it: I deleted the
     * `isPending` clause from `stillWaiting` and all six of these tests still
     * passed, because in every case I had written `isPending: true` happened to
     * coincide with `data: undefined`, so the data check alone covered them.
     *
     * react-query separates them with `placeholderData`: the query is pending
     * and `data` is already defined -- with the PLACEHOLDER, not the answer.
     * Branching on it means counting rows nobody fetched. Any surface here that
     * later adopts placeholderData depends on this clause, and without this test
     * someone could delete it and see green.
     */
    expect(stillWaiting({ isPending: true, data: { rows: [] } })).toBe(true);
    expect(stillWaiting({ isPending: true, data: { rows: [1, 2] } })).toBe(true);
  });

  it("waits when a query has settled but produced no data at all", () => {
    // The RLS-before-session case. Not pending, not an error, and still no
    // answer worth rendering a verdict on.
    expect(stillWaiting({ isPending: false, data: undefined })).toBe(true);
  });

  it("stops waiting once an answer arrives, even an empty one", () => {
    // A genuinely empty workspace MUST still reach its first-run screen. If this
    // returned true the onboarding would never render and a new user would sit
    // on a spinner forever -- the opposite failure, and a worse one.
    expect(stillWaiting({ isPending: false, data: { rows: [] } })).toBe(false);
  });

  it("waits for the SLOWEST of several queries", () => {
    // The specific shape on Discover: the headline counts signals and the
    // ranking counts themes. Waiting on one still lets the other read as empty.
    expect(stillWaiting(answered, { isPending: true, data: undefined })).toBe(true);
    expect(stillWaiting({ isPending: true, data: undefined }, answered)).toBe(true);
    expect(stillWaiting(answered, answered)).toBe(false);
  });

  it("is not waiting when given nothing to wait for", () => {
    expect(stillWaiting()).toBe(false);
  });
});

const ROOT = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/** Every surface that derives a `loading` flag guarding an empty state. */
const SURFACES = [
  ["Discover", "components/discover/DiscoverSurface.tsx"],
  ["Decide", "routes/_authenticated.decide.tsx"],
  ["Build", "routes/_authenticated.build.index.tsx"],
  ["Ship", "routes/_authenticated.ship.tsx"],
  ["Learn", "routes/_authenticated.learn.tsx"],
  ["Today", "routes/_authenticated.today.tsx"],
] as const;

describe("no station decides it is empty on an answer it never got", () => {
  for (const [name, rel] of SURFACES) {
    it(`${name} derives loading from stillWaiting`, () => {
      expect({ name, uses: /const loading = stillWaiting\(/.test(read(rel)) }).toEqual({
        name,
        uses: true,
      });
    });
  }

  for (const [name, rel] of SURFACES) {
    it(`${name} does not fall back to isLoading for that flag`, () => {
      // The exact line that caused it. A second `loading` derived from isLoading
      // would reintroduce the defect while this file still passed.
      expect({ name, reverted: /const loading = \w+\.isLoading/.test(read(rel)) }).toEqual({
        name,
        reverted: false,
      });
    });
  }

  it("Discover waits on BOTH of its datasets, not just the one it counts", () => {
    // Its headline counts signals; its ranking counts themes. This is the file
    // where passing too few queries would be easiest to do and hardest to see.
    expect(read("components/discover/DiscoverSurface.tsx")).toMatch(
      /const loading = stillWaiting\(signals, themes\)/,
    );
  });
});

/**
 * THE RULE ABOVE WAS TRUE OF ONE FLAG PER FILE, AND THE BUG WENT ON SHIPPING.
 *
 * Everything above this line asserts that a surface CONTAINS the string
 * `stillWaiting` in `const loading = ...`. /ship contained it -- and used that
 * flag for its HEADLINE, which is the one thing on the station that was never
 * going to tell anybody their record was empty. Six other branches decide
 * exactly that, and on 2026-08-06 five of them read `isLoading` and the sixth
 * read nothing at all, so this file passed over the defect for the whole of its
 * life. It was found by reading the file, not by running the suite:
 *
 *   `posts.isLoading ?` guarded the Gate, so the largest element on the station
 *   opened every session asking "Write the first announcement?".
 *   `changelog.isLoading ?` guarded the release list, so it said "Nothing has
 *   shipped yet." -- to the 8 workspaces that hold changelog entries as readily
 *   as to a new one (8 entries across 8 workspaces, queried 2026-08-06).
 *   `changelog.isLoading || deployments.isLoading` guarded both deploy blocks:
 *   "No deploy is on the record yet." and "Nothing is in production yet."
 *   The Announcements block had no wait at all and branched on list length.
 *   `docReading` alone was already right, because it spells out `!wid`.
 *
 * Every one of those queries is `enabled: !!wid`, so none of this was a race:
 * `isLoading` is `isPending && isFetching`, a disabled query is pending WITHOUT
 * fetching, and the false sentence was the first frame of every session.
 *
 * WHAT THIS ASSERTS INSTEAD: not that the helper is mentioned somewhere, but
 * that `.isLoading` is never the last test standing between a read and a
 * verdict about it. That is a property of the whole file, so a second call site
 * cannot hide behind a first.
 *
 * WHY IT MEASURES A COMMENT-STRIPPED COPY. This repo has produced several
 * source-text tests that found their own explanatory prose and passed on it --
 * these files describe the defect at length, so a rule that searched the raw
 * text would match the paragraph warning against it. `code()` strips comments,
 * and both the stripper and the pattern are proved against planted strings
 * below rather than assumed.
 */

/** Source with comments removed, so a rule can never be satisfied by prose
 *  ABOUT the rule. Same treatment ship-mounts-the-release-document.test.ts uses. */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

/** `.isLoading` used as the branch test itself -- the shape that renders an
 *  empty state over a read that has not answered. `x.isLoading || !selected`
 *  is deliberately NOT this: there the last test is of the DATA, which is the
 *  question `stillWaiting` asks, and the wait is carried by that clause. */
const ISLOADING_IS_THE_BRANCH = /\.isLoading\s*\?/;

/** The two files this pass locked. Both mount the release acts, and both had
 *  the defect. Ship is checked whole-file; ChangesPanel at the one guard that
 *  owns an empty answer (see the diff note in that describe). */
const LOCKED = [
  ["Ship", "routes/_authenticated.ship.tsx"],
  ["Studio changes", "components/studio/ChangesPanel.tsx"],
] as const;

/**
 * Surfaces that still guard a wait on `.isLoading` alone, counted on
 * 2026-08-06 and allowed only to shrink:
 *
 *   Discover, DiscoverSurface.tsx -- the merge picker's "Open bets" list.
 *     `opportunities` is `enabled: picking`, so on the first frame after the
 *     picker opens the query is pending and not yet fetching, and the block
 *     renders "There are no bets yet, so there is nothing to merge into."
 *   Learn, _authenticated.learn.tsx -- the record Block, `ledgerQ.isLoading ?`,
 *     falling through to "Nothing has come back yet." That query carries no
 *     `enabled` gate, so it is the narrower window (paused, offline, or the
 *     instant a fetch resolves) rather than every first paint.
 *
 * Neither file was in this pass's set. Lower the number when one is fixed.
 */
const STILL_GUARDING_ON_ISLOADING = 2;

describe("the guard is a property of the file, not of one line in it", () => {
  it("recognises the defect, and does not recognise prose about it", () => {
    // The pattern, proved against the exact shape it exists to catch...
    expect(
      ISLOADING_IS_THE_BRANCH.test(code("  ) : posts.isLoading ? (\n<Loading>x</Loading>")),
    ).toBe(true);
    // ...and the stripper, proved against the same shape inside a comment.
    // Without this, a file that merely DESCRIBES the bug would fail, and a file
    // that describes the fix would pass while carrying the bug.
    expect(
      ISLOADING_IS_THE_BRANCH.test(code("  /* it read `posts.isLoading ? (` before this. */")),
    ).toBe(false);
    expect(ISLOADING_IS_THE_BRANCH.test(code("  // it read `posts.isLoading ? (` before."))).toBe(
      false,
    );
  });

  it("strips real comments out of a real file, and leaves the code", () => {
    // The sanity check against a zero. Counted on 2026-08-06, /ship mentions
    // `.isLoading` on five lines and four of them are prose, so stripping MUST
    // reduce the count; the assertion is the inequality rather than either
    // figure, so it survives an edit to the comments. A stripper that silently
    // did nothing would make every rule below vacuous, and this is the only
    // thing standing between that and a green suite.
    const raw = read("routes/_authenticated.ship.tsx");
    const rawLines = raw.split("\n").filter((l) => l.includes(".isLoading")).length;
    const strippedLines = code(raw)
      .split("\n")
      .filter((l) => l.includes(".isLoading")).length;
    expect(rawLines).toBeGreaterThan(strippedLines);
    expect(strippedLines).toBeGreaterThan(0);
    expect(code(raw)).toContain("const docReading =");
  });

  for (const [name, rel] of LOCKED) {
    it(`${name} never lets .isLoading be the branch test`, () => {
      expect({ name, guards: ISLOADING_IS_THE_BRANCH.test(code(read(rel))) }).toEqual({
        name,
        guards: false,
      });
    });
  }

  it("Ship pairs every surviving .isLoading with stillWaiting on the same line", () => {
    // Whole-file, because the bug was three call sites agreeing with each other
    // and disagreeing with the fourth. The one line left is `docReading`, which
    // keeps `!wid || changelog.isLoading` because
    // ship-mounts-the-release-document.test.ts:83 pins that text, and adds
    // `stillWaiting(changelog)` -- the clause that actually carries the rule.
    const lines = code(read("routes/_authenticated.ship.tsx"))
      .split("\n")
      .filter((l) => l.includes(".isLoading"));
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.filter((l) => !l.includes("stillWaiting"))).toEqual([]);
  });

  it("Ship waits before each of the four verdicts that used to be wrong", () => {
    const src = code(read("routes/_authenticated.ship.tsx"));
    // The Gate, which asks the station's one question.
    expect(src).toMatch(/const postsReading = stillWaiting\(posts\)/);
    expect(src).toMatch(/\) : postsReading \?\s*\(\s*<Loading>/);
    // Both deploy blocks, over the join of two reads.
    expect(src).toMatch(/const releaseReading = stillWaiting\(changelog, deployments\)/);
    // The release list, sharing the document's flag because it is one read.
    expect(src).toMatch(
      /const docReading = !wid \|\| changelog\.isLoading \|\| stillWaiting\(changelog\)/,
    );
    expect(src).toMatch(/\{docReading \?\s*\(\s*<Loading>Reading the release notes\./);
    // The Announcements block, which had no wait at all.
    expect(src).toMatch(/\{postsReading \|\| posts\.isError \? null : announcements\.length === 0/);
  });

  it("the Studio deploy block asks the same question the same way", () => {
    // ChangesPanel is not a station, but it renders the same release acts on
    // the run and its deploy block owns an empty answer. Its one remaining
    // `.isLoading` is the diff branch, `diff.isLoading || !selected`, and that
    // is NOT this defect: `diffByPath` is built from `diff.data`, so an
    // unanswered read always leaves `selected` null and the data clause carries
    // the wait on its own. Widening it would change no reachable state.
    expect(code(read("components/studio/ChangesPanel.tsx"))).toMatch(
      /const deploymentsReading = stillWaiting\(deploymentsQ\)/,
    );
  });

  it("no NEW surface starts guarding an empty state on isLoading", () => {
    const offenders = SURFACES.filter(([, rel]) =>
      ISLOADING_IS_THE_BRANCH.test(code(read(rel))),
    ).map(([name]) => name);
    // A budget that may only go down. Two surfaces outside this pass's file set
    // still carry the shape; both are named above with what each one renders.
    expect(offenders.length).toBeLessThanOrEqual(STILL_GUARDING_ON_ISLOADING);
    expect(offenders).not.toContain("Ship");
  });
});
