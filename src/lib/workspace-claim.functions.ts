/**
 * Workspace claim: the server side of handing an individual's accumulated
 * history to an organisation.
 *
 * The policy (who may act, when an offer dies, what a release reverts to) lives
 * in the pure `workspace-claim.ts` and is unit tested there. This module is the
 * plumbing, and it is written so that every authorisation decision is taken from
 * a fact the database proved, never from something the client sent.
 *
 * TWO CLIENTS, ON PURPOSE.
 *   context.supabase  the caller's own client. RLS is live, so a read that comes
 *                     back tells us the caller really is a member. Every
 *                     membership fact this module relies on is established here.
 *   supabaseAdmin     service role. Used ONLY for reads and writes that RLS
 *                     cannot express: reading the audit trail of a workspace the
 *                     accepting admin is not yet a member of, reading the plan of
 *                     an account they belong to but were never added to as an
 *                     account member, and appending to workspace_audit_log (which
 *                     has no write policy by design).
 *
 * ORDERING IS LOAD BEARING IN ACCEPT. The workspace is re-parented BEFORE the
 * accepting admin's member row is inserted. `enforce_workspace_seat_limit_trigger`
 * reads the tier through `workspaces.account_id`, so inserting first would check
 * the member against the individual's single seat plan and fail the moment the
 * founder flips `limit_gates_enabled()`. Re-parenting first means the check sees
 * the organisation's unlimited team seats, which is the truth by then.
 *
 * COMPENSATION, NOT A TRANSACTION. PostgREST gives no cross statement
 * transaction, so accept re-parents, then inserts the member row, and undoes the
 * re-parent if that insert fails. That is a compensation and it is honest about
 * being one. The single atomic RPC that replaces it is specified in
 * CLAIM-NEEDS-MIGRATION.md; this module keeps working unchanged when it lands.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import type { Database, Json } from "@/integrations/supabase/types";
import {
  CLAIM_ACTIONS,
  CLAIM_OFFER_TTL_DAYS,
  CLAIM_RELEASE_GRACE_DAYS,
  EMPTY_INVENTORY,
  accountCanHoldClaim,
  acceptBlocker,
  addDays,
  declineBlocker,
  deriveClaimState,
  inventoryToDetail,
  isAccountManager,
  offerBlocker,
  releaseBlocker,
  releaseRole,
  withdrawBlocker,
  type ClaimAuditRow,
  type ClaimInventory,
  type ClaimState,
} from "@/lib/workspace-claim";

/**
 * How many claim events the admin surface reads in one pass. A claim happens
 * roughly once per person per workspace, so this is generous. It exists because
 * a pending offer names an account the source workspace does not belong to, so
 * the read cannot be narrowed by workspace membership; the hardening migration
 * adds the index that makes the narrow read possible.
 */
const CLAIM_SCAN_LIMIT = 1000;

/** Identity lookups are one round trip each, so the admin list is bounded. */
const CLAIM_IDENTITY_LIMIT = 25;

type Auth = { supabase: SupabaseClient<Database>; userId: string };

/* ------------------------------------------------------------------ *
 * Shared reads
 * ------------------------------------------------------------------ */

type WorkspaceFacts = { id: string; name: string; ownerId: string; accountId: string };

/**
 * Read a workspace THROUGH THE CALLER'S OWN CLIENT. A row coming back is proof
 * of membership (the "ws members read" policy), so every caller below can treat
 * this as the membership gate and never has to ask separately.
 */
async function readWorkspaceAsMember(
  ctx: Auth,
  workspaceId: string,
): Promise<WorkspaceFacts | null> {
  const { data, error } = await ctx.supabase
    .from("workspaces")
    .select("id,name,owner_id,account_id")
    .eq("id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    ownerId: data.owner_id,
    accountId: data.account_id,
  };
}

/**
 * The caller's role in an account. Read with the caller's own client: the
 * "account members see own" policy is `user_id = auth.uid()`, so a caller can
 * always read their own membership row and can never read anyone else's. That
 * makes this both correct and unforgeable without touching service role.
 */
async function readOwnAccountRole(ctx: Auth, accountId: string): Promise<string | null> {
  const { data, error } = await ctx.supabase
    .from("account_members")
    .select("role")
    .eq("account_id", accountId)
    .eq("user_id", ctx.userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.role ?? null;
}

/**
 * Plan tier for a set of accounts. Service role, because a person invited into
 * an organisation's WORKSPACE is not made a member of its ACCOUNT anywhere in
 * this codebase (accept_workspace_invitation writes workspace_members only), so
 * the accounts RLS would hide the very plan they need to see to know whether
 * they can offer their work to it. Callers pass only account ids they derived
 * from workspaces the caller provably belongs to.
 */
async function readAccountTiers(accountIds: readonly string[]): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  if (accountIds.length === 0) return out;
  const { data, error } = await supabaseAdmin
    .from("accounts")
    .select("id,plan_tier")
    .in("id", [...new Set(accountIds)]);
  if (error) throw new Error(error.message);
  for (const row of data ?? []) out.set(row.id, row.plan_tier);
  return out;
}

