// TopBar — OBS-02 → LOOM W1 → IA SPINE (2026-07-11): a 52px quiet bar whose
// crumbs are now REAL wayfinding. Every segment but the last navigates (the
// bespoke per-surface back links are gone in favor of these crumbs); the
// workspace pill and the mono date left the bar (the rail header already
// names the workspace; the date decorated, it did not inform).
// AI-PULSE (founder ruling 2026-07-08): the LiveTicker rides here so EVERY
// screen shows what the machine is doing while it runs.
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LiveTicker } from "@/components/cadence/LivePulse";

/** A crumb is plain text (context only) or a link (navigates on click). */
export type Crumb = string | { label: string; to: string; search?: Record<string, string> };

function crumbLabel(c: Crumb): string {
  return typeof c === "string" ? c : c.label;
}

export function TopBar({ crumbs, actions }: { crumbs: Crumb[]; actions?: ReactNode }) {
  const last = crumbs.length - 1;

  return (
    <header
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "0 28px",
        height: 52,
        flexShrink: 0,
        borderBottom: "1px solid var(--hairline-faint)",
        background: "var(--canvas)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <nav
        aria-label="Breadcrumb"
        className="min-w-0 flex items-center"
        style={{ gap: 7, overflow: "hidden" }}
      >
        {crumbs.map((c, i) => {
          const isLast = i === last;
          const label = crumbLabel(c);
          return (
            <span key={`${label}-${i}`} className="flex min-w-0 items-center" style={{ gap: 7 }}>
              {i > 0 && (
                <span aria-hidden="true" style={{ color: "var(--text-faint)", fontSize: 11 }}>
                  /
                </span>
              )}
              {isLast ? (
                <span
                  aria-current="page"
                  className="text-heading-14 truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {label}
                </span>
              ) : typeof c === "string" ? (
                <span className="truncate" style={{ fontSize: 12.5, color: "var(--text-subtle)" }}>
                  {label}
                </span>
              ) : (
                <Link
                  to={c.to}
                  search={c.search as never}
                  className="truncate rounded-[4px] outline-none transition-colors duration-150 hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ember)]"
                  style={{ fontSize: 12.5, color: "var(--text-subtle)" }}
                >
                  {label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
      <span style={{ flex: 1 }} />
      <LiveTicker />
      {actions}
    </header>
  );
}
