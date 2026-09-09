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
import type { JourneyKey } from "@/components/meridian/Journey";
import { ExampleJobs, type ExampleJob } from "@/components/start/ExampleJobs";
import { YourRuns } from "@/components/start/YourRuns";
import { Arriving } from "@/components/start/Arriving";
import { Hero, heroCopy } from "@/components/start/Hero";
import { JourneyMap, promiseStations } from "@/components/start/JourneyMap";
import { CrewAtWork, quietFor, workingSeats } from "@/components/start/CrewAtWork";
import { StarterRuns } from "@/components/start/StarterRuns";
import { presenceColour } from "@/components/meridian/AgentPresence";
import { listRunningNow, readHome, readStationTimings } from "@/lib/spine/track.functions";
import { runningNowKey } from "@/lib/query-keys";
import { HOME_STALE_MS, homeKey, seedHome } from "@/components/start/home-read";
import { WhatWeAlreadyHold } from "@/components/spine/WhatWeAlreadyHold";
import {
  homeRoadMode,
  journeyMap,
  startersStand,
  withPresences,
  withTimings,
} from "@/components/start/journey-of-a-run";
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
import { whetherItWorked } from "@/components/start/whether-it-worked";
import { getApprovalsQueue } from "@/lib/approvals-queue.functions";
import { APPROVALS_QUEUE_PREFIX } from "@/lib/query-keys";
import { queueShape } from "@/components/approvals/a-queue-is-a-shape-not-a-total";
import { waitingSince } from "@/components/meridian/stopped-for";

