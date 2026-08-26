/**
 * DECIDE'S METRIC PROBE — can the observable this forecast names be read at all?
 *
 * ── WHY THIS IS THE FIRST PROBE, AHEAD OF EVERY OTHER SANDBOX USE ──────────
 * `SESSION-0-CONDUCTOR.md` §1b ranks it first and says why: *"Prove the
 * observable a forecast names can be read today, returning a number. Without
 * this the verdict can never land, and the grader has processed zero workspaces
 * in its life (F-51)."* The verdict measured against the forecast is the moat —
 * not the artifact, not the record — and a forecast nothing can read is a moat
 * that never closes.
 *
 * ── WHAT THE DATABASE SAYS, MEASURED 2026-08-26 ────────────────────────────
 *   174  decisions carry `forecast_how_we_will_know` AND a horizon
 *    15  are already PAST their horizon and unresolved
 *     0  rows in `product_analytics` — ever, in any workspace
 *
 * So forecasts are being written with an observable named, they are coming due,
 * and **the analytics table the outcome machinery reads has never held a single
 * row.** F-51's "grader has processed zero workspaces" is not a broken grader.
 * There is nothing for it to read.
 *
 * ── THE RULE THIS FILE EXISTS TO ENFORCE ───────────────────────────────────
 * **A METRIC THAT CANNOT BE READ IS NOT ZERO.**
 *
 * This is F-76's lesson at the one place it would cost the most. There, a failed
 * PostgREST select came back as `data: null`, `data ?? []` turned it into an empty
 * list, and "the query failed" was read as "the work is empty". Here the same
 * shape would be far worse: an unreadable metric returned as `0` grades a forecast
 * as MISSED, writes that verdict into the record, and compounds it into every
 * future recommendation. **A wrong verdict is worse than no verdict**, because a
 * missing one is visibly missing and a wrong one is not.
 *
 * So `MetricReading` is a discriminated union with no numeric field on the
 * unreadable branch. A caller cannot accidentally read a number that does not
 * exist; the type will not let it.
 *
 * ── WHERE THE VALUE ACTUALLY IS, AND IT IS NOT AT THE HORIZON ──────────────
 * The obvious use is at Learn: read the number, grade the forecast. The valuable
 * use is at **Decide**, when the forecast is being written and can still be
 * changed. Asking *"is what you just promised checkable?"* at the moment of the
 * promise is worth more than discovering at the horizon that it never was — and
 * it is the difference between a forecast and a wish.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * What a probe can say. Deliberately a union: the unreadable branch carries NO
 * `value`, so no caller can read a number that was never measured.
 */
export type MetricReading =
  | {
      readable: true;
      /** The number, as read. Never defaulted, never coerced from null. */
      value: number;
      /** What the number counts, in the words a person would use. */
      label: string;
      /** Which source answered, so the reading can be re-run by hand. */
      source: string;
      /** When it was read. A number without its clock is not evidence. */
      readAt: string;
    }
  | {
      readable: false;
      /** Why not, in a sentence that names the next action where there is one. */
      reason: string;
      /** The source that would have answered, when one was identified. */
      source: string | null;
    };

/**
 * A source the probe knows how to read.
 *
 * `probe` returns a number or null; null means "this source has no answer for
 * that observable", which is NOT the same as zero and is why the return type is
 * nullable rather than defaulted.
 */
type MetricSource = {
  id: string;
  /** Does this source claim the observable? Matched on the forecast's own words. */
  claims: (howWeWillKnow: string) => boolean;
  probe: (
    supabase: SupabaseClient,
    workspaceId: string | null,
  ) => Promise<{ value: number; label: string } | null>;
};

/** Count a table for one workspace, or null when the read itself failed. */
async function countFor(
  supabase: SupabaseClient,
  table: string,
  workspaceId: string | null,
  extra?: (q: never) => never,
): Promise<number | null> {
  try {
    let q = supabase.from(table as never).select("id", { count: "exact", head: true });
    if (workspaceId)
      q = (q as never as { eq: (a: string, b: string) => never }).eq("workspace_id", workspaceId);
    if (extra) q = extra(q as never);
    const { count, error } = (await q) as unknown as { count: number | null; error: unknown };
    // `error` is read rather than discarded — F-76 shipped because it was not.
    if (error) return null;
    return typeof count === "number" ? count : null;
  } catch {
    return null;
  }
}

