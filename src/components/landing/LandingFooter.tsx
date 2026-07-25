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
      ],
    },
    {
      heading: "company",
      links: [
        { label: "Brief", href: "/brief" },
        { label: "@RohitGajaraj", href: "https://x.com/RohitGajaraj", external: true },
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
