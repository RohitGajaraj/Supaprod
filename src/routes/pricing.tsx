// PLG · public /pricing page (4-tier model, 2026-06-27)
// Global monthly/annual toggle; Free / Pro / Business / Enterprise in a 4-column grid.
// Credit dropdown stays per-card (users configure different tiers across plans).
// Annual toggle lifts to page level so all prices update together.
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Zap, User, Users, Building2, Star } from "lucide-react";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { Choices } from "@/components/meridian/forms";
import { Action } from "@/components/meridian/surface-parts";
import { planPresentation, type PlanTier, includedCreditsFor } from "@/lib/entitlements";
import { priceForCredits } from "@/lib/billing-tier";

// Connector logo chips — inline SVG paths from SimpleIcons (MIT-licensed).
// No network dependency: paths are embedded directly so logos always render.
// writeBack mirrors the connector registry's outflow capability so the
// write-back row never claims providers that only read (audit D-19).
type ConnectorMeta = { id: string; label: string; bg: string; path: string; writeBack: boolean };

const READ_CONNECTORS: ConnectorMeta[] = [
  {
    id: "github",
    writeBack: true,
    label: "GitHub",
    bg: "#1b1f23",
    path: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  },
  {
    id: "linear",
    writeBack: true,
    label: "Linear",
    bg: "#5e6ad2",
    path: "M2.886 4.18A11.982 11.982 0 0 1 11.99 0C18.624 0 24 5.376 24 12.009c0 3.64-1.62 6.903-4.18 9.105L2.887 4.18ZM1.817 5.626l16.556 16.556c-.524.33-1.075.62-1.65.866L.951 7.277c.247-.575.537-1.126.866-1.65ZM.322 9.163l14.515 14.515c-.71.172-1.443.282-2.195.322L0 11.358a12 12 0 0 1 .322-2.195Zm-.17 4.862 9.823 9.824a12.02 12.02 0 0 1-9.824-9.824Z",
  },
  {
    id: "notion",
    writeBack: true,
    label: "Notion",
    bg: "#191919",
    path: "M4.459 4.208c.746.606 1.026.56 2.428.466l13.215-.793c.28 0 .047-.28-.046-.326L17.86 1.968c-.42-.326-.981-.7-2.055-.607L3.01 2.295c-.466.046-.56.28-.374.466zm.793 3.08v13.904c0 .747.373 1.027 1.214.98l14.523-.84c.841-.046.935-.56.935-1.167V6.354c0-.606-.233-.933-.748-.887l-15.177.887c-.56.047-.747.327-.747.933zm14.337.745c.093.42 0 .84-.42.888l-.7.14v10.264c-.608.327-1.168.514-1.635.514-.748 0-.935-.234-1.495-.933l-4.577-7.186v6.952L12.21 19s0 .84-1.168.84l-3.222.186c-.093-.186 0-.653.327-.746l.84-.233V9.854L7.822 9.76c-.094-.42.14-1.026.793-1.073l3.456-.233 4.764 7.279v-6.44l-1.215-.139c-.093-.514.28-.887.747-.933zM1.936 1.035l13.31-.98c1.634-.14 2.055-.047 3.082.7l4.249 2.986c.7.513.934.653.934 1.213v16.378c0 1.026-.373 1.634-1.68 1.726l-15.458.934c-.98.047-1.448-.093-1.962-.747l-3.129-4.06c-.56-.747-.793-1.306-.793-1.96V2.667c0-.839.374-1.54 1.447-1.632z",
  },
  {
    id: "jira",
    writeBack: false,
    label: "Jira",
    bg: "#0052cc",
    path: "M11.571 11.513H0a5.218 5.218 0 0 0 5.232 5.215h2.13v2.057A5.215 5.215 0 0 0 12.575 24V12.518a1.005 1.005 0 0 0-1.005-1.005zm5.723-5.756H5.736a5.215 5.215 0 0 0 5.215 5.214h2.129v2.058a5.218 5.218 0 0 0 5.215 5.214V6.758a1.001 1.001 0 0 0-1.001-1.001zM23.013 0H11.455a5.215 5.215 0 0 0 5.215 5.215h2.129v2.057A5.215 5.215 0 0 0 24 12.483V1.005A1.001 1.001 0 0 0 23.013 0Z",
  },
  {
    id: "google_docs",
    writeBack: false,
    label: "Google Docs",
    bg: "#4285f4",
    path: "M14.727 6.727H14V0H4.91c-.905 0-1.637.732-1.637 1.636v20.728c0 .904.732 1.636 1.636 1.636h14.182c.904 0 1.636-.732 1.636-1.636V6.727h-6zm-.545 10.455H7.09v-1.364h7.09v1.364zm2.727-3.273H7.091v-1.364h9.818v1.364zm0-3.273H7.091V9.273h9.818v1.363zM14.727 6h6l-6-6v6z",
  },
];

