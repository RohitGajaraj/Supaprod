import * as React from "react";

import {
  Action,
  Actions,
  Approve,
  Door,
  Eyebrow,
  NothingYet,
  ReadFailedLine,
} from "@/components/meridian/surface-parts";
import { StatusChip, type StatusWord } from "@/components/meridian/StatusChip";
import { resolveMemoryScope, type MemoryOrigin } from "@/lib/memory-scope";

/*
 * A LESSON GRADUATING IS AN EVENT, NOT AN ACCIDENT.
 *
 * ── WHAT THIS IS FOR, AND WHY IT IS NOT A BADGE ─────────────────────────
 * A lesson earned in one product is put forward to hold across the whole
 * workspace, and a person rules on it. This card is that moment. It says what
 * was learned, what settled it, what it would guide next, and it carries the
 * three answers a person can give.
 *
 * The build manual's test for a finished feature is what READS a thing and
 * WHEN. A card that only marked a lesson as promoted would fail that test: the
 * mark has no reader. So the consumer is named on the card itself, in `guides`,
 * and the settled state prints it back rather than dissolving into a toast.
 *
 * ── WHY IT IS NOT `Gate`, WHICH IS THE FIRST THING TO CHECK ─────────────
 * `Gate` is close and was tried. It gives the orchid marker, the 20px question,
 * one recessed block of lines and an actions row, and this file deliberately
 * takes its stops so the two never read as two products: pane radius on the
 * sheet ground, a 20px subject, and the facts recessed onto `--mrd-sink`.
 *
 * Three things it cannot say, and each one is the point of this card:
 *
 *   ONE BLOCK, ONE LABEL. `Gate` has a single `lines` block with a single
 *       `linesLabel`. Here there are two groups pointing in OPPOSITE DIRECTIONS
 *       IN TIME: what already settled this, and what it would guide from here.
 *       Collapsing those into one bullet list is exactly the class of
 *       conflation this repo keeps paying for, and a reader deciding whether a
 *       lesson travels has to be able to tell evidence from consequence.
 *   NO SETTLED STATE. `Gate` renders the question and stops. A judgment that
 *       leaves nothing behind teaches a person their judgment left no trace,
 *       which `Receipt.tsx` argues at length and which is the whole reason this
 *       product exists.
 *   ONE MOOD ONLY. `Gate` hardcodes "Waiting on you" and the orchid dot. The
 *       commonest row in production is one that may NOT be put forward at all,
 *       and drawing that in a gate's clothes asks for a decision nobody can
 *       make.
 *
 * ── WHY IT IS NOT `MemoryReviewQueue`, WHICH ALREADY LOOKS LIKE THIS ────
 * `src/components/memory/MemoryReviewQueue.tsx` is a two-answer approve/reject
 * queue over `memory_candidates` and it is a DIFFERENT QUESTION. That one is
 * the write gate: does this lesson enter at all. This one is the scope gate:
 * the lesson is already in, and the question is whether it crosses out of the
 * product it was learned in. A workspace holding more than one product is the
 * majority state, so the second question is not a refinement of the first.
 *
 * ── WHERE THE PROMOTABILITY ANSWER COMES FROM ───────────────────────────
 * `resolveMemoryScope`, called here rather than passed in. The card takes the
 * row's `kind` and `origin` and asks the one module that decides, which means a
 * card CANNOT offer to promote a measurement however it was labelled. That is
 * the governance half: promotion is the moment evidence could cross a product
 * boundary, and the surface enforcing the same rule as the retrieval path is
 * what stops the two from disagreeing.
 *
 * Its `reason` is written to be read in exactly this prompt, so it is printed
 * verbatim rather than re-said in this file's own words.
 *
 * ── THE STATUS WORDS, AND THE ARGUMENT FOR EACH ─────────────────────────
 * Four of the five appear here, each for its one meaning, and the resting state
 * is the one worth arguing because the obvious answer is wrong.
 *
 * AT REST IT IS `you`, NOT `pass`. A graduation is an outcome, and if this card
 * drew a graduation that had happened then green would be right. It does not:
 * it draws the moment BEFORE, a proposal nobody has ruled on. The colour law is
 * explicit that green and red report an outcome that has happened and never an
 * intent, and painting a proposed promotion green would tell a reader the
 * lesson already travels. Orchid is literally true instead: a person is
 * required and a decision by this reader releases it, which is the one thing
 * `--mrd-you` is allowed to mean. `RecommendationCard` reached the same place
 * for the same reason and hands over to `pass` once resolved.
 *
 * SETTLED IT IS `pass` OR `fail`, WHICH IS THE PAIR THE GRAMMAR ASKS FOR. The
 * graduation either happened or it was ruled out, and both are outcomes. Red is
 * available here in a way it was not for `Refused`, whose whole problem was that
 * `ReadFailed` had already spent red one slot away; the neighbour here is green,
 * so the pair reads as the two ends of one question rather than as two kinds of
 * trouble.
 *
 * `hold` CARRIES BOTH THE NOT-YET AND THE NOT-PROMOTABLE. meridian.css declares
 * it as stopped and not on you, which is a literal description of both: "not
 * yet" is stopped pending more evidence, and a measurement is stopped by a rule
 * no click can move. NOT `you` for either, because orchid promises a control
 * that releases it and in both cases nothing this reader presses does.
 *
 * GREYSCALE. Every mood carries `StatusChip`, which puts the WORD inside the
 * chip, and the three settled states change the sentence as well as the hue. Take
 * all colour out and the card still says which of the five things it is. No hue
 * is asked to carry a fact on its own, and nothing here paints a lesson's or a
 * product's identity as a colour ramp.
 *
 * ── WHAT IT REFUSES TO OWN ──────────────────────────────────────────────
 * It persists nothing and reads nothing. The decision leaves as one value and
 * what it means is the caller's, which is `PlanGate`'s position and the reason
 * that component could be built ahead of its wiring.
 *
 * The settled state is held here and is UNCONTROLLED, with no prop to set it. A
 * second way to say it would let a caller's `settled` and this card's own
 * disagree, and the row leaves a real queue on the server round trip anyway.
 *
 * `never` sits in `Actions`' `trailing` slot wearing the destructive face, which
 * is that variant's own documented placement: it REMOVES something, permanently,
 * and what protects a destructive act in this system is distance plus a confirm.
 * The distance is here. THE CONFIRM IS THE CALLER'S, because a Dialog inside a
 * card that persists nothing would be a confirm over an act this file cannot
 * perform.
 */

