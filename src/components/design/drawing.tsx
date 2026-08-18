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

import type { ReactNode } from "react";
import { Row, Line } from "@/components/meridian/rows";
import { Action, Num, Value } from "@/components/meridian/surface-parts";
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
 * The light base is deliberate and is not a theme break: the document inside
 * styles its own canvas and assumes a light page, so the frame matches it
 * rather than flashing dark before srcDoc paints.
 *
 * IT IS A TOKEN NOW, AND IT WAS `#fff` (2026-08-14). Meridian's own header
 * bans pure white and pure black outright, and this file is the one place in
 * the station that hand wrote a colour. The base has to be light in BOTH
 * grounds, which rules out every surface token: `sheet` and `float` invert with
 * the theme and would put the dark flash back on the dark ground, which is the
 * exact thing this line exists to prevent. `--mrd-on-solid` is the only token
 * in the system that is light on both, and it is borrowed here rather than
 * meant: it was authored for text sitting on a filled control. The gap it is
 * standing in for is reported to the design lane, and if a token for an
 * embedded document's canvas ever lands, this is its first caller.
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
        /* THE FRAME IS MERIDIAN'S NOW TOO, 2026-08-18. The base moved to a
           `--mrd-*` token on 2026-08-14 and its border and corner did not, so
           this one element was drawn half in a retired system: `--sp-line` and
           `--sp-radius-panel` are the ink layer's edge and pane radius.
           `--mrd-line` is the same job ("a real edge") and `--mrd-r-pane` is
           the same 16px stop the Gate and every pane in the system use, so
           this is a rename rather than a change of shape. */
        border: "1px solid var(--mrd-line)",
        borderRadius: "var(--mrd-r-pane)",
        background: "var(--mrd-on-solid)",
      }}
    />
  );
}

/* ------------------------------------------------------------------ *
 * The consequence
 * ------------------------------------------------------------------ */

/** Emphasis without hue: the top of the ink ramp and a heavier stroke. See the
 *  note on `Consequence` for why this is not a colour. */
function Raised({ children }: { children: ReactNode }) {
  return <span className="font-medium text-mrd-ink">{children}</span>;
}

/**
 * What letting this through actually does. Four questions, and each answer is
 * either read from the record or replaced by the sentence that says we did not
 * read it.
 *
 * THE THREE ANSWERS THAT MATTER ARE RAISED, NOT TINTED (2026-08-14). They wore
 * `tone="warn"`, which resolves to `--sp-warn`, a gold. There is no warning
 * colour in this product and no token for one, on purpose: the hues are spoken
 * for, one for "a person is required" and two for outcome, and a fourth meaning
 * invented for a panel is a meaning every reader then has to learn. Gold is
 * also the specific hue the system keeps off the screen. What these three
 * sentences actually need is weight, so they take the top of the ink ramp and a
 * heavier stroke, which reads at a glance and survives greyscale.
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
          <Value>
            {redrawn ? (
              <Raised>The drawing before it, which was overwritten</Raised>
            ) : (
              "Nothing. First drawing of this spec"
            )}
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
        <Value>
          {blocksDispatch ? (
            <Raised>This spec cannot reach Build</Raised>
          ) : !stageEnabled ? (
            "Nothing. The design stage is off"
          ) : gateStatus === "approved" ? (
            "Nothing. It can reach Build"
          ) : !hasDrawing ? (
            "Nothing. No screen is drawn, so the gate has nothing to hold"
          ) : (
            "Nothing"
          )}
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
        <Value>
          {boundRules.length === 0 ? (
            hasDrawing ? (
              "No rules in force. Drawn from generic defaults"
            ) : (
              "No rules in force. It would be drawn from generic defaults"
            )
          ) : stale > 0 ? (
            <Raised>
              <Num>{boundRules.length}</Num> rules {hasDrawing ? "bound in" : "would bind in"}
            </Raised>
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
 * the same extractor the brand rules in Settings use, and what comes back lands
 * in the gate at the top of this surface.
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
                /* `Action variant="quiet"`, the port of the retired ghost. Not
                   an `Approve`: turning a finding into a standing rule drafts
                   a PENDING rule, which then goes and waits in the gate at the
                   top of the station. It releases nothing; it adds something
                   to be released. */
                <Action
                  variant="quiet"
                  disabled={pendingIssue !== null}
                  onClick={() => onMakeRule(f)}
                >
                  {pendingIssue === f.issue ? "Drafting" : "Make it a rule"}
                </Action>
              ) : undefined
            }
          />
        );
      })}
    </>
  );
}
