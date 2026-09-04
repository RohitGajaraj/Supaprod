/**
 * ── THREE JOBS, EACH A WHOLE SENTENCE, EACH WITH ITS OWN START ────────────
 *
 * ── WHAT THIS REPLACES, AND WHY IT IS NOT THE SAME CONTROL ────────────────
 * `/start` carried a four-card picker of work SHAPES -- "New capability",
 * "Existing feature", "Under the hood" -- and picking one only changed the
 * composer's placeholder and the `shape` the track was filed with. So the
 * cards asked a person to classify their work before describing it, which is
 * the taxonomy question a product asks when it has not decided what it does.
 * Nobody arrives wanting to pick a shape.
 *
 * These are jobs. Each is a full sentence a person could have typed, and
 * pressing one starts that run. The shape rides along underneath, chosen by us
 * rather than asked of them.
 *
 * ── THE REFERENCE, NAMED BEFORE BUILDING ──────────────────────────────────
 * Codex (Mobbin, pulled 2026-09-02): *"What should we code next?"*, one box,
 * then **Start your first task** as three cards, each a full sentence with its
 * own Start button. Claude Code web: one box whose placeholder is a real
 * greyed example sentence, with job cards below. What is borrowed is that a
 * person's first move is to press a whole thought, not to fill a form: the
 * fastest way to understand what a product does is to watch it do one thing.
 *
 * ── WHY THREE AND NOT SEVEN ───────────────────────────────────────────────
 * Three is what fits on one line at the width this page is read at, and it is
 * also the honest number: these have to be jobs the loop can genuinely walk
 * today, and each one below names a station the product actually reaches. A
 * fourth card would be there to fill the row.
 */
import { Action } from "@/components/meridian/surface-parts";
import { PickCard } from "@/components/meridian/onramp-parts";
import { SketchBroken, SketchProblem, SketchScreen } from "@/components/meridian/sketch-glyphs";
import type { WorkShape } from "@/lib/spine/route";
import type { TopOpportunity } from "@/lib/discovery.functions";
import { clockInZone } from "@/lib/time-of-day";

export type ExampleJob = {
  /** The sentence, exactly as it lands in the composer. */
  sentence: string;
  /** One line on what the run will do, in the product's own words. */
  sub: string;
  shape: WorkShape;
  glyph: React.ReactNode;
  /** Set when this bet already shipped (P-126): the card reads what
   *  happened instead of offering to start it again. Null for every
   *  example, which cannot ship because it was never a real bet. */
  shipped?: { at: string; trackId: string | null } | null;
};

/**
 * P-14 (A-QUEUE.md ruling): a real, ranked bet, converted into the shape this
 * card already knows how to start. Pressing it IS "Keep" now -- `/decide`'s
 * own Keep/Challenge/Drop retired with the page (R-34): Keep starts the run,
 * Challenge is the Critic already running at that run's own Decide station,
 * Drop is a decision made on the run, once it exists.
 *
 * `shape` is `"existing-feature"`, never `"new-capability"`: a bet came from
 * evidence about something already true of the product, not a blank slate,
 * and `existing-feature` is what carries `origin` (the bet's own problem
 * statement) into the composer's `startTrack` call so Discover inherits why
 * this was proposed rather than starting from nothing.
 */
export function jobFromOpportunity(o: TopOpportunity): ExampleJob {
  return {
    sentence: o.title,
    sub: o.problem,
    shape: "existing-feature",
    glyph: <SketchProblem />,
    shipped: o.shipped ?? null,
  };
}

/** "Shipped 12:28" -- the card's own state once its bet has one (P-126),
 *  read through the person's own zone (P-130), never the deploy's UTC. */
export function shippedLabel(shippedAt: string, zone: string): string {
  return `Shipped ${clockInZone(shippedAt, zone)}`;
}

/**
 * ── P-33 RETIRED THE CONCRETE CHECKOUT EXAMPLES (P-85, A-QUEUE.md) ─────────
 * These three used to be "Make the checkout accept an American Express
 * card", "Cut the sign-up form from nine fields to four" and "Find out why
 * people abandon the address step" -- a real, specific e-commerce product's
 * homework, shown unconditionally to every workspace with no arrivals yet,
 * including a payroll tool's or a scheduling app's. Read live in the empty
 * probe workspace: a person whose product has nothing to do with checkouts
 * was handed three sentences about somebody else's.
 *
 * This is now the LAST tier, shown only when there is no product to shape an
 * example from either (`productExampleJobs` below is tried first). So these
 * three carry no product noun at all -- not "checkout", not "sign-up form",
 * not "address step" -- and name the THREE SHAPES a sentence here can take
 * (a capability, a change, a question) rather than a concrete instance of
 * one. `phoneBarCoversEveryDoor`-style guard:
 * `example-jobs-name-no-domain.test.ts` asserts no known product/domain noun
 * from any other workspace ever appears here.
 */
