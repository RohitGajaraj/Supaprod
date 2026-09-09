/**
 * P-25 (A-QUEUE.md): the pure rules `findAnything` builds its query and its
 * badge word from. No database -- see `find-anything.ts`'s own header for why
 * these two are split out of `track.functions.ts`.
 */
import { describe, it, expect } from "bun:test";
import {
  searchWords,
  runStateWord,
  searchDoors,
  SEARCHABLE_DOORS,
  GROUP_LABEL,
} from "./find-anything";
import type { NavItemDef } from "@/lib/nav-model";

describe("searchWords: every word present, case-insensitively, in any order", () => {
  it("lowercases and splits on whitespace", () => {
    expect(searchWords("Checkout Amex")).toEqual(["checkout", "amex"]);
  });

  it("collapses repeated whitespace and trims the ends", () => {
    expect(searchWords("  address   step  ")).toEqual(["address", "step"]);
  });

  it("an empty or whitespace-only query has no words", () => {
    expect(searchWords("")).toEqual([]);
    expect(searchWords("   ")).toEqual([]);
  });

  it("one word stays one word", () => {
    expect(searchWords("address")).toEqual(["address"]);
  });
});

describe("runStateWord: a track's own coarse state for a search result", () => {
  it("a done track reads Finished, whatever last_hold says", () => {
    expect(runStateWord("done", "waiting-on-a-person")).toBe("Finished");
  });

  it("an abandoned track reads Abandoned", () => {
    expect(runStateWord("abandoned", null)).toBe("Abandoned");
  });

  it("an open track with a call in front of a person reads Needs you", () => {
    expect(runStateWord("open", "waiting-on-a-person")).toBe("Needs you");
  });

  it("an open track on any other hold, or none, reads Running", () => {
    expect(runStateWord("open", "stalled")).toBe("Running");
    expect(runStateWord("open", null)).toBe("Running");
  });
});

describe("GROUP_LABEL: the packet's own group headings, not KIND_WORD's sentence words", () => {
  it("names Pull requests, not KIND_WORD's changeset -> code change", () => {
    expect(GROUP_LABEL.changeset).toBe("Pull requests");
  });

  it("names Findings and themes, not KIND_WORD's theme -> cluster", () => {
    expect(GROUP_LABEL.findings).toBe("Findings and themes");
  });

  it("covers every key FindAnythingResult has", () => {
    expect(Object.keys(GROUP_LABEL).sort()).toEqual(
      [
        "doors",
        "runs",
        "prd",
        "decision",
        "prototype",
        "changeset",
        "findings",
        "sources",
        "conversations",
        "people",
      ].sort(),
    );
  });
});

describe("searchDoors: P-64's nine doors, matched on their own label and tagline", () => {
  const DOORS: readonly NavItemDef[] = [
    { to: "/start", label: "Start", zone: "home", tagline: "Hand work over, watch it run." },
    {
      to: "/approvals",
      label: "Waiting",
      zone: "home",
      tagline: "Everything that cannot move until you answer it.",
    },
    { to: "/sync", label: "Sources", zone: "home", tagline: "What the crew is allowed to read." },
  ];

  it("an empty query finds no doors, so a blank field never shows every door as a hit", () => {
    expect(searchDoors([], DOORS)).toEqual([]);
  });

  it("matches a door on its own label", () => {
    expect(searchDoors(["start"], DOORS).map((d) => d.label)).toEqual(["Start"]);
  });

  it("matches a door on its tagline, not only its label", () => {
    expect(searchDoors(["answer"], DOORS).map((d) => d.label)).toEqual(["Waiting"]);
  });

  it("every word must be present, in either the label or the tagline", () => {
    expect(searchDoors(["waiting", "answer"], DOORS).map((d) => d.label)).toEqual(["Waiting"]);
    expect(searchDoors(["waiting", "read"], DOORS)).toEqual([]);
  });

  it("defaults to the real searchable-doors list, which includes PRIMARY_NAV", () => {
    expect(searchDoors(["home"]).map((d) => d.to)).toContain("/start");
  });

  /**
   * P-79: "Spend and limits" is Team's own tab, not a tenth rail door -- it
   * does not belong in `PRIMARY_NAV` (the one-word rail rule governs that
   * list, not this one) and is still a real navigation target, per the
   * packet's own acceptance line: "Find Anything's doors group lists Spend
   * and limits under Team."
   */
  it("finds Spend and limits, Team's own named tab, and targets it correctly", () => {
    const hits = searchDoors(["spend"], SEARCHABLE_DOORS);
    const spend = hits.find((d) => d.label === "Spend and limits");
    expect(spend).toBeTruthy();
    expect(spend!.to).toBe("/crew");
    expect(spend!.search).toEqual({ tab: "spend" });
  });

  it("SEARCHABLE_DOORS carries every PRIMARY_NAV door plus at least the one named tab", () => {
    expect(SEARCHABLE_DOORS.length).toBeGreaterThan(7);
    expect(SEARCHABLE_DOORS.map((d) => d.label)).toContain("Team");
    expect(SEARCHABLE_DOORS.map((d) => d.label)).toContain("Spend and limits");
  });

  /**
   * THE BOUNDARY'S OWN WORDS REACH TEAM, 2026-09-09 (fifth review).
   *
   * These seven were asserted against Settings' own search until the Autonomy
   * group folded into Team (`a-pane-with-no-door-is-still-findable.test.ts`
   * carries the pointer). `searchSections` cannot answer for a pane that is no
   * longer a settings section, so the claim lives here, against the search a
   * person actually types into. Removing a door and its search hit in one
   * commit is this repo's most expensive defect; this is what stops the fold
   * from being that.
   */
  it("finds The boundary, and every word its panels answer to reaches Team", () => {
    const boundary = searchDoors(["boundary"], SEARCHABLE_DOORS).find(
      (d) => d.label === "The boundary",
    );
    expect(boundary).toBeTruthy();
    expect(boundary!.to).toBe("/crew");
    expect(boundary!.search).toEqual({ tab: "boundary" });

    for (const word of ["spend", "budget", "cap", "limit", "stop", "tool", "approve"]) {
      const reached = searchDoors([word], SEARCHABLE_DOORS).map((d) => d.to);
      expect(reached, `"${word}" reaches nothing`).toContain("/crew");
    }
  });
});
