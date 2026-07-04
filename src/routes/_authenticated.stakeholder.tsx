import { createFileRoute, redirect } from "@tanstack/react-router";

// /stakeholder folded into Plan per OBS-10 (IA consolidation): the pack is
// read-only decision output, same home as the specs it cites receipts from.
// LOOM W2: carries ?view=stakeholders so Plan lands on the pack section
// instead of dropping the intent at the top of the page.
export const Route = createFileRoute("/_authenticated/stakeholder")({
  beforeLoad: () => {
    throw redirect({ to: "/plan", search: { view: "stakeholders" } });
  },
});
