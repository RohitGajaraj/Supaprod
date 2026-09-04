/**
 * Entitlements: the pure plan-to-capability map (the Constellation tier ladder).
 *
 * TIER MODEL (G1.3, founder ruling 2026-08-04 + 2026-08-10):
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Public name    │ DB slug   │ Paid? │ Public?  │ Display as  │
 * ├─────────────────────────────────────────────────────────────┤
 * │ Free           │ free      │  —    │   YES    │ Free        │
 * │ Pro            │ pro       │ YES   │   YES    │ Pro         │
 * │ Business       │ team      │ YES   │   YES    │ Business    │
 * │ Enterprise     │ enterprise│ YES   │   YES    │ Enterprise  │
 * │ (internal)     │ max       │ YES   │   NO     │ (unused)    │
 * └─────────────────────────────────────────────────────────────┘
 *
 * The DB has 5 slugs for backward compat (max was historical); public marketing
 * is 4 tiers. The `team` slug is presented as "Business" via planPresentation().
 * All tier-checking code (memory expiry, gates, connectors) uses DB slugs, never
 * display names. Any tier-checking code must include all PAID tiers:
 * pro, team, enterprise, max.
 *
 * Naming is presentation-only: the database, Stripe, and RLS key on the slugs;
 * display names (Free / Pro / Business / Enterprise) live only in
 * planPresentation(), so any tier can be renamed later with a one-file edit and
 * no migration. Build against slugs, never display names.
 *
 * Credit and price NUMBERS here are deliberate placeholders, founder-tunable
 * (plan §7); the mechanism is final. The credit engine stays dormant behind
 * credits_enabled(), which returns TRUE in production since 2026-08-03 (WM-M10..WM-M16).
 * The gate remains so metering can be switched off; it is not a description of today.
 */

export type PlanTier = "free" | "pro" | "max" | "team" | "enterprise";

/**
 * The four publicly marketed tiers (pricing-strategy.md 2026-06-26 decision).
 * `max` remains a valid DB slug for backward compat but is not a public tier.
 * `team` is presented as "Business" (slug unchanged; display name is a skin).
 */
export const PUBLIC_PLAN_TIERS: readonly PlanTier[] = [
  "free",
  "pro",
  "team",
  "enterprise",
] as const;

/**
 * Credit dropdown ladder for Pro and Business tiers.
 * Linear pricing — no volume discount on credit selection.
 * The annual/monthly toggle is the only discount mechanism (~17% off annual).
 * Source: pricing-strategy.md §2.
 */
export const CREDIT_DROPDOWN_TIERS = [
  100, 200, 400, 800, 1200, 2000, 3000, 4000, 5000, 7500, 10000,
] as const;
export type CreditTier = (typeof CREDIT_DROPDOWN_TIERS)[number];

/** Annual discount factor (pay for ~10 months, get 12 = ~16.7% off). */
/**
 * Max is a FIXED monthly price, not a per-credit rate, because it is the only
 * paid tier with `hasCreditDropdown: false`: there is no band for the buyer to
 * pick, so there is nothing for a rate to multiply.
 *
 * IT LIVES HERE SO THERE IS EXACTLY ONE OF IT. Until 2026-08-02 the number
 * existed only as the string "from $99/mo" inside planPresentation, and
 * priceForCredits("max") returned null, so nothing in the product could
 * reproduce the price it advertised and nothing would have noticed if the two
 * drifted apart. The copy now renders from this constant.
 *
 * WHAT THIS DOES NOT DO, and it is a real open question rather than an
 * oversight: it does not reconcile the two pricing mechanics that currently
 * disagree. `entitlements.creditMultiplier` grants max 20x the free base, which
 * is 15,000 credits a month, and at Pro's published rate of 20 USD per 100
 * credits that same volume would price at 3,000 USD. So the multiplier model and
 * the rate model describe different products. Picking which one is real is a
 * founder decision about the business, not something to infer from the code, and
 * inventing a base rate here would have buried the contradiction instead of
 * showing it. See docs/strategy/pricing/.
 */
