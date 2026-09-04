/**
 * THE THREE FILES FOR ONE TRACK, COMPOSED ONCE.
 *
 * ── WHY THIS IS ONE FUNCTION AND NOT TWO ──────────────────────────────────
 * They are read in two places that could not be further apart: the Plan tab
 * draws them for a person, and `studio.stage` writes them into the pull request
 * so the customer's repo carries the record the verdict was graded against.
 *
 * Composed twice they drift, and the drift is invisible in the worst way: the
 * screen shows one `intent.md` and the repo holds another, both plausible, with
 * no reason to compare them until somebody does and cannot say which is real.
 * The rendering itself is pure (`playbook-files.ts`); this is the one place that
 * says which rows feed it.
 *
 * ── WHAT IT READS, AND WHY THE JOINS ARE THESE ────────────────────────────
 * A track's artifacts are its `spine_track_members` rows. The decision carries
 * the intent and the forecast, the spec carries the body and the contract, and
 * the tasks carry the plan. All three are reached the same way, which is also
 * the join `studio_changesets` needed and did not have for a month.
 *
 * Every read fails soft into an empty section rather than throwing. A file that
 * says "not recorded yet" under a heading is honest and useful; a Plan tab that
 * fails to render because a spec was deleted is neither.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { intentMd, planMd, specMd, type Intent, type PlanTask } from "@/lib/spine/playbook-files";
import { specContract } from "@/components/track/spec-contract";

export type PlaybookFiles = {
  /** The rendered markdown, keyed by the name it takes in the repo. */
  files: { "intent.md": string; "spec.md": string; "plan.md": string };
  /** True when a decision, a spec or any task was found. */
  anything: boolean;
};

async function membersOf(
  supabase: SupabaseClient,
  trackId: string,
  kind: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from("spine_track_members")
    .select("artifact_id")
    .eq("track_id", trackId)
    .eq("artifact_kind", kind)
    /*
     * LIVE MEMBERS ONLY (P-112). This read everything the track had ever
     * carried, so a spec the track had replaced was still a candidate for the
     * record -- and the record is the one artifact whose whole worth is that it
     * says what was actually decided. The tablet track carried four specs and
     * three of them were superseded; the newest happened to be the live one, so
     * the file was right by accident rather than by rule.
     */
    .is("superseded_at", null);
  if (error) {
    console.error(`[playbook] could not read ${kind} for ${trackId}: ${error.message}`);
    return [];
  }
  return ((data ?? []) as Array<{ artifact_id: string | null }>)
    .map((m) => m.artifact_id)
    .filter((id): id is string => typeof id === "string" && id.length > 0);
}

export async function playbookFilesForTrack(
  supabase: SupabaseClient,
  trackId: string,
  title: string,
): Promise<PlaybookFiles> {
  const [decisionIds, prdIds, taskIds] = await Promise.all([
    membersOf(supabase, trackId, "decision"),
    membersOf(supabase, trackId, "prd"),
    membersOf(supabase, trackId, "task"),
  ]);

  let intent: Intent | null = null;
  let forecast: {
    claim?: string | null;
    observable?: string | null;
    horizon?: string | null;
  } | null = null;
  if (decisionIds.length > 0) {
    const { data } = await supabase
      .from("decisions")
      .select("intent,forecast_claim,forecast_how_we_will_know,forecast_horizon_date,created_at")
      .in("id", decisionIds)
      /* The call this work was made on is the FIRST one, not the newest: a
         revision recorded later is a change to the same bet, and `intent.md` is
         the handoff that started the work. */
      .order("created_at", { ascending: true })
      .limit(1);
    const d = (data ?? [])[0] as
      | {
          intent?: unknown;
          forecast_claim?: string | null;
          forecast_how_we_will_know?: string | null;
          forecast_horizon_date?: string | null;
        }
      | undefined;
    if (d) {
      intent =
        d.intent && typeof d.intent === "object" && !Array.isArray(d.intent)
          ? (d.intent as Intent)
          : null;
      forecast = {
        claim: d.forecast_claim ?? null,
        observable: d.forecast_how_we_will_know ?? null,
        horizon: d.forecast_horizon_date ?? null,
      };
    }
  }

  let specTitle = title;
  let body: string | null = null;
  let measures: string[] = [];
  let nonGoals: string[] = [];
  /** The spec the record is about, so the plan can be scoped to it. */
  let specId: string | null = null;
  /** The contract's own intent sentence, when the spec carries one. */
  let contractIntent: string | null = null;
  if (prdIds.length > 0) {
    const { data } = await supabase
      .from("prds")
      .select("id,title,body_md,contract,created_at")
      .in("id", prdIds)
      .order("created_at", { ascending: false })
      .limit(1);
    const p = (data ?? [])[0] as
      | { id?: string; title?: string | null; body_md?: string | null; contract?: unknown }
      | undefined;
    if (p) {
      specId = p.id ?? null;
      specTitle = p.title?.trim() || title;
      body = p.body_md ?? null;
      /* The same reader the Plan tab uses, so the contract sections in the file
         and the contract sections on screen cannot disagree. */
      const c = specContract(p.contract);
      measures = c.measures;
      nonGoals = c.nonGoals;
      contractIntent = c.intent || null;
    }
  }

  let tasks: PlanTask[] = [];
  if (taskIds.length > 0) {
    const { data } = await supabase
      .from("tasks")
      .select("title,detail,status,seq,prd_id")
      .in("id", taskIds)
      // The plan's own order, which is what a reader works down.
      .order("seq", { ascending: true });
    const rows = (data ?? []) as Array<{
      title?: string | null;
      detail?: string | null;
      status?: string | null;
      prd_id?: string | null;
    }>;
    /*
     * ── THE PLAN IS THE PLAN FOR THIS SPEC (P-112) ─────────────────────────
     *
     * `plan.md` carried every task the track had ever been given, and a track
     * that has been re-specced has two generations of them. Measured on the
     * tablet track: seven tasks, none superseded, and near-duplicate pairs --
     * "Implement read-only address confirmation screen in Relay checkout" beside
     * "Implement read-only address confirmation screen with exact prototype
     * specifications", "Fix tablet address summary layout" beside "Fix tablet
     * address summary layout for 768px+ portrait orientation". A reader cannot
     * tell which list is the plan, and a record nobody can read is worse than
     * no record: it looks authoritative and is not.
     *
     * A task knows its spec (`tasks.prd_id`), so the plan is the tasks belonging
     * to the spec this file is about.
     *
     * FALLS BACK TO ALL OF THEM when no task carries the spec's id -- an older
     * track whose tasks predate the column, or a plan written before the spec.
     * Half a plan silently is worse than one that is honestly wide, and this
     * fallback is visible in the file rather than in a comment: the reader sees
     * everything, as before.
     */
    const forThisSpec = specId ? rows.filter((t) => t.prd_id === specId) : [];
    const chosen = forThisSpec.length > 0 ? forThisSpec : rows;
    tasks = chosen
      .filter((t) => (t.title ?? "").trim().length > 0)
      .map((t) => ({
        title: t.title as string,
        detail: t.detail ?? null,
        status: t.status ?? null,
      }));
  }

  return {
    files: {
      "intent.md": intentMd({ title, intent, forecast, contractIntent }),
      "spec.md": specMd({ title: specTitle, body, measures, nonGoals }),
      "plan.md": planMd({ title, tasks }),
    },
    anything: decisionIds.length > 0 || prdIds.length > 0 || tasks.length > 0,
  };
}
