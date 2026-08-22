import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import {
  dispatchBlockedMessage,
  instructionForDispatch,
  wantsDispatch,
  type DispatchBlock,
} from "@/lib/chat-dispatch";
import { agentDisplayName } from "@/lib/agent-vocabulary";

/**
 * THE DEAD BRANCH, AND THE FIVE THINGS THAT USED TO BE ONE SILENT FALLBACK.
 *
 * `src/routes/api/chat.ts` cannot be imported by a test in this repo: it pulls
 * `runtime.server`, the service-role client and the whole orchestration graph
 * behind it. So this file splits in two, and the split is deliberate rather than
 * a convenience. Everything that can be a real assertion is a real assertion,
 * against `src/lib/chat-dispatch.ts`, which is where the predicate and the five
 * sentences were put precisely so they could be executed. What is left is the
 * WIRING, and wiring in a route module is a lexical fact in this repo, checked
 * the way `trigger-dedup-halves.test.ts` and
 * `the-landing-frame-reaches-the-pane.test.ts` check theirs.
 *
 * The original defect was itself purely lexical, which is why reading the source
 * is not a weak substitute here: `startingAgent` is declared before the
 * pre-flight block and assigned only inside it, and the promotion line sat below
 * and read it. Nothing about the runtime was wrong. The ORDER was wrong, and
 * order is exactly what a source assertion can see.
 */

const CHAT = readFileSync("src/routes/api/chat.ts", "utf8");

const ALL_BLOCKS: DispatchBlock[] = [
  "no-workspace",
  "conductor-unavailable",
  "no-specialists",
  "preflight-failed",
  "dispatch-failed",
];

describe("wantsDispatch: the one question, asked once", () => {
  it("dispatches on a forced do with no mention and no classifier verdict", () => {
    // THE REPAIR, stated as the case that used to be impossible. `isMission`
    // false is the classifier reading the words as chat; `forcedDo` is the
    // person pressing the fork anyway. Before this, the promotion line needed
    // `startingAgent`, which only the `isMission` block could assign, so this
    // combination returned prose and started nothing.
    expect(
      wantsDispatch({ isMission: false, forcedDo: true, instruction: "fix the redirect" }),
    ).toBe(true);
  });

  it("dispatches on a classifier verdict with no forced intent", () => {
    expect(wantsDispatch({ isMission: true, forcedDo: false, instruction: "draft the spec" })).toBe(
      true,
    );
  });

  it("refuses a forced do with nothing to act on", () => {
    // A bare "@cos" typed by hand, or a draft that was nothing but whitespace.
    // Dispatching would open a run whose entire goal is the name of the seat it
    // was handed to. (Until 2026-08-22 the client MANUFACTURED this case, by
    // prefixing "@cos" onto every handover; it no longer does, and the case
    // stays reachable because a person can still type it.)
    expect(wantsDispatch({ isMission: false, forcedDo: true, instruction: "" })).toBe(false);
  });

  it("refuses when neither the person nor the classifier asked for work", () => {
    expect(
      wantsDispatch({ isMission: false, forcedDo: false, instruction: "what happened to run 41" }),
    ).toBe(false);
  });

  it("still dispatches a resolved mention even with an empty instruction", () => {
    // `isMission` is already true by the time a mention resolves, and the
    // mention branch has its own emptiness check upstream (a bare "@engineer"
    // clears `mentionedAgent` and falls back to chat). This asserts the
    // predicate does not second-guess that decision.
    expect(wantsDispatch({ isMission: true, forcedDo: true, instruction: "" })).toBe(true);
  });
});

