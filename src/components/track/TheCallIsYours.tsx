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
  onBuildOnYourWord: (howWeWillKnow: string) => void;
  onPointASource: () => void;
  busyId?: string | null;
}) {
  /*
   * ── WHAT WOULD SETTLE IT, IN THEIR WORDS (P-71e) ────────────────────────
   *
   * The observable was written FOR them and could not be changed. A person
   * building on their own word is the one person who knows what would settle
   * it, and the sentence they were handed says only that nothing here can.
   *
   * Empty by default and never prefilled with a guess. A box already holding a
   * plausible metric gets accepted rather than read, and inventing an
   * observable this workspace cannot see is the defect that produced this whole
   * line of packets. Left blank, the honest default stands and the record says
   * it was their call.
   */
  const [howWeWillKnow, setHowWeWillKnow] = React.useState("");

  return (
    <Choice
      question={CARRIED_CHOICE.question}
      /*
       * The WHY is the finding, said plainly: Sense looked and the workspace is
       * empty. Without it the question reads as the product being indecisive,
       * rather than as the one honest thing it can say.
       */
      why="Nothing in this workspace bears on your sentence yet, so nothing here can tell you whether this is worth building."
      /* The consequence is a sentence, so it rides under the label; no datum
         is given, so no datum slot is drawn (Lane 1's review, 2026-09-08). */
      options={CARRIED_CHOICE.options.map((o) => ({
        id: o.id,
        label: o.label,
        sub: o.fact,
      }))}
      busyId={busyId}
      onPick={(id) => {
        if (id === "build-on-your-word") onBuildOnYourWord(howWeWillKnow.trim());
        else onPointASource();
      }}
      /*
       * Under the options, not above them: it belongs to one of the two answers
       * and a field above the question would read as something to fill in
       * before choosing.
       */
      after={
        <label className="flex flex-col gap-mrd-1">
          <span className="text-mrd-label text-mrd-mute">
            If you know what would settle it, say so. Otherwise the record says nothing here can
            grade it yet.
          </span>
          <input
            type="text"
            value={howWeWillKnow}
            onChange={(e) => setHowWeWillKnow(e.target.value)}
            placeholder="What would tell you this worked"
            /* `data-mrd` and no focus classes: Meridian's rule is that the
               focus ring is INHERITED from that attribute and never declared by
               a component, so a surface cannot end up with two rings that
               disagree. Its own guard caught this one. */
            data-mrd=""
            className="rounded-mrd-ctl border border-mrd-line bg-mrd-sink px-mrd-3 py-mrd-2 text-mrd-base text-mrd-ink placeholder:text-mrd-faint"
          />
        </label>
      }
    />
  );
}

export default TheCallIsYours;
