/**
 * Build. Redesigned from the person's session, not re-skinned
 * (docs/planning/rebuild-2026-07/SURFACE-JUSTIFICATION.md). The first pass on
 * this file was mechanical: it swapped components and kept the shape. The six
 * answers below are the design, and the code obeys them.
 *
 * a. WHO IS STANDING HERE. A product lead who wants a change made and does not
 *    want to make it. They came to hand work to the crew, and to unstick the
 *    one run that stopped and is holding the rest up.
 *
 * b. THE ONE THING THIS SURFACE EXISTS FOR. To put work into the crew's hands
 *    and to see, without opening anything, how far they have got with it.
 *    Everything else here is either serving that or was cut.
 *
 * c. KEEP / MOVE / KILL, element by element. "It was already there" is not a
 *    reason to keep.
 *    KEEP  the gate for the run that stopped. It is the one human decision on
 *          this surface, so it is the biggest thing on it.
 *    KEEP  the composer, both doors. This is where work is handed over; it is
 *          the reason a person walks in.
 *    KEEP  the run list, and the completion-evidence flag on it. That flag is
 *          the one element that calls out a Done claim with nothing behind it.
 *    KEEP  where builds land (the repo) and what these runs cost, in context.
 *          The first is the precondition for every dispatch; the second is the
 *          only place spend is totalled, and there is no spend cap in the
 *          engine yet, so the number is the only ceiling a person has.
 *    KILL  the "last thing that shipped" block, and with it the Record recess.
 *          Record is the record SPEAKING, the one lit surface in the product;
 *          a shipped-status recap is not that, and the merged run was already
 *          on the list one row up wearing its Verified flag. What was worth
 *          keeping is the outbound proof link, which moved into context: it is
 *          a supporting fact about this surface, not a decision made on it.
 *    KILL  the "By agent" lens (FleetView). It is the crew's record, and the
 *          crew's record has a surface: /crew. Two homes for one truth.
 *    KILL  the "By lane" board (DelegateBoard). Five columns of cards drawn
 *          from the same runs already listed a few pixels above it. Its ONE
 *          fact the list did not carry, how many steps of the plan are done,
 *          MOVED onto the run row, which is where the work is.
 *    KILL  the per-run cost on the row. Nothing on this surface is decided by
 *          it, and the total sits in context.
 *    KILL  the "Behind this one" context block. The headline already counts
 *          what needs you; saying it twice is the redundant-writing ban.
 *    KILL  the run title field on the goal door. The crew names its own work
 *          and the whole product already strips that auto prefix.
 *    KILL  the spec dropdown menu, for a plain labelled select. A menu that
 *          hides its own loading, error and empty states inside itself was
 *          sixty lines saying what one control says.
 *    KILL  "Show archived" as a second toggle, and the three success toasts.
 *          One Manage mode reveals archived runs and their two actions; the
 *          consequence of archiving is the row moving, which the list renders.
 *    KILL  the local FIELD / HINT / STACK / ACTIONS / INLINE_ACTION style
 *          objects. The primitives cover all five now.
 *    MOVE  the by-agent record to /crew (already live, nothing to build).
 *    MOVE  step progress onto the row (done here).
 *
 * d. ONE CLICK AWAY. A row is its title plus one different second line: who is
 *    on it, what they are doing, how far through the plan. The diff, the trace,
 *    the steps and the gates are one click into the run.
 *
 * e. DELIGHT AND CONFUSION. The delight is watching a plan you did not write
 *    fill in: you type a sentence, and within seconds a row appears saying
 *    Chief of Staff has it, then step 2 of 7, then 5 of 7. The confusion this
 *    surface used to cause was three renderings of one list behind two tabs;
 *    that is gone.
 *
 * f. WHERE THE CREW APPEARS, AND WHAT IT PROVES. Remove the agents and this
 *    surface loses its subject, not its decoration.
 *    - ATTRIBUTION. A dispatched run carries Engineer's mark and Engineer's
 *      name, which is not a guess: listStudioSessions selects that mission by
 *      agent_slug='builder'. The shipped record says Engineer wrote it, in the
 *      sentence, so the attribution survives being copied out of the app.
 *    - WORK IN MOTION, WHILE IT HAPPENS. A running row reads "Engineer is
 *      writing the change, step 4 of 8", off mission_steps through the pure
 *      missionProgress(). The mark carries the running state; state is never a
 *      hue and the mark owns the colour.
 *    - JUDGMENT LEAVES A TRACE. Starting a build used to fire "Build started."
 *      and throw you onto another page. A toast confirms that your click
 *      registered; the Commit renders what it caused. It now writes a receipt
 *      that names the agent who picked the work up, with a real arrow: the spec
 *      door creates a 'builder' run (studio.functions dispatch) and the goal
 *      door creates the mission with starting_agent_id = orchestrator. Both are
 *      read off the code paths, not assumed. A failed start still writes a
 *      receipt and goes honest in the same beat.
 *    - NOTHING OVERCLAIMS. Two gaps are left visibly empty rather than filled
 *      with something flattering, and both are reported: there is no
 *      lines-added/removed anywhere in the changeset tables, so no Diffstat is
 *      drawn; and a goal run's holder is a uuid with no client-side resolver,
 *      so it reads "The crew" rather than inventing a name.
 *
 * ONE SURFACE, NOT THREE. Handing over work, unsticking a run, and reading how
 * far it got are one two-minute session, not three destinations. What made this
 * feel like three surfaces was three renderings of one list, which is why the
 * two lens tabs are gone rather than the page being split.
 *
 * VOICE: never greet, always report. "Mission" is a mechanism word and stays
 * out of every user-facing string; these are runs. Internal identifiers
 * (studio.*, mission_id, agent_slug 'builder') are unchanged, per the standing
 * rename convention.
 *
 * Preserved: listStudioSessions on its 5s poll, dispatchStudioSession,
 * startOrchestratedMission, listPrds, canDispatchToRepo, setStudioSessionArchived,
 * deleteStudioSession, the repo pre-check gate, and the ?mission= slide-over.
 */

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as React from "react";
import { z } from "zod";

