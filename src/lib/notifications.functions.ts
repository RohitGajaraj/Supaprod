import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email.server";
import { loadNewestDecisionBrief } from "@/lib/stakeholder-pack.functions";
import {
  composeStakeholderPack,
  renderPackMarkdown,
  type PackAudience,
} from "@/lib/stakeholder-pack";
import { postStakeholderDigestToSlack } from "@/lib/connectors/slack-digest.server";

// R3 · Notifications, one "what needs you" feed derived live from the loop's
// own state: tool calls waiting on a human, spend nearing or over a cap, a
// stalled loop, and output drift that tripped a threshold. Read-only, RLS-scoped
// (every table keyed on user_id); each probe degrades to a safe default (a null
// or errored query yields no items) so the feed can never break the surface it
// sits on. No new table: it reads agent_approvals, agent_runs, ai_budgets, and
// drift_incidents directly.
// Engine-Room: names the outcome ("what needs you"), not the mechanism.

const STALL_MINUTES = 30;

export type NotificationSeverity = "action" | "warning" | "info";

export type AppNotification = {
  id: string;
  kind: "approval" | "health" | "budget" | "drift";
  severity: NotificationSeverity;
  title: string;
  detail: string;
  href: string;
  created_at: string | null;
};

// P5-ALERT: human-readable labels for the drift detector's metric keys.
const DRIFT_METRIC_LABELS: Record<string, string> = {
  avg_latency_ms: "latency",
  p95_latency_ms: "p95 latency",
  avg_total_tokens: "token use",
  avg_cost_usd: "cost",
  error_rate: "error rate",
  avg_eval_score: "quality score",
};
function driftMetricLabel(metric: string | null): string {
  return (metric && DRIFT_METRIC_LABELS[metric]) || "a metric";
}

const SEVERITY_RANK: Record<NotificationSeverity, number> = { action: 0, warning: 1, info: 2 };

