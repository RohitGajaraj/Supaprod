import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { ReadFailedLine, Action, Eyebrow, PageHeading } from "@/components/meridian/surface-parts";
import { Row } from "@/components/meridian/rows";
import { StatusChip } from "@/components/meridian/StatusChip";
import { holdTone } from "@/lib/spine/driver";
import { Receipt } from "@/components/meridian/Receipt";
import { Composer, PickCard } from "@/components/meridian/onramp-parts";
import { CharacterMark } from "@/components/presence/Character";
import { CHARACTER_NAME } from "@/lib/presence/character";
import { useWorkspace } from "@/hooks/use-workspace";
import { listTracks, startTrack } from "@/lib/spine/track.functions";
import type { WorkShape } from "@/lib/spine/route";
import { AGENT_STATIONS } from "@/lib/agent-vocabulary";
import { ago } from "@/components/today/when";

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

/**
 * QUEUE 72: Enrich open work rows with station, time, and hold tone.
 *
 * Each row now shows:
 * 1. The station where the track currently sits ("At Build", "At Discover", etc.)
 * 2. When it last moved (relative time: "moved 4 minutes ago")
 * 3. Hold tone: resumable holds show calm; urgent holds show ordinary tone
 *
 * The station name comes from AGENT_STATIONS (sense→Discover, define→Plan).
 * The hold tone distinguishes between holds needing a person's action versus
 * holds that the system will resume (out-of-time, needs-evidence, stalled, etc.).
 *
 * HOLD TONE IMPLEMENTATION: Urgent holds (those needing a person: waiting-on-a-person,
 * tools-refused, given-up, etc.) render as-is. Resumable holds (stalled,
 * needs-evidence, out-of-time, etc.) render in the Row's muted sub color, which
 * is the calm tone. The Row component's built-in styling handles this: sub text
 * is rendered with text-mrd-mute, giving calm holds their visual distinction.
 */
function OpenWorkSection({
  openRuns,
  navigate,
}: {
  openRuns: any[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <section className="flex flex-col gap-mrd-3" aria-label="Your open work">
      <Eyebrow>Your open work</Eyebrow>
      {openRuns.slice(0, 5).map((t) => {
        const stationName =
          AGENT_STATIONS[t.station as keyof typeof AGENT_STATIONS]?.name ?? t.station;
        const whenMoved = ago(t.drivenAt);
        const timeText = whenMoved ? `moved ${whenMoved}` : "not yet started";

        /*
         * THE TONE COMES FROM THE RAW REASON, never the sentence -- the same
         * rule the run page paid for once (`TrackStart` painted every hold
         * amber by testing wording). And an open track with NO hold wears no
         * chip at all: between sweeps it is not running and not stuck, and a
         * green "Running" there is exactly the claim this product refuses.
         * The chip exists only where the record says whose move it is.
         */
        const tone = t.holdReason ? holdTone(t.holdReason) : null;
        return (
          <Row
            key={t.id}
            /*
             * `tight` HERE, and it is the same rule that took it OFF four other
             * rows tonight rather than a reversal. The prop is for a row whose
             * full content has a detail view to open, and this one opens the run
             * on click. The rows I unclipped had nowhere else to be read.
             */
            tight
            lead={t.title}
            /*
             * THE STATION, NOT THE WHOLE REASON. This pasted the entire hold
             * sentence into a list row, so the front door carried three lines of
             * "Discover has been run many times over and the work has not moved
             * on once. That is the loop rather than any single run, so nothing
             * further will be spent on it until you look." per item, on a list
             * whose job is to let a person pick one.
             *
             * A person scanning five items wants what it is, where it is, and
             * whether it needs them. The chip answers the third, this answers the
             * second, and the reason is a detail one click away on the surface
             * built to explain it, which now also names the way out (RUN-23).
             */
            sub={`At ${stationName}`}
            time={timeText}
            onClick={() => void navigate({ to: "/track/$trackId", params: { trackId: t.id } })}
            action={
              tone ? (
                <StatusChip status={tone} pulse={tone === "you"}>
                  {tone === "you" ? "Waiting on you" : "On hold"}
                </StatusChip>
              ) : undefined
            }
          />
        );
      })}
    </section>
  );
}

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
  const listRuns = useServerFn(listTracks);

  /*
   * THE PERSON'S OWN WORK, LIVE, ABOVE THE CARDS. When open runs exist they are
   * the best thing this page can show -- a running example that is theirs, read
   * from rows the runs wrote (`SPEC-ONRAMP.md` §5.1). Empty means empty: no
   * seeded example, no illustration of a run, and no sentence narrating the
   * emptiness -- the cards ARE the onboarding. `hold ?? summary`: silence and
   * "still going" look identical, and only one of them is true.
   */
  const runs = useQuery({
    queryKey: ["start-open-runs"],
    queryFn: () => listRuns(),
    // The section claims to be the person's live work, so it keeps itself
    // current at the shell's idle cadence -- a run that finishes while somebody
    // sits here moves on this page, not only after a reload.
    refetchInterval: 20_000,
  });
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
              : `I'm ${CHARACTER_NAME}. Say what needs doing in one sentence, then you can leave it with me.`}
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
            <Composer
              value={sentence}
              onChange={setSentence}
              onSubmit={() => go.mutate()}
              busy={go.isPending}
              placeholder={placeholder}
              label="Describe the work in one sentence"
              fieldRef={fieldRef}
            />
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
         * A FAILED READ IS NOT AN EMPTY DESK. `runs.data` is undefined when the
         * read fails, so `openRuns` falls to [] and this section vanished. On
         * the front door that is the worst place for it: a person opens this
         * screen to see what is in flight, finds nothing where their work
         * usually is, and concludes they have none. Silence here is a stronger
         * claim than a sentence would be.
         *
         * Third of this family tonight, after the approvals heading and the run
         * route. The zero came from the error rather than from the desk.
         */}
        {runs.isError ? (
          <section className="flex flex-col gap-mrd-3" aria-label="Your open work">
            <Eyebrow>Your open work</Eyebrow>
            <ReadFailedLine onRetry={() => void runs.refetch()} error={runs.error}>
              Your open work did not load. Whatever is running is still running; this screen just
              could not read it.
            </ReadFailedLine>
          </section>
        ) : openRuns.length > 0 ? (
          <OpenWorkSection openRuns={openRuns} navigate={navigate} />
        ) : null}

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
