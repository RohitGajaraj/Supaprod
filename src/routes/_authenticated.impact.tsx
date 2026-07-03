import { createFileRoute, redirect } from "@tanstack/react-router";

// /impact folded into Brain per OBS-10 (IA consolidation): the impact-ledger
// detail view is now the "Impact" tab on /knowledge (ImpactLedgerPanel.tsx),
// reusing the same getImpactLedger data BrainStatTrio's summary strip already
// read. Nothing lost - the 4-stat breakdown, "Standout calls", name
// customization, copy/download, and the full markdown preview all moved over.
export const Route = createFileRoute("/_authenticated/impact")({
  beforeLoad: () => {
    throw redirect({ to: "/knowledge", search: { tab: "impact" } });
  },
});
