import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

// /traces list lives in the Engine Room's Record room (TRACES view) - LOOM
// W2 repointed this off the retired /govern surface (audit D-25). The
// redirect must fire ONLY on the bare index — this file is also the LAYOUT
// route for /traces/$traceId (the one trace detail surface, screen-6
// ruling), and an unconditional beforeLoad redirect here bounced every
// trace open since the absorption (latent bug surfaced by the screen-7
// verify).
export const Route = createFileRoute("/_authenticated/traces")({
  beforeLoad: ({ location }) => {
    if (location.pathname.replace(/\/+$/, "") === "/traces") {
      throw redirect({ to: "/engine-room", search: { room: "record", view: "traces" } });
    }
  },
  component: Outlet,
});
