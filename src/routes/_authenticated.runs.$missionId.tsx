/**
 * Build, one run in detail. REDESIGNED, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * ================================================================== *
 * THE 2026-08-10 INVERSION. This surface used to open on its own LOG.
 *
 * Measured against the shipped agent consoles, the information architecture was
 * upside down in four places at once, and every one of them cost the same thing:
 *
 *   · the RAW STEP LOG was the landing view — twelve step rows above the diff,
 *     which is the machine's transcript standing where the report belongs;
 *   · the agent's own FINAL ACCOUNT of the whole run was one anonymous row in
 *     that log, CUT AT 180 CHARACTERS, mid-sentence. It is the single most
 *     valuable thing the run produces;
 *   · there was NO TOTAL DURATION anywhere, and time was floored to minutes, so
 *     a forty-second step read "now";
 *   · nothing showed WHAT IT RAN to check itself, so "it works" was a claim with
 *     no evidence under it on the one screen built to carry evidence.
 *
 * The reframe that governs the fix is not about layout. From operator research
 * on status reporting: the commonest failure is reporting ACTIVITY ("met with X,
 * researched Y") instead of PROGRESS toward an outcome. A step list is activity.
 * What MOVED, and what now NEEDS A DECISION, is progress. So the first line of
 * this page carries the outcome and the ask, and everything under it is the
 * evidence for that line rather than a chronology competing with it.
 *
 * WHAT LANDS NOW, in order:
 *   1. the headline: where it landed, how long it took to the SECOND, and what
 *      it wants from you. Live, the duration is a counter that ticks — never a
 *      progress bar, because a coding agent cannot know how long it will take
 *      and a bar that implies otherwise is caught inside one session;
 *   2. the Gate, unmoved: the one call the run cannot make for itself;
 *   3. "What came back": the agent's own account, un-clipped but SHORT, with the
 *      whole thing one press away. Brevity is the feature here, not the polish —
 *      verbose AI output is its own named pain;
 *   4. "How it checked itself": the checks it really ran, with real exit codes;
 *   5. "Tell it what to do next", unmoved;
 *   6. "What it produced": the diff, the preview, the provenance chain AND the
 *      raw step log, all four COLLAPSED behind one tab row.
 *
 * The prototype (PROTOTYPE-v2.html #s-run) drew the ledger as the body of this
 * page and this rewrite departs from it there, deliberately: the prototype was
 * drawn before the product ran agents for an hour unattended, and a transcript
 * is the right landing for a two-minute run and the wrong one for a long one.
 * Everything else it decided still holds — one headline and one contract line,
 * the change stated as a diffstat before any panel, and a context column that
 * answers this run / what happens next rather than listing statistics.
 * ================================================================== *
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
 *    KEEP  the ledger of runs and steps, every row of it: this is the evidence,
 *          and it is the only place it is assembled. It MOVES behind the Steps
 *          tab. Nothing was deleted from it, and it is one press from anywhere
 *          on the page — it simply stopped being the first thing you read.
 *    ADD   "What came back", which is the agent's own final account promoted out
 *          of that log and given the room it always deserved.
 *    ADD   "How it checked itself". `studio.checks.run` really does clone the
 *          branch into a sandbox and run the repo's checks, and it records each
 *          one's exit code, duration and stderr. None of that had a door.
 *    KEEP  the steer note. It is how you correct the crew WITHOUT stopping it,
 *          which is the governance canon expressed as a control, and it has no
 *          other home.
 *    KEEP  the stage lines (code / pull request / checks / production). Run
 *          scoped, plain words, and the shell's seven-stage strip does not say
 *          any of it.
 *    KEEP  Changes, Preview and Receipts, behind one tab row, joined now by
 *          Steps. A tab row is an ANTI-scroll device here: four views of one
 *          run in one screen height. Stacking them as blocks would have made the
 *          page longer, which is the pain point the founder named twice. The row
 *          itself is COLLAPSED on arrival: a returning reader gets the report
 *          first and opens the machinery when they want it.
 *    ADD   the test station (JNY-03), the one element on this page that was not
 *          inherited from anywhere. It hung on MissionSlideOver, this rewrite
 *          deleted that component, and nothing carried it across: the panel and
 *          both of its server functions sat with no caller in the repo. It is
 *          the run's acceptance verdict against its own spec, so it belongs on
 *          the surface that owns the run.
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
 *    KILL  every toast THIS FILE fires. Approving and steering are its own two
 *          actions, and both now confirm with a receipt instead: see THE COMMIT
 *          below. The KILL stops at the file boundary, and the contract may not
 *          claim more than that. The child panels mounted here still carry
 *          their own toasts - ChangesPanel behind the Changes tab,
 *          MissionOrchestratorDetail on a goal-run, and TestStationPanel added
 *          above. None of the three can write a receipt from where it stands,
 *          because the writer (`addReceipt`) is host-local state inside
 *          BuildRun and is not handed down. Converting them is a reported gap,
 *          not something this rewrite did.
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
 *    step log (Steps tab), the built output (Preview), the provenance chain
 *    (Evidence), the check runs (Engine Room), the thinking behind each act (one
 *    control inside the log), the whole of the agent's account ("Read all of
 *    it"), the stderr of any check that failed, and the pull request (a door on
 *    the produced block's own sub-line).
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
import { cancelMission } from "@/lib/missions.functions";
import { stepLabel } from "@/lib/agent-vocabulary";
import { REVERSIBILITY_LABEL, gateHeadline, toolConsequence } from "@/lib/tool-consequences";
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
  type StudioToolCall,
} from "@/lib/studio.functions";
import { decideApproval } from "@/lib/agent_loop.functions";
import { listDeployments } from "@/lib/deployments.functions";
import { getDesignParity } from "@/lib/design-parity.functions";
import { initialsFrom } from "@/lib/initials";
import { ChangesPanel } from "@/components/studio/ChangesPanel";
import { PreviewPanel } from "@/components/studio/PreviewPanel";
import { ReceiptsPanel } from "@/components/studio/ReceiptsPanel";
import { CheckedItself, ReturnSummary } from "@/components/studio/RunReturn";
import { useNowWhileLive } from "@/components/studio/use-now-while-live";
import {
  finalSummary,
  formatDuration,
  lastActivityAt,
  outcomeAndAsk,
  runSpanMs,
  type StepLike,
} from "@/components/studio/run-return";
import { MissionOrchestratorDetail } from "@/components/missions/MissionOrchestratorDetail";
import { TestStationPanel } from "@/components/obsidian/TestStationPanel";
import { fmtCost, summarizeArgs } from "@/components/studio/studio-format";
import { traceRef } from "@/components/discover/format";
/*
 * `Surface` is the ONE shell primitive kept, and it is kept on purpose: it is
 * the work region's LAYOUT rather than a token or a paint, and both the ported
 * Approvals and Brain surfaces still mount it. Everything else this file used to
 * import from that module was the `--sp-*` layer, which meridian.css calls life
 * support, and it has moved to components/runs/run-parts.tsx.
 *
 * `AgentPulse` stays too, and for a different reason: it is bound to a run
 * genuinely being resumed, and it is out of this lane's files. Reported rather
 * than repainted.
 */
