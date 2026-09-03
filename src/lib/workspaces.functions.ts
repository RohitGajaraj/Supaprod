import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { sendInviteEmail, absoluteUrl } from "@/lib/email.server";

// Workspace management server functions.
// RLS already gates: only the owner can update workspaces and manage members.

/**
 * CREATE A WORKSPACE. Answering REQ-015 ask 2.
 *
 * ── WHY THIS DID NOT EXIST, WHICH IS THE PART WORTH KNOWING ─────────────
 * Every other verb in this file has existed for weeks -- rename, delete, leave,
 * transfer, invite -- and the one that makes a workspace never did. Onboarding
 * creates one inline (`onboarding.functions.ts:74-79`) as a side effect of
 * signing up, so the product could produce your FIRST workspace and never a
 * second. `enforce_workspace_limit` guards a table nothing could insert into
 * from the app, which is a rule enforced against a door that was not built.
 *
 * ── THE REFUSAL IS THE FEATURE, NOT THE ERROR PATH ──────────────────────
 * `trg_enforce_workspace_limit` raises
 *   "Workspace limit reached for this plan (N allowed). Upgrade your plan for
 *    pooled workspaces."
 * That sentence is already written for a person, and shipping it as a raw
 * Postgres error would waste it: a `PGRST` payload in a toast reads as a
 * malfunction, and the reader concludes the product broke rather than that they
 * hit a plan boundary. So the refusal comes back STRUCTURED --
 * `{ ok: false, reason: "plan-limit", limit, message }` -- and the caller
 * renders guidance with a door to Billing.
 *
 * It is detected by the raised text rather than a Postgres error code, and that
 * is a real weakness stated rather than hidden: the code for a trigger
 * `raise exception` is `P0001`, which every other guarded insert in this schema
 * also raises, so the code cannot tell WHICH rule refused. The message is the
 * only thing that can. If a second workspace rule ever raises, this match gets
 * narrower -- it does not get deleted.
 *
 * ── A FRESH WORKSPACE IS NOT BORN EMPTY ─────────────────────────────────
 * `ensureDefaultProduct` has had zero callers since AppShell died, so a
 * workspace created here would open onto nothing. It is called on the way out
 * and its failure does NOT fail the creation: the workspace exists and is
 * usable, and reporting the whole thing as failed would understate what landed
 * and invite a retry that hits the limit for real. Same fail-soft law
 * `recordJudgment` follows.
 */
export const createWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ name: z.string().trim().min(1).max(120) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const { data: created, error } = await supabase
      .from("workspaces")
      /*
       * -- THIS COMMENT SAID RLS ALREADY PERMITTED THIS. IT DID NOT. ---------
       *
       * It read: "`account_id` is auto-filled by the trg_set_workspace_account
       * trigger, and RLS already permits an owner insert. Same shape as
       * onboarding's." The first clause is true. The other two were false, and
       * between them they described a feature that has never once worked.
       *
       * `workspaces` carried one INSERT-capable policy, WITH CHECK
       * `has_workspace_role(id, ...)`, which asks whether the caller is already
       * a member of the workspace being inserted. On an insert the row does not
       * exist and neither does its membership, so it is false by construction
       * and every call here was refused. Walked on production 2026-09-03: the
       * button, a name, Create, and a toast reading "No new workspace was
       * created." No account on the database has ever had two non-sample
       * workspaces.
       *
       * And onboarding's shape is NOT this one. `ensure_user_default_workspace`
       * is SECURITY DEFINER: it bypasses RLS entirely and writes the membership
       * row itself. Believing the two were the same is what hid this.
       *
       * Migration `20260907010000` adds the policy that permits exactly this
       * insert -- a workspace you own, and nothing else.
       */
      .insert([{ owner_id: userId, name: data.name } as never])
      .select("id, name")
      .single();

    if (error) {
      const raised = error.message ?? "";
      if (/workspace limit reached/i.test(raised)) {
        const limit = Number(raised.match(/\((\d+) allowed\)/)?.[1] ?? 0) || null;
        return {
          ok: false as const,
          reason: "plan-limit" as const,
          limit,
          // The trigger's own sentence, forwarded rather than paraphrased. It
          // was written for a person and a second wording here would be two
          // sources for one rule.
          message: raised,
        };
      }
      // Anything else is a genuine failure and says so. Swallowing it into the
      // same shape as the plan limit would tell a person to upgrade over a
      // transport error.
      return { ok: false as const, reason: "failed" as const, limit: null, message: raised };
    }

    const workspace = created as unknown as { id: string; name: string };

    /*
     * -- AND THE MEMBERSHIP ROW, WITHOUT WHICH IT CANNOT BE READ ------------
     *
     * The second half of the same defect, and it would have outlived the policy
     * fix on its own. `workspaces`' SELECT policy was `is_workspace_member(id)`
     * alone, so a workspace created with no `workspace_members` row is invisible
     * to the person who just made it, and every collaborator surface reads
     * through that function.
     *
     * WHAT THIS ROW DOES NOT FIX is the `.select()` above, and an earlier draft
     * of this comment said it did. That `.select()` is a `RETURNING` inside the
     * insert's OWN statement, so it is evaluated before this line has run and no
     * membership row can help it. The read is what 20260908010000's `ws owner
     * reads own` is for. This row is for everything after.
     *
     * `ensure_user_default_workspace` writes this row for the signup path, which
     * is why nobody noticed the second path never did.
     *
     * NOT a trigger, deliberately: a trigger on `workspaces` would also fire for
     * the definer path, which already writes its own membership, and two writers
     * for one row is how the second one comes to be wrong. `ON CONFLICT DO
     * NOTHING` is the definer function's own guard against exactly that, and it
     * is not a shape worth spreading.
     *
     * THIS ONE IS NOT FAIL-SOFT, unlike the product below it. A workspace
     * without its owner's membership is unreadable and unfixable from any
     * surface: there is no screen that can add you to a workspace you cannot
     * see. Reporting success over that would hand somebody a row they can never
     * open, so the failure is surfaced and the caller can try again.
     */
    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert([{ workspace_id: workspace.id, user_id: userId, role: "owner" } as never]);
    if (memberError) {
      return {
        ok: false as const,
        reason: "failed" as const,
        limit: null,
        message: `The workspace was made but you were not added to it, so it would not open: ${memberError.message}`,
      };
    }

    /* Fail-soft, and never blocking. See the header. */
    try {
      await ensureDefaultProduct({ data: { workspaceId: workspace.id } });
    } catch (e) {
      console.error(
        `[workspaces] created ${workspace.id} but its default product was not made: ${
          e instanceof Error ? e.message : String(e)
        }`,
      );
    }

    return { ok: true as const, workspace };
  });

