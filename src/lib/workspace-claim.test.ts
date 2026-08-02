import { describe, it, expect } from "bun:test";
import {
  CLAIM_OFFER_TTL_DAYS,
  CLAIM_RELEASE_GRACE_DAYS,
  EMPTY_INVENTORY,
  acceptBlocker,
  accountCanHoldClaim,
  addDays,
  daysLeft,
  declineBlocker,
  deriveClaimState,
  inventoryLines,
  inventoryToDetail,
  inventoryTotal,
  isAccountManager,
  offerBlocker,
  parseAcceptDetail,
  parseInventory,
  parseOfferDetail,
  releaseBlocker,
  releaseRole,
  withdrawBlocker,
  type ClaimAuditRow,
  type ClaimInventory,
} from "./workspace-claim";

const PERSON = "11111111-1111-1111-1111-111111111111";
const ADMIN = "22222222-2222-2222-2222-222222222222";
const STRANGER = "33333333-3333-3333-3333-333333333333";
const WS = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const OTHER_WS = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const PERSONAL_ACCOUNT = "cccccccc-cccc-cccc-cccc-cccccccccccc";
const ORG_ACCOUNT = "dddddddd-dddd-dddd-dddd-dddddddddddd";

const T0 = "2026-08-01T00:00:00.000Z";
const T1 = "2026-08-02T00:00:00.000Z";
const T2 = "2026-08-03T00:00:00.000Z";
const LATER = "2026-09-01T00:00:00.000Z";

const INVENTORY: ClaimInventory = {
  signals: 40,
  themes: 6,
  opportunities: 9,
  prds: 4,
  decisions: 27,
  learnings: 12,
  artifactLineage: 31,
  memoriesShared: 180,
  memoriesPrivate: 5,
};

function row(
  action: string,
  at: string,
  detail: Record<string, unknown>,
  actorId: string | null = PERSON,
  workspaceId = WS,
): ClaimAuditRow {
  return {
    id: `${action}-${at}`,
    workspace_id: workspaceId,
    actor_id: actorId,
    action,
    detail,
    created_at: at,
  };
}

function offerRow(at = T0, expiresAt = addDays(at, CLAIM_OFFER_TTL_DAYS)): ClaimAuditRow {
  return row("workspace_claim_offered", at, {
    from_account_id: PERSONAL_ACCOUNT,
    to_account_id: ORG_ACCOUNT,
    to_workspace_id: OTHER_WS,
    to_workspace_name: "Acme product",
    offered_by: PERSON,
    expires_at: expiresAt,
    acknowledged: true,
    inventory: inventoryToDetail(INVENTORY),
  });
}

function acceptRow(at = T1, graceUntil = addDays(at, CLAIM_RELEASE_GRACE_DAYS)): ClaimAuditRow {
  return row(
    "workspace_claim_accepted",
    at,
    {
      from_account_id: PERSONAL_ACCOUNT,
      to_account_id: ORG_ACCOUNT,
      accepted_by: ADMIN,
      claimant_id: PERSON,
      grace_until: graceUntil,
      added_member_id: ADMIN,
      acknowledged: true,
      inventory: inventoryToDetail(INVENTORY),
    },
    ADMIN,
  );
}

/* ------------------------------------------------------------------ */

describe("claim inventory", () => {
  it("totals only what becomes readable, never the private memories", () => {
    // 40 + 6 + 9 + 4 + 27 + 12 + 31 + 180 = 309, and the 5 private ones are out.
    expect(inventoryTotal(INVENTORY)).toBe(309);
    expect(inventoryTotal({ ...INVENTORY, memoriesPrivate: 9999 })).toBe(309);
  });

  it("round-trips through the jsonb shape without losing a count", () => {
    expect(parseInventory(inventoryToDetail(INVENTORY))).toEqual(INVENTORY);
  });

  it("reads a missing or malformed payload as zeroes rather than undefined", () => {
    expect(parseInventory(null)).toEqual(EMPTY_INVENTORY);
    expect(parseInventory("nonsense")).toEqual(EMPTY_INVENTORY);
    expect(parseInventory([])).toEqual(EMPTY_INVENTORY);
    expect(parseInventory({ signals: "many" })).toEqual(EMPTY_INVENTORY);
  });

  it("keeps zero rows in the display, because 0 decisions is a fact worth seeing", () => {
    const lines = inventoryLines(EMPTY_INVENTORY);
    expect(lines).toHaveLength(9);
    expect(lines.every((l) => l.count === 0)).toBe(true);
    expect(lines.at(-1)?.label).toContain("private");
  });
});