export const MAX_MONTHLY_USD = 99;

/**
 * The credits a tier INCLUDES each month: one number, not a band.
 *
 * Derived from the multipliers that already existed (Free 1x, Pro 5x, Business 20x)
 * rather than a second table, so the page cannot drift from what the app actually
 * grants. That drift was the bug: the pricing page advertised a 100-to-10,000 band
 * "not a fixed multiplier" while the product granted creditMonthlyBase from exactly
 * a fixed multiplier.
 *
 * null means custom (Enterprise), which the surface renders as "Custom".
 */
export function includedCreditsFor(tier: PlanTier): number | null {
  return entitlementsFor(tier).creditMonthlyBase;
}

export const ANNUAL_DISCOUNT_FACTOR = 10 / 12;

export const PLAN_TIERS: readonly PlanTier[] = [
  "free",
  "pro",
  "max",
  "team",
  "enterprise",
] as const;

/**
 * Free decision memory is kept this many days on a rolling window, then it
 * fades; paid keeps it forever. Bumped 14 -> 30 with the account model.
 */
export const FREE_MEMORY_RETENTION_DAYS = 30;

/**
 * Placeholder monthly AI-credit grant for the free tier (the 1x base). Higher
 * tiers multiply it (Pro 5x, Max 20x). Founder-tunable (plan §7.2 / WM-M11);
 * only the meter, never the value driver (we price the decision layer).
 * 500 -> 750 (founder ruling 2026-07-09): a new account must be able to run
 * the whole first loop while exploring without the meter cutting it short.
 */
export const FREE_MONTHLY_CREDITS = 750;

/**
 * Below this balance the app surfaces a quiet running-low notice (founder
 * ruling 2026-07-09: prompt around the last hundred credits to top up or
 * upgrade - subtle, never a blocker). Consumed by BillingBanner.
 */
export const LOW_CREDITS_WARN = 100;

/**
 * Placeholder per-cycle ceiling on purchased fair-use top-ups (paid tiers).
 * Off by default and capped so the one-subscription promise stays honest;
 * founder-tunable (plan §7.2 / WM-M13).
 */
export const TOP_UP_CAP_PER_CYCLE = 5000;

