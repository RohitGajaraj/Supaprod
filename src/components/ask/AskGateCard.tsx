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
import { Actions } from "@/components/meridian/surface-parts";
import { APPROVALS_QUEUE_PREFIX, invalidateShellReads } from "@/lib/query-keys";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import {
  decideApprovalItem,
  snoozeApprovalItem,
  type ApprovalQueueItem,
} from "@/lib/approvals-queue.functions";
import { Button, Gate, Receipt } from "@/components/shell/primitives";

type Settled = { verdict: "approve" | "reject" | "snooze"; consequence: string; failed?: boolean };

function clock(): string {
  return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
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
          : `It comes back after ${until.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}.`,
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
        time={clock()}
        failed={settled.failed}
      />
    );
  }

  const question = asPolicy
    ? `${item.title}?`
    : item.title.endsWith("?")
      ? item.title
      : `${item.title}?`;

  const lines: React.ReactNode[] = [];
  // The policy card leads with the streak, because the streak IS the argument:
  // the queue is a policy failure to surface, not a workload to render.
  for (const line of item.evidence.slice(0, asPolicy ? 3 : 2)) lines.push(line);
  if (item.impact) lines.push(item.impact);
  if (item.projectName) lines.push(item.projectName);

  return (
    <Gate question={question} lines={lines}>
      <Actions
        trailing={
          <Button variant="ghost" disabled={!!pending} onClick={() => void defer()}>
            Not now
          </Button>
        }
      >
        <Button variant="primary" disabled={!!pending} onClick={() => void act("approve")}>
          {asPolicy ? "Let it run alone" : "Approve"}
        </Button>
        <Button disabled={!!pending} onClick={() => void act("reject")}>
          {asPolicy ? "Keep asking me" : "Send it back"}
        </Button>
      </Actions>
    </Gate>
  );
}
