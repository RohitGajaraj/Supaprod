// The Supaprod brief (docs/pitch/investor-deck/). A clean, always-current,
// shareable slug that renders the founder-approved deck exactly as authored:
// the served copy lives at public/brief.html (byte-identical to the docs
// artifact) and is embedded full-bleed in an iframe, so its own arrow-key
// navigation, fonts, and 16:9 print styles all work untouched.
//
// Named /brief, not /investors, on purpose (founder 2026-07-24): the deck is a
// full company narrative — problem, product, market, team, ask — that reads for
// investors, partners, press, and candidates alike, so the URL is not
// pigeonholed to one audience. (/briefing was unavailable: the authenticated
// app already owns it via _authenticated.briefing.)
//
// Distribution + discoverability (founder 2026-07-24): PUBLIC and indexable, so
// Google and answer engines can find and rank it. Shareable link is the primary
// channel: one Share button copies the URL, no lead-capture gate in front of it
// (a form would add friction with warm intros). The deck's rich narrative text
// is crawlable at /brief.html (the iframe source); the primary SEO surface
// remains the landing at "/".
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

const SITE = "https://supaprod.ai";
const DECK_SRC = "/brief.html";
const TITLE = "The Supaprod Brief · What we're building";
const DESC =
  "The Supaprod brief: the AI-native, agentic-first operating system for product teams. Agents that know what to build, ship it, and remember. Problem, product, market, team.";

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
      { property: "og:image:alt", content: "Supaprod, your AI product team" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESC },
      { name: "twitter:image", content: `${SITE}/og-supaprod.png` },
    ],
    links: [{ rel: "canonical", href: `${SITE}/brief` }],
  }),
  component: Brief,
});

function Brief() {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [copied, setCopied] = useState(false);

  // The deck listens for keydown on its own window; focus it once it loads so
  // arrow-key navigation works without the visitor having to click in first.
  const focusDeck = () => {
    try {
      frameRef.current?.contentWindow?.focus();
    } catch {
      // cross-origin should never happen (same-origin static asset); ignore
    }
  };

  useEffect(() => {
    const t = setTimeout(focusDeck, 400);
    return () => clearTimeout(t);
  }, []);

  const copyLink = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "https://supaprod.ai/brief";
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // clipboard blocked (insecure context / permissions): fall back to a prompt
      window.prompt("Copy this link", url);
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a0a0a",
        isolation: "isolate",
        overflow: "hidden",
      }}
    >
      <iframe
        ref={frameRef}
        src={DECK_SRC}
        title="Supaprod Brief"
        onLoad={focusDeck}
        allow="fullscreen; clipboard-write"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }}
      />

      {/* One-click way back to the site. Plain text pill — the brand mark was
          overlapping slide content as the deck advanced, so text only. Sits in
          the top-left gutter; a full page nav to "/" loads the landing cleanly
          out of the deck's iframe. A touch more visible at rest than the tools,
          since finding the way home shouldn't take a hunt. */}
      <a
        href="/"
        aria-label="Back to the Supaprod home page"
        title="Supaprod home"
        style={{
          ...pillStyle,
          position: "absolute",
          top: 14,
          left: 16,
          zIndex: 10,
          textDecoration: "none",
          opacity: 0.6,
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
      >
        Home
      </a>

      {/* Unobtrusive tools, top-right. Low opacity at rest so the deck reads
          clean during a live walk-through; full on hover. Kept off the deck's
          own bottom chrome (nav dots + counter) on purpose. */}
      <div
        style={{
          position: "absolute",
          top: 14,
          right: 16,
          display: "flex",
          gap: 8,
          zIndex: 10,
          opacity: 0.4,
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.4")}
      >
        <button type="button" onClick={copyLink} style={pillStyle} aria-label="Copy shareable link">
          {copied ? "Link copied" : "Share"}
        </button>
      </div>
    </div>
  );
}

const pillStyle: React.CSSProperties = {
  fontFamily: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  fontSize: 10.5,
  letterSpacing: "0.06em",
  color: "#d1cfc9",
  background: "rgba(14,14,15,0.85)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 999,
  padding: "6px 13px",
  cursor: "pointer",
  backdropFilter: "blur(6px)",
  WebkitBackdropFilter: "blur(6px)",
};
