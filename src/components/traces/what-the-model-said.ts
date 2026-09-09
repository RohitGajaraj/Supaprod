/**
 * THE AGENT EXPLAINS EVERY STEP BEFORE IT TAKES IT, AND THE TRACE SHOWS THE JSON.
 *
 * ── WHAT IS ON THE SCREEN, READ LIVE 2026-09-09 ────────────────────────────
 * `/traces/899baa5a`, Critique's turn at Design. Seven model calls, and the
 * page draws each one as:
 *
 *   Critique called qwen/qwen-plus                                    4.72s
 *   {"thought":"I need to review the standing design system and the spec to
 *    evaluate the provi...
 *
 * ── WHAT IS ACTUALLY IN THAT STRING ────────────────────────────────────────
 * The same row, read out of `ai_events.output_preview`:
 *
 *   thought  "I need to review the standing design system and the spec to
 *             evaluate the provided prototype designs for differentiating the
 *             red status tile shown after an over-the-air firmware reboot from
 *             the red status tile shown during a real production outage..."
 *   action    tool_call, workspace.search
 *   reason   "I need to locate the official design system rules about color
 *             usage to verify whether amber (#FF9E44) is an approved semantic
 *             color for planned maintenance states, and whether using it here
 *             violates the constraint that 'Fault colour is reserved'."
 *
 * **The model writes down what it is thinking AND why it is about to do the
 * next thing, on every single step, and the deepest surface in the product
 * renders the punctuation around it.** All seven calls on that trace carry a
 * `thought`. This is the same defect as the transcript's "Filed nothing": the
 * meaning is in the data and the surface draws the container.
 *
 * ── WHY NOBODY HAD READ IT: `JSON.parse` NEVER SUCCEEDS HERE ───────────────
 * These are `*_preview` columns, and a preview is CUT. The first sample above
 * ends mid-string, inside the arguments of the tool call:
 *
 *   ..."args":{"query":"standing design system color s
 *
 * No closing quote, no closing brace. `JSON.parse` throws on essentially every
 * row of a busy trace, so the obvious implementation fails on the data and the
 * raw string survives as the only thing that always renders. That is the whole
 * reason this file exists and the whole reason it does not parse.
 *
 * ── SO IT SCANS RATHER THAN PARSES ─────────────────────────────────────────
 * Each field is read on its own, from its key to the end of its own string, and
 * a field that runs off the end of the preview is returned with what there is.
 * Three consequences, all of them wanted: a truncated row still yields its
 * thought, a row whose LAST field is cut still yields the fields before it, and
 * a row that is not this shape at all yields null so the caller can fall back
 * to what it drew before.
 *
 * NOTHING IS INVENTED AND NOTHING IS SUMMARISED. Every string returned is a
 * substring of what the model wrote, unescaped and no more. A step with no
 * thought returns no thought; the surface then says less rather than guessing.
 *
 * Pure and dependency-free.
 */

/** What one model call said about itself, in its own words. */
export type ModelStep = {
  /** The model's reasoning for this step. Null when it recorded none. */
  thought: string | null;
  /** What it decided to do next, when the step ends in an action. */
  action: {
    /** `tool_call`, `finish`, whatever the loop wrote. */
    kind: string | null;
    /** The tool, when it called one. */
    name: string | null;
    /** Why it chose this action. The most valuable field on the row. */
    reason: string | null;
  } | null;
  /** True when the preview was cut before its last field closed. */
  clipped: boolean;
};

/**
 * Read one JSON string value out of a possibly-truncated document.
 *
 * Starts at `"<key>"`, walks past the colon and the opening quote, then reads
 * until an UNESCAPED closing quote or the end of the input. Escapes are decoded
 * as JSON decodes them, because the value was written by `JSON.stringify` and a
 * thought containing a quoted phrase -- *the constraint that 'Fault colour is
 * reserved'* -- is the common case rather than the edge one.
 *
 * Returns the value and whether it ran off the end, because "this sentence
 * stops because the column stops" is a different fact from "this is the whole
 * sentence" and the surface renders them differently.
 */
export function readJsonString(
  src: string,
  key: string,
  from = 0,
): { value: string; end: number; clipped: boolean } | null {
  const at = src.indexOf(`"${key}"`, from);
  if (at === -1) return null;
  let i = at + key.length + 2;
  // Past the colon and any whitespace, to the opening quote.
  while (i < src.length && src[i] !== '"') {
    const c = src[i];
    if (c !== ":" && c !== " " && c !== "\n" && c !== "\r" && c !== "\t") return null;
    i += 1;
  }
  if (i >= src.length) return null;
  i += 1;

  let out = "";
  while (i < src.length) {
    const c = src[i];
    if (c === "\\") {
      const n = src[i + 1];
      if (n === undefined) return { value: out, end: src.length, clipped: true };
      if (n === "n") out += "\n";
      else if (n === "t") out += "\t";
      else if (n === "r") out += "\r";
      else if (n === "u") {
        const hex = src.slice(i + 2, i + 6);
        // A \u escape cut in half by the preview ends the value where it is.
        if (hex.length < 4) return { value: out, end: src.length, clipped: true };
        out += String.fromCharCode(parseInt(hex, 16));
        i += 6;
        continue;
      } else out += n;
      i += 2;
      continue;
    }
    if (c === '"') return { value: out, end: i + 1, clipped: false };
    out += c;
    i += 1;
  }
  // Ran off the end: the preview was cut inside this value.
  return { value: out, end: src.length, clipped: true };
}

/**
 * What this model call said, or null when the row is not that shape.
 *
 * Null rather than an empty `ModelStep`, so a caller can tell "this row has
 * nothing to show in this form" from "this row is a step whose fields are
 * empty", and fall back to the raw preview for the first. Plain prose output,
 * a tool RESULT, and a row from any other writer all return null.
 */
export function readModelStep(preview: string | null | undefined): ModelStep | null {
  if (!preview) return null;
  const src = preview.trim();
  // Only an object. A tool result is an array and is somebody else's shape.
  if (!src.startsWith("{")) return null;

  const thought = readJsonString(src, "thought");
  const kind = readJsonString(src, "type", thought?.end ?? 0);
  const name = readJsonString(src, "name", thought?.end ?? 0);
  const reason = readJsonString(src, "reason", thought?.end ?? 0);

  // Not this shape: an object that carries none of the four fields tells us
  // nothing, and rendering an empty step would be worse than the raw string.
  if (!thought && !kind && !name && !reason) return null;

  const action =
    kind || name || reason
      ? {
          kind: kind?.value || null,
          name: name?.value || null,
          reason: reason?.value || null,
        }
      : null;

  return {
    thought: thought?.value || null,
    action,
    clipped: Boolean(thought?.clipped || kind?.clipped || name?.clipped || reason?.clipped),
  };
}

/**
 * The step's action as one line a person reads, or null when there is none.
 *
 * The tool's own name is kept verbatim -- `workspace.search`, `design.draft` --
 * because it is what the agent called and renaming it here would put a second
 * vocabulary between a reader and the record. The surface sets it in the data
 * face; this only decides the words.
 */
export function actionLine(step: ModelStep): string | null {
  if (!step.action) return null;
  const { kind, name } = step.action;
  if (name) return name;
  // A step that ended rather than called something still says so, because
  // "it stopped here" is the answer to why there is no next row.
  if (kind && kind !== "tool_call") return kind.replace(/_/g, " ");
  return null;
}