/** The claim trail for one workspace. Service role: the accepting admin is not a
 *  member of the source workspace yet, so the members-only audit read policy
 *  would hide the offer that is addressed to them. */
async function readClaimRows(workspaceId: string): Promise<ClaimAuditRow[]> {
  const { data, error } = await supabaseAdmin
    .from("workspace_audit_log")
    .select("id,workspace_id,actor_id,action,detail,created_at")
    .eq("workspace_id", workspaceId)
    .in("action", CLAIM_ACTIONS as unknown as string[])
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as ClaimAuditRow[];
}

async function appendClaimEvent(
  workspaceId: string,
  actorId: string,
  action: string,
  detail: Record<string, unknown>,
): Promise<void> {
  const { error } = await supabaseAdmin.from("workspace_audit_log").insert({
    workspace_id: workspaceId,
    actor_id: actorId,
    action,
    detail: detail as unknown as Json,
  });
  if (error) throw new Error(error.message);
}

/**
 * Is this PostgREST error "that function does not exist yet"?
 *
 * The two moves that change hands (accept, release) each have a definer RPC
 * specified in CLAIM-NEEDS-MIGRATION.md that does the whole thing in one
 * transaction. Until it is applied, this module does the same work in steps with
 * a compensation. Calling the RPC first and falling back ONLY on "not found"
 * means the migration can land on any day without a matching deploy, and the
 * moment it does the multi-step path stops being used. Precedent:
 * listWorkspaceMembers does exactly this with workspace_members_with_identity.
 *
 * Narrow on purpose. Any other error is a real failure and must surface, because
 * falling back on a permission error would be the multi-step path quietly doing
 * what the RPC just refused.
 */
type RpcResult = { error: { code?: string; message?: string } | null };

/**
 * Call an RPC that the generated types do not know about yet.
 *
 * The two claim RPCs ship in the migration specified in
 * CLAIM-NEEDS-MIGRATION.md, and `src/integrations/supabase/types.ts` is
 * regenerated only after a publish, so their names cannot type-check before
 * then. The cast is narrowed to the call itself rather than applied to the
 * client, so every other read and write in this module stays fully typed.
 */
function callClaimRpc(name: string, args: Record<string, unknown>): PromiseLike<RpcResult> {
  const rpc = supabaseAdmin.rpc as unknown as (
    fn: string,
    params: Record<string, unknown>,
  ) => PromiseLike<RpcResult>;
  return rpc(name, args);
}

function isMissingFunction(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST202" || error.code === "42883") return true;
  const m = (error.message ?? "").toLowerCase();
  return m.includes("could not find the function") || m.includes("does not exist");
}

/* ------------------------------------------------------------------ *
 * The inventory: what changes hands, counted before anyone consents
 * ------------------------------------------------------------------ */

type CountQuery = PromiseLike<{ count: number | null; error: { message: string } | null }>;

