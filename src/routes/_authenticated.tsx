import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { CommandPalette, GotoShortcuts } from "@/components/cadence/CommandPalette";
import { AppShell } from "@/components/cadence/AppShell";
import { WorkspaceProvider } from "@/hooks/use-workspace";
import { FlowModeProvider } from "@/hooks/use-flow-mode";
import { needsOnboarding } from "@/lib/onboarding-gate";
import { BackendHealthBanner } from "@/components/system/BackendHealthBanner";
import { BillingBanner } from "@/components/billing/BillingBanner";

export const Route = createFileRoute("/_authenticated")({
  // Disable SSR/prerender for the entire authenticated subtree. Without a
  // browser session, server-side execution of child loaders would call
  // protected server fns and produce noisy 401s. The client-side
  // beforeLoad below handles the real auth gate.
  ssr: false,
  beforeLoad: async ({ location }) => {
    // Use getSession() — reads from localStorage (instant, no network roundtrip).
    // getUser() hits /auth/v1/user on every navigation and, combined with
    // TanStack Router's hover-preload, makes the UI feel frozen.
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      throw redirect({ to: "/login" });
    }
    // First-run gate: accounts with profiles.onboarded === false land on
    // /onboarding until they finish. Cached (one read per page load) —
    // see onboarding-gate.ts for the never-trap rules.
    if (
      !location.pathname.startsWith("/onboarding") &&
      (await needsOnboarding(data.session.user.id))
    ) {
      throw redirect({ to: "/onboarding" });
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  // Onboarding is documented full-viewport, no-shell (_authenticated.onboarding.tsx)
  // and must stay that way after the OBS-02 hoist: wrapping it in <AppShell>
  // would expose all five nav destinations + the 1-5/g shortcuts before the
  // account has finished onboarding.
  const isOnboarding = pathname.startsWith("/onboarding");

  return (
    // OBS-02: data-obsidian scopes the Obsidian token layer (OBS-01) to the
    // whole authenticated app. The shell is hoisted here ONCE — pages no
    // longer wrap <AppShell> individually (the old ~21-route pattern).
    <div data-obsidian>
      <WorkspaceProvider>
        <FlowModeProvider>
          {/* Ambient time/weather moved into the per-page TopBar (shell port). */}
          <BackendHealthBanner />
          <BillingBanner />
          <CommandPalette />
          {!isOnboarding && <GotoShortcuts />}
          {isOnboarding ? (
            <Outlet />
          ) : (
            <AppShell>
              <Outlet />
            </AppShell>
          )}
        </FlowModeProvider>
      </WorkspaceProvider>
    </div>
  );
}
