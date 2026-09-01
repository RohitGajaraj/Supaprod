import { describe, it, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  entitlementsFor,
  isPlanTier,
  normalizePlanTier,
  planPresentation,
  limitFor,
  FREE_MEMORY_RETENTION_DAYS,
  FREE_MONTHLY_CREDITS,
  PLAN_TIERS,
  // Three tests below pulled this in a second time with `require("./entitlements")`,
  // inside the `it` body, while this static import of the very same module sat at the
  // top of the file. `require` returns `any`, so those three tests asserted against an
  // untyped value: `expect(PUBLIC_PLAN_TIERS).not.toContain("max")` would have gone on
  // passing if the export were renamed or deleted, because `undefined` destructured off
  // `any` is not a type error. Imported once, statically, so a rename breaks the build.
  PUBLIC_PLAN_TIERS,
  assertConnectorCapability,
  assertConnectorSlotAvailable,
} from "./entitlements";

describe("PLAN_TIERS", () => {
  it("is the five-tier Constellation ladder, in order", () => {
    expect([...PLAN_TIERS]).toEqual(["free", "pro", "max", "team", "enterprise"]);
  });
});

describe("entitlementsFor", () => {
  it("free does NOT persist memory and carries a finite (rolling) retention", () => {
    const e = entitlementsFor("free");
    expect(e.memoryPersists).toBe(false);
    expect(e.memoryRetentionDays).toBe(FREE_MEMORY_RETENTION_DAYS);
    expect(FREE_MEMORY_RETENTION_DAYS).toBe(30);
    expect(e.crossWorkspaceMemory).toBe(false);
    expect(e.criticEverywhere).toBe(false);
    expect(e.workspaceLimit).toBe(1);
    expect(e.productLimit).toBe(2);
    expect(e.creditMultiplier).toBe(1);
    expect(e.creditMonthlyBase).toBe(FREE_MONTHLY_CREDITS);
    expect(e.creditTopUps).toBe(false);
    expect(e.topUpCapPerCycle).toBe(0);
    expect(e.rbac).toBe(false);
    expect(e.sharedWorkspaceMemory).toBe(false);
    expect(e.perRoleApprovalLanes).toBe(false);
  });

  it("pro persists memory, pools recall across workspaces, and unlocks Critic", () => {
    const e = entitlementsFor("pro");
    expect(e.memoryPersists).toBe(true);
    expect(e.memoryRetentionDays).toBeNull();
    expect(e.crossWorkspaceMemory).toBe(true);
    expect(e.criticEverywhere).toBe(true);
    expect(e.workspaceLimit).toBeNull();
    expect(e.productLimit).toBe(3);
    expect(e.creditMultiplier).toBe(5);
    expect(e.creditMonthlyBase).toBe(FREE_MONTHLY_CREDITS * 5);
    expect(e.creditTopUps).toBe(true);
    expect(e.topUpCapPerCycle).toBeGreaterThan(0);
    // solo tier: no team capabilities yet.
    expect(e.rbac).toBe(false);
    expect(e.approvalLanes).toBe(false);
    expect(e.sharedWorkspaceMemory).toBe(false);
  });

  it("max adds more credits and priority but is still solo", () => {
    const e = entitlementsFor("max");
    expect(e.memoryPersists).toBe(true);
    expect(e.crossWorkspaceMemory).toBe(true);
    expect(e.productLimit).toBe(5);
    expect(e.creditMultiplier).toBe(20);
    expect(e.creditMonthlyBase).toBe(FREE_MONTHLY_CREDITS * 20);
    expect(e.priority).toBe(true);
    expect(e.rbac).toBe(false);
    expect(e.seats).toBe(1);
  });

  it("team adds members, RBAC, and approval lanes on top of paid memory", () => {
    const e = entitlementsFor("team");
    expect(e.memoryPersists).toBe(true);
    expect(e.crossWorkspaceMemory).toBe(true);
    expect(e.rbac).toBe(true);
    expect(e.approvalLanes).toBe(true);
    expect(e.seats).toBeNull();
    expect(e.productLimit).toBeNull();
    // legacy aliases mirror the new fields.
    expect(e.sharedWorkspaceMemory).toBe(true);
    expect(e.perRoleApprovalLanes).toBe(true);
  });

  it("enterprise is custom: a negotiated credit model, no fixed limits", () => {
    const e = entitlementsFor("enterprise");
    expect(e.memoryPersists).toBe(true);
    expect(e.rbac).toBe(true);
    expect(e.enterpriseCreditModel).toBe(true);
    expect(e.creditMultiplier).toBeNull();
    expect(e.creditMonthlyBase).toBeNull();
    expect(e.topUpCapPerCycle).toBeNull();
    expect(e.seats).toBeNull();
    expect(e.productLimit).toBeNull();
  });

  it("share links and data export stay available on every tier", () => {
    for (const tier of PLAN_TIERS) {
      const e = entitlementsFor(tier);
      expect(e.shareLinks).toBe(true);
      expect(e.dataExport).toBe(true);
    }
  });

  it("G1.1 BLOCKER: free tier memory expiry gate must stay OFF at launch", () => {
    /**
     * MOAT PROTECTION. The database function `memory_expiry_enabled()` is seeded
     * to false in migration 20260626250000 and controls whether agent_memory
     * rows get an expires_at timestamp when inserted. As long as the gate reads
     * false, no memory expires, and the compounding property survives.
     *
     * This test verifies the TypeScript-side entitlements are consistent: free
     * tier claims finite memory (30 days retention) but that is only enforced
     * if the database gate is ON. The gate must stay OFF for launch; turning it
     * ON without founder approval (founder ruling 2026-08-10) would silently
     * start deleting Free users' outcome records and break the moat.
     *
     * The actual gate-flip is a one-line admin call at the database level and is
     * not testable in TypeScript, but this test fails loudly if the entitlements
     * model for the free tier ever changes to claim memory persistence when it
     * should not.
     */
    const free = entitlementsFor("free");
    expect(free.memoryPersists).toBe(false);
    expect(free.memoryRetentionDays).toBe(30);

    // The paid tiers should persist memory (only limited by the gate being OFF).
    for (const tier of ["pro", "max", "team", "enterprise"] as const) {
      const paid = entitlementsFor(tier);
      expect(paid.memoryPersists).toBe(true);
      expect(paid.memoryRetentionDays).toBeNull();
    }
  });

  it("WM-M9: bring-your-own AI keys are enterprise-only; every other tier is credits-only", () => {
    for (const tier of PLAN_TIERS) {
      expect(entitlementsFor(tier).byokAllowed).toBe(tier === "enterprise");
    }
  });
});

