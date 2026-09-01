/**
 * Server-side RBAC helpers for WM-F3.
 *
 * These check permissions by querying the workspace_members and account_members
 * tables, typically called within server functions to gate operations.
 *
 * Permissions:
 *   - owner: billing/plan, delete account/workspace, transfer ownership, manage members
 *   - admin: manage members (not billing), create/delete workspace+product, approve actions, edit brief+guardrails
 *   - member: create/edit content, run missions
 *   - viewer: read-only
 */

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Database } from "@/integrations/supabase/types";

export type Role = "owner" | "admin" | "member" | "viewer";

export const ROLES: readonly Role[] = ["owner", "admin", "member", "viewer"] as const;

/** Narrow an unknown value (a DB string, a URL param) to a Role, or null. */
export function asRole(value: unknown): Role | null {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : null;
}

/**
 * The governed surfaces, and the roles the DATABASE lets write each one.
 *
 * This mirrors, exactly, the RLS policies installed by
 * supabase/migrations/20260805130000_role_aware_writes_on_governance_tables.sql.
 * The database is the enforcement; this table exists so the UI can say WHY a
 * control is refused instead of surfacing a bare RLS "0 rows" as success.
 *
 * If you change one, change the other. The migration header explains each choice.
 */
export const GOVERNED_WRITES = {
  /** Hard floors screening every AI call. Admin edits guardrails (see header). */
  guardrail_rules: ["owner", "admin"],
  /** Approving, retiring or rewriting a rule injected into every agent prompt. */
  house_rules_decide: ["owner", "admin"],
  /** Drafting a rule for someone to decide. A member keeps this. */
  house_rules_draft: ["owner", "admin", "member"],
  /** Tool overrides are platform policy, not user rows. */
  agent_tools: ["owner", "admin"],
  /** Pausing or resuming the workspace. */
  kill_switches: ["owner", "admin"],
  /** promotion_min_* and settle_* on workspaces: what happens with no human. */
  autonomy_policy: ["owner", "admin"],
  /** A spend cap is money, so a read-only role does not set one. */
  spend_caps: ["owner", "admin", "member"],
  /** Plan and billing sit with the account owner alone. */
  billing: ["owner"],
} as const satisfies Record<string, readonly Role[]>;

export type GovernedSurface = keyof typeof GOVERNED_WRITES;

/**
 * Can this role write this governed surface? Pure, and the single place the app
 * should ask, so no screen invents its own idea of what a viewer may do.
 * An unknown or absent role is a non-member, which writes nothing.
 */
export function canWriteGoverned(role: Role | null | undefined, surface: GovernedSurface): boolean {
  if (!role) return false;
  return (GOVERNED_WRITES[surface] as readonly Role[]).includes(role);
}

/** Owner or admin: the pair the DB calls can_manage_workspace(). */
export function canManageWorkspace(role: Role | null | undefined): boolean {
  return role === "owner" || role === "admin";
}

/** A member of any writing rank. False for a viewer and for a non-member. */
export function canWriteAnything(role: Role | null | undefined): boolean {
  return role === "owner" || role === "admin" || role === "member";
}

/** Read-only by design. Distinct from "not a member at all", which is null. */
export function isReadOnly(role: Role | null | undefined): boolean {
  return role === "viewer";
}

/**
 * The sentence to show when a control is refused. Names the outcome, not the
 * mechanism: nobody needs to hear the words "row level security".
 */
export function writeDeniedReason(
  role: Role | null | undefined,
  surface: GovernedSurface,
): string | null {
  if (canWriteGoverned(role, surface)) return null;
  const allowed = GOVERNED_WRITES[surface] as readonly Role[];
  const who =
    allowed.length === 1
      ? `the ${allowed[0]}`
      : allowed.slice(0, -1).join(", ") + ` or ${allowed[allowed.length - 1]}`;
  if (!role) return `You are not a member of this workspace, so only ${who} can change this.`;
  return `Your role here is ${role}. Only ${who} can change this.`;
}

/**
 * The fingerprints of a message that came out of Postgres or PostgREST rather
 * than out of this product.
 *
 * WHY THIS LIST EXISTS. Every governed write in the UI renders the thrown
 * message straight into a Failed block or a toast. That is right for the
 * sentences this codebase writes ("Your role here is viewer...") and wrong for
 * the ones the database writes. A person who pressed Save and was told
 *
 *   new row violates row-level security policy for table "guardrail_rules"
 *
 * has been handed the mechanism instead of the outcome, plus the name of an
 * internal table. Matching on the phrase rather than on an error code is
 * deliberate: PostgREST flattens the code into the message by the time it
 * reaches a server function, so the code is usually gone and the phrase is not.
 */