export type Entitlements = {
  // --- Memory (the core charge) ---
  /** Distilled decision memory persists (paid) or fades (free). The core charge. */
  memoryPersists: boolean;
  /** Days free memory is retained before it fades; null means it never expires. */
  memoryRetentionDays: number | null;
  /** Recall pools across all the account's workspaces (any paid tier; the flywheel). */
  crossWorkspaceMemory: boolean;

  // --- Limits (null = generous / pooled / custom) ---
  /** Workspaces allowed; free = 1, paid pooled (null). */
  workspaceLimit: number | null;
  /** Products (projects) allowed; Free 2 / Pro 3 / Max ~5, team/enterprise generous (null). */
  productLimit: number | null;
  /** Max parallel agents per fanout spawn; free = 1, paid tiered, enterprise unlimited (null). */
  maxParallelAgents: number | null;

  // --- Collaboration ---
  /** Seats; solo tiers = 1, team/enterprise = many (null). */
  seats: number | null;
  /** Role-based access control (owner/admin/member/viewer). */
  rbac: boolean;
  /** Per-role approval lanes for agent actions. */
  approvalLanes: boolean;

  // --- Decision-layer capabilities ---
  /**
   * Display-only signal for the pricing page's upgrade narrative (pricing-
   * strategy.md §7.1: Critic gets deeper/more customizable per tier - custom
   * red-team profiles on Business, approved-model lists on Enterprise).
   * RPT-13 (2026-07-11): the Critic teardown itself has NO code tier-gate -
   * runCritic() fires unconditionally on every PRD/opportunity for every tier
   * (discovery.functions.ts), metered only by the normal per-call credit
   * charge through the callModel chokepoint. This flag does not enforce
   * anything; do not gate access on it.
   */
  criticEverywhere: boolean;
  /** Shareable decision links. Live for every tier today. */
  shareLinks: boolean;
  /** Full data export. On every tier on purpose (lock-in is gravity, not a wall). */
  dataExport: boolean;

  // --- Credits (the meter; LIVE, still gated by credits_enabled()) ---
  /** Monthly credit multiplier vs the free base; null = custom (enterprise). */
  creditMultiplier: number | null;
  /** Included monthly credit grant; null = pooled / custom. */
  creditMonthlyBase: number | null;
  /** Capped fair-use top-ups available (paid tiers only; off by default). */
  creditTopUps: boolean;
  /** Per-cycle top-up ceiling; 0 = none (free), null = custom (enterprise). */
  topUpCapPerCycle: number | null;
  /** Negotiated, custom credit model (enterprise only). */
  enterpriseCreditModel: boolean;
  /** Priority routing / capacity. */
  priority: boolean;

  /**
   * WM-M9: bring-your-own AI keys are an enterprise-only capability. Every other
   * tier is credits-only self-serve. Model-agnostic provider routing still
   * happens, but always through the platform's own keys, never a saved user key.
   */
  byokAllowed: boolean;

  // --- Connector access (the integration tier — pricing-strategy.md §3.3, 2026-06-27) ---
  /**
   * Which connector operations this plan permits.
   *
   *   none       - reserved; no tier uses it since 2026-08-04
   *   read       - Free (max 3, see connectorLimit) and Pro (uncapped): pull signals in
   *   read       - Pro: pull signals in (GitHub issues, Linear cycles, Notion pages, etc.)
   *   read_write - Business: read + write-back (create issues, update tickets, write to Notion)
   *   custom     - Enterprise: read_write + custom connector development
   *
   * Enforced via assertConnectorCapability() at every outflow call site.
   */
  connectorTier: "none" | "read" | "read_write" | "custom";
  /** Max simultaneous connected sources. null = uncapped. 3 on Free. */
  connectorLimit: number | null;

  // --- Legacy aliases (kept so existing consumers do not break) ---
  /** @deprecated Prefer crossWorkspaceMemory. Shared workspace memory across members. */
  sharedWorkspaceMemory: boolean;
  /** @deprecated Prefer approvalLanes. Per-role approval lanes. */
  perRoleApprovalLanes: boolean;
};

export function isPlanTier(value: unknown): value is PlanTier {
  return (
    value === "free" ||
    value === "pro" ||
    value === "max" ||
    value === "team" ||
    value === "enterprise"
  );
}

/** Coerce any stored or wire value to a known tier, defaulting to free (fail-safe). */
export function normalizePlanTier(value: unknown): PlanTier {
  return isPlanTier(value) ? value : "free";
}

