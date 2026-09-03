/**
 * Ship must say one thing on a workspace that holds nothing, not six.
 *
 * WHAT IT DID. Five Blocks, each correctly reporting its own emptiness, and FOUR of
 * them deriving that emptiness from the same `notes.length === 0` off the same
 * `changelog` read. A person opening Ship on their first day was told nothing had
 * shipped six times over: a negated H1, the announcement Gate, then "Where it is
 * live" (a heading, a paragraph of `sub`, and an `Empty` repeating the hosting
 * explanation the `sub` had just given), "Live releases", "What shipped", "The
 * release document" and "Announcements". One door on the whole screen, and it was
 * the second action of a Gate about announcements.
 *
 * WHY NO TEST CAUGHT IT. Every one of those panels is correct in isolation, and
 * every test asked "does this block behave correctly". None asked "does this page
 * still say one thing once they all decline". That is the diagnosis
 * `_authenticated.learn.tsx` wrote when the identical shape was repaired there, and
 * this file is the guard that repair should have come with.
 *
 * WHAT THIS FILE IS CAREFUL ABOUT. The dangerous half of collapsing panels is
 * collapsing them over a read that FAILED: a failed read also has zero rows, so a
 * condition written on emptiness alone would replace a reachable `Failed` and its
 * retry with a confident first-run screen. Most of what follows pins that the
 * condition cannot be satisfied without every read having answered.
 */
import { readFileSync } from "node:fs";

import { describe, expect, it } from "bun:test";

const src = readFileSync(new URL("../_authenticated.ship.tsx", import.meta.url), "utf8");

/** The source of the `stationEmpty` declaration, up to its semicolon. */
function stationEmptyDecl(): string {
  const start = src.indexOf("const stationEmpty =");
  expect(start, "stationEmpty is gone, so the first-run screen has no condition").toBeGreaterThan(
    -1,
  );
  return src.slice(start, src.indexOf(";", start));
}

/** Boolean helpers with sentences: `expect(src).toContain(x)` dumps 3,000 lines. */
const has = (needle: string) => src.includes(needle);

describe("the first-run screen only draws when every read has answered", () => {
  const decl = stationEmptyDecl();

  it("requires the changelog to have succeeded, not merely to be empty", () => {
    expect(decl.includes("changelog.isSuccess"), "an unread changelog would read as empty").toBe(
      true,
    );
  });

  it("requires the deploy read to have succeeded too", () => {
    // A workspace can hold deploy rows with no release notes, and in that state the
    // panels carry the only explanation of why nothing is listed. The first-run
    // screen would be false there.
    expect(decl.includes("deployments.isSuccess")).toBe(true);
    expect(decl.includes("deployRows.length === 0")).toBe(true);
  });

  it("requires the merge list to be known, so a merge waiting on notes keeps the panels", () => {
    expect(decl.includes("mergesKnown")).toBe(true);
    expect(decl.includes("unlisted.length === 0")).toBe(true);
  });

  it("requires the announcements read to have answered", () => {
    expect(decl.includes("posts.isSuccess")).toBe(true);
    expect(decl.includes("announcements.length === 0")).toBe(true);
  });

  it("stands down on any failed read, which is the direction it must be wrong in", () => {
    // At worst a person sees the old noise. They must never see a confident story
    // about a workspace built from a question that never got an answer.
    expect(
      decl.includes("!releaseErrored"),
      "a failed release read would collapse the panels",
    ).toBe(true);
    expect(decl.includes("!applied.isError")).toBe(true);
    expect(decl.includes("!posts.isError")).toBe(true);
  });
});

