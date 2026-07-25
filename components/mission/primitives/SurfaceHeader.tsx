// SurfaceHeader (comprehension primitive 6.1, design-language-spec).
// One identical header anatomy across every Canvas face, room, and drawer:
// stage marker, title, agent attribution atom, typed state chip, then the
// right cluster (copy deep link, kebab to Details). Never re-implemented
// locally. Costs never render here; they live behind the kebab (spec 7).

import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  MISSION_STATES,
  type MissionStateId,
  type MissionStateKind,
} from "@/lib/mission-vocabulary";

/**
 * The agent attribution atom (spec 2.4): a mono agent-name chip leading the
 * line wherever machine work is shown. One shared component, so attribution
 * never rides color alone; the name itself survives grayscale.
 */
export function AgentChip({ slug, className }: { slug: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex-none whitespace-nowrap rounded-[5px] px-[7px] py-[2px] font-mono text-[9.5px] uppercase tracking-[0.08em]",
        className,
      )}
      style={{ color: "var(--voice-machine-dim)", background: "var(--voice-machine-faint)" }}
    >
      {agentDisplayName(slug)}
    </span>
  );
}

/** A resolved header state: canonical id or an explicit kind + label pair. */
export interface SurfaceHeaderState {
  kind: MissionStateKind;
  /** Typed mission-state label ("Awaiting your decision"), or the plain blocked reason. */
  label: string;
}

export interface SurfaceHeaderProps {
  /** Mono stage marker, e.g. "03 Plan". Omit on stage-free surfaces. */
  stageMarker?: string;
  /** The artifact or face name. Prose, truncates rather than wraps. */
  title: string;
  /** Set when the surface content is machine-authored: renders the attribution atom. */
  agentSlug?: string | null;
  /** Omit for the static state (no chip). */
  state?: MissionStateId | SurfaceHeaderState;
  /** Stable deep link for this face; renders the copy action when present. */
  deepLink?: string;
  /** Opens the kebab affordance (Details lives there, including cost). */
  onDetails?: () => void;
  /** Extra right-cluster actions, rendered before the kebab. */
  children?: ReactNode;
  className?: string;
}

const STATE_DOT_CLASS: Record<MissionStateKind, string> = {
  working: "ink-working",
  "needs-you": "",
  done: "",
  blocked: "",
};

function stateChipStyle(kind: MissionStateKind): CSSProperties {
  switch (kind) {
    case "working":
      return {
        color: "var(--voice-machine)",
        borderColor: "var(--voice-machine-border)",
        background: "var(--voice-machine-faint)",
      };
    case "needs-you":
      return {
        color: "var(--voice-human)",
        borderColor: "var(--voice-human-border)",
        background: "var(--voice-human-faint)",
      };
    case "done":
      return { color: "var(--ink-body)", borderColor: "var(--ink-hairline)" };
    case "blocked":
      return {
        color: "var(--ink-body)",
        borderColor: "var(--ink-hairline)",
        borderStyle: "dashed",
      };
  }
}

export function SurfaceHeader({
  stageMarker,
  title,
  agentSlug,
  state,
  deepLink,
  onDetails,
  children,
  className,
}: SurfaceHeaderProps) {
  const [copied, setCopied] = useState(false);
  const resolved: SurfaceHeaderState | null =
    typeof state === "string" ? MISSION_STATES[state] : (state ?? null);

  const copyLink = () => {
    if (!deepLink) return;
    void navigator.clipboard?.writeText(deepLink);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <header
      className={cn("flex min-h-[52px] flex-none items-center gap-2.5 border-b px-5", className)}
      style={{ borderColor: "var(--ink-hairline)" }}
    >
      {stageMarker ? (
        <span
          className="whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.1em]"
          style={{ color: "var(--ink-subtle)" }}
        >
          {stageMarker}
        </span>
      ) : null}
      <span className="truncate text-sm font-semibold" style={{ color: "var(--ink-text)" }}>
        {title}
      </span>
      {agentSlug ? <AgentChip slug={agentSlug} /> : null}
      {resolved ? (
        <span
          className="inline-flex h-[22px] flex-none items-center gap-1.5 whitespace-nowrap rounded-[11px] border px-[9px] font-mono text-[10.5px] tracking-[0.03em]"
          style={stateChipStyle(resolved.kind)}
        >
          {resolved.kind === "done" ? (
            <span aria-hidden className="text-[10px]">
              {"✓"}
            </span>
          ) : (
            <span
              aria-hidden
              className={cn(
                "h-1.5 w-1.5 flex-none rounded-full bg-current",
                STATE_DOT_CLASS[resolved.kind],
              )}
            />
          )}
          {resolved.label}
        </span>
      ) : null}
      <div className="ml-auto flex items-center gap-1">
        {children}
        {deepLink ? (
          <button
            type="button"
            onClick={copyLink}
            title={copied ? "Link copied" : "Copy link"}
            aria-label={copied ? "Link copied" : "Copy link"}
            className="ink-focus inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:bg-[var(--ink-raised)]"
            style={{ color: copied ? "var(--ink-body)" : "var(--ink-subtle)" }}
          >
            {copied ? "✓" : "⧉"}
          </button>
        ) : null}
        {onDetails ? (
          <button
            type="button"
            onClick={onDetails}
            title="Details"
            aria-label="Details"
            className="ink-focus inline-flex h-7 w-7 items-center justify-center rounded-lg text-sm transition-colors hover:bg-[var(--ink-raised)]"
            style={{ color: "var(--ink-subtle)" }}
          >
            {"⋮"}
          </button>
        ) : null}
      </div>
    </header>
  );
}
