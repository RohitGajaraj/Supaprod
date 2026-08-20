// RPT-25: the contradiction auditor, mounted inside a decision's detail. On
// demand it re-reads the workspace's prior decisions and shows how many
// disagree with this call, with a per-item rationale, then lets the operator
// record a real supersession edge (decision -> decision "contradicts") that the
// knowledge graph reasons over.
//
// Ported to the rebuild primitives 2026-07-29, because the founder opened a
// ported page and the legacy design came back the moment a decision was opened.
// What went, and why:
//
//   KILLED the DetailKit DetailSection and the material-medium cards. A card
//     per disagreeing decision, inside a card, inside the detail's own card, is
//     three levels of the cardocalypse (anti-slop ban 5, one bordered container
//     per region). Each one is a Row now, which is the shape a list of things
//     you act on already has.
//   KILLED MonoLabel and the obsidian Button. Mono is for data, never for a
//     status word.
//   KILLED the "Supersession proposed" success TOAST. Recording that one call
//     supersedes another rewrites what the graph reasons over, which is not a
//     four-second fact (agents/FINAL-agent-presence.md R10). It leaves a
//     Receipt naming the decision it superseded.
//   KILLED the audit error toast. A failed read renders Failed with a retry,
//     never silence and never an empty state.
//
// UNCHANGED: auditDecision / proposeSupersession, and the
// ["lineage","decision",id] invalidation that keeps the detail's Evidence
// section true the moment an edge is recorded.
//
// ─────────────────────────────────────────────────────────────────────────────
// THE ZERO PASS, 2026-08-10. THE SECTION DESCRIBED AN AGENT THAT DOES NOT EXIST.
//
//   KILLED "A standing auditor re-reads the workspace's decisions". Nothing is
//     standing. `auditDecision` fires from the `more` control on this Block and
//     from nowhere else in the codebase: no cron, no trigger, no loop step. A
//     reader who takes that sentence at face value believes a background process
//     is watching their record, which is the single most expensive false belief
//     this product can create, because they will stop checking. The idle state
//     now says who runs it, when, and that the answer is theirs to ask for.
//   ADDED the `scanned === 0` branch. With no earlier calls on the record, the
//     zero-count path printed "Nothing disagrees. Read 0 prior decisions, all
//     consistent with this call." That is a clean bill of health manufactured
//     out of nothing read, on the account of every user who has settled exactly
//     one call -- which is every new user, at the first moment they would ever
//     open this. Zero reads is not a finding and it does not get a finding's
//     sentence.
//   ADDED provenance to each disagreement. A contradiction is INFERRED: a model
//     read two calls and formed a view about them. The decisions on either side
//     of it are the workspace's own. Marking which is which is the difference
//     between a warning a person can weigh and one they must simply trust.
import { useState } from "react";
import { Row } from "@/components/meridian/rows";
import {
  Num,
  Action,
  Region,
  ReadFailedLine,
  NothingYet,
} from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { auditDecision, proposeSupersession } from "@/lib/contradiction-auditor.functions";
import { Loading, Receipt } from "@/components/shell/primitives";
import { Provenance } from "./EvidenceQuality";

