/**
 * Build. The spine, ported onto the rebuild primitives (step 4), same idiom as
 * Today and Ship.
 *
 * WHAT THE RETIRED VERSION WAS: a page-level TopBar with its own breadcrumb (a
 * second header, on top of the shell's), a two-tone PageHeader with an accent
 * word and a "usp" line, an ambient glow field, a presence chip, an inline
 * relay, three self-drawing "glance" cards, a card composer, a card list of
 * card rows each carrying its own badge, chip, marker and overflow menu, a
 * hand-drawn skeleton, a constellation motif and two pill rails. Nine skins on
 * one screen.
 *
 * WHAT IT IS NOW: one surface that reads top to bottom and says four things:
 *   what is running  ·  what needs you  ·  what to build next  ·  what shipped
 *
 * The one human decision here is a run that has stopped and is waiting on a
 * person, so that is the gate and it is the biggest thing on the screen. The
 * composer is the action, not the gate: it only takes the primary button when
 * nothing is waiting.
 *
 * VOICE: never greet, always report. "Mission" is a mechanism word and stays
 * out of every user-facing string on this surface; these are runs. Internal
 * identifiers (studio.*, mission_id, agent_slug 'builder') are unchanged, per
 * the standing rename convention.
 *
 * Every server function, mutation and query key is preserved: listStudioSessions
 * ["studio-sessions", showArchived] on its 5s poll, dispatchStudioSession,
 * startOrchestratedMission, listPrds ["prds"], canDispatchToRepo
 * ["repo-dispatch-check"], setStudioSessionArchived, deleteStudioSession, the
 * repo pre-check gate, the ?mission= slide-over and the ?view= lenses.
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { z } from "zod";

import { toast } from "@/lib/notify";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { buttonVariants } from "@/components/ui/button";
import { listPrds } from "@/lib/discovery.functions";
import {
  dispatchStudioSession,
  listStudioSessions,
  setStudioSessionArchived,
  deleteStudioSession,
  type StudioSessionListItem,
} from "@/lib/studio.functions";
import { DEFAULT_MODEL } from "@/lib/ai/models";
import { startOrchestratedMission } from "@/lib/orchestrator.functions";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { gateDispatch, isRepoNotConnectedError } from "@/lib/build/repo-gate";
import {
  completionEvidence,
  COMPLETION_EVIDENCE_LABEL,
  COMPLETION_EVIDENCE_REASON,
} from "@/lib/build/verification";
import { RepoGateDialog } from "@/components/studio/RepoGateDialog";
import { MissionSlideOver } from "@/components/obsidian/MissionSlideOver";
import { FleetView } from "@/components/obsidian/FleetView";
import { DelegateBoard } from "@/components/obsidian/DelegateBoard";
import { stripAutoPrefix } from "@/components/plan/format";
import {
  AgentMark,
  Block,
  Button,
  Empty,
  Gate,
  Num,
  PageHead,
  Record as RecordRecess,
  Row,
  Surface,
  Who,
  type MarkState,
} from "@/components/shell/primitives";

/* ------------------------------------------------------------------ *
 * Formatting and mapping. Local on purpose: nothing here reaches into
 * another surface's folder, so a parallel port cannot break this one.
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

function onDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

function usd(n: number | null | undefined): string | null {
  const v = n ?? 0;
  if (!v || Number.isNaN(v)) return null;
  return v < 0.01 ? `$${v.toFixed(4)}` : `$${v.toFixed(2)}`;
}

/** The first real sentence of a goal, for the gate's evidence line. */
function firstLine(text: string | null | undefined, max = 150): string | null {
  const line = (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.replace(/^#+\s*/, "").trim())
    .find((l) => l.length > 0);
  if (!line) return null;
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/**
 * Two disjoint status vocabularies feed a row: `agent_runs.status` (queued /
 * running / waiting_approval / halted / completed / failed / cancelled / done)
 * and `missions.status` (proposed / queued / running / blocked / halted /
 * cancelled / completed / completed_with_failures / failed). `blocked` is the
 * mission table's word for waiting on a human gate, and answering a gate only
 * updates the approvals table until the next resume tick, so a pending count
 * outranks every status string. An unrecognised string falls to the neutral
 * "queued", never to "done": a false Done is the one reading that lies.
 */
type RunState = "gate" | "working" | "queued" | "stopped" | "done";

const STOPPED = new Set(["failed", "halted", "cancelled", "completed_with_failures"]);

function runState(s: StudioSessionListItem): RunState {
  const status = s.run_status ?? s.status;
  if (s.pending_approvals > 0) return "gate";
  if (status === "waiting_approval" || status === "blocked" || status === "proposed") return "gate";
  if (status === "running") return "working";
  if (status === "queued") return "queued";
  if (STOPPED.has(status)) return "stopped";
  if (status === "completed" || status === "done") return "done";
  return "queued";
}

const STATE_WORD: Record<RunState, string> = {
  gate: "Waiting on you",
  working: "Building",
  queued: "Queued",
  stopped: "Stopped",
  done: "Done",
};

/** State is never a hue: the mark carries it, and the mark owns the colour. */
const MARK_STATE: Record<RunState, MarkState> = {
  gate: "gate",
  working: "running",
  queued: "quiet",
  stopped: "failed",
  done: "idle",
};

/** Rows dispatched through Build carry a real builder run, so the mark is the
 *  Engineer's. A goal run has no single author, so it stays the plain mark
 *  rather than borrowing another agent's identity. */
function markSlug(s: StudioSessionListItem): string | null {
  return s.kind === "build" ? "builder" : null;
}

/** No field primitive exists yet, so the composer's fields are styled from the
 *  same tokens rather than a new shared class (a new class would collide with
 *  every other surface being ported in parallel). */
const FIELD: React.CSSProperties = {
  width: "100%",
  background: "var(--sp-sink)",
  border: "1px solid var(--sp-line)",
  borderRadius: "var(--sp-radius-ctl)",
  padding: "10px 12px",
  color: "var(--sp-ink)",
  font: "inherit",
  fontSize: "var(--sp-text-body)",
  outline: "none",
};

const HINT: React.CSSProperties = {
  fontSize: "var(--sp-text-meta)",
  color: "var(--sp-mute)",
  lineHeight: "var(--sp-leading-body)",
};

/** A text action small enough to sit on a row's second line, where a full
 *  control would tower over it. */
const INLINE_ACTION: React.CSSProperties = {
  font: "inherit",
  background: "none",
  border: 0,
  padding: 0,
  color: "var(--sp-ink)",
  textDecoration: "underline",
  cursor: "pointer",
};

const STACK: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "var(--sp-space-2)",
};

const ACTIONS: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "var(--sp-space-2)",
  flexWrap: "wrap",
};

/** Anti-scroll: the list opens short and expands on demand. */
const VISIBLE = 8;

export const Route = createFileRoute("/_authenticated/build/")({
  component: BuildPage,
  head: () => ({ meta: [{ title: "Build · Supaprod" }] }),
  validateSearch: (search: Record<string, unknown>) =>
    z
      .object({
        mission: z.string().optional(),
        view: z.enum(["missions", "agent", "lane"]).optional(),
      })
      .parse(search),
  errorComponent: ({ error, reset }) => (
    <Surface>
      <PageHead
        title="Build did not load."
        sub={(error as Error)?.message ?? "The reason did not come back with the error."}
      />
      <Block>
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      </Block>
    </Surface>
  ),
});

/* ------------------------------------------------------------------ *
 * The composer: two doors into the same crew.
 * ------------------------------------------------------------------ */

function Composer({
  textareaRef,
  startIsPrimary,
}: {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  /** One primary per screen. When a run is waiting, the gate owns it. */
  startIsPrimary: boolean;
}) {
  const navigate = useNavigate();
  const fDispatch = useServerFn(dispatchStudioSession);
  const fCanDispatch = useServerFn(canDispatchToRepo);
  const fStartMission = useServerFn(startOrchestratedMission);
  const fPrds = useServerFn(listPrds);

  // Two entry points into the one list below. "From a spec" dispatches the
  // code-gen loop; "From a goal" is the goal-driven multi-agent run. Outcome
  // first: the goal door is the default.
  const [mode, setMode] = React.useState<"ship" | "goal">("goal");
  const [prompt, setPrompt] = React.useState("");
  const [prdId, setPrdId] = React.useState<string | null>(null);
  const [goalTitle, setGoalTitle] = React.useState("");
  const model = DEFAULT_MODEL;

  const prds = useQuery({ queryKey: ["prds"], queryFn: () => fPrds() });
  const approvedPrds = (
    (prds.data?.prds ?? []) as { id: string; title: string; status: string }[]
  ).filter((p) => p.status === "approved");
  const selectedPrd = approvedPrds.find((p) => p.id === prdId) ?? null;

  // The dispatch repo gate. Set when a dispatch cannot resolve a repo; the
  // dialog offers /sync or (with a spec picked) a starter repo plus auto retry.
  const [repoGate, setRepoGate] = React.useState<{ reason: string | null } | null>(null);

  const dispatch = useMutation({
    mutationFn: () =>
      fDispatch({
        data: {
          prompt: prompt.trim() || undefined,
          prdId: prdId ?? undefined,
          model,
        },
      }),
    onSuccess: (r) => {
      toast.success("Build started.");
      navigate({ to: "/build/$missionId", params: { missionId: r.missionId } });
    },
    onError: (e: Error) => {
      // The raw not-connected refusal becomes the gate with the real paths.
      if (isRepoNotConnectedError(e.message)) setRepoGate({ reason: e.message });
      else toast.error(e.message);
    },
  });

  // The repo pre-check is a real network wait, so it shows the same pending
  // state as the dispatch itself and blocks a second click from double-firing.
  const [checking, setChecking] = React.useState(false);
  const gatedDispatch = async () => {
    setChecking(true);
    try {
      await gateDispatch({
        check: () => fCanDispatch({ data: { prdId: prdId ?? undefined } }),
        dispatch: () => dispatch.mutate(),
        openGate: (reason) => setRepoGate({ reason }),
      });
    } finally {
      setChecking(false);
    }
  };

  const startRun = useMutation({
    mutationFn: () =>
      fStartMission({ data: { goal: prompt.trim(), title: goalTitle.trim() || undefined } }),
    onSuccess: (r) => {
      const queued = r.approvals_queued ?? 0;
      toast.success(
        queued === 0
          ? "Running."
          : queued === 1
            ? "Running. One call waits for you."
            : `Running. ${queued} calls wait for you.`,
      );
      navigate({ to: "/build/$missionId", params: { missionId: r.mission_id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const isPending = mode === "ship" ? checking || dispatch.isPending : startRun.isPending;
  const canStart =
    mode === "ship"
      ? (prompt.trim().length >= 4 || !!prdId) && !isPending
      : prompt.trim().length >= 4 && !isPending;
  const run = () => (mode === "ship" ? void gatedDispatch() : startRun.mutate());

  return (
    <>
      <div className="sp-tabs" role="tablist" aria-label="How to start">
        <button
          type="button"
          role="tab"
          className="sp-tab"
          aria-selected={mode === "goal"}
          onClick={() => setMode("goal")}
        >
          From a goal
        </button>
        <button
          type="button"
          role="tab"
          className="sp-tab"
          aria-selected={mode === "ship"}
          onClick={() => setMode("ship")}
        >
          From a spec
        </button>
      </div>

      <p style={{ ...HINT, margin: "var(--sp-space-3) 0" }}>
        {mode === "goal"
          ? "Plain language in. The crew plans the steps and runs them."
          : "An approved spec becomes a pull request on your repo."}
      </p>

      <div style={STACK}>
        {mode === "goal" ? (
          <input
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="Title (optional)"
            aria-label="Title (optional)"
            maxLength={200}
            style={FIELD}
          />
        ) : null}
        <textarea
          ref={textareaRef}
          aria-label={mode === "ship" ? "Describe what to ship" : "Describe the goal"}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && canStart) {
              e.preventDefault();
              run();
            }
          }}
          rows={3}
          placeholder={
            mode === "ship"
              ? "Describe what to ship. It plans against the connected repo."
              : "Describe the goal, for example: find the three strongest churn signals this week and draft a spec for the biggest fix."
          }
          style={{ ...FIELD, resize: "vertical", lineHeight: "var(--sp-leading-body)" }}
        />
      </div>

      <div style={{ ...ACTIONS, marginTop: "var(--sp-space-3)" }}>
        <Button
          variant={startIsPrimary ? "primary" : "default"}
          disabled={!canStart}
          onClick={run}
          // A disabled control pairs with an explanation: a dim button on its
          // own says nothing about what would unlock it.
          title={
            canStart || isPending
              ? undefined
              : mode === "ship"
                ? "Describe the work in a few words, or pick an approved spec"
                : "Describe the goal in a few words"
          }
        >
          {isPending ? "Starting" : "Start the build"}
        </Button>
        {mode === "ship" ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Pick an approved spec"
                style={{
                  ...INLINE_ACTION,
                  fontSize: "var(--sp-text-meta)",
                  color: "var(--sp-mute)",
                  maxWidth: 260,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {selectedPrd ? selectedPrd.title : "No spec picked"}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              style={{ maxHeight: 288, width: 288, overflowY: "auto" }}
            >
              <DropdownMenuItem onClick={() => setPrdId(null)}>No spec</DropdownMenuItem>
              {approvedPrds.map((p) => (
                <DropdownMenuItem key={p.id} onClick={() => setPrdId(p.id)}>
                  <span
                    style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                  >
                    {p.title}
                  </span>
                </DropdownMenuItem>
              ))}
              {/* Loading, error and empty each speak for themselves rather than
                  one of them wearing another's clothes. */}
              {prds.isLoading ? (
                <div style={{ ...HINT, padding: "6px 8px" }}>Reading approved specs</div>
              ) : prds.isError ? (
                <div style={{ ...HINT, padding: "6px 8px" }}>
                  <span className="sp-fail">The specs did not load.</span>{" "}
                  <button
                    type="button"
                    onClick={() => void prds.refetch()}
                    style={{ ...INLINE_ACTION, fontSize: "var(--sp-text-meta)" }}
                  >
                    Try again
                  </button>
                </div>
              ) : approvedPrds.length === 0 ? (
                <div style={{ ...HINT, padding: "6px 8px" }}>
                  No spec is approved yet.{" "}
                  <Link to="/plan" style={{ color: "var(--sp-ink)" }}>
                    Approve one in Plan
                  </Link>
                </div>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
      </div>

      <p style={{ ...HINT, marginTop: "var(--sp-space-3)" }}>
        Command and Enter starts it. Anything risky comes back to you first.
      </p>

      <RepoGateDialog
        open={repoGate !== null}
        prdId={prdId}
        reason={repoGate?.reason ?? null}
        onOpenChange={(o) => {
          if (!o) setRepoGate(null);
        }}
        onRetry={() => dispatch.mutate()}
      />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The surface
 * ------------------------------------------------------------------ */

function BuildPage() {
  const fList = useServerFn(listStudioSessions);
  const fArchive = useServerFn(setStudioSessionArchived);
  const fDelete = useServerFn(deleteStudioSession);
  const fCanDispatch = useServerFn(canDispatchToRepo);
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/build/" });
  const search = Route.useSearch();

  const [showArchived, setShowArchived] = React.useState(false);
  const [managing, setManaging] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<StudioSessionListItem | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement | null>(null);

  const sessions = useQuery({
    queryKey: ["studio-sessions", showArchived],
    queryFn: () => fList({ data: { includeArchived: showArchived } }),
    refetchInterval: 5000,
  });

  // The connection state is visible before Start, so "not connected" is never
  // discovered as a dispatch failure. Same cache key the composer's gate uses.
  const repoStatus = useQuery({
    queryKey: ["repo-dispatch-check"],
    queryFn: () => fCanDispatch({ data: {} }),
    staleTime: 60_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["studio-sessions"] });
  const archive = useMutation({
    mutationFn: (v: { missionId: string; archived: boolean }) => fArchive({ data: v }),
    onSuccess: (_d, v) => {
      toast.success(
        v.archived
          ? "Archived. What it decided stays on the record."
          : "Restored. What it decided stays on the record.",
      );
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (missionId: string) => fDelete({ data: { missionId } }),
    onSuccess: () => {
      toast.success("Deleted. What it decided stays on the record.");
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const rows = React.useMemo(() => sessions.data?.sessions ?? [], [sessions.data]);
  const loading = sessions.isLoading;

  const waiting = React.useMemo(
    () =>
      rows
        .filter((s) => runState(s) === "gate")
        .sort((a, b) => (a.created_at ?? "").localeCompare(b.created_at ?? "")),
    [rows],
  );
  const call = waiting[0] ?? null;
  const running = React.useMemo(() => rows.filter((s) => runState(s) === "working").length, [rows]);
  const merged = React.useMemo(
    () => rows.filter((s) => s.changeset?.status === "merged").length,
    [rows],
  );
  const spend = React.useMemo(() => rows.reduce((sum, s) => sum + (s.cost_usd ?? 0), 0), [rows]);
  /** The one receipt on this surface: a claim a person can open and check. */
  const receipt = React.useMemo(
    () => rows.find((s) => s.changeset?.status === "merged" && s.changeset?.pr_url) ?? null,
    [rows],
  );

  // The lenses and their tabs appear only once the workspace has finished a
  // run. Until then the surface is the gate and the composer, nothing else.
  const hasFinished = rows.some((s) => s.status === "completed" || s.status === "done");

  // Functional form, so opening a run from the lane lens does not discard the
  // view param (a plain object replaces the whole search state).
  const openRun = (missionId: string) =>
    navigate({ search: (prev) => ({ ...prev, mission: missionId }) });
  const closeRun = () => navigate({ search: (prev) => ({ ...prev, mission: undefined }) });
  const viewMode = hasFinished ? (search.view ?? "missions") : "missions";

  const focusComposer = () => {
    textareaRef.current?.focus();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    textareaRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  };

  // The headline is a fact assembled from real counts. It never claims a
  // number it does not have.
  const headline = React.useMemo(() => {
    if (loading) return "Reading the record.";
    if (sessions.isError) return "The runs did not load.";
    const ran =
      running === 0
        ? "Nothing is building"
        : running === 1
          ? "One run is building"
          : `${running} runs are building`;
    const needs =
      waiting.length === 0
        ? "Nothing needs you."
        : waiting.length === 1
          ? "One needs you."
          : `${waiting.length} need you.`;
    return `${ran}. ${needs}`;
  }, [loading, sessions.isError, running, waiting.length]);

  const visible = showAll ? rows : rows.slice(0, VISIBLE);

  return (
    <Surface
      context={
        <>
          {repoStatus.data ? (
            <>
              <div className="sp-ctx-head">Where builds land</div>
              <div className="sp-ctx-body">
                {repoStatus.data.repoResolvable ? (
                  (repoStatus.data.repo ?? "A connected repo.")
                ) : (
                  <>
                    No repo is connected, so a build has nowhere to open a pull request.{" "}
                    <Link to="/sync" style={{ color: "var(--sp-ink)" }}>
                      Connect one
                    </Link>
                    .
                  </>
                )}
              </div>
            </>
          ) : null}

          {waiting.length > 1 ? (
            <>
              <div className="sp-ctx-head">Behind this one</div>
              <div className="sp-ctx-body">
                <Num>{waiting.length - 1}</Num> more waiting. They keep their order until this one
                is settled.
              </div>
            </>
          ) : null}

          {spend > 0 ? (
            <>
              <div className="sp-ctx-head">What these runs cost</div>
              <div className="sp-ctx-body">
                <Num>{usd(spend)}</Num> across <Num>{rows.length}</Num>{" "}
                {rows.length === 1 ? "run" : "runs"}.
              </div>
            </>
          ) : null}
        </>
      }
    >
      <PageHead
        title={headline}
        sub={
          rows.length > 0 ? (
            <>
              <Num>{rows.length}</Num> {rows.length === 1 ? "run" : "runs"} on the record
              {merged > 0 ? (
                <>
                  {" · "}
                  <Num>{merged}</Num> merged
                </>
              ) : null}
            </>
          ) : null
        }
      />

      {loading ? null : sessions.isError ? (
        <Gate question="The runs did not load.">
          <Button variant="primary" onClick={() => void sessions.refetch()}>
            Try again
          </Button>
        </Gate>
      ) : call ? (
        <Gate
          // The stored title carries a machine "[auto]" origin prefix when the
          // loop raised it. That is provenance, not copy, and it never reaches
          // the sentence a person is asked to judge.
          question={`${stripAutoPrefix(call.title)} is waiting on you.`}
          lines={
            [
              call.pending_approvals > 0 ? (
                <span key="calls">
                  <Num>{call.pending_approvals}</Num>{" "}
                  {call.pending_approvals === 1 ? "call" : "calls"} to settle before it goes on.
                </span>
              ) : (
                <span key="calls">It stopped and cannot go on until a person answers.</span>
              ),
              firstLine(call.goal) ? <span key="goal">{firstLine(call.goal)}</span> : null,
              call.changeset ? (
                <span key="repo">
                  {call.changeset.repo}
                  {call.changeset.branch ? ` · ${call.changeset.branch}` : ""}
                </span>
              ) : null,
            ].filter(Boolean) as React.ReactNode[]
          }
        >
          <Button variant="primary" onClick={() => openRun(call.mission_id)}>
            Open the run
          </Button>
          <Button variant="ghost" onClick={() => navigate({ to: "/approvals" })}>
            See everything waiting
          </Button>
        </Gate>
      ) : (
        <Gate question="Nothing is waiting on you.">
          <Button variant="ghost" onClick={focusComposer}>
            Describe the next build
          </Button>
        </Gate>
      )}

      <Block title="Start a build">
        <Composer textareaRef={textareaRef} startIsPrimary={!call && !sessions.isError} />
      </Block>

      {hasFinished ? (
        <div className="sp-tabs" role="tablist" aria-label="How to read the work">
          {(
            [
              { id: "missions", label: "Runs" },
              { id: "agent", label: "By agent" },
              { id: "lane", label: "By lane" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              role="tab"
              className="sp-tab"
              aria-selected={viewMode === id}
              onClick={() =>
                navigate({
                  search: (prev) => ({ ...prev, view: id === "missions" ? undefined : id }),
                })
              }
            >
              {label}
            </button>
          ))}
        </div>
      ) : null}

      {viewMode === "missions" ? (
        <Block
          title={hasFinished ? undefined : "Runs"}
          more={
            rows.length > VISIBLE ? (showAll ? "Show fewer" : `All ${rows.length} runs`) : undefined
          }
          onMore={() => setShowAll((v) => !v)}
        >
          {loading ? null : sessions.isError ? (
            <Empty>The runs did not load, so this list is not the whole picture.</Empty>
          ) : rows.length === 0 ? (
            <Empty>
              {showArchived
                ? "Nothing here, archived or not. Describe the work above and the crew takes it from there."
                : "Nothing has been built here yet. Describe the work above and the crew plans the steps, writes the change, and opens the pull request."}
            </Empty>
          ) : (
            visible.map((s) => {
              const state = runState(s);
              const evidence = completionEvidence({
                claimsDone: state === "done",
                kind: s.kind,
                changesetStatus: s.changeset?.status ?? null,
                prUrl: s.changeset?.pr_url ?? null,
              });
              const files = s.changeset?.file_count ?? 0;
              const cost = usd(s.cost_usd);
              const mark = (
                <AgentMark slug={markSlug(s)} state={MARK_STATE[state]} name={s.title} />
              );
              const detail = (
                <>
                  {STATE_WORD[state]}
                  {files > 0 ? (
                    <>
                      {" · "}
                      <Num>{files}</Num> {files === 1 ? "file" : "files"}
                    </>
                  ) : null}
                  {cost ? (
                    <>
                      {" · "}
                      <Num>{cost}</Num>
                    </>
                  ) : null}
                  {evidence ? (
                    <>
                      {" · "}
                      <span
                        className={
                          evidence === "verified"
                            ? "sp-pass"
                            : evidence === "needs-verification"
                              ? "sp-warn"
                              : undefined
                        }
                        title={COMPLETION_EVIDENCE_REASON[evidence]}
                      >
                        {COMPLETION_EVIDENCE_LABEL[evidence]}
                      </span>
                    </>
                  ) : null}
                  {s.archived ? " · Archived" : null}
                </>
              );

              // Managing turns the row from a link into a shelf: it stops
              // being a button, so its two real actions can live inside it
              // without one control nested in another.
              return (
                <Row
                  key={s.mission_id}
                  marks={mark}
                  lead={<Who>{stripAutoPrefix(s.title)}</Who>}
                  sub={
                    managing ? (
                      <>
                        {detail}
                        {" · "}
                        <button
                          type="button"
                          style={INLINE_ACTION}
                          disabled={archive.isPending}
                          onClick={() =>
                            archive.mutate({ missionId: s.mission_id, archived: !s.archived })
                          }
                        >
                          {s.archived ? "Restore" : "Archive"}
                        </button>
                        {" · "}
                        <button
                          type="button"
                          style={INLINE_ACTION}
                          onClick={() => setDeleteTarget(s)}
                        >
                          Delete
                        </button>
                      </>
                    ) : (
                      detail
                    )
                  }
                  time={ago(s.updated_at)}
                  onClick={managing ? undefined : () => openRun(s.mission_id)}
                />
              );
            })
          )}

          {loading || sessions.isError ? null : (
            <div style={{ ...ACTIONS, marginTop: "var(--sp-space-3)" }}>
              <Button variant="ghost" onClick={() => setShowArchived((v) => !v)}>
                {showArchived ? "Hide archived" : "Show archived"}
              </Button>
              {rows.length > 0 ? (
                <Button variant="ghost" onClick={() => setManaging((v) => !v)}>
                  {managing ? "Done managing" : "Manage the list"}
                </Button>
              ) : null}
            </div>
          )}
        </Block>
      ) : null}

      {viewMode === "agent" ? (
        <Block>
          <FleetView />
        </Block>
      ) : null}

      {viewMode === "lane" ? (
        <Block>
          <DelegateBoard onOpenMission={openRun} />
        </Block>
      ) : null}

      {receipt?.changeset ? (
        <Block title="The last thing that shipped">
          <RecordRecess
            evidence={
              <>
                {receipt.changeset.repo}
                {receipt.changeset.pr_number ? (
                  <>
                    {" · "}
                    <a
                      href={receipt.changeset.pr_url ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "inherit" }}
                    >
                      #{receipt.changeset.pr_number}
                    </a>
                  </>
                ) : null}
                {onDate(receipt.updated_at) ? ` · ${onDate(receipt.updated_at)}` : ""}
              </>
            }
          >
            {stripAutoPrefix(receipt.title)} is merged. A pull request anyone can open backs the
            claim, so the record does not rest on a status word.
          </RecordRecess>
        </Block>
      ) : null}

      <MissionSlideOver missionId={search.mission ?? null} onClose={closeRun} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this run?</AlertDialogTitle>
            <AlertDialogDescription>
              This removes the working log and any staged files for{" "}
              <strong>{deleteTarget ? stripAutoPrefix(deleteTarget.title) : ""}</strong>. What it
              decided stays on the record. To just tidy the list, archive it instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && del.mutate(deleteTarget.mission_id)}
              disabled={del.isPending}
              className={buttonVariants({ variant: "destructive" })}
            >
              {del.isPending ? "Deleting" : "Delete the run"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Surface>
  );
}
