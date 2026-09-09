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
  /**
   * WHAT CAME BACK, IN WORDS. Null when the result names nothing a person
   * would read, or when it would only repeat `argument`.
   *
   * ── WHY A FOURTH FACT, MEASURED 2026-09-10 ──────────────────────────────
   * `argument` answers what the call was ABOUT and `found` how many rows came
   * back. Neither can speak for a call whose argument is an id and whose
   * result is an object:
   *
   *   Engineer ran prd.get   {"id":"5446f8a8-7886-4696-9042-4eea8876b5fa","title":"Let a…
   *   Critique ran critic.evaluate  {"ok":true,"review":{"board":[{"persona":"exec","ver…
   *
   * **710 of 3,490 tool calls -- one row in five -- render as raw JSON on the
   * trace page for exactly this reason**, and they are the substantive ones:
   * `sources.status` (124), `prd.get` (91), `ci.status` (35), `critic.review`
   * (21). The meaning is sitting in a named field of the result and nothing
   * reads it.
   *
   * NULL ON THE RUN SCREEN, BY DESIGN. `track.functions.ts` hands this
   * function `{count}` in place of the result, because a real `result` is too
   * big to travel to a pane that polls (P-32). So this is the trace page's
   * fact, the one surface that holds the whole row, and the transcript keeps
   * the two it already had.
   */
  outcome: string | null;
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

/** A finite number, or null. `NaN` and infinities are not counts. */
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/**
 * The keys a RESULT carries that a person would read, in preference order.
 *
 * Read off the record rather than guessed: `prd.get` and `brain.get_decision`
 * return `title`, `design.draft` returns `name`, `cluster.trigger` and
 * `research.synthesize` return a `message` that is already an English
 * sentence, `critic.review` returns a `note`, and `sense.found_nothing`
 * returns `next`. One list covers all of them and every tool the catalogue
 * grows that answers in the same shape.
 */
const RESULT_QUOTED_KEYS = ["title", "name"] as const;
const RESULT_PLAIN_KEYS = ["message", "note", "next", "summary"] as const;

/**
 * What the result says, for the calls whose meaning is in what came back.
 *
 * NAMED FIELDS ONLY. There is no attempt to read an English sentence and
 * decide what kind of answer it is; that is a classifier over prose, which is
 * a second thing to be wrong and which `nowhere-to-look-yet.ts` records the
 * cost of. Every branch here reads a key by name and formats numbers.
 */
function resultSaid(tool: string, result: unknown): string | null {
  if (!isObj(result)) return null;

  switch (tool) {
    /*
     * THE ANSWER NOTHING EVER SURFACED. Measured: 124 `sources.status` calls
     * in this product's history and 124 of them returned zero scout targets.
     * The one fact that explains why Discover keeps finding nothing has been
     * on the deepest page all along, as `{"active_scout_targets":0,…}`.
     */
    case "sources.status": {
      const targets = num(result.active_scout_targets);
      const by = isObj(result.signals_7d_by_source) ? result.signals_7d_by_source : {};
      const signals = Object.values(by).reduce<number>((t, v) => t + (num(v) ?? 0), 0);
      if (targets === null) return null;
      const sources = targets === 0 ? "no sources connected" : `${targets} sources connected`;
      /* The signal count only when there are any: "0 signals in 7 days" beside
         "no sources connected" is the same news twice. */
      return signals > 0 ? `${sources} · ${signals} signals in 7 days` : sources;
    }

    /* A CI result is a verdict and a ratio, and it rendered as neither. */
    case "ci.status": {
      const passed = num(result.passed);
      const suites = num(result.suites);
      const verdict = str(result.result);
      const failing = str(result.failing);
      const ratio = passed !== null && suites !== null ? `${passed} of ${suites} passed` : null;
      const parts = [verdict, ratio, failing ? `${failing} failing` : null].filter(
        (p): p is string => p !== null,
      );
      return parts.length > 0 ? clip(parts.join(" · ")) : null;
    }

    /* A review is its verdict. The objections are a paragraph and the detail
       pane beside the row is where a paragraph belongs. */
    case "critic.review":
    case "critic.evaluate": {
      const direct = str(result.verdict);
      if (direct) return direct;
      const board = isObj(result.review) ? result.review.board : null;
      if (!Array.isArray(board) || board.length === 0) return null;
      const verdicts = board
        .map((b) => (isObj(b) ? str(b.verdict) : null))
        .filter((v): v is string => v !== null);
      if (verdicts.length === 0) return null;
      /* Every seat agreeing is one verdict; a split board is the news. */
      const distinct = [...new Set(verdicts)];
      return distinct.length === 1
        ? `${distinct[0]}, all ${verdicts.length}`
        : clip(distinct.join(", "));
    }

    default:
      break;
  }

  for (const k of RESULT_QUOTED_KEYS) {
    const v = str(result[k]);
    if (v) return quoted(v);
  }
  for (const k of RESULT_PLAIN_KEYS) {
    const v = str(result[k]);
    if (v) return clip(firstLine(v));
  }
  return null;
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

  /*
   * NEVER THE ARGUMENT TWICE. `decision.record` passes its title in the args
   * AND gets it back in the result; a row reading
   * `"Adopt checkout_single_address…" · "Adopt checkout_single_address…"`
   * is the discriminator defect this repo has been repaired for all week, and
   * the guard belongs here rather than in each of the two call sites.
   */
  const said = resultSaid(tool, result);
  const outcome = said && said !== argument ? said : null;

  return { argument, found, files, touch, outcome };
}