export function ContradictionAuditSection({
  decisionId,
  decisionTitle,
}: {
  decisionId: string;
  /**
   * The call being audited, so the working indicator can name it.
   *
   * Added because the indicator had nothing honest to say otherwise: this
   * component was handed an id and nothing else, and an id rendered where a noun
   * belongs is an opaque string dressed as information. Optional, so any other
   * mount keeps working and simply carries no detail.
   */
  decisionTitle?: string;
}) {
  const qc = useQueryClient();
  const fAudit = useServerFn(auditDecision);
  const fPropose = useServerFn(proposeSupersession);
  const [proposed, setProposed] = useState<Set<string>>(new Set());
  const [settled, setSettled] = useState<
    { id: string; verb: string; consequence: string; failed?: boolean }[]
  >([]);

  const commit = (verb: string, consequence: string, failed = false) =>
    setSettled((prev) => [
      { id: `${Date.now()}-${prev.length}`, verb, consequence, failed },
      ...prev,
    ]);

  const audit = useMutation({
    mutationFn: () => fAudit({ data: { id: decisionId } }),
  });

  const propose = useMutation({
    mutationFn: (vars: { supersededId: string; title: string }) =>
      fPropose({ data: { supersedingId: decisionId, supersededId: vars.supersededId } }),
    onSuccess: (_res, vars) => {
      setProposed((prev) => new Set(prev).add(vars.supersededId));
      // The graph reads this decision's lineage under this key (DecisionDetail).
      qc.invalidateQueries({ queryKey: ["lineage", "decision", decisionId] });
      commit(
        "You superseded an earlier call",
        `"${vars.title}" no longer stands. The graph reads this call in its place.`,
      );
    },
    onError: (e: Error, vars) =>
      commit(
        "You tried to supersede an earlier call",
        `"${vars.title}" still stands. ${e.message || "The write failed."}`,
        true,
      ),
  });

  const report = audit.data;

  return (
    <Region
      title="Contradiction audit"
      act={report ? "Read them again" : "Read the prior decisions"}
      onAct={() => audit.mutate()}
      acting={audit.isPending}
    >
      {audit.isPending ? (
        // AN AGENT IS GENUINELY RUNNING, so this is the working indicator rather
        // than the quiet read: auditDecision -> auditDecisionContradictions ->
        // callModel (contradiction-auditor.server.ts). `working` is the honest
        // flag and the sentence stays exactly as it was, because it already says
        // the work.
        // THE DETAIL IS THE CALL BEING AUDITED, which needed a prop from the
        // parent: an id in a noun's place would be an opaque string dressed as
        // information. The auditor's own count (how many it scanned) is not known
        // until the call returns, so it cannot serve here.
        <Loading working agent="contradiction-auditor" detail={decisionTitle}>
          Re-reading the workspace&apos;s decisions.
        </Loading>
      ) : audit.isError ? (
        <ReadFailedLine onRetry={() => audit.mutate()}>
          The audit did not run, so this is not a claim that nothing disagrees.{" "}
          {(audit.error as Error)?.message ?? ""}
        </ReadFailedLine>
      ) : !report ? (
        /* NOTHING IS STANDING, AND THE OLD COPY SAID IT WAS.
           "A standing auditor re-reads the workspace's decisions" describes a
           background process this product does not run. The only caller of
           `auditDecision` in the codebase is the control on this Block's own
           head, twenty lines up. A reader who believes an auditor is watching
           stops watching themselves, which makes it the most expensive sentence
           on the surface.
           So: who runs it, when it runs, and what it costs, in the reader's
           terms. It names the control by the words printed on it rather than
           describing a feature, because that is how somebody finds it. */
        <NothingYet
          action={<Action onClick={() => audit.mutate()}>Read the prior decisions</Action>}
        >
          Nothing has been checked yet. Press <b>Read the prior decisions</b> and an agent reads
          every earlier call in this workspace against this one, then names any that disagree and
          why. It runs when you ask it to, and not before.
        </NothingYet>
      ) : report.scanned === 0 ? (
        /* ZERO READS IS NOT A CLEAN BILL OF HEALTH.
           This branch used to fall through to the one below and print "Nothing
           disagrees. Read 0 prior decisions, all consistent with this call." --
           a finding manufactured out of nothing read, in the confident voice.
           On every account with one settled call, which is every account at the
           first moment anybody would open this, that was the ONLY thing it
           could say. An audit over an empty set has no verdict in it. */
        <NothingYet>
          There is no earlier call to read this one against. This is the first on the record, so
          nothing can disagree with it yet. Settle another and this becomes worth running.
        </NothingYet>
      ) : report.count === 0 ? (
        <p className="sp-loading">
          Nothing disagrees. Read <Num>{report.scanned}</Num> prior{" "}
          {report.scanned === 1 ? "decision" : "decisions"}, all consistent with this call.
        </p>
      ) : (
        <>
          <p className="sp-loading">
            <Num>{report.count}</Num> of <Num>{report.scanned}</Num> disagree with what you just
            decided.
          </p>
          {report.items.map((item) => {
            const done = proposed.has(item.decisionId);
            const pending =
              propose.isPending && propose.variables?.supersededId === item.decisionId;
            return (
              <Row
                key={item.decisionId}
                lead={item.title}
                // The different fact, never a restatement: WHY it disagrees.
                //
                // AND WHOSE VIEW THAT IS. The call in the lead is the
                // workspace's own; the reason underneath it is a model's
                // reading of two calls side by side, and nothing has confirmed
                // it. Those are not the same grade of evidence and the reader
                // is about to act on the weaker one -- "Supersede it" rewrites
                // what the graph reasons over. The mark says which is which
                // without adding a sentence to a row that already has two.
                sub={
                  <>
                    <Provenance source="inferred" />
                    {item.rationale}
                  </>
                }
                action={
                  done ? (
                    <span className="sp-value" data-tone="pass">
                      Superseded
                    </span>
                  ) : (
                    <Action
                      busy={pending}
                      onClick={() =>
                        propose.mutate({ supersededId: item.decisionId, title: item.title })
                      }
                      title="Record that this decision supersedes the earlier one"
                    >
                      {pending ? "Recording" : "Supersede it"}
                    </Action>
                  )
                }
              />
            );
          })}
        </>
      )}

      {settled.map((s) => (
        <Receipt key={s.id} verb={s.verb} consequence={s.consequence} failed={s.failed} />
      ))}
    </Region>
  );
}
