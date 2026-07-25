// The deck surface itself, shared by the two routes that serve it.
//
// It lives here rather than in either route file because /brief and
// /investors render the SAME page (founder 2026-07-25). /investors used to
// throw a redirect, which meant the URL a person had just typed was replaced
// in front of them by a different one. Both now render, and /investors carries
// rel="canonical" pointing at /brief, so search engines still credit exactly
// one page and no ranking is split.
//
// That keeps the 2026-07-24 ruling intact instead of reversing it: the deck is
// a full company narrative that reads for investors, partners, press and
// candidates alike, so the CANONICAL url stays audience-neutral. /investors is
// an address people type, not the name of the artifact.
//
// The served copy lives at public/brief.html (byte-identical to the docs
// artifact) and is embedded full-bleed in an iframe, so its own arrow-key
// navigation, fonts and 16:9 print styles all work untouched.
import { useEffect, useRef, useState } from "react";

export const DECK_SRC = "/brief.html";

export function BriefDeck() {
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
    // Deliberately the URL the visitor is actually on, not the canonical one.
    // Both resolve to this same deck, and silently handing back an address
    // different from the one in their bar is the exact surprise the redirect
    // used to cause.
    const url = typeof window !== "undefined" ? window.location.href : "https://supaprod.ai/brief";
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Clipboard blocked (insecure context, or permission denied). The one
      // job left is to put the text somewhere the visitor can select it, and
      // a prompt is the only thing that both shows the string AND preselects
      // it for Cmd+C. A toast cannot be selected from, and an in-app dialog
      // would still need the visitor to drag-select the URL by hand.
      //
      // Carried over unchanged from routes/brief.tsx, where it has always
      // lived; moving the surface into a component is what first put it in
      // front of this rule. Rare fallback path, never the normal one.
      // eslint-disable-next-line no-restricted-syntax
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

      {/* One-click way back to the site. Plain text pill - the brand mark was
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
