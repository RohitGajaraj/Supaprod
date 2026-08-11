/**
 * WHAT A RUN GIVES YOU BACK, as data.
 *
 * A person opens /runs/$id after an agent worked for an hour without them. The
 * question they arrive with is not "what did it do", it is "what moved, and does
 * it need me". Everything in this file exists to answer that from the record
 * alone, and to refuse to answer where the record is silent.
 *
 * Pure on purpose, and separate from the components, for the reason
 * studio-format.ts already gives: fast refresh stays intact, and every rule
 * below is a rule a test can hold still. See run-return.test.ts.
 *
 * NOTHING HERE INVENTS. Every function returns null, or an empty list, where the
 * record does not carry the fact. That is the whole discipline of this surface:
 * a run summary that fills a gap with a plausible sentence is worth less than a
 * blank, because a person cannot tell which sentences were earned.
 */

/** A loop step, read STRUCTURALLY so this surface never imports the server
 *  module the union is declared in. `result` is the tool's own recorded return
 *  value and is the only place the checks below can read a verdict from. */
export type StepLike = {
  kind: string;
  text?: string;
  message?: string;
  name?: string;
  reason?: string;
  error?: string;
  status?: string;
  args?: unknown;
  result?: unknown;
};

export type RunLike = {
  run_id: string;
  status: string;
  output: string | null;
  created_at: string;
  last_checkpoint_at: string | null;
  steps: StepLike[];
};

/* ------------------------------------------------------------------ *
 * 1. The duration receipt
 * ------------------------------------------------------------------ */

