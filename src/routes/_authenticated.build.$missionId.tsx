// Build session detail — LOOM v4 port (W2-BUILD, 2026-07-04). This was the
// last parchment island on the Build spine (audit D-13); it now speaks the
// Obsidian/Loom tokens: surface-card + top-light + ambient shadow for depth,
// the work-surface container width (§4b), the lightened ink ramp, and four
// designed states (skeleton that matches the layout, error with retry, a
// designed not-found for stale deep links, loaded). Functionality is kept
// exactly: 4s live polling contract, steer mutation + ⌘Enter, brief toggle,
// the three panels' props, cancel/replay/gates via MissionOrchestratorDetail.
// D-13 fixes: tab switches merge search params (functional updater) instead
// of clobbering them; steering closes on ALL terminal states, not just
// completed. User-facing name is Build; internal identifiers intentionally
// stay studio.* (CLAUDE.md rename-disclaimer pattern).
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronDown, ChevronRight, Send, Copy } from "lucide-react";
import { toast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/cadence/TopBar";
import { MonoLabel, StepDot, SubTabs } from "@/components/cadence/Primitives";
import { stepLabel } from "@/lib/agent-vocabulary";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  getStudioSession,
  steerStudioSession,
  type StudioApproval,
  type StudioChangesetSummary,
  type StudioCi,
  type StudioConstraints,
  type StudioFileSetPolicy,
  type StudioRunDetail,
} from "@/lib/studio.functions";
import { renameMission } from "@/lib/missions.functions";
import { listDeployments } from "@/lib/deployments.functions";
import { SessionTimeline } from "@/components/studio/SessionTimeline";
import { ApprovalCard } from "@/components/studio/ApprovalCard";
import { AgentRelay } from "@/components/agents/AgentRelay";
import { ChangesPanel } from "@/components/studio/ChangesPanel";
import { EngineRoomDisclosure } from "@/components/studio/EngineRoomDisclosure";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import type { Inspection } from "@/lib/ai/studio-inspection";
import { CostPanel } from "@/components/studio/CostPanel";
import { ReceiptsPanel } from "@/components/studio/ReceiptsPanel";
import { StatusChip, LOOM_CARD, SkeletonBlock } from "@/components/studio/studio-ui";
import { fmtCost } from "@/components/studio/studio-format";
import { traceRef } from "@/components/discover/format";
import { MissionOrchestratorDetail } from "@/components/missions/MissionOrchestratorDetail";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
import { AutoChip } from "@/components/cadence/AutoChip";

type Tab = "changes" | "pr" | "preview" | "cost" | "receipts";
const TABS: Tab[] = ["changes", "pr", "preview", "cost", "receipts"];
const TAB_DISPLAY: [Tab, string][] = [
  ["changes", "Changes"],
  ["pr", "PR · Checks"],
  ["preview", "Preview"],
  ["cost", "Cost"],
  ["receipts", "Receipts"],
];

export const Route = createFileRoute("/_authenticated/build/$missionId")({
  // Optional so existing dispatch surfaces can navigate without search;
  // the component defaults to the Changes tab.
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
    const t = search.tab;
    return { tab: (TABS as string[]).includes(t as string) ? (t as Tab) : undefined };
  },
  component: BuildSessionPage,
  head: () => ({ meta: [{ title: "Build · Cadence" }] }),
  errorComponent: ({ error, reset }) => {
    // A stale or deleted mission id deep-links here (quality register: param'd
    // detail routes had no designed not-found). getStudioSession throws
    // "Session not found" for a missing row; render that as a real not-found,
    // never as a generic failure (an error may not wear another state's clothes).
    const message = (error as Error)?.message ?? "Unknown error";
    const isNotFound = message === "Session not found";
    return (
      <div
        style={{
          padding: "30px 44px 56px",
          maxWidth: "var(--container-work)",
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div style={{ ...LOOM_CARD, padding: 24, maxWidth: 560 }}>
          <MonoLabel style={{ color: isNotFound ? "var(--text-subtle)" : "var(--madder)" }}>
            {isNotFound ? "No mission at this address" : "Couldn't load this session"}
          </MonoLabel>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
            {isNotFound
              ? "This mission doesn't exist in your workspace, or it was deleted. Its decisions and learnings stay in Memory."
              : message}
          </p>
          {isNotFound ? (
            <Link
              to="/build"
              className="mono-label loom-press hover:underline underline-offset-4"
              style={{ display: "inline-flex", marginTop: 14, color: "var(--glacier)" }}
            >
              ← All missions
            </Link>
          ) : (
            <Button
              variant="tertiary"
              size="sm"
              className="loom-press"
              onClick={reset}
              style={{ marginTop: 14 }}
            >
              Reload session
            </Button>
          )}
        </div>
      </div>
    );
  },
});

type MissionRow = {
  id: string;
  title: string;
  goal: string;
  status: string;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

type Steer = { id: string; message: string; created_at: string; consumed: boolean };

type ChangeRow = {
  id: string;
  path: string;
  op: string;
  base_chars: number;
  new_chars: number;
  updated_at: string;
};

/** Header stat: "Today HH:MM" or "Mon D HH:MM" (the missions-detail idiom). */
function fmtStarted(iso: string): string {
  const d = new Date(iso);
  const hm = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });
  return d.toDateString() === new Date().toDateString()
    ? `Today ${hm}`
    : `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${hm}`;
}

