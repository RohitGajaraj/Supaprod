/**
 * A DOOR THAT LANDS ON THE WRONG PAGE IS WORSE THAN NO DOOR, AND ONE SHIPPED.
 *
 * ── THE DEFECT, FOUND 2026-09-10 ──────────────────────────────────────────
 * The run screen's hold card offers "Connect a repository" when a station
 * cannot start without one. It pointed at `/settings?tab=connectors`.
 *
 * `connectors` is not a `SectionId` and it is not in `LEGACY_SECTION_MAP`, so
 * `normalizeSection` fell straight through to `DEFAULT_SECTION` and the link
 * landed on **Profile**. The single actionable control on that card -- the half
 * an agent's prose cannot be, because prose is not a link -- sent a person to
 * their account settings, from the day it shipped.
 *
 * `AppFrame.tsx`, one directory away, used `?tab=connections` and was right the
 * whole time. The vocabulary was correct next door.
 *
 * ── WHY NOTHING CAUGHT IT ─────────────────────────────────────────────────
 * The wall was verified and the door was not. I read the database, proved the
 * workspace genuinely had no repository bound, and reported the door correct on
 * the strength of the wall being correct. Those are two claims and only one was
 * checked. `tsc` cannot see it -- the href is a string. The route cannot see it
 * -- an unknown section is a legitimate input that resolves to the default,
 * which is the behaviour that makes a typo silent.
 *
 * ── AND THIS IS A GUARD WORTH HAVING, WHERE TWO OTHERS WERE NOT ───────────
 * Two similar ideas were measured and declined tonight: a cache-key checker
 * (365 sites, 6 flagged, 0 real) and a label-similarity scorer (fires on its
 * own fix at four words). Both needed a JUDGEMENT and could not make one.
 *
 * This one needs none. The set of valid section values is ENUMERABLE and
 * exported -- `ALL_SECTION_IDS`, `LEGACY_SECTION_MAP`, `OFF_PAGE_SECTIONS` --
 * so a link either names one or it does not, and there is no threshold to
 * argue about. That is the difference between a census and a classifier
 * wearing a census's clothes: the fact has to be nameable from a column, and
 * here it is a column.
 */
import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { ALL_SECTION_IDS, LEGACY_SECTION_MAP, OFF_PAGE_SECTIONS } from "@/lib/settings-sections";

/** Every value `?section=` or `?tab=` may carry and still land where it says. */
const RESOLVES = new Set<string>([
  ...(ALL_SECTION_IDS as readonly string[]),
  ...Object.keys(LEGACY_SECTION_MAP),
  ...Object.keys(OFF_PAGE_SECTIONS),
]);

function sourceFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      sourceFiles(path, out);
    } else if (/\.(ts|tsx)$/.test(name) && !name.includes(".test.")) {
      out.push(path);
    }
  }
  return out;
}

/** A source guard scoring the prose that explains it is the standing trap. */
const codeOnly = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");

type Link = { file: string; value: string };

const LINKS: Link[] = sourceFiles("src").flatMap((file) => {
  const code = codeOnly(readFileSync(file, "utf8"));
  /* `/settings?section=x` and the legacy `?tab=x`, in a string literal. */
  return [...code.matchAll(/\/settings\?(?:section|tab)=([A-Za-z0-9_-]+)/g)].map((m) => ({
    file,
    value: m[1]!,
  }));
});

describe("every settings link in the product names a real section", () => {
  it("so no door falls through to the default page", () => {
    /*
     * An unresolvable value is not an error at runtime -- it lands on Profile
     * and says nothing. That silence is the whole defect: a person clicks
     * "Connect a repository", arrives at their account settings, and has no
     * way to tell whether the product is broken or they misread the link.
     */
    const broken = LINKS.filter((l) => !RESOLVES.has(l.value)).map(
      (l) => `${l.file} -> ?${l.value}`,
    );
    expect(broken).toEqual([]);
  });

  it("and the scan actually found the links, so a clean run means something", () => {
    /*
     * THE MIRROR. The assertion above passes by finding nothing, so a regex
     * that stopped matching -- or a walk that stopped descending -- would
     * report every door in the product healthy while reading none of them.
     */
    expect(LINKS.length).toBeGreaterThanOrEqual(2);
    expect(RESOLVES.size).toBeGreaterThanOrEqual(16);
    /* And the vocabulary is real: the section the hold card's door needs is in
       it, which is the fact the broken link failed to satisfy. */
    expect(RESOLVES.has("connections")).toBe(true);
    /* The value that shipped, still not a section, which is why it landed on
       Profile. If somebody ever makes `connectors` real, this line fails and
       whoever changed it re-reads the door rather than inheriting a comment
       that has quietly become false. */
    expect(RESOLVES.has("connectors")).toBe(false);
  });
});
