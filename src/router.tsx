import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

// LOOM W1 - route-level pending fallback. Navigation must never flash a dead
// black frame (DESIGN-LOOM §9): this renders a quiet, theme-safe shimmer
// while a route's beforeLoad/loader work runs. Inline styles only - it also
// mounts on public (parchment) routes, so it reads on both themes.
function RoutePending() {
  return (
    <div
      aria-hidden="true"
      style={{
        minHeight: "40vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 220,
          height: 3,
          borderRadius: 99,
          background:
            "linear-gradient(90deg, rgba(127,209,220,0.0), rgba(127,209,220,0.5), rgba(127,209,220,0.0))",
          backgroundSize: "280% 100%",
          animation: "cadShimmer 1.6s linear infinite",
        }}
      />
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
    defaultPendingMs: 150,
    defaultPendingMinMs: 300,
  });

  return router;
};
