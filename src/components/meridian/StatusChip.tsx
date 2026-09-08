/*
 * STATUS, AS A CHIP, BECAUSE COLOURED TEXT CANNOT CARRY IT ON PAPER.
 *
 * ── WHY THIS EXISTS, AND IT IS A MEASUREMENT RATHER THAN A TASTE ─────────
 * meridian.css carries the full argument and the numbers. The short form: on the
 * dark ground the five status words land between 5.81 and 10.08 against `bg`, so
 * they separate and read as colour. On paper they collapse into 5.06 to 6.00.
 * Every one clears 4.5, so this was never a legibility failure. It is a SALIENCE
 * failure, and it cannot be fixed with better values: holding 5.0 against paper
 * pins these hues near lightness 0.50, where the sRGB gamut will not give them
 * chroma, and amber resolves to brown. Colour has to occupy AREA instead of
 * glyphs.
 *
 * ── WHY THE GEOMETRY IS NOT A CHOICE EITHER ─────────────────────────────
 * This is `TaskRows`' status pill, to the pixel: `h-[22px] rounded-full px-2`
 * with an 11.5px label. That component is the port of beautifului.dev's "Task
 * Rows", whose entire subject is live agent status, so its pill IS the
 * reference's status chip and the job here is to mimic it rather than to
 * reinterpret it. What changes is only what fills it: a 16% tint of the status
 * hue under text of the same hue becomes the measured chip pair, because the
 * tint-plus-coloured-text form is exactly the one that dies on paper.
 *
 * `RecordTag` is the other chip in the system and is deliberately NOT this one:
 * 20px tall, `rounded-mrd-xs`, colourless. That is the reference's TAG, which is
 * categorical. A pill is round and carries status; a tag is square and carries a
 * category. Two shapes, two meanings, and the reference already made that split.
 *
 * ── IT SURVIVES GREYSCALE BECAUSE THE WORD IS IN IT ──────────────────────
 * The chip is not a coloured dot with the meaning in the hue. It contains the
 * word. Remove all colour and every chip still says what it says, which is the
 * only form of the greyscale rule that actually holds: structure carries the
 * meaning, hue confirms it.
 */

/** The five, and only the five. A sixth status is refused in meridian.css. */
/*
 * `quiet` (Lane 1, 2026-09-08, on Lane 2's measurement): a wait the machine
 * has in hand, a release live in production with its verdict due on a date.
 * Not an exception, so it carries NO status hue: mute ink on the sink fill.
 * Amber stays for stopped-on-a-condition-that-must-change. The five status
 * words are still five; this is the absence of one, drawn as a chip so it
 * sits in a row of chips without becoming invisible.
 */
export type StatusWord = "you" | "agent" | "pass" | "fail" | "hold" | "quiet";

/**
 * Chip and label are one pair per status, never mixed.
 *
 * Written as a lookup of literal class strings rather than built by
 * interpolation, because Tailwind scans source text: `bg-mrd-${word}-chip`
 * generates nothing at all and fails silently, which is the defect
 * `every-meridian-utility-paints.test.ts` exists to catch.
 */
const FACE: Record<StatusWord, string> = {
  you: "bg-mrd-you-chip text-mrd-you-on-chip",
  agent: "bg-mrd-agent-chip text-mrd-agent-on-chip",
  pass: "bg-mrd-pass-chip text-mrd-pass-on-chip",
  fail: "bg-mrd-fail-chip text-mrd-fail-on-chip",
  hold: "bg-mrd-hold-chip text-mrd-hold-on-chip",
  quiet: "bg-mrd-sink text-mrd-mute",
};

/**
 * The default word for each status, so two surfaces cannot describe one state
 * differently.
 *
 * These are the product's own vocabulary rather than adjectives: "waiting on
 * you" is what `--mrd-you` means in one phrase, and "on hold" is the amber the
 * file admits for "stopped, and NOT on you". A caller may override, and should
 * only do so to be MORE specific about the same state, never to rename it.
 */
export const STATUS_WORD: Record<StatusWord, string> = {
  you: "Waiting on you",
  agent: "Running",
  pass: "Passed",
  fail: "Failed",
  hold: "On hold",
  quiet: "Scheduled",
};

export function StatusChip({
  status,
  pulse = false,
  children,
  className = "",
}: {
  status: StatusWord;
  /**
   * BREATHES, for a state that is genuinely still moving. Only `agent` and `you`
   * should ever ask: a machine working and a person being waited on are ongoing,
   * and an outcome has already happened so it has nothing left to wait for.
   *
   * `mrd-attention` rather than `mrd-pixel-on`, and the cadence is `marks.tsx`'s:
   * that file measured the same choice and its argument carries here, because a
   * chip carries a WORD and `pixel-on` troughs at 0.15, so half of every cycle
   * the word would be gone. `attention` inverts the envelope: full at rest, a
   * shallow dip, legible throughout.
   *
   * Declared INLINE and not as a class, because meridian.css's reduced-motion
   * block matches on the style attribute. An animation in a utility keeps
   * breathing for somebody who asked it not to, which is a defect this repo has
   * paid for in six files.
   */
  pulse?: boolean;
  /** Overrides the default word. Be more specific, never different. */
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      data-mrd=""
      data-status={status}
      className={`inline-flex h-[22px] shrink-0 items-center rounded-full px-2 text-mrd-data font-medium whitespace-nowrap ${FACE[status]} ${className}`}
      style={
        pulse
          ? {
              animation:
                status === "agent"
                  ? /* A machine working is ambient, so it breathes slower than a
                       thing asking for a person. Both cadences are the ones
                       `marks.tsx` already uses, held still so the beat a reader
                       knows does not move under them. */
                    "mrd-attention 2400ms var(--mrd-ease-soft) infinite"
                  : "mrd-attention 1600ms var(--mrd-ease-soft) infinite",
            }
          : undefined
      }
    >
      {children ?? STATUS_WORD[status]}
    </span>
  );
}

export default StatusChip;