describe("destination eligibility", () => {
  it("only team and enterprise can hold another person's workspace", () => {
    expect(accountCanHoldClaim("team")).toBe(true);
    expect(accountCanHoldClaim("enterprise")).toBe(true);
  });

  it("rejects every single-seat plan, which is the upgrade motion", () => {
    for (const tier of ["free", "pro", "max"]) expect(accountCanHoldClaim(tier)).toBe(false);
    expect(accountCanHoldClaim(null)).toBe(false);
    expect(accountCanHoldClaim(undefined)).toBe(false);
    expect(accountCanHoldClaim("")).toBe(false);
  });
});

describe("detail parsing", () => {
  it("parses a well formed offer", () => {
    const parsed = parseOfferDetail(offerRow().detail);
    expect(parsed?.fromAccountId).toBe(PERSONAL_ACCOUNT);
    expect(parsed?.toAccountId).toBe(ORG_ACCOUNT);
    expect(parsed?.offeredBy).toBe(PERSON);
    expect(parsed?.acknowledged).toBe(true);
    expect(parsed?.inventory.decisions).toBe(27);
  });

  it("refuses to guess: an offer missing an account id is dropped, not defaulted", () => {
    expect(parseOfferDetail({ to_account_id: ORG_ACCOUNT, offered_by: PERSON })).toBeNull();
    expect(parseOfferDetail({ from_account_id: PERSONAL_ACCOUNT, offered_by: PERSON })).toBeNull();
    expect(parseOfferDetail(null)).toBeNull();
  });

  it("treats a missing acknowledgement as NOT acknowledged", () => {
    const parsed = parseOfferDetail({
      from_account_id: PERSONAL_ACCOUNT,
      to_account_id: ORG_ACCOUNT,
      offered_by: PERSON,
      expires_at: T2,
    });
    expect(parsed?.acknowledged).toBe(false);
  });

  it("drops an accept row with no claimant, so a release can never guess who to give it back to", () => {
    expect(
      parseAcceptDetail({
        from_account_id: PERSONAL_ACCOUNT,
        to_account_id: ORG_ACCOUNT,
        accepted_by: ADMIN,
        grace_until: T2,
      }),
    ).toBeNull();
  });
});

