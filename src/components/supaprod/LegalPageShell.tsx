// Shared chrome for the small standalone public pages (privacy, terms,
// security, changelog) that sit off the homepage footer. Matches the
// homepage's dark canvas so a footer click never feels like a different
// site. Kept deliberately plain: these are reference pages, not marketing.
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { SupaprodMark } from "@/components/supaprod/SupaprodMark";
import { LandingBackdrop } from "@/components/landing/LandingBackdrop";

const C = {
  bg: "var(--ds-gray-1000)",
  border: "var(--ds-gray-400)",
  divider: "var(--ds-gray-400)",
  text: "var(--ds-gray-50)",
  muted: "var(--ds-gray-500)",
  faint: "var(--ds-gray-700)",
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
        fontFamily: 'var(--font-sans, "Geist", ui-sans-serif, system-ui, sans-serif)',
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
              <span style={{ color: "rgba(255,255,255,0.9)", display: "inline-flex" }}>
                <SupaprodMark size={20} />
              </span>
              <span style={{ fontSize: 13, fontWeight: 550, letterSpacing: "-0.01em" }}>
                Supaprod
              </span>
            </Link>
            <Link to="/" style={{ fontSize: 12.5, color: C.muted, textDecoration: "none" }}>
              ← Back to home
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, padding: "56px 24px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <p
              style={{
                fontFamily: "Geist Mono, monospace",
                fontSize: 10,
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
            <p style={{ fontSize: 12.5, color: C.faint, margin: "0 0 40px" }}>
              Last updated {updated}
            </p>
            <div
              style={{
                fontSize: 14.5,
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
              gap: 16,
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
              <a
                key={l.href}
                href={l.href}
                style={{ fontSize: 10.5, color: C.faint, textDecoration: "none" }}
              >
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
      <h2 style={{ fontSize: 17, fontWeight: 600, color: C.text, margin: "0 0 8px" }}>{title}</h2>
      <div style={{ color: C.muted, lineHeight: 1.7, fontSize: 14 }}>{children}</div>
    </section>
  );
}
