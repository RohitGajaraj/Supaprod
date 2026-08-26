/**
 * ADMIN / QUALITY. The nine writes that were living in a product manager's room.
 *
 * 1. WHO IS STANDING HERE, AND WHAT DID THEY COME TO DO?
 *    Whoever runs this workspace, with a specific complaint: the machine got
 *    something wrong and they want a check that catches it next time, or they
 *    want to read the instructions an agent is actually running on. Both are
 *    engineering jobs. Neither is a thing a product lead does.
 *
 * 2. WHY THIS PAGE EXISTS AT ALL.
 *    The Engine Room carries 27 distinct writes. Sorting them by the job they
 *    serve, NINE are eval-suite and prompt-version CRUD -- create, update,
 *    delete, run, and set-active. They sat under a tab strip beside "how well is
 *    the machine scoring today", so a product lead who came to read a score was
 *    handed a suite editor as its peer. That is not a styling problem and no
 *    amount of redrawing fixes it: it is a surface wearing one sign over six
 *    different tools.
 *
 *    Admin already exists and is already role-gated, and its whole stated job is
 *    "change what OTHER people can do". A check that every agent in the
 *    workspace is measured against is exactly that.
 *
 * 3. MOUNTED, NEVER COPIED.
 *    `EvalsPanel`, `EvalSuiteDetail` and `PromptsPanel` are the same components
 *    the Engine Room renders, imported rather than duplicated. A copy would have
 *    been the easier change and would have created two suite editors that drift
 *    -- which is the defect this repo has found on six outward surfaces already.
 *    The ONLY thing that differs between the two homes is where a suite row
 *    leads, so that is the only thing passed in.
 *
 * 4. THE OLD ADDRESSES STILL ANSWER.
 *    `/engine-room?view=suites` and `?view=prompts` still render, and `/evals`
 *    still redirects to the first of them. They simply stop drawing a tab. A
 *    door that is not advertised still opens, and stranding saved links to make
 *    a point about the nav would trade one defect for a worse one.
 *
 * 5. WHAT IS ONE CLICK AWAY INSTEAD OF ON THE SURFACE.
 *    The score itself, the calibration by surface, and the drift trend. Those
 *    are readings, they belong to whoever is judging the work, and they stay in
 *    the Engine Room where a product lead already looks for them.
 */
import * as React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Surface } from "@/components/meridian/Surface";
import { PageHeading, Region } from "@/components/meridian/surface-parts";
import { PanelReading } from "@/components/engine-room/EngineChrome";

const EvalsPanel = React.lazy(() =>
  import("@/components/governance/EvalsPanel").then((m) => ({ default: m.EvalsPanel })),
);
const EvalSuiteDetail = React.lazy(() =>
  import("@/components/governance/EvalSuiteDetail").then((m) => ({ default: m.EvalSuiteDetail })),
);
const PromptsPanel = React.lazy(() =>
  import("@/components/governance/PromptsPanel").then((m) => ({ default: m.PromptsPanel })),
);

interface AdminQualitySearch {
  suite?: string;
}

export const Route = createFileRoute("/_authenticated/admin/quality")({
  validateSearch: (search: Record<string, unknown>): AdminQualitySearch => ({
    suite: typeof search.suite === "string" ? search.suite : undefined,
  }),
  component: AdminQualityPage,
  head: () => ({ meta: [{ title: "Quality · Admin · Supaprod" }] }),
});

function AdminQualityPage() {
  const { suite } = Route.useSearch();
  const navigate = useNavigate();

  /*
   * A suite opens IN PLACE. The panel's default is to send the reader to the
   * Engine Room, which from here would be a page that bounces you somewhere
   * else the moment you click -- the surest way to teach somebody that this
   * page is not the real one.
   */
  const openSuite = (id: string) =>
    void navigate({ to: "/admin/quality", search: { suite: id } });

  if (suite) {
    return (
      <Surface>
        <PageHeading
          title="What we test"
          sub="One check, its runs, and the cases it is failing on."
        />
        <React.Suspense fallback={<PanelReading>Reading the check.</PanelReading>}>
          <EvalSuiteDetail id={suite} />
        </React.Suspense>
      </Surface>
    );
  }

  return (
    <Surface>
      <PageHeading
        title="Quality"
        sub="The checks every agent is measured against, and the instructions they run on. Both change what the whole workspace does, which is why they are here and not in the room where the scores are read."
      />

      <Region
        title="What we test"
        sub="Each check names a surface and a bar it has to clear. A surface with nothing watching it is the gap worth closing first."
      >
        <React.Suspense fallback={<PanelReading>Reading the checks.</PanelReading>}>
          <EvalsPanel onOpenSuite={openSuite} />
        </React.Suspense>
      </Region>

      <Region
        title="Their instructions"
        sub="The prompt each agent actually runs on, and which version is live. Changing the active version changes every run after it."
      >
        <React.Suspense fallback={<PanelReading>Reading the instructions.</PanelReading>}>
          <PromptsPanel />
        </React.Suspense>
      </Region>
    </Surface>
  );
}