describe("deriveClaimState", () => {
  it("is `none` with no events at all", () => {
    const s = deriveClaimState(WS, [], T0);
    expect(s.phase).toBe("none");
    expect(s.offer).toBeNull();
    expect(s.claim).toBeNull();
    expect(s.history).toEqual([]);
  });

  it("is `offered` while the offer stands", () => {
    const s = deriveClaimState(WS, [offerRow()], T1);
    expect(s.phase).toBe("offered");
    expect(s.offer?.toAccountId).toBe(ORG_ACCOUNT);
    expect(s.offeredAt).toBe(T0);
  });

  it("is `expired` once nobody answered in time, and says so rather than pretending it never happened", () => {
    const s = deriveClaimState(WS, [offerRow()], LATER);
    expect(s.phase).toBe("expired");
    expect(s.offer).not.toBeNull();
    expect(s.history).toHaveLength(1);
  });

  it("returns to `none` after a withdraw", () => {
    const s = deriveClaimState(
      WS,
      [offerRow(), row("workspace_claim_withdrawn", T1, { to_account_id: ORG_ACCOUNT })],
      T2,
    );
    expect(s.phase).toBe("none");
    expect(s.offer).toBeNull();
    expect(s.history).toHaveLength(2);
  });

  it("returns to `none` after a decline", () => {
    const s = deriveClaimState(
      WS,
      [offerRow(), row("workspace_claim_declined", T1, { to_account_id: ORG_ACCOUNT }, ADMIN)],
      T2,
    );
    expect(s.phase).toBe("none");
  });

  it("is `claimed` after an accept, carrying the grace deadline and the added member", () => {
    const s = deriveClaimState(WS, [offerRow(), acceptRow()], T2);
    expect(s.phase).toBe("claimed");
    expect(s.claim?.claimantId).toBe(PERSON);
    expect(s.claim?.acceptedBy).toBe(ADMIN);
    expect(s.claim?.addedMemberId).toBe(ADMIN);
    expect(s.claim?.fromAccountId).toBe(PERSONAL_ACCOUNT);
    expect(s.offer).toBeNull();
    expect(s.claimedAt).toBe(T1);
  });

  it("returns to `none` after a release, and the trail keeps every step", () => {
    const s = deriveClaimState(
      WS,
      [
        offerRow(),
        acceptRow(),
        row(
          "workspace_claim_released",
          T2,
          { from_account_id: ORG_ACCOUNT, to_account_id: PERSONAL_ACCOUNT },
          ADMIN,
        ),
      ],
      LATER,
    );
    expect(s.phase).toBe("none");
    expect(s.claim).toBeNull();
    expect(s.history.map((e) => e.action)).toEqual([
      "workspace_claim_offered",
      "workspace_claim_accepted",
      "workspace_claim_released",
    ]);
  });

  it("supports a second claim after a release, so a mistake is not permanent", () => {
    const s = deriveClaimState(
      WS,
      [
        offerRow(T0),
        acceptRow(T1),
        row("workspace_claim_released", T2, { to_account_id: PERSONAL_ACCOUNT }, ADMIN),
        offerRow("2026-08-04T00:00:00.000Z"),
      ],
      "2026-08-05T00:00:00.000Z",
    );
    expect(s.phase).toBe("offered");
    expect(s.history).toHaveLength(4);
  });

  it("folds events in time order even when the rows arrive newest first", () => {
    const rows = [acceptRow(), offerRow()];
    const s = deriveClaimState(WS, rows, T2);
    expect(s.phase).toBe("claimed");
    expect(s.history.map((e) => e.at)).toEqual([T0, T1]);
  });

  it("ignores rows belonging to a different workspace", () => {
    const foreign = row("workspace_claim_accepted", T2, {}, ADMIN, OTHER_WS);
    const s = deriveClaimState(WS, [offerRow(), foreign], T1);
    expect(s.phase).toBe("offered");
    expect(s.history).toHaveLength(1);
  });

  it("ignores non-claim audit rows sharing the workspace, such as an ownership transfer", () => {
    const transfer = row("ownership_transfer", T1, { from: PERSON, to: ADMIN });
    const s = deriveClaimState(WS, [offerRow(), transfer], T1);
    expect(s.phase).toBe("offered");
    expect(s.history).toHaveLength(1);
  });

  it("drops an unparseable offer instead of inventing an account to point it at", () => {
    const broken = row("workspace_claim_offered", T0, { offered_by: PERSON });
    const s = deriveClaimState(WS, [broken], T1);
    expect(s.phase).toBe("none");
    // The event is still in the trail: something happened and the record says so.
    expect(s.history).toHaveLength(1);
  });

  it("lifts both account ids onto each event so the trail reads without the raw payload", () => {
    const s = deriveClaimState(WS, [offerRow(), acceptRow()], T2);
    expect(s.history[0].fromAccountId).toBe(PERSONAL_ACCOUNT);
    expect(s.history[0].toAccountId).toBe(ORG_ACCOUNT);
    expect(s.history[1].actorId).toBe(ADMIN);
  });
});

