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

export type ExampleJob = {
  /** The sentence, exactly as it lands in the composer. */
  sentence: string;
  /** One line on what the run will do, in the product's own words. */
  sub: string;
  shape: WorkShape;
  glyph: React.ReactNode;
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
  };
}

/**
 * ── EVERY SENTENCE HERE IS ONE THE LOOP CAN ACTUALLY WALK ─────────────────
 * An example that stalls at the first station teaches a person the product does
 * not work, which is the most expensive thing a front door can teach. Each of
 * these is a shape the route already handles end to end, and each is written the
 * way a person writes: an outcome, not a ticket title.
 */
export const EXAMPLE_JOBS: readonly ExampleJob[] = [
  {
    sentence: "Make the checkout accept an American Express card",
    sub: "A capability that does not exist yet. It walks the whole route.",
    shape: "new-capability",
    glyph: <SketchScreen />,
  },
  {
    sentence: "Cut the sign-up form from nine fields to four",
    sub: "A change to something that already works, decided before it is built.",
    shape: "existing-feature",
    glyph: <SketchProblem />,
  },
  {
    sentence: "Find out why people abandon the address step",
    sub: "Starts at the evidence rather than at a solution.",
    shape: "existing-feature",
    glyph: <SketchBroken />,
  },
];

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
  busy = false,
  bets = [],
}: {
  /** A real bet: start that run now. Never called for an example. */
  onStart: (job: ExampleJob) => void;
  /**
   * An example: put the sentence in the composer and focus it, starting
   * nothing. Never called for a bet.
   */
  onUse: (job: ExampleJob) => void;
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
}) {
  const showingBets = bets.length > 0;
  const jobs = showingBets ? bets.map(jobFromOpportunity) : EXAMPLE_JOBS;
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
        {jobs.map((job) => (
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
              onSelect={() => (showingBets ? onStart(job) : onUse(job))}
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
              {showingBets ? (
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
        ))}
      </div>
    </section>
  );
}

export default ExampleJobs;
