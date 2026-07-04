import { createFileRoute, redirect } from "@tanstack/react-router";

// /prds folded into Plan per OBS-10 (IA consolidation). Since LOOM W2 the
// full editor lives at /plan/spec/$id and /prds/$id redirects there too.
export const Route = createFileRoute("/_authenticated/prds/")({
  beforeLoad: () => {
    throw redirect({ to: "/plan", search: { view: "specs" } });
  },
});