/**
 * What to SHOW a person when a governed write failed.
 *
 * Returns the thrown message when this codebase wrote it, and `fallback` when
 * the database did. Never returns an empty string, because a Failed block with
 * nothing in it is worse than a wrong sentence: it reads as "it worked".
 *
 * The role check in front of each write already answers the common refusal in
 * plain words. This is the floor under everything that check cannot foresee.
 */
/**
 * WHAT TO SHOW A PERSON WHEN A CALL FAILED. One decision, one home.
 *
 * This used to keep its own `sessionEndedMessage` and its own
 * RAW_DATABASE_FINGERPRINTS list. S1 built the same decision independently and
 * S0 ruled it into `src/lib/error-copy.ts`, so keeping mine would have been the
 * exact defect I keep filing against other people: two lists that can disagree,
 * where the second one looks authoritative.
 *
 * `error-copy` decides by SHAPE rather than by a list of strings somebody has
 * already seen, and that is the whole reason to prefer it: a list can only
 * refuse yesterday's junk.
 *
 * THE EXAMPLE THAT PROMPTED THIS TURNED OUT NOT TO BE REAL, and it is recorded
 * because the correction matters more than the anecdote. S4 photographed
 * `["decisions",{}] data is undefined` -- a React Query cache key -- apparently
 * being read by a person, and my fingerprint list did pass it straight through.
 * They then withdrew it: the string came from their own route-interception
 * shim resolving where the real middleware throws, not from the product. S1
 * reproduced with a genuinely corrupted token and no key appeared on any of
 * seven surfaces.
 *
 * The consolidation stands on its own merits regardless, which is why it was
 * not reverted: two lists that can disagree is a defect whether or not either
 * has leaked yet, and this one was the second copy of a decision S0 had already
 * ruled into one home.
 *
 * `sessionEndedMessage` is re-exported because it is mine and it still runs
 * first: an ended session is the one failure the reader can fix in a single
 * action, and shape alone would call it machine-shaped and say nothing.
 */
export { sessionEndedMessage } from "@/lib/error-copy";
import { sessionEndedMessage as endedMessage, messageForPerson } from "@/lib/error-copy";

/**
 * The same rule for a failed READ. A surface that renders a thrown message into
 * its failure copy calls this instead of reaching for `.message`.
 */
export function readFailureMessage(error: unknown): string {
  return humanWriteError(error, "The read failed.");
}

export function humanWriteError(error: unknown, fallback: string): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : ((error as { message?: unknown } | null)?.message ?? "");
  const message = typeof raw === "string" ? raw.trim() : "";
  if (!message) return fallback;
  // Strongest claim first: an action the reader can take, then a sentence the
  // server wrote for a person, then this surface's own honest floor.
  return endedMessage(message) ?? messageForPerson(message) ?? fallback;
}

const MyRoleSchema = z.object({ workspaceId: z.string().uuid().nullable().optional() }).strip();

export type MyWorkspaceRoleResult = {
  /** null means "not a member of this workspace", which writes nothing. */
  role: Role | null;
  /** The workspace the role was read in, so a caller can tell which one answered. */
  workspaceId: string | null;
};

/**
 * THE CANONICAL ROLE SOURCE FOR THE CLIENT.
 *
 * Before this existed the browser had no way to learn the signed-in user's role
 * except `listWorkspaceMembers`, which returns `selfRole` as a by-product of
 * listing everybody and is only ever called from the Members card in Settings.
 * So every governed surface (guardrails, house rules, tool overrides, spend
 * caps) drew an enabled Save for a viewer, and migration 20260805130000 makes
 * the database refuse those writes. A control that is enabled, pressed, and
 * then refused in the database's own words is the difference between an
 * enterprise-ready app and a demo.
 *
 * Reads `workspace_members` through the caller's own client, which is exactly
 * what the database's `has_workspace_role()` reads, so this answer and the
 * policy that enforces it cannot drift into disagreeing.
 *
 * WHICH WORKSPACE. A caller that knows its active workspace passes the id. A
 * caller that does not falls back to `current_user_default_workspace()`, which
 * is the same function `guardrail_rules.workspace_id` defaults to, so the
 * prediction and the insert are talking about the same workspace.
 */
export const getMyWorkspaceRole = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof MyRoleSchema> | undefined) => MyRoleSchema.parse(d ?? {}))
  .handler(async ({ context, data }): Promise<MyWorkspaceRoleResult> => {
    const { supabase, userId } = context;
    let workspaceId = data.workspaceId ?? null;
    if (!workspaceId) {
      // Same narrow escape hatch guardrails.functions.ts uses: the RPC is live,
      // the generated types are what is stale.
      const { data: fallback } = await (
        supabase as unknown as {
          rpc: (fn: "current_user_default_workspace") => Promise<{ data: string | null }>;
        }
      ).rpc("current_user_default_workspace");
      workspaceId = fallback ?? null;
    }
    if (!workspaceId) return { role: null, workspaceId: null };
    // Narrowed rather than cast: a role string the app does not know is not a
    // licence, it is an unknown, and an unknown writes nothing.
    const role = asRole(await getUserWorkspaceRole(supabase, workspaceId, userId));
    return { role, workspaceId };
  });

