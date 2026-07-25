// v6 Phase 0 / W4 - the cold-start on-ramp. A brand-new workspace lands on an
// empty Today; instead of a barren dashboard, the empty state IS the on-ramp.
// It narrates how to feed the loop and points only at WIRED mechanisms - the
// webhook ingest door (/sync), manual signal capture (/discover),
// and source connections (/settings). Voice: the loop runs the reversible
// work; you make the calls - no overclaiming.
//
// 2026-07-11: the component now gates ITSELF on getColdStart (no signals,
// opportunities, or specs), so mounting it is always safe - it renders
// nothing unless the workspace is genuinely cold, and the seeded demo never
// sees it. Tempo v5 port same session: token-traced chrome, 6px everyday
// radius, lucide 16/1.5, the headline stays the card's one Pixel moment.
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, Inbox, PenLine, Plug } from "lucide-react";
import { getColdStart } from "@/lib/today.functions";

const steps = [
  {
    icon: Inbox,
    title: "Open the ingest door",
    body: "Point Zapier, a form, or a quick script at your workspace's ingest URL. Every piece of feedback that lands becomes a signal Scout reads.",
    to: "/sync" as const,
    cta: "Set up ingest",
    primary: true,
  },
  {
    icon: PenLine,
    title: "Or paste a few by hand",
    body: "Drop in your last handful of customer notes, tickets, or call takeaways. A dozen is enough for Scout to find the first themes.",
    to: "/discover" as const,
    cta: "Add a signal",
  },
  {
    icon: Plug,
    title: "Connect a source",
    body: "Link a tool you already live in so signals flow in on their own. One click per source, no keys to paste.",
    to: "/settings" as const,
    cta: "Connect",
  },
];

export function ColdStartOnramp() {
  const fColdStart = useServerFn(getColdStart);
  const coldQ = useQuery({
    queryKey: ["cold-start"],
    queryFn: () => fColdStart(),
    staleTime: 60_000,
  });

  // Nothing until the gate answers, and nothing for a warm workspace: this
  // is an empty state, so an empty interim is the honest render.
  if (!coldQ.data?.isCold) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "4px 2px" }}>
      <div>
        {/* Geist Pixel welcome headline (DESIGN-TEMPO §3): the cold-start
            card's one Pixel moment. The onramp renders only in the
            empty-workspace state that replaces the populated hero, so this
            headline and the hero's Pixel numeral never co-render; keep it
            mounted INSTEAD OF Hero, never alongside. Step titles and body
            stay Geist Sans. */}
        <div
          style={{
            fontFamily: "var(--font-pixel)",
            fontWeight: 400,
            fontSize: 19,
            color: "var(--ds-gray-1000)",
          }}
        >
          Give your agents something to read.
        </div>
        <p
          style={{
            fontSize: "var(--text-label-13)",
            color: "var(--ds-gray-900)",
            marginTop: 6,
            maxWidth: 560,
            lineHeight: 1.5,
          }}
        >
          Supaprod works from your real signals - customer feedback, tickets, call notes. Pipe in the
          last couple of weeks and Scout clusters them into themes, Strategist ranks the
          opportunities, and your first calls land right here. The loop runs the reversible work;
          you make the calls.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <div
              key={i}
              className="fade-up"
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "12px 14px",
                border: "1px solid var(--ds-gray-alpha-400)",
                borderRadius: "var(--ds-radius-small)",
                background: s.primary
                  ? "color-mix(in srgb, var(--ds-ember-600) 6%, transparent)"
                  : "var(--ds-background-100)",
              }}
            >
              {/* Ruling C 2026-07-11 (accent restraint): these steps are static
                  guidance, not an AI working state, so the icons take the muted
                  gray of sibling icons instead of a standing accent. */}
              <Icon
                size={16}
                strokeWidth={1.5}
                aria-hidden="true"
                style={{ color: "var(--ds-gray-700)", flexShrink: 0, marginTop: 2 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="text-heading-14" style={{ color: "var(--ds-gray-1000)" }}>
                  {s.title}
                </div>
                <p
                  style={{
                    fontSize: "var(--text-label-13)",
                    color: "var(--ds-gray-900)",
                    marginTop: 2,
                    marginBottom: 0,
                    lineHeight: 1.45,
                  }}
                >
                  {s.body}
                </p>
              </div>
              <Link
                to={s.to}
                className="btn btn-sm hover:underline"
                style={{
                  flexShrink: 0,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  color: s.primary ? "var(--ds-ember-600)" : "var(--ds-blue-600)",
                  fontWeight: 600,
                }}
              >
                {s.cta}
                <ArrowRight size={16} strokeWidth={1.5} aria-hidden="true" />
              </Link>
            </div>
          );
        })}
      </div>

      {/* 2026-07-11: stale "Start mission in the top bar" copy fixed - the
          top bar has no such control; missions start on the Build page. */}
      <p className="mono-label" style={{ fontSize: "var(--text-label-12)", color: "var(--ds-gray-600)" }}>
        Prefer to point at a goal?{" "}
        <Link to="/build" style={{ color: "var(--ds-blue-600)", textDecoration: "underline" }}>
          Start a mission on the Build page
        </Link>{" "}
        - agents plan it and bring the calls back here.
      </p>
    </div>
  );
}
