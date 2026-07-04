import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "whoami",
  title: "Who am I",
  description: "Return the connected Cadence user's id and email.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: (_input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ userId: ctx.getUserId(), email: ctx.getUserEmail() }),
        },
      ],
      structuredContent: { userId: ctx.getUserId(), email: ctx.getUserEmail() ?? null },
    };
  },
});

// keep zod import used so tree-shaking preserves the schema helper
void z;