export const GENERIC_EXAMPLE_JOBS: readonly ExampleJob[] = [
  {
    sentence: "Add a capability this product doesn't have yet",
    sub: "A capability that does not exist yet. It walks the whole route.",
    shape: "new-capability",
    glyph: <SketchScreen />,
  },
  {
    sentence: "Change how something already works",
    sub: "A change to something that already works, decided before it is built.",
    shape: "existing-feature",
    glyph: <SketchProblem />,
  },
  {
    sentence: "Find out why something isn't happening the way you'd expect",
    sub: "Starts at the evidence rather than at a solution.",
    shape: "existing-feature",
    glyph: <SketchBroken />,
  },
];

/**
 * Retained under its old name for any import this repo has not yet moved
 * (`git grep EXAMPLE_JOBS` before deleting this alias) -- same value as
 * `GENERIC_EXAMPLE_JOBS`, so nothing reading it still sees a checkout.
 */
export const EXAMPLE_JOBS = GENERIC_EXAMPLE_JOBS;

/**
 * ── THE MIDDLE TIER: SHAPED FROM THE PRODUCT'S OWN NAME AND GOAL ──────────
 * A workspace with a product but no arrivals yet (P-85's own middle case)
 * gets three sentences naming ITS product and ITS stated goal
 * (`projects.north_star`, read by `listProductGoals` in
 * `spine/track.functions.ts`) instead of the fully generic set above. Still
 * the three shapes -- capability, change, question -- so a person learns the
 * same lesson the generic tier teaches, but reads their own product's name
 * doing it.
 *
 * Phrased around the goal with "for"/"toward"/"and", not fused into it
 * grammatically: `northStar` is free text a founder wrote (a noun phrase, a
 * full sentence, anything), and a template that tried to conjugate it into a
 * verb clause would read wrong for half of what people actually write there.
 */
export function productExampleJobs(productName: string, northStar: string): ExampleJob[] {
  return [
    {
      sentence: `Give ${productName} a capability it needs for ${northStar}`,
      sub: "A capability that does not exist yet. It walks the whole route.",
      shape: "new-capability",
      glyph: <SketchScreen />,
    },
    {
      sentence: `Change something in ${productName} that's in the way of ${northStar}`,
      sub: "A change to something that already works, decided before it is built.",
      shape: "existing-feature",
      glyph: <SketchProblem />,
    },
    {
      sentence: `Find out what's standing between ${productName} and ${northStar}`,
      sub: "Starts at the evidence rather than at a solution.",
      shape: "existing-feature",
      glyph: <SketchBroken />,
    },
  ];
}

/**
 * ── AN EXAMPLE IS A SENTENCE TO EDIT; A BET IS WORK TO START (P-33) ───────
 *
 * These two lists used to be one control. `jobs = showingBets ? bets : EXAMPLE_JOBS`
 * rendered both through the same `PickCard`, under the same "Or start one of
 * these.", each with the same **Start it**, and pressing either called the same
 * `onStart` -- which starts a real run immediately. The only thing that differed
 * was the `aria-label`, which nobody sees.
 *
 * So on a new workspace, the first three things the product offered were
 * indistinguishable from work it had ranked for the person, and pressing one
 * filed a real run about a checkout, a sign-up form or an address step that
 * their product may not have. It spends a model budget and produces artifacts
 * reasoning about a feature nobody has. P-33 names this directly: no "Or start
 * one of these" cards that are not the workspace's own.
 *
 * The examples are still worth showing -- an empty workspace that offers only a
 * blank box teaches nothing, and the fastest way to learn what a product takes
 * is to read a sentence it would accept. What they must not do is pretend to be
 * the workspace's own ranked work. So:
 *
 *   a real bet     starts the run on press. It IS this workspace's work,
 *                  ranked from its own evidence, and Start it is the truth.
 *   an example     loads the sentence into the composer and puts the cursor
 *                  there. The person edits it into their own product's words
 *                  and presses the one Start this page already has.
 *
 * That is also the honest teaching move: the lesson is the SHAPE of a sentence
 * this product can walk, and you learn it by editing one, not by watching a run
 * about somebody else's checkout.
 */
