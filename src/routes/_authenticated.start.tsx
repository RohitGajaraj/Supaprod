import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { searchFlag } from "@/lib/search-flag";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Receipt } from "@/components/meridian/Receipt";
import { Row } from "@/components/meridian/rows";
import { Action } from "@/components/meridian/surface-parts";
import { Composer } from "@/components/meridian/onramp-parts";
import type { JourneyKey } from "@/components/meridian/Journey";
import { ExampleJobs, type ExampleJob } from "@/components/start/ExampleJobs";
import { YourRuns } from "@/components/start/YourRuns";
import { Arriving } from "@/components/start/Arriving";
import { Hero, heroCopy } from "@/components/start/Hero";
import { JourneyMap, promiseStations } from "@/components/start/JourneyMap";
import { CrewAtWork } from "@/components/start/CrewAtWork";
import { WhatWeAlreadyHold } from "@/components/spine/WhatWeAlreadyHold";
import { journeyMap } from "@/components/start/journey-of-a-run";
import { failureLine } from "@/lib/error-copy";
import { SessionEnded, endedSessionFor } from "@/components/system/SessionEnded";
import { useWorkspace } from "@/hooks/use-workspace";
import { useTimezone } from "@/hooks/use-timezone";
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
 *   the message      one headline that names the product and says what to do
 *                    or what needs you, and one line that says what happens
 *                    when you press Enter (Hero)
 *   the composer     the one thing they came to do
 *   working now      every seat inside a run, by name, with a live clock, and
 *                    nothing at all when nobody is (CrewAtWork)
 *   the road         the seven stations, drawn once: as the promise before the
 *                    first run, as a map of where every run stands after it,
 *                    and never as a menu (JourneyMap)
 *   ranked bets      this workspace's own, from its evidence, when it has any;
 *                    the invented examples are gone
 *   your runs        one row per run with its position on the road, one
 *                    sentence, and the one control its state needs
 *   since you looked what came in, what shipped, what was learned, only when
 *                    the number is not zero. Outcomes is a rail row, so the
 *                    foot carries no second door to it (two doors, one
 *                    question).
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

export function placeholderFor(product: { name: string; northStar: string | null } | null): string {
  if (product?.northStar) return `Give ${product.name} what it needs for ${product.northStar}`;
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
  validateSearch: (search: Record<string, unknown>): { about?: string; queue?: true } => ({
    /*
     * "SHOW ME WHAT IS WAITING ON ME." Five live doors set this. `searchFlag`
     * rather than a hand-rolled comparison: TanStack runs every value through
     * `JSON.parse` before a validator sees it, so `?queue=1` arrives as the
     * NUMBER 1 and a string comparison misses it.
     */
    queue: searchFlag(search.queue),
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
  } = useWorkspace();
  const { about, queue } = Route.useSearch();
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
  const fRuns = useServerFn(listRunsForStart);
  const runs = useQuery({
    queryKey: ["start-runs", activeWorkspaceId ?? null],
    queryFn: measuredQueryFn("listRunsForStart", () =>
      fRuns({ data: { workspaceId: activeWorkspaceId ?? null } }),
    ),
    refetchInterval: 10_000,
  });
  /* Only once the read has ANSWERED. */
  const firstRun = runs.data !== undefined && runs.data.length === 0;
  const anyOpen = (runs.data ?? []).some((r) => r.status === "open");

  /* P-14: the ranked bets' home is here. */
  const fBets = useServerFn(listTopOpportunities);
  const bets = useQuery({
    queryKey: ["start-top-opportunities", activeWorkspaceId ?? null],
    queryFn: measuredQueryFn("listTopOpportunities", () =>
      fBets({ data: { workspaceId: activeWorkspaceId ?? null } }),
    ),
    staleTime: 60_000,
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
  });
  const placeholder = useMemo(() => {
    const goals = productGoals.data ?? [];
    const chosen =
      (activeProductId ? goals.find((g) => g.productId === activeProductId) : null) ?? goals[0];
    const name = chosen
      ? products.find((p) => p.id === chosen.productId)?.name
      : activeProduct?.name;
    if (!name)
      return placeholderFor(activeProduct ? { name: activeProduct.name, northStar: null } : null);
    return placeholderFor({ name, northStar: chosen?.northStar ?? null });
  }, [productGoals.data, products, activeProductId, activeProduct]);

  const go = useMutation({
    mutationFn: async (job?: ExampleJob) => {
      const s = (job?.sentence ?? sentence).trim();
      const shape: WorkShape = job?.shape ?? "new-capability";
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
  });
  const waiting = queueRead.isSuccess ? (queueRead.data?.items ?? []).length : null;

  const sinceYouLooked = homeAnswers({
    waitingShape: null,
    arrivingCount: homeReads.isSuccess ? homeReads.data.arrivingCount : null,
    lastLookedAt: homeReads.isSuccess ? homeReads.data.lastLookedAt : null,
    learnedCount: homeReads.isSuccess ? homeReads.data.learnedCount : null,
    releases: homeReads.isSuccess ? homeReads.data.releases : null,
    zone: timezone,
    nowIso: new Date().toISOString(),
  }).filter((a) => a.read === "answered");

  const map = useMemo(() => journeyMap(runs.data ?? []), [runs.data]);
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
    <div className="mx-auto flex w-full max-w-[62rem] flex-col gap-mrd-7 px-mrd-5 pt-mrd-7 pb-mrd-8">
      <Hero
        copy={heroCopy({
          product: activeProduct?.name ?? activeWorkspace?.name ?? null,
          runs: runs.data,
          waiting,
        })}
      />

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
          placeholder={placeholder}
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
      {go.isError ? (
        <Receipt
          verb="Nothing was started"
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

      <CrewAtWork workspaceId={activeWorkspaceId ?? null} onOpen={openRun} />

      {runs.data !== undefined ? (
        <JourneyMap
          mode={anyOpen ? "map" : "promise"}
          stations={anyOpen ? map : promiseStations()}
          selected={station}
          onSelect={setStation}
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

      {!firstRun ? <YourRuns station={station} onClearStation={() => setStation(null)} /> : null}

      <HomeAnswers answers={sinceYouLooked} />

      {/* WHAT IS ARRIVING, UNDER THE RUNS (founder, 2026-09-02 19:12): the
          product's central claim, evidence becomes work on its own, provable
          on the page a person actually lands on. */}
      <Arriving />
    </div>
  );
}
