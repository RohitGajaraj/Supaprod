import { createFileRoute, redirect } from "@tanstack/react-router";

// /impact folded into Brain per OBS-10 (IA consolidation); Loom W2-BRAIN then
// merged the Impact tab into "Insights & impact" (tab id "insights"), where
// ImpactLedgerPanel renders as the "Your impact record" section,
// reusing the same getImpactLedger data BrainStatTrio's summary strip already
// read. Nothing lost - the 4-stat breakdown, "Standout calls", name
// customization, copy/download, and the full markdown preview all moved over.
export const Route = createFileRoute("/_authenticated/impact")({
  beforeLoad: () => {
    throw redirect({ to: "/brain", search: { tab: "insights" } });
  },
});
