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
 *
 * ── PORTED TO MERIDIAN 2026-08-20 ───────────────────────────────────────
 * Every retired `--sp-*` token and every `.sp-*` class is gone. What moved, and
 * where a figure changed:
 *
 *   THE AUDIENCE ROW IS A REAL TABLIST NOW. It was `.sp-tabs` with
 *       `role="tablist"`, no roving tab stop, no arrow keys and no panel, which
 *       is the half-built tablist `meridian/Tabs` was written to end. `Tabs`
 *       plus `TabPanel` gives the keyboard and points `aria-controls` at a panel
 *       that is actually in the document.
 *   THE BILLING-PERIOD ROW IS NOT A TABLIST AND NO LONGER CLAIMS TO BE. It
 *       switches no panel: it rewrites a price inside cards that stay put. Wired
 *       through `Tabs` it would have had to name a panel id that does not exist,
 *       which is a broken reference rather than a quiet one. `Choices mode="one"`
 *       is the house answer for a mode switch with no panel, and it is what the
 *       spec surface adopted under the same ruling.
 *   TWO SPACING STOPS GREW, because Meridian's ramp is 2/4/6/10/16/24 and has no
 *       8 or 12. Card padding-top 20px to 24px, and every 12px gap to 16px: the
 *       card's own stack, the grid between cards, and the row holding the two
 *       controls. 8px became 10px in the card header and above "Show less".
 *   THE PRICE WENT FROM 19px TO 20px and the card radius from 10px to 12px, both
 *       the nearest Meridian stop upward. Prose leading went 1.55 to 1.625.
 *   TAB TEXT WENT FROM 13px TO 12.5px, which is the one figure that came DOWN.
 *       It is `Tabs`'s own stop, shared with every other tab row in the product,
 *       and matching the system is worth half a pixel.
 *   `sp-hint` WAS DELETED RATHER THAN REPLACED. It resolved in no stylesheet in
 *       the repo, so it painted nothing: the credit line has always rendered at
 *       inherited size. Giving it a Meridian face would be a new design decision
 *       dressed as a port, so the text is left exactly as it renders today.
 */
import { useState } from "react";
import { StripeEmbeddedCheckout } from "@/components/billing/StripeEmbeddedCheckout";
import { Choices } from "@/components/meridian/forms";
import { Action, Num } from "@/components/meridian/surface-parts";
import { TabPanel, Tabs } from "@/components/meridian/Tabs";
import { toast } from "@/lib/notify";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";
import { priceForCredits, lookupKeyFor } from "@/lib/billing-tier";
import { humanWriteError } from "@/lib/roles.functions";
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
  fontSize: "var(--mrd-t-label)",
  color: "var(--mrd-mute)",
  lineHeight: "var(--mrd-lh-snug)",
};

const BODY: React.CSSProperties = {
  fontSize: "var(--mrd-t-base)",
  color: "var(--mrd-body)",
  lineHeight: "var(--mrd-lh-prose)",
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

/** The one tab row on this surface, and the id the panel is derived from. */
const AUDIENCE = "plan-audience";

const AUDIENCE_TABS = [
  { id: "personal", label: "Personal" },
  { id: "teams", label: "Teams" },
] as const satisfies readonly { id: AudienceTab; label: string }[];

type BillingPeriod = "monthly" | "annual";

/** Two named options, one decision, no panel. See the header. */
const BILLING_OPTIONS = [
  { id: "monthly", label: "Monthly" },
  { id: "annual", label: "Annual, two months free" },
] as const satisfies readonly { id: BillingPeriod; label: string }[];

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
          gap: "var(--mrd-s5)",
        }}
      >
        {/* No rule under this row, because the billing control shares its line.
            See the `rule` prop's own note in `meridian/Tabs`. */}
        <Tabs
          group={AUDIENCE}
          label="Who the plan is for"
          tabs={AUDIENCE_TABS}
          active={tab}
          onSelect={setTab}
          rule={false}
        />
        <Choices
          mode="one"
          label="How often you are billed"
          options={BILLING_OPTIONS}
          value={annual ? "annual" : "monthly"}
          onChange={(m) => setAnnual(m === "annual")}
        />
      </div>

      <TabPanel group={AUDIENCE} active={tab}>
        {/* What the Personal/Teams split actually means. Founder ruling
            2026-08-02: Teams is a capability that appears when a team appears,
            never a checkbox unlocked on the solo user's memory. Said here, once,
            at metadata weight, so the tab does not read as a paywall. */}
        <p style={{ ...META, margin: 0 }}>
          {tab === "personal"
            ? "One seat. You are the only author, so nothing in your record is held back for a higher plan, and you can hand any decision to a colleague with a link."
            : "Two seats minimum. Business is what appears once a second person starts writing decisions too. It is not a lock lifted on what already guides you."}
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
            gap: "var(--mrd-s5)",
            marginTop: "var(--mrd-s5)",
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
      </TabPanel>
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
        gap: "var(--mrd-s5)",
        padding: "var(--mrd-s6) var(--mrd-s5) var(--mrd-s5)",
        borderRadius: "var(--mrd-r-card)",
        background: "var(--mrd-lift)",
        boxShadow: popular || isCurrent ? "inset 0 0 0 1px var(--mrd-ink)" : undefined,
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
          gap: "var(--mrd-s4)",
        }}
      >
        <span
          style={{
            fontSize: "var(--mrd-t-prose)",
            fontWeight: "var(--mrd-w-semi)",
            color: "var(--mrd-ink)",
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
      <p style={{ ...BODY, margin: "var(--mrd-s2) 0 0" }}>{tagline}</p>
    </div>
  );
}

