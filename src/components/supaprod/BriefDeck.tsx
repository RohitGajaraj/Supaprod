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
  // Set only when the clipboard write fails. Holding the URL in state is what
  // lets the fallback be a real element in the page instead of a browser
  // dialog: the pill becomes a selectable field showing this string.
  const [manualCopyUrl, setManualCopyUrl] = useState<string | null>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);

  // Select the text the moment the field appears, so the fallback costs the
  // visitor one keystroke (Cmd+C) rather than a drag-select. This is the only
  // thing window.prompt did better than a plain dialog, and it is three lines.
  useEffect(() => {
    if (!manualCopyUrl) return;
    manualInputRef.current?.focus();
    manualInputRef.current?.select();
  }, [manualCopyUrl]);

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
      // Clipboard blocked: insecure context, denied permission, or a webview
      // that does not implement the API. The job left is to put the string
      // where the visitor can select it themselves.
      //
      // This was window.prompt until 2026-07-25. It worked, and it was the one
      // browser dialog with a real argument behind it, since a prompt both
      // shows a string and preselects it. But it is an unstyled OS box on a
      // page whose entire chrome is two 10.5px mono pills, and the repo bans
      // browser popups for exactly that reason. Suppressing the rule to keep
      // it was the wrong trade: the same affordance is a readonly input and an
      // effect that calls select().
      //
      // Not usePrompt() either, though it exists and the provider does reach
      // this route. That helper is a Save/Cancel dialog for COLLECTING input,
      // so it would show an editable field and an action button for a value
      // nobody is submitting. Wrong shape, and a modal is heavy for one line.
      setManualCopyUrl(url);
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
          // The fallback field is the one thing here that must be readable at
          // rest: it exists because the visitor already tried and failed to
          // get this link, so hiding it behind a hover would be the second
          // failure in a row.
          opacity: manualCopyUrl ? 1 : 0.4,
          transition: "opacity 0.2s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = manualCopyUrl ? "1" : "0.4")}
      >
        {manualCopyUrl ? (
          <input
            ref={manualInputRef}
            readOnly
            value={manualCopyUrl}
            aria-label="Shareable link, select and copy"
            onFocus={(e) => e.currentTarget.select()}
            // Escape dismisses, and so does clicking away. No explicit close
            // control: the field IS the message, and one more pill next to it
            // would be more chrome than the thing it is apologising for.
            onKeyDown={(e) => {
              if (e.key === "Escape") setManualCopyUrl(null);
            }}
            onBlur={() => setManualCopyUrl(null)}
            style={{ ...pillStyle, width: 260, cursor: "text" }}
          />
        ) : (
          <button
            type="button"
            onClick={copyLink}
            style={pillStyle}
            aria-label="Copy shareable link"
          >
            {copied ? "Link copied" : "Share"}
          </button>
        )}
      </div>
    </div>
  );
}

const pillStyle: React.CSSProperties = {
  fontFamily: "'Geist Mono', ui-monospace, 'SF Mono', Menlo, monospace",
  fontSize: 11,
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
