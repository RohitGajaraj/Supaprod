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
 * (the un-reconstructable forecast, the compounding pair) belong with the
 * receipts, which is where the evidence already lives.
 *
 * That first move was described here as "the record that cannot be
 * backfilled" until 2026-08-10, when an audit of what the schema actually
 * enforced retired the claim. `created_at` was a client-settable, rewritable
 * column on every ledger table and 93 decisions already carried a date
 * earlier than the workspace containing them, so the record could be written
 * into the past by the person it describes. It is now stamped by the database
 * and immutable to application callers.
 *
 * The surviving claim is narrower and true: what nobody can reconstruct
 * afterwards is what you BELIEVED BEFORE the outcome landed. A cause can be
 * rebuilt from surviving artifacts; a forecast leaves no trace unless
 * something wrote it down at the moment of the decision. Founder ruling
 * 2026-08-10.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { MachineViewContainer } from "@/components/machine/MachineViewContainer";
import { MachineViewToggle } from "@/components/supaprod/MachineViewToggle";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { LandingNav } from "@/components/landing/LandingNav";
import { Hero } from "@/components/landing/Hero";
import { TheGap } from "@/components/landing/TheGap";
import { ThreeLayers } from "@/components/landing/ThreeLayers";
import { TheFilm } from "@/components/landing/TheFilm";
import { LoopWalkthrough } from "@/components/landing/LoopWalkthrough";
import { Receipts } from "@/components/landing/Receipts";
import { TrustClose } from "@/components/landing/TrustClose";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { getWaitlistCount, trackLandingEvent } from "@/lib/landing.functions";
import { getLandingSessionKey } from "@/lib/landing-session";
import { SIGNED_IN_HOME } from "@/components/shell/post-auth-home";

const SITE = "https://supaprod.ai";

// The canonical identity line (founder-ratified 2026-07-25): the hero sub,
// the meta description, the title, and the machine view all carry the SAME
// sentence, verbatim, so answer engines never reconcile drift (plan 6.3).
//
// "REMEMBER" IS OUT, and this is the highest-leverage word on the site. The
// doctrine is that Supaprod learns and guides and never remembers, stores or
// logs, because storage is a commodity every tool claims and guidance is the
// only defensible half. This one sentence propagates verbatim into <title>, the
// meta description, og:, twitter: and /llms.txt, so the single most duplicated
// string in the product was the one breaking the positioning rule.
//
// It still ends on "guide the next call", which was always the good half.
const TAGLINE = "Agents that know what to build, ship it, and guide the next call.";
const TITLE = `Supaprod: ${TAGLINE.charAt(0).toLowerCase()}${TAGLINE.slice(1, -1)}`;
// "YOU APPROVE EVERY GATE" WAS FALSE, AND IT WAS THE SENTENCE THAT UNFURLS.
// Measured on production 2026-08-06: 38 of 119 rows in `learnings` carry a
// `recorded_by_agent_slug` (37 data-analyst, 1 insight-keeper) -- verdicts
// written to the permanent record with no human click. That is the DESIGN, not
// a leak: the crew settles outcomes on its own and the product is better for
// it. But this string feeds <title>, meta description, og:, twitter: and
// /llms.txt, so a visitor read a safety promise the product deliberately does
// not keep, and would find the counter-example within a week.
//
// The replacement is the claim security.tsx's own body already makes correctly
// and can defend: agents draft, propose and build unattended, and nothing
// IRREVERSIBLE happens without a person. Same reassurance, same length, true.
const DESC = `Supaprod is for product managers. ${TAGLINE} Nothing irreversible happens without you.`;

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
    "Supaprod is an AI product team for product managers: agents that discover, decide, build, and ship, governed by one human who gets the evidence.",
  // These pointed at the FOUNDER'S PERSONAL accounts, which is what a solo repo
  // starts with and nobody revisits. Organisation schema `sameAs` is how a
  // search engine ties the brand to its official profiles, so naming a personal
  // handle here tells Google the company is a person. Both brand accounts exist
  // as of 2026-08-05: the org and the @supaprodhq handle.
  sameAs: ["https://github.com/Supaprod", "https://x.com/supaprodhq"],
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

