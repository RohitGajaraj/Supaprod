/**
 * ── THE PRODUCT READS THE SENTENCE. THE PERSON DOES NOT CLASSIFY IT. ─────
 *
 * FOUNDER, 2026-09-10, on what the entry owes a person: *"Anticipate, do not
 * interrogate. What am I asking a human to do that an agent should do in the
 * background?"*
 *
 * WHAT STOOD HERE. Under the composer, a native `<select>` inside a mad-lib:
 *
 *     The work is [ Something we have not built before ▾ ] · it enters at
 *     Discover and walks all seven stations
 *
 * Five options, defaulting to the longest route, presented **before the person
 * has typed anything** — so the first interaction with an agentic product was a
 * taxonomy question the product was better placed to answer than the person.
 * The taxonomy is ours. `new-capability` and `under-the-hood` are words from
 * `route.ts`, and a person arriving with *"the saved address dropdown shows
 * deleted addresses"* has to work out which of our five buckets that is before
 * they are allowed to hand it over.
 *
 * ── WHAT REPLACES IT, AND THE HONESTY CONSTRAINT THAT SHAPES IT ──────────
 *
 * The product reads the sentence and says what it read, **naming the word that
 * decided it**, and the person can change it in one press.
 *
 * That last clause is the whole design. A classifier that shows a confident
 * answer with no reasoning is the failure `the-bar.md`'s Anthropic lens names —
 * *"confident output with no way to check it"*. So this returns the MATCHED
 * WORD alongside the shape, every caller prints it, and a reader can see in one
 * glance both what was decided and what decided it.
 *
 * ── AND IT ONLY SPEAKS WHEN IT HAS A REASON ─────────────────────────────
 *
 * `null` when nothing matched, which is common and is the point. The caller
 * falls back to the default route and says nothing, rather than dressing a
 * default up as a reading. A product that claims to have understood every
 * sentence has taught you within a day that its claim means nothing.
 *
 * ── WHY WORDS AND NOT A MODEL ───────────────────────────────────────────
 *
 * A model call here would sit between a keystroke and a placeholder, cost a
 * request per pause, and be wrong in ways nobody can inspect. This is inspectable
 * by reading forty lines, runs in microseconds on every keystroke, and — because
 * it names its own trigger — is falsifiable by the person it is about. When it
 * is wrong they can see WHY it is wrong, which is what makes correcting it feel
 * like collaborating rather than like fighting a guess.
 */

import type { WorkShape } from "@/lib/spine/route";

/**
 * What was read, and the word that decided it.
 *
 * `because` is not decoration and not a debug field: it is rendered. See the
 * honesty constraint above.
 */
export type ShapeReading = { shape: WorkShape; because: string };

/**
 * ORDERED, AND THE ORDER IS A RANKING OF URGENCY RATHER THAN OF FREQUENCY.
 *
 * A sentence can carry signals from two families at once — *"the checkout page
 * layout is broken"* holds both a surface word and a failure word — and the
 * first match wins. Failure outranks everything, because a route that sends a
 * live incident through Discover is the one mistake here with a cost attached:
 * `incident-fix` enters at Build and skips four stations, and the other four
 * shapes do not.
 *
 * Under-the-hood outranks interface for the same reason in miniature: *"cache
 * the page"* is plumbing wearing a surface noun, and sending plumbing through
 * Design wastes a station rather than a day.
 */
