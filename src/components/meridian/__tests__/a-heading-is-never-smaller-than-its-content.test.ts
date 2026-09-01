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

/** A `text-mrd-*` stop resolved to px, through meridian.css rather than a table
 *  kept in this file, so the ladder can move without this guard agreeing with
 *  itself forever. */
function stopToPx(stop: string): number | null {
  const css = readFileSync(join(MERIDIAN, "..", "..", "styles", "meridian.css"), "utf8");
  const rule = css.match(new RegExp(`@utility\\s+text-mrd-${stop}\\s*\\{([^}]*)\\}`));
  if (!rule) return null;
  const tok = rule[1].match(/font-size:\s*var\((--mrd-t-[a-z0-9-]+)\)/);
  if (!tok) return null;
  const decl = css.match(new RegExp(`${tok[1]}\\s*:\\s*([0-9.]+)px`));
  return decl ? Number(decl[1]) : null;
}

/**
 * The size of the ELEMENT that renders `marker`, however it is written and
 * however prettier has broken it across lines.
 *
 * ── FOUR TIMES A SPELLING, AND THE FIFTH TIME A LINE ─────────────────────
 * The fourth version looked only for `text-[Npx]`, so it threw the moment
 * `rows.tsx` said the same 14px as `text-mrd-prose`. The fifth is this one, and
 * it broke for a reason with nothing to do with sizes at all: it searched for a
 * single LINE holding both the marker and the size, and on 2026-09-01 `Row`'s
 * lead span grew a `title` attribute so the truncated text stops being
 * unreachable. Two attributes past 100 characters is a prettier line break, so
 * the size class and the child it sizes ended up four lines apart and this
 * guard threw `no line in rows.tsx carrying {lead}`.
 *
 * A LINE IS A FORMATTING ARTIFACT, NOT A CLAIM. The claim is "the element that
 * renders the lead is set at N px", so the reader takes the marker's line
 * TOGETHER with the attribute lines of the tag that opens it -- which is the
 * element, in the only form a source-reading guard can see one. It survives an
 * attribute being added, the attribute order changing, and prettier deciding
 * differently about where to wrap.
 *
 * A guard that fails when the code gets better is measuring the wrong thing,
 * and that now includes one that fails when the code is merely REFORMATTED.
 */
function elementRendering(file: string, marker: string): string {
  const lines = read(file).split("\n");
  const at = lines.findIndex((l) => l.includes(marker));
  if (at === -1) throw new Error(`${file} does not render ${marker} at all`);
  /* Back to the tag that opens the marker's element. Bounded at eight lines so
     a marker with no opening tag above it reads as a short element rather than
     silently swallowing the file and matching some unrelated size. */
  let start = at;
  while (start > 0 && at - start < 8 && !/^\s*<[A-Za-z]/.test(lines[start])) start -= 1;
  return lines.slice(start, at + 1).join(" ");
}

function sizeOnLineWith(file: string, marker: string): number {
  const el = elementRendering(file, marker);
  // A named stop first: it is the same size with the guess taken out, which is
  // the direction the whole migration moves in.
  const stop = el.match(/text-mrd-([a-z0-9]+)/);
  if (stop) {
    const px = stopToPx(stop[1]);
    if (px !== null) return px;
  }
  const m = el.match(/text-\[(\d+(?:\.\d+)?)px\]/);
  if (!m) throw new Error(`no size on the element rendering ${marker} in ${file}`);
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
 * `lead` is the branch carrying a tight leading (`leading-mrd-tight` since the
 * Meridian leading family landed 2026-08-23, `leading-tight` before it); the
 * default is the other one.
 */
function regionHeadingStops(): { lead: number; base: number } {
  const src = read("surface-parts.tsx");
  /*
   * SCOPED TO `Region`'S OWN BODY, AND THAT IS THE FOURTH BUG IN THIS READER.
   *
   * The second bug was matching `font-medium text-mrd-ink` across the whole
   * file, which returns SIX hits because other parts in here are headings on
   * the same ink at their own stops; the reader was picking the 25px one as
   * `lead`. That was narrowed to "the first `<h2>` in the file", which was only
   * ever true by accident -- it held because `Region` happened to own the
   * earliest `<h2>` in `surface-parts.tsx`.
   *
   * It stopped being true on 2026-09-01, when `SectionHead` was added ABOVE
   * `Region` with an `<h2 className="mrd-eyebrow">`. The reader then measured
   * that one, found no sized branches at all, and threw "read 0". Nothing about
   * the heading ladder had changed; a sibling component had simply been
   * declared earlier in the file.
   *
   * So the slice is taken from `Region`'s declaration to the next top-level
   * `export function`, and the `<h2>` is looked for inside it. That is the
   * CLAIM this guard is about -- Region's heading against Row's lead -- and it
   * no longer depends on declaration order in a file that gains parts weekly.
   */
  const body = src.match(/export function Region\(\{[\s\S]*?(?=\nexport function |$)/);
  if (!body)
    throw new Error(
      "Region is gone from surface-parts.tsx; this guard needs rewriting, not deleting",
    );
  const h2 = body[0].match(/<h2\b[\s\S]*?<\/h2>/);
  if (!h2)
    throw new Error("Region's <h2> is gone; this guard needs rewriting rather than deleting");
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
    // Either spelling: `leading-mrd-tight` is the house one since 2026-08-23,
    // `leading-tight` is what this branch used before the Meridian leading family
    // existed. Pinning the CLAIM rather than one of its two names.
    branches.push({ px: Number(m[1]), tight: /leading-(mrd-)?tight\b/.test(m[2]) });
  }
  for (const m of h2[0].matchAll(/"(mrd-[a-z]+)"/g)) {
    const px = roleToPx(m[1]);
    if (px === null)
      throw new Error(`Region's <h2> names ${m[1]}, which meridian.css does not size`);
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
