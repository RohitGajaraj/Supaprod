import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { searchFlag } from "@/lib/search-flag";
import { useEffect, useMemo, useReducer, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Receipt } from "@/components/meridian/Receipt";
import { Row } from "@/components/meridian/rows";
import { Action, ReadFailedLine } from "@/components/meridian/surface-parts";
import { SlowRead } from "@/components/shell/SlowRead";
import { Composer } from "@/components/meridian/onramp-parts";
import { ExampleJobs, type ExampleJob } from "@/components/start/ExampleJobs";
import { YourRuns } from "@/components/start/YourRuns";
import { Arriving } from "@/components/start/Arriving";
import { FirstLookExamples, WhatThisDoes } from "@/components/start/FirstLook";
import { entryHasNothingToSay } from "@/components/start/nobody-owned-the-empty-entry";
import { Hero, heroCopy } from "@/components/start/Hero";
import { CrewAtWork } from "@/components/start/CrewAtWork";
import { StarterRuns } from "@/components/start/StarterRuns";
import { readHome, readStationTimings } from "@/lib/spine/track.functions";
import { HOME_STALE_MS, homeKey, seedHome } from "@/components/start/home-read";
import { heroCanDraw } from "@/components/start/a-failed-read-is-not-a-slow-one";
import { WhatWeAlreadyHold } from "@/components/spine/WhatWeAlreadyHold";
import { startersStand } from "@/components/start/journey-of-a-run";
import { notTheWholeQueue } from "@/components/approvals/not-the-whole-queue";
import { trackChangeKeys } from "@/hooks/use-track-change-push";
import { failureLine } from "@/lib/error-copy";
import { SessionEnded, endedSessionFor } from "@/components/system/SessionEnded";
import { useWorkspace } from "@/hooks/use-workspace";
import { useTimezone } from "@/hooks/use-timezone";
import { listProductRepos, listRunsForStart, startTrack } from "@/lib/spine/track.functions";
import { listProductGoals } from "@/lib/spine/track.functions";
import { listTopOpportunities } from "@/lib/discovery.functions";
import { matchProductFromSentence, type ProductCandidate } from "@/lib/spine/product-match";
import { ComposerProductPicker } from "@/components/start/ComposerProductPicker";
import { ComposerRoutePicker } from "@/components/start/ComposerRoutePicker";
import type { WorkShape } from "@/lib/spine/route";
import { readHomeAnswers } from "@/lib/start/home-answers.functions";
import { homeAnswers } from "@/components/start/three-answers-above-your-runs";
import { HomeAnswers } from "@/components/start/HomeAnswers";
import { WhetherItWorked } from "@/components/start/WhetherItWorked";
import { BetStillOpen } from "@/components/start/BetStillOpen";
import { theBetStillOpen } from "@/components/start/the-bet-still-open";
import { theWorkMoved } from "@/components/start/the-work-moved";
import { whetherItWorked } from "@/components/start/whether-it-worked";
import {
  decideApprovalItem,
  getApprovalsQueue,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";
import { TheCallInFront } from "@/components/start/TheCallInFront";
import { theCallInFront } from "@/components/start/the-call-in-front";
import { startRowMiddle } from "@/components/today/tracks-feed";
import { KIND_WORD } from "@/lib/spine/attach";
import { toolActionLabel } from "@/lib/agent-vocabulary";
import { APPROVALS_QUEUE_PREFIX } from "@/lib/query-keys";
import { queueShape } from "@/components/approvals/a-queue-is-a-shape-not-a-total";
import { waitingSince } from "@/components/meridian/stopped-for";

/**
 * ── THE FRONT DOOR ────────────────────────────────────────────────────────
 *
 * FOUNDER, 2026-09-10, after the last rebuild of this page shipped:
 * *"A user lands on home and it is not appealing, carries no message, shows no
 * journey. I cannot feel the value and I cannot see any real connectivity.
 * Nothing joins up. Layers 1, 2 and 3 do not stitch together, and it reads as a
 * dump of data and content. I need real change, not another pass of polish."*
 *
 * He had said *"shows no journey"* once before. The answer that time was to move
 * the seven-station road from eighth position to first, and it shipped. **He
 * looked at it and said the same sentence again**, which is the only proof worth
 * having that the placement was never the defect.
 *
 * ── WHAT THIS PAGE IS NOW: FOUR MOVEMENTS, AND THEY DO NOT MOVE ──────────
 *
 * The mechanism behind *"reads as a dump"* was measured rather than guessed:
 * **twelve conditional regions in one column**, most absent on any given
 * workspace, so no two visits shared a shape and there was nothing to learn.
 * The route's own comments described a sequence that existed only in the
 * comments. Law 32 is the rule that came out of it — **a movement keeps its
 * place when it is empty** — and this page is its first caller.
 *
 *   1  THE ONE THAT MATTERS   the oldest call waiting on a person, drawn with
 *      (TheCallInFront)       its evidence, its cost, its forecast, both
 *                             consequences and the road of the run it holds.
 *                             Layers 1, 2 and 3 on ONE object, answerable in
 *                             place. When nothing waits on you it says so; when
 *                             a read failed it says nothing at all.
 *   2  HAND SOMETHING OVER    the box, the product it is for, and what this
 *      (Composer)             workspace already holds about the sentence being
 *                             typed.
 *   3  YOUR RUNS              one row per run, its position on the road, one
 *      (YourRuns)             sentence, and the one control its state needs.
 *   4  WHAT CAME OF IT        the context column, beside the work rather than
 *      (the aside)            under it: the last verdict, the bet still open,
 *                             what came in since you looked, and who is working
 *                             right now.
 *
 * ── WHAT WENT, AND EACH ONE FOR A MEASURED REASON ────────────────────────
 *
 * • **The seven-station band.** It counted the same eight tracks the run rows
 *   already draw with `journeyOfRun` at `size="row"`, one region higher — the
 *   repeated-value law at the layout level. Its whole machinery went with it:
 *   `journeyMap`, `withWaiting`, `withTimings`, `withPresences`, a SECOND
 *   observer on `runningNowKey`, and a station filter only it could set.
 * • **The sentence about the product** — *"Seven stations take one sentence
 *   from evidence to shipped, and grade whether it worked."* True about the
 *   product, printed at the top of the screen a person opens every morning to
 *   find out about THEIRS.
 * • **`max-w-[62rem]`.** This was the one surface in the product outside
 *   `.sp-inner`, and `shell.css` says so by name. Measured on the served build
 *   at 1920px: 330px of dead field on each side WHILE the page scrolled.
 *
 * ── THE REFERENCE, NAMED BEFORE BUILDING ──────────────────────────────────
 * Anthropic, OpenAI and Perplexity open on one sentence and one box. Codex puts
 * startable cards under it. Cursor and Devin list work as rows with one
 * distinguishing fact. What none of them has is a piece of work drawn from the
 * evidence that caused it to the date it will be graded — because none of them
 * keeps a record that could draw it.
 */
/**
 * THE PLACEHOLDER IS AN EXAMPLE OF THE SHAPE, IN THE PRODUCT'S OWN TERMS.
 * "Make the checkout accept an American Express card" taught the shape to a
 * workspace that had no checkout. When the product has stated a goal, the
 * example is built from it; when it has not, the example names the shape
 * without a domain noun.
 */
const PLACEHOLDER = "Make the checkout accept an American Express card";

/**
 * A goal that can follow "Help <name>": it starts with a verb. Seen live on
 * Relay (2026-09-08): its north star is an outcome sentence ("every
 * homeowner understands their energy use at a glance"), and the template
 * printed "Help Relay every homeowner understands", the same garble the
 * first run screen had with a positioning line. A short list of the verbs a
 * goal opens with is the guard; anything else falls to the plain frame.
 */
const GOAL_VERBS = new Set([
  "get",
  "make",
  "cut",
  "ship",
  "reach",
  "grow",
  "reduce",
  "increase",
  "raise",
  "bring",
  "take",
  "turn",
  "keep",
  "let",
  "help",
  "stop",
  "double",
  "halve",
  "win",
  "land",
  "close",
  "move",
  "lift",
  "drive",
  "hit",
  "add",
  "give",
  "put",
  "build",
  "launch",
  "open",
  "sell",
  "convert",
  "retain",
  "onboard",
  "deliver",
  "finish",
  "improve",
  "lower",
  "shorten",
  "speed",
]);

/**
 * WHAT THE BOX ASKS FOR, PER SHAPE.
 *
 * MEASURED ON THE SERVED HOME, 2026-09-10: the picker read *"Something we
 * have not built before"* -- its DEFAULT, so this is the first frame of every
 * arrival -- and the box eighteen pixels above it read *"Change one thing in
 * A1 delete probe, and say what it should do"*. The two controls of the one
 * composer disagreed about what kind of work a person was describing, before
 * they had touched either.
 *
 * `placeholderFor` took only the product, so the prompt could not follow the
 * shape even in principle. Five shapes, one sentence, and the sentence was
 * written for exactly one of them.
 *
 * Each line asks for the two things that shape actually needs, in the same
 * two-clause rhythm, so changing the picker changes the ask and nothing else
 * moves.
 */
const SHAPE_ASK: Record<WorkShape, (name: string) => string> = {
  "new-capability": (name) => `Describe something ${name} should do that it cannot today`,
  "existing-feature": (name) => `Change one thing in ${name}, and say what it should do`,
  "interface-change": (name) =>
    `Say what a person sees in ${name} today, and what they should see instead`,
  "under-the-hood": (name) => `Say what ${name} does today, and what it should do instead`,
  "incident-fix": (name) => `Say what is broken in ${name}, and what should happen instead`,
};

export function placeholderFor(
  product: { name: string; northStar: string | null } | null,
  shape: WorkShape = "new-capability",
): string {
  if (product?.northStar && shape === "new-capability") {
    /* The goal is a sentence in the product's own words ("Get 40% of active
       users to a funded savings goal"), so it follows "Help <name>" with its
       first letter lowered, and never a preposition it was not written for.
       SCOPED TO `new-capability` since 2026-09-10: a north star is an
       open-ended outcome, which is what that shape asks for. Over "Something
       is broken now" it was answering a question the person had just said
       they were not asking. */
    const goal = product.northStar.trim().replace(/[.]+$/, "");
    const first = goal.split(/\s+/)[0]?.toLowerCase() ?? "";
    if (GOAL_VERBS.has(first)) {
      return `Help ${product.name} ${goal.charAt(0).toLowerCase()}${goal.slice(1)}`;
    }
  }
  if (product?.name) return SHAPE_ASK[shape](product.name);
  return PLACEHOLDER;
}

/**
 * P-32 PASS 4 (A-QUEUE.md). Wraps a reader's own `queryFn` with a named
 * `performance.mark`/`measure` pair around the ACTUAL round trip a person's
 * browser makes, so a Performance-panel read can name the reader directly.
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
 * (P-16b). `document.body`/`null` is what an untouched page reads as.
 * Anything else means somebody got here before this effect did, and the
 * composer must not steal it back.
 */
export function shouldClaimComposerFocus(activeElement: Element | null): boolean {
  return activeElement === null || activeElement === document.body;
}

export const Route = createFileRoute("/_authenticated/start")({
  validateSearch: (search: Record<string, unknown>): { about?: string; compose?: true } => ({
    /* "START A RUN" from the rail, anywhere but here: open the home with the
       cursor already in the composer (founder, 2026-09-08). */
    compose: searchFlag(search.compose),
    /* A sentence carried in from somewhere else, as a head start. */
    about:
      typeof search.about === "string" && search.about.trim()
        ? search.about.trim().slice(0, 300)
        : undefined,
  }),
  component: StartLanding,
  head: () => ({ meta: [{ title: "Home · Supaprod" }] }),
});

function StartLanding() {
  const navigate = useNavigate();
  const {
    activeWorkspace,
    activeWorkspaceId,
    activeProduct,
    activeProductId,
    products,
    productsVisible,
    setActiveProductId,
    isLoading: workspaceLoading,
  } = useWorkspace();
  const { about, compose } = Route.useSearch();
  /* "Start a run" from another page lands here with the cursor in the box. */
  useEffect(() => {
    if (!compose) return;
    fieldRef.current?.focus();
  }, [compose]);
  const timezone = useTimezone();

  const [sentence, setSentence] = useState(about ?? "");
  const fieldRef = useRef<HTMLTextAreaElement | null>(null);
  const start = useServerFn(startTrack);

  /*
   * THE SAME CACHE ENTRY `YourRuns` POLLS, on purpose. The hero, the presence
   * strip and the map all hang on this one read, and a private read here
   * would let two answers drift.
   *
   * THE WORKSPACE IS PART OF THE QUESTION, SO IT IS PART OF THE KEY.
   */
  /*
   * ONE ROUND TRIP FOR THE ARRIVAL (Lane 3's readHome, 2026-09-08). The home
   * used to open on four reads racing (runs, the queue, who is working, what
   * arrived), and the hero waited on two of them. readHome answers all four
   * at once and seeds each read's own key, so the four below mount already
   * answered and the first paint is one paint. They keep their own keys and
   * cadences after that, because the rail and the run screen read the same
   * keys; if the composite read fails, they fetch on their own as before.
   */
  const qc = useQueryClient();
  const fHome = useServerFn(readHome);
  const home = useQuery({
    queryKey: homeKey(activeWorkspaceId ?? null),
    queryFn: measuredQueryFn("readHome", async () => {
      const ws = activeWorkspaceId as string;
      const r = await fHome({ data: { workspaceId: ws } });
      seedHome(qc, ws, r);
      return r;
    }),
    enabled: Boolean(activeWorkspaceId),
    staleTime: HOME_STALE_MS,
  });
  /* Seeded once the composite has answered for THIS workspace. Not before
     the id is known: the reads below used to fire once against a null
     workspace and again when the id arrived (2026-09-08). A person with no
     workspace at all has nothing to read, and is not held. */
  const noWorkspace = !workspaceLoading && !activeWorkspaceId;
  const seeded = noWorkspace || (Boolean(activeWorkspaceId) && (home.isSuccess || home.isError));

  const fRuns = useServerFn(listRunsForStart);
  const runs = useQuery({
    queryKey: ["start-runs", activeWorkspaceId ?? null],
    queryFn: measuredQueryFn("listRunsForStart", () =>
      fRuns({ data: { workspaceId: activeWorkspaceId ?? null } }),
    ),
    refetchInterval: 10_000,
    /* The seed is fresh for one poll, so mounting does not refetch it. */
    staleTime: HOME_STALE_MS,
    enabled: seeded,
  });
  /* Only once the read has ANSWERED. */
  const firstRun = runs.data !== undefined && runs.data.length === 0;
  /* The promise is for the account that has never started a run; once
     anything has, the road is a map, even the morning after the only run
     finished (fourth review, 2026-09-09). Null until the read answers. */

  /* P-14: the ranked bets' home is here. */
  const fBets = useServerFn(listTopOpportunities);
  const bets = useQuery({
    queryKey: ["start-top-opportunities", activeWorkspaceId ?? null],
    queryFn: measuredQueryFn("listTopOpportunities", () =>
      fBets({ data: { workspaceId: activeWorkspaceId ?? null } }),
    ),
    staleTime: 60_000,
    /* Not before the id is known, as `timings` below: this fired the full
       read against a null workspace and again on the id, every arrival
       (fourth review, 2026-09-09). */
    enabled: Boolean(activeWorkspaceId),
  });

  /* WHICH PRODUCT A SENTENCE MEANS (P-16b). */
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

  /* The active product's own goal, for the placeholder (P-85's read). */
  const fProductGoals = useServerFn(listProductGoals);
  const productGoals = useQuery({
    queryKey: ["start-product-goals", activeWorkspaceId ?? null],
    queryFn: measuredQueryFn("listProductGoals", () =>
      fProductGoals({ data: { workspaceId: activeWorkspaceId ?? null } }),
    ),
    staleTime: 5 * 60_000,
    enabled: Boolean(activeWorkspaceId),
  });
  /* THE ROUTE THIS SENTENCE TAKES, picked by the person rather than assumed
     (fifth review, 2026-09-09). Discover-first stays the default, per the
     founder's own §5E ruling; a card that carries its own shape overrides it.
     DECLARED HERE, ABOVE THE PLACEHOLDER, because the box's prompt follows
     the shape since 2026-09-10 -- the two controls of one composer used to
     disagree about what was being described. */
  const [pickedShape, setPickedShape] = useState<WorkShape>("new-capability");

  const placeholder = useMemo(() => {
    const goals = productGoals.data ?? [];
    const chosen =
      (activeProductId ? goals.find((g) => g.productId === activeProductId) : null) ?? goals[0];
    const name = chosen
      ? products.find((p) => p.id === chosen.productId)?.name
      : activeProduct?.name;
    /* The same subject the hero greets by: the product, or the workspace
       when no product row exists yet (seen live on a probe workspace, where
       the eyebrow read the workspace name over a placeholder about a
       checkout no one here owns). */
    const subject = name ?? activeProduct?.name ?? activeWorkspace?.name ?? null;
    if (!subject) return placeholderFor(null, pickedShape);
    return placeholderFor({ name: subject, northStar: chosen?.northStar ?? null }, pickedShape);
  }, [productGoals.data, products, activeProductId, activeProduct, activeWorkspace, pickedShape]);
  /*
   * THE PLACEHOLDER LANDS ONCE. On every full-page arrival the focused box
   * changed its sentence up to three times as the workspace, the product
   * and the goal each landed, opening on the checkout example this file's
   * own header retired (fourth review, 2026-09-09). The hero one slot up is
   * held for exactly this reason; the box waits for its own subject, which
   * is a few hundred ms, not the composite read. A person with no
   * workspace has no subject to wait for, and a disabled query never
   * settles, so they are not held.
   */
  const placeholderReady =
    noWorkspace || (!workspaceLoading && (productGoals.isSuccess || productGoals.isError));

  const go = useMutation({
    mutationFn: async (job?: ExampleJob) => {
      const s = (job?.sentence ?? sentence).trim();
      const shape: WorkShape = job?.shape ?? pickedShape;
      return start({
        data: {
          title: s.slice(0, 200),
          shape,
          origin: shape !== "new-capability" ? s : undefined,
          productId: activeProductId ?? undefined,
          workspaceId: activeWorkspaceId ?? undefined,
          opportunityId: job?.opportunityId ?? undefined,
        },
      });
    },
    onSuccess: (res) => {
      if (res.track) {
        // ?start=true is the whole point of the landing: the person watches the
        // work begin instead of pressing a second control.
        void navigate({
          to: "/track/$trackId",
          params: { trackId: res.track.id },
          search: { start: true },
        });
      }
    },
    /* A THROW IS NOT PROOF NOTHING WAS FILED. This branch is reached only by
       a transport failure or a middleware throw (a server-written refusal
       comes back as `problems`), and `startTrackCore` inserts the row before
       it answers, so a response lost after the insert leaves a real open
       run behind a receipt that said otherwise, and the obvious next press
       filed it twice (fourth review, 2026-09-09). The keys a track change
       moves are refetched, the same list the socket uses, so the row shows
       within the read rather than the ten-second poll. */
    onError: () => {
      if (!activeWorkspaceId) return;
      for (const queryKey of trackChangeKeys(activeWorkspaceId)) {
        void qc.invalidateQueries({ queryKey }, { cancelRefetch: false });
      }
    },
  });

  const problems = go.data?.problems ?? [];

  /* THE COMPOSER IS THE FIRST TAB STOP (P-16b). */
  useEffect(() => {
    if (shouldClaimComposerFocus(document.activeElement)) fieldRef.current?.focus();
  }, []);

  /* ONE DEAD SESSION, SAID ONCE, ON A WHOLE PAGE (P-15). */
  const sessionEnded = endedSessionFor(runs.error);

  /*
   * WHAT CAME IN, SHIPPED AND WAS LEARNED SINCE THE PERSON LAST LOOKED
   * (P-62), read from the same server function the approvals heading reads.
   * The waiting answer is not composed here any more: the hero says it, and
   * the run rows carry it, so a third sentence would be the same fact thrice.
   */
  const fHomeReads = useServerFn(readHomeAnswers);
  const homeReads = useQuery({
    queryKey: ["start-home-answers", activeWorkspaceId ?? null],
    queryFn: () => fHomeReads({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
    staleTime: 60_000,
    enabled: seeded,
  });
  /*
   * WHAT IS WAITING FOR A PERSON, from the one reader the Inbox page and the
   * rail's Inbox row use, under the shell's own key so the three share one
   * cache entry and one request. The hero says the number; the rows carry
   * the asks that belong to runs; Inbox holds the rest.
   */
  const fQueue = useServerFn(getApprovalsQueue);
  const queueRead = useQuery({
    queryKey: [...APPROVALS_QUEUE_PREFIX, "shell", activeWorkspaceId ?? null],
    queryFn: () => fQueue({ data: activeWorkspaceId ? { workspaceId: activeWorkspaceId } : {} }),
    staleTime: 10_000,
    enabled: seeded,
  });
  const waiting = queueRead.isSuccess ? (queueRead.data?.items ?? []).length : null;
  const waitingShape = queueRead.isSuccess
    ? queueShape((queueRead.data?.items ?? []).map((i) => i.kindKey))
    : null;
  /* The queue can answer SHORT with no client error: a family that failed
     is dropped into `incomplete` and the rest is returned. The Inbox page
     says so in one sentence; the hero carries the same one, so the two
     surfaces never disagree about the same queue (fourth review, 2026-09-09). */
  const queueShort = queueRead.isSuccess ? notTheWholeQueue(queueRead.data?.incomplete) : null;
  /* THE ONE TO START WITH, in the Inbox's own order (oldest first, the card it
     focuses on arrival), from the read the hero already has, so the home and
     the Inbox name the same call (fifth review, 2026-09-09). */
  const waitingFirst = useMemo(() => {
    if (!queueRead.isSuccess) return null;
    const items = queueRead.data?.items ?? [];
    let best: { title: string; at: number } | null = null;
    for (const i of items) {
      const at = waitingSince(i.timestamp);
      if (at === null || !i.title) continue;
      if (!best || at < best.at) best = { title: i.title, at };
    }
    return best?.title ?? null;
  }, [queueRead.isSuccess, queueRead.data]);

  /*
   * THE HERO WAITS FOR ITS FACTS, NOT ONLY ITS NAME. Seen live 13:00 IST
   * 09-08 on Prism: "5 runs have stopped." for a beat, then "20 design gates
   * and 33 other calls are waiting for you." once the queue read landed. A
   * headline that changes its subject is one nobody trusts, so it renders
   * once, after the queue read and a runs read that is actually in flight
   * have settled; the slot above holds the height meanwhile. A disabled runs
   * read (no product yet) is not waited on, or the hero would never come.
   */
  /*
   * A FAILED READ IS NOT A SLOW ONE (`a-failed-read-is-not-a-slow-one.ts`).
   * This used to hold the headline until `runs` stopped fetching, and `runs`
   * polls every ten seconds -- so a read that failed on every attempt went
   * back to "fetching, no data" forever, which is byte-for-byte the state of
   * one that simply has not answered. The entry sat on "Reading your
   * workspace. Still reading." for a read that was never going to answer.
   */
  const heroReady = heroCanDraw({ workspaceLoading, seeded, queue: queueRead, runs });

  /*
   * ── THE ONE PIECE OF WORK THIS PAGE OPENS WITH ───────────────────────────
   *
   * See `the-call-in-front.ts` for the reasoning and the production numbers.
   * Two facts decide it: the founder's *"layers 1, 2 and 3 do not stitch
   * together"*, and the audit finding that the whole of the stitching was
   * already in this browser and being dropped — the queue item carries the
   * evidence, the cost, the forecast, both consequences and `trackId`, and this
   * page rendered one integer and one title off it.
   *
   * It costs NO NEW READ. `queueRead` and `runs` are both already here, and
   * `lineFor` reuses the same `startRowMiddle` the list below uses, so the lead
   * and the row for the same run can never disagree about it.
   */
  const lead = useMemo(
    () =>
      theCallInFront({
        queue: queueRead.isSuccess ? (queueRead.data?.items ?? []) : null,
        runs: runs.isSuccess ? (runs.data ?? []) : null,
        lineFor: (r) =>
          startRowMiddle(r, Date.now(), KIND_WORD, (tool) => toolActionLabel(tool), timezone),
      }),
    [queueRead.isSuccess, queueRead.data, runs.isSuccess, runs.data, timezone],
  );

  /*
   * ── HAS EVERY REGION ON THIS PAGE ANSWERED, AND HAS NONE ANYTHING TO SAY ──
   *
   * Reproduced on the served product, 2026-09-14: this whole screen was a
   * loading line and an empty box, because `TheCallInFront`, `ExampleJobs`,
   * `Arriving` and `StarterRuns` each correctly draw nothing on a workspace
   * with no work, no bets and no sources. Every refusal is well argued; nobody
   * owned their sum. The argument and the reproduction are in
   * `nobody-owned-the-empty-entry.ts`.
   *
   * COMPUTED ONCE because THREE regions branch on it, and a second copy of this
   * expression is how two of them would eventually disagree about whether the
   * page is empty.
   */
  const entryEmpty = entryHasNothingToSay({
    lead: lead.kind === "unread" ? null : lead.kind,
    runs: runs.isSuccess ? (runs.data ?? []) : null,
    bets: bets.isSuccess ? (bets.data ?? []) : null,
    waiting,
    /* A NULL COUNT IS AN UNANSWERED QUESTION, NOT A ZERO. The read can succeed
       and still carry null for this clause (its own reader refuses to invent
       one), and treating that as "no evidence" is exactly the substitution
       `Arriving` documents paying for. It stays null here, which keeps the
       introduction silent rather than drawing it over a workspace that has
       sources. */
    hasEvidence:
      homeReads.isSuccess && homeReads.data.arrivingCount !== null
        ? homeReads.data.arrivingCount > 0
        : null,
  });

  /*
   * WHICH SET OF EXAMPLES, AND NEVER BOTH.
   *
   * `StarterRuns` writes three sentences from THIS product's own one-liner, so
   * where it can draw it beats a generic example outright. Driven in a browser
   * on the empty workspace, both sets drew at once and the screen carried six
   * example cards in two grids -- the duplication this change exists to remove,
   * introduced by the fix for it. The generic three are the fallback for a
   * workspace with no product row to read.
   */
  const startersWillDraw = Boolean(
    startersStand(runs.data, bets.data?.length ?? 0) && activeProductId && activeProduct,
  );

  /*
   * ANSWERING IN PLACE, WITH THE INBOX'S OWN MUTATION SHAPE.
   *
   * Same server function, same optimistic drop, same invalidation — copied in
   * shape rather than in spirit, because the two surfaces read the queue under
   * two different keys (`[...PREFIX,"shell",ws]` here, `approvalsQueueKey(ws)`
   * there) and a press on either must clear both. Invalidating the PREFIX is
   * what covers them; the rail badge reads the shell key and would otherwise
   * keep claiming a call that is already settled.
   */
  const mDecide = useServerFn(decideApprovalItem);
  const decide = useMutation({
    mutationFn: (vars: { item: ApprovalQueueItem; verdict: "approve" | "reject" }) =>
      mDecide({
        data: { id: vars.item.sourceId, kind: vars.item.kindKey, verdict: vars.verdict },
      }),
    onMutate: async (vars) => {
      const key = [...APPROVALS_QUEUE_PREFIX, "shell", activeWorkspaceId ?? null];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<{ items: ApprovalQueueItem[] }>(key);
      qc.setQueryData<{ items: ApprovalQueueItem[] } | undefined>(key, (old) =>
        old ? { ...old, items: old.items.filter((i) => i.id !== vars.item.id) } : old,
      );
      return { prev, key };
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: APPROVALS_QUEUE_PREFIX });
      /* The runs read too: answering a gate releases the run it was holding,
         and the row four hundred pixels below this one is drawn from that
         read. Guarded on the workspace rather than defaulted, because
         `trackChangeKeys` keys on a real id and a null one would invalidate
         somebody else's cache entry. */
      if (activeWorkspaceId) {
        for (const queryKey of trackChangeKeys(activeWorkspaceId)) {
          void qc.invalidateQueries({ queryKey });
        }
      }
    },
  });

  /*
   * ── WHAT MOVED, WITH THE RUN NAMED FROM ROWS THE PAGE ALREADY HAS ────────
   *
   * `stage_events` carries the station change and the track id; `runs` carries
   * every open track's title. Joining them here costs no read -- which is why
   * the server function deliberately does not fetch titles for a line that may
   * name at most one.
   *
   * A move whose track is not in the list is dropped rather than named "a run":
   * it is a track that has since closed or left this workspace's open set, and
   * a sentence about work a person cannot see on the page below is a sentence
   * they cannot check.
   */
  const moved = useMemo(() => {
    if (!homeReads.isSuccess || !homeReads.data.moved) return null;
    const titleOf = new Map((runs.data ?? []).map((r) => [r.id, r.title]));
    return homeReads.data.moved
      .map((m) => ({ from: m.from, to: m.to, title: titleOf.get(m.trackId) ?? "", at: m.at }))
      .filter((m) => m.title.length > 0);
  }, [homeReads.isSuccess, homeReads.data, runs.data]);

  const sinceYouLooked = homeAnswers({
    waitingShape: null,
    arrivingCount: homeReads.isSuccess ? homeReads.data.arrivingCount : null,
    lastLookedAt: homeReads.isSuccess ? homeReads.data.lastLookedAt : null,
    learnedCount: homeReads.isSuccess ? homeReads.data.learnedCount : null,
    rescoredCount: homeReads.isSuccess ? homeReads.data.rescoredCount : null,
    releases: homeReads.isSuccess ? homeReads.data.releases : null,
    moved: theWorkMoved({
      moves: moved,
      since: homeReads.isSuccess ? homeReads.data.lastLookedAt : null,
    }),
    zone: timezone,
    nowIso: new Date().toISOString(),
  }).filter((a) => a.read === "answered");

  /*
   * WHETHER IT WORKED. The entry's one piece of evidence, and the answer to
   * the founder's "I cannot feel the value": every other statement on this
   * page is a delta or a count, and this is the only one that says the loop
   * closed. Same read and same key as the three answers above it, so it costs
   * no extra request. See `whether-it-worked.ts` for why it is one outcome
   * rather than a total, and why a miss leads as readily as a win.
   */
  const itWorked = whetherItWorked({
    closed: homeReads.isSuccess ? homeReads.data.closed : null,
    read: homeReads.isSuccess ? homeReads.data.closedRead : false,
  });
  /*
   * ── AND WHAT IT IS BETTING ON, WHEN NOTHING HAS COME BACK YET ────────────
   *
   * MEASURED 2026-09-09: every workspace holding a graded outcome is a seed or
   * a sample, and the founder's own two hold 16 runs and zero. So `itWorked`
   * above -- the region built for his "I cannot feel the value" -- draws
   * nothing for him, and the entry then says nothing about value at all.
   *
   * Same read, same key, no extra request: `openBet` rides the batch the three
   * answers already issue. It returns null whenever `closed` is present, so
   * the two are never both on screen -- a result outranks a promise.
   */
  /*
   * THE ENTRY'S ONE SENTENCE ABOUT ITSELF IS GONE, and `what-this-does-for-you`
   * with it as this surface's caller.
   *
   * It read *"Seven stations take one sentence from evidence to shipped, and
   * grade whether it worked."* -- a true sentence about the PRODUCT, printed at
   * the top of the screen a person opens every morning to find out about THEIR
   * product. On visit two it is furniture; on visit two hundred it is furniture
   * that has been in the way two hundred times. It also stood in the largest
   * region on the page describing machinery, which is the thing the founder
   * called "a dump of data and content" from the other direction: the page was
   * explaining itself instead of showing him his own situation.
   *
   * The lead says the same thing without claiming it: a call, its evidence, its
   * road and its dated promise IS "evidence to shipped, and grade whether it
   * worked", shown rather than asserted.
   *
   * ── AND THAT ARGUMENT HAS ONE STATE IT DOES NOT REACH (2026-09-14) ────────
   * Every clause above is true WHEN THERE IS A LEAD TO SHOW. On a workspace
   * with no work, no bets and no sources there is none, and the reasoning ends
   * with nothing standing in its place: measured on the served product, the
   * whole screen was a loading line and an empty box.
   *
   * So the sentence is back, under two conditions that answer both halves of
   * the objection above. It draws ONLY when every other region on this entry
   * has answered and come up empty (`entryHasNothingToSay`), so a returning
   * operator with work on screen never meets it and it cannot be furniture on
   * visit two. And it no longer describes machinery: `WHAT_IT_DOES` names what
   * the crew PRODUCES and says nothing about stations, which is the founder's
   * standing instruction about internal vocabulary.
   *
   * `what-this-does-for-you.ts` is deleted rather than revived. Its sentence
   * led with "Seven stations", which is the half of it that was wrong on its own
   * terms, and a module kept alive with no caller is what `route.ts` documents
   * three of. The replacement lives in `nobody-owned-the-empty-entry.ts` with
   * the reproduction beside it.
   */

  const betOpen = theBetStillOpen({
    openBet: homeReads.isSuccess ? homeReads.data.openBet : null,
    closed: homeReads.isSuccess ? homeReads.data.closed : null,
    /* Read at render, like the quiet clock below it. The distance to a
       horizon days away does not need a ticking value, and a second live
       clock on this page would re-render the entry every second for a
       sentence that changes once a day. */
    nowIso: new Date().toISOString(),
    /* The person's own zone (P-130), the same one the rows below read. A
       horizon stored at midnight UTC prints the wrong DAY without it. */
    zone: timezone,
  });

  /* THE SECOND OBSERVER ON `runningNowKey` IS GONE WITH THE MAP IT FED.
     `CrewAtWork` holds its own observer on the same key and `seedHome` writes
     it, so nothing here is unread -- this route was simply subscribing to the
     same ten-second poll twice to paint dots on a band that no longer draws. */
  /* HOW LONG EACH STATION USUALLY TAKES HERE (Lane 3, readStationTimings):
     the map's working station says it, so the wait has a shape. */
  const fTimings = useServerFn(readStationTimings);
  const timings = useQuery({
    queryKey: ["station-timings", activeWorkspaceId ?? null],
    queryFn: () => fTimings({ data: { workspaceId: activeWorkspaceId as string } }),
    enabled: Boolean(activeWorkspaceId),
    staleTime: 5 * 60_000,
  });
  /* THE LEAD'S ROAD IS RECOMPOSED ONCE A SECOND WHILE A SEAT WORKS, or "past
     its usual time here" could never appear: nothing in the data changes while
     a seat stalls (third review, 2026-09-08). The condition now comes off the
     runs read this page already has, rather than off a second poll of its own. */
  const anySeat = (runs.data ?? []).some((r) => r.working);
  const [roadTick, bumpRoad] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!anySeat) return;
    const id = setInterval(bumpRoad, 1_000);
    return () => clearInterval(id);
  }, [anySeat]);
  const openRun = (trackId: string) =>
    void navigate({ to: "/track/$trackId", params: { trackId }, search: {} });

  if (sessionEnded) {
    return (
      <SessionEnded title="Start" error={runs.error}>
        Nothing you were about to do is lost.
      </SessionEnded>
    );
  }

  return (
    /* THE PAGE HAS A RHYTHM, NOT ONE STEP (craft pass, 2026-09-09). Every one
       of the column's eleven blocks sat exactly 40px from its neighbour, so
       the composer was as far from its own receipts as the road was from the
       run list, and nothing on the page was grouped with anything: the
       founder's "it reads as a dump" in its most literal form, and Meridian's
       middle steps unused on the page the ramp exists for. The base is now
       `--mrd-s6` (24px), which holds a movement together, and the child that
       OPENS a movement adds `--mrd-s5` (16px) to reach the 40px that separates
       one movement from the next. Both steps are the ramp's own; a child that
       does not render carries no margin, so a movement that is absent costs
       nothing. */
    /* THE SURFACE STATES ITS RHYTHM ONCE, which is the founder's own ruling
       and the rule /settings already follows: "the caller states the rhythm
       once per surface".

       MEASURED ON THE SERVED HOME, 2026-09-10, computed off the live column:
       `rowGap: 24px` on this container plus `mt-mrd-5` (16px) on six of its
       children, so every gap was 40px reached as 24 + 16 -- EXCEPT the one
       between the road and the hero, which was 24, because the hero is the
       one child that never carried the margin. One rhythm, stated in two
       places, disagreeing with itself once.

       40px is `--mrd-s7` and it is a stop on the ramp; 24 + 16 arriving at
       the same number is an accident that held. Stated here, the six margins
       go, and a child added tomorrow inherits the rhythm instead of having to
       remember it. */
    /*
     * ── THE ENTRY JOINS THE SHELL'S OWN LAYOUT, AND IT WAS THE ONE SURFACE
     *    THAT NEVER HAD (Lane 1, 2026-09-10) ────────────────────────────────
     *
     * `shell.css`'s own comment names this file as the exception: *"Every
     * surface in the product inherited that except `/start`, which happened to
     * centre itself with its own `items-center`."* It hand-rolled
     * `max-w-[62rem]`, so on a 1920px window the work region was 1652px wide,
     * the column was 992px, and **330px of dead field sat on each side while
     * the page scrolled** — content 1168px against 880px of pane. A reader was
     * scrolling for information that would have fitted if the layout had used
     * the screen.
     *
     * And because it never joined `.sp-inner`, it could not have the context
     * column that `.sp-inner:has(.sp-ctx)` gives every ported surface at
     * >=1120px. `/inbox` has one. The home did not, which is why layer 3 was
     * stacked underneath layer 2 instead of standing beside it.
     *
     * `.sp-wide` rather than `.sp-main`: the road is a drawing laid out in
     * columns, not prose read line by line, and `--mrd-shell-main-max` is a
     * 74ch measure meant for the latter.
     */
    <div data-work="">
      <div data-work-wide="" className="flex flex-col gap-mrd-7">
        {/*
         * ── THE ENTRY LEADS WITH ONE PIECE OF WORK, TOLD WHOLE ───────────────
         *
         * WHAT STOOD HERE, AND WHY IT WENT. `JourneyMap leads` — the seven
         * stations drawn from this workspace's counts, captioned *"Seven stations
         * take one sentence from evidence to shipped, and grade whether it
         * worked."* It was moved here last session, from eighth position, against
         * the founder's *"shows no journey"*. **He looked at it and said the same
         * thing again**, which means the placement was never the defect.
         *
         * A journey is not a diagram of stages; it is one thing moving through
         * time. That band renders identically for any workspace holding the same
         * counts — it is the machine's self-portrait, and it is layer 2, the
         * layer this product rents rather than owns, given the largest region on
         * the most important screen.
         *
         * IT IS ALSO A SECOND COPY OF SOMETHING ALREADY ON THE PAGE. Every row
         * under *Your runs* already draws `journeyOfRun` at `size="row"`. The
         * band above them counts the same eight tracks a second time, which is
         * this repo's own repeated-value law one region higher.
         *
         * WHAT STANDS HERE NOW is the oldest call waiting on a person, drawn with
         * its evidence, its cost, its forecast, both consequences, and the road of
         * the run it is holding — layers 1, 2 and 3 on one object, answerable in
         * place. **It costs no new read**: every one of those fields was already
         * in this browser and being dropped on every poll. See
         * `the-call-in-front.ts` for the production numbers that decided it, and
         * for why an entry that leads with proof would be empty today.
         */}
        {/*
         * STANDS DOWN ON A WORKSPACE THAT HAS NOTHING AT ALL (2026-09-14). Its
         * `nothing` branch draws *"Nothing is waiting on you."* at
         * `text-mrd-h1` with a paragraph explaining where questions will
         * arrive. That is exactly right for an operator whose queue happens to
         * be clear, and it is furniture on a workspace with no runs, no bets and
         * no sources: nothing is waiting because nothing exists, and it put a
         * SECOND h1 on the page 200px from the hero's. Driven in a browser, the
         * empty entry carried two headings of the same size and five separate
         * sentences about saying a sentence.
         *
         * The lead itself is untouched -- every other state still draws through
         * it, first, as `the-entry-leads-with-one-piece-of-work` requires.
         */}
        {entryEmpty ? null : (
          <TheCallInFront
            lead={lead}
            zone={timezone}
            nowIso={new Date().toISOString()}
            busy={decide.isPending}
            onApprove={() =>
              lead.kind === "call"
                ? decide.mutate({ item: lead.item, verdict: "approve" })
                : undefined
            }
            onDecline={() =>
              lead.kind === "call"
                ? decide.mutate({ item: lead.item, verdict: "reject" })
                : undefined
            }
          />
        )}

        {/*
         * WHAT THE MACHINE IS, above the invitation that names the person's own
         * product. The only region on this entry that can answer "what is
         * this", and it draws only where nothing else has anything to say. Its
         * examples are a separate region, below the composer, because a press
         * fills the box; see `FirstLook.tsx` for why the two were split.
         */}
        {entryEmpty ? <WhatThisDoes /> : null}

        {/* THE HERO WAITS FOR ITS NAME (Lane 1, 2026-09-08). Seen live: "What
          should your product do next?" for a beat before the workspace
          resolved, then "What should Prism do next?". A headline that
          changes its subject is a headline nobody trusts; the slot holds its
          height and the words arrive once. */}
        {/*
         * THE RESERVATION FOLLOWS WHAT IS ACTUALLY COMING. 7.5rem holds the
         * eyebrow, the headline AND the line, so the words can land without
         * shifting the composer. On the first visit the line stands down (see
         * `introduced` in Hero.tsx) and the same reservation left a visible
         * 110px hole between the headline and the box, measured in a browser on
         * the empty workspace. The shorter slot still holds eyebrow plus
         * headline, which is everything that arrives in that state.
         */}
        <div className={entryEmpty ? "min-h-[4.5rem]" : "min-h-[7.5rem]"}>
          {heroReady ? (
            <>
              <Hero
                copy={heroCopy({
                  product: activeProduct?.name ?? activeWorkspace?.name ?? null,
                  runs: runs.data,
                  failed: runs.isError,
                  waiting,
                  waitingShape,
                  waitingFirst,
                  queueShort,
                  /* `WhatThisDoes` is above this header saying how the machine
                     works, so the first-visit line would be the third sentence
                     in a row about saying a sentence. The headline still names
                     the person's own product. */
                  introduced: entryEmpty,
                })}
              />
              {/* A REFUSED QUEUE READ IS SAID, NOT ROUNDED TO ZERO. The hero
                above never claims nothing is waiting on a null; this line
                says why it cannot, with the way out (fourth review,
                2026-09-09). */}
              {queueRead.isError ? (
                <div className="mt-mrd-3">
                  <ReadFailedLine error={queueRead.error} onRetry={() => void queueRead.refetch()}>
                    Cannot see what is waiting for you.
                  </ReadFailedLine>
                </div>
              ) : null}
            </>
          ) : (
            /* A sentence, not a hole: the first paint said nothing for the
             length of two reads (entry review, 2026-09-08). It reads as
             `Reading` for 2.5 s, then shows the figure, then offers a way
             out past the stuck line: on a cold arrival this is the page's
             largest read and a wedged request left the sentence up with
             no control (fourth review, 2026-09-09). The retry re-runs the
             composite, which seeds every key the hero waits on. */
            <SlowRead onRetry={activeWorkspaceId ? () => void home.refetch() : undefined}>
              Reading your workspace.
            </SlowRead>
          )}
        </div>

        {/* `data-page-composer` stands the ask dock down: one prompt per screen,
          and this is the one. See `one-prompt-per-screen`. */}
        <div data-page-composer className="flex flex-col gap-mrd-4">
          <Composer
            value={sentence}
            onChange={setSentence}
            onSubmit={() => go.mutate(undefined)}
            busy={go.isPending}
            placeholder={placeholderReady ? placeholder : ""}
            label="Say what should change, and what it should do"
            fieldRef={fieldRef}
          />
          {productsVisible ? (
            <ComposerProductPicker
              products={products}
              activeProductId={activeProductId}
              suggested={suggestedProduct}
              onSelect={setActiveProductId}
            />
          ) : null}
          {/* WHERE THE SENTENCE ENTERS THE ROAD, said before Enter and picked in
            the person's own words. Every sentence used to be filed as new work
            and walk all seven stations, so "fix the broken login" opened a
            Discover run (fifth review, 2026-09-09). */}
          <ComposerRoutePicker shape={pickedShape} onSelect={setPickedShape} sentence={sentence} />
          {/* WHAT THE WORKSPACE ALREADY HOLDS ABOUT THE SENTENCE BEING TYPED.
            Anticipation: the evidence read happens while the person types,
            settled and debounced, so the first thing they learn about their
            own sentence arrives before they press Enter. Built in August,
            never mounted; Lane 2 kept it from deletion for exactly this. */}
          <WhatWeAlreadyHold subject={sentence} />
        </div>

        {/*
         * THE GENERIC EXAMPLES, AND ONLY WHERE NOTHING BETTER EXISTS.
         *
         * Below the composer because a press fills the box ABOVE it, which is
         * also where `StarterRuns` and `ExampleJobs` sit for the same reason.
         *
         * `startersWillDraw` is what keeps this from doubling up: `StarterRuns`
         * writes three sentences from this product's own one-liner, and a
         * sentence about the person's actual product beats a generic one every
         * time. Driven in a browser on the empty workspace, both sets drew at
         * once and the screen carried six example cards in two grids -- the
         * duplication this change exists to remove, arriving through the fix
         * for it.
         */}
        {entryEmpty && !startersWillDraw ? (
          <FirstLookExamples
            onUse={(example) => {
              setSentence(example.sentence);
              /* The shape rides with the sentence, so a broken-thing example is
                 not sent through discovery. `ComposerRoutePicker` shows what it
                 picked and the person can still change it. */
              setPickedShape(example.shape);
              const field = fieldRef.current;
              if (field) {
                field.focus();
                field.select();
              }
            }}
          />
        ) : null}

        {/*
         * ── THE DIRECTOR SITS WITH THE DOOR, AND IT USED TO BE TENTH ─────────
         *
         * The product is three layers -- 01 the DIRECTOR, which tells you what
         * to build; 02 the operating system, which runs the lifecycle; 03 the
         * brain, which remembers and guides -- and the repo's own discipline for
         * revealing them is **door, body, brain**
         * (`docs/pitch/repositioning-2026-07-22.md`).
         *
         * The founder's complaint about this product is that *"layers 1, 2 and 3
         * do not stitch together"*. Measured on this page before today: layer 02
         * led (once the road moved), layer 03 was fifth, and **layer 01 -- the
         * wedge, the thing the product claims to be FOR -- was tenth**, five
         * regions below the box you would type its suggestion into.
         *
         * These ranked bets ARE the director: this workspace's own opportunities,
         * ordered, each one a sentence a person can start. That belongs beside
         * the composer, because the composer is where you say the thing and this
         * is the product saying what it would say. Two halves of one act, and
         * they were half a screen apart.
         *
         * IT DRAWS ONLY WHERE THERE ARE ANY, unchanged. A1 delete probe holds
         * zero opportunities and shows nothing here, which is honest -- the
         * director cannot direct with no evidence. Measured across the product:
         * Helio Labs 92, My Workspace 19, My workspace 6, so on the founder's
         * own workspaces it draws.
         */}
        {/*
         * THIS WORKSPACE'S OWN RANKED BETS, when it has any. A bet starts on
         * press because it is the workspace's own work (P-33). The three
         * invented example sentences that stood here before the first run are
         * gone: the hero says what to type, and an example about a checkout
         * the person does not have taught nothing.
         */}
        {bets.data && bets.data.length > 0 ? (
          <ExampleJobs
            onStart={(job) => go.mutate(job)}
            zone={timezone}
            onOpenRun={openRun}
            onUse={(job) => {
              setSentence(job.sentence);
              const field = fieldRef.current;
              if (field) {
                field.focus();
                field.select();
              }
            }}
            busy={go.isPending}
            bets={bets.data}
            productExample={null}
          />
        ) : null}

        {/* A REFUSAL AND A THROW ARE DIFFERENT, AND BOTH ARE SAID, under the
          composer, because that is where the person is looking. */}
        {problems.length > 0 ? (
          <Receipt verb="Nothing was started" consequence={problems.join(" ")} failed />
        ) : null}
        {/* Says only what the client knows: a throw here is a lost response,
          and whether the insert ran is not known from this side (see
          `onError` above). */}
        {go.isError ? (
          <Receipt
            verb="Nothing was started"
            consequence={failureLine(
              "Your sentence is still in the box. Nothing came back, so whether it was filed is not known yet; the runs refresh in a moment.",
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
         * THE FIRST THREE RUNS, when there is nothing yet: an ANSWERED runs
         * read with nothing open and nothing finished, and no bet arrived
         * (`startersStand`). A failed read drew these over a workspace with a
         * year of runs, and the morning after the only run finished they came
         * back above its Finished row (fourth review, 2026-09-09). Written once
         * from the product's name and the one line the person gave at the
         * first run screen (Lane 3, listStarterRuns). The reading is shown
         * while it happens; a press composes, Enter starts.
         */}
        {/* `startersWillDraw` is this exact condition, hoisted, because
            `FirstLookExamples` above has to know whether this region is going to
            draw in order to stand down for it. Two copies of the expression is
            how the two would eventually disagree and show six cards. */}
        {startersWillDraw && activeProductId && activeProduct ? (
          <StarterRuns
            productId={activeProductId}
            productName={activeProduct.name}
            onUse={(text) => {
              setSentence(text);
              const field = fieldRef.current;
              if (field) {
                field.focus();
                field.select();
              }
            }}
          />
        ) : null}

        {/* Mounted onto the seed, not before it: mounted earlier it fetched the
          largest read on the page 170 ms ahead of the seed that carried the
          same rows (read live 2026-09-08). */}
        {seeded && !firstRun ? <YourRuns /> : null}
      </div>

      {/*
       * ── THE CONTEXT COLUMN, WHICH THIS SURFACE HAS NEVER HAD ─────────────
       *
       * `.sp-inner:has(.sp-ctx)` gives every ported surface a second track at
       * >=1120px, and the home could not use it because it was never inside
       * `.sp-inner` (see the container note above). So layer 3 — what came of
       * the last decision, what is still betting, what is arriving, who is
       * working right now — was STACKED underneath layer 2 instead of standing
       * beside it, and on a 1920px window it sat below the fold with 330px of
       * empty field on either side of it.
       *
       * These four are one question asked from four directions: what has this
       * product got me, and what is it doing about it now. They belong together
       * and they belong in view. `.sp-ctx` never disappears — on a narrow
       * region it stacks under the work rather than hiding, because a 14in
       * laptop needs this as much as a 32in monitor does.
       */}
      <aside data-work-ctx="" className="flex flex-col gap-mrd-6" aria-label="What came of it">
        {/* WHAT CAME OF THE LAST DECISION, and its sibling in the same slot:
            `theBetStillOpen` returns null when a closed loop exists, so exactly
            one of these ever draws. This is the only region in the product that
            can say the loop closed. */}
        <WhetherItWorked it={itWorked} />
        <BetStillOpen it={betOpen} />
        {/* WHAT CAME IN SINCE YOU LOOKED. */}
        <HomeAnswers answers={sinceYouLooked} />
        {/* WHAT IS ARRIVING (founder, 2026-09-02 19:12): the product's central
            claim, evidence becomes work on its own, provable on the page a
            person actually lands on. */}
        <Arriving door={!sinceYouLooked.some((a) => "to" in a.door && a.door.to === "/evidence")} />
        {/* WHO IS WORKING RIGHT NOW. The one live thing on the page, and it
            draws nothing when nobody is, which is honest and is most of the
            time. */}
        <CrewAtWork workspaceId={activeWorkspaceId ?? null} onOpen={openRun} />
      </aside>
    </div>
  );
}
