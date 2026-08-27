/**
 * THE PAGES A PUBLIC FOOTER POINTS AT, WRITTEN ONCE.
 *
 * Raised by S4 as "one of those two copies will drift from the other". It had
 * already drifted, three ways, before anybody looked:
 *
 *   LegalPageShell   Security · ARD · Changelog · Proof · Privacy · Terms
 *   demo.tsx         Security · ARD · Changelog · Proof · Privacy · Terms
 *   film.tsx         Security ·       Changelog · Proof · Privacy · Terms
 *
 * /film had lost ARD, with no comment saying it was deliberate, and its order
 * differed too. Five surfaces in this repo type this list by hand; two more
 * carry a different SELECTION of the same pages and one of those calls
 * `/privacy` "Privacy policy". None of that is wrong on its own. All of it
 * together means a page added tomorrow reaches some footers and not others,
 * and nobody finds out.
 *
 * ── WHAT THIS SHARES, AND WHAT IT DELIBERATELY DOES NOT ───────────────────
 *
 * It shares the PAGES: an href and the word this product uses for it. It does
 * not share a footer COMPONENT, because the three footers are genuinely
 * different objects -- the legal shell centres a 720px column, /demo and /film
 * put a copyright opposite the links at 5xl -- and forcing one layout on three
 * contexts would be a worse defect than the one being fixed. Sharing the list
 * is what stops the drift; sharing the box would only move it.
 *
 * A surface that needs a different WORD for a page can still say so, and two
 * do. The point is that it then has to say so on purpose, in one place, rather
 * than by retyping a string.
 */

export interface SiteLink {
  readonly href: string;
  readonly label: string;
}

/**
 * Every page a footer on this site points at, with the word the product uses
 * for it. `/updates` is called "Changelog" everywhere it is linked, which is
 * why the key and the href differ: the key is what we call it, the href is
 * where it lives, and pretending those are the same is how a rename breaks a
 * link.
 */
export const SITE_PAGE = {
  security: { href: "/security", label: "Security" },
  ard: { href: "/ard", label: "ARD" },
  changelog: { href: "/updates", label: "Changelog" },
  proof: { href: "/proof", label: "Proof" },
  privacy: { href: "/privacy", label: "Privacy" },
  terms: { href: "/terms", label: "Terms" },
  faq: { href: "/faq", label: "FAQ" },
} as const satisfies Record<string, SiteLink>;

/**
 * The six every public footer carries, in one order.
 *
 * The order is the legal shell's, which is the one four of the five public
 * pages already used: the two a visitor checks before trusting us
 * (security, the spec), then the two that prove we ship and grade ourselves
 * (changelog, track record), then the two they are legally owed.
 */
export const PUBLIC_FOOTER_LINKS: readonly SiteLink[] = [
  SITE_PAGE.security,
  SITE_PAGE.ard,
  SITE_PAGE.changelog,
  SITE_PAGE.proof,
  SITE_PAGE.privacy,
  SITE_PAGE.terms,
];
