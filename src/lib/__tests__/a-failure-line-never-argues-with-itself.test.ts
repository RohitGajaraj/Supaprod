import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * A COMPOSED FAILURE LINE MUST NOT CONTRADICT ITS OWN SECOND HALF.
 *
 * ── THE BUG THAT PROMPTED THIS, WHICH SOMEBODY ELSE SHIPPED AND CAUGHT ────
 * S3 wrote a failure line reading "Your password can still be changed below."
 * It was correct. Every reading of the component tree said so. Rendered, it
 * came out as:
 *
 *     "Your password can still be changed below. Your session ended."
 *
 * Nothing failed. Both halves were true when written. They contradict because
 * changing a password re-authenticates, so the thing the first half offers is
 * exactly the thing the second half says is unavailable. Only the screenshot
 * showed it.
 *
 * ── WHY THIS IS A CLASS AND NOT AN INCIDENT ───────────────────────────────
 * `failureLine(ownSentence, err)` appends a second sentence that the author of
 * the first one cannot see: either the server's own copy, or
 * `sessionEndedMessage`'s "Your session ended. Sign in again and this will
 * load." The author writes half a paragraph and ships the whole one. There are
 * 34 of these across the surfaces this lane owns and NOBODY has read most of
 * them composed, because producing one on screen means forcing the failure that
 * causes it.
 *
 * ── THE RULE, AND IT IS A RULE ABOUT THE FIRST HALF ONLY ──────────────────
 * The two halves compose safely when they answer different questions. The
 * second half is always about what the READER CAN DO. So the first half must be
 * about what is TRUE: the state the reader is now in, stated flatly.
 *
 *     "Production is still running what it was."     state, safe
 *     "This is still waiting for you."               state, safe
 *     "You can try again below."                     an offer, and it can be
 *                                                    contradicted
 *
 * A sentence that offers an action can be refuted by the sentence appended
 * after it. A sentence that reports a state cannot, because a state does not
 * stop being true when the session ends.
 *
 * ── WHAT THIS DOES NOT CATCH, said plainly ────────────────────────────────
 * It reads literal first arguments only. A sentence built from a variable, or
 * passed in as a prop, is invisible here and always will be. It also cannot
 * judge whether a state sentence is ACCURATE -- "Production is still running
 * what it was" is a claim about a deploy, and only the deploy knows. This
 * guards one property: that the first half never makes a promise the second
 * half can take away.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, "..", "..", "..");

/**
 * Words by which a sentence offers the reader an action rather than reporting a
 * state. Each one is here because it can be refuted by "Your session ended".
 *
 * `below` and `above` are the S3 case exactly: they point at a control, and a
 * control is useless to someone who has been signed out. `try again`, `press`
 * and `click` name an action; `sign in` would duplicate the appended sentence
 * outright; `you can` and `you may` grant a permission the next sentence
 * removes.
 */
const OFFERS_AN_ACTION: readonly [RegExp, string][] = [
  [/\bbelow\b/i, "points at a control the reader may not be able to use"],
  [/\babove\b/i, "points at a control the reader may not be able to use"],
  [/\btry again\b/i, "offers an action the appended sentence can refuse"],
  [/\b(?:press|click|tap) /i, "names an action the appended sentence can refuse"],
  [/\bsign in\b/i, "duplicates the sentence sessionEndedMessage appends"],
  [/\byou (?:can|may|could)\b/i, "grants the reader something the next sentence can remove"],
];

/** Every literal first argument to `failureLine`, with the file it came from. */
function ownSentences(): { file: string; sentence: string }[] {
  const found: { file: string; sentence: string }[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
        continue;
      }
      if (!/\.tsx?$/.test(full) || /\.test\.tsx?$/.test(full)) continue;
      const src = readFileSync(full, "utf8");
      // Backtick and double-quote forms both, since a template literal is the
      // usual shape once the sentence names the thing that did not move.
      for (const m of src.matchAll(/failureLine\(\s*(["`])([^"`]+)\1/g)) {
        found.push({ file: full.slice(REPO_ROOT.length + 1), sentence: m[2] });
      }
    }
  };
  walk(join(REPO_ROOT, "src/components"));
  walk(join(REPO_ROOT, "src/routes"));
  return found;
}

describe("a composed failure line never argues with itself", () => {
  it("finds the call sites at all, so a rename cannot quietly empty this test", () => {
    // A guard whose scanner silently matches nothing passes forever. This is
    // the floor: the number is deliberately well below the count on the day it
    // was written, so ordinary churn does not trip it and a rename does.
    expect(ownSentences().length).toBeGreaterThan(20);
  });

  it("states what is true rather than offering what the reader may not be able to do", () => {
    const offending = ownSentences().flatMap(({ file, sentence }) =>
      OFFERS_AN_ACTION.filter(([re]) => re.test(sentence)).map(
        ([, why]) => `${file}\n    "${sentence}"\n    ${why}`,
      ),
    );

    expect(
      offending.join("\n\n"),
      [
        "A failure line's own sentence offers the reader an action.",
        "",
        "failureLine appends a second sentence you cannot see from here: the",
        "server's own copy, or \"Your session ended. Sign in again and this will",
        'load." An offer can be refuted by that. A statement of state cannot.',
        "",
        "Rewrite it as what is TRUE now, not what the reader may do next:",
        '  "You can try again below."  ->  "Nothing changed."',
        '  "Press Retry above."        ->  "It is still as it was."',
      ].join("\n"),
    ).toBe("");
  });

  it("ends like prose, so the appended sentence starts cleanly", () => {
    // failureLine joins with a single space and nothing else. Without terminal
    // punctuation the two sentences run together into one ungrammatical line.
    const unterminated = ownSentences()
      .filter(({ sentence }) => !/[.!?]$/.test(sentence.trim()))
      .map(({ file, sentence }) => `${file}: "${sentence}"`);
    expect(unterminated.join("\n")).toBe("");
  });
});
