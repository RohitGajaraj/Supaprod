// TopBar — OBS-02 → LOOM W1 → IA SPINE (2026-07-11): a 52px quiet bar whose
// crumbs are now REAL wayfinding. Every segment but the last navigates (the
// bespoke per-surface back links are gone in favor of these crumbs); the
// workspace pill and the mono date left the bar (the rail header already
// names the workspace; the date decorated, it did not inform).
// AI-PULSE (founder ruling 2026-07-08): the LiveTicker rides here so EVERY
// screen shows what the machine is doing while it runs.
import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Sparkles, Sun, Moon, Monitor } from "lucide-react";
import { LiveTicker } from "@/components/cadence/LivePulse";
import { DayWeather } from "@/components/cadence/DayWeather";
import { useTheme } from "@/hooks/use-theme";

/** A one-tap theme switcher (light → dark → system), so a user never has to
 *  open Settings to change the look (founder ruling 2026-07-13). Shows the
 *  current mode's icon; the label announces the next mode for a11y. */
function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : Monitor;
  const next = theme === "light" ? "dark" : theme === "dark" ? "system" : "light";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Theme: ${theme}. Switch to ${next}.`}
      title={`Theme: ${theme} — click for ${next}`}
      className="loom-press inline-flex items-center justify-center outline-none transition-colors duration-150 hover:text-[var(--text-primary)] hover:border-[var(--hairline-strong)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
      style={{
        width: 30,
        height: 30,
        borderRadius: 999,
        border: "1px solid var(--hairline)",
        background: "color-mix(in oklab, var(--card) 70%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        color: "var(--text-muted)",
        cursor: "pointer",
      }}
    >
      <Icon size={14} strokeWidth={1.9} />
    </button>
  );
}

/** The visible home for Ask (the reasoning engine you can talk to). Opens the
 *  same panel as Cmd+J / the palette ASK row via the shared window event, so
 *  a first-time user can always find it without knowing the shortcut. */
function AskButton() {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent("cadence:open-ask"))}
      aria-label="Ask Cadence"
      className="loom-press inline-flex items-center outline-none transition-colors duration-150 hover:border-[var(--ember-line)] hover:text-[var(--text-primary)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--focus-ring)]"
      style={{
        gap: 7,
        padding: "5px 11px",
        borderRadius: 999,
        border: "1px solid var(--hairline)",
        background: "color-mix(in oklab, var(--card) 70%, transparent)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        color: "var(--text-muted)",
        fontSize: 12.5,
        cursor: "pointer",
      }}
    >
      <Sparkles size={13} strokeWidth={1.9} style={{ color: "var(--ember)" }} />
      <span>Ask</span>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 9.5, color: "var(--text-faint)" }}>
        ⌘J
      </span>
    </button>
  );
}

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
        background: "color-mix(in oklab, var(--ds-background-100) 68%, transparent)",
        backdropFilter: "blur(14px) saturate(1.5)",
        WebkitBackdropFilter: "blur(14px) saturate(1.5)",
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
      <AskButton />
      <DayWeather />
      <LiveTicker />
      <ThemeToggle />
      {actions}
    </header>
  );
}
