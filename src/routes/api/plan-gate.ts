import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/integrations/supabase/types";
import { createMission } from "@/lib/ai/handoff.server";
import { runAgentLoop } from "@/lib/ai/loop.server";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { checkUserAiRateLimit } from "@/lib/ai-ratelimit.server";
import { routeIntent } from "@/lib/ask/route-intent";
import {
  asPlanAutonomy,
  describePlanEdits,
  parsePlanProposal,
  type PlanAutonomy,
  type PlanEdits,
} from "@/lib/ask/plan-proposal";
import { dispatchBlockedMessage, type DispatchBlock } from "@/lib/chat-dispatch";

/**
 * ══ THE ANSWER TO THE PLAN GATE, AND THE ONE THING A COMPETITOR CANNOT COPY ══
 *
 * `api/chat.ts` publishes a plan and stops. This is where the answer lands.
 *
 * ── WHY THIS IS A ROUTE OF ITS OWN AND NOT A FRAME ON THAT STREAM ────────
 *
 * A gate makes the request outlive its own stream. The person reads the plan,
 * thinks, maybe edits it, and answers — seconds or minutes later, by which time
 * the isolate that streamed the proposal is long gone and its controller closed.
 * There is nothing to reply to. `mission_steps` approvals have always worked
 * this way for the same reason, and `ask-sse.ts` makes the general argument at
 * length: a transport that outlives the request is a SECOND transport with its
 * own route and its own lifetime, not a line missing from the first one.
 *
 * ── WHAT IS RECORDED HERE, AND WHY IT IS THE POINT OF THE WHOLE FEATURE ──
 *
 * Deciding how much autonomy a piece of work earns, BEFORE the outcome is
 * known, is a recorded belief about that work. `CLAUDE.md` names that as the one
 * thing a competitor cannot reconstruct: causes survive in Slack and call
 * recordings and have been rebuilt twice on the record, but what a team BELIEVED
 * would happen leaves no trace unless something captured it at the moment of the
 * call. This is that moment, and the capture is a by-product of a gate that has
 * to exist anyway rather than a form somebody fills in once.
 *
 * IT IS NEVER PRESENTED AS ONE. No score, no confidence, no scoreboard. What a
 * person reads is three plain answers about how much rope to give, and what
 * lands in the table is which one they picked.
 *
 * ── WHERE IT LANDS: `human_gate_events`, WHICH ALREADY EXISTS FOR THIS ────
 *
 * RPT-32 built that table to "log the human at every gate", append-only, owner
 * RLS, indexed by workspace and by agent, and already read by `getGateSignals`
 * and `rework.functions.ts`. The autonomy answer is exactly a human decision at
 * a gate, so it goes there rather than into a column invented for it:
 *
 *   gate_type     'approval' for the two answers that start the work,
 *                 'rejection' for "Keep planning", which starts nothing.
 *   verdict       the autonomy id itself: run-it | check-writes | keep-planning.
 *                 THIS IS THE BELIEF. The three-way distinction lives here and
 *                 nowhere else, because `gate_type` cannot hold it (see below).
 *   subject_type  'plan'.
 *   subject_ref   the proposal id, which is also the idempotency key.
 *   agent_slug    the lead seat at the entry station, so per-agent rollups that
 *                 already exist can read these rows without a new join.
 *   diff_summary  what the person CHANGED before answering (steps skipped,
 *                 stations waived) or, on a send-back, their own words verbatim.
 *
 * ── THE TWO THINGS THIS TABLE WOULD WANT AND DOES NOT HAVE ───────────────
 *
 * Written down rather than worked around, because both are schema questions and
 * inventing a column to dodge them is how a record stops being trustworthy:
 *
 *   1. `gate_type` CARRIES A CHECK CONSTRAINT OF FOUR VALUES
 *      ('approval','rejection','edit','override'), so there is no 'plan-gate'
 *      to file under and no way to select this gate's rows without also
 *      filtering `subject_type = 'plan'`. Both queries below do exactly that,
 *      and it works, but a fifth `gate_type` is what this actually wants.
 *
 *   2. NOTHING LINKS A GATE EVENT TO THE RUN IT AUTHORISED. There is one ref
 *      column and the proposal id is already in it, so the mission this answer
 *      started is not reachable from the row that authorised it. A `mission_id`
 *      (or a second nullable ref) is the column that closes it. Until then the
 *      join is by hand, through the conversation.
 *
 * ── AND THE ONE THING THAT IS RECORDED BUT NOT YET ENFORCED ──────────────
 *
 * `check-writes` promises the run stops before anything leaves the workspace.
 * Today that promise is kept by the approval policy that already exists —
 * `agent_autonomy.arc` per agent, `agent_tool_modes` per tool, resolved by
 * `resolveApprovalMode` — and NOT by this answer, because autonomy in this
 * schema is a fact about an AGENT and this is a fact about one piece of WORK.
 * There is no per-run autonomy column to bind it to. So the honest statement of
 * what ships here is: the belief is captured at the moment of the call, and
 * binding it to the run needs a per-run override the schema does not have. That
 * is named here rather than papered over with a column of my own invention.
 */

