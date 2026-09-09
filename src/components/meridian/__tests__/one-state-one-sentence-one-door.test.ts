/**
 * ── EVERYTHING IS TRUE AND NOTHING IS DESIGNED ────────────────────────────
 *
 * The founder, on the tablet track's run. P-37 is that pass, and these three
 * components are its vocabulary: a card asks, a seat speaks, a row folds.
 *
 * The rule they exist to make STRUCTURAL rather than remembered is: **a screen
 * in one state asks for one thing.** Six of the seven shapes A1 catalogued are
 * that rule broken in six places, so the fix is not six patches; it is
 * components that cannot express the broken shape.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import { defaultLine } from "@/components/meridian/Ask";

const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, " ").replace(/^\s*\/\/.*$/gm, " ");
const ASK = strip(readFileSync("src/components/meridian/Ask.tsx", "utf8"));
const SEAT = strip(readFileSync("src/components/meridian/SeatSays.tsx", "utf8"));
const ROW = strip(readFileSync("src/components/meridian/FoldingRow.tsx", "utf8"));
const CSS = readFileSync("src/styles/meridian.css", "utf8");

describe("an irreversible gate cannot merge by silence", () => {
  /**
   * The sharpest thing in this packet, and it was a defect in the MOCKUP before
   * it was a component: the first draft read "If nobody answers, this merges at
   * 18:00". That is not a gate, it is a delay, on the one path customers see.
   * Caught as copy by A1; fixed as a type here, because a slot that renders
   * whatever default it is handed will eventually be handed that one.
   */
  it("takes no sentence at all for an irreversible ask", () => {
    /*
     * The irreversible arm has NOTHING to fill but the clock. P-50 made `waited`
     * optional, because the Ask panel's queue items carry no timestamp and a
     * card that omits it says less rather than something false; the arm still
     * takes no sentence, which is the property under test.
     */
    /*
     * PINNED ON THE CLAIM. This asserted the arm's exact source text, which
     * broke the moment `since` was renamed to `waited` for saying "since 5
     * days" -- a rename that made the type MORE honest, failing a guard whose
     * subject is a different property entirely. The property is that the
     * irreversible arm carries no caller sentence, and that reads off the arm
     * without quoting it whole.
     */
    const arm = ASK.replace(/\s+/g, " ").match(/\| \{ kind: "irreversible";[^}]*\}/)?.[0];
    expect(arm, "the AskDefault union moved; re-point this test").toBeTruthy();
    expect({ carriesASentence: /whatHappens/.test(arm!) }).toEqual({ carriesASentence: false });
    /* And the sentence it produces is the same one whatever it is handed. */
    expect(defaultLine({ kind: "irreversible", waited: "3 hours" })).toEndWith(
      "Nothing runs until you answer.",
    );
  });

  it("writes that sentence itself, once, with no argument that changes it", () => {
    expect(ASK).toContain("Nothing runs until you answer.");
    expect(ASK.replace(/\s+/g, " ")).toContain('d.kind === "irreversible"');
  });
});

describe("the order is the design, so it is not a prop", () => {
  it("takes named slots and never children or a section array", () => {
    // `children` or `sections` would let the next surface reorder it.
    expect(ASK).not.toContain("children");
    expect(ASK).not.toContain("sections");
  });

  it("renders question, risk, reason, default, answers in that order", () => {
    const q = ASK.indexOf("{question}");
    const r = ASK.indexOf("{risk}");
    const why = ASK.indexOf("{reason}");
    const d = ASK.indexOf("defaultLine(fallback)");
    const a = ASK.indexOf("{answer.label}");
    expect(q).toBeGreaterThan(-1);
    expect(r).toBeGreaterThan(q);
    expect(why).toBeGreaterThan(r);
    expect(d).toBeGreaterThan(why);
    expect(a).toBeGreaterThan(d);
  });

  it("has no slot for what does not help a person answer", () => {
    // Every one is true; none of them changes the answer. A slot that exists
    // gets filled, so there is no slot.
    for (const absent of ["tokens", "elapsed", "traceId", "stationChip"]) {
      expect(ASK).not.toContain(absent);
    }
  });
});

