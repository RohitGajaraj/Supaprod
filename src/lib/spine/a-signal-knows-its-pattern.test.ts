/**
 * F-129: A SIGNAL KNEW ITS PATTERN AND COULD ONLY SAY "clustered".
 *
 * The run's Discover pane ended a signal's line with the bare word *"clustered"*.
 * `SESSION-1` asks that pane to show signals **"visibly grouping into themes as
 * clustering runs"** and calls it the most convincing thing in the product. A
 * state word is not a pattern. The pattern has a name, and `theme_id` was
 * already on the row being returned.
 *
 * ── THE PART THAT IS A RULING, NOT A FEATURE ───────────────────────────────
 * S1 shipped a first version that resolved the title from the theme's
 * MEMBERSHIP of the track, having measured that 1,133 signals carry a
 * `theme_id` while only 315 of those themes are attached to the same track, and
 * designed the surface to degrade for the other 818.
 *
 * The founder corrected the APPROACH rather than the code: that is fitting the
 * platform to whatever rows happen to be sitting in the database, and most of
 * ours is demo seed. **`signals.theme_id -> themes.id` is the platform truth and
 * it holds whether or not anything remembered to attach the theme.** Membership
 * is bookkeeping. Designing around a gap in bookkeeping bakes today's mess into
 * the product, and the missing attachment becomes a defect to fix rather than a
 * case to design for.
 *
 * The generalisation, worth keeping: **a measurement of current rows may shape
 * PRIORITY and must never shape DESIGN.**
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const SRC = readFileSync(fileURLToPath(new URL("./track.functions.ts", import.meta.url)), "utf8");
const CODE = SRC.split("\n")
  .filter((l) => {
    const t = l.trim();
    return !t.startsWith("*") && !t.startsWith("//") && !t.startsWith("/*");
  })
  .join("\n");

describe("the title comes from the foreign key, not from membership", () => {
  it("it reads the themes table by id", () => {
    expect(CODE).toContain('.from("themes")');
    expect(CODE).toContain('.select("id,title")');
    expect(CODE).toContain('.in("id", themeIds)');
  });

  it("the ids come from the signals' own theme_id", () => {
    expect(CODE).toContain("v.fields.theme_id");
  });

  it("and NOT from spine_track_members", () => {
    /*
     * The ruling, as an assertion. Resolving through membership would be
     * correct for 315 of 1,133 signals and would quietly degrade for 818, which
     * is fitting the product to a gap in bookkeeping.
     */
    const region = CODE.slice(CODE.indexOf("const themeIds"), CODE.indexOf("const chain ="));
    expect(region).not.toContain("spine_track_members");
    expect(region).not.toContain("artifact_kind");
  });
});

describe("one read, and no cap", () => {
  it("a single query covers the whole pane", () => {
    const region = CODE.slice(CODE.indexOf("const themeIds"), CODE.indexOf("const chain ="));
    expect((region.match(/\.from\("themes"\)/g) ?? []).length).toBe(1);
  });

  it("with no limit, because a cap loses the oldest clusters silently", () => {
    /*
     * S1 rejected doing this client-side with `listThemes` for exactly this: it
     * stops at the 300 newest, so a signal whose cluster is older would lose
     * its name and nothing would say why. A limit fitted to today's row count is
     * the same mistake one layer down.
     */
    const region = CODE.slice(CODE.indexOf("const themeIds"), CODE.indexOf("const chain ="));
    expect(region).not.toContain(".limit(");
  });

  it("and it is skipped entirely when no signal carries a theme", () => {
    expect(CODE).toContain("if (themeIds.length > 0)");
  });
});

describe("we did not look, so we claim nothing", () => {
  it("a failed theme read leaves the field ABSENT, not null-and-present", () => {
    /*
     * The same fail direction as the artifact loop above it, which says so in
     * those words. "This signal has no name for its cluster" and "we could not
     * read the names" must stay apart, or the pane states the first while the
     * second is true.
     */
    expect(CODE).toContain("if (!themeErr) {");
  });

  it("but a theme that is genuinely gone is carried as null", () => {
    // We read the table successfully and the row was not in it. That is a fact
    // about the data, not a silence about our query.
    expect(CODE).toContain("titleById.get(tid) ?? null");
  });

  it("a signal with no theme_id is left alone entirely", () => {
    expect(CODE).toContain('if (typeof tid !== "string" || !tid) continue;');
  });
});
