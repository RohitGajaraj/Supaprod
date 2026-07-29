/**
 * Build, one run in detail. Ported onto the rebuild primitives (step 4),
 * same idiom as Today and Ship.
 *
 * WHAT THE RETIRED VERSION WAS: a page-level TopBar drawing a second header
 * under the shell's, a bespoke JourneyStrip card, a click-to-rename h1 with a
 * hand-drawn "maker's mark" thread, a mono meta rail carrying six unrelated
 * facts, a two-column grid of cards, an approval card, a disclosure card
 * wrapping a timeline of cards, and a composer card. Cards inside cards, and
 * every one of them a different skin.
 *
 * WHAT IT IS NOW: one surface that reads top to bottom and says five things:
 *   what this run is  ·  what needs you  ·  what it did  ·  what you told it
 *   ·  what it produced
 *
 * Second pass: the four controls this surface used to hand-roll from raw
 * tokens (the rename field, the note field, the brief, the button rows) now go
 * through Input, Textarea, Pre and Actions, which did not exist when it was
 * first ported. A read that FAILED wears Failed rather than Empty's clothes.
 *
 * The run is a sequence of acts by a named agent, so the attribution Row is
 * the whole spine here: one row per run carrying the mark and the time, its
 * steps as tight rows beneath it, and your own notes carrying YouMark. The
 * mark's running state is the only live thing on the screen, and it stops the
 * moment the run does.
 *
 * BEHAVIOUR IS UNCHANGED. Same query keys (["studio-session", missionId],
 * ["changeset-deployments", id]), same 4s live polling contract, same steer
 * mutation with the same command-Enter, same rename mutation, same approval
 * decision call, same five tab panels behind the same `?tab=` search param,
 * same orchestrator-kind branch. User-facing name is Build; internal
 * identifiers intentionally stay studio.* (CLAUDE.md rename-disclaimer).
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { toast } from "@/lib/notify";
import { supabase } from "@/integrations/supabase/client";
import { agentDisplayName, stepLabel } from "@/lib/agent-vocabulary";
import { isAutoTitle, stripAutoPrefix } from "@/components/plan/format";
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
import { decideApproval } from "@/lib/agent_loop.functions";
import { renameMission } from "@/lib/missions.functions";
import { listDeployments } from "@/lib/deployments.functions";
import type { Inspection } from "@/lib/ai/studio-inspection";
import { ChangesPanel } from "@/components/studio/ChangesPanel";
import { EngineRoomDisclosure } from "@/components/studio/EngineRoomDisclosure";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import { CostPanel } from "@/components/studio/CostPanel";
import { ReceiptsPanel } from "@/components/studio/ReceiptsPanel";
import { MissionOrchestratorDetail } from "@/components/missions/MissionOrchestratorDetail";
import { fmtCost, summarizeArgs } from "@/components/studio/studio-format";
import { traceRef } from "@/components/discover/format";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Empty,
  Failed,
  Gate,
  Input,
  Num,
  PageHead,
  Pre,
  Row,
  Surface,
  Textarea,
  Who,
  YouMark,
  type MarkState,
} from "@/components/shell/primitives";

/** Every run on this surface is the build agent's. Display name comes from the
 *  catalog, so a rename there lands here with no change. */
const BUILDER = "builder";

type Tab = "changes" | "pr" | "preview" | "cost" | "receipts";
const TABS: Tab[] = ["changes", "pr", "preview", "cost", "receipts"];
const TAB_DISPLAY: [Tab, string][] = [
  ["changes", "Changes"],
  ["pr", "Pull request"],
  ["preview", "Preview"],
  ["cost", "Cost"],
  ["receipts", "Receipts"],
];

/** How many activity rows open before the block offers the rest. */
const VISIBLE = 12;

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

/** A loop step, read structurally so this surface never imports the server
 *  module the union is declared in. */
type StepLike = {
  kind: string;
  text?: string;
  message?: string;
  name?: string;
  reason?: string;
  error?: string;
  status?: string;
  args?: unknown;
};

