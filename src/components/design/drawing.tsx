/**
 * The pieces the Design stage needs and the primitives do not carry: the drawn
 * screen itself, and the consequence of letting it through.
 *
 * Nothing here invents a fact. Every line `Consequence` renders is a value the
 * server read out of the record, and the one case it cannot read (a failed
 * lineage query) says so in those words rather than rendering as "nothing".
 * That distinction is the whole point of the panel: a mockup with no blast
 * radius is a drawing, and a mockup claiming a blast radius it did not measure
 * is worse than either.
 */

import { Line, Num, Row, Value, Button } from "@/components/shell/primitives";
import type { DesignConsequence, DesignGateWord } from "@/lib/design-scaffold.functions";
import type { DesignCriticFinding } from "@/lib/ai/design-critic";
import { RULE_TEXT_FLOOR, ruleTextFor, tallyPhrase } from "./vocabulary";

/* ------------------------------------------------------------------ *
 * The drawing
 * ------------------------------------------------------------------ */

/**
 * The stored document, live.
 *
 * srcDoc plus a sandbox with no `allow-same-origin` puts it at a null origin,
 * so it cannot reach this page, its cookies or its storage; the generator
 * strips external script and link tags before the row is ever written. Scripts
 * and forms stay allowed because the founder asked for a prototype you can
 * click, and a screenshot of a screen is not that. This is the same frame
 * contract `DesignScaffoldPanel` and the mission canvas already use.
 *
 * The white base is deliberate and is not a theme break: the document inside
 * styles its own canvas and assumes a light page, so the frame matches it
 * rather than flashing dark before srcDoc paints.
 */
export function DrawingStage({ html, title }: { html: string; title: string }) {
  return (
    <iframe
      title={`${title}, as drawn`}
      sandbox="allow-scripts allow-forms allow-modals"
      srcDoc={html}
      style={{
        display: "block",
        width: "100%",
        height: 460,
        border: "1px solid var(--sp-line)",
        borderRadius: "var(--sp-radius-panel)",
        background: "#fff",
      }}
    />
  );
}

/* ------------------------------------------------------------------ *
 * The consequence
 * ------------------------------------------------------------------ */

/**
 * What letting this through actually does. Four questions, and each answer is
 * either read from the record or replaced by the sentence that says we did not
 * read it.
 */
export function Consequence({
  consequence,
  redrawn,
  hasDrawing,
  gateStatus,
  stageEnabled,
}: {
  consequence: DesignConsequence;
  redrawn: boolean;
  hasDrawing: boolean;
  gateStatus: DesignGateWord;
  stageEnabled: boolean;
}) {
  const { blocksDispatch, touches, cameFrom, lineageRead, boundRules } = consequence;
  const stale = boundRules.filter((r) => r.newerThanDrawing).length;

  return (
    <>
      {hasDrawing ? (
        <Line label="What it replaces">
          <Value tone={redrawn ? "warn" : "quiet"}>
            {redrawn
              ? "The drawing before it, which was overwritten"
              : "Nothing. First drawing of this spec"}
          </Value>
        </Line>
      ) : null}

      {/* THE LAST BRANCH IS THE ONE THAT MATTERS, and it used to be the bare
          word "Nothing" because it was unreachable: `blocksDispatch` was
          computed as stage-on AND not-approved, so an undrawn spec with the
          stage on fell into the warn line above and was told it could not reach
          Build. It can. `designGateBlocksDispatch` does not gate the absence of
          a drawing, so with nothing drawn the gate holds nothing up, and the
          sentence says why rather than leaving a one-word answer under the most
          consequential question on the panel. */}
      <Line label="What it holds up">
        <Value tone={blocksDispatch ? "warn" : "quiet"}>
          {blocksDispatch
            ? "This spec cannot reach Build"
            : !stageEnabled
              ? "Nothing. The design stage is off"
              : gateStatus === "approved"
                ? "Nothing. It can reach Build"
                : !hasDrawing
                  ? "Nothing. No screen is drawn, so the gate has nothing to hold"
                  : "Nothing"}
        </Value>
      </Line>

      <Line label="What it touches">
        <Value>
          {!lineageRead
            ? "Not known. The record could not be read"
            : touches.length === 0
              ? "The record holds no link onward from this spec"
              : tallyPhrase(touches)}
        </Value>
      </Line>

      {lineageRead && cameFrom.length > 0 ? (
        <Line label="What it came from">
          <Value>{tallyPhrase(cameFrom)}</Value>
        </Line>
      ) : null}

      <Line
        label="Your brand in it"
        sub={
          stale > 0 ? (
            <>
              <Num>{stale}</Num> came into force after it was drawn, so it does not follow them yet.
            </>
          ) : undefined
        }
      >
        <Value tone={stale > 0 ? "warn" : "quiet"}>
          {boundRules.length === 0 ? (
            hasDrawing ? (
              "No rules in force. Drawn from generic defaults"
            ) : (
              "No rules in force. It would be drawn from generic defaults"
            )
          ) : (
            <>
              <Num>{boundRules.length}</Num> rules {hasDrawing ? "bound in" : "would bind in"}
            </>
          )}
        </Value>
      </Line>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The Critic's findings
 * ------------------------------------------------------------------ */

/**
 * Each finding carries the one thing you can do about it without leaving: make
 * it a standing rule, so the crew stops repeating it. That posts the finding to
 * the same extractor the brand ledger uses, and what comes back lands in the
 * gate at the top of this surface.
 */
export function Findings({
  findings,
  onMakeRule,
  pendingIssue,
}: {
  findings: DesignCriticFinding[];
  onMakeRule: (f: DesignCriticFinding) => void;
  pendingIssue: string | null;
}) {
  return (
    <>
      {findings.map((f, i) => {
        const canRule = ruleTextFor(f).length >= RULE_TEXT_FLOOR;
        return (
          <Row
            key={`${i}-${f.issue.slice(0, 24)}`}
            tight
            lead={f.issue}
            sub={
              f.standing_decision
                ? `Against your rule: ${f.standing_decision}`
                : `${f.principle}, not a rule you set`
            }
            action={
              canRule ? (
                <Button
                  variant="ghost"
                  disabled={pendingIssue !== null}
                  onClick={() => onMakeRule(f)}
                >
                  {pendingIssue === f.issue ? "Drafting" : "Make it a rule"}
                </Button>
              ) : undefined
            }
          />
        );
      })}
    </>
  );
}
