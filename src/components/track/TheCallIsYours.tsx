/**
 * ── R-39's CHOICE, ON THE RUN SCREEN (P-71b) ─────────────────────────────
 *
 * P-71 stopped the strategist recording a no that rested on our own emptiness.
 * That left the track with nowhere to go, and the person who typed the sentence
 * still owed an answer. This is the answer: the refusal becomes a question.
 *
 * ── IT IS THE ONE THING ON THE SCREEN (P-37) ─────────────────────────────
 *
 * A screen in one state asks for one thing. When this is up, the run's own
 * "let it try again" is not drawn: pressing it would dispatch the station that
 * just refused, into the same emptiness, and spend money to arrive back here.
 *
 * ── AND NEITHER OPTION IS PRE-SELECTED ───────────────────────────────────
 *
 * `Choice`'s contract, and it matters more here than anywhere: this is the one
 * question in the product where the machine has said it cannot judge. A default
 * would be the machine judging.
 */
import * as React from "react";
import { Choice } from "@/components/meridian/Choice";
import { CARRIED_CHOICE } from "@/lib/spine/a-call-on-your-sentence-is-yours-to-make";

export function TheCallIsYours({
  onBuildOnYourWord,
  onPointASource,
  busyId = null,
}: {
  onBuildOnYourWord: () => void;
  onPointASource: () => void;
  busyId?: string | null;
}) {
  return (
    <Choice
      question={CARRIED_CHOICE.question}
      /*
       * The WHY is the finding, said plainly: Sense looked and the workspace is
       * empty. Without it the question reads as the product being indecisive,
       * rather than as the one honest thing it can say.
       */
      why="Nothing in this workspace bears on your sentence yet, so nothing here can tell you whether this is worth building."
      options={CARRIED_CHOICE.options.map((o) => ({
        id: o.id,
        label: o.label,
        fact: o.fact,
      }))}
      busyId={busyId}
      onPick={(id) => {
        if (id === "build-on-your-word") onBuildOnYourWord();
        else onPointASource();
      }}
    />
  );
}

export default TheCallIsYours;