function ConnectorChips({ showWrite = false }: { showWrite?: boolean }) {
  // The write-back row shows only providers Supaprod actually writes to;
  // showing the full read set under a "read + write" badge overclaimed.
  const chips = showWrite ? READ_CONNECTORS.filter((c) => c.writeBack) : READ_CONNECTORS;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginTop: 6,
        marginBottom: 2,
        flexWrap: "wrap",
      }}
      aria-label={showWrite ? "Write-back connectors" : "Read connectors"}
    >
      {chips.map((c) => (
        <span
          key={c.id}
          title={c.label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 22,
            height: 22,
            borderRadius: 5,
            background: c.bg,
            flexShrink: 0,
          }}
        >
          <svg viewBox="0 0 24 24" width={13} height={13} fill="white" aria-hidden>
            <path d={c.path} />
          </svg>
        </span>
      ))}
      <span style={{ fontSize: 10, color: "var(--mrd-mute)", fontWeight: 500 }}>+ more</span>
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          color: "var(--mrd-mute)",
          background: "var(--mrd-lift)",
          border: "1px solid var(--mrd-line)",
          borderRadius: 4,
          padding: "1px 5px",
          letterSpacing: "0.03em",
          textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}
      >
        {showWrite ? "write-back" : "read"}
      </span>
    </div>
  );
}

const TITLE = "Pricing · Supaprod";
// Founder ruling 2026-08-02: never sell the shared record as the thing a paid
// plan unlocks. On a single seat there is one author, so the record is already
// whole; Business is what appears when a second author does.
const DESC =
  "Supaprod runs your product loop for free. Paid plans add capacity, and every plan can hand a decision to someone else with a link.";

const SITE = "https://supaprod.ai";

/**
 * Offer nodes for the four public tiers.
 *
 * WHY THIS EXISTS. Structured data is what AI answer engines parse when
 * somebody asks "what does Supaprod cost". Without it, an engine has to lift
 * prices out of rendered markup and usually declines to, so the answer comes
 * back vague or wrong. This page had zero `ld+json` while the homepage carried
 * two blocks, so the one page in the site whose entire job is answering a
 * factual question was the one with nothing machine-readable on it.
 *
 * The prices here are the FLAT per-tier figures the cards render. They are
 * duplicated deliberately rather than derived from `priceForCredits`, because
 * that function takes a credit band and a billing period and returns a computed
 * number; feeding a schema block from it would let a UI experiment silently
 * change what search engines are told the product costs. If the cards change,
 * this changes with them, and the drift is visible in a diff.
 *
 * `max` is excluded because it is internal-only and not shown on this page.
 *
 * ⚠️ 20 and 50 are `TIER_BASE_MONTHLY_USD` in `src/lib/billing-tier.ts`, whose
 * own docblock calls them "reference placeholders" pending the final numbers in
 * the Stripe admin catalog. They match what the cards render today, which is
 * the right invariant: schema must agree with the page. But search engines
 * cache offer prices, so when the Stripe catalog is finalised this block has to
 * move in the same commit as the cards, or the engines keep answering with the
 * placeholder long after the site stopped showing it.
 */
