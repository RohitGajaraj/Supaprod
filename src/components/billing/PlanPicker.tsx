/**
 * PlanTable: the in-product Settings > Plan comparison.
 * Personal | Teams tab toggle. 2-column grid per tab.
 * Personal: Free + Pro. Teams: Business + Enterprise.
 * Driven by entitlements + billing-tier; no DB catalog dependency.
 *
 * Ported to the rebuild primitives 2026-07-29. It renders inside the route's
 * `Block title="What else you could be on"`, so it draws no heading of its own.
 *
 * A price ladder is the one shape on this surface that is genuinely SCANNED
 * ACROSS rather than read down, so it stays a grid of cards. They are built the
 * way the route's own credit-bundle grid is built: a raised fill, no border, and
 * an inset ring for the one that is yours. That keeps the whole region at one
 * bordered layer.
 *
 * Removed with the old system, each for a stated reason:
 *   the 2px bar across the top of the recommended card. A coloured strip on one
 *     edge of a card is the single most recognisable tell of generated UI (hard
 *     ban 4); the word "Popular" already says it.
 *   the mono letter tiles (F / P / B / E) beside each plan name. An icon
 *     container in front of the message it introduces is hard ban 8, and a
 *     letter in a box says nothing the plan name does not.
 *   the moss-tinted savings pill and the pink "Manage subscription" link.
 *     Colour carries outcomes and gates; a discount is neither, so it is stated
 *     in words at the same weight as everything else.
 *   the `TIER_ICON` and `PlanPicker` exports. Both were dead: nothing in src/
 *     imported either.
 *
 * Nothing here wears ember. This table never contains a genuinely-required
 * action, and ember marks the human.
 */
import { useState } from "react";
import { StripeEmbeddedCheckout } from "@/components/billing/StripeEmbeddedCheckout";
import { Action, Num } from "@/components/meridian/surface-parts";
import { toast } from "@/lib/notify";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";
import { priceForCredits, lookupKeyFor } from "@/lib/billing-tier";
import {
  planPresentation,
  CREDIT_DROPDOWN_TIERS,
  type PlanTier,
  includedCreditsFor,
} from "@/lib/entitlements";
import { useConfirm } from "@/hooks/use-confirm";

type AudienceTab = "personal" | "teams";

/** Which connectors a plan's connector bullet is actually talking about. Plain
 *  text, no brand logos: a row of vendor marks is decoration, and the bullet it
 *  hangs under already carries the claim. */
const CONNECTOR_LABELS = ["GitHub", "Linear", "Notion", "Jira", "Google Docs"] as const;

const META: React.CSSProperties = {
  fontSize: "var(--sp-text-label)",
  color: "var(--sp-mute)",
  lineHeight: "var(--sp-leading-tight)",
};

const BODY: React.CSSProperties = {
  fontSize: "var(--sp-text-meta)",
  color: "var(--sp-body)",
  lineHeight: "var(--sp-leading-body)",
};

function ConnectorList({ showWrite = false }: { showWrite?: boolean }) {
  return (
    <div style={{ ...META, marginTop: 3 }}>
      {CONNECTOR_LABELS.join(", ")} and more · {showWrite ? "read and write" : "read only"}
    </div>
  );
}

/** The single next tier up. The one that gets the "Popular" label. */
function nextTierFor(tier: PlanTier): PlanTier | null {
  switch (tier) {
    case "free":
      return "pro";
    case "pro":
      return "team";
    case "max":
      return "team";
    case "team":
      return "enterprise";
    case "enterprise":
      return null;
  }
}

/** The system's filter tabs, doing what the pill toggles used to do. */
function Toggle<T extends string>({
  label,
  options,
  value,
  onChange,
  labelOf,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  labelOf: (v: T) => React.ReactNode;
}) {
  return (
    <div className="sp-tabs" role="tablist" aria-label={label} style={{ marginTop: 0 }}>
      {options.map((o) => (
        <button
          key={o}
          type="button"
          role="tab"
          className="sp-tab"
          aria-selected={value === o}
          onClick={() => onChange(o)}
        >
          {labelOf(o)}
        </button>
      ))}
    </div>
  );
}