export const getNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ notifications: AppNotification[]; count: number }> => {
    const { supabase, userId } = context;
    const cutoff = new Date(Date.now() - STALL_MINUTES * 60 * 1000).toISOString();
    const out: AppNotification[] = [];

    // Query user preferences to filter in-app notifications
    const { data: prefs } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    const inAppEnabled = {
      approval: prefs?.in_app_approvals ?? true,
      health: prefs?.in_app_health ?? true,
      budget: prefs?.in_app_budget ?? true,
      drift: prefs?.in_app_drift ?? true,
    };

    // 1. Tool calls waiting on a human decision.
    if (inAppEnabled.approval) {
      const { data: approvals } = await supabase
        .from("agent_approvals")
        .select("id,agent_slug,tool_name,rationale,created_at")
        .eq("user_id", userId)
        .eq("status", "pending")
        .order("created_at", { ascending: false })
        .limit(10);
      for (const a of approvals ?? []) {
        const tool = (a.tool_name as string | null) ?? "a tool call";
        const who = (a.agent_slug as string | null) ?? "An agent";
        out.push({
          id: `approval:${a.id}`,
          kind: "approval",
          severity: "action",
          title: `Approval needed: ${tool}`,
          detail: (a.rationale as string | null) ?? `${who} is waiting on your decision.`,
          href: "/govern?tab=approvals",
          created_at: (a.created_at as string | null) ?? null,
        });
      }
    }

    // 2. A stalled loop: runs in flight past the stall window.
    if (inAppEnabled.health) {
      const { count: stalledCount } = await supabase
        .from("agent_runs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("status", ["running", "queued"])
        .lt("created_at", cutoff);
      const stalled = stalledCount ?? 0;
      if (stalled > 0) {
        out.push({
          id: "health:stalled",
          kind: "health",
          severity: "warning",
          title: `${stalled} run${stalled === 1 ? "" : "s"} stalled`,
          detail: `In flight past the ${STALL_MINUTES}-minute window. The loop may need a nudge.`,
          href: "/govern?tab=gauntlet",
          created_at: null,
        });
      }
    }

    // 3. Spend nearing or over a cap.
    if (inAppEnabled.budget) {
      const { data: budget } = await supabase
        .from("ai_budgets")
        .select("daily_usd_cap,monthly_usd_cap,daily_usd_used,monthly_usd_used,alert_at_pct")
        .eq("user_id", userId)
        .maybeSingle();
      if (budget) {
        const pct = typeof budget.alert_at_pct === "number" ? budget.alert_at_pct : 80;
        const pushBudget = (used: unknown, cap: unknown, label: string) => {
          const u = typeof used === "number" ? used : 0;
          const c = typeof cap === "number" ? cap : 0;
          if (c <= 0) return;
          if (u >= c) {
            out.push({
              id: `budget:${label}-over`,
              kind: "budget",
              severity: "warning",
              title: `${label} spend cap reached`,
              detail: `$${u.toFixed(2)} of $${c.toFixed(2)}. Over-cap AI calls are blocked.`,
              href: "/govern?tab=budgets",
              created_at: null,
            });
          } else if (u >= (c * pct) / 100) {
            out.push({
              id: `budget:${label}-near`,
              kind: "budget",
              severity: "info",
              title: `Approaching ${label.toLowerCase()} spend cap`,
              detail: `$${u.toFixed(2)} of $${c.toFixed(2)} (alert at ${pct}%).`,
              href: "/govern?tab=budgets",
              created_at: null,
            });
          }
        };
        pushBudget(budget.daily_usd_used, budget.daily_usd_cap, "Daily");
        pushBudget(budget.monthly_usd_used, budget.monthly_usd_cap, "Monthly");
      }
    }

    // 4. Output drift that tripped a threshold (P5-ALERT).
    if (inAppEnabled.drift) {
      const { data: driftIncidents } = await supabase
        .from("drift_incidents")
        .select("id,surface,model,metric,delta_pct,severity,detected_at")
        .eq("user_id", userId)
        .eq("status", "open")
        .order("detected_at", { ascending: false })
        .limit(6);
      for (const d of driftIncidents ?? []) {
        const metric = driftMetricLabel(d.metric as string | null);
        const deltaNum = typeof d.delta_pct === "number" ? d.delta_pct : Number(d.delta_pct);
        const delta = Number.isFinite(deltaNum) ? deltaNum : 0;
        const sign = delta >= 0 ? "+" : "";
        const surface = (d.surface as string | null) ?? "a surface";
        const model = (d.model as string | null) ?? "model";
        out.push({
          id: `drift:${d.id}`,
          kind: "drift",
          severity: d.severity === "critical" ? "warning" : "info",
          title: `Drift detected: ${metric}`,
          detail: `${sign}${delta.toFixed(0)}% vs baseline on ${surface} · ${model}.`,
          href: "/drift",
          created_at: (d.detected_at as string | null) ?? null,
        });
      }
    }

    out.sort((x, y) => {
      const s = SEVERITY_RANK[x.severity] - SEVERITY_RANK[y.severity];
      if (s !== 0) return s;
      return (y.created_at ?? "").localeCompare(x.created_at ?? "");
    });

    return { notifications: out, count: out.length };
  });

// --- R3-PREFS: Preference Server Functions ---

export type UserNotificationPreferences = {
  user_id: string;
  email_approvals: boolean;
  email_health: boolean;
  email_budget: boolean;
  email_drift: boolean;
  in_app_approvals: boolean;
  in_app_health: boolean;
  in_app_budget: boolean;
  in_app_drift: boolean;
  digest_approvals: boolean;
  digest_health: boolean;
  digest_budget: boolean;
  digest_drift: boolean;
  digest_frequency: "daily" | "weekly";
  digest_stakeholder_update: boolean;
  digest_stakeholder_audience: PackAudience;
  updated_at: string;
};

export const getNotificationPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<{ preferences: UserNotificationPreferences }> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw new Error(error.message);

    const defaultPrefs: UserNotificationPreferences = {
      user_id: userId,
      email_approvals: true,
      email_health: true,
      email_budget: true,
      email_drift: true,
      in_app_approvals: true,
      in_app_health: true,
      in_app_budget: true,
      in_app_drift: true,
      digest_approvals: true,
      digest_health: true,
      digest_budget: true,
      digest_drift: true,
      digest_frequency: "daily",
      digest_stakeholder_update: false,
      digest_stakeholder_audience: "exec",
      updated_at: new Date().toISOString(),
    };

    if (!data) {
      return { preferences: defaultPrefs };
    }

    return { preferences: data as UserNotificationPreferences };
  });