/**
 * ⚠️ AVAILABILITY IS A CLAIM, AND IT IS THE ONE A MACHINE READS.
 *
 * Every offer below said `InStock` and the Free one pointed at `${SITE}/signup`,
 * which was accurate while signup was open and became a false statement the
 * moment the founder closed it on 2026-08-07. This block is the version of the
 * page that search engines and AI answer surfaces quote, so leaving it saying
 * "in stock, sign up here" while the visible page says "invite only" would have
 * put the contradiction somewhere nobody on the team ever looks. schema.org's
 * `LimitedAvailability` is the honest term for a private beta, and the Free
 * offer now points at the request-access anchor, which is where a reader
 * following that URL can actually get somewhere.
 */
const BETA_AVAILABILITY = "https://schema.org/LimitedAvailability";

const PRICING_LD = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Supaprod",
  description: DESC,
  url: `${SITE}/pricing`,
  brand: { "@type": "Brand", name: "Supaprod" },
  offers: [
    {
      "@type": "Offer",
      name: "Free",
      price: "0",
      priceCurrency: "USD",
      description:
        "One seat, three read-only connectors, and the full loop on your own data. No card. Private beta: entry is by invite code.",
      url: `${SITE}/#join`,
      availability: BETA_AVAILABILITY,
    },
    {
      "@type": "Offer",
      name: "Pro",
      price: "20",
      priceCurrency: "USD",
      description: "Unlimited connectors, still read-only. Nothing is ever written back.",
      url: `${SITE}/pricing`,
      availability: BETA_AVAILABILITY,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "20",
        priceCurrency: "USD",
        unitText: "seat per month",
      },
    },
    {
      "@type": "Offer",
      name: "Business",
      price: "50",
      priceCurrency: "USD",
      description: "Everything in Pro, plus write-back through your approval gates.",
      url: `${SITE}/pricing`,
      availability: BETA_AVAILABILITY,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        price: "50",
        priceCurrency: "USD",
        unitText: "seat per month",
      },
    },
    {
      "@type": "Offer",
      name: "Enterprise",
      priceCurrency: "USD",
      description:
        "Committed credits, unlimited seats, connectors built for systems nobody publishes an API story for.",
      url: `${SITE}/pricing`,
      availability: BETA_AVAILABILITY,
    },
  ],
};

export const Route = createFileRoute("/pricing")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: "Supaprod · Pricing" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: `${SITE}/pricing` }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify(PRICING_LD) }],
  }),
  component: PricingPage,
});

// Public tiers in display order; max is internal-only (not shown).
const PUBLIC_TIERS: PlanTier[] = ["free", "pro", "team", "enterprise"];

type LucideIcon = React.ComponentType<{ size?: number; strokeWidth?: number }>;

const TIER_ICONS: Record<PlanTier, LucideIcon> = {
  free: Zap,
  pro: User,
  max: Star,
  team: Users,
  enterprise: Building2,
};

// Global billing toggle shown above the card grid. R005 §2: monthly/annual is
// one decision in two words, so it is a `Choices` radiogroup, not hand-painted
// pills. The boolean state and the Save badge are unchanged.
function BillingToggle({ annual, onChange }: { annual: boolean; onChange: (v: boolean) => void }) {
  return (
    <Choices
      mode="one"
      label="Billing period"
      value={annual ? "annual" : "monthly"}
      onChange={(mode) => onChange(mode === "annual")}
      options={[
        { id: "monthly", label: "Monthly" },
        {
          id: "annual",
          label: (
            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
              Annual
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: "var(--mrd-pass)",
                  background: "color-mix(in oklab, var(--mrd-pass) 14%, transparent)",
                  borderRadius: 99,
                  padding: "1px 6px",
                  lineHeight: 1.5,
                }}
              >
                Save 17%
              </span>
            </span>
          ),
        },
      ]}
    />
  );
}

