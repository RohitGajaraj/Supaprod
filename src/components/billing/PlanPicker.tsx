/**
 * PlanTable: in-product Settings > Billing plan picker.
 * Personal | Teams tab toggle. 2-column grid per tab.
 * Personal: Free + Pro. Teams: Business + Enterprise.
 * Driven by entitlements + billing-tier; no DB catalog dependency.
 *
 * OBS-13 - re-skinned to Obsidian v3 (chrome-only): tokens, Newsreader card
 * titles, JetBrains-mono prices/metadata, glacier as the recommended/current
 * signal (ember stays reserved for a genuinely-required action, and this
 * comparison table never has one), zero lucide, zero pictorial connector
 * logos (mono text chips instead). Data/logic unchanged.
 */
import { useState } from "react";
import { MonoLabel, Button, rgba } from "@/components/obsidian";
import { StripeEmbeddedCheckout } from "@/components/billing/StripeEmbeddedCheckout";
import { toast } from "@/lib/notify";
import { getStripeEnvironment, paymentsConfigured } from "@/lib/stripe";
import { priceForCredits, lookupKeyFor } from "@/lib/billing-tier";
import {
  planPresentation,
  CREDIT_DROPDOWN_TIERS,
  type PlanTier,
  type CreditTier,
} from "@/lib/entitlements";
import { useConfirm } from "@/hooks/use-confirm";

// Connector scope chips - plain mono text, no brand logos (iconography law:
// no icon set, no pictorial elements beyond the butterfly mark).
const CONNECTOR_LABELS = ["GitHub", "Linear", "Notion", "Jira", "Google Docs"] as const;

function ConnectorChipsMini({ showWrite = false }: { showWrite?: boolean }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-1)",
        marginTop: "var(--space-1)",
        marginBottom: 3,
        marginLeft: 12,
        flexWrap: "wrap",
      }}
    >
      {CONNECTOR_LABELS.map((label) => (
        <span
          key={label}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "var(--text-mono-micro)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-subtle)",
            background: "var(--raised)",
            borderRadius: "var(--radius-control)",
            padding: "2px 6px",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      ))}
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-micro)",
          color: "var(--text-faint)",
        }}
      >
        + more
      </span>
      <MonoLabel tone={showWrite ? "glacier" : "muted"}>
        {showWrite ? "read + write" : "read"}
      </MonoLabel>
    </div>
  );
}

// Tier monogram — a mono letter on a raised tile, replacing the retired
// lucide icon set (iconography law: no icon set, only mono glyphs/unicode).
const TIER_LETTER: Record<PlanTier, string> = {
  free: "F",
  pro: "P",
  max: "M",
  team: "B",
  enterprise: "E",
};

function makeTierGlyph(tier: PlanTier): React.ComponentType<{ size?: number }> {
  function TierGlyph({ size = 20 }: { size?: number }) {
    return (
      <span
        aria-hidden="true"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          borderRadius: "var(--radius-control)",
          background: "var(--raised)",
          color: "var(--text-subtle)",
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-mono-label)",
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        {TIER_LETTER[tier]}
      </span>
    );
  }
  return TierGlyph;
}

export const TIER_ICON: Record<PlanTier, React.ComponentType<{ size?: number }>> = {
  free: makeTierGlyph("free"),
  pro: makeTierGlyph("pro"),
  max: makeTierGlyph("max"),
  team: makeTierGlyph("team"),
  enterprise: makeTierGlyph("enterprise"),
};

/** Backwards-compat alias so existing imports keep working. */
export const PlanPicker = PlanTable;

type AudienceTab = "personal" | "teams";

/** The single next tier up — the one that gets the "Recommended" badge. */
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

const PILL_TOGGLE_TRACK: React.CSSProperties = {
  display: "inline-flex",
  borderRadius: "var(--radius-pill)",
  padding: 3,
  background: "var(--raised)",
};

function pillButtonStyle(active: boolean): React.CSSProperties {
  return {
    padding: "6px 16px",
    borderRadius: "var(--radius-pill)",
    border: "none",
    cursor: "pointer",
    fontFamily: "var(--font-ui)",
    fontSize: "var(--text-sm)",
    fontWeight: active ? 600 : 500,
    background: active ? "var(--hover)" : "transparent",
    color: active ? "var(--text-primary)" : "var(--text-subtle)",
    transitionProperty: "background-color, color",
    transitionDuration: "var(--dur-control)",
    transitionTimingFunction: "var(--ease)",
  };
}