/**
 * ── THE FRONT DOOR ────────────────────────────────────────────────────────
 *
 * Founder, 2026-09-08: "a user lands on home and it is not appealing,
 * carries no message, shows no journey." Walked live that morning, signed
 * in: a composer with an example placeholder, four sentences of status
 * (three of them negations), and five run rows each carrying a paragraph of
 * the driver's own diagnostics. True, and a dump.
 *
 * ── WHAT IT IS NOW, AND THE ORDER IS THE ARGUMENT ─────────────────────────
 *
 * FIVE MOVEMENTS, IN THE ORDER A PERSON MEETS THE PRODUCT. Reordered
 * 2026-09-09 against the founder's other sentence, "I cannot feel the value":
 * the proof that this product works is not its queue, it is that work was
 * decided, built, shipped and then graded against what it promised, and that
 * proof was three mute sentences at position six of seven, under the run list,
 * while a count of what he owed was the headline in 32px. The page led with a
 * debt and buried the return. The spacing ramp separates the movements: 24px
 * inside one, 40px between.
 *
 *   1 what needs you   one headline that names the product and says what needs
 *                      you, and a line that names the one call to start with
 *                      (Hero)
 *   2 hand it over     the box, the product it is for, the shape of the work
 *                      and the road that shape takes, and what the workspace
 *                      already holds about the sentence being typed
 *   3 what came back   what came in, what shipped, what was graded, only when
 *                      the number is not zero, with the Findings strip beside
 *                      them because it answers the same question from the
 *                      other end. Each sentence keeps its one door (P-62); the
 *                      foot carries no standalone Outcomes door, since Outcomes
 *                      is a rail row, and the strip withholds its own when the
 *                      arriving sentence already opens Findings.
 *   4 what is moving   every seat inside a run by name with a live clock, and
 *                      nothing at all when nobody is (CrewAtWork); then the
 *                      seven stations drawn once, as the promise before the
 *                      first run and as a map of where every run stands after
 *                      it, never as a menu (JourneyMap); then this workspace's
 *                      own ranked bets, from its own evidence
 *   5 your runs        one row per run with its position on the road, one
 *                      sentence, and the one control its state needs
 *
 * ── THE REFERENCE, NAMED BEFORE BUILDING ──────────────────────────────────
 * Anthropic, OpenAI and Perplexity open on one sentence and one box. Codex
 * puts startable cards under it. Cursor and Devin list work as rows with one
 * distinguishing fact. What none of them has is a road, because their work
 * has no stations; ours does, and drawing it is the product's own model
 * said in a glance.
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

export function placeholderFor(product: { name: string; northStar: string | null } | null): string {
  if (product?.northStar) {
    /* The goal is a sentence in the product's own words ("Get 40% of active
       users to a funded savings goal"), so it follows "Help <name>" with its
       first letter lowered, and never a preposition it was not written for. */
    const goal = product.northStar.trim().replace(/[.]+$/, "");
    const first = goal.split(/\s+/)[0]?.toLowerCase() ?? "";
    if (GOAL_VERBS.has(first)) {
      return `Help ${product.name} ${goal.charAt(0).toLowerCase()}${goal.slice(1)}`;
    }
  }
  if (product?.name) return `Change one thing in ${product.name}, and say what it should do`;
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
  const [station, setStation] = useState<JourneyKey | null>(null);
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
  const roadMode = runs.data !== undefined ? homeRoadMode(runs.data) : null;

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
    if (!subject) return placeholderFor(null);
    return placeholderFor({ name: subject, northStar: chosen?.northStar ?? null });
  }, [productGoals.data, products, activeProductId, activeProduct, activeWorkspace]);
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

  /* THE ROUTE THIS SENTENCE TAKES, picked by the person rather than assumed
     (fifth review, 2026-09-09). Discover-first stays the default, per the
     founder's own §5E ruling; a card that carries its own shape overrides it. */
  const [pickedShape, setPickedShape] = useState<WorkShape>("new-capability");

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
  const heroReady =
    !workspaceLoading &&
    seeded &&
    !queueRead.isPending &&
    !(runs.isPending && runs.fetchStatus === "fetching");

  const sinceYouLooked = homeAnswers({
    waitingShape: null,
    arrivingCount: homeReads.isSuccess ? homeReads.data.arrivingCount : null,
    lastLookedAt: homeReads.isSuccess ? homeReads.data.lastLookedAt : null,
    learnedCount: homeReads.isSuccess ? homeReads.data.learnedCount : null,
    rescoredCount: homeReads.isSuccess ? homeReads.data.rescoredCount : null,
    releases: homeReads.isSuccess ? homeReads.data.releases : null,
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
   * WHO IS WORKING WHERE, on the road itself. The same read and key the
   * Working-now strip and the rail crew use (one request, one cache entry;
   * useRunningNowPush moves it the moment a seat starts or stamps), so the
   * map's dots and the strip's rows can never disagree.
   */
  const fRunning = useServerFn(listRunningNow);
  const running = useQuery({
    queryKey: runningNowKey(activeWorkspaceId ?? null),
    queryFn: () => fRunning({ data: { workspaceId: activeWorkspaceId ?? null } }),
    refetchInterval: 10_000,
    enabled: seeded,
  });
  /* HOW LONG EACH STATION USUALLY TAKES HERE (Lane 3, readStationTimings):
     the map's working station says it, so the wait has a shape. */
  const fTimings = useServerFn(readStationTimings);
  const timings = useQuery({
    queryKey: ["station-timings", activeWorkspaceId ?? null],
    queryFn: () => fTimings({ data: { workspaceId: activeWorkspaceId as string } }),
    enabled: Boolean(activeWorkspaceId),
    staleTime: 5 * 60_000,
  });
  /* The map is recomposed once a second while a seat works, or "past its
     usual time" and "quiet for N min" could never appear: nothing in the
     data changes while a seat stalls (third review, 2026-09-08). */
  const anySeat = (running.data?.length ?? 0) > 0;
  const [mapTick, bumpMap] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    if (!anySeat) return;
    const id = setInterval(bumpMap, 1_000);
    return () => clearInterval(id);
  }, [anySeat]);
  const map = useMemo(
    () =>
      withTimings(
        withPresences(
          journeyMap(runs.data ?? []),
          /* The quiet length rides along so the map's stop prints the
             strip's own "quiet for N min" (fourth review, 2026-09-09). */
          workingSeats(running.data).map((s) => {
            const quiet = quietFor(s, Date.now());
            return { ...s, alive: !quiet, ...(quiet ? { quietMs: quiet } : {}) };
          }),
          presenceColour,
        ),
        timings.data,
      ),
    // `mapTick` is the clock.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [runs.data, running.data, timings.data, mapTick],
  );
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
    <div className="mx-auto flex w-full max-w-[62rem] flex-col gap-mrd-6 px-mrd-5 pt-mrd-7 pb-mrd-8">
      {/* THE HERO WAITS FOR ITS NAME (Lane 1, 2026-09-08). Seen live: "What
          should your product do next?" for a beat before the workspace
          resolved, then "What should Prism do next?". A headline that
          changes its subject is a headline nobody trusts; the slot holds its
          height and the words arrive once. */}
      <div className="min-h-[7.5rem]">
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
      <div data-page-composer className="mt-mrd-5 flex flex-col gap-mrd-4">
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
        <ComposerRoutePicker shape={pickedShape} onSelect={setPickedShape} />
        {/* WHAT THE WORKSPACE ALREADY HOLDS ABOUT THE SENTENCE BEING TYPED.
            Anticipation: the evidence read happens while the person types,
            settled and debounced, so the first thing they learn about their
            own sentence arrives before they press Enter. Built in August,
            never mounted; Lane 2 kept it from deletion for exactly this. */}
        <WhatWeAlreadyHold subject={sentence} />
      </div>

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

      {/* WHAT THE MACHINE DID WHILE YOU WERE AWAY, ABOVE THE FOLD.
          
          The founder's complaint that this page exists to answer is "I cannot
          feel the value". The value of this product is not the queue: it is
          that work was decided, built, shipped and then graded against what it
          promised. That proof lived in three mute sentences at position six of
          seven, under a run list, while a count of what he owed was the
          headline in 32px. So the page led with a debt and buried the return.

          These two blocks are one movement and they are the same question,
          which is why the arriving answer and the Findings strip already
          negotiate one door between them: what came back, and what is coming
          in. They read directly under the box a person hands work to, which
          makes the page a sequence rather than a set of regions: what needs
          you, hand something over, here is what came of the last time, here is
          what is moving, here is your list. */}
      <HomeAnswers answers={sinceYouLooked} className="mt-mrd-5" />
      {/* THE EVIDENCE, DIRECTLY UNDER THE ANSWERS IT BELONGS TO. The answer
          above says a decision came back this week; this says which one, what
          it committed to, and what came back. Reading them in that order is the
          page going from a count to a fact, which is the whole move. */}
      <WhetherItWorked it={itWorked} className="mt-mrd-5" />
      {/* WHAT IS ARRIVING (founder, 2026-09-02 19:12): the
          product's central claim, evidence becomes work on its own, provable
          on the page a person actually lands on. */}
      <Arriving door={!sinceYouLooked.some((a) => "to" in a.door && a.door.to === "/arriving")} />

      <CrewAtWork workspaceId={activeWorkspaceId ?? null} onOpen={openRun} className="mt-mrd-5" />

      {roadMode ? (
        <JourneyMap
          mode={roadMode}
          stations={roadMode === "map" ? map : promiseStations()}
          selected={station}
          onSelect={(key) => {
            setStation(key);
            /* The list the press filtered is usually below the fold: bring it
               up, so the press is seen to do something. */
            if (key) {
              document
                .querySelector("[data-your-runs]")
                ?.scrollIntoView({ block: "start", behavior: "smooth" });
            }
          }}
        />
      ) : null}

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
      {startersStand(runs.data, bets.data?.length ?? 0) && activeProductId && activeProduct ? (
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
      {seeded && !firstRun ? (
        <YourRuns station={station} onClearStation={() => setStation(null)} className="mt-mrd-5" />
      ) : null}
    </div>
  );
}
