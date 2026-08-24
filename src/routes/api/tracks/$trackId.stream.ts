import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { getTrack } from "@/lib/spine/track.functions";
import { driveTrackOnce, DRIVE_SELECT, type DriveRow } from "@/lib/spine/driver.server";
import { z } from "zod";

/**
 * M-C: GET /api/tracks/:id/stream
 *
 * SSE endpoint publishing station transitions as a track walks the loop.
 * Reuses the ask-sse.ts contract, emitting events with kind="station" and
 * station=AgentStation.
 *
 * Event shape:
 *   event: station
 *   data: {"kind":"station","station":"sense"|"decide"|"define"|"design"|"build"|"ship"|"learn"}
 *
 * SECURITY: Authenticated via Bearer token, scoped to user's track.
 */

function sseHeaders(origin: string | null = null) {
  const headers: Record<string, string> = {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
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

/**
 * Format SSE event line
 * event: <event_name>
 * data: <json>
 *
 */
function formatSseEvent(eventType: string, data: unknown): string {
  return `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
}

export const Route = createFileRoute("/api/tracks/$trackId/stream")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => {
        const origin = getValidatedCorsOrigin(request);
        const headers: Record<string, string> = {
          "Access-Control-Allow-Methods": "GET, OPTIONS",
          "Access-Control-Allow-Headers": "authorization",
        };
        if (origin) {
          headers["Access-Control-Allow-Origin"] = origin;
        }
        return new Response(null, { status: 204, headers });
      },

      GET: async ({ request, params }) => {
        const corsOrigin = getValidatedCorsOrigin(request);

        const SUPABASE_URL = process.env.SUPABASE_URL;
        const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;
        if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
          return new Response(
            formatSseEvent("error", { error: "Backend not configured" }),
            { status: 500, headers: sseHeaders(corsOrigin) },
          );
        }

        const authHeader = request.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
          return new Response(
            formatSseEvent("error", { error: "Unauthorized" }),
            { status: 401, headers: sseHeaders(corsOrigin) },
          );
        }

        const token = authHeader.slice(7);
        const trackId = params.trackId;

        const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
          global: { headers: { Authorization: `Bearer ${token}` } },
          auth: { persistSession: false, autoRefreshToken: false },
        });

        // Get user session
        const { data: session, error: authError } = await supabase.auth.getSession();
        if (authError || !session?.session?.user) {
          return new Response(
            formatSseEvent("error", { error: "Invalid token" }),
            { status: 401, headers: sseHeaders(corsOrigin) },
          );
        }

        const userId = session.session.user.id;

        try {
          // Validate trackId
          z.string().uuid().parse(trackId);

          // Get track and verify ownership
          const track = await getTrack({
            context: { supabase },
            data: { trackId },
          });

          if (!track) {
            return new Response(
              formatSseEvent("error", { error: "Track not found" }),
              { status: 404, headers: sseHeaders(corsOrigin) },
            );
          }

          // Use ReadableStream to stream SSE events
          const { readable, writable } = new TransformStream();
          const writer = writable.getWriter();

          // Start the drive loop in a non-blocking way
          (async () => {
            try {
              // Fetch the drive row
              const { data: driveRow } = await supabase
                .from("spine_tracks" as never)
                .select(DRIVE_SELECT)
                .eq("id", trackId)
                .eq("user_id", userId)
                .maybeSingle();

              if (!driveRow) {
                await writer.write(
                  new TextEncoder().encode(
                    formatSseEvent("error", { error: "Track not found or not owned by you" }),
                  ),
                );
                await writer.close();
                return;
              }

              const row = driveRow as unknown as DriveRow;
              let currentStation = row.station;

              // Emit initial station
              await writer.write(
                new TextEncoder().encode(
                  formatSseEvent("station", { kind: "station", station: currentStation }),
                ),
              );

              // Drive the track and emit station transitions
              const fullWindowMs = 300000; // 5 minutes for stream window
              const tickStartedAt = Date.now();
              let current = row;

              while (Date.now() - tickStartedAt < fullWindowMs) {
                const outcome = await driveTrackOnce(supabase, current, tickStartedAt);

                // Refresh track state to get new station
                const { data: refreshed } = await supabase
                  .from("spine_tracks" as never)
                  .select(DRIVE_SELECT)
                  .eq("id", trackId)
                  .maybeSingle();

                if (!refreshed) break;
                current = refreshed as unknown as DriveRow;

                // Emit station transition if station changed
                if (current.station !== currentStation) {
                  currentStation = current.station;
                  await writer.write(
                    new TextEncoder().encode(
                      formatSseEvent("station", { kind: "station", station: currentStation }),
                    ),
                  );
                }

                // Check if we should stop
                if (outcome.line && (outcome.line.includes("gate") || outcome.line.includes("paused"))) {
                  // Emit final state with outcome
                  await writer.write(
                    new TextEncoder().encode(
                      formatSseEvent("complete", {
                        reason: outcome.line,
                        station: currentStation,
                      }),
                    ),
                  );
                  break;
                }

                // Check if at end of route
                const pathLength = Array.isArray(current.path) ? current.path.length : 0;
                if (pathLength > 0) {
                  const lastStation = (current.path as string[])[pathLength - 1];
                  if (current.station === lastStation) {
                    await writer.write(
                      new TextEncoder().encode(
                        formatSseEvent("complete", {
                          reason: "route-complete",
                          station: currentStation,
                        }),
                      ),
                    );
                    break;
                  }
                }

                // Small delay between drives to avoid overwhelming
                await new Promise((resolve) => setTimeout(resolve, 100));
              }

              await writer.write(
                new TextEncoder().encode(formatSseEvent("done", {})),
              );
            } catch (error) {
              const msg = error instanceof Error ? error.message : "Unknown error";
              await writer.write(
                new TextEncoder().encode(formatSseEvent("error", { error: msg })),
              );
            } finally {
              await writer.close();
            }
          })();

          return new Response(readable, {
            status: 200,
            headers: sseHeaders(corsOrigin),
          });
        } catch (error) {
          const msg = error instanceof Error ? error.message : "Invalid request";
          return new Response(
            formatSseEvent("error", { error: msg }),
            { status: 400, headers: sseHeaders(corsOrigin) },
          );
        }
      },
    },
  },
});