/** The three answers. `not-yet` and `never` are genuinely different: without the
 *  second, the same rejected lesson is put forward again forever. */
export type PromotionOutcome = "approve" | "not-yet" | "never";

/**
 * ONE THING THAT SETTLED THIS LESSON.
 *
 * `onOpen` is present only where the evidence has an address of its own. Where
 * it has none the label stands alone rather than becoming a control that goes
 * nowhere, which is `NothingHere`'s rule about doors held one layer down.
 *
 * A NOTE ON WHAT WILL ACTUALLY ARRIVE HERE. K-73 found that `precedent` is named
 * in the ruling and written by nothing, and that settled outcomes are written as
 * `kind: "outcome"`. So the rows a wiring finds under a lesson are outcomes and
 * the run and learning ids `house_rules` already carries, never precedents.
 */
export type PromotionEvidence = {
  key: string;
  /** What it is, in a reader's words. Never an id and never a table name. */
  label: string;
  onOpen?: () => void;
};

/** The five things this card can be: two before a decision, three after. */
type PromotionMood = PromotionOutcome | "resting" | "stuck";

/** Chip word per mood. Each is more specific than the default about the SAME
 *  state, which is the only licence `StatusChip` grants a caller. */
const MOOD: Record<PromotionMood, { status: StatusWord; word: string }> = {
  resting: { status: "you", word: "Waiting on you" },
  stuck: { status: "hold", word: "Stays with its product" },
  approve: { status: "pass", word: "Graduated" },
  "not-yet": { status: "hold", word: "Kept with its product" },
  never: { status: "fail", word: "Ruled out" },
};

