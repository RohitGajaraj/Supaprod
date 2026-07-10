import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser, notAuthed } from "../supabase-for-user";

export default defineTool({
  name: "list_decisions",
  title: "List decisions",
  description:
    "List recent decisions in a Cadence workspace. Use list_workspaces to find the workspace_id.",
  inputSchema: {
    workspace_id: z.string().uuid().describe("Workspace UUID from list_workspaces."),
    limit: z.number().int().min(1).max(100).default(25).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ workspace_id, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("decisions")
      .select("id, title, status, rationale, created_at")
      .eq("workspace_id", workspace_id)
      .order("created_at", { ascending: false })
      .limit(limit ?? 25);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { decisions: data ?? [] },
    };
  },
});
