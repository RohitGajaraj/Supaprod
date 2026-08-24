// PageHeader — the ONE canonical stage header for every authenticated surface
// (Tempo revamp, 2026-07-13). It replaces the per-route bespoke "editorial"
// hero (var(--font-serif) + fontWeight 430 + an italic ember <em>) that was a
// retired Loom/Ember remnant DESIGN-TEMPO.md §3/§10 explicitly retires. One
// header, one voice, everywhere: a mono stage kicker (so a first-time user
// always knows WHERE they are and WHAT comes next), a Geist Sans title (600,
// tight tracking — the only heading face), a plain-words subtitle, and an
// always-visible USP line (so the star capability of the stage is shown, never
// buried). No serif, no italic, no Pixel face here — the header is chrome, not
// a brand moment, so it never spends the one-personality-touch budget.
//
// Contract: title is the outcome-first name of the surface; `accent` (optional)
// is a single word rendered in ember to give the title one calm brand beat
// (ember = brand, DESIGN-TEMPO §2), never italic. `usp` is the one-sentence
// "why this stage earns its place" — the reason-for-everything mandate.

import type { ReactNode } from "react";

export type PageHeaderProps = {
  /** Mono kicker naming the lifecycle position, e.g. "The Loop · 01 Discover"
   *  or "Intelligence · Memory". Renders uppercase in the mono voice.
   *  Wayfinding fix 2026-07-19: OPTIONAL, and omitted wherever the TopBar
   *  crumb already names the surface; one wayfinding source per screen.
   *  Pass it only when it adds location the crumb does not carry. */
  eyebrow?: string;
  /** Outcome-first surface title, Geist Sans 600. Plain string; use `accent`
   *  for the one ember-emphasized word. */
  title: string;
  /** Optional single word (or short phrase) inside/after the title rendered in
   *  ember — the calm brand beat that used to be an italic serif <em>. */
  accent?: string;
  /** Where the accent sits relative to the title. Default: after. */
  accentPosition?: "before" | "after";
  /** Plain-words description of what this surface is. */
  subtitle?: string;
  /** The star capability of this stage, stated in one line — always visible so
   *  no USP is ever buried. Shown as a quiet bordered capsule with an ember
   *  status dot. */
  usp?: string;
  /** Right-aligned actions (at most one ember primary CTA per view). */
  actions?: ReactNode;
  /** Extra content rendered under the header block (presence chips, relays). */
  children?: ReactNode;
};

export function PageHeader({
  eyebrow,
  title,
  accent,
  accentPosition = "after",
  subtitle,
  usp,
  actions,
  children,
}: PageHeaderProps) {
  const accentSpan = accent ? <span style={{ color: "var(--mrd-you)" }}>{accent}</span> : null;

  return (
    <header style={{ marginBottom: 24 }}>
      <div className="flex items-start justify-between" style={{ gap: 20, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          {eyebrow ? (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.14em",
                color: "var(--text-subtle)",
                textTransform: "uppercase",
                marginBottom: 10,
              }}
            >
              {eyebrow}
            </div>
          ) : null}
          <h1
            style={{
              fontFamily: "var(--font-pixel)",
              fontWeight: 400,
              fontStyle: "normal",
              fontSize: "clamp(21px, 2.5vw, 29px)",
              lineHeight: 1.18,
              letterSpacing: "0.005em",
              color: "var(--text-primary)",
              margin: "0 0 10px",
            }}
          >
            {accent && accentPosition === "before" ? (
              <>
                {accentSpan} {title}
              </>
            ) : accent ? (
              <>
                {title} {accentSpan}
              </>
            ) : (
              title
            )}
          </h1>
          {subtitle ? (
            <p
              style={{
                color: "var(--text-body)",
                margin: 0,
                maxWidth: "60ch",
              }}
            >
              {subtitle}
            </p>
          ) : null}
        </div>
        {actions ? (
          <div className="shrink-0 flex items-center" style={{ gap: 10 }}>
            {actions}
          </div>
        ) : null}
      </div>

      {usp ? (
        <div
          className="flex items-center"
          style={{
            gap: 9,
            marginTop: 16,
            padding: "8px 13px",
            width: "fit-content",
            maxWidth: "100%",
            background: "var(--card)",
            border: "1px solid var(--mrd-edge)",
            borderRadius: 999,
            boxShadow: "var(--top-light)",
          }}
        >
          <span
            aria-hidden="true"
            className="shrink-0"
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--mrd-you)",
              boxShadow: "0 0 8px color-mix(in srgb, var(--mrd-you) 55%, transparent)",
            }}
          />
          <span
            style={{
              color: "var(--text-body)",
              lineHeight: 1.35,
            }}
          >
            {usp}
          </span>
        </div>
      ) : null}

      {children ? <div style={{ marginTop: 16 }}>{children}</div> : null}
    </header>
  );
}