export function PlanTable({
  currentTier,
  canSelect,
}: {
  currentTier: PlanTier;
  canSelect: boolean;
}) {
  const defaultTab: AudienceTab =
    currentTier === "team" || currentTier === "enterprise" ? "teams" : "personal";
  const [tab, setTab] = useState<AudienceTab>(defaultTab);
  // One switch updates every price on the table at once.
  const [annual, setAnnual] = useState(false);

  const recommended = nextTierFor(currentTier);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--sp-space-3)",
        }}
      >
        <Toggle
          label="Who the plan is for"
          options={["personal", "teams"] as const}
          value={tab}
          onChange={setTab}
          labelOf={(t) => (t === "personal" ? "Personal" : "Teams")}
        />
        <Toggle
          label="How often you are billed"
          options={["monthly", "annual"] as const}
          value={annual ? "annual" : "monthly"}
          onChange={(m) => setAnnual(m === "annual")}
          labelOf={(m) => (m === "monthly" ? "Monthly" : "Annual, two months free")}
        />
      </div>

      {/* What the Personal/Teams split actually means. Founder ruling
          2026-08-02: Teams is a capability that appears when a team appears,
          never a checkbox unlocked on the solo user's memory. Said here, once,
          at metadata weight, so the tab does not read as a paywall. */}
      <p style={{ ...META, margin: "var(--sp-space-3) 0 0" }}>
        {tab === "personal"
          ? "One seat. You are the only author, so nothing in your record is held back for a higher plan, and you can hand any decision to a colleague with a link."
          : "Two seats minimum. Business is what appears once a second person starts writing decisions too. It is not a lock lifted on what already guides you."}
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
          gap: "var(--sp-space-3)",
          marginTop: "var(--sp-space-4)",
        }}
      >
        {tab === "personal" ? (
          <>
            <FreeCard isCurrent={currentTier === "free"} />
            <PaidTierCard
              tier="pro"
              isCurrent={currentTier === "pro" || currentTier === "max"}
              currentTier={currentTier}
              canSelect={canSelect}
              popular={recommended === "pro"}
              annual={annual}
            />
          </>
        ) : (
          <>
            <PaidTierCard
              tier="team"
              isCurrent={currentTier === "team"}
              currentTier={currentTier}
              canSelect={canSelect}
              popular={recommended === "team"}
              annual={annual}
            />
            <EnterpriseCard
              isCurrent={currentTier === "enterprise"}
              currentTier={currentTier}
              popular={recommended === "enterprise"}
            />
          </>
        )}
      </div>
    </>
  );
}

/** A raised fill, no border, and an inset ring for the card that is either
 *  yours or your next step. Same construction as the credit-bundle grid on the
 *  Credits surface, so the two price ladders in this product read as one. */
function CardShell({
  isCurrent,
  popular,
  children,
}: {
  isCurrent: boolean;
  popular?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--sp-space-3)",
        padding: "var(--sp-space-5) var(--sp-space-4) var(--sp-space-4)",
        borderRadius: "var(--sp-radius-card)",
        background: "var(--sp-lift)",
        boxShadow: popular || isCurrent ? "inset 0 0 0 1px var(--sp-ink)" : undefined,
      }}
    >
      {children}
    </div>
  );
}

function CardHeader({
  name,
  tagline,
  forWhom,
  isCurrent,
  popular,
}: {
  name: string;
  tagline: string;
  forWhom: string;
  isCurrent: boolean;
  popular?: boolean;
}) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: "var(--sp-space-2)",
        }}
      >
        <span
          style={{
            fontSize: "var(--sp-text-body)",
            fontWeight: "var(--sp-weight-strong)",
            color: "var(--sp-ink)",
          }}
        >
          {name}
        </span>
        {isCurrent ? (
          <span style={{ ...META, whiteSpace: "nowrap" }}>Your plan</span>
        ) : popular ? (
          <span style={{ ...META, whiteSpace: "nowrap" }}>Popular</span>
        ) : null}
      </div>
      <p style={{ ...META, margin: "3px 0 0" }}>{forWhom}</p>
      <p style={{ ...BODY, margin: "var(--sp-space-1) 0 0" }}>{tagline}</p>
    </div>
  );
}

/** The price, in mono because it is a number, with what it buys under it. */
function Price({ amount, unit }: { amount: React.ReactNode; unit?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
      <span
        style={{
          fontSize: "var(--sp-text-gate)",
          fontWeight: "var(--sp-weight-strong)",
          color: "var(--sp-ink)",
          lineHeight: 1,
        }}
      >
        {amount}
      </span>
      {unit ? <span style={META}>{unit}</span> : null}
    </div>
  );
}

