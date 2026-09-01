import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed } from "../supabase-for-user";

/**
 * ── WHAT AN AGENT USING THIS PLATFORM COULD NOT SEE ───────────────────────
 *
 * THE QUESTION THIS ANSWERS is the second half of the goal's opening
 * instruction, and the half that had not been asked: *"Then ask the same for an
 * agent using the platform -- what does it need exposed?"*
 *
 * Supaprod IS an MCP server, so that question is testable rather than
 * rhetorical. Counted 2026-09-01, the whole surface a customer's own agent could
 * reach was four read-only tools: `whoami`, `list_workspaces`,
 * `list_decisions`, `search_signals`.
 *
 * So an agent could list the decisions a workspace had made and could NOT see:
 *
 *   - a piece of work at all, or which station it is standing on
 *   - whether it is moving, held, or finished
 *   - that it is WAITING ON A PERSON, which 97 of 106 tracks have been
 *
 * A human on the board can see every one of those. The MCP surface is the same
 * product with the same rows behind it, and it exposed none of them -- so any
 * orchestrator, Slack bot or customer-side agent could read what was DECIDED and
 * had no way to find out what is HAPPENING. That is the seam this closes: the
 * agent-facing surface was two stations behind the human-facing one.
 *
 * ── READ ONLY, AND THE WRITE IS DELIBERATELY NOT HERE ─────────────────────
 * The obvious next tool is "answer an approval", because a held run is the most
 * common state in this product and answering one is what unblocks it. It is not
 * in this commit and that is a decision rather than an omission: an approval is
 * a HUMAN gate by construction (R-18 disqualifies a run a person touched
 * mid-flight; the acceptance query excludes any track carrying an answered
 * approval). An agent settling one would not just be a permission question, it
 * would change what the product's own acceptance measures. That belongs to the
 * founder, not to a tool definition.
 *
 * ── WHY IT REPORTS THE HOLD REASON VERBATIM ───────────────────────────────
 * `last_hold` is the driver's own reason a run stopped -- the column the app
 * reads as `Track.holdReason`. (I wrote `hold_because` first, which is the name
 * a migration comment uses; `tsc` refused it against the generated types, which
 * is the check earning its place: a wrong column name here would have shipped as
 * an empty field on every row rather than as an error.) An agent
 * deciding whether to escalate, wait or tell somebody needs the reason and not a
 * status word: "waiting on you" and "waiting on a date" are both `open` and
 * demand opposite responses. Passing the raw sentence keeps the caller's options
 * open and keeps this tool out of the business of interpreting it.
 *
 * RLS DOES THE TENANCY. `supabaseForUser` is the caller's own client, so a
 * token that cannot see a workspace cannot see its runs -- the same boundary the
 * browser gets, not a parallel one that has to be kept in step.
 */
export default defineTool({
  name: "list_runs",
  title: "List runs",
  description:
    "List pieces of work in a Supaprod workspace with the station each is standing on, whether it is moving or held, and why it stopped. Use list_workspaces to find the workspace_id. Pass waiting_on_person to see only the runs that need a human answer.",
  inputSchema: {
    workspace_id: z.string().uuid().describe("Workspace UUID from list_workspaces."),
    waiting_on_person: z
      .boolean()
      .describe("Only runs that have stopped and need a person to answer something.")
      .optional(),
    limit: z.number().int().min(1).max(100).default(25).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ workspace_id, waiting_on_person, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    let q = supabase
      .from("spine_tracks")
      .select("id, title, station, status, last_hold, entry_station, driven_at, created_at")
      .eq("workspace_id", workspace_id)
      /* Most recently moved first. A caller polling this wants what changed, and
         `driven_at` is the column that answers that; `created_at` would put a
         stale run above one that moved a minute ago. */
      .order("driven_at", { ascending: false, nullsFirst: false })
      .limit(limit ?? 25);

    /*
     * "WAITING ON A PERSON" IS A HOLD THAT NAMES ONE, not simply `status =
     * 'open'`. An open run may be mid-flight, or waiting on a date it cannot
     * hurry. Filtering on the presence of a hold sentence is the narrowest
     * honest reading available from these columns, and the caller still gets the
     * sentence so it can tell the two apart itself.
     */
    if (waiting_on_person) q = q.not("last_hold", "is", null);

    const { data, error } = await q;
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    const runs = (data ?? []).map((r) => ({
      ...(r as Record<string, unknown>),
      /* The one derived field, because a caller should not have to know that a
         hold sentence implies a stop. Everything else is the row as stored. */
      is_held: Boolean((r as { last_hold?: string | null }).last_hold),
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(runs) }],
      structuredContent: { runs },
    };
  },
});
