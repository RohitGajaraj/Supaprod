/**
 * Discover, the route shell. The surface's five answers live next to the
 * component, in src/components/discover/DiscoverSurface.tsx.
 *
 * The first decision in this file: ?tab=queue and ?tab=opportunities now
 * REDIRECT to /decide instead of quietly landing on a desk that has no queue
 * on it. The ranked queue left this surface on 2026-07-13; the legacy links
 * (the command palette, /opportunities, the receipt sheet, the lineage
 * drawer) kept pointing here and got a page that did not answer them. A deep
 * link either lands on the thing it names or it is broken, and this one was
 * broken quietly, which is worse.
 *
 * ?tab=signals still validates and lands here, because that IS this surface.
 *
 * THE SECOND DECISION, and it is a repair of the first one's own law
 * (2026-08-02). `?focus=` was BROKEN IN EXACTLY THE WAY THE PARAGRAPH ABOVE
 * DESCRIBES, and a comment on the spec page claimed the opposite: the spec's
 * "Why this spec exists" rows navigate here with `{ tab: "signals", focus:
 * s.id }` and a note saying the old link dropped the id "audit D-14". The id
 * was still being dropped, one layer later. `validateSearch` is the parser for
 * this route, it returned only `tab`, so the router discarded `focus` before
 * any component could read it, and the surface never read it either. Clicking
 * a signal on a spec landed you on whichever cluster happened to rank first,
 * with nothing saying why. The parser keeps it now and the route hands it to
 * the surface, which resolves it to the cluster that signal belongs to.
 *
 * Deliberately UNTYPED beyond `string`. What arrives is a signal id today and
 * could be a theme id tomorrow (the surface resolves either), and a parser
 * that guessed which one it was holding would be asserting something the URL
 * does not say.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { DiscoverSurface } from "@/components/discover/DiscoverSurface";
import { Block, Button, Empty, PageHead, Surface } from "@/components/shell/primitives";

export type DiscoverTab = "signals" | "queue";

/** The route's own component, so the deep-link contract stays in the file that
 *  documents it and the surface takes it as a plain prop. Reading the search
 *  from inside the component would mean the component importing the route that
 *  imports the component. */
function DiscoverRoute() {
  const { focus } = Route.useSearch();
  if (focus === "__probe_forced_error__") throw new Error("probe: forced render failure");
  return <DiscoverSurface focus={focus} />;
}

export const Route = createFileRoute("/_authenticated/discover")({
  // Validated so a mangled link degrades to the plain surface rather than
  // crashing. The retired "opportunities" value maps onto the queue token so
  // both legacy spellings take the same redirect below.
  validateSearch: (search: Record<string, unknown>): { tab?: DiscoverTab; focus?: string } => ({
    tab:
      search.tab === "queue" || search.tab === "opportunities"
        ? "queue"
        : search.tab === "signals"
          ? "signals"
          : undefined,
    focus: typeof search.focus === "string" && search.focus ? search.focus : undefined,
  }),
  beforeLoad: ({ search }) => {
    if (search.tab === "queue") throw redirect({ to: "/decide" });
  },
  component: DiscoverRoute,
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
