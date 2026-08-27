// OBS-10: the orchestrator-mission detail body, ported from the retired
// /missions/$missionId route with its data, mutations and Ember-Editorial
// styling intact. Functionality preserved exactly: live polling, orchestrator
// advance, the governance gate, memory context, hop input/output/handoffs,
// capture-as-decision, replay-with-model, cancel, and the failed-mission retry
// path. Only the route-level chrome (TopBar, back link, outer padding) was
// dropped — that now comes from the host route.
//
// WHERE IT ACTUALLY MOUNTS, because the old header named two doors that are
// gone. One caller: `_authenticated.runs.$missionId.tsx` renders it inside
// `<Block title="What happened, in order">` whenever a mission's `kind` is
// 'mission' (no 'builder' agent run — an orchestrator goal-run, not a Studio
// code-gen session). `/build/$missionId` and `/missions/$missionId` are both
// redirect-only route files pointing at `/runs/$missionId` now, and
// `MissionSlideOver` — whose "Open full view" link the old header credited —
// was deleted by the runs-board rewrite and survives only in comments.
//
// THE CONTROLS SPEAK MERIDIAN'S TIERS NOW, 2026-08-23. This paragraph used to
// say five controls here composed the retired palette's `.btn` family and that
// those five were "the last retired thing in this file". They are gone: the
// governance gate's approve wears Meridian's `Approve` (a click that unblocks a
// held tool call), its reject wears `Action variant="destructive"` (a click
// that stops something), the retry and replay wear `Action`, and the launch
// control -- which releases a mission held on a person -- wears `Approve` too.
// Every `.sp-btn` / `sp-title` class string and the `shell/primitives` import
// left with them, which takes this file off the ratchet ledger entirely.
//
// THE COLOUR LAYER IS MERIDIAN NOW, ported 2026-08-22. This paragraph used to
// say the rest of the file still ran on legacy tokens and that the port was a
// separate job. It is done: 71 occurrences of the retired vocabulary are gone
// and the file is the fifth largest debt carrier in the repo no longer.
//
// Mapped by MEANING rather than appearance, which is the naming law:
//   - the cancel control wears `--mrd-stop`, not `--mrd-fail`. Meridian reserves
//     fail for an outcome that HAPPENED and gives a control that halts work in
//     progress its own token, and this button's own title is "Stop this mission
//     so it will not advance further".
//   - the `live · refreshing` indicator is `--mrd-agent`: a machine is working.
//   - the step rail's timing bar is `--mrd-agent` while live and `--mrd-pass`
//     once settled, which is exactly what those two tokens mean.
//   - genuine failures -- the load error, a step's error note, the failed-mission
//     block -- are `--mrd-fail`.
//   - the trace link is `--mrd-ink`. Meridian has no link token on purpose:
//     colour carries status and never decorates, and a link is not a status.
//   - the `<pre>` holding tool output is `--mrd-sink`, the recess this system
//     reserves for evidence.
//
// Nothing was dropped to get there. The hop stays collapsible and keeps its
// timing bar, memory-context chip, input and output expanders and both handoff
// chips, because ratchet law 1 forbids hiding information as an answer. That is
// also why Meridian's `RunTimeline` was NOT swapped in for `TraceHop`: it is
// flatter, and the swap would have lost the handoffs and the step nesting.
//
// `RunTimeline` IS MOUNTED NOW, 2026-08-22, AND NOT WHERE THAT PARAGRAPH LOOKED.
// The ruling above is about the HOPS, and it stands: TraceHop keeps them. What
// this adds is a third reading of the PLAN, which is a different population and
// the only one on this page carrying real per-step instants.
//
//   `mission_steps` has `dispatched_at` and `completed_at` on every row.
//   `listMissionSteps` already selects both. `planRows` — the List view and the
//   Graph that shares its rows — throws both away and renders agent, goal,
//   status, note and deps. So this card has held a genuine time axis in memory
//   on every poll since it was written and has never been able to draw one.
//
// The question that costs a reader their morning is a question about a MOMENT:
// the crew dispatched Research at 03:12 and nothing moved until 03:40. A list
// cannot state that, because a list has no space between its rows. `RunTimeline`
// is exactly that space, and its silence rows here are REAL: the gap between one
// step completing and the next being dispatched is the orchestrator waiting, and
// it is measured off two recorded timestamps rather than interpolated.
//
// IT IS A THIRD SEGMENT, NEVER A REPLACEMENT, and the reason is ratchet law 1.
// A step at `planned` or `ready` has NO `dispatched_at`, because it has not
// happened; on today's missions that is most of them. A time axis that replaced
// the List would therefore silently drop every step that has not started, which
// is the exact "hiding information" the law forbids. So List stays the default
// and keeps all N rows, the axis says in words how many it is not showing, and
// the view switch — which already existed for Graph — means only one is on
// screen at a time and nothing is drawn twice.
//
// AND NOT ON THE BUILD PATH, for a reason worth writing down. The other half of
// `/runs/$missionId` renders a flat step ledger from `StudioRunDetail.steps`,
// and `LoopStep` (loop.server.ts:227) is a three-variant union with no timestamp
// on any variant. The instants exist in the record — `agent_run_checkpoints` is
// append-only, one row per loop iteration, with `created_at` — but
// `getStudioSession` reads only the LATEST checkpoint per run and takes the
// accumulated `state.steps` array off it, so the per-iteration instants never
// reach the client. Mounting the timeline there would mean interpolating a clock
// AND the silence durations, which is fabricated data on a product surface.
import { Link, useNavigate } from "@tanstack/react-router";
import { failureLine } from "@/lib/error-copy";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, type CSSProperties } from "react";
import {
  Activity,
  Bot,
  Check,
  ChevronDown,
  ChevronRight,
  Gavel,
  Ban,
  GitBranch,
  Layers,
  RotateCcw,
  ShieldAlert,
  X,
} from "lucide-react";
import { toast } from "@/lib/notify";
import { Action, Approve, Actions, ReadFailedLine } from "@/components/meridian/surface-parts";
import { MonoLabel, StepDot, StatusBadge, VerdictChip } from "@/components/supaprod/Primitives";
import { toolConsequence, REVERSIBILITY_LABEL } from "@/lib/tool-consequences";
import { MissionGraph, type MissionGraphStep } from "@/components/supaprod/MissionGraph";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { AgentRelay } from "@/components/agents/AgentRelay";
import { MissionDiff } from "@/components/missions/MissionDiff";
import { RunTimeline } from "@/components/meridian/RunTimeline";
import { missionStepEvents, type MissionStepRow } from "@/components/missions/mission-timeline";
import { MODELS } from "@/lib/ai/models";
import {
  getMission,
  cancelMission,
  promoteMission,
  type MissionDetail,
} from "@/lib/missions.functions";
import {
  listMissionSteps,
  advanceMission,
  startOrchestratedMission,
} from "@/lib/orchestrator.functions";
import { decideApproval } from "@/lib/agent_loop.functions";
import { createDecision } from "@/lib/decisions.functions";
import { LOOM_CARD, SkeletonBlock } from "@/components/studio/studio-ui";
import { stripAutoPrefix } from "@/components/plan/format";
import { traceRef } from "@/components/discover/format";
import { StageTimeline } from "@/components/shared/StageTimeline";
import { useConfirm } from "@/hooks/use-confirm";
import { supabase } from "@/integrations/supabase/client";

type Hop = MissionDetail["hops"][number];
type Handoff = MissionDetail["messages"][number];

/* THE RING IS INHERITED, NOT DECLARED. Every root this file returns carries
   `data-mrd=""`, so each pressable inside it takes Meridian's unlayered
   `[data-mrd][data-mrd] :focus-visible` ring outright; a focus-visible utility
   declared here would lose the cascade to `[data-obsidian] :focus-visible` and
   paint nothing, which is the exact defect that kept this file on the
   focus-ring guard's exemption register. See that test's header for the
   mechanism. */
/* Hover for the quiet outline pills: background in the class (never inline)
   so the hover can actually resolve; Tailwind preflight already gives
   buttons a transparent base. */
const HOVER_BG = "transition-colors hover:[background:var(--mrd-lift-hover)]";
/* Hover for borderless mono-text controls: base + hover color both in the
   class so the pair wins together. */
const HOVER_TEXT = "transition-colors [color:var(--mrd-mute)] hover:[color:var(--mrd-ink)]";