export function ExampleJobs({
  onStart,
  onUse,
  onOpenRun,
  busy = false,
  bets = [],
  productExample = null,
  zone = Intl.DateTimeFormat().resolvedOptions().timeZone,
}: {
  /** A real bet: start that run now. Never called for an example, and never
   *  for a bet that has already shipped. */
  onStart: (job: ExampleJob) => void;
  /**
   * An example: put the sentence in the composer and focus it, starting
   * nothing. Never called for a bet.
   */
  onUse: (job: ExampleJob) => void;
  /**
   * A shipped bet's own door (P-126): open the run that shipped it, when
   * one can be named. Never called for anything that has not shipped.
   */
  onOpenRun?: (trackId: string) => void;
  busy?: boolean;
  /**
   * The top three real bets by ICE, when any exist (`listTopOpportunities`,
   * P-14 ruling). Shown INSTEAD of the static examples, never alongside them:
   * once a workspace has real ranked work, three generic examples beside it
   * would outrank nothing and teach nothing a real bet does not teach better.
   * An empty workspace has no bets yet, so the examples keep doing the job
   * they were built for -- showing a new workspace what the product does.
   */
  bets?: readonly TopOpportunity[];
  /**
   * P-85's middle tier: this workspace's product name and its own stated
   * goal (`north_star`), when both exist. Tried only once `bets` is empty --
   * a workspace with real ranked work never reaches for either fallback
   * tier. Null falls through to the fully generic `GENERIC_EXAMPLE_JOBS`.
   */
  productExample?: { name: string; northStar: string } | null;
  /** The person's own zone (P-130), for a shipped card's own clock reading.
   *  Defaults to the browser's when the caller has not resolved it yet. */
  zone?: string;
}) {
  const showingBets = bets.length > 0;
  const jobs = showingBets
    ? bets.map(jobFromOpportunity)
    : productExample
      ? productExampleJobs(productExample.name, productExample.northStar)
      : GENERIC_EXAMPLE_JOBS;
  return (
    <section
      data-mrd=""
      className="flex flex-col gap-mrd-3 font-mrd"
      aria-label={showingBets ? "Ranked bets" : "Example sentences"}
    >
      {/*
       * THE LINE SAYS WHICH LIST THIS IS, because the cards below cannot.
       * "Or start one of these" over three sentences we hard-coded is the claim
       * P-33 forbids; said over three bets ranked from the workspace's own
       * evidence it is simply true.
       */}
      <p className="mrd-meta">
        {showingBets
          ? "Or start one of these, ranked from what has arrived."
          : "No runs yet. These are examples of sentences this takes. Edit one into your own words."}
      </p>
      <div className="grid gap-mrd-3 sm:grid-cols-3">
        {jobs.map((job) => {
          /*
           * A SHIPPED BET IS A FACT TO READ, NOT WORK TO START (P-126,
           * A-QUEUE.md). Pressing this card once meant "run this now"; once
           * its own spec has `shipped_at`, that promise is false -- the work
           * already happened. The card stays in its ranked place (removing
           * it silently would read as the ranking forgetting what it did)
           * but names what happened instead of offering to redo it.
           */
          const shipped = showingBets ? job.shipped : null;
          return (
            <div key={job.sentence} className="flex flex-col gap-mrd-2">
              {/*
               * `PickCard` with `selected={false}` always: these are not a choice
               * a person makes and then confirms, they are three things that can
               * be started. Carrying a selected state would promise a form.
               */}
              <PickCard
                lead={job.sentence}
                sub={job.sub}
                glyph={job.glyph}
                selected={false}
                onSelect={() => {
                  if (shipped) {
                    if (shipped.trackId) onOpenRun?.(shipped.trackId);
                    return;
                  }
                  showingBets ? onStart(job) : onUse(job);
                }}
              />
              {/*
               * ITS OWN CONTROL, per the packet and per Codex's card. The card is
               * pressable too, so this is a second door to one act rather than the
               * only one -- which is what makes it safe: a person who reads the
               * sentence and wants it can press either.
               *
               * The VERB is the difference between the two lists, and it is the
               * only promise this card makes. "Start it" on an example we wrote
               * would be a promise to run somebody else's work against their
               * product; "Use this sentence" says exactly what the press does.
               *
               * `busy` is a start being in flight, so it only applies to the
               * control that starts one. Filling a text field has nothing to
               * wait for.
               */}
              <div>
                {shipped ? (
                  <span className="flex items-center gap-mrd-2">
                    <span className="mrd-meta">{shippedLabel(shipped.at, zone)}</span>
                    {shipped.trackId
                      ? (() => {
                          const trackId = shipped.trackId as string;
                          return (
                            <Action variant="quiet" onClick={() => onOpenRun?.(trackId)}>
                              See the run
                            </Action>
                          );
                        })()
                      : null}
                  </span>
                ) : showingBets ? (
                  <Action variant="quiet" busy={busy} onClick={() => onStart(job)}>
                    Start it
                  </Action>
                ) : (
                  <Action variant="quiet" onClick={() => onUse(job)}>
                    Use this sentence
                  </Action>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default ExampleJobs;
