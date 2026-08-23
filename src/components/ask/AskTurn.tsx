/**
 * One exchange, in four registers.
 *
 * The prototype (`#askpane`) draws three: `You`, `Answer`, and `From the
 * record`. The fourth arrives from the founder ruling of 2026-07-30: an action
 * you can settle here rather than navigate to. So:
 *
 *   You              what you asked, in your words
 *   Answer           what the crew said, streaming, with what it cost
 *   From the record  a cited fact out of this workspace's own history
 *   Waiting on you   a real gate, with the real resolver behind the button
 *
 * WHY THE THIRD ONE MATTERS MOST. It is what makes this a company brain rather
 * than a chat box, and `Record` is the one lit surface in the whole product,
 * reserved for exactly this. It is therefore also the one place a fabrication
 * would do the most damage, which is why the sentence is assembled by
 * `ask-record.ts` out of server-resolved blocks and never lifted from the
 * model's prose. No fact, no register: the recess is ABSENT, and an honest line
 * about the absence takes its place only when we can actually read that the
 * record held nothing.
 *
 * A register is a LABEL AND A BLOCK OF TEXT, not a bubble. Two nested tinted
 * containers per message, thirty times over, is the wallpaper the rebuild is
 * removing; attribution is the word above the line.
 *
 * THE FIFTH: WHERE IT LANDED. A turn that produced something says where that
 * something now lives, on the station that owns it:
 *
 *   Where it landed  the result, and the way to go and see it
 *
 * It exists because a run that ends in a chat log has not handed back. Ask is
 * additive to the seven stations only while a spec it drafts is findable on
 * Plan afterwards; the moment results only exist inside the transcript, the
 * pane has quietly replaced the stations instead of opening onto them. The
 * `landing` frame (`ask-sse.ts`) is the fact and `AskLanding` is the row.
 *
 * CORRECTED 2026-08-20: this said "nothing emits that frame yet". It does now.
 * `api/chat.ts` sends one when a dispatch produces a real mission row, so the
 * register appears on a turn that started work and stays absent on a turn that
 * only answered a question. That absence is still the correct behaviour and is
 * why the row is inert rather than placeholder-shaped: a turn that landed nowhere
 * has nothing to hand back to.
 */

import * as React from "react";
import { Num } from "@/components/meridian/surface-parts";
import type { AskStreamMsg } from "@/lib/ask-stream-core";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";
import { recordCitationFor } from "@/lib/ask-record";
import { gatesForAnswer, policyProposal } from "@/lib/ask-actions";
import type { ResearchStatus } from "@/components/chat/ResearchActivity";
import { modelLabel, spendLabel } from "@/lib/model-label";
import { Failed, MoreItem, MoreMenu, Record } from "@/components/shell/primitives";
import { Answer } from "./Answer";
import { AskGateCard } from "./AskGateCard";
import { AskLanding, type LandedArtifact } from "./AskLanding";
import { AskBlocked } from "./AskBlocked";
import { AskPlanGate } from "./AskPlanGate";
import type { PlanProposal } from "@/lib/ask/plan-proposal";
import type { PlanGateDecision } from "@/components/meridian/PlanGate";
import type { PlanDecisionState } from "@/hooks/use-ask-stream";
import type { DispatchBlock } from "@/lib/chat-dispatch";
import { AskRunCard } from "./AskRunCard";
import { Working } from "./Working";

export type Turn = { key: string; question: AskStreamMsg | null; answer: AskStreamMsg | null };

/** Pair a flat thread into exchanges. A hydrated thread can open on an answer
 *  (the question scrolled out of the window the server returned), so an answer
 *  with no question in front of it still gets a turn rather than vanishing. */
export function toTurns(messages: AskStreamMsg[]): Turn[] {
  const turns: Turn[] = [];
  for (const m of messages) {
    const open = turns[turns.length - 1];
    if (m.role === "user") {
      turns.push({ key: m.id, question: m, answer: null });
    } else if (open && !open.answer) {
      open.answer = m;
    } else {
      turns.push({ key: m.id, question: null, answer: m });
    }
  }
  return turns;
}

function Register({ name, children }: { name: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "var(--sp-space-5)" }}>
      <div
        style={{
          fontSize: "var(--mrd-t-label)",
          color: "var(--mrd-mute)",
          fontWeight: 500,
          marginBottom: "var(--mrd-s2)",
        }}
      >
        {name}
      </div>
      {children}
    </div>
  );
}

