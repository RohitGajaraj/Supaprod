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
 */

import * as React from "react";
import type { AskStreamMsg } from "@/lib/ask-stream-core";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";
import { recordCitationFor } from "@/lib/ask-record";
import { gatesForAnswer, policyProposal } from "@/lib/ask-actions";
import { Failed, Loading, Num, Record } from "@/components/shell/primitives";
import { AskGateCard } from "./AskGateCard";
import { AskRunCard } from "./AskRunCard";

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
          fontSize: "var(--sp-text-label)",
          color: "var(--sp-mute)",
          fontWeight: 500,
          marginBottom: "var(--sp-space-1)",
        }}
      >
        {name}
      </div>
      {children}
    </div>
  );
}

function Said({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: "var(--sp-text-prose)",
        color: "var(--sp-ink)",
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

/** What the exchange cost, on the record.
 *
 *  "One agentic operating system, every call on the record" is the product's
 *  own line, and every Ask exchange spends real money through a chokepoint that
 *  already meters it. It is one quiet line in the thread, never a warning, and
 *  never in the header: a running total in the chrome would make the panel
 *  about money, and this makes the ANSWER about what it cost. */
function Cost({ msg }: { msg: AskStreamMsg }) {
  const meta = msg.meta;
  if (!meta) return null;
  const cents = meta.cost_usd;
  const money =
    typeof cents === "number" && cents > 0
      ? cents < 0.01
        ? "under a cent"
        : `$${cents.toFixed(2)}`
      : null;
  if (!money && !meta.model) return null;
  return (
    <div
      style={{
        marginTop: "var(--sp-space-2)",
        fontSize: "var(--sp-text-data)",
        color: "var(--sp-mute)",
      }}
    >
      {meta.model ? <Num>{meta.model}</Num> : null}
      {meta.model && money ? " · " : null}
      {money ? <Num>{money}</Num> : null}
      {meta.workspace_chunks > 0 ? (
        <>
          {" · read "}
          <Num>{meta.workspace_chunks}</Num>
          {meta.workspace_chunks === 1 ? " record" : " records"}
        </>
      ) : null}
    </div>
  );
}

export function AskTurn({
  turn,
  streaming,
  queue,
  initials,
  onRetry,
}: {
  turn: Turn;
  /** True only for the message genuinely in flight. */
  streaming: boolean;
  queue: ApprovalQueueItem[];
  initials: string;
  onRetry: (msgId: string, content: string) => void;
}) {
  const question = turn.question?.content ?? "";
  const answer = turn.answer;

  const citation = answer && !answer.error ? recordCitationFor(answer) : null;

  // The honest absence, and it is a DIFFERENT fact from a failed read. We can
  // only say it once the answer has landed and its meta tells us retrieval read
  // nothing. Before that we say nothing at all, because we do not know yet.
  const recordWasEmpty =
    !!answer && !answer.error && !streaming && !!answer.meta && answer.meta.workspace_chunks === 0;

  const gates = answer && !answer.error ? gatesForAnswer(queue, answer, question) : [];
  const policy = policyProposal(gates);

  return (
    <article style={{ marginBottom: "var(--sp-space-6)" }}>
      {turn.question ? (
        <Register name="You">
          <Said>{turn.question.content}</Said>
        </Register>
      ) : null}

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
        ) : (
          <Register name="Answer">
            {answer.content ? <Said>{answer.content}</Said> : null}
            {streaming && !answer.content ? <Loading>Reading the record.</Loading> : null}
            {!streaming ? <Cost msg={answer} /> : null}
          </Register>
        )
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
            fontSize: "var(--sp-text-meta)",
            color: "var(--sp-mute)",
          }}
        >
          The record has nothing on this yet. That answer stands on the model alone.
        </div>
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
