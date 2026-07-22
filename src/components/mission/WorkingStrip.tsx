// WorkingStrip (front-end reimagining, Phase 3): the always-on agent activity
// line (spec 6.2 idle/working, journey lens A2). It sits just above the
// Composer and answers "what is the machine doing right now" without a
// dashboard: one PulseLine per live locus (actor + verb + honest time) and a
// clickable summary ("2 agents working, 3 waiting on you").
//
// Honesty rules it obeys:
//   - NO cost figures, ever (spec 7). Not a credit, not a token, not a dollar.
//   - Specific beats generic (vocabulary contract 2): when the engine reports
//     a real action (liveAction, from the shared useLiveActivity poll) it
//     shows that on the one live locus; otherwise it draws the stage deck line
//     via drawWorkingLine, attributed to the station's own agent (structurally
//     honest: that agent is who runs that stage).
//   - Honest time only: elapsed or an estimate the engine has, never a fake
//     countdown or a percentage bar. Omitted when unknown.
//   - Receipts one click in: a live line opens that stage's face (where the
//     trace and receipts live); the summary's "waiting" opens the tray.
//
// Pure view (no hooks): the shell owns useLiveActivity and the loop-state read
// and passes them down, so this stays testable and the strip and the top-bar
// ticker draw from the one shared activity cache and can never disagree.

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { PulseLine } from "@/components/mission/primitives";
import { SPINE_STAGES, type StageId, type StageLoopState } from "@/components/mission/Spine";
import { castByStation, type AgentStation } from "@/lib/agent-vocabulary";
import { drawWorkingLine } from "@/lib/mission-vocabulary";

/** The Spine's StageId maps to the vocabulary's station axis (deck keys). */
const STAGE_TO_STATION: Record<StageId, AgentStation> = {
  discover: "sense",
  decide: "decide",
  plan: "define",
  design: "design",
  build: "build",
  ship: "ship",
  learn: "learn",
};

/** The station's canonical agent slug (first cast member), for attribution. */
function stationAgentSlug(station: AgentStation): string {
  return castByStation(station)[0]?.slug ?? "orchestrator";
}

export interface WorkingStripProps {
  /** Per-stage loop state (from getLoopState). Active stages become lines. */
  loopStages: StageLoopState[];
  /** The one count, one source: gates waiting on the human. */
  waitingCount: number;
  /** The engine's specific action for the primary live locus, when it has one. */
  liveAction?: string | null;
  /** Rotation seed so lines vary but stay stable within a session. */
  seed?: string | number;
  /** The summary's "waiting on you" opens the tray. */
  onOpenApprovals: () => void;
  /** A live line opens that stage's face (its receipts and trace). */
  onOpenStage?: (stage: StageId) => void;
  className?: string;
}

interface LiveLine {
  stage: StageId;
  agentSlug: string;
  line: string;
}

export function WorkingStrip({
  loopStages,
  waitingCount,
  liveAction,
  seed = "session",
  onOpenApprovals,
  onOpenStage,
  className,
}: WorkingStripProps) {
  const activeLines = useMemo<LiveLine[]>(() => {
    const active = SPINE_STAGES.map((s) => s.id).filter((id) =>
      loopStages.some((ls) => ls.stage === id && ls.state === "active"),
    );
    const avoid: string[] = [];
    return active.map((stage, i) => {
      const station = STAGE_TO_STATION[stage];
      const agentSlug = stationAgentSlug(station);
      // The one live locus (the first active stage) shows the engine's real
      // action when it has one; the rest draw the honest deck fallback.
      const loopVerb = loopStages.find((ls) => ls.stage === stage)?.liveVerb;
      const line =
        i === 0 && liveAction
          ? liveAction
          : (loopVerb ?? drawWorkingLine(station, agentSlug, seed, { avoid }));
      avoid.push(line);
      return { stage, agentSlug, line };
    });
  }, [loopStages, liveAction, seed]);

  const workingCount = activeLines.length;

  const summary =
    workingCount > 0
      ? `${workingCount} agent${workingCount === 1 ? "" : "s"} working`
      : "Nothing running";
  const waitingLabel =
    waitingCount > 0
      ? `${waitingCount} waiting on you`
      : "nothing waiting on you";

  return (
    <div
      data-testid="working-strip"
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t px-5 py-2",
        className,
      )}
      style={{ borderColor: "var(--ink-hairline-soft)", background: "var(--ink-bg)" }}
    >
      {activeLines.length > 0 ? (
        activeLines.slice(0, 2).map((l) => (
          <button
            key={l.stage}
            type="button"
            onClick={() => onOpenStage?.(l.stage)}
            className="ink-focus flex min-w-0 items-center rounded-md text-left"
            title="Open the stage"
          >
            <PulseLine state="working" agentSlug={l.agentSlug} line={l.line} />
          </button>
        ))
      ) : null}

      {/* The idle/summary line: always present so the strip is never blank.
          The "waiting" clause opens the tray (the one pull point). */}
      <div className="ml-auto flex items-center gap-1.5 font-mono text-[11px]">
        <span style={{ color: "var(--ink-subtle)" }}>{summary},</span>
        {waitingCount > 0 ? (
          <button
            type="button"
            onClick={onOpenApprovals}
            className="ink-focus rounded-sm transition-colors hover:text-[var(--voice-human)]"
            style={{ color: "var(--voice-human-dim)" }}
          >
            {waitingLabel}
          </button>
        ) : (
          <span style={{ color: "var(--ink-faint)" }}>{waitingLabel}</span>
        )}
      </div>
    </div>
  );
}