import { Surface } from "@/components/meridian/Surface";
import { AgentPulse } from "@/components/meridian/AgentPulse";
import { ToolStream, type ToolStreamRow } from "@/components/meridian/ToolStream";
import {
  Actor,
  Button,
  Commit,
  ContextLine,
  ContextNote,
  RunGate,
  RunMark,
  RunRow,
  Textarea,
  type RunMarkState,
} from "@/components/runs/run-parts";
import { useConfirm } from "@/hooks/use-confirm";
import { YouMark } from "@/components/meridian/marks";
import {
  Actions,
  Approve,
  Diffstat,
  Door,
  Figure,
  NothingYet,
  PageHeading,
  ReadFailedLine,
  Reading,
  Region,
} from "@/components/meridian/surface-parts";
import { Tabs, TabPanel } from "@/components/meridian/Tabs";
import { actorName, actorSlug, actorVerb } from "@/components/runs/run-state";

/** The four views of this run worth opening. `steps` is the raw log, which used
 *  to be the landing view and is now one of these. */
type Tab = "changes" | "steps" | "preview" | "receipts";
/** The key is the URL/state value and does not move; only the label a person
 *  reads changes. "Receipts" reads as billing to product operators — the
 *  measured word for what this tab actually holds is "Evidence". Renaming the
 *  key would break every ?tab=receipts deep link for nothing. */
const TAB_DISPLAY: [Tab, string][] = [
  ["changes", "Changes"],
  ["steps", "Steps"],
  ["preview", "Preview"],
  ["receipts", "Evidence"],
];

/** Old deep links, and the /studio/$missionId redirect stub, still carry
 *  ?tab=pr and ?tab=cost. Pull request moved to Engine Room and Cost was
 *  removed, so those values are still ACCEPTED and read as the nearest
 *  surviving view. A link that used to work does not get to break. */
type SearchTab = Tab | "pr" | "cost";
const SEARCH_TABS: SearchTab[] = ["changes", "steps", "preview", "receipts", "pr", "cost"];
/** NULL IS A REAL ANSWER NOW, and it is the default. No `?tab` means the tabbed
 *  region is CLOSED and the reader is looking at the report. Every value that
 *  ever worked still opens the region on the nearest surviving view. */
function readTab(t: SearchTab | undefined): Tab | null {
  if (t === "steps" || t === "preview" || t === "receipts" || t === "changes") return t;
  // pr and cost both pointed at machinery that moved; Changes is what survives
  // nearest to either.
  return t === "pr" || t === "cost" ? "changes" : null;
}

/** The tab row's id group. Every element id in the row and its panel is derived
 *  from it, so a caller never holds one and two rows on one page cannot collide. */
const PRODUCED_TABS = "run-produced";

/** How many ledger rows open before the region offers the rest. */
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

/* `StepLike` — the structural read of a loop step, so this surface never imports
 * the server module the union is declared in — now lives in studio/run-return.ts
 * beside the rules that read it, and is imported above. It was declared in two
 * files with two different field sets, and the copy here was the one missing
 * `result`, which is where every tool's own verdict is recorded. */

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

/** Plain-words relative time. Mono is applied by the row, not here.
 *
 *  UNDER A MINUTE IS SECONDS, NOT "NOW". This floored everything below sixty
 *  seconds to the word "now", so a step that took forty seconds and a step that
 *  finished this instant were the same row, and the run's own silence age — the
 *  highest-trust detail on the page — could not report the first minute of a
 *  stall at all. Everything on this surface that measures time is now precise to
 *  the second; see `formatDuration` for the total. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const ms = Date.now() - t;
  if (ms < 0) return null;
  if (ms < 60_000) return `${Math.floor(ms / 1000)}s`;
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

function cap(s: string): string {
  return s.length === 0 ? s : s[0].toUpperCase() + s.slice(1);
}

function clip(s: string, max = 180): string {
  const line = s.replace(/\s+/g, " ").trim();
  return line.length > max ? `${line.slice(0, max - 1)}…` : line;
}

/**
 * State is never a hue in the TEXT: the mark carries it, and under Meridian the
 * mark carries it as one of the five meanings the system has rather than as the
 * agent's loop stage.
 *
 * The vocabulary here is `agent_runs.status`, and it maps onto the run states
 * the list and the board already use, so a run that reads "Working" one click
 * back cannot read as something else here. `queued` folds into `working` on this
 * surface deliberately: on the list a queued run is genuinely waiting for the
 * crew to pick it up, but by the time you are inside a run its queued sub-run is
 * part of one continuous piece of work, and amber there would claim a stall that
 * is not happening.
 */