const FOCUS_RING_CLASS =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]";

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
  // Global billing toggle — one switch updates all plan prices at once.
  const [annual, setAnnual] = useState(false);

  // The tier that earns the "Recommended" badge — always the single next step up.
  const recommended = nextTierFor(currentTier);

  return (
    <div style={{ display: "grid", gap: "var(--space-5, 20px)" }}>
      {/* Row: Personal | Teams tab on left, Monthly | Annual toggle on right */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-2)",
        }}
      >
        {/* Audience tab */}
        <div style={PILL_TOGGLE_TRACK}>
          {(["personal", "teams"] as const).map((t) => {
            const active = t === tab;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={FOCUS_RING_CLASS}
                style={pillButtonStyle(active)}
              >
                {t === "personal" ? "Personal" : "Teams"}
              </button>
            );
          })}
        </div>

        {/* Global billing toggle */}
        <div style={PILL_TOGGLE_TRACK}>
          {(["monthly", "annual"] as const).map((mode) => {
            const active = mode === (annual ? "annual" : "monthly");
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setAnnual(mode === "annual")}
                className={FOCUS_RING_CLASS}
                style={{
                  ...pillButtonStyle(active),
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-1)",
                }}
              >
                {mode === "monthly" ? "Monthly" : "Annual"}
                {mode === "annual" && (
                  <MonoLabel
                    tone="moss"
                    style={{
                      background: rgba("#7FBF8E", 0.14),
                      borderRadius: "var(--radius-pill)",
                      padding: "1px 6px",
                    }}
                  >
                    -17%
                  </MonoLabel>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2-column grid per tab — recommended badge tracks the user's actual next step */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
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
    </div>
  );
}

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
        background: "var(--card)",
        // Depth is tint, never a shadow: the recommended card gets a glacier
        // hairline (the machine's own recommendation), the current card gets
        // a slightly stronger neutral hairline. Never ember — nothing on
        // this comparison table is a genuinely-required action.
        border: popular
          ? "1px solid var(--glacier)"
          : isCurrent
            ? "1px solid var(--hairline-strong)"
            : "1px solid var(--hairline)",
        borderRadius: "var(--radius-card)",
        padding: "var(--space-5, 22px) var(--space-4) var(--space-4)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--space-3)",
        position: "relative",
        // v4 §2: cards catch the ambient light from above.
        boxShadow: "var(--top-light)",
      }}
    >
      {popular ? (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "var(--glacier)",
            borderTopLeftRadius: "inherit",
            borderTopRightRadius: "inherit",
          }}
        />
      ) : null}
      {children}
    </div>
  );
}

function CardHeader({
  tier,
  name,
  tagline,
  forWhom,
  isCurrent,
  popular,
}: {
  tier: PlanTier;
  name: string;
  tagline: string;
  forWhom: string;
  isCurrent: boolean;
  popular?: boolean;
}) {
  const Icon = TIER_ICON[tier];
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-2)",
        }}
      >
        <Icon size={28} />
        {isCurrent ? (
          <MonoLabel
            tone="glacier"
            style={{
              background: rgba("#84b3ec", 0.12),
              border: "1px solid var(--glacier)",
              borderRadius: "var(--radius-pill)",
              padding: "3px 9px",
              whiteSpace: "nowrap",
            }}
          >
            Current plan
          </MonoLabel>
        ) : popular ? (
          <MonoLabel
            tone="glacier"
            style={{
              border: "1px solid var(--glacier)",
              borderRadius: "var(--radius-pill)",
              padding: "2px 8px",
            }}
          >
            Popular
          </MonoLabel>
        ) : null}
      </div>
      <div
        style={{
          fontFamily: "var(--font-serif)",
          fontWeight: 460,
          fontSize: "var(--text-card-title)",
          lineHeight: 1.3,
          color: "var(--text-primary)",
          marginTop: "var(--space-2)",
        }}
      >
        {name}
      </div>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-helper)",
          color: "var(--text-subtle)",
          margin: "3px 0 0",
          lineHeight: "var(--leading-body)",
        }}
      >
        {forWhom}
      </p>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-sm)",
          color: "var(--text-body)",
          margin: "var(--space-1) 0 0",
          lineHeight: "var(--leading-body)",
        }}
      >
        {tagline}
      </p>
    </div>
  );
}

