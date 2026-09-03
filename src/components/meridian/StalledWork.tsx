/*
 * STALLED WORK, a queue of work that has stopped and why.
 *
 * ── WHY THIS EXISTS ─────────────────────────────────────────────────────
 * Measured in production on 2026-08-14: 12 approval gates were pending, the
 * oldest since 18:31 on 10 August. Eighty-six hours. Each one holds up exactly
 * one named piece of work. Nothing anywhere in the product told anyone.
 *
 * The diagnosis that produced this component was not "the queue is ugly". It
 * was that A PENDING APPROVAL IS A ROW IN A LIST, NOT A STALLED PIECE OF WORK
 * WITH A COST. The gate existed, the queue existed, and the consequence of not
 * answering was invisible. So the loop sat for three and a half days waiting on
 * a click, in a product whose entire claim is that it keeps moving.
 *
 * This component's job is therefore not to list gates. It is to make the COST
 * felt: how long, and what is not happening because of it.
 *
 * ── WHY AGE DRIVES EMPHASIS ─────────────────────────────────────────────
 * Order alone does not communicate cost. A list sorted oldest-first still gives
 * an 86 hour gate and a 51 hour gate the same weight, and both read as routine.
 * Age is the fact that changes what a person should do, so age is what changes
 * the drawing.
 *
 * The emphasis is NOT carried by colour alone. It survives a greyscale test,
 * which is a standing rule here: elevation and type weight do the work, and the
 * hue only confirms it. Turn this screen greyscale and the oldest item is still
 * obviously the oldest.
 *
 * ── WHY TWO REASONS, AND WHY ONLY ONE IS ORCHID ─────────────────────────
 * Meridian's law: ORCHID MEANS A PERSON IS REQUIRED. Work can stop for two
 * different reasons and only one of them is a person.
 *
 *   "you"     a gate is open and a decision unblocks it. Orchid, and it grows
 *             louder with age.
 *   "source"  nothing is connected, so there is no evidence to work on. NOT
 *             orchid, because connecting a source is a setup act rather than a
 *             decision, and dressing it as a decision sends someone looking for
 *             a button that does not exist.
 *
 * That distinction is load-bearing and it came from real data: 26 tracks were
 * starved of evidence while the product told their owners to go inspect a
 * station. The product was pointing at the wrong thing, confidently.
 *
 * ── NO SIDE STRIPES ─────────────────────────────────────────────────────
 * A coloured left border is the reflex for "this one is urgent" and it is
 * refused here. It reads as decoration, it does not survive greyscale, and it
 * puts the emphasis on the container rather than on the fact.
 */

import { stoppedFor } from "@/components/meridian/stopped-for";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/**
 * Four tiers, and the boundaries are chosen from how a working day feels rather
 * than from round numbers. Under four hours is the same working session, so it
 * is not late. Past a day it has survived a night nobody looked. Past three
 * days it has survived a weekend, which is the point at which the product has
 * visibly failed at its own promise.
 */
type Tier = "fresh" | "waiting" | "late" | "stale";

function tierOf(since: number, now: number): Tier {
  const ms = Math.max(0, now - since);
  if (ms < 4 * HOUR) return "fresh";
  if (ms < DAY) return "waiting";
  if (ms < 3 * DAY) return "late";
  return "stale";
}

export type StalledItem = {
  id: string;
  /** What the agent is asking to do, in the product's words, not the tool's. */
  asking: string;
  /** Epoch ms this stopped. Not a formatted string: the tier is computed. */
  since: number;
  /** The single piece of work this is holding up, if it holds up exactly one. */
  blocking?: string;
  /**
   * Why it is stopped. Only "you" carries the accent. Defaults to "you" because an
   * unexplained stall is more likely a gate than a setup gap, and because
   * over-claiming a person's attention is the cheaper mistake to correct.
   */
  reason?: "you" | "source";
  /** The verb that unblocks it. Name the consequence, never "OK" or "Confirm". */
  allowLabel?: string;
  onAllow?: () => void;
  onOpen?: () => void;
};

