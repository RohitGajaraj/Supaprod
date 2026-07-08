import * as React from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAskMissionCanvas, type AskMemoryRecall } from "@/lib/ask-canvas.functions";
import type { LoopStep } from "@/lib/ai/loop.server";
import type { StudioApproval } from "@/lib/studio.functions";
import type { CriticReview } from "@/lib/ai/critic.server";
import { MonoLabel } from "./primitives";
import { StatusDot, STATUS_WORD } from "./status";
import { VerdictChip, type VerdictTone } from "./verdict";
import { Citation } from "./citation";
import { stepDotState, stepDescription } from "./build-status";

// CMD-0 (H2 Command Canvas, first increment). The blocks Ask's thread
// renders in place of the old dead-end "Track the mission" link while a
// dispatched mission runs: loop progress, the memories it drew on, and the
// Critic's verdict, as outcome-named, Warp-style blocks (command-canvas.md).
// Read-only: no write, no `/api/chat` change (that SSE contract is locked
// per OBS-12 §3). Polls `getAskMissionCanvas` every 4s, the same interval
// `MissionSlideOver` already uses for the same class of data.

const BLOCK_STYLE: React.CSSProperties = {
  background: "var(--surface-recessed)",
  border: "1px solid var(--hairline)",
  borderRadius: "var(--radius-card)",
  padding: "10px 12px",
};

const RUN_STATUS_LABEL: Record<string, string> = {
  running: "BUILDING",
  queued: "QUEUED",
  waiting_approval: "WAITING ON YOU",
  blocked: "WAITING ON YOU",
  completed: "SHIPPED",
  done: "SHIPPED",
  failed: "BLOCKED",
  halted: "BLOCKED",
  cancelled: "BLOCKED",
  completed_with_failures: "BLOCKED",
};

/** PURE. Outcome-named label for a run's status (never the raw DB word). */
export function runStatusLabel(status: string): string {
  return RUN_STATUS_LABEL[status] ?? status.toUpperCase();
}

/** PURE. Whether the canvas has anything real to show, gating the whole
 * block area so a mission with no steps/citations/verdict yet renders
 * nothing rather than an empty shell (the no-filler law). */
export function hasCanvasContent(data: {
  run: { steps: LoopStep[] } | null;
  memoryRecalls: AskMemoryRecall[];
  criticVerdict: CriticReview | null;
}): boolean {
  return !!(
    (data.run && data.run.steps.length > 0) ||
    data.memoryRecalls.length > 0 ||
    data.criticVerdict
  );
}

export function ProgressBlock({
  run,
  approvals,
}: {
  run: { runId: string; status: string; steps: LoopStep[] };
  approvals: StudioApproval[];
}) {
  if (run.steps.length === 0) return null;
  // The last 5 steps: this is a live-progress glance, not the full trace
  // (the full trace is one "Track the mission" click away).
  const recent = run.steps.slice(-5);
  return (
    <div style={BLOCK_STYLE}>
      <MonoLabel tone="muted">{runStatusLabel(run.status)}</MonoLabel>
      <div className="flex flex-col" style={{ gap: 5, marginTop: 8 }}>
        {recent.map((step, i) => {
          const dotState = stepDotState(step, approvals);
          return (
            <div key={i} className="flex items-center gap-2">
              <StatusDot state={dotState} word={STATUS_WORD[dotState]} style={{ flexShrink: 0 }} />
              <span
                className="min-w-0 flex-1 truncate"
                style={{ fontFamily: "var(--font-ui)", fontSize: 12, color: "var(--text-body)" }}
              >
                {stepDescription(step)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MemoryBlock({ recalls }: { recalls: AskMemoryRecall[] }) {
  if (recalls.length === 0) return null;
  // Citation's own anatomy is an inline superscript marker threaded into
  // prose; there is no surrounding sentence here to thread it into, so each
  // chip carries a visible mono-caps kind label alongside it rather than
  // relying on the hover/focus popover alone to say anything at all.
  return (
    <div style={BLOCK_STYLE}>
      <MonoLabel tone="muted">DREW ON</MonoLabel>
      <div className="flex flex-col" style={{ gap: 5, marginTop: 8 }}>
        {recalls.map((m, i) => (
          <div key={m.id} className="flex items-center gap-2">
            <Citation index={i + 1} source={m.kind || "past session"} quote={m.content} />
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 10.5,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
                color: "var(--text-subtle)",
              }}
            >
              {m.kind || "past session"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CriticBlock({ verdict }: { verdict: CriticReview }) {
  const tone = verdict.verdict.toUpperCase() as VerdictTone;
  // Ask's own rule (obsidian-extensions.md §2) reserves the panel's one
  // ember for a CTA the answer proposes; a Critic verdict is advisory, never
  // a click-here action, so REVISE (VerdictChip's ember-family tone) would
  // read as a second, misleading "you have something to do" signal here.
  // SHIP/KILL (moss/madder) carry no such conflict and use the canonical
  // chip unchanged; REVISE alone gets a neutral mono-caps word instead.
  return (
    <div style={BLOCK_STYLE}>
      <div className="flex items-center gap-2">
        <MonoLabel tone="muted">CRITIC</MonoLabel>
        {tone === "REVISE" ? (
          <MonoLabel tone="faint">REVISE</MonoLabel>
        ) : (
          <VerdictChip tone={tone} />
        )}
      </div>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: 12.5,
          lineHeight: 1.55,
          color: "var(--text-body)",
          marginTop: 8,
        }}
      >
        {verdict.summary}
      </p>
    </div>
  );
}

export function MissionCanvasBlocks({ missionId }: { missionId: string }) {
  const fGet = useServerFn(getAskMissionCanvas);
  const q = useQuery({
    queryKey: ["ask-mission-canvas", missionId],
    queryFn: () => fGet({ data: { missionId } }),
    refetchInterval: 4000,
  });

  const data = q.data;
  if (!data || !hasCanvasContent(data)) return null;

  return (
    <div className="flex flex-col" style={{ gap: 8, marginTop: 8 }}>
      {data.run ? <ProgressBlock run={data.run} approvals={data.approvals} /> : null}
      <MemoryBlock recalls={data.memoryRecalls} />
      {data.criticVerdict ? <CriticBlock verdict={data.criticVerdict} /> : null}
    </div>
  );
}
