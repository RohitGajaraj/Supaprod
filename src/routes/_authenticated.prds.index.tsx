import { createFileRoute, redirect } from "@tanstack/react-router";

// /prds folded into Plan per OBS-10 (IA consolidation). /prds/$id stays live
// (Plan's read-only SpecDetail links to it as "Open full spec ->").
export const Route = createFileRoute("/_authenticated/prds/")({
  beforeLoad: () => {
    throw redirect({ to: "/plan" });
  },
});