function ExpandableBullets({ items }: { items: string[] }) {
  const [expanded, setExpanded] = useState(false);
  const PREVIEW = 5;
  const visible = expanded ? items : items.slice(0, PREVIEW);
  const hiddenCount = items.length - PREVIEW;
  return (
    <div>
      <ul
        style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "var(--space-2)" }}
      >
        {visible.map((h) => {
          const isReadConnector = h.startsWith("Read connectors");
          const isWriteConnector = h.startsWith("Write-back connectors");
          return (
            <li
              key={h}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-helper)",
                color: "var(--text-body)",
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              <div style={{ display: "flex", gap: "var(--space-2)" }}>
                <span
                  aria-hidden="true"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color: "var(--text-faint)",
                    lineHeight: "var(--leading-body)",
                  }}
                >
                  &middot;
                </span>
                <span>{h}</span>
              </div>
              {(isReadConnector || isWriteConnector) && (
                <ConnectorChipsMini showWrite={isWriteConnector} />
              )}
            </li>
          );
        })}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className={FOCUS_RING_CLASS}
          style={{
            background: "none",
            border: "none",
            padding: "var(--space-2) 0 0",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-helper)",
            color: "var(--glacier)",
            cursor: "pointer",
          }}
        >
          {expanded ? "Show less" : `Show ${hiddenCount} more`}
        </button>
      )}
    </div>
  );
}

