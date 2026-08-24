import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { startTrackCore, getTrack } from "@/lib/spine/track.functions";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * M-A: POST /api/tracks
 *
 * Create a track from one sentence of intent. Zero configuration:
 * - Default workspace from auth context
 * - Default product to null
 * - Return the created track and any problems encountered
 *
 * SECURITY: Authenticated via Bearer token, scoped to user's workspace.
 */

function json(body: unknown, status = 200, origin: string | null = null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return new Response(JSON.stringify(body), { status, headers });
}

function getValidatedCorsOrigin(request: Request): string | null {
  const origin = request.headers.get("origin");
  if (!origin) return null;

  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
  ];

  if (process.env.VITE_PUBLIC_ORIGIN) {
    allowedOrigins.push(process.env.VITE_PUBLIC_ORIGIN);
  }

  try {
    new URL(origin);
    if (allowedOrigins.includes(origin)) {
      return origin;
    }
  } catch {
    // Invalid origin format
  }

  return null;
}

export const Route = createFileRoute("/api/tracks")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => {
        const origin = getValidatedCorsOrigin(request);
        const headers: Record<string, string> = {
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "content-type, authorization",
        };
        if (origin) {
          headers["Access-Control-Allow-Origin"] = origin;
        }
        return new Response(null, { status: 204, headers });
      },

      POST: async ({ request }) => {
        const corsOrigin = getValidatedCorsOrigin(request);

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)
          return json({ error: "Backend not configured" }, 500, corsOrigin);

        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer "))
          return json({ error: "Unauthorized" }, 401, corsOrigin);

        const token = authHeader.slice(7);
        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // Get user session from token
        const { data: session, error: authError } = await supabase.auth.getSession();
        if (authError || !session?.session?.user)
          return json({ error: "Invalid token" }, 401, corsOrigin);

        const userId = session.session.user.id;

        // Get workspace_id from user profile
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("workspace_id")
          .eq("id", userId)
          .maybeSingle();

        if (profileError || !profile?.workspace_id)
          return json({ error: "Workspace not found" }, 400, corsOrigin);

        try {
          const body = await request.json();
          const { intent } = z.object({ intent: z.string().min(1).max(500) }).parse(body);

          // Create track with default workspace and null product
          const result = await startTrackCore(supabase, userId, {
            title: intent.trim(),
            shape: "new-capability", // Default shape
            origin: intent,
            workspaceId: profile.workspace_id,
            productId: null,
          });

          if (!result.track)
            return json({ track: null, problems: result.problems }, 400, corsOrigin);

          return json({ track: result.track, problems: [] }, 201, corsOrigin);
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Invalid request";
          return json({ error: msg }, 400, corsOrigin);
        }
      },
    },
  },
});
