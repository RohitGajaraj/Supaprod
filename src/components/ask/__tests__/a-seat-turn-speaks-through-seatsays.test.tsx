/**
 * P-48 (A-QUEUE.md). `AskTurn` composes Meridian's `SeatSays` for its own
 * short, first-person, no-markdown seat statements ("Sent back", the failed-
 * plan note, the record-was-empty line) -- see the finding comment above the
 * "Answer" register in `AskTurn.tsx` for why the crew's full markdown answer
 * stays in `Answer` instead: `SeatSays.said` is a required plain string with
 * no markdown support, and the founder's 2026-07-30 ruling requires the
 * crew's prose to render through `Answer` or not at all.
 *
 * `SeatSays` itself is built with no action prop and no children, "never in
 * the imperative" by construction (its own header: "'press run' is the
 * card's to say and only if the card is asking"). This test drives the real
 * component through the real render path -- not a source-scan of the
 * string -- and pins two things: the seat name renders as SeatSays's own
 * distinct label above the sentence (proving composition, not a bespoke
 * paragraph that merely looks similar), and the sentence itself never opens
 * on an imperative verb.
 */
import * as React from "react";
import { render, screen, cleanup } from "@testing-library/react";
import { describe, test, expect, afterEach } from "bun:test";

import { AskTurn, type Turn } from "../AskTurn";
import type { PlanProposal } from "@/lib/ask/plan-proposal";
import type { PlanDecisionState } from "@/hooks/use-ask-stream";

afterEach(cleanup);

const BASE_TURN: Turn = { key: "t1", question: null, answer: null };

const PROPOSAL: PlanProposal = {
  id: "6f1c2f7e-0d2a-4a1f-9a1b-2c3d4e5f6a7b",
  shape: "existing-feature",
  station: "define",
  origin: "the onboarding drop-off after email verify is getting worse",
  title: "Verify-step drop-off",
  goal: "Find out why the drop-off after email verify is getting worse",
  spendCapUsd: 5,
};

/** Common imperative openers this codebase's own CTAs use elsewhere ("press
 *  run", "try again", "go and see"). A seat report must never open on one. */
const IMPERATIVE_OPENER = /^(press|click|do|go|say|try|open|start|stop|run|send|ask)\b/i;

function renderTurn(overrides: {
  proposal?: PlanProposal | null;
  planDecision?: PlanDecisionState;
}) {
  render(
    <AskTurn
      turn={BASE_TURN}
      streaming={false}
      liveStatus={null}
      queue={[]}
      initials="AB"
      onRetry={() => {}}
      proposal={overrides.proposal}
      planDecision={overrides.planDecision}
      onDecidePlan={() => {}}
    />,
  );
}

describe("a seat turn speaks through SeatSays, and never in the imperative", () => {
  test('"Sent back" renders the seat name as its own label, above a declarative sentence', () => {
    renderTurn({ proposal: PROPOSAL, planDecision: { status: "sent-back" } });

    // The seat name is SeatSays's OWN distinct paragraph, not folded into the
    // sentence -- proving this came through the component's real layout.
    expect(screen.getByText("The crew")).toBeTruthy();

    const said = screen.getByText(
      "Nothing started and nothing was charged. It has your note and comes back with a new plan.",
    );
    expect(said).toBeTruthy();
    expect(IMPERATIVE_OPENER.test(said.textContent ?? "")).toBe(false);
  });

  test("a failed plan's note also speaks through SeatSays, declaratively", () => {
    renderTurn({
      proposal: PROPOSAL,
      planDecision: { status: "failed", message: "The request timed out." },
    });

    expect(screen.getByText("The crew")).toBeTruthy();
    const said = screen.getByText(
      "The request timed out. Nothing started, so the plan still stands as it was.",
    );
    expect(said).toBeTruthy();
    expect(IMPERATIVE_OPENER.test(said.textContent ?? "")).toBe(false);
  });
});
