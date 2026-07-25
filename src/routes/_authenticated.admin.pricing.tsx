/**
 * Admin pricing editor: edit subscription bundles per tier and top-up bundles.
 * Stripe price IDs are optional fields; if blank, the checkout falls back to
 * the convention-based `lookup_key` (see billing-tier.lookupKeyFor).
 *
 * Chrome-only Obsidian v3 re-skin (2026-07-03): colors/type/spacing/markup
 * only. No query key, mutation, prop shape, or validation branch changed.
 *
 * Loom W2-ADMIN pass (2026-07-04, register D-06): this money surface now has
 * a real loading skeleton and a real error state with retry (a transient
 * error used to be indistinguishable from an empty catalog); saves reject
 * negative or non-numeric prices; a new row's inputs only clear after the
 * upsert confirms success (no more unsaved-row drift after a failed save);
 * every mutation surfaces thrown failures and disables its buttons in flight.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { MonoLabel, Button } from "@/components/obsidian";
import { AdminErrorCard, AdminSkeleton } from "@/components/admin/admin-ui";
import {
  getPricingCatalog,
  adminUpsertBundle,
  adminDeleteBundle,
  adminUpsertTopup,
  adminDeleteTopup,
  type PricingBundle,
  type TopupBundle,
} from "@/lib/pricing.functions";

type BundleInput = {
  id?: string | null;
  tier: string;
  credits: number;
  monthly_cents: number;
  yearly_cents: number;
  stripe_price_id_monthly?: string | null;
  stripe_price_id_yearly?: string | null;
  recommended?: boolean;
  active?: boolean;
  sort_order?: number;
};
type TopupInput = {
  id?: string | null;
  credits: number;
  price_cents: number;
  stripe_price_id?: string | null;
  active?: boolean;
  sort_order?: number;
};

export const Route = createFileRoute("/_authenticated/admin/pricing")({
  component: AdminPricing,
});

// Plain word first, brand name second (the old "Cluster (Pro)" read garbled).
const TIER_LABELS: Record<string, string> = {
  pro: "Pro · Cluster",
  max: "Max · Constellation",
  team: "Team · Galaxy",
};

// Focus ring, per the Tempo contract: 2px ember, offset 2, on every interactive element.
const focusRingClass =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]";

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid var(--hairline-strong)",
    borderRadius: "var(--radius-control)",
    fontFamily: "var(--font-sans)",
    fontSize: 12.5,
    color: "var(--text-primary)",
    background: "var(--raised)",
  };
}

function cardStyle(): React.CSSProperties {
  return {
    background: "var(--card)",
    border: "1px solid var(--hairline)",
    borderRadius: "var(--radius-card)",
    padding: "var(--space-6)",
    display: "grid",
    gap: "var(--space-3)",
  };
}

function sectionTitleStyle(): React.CSSProperties {
  return {
    fontFamily: "var(--font-sans)",
    fontWeight: 460,
    fontSize: "var(--text-card-title)",
    lineHeight: 1.3,
    color: "var(--text-primary)",
  };
}

function AdminPricing() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fGetCatalog = useServerFn(getPricingCatalog);
  const catalog = useQuery({ queryKey: ["pricing-catalog"], queryFn: () => fGetCatalog() });

  const bundlesByTier = useMemo(() => {
    const map: Record<string, PricingBundle[]> = {};
    for (const b of catalog.data?.bundles ?? []) {
      (map[b.tier] ||= []).push(b);
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.credits - b.credits);
    return map;
  }, [catalog.data]);

  // A money surface must never show a failed read as an empty catalog: an
  // admin could "fix" the blank by re-creating bundles (register D-06).
  if (catalog.isLoading) {
    return (
      <div style={{ display: "grid", gap: "var(--space-6)" }}>
        <AdminSkeleton rows={4} height={44} />
      </div>
    );
  }
  if (catalog.isError) {
    return (
      <AdminErrorCard
        what="the pricing catalog"
        message={catalog.error instanceof Error ? catalog.error.message : undefined}
        onRetry={() => catalog.refetch()}
      />
    );
  }

  return (
    <div style={{ display: "grid", gap: "var(--space-6)" }}>
      <p
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: "var(--tempo-text-base)",
          lineHeight: "var(--leading-body)",
          color: "var(--text-body)",
          margin: 0,
          maxWidth: 640,
        }}
      >
        Edits go live immediately and show up in Settings → Plan the next time a member opens it.
        Leave a Stripe price box blank to use the built-in naming pattern instead (for example{" "}
        <code
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 12,
            color: "var(--text-muted)",
          }}
        >
          cluster_1k_monthly
        </code>
        ).
      </p>

      {(["pro", "max", "team"] as const).map((tier) => (
        <TierSection
          key={tier}
          tier={tier}
          rows={bundlesByTier[tier] ?? []}
          onSaved={() => qc.invalidateQueries({ queryKey: ["pricing-catalog"] })}
          confirm={confirm}
        />
      ))}

      <TopupSection
        rows={catalog.data?.topups ?? []}
        onSaved={() => qc.invalidateQueries({ queryKey: ["pricing-catalog"] })}
        confirm={confirm}
      />
    </div>
  );
}

type Confirm = ReturnType<typeof useConfirm>;

function TierSection({
  tier,
  rows,
  onSaved,
  confirm,
}: {
  tier: "pro" | "max" | "team";
  rows: PricingBundle[];
  onSaved: () => void;
  confirm: Confirm;
}) {
  const fUpsert = useServerFn(adminUpsertBundle);
  const fDelete = useServerFn(adminDeleteBundle);

  const upsert = useMutation({
    mutationFn: (input: BundleInput) => fUpsert({ data: input }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Saved.");
      onSaved();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Save failed. Nothing was changed."),
  });

  const del = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Removed.");
      onSaved();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Delete failed. Nothing was changed."),
  });

  // Rows await this so a new row only clears its inputs after the save
  // actually lands (register D-06: unsaved-row drift after a failed upsert).
  const saveBundle = async (input: BundleInput): Promise<boolean> => {
    try {
      const res = await upsert.mutateAsync(input);
      return !("error" in res);
    } catch {
      return false;
    }
  };

  return (
    <div style={cardStyle()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={sectionTitleStyle()}>{TIER_LABELS[tier]}</div>
        <MonoLabel tone="muted">
          {rows.length} bundle{rows.length === 1 ? "" : "s"}
        </MonoLabel>
      </div>

      {/* Wide editor rows scroll inside their own container instead of
          breaking the page at 1024/768 (checklist point 10). */}
      <div style={{ display: "grid", gap: "var(--space-2)", overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 70px 90px",
            gap: "var(--space-2)",
            padding: "0 4px",
            minWidth: 680,
          }}
        >
          <MonoLabel tone="muted">Credits</MonoLabel>
          <MonoLabel tone="muted">Monthly $</MonoLabel>
          <MonoLabel tone="muted">Yearly $</MonoLabel>
          <MonoLabel tone="muted">Stripe price (monthly)</MonoLabel>
          <MonoLabel tone="muted">Stripe price (yearly)</MonoLabel>
          <MonoLabel tone="muted">Active</MonoLabel>
          <span />
        </div>

        {rows.map((r) => (
          <BundleRow
            key={r.id}
            tier={tier}
            row={r}
            busy={upsert.isPending || del.isPending}
            onSave={saveBundle}
            onDelete={(id) => {
              void (async () => {
                const ok = await confirm({
                  title: `Delete ${r.credits.toLocaleString()} credit bundle?`,
                  body: "This bundle stops appearing in the plan picker.",
                  confirmLabel: "Delete",
                  destructive: true,
                });
                if (ok) del.mutate(id);
              })();
            }}
          />
        ))}

        <BundleRow
          tier={tier}
          row={null}
          busy={upsert.isPending || del.isPending}
          onSave={saveBundle}
          onDelete={() => {}}
        />
      </div>
    </div>
  );
}

