import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser, notAuthed } from "../supabase-for-user";

export default defineTool({
  name: "list_workspaces",
  title: "List workspaces",
  description: "List the Cadence workspaces the connected user can access.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return notAuthed();
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("workspaces")
      .select("id, name, plan_tier, created_at")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { workspaces: data ?? [] },
    };
  },
});