/**
 * Typed error for permission denied.
 */
export class PermissionDeniedError extends Error {
  constructor(
    public readonly action: string,
    public readonly requiredRoles: Role[],
    public readonly userRole?: Role,
  ) {
    super(
      `Permission denied: ${action}. Required role(s): ${requiredRoles.join(", ")}. User role: ${userRole || "none"}.`,
    );
    this.name = "PermissionDeniedError";
  }
}

/**
 * Get the current user's role in a workspace.
 * Returns the role or null if not a member.
 */
export async function getUserWorkspaceRole(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
): Promise<Role | null> {
  // The `as any` that used to wrap this .from() call is gone: workspace_members
  // is in the generated types (checked 2026-09-01) and `supabase` here is
  // already SupabaseClient<Database>, so the cast only switched off the column
  // check on the single most consequential read in the file -- the one every
  // permission gate is built on.
  const { data, error } = await supabase
    .from("workspace_members")
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  // workspace_members.role is `text` with no check constraint, so the old
  // `data.role as Role` was an assertion, not a check: an unrecognised string
  // came back typed as one of the four roles. Narrow with the asRole helper
  // this file already exports -- which is what governance.functions.ts was
  // separately doing at all four of its call sites, while house-rules and
  // guardrails were not. Unknown now reads as null, which every caller already
  // treats as "no membership" and therefore fails closed.
  return asRole(data.role);
}

/**
 * Get the current user's role in an account.
 * Returns the role or null if not a member.
 */
export async function getUserAccountRole(
  supabase: SupabaseClient<Database>,
  accountId: string,
  userId: string,
): Promise<Role | null> {
  // The comment that stood here said account_members "is not in the generated
  // Supabase types yet (it ships on the founder's next publish)". That publish
  // has happened: measured 2026-09-01, account_members is in
  // src/integrations/supabase/types.ts (account_id, created_at, id, role,
  // user_id), so the `supabase as any` is dropped and both the table name and
  // the selected column are checked again.
  const { data, error } = await supabase
    .from("account_members")
    .select("role")
    .eq("account_id", accountId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  // Same narrowing as getUserWorkspaceRole: account_members.role is plain
  // `text`, so assert nothing and fail closed on anything unrecognised.
  return asRole(data.role);
}

/**
 * Assert that the user has one of the required roles in a workspace.
 * Throws PermissionDeniedError if the check fails.
 */
export async function assertWorkspaceRole(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
  requiredRoles: Role[],
  action: string,
): Promise<void> {
  const userRole = await getUserWorkspaceRole(supabase, workspaceId, userId);
  if (!userRole || !requiredRoles.includes(userRole)) {
    throw new PermissionDeniedError(action, requiredRoles, userRole || undefined);
  }
}

/**
 * Assert that the user has one of the required roles in an account.
 * Throws PermissionDeniedError if the check fails.
 */
export async function assertAccountRole(
  supabase: SupabaseClient<Database>,
  accountId: string,
  userId: string,
  requiredRoles: Role[],
  action: string,
): Promise<void> {
  const userRole = await getUserAccountRole(supabase, accountId, userId);
  if (!userRole || !requiredRoles.includes(userRole)) {
    throw new PermissionDeniedError(action, requiredRoles, userRole || undefined);
  }
}

/**
 * Assert that the user is a workspace owner.
 */
export async function assertWorkspaceOwner(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
): Promise<void> {
  await assertWorkspaceRole(supabase, workspaceId, userId, ["owner"], "workspace owner action");
}

/**
 * Assert that the user can manage the workspace (owner or admin).
 */
export async function assertCanManageWorkspace(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  userId: string,
): Promise<void> {
  await assertWorkspaceRole(
    supabase,
    workspaceId,
    userId,
    ["owner", "admin"],
    "workspace management",
  );
}

/**
 * Assert that the user is an account owner.
 */
export async function assertAccountOwner(
  supabase: SupabaseClient<Database>,
  accountId: string,
  userId: string,
): Promise<void> {
  await assertAccountRole(supabase, accountId, userId, ["owner"], "account owner action");
}

/**
 * Assert that the user can manage the account (owner only).
 */
export async function assertCanManageAccount(
  supabase: SupabaseClient<Database>,
  accountId: string,
  userId: string,
): Promise<void> {
  await assertAccountRole(supabase, accountId, userId, ["owner"], "account management");
}
