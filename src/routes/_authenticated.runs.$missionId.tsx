/**
 * Build, one run in detail. REDESIGNED, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype DOES draw this screen (PROTOTYPE-v2.html #s-run), so where it
 * decided something this file follows it: the headline plus one contract line,
 * "What happened, in order" as an attribution ledger that OPENS WITH YOUR OWN
 * ASK, the change stated as a diffstat before any panel, and a context column
 * that answers this run / what happens next rather than listing statistics.
 *
 * ------------------------------------------------------------------ *
 * a. WHO IS STANDING HERE. A product lead who asked for a change and came back
 *    to find out whether the crew actually made it, and whether anything now
 *    needs their call. One person, one run, two minutes.
 *
 * b. THE ONE THING THIS SURFACE EXISTS FOR. To make the one call this run
 *    cannot make for itself, on the evidence of what the crew actually did.
 *    Everything else is supporting that or is gone.
 *
 * c. KEEP / MOVE / KILL, on every element that was here:
 *    KEEP  the Gate. It is the one call, and it is the reason the page exists.
 *    KEEP  "Also waiting on you". A second pending call must not hide behind
 *          the first.
 *    KEEP  the ledger of runs and steps: this is the evidence, and it is the
 *          only place it is assembled.
 *    KEEP  the steer note. It is how you correct the crew WITHOUT stopping it,
 *          which is the governance canon expressed as a control, and it has no
 *          other home.
 *    KEEP  the stage lines (code / pull request / checks / production). Run
 *          scoped, plain words, and the shell's seven-stage strip does not say
 *          any of it.
 *    KEEP  Changes, Preview and Receipts, behind one tab row. A tab row is an
 *          ANTI-scroll device here: three views of one artifact in one screen
 *          height. Stacking them as blocks would have made the page longer,
 *          which is the pain point the founder named twice.
 *    KILL  the click-to-rename h1. An unlabelled affordance that swallows the
 *          page's own title, for a housekeeping job nobody came here to do.
 *          It MOVES to /build, the run list, where you organise runs. Reported
 *          as a gap: it is not wired there yet.
 *    KILL  the "named for you" suffix, the model id on each run row, and the
 *          "N steps · model · cost" meta rail. Four unrelated facts under a
 *          headline is a stat dump, not a sentence.
 *    KILL  the fallback Gate ("Nothing needs you while it runs") and its two
 *          navigation buttons. A Gate with no question is a status banner
 *          wearing the biggest component on the surface; the state now sits in
 *          the headline's second line where one line does the job, and the rail
 *          already goes to Brain and to the other runs.
 *    KILL  the Cost tab. Every number in it is already on the surface twice:
 *          the total in the context column, the per run figure on each run row.
 *    KILL  the "What it was asked for" block and its toggle. The brief MOVES
 *          into the context column, verbatim, where the detail for the one item
 *          in focus belongs, and the ledger's first row carries the gist.
 *    KILL  the "Copy the full id" button. The URL is the full id; the short ref
 *          stays, selectable, for pasting into a message.
 *    KILL  every toast on this surface. See THE COMMIT below.
 *    KILL  the model's thought steps from the default ledger. What the crew DID
 *          and what it SAID may not share a treatment (agent doctrine §7); a
 *          narration row rendered identically to a tool receipt is how a
 *          sceptic decides none of it is real. They return, quoted, behind the
 *          one "Everything it did and said" control.
 *    MOVE  the Pull request tab (EngineRoomDisclosure: check runs, inspection,
 *          merge disclosure) to /engine-room. It is named for the room it
 *          belongs to. What a PM needs from it is the verdict, and the verdict
 *          is already one plain word in "Where it stands".
 *
 * d. ONE CLICK AWAY, not on the surface: the diff itself (Changes tab), the
 *    built output (Preview), the provenance chain (Receipts), the check runs
 *    (Engine Room), the thinking behind each act (one control on the ledger),
 *    the pull request (the block's own action).
 *
 * e. DELIGHT / CONFUSION. The moment is the ledger opening with YOUR line -
 *    "You asked for it, 09:02" - and then the crew's work landing under it in
 *    order, with the live row's mark still lit. You watch your sentence become
 *    a diff. What would confuse: a step list where the machine's musing looks
 *    exactly like a commit, and a surface that goes silent between polls. Both
 *    are answered: quotes separate the registers, and the run row carries the
 *    silence age from last_checkpoint_at, which is the single highest-trust
 *    detail available here.
 *
 * f. WHERE THE CREW APPEARS, AND WHAT IT PROVES. Remove the agents and this
 *    surface is empty, not merely plainer.
 *    - Attribution on EVERY row, and NEVER a name the record does not hold.
 *      The ledger's step rows used to carry no mark at all, so the majority of
 *      this page's rows were work with nobody attached to it. Each act now
 *      carries the holder's mark; your ask and your notes carry yours.
 *      The holder is resolved once, from the run's kind, through the same
 *      run-state.ts mapping the run LIST uses: Engineer on a 'build' session,
 *      because getStudioSession selects those runs by agent_slug='builder',
 *      and "The crew" on a goal-run, whose holder is a uuid this client cannot
 *      resolve to a name. This page used to hardcode Engineer onto both, which
 *      credited a build agent that was never in the run. Attribution is the
 *      proof of the product; an invented one is the one claim it cannot afford.
 *    - Work in motion, while it happens: exactly one running mark on the page
 *      (the live run and its latest act), the live phrase in the headline and
 *      in the context column, and the silence age. It stops the moment the run
 *      does. The word "thinking" never appears - that is the word that turns a
 *      worker into a chatbot.
 *    - Judgment leaves a trace: THE COMMIT, below.
 *    - Nothing overclaims: consequence and reversibility copy is read verbatim
 *      from tool-consequences.ts, which is static per tool and not model
 *      output. "Nothing merges itself" is a statement of HIGH_RISK_FORCE_REVIEW,
 *      which really does contain studio.pr.merge. Where a fact is not in the
 *      data it is not drawn.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10 and §9). Approving here used
 * to fire toast.success("Approved. It ran.") and the call vanished; sending a
 * note fired another toast. A toast confirms that your click REGISTERED; a
 * receipt renders what your click CAUSED. Both actions now write a receipt:
 *   - the consequence is the tool's own static effect line, per tool, never a
 *     generic confirmation;
 *   - the handoff arrow to Engineer is drawn ONLY when decideApproval returns
 *     executed:true, which means the tool genuinely ran, or when a note lands
 *     while a run is alive to read it. Otherwise no arrow and the line says
 *     what changed instead. Never an arrow to nowhere;
 *   - a failed write still writes a receipt and goes honest immediately. Never
 *     a success shape over a failed write.
 *
 * BEHAVIOUR OTHERWISE UNCHANGED. Same query keys (["studio-session", missionId],
 * ["changeset-deployments", id]), same 4s live polling contract, same steer
 * mutation with the same command-Enter, same approval decision call, same
 * orchestrator-kind branch. User-facing name is Build; internal identifiers
 * intentionally stay studio.* (CLAUDE.md rename-disclaimer).
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { usePublishRunStrip } from "@/components/shell/run-strip";
import { getRunStages } from "@/lib/run-stages.functions";
import { StagePanel } from "@/components/runs/stages/StagePanel";
import type { AgentStation } from "@/lib/agent-vocabulary";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { supabase } from "@/integrations/supabase/client";
import { stepLabel } from "@/lib/agent-vocabulary";
import { REVERSIBILITY_LABEL, toolConsequence } from "@/lib/tool-consequences";
import { stripAutoPrefix } from "@/components/plan/format";
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
import { listDeployments } from "@/lib/deployments.functions";
import { getDesignParity } from "@/lib/design-parity.functions";
import { ChangesPanel } from "@/components/studio/ChangesPanel";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import { ReceiptsPanel } from "@/components/studio/ReceiptsPanel";
import { MissionOrchestratorDetail } from "@/components/missions/MissionOrchestratorDetail";
import { fmtCost, summarizeArgs } from "@/components/studio/studio-format";
import { traceRef } from "@/components/discover/format";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  CtxBody,
  Diffstat,
  Empty,
  Failed,
  Gate,
  Num,
  PageHead,
  Receipt,
  Row,
  Surface,
  Textarea,
  Who,
  YouMark,
  type MarkState,
} from "@/components/shell/primitives";
import { AgentPulse } from "@/components/shell/AgentPulse";
import { actorName, actorSlug, actorVerb } from "@/components/runs/run-state";

/** The three views this run's output is worth looking at. */
type Tab = "changes" | "preview" | "receipts";
const TAB_DISPLAY: [Tab, string][] = [
  ["changes", "Changes"],
  ["preview", "Preview"],
  ["receipts", "Receipts"],
];

