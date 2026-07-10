import { createFileRoute } from "@tanstack/react-router";
import { isPaymentsProviderId, paymentsProvider } from "@/lib/payments/provider.server";

/**
 * PC-05 — the one payments webhook, provider-dispatched through the
 * PaymentsProvider seam. The Stripe registrations keep their existing URL
 * (`?env=sandbox|live`, provider defaults to stripe); the Paddle destination
 * registers with `&provider=paddle` when the merchant-of-record account
 * exists [awaiting MoR account]. Verification and granting both live in the
 * provider adapters (src/lib/payments/*) — this route only authenticates the
 * query shape and dispatches.
 */
export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const rawEnv = url.searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook invalid env query param:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        const rawProvider = url.searchParams.get("provider") ?? "stripe";
        if (!isPaymentsProviderId(rawProvider)) {
          console.error("Webhook invalid provider query param:", rawProvider);
          return Response.json({ received: true, ignored: "invalid provider" });
        }
        try {
          const provider = await paymentsProvider(rawProvider);
          const event = await provider.verifyWebhook(request, rawEnv);
          await provider.grantFromEvent(event, rawEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});