type MaybeWaitUntil = { waitUntil?: (promise: Promise<unknown>) => void };

/**
 * Keep the dispatch alive after this response has already been returned.
 *
 * THE SAME HAZARD AND THE SAME FIX AS `api/chat.ts`, whose copy carries the full
 * argument: a promise still pending when the response returns CAN BE CANCELLED
 * on Cloudflare, and the run then exists as a row with nothing driving it, until
 * the resume sweeper picks it up two minutes later. `request.waitUntil` is the
 * Workers `ctx.waitUntil`, already bound by `src/server.ts`, and it is probed
 * rather than assumed so the dev server, node and `bun test` take the fallback.
 *
 * DUPLICATED, NOT SHARED, and that is a deliberate choice with a cost. The
 * original lives inside a route module, which cannot be imported from another
 * route module without dragging its whole handler graph along. Sharing it needs
 * a server module neither file owns, and this lane was scoped to one new route.
 * It is fifteen lines with no state and both copies are exercised.
 */
function keepAliveAfterResponse(request: Request, work: Promise<unknown>, label: string): void {
  const guarded = work.catch((err) => {
    console.error(`[plan-gate] ${label} async dispatch failed:`, err);
  });
  const waitUntil = (request as unknown as MaybeWaitUntil).waitUntil;
  if (typeof waitUntil === "function") {
    try {
      waitUntil.call(request, guarded);
      return;
    } catch {
      // A runtime that exposes the name but refuses the call must not lose the
      // dispatch entirely.
    }
  }
  void guarded;
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
  if (process.env.VITE_PUBLIC_ORIGIN) allowedOrigins.push(process.env.VITE_PUBLIC_ORIGIN);
  try {
    new URL(origin);
    if (allowedOrigins.includes(origin)) return origin;
  } catch {
    // Invalid origin format; deny cross-origin access.
  }
  return null;
}

function json(body: unknown, status = 200, origin: string | null = null) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (origin) headers["Access-Control-Allow-Origin"] = origin;
  return new Response(JSON.stringify(body), { status, headers });
}

/** Logs the cause, returns an id. Never sends a database message to a reader. */
function sanitizeError(error: unknown, context: string): { message: string; errorId: string } {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const errorMsg = error instanceof Error ? error.message : String(error);
  console.error(`[${errorId}] ${context}: ${errorMsg}`, error);
  return {
    message: "An error occurred processing your request. Contact support if it persists.",
    errorId,
  };
}

/** The two answers that start work, and the one that does not. */
function startsWork(autonomy: PlanAutonomy): boolean {
  return autonomy !== "keep-planning";
}

/**
 * WHAT THE TRANSCRIPT SAYS AFTER AN ANSWER.
 *
 * ONE SENTENCE PER ANSWER, WRITTEN ONCE, NEVER PARAPHRASED — the rule
 * `dispatchBlockedMessage` established in this same lane after a Postgres error
 * was handed to a model to explain. Each says what happened, in the past tense,
 * and nothing about what is going to happen next.
 *
 * The two starting answers say DIFFERENT things because they mean different
 * things, and a transcript that recorded them identically would lose the only
 * part of this exchange worth keeping.
 */
function answeredMessage(autonomy: PlanAutonomy, title: string, reason: string): string {
  if (autonomy === "run-it") {
    return `**${title}** is running. It goes to the end inside the boundaries already set, and reports when it is done.`;
  }
  if (autonomy === "check-writes") {
    return `**${title}** is running, and it will stop and ask before anything leaves this workspace.`;
  }
  return reason
    ? `Nothing started, and nothing was charged. This went back to the crew: "${reason}"`
    : `Nothing started, and nothing was charged. This went back to the crew for a new plan.`;
}

/** The request body, before anything in it is believed. */
type PlanGateBody = {
  conversationId?: unknown;
  proposal?: unknown;
  autonomy?: unknown;
  reason?: unknown;
  edits?: unknown;
};