export const renameWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), name: z.string().min(1).max(120) }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("workspaces")
      .update({ name: data.name })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("workspaces").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const leaveWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    // Owners cannot leave their own workspace, they must delete or transfer it.
    const { data: ws } = await context.supabase
      .from("workspaces")
      .select("owner_id")
      .eq("id", data.id)
      .single();
    if (ws?.owner_id === context.userId) {
      throw new Error("Owners can't leave. Delete the workspace or transfer it first.");
    }
    const { error } = await context.supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// WM-F4: hand a workspace to another member. The transactional, audited reassignment
// (owner_id + member roles + audit row) lives in the `transfer_workspace_ownership`
// SECURITY DEFINER RPC, which enforces that only the current owner can transfer and that
// the new owner is already a member. This server fn is the thin, validated entry point.
export const transferWorkspaceOwnership = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ workspaceId: z.string().uuid(), newOwnerId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.rpc("transfer_workspace_ownership", {
      _workspace_id: data.workspaceId,
      _new_owner_id: data.newOwnerId,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Members + identity for the Members surface. display_name lives in profiles (own-row-only
// RLS) and email in auth.users, so a plain select cannot show co-members; the membership-gated
// SECURITY DEFINER `workspace_members_with_identity` RPC supplies identity. Pre-migration
// tolerant: if the RPC is not published yet it falls back to the plain rows (identity null),
// so the surface renders today and fills in on publish. `selfRole` lets the UI gate the
// manage affordances (only owner/admin see remove; only owner sees transfer) without a
// second round-trip; `isSelf` marks the caller's own row.
type MemberIdentityRow = {
  user_id: string;
  role: string;
  created_at: string;
  display_name: string | null;
  email: string | null;
};

export const listWorkspaceMembers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const viaRpc = await context.supabase.rpc("workspace_members_with_identity", {
      _workspace_id: data.id,
    });

    let rows: MemberIdentityRow[];
    if (!viaRpc.error && Array.isArray(viaRpc.data)) {
      rows = viaRpc.data as MemberIdentityRow[];
    } else {
      const plain = await context.supabase
        .from("workspace_members")
        .select("user_id, role, created_at")
        .eq("workspace_id", data.id)
        .order("created_at", { ascending: true });
      if (plain.error) throw new Error(plain.error.message);
      rows = (plain.data ?? []).map((r) => ({
        user_id: r.user_id as string,
        role: r.role as string,
        created_at: r.created_at as string,
        display_name: null,
        email: null,
      }));
    }

    const members = rows.map((r) => ({
      userId: r.user_id,
      role: r.role,
      createdAt: r.created_at,
      displayName: r.display_name,
      email: r.email,
      isSelf: r.user_id === context.userId,
    }));
    const selfRole = members.find((m) => m.isSelf)?.role ?? null;
    return { members, selfRole };
  });

export const removeWorkspaceMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ workspaceId: z.string().uuid(), userId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    // RLS ("owner manages members", WM-F3) restricts member writes to the workspace
    // owner. The .select() turns an RLS-blocked delete (0 rows, no error from PostgREST)
    // into a loud failure instead of a phantom "ok" the UI would report as success.
    const { data: removed, error } = await context.supabase
      .from("workspace_members")
      .delete()
      .eq("workspace_id", data.workspaceId)
      .eq("user_id", data.userId)
      .select("user_id");
    if (error) throw new Error(error.message);
    if (!removed || removed.length === 0) {
      throw new Error("Only the workspace owner can remove members.");
    }
    return { ok: true };
  });