async function countRows(q: CountQuery): Promise<number> {
  const { count, error } = await q;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Count the record that travels, THROUGH THE CALLER'S OWN CLIENT so RLS is the
 * fence: a person can never be shown a count of rows they cannot see.
 */
async function readInventory(ctx: Auth, workspaceId: string): Promise<ClaimInventory> {
  const scoped = (table: "signals" | "themes" | "opportunities" | "prds" | "decisions") =>
    ctx.supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

  const [signals, themes, opportunities, prds, decisions, learnings, artifactLineage] =
    await Promise.all([
      countRows(scoped("signals")),
      countRows(scoped("themes")),
      countRows(scoped("opportunities")),
      countRows(scoped("prds")),
      countRows(scoped("decisions")),
      countRows(
        ctx.supabase
          .from("learnings")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
      ),
      countRows(
        ctx.supabase
          .from("artifact_lineage")
          .select("id", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
      ),
    ]);

  const memoryBase = () =>
    ctx.supabase
      .from("agent_memory")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId);

  // `agent_memory.visibility` shipped in 20260802190000 and is not in the
  // generated types yet, so the column name goes through an untyped view of the
  // builder. If the split read fails the fallback reports EVERY memory as
  // shared, which is the safe direction: it can over-state what becomes
  // readable, never under-state it, and a person deciding whether to hand work
  // over must not be told fewer things travel than actually do.
  let memoriesShared = 0;
  let memoriesPrivate = 0;
  try {
    const byVisibility = (v: string) =>
      (memoryBase() as unknown as { eq(column: string, value: string): CountQuery }).eq(
        "visibility",
        v,
      );
    [memoriesShared, memoriesPrivate] = await Promise.all([
      countRows(byVisibility("workspace")),
      countRows(byVisibility("private")),
    ]);
  } catch {
    memoriesShared = await countRows(memoryBase());
    memoriesPrivate = 0;
  }

  return {
    signals,
    themes,
    opportunities,
    prds,
    decisions,
    learnings,
    artifactLineage,
    memoriesShared,
    memoriesPrivate,
  };
}

/* ------------------------------------------------------------------ *
 * Reads the surfaces call
 * ------------------------------------------------------------------ */

export type ClaimDestination = {
  accountId: string;
  /** A workspace in that account the caller is a member of, used as its face. */
  viaWorkspaceId: string;
  viaWorkspaceName: string;
  planTier: string;
  /** Whether that account's plan can hold a claimed workspace at all. */
  eligible: boolean;
};

/**
 * Where this workspace could be brought. The candidate set is exactly "accounts
 * behind the workspaces you are already a member of, other than this one's".
 *
 * That fence is the point. A person can only offer their work to an organisation
 * that already let them in, so an offer can never be aimed at a stranger's
 * account, and the destination list needs no search, no account id entry, and no
 * way to fat finger a uuid into handing a year of work to the wrong company.
 */
export const listClaimDestinations = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }): Promise<{ destinations: ClaimDestination[] }> => {
    const ctx = context as Auth;
    const { data: rows, error } = await ctx.supabase
      .from("workspaces")
      .select("id,name,account_id")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const mine = rows ?? [];
    const source = mine.find((w) => w.id === data.workspaceId);
    if (!source) throw new Error("You are not a member of that workspace.");

    const firstPerAccount = new Map<string, { id: string; name: string }>();
    for (const w of mine) {
      if (!w.account_id || w.account_id === source.account_id) continue;
      if (!firstPerAccount.has(w.account_id)) {
        firstPerAccount.set(w.account_id, { id: w.id, name: w.name });
      }
    }

    const tiers = await readAccountTiers([...firstPerAccount.keys()]);
    const destinations: ClaimDestination[] = [...firstPerAccount.entries()].map(
      ([accountId, face]) => {
        const planTier = tiers.get(accountId) ?? "free";
        return {
          accountId,
          viaWorkspaceId: face.id,
          viaWorkspaceName: face.name,
          planTier,
          eligible: accountCanHoldClaim(planTier),
        };
      },
    );
    return { destinations };
  });

export type WorkspaceClaimView = {
  workspaceId: string;
  workspaceName: string;
  /** The account holding the workspace right now. */
  accountId: string;
  planTier: string;
  isOwner: boolean;
  /** The caller's role in the account holding it, if any. */
  viewerAccountRole: string | null;
  state: ClaimState;
  /** Null when the caller may act, otherwise the sentence that blocks them. */
  canWithdrawBlocker: string | null;
  canReleaseBlocker: string | null;
};

/** What this workspace's claim looks like to the person reading it. */
export const getWorkspaceClaimState = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }): Promise<WorkspaceClaimView> => {
    const ctx = context as Auth;
    const ws = await readWorkspaceAsMember(ctx, data.workspaceId);
    if (!ws) throw new Error("You are not a member of that workspace.");

    const nowIso = new Date().toISOString();
    const rows = await readClaimRows(ws.id);
    const state = deriveClaimState(ws.id, rows, nowIso);

    const [tiers, viewerAccountRole] = await Promise.all([
      readAccountTiers([ws.accountId]),
      readOwnAccountRole(ctx, ws.accountId),
    ]);

    return {
      workspaceId: ws.id,
      workspaceName: ws.name,
      accountId: ws.accountId,
      planTier: tiers.get(ws.accountId) ?? "free",
      isOwner: ws.ownerId === ctx.userId,
      viewerAccountRole,
      state,
      canWithdrawBlocker: withdrawBlocker({
        phase: state.phase,
        viewerUserId: ctx.userId,
        offeredBy: state.offer?.offeredBy ?? null,
      }),
      canReleaseBlocker: releaseBlocker({
        phase: state.phase,
        viewerUserId: ctx.userId,
        claimantId: state.claim?.claimantId ?? null,
        viewerAccountRole,
        graceUntil: state.claim?.graceUntil ?? null,
        nowIso,
      }),
    };
  });