/* ------------------------------------------------------------------ *
 * Formatting. Local on purpose: nothing here reaches into another
 * surface's folder, so a parallel port cannot break this one.
 * ------------------------------------------------------------------ */

/** Plain-words relative time. Mono is applied by the row, not here. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const ms = Date.now() - t;
  if (ms < 0) return null;
  if (ms < 60_000) return "now";
  const m = Math.floor(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

/** "today 14:22" or "6 Jul 14:22". */
function startedAt(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const hm = d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return d.toDateString() === new Date().toDateString()
    ? `today ${hm}`
    : `${d.toLocaleDateString(undefined, { day: "numeric", month: "short" })} ${hm}`;
}

function initialsFrom(email: string | null, name: string | null): string {
  const source = (name ?? "").trim() || (email ?? "").split("@")[0] || "";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function cap(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

function clip(s: string, max = 180): string {
  const line = s.replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/** State is never a hue: the mark carries it. */
function markFor(status: string): MarkState {
  if (status === "running" || status === "queued") return "running";
  if (status === "waiting_approval") return "gate";
  if (status === "failed" || status === "halted") return "failed";
  return "quiet";
}

/** What the run is doing, in the agent's own voice. Present tense while it is
 *  alive, past tense once it is not. */
function runPhrase(run: StudioRunDetail): string {
  const last = run.steps[run.steps.length - 1] as StepLike | undefined;
  if (run.status === "running") return `is ${stepLabel(last)}`;
  if (run.status === "queued") return "is waiting to start";
  if (run.status === "waiting_approval") return "is waiting on you";
  if (run.status === "completed") return "finished";
  if (run.status === "failed") return "stopped on an error";
  if (run.status === "halted") return "was stopped";
  return run.status;
}

/** The live caption. When no run is alive but the mission still is, say so
 *  rather than going quiet: continuous feedback, never dead air. */
function currentAction(runs: StudioRunDetail[], missionLive: boolean): string | null {
  const liveRun = [...runs].reverse().find((r) => r.status === "running" || r.status === "queued");
  if (!liveRun) return missionLive ? "lining up the next run" : null;
  return stepLabel(liveRun.steps[liveRun.steps.length - 1] as StepLike | undefined);
}

/** Why a note will not be read, or null while the run can still take one. All
 *  terminal states close it: a note nobody reads is a lie. */
function closedReasonFor(status: string | undefined): string | null {
  if (status === "completed") return "This run finished, so nothing will read a new note.";
  if (status === "failed") return "This run failed, so nothing will read a new note.";
  if (status === "halted") return "This run was stopped, so nothing will read a new note.";
  if (status === "cancelled") return "This run was cancelled, so nothing will read a new note.";
  return null;
}

const STATE_WORD: Record<string, string> = {
  queued: "Waiting to start",
  running: "Running",
  completed: "Finished",
  failed: "Failed",
  halted: "Stopped",
  cancelled: "Cancelled",
};

/** The four real stages, each derived from a field that exists. A stage with
 *  no datum says so rather than inventing a state for it. */
function stageLines(
  runs: StudioRunDetail[],
  changeset: StudioChangesetSummary | null,
  ci: StudioCi,
  productionDeployed: boolean,
): { name: string; state: React.ReactNode }[] {
  const live = runs.some((r) => ["queued", "running", "waiting_approval"].includes(r.status));
  const failed = runs.some((r) => r.status === "failed" || r.status === "halted");
  const done = runs.some((r) => r.status === "completed");

  const written = live ? "being written" : failed ? "stopped" : done ? "written" : "not started";

  const pr: React.ReactNode = !changeset
    ? "not opened yet"
    : changeset.status === "merged"
      ? "merged"
      : changeset.status === "pr_open"
        ? changeset.pr_number != null
          ? ["open, ", <Num key="n">#{changeset.pr_number}</Num>]
          : "open"
        : "not opened yet";

  const checks = !ci
    ? "not run yet"
    : ci.overall === "pending"
      ? "running"
      : ci.overall === "success"
        ? "passed"
        : ci.overall === "failure"
          ? "failed"
          : "not run yet";

  const shipped =
    changeset?.status === "merged"
      ? productionDeployed
        ? "live"
        : "merged, not promoted yet"
      : "not yet";

  return [
    { name: "The code", state: written },
    { name: "Pull request", state: pr },
    { name: "Checks", state: checks },
    { name: "Production", state: shipped },
  ];
}

/** The one sentence the human is asked to judge. Plain words, never the tool
 *  name: that is provenance and it belongs in the evidence below. */
function gateQuestion(tool: string): string {
  if (tool === "studio.pr.merge") return "Merge this into the main branch?";
  if (tool === "delegate.openhands") return "Hand this build to an outside coding agent?";
  return "Let it go ahead?";
}

function approveVerb(tool: string): string {
  if (tool === "studio.pr.merge") return "Merge it";
  if (tool === "delegate.openhands") return "Send it";
  return "Approve";
}

function gateLines(a: StudioApproval): React.ReactNode[] {
  const lines: React.ReactNode[] = [];
  if (a.tool_name === "delegate.openhands") {
    lines.push(
      <span key="what">
        It clones the repo, writes the change, and hands the result back. It cannot be called back
        once it is sent.
      </span>,
    );
  }
  const args = summarizeArgs((a.args ?? {}) as Record<string, unknown>);
  if (args && args !== "(no args)") lines.push(<span key="args">{clip(args, 160)}</span>);
  if (a.rationale) lines.push(<span key="why">{a.rationale}</span>);
  lines.push(
    <span key="tool">
      Runs <Num>{a.tool_name}</Num>
    </span>,
  );
  return lines;
}

/* ------------------------------------------------------------------ *
 * The surface
 * ------------------------------------------------------------------ */

function BuildRun() {
  const { missionId } = Route.useParams();
  const tab = Route.useSearch().tab ?? "changes";
  const navigate = useNavigate({ from: "/build/$missionId" });
  const qc = useQueryClient();

  const fGet = useServerFn(getStudioSession);
  const fSteer = useServerFn(steerStudioSession);
  const fDecide = useServerFn(decideApproval);
  const fRename = useServerFn(renameMission);
  const fDeployments = useServerFn(listDeployments);

  const session = useQuery({
    queryKey: ["studio-session", missionId],
    queryFn: () => fGet({ data: { missionId } }),
    refetchInterval: (q) => {
      const d = q.state.data;
      if (!d) return 4000;
      const m = d.mission as MissionRow | null;
      const missionLive = m?.status === "running" || m?.status === "queued";
      const runLive = (d.runs as StudioRunDetail[]).some((r) =>
        ["queued", "running", "waiting_approval"].includes(r.status),
      );
      return missionLive || runLive ? 4000 : false;
    },
  });

  const data = session.data;
  // A mission with no build-agent run is an orchestrator goal-run, not a build
  // session: it has no changeset, no PR and no diff, so it renders its own body.
  const isOrchestrator = data?.kind === "mission";
  const mission = (data?.mission ?? null) as MissionRow | null;
  const runs = (data?.runs ?? []) as StudioRunDetail[];
  const changeset = (data?.changeset ?? null) as
    (StudioChangesetSummary & { base_sha?: string | null; updated_at?: string | null }) | null;
  const changes = (data?.changes ?? []) as ChangeRow[];
  const fileSetPolicy = (data?.fileSetPolicy ?? null) as StudioFileSetPolicy | null;
  const constraints = (data?.constraints ?? null) as StudioConstraints;
  const approvals = (data?.approvals ?? []) as StudioApproval[];
  const ci = (data?.ci ?? null) as StudioCi;
  const inspection = (data?.inspection ?? null) as Inspection | null;
  const steers = (data?.steers ?? []) as Steer[];
  const totalCost = data?.total_cost_usd ?? 0;
  const spec = (data?.spec ?? null) as { id: string; title: string } | null;

  // The Production stage must reflect an actual deployment, not just a merge:
  // promoting is a separate, later call than merging.
  const deploymentsQ = useQuery({
    queryKey: ["changeset-deployments", changeset?.id],
    queryFn: () => fDeployments({ data: { changesetId: changeset!.id } }),
    enabled: !!changeset?.id,
  });
  const productionDeployed = (
    (deploymentsQ.data?.deployments ?? []) as Array<{ environment: string; status: string }>
  ).some((d) => d.environment === "production" && d.status === "success");

  const invalidate = () => qc.invalidateQueries({ queryKey: ["studio-session", missionId] });

  const isLive =
    mission?.status === "running" ||
    runs.some((r) => ["queued", "running", "waiting_approval"].includes(r.status));
  const liveAction = isLive ? currentAction(runs, mission?.status === "running") : null;
  const mergeGatePending = approvals.some(
    (a) => a.status === "pending" && a.tool_name === "studio.pr.merge",
  );

  /* ---- the human ---- */
  const [me, setMe] = React.useState<{ email: string | null; name: string | null }>({
    email: null,
    name: null,
  });
  React.useEffect(() => {
    let alive = true;
    void supabase.auth.getUser().then(({ data: u }) => {
      if (!alive) return;
      setMe({
        email: u.user?.email ?? null,
        name: (u.user?.user_metadata?.full_name as string | undefined) ?? null,
      });
    });
    return () => {
      alive = false;
    };
  }, []);
  const initials = initialsFrom(me.email, me.name);

  /* ---- the call waiting on a human ---- */
  const pending = approvals.filter((a) => a.status === "pending");
  const [picked, setPicked] = React.useState<string | null>(null);
  const call = pending.find((a) => a.id === picked) ?? pending[0] ?? null;

  const decide = useMutation({
    mutationFn: (v: { id: string; decision: "approve" | "reject" }) =>
      fDecide({ data: { approvalId: v.id, decision: v.decision } }),
    onSuccess: (r, v) => {
      toast.success(
        v.decision === "approve"
          ? r.executed
            ? "Approved. It ran."
            : "Approved."
          : "Declined. Nothing ran.",
      );
      setPicked(null);
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  /* ---- the note ---- */
  const [note, setNote] = React.useState("");
  const closedReason = closedReasonFor(mission?.status);
  const steer = useMutation({
    mutationFn: () => fSteer({ data: { missionId, message: note.trim() } }),
    onSuccess: () => {
      setNote("");
      toast.success("Sent. It reads this at the next step.");
      void invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const canSend = closedReason == null && note.trim().length > 0 && !steer.isPending;

  /* ---- the title, renamed in place ---- */
  const [renaming, setRenaming] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const rename = useMutation({
    mutationFn: (title: string) => fRename({ data: { missionId, title } }),
    onSuccess: () => void invalidate(),
    onError: (e: Error) => toast.error(e.message),
  });
  const startRename = () => {
    if (!mission) return;
    setDraft(stripAutoPrefix(mission.title));
    setRenaming(true);
  };
  const commitRename = () => {
    const next = draft.trim().slice(0, 200);
    setRenaming(false);
    if (next && mission && next !== stripAutoPrefix(mission.title)) rename.mutate(next);
  };

  const [showBrief, setShowBrief] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);

  const busy = decide.isPending;

  /* ---- what it did ---- */
  const events = React.useMemo(() => {
    const out: React.ReactNode[] = [];
    for (const run of runs) {
      out.push(
        <Row
          key={run.run_id}
          marks={<AgentMark slug={BUILDER} state={markFor(run.status)} />}
          lead={
            <>
              <Who>{agentDisplayName(BUILDER)}</Who> {runPhrase(run)}
            </>
          }
          sub={
            <>
              <Num>{run.steps.length}</Num> {run.steps.length === 1 ? "step" : "steps"}
              {run.model ? <> · {run.model}</> : null}
              {run.cost_usd > 0 ? (
                <>
                  {" · "}
                  <Num>{fmtCost(run.cost_usd)}</Num>
                </>
              ) : null}
            </>
          }
          time={ago(run.last_checkpoint_at ?? run.created_at)}
        />,
      );
      run.steps.forEach((raw, i) => {
        const s: StepLike = raw;
        let lead: React.ReactNode;
        let sub: React.ReactNode = null;
        if (s.kind === "thought") {
          lead = clip(s.text ?? "");
        } else if (s.kind === "final") {
          lead = clip(s.message ?? "");
        } else {
          lead = cap(stepLabel(s));
          const detail =
            s.error ?? s.reason ?? summarizeArgs((s.args ?? {}) as Record<string, unknown>);
          if (detail && detail !== "(no args)") sub = clip(detail, 160);
        }
        if (!lead) return;
        const failedStep = s.status === "error";
        const deniedStep = s.status === "denied";
        out.push(
          <Row
            key={`${run.run_id}-${i}`}
            tight
            lead={
              failedStep ? (
                <span className="sp-fail">{lead}</span>
              ) : deniedStep ? (
                <span className="sp-warn">{lead}</span>
              ) : (
                lead
              )
            }
            sub={sub}
          />,
        );
      });
    }
    return out;
  }, [runs]);

  /* ---- the headline ---- */
  const title = mission ? stripAutoPrefix(mission.title) : null;
  const stateWord = mission ? (STATE_WORD[mission.status] ?? cap(mission.status)) : null;

  const started = startedAt(mission?.created_at);
  const sub = mission ? (
    <>
      {isLive && liveAction ? `${agentDisplayName(BUILDER)} is ${liveAction}` : stateWord}
      {started ? <> · started {started}</> : null}
      {totalCost > 0 ? (
        <>
          {" · "}
          <Num>{fmtCost(totalCost)}</Num>
        </>
      ) : null}
      {isAutoTitle(mission.title) ? " · named for you" : null}
    </>
  ) : undefined;

  /* ---- the context column ---- */
  const context = mission ? (
    <>
      <div className="sp-ctx-head">Who is on it</div>
      <div className="sp-ctx-row">
        <AgentMark
          slug={BUILDER}
          state={isLive ? "running" : mission.status === "failed" ? "failed" : "quiet"}
        />
        <span>
          <span className="sp-ctx-name">{agentDisplayName(BUILDER)}</span>
          <span className="sp-ctx-sub">{liveAction ?? stateWord}</span>
        </span>
      </div>

      {!isOrchestrator ? (
        <>
          <div className="sp-ctx-head">Where it stands</div>
          {stageLines(runs, changeset, ci, productionDeployed).map((s) => (
            <div className="sp-ctx-row" key={s.name}>
              <span>
                <span className="sp-ctx-name">{s.name}</span>
                <span className="sp-ctx-sub">{s.state}</span>
              </span>
            </div>
          ))}
        </>
      ) : null}

      {runs.length > 0 ? (
        <>
          <div className="sp-ctx-head">What it cost</div>
          <div className="sp-ctx-body">
            <Num>{fmtCost(totalCost)}</Num> across <Num>{runs.length}</Num>{" "}
            {runs.length === 1 ? "run" : "runs"} and{" "}
            <Num>{runs.reduce((n, r) => n + r.tokens, 0).toLocaleString()}</Num> tokens.
          </div>
        </>
      ) : null}

      <div className="sp-ctx-head">Finding it again</div>
      <div className="sp-ctx-body">
        <Num>{traceRef(mission.id)}</Num>
      </div>
      <Actions>
        <Button
          variant="ghost"
          onClick={() => {
            void navigator.clipboard?.writeText(mission.id);
            toast.success("Copied.");
          }}
        >
          Copy the full id
        </Button>
        {spec ? (
          <Button
            variant="ghost"
            title={spec.title}
            onClick={() => navigate({ to: "/plan/spec/$id", params: { id: spec.id } })}
          >
            Open the spec
          </Button>
        ) : null}
      </Actions>
    </>
  ) : null;

  /* ---- error and loading, each honest about which it is ---- */
  if (session.isError) {
    return (
      <Surface>
        <PageHead title="This run did not load." />
        <Failed onRetry={() => void session.refetch()}>
          {clip((session.error as Error)?.message ?? "", 200)}
        </Failed>
      </Surface>
    );
  }

  if (session.isLoading || !data || !mission) {
    return (
      <Surface>
        <PageHead title="Reading the record." />
      </Surface>
    );
  }

  return (
    <Surface context={context}>
      <PageHead
        title={
          renaming ? (
            <Input
              autoFocus
              aria-label="Name this run"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setRenaming(false);
                }
              }}
            />
          ) : (
            <span
              role="button"
              tabIndex={0}
              title="Click to rename"
              onClick={startRename}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  startRename();
                }
              }}
              style={{ cursor: "text" }}
            >
              {title}
            </span>
          )
        }
        sub={sub}
      />

      {call ? (
        <Gate question={gateQuestion(call.tool_name)} lines={gateLines(call)}>
          <Button
            variant="primary"
            disabled={busy}
            onClick={() => decide.mutate({ id: call.id, decision: "approve" })}
          >
            {approveVerb(call.tool_name)}
          </Button>
          <Button
            disabled={busy}
            onClick={() => decide.mutate({ id: call.id, decision: "reject" })}
          >
            Decline
          </Button>
        </Gate>
      ) : (
        <Gate
          question={
            isLive
              ? "Nothing needs you while it runs."
              : mission.status === "failed"
                ? "This run stopped on an error."
                : mission.status === "completed"
                  ? "This run finished on its own."
                  : `This run is ${(STATE_WORD[mission.status] ?? mission.status).toLowerCase()}.`
          }
          lines={
            isLive && liveAction
              ? [
                  <span key="doing">
                    {agentDisplayName(BUILDER)} is {liveAction}. It carries on without you.
                  </span>,
                ]
              : undefined
          }
        >
          {changeset?.pr_url ? (
            <Button
              variant="primary"
              onClick={() =>
                window.open(changeset.pr_url as string, "_blank", "noopener,noreferrer")
              }
            >
              Open the pull request
            </Button>
          ) : null}
          {mission.status === "completed" ? (
            <Button
              variant="ghost"
              onClick={() => navigate({ to: "/brain", search: { tab: "docs" } })}
            >
              See what it wrote down
            </Button>
          ) : (
            <Button variant="ghost" onClick={() => navigate({ to: "/build" })}>
              Look at the other runs
            </Button>
          )}
        </Gate>
      )}

      {pending.length > 1 ? (
        <Block title="Also waiting on you">
          {pending
            .filter((a) => a.id !== call?.id)
            .map((a) => (
              <Row
                key={a.id}
                tight
                marks={<AgentMark slug={BUILDER} state="gate" />}
                lead={gateQuestion(a.tool_name)}
                sub={<Num>{a.tool_name}</Num>}
                time={ago(a.created_at)}
                onClick={() => setPicked(a.id)}
              />
            ))}
        </Block>
      ) : null}

      {isOrchestrator ? (
        <Block title="What it did">
          <MissionOrchestratorDetail missionId={missionId} />
        </Block>
      ) : (
        <>
          <Block
            title="What it did"
            more={
              events.length > VISIBLE
                ? showAll
                  ? "Show fewer"
                  : `All ${events.length} steps`
                : undefined
            }
            onMore={() => setShowAll((v) => !v)}
          >
            {events.length === 0 ? (
              <Empty>
                Nothing has run yet. {agentDisplayName(BUILDER)} picks this up on its own and the
                steps land here as they happen.
              </Empty>
            ) : showAll ? (
              events
            ) : (
              events.slice(0, VISIBLE)
            )}
          </Block>

          <Block title="Tell it what to do next">
            {closedReason ? (
              <Empty>{closedReason}</Empty>
            ) : (
              <>
                <Textarea
                  rows={2}
                  value={note}
                  aria-label="What it should do next"
                  onChange={(e) => setNote(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canSend) {
                      e.preventDefault();
                      steer.mutate();
                    }
                  }}
                />
                <Actions>
                  <Button
                    variant={call ? "default" : "primary"}
                    disabled={!canSend}
                    onClick={() => steer.mutate()}
                  >
                    Send the note
                  </Button>
                </Actions>
              </>
            )}
            {steers.map((s) => (
              <Row
                key={s.id}
                tight
                marks={<YouMark initials={initials} mine />}
                lead={s.message}
                sub={s.consumed ? "It read this" : "Not read yet"}
                time={ago(s.created_at)}
              />
            ))}
          </Block>

          <Block>
            <div className="sp-tabs" role="tablist" aria-label="What this run produced">
              {TAB_DISPLAY.map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  className="sp-tab"
                  aria-selected={tab === id}
                  onClick={() => navigate({ search: (prev) => ({ ...prev, tab: id }) })}
                >
                  {label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: "var(--sp-space-4)" }}>
              {tab === "changes" ? (
                <ChangesPanel
                  changeset={changeset}
                  changes={changes}
                  missionId={missionId}
                  fileSetPolicy={fileSetPolicy}
                  constraints={constraints}
                />
              ) : null}
              {tab === "pr" ? (
                <EngineRoomDisclosure
                  missionId={missionId}
                  changeset={changeset}
                  ci={ci}
                  inspection={inspection}
                  mergeGatePending={mergeGatePending}
                  onRefreshed={invalidate}
                />
              ) : null}
              {tab === "preview" ? (
                <PreviewPanel missionId={missionId} changeset={changeset} isLive={isLive} />
              ) : null}
              {tab === "cost" ? <CostPanel runs={runs} total={totalCost} /> : null}
              {tab === "receipts" ? <ReceiptsPanel missionId={missionId} /> : null}
            </div>
          </Block>
        </>
      )}

      <Block
        title="What it was asked for"
        sub="The brief this run was given, word for word."
        more={showBrief ? "Hide it" : "Read it"}
        onMore={() => setShowBrief((v) => !v)}
      >
        {showBrief ? <Pre>{mission.goal}</Pre> : null}
      </Block>
    </Surface>
  );
}

export const Route = createFileRoute("/_authenticated/build/$missionId")({
  // Optional, so a dispatch surface can navigate without search; the component
  // reads a missing tab as Changes.
  validateSearch: (search: Record<string, unknown>): { tab?: Tab } => {
    const t = search.tab;
    return { tab: (TABS as string[]).includes(t as string) ? (t as Tab) : undefined };
  },
  component: BuildRun,
  head: () => ({ meta: [{ title: "Build · Supaprod" }] }),
  errorComponent: ({ error, reset }) => {
    // A stale or deleted id deep-links here. getStudioSession throws
    // "Session not found" for a missing row: render that as a real not-found,
    // never as a generic failure. An error may not wear another state's clothes.
    const message = (error as Error)?.message ?? "Unknown error";
    const missing = message === "Session not found";
    return (
      <Surface>
        <PageHead title={missing ? "There is no run at this address." : "This run did not load."} />
        {missing ? (
          <>
            <Empty>
              It was deleted, or it belongs to another workspace. What it decided and learned stays
              in the record.
            </Empty>
            <Actions>
              <Button variant="primary" onClick={reset}>
                Try again
              </Button>
            </Actions>
          </>
        ) : (
          <Failed onRetry={reset}>{clip(message, 200)}</Failed>
        )}
      </Surface>
    );
  },
});