function Item({ item, now }: { item: StalledItem; now: number }) {
  const reason = item.reason ?? "you";
  const tier = tierOf(item.since, now);
  const needsPerson = reason === "you";

  /*
   * Elevation climbs with age. A fresh item sits in the recess with the rest of
   * the record; a stale one is raised off it. This is the greyscale-safe half
   * of the emphasis and it is why the colour can stay quiet.
   */
  const surface =
    tier === "stale" ? "bg-mrd-lift" : tier === "late" ? "bg-mrd-sheet" : "bg-mrd-sink";

  /*
   * The dot fills as it ages. Outline means waiting, filled means overdue,
   * which is legible before any word is read and without relying on hue.
   */
  /*
   * WAITING ON A SOURCE NOW HAS ITS OWN HUE, 2026-08-15.
   *
   * This used to draw a bare neutral outline, on the reasoning that connecting
   * a source is a setup act rather than a decision, so dressing it in the
   * accent would send someone hunting a button that does not exist. That
   * reasoning was right and its conclusion was too strong: the fix for "do not
   * say YOUR CALL" is not "say nothing at all". A row stopped for want of a
   * source is the most consequential thing on most of these lists, and it was
   * rendering quieter than the rows around it.
   *
   * Amber says the true thing: stopped, and waiting on a condition rather than
   * on you. It ages the same way orchid does, because a source that has been
   * missing for four days is worse than one missing for an hour, and that is
   * true whoever is responsible for it.
   */
  const dotTone = !needsPerson
    ? tier === "stale" || tier === "late"
      ? "bg-mrd-hold border-mrd-hold"
      : "border-mrd-hold-dim"
    : tier === "stale" || tier === "late"
      ? "bg-mrd-you border-mrd-you"
      : "border-mrd-you-dim";

  const ageTone = !needsPerson
    ? tier === "stale"
      ? "text-mrd-hold"
      : tier === "late"
        ? "text-mrd-hold-dim"
        : "text-mrd-mute"
    : tier === "stale"
      ? "text-mrd-you"
      : tier === "late"
        ? "text-mrd-you-dim"
        : "text-mrd-mute";

  const ageWeight = tier === "stale" ? "font-semibold" : "font-medium";

  return (
    <li
      className={`${surface} flex items-start gap-3 rounded-mrd-ctl border border-mrd-line px-4 py-3 transition-colors`}
      style={{ transitionDuration: "var(--mrd-d-move)" }}
    >
      <span aria-hidden className={`mt-1.5 size-2 shrink-0 rounded-full border ${dotTone}`} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-mrd-base font-medium text-mrd-ink">{item.asking}</span>
          {/*
           * The age is the point of the row, so it sits beside the subject
           * rather than being exiled to a right rail where it reads as
           * metadata.
           *
           * ── NOT MONO, 2026-08-15 ────────────────────────────────────────
           * This whole phrase used to be set in the mono face, so "stopped 3
           * days" and "waiting 1 day" rendered as typewriter text. Founder
           * called it on sight, and the system's own rule already agreed:
           * mono is for "every number, duration, count, identifier and
           * timestamp, AND FOR NOTHING ELSE". A sentence that CONTAINS a
           * duration is not a duration, and JetBrains Mono's letterforms —
           * the double-storey a, the tailed g — make a short English phrase
           * read as code rather than as prose.
           *
           * `tabular-nums` STAYS. That is the half of the old treatment that
           * was doing real work: it keeps the digits from jittering as an age
           * ticks over, and it keeps a column of these rows aligned. Tabular
           * figures are available in the sans face too; they were never the
           * reason to reach for mono.
           *
           * The headline above still wraps its duration alone in mono, which
           * is correct: there the mono span contains only "3 days".
           */}
          <span className={`text-mrd-small tabular-nums ${ageTone} ${ageWeight}`}>
            {needsPerson ? "stopped " : "waiting "}
            {stoppedFor(item.since, now)}
          </span>
        </div>

        {item.blocking ? (
          <p className="mt-1 text-mrd-label leading-mrd-snug text-mrd-body">
            {/*
             * Naming the held-up work is the whole argument. "Pending approval"
             * costs a reader nothing to ignore. "Blocking: Homeowners cannot
             * tell a real outage from a firmware reboot" does not.
             */}
            <span className="text-mrd-mute">Blocking: </span>
            {item.blocking}
          </p>
        ) : null}

        {!needsPerson ? (
          <p className="mt-1 text-mrd-label leading-mrd-snug text-mrd-mute">
            No source is connected, so there is nothing for this to read. Connecting one starts it.
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {item.onOpen ? (
          <button
            type="button"
            onClick={item.onOpen}
            className="rounded-mrd-ctl px-2 py-1 text-mrd-label text-mrd-mute transition-colors hover:bg-mrd-hover hover:text-mrd-body"
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            Open
          </button>
        ) : null}
        {needsPerson && item.onAllow ? (
          <button
            type="button"
            onClick={item.onAllow}
            className="rounded-mrd-ctl bg-mrd-solid px-2.5 py-1 text-mrd-label font-medium text-mrd-on-solid transition-opacity hover:opacity-90"
            style={{ transitionDuration: "var(--mrd-d-press)" }}
          >
            {item.allowLabel ?? "Let it run"}
          </button>
        ) : null}
      </div>
    </li>
  );
}

export function StalledWork({
  items,
  now = Date.now(),
}: {
  items: StalledItem[];
  /** Injectable so this renders deterministically in a test or a screenshot. */
  now?: number;
}) {
  const waitingOnPerson = items.filter((i) => (i.reason ?? "you") === "you");
  const sorted = [...items].sort((a, b) => a.since - b.since);
  const oldest = sorted[0];

  if (items.length === 0) {
    /*
     * A good state, drawn quietly. Nothing is stopped, which in this product is
     * the thing everyone wants, so it does not get an illustration, an
     * exclamation mark, or a call to action. It gets one sentence and silence.
     */
    return (
      <p data-mrd="" className="text-mrd-base text-mrd-mute">
        Nothing is stopped, and nothing is waiting on you.
      </p>
    );
  }

  return (
    <section data-mrd="">
      {/*
       * The headline states the cost before the list states the items. A person
       * who reads only this line should already know whether to act, and the
       * oldest age is the fact that decides it.
       *
       * ── AND IT NO LONGER STATES A COUNT (P-56) ────────────────────────────
       *
       * It read "65 pieces of work are stopped, waiting on you." on a page whose
       * heading, directly above, read "66 decisions are ready for you." Same
       * rows: this list is `rest`, which is the queue minus the card already
       * open, so the second number was the first minus one. A visitor totals
       * them and reads 131 obligations where there are 66. The shell and
       * `/today` were fixed for this exact defect on 2026-08-21; this pair was
       * the same defect one page lower.
       *
       * So the heading above states how much is waiting, ONCE, and this states
       * the one fact only this component holds -- the oldest wait, which its own
       * note above already calls the fact that decides whether to act. It was a
       * label under a number; it is the sentence now.
       *
       * The no-one-waiting branch keeps its words: it carries no count, and it
       * is the one case where nothing above says anything about this list.
       */}
      <h2 className="text-mrd-lead leading-mrd-snug font-medium text-mrd-ink">
        {waitingOnPerson.length === 0 ? (
          "Work is stopped, and none of it is waiting on you."
        ) : oldest ? (
          <>
            The oldest has been stopped for{" "}
            <span className="font-mrd-mono tabular-nums">{stoppedFor(oldest.since, now)}</span>.
          </>
        ) : (
          /* Every row undated. `UndatedCalls` draws those separately, so this
             says what it knows rather than inventing an age for them. */
          "Work is stopped, and nothing here says how long."
        )}
      </h2>

      <ul className="mt-4 flex flex-col gap-2">
        {sorted.map((item) => (
          <Item key={item.id} item={item} now={now} />
        ))}
      </ul>
    </section>
  );
}

export default StalledWork;
