/**
 * Embedded Stripe Checkout drawer. Calls the authed `createCheckoutSession`
 * server fn for a fresh client secret, mounts EmbeddedCheckout inline.
 * Closing the dialog cleanly aborts the session reference.
 */
import { useCallback, useMemo } from "react";
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { useServerFn } from "@tanstack/react-start";
/* HELD ON VERIFICATION, NOT ON MERIDIAN (2026-09-10). Meridian HAS a Dialog and
   it would need one change to fit: it is `w-full max-w-[420px]`, and this pane
   is `max-w-2xl` (672px) because it holds Stripe's embedded checkout iframe,
   which has a minimum width of its own. That cap is an unargued default rather
   than a decision -- Dialog's header argues its HEIGHT behaviour at length and
   says nothing about width -- so a width affordance is a small, legitimate raise
   under the standing grant.

   What stops it is that THIS IS CHECKOUT. Re-parenting a live payment iframe is
   a change only a browser can confirm, the suite and the build cannot see it,
   and breaking checkout is the worst outcome a components pass can buy. Chrome
   cannot reach this worktree's dev server tonight. So it waits for a lane that
   can watch it, and the reason is written here rather than left as a file
   nobody explains. */
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { createCheckoutSession, createTopUpCheckout } from "@/lib/payments.functions";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priceLookupKey: string;
  quantity?: number;
  title?: string;
  returnUrl?: string;
  /**
   * "topup" routes through the cap-guarded `createTopUpCheckout`. Default
   * "subscription" uses the standard `createCheckoutSession`.
   */
  mode?: "subscription" | "topup";
}

export function StripeEmbeddedCheckout({
  open,
  onOpenChange,
  priceLookupKey,
  quantity,
  title,
  returnUrl,
  mode = "subscription",
}: Props) {
  const fCheckout = useServerFn(createCheckoutSession);
  const fTopUp = useServerFn(createTopUpCheckout);

  const fetchClientSecret = useCallback(async (): Promise<string> => {
    const sharedReturnUrl =
      returnUrl || `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;
    const result =
      mode === "topup"
        ? await fTopUp({
            data: {
              priceId: priceLookupKey,
              environment: getStripeEnvironment(),
              returnUrl: sharedReturnUrl,
            },
          })
        : await fCheckout({
            data: {
              priceId: priceLookupKey,
              quantity: quantity ?? 1,
              environment: getStripeEnvironment(),
              returnUrl: sharedReturnUrl,
            },
          });
    if ("error" in result) throw new Error(result.error);
    // PC-05: a hosted rail (Paddle, once the merchant-of-record account is
    // live) returns a URL instead of an embeddable secret — hand the browser
    // over; the promise never settles because the page is navigating away.
    if ("checkoutUrl" in result) {
      window.location.assign(result.checkoutUrl);
      return await new Promise<string>(() => {});
    }
    if (!result.clientSecret) throw new Error("Checkout did not return a client secret");
    return result.clientSecret;
  }, [fCheckout, fTopUp, mode, priceLookupKey, quantity, returnUrl]);

  const options = useMemo(() => ({ fetchClientSecret }), [fetchClientSecret]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="border-b border-[var(--mrd-edge,rgba(0,0,0,0.08))] px-5 py-3">
          <DialogTitle className="text-heading-16">{title || "Checkout"}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto">
          {open ? (
            <EmbeddedCheckoutProvider stripe={getStripe()} options={options}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