function ExpandableBullets({ items }: { items: string[] }) {
  // Expanded by default, matching the public pricing page (founder ruling 2026-08-03):
  // hiding most of a plan's capabilities behind "Show N more" while the buyer decides
  // is self-sabotage. The control stays, inverted.
  const [expanded, setExpanded] = useState(true);
  const PREVIEW = 5;
  const visible = expanded ? items : items.slice(0, PREVIEW);
  const hiddenCount = items.length - PREVIEW;
  return (
    <div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 6 }}>
        {visible.map((h) => {
          const isReadConnector = h.startsWith("Read connectors");
          const isWriteConnector = h.startsWith("Write-back connectors");
          // A roadmap line drops to metadata weight so it cannot be read as a
          // shipped capability sitting in the same list as shipped ones.
          const isPlanned = h.startsWith("Planned,");
          return (
            <li key={h} style={isPlanned ? META : BODY}>
              {h}
              {isReadConnector || isWriteConnector ? (
                <ConnectorList showWrite={isWriteConnector} />
              ) : null}
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 ? (
        <button
          type="button"
          className="sp-block-more"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          style={{ marginTop: "var(--sp-space-2)" }}
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more`}
        </button>
      ) : null}
    </div>
  );
}

/** A hairline between the commercial half of a card and the feature half. */
function Divider() {
  return <div style={{ height: 1, background: "var(--sp-line-soft)" }} />;
}

function FreeCard({ isCurrent }: { isCurrent: boolean }) {
  const p = planPresentation("free");
  return (
    <CardShell isCurrent={isCurrent} popular={false}>
      <CardHeader name={p.name} tagline={p.tagline} forWhom={p.forWhom} isCurrent={isCurrent} />
      <Price amount={<Num>$0</Num>} unit="/month" />
      <p style={{ ...META, margin: 0 }}>No credit card needed</p>
      <Action
        disabled
        title={
          isCurrent
            ? "This is your current plan."
            : "Every workspace starts on Free automatically. Pick a paid plan to upgrade."
        }
        style={{ width: "100%", justifyContent: "center" }}
      >
        {isCurrent ? "You are on Free" : "Start on Free"}
      </Action>
      <Divider />
      <ExpandableBullets items={p.highlights} />
    </CardShell>
  );
}

function EnterpriseCard({
  isCurrent,
  currentTier,
  popular,
}: {
  isCurrent: boolean;
  currentTier: PlanTier;
  popular?: boolean;
}) {
  const p = planPresentation("enterprise");
  const isComingFromBusiness = currentTier === "team" && !isCurrent;
  return (
    <CardShell isCurrent={isCurrent} popular={popular}>
      <CardHeader
        name={p.name}
        tagline={p.tagline}
        forWhom={p.forWhom}
        isCurrent={isCurrent}
        popular={popular}
      />
      <Price amount="Custom" />
      {/* This card used to read "platform fee + $20/seat". Nothing in the code
          prices a seat: entitlements gives enterprise `seats: null` and the
          plan copy sells a committed credit envelope, so the per-seat line was
          a number the product cannot charge. Stated the way it is actually
          sold. */}
      {isComingFromBusiness ? (
        <p style={{ ...BODY, margin: 0 }}>
          Custom platform fee plus a committed annual credit envelope
        </p>
      ) : (
        <>
          <p style={{ ...BODY, margin: 0 }}>Platform fee plus a committed annual credit envelope</p>
          <p style={{ ...META, margin: 0 }}>
            Unlimited seats. The credit model is negotiated, not picked from the standard bands.
          </p>
        </>
      )}
      {isCurrent ? (
        <>
          <p style={{ ...META, margin: 0 }}>
            Reach your account manager to adjust seats or API rates.
          </p>
          <Action
            onClick={() => {
              window.location.href = "mailto:sales@supaprod.ai?subject=Enterprise plan management";
            }}
            style={{ width: "100%", justifyContent: "center" }}
          >
            Contact account manager
          </Action>
        </>
      ) : (
        <Action
          onClick={() => {
            window.location.href = "mailto:sales@supaprod.ai?subject=Enterprise enquiry";
          }}
          style={{ width: "100%", justifyContent: "center" }}
        >
          Talk to our team
        </Action>
      )}
      <Divider />
      <ExpandableBullets items={p.highlights} />
    </CardShell>
  );
}

function PaidTierCard({
  tier,
  isCurrent,
  currentTier,
  canSelect,
  popular,
  annual,
}: {
  tier: "pro" | "team";
  isCurrent: boolean;
  currentTier: PlanTier;
  canSelect: boolean;
  popular?: boolean;
  annual?: boolean;
}) {
  const p = planPresentation(tier);
  // Retired with the band picker: price is flat per tier now.
  const credits = 0;
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();

  const billing: "monthly" | "yearly" = annual ? "yearly" : "monthly";
  const price = priceForCredits(tier, credits, billing);
  const monthlyPrice = priceForCredits(tier, credits, "monthly");
  // Exact savings: annual = 10 months, so 2 months free per year.
  const yearlySavings = annual && monthlyPrice ? monthlyPrice * 2 : null;
  const lookupKey = lookupKeyFor(tier, credits, billing);

  const TIER_ORDER: PlanTier[] = ["free", "pro", "max", "team", "enterprise"];
  const cmp = TIER_ORDER.indexOf(tier) - TIER_ORDER.indexOf(currentTier);
  const direction: "upgrade" | "downgrade" | "same" =
    cmp > 0 ? "upgrade" : cmp < 0 ? "downgrade" : "same";

  async function onSubscribe() {
    if (!lookupKey) return;
    try {
      getStripeEnvironment();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Payments not configured yet.");
      return;
    }
    if (direction === "upgrade" && currentTier !== "free") {
      const ok = await confirm({
        title: `Upgrade to ${p.name}?`,
        body: `Stripe prorates the switch automatically. You get credit for unused days on your current plan and are charged for remaining ${p.name} days in the cycle. Your new credit pool starts immediately.`,
        confirmLabel: `Upgrade to ${p.name}`,
        cancelLabel: "Stay on current plan",
      });
      if (!ok) return;
    }
    if (direction === "downgrade") {
      const ok = await confirm({
        title: `Move to ${p.name}?`,
        body: `${p.name} includes fewer monthly credits and capabilities. The change takes effect next billing cycle, and you can move back up anytime.`,
        confirmLabel: `Move to ${p.name}`,
        cancelLabel: "Keep my current plan",
      });
      if (!ok) return;
    }
    setOpen(true);
  }

  const displayName = tier === "team" ? "Business" : "Pro";

  const ctaLabel = (() => {
    if (isCurrent) return "Current plan";
    if (direction === "upgrade") return `Upgrade to ${displayName}`;
    if (direction === "downgrade") return `Move to ${displayName}`;
    return `Get ${displayName}`;
  })();

  const statusMessage = (() => {
    if (isCurrent) {
      if (tier === "pro") return "You are on Pro. Credits refresh monthly.";
      if (tier === "team") return "Your team shares this pool. Credits refresh monthly.";
    }
    if (direction === "upgrade") {
      if (currentTier === "free") return `Start using ${displayName} immediately. No wait.`;
      return "Stripe prorates the switch. Your new credit pool starts right away.";
    }
    return null;
  })();

  const selectId = `plan-credits-${tier}`;

  return (
    <CardShell isCurrent={isCurrent} popular={popular && !isCurrent}>
      <CardHeader
        name={p.name}
        tagline={p.tagline}
        forWhom={p.forWhom}
        isCurrent={isCurrent}
        popular={popular && !isCurrent}
      />

      <div>
        <Price amount={<Num>${price ?? "--"}</Num>} unit="/mo" />
        <div style={{ ...META, marginTop: 4 }}>
          {billing === "yearly" ? "billed annually" : "billed monthly"}
          {yearlySavings ? (
            <>
              {" · saves "}
              <Num>${yearlySavings}</Num>
              {" a year"}
            </>
          ) : null}
        </div>
      </div>

      {/* INCLUDED CREDITS, one number per tier (founder ruling 2026-08-03). Was a
          100-to-10,000 band selector that scaled price linearly, which put Pro's entry
          at 100 credits for $20 against Free's 750 for $0. Capacity is sold by top-ups
          now, so a heavy solo user has a paid path that is not "join a team plan". */}
      <div style={{ marginTop: 0 }}>
        <span className="sp-field-label">Credits a month</span>
        <div style={{ fontSize: 15, fontWeight: 500 }}>
          {includedCreditsFor(tier)?.toLocaleString() ?? "Custom"} included
        </div>
        <div className="sp-hint" style={{ marginTop: 3 }}>
          Need more? Add credits any time, up to twice your monthly allowance. No plan change.
        </div>
      </div>

      {/* Honesty law: while payments are dormant there is NO upgrade button at
          all. The table stays a real comparison, and one quiet line says when
          checkout opens. A disabled buy is still a dead promise. */}
      {paymentsConfigured() || isCurrent ? (
        <Action
          disabled={!canSelect || !lookupKey || isCurrent}
          title={
            isCurrent
              ? "This is your current plan."
              : !canSelect
                ? "Only the workspace owner can change the plan."
                : !lookupKey
                  ? "This credit tier has no published price yet."
                  : undefined
          }
          onClick={onSubscribe}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {ctaLabel}
        </Action>
      ) : (
        <p style={{ ...META, margin: 0 }}>
          Checkout opens when payments go live. Prices shown are final.
        </p>
      )}

      {statusMessage ? <p style={{ ...META, margin: 0 }}>{statusMessage}</p> : null}

      <Divider />
      <ExpandableBullets items={p.highlights} />

      {lookupKey ? (
        <StripeEmbeddedCheckout
          open={open}
          onOpenChange={setOpen}
          priceLookupKey={lookupKey}
          title={`${p.name} · ${credits.toLocaleString()} credits · ${billing}`}
        />
      ) : null}
    </CardShell>
  );
}
