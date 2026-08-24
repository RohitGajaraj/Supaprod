/**
 * People · Vouchers panel: create / list / deactivate vouchers, view
 * redemptions per voucher.
 *
 * Loom W2-ADMIN pass (2026-07-04): ported off the parchment classes
 * (bento/btn/--ink-* hexes) to the Obsidian tokens the parent People tab
 * uses; list errors render as errors with retry, never as "No vouchers yet."
 * (register D-11); the deactivate/create mutations check the in-band
 * `{error}` result and surface thrown failures. Queries, mutations, and
 * data shapes are unchanged.
 */
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/lib/notify";
import { useConfirm } from "@/hooks/use-confirm";
import { Action } from "@/components/meridian/surface-parts";
import { AdminErrorCard, AdminSkeleton, inBandError } from "@/components/admin/admin-ui";
import {
  adminListVouchers,
  adminCreateVoucher,
  adminDeactivateVoucher,
  adminListVoucherRedemptions,
  type AdminVoucher,
} from "@/lib/admin-vouchers.functions";

const FOCUS_RING =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:[outline-color:var(--focus-ring)]";

const mutationFailed = (e: unknown) =>
  toast.error(e instanceof Error ? e.message : "The action failed. Nothing was changed.");

export function VouchersPanel() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const fList = useServerFn(adminListVouchers);
  const fDeact = useServerFn(adminDeactivateVoucher);
  const list = useQuery({
    queryKey: ["admin-vouchers"],
    queryFn: () => fList({ data: { active: null } }),
  });
  const listError = list.isError
    ? list.error instanceof Error
      ? list.error.message
      : "Request failed."
    : inBandError(list.data);
  const rows: AdminVoucher[] = Array.isArray(list.data) ? (list.data as AdminVoucher[]) : [];
  const [openId, setOpenId] = useState<string | null>(null);

  const deactivate = useMutation({
    mutationFn: (id: string) => fDeact({ data: { id } }),
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success("Voucher deactivated");
      qc.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
    onError: mutationFailed,
  });

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <VoucherCreator />
      <div className="material-medium" style={card()}>
        <span className="mrd-eyebrow">Vouchers · {list.isLoading ? "…" : rows.length}</span>
        {list.isLoading ? (
          <AdminSkeleton rows={3} height={38} />
        ) : listError ? (
          <AdminErrorCard what="vouchers" message={listError} onRetry={() => list.refetch()} />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th()}>Code</th>
                  <th style={th()}>Kind</th>
                  <th style={th()}>Plan</th>
                  <th style={th()}>Credits</th>
                  <th style={th()}>Used / Max</th>
                  <th style={th()}>Expires</th>
                  <th style={th()}>Active</th>
                  <th style={th()}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id} style={{ borderTop: "1px solid var(--mrd-edge)" }}>
                    <td style={td()}>
                      <code
                        style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}
                      >
                        {v.code}
                      </code>
                    </td>
                    <td style={td()}>{v.kind}</td>
                    <td style={td()}>{v.plan_tier ?? "-"}</td>
                    <td style={td()}>{v.credits ?? "-"}</td>
                    <td style={td()}>
                      {v.redemptions_count} / {v.max_redemptions ?? "no limit"}
                    </td>
                    <td style={td()}>{v.expires_at?.slice(0, 10) ?? "-"}</td>
                    <td style={td()}>{v.active ? "yes" : "no"}</td>
                    <td style={td()}>
                      <div style={{ display: "flex", gap: "var(--space-1)" }}>
                        <Action
                          style={{ padding: "6px 10px" }}
                          onClick={() => setOpenId(v.id)}
                        >
                          Redemptions
                        </Action>
                        {v.active ? (
                          <Action
                            variant="destructive"
                            disabled={deactivate.isPending}
                            busy={deactivate.isPending}
                            style={{
                              padding: "6px 10px",
                            }}
                            onClick={async () => {
                              const ok = await confirm({
                                title: "Deactivate voucher?",
                                body: `${v.code} can no longer be redeemed. Existing redemptions are kept.`,
                                confirmLabel: "Deactivate",
                                destructive: true,
                              });
                              if (ok) deactivate.mutate(v.id);
                            }}
                          >
                            Deactivate
                          </Action>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      style={{
                        padding: "var(--space-3)",
                        textAlign: "center",
                        fontFamily: "var(--font-sans)",
                        color: "var(--text-subtle)",
                      }}
                    >
                      No vouchers yet. Create one above to run a campaign.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <RedemptionsDrawer voucherId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}

function VoucherCreator() {
  const qc = useQueryClient();
  const fCreate = useServerFn(adminCreateVoucher);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"signup" | "credit_grant" | "plan_upgrade">("credit_grant");
  const [planTier, setPlanTier] = useState("");
  const [credits, setCredits] = useState<number | "">("");
  const [autoLogin, setAutoLogin] = useState(false);
  const [maxRedemptions, setMaxRedemptions] = useState<number | "">("");
  const [days, setDays] = useState<number | "">(30);
  const [tag, setTag] = useState("");

  const create = useMutation({
    mutationFn: () => {
      const expiresAt =
        days && Number(days) > 0
          ? new Date(Date.now() + Number(days) * 86400_000).toISOString()
          : null;
      return fCreate({
        data: {
          code,
          kind,
          planTier: planTier || null,
          credits: credits === "" ? null : Number(credits),
          autoLogin,
          maxRedemptions: maxRedemptions === "" ? null : Number(maxRedemptions),
          expiresAt,
          campaignTag: tag || null,
        },
      });
    },
    onSuccess: (r) => {
      if ("error" in r) return toast.error(r.error);
      toast.success(`Voucher ${r.code} created`);
      setCode("");
      setCredits("");
      setMaxRedemptions("");
      setTag("");
      qc.invalidateQueries({ queryKey: ["admin-vouchers"] });
    },
    onError: mutationFailed,
  });

  return (
    <div className="material-medium" style={card()}>
      <span className="mrd-eyebrow">New voucher</span>
      <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="LAUNCH50"
          aria-label="Voucher code"
          className={`${FOCUS_RING} placeholder:[color:var(--text-subtle)]`}
          style={input(140)}
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          aria-label="Voucher kind"
          className={FOCUS_RING}
          style={input(140)}
        >
          <option value="credit_grant">credit_grant</option>
          <option value="plan_upgrade">plan_upgrade</option>
          <option value="signup">signup</option>
        </select>
        <input
          value={planTier}
          onChange={(e) => setPlanTier(e.target.value)}
          placeholder="plan tier"
          aria-label="Plan tier"
          className={`${FOCUS_RING} placeholder:[color:var(--text-subtle)]`}
          style={input(120)}
        />
        <input
          type="number"
          value={credits}
          onChange={(e) => setCredits(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="credits"
          aria-label="Credits"
          className={`${FOCUS_RING} placeholder:[color:var(--text-subtle)]`}
          style={input(100)}
        />
        <input
          type="number"
          value={maxRedemptions}
          onChange={(e) => setMaxRedemptions(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="max uses"
          aria-label="Maximum redemptions"
          className={`${FOCUS_RING} placeholder:[color:var(--text-subtle)]`}
          style={input(100)}
        />
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="days"
          aria-label="Expires in days"
          className={`${FOCUS_RING} placeholder:[color:var(--text-subtle)]`}
          style={input(80)}
        />
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="campaign tag"
          aria-label="Campaign tag"
          className={`${FOCUS_RING} placeholder:[color:var(--text-subtle)]`}
          style={input(140)}
        />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--font-sans)",
            color: "var(--text-body)",
          }}
        >
          <input
            type="checkbox"
            checked={autoLogin}
            onChange={(e) => setAutoLogin(e.target.checked)}
            className={FOCUS_RING}
            style={{ width: 14, height: 14, accentColor: "var(--text-primary)", cursor: "pointer" }}
          />{" "}
          auto-login (signup)
        </label>
        <Action
          disabled={!code || create.isPending}
          busy={create.isPending}
          onClick={() => create.mutate()}
        >
          {create.isPending ? "Creating…" : "Create voucher"}
        </Action>
      </div>
    </div>
  );
}

function RedemptionsDrawer({
  voucherId,
  onClose,
}: {
  voucherId: string | null;
  onClose: () => void;
}) {
  const fList = useServerFn(adminListVoucherRedemptions);
  const list = useQuery({
    queryKey: ["admin-voucher-redemptions", voucherId],
    enabled: !!voucherId,
    queryFn: () => fList({ data: { voucherId: voucherId! } }),
  });
  const listError = list.isError
    ? list.error instanceof Error
      ? list.error.message
      : "Request failed."
    : inBandError(list.data);
  const rows = Array.isArray(list.data) ? list.data : [];

  return (
    <Sheet open={!!voucherId} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        style={{
          width: "min(480px, 100vw)",
          overflow: "auto",
        }}
      >
        <SheetHeader>
          <SheetTitle>Redemptions</SheetTitle>
        </SheetHeader>
        {list.isLoading ? (
          <div style={{ marginTop: "var(--space-4)" }}>
            <AdminSkeleton rows={3} height={28} />
          </div>
        ) : listError ? (
          <div style={{ marginTop: "var(--space-4)" }}>
            <AdminErrorCard what="redemptions" message={listError} onRetry={() => list.refetch()} />
          </div>
        ) : (
          <ul
            style={{
              marginTop: "var(--space-4)",
              padding: 0,
              listStyle: "none",
              display: "grid",
              gap: 6,
              fontFamily: "var(--font-sans)",
              color: "var(--text-body)",
            }}
          >
            {rows.length === 0 ? (
              <li style={{ color: "var(--text-subtle)" }}>No redemptions yet.</li>
            ) : null}
            {rows.map((r) => (
              <li key={r.id}>
                {r.user_email ?? r.user_id} · {new Date(r.redeemed_at).toLocaleString()}
              </li>
            ))}
          </ul>
        )}
      </SheetContent>
    </Sheet>
  );
}

// Radius/border/shadow come from the material-medium preset class applied at each
// call site; this helper now supplies layout only (Tempo materials law).
function card(): React.CSSProperties {
  return {
    padding: "var(--space-4)",
    display: "grid",
    gap: "var(--space-3)",
  };
}
function input(width?: number): React.CSSProperties {
  return {
    padding: "8px 10px",
    border: "1px solid var(--mrd-edge)",
    borderRadius: "var(--radius-control)",
    background: "var(--raised)",
    color: "var(--text-primary)",
    fontFamily: "var(--font-sans)",
    width,
  };
}
function th(): React.CSSProperties {
  return {
    padding: "8px 10px",
    fontFamily: "var(--font-mono)",
    letterSpacing: "0.11em",
    textTransform: "uppercase",
    textAlign: "left",
    fontWeight: 400,
    color: "var(--text-subtle)",
    borderBottom: "1px solid var(--mrd-edge)",
  };
}
function td(): React.CSSProperties {
  return {
    padding: "10px",
    verticalAlign: "middle",
    fontFamily: "var(--font-sans)",
    color: "var(--text-body)",
  };
}
