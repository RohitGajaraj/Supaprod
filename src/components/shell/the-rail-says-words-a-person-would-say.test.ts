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
  "Approvals",
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
    expect(labels.length).toBeGreaterThan(2);
    expect(labels).toContain("Work");
  });

  it("carries no word §12's rename map retired, except the one door awaiting a ruling", () => {
    const offenders: string[] = [];
    for (const label of railLabels()) {
      for (const word of RETIRED) {
        // Whole-word, case-insensitive: "Work" must not trip on nothing, and
        // "What we've learned" must not trip on "learn".
        if (new RegExp(`\\b${word}\\b`, "i").test(label)) offenders.push(`${label} (${word})`);
      }
    }
    /*
     * THREADS IS THE ONE EXCEPTION AND IT IS NOT MINE TO CLEAR. `SURFACE-MAP`
     * marks the route **DELETE** — *"a collaboration surface, killed by
     * R-04"* — so renaming it would put a plain word on a door that is going
     * away, and S0 rules deletions. My caller walk is filed and awaiting that
     * ruling. Renaming it would also cost the deletion its own evidence.
     */
    expect(offenders).toEqual(["Threads (Threads)"]);
  });

  it("COUPLES that exception to the map, so it cannot outlive the ruling", () => {
    /*
     * An allowlist that only lists is an allowlist that rots. This asserts the
     * exception is legitimate **if and only if** `SURFACE-MAP` still marks the
     * route DELETE. The day S0 rules and the row changes, this test fails and
     * whoever lands the change has to come back and remove the exception — the
     * same shape S3 used to couple a caveat to the handler that made it true.
     */
    const map = readFileSync("the-first-run/SURFACE-MAP.md", "utf8");
    const row = map.split("\n").find((l) => l.includes("_authenticated.threads.tsx"));
    expect(row).toBeDefined();
    expect(row).toContain("DELETE");
  });

  it("carries no word the positioning canon bans outright", () => {
    for (const label of railLabels()) {
      for (const word of BANNED) expect(label.toLowerCase()).not.toContain(word);
    }
  });

  it("still says the two the map replaced them WITH, so a fix cannot be a deletion", () => {
    /*
     * The failure mode of the test above is that somebody satisfies it by
     * deleting the door. §12 replaces words; it does not remove destinations,
     * and the pages behind these two are S3's and still reachable.
     */
    const labels = railLabels();
    expect(labels).toContain("What we've learned");
    expect(labels).toContain("What it's allowed to do");
  });
});
