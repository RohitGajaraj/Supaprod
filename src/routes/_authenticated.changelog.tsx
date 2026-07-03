import { createFileRoute, redirect } from "@tanstack/react-router";

// /changelog folded into Brain per OBS-10 (IA consolidation): the shipped
// record is now the "Changelog" tab on /knowledge (ChangelogPanel.tsx),
// reading the same listChangelog entries grouped by product the retired page
// rendered.
export const Route = createFileRoute("/_authenticated/changelog")({
  beforeLoad: () => {
    throw redirect({ to: "/brain", search: { tab: "changelog" } });
  },
});
