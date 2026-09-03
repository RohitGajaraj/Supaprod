import { describe, it, expect } from "bun:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * THE MOAT CLAIM, MADE AGAINST INVENTED EVIDENCE.
 *
 * WHAT WAS FOUND. Migration 20260805220000 gave `is_sample` to `signals` and to
 * `opportunities` so a seeded row could say what it was. It skipped `themes`,
 * which sit between them -- the clusterer reads signals and writes themes, so
 * the twenty signals onboarding seeds into the user's REAL workspace cluster
 * like any others and the themes they produce carried no mark at all.
 *
 * Measured live before the fix: 20 sample signals, 257 themes, and 16 of those
 * built ENTIRELY from sample signals, sitting unlabelled in real workspaces.
 *
 * WHY THIS ONE MATTERED MOST. `getFocusNext` ranks themes, takes the top one,
 * spends a model call writing a recommendation about it, and Today prints it
 * under "Ranked against every outcome this workspace has already settled". On a
 * new workspace the only themes that exist are the seeded ones. So the product's
 * single most important claim -- that it learns from YOUR record and guides the
 * next call -- was demonstrated with fiction, in the first place a stranger
 * looks. Four live workspaces were in exactly that state.
 *
 * THE RULE: a theme is a sample only if EVERY signal in it is. The clusterer
 * merges into existing themes, so a seeded theme can genuinely grow real
 * evidence; marking that one as an example would hide a real finding, which is
 * the worse of the two errors.
 */