function FreeCard({ isCurrent }: { isCurrent: boolean }) {
  const p = planPresentation("free");
  return (
    <CardShell isCurrent={isCurrent} popular={false}>
      <CardHeader
        tier="free"
        name={p.name}
        tagline={p.tagline}
        forWhom={p.forWhom}
        isCurrent={isCurrent}
      />
      <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-1)" }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 30,
            lineHeight: 1,
            color: "var(--text-primary)",
          }}
        >
          $0
        </span>
        <span
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-sm)",
            color: "var(--text-subtle)",
          }}
        >
          /month
        </span>
      </div>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-helper)",
          color: "var(--text-subtle)",
          margin: 0,
        }}
      >
        No credit card needed
      </p>
      <Button variant="secondary" disabled style={{ width: "100%", justifyContent: "center" }}>
        {isCurrent ? "You are on Free" : "Start on Free"}
      </Button>
      <div style={{ height: 1, background: "var(--hairline)" }} />
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
        tier="enterprise"
        name={p.name}
        tagline={p.tagline}
        forWhom={p.forWhom}
        isCurrent={isCurrent}
        popular={popular}
      />
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 20,
            lineHeight: 1.2,
            color: "var(--text-primary)",
          }}
        >
          Custom
        </span>
        {isComingFromBusiness ? (
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--text-body)",
            }}
          >
            Custom platform fee + $20/seat + usage at API rates
          </span>
        ) : (
          <>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-sm)",
                color: "var(--text-body)",
              }}
            >
              Platform fee + $20/seat
            </span>
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-helper)",
                color: "var(--text-subtle)",
              }}
            >
              Usage at API rates &middot; scales with model and task
            </span>
          </>
        )}
      </div>
      {isCurrent ? (
        <>
          <p
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-helper)",
              color: "var(--text-subtle)",
              margin: 0,
              textAlign: "center",
            }}
          >
            Reach your account manager to adjust seats or API rates.
          </p>
          <a
            href="mailto:sales@cadence.app?subject=Enterprise plan management"
            className={`${FOCUS_RING_CLASS} hover:[background-color:#242429]`}
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-base)",
              fontWeight: 500,
              color: "var(--text-primary)",
              background: "var(--hover)",
              border: "1px solid var(--hairline-strong)",
              borderRadius: "var(--radius-control)",
              padding: "8px 16px",
              textAlign: "center",
              display: "block",
              textDecoration: "none",
            }}
          >
            Contact account manager
          </a>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <a
              href="mailto:sales@cadence.app?subject=Enterprise plan management"
              className={FOCUS_RING_CLASS}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "var(--text-helper)",
                color: "var(--blossom)",
                textDecoration: "underline",
              }}
            >
              Manage subscription
            </a>
          </div>
        </>
      ) : (
        <a
          href="mailto:sales@cadence.app?subject=Enterprise enquiry"
          className={`${FOCUS_RING_CLASS} hover:[background-color:#242429]`}
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-base)",
            fontWeight: 500,
            color: "var(--text-primary)",
            background: "var(--hover)",
            border: "1px solid var(--hairline-strong)",
            borderRadius: "var(--radius-control)",
            padding: "8px 16px",
            textAlign: "center",
            display: "block",
            textDecoration: "none",
          }}
        >
          Talk to our team
        </a>
      )}
      <div style={{ height: 1, background: "var(--hairline)" }} />
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
  const [credits, setCredits] = useState<CreditTier>(100);
  const [open, setOpen] = useState(false);
  const confirm = useConfirm();

  const billing: "monthly" | "yearly" = annual ? "yearly" : "monthly";
  const price = priceForCredits(tier, credits, billing);
  const monthlyPrice = priceForCredits(tier, credits, "monthly");
  // Exact savings: annual = 10 months → 2 months free per year.
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

  return (
    <CardShell isCurrent={isCurrent} popular={popular && !isCurrent}>
      <CardHeader
        tier={tier}
        name={p.name}
        tagline={p.tagline}
        forWhom={p.forWhom}
        isCurrent={isCurrent}
        popular={popular && !isCurrent}
      />

      {/* Price — billing label — dollar savings (when annual) */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-1)" }}>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 26,
              lineHeight: 1,
              color: "var(--text-primary)",
            }}
          >
            ${price ?? "--"}
          </span>
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-sm)",
              color: "var(--text-subtle)",
            }}
          >
            /mo
          </span>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-2)",
            marginTop: "var(--space-1)",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-ui)",
              fontSize: "var(--text-helper)",
              color: "var(--text-subtle)",
            }}
          >
            {billing === "yearly" ? "billed annually" : "billed monthly"}
          </span>
          {yearlySavings && (
            <MonoLabel
              tone="moss"
              style={{
                background: rgba("#7FBF8E", 0.14),
                borderRadius: "var(--radius-pill)",
                padding: "2px 7px",
              }}
            >
              Save ${yearlySavings}/yr
            </MonoLabel>
          )}
        </div>
      </div>

      {/* Credit dropdown — per card so users can compare different tiers across plans */}
      <label style={{ display: "grid", gap: "var(--space-1)" }}>
        <MonoLabel>Credits / month</MonoLabel>
        <select
          value={credits}
          onChange={(e) => setCredits(Number(e.target.value) as CreditTier)}
          className={FOCUS_RING_CLASS}
          style={{
            padding: "7px 10px",
            borderRadius: "var(--radius-control)",
            border: "1px solid var(--hairline-strong)",
            background: "var(--raised)",
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-base)",
            color: "var(--text-primary)",
            cursor: "pointer",
          }}
        >
          {CREDIT_DROPDOWN_TIERS.map((c) => (
            <option key={c} value={c}>
              {c.toLocaleString()} credits / month
            </option>
          ))}
        </select>
      </label>

      {/* CTA — immediately after price + credit selection, before features.
          Never ember: nothing in this comparison table is a genuinely-
          required action right now, so every card reads at the same
          secondary weight; the copy (Upgrade / Move / Current plan)
          carries the meaning, not the color.
          Honesty law (v4 §9b): while payments are dormant there is no
          upgrade button at all — the table stays a real comparison, and one
          quiet line says when checkout opens. */}
      {paymentsConfigured() || isCurrent ? (
        <Button
          variant="secondary"
          disabled={!canSelect || !lookupKey || isCurrent}
          onClick={onSubscribe}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {ctaLabel}
        </Button>
      ) : (
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-helper)",
            color: "var(--text-subtle)",
            margin: 0,
            textAlign: "center",
            lineHeight: "var(--leading-body)",
          }}
        >
          Checkout opens when payments go live. Prices shown are final.
        </p>
      )}

      {statusMessage && (
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "var(--text-helper)",
            color: "var(--text-subtle)",
            margin: 0,
            textAlign: "center",
            lineHeight: "var(--leading-body)",
          }}
        >
          {statusMessage}
        </p>
      )}

      {/* Feature list below CTA */}
      <div style={{ height: 1, background: "var(--hairline)" }} />
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
