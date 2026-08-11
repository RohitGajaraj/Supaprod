// The Supaprod brief (docs/pitch/investor-deck/). A clean, always-current,
// shareable slug that renders the founder-approved deck exactly as authored.
// The surface itself lives in src/components/supaprod/BriefDeck.tsx, because
// /investors renders the identical page; this file owns only the head.
//
// Named /brief, not /investors, on purpose (founder 2026-07-24): the deck is a
// full company narrative - problem, product, market, team, ask - that reads for
// investors, partners, press, and candidates alike, so the URL is not
// pigeonholed to one audience. (/briefing was unavailable: the authenticated
// app already owns it via _authenticated.briefing.)
//
// THIS IS THE CANONICAL URL. /investors also serves the deck rather than
// redirecting to here (founder 2026-07-25), and points its canonical tag at
// this route, so the two addresses never compete for the same ranking.
//
// Distribution + discoverability (founder 2026-07-24): PUBLIC and indexable, so
// Google and answer engines can find and rank it. Shareable link is the primary
// channel: one Share button copies the URL, no lead-capture gate in front of it
// (a form would add friction with warm intros). The parent route renders a
// visible semantic brief below the full-viewport deck, so people and crawlers
// receive the same narrative without relying on iframe attribution. The
// primary SEO surface remains the landing at "/".
import { createFileRoute } from "@tanstack/react-router";

import { BriefDeck } from "@/components/supaprod/BriefDeck";

const SITE = "https://supaprod.ai";
const TITLE = "The Supaprod Brief · What we're building";
const DESC =
  "The Supaprod brief: for product managers who ship with agents. Agents that discover, decide, design, build, ship, and learn. Problem, product, market, team.";

export const Route = createFileRoute("/brief")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      // Public and indexable — this page should be discovered and ranked.
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE}/brief` },
      { property: "og:image", content: `${SITE}/og-supaprod.png` },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Supaprod: agents that own outcomes, not just output. Seven stations in orbit, the return path from Learn to Discover lit." },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: `${SITE}/og-supaprod.png` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/brief` }],
  }),
  component: BriefDeck,
});