describe("instructionForDispatch: the addressing comes off, the words stay", () => {
  it("strips a handover mention a person typed themselves", () => {
    expect(instructionForDispatch("@cos fix the checkout redirect")).toBe(
      "fix the checkout redirect",
    );
  });

  it("strips a named specialist the same way", () => {
    expect(instructionForDispatch("@engineer rename the column")).toBe("rename the column");
  });

  it("returns nothing at all for a bare mention", () => {
    // The signal `wantsDispatch` refuses on. Still reachable: the client no
    // longer writes this prefix, and nothing stops a person typing it.
    expect(instructionForDispatch("@cos")).toBe("");
    expect(instructionForDispatch("  @cos  ")).toBe("");
  });

  it("leaves a mention that is subject rather than address", () => {
    // Cutting this would edit somebody's instruction: they are naming an agent
    // as the thing to ask about, not the thing to address.
    expect(instructionForDispatch("ask @engineer why this broke")).toBe(
      "ask @engineer why this broke",
    );
  });

  it("leaves ordinary words untouched apart from trimming", () => {
    expect(instructionForDispatch("  draft the pricing spec  ")).toBe("draft the pricing spec");
  });

  it("leaves an email address alone", () => {
    // `parseAgentMentions` refuses these by requiring a word boundary before the
    // "@"; this one is anchored to the start of the string instead, so it has to
    // refuse them for its own reason: there is no space, so the pattern's `\b`
    // ends the slug at the dot and the replace would eat the local part.
    expect(instructionForDispatch("rohit@example.com should get the digest")).toBe(
      "rohit@example.com should get the digest",
    );
  });
});

describe("dispatchBlockedMessage: five states, five sentences", () => {
  it("has a sentence for every state and no two are the same", () => {
    const said = ALL_BLOCKS.map(dispatchBlockedMessage);
    expect(said.filter(Boolean).length).toBe(ALL_BLOCKS.length);
    expect(new Set(said).size).toBe(ALL_BLOCKS.length);
  });

  it("says whether anything started, first, in every one", () => {
    // The only fact a person cannot afford to guess after pressing a button that
    // starts work. Four say nothing started; the fifth cannot, because a row may
    // already exist, and it opens by saying so.
    for (const block of ALL_BLOCKS) {
      expect(dispatchBlockedMessage(block)).toMatch(/^(Nothing started\.|The run did not start,)/);
    }
  });

  it("names something the person can do, in every one", () => {
    for (const block of ALL_BLOCKS) {
      expect(dispatchBlockedMessage(block)).toMatch(
        /Create one|hand this over again|Look for it under Runs/,
      );
    }
  });

  it("carries no em dash or en dash, because a person reads these", () => {
    for (const block of ALL_BLOCKS) {
      expect(dispatchBlockedMessage(block)).not.toMatch(/[\u2013\u2014]/);
    }
  });

  it("leaks no internal identifier at a reader", () => {
    // The sentence that shipped before these told people to enable "Discovery,
    // Strategist, Build": two agents.slug values and a station name, none of
    // which is a word on the roster they were sent to.
    for (const block of ALL_BLOCKS) {
      const said = dispatchBlockedMessage(block);
      expect(said).not.toMatch(/orchestrator|discovery-scout|strategist|builder|workspace_id/i);
      expect(said).not.toMatch(/mission/i);
    }
  });

  it("names the conductor and the specialists by the names on the roster", () => {
    expect(dispatchBlockedMessage("conductor-unavailable")).toContain(
      agentDisplayName("orchestrator"),
    );
    const specialists = dispatchBlockedMessage("no-specialists");
    for (const slug of ["discovery-scout", "strategist", "builder"]) {
      expect(specialists).toContain(agentDisplayName(slug));
    }
  });

  it("warns about the duplicate only where a run may already exist", () => {
    // `dispatch-failed` is the one state reachable after `createMission` has
    // returned. Telling anyone else to go looking would send them after a row
    // that was never inserted.
    expect(dispatchBlockedMessage("dispatch-failed")).toContain("Runs");
    for (const block of ALL_BLOCKS.filter((b) => b !== "dispatch-failed")) {
      expect(dispatchBlockedMessage(block)).not.toContain("Runs");
    }
  });
});