export type ClaimPreview = {
  workspaceId: string;
  workspaceName: string;
  inventory: ClaimInventory;
  sourceAccountId: string;
  destination: ClaimDestination | null;
  /** Null when the offer may be made, otherwise the sentence that blocks it. */
  blocker: string | null;
};

/**
 * What would change hands, and whether the offer is allowed. Called before the
 * person is asked to consent, because consent to an unspecified thing is not
 * consent. `acknowledged` is passed as true here only to check every OTHER gate:
 * the surface uses the returned blocker to decide what to show, and the real
 * acknowledgement is taken again at the offer itself.
 */
export const previewWorkspaceClaim = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        destinationWorkspaceId: z.string().uuid().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }): Promise<ClaimPreview> => {
    const ctx = context as Auth;
    const ws = await readWorkspaceAsMember(ctx, data.workspaceId);
    if (!ws) throw new Error("You are not a member of that workspace.");

    let destination: ClaimDestination | null = null;
    if (data.destinationWorkspaceId) {
      const destWs = await readWorkspaceAsMember(ctx, data.destinationWorkspaceId);
      if (!destWs) throw new Error("You are not a member of the workspace you picked.");
      const tiers = await readAccountTiers([destWs.accountId]);
      const planTier = tiers.get(destWs.accountId) ?? "free";
      destination = {
        accountId: destWs.accountId,
        viaWorkspaceId: destWs.id,
        viaWorkspaceName: destWs.name,
        planTier,
        eligible: accountCanHoldClaim(planTier),
      };
    }

    const nowIso = new Date().toISOString();
    const state = deriveClaimState(ws.id, await readClaimRows(ws.id), nowIso);
    const inventory = await readInventory(ctx, ws.id);

    return {
      workspaceId: ws.id,
      workspaceName: ws.name,
      inventory,
      sourceAccountId: ws.accountId,
      destination,
      blocker: offerBlocker({
        isSourceOwner: ws.ownerId === ctx.userId,
        sourceAccountId: ws.accountId,
        destinationAccountId: destination?.accountId ?? null,
        destinationTier: destination?.planTier ?? null,
        phase: state.phase,
        acknowledged: true,
      }),
    };
  });

/* ------------------------------------------------------------------ *
 * The person's acts: offer, withdraw
 * ------------------------------------------------------------------ */

/**
 * Offer this workspace to an organisation.
 *
 * Nothing moves here. An offer is a stated intention with an inventory attached
 * and a deadline on it; the data changes hands only when an owner or admin of
 * the destination account accepts. Two separate people have to say yes before a
 * person's work becomes an organisation's, which is the whole consent model in
 * one sentence.
 *
 * `acknowledged` is a required literal true rather than a boolean, so a client
 * that simply forgets the field cannot accidentally consent on the user's
 * behalf. It is recorded in the audit row: "it was an explicit act by that
 * person" has to be provable afterwards, not asserted.
 */
export const offerWorkspaceClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        destinationWorkspaceId: z.string().uuid(),
        acknowledged: z.literal(true),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const ctx = context as Auth;
    const ws = await readWorkspaceAsMember(ctx, data.workspaceId);
    if (!ws) throw new Error("You are not a member of that workspace.");
    const destWs = await readWorkspaceAsMember(ctx, data.destinationWorkspaceId);
    if (!destWs) throw new Error("You are not a member of the workspace you picked.");

    const nowIso = new Date().toISOString();
    const state = deriveClaimState(ws.id, await readClaimRows(ws.id), nowIso);
    const tiers = await readAccountTiers([destWs.accountId]);
    const destinationTier = tiers.get(destWs.accountId) ?? "free";

    const blocker = offerBlocker({
      isSourceOwner: ws.ownerId === ctx.userId,
      sourceAccountId: ws.accountId,
      destinationAccountId: destWs.accountId,
      destinationTier,
      phase: state.phase,
      acknowledged: data.acknowledged,
    });
    if (blocker) throw new Error(blocker);

    const inventory = await readInventory(ctx, ws.id);
    const expiresAt = addDays(nowIso, CLAIM_OFFER_TTL_DAYS);

    await appendClaimEvent(ws.id, ctx.userId, "workspace_claim_offered", {
      from_account_id: ws.accountId,
      to_account_id: destWs.accountId,
      to_workspace_id: destWs.id,
      to_workspace_name: destWs.name,
      offered_by: ctx.userId,
      expires_at: expiresAt,
      acknowledged: true,
      inventory: inventoryToDetail(inventory),
    });

    return { ok: true as const, expiresAt, inventory };
  });