import { toast } from "@/lib/notify";
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
import { listMissions } from "@/lib/missions.functions";
import { missionProgress } from "@/lib/delegate-desk";
import { canDispatchToRepo } from "@/lib/new-build.functions";
import { gateDispatch, isRepoNotConnectedError } from "@/lib/build/repo-gate";
import {
  completionEvidence,
  COMPLETION_EVIDENCE_LABEL,
  COMPLETION_EVIDENCE_REASON,
} from "@/lib/build/verification";
import { RepoGateDialog } from "@/components/studio/RepoGateDialog";
import { MissionSlideOver } from "@/components/obsidian/MissionSlideOver";
import { stripAutoPrefix } from "@/components/plan/format";
import { agentDisplayName, agentRelayVerb } from "@/lib/agent-vocabulary";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Empty,
  Failed,
  Field,
  Gate,
  Num,
  PageHead,
  Receipt,
  Row,
  Select,
  Surface,
  Textarea,
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

function clockTime(): string {
  return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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

/** State is never a hue: the mark carries it, and the mark owns the colour. */
const MARK_STATE: Record<RunState, MarkState> = {
  gate: "gate",
  working: "running",
  queued: "quiet",
  stopped: "failed",
  done: "idle",
};

/**
 * WHO IS ON THIS ROW. A 'build' row is selected by `agent_slug='builder'`, so
 * naming Engineer is a fact rather than a guess. A goal run's holder lives in
 * `missions.current_agent_id`, a uuid with no client-reachable slug resolver,
 * so it stays "The crew": unspecific and true beats specific and invented.
 */
function actorSlug(s: StudioSessionListItem): string | null {
  return s.kind === "build" ? "builder" : null;
}
function actorName(s: StudioSessionListItem): string {
  return s.kind === "build" ? agentDisplayName("builder") : "The crew";
}
function actorVerb(s: StudioSessionListItem): string {
  return (s.kind === "build" ? agentRelayVerb("builder") : null) ?? "working";
}

/** A row's second line, one separator, one rhythm. Assembling it by hand put a
 *  double space and a stray middot into the first draft of every branch, which
 *  is what a list of facts joined by string concatenation always does. */
function Meta({ parts }: { parts: React.ReactNode[] }) {
  const kept = parts.filter(Boolean);
  return (
    <>
      {kept.map((part, i) => (
        <React.Fragment key={i}>
          {i > 0 ? " · " : null}
          {part}
        </React.Fragment>
      ))}
    </>
  );
}

/** Anti-scroll: the list opens short and expands on demand. */
const VISIBLE = 8;

/** The empty gate's "describe the next build" sends the caret here. Addressed by
 *  id rather than a ref because the Textarea primitive's prop type is
 *  TextareaHTMLAttributes, which does not carry `ref` (reported as a gap). */
const PROMPT_ID = "build-prompt";

/** What a click here left behind. Session-local: the durable record is the run
 *  itself, and a second copy of it would be a second source of one truth. */
type CommitReceipt = {
  id: string;
  verb: string;
  consequence: string;
  handoff: { slug: string } | null;
  at: string;
  failed?: boolean;
};

export const Route = createFileRoute("/_authenticated/build/")({
  component: BuildPage,
  head: () => ({ meta: [{ title: "Build · Supaprod" }] }),
  // `view` is no longer read: the two lens tabs are gone. The key stays in the
  // schema because /fleet and /delegate still redirect here carrying it, and
  // dropping it from the enum would break those two routes at type level.
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
  startIsPrimary,
  onCommit,
}: {
  /** One primary per screen. When a run is waiting, the gate owns it. */
  startIsPrimary: boolean;
  /** THE COMMIT. The start does not vanish into a toast and does not throw the
   *  person onto another page: it hands back what it caused, and who took it. */
  onCommit: (r: Omit<CommitReceipt, "at">) => void;
}) {
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
  const model = DEFAULT_MODEL;

  const prds = useQuery({ queryKey: ["prds"], queryFn: () => fPrds() });
  const approvedPrds = (
    (prds.data?.prds ?? []) as { id: string; title: string; status: string }[]
  ).filter((p) => p.status === "approved");

  // The dispatch repo gate. Set when a dispatch cannot resolve a repo; the
  // dialog offers /sync or (with a spec picked) a starter repo plus auto retry.
  const [repoGate, setRepoGate] = React.useState<{ reason: string | null } | null>(null);

  const dispatch = useMutation({
    mutationFn: () =>
      fDispatch({ data: { prompt: prompt.trim() || undefined, prdId: prdId ?? undefined, model } }),
    onSuccess: (r) => {
      // The arrow is real: this dispatch creates a run on agent_slug 'builder'.
      onCommit({
        id: r.missionId,
        verb: "You handed it over",
        consequence: "Engineer writes the change and opens a pull request. Nothing merges.",
        handoff: { slug: "builder" },
      });
      setPrompt("");
    },
    onError: (e: Error) => {
      // The raw not-connected refusal becomes the gate with the real paths; it
      // is a precondition, not a failed write, so it gets no receipt.
      if (isRepoNotConnectedError(e.message)) setRepoGate({ reason: e.message });
      else
        onCommit({
          id: `err-${Date.now()}`,
          verb: "Nothing started",
          consequence: e.message,
          handoff: null,
          failed: true,
        });
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
    mutationFn: () => fStartMission({ data: { goal: prompt.trim() } }),
    onSuccess: (r) => {
      const queued = r.approvals_queued ?? 0;
      // The arrow is real: createMission sets starting_agent_id to orchestrator.
      onCommit({
        id: r.mission_id,
        verb: "You handed it over",
        consequence:
          queued === 0
            ? "Chief of Staff plans the steps and brings back anything that needs you."
            : queued === 1
              ? "Chief of Staff planned the steps. One call already waits for you."
              : `Chief of Staff planned the steps. ${queued} calls already wait for you.`,
        handoff: { slug: "orchestrator" },
      });
      setPrompt("");
    },
    onError: (e: Error) =>
      onCommit({
        id: `err-${Date.now()}`,
        verb: "Nothing started",
        consequence: e.message,
        handoff: null,
        failed: true,
      }),
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

      <Textarea
        id={PROMPT_ID}
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
            ? "Describe what to ship. Engineer plans it against the connected repo."
            : "Describe the goal, for example: find the three strongest churn signals this week and draft a spec for the biggest fix."
        }
      />

      {mode === "ship" ? (
        <>
          <Field label="Spec">
            <Select
              value={prdId ?? ""}
              onChange={(e) => setPrdId(e.target.value || null)}
              disabled={approvedPrds.length === 0}
            >
              <option value="">No spec</option>
              {approvedPrds.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </Field>
          {/* Loading, error and empty each speak for themselves rather than one
              of them wearing another's clothes. */}
          {prds.isError ? (
            <Failed onRetry={() => void prds.refetch()}>The approved specs did not load.</Failed>
          ) : !prds.isLoading && approvedPrds.length === 0 ? (
            <Empty>
              No spec is approved yet, so describe the work instead.{" "}
              <Link to="/plan" style={{ color: "var(--sp-ink)" }}>
                Approve one in Plan
              </Link>
              .
            </Empty>
          ) : null}
        </>
      ) : null}

      <Actions>
        <Button
          variant={startIsPrimary ? "primary" : "default"}
          shortcut="⌘⏎"
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
          {isPending ? "Starting" : "Hand it over"}
        </Button>
      </Actions>

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
  const fMissions = useServerFn(listMissions);
  const fArchive = useServerFn(setStudioSessionArchived);
  const fDelete = useServerFn(deleteStudioSession);
  const fCanDispatch = useServerFn(canDispatchToRepo);
  const qc = useQueryClient();
  const navigate = useNavigate({ from: "/build/" });
  const search = Route.useSearch();

  // One mode, not two toggles. Managing reveals archived runs AND the two
  // actions on them, because they are the same job.
  const [managing, setManaging] = React.useState(false);
  const [showAll, setShowAll] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<StudioSessionListItem | null>(null);
  const [receipts, setReceipts] = React.useState<CommitReceipt[]>([]);

  const sessions = useQuery({
    queryKey: ["studio-sessions", managing],
    queryFn: () => fList({ data: { includeArchived: managing } }),
    refetchInterval: 5000,
  });

  // The connection state is visible before the hand-over, so "not connected" is
  // never discovered as a dispatch failure. Same cache key the composer's gate uses.
  const repoStatus = useQuery({
    queryKey: ["repo-dispatch-check"],
    queryFn: () => fCanDispatch({ data: {} }),
    staleTime: 60_000,
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
  const live = React.useMemo(
    () => rows.filter((s) => ["working", "queued"].includes(runState(s))).length,
    [rows],
  );
  const merged = React.useMemo(
    () => rows.filter((s) => s.changeset?.status === "merged").length,
    [rows],
  );
  const spend = React.useMemo(() => rows.reduce((sum, s) => sum + (s.cost_usd ?? 0), 0), [rows]);
  /** The one claim on this surface a sceptic can click out of the product and
   *  check for themselves. It is a supporting fact, not a decision made here,
   *  so it sits in context rather than taking a block of its own. */
  const shipped = React.useMemo(
    () => rows.find((s) => s.changeset?.status === "merged" && s.changeset?.pr_url) ?? null,
    [rows],
  );

  // HOW FAR THROUGH THE PLAN. The one fact the retired lane board carried that
  // the list did not, taken off the board and put on the row. missionProgress
  // is the same pure, unit-verified function the board used, so the done-status
  // vocabulary is not re-invented here. It only polls while something is live.
  const plan = useQuery({
    queryKey: ["build", "plan-progress"],
    queryFn: () => fMissions({ data: {} }),
    enabled: rows.length > 0,
    refetchInterval: live > 0 ? 5000 : false,
  });
  const progressById = React.useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    for (const m of plan.data?.missions ?? []) map.set(m.id, missionProgress(m.steps));
    return map;
  }, [plan.data]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["studio-sessions"] });
  // No success toast on either: archiving moves the row and deleting removes
  // it, and the list rendering that IS the consequence. A failure has nowhere
  // on a row to render, so it still speaks.
  const archive = useMutation({
    mutationFn: (v: { missionId: string; archived: boolean }) => fArchive({ data: v }),
    onSuccess: invalidate,
    onError: (e: Error) => toast.error(e.message),
  });
  const del = useMutation({
    mutationFn: (missionId: string) => fDelete({ data: { missionId } }),
    onSuccess: () => {
      setDeleteTarget(null);
      invalidate();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  // Functional form, so opening a run does not discard the rest of the search.
  const openRun = (missionId: string) =>
    navigate({ search: (prev) => ({ ...prev, mission: missionId }) });
  const closeRun = () => navigate({ search: (prev) => ({ ...prev, mission: undefined }) });

  const focusComposer = () => {
    const el = document.getElementById(PROMPT_ID);
    if (!el) return;
    el.focus();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
  };

  const commit = (r: Omit<CommitReceipt, "at">) => {
    setReceipts((prev) => [{ ...r, at: clockTime() }, ...prev]);
    // The row is the other half of the consequence, so do not make the person
    // wait up to five seconds for the poll to prove the click did something.
    if (!r.failed) void invalidate();
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

          {shipped?.changeset ? (
            <>
              <div className="sp-ctx-head">The last one that landed</div>
              <div className="sp-ctx-body">
                {agentDisplayName("builder")} wrote it and it is merged into{" "}
                {shipped.changeset.repo}
                {shipped.changeset.pr_number ? (
                  <>
                    {" · "}
                    <a
                      href={shipped.changeset.pr_url ?? undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "var(--sp-ink)" }}
                    >
                      #{shipped.changeset.pr_number}
                    </a>
                  </>
                ) : null}
                {onDate(shipped.updated_at) ? ` · ${onDate(shipped.updated_at)}` : ""}
              </div>
            </>
          ) : null}

          {spend > 0 ? (
            <>
              <div className="sp-ctx-head">What these runs cost</div>
              <div className="sp-ctx-body">
                <Num>{usd(spend)}</Num> across <Num>{rows.length}</Num>{" "}
                {rows.length === 1 ? "run" : "runs"}. Nothing caps this yet.
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
          {waiting.length > 1 ? (
            <Button variant="ghost" onClick={() => navigate({ to: "/approvals" })}>
              Settle all {waiting.length}
            </Button>
          ) : null}
        </Gate>
      ) : (
        <Gate question="Nothing is waiting on you.">
          <Button variant="ghost" onClick={focusComposer}>
            Describe the next build
          </Button>
        </Gate>
      )}

      <Block title="Hand work over" sub="Anything risky comes back to you before it happens.">
        <Composer startIsPrimary={!call && !sessions.isError} onCommit={commit} />
      </Block>

      {receipts.length > 0 ? (
        <Block title="What you set in motion">
          {receipts.map((r, i) => (
            <Receipt
              key={`${r.id}-${i}`}
              verb={r.verb}
              consequence={r.consequence}
              handoff={r.handoff}
              time={r.at}
              failed={r.failed}
            />
          ))}
        </Block>
      ) : null}

      <Block
        title="Runs"
        sub={
          managing
            ? "Archived runs are included. What a run decided stays on the record."
            : undefined
        }
        more={rows.length > VISIBLE ? (showAll ? "Show fewer" : `All ${rows.length}`) : undefined}
        onMore={() => setShowAll((v) => !v)}
      >
        {loading ? null : sessions.isError ? (
          // "Nothing here" and "we could not find out" are different facts and
          // a person acts differently on each, so they never share a shape.
          <Failed onRetry={() => void sessions.refetch()}>
            The runs did not load, so this list is not the whole picture.
          </Failed>
        ) : rows.length === 0 ? (
          <Empty>
            Nothing has been built here yet. Describe the work above and the crew plans the steps,
            writes the change, and opens the pull request.
          </Empty>
        ) : (
          visible.map((s) => {
            const state = runState(s);
            const files = s.changeset?.file_count ?? 0;
            const p = progressById.get(s.mission_id);
            const steps =
              p && p.total > 0 ? (
                <>
                  step <Num>{p.done}</Num> of <Num>{p.total}</Num>
                </>
              ) : null;
            const evidence = completionEvidence({
              claimsDone: state === "done",
              kind: s.kind,
              changesetStatus: s.changeset?.status ?? null,
              prUrl: s.changeset?.pr_url ?? null,
            });

            // ONE second line, carrying a DIFFERENT fact from the title: who is
            // on it, what they are doing, how far through the plan they are.
            const sub: React.ReactNode[] =
              state === "working"
                ? [
                    <>
                      <Who>{actorName(s)}</Who> is {actorVerb(s)}
                    </>,
                    steps,
                  ]
                : state === "gate"
                  ? [
                      "Waiting on you",
                      s.pending_approvals > 0 ? (
                        <>
                          <Num>{s.pending_approvals}</Num>{" "}
                          {s.pending_approvals === 1 ? "call" : "calls"}
                        </>
                      ) : null,
                    ]
                  : state === "stopped"
                    ? [steps ? <>Stopped at {steps}</> : "Stopped"]
                    : state === "queued"
                      ? [`Queued for ${actorName(s).toLowerCase()}`]
                      : [
                          <>
                            <Who>{actorName(s)}</Who> finished
                          </>,
                          files > 0 ? (
                            <>
                              <Num>{files}</Num> {files === 1 ? "file" : "files"}
                            </>
                          ) : null,
                          // The one element that calls out a Done claim with
                          // nothing behind it. Its reason is the tooltip.
                          evidence ? (
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
                          ) : null,
                        ];

            // Managing turns the row from a link into a shelf: it stops being a
            // button, so its two actions can live inside it without one control
            // nested in another.
            if (s.archived) sub.push("Archived");
            if (managing) {
              sub.push(
                <button
                  type="button"
                  className="sp-block-more"
                  disabled={archive.isPending}
                  onClick={() => archive.mutate({ missionId: s.mission_id, archived: !s.archived })}
                >
                  {s.archived ? "Restore" : "Archive"}
                </button>,
                <button type="button" className="sp-block-more" onClick={() => setDeleteTarget(s)}>
                  Delete
                </button>,
              );
            }

            return (
              <Row
                key={s.mission_id}
                tight
                marks={<AgentMark slug={actorSlug(s)} state={MARK_STATE[state]} name={s.title} />}
                lead={stripAutoPrefix(s.title)}
                sub={<Meta parts={sub} />}
                time={ago(s.updated_at)}
                onClick={managing ? undefined : () => openRun(s.mission_id)}
              />
            );
          })
        )}

        {loading || sessions.isError || rows.length === 0 ? null : (
          <Actions>
            <Button variant="ghost" onClick={() => setManaging((v) => !v)}>
              {managing ? "Done" : "Manage"}
            </Button>
          </Actions>
        )}
      </Block>

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