describe("offerBlocker: only the person can offer, and only somewhere that can hold it", () => {
  const base = {
    isSourceOwner: true,
    sourceAccountId: PERSONAL_ACCOUNT,
    destinationAccountId: ORG_ACCOUNT,
    destinationTier: "team",
    phase: "none" as const,
    acknowledged: true,
  };

  it("allows the workspace owner to offer to a Business account", () => {
    expect(offerBlocker(base)).toBeNull();
  });

  it("blocks anyone who is not the workspace owner, including an admin", () => {
    expect(offerBlocker({ ...base, isSourceOwner: false })).toContain("owns this workspace");
  });

  it("blocks a second offer while one is already waiting", () => {
    expect(offerBlocker({ ...base, phase: "offered" })).toContain("already an offer");
  });

  it("blocks an offer on an already claimed workspace", () => {
    expect(offerBlocker({ ...base, phase: "claimed" })).toContain("already been claimed");
  });

  it("allows a fresh offer after the last one expired", () => {
    expect(offerBlocker({ ...base, phase: "expired" })).toBeNull();
  });

  it("blocks offering into the account it is already in", () => {
    expect(offerBlocker({ ...base, destinationAccountId: PERSONAL_ACCOUNT })).toContain(
      "nothing would move",
    );
  });

  it("blocks a single-seat destination and names the plan that fixes it", () => {
    for (const tier of ["free", "pro", "max"]) {
      expect(offerBlocker({ ...base, destinationTier: tier })).toContain("Business");
    }
  });

  it("blocks an offer that was never acknowledged", () => {
    expect(offerBlocker({ ...base, acknowledged: false })).toContain("Confirm");
  });

  it("blocks when no destination has been picked yet", () => {
    expect(offerBlocker({ ...base, destinationAccountId: null })).toContain("Pick the workspace");
  });
});

describe("acceptBlocker: the organisation's side of the handshake", () => {
  const base = {
    phase: "offered" as const,
    viewerAccountRole: "admin" as string | null,
    viewerAccountId: ORG_ACCOUNT as string | null,
    destinationTier: "team" as string | null,
    offerToAccountId: ORG_ACCOUNT as string | null,
    offerFromAccountId: PERSONAL_ACCOUNT as string | null,
    currentSourceAccountId: PERSONAL_ACCOUNT as string | null,
    acknowledged: true,
  };

  it("allows an owner or admin of the destination account", () => {
    expect(acceptBlocker(base)).toBeNull();
    expect(acceptBlocker({ ...base, viewerAccountRole: "owner" })).toBeNull();
  });

  it("blocks a plain member or viewer of the organisation", () => {
    for (const role of ["member", "viewer", null]) {
      expect(acceptBlocker({ ...base, viewerAccountRole: role })).toContain("owner or admin");
    }
  });

  it("blocks an admin of a DIFFERENT organisation reading the same offer", () => {
    expect(acceptBlocker({ ...base, viewerAccountId: PERSONAL_ACCOUNT })).toContain(
      "not made to your organisation",
    );
  });

  it("blocks an expired offer and says to ask again rather than silently accepting", () => {
    expect(acceptBlocker({ ...base, phase: "expired" })).toContain("expired");
  });

  it("blocks a stale offer whose workspace has already moved somewhere else", () => {
    expect(acceptBlocker({ ...base, currentSourceAccountId: ORG_ACCOUNT })).toContain("has moved");
  });

  it("blocks an organisation whose own plan cannot hold a second person's workspace", () => {
    expect(acceptBlocker({ ...base, destinationTier: "pro" })).toContain("single seat");
  });

  it("blocks an accept with no acknowledgement, so the org's yes is on the record too", () => {
    expect(acceptBlocker({ ...base, acknowledged: false })).toContain("Confirm");
  });
});

