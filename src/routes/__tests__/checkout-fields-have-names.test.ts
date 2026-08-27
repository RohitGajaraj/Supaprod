/**
 * TWO FIELDS ON THE PAYMENT PAGE HAD NO NAME A SCREEN READER COULD SPEAK.
 *
 * checkout.tsx took a name and an email before payment behind
 * `<span style={label}>YOUR NAME</span>` -- visible, and associated with
 * nothing. No `htmlFor`, no `aria-label`, no `aria-labelledby`. A screen
 * reader announced "edit text" twice, on the one page where a person is
 * committing money and cannot skip a field. A placeholder is not a name: it is
 * a hint that disappears the moment you type into it.
 *
 * Found by S4, the only accessibility defect in 32 surfaces swept, and R-19
 * puts accessibility outside what may be deferred.
 *
 * The seats control on the same page already carried `aria-label="Add a seat"`,
 * which is the tell that this was an oversight rather than a house style -- and
 * the reason a guard is worth more here than a fix: the pattern was known and
 * the page still shipped without it.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const src = readFileSync(join(import.meta.dir, "..", "checkout.tsx"), "utf8");

/** Every `<input`, with the attributes that really belong to it: the naive read
 *  stops at the first `>`, which lands inside `onChange={(e) => ...}` and hides
 *  the very attributes this asserts. */
function inputTags(text: string): string[] {
  const out: string[] = [];
  for (let i = text.indexOf("<input"); i !== -1; i = text.indexOf("<input", i + 1)) {
    let depth = 0;
    let quote: string | null = null;
    for (let j = i; j < text.length; j++) {
      const c = text[j]!;
      if (quote) {
        if (c === quote) quote = null;
      } else if (c === '"' || c === "'") quote = c;
      else if (c === "{") depth++;
      else if (c === "}") depth--;
      else if (c === ">" && depth === 0) {
        out.push(text.slice(i, j + 1));
        break;
      }
    }
  }
  return out;
}

describe("every field on the payment page has a name", () => {
  it("finds the fields at all, so a rename cannot empty this test", () => {
    expect(inputTags(src).length).toBeGreaterThanOrEqual(2);
  });

  it("every visible input is named for a screen reader", () => {
    const unnamed = inputTags(src).filter(
      (tag) =>
        !tag.includes('type="hidden"') &&
        !tag.includes("aria-hidden") &&
        !/\bid=/.test(tag) &&
        !tag.includes("aria-label"),
    );
    expect(unnamed, "give it an id bound by <label htmlFor>, or an aria-label").toEqual([]);
  });

  it("the two money fields are bound by a real label, not only an aria-label", () => {
    // `<label htmlFor>` names the field AND makes the visible text a click
    // target that focuses it, which is a gain for everybody rather than a
    // repair for one group.
    for (const id of ["checkout-name", "checkout-email"]) {
      expect(src).toContain(`htmlFor="${id}"`);
      expect(src).toContain(`id="${id}"`);
    }
  });
});