// MACHINE_CONTENT is what answer engines and crawlers read, so every claim in it
// is load-bearing in the one place we cannot issue a correction. Two were wrong
// until 2026-08-09, and both are the same failure: a fix that edited one constant
// and missed its twin in this block.
//
// 1. "You approve every gate" was corrected in DESC above on 2026-08-06 (see the
//    note there: 38 of 119 `learnings` rows were written by an agent with no
//    human click, which is the design). The false sentence survived HERE, in the
//    copy specifically written to be quoted back by an LLM. It now carries the
//    same true claim DESC does.
// 2. "A public decision record: /d/acf1fa74..." was a SEED FIXTURE, listed under
//    a heading reading "Live proof". Same slug, same defect, same root cause as
//    the one removed from LandingFooter.tsx in this commit; see that file for the
//    full write-up. Nothing replaces the line: there is no real public decision
//    yet, and /proof lists them live the moment there is.
// 3. "The human gate stays in the middle the whole time" (2026-08-10). It sat one
//    line under the sentence corrected in (1) and failed the same way, softly.
//    The gate is not in the middle, and the code says so in as many words:
//    MAX_TRACK_CORRECTIONS in spine/correction.ts is set to 2 with the rationale
//    "a cap set too high spends money on a loop nobody is watching", and
//    ai/verify-green.server.ts caps a mission at three corrective cycles and
//    completes it as 'completed_with_failures' on the cap, "never a silent
//    green". The loop is DESIGNED to run unattended; that is the product.
//
//    The gate is real, but it sits at the EDGE and at the CAP, not the middle:
//    security.tsx's merge gate ("nothing merges, ships, or takes an irreversible
//    outward action without a human approval... a fixed floor, not a setting that
//    can be dialed away") and the escalation when the bound is spent. Saying so
//    is also better copy for an answer engine, which can quote two numbers and a
//    floor instead of a reassurance it cannot check.
//
//    "ships green" went with it. Nothing ships without the merge gate, so the
//    verb contradicted the floor named in the same paragraph. The loop drives
//    CHECKS green; a person still ships.
const MACHINE_CONTENT = `## Supaprod

For product managers. ${TAGLINE} Nothing irreversible happens without you.

## The three layers
1. The director: tells you what to build. Ranks your signals, product data, competitors and past calls.
2. The loop: decides what is worth building, hands it to whatever builds for you, yours or ours, and checks what actually happened. Seven stations agents walk on their own, inside boundaries a human sets in advance.
3. The shared brain: learns, and then guides. Tells you what is right next time, and warns before you repeat what was wrong.

Each layer is the precondition for the next. Ship any one alone and it is a feature, not a company.

## The moat
The compounding, not the record. Any vendor can store decisions. A settled outcome is written back against the decision that caused it and re-ranks what Discover and Decide surface next, which needs your outcomes labelled over time and no model ships with those. The loop does not end in a report; it ends by changing what you are shown.

Seven stations: Discover, Decide, Plan, Design, Build, Ship, Learn. One governed engine.
When a build breaks, Supaprod diagnoses the failure, revises its own spec, rebuilds, and drives the checks back to green. That loop runs on its own and is bounded: two corrections per track, three verify cycles per mission, then it stops and hands one person the specific thing only they can supply. On a cap it reports the failure rather than a silent green. The fixed floor is the merge gate: nothing merges, ships, or takes an irreversible outward action without a human approval.

## Live proof
- Track record: /proof (publishes our calibration score live, including an honest zero until outcomes land)
- A real workspace, no signup: /demo (live seeded data: a decision history and one mission traced end to end)
- Shipping log: /updates
- The film: /film (2:22, narrated. One signal through all seven stations, and an outcome scored against the call that caused it)

## Agent interfaces
- A2A agent card: /.well-known/agent.json
- MCP server: POST /api/mcp (JSON-RPC 2.0, bearer token, 10 read tools + ingest_signal)
- Machine-readable site: /llms.txt | Access policy: /agents.txt

## Get started
Join the beta: / (waitlist) | Sign in: /login | Pricing: /pricing | Security: /security
`;

