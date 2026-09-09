/**
 * ── AN ARGUMENT NOBODY REFUSES ───────────────────────────────────────────────
 *
 * Every tool's args go through `argsSchema.safeParse`, and a zod object strips
 * what it does not declare. So a key the model invented was deleted between the
 * model and the tool, the call succeeded, and NOTHING anywhere said the
 * argument had gone.
 *
 * ── WHAT THAT COST, MEASURED (worktree-1-68, 2026-09-09) ────────────────────
 * Trace 0588c262, Research at Discover. Its own thoughts name four searches:
 * the topic, then "installer reschedule", then "homeowner reschedule", then
 * "order page reschedule". The four rows it executed are byte identical,
 * `{"limit":20,"lookback_days":90}`, because `signals.list` had no query
 * argument and the `query` it emitted was stripped. It then called
 * `sense.found_nothing` with all four phrasings in `searched`, so the evidence
 * record now carries four searches that were one search run four times, and
 * every later run reads that record.
 *
 * Across 60 days of `ai_events`: 1,059 model outputs emit `days_back` (the
 * argument is `lookback_days`) and 228 emit a `query` beside `signals.list`.
 * Every one of them reached nothing and was told nothing. 107 of 3,207 tool
 * calls in 30 days are byte identical to the call before them, one trace in
 * eleven, and 25 of those are `signals.log` -- a WRITE.
 *
 * ── WHY REFUSING IS SAFE, AND WHY IT IS THE FIX ─────────────────────────────
 * A key the schema does not declare does nothing today, by construction, so
 * refusing the call cannot break a call that was working. What it changes is
 * that the model finds out. It already handles this shape: the branch beside
 * this one answers an unknown TOOL NAME by naming the valid ones, and the
 * model picks a real one instead of inventing five in a row. An unknown
 * ARGUMENT had no such branch.
 *
 * ── DERIVED FROM THE SCHEMA, NEVER FROM A LIST ──────────────────────────────
 * The accepted keys come out of the schema's own shape, so a tool that gains
 * an argument gains it here in the same commit. A hand-kept list beside the
 * schema is a second source, and second sources drift.
 */
import type { z } from "zod";

/**
 * The object at the heart of a tool's args schema, through the wrappers the
 * registry actually uses: `.refine()` (ZodEffects) and `.optional()`
 * (ZodOptional). Null when there is no plain object under there, or when the
 * object was told to keep what it does not declare -- in both cases this file
 * has no business saying which keys are unknown, and says nothing.
 */
function objectShape(schema: z.ZodTypeAny): Record<string, unknown> | null {
  let s = schema as unknown as {
    _def?: {
      typeName?: string;
      unknownKeys?: string;
      shape?: () => Record<string, unknown>;
      schema?: z.ZodTypeAny;
      innerType?: z.ZodTypeAny;
    };
  };
  for (let hop = 0; hop < 6; hop++) {
    const d = s?._def;
    if (!d) return null;
    if (d.typeName === "ZodObject") {
      if (d.unknownKeys === "passthrough") return null;
      return typeof d.shape === "function" ? d.shape() : null;
    }
    const inner = d.schema ?? d.innerType;
    if (!inner) return null;
    s = inner as typeof s;
  }
  return null;
}

/** The argument names a tool declares, in declaration order. */
export function acceptedArgKeys(schema: z.ZodTypeAny): string[] | null {
  const shape = objectShape(schema);
  return shape ? Object.keys(shape) : null;
}

/**
 * The keys the caller sent that the tool does not declare, in the order they
 * were sent. Empty when the schema cannot say (see `objectShape`), so a tool
 * this file cannot read is never refused on a guess.
 */
export function unknownArgKeys(schema: z.ZodTypeAny, args: unknown): string[] {
  const accepted = acceptedArgKeys(schema);
  if (!accepted || args == null || typeof args !== "object" || Array.isArray(args)) return [];
  return Object.keys(args as Record<string, unknown>).filter((k) => !accepted.includes(k));
}

/**
 * WHAT THE MODEL IS TOLD. It names what was refused and what the tool takes,
 * in that order, because the second is what it needs to write the next call.
 * It does not guess at intent ("did you mean lookback_days?"): a near-miss
 * suggestion that is wrong sends the model somewhere worse than the list does,
 * and the list is always true.
 */
export function unknownArgsMessage(tool: string, unknown: string[], accepted: string[]): string {
  const takes = accepted.length ? accepted.join(", ") : "(no arguments)";
  return `${tool} has no argument named ${unknown.join(", ")}. It takes: ${takes}. Those were dropped, so the call did NOT do what they asked for.`;
}
