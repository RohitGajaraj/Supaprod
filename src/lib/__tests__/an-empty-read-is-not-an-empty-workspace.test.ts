import { describe, it, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { stillWaiting, waitingOnNothing } from "../query-state";

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

  it("STOPS waiting once a read has FAILED, because an error is an answer", () => {
    /**
     * THE CASE THE TYPE COULD NOT EXPRESS UNTIL 2026-08-11, which is why it was
     * wrong for five days rather than caught here.
     *
     * react-query v5 settles a query that fails with nothing cached into
     * `status: 'error'`: `isPending` goes false and `data` STAYS undefined. That
     * is byte-for-byte the state asserted directly above — so with the old
     * two-field `AnswerableQuery` these two tests were THE SAME TEST, and the
     * stub had no way to say which situation it meant. The helper returned true
     * for ever after a cold failure, every surface that asked before its error
     * arm sat on a permanent skeleton, and each `<Failed>` sentence and retry
     * button underneath was unreachable dead code.
     *
     * Three surfaces met it independently — build.index.tsx and HeldClaims.tsx
     * hung on it, and ship.tsx worked around it locally at `docReading` and
     * documented the workaround at length. One defect found three times from the
     * outside is a wrong SHAPE, not three mistakes.
     */
    expect(stillWaiting({ isPending: false, data: undefined, isError: true })).toBe(false);
  });

  it("still waits on a PENDING query even if a SIBLING has failed", () => {
    // Only the failed query stands down. A surface must not start rendering
    // verdicts about a dataset that is genuinely still in flight just because
    // some other read gave up first.
    expect(
      stillWaiting(
        { isPending: false, data: undefined, isError: true },
        { isPending: true, data: undefined },
      ),
    ).toBe(true);
  });

  it("does not treat a missing isError as an error", () => {
    // `isError` is OPTIONAL so the hand-rolled stubs in this file keep meaning
    // what they meant. If an omitted flag read as truthy, every assertion above
    // would invert and this guard would wave through the exact 2026-08-06
    // incident it exists to prevent.
    expect(stillWaiting({ isPending: true, data: undefined, isError: false })).toBe(true);
    expect(stillWaiting({ isPending: false, data: undefined, isError: false })).toBe(true);
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
  // "Decide" left this list (P-14, A-QUEUE.md, R-34): /decide is now a
  // redirect stub with no loading state of its own to derive.
  ["Build", "routes/_authenticated.build.index.tsx"],
  ["Ship", "routes/_authenticated.ship.tsx"],
  ["Learn", "routes/_authenticated.learn.tsx"],
  // EDITED BY S2 IN ANOTHER LANE'S PREFIX, authorised by name in
  // `coordination/answers/S0-A03-land-all-four-in-one-commit-and-the-three-lines-are-authorised.md`.
  // One line, and only the SUBJECT of the assertion: the board moved out of the
  // route file into `src/components/today/Board.tsx`. The claim is untouched.
  ["Today", "components/today/Board.tsx"],
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
 *  the defect. BOTH are checked whole-file by the loop below -- a second call
 *  site cannot hide behind a first in either. ChangesPanel additionally has its
 *  one guard pinned by name further down (see the diff note in that describe). */
const LOCKED = [
  ["Ship", "routes/_authenticated.ship.tsx"],
  ["Studio changes", "components/studio/ChangesPanel.tsx"],
] as const;

/**
 * ZERO SURFACES NOW GUARD A WAIT ON `.isLoading` ALONE. This started at 2 when
 * the pass that wrote this test locked Ship and Studio changes and could not
 * reach the other two; both were closed on 2026-08-06 and the number came down
 * with each. It may only go down, and it is now at the floor: any surface that
 * reintroduces the shape fails the check below rather than spending a budget.
 *
 *   Discover, DiscoverSurface.tsx -- the merge picker's "Open bets" list, and
 *     the WIDER of the two windows, which is why it went first. Its
 *     `opportunities` query is `enabled: picking`, so on the first frame after
 *     the picker opens it is pending and not yet fetching: `isLoading` false,
 *     `data` undefined, and the block rendered "There are no bets yet, so there
 *     is nothing to merge into." An errored read said the same thing forever.
 *   Learn, _authenticated.learn.tsx -- the record Block, falling through to
 *     "Nothing has come back yet" on the station that IS the record. Its
 *     headline went with it: every number there is derived, so an unanswered
 *     read produced not a blank but confident zeroes.
 *
 * Both now read `isError` first and `stillWaiting` second, the order Ship uses,
 * because a failed read also leaves `data` undefined and would otherwise wait
 * forever rather than say what broke.
 */
const STILL_GUARDING_ON_ISLOADING = 0;

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
    /* `Loading` OR `Reading`: the retired component and its Meridian replacement.
       What this pins is that the surface WAITS before it renders a verdict, not
       which component draws the wait. Ship moved to `Reading` on 2026-08-18 and
       this went red while the behaviour it protects never changed. */
    expect(src).toMatch(/\) : postsReading \?\s*\(\s*<(?:Loading|Reading)>/);
    // Both deploy blocks, over the join of two reads.
    expect(src).toMatch(/const releaseReading = stillWaiting\(changelog, deployments\)/);
    // The release list, sharing the document's flag because it is one read.
    expect(src).toMatch(
      /const docReading = !wid \|\| changelog\.isLoading \|\| \(stillWaiting\(changelog\) && !changelog\.isError\)/,
    );
    expect(src).toMatch(/\{docReading \?\s*\(\s*<(?:Loading|Reading)>Reading the release notes\./);
    // The Announcements block, which had no wait at all.
    expect(src).toMatch(/\{postsReading \|\| posts\.isError \? null : announcements\.length === 0/);
  });

  it("a failed changelog read still reaches Failed, on both halves of the one read", () => {
    /**
     * THE HALF-FIX THIS RULE ALMOST SHIPPED, and the reason the clause above is
     * not decoration. Widening `docReading` with `stillWaiting(changelog)`
     * closed the false empty state and opened a worse hole in the same line:
     * `stillWaiting` is `isPending || data === undefined`
     * (src/lib/query-state.ts:52), and a read that failed with nothing cached
     * leaves `data` undefined for good, so the flag was TRUE in the error state
     * for ever. Both consumers test the flag BEFORE `changelog.isError`, so
     * `Failed` and its refetch button became unreachable on a cold failure and
     * the section held a spinner instead -- strictly worse than the empty state
     * the widening was for, because a spinner never ends.
     *
     * TWO HALVES, because neither catches it alone. The wait must stand down in
     * the error state (the line pinned above), AND the error arm must be the
     * next test after the wait in both places, which is what makes standing
     * down load bearing. `ship-mounts-the-release-document.test.ts` states the
     * rule -- "a failed changelog read must reach Failed and never
     * NoReleaseYet" -- and pins only the branch ORDER, which is why the order
     * held while the semantics moved underneath it.
     */
    const src = code(read("routes/_authenticated.ship.tsx"));
    const blocks = src.split("{docReading ? (").slice(1);
    expect(blocks.length).toBe(2); // the release list, and the release document
    for (const b of blocks) expect(b.slice(0, 240)).toContain(") : changelog.isError ? (");
    expect(src).toContain("stillWaiting(changelog) && !changelog.isError");
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

describe("a query that will never run is not a query you are waiting on", () => {
  /**
   * THE HANG, pinned. `enabled: false` leaves a react-query v5 result at
   * `isPending: true, isError: false, data: undefined, fetchStatus: "idle"` for
   * the entire life of the component. That satisfied every clause of
   * stillWaiting, so a surface whose precondition was missing sat in front of a
   * permanent spinner with no error text and no retry.
   *
   * Measured on production 2026-08-14: Today's three reads are all
   * `enabled: Boolean(workspaceId)`, and activeWorkspaceId is null for a user in
   * zero workspaces. needsOnboarding keys on profiles.onboarded rather than on
   * membership and returns false on a read error, so that user reaches Today.
   */
  const disabled = {
    isPending: true,
    isError: false,
    data: undefined,
    fetchStatus: "idle",
  } as const;

  test("a disabled query does not hold the surface in a wait", () => {
    expect(stillWaiting(disabled)).toBe(false);
  });

  test("and waitingOnNothing names what is actually true", () => {
    expect(waitingOnNothing(disabled)).toBe(true);
  });

  /**
   * THE NARROWNESS IS THE SAFETY. Only `idle` counts. A paused query is offline
   * and will retry, and a fetching one is on its way; reporting either as
   * never-coming would render an empty state over data that is genuinely
   * arriving, which is the original defect at the top of this file.
   */
  test("a paused or in-flight query is still coming", () => {
    expect(stillWaiting({ isPending: true, data: undefined, fetchStatus: "paused" })).toBe(true);
    expect(stillWaiting({ isPending: true, data: undefined, fetchStatus: "fetching" })).toBe(true);
  });

  /**
   * A settled query is idle too. Without the isPending clause this would call
   * every answered query never-coming and end the wait a render early, which is
   * the same bug pointing the other way.
   */
  test("a query that has already answered is not mistaken for a disabled one", () => {
    const answered = { isPending: false, data: [1, 2], fetchStatus: "idle" } as const;
    expect(stillWaiting(answered)).toBe(false);
    expect(waitingOnNothing(answered)).toBe(false);
  });

  test("one live query among disabled ones still holds the wait", () => {
    const live = { isPending: true, data: undefined, fetchStatus: "fetching" } as const;
    expect(stillWaiting(disabled, live)).toBe(true);
    // Not ALL of them are switched off, so the surface is not missing a
    // precondition, it is mid-load.
    expect(waitingOnNothing(disabled, live)).toBe(false);
  });

  test("callers that pass no fetchStatus behave exactly as before", () => {
    // Every existing call site and stub omits it. An omitted fetchStatus must
    // never be read as idle, or this fix would end waits it has no business
    // ending.
    expect(stillWaiting({ isPending: true, data: undefined })).toBe(true);
    expect(waitingOnNothing({ isPending: true, data: undefined })).toBe(false);
  });

  test("an error still wins, because a failure is not a missing precondition", () => {
    expect(
      stillWaiting({ isPending: true, data: undefined, isError: true, fetchStatus: "idle" }),
    ).toBe(false);
  });

  test("waitingOnNothing is false when asked about nothing", () => {
    expect(waitingOnNothing()).toBe(false);
  });
});
