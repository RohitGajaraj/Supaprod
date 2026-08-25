import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Surface } from "@/components/meridian/Surface";
import { PageHeading } from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { TrackRun } from "@/components/track/TrackRun";
import { useWorkspace } from "@/hooks/use-workspace";
import { getTrack } from "@/lib/spine/track.functions";
import { waiverFor } from "@/lib/spine/route";

/**
 * /track/$trackId -- the one address a piece of work has.
 *
 * THE HOLE THIS CLOSES. `spine_tracks` shipped on 2026-08-01 as the object that
 * walks all seven stations, and its own migration argued for itself on exactly
 * this ground:
 *
 *   "A person needs one address. The learning curve of this product is the
 *    number of nouns in it, and 'your work is eight different things depending
 *    on which page you are on' is the expensive version."
 *
 * It then shipped as a table and stopped. Counted 2026-08-25: 84 authenticated
 * routes in this product and NOT ONE of them showed a track. The fix for "your
 * work is eight different things" was built and never given a ninth page to
 * live on, so it stayed eight.
 *
 * WHY A ROUTE AND NOT A PANEL somewhere existing. It has to be linkable. The
 * test this surface was built against is that a finished run can be sent to
 * somebody, and a tab inside another page cannot be sent to anybody.
 *
 * THE DISCLOSURE LINE (SPEC-ONRAMP §2.6) answers the two questions a person
 * has the moment they land: whose ground is this running on, and is anything
 * being skipped. Both are read from the row -- workspace and product from the
 * session, the skip sentence only when `waiverFor` says the route actually
 * waived Decide. Nothing here is disclosed before the run starts; the landing
 * navigates first and this page says what it landed on. No control sits on the
 * line, because there is no working door to change either fact yet -- a control
 * that reported success and wrote nothing is the exact defect this codebase
 * keeps deleting.
 */
export const Route = createFileRoute("/_authenticated/track/$trackId")({
  component: TrackPage,
  head: () => ({ meta: [{ title: "Run · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Track] route crashed:", error);
    return (
      <Surface>
        <PageHeading
          title="This run did not load."
          sub="Reload the page. Nothing about the run itself is lost -- every station writes its own row as it goes."
        />
      </Surface>
    );
  },
});

function TrackPage() {
  const { trackId } = Route.useParams();
  const { activeWorkspace, activeProduct, productsVisible } = useWorkspace();

  const get = useServerFn(getTrack);
  const trackQ = useQuery({
    queryKey: ["track", trackId],
    queryFn: () => get({ data: { trackId } }),
  });
  const track = trackQ.data ?? null;
  const decideWaived = track ? waiverFor(track.route, "decide") !== null : false;

  return (
    <Surface>
      <div className="flex flex-col gap-mrd-7">
        <PageHeading
          title="This piece of work"
          sub="Where it sits on its route, what each station produced, and who is working on it now."
        />
        {track ? (
          <Row
            tight
            lead={`Running in ${activeWorkspace?.name ?? "your workspace"}${
              productsVisible && activeProduct ? ` · on ${activeProduct.name}` : ""
            }`}
            sub={
              decideWaived
                ? "This one skips the decision, so nothing is being forecast on it."
                : undefined
            }
          />
        ) : null}
        <TrackRun trackId={trackId} />
      </div>
    </Surface>
  );
}