export function entitlementsFor(tier: PlanTier): Entitlements {
  const paid = tier !== "free";
  const collab = tier === "team" || tier === "enterprise";
  const enterprise = tier === "enterprise";

  // Credit multiplier vs the free base. team is a pooled per-seat placeholder;
  // enterprise is a negotiated custom model (null). All numbers are founder-tunable.
  const creditMultiplier =
    tier === "free" ? 1 : tier === "pro" ? 5 : tier === "max" ? 20 : tier === "team" ? 20 : null;

  const productLimit = tier === "free" ? 2 : tier === "pro" ? 3 : tier === "max" ? 5 : null;

  const maxParallelAgents =
    tier === "free" ? 1 : tier === "pro" ? 3 : tier === "max" ? 5 : tier === "team" ? 8 : null;

  return {
    memoryPersists: paid,
    memoryRetentionDays: paid ? null : FREE_MEMORY_RETENTION_DAYS,
    crossWorkspaceMemory: paid,

    workspaceLimit: tier === "free" ? 1 : null,
    productLimit,
    maxParallelAgents,

    seats: collab ? null : 1,
    rbac: collab,
    approvalLanes: collab,

    criticEverywhere: paid,
    // Share links stay available on every tier (the feature is already live for
    // all users); a Pro highlight, not a paid-only gate.
    shareLinks: true,
    dataExport: true,

    creditMultiplier,
    creditMonthlyBase: creditMultiplier === null ? null : FREE_MONTHLY_CREDITS * creditMultiplier,
    creditTopUps: paid,
    topUpCapPerCycle: tier === "free" ? 0 : enterprise ? null : TOP_UP_CAP_PER_CYCLE,
    enterpriseCreditModel: enterprise,
    byokAllowed: enterprise,
    priority: tier === "max" || collab,

    connectorTier:
      // Free reads too, capped by connectorLimit below (founder ruling 2026-08-04).
      // It used to be "none". A prospect who cannot connect their OWN data is
      // evaluating a demo, and the one thing that makes this product obviously
      // different is the loop closing on THEIR signals.
      tier === "free" || tier === "pro" || tier === "max"
        ? "read"
        : enterprise
          ? "custom"
          : "read_write", // team = Business

    // How MANY sources may be connected. null = uncapped. Three on Free is
    // deliberate rather than round: a signal source, a tracker and a doc store is
    // the minimum for the loop to visibly close.
    connectorLimit: tier === "free" ? 3 : null,

    // Legacy aliases.
    sharedWorkspaceMemory: collab,
    perRoleApprovalLanes: collab,
  };
}

export type ConnectorCapability = "inflow" | "outflow";

/**
 * Throws if the plan tier does not permit the requested connector operation.
 *
 * - Free:     no connectors at all
 * - Pro/Max:  inflow (read) only — pulling signals in from GitHub, Linear, etc.
 * - Business: inflow + outflow (write-back) — create issues, update tickets, write to Notion
 * - Enterprise: all of the above + custom connector development
 *
 * Call this in every server function that uses an outflow connector operation.
 * Inflow enforcement is lighter — fail gracefully via resolveProviderAuth returning source:'none'.
 * Strategy ref: pricing-strategy.md §3.3 (2026-06-27 decision).
 */
export function assertConnectorCapability(tier: PlanTier, capability: ConnectorCapability): void {
  const e = entitlementsFor(tier);
  if (e.connectorTier === "none") {
    throw new Error("This plan does not permit live connectors.");
  }
  if (capability === "outflow" && e.connectorTier === "read") {
    throw new Error(
      "Write-back connectors (creating issues, updating tickets, writing to Notion) require the Business plan. Upgrade to push Supaprod decisions back to where your team works.",
    );
  }
}

/**
 * Throws if connecting one more source would exceed the plan's connector cap.
 *
 * Separate from assertConnectorCapability because they answer different questions:
 * that one asks "may this plan read or write at all", this one asks "may it connect
 * ANOTHER source". Free is read-capable but capped at 3; every paid tier is uncapped.
 *
 * Call at the point a NEW connection is created, not on every use.
 */
export function assertConnectorSlotAvailable(tier: PlanTier, currentCount: number): void {
  const cap = entitlementsFor(tier).connectorLimit;
  if (cap !== null && currentCount >= cap) {
    throw new Error(
      `The Free plan connects up to ${cap} sources. Disconnect one, or upgrade to Pro to connect as many as you like.`,
    );
  }
}

export type LimitKind = "workspace" | "product";

/** The numeric limit for a tier + kind; null means generous / pooled / unlimited. */
export function limitFor(tier: PlanTier, kind: LimitKind): number | null {
  const e = entitlementsFor(tier);
  return kind === "workspace" ? e.workspaceLimit : e.productLimit;
}

export type PlanPresentation = {
  tier: PlanTier;
  /**
   * Public display name. Slug is canonical for DB/Stripe/RLS; name is a skin.
   * 4-tier model (pricing-strategy.md 2026-06-26): Free / Pro / Business / Enterprise.
   * `max` is internal-only (not a public tier); `team` slug displays as "Business".
   */
  name: string;
  /**
   * Base display price (lowest credit tier, monthly). The pricing page computes the
   * actual price reactively via priceForCredits() in billing-tier.ts as the user
   * adjusts the credit dropdown. Pro and Business show "from $X/mo".
   */
  price: string;
  tagline: string;
  forWhom: string;
  highlights: string[];
  /** Whether this tier shows the credit dropdown (Pro + Business only). */
  hasCreditDropdown: boolean;
  /** Whether this tier shows the monthly/annual billing toggle. */
  hasBillingToggle: boolean;
};

