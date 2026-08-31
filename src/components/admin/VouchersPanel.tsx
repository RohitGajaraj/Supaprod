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
import { humanWriteError } from "@/lib/roles.functions";
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

const mutationFailed = (e: unknown) =>
  toast.error(humanWriteError(e, "The action failed. Nothing was changed."));

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

  /*
   * `data-mrd` is what makes the focus ring Meridian's, and its absence was
   * live behaviour rather than a lint.
   *
   * AuthedLayout mounts `data-obsidian` on <html> for the whole authenticated
   * tree, and meridian.css remaps `--focus-ring` to `--mrd-focus` only INSIDE a
   * `[data-mrd]` subtree. `Surface` does not set it, so every keyboard focus
   * ring on this panel drew in the retired `--ds-focus-color` while the rest of
   * the app drew Meridian's. The token ratchet cannot see it: the retired value
   * arrives through an alias.
   */
  return (
    <div data-mrd="" style={{ display: "grid", gap: "var(--space-4)" }}>
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
                      <code style={{ fontFamily: "var(--mrd-mono)", color: "var(--mrd-ink)" }}>
                        {v.code}
                      </code>
                    </td>
                    <td style={td()}>{v.kind}</td>
                    <td style={td()}>{v.plan_tier ?? "-"}</td>
                    <td style={td()}>{v.credits ?? "-"}</td>
                    {/* R-22: AN UNSET CEILING IS NOT A CHOSEN ONE, AND THIS CELL
                        USED TO SAY IT WAS. A null `max_redemptions` rendered as
                        "no limit", which reads as a decision somebody made. Nobody
                        can make it here: `issue_voucher` takes `_max_redemptions`
                        as a NON-NULL number, so no path in the product produces a
                        null. It is an absence.
                        And the absence resolves to the UNSAFE reading, which is the
                        hazard R-22 generalises. `redeem_voucher` guards the cap with
                        `if _v.max_redemptions is not null then ... end if`
                        (20260622040000), so a null skips the check entirely and the
                        code keeps granting credits with no ceiling and no backstop.
                        So the cell says both halves: that nothing set a cap, and what
                        that currently costs. The real repair is a safe default on the
                        read side and belongs in a migration, not in this table —
                        filed in coordination/requests/S3/. */}
                    <td style={td()}>
                      {v.max_redemptions === null ? (
                        <>{v.redemptions_count} · no cap set, so it keeps granting</>
                      ) : (
                        <>
                          {v.redemptions_count} / {v.max_redemptions}
                        </>
                      )}
                    </td>
                    <td style={td()}>{v.expires_at?.slice(0, 10) ?? "-"}</td>
                    <td style={td()}>{v.active ? "yes" : "no"}</td>
                    <td style={td()}>
                      <div style={{ display: "flex", gap: "var(--space-1)" }}>
                        <Action style={{ padding: "6px 10px" }} onClick={() => setOpenId(v.id)}>
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
                        fontFamily: "var(--mrd-font)",
                        color: "var(--mrd-mute)",
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
          className="placeholder:[color:var(--mrd-mute)]"
          style={input(140)}
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          aria-label="Voucher kind"
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
          className="placeholder:[color:var(--mrd-mute)]"
          style={input(120)}
        />
        <input
          type="number"
          value={credits}
          onChange={(e) => setCredits(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="credits"
          aria-label="Credits"
          className="placeholder:[color:var(--mrd-mute)]"
          style={input(100)}
        />
        <input
          type="number"
          value={maxRedemptions}
          onChange={(e) => setMaxRedemptions(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="max uses"
          aria-label="Maximum redemptions"
          className="placeholder:[color:var(--mrd-mute)]"
          style={input(100)}
        />
        <input
          type="number"
          value={days}
          onChange={(e) => setDays(e.target.value === "" ? "" : Number(e.target.value))}
          placeholder="days"
          aria-label="Expires in days"
          className="placeholder:[color:var(--mrd-mute)]"
          style={input(80)}
        />
        <input
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="campaign tag"
          aria-label="Campaign tag"
          className="placeholder:[color:var(--mrd-mute)]"
          style={input(140)}
        />
        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "var(--mrd-font)",
            color: "var(--mrd-body)",
          }}
        >
          <input
            type="checkbox"
            checked={autoLogin}
            onChange={(e) => setAutoLogin(e.target.checked)}
            style={{ width: 14, height: 14, accentColor: "var(--mrd-ink)", cursor: "pointer" }}
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
              fontFamily: "var(--mrd-font)",
              color: "var(--mrd-body)",
            }}
          >
            {rows.length === 0 ? (
              <li style={{ color: "var(--mrd-mute)" }}>No redemptions yet.</li>
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
    background: "var(--mrd-lift)",
    color: "var(--mrd-ink)",
    fontFamily: "var(--mrd-font)",
    width,
  };
}
function th(): React.CSSProperties {
  return {
    padding: "8px 10px",
    fontFamily: "var(--mrd-mono)",
    letterSpacing: "0.11em",
    textTransform: "uppercase",
    textAlign: "left",
    fontWeight: 400,
    color: "var(--mrd-mute)",
    borderBottom: "1px solid var(--mrd-edge)",
  };
}
function td(): React.CSSProperties {
  return {
    padding: "10px",
    verticalAlign: "middle",
    fontFamily: "var(--mrd-font)",
    color: "var(--mrd-body)",
  };
}
