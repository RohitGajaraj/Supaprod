import { createFileRoute, redirect } from "@tanstack/react-router";

// The full spec editor moved to /plan/spec/$id per LOOM W2 (2026-07-04): the
// editor now lives on the Plan spine where its list lives, and the last
// PRD-era URL leaves the user's address bar. Permanent redirect preserving
// the id AND the ?tab= deep link (contract/flow/launch arrivals keep their
// intent — DESIGN-LOOM §9b: redirects never send params their target drops).
// validateSearch stays so existing typed navigations against this path keep
// compiling; /plan/spec/$id normalizes whatever arrives.
const MODE_TABS = ["edit", "preview", "contract", "flow", "launch"] as const;
type ModeTab = (typeof MODE_TABS)[number];

export const Route = createFileRoute("/_authenticated/prds/$id")({
  validateSearch: (search: Record<string, unknown>): { tab?: ModeTab } => {
    const t = search.tab;
    return {
      tab: (MODE_TABS as readonly string[]).includes(t as string) ? (t as ModeTab) : undefined,
    };
  },
  beforeLoad: ({ params, search }) => {
    throw redirect({
      to: "/plan/spec/$id",
      params: { id: params.id },
      search: search as never,
      statusCode: 301,
    });
  },
});