function BundleRow({
  tier,
  row,
  busy,
  onSave,
  onDelete,
}: {
  tier: "pro" | "max" | "team";
  row: PricingBundle | null;
  busy: boolean;
  onSave: (input: BundleInput) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [credits, setCredits] = useState(row?.credits ?? 0);
  const [monthly, setMonthly] = useState(row ? row.monthly_cents / 100 : 0);
  const [yearly, setYearly] = useState(row ? row.yearly_cents / 100 : 0);
  const [priceM, setPriceM] = useState(row?.stripe_price_id_monthly ?? "");
  const [priceY, setPriceY] = useState(row?.stripe_price_id_yearly ?? "");
  const [active, setActive] = useState(row?.active ?? true);

  async function save() {
    if (!Number.isFinite(credits) || credits < 1) {
      toast.error("Credits must be a number of at least 1.");
      return;
    }
    if (!Number.isFinite(monthly) || monthly < 0 || !Number.isFinite(yearly) || yearly < 0) {
      toast.error("Prices must be zero or more.");
      return;
    }
    const ok = await onSave({
      id: row?.id ?? null,
      tier,
      credits,
      monthly_cents: Math.round(monthly * 100),
      yearly_cents: Math.round(yearly * 100),
      stripe_price_id_monthly: priceM.trim() || null,
      stripe_price_id_yearly: priceY.trim() || null,
      recommended: row?.recommended ?? false,
      active,
      sort_order: row?.sort_order ?? 99,
    });
    if (ok && !row) {
      setCredits(0);
      setMonthly(0);
      setYearly(0);
      setPriceM("");
      setPriceY("");
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 70px 90px",
        gap: "var(--space-2)",
        padding: "8px 4px",
        borderBottom: "1px solid var(--hairline)",
        alignItems: "center",
        minWidth: 680,
      }}
    >
      <input
        className={focusRingClass}
        style={inputStyle()}
        type="number"
        value={credits}
        onChange={(e) => setCredits(Number(e.target.value))}
        aria-label="Credits in this bundle"
      />
      <input
        className={focusRingClass}
        style={inputStyle()}
        type="number"
        step="0.01"
        value={monthly}
        onChange={(e) => setMonthly(Number(e.target.value))}
        aria-label="Monthly price in dollars"
      />
      <input
        className={focusRingClass}
        style={inputStyle()}
        type="number"
        step="0.01"
        value={yearly}
        onChange={(e) => setYearly(Number(e.target.value))}
        aria-label="Yearly price in dollars"
      />
      <input
        className={focusRingClass}
        style={inputStyle()}
        value={priceM}
        onChange={(e) => setPriceM(e.target.value)}
        placeholder="price_..."
        aria-label="Stripe price id, monthly"
      />
      <input
        className={focusRingClass}
        style={inputStyle()}
        value={priceY}
        onChange={(e) => setPriceY(e.target.value)}
        placeholder="price_..."
        aria-label="Stripe price id, yearly"
      />
      <input
        className={focusRingClass}
        type="checkbox"
        checked={active}
        onChange={(e) => setActive(e.target.checked)}
        aria-label="Bundle is active"
        style={{ width: 14, height: 14, accentColor: "var(--text-primary)", cursor: "pointer" }}
      />
      <div style={{ display: "flex", gap: "var(--space-1)" }}>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => void save()}
          style={{ fontSize: 11.5, padding: "6px 10px" }}
        >
          {row ? "Save" : "Add"}
        </Button>
        {row ? (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => onDelete(row.id)}
            style={{ fontSize: 11.5, padding: "6px 10px", color: "var(--text-subtle)" }}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function TopupSection({
  rows,
  onSaved,
  confirm,
}: {
  rows: TopupBundle[];
  onSaved: () => void;
  confirm: Confirm;
}) {
  const fUpsert = useServerFn(adminUpsertTopup);
  const fDelete = useServerFn(adminDeleteTopup);

  const upsert = useMutation({
    mutationFn: (input: TopupInput) => fUpsert({ data: input }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Saved.");
      onSaved();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Save failed. Nothing was changed."),
  });
  const del = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onSuccess: (res) => {
      if ("error" in res) {
        toast.error(res.error);
        return;
      }
      toast.success("Removed.");
      onSaved();
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Delete failed. Nothing was changed."),
  });

  const saveTopup = async (input: TopupInput): Promise<boolean> => {
    try {
      const res = await upsert.mutateAsync(input);
      return !("error" in res);
    } catch {
      return false;
    }
  };

  return (
    <div style={cardStyle()}>
      <div style={sectionTitleStyle()}>Top-up bundles</div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 2fr 70px 90px",
          gap: "var(--space-2)",
          padding: "0 4px",
        }}
      >
        <MonoLabel tone="muted">Credits</MonoLabel>
        <MonoLabel tone="muted">Price $</MonoLabel>
        <MonoLabel tone="muted">Stripe price id</MonoLabel>
        <MonoLabel tone="muted">Active</MonoLabel>
        <span />
      </div>
      {rows.map((r) => (
        <TopupRow
          key={r.id}
          row={r}
          busy={upsert.isPending || del.isPending}
          onSave={saveTopup}
          onDelete={(id) => {
            void (async () => {
              const ok = await confirm({
                title: `Delete ${r.credits.toLocaleString()} top-up?`,
                confirmLabel: "Delete",
                destructive: true,
              });
              if (ok) del.mutate(id);
            })();
          }}
        />
      ))}
      <TopupRow
        row={null}
        busy={upsert.isPending || del.isPending}
        onSave={saveTopup}
        onDelete={() => {}}
      />
    </div>
  );
}