/** Production step statuses → the reference's StepDot vocabulary. */
function stepDotStatus(s?: string): string {
  if (s === "dispatched" || s === "running") return "running";
  if (s === "done" || s === "completed") return "completed";
  if (s === "failed" || s === "halted") return "failed";
  if (s === "awaiting_review" || s === "gate") return "gate";
  return "planned"; // queued, skipped, planned
}

/** Production hop/mission statuses → the reference's StatusBadge vocabulary. */
function badgeStatus(s?: string): string {
  if (s === "dispatched") return "running";
  if (s === "done") return "completed";
  if (s === "skipped") return "planned";
  if (s === "halted") return "failed";
  return s ?? "planned";
}

/** Production statuses → the graph's reference vocabulary. */
function graphStatus(s?: string): string {
  if (s === "dispatched" || s === "running") return "running";
  if (s === "done" || s === "completed") return "completed";
  if (s === "failed" || s === "halted") return "failed";
  if (s === "awaiting_review" || s === "gate") return "gate";
  return "planned";
}

function fmtDuration(ms: number): string {
  if (ms < 0 || !Number.isFinite(ms)) return "-";
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const m = Math.floor(ms / 60_000);
  const s = Math.round((ms % 60_000) / 1000);
  return `${m}m ${s}s`;
}

function hopElapsedMs(h: {
  created_at: string;
  status: string;
  last_checkpoint_at: string | null;
}): number {
  const start = new Date(h.created_at).getTime();
  const isLive = h.status === "running" || h.status === "queued";
  const end = isLive ? Date.now() : new Date(h.last_checkpoint_at ?? h.created_at).getTime();
  return Math.max(0, end - start);
}

/** Hero stat: "Today HH:MM" or "Mon D HH:MM". */
function fmtStarted(iso: string): string {
  const d = new Date(iso);
  const hm = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return d.toDateString() === new Date().toDateString()
    ? `Today ${hm}`
    : `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${hm}`;
}