/** Take the offer back. Only the person who made it, and only while it stands. */
export const withdrawWorkspaceClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const ctx = context as Auth;
    const ws = await readWorkspaceAsMember(ctx, data.workspaceId);
    if (!ws) throw new Error("You are not a member of that workspace.");

    const nowIso = new Date().toISOString();
    const state = deriveClaimState(ws.id, await readClaimRows(ws.id), nowIso);
    const blocker = withdrawBlocker({
      phase: state.phase,
      viewerUserId: ctx.userId,
      offeredBy: state.offer?.offeredBy ?? null,
    });
    if (blocker) throw new Error(blocker);

    await appendClaimEvent(ws.id, ctx.userId, "workspace_claim_withdrawn", {
      from_account_id: state.offer?.fromAccountId ?? ws.accountId,
      to_account_id: state.offer?.toAccountId ?? null,
      withdrawn_by: ctx.userId,
    });
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ *
 * The organisation's act: accept or decline
 * ------------------------------------------------------------------ */

/**
 * Answer an offer.
 *
 * Accepting is the act that moves data, so it is the one that carries the
 * organisation's consent. It requires an owner or admin OF THE DESTINATION
 * ACCOUNT: nobody else can take on someone else's work, their bill, or the
 * liability that comes with holding it.
 *
 * What accepting does, in this order and for these reasons:
 *   1. Re-parent the workspace, conditional on it still sitting where the offer
 *      said. The `.eq("account_id", from)` makes this a compare and swap, so two
 *      admins racing to accept cannot both succeed.
 *   2. Add the accepting admin to the workspace as an admin. Without this the
 *      organisation would pay for a workspace nobody in it can open, which fails
 *      the only requirement that matters: an admin must be able to SEE what was
 *      claimed. Ownership is NOT transferred; the person who built the workspace
 *      keeps it. If the organisation wants more, `transfer_workspace_ownership`
 *      already exists and is a separate, deliberate act.
 *   3. Append the accepted event, carrying the inventory as it stood, the grace
 *      deadline, and the member row id so a release can undo exactly this and
 *      nothing else.
 */