describe("limitFor", () => {
  it("returns the product and workspace limits, null for generous tiers", () => {
    expect(limitFor("free", "workspace")).toBe(1);
    expect(limitFor("free", "product")).toBe(2);
    expect(limitFor("pro", "product")).toBe(3);
    expect(limitFor("max", "product")).toBe(5);
    expect(limitFor("pro", "workspace")).toBeNull();
    expect(limitFor("team", "product")).toBeNull();
    expect(limitFor("enterprise", "workspace")).toBeNull();
  });
});

describe("isPlanTier / normalizePlanTier", () => {
  it("accepts the five known tiers", () => {
    expect(isPlanTier("free")).toBe(true);
    expect(isPlanTier("pro")).toBe(true);
    expect(isPlanTier("max")).toBe(true);
    expect(isPlanTier("team")).toBe(true);
    expect(isPlanTier("enterprise")).toBe(true);
  });

  it("rejects anything else", () => {
    expect(isPlanTier("garbage")).toBe(false);
    expect(isPlanTier(null)).toBe(false);
    expect(isPlanTier(undefined)).toBe(false);
    expect(isPlanTier(2)).toBe(false);
  });

  it("normalizes unknown or missing values to free (fail-safe default)", () => {
    expect(normalizePlanTier("pro")).toBe("pro");
    expect(normalizePlanTier("max")).toBe("max");
    expect(normalizePlanTier("enterprise")).toBe("enterprise");
    expect(normalizePlanTier("garbage")).toBe("free");
    expect(normalizePlanTier(null)).toBe("free");
    expect(normalizePlanTier(undefined)).toBe("free");
  });
});

