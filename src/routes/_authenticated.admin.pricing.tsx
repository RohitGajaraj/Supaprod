/**
 * Admin pricing editor: edit subscription bundles per tier and top-up bundles.
 * Stripe price IDs are optional fields; if blank, the checkout falls back to
 * the convention-based `lookup_key` (see billing-tier.lookupKeyFor).
 *
 * Chrome-only Obsidian v3 re-skin (2026-07-03): colors/type/spacing/markup
 * only. No query key, mutation, prop shape, or validation branch changed.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { MonoLabel, Button } from "@/components/obsidian";
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

const TIER_LABELS: Record<string, string> = {
  pro: "Cluster (Pro)",
  max: "Constellation (Max)",
  team: "Galaxy (Team)",
};

// Focus ring, per the contract: 2px glacier, offset 2, on every interactive element.
const focusRingClass =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--glacier)]";

function inputStyle(): React.CSSProperties {
  return {
    width: "100%",
    padding: "8px 10px",
    border: "1px solid var(--hairline-strong)",
    borderRadius: "var(--radius-control)",
    fontFamily: "var(--font-ui)",
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
    fontFamily: "var(--font-serif)",
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

  return (
    <div style={{ display: "grid", gap: "var(--space-6)" }}>
      <p
        style={{
          fontFamily: "var(--font-ui)",
          fontSize: "var(--text-base)",
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
  });

  return (
    <div style={cardStyle()}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={sectionTitleStyle()}>{TIER_LABELS[tier]}</div>
        <MonoLabel tone="faint">
          {rows.length} bundle{rows.length === 1 ? "" : "s"}
        </MonoLabel>
      </div>

      <div style={{ display: "grid", gap: "var(--space-2)" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 70px 90px",
            gap: "var(--space-2)",
            padding: "0 4px",
          }}
        >
          <MonoLabel tone="faint">Credits</MonoLabel>
          <MonoLabel tone="faint">Monthly $</MonoLabel>
          <MonoLabel tone="faint">Yearly $</MonoLabel>
          <MonoLabel tone="faint">Stripe price (monthly)</MonoLabel>
          <MonoLabel tone="faint">Stripe price (yearly)</MonoLabel>
          <MonoLabel tone="faint">Active</MonoLabel>
          <span />
        </div>

        {rows.map((r) => (
          <BundleRow
            key={r.id}
            tier={tier}
            row={r}
            onSave={upsert.mutate}
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

        <BundleRow tier={tier} row={null} onSave={upsert.mutate} onDelete={() => {}} />
      </div>
    </div>
  );
}

function BundleRow({
  tier,
  row,
  onSave,
  onDelete,
}: {
  tier: "pro" | "max" | "team";
  row: PricingBundle | null;
  onSave: (input: BundleInput) => void;
  onDelete: (id: string) => void;
}) {
  const [credits, setCredits] = useState(row?.credits ?? 0);
  const [monthly, setMonthly] = useState(row ? row.monthly_cents / 100 : 0);
  const [yearly, setYearly] = useState(row ? row.yearly_cents / 100 : 0);
  const [priceM, setPriceM] = useState(row?.stripe_price_id_monthly ?? "");
  const [priceY, setPriceY] = useState(row?.stripe_price_id_yearly ?? "");
  const [active, setActive] = useState(row?.active ?? true);

  function save() {
    if (!credits || credits < 1) {
      toast.error("Credits must be at least 1.");
      return;
    }
    onSave({
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
    if (!row) {
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
      }}
    >
      <input
        className={focusRingClass}
        style={inputStyle()}
        type="number"
        value={credits}
        onChange={(e) => setCredits(Number(e.target.value))}
      />
      <input
        className={focusRingClass}
        style={inputStyle()}
        type="number"
        step="0.01"
        value={monthly}
        onChange={(e) => setMonthly(Number(e.target.value))}
      />
      <input
        className={focusRingClass}
        style={inputStyle()}
        type="number"
        step="0.01"
        value={yearly}
        onChange={(e) => setYearly(Number(e.target.value))}
      />
      <input
        className={focusRingClass}
        style={inputStyle()}
        value={priceM}
        onChange={(e) => setPriceM(e.target.value)}
        placeholder="price_..."
      />
      <input
        className={focusRingClass}
        style={inputStyle()}
        value={priceY}
        onChange={(e) => setPriceY(e.target.value)}
        placeholder="price_..."
      />
      <input
        className={focusRingClass}
        type="checkbox"
        checked={active}
        onChange={(e) => setActive(e.target.checked)}
        style={{ width: 14, height: 14, accentColor: "var(--glacier)", cursor: "pointer" }}
      />
      <div style={{ display: "flex", gap: "var(--space-1)" }}>
        <Button variant="secondary" onClick={save} style={{ fontSize: 11.5, padding: "6px 10px" }}>
          {row ? "Save" : "Add"}
        </Button>
        {row ? (
          <Button
            variant="secondary"
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
  });

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
        <MonoLabel tone="faint">Credits</MonoLabel>
        <MonoLabel tone="faint">Price $</MonoLabel>
        <MonoLabel tone="faint">Stripe price id</MonoLabel>
        <MonoLabel tone="faint">Active</MonoLabel>
        <span />
      </div>
      {rows.map((r) => (
        <TopupRow
          key={r.id}
          row={r}
          onSave={upsert.mutate}
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
      <TopupRow row={null} onSave={upsert.mutate} onDelete={() => {}} />
    </div>
  );
}

function TopupRow({
  row,
  onSave,
  onDelete,
}: {
  row: TopupBundle | null;
  onSave: (input: TopupInput) => void;
  onDelete: (id: string) => void;
}) {
  const [credits, setCredits] = useState(row?.credits ?? 0);
  const [price, setPrice] = useState(row ? row.price_cents / 100 : 0);
  const [stripeId, setStripeId] = useState(row?.stripe_price_id ?? "");
  const [active, setActive] = useState(row?.active ?? true);

  function save() {
    if (!credits || credits < 1) {
      toast.error("Credits must be at least 1.");
      return;
    }
    onSave({
      id: row?.id ?? null,
      credits,
      price_cents: Math.round(price * 100),
      stripe_price_id: stripeId.trim() || null,
      active,
      sort_order: row?.sort_order ?? 99,
    });
    if (!row) {
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
      />
      <input
        className={focusRingClass}
        style={inputStyle()}
        type="number"
        step="0.01"
        value={price}
        onChange={(e) => setPrice(Number(e.target.value))}
      />
      <input
        className={focusRingClass}
        style={inputStyle()}
        value={stripeId}
        onChange={(e) => setStripeId(e.target.value)}
        placeholder="price_..."
      />
      <input
        className={focusRingClass}
        type="checkbox"
        checked={active}
        onChange={(e) => setActive(e.target.checked)}
        style={{ width: 14, height: 14, accentColor: "var(--glacier)", cursor: "pointer" }}
      />
      <div style={{ display: "flex", gap: "var(--space-1)" }}>
        <Button variant="secondary" onClick={save} style={{ fontSize: 11.5, padding: "6px 10px" }}>
          {row ? "Save" : "Add"}
        </Button>
        {row ? (
          <Button
            variant="secondary"
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
