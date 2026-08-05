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

import { SupabaseClient } from "@supabase/supabase-js";
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
  const { data, error } = await (supabase.from("workspace_members") as any)
    .select("role")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.role as Role;
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
  // WM-M2's account_members table is not in the generated Supabase types yet (it
  // ships on the founder's next publish), so cast the client before .from() to keep
  // tsc green until the post-publish types regen. (The prior `.from(...) as any` cast
  // the result, not the client, so tsc still rejected the table-name argument.)
  const { data, error } = await (supabase as any)
    .from("account_members")
    .select("role")
    .eq("account_id", accountId)
    .eq("user_id", userId)
    .single();

  if (error || !data) return null;
  return data.role as Role;
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
