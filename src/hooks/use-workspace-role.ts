/**
 * WHAT THE SIGNED-IN PERSON MAY CHANGE, ASKED ONCE.
 *
 * Migration 20260805130000 narrowed the write policies on guardrail_rules,
 * house_rules, agent_tools, ai_budgets and ai_surface_budgets to a role. The
 * database is the enforcement. This is the ONE place the browser asks what that
 * enforcement will say, so no screen invents its own idea of what a viewer may
 * do and no screen draws an enabled Save that the database is going to refuse.
 *
 * The allow/deny decision itself is not made here. It is made by
 * GOVERNED_WRITES in roles.functions.ts, which mirrors the migration table for
 * table, and is already unit-tested against the migration file. This module only
 * carries the answer from the server to a component.
 *
 * IT FAILS OPEN, AND THAT IS THE CORRECT CHOICE. While the role is still
 * loading, and if the role read fails outright, every control stays exactly as
 * usable as it was before this file existed. Failing closed would take a
 * guardrail switch away from an owner because a network read hiccuped, which is
 * a real capability lost to guard against a refusal the database is going to
 * make anyway. The server function in front of each write still refuses in
 * plain words, so the worst case here is the pre-existing behaviour, never a
 * silent one.
 */
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  canWriteGoverned,
  getMyWorkspaceRole,
  writeDeniedReason,
  type GovernedSurface,
  type Role,
} from "@/lib/roles.functions";

/**
 * Keyed by workspace, and NOT under a root that survives a workspace switch:
 * `shouldClearOnWorkspaceSwitch` (src/hooks/workspace-query-scope.ts) clears
 * every root it does not recognise, so switching workspaces drops the previous
 * workspace's role rather than serving it to the new one. That is the whole
 * point of the key, since a person can be an owner in one and a viewer in the
 * next.
 */
export function workspaceRoleQueryKey(workspaceId?: string | null) {
  return ["workspace-role", workspaceId ?? null] as const;
}

export type WorkspaceRoleState = {
  role: Role | null;
  /** True while the answer is still unknown. Not the same as "no role". */
  loading: boolean;
  /** True when the role could not be read at all. Controls stay usable. */
  unknown: boolean;
};

/**
 * The signed-in person's role in a workspace. Pass the active workspace id when
 * the surface has one; omit it and the server answers for the workspace a new
 * row would land in.
 */
export function useWorkspaceRole(workspaceId?: string | null): WorkspaceRoleState {
  const fetchRole = useServerFn(getMyWorkspaceRole);
  const q = useQuery({
    queryKey: workspaceRoleQueryKey(workspaceId),
    queryFn: () => fetchRole({ data: { workspaceId: workspaceId ?? null } }),
    // A role changes when somebody edits a membership, which is rare and is not
    // worth a round trip per surface mount.
    staleTime: 5 * 60_000,
    retry: false,
  });
  return {
    role: q.data?.role ?? null,
    loading: q.isPending,
    unknown: q.isError || (!q.isPending && q.data === undefined),
  };
}

export type GovernedWrite = {
  /** Draw the control as usable. False means disabled or absent. */
  allowed: boolean;
  /**
   * One sentence naming the outcome, for a control that is not this person's to
   * use. Null whenever `allowed` is true, so a caller can render it
   * unconditionally.
   */
  reason: string | null;
  role: Role | null;
  loading: boolean;
};

/**
 * May this person write this governed surface, and what do we say if not.
 *
 * Every governed control in the app should ask this rather than compare role
 * strings itself. `reason` is already written in the product's voice: it names
 * who can do the thing, never the policy that stopped it.
 */
export function useGovernedWrite(
  surface: GovernedSurface,
  workspaceId?: string | null,
): GovernedWrite {
  const { role, loading, unknown } = useWorkspaceRole(workspaceId);
  if (loading || unknown) return { allowed: true, reason: null, role, loading };
  return {
    allowed: canWriteGoverned(role, surface),
    reason: writeDeniedReason(role, surface),
    role,
    loading: false,
  };
}