const PreferencesUpdateSchema = z.object({
  email_approvals: z.boolean().optional(),
  email_health: z.boolean().optional(),
  email_budget: z.boolean().optional(),
  email_drift: z.boolean().optional(),
  in_app_approvals: z.boolean().optional(),
  in_app_health: z.boolean().optional(),
  in_app_budget: z.boolean().optional(),
  in_app_drift: z.boolean().optional(),
  digest_approvals: z.boolean().optional(),
  digest_health: z.boolean().optional(),
  digest_budget: z.boolean().optional(),
  digest_drift: z.boolean().optional(),
  digest_frequency: z.enum(["daily", "weekly"]).optional(),
  digest_stakeholder_update: z.boolean().optional(),
  digest_stakeholder_audience: z.enum(["exec", "eng", "board"]).optional(),
});

export const updateNotificationPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => PreferencesUpdateSchema.parse(input))
  .handler(async ({ context, data }): Promise<{ preferences: UserNotificationPreferences }> => {
    const { supabase, userId } = context;
    const patch = {
      ...data,
      user_id: userId,
      updated_at: new Date().toISOString(),
    };

    const { data: row, error } = await supabase
      .from("user_notification_preferences")
      .upsert(patch)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return { preferences: row as UserNotificationPreferences };
  });

// --- FS-03: the reach channel (real email, behind the Resend facade) ---
// Engine-Room: dispatch/preference machinery -> Settings > Notifications ->
// "Cadence reaches you when it matters." Instant sends are reserved for
// expiring gates (approvals-tick) and critical incidents (drift.server.ts);
// everything else waits for the user's own scheduled digest.

/** Pure: the local hour-of-day (0-23) for a UTC instant in a given IANA timezone.
 *  Falls back to UTC on an invalid timezone string rather than throwing. */
export function localHourInTimezone(nowUtc: Date, timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).formatToParts(nowUtc);
    const h = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
    return Number.isFinite(h) ? h % 24 : nowUtc.getUTCHours();
  } catch {
    return nowUtc.getUTCHours();
  }
}

/** Pure: whether `localHour` falls outside the user's working hours. Handles a
 *  window that wraps past midnight (start > end). A degenerate start===end
 *  config (never set) is treated as never-quiet, not always-quiet. */
export function isQuietHours(
  localHour: number,
  workingHoursStart: number,
  workingHoursEnd: number,
): boolean {
  if (workingHoursStart === workingHoursEnd) return false;
  if (workingHoursStart < workingHoursEnd) {
    return localHour < workingHoursStart || localHour >= workingHoursEnd;
  }
  return localHour >= workingHoursEnd && localHour < workingHoursStart;
}

/** Best-effort recipient email lookup. Requires an admin (service-role) client;
 *  returns null rather than throwing when the client lacks admin auth or the
 *  user cannot be resolved, so a lookup failure degrades to a silent no-send. */
async function resolveUserEmail(supabase: SupabaseClient, userId: string): Promise<string | null> {
  try {
    const admin = (
      supabase as unknown as {
        auth: {
          admin?: {
            getUserById: (id: string) => Promise<{
              data: { user: { email?: string | null } | null } | null;
              error: unknown;
            }>;
          };
        };
      }
    ).auth.admin;
    if (!admin) return null;
    const { data } = await admin.getUserById(userId);
    return data?.user?.email ?? null;
  } catch {
    return null;
  }
}

/** Dispatch a single instant email. Reserved for expiring gates and critical
 *  incidents (the caller decides urgency; this only enforces the user's own
 *  per-category preference and actually delivers via the Resend facade). */
export async function dispatchInstantEmail(
  supabase: SupabaseClient,
  userId: string,
  notification: Pick<AppNotification, "kind" | "severity" | "title" | "detail">,
): Promise<{ sent: boolean; reason: string }> {
  const { data: prefs } = await supabase
    .from("user_notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const isEmailEnabled = (kind: AppNotification["kind"]): boolean => {
    if (!prefs) return true; // Default to enabled
    switch (kind) {
      case "approval":
        return prefs.email_approvals;
      case "health":
        return prefs.email_health;
      case "budget":
        return prefs.email_budget;
      case "drift":
        return prefs.email_drift;
      default:
        return true;
    }
  };

  if (!isEmailEnabled(notification.kind)) {
    return {
      sent: false,
      reason: `Email disabled by user preferences for category: ${notification.kind}`,
    };
  }

  const to = await resolveUserEmail(supabase, userId);
  if (!to) return { sent: false, reason: "could not resolve recipient email" };

  const { sent, reason } = await sendEmail({
    to,
    subject: `Cadence: ${notification.title}`,
    text: notification.detail,
  });
  return { sent, reason };
}

