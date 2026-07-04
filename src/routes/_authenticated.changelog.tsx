import { createFileRoute, redirect } from "@tanstack/react-router";

// /changelog folded into Brain per OBS-10 (IA consolidation); Loom W2-BRAIN
// then merged the Changelog tab into "Docs & changelog" (tab id "docs"),
// where ChangelogPanel renders the same listChangelog entries.
export const Route = createFileRoute("/_authenticated/changelog")({
  beforeLoad: () => {
    throw redirect({ to: "/brain", search: { tab: "docs" } });
  },
});
