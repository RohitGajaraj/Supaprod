import { describe, expect, test } from "bun:test";
import { parseDesignMd } from "./design-interchange.functions";

/**
 * A section runs to the next `## ` heading or to the end of the input. The
 * lookahead used to be written `\Z`, which JavaScript reads as a literal Z, so
 * a Principles section that mentioned a Zoom control ended at the Z and lost
 * everything after it. Fixed under P-152 (lint: no-useless-escape) once the
 * rule pointed at it; this is the case that would have caught it.
 */
describe("parseDesignMd reads a whole section", () => {
  const md = [
    "# Prism design memory",
    "",
    "## Principles",
    "",
    "### Zoom follows the pointer",
    "The Zoom control keeps the pointer fixed. Zero surprise.",
    "",
    "### Quiet by default",
    "Nothing moves unless a person asked it to.",
    "",
    "## Components",
    "",
    "| Button | control | one primary per view |",
    "",
  ].join("\n");

  test("a capital Z inside a section does not end it", () => {
    const doc = parseDesignMd(md);
    expect(doc.principles.map((p) => p.name)).toEqual([
      "Zoom follows the pointer",
      "Quiet by default",
    ]);
    expect(doc.principles[0]?.description).toContain("Zero surprise.");
  });

  test("the last section runs to the end of the input", () => {
    const doc = parseDesignMd(md);
    expect(doc.components.map((c) => c.name)).toEqual(["Button"]);
  });
});