describe("api/chat.ts: the wiring the predicate cannot see", () => {
  it("gates pre-flight and dispatch on the SAME expression", () => {
    // The defect was two gates asking different questions. One `const` computed
    // once and read by both is what makes them unable to drift again.
    expect(CHAT).toContain(
      "const dispatching = wantsDispatch({ isMission, forcedDo, instruction });",
    );
    expect(CHAT).toContain("if (dispatching) {");
    expect(CHAT).toContain("if (dispatching && startingAgent && workspaceId) {");
  });

  it("no longer carries the branch that could never fire", () => {
    expect(CHAT).not.toContain("if (forcedDo && startingAgent && workspaceId) isMission = true;");
    expect(CHAT).not.toMatch(/forcedDo\s*&&\s*startingAgent/);
  });

  it("assigns startingAgent before the gate that reads it", () => {
    // The whole bug in one assertion. `startingAgent` is only ever assigned
    // inside the pre-flight block, so a gate reading it has to come after that
    // block closes, and the promotion line did not.
    const firstAssign = CHAT.indexOf("startingAgent = ");
    const dispatchGate = CHAT.indexOf("if (dispatching && startingAgent && workspaceId) {");
    expect(firstAssign).toBeGreaterThan(-1);
    expect(dispatchGate).toBeGreaterThan(firstAssign);
  });

  it("sets a block at each of the seven conditions", () => {
    // SEVEN CONDITIONS, FIVE STATES. The workspace is checked on both the
    // mention branch and the orchestrator branch, and a conductor can be missing
    // two ways; each pair shares a sentence because the person's next move is
    // identical, and the log keeps the causes apart. Counted rather than merely
    // present, so deleting one condition and leaving its sibling cannot pass.
    //
    // The count was written as six first and the test caught it, which is the
    // only reason it is a count and not an `expect(...).toContain`.
    const assignments = CHAT.match(/preflightBlock = "/g) ?? [];
    expect(assignments.length).toBe(7);
    expect((CHAT.match(/preflightBlock = "no-workspace";/g) ?? []).length).toBe(2);
    expect((CHAT.match(/preflightBlock = "conductor-unavailable";/g) ?? []).length).toBe(2);
    for (const block of ["no-specialists", "preflight-failed", "dispatch-failed"]) {
      expect((CHAT.match(new RegExp(`preflightBlock = "${block}";`, "g")) ?? []).length).toBe(1);
    }
  });

  it("ends the turn on a block instead of asking the model to explain it", () => {
    expect(CHAT).toContain(
      "return streamFriendly(dispatchBlockedMessage(preflightBlock), baseMeta(), preflightBlock);",
    );
    // The system message that used to splice a Postgres error into the answer
    // prompt. Its absence is the point of this item.
    expect(CHAT).not.toContain("preflightWarning");
    expect(CHAT).not.toMatch(/CRITICAL: The user tried to dispatch/);
  });

  it("logs the raw cause and sends only the id", () => {
    expect(CHAT).toContain("preflightDetail");
    expect(CHAT).toMatch(/console\.warn\(\s*`\[chat\] dispatch blocked \(\$\{preflightBlock\}\)/);
    // `preflightDetail` never reaches a stream. Every send is the typed id
    // passed through the sentence table.
    expect(CHAT).not.toMatch(/streamFriendly\([^)]*preflightDetail/);
  });

  it("keeps the typed-mention path working", () => {
    /*
     * The mention branch is untouched: a resolved mention still sets isMission,
     * still pre-plans its single step, and still reaches `advanceMissionCore`.
     *
     * WHAT CHANGED AROUND IT ON 2026-08-22, and this test's title with it. This
     * used to be called "keeps the @cos path working" and its comment predicted
     * that removing the client's prefix "would move handover onto a different
     * dispatch path (runAgentLoop instead of the deterministic advance), which
     * is a live behaviour change nothing here can check." That prediction was
     * right and the move was the point: the deterministic advance runs a
     * SINGLE-STEP DAG, so every handover was producing a one-step run whose only
     * step was assigned to the conductor — the seat whose job is to plan runs
     * for other agents. Handovers now go through `runAgentLoop`, which plans.
     *
     * The branch itself is still load-bearing and still guarded here, because
     * "@engineer rename the column" is a real thing a person types and naming a
     * specialist directly is exactly what it is for.
     */
    expect(CHAT).toContain("startingAgent = { id: mentionedAgent.id };");
    expect(CHAT).toContain("agent_slug: mentionedAgent.slug,");
  });

  it("titles a forced run from the words, never from the wire content", () => {
    // `body.content` carries whatever addressing the PERSON typed whenever the
    // mention did not resolve — an @slug for an agent they do not have, say —
    // so a fallback title built from it would read "@cos fix the redirect".
    // This case only became reachable when the branch came back to life.
    expect(CHAT).toContain("title: missionTitle.trim() || instruction.slice(0, 80),");
    expect(CHAT).toContain("goal: missionGoal || instruction,");
    expect(CHAT).not.toMatch(/goal: missionGoal \|\| body\.content/);
  });
});
