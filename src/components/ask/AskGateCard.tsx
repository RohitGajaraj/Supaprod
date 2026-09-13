/**
 * A call you can settle without leaving Ask.
 *
 * Founder ruling 2026-07-30: *"if there is any approval queue waiting or any
 * sort of action that is dependent, it needs to render a card inside itself
 * where the action needs to be taken there itself."* So this is not a link to
 * the approvals surface. It is the decision, in the thread, wired to the real
 * resolver.
 *
 * ONE CARD, TEN FAMILIES. `getApprovalsQueue` federates tool-call gates,
 * decisions, memory candidates, house rules, trust graduations, specs,
 * opportunities, assumption challenges, design gates and playbook proposals
 * into one typed item, and `decideApprovalItem` routes a verdict back to that
 * family's own existing resolver. Writing ten cards would have meant writing
 * ten write paths, which is how a button that calls nothing gets built.
 *
 * THE SHAPE IS `Gate`, NOT A NEW CARD. Gate is the system's shape for a call in
 * front of you: a question in plain words, the evidence in a recess, and the
 * actions. Drawing a bordered card inside a floating pane would be a container
 * inside a container, which the standard caps at one per region.
 */

import * as React from "react";
import { APPROVALS_QUEUE_PREFIX, invalidateShellReads } from "@/lib/query-keys";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  decideApprovalItem,
  snoozeApprovalItem,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";
import { Receipt } from "@/components/meridian/Receipt";
import { Ask } from "@/components/meridian/Ask";
import { questionForGate } from "./a-question-is-composed-not-punctuated";
import { useTimezone } from "@/hooks/use-timezone";
import { clockInZone } from "@/lib/time-of-day";

type Settled = { verdict: "approve" | "reject" | "snooze"; consequence: string; failed?: boolean };

function clock(zone: string): string {
  return clockInZone(new Date().toISOString(), zone);
}