describe("planPresentation", () => {
  it("returns a Constellation presentation for each tier", () => {
    for (const tier of PLAN_TIERS) {
      const p = planPresentation(tier);
      expect(p.tier).toBe(tier);
      expect(p.name.length).toBeGreaterThan(0);
      expect(p.price.length).toBeGreaterThan(0);
      expect(p.tagline.length).toBeGreaterThan(0);
      expect(p.highlights.length).toBeGreaterThan(0);
    }
  });

  it("uses the current display names for each tier", () => {
    expect(planPresentation("free").name).toBe("Free");
    expect(planPresentation("pro").name).toBe("Pro");
    // Founder ruling 2026-08-02: `max` is the high credit band for ONE person,
    // not a legacy shim and never a small team. It stays off the public grid
    // (PUBLIC_PLAN_TIERS) but an account on the slug reads this name in Settings.
    expect(planPresentation("max").name).toBe("Max");
    expect(planPresentation("team").name).toBe("Business");
    expect(planPresentation("enterprise").name).toBe("Enterprise");
  });

  it("enterprise has a platform fee, not contact-sales", () => {
    expect(planPresentation("enterprise").price).toBe("Platform fee");
  });
});

describe("planPresentation prices mirror the catalog recommended bundles (M-C-PRICE-SYNC drift guard)", () => {
  it("pins the public/marketing price per tier to the recommended pricing_bundles", () => {
    // free/$0, pro/from $20/mo, max/from $99/mo, team/from $50/mo, enterprise/Platform fee.
    // KNOWN GAP, reported not papered over: billing-tier.ts's TIER_BASE_MONTHLY_USD
    // has no `max` entry, so priceForCredits("max", ...) returns null and nothing
    // in the app can reproduce the $99 below. Either give max a base there or
    // retire the number; do not invent one here.
    // If the catalog changes, change both this test and planPresentation() in entitlements.ts.
    expect(planPresentation("free").price).toBe("$0");
    // "from $X" implied a band the buyer could dial. The band was retired
    // 2026-08-03; every self-serve tier is one flat price now.
    expect(planPresentation("pro").price).toBe("$20/mo");
    expect(planPresentation("max").price).toBe("$99/mo");
    expect(planPresentation("team").price).toBe("$50/mo");
    expect(planPresentation("enterprise").price).toBe("Platform fee");
  });
});

describe("limitFor matches the SQL tier-limit functions (WM-M5 / M-C-BILLING-TESTS parity guard)", () => {
  // Pinned to public.tier_product_limit / public.tier_workspace_limit, verified EQUAL on the
  // live DB 2026-06-21 for every tier. The SQL triggers (WM-M5 migration) and this TS table
  // must stay in lockstep: if you change one, change the other, or a paid user is mis-gated.
  const expected: Record<string, { product: number | null; workspace: number | null }> = {
    free: { product: 2, workspace: 1 },
    pro: { product: 3, workspace: null },
    max: { product: 5, workspace: null },
    team: { product: null, workspace: null },
    enterprise: { product: null, workspace: null },
  };
  it("pins product + workspace limits per tier", () => {
    for (const tier of PLAN_TIERS) {
      expect(limitFor(tier, "product")).toBe(expected[tier].product);
      expect(limitFor(tier, "workspace")).toBe(expected[tier].workspace);
    }
  });
});