/**
 * WHAT A PERSON TYPED, and it stays verbatim.
 *
 * This is the register the answer does NOT use any more. Your question goes
 * through unparsed on purpose: a `#` you typed is a `#` you meant, `**` inside
 * a filename is part of the filename, and quietly reformatting somebody's own
 * words back at them is the surest way to make them distrust the transcript.
 * Markdown belongs to the crew's prose, which is written to be read; yours was
 * written to be sent. See `Answer` for the other side of that line.
 */
function Said({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "var(--sp-text-prose)",
        color: "var(--mrd-ink)",
        lineHeight: "var(--sp-leading-body)",
        whiteSpace: "pre-wrap",
        // A pasted path or a code fragment breaks inside the column rather than
        // pushing a 392px pane sideways.
        overflowWrap: "anywhere",
      }}
    >
      {children}
    </div>
  );
}

/**
 * WHAT THE EXCHANGE COST, AND IT IS NO LONGER PRINTED IN THE READING COLUMN.
 *
 * "One agentic operating system, every call on the record" is the product's own
 * line, and every Ask exchange spends real money through a chokepoint that
 * already meters it. That fact is kept. What changed is where it sits.
 *
 * Founder ruling 2026-07-30, reading `google/gemini-3-flash-preview · under a
 * cent` under an answer: *"it looks like a message itself... probably we can
 * give it like a Lovable model, three dots, and if I click three dots there are
 * a couple of action items there. In that, one of the action items is view
 * credits, and if I click it shows how many credits."*
 *
 * Two separate defects, both real:
 *   1. A metered fact set in the reading column is read as part of the answer.
 *      It is not; it is provenance. Behind a control it is one press away for
 *      anyone who wants it and silent for everyone who does not.
 *   2. The model was a ROUTING SLUG. `google/gemini-3-flash-preview` is
 *      addressed to a gateway, not to a person. `modelLabel` turns it into
 *      "Google Gemini 3 Flash" without a lookup table, so it can be reformatted
 *      but never fabricated.
 *
 * Still never in the header: a running total in the chrome would make the panel
 * about money. This keeps it about what THIS answer cost, when asked.
 */
