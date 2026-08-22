import { MachineViewToggle } from "@/components/supaprod/MachineViewToggle";

/**
 * Footer: dense, honest footer for investor diligence.
 * Columns: Product · Proof · Trust · Company
 * The bottom row carries the [HUMAN]/[MACHINE] view toggle: meta chrome
 * belongs at footer tier, aligned to the container, never loose in a corner.
 *
 * Craft pass 2026-07-25:
 * - The Product column's "Machine view" button was cut. It fired a synthetic
 *   keydown to toggle the same state the labeled, stateful control two rows
 *   below already owns, so the footer shipped one feature as two controls.
 *   The M key and the bottom-row toggle both remain.
 * - Column headings moved from white semibold Sans to the page's mono
 *   metadata voice. They are labels, not statements, and at footer tier they
 *   must not compete with the close directly above them: after the CTA, the
 *   brightest thing on screen should not be the word "Product".
 * - gray-* became zinc-*, which is what every other section on this page uses.
 *   One neutral ramp, not two.
 */
export function LandingFooter() {
  const columns: {
    heading: string;
    links: { label: string; href: string; external?: boolean }[];
  }[] = [
    {
      heading: "product",
      links: [
        // "How it works" first, and it is the reason this line exists.
        // /product carried sitemap priority 0.9 and ZERO inbound internal links
        // anywhere in the app, verified 2026-08-07. A sitemap states intent; an
        // internal link is the only thing that actually passes authority, so an
        // orphaned page ranks poorly no matter what priority it claims. This is
        // now the site's one inbound path to it.
        { label: "How it works", href: "/product" },
        { label: "Demo", href: "/demo" },
        { label: "Pricing", href: "/pricing" },
        { label: "Updates", href: "/updates" },
      ],
    },
    {
      heading: "proof",
      links: [
        // The /proof link STAYS, and that is a considered call rather than an
        // oversight. /proof currently renders three honest empty states, and the
        // 2026-08-09 ruling pulled it out of the landing page's Receipts beat for
        // exactly that reason. But a beat is persuasion and a footer is a
        // directory, and the two fail differently: the beat was asserting
        // evidence it did not have, while the footer only says the page exists,
        // which is true. Removing it would also leave /proof with ZERO inbound
        // internal links, the precise condition documented six lines above as
        // what was crippling /product. An orphaned page is not indexed, and the
        // page publishes our calibration number the moment one outcome settles.
        // Labelled "Track record", not "Trust ledger". "Ledger" is a word
        // product operators effectively never use for this (0.2 per million in
        // 5.72M words of operator conversation, and "trust ledger" zero times);
        // "track record" is the phrase they already say for what /proof shows.
        // The href is unchanged, so nothing about the routing moves.
        { label: "Track record", href: "/proof" },
        // REMOVED 2026-08-09: { label: "A decision record", href: "/d/acf1fa74..." }
        //
        // The slug is written truncated on purpose. no-seeded-slugs.test.ts
        // fails on a full 32-hex literal ANYWHERE, comments included, because a
        // comment carrying a working fixture slug is one copy-paste from being
        // live again. Documentation should survive; the constant should not.
        //
        // That slug is a SEED FIXTURE. It belongs to workspace e375a61c
        // ("Explore workspace") with is_sample = true, and it resolves live to
        // "Supersede SQL-first with a natural-language question box", dated
        // Jun 5 2026. It is the exact class of row listPublicDecisions() filters
        // out of /proof so the ledger can never present fabricated content as
        // real history.
        //
        // This is the SAME defect the 2026-08-05 fix wrote up at length in
        // src/components/landing/Receipts.tsx, and it survived that fix because
        // the fix swapped the constant in ONE file while the footer held its own
        // copy. The guard written alongside it only read Receipts.tsx, so it
        // could never have caught this. The site was refusing to show this row
        // on the ledger and linking it from the footer under the heading
        // "proof", labelled "A decision record".
        //
        // Nothing replaces it. There is no real public decision to point at yet:
        // every public, slugged decision in the database sits in an is_sample
        // workspace. When one exists, /proof lists it live, which is why /proof
        // above is the honest destination for this idea. The guard in
        // src/components/landing/no-seeded-slugs.test.ts now covers every file.
        // REMOVED 2026-08-22 (founder): { label: "A public teardown", href: "/p/teardown" }.
        // The surface is retired; the URL is now a permanent redirect to /demo,
        // so keeping the row would have put a silently-bouncing link in the
        // footer. Nothing replaces it here: /demo is where the redirect lands
        // and it is already the second row of the "product" column above, so
        // re-listing it under "proof" would be the same destination twice.
        // Record: docs/decisions/public-teardown-retired-2026-08.md.
        { label: "ARD spec", href: "/ard" },
      ],
    },
    {
      heading: "trust",
      links: [
        { label: "Security", href: "/security" },
        { label: "Privacy", href: "/privacy" },
        { label: "Terms", href: "/terms" },
        { label: "FAQ", href: "/faq" },
      ],
    },
    {
      heading: "company",
      links: [
        // Labelled for the audience, pointed at the canonical URL. "Brief" told
        // a visitor nothing about who it was for; "Investors" sets the
        // expectation before the click. The href stays /brief so the common
        // path costs no redirect hop, while /investors resolves for anyone who
        // types it (see routes/investors.tsx).
        { label: "Investors", href: "/brief" },
        // The company handle, not the founder's. `x.com/RohitGajaraj` sat here
        // until 2026-08-07 and returned 404 live, on a launch that runs on X:
        // the one outbound social link on the page was broken. `@supaprodhq`
        // was claimed 2026-08-05 and returns 200.
        { label: "@supaprodhq", href: "https://x.com/supaprodhq", external: true },
        // A HUMAN CHANNEL, added 2026-08-07. Until today the only way to reach
        // anyone from this site was an X handle, and that handle 404'd. A
        // Product Hunt visitor with a question had nowhere to go, on the one
        // day questions arrive in public and go unanswered in public.
        //
        // A mailto rather than a contact form on purpose: a form needs a
        // handler, a store and a place someone reads, and every one of those is
        // a thing that can silently not exist. `hello@supaprod.ai` already
        // routes through Cloudflare to a live inbox, so this works the moment
        // it ships and cannot rot into a black hole.
        { label: "hello@supaprod.ai", href: "mailto:hello@supaprod.ai", external: true },
      ],
    },
  ];

  // pt tighter than pb (founder 2026-07-15): the footer sits close under the
  // waitlist close; the section above keeps its own decent space.
  return (
    <footer className="border-t border-white/[0.07] pt-6 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-10 mb-12 text-sm">
          {columns.map((col) => (
            <div key={col.heading}>
              <h4
                className="font-mono text-[10px] uppercase text-zinc-400 mb-4"
                style={{ letterSpacing: "0.2em" }}
              >
                {col.heading}
              </h4>
              <ul className="space-y-2.5 text-zinc-500">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      {...(l.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="hover:text-zinc-200 transition-colors duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
                    >
                      {l.label}
                    </a>
                  </li>
                ))}
                {col.heading === "company" && (
                  <li className="text-zinc-400">Built in public since May 2026</li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom divider: copyright on one side, the machine-view toggle on
            the other. Agents get a stateful, labeled control (aria-pressed);
            the M key remains as the keyboard entry point. */}
        <div className="border-t border-white/[0.07] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>&copy; 2026 Supaprod. All rights reserved.</p>
          <MachineViewToggle />
        </div>
      </div>
    </footer>
  );
}