export function planPresentation(tier: PlanTier): PlanPresentation {
  switch (tier) {
    case "pro":
      return {
        tier: "pro",
        name: "Pro",
        price: "$20/mo",
        tagline:
          "One author, and the whole record is yours. It never stops guiding, and nothing about it is held back for a higher plan.",
        forWhom: "Built for one person doing product work that needs to compound. One seat.",
        hasCreditDropdown: true,
        hasBillingToggle: true,
        highlights: [
          // Lead with the REASON TO PAY. This list used to open with two lines about
          // what is NOT gated (one seat, sharing is free everywhere), which are true and
          // worth saying but are not why anyone upgrades. On Free the record fades at 30
          // days; that is the charge, so it goes first.
          //
          // P-94 (A-QUEUE.md): this used to say "Your decision record stops
          // fading" -- the same phrase Free's OWN highlight below uses for
          // the opposite claim ("Your decision record: exportable forever,
          // never fades"). Two highlights on two tiers, one phrase,
          // contradicting each other. What actually differs by plan is the
          // memory the loop draws on (`memoryRetentionDays`), never the
          // decisions/learnings record itself (RPT-14: no expiry in the
          // schema, the export never reads a fading table, true on every
          // tier). Reworded to match Free's own "past calls" vocabulary
          // instead of borrowing the other claim's noun.
          "Everything in Free, plus:",
          "Past calls keep guiding forever. Nothing fades.",
          "Every spec and bet gets torn apart by the Critic before you commit to it",
          "Read connectors, unlimited sources. Connect your tools once and signals arrive on their own",
          "What one workspace learned guides them all",
          "Up to 3 products, pooled workspaces",
          "Up to 3 agents running in parallel",
          // Founder ruling 2026-08-02: sharing is never presented as a locked row, and
          // shareLinks is true on EVERY tier. Kept legible, but below the reasons to pay.
          "Share any decision by link. The reader needs no account and no seat.",
          "One seat. One author, so nothing in your record is held back for a higher plan.",
          "Save around 17% with annual billing",
          "Email support, next-business-day",
        ],
      };
    case "max":
      // Not on the public grid (see PUBLIC_PLAN_TIERS), but a live DB slug: an
      // account on it reads this copy in Settings, so it has to be true.
      // Founder ruling 2026-08-02: max is MORE POWER FOR ONE PERSON, never a
      // small team. seats is 1 here exactly as it is on free and pro.
      return {
        tier: "max",
        name: "Max",
        price: `$${MAX_MONTHLY_USD}/mo`,
        tagline: "The same product as Pro, with far more room for one person.",
        forWhom: "Built for one person running the loop hard. Still one seat, never a small team.",
        hasCreditDropdown: false,
        hasBillingToggle: false,
        highlights: [
          "One seat. Sharing stays a link, not a plan change.",
          "Everything in Pro, plus:",
          "Up to 5 products",
          "Up to 5 agents running in parallel",
          "Priority routing",
        ],
      };
    case "team":
      return {
        tier: "team",
        name: "Business",
        // Founder-ratified spine, 2026-08-02. Business is what appears when a
        // team appears. It is not a lock lifted on the solo user's memory.
        tagline: "Your team stops re-deciding things it already decided.",
        price: "$50/mo",
        // Was "With one author, Pro already does this", which spent the buyer's first
        // sentence disqualifying them. Say who it is FOR and what it changes.
        forWhom:
          "Built for a team where more than one person makes the calls, and nobody wants to make the same one twice.",
        hasCreditDropdown: true,
        hasBillingToggle: true,
        highlights: [
          "Two seats and up. Everyone reads and writes the same record, so a decision made once is never re-made.",
          "Everything in Pro, plus:",
          "One decision record every member writes into and reads from",
          "Members, seats, and role-based access",
          "Per-role approval lanes for agent actions and write-back",
          "Write-back connectors",
          "One connector pool for the whole team (one GitHub OAuth covers everyone)",
          "One credit pool the whole team draws from",
          "Per-member credit limits and spend caps",
          "Up to 8 agents running in parallel",
          "Unlimited products and workspaces",
          "Shared playbook library",
          "Evidence covering every member's runs, not only your own",
          "Centralized billing and usage view",
          "Onboarding session with our team",
          "Chat support, same-business-day SLA",
        ],
      };
    case "enterprise":
      return {
        tier: "enterprise",
        name: "Enterprise",
        price: "Platform fee",
        // Founder-ratified spine, 2026-08-02. True of the RECORD today: it is
        // membership scoped, so a successor inherits it. The governance
        // machinery around it is not built and is marked planned below.
        tagline: "When someone leaves, you can prove what they knew and why they chose it.",
        forWhom:
          "Built for large orgs that need flexibility, scale, and governance across product.",
        hasCreditDropdown: false,
        hasBillingToggle: false,
        highlights: [
          "Everything in Business, plus:",
          "Platform fee based on company size",
          "Committed annual credit envelope, unlimited seats",
          // byokAllowed is enterprise-only in entitlementsFor. This is the one
          // capability line here the code genuinely gates.
          "Bring your own model keys, the only tier that can",
          "A negotiated credit model instead of the standard bands",
          "Custom connectors and connector development",
          // NOT BUILT. There is no SAML path (src/routes/login.tsx says so in
          // as many words), no SCIM, no retention policy, no legal hold, no
          // audit export and no departure workflow. Both plan surfaces render
          // any line starting "Planned," as a note, without the included mark.
          "Planned, not yet shipped: SSO, SCIM, audit export, data residency, retention policy, legal hold, and the departure handover",
          "Dedicated support with a signed SLA",
          "Security review, DPA, and procurement help",
          "Dedicated CSM and quarterly business reviews",
          "Volume pricing on committed credits",
          "24/7 incident response with named contacts",
        ],
      };
    case "free":
    default:
      return {
        tier: "free",
        name: "Free",
        price: "$0",
        tagline:
          "The full product loop, free. It guides for 30 days. Upgrade when your work outgrows it.",
        forWhom: "Get started with Supaprod. No card, no commitment. One seat.",
        hasCreditDropdown: false,
        hasBillingToggle: false,
        highlights: [
          "The full daily loop and rituals",
          // Matches FREE_MONTHLY_CREDITS, which is what credits.functions.ts
          // actually grants. This line read "50" and was simply wrong.
          FREE_MONTHLY_CREDITS + " monthly credits",
          // G18 canon edit (pricing-strategy.md §3.1, 2026-07-10): the Critic
          // teardown IS the wedge and lives in Free, capped by the allowance.
          // Pro's line stays the depth claim (Critic on EVERY spec and bet).
          "Critic teardown of your bets, within your credits",
          // Founder ruling 2026-08-04: Free connects. A prospect cannot judge the
          // loop on data that is not theirs. Rendered as chips by the pricing page
          // and the PlanPicker, both of which key off the "Read connectors" prefix.
          "Read connectors, up to 3 sources",
          "Share any decision by link. The reader needs no account and no seat.",
          "Past calls guide the next for " + FREE_MEMORY_RETENTION_DAYS + " days, then fade",
          // RPT-14: the fade above is the AI's own recall cache, never the
          // decision record itself - decisions have no expiry in the schema
          // and the export never reads the fading table, so this is a real
          // guarantee, not marketing. Verified against src/routes/api/public/
          // hooks/memory-tick.ts (the only expiry cron, agent_memory only).
          "Your decision record: exportable forever, never fades",
          "2 products, 1 workspace",
          "Community support",
        ],
      };
  }
}
