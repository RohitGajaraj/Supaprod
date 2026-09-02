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

export function ExampleJobs({
  onStart,
  busy = false,
  bets = [],
}: {
  /** Fills the composer with the sentence and starts that run. */
  onStart: (job: ExampleJob) => void;
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
      aria-label={showingBets ? "Ranked bets" : "Example jobs"}
    >
      <p className="mrd-meta">Or start one of these.</p>
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
              onSelect={() => onStart(job)}
            />
            {/*
             * ITS OWN START, per the packet and per Codex's card. The card is
             * pressable too, so this is a second door to one act rather than the
             * only one -- which is what makes it safe: a person who reads the
             * sentence and wants it can press either.
             */}
            <div>
              <Action variant="quiet" busy={busy} onClick={() => onStart(job)}>
                Start it
              </Action>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default ExampleJobs;
