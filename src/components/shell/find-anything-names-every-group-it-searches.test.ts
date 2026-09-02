/**
 * P-25 follow-up (A1, live on `supaprod.ai`, 2026-09-03): the empty-search
 * line named five kinds while the search returns six groups -- "Findings and
 * themes" was searched and not named, because the sentence was written as a
 * literal string rather than built from the group list. A1's own fix
 * direction: "build the sentence from the group list rather than a string."
 */
import { describe, expect, it } from "bun:test";
import { NOTHING_NAMED_THAT } from "./FindAnything";
import { GROUP_LABEL } from "@/lib/spine/find-anything";

describe("the empty-search line names every group findAnything actually searches", () => {
  it("mentions all six group labels, not a hand-picked subset", () => {
    for (const label of Object.values(GROUP_LABEL)) {
      expect(NOTHING_NAMED_THAT.toLowerCase()).toContain(label.toLowerCase());
    }
  });

  it("reads as one sentence, not a bare comma dump", () => {
    expect(NOTHING_NAMED_THAT.startsWith("Nothing named that.")).toBe(true);
    expect(NOTHING_NAMED_THAT).toContain(" and ");
    expect(NOTHING_NAMED_THAT.endsWith("are searched.")).toBe(true);
  });
});
