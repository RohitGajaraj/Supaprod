/**
 * Workspace claim: the pure state machine behind bringing an individual's
 * accumulated history into an organisation's control.
 *
 * WHY THIS EXISTS. Pro is a single seat, which is the correct category norm, and
 * it carries one failure mode that is specific to this product's pitch. A person
 * expenses Pro on a work email, builds a year of decisions and outcomes in a
 * workspace that sits in their OWN account, and when they leave, the thing we
 * sell (institutional memory) leaves with them. The employer never had it.
 *
 * The mitigation is a product feature, not a policy. A person must be able to
 * hand their accumulated workspace to the organisation deliberately, and an
 * admin must be able to see that it happened. That converts the biggest moat
 * risk into the best upgrade motion: a PM who ran Pro solo for a year has real
 * accumulated judgment, and the upgrade is the act that makes it the company's.
 *
 * THE UNIT OF THE CLAIM IS THE WHOLE WORKSPACE, not a product and not a copy.
 * Every table that carries the record is workspace scoped (signals, themes,
 * opportunities, prds, decisions, learnings, artifact_lineage) and so is
 * agent_memory since 20260802190000. Re-parenting `workspaces.account_id` moves
 * all of it in one write, with no row copying, no id rewriting, and no half
 * state. The finer grained `move_product` RPC already exists and deliberately
 * refuses to cross an account boundary; it also states in its own header that
 * memory does NOT move with a product. Using it here would hand the org the
 * record without the recall, which is the exact half-claim the product's own
 * limits doc warns about.
 *
 * PURE ON PURPOSE. No DB, no network, no React. Every rule about who may do
 * what, when an offer dies, and what a released claim reverts to lives here and
 * is unit tested. The server functions in workspace-claim.functions.ts are the
 * plumbing; this file is the policy.
 *
 * THE LEDGER. Claim events are appended to `workspace_audit_log`, the existing
 * append-only workspace trail that `transfer_workspace_ownership` already writes
 * to. There is no separate status column anywhere: the current state IS the fold
 * of the events, so a claim cannot be in a state that nothing recorded. See
 * CLAIM-NEEDS-MIGRATION.md for the hardening this wants next (a first class
 * table with an index on the destination account, and one atomic RPC).
 */

/** The five events a claim can produce. Namespaced so they never collide with
 *  `ownership_transfer` or any other action already in the trail. */
export type ClaimAction =
  | "workspace_claim_offered"
  | "workspace_claim_withdrawn"
  | "workspace_claim_declined"
  | "workspace_claim_accepted"
  | "workspace_claim_released";

export const CLAIM_ACTIONS: readonly ClaimAction[] = [
  "workspace_claim_offered",
  "workspace_claim_withdrawn",
  "workspace_claim_declined",
  "workspace_claim_accepted",
  "workspace_claim_released",
] as const;

/**
 * An unaccepted offer dies on its own. An offer that hangs around forever is a
 * standing invitation to absorb someone's work months after they made the
 * decision, which is not the same consent they gave.
 */
export const CLAIM_OFFER_TTL_DAYS = 14;

/**
 * After the organisation accepts, the person who claimed keeps a window in which
 * they can pull the workspace back on their own. This is the "I claimed the
 * wrong workspace" window. It is deliberately short: after it, the workspace is
 * the organisation's and only the organisation can divest it. Both halves are
 * the honest reading of what a claim is.
 */
export const CLAIM_RELEASE_GRACE_DAYS = 7;

/**
 * Which plans can hold another person's claimed workspace. free, pro and max are
 * all `seats: 1` in entitlements.ts, so claiming into one of them would put two
 * people's work inside a single seat account. Requiring team or enterprise is
 * not a paywall bolted onto a feature: it is the reason the feature is an
 * upgrade motion at all.
 */
export const CLAIM_CAPABLE_TIERS: readonly string[] = ["team", "enterprise"] as const;

export function accountCanHoldClaim(tier: string | null | undefined): boolean {
  return !!tier && CLAIM_CAPABLE_TIERS.includes(tier);
}

/**
 * What the person is told will change hands, counted before they consent.
 * Consent to an unspecified thing is not consent, so the offer cannot be made
 * without this having been shown.
 */
