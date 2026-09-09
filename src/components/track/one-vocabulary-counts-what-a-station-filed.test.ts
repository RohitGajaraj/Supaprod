/**
 * NINE SURFACES CAN SAY WHAT A STATION FILED, AND THEY ARE NAMED HERE.
 *
 * ── WHY S1 ASKED FOR A CENSUS ───────────────────────────────────────────────
 * Read whole on the served build rather than pane by pane, one run said "3
 * prototypes" FOUR times: on the road under Design, in the story block, in the
 * transcript's section header, and in the artifact pane. Three copies had been
 * ruled acceptable on a test we agreed and wrote down -- a short factual count
 * read again CONFIRMS, where a long distinctive sentence read again makes you
 * stop and compare -- and that ruling carried an explicit condition: **a fourth
 * is no longer confirmation, it is wallpaper.** The condition was met and the
 * transcript's copy went.
 *
 * S1's note when they filed it: the ruling was reached by COUNTING a rendered
 * page by eye, and nothing in the repo counts. A fifth surface can appear
 * tomorrow and the whole argument silently re-breaks.
 *
 * ── AND THE COUNT BY EYE WAS LOW ────────────────────────────────────────────
 * Four was what two people could see on one page. Scanned by mechanism rather
 * than by eye, NINE modules turn station members into a counted phrase, spread
 * across the run screen, Start, the transcript and the chain. Which is the real
 * answer to why a fourth copy kept appearing: nobody could hold the set in
 * their head, so every new surface reasonably invented its own.
 *
 * The guard is therefore not "do not say it twice" -- that needs a rendered
 * page and a pair of eyes. It is: **the modules that can emit a station tally
 * are a named list, checked both ways against a structural signature, so a
 * tenth is an argument somebody has to make.** Same shape as `RETIRED_LINKERS`
 * and the unreachable baseline, both of which hold here.
 *
 * ── THE SIGNATURE, AND WHY IT IS NOT COPY ───────────────────────────────────
 * A station tally is a count joined to an ARTIFACT-kind noun. So a file matches
 * when it does both:
 *
 *   · selects a word by count -- `n === 1 ? w.one : w.many`, or calls
 *     `foldedCount`, which is that selection with repeats folded in
 *   · and gets that word from the artifact vocabulary -- `KIND_WORD`,
 *     `wordFor`, a kind key by name, or the map handed in as an argument
 *
 * Both halves are load-bearing. Without the second,
 * `governance/where-the-crew-stands.ts` matches, and it counts AGENTS BY TRUST
 * RUNG -- the same sentence shape about a different population, which is not
 * this rule's business. Without the first, every module that mentions the
 * vocabulary for a single label matches, and fifteen files do.
 *
 * No wording is asserted anywhere here.
 */
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "bun:test";

import { KIND_WORD } from "@/lib/spine/attach";

/* `fileURLToPath`, not `.pathname`: this repo lives under a path with spaces,
   and a URL's pathname keeps them percent-encoded, so the read fails with
   ENOENT on a directory that is plainly there. */
const SRC = fileURLToPath(new URL("../..", import.meta.url));

/**
 * EVERY MODULE PERMITTED TO TURN STATION MEMBERS INTO A COUNTED PHRASE.
 *
 * If you are adding a tenth, the question to answer first is not "may I" but
 * "which of these nine is my surface already reading, and why is it not
 * enough" -- because four is the number at which S1's ruling said a count stops
 * confirming and starts being wallpaper, and we are past it.
 */
const EMITTERS: { path: string; surface: string }[] = [
  {
    path: "components/track/run-journey.ts",
    surface: "the road: the short line under each stop, '3 prototypes', 'PR #4102'",
  },
  {
    path: "components/track/the-through-line.ts",
    surface: "the story: 'Design filed 3 prototypes', one clause per station",
  },
  {
    path: "components/track/run-tally.ts",
    surface: "the proof panel: what the whole run has to show for itself",
  },
  {
    path: "components/track/what-it-made.ts",
    surface: "the artifact pane's lead line, under 'What it has made', one station at a time",
  },
  {
    path: "components/today/tracks-feed.ts",
    surface: "Start's row: 'Produced 2 specs and 1 decision', one line per run",
  },
  {
    path: "components/start/journey-of-a-run.ts",
    surface: "Start's compact journey strip",
  },
  {
    path: "lib/spine/activity.ts",
    surface: "the transcript: what a turn attached",
  },
  {
    path: "lib/spine/chain.ts",
    surface: "the chain's whole-run sentence, and `wordFor`, which several of the others read",
  },
  {
    path: "lib/spine/attach.ts",
    surface: "`describeAttachments`: one sentence naming what joined the track",
  },
];

