/**
 * The HUMAN half of the compounding pass (SW-3 / mission 3.8b). The outcome
 * tick sweep (learning-compound.server.ts) writes a playbook_proposals row when
 * three or more same-shaped learnings repeat. Until a human adopts or dismisses
 * it, that is invisible work, so this panel renders the open proposals directly
 * above the outcome feed they compound from and wires decidePlaybookProposal.
 *
 * The panel disappears entirely when nothing is proposed (Brain never
 * re-clutters with an empty section), but a LOAD FAILURE renders as a failure,
 * never as "no proposals".
 *
 * Ported to the shell primitives, 2026-07-29. What went, and why:
 *   KILLED the ember-tinted, ember-bordered proposal card. Ember marks the ONE
 *     thing asking, and this panel can hold six proposals at once; six ember
 *     cards in a column is exactly how the colour stops meaning "look here".
 *     ONE proposal is a Gate, which is where ember belongs; several are rows.
 *   KILLED MonoLabel and the mono trace ref, mono timestamp, mono source count
 *     and mono section heading. Mono is for data; a heading is not.
 *   KILLED the hand-built section heading with its own hairline RULE stretching
 *     to the right edge. Block already draws the rule.
 *   KILLED the hand-built "failed to load" card and its bespoke retry button.
 *   KILLED both success TOASTS. Adopting a playbook puts a standing rule into
 *     every agent's prompt, and dismissing one is permanent because the sweep
 *     never re-proposes a dismissed group key. Neither is a four-second fact
 *     (agents/FINAL-agent-presence.md R10), so each leaves a Receipt.
 *
 * KEPT AS A MODAL, deliberately: the confirm before a permanent dismiss. It is
 * one irreversible question with a yes and a no, which is precisely the case
 * anti-slop ban 11 leaves open.
 *
 * UNCHANGED: listPlaybookProposals / decidePlaybookProposal, the
 * ["playbook-proposals"] and ["needs-you"] invalidations that keep this panel
 * and the Today queue in sync, the verbatim proposal body with the sweep's own
 * line breaks, and VISIBLE_PROPOSALS.
 *
 * STILL LEGACY, and named rather than hidden: ConfidenceChip lives in
 * components/supaprod, which this lane does not own. Its fact is stated in
 * words on the evidence line instead, so the chip is no longer mounted.
 */
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listPlaybookProposals,
  decidePlaybookProposal,
  type PlaybookProposal,
} from "@/lib/playbooks.functions";
import { useConfirm } from "@/hooks/use-confirm";
import {
  Actions,
  Block,
  Button,
  Failed,
  Gate,
  Loading,
  Num,
  Prose,
  Receipt,
  Row,
} from "@/components/shell/primitives";