describe("connectors: Free reads, capped at 3 (founder ruling 2026-08-04)", () => {
  // WHY THESE EXIST. Free was connectorTier "none" and the public pricing page said
  // nothing about connectors at all, so the tier that has to demonstrate the loop could
  // not point at the user's own data. The cap is the new part, and an advertised cap
  // with no guard behind it is the "claim outruns wiring" defect this repo keeps hitting.

  it("Free can read, which it could not before", () => {
    expect(entitlementsFor("free").connectorTier).toBe("read");
    expect(() => assertConnectorCapability("free", "inflow")).not.toThrow();
  });

  it("Free still cannot write back", () => {
    // The paid boundary is DIRECTION, not count: in only, versus in and out.
    expect(() => assertConnectorCapability("free", "outflow")).toThrow(/Business plan/);
  });

  // TITLE CORRECTED 2026-08-14. This read "and the cap is enforced, not just
  // advertised", and it tested neither: it asserts the function refuses a fourth
  // source, which is a claim about the function. `assertConnectorSlotAvailable`
  // had ZERO callers at the time, so the cap was advertised on the public pricing
  // page and in the plan picker and enforced nowhere at all. The word "enforced"
  // in a test title is what let four separate reviewers read green as safe.
  // Reachability is asserted in its own block at the bottom of this file.
  it("Free refuses a fourth source, as a rule", () => {
    expect(entitlementsFor("free").connectorLimit).toBe(3);
    expect(() => assertConnectorSlotAvailable("free", 0)).not.toThrow();
    expect(() => assertConnectorSlotAvailable("free", 2)).not.toThrow();
    // The third is connected; a fourth is refused.
    expect(() => assertConnectorSlotAvailable("free", 3)).toThrow(/up to 3 sources/);
  });

  it("every paid tier is uncapped", () => {
    for (const tier of PLAN_TIERS.filter((t) => t !== "free")) {
      expect(entitlementsFor(tier).connectorLimit).toBeNull();
      expect(() => assertConnectorSlotAvailable(tier, 500)).not.toThrow();
    }
  });

  it("Business writes back", () => {
    expect(entitlementsFor("team").connectorTier).toBe("read_write");
    expect(() => assertConnectorCapability("team", "outflow")).not.toThrow();
  });

  it("both plan surfaces can render the ladder, because both key off these strings", () => {
    // The public /pricing page and the authenticated PlanPicker both detect a
    // connector row by the "Read connectors" / "Write-back connectors" prefix. If a
    // highlight is reworded without that prefix, the chips silently vanish.
    expect(planPresentation("free").highlights.some((h) => h.startsWith("Read connectors"))).toBe(
      true,
    );
    expect(planPresentation("pro").highlights.some((h) => h.startsWith("Read connectors"))).toBe(
      true,
    );
    expect(
      planPresentation("team").highlights.some((h) => h.startsWith("Write-back connectors")),
    ).toBe(true);
  });

  it("Free says 3 and Pro says unlimited, so the buyer can see what lifts", () => {
    expect(planPresentation("free").highlights.join(" ")).toContain("up to 3 sources");
    expect(planPresentation("pro").highlights.join(" ")).toContain("unlimited sources");
  });
});

describe("G1.3: Billing tier reconciliation (4 public vs 5 internal tiers)", () => {
  it("PUBLIC_PLAN_TIERS has exactly 4 tiers (Free/Pro/Business/Enterprise)", () => {
    expect(PUBLIC_PLAN_TIERS).toHaveLength(4);
    expect([...PUBLIC_PLAN_TIERS]).toEqual(["free", "pro", "team", "enterprise"]);
  });

  it("team slug is presented as 'Business' in all public displays", () => {
    const pres = planPresentation("team");
    expect(pres.name).toBe("Business");
    expect(pres.tier).toBe("team"); // slug stays team for DB/Stripe consistency
  });

  it("max tier is internal-only (backward compat, not public)", () => {
    expect(PUBLIC_PLAN_TIERS).not.toContain("max");
    expect(PLAN_TIERS).toContain("max");
  });

  it("public display names are unique: Free, Pro, Business, Enterprise", () => {
    const names = ["free", "pro", "team", "enterprise"].map(
      (tier) => planPresentation(tier as any).name,
    );
    const unique = new Set(names);
    expect(unique.size).toBe(4);
    expect([...names]).toEqual(["Free", "Pro", "Business", "Enterprise"]);
  });

  it("memory expiry gate must include all paid tiers: pro, team, max, enterprise", () => {
    // G1.1: Memory expiry must stay OFF for Free tier to protect the moat.
    // The SQL trigger set_agent_memory_expiry() sets expires_at = NULL
    // (never expires) for any user in a workspace with plan_tier IN
    // ('pro', 'team', 'enterprise', 'max'). Free users get a 30-day expiry.
    //
    // This test documents the required tier list so that if code changes
    // the tier model, any change to this list is explicit and conscious.

    const paidTiers = ["pro", "team", "max", "enterprise"];
    const freeTier = "free";

    // All paid tiers must be valid
    for (const tier of paidTiers) {
      expect(PLAN_TIERS).toContain(tier);
      const e = entitlementsFor(tier as any);
      expect(e).toBeDefined();
    }

    // Free is not in the paid tier list
    expect(paidTiers).not.toContain(freeTier);
  });

  it("entitlements for all 5 internal tiers are defined", () => {
    for (const tier of PLAN_TIERS) {
      const e = entitlementsFor(tier);
      expect(e).toBeDefined();
      // creditMonthlyBase can be null (enterprise), so just check it exists
      expect(e).toHaveProperty("creditMonthlyBase");
    }
  });

  it("presentation exists for all 4 public tiers only", () => {
    for (const tier of PUBLIC_PLAN_TIERS) {
      const p = planPresentation(tier as any);
      expect(p).toBeDefined();
      expect(p.name).toBeDefined();
      expect(p.tier).toBe(tier);
    }
  });
});

