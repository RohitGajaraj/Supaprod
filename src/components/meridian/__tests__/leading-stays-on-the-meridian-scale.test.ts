import { describe, expect, it } from "bun:test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const MERIDIAN = join(import.meta.dir, "..");
const CSS = join(MERIDIAN, "..", "..", "styles", "meridian.css");

/**
 * EVERY LEADING IN A MERIDIAN COMPONENT RESOLVES TO A VALUE MERIDIAN CHOSE.
 *
 * ── THE DEFECT THIS CLOSES, MEASURED 2026-08-23 ─────────────────────────
 * Two of Tailwind's leading names already exist in Meridian AT A DIFFERENT
 * NUMBER, and nothing stopped an author reaching the wrong one:
 *
 *   leading-snug    Tailwind 1.375   --mrd-lh-snug  1.5
 *   leading-tight   Tailwind 1.25    --mrd-lh-tight 1.15
 *
 * Six components were on `leading-snug` and four on `leading-tight`, every one
 * of them reading as though it were on scale. The snug case is the one that
 * showed: `--mrd-lh-snug` is 1.5 because its own comment says it "was 1.4" and
 * "the reference's air lives here", so those six rows were rendering TIGHTER
 * THAN THE VALUE MERIDIAN REPLACED. That is the founder's "every word is stuck
 * and very close to each other" with a number attached, and it was never a
 * judgment their authors made. It was a name resolving to the wrong system.
 *
 * ── WHY THIS GUARD IS SHAPED THE WAY IT IS ──────────────────────────────
 * It pins the CLAIM, not a spelling. Four guards in this directory failed a
 * correct change on 2026-08-23 because each asserted a literal string that
 * improved out from under it. So this one resolves every `leading-mrd-*` class
 * through `meridian.css` to its `--mrd-lh-*` token and fails if the chain
 * breaks. A typo'd `leading-mrd-relaxed` emits NO RULE under Tailwind's
 * `@utility` (it is only emitted when it exists and is used), so the element
 * would silently inherit its parent's leading. That failure is invisible on
 * screen and this is the thing that sees it.
 *
 * Anything not on the scale must be listed below WITH ITS REASON. The list is
 * the point: an off-scale leading is allowed when someone measured it, and
 * banned when nobody did.
 */

/** Off the scale on purpose. Each entry is a measurement or a rule, never taste. */
const EXEMPT: ReadonlyArray<{ cls: string; why: string }> = [
  {
    cls: "leading-[1.4]",
    why:
      "Row height, measured. `rows.tsx` records Line as the most-used row in the app " +
      "at 46.9px, inside the 45-55px band the density research says appears almost " +
      "nowhere in shipped products; row leading took it to 44.9px and py-[11px] to " +
      "40.9px. Those two values ARE that fix. NOTE the open question in the answer " +
      "file: the argument is about a single-line row's BOX HEIGHT, and it was never " +
      "an argument about wrapped supporting text inheriting the same 1.4.",
  },
  {
    cls: "leading-[18px]",
    why:
      "A px leading, not a ratio, because the textarea and its invisible measuring " +
      "twin in PromptBar must agree to the pixel or the caret sits off the text. A " +
      "ratio would resolve differently against the two font sizes.",
  },
  {
    cls: "leading-none",
    why:
      "One caller, a display numeral in boundary-states.tsx. The rule settled " +
      "2026-08-23 is that a token earns its place on the SECOND caller, and it was " +
      "applied to eight of LANE 1's requested stops the same morning. It applies to " +
      "Meridian's own family too, so no --mrd-lh-none exists to reach for.",
  },
];

function files(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "__tests__") continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...files(p));
    else if (name.endsWith(".tsx") || name.endsWith(".ts")) out.push(p);
  }
  return out;
}

/** `leading-mrd-x` -> the number meridian.css actually paints, or null if the
 *  chain is broken at either link. */
function resolve(css: string, cls: string): number | null {
  const util = css.match(new RegExp(`@utility\\s+${cls}\\s*\\{([^}]*)\\}`));
  if (!util) return null;
  const tok = util[1].match(/line-height:\s*var\((--mrd-lh-[a-z0-9-]+)\)/);
  if (!tok) return null;
  const decl = css.match(new RegExp(`${tok[1]}\\s*:\\s*([0-9.]+)\\s*;`));
  return decl ? Number(decl[1]) : null;
}

describe("leading stays on the Meridian scale", () => {
  const css = readFileSync(CSS, "utf8");
  const sources = files(MERIDIAN).map((p) => ({ p, s: readFileSync(p, "utf8") }));
  const exemptSet = new Set(EXEMPT.map((e) => e.cls));

  it("finds the components, so an empty scan can never pass as clean", () => {
    expect(sources.length).toBeGreaterThan(30);
  });

  it("every leading-mrd-* used resolves through meridian.css to a real number", () => {
    const used = new Set<string>();
    for (const { s } of sources) {
      for (const m of s.matchAll(/\bleading-mrd-[a-z0-9-]+/g)) used.add(m[0]);
    }
    // The family is only worth having if it is reached for.
    expect(used.size).toBeGreaterThan(0);

    const broken = [...used].filter((c) => resolve(css, c) === null);
    expect(broken).toEqual([]);
  });

  it("no leading resolves to a value Meridian did not choose", () => {
    const offenders: string[] = [];
    for (const { p, s } of sources) {
      for (const m of s.matchAll(/\bleading-(?!mrd-)[a-z0-9[\].-]+/g)) {
        if (!exemptSet.has(m[0])) offenders.push(`${p.replace(MERIDIAN, "")}  ${m[0]}`);
      }
    }
    expect(offenders).toEqual([]);
  });

  it("the two colliding names are gone, because they are the ones that mislead", () => {
    // `snug` and `tight` exist in BOTH systems at different numbers. A Meridian
    // component may never carry the Tailwind spelling of either.
    const collisions: string[] = [];
    for (const { p, s } of sources) {
      for (const m of s.matchAll(/\bleading-(snug|tight)\b/g)) {
        collisions.push(`${p.replace(MERIDIAN, "")}  ${m[0]}`);
      }
    }
    expect(collisions).toEqual([]);
  });

  it("snug is still the value the air ruling set, so the fix cannot be undone in css", () => {
    // Guards the OTHER end: converting the call sites is pointless if the token
    // is quietly walked back to 1.4.
    expect(resolve(css, "leading-mrd-snug")).toBe(1.5);
    expect(resolve(css, "leading-mrd-tight")).toBe(1.15);
    expect(resolve(css, "leading-mrd-prose")).toBe(1.625);
    expect(resolve(css, "leading-mrd-mono")).toBe(1.7);
  });

  it("every exemption carries a reason, so the list cannot become a dumping ground", () => {
    for (const e of EXEMPT) expect(e.why.length).toBeGreaterThan(40);
  });
});
