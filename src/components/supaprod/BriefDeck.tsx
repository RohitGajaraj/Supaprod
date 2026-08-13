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
    <main
      style={{
        background: "#0a0a0a",
        color: "#f6f5f3",
        minHeight: "100vh",
      }}
    >
      <section
        id="deck"
        aria-label="Interactive Supaprod brief"
        style={{
          position: "relative",
          height: "100svh",
          minHeight: 520,
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

        <nav
          aria-label="Brief controls"
          style={{
            position: "absolute",
            top: 14,
            right: 16,
            display: "flex",
            gap: 8,
            zIndex: 10,
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
        </nav>
      </section>

      {/* Engine-Room: the public brief names outcomes and keeps prompts, traces,
          models and runtime wiring out of the visitor's path. */}
      <article id="brief-summary" tabIndex={-1} style={briefStyle}>
        <div style={{ width: "min(100%, 1080px)", margin: "0 auto" }}>
          <header
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "end",
              justifyContent: "space-between",
              gap: "32px 72px",
              paddingBottom: 56,
              borderBottom: "1px solid rgba(41,37,32,0.2)",
            }}
          >
            <div style={{ flex: "1 1 520px" }}>
              <p style={briefLabelStyle}>Supaprod brief</p>
              <h1 style={briefTitleStyle}>For product managers who ship with agents.</h1>
            </div>
            <div style={{ flex: "1 1 280px", maxWidth: 440 }}>
              <p style={{ ...briefBodyStyle, fontSize: "clamp(17px, 2vw, 21px)" }}>
                Supaprod is built for the individual PM or founding PM carrying a product from
                signal to outcome across too many tools. It starts by ranking what is worth
                building, then gives agents one governed route to do the work and check what
                happened.
              </p>
              <a href="#deck" onClick={focusDeck} style={briefLinkStyle}>
                View the interactive deck
              </a>
            </div>
          </header>

          <section aria-labelledby="director-heading" style={briefSectionStyle}>
            <p aria-hidden="true" style={briefNumberStyle}>
              01
            </p>
            <div>
              <h2 id="director-heading" style={briefHeadingStyle}>
                The director tells you what to build.
              </h2>
              <p style={briefBodyStyle}>
                Supaprod reads customer signals, product data, competitors, and the outcomes of past
                calls. It ranks the opportunities worth attention and shows the evidence behind
                them, so the first decision is what deserves to exist.
              </p>
            </div>
          </section>

          <section aria-labelledby="operating-system-heading" style={briefSectionStyle}>
            <p aria-hidden="true" style={briefNumberStyle}>
              02
            </p>
            <div>
              <h2 id="operating-system-heading" style={briefHeadingStyle}>
                The loop runs the whole lifecycle.
              </h2>
              <p style={briefBodyStyle}>
                Discover, Decide, Plan, Design, Build, Ship, and Learn run as one governed route.
                Work enters where it needs to, skips what it does not, and runs inside boundaries
                your team sets in advance. You meet the result and its evidence, not the prompts,
                traces, or model wiring.
              </p>
            </div>
          </section>

          <section aria-labelledby="company-brain-heading" style={briefSectionStyle}>
            <p aria-hidden="true" style={briefNumberStyle}>
              03
            </p>
            <div>
              <h2 id="company-brain-heading" style={briefHeadingStyle}>
                The shared brain learns, then guides.
              </h2>
              <p style={briefBodyStyle}>
                Learn settles a shipped outcome with a verdict and writes it back against the
                decision that caused it. That evidence re-ranks what Discover and Decide surface
                next. Supaprod does not stop at recording work. It compounds on your outcomes,
                labeled over time, and warns before you repeat what was wrong.
              </p>
            </div>
          </section>

          <footer
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "end",
              justifyContent: "space-between",
              gap: 32,
              paddingTop: 56,
              borderTop: "1px solid rgba(41,37,32,0.42)",
            }}
          >
            <p
              style={{
                margin: 0,
                maxWidth: 720,
                fontFamily: "'Geist Pixel Square', 'Geist Mono', ui-monospace, monospace",
                fontSize: "clamp(22px, 3.2vw, 38px)",
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
              }}
            >
              Building is no longer the bottleneck. Deciding what to build, and whether it was
              right, is.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              <span style={briefLabelStyle}>Public launch: mid-September 2026</span>
              <a href="mailto:investors@supaprod.ai" style={briefLinkStyle}>
                investors@supaprod.ai
              </a>
            </div>
          </footer>
        </div>
      </article>
    </main>
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

const briefStyle: React.CSSProperties = {
  minHeight: "100svh",
  padding: "clamp(72px, 10vw, 144px) clamp(24px, 7vw, 112px)",
  background: "#f5f2ec",
  color: "#292520",
  fontFamily: "'Geist', ui-sans-serif, system-ui, sans-serif",
  scrollMarginTop: 0,
};

const briefLabelStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "'Geist Mono', ui-monospace, monospace",
  fontSize: 11,
  lineHeight: 1.5,
  letterSpacing: "0.18em",
  textTransform: "uppercase",
  color: "#736a5f",
};

const briefTitleStyle: React.CSSProperties = {
  margin: "16px 0 0",
  maxWidth: 760,
  fontFamily: "'Geist Pixel Square', 'Geist Mono', ui-monospace, monospace",
  fontSize: "clamp(38px, 6.5vw, 76px)",
  fontWeight: 400,
  lineHeight: 1.08,
  letterSpacing: "-0.035em",
};

const briefSectionStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(44px, 0.18fr) minmax(0, 1fr)",
  gap: "clamp(20px, 4vw, 64px)",
  padding: "clamp(48px, 7vw, 88px) 0",
  borderBottom: "1px solid rgba(41,37,32,0.2)",
};

const briefNumberStyle: React.CSSProperties = {
  margin: 0,
  fontFamily: "'Geist Mono', ui-monospace, monospace",
  fontSize: 12,
  lineHeight: 1.5,
  letterSpacing: "0.14em",
  color: "#b34e1b",
};

const briefHeadingStyle: React.CSSProperties = {
  margin: 0,
  maxWidth: 760,
  fontFamily: "'Geist Pixel Square', 'Geist Mono', ui-monospace, monospace",
  fontSize: "clamp(27px, 4vw, 48px)",
  fontWeight: 400,
  lineHeight: 1.16,
  letterSpacing: "-0.025em",
};

const briefBodyStyle: React.CSSProperties = {
  margin: "20px 0 0",
  maxWidth: 760,
  fontSize: "clamp(16px, 1.8vw, 19px)",
  lineHeight: 1.68,
  color: "#5a5349",
};

const briefLinkStyle: React.CSSProperties = {
  display: "inline-block",
  marginTop: 24,
  fontFamily: "'Geist Mono', ui-monospace, monospace",
  fontSize: 11,
  lineHeight: 1.5,
  letterSpacing: "0.08em",
  color: "#292520",
  textUnderlineOffset: 5,
};