export type ClaimInventory = {
  signals: number;
  themes: number;
  opportunities: number;
  prds: number;
  decisions: number;
  learnings: number;
  artifactLineage: number;
  /** Memories the workspace can already read. These become readable by whoever the org adds. */
  memoriesShared: number;
  /** Memories marked private. They move with the workspace and stay unreadable by anyone else. */
  memoriesPrivate: number;
};

export const EMPTY_INVENTORY: ClaimInventory = {
  signals: 0,
  themes: 0,
  opportunities: 0,
  prds: 0,
  decisions: 0,
  learnings: 0,
  artifactLineage: 0,
  memoriesShared: 0,
  memoriesPrivate: 0,
};

/** Everything that changes hands and becomes readable. Private memories are
 *  excluded on purpose: they travel, they do not become anyone else's. */
export function inventoryTotal(inv: ClaimInventory): number {
  return (
    inv.signals +
    inv.themes +
    inv.opportunities +
    inv.prds +
    inv.decisions +
    inv.learnings +
    inv.artifactLineage +
    inv.memoriesShared
  );
}

/** Display rows for the inventory, in the order the loop runs. Zero rows are
 *  kept: "0 decisions" is a fact the person should see before consenting. */
export function inventoryLines(inv: ClaimInventory): { label: string; count: number }[] {
  return [
    { label: "Signals", count: inv.signals },
    { label: "Themes", count: inv.themes },
    { label: "Opportunities", count: inv.opportunities },
    { label: "Specs", count: inv.prds },
    { label: "Decisions", count: inv.decisions },
    { label: "Learnings", count: inv.learnings },
    { label: "Lineage links", count: inv.artifactLineage },
    { label: "Shared memories", count: inv.memoriesShared },
    { label: "Private memories, kept private", count: inv.memoriesPrivate },
  ];
}

/* ------------------------------------------------------------------ *
 * The audit rows, and the typed shapes stored in their `detail` jsonb
 * ------------------------------------------------------------------ */

export type ClaimAuditRow = {
  id: string;
  workspace_id: string;
  actor_id: string | null;
  action: string;
  detail: unknown;
  created_at: string;
};

export type ClaimOfferDetail = {
  fromAccountId: string;
  toAccountId: string;
  toWorkspaceId: string | null;
  toWorkspaceName: string | null;
  offeredBy: string;
  expiresAt: string;
  acknowledged: boolean;
  inventory: ClaimInventory;
};

export type ClaimAcceptDetail = {
  fromAccountId: string;
  toAccountId: string;
  acceptedBy: string;
  graceUntil: string;
  /** The member row the accept added, so a release removes exactly that row and
   *  never a member the claim did not create. */
  addedMemberId: string | null;
  claimantId: string;
  acknowledged: boolean;
  inventory: ClaimInventory;
};

