import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// Tempo v5 - route-level pending fallback. Navigation must never flash a dead
// black frame: this renders the Pixel wordmark over the glacier shimmer while
// a route's beforeLoad/loader work runs, so even the wait carries the brand
// (founder ruling 2026-07-11: Pixel is the hero face; glacier is the AI/info
// blue). Inline styles only - it also mounts on public routes, so every value
// carries a dark-safe literal and reads on both themes.
function RoutePending() {
  return (
    <div
      aria-hidden="true"
      style={{
        minHeight: "40vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
      }}
    >
      <span
        style={{
          fontFamily: '"Geist Pixel Square", ui-monospace, monospace',
          fontSize: 15,
          letterSpacing: "0.18em",
          color: "var(--text-muted, rgb(143, 143, 143))",
          userSelect: "none",
        }}
      >
        supaprod
      </span>
      <div
        style={{
          width: 220,
          height: 3,
          borderRadius: 99,
          background:
            "linear-gradient(90deg, rgba(132, 179, 236,0.0), rgba(132, 179, 236,0.5), rgba(132, 179, 236,0.0))",
          backgroundSize: "280% 100%",
          animation: "cadShimmer 1.6s linear infinite",
        }}
      />
    </div>
  );
}

// LOOM W4 - route-level error fallback (DESIGN-LOOM §9: an error may never
// wear an empty state's clothes, and it always ships the cause + one action).
// Inline styles + CSS variables with dark-safe literal fallbacks, since this
// also mounts on public (parchment) routes and before token layers load.
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
          color: "var(--text-body, #C6C0B8)",
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
          border: "1px solid var(--line, rgba(255,255,255,0.12))",
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
    defaultPendingMs: 150,
    defaultPendingMinMs: 300,
  });

  return router;
};
