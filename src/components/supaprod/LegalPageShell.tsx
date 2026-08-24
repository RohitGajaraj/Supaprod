// Shared chrome for the small standalone public pages (privacy, terms,
// security, changelog) that sit off the homepage footer. Matches the
// homepage's dark canvas so a footer click never feels like a different
// site. Kept deliberately plain: these are reference pages, not marketing.
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SupaprodWordmark } from "@/components/supaprod/SupaprodWordmark";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";
import { PUBLIC_INK_THEME } from "@/components/landing/inkTheme";

// Fixed ink values, NOT --ds-gray-* tokens.
//
// This shell used to paint itself with `background: var(--ds-gray-1000)`. That is
// a CONTRAST token, not a surface token, so it flips with the theme: #171717 in
// light, #ededed in dark. The app is dark-first, so in the default theme these
// pages rendered on a near-WHITE canvas while every other public page stayed dark.
// /security, /updates, /privacy and /terms were all affected.
//
// Public pages are deliberately dark-only (the 2026-07-15 landing v2 ink and
// starfield system), so they must not consult a theme-flipping token at all.
// These values match PUBLIC_INK_THEME, which /demo and /proof already use.
const C = {
  bg: "#0a0a0a",
  border: "rgba(255,255,255,0.09)",
  divider: "rgba(255,255,255,0.09)",
  text: "#f4f4f5",
  muted: "#a1a1aa",
  faint: "#71717a",
  ember: "#FF6B2C",
  emberBright: "#FF6B2C",
};

export function LegalPageShell({
  eyebrow,
  title,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div
      data-obsidian
      style={{
        minHeight: "100vh",
        background: C.bg,
        color: C.text,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        fontFamily: 'var(--mrd-font, "Geist", ui-sans-serif, system-ui, sans-serif)',
        // Page content below uses var(--ink-*) and var(--text-*) with parchment
        // era fallbacks. Without this the fallbacks win and the body text reads
        // light on light. /demo and /proof already spread this; this shell did
        // not, which is the other half of why these pages looked wrong.
        ...PUBLIC_INK_THEME,
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
            padding: "16px 24px",
            borderBottom: `1px solid ${C.divider}`,
          }}
        >
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
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
                gap: 9,
                textDecoration: "none",
                color: C.text,
              }}
            >
              <SupaprodWordmark tier="public" />
            </Link>
            <Link to="/" style={{ color: C.muted, textDecoration: "none" }}>
              ← Back to home
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, padding: "56px 24px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <p
              style={{
                fontFamily: "Geist Mono, monospace",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: C.emberBright,
                margin: "0 0 10px",
              }}
            >
              {eyebrow}
            </p>
            <h1
              style={{
                fontSize: "clamp(24px,3.6vw,34px)",
                fontWeight: 400,
                fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
                letterSpacing: "0",
                margin: "0 0 8px",
              }}
            >
              {title}
            </h1>
            <p style={{ color: C.faint, margin: "0 0 40px" }}>Last updated {updated}</p>
            <div
              style={{
                lineHeight: 1.75,
                color: C.muted,
              }}
            >
              {children}
            </div>
          </div>
        </main>

        <footer
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${C.divider}`,
          }}
        >
          <div
            style={{
              maxWidth: 720,
              margin: "0 auto",
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--geist-space-4x)",
            }}
          >
            {[
              { href: "/security", label: "Security" },
              { href: "/ard", label: "ARD" },
              { href: "/updates", label: "Changelog" },
              { href: "/proof", label: "Proof" },
              { href: "/privacy", label: "Privacy" },
              { href: "/terms", label: "Terms" },
            ].map((l) => (
              <a key={l.href} href={l.href} style={{ color: C.faint, textDecoration: "none" }}>
                {l.label}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}

export const legalSectionStyle = {
  marginTop: 28,
} as const;

export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={legalSectionStyle}>
      <h2 style={{ fontWeight: 600, color: C.text, margin: "0 0 8px" }}>{title}</h2>
      <div style={{ color: C.muted, lineHeight: 1.7 }}>{children}</div>
    </section>
  );
}