/* Pipeline journey strip — the station made visible: build → PR → CI →
   shipped, one quiet mono rail. REAL stages only: every dot derives from an
   existing field (runs, changeset.status, ci.overall); a stage with no datum
   renders as a planned dot with a faint label. The spec stage is omitted
   entirely — getStudioSession carries no prd context (no filler). When the
   mission completes, the rail links onward to Releases (zero dead ends). */
function JourneyStrip({
  runs,
  changeset,
  ci,
  missionStatus,
  productionDeployed,
}: {
  runs: StudioRunDetail[];
  changeset: StudioChangesetSummary | null;
  ci: StudioCi;
  missionStatus: string | undefined;
  productionDeployed: boolean;
}) {
  const anyLive = runs.some((r) => ["queued", "running", "waiting_approval"].includes(r.status));
  const anyFailed = runs.some((r) => r.status === "failed" || r.status === "halted");
  const anyCompleted = runs.some((r) => r.status === "completed");
  const buildStatus = anyLive
    ? "running"
    : anyFailed
      ? "failed"
      : anyCompleted
        ? "completed"
        : "planned";

  const prStatus = !changeset
    ? "planned"
    : changeset.status === "merged"
      ? "completed"
      : changeset.status === "pr_open"
        ? "running"
        : "planned";
  const prLabel = changeset?.pr_number != null ? `PR #${changeset.pr_number}` : "PR";

  const ciStatus = !ci
    ? "planned"
    : ci.overall === "pending"
      ? "running"
      : ci.overall === "success"
        ? "completed"
        : ci.overall === "failure"
          ? "failed"
          : "planned";

  const shippedStatus =
    changeset?.status === "merged" ? (productionDeployed ? "completed" : "running") : "planned";

  const stages: { label: string; status: string; href?: string }[] = [
    { label: "build", status: buildStatus },
    { label: prLabel, status: prStatus, href: changeset?.pr_url ?? undefined },
    { label: "Checks", status: ciStatus },
    { label: "shipped", status: shippedStatus },
  ];

  return (
    <div
      style={{
        background: "var(--surface-raised)",
        borderRadius: "var(--radius-card)",
        boxShadow: "var(--top-light)",
        padding: "12px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        flexWrap: "wrap",
        marginBottom: 16,
      }}
    >
      {stages.map((stage, i) => (
        <span key={stage.label} style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
          {i > 0 && (
            <span className="mono-label" style={{ color: "var(--text-faint)" }}>
              →
            </span>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <StepDot status={stage.status} />
            {stage.href ? (
              <a
                href={stage.href}
                target="_blank"
                rel="noreferrer"
                className="mono-label tabular-nums"
                style={{ fontSize: "var(--text-mono-floor)", color: "var(--glacier)" }}
              >
                {stage.label}
              </a>
            ) : (
              <span
                className="mono-label tabular-nums"
                style={{
                  fontSize: "var(--text-mono-floor)",
                  color: stage.status === "planned" ? "var(--text-faint)" : "var(--text-subtle)",
                }}
              >
                {stage.label}
              </span>
            )}
          </span>
        </span>
      ))}
      {missionStatus === "completed" && (
        <Link
          to="/brain"
          search={{ tab: "docs" }}
          className="mono-label hover:underline underline-offset-4"
          style={{ fontSize: "var(--text-mono-floor)", color: "var(--glacier)", marginLeft: 4 }}
        >
          lands in Releases →
        </Link>
      )}
    </div>
  );
}

function SteerComposer({
  missionId,
  closedReason,
}: {
  missionId: string;
  closedReason: string | null;
}) {
  const qc = useQueryClient();
  const fSteer = useServerFn(steerStudioSession);
  const [message, setMessage] = useState("");
  const disabled = closedReason != null;
  const steer = useMutation({
    mutationFn: () => fSteer({ data: { missionId, message: message.trim() } }),
    onSuccess: () => {
      setMessage("");
      toast.success("Steer sent. The agent reads it at its next step.");
      qc.invalidateQueries({ queryKey: ["studio-session", missionId] });
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const canSend = !disabled && message.trim().length > 0 && !steer.isPending;

  return (
    <div style={{ ...LOOM_CARD, padding: "var(--card-pad)" }}>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSend) {
              e.preventDefault();
              steer.mutate();
            }
          }}
          rows={2}
          disabled={disabled}
          placeholder="Steer the session in plain language…"
          style={{
            resize: "none",
            flex: 1,
            minWidth: 0,
            opacity: disabled ? 0.5 : 1,
            background: "var(--surface-hover)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            padding: 10,
            fontSize: 13,
            color: "var(--text-primary)",
          }}
        />
        {/* Neutral, not ember: sending a steer is the user's own utterance,
            not a needs-a-human gate (restraint budget; the one ember CTA on
            this screen is a pending gate's Approve). */}
        <button
          type="button"
          onClick={() => steer.mutate()}
          disabled={!canSend}
          // Disabled explains itself: closedReason renders below when terminal;
          // while open, the title names what unlocks Send.
          title={!canSend && !disabled && !steer.isPending ? "Type a steer first" : undefined}
          className="loom-press outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
          style={{
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-sans)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-primary)",
            background: "var(--surface-raised)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--radius-control)",
            padding: "8px 14px",
            opacity: canSend ? 1 : 0.5,
            cursor: canSend ? "pointer" : "default",
          }}
        >
          {steer.isPending ? <span className="spinner" /> : <Send size={11} />}
          Send · steers the next step
        </button>
      </div>
      {disabled && (
        <div
          className="mono-label"
          style={{ marginTop: 8, fontSize: "var(--text-mono-floor)", color: "var(--text-subtle)" }}
        >
          {closedReason}
        </div>
      )}
    </div>
  );
}

