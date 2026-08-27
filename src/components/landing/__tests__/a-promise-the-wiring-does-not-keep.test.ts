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

/**
 * WIDENED AFTER GETTING IT WRONG ONCE. The first version of this guard knew
 * only MERGE, so the sentence that replaced the merge absolute -- "rolling back
 * is never automatic at all" -- sailed straight through it, and that sentence
 * was false too. `SHIP_AUTONOMY_TOOLS` holds `studio.revert` with no flag on
 * it, so `resolveToolMode("studio.revert", "confirm", "trusted")` returns
 * `auto`; run it and see. A guard scoped to the one word we happened to be
 * looking at is a guard that certifies the next mistake.
 *
 * So the shape is an ABSOLUTE about an IRREVERSIBLE ACT and a PERSON, whatever
 * the act is called.
 */
const IRREVERSIBLE =
  /\b(merg(e|es|ed|ing)|revert(s|ed|ing)?|roll(s|ed|ing)? back|rollback(s)?|rolling back|ship(s|ped|ping)?|publish(es|ed|ing)?|deploy(s|ed|ing)?|delete(s|d)?)\b/i;
const ABSOLUTE = /\b(always|never)\b/i;
/**
 * THREE shapes, and the third is why this guard exists in its widened form.
 *
 *   "can never skip your approval"   an absolute about APPROVAL
 *   "Merge is always human"          an absolute about a PERSON, no approval word
 *   "Rolling back is never automatic" an absolute about AUTONOMY, neither of those
 *
 * The first version of this file knew only the first two, and the third is the
 * sentence I wrote to replace them -- which was false in its turn. A guard that
 * checks the wording of the last mistake certifies the next one.
 */
const WHO =
  /\b(approv(e|es|ed|al|als)|human|humans|person|people|you|your|automatic|automatically|by itself|on its own|unassisted|without asking|graduated)\b/i;

describe("a promise the wiring does not keep", () => {
  it("no outward surface makes an irreversible act plus a person an absolute", () => {
    const offenders: string[] = [];
    for (const path of outwardFiles()) {
      let src: string;
      try {
        src = readFileSync(path, "utf8");
      } catch {
        continue; // a route this repo has since folded is not a failure here
      }
      for (const sentence of prose(src).split(/(?<=[.!?])\s+|\n/)) {
        if (IRREVERSIBLE.test(sentence) && WHO.test(sentence) && ABSOLUTE.test(sentence)) {
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
    // And it says nothing about revert, because there is no true short sentence
    // about revert: it graduates with no flag at all. /security carries the long
    // one, which is where a claim needing a paragraph belongs.
    expect(said.toLowerCase()).not.toContain("rolling back");
  });

  it("security still states the honest form the badge now agrees with", () => {
    const said = prose(readFileSync("src/routes/security.tsx", "utf8"));
    expect(said).toContain("no workspace setting can change that");
    expect(said.toLowerCase()).toContain("platform secret");
  });

  /**
   * The claim that replaced it has to be the WEAKER one, not a differently
   * worded reassurance. `studio.revert` graduates to `auto` on a trusted arc,
   * so a page saying the product cannot roll back on its own is wrong however
   * confidently it is phrased.
   */
  it("security no longer says the product cannot roll back on its own", () => {
    const said = prose(readFileSync("src/routes/security.tsx", "utf8"));
    expect(said).not.toContain("can never roll back its own work");
    expect(said).toContain("Rolling back is the one thing gated less");
  });
});