export type ClaimReleaseDetail = {
  /** The account the workspace went back to. */
  toAccountId: string;
  /** The account it was released from. */
  fromAccountId: string;
  releasedBy: string;
  releasedByRole: "claimant" | "account_admin";
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(o: Record<string, unknown>, key: string): string | null {
  const v = o[key];
  return typeof v === "string" && v.length > 0 ? v : null;
}

function num(o: Record<string, unknown>, key: string): number {
  const v = o[key];
  return typeof v === "number" && Number.isFinite(v) ? v : 0;
}

/** Parse the inventory snapshot out of a `detail` payload. Missing means zero,
 *  never undefined, so no caller has to guard a display. */
export function parseInventory(value: unknown): ClaimInventory {
  const o = asRecord(value);
  if (!o) return { ...EMPTY_INVENTORY };
  return {
    signals: num(o, "signals"),
    themes: num(o, "themes"),
    opportunities: num(o, "opportunities"),
    prds: num(o, "prds"),
    decisions: num(o, "decisions"),
    learnings: num(o, "learnings"),
    artifactLineage: num(o, "artifact_lineage"),
    memoriesShared: num(o, "memories_shared"),
    memoriesPrivate: num(o, "memories_private"),
  };
}

/** The jsonb form of an inventory. snake_case because `detail` is a SQL surface
 *  that the hardening migration will index and query directly. */
export function inventoryToDetail(inv: ClaimInventory): Record<string, number> {
  return {
    signals: inv.signals,
    themes: inv.themes,
    opportunities: inv.opportunities,
    prds: inv.prds,
    decisions: inv.decisions,
    learnings: inv.learnings,
    artifact_lineage: inv.artifactLineage,
    memories_shared: inv.memoriesShared,
    memories_private: inv.memoriesPrivate,
  };
}

export function parseOfferDetail(value: unknown): ClaimOfferDetail | null {
  const o = asRecord(value);
  if (!o) return null;
  const fromAccountId = str(o, "from_account_id");
  const toAccountId = str(o, "to_account_id");
  const offeredBy = str(o, "offered_by");
  const expiresAt = str(o, "expires_at");
  if (!fromAccountId || !toAccountId || !offeredBy || !expiresAt) return null;
  return {
    fromAccountId,
    toAccountId,
    toWorkspaceId: str(o, "to_workspace_id"),
    toWorkspaceName: str(o, "to_workspace_name"),
    offeredBy,
    expiresAt,
    acknowledged: o.acknowledged === true,
    inventory: parseInventory(o.inventory),
  };
}

export function parseAcceptDetail(value: unknown): ClaimAcceptDetail | null {
  const o = asRecord(value);
  if (!o) return null;
  const fromAccountId = str(o, "from_account_id");
  const toAccountId = str(o, "to_account_id");
  const acceptedBy = str(o, "accepted_by");
  const graceUntil = str(o, "grace_until");
  const claimantId = str(o, "claimant_id");
  if (!fromAccountId || !toAccountId || !acceptedBy || !graceUntil || !claimantId) return null;
  return {
    fromAccountId,
    toAccountId,
    acceptedBy,
    graceUntil,
    addedMemberId: str(o, "added_member_id"),
    claimantId,
    acknowledged: o.acknowledged === true,
    inventory: parseInventory(o.inventory),
  };
}

/* ------------------------------------------------------------------ *
 * The state machine
 * ------------------------------------------------------------------ */

/**
 * `none`    nothing pending and nothing claimed. A fresh offer may be made.
 * `offered` the person offered, nobody has answered, and it has not expired.
 * `expired` the person offered and nobody answered in time. Treated as none for
 *           what may be done next, but reported separately so the surface can
 *           say what happened rather than pretending the offer never existed.
 * `claimed` an admin accepted. The workspace lives in the organisation's account.
 */
export type ClaimPhase = "none" | "offered" | "expired" | "claimed";

/**
 * One entry in the trail. The two account ids are lifted out of the raw `detail`
 * jsonb rather than the payload being passed through whole: an event's job on a
 * surface is to say who moved what, where, and when, and an opaque blob would
 * make the history unreadable and unserializable at the server function
 * boundary. The full payload stays in the database, which is where an auditor
 * would go for it.
 */
export type ClaimEvent = {
  id: string;
  action: ClaimAction;
  actorId: string | null;
  at: string;
  fromAccountId: string | null;
  toAccountId: string | null;
};

export type ClaimState = {
  workspaceId: string;
  phase: ClaimPhase;
  /** The live (or just expired) offer. Null once answered or released. */
  offer: ClaimOfferDetail | null;
  offeredAt: string | null;
  /** The accepted claim currently in force. Null unless phase is `claimed`. */
  claim: ClaimAcceptDetail | null;
  claimedAt: string | null;
  /** Every claim event on this workspace, oldest first. This is the proof. */
  history: ClaimEvent[];
};

function isClaimAction(action: string): action is ClaimAction {
  return (CLAIM_ACTIONS as readonly string[]).includes(action);
}

/**
 * Fold the audit rows for ONE workspace into the current claim state.
 *
 * Deliberately tolerant of ordering and of rows it does not understand: audit
 * rows arrive from PostgREST in whatever order the caller asked for, and a row
 * whose `detail` cannot be parsed must never crash the surface that is trying to
 * show a person what happened to their work. An unparseable offer is dropped
 * rather than guessed at, because guessing at an account id is how a claim ends
 * up pointing somewhere nobody agreed to.
 */
export function deriveClaimState(
  workspaceId: string,
  rows: readonly ClaimAuditRow[],
  nowIso: string,
): ClaimState {
  const relevant = rows
    .filter((r) => r.workspace_id === workspaceId && isClaimAction(r.action))
    .slice()
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  let offer: ClaimOfferDetail | null = null;
  let offeredAt: string | null = null;
  let claim: ClaimAcceptDetail | null = null;
  let claimedAt: string | null = null;
  const history: ClaimEvent[] = [];

  for (const r of relevant) {
    const action = r.action as ClaimAction;
    const detail = asRecord(r.detail);
    history.push({
      id: r.id,
      action,
      actorId: r.actor_id,
      at: r.created_at,
      fromAccountId: detail ? str(detail, "from_account_id") : null,
      toAccountId: detail ? str(detail, "to_account_id") : null,
    });

    switch (action) {
      case "workspace_claim_offered": {
        const parsed = parseOfferDetail(r.detail);
        if (parsed) {
          offer = parsed;
          offeredAt = r.created_at;
        }
        break;
      }
      case "workspace_claim_withdrawn":
      case "workspace_claim_declined": {
        offer = null;
        offeredAt = null;
        break;
      }
      case "workspace_claim_accepted": {
        const parsed = parseAcceptDetail(r.detail);
        if (parsed) {
          claim = parsed;
          claimedAt = r.created_at;
        }
        offer = null;
        offeredAt = null;
        break;
      }
      case "workspace_claim_released": {
        claim = null;
        claimedAt = null;
        offer = null;
        offeredAt = null;
        break;
      }
    }
  }

  const phase: ClaimPhase = claim
    ? "claimed"
    : offer
      ? offer.expiresAt > nowIso
        ? "offered"
        : "expired"
      : "none";

  return { workspaceId, phase, offer, offeredAt, claim, claimedAt, history };
}

/* ------------------------------------------------------------------ *
 * Who may do what. Every gate returns the SENTENCE that blocks it, or
 * null when the act is allowed, so the server and the UI can never
 * disagree about the reason.
 * ------------------------------------------------------------------ */

export type OfferGate = {
  /** Only the workspace OWNER may offer. Not an admin, and never the org. */
  isSourceOwner: boolean;
  sourceAccountId: string | null;
  destinationAccountId: string | null;
  destinationTier: string | null;
  phase: ClaimPhase;
  acknowledged: boolean;
};

export function offerBlocker(g: OfferGate): string | null {
  if (!g.isSourceOwner) {
    return "Only the person who owns this workspace can offer it. Nobody can claim it for them.";
  }
  if (g.phase === "claimed") {
    return "This workspace has already been claimed. Release it first if it went to the wrong place.";
  }
  if (g.phase === "offered") {
    return "There is already an offer waiting on this workspace. Withdraw it before making another.";
  }
  if (!g.sourceAccountId) {
    return "This workspace has no account, so there is nothing to move it out of.";
  }
  if (!g.destinationAccountId) {
    return "Pick the workspace you want to bring this into.";
  }
  if (g.destinationAccountId === g.sourceAccountId) {
    return "That workspace is already on the same plan as this one, so nothing would move.";
  }
  if (!accountCanHoldClaim(g.destinationTier)) {
    return "That plan is a single seat, so it cannot hold a second person's workspace. It needs Business or Enterprise.";
  }
  if (!g.acknowledged) {
    return "Confirm what changes hands before you offer it.";
  }
  return null;
}

export type AcceptGate = {
  phase: ClaimPhase;
  /** The caller's role in the DESTINATION account, not the workspace. */
  viewerAccountRole: string | null;
  viewerAccountId: string | null;
  destinationTier: string | null;
  offerToAccountId: string | null;
  offerFromAccountId: string | null;
  /** Where the source workspace sits RIGHT NOW. If it moved, the offer is stale. */
  currentSourceAccountId: string | null;
  acknowledged: boolean;
};

const ACCOUNT_MANAGER_ROLES: readonly string[] = ["owner", "admin"] as const;

export function isAccountManager(role: string | null | undefined): boolean {
  return !!role && ACCOUNT_MANAGER_ROLES.includes(role);
}

export function acceptBlocker(g: AcceptGate): string | null {
  if (g.phase === "claimed") return "This workspace has already been claimed.";
  if (g.phase === "expired") {
    return "This offer expired. Ask the person to offer it again if they still want to.";
  }
  if (g.phase !== "offered") return "There is no offer to answer.";
  if (!g.offerToAccountId || g.offerToAccountId !== g.viewerAccountId) {
    return "This offer was not made to your organisation.";
  }
  if (!isAccountManager(g.viewerAccountRole)) {
    return "Only an owner or admin of this organisation can accept a workspace into it.";
  }
  if (!accountCanHoldClaim(g.destinationTier)) {
    return "Your plan is a single seat, so it cannot hold a second person's workspace. Move to Business or Enterprise first.";
  }
  if (!g.offerFromAccountId || g.offerFromAccountId !== g.currentSourceAccountId) {
    return "This workspace has moved since the offer was made, so the offer no longer describes it.";
  }
  if (!g.acknowledged) {
    return "Confirm that your organisation is taking this on before you accept.";
  }
  return null;
}

export type WithdrawGate = {
  phase: ClaimPhase;
  viewerUserId: string;
  offeredBy: string | null;
};

export function withdrawBlocker(g: WithdrawGate): string | null {
  if (g.phase !== "offered" && g.phase !== "expired") return "There is no offer to withdraw.";
  if (!g.offeredBy || g.offeredBy !== g.viewerUserId) {
    return "Only the person who made the offer can withdraw it.";
  }
  return null;
}

export type DeclineGate = {
  phase: ClaimPhase;
  viewerAccountRole: string | null;
  viewerAccountId: string | null;
  offerToAccountId: string | null;
};

export function declineBlocker(g: DeclineGate): string | null {
  if (g.phase !== "offered" && g.phase !== "expired") return "There is no offer to decline.";
  if (!g.offerToAccountId || g.offerToAccountId !== g.viewerAccountId) {
    return "This offer was not made to your organisation.";
  }
  if (!isAccountManager(g.viewerAccountRole)) {
    return "Only an owner or admin of this organisation can decline an offer to it.";
  }
  return null;
}

export type ReleaseGate = {
  phase: ClaimPhase;
  viewerUserId: string;
  claimantId: string | null;
  /** The caller's role in the account that currently HOLDS the workspace. */
  viewerAccountRole: string | null;
  graceUntil: string | null;
  nowIso: string;
};

/**
 * Reversibility, and its limit.
 *
 * Two roles may release, for two different reasons. The person who claimed may
 * take it back inside the grace window, because a mistake made in the first week
 * is a mistake and not a change of ownership. An owner or admin of the holding
 * account may release at any time, because an organisation must always be able
 * to divest data it does not want. After the window, the person can ask but
 * cannot act: the workspace is the organisation's, which is the whole point of
 * having claimed it.
 */
export function releaseBlocker(g: ReleaseGate): string | null {
  if (g.phase !== "claimed")
    return "This workspace is not claimed, so there is nothing to release.";
  if (isAccountManager(g.viewerAccountRole)) return null;
  if (g.claimantId && g.claimantId === g.viewerUserId) {
    if (g.graceUntil && g.graceUntil > g.nowIso) return null;
    return "The window to take this back on your own has passed. An owner or admin of the organisation can still release it.";
  }
  return "Only the person who claimed it, or an owner or admin of the organisation, can release it.";
}

/** Which role the release is being performed as, for the audit row. Callers gate
 *  with releaseBlocker first; this only names what happened. */
export function releaseRole(g: ReleaseGate): "claimant" | "account_admin" {
  if (g.claimantId && g.claimantId === g.viewerUserId && g.graceUntil && g.graceUntil > g.nowIso) {
    return "claimant";
  }
  return "account_admin";
}

/* ------------------------------------------------------------------ *
 * Small time helpers, pure so the deadlines are testable
 * ------------------------------------------------------------------ */

/** ISO timestamp `days` after `fromIso`. Throws on an unparseable input rather
 *  than silently producing an Invalid Date that would compare false forever and
 *  make every offer look expired. */
export function addDays(fromIso: string, days: number): string {
  const t = Date.parse(fromIso);
  if (Number.isNaN(t)) throw new Error("Could not read the time an offer was made.");
  return new Date(t + days * 24 * 60 * 60 * 1000).toISOString();
}

/** Whole days left until `untilIso`, floored at 0. Used for the countdown copy. */
export function daysLeft(untilIso: string | null, nowIso: string): number {
  if (!untilIso) return 0;
  const until = Date.parse(untilIso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(until) || Number.isNaN(now)) return 0;
  return Math.max(0, Math.ceil((until - now) / (24 * 60 * 60 * 1000)));
}
