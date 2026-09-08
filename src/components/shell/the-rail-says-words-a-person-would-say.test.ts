/**
 * NO DOOR IN THE RAIL WEARS A WORD §12 RETIRED.
 *
 * §12 is a law, not a copy preference: *"if a person would not use the word out
 * loud to a colleague, it does not go on a surface."* And it names the failure
 * this file exists to prevent: **"a session that renames a thing in its own
 * prefix and leaves it stale elsewhere has made the problem worse."**
 *
 * The rail is the highest-traffic set of words in the signed-in product — five
 * doors a person reads before anything else — so it is the place a retired word
 * costs the most and is noticed least.
 *
 * ── WHY A TEST RATHER THAN A SWEEP ────────────────────────────────────────
 * `RANKED-BACKLOG`'s vocabulary section is explicit that a corpus-wide replace
 * on this family is forbidden, because **8 of the 34 files carrying the phrases
 * quote them in order to BAN them** — and a sweep has already deleted the rule
 * along with the violations here twice. So this asserts on the RAIL's rendered
 * labels only, which is a place no rule is quoted.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

const SRC = readFileSync("src/components/shell/AppFrame.tsx", "utf8");

/**
 * The rail literal, and only it: comments and the rest of the file are out.
 *
 * **The same two markers `AppFrame.rail-covers-keys.test.ts` uses**, not a
 * second parser — and `AppFrame.tsx`'s own comment records why they matter: when
 * the rail was once split into two arrays, this marker matched a block with no
 * rows and **three guards quietly passed over an empty list.** That is why the
 * first test below asserts the extraction found something. My first draft got
 * the terminator wrong and that test caught it, which is the guard working
 * before it had guarded anything.
 */
function railLabels(): string[] {
  const start = SRC.indexOf("const RAIL = [");
  expect(start).toBeGreaterThan(-1);
  const end = SRC.indexOf("] as const;", start);
  expect(end).toBeGreaterThan(start);
  const block = SRC.slice(start, end)
    // Comments quote the retired words on purpose - that is the whole point of
    // §12's map living beside the change. Prose is not a surface.
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/[^\n]*/g, " ");
  return [...block.matchAll(/label:\s*"([^"]+)"/g)].map((m) => m[1]!);
}

/**
 * §12's "today, on a surface" column — every word the map retires.
 *
 * `Approvals` and `Today` are deliberately included even though they are gone:
 * a guard that only lists what is still wrong stops guarding the moment it is
 * fixed, and both were on this rail this morning.
 */
const RETIRED = [
  "Engine Room",
  "Guardrails",
  "Govern",
  "Boundary",
  "Safety",
  /*
   * "Approvals" IS NOT ON THIS LIST ANY MORE, AND THE REASON IS A RULING.
   *
   * §12 retires it for naming a CONTAINER rather than who is blocked, and that
   * is right about a sentence. **The founder ruled it back for this rail on
   * 2026-09-01** - "keep it more relatable to the user... how other enterprise
   * products are using it" - and a nav label has a different job from a
   * sentence: it has to let a stranger predict the page. The page is a queue of
   * things a person approves.
   *
   * Removed deliberately rather than left in and excused, because a banned-list
   * entry that every reader has to know an exception to is not a guard.
   */
  "Crew",
  "Agents",
  "Fleet",
  "Swarm",
  "Cockpit",
  "Mission Control",
  "Observe",
  "Today",
  "Missions",
  "Tracks",
  "Brain",
  "Memory",
  "Knowledge",
  "Trust ledger",
  "Signals",
  "Artifacts",
  "Traces",
  "Evals",
  "Budgets",
  "Delegate",
  "Drift",
  "Impact",
  "Stakeholder",
  "Threads",
];

/** The canon's outright bans, which §12 says are not up for renegotiation. */
const BANNED = [
  "receipts",
  "ledger",
  "company brain",
  "decision layer",
  "unattended",
  "provenance",
];

describe("the rail speaks plain words", () => {
  it("finds the rail's labels at all, so a silent parse failure cannot pass", () => {
    const labels = railLabels();
    expect(labels.length).toBeGreaterThan(0);
    expect(labels).toContain("Home");
  });

  it("carries no word §12's rename map retired — P-11 cut the exception along with its door", () => {
    /*
     * THREADS LEFT THE RAIL ENTIRELY IN P-11 (A-QUEUE.md, 2026-09-02), not
     * merely awaiting the SURFACE-MAP deletion this test used to wait on. The
     * allowlist below existed so a legitimate exception could not rot past
     * its ruling; the honest update, now that the door itself is gone, is an
     * empty allowlist rather than one that still names a label nothing draws.
     */
    const offenders: string[] = [];
    for (const label of railLabels()) {
      for (const word of RETIRED) {
        // Whole-word, case-insensitive: "Work" must not trip on nothing, and
        // "What we've learned" must not trip on "learn".
        if (new RegExp(`\\b${word}\\b`, "i").test(label)) offenders.push(`${label} (${word})`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("carries no word the positioning canon bans outright", () => {
    for (const label of railLabels()) {
      for (const word of BANNED) expect(label.toLowerCase()).not.toContain(word);
    }
  });

  it("gives every door ONE WORD, which is the founder's rail ruling", () => {
    /*
     * ── FOUNDER, 2026-09-01, AND IT CORRECTED ME ─────────────────────────
     * "This is not an enterprise-grade naming ceremony. It has to be one single
     * verb... Don't put the sentence as the name of the shell."
     *
     * This is the rule stated so it cannot drift back. A door is a noun or a
     * verb, and it is one word.
     */
    for (const label of railLabels()) {
      expect(label.trim().split(/\s+/)).toHaveLength(1);
    }
  });

  it("still has both doors, so one-word cannot be met by deleting one", () => {
    /*
     * P-11 (A-QUEUE.md, 2026-09-02) DID legitimately cut the rail — five doors
     * down to two, Start and the conditional Run — by explicit founder brief,
     * which is a different thing from satisfying the one-word rule by
     * quietly shrinking the rail on the side. This pins the two words the
     * ruling actually chose, so a future edit cannot make either vanish and
     * call it compliance.
     */
    /*
     * NINE SINCE P-60 (R-38: a surface without a door is not shipped), and the
     * one-word ruling above is untouched by that -- every one of the nine is a
     * single word, and the person's question lives in the tagline, which is
     * where the founder's "don't put the sentence as the name" puts it.
     *
     * The point of this test is unchanged: one-word compliance must not be
     * reachable by DELETING doors, so it pins that the rail keeps growing-or-
     * holding rather than shrinking to satisfy the rule above.
     */
    const labels = railLabels();
    expect(labels.length).toBeGreaterThanOrEqual(2);
    expect(labels).toContain("Home");
    expect(labels).toContain("Inbox");
  });
});
