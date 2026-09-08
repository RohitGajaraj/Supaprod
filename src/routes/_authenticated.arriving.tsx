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
 *
 * THE THIRD DECISION, `?capture=1`, and it is the SAME repair a second time
 * (2026-08-21, K-37). The capture box sits at roughly line 3,140 of a
 * 3,440-line surface, deliberately below the ranked reading -- the surface's
 * own comments say so at :2166 and :2193 ("Or capture it yourself below"). So
 * every control labelled "Capture a signal" that navigated to a bare
 * `/discover` landed the person on the right station with the box off screen,
 * which is the standard this file's own header sets and fails: a deep link
 * either lands on the thing it names or it is broken. Two such controls are
 * live today (`_authenticated.brain.tsx:1482` and
 * `GraphCanvasView.tsx:323`), and the palette's re-pointed verb is a third.
 *
 * Parsed as a BOOLEAN by `searchFlag`, and it accepts `1`, `"1"`, `true` and
 * `"true"`. It is a flag rather than an id, so unlike `focus` there is nothing
 * here the URL could be holding that a type would be guessing at.
 *
 * THE FOUR SPELLINGS ARE NOT DEFENSIVENESS, they are the bug. This line first
 * shipped as `search.capture === "1"`, which reads correctly and never fired:
 * the router runs every search value through `JSON.parse` before a validator
 * sees it, so `?capture=1` arrives as the NUMBER 1. The param was therefore
 * dropped by its own parser and the landing silently did nothing -- the third
 * time this one route has held that exact defect. It was caught by measuring
 * the page in a browser, because an inline `validateSearch` is only ever
 * exercised by the router and no unit test in this repo could reach it. That is
 * why the parser now lives in `src/lib/search-flag.ts`, where one can.
 */
import { createFileRoute, redirect } from "@tanstack/react-router";
import { DiscoverSurface } from "@/components/discover/DiscoverSurface";
import { searchFlag } from "@/lib/search-flag";
import { Surface } from "@/components/meridian/Surface";
import { Action, NothingHere, PageHeading } from "@/components/meridian/surface-parts";
import { useWorkspace } from "@/hooks/use-workspace";
import { useStampTheLastLook } from "@/components/start/use-stamp-the-last-look";

export type DiscoverTab = "signals" | "queue";

/** The route's own component, so the deep-link contract stays in the file that
 *  documents it and the surface takes it as a plain prop. Reading the search
 *  from inside the component would mean the component importing the route that
 *  imports the component. */
function DiscoverRoute() {
  const { focus, capture } = Route.useSearch();
  /*
   * ── THE VISIT IS STAMPED HERE, AT THE MOUNT (P-69) ──────────────────────
   *
   * `brain_last_seen` had a reader (Start's "since you last looked") and no
   * writer, so every workspace read "You have not looked yet" against a full
   * record, forever. This is the writer, and it is at the ROUTE's mount rather
   * than inside `DiscoverSurface`'s reads deliberately: a refetch, a prefetch
   * and a retry are reads, and none of them is a person looking.
   *
   * ABOVE THE PROBE THROW, so the hook order cannot change between renders --
   * a hook after a conditional throw is the rules-of-hooks defect, and the
   * throw below is exactly such a condition.
   */
  const { activeWorkspaceId } = useWorkspace();
  useStampTheLastLook(activeWorkspaceId);
  if (focus === "__probe_forced_error__") throw new Error("probe: forced render failure");
  return <DiscoverSurface focus={focus} capture={capture} />;
}

export const Route = createFileRoute("/_authenticated/arriving")({
  // Validated so a mangled link degrades to the plain surface rather than
  // crashing. The retired "opportunities" value maps onto the queue token so
  // both legacy spellings take the same redirect below.
  validateSearch: (
    search: Record<string, unknown>,
  ): { tab?: DiscoverTab; focus?: string; capture?: boolean } => ({
    tab:
      search.tab === "queue" || search.tab === "opportunities"
        ? "queue"
        : search.tab === "signals"
          ? "signals"
          : undefined,
    focus: typeof search.focus === "string" && search.focus ? search.focus : undefined,
    // `searchFlag`, not an inline comparison. The first draft of this line read
    // `search.capture === "1"` and dropped the param on every real link,
    // because the router JSON-parses first and hands a validator the NUMBER 1.
    // See src/lib/search-flag.ts for why that is not a detail.
    capture: searchFlag(search.capture),
  }),
  beforeLoad: ({ search }) => {
    // P-14 (A-QUEUE.md, R-34): /decide is deleted; its own redirect stub
    // would only bounce this on to /start a second hop later. The ranked
    // queue's real home is Start's own top-opportunities read, which needs
    // no tab param, so this goes straight there.
    if (search.tab === "queue") throw redirect({ to: "/start" });
  },
  component: DiscoverRoute,
  head: () => ({ meta: [{ title: "Findings · Supaprod" }] }),
  errorComponent: () => (
    <Surface>
      <PageHeading title="Findings did not load." sub="Nothing already captured is lost." />
      {/* NothingHere rather than NothingYet, which is the bordered half of that
          pair. Meridian's rule: the bare one is for a sentence sitting UNDER a
          region heading that already frames it, and the bordered one for where
          the region itself is missing. There is no region on this screen -- the
          error component replaces the whole surface -- so the box is what draws
          the boundary the retired `Block` rule used to draw.

          The reload control moves into `action`, which is the slot the empty
          state has for exactly this. It was a sibling of the `Empty` before
          because the retired primitive's own header records the workaround:
          "an empty state that names who acts next but gives you no way to act
          is only half honest, and every ported surface was wrapping one in a
          Gate to get a button". */}
      <NothingHere
        action={
          <Action variant="primary" onClick={() => window.location.reload()}>
            Reload the page
          </Action>
        }
      >
        Reload and the desk reads again. Every signal the crew has captured is still on the record.
      </NothingHere>
    </Surface>
  ),
});