/** The price, in mono because it is a number, with what it buys under it. */
function Price({ amount, unit }: { amount: React.ReactNode; unit?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
      <span
        style={{
          fontSize: "var(--mrd-t-h3)",
          fontWeight: "var(--mrd-w-semi)",
          color: "var(--mrd-ink)",
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
        /* MERIDIAN'S `Door` PAINT, WRITTEN OUT RATHER THAN IMPORTED, for the
           same reason `prds/SpecProse.tsx` writes it out: the component takes
           no ARIA. This control is a DISCLOSURE, so it has to carry
           `aria-expanded`, and dropping that would tell a screen reader nothing
           while the visible label changed under a sighted reader's eyes --
           exactly the half `Region`'s `toggled` prop exists to stop being lost.
           The right fix is an `expanded` prop on `Door`, which lives in
           `surface-parts.tsx` and is another item's file.

           `Region`'s own control face is the other candidate and is wrong here:
           that face belongs in a HEADING, and `Region` states in as many words
           that a reveal past a cap gets no prop and belongs to the content. This
           one sits under the list it reveals, where a reader arrives having
           actually hit the limit.

           The size is pinned at 13px rather than inherited, which is the one
           thing `Door` does differently. It matches the bullets it belongs to,
           and it is what the retired class already rendered. It is set INLINE
           rather than with `text-mrd-base`, because `text-mrd-body` in the paint
           above is BOTH a colour and a font size in Meridian -- the colour comes
           from the theme, the size from an `@utility` of the same name -- so two
           `text-*` classes on one element would leave the size decided by
           emission order. An inline declaration cannot lose that race. */
        <button
          type="button"
          data-mrd=""
          className="rounded-mrd-xs text-mrd-prose text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid"
          onClick={() => setExpanded((e) => !e)}
          aria-expanded={expanded}
          style={{
            marginTop: "var(--mrd-s4)",
            fontSize: "var(--mrd-t-base)",
            transitionDuration: "var(--mrd-d-press)",
          }}
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more`}
        </button>
      ) : null}
    </div>
  );
}

/** A hairline between the commercial half of a card and the feature half. */
function Divider() {
  return <div style={{ height: 1, background: "var(--mrd-line-soft)" }} />;
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
      toast.error(humanWriteError(e, "Payments not configured yet."));
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
      {/* NOT MERIDIAN'S `Field`, AND THE REASON IS THE ONE THING `Field`
          REQUIRES. It renders a real `<label htmlFor>` and makes that binding
          mandatory, because fifteen call sites once shipped with no accessible
          name. There is nothing to bind here: the band selector was removed on
          2026-08-03 and the number below is a FACT, not a control. A `<label>`
          pointing at something that cannot be labelled is a false binding, so
          this wears `Field`'s label FACE and stays a caption. It keeps the
          retired class's mute ink rather than taking `Field`'s body ink, because
          the value under it is the thing being read. */}
      <div style={{ marginTop: 0 }}>
        <span
          data-mrd=""
          className="block text-mrd-label font-medium tracking-mrd-label text-mrd-mute"
          style={{ marginBottom: 6 }}
        >
          Credits a month
        </span>
        <div style={{ fontSize: 15, fontWeight: 500 }}>
          {includedCreditsFor(tier)?.toLocaleString() ?? "Custom"} included
        </div>
        {/* `sp-hint` resolved in no stylesheet in this repo, so this line has
            always rendered at inherited size and ink. The class is gone and
            nothing has replaced it: painting it now would be a new decision
            wearing a port's clothes. */}
        <div style={{ marginTop: 3 }}>
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