describe("withdrawBlocker and declineBlocker", () => {
  it("lets the person who offered withdraw, and nobody else", () => {
    expect(
      withdrawBlocker({ phase: "offered", viewerUserId: PERSON, offeredBy: PERSON }),
    ).toBeNull();
    expect(
      withdrawBlocker({ phase: "offered", viewerUserId: STRANGER, offeredBy: PERSON }),
    ).toContain("made the offer");
  });

  it("lets an expired offer be tidied away by its author", () => {
    expect(
      withdrawBlocker({ phase: "expired", viewerUserId: PERSON, offeredBy: PERSON }),
    ).toBeNull();
  });

  it("has nothing to withdraw once the claim is accepted", () => {
    expect(
      withdrawBlocker({ phase: "claimed", viewerUserId: PERSON, offeredBy: PERSON }),
    ).toContain("no offer");
  });

  it("lets an owner or admin of the addressed organisation decline", () => {
    expect(
      declineBlocker({
        phase: "offered",
        viewerAccountRole: "admin",
        viewerAccountId: ORG_ACCOUNT,
        offerToAccountId: ORG_ACCOUNT,
      }),
    ).toBeNull();
  });

  it("blocks a decline from a member of the organisation", () => {
    expect(
      declineBlocker({
        phase: "offered",
        viewerAccountRole: "member",
        viewerAccountId: ORG_ACCOUNT,
        offerToAccountId: ORG_ACCOUNT,
      }),
    ).toContain("owner or admin");
  });
});

describe("releaseBlocker: reversibility, and its limit", () => {
  const graceUntil = addDays(T1, CLAIM_RELEASE_GRACE_DAYS);
  const base = {
    phase: "claimed" as const,
    viewerUserId: PERSON,
    claimantId: PERSON as string | null,
    viewerAccountRole: null as string | null,
    graceUntil: graceUntil as string | null,
    nowIso: T2,
  };

  it("lets the person take it back inside the window: a first-week mistake is a mistake", () => {
    expect(releaseBlocker(base)).toBeNull();
    expect(releaseRole(base)).toBe("claimant");
  });

  it("stops the person acting alone once the window closes, and says who still can", () => {
    const late = { ...base, nowIso: LATER };
    expect(releaseBlocker(late)).toContain("owner or admin of the organisation");
  });

  it("lets an owner or admin of the holding organisation release at any time", () => {
    const org = { ...base, viewerUserId: ADMIN, viewerAccountRole: "admin", nowIso: LATER };
    expect(releaseBlocker(org)).toBeNull();
    expect(releaseRole(org)).toBe("account_admin");
  });

  it("blocks a stranger with no role on either side", () => {
    expect(releaseBlocker({ ...base, viewerUserId: STRANGER })).toContain("Only the person");
  });

  it("has nothing to release when the workspace was never claimed", () => {
    expect(releaseBlocker({ ...base, phase: "none" })).toContain("not claimed");
  });

  it("records the org as the actor when an admin releases inside the window too", () => {
    const org = { ...base, viewerUserId: ADMIN, viewerAccountRole: "owner" };
    expect(releaseRole(org)).toBe("account_admin");
  });
});

describe("isAccountManager", () => {
  it("is owner and admin only", () => {
    expect(isAccountManager("owner")).toBe(true);
    expect(isAccountManager("admin")).toBe(true);
    expect(isAccountManager("member")).toBe(false);
    expect(isAccountManager("viewer")).toBe(false);
    expect(isAccountManager(null)).toBe(false);
    expect(isAccountManager(undefined)).toBe(false);
  });
});

describe("deadlines", () => {
  it("computes the offer expiry and the release grace from the moment of the act", () => {
    expect(addDays(T0, CLAIM_OFFER_TTL_DAYS)).toBe("2026-08-15T00:00:00.000Z");
    expect(addDays(T0, CLAIM_RELEASE_GRACE_DAYS)).toBe("2026-08-08T00:00:00.000Z");
  });

  it("throws on an unreadable timestamp rather than minting an Invalid Date that expires everything", () => {
    expect(() => addDays("not a time", 7)).toThrow();
  });

  it("counts whole days left and floors at zero", () => {
    expect(daysLeft(addDays(T0, 14), T0)).toBe(14);
    expect(daysLeft(T0, LATER)).toBe(0);
    expect(daysLeft(null, T0)).toBe(0);
    expect(daysLeft("nonsense", T0)).toBe(0);
  });
});
