import { createFileRoute } from "@tanstack/react-router";
import { buildArdJsonSchema } from "@/lib/ard-schema";

/**
 * CNV-03 · the ARD JSON Schema.
 *
 * GET /api/public/ard/schema
 * Public, unauthenticated. The formal JSON Schema for the ARD (Agent
 * Requirements Document) — the published wire format for Supaprod's Outcome
 * Contract. Any external tool (a coding agent Supaprod dispatches to, or a
 * user's own MCP client) can fetch this to validate or generate ARD
 * documents without depending on Supaprod's internal Zod types.
 */
export const Route = createFileRoute("/api/public/ard/schema")({
  server: {
    handlers: {
      GET: ({ request }) => {
        const origin = new URL(request.url).origin;
        return new Response(JSON.stringify(buildArdJsonSchema(origin), null, 2), {
          status: 200,
          headers: {
            "Content-Type": "application/schema+json",
            "Cache-Control": "public, max-age=300",
            "Access-Control-Allow-Origin": "*",
          },
        });
      },
      OPTIONS: () =>
        new Response(null, {
          status: 204,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }),
    },
  },
});
