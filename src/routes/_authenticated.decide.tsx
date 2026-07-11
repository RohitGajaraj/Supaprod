// IA SPINE (2026-07-11): Decide left the rail. The ranked opportunity queue
// lives as the queue tab on Discover; /decide 301-redirects there so every
// old deep link keeps landing. The route file stays (URLs are forever) —
// permanent redirect stub, same pattern as /govern. DecideSurface itself
// still lives at src/components/discover/DecideSurface.tsx for the Discover
// unit's tab merge.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/decide")({
  beforeLoad: () => {
    throw redirect({
      to: "/discover",
      search: { tab: "queue" } as never,
      statusCode: 301,
    });
  },
});
