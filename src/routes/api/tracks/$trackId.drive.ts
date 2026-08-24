import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getTrack } from "@/lib/spine/track.functions";
import { driveTrackOnce, DRIVE_SELECT, type DriveRow } from "@/lib/spine/driver.server";
import { z } from "zod";

/**
 * M-B: POST /api/tracks/:id/drive
 *
 * Foreground walk endpoint: loop driveTrackOnce until the route is done
 * or a gate blocks, WITHOUT the tick's shared 45s fair-share deadline.
 *
 * The tick exists for background fairness; a watched run must not be rationed.
 * This endpoint bypasses the deadline and drives the track to completion
 * or until a blocking condition is hit.
 *
 * SECURITY: Authenticated via Bearer token, scoped to user's track.
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

export const Route = createFileRoute("/api/tracks/$trackId/drive")({
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

      POST: async ({ request, params }) => {
        const corsOrigin = getValidatedCorsOrigin(request);

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)
          return json({ error: "Backend not configured" }, 500, corsOrigin);

        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer "))
          return json({ error: "Unauthorized" }, 401, corsOrigin);

        const token = authHeader.slice(7);
        const trackId = params.trackId;

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // Get user session
        const { data: session, error: authError } = await supabase.auth.getSession();
        if (authError || !session?.session?.user)
          return json({ error: "Invalid token" }, 401, corsOrigin);

        const userId = session.session.user.id;

        try {
          // Validate trackId
          z.string().uuid().parse(trackId);

          // Get track and verify ownership
          const track = await getTrack({
            context: { supabase },
            data: { trackId },
          });

          if (!track) return json({ error: "Track not found" }, 404, corsOrigin);

          // Fetch the drive row with all needed columns
          const { data: driveRow, error: fetchError } = await supabase
            .from("spine_tracks" as never)
            .select(DRIVE_SELECT)
            .eq("id", trackId)
            .eq("user_id", userId)
            .maybeSingle();

          if (fetchError || !driveRow)
            return json({ error: "Track not found or not owned by you" }, 404, corsOrigin);

          const row = driveRow as unknown as DriveRow;

          // Drive the track once without the tick's deadline
          // Use a generous deadline for the full foreground operation
          const fullWindowMs = 120000; // 2 minutes for foreground walk
          const tickStartedAt = Date.now();
          const outcome = await driveTrackOnce(supabase, row, tickStartedAt);

          // Continue driving until the route is complete or a gate blocks
          let current = row;
          let allOutcomes = [outcome];

          while (
            outcome.line &&
            !outcome.line.includes("gate") &&
            !outcome.line.includes("paused") &&
            Date.now() - tickStartedAt < fullWindowMs
          ) {
            // Refresh track state
            const { data: refreshed } = await supabase
              .from("spine_tracks" as never)
              .select(DRIVE_SELECT)
              .eq("id", trackId)
              .maybeSingle();

            if (!refreshed) break;
            current = refreshed as unknown as DriveRow;

            // Stop if we're at the end of the route
            if (current.station === current.station) {
              // Check if we're at the final station
              const pathLength = Array.isArray(current.path) ? current.path.length : 0;
              if (pathLength > 0) {
                const lastStation = (current.path as string[])[pathLength - 1];
                if (current.station === lastStation) break;
              }
            }

            // Drive again
            const nextOutcome = await driveTrackOnce(supabase, current, tickStartedAt);
            allOutcomes.push(nextOutcome);

            if (!nextOutcome.line || nextOutcome.line.includes("gate") || nextOutcome.line.includes("paused")) {
              break;
            }
          }

          // Get final track state
          const finalTrack = await getTrack({
            context: { supabase },
            data: { trackId },
          });

          return json(
            {
              track: finalTrack,
              driveHistory: allOutcomes,
              completedAt: new Date().toISOString(),
            },
            200,
            corsOrigin,
          );
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Invalid request";
          return json({ error: msg }, 400, corsOrigin);
        }
      },
    },
  },
});