export const respondToWorkspaceClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        workspaceId: z.string().uuid(),
        decision: z.enum(["accept", "decline"]),
        acknowledged: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const ctx = context as Auth;
    const nowIso = new Date().toISOString();

    // The source workspace is NOT one the caller is a member of yet, so this
    // read is service role and every check below is explicit.
    const { data: wsRow, error: wsErr } = await supabaseAdmin
      .from("workspaces")
      .select("id,name,owner_id,account_id")
      .eq("id", data.workspaceId)
      .maybeSingle();
    if (wsErr) throw new Error(wsErr.message);
    if (!wsRow) throw new Error("That workspace no longer exists.");

    const state = deriveClaimState(wsRow.id, await readClaimRows(wsRow.id), nowIso);
    const offer = state.offer;
    if (!offer) throw new Error("There is no offer to answer.");

    // Authorisation comes from the caller's OWN membership row in the account
    // the offer names, read under RLS. Service role never decides who may act.
    const viewerAccountRole = await readOwnAccountRole(ctx, offer.toAccountId);
    const tiers = await readAccountTiers([offer.toAccountId]);
    const destinationTier = tiers.get(offer.toAccountId) ?? "free";

    if (data.decision === "decline") {
      const blocker = declineBlocker({
        phase: state.phase,
        viewerAccountRole,
        viewerAccountId: viewerAccountRole ? offer.toAccountId : null,
        offerToAccountId: offer.toAccountId,
      });
      if (blocker) throw new Error(blocker);
      await appendClaimEvent(wsRow.id, ctx.userId, "workspace_claim_declined", {
        from_account_id: offer.fromAccountId,
        to_account_id: offer.toAccountId,
        declined_by: ctx.userId,
      });
      return { ok: true as const, decision: "decline" as const };
    }

    const blocker = acceptBlocker({
      phase: state.phase,
      viewerAccountRole,
      viewerAccountId: viewerAccountRole ? offer.toAccountId : null,
      destinationTier,
      offerToAccountId: offer.toAccountId,
      offerFromAccountId: offer.fromAccountId,
      currentSourceAccountId: wsRow.account_id,
      acknowledged: data.acknowledged,
    });
    if (blocker) throw new Error(blocker);

    const graceUntilRpc = addDays(nowIso, CLAIM_RELEASE_GRACE_DAYS);

    // The atomic road, taken as soon as the migration is applied. Authorisation
    // has already been settled above from RLS-verified facts; the RPC re-checks
    // it in SQL, so the two roads agree and neither trusts the other.
    const viaRpc = await callClaimRpc("claim_workspace_into_account", {
      _workspace_id: wsRow.id,
      _to_account_id: offer.toAccountId,
      _from_account_id: offer.fromAccountId,
      _actor_id: ctx.userId,
      _claimant_id: offer.offeredBy,
      _grace_until: graceUntilRpc,
      _inventory: inventoryToDetail(offer.inventory),
    });
    if (!viaRpc.error) {
      return { ok: true as const, decision: "accept" as const, graceUntil: graceUntilRpc };
    }
    if (!isMissingFunction(viaRpc.error)) throw new Error(viaRpc.error.message);

    // 1. Compare and swap. Zero rows back means somebody else moved it first.
    const { data: moved, error: moveErr } = await supabaseAdmin
      .from("workspaces")
      .update({ account_id: offer.toAccountId })
      .eq("id", wsRow.id)
      .eq("account_id", offer.fromAccountId)
      .select("id");
    if (moveErr) throw new Error(moveErr.message);
    if (!moved || moved.length === 0) {
      throw new Error("This workspace moved while you were answering. Reload and try again.");
    }

    // 2. Give the organisation a way in. Never the claimant's own row: if the
    //    accepting admin somehow already is a member, the claim adds nobody and
    //    records that, so a release cannot remove a membership it did not make.
    let addedMemberId: string | null = null;
    try {
      const { data: existing, error: existErr } = await supabaseAdmin
        .from("workspace_members")
        .select("user_id")
        .eq("workspace_id", wsRow.id)
        .eq("user_id", ctx.userId)
        .maybeSingle();
      if (existErr) throw new Error(existErr.message);
      if (!existing) {
        const { error: addErr } = await supabaseAdmin
          .from("workspace_members")
          .insert({ workspace_id: wsRow.id, user_id: ctx.userId, role: "admin" });
        if (addErr) throw new Error(addErr.message);
        addedMemberId = ctx.userId;
      }
    } catch (e) {
      // Compensation: put the workspace back where it was so a failed accept
      // never leaves it billed to an organisation that cannot open it.
      await supabaseAdmin
        .from("workspaces")
        .update({ account_id: offer.fromAccountId })
        .eq("id", wsRow.id)
        .eq("account_id", offer.toAccountId);
      throw new Error(
        e instanceof Error
          ? `The workspace could not be handed over: ${e.message}`
          : "The workspace could not be handed over.",
      );
    }

    // 3. Record it. The inventory is the offer's, so the number the person
    //    consented to is the number in the organisation's trail.
    const graceUntil = addDays(nowIso, CLAIM_RELEASE_GRACE_DAYS);
    await appendClaimEvent(wsRow.id, ctx.userId, "workspace_claim_accepted", {
      from_account_id: offer.fromAccountId,
      to_account_id: offer.toAccountId,
      accepted_by: ctx.userId,
      claimant_id: offer.offeredBy,
      grace_until: graceUntil,
      added_member_id: addedMemberId,
      acknowledged: true,
      inventory: inventoryToDetail(offer.inventory),
    });

    return { ok: true as const, decision: "accept" as const, graceUntil };
  });

/* ------------------------------------------------------------------ *
 * Reversal
 * ------------------------------------------------------------------ */

/**
 * Put a claimed workspace back where it came from.
 *
 * The account it returns to is read from the accept event, never guessed, so a
 * release is exact even years later. The member row the claim added is removed,
 * and only that one: a colleague invited into the workspace after the claim is
 * left alone, because releasing the billing boundary is not the same act as
 * ejecting people.
 */
