import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect, type CSSProperties } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GotoShortcuts } from "@/components/supaprod/CommandPalette";
import { AppShell } from "@/components/supaprod/AppShell";
import { WorkspaceProvider } from "@/hooks/use-workspace";
import { FlowModeProvider } from "@/hooks/use-flow-mode";
import { needsOnboarding } from "@/lib/onboarding-gate";
import { BackendHealthBanner } from "@/components/system/BackendHealthBanner";
import { BillingBanner } from "@/components/billing/BillingBanner";

import { AskProvider } from "@/lib/ask-context";
import { GlobalComposer } from "@/components/mission/composer";
import { FocusDock } from "@/components/supaprod/FocusDock";

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
  // LOOM W4 - shell-level boundaries (DESIGN-LOOM §9). A crash or a bad URL
  // inside the authenticated tree renders a quiet fallback here instead of
  // tearing down the whole app frame.
  errorComponent: AuthedError,
  notFoundComponent: AuthedNotFound,
});

const fallbackWrap: CSSProperties = {
  minHeight: "50vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: 12,
  padding: 24,
  textAlign: "center",
  background: "var(--canvas)",
};

function AuthedError({ error }: { error: Error }) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Something went wrong while loading this page.";
  return (
    <div data-obsidian style={fallbackWrap}>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-body, #C6C0B8)" }}>
        This part of Supaprod hit an error.
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 12.5,
          lineHeight: 1.5,
          maxWidth: "56ch",
          color: "var(--text-muted, #A39D94)",
          overflowWrap: "anywhere",
        }}
      >
        {message}
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        style={{
          marginTop: 4,
          padding: "6px 14px",
          fontSize: 12.5,
          borderRadius: 8,
          border: "1px solid var(--hairline)",
          background: "transparent",
          color: "var(--text-body, #C6C0B8)",
          cursor: "pointer",
        }}
      >
        Reload the page
      </button>
    </div>
  );
}

function AuthedNotFound() {
  return (
    <div data-obsidian style={fallbackWrap}>
      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-body, #C6C0B8)" }}>
        This page does not exist.
      </p>
      <a
        href="/today"
        style={{
          fontSize: 12.5,
          color: "var(--text-muted, #A39D94)",
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        Back to Today
      </a>
    </div>
  );
}

function AuthedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // The portal theme fix: Radix/shadcn floating layers (dropdowns, dialogs,
  // popovers, tooltips, sonner, cmdk) portal onto document.body — OUTSIDE the
  // <div data-obsidian> below — so they rendered in the light parchment theme
  // over the dark app (the "workspace switcher goes white" bug). Hoisting the
  // attribute onto <html> while the authenticated tree is mounted lets every
  // portal inherit the Obsidian tokens; the landing page never mounts this
  // layout, so it stays parchment. The inner div stays as a same-DOM anchor.
  useEffect(() => {
    document.documentElement.setAttribute("data-obsidian", "");
    return () => {
      document.documentElement.removeAttribute("data-obsidian");
    };
  }, []);
  // Onboarding is documented full-viewport, no-shell (_authenticated.onboarding.tsx)
  // and must stay that way after the OBS-02 hoist: wrapping it in <AppShell>
  // would expose all five nav destinations + the 1-5/g shortcuts before the
  // account has finished onboarding. The reimagined one-question first run at
  // /start (front-end reimagining Phase 5) is the same kind of moment, so it
  // gets the same clean, chromeless full-viewport treatment (no shell, no
  // shortcuts, no composer, no focus dock, no sample banner).
  const isOnboarding = pathname.startsWith("/onboarding") || pathname === "/start";
  // Mission Control sandbox (/m, front-end reimagining Phase 1): the room
  // carries its own five-region shell (TopBar, Spine, Thread, Canvas,
  // Composer), so the old AppShell must not wrap it. GotoShortcuts also stays
  // off there: it binds bare digits 1-7 to old-app surfaces, and in the room
  // those keys walk the Spine (shell-local listener in MissionShell).
  const isMissionControl = pathname === "/m" || pathname.startsWith("/m/");

  return (
    // OBS-02: data-obsidian scopes the Obsidian token layer (OBS-01) to the
    // whole authenticated app. The shell is hoisted here ONCE — pages no
    // longer wrap <AppShell> individually (the old ~21-route pattern).
    <div data-obsidian>
      <WorkspaceProvider>
        <FlowModeProvider>
          <AskProvider>
            {/* Ambient time/weather moved into the per-page TopBar (shell port). */}
            <BackendHealthBanner />
            <BillingBanner />
            {!isOnboarding && !isMissionControl && <GotoShortcuts />}
            {isOnboarding || isMissionControl ? (
              <Outlet />
            ) : (
              <AppShell>
                <Outlet />
              </AppShell>
            )}
            {/* Phase 2 (front-end reimagining): the ONE summonable composer.
                  Cmd/Ctrl+J and Cmd/Ctrl+K plus the supaprod:open-ask /
                  supaprod:open-cmdk events open the ComposerOverlay on every
                  old-app surface. The retired CommandPalette and AskPanel
                  components stay in the tree source but are unmounted
                  (Addendum 1.1 rule 8); inside /m/$productId the room's own
                  MissionShell answers the same keys and events, so
                  GlobalComposer stands down there (it self-excludes). */}
            {!isOnboarding && <GlobalComposer />}
            {/* PM Desk: the Wispr-style focus dock — an idle sliver on every
                  page, the cross-surface countdown while a block runs (Option F).
                  Off Mission Control: its fixed bottom-center sliver sits on top
                  of the room's docked Composer and intercepts its clicks (found
                  in live smoke 2026-07-19), and the founder's Gate 1 retirements
                  already drop the dock from the reimagined room. */}
            {!isOnboarding && !isMissionControl && <FocusDock />}
          </AskProvider>
        </FlowModeProvider>
      </WorkspaceProvider>
    </div>
  );
}
