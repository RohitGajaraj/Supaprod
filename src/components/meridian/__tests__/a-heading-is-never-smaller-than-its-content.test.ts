import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * A REGION HEADING WAS SET SMALLER THAN THE ROWS UNDERNEATH IT, TWICE.
 *
 * THE DEFECT. `Region`'s `<h2>` is the label over a list, and `Row`'s `lead` is
 * an ordinary item in that list. The heading was 13px and the row was 14px, so
 * every region label in the product read as smaller than its own content. That
 * is the one relationship a heading may never have, and it does not announce
 * itself as a bug: nothing overlaps, nothing overflows, the page looks tidy and
 * the hierarchy is simply inverted.
 *
 * IT HAD ALREADY BEEN FOUND AND FIXED ONCE, AND THE PORT DROPPED THE FIX.
 * `src/styles/primitives.css` carries the original post-mortem in full:
 * `.sp-block-title` was 13.5px against `.sp-row-lead`'s 14px, measured
 * 2026-08-11, and on Brain the effect was total -- one 25px h1 and then ten
 * objects inside a single 1px band, so the sentences carrying the surface's
 * whole argument read at the optical weight of a row's metadata. The fix was to
 * put the label LEVEL with its rows and let the weight step separate them.
 *
 * Meridian's `Region` reintroduced it at a full 1px rather than half, with no
 * comment, which is what a reasoned decision would have had. So the second
 * occurrence was not a disagreement with the ruling; it was a port that never
 * saw it. THIS GUARD EXISTS SO THERE IS NO THIRD OCCURRENCE.
 *
 * WHY IT READS SOURCE RATHER THAN RENDERING. Both sizes are Tailwind arbitrary
 * values in `className` strings, so they resolve in the compiled stylesheet and
 * not in jsdom, where `getComputedStyle` reports nothing useful for either. The
 * numbers are the contract here, and reading them is honest about that rather
 * than rendering something and asserting on a value the environment invented.
 */

const MERIDIAN = join(import.meta.dir, "..");

const read = (file: string) => readFileSync(join(MERIDIAN, file), "utf8");

/** The px in the FIRST `text-[Npx]` on a line matching `marker`. */
function sizeOnLineWith(file: string, marker: string): number {
  const line = read(file)
    .split("\n")
    .find((l) => l.includes(marker) && /text-\[\d+(?:\.\d+)?px\]/.test(l));
  if (!line) throw new Error(`no line in ${file} carrying ${marker} and a text-[Npx]`);
  const m = line.match(/text-\[(\d+(?:\.\d+)?)px\]/);
  if (!m) throw new Error(`no text-[Npx] on the matched line in ${file}`);
  return Number(m[1]);
}

/**
 * `Region`'s two heading stops, read off the ternary rather than off a class
 * fragment.
 *
 * The first version of this matched the line containing `font-medium
 * text-mrd-ink`, which is true of BOTH branches, so it silently read the lead
 * branch's 20px as the default and the comparison passed for the wrong reason.
 * The third assertion below is what exposed it. A guard that reads the wrong
 * number and agrees with you is worse than no guard, which is the same lesson
 * the type-class collector in `src/styles/__tests__` had to learn.
 *
 * `lead` is the branch carrying `leading-tight`; the default is the other one.
 */
function regionHeadingStops(): { lead: number; base: number } {
  const src = read("surface-parts.tsx");
  /*
   * Scoped to the `<h2>` and its ternary, and that scoping is the second bug
   * this function had. Matching `font-medium text-mrd-ink` across the whole file
   * returns SIX hits, because other parts in here are also headings on the same
   * ink at their own stops (25px, two at 13px with `leading-snug`, one at 14px
   * with `leading-[1.4]`). The reader was picking the 25px one as `lead`.
   */
  const h2 = src.match(/<h2\b[\s\S]*?<\/h2>/);
  if (!h2) throw new Error("Region's <h2> is gone; this guard needs rewriting rather than deleting");
  /*
   * THE THIRD BUG THIS FUNCTION HAD, fixed 2026-08-23. It read the heading's
   * size by regex for `text-[Npx]`, so it broke the moment the branches moved
   * onto the ROLE utilities (`mrd-title`, `mrd-subtitle`) and found one branch
   * instead of two. It was reading a SPELLING, not the claim.
   *
   * A role's size is not written at the call site by design, which is the whole
   * point of a role, so it is resolved here the only honest way: through
   * `meridian.css`, from the utility to its `--mrd-t-*` token to the px. A guard
   * that hard-coded "mrd-title is 20" would agree with itself forever while the
   * token moved underneath it.
   */
  const css = readFileSync(join(MERIDIAN, "..", "..", "styles", "meridian.css"), "utf8");
  const roleToPx = (role: string): number | null => {
    const rule = css.match(new RegExp(`@utility\\s+${role}\\s*\\{([^}]*)\\}`));
    if (!rule) return null;
    const tok = rule[1].match(/font-size:\s*var\((--mrd-t-[a-z0-9-]+)\)/);
    if (!tok) return null;
    const decl = css.match(new RegExp(`${tok[1]}\\s*:\\s*([0-9.]+)px`));
    return decl ? Number(decl[1]) : null;
  };

  type Branch = { px: number; tight: boolean };
  const branches: Branch[] = [];
  for (const m of h2[0].matchAll(/"text-\[(\d+(?:\.\d+)?)px\]([^"]*)"/g)) {
    branches.push({ px: Number(m[1]), tight: m[2].includes("leading-tight") });
  }
  for (const m of h2[0].matchAll(/"(mrd-[a-z]+)"/g)) {
    const px = roleToPx(m[1]);
    if (px === null) throw new Error(`Region's <h2> names ${m[1]}, which meridian.css does not size`);
    // `mrd-title` is the lead branch: it is the only role in the ladder that
    // carries a display stop. Everything else in an <h2> here is the quiet one.
    branches.push({ px, tight: m[1] === "mrd-title" });
  }
  if (branches.length !== 2) {
    throw new Error(`expected two heading branches in Region's <h2>, read ${branches.length}`);
  }
  const lead = branches.find((b) => b.tight);
  const base = branches.find((b) => !b.tight);
  if (!lead || !base) throw new Error("could not tell Region's two heading branches apart");
  return { lead: lead.px, base: base.px };
}

describe("a region heading is never smaller than the rows it introduces", () => {
  const rowLead = sizeOnLineWith("rows.tsx", "{lead}");
  const { lead: regionLead, base: regionHeading } = regionHeadingStops();

  it("the row lead is still the size this guard was written against", () => {
    // Pinned so that lowering the ROW instead of raising the heading cannot
    // satisfy the comparison below. If this stop genuinely moves, this line is
    // the one that should be argued with.
    expect(rowLead).toBe(14);
  });

  it("the region heading is at least the row lead", () => {
    expect(regionHeading).toBeGreaterThanOrEqual(rowLead);
  });

  it("the lead variant is still the dominant rung, so the two are not merged", () => {
    // `lead` is how a region asks to be dominant. If it ever collapsed onto the
    // same stop as the default, the fix above would have removed a distinction
    // rather than restored a floor. This is also the assertion that caught the
    // first version of the reader above pointing at the wrong branch.
    expect(regionLead).toBeGreaterThan(regionHeading);
  });

  it("reads the two branches apart, and neither is the other", () => {
    // Anti-emptiness, and specifically anti-ambiguity: the numbers must be the
    // two real stops rather than one stop found twice.
    expect(regionHeading).toBe(14);
    expect(regionLead).toBe(20);
  });
});
