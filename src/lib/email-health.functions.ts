/**
 * Is transactional email actually working, and if not, at which layer.
 *
 * WHY THIS EXISTS. On 2026-08-07 the founder joined the waitlist on production
 * and no email arrived. Nothing in the product could tell him why, and the
 * candidate causes sat at four different layers with no way to separate them
 * from the outside:
 *
 *   1. the code was not deployed yet          (it was: verified by other means)
 *   2. the row never landed                    (it did: three rows in the table)
 *   3. RESEND_API_KEY is absent in the WORKER  (unknowable from a browser)
 *   4. Resend accepted the call and the mail bounced or was filtered
 *
 * Layers 1 and 2 are visible from a database query. Layers 3 and 4 were not
 * visible from anywhere, which is the actual defect: we shipped a send path
 * whose failure mode was silence, then debugged it by guessing. This makes the
 * two invisible layers answerable in one click.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO: return the key, any prefix of the key, or
 * its length. `configured` is a boolean and that is the entire disclosure. An
 * admin surface is still a surface, and a key that has been read once into a
 * response is a key that lives in a browser cache, a screenshot and a support
 * thread. The boolean answers the only question worth asking.
 */
import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readEmailConfig, sendEmail } from "@/lib/email.server";

/** Same shape as every other admin gate in this codebase: the caller's OWN
 *  client, so `user_roles` RLS does the deciding and a hit means admin. */
async function requireAdmin(client: SupabaseClient): Promise<boolean> {
  const { data } = await client.from("user_roles").select("role").eq("role", "admin").maybeSingle();
  return Boolean(data);
}

export type EmailHealth = {
  /** Whether RESEND_API_KEY is present in this runtime. NEVER the key itself. */
  configured: boolean;
  /** The From header outbound mail will carry. Not a secret; it is on every send. */
  from: string;
  /** Which env var to set, named here so the fix does not require reading code. */
  envVar: "RESEND_API_KEY";
  checkedAt: string;
};

export const getEmailHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<EmailHealth | { error: string }> => {
    if (!(await requireAdmin(context.supabase as unknown as SupabaseClient))) {
      return { error: "Forbidden" };
    }
    const cfg = readEmailConfig();
    return {
      configured: cfg.enabled,
      from: cfg.from,
      envVar: "RESEND_API_KEY",
      checkedAt: new Date().toISOString(),
    };
  });

export type TestSendResult = { sent: boolean; reason: string; to: string };

/**
 * Send one real email and report EXACTLY what the vendor said.
 *
 * The reason string is passed through untouched, including a raw Resend error
 * body. That is the point: "Resend 403: domain is not verified" and "email
 * delivery not configured" are different problems with different fixes, and
 * flattening both to "could not send" is what left this undiagnosable in the
 * first place. Admin-gated, so the only person who sees a vendor error is the
 * person who needs it.
 *
 * Deliberately a REAL send rather than a validation call. A dry run would prove
 * the key parses, which was never the question; the question is whether a
 * message arrives in an inbox, and only a message arriving answers it.
 */
export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown): { to: string } => {
    const raw = (i as { to?: unknown } | null)?.to;
    return { to: typeof raw === "string" ? raw.trim().slice(0, 320) : "" };
  })
  .handler(async ({ context, data }): Promise<TestSendResult | { error: string }> => {
    if (!(await requireAdmin(context.supabase as unknown as SupabaseClient))) {
      return { error: "Forbidden" };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.to)) {
      return { sent: false, reason: "That does not look like an email address.", to: data.to };
    }
    const stamp = new Date().toISOString();
    const result = await sendEmail({
      to: data.to,
      subject: "Supaprod: transactional email is working",
      // Carries the timestamp so a message found in a spam folder days later can
      // still be tied to the exact test that produced it.
      text: `This is a test send from Supaprod's admin panel at ${stamp}.\n\nIf you are reading this, the API key, the sending domain and the From address are all correct, and anything still missing is a delivery or filtering problem rather than a configuration one.`,
    });
    return { ...result, to: data.to };
  });