function parseEdits(value: unknown): PlanEdits {
  if (!value || typeof value !== "object") return {};
  const raw = value as { skipped?: unknown; waived?: unknown };
  const skipped = Array.isArray(raw.skipped)
    ? raw.skipped
        .filter((s): s is { id: string; why?: string | null } => {
          return !!s && typeof s === "object" && typeof (s as { id?: unknown }).id === "string";
        })
        .slice(0, 20)
        .map((s) => ({ id: s.id.slice(0, 80), why: typeof s.why === "string" ? s.why : null }))
    : [];
  const waived = Array.isArray(raw.waived)
    ? raw.waived
        .filter((w): w is { station: string; reason?: string | null } => {
          return (
            !!w && typeof w === "object" && typeof (w as { station?: unknown }).station === "string"
          );
        })
        .slice(0, 20)
        .map((w) => ({
          station: w.station.slice(0, 40),
          reason: typeof w.reason === "string" ? w.reason : null,
        }))
    : [];
  return { skipped, waived };
}

export const Route = createFileRoute("/api/plan-gate")({
  server: {
    handlers: {
      OPTIONS: ({ request }) => {
        const origin = getValidatedCorsOrigin(request);
        const headers: Record<string, string> = {
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "content-type, authorization",
        };
        if (origin) headers["Access-Control-Allow-Origin"] = origin;
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
        const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
        if (claimsErr || !claimsData?.claims?.sub)
          return json({ error: "Unauthorized" }, 401, corsOrigin);
        const userId = claimsData.claims.sub as string;

        // The same per-user burst limiter the Ask surface uses. An answer here
        // starts a run, so it is at least as expensive as the turn that proposed
        // it and gets the same protection.
        const rate = await checkUserAiRateLimit(
          supabaseAdmin as unknown as Parameters<typeof checkUserAiRateLimit>[0],
          userId,
        );
        if (!rate.allowed) {
          return json(
            {
              error: "You are sending requests too quickly. Give it a short breather.",
              retryAfterSeconds: rate.retryAfterSeconds,
            },
            429,
            corsOrigin,
          );
        }

        let body: PlanGateBody;
        try {
          body = (await request.json()) as PlanGateBody;
        } catch {
          return json({ error: "Invalid JSON" }, 400, corsOrigin);
        }

        const conversationId = typeof body.conversationId === "string" ? body.conversationId : "";
        const proposal = parsePlanProposal(body.proposal);
        const autonomy = asPlanAutonomy(body.autonomy);
        if (!conversationId || !proposal || !autonomy)
          return json({ error: "Invalid input" }, 400, corsOrigin);

        const reason = typeof body.reason === "string" ? body.reason.trim().slice(0, 2000) : "";
        const edits = parseEdits(body.edits);

        // RLS scopes this to the person's own threads, so a proposal answered
        // against somebody else's conversation cannot resolve.
        const { data: conv, error: convErr } = await supabase
          .from("conversations")
          .select("id,title")
          .eq("id", conversationId)
          .maybeSingle();
        if (convErr || !conv) return json({ error: "Conversation not found" }, 404, corsOrigin);

        /**
         * ANSWERED ONCE, AND ONLY ONCE.
         *
         * This repo has already paid for the other outcome: the 2026-08-14
         * migration exists because a gate could be answered twice and a customer's
         * pull request merged twice. Here the second answer would be a second
         * mission for one piece of work, so the proposal id is checked before
         * anything is written and a repeat is refused rather than obeyed.
         *
         * IT IS A CHECK, NOT A CLAIM, and the difference is worth stating. A row
         * lock would be a claim; this is a read followed by a write, so two
         * genuinely simultaneous clicks can still both pass. That is the same
         * exposure the dispatch path in `api/chat.ts` has today, it needs a
         * unique index on (subject_type, subject_ref) to close properly, and it
         * is named in the header as one of the two things this table wants.
         */
        const { data: already } = await supabase
          .from("human_gate_events")
          .select("id,verdict")
          .eq("subject_type", "plan")
          .eq("subject_ref", proposal.id)
          .maybeSingle();
        if (already) {
          return json(
            {
              error: "This plan has already been answered.",
              autonomy: (already as { verdict: string | null }).verdict,
            },
            409,
            corsOrigin,
          );
        }

        /**
         * THE ROUTE IS RECOMPUTED, NEVER RECEIVED.
         *
         * `routeIntent` is pure — no model call, no network, no clock — so the
         * same shape, station and origin that were on the proposal frame produce
         * the same entry station, the same path, the same waivers and the same
         * crew they produced when the plan was drawn. That is the whole reason
         * the frame carries the INPUTS rather than a rendered plan: there is no
         * second copy of the plan to drift from the first, and nothing about the
         * route has to be taken on trust from a client.
         *
         * What DOES come from the client is the answer and the edits, and both
         * are things only the person could have supplied.
         */
        const routed = routeIntent({
          shape: proposal.shape,
          origin: proposal.origin,
          station: proposal.station,
        });
        const leadSeat = routed.crew[0]?.slug ?? null;

        let missionId: string | null = null;
        let blocked: DispatchBlock | null = null;

        /**
         * READ FOR ALL THREE ANSWERS, not only the two that dispatch.
         *
         * `human_gate_events` is indexed on (workspace_id, created_at) and every
         * existing reader of it scopes by workspace, so a row written without one
         * is a row the rollups silently skip. A send-back is a judgement about
         * this workspace's work exactly as much as a start is, and it is the
         * answer most worth being able to count.
         */
        const { data: ws } = await supabase.rpc("current_user_default_workspace");
        const workspaceId = (ws as string | null) ?? null;

        if (startsWork(autonomy)) {
          if (!workspaceId) {
            blocked = "no-workspace";
          } else {
            // The conductor was already seeded and checked by the pre-flight in
            // `api/chat.ts` — a proposal is only ever emitted after it passed —
            // so this is a read rather than a second seeding. It can still come
            // back empty if the roster changed in between, and that is a real
            // state with a sentence of its own rather than a 500.
            const { data: agent } = await supabase
              .from("agents")
              .select("id")
              .eq("user_id", userId)
              .eq("slug", "orchestrator")
              .maybeSingle();
            if (!agent) {
              blocked = "conductor-unavailable";
            } else {
              try {
                const mission = await createMission(supabase, userId, workspaceId, {
                  title: proposal.title.slice(0, 200),
                  goal: proposal.goal,
                  starting_agent_id: (agent as { id: string }).id,
                });
                missionId = mission.id;
                // Dispatched to the conductor, exactly as an ungated handover
                // is. The person answered how much rope the work gets; they did
                // not choose who takes it, and the orchestrator still plans its
                // own DAG. See the routing paragraph in `api/chat.ts`.
                keepAliveAfterResponse(
                  request,
                  runAgentLoop(supabase, userId, {
                    agentSlug: "orchestrator",
                    goal: proposal.goal,
                    missionId: mission.id,
                    workspaceId,
                  }),
                  "runAgentLoop",
                );
              } catch (e) {
                console.error("[plan-gate] failed to start mission:", e);
                blocked = "dispatch-failed";
              }
            }
          }
        }

        /**
         * THE BELIEF IS WRITTEN AFTER THE OUTCOME OF THE DISPATCH IS KNOWN, and
         * only when the answer actually took effect.
         *
         * A blocked start is NOT recorded as a belief. The person answered "let
         * it run" and nothing ran, so filing that row would put a forecast on the
         * record against work that never existed, and every later reader of this
         * table would count it. The refusal is reported to them instead, with the
         * one sentence this product already has for that state.
         */
        if (!blocked) {
          const diff =
            autonomy === "keep-planning" ? reason.slice(0, 1000) : describePlanEdits(edits);
          const { error: gateErr } = await supabase.from("human_gate_events").insert({
            user_id: userId,
            workspace_id: workspaceId,
            gate_type: startsWork(autonomy) ? "approval" : "rejection",
            subject_type: "plan",
            subject_ref: proposal.id,
            agent_slug: leadSeat,
            verdict: autonomy,
            diff_summary: diff || null,
          });
          if (gateErr) {
            /*
             * THE RUN IS ALREADY GOING BY THIS POINT, so this cannot fail the
             * request: telling a person their work did not start, while it is
             * running, is a worse lie than an unrecorded belief. It is logged
             * loudly because a gate answer that reached nothing is exactly the
             * silent gap this whole feature exists to close.
             */
            sanitizeError(gateErr, "Failed to record the plan gate answer");
          }
        }

        const said = blocked
          ? dispatchBlockedMessage(blocked)
          : answeredMessage(autonomy, proposal.title, reason);

        const msgInsert = supabase.from("messages") as unknown as {
          insert: (p: Record<string, unknown>) => Promise<{ error: unknown }>;
        };
        await msgInsert.insert({
          conversation_id: conversationId,
          user_id: userId,
          role: "assistant",
          content: said,
          ...(missionId ? { mission_id: missionId } : {}),
        });

        return json(
          {
            missionId,
            autonomy,
            station: routed.station,
            message: said,
            ...(blocked ? { blocked } : {}),
          },
          blocked ? 409 : 200,
          corsOrigin,
        );
      },
    },
  },
});