/**
 * Aggregate and compile a periodic email digest, then deliver it via the
 * Resend facade if there is anything to report. Stamps `last_digest_sent_at`
 * whenever the due-check completes (whether or not there were items to
 * report), so an hourly digest-tick does not re-run these queries for a
 * quiet workspace until the next window.
 */
export async function generateDigest(
  supabase: SupabaseClient,
  userId: string,
  frequency: "daily" | "weekly",
): Promise<{ generated: boolean; reason: string; subject?: string; content?: string }> {
  const { data: prefs } = await supabase
    .from("user_notification_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  const actualFrequency = prefs?.digest_frequency ?? "daily";
  if (actualFrequency !== frequency) {
    return {
      generated: false,
      reason: `User digest frequency is set to ${actualFrequency}, not ${frequency}`,
    };
  }

  const enabled = {
    approval: prefs?.digest_approvals ?? true,
    health: prefs?.digest_health ?? true,
    budget: prefs?.digest_budget ?? true,
    drift: prefs?.digest_drift ?? true,
  };

  const digestItems: string[] = [];

  // approvals query
  if (enabled.approval) {
    const { data: approvals } = await supabase
      .from("agent_approvals")
      .select("tool_name,agent_slug")
      .eq("user_id", userId)
      .eq("status", "pending");
    if (approvals && approvals.length > 0) {
      digestItems.push(`- Approvals: ${approvals.length} pending tool execution approval(s).`);
    }
  }

  // stalled runs query
  if (enabled.health) {
    const cutoff = new Date(Date.now() - STALL_MINUTES * 60 * 1000).toISOString();
    const { count: stalled } = await supabase
      .from("agent_runs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .in("status", ["running", "queued"])
      .lt("created_at", cutoff);
    if (stalled && stalled > 0) {
      digestItems.push(`- Health: ${stalled} agent run(s) are stalled or inactive.`);
    }
  }

  // budgets
  if (enabled.budget) {
    const { data: budget } = await supabase
      .from("ai_budgets")
      .select("daily_usd_cap,monthly_usd_cap,daily_usd_used,monthly_usd_used")
      .eq("user_id", userId)
      .maybeSingle();
    if (budget) {
      const dUsed = budget.daily_usd_used ?? 0;
      const dCap = budget.daily_usd_cap ?? 0;
      if (dCap > 0 && dUsed >= dCap * 0.8) {
        digestItems.push(
          `- Budget: Daily spend is at $${dUsed.toFixed(2)} of $${dCap.toFixed(2)}.`,
        );
      }
    }
  }

  // drift
  if (enabled.drift) {
    const { data: drift } = await supabase
      .from("drift_incidents")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "open");
    if (drift && drift.length > 0) {
      digestItems.push(`- Drift: ${drift.length} active output drift incident(s) remain open.`);
    }
  }

  // JNY-05: the ambient stakeholder loop. When enabled, the digest also carries the
  // workspace's newest decision as an audience-tuned pack, so "keeping stakeholders
  // in the loop" rides this same cron instead of a separate surface. Best-effort:
  // no workspace, no decisions yet, or a lookup failure just skips this section.
  // Uses ensure_user_default_workspace(_user_id) directly with the explicit userId,
  // NOT current_user_default_workspace() (which wraps auth.uid()): this function runs
  // under the service-role admin client from the digest-tick cron, where auth.uid() is
  // null, the same class of service-role-vs-session-context bug already fixed for
  // ai_events (see 20260701190000_ai_events_workspace_default_service_role_safe.sql).
  let stakeholderSection: string | null = null;
  if (prefs?.digest_stakeholder_update) {
    try {
      const { data: wsRpc } = await supabase.rpc("ensure_user_default_workspace", {
        _user_id: userId,
      });
      const workspaceId = (wsRpc as string | null) ?? null;
      if (workspaceId) {
        const loaded = await loadNewestDecisionBrief(supabase, workspaceId);
        if (loaded) {
          const audience = (prefs.digest_stakeholder_audience ?? "exec") as PackAudience;
          const pack = composeStakeholderPack(loaded.brief, audience);
          stakeholderSection = renderPackMarkdown(pack, {
            asOf: new Date().toISOString().slice(0, 10),
          });
        }
      }
    } catch {
      stakeholderSection = null;
    }
  }

  await supabase
    .from("user_notification_preferences")
    .update({ last_digest_sent_at: new Date().toISOString() })
    .eq("user_id", userId);

  if (digestItems.length === 0 && !stakeholderSection) {
    return { generated: false, reason: "No digest items found matching preferences." };
  }

  const subject = `Cadence ${frequency} digest`;
  const sections = [
    `Hello,\n\nHere is your ${frequency} digest from Cadence:`,
    digestItems.length > 0 ? digestItems.join("\n") : null,
    stakeholderSection ? `Stakeholder update:\n\n${stakeholderSection}` : null,
    "Review detailed logs in your Cadence Cockpit dashboard.",
  ].filter((s): s is string => !!s);
  const content = sections.join("\n\n");

  const to = await resolveUserEmail(supabase, userId);
  if (!to)
    return { generated: true, reason: "could not resolve recipient email", subject, content };

  const { sent, reason } = await sendEmail({ to, subject, text: content });
  return { generated: true, reason: sent ? "sent" : reason, subject, content };
}

const DAILY_DUE_MS = 20 * 60 * 60 * 1000; // 20h, so an hourly tick lands once/day with slack
const WEEKLY_DUE_MS = 6.5 * 24 * 60 * 60 * 1000;

/** digest-tick: scans users with a notification-preferences row, sends the ones whose
 *  digest is due and who are not currently in their own quiet hours. Quiet hours reuse
 *  the profile's existing working_hours_start/end + timezone (no duplicate field, per
 *  the data-minimalism rule) — outside working hours is quiet; instant sends bypass this
 *  entirely by design (a critical incident at 2am must still reach you).
 *
 *  JNY-05's Slack write-back runs as a second, workspace-scoped pass below (not nested
 *  in the per-user loop above): a shared team channel must be posted to once per
 *  workspace per period, not once per user with the email toggle on. */
/** The workspace-scoped half of digest-tick: posts to every workspace's bound
 *  "digest_channel" that is due, independent of any user's own email prefs. */
async function sendDueSlackDigests(supabase: SupabaseClient): Promise<number> {
  const { data: bindingRows } = await supabase
    .from("connection_bindings")
    .select("workspace_id")
    .eq("provider", "slack")
    .eq("resource_kind", "digest_channel")
    .is("product_id", null)
    .limit(50);
  const workspaceIds = [
    ...new Set(((bindingRows ?? []) as { workspace_id: string }[]).map((b) => b.workspace_id)),
  ];
  let posted = 0;
  for (const workspaceId of workspaceIds) {
    const result = await postStakeholderDigestToSlack(supabase, workspaceId);
    if (result.posted) posted++;
  }
  return posted;
}

export async function sendDueDigests(
  supabase: SupabaseClient,
): Promise<{ scanned: number; sent: number; slackPosted: number }> {
  const slackPosted = await sendDueSlackDigests(supabase);

  const { data: prefRows } = await supabase
    .from("user_notification_preferences")
    .select("user_id,digest_frequency,last_digest_sent_at")
    .limit(200);
  const rows = (prefRows ?? []) as {
    user_id: string;
    digest_frequency: "daily" | "weekly";
    last_digest_sent_at: string | null;
  }[];
  if (rows.length === 0) return { scanned: 0, sent: 0, slackPosted };

  const now = Date.now();
  const due = rows.filter((r) => {
    const last = r.last_digest_sent_at ? Date.parse(r.last_digest_sent_at) : null;
    const dueMs = r.digest_frequency === "weekly" ? WEEKLY_DUE_MS : DAILY_DUE_MS;
    return last === null || now - last >= dueMs;
  });
  if (due.length === 0) return { scanned: rows.length, sent: 0, slackPosted };

  const userIds = due.map((r) => r.user_id);
  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id,timezone,working_hours_start,working_hours_end")
    .in("id", userIds);
  const profileById = new Map(
    (
      (profileRows ?? []) as {
        id: string;
        timezone: string | null;
        working_hours_start: number;
        working_hours_end: number;
      }[]
    ).map((p) => [p.id, p]),
  );

  let sent = 0;
  const nowUtc = new Date(now);
  for (const r of due) {
    const profile = profileById.get(r.user_id);
    const timezone = profile?.timezone || "UTC";
    const start = profile?.working_hours_start ?? 9;
    const end = profile?.working_hours_end ?? 18;
    const localHour = localHourInTimezone(nowUtc, timezone);
    if (isQuietHours(localHour, start, end)) continue; // defer to the next tick after quiet hours

    const result = await generateDigest(supabase, r.user_id, r.digest_frequency);
    if (result.generated && result.reason === "sent") sent++;
  }
  return { scanned: rows.length, sent, slackPosted };
}