/**
 * Builds the phrase but chooses no noun and reads no members, so it is not a
 * voice -- it is the grammar the voices share, and adding a caller to it is not
 * adding a surface.
 */
const PRIMITIVES = ["components/track/versions-of-one-thing.ts"];

/**
 * The one module that emits a tally and reaches no screen, kept on purpose.
 *
 * `what-it-produced.ts` is the reference implementation that
 * `the-row-and-the-strip-agree-on-what-was-produced.test.ts` pins Start's row
 * to, clause for clause: always state the count, join with `joinPlainly`, so two
 * surfaces counting the same `spine_track_members` rows cannot disagree on
 * whether "1 spec" is worth saying by number. Its last renderer went when the
 * transcript's section header did.
 *
 * Deleting it takes that contract with it, and the live emitters do not share
 * one convention to re-point it at: `run-tally` drops the number for a count of
 * one ("spec", not "1 spec"), deliberately, because a chip is not a sentence.
 * Re-pointing it is a piece of work with a decision in it, so it is named here
 * rather than done in passing.
 *
 * A list of one. If it grows, each entry brings its own paragraph, or it is not
 * a quarantine, it is a second tree of dead emitters.
 */
const KEPT_FOR_A_CONTRACT = ["components/track/what-it-produced.ts"];

/** Every source file, so the scan cannot miss one by not being told about it. */
function allSources(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name === "__tests__") continue;
    const full = `${dir}/${e.name}`;
    if (e.isDirectory()) allSources(full, out);
    else if (/\.tsx?$/.test(e.name) && !/\.test\.tsx?$/.test(e.name)) out.push(full);
  }
  return out;
}

const rel = (f: string) => f.slice(SRC.length).replace(/^\/+/, "");

/**
 * Code only.
 *
 * ── THIS GUARD CAUGHT ITSELF ON ITS FIRST RUN ───────────────────────────────
 * The commit that wrote it also rewrote `run-journey`'s helper to read the
 * vocabulary, and left a docstring QUOTING the old hand-typed call as the thing
 * that had been wrong. The scan read the quote and failed the file it had just
 * fixed: a source guard scoring the prose that explains it, which is the
 * standing trap of reading files rather than calling them.
 */
const codeOnly = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

