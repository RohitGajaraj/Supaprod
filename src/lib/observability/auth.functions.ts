/**
 * AFD-04 at the auth boundary. The plan named this step on day one and nothing
 * ever did it: `docs/planning/analytics-and-failure-detection-plan.md` row
 * AFD-04, "wire PostHog identify at the auth boundary". Until now `identify()`
 * existed in the facade and had zero call sites in the entire product, so a
 * PostHog project, on the day a key lands, would have received events keyed to
 * user ids with no traits attached to any of them.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO: write a first-party signup or login row.
 * The in-house ledger for auth already exists and is maintained for us.
 * `auth.users.created_at` is the signup and `auth.users.last_sign_in_at` is the
 * login, both written by Supabase on every account with no code of ours
 * involved, and `funnel_milestones` already gets a `signup` row from the
 * `trigger_funnel_signup` trigger the moment a first workspace is inserted
 * (migration 20260710160000). Adding a parallel table here would be a second,
 * worse copy of a record we already hold. So this file is the vendor forward
 * and nothing else, which means with no POSTHOG_API_KEY set, as today, it is a
 * complete no-op that costs one server round trip and changes no behaviour.
 *
 * SECURITY. The user id is read from the verified session on the server and is
 * never accepted from the caller, so this cannot be used to forge a signup for
 * somebody else. The event name is validated against a closed list.
 *
 * NO PII LEAVES. Email, name and everything else stays here. The traits sent
 * are the account's own shape (how they signed in, whether they arrived with a
 * plan intent), and the facade scrubs a banned-key list again on the way out.
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { identify, track, type TrackEvent } from "./analytics";

const AUTH_EVENTS = ["signup_completed", "login_succeeded"] as const;
export type AuthEventName = (typeof AUTH_EVENTS)[number];

const AUTH_METHODS = ["password", "google"] as const;
export type AuthMethod = (typeof AUTH_METHODS)[number];

export type AuthEventInput = {
  event: AuthEventName;
  method: AuthMethod;
  /** Where the person came from, when a public surface carried it in. */
  from?: string;
  /** The tier a /pricing CTA carried into signup, when there was one. */
  plan?: string;
};

/**
 * Record one auth-boundary event. Fire and forget from the caller's side: it
 * always resolves `{ ok: true }`, because a analytics failure may never be the
 * reason somebody cannot sign in.
 */
export const recordAuthEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown): AuthEventInput => {
    const o = (i ?? {}) as Record<string, unknown>;
    const event = AUTH_EVENTS.find((e) => e === o.event);
    if (!event) throw new Error("Unknown auth event");
    const method = AUTH_METHODS.find((m) => m === o.method) ?? "password";
    return {
      event,
      method,
      from: typeof o.from === "string" ? o.from.slice(0, 64) : undefined,
      plan: typeof o.plan === "string" ? o.plan.slice(0, 32) : undefined,
    };
  })
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const userId = context.userId;
    try {
      if (data.event === "signup_completed") {
        // Traits first, so the very first event this person produces already
        // has an identity behind it rather than a bare uuid.
        await identify(userId, {
          signup_method: data.method,
          signup_from: data.from,
          signup_plan_intent: data.plan,
        });
      }
      await track(data.event as TrackEvent, userId, {
        method: data.method,
        from: data.from,
        plan_intent: data.plan,
      });
    } catch {
      // The facade already swallows its own failures; this is the belt.
    }
    return { ok: true };
  });