export function PromotionCard({
  lesson,
  learnedIn,
  kind,
  origin,
  evidence,
  evidenceFailed = false,
  onEvidenceRetry,
  guides,
  onDecide,
}: {
  /** The lesson itself, as the person who wrote it said it. */
  lesson: string;
  /**
   * The product it was learned in.
   *
   * NULLABLE, AND THAT IS THE HONEST SHAPE RATHER THAN A CONVENIENCE. Measured
   * against the generated types on 2026-08-20: neither `agent_memory` nor
   * `learnings` carries a `product_id` column, and `memory_candidates` carries
   * `kind` and `scope` and no product either. So today every real row lands
   * here as null, and the card says so instead of printing a product nobody
   * recorded. It does not block the decision on it: a method lesson is about
   * how to work rather than about one product, so where it came from informs the
   * judgment without gating it.
   */
  learnedIn: string | null;
  /** The row's `agent_memory.kind`. Free text in the column, so anything can
   *  arrive and `resolveMemoryScope` answers for all of it. */
  kind: string;
  origin?: MemoryOrigin;
  /** What settled it. An empty list is a real and different fact from a failed
   *  read, so the two are separate props and never one nullable one. */
  evidence: PromotionEvidence[];
  /** True when the evidence read did not finish. Nobody knows what is under
   *  this lesson, which is not the same as nothing being under it. */
  evidenceFailed?: boolean;
  onEvidenceRetry?: () => void;
  /**
   * What approving would change, one named consumer per line.
   *
   * The build manual's wiring rule in card form: a promotion whose consumer
   * cannot be named has no reader, and a lesson with no reader has not
   * graduated, it has been filed. An empty list is drawn as the gap it is
   * rather than skipped.
   */
  guides: string[];
  onDecide?: (outcome: PromotionOutcome) => void;
}) {
  const [settled, setSettled] = React.useState<PromotionOutcome | null>(null);

  const decision = resolveMemoryScope({ kind, origin });
  const mood = settled ? MOOD[settled] : decision.promotable ? MOOD.resting : MOOD.stuck;

  function settle(outcome: PromotionOutcome) {
    setSettled(outcome);
    onDecide?.(outcome);
  }

  return (
    <section
      data-mrd=""
      className="rounded-mrd-pane border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-6 shadow-mrd-card"
    >
      <StatusChip status={mood.status}>{mood.word}</StatusChip>

      <h2 className="mt-mrd-4 max-w-[62ch] mrd-title">
        {lesson}
      </h2>

      {/*
        WHERE IT CAME FROM, said before anything else, because whether a lesson
        may travel is a question about where it was learned.

        THE SECOND CLAUSE FOLLOWS THE STATE AND THAT IS NOT A FLOURISH. The first
        draft said "put forward for the whole workspace" on every card, which is
        false on a row that may not be put forward and stale on one already
        settled. A sentence that outruns its own wiring is the defect class this
        repo names first, and it is at its most plausible in a line nobody reads
        twice.
      */}
      <p className="mt-mrd-3 max-w-[68ch] mrd-copy">
        {learnedIn ? (
          <>
            Learned in <span className="font-medium text-mrd-ink">{learnedIn}</span>
            {settled ? "." : decision.promotable ? ", put forward for the whole workspace." : "."}
          </>
        ) : (
          <>
            Nothing on this lesson says which product it was learned in
            {settled || !decision.promotable
              ? "."
              : ", so read what settled it before you let it travel."}
          </>
        )}
      </p>

      {settled ? (
        <SettledIn outcome={settled} learnedIn={learnedIn} guides={guides} />
      ) : (
        <>
          <div className="mt-mrd-5 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
            <Eyebrow>What settled it</Eyebrow>
            <div className="mt-mrd-3">
              {evidenceFailed ? (
                <ReadFailedLine onRetry={onEvidenceRetry}>
                  What settled this lesson could not be read, so nobody can say what is under it
                  yet.
                </ReadFailedLine>
              ) : evidence.length === 0 ? (
                <NothingYet>
                  Nothing is attached to this one, so it rests on judgment rather than on a settled
                  result. That is a fair thing to let travel and a harder one to check.
                </NothingYet>
              ) : (
                <ul className="flex flex-col gap-mrd-3">
                  {evidence.map((item) => (
                    <li key={item.key} className="mrd-copy">
                      {item.onOpen ? <Door onClick={item.onOpen}>{item.label}</Door> : item.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* WHAT IT WOULD GUIDE, drawn only where approving is on the table. On
              a row that may not be put forward, this block would describe
              something nobody can cause. */}
          {decision.promotable ? (
            <div className="mt-mrd-4 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
              <Eyebrow>What approving would change</Eyebrow>
              <div className="mt-mrd-3">
                {guides.length === 0 ? (
                  <NothingYet>
                    Nothing here says what would read this lesson next, so approving it would widen
                    where it reaches and change nothing about what happens.
                  </NothingYet>
                ) : (
                  <ul className="flex flex-col gap-mrd-3">
                    {guides.map((line) => (
                      <li key={line} className="mrd-copy">
                        {line}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}

          {/* The one sentence written for this prompt, printed rather than
              paraphrased. On a row that may not be put forward it is also the
              explanation for the missing controls. */}
          <p className="mt-mrd-4 max-w-[68ch] text-[12.5px] leading-relaxed text-mrd-mute">
            {decision.reason}
          </p>

          {decision.promotable ? (
            <Actions
              className="mt-mrd-5"
              trailing={
                <Action variant="destructive" onClick={() => settle("never")}>
                  Never
                </Action>
              }
            >
              <Approve onClick={() => settle("approve")}>Let it guide the workspace</Approve>
              <Action onClick={() => settle("not-yet")}>Not yet</Action>
            </Actions>
          ) : null}
        </>
      )}
    </section>
  );
}

/**
 * WHAT THE JUDGMENT LEFT BEHIND, and every line of it is composed from what the
 * caller already handed over rather than from a default sentence.
 *
 * `Refused` established the rule this follows: a generic detail is the failure
 * mode, so a state that reports a consequence has to name it with the data of
 * the thing it happened to. Approving prints the consumers back, because that
 * is the whole claim; the other two name what did not move.
 *
 * `role="status"` and not `alert`, which is `Receipt`'s argument and the reason
 * it is load bearing rather than decoration: a person using a screen reader
 * pressed a key, an irreversible decision was settled, the queue moved on and
 * nothing was announced. The polite register is right for the answer to
 * somebody's own deliberate press.
 */
function SettledIn({
  outcome,
  learnedIn,
  guides,
}: {
  outcome: PromotionOutcome;
  learnedIn: string | null;
  guides: string[];
}) {
  const product = learnedIn ?? "the product it was learned in";

  return (
    <div data-mrd="" role="status" aria-live="polite" className="mt-mrd-5">
      <p className="max-w-[68ch] mrd-copy">
        <span className="font-medium text-mrd-ink">
          {outcome === "approve"
            ? "You let it guide the workspace."
            : outcome === "not-yet"
              ? `You kept it with ${product}.`
              : "You ruled it out."}
        </span>{" "}
        {outcome === "approve" ? (
          guides.length === 0 ? (
            <>It now holds across every product here, and nothing yet says what reads it.</>
          ) : (
            <>It holds across every product here from the next run on.</>
          )
        ) : outcome === "not-yet" ? (
          <>It is still waiting, so nothing changed anywhere else.</>
        ) : (
          <>It will not be put forward again.</>
        )}
      </p>

      {outcome === "approve" && guides.length > 0 ? (
        <div className="mt-mrd-4 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
          <Eyebrow>What reads it next</Eyebrow>
          <ul className="mt-mrd-3 flex flex-col gap-mrd-3">
            {guides.map((line) => (
              <li key={line} className="mrd-copy">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * NOTHING IS WAITING TO GRADUATE, written once here rather than left to whoever
 * wires the queue.
 *
 * It is `NothingYet` and not `NothingHere`, because the surface that holds this
 * queue draws its own region and the standard caps a region at one bordered box.
 *
 * IT CLAIMS NOTHING ABOUT WHAT HAS BEEN LEARNED SO FAR, which is the trap on
 * exactly this surface. "We learn from your corrections" is the sentence the
 * canon forbids in the present tense, and an empty promotion queue is where it
 * would be most tempting to write it. What is true is what the sentence says:
 * the boundary exists, and a lesson arrives here when it reaches one.
 */
export function NoPromotions({ action }: { action?: React.ReactNode }) {
  return (
    <NothingYet action={action}>
      Nothing is waiting to graduate. A lesson lands here when it holds beyond the product it was
      learned in, and a person decides whether it travels.
    </NothingYet>
  );
}

export default PromotionCard;
