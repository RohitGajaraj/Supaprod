import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * INVENTED DATA MUST SAY IT IS INVENTED, ON THE SURFACE THAT SHOWS IT.
 *
 * THE DEFECT THIS PREVENTS, found 2026-08-05. `seedWorkspaceForTrack` fires at
 * step 1 of onboarding and writes four signals and four opportunities into the
 * user's REAL workspace: "90% of sign-ups drop after day 1", "Competitor just
 * launched push notifications", "Launch push notifications for engagement".
 * Specific, alarming, invented numbers about a product the reader has told us
 * nothing about.
 *
 * THE LABEL EXISTED IN A COMMENT AND NOWHERE ELSE. `track-seeds.ts` documents
 * the honesty label and says it lives in two places, the project NAME and "the
 * description under it". Both were false:
 *
 *   - `projects` has no description column at all, so `projectDescription` was
 *     dead data that could never reach a screen;
 *   - the name IS prefixed "Example: ", but no surface joined it.
 *     `listOpportunities` selects from `opportunities` with no project join.
 *
 * So Decide opened on "4 bets ranked, strongest first" and a gate asking a
 * stranger to keep or drop a bet about a product they do not have, and pressing
 * "Keep it" spent real model credits writing a spec for fiction. For a product
 * whose entire claim is that its judgement is grounded in YOUR record, that is
 * the most damaging possible first impression.
 *
 * WHY A COLUMN AND NOT THE NAME. The live database settled it. A backfill
 * matching `projects.name like 'Example: %'` was written first and checked
 * before being trusted: ZERO such projects exist in production. The prefix was
 * added to the seed file later, and all 20 live seeded rows predate it. That
 * backfill would have matched nothing and reported success. A rule that lives
 * in a string is one edit away from going quiet with no test failing, which is
 * precisely what this test exists to stop happening a second time.
 */

const SRC = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(SRC, rel), "utf8");
const stripComments = (s: string) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

describe("the seeder marks what it writes", () => {
  const onboarding = stripComments(read(join("lib", "onboarding.functions.ts")));

  /**
   * The block one `.map(` builds, and nothing past it.
   *
   * THE FIRST VERSION OF THIS TEST GUARDED NOTHING. It asserted
   * `const signalRows = ...[\s\S]*?is_sample: true`. `[\s\S]*?` is lazy but
   * UNBOUNDED, so with the signal stamp deleted the pattern simply ran on into
   * the opportunityRows block below and matched ITS stamp. The test passed
   * against the exact defect it was written to catch. That was only found by
   * planting the defect and watching it pass, which is the whole reason this
   * repo insists a guard be proven to FAIL before it is trusted.
   *
   * Slice the block first, then assert inside it.
   */
  function mapBlock(marker: string): string {
    const start = onboarding.indexOf(marker);
    expect(start).toBeGreaterThan(-1);
    const end = onboarding.indexOf("}));", start);
    expect(end).toBeGreaterThan(start);
    return onboarding.slice(start, end);
  }

  it("stamps is_sample on every seeded signal", () => {
    expect(mapBlock("const signalRows = seed.signals.map(")).toContain("is_sample: true");
  });

  it("stamps is_sample on every seeded opportunity", () => {
    expect(mapBlock("const opportunityRows = seed.opportunities.map(")).toContain(
      "is_sample: true",
    );
  });

  it("the two blocks are distinct, so neither test can borrow the other's stamp", () => {
    // The precise failure above: one block's assertion satisfied by the other's
    // code. If these ever overlap, both tests go hollow again.
    expect(mapBlock("const signalRows = seed.signals.map(")).not.toContain("seed.opportunities");
    expect(mapBlock("const opportunityRows = seed.opportunities.map(")).not.toContain(
      "seed.signals",
    );
  });
});

// The two tests that used to open this describe block -- "Decide's gate reads
// is_sample" and "says it in plain words, not a badge nobody parses" --
// checked /decide's own judgment gate, deleted with the page (P-14,
// A-QUEUE.md, R-34). What remains is the record type itself, which no
// surface-specific deletion touches.
describe("the record type carries the example flag", () => {
  it("so a surface can read it at all", () => {
    const sheet = read(join("components", "discover", "OpportunityDetailSheet.tsx"));
    expect(sheet).toMatch(/is_sample\?: boolean \| null;/);
  });
});

describe("nothing forms a judgement from a row nobody wrote", () => {
  const onboardingUi = stripComments(
    read(join("components", "onboarding", "ObsidianOnboarding.tsx")),
  );

  /**
   * The Critic's first act used to be a teardown of "Redesign onboarding to
   * reduce day-1 drop-off": a bet about a mobile app the user does not have,
   * scored by numbers they did not choose. `afterConnected` took
   * `opportunities[0]`, ordered by ice_score, which is reliably the highest
   * scoring SAMPLE row.
   */
  it("the belief skips a flagged row before it skips a known title", () => {
    const flat = onboardingUi.replace(/\s+/g, " ");
    expect(flat).toMatch(/is_sample\?: boolean \| null \}\)\.is_sample === true/);
    expect(flat).toMatch(/!flagged && !isSeededExampleTitle\(o\.title\)/);
  });

  it("keeps the title check as a fallback rather than replacing it", () => {
    // A row written before the column existed and missed by the backfill is
    // still caught. Either signal disqualifies the bet.
    expect(onboardingUi).toMatch(/isSeededExampleTitle/);
  });
});
