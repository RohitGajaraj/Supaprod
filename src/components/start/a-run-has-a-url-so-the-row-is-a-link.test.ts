/**
 * ── WORK WITH AN ADDRESS MUST BE REACHABLE THE WAY ADDRESSES ARE ──────────
 *
 * WALKED ON THE SERVED HOME, 2026-09-10, following one piece of work from the
 * entry into its run. Every row under "Your runs" was a `<button>`, and the
 * handler behind it was:
 *
 *   const openRun = (trackId) =>
 *     void navigate({ to: "/track/$trackId", params: { trackId }, search: {} })
 *
 * A navigation and nothing else. So a run that HAS a URL was reachable only by
 * a left click that replaces the page: no cmd-click, no middle-click, no "copy
 * link address", no destination in the status bar on hover, and no back-button
 * expectations that hold. On the one screen whose whole purpose is showing
 * several runs at once, a person could not open two of them side by side.
 *
 * ── WHY THIS IS THE JOURNEY DEFECT AND NOT AN ACCESSIBILITY NIT ───────────
 * The founder's complaint is that *"nothing joins up"* and *"the journey is
 * broken"*. A row that cannot be opened in a second tab is a joint that only
 * works in one direction: you may go in, and coming back means losing where you
 * were. That is the through-line failing at its most-travelled edge, and it is
 * invisible to every check that looks at one screen at a time -- both screens
 * are correct, and the passage between them is not.
 *
 * ── WHAT IS PINNED HERE ───────────────────────────────────────────────────
 * Not the markup. Three claims: the row navigates by ADDRESS rather than by
 * handler; the controls beside it stay siblings (an anchor may not contain a
 * button, and this branch is the only reason the fix is even possible); and
 * `Row` still renders a plain button when a press does something that is not a
 * navigation, because turning every row into a link would be the same mistake
 * pointing the other way.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROWS = readFileSync(join(import.meta.dir, "..", "meridian", "rows.tsx"), "utf8");
const YOUR_RUNS = readFileSync(join(import.meta.dir, "YourRuns.tsx"), "utf8");

describe("a run row is an address, not a handler", () => {
  it("hands `Row` a destination instead of an open-this callback", () => {
    /*
     * PINNED ON THE PROP, NOT THE SPELLING OF THE ROUTE. What must not come
     * back is the row asking JavaScript to move the page; which route it names
     * is the surface's business and may change.
     */
    /* A BOOLEAN, NOT `toContain` ON THE WHOLE FILE. A failing `toContain`
       here printed all 400 lines of YourRuns.tsx into the run output, which
       buries the one line that says what broke. */
    expect({
      navigatesByAddress: YOUR_RUNS.includes('navigateTo={{ to: "/track/$trackId"'),
    }).toEqual({
      navigatesByAddress: true,
    });
    const rowBlock = YOUR_RUNS.slice(YOUR_RUNS.indexOf("<Row"), YOUR_RUNS.indexOf("action={"));
    expect(
      { readableRegionUsesAHandler: rowBlock.includes("onClick=") },
      "the readable region went back to a click handler; it navigates, so it is a link",
    ).toEqual({ readableRegionUsesAHandler: false });
  });

  it("still lets a CONTROL be a control: the trailing actions stay handlers", () => {
    // The mirror. If this file ever pushed every press through a URL the row
    // would lose Answer and Why it stopped, which are not navigations.
    expect({ controlsStayHandlers: YOUR_RUNS.includes("onClick={() => onAsk(r.id)}") }).toEqual({
      controlsStayHandlers: true,
    });
  });
});

describe("the primitive can draw either, and nests neither inside the other", () => {
  it("renders the readable region as a Link when a destination is given", () => {
    expect({ present: ROWS.includes("navigateTo ? (") }).toEqual({ present: true });
    expect({ present: ROWS.includes("<Link") }).toEqual({ present: true });
  });

  it("keeps the controls OUTSIDE the region, which is why this is legal at all", () => {
    /*
     * An <a> may not contain a <button>. The branch this lands in already put
     * the action cluster after the closing tag of the readable region, as a
     * sibling; that pre-existing decision is load-bearing for the link, so it
     * is asserted here rather than left to be re-derived.
     */
    const branch = ROWS.slice(ROWS.indexOf("if ((onClick || navigateTo) && action)"));
    const region = branch.indexOf("{navigateTo ? (");
    const closes = branch.indexOf("</Link>");
    const actions = branch.indexOf("{action}");
    expect({ ordered: region < closes && closes < actions }).toEqual({ ordered: true });
  });

  it("still renders a button when the press is not a navigation", () => {
    // Rows that toggle, select or run something must stay buttons; a link that
    // goes nowhere is the same defect facing the other way.
    expect({ present: ROWS.includes('const Tag = interactive ? "button" : "div";') }).toEqual({
      present: true,
    });
  });

  it("takes ONE destination, never both a handler and an address", () => {
    // Two navigations on one press is how a row comes to disagree with itself
    // about where it goes. The Link branch is checked first, deliberately.
    const branch = ROWS.slice(ROWS.indexOf("if ((onClick || navigateTo) && action)"));
    expect(branch.indexOf("{navigateTo ? (")).toBeLessThan(branch.indexOf("onClick={onClick}"));
  });
});
