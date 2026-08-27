/**
 * THE CRITIC'S VERDICT, and what it can open.
 *
 * PORTED 2026-07-29. This is one of the two components the founder's complaint
 * names directly: the spec surface that mounts it is already ported, so the
 * chip sat in the new theme and clicking it slid a retired-theme sheet over the
 * page. A verdict is a read, not a confirmation, so it was never a modal's job.
 *
 * IT IS NOT A SHEET ANY MORE. The review opens IN PLACE, under the chip that
 * asked for it. There is no pane, slide-over or drawer primitive and that
 * absence is deliberate (see the header of `shell/primitives.tsx`). The chip
 * keeps its exported props unchanged because `_authenticated.plan.spec.$id.tsx`
 * mounts it and belongs to another lane tonight.
 *
 * WHAT ELSE CHANGED:
 *   · `VerdictChip` in moss / ember / madder became `Value`, so the stylesheet
 *     owns the mix. Ember is gone from here entirely: ember marks the human, and
 *     "revise" is the machine's opinion, not a call waiting on you.
 *   · The four shield icons went. They sat at heading size beside the same word
 *     they were illustrating.
 *   · The "Critic re-ran" success toast went. Re-running the Critic is a
 *     consequential write, and a toast confirms that your click registered
 *     rather than what it caused. What it caused is the verdict itself, which is
 *     on screen and changes in front of you, so the surface says it and the
 *     toast is redundant. A failure still reports, as `ReadFailedLine`.
 */

import * as React from "react";
import { Num, Actions, Action, ReadFailedLine, Value } from "@/components/meridian/surface-parts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { runCriticReview, type CriticReview } from "@/lib/discovery.functions";
import { tierFromProbability } from "@/lib/confidence";
import { CtxBody, CtxHead, CtxRow } from "@/components/meridian/ContextColumn";
import { ConfidenceDisclosureChip } from "@/components/governance/ConfidenceDisclosureChip";

type Props = {
  review: CriticReview | null | undefined;
  target: { kind: "opportunity" | "prd"; id: string };
  /** Invalidate this query key after a manual re-run. */
  invalidateKey: readonly unknown[];
  size?: "sm" | "md";
};

/** The verdict as a word and a tone. Ship is a pass, kill is a fail, and revise
 *  is `hold`: the work is stopped on a condition -- a revision -- rather than on
 *  a person, which is what Meridian's amber says. The retired layer called that
 *  `warn`, and Meridian has five status words and `warn` is not one of them.
 *  No icons: the word is the shorter statement. */
const VERDICT: Record<CriticReview["verdict"], { label: string; tone: "pass" | "hold" | "fail" }> =
  {
    ship: { label: "Ship", tone: "pass" },
    revise: { label: "Revise", tone: "hold" },
    kill: { label: "Kill", tone: "fail" },
  };

/** The three fixed persona-board seats, in the words a person would use. */
const PERSONA_LABELS: Record<string, string> = {
  exec: "Exec sponsor",
  engineering: "Engineering lead",
  customer_of_record: "Customer of record",
};

