import { useEffect, type CSSProperties, type ReactNode } from "react";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";

// The auth family (login, signup, recover, join) renders OUTSIDE the
// _authenticated tree, so it does not inherit the app's Obsidian dark scope.
// This hook mounts `data-obsidian` on <html> while an auth surface is shown, so
// the page AND its portals (toasts) read as the same calm dark Supaprod surface
// as the app, then restores the default (parchment landing) on unmount. It
// mirrors the pattern in _authenticated.tsx. Presentation only: the auth
// mechanism and session wiring are untouched.
export function useObsidianAuthSurface(): void {
  useEffect(() => {
    const root = document.documentElement;
    const alreadyOn = root.hasAttribute("data-obsidian");
    root.setAttribute("data-obsidian", "");
    return () => {
      // Do not tear it off if the authenticated app had already set it.
      if (!alreadyOn) root.removeAttribute("data-obsidian");
    };
  }, []);
}

// Shared field label + error styles so every auth form reads identically.
// Errors use --madder (the Obsidian negative/alert role); --rose is a data
// color under the Obsidian scope, not an alert.
export const fieldLabelStyle: CSSProperties = {
  display: "block",
  textAlign: "left",
  marginBottom: 5,
};

export const fieldErrorStyle: CSSProperties = {
  color: "var(--madder)",
  textAlign: "left",
  lineHeight: 1.5,
  margin: "0 0 10px",
};

const surface: CSSProperties = {
  position: "relative",
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "var(--ds-background-100)",
  color: "var(--text-primary)",
  overflow: "hidden",
  padding: "var(--geist-gap)",
};

const watermark: CSSProperties = {
  position: "absolute",
  right: -120,
  bottom: -130,
  color: "var(--text-primary)",
  opacity: 0.08,
  transform: "rotate(-12deg)",
  pointerEvents: "none",
};

const header: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
  marginBottom: 26,
};

// Tempo v5 materials law (DESIGN-TEMPO.md §4): elevation is a preset, never a
// hand-rolled border+shadow+radius trio. --card/--hairline/--shadow-elevated/
// --radius-card already alias 1:1 to --ds-background-100 / --ds-shadow-border-medium
// / --ds-radius-medium (12px), so `material-medium` renders identically here.
const card: CSSProperties = {
  padding: "var(--geist-gap)",
};

const footerStyle: CSSProperties = {
  color: "var(--text-subtle)",
  textAlign: "center",
  marginTop: 16,
  lineHeight: 1.5,
};

/**
 * The one calm, dark, on-brand shell for every auth surface. Renders the brand
 * mark, title, tagline, an optional value line, the form card, and optional
 * sub-card prose. Reused by /login, /signup, /forgot-password, /reset-password.
 */
export function AuthScaffold({
  screenLabel,
  title,
  tagline = "you make the calls · Supaprod runs the rest",
  intro,
  subhead,
  children,
  footer,
  cardWidth = 360,
}: {
  screenLabel: string;
  title: string;
  tagline?: string;
  /** A small mono line shown above the mark (e.g. PLG continuity context). */
  intro?: ReactNode;
  /** Prose under the tagline: the value line and any pre-filled intent. */
  subhead?: ReactNode;
  /** The form card body. */
  children: ReactNode;
  /** Prose under the card (alternate-path links, help). */
  footer?: ReactNode;
  cardWidth?: number;
}) {
  useObsidianAuthSurface();

  return (
    <div data-screen-label={screenLabel} style={surface}>
      {/* The watermark revolves barely and carries a faint white glow so it
          reads against the ink instead of sinking into it (founder 2026-07-15). */}
      <div aria-hidden="true" style={watermark}>
        <style>{`
          @keyframes authMarkRevolve {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @media (prefers-reduced-motion: reduce) {
            .auth-mark-revolve { animation: none !important; }
          }
        `}</style>
        <div
          className="auth-mark-revolve"
          style={{
            animation: "authMarkRevolve 180s linear infinite",
            filter: "drop-shadow(0 0 22px rgba(255,255,255,0.10))",
            willChange: "transform",
          }}
        >
          <SupaprodMark size={520} />
        </div>
      </div>

      <div
        className="fade-up"
        style={{
          width: cardWidth,
          maxWidth: "calc(100vw - 48px)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <div style={header}>
          {intro ? (
            <div className="mono-label" style={{ color: "var(--text-subtle)", marginBottom: 12 }}>
              {intro}
            </div>
          ) : null}
          <SupaprodMark size={52} />
          {/* Geist Pixel brand moment (DESIGN-TEMPO.md §3/§8): the auth
              headline is a genuine hero moment, one short line, shown once
              per screen, no other Pixel use on this surface. */}
          <h1 className="font-pixel" style={{ marginTop: 14, color: "var(--text-primary)" }}>
            {title}
          </h1>
          <div className="mono-label" style={{ marginTop: 6 }}>
            {tagline}
          </div>
          {subhead}
        </div>

        <div className="material-medium" style={card}>
          {children}
        </div>

        {footer ? <p style={footerStyle}>{footer}</p> : null}
      </div>
    </div>
  );
}
