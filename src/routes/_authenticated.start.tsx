import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { searchFlag } from "@/lib/search-flag";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Receipt } from "@/components/meridian/Receipt";
import { Row } from "@/components/meridian/rows";
import { Action, Door } from "@/components/meridian/surface-parts";
import { Composer } from "@/components/meridian/onramp-parts";
import { ExampleJobs, type ExampleJob } from "@/components/start/ExampleJobs";
import { YourRuns } from "@/components/start/YourRuns";
import { Arriving } from "@/components/start/Arriving";
import { failureLine } from "@/lib/error-copy";
import { SessionEnded, endedSessionFor } from "@/components/system/SessionEnded";
import { useWorkspace } from "@/hooks/use-workspace";
import { listRunsForStart, startTrack } from "@/lib/spine/track.functions";
import type { WorkShape } from "@/lib/spine/route";

/**
 * ── THE FRONT DOOR, AND WHAT IT USED TO ASK BEFORE IT ASKED ANYTHING ──────
 *
 * A1's audit named the first of five symptoms as "landing says nothing", and
 * this page was where it started. Signed in, a person met, in order: an errand
 * line, **"Good evening."**, a heading, a character introducing itself, a
 * composer, a four-card picker of work SHAPES, a "what we already hold" panel,
 * and then the whole board -- days on the record, a forecast tally, lanes.
 * Eight regions before the one thing a person came to do.
 *
 * The shape picker is the sharpest of them. It asked a person to classify their
 * work -- "New capability", "Under the hood" -- before describing it, and all it
 * changed was the composer's placeholder and a column on the row. That is the
 * taxonomy question a product asks when it has not decided what it does, and
 * nobody arrives wanting to answer it.
 *
 * ── WHAT IT IS NOW, AND THE ORDER IS THE ARGUMENT ─────────────────────────
 *
 *   one line, first run only   what this product does, said once and then never
 *                              again, because a person who has runs has learnt it
 *   the composer               the one thing they came to do
 *   three example jobs         whole sentences that can be pressed, because the
 *                              fastest way to learn what a product does is to
 *                              watch it do one thing
 *   your runs                  the ONLY way a person meets an approval, a
 *                              verdict or a hold (A1-REPORT §4)
 *
 * ── THE REFERENCE, NAMED BEFORE BUILDING ──────────────────────────────────
 * Codex (Mobbin, pulled 2026-09-02): one question, one box, then three startable
 * cards. Claude Code web: one box whose placeholder is a real greyed example.
 * Cursor: task rows carrying the one fact that tells them apart. Devin: a
 * session list with the exception state said in words under the title.
 *
 * ── WHAT LEFT WITH THE BOARD, SAID PLAINLY RATHER THAN QUIETLY ────────────
 * `<Board />` carried "days on the record", the forecast tally, the review queue
 * and the mission lanes. Every one of them is a workspace-wide readout on a page
 * about starting one piece of work, and the queue in particular is now a ROW
 * STATE on a run rather than a second address.
 *
 * ── AND `?queue=1` SURVIVES, WHICH MY FIRST DRAFT GOT WRONG ───────────────
 * I removed it, on the grounds that P-11 took out the rail's Approvals door and
 * nothing set it any more. `tsc` said otherwise: FIVE call sites still navigate
 * here with it -- the notifications section, two onboarding steps, the decisions
 * panel and the crew rail -- and every one of them writes the key as the
 * computed `[REVIEW_QUEUE_SEARCH]`, which is why a grep for `queue: true` found
 * nothing. A whitelist that drops a param five live doors send is five doors
 * that quietly land on the wrong thing.
 *
 * So the errand stays and it LANDS SOMEWHERE TRUE instead of scrolling to an
 * anchor that no longer mounts: the person asked to see what is waiting on
 * them, and what is waiting on them is the runs marked "Needs you", which this
 * page sorts to the top. It says so rather than scrolling silently, because a
 * door that lands somewhere else and corrects itself later is the product not
 * saying what it is doing.
 */
const PLACEHOLDER = "Make the checkout accept an American Express card";