// Change a member's role. Owner-only via the same "owner manages members" RLS; the
// prevent_workspace_owner_demotion trigger blocks demoting the owner. The role enum
// excludes "owner" because promotion to owner is the ownership-transfer flow, not a
// role edit. The .select() makes an RLS-blocked update fail loudly, not silently ok.
export const changeWorkspaceMemberRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        userId: z.string().uuid(),
        role: z.enum(["admin", "member", "viewer"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: updated, error } = await context.supabase
      .from("workspace_members")
      .update({ role: data.role })
      .eq("workspace_id", data.workspaceId)
      .eq("user_id", data.userId)
      .select("user_id");
    if (error) throw new Error(error.message);
    if (!updated || updated.length === 0) {
      throw new Error("Only the workspace owner can change member roles.");
    }
    return { ok: true };
  });

// WM-F5: invitations. The RLS policy on workspace_invitations gates create/list/revoke to
// workspace managers (owner/admin); the accept path goes through the SECURITY DEFINER
// accept_workspace_invitation RPC (the invitee is not a member yet). The DB generates the
// token (a unique default); outbound email is a founder-gated no-op that returns the link.
export const inviteMember = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        email: z.string().email(),
        role: z.enum(["admin", "member", "viewer"]).default("member"),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { data: inv, error } = await context.supabase.rpc("create_workspace_invitation", {
      _workspace_id: data.workspaceId,
      _email: data.email,
      _role: data.role,
    });
    if (error) throw new Error(error.message);
    const row = Array.isArray(inv) ? inv[0] : inv;
    const token = (row as { token: string } | null)?.token;
    if (!token) throw new Error("Failed to create invitation.");
    // Absolute: this link is emailed, so a bare path is not clickable.
    const link = absoluteUrl(`/join/${token}`);
    const { sent } = await sendInviteEmail({ to: data.email, inviteLink: link });
    // Always return the link so the inviter can share it even when email is not wired.
    return { ok: true, link, emailed: sent };
  });

export const listInvitations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: rows, error } = await context.supabase
      .from("workspace_invitations")
      .select("id, email, role, status, created_at, expires_at")
      .eq("workspace_id", data.workspaceId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { invitations: rows ?? [] };
  });

export const revokeInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    // Only a still-pending invitation can be revoked (accepted/expired are terminal).
    const { error } = await context.supabase
      .from("workspace_invitations")
      .update({ status: "revoked" })
      .eq("id", data.id)
      .eq("status", "pending");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Backend entry point for the (deferred) join route: redeems a token via the definer RPC.
export const acceptInvitation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ token: z.string().min(1) }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: workspaceId, error } = await context.supabase.rpc("accept_workspace_invitation", {
      _token: data.token,
    });
    if (error) throw new Error(error.message);
    return { ok: true, workspaceId: workspaceId as string };
  });

/**
 * Loom W2, founder ruling 2026-07-04 (single-product progressive disclosure):
 * every workspace gets ONE default product so capture paths always have a
 * product_id to land on, while the product concept stays invisible in the UI
 * until a second product exists (use-workspace.productsVisible).
 *
 * Called right after workspace creation (AppShell.createWorkspace). Idempotent:
 * inserts a `projects` row named after the workspace only when the workspace
 * has none; matches seed_demo_workspace's insert shape
 * (user_id, workspace_id, name, status).
 */
export const ensureDefaultProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { data: ws, error: wsError } = await context.supabase
      .from("workspaces")
      .select("id, name")
      .eq("id", data.workspaceId)
      .single();
    if (wsError || !ws) throw new Error(wsError?.message ?? "Workspace not found");

    const { count, error: countError } = await context.supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", data.workspaceId);
    if (countError) throw new Error(countError.message);
    if ((count ?? 0) > 0) return { ok: true as const, created: false as const, productId: null };

    const { data: project, error: insertError } = await context.supabase
      .from("projects")
      .insert({
        user_id: context.userId,
        workspace_id: data.workspaceId,
        name: ws.name,
        status: "active",
      })
      .select("id")
      .single();
    if (insertError || !project) {
      throw new Error(insertError?.message ?? "Could not create the default product");
    }
    return { ok: true as const, created: true as const, productId: project.id as string };
  });
