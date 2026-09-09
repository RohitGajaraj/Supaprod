/**
 * THE FOUR VERSIONS IN THIS FILE ARE ONE PRODUCTION FOLD, IN ORDER.
 *
 * `OTA Firmware Reboot vs. Production Outage Tile Differentiation` on Helio
 * Labs track `ce846e9b`, read 2026-09-09. Two identical pairs with one real
 * revision between them, which is the exact shape the pane renders as four rows
 * carrying one title and, because `relativeTime` rounds, one clock.
 *
 * Abridged to the section that changes — the bodies are 1,644 and 1,851
 * characters — but the lines are verbatim and the SHAPE is the real one: two
 * copies, a revision, two copies.
 */
import { describe, it, expect } from "bun:test";

import {
  whatChanged,
  changeLine,
  bodyLines,
  QUOTE_CAP,
  foldRepeats,
  versionsLabel,
} from "@/components/track/what-changed-between-versions";

/** Filed 21:40:15, and again at 21:40:34 nineteen seconds later. */
const YELLOW = `2. OTA FIRMWARE REBOOT TILE (new):
- Color: Yellow (#FFC107)
- Icon: Circular arrow (rotating) with firmware chip icon overlay
- Text: "Updating firmware"
- Action button: "What's happening?" (expands FAQ about OTA updates)`;

/** Filed 22:00:21 after the design critic refused yellow, and again at 22:00:39. */
const RED = `2. OTA FIRMWARE REBOOT TILE (revised):
- Color: Red (#D32F2F) — conforms to design system's semantic hierarchy for outage states
- Icon: Clock icon with circular arrow overlay (static, not rotating)
- Text: "Scheduled firmware update"
- Action button: "What's happening?" (expands FAQ about OTA updates)`;

describe("what changed between two versions", () => {
  it("calls a byte-identical refiling identical, which is 39% of these rows", () => {
    expect(whatChanged(YELLOW, YELLOW)).toEqual({ kind: "same" });
    expect(changeLine(whatChanged(YELLOW, YELLOW))).toBe("Identical to the version after it.");
  });

  it("still calls it identical when only whitespace moved", () => {
    const respaced = YELLOW.replace(/- Color:/, "-  Color:  ").replace(/\n/g, "\n\n");
    expect(whatChanged(YELLOW, respaced)).toEqual({ kind: "same" });
  });

  it("counts the revision in decisions, and quotes what the design stopped being", () => {
    const c = whatChanged(YELLOW, RED);
    expect(c.kind).toBe("changed");
    if (c.kind !== "changed") throw new Error("unreachable");
    // Four of the five lines were rewritten; the shared action button was not.
    expect(c.lines).toBe(4);
    expect(c.from).toBe("- Color: Yellow (#FFC107)");
    expect(changeLine(c)).toBe("4 lines changed, from “- Color: Yellow (#FFC107)”");
  });

  it("counts a rewritten line once, not once on each side", () => {
    const c = whatChanged("- Color: Yellow", "- Color: Red");
    if (c.kind !== "changed") throw new Error("expected a change");
    // One line left and one arrived. A reader calls that one change.
    expect(c.lines).toBe(1);
  });

  it("says nothing at all when there is no body to compare", () => {
    // Every artifact kind whose card carries no body lands here, so this is the
    // common case and it must be silent rather than apologetic.
    expect(whatChanged(null, RED)).toEqual({ kind: "unknown" });
    expect(whatChanged(RED, "")).toEqual({ kind: "unknown" });
    expect(changeLine({ kind: "unknown" })).toBeNull();
  });

  it("never reports a missing body as a change", () => {
    // The fail direction `getTrackChain` takes for `missing`: a lookup that did
    // not run must not render as a revision that did not happen.
    expect(whatChanged(undefined, undefined).kind).not.toBe("changed");
  });

  it("cuts a long quotation rather than letting one row set the column width", () => {
    const long = `- ${"x".repeat(200)}`;
    const c = whatChanged(long, "- something else entirely");
    if (c.kind !== "changed") throw new Error("expected a change");
    expect(c.from!.length).toBeLessThanOrEqual(QUOTE_CAP + 3);
    expect(c.from!.endsWith("...")).toBe(true);
  });

  it("keeps case, because the headings in these bodies are what a reader navigates by", () => {
    // `#FFC107` and `#ffc107` are one colour, but "OTA FIRMWARE REBOOT TILE" and
    // "ota firmware reboot tile" are a heading and a sentence. Only whitespace
    // is normalised, so two versions differing in case are genuinely different.
    expect(bodyLines("  A  B  ")).toEqual(["A B"]);
    expect(whatChanged("PRODUCTION OUTAGE TILE", "Production outage tile").kind).toBe("changed");
  });
});

describe("the fold this was written for, walked end to end", () => {
  it("reads two copies, a revision, two copies", () => {
    // Oldest first, as filed.
    const filed = [YELLOW, YELLOW, RED, RED];
    const lines = filed.map((body, i) =>
      i === filed.length - 1 ? null : changeLine(whatChanged(body, filed[i + 1]!)),
    );
    expect(lines).toEqual([
      "Identical to the version after it.",
      "4 lines changed, from “- Color: Yellow (#FFC107)”",
      "Identical to the version after it.",
      // The newest has no successor, so it is scored against nothing.
      null,
    ]);
  });
});

describe("the line it quotes", () => {
  it("passes over a heading to reach the line that states a value", () => {
    /*
     * THE CASE THAT PRODUCED THE RULE. The real pair's first difference in
     * document order is the section heading, which changed only because the
     * section under it did. Quoting it told a reader nothing.
     */
    const c = whatChanged(
      "2. OTA FIRMWARE REBOOT TILE (new):\n- Color: Yellow (#FFC107)",
      "2. OTA FIRMWARE REBOOT TILE (revised):\n- Color: Red (#D32F2F)",
    );
    if (c.kind !== "changed") throw new Error("expected a change");
    expect(c.from).toBe("- Color: Yellow (#FFC107)");
  });

  it("takes the heading when the heading is genuinely all that moved", () => {
    const c = whatChanged("SECTION ONE:\n- Color: Red", "SECTION TWO:\n- Color: Red");
    if (c.kind !== "changed") throw new Error("expected a change");
    expect(c.from).toBe("SECTION ONE:");
  });
});

describe("what the closed row says", () => {
  it("counts the repeats a person would otherwise have to open the fold to find", () => {
    // The real fold: two designs, filed twice each.
    expect(foldRepeats([YELLOW, YELLOW, RED, RED])).toBe(2);
    expect(versionsLabel("prototype", 4, 2)).toBe("prototype · 4 versions, 2 the same");
  });

  it("counts copies across the whole fold, not only next to each other", () => {
    // A version that comes back an hour later is still a copy of one thing.
    expect(foldRepeats([YELLOW, RED, YELLOW])).toBe(1);
  });

  it("leaves a healthy fold's row exactly as it was", () => {
    expect(foldRepeats([YELLOW, RED])).toBe(0);
    expect(versionsLabel("prototype", 2, 0)).toBe("prototype · 2 versions");
  });

  it("says nothing about repeats when the bodies cannot be read", () => {
    // Most artifact kinds carry no body. Silence, not an implied distinctness.
    expect(foldRepeats([null, null, null])).toBeNull();
    expect(foldRepeats([YELLOW, null])).toBeNull();
    expect(versionsLabel("decision", 3, null)).toBe("decision · 3 versions");
  });
});
