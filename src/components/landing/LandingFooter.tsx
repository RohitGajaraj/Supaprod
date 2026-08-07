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
        { label: "Trust ledger", href: "/proof" },
        { label: "A decision record", href: "/d/acf1fa74a20840cda5759644c6f02c05" },
        { label: "A public teardown", href: "/p/teardown" },
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
                className="font-mono text-[10px] uppercase text-zinc-600 mb-4"
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
                  <li className="text-zinc-600">Built in public since May 2026</li>
                )}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom divider: copyright on one side, the machine-view toggle on
            the other. Agents get a stateful, labeled control (aria-pressed);
            the M key remains as the keyboard entry point. */}
        <div className="border-t border-white/[0.07] pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-600">
          <p>&copy; 2026 Supaprod. All rights reserved.</p>
          <MachineViewToggle />
        </div>
      </div>
    </footer>
  );
}