describe("a seat cannot narrate the run, which closes shape 3 structurally", () => {
  it("has no action slot, so a message can never carry the door", () => {
    expect(SEAT).not.toContain("onPress");
    expect(SEAT).not.toContain("children");
    expect(SEAT).not.toContain("Action");
  });

  it("takes one sentence, not a list of them", () => {
    // "One message per moment" is a shape, not a discipline.
    expect(SEAT.replace(/\s+/g, " ")).toContain("said: string;");
    expect(SEAT).not.toContain("said: string[]");
  });
});

describe("the row grew, it did not toggle", () => {
  it("draws no chevron, because the height is already the state", () => {
    // Two indicators of one state is shape 2 in miniature.
    expect(ROW).not.toContain("Chevron");
    expect(ROW).not.toContain("rotate-");
  });

  it("keeps the lead outside the animated region", () => {
    // If the thing you clicked jumps, you clicked the wrong thing.
    const animated = ROW.indexOf("gridTemplateRows");
    expect(ROW.indexOf("{lead}")).toBeLessThan(animated);
  });

  it("animates grid rows rather than a measured height", () => {
    // `1fr` to `0fr` reaches the content's own height with no measurement, so a
    // resize cannot leave a stale pixel value behind.
    expect(ROW.replace(/\s+/g, " ")).toContain('gridTemplateRows: open ? "1fr" : "0fr"');
  });

  it("uses Meridian's own motion tokens, and they exist", () => {
    /*
     * THIS ASSERTION EXISTS BECAUSE I SHIPPED THE BUG IT CATCHES. The first
     * draft wrote `duration-mrd-move ease-mrd`, which are not utilities in this
     * codebase and never have been, so the motion would have been silently
     * absent while the file claimed it. That is the same "asserted but not
     * implemented" class P-37 is cleaning up, committed inside the cleanup.
     *
     * So the class is asserted AND the token is checked to exist in the system.
     */
    expect(ROW).toContain("duration-(--mrd-d-move)");
    expect(ROW).toContain("ease-(--mrd-ease)");
    expect(CSS).toContain("--mrd-d-move:");
    expect(CSS).toContain("--mrd-ease:");
    expect(ROW).not.toContain("duration-mrd-move");
  });

  it("keeps the height under reduced motion and drops the decoration", () => {
    // The height is layout; the rise and the fade are decoration.
    expect(ROW).toContain("motion-reduce:translate-y-0");
    expect(ROW).toContain("motion-reduce:opacity-100");
  });

  it("has exactly three marks", () => {
    expect(ROW.replace(/\s+/g, " ")).toContain(
      'const MARK: Record<RowMark, string> = { filed: "✓", "filed-nothing": "◦", stopped: "⊘", }',
    );
  });
});

/**
 * ── THE ASK PANEL WAS THE FOURTH CARD DIALECT (P-50) ──────────────────────
 *
 * A1 found it on the served build: the panel drew its own gate card, with a
 * "Waiting on you" chip the run's card had just lost and three answers where
 * the doc has two registers. Nothing on it was untrue. It is shape 1 in a
 * second place, a surface composing its own card because there was no shared
 * one to reach for.
 */
const PANEL = strip(readFileSync("src/components/ask/AskGateCard.tsx", "utf8"));