export function AskGateCard({
  item,
  initials,
  /** The governance framing. Set for a graduation proposal, where the honest
   *  question is not "approve this one" but "should this stop asking you". */
  asPolicy = false,
  onSettled,
}: {
  item: ApprovalQueueItem;
  initials: string;
  asPolicy?: boolean;
  onSettled?: () => void;
}) {
  const decide = useServerFn(decideApprovalItem);
  const snooze = useServerFn(snoozeApprovalItem);
  const qc = useQueryClient();
  const [pending, setPending] = React.useState<string | null>(null);
  const [settled, setSettled] = React.useState<Settled | null>(null);
  const zone = useTimezone();

  // THE COMMIT (anti-slop.md section 5): a settled action writes a receipt
  // carrying its OWN consequence, never a toast. The queue item already states
  // both consequences in its own words, so the receipt quotes the real one
  // rather than inventing "Saved."
  async function act(verdict: "approve" | "reject") {
    if (pending) return;
    setPending(verdict);
    try {
      await decide({ data: { id: item.sourceId, kind: item.kindKey, verdict } });
      setSettled({
        verdict,
        consequence: verdict === "approve" ? item.approveConsequence : item.rejectConsequence,
      });
      // Both counts of this one truth: the rail badge and any open queue.
      invalidateShellReads(qc);
      void qc.invalidateQueries({ queryKey: APPROVALS_QUEUE_PREFIX });
      onSettled?.();
    } catch (e) {
      // A failed write still writes a receipt and goes honest immediately.
      setSettled({
        verdict,
        consequence: e instanceof Error ? e.message : "The write did not go through.",
        failed: true,
      });
    } finally {
      setPending(null);
    }
  }

  async function defer() {
    if (pending) return;
    setPending("snooze");
    try {
      const r = await snooze({ data: { id: item.sourceId, kind: item.kindKey } });
      const until = new Date(r.snoozedUntil);
      setSettled({
        verdict: "snooze",
        consequence: Number.isNaN(until.getTime())
          ? "It comes back with the next briefing."
          : `It comes back after ${clockInZone(until.toISOString(), zone)}.`,
      });
      invalidateShellReads(qc);
      onSettled?.();
    } catch (e) {
      setSettled({
        verdict: "snooze",
        consequence: e instanceof Error ? e.message : "It was not deferred.",
        failed: true,
      });
    } finally {
      setPending(null);
    }
  }

  if (settled) {
    return (
      <Receipt
        initials={initials}
        verb={
          settled.failed
            ? "Nothing changed"
            : settled.verdict === "approve"
              ? "You approved it"
              : settled.verdict === "reject"
                ? "You sent it back"
                : "You deferred it"
        }
        consequence={settled.consequence}
        time={clock(zone)}
        failed={settled.failed}
      />
    );
  }

  /*
   * ── THE QUESTION IS COMPOSED, NOT PUNCTUATED (A1's live read, 2026-09-03) ─
   *
   * This was `${item.title}?`, and on the served build it produced
   * "...checkout completion rate from 67 ?" and "Ships a merged changeset to
   * production, where customers see it.?". A title is not a question with its
   * mark missing: `prds.title` is a descriptive sentence, and a tool gate's
   * title is the CONSEQUENCE of the call, which is evidence and already the
   * first line of the reason below.
   *
   * The `endsWith("?")` branch was the tell. It existed because titles
   * sometimes already carried a mark, which is a caller checking whether the
   * data happened to be a question rather than asking one.
   */
  const question = questionForGate(item.kindKey, item.title, asPolicy);

  /*
   * `string[]` and not `ReactNode[]`, which it was. Every line pushed below is
   * already a string (`evidence: string[]`, `impact?: string`,
   * `projectName: string | null`), and the wider type let a future JSX line in
   * that would reach `Ask`'s `reason` and render as "[object Object]" with
   * nothing failing. The narrower type makes the compiler refuse it instead.
   */
  const lines: string[] = [];
  // The policy card leads with the streak, because the streak IS the argument:
  // the queue is a policy failure to surface, not a workload to render.
  for (const line of item.evidence.slice(0, asPolicy ? 3 : 2)) lines.push(line);
  if (item.impact) lines.push(item.impact);
  if (item.projectName) lines.push(item.projectName);

  /*
   * ── ONE CARD VOCABULARY, AND THIS WAS THE FOURTH DIALECT (P-50) ──────────
   *
   * A1 found this on the served build: the panel drew its own card, with a
   * "Waiting on you" chip the run's gate card had just lost and three answers
   * where the doc has two registers. Nothing on it was untrue. It is shape 1 in
   * a second place: a surface composing its own card because there was no
   * shared one to reach for. There is now.
   *
   * THE THIRD ANSWER, AND WHY IT MOVES RATHER THAN GOES. This card has three
   * genuine verdicts and none is a duplicate: approve, reject, snooze. But two
   * of them ANSWER the question and one declines to. "Not now" writes a snooze,
   * and a snooze is the declared default arriving early, so it belongs to the
   * default line and renders as that line's own quiet action. As a third button
   * it put a non-answer in the row where the answers are, which is why reading
   * this card meant deciding between three things when only two were decisions.
   *
   * THE POLICY MODE IS THE SAME SHAPE WITH DIFFERENT WORDS (A1's ruling): the
   * question says what it asks and the default line says what silence does, so
   * the two registers keep their meaning when the verbs change.
   */
  return (
    <Ask
      question={question}
      reason={lines.length > 0 ? lines.join(" ") : null}
      fallback={{
        kind: "reversible",
        /* No timestamp on a queue item, so the clock is absent rather than
           invented; `Ask` omits that clause. */
        whatHappens: asPolicy
          ? "It keeps asking until you say otherwise."
          : "Nothing dispatches until you answer.",
      }}
      answer={{
        label: asPolicy ? "Let it run alone" : "Approve",
        onPress: () => void act("approve"),
        busy: pending === "approve",
      }}
      decline={{
        label: asPolicy ? "Keep asking me" : "Send it back",
        onPress: () => void act("reject"),
      }}
      fallbackAction={{
        label: "Not now",
        onPress: () => void defer(),
        busy: pending === "snooze",
      }}
    />
  );
}
