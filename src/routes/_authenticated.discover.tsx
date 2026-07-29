/**
 * Discover, the route shell. The surface's five answers live next to the
 * component, in src/components/discover/DiscoverSurface.tsx.
 *
 * The one decision in this file: ?tab=queue and ?tab=opportunities now
 * REDIRECT to /decide instead of quietly landing on a desk that has no queue
 * on it. The ranked queue left this surface on 2026-07-13; the legacy links
 * (the command palette, /opportunities, the receipt sheet, the lineage
 * drawer) kept pointing here and got a page that did not answer them. A deep
 * link either lands on the thing it names or it is broken, and this one was
 * broken quietly, which is worse.
 *
 * ?tab=signals still validates and lands here, because that IS this surface.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { DiscoverSurface } from "@/components/discover/DiscoverSurface";
import { Block, Button, Empty, PageHead, Surface } from "@/components/shell/primitives";

export type DiscoverTab = "signals" | "queue";

export const Route = createFileRoute("/_authenticated/discover")({
  // Validated so a mangled link degrades to the plain surface rather than
  // crashing. The retired "opportunities" value maps onto the queue token so
  // both legacy spellings take the same redirect below.
  validateSearch: (search: Record<string, unknown>): { tab?: DiscoverTab } => ({
    tab:
      search.tab === "queue" || search.tab === "opportunities"
        ? "queue"
        : search.tab === "signals"
          ? "signals"
          : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (search.tab === "queue") throw redirect({ to: "/decide" });
  },
  component: DiscoverSurface,
  head: () => ({ meta: [{ title: "Discover · Supaprod" }] }),
  errorComponent: () => (
    <Surface>
      <PageHead title="Discover did not load." sub="Nothing already captured is lost." />
      <Block>
        <Empty>
          Reload and the desk reads again. Every signal the crew has captured is still on the
          record.
        </Empty>
        <Button variant="primary" onClick={() => window.location.reload()}>
          Reload the page
        </Button>
      </Block>
    </Surface>
  ),
});