export const Route = createFileRoute("/")({
  ssr: true,
  // One count, not six. `getLandingStats` computed four counters that no
  // component on this page renders, and `/` is server-rendered on the login and
  // signup paths as well, so those queries ran on the three hottest public
  // routes to be thrown away. See `getWaitlistCount`'s header for why the split
  // also fixes a coupling: the rendered number used to be discarded whenever an
  // unrendered one failed.
  loader: async () => ({ waitlistCount: await getWaitlistCount() }),
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
      {
        property: "og:image:alt",
        content:
          "Supaprod: agents that own outcomes, not just output. Seven stations in orbit, the return path from Learn to Discover lit.",
      },
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
  const { waitlistCount } = Route.useLoaderData();

  // Logged-in users go to the app. A client effect, not beforeLoad, so the
  // server-rendered page ships to every crawler unconditionally.
  useEffect(() => {
    let cancelled = false;
    import("@/integrations/supabase/client")
      .then(({ supabase }) => supabase.auth.getUser())
      .then(({ data }) => {
        // Today, not /m. The 2026-07-20 ruling that sent an authenticated
        // visitor into Mission Control described /today as "the retired shell",
        // and that was true then. The 2026-07-29 rebuild reversed it: Today was
        // rewritten from 1543 lines to a brief, it is the first rail row, and
        // Mission Control is now the ONE surface the rebuild never ported. So
        // this line was landing every returning user in the legacy design
        // before they clicked anything, which is the founder's own complaint
        // arriving one step earlier than the nav.
        if (!cancelled && data.user) window.location.replace(SIGNED_IN_HOME);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // Funnel: one visit event per session, no PII (plan section 7.2).
  //
  // This is where the session key is first minted, because this is the first
  // event of the visit. It runs in an effect, so it never executes during SSR
  // and the server render never reaches for sessionStorage or crypto. The key
  // is an anonymous join value, not a visitor id: see src/lib/landing-session.ts.
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
      void trackLandingEvent({
        data: { event: "landing_visit", sessionKey: getLandingSessionKey(), props: { ref } },
      });
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
          /* THE LANDING PAGE HAD NEVER PAINTED ITS OWN GROUND.
           *
           * The div above carries \`bg-[#0a0a0a]\` and that utility DOES NOT
           * EXIST. Measured 2026-08-11 by walking every stylesheet in the
           * document and asking which rules matching this element set a
           * background: zero. The arbitrary-value class was never generated, so
           * the element is transparent and simply shows whatever is behind it,
           * which is the body, which follows the app's theme.
           *
           * In dark that is #0a0a0a and the page looks exactly right, which is
           * why this survived: the bug and the intent produce the same pixels
           * for most visitors. In light the body is white, the headline is
           * still \`text-white\` because THAT utility is real, and the largest
           * object on the public homepage renders at a contrast ratio of 1.0.
           * White on white. Not hard to read. Invisible.
           *
           * \`__root.tsx\` stamps \`data-theme="light"\` for anyone whose stored
           * theme is light OR whose stored theme is system with a light OS, and
           * it does that on every route including this one. First-time visitors
           * have nothing stored and get dark, which is the other half of why
           * nobody saw it: it only breaks for people who have been here before.
           *
           * THIS IS A DELIBERATELY SINGLE-THEME SURFACE and that is allowed,
           * but a design that commits to one theme still has to paint the
           * background and the colours explicitly rather than inherit them.
           * Inheriting is what made it a coin flip on the visitor's OS. */
          .landing-root {
            background: #0a0a0a;
            /* So the scrollbar, and any form control the browser draws itself,
             * match the page instead of the stamped theme. */
            color-scheme: dark;
            /* THE DECORATIVE BLEEDS RUN OFF THE PAGE AT 768 AND ONLY AT 768.
             *
             * Two elements deliberately extend past their container to bleed a
             * background wider than the text it sits behind: the capability
             * scrim in Receipts.tsx (\`px-8 -mx-8\`) and the mark in
             * TrustClose.tsx (\`absolute -right-40\`). Both are \`hidden md:*\`,
             * so they do not exist below 768 and there is room for them above
             * about 1000. At exactly the middle breakpoint they appear and
             * there is nowhere to put them: measured 2026-08-11, the page was
             * 834px wide inside a 768px viewport.
             *
             * \`clip\` rather than \`hidden\`, and the difference is the whole
             * reason this is safe. \`overflow-x: hidden\` makes \`overflow-y\`
             * compute to \`auto\` as well, which quietly creates a second
             * vertical scroll container and is how a page comes to feel stuck.
             * \`clip\` constrains one axis and leaves the other alone.
             *
             * Checked before reaching for it: this page has no \`position:
             * sticky\` anywhere, which is the one thing a clipping ancestor
             * would break. */
            overflow-x: clip;
          }
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
          {/* The Gap ends on "Decisions / no home". The three layers answer
              it, in their own spotlit section, before the loop proves layer
              02 in motion: absence, then the answer, then the receipt
              (founder ruling 2026-07-25). */}
          <ThreeLayers />
          {/* The film shows the whole thing in 2:22; the walkthrough below
              then lets the reader drive the same loop at their own pace. Show
              first, explore second - the reverse would summarize for someone
              who had already done the work. */}
          <TheFilm />
          <LoopWalkthrough />
          <Receipts />
          <TrustClose waitlistCount={waitlistCount} />
          {/* The [HUMAN]/[MACHINE] toggle lives inside the footer's bottom
              row now (founder 2026-07-15): container-aligned, real spacing. */}
          <LandingFooter />
        </div>
      </div>
    </MachineViewContainer>
  );
}
