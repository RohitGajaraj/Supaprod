import { describe, it, expect } from "bun:test";
import { plainProse } from "./plain-prose";

describe("agent prose with its markdown syntax off the screen", () => {
  it("unwraps the emphasis a person was actually shown", () => {
    // The real rationale from the Decide tab on a30238f5.
    expect(
      plainProse("No evidence shows address re-entry remains a barrier *after* that fix"),
    ).toBe("No evidence shows address re-entry remains a barrier after that fix");
    expect(plainProse("This is **important** work")).toBe("This is important work");
    expect(plainProse("***very*** clear")).toBe("very clear");
  });

  it("never touches an underscore, because identifiers live in this text", () => {
    /*
     * THE ONE THAT WOULD DO REAL DAMAGE. `_italic_` is real markdown and
     * stripping it is defensible in general and wrong here: the very rationale
     * that prompted this names `checkout_single_address`. Removing a marker is
     * cosmetic; corrupting an identifier makes the sentence false.
     */
    const s = "lifted completion via checkout_single_address on _phone_ only";
    expect(plainProse(s)).toBe(s);
  });

  it("leaves an asterisk that is not emphasis exactly as written", () => {
    expect(plainProse("2 * 3 = 6")).toBe("2 * 3 = 6");
    expect(plainProse("* a bullet line")).toBe("* a bullet line");
    expect(plainProse("an unmatched * asterisk")).toBe("an unmatched * asterisk");
    expect(plainProse("5*3")).toBe("5*3");
  });

  it("returns text with no asterisks untouched and cheaply", () => {
    const s = "Nothing here needs changing at all.";
    expect(plainProse(s)).toBe(s);
  });

  it("is quiet on the shapes a card hands it", () => {
    expect(plainProse(null)).toBeNull();
    expect(plainProse(undefined)).toBeNull();
    expect(plainProse("")).toBe("");
  });
});

describe("where it is applied, and where it must not be", () => {
  it("is safe on the shapes a display site passes", () => {
    // Row subs and leads take `string | undefined`, so the null has to be
    // coalesced at the call site rather than here; this pins the contract they
    // are coalescing.
    expect(plainProse(null)).toBeNull();
    expect(plainProse("**Ship it**")).toBe("Ship it");
  });

  it("does not round-trip a form value, which is why inputs are left raw", () => {
    /*
     * NOT A TEST OF THIS FUNCTION SO MUCH AS OF WHERE IT GOES. `plainProse` is
     * lossy by design: it removes characters. Applied to a textarea's `value`
     * it would silently rewrite what a person is about to save, so the settle
     * panel's `value={summary}` and the forecast desk's `value={rationale}` are
     * deliberately untouched while their DISPLAY siblings are stripped.
     */
    const typed = "**keep my markers**";
    expect(plainProse(typed)).not.toBe(typed);
  });
});
