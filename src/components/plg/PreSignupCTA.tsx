/**
 * PLG · pre-signup conversion CTA — shown at the foot of the public share pages
 * (`/t/$slug` teardowns, `/d/$slug` decisions). Turns a viral viewer into a
 * signup: it names what Supaprod is and leads with the decided positioning
 * (free to start, pay to keep your memory — `docs/features/pricing.md`).
 *
 * Marketing cross-links use plain <a href> on purpose: these are public-to-public
 * navigations, and an anchor avoids depending on the generated route tree (so a
 * new /pricing route never breaks the typecheck). Styling mirrors the public
 * share routes: `.bento` / `.btn` classes + inline CSS-var fallbacks, ember
 * reserved for the single primary CTA (the role-color law).
 *
 * `"proof"` (RPT-07/RPT-30) is the /proof Trust Ledger page — the same footer,
 * a heading pointed at the calibration/receipts angle instead of one decision.
 */

export function PreSignupCTA({ sourceType }: { sourceType: "teardown" | "decision" | "proof" }) {
  const heading =
    sourceType === "teardown"
      ? "Tear down your own idea."
      : sourceType === "proof"
        ? "Get your own calibration score."
        : "Make your own calls.";

  return (
    <div className="bento" style={{ marginTop: 28, padding: "22px 22px", textAlign: "center" }}>
      <div className="mono-label" style={{ color: "var(--mrd-faint, #8a8377)", marginBottom: 8 }}>
        Made with Supaprod
      </div>
      <h2
        className="font-display"
        style={{ lineHeight: 1.2, margin: "0 0 8px", color: "var(--ink, #1f1b16)" }}
      >
        {heading}
      </h2>
      <p
        style={{
          lineHeight: 1.6,
          color: "var(--mrd-mute, #4a4438)",
          margin: "0 auto 16px",
          maxWidth: 430,
        }}
      >
        {/* The conversion line, and it was selling the weakest version of the product.
            "Remembers every outcome" and "keeps your decision memory" both describe
            storage, which is a commodity and which every tool already claims. What is
            actually being bought is that the record CHANGES the next recommendation, so
            the paid line now names that instead of the filing cabinet. */}
        Supaprod is the PM chief of staff that red-teams your decisions, runs the reversible work,
        and learns from every outcome. Free to start; Pro keeps what it learned guiding every call
        you make after.
      </p>
      {/* Access, said before the button rather than discovered at it. This
          footer sits on pages a stranger reached through a shared link, so
          nobody arriving here has a code, and the old "Start free →" straight
          into /signup would have handed every one of them a locked door with no
          warning. Signup closed 2026-08-07: private beta, entry by invite. */}
      <p
        style={{
          lineHeight: 1.6,
          color: "var(--mrd-faint, #8a8377)",
          margin: "0 auto 16px",
          maxWidth: 430,
        }}
      >
        It is invite only while the beta is small. Ask for a code and we will send you one.
      </p>
      <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
        {/* The `from` context is gone with the destination and it is not a loss
            worth chasing: it fed a welcome line on /signup for a person who
            cannot reach /signup yet. The waitlist form is the anchor on the
            landing page, which is the one place that form has ever lived. */}
        <a href="/#join" className="btn btn-primary">
          Request access →
        </a>
        <a href="/pricing" className="btn btn-ghost">
          See plans
        </a>
      </div>
    </div>
  );
}
