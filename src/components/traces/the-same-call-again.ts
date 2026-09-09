/**
 * AN AGENT THAT RAN THE SAME CALL FOUR TIMES BELIEVING THEY WERE DIFFERENT.
 *
 * ── THE TRACE THIS WAS READ OFF, AND IT IS WORSE THAN IT LOOKS ────────────
 * `0588c262` on Helio Labs, Research's turn at Discover. The model's own
 * thoughts, in order, out of `ai_events`:
 *
 *   "I'll check what signals already exist in the workspace related to this
 *    topic."
 *   "I'll broaden the search to include related terms like 'installer
 *    reschedule', 'homeowner reschedule'..."
 *   "Still no signals found for 'installer reschedule'. I'll try another
 *    variation: 'homeowner reschedule' to capture user-facing language."
 *   "No signals found for 'homeowner reschedule' either. I'll try 'order page
 *    reschedule' to focus on the specific UI location."
 *
 * Four searches, four phrasings, a visible strategy. And the four rows it
 * actually executed, out of `tool_calls.args`:
 *
 *   signals.list  {"limit": 20, "lookback_days": 90}
 *   signals.list  {"limit": 20, "lookback_days": 90}
 *   signals.list  {"limit": 20, "lookback_days": 90}
 *   signals.list  {"limit": 20, "lookback_days": 90}
 *
 * **Byte identical.** `signals.list` takes no query -- its own description in
 * the system prompt says it is "filterable by source_kind, tag, sentiment, and
 * how many days back to look" -- so every phrasing the model invented went
 * nowhere, and it ran one search four times.
 *
 * It then called `sense.found_nothing` with
 * `searched: "reschedule installer visit order page, installer reschedule,
 * homeowner reschedule, order page reschedule"`, putting four searches that
 * never happened as distinct onto the evidence record, where every later run
 * reads them. The station's final message calls the searches "exhaustive".
 *
 * ── HOW OFTEN, MEASURED ───────────────────────────────────────────────────
 * Across 30 days, 3,207 tool calls in 865 traces: **107 calls are byte
 * identical to the one before them, in 79 traces.** About one trace in eleven.
 * By tool:
 *
 *   signals.list   52 repeats over 32 traces
 *   signals.log    25 over 19      <- a WRITE, so the same signal logged again
 *   mission.plan   13 over 13
 *   themes.list     7 over 7
 *
 * ── WHAT THIS DOES, AND WHAT IT DELIBERATELY DOES NOT ─────────────────────
 * It marks them. That is all, and it is the point: the trace page drew four
 * rows reading "Research ran signals.list, last 90 days, 0 results" and every
 * one of them was true, so nothing on the page was wrong and nothing on the
 * page could be read. The four identical lines were the evidence and their
 * sameness was the finding.
 *
 * It does not diagnose. Whether the model misread the tool, the executor
 * dropped an argument, or a retry fired is a question about the loop, and this
 * surface reads `tool_calls` and cannot tell. Naming a cause it has not read is
 * the defect this screen is being repaired for. The fix belongs to the lane
 * that owns the tool contract; the SIGHTING belongs here, because a defect no
 * surface can show is a defect nobody finds.
 *
 * ── AND NOT ADJACENCY, BECAUSE THE ROWS ARE NEVER ADJACENT ────────────────
 * The trace interleaves the model's thought before each call, so two identical
 * calls always have an event between them. A fold like the transcript's, which
 * walks consecutive rows, finds nothing here. The unit is "this exact call has
 * been made before in this trace", which is also the truer question: an agent
 * that repeats itself three calls apart has repeated itself.
 */

export type TraceCall = {
  id: string;
  tool: string;
  /** `tool_calls.args`, as the row holds it. */
  args: unknown;
};

export type Repeats = {
  /** Call ids that repeat an earlier call in this trace, exactly. */
  repeated: ReadonlySet<string>;
  /** How many calls repeat an earlier one. */
  count: number;
  /** The tools it happened to, most repeats first. */
  tools: string[];
};

/**
 * Stable across key order, so `{a:1,b:2}` and `{b:2,a:1}` are one call.
 *
 * `JSON.stringify` alone is not: two objects with the same fields written in a
 * different order produce different strings, and a model emitting its arguments
 * in a different order is not making a different call.
 */
function fingerprint(tool: string, args: unknown): string {
  const canon = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(canon);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      return Object.keys(o)
        .sort()
        .reduce<Record<string, unknown>>((acc, k) => {
          acc[k] = canon(o[k]);
          return acc;
        }, {});
    }
    return v;
  };
  return `${tool} ${JSON.stringify(canon(args) ?? null)}`;
}

/**
 * Which calls in this trace repeat one already made, and how many.
 *
 * `calls` arrives in the order they ran. The FIRST of a set is never marked:
 * it is the call, and only the ones after it are the repetition.
 */
export function theSameCallAgain(calls: readonly TraceCall[]): Repeats {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  const byTool = new Map<string, number>();

  for (const c of calls) {
    const key = fingerprint(c.tool, c.args);
    if (seen.has(key)) {
      repeated.add(c.id);
      byTool.set(c.tool, (byTool.get(c.tool) ?? 0) + 1);
    } else {
      seen.add(key);
    }
  }

  return {
    repeated,
    count: repeated.size,
    tools: [...byTool.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t),
  };
}

/**
 * The one line above the list, or null when nothing repeated.
 *
 * It states the count and the tool and stops. No verdict on whether this was
 * waste, because sometimes it is not -- a poll, a retry after a write, a check
 * that something is still true are all legitimate repeats -- and no diagnosis,
 * because this surface cannot see the cause. A reader who knows the tool knows
 * at once which kind they are looking at, and that reader is who this page is
 * for.
 */
export function sameCallLead(r: Repeats, seat: string): string | null {
  if (r.count === 0) return null;
  const times = r.count === 1 ? "once" : `${r.count} times`;
  return r.tools.length === 1
    ? `${seat} made the same ${r.tools[0]} call again, ${times}, with identical arguments.`
    : `${seat} repeated ${r.tools.length} calls with identical arguments, ${times} in all.`;
}