/**
 * The one line, and it is on the screen exactly once in a person's life here.
 *
 * A1-REPORT §4 gives the words and the condition: first run only. An
 * orientation line that stays is a product explaining itself to somebody who has
 * already understood it, which is the same failure as a tooltip that never
 * learns.
 */
const ORIENTATION =
  "Say what you want changed and what it should do. It does the work here, where you can watch, and tells you whether it worked.";

export const Route = createFileRoute("/_authenticated/start")({
  validateSearch: (search: Record<string, unknown>): { about?: string; queue?: true } => ({
    /*
     * "SHOW ME WHAT IS WAITING ON ME." Five live doors set this. `searchFlag`
     * rather than a hand-rolled comparison: TanStack runs every value through
     * `JSON.parse` before a validator sees it, so `?queue=1` arrives as the
     * NUMBER 1 and a string comparison misses it -- the defect this repo has
     * shipped four times, three of them found only by walking the page.
     */
    queue: searchFlag(search.queue),
    /*
     * A sentence carried in from somewhere else -- the ask pane, a link -- as a
     * HEAD START rather than a decision: it lands in the composer and the person
     * reads and edits it like anything else they typed.
     */
    about:
      typeof search.about === "string" && search.about.trim()
        ? search.about.trim().slice(0, 300)
        : undefined,
  }),
  component: StartLanding,
  head: () => ({ meta: [{ title: "Start · Supaprod" }] }),
});

