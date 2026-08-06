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
