// Shared chrome for the small standalone public pages (privacy, terms,
// security, changelog) that sit off the homepage footer. Matches the
// homepage's dark canvas so a footer click never feels like a different
// site. Kept deliberately plain: these are reference pages, not marketing.
import { FooterLinks } from "./FooterLinks";
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
  /*
   * #71717a UNTIL 2026-08-27, WHICH IS 4.10:1 ON THIS SHELL'S #0a0a0a GROUND
   * AND FAILS AA. Five routes import this shell -- terms, privacy, faq,
   * security, updates -- and S4 measured EXACTLY SEVEN failures on each of the
   * four that are in the baseline, the same seven every time: the "Last
   * updated" line and the six footer links. One constant, 35 elements.
   *
   * #7e7e86 is 4.92:1 on the same ground, and it is deliberately the SAME value
   * this exact source colour was moved to in TheGap.tsx under cc23c49fc. Two
   * components carrying the same wrong grey should not end up with two
   * different right greys.
   *
   * IT STAYS A LITERAL RATHER THAN BECOMING --mrd-faint, and the comment above
   * this object is the reason: public pages are dark-only and must not consult
   * a theme-flipping token. `[data-theme="light"]` re-declares --mrd-faint at
   * oklch 0.52, DARKER than the dark value, which on a ground that does not
   * invert would turn this fix into a worse failure than the one it corrects.
   * The public shell elsewhere reads those tokens only under
   * `[data-mrd-pinned-dark]`, and this shell does not stamp it.
   */
  faint: "#7e7e86",
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
            {/*
             * A 44x44 HIT AREA THAT CANNOT REFLOW THE ROW, now shared.
             *
             * Measured by S4 at every width: these six render 21px tall against
             * a 24px floor, on the five routes that import this shell. The gap
             * to the nearest neighbour is 16px, so 21 + 16 + 16 = 53 and a full
             * 44 fits with room left.
             *
             * The rendering moved into `FooterLinks` after this fix reached
             * five routes and missed the two that draw their own anchors from
             * the same list. The BOX around them stays here, because a 720px
             * centred column is this shell's own and not a shared decision.
             */}
            <FooterLinks style={{ color: C.faint }} />
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
      {/*
       * THE PROSE CARRIES THE MEASURE, not the page column.
       *
       * Five pages render through this shell -- privacy, security, faq, terms,
       * updates -- and S4 measured six paragraphs on /faq at 81 to 83ch and six
       * on /security at 80 to 82ch. Consistent enough to be a container rather
       * than lines that got away, and it was: the shell's column is
       * `maxWidth: 720`, which is about 83ch at this type.
       *
       * WHY HERE AND NOT ON THAT COLUMN. `--mrd-measure` is expressed in `ch`,
       * and `ch` resolves in the font of the element the property is WRITTEN
       * ON -- the trap that made today.css declare 72 and render 79. The shell
       * bounds three columns at 720: this prose, the header nav and the footer.
       * Putting a ch measure on all three would give three different widths and
       * pull the chrome out of alignment with itself; putting it on one would
       * make the other two disagree. Bounding the PROSE leaves the page frame
       * intact and narrows only what is read at length, which is what the token
       * is for -- meridian.css says "prose only, never a table or a row".
       */}
      <div style={{ color: C.muted, lineHeight: 1.7, maxWidth: "var(--mrd-measure)" }}>
        {children}
      </div>
    </section>
  );
}