describe("the Ask panel speaks the one card vocabulary", () => {
  it("composes Ask and no longer draws its own card", () => {
    expect(PANEL).toContain("<Ask");
    expect(PANEL).not.toContain("<Gate");
    // The three raw controls it used to lay out itself are gone with it.
    expect(PANEL).not.toContain("<Actions");
    expect(PANEL).not.toContain("<Approve");
  });

  it("puts the third verdict on the default line, not beside the answers", () => {
    /*
     * Approve, reject and snooze are three GENUINE verdicts and none is a
     * duplicate, so "the card takes two answers" is not on its own the
     * argument. The argument is that two of them answer the question and one
     * declines to: a snooze is the declared default arriving early.
     */
    expect(PANEL).toContain("fallbackAction={{");
    const fallbackAt = PANEL.indexOf("fallbackAction={{");
    const declineAt = PANEL.indexOf("decline={{");
    expect(declineAt).toBeGreaterThan(-1);
    expect(fallbackAt).toBeGreaterThan(declineAt);
  });

  it("says what silence does, in both the gate and the policy wording", () => {
    // A1's ruling: the same shape with different words, and the two registers
    // keep their meaning when the verbs change.
    expect(PANEL).toContain("Nothing dispatches until you answer.");
    expect(PANEL).toContain("It keeps asking until you say otherwise.");
  });

  it("no longer wears the chip the run's card lost", () => {
    expect(PANEL).not.toContain("Waiting on you");
  });
});

describe("the default's action is not a fourth answer", () => {
  it("Ask has a slot for it, and no slot to put a fourth answer in", () => {
    /*
     * The whole reason the rule lives in the component: a slot that exists gets
     * filled, and the next surface with a third verdict would have put it
     * beside the answers exactly as this one did.
     */
    expect(ASK).toContain("fallbackAction?:");
    expect(ASK).not.toContain("answers:");
    expect(ASK).not.toContain("third");
  });

  it("renders it on the default line rather than with the answers", () => {
    const flat = ASK.replace(/\s+/g, " ");
    expect(flat).toContain(
      '<p className="text-mrd-data text-mrd-mute">{defaultLine(fallback)}</p>',
    );
    // Inside the same row as the default sentence, above the answers.
    expect(ASK.indexOf("{fallbackAction.label}")).toBeLessThan(ASK.indexOf("{answer.label}"));
  });

  it("omits the clock rather than inventing one when nobody recorded it", () => {
    /*
     * CALLED, NOT GREPPED. This used to assert the literal source line, which
     * is the defect law 18 names: it passed for a year while the sentence it
     * produced read **"Waiting on you since 5 days"** on the served Inbox --
     * the preposition wanted an instant and the only caller passes a duration.
     * A guard on the spelling cannot see a sentence; running it can.
     *
     * The panel's queue items carry no timestamp. A card that omits it says
     * less; a card that fills it says something false.
     */
    expect(defaultLine({ kind: "irreversible" })).toBe("Nothing runs until you answer.");
    expect(defaultLine({ kind: "irreversible", waited: null })).toBe(
      "Nothing runs until you answer.",
    );
  });

  it("says how long it has waited in a sentence that is English", () => {
    expect(defaultLine({ kind: "irreversible", waited: "5 days" })).toBe(
      "Waiting on you for 5 days. Nothing runs until you answer.",
    );
  });

  it("keeps the reversible card's own consequence, clock or no clock", () => {
    // The load-bearing half is what happens if nobody answers; the clock is an
    // enrichment and must never displace it.
    expect(defaultLine({ kind: "reversible", whatHappens: "This reruns tonight." })).toBe(
      "This reruns tonight.",
    );
    expect(
      defaultLine({ kind: "reversible", waited: "2 hours", whatHappens: "This reruns tonight." }),
    ).toBe("Waiting on you for 2 hours. This reruns tonight.");
  });

  it("never puts a preposition for an instant in front of a span", () => {
    /*
     * THE MIRROR, AND THE ONE THAT WOULD HAVE CAUGHT IT. Every value this
     * sentence can receive is a duration from `stoppedFor` -- "5 days",
     * "3 hours", "1 minute" -- so "since" can never be right in front of it.
     */
    for (const waited of ["1 minute", "3 hours", "1 day", "12 days"]) {
      const said = defaultLine({ kind: "irreversible", waited });
      expect({ waited, since: said.includes("since") }).toEqual({ waited, since: false });
      expect({ waited, reads: said.startsWith(`Waiting on you for ${waited}.`) }).toEqual({
        waited,
        reads: true,
      });
    }
  });
});
