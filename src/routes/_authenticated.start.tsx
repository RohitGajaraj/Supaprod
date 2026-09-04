import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { searchFlag } from "@/lib/search-flag";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { listProductRepos, listRunsForStart, startTrack } from "@/lib/spine/track.functions";
import { listProductGoals } from "@/lib/spine/track.functions";
import { listTopOpportunities } from "@/lib/discovery.functions";
import { matchProductFromSentence, type ProductCandidate } from "@/lib/spine/product-match";
import { ComposerProductPicker } from "@/components/start/ComposerProductPicker";
import type { WorkShape } from "@/lib/spine/route";
import { readHomeAnswers } from "@/lib/start/home-answers.functions";
import { homeAnswers } from "@/components/start/three-answers-above-your-runs";
import { HomeAnswers } from "@/components/start/HomeAnswers";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";
import { APPROVALS_QUEUE_PREFIX } from "@/lib/query-keys";
import { queueShape } from "@/components/approvals/a-queue-is-a-shape-not-a-total";

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
 *   three example sentences    whole sentences, to show what this takes. They
 *                              load into the composer to be edited rather than
 *                              starting a run: we wrote them, so they are not
 *                              this workspace's work and must not be pressed
 *                              as if they were (P-33). Once the workspace has
 *                              ranked bets they replace these, and THOSE start
 *                              on press, because they are its own.
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
 * P-32 PASS 4 (A-QUEUE.md). A1's pass-3 verdict: "the timing marks A3 added
 * are not visible in the browser (no `console` lines, no `performance`
 * marks or measures)" -- true, and structurally so: `withStartReaderTiming`
 * (`track.functions.ts`) wraps the HANDLER, which runs on the server, so its
 * `console.log` reaches the server's own log, never the browser's. No
 * server-side change can fix that; a browser Performance-panel entry has to
 * be made in the browser.
 *
 * Wraps a reader's own `queryFn` with a named `performance.mark`/`measure`
 * pair around the ACTUAL round trip a person's browser makes -- network
 * latency included, which the server's own wall-clock timing never counted.
 * Named per reader, so A1's own Performance-API measurement (already the
 * technique every pass of this packet has used) can read "listRunsForStart:
 * 2,678ms" directly instead of mapping an anonymous `_serverFn` hash to a
 * name by hand.
 */
export function measuredQueryFn<T>(name: string, run: () => Promise<T>): () => Promise<T> {
  return async () => {
    const startMark = `start:${name}:begin`;
    const endMark = `start:${name}:end`;
    performance.mark(startMark);
    try {
      return await run();
    } finally {
      performance.mark(endMark);
      performance.measure(`start:${name}`, startMark, endMark);
    }
  };
}

/**
 * THE DECISION, PULLED OUT SO IT CAN BE TESTED AGAINST REAL DOM VALUES
 * (P-16b, A-QUEUE.md) rather than only through a full route mount --
 * `StartLanding` is not exported and calls `Route.useSearch()`, which needs
 * an actual router match this repo has no working harness for (see
 * `src/routes/__tests__/integration.discover.test.tsx`'s own unfinished
 * skeleton). The judgment itself does not need a router: it only needs
 * whatever `document.activeElement` already is.
 *
 * `document.body`/`null` is what an untouched page reads as. Anything else --
 * a person tabbed here first, the browser's own autofill focused a field --
 * means somebody got here before this effect did, and the composer must not
 * steal it back.
 */
