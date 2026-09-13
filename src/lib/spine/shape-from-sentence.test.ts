/**
 * The reading has to be RIGHT more often than a default, and — more important —
 * it has to be SILENT rather than wrong. Every case below is a sentence a
 * person could plausibly type into this product's one box.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SHAPE_READ_AS, shapeFromSentence } from "./shape-from-sentence";
import { WORK_SHAPE_LABEL, type WorkShape } from "./route";

describe("it reads the sentence", () => {
  it("reads a failure as an incident, whatever else the sentence holds", () => {
    /* This one carries a surface word too ("layout"), and the failure has to
       win: incident-fix enters at Build and skips four stations, so routing a
       live break through Discover is the one mistake here with a day attached. */
    expect(shapeFromSentence("the checkout page layout is broken on tablets")).toEqual({
      shape: "incident-fix",
      because: "broken",
    });
  });

  it("reads plumbing as plumbing even when it names a surface", () => {
    expect(shapeFromSentence("cache the order page so it stops being slow")?.shape).toBe(
      "under-the-hood",
    );
  });

  it("reads a surface change", () => {
    expect(shapeFromSentence("change the wording on the delivery button")?.shape).toBe(
      "interface-change",
    );
  });

  it("reads an addition to something that already runs", () => {
    expect(shapeFromSentence("let a homeowner reschedule an installer visit")?.shape).toBe(
      "existing-feature",
    );
  });
});

describe("it stays silent rather than guessing", () => {
  it("says nothing about a sentence with no signal in it", () => {
    expect(shapeFromSentence("homeowners should feel more confident at the end")).toBeNull();
  });

  it("says nothing while somebody is still typing the first few words", () => {
    /* A reading that flickers between two shapes over four keystrokes teaches a
       person that the product guesses, which is more expensive than saying
       nothing at all. */
    expect(shapeFromSentence("fix the")).toBeNull();
    expect(shapeFromSentence("broken")).toBeNull();
  });

  it("never fires on a word that merely CONTAINS a signal", () => {
    /*
     * The bug this guard exists for: a bare `includes()` reads "download" as
     * "down" and prints "reads as something broken, from 'down'" on a sentence
     * about a PDF. Every one of these was a real false positive before `holds`
     * checked word boundaries.
     */
    const traps: ReadonlyArray<[string, string]> = [
      ["let a homeowner download their receipt as a pdf", "down"],
      ["show the delivery address on the order summary", "add"],
      ["make the sign-up flow slower to read, with more air", "slow"],
      ["show the installer name on the arrival card", "add"],
    ];
    for (const [sentence, trap] of traps) {
      const read = shapeFromSentence(sentence);
      expect({ sentence, because: read?.because ?? null }).not.toEqual({ sentence, because: trap });
    }
  });

  it("does fire on the real word, including its listed plural", () => {
    expect(shapeFromSentence("change the colours on the delivery summary")?.shape).toBe(
      "interface-change",
    );
    expect(shapeFromSentence("the sign-up page crashes on submit")?.shape).toBe("incident-fix");
  });

  it("does not read a preference as a failure", () => {
    /* "the buttons are the wrong colour" is a paint job, and reading it as an
       incident routes it to Build and skips four stations including the one
       that writes the forecast. "wrong" was in the incident list and this is
       why it is not. */
    expect(shapeFromSentence("the delivery buttons are the wrong colour")?.shape).toBe(
      "interface-change",
    );
  });
});

describe("the reading is said as a clause, not as an option in a list", () => {
  it("has a phrasing for every shape", () => {
    const shapes = Object.keys(WORK_SHAPE_LABEL) as WorkShape[];
    for (const s of shapes) {
      expect({ s, said: (SHAPE_READ_AS[s] ?? "").length > 0 }).toEqual({ s, said: true });
    }
  });

  it("reads as a clause after 'reads as', which the picker's own labels do not", () => {
    /* "reads as Something we have not built before" is not English. The two
       wordings are deliberately separate rather than one reused twice. */
    for (const said of Object.values(SHAPE_READ_AS)) {
      expect({ said, lowercaseStart: said[0] === said[0]!.toLowerCase() }).toEqual({
        said,
        lowercaseStart: true,
      });
    }
  });
});

/* ── AND THE SURFACE THAT USES IT ─────────────────────────────────────── */

describe("the composer asks nothing before there is a sentence", () => {
  const SRC = readFileSync(
    join(import.meta.dir, "..", "..", "components", "start", "ComposerRoutePicker.tsx"),
    "utf8",
  );
  const code = SRC.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

  it("draws nothing on an empty box", () => {
    /* It used to draw on FIRST PAINT above an empty composer, defaulting to
       the longest route: the first thing an agentic product asked a person to
       do was classify their own work into our five buckets before they had
       typed a word. */
    expect(code).toContain("if (!sentence.trim()");
    expect(code).toContain("return null");
  });

  it("names the word that decided the reading", () => {
    /* The bar's Anthropic lens: confident output with no way to check it. A
       reading a person cannot see the evidence for is a guess wearing a
       result's clothes. */
    expect(code).toContain("read.because");
  });

  it("keeps the picker one press away, and remembers a hand-made choice", () => {
    /* The reading is not always right and the person is always the authority.
       `touched` is what stops the product arguing with somebody who has
       already answered. */
    expect(code).toContain("setTouched(true)");
    expect(code).toContain("touched ||");
    expect(code).toContain("<Picker");
  });

  it("still says where the work enters the road", () => {
    expect(code).toContain("routeClause(shape)");
  });
});
