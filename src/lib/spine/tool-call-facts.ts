/**
 * WHAT A TOOL CALL WAS ABOUT, IN ONE SHORT LINE, WITHOUT ITS PAYLOAD.
 *
 * ── THE GAP (Lane 2, 2026-09-08) ─────────────────────────────────────────
 * A person watching a run saw "Discovery Scout is searching the workspace"
 * eleven times in a row and could not tell the searches apart, because the
 * run screen's read of `tool_calls` selected the tool's name and never its
 * arguments. The record has them: the query searched, the paths read, the
 * files staged, the title of the call recorded. Those are the work; the verb
 * alone is a status.
 *
 * ── WHY THE REDUCTION HAPPENS HERE AND NOT ON THE CLIENT ────────────────
 * `args` on a `studio.stage` row carries the file contents (measured
 * 2026-09-08: 2.5 KB on average, 10 KB at most) and `result` on a `repo.read`
 * carries the file. Neither may travel to a pane that polls every half second
 * (P-32: no payload the screen does not draw). So the server keeps the row and
 * hands the client four small facts: the argument a person would repeat, the
 * count a listing returned, the paths it touched, and whether it wrote them.
 *
 * Measured against the 21 days of `tool_calls` on 2026-09-08 (2,700 rows):
 * every tool's argument keys are covered below, and the generic fallback
 * picks the first key a person would read on any tool the catalogue grows.
 *
 * Pure. Never throws on a malformed row: an argument the record cannot say
 * is null, never a guess.
 */

export type ToolCallFacts = {
  /**
   * The thing the call was about, readable after the call's caption: the query
   * in quotes, the path, the title. Null when the arguments name nothing a
   * person would repeat (an id, a limit).
   */
  argument: string | null;
  /**
   * How many rows a listing or a search returned, when the result is a list.
   * Null for anything else: a zero is never invented for an object.
   */
  found: number | null;
  /** Repository paths the call read or wrote, when it names any. */
  files: string[];
  /** Whether those paths were written or read. Null when there are none. */
  touch: "wrote" | "read" | null;
};

export const ARGUMENT_MAX = 120;

/** Tools whose argument is a search the seat ran, read as "for “…”". */
export const SEARCH_TOOLS = new Set([
  "workspace.search",
  "repo.search",
  "prd.search",
  "brain.search_decisions",
  "web.search",
  "signals.list",
  "themes.list",
  "workspace.list_tasks",
]);

type Obj = Record<string, unknown>;

function isObj(v: unknown): v is Obj {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function firstLine(s: string): string {
  const nl = s.indexOf("\n");
  return nl === -1 ? s : s.slice(0, nl).trim();
}

/** Clip to the width a stream row has, on a word where one is near. */
export function clip(s: string, max = ARGUMENT_MAX): string {
  if (s.length <= max) return s;
  const cut = s.lastIndexOf(" ", max - 1);
  return `${s.slice(0, cut > max * 0.6 ? cut : max - 1).trimEnd()}…`;
}

function quoted(s: string): string {
  return `“${clip(firstLine(s))}”`;
}

function pathList(paths: string[]): string | null {
  const clean = paths.filter((p): p is string => typeof p === "string" && p.length > 0);
  if (clean.length === 0) return null;
  const shown = clean.slice(0, 3).join(", ");
  const more = clean.length - 3;
  return clip(more > 0 ? `${shown} +${more} more` : shown);
}

function strings(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string" && x.length > 0)
    : [];
}

/** The keys a person would read, in the order to prefer them. Quoted. */
const QUOTED_KEYS = [
  "query",
  "searched",
  "title",
  "name",
  "message",
  "brief",
  "instruction",
  "summary",
  "task",
  "content",
  "body",
] as const;

/** Plain keys: a path, an address, a provider. */
const PLAIN_KEYS = ["path", "url", "provider"] as const;

function generic(args: Obj): string | null {
  for (const k of QUOTED_KEYS) {
    const v = str(args[k]);
    if (v) return quoted(v);
  }
  for (const k of PLAIN_KEYS) {
    const v = str(args[k]);
    if (v) return clip(v);
  }
  return null;
}

function signalsListArgument(args: Obj): string | null {
  const parts: string[] = [];
  const tag = str(args.tag);
  const source = str(args.source_kind);
  const sentiment = str(args.sentiment);
  const days = typeof args.lookback_days === "number" ? args.lookback_days : null;
  if (tag) parts.push(`tagged ${tag}`);
  if (source) parts.push(`from ${source}`);
  if (sentiment) parts.push(sentiment);
  if (days !== null) parts.push(`last ${days} days`);
  return parts.length > 0 ? clip(parts.join(", ")) : null;
}

function prNumber(args: Obj): string | null {
  const n = args.pr_number;
  return typeof n === "number" ? `PR #${n}` : null;
}

export function toolCallFacts(tool: string, args: unknown, result: unknown): ToolCallFacts {
  const a: Obj = isObj(args) ? args : {};
  let argument: string | null = null;
  let files: string[] = [];
  let touch: ToolCallFacts["touch"] = null;

  switch (tool) {
    case "repo.read": {
      files = strings(a.paths);
      touch = files.length > 0 ? "read" : null;
      argument = pathList(files);
      break;
    }
    case "studio.stage": {
      const changes = Array.isArray(a.changes) ? a.changes : [];
      files = changes
        .map((c) => (isObj(c) ? str(c.path) : null))
        .filter((p): p is string => p !== null);
      touch = files.length > 0 ? "wrote" : null;
      argument = pathList(files);
      break;
    }
    case "studio.unstage": {
      /* Taken back off the change, which is neither a read nor a write of it. */
      argument = pathList(strings(a.paths));
      break;
    }
    case "signals.list":
      argument = signalsListArgument(a);
      break;
    case "github.ci.read":
    case "ci.logs":
      argument = prNumber(a);
      break;
    case "learning.record": {
      const verdict = str(a.verdict);
      const summary = str(a.summary);
      argument = summary ? quoted(summary) : verdict ? clip(verdict) : null;
      break;
    }
    case "agent.handoff": {
      const task = str(a.task);
      const to = str(a.to_agent_slug);
      argument = task ? quoted(task) : to ? `to ${to}` : null;
      break;
    }
    case "workspace.list_tasks": {
      const status = str(a.status);
      const priority = str(a.priority);
      const parts = [status, priority].filter((p): p is string => p !== null);
      argument = parts.length > 0 ? clip(parts.join(", ")) : null;
      break;
    }
    default:
      argument = generic(a);
  }

  let found: number | null = null;
  if (Array.isArray(result)) found = result.length;
  else if (isObj(result)) {
    const items = result.items ?? result.results ?? result.rows;
    if (Array.isArray(items)) found = items.length;
    else if (typeof result.count === "number") found = result.count;
    else if (typeof result.total === "number") found = result.total;
  }

  return { argument, found, files, touch };
}
