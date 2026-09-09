import { createFileRoute, Outlet, redirect, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { GotoShortcuts } from "@/components/supaprod/GotoShortcuts";
import { BrandWait } from "@/components/supaprod/BrandWait";
import { AppFrame } from "@/components/shell/AppFrame";
import { WorkspaceProvider, useWorkspace } from "@/hooks/use-workspace";
import { BOOT_SHELL_ID } from "@/components/shell/BootShell";
import { FlowModeProvider } from "@/hooks/use-flow-mode";
import { needsOnboarding } from "@/lib/onboarding-gate";
import { WORKSPACE_STORAGE_KEY } from "@/hooks/use-workspace";
import { readHome } from "@/lib/spine/track.functions";
import { HOME_STALE_MS, homeKey, seedHome } from "@/components/start/home-read";
import { measuredQueryFn } from "@/routes/_authenticated.start";
import { useApprovalPush } from "@/hooks/use-approval-push";
import { BackendHealthBanner } from "@/components/system/BackendHealthBanner";
import { EverythingIsPausedBanner } from "@/components/system/EverythingIsPausedBanner";
import { BillingBanner } from "@/components/billing/BillingBanner";

import { ShellReadFailed, ShellRouteMissing } from "@/components/meridian/boundary-states";
import { AskProvider } from "@/lib/ask-context";
import { ROOM_ROUTE_IDS } from "@/lib/room-url";
import { GlobalComposer } from "@/components/mission/composer";
import { useRunningNowPush } from "@/hooks/use-running-now-push";
import { useTrackChangePush } from "@/hooks/use-track-change-push";
// FocusDock retired by the rebuild; see the note at its former call site.

export const Route = createFileRoute("/_authenticated")({
  // Disable SSR/prerender for the entire authenticated subtree. Without a
  // browser session, server-side execution of child loaders would call
  // protected server fns and produce noisy 401s. The client-side
  // beforeLoad below handles the real auth gate.
  ssr: false,

  /**
   * Authenticated routes are not indexable. Children inherit this meta tag.
   */
  head: () => ({
    meta: [{ name: "robots", content: "noindex, nofollow" }],
  }),

  /**
   * THE WAIT STOPS TEARING THE PRODUCT DOWN TO NAVIGATE INSIDE IT.
   *
   * `router.tsx` sets `defaultPendingComponent` to `<BrandWait />`, whose
   * `overlay` defaults to TRUE: `position: fixed; inset: 0`, an OPAQUE
   * `var(--sp-bg)` ground, `zIndex: 40`. With `defaultPendingMs: 150` and
   * `defaultPendingMinMs: 300`, and no route overriding it anywhere, EVERY
   * navigation slower than 150ms covered the rail, the header, the spine strip
   * and the work region with a full-screen field for at least 300ms, then put
   * them all back.
   *
   * The overlay is not wrong; it is wrong HERE. Its own comment says it "reads
   * as the product composing itself", and on a cold boot that is exactly true,
   * which is why the root and the public tree keep it. But moving from Decide
   * to Plan is not the product composing itself. Tearing down persistent chrome
   * is the single thing that makes an SPA feel like a page load, and doing it on
   * every slow-ish navigation costs more perceived speed than the latency it is
   * covering for.
   *
   * The authenticated tree keeps its shell and waits inside the work region.
   * `overlay={false}` is a branch BrandWait already has; nothing new is drawn,
   * and the mark drops to 44 because it is no longer sitting in a large dark
   * field (the 76 above exists for exactly that case).
   */
  pendingComponent: () => <BrandWait overlay={false} size={44} label="Opening" />,
  beforeLoad: async ({ location, context }) => {
    /*
     * TIMED, NOT GUESSED (P-32, A-QUEUE.md). A1's live measurement found a
     * 1.1-second prefix before ANY of the three `/start` readers fire, and
     * this gate -- the one thing every authenticated navigation blocks on
     * before `component` even mounts -- is the named suspect. `ssr: false`
     * above means this always runs in the browser, never on the server, so
     * `onboarding-gate.ts`'s module-level cache genuinely persists across
     * client-side navigations in this tab; whether THIS particular
     * measurement hits it warm or pays the one real round trip is exactly
     * what these two marks settle instead of a second round of guessing.
     */
    const beforeLoadStarted = Date.now();
    // Use getSession() — reads from localStorage (instant, no network roundtrip).
    // getUser() hits /auth/v1/user on every navigation and, combined with
    // TanStack Router's hover-preload, makes the UI feel frozen.
    const { data } = await supabase.auth.getSession();
    console.log(`[perf] beforeLoad:getSession: ${Date.now() - beforeLoadStarted}ms`);
    if (!data.session) {
      throw redirect({ to: "/login" });
    }
    /*
     * P-32 PASS 4: THE HOME'S READER STARTS HERE, NOT AFTER THIS GATE OPENS.
     * A1's pass-3 verdict named two remaining costs: this prefix (0.4-0.7s)
     * and the runs read itself (1.2-1.6s), paid one after the other
     * because `useQuery` only fires once `StartLanding` mounts, which only
     * happens once `beforeLoad` resolves -- React Router's own lifecycle
     * forces them into series.
     *
     * Fired, not awaited: this starts the network call the moment `/start`
     * is the destination, running CONCURRENTLY with `needsOnboarding` below
     * rather than after it. `queryClient.prefetchQuery` and the component's
     * own `useQuery` share one cache by KEY -- reading the same
     * `WORKSPACE_STORAGE_KEY` `WorkspaceProvider` itself reads (not a second,
     * drifting guess at it) is what makes the keys match on the common path
     * (a returning visitor whose stored workspace is still valid) so the
     * mounted `useQuery` finds this promise already in flight instead of
     * issuing a second, duplicate request. A first-time visitor or a stale
     * stored id (workspaceId resolves differently once `workspaces` loads)
     * just wastes one prefetch -- harmless, not wrong, never a stale row
     * shown: `useQuery` still reads its own key's true state after this.
     */
    /* THE HOME'S ONE READ, not the runs read alone (2026-09-08). `readHome`
       carries the runs and seeds their key, so prefetching the runs here as
       well paid the page's largest read twice before the home had mounted;
       the composite read is what the home joins on arrival (home-read.ts).
       No stored workspace means nothing to read yet, and the home's own
       query starts it once the id is known. */
    if (location.pathname === "/start") {
      const workspaceId = localStorage.getItem(WORKSPACE_STORAGE_KEY);
      if (workspaceId) {
        void context.queryClient.prefetchQuery({
          queryKey: homeKey(workspaceId),
          queryFn: measuredQueryFn("readHome", async () => {
            const r = await readHome({ data: { workspaceId } });
            seedHome(context.queryClient, workspaceId, r);
            return r;
          }),
          staleTime: HOME_STALE_MS,
        });
      }
    }
    // First-run gate: accounts with profiles.onboarded === false land on
    // /onboarding until they finish. Cached (one read per page load) —
    // see onboarding-gate.ts for the never-trap rules.
    // /start USED TO BE EXEMPT ("the zero-config entry point"). Since
    // 2026-09-08 /start IS the signed-in home and where a signup lands, so
    // the exemption meant a fresh account never saw the first run screen at
    // all: it landed on a chromeless home with nothing in it (found by the
    // entry review, 2026-09-08). Every route gates now; FirstRun is one
    // screen and it opens the home itself when it is done.
    const onboardingStarted = Date.now();
    const firstRun = await needsOnboarding(data.session.user.id);
    console.log(`[perf] beforeLoad:needsOnboarding: ${Date.now() - onboardingStarted}ms`);
    if (!location.pathname.startsWith("/onboarding") && firstRun) {
      throw redirect({ to: "/onboarding" });
    }
    /*
     * RETURNED, not just branched on, because `/start` is now the HOME and the
     * shell decision below needs the same answer. The read is cached
     * (`onboarding-gate.ts`, one per page load), so surfacing it costs nothing.
     */
    console.log(`[perf] beforeLoad total: ${Date.now() - beforeLoadStarted}ms`);
    return { firstRun };
  },
  component: AuthedLayout,
  /*
   * SHELL-LEVEL BOUNDARIES. A crash or a bad URL inside the authenticated tree
   * renders a composed state here instead of a stack trace or a blank field.
   *
   * BOTH ARE MERIDIAN AS OF 2026-08-20, and the reason the port mattered more
   * than the token count: neither of these carried `data-mrd`, and
   * `AuthedLayout` below mounts `data-obsidian` on `<html>` for the whole
   * authenticated tree, so the one control on each of them took the legacy
   * app-wide focus ring rather than Meridian's. That is live behaviour on the
   * boundary for 94 routes, not a lint. See
   * `src/components/meridian/boundary-states.tsx` for why the pair sits in one
   * module and how the two states are kept apart.
   *
   * THE TWO ARRIVE BY DIFFERENT ROUTES, and that is why the frame they share
   * still paints its own ground. A not-found bubbles up from a child and
   * renders in the work region with the shell around it. An error here is this
   * route's OWN failure -- the session read or the onboarding gate in
   * `beforeLoad` -- so `AuthedLayout` never mounts and there is no chrome left
   * to supply one. `router.tsx`'s `defaultErrorComponent` is what catches a
   * child route's own crash, not this.
   */
  errorComponent: ({ error }) => <ShellReadFailed error={error} />,
  notFoundComponent: () => <ShellRouteMissing />,
});

/**
 * THE LIVE-WORK PUSH, ONCE PER SIGNED-IN SESSION (Lane 1 with Lane 3,
 * 2026-09-08). `agent_runs` is in the realtime publication; this invalidates
 * the one key every surface reads live work under (`runningNowKey`) on any
 * insert or update in the workspace, so the home's Working now strip, the
 * rail's crew and the run screen move the moment a seat starts, ends or
 * stamps a checkpoint. Inside `WorkspaceProvider` because it needs the active
 * workspace, and mounted once for the reason `useApprovalPush` is: two mounts
 * would open two channels under one name.
 */
function RunningNowPush() {
  const { activeWorkspaceId } = useWorkspace();
  useRunningNowPush(activeWorkspaceId);
  /* And the tracks themselves: a station finishing, a hold landing or a call
     opening moves the home's rows and the hero the moment it is written,
     not on the next poll (Lane 1, 2026-09-08). Inert until spine_tracks is in
     the realtime publication. */
  useTrackChangePush(activeWorkspaceId);
  return null;
}

function AuthedLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  /*
   * ── THE GATE SOCKET IS ALWAYS ON NOW (2026-09-01) ────────────────────────
   *
   * `useApprovalPush` is a complete Supabase realtime subscription on
   * `agent_approvals` -- RLS-filtered to this user, INSERT and UPDATE, with a
   * refetch on every reconnect to close the window a dropped socket opens. It
   * was mounted in ONE place: `AskPane`, which only exists while the Ask panel
   * is open.
   *
   * So the surfaces that most need a question to arrive the moment it is asked
   * had no push at all. The run screen's inline gate polls every 10s
   * (`TrackConsent.tsx:92`), the board's review queue and the rail's count run
   * on their own timers, and a person watching their own run could sit for ten
   * seconds after the agent had already stopped to ask them something.
   *
   * Hoisting it here gives one subscription per signed-in session that serves
   * every surface, which is the shape the hook's own header argues for: *"one
   * subscription per user still serves every surface, and any future reader of
   * a gate gets the push by adding its key here."* `AskPane` now passes
   * `false`, because two mounts would open two channels under the same name.
   */
  useApprovalPush(true);

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

  /*
   * ── THE BOOT FRAME COMES DOWN WHEN THE REAL ONE IS UP ────────────────────
   *
   * `BootShell.tsx` paints the product's frame into the server's HTML, because
   * for an authenticated URL that HTML is otherwise empty and all 470 KB of
   * script loads before first paint. This is where it is removed.
   *
   * HERE AND NOT IN `RootComponent`, and the difference is the whole point.
   * The root mounts as soon as the bundle has parsed, which is BEFORE this
   * route's `beforeLoad` has resolved the session -- so removing it there
   * would take the frame down and hand the reader back the empty field for the
   * length of the auth gate. Then the shell would appear. Two transitions,
   * and the middle one is the exact state this was built to delete.
   *
   * `AuthedLayout` mounting is the honest signal, because it is the moment the
   * real rail and header exist. One transition: the boot frame is replaced by
   * the shell it was standing in for, with the mark already in position.
   *
   * IT ALSO COVERS THE CHROMELESS ROUTES CORRECTLY. Onboarding and Mission
   * Control mount this layout and then render `<Outlet />` with no `AppFrame`,
   * so the frame is removed and they get the full-viewport treatment they are
   * documented to have. The removal is keyed on this component being alive,
   * never on which surface it chose to draw.
   *
   * REMOVED RATHER THAN HIDDEN. It has done its one job and a hidden fixed
   * layer over every authenticated screen is a thing that can come back.
   */
  useEffect(() => {
    document.getElementById(BOOT_SHELL_ID)?.remove();
  }, []);
  // Onboarding is documented full-viewport, no-shell (_authenticated.onboarding.tsx)
  // and must stay that way after the OBS-02 hoist: wrapping it in <AppShell>
  // would expose all five nav destinations + the 1-5/g shortcuts before the
  // account has finished onboarding. The reimagined one-question first run at
  // /start (front-end reimagining Phase 5) is the same kind of moment, so it
  // gets the same clean, chromeless full-viewport treatment (no shell, no
  // shortcuts, no composer, no focus dock, no sample banner).
  /*
   * ── FIXED 2026-08-25, AND IT IS A BUG THE FRONT-DOOR FLIP CAUSED ──────────
   *
   * This read `|| pathname === "/start"` unconditionally, which was right while
   * `/start` was a side door reached once: a first-run moment deserves a clean
   * full-viewport screen with no rail and no shortcuts.
   *
   * **Then I made `/start` the home** (`post-auth-home.ts`), and the same line
   * meant every signed-in person landed on a page **with no rail at all** — no
   * navigation, no way to reach Approvals or Brain, the shell torn down by the
   * very door that contains it. A home with no chrome is not a home.
   *
   * So the treatment now follows the PERSON rather than the PATH. Somebody who
   * has not finished onboarding still gets the chromeless introduction; somebody
   * who has gets their home inside the shell, with their open runs and the rail.
   * `/start` stays exempt from the onboarding REDIRECT above — that exemption is
   * deliberate and unchanged — so a first-run visitor can still reach it, and
   * now gets the right frame when they do.
   */
  const firstRun = Route.useRouteContext().firstRun === true;
  /* A first-run account cannot reach /start any more (the gate above sends
     it to /onboarding), so the chromeless-home branch that once lived here
     is gone with the exemption. `firstRun` stays in the context for the
     home's own reading. */
  const isOnboarding = pathname.startsWith("/onboarding");
  // Mission Control (front-end reimagining Phase 1): the room carries its own
  // five-region shell (TopBar, Spine, Thread, Canvas, Composer), so the old
  // AppShell must not wrap it. GotoShortcuts also stays off there: it binds
  // bare digits 1-7 to old-app surfaces, and in the room those keys walk the
  // Spine (shell-local listener in MissionShell).
  //
  // Matched route ids, not a pathname prefix: the room moved from /m/<uuid> to
  // /$workspaceSlug/$productSlug, and a startsWith("/m/") test would have gone
  // quietly false there, rendering the room inside the retired shell.
  const isMissionControl = useRouterState({
    select: (s) => s.matches.some((m) => (ROOM_ROUTE_IDS as readonly string[]).includes(m.routeId)),
  });
  // THE STEP-4 REMOVAL LIST (rebuild 2026-07-29), now down to ONE entry.
  //
  // It existed because the app had three shells and this hardcoded pathname
  // list choosing between them, which was the disease the rebuild set out to
  // treat. AppFrame is the one shell and takes no "which shell" argument, but
  // it could not wrap a route that still drew its own chrome without rendering
  // two headers and two rails.
  //
  // Emptied over 2026-07-29 as each surface was ported and verified to have
  // dropped RoomChromeShell: /approvals, then /brain and /settings, then
  // /threads and /artifacts. Only Mission Control is left, and it is the one
  // genuinely different case: it carries its own five-region composition
  // (TopBar, Spine, Thread, Canvas, Composer) rather than a duplicate of the
  // app chrome, so porting it is a design question and not a deletion.
  //
  // When this goes, so do MissionShellView.tsx and RoomChrome.tsx. The list
  // only ever shrinks: adding a route here is adding a second shell back.
  const isReimaginedSurface = isMissionControl;

  return (
    // OBS-02: data-obsidian scopes the Obsidian token layer (OBS-01) to the
    // whole authenticated app. The shell is hoisted here ONCE — pages no
    // longer wrap <AppShell> individually (the old ~21-route pattern).
    //
    // ── `.sp-frame` MAKES THIS WRAPPER OWN THE VIEWPORT, 2026-08-15 ────────
    //
    // FOUNDER-REPORTED, with screenshots: with the low-credits banner showing,
    // the bottom icons of the rail fall off the bottom of the screen. Dismiss
    // the banner and they come back.
    //
    // MEASURED BEFORE ANYTHING CHANGED, at his own 683px window: the banner is
    // 29px, `.sp-app` was `height: 100dvh` and so claimed 683 REGARDLESS,
    // document height came to 712, and the rail foot's bottom edge sat at 712 —
    // exactly one banner below the fold. This wrapper was a plain block box
    // with no height and no display of its own, so nothing ever told the shell
    // that something was sitting above it.
    //
    // NOT `calc(100dvh - 44px)`, WHICH IS THE ANSWER THAT LOOKS RIGHT. There
    // are TWO banners here and both can show at once, so any single constant is
    // wrong half the time; it is also wrong the moment someone edits a banner's
    // padding, and wrong silently. The wrapper takes the viewport, the banners
    // size to their content however many there are, and the shell takes what is
    // left. No listener, no measurement, and dismissing a banner reflows for
    // free.
    //
    // The rules live in shell.css beside `.sp-app`, because the two halves only
    // work as a pair and splitting them across two files is how one of them
    // gets edited alone. A CLASS and not `[data-obsidian]`: that attribute is
    // also mounted on <html>, so styling it would give the document element a
    // viewport-height flex column as well.
    <div data-obsidian className="sp-frame">
      <WorkspaceProvider>
        <FlowModeProvider>
          <AskProvider>
            {/* Ambient time/weather moved into the per-page TopBar (shell port). */}
            <RunningNowPush />
            <BackendHealthBanner />
            {/* A workspace pause holds every agent mid-step, and it was visible
                on ONE governance panel. It is the state that changes what every
                other screen means -- an empty queue reads as quiet rather than
                held -- which is the same reason BackendHealthBanner is here.
                Draws only when paused. */}
            <EverythingIsPausedBanner />
            <BillingBanner />
            {!isOnboarding && !isReimaginedSurface && <GotoShortcuts />}
            {isOnboarding || isReimaginedSurface ? (
              <Outlet />
            ) : (
              <AppFrame>
                <Outlet />
              </AppFrame>
            )}
            {/* THIS MOUNTS ASK. There is no command palette any more, and as
                  of 2026-08-21 that is a ruling rather than an accident.
                  `GlobalComposer` returns `<AskDock>`; Cmd+K is bound in
                  `ask-context.tsx` beside the state it toggles.

                  WHY THE PALETTE WENT, in one line each, with the full record
                  and the two written contracts it reverses in
                  docs/decisions/palette-retired-2026-08.md. It had no key: ⌘K
                  is Ask's by the founder's 2026-07-30 call. It had no door:
                  nothing in `src/` ever dispatched `supaprod:open-cmdk`. It had
                  no reader: Rollup tree-shook it out of the production build
                  entirely. And every job the July rulings held it for is now
                  done by something mounted -- `GotoShortcuts` below for the
                  chords, `FindAnything` for search-by-name, `ShortcutSheet` for the
                  chord table. Its data survives on purpose in
                  `lib/palette-catalog.ts` and `lib/palette-sections.ts`,
                  because the capability list is the one thing with no other
                  home; it is filed as a board item, not deleted.

                  WHAT THIS LINE COST TWICE, so nobody pays it a third time.
                  This is what a reader checks to answer "is the palette live?",
                  and stopping at `<GlobalComposer />` being mounted said yes
                  for a year while the answer was no. A mount is not a render.
                  Addendum 1.1 rule 8 keeps retired UI in the tree unmounted,
                  and it was suspended here deliberately: two dead hosts nobody
                  could reach cost two sessions and nearly bought a ruling taken
                  on the belief that four palette verbs were lying to users in
                  production. Recoverability that reads as live code is a trap,
                  not a safety net. */}
            {!isOnboarding && <GlobalComposer />}
            {/* The focus dock is RETIRED by the rebuild (2026-07-29). The
                approved shell is four regions and not eight, and a fixed
                bottom-center sliver floating over the work is a fifth. It was
                already dropped from the room by the founder's Gate 1
                retirements, and AppFrame now wraps every surface, so scoping it
                per route would only have kept it alive on the pages being
                ported. FocusDock.tsx stays in the tree unmounted (Addendum 1.1
                rule 8) rather than deleted, so the countdown behaviour is
                recoverable if the founder wants it back inside a region. */}
          </AskProvider>
        </FlowModeProvider>
      </WorkspaceProvider>
    </div>
  );
}
