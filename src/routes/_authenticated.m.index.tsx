// Mission Control index. This is the product's home, not a sandbox: index.tsx
// sends every signed-in user to /m, which lands here and resolves a product.
// /m resolves the last-active product (the same useWorkspace resolution the
// AppShell switcher uses: stored per workspace, first product as fallback)
// and redirects to /m/$productId. A zero-product workspace renders the
// prospect state via WarmSlot - never blank (Addendum 1.1 rule 7).
import { useEffect } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useWorkspace } from "@/hooks/use-workspace";
import { WarmSlot } from "@/components/mission/primitives";
import { RoomChromeShell } from "@/components/mission/RoomChrome";

export const Route = createFileRoute("/_authenticated/m/")({
  component: MissionIndex,
  head: () => ({ meta: [{ title: "Mission Control · Supaprod" }] }),
});

function MissionIndex() {
  const navigate = useNavigate();
  const { products, activeProductId, isLoading } = useWorkspace();

  // Last-active product when it still exists here, else the first product.
  const targetId =
    activeProductId && products.some((p) => p.id === activeProductId)
      ? activeProductId
      : (products[0]?.id ?? null);

  useEffect(() => {
    if (isLoading || !targetId) return;
    void navigate({ to: "/m/$productId", params: { productId: targetId }, replace: true });
  }, [isLoading, targetId, navigate]);

  // A zero-product workspace used to render this WarmSlot on a bare div with
  // no TopBar at all, which stranded the user: no doors, no workspace switch,
  // and (since the retired AppShell holds the only other one) no way to sign
  // out. Wear the room chrome so the account layer is present here too. The
  // redirecting branch stays bare on purpose, it is gone in a frame.
  if (!isLoading && !targetId) {
    return (
      <RoomChromeShell activeDoor="mission">
        <div className="flex h-full items-center justify-center p-8">
          <WarmSlot
            className="w-full max-w-[460px]"
            line={{
              text: "No products in this workspace yet. Tell Supaprod what you are building and the loop starts from your first signal.",
              actionLabel: "Ask Supaprod",
              onAction: () => window.dispatchEvent(new CustomEvent("supaprod:open-ask")),
            }}
          />
        </div>
      </RoomChromeShell>
    );
  }

  return (
    <div
      className="flex h-dvh items-center justify-center p-8"
      style={{ background: "var(--ink-bg)" }}
    >
      <p className="font-mono text-[11px]" style={{ color: "var(--ink-subtle)" }}>
        Opening Mission Control.
      </p>
    </div>
  );
}