function two(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/**
 * SECONDS-PRECISE, ALWAYS.
 *
 * THE DEFECT THIS REPLACES: this surface floored every elapsed time to whole
 * minutes, so a step that took forty seconds read "now" and a run that took
 * fifty-eight seconds had no duration at all. Rounding is what makes a duration
 * feel decorative. The measured shape in the products that get this right is a
 * plain, exact "Worked for 18m 6s", and the exactness is the point: it is a
 * claim about the machine that the machine can be held to.
 *
 * Hours pad minutes and seconds so a column of them lines up in tabular mono;
 * under an hour nothing is padded, because "6m 06s" reads as a stopwatch and
 * "6m 6s" reads as a sentence.
 */
export function formatDuration(ms: number): string | null {
  if (!Number.isFinite(ms) || ms < 0) return null;
  const total = Math.floor(ms / 1000);
  const s = total % 60;
  const m = Math.floor(total / 60) % 60;
  const h = Math.floor(total / 3600);
  if (h > 0) return `${h}h ${two(m)}m ${two(s)}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * How long this run has held the repo, in milliseconds, or null.
 *
 * WHERE THE END COMES FROM, in the order it is trusted. `completed_at` is the
 * mission's own recorded finish. Failing that, the latest checkpoint is the last
 * moment anything is known to have happened, which is a real observation rather
 * than an estimate. `updated_at` is deliberately NOT consulted: any later write
 * touching the row bumps it, so it would quietly report a run as having lasted
 * until the last time somebody archived it.
 *
 * While the run is alive the end is NOW, which makes this an elapsed counter.
 * Never a progress bar: a coding agent cannot know how long it will take, and a
 * bar that pretends otherwise is a lie a person catches inside one session.
 */
export function runSpanMs(input: {
  startedAt: string | null | undefined;
  completedAt: string | null | undefined;
  lastActivityAt: string | null | undefined;
  live: boolean;
  now: number;
}): number | null {
  const start = input.startedAt ? new Date(input.startedAt).getTime() : NaN;
  if (Number.isNaN(start)) return null;

  let end: number;
  if (input.live) {
    end = input.now;
  } else {
    const done = input.completedAt ? new Date(input.completedAt).getTime() : NaN;
    const last = input.lastActivityAt ? new Date(input.lastActivityAt).getTime() : NaN;
    if (!Number.isNaN(done)) end = done;
    else if (!Number.isNaN(last)) end = last;
    else return null;
  }

  const span = end - start;
  // A negative span means the two timestamps disagree, which is a fact about the
  // record and not a duration. Draw nothing rather than a number pointing back.
  return span < 0 ? null : span;
}

/** The last moment anything is known to have happened across every run. */
export function lastActivityAt(runs: RunLike[]): string | null {
  let best: string | null = null;
  let bestMs = -1;
  for (const r of runs) {
    for (const iso of [r.last_checkpoint_at, r.created_at]) {
      if (!iso) continue;
      const t = new Date(iso).getTime();
      if (!Number.isNaN(t) && t > bestMs) {
        bestMs = t;
        best = iso;
      }
    }
  }
  return best;
}

/* ------------------------------------------------------------------ *
 * 2. The first line: outcome and ask, never activity
 * ------------------------------------------------------------------ */

/**
 * The single highest-leverage line on the surface.
 *
 * THE REFRAME, from operator research on status updates: reporting ACTIVITY
 * ("met with X, researched Y") instead of PROGRESS toward an outcome is the
 * commonest failure of a status report. A run headline that says what the agent
 * is doing is activity. What it MOVED, and what it now needs a decision on, is
 * progress. So this returns exactly two things and nothing else: where it
 * landed, and what it wants from you.
 *
 * `ask` is null only when the record genuinely holds nothing waiting on a
 * person. An invented ask is worse than none: it teaches you to skip the line.
 */
export type Headline = {
  /** The outcome, ending in its own preposition when a duration follows it. */
  lead: string;
  /** Split out rather than baked into `lead` so the surface can set it in mono,
   *  which is the house rule for every duration. */
  duration: string | null;
  ask: string | null;
};

export function outcomeAndAsk(input: {
  missionStatus: string;
  live: boolean;
  pendingCalls: number;
  changesetStatus: string | null;
  productionDeployed: boolean;
  /** Whether `productionDeployed` is an answer at all. It is false both when
   *  nothing is in production and when the deployment read failed or has not
   *  come back, and only the caller can tell those apart. Optional, defaulting
   *  to known, so a caller that has no deployment read of its own keeps the
   *  behaviour it had. */
  productionKnown?: boolean;
  duration: string | null;
}): Headline {
  const d = input.duration;
  /** The same sentence with and without a duration, so a missing timestamp
   *  degrades to a shorter TRUE sentence rather than to a dangling "in". */
  const span = (withDuration: string, without: string) =>
    d ? { lead: withDuration, duration: d } : { lead: without, duration: null };

  // A call waiting on a human outranks every other state, including a failure:
  // it is the one thing on this page that stops entirely if nobody acts.
  if (input.pendingCalls > 0) {
    return {
      ...(input.live
        ? span("Running for", "Running")
        : { lead: "Stopped at a decision", duration: null }),
      ask:
        input.pendingCalls === 1 ? "It needs your call." : `${input.pendingCalls} calls need you.`,
    };
  }

  if (input.live) return { ...span("Running for", "Running"), ask: null };

  if (input.missionStatus === "queued" || input.missionStatus === "proposed") {
    return { lead: "Waiting to start", duration: null, ask: null };
  }

  if (input.missionStatus === "failed" || input.missionStatus === "halted") {
    return { ...span("Stopped after", "Stopped"), ask: "It is stuck. Tell it what to do next." };
  }

  if (input.missionStatus === "cancelled") {
    return { lead: "Cancelled", duration: null, ask: null };
  }

  if (input.changesetStatus === "merged") {
    // "Merged, and not promoted yet" is a claim about production, and it was
    // being made off a deployment read that may have failed or may not have come
    // back. The run surface tells the same truth in its Production stage line;
    // if this said it anyway the two halves of one screen would contradict each
    // other, which is how the false half gets believed. Added 2026-08-11.
    if (input.productionKnown === false) {
      return {
        ...span("Finished in", "Finished"),
        ask: "Merged. We do not know yet whether it is live.",
      };
    }
    return input.productionDeployed
      ? { ...span("Shipped in", "Shipped"), ask: null }
      : { ...span("Finished in", "Finished"), ask: "Merged, and not promoted yet." };
  }
  if (input.changesetStatus === "pr_open") {
    return { ...span("Finished in", "Finished"), ask: "Ready for your review." };
  }
  if (input.changesetStatus === "staged" || input.changesetStatus === "committed") {
    return {
      ...span("Finished in", "Finished"),
      ask: "No pull request yet. Nothing opens itself.",
    };
  }

  return { ...span("Finished in", "Finished"), ask: null };
}

/* ------------------------------------------------------------------ *
 * 3. The agent's own summary
 * ------------------------------------------------------------------ */

/**
 * The single most valuable artefact a run produces, found in the record.
 *
 * THE DEFECT THIS REPLACES: the final message was rendered as one anonymous row
 * in the step list, cut at 180 characters, mid-sentence. It is the agent's whole
 * account of an hour's work.
 *
 * `output` is a fallback and only for a COMPLETED run. On every other status the
 * loop writes the halt reason, the pause message or the error into that same
 * column, and rendering one of those as "what it says it did" would be the
 * surface putting an apology in the agent's mouth.
 */
export function finalSummary(runs: RunLike[]): { text: string; runId: string } | null {
  for (let i = runs.length - 1; i >= 0; i -= 1) {
    const run = runs[i];
    for (let j = run.steps.length - 1; j >= 0; j -= 1) {
      const step = run.steps[j];
      const text = step.kind === "final" ? (step.message ?? "").trim() : "";
      if (text) return { text, runId: run.run_id };
    }
    const out = (run.output ?? "").trim();
    if (out && run.status === "completed") return { text: out, runId: run.run_id };
  }
  return null;
}

/**
 * SHORT BY DEFAULT, WHOLE ON REQUEST.
 *
 * "Slop grenades" is a real named pain: one team's word for AI output so verbose
 * that a designer built an agent purely to parse it. So the fix for a summary cut
 * at 180 characters is NOT to dump the whole thing into the reading column —
 * brevity is the feature here, not the polish. The lead is what a person reads;
 * the rest is one press away and is never thrown out.
 *
 * The cut lands on a SENTENCE boundary wherever one exists in range, because a
 * paragraph that stops at a full stop reads as written and a paragraph that stops
 * mid-clause reads as broken. Only when no sentence ends in range does it fall
 * back to a word boundary, and then it says so with an ellipsis.
 */
export function splitSummary(
  raw: string,
  max = 280,
): { lead: string; full: string; more: boolean } {
  const full = raw.replace(/\r\n/g, "\n").trim();
  if (!full) return { lead: "", full: "", more: false };

  const paragraphs = full.split(/\n{2,}/);
  const first = paragraphs[0].replace(/\s+/g, " ").trim();

  if (first.length <= max) {
    return { lead: first, full, more: paragraphs.length > 1 };
  }

  // The last sentence end at or before the budget. Closing quotes and brackets
  // ride along so a cut never orphans one.
  const window = first.slice(0, max);
  const sentence = /[.!?]["')\]]*(?=\s|$)/g;
  let cut = -1;
  for (let m = sentence.exec(window); m; m = sentence.exec(window)) {
    cut = m.index + m[0].length;
  }
  // Half the budget is the floor: a "sentence" ending in the first few words is
  // an abbreviation, not a sentence, and cutting there loses the paragraph.
  if (cut >= max / 2) return { lead: window.slice(0, cut).trim(), full, more: true };

  const space = window.lastIndexOf(" ");
  const lead = (space > 0 ? window.slice(0, space) : window).trim();
  return { lead: `${lead}…`, full, more: true };
}

export type ProseToken = { kind: "text" | "ref"; value: string };

/**
 * Typed inline references, at the SAME SIZE as the prose around them.
 *
 * A file path, a line range and a command are the parts of a summary a reader
 * checks rather than reads, and they are unreadable set in the same face as the
 * sentence carrying them. Mono at the same size keeps them inside the sentence;
 * shrinking them would turn evidence into a footnote.
 *
 * Three shapes are recognised and nothing else is guessed at:
 *   · anything the agent itself backticked, which is an explicit marking;
 *   · a slashed path, with an optional `:30` or `:30-32` line reference;
 *   · a bare filename with a code extension, same optional line reference.
 *
 * Trailing sentence punctuation is handed back to the prose, so "we changed
 * src/app.ts." does not produce a chip with a full stop inside it. A ref ending
 * in a digit is never trimmed, which is what protects the line numbers.
 */
const REF_PATTERN = new RegExp(
  [
    "`[^`\\n]+`",
    "(?:[\\w@.-]+/)+[\\w@.-]+(?::\\d+(?:-\\d+)?)?",
    "\\b[\\w.-]+\\.(?:tsx?|jsx?|mjs|cjs|css|scss|json|md|sql|ya?ml|toml|sh|py|rb|rs|go|java|kt|swift)\\b(?::\\d+(?:-\\d+)?)?",
  ].join("|"),
  "g",
);

export function typedRefs(text: string): ProseToken[] {
  const out: ProseToken[] = [];
  let last = 0;
  const push = (kind: ProseToken["kind"], value: string) => {
    if (!value) return;
    const prev = out[out.length - 1];
    if (prev && prev.kind === kind) prev.value += value;
    else out.push({ kind, value });
  };

  REF_PATTERN.lastIndex = 0;
  for (let m = REF_PATTERN.exec(text); m; m = REF_PATTERN.exec(text)) {
    let value = m[0];
    let tail = "";
    if (value.startsWith("`") && value.endsWith("`")) {
      value = value.slice(1, -1);
    } else {
      while (value.length > 1 && ".,;:!?)]".includes(value[value.length - 1])) {
        tail = value[value.length - 1] + tail;
        value = value.slice(0, -1);
      }
    }
    push("text", text.slice(last, m.index));
    push("ref", value);
    push("text", tail);
    last = m.index + m[0].length;
  }
  push("text", text.slice(last));
  return out;
}

/* ------------------------------------------------------------------ *
 * 4. How it checked itself
 * ------------------------------------------------------------------ */

/**
 * The tools on this platform that VERIFY rather than change anything.
 *
 * Named rather than pattern-matched: "anything with 'test' in it" would sweep up
 * the next tool that happens to be called `studio.tests.write`, and this block's
 * whole claim is that everything in it was a check.
 *
 * `studio.checks.run` is the only one that EXECUTES — it clones the branch into a
 * disposable sandbox and runs the repo's own commands. The rest are read-only
 * inspections. Both are evidence; they are not the same evidence, and the block
 * draws the executed one first.
 */
export const CHECK_TOOLS = new Set([
  "studio.checks.run",
  "studio.review",
  "studio.tests.plan",
  "studio.secrets.scan",
  "studio.deps.audit",
  "ci.logs",
  "github.ci.read",
]);

export type CheckState = "pass" | "fail" | "warn" | "quiet";

/** One command that actually ran in the sandbox, with its real exit code. */
export type SandboxCheck = {
  name: string;
  passed: boolean;
  exitCode: number | null;
  durationMs: number | null;
  timedOut: boolean;
  stderr: string | null;
};

export type CheckCall = {
  key: string;
  /** The literal invocation, exactly as the record holds it. */
  tool: string;
  /** What it answered, read from that tool's OWN recorded return value. */
  verdict: string | null;
  state: CheckState;
  /** Present only for the tool that executes commands. */
  ran: SandboxCheck[];
};

function obj(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : null;
}
function str(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v.trim() : null;
}

/** The sandbox's per-command results, or an empty list when this was not the
 *  tool that executes. Every field is copied straight through; nothing is
 *  derived, because an exit code is the whole reason to trust the row. */
function sandboxRuns(result: Record<string, unknown> | null): SandboxCheck[] {
  const rows = result?.checks;
  if (!Array.isArray(rows)) return [];
  const out: SandboxCheck[] = [];
  for (const raw of rows) {
    const r = obj(raw);
    const name = str(r?.name);
    if (!r || !name) continue;
    out.push({
      name,
      passed: r.passed === true,
      exitCode: typeof r.exit_code === "number" ? r.exit_code : null,
      durationMs: typeof r.duration_ms === "number" ? r.duration_ms : null,
      timedOut: r.timed_out === true,
      stderr: str(r.stderr),
    });
  }
  return out;
}

/**
 * Read one check call's verdict off its own result, in the order the record
 * makes a claim.
 *
 * DELIBERATELY GENERIC. A per-tool schema here would be a second copy of every
 * tool's return shape, maintained on the client, silently wrong the first time a
 * tool changes. These are the keys the verification tools actually agree on, and
 * a tool carrying none of them renders its status alone rather than a guess.
 */
function verdictOf(step: StepLike): { verdict: string | null; state: CheckState } {
  if (step.status === "error") return { verdict: str(step.error), state: "fail" };
  if (step.status === "denied") return { verdict: "You declined this.", state: "warn" };
  if (step.status === "queued") return { verdict: "Waiting on your call.", state: "quiet" };

  const r = obj(step.result);
  if (!r) return { verdict: null, state: "quiet" };

  // A tool that could not run says so, and that is never a pass.
  if (r.available === false) {
    return { verdict: str(r.reason) ?? "It could not run here.", state: "warn" };
  }

  const ran = sandboxRuns(r);
  if (ran.length > 0) {
    const failed = ran.filter((c) => !c.passed).length;
    return {
      verdict: failed === 0 ? null : `${failed} of ${ran.length} failed`,
      state: failed === 0 ? "pass" : "fail",
    };
  }

  const verdict = str(r.verdict);
  if (verdict) {
    const state: CheckState =
      verdict === "approve" ? "pass" : verdict === "block" ? "fail" : "warn";
    return { verdict: str(r.summary) ?? verdict, state };
  }

  if (typeof r.clean === "boolean") {
    return {
      verdict: r.clean ? "Nothing found." : (str(r.note) ?? "It found something."),
      state: r.clean ? "pass" : "fail",
    };
  }

  if (Array.isArray(r.gaps)) {
    const n = r.gaps.length;
    return {
      verdict: n === 0 ? "No test file missing." : `${n} test file${n === 1 ? "" : "s"} still owed`,
      state: n === 0 ? "pass" : "warn",
    };
  }

  if (typeof r.may_proceed === "boolean") {
    return { verdict: str(r.reason), state: r.may_proceed ? "pass" : "warn" };
  }

  return { verdict: str(r.note) ?? str(r.reason) ?? str(r.detail), state: "quiet" };
}

/**
 * Every check the agent ran on itself, newest run last, in the order it ran them.
 *
 * WHAT THIS CANNOT SHOW, stated rather than papered over: the literal shell
 * strings. `studio.checks.run` builds its commands server-side and records the
 * check's NAME, exit code, duration and stderr — not the command line. So the row
 * carries the exit code, which is the part a person can actually re-run against,
 * and the stderr verbatim when it failed. Printing a command string this file
 * guessed at would be the one thing worse than not printing one.
 */
export function checkCalls(runs: RunLike[]): CheckCall[] {
  const out: CheckCall[] = [];
  for (const run of runs) {
    run.steps.forEach((step, i) => {
      if (step.kind !== "tool_call") return;
      const tool = step.name ?? "";
      if (!CHECK_TOOLS.has(tool)) return;
      const { verdict, state } = verdictOf(step);
      out.push({
        key: `${run.run_id}-${i}`,
        tool,
        verdict,
        state,
        ran: sandboxRuns(obj(step.result)),
      });
    });
  }
  return out;
}

/** Milliseconds, as the seconds a person reads. Under ten seconds keeps one
 *  decimal, because the difference between 0.4s and 4s is the difference
 *  between a cached check and a real one. */
export function formatCheckDuration(ms: number | null): string | null {
  if (ms == null || !Number.isFinite(ms) || ms < 0) return null;
  const s = ms / 1000;
  if (s < 10) return `${s.toFixed(1)}s`;
  return formatDuration(ms);
}
