// /trust merged into /security (homeless-route homing, 2026-07-11). The
// access / data-isolation / privacy-controls content now lives on /security,
// so old links and crawlers land there instead of a parallel page. This file
// stays only as a permanent redirect; it is retired from the sitemap.
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/trust")({
  ssr: true,
  beforeLoad: () => {
    throw redirect({ to: "/security" });
  },
});
