import { createFileRoute } from "@tanstack/react-router";
import { createHash } from "node:crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { checkIngestRateLimit } from "@/lib/ingest-ratelimit.server";
import { writeSignals } from "@/lib/sources/sink.server";

/**
 * F-V5-INGEST-WEBHOOK — public continuous-ingest door.
 *
 * Turns any external POST (Zapier, Slack outgoing webhook, forms, scripts)
 * into signals rows. Auth is a per-workspace ingest token (managed in
 * src/lib/ingest.functions.ts), NOT requireHookCaller: callers send
 * `Authorization: Bearer <token>` (or `x-ingest-token: <token>`), which is
 * looked up in ingest_tokens (revoked_at IS NULL) via the service-role client
 * to resolve user_id + workspace_id.
 *
 * Inserted rows stamp workspace_id explicitly — the column's
 * current_user_default_workspace() default returns NULL without an auth
 * context, and the signals_reactor_fanout trigger matches on workspace_id, so
 * the explicit stamp is what lets webhook signals enter the signal.created
 * auto-pipeline.
 */

const signalSchema = z.object({
  title: z.string().min(1).max(500),
  content: z.string().max(5000).optional(),
  source: z.string().max(40).optional(),
});

// Liberal: either { signals: [...] } (max 50) or a single bare signal object.
// zod objects strip unknown keys, so anything else the caller sends is dropped.
const bodySchema = z.union([
  z.object({ signals: z.array(signalSchema).min(1).max(50) }),
  signalSchema,
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export const Route = createFileRoute("/api/public/ingest-signals")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          // --- Auth: Bearer ingest token (or x-ingest-token header) ---
          const authHeader = request.headers.get("authorization") ?? "";
          const bearer = /^bearer\s+/i.test(authHeader)
            ? authHeader.replace(/^bearer\s+/i, "").trim()
            : "";
          const token = bearer || (request.headers.get("x-ingest-token") ?? "").trim();
          if (!token) return json({ ok: false, error: "missing ingest token" }, 401);

          // ingest_tokens is not yet in the generated Database types — untyped
          // cast, same precedent as outcome.functions.ts.
          const admin = supabaseAdmin as unknown as SupabaseClient;
          const token_hash = createHash("sha256").update(token).digest("hex");
          const { data: tok, error: tokError } = await admin
            .from("ingest_tokens")
            .select("id,user_id,workspace_id")
            .eq("token_hash", token_hash)
            .is("revoked_at", null)
            .maybeSingle();
          if (tokError) throw new Error(tokError.message);
          if (!tok) return json({ ok: false, error: "invalid ingest token" }, 401);

          // --- Rate limit check: per-token cap ---
          const rateLimitCheck = await checkIngestRateLimit(admin, tok.id);
          if (!rateLimitCheck.allowed) {
            return json(
              {
                ok: false,
                error: "Rate limit exceeded",
                retryAfterSeconds: rateLimitCheck.retryAfterSeconds,
              },
              429,
            );
          }

          // --- Body: validate liberally, strip everything else ---
          let raw: unknown;
          try {
            raw = await request.json();
          } catch {
            return json({ ok: false, error: "invalid JSON body" }, 400);
          }
          const parsed = bodySchema.safeParse(raw);
          if (!parsed.success) {
            return json(
              {
                ok: false,
                error: "expected { title, content?, source? } or { signals: [...] } (max 50)",
              },
              400,
            );
          }
          const items = "signals" in parsed.data ? parsed.data.signals : [parsed.data];

          // --- SEC-SIGNAL-INGEST-INJECTION (considerations #3, P0): this is a LIVE, EXTERNAL
          // untrusted-input door - a posted "signal" lands in `signals` and becomes trusted
          // context the agents read. Screen each item BEFORE insert: a structural prompt
          // injection (fence-breakout / forged-system-turn) is REJECTED (never stored); a
          // borderline lexical-only override is stored but tagged for review. Reuses the
          // structural-gate classifier, so an item merely QUOTING an injection is not dropped.
          /*
           * THIS DOOR USED TO WALK PAST THE SINK, AND IT IS THE ONE DOOR THAT
           * SHOULD NOT.
           *
           * It built row literals and called `.insert()` directly. The sink's own
           * header says it is "the one place dedup, injection-screening, and the
           * source_kind discriminator live, so a new source inherits all three" --
           * and this route inherited none of them. Measured 2026-08-22 on the very
           * first signal this endpoint has ever accepted in production:
           * `source_kind` NULL and `embedding` NULL.
           *
           * What that cost, concretely:
           *
           *   - **No restatement dedup.** Shipped the same day precisely because
           *     thirteen restatements of two sentences promoted a theme and burned a
           *     month of credits in eighty minutes. An unauthenticated push endpoint
           *     is the LAST place that protection should be missing: a misconfigured
           *     Zapier retrying a webhook is the same shape as an agent re-filing its
           *     own output, and it is easier to trigger.
           *   - **No `source_kind`.** The `webhook` lane exists in `SOURCE_KINDS` and
           *     is documented as "inbound push via ingest_tokens". It had never once
           *     been stamped, so every fabric read that filters by lane was blind to
           *     this door.
           *   - **No embedding.** Which also disables the vector half of the dedup
           *     above, so the two defects compound rather than sit side by side.
           *   - **No `external_id` dedup**, so a webhook retry stored a second row.
           *
           * The injection screen moves too, rather than being duplicated. The sink
           * runs it for any candidate marked `untrusted`, with the same two outcomes
           * this route implemented by hand: a structural attack is quarantined and
           * never stored, a borderline lexical override is stored and tagged for
           * review. One classifier, one place, so the two cannot drift.
           */
          const result = await writeSignals(
            tok.user_id,
            tok.workspace_id,
            items.map((s) => ({
              source: s.source?.trim() || "webhook",
              sourceKind: "webhook" as const,
              title: s.title,
              // signals.content is NOT NULL and the sink falls back to title.
              content: s.content?.trim() || s.title,
              // An inbound push is attacker-controlled free text by definition.
              untrusted: true,
            })),
          );

          // `restated` is reported separately from `skipped` on purpose: a skip is a
          // producer behaving correctly and re-sending a known external_id, while a
          // restatement is the same observation arriving twice with nothing to tell
          // the two occurrences apart. A caller tuning a webhook needs to know which.
          return json({
            ok: true,
            created: result.inserted,
            quarantined: result.quarantined,
            skipped: result.skipped,
            restated: result.restated,
          });
        } catch (e) {
          console.error("[ingest-signals]", e);
          return json({ ok: false, error: "internal error" }, 500);
        }
      },
    },
  },
});
