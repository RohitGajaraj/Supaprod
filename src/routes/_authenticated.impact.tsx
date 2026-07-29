import { createFileRoute, redirect } from "@tanstack/react-router";

// /impact used to fold into Brain (?tab=insights), where ImpactLedgerPanel
// rendered as "Your impact record".
//
// RE-POINTED 2026-07-29 (rebuild step 4). Brain's justification pass moved the
// impact ledger to /learn, on the grounds that the ledger is what a shipped bet
// TAUGHT you and Brain is for recall with the receipt. The old target still
// resolved, because LEGACY_TABS maps "insights" onto the decisions tab, so this
// redirect would have landed on a real page that no longer holds what it
// promised. A link that lands somewhere real and wrong is worse than one that
// fails, because nothing tells you it went wrong. Verified: /learn renders
// getImpactLedger.
export const Route = createFileRoute("/_authenticated/impact")({
  beforeLoad: () => {
    throw redirect({ to: "/learn" });
  },
});