function StartLanding() {
  const navigate = useNavigate();
  const { activeWorkspaceId, activeProductId } = useWorkspace();
  const { about, queue } = Route.useSearch();

  const [sentence, setSentence] = useState(about ?? "");
  const fieldRef = useRef<HTMLTextAreaElement | null>(null);
  const start = useServerFn(startTrack);

  /*
   * THE SAME CACHE ENTRY `YourRuns` POLLS, on purpose. The orientation line
   * hangs on whether this workspace has ever had a run, and that is the same
   * question the list below answers. A private read here would ask the server
   * twice for one fact and let the two answers drift, which is the drift the run
   * screen has been repaired for twice.
   */
  const fRuns = useServerFn(listRunsForStart);
  const runs = useQuery({
    queryKey: ["start-runs"],
    queryFn: () => fRuns(),
    refetchInterval: 10_000,
  });
  /* Only once the read has ANSWERED. Showing the first-run line while the read
     is in flight would flash it at every returning person on every visit. */
  const firstRun = runs.data !== undefined && runs.data.length === 0;

  const go = useMutation({
    mutationFn: async (job?: ExampleJob) => {
      const s = (job?.sentence ?? sentence).trim();
      const shape: WorkShape = job?.shape ?? "new-capability";
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
          // server-side (`resolveStartWorkspace`, R017).
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

  /*
   * ── A THROWN START RENDERED NOTHING AT ALL, AND STILL MUST NOT ──────────
   * `problems` reads `go.data`, which exists only when the call RESOLVED and the
   * validator refused. When `startTrack` THROWS -- a dropped network, an expired
   * session, a 500 -- `go.data` stays undefined, the button un-busies, and the
   * screen says nothing while the person looks at their own sentence with no
   * idea whether it was filed. Two different failures, two different sentences:
   * a refusal names what to change, a throw says the sentence is safe.
   */
  const problems = go.data?.problems ?? [];

  // A seeded sentence gets the field's focus, because the person arrived to
  // read and press, not to click into a box first.
  useEffect(() => {
    if (about) fieldRef.current?.focus();
    // Fires once on mount; `about` cannot change without a remount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /*
   * ONE DEAD SESSION, SAID ONCE, ON A WHOLE PAGE (P-15, adopting the
   * component S3 and S1 already built for Brain, the settings boundary pane
   * and /learn, rather than a fourth copy). `runs` is the same cache entry
   * `YourRuns` polls, which is the page's own read; a dead session fails it
   * page-wide, so checking it here is enough. This page carries no heading
   * of its own (P-05's own scope: "nothing else on the page"), so `title`
   * names the surface for the one screen that needs to, here.
   */
  const sessionEnded = endedSessionFor(runs.error);
  if (sessionEnded) {
    return (
      <SessionEnded title="Start" error={runs.error}>
        Nothing you were about to do is lost.
      </SessionEnded>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[62rem] flex-col gap-mrd-6 px-mrd-5 py-mrd-6">
      {firstRun ? <p className="text-mrd-base text-mrd-mute">{ORIENTATION}</p> : null}

      {/*
       * THE ERRAND, ANSWERED IN WORDS RATHER THAN BY A SCROLL. A person pressed
       * a door reading "things waiting on you"; the honest landing is a sentence
       * saying where they are, not a page that looks like an invitation to start
       * something new and silently corrects itself three seconds later.
       */}
      {queue ? (
        <p role="status" className="text-mrd-base text-mrd-mute">
          The things waiting on you are the runs marked <strong>Needs you</strong> below. They sort
          to the top.
        </p>
      ) : null}

      {/* `data-page-composer` stands the ask dock down: one prompt per screen,
          and this is the one. See `one-prompt-per-screen`. */}
      <div data-page-composer>
        <Composer
          value={sentence}
          onChange={setSentence}
          onSubmit={() => go.mutate(undefined)}
          busy={go.isPending}
          placeholder={PLACEHOLDER}
          label="Describe the work in one sentence"
          fieldRef={fieldRef}
        />
      </div>

      {/*
       * A REFUSAL AND A THROW ARE DIFFERENT, AND BOTH ARE SAID.
       * Directly under the composer, because that is where the person is
       * looking and because the thing they need is still in the field.
       */}
      {problems.length > 0 ? (
        <Receipt verb="Nothing was started" consequence={problems.join(" ")} failed />
      ) : null}
      {go.isError ? (
        <Receipt
          verb="Nothing was started"
          /* A STATEMENT OF STATE, NOT AN OFFER. `failureLine` appends a second
             sentence this call site cannot see -- the server's own copy, or
             "Your session ended. Sign in again and this will load." -- and an
             offer can be refuted by that where a statement cannot. "Press it
             again" is exactly the shape the guard forbids, and it would read as
             an instruction beside a sentence saying the session is over. */
          consequence={failureLine(
            "Your sentence is still in the box and nothing was filed.",
            go.error as Error,
          )}
          failed
        />
      ) : null}

      {!activeWorkspaceId ? (
        <Row
          lead="This account has no workspace yet."
          sub="A run belongs to one, so there is nowhere to file this until there is one."
          action={
            <Action onClick={() => void navigate({ to: "/settings", search: {} })}>
              Open Settings
            </Action>
          }
        />
      ) : null}

      <ExampleJobs onStart={(job) => go.mutate(job)} busy={go.isPending} />

      <YourRuns />

      {/*
       * ── WHAT IS ARRIVING, UNDER THE RUNS (founder, 2026-09-02 19:12) ─────
       *
       * Below the runs on purpose: a person's own work outranks the evidence
       * that has not become work yet. But it is on this page at all because the
       * product's central claim -- evidence becomes work on its own -- was
       * provable only on a station page most people never open, while the page
       * they actually land on said nothing about it.
       */}
      <Arriving />

      {/*
       * ── TWO DOORS THAT ARE NOT RAIL ENTRIES (A1, from the founder) ───────
       *
       * P-11 cut the rail to three doors, which is right, and for the hours
       * between that and this page Brain and Discover had no door at all. A
       * capability nobody can reach is a capability that does not exist, and the
       * fix is not to put them back in the rail: they are places a person visits
       * occasionally and deliberately, which is what a quiet link at the foot of
       * the page is for and what a rail row is not.
       *
       * NAMED FOR WHAT IS BEHIND THEM, not for the noun we call it. "Brain" is
       * our word; "every decision, what it expected, what happened" is the thing.
       * The Arriving region above carries the other one on its own line, so this
       * is one link rather than two.
       *
       * `/outcomes` and `/arriving` (P-14a, 2026-09-02): both were the
       * swap-one-string change this comment named in advance, now made.
       */}
      <Door onClick={() => void navigate({ to: "/outcomes", search: {} })}>
        Outcomes: every decision, what it expected, what happened
      </Door>
    </div>
  );
}