export const releaseWorkspaceClaim = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ workspaceId: z.string().uuid(), reason: z.string().max(500).optional() })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const ctx = context as Auth;
    const nowIso = new Date().toISOString();

    const { data: wsRow, error: wsErr } = await supabaseAdmin
      .from("workspaces")
      .select("id,account_id")
      .eq("id", data.workspaceId)
      .maybeSingle();
    if (wsErr) throw new Error(wsErr.message);
    if (!wsRow) throw new Error("That workspace no longer exists.");

    const state = deriveClaimState(wsRow.id, await readClaimRows(wsRow.id), nowIso);
    const claim = state.claim;
    if (!claim) throw new Error("This workspace is not claimed, so there is nothing to release.");

    const viewerAccountRole = await readOwnAccountRole(ctx, claim.toAccountId);
    const gate = {
      phase: state.phase,
      viewerUserId: ctx.userId,
      claimantId: claim.claimantId,
      viewerAccountRole,
      graceUntil: claim.graceUntil,
      nowIso,
    };
    const blocker = releaseBlocker(gate);
    if (blocker) throw new Error(blocker);

    // The atomic road, as in accept: taken the moment the migration exists, and
    // never taken in place of a real error.
    const viaRpc = await callClaimRpc("release_workspace_claim", {
      _workspace_id: wsRow.id,
      _to_account_id: claim.fromAccountId,
      _from_account_id: claim.toAccountId,
      _actor_id: ctx.userId,
      _actor_role: releaseRole(gate),
      _remove_member_id: claim.addedMemberId !== claim.claimantId ? claim.addedMemberId : null,
      _reason: data.reason ?? null,
    });
    if (!viaRpc.error) return { ok: true as const };
    if (!isMissingFunction(viaRpc.error)) throw new Error(viaRpc.error.message);

    const { data: moved, error: moveErr } = await supabaseAdmin
      .from("workspaces")
      .update({ account_id: claim.fromAccountId })
      .eq("id", wsRow.id)
      .eq("account_id", claim.toAccountId)
      .select("id");
    if (moveErr) throw new Error(moveErr.message);
    if (!moved || moved.length === 0) {
      throw new Error("This workspace moved while you were releasing it. Reload and try again.");
    }

    if (claim.addedMemberId && claim.addedMemberId !== claim.claimantId) {
      const { error: rmErr } = await supabaseAdmin
        .from("workspace_members")
        .delete()
        .eq("workspace_id", wsRow.id)
        .eq("user_id", claim.addedMemberId);
      // A membership that will not delete is worth surfacing, but the workspace
      // has already gone back, so this reports rather than throws: leaving the
      // caller believing the release failed would be the worse lie.
      if (rmErr) console.error("releaseWorkspaceClaim: member row not removed", rmErr.message);
    }

    await appendClaimEvent(wsRow.id, ctx.userId, "workspace_claim_released", {
      from_account_id: claim.toAccountId,
      to_account_id: claim.fromAccountId,
      released_by: ctx.userId,
      released_by_role: releaseRole(gate),
      reason: data.reason ?? null,
    });

    return { ok: true as const };
  });

/* ------------------------------------------------------------------ *
 * The enterprise half: what the organisation can see
 * ------------------------------------------------------------------ */

export type AccountClaimRow = {
  workspaceId: string;
  workspaceName: string;
  phase: ClaimState["phase"];
  /** The person whose work this is. */
  claimantId: string | null;
  claimantName: string | null;
  claimantEmail: string | null;
  offeredAt: string | null;
  claimedAt: string | null;
  expiresAt: string | null;
  graceUntil: string | null;
  acceptedBy: string | null;
  acceptedByName: string | null;
  inventory: ClaimInventory;
  /** Every event, oldest first, so the trail is legible and not inferred. */
  history: { action: string; actorId: string | null; actorName: string | null; at: string }[];
};

export type AccountClaimsView = {
  accountId: string | null;
  planTier: string;
  /** False when the caller is not an owner or admin of the account. */
  canView: boolean;
  pending: AccountClaimRow[];
  held: AccountClaimRow[];
  past: AccountClaimRow[];
};

/**
 * Claims into this organisation: what was offered, what was accepted, by whom,
 * and when.
 *
 * This is the half that makes the feature a procurement answer rather than a
 * personal convenience. "Prove what they knew and why they chose it" requires
 * the organisation to be able to show how a body of work came into its
 * possession, on what date, and on whose say so. Without this surface the claim
 * would move data and leave no institutional trace, which is exactly the
 * invisibility problem it exists to fix.
 *
 * Owner and admin only, checked against the caller's own account_members row.
 */