// The agent's current action, for the live header caption (the Cursor-style
// "what's it doing right now"). AI-PULSE: the labels moved to
// agent-vocabulary.ts (stepLabel) so this caption and the platform-wide
// ticker can never disagree. When no run is live but the MISSION still is,
// the caption says "queuing the next run" instead of collapsing to a bare
// "Live" - continuous feedback, never dead air (founder ruling 2026-07-08).
function currentAction(runs: StudioRunDetail[], missionLive: boolean): string | null {
  const liveRun = [...runs].reverse().find((r) => r.status === "running" || r.status === "queued");
  if (!liveRun) return missionLive ? "queuing the next run" : null;
  const last = liveRun.steps[liveRun.steps.length - 1];
  return stepLabel(last);
}

/** Why steering is closed, or null while it is open. All terminal states close
 *  the composer (audit D-13: steers were accepted on failed/halted missions,
 *  where no agent will ever read them). */
function steerClosedReason(status: string | undefined): string | null {
  if (status === "completed") return "Session completed. Steering is closed.";
  if (status === "failed")
    return "Session failed. Steering is closed; replay to run the goal again.";
  if (status === "halted")
    return "Session halted. Steering is closed; replay to run the goal again.";
  if (status === "cancelled") return "Session cancelled. Steering is closed.";
  return null;
}

/** The raw mono session log, folded behind one recessed toggle (the
 *  EngineRoomDisclosure idiom: name the outcome outside, keep the machinery
 *  behind one door). The relay narrative above is the lede; this is depth.
 *  Pending gates render OUTSIDE the fold (a gate may never hide). */
