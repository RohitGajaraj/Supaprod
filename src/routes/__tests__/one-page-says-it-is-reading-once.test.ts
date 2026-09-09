/**
 * FIVE REGIONS EACH ANNOUNCED THEIR OWN READ, AND EVERY ONE WAS CORRECT.
 *
 * Read on the served build, arriving cold at `d1168015`:
 *
 *   the heading         This piece of work / Reading the run.
 *   the consent card    Checking whether this run needs you.
 *   the Now card        [Reading]
 *   the transcript      Reading what happened.
 *   the artifact pane   Reading what this work has made.
 *
 * Five sentences saying one thing. Nothing on the page was wrong, which is why
 * nothing caught it: this is the class of defect that exists only BETWEEN
 * elements, and every guard in this repo asserts about a thing rather than
 * about a thing and its neighbour.
 *
 * ── WHY THIS ASSERTS THE COMPOSITION AND NOT THE COPY ─────────────────────
 * Each of those four region lines is the ONLY thing waiting in some other
 * state. A transcript still reading under a loaded header genuinely needs to
 * say so, and deleting its line would make that case silent -- the same hole
 * S1 and I made once already, trimming one sentence from both sides until
 * nothing said why a run had stopped.
 *
 * So the copy stays and the composition changes: while the run itself is
 * unread there is nothing for a pane to be ABOUT, so the panes are not drawn
 * and the heading above is the only thing speaking.
 *
 * This reads the route's source because the property is structural -- does the
 * pane wrapper sit behind the track read -- and mounting the route to prove it
 * would need a router, a query client and four server functions to answer a
 * question the file itself states.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

/* `fileURLToPath`, not `.pathname`: this repo lives under a path with spaces,
   and a URL's pathname keeps them percent-encoded, so the read fails with
   ENOENT on a file that is plainly there. */
const SRC = readFileSync(
  fileURLToPath(new URL("../_authenticated.track.$trackId.tsx", import.meta.url)),
  "utf8",
);

describe("the page stops narrating on top of its regions", () => {
  it("says nothing extra while the run is being read", () => {
    // The least specific of the five. Each region below names what IT is
    // reading; this only named the page.
    expect(SRC).toContain("trackQ.isLoading\n                ? undefined");
  });

  it("and still says what a FAILED read means, which is a different sentence", () => {
    // "Could not read" and "still reading" are three different states with
    // "not there" -- the note above this heading has been repaired for
    // collapsing them before.
    expect(SRC).toContain("The run itself is untouched");
  });
});

describe("what it must not become", () => {
  it("the panes are NOT held back while the run reads", () => {
    /*
     * The first attempt gated the pane wrapper on `trackQ.isLoading`, and
     * `a-null-under-a-heading-is-a-broken-promise` refused it. That guard is
     * right: a heading over an empty field reads as "this is empty" rather than
     * "this is loading", and they are different sentences.
     *
     * It is also the principle this product states one level up, in
     * `_authenticated.tsx` -- the tree keeps its shell and waits inside the
     * work region. The run screen keeps its panes for the same reason, which is
     * why the fix was the narration and not the mounting.
     */
    expect(SRC).not.toContain("{trackQ.isLoading ? null : (");
  });

  it("and the region lines are NOT deleted", () => {
    /*
     * The complement, and the half that is easy to lose. Each of those lines is
     * the only thing waiting in some other state; silencing them would trade a
     * page that says one thing five times for panes that say nothing when they
     * are genuinely the last thing reading. That is the hole S1 and I made once
     * already, trimming one sentence from both sides until nothing said why a
     * run had stopped.
     */
    const lines = [
      "src/components/spine/TrackActivity.tsx",
      "src/components/track/ArtifactPane.tsx",
      "src/components/track/TrackConsent.tsx",
    ].map((f) => readFileSync(fileURLToPath(new URL(`../../../${f}`, import.meta.url)), "utf8"));
    expect(lines[0]).toContain("Reading what happened.");
    expect(lines[1]).toContain("Reading what this work has made.");
    expect(lines[2]).toContain("Checking whether this run needs you.");
  });
});