function markFor(status: string): RunMarkState {
  if (status === "running" || status === "queued") return "working";
  if (status === "waiting_approval") return "gate";
  if (status === "failed" || status === "halted") return "stopped";
  return "done";
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
  /** What the deployment read actually came back with, rather than a bare
   *  boolean. `deployed: false` is only a FACT once `answered` is true; before
   *  that it is the absence of an answer, and the two are different things to
   *  say to someone standing over a merge. */
  production: { deployed: boolean; answered: boolean; failed: boolean },
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
          ? ["open, ", <Figure key="n">#{changeset.pr_number}</Figure>]
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

  /* A STAGE WITH NO DATUM SAYS SO. That is this function's own rule, stated in
     its docstring, and Production was the one stage breaking it. listDeployments
     was the only query on this surface with no error arm, and the `?? []` behind
     `deployed` turned "we could not read it" into "there are no deployments", so
     a failed or in-flight read came out here as the flat assertion "merged, not
     promoted yet" under the heading "Where it stands". Someone deciding whether
     their merged change is already live was told that it is not, and could go
     and promote something that is already in production. Two branches now stand
     between an unread answer and that claim, and they are kept apart from each
     other because "we have not read it yet" resolves on its own and "we could
     not read it" does not. Fixed 2026-08-11. */
  const shipped =
    changeset?.status !== "merged"
      ? "not yet"
      : production.failed
        ? "merged; we could not read whether it is live"
        : !production.answered
          ? "merged; still reading whether it is live"
          : production.deployed
            ? "live"
            : "merged, not promoted yet";

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

/** What it does and whether it can be undone, read VERBATIM from the static
 *  per-tool table. Never a paraphrase: this is a safety property, and the
 *  claim may not outrun the wiring. The agent's own reasoning sits beneath,
 *  in quotes, because a claim is not a receipt. */
function gateLines(a: StudioApproval, holder: string): React.ReactNode[] {
  const c = toolConsequence(a.tool_name);
  const lines: React.ReactNode[] = [
    /*
     * `gateHeadline`, not `c.effect`, for the lead line only. Both return the
     * identical catalogued sentence for all 59 registered tools; they differ on
     * a name the catalogue does not hold, where `c.effect` falls through to
     * "Runs the tool with the agent's arguments." -- a claim, in the line a
     * person reads first. Five seed migrations still write six such names into
     * `agent_approvals` (21 tuples, 8 of them `status = 'pending'`), so this is
     * reachable by a re-seed rather than hypothetical. The undo line below keeps
     * reading `c`: "Effect not catalogued. Review the arguments before
     * approving." is the honest thing to say in that slot and needs no change.
     */
    <span key="effect">{gateHeadline(a.tool_name)}</span>,
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
        <Figure>{clip(args, 140)}</Figure>
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
  const navigate = useNavigate({ from: "/runs/$missionId" });
  const qc = useQueryClient();
  const confirm = useConfirm();

  const fGet = useServerFn(getStudioSession);
  const fSteer = useServerFn(steerStudioSession);
  const fCancelMission = useServerFn(cancelMission);
  /* The brake pedal, moved into the room where the work is watched. Today
     held the only stop in the product; watching here and stopping there made
     the two facts different rooms. Same mutation, same honest consequences:
     it stops now, pending approvals clear, held build claims release, and
     completed work is kept. Feedback rides the page's own polling - once the
     write lands, the closed-run state renders instead of this control. */
  const stopRun = useMutation({
    mutationFn: (missionId: string) => fCancelMission({ data: { missionId } }),
    onSuccess: (result) => {
      if (!result.alreadyTerminal) {
        void qc.invalidateQueries({ queryKey: ["studio-session", missionId] });
        void qc.invalidateQueries({ queryKey: ["run-stages", missionId] });
        void qc.invalidateQueries({ queryKey: ["today"] });
      }
    },
  });
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
  /* THE ONE VALUE ON THIS PAGE THAT HAS TO KEEP ITS IDENTITY. `?? []` mints a
   * fresh array on every render, and four memos hang off `runs` now — the step
   * log, the agent's account, the summary split and the check list — so an
   * unstable reference makes all four recompute on every keystroke in the note
   * box. The ledger alone rebuilds a React element per step. Held here rather
   * than inside each memo: one of them would be forgotten. */
  const runs = React.useMemo(() => (data?.runs ?? []) as StudioRunDetail[], [data?.runs]);
  /* Held for the same identity reason as `runs` directly above: `?? []` mints a
   * fresh array every render, and `calls` below maps over it. */
  const toolCalls = React.useMemo(
    () => (data?.toolCalls ?? []) as StudioToolCall[],
    [data?.toolCalls],
  );
  /*
   * `public.tool_calls` rows in the shape ToolStream takes. Four decisions here
   * are not free choices:
   *
   *   `state` IS DERIVED FROM `ok` AND IS NEVER "running". Nothing in this
   *   product records an executing call — the loop measures latency at
   *   loop.server.ts:1661 and inserts the row at :1690 / :1732, both after the
   *   tool has returned, and the checkpoint that might otherwise witness one is
   *   written BEFORE the provider call (:1201). A `running` row here would be
   *   an invented agent step.
   *
   *   `durationMs` IS GUARDED RATHER THAN PASSED THROUGH. `formatDuration`
   *   (components/studio/run-return.ts:65-74) rejects only negatives and
   *   non-finite, so a 0 renders as a confident "0s". The loop's
   *   `Date.now() - t0` returns 0 for any tool that comes back inside a
   *   millisecond, and nothing about that is a measurement worth printing.
   *   Measured 2026-08-22 20:14 UTC: `select count(*) filter (where latency_ms
   *   = 0) from public.tool_calls` is 0 of 345 rows, so this guard is for the
   *   case that has not happened yet rather than one on screen today.
   *
   *   `label` IS NOT PASSED. ToolStream resolves the caption through
   *   `toolActionLabel`, the single place that turns `prd.draft` into "drafting
   *   a spec"; a tool the vocabulary has never met falls back to its raw name,
   *   which is ugly on purpose so a missing entry gets noticed.
   *
   *   `at` IS THE RECORDED `created_at`, not a client stamp. Reopening a
   *   settled run would otherwise bunch every row into the instant the page
   *   loaded.
   */
  const calls = React.useMemo<ToolStreamRow[]>(
    () =>
      toolCalls.map((tc) => ({
        id: tc.id,
        tool: tc.tool_name,
        at: Date.parse(tc.created_at),
        state: tc.ok ? "done" : "failed",
        durationMs: tc.latency_ms > 0 ? tc.latency_ms : undefined,
        argument: tc.argument ?? undefined,
        error: tc.ok ? undefined : (tc.error ?? undefined),
      })),
    [toolCalls],
  );
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
  /* WHETHER THAT `false` IS A FACT. `productionDeployed` is false both when the
     record says nothing is in production and when we never got the record, and
     every surface reading it used to print the first meaning for both. Asking
     whether an ANSWER IS ON HAND rather than asking a fetch state is the same
     rule the runs list learned the hard way: `isPending` goes true again on any
     read that starts with an empty cache entry, so a surface that has an answer
     would keep disclaiming it. `failed` is split out from `answered` because a
     read that will resolve on its own and a read that will not are two
     different things to tell a person. */
  const production = {
    deployed: productionDeployed,
    answered: !!deploymentsQ.data,
    failed: deploymentsQ.isError,
  };

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

  /**
   * Cmd/Ctrl+Enter sends the note from anywhere inside the note box.
   *
   * THE DEFECT THIS FIXES, found 2026-08-06. The chord was already bound on the
   * textarea and drawn NOWHERE. Sending a note is the most repeated act on this
   * surface, once per course correction, and every comparable chord in the
   * product is drawn on the button that performs it: the runs board on Start,
   * MissionOnboarding on Continue, the spec surface on Save. So the person
   * steering a live run either reached for the mouse on every correction, or
   * found the chord by accident and then had no way to know it was meant
   * rather than tolerated.
   * A binding nobody can see is worth roughly what an unbound keycap is worth,
   * and it costs the same thing: the surface stops being readable as a whole.
   * Nothing caught it because a missing <kbd> is an absence. The handler
   * compiles, the button works, every test passes, and only reading this file
   * beside the two that get it right shows what is not here.
   *
   * The scope moved off the textarea and onto the box for the same reason the
   * keycap now exists: the promise is drawn on the BUTTON, so the chord has to
   * be true wherever the button is, including when the button itself holds
   * focus after a tab. See the twin on the runs board composer, which had the
   * worse half of this bug.
   *
   * The house bare-key guard from _authenticated.today.tsx is deliberately not
   * here. It stands a key down under a modifier and inside a text field, and
   * this chord requires the modifier and is meant to fire in the text field.
   * Scope does that job instead: React bubbles keydown from this box's own
   * children only, so nothing else on a long run page can lose Cmd+Enter.
   */
  const onNoteChord = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!(e.metaKey || e.ctrlKey) || e.key !== "Enter") return;
    if (!canSend) return;
    e.preventDefault();
    steer.mutate();
  };

  const [showAll, setShowAll] = React.useState(false);

  const busy = decide.isPending;

  /* ---- WHETHER THE MACHINERY IS OPEN ----
   *
   * Closed on arrival, because the report is the landing and the tab row is the
   * depth behind it. Three things can open it, and they compose in this order:
   *
   *   · a `?tab=` in the URL, which is every deep link that ever worked. An
   *     explicit address always wins, and it wins over the close below too;
   *   · the AUTO-OPEN below, latched;
   *   · a press on the tab row itself, which writes the URL.
   *
   * THE AUTO-OPEN, and why it is latched. When nothing has come back yet there
   * is no document to land on, and the honest landing is the log: a live run
   * opens on Steps. But the summary ARRIVES mid-session, at which point the
   * condition flips — and an unlatched condition would close the region under
   * someone mid-read, which is precisely the defect run-evidence-holds.test.ts
   * exists to prevent (the run's evidence may not erase itself). So the first
   * true value is copied into state once and the copy is what the region
   * follows; `prev ?? want` is the whole guard.
   *
   * `closed` exists so a deliberate press on Hide outranks the latch. Without
   * it, closing a region the latch had opened would reopen it on the next
   * render, which reads as a broken control rather than as a policy. */
  const searchTab = readTab(Route.useSearch().tab);
  const [latchedTab, setLatchedTab] = React.useState<Tab | null>(null);
  const [closed, setClosed] = React.useState(false);
  const nothingCameBack = !isOrchestrator && finalSummary(runs) == null && runs.length > 0;
  React.useEffect(() => {
    if (nothingCameBack) setLatchedTab((prev) => prev ?? "steps");
  }, [nothingCameBack]);
  const tab: Tab | null = searchTab ?? (closed ? null : latchedTab);

  const openTab = (next: Tab) => {
    setClosed(false);
    void navigate({ search: (prev) => ({ ...prev, tab: next }) });
  };
  const hideTabs = () => {
    setClosed(true);
    void navigate({ search: (prev) => ({ ...prev, tab: undefined }) });
  };

  /* ---- what happened, in order ----
   * Every row carries a mark: yours on your ask and your notes, Engineer's on
   * its acts. A row with no mark is a surface pretending the work did itself.
   * Thoughts are what it SAID, so they are quoted and hidden by default. */
  const hasThoughts = runs.some((r) => r.steps.some((s) => (s as StepLike).kind === "thought"));

  const ledger = React.useMemo(() => {
    const out: React.ReactNode[] = [];
    if (mission) {
      out.push(
        <RunRow
          key="asked"
          tight
          mark={<YouMark initials={initials} mine size="row" />}
          lead="You asked for it"
          sub={clip(mission.goal, 150)}
          time={ago(mission.created_at)}
        />,
      );
    }
    for (const run of runs) {
      const alive = run.status === "running" || run.status === "queued";
      out.push(
        <RunRow
          key={run.run_id}
          mark={<RunMark slug={holderSlug} name={holder} state={markFor(run.status)} />}
          lead={
            <>
              <Actor>{holder}</Actor> {runPhrase(run, holderVerb)}
            </>
          }
          sub={
            <>
              <Figure>{run.steps.length}</Figure> {run.steps.length === 1 ? "step" : "steps"}
              {alive && ago(run.last_checkpoint_at) ? (
                <> · no step for {ago(run.last_checkpoint_at)}</>
              ) : null}
              {run.cost_usd > 0 ? (
                <>
                  {" · "}
                  <Figure>{fmtCost(run.cost_usd)}</Figure>
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
          <RunRow
            key={`${run.run_id}-${i}`}
            tight
            mark={
              <RunMark
                slug={holderSlug}
                name={holder}
                state={
                  failedStep ? "stopped" : alive && i === last && !isThought ? "working" : "done"
                }
              />
            }
            lead={
              failedStep ? (
                // Red is an OUTCOME, and a step that errored is the clearest one
                // this page has.
                <span className="text-mrd-fail">{lead}</span>
              ) : deniedStep ? (
                /* A DENIED STEP IS ORCHID, NOT AMBER, AND THAT IS THE CORRECTION.
                   It was `.sp-warn`, and this system has no warn colour: the only
                   thing amber may say is "stopped, and NOT on you". A step that
                   was denied stopped because A PERSON DECLINED IT, which is the
                   one meaning orchid exists for — it is the trace of a human call,
                   not a condition waiting to change. Reading it as amber told the
                   reader to wait for something, when the thing had already been
                   decided by them. */
                <span className="text-mrd-you">{lead}</span>
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

  /* ---- THE FIRST LINE, which is the highest-leverage pixel on this surface ----
   *
   * IT USED TO REPORT ACTIVITY: "Engineer is opening a pull request · you asked
   * for this today 14:22". Both halves are true and neither is what the reader
   * came for. A person who has been away for an hour needs to know where it
   * LANDED and whether it NEEDS THEM, and a caption naming the current tool
   * answers neither — it is the same sentence whether the run is about to
   * succeed or about to fail.
   *
   * So the line is now outcome, duration, ask, and the duration is exact to the
   * second: "Finished in 18m 6s · Ready for your review." While the run is alive
   * the seconds tick, because an elapsed counter claims only that time is
   * passing, which is the one thing that is certainly true; a progress bar would
   * claim the machine knows how much is left, which it does not.
   *
   * NOTHING WAS DELETED TO MAKE ROOM, both halves were DEMOTED to where they
   * were always the better fit. The live tool caption is still on the context
   * column's "Who is on it", which is where a fact about the WORKER rather than
   * about the work belongs; the start time is still under "This run", beside the
   * run and step counts it belongs with. The headline gets the two facts that
   * decide whether the reader keeps reading. */
  const title = mission ? stripAutoPrefix(mission.title) : null;
  const stateWord = mission ? (STATE_WORD[mission.status] ?? cap(mission.status)) : null;
  const started = startedAt(mission?.created_at);
  const now = useNowWhileLive(isLive);
  const totalSpan = runSpanMs({
    startedAt: mission?.created_at,
    completedAt: mission?.completed_at,
    lastActivityAt: lastActivityAt(runs),
    live: isLive,
    now,
  });
  const duration = totalSpan == null ? null : formatDuration(totalSpan);
  const headline = outcomeAndAsk({
    missionStatus: mission?.status ?? "",
    live: isLive,
    pendingCalls: pending.length,
    changesetStatus: changeset?.status ?? null,
    productionDeployed,
    productionKnown: production.answered,
    duration,
  });
  const sub = mission ? (
    <>
      {headline.lead}
      {headline.duration ? (
        <>
          {" "}
          <Figure>{headline.duration}</Figure>
        </>
      ) : null}
      {headline.ask ? <> · {headline.ask}</> : null}
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
        <ContextNote head="Against the design">
          {parity.data.signal.verdict === "aligned" ? (
            <>
              The returning work names <Figure>{parity.data.signal.matched.length}</Figure> of{" "}
              <Figure>{parity.data.signal.expected.length}</Figure> thing
              {parity.data.signal.expected.length === 1 ? "" : "s"} it was handed.
            </>
          ) : (
            <>
              None of the <Figure>{parity.data.signal.expected.length}</Figure> design reference
              {parity.data.signal.expected.length === 1 ? "" : "s"} it was given appear in what came
              back. That is worth a look before it merges, not a blocker.
            </>
          )}
        </ContextNote>
      ) : null}

      <ContextNote head="Who is on it">
        <ContextLine
          mark={
            <RunMark
              slug={holderSlug}
              name={holder}
              state={isLive ? "working" : mission.status === "failed" ? "stopped" : "done"}
            />
          }
          name={holder}
          sub={liveAction ?? stateWord}
        />
      </ContextNote>

      {runs.length > 0 ? (
        <ContextNote head="This run">
          Started {started}. <Figure>{runs.length}</Figure> {runs.length === 1 ? "run" : "runs"},{" "}
          <Figure>{stepTotal}</Figure> {stepTotal === 1 ? "step" : "steps"}. It has used{" "}
          <Figure>{fmtCost(totalCost)}</Figure>.
        </ContextNote>
      ) : null}

      {!isOrchestrator ? (
        <ContextNote head="Where it stands">
          {stageLines(runs, changeset, ci, production).map((s) => (
            <ContextLine key={s.name} name={s.name} sub={s.state} />
          ))}
        </ContextNote>
      ) : null}

      {/* Only rows that real data backs. No row here is a prediction, and no
          handoff is drawn to something that is not going to act. */}
      {call || isLive || mergeStillYours ? (
        <ContextNote head="What happens next">
          {call ? (
            <ContextLine
              mark={<YouMark initials={initials} mine size="row" />}
              name="You decide, now"
              sub="the call at the top of this page"
            />
          ) : isLive ? (
            <ContextLine
              mark={<RunMark slug={holderSlug} name={holder} state="working" />}
              name={`${holder} carries on`}
              sub="it does not need you for this part"
            />
          ) : null}
          {mergeStillYours ? (
            <ContextLine
              mark={<YouMark initials={initials} size="row" />}
              name="Then you merge it"
              sub="nothing merges itself"
            />
          ) : null}
        </ContextNote>
      ) : null}

      <ContextNote head="What you asked for">
        {mission.goal}
        {spec ? (
          <Actions className="mt-mrd-4">
            <Button
              variant="quiet"
              title={spec.title}
              onClick={() => navigate({ to: "/plan/spec/$id", params: { id: spec.id } })}
            >
              Open the spec
            </Button>
          </Actions>
        ) : null}
      </ContextNote>

      <ContextNote head="Finding it again">
        <Figure>{traceRef(mission.id)}</Figure>
      </ContextNote>
    </>
  ) : null;

  /* ---- error and loading, each honest about which it is ---- */
  if (session.isError) {
    return (
      <Surface>
        <PageHeading title="This run did not load." />
        <ReadFailedLine onRetry={() => void session.refetch()}>
          {clip((session.error as Error)?.message ?? "", 200)}
        </ReadFailedLine>
      </Surface>
    );
  }

  if (session.isLoading || !data || !mission) {
    return (
      <Surface>
        {/* A HEADING OVER NOTHING IS A BROKEN PROMISE, so the read says it is a
            read. The title alone reads as an assertion that the page is done and
            that the record is empty; the line under it is what makes it a wait.
            `Reading` and not `LoadingState`: that Meridian component carries an
            elapsed timer and its own header reserves it for work that genuinely
            takes seconds, which a row read is not. */}
        <div className="flex flex-col gap-mrd-4">
          <PageHeading title="Reading the record." />
          <Reading />
        </div>
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
      {/* THE PAGE'S RHYTHM, STATED HERE RATHER THAN INHERITED from six
          stylesheets. Meridian's ramp grows, so the gap between regions is a
          larger step than anything inside one. */}
      <div className="flex flex-col gap-mrd-6">
        <PageHeading title={title} sub={sub} />

        {call ? (
          <RunGate
            standing="you"
            question={gateQuestion(call.tool_name)}
            lines={gateLines(call, holder)}
          >
            <Approve
              /* THE ACCENT ARRIVES ON THE CONTROL THAT ACTUALLY RELEASES THE RUN,
               and this is the only place on either runs surface it does.
               `decideApproval` executes the gated call and `resumeAgentLoop`
               carries on from there, so pressing this IS the pending human
               decision rather than a navigation dressed as one. It is a
               different COMPONENT rather than a variant, which is what stops
               the accent from being one string away on every other control. */
              busy={busy}
              onClick={() =>
                decide.mutate({ id: call.id, tool: call.tool_name, decision: "approve" })
              }
            >
              {approveVerb(call.tool_name)}
            </Approve>
            <Button
              disabled={busy}
              onClick={() =>
                decide.mutate({ id: call.id, tool: call.tool_name, decision: "reject" })
              }
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
          </RunGate>
        ) : null}

        {receipts.length > 0 ? (
          <Region title="What you did just now">
            {receipts.map((r) => (
              <Commit
                key={r.key}
                initials={initials}
                verb={r.verb}
                consequence={r.consequence}
                handoff={r.handoff ? { slug: holderSlug, name: holder } : null}
                time={r.at}
                failed={r.failed}
              />
            ))}
          </Region>
        ) : null}

        {pending.length > 1 ? (
          <Region title="Also waiting on you">
            {pending
              .filter((a) => a.id !== call?.id)
              .map((a) => (
                <RunRow
                  key={a.id}
                  tight
                  mark={<RunMark slug={holderSlug} name={holder} state="gate" />}
                  lead={gateQuestion(a.tool_name)}
                  // Same swap as `gateLines` above, for the same reason: this
                  // sub-line is the only description these rows carry.
                  sub={gateHeadline(a.tool_name)}
                  time={ago(a.created_at)}
                  onClick={() => setPicked(a.id)}
                />
              ))}
          </Region>
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

        {/* WHETHER IT MEETS THE SPEC (JNY-03). This surface is the one that
          replaced MissionSlideOver, which is where the test station used to
          hang and which this rewrite deleted. Nothing carried the panel across,
          so `TestStationPanel` had no caller anywhere in the repo and neither
          did `getMissionTestPlan` or `recordTestStationVerdict` — a compiled
          Outcome Contract's eval cases, CI expectation and UAT checklist were
          being computed by code no door opened.

          IT SITS ABOVE THE LEDGER AND OUTSIDE THE ORCHESTRATOR BRANCH, on
          purpose, both times.
          Above, because when it renders at all it carries a CALL ("Record
          verdict") and this page's rule is that a call the run cannot make for
          itself comes before the evidence of what the run did. It is read after
          the Gate and before the story.
          Outside, because the panel resolves its spec through
          `studio_changesets.mission_id -> prd_id`, which is a link an
          orchestrator goal-run can also hold; putting it inside the build-only
          branch would have invented a second reason for it to be missing on top
          of the one it already handles itself.

          NO EMPTY SECTION EITHER WAY: the panel owns its own `Block`, so a run
          whose spec was never compiled — most runs — draws nothing here at all,
          not a heading over a rule over silence. */}
        <TestStationPanel missionId={missionId} />

        {isOrchestrator ? (
          <Region title="What happened, in order">
            <MissionOrchestratorDetail missionId={missionId} />
          </Region>
        ) : (
          <>
            {/* BEAT 0, AND ONLY WHILE THE RUN IS ALIVE.
              What this page said about a live run before this existed was ONE
              pulsing caption: `RunReturn.tsx:113-127` renders `<AgentPulse
              label={`${holder} is still working`} detail={liveAction} />`, and
              `liveAction` is a single string off the last step. Everything else
              on the surface answers what a run DID.

              LIVE-ONLY IS THE RULING, NOT A PREFERENCE. The chips block that
              took a settled array of the same rows was deleted on 2026-08-21
              (the argument is kept in full at ToolStream.tsx:68-77): the Steps
              ledger below already renders every tool call, so a settled stream
              beside it is one fact on screen twice in two rhythms. Rendering
              only while `isLive` answers that, because the ledger is CLOSED on
              arrival (`readTab` returns null by default, :298-303, behind a
              toggle reading "Look at it", :1566) and it cannot say either of
              the two things this can.

              THE TWO FACTS IT ADDS, and they are the whole justification:
              `tool_calls.created_at` gives a per-call clock, which the ledger
              has nowhere (only the RUN row carries `time=`, :1016), and
              `tool_calls.latency_ms` gives how long each call took, which
              appears nowhere on this surface at all.

              WHAT STILL OVERLAPS, said here rather than left for the next
              reader to find: the ledger's tool_call row draws the SAME caption
              (`cap(stepLabel(s))`, :1046, which is `toolActionLabel`) and the
              SAME argument line (`summarizeArgs`, :1048). Live-only shrinks
              that window to the minutes a run is alive; it does not close it,
              because a reader can open Steps on a live run.

              `working` IS LITERALLY `isLive`, not a spinner flag. It changes
              one sentence: "Nothing called yet" for a run that has called
              nothing SO FAR, versus "This run called no tools" for one that
              never will. Passing it wrong tells the reader the opposite of the
              truth.

              `label` REPEATS THE REGION TITLE ON PURPOSE. It is never painted —
              it is the `role="log"` aria-label (ToolStream.tsx:261) — so
              leaving the default would give a screen reader two different names
              for one region.

              NOT MOUNTED ON THE ORCHESTRATOR BRANCH. `getStudioSession` builds
              its trace list from `agent_slug='builder'` runs only
              (studio.functions.ts:844), so `toolCalls` is [] for a goal-run and
              this would print "Nothing called yet." over a run that is calling
              things. The follow-on has its data source already in hand:
              `MissionOrchestratorDetail` holds `hops[].tool_calls`
              (missions.functions.ts:484-489) and is missing only a summarized
              `args`. */}
            {isLive ? (
              <Region title="What it is calling">
                <ToolStream rows={calls} working label="What it is calling" />
              </Region>
            ) : null}

            {/* BEAT 1 AND 2 OF THE RETURN. The duration receipt is already on the
              headline, so what lands here is the agent's own account: whole, and
              short, with the rest one press away. This is the artefact that used
              to be a 180-character row two thirds of the way down a log. */}
            <ReturnSummary
              runs={runs}
              live={isLive}
              holder={holder}
              holderSlug={holderSlug}
              liveAction={liveAction}
            />

            {/* BEAT 3. What it ran to check itself, with the real exit codes, and
              an honest empty state when it checked nothing — which is a finding
              rather than an absence for anyone about to merge. */}
            <CheckedItself runs={runs} ci={ci?.checks ?? null} />

            <Region title="Tell it what to do next">
              {closedReason ? (
                <NothingYet>{closedReason}</NothingYet>
              ) : (
                <div onKeyDown={onNoteChord}>
                  <Textarea
                    rows={2}
                    value={note}
                    aria-label="What it should do next"
                    onChange={(e) => setNote(e.target.value)}
                  />
                  <Actions className="mt-mrd-4">
                    <Button
                      variant={call ? "default" : "primary"}
                      // The same glyph the runs board and the spec surface draw,
                      // and drawn on the same terms as the board: `canSend` is
                      // the entire condition the chord tests, so the keycap and
                      // the key cannot drift apart. An empty note has nothing to
                      // send, and a keycap on that button would be promising a
                      // press that does nothing.
                      shortcut={canSend ? "⌘⏎" : undefined}
                      disabled={!canSend}
                      onClick={() => steer.mutate()}
                    >
                      Send the note
                    </Button>
                    {isLive ? (
                      <Button
                        variant="quiet"
                        disabled={stopRun.isPending}
                        busy={stopRun.isPending}
                        onClick={() => {
                          void confirm({
                            title: "Stop this run?",
                            body: "It stops now and will not advance further. Its pending approvals clear and any held build claims release. Work already done is kept. This cannot be undone.",
                            confirmLabel: "Stop the run",
                            destructive: true,
                          }).then((ok) => {
                            if (ok) stopRun.mutate(missionId);
                          });
                        }}
                      >
                        {stopRun.isPending ? "Stopping" : "Stop the run"}
                      </Button>
                    ) : null}
                  </Actions>
                </div>
              )}
              {steers.map((s) => (
                <RunRow
                  key={s.id}
                  tight
                  mark={<YouMark initials={initials} mine size="row" />}
                  lead={s.message}
                  sub={s.consumed ? "It read this" : "Not read yet"}
                  time={ago(s.created_at)}
                />
              ))}
            </Region>

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
              horizontal scrollbar, and Wrap.

              BEAT 4, AND THE LOG'S NEW HOME. The roll-up is the block's own
              sub-line — the diffstat and the file count, which is the whole of
              what a returning reader needs before deciding to look — and every
              viewer behind it is COLLAPSED until asked for. Four things live in
              here now: the diff, the preview, the provenance chain, and the raw
              step log that used to be the first thing on the page.

              COLLAPSED IS NOT HIDDEN. The count is on screen with no press, the
              tab row is one press, and a `?tab=` link opens straight onto its
              view. What it stops is a screen of machinery standing between a
              person and the report they came for. */}
            <Region
              title="What it produced"
              sub={
                <>
                  {diff.files > 0 ? (
                    <>
                      <Diffstat added={diff.added} removed={diff.removed} /> lines across{" "}
                      <Figure>{diff.files}</Figure> {diff.files === 1 ? "file" : "files"}.{" "}
                    </>
                  ) : null}
                  {stepTotal > 0 ? (
                    <>
                      <Figure>{stepTotal}</Figure> {stepTotal === 1 ? "step" : "steps"}.{" "}
                    </>
                  ) : null}
                  {changeset?.pr_url ? (
                    <Door
                      onClick={() =>
                        window.open(changeset.pr_url as string, "_blank", "noopener,noreferrer")
                      }
                    >
                      Open the pull request
                    </Door>
                  ) : null}
                </>
              }
              toggle={tab ? "Hide it" : "Look at it"}
              toggled={Boolean(tab)}
              onToggle={() => (tab ? hideTabs() : openTab("changes"))}
            >
              {tab ? (
                <>
                  {/* THE THIRD HALF-BUILT TABLIST IN THIS SURFACE, NOW A REAL ONE.
                    It declared `role="tablist"` and `role="tab"` and delivered
                    none of what those roles promise: a screen reader announced
                    "tab, 1 of 4", a person pressed an arrow and nothing moved,
                    and every tab was its own tab stop, so tabbing through the
                    page walked a reader through four choices they had already
                    declined. `components/runs/Tabs.tsx` is the contract the runs
                    index already uses -- one tab stop, arrow keys, Home and End,
                    manual activation, and a panel that names its tab -- so this
                    is one implementation on the surface rather than two.
                    `group` is distinct from the index's ids because every
                    element id is derived from it and two rows on one page must
                    not collide. */}
                  <Tabs
                    group={PRODUCED_TABS}
                    label="What this run produced"
                    active={tab}
                    onSelect={openTab}
                    tabs={TAB_DISPLAY.map(([id, label]) => ({ id, label }))}
                  />
                  <TabPanel group={PRODUCED_TABS} active={tab}>
                    {tab === "changes" ? (
                      <ChangesPanel
                        changeset={changeset}
                        changes={changes}
                        missionId={missionId}
                        fileSetPolicy={fileSetPolicy}
                        constraints={constraints}
                      />
                    ) : null}
                    {/* THE LOG, WHOLE. Every row it ever had, the same marks, the
                      same quoting of what the crew SAID versus what it DID, and
                      the same one control that opens the thoughts and the tail.
                      Nothing was deleted to make room for the report above it. */}
                    {tab === "steps" ? (
                      <>
                        {ledger.length === 0 ? (
                          <NothingYet>
                            Nothing has run yet. {holder} picks this up on its own and the steps
                            land here as they happen.
                          </NothingYet>
                        ) : (
                          <>
                            {showAll ? ledger : ledger.slice(0, VISIBLE)}
                            {ledger.length > VISIBLE || hasThoughts ? (
                              <Actions className="mt-mrd-4">
                                <Door onClick={() => setShowAll((v) => !v)}>
                                  {showAll ? "Just what it did" : "Everything it did and said"}
                                </Door>
                              </Actions>
                            ) : null}
                          </>
                        )}
                      </>
                    ) : null}
                    {tab === "preview" ? (
                      <PreviewPanel missionId={missionId} changeset={changeset} isLive={isLive} />
                    ) : null}
                    {tab === "receipts" ? <ReceiptsPanel missionId={missionId} /> : null}
                  </TabPanel>
                </>
              ) : null}
            </Region>
          </>
        )}
      </div>
    </Surface>
  );
}

export const Route = createFileRoute("/_authenticated/runs/$missionId")({
  // Optional, so a dispatch surface can navigate without search. A MISSING tab
  // is now a real state and the default one: the tabbed region stays closed and
  // the reader lands on the report. Every value that ever worked still opens it.
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
        <PageHeading
          title={missing ? "There is no run at this address." : "This run did not load."}
        />
        {missing ? (
          <>
            <NothingYet>
              It was deleted, or it belongs to another workspace. What it decided and learned stays
              in the record.
            </NothingYet>
            <Actions className="mt-mrd-4">
              <Button variant="primary" onClick={reset}>
                Try again
              </Button>
            </Actions>
          </>
        ) : (
          <ReadFailedLine onRetry={reset}>{clip(message, 200)}</ReadFailedLine>
        )}
      </Surface>
    );
  },
});
