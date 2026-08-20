import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { BrandWait } from "@/components/supaprod/BrandWait";

// The route-level pending fallback, and it is the ONE loader for the whole
// product: `defaultPendingComponent` below covers every route, public and
// authenticated, so replacing it here replaces the wait everywhere at once.
//
// FOUNDER RULING 2026-08-01: it used to draw the lowercase word "supaprod" in
// Geist Pixel over a shimmer bar. "The word 'Super Prod' does not make sense",
// and he is right: the product name is the one fact a person waiting already
// has. It also sat in the middle of the top 40% of the region rather than in
// the middle of the screen, and it was `aria-hidden`, so a screen reader was
// told nothing during the wait.
//
// `BrandWait` carries the seven-petal mark in loader mode instead: the loop
// turning, energy running the curve, the brain pulsing at the core, and a
// second dimmer comet for the record keeping up with the work. See that file
// for why each part of it means something.
function RoutePending() {
  return <BrandWait />;
}

// LOOM W4 - route-level error fallback (DESIGN-LOOM §9: an error may never
// wear an empty state's clothes, and it always ships the cause + one action).
// Inline styles + CSS variables with dark-safe literal fallbacks, since this
// also mounts on public (parchment) routes and before token layers load.
//
// NOTHING IN HERE ANIMATES, AND THAT IS A RULE RATHER THAN AN OVERSIGHT.
// Checked 2026-08-20 while the loading policy below was set: no animation, no
// transition, no spinner. A thing that is still moving reads as a thing still
// trying, and an error has already stopped trying. Motion here would promise a
// recovery that is not coming. The policy is stated in full in
// `src/styles/meridian.css`, under THE LOADING POLICY.
function RouteError({ error }: { error: Error }) {
  const message =
    error instanceof Error && error.message
      ? error.message
      : "Something went wrong while loading this page.";
  return (
    <div
      style={{
        minHeight: "40vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 24,
        textAlign: "center",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 14,
          lineHeight: 1.55,
          maxWidth: "48ch",
          color: "var(--mrd-body, #C6C0B8)",
        }}
      >
        This page hit an error.
      </p>
      <p
        style={{
          margin: 0,
          fontSize: 12.5,
          lineHeight: 1.5,
          maxWidth: "56ch",
          color: "var(--mrd-faint, #A39D94)",
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
          border: "1px solid var(--mrd-line, rgba(255,255,255,0.12))",
          background: "transparent",
          color: "var(--mrd-body, #C6C0B8)",
          cursor: "pointer",
        }}
      >
        Reload the page
      </button>
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient({
    // LOOM W1 - app-wide query hygiene: tab refocus must not refire every
    // mounted query at once (the audit's refetch-storm finding), and data is
    // fresh enough for 30s on every surface that doesn't override this.
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingComponent: RoutePending,
    defaultErrorComponent: RouteError,

    // ── THE LOADING POLICY. Set 2026-08-20. Was 150 / 300. ───────────────
    //
    // These two numbers are the whole policy and this is the ONLY place they
    // may be set. The argument for each is written out in
    // `src/styles/meridian.css` under THE LOADING POLICY; the short version:
    //
    // WHAT WAS WRONG. At 150 / 300 a 200ms navigation crossed the threshold at
    // 150ms, mounted a full-viewport opaque overlay, and was then held there
    // for a further 300ms by the minimum. So a navigation that would have
    // finished in a fifth of a second took nearly half of one, and tore the
    // surface down in the middle of it. Every fast navigation in the product
    // was paying for the loader meant to reassure it, which is the opposite of
    // the design contract's own outstanding item 6: fix the latency, not the
    // spinner.
    //
    // 1000ms is Nielsen's response-time limit for keeping a person's flow of
    // thought uninterrupted, published 1993 and restated by MDN's performance
    // guidance as the point at which you must indicate that content is
    // loading. Below it a person is still in the same thought; a spinner
    // interrupts a wait they had not noticed yet.
    //
    // 150ms, down from 300, is the flicker floor and nothing more. It clears
    // Nielsen's 0.1s instantaneous boundary so the wait registers as a state
    // rather than a glitch, and it is `--mrd-d-move`, so the loader leaves on
    // the same budget as every other dismissal in the system.
    defaultPendingMs: 1000,
    defaultPendingMinMs: 150,
  });

  return router;
};