const FAMILIES: ReadonlyArray<{ shape: WorkShape; words: readonly string[] }> = [
  {
    shape: "incident-fix",
    words: [
      "broken",
      "breaks",
      "broke",
      "failing",
      "fails",
      "failed",
      "crash",
      "crashing",
      "crashes",
      "outage",
      "down",
      "error",
      "errors",
      "regression",
      "stopped working",
      "not working",
      "does not work",
      "doesn't work",
      /* "wrong" is deliberately NOT here. It is the weakest word that was in
         this list and it read "the buttons are the wrong colour" as an
         incident, which routes a paint job to Build and skips four stations.
         A word that appears as often inside a preference as inside a failure
         cannot carry the family that has a cost attached. */
      "bug",
      "incident",
      "urgent",
      "hotfix",
    ],
  },
  {
    shape: "under-the-hood",
    words: [
      "refactor",
      "migrate",
      "migration",
      "index",
      "query",
      "queries",
      "cache",
      "caching",
      "performance",
      "latency",
      "slow",
      "speed up",
      "upgrade",
      "dependency",
      "dependencies",
      "logging",
      "schema",
      "rate limit",
      "throughput",
      "memory",
      "backfill",
    ],
  },
  {
    shape: "interface-change",
    words: [
      "copy",
      "wording",
      "label",
      "labels",
      "button",
      "buttons",
      "colour",
      "colours",
      "color",
      "colors",
      "layout",
      "spacing",
      "font",
      "icon",
      "icons",
      "screen",
      "page",
      "modal",
      "dialog",
      "placeholder",
      "tooltip",
      "empty state",
      "looks",
      "redesign",
      "restyle",
      "rename",
    ],
  },
  {
    shape: "existing-feature",
    words: [
      "add",
      "adds",
      "let",
      "allow",
      "allows",
      "support",
      "supports",
      "extend",
      "also",
      "as well",
      "option to",
      "ability to",
      "so that people can",
      "so a customer can",
    ],
  },
];

/**
 * WHOLE WORDS ONLY, WHICH IS THE DIFFERENCE BETWEEN THIS AND A `includes()`.
 *
 * "download" contains "down", "address" contains "add", "slower" contains
 * "slow" and "colours" is a legitimate plural of "colour". A bare substring
 * check would have read *"let a homeowner download their address label"* as an
 * incident, from "down", and printed **"reads as something broken, from
 * 'down'"** on a sentence about a PDF.
 *
 * So a phrase must sit on word boundaries, and the plurals it should match are
 * listed rather than stemmed — an English stemmer is a dependency, a source of
 * its own surprises, and forty listed words is a thing a person can read and
 * argue with.
 */
function holds(haystack: string, phrase: string): boolean {
  const i = haystack.indexOf(phrase);
  if (i < 0) return false;
  const before = i === 0 ? " " : haystack[i - 1]!;
  const after = i + phrase.length >= haystack.length ? " " : haystack[i + phrase.length]!;
  return !/[a-z0-9]/.test(before) && !/[a-z0-9]/.test(after);
}

/**
 * WHAT THIS SENTENCE READS AS, or null when nothing in it says.
 *
 * A short sentence is not read at all. Under about fifteen characters there is
 * not enough to be right about, and a reading that flickers between two shapes
 * while somebody types their first four words is worse than no reading: it
 * teaches them that the product guesses.
 */
export function shapeFromSentence(sentence: string): ShapeReading | null {
  const text = ` ${sentence.toLowerCase().trim()} `;
  if (text.trim().length < 15) return null;
  for (const family of FAMILIES) {
    for (const word of family.words) {
      if (holds(text, word)) return { shape: family.shape, because: word };
    }
  }
  return null;
}

/**
 * HOW THE READING IS SAID OUT LOUD, in the person's words and not in ours.
 *
 * `WORK_SHAPE_LABEL` is the picker's own phrasing and it is written as an
 * option in a list — *"Something we have not built before"*. Read back as a
 * statement it needs to be a clause, so this is a second, deliberate wording
 * rather than a reuse: *"reads as something we have not built before"*.
 */
export const SHAPE_READ_AS: Record<WorkShape, string> = {
  "new-capability": "something new",
  "existing-feature": "a change to something you already run",
  "interface-change": "a change to something people see",
  "under-the-hood": "a change nobody sees directly",
  "incident-fix": "something broken now",
};
