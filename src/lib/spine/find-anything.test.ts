/**
 * P-25 (A-QUEUE.md): the pure rules `findAnything` builds its query and its
 * badge word from. No database -- see `find-anything.ts`'s own header for why
 * these two are split out of `track.functions.ts`.
 */
import { describe, it, expect } from "bun:test";
import { searchWords, runStateWord, searchDoors, GROUP_LABEL } from "./find-anything";
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

  it("defaults to the real PRIMARY_NAV list", () => {
    expect(searchDoors(["start"]).map((d) => d.to)).toContain("/start");
  });
});