export function CriticBadge({ review, target, invalidateKey }: Props) {
  const qc = useQueryClient();
  const fRun = useServerFn(runCriticReview);
  const [open, setOpen] = React.useState(false);

  const run = useMutation({
    mutationFn: () => fRun({ data: { target_kind: target.kind, target_id: target.id } }),
    onSuccess: () => {
      // The consequence IS the verdict, and it is on screen. Invalidating makes
      // it change in front of you, which is the receipt.
      void qc.invalidateQueries({ queryKey: invalidateKey });
    },
  });

  if (!review) {
    return (
      <>
        <Action
          busy={run.isPending}
          onClick={() => run.mutate()}
          title="Have the Critic read this and rule on it"
        >
          {run.isPending ? "Reading it" : "Ask the Critic"}
        </Action>
        {run.isError ? (
          <ReadFailedLine error={run.error}>
            The review did not run. Nothing about this work changed.
          </ReadFailedLine>
        ) : null}
      </>
    );
  }

  const v = VERDICT[review.verdict];
  const riskCount = review.risks.length;

  // A spec red-team surfaces spec-specific dimensions, so the sections are
  // relabelled for a spec: the generic "Missing evidence" is wrong for one.
  const isSpec = target.kind === "prd";
  const labels = isSpec
    ? {
        risks: { title: "Spec risks", empty: "No risks flagged." },
        kill: { title: "Will not ship as written", empty: "Nothing blocks shipping as written." },
        gaps: {
          title: "Untestable criteria and open questions",
          empty: "Criteria are testable, and nothing is open.",
        },
      }
    : {
        risks: { title: "Risks", empty: "No risks flagged." },
        kill: { title: "Kill criteria", empty: "No kill criteria proposed." },
        gaps: { title: "Missing evidence", empty: "No evidence gaps called out." },
      };

  return (
    <>
      <button
        type="button"
        className="sp-block-more"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        title={open ? "Close the review" : "Read the whole review"}
      >
        <Value tone={v.tone}>{v.label}</Value>
        {riskCount > 0 ? (
          <>
            {" "}
            <Num>{riskCount}</Num> {riskCount === 1 ? "risk" : "risks"}
          </>
        ) : null}{" "}
        <ConfidenceDisclosureChip
          confidence={review.confidence}
          tier={tierFromProbability(review.confidence)}
        />
      </button>

      {open ? (
        <div style={{ marginTop: "var(--mrd-s5)" }}>
          <CtxBody>{review.summary || "It recorded a verdict and wrote no summary."}</CtxBody>

          <Section title={labels.risks.title} items={review.risks} empty={labels.risks.empty} />
          <Section
            title={labels.kill.title}
            items={review.kill_criteria}
            empty={labels.kill.empty}
          />
          <Section
            title={labels.gaps.title}
            items={review.missing_evidence}
            empty={labels.gaps.empty}
          />

          {review.design ? (
            <>
              <CtxHead>Design consistency</CtxHead>
              {review.design.findings.length === 0 ? (
                <CtxBody>
                  Nothing flagged on hierarchy, accessibility, structure or consistency.
                </CtxBody>
              ) : (
                review.design.findings.map((f, i) => (
                  <CtxRow
                    key={i}
                    name={f.issue}
                    sub={
                      f.standing_decision
                        ? `${f.principle}, against "${f.standing_decision}"`
                        : f.principle
                    }
                  />
                ))
              )}
            </>
          ) : null}

          {review.board && review.board.length > 0 ? (
            <>
              <CtxHead>The review board</CtxHead>
              {review.board.map((p) => {
                const pv = VERDICT[p.verdict];
                return (
                  <CtxRow
                    key={p.persona}
                    name={
                      <>
                        {PERSONA_LABELS[p.persona] ?? p.persona}{" "}
                        <Value tone={pv.tone}>{pv.label}</Value>
                      </>
                    }
                    sub={
                      p.objections.length === 0
                        ? "No objections from this seat."
                        : p.objections.join(" ")
                    }
                  />
                );
              })}
            </>
          ) : null}

          <Actions>
            <Action busy={run.isPending} onClick={() => run.mutate()}>
              {run.isPending ? "Reading it again" : "Have it read this again"}
            </Action>
          </Actions>
          {run.isError ? (
            <ReadFailedLine error={run.error}>
              The review did not run. Nothing about this work changed.
            </ReadFailedLine>
          ) : null}
        </div>
      ) : null}
    </>
  );
}

/** One named section of the review. An empty one still says so: "no risks
 *  flagged" and "the Critic did not look at risk" are different facts, and the
 *  Critic always looks. */
function Section({ title, items, empty }: { title: string; items: string[]; empty: string }) {
  return (
    <>
      <CtxHead>{title}</CtxHead>
      {items.length === 0 ? (
        <CtxBody>{empty}</CtxBody>
      ) : (
        items.map((it, i) => <CtxBody key={i}>{it}</CtxBody>)
      )}
    </>
  );
}
