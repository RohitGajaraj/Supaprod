/**
 * THE STATION BEING WORKED, AS IT FILLS.
 *
 * ── WHY (founder, 2026-09-08) ────────────────────────────────────────────
 * "The agent does real work and the user sees almost none of it." While a
 * seat worked, the right pane said one sentence -- "Discover is running now,
 * and has not filed anything yet" -- and held it for fifty seconds. That is a
 * spinner with a noun. The record underneath was moving the whole time:
 * every search the seat ran, every file it read, every file it staged, each
 * written to `tool_calls` as it returned. This module turns those rows into
 * the three things a person watching wants: who is here, what they have done
 * so far, and the files filling in under their hands.
 *
 * ── WHAT IT REFUSES ──────────────────────────────────────────────────────
 * Nothing here is inferred from time. A seat is live because its run row says
 * `running`; a file is "wrote" because a `studio.stage` row names it; "nothing
 * matched yet" is said only when every search on record returned an empty
 * list. A count the record cannot give is left out, never zeroed.
 *
 * Pure. `LiveStation.tsx` reads the two queries the transcript already polls
 * and hands the rows here.
 */
import { SEARCH_TOOLS } from "@/lib/spine/tool-call-facts";

export type LiveCall = {
  id: string;
  tool: string;
  /** ms since epoch, when the call returned. */
  at: number;
  ok: boolean;
  runId: string | null;
  argument: string | null;
  found: number | null;
  files: string[];
  touch: "wrote" | "read" | null;
  error?: string | null;
  latencyMs?: number;
};

/** The calls the live seats made, oldest first. */
export function callsOf(calls: readonly LiveCall[], runIds: ReadonlySet<string>): LiveCall[] {
  return calls.filter((c) => c.runId !== null && runIds.has(c.runId)).sort((a, b) => a.at - b.at);
}

/**
 * The argument, phrased to follow the caption: a search reads "searching the
 * workspace for “…”", a read reads "reading the repository src/app.ts".
 */
export function objectOf(tool: string, argument: string | null): string | null {
  if (!argument) return null;
  return SEARCH_TOOLS.has(tool) ? `for ${argument}` : argument;
}

export type TouchedFile = {
  path: string;
  touch: "wrote" | "read";
  /** The seat that touched it last. */
  runId: string | null;
  /** When it was last touched. */
  at: number;
};

/**
 * Every path the live seats touched, in the order first touched, so the list
 * grows at the bottom. A path both read and then written is "wrote": the
 * write is the fact that matters, and it is the later one.
 */
export function filesTouched(calls: readonly LiveCall[]): TouchedFile[] {
  const byPath = new Map<string, TouchedFile>();
  for (const c of [...calls].sort((a, b) => a.at - b.at)) {
    if (!c.touch || c.files.length === 0) continue;
    for (const path of c.files) {
      const prior = byPath.get(path);
      if (!prior) {
        byPath.set(path, { path, touch: c.touch, runId: c.runId, at: c.at });
        continue;
      }
      prior.at = c.at;
      prior.runId = c.runId;
      if (c.touch === "wrote") prior.touch = "wrote";
    }
  }
  return [...byPath.values()];
}

const READS = new Set([
  "repo.read",
  "repo.tree",
  "prd.get",
  "brain.get_decision",
  "brain.outcome_history",
  "brain.due_forecasts",
  "brain.contradictions",
  "ship.get_release",
  "ship.list_releases",
  "ship.in_production",
  "sources.status",
  "github.ci.read",
  "ci.logs",
  "build.get_run",
  "build.changeset_history",
  "build.list_sessions",
  "mission.observe",
]);

/** What a writing tool leaves behind, one and many. */
const WRITES: Record<string, [string, string]> = {
  "studio.commit": ["commit", "commits"],
  "studio.fix.commit": ["fix committed", "fixes committed"],
  "studio.pr.open": ["PR opened", "PRs opened"],
  "signals.log": ["signal logged", "signals logged"],
  "tasks.create": ["task written", "tasks written"],
  "prd.draft": ["spec drafted", "specs drafted"],
  "prd.revise": ["spec revised", "spec revisions"],
  "design.draft": ["drawing", "drawings"],
  "decision.record": ["call recorded", "calls recorded"],
  "decision.revise": ["call revised", "calls revised"],
  "learning.record": ["verdict recorded", "verdicts recorded"],
  "critic.evaluate": ["check", "checks"],
  "studio.checks.run": ["check run", "checks run"],
  "github.issue.create": ["issue opened", "issues opened"],
  "memory.remember": ["note kept", "notes kept"],
};

function n(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}

/**
 * One line for what the live seats have done so far: "6 searches, 1 read ·
 * nothing matched yet", "9 reads, 3 files staged, 1 commit". Null before the
 * first call, so the caller draws the presence alone rather than a zero.
 */
export function soFar(calls: readonly LiveCall[]): string | null {
  let searches = 0;
  let reads = 0;
  let matched = 0;
  let counted = 0;
  const staged = new Set<string>();
  const writes = new Map<string, number>();
  let declaredNothing = false;

  for (const c of calls) {
    if (SEARCH_TOOLS.has(c.tool)) {
      searches++;
      if (c.found !== null) {
        counted++;
        matched += c.found;
      }
    } else if (READS.has(c.tool)) {
      reads++;
    } else if (c.tool === "studio.stage") {
      for (const p of c.files) staged.add(p);
    } else if (c.tool === "sense.found_nothing") {
      declaredNothing = true;
    } else if (WRITES[c.tool]) {
      writes.set(c.tool, (writes.get(c.tool) ?? 0) + 1);
    }
  }

  const parts: string[] = [];
  if (searches > 0) parts.push(n(searches, "search", "searches"));
  if (reads > 0) parts.push(n(reads, "read", "reads"));
  if (staged.size > 0) parts.push(n(staged.size, "file staged", "files staged"));
  for (const [tool, count] of writes) {
    const [one, many] = WRITES[tool]!;
    parts.push(n(count, one, many));
  }
  if (declaredNothing) parts.push("nothing to file, it says");
  if (parts.length === 0) return null;

  let tail: string | null = null;
  if (searches > 0 && counted > 0) {
    tail = matched > 0 ? n(matched, "match", "matches") : "nothing matched yet";
  }
  return tail ? `${parts.join(", ")} · ${tail}` : parts.join(", ");
}
