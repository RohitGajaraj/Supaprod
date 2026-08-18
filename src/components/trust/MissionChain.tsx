/**
 * One mission's chain of custody: the nine links from signal to outcome, in
 * order, with the gaps shown rather than hidden. It never fabricates a link.
 *
 * PORTED 2026-07-29 onto shell/primitives. What changed and why:
 *   · It was a `material-medium` card with its own padding, mounted inside
 *     panels that are themselves bordered. That is a card in a card, and the
 *     standard caps a region at one bordered container. It is a `Block` now,
 *     which draws a rule where the register changes.
 *   · The dot-and-connector rail is gone. It drew a 9px circle and a 1px line
 *     per step to say a thing the ORDER of the rows already says, and it spent a
 *     colour on each: moss for present, madder for missing, faint for skipped.
 *     A link's state is a fact about that link, so it reads as a word on the row
 *     that owns it. Grayscale the surface and nothing is lost, which is the test
 *     the rail could not pass.
 *   · A present link says nothing at all, because the row being there IS the
 *     statement. Only a gap, a skip or a not-yet earns words.
 */

import { traceRef } from "@/components/discover/format";
import { Row } from "@/components/meridian/rows";
import { Num } from "@/components/meridian/surface-parts";
import { Block, Value } from "@/components/shell/primitives";
import type {
  ChainStep,
  ChainLinkStatus,
  MissionChain as MissionChainData,
} from "@/lib/trust-chain.functions";

/** What a link that is not present is. A present link takes no word: the row is
 *  the statement, and labelling it would be the same fact said twice. */
const STATUS_LABEL: Record<ChainLinkStatus, string> = {
  present: "",
  missing: "missing",
  skipped: "skipped",
  pending: "not yet",
};

/** A real gap is a failure of the record. A skip and a not-yet are neither good
 *  nor bad, so they stay quiet: colour carries outcomes, never categories. */
const STATUS_TONE: Record<ChainLinkStatus, "quiet" | "pass" | "warn" | "fail"> = {
  present: "quiet",
  missing: "fail",
  skipped: "quiet",
  pending: "quiet",
};

function fmtTime(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function StepRow({ step }: { step: ChainStep }) {
  const word = STATUS_LABEL[step.status];
  return (
    <Row
      lead={
        <>
          {step.label}
          {step.agentName && (
            <>
              {" "}
              <Value tone="quiet">by {step.agentName}</Value>
            </>
          )}
          {word ? (
            <>
              {" "}
              <Value tone={STATUS_TONE[step.status]}>{word}</Value>
            </>
          ) : null}
        </>
      }
      sub={
        step.backingId ? (
          <>
            {step.detail} <Num>{traceRef(step.backingId)}</Num>
          </>
        ) : (
          step.detail
        )
      }
      time={fmtTime(step.occurredAt)}
      tight
    />
  );
}

export function MissionChain({ chain }: { chain: MissionChainData }) {
  const missingCount = chain.steps.filter((s) => s.status === "missing").length;
  return (
    <Block
      title={chain.missionTitle}
      sub={
        chain.unbroken ? (
          <Value tone="pass">Every link is on the record.</Value>
        ) : (
          <Value tone="fail">
            <Num>{missingCount}</Num> {missingCount === 1 ? "link is" : "links are"} missing from
            the record.
          </Value>
        )
      }
    >
      {chain.steps.map((s) => (
        <StepRow key={s.key} step={s} />
      ))}
    </Block>
  );
}