/** Old deep links, and the /studio/$missionId redirect stub, still carry
 *  ?tab=pr and ?tab=cost. Pull request moved to Engine Room and Cost was
 *  removed, so those values are still ACCEPTED and read as the nearest
 *  surviving view. A link that used to work does not get to break. */
type SearchTab = Tab | "pr" | "cost";
const SEARCH_TABS: SearchTab[] = ["changes", "preview", "receipts", "pr", "cost"];
function readTab(t: SearchTab | undefined): Tab {
  return t === "preview" || t === "receipts" ? t : "changes";
}

/** How many ledger rows open before the block offers the rest. */
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
  added_lines: number;
  removed_lines: number;
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

/** What a click caused, held for the rest of the session. Session local on
 *  purpose: the durable record is the run itself, and a second copy of it here
 *  would be a second source of the same truth. */
type Mark = {
  key: string;
  verb: string;
  consequence: React.ReactNode;
  at: string;
  handoff: boolean;
  failed?: boolean;
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

function clock(): string {
  return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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

/** What the crew is doing, in plain words. NEVER "thinking": that is the word
 *  that turns a worker into a chatbot, and stepLabel returns it for a thought
 *  step, so a thought falls back to the holder's own relay verb instead.
 *
 *  The verb is PASSED IN rather than looked up here, because this file used to
 *  hold the builder slug as a constant and reached for it from module scope.
 *  Only the component knows which kind of run this is, so only the component
 *  can say whose verb it is. See `actorVerb` in runs/run-state.ts. */
function actionOf(step: StepLike | undefined, holderVerb: string): string {
  if (step && step.kind === "tool_call") return stepLabel(step);
  return holderVerb;
}

/** What the run is doing, in the agent's own voice. Present tense while it is
 *  alive, past tense once it is not. */
function runPhrase(run: StudioRunDetail, holderVerb: string): string {
  if (run.status === "running") {
    return `is ${actionOf(run.steps[run.steps.length - 1], holderVerb)}`;
  }
  if (run.status === "queued") return "is waiting to start";
  if (run.status === "waiting_approval") return "is waiting on you";
  if (run.status === "completed") return "finished";
  if (run.status === "failed") return "stopped on an error";
  if (run.status === "halted") return "was stopped";
  return run.status;
}

/** The live caption. When no run is alive but the mission still is, say so
 *  rather than going quiet: continuous feedback, never dead air. */
function currentAction(
  runs: StudioRunDetail[],
  missionLive: boolean,
  holderVerb: string,
): string | null {
  const liveRun = [...runs].reverse().find((r) => r.status === "running" || r.status === "queued");
  if (!liveRun) return missionLive ? "lining up the next run" : null;
  return actionOf(liveRun.steps[liveRun.steps.length - 1], holderVerb);
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

/** The change, stated before any panel is opened. LINES, which is how a diff is
 *  read everywhere else a person has ever seen one.
 *
 *  This used to sum the character delta per file, and said so honestly, because
 *  getStudioSession reduced each file to base_chars/new_chars before sending it
 *  and characters were the only unit left. They were also the wrong unit: a line
 *  rewritten to the same length nets to zero, and so do two lines swapped. The
 *  server now runs the same LCS alignment the Changes tab renders its hunks
 *  from, so this reads real counts and the headline cannot disagree with the
 *  hunks one click underneath it. */
function diffOf(changes: ChangeRow[]): { added: number; removed: number; files: number } {
  let added = 0;
  let removed = 0;
  for (const c of changes) {
    added += c.added_lines;
    removed += c.removed_lines;
  }
  return { added, removed, files: changes.length };
}

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

/** One line of the context column: an optional mark, a name, and a second line
 *  that carries DIFFERENT information. Local, because the same six lines of
 *  markup were being retyped for every context row on this surface. */
function CtxRow({
  mark,
  name,
  sub,
}: {
  mark?: React.ReactNode;
  name: React.ReactNode;
  sub: React.ReactNode;
}) {
  return (
    <div className="sp-ctx-row">
      {mark}
      <span>
        <span className="sp-ctx-name">{name}</span>
        <span className="sp-ctx-sub">{sub}</span>
      </span>
    </div>
  );
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

/** What it does and whether it can be undone, read VERBATIM from the static
 *  per-tool table. Never a paraphrase: this is a safety property, and the
 *  claim may not outrun the wiring. The agent's own reasoning sits beneath,
 *  in quotes, because a claim is not a receipt. */
function gateLines(a: StudioApproval, holder: string): React.ReactNode[] {
  const c = toolConsequence(a.tool_name);
  const lines: React.ReactNode[] = [
    <span key="effect">{c.effect}</span>,
    <span key="undo">
      {REVERSIBILITY_LABEL[c.reversible]}. {c.undo}
    </span>,
  ];
  if (a.rationale) {
    lines.push(
      <span key="why">
        {holder} says: &ldquo;{clip(a.rationale, 200)}&rdquo;
      </span>,
    );
  }
  const args = summarizeArgs((a.args ?? {}) as Record<string, unknown>);
  if (args && args !== "(no args)") {
    lines.push(
      <span key="args">
        <Num>{clip(args, 140)}</Num>
      </span>,
    );
  }
  return lines;
}

/* ------------------------------------------------------------------ *
 * The surface
 * ------------------------------------------------------------------ */

function BuildRun() {
  const { missionId } = Route.useParams();
  const tab = readTab(Route.useSearch().tab);
  const navigate = useNavigate({ from: "/runs/$missionId" });
  const qc = useQueryClient();

  const fGet = useServerFn(getStudioSession);
  const fSteer = useServerFn(steerStudioSession);
  const fDecide = useServerFn(decideApproval);
  const fDeployments = useServerFn(listDeployments);
  const fParity = useServerFn(getDesignParity);

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

  /**
   * Did the returning work honour the design contract it was handed.
   *
   * Read once the mission exists and cached, because parity is computed from
   * the changeset's recorded text rather than from anything live: re-reading it
   * on the 4s run poll would spend a request per tick to answer a question that
   * only changes when a changeset returns.
   */
  const parity = useQuery({
    queryKey: ["design-parity", missionId],
    queryFn: () => fParity({ data: { missionId } }),
    enabled: Boolean(missionId),
    staleTime: 5 * 60_000,
  });

  const data = session.data;
  // A mission with no build-agent run is an orchestrator goal-run, not a build
  // session: it has no changeset, no PR and no diff, so it renders its own body.
  const isOrchestrator = data?.kind === "mission";
  /* WHO THIS PAGE IS ALLOWED TO NAME, read from the SAME mapping the run
   * list reads (runs/run-state.ts) so one run cannot be Engineer here and
   * The crew one click back.
   *
   * THE DEFECT THIS REPLACES: this file held `const BUILDER = "builder"` and
   * spent it unconditionally on the headline, on "Who is on it", on "What
   * happens next", on every ledger row and on every receipt. `getStudioSession`
   * selects runs by `agent_slug='builder'`, so that is a fact for a 'build'
   * session and an invention for every other one. "From a goal" is the default
   * composer door, so most runs ARE the other one: orchestrator goal-runs with
   * no build agent in them at all, whose holder is `missions.current_agent_id`,
   * a uuid with no client-reachable slug resolver and never something to print.
   * Attribution is the proof of the whole product, so where the worker cannot
   * be resolved this says "The crew" and stops there. */
  const holder = actorName(data?.kind);
  const holderSlug = actorSlug(data?.kind);
  const holderVerb = actorVerb(data?.kind);
  const mission = (data?.mission ?? null) as MissionRow | null;
  const runs = (data?.runs ?? []) as StudioRunDetail[];
  const changeset = (data?.changeset ?? null) as
    (StudioChangesetSummary & { base_sha?: string | null; updated_at?: string | null }) | null;
  const changes = (data?.changes ?? []) as ChangeRow[];
  const fileSetPolicy = (data?.fileSetPolicy ?? null) as StudioFileSetPolicy | null;
  const constraints = (data?.constraints ?? null) as StudioConstraints;
  const approvals = (data?.approvals ?? []) as StudioApproval[];
  const ci = (data?.ci ?? null) as StudioCi;
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

  /* ---- the seven stages of this run ----
   * A run is the whole lifecycle, not the build leg: missions.current_agent_id
   * can be any of the thirteen agents, and this component already branched to
   * MissionOrchestratorDetail for runs with no builder in them at all. The
   * route was called /build until 2026-07-29 purely as a leftover of the
   * Builder -> Studio -> Build rename, and that name was telling people the
   * spine covered one stage of seven.
   *
   * getRunStages walks the record for the other six. It is deliberately allowed
   * to come back empty: a stage with no row behind it says so rather than
   * borrowing its neighbour's fact. */
  const fStages = useServerFn(getRunStages);
  const stagesQ = useQuery({
    queryKey: ["run-stages", missionId],
    queryFn: () => fStages({ data: { missionId } }),
    // Follows the session's own cadence: while anything is live the lineage can
    // change under you (a PR opens, an outcome lands), and when it is not, it
    // cannot.
    refetchInterval:
      mission?.status === "running" ||
      runs.some((r) => ["queued", "running", "waiting_approval"].includes(r.status))
        ? 8000
        : false,
  });

  // Which stage the work region is showing. Null means "follow the run", so the
  // screen opens on whatever needs a human, else whatever is moving, else the
  // furthest stage that actually happened. Once you pick, your pick holds.
  const [pickedStage, setPickedStage] = React.useState<AgentStation | null>(null);
  const stages = stagesQ.data?.stages ?? null;

  /* AUTO-FOCUS IS A LANDING, NOT A SUBSCRIPTION.
   *
   * THE DEFECT: `stage` used to read `stagesQ.data?.focus` straight through on
   * every render. The session query paints the Build body first and this one
   * lands about a second later, and `getRunStages` puts focus on ship or learn
   * for any merged changeset, which is every successful run. So the person
   * watched the ledger, the steer box and the diff vanish a second after they
   * appeared, with no message and nothing they did to cause it. Reading it
   * through also meant every 8s refetch could move the region again, out from
   * under someone mid-read.
   *
   * So the landed focus is copied into state exactly once, on the first settle,
   * and the copy is what the region follows. `prev ?? landed` is the whole
   * guard: after the first write there is nothing left for a refetch to change.
   * Until it lands, `stage` stays "build", which is the body already on screen.
   */
  const [landedFocus, setLandedFocus] = React.useState<AgentStation | null>(null);
  const focus = stagesQ.data?.focus ?? null;
  React.useEffect(() => {
    if (!focus) return;
    setLandedFocus((prev) => prev ?? focus);
  }, [focus]);

  const stage: AgentStation = pickedStage ?? landedFocus ?? "build";

  usePublishRunStrip(stages ? { stages, active: stage, onSelect: (s) => setPickedStage(s) } : null);

  const isLive =
    mission?.status === "running" ||
    runs.some((r) => ["queued", "running", "waiting_approval"].includes(r.status));
  const liveAction = isLive ? currentAction(runs, mission?.status === "running", holderVerb) : null;

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

  /* ---- THE COMMIT: what your calls caused, this session ---- */
  const [receipts, setReceipts] = React.useState<Mark[]>([]);
  const addReceipt = React.useCallback((m: Mark) => setReceipts((r) => [m, ...r]), []);

  /* ---- the call waiting on a human ---- */
  const pending = approvals.filter((a) => a.status === "pending");
  const [picked, setPicked] = React.useState<string | null>(null);
  const call = pending.find((a) => a.id === picked) ?? pending[0] ?? null;

  const decide = useMutation({
    mutationFn: (v: { id: string; tool: string; decision: "approve" | "reject" }) =>
      fDecide({ data: { approvalId: v.id, decision: v.decision } }),
    // No toast. The receipt IS the confirmation, and it says what the click
    // CAUSED rather than that it registered. The arrow is drawn only when the
    // tool genuinely ran; otherwise the line says what changed instead.
    onSuccess: (r, v) => {
      const c = toolConsequence(v.tool);
      addReceipt({
        key: `${v.id}-${Date.now()}`,
        verb: v.decision === "approve" ? "You approved" : "You declined",
        consequence:
          v.decision === "approve"
            ? r.executed
              ? c.effect
              : "Nothing ran. The run had already moved on."
            : "Nothing ran, and the run carries on without it.",
        at: clock(),
        handoff: v.decision === "approve" && r.executed === true,
      });
      setPicked(null);
      void invalidate();
    },
    // A failed write still writes a receipt, and it goes honest immediately.
    // Never a success shape over a failed write: that is the one thing that
    // makes the successful ones trustworthy.
    onError: (e: Error, v) =>
      addReceipt({
        key: `${v.id}-${Date.now()}`,
        verb: "Nothing was recorded",
        consequence: clip(e.message, 200),
        at: clock(),
        handoff: false,
        failed: true,
      }),
  });

  /* ---- the note ---- */
  const [note, setNote] = React.useState("");
  const closedReason = closedReasonFor(mission?.status);
  const steer = useMutation({
    mutationFn: () => fSteer({ data: { missionId, message: note.trim() } }),
    onSuccess: () => {
      setNote("");
      addReceipt({
        key: `steer-${Date.now()}`,
        verb: "You sent a note",
        consequence: isLive
          ? `${holder} reads it at its next step.`
          : "It waits for the next run to read it.",
        at: clock(),
        handoff: isLive,
      });
      void invalidate();
    },
    onError: (e: Error) =>
      addReceipt({
        key: `steer-${Date.now()}`,
        verb: "The note was not sent",
        consequence: clip(e.message, 200),
        at: clock(),
        handoff: false,
        failed: true,
      }),
  });
  const canSend = closedReason == null && note.trim().length > 0 && !steer.isPending;

  const [showAll, setShowAll] = React.useState(false);

  const busy = decide.isPending;

  /* ---- what happened, in order ----
   * Every row carries a mark: yours on your ask and your notes, Engineer's on
   * its acts. A row with no mark is a surface pretending the work did itself.
   * Thoughts are what it SAID, so they are quoted and hidden by default. */
  const hasThoughts = runs.some((r) => r.steps.some((s) => (s as StepLike).kind === "thought"));

  const ledger = React.useMemo(() => {
    const out: React.ReactNode[] = [];
    if (mission) {
      out.push(
        <Row
          key="asked"
          tight
          marks={<YouMark initials={initials} mine />}
          lead="You asked for it"
          sub={clip(mission.goal, 150)}
          time={ago(mission.created_at)}
        />,
      );
    }
    for (const run of runs) {
      const alive = run.status === "running" || run.status === "queued";
      out.push(
        <Row
          key={run.run_id}
          marks={<AgentMark slug={holderSlug} name={holder} state={markFor(run.status)} />}
          lead={
            <>
              <Who>{holder}</Who> {runPhrase(run, holderVerb)}
            </>
          }
          sub={
            <>
              <Num>{run.steps.length}</Num> {run.steps.length === 1 ? "step" : "steps"}
              {alive && ago(run.last_checkpoint_at) ? (
                <> · no step for {ago(run.last_checkpoint_at)}</>
              ) : null}
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
      const last = run.steps.length - 1;
      run.steps.forEach((raw, i) => {
        const s: StepLike = raw;
        const isThought = s.kind === "thought";
        if (isThought && !showAll) return;
        let lead: React.ReactNode;
        let sub: React.ReactNode = null;
        if (isThought) {
          const text = clip(s.text ?? "", 160);
          if (!text) return;
          // SAID, never DID. Quotation marks are the whole differentiator, and
          // they survive grayscale, a screen reader and a copy-paste.
          lead = <>&ldquo;{text}&rdquo;</>;
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
            marks={
              <AgentMark
                slug={holderSlug}
                name={holder}
                state={
                  failedStep ? "failed" : alive && i === last && !isThought ? "running" : "quiet"
                }
              />
            }
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
  }, [runs, mission, initials, showAll, holder, holderSlug, holderVerb]);

  /* ---- the headline: the state, and whose run this is ---- */
  const title = mission ? stripAutoPrefix(mission.title) : null;
  const stateWord = mission ? (STATE_WORD[mission.status] ?? cap(mission.status)) : null;
  const started = startedAt(mission?.created_at);
  const sub = mission ? (
    <>
      {isLive && liveAction ? `${holder} is ${liveAction}` : stateWord}
      {started ? <> · you asked for this {started}</> : null}
    </>
  ) : undefined;

  /* ---- the context column: this run, and what happens next ---- */
  const diff = diffOf(changes);
  const stepTotal = runs.reduce((n, r) => n + r.steps.length, 0);
  const mergeStillYours =
    !isOrchestrator &&
    !!changeset &&
    changeset.status !== "merged" &&
    changeset.status !== "abandoned";

  const context = mission ? (
    <>
      {/* DID THE CODE HONOUR THE DESIGN IT WAS HANDED.
        `dispatchStudioSession` folds the workspace's standing design language
        and the spec's flow graph into the mission goal, so the building agent
        sees the same design contract a human reviewer would. `checkDesignParity`
        closes the return half and records whether the work that came back
        actually referenced them, as a real lineage edge.
        Both halves shipped. Neither `getDesignParity` nor `checkDesignParity`
        had a single consumer anywhere in src/, so the design contract was
        enforced on the way out and never checked on the way back where a person
        could see it. This is the Design-to-Build loop closing.
        It reports `no_context` honestly rather than inventing a verdict for a
        spec that legitimately had no design contract, and that state renders as
        nothing rather than as a false pass. */}
      {parity.data?.available && parity.data.signal.verdict !== "no_context" ? (
        <>
          <div className="sp-ctx-head">Against the design</div>
          <CtxBody>
            {parity.data.signal.verdict === "aligned" ? (
              <>
                The returning work names <Num>{parity.data.signal.matched.length}</Num> of{" "}
                <Num>{parity.data.signal.expected.length}</Num> thing
                {parity.data.signal.expected.length === 1 ? "" : "s"} it was handed.
              </>
            ) : (
              <>
                None of the <Num>{parity.data.signal.expected.length}</Num> design reference
                {parity.data.signal.expected.length === 1 ? "" : "s"} it was given appear in what
                came back. That is worth a look before it merges, not a blocker.
              </>
            )}
          </CtxBody>
        </>
      ) : null}

      <div className="sp-ctx-head">Who is on it</div>
      <CtxRow
        mark={
          <AgentMark
            slug={holderSlug}
            name={holder}
            state={isLive ? "running" : mission.status === "failed" ? "failed" : "quiet"}
          />
        }
        name={holder}
        sub={liveAction ?? stateWord}
      />

      {runs.length > 0 ? (
        <>
          <div className="sp-ctx-head">This run</div>
          <div className="sp-ctx-body">
            Started {started}. <Num>{runs.length}</Num> {runs.length === 1 ? "run" : "runs"},{" "}
            <Num>{stepTotal}</Num> {stepTotal === 1 ? "step" : "steps"}. It has used{" "}
            <Num>{fmtCost(totalCost)}</Num>.
          </div>
        </>
      ) : null}

      {!isOrchestrator ? (
        <>
          <div className="sp-ctx-head">Where it stands</div>
          {stageLines(runs, changeset, ci, productionDeployed).map((s) => (
            <CtxRow key={s.name} name={s.name} sub={s.state} />
          ))}
        </>
      ) : null}

      {/* Only rows that real data backs. No row here is a prediction, and no
          handoff is drawn to something that is not going to act. */}
      {call || isLive || mergeStillYours ? (
        <>
          <div className="sp-ctx-head">What happens next</div>
          {call ? (
            <CtxRow
              mark={<YouMark initials={initials} mine />}
              name="You decide, now"
              sub="the call at the top of this page"
            />
          ) : isLive ? (
            <CtxRow
              mark={<AgentMark slug={holderSlug} name={holder} state="running" />}
              name={`${holder} carries on`}
              sub="it does not need you for this part"
            />
          ) : null}
          {mergeStillYours ? (
            <CtxRow
              mark={<YouMark initials={initials} />}
              name="Then you merge it"
              sub="nothing merges itself"
            />
          ) : null}
        </>
      ) : null}

      <div className="sp-ctx-head">What you asked for</div>
      <div className="sp-ctx-body">{mission.goal}</div>
      {spec ? (
        <Actions>
          <Button
            variant="ghost"
            title={spec.title}
            onClick={() => navigate({ to: "/plan/spec/$id", params: { id: spec.id } })}
          >
            Open the spec
          </Button>
        </Actions>
      ) : null}

      <div className="sp-ctx-head">Finding it again</div>
      <div className="sp-ctx-body">
        <Num>{traceRef(mission.id)}</Num>
      </div>
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
    /* WIDE, because this surface is a workbench and not an article.
       FOUNDER, 2026-08-01, on the diff: "too congested and tightly placed."
       Measured: `.sp-main` caps its column at `--sp-main-max`, which is 74ch, so
       the file list and the diff were sharing about 450px on a 1440px screen and
       code was clipping mid-token while a third of the window sat empty. 74ch is
       the right constraint for a LINE OF PROSE and the wrong one for code, which
       is laid out in columns and read by scanning.

       `wide` is the existing opt-out for exactly this (`Surface`'s own note names
       grids, tables and canvases), and it is safe here because every primitive
       that genuinely needs a measure carries its own: `.sp-prose` 68ch, the gate
       question, the page title, the block sub. Nothing on this page depends on
       the container to keep its line length readable. */
    <Surface context={context} wide>
      <PageHead title={title} sub={sub} />

      {call ? (
        <Gate question={gateQuestion(call.tool_name)} lines={gateLines(call, holder)}>
          <Button
            variant="primary"
            disabled={busy}
            onClick={() =>
              decide.mutate({ id: call.id, tool: call.tool_name, decision: "approve" })
            }
          >
            {approveVerb(call.tool_name)}
          </Button>
          <Button
            disabled={busy}
            onClick={() => decide.mutate({ id: call.id, tool: call.tool_name, decision: "reject" })}
          >
            Decline
          </Button>
          {/* APPROVING RESUMES THE LOOP, so an agent starts running the moment
              this is pressed: `decideApproval` executes the gated call and
              `resumeAgentLoop` carries on from there, every step through the
              chokepoint. Both buttons only greyed out before, which is the state
              the founder called static.
              THE DETAIL IS THE TOOL, because that is exactly what the person
              just authorised and the one fact that makes the wait legible. It is
              already in scope: the surface uses it for the verb on the button. */}
          {busy ? (
            <AgentPulse
              label={`${holder} is carrying on`}
              seed={holderSlug ?? missionId}
              detail={call.tool_name}
            />
          ) : null}
        </Gate>
      ) : null}

      {receipts.length > 0 ? (
        <Block title="What you did just now">
          {receipts.map((r) => (
            <Receipt
              key={r.key}
              initials={initials}
              verb={r.verb}
              consequence={r.consequence}
              handoff={r.handoff ? { slug: holderSlug, name: holder } : null}
              time={r.at}
              failed={r.failed}
            />
          ))}
        </Block>
      ) : null}

      {pending.length > 1 ? (
        <Block title="Also waiting on you">
          {pending
            .filter((a) => a.id !== call?.id)
            .map((a) => (
              <Row
                key={a.id}
                tight
                marks={<AgentMark slug={holderSlug} name={holder} state="gate" />}
                lead={gateQuestion(a.tool_name)}
                sub={toolConsequence(a.tool_name).effect}
                time={ago(a.created_at)}
                onClick={() => setPicked(a.id)}
              />
            ))}
        </Block>
      ) : null}

      {/* The work region follows the strip. Build keeps the full body it was
          redesigned to carry; the other six render what the record actually
          holds for this run, and a door to the surface that holds the rest.
          You never leave the run to walk its own lifecycle.

          A NON-BUILD STAGE IS ADDED ABOVE, NEVER SWAPPED IN. This used to be
          one ternary, so choosing ship (or having it chosen for you by the
          late-landing focus) took the ledger, the steer box and the diff off
          the screen entirely. The proof of the run is the reason the page
          exists; a stage panel is a second thing to read, not a replacement
          for the first. Selecting Build in the strip collapses the panel and
          leaves the body where it already was. */}
      {stage !== "build" ? (
        <StagePanel
          station={stage}
          fact={stages?.find((s) => s.station === stage) ?? null}
          evidence={stagesQ.data?.evidence ?? null}
          initials={initials}
          error={stagesQ.isError ? clip((stagesQ.error as Error)?.message ?? "", 200) : null}
          onRetry={() => void stagesQ.refetch()}
        />
      ) : null}

      {isOrchestrator ? (
        <Block title="What happened, in order">
          <MissionOrchestratorDetail missionId={missionId} />
        </Block>
      ) : (
        <>
          <Block
            title="What happened, in order"
            more={
              ledger.length > VISIBLE || hasThoughts
                ? showAll
                  ? "Just what it did"
                  : "Everything it did and said"
                : undefined
            }
            onMore={() => setShowAll((v) => !v)}
          >
            {ledger.length === 0 ? (
              <Empty>
                Nothing has run yet. {holder} picks this up on its own and the steps land here as
                they happen.
              </Empty>
            ) : showAll ? (
              ledger
            ) : (
              ledger.slice(0, VISIBLE)
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

          {/* THIS STAYS IN THE WORK COLUMN. It was briefly moved into a
              full-width slot spanning the context column too, to give the code
              another 370px, and that broke layout containment: `.sp-inner`'s
              second track is an IMPLICIT grid column, so it is `auto`-sized, and
              a spanning item contributes its own max-content to an auto track.
              The diff's `white-space: pre` content then sized that track, the grid
              grew past its container, and the terminal spilled off the right of
              the screen. Reported as "the terminal window basically spills over
              the screen", which is precisely what it was.

              A spanning region is only safe once BOTH tracks are explicitly sized.
              Until then the work column is the honest boundary, and the diff earns
              its room inside it: a capped list column, a tight gutter, a visible
              horizontal scrollbar, and Wrap. */}
          <Block
            title="What it produced"
            sub={
              diff.files > 0 ? (
                <>
                  <Diffstat added={diff.added} removed={diff.removed} /> lines across{" "}
                  <Num>{diff.files}</Num> {diff.files === 1 ? "file" : "files"}.
                </>
              ) : undefined
            }
            more={changeset?.pr_url ? "Open the pull request" : undefined}
            onMore={() => window.open(changeset?.pr_url as string, "_blank", "noopener,noreferrer")}
          >
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
            {/* NO SECOND MARGIN. `.sp-tabs` already carries its own
                `margin-top: var(--sp-space-4)`, and this wrapper added the same
                value again immediately below it, so the tab row sat in a double
                gap before any content. */}
            <div>
              {tab === "changes" ? (
                <ChangesPanel
                  changeset={changeset}
                  changes={changes}
                  missionId={missionId}
                  fileSetPolicy={fileSetPolicy}
                  constraints={constraints}
                />
              ) : null}
              {tab === "preview" ? (
                <PreviewPanel missionId={missionId} changeset={changeset} isLive={isLive} />
              ) : null}
              {tab === "receipts" ? <ReceiptsPanel missionId={missionId} /> : null}
            </div>
          </Block>
        </>
      )}
    </Surface>
  );
}

export const Route = createFileRoute("/_authenticated/runs/$missionId")({
  // Optional, so a dispatch surface can navigate without search; the component
  // reads a missing tab as Changes.
  validateSearch: (search: Record<string, unknown>): { tab?: SearchTab } => {
    const t = search.tab;
    return { tab: (SEARCH_TABS as string[]).includes(t as string) ? (t as SearchTab) : undefined };
  },
  component: BuildRun,
  head: () => ({ meta: [{ title: "Run · Supaprod" }] }),
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
