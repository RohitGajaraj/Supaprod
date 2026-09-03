/**
 * THE CHARACTER NEVER CLAIMS A STATE IT CANNOT PROVE.
 *
 * Presence is read, never staged (SPEC-PRESENCE.md). These tests pin three
 * things: every state is reachable only from the input that proves it; the
 * precedence puts a dead feed and a person's question above our own busyness;
 * and the verb vocabulary is tied to the repo's own tool catalogue so a
 * renamed tool breaks HERE, loudly, instead of a surface falling back to a raw
 * slug during the one walk somebody is watching.
 */

import { describe, expect, test } from "bun:test";

import {
  deriveCharacter,
  verbForTool,
  CHARACTER_NAME,
  MUST_HAVE_VERBS,
  VERB_BY_TOOL,
  type PresenceInput,
} from "./character";
import { isCataloguedTool } from "@/lib/tool-consequences";

const openTrack = (over: Partial<NonNullable<PresenceInput["track"]>> = {}) => ({
  status: "open",
  holdReason: null,
  drivenAt: "2026-08-25T08:00:00Z",
  ...over,
});

const base = (over: Partial<PresenceInput> = {}): PresenceInput => ({
  track: openTrack(),
  result: null,
  walking: false,
  continuing: false,
  ...over,
});

describe("each state needs its proof", () => {
  test("a dead feed is out-of-touch, never a smile", () => {
    const p = deriveCharacter(base({ feedDead: true, walking: true, currentTool: "prd.draft" }));
    expect(p.state).toBe("out-of-touch");
  });

  test("a missing track row is out-of-touch, not awake", () => {
    expect(deriveCharacter(base({ track: null })).state).toBe("out-of-touch");
  });

  test("walking with no tool yet is thinking", () => {
    expect(deriveCharacter(base({ walking: true })).state).toBe("thinking");
  });

  test("walking with a tool is working, and the line names the act", () => {
    const p = deriveCharacter(base({ walking: true, currentTool: "prd.draft" }));
    expect(p.state).toBe("working");
    expect(p.line).toContain("writing the spec");
  });

  test("waiting-on-a-person is asking, even while a leg is in flight", () => {
    const p = deriveCharacter(
      base({ track: openTrack({ holdReason: "waiting-on-a-person" }), walking: true }),
    );
    expect(p.state).toBe("asking");
  });

  test("tools-refused is blocked, and the line says redoing the work will not help", () => {
    const p = deriveCharacter(base({ track: openTrack({ holdReason: "tools-refused" }) }));
    expect(p.state).toBe("blocked");
    expect(p.line).toContain("locked");
  });

  test("a finished route is done", () => {
    const p = deriveCharacter(base({ result: { stopped: "finished", more: false } }));
    expect(p.state).toBe("done");
  });

  test("between self-continuing legs is resting — proven by out-of-window AND more AND continuing", () => {
    const p = deriveCharacter(
      base({ continuing: true, result: { stopped: "out-of-window", more: true } }),
    );
    expect(p.state).toBe("resting");
  });

  test("out-of-window WITHOUT the continue flag is not resting — nothing is coming", () => {
    const p = deriveCharacter(base({ result: { stopped: "out-of-window", more: true } }));
    expect(p.state).toBe("awake");
  });

  test("any other hold is SILENT, because the card owns the run's state", () => {
    /*
     * P-37, amendment 6. This asserted the character DEFERRED to the hold line
     * in words ("I've stopped, the reason is on the hold line"), which was the
     * best a required `line: string` allowed: every branch had to say something,
     * so the branch for a held run said something about the run's state.
     *
     * Deferring in the wording is not the same as not speaking. On the honest
     * run that sentence rendered directly above a card headed "Why it stopped",
     * and the same voice said "I'm ready, press run" after the person had
     * pressed. A voice that CAN narrate the run will narrate it twice, or late.
     *
     * `quiet` is the state that makes it structural, and `Character` returns
     * null in it: not a mark with a blank beside it, which is a character
     * visibly saying nothing, but no element at all.
     */
    const p = deriveCharacter(base({ track: openTrack({ holdReason: "produced-nothing" }) }));
    expect(p.state).toBe("quiet");
    expect(p.line).toBe("");
  });

  test("a never-driven track gets the ready-to-start line", () => {
    const p = deriveCharacter(base({ track: openTrack({ drivenAt: null }) }));
    expect(p.state).toBe("awake");
    expect(p.line).toContain("press run");
  });
});

describe("the verb vocabulary is tied to the tool catalogue", () => {
  test("every filing-chain tool carries a curated verb, never the fallback", () => {
    for (const slug of MUST_HAVE_VERBS) {
      expect(VERB_BY_TOOL[slug], `${slug} must have a curated verb`).toBeDefined();
    }
  });

  test("every curated slug exists in the tool catalogue — a rename breaks here, loudly", () => {
    for (const slug of Object.keys(VERB_BY_TOOL)) {
      expect(isCataloguedTool(slug), `${slug} is not in tool-consequences`).toBe(true);
    }
  });

  test("the fallback states the real slug and invents nothing", () => {
    expect(verbForTool("some.future.tool")).toBe("running some.future.tool");
  });
});

describe("the name is a single constant", () => {
  test("it exists and is one word, so the founder's rename is one edit", () => {
    expect(CHARACTER_NAME.length).toBeGreaterThan(0);
    expect(CHARACTER_NAME).not.toContain(" ");
  });
});
