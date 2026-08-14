import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ROOM_TAB_META } from "@/lib/engine-room-glance";

/**
 * TWO REDIRECTS THAT LANDED SOMEWHERE REAL AND WRONG.
 *
 * This repo already holds the rule, written into impact.tsx when that stub was
 * re-pointed: a link that lands somewhere real and wrong is worse than one that
 * fails. A 404 sends you looking; a plausible wrong page does not.
 *
 * Both of these violated it, and both did it behind a 301, so a browser that
 * followed one cached the wrong destination.
 */

const ROUTES = join(import.meta.dir, "..");

/**
 * CODE ONLY, COMMENTS STRIPPED, AND THE FIRST DRAFT OF THIS FILE NEEDED IT.
 *
 * A bare `includes('view: "agent"')` went green against the very comment
 * explaining that the param had been REMOVED. That is the same defect this
 * session has now found five times in the product itself: a guard on a spelling
 * rather than on a fact, passing when the meaning is wrong. A test that reads
 * prose is not reading the code.
 */
function code(file: string): string {
  return readFileSync(join(ROUTES, file), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
}

const trackRecord = code("_authenticated.track-record.tsx");
const trustLedger = code("_authenticated.trust-ledger.tsx");
const fleet = code("_authenticated.fleet.tsx");
const build = code("_authenticated.build.index.tsx");

describe("the audit trail is reachable at the address that names it", () => {
  /**
   * THE BUG, AS A FACT ABOUT THE DATA RATHER THAN THE STRING.
   *
   * `/track-record` forwarded `{room:"record"}` with no view, and both readers
   * normalise a missing view to `tabs[0].id`. So the destination depended
   * entirely on tab ORDER, and the first tab is the Verification cockpit, not
   * the receipts surface the route is named for. Three separate comments in the
   * codebase asserted the opposite.
   */
  test("the record room's first tab is NOT the receipts surface", () => {
    // If this ever becomes false, the original code would have been correct by
    // accident, and this whole test file can be reconsidered rather than
    // silently kept.
    const first = ROOM_TAB_META.record[0]?.id;
    expect(first).toBeDefined();
    expect(first).not.toBe("receipts");
  });

  test("receipts is a real tab on the record room, so naming it resolves", () => {
    expect(ROOM_TAB_META.record.some((t) => t.id === "receipts")).toBe(true);
  });

  test("/track-record names the view rather than relying on tab order", () => {
    // The falsy-coalesce is what makes an explicit ?view= still ride along
    // while an absent one lands on receipts.
    expect(trackRecord).toContain('view: search.view || "receipts"');
  });

  test("/trust-ledger inherits the fix by forwarding through /track-record", () => {
    // Deliberately NOT a second copy of the destination. Its own comment says
    // the successor name is the only thing this file has to know, which is what
    // keeps one move from needing two edits.
    expect(trustLedger).toContain('to: "/track-record"');
    expect(trustLedger).not.toContain('room: "record"');
  });
});

describe("/fleet does not promise a lens that was never built", () => {
  /**
   * The redirect forwarded `{view:"agent"}` and claimed Build carried a "By
   * Agent" view-mode tab. Build has no `validateSearch`, so the param was
   * dropped on arrival and the user landed on the default list believing they
   * had reached a lens.
   *
   * Forwarding a param nothing reads is worse than forwarding none: it looks
   * like a working deep link, so nobody goes looking for the missing feature.
   */
  test("Build still has no view-mode lens to send anyone to", () => {
    expect(build).not.toContain("validateSearch");
  });

  test("so /fleet forwards no view param", () => {
    expect(fleet).not.toContain('view: "agent"');
  });

  /**
   * The pin that matters if somebody BUILDS the lens: the moment Build
   * validates a search param, this test fails and points at the redirect that
   * should start forwarding again. It fails in the useful direction.
   */
  test("if Build ever gains a lens, this test asks for the redirect back", () => {
    const buildHasLens = build.includes("validateSearch");
    const fleetForwards = fleet.includes('view: "agent"');
    expect(
      buildHasLens === fleetForwards,
      buildHasLens
        ? 'Build now validates a search param. If that is the by-agent lens, restore `search: { view: "agent" }` in _authenticated.fleet.tsx.'
        : "Build has no lens and /fleet correctly forwards nothing.",
    ).toBe(true);
  });
});