function ExecutionLogFold({
  runs,
  steers,
  onChanged,
}: {
  runs: StudioRunDetail[];
  steers: Steer[];
  onChanged: () => void;
}) {
  const [open, setOpen] = useState(false);
  const runCount = runs.length;
  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        // Base background lives in the class so the hover state can resolve
        // (an inline background always beats a stylesheet hover).
        className="loom-press outline-none transition-colors [background:var(--surface-recessed)] hover:[background:var(--surface-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
        style={{
          width: "100%",
          minHeight: 32,
          display: "flex",
          alignItems: "center",
          gap: 6,
          border: "1px solid var(--hairline)",
          borderRadius: "var(--radius-control)",
          boxShadow: "var(--top-light)",
          padding: "7px 12px",
          cursor: "pointer",
          color: "var(--text-subtle)",
        }}
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span className="mono-label" style={{ fontSize: "var(--text-mono-floor)" }}>
          Full execution log
        </span>
        <span
          className="mono-label tabular-nums"
          style={{
            marginLeft: "auto",
            fontSize: "var(--text-mono-floor)",
            color: "var(--text-faint)",
          }}
        >
          {runCount} run{runCount === 1 ? "" : "s"}
        </span>
      </button>
      {open ? (
        <div className="fade-up" style={{ marginTop: 10 }}>
          <SessionTimeline runs={runs} steers={steers} approvals={[]} onChanged={onChanged} />
        </div>
      ) : null}
    </section>
  );
}

/** Loading skeleton that matches the loaded two-column layout (§9). */
function SessionSkeleton() {
  return (
    <div aria-hidden="true">
      <SkeletonBlock height={64} style={{ maxWidth: 560, marginBottom: 16 }} />
      <SkeletonBlock height={44} style={{ marginBottom: 16 }} />
      {/* Same responsive collapse as the loaded grid, so the skeleton never
          overflows at narrow widths while the real layout stacks. */}
      <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SkeletonBlock height={180} />
          <SkeletonBlock height={88} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <SkeletonBlock height={36} />
          <SkeletonBlock height={232} />
        </div>
      </div>
    </div>
  );
}