const ROOT = join(import.meta.dir, "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/**
 * The file with its comments removed, for guards that assert a pattern is
 * ABSENT.
 *
 * A source-scanning test cannot tell code from prose about code, and this repo
 * documents a fixed defect by quoting the broken line verbatim. So a bare
 * `not.toMatch` on the raw text fails the moment somebody explains the fix,
 * which punishes exactly the commenting habit the codebase relies on. Presence
 * assertions are unaffected and keep reading the raw file.
 */
function codeOf(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");
}

const CLUSTER = read(join("lib", "ai", "cluster.server.ts"));
const INSIGHTS = read(join("lib", "brain", "insights.functions.ts"));
const DERIVE = read(join("lib", "brain", "derive-insights.server.ts"));
const DISCOVER = read(join("components", "discover", "DiscoverSurface.tsx"));
const TYPES = read(join("integrations", "supabase", "types.ts"));

const MIGRATIONS = join(ROOT, "..", "supabase", "migrations");
const MIGRATION = readFileSync(
  join(
    MIGRATIONS,
    readdirSync(MIGRATIONS).find((f) => f.includes("a_theme_made_only_of_examples")) ?? "",
  ),
  "utf8",
);

describe("themes can say they are examples", () => {
  it("the column exists in the migration and in the generated types", () => {
    expect(MIGRATION).toMatch(
      /alter table public\.themes[\s\S]{0,80}add column if not exists is_sample boolean/,
    );
    // The types file is what every call site is checked against. `themes` was
    // the one of the three tables missing it, which is how the gap opened.
    const themesBlock = TYPES.slice(TYPES.indexOf("      themes: {"));
    expect(themesBlock.slice(0, 3000)).toMatch(/is_sample: boolean/);
  });

  it("the backfill marks a theme only when NO real signal is in it", () => {
    // Both halves are load bearing. `exists(... is_sample)` alone would mark any
    // theme that merely contains a sample; the `not exists(... not is_sample)`
    // is what makes it "every".
    expect(MIGRATION).toMatch(
      /exists \(select 1 from public\.signals s where s\.theme_id = t\.id and s\.is_sample\)/,
    );
    expect(MIGRATION).toMatch(
      /not exists \(select 1 from public\.signals s where s\.theme_id = t\.id and not s\.is_sample\)/,
    );
  });
});

describe("the clusterer carries the flag forward", () => {
  it("reads it off the signals at all", () => {
    // Without this column in the select, `sigs[n].is_sample` is undefined for
    // every row, `every` returns false, and the whole mechanism silently marks
    // nothing while looking correct.
    expect(CLUSTER).toMatch(/\.select\("id,content,source,tags,sentiment,embedding,is_sample"\)/);
  });

  it("marks a new theme only when EVERY member is a sample", () => {
    expect(CLUSTER).toMatch(/is_sample: members\.every\(/);
    // `some` here would label a real theme that happens to contain one seeded
    // signal, hiding genuine evidence behind an "Example" chip.
    expect(CLUSTER).not.toMatch(/is_sample: members\.some\(/);
  });

  it("clears the flag when real evidence merges into a seeded theme", () => {
    // The merge path attaches one signal to an existing theme. A seeded theme
    // that attracts a real signal is about the user's own product now.
    expect(CLUSTER).toMatch(
      /is_sample\?: boolean \| null \}\)\.is_sample \? \{\} : \{ is_sample: false \}/,
    );
  });

  it("only ever clears on merge, never sets", () => {
    // Setting it here would need a full re-read of the theme's signals; the one
    // signal in hand cannot prove the rest are samples. Clearing is monotonic
    // and needs no such proof.
    const merge = CLUSTER.slice(CLUSTER.indexOf("Lost the race"));
    expect(merge).not.toMatch(/is_sample: true/);
  });
});

describe("the brain refuses to recommend one", () => {
  it("getFocusNext filters them out of the ranking", () => {
    const fn = INSIGHTS.slice(INSIGHTS.indexOf("export const getFocusNext"));
    expect(fn.slice(0, 4000)).toMatch(/\.eq\("is_sample", false\)/);
  });

  it("the filter sits on the themes read, not somewhere later", () => {
    // A post-fetch .filter() would still spend the model call before dropping
    // the row, and would silently return fewer than the limit asked for.
    const fn = INSIGHTS.slice(INSIGHTS.indexOf("export const getFocusNext"));
    const themesRead = fn.indexOf('.from("themes")');
    const guard = fn.indexOf('.eq("is_sample", false)');
    expect(themesRead).toBeGreaterThan(-1);
    expect(guard).toBeGreaterThan(themesRead);
    expect(guard - themesRead).toBeLessThan(1200);
  });
});

describe("the DERIVE TICK refuses too, and it is the path that actually runs", () => {
  /**
   * The guards above protect `getFocusNext` in insights.functions.ts, which
   * insights.functions.ts itself documents as having no live caller. Its twin
   * `fetchRankedThemes` in derive-insights.server.ts reads the same table,
   * feeds the same `scoreTheme`, and IS live: `deriveAllInsights` runs from
   * routes/api/public/hooks/derive-tick.ts.
   *
   * Until 2026-08-10 it carried neither guard. Its filter was the single
   * literal `.neq("status", "archived")`, and `archived` is a value the column
   * has never held, so it excluded nothing: every tick ranked clusters the
   * user had already dismissed, merged or promoted, and ranked seeded demo
   * themes beside real ones. The test suite protected the dead path and left
   * the live one open, which is the shape of failure worth pinning here.
   */
  it("filters settled clusters using the canonical list, never a literal", () => {
    const fn = DERIVE.slice(DERIVE.indexOf("async function fetchRankedThemes"));
    expect(fn.slice(0, 3000)).toMatch(/\.not\("status", "in", SETTLED_THEME_STATUSES\)/);
  });

  it("takes that list from @/lib/spine/promote rather than retyping it", () => {
    // A hand-copy is how `promoted` came to be missing from two of the three
    // lists that already existed. A fourth copy would be the same defect.
    expect(DERIVE).toMatch(/import \{ INELIGIBLE_STATUSES \} from "@\/lib\/spine\/promote"/);
    expect(DERIVE).toMatch(
      /const SETTLED_THEME_STATUSES = `\(\$\{INELIGIBLE_STATUSES\.join\(","\)\}\)`/,
    );
  });

  it("the one-literal filter that excluded nothing is gone", () => {
    // Asserted against CODE, not prose. The comment above the fixed read
    // quotes the old filter verbatim so a future reader knows what was wrong,
    // and a naive scan of the raw file matches that sentence and passes a test
    // that should fail. Stripping comments first is the difference between a
    // guard on the behaviour and a guard on whether anyone described it.
    expect(codeOf(DERIVE)).not.toMatch(/\.neq\("status", "archived"\)/);
  });

  it("refuses sample themes, on the read rather than after it", () => {
    const fn = DERIVE.slice(DERIVE.indexOf("async function fetchRankedThemes"));
    const themesRead = fn.indexOf('.from("themes")');
    const guard = fn.indexOf('.eq("is_sample", false)');
    expect(themesRead).toBeGreaterThan(-1);
    expect(guard).toBeGreaterThan(themesRead);
    expect(guard - themesRead).toBeLessThan(1200);
  });
});

describe("Discover says which ones are examples", () => {
  it("labels the ranking row, so the label arrives before the click", () => {
    expect(DISCOVER).toMatch(/entry\.theme\.is_sample \? \(/);
    expect(DISCOVER).toMatch(/<b>Example<\/b>/);
  });

  it("and the Ask says it in full", () => {
    // P-14 (A-QUEUE.md, R-34) deleted /decide, which this test used to check
    // said the same disclaimer in the same words -- one vocabulary across two
    // stations. P-53 moved the card itself from `Gate` to `Ask`, whose
    // `reason` is one prose string rather than a `<b>`-carrying line, so the
    // disclaimer is plain text now; the claim is unchanged for the one
    // station that remains.
    expect(DISCOVER).toMatch(/focused\.theme\.is_sample/);
    expect(DISCOVER).toMatch(
      /This is an example\. It came with your workspace so this station had something to show\./,
    );
  });

  it("the reason array puts it FIRST, above the evidence", () => {
    // A disclaimer under the evidence arrives after the decision has formed.
    // Same reasoning as the Decide gate; P-53 moved the disclaimer into the
    // first entry of the `reason` array `Ask` reads, so array order is now
    // where this is enforced rather than JSX order inside a `Gate`.
    const lines = DISCOVER.slice(DISCOVER.indexOf("const reason = ["));
    const sample = lines.indexOf("focused.theme.is_sample");
    const rank = lines.indexOf("ranked.length > 1");
    expect(sample).toBeGreaterThan(-1);
    expect(rank).toBeGreaterThan(sample);
  });
});

describe("the live case this was found on, kept as a regression", () => {
  /**
   * Workspace 1eeef8f9 on 2026-08-06: three seeded themes and one the user's own
   * evidence produced. Scored with the product's OWN scoreTheme against the real
   * column values, the seeded "Strategic Position and Defensibility at Risk"
   * (severity 5, confidence 0.9, frequency 2) beat the user's "Data Export Needed
   * for Compliance and Reporting" (severity 4, confidence 0.9, frequency 1) by
   * 44%. So the front door recommended fiction over a real compliance finding and
   * spent a model call writing about it.
   *
   * The seeds score well BY DESIGN -- they were written to look like good bets --
   * which is why no scoring tweak could have fixed this and only knowing what they
   * are could.
   */
  const REF = "2026-07-09T18:10:19.691Z";
  const seeded = {
    severity: 5,
    confidence: 0.9,
    novelty: 1,
    frequency: 2,
    createdAt: REF,
    lastSignalAt: REF,
  };
  const real = {
    severity: 4,
    confidence: 0.9,
    novelty: 1,
    frequency: 1,
    createdAt: "2026-07-09T18:30:21.524Z",
    lastSignalAt: "2026-07-09T18:30:21.524Z",
  };

  it("confirms the seeded theme really does outrank the real one", async () => {
    const { scoreTheme } = await import("../brain/score");
    const now = Date.parse("2026-08-06T01:40:00Z");
    // If this ever flips, the fix above stopped being load bearing and this
    // test should be re-read rather than deleted.
    expect(scoreTheme(seeded as never, now)).toBeGreaterThan(scoreTheme(real as never, now));
  });
});