describe("what it says instead", () => {
  it("says what arrives rather than restating what is absent", () => {
    // The old screen was a negation agreed with six times. A person could read all
    // of it and still not know what the station is for. P-53 moved this card
    // from `Gate` to `Quiet`, whose `says` is a statement rather than a
    // question (its own header: "No question mark; a period") -- so the old
    // question-shaped headline is now the fact it was reporting.
    expect(has('says="Nothing has come here to ship yet."')).toBe(true);
  });

  it("names the precondition a person cannot infer", () => {
    // The hosting split is the one fact that changes what a person should expect,
    // and it is the sentence absenceSentence already carried.
    expect(has("For a repo Supaprod hosts, a merged change deploys a preview on its own")).toBe(
      true,
    );
  });

  it("says the promote is a person's call, because that is the station's whole shape", () => {
    // release.publish is floored at review in three places. A first-run screen that
    // did not say so would let a reader assume an agent ships on its own.
    expect(has("Promoting is always a person")).toBe(true);
  });

  it("hands over two doors, one primary, the way Learn does", () => {
    // P-14 (A-QUEUE.md, R-34): /build and /plan are both deleted, so both
    // doors this test originally pinned as DISTINCT destinations now land on
    // the same page (Start carries the live block and specs in flight
    // together). Still two Action buttons, still one primary, worth keeping
    // that shape even though the destination collapsed -- the copy still
    // frames two different questions ("what is being built" / "the specs"),
    // and this page is itself blocked for deletion behind P-14b, so a
    // redesign of the buttons themselves is out of this sweep's scope.
    expect(has("See what is being built")).toBe(true);
    expect(has("Open the specs")).toBe(true);
    expect(has("navigate({ to: SIGNED_IN_HOME })")).toBe(true);
  });

  it("draws what a release will look like, and says three times that it is not one", () => {
    // Discover's empty desk established this and measured it: "example" is the
    // highest-frequency term across 5.72M words of operator conversation.
    expect(has('title="What a release will look like here"')).toBe(true);
    expect(has("A drawing, not a release.")).toBe(true);
    expect(has("<b>Illustration</b>")).toBe(true);
  });

  it("keeps the drawing unclickable, so it can never be mistaken for a row", () => {
    // The one thing this product must never do is put invented rows where real ones
    // go. The illustration Row carries no onClick, which is what makes it a div.
    const start = src.indexOf('title="What a release will look like here"');
    // `</Region>` since the Meridian port: `Block` is the retired primitive and
    // `Region` is the same frame with a real heading. If this ever fails to find
    // a closer the slice silently becomes the rest of the file, so it is
    // asserted rather than trusted -- an unfound closer made every check below
    // read the whole page and pass or fail for the wrong reason.
    const end = src.indexOf("</Region>", start);
    expect(end, "the illustration's region has no closing tag").toBeGreaterThan(start);
    const drawing = src.slice(start, end);
    expect(drawing.includes("onClick"), "the illustration is clickable").toBe(false);
    // Controls, not the word: the legend explains what a promote is, and prose about
    // a capability is exactly what an illustration is for. What must be absent is
    // anything pressable.
    expect(drawing.includes("<button"), "the illustration carries a raw button").toBe(false);
    expect(drawing.includes("<Button"), "the illustration carries a Button").toBe(false);
    expect(drawing.includes(".mutate("), "the illustration can start a write").toBe(false);
    expect(drawing.includes("action="), "the illustration has a row action").toBe(false);
  });
});

describe("what it must not take away", () => {
  it("leaves the composer reachable, because writing early is allowed here", () => {
    // The surface deliberately permits an announcement before anything has shipped
    // ("Write one anyway"). A first-run screen must not close a door somebody has
    // already walked through.
    expect(has("stationEmpty && !composing")).toBe(true);
  });

  it("keeps every panel's own empty branch for the states that still need them", () => {
    // The panels are suppressed, never deleted. A workspace with deploys and no
    // notes still needs all of this prose, and ship-mounts-the-release-document
    // pins the document branch by text.
    expect(has("No deploy is on the record yet.")).toBe(true);
    expect(has("Nothing is in production yet.")).toBe(true);
    expect(has("Nothing has shipped yet.")).toBe(true);
    expect(has("<NoReleaseYet />")).toBe(true);
  });

  it("suppresses exactly the four panels that would repeat the one fact", () => {
    // Four, and the count is the assertion: "Merged, not listed yet" already draws
    // nothing when there is nothing missing, and "Announcements" is empty by the
    // same condition, so wrapping either would be dead code.
    const wraps = src.split("{stationEmpty ? null : (").length - 1;
    expect(wraps, "the number of suppressed panels changed").toBe(4);
  });

  it("does not let two gates ask about the same absence", () => {
    // The announcement Gate's nothingShipped arm still owns the case where
    // something HAS shipped and only the announcements are empty. It must not draw
    // beside the first-run screen.
    expect(has("NOT DRAWN AT ALL WHEN THE FIRST-RUN SCREEN IS UP")).toBe(true);
  });
});