/** k-format token counts ≥ 1000 with 1 decimal. */
function kFmt(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`;
}

/* Capture-as-decision — production retainer, restyled as a quiet mono ghost
   pill (consequence-first label per the voice rules). */
function CaptureMissionDecision({
  missionId,
  title,
  goal,
}: {
  missionId: string;
  title: string;
  goal: string;
}) {
  const fCreate = useServerFn(createDecision);
  const cap = useMutation({
    mutationFn: () =>
      fCreate({
        data: {
          title: `Mission decision: ${title.slice(0, 220)}`,
          rationale: goal.slice(0, 2000),
          status: "approved",
          mission_id: missionId,
        },
      }),
    onSuccess: () => toast.success("Captured to Decisions"),
    onError: (e: Error) => toast.error(failureLine("Nothing was captured to Decisions.", e)),
  });
  return (
    /* TIER: `Action`, default face. The test from answers/M10: clicking this
       DOES something to the work (it files a decision row) and unblocks
       nothing, so it is an Action and never an Approve. Default rather than
       quiet because capture-as-decision is this surface's one persistent
       ask of the reader, and a ghost pill was exactly the undifferentiated
       control the founder flagged. */
    <Action
      variant="default"
      onClick={() => cap.mutate()}
      busy={cap.isPending}
    >
      <Gavel size={14} strokeWidth={1.5} />
      {cap.isPending ? "Capturing…" : "Capture · files this as a decision"}
    </Action>
  );
}

/* Inline governance gate — same contract as screen 3 (chat InlineApprovalsPanel):
   a "person required" panel in Meridian's `you` hue, consequence-first
   approve/reject. Renders nothing while no approval is pending; polls so a
   landing gate appears without a reload. */
function GatePanel({
  traceId,
  agentName,
  onResolved,
}: {
  traceId: string;
  agentName?: string | null;
  onResolved: () => void;
}) {
  const fDecide = useServerFn(decideApproval);

  const { data: pendingApprovals, refetch } = useQuery({
    queryKey: ["mission-approvals", traceId],
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_approvals")
        .select("id,tool_name,args,rationale")
        .eq("trace_id", traceId)
        .eq("status", "pending");
      return data ?? [];
    },
    refetchInterval: 2500,
  });

  const decide = useMutation({
    mutationFn: (args: { id: string; decision: "approve" | "reject" }) =>
      fDecide({ data: { approvalId: args.id, decision: args.decision } }),
    onSuccess: (r, vars) => {
      toast.success(
        vars.decision === "approve"
          ? r.executed
            ? "Approved. The tool ran and the mission resumed."
            : "Approved. The mission resumes."
          : "Rejected. Nothing ran.",
      );
      refetch();
      onResolved();
    },
    onError: (err: Error) => toast.error(failureLine("The call is still waiting on you.", err)),
  });

  if (!pendingApprovals || pendingApprovals.length === 0) return null;

  return (
    <section style={{ marginBottom: "var(--mrd-s5)" }}>
      {/* THE GATE WEARS THE SYSTEM'S "A PERSON IS REQUIRED" HUE, not ember.
          Meridian assigns `--mrd-you` to exactly this fact (ApprovalCard's
          waiting marker, `Approve`'s face), and this panel states the same
          fact. Ember stays on the brand mark and nowhere near an interaction
          state; the wash and edge here are color-mixes of `you`, the same
          construction FineTuneCard uses for its accent ground. */}
      <div
        className="fade-up"
        style={{
          padding: "var(--mrd-s5)",
          borderRadius: 10,
          background: "color-mix(in oklab, var(--mrd-you) 9%, transparent)",
          border: "1px solid color-mix(in oklab, var(--mrd-you) 35%, transparent)",
        }}
      >
        <div
          className="mono-label"
          style={{
            color: "var(--mrd-you)",
            display: "flex",
            alignItems: "center",
            gap: "var(--mrd-s3)",
            fontWeight: 700,
          }}
        >
          <ShieldAlert size={16} /> Action required · governance gate
        </div>
        {pendingApprovals.map((appr) => (
          <div key={appr.id}>
            <p
              style={{
                color: "var(--mrd-ink)",
                margin: "var(--mrd-s3) 0 var(--mrd-s4)",
                lineHeight: "var(--mrd-lh-snug)",
              }}
            >
              {agentName ?? "The agent"} wants{" "}
              <span
                className="mono-label"
                style={{
                  color: "var(--mrd-ink)",
                  display: "inline-flex",
                }}
              >
                {appr.tool_name}
              </span>
              {appr.rationale ? `. ${appr.rationale}` : "."}
            </p>
            {/* TIER SPLIT ON ONE DECISION, and it is the file's most important
                one. BOTH clicks release the held run -- that is what a gate is,
                so neither can be louder than its twin into a nudge. But they do
                opposite things to the tool call, and each gets the face Meridian
                built for its half: `Approve` because approving UNBLOCKS work
                that is held (and Approve is the only component allowed to spend
                the orchid that means a person was required); `Action
                variant="destructive"` because rejecting STOPS the pending tool
                call, and destructive is the tier for stopping things.
                NEITHER IS A PRIMARY FILL, on purpose: the host route renders
                its own `<Gate>` for these same approvals and hands the pending
                one a primary there, so this panel re-querying the same table by
                trace_id would draw two primaries on one screen. The faces plus
                the consequence-first labels carry the distinction instead --
                which is also the greyscale-safe axis.
                `Actions` lays the pair out because it is the container that
                exists for a row of controls; no bespoke gap value. */}
            <Actions>
              <Approve busy={decide.isPending} onClick={() => decide.mutate({ id: appr.id, decision: "approve" })}>
                <Check size={14} />
                Approve · runs the tool
              </Approve>
              <Action
                variant="destructive"
                busy={decide.isPending}
                onClick={() => decide.mutate({ id: appr.id, decision: "reject" })}
              >
                <X size={14} />
                Reject · nothing runs
              </Action>
            </Actions>
          </div>
        ))}
      </div>
    </section>
  );
}

/* TraceHop — collapsible hop with timing bar and tinted step lines, ported
   from the reference. Production retainers ride the same left rail: hop
   metadata + trace link, memory-context chip, input/output expanders, and
   inbound/outbound handoff chips (neutral - Tempo v5 §2 narrows glacier/
   cornflower to literal status chips and links, and a hop handoff is
   structural metadata, not a live-status signal). */
const rail: CSSProperties = {
  // 22px aligns the rail's text with the chevron-plus-label column above;
  // it is geometry, not rhythm, so it stays a literal.
  paddingLeft: 22,
  borderLeft: "1px solid var(--mrd-edge)",
  marginLeft: 5,
};
const preStyle: CSSProperties = {
  marginTop: "var(--mrd-s3)",
  background: "var(--mrd-sink)",
  border: "1px solid var(--mrd-edge)",
  borderRadius: 8,
  padding: "var(--mrd-s4)",
  lineHeight: "var(--mrd-lh-mono)",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  maxHeight: 200,
  overflowY: "auto",
  color: "var(--mrd-mute)",
};
const handoffChip: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  // gap-mrd-inline's step: a mark and the word it belongs to.
  gap: "var(--mrd-s3)",
  color: "var(--mrd-mute)",
  border: "1px solid var(--mrd-edge)",
  background: "var(--mrd-lift)",
  borderRadius: 99,
  padding: "var(--mrd-s1) var(--mrd-s3)",
};
/* The pressable variant of the chip: color + background move into the class
   (CHIP_BTN) so hover states can resolve — inline always beats a stylesheet
   hover (state audit 2026-07-12). */
const handoffChipBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--mrd-s3)",
  border: "1px solid var(--mrd-edge)",
  borderRadius: 99,
  padding: "var(--mrd-s1) var(--mrd-s3)",
};
const CHIP_BTN =
  "[background:var(--mrd-lift)] [color:var(--mrd-mute)] transition-colors hover:[background:var(--mrd-lift-hover)] hover:[color:var(--mrd-ink)]";

function TraceHop({
  h,
  defaultOpen,
  pct,
  inbound,
  outbound,
}: {
  h: Hop;
  defaultOpen?: boolean;
  pct: number;
  inbound?: Handoff;
  outbound?: Handoff;
}) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [showMemories, setShowMemories] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [showPayload, setShowPayload] = useState(false);
  const live = h.status === "running" || h.status === "queued" || h.status === "dispatched";
  // Accent restraint (2026-07-11): identifiers stay in ink, purple is retired
  // from AI treatments; only outcome colors carry hue on the rail.
  const tint = (st: Hop["steps"][number]): CSSProperties => {
    if (st.kind === "tool_call") return { color: "var(--mrd-ink)" };
    if (st.kind === "thought") return { color: "var(--mrd-mute)", fontStyle: "italic" };
    return { color: "var(--mrd-pass)" };
  };
  return (
    <div style={{ fontFamily: "var(--mrd-mono)", marginBottom: "var(--mrd-s4)" }}>
      {inbound ? (
        <div style={{ marginBottom: "var(--mrd-s2)" }}>
          <button
            onClick={() => setShowPayload(!showPayload)}
            aria-expanded={showPayload}
            className={`mono-label loom-press ${CHIP_BTN}`}
            style={handoffChipBtn}
          >
            {showPayload ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            {inbound.from_agent_slug
              ? agentDisplayName(inbound.from_agent_slug)
              : "operator"} → {agentDisplayName(inbound.to_agent_slug)} · payload
          </button>
          {showPayload ? (
            <pre className="fade-up scrollbar-thin" style={preStyle}>
              {JSON.stringify(inbound.payload, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={`loom-press ${HOVER_BG}`}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "var(--geist-space-2x)",
          width: "100%",
          textAlign: "left",
          // x-padding stays 0 so the chevron keeps the rail's left alignment.
          padding: "var(--mrd-s2) 0",
          borderRadius: 6,
        }}
      >
        {open ? (
          <ChevronDown size={16} style={{ color: "var(--mrd-faint)" }} />
        ) : (
          <ChevronRight size={16} style={{ color: "var(--mrd-faint)" }} />
        )}
        <span style={{ color: "var(--mrd-ink)", fontWeight: 600 }}>
          {agentDisplayName(h.agent_slug, h.agent_name)}
        </span>
        {/* THE ROW HAS TO REACH ITS RIGHT EDGE. The bar used to be `flex: 1`
            with `maxWidth: 160`, which made it the only growable item in a
            100%-wide button and then froze it at 160px, so every hop row inside
            this 980px card ended with roughly 450px of free space redistributed
            to nobody. Two things came off that: the status badge never touched a
            right edge, and its x position slid row to row with the length of the
            agent name above it, so the badges read as a ragged column rather
            than a scannable one. A fixed width plus an auto left margin on the
            duration puts the growth into the GAP instead of into the bar, which
            is the same thing `justifyContent: "space-between"` does for the
            section headers in this file. Fixed 2026-08-11. */}
        <span
          style={{
            width: 160,
            flexShrink: 1,
            height: 3,
            borderRadius: 99,
            background: "var(--mrd-lift)",
            overflow: "hidden",
          }}
        >
          <span
            style={{
              display: "block",
              height: "100%",
              width: `${pct}%`,
              background: live ? "var(--mrd-agent)" : "var(--mrd-pass)",
            }}
          ></span>
        </span>
        <span className="mono-label tabular-nums" style={{ marginLeft: "auto" }}>
          {fmtDuration(hopElapsedMs(h))}
        </span>
        <StatusBadge status={badgeStatus(h.status)} />
      </button>
      {open ? (
        <div className="fade-up">
          {/* Production: hop metadata + per-hop trace link, quiet on the rail. */}
          <div
            className="mono-label"
            style={{
              ...rail,
              lineHeight: "var(--mrd-lh-mono)",
              display: "flex",
              alignItems: "center",
              gap: "var(--geist-space-2x)",
            }}
          >
            <span>
              step {h.step_index} · {new Date(h.created_at).toLocaleString()}
            </span>
            {h.trace_id ? (
              <Link
                to="/traces/$traceId"
                params={{ traceId: h.trace_id }}
                style={{ color: "var(--mrd-ink)" }}
              >
                trace
              </Link>
            ) : null}
          </div>
          {/* Production: recalled-memory context chip. */}
          {h.recalled_memories.length > 0 ? (
            <div style={{ ...rail, paddingTop: "var(--mrd-s2)", paddingBottom: "var(--mrd-s2)" }}>
              <button
                onClick={() => setShowMemories(!showMemories)}
                aria-expanded={showMemories}
                className={`mono-label loom-press ${HOVER_TEXT} ${HOVER_BG}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--mrd-s3)",
                  border: "1px solid var(--mrd-edge)",
                  borderRadius: 99,
                  padding: "var(--mrd-s1) var(--mrd-s3)",
                }}
              >
                {showMemories ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                what guided it · {h.recalled_memories.length}
              </button>
              {showMemories ? (
                <div className="fade-up" style={{ marginTop: "var(--mrd-s2)" }}>
                  {h.recalled_memories.map((mem, mi) => (
                    <div
                      key={mi}
                      style={{
                        color: "var(--mrd-mute)",
                        lineHeight: "var(--mrd-lh-mono)",
                      }}
                    >
                      · {mem}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {h.steps.length === 0 ? (
            <div
              style={{ ...rail, lineHeight: "var(--mrd-lh-mono)", color: "var(--mrd-mute)", fontStyle: "italic" }}
            >
              {live ? "waiting for the first checkpoint" : "no recorded steps"}
            </div>
          ) : (
            h.steps.map((st, j) => (
              <div key={j} style={{ ...rail, lineHeight: "var(--mrd-lh-mono)", ...tint(st) }}>
                {st.kind === "tool_call"
                  ? `called ${st.name}${st.status !== "executed" ? ` · ${st.status}` : ""}`
                  : st.kind === "thought"
                    ? `thought · ${st.text}`
                    : `reply · ${st.message}`}
              </div>
            ))
          )}
          {/* Production: raw input/output expanders — mono pre on canvas. */}
          <div
            style={{
              ...rail,
              paddingTop: "var(--mrd-s2)",
              display: "flex",
              gap: "var(--geist-space-3x)",
              alignItems: "center",
            }}
          >
            <button
              onClick={() => setShowInput(!showInput)}
              aria-expanded={showInput}
              className={`mono-label loom-press ${HOVER_TEXT}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "var(--mrd-s3)",
              }}
            >
              {showInput ? <ChevronDown size={14} /> : <ChevronRight size={14} />} input
            </button>
            {h.output ? (
              <button
                onClick={() => setShowOutput(!showOutput)}
                aria-expanded={showOutput}
                className={`mono-label loom-press ${HOVER_TEXT}`}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--mrd-s3)",
                }}
              >
                {showOutput ? <ChevronDown size={14} /> : <ChevronRight size={14} />} output
              </button>
            ) : null}
          </div>
          {showInput ? (
            <pre className="fade-up scrollbar-thin" style={{ ...preStyle, marginLeft: 27 }}>
              {h.input}
            </pre>
          ) : null}
          {showOutput && h.output ? (
            <pre className="fade-up scrollbar-thin" style={{ ...preStyle, marginLeft: 27 }}>
              {h.output}
            </pre>
          ) : null}
        </div>
      ) : null}
      {outbound ? (
        <div style={{ marginTop: "var(--mrd-s2)" }}>
          <span className="mono-label" style={handoffChip}>
            handoff → {agentDisplayName(outbound.to_agent_slug)}
            {outbound.consumed_by_run_id ? "" : " · queued, awaiting receiver"}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/* N3 · Mission Compounding View — the moat made visible per mission. Aggregates
   every prior memory this mission drew on (per-hop recalls + the memory_refs
   threaded through handoffs), deduped by summary, with which agents cited each.
   A fresh mission honestly shows zero; the count grows as the loop compounds.
   "Copy snapshot" exports the lineage as markdown (the N3 export-snapshot). */
function MissionCompounding({ data }: { data: MissionDetail }) {
  // Dedup the same memory whether it arrives as a full per-hop recall or a
  // truncated handoff summary: key on a normalized prefix (the same memory
  // truncated to different lengths collapses) and keep the fuller text.
  const byKey = new Map<string, { summary: string; agents: Set<string> }>();
  const add = (raw: string, agent: string | null) => {
    const summary = (raw ?? "").trim();
    if (!summary) return;
    const key = summary.toLowerCase().slice(0, 80);
    const e = byKey.get(key) ?? { summary, agents: new Set<string>() };
    if (summary.length > e.summary.length) e.summary = summary;
    if (agent) e.agents.add(agent);
    byKey.set(key, e);
  };
  for (const h of data.hops) {
    for (const mem of h.recalled_memories) add(mem, h.agent_name);
  }
  for (const msg of data.messages) {
    const refs = (msg.payload as { memory_refs?: { id: string; summary?: string }[] } | null)
      ?.memory_refs;
    if (!Array.isArray(refs)) continue;
    for (const r of refs) {
      add(
        (r.summary ?? "").trim() || r.id,
        msg.to_agent_slug ? agentDisplayName(msg.to_agent_slug) : null,
      );
    }
  }
  const memories = [...byKey.values()];
  const n = memories.length;
  const shown = memories.slice(0, 10);
  const moreCount = n - shown.length;

  const copySnapshot = () => {
    const lines = [
      `# ${stripAutoPrefix(data.mission.title)}: compounding snapshot`,
      "",
      n === 0
        ? "This mission started fresh. Nothing earlier has guided it yet."
        : `Drew on ${n} earlier ${n === 1 ? "lesson" : "lessons"}:`,
      ...memories.map(
        (mem) =>
          `- ${mem.summary}${mem.agents.size ? ` (cited by ${[...mem.agents].join(", ")})` : ""}`,
      ),
    ];
    void navigator.clipboard
      .writeText(lines.join("\n"))
      .then(() => toast.success("Compounding snapshot copied"))
      .catch(() => toast.error("Could not copy"));
  };

  return (
    <section style={{ ...LOOM_CARD, padding: "var(--card-pad)", marginBottom: "var(--mrd-s5)" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "var(--mrd-s4)",
        }}
      >
        <MonoLabel icon={Layers}>Compounding · the moat at work</MonoLabel>
        {n > 0 && (
          <button onClick={copySnapshot} className={`mono-label loom-press ${HOVER_TEXT}`}>
            Copy snapshot
          </button>
        )}
      </div>
      {n === 0 ? (
        <p style={{ color: "var(--mrd-ink)", lineHeight: "var(--mrd-lh-snug)" }}>
          This mission started fresh. As the loop runs it draws on what it has already learned, and
          that compounds here. The next mission on this product will not start cold.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", alignItems: "baseline", gap: "var(--mrd-s4)", marginBottom: "var(--mrd-s4)" }}>
            {/* THIS WAS `font-pixel`, AND PIXEL IS RETIRED FROM THE APP.
                Founder ruling 2026-08-05, recorded in
                docs/design/DESIGN-SYSTEM.md under "The founder's live rulings":
                Geist Pixel stays on the public marketing heroes and leaves
                every authenticated station, because the app "is an instrument
                someone works in all day. Pixel is costume there." This is an
                authenticated station, reached at /runs/$missionId.
                THE BRAND MOMENT IS NOT REMOVED, IT IS PROMOTED. The Pixel span
                set no font-size at all, so the numeral rendered at the 13px
                body size that styles.css gives `body` — the costume was the
                only thing making it read as a stat. It now says the same thing
                in the working typeface and louder: Geist at 600 weight, still
                baseline-aligned with the sentence beside it, still the one
                numeral on this surface that IS the moat made visible.
                SNAPPED ONTO THE LADDER, 2026-08-23: it typed a literal 22px,
                which is not a step; per answers/M04 the nearer step wins and
                h3 (20px) beats h2 (25px) by two pixels to three. */}
            <span
              className="tabular-nums"
              style={{
                fontFamily: "var(--mrd-font)",
                fontSize: "var(--mrd-t-h3)",
                fontWeight: 600,
                letterSpacing: "-0.02em",
                lineHeight: 1,
                color: "var(--mrd-ink)",
              }}
            >
              {n}
            </span>
            <span style={{ color: "var(--mrd-ink)", lineHeight: "var(--mrd-lh-snug)" }}>
              earlier {n === 1 ? "lesson" : "lessons"} guided this mission, instead of starting cold
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--mrd-s3)" }}>
            {shown.map((mem, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: "var(--mrd-s4)",
                  paddingTop: i === 0 ? 0 : "var(--mrd-s3)",
                  borderTop: i === 0 ? "none" : "1px solid var(--mrd-edge)",
                }}
              >
                <span style={{ color: "var(--mrd-ink)", flex: 1, lineHeight: "var(--mrd-lh-snug)" }}>
                  {mem.summary}
                </span>
                {mem.agents.size > 0 && (
                  <span
                    className="mono-label"
                    style={{ color: "var(--mrd-mute)", flexShrink: 0, whiteSpace: "nowrap" }}
                  >
                    {[...mem.agents].join(" · ")}
                  </span>
                )}
              </div>
            ))}
            {moreCount > 0 && (
              <span className="mono-label" style={{ color: "var(--mrd-mute)", marginTop: "var(--mrd-s2)" }}>
                +{moreCount} more in the snapshot
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export function MissionOrchestratorDetail({ missionId }: { missionId: string }) {
  const navigate = useNavigate();
  const fGet = useServerFn(getMission);
  const fSteps = useServerFn(listMissionSteps);
  const fAdvance = useServerFn(advanceMission);
  const fStart = useServerFn(startOrchestratedMission);
  const fCancel = useServerFn(cancelMission);
  const fPromote = useServerFn(promoteMission);
  const confirm = useConfirm();
  const qc = useQueryClient();
  const m = useQuery({
    queryKey: ["mission", missionId],
    queryFn: () => fGet({ data: { missionId } }),
    refetchInterval: (q) => {
      const st = q.state.data?.mission.status;
      return st === "running" || st === "queued" ? 2000 : false;
    },
  });
  const steps = useQuery({
    queryKey: ["mission-steps", missionId],
    queryFn: () => fSteps({ data: { missionId } }),
    refetchInterval: (q) => {
      const rows = q.state.data?.steps ?? [];
      const live = rows.some(
        (r) => r.status === "dispatched" || r.status === "running" || r.status === "planned",
      );
      return live ? 2500 : false;
    },
  });
  const advance = useMutation({
    mutationFn: () => fAdvance({ data: { missionId } }),
    onSuccess: () => {
      toast.success("Chief of Staff advanced. Dispatching newly-ready steps.");
      qc.invalidateQueries({ queryKey: ["mission", missionId] });
      qc.invalidateQueries({ queryKey: ["mission-steps", missionId] });
    },
    onError: (e: Error) => toast.error(failureLine("The mission is where it was.", e)),
  });
  const cancel = useMutation({
    mutationFn: () => fCancel({ data: { missionId } }),
    onSuccess: (r) => {
      if (r.alreadyTerminal) {
        toast.success("This mission had already finished.");
      } else {
        toast.success(
          r.approvalsCancelled
            ? `Mission cancelled · ${r.approvalsCancelled} pending approval${r.approvalsCancelled === 1 ? "" : "s"} cleared.`
            : "Mission cancelled · the loop will not advance it further.",
        );
      }
      qc.invalidateQueries({ queryKey: ["mission", missionId] });
      qc.invalidateQueries({ queryKey: ["mission-steps", missionId] });
      qc.invalidateQueries({ queryKey: ["studio-sessions"] });
    },
    onError: (e: Error) => toast.error(failureLine("The mission is still running.", e)),
  });
  /* OBS-10: the trigger-tick's own HITL gate — a mission an ambient trigger
   * proposed, or one left stranded at 'queued', that nobody has launched yet.
   *
   * THE COPY SAYS "launched" BECAUSE THE MUTATION NO LONGER QUEUES ANYTHING.
   * promoteMission used to write status='queued' and return; it now flips the
   * mission to 'running' and awaits a full orchestrator loop, so by the time
   * this resolves the mission is running and already planned. Waiting for an
   * agent to "pick it up" is what the old copy promised and what never happened:
   * nothing consumed 'queued'. The awaited loop is also why this can take a
   * while — the button's own disabled/"Launching…" state is the pending signal,
   * the same one the Start button uses. */
  const promote = useMutation({
    mutationFn: () => fPromote({ data: { missionId } }),
    onSuccess: () => {
      toast.success("Mission launched · the orchestrator is planning it now.");
      qc.invalidateQueries({ queryKey: ["mission", missionId] });
      // The plan exists as of this moment, so the step list is stale.
      qc.invalidateQueries({ queryKey: ["mission-steps", missionId] });
      qc.invalidateQueries({ queryKey: ["studio-sessions"] });
    },
    onError: (e: Error) => toast.error(failureLine("The mission has not launched.", e)),
  });
  // D4-REPLAY: re-run this mission's goal as a new mission, optionally with a
  // different model (the server already accepts model), and record the branch
  // link so the new mission shows "Replayed from" this one.
  const [replayModel, setReplayModel] = useState<string>("");
  // D4b: collapsed side-by-side checkpoint-diff vs the original (replay missions only).
  const [showDiff, setShowDiff] = useState(false);
  const replay = useMutation({
    mutationFn: () => {
      const mission = m.data?.mission;
      if (!mission) throw new Error("Mission not loaded");
      return fStart({
        data: {
          goal: mission.goal,
          title: mission.title,
          model: replayModel || undefined,
          replayedFrom: missionId,
        },
      });
    },
    onSuccess: (r) => {
      toast.success("Replay started · a new mission carries the same goal.");
      navigate({ to: "/build/$missionId", params: { missionId: r.mission_id } });
    },
    onError: (e: Error) => toast.error(failureLine("No replay was started.", e)),
  });

  const [view, setView] = useState<"plan" | "when" | "graph">("plan");

  const data = m.data;
  const stepRows = steps.data?.steps ?? [];
  const hops = data?.hops ?? [];
  const hasPending = stepRows.some(
    (r) => r.status === "planned" || r.status === "dispatched" || r.status === "running",
  );
  /* 'queued' is deliberately NOT counted as running any more, and that is a
   * correction rather than a preference: a mission at 'queued' is stopped. No
   * sweeper advanced it, no run existed for it, and the two labels this drives —
   * "live · refreshing every 2s" and the trace's " · live" — told the reader an
   * agent was working when nothing was. The page keeps polling on 'queued' (see
   * refetchInterval above) precisely because it is NOT live: the resume-runs
   * adoption pass moves it to 'running' within about a minute, and the poll is
   * how the screen finds out. */
  const missionRunning = data?.mission.status === "running";
  const canAdvance = hasPending && data?.mission.status === "running";
  const missionFailed = data?.mission.status === "failed" || data?.mission.status === "halted";
  // OBS-10: a proposed mission has no runs yet and needs launching, not cancelling.
  const missionProposed = data?.mission.status === "proposed";
  /* The stranded state, and the reason this page grew a second door into Launch.
   * 'queued' is a status nothing consumes: both writers of it (the trigger-tick
   * auto-promote and the old promoteMission) have been changed to launch into
   * 'running', and resume-runs adopts any leftover row — but until that sweep
   * lands, a mission sitting here showed Cancel and nothing else. Cancel was the
   * only way forward out of a state that had simply never started. */
  const missionQueued = data?.mission.status === "queued";
  const missionLaunchable = missionProposed || missionQueued;
  // D4: a mission can be cancelled while it is still active (not yet terminal).
  const missionActive =
    !!data &&
    !missionProposed &&
    !["completed", "done", "failed", "halted", "cancelled"].includes(data.mission.status);
  const failedStep = stepRows.find((r) => r.status === "failed");
  const liveHop = hops.find((h) => ["running", "queued", "awaiting_review"].includes(h.status));

  // RPT-24 (captain on every dispatch): the receipt's ownership line. Dispatcher
  // and owner are the same person unless a reactor tick auto-promoted the
  // mission — accountability stays with the owning human either way, never the
  // agent.
  const captain = data?.mission.captain ?? null;
  const captainOwnerName = captain
    ? captain.owner_is_self
      ? "you"
      : (captain.owner_display_name ?? captain.owner_email ?? "a teammate")
    : null;
  const captainLabel = captain
    ? captain.auto_dispatched
      ? `auto · owner ${captainOwnerName}`
      : captainOwnerName
    : "unknown";
  const captainTitle = captain
    ? captain.auto_dispatched
      ? "A reactor tick auto-dispatched this mission; the owner below is still accountable for the outcome"
      : `Dispatched and owned by ${captainOwnerName}`
    : "Ownership could not be resolved";

  // Plan rows: mission_steps when orchestrated; fall back to the hops.
  const planRows =
    stepRows.length > 0
      ? stepRows.map((s) => ({
          agent: agentDisplayName(s.agent_slug as string),
          goal: s.sub_goal as string,
          status: s.status as string,
          note: (s.error as string | null) ?? null,
          deps: (s.depends_on as number[] | null) ?? [],
        }))
      : hops.map((h) => ({
          agent: agentDisplayName(h.agent_slug),
          goal: h.input.length > 200 ? `${h.input.slice(0, 200)}…` : h.input,
          status: h.status,
          note: null,
          deps: [] as number[],
        }));
  const graphSteps: MissionGraphStep[] = planRows.map((r) => ({
    agent: r.agent,
    goal: r.goal,
    status: graphStatus(r.status),
    note: r.note,
  }));

  /*
   * THE SAME PLAN, AGAINST THE CLOCK. This file's header says why it is a third
   * segment rather than a replacement; `mission-timeline.ts` holds the mapping
   * and the rule that keeps every instant on it real, which is a pure function
   * with a test on it rather than a `map` nobody can call without a router.
   *
   * `stepRows` ONLY, never the hop fallback `planRows` uses: a hop's instants are
   * already drawn by TraceHop's timing bar further down this page, so a second
   * drawing of them is the duplication the last ruling on this page avoided. A
   * mission with no plan simply does not offer this view.
   */
  const timeline = useMemo(() => missionStepEvents(stepRows as MissionStepRow[]), [stepRows]);

  /* WHAT THE AXIS IS NOT SHOWING, counted rather than assumed. Said in words
     under the timeline, because a view that quietly renders 2 of 9 is the
     truncation defect this repo has already recorded twice. */
  const notDispatched = stepRows.length - timeline.length;

  /*
   * LIVE MODE ONLY WHILE THE MISSION IS. Passing `now` gives the timeline its
   * ticking tail and its TRAILING silence, and both are wanted on a mission that
   * is still open — "nothing has been reported for 40 minutes" is the finding.
   * On a settled mission the trailing silence would just be the age of the
   * record, restated every time anyone opens the page.
   */
  const axisNow = missionActive ? Date.now() : undefined;

  const maxElapsed = Math.max(1, ...hops.map((h) => hopElapsedMs(h)));

  // v6 Phase 2 (W2): the honest "what ran unattended" audit — side-effecting
  // tools the loop executed inline with no human gate (the agent's trust arc
  // had earned auto-mode). Newest first. Memoized to avoid recomputing on
  // every poll (2500-4000ms); the flatMap+filter+sort + Date.getTime() calls
  // are expensive to repeat.
  const unattended = useMemo(
    () =>
      hops
        .flatMap((h) =>
          h.tool_calls
            .filter((tc) => tc.is_unattended)
            .map((tc) => ({ ...tc, agent_slug: h.agent_slug })),
        )
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [hops],
  );

  // An error is not a loading state: the old guard fell through to the
  // skeleton forever when the query failed. Name the cause, offer retry.
  if (m.isError) {
    return (
      <div data-mrd="" style={{ maxWidth: 980, margin: "0 auto" }}>
        <div style={{ ...LOOM_CARD, padding: "var(--geist-gap)", maxWidth: 560 }}>
          <MonoLabel style={{ color: "var(--mrd-fail)" }}>Couldn't load this mission</MonoLabel>
          <p style={{ color: "var(--mrd-mute)", marginTop: "var(--mrd-s3)" }}>
            {(m.error as Error)?.message?.slice(0, 160)}
          </p>
          {/* TIER: `Action`, default face. Re-reading is not unblocking
              anything held, so it is never an Approve; and this branch replaces
              the whole body, so the retry is the only control on it and takes
              the raised default rather than a primary fill. It was `.btn
              btn-ghost btn-sm`, then `.sp-btn`; both retired layers are gone
              from here now. */}
          <Action variant="default" onClick={() => m.refetch()} className="mt-3">
            Retry · reloads the mission
          </Action>
        </div>
      </div>
    );
  }

  if (m.isLoading || !data) {
    // Skeleton that matches the loaded layout: hero, relay strip, two cards
    // (DESIGN-LOOM §9 — never a lone spinner for primary content).
    return (
      <div aria-hidden="true" style={{ maxWidth: 980, margin: "0 auto" }}>
        <SkeletonBlock height={140} style={{ marginBottom: "var(--mrd-s5)" }} />
        <SkeletonBlock height={56} style={{ marginBottom: "var(--mrd-s5)" }} />
        <SkeletonBlock height={120} style={{ marginBottom: "var(--mrd-s5)" }} />
        <SkeletonBlock height={220} />
      </div>
    );
  }

  return (
    <div data-mrd="" style={{ maxWidth: 980, margin: "0 auto" }}>
      <header
        style={{
          ...LOOM_CARD,
          background: "var(--surface-card-deep)",
          padding: "var(--mrd-s6) var(--mrd-s6)",
          marginBottom: "var(--mrd-s5)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: "var(--geist-space-4x)",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div>
            <MonoLabel style={{ color: "color-mix(in oklab, var(--mrd-ink) 60%, transparent)" }}>
              {/* The platform's own trace ref, the same six characters the
                Build page and every audit tag show, so a person can paste it
                into Ask or the lineage pane. Eight characters off the front of
                a uuid is a database key wearing a label. */}
              Mission · {traceRef(data.mission.id)}
            </MonoLabel>
            {/* THE TITLE IS COMPOSED FROM LADDER STOPS NOW, and it computes
                identically to the `.sp-title` class it replaces: 25px
                (`text-mrd-h2`), weight 600, ink, -0.028em tracking, 1.24
                leading, 34ch measure -- those were that class's own values,
                read off primitives.css before deleting its last use here. A
                page title is a heading, not a block role, so M08's roles do
                not apply; size, weight and colour are named explicitly.
                The margin stays inline: Tailwind's preflight zeroes heading
                margins, so dropping it would close the gap above the
                maker's-mark thread below.
                THE DUPLICATE TITLE IS STILL NOT FIXED, on purpose: the host
                route renders `<PageHead>` with this same string at the same
                25px directly above, and removing one of the two is an
                information-architecture call about /runs/$missionId (a route
                file this lane does not own), not a styling fix. Raised as a
                note in units/L0-001 for whichever lane owns that decision.
                */}
            <h1
              className="text-mrd-h2 font-semibold text-mrd-ink"
              style={{ margin: "var(--mrd-s3) 0 var(--mrd-s3)", letterSpacing: "-0.028em", lineHeight: "var(--mrd-lh-tight)", maxWidth: "34ch" }}
            >
              {stripAutoPrefix(data.mission.title)}
            </h1>
            {/* §6: the maker's mark — a static 24px thread under the title. */}
            <div
              aria-hidden="true"
              style={{
                width: 24,
                height: 1,
                background: "var(--thread-gradient)",
                opacity: 0.4,
                margin: "var(--mrd-s1) 0 var(--mrd-s3)",
              }}
            />
            <p
              style={{
                color: "color-mix(in oklab, var(--mrd-ink) 70%, transparent)",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {data.mission.goal}
            </p>
            {data.mission.replayed_from_mission_id ? (
              <Link
                to="/build/$missionId"
                params={{ missionId: data.mission.replayed_from_mission_id }}
                className="mono-label"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "var(--mrd-s2)",
                  marginTop: "var(--mrd-s3)",
                  color: "color-mix(in oklab, var(--mrd-ink) 65%, transparent)",
                }}
                title="Open the mission this one was replayed from"
              >
                <RotateCcw style={{ width: 10, height: 10 }} /> Replayed from an earlier mission
              </Link>
            ) : null}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--mrd-s4)" }}>
            <StatusBadge status={badgeStatus(data.mission.status)} />
            {/* Launch, for the two states that have not started: 'proposed' (a
             * trigger raised it and is waiting on a person) and 'queued' (it was
             * launched once into a status nothing consumed). Rendered ahead of
             * the Cancel/Replay chain rather than inside it, so a stranded
             * mission gains a forward door WITHOUT losing Cancel — it used to
             * show Cancel alone, which meant the only way out of "never started"
             * was to kill it. */}
            {missionLaunchable ? (
              /* TIER: `Approve`, and it is not a near-miss. A proposed or
                 stranded mission is work HELD on a person -- the trigger-tick's
                 own HITL gate, per the mutation comment above -- and this click
                 releases it. That is the Approve test exactly ("does clicking
                 UNBLOCK something held?"), and it is why the control now wears
                 the orchid that means a person is required instead of an
                 ember-tinted outline. It is also the ONE accent in the header,
                 and only in the states where attention is genuinely owed. */
              <Approve busy={promote.isPending} title={
                missionQueued
                  ? "This mission was enqueued but never started · launch it now"
                  : "A trigger proposed this goal · nothing runs until you launch it"
              } onClick={() => promote.mutate()}>
                <Check size={14} />
                {promote.isPending
                  ? "Launching…"
                  : missionQueued
                    ? "Never started · launch it"
                    : "Review & launch"}
              </Approve>
            ) : null}
            {missionActive ? (
              /* TIER: `Action variant="destructive"`. Cancelling STOPS a live
                 mission; the confirm() below is what protects it, and the
                 destructive face is deliberately the quietest tier because
                 distance plus confirm -- never volume -- is what guards a
                 destructive act. The old inline stop-wash hand-rolled the same
                 construction with unmeasured percentages. */
              <Action
                variant="destructive"
                busy={cancel.isPending}
                title="Stop this mission so it will not advance further"
                onClick={async () => {
                  const ok = await confirm({
                    title: "Cancel this mission?",
                    body: "Stops the mission now: it will not advance further, in-flight steps and runs stop, any held build file locks release, and pending approvals clear. Work already done is kept. This can't be undone, so start a fresh mission to run the goal again.",
                    destructive: true,
                    confirmLabel: "Cancel mission",
                  });
                  if (ok) cancel.mutate();
                }}
              >
                <Ban size={14} />
                {cancel.isPending ? "Cancelling…" : "Cancel mission"}
              </Action>
            ) : !missionLaunchable && !missionFailed ? (
              // D4-REPLAY: re-run a finished mission with a chosen model.
              // (Failed/halted missions keep the contextual retry below.)
              // The !missionLaunchable guard keeps this branch reaching exactly
              // the missions it always did: splitting Launch out of this chain
              // means a 'proposed' mission now falls through to here, and it must
              // not be offered a replay of work that has not run once.
              <div style={{ display: "flex", alignItems: "center", gap: "var(--mrd-s3)" }}>
                <select
                  aria-label="Replay model"
                  value={replayModel}
                  onChange={(e) => setReplayModel(e.target.value)}
                  className="mono-label"
                  style={{
                    padding: "3px var(--mrd-s3)",
                    borderRadius: 5,
                    border: "1px solid color-mix(in oklab, var(--mrd-ink) 35%, transparent)",
                    background: "transparent",
                    color: "var(--mrd-ink)",
                    maxWidth: 160,
                  }}
                >
                  <option value="">Default model</option>
                  {MODELS.map((mo) => (
                    <option key={mo.id} value={mo.id}>
                      {mo.label}
                    </option>
                  ))}
                </select>
                {/* TIER: `Action`, default face. Replaying starts new work; it
                    releases nothing held. */}
                <Action
                  variant="default"
                  busy={replay.isPending}
                  title="Re-run this goal as a new mission, optionally with a different model"
                  onClick={() => replay.mutate()}
                >
                  <RotateCcw size={14} />
                  {replay.isPending ? "Replaying…" : "Replay"}
                </Action>
              </div>
            ) : null}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            gap: "var(--mrd-s6)",
            marginTop: "var(--mrd-s5)",
            position: "relative",
            zIndex: 1,
            flexWrap: "wrap",
          }}
        >
          {(
            [
              ["started", fmtStarted(data.mission.created_at)],
              ["cost", `$${data.usage.cost_usd.toFixed(2)}`],
              ["tokens", `${kFmt(data.usage.tokens_in)} in / ${kFmt(data.usage.tokens_out)} out`],
            ] as [string, string][]
          ).map(([l, v]) => (
            <span
              key={l}
              className="mono-label"
              style={{ color: "color-mix(in oklab, var(--mrd-ink) 55%, transparent)" }}
            >
              {l}{" "}
              <strong className="tabular-nums" style={{ color: "var(--mrd-ink)", fontWeight: 600 }}>
                {v}
              </strong>
            </span>
          ))}
          <span
            className="mono-label"
            style={{ color: "color-mix(in oklab, var(--mrd-ink) 55%, transparent)" }}
            title={captainTitle}
          >
            captain{" "}
            <strong className="tabular-nums" style={{ color: "var(--mrd-ink)", fontWeight: 600 }}>
              {captainLabel}
            </strong>
          </span>
          <span
            className="mono-label"
            style={{ color: "color-mix(in oklab, var(--mrd-ink) 55%, transparent)" }}
          >
            trace{" "}
            {data.usage.trace_id ? (
              <Link to="/traces/$traceId" params={{ traceId: data.usage.trace_id }}>
                <strong
                  className="tabular-nums"
                  style={{ color: "var(--mrd-ink)", fontWeight: 600 }}
                >
                  {data.usage.trace_id.slice(0, 8)}
                </strong>
              </Link>
            ) : (
              <strong className="tabular-nums" style={{ color: "var(--mrd-ink)", fontWeight: 600 }}>
                none yet
              </strong>
            )}
          </span>
        </div>
      </header>

      {/* AGENT-EXP: the relay is the lede - the named faces in motion, grouped
          by station. The plan/graph + full execution trace stay below as detail. */}
      <AgentRelay variant="full" missionId={missionId} />

      {/* Production: live-refresh marker + capture-as-decision, quiet row. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--geist-space-3x)",
          marginBottom: "var(--mrd-s5)",
        }}
      >
        {missionRunning ? (
          <span
            className="mono-label"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--mrd-s3)",
              color: "var(--mrd-agent)",
            }}
          >
            <span className="dot dot-running" style={{ width: 5, height: 5 }} />
            live · refreshing every 2s
          </span>
        ) : (
          <span />
        )}
        <CaptureMissionDecision
          missionId={data.mission.id}
          title={stripAutoPrefix(data.mission.title)}
          goal={data.mission.goal}
        />
      </div>

      {/* N3 · Mission Compounding View — the moat made visible per mission. */}
      <MissionCompounding data={data} />

      {/* D4b · side-by-side checkpoint-diff vs the original (replay missions only). */}
      {data.mission.replayed_from_mission_id ? (
        <div style={{ marginBottom: "var(--mrd-s5)" }}>
          {/* Reveal-only, so it stays a plain button by the tier test: no
              work is done and nothing is unblocked; a comparison is shown. */}
          <button
            onClick={() => setShowDiff((v) => !v)}
            className={`mono-label loom-press ${HOVER_BG}`}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--mrd-s2)",
              padding: "3px var(--mrd-s4)",
              borderRadius: 5,
              border: "1px solid color-mix(in oklab, var(--mrd-mute) 45%, transparent)",
              color: "var(--mrd-ink)",
              marginBottom: showDiff ? "var(--mrd-s4)" : 0,
            }}
            title="Compare this replay with the mission it was replayed from"
            aria-expanded={showDiff}
          >
            {showDiff ? (
              <ChevronDown style={{ width: 11, height: 11 }} />
            ) : (
              <ChevronRight style={{ width: 11, height: 11 }} />
            )}
            {showDiff ? "Hide comparison" : "Compare with original"}
          </button>
          {showDiff ? (
            <MissionDiff current={data} counterpartId={data.mission.replayed_from_mission_id} />
          ) : null}
        </div>
      ) : null}

      {/* Steps — plan list or live graph */}
      <section style={{ ...LOOM_CARD, padding: "var(--card-pad)", marginBottom: "var(--mrd-s5)" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "var(--mrd-s5)",
          }}
        >
          {/* STEPS, not specialists. `planRows` is one row per mission STEP, or
              one per HOP in the fallback, and several steps routinely carry the
              same agent_slug: a three-step plan run by Chief of Staff twice and
              Engineer once was counting three specialists when two people were
              on it. This same card already calls this same collection by its
              real noun twenty lines down ("No steps yet"), so an unplanned
              mission read "Plan · 0 specialists" directly above it. If crew size
              is ever wanted here it is a SECOND number and it is
              `new Set(planRows.map((r) => r.agent)).size`, not this one.
              Fixed 2026-08-11. */}
          <MonoLabel icon={GitBranch}>
            Plan · {planRows.length} {planRows.length === 1 ? "step" : "steps"}
          </MonoLabel>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--mrd-s3)" }}>
            {canAdvance ? (
              /* TIER: `Action`, default face. Advancing dispatches ready steps
                 -- it does something to the work and unblocks nothing that a
                 person is holding (the gate for that lives in GatePanel). */
              <Action
                variant="default"
                busy={advance.isPending}
                onClick={() => advance.mutate()}
              >
                {advance.isPending ? "Advancing…" : "Advance · dispatches ready steps"}
              </Action>
            ) : null}
            <div
              style={{
                display: "flex",
                gap: "var(--mrd-s1)",
                border: "1px solid var(--mrd-edge)",
                borderRadius: 7,
                padding: "var(--mrd-s1)",
              }}
            >
              {(
                [
                  ["plan", "List"],
                  /* Offered only where there is a plan to put on a clock. The
                     hop fallback carries no `dispatched_at`, so on a mission
                     with no `mission_steps` this segment would open onto the
                     timeline's zero case every time — a control that promises a
                     view the record cannot fill. */
                  ...(stepRows.length > 0 ? ([["when", "When"]] as const) : []),
                  ["graph", "Graph"],
                ] as ["plan" | "when" | "graph", string][]
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setView(id)}
                  aria-pressed={view === id}
                  className={`mono-label loom-press transition-colors hover:[background:var(--mrd-lift-hover)]`}
                  style={{
                    padding: "3px var(--mrd-s4)",
                    borderRadius: 5,
                    // Inline background only on the active pill so hover resolves.
                    background: view === id ? "var(--mrd-lift)" : undefined,
                    color: view === id ? "var(--mrd-ink)" : "var(--mrd-mute)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        {view === "plan" ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {steps.isError ? (
              /* THE EMPTY STATE WAS LYING. This query had no error branch, so a
                 failed read degraded through `steps.data?.steps ?? []` into
                 planRows.length === 0 and printed "No steps yet" about a mission
                 that may have plenty. A read failure names itself and offers the
                 read again; only a genuinely empty plan earns the empty state. */
              <ReadFailedLine error={steps.error} onRetry={() => steps.refetch()}>
                The mission's steps could not be read just now.
              </ReadFailedLine>
            ) : planRows.length === 0 ? (
              <div
                style={{
                  color: "var(--mrd-mute)",
                  fontStyle: "italic",
                }}
              >
                No steps yet. The plan lands with the first hop.
              </div>
            ) : (
              planRows.map((s, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: "var(--mrd-s5)",
                    alignItems: "flex-start",
                    padding: "var(--mrd-s4) 0",
                    borderBottom: i < planRows.length - 1 ? "1px solid var(--mrd-edge)" : "none",
                  }}
                >
                  <span
                    className="mono-label tabular-nums"
                    style={{ width: 18, textAlign: "right", marginTop: "var(--mrd-s1)" }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ marginTop: "var(--mrd-s3)" }}>
                    <StepDot status={stepDotStatus(s.status)} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--mrd-s4)" }}>
                      <span className="mono-label" style={{ color: "var(--mrd-ink)" }}>
                        {s.agent}
                      </span>
                      <StatusBadge status={badgeStatus(s.status)} />
                      {s.deps.length > 0 ? (
                        <span className="mono-label" style={{ color: "var(--mrd-mute)" }}>
                          after {s.deps.map((d) => d + 1).join(", ")}
                        </span>
                      ) : null}
                    </div>
                    <div
                      style={{
                        color: "var(--mrd-ink)",
                        // gap-mrd-pair's step: the agent line and this row's
                        // substance sit close but not touching. Was 3px, an
                        // off-ladder number nobody chose.
                        marginTop: "var(--mrd-s1)",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {s.goal}
                    </div>
                    {s.note ? (
                      <div style={{ color: "var(--mrd-fail)", marginTop: "var(--mrd-s1)" }}>
                        {s.note}
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        ) : view === "when" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--mrd-s4)" }}>
            <RunTimeline
              events={timeline}
              now={axisNow}
              label="When each step of this mission ran"
              maxHeight={460}
            />
            {/* WHAT IS NOT ON THE AXIS, IN WORDS AND WITH THE NUMBER. The List
                segment is one press away and holds every row, so this is a view
                that shows less rather than one that hides something — but only
                because it says so. */}
            {notDispatched > 0 ? (
              <p style={{ color: "var(--mrd-mute)" }}>
                {notDispatched} of {stepRows.length}{" "}
                {stepRows.length === 1 ? "step has" : "steps have"} not been dispatched, so{" "}
                {notDispatched === 1 ? "it has" : "they have"} no instant to sit on. List has all{" "}
                {stepRows.length}.
              </p>
            ) : null}
          </div>
        ) : (
          /* The graph is the tracked fact on this page: node transitions
             (planned → running → done) are said politely, and identical polls
             render identical SVG text so nothing chatters. */
          <div aria-live="polite">
            <MissionGraph steps={graphSteps} />
          </div>
        )}
      </section>

      {/* Stage history: real per-transition rows; renders nothing until the
          first transition lands. */}
      <StageTimeline entityType="mission" entityId={missionId} variant="loom" />

      {/* Gate */}
      {liveHop?.trace_id ? (
        <GatePanel
          traceId={liveHop.trace_id}
          agentName={liveHop.agent_name}
          onResolved={() => {
            qc.invalidateQueries({ queryKey: ["mission", missionId] });
            qc.invalidateQueries({ queryKey: ["mission-steps", missionId] });
          }}
        />
      ) : null}

      {/* Executed unattended (W2) — side-effecting actions the loop ran with
          no gate because the agent's trust arc had earned auto. The counterpart to
          the gate above: that's what needs you; this is what already ran. */}
      {unattended.length > 0 ? (
        <section style={{ ...LOOM_CARD, padding: "var(--card-pad)", marginBottom: "var(--mrd-s5)" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "var(--mrd-s4)",
            }}
          >
            <MonoLabel icon={Bot}>Ran on its own</MonoLabel>
            <span className="mono-label tabular-nums">
              {unattended.length} action{unattended.length !== 1 ? "s" : ""}
            </span>
          </div>
          <p
            style={{
              color: "var(--mrd-mute)",
              marginBottom: "var(--mrd-s4)",
            }}
          >
            {/* RPT-09 (amplifier voice): the operator set the trust bar these ran under
                -- frame it as their call, not as the operator being cut out of the loop. */}
            You set the agent&apos;s trust high enough to run these on its own, so they went ahead
            without a gate. Here is exactly what ran, and whether each one can be undone.
          </p>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {unattended.map((tc, i) => {
              const c = toolConsequence(tc.tool_name);
              return (
                <div
                  key={tc.id}
                  style={{
                    display: "flex",
                    gap: "var(--geist-space-3x)",
                    alignItems: "flex-start",
                    padding: "var(--mrd-s4) 0",
                    borderBottom: i < unattended.length - 1 ? "1px solid var(--mrd-edge)" : "none",
                  }}
                >
                  <span style={{ flexShrink: 0, alignSelf: "flex-start" }}>
                    {/* moss for ok (accent restraint 2026-07-11): a settled
                        outcome is a verdict; machine blue never marks success. */}
                    <VerdictChip tone={tc.ok ? "moss" : "madder"}>
                      {agentDisplayName(tc.agent_slug)}
                    </VerdictChip>
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <code style={{}}>{tc.tool_name}</code>
                    <span
                      style={{
                        display: "block",
                        color: "var(--mrd-ink)",
                        lineHeight: "var(--mrd-lh-snug)",
                        marginTop: "var(--mrd-s1)",
                      }}
                    >
                      {c.effect}
                    </span>
                    <span
                      className="mono-label tabular-nums"
                      style={{ display: "block", marginTop: 3 }}
                    >
                      {REVERSIBILITY_LABEL[c.reversible]} · {tc.ok ? "ok" : "failed"} ·{" "}
                      {tc.latency_ms}ms
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      {/* Hops trace — per-hop expand/collapse, tinted tool calls, timing bars */}
      <section style={{ ...LOOM_CARD, padding: "var(--card-pad)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--mrd-s4)" }}>
          <MonoLabel icon={Activity}>Execution trace</MonoLabel>
          <span className="mono-label">
            {hops.length} hops
            {missionRunning ? " · live" : ""}
          </span>
        </div>
        {hops.length === 0 ? (
          <div
            style={{
              color: "var(--mrd-mute)",
              fontStyle: "italic",
            }}
          >
            {/* This said "The mission is queued" for every mission with no hops
             * yet, whatever its status — including the ones that were genuinely
             * stuck at 'queued' and the ones that had already started. Each
             * branch below now says the thing that is actually true of this
             * mission, and none of them claims work is under way. */}
            {missionLaunchable
              ? "No hops yet. Nothing runs until this mission is launched."
              : missionRunning
                ? "No hops yet. Nothing has been dispatched on this mission yet."
                : "No hops yet."}
          </div>
        ) : (
          hops.map((h, i) => (
            <TraceHop
              key={h.run_id}
              h={h}
              defaultOpen={i === 0}
              pct={Math.max(10, Math.round((hopElapsedMs(h) / maxElapsed) * 100))}
              inbound={data.messages.find((mm) => mm.consumed_by_run_id === h.run_id)}
              outbound={data.messages.find((mm) => mm.source_run_id === h.run_id)}
            />
          ))
        )}
      </section>

      {/* Failed mission — visible retry path */}
      {missionFailed ? (
        <section
          className="fade-up"
          style={{
            padding: "var(--mrd-s5)",
            borderRadius: 10,
            marginTop: "var(--mrd-s5)",
            marginBottom: "var(--mrd-s5)",
            background: "color-mix(in oklab, var(--mrd-fail) 7%, transparent)",
            border: "1px solid color-mix(in oklab, var(--mrd-fail) 35%, transparent)",
          }}
        >
          <div
            className="mono-label"
            style={{
              color: "var(--mrd-fail)",
              display: "flex",
              alignItems: "center",
              gap: "var(--mrd-s3)",
              fontWeight: 700,
              whiteSpace: "normal",
            }}
          >
            <X size={16} style={{ flexShrink: 0 }} /> Failed ·{" "}
            {failedStep?.error ?? "see the trace below"}
          </div>
          {failedStep ? (
            <p
              style={{
                color: "var(--mrd-ink)",
                margin: "var(--mrd-s3) 0 var(--mrd-s4)",
              }}
            >
              {agentDisplayName(failedStep.agent_slug)} could not finish "{failedStep.sub_goal}"
              {failedStep.error ? `: ${failedStep.error}` : ""}.
            </p>
          ) : (
            <p
              style={{
                color: "var(--mrd-ink)",
                margin: "var(--mrd-s3) 0 var(--mrd-s4)",
              }}
            >
              The mission stopped before completing. The execution trace above carries the details.
            </p>
          )}
          <div style={{ display: "flex", gap: "var(--mrd-s3)", flexWrap: "wrap" }}>
            {/* TIER: `Action variant="primary"` -- THE ONE PRIMARY THIS FILE
                ASKS FOR. `.btn-primary` painted it as an ember gradient fill
                with an inset white highlight, the exact shape the ruling
                forbids; the primary face says "this one is yours" with the
                system's own solid ground and specular edge instead, so recovery
                stays the loudest thing in this section without inventing a
                fill. Replay does work (it starts a new mission); it unblocks
                nothing held, which is why it is an Action and not an Approve
                even in a failure state. */}
            <Action
              variant="primary"
              busy={replay.isPending}
              onClick={() => replay.mutate()}
            >
              <RotateCcw size={14} />
              {replay.isPending ? "Replaying…" : "Replay · same goal, new mission"}
            </Action>
            {/* A <Link>, not a control: this one navigates, so it stays an <a>
                to keep middle-click, copy-link and the router's prefetch. The
                face is Door's paint -- dotted underline that firms on hover --
                because navigation is the quiet end of the affordance scale and
                must not borrow a tier from the recovery action beside it. */}
            <Link
              to="/engine-room"
              search={{ room: "safety", view: "rules" }}
              className="inline-flex items-center text-mrd-label font-medium text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid"
              style={{ whiteSpace: "nowrap" }}
            >
              View guardrails
            </Link>
          </div>
        </section>
      ) : null}
    </div>
  );
}