export const listAccountClaims = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }): Promise<AccountClaimsView> => {
    const ctx = context as Auth;
    const ws = await readWorkspaceAsMember(ctx, data.workspaceId);
    if (!ws) throw new Error("You are not a member of that workspace.");

    const [role, tiers] = await Promise.all([
      readOwnAccountRole(ctx, ws.accountId),
      readAccountTiers([ws.accountId]),
    ]);
    const planTier = tiers.get(ws.accountId) ?? "free";
    if (!isAccountManager(role)) {
      return { accountId: ws.accountId, planTier, canView: false, pending: [], held: [], past: [] };
    }

    const { data: rows, error } = await supabaseAdmin
      .from("workspace_audit_log")
      .select("id,workspace_id,actor_id,action,detail,created_at")
      .in("action", CLAIM_ACTIONS as unknown as string[])
      .order("created_at", { ascending: false })
      .limit(CLAIM_SCAN_LIMIT);
    if (error) throw new Error(error.message);

    const all = (rows ?? []) as ClaimAuditRow[];
    const byWorkspace = new Map<string, ClaimAuditRow[]>();
    for (const r of all) {
      const bucket = byWorkspace.get(r.workspace_id);
      if (bucket) bucket.push(r);
      else byWorkspace.set(r.workspace_id, [r]);
    }

    const nowIso = new Date().toISOString();
    const states: ClaimState[] = [];
    for (const [workspaceId, bucket] of byWorkspace) {
      const state = deriveClaimState(workspaceId, bucket, nowIso);
      // Keep a workspace only if this account is named somewhere in its trail.
      // Either side counts: an offer this organisation declined, and a claim it
      // later released, are both things it should still be able to show.
      const touchesUs = state.history.some(
        (e) => e.toAccountId === ws.accountId || e.fromAccountId === ws.accountId,
      );
      if (touchesUs) states.push(state);
    }

    const workspaceIds = states.map((s) => s.workspaceId);
    const names = new Map<string, string>();
    if (workspaceIds.length > 0) {
      const { data: wsRows } = await supabaseAdmin
        .from("workspaces")
        .select("id,name")
        .in("id", workspaceIds);
      for (const w of wsRows ?? []) names.set(w.id, w.name);
    }

    const people = new Set<string>();
    for (const s of states) {
      if (s.offer?.offeredBy) people.add(s.offer.offeredBy);
      if (s.claim?.claimantId) people.add(s.claim.claimantId);
      if (s.claim?.acceptedBy) people.add(s.claim.acceptedBy);
      for (const e of s.history) if (e.actorId) people.add(e.actorId);
    }
    const identities = await readIdentities([...people].slice(0, CLAIM_IDENTITY_LIMIT));

    const toRow = (s: ClaimState): AccountClaimRow => {
      const claimantId = s.claim?.claimantId ?? s.offer?.offeredBy ?? null;
      const identity = claimantId ? identities.get(claimantId) : undefined;
      const acceptedBy = s.claim?.acceptedBy ?? null;
      return {
        workspaceId: s.workspaceId,
        workspaceName: names.get(s.workspaceId) ?? "A workspace",
        phase: s.phase,
        claimantId,
        claimantName: identity?.name ?? null,
        claimantEmail: identity?.email ?? null,
        offeredAt: s.offeredAt,
        claimedAt: s.claimedAt,
        expiresAt: s.offer?.expiresAt ?? null,
        graceUntil: s.claim?.graceUntil ?? null,
        acceptedBy,
        acceptedByName: acceptedBy ? (identities.get(acceptedBy)?.name ?? null) : null,
        inventory: s.claim?.inventory ?? s.offer?.inventory ?? { ...EMPTY_INVENTORY },
        history: s.history.map((e) => ({
          action: e.action,
          actorId: e.actorId,
          actorName: e.actorId ? (identities.get(e.actorId)?.name ?? null) : null,
          at: e.at,
        })),
      };
    };

    const pending = states.filter((s) => s.phase === "offered").map(toRow);
    const held = states.filter((s) => s.phase === "claimed").map(toRow);
    const past = states
      .filter((s) => s.phase === "none" || s.phase === "expired")
      .filter((s) => s.history.length > 0)
      .map(toRow);

    return { accountId: ws.accountId, planTier, canView: true, pending, held, past };
  });

type Identity = { name: string | null; email: string | null };

/**
 * Names and emails for the audit surface. Display names come from `profiles` in
 * one query; the email needs auth.users, which only service role can reach, and
 * is looked up per person because there is no bulk read for it. An organisation
 * proving who handed over what wants an address, not a uuid, so it is worth the
 * round trips at this volume; a failure degrades to the name alone rather than
 * failing the surface.
 */
async function readIdentities(userIds: readonly string[]): Promise<Map<string, Identity>> {
  const out = new Map<string, Identity>();
  if (userIds.length === 0) return out;

  const { data: profiles } = await supabaseAdmin
    .from("profiles")
    .select("id,display_name,full_name")
    .in("id", [...userIds]);
  for (const p of profiles ?? []) {
    out.set(p.id, { name: p.display_name ?? p.full_name ?? null, email: null });
  }

  await Promise.all(
    userIds.map(async (id) => {
      try {
        const { data } = await supabaseAdmin.auth.admin.getUserById(id);
        const email = data?.user?.email ?? null;
        const existing = out.get(id) ?? { name: null, email: null };
        out.set(id, { name: existing.name, email });
      } catch {
        // Identity is decoration on an audit row, never the audit itself.
      }
    }),
  );

  return out;
}
