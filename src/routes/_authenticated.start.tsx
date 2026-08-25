import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Action, Eyebrow, PageHeading } from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { Receipt } from "@/components/meridian/Receipt";
import { RunComposer } from "@/components/shell/RunComposer";
import { JOBS, JobCards, OPEN_PLACEHOLDER } from "@/components/shell/JobCards";
import { useWorkspace } from "@/hooks/use-workspace";
import { listTracks, startTrack } from "@/lib/spine/track.functions";
import type { WorkShape } from "@/lib/spine/route";

/**
 * /start -- say one sentence, land on the run.
 *
 * THE GATE THIS FILE LOST. This route sat behind a redirect to /onboarding
 * marked "GATED FOR LAUNCH: experimental and incomplete". Backlog item 2
 * removes the gate instead of creating a route, because R-15 rules that a
 * REPLACEMENT ships at its own url beside the thing it replaces: `/today` --
 * the briefing dashboard DESIGN-DIRECTION rejected -- stays reachable and
 * untouched so the founder can compare them side by side, and promotion is one
 * redirect in `_authenticated.tsx`'s beforeLoad. Nothing existing was modified
 * to make this page exist.
 *
 * WHAT A RUN NEEDS FROM A PERSON, AND NO MORE. One sentence; optionally which
 * of four jobs describes it. The sentence doubles as the origin, because three
 * of four shapes enter below Discover and `validateRoute` refuses those with an
 * empty origin (`route.ts:469`) -- and the person's own words are exactly what
 * Learn later grades the outcome against (`SPEC-ONRAMP.md` §2.3). No workspace
 * picker, no product picker, no shape picker, no advanced disclosure: those are
 * configuration, and configuration is what this surface exists to end.
 *
 * KNOWN GAP, NOT HIDDEN. `startTrack` cannot carry a workspace yet
 * (`coordination/requests/017-workspaceid-through-starttrack.md`), so tracks
 * started here carry null until MAIN lands REQ-1. The composer already reads
 * `activeWorkspaceId`, refuses to submit without one, and passes
 * `workspaceId` the day the validator accepts it -- not before, because an
 * unknown key trips Zod.
 */
export const Route = createFileRoute("/_authenticated/start")({
  component: StartLanding,
  head: () => ({ meta: [{ title: "Get started · Supaprod" }] }),
});

function StartLanding() {
  const navigate = useNavigate();
  const { activeWorkspaceId, activeProductId } = useWorkspace();

  const [sentence, setSentence] = useState("");
  const [selected, setSelected] = useState<WorkShape | null>(null);
  const fieldRef = useRef<HTMLTextAreaElement | null>(null);

  const start = useServerFn(startTrack);
  const listRuns = useServerFn(listTracks);

  /*
   * THE PERSON'S OWN WORK, LIVE, ABOVE THE CARDS. When open runs exist they are
   * the best thing this page can show -- a running example that is theirs, read
   * from rows the runs wrote (`SPEC-ONRAMP.md` §5.1). Empty means empty: no
   * seeded example, no illustration of a run, and no sentence narrating the
   * emptiness -- the cards ARE the onboarding. `hold ?? summary`: silence and
   * "still going" look identical, and only one of them is true.
   */
  const runs = useQuery({ queryKey: ["start-open-runs"], queryFn: () => listRuns() });
  const openRuns = runs.data ?? [];

  const go = useMutation({
    mutationFn: async () => {
      const s = sentence.trim();
      const shape = selected ?? "new-capability";
      return start({
        data: {
          // The validator caps title at 200 and throws rather than truncating,
          // so slice here and keep the whole sentence in origin where a route
          // below Discover needs it.
          title: s.slice(0, 200),
          shape,
          origin: shape !== "new-capability" ? s : undefined,
          productId: activeProductId ?? undefined,
        },
      });
    },
    onSuccess: (res) => {
      if (res.track) {
        void navigate({ to: "/track/$trackId", params: { trackId: res.track.id } });
      }
      // res.track === null lands with res.problems rendered below, verbatim.
    },
  });

  const problems = go.data?.problems ?? [];
  const placeholder = selected
    ? (JOBS.find((j) => j.shape === selected)?.placeholder ?? OPEN_PLACEHOLDER)
    : OPEN_PLACEHOLDER;

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-2xl flex-col gap-mrd-7">
        <div className="flex items-baseline justify-between">
          <Eyebrow>Supaprod</Eyebrow>
          {/* The founder compares this against /today side by side (R-15), so
              the old app stays one quiet link away rather than gone. */}
          <a href="/today" className="mrd-meta transition-colors hover:text-mrd-body">
            Open Supaprod
          </a>
        </div>

        <PageHeading
          title="What needs doing?"
          sub="One sentence starts a run. You watch it happen here, and it asks you nothing unless it must."
        />

        {activeWorkspaceId ? (
          <RunComposer
            value={sentence}
            onChange={setSentence}
            onSubmit={() => go.mutate()}
            busy={go.isPending}
            placeholder={placeholder}
            fieldRef={fieldRef}
          />
        ) : (
          /*
           * The one gate that is genuinely required: a run belongs to a
           * workspace, and inventing one on the person's behalf is the kind of
           * default this product does not make silently.
           */
          <div className="flex flex-col items-start gap-mrd-3">
            <Row
              lead="Pick your workspace first."
              sub="A run writes into one workspace, so it needs to know which."
            />
            <Action variant="quiet" onClick={() => void navigate({ to: "/onboarding" })}>
              Choose your workspace
            </Action>
          </div>
        )}

        {problems.length > 0 ? (
          <Receipt verb="It did not start" consequence={problems.join(" ")} failed />
        ) : null}

        {openRuns.length > 0 ? (
          <section className="flex flex-col gap-mrd-3" aria-label="Your open work">
            <Eyebrow>Your open work</Eyebrow>
            {openRuns.slice(0, 5).map((t) => (
              <Row
                key={t.id}
                lead={t.title}
                sub={t.hold ?? t.summary}
                onClick={() => void navigate({ to: "/track/$trackId", params: { trackId: t.id } })}
              />
            ))}
          </section>
        ) : null}

        <JobCards
          selected={selected}
          onSelect={(shape) => {
            setSelected(shape);
            if (shape) fieldRef.current?.focus();
          }}
        />
      </div>
    </div>
  );
}
