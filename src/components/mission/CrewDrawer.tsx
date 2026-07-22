// CrewDrawer (front-end reimagining, Phase 4): the 13-agent roster in-context
// (charter §3.5-C "agents are manageable", journey lens A6 "the moat is the
// crew you can see"). A right slide-over that names who is on the team, what
// station each runs, and what they do, without leaving the room.
//
// Read-only by design: this is the in-context VISIBILITY of the crew. Managing
// what each agent can do (approval modes, tool grants) lives in Settings >
// Agents (the ledger of grants, spec §8); this drawer never claims to change
// anything, so it needs no backend beyond the static catalog.
//
// Voice: attribution rides the mono agent-name chip (AgentChip), never a
// per-agent rainbow hue (spec §2.4 / §2.3 no fourth voice). The roster is the
// canonical 13: the Chief of Staff conductor + the twelve cast specialists,
// grouped by the seven loop stations.

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { AgentChip } from "@/components/mission/primitives/SurfaceHeader";
import {
  AGENT_STATION_ORDER,
  AGENT_STATIONS,
  agentBlurb,
  castByStation,
  conductorEntry,
} from "@/lib/agent-vocabulary";

export interface CrewDrawerProps {
  open: boolean;
  onClose: () => void;
}

/** One roster row: the mono agent chip + the plain-words blurb. */
function CrewRow({ slug }: { slug: string }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <AgentChip slug={slug} className="mt-px" />
      <p className="text-[12.5px] leading-[1.5]" style={{ color: "var(--ink-body)" }}>
        {agentBlurb(slug) ?? ""}
      </p>
    </div>
  );
}

export function CrewDrawer({ open, onClose }: CrewDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const conductor = conductorEntry();
  const stations = AGENT_STATION_ORDER.map((station) => ({
    station,
    meta: AGENT_STATIONS[station],
    agents: castByStation(station),
  })).filter((s) => s.agents.length > 0);

  const total = (conductor ? 1 : 0) + stations.reduce((n, s) => n + s.agents.length, 0);

  return (
    <div className="fixed inset-0 z-40">
      <div
        onClick={onClose}
        className="mc-crew-scrim absolute inset-0"
        style={{ background: "rgba(0,0,0,0.4)" }}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="The crew"
        data-testid="crew-drawer"
        className="mc-crew-panel absolute right-0 top-0 flex h-full w-[420px] max-w-[92vw] flex-col border-l shadow-2xl"
        style={{ background: "var(--ink-panel)", borderColor: "var(--ink-hairline)" }}
      >
        <header
          className="flex flex-none items-center gap-2.5 border-b px-4 py-3"
          style={{ borderColor: "var(--ink-hairline)" }}
        >
          <span className="text-[13px] font-semibold" style={{ color: "var(--ink-text)" }}>
            The crew
          </span>
          <span
            className="inline-flex h-4 min-w-4 items-center justify-center rounded-lg border px-1 font-mono text-[10px] tabular-nums"
            style={{ color: "var(--chip-fg)", background: "var(--chip-faint)", borderColor: "var(--chip-border)" }}
          >
            {total}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ink-focus ml-auto inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:bg-[var(--ink-raised)]"
            style={{ color: "var(--ink-subtle)" }}
          >
            {"✕"}
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          {conductor ? (
            <section>
              <h3
                className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em]"
                style={{ color: "var(--ink-faint)" }}
              >
                Runs the loop
              </h3>
              <CrewRow slug={conductor.slug} />
            </section>
          ) : null}

          {stations.map(({ station, meta, agents }) => (
            <section key={station}>
              <h3
                className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.1em]"
                style={{ color: "var(--ink-faint)" }}
              >
                {meta.name}
              </h3>
              <p className="mb-1 text-[11.5px]" style={{ color: "var(--ink-subtle)" }}>
                {meta.blurb}
              </p>
              {agents.map((a) => (
                <CrewRow key={a.slug} slug={a.slug} />
              ))}
            </section>
          ))}
        </div>

        <footer
          className="flex-none border-t px-4 py-2.5"
          style={{ borderColor: "var(--ink-hairline)" }}
        >
          <p className="text-[11px]" style={{ color: "var(--ink-faint)" }}>
            Approval modes and tool access live in Settings.
          </p>
        </footer>

        <style>{`
          @keyframes mcCrewScrim { from { opacity: 0; } to { opacity: 1; } }
          @keyframes mcCrewPanel { from { transform: translateX(100%); } to { transform: translateX(0); } }
          .mc-crew-scrim { animation: mcCrewScrim 150ms ease; }
          .mc-crew-panel { animation: mcCrewPanel 150ms cubic-bezier(0.23,1,0.3,1); }
          @media (prefers-reduced-motion: reduce) {
            .mc-crew-scrim, .mc-crew-panel { animation: none; }
          }
        `}</style>
      </aside>
    </div>
  );
}