describe("the connector cap is reached, not merely defined", () => {
  /**
   * THE TEST THIS FILE WAS MISSING, and its absence is the whole finding.
   *
   * `assertConnectorSlotAvailable` shipped with seven passing tests above and no
   * caller anywhere in `src`. Every one of those tests asks "does this function
   * refuse a fourth source" and every one answers yes. None asks "does anything
   * ever call it", so the cap was rendered as a promise on two surfaces and
   * enforced on none, and the green tests were read as evidence that it worked.
   *
   * That is the fourth instance of one defect shape in a single audit: a flag no
   * code could write, three MCP scopes no code could grant, a registry counting
   * declarations rather than imports, and a limit function nothing called. The
   * rule for the next person: a test that proves a unit works is not evidence the
   * feature works. Somewhere there must also be a test that the unit is REACHED.
   */
  const CALLER = "src/lib/connections.functions.ts";

  it("has a caller in the product, not only in this file", () => {
    const code = readFileSync(join(import.meta.dir, "..", "..", CALLER), "utf8");
    expect(code).toContain("assertConnectorSlotAvailable");
  });

  it("is called before a native OAuth round trip and before a gateway save", () => {
    // The two doors chosen deliberately. Refusing at the START of the OAuth flow
    // means a person is never sent to a provider's consent screen to authorize
    // something that cannot then be stored.
    const code = readFileSync(join(import.meta.dir, "..", "..", CALLER), "utf8");
    const guard = "assertRoomForAnotherSource";
    // The helper exists, and it is invoked at least twice beyond its definition.
    const uses = code.split(guard).length - 1;
    expect(uses).toBeGreaterThanOrEqual(3);
  });

  it("has an authoritative half in SQL, because the app is not the only door", () => {
    // Nineteen code paths insert a connection row and thirteen of them are
    // service-role OAuth callbacks, which bypass RLS. They do not bypass
    // triggers, so the database is the only place one check covers every door.
    const sql = readFileSync(
      join(
        import.meta.dir,
        "..",
        "..",
        "supabase/migrations/20260814180000_a_cap_advertised_on_two_surfaces_and_enforced_on_none.sql",
      ),
      "utf8",
    );
    expect(sql).toContain("enforce_connector_limit");
    expect(sql).toContain("before insert on public.connections");
    expect(sql).toContain("before insert on public.user_calendar_connections");
  });

  it("keeps the SQL cap and the TypeScript cap on the same number", () => {
    // Two sources of truth for one number is how a Business customer's memories
    // start expiring. The migration names entitlements.ts as the source; this is
    // the check that they have not drifted.
    const sql = readFileSync(
      join(
        import.meta.dir,
        "..",
        "..",
        "supabase/migrations/20260814180000_a_cap_advertised_on_two_surfaces_and_enforced_on_none.sql",
      ),
      "utf8",
    );
    const free = entitlementsFor("free").connectorLimit;
    expect(free).not.toBeNull();
    expect(sql).toContain(`when 'free' then ${free}`);
  });
});
