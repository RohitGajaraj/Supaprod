import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { WhatWeAlreadyHold } from "@/components/spine/WhatWeAlreadyHold";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Action, PageHeading } from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { Receipt } from "@/components/meridian/Receipt";
import { Composer, PickCard } from "@/components/meridian/onramp-parts";
import { CharacterMark } from "@/components/presence/Character";
import { CHARACTER_NAME } from "@/lib/presence/character";
import { Board } from "@/components/today/Board";
import { useWorkspace } from "@/hooks/use-workspace";
import { startTrack } from "@/lib/spine/track.functions";
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
 * THE CARDS AND THE FIELD ARE MERIDIAN'S NOW. `PickCard` and `Composer` were
 * promoted from this surface's local builds (R-17; see
 * `coordination/answers/Rmrd-jobcard-composer-both-promoted-with-one-real-correction.md`
 * -- which also caught this file's first draft carrying a superseded 1.4 leading,
 * the value Meridian raised to 1.5 on purpose). The job data stays here because
 * it is this page's copy, ruled verbatim by SPEC-ONRAMP §1.3: each sub
 * paraphrases its WorkShape's own waiver reason, and no station name appears on
 * any face (R-01).
 *
 * THE WORKSPACE TRAVELS WITH THE RUN. `startTrack` accepts `workspaceId`
 * gated through the caller's own membership (`resolveStartWorkspace`), and the
 * column is NOT NULL with a default — so passing it when known scopes the run,
 * omitting it is the zero-configuration path, and there was never a
 * silent-null state to guard against (R017 corrected this file's first draft,
 * which claimed a degraded run where Postgres would actually have refused the
 * row outright).
 */

type Job = {
  shape: WorkShape;
  lead: string;
  sub: string;
  /** What the composer asks once this job is picked. */
  placeholder: string;
};

const JOBS: Job[] = [
  {
    shape: "new-capability",
    lead: "I have a problem and I do not know what to build",
    sub: "It reads your sources first and comes back with what the pattern actually is.",
    placeholder: "What is going wrong?",
  },
  {
    shape: "existing-feature",
    lead: "I know what to build. Write it up.",
    sub: "The call is already made, so it starts on the written spec.",
    placeholder: "What are you building, and what should it do?",
  },
  {
    shape: "interface-change",
    lead: "Change something people see",
    sub: "It starts on the screen itself, not on the problem behind it.",
    placeholder: "What should change on the screen, and what should it do?",
  },
  {
    shape: "incident-fix",
    lead: "Something is broken right now",
    sub: "It goes straight to the fix. Nothing gets decided first.",
    placeholder: "What is broken?",
  },
];

/** Placeholder for the un-picked state, ruled at SPEC-ONRAMP §2.1. */
const OPEN_PLACEHOLDER = "What are you changing, and what should it do?";

export const Route = createFileRoute("/_authenticated/start")({
  validateSearch: (search: Record<string, unknown>): { about?: string } => ({
    // RUN-15: the turn-around from Learn lands here with the expectation as
    // the opening sentence, so "take another run at this" starts from what
    // the last attempt learned. A plain string, capped -- the composer is
    // editable and nothing here is a contract, just a head start.
    about:
      typeof search.about === "string" && search.about.trim()
        ? search.about.trim().slice(0, 300)
        : undefined,
  }),
  component: StartLanding,
  head: () => ({ meta: [{ title: "Get started · Supaprod" }] }),
});

