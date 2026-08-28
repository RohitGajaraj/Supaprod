/**
 * THREE PUBLIC FOOTERS TYPED THE SAME SIX LINKS BY HAND, AND HAD ALREADY DRIFTED.
 *
 * Raised by S4 as "one of those two copies will drift from the other". It had
 * drifted before anybody looked:
 *
 *   LegalPageShell   Security · ARD · Changelog · Proof · Privacy · Terms
 *   demo.tsx         Security · ARD · Changelog · Proof · Privacy · Terms
 *   film.tsx         Security ·       Changelog · Proof · Privacy · Terms
 *
 * /film had lost ARD with no comment saying it was deliberate, and its order
 * differed too. A page added tomorrow would have reached some footers and not
 * others, and nobody would have found out.
 *
 * This guards the shape of the fix rather than the strings: that the three
 * surfaces read one list, and that the list still points somewhere real.
 */
import { describe, it, expect } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { PUBLIC_FOOTER_LINKS, SITE_PAGE } from "../site-links";

const FOOTERS = [
  "src/routes/demo.tsx",
  "src/routes/film.tsx",
  "src/components/supaprod/LegalPageShell.tsx",
];

/** Comments quote the old hand-typed lists to explain them. */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
}

describe("one footer list", () => {
  it("no public footer types the links by hand any more", () => {
    for (const f of FOOTERS) {
      const src = code(readFileSync(f, "utf8"));
      /* `FooterLinks` since U-136: sharing the LIST left each footer drawing
         its own anchor, so U-135's 44px hit area reached five routes and missed
         two. The link is shared now; the box around it is not. */
      expect(src, `${f} does not use the shared link`).toContain("FooterLinks");
      // The tell of a hand-typed copy: an href literal for one of these pages
      // sitting inside a `label:` object rather than coming from the list.
      expect(src, `${f} still hand-types a footer link`).not.toMatch(
        /\{\s*href:\s*"\/(security|ard|updates|proof|privacy|terms)"/,
      );
    }
  });

  it("every page in the list has a route to land on", () => {
    for (const link of Object.values(SITE_PAGE)) {
      const slug = link.href.replace(/^\//, "");
      const candidates = [`src/routes/${slug}.tsx`, `src/routes/${slug}.index.tsx`];
      expect(
        candidates.some((c) => existsSync(c)),
        `${link.href} (${link.label}) has no route file`,
      ).toBe(true);
    }
  });

  it("the six are the six, in one order", () => {
    expect(PUBLIC_FOOTER_LINKS.map((l) => l.href)).toEqual([
      "/security",
      "/ard",
      "/updates",
      "/proof",
      "/privacy",
      "/terms",
    ]);
  });

  /* The key and the href differ for one page on purpose: `/updates` is called
     "Changelog" everywhere it is linked. Pretending those are the same string
     is how a rename breaks a link. */
  it("a page whose name is not its path keeps both", () => {
    expect(SITE_PAGE.changelog.href).toBe("/updates");
    expect(SITE_PAGE.changelog.label).toBe("Changelog");
  });
});

/**
 * THE HIT AREA HAS TO TRAVEL WITH THE LINK.
 *
 * U-111 shared the list and left the rendering alone, on the reasoning that
 * three different footer boxes should not be forced into one. That was right
 * about the box and wrong about the link: U-135 gave these six a 44px `::after`
 * overlay and it reached the five routes using LegalPageShell while /demo and
 * /film, which drew their own anchors from the same list, kept 21px targets.
 *
 * A behaviour that must be identical everywhere cannot live in one of the three
 * places that draw it.
 */
describe("the hit area travels with the link", () => {
  it("one component renders the anchor, and it carries the sized class", () => {
    const shared = readFileSync("src/components/supaprod/FooterLinks.tsx", "utf8");
    expect(shared).toContain("legal-footer-link");
    expect(shared).toContain("PUBLIC_FOOTER_LINKS.map");
  });

  it("and the size is not something a caller can override", () => {
    const shared = readFileSync("src/components/supaprod/FooterLinks.tsx", "utf8");
    // `className` is appended for colour and type. If a caller could pass the
    // sized class or a height, the fix would be optional again.
    expect(shared).toMatch(/legal-footer-link \$\{className\}/);
    const css = readFileSync("src/styles/public-legibility.css", "utf8");
    expect(css).toContain(".legal-footer-link::after");
    expect(css).toMatch(/width:\s*44px/);
    expect(css).toMatch(/height:\s*44px/);
  });

  /* An overlay, not padding: a pseudo-element is out of flow and cannot reflow
     the row, which padding plus a negative margin does not guarantee inside a
     centred flex row. */
  it("the target is an out-of-flow overlay", () => {
    const css = readFileSync("src/styles/public-legibility.css", "utf8");
    const rule = css.slice(css.indexOf(".legal-footer-link::after"));
    expect(rule).toContain("position: absolute");
    expect(rule).not.toMatch(/\bpadding\b/);
  });
});