function TopupRow({
  row,
  busy,
  onSave,
  onDelete,
}: {
  row: TopupBundle | null;
  busy: boolean;
  onSave: (input: TopupInput) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [credits, setCredits] = useState(row?.credits ?? 0);
  const [price, setPrice] = useState(row ? row.price_cents / 100 : 0);
  const [stripeId, setStripeId] = useState(row?.stripe_price_id ?? "");
  const [active, setActive] = useState(row?.active ?? true);

  async function save() {
    if (!Number.isFinite(credits) || credits < 1) {
      toast.error("Credits must be a number of at least 1.");
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      toast.error("Prices must be zero or more.");
      return;
    }
    const ok = await onSave({
      id: row?.id ?? null,
      credits,
      price_cents: Math.round(price * 100),
      stripe_price_id: stripeId.trim() || null,
      active,
      sort_order: row?.sort_order ?? 99,
    });
    if (ok && !row) {
      setCredits(0);
      setPrice(0);
      setStripeId("");
    }
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 2fr 70px 90px",
        gap: "var(--space-2)",
        padding: "8px 4px",
        borderBottom: "1px solid var(--hairline)",
        alignItems: "center",
      }}
    >
      <input
        className={focusRingClass}
        style={inputStyle()}
        type="number"
        value={credits}
        onChange={(e) => setCredits(Number(e.target.value))}
        aria-label="Credits in this top-up"
      />
      <input
        className={focusRingClass}
        style={inputStyle()}
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
        aria-label="Price in dollars"
      />
      <input
        className={focusRingClass}
        style={inputStyle()}
        value={stripeId}
        onChange={(e) => setStripeId(e.target.value)}
        placeholder="price_..."
        aria-label="Stripe price id"
      />
      <input
        className={focusRingClass}
        type="checkbox"
        checked={active}
        onChange={(e) => setActive(e.target.checked)}
        aria-label="Top-up is active"
        style={{ width: 14, height: 14, accentColor: "var(--text-primary)", cursor: "pointer" }}
      />
      <div style={{ display: "flex", gap: "var(--space-1)" }}>
        <Button
          variant="secondary"
          disabled={busy}
          onClick={() => void save()}
          style={{ fontSize: 11.5, padding: "6px 10px" }}
        >
          {row ? "Save" : "Add"}
        </Button>
        {row ? (
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => onDelete(row.id)}
            style={{ fontSize: 11.5, padding: "6px 10px", color: "var(--text-subtle)" }}
          >
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}