function Provenance({ msg }: { msg: AskStreamMsg }) {
  const [shown, setShown] = React.useState(false);
  const meta = msg.meta;
  const model = modelLabel(meta?.model);
  const money = spendLabel(meta?.cost_usd);
  const read = meta?.workspace_chunks ?? 0;
  // Nothing metered, nothing to offer. An empty menu is worse than no menu.
  if (!meta || (!model && !money && read === 0)) return null;

  return (
    <div className="sp-turn-foot">
      <MoreMenu label="About this answer">
        <MoreItem onClick={() => setShown((v) => !v)}>
          {shown ? "Hide credits" : "View credits"}
        </MoreItem>
      </MoreMenu>
      {shown ? (
        <div className="sp-turn-cost">
          {model ? <Num>{model}</Num> : null}
          {model && money ? " · " : null}
          {/* An unknown cost is ABSENT, never rendered as $0.00: on a surface
              whose argument is that every call is on the record, printing a
              zero we did not measure is the one unaffordable rounding. */}
          {money ? <Num>{money}</Num> : null}
          {read > 0 ? (
            <>
              {" · read "}
              <Num>{read}</Num>
              {read === 1 ? " record" : " records"}
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function AskTurn({
  turn,
  streaming,
  liveStatus,
  queue,
  initials,
  onRetry,
  landings,
  blocked,
  proposal,
  planDecision,
  onDecidePlan,
}: {
  turn: Turn;
  /** True only for the message genuinely in flight. */
  streaming: boolean;
  /** The last real progress event off the stream, or null on the plain chat
   *  path where the server emits none. Passed straight through: inventing one
   *  here is the failure mode `Working` exists to prevent. */
  liveStatus: ResearchStatus | null;
  queue: ApprovalQueueItem[];
  initials: string;
  onRetry: (msgId: string, content: string) => void;
  /**
   * What this turn PUT SOMEWHERE, one entry per `landing` frame.
   *
   * A prop rather than a field on the message, because `AskStreamMsg` does not
   * carry landings yet and inventing the field here would fork the thread type.
   * An array rather than one, because a single run can hand back more than one
   * thing (a decision and the spec that followed it), and dropping the second
   * would lose exactly the artifact whose home is least obvious.
   *
   * Undefined or empty renders NOTHING. That is what keeps this inert while no
   * server emits the frame: the register does not appear, so no turn today
   * gains an empty heading promising a result that never arrives.
   */
  landings?: LandedArtifact[];
  /**
   * WHY NO RUN OPENED, when this turn asked for one and none did.
   *
   * IT REPLACES THE ANSWER REGISTER RATHER THAN JOINING IT, and that is the
   * whole point of the prop. `api/chat.ts` still streams the sentence on the
   * delta channel, because the transcript has to hold a record of the refusal
   * and a reader without this frame has to get something. So the words arrive
   * twice: once as `answer.content` and once, derived from this id, inside
   * `AskBlocked`. Rendering both would print the same sentence twice under a
   * heading that says "Answer", which is the exact confusion the frame exists
   * to end. Rendering neither would lose it. So the state wins and the prose
   * stands down.
   *
   * Null on every ordinary turn, which is nearly all of them.
   */
  blocked?: DispatchBlock | null;
  /**
   * THE PLAN THIS TURN PUBLISHED, when it published one instead of starting work.
   *
   * A THIRD KIND OF TURN, and it is worth naming against the other two. An
   * ordinary turn ANSWERS. A dispatching turn STARTS something and hands the
   * reader a run to watch. This one PROPOSES and stops, and the difference the
   * person sees is that nothing is moving and the next move is theirs.
   *
   * Keyed by message rather than handed to the last turn like `landings` and
   * `blocked`, because those describe a request in flight and this is an OPEN
   * QUESTION. A later turn must not take it off the screen while it is still
   * unanswered; see the map it comes out of in `use-ask-stream`.
   */
  proposal?: PlanProposal | null;
  /** What became of it, or undefined while it is still open. */
  planDecision?: PlanDecisionState;
  onDecidePlan?: (decision: PlanGateDecision) => void;
}) {
  const question = turn.question?.content ?? "";
  const answer = turn.answer;

  const citation = answer && !answer.error ? recordCitationFor(answer) : null;

  /*
   * The honest absence, and it is a DIFFERENT fact from a failed read. We can
   * only say it once the answer has landed and its meta tells us retrieval read
   * nothing. Before that we say nothing at all, because we do not know yet.
   *
   * `!blocked` IS NOT BELT AND BRACES, it is a defect caught on the way in. A
   * refused dispatch returns `baseMeta()`, whose `workspace_chunks` is 0
   * because no retrieval ran, so every clause of this was satisfied and the
   * turn printed "The record has nothing on this yet. That answer stands on the
   * model alone." underneath a state that just said nothing started. There is
   * no answer for the record to be missing from. Same shape as the bug this
   * whole change is about: a true-sounding sentence attached to the wrong turn.
   */
  const recordWasEmpty =
    !!answer &&
    !answer.error &&
    !blocked &&
    /*
     * `!proposal` IS THE SAME DEFECT AS `!blocked`, CAUGHT ON THE WAY IN.
     *
     * A gated turn returns a hand-written meta with `workspace_chunks: 0`,
     * because no retrieval ran — there was no question to answer. Every clause
     * below is then satisfied and the turn prints "The record has nothing on
     * this yet. That answer stands on the model alone." underneath a plan. There
     * is no answer for the record to be missing from, and saying so beside a
     * gate reads as a reason to distrust the plan.
     */
    !proposal &&
    !streaming &&
    !!answer.meta &&
    answer.meta.workspace_chunks === 0;

  const gates = answer && !answer.error ? gatesForAnswer(queue, answer, question) : [];
  const policy = policyProposal(gates);

  return (
    <article style={{ marginBottom: "var(--mrd-s6)" }}>
      {turn.question ? (
        <Register name="You">
          <Said>{turn.question.content}</Said>
        </Register>
      ) : null}

      {/*
          NOTHING STARTED, said where the answer would have been. Above the
          error branch is wrong (a stream that failed has no verdict about a
          dispatch) and below the ordinary branch is wrong (it would draw the
          refusal as prose first and then again as a state), so it sits between
          them as a third branch of the same conditional.
       */}
      {answer ? (
        answer.error ? (
          <Register name="Answer">
            <Failed
              onRetry={
                answer.retryContent
                  ? () => onRetry(answer.id, answer.retryContent as string)
                  : undefined
              }
              retryLabel="Ask again"
            >
              {answer.content}
            </Failed>
          </Register>
        ) : blocked ? (
          <Register name="Why it did not start">
            <AskBlocked reason={blocked} />
          </Register>
        ) : (
          <Register name="Answer">
            {/* THE ONE PLACE THE CREW'S WORDS BECOME PIXELS, streaming and
                settled alike. There is deliberately no second branch for the
                in-flight case: the stream patches `content` on this same
                message, so the half-written answer and the finished one are
                the same JSX and cannot render differently. A separate
                "streaming text" path is exactly how a surface ends up showing
                raw hashes for the eight seconds a person is actually watching
                it, and then tidying itself up once they have stopped. */}
            {answer.content ? <Answer>{answer.content}</Answer> : null}
            {/* WHAT IS HAPPENING, while it happens. It sits UNDER the words so
                a growing answer does not shove the line it is reading, and it
                is gone the instant the stream ends. */}
            {streaming ? <Working status={liveStatus} hasContent={!!answer.content} /> : null}
            {!streaming ? <Provenance msg={answer} /> : null}
          </Register>
        )
      ) : null}

      {/*
          THE ONE DECISION, BEFORE ANYTHING RUNS.

          It sits directly under the words that published it and above
          everything else on the turn, because it is the only thing on the
          screen that is waiting on a person. A landing register or a run card
          below a gate would be describing work that has not started.

          THE DECIDED STATES ARE NOT THE GATE GREYED OUT. Once a plan has been
          answered the question is gone, so what stands in its place is one line
          saying what happened — and on the answer that started a run, nothing at
          all, because the run card below is now the truthful thing to look at
          and a second line saying "started" would be narrating it.
       */}
      {proposal && planDecision?.status === "sent-back" ? (
        <Register name="Sent back">
          <p className="max-w-[62ch] text-mrd-small leading-mrd-prose text-mrd-mute">
            Nothing started and nothing was charged. The crew has your note and comes back with a
            new plan.
          </p>
        </Register>
      ) : null}

      {proposal && planDecision?.status !== "sent-back" && planDecision?.status !== "started" ? (
        <Register name="Before it starts">
          {/*
              A FAILED ANSWER LEAVES THE GATE OPEN, and this is the reason the
              failure is a line ABOVE the card rather than a state that replaces
              it. A POST that did not land started nothing and sent nothing back,
              so the plan is exactly where it was and the only useful thing to
              put in front of a person is the same three answers again. Replacing
              the gate with an apology would strand the work behind a decision
              they had already taken.
           */}
          {planDecision?.status === "failed" ? (
            <p className="mb-2 max-w-[62ch] text-mrd-small leading-mrd-prose text-mrd-mute">
              {planDecision.message} Nothing started, so the plan still stands as it was.
            </p>
          ) : null}
          <AskPlanGate
            proposal={proposal}
            busy={planDecision?.status === "deciding"}
            onDecide={(d) => onDecidePlan?.(d)}
          />
        </Register>
      ) : null}

      {citation ? (
        <Register name="From the record">
          <Record evidence={citation.evidence}>
            {citation.href ? (
              <a href={citation.href} style={{ color: "inherit" }}>
                {citation.text}
              </a>
            ) : (
              citation.text
            )}
          </Record>
        </Register>
      ) : recordWasEmpty ? (
        <div
          style={{
            marginBottom: "var(--sp-space-5)",
            fontSize: "var(--mrd-t-base)",
            color: "var(--mrd-mute)",
          }}
        >
          The record has nothing on this yet. That answer stands on the model alone.
        </div>
      ) : null}

      {/* WHERE IT WENT, above the live run and below the words that produced
          it. A landing is a SETTLED fact - the thing is already on that station
          when the frame arrives - so it reads with the answer rather than with
          the work still moving underneath it. Rendered even mid-stream: a
          result that has landed has landed, and holding the news until the
          stream closes would be withholding something already true. */}
      {landings && landings.length > 0 ? (
        <Register name={landings.length === 1 ? "Where it landed" : "Where these landed"}>
          {landings.map((l) => (
            <AskLanding key={`${l.kind}:${l.id}`} kind={l.kind} id={l.id} station={l.station} />
          ))}
        </Register>
      ) : null}

      {/* Ask started a run, or the answer is about one. Either way the run is
          steerable and its gates are settleable from here. */}
      {answer?.mission_id ? (
        <Register name="What the crew is doing">
          <AskRunCard missionId={answer.mission_id} initials={initials} />
        </Register>
      ) : null}

      {gates.length > 0 ? (
        <Register name={policy ? "A boundary you could set instead" : "Waiting on you"}>
          {gates.map((g) => (
            <AskGateCard key={g.id} item={g} initials={initials} asPolicy={g.id === policy?.id} />
          ))}
        </Register>
      ) : null}
    </article>
  );
}
