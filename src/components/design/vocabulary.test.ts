import { describe, expect, it } from "bun:test";

import { DELIBERATE_SINGULAR, kindWord, tallyPhrase } from "./vocabulary";
import { artifactWord } from "@/lib/artifact-words";

describe("one product, one word for a kind", () => {
  it("says finding and never signal, which is what §12 bans", () => {
    /*
     * The law: "a practitioner does not say signals". This file said it for
     * weeks after the canonical map stopped, on the Design surface, while the
     * run screen and the Decide desk said the new word.
     */
    expect(kindWord("signal", 1)).toBe("finding");
    expect(kindWord("signal", 3)).toBe("findings");
    expect(tallyPhrase([{ kind: "signal", count: 2 }])).not.toContain("signal");
  });

  it("takes the canonical word for anything it does not deliberately override", () => {
    // A rename in `artifact-words.ts` must reach this surface on its own.
    for (const kind of ["prd", "changeset", "house_rule", "learning", "theme"]) {
      expect(kindWord(kind, 1)).toBe(artifactWord(kind));
    }
  });

  it("keeps the four words this surface chose on purpose", () => {
    expect(kindWord("mission", 1)).toBe("run");
    expect(kindWord("prototype", 1)).toBe("shared link");
    expect(kindWord("design_memory", 1)).toBe("brand rule");
  });

  it("fails an override that has stopped overriding anything", () => {
    /*
     * THE GUARD THAT MAKES THIS SAFE. An override matching the canonical word
     * is a reason that has outlived itself, and leaving it in place is how the
     * next divergence hides: it looks deliberate. If `artifact-words.ts` ever
     * adopts one of these words, this fails and the entry gets deleted rather
     * than quietly shadowing a map that already agrees.
     */
    for (const [kind, word] of Object.entries(DELIBERATE_SINGULAR)) {
      expect(`${kind}:${word}`).not.toBe(`${kind}:${artifactWord(kind)}`);
    }
  });

  it("still reads as English for a kind neither map has seen", () => {
    expect(kindWord("brand_audit", 1)).toBe("brand audit");
    expect(kindWord("brand_audit", 2)).toBe("brand audits");
  });

  it("keeps the irregular plural the canonical map cannot give it", () => {
    expect(kindWord("opportunity", 2)).toBe("opportunities");
  });
});