export function shouldClaimComposerFocus(activeElement: Element | null): boolean {
  return activeElement === null || activeElement === document.body;
}

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
  const { activeWorkspaceId, activeProductId, products, productsVisible, setActiveProductId } =
    useWorkspace();
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
  /*
   * -- THE WORKSPACE IS PART OF THE QUESTION, SO IT IS PART OF THE KEY -------
   *
   * Both reads below were keyed on the page alone. React Query caches by key,
   * so switching workspace served the PREVIOUS workspace's runs and bets under
   * the new workspace's name until each read happened to refetch. The server
   * halves were unscoped too, and both are fixed together: a key that omits
   * the workspace and a query that omits the workspace are the same bug told
   * twice, and fixing only one leaves a window where the page is still wrong.
   *
   * Found by making the first second workspace on production and watching it
   * open with another workspace's ranked bets and runs listed as its own.
   */
  const fRuns = useServerFn(listRunsForStart);
  const runs = useQuery({
    queryKey: ["start-runs", activeWorkspaceId ?? null],
    queryFn: measuredQueryFn("listRunsForStart", () =>
      fRuns({ data: { workspaceId: activeWorkspaceId ?? null } }),
    ),
    refetchInterval: 10_000,
  });
  /* Only once the read has ANSWERED. Showing the first-run line while the read
     is in flight would flash it at every returning person on every visit. */
  const firstRun = runs.data !== undefined && runs.data.length === 0;

  /* P-14 (A-QUEUE.md ruling): `/decide`'s 78-bet ranked queue is deleted; the
     ranking's home is here. staleTime matches Arriving's own ("a setting
     rather than a fact about this second"-adjacent reads poll gently) --
     the top three by ICE do not need to be fresher than a page visit. */
  const fBets = useServerFn(listTopOpportunities);
  const bets = useQuery({
    queryKey: ["start-top-opportunities", activeWorkspaceId ?? null],
    queryFn: measuredQueryFn("listTopOpportunities", () =>
      fBets({ data: { workspaceId: activeWorkspaceId ?? null } }),
    ),
    staleTime: 60_000,
  });
  /*
   * P-43 (A-QUEUE.md): a workspace with ranked bets shows them regardless of
   * how many runs it has; a workspace with none shows the static examples
   * only once `runs` has genuinely settled empty -- never while it is still
   * reading (that read is what `firstRun` already gates on above), and never
   * to a returning person whose workspace simply has no bets yet.
   */
  const showExampleJobs = (bets.data && bets.data.length > 0) || firstRun;

  /*
   * WHICH PRODUCT A SENTENCE MEANS (P-16b, A-QUEUE.md, from R-36 and the
   * honest run). A product's repo essentially never changes between
   * changesets, so this reads gently -- `listProductRepos`'s own header on
   * why there is no binding column to read instead.
   */
  const fProductRepos = useServerFn(listProductRepos);
  const productRepos = useQuery({
    queryKey: ["start-product-repos", activeWorkspaceId ?? null],
    queryFn: measuredQueryFn("listProductRepos", () =>
      fProductRepos({ data: { workspaceId: activeWorkspaceId ?? null } }),
    ),
    staleTime: 5 * 60_000,
    enabled: productsVisible,
  });
  const productCandidates: ProductCandidate[] = useMemo(
    () =>
      products.map((p) => ({
        id: p.id,
        name: p.name,
        repo: productRepos.data?.find((r) => r.productId === p.id)?.repo ?? null,
      })),
    [products, productRepos.data],
  );
  const suggestedProduct = useMemo(
    () => matchProductFromSentence(sentence, productCandidates),
    [sentence, productCandidates],
  );

  /*
   * P-85: the middle example tier, shaped from a product's own name and
   * stated goal rather than a checkout that may not be this workspace's.
   * Read only once there is a product to ask about, same `enabled` gate
   * `productRepos` already uses.
   */
  const fProductGoals = useServerFn(listProductGoals);
  const productGoals = useQuery({
    queryKey: ["start-product-goals", activeWorkspaceId ?? null],
    queryFn: measuredQueryFn("listProductGoals", () =>
      fProductGoals({ data: { workspaceId: activeWorkspaceId ?? null } }),
    ),
    staleTime: 5 * 60_000,
    enabled: productsVisible,
  });
  /*
   * THE ACTIVE PRODUCT'S OWN GOAL, WHEN IT HAS ONE. Falling back to the
   * first product that stated one at all rather than showing nothing,
   * because a workspace with several products and no active selection still
   * has a real product to shape an example from -- it just is not the one
   * with focus.
   */
  const productExample = useMemo(() => {
    const goals = productGoals.data ?? [];
    if (goals.length === 0) return null;
    const active = activeProductId ? goals.find((g) => g.productId === activeProductId) : null;
    const chosen = active ?? goals[0];
    const name = products.find((p) => p.id === chosen?.productId)?.name;
    if (!chosen || !name) return null;
    return { name, northStar: chosen.northStar };
  }, [productGoals.data, products, activeProductId]);

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

  /*
   * THE COMPOSER IS THE FIRST TAB STOP (P-16b, A-QUEUE.md): it was the
   * thirteenth (A1, DOM focus order, 12:15 IST) because nothing on this page
   * claimed focus on load at all, so a keyboard or screen-reader arrival
   * walked the errand line, every example card and the runs list before ever
   * reaching the one control the screen exists for.
   *
   * "RESPECTING A PERSON WHO IS ALREADY TYPING ELSEWHERE" is the scope's own
   * phrase, and it is the reason this checks `document.activeElement` rather
   * than focusing unconditionally: a fast keyboard user can tab past this
   * effect before it fires (it runs after paint, not before), and a control
   * that steals focus back out from under a press already in flight is worse
   * than one that arrives a beat late. `document.body`/`null` is what an
   * untouched page reads as -- anything else means somebody, or the browser
   * itself (autofill), got there first.
   */
  useEffect(() => {
    if (shouldClaimComposerFocus(document.activeElement)) fieldRef.current?.focus();
    // Fires once on mount; `fieldRef` is a stable ref and `shouldClaimComposerFocus`
    // a stable top-level import, so the empty array is complete, not silenced.
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
  /*
   * ── THE THREE ANSWERS ABOVE THE RUN LIST (P-62) ─────────────────────────
   *
   * FOUNDER 00:08 2026-09-04: "today we have only the app saying that start, so
   * a lot of things are not in home."
   *
   * The waiting shape comes from the SAME `getApprovalsQueue` the approvals
   * heading reads (P-56), never a second count, so the home and the page it
   * opens cannot disagree about how much is waiting.
   */
  const fHomeReads = useServerFn(readHomeAnswers);
  const homeReads = useQuery({
    queryKey: ["start-home-answers", activeWorkspaceId ?? null],
    queryFn: () => fHomeReads({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
    staleTime: 60_000,
  });
  const fQueue = useServerFn(getApprovalsQueue);
  const queueRead = useQuery({
    queryKey: [...APPROVALS_QUEUE_PREFIX, "start-home", activeWorkspaceId ?? null],
    queryFn: () => fQueue({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
    staleTime: 60_000,
  });
  /*
   * A PENDING READ IS UNREAD, NOT EMPTY, and that is why each is `isSuccess`
   * rather than `data ?? []`. The first frame of a home that says "Nothing is
   * waiting on your answer" before it has looked is the lie this whole region
   * is typed to prevent.
   */
  const answers = homeAnswers({
    waitingShape: queueRead.isSuccess
      ? queueShape((queueRead.data?.items ?? []).map((i) => i.kindKey))
      : null,
    arrivingCount: homeReads.isSuccess ? homeReads.data.arrivingCount : null,
    lastLookedAt: homeReads.isSuccess ? homeReads.data.lastLookedAt : null,
    learnedCount: homeReads.isSuccess ? homeReads.data.learnedCount : null,
    releases: homeReads.isSuccess ? homeReads.data.releases : null,
  });

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
      <div data-page-composer className="flex flex-col gap-mrd-2">
        <Composer
          value={sentence}
          onChange={setSentence}
          onSubmit={() => go.mutate(undefined)}
          busy={go.isPending}
          placeholder={PLACEHOLDER}
          label="Describe the work in one sentence"
          fieldRef={fieldRef}
        />
        {/*
         * WHICH PRODUCT THIS RUN WILL USE, BESIDE THE FIELD (P-16b,
         * A-QUEUE.md). Loom W2's own ruling keeps the product concept
         * invisible until a workspace has a second one to distinguish --
         * `productsVisible` is that same gate, so a one-product workspace
         * (the ordinary case) sees nothing new here.
         */}
        {productsVisible ? (
          <ComposerProductPicker
            products={products}
            activeProductId={activeProductId}
            suggested={suggestedProduct}
            onSelect={setActiveProductId}
          />
        ) : null}
      </div>

      {/* The three answers sit BELOW the composer and above the run list: hand
          work over, then what needs you, then what happened. */}
      <HomeAnswers answers={answers} />

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

      {/*
       * TWO CALLBACKS, BECAUSE THE TWO LISTS DO DIFFERENT THINGS (P-33).
       * A ranked bet is this workspace's own work and starts on press. An
       * example is a sentence we wrote, so it lands in the composer with the
       * cursor in it and the person edits it into their own product's words --
       * pressing it must never file a run about a checkout they do not have.
       *
       * P-43 (A-QUEUE.md): GATED ON THE SAME SETTLING `firstRun` ALREADY
       * WAITS FOR. `ExampleJobs`'s own header says its static examples exist
       * for an EMPTY WORKSPACE specifically -- "the examples keep doing the
       * job they were built for" -- but the call here rendered unconditionally,
       * so "No runs yet." could show (a) while `runs` was still loading,
       * directly contradicting `YourRuns`'s own "Reading your runs." below
       * it, one screen saying two things about whether the read has
       * answered, and (b) to a RETURNING person with real runs and no ranked
       * bets yet, which is simply false of them. Bets, once they exist, are
       * never gated on `firstRun` -- a workspace with ranked work shows it
       * regardless of how many runs it has.
       */}
      {showExampleJobs ? (
        <ExampleJobs
          onStart={(job) => go.mutate(job)}
          onOpenRun={(trackId) =>
            void navigate({ to: "/track/$trackId", params: { trackId }, search: {} })
          }
          onUse={(job) => {
            // Focus AND select: the sentence is a draft to be rewritten, not a
            // value to be accepted, so the first keystroke should replace it
            // rather than append to it. `select()` on an input the person did
            // not focus themselves is only right because they just pressed the
            // control that filled it.
            setSentence(job.sentence);
            const field = fieldRef.current;
            if (field) {
              field.focus();
              field.select();
            }
          }}
          busy={go.isPending}
          bets={bets.data ?? []}
          productExample={productExample}
        />
      ) : null}

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