function PricingCard({ tier, annual }: { tier: PlanTier; annual: boolean }) {
  const p = planPresentation(tier);
  // Retired with the band picker: price is flat per tier now.
  const credits = 0;
  // EXPANDED BY DEFAULT (founder ruling 2026-08-03). This was `false`, so every card
  // opened showing a handful of bullets behind a "Show 8 more features" link. On a
  // pricing page that is self-sabotage: the buyer is deciding whether the plan is worth
  // it while most of what it does is hidden, and almost nobody clicks. Collapsing is
  // for pages with too MUCH text to skim; a pricing card has exactly the text the buyer
  // came for. The control stays, inverted, so anyone comparing tiers side by side can
  // still shorten the cards themselves.
  const [expanded, setExpanded] = useState(true);

  const isBusiness = tier === "team";
  const isEnterprise = tier === "enterprise";
  const isFree = tier === "free";
  const TierIcon = TIER_ICONS[tier];

  const monthlyPrice = (() => {
    if (isFree || isEnterprise) return null;
    return priceForCredits(tier, credits, "monthly");
  })();

  const displayPrice = (() => {
    if (monthlyPrice === null) return null;
    return annual ? priceForCredits(tier, credits, "yearly") : monthlyPrice;
  })();

  // Exact savings: annual = 10 months, so 2 months free.
  const yearlySavings = annual && monthlyPrice ? monthlyPrice * 2 : null;

  const PREVIEW = 5;
  const visibleHighlights = expanded ? p.highlights : p.highlights.slice(0, PREVIEW);
  const hiddenCount = p.highlights.length - PREVIEW;

  const sep = (
    <div
      style={{
        height: 1,
        background: "var(--mrd-line)",
        margin: "16px 0",
      }}
    />
  );

  return (
    <div
      style={{
        padding: "28px 24px 24px",
        display: "flex",
        flexDirection: "column",
        // The recommended plan is told by SHAPE, not by hue: a drawn edge and a
        // step up the ground ladder. Ember stays in the logo and never doubles as
        // an interaction or emphasis state.
        border: isBusiness ? "1.5px solid var(--mrd-edge)" : "1px solid var(--mrd-line)",
        background: isBusiness ? "var(--mrd-lift)" : "var(--mrd-sheet)",
        borderRadius: 12,
      }}
    >
      {/* Icon + Popular badge row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
        }}
      >
        <span
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--mrd-lift)",
            border: "1px solid var(--mrd-edge)",
            color: "var(--mrd-ink)",
          }}
        >
          <TierIcon size={16} strokeWidth={1.6} />
        </span>
        {isBusiness && (
          <span
            className="mono-label"
            style={{
              fontSize: 8.5,
              color: "var(--mrd-ink)",
              border: "1px solid var(--mrd-edge)",
              borderRadius: 99,
              padding: "2px 8px",
            }}
          >
            Popular
          </span>
        )}
      </div>

      {/* Plan name.
       *
       * <h2>, not <span>. Corrected 2026-08-07 after an accessibility audit
       * found this page carried exactly one <h1> and zero headings below it.
       * The four plan names are the page's actual structure, and rendering them
       * as spans meant a screen-reader user could not jump between the four
       * things this page exists to let them compare. WCAG 2.2 SC 1.3.1 and
       * 2.4.6.
       *
       * All visual properties are set here explicitly, so promoting the tag
       * changes the semantics and nothing about the rendering. */}
      <h2
        className="font-display"
        style={{
          fontSize: 20,
          fontWeight: 460,
          marginBottom: 6,
          display: "block",
          margin: "0 0 6px",
          letterSpacing: "inherit",
        }}
      >
        {p.name}
      </h2>

      {/* Who it's for */}
      <p
        style={{
          fontSize: 12.5,
          color: "var(--mrd-ink)",
          fontWeight: 500,
          margin: "0 0 5px",
          lineHeight: 1.45,
        }}
      >
        {p.forWhom}
      </p>

      {/* Tagline */}
      <p
        style={{
          fontSize: 11.5,
          color: "var(--mrd-mute)",
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {p.tagline}
      </p>

      {sep}

      {/* Price zone */}
      {isEnterprise ? (
        <div style={{ marginBottom: 16 }}>
          <span
            className="font-display"
            style={{ fontSize: 26, fontWeight: 460, lineHeight: 1.2, display: "block" }}
          >
            Custom
          </span>
          <span
            style={{
              fontSize: 12,
              color: "var(--mrd-body)",
              display: "block",
              marginTop: 4,
            }}
          >
            Committed credits, unlimited seats
          </span>
          <span
            style={{
              fontSize: 11.5,
              color: "var(--mrd-mute)",
              display: "block",
              marginTop: 2,
            }}
          >
            Volume rate as you scale
          </span>
        </div>
      ) : isFree ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="font-display" style={{ fontSize: 32, fontWeight: 480, lineHeight: 1 }}>
              $0
            </span>
            <span style={{ fontSize: 12, color: "var(--mrd-mute)" }}>/month</span>
          </div>
          <p style={{ fontSize: 11, color: "var(--mrd-mute)", margin: "5px 0 0" }}>
            No credit card needed
          </p>
        </div>
      ) : (
        <div style={{ marginBottom: 16 }}>
          {/* Price + billing label row */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span className="font-display" style={{ fontSize: 32, fontWeight: 480, lineHeight: 1 }}>
              ${displayPrice}
            </span>
            <span style={{ fontSize: 13, color: "var(--mrd-mute)" }}>/mo</span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginTop: 6,
              flexWrap: "wrap",
            }}
          >
            <span style={{ fontSize: 11, color: "var(--mrd-mute)" }}>
              {annual ? "billed annually" : "billed monthly"}
            </span>
            {yearlySavings && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--mrd-pass)",
                  background: "color-mix(in oklab, var(--mrd-pass) 14%, transparent)",
                  borderRadius: 99,
                  padding: "2px 8px",
                }}
              >
                Save ${yearlySavings}/yr
              </span>
            )}
          </div>
        </div>
      )}

      {/* INCLUDED CREDITS, one number per tier (founder ruling 2026-08-03).
          This replaced a 100-to-10,000 band dropdown that scaled the price linearly.
          The band made Pro's default 100 credits for $20 against Free's 750 for $0, so
          the entry paid plan was 7.5x worse than free, and its top band rendered
          "$2000/mo". A tier now sells seats and capability; CAPACITY is sold by top-ups,
          which is why the line below names them. That keeps a paid path for a heavy solo
          user instead of pushing them onto a team plan they do not want. */}
      {p.hasCreditDropdown && (
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontSize: 9.5,
              color: "var(--mrd-mute)",
              letterSpacing: "0.08em",
              marginBottom: 5,
            }}
          >
            CREDITS / MONTH
          </div>
          <div style={{ fontSize: 15, color: "var(--mrd-ink)", fontWeight: 500 }}>
            {includedCreditsFor(tier)?.toLocaleString() ?? "Custom"} included
          </div>
          <div style={{ fontSize: 11.5, color: "var(--mrd-mute)", marginTop: 3 }}>
            Need more? Add credits any time, up to twice your monthly allowance. No plan change.
          </div>
        </div>
      )}

      {/* CTA — right after price + credit selector, before features */}
      {isEnterprise ? (
        <a
          href="mailto:sales@supaprod.ai?subject=Enterprise enquiry"
          style={{
            display: "block",
            textAlign: "center",
            padding: "11px 0",
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 500,
            border: "1px solid var(--mrd-line)",
            background: "transparent",
            color: "var(--mrd-ink)",
            textDecoration: "none",
            marginBottom: 20,
          }}
        >
          Talk to our team
        </a>
      ) : (
        <a
          href={
            isFree
              ? // WAS "/signup?from=pricing", and the label below it said "Start
                // free". Both were true until 2026-08-07, when the founder closed
                // signup: private beta, entry by invite code. A free tier whose
                // button opens a form demanding a code the visitor does not have
                // is the contradiction this pass exists to remove, so the free
                // card now asks for access. The PRICE has not changed and the
                // card still says nothing but the truth about it.
                "/#join"
              : // Paid plans go to CHECKOUT, not signup. A visitor who has decided to pay
                // should not have to create an account first and then hunt for billing:
                // decide, price it, pay, and the account is provisioned after payment.
                //
                // Untouched by the invite gate on purpose. Checkout provisions the
                // account after payment and never routes through /signup, so it
                // was never behind this door. Whether a paid customer should be
                // able to buy their way into a private beta is a founder call
                // about the cohort, not a contradiction in the copy, and it is
                // named here rather than silently decided by an agent.
                `/checkout?plan=${tier}&billing=${annual ? "annual" : "monthly"}`
          }
          style={{
            display: "block",
            textAlign: "center",
            padding: "11px 0",
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 600,
            background: isBusiness ? "var(--mrd-solid)" : "transparent",
            border: isBusiness ? "1.5px solid var(--mrd-solid)" : "1px solid var(--mrd-line)",
            color: isBusiness ? "var(--mrd-on-solid)" : "var(--mrd-ink)",
            textDecoration: "none",
            marginBottom: 20,
          }}
        >
          {isFree ? "Request access" : isBusiness ? "Get Business" : "Get Pro"}
        </a>
      )}

      {sep}

      {/* Feature list — expandable */}
      <ul
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "flex",
          flexDirection: "column",
          gap: 9,
          flex: 1,
        }}
      >
        {visibleHighlights.map((h, i) => {
          const isHeader = h.startsWith("Everything in");
          // A roadmap line must never wear the included mark. Anything starting
          // "Planned," renders as a muted note with no "+", so a reader cannot
          // mistake unbuilt governance for a shipped capability.
          const isPlanned = h.startsWith("Planned,");
          const isReadConnector = h.startsWith("Read connectors");
          const isWriteConnector = h.startsWith("Write-back connectors");
          const quiet = isHeader || isPlanned;
          return (
            <li
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 0,
                fontSize: 12,
                lineHeight: 1.45,
                color: quiet ? "var(--mrd-mute)" : "var(--mrd-ink)",
                fontWeight: isHeader ? 500 : 400,
                borderTop: isHeader && i > 0 ? "1px solid var(--mrd-line)" : undefined,
                paddingTop: isHeader && i > 0 ? 8 : 0,
              }}
            >
              <div style={{ display: "flex", gap: 8 }}>
                {!quiet && (
                  <span style={{ color: "var(--mrd-pass)", flexShrink: 0, marginTop: 1 }}>+</span>
                )}
                <span>{h}</span>
              </div>
              {isReadConnector && <ConnectorChips />}
              {isWriteConnector && <ConnectorChips showWrite />}
            </li>
          );
        })}
      </ul>

      {hiddenCount > 0 && (
        <Action
          type="button"
          variant="quiet"
          className="mt-2.5"
          onClick={() => setExpanded((e) => !e)}
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more features`}
        </Action>
      )}
    </div>
  );
}

function PricingPage() {
  // Global billing interval — one toggle changes all 4 cards simultaneously.
  const [annual, setAnnual] = useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        background: "var(--mrd-bg)",
        color: "var(--mrd-ink)",
      }}
    >
      <LandingBackdrop />
      <div
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          flexDirection: "column",
          flex: 1,
        }}
      >
        <header
          style={{
            borderBottom: "1px solid var(--mrd-line)",
            padding: "12px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              textDecoration: "none",
              color: "inherit",
            }}
          >
            <SupaprodMark />
            <span className="font-display" style={{ fontSize: 14 }}>
              Supaprod
            </span>
          </Link>
          <a
            href="/login"
            style={{
              fontSize: 13,
              color: "var(--mrd-ink)",
              textDecoration: "none",
              border: "1px solid var(--mrd-line)",
              borderRadius: 999,
              padding: "7px 16px",
            }}
          >
            Sign in
          </a>
        </header>

        <main style={{ flex: 1, padding: "48px 24px" }}>
          <div style={{ width: "100%", maxWidth: 1200, margin: "0 auto" }}>
            {/* Headline */}
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <p
                style={{
                  fontFamily: "Geist Mono, monospace",
                  fontSize: 10,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: "var(--mrd-mute)",
                  margin: "0 0 10px",
                }}
              >
                Pricing
              </p>
              <h1
                style={{
                  fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
                  fontSize: "clamp(22px, 3vw, 30px)",
                  lineHeight: 1.3,
                  margin: "0 0 12px",
                  fontWeight: 400,
                  letterSpacing: 0,
                }}
              >
                {/* "Start free." was an instruction the product could no longer
                    carry out from 2026-08-07. The free tier is still free and
                    still the entry point; what changed is that entering needs a
                    code, and a page headline is the wrong place to hide that. */}
                Free to start, once you are in. Pick the capacity that fits how hard you run it.
              </h1>
              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: "var(--mrd-mute)",
                  margin: "0 auto 24px",
                  maxWidth: 520,
                }}
              >
                Supaprod runs your product loop for free. Paid plans add capacity, and every plan
                can hand a decision to someone else with a link. Supaprod is in private beta, so
                every plan starts with an invite code.
              </p>

              {/* Global billing toggle */}
              <BillingToggle annual={annual} onChange={setAnnual} />
            </div>

            {/* Tier grid — 4 columns on desktop, 2 on tablet, 1 below 768px.
              Inline styles cannot carry media queries, so the grid gets a
              scoped class + style block (no horizontal scroll on mobile). */}
            <style>{`
            .pricing-tier-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
            }
            @media (max-width: 1100px) {
              .pricing-tier-grid { grid-template-columns: repeat(2, 1fr); }
            }
            @media (max-width: 767px) {
              .pricing-tier-grid { grid-template-columns: 1fr; }
            }
          `}</style>
            <div className="pricing-tier-grid">
              {PUBLIC_TIERS.map((tier) => (
                <PricingCard key={tier} tier={tier} annual={annual} />
              ))}
            </div>

            {/* How the ladder actually works. Founder ruling 2026-08-02: the
              single-seat plans are not a withheld version of the team plan.
              With one author there is nobody to share with, so nothing is held
              back, and a link covers the times you need to show someone. */}
            <p
              style={{
                fontSize: 12,
                color: "var(--mrd-mute)",
                textAlign: "center",
                marginTop: 28,
                lineHeight: 1.6,
                maxWidth: 640,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              Free and Pro are single seat. More power for one person is more credits on Pro, not a
              different product, so nothing about your record is held back for a higher plan. You
              can hand any decision to a colleague with a link on every plan, including Free.
              Business starts at two seats, because two people is where a team starts re-deciding
              what it already decided.
            </p>

            {/* Footer note */}
            <p
              style={{
                fontSize: 11.5,
                color: "var(--mrd-mute)",
                textAlign: "center",
                marginTop: 12,
                lineHeight: 1.5,
              }}
            >
              Every plan starts free once your invite code is in. No credit card needed until you
              upgrade. Change or cancel anytime from Settings. Each plan includes a set number of
              credits a month, and every action spends them. Need more capacity without changing
              plan? Add credits any time, up to twice your monthly allowance. You move up a tier for
              people and capability, not for volume.
            </p>
          </div>
        </main>

        <footer
          style={{
            borderTop: "1px solid var(--mrd-line)",
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 11,
            color: "var(--mrd-mute)",
          }}
        >
          <span className="mono-label" style={{ fontSize: 9 }}>
            Made with Supaprod
          </span>
          <a
            href="/#join"
            style={{ fontSize: 11, color: "var(--mrd-mute)", textDecoration: "none" }}
          >
            Request access &rarr;
          </a>
        </footer>
      </div>
    </div>
  );
}