const has = (hay: string, ...needles: string[]) => {
  const h = hay.toLowerCase();
  return needles.some((n) => h.includes(n));
};

/**
 * The sources that can answer TODAY, in order of preference.
 *
 * Deliberately short. Every entry here reads a table that actually holds rows in
 * this database — adding a source that is always empty would reproduce exactly
 * the defect this file documents. `product_analytics` is the obvious candidate
 * and is NOT here for that reason: 0 rows, ever, in every workspace.
 */
const SOURCES: MetricSource[] = [
  {
    id: "spine_tracks",
    claims: (s) => has(s, "track", "piece of work", "work item", "reach learn", "complete"),
    probe: async (supabase, workspaceId) => {
      const value = await countFor(supabase, "spine_tracks", workspaceId);
      return value === null ? null : { value, label: "pieces of work" };
    },
  },
  {
    id: "decisions",
    claims: (s) => has(s, "decision", "call made", "bet"),
    probe: async (supabase, workspaceId) => {
      const value = await countFor(supabase, "decisions", workspaceId);
      return value === null ? null : { value, label: "decisions recorded" };
    },
  },
  {
    id: "signals",
    claims: (s) => has(s, "signal", "evidence", "feedback", "report"),
    probe: async (supabase, workspaceId) => {
      const value = await countFor(supabase, "signals", workspaceId);
      return value === null ? null : { value, label: "signals gathered" };
    },
  },
  {
    id: "deployments",
    claims: (s) => has(s, "deploy", "ship", "release", "live"),
    probe: async (supabase, workspaceId) => {
      const value = await countFor(supabase, "deployments", workspaceId);
      return value === null ? null : { value, label: "deployments" };
    },
  },
];

/**
 * Can this forecast's observable be read, and what does it say right now?
 *
 * Takes the forecast's own words rather than a decision id, so it can be asked at
 * Decide — before the row is even written — which is the use that matters.
 */
export async function probeObservable(
  supabase: SupabaseClient,
  howWeWillKnow: string | null | undefined,
  workspaceId: string | null,
): Promise<MetricReading> {
  const text = (howWeWillKnow ?? "").trim();

  if (!text) {
    return {
      readable: false,
      source: null,
      reason:
        "This forecast does not say how we would know. Name the thing to measure and it becomes checkable.",
    };
  }

  const source = SOURCES.find((s) => s.claims(text));
  if (!source) {
    /*
     * NOT A FAILURE, AND THE WORDING MATTERS. The forecast may be perfectly good
     * and simply name something we cannot reach yet — a number in someone's
     * analytics product, most often. Saying "no source" invites a person to
     * rewrite a sound forecast; saying "nothing here can read it yet" points at
     * the real gap, which is a connector nobody has wired.
     */
    return {
      readable: false,
      source: null,
      reason:
        "Nothing connected here can read that yet. Connect the source it lives in, or name an observable this workspace already records.",
    };
  }

  const got = await source.probe(supabase, workspaceId);
  if (!got) {
    return {
      readable: false,
      source: source.id,
      reason: `The ${source.id} reading did not come back, so there is no number — not a zero.`,
    };
  }

  return {
    readable: true,
    value: got.value,
    label: got.label,
    source: source.id,
    readAt: new Date().toISOString(),
  };
}

/**
 * The one-line answer for a surface: is what you just promised checkable?
 *
 * Separate from `probeObservable` because Decide does not want the number — it
 * wants to know whether a number will exist when the horizon arrives.
 */
export async function isForecastCheckable(
  supabase: SupabaseClient,
  howWeWillKnow: string | null | undefined,
  workspaceId: string | null,
): Promise<{ checkable: boolean; because: string }> {
  const reading = await probeObservable(supabase, howWeWillKnow, workspaceId);
  return reading.readable
    ? {
        checkable: true,
        because: `Readable now: ${reading.value} ${reading.label}, from ${reading.source}.`,
      }
    : { checkable: false, because: reading.reason };
}
