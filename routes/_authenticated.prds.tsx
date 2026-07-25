import { createFileRoute, Outlet } from "@tanstack/react-router";

// Layout for /prds. Both children are redirect stubs since LOOM W2:
// /prds -> /plan (prds.index.tsx) and /prds/$id -> /plan/spec/$id.
export const Route = createFileRoute("/_authenticated/prds")({
  component: () => <Outlet />,
});