function StartLanding() {
  const navigate = useNavigate();
  const { activeWorkspaceId, activeProductId } = useWorkspace();
  const { about } = Route.useSearch();

  // A seeded sentence is a HEAD START, not a decision: the person reads and
  // edits it like anything else they typed.
  const [sentence, setSentence] = useState(about ?? "");
  const [selected, setSelected] = useState<WorkShape | null>(null);
  const fieldRef = useRef<HTMLTextAreaElement | null>(null);

  const start = useServerFn(startTrack);

  /*
   * THE OPEN-WORK READ IS GONE WITH THE SECTION IT FED. `<Board />` owns its
   * own workspace read, its own queries and its own error states, so keeping a
   * second `listTracks` here would poll the same rows on a second cadence to
   * render nothing -- and two reads of one fact is how the strip and the desk
   * came to count differently.
   */

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
          // Passed only when known; omitted is the zero-configuration path --
          // the column default resolves the caller's own default workspace
          // server-side (`resolveStartWorkspace`, R017). The column is NOT
          // NULL, so there was never a silent-null failure mode to guard: an
          // unscoped insert would have been refused outright.
          workspaceId: activeWorkspaceId ?? undefined,
        },
      });
    },
    onSuccess: (res) => {
      if (res.track) {
        // ?start=true is the whole point of the landing: the person watches the
        // work begin instead of pressing a second control. TrackRun's drivenAt
        // guard makes the flag harmless on any revisit.
        void navigate({
          to: "/track/$trackId",
          params: { trackId: res.track.id },
          search: { start: true },
        });
      }
      // res.track === null lands with res.problems rendered below, verbatim.
    },
  });

  const problems = go.data?.problems ?? [];
  const placeholder = selected
    ? (JOBS.find((j) => j.shape === selected)?.placeholder ?? OPEN_PLACEHOLDER)
    : OPEN_PLACEHOLDER;

  /*
   * THE INTRODUCTION MOMENT (SPEC-PRESENCE.md §Anatomy #3). The character is
   * on the first screen by name and is already picking the sentence up while
   * the run is being filed — Ferndesk names its agent on the first screen;
   * Gemini starts before the modal closes. Both states here are facts this
   * page holds: idle is simply true, and the pickup state IS `go.isPending`,
   * the create call in flight. Nothing is staged, so the iron law holds; when
   * the track exists this page hands the person to /track/:id?start=true,
   * where the same character is already mounted at the top of the transcript.
   */
  const pickedUp = go.isPending;

  // A seeded sentence gets the field's focus, because the person arrived to
  // read and press, not to click into a box first.
  useEffect(() => {
    if (about) fieldRef.current?.focus();
    // Fires once on mount; `about` cannot change without a remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-dvh flex-col items-center px-6 py-16">
      <div className="flex w-full max-w-2xl flex-col gap-mrd-7">
        {/*
         * THE COMPARISON ROW IS GONE, AND THE LABEL IS WHY IT HAD TO GO.
         *
         * It read: an eyebrow saying "Supaprod" beside a link saying "Open
         * Supaprod", on the first screen of Supaprod, pointing at /today. Three
         * problems in two elements. The eyebrow repeated the wordmark already
         * sitting in the shell's top left. The link offered to open the product
         * a person is already inside, which is the kind of sentence that makes
         * someone doubt they are where they think they are. And the destination
         * is in the left rail as "Today", one click away, on every screen.
         *
         * It was scaffolding: the founder wanted to compare this against the old
         * board side by side while it was being built. R-15 is cited in the code
         * it came from, but R-15 rules on WHERE to build (final url, not a /v2
         * tree) and asks for nothing on this page. The comparison survives
         * intact through the nav.
         *
         * Removed rather than relabelled because a correct label would leave a
         * lone link floating above a heading, which is worse than no row: the
         * front door of the product is the one screen that should carry nothing
         * a customer does not need.
         */}
        <PageHeading
          title="What needs doing?"
          sub="One sentence starts a run. You watch it happen here, and it asks you nothing unless it must."
        />

        {/* The one worker, present at first paint. aria-live so the handover
            from introduction to pickup is heard, not only seen (R-19). */}
        <div
          data-mrd=""
          data-presence-state={pickedUp ? "thinking" : "awake"}
          className="flex items-center gap-3"
        >
          <CharacterMark size={28} state={pickedUp ? "thinking" : "awake"} />
          <p aria-live="polite" className="text-mrd-body text-mrd-ink">
            {pickedUp
              ? "Picking that up now. I'll open the run the moment it's filed."
              : /*
                 * "YOU CAN LEAVE IT WITH ME" IS THE ONE CLAIM THIS LANE MAY NOT
                 * MAKE ALONE, AND THE CONDITION FOR REVISITING IT HAS NOW BEEN MET.
                 *
                 * SESSION-1 names it: *"'I'm on it, you can leave this page' is a
                 * promise the product cannot keep until S3 ships the verdict
                 * notification, their job #1."* S3 measured the size of the gap
                 * and it is not marginal: **97 of 106 tracks carry a hold, and
                 * the verdict email has fired ZERO times in its life.** Their
                 * send is still blocked on a migration escalated to the founder,
                 * and there is no notification kind for a piece of work that
                 * STOPPED at all.
                 *
                 * I deliberately held this line in RUN-125 and told S3 why: the
                 * sentence is about the ASSIGNMENT moment rather than the run,
                 * and it should change only once the footer's states were proven.
                 * They agreed. RUN-125 and RUN-129 proved them and S0's A10 ruled
                 * the wording, so the condition I set has been met and leaving it
                 * now would be holding a hedge past its own expiry.
                 *
                 * WHAT REPLACES IT IS NOT SMALLER, IT IS TRUE. The work does start
                 * on its own and it does persist, so the invitation survives; what
                 * goes is the implied "and you will be told", which is the half
                 * nothing delivers. `footer-mode.ts` already draws this exact
                 * line: it promises the leg it can prove and never the sweep.
                 */
                `I'm ${CHARACTER_NAME}. Say what needs doing in one sentence and I'll start on it. It keeps going without you, and it will be here when you come back.`}
          </p>
        </div>

        {activeWorkspaceId ? (
          <>
            {about ? (
              /*
               * A SEEDED COMPOSER EXPLAINS ITSELF (RUN-19). A sentence already
               * sitting in the field with no provenance reads as either a bug
               * or a memory of something the person never typed. One line says
               * where it came from and that it is theirs to change.
               */
              <p className="mrd-meta">
                Carried over from the run you just looked at. Edit it freely. It starts however you
                leave it.
              </p>
            ) : null}
            {/*
             * THE DOCK STANDS DOWN HERE, and the mechanism already existed.
             * `one-prompt-per-screen.test.ts` records the rule and Today has
             * carried the mark since it was written: a surface that owns a
             * composer marks it, and `shell.css` hides the collapsed dock row
             * via `:has()`. It was never extended to /start, so the first
             * screen a person meets asked for a sentence twice -- once in this
             * field under "I'm Supa. Say what needs doing in one sentence", and
             * again 500px below in a bar reading "What should we build?".
             *
             * Photographed at 1440. On the one surface whose entire job is that
             * single sentence, and the two do not even do the same thing: F-04
             * measures that the dock files a mission the run workbench cannot
             * see, which is why only 59 tracks have ever existed.
             *
             * `display: contents` so the flex column is unchanged: this adds a
             * fact for CSS to read, not a box.
             */}
            <div data-page-composer className="contents">
              <Composer
                value={sentence}
                onChange={setSentence}
                onSubmit={() => go.mutate()}
                busy={go.isPending}
                placeholder={placeholder}
                label="Describe the work in one sentence"
                fieldRef={fieldRef}
              />
              {/*
                WHAT THIS WORKSPACE ALREADY HOLDS ABOUT IT (F-184's door,
                SPEC-BUILD-PATHS §2.3 -- one step before Discover's connector dry-run,
                which puts it here at creation). `060bc5ff` burned three completed runs
                and three attempts for all three Discover seats to report the workspace
                held nothing about it, on a workspace holding 267 signals from 40
                sources. It TELLS and never gates: nothing here changes what the
                composer does.
              */}
              <WhatWeAlreadyHold subject={sentence} />
            </div>
          </>
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

        {/*
         * ── THE BOARD, AND IT REPLACES THE LIST RATHER THAN SITTING ABOVE IT ──
         * A07: S2 supplies the component, the layout is mine. `/today` and
         * `/runs` fold into this home in the same commit, so this is where the
         * board lives now.
         *
         * **A SWAP AND NOT AN ADDITION, WHICH IS THE WHOLE LAYOUT CALL.** This
         * screen already rendered `OpenWorkSection` -- five tracks, title,
         * station and a status chip. Mounting the board under it would have put
         * TWO lists of the same tracks in one viewport, reading from two
         * different queries, which is the duplication this repo keeps paying
         * for. So the section is deleted, not stacked. S2 confirmed the board's
         * lane rows ARE tracks (`Board.tsx:974` navigates to `/track/$trackId`)
         * and carry the driver's hold sentence, so nothing the old section said
         * is lost.
         *
         * It takes no props and owns its own workspace read, its own queries
         * and its own error states -- including the failed-read case the
         * deleted block existed for, which is why deleting that block does not
         * reintroduce "a failed read is not an empty desk".
         */}
        <Board />

        <div data-mrd="" className="flex flex-col gap-mrd-3">
          <p className="mrd-meta">Pick one if it fits. Not picking is fine.</p>
          <div className="grid grid-cols-1 gap-mrd-3 md:grid-cols-2">
            {JOBS.map((job) => (
              <PickCard
                key={job.shape}
                lead={job.lead}
                sub={job.sub}
                selected={selected === job.shape}
                onSelect={() => {
                  const next = selected === job.shape ? null : job.shape;
                  setSelected(next);
                  if (next) fieldRef.current?.focus();
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
