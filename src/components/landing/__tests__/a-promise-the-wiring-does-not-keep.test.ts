/**
 * THE SHOP WINDOW MAY NOT PROMISE A GUARANTEE THE WIRING DOES NOT KEEP.
 *
 * TrustClose carried "Merge is always human. Merge, revert, and delegate can
 * never skip your approval." on the panel headed "the rules the agents cannot
 * break" -- the last thing a visitor reads before deciding whether an agent
 * touching their repository is safe.
 *
 * It stopped being true on 2026-08-25, when R-27 was revised. `AUTO_SHIP_ENABLED`
 * reads the `STUDIO_AUTO_SHIP` platform secret and un-pins `studio.pr.merge`
 * from `review`, so an agent on an ambient trust arc merges with nobody asked
 * (loop.server.ts, defaults.ts). /security was corrected for exactly this reason
 * on 2026-08-27 and states the honest form: by default nothing merges without a
 * human approval, no workspace setting can change that, the only thing that can
 * is a platform secret we hold, and even then four things must be proven first.
 * The landing badge went on contradicting it.
 *
 * SO THIS IS A SHAPE GUARD, NOT A WORD BAN. An absolute is fine where the
 * wiring keeps one -- `studio.revert` is not graduated and "rolling back is
 * never automatic" is true. What may not appear is an absolute about MERGE and
 * APPROVAL in one breath, because that is the pair the secret breaks.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/** Every surface a person can read without an account. */
function outwardFiles(): string[] {
  const out: string[] = [];
  const landing = "src/components/landing";
  for (const f of readdirSync(landing)) {
    if (f.endsWith(".tsx") && !f.includes(".test.")) out.push(join(landing, f));
  }
  for (const f of ["index.tsx", "demo.tsx", "pricing.tsx", "faq.tsx", "security.tsx", "film.tsx"]) {
    out.push(join("src/routes", f));
  }
  return out;
}

/** Prose only. A comment explaining WHY an absolute was removed necessarily
 *  quotes the absolute, and failing on that would make the explanation
 *  unwritable -- the trap three earlier guards in this repo fell into. */
function prose(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

const MERGE = /\bmerg(e|es|ed|ing)\b/i;
const ABSOLUTE = /\b(always|never)\b/i;
/**
 * The two shapes the promise took, and both had to be caught. The detail line
 * paired merge with APPROVAL ("can never skip your approval"); the label paired
 * it with a PERSON ("Merge is always human"), which says the same thing with no
 * approval word in it. A guard that only knew the first would have passed the
 * headline while failing its own footnote.
 */
const WHO = /\b(approv(e|es|ed|al|als)|human|humans|person|people|you|your)\b/i;

describe("a promise the wiring does not keep", () => {
  it("no outward surface makes merge plus a person an absolute", () => {
    const offenders: string[] = [];
    for (const path of outwardFiles()) {
      let src: string;
      try {
        src = readFileSync(path, "utf8");
      } catch {
        continue; // a route this repo has since folded is not a failure here
      }
      for (const sentence of prose(src).split(/(?<=[.!?])\s+|\n/)) {
        if (MERGE.test(sentence) && WHO.test(sentence) && ABSOLUTE.test(sentence)) {
          offenders.push(`${path}: ${sentence.trim().slice(0, 120)}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the two exact strings that were wrong are gone", () => {
    const trust = readFileSync("src/components/landing/TrustClose.tsx", "utf8");
    const said = prose(trust);
    expect(said).not.toContain("Merge is always human");
    expect(said).not.toContain("can never skip your approval");
  });

  it("and what replaced them names the default, which is the true claim", () => {
    const said = prose(readFileSync("src/components/landing/TrustClose.tsx", "utf8"));
    expect(said).toContain("By default nothing merges without you");
    // The stronger half survives, because revert really is never graduated.
    expect(said).toContain("Rolling back is never automatic");
  });

  it("security still states the honest form the badge now agrees with", () => {
    const said = prose(readFileSync("src/routes/security.tsx", "utf8"));
    expect(said).toContain("no workspace setting can change that");
    expect(said.toLowerCase()).toContain("platform secret");
  });
});