/** Same "when" rhythm as the outcome feed below this panel. */
function whenOf(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** The evidence line: how many outcomes said the same thing, how sure the
 *  sweep is, and when it noticed. Three different facts, never a restatement
 *  of the proposal's own title. */
function evidenceOf(p: PlaybookProposal): string {
  const n = p.source_learning_ids.length;
  return `${n} outcome${n === 1 ? "" : "s"} said the same thing · ${p.confidence} confidence · noticed ${whenOf(p.created_at)}`;
}

// Anti-scroll (founder ruling 2026-07-06 / PC-32): the panel shows the top few
// open proposals and expands on demand, so Brain never becomes a long wall.
const VISIBLE_PROPOSALS = 6;

export function PlaybookProposalsPanel() {
  const fList = useServerFn(listPlaybookProposals);
  const fDecide = useServerFn(decidePlaybookProposal);
  const qc = useQueryClient();
  const confirmDialog = useConfirm();
  const [showAll, setShowAll] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [settled, setSettled] = useState<
    { id: string; verb: string; consequence: string; failed?: boolean }[]
  >([]);

  const commit = (verb: string, consequence: string, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed },
      ...prev,
    ]);

  const q = useQuery({ queryKey: ["playbook-proposals"], queryFn: () => fList() });

  const decide = useMutation({
    mutationFn: (v: { proposalId: string; decision: "confirm" | "dismiss"; title: string }) =>
      fDecide({ data: { proposalId: v.proposalId, decision: v.decision } }),
    onSuccess: (_r, v) => {
      commit(
        v.decision === "confirm" ? "You adopted a playbook" : "You dismissed a proposal",
        v.decision === "confirm"
          ? `"${v.title}" goes into every agent's prompt before it acts, and it keeps the outcomes it came from.`
          : `"${v.title}" will not be proposed again. The outcomes behind it stay on the record.`,
      );
      // The proposal is also a Call in the Today queue: keep both in sync.
      for (const key of ["playbook-proposals", "needs-you"])
        qc.invalidateQueries({ queryKey: [key] });
    },
    onError: (e: Error, v) =>
      commit(
        v.decision === "confirm"
          ? "You tried to adopt a playbook"
          : "You tried to dismiss a proposal",
        `"${v.title}" is unchanged. ${e.message || "The write failed."}`,
        true,
      ),
  });

  // Dismiss is permanent (the sweep never re-proposes a dismissed group key),
  // so it is confirm-gated per the destructive-actions convention.
  const requestDecide = (p: PlaybookProposal, decision: "confirm" | "dismiss") => {
    if (decision === "dismiss") {
      void confirmDialog({
        title: "Dismiss this proposed playbook?",
        body: "This dismisses it for good. The same lesson will not be proposed again.",
        confirmLabel: "Dismiss for good",
        destructive: true,
      }).then((ok) => {
        if (ok) decide.mutate({ proposalId: p.id, decision, title: p.title });
      });
      return;
    }
    decide.mutate({ proposalId: p.id, decision, title: p.title });
  };

  const receipts = settled.map((s) => (
    <Receipt key={s.id} verb={s.verb} consequence={s.consequence} failed={s.failed} />
  ));

  if (q.isError) {
    // A load failure must read as a failure, not as "nothing proposed".
    return (
      <Failed onRetry={() => void q.refetch()}>
        The proposals did not load, so this is not a claim that the record has nothing to teach the
        crew. {(q.error as Error)?.message ?? ""}
      </Failed>
    );
  }
  if (q.isLoading) return <Loading>Reading what the record wants to make standing.</Loading>;

  const open = (q.data?.proposals ?? []).filter((p) => p.status === "proposed");

  // Nothing proposed is not an empty state worth drawing: Brain never
  // re-clutters with a section holding nothing. The receipts stay, because you
  // may have just decided the last one.
  if (open.length === 0) return receipts.length ? <>{receipts}</> : null;

  const shown = showAll ? open : open.slice(0, VISIBLE_PROPOSALS);
  const busy = decide.isPending;
  const expandedProposal = expanded ? (open.find((x) => x.id === expanded) ?? null) : null;

  // ONE proposal is the gate: it is the single thing asking, so it gets the
  // biggest element on the surface and the one blink in the system.
  if (open.length === 1) {
    const p = open[0];
    return (
      <>
        <Gate question={p.title} lines={[evidenceOf(p), p.body]}>
          <Button variant="primary" disabled={busy} onClick={() => requestDecide(p, "confirm")}>
            {busy ? "Adopting" : "Make it standing"}
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => requestDecide(p, "dismiss")}>
            Not a rule
          </Button>
        </Gate>
        {receipts}
      </>
    );
  }

  return (
    <Block
      title="The record wants to make these standing"
      // Different information from the title, not a restatement: WHY there is
      // a proposal at all, and what adopting one actually does.
      sub="Each repeated across three or more outcomes. Adopting one puts it into every agent's prompt before it acts."
    >
      {shown.map((p) => (
        <Row
          key={p.id}
          lead={p.title}
          sub={evidenceOf(p)}
          focused={expanded === p.id}
          onClick={() => setExpanded(expanded === p.id ? null : p.id)}
          action={
            <Button variant="ghost" disabled={busy} onClick={() => requestDecide(p, "confirm")}>
              Make it standing
            </Button>
          }
        />
      ))}

      {/* The proposal's own words, quoted verbatim from the sweep, under the
          list rather than inside a row: a row in a list never wraps. */}
      {expandedProposal ? (
        <>
          <Prose>
            <p style={{ whiteSpace: "pre-wrap" }}>{expandedProposal.body}</p>
          </Prose>
          <Actions
            trailing={
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => requestDecide(expandedProposal, "dismiss")}
              >
                Not a rule
              </Button>
            }
          >
            <Button
              variant="primary"
              disabled={busy}
              onClick={() => requestDecide(expandedProposal, "confirm")}
            >
              {busy ? "Adopting" : "Make it standing"}
            </Button>
          </Actions>
        </>
      ) : null}

      {open.length > VISIBLE_PROPOSALS ? (
        <Actions>
          <Button variant="ghost" onClick={() => setShowAll((v) => !v)}>
            {showAll ? (
              "Show fewer"
            ) : (
              <>
                Show <Num>{open.length - VISIBLE_PROPOSALS}</Num> more
              </>
            )}
          </Button>
        </Actions>
      ) : null}

      {receipts}
    </Block>
  );
}