/** `n === 1 ? w.one : w.many`, or the same selection with repeats folded. */
const SELECTS_BY_COUNT = /((===|!==)\s*1\s*\?[^;\n]*\.(one|many)\b)|\bfoldedCount\s*\(/;

/** And the word comes from the ARTIFACT vocabulary, not some other population. */
const FROM_THE_KIND_VOCABULARY =
  /\bKIND_WORD\b|\bwordFor\s*\(|["'](prd|prototype|changeset|deployment|learning|theme)["']|words:\s*Readonly<Record<string,\s*\{\s*one:\s*string;\s*many:\s*string/;

const emitsATally = (src: string): boolean => {
  const code = codeOnly(src);
  return SELECTS_BY_COUNT.test(code) && FROM_THE_KIND_VOCABULARY.test(code);
};

const FOUND = allSources(SRC)
  .filter((f) => emitsATally(readFileSync(f, "utf8")))
  .map(rel);

const NAMED = [...EMITTERS.map((e) => e.path), ...PRIMITIVES, ...KEPT_FOR_A_CONTRACT];

describe("the detector is real", () => {
  it("finds the emitters it is supposed to find", () => {
    // If the signature stops matching, every property below passes vacuously.
    expect(FOUND.length).toBeGreaterThan(8);
  });

  it("and the vocabulary it scores against is non-trivial", () => {
    expect(Object.keys(KIND_WORD).length).toBeGreaterThan(5);
  });

  it("does not catch a count of something that is not an artifact", () => {
    // `where-the-crew-stands.ts` counts agents by trust rung with the identical
    // sentence shape. It matches half the signature and must not match both,
    // or this rule has quietly annexed a population it has no ruling about.
    expect(FOUND).not.toContain("components/governance/where-the-crew-stands.ts");
  });
});

describe("THE CENSUS: every station tally is on the list", () => {
  it("no module counts what a station filed without being named here", () => {
    const strangers = FOUND.filter((f) => !NAMED.includes(f));
    expect(
      strangers,
      [
        `A new module joins a count to an artifact noun: ${strangers.join(", ")}`,
        "",
        "That makes it the tenth surface able to say what a station filed. One",
        "run was measured saying '3 prototypes' four times across the road, the",
        "story, the transcript and the artifact pane, and a fourth sighting is",
        "the point a count stops confirming and starts being wallpaper.",
        "",
        "So the question is not whether this module may exist. It is which of",
        "the nine your surface is already reading, and why that is not enough.",
        "If the answer is good, add it to EMITTERS with its surface named.",
      ].join("\n"),
    ).toEqual([]);
  });

  /*
   * THE MIRROR, and it is the half that found something. Without it the list
   * passes while naming modules that stopped emitting -- and a plausible-looking
   * tally emitter with no caller is exactly how a fifth sighting appears,
   * because the next person finds it, it reads as canonical, and they wire it
   * up.
   *
   * It ran once and named three: `station-outcome.ts`, whose own docstring said
   * it "hands it to the map and the strip", true when written and not since;
   * `what-each-station-did.ts`; and `what-it-produced.ts`, reached only through
   * the first. The two with no contract on them were deleted with their suites.
   */
  it("and every module on the list still emits one", () => {
    const silent = NAMED.filter((p) => !FOUND.includes(p));
    expect(
      silent,
      `Named as a tally emitter but no longer counting anything: ${silent.join(", ")}. ` +
        "Take it off the list, or off the tree.",
    ).toEqual([]);
  });

  it("and every named emitter reaches a screen", () => {
    const sources = allSources(SRC).map((f) => ({ rel: rel(f), src: readFileSync(f, "utf8") }));
    const orphans = EMITTERS.filter((e) => {
      const mod = e.path.replace(/\.tsx?$/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const spec = new RegExp(`@/${mod}"`);
      return !sources.some((s) => s.rel !== e.path && spec.test(s.src));
    }).map((e) => e.path);
    expect(
      orphans,
      `Emits a station tally and nothing imports it: ${orphans.join(", ")}. ` +
        "Either it has a surface, in which case say which, or it is dead and the " +
        "next person to find it will wire it up as one more copy.",
    ).toEqual([]);
  });

  it("names the surface each one answers for, not just the file", () => {
    // A path on its own is a list. The surface is what makes the next person
    // able to answer "which of these is mine already reading".
    for (const e of EMITTERS) expect(e.surface.length).toBeGreaterThan(20);
  });
});

describe("and every tally draws its nouns from the one vocabulary", () => {
  /*
   * The road hand-typed `plural(n, "prototype", "prototypes")` under a comment
   * reading "The canon's noun, not a local swap." They agreed on the day it was
   * written and nothing held them there: rename `prototype` in `KIND_WORD` and
   * the transcript, the story and the Start row move while the road keeps the
   * old word, on the one screen where all four are visible at once.
   *
   * `what-it-made.ts` records paying for that already ("carried the same local
   * swap"), which makes this the second time, which is what a guard is for.
   */
  const KIND_NOUNS = new Set(Object.values(KIND_WORD).flatMap((w) => [w.one, w.many]));

  it("no emitter types an artifact noun and its plural by hand", () => {
    const handRolled = EMITTERS.filter((e) => {
      const code = codeOnly(readFileSync(`${SRC}/${e.path}`, "utf8"));
      for (const m of code.matchAll(/"([a-z ]+)",\s*"([a-z ]+)"/g)) {
        const [, one, many] = m;
        if (KIND_NOUNS.has(one!) && KIND_NOUNS.has(many!) && many !== one) return true;
      }
      return false;
    }).map((e) => e.path);
    expect(
      handRolled,
      `Types a kind noun and its plural rather than reading the vocabulary: ${handRolled.join(", ")}`,
    ).toEqual([]);
  });
});
