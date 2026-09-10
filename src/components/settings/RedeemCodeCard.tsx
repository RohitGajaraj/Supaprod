// Redeem-a-code card (Settings > Credits). The user-facing entry point for the
// voucher engine — without it, redeemVoucher had zero callers and the whole
// voucher feature was admin-create-only. Account scope per the settings-IA
// rubric (vouchers grant account credits / a plan override). Calls the existing
// auth-gated redeemVoucher server fn; on success it invalidates the credits
// query so the new balance shows immediately.
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Gift } from "lucide-react";
import { redeemVoucher } from "@/lib/admin-vouchers.functions";
import { MonoLabel } from "@/components/supaprod/Primitives";
/* Meridian's, not shadcn's. `Input` lives in `forms.tsx` and `Action` in
   `surface-parts.tsx`; neither is findable by listing this directory looking for
   a file named after the control, which is how both of these survived. Search
   `components/meridian/COMPONENTS.md`, not `ls`. */
import { Action } from "@/components/meridian/surface-parts";
import { Input } from "@/components/meridian/forms";
import { toast } from "@/lib/notify";

export function RedeemCodeCard() {
  const fRedeem = useServerFn(redeemVoucher);
  const qc = useQueryClient();
  const [code, setCode] = useState("");

  const redeem = useMutation({
    mutationFn: (c: string) => fRedeem({ data: { code: c.trim() } }),
    onSuccess: (r) => {
      if (!r.ok) {
        toast.error(r.error ?? "Could not redeem this code.");
        return;
      }
      if (r.kind === "plan_upgrade" || (r.plan_tier && !r.credits)) {
        toast.success(`Plan unlocked${r.plan_tier ? `: ${r.plan_tier}` : ""}.`);
      } else if (r.credits && r.credits > 0) {
        toast.success(`Redeemed. ${r.credits.toLocaleString()} credits added.`);
      } else {
        toast.success("Code redeemed.");
      }
      setCode("");
      // Refresh balance + attribution so the granted credits show immediately.
      qc.invalidateQueries({ queryKey: ["my-credits"] });
      qc.invalidateQueries({ queryKey: ["credit-attribution"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="material-medium" style={{ padding: "var(--card-pad, 18px)" }}>
      <MonoLabel icon={Gift}>Redeem a code</MonoLabel>
      <p style={{ margin: "6px 0 10px", color: "var(--mrd-mute, #6b6457)" }}>
        Have a promo or credit code? Enter it to add credits or unlock a plan.
      </p>
      <div style={{ display: "flex", gap: "var(--geist-space-2x)", flexWrap: "wrap" }}>
        {/* IT HAD NO NAME, ONLY A PLACEHOLDER, and a placeholder is not a label:
            it is gone the moment a character is typed, so a screen reader
            arriving mid-edit hears an unnamed box. `every-field-announces-itself`
            catches exactly this and never looked here -- its DIRS list names
            eleven directories by hand and `components/settings` is not one of
            them. Named here; the guard's blind spot is filed separately. */}
        <Input
          aria-label="Redeem code"
          placeholder="Enter code"
          value={code}
          maxLength={64}
          style={{ flex: 1, minWidth: 160, textTransform: "uppercase" }}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && code.trim() && !redeem.isPending) redeem.mutate(code);
          }}
        />
        {/* `busy` carries the pending half; `disabled` keeps the other half,
            which is that an empty box has nothing to redeem. Two facts, and
            only one of them is "working on it". */}
        <Action
          variant="primary"
          disabled={!code.trim()}
          busy={redeem.isPending}
          onClick={() => redeem.mutate(code)}
        >
          {redeem.isPending ? "Redeeming…" : "Redeem"}
        </Action>
      </div>
    </div>
  );
}
