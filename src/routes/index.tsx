/**
 * The public landing page, v2 (docs/planning/landing-page-v2-plan.md).
 *
 * Five beats plus footer, SSR on (crawlers and AI answer engines see the full
 * page), live counters pulled at render time, one conversion ask (the beta
 * waitlist), the ink-and-metal palette. The logged-in redirect moved to a
 * client effect so SSR is never blocked.
 *
 * Trimmed 2026-07-25 (landing audit): the field-stops beat came out. Four of
 * its five moves were said elsewhere on the page, and its two unique ones
 * (the record that cannot be backfilled, the compounding pair) belong with
 * the receipts, which is where the evidence already lives.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { MachineViewContainer } from "@/components/machine/MachineViewContainer";
import { MachineViewToggle } from "@/components/supaprod/MachineViewToggle";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { TheGap } from "@/components/landing/TheGap";
import { LoopWalkthrough } from "@/components/landing/LoopWalkthrough";
import { Receipts } from "@/components/landing/Receipts";
import { TrustClose } from "@/components/landing/TrustClose";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { getLandingStats, trackLandingEvent } from "@/lib/landing.functions";

const SITE = "https://supaprod.ai";

// The canonical identity line (founder-ratified 2026-07-25): the hero sub,
// the meta description, the title, and the machine view all carry the SAME
// sentence, verbatim, so answer engines never reconcile drift (plan 6.3).
// It ends on "guide the next call" on purpose: the memory is never storage.
const TAGLINE = "Agents that know what to build, ship it, remember, and guide the next call.";
const TITLE = `Supaprod: ${TAGLINE.charAt(0).toLowerCase()}${TAGLINE.slice(1, -1)}`;
const DESC = `Supaprod is for product managers. ${TAGLINE} You approve every gate.`;

const ORG_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Supaprod",
  url: SITE,
  logo: `${SITE}/favicon.svg`,
  description: DESC,
  // No affiliation clause here. The one that used to sit here named a company
  // that does not exist, a find-and-replace casualty of the 2026-07-17 rename
  // that was shipping nonsense as structured data (landing audit 2026-07-25).
  disambiguatingDescription:
    "Supaprod is an AI product team for product managers: agents that discover, decide, build, and ship, governed by one human who gets the receipts.",
  sameAs: ["https://github.com/RohitGajaraj", "https://x.com/RohitGajaraj"],
};

const APP_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Supaprod",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: SITE,
  description: DESC,
  audience: { "@type": "Audience", audienceType: "Product managers and product teams" },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Beta waitlist" },
};

const MACHINE_CONTENT = `## Supaprod

For product managers. ${TAGLINE} You approve every gate.

Seven stations: Discover, Decide, Plan, Design, Build, Ship, Learn. One governed engine.
When a build breaks, Supaprod diagnoses the failure, revises its own spec, rebuilds, and ships green. The human gate stays in the middle the whole time.

## Live proof
- Trust ledger: /proof
- A public decision record: /d/acf1fa74a20840cda5759644c6f02c05
- Public teardown (no signup): /p/teardown
- Shipping log: /updates

## Agent interfaces
- A2A agent card: /.well-known/agent.json
- MCP server: POST /api/mcp (JSON-RPC 2.0)
- Machine-readable site: /llms.txt | Access policy: /agents.txt

## Get started
Join the beta: / (waitlist) | Sign in: /login | Pricing: /pricing | Security: /security
`;

export const Route = createFileRoute("/")({
  ssr: true,
  loader: async () => ({ stats: await getLandingStats() }),
  component: LandingPage,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/` },
      { property: "og:image", content: `${SITE}/og-supaprod.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Supaprod, your AI product team" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: `${SITE}/og-supaprod.png` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/` }],
    scripts: [
      { type: "application/ld+json", children: JSON.stringify(ORG_LD) },
      { type: "application/ld+json", children: JSON.stringify(APP_LD) },
    ],
  }),
});

function LandingPage() {
  const { stats } = Route.useLoaderData();

  // Logged-in users go to the app. A client effect, not beforeLoad, so the
  // server-rendered page ships to every crawler unconditionally.
  useEffect(() => {
    let cancelled = false;
    import("@/integrations/supabase/client")
      .then(({ supabase }) => supabase.auth.getUser())
      .then(({ data }) => {
        // sandbox/mission-control-v2: an authenticated visitor lands in the
        // reimagined Mission Control room, not the retired /today shell, so the
        // reimagined experience is the coherent home (founder ruling 2026-07-20).
        if (!cancelled && data.user) window.location.replace("/m");
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Funnel: one visit event per session, no PII (plan section 7.2).
  useEffect(() => {
    try {
      if (sessionStorage.getItem("cad_landing_visit")) return;
      sessionStorage.setItem("cad_landing_visit", "1");
      let ref = "";
      try {
        ref = document.referrer ? new URL(document.referrer).hostname : "";
      } catch {
        // unparseable referrer stays blank
      }
      void trackLandingEvent({ data: { event: "landing_visit", props: { ref } } });
    } catch {
      // storage unavailable: skip rather than double-count
    }
  }, []);

  return (
    <MachineViewContainer machineContent={MACHINE_CONTENT} title="Supaprod">
      {/* data-obsidian scopes the token set (styles.css) so brand components
          (SupaprodMark, machine view) resolve their CSS variables out here. */}
      <div className="bg-[#0a0a0a] min-h-screen landing-root" data-obsidian>
        {/* Keyboard focus is a human action: the double-ring ember focus
            state, separated from the control by the ink itself. */}
        <style>{`
          .landing-root a:focus-visible,
          .landing-root button:focus-visible {
            outline: none;
            box-shadow: 0 0 0 2px #0a0a0a, 0 0 0 4px #FF6B2C;
            border-radius: 6px;
          }
          .landing-root input:focus-visible,
          .landing-root textarea:focus-visible {
            outline: none;
            box-shadow: 0 0 0 1px rgba(255,255,255,0.3);
          }
          .landing-root .cap-item {
            transition: color 0.25s ease;
            cursor: default;
          }
          .landing-root .cap-item:hover {
            color: #FF6B2C;
          }
          /* Soft ink scrim: keeps the backdrop grid and the orbit from
             crossing behind the mono capability lists. */
          .landing-root .cap-scrim {
            background: radial-gradient(ellipse 130% 110% at 50% 50%, #0a0a0a 55%, transparent 100%);
          }
        `}</style>
        <LandingBackdrop />
        <div className="relative z-[1]">
          <LandingNav />
          <Hero />
          <TheGap />
          <LoopWalkthrough />
          <Receipts stats={stats} />
          <TrustClose waitlistCount={stats?.waitlistCount ?? null} />
          {/* The [HUMAN]/[MACHINE] toggle lives inside the footer's bottom
              row now (founder 2026-07-15): container-aligned, real spacing. */}
          <LandingFooter />
        </div>
      </div>
    </MachineViewContainer>
  );
}
