// /investors serves the SAME deck as /brief, at its own URL.
//
// It used to throw a redirect to /brief, which solved the 404 but created a
// smaller annoyance in its place: the address a person had just typed, or been
// handed in an intro, was swapped in front of them for a different one
// (founder 2026-07-25). It renders now, so the URL stays where the visitor put
// it.
//
// THE 2026-07-24 RULING IS NOT REVERSED BY THIS. /brief remains canonical
// precisely because the deck is a full company narrative that reads for
// investors, partners, press and candidates alike, and naming the canonical
// URL after one of those audiences tells the other three it is not for them.
// What this route says is narrower: "supaprod.ai/investors" is an address
// people type, so it should work and stay put.
//
// Serving one page at two URLs is only safe because of the canonical link
// below. It tells search engines that /brief is the page of record, so the two
// addresses consolidate into one result instead of splitting the ranking
// between duplicates. og:url points at /brief for the same reason: a link
// unfurled from either address should identify the same artifact.
//
// The deck body is deliberately NOT duplicated. Both routes render the shared
// BriefDeck component, so there is exactly one implementation to keep current,
// which is the same reason the redirect was preferred over a copy originally.
import { createFileRoute } from "@tanstack/react-router";

import { BriefDeck } from "@/components/supaprod/BriefDeck";

const SITE = "https://supaprod.ai";
const TITLE = "The Supaprod Brief · What we're building";
const DESC =
  "The Supaprod brief: for product managers who ship with agents. Agents that discover, decide, design, build, ship, and learn. Problem, product, market, team.";

export const Route = createFileRoute("/investors")({
  ssr: true,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      // Indexable, and consolidated onto /brief by the canonical below. A
      // noindex here would fight the canonical rather than help it: the two
      // directives answer different questions, and pairing them is a known way
      // to get the page dropped instead of merged.
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
