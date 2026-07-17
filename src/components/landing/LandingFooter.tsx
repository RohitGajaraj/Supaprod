import { MachineViewToggle } from "@/components/cadence/MachineViewToggle";

/**
 * Footer: Dense, honest footer for investor diligence
 * Columns: Product · Proof · Trust · Company
 * The bottom row carries the [HUMAN]/[MACHINE] view toggle: meta chrome
 * belongs at footer tier, aligned to the container, never loose in a corner.
 */
export function LandingFooter() {
  // pt tighter than pb (founder 2026-07-15): the footer sits close under the
  // waitlist close; the section above keeps its own decent space.
  return (
    <footer className="border-t border-white/[0.07] pt-6 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12 text-sm">
          {/* Product */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-gray-500">
              <li>
                <a href="/demo" className="hover:text-gray-300 transition-colors">
                  Demo
                </a>
              </li>
              <li>
                <a href="/pricing" className="hover:text-gray-300 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <a href="/updates" className="hover:text-gray-300 transition-colors">
                  Updates
                </a>
              </li>
              <li>
                <button
                  className="hover:text-gray-300 transition-colors"
                  onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "m" }))}
                >
                  Machine view
                </button>
              </li>
            </ul>
          </div>

          {/* Proof */}
          <div>
            <h4 className="text-white font-semibold mb-4">Proof</h4>
            <ul className="space-y-2 text-gray-500">
              <li>
                <a href="/proof" className="hover:text-gray-300 transition-colors">
                  Trust ledger
                </a>
              </li>
              <li>
                <a
                  href="/d/acf1fa74a20840cda5759644c6f02c05"
                  className="hover:text-gray-300 transition-colors"
                >
                  A decision record
                </a>
              </li>
              <li>
                <a href="/p/teardown" className="hover:text-gray-300 transition-colors">
                  A public teardown
                </a>
              </li>
              <li>
                <a href="/ard" className="hover:text-gray-300 transition-colors">
                  ARD spec
                </a>
              </li>
            </ul>
          </div>

          {/* Trust */}
          <div>
            <h4 className="text-white font-semibold mb-4">Trust</h4>
            <ul className="space-y-2 text-gray-500">
              <li>
                <a href="/security" className="hover:text-gray-300 transition-colors">
                  Security
                </a>
              </li>
              <li>
                <a href="/privacy" className="hover:text-gray-300 transition-colors">
                  Privacy
                </a>
              </li>
              <li>
                <a href="/terms" className="hover:text-gray-300 transition-colors">
                  Terms
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-gray-500">
              <li>
                <a
                  href="https://x.com/RohitGajaraj"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gray-300 transition-colors"
                >
                  @RohitGajaraj
                </a>
              </li>
              <li className="text-gray-600">Built in public since May 2026</li>
            </ul>
          </div>
        </div>

        {/* Bottom divider: copyright on one side, the machine-view toggle on
            the other. Agents get a stateful, labeled control (aria-pressed);
            the M key and the Product-column link remain as entry points. */}
        <div className="border-t border-gray-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <p>&copy; 2026 Cadence. All rights reserved.</p>
          <MachineViewToggle />
        </div>
      </div>
    </footer>
  );
}