function BuildSessionPage() {
  const { missionId } = Route.useParams();
  const tab = Route.useSearch().tab ?? "changes";
  const navigate = useNavigate({ from: "/build/$missionId" });
  const qc = useQueryClient();
  const { activeWorkspace } = useWorkspace();

  const fGet = useServerFn(getStudioSession);

  const session = useQuery({
    queryKey: ["studio-session", missionId],
    queryFn: () => fGet({ data: { missionId } }),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 4000;
      const mission = d.mission as MissionRow | null;
      const missionLive = mission?.status === "running" || mission?.status === "queued";
      const runLive = (d.runs as StudioRunDetail[]).some((r) =>
        ["queued", "running", "waiting_approval"].includes(r.status),
      );
      return missionLive || runLive ? 4000 : false;
    },
  });

  const [showBrief, setShowBrief] = useState(false);

  const data = session.data;
  // OBS-10: a mission with no 'builder' agent run is an orchestrator goal-run,
  // not a Studio session — render its own detail body (MissionOrchestratorDetail)
  // instead of the changeset/PR-shaped grid below, which has nothing to show it.
  const isOrchestratorMission = data?.kind === "mission";
  const mission = (data?.mission ?? null) as MissionRow | null;
  const runs = (data?.runs ?? []) as StudioRunDetail[];
  const changeset = (data?.changeset ?? null) as
    (StudioChangesetSummary & { base_sha?: string | null; updated_at?: string | null }) | null;
  const changes = (data?.changes ?? []) as ChangeRow[];
  const fileSetPolicy = (data?.fileSetPolicy ?? null) as StudioFileSetPolicy | null;
  const constraints = (data?.constraints ?? null) as StudioConstraints;
  const approvals = (data?.approvals ?? []) as StudioApproval[];
  const ci = (data?.ci ?? null) as StudioCi;

  // The pipeline breadcrumb's "shipped" dot must reflect an actual production
  // deployment, not just a merge (deploy.promote is a distinct, later human
  // gate from studio.pr.merge - conflating the two hid the real promote step
  // behind a JourneyStrip that was already green at merge time).
  const fDeployments = useServerFn(listDeployments);
  const deploymentsQ = useQuery({
    queryKey: ["changeset-deployments", changeset?.id],
    queryFn: () => fDeployments({ data: { changesetId: changeset!.id } }),
    enabled: !!changeset?.id,
  });
  const productionDeployed = (
    (deploymentsQ.data?.deployments ?? []) as Array<{ environment: string; status: string }>
  ).some((d) => d.environment === "production" && d.status === "success");
  const inspection = (data?.inspection ?? null) as Inspection | null;
  const steers = (data?.steers ?? []) as Steer[];
  const totalCost = data?.total_cost_usd ?? 0;
  const spec = (data?.spec ?? null) as { id: string; title: string } | null;

  const isLive =
    mission?.status === "running" ||
    runs.some((r) => ["queued", "running", "waiting_approval"].includes(r.status));
  const liveAction = isLive ? currentAction(runs, mission?.status === "running") : null;
  const mergeGatePending = approvals.some(
    (a) => a.status === "pending" && a.tool_name === "studio.pr.merge",
  );
  const invalidate = () => qc.invalidateQueries({ queryKey: ["studio-session", missionId] });

  const activeTabLabel = TAB_DISPLAY.find(([id]) => id === tab)?.[1] ?? "Changes";

  const fRenameMission = useServerFn(renameMission);
  const [renamingTitle, setRenamingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const renameMut = useMutation({
    mutationFn: (title: string) => fRenameMission({ data: { missionId, title } }),
    onSuccess: () => invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });
  const startTitleRename = () => {
    if (!mission) return;
    setTitleDraft(stripAutoPrefix(mission.title));
    setRenamingTitle(true);
  };
  const commitTitleRename = () => {
    const next = titleDraft.trim().slice(0, 200);
    setRenamingTitle(false);
    if (next && mission && next !== stripAutoPrefix(mission.title)) renameMut.mutate(next);
  };

  return (
    <>
      {/* IA SPINE (2026-07-11): the Build crumb navigates; the bespoke
          "← All missions" back link is gone. */}
      <TopBar
        crumbs={[
          activeWorkspace?.name ?? "Workspace",
          { label: "Build", to: "/build" },
          ...(mission ? [stripAutoPrefix(mission.title)] : []),
        ]}
      />
      <div
        data-screen-label="Build session"
        style={{
          padding: "30px 44px 56px",
          maxWidth: "var(--container-work)",
          width: "100%",
          margin: "0 auto",
        }}
      >
        {!isOrchestratorMission && mission && (
          <header style={{ marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              {renamingTitle ? (
                <input
                  autoFocus
                  aria-label="Mission title"
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={commitTitleRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitTitleRename();
                    }
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setRenamingTitle(false);
                    }
                  }}
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 25,
                    fontWeight: 460,
                    letterSpacing: "-0.015em",
                    lineHeight: 1.2,
                    color: "var(--text-primary)",
                    background: "var(--surface-raised)",
                    border: "1px solid var(--hairline)",
                    borderRadius: 6,
                    padding: "2px 8px",
                    flex: "1 1 auto",
                    minWidth: 200,
                  }}
                />
              ) : (
                <h1
                  onClick={startTitleRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      startTitleRename();
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Rename mission: ${stripAutoPrefix(mission.title)}`}
                  title="Click to rename"
                  className="outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 25,
                    fontWeight: 460,
                    letterSpacing: "-0.015em",
                    lineHeight: 1.2,
                    color: "var(--text-primary)",
                    margin: 0,
                    cursor: "pointer",
                  }}
                >
                  {stripAutoPrefix(mission.title)}
                </h1>
              )}
              {isAutoTitle(mission.title) ? <AutoChip /> : null}
              <StatusChip status={mission.status} />
            </div>
            {/* §6: the maker's mark — a static 24px thread under the title. */}
            <div
              aria-hidden="true"
              style={{
                width: 24,
                height: 1,
                background: "var(--thread-gradient)",
                opacity: 0.4,
                marginTop: 8,
              }}
            />
            <div
              className="mono-label"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginTop: 8,
                fontSize: "var(--text-mono-floor)",
                flexWrap: "wrap",
              }}
            >
              <span>started {fmtStarted(mission.created_at)}</span>
              <span style={{ color: "var(--text-faint)" }}>·</span>
              <span className="tabular-nums">{fmtCost(totalCost)}</span>
              <span style={{ color: "var(--text-faint)" }}>·</span>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard?.writeText(mission.id);
                  toast.success("Trace id copied");
                }}
                aria-label="Copy trace id"
                title="Copy the full trace id"
                className="loom-press outline-none transition-colors [color:var(--text-faint)] hover:[color:var(--text-subtle)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: "var(--font-mono)",
                  fontSize: "var(--text-mono-floor)",
                  letterSpacing: "0.06em",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                MIS·{traceRef(mission.id)}
                <Copy size={10} />
              </button>
              {spec ? (
                <>
                  <span style={{ color: "var(--text-faint)" }}>·</span>
                  <Link
                    to="/plan/spec/$id"
                    params={{ id: spec.id }}
                    className="loom-press outline-none [color:var(--glacier)] hover:[color:var(--text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "var(--text-mono-floor)",
                      letterSpacing: "0.06em",
                    }}
                    title={`Built from spec: ${spec.title}`}
                  >
                    from spec ↗
                  </Link>
                </>
              ) : null}
              {isLive && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    color: "var(--glacier)",
                  }}
                >
                  <span className="dot dot-running" style={{ width: 5, height: 5 }} />
                  Live{liveAction ? ` · ${liveAction}` : ""}
                </span>
              )}
              <button
                type="button"
                onClick={() => setShowBrief((v) => !v)}
                aria-expanded={showBrief}
                className="mono-label loom-press outline-none transition-colors hover:[color:var(--text-body)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: "var(--text-mono-floor)",
                  cursor: "pointer",
                }}
              >
                {showBrief ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
                the brief
              </button>
            </div>
            {showBrief && (
              <pre
                className="fade-up"
                style={{
                  marginTop: 10,
                  maxHeight: 240,
                  overflow: "auto",
                  whiteSpace: "pre-wrap",
                  background: "var(--surface-recessed)",
                  borderRadius: "var(--radius-control)",
                  boxShadow: "var(--top-light)",
                  padding: 12,
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  lineHeight: 1.6,
                  color: "var(--text-muted)",
                }}
              >
                {mission.goal}
              </pre>
            )}
          </header>
        )}

        {!isOrchestratorMission && data && mission && (
          <JourneyStrip
            runs={runs}
            changeset={changeset}
            ci={ci}
            missionStatus={mission.status}
            productionDeployed={productionDeployed}
          />
        )}

        {session.isError ? (
          <div style={{ ...LOOM_CARD, padding: 24, maxWidth: 560 }}>
            <MonoLabel style={{ color: "var(--madder)" }}>Couldn't load this session</MonoLabel>
            <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 8 }}>
              {(session.error as Error)?.message?.slice(0, 160)}
            </p>
            <button
              className="btn btn-ghost btn-sm loom-press"
              style={{ marginTop: 14 }}
              onClick={() => session.refetch()}
            >
              Retry · reloads the session
            </button>
          </div>
        ) : session.isLoading || !data ? (
          <SessionSkeleton />
        ) : isOrchestratorMission ? (
          <MissionOrchestratorDetail missionId={missionId} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2" style={{ gap: 14 }}>
            <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              {/* Real heading (quality register: MonoLabel spans left the page
                  with no navigable outline); the mono-caps look stays via style. */}
              <h2
                className="mono-label"
                style={{ margin: 0, fontSize: "var(--text-mono-floor)", fontWeight: 500 }}
              >
                Mission activity
              </h2>
              {/* The relay narrative is the lede for EVERY mission kind: named
                  agents, the current verb, the glacier shimmer on the running
                  row, handoff arrows. The raw mono log folds below. */}
              <AgentRelay variant="full" missionId={missionId} />
              {/* Gates stay outside the fold: a decision waiting on a human
                  may never hide behind a disclosure. */}
              {approvals
                .filter((a) => a.status === "pending")
                .map((a) => (
                  <ApprovalCard key={a.id} approval={a} onDecided={invalidate} />
                ))}
              <ExecutionLogFold runs={runs} steers={steers} onChanged={invalidate} />
              <SteerComposer
                missionId={missionId}
                closedReason={steerClosedReason(mission?.status)}
              />
            </div>

            <div style={{ minWidth: 0 }}>
              <SubTabs
                tabs={TAB_DISPLAY.map(([, label]) => label)}
                active={activeTabLabel}
                onSet={(label) => {
                  const next = TAB_DISPLAY.find(([, l]) => l === label)?.[0] ?? "changes";
                  // Functional updater: merge, never clobber, the search state
                  // (audit D-13: the plain object dropped sibling params).
                  navigate({ search: (prev) => ({ ...prev, tab: next }) });
                }}
              />
              {tab === "changes" && (
                <ChangesPanel
                  changeset={changeset}
                  changes={changes}
                  missionId={missionId}
                  fileSetPolicy={fileSetPolicy}
                  constraints={constraints}
                />
              )}
              {tab === "pr" && (
                <EngineRoomDisclosure
                  missionId={missionId}
                  changeset={changeset}
                  ci={ci}
                  inspection={inspection}
                  mergeGatePending={mergeGatePending}
                  onRefreshed={invalidate}
                />
              )}
              {tab === "preview" && (
                <PreviewPanel missionId={missionId} changeset={changeset} isLive={isLive} />
              )}
              {tab === "cost" && <CostPanel runs={runs} total={totalCost} />}
              {tab === "receipts" && <ReceiptsPanel missionId={missionId} />}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
