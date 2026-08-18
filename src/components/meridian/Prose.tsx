import * as React from "react";

/**
 * AGENT-WRITTEN PROSE: release notes, a launch draft, a rationale.
 *
 * `CodeBlock` is for code and holds its whitespace. This is a document a person
 * reads, so it keeps the measure.
 *
 * ── `markdown` IS A FLAG, NOT A SECOND COMPONENT ────────────────────────
 * It is the SAME prose in a different container, and it is a flag precisely so
 * the size, the leading and the ink can never fork. A heading in an Ask answer
 * and a heading in a release note are the same heading.
 *
 * Pass it when the children are parsed Markdown elements rather than a raw
 * string. It drops three things and only three:
 *   the panel      a tint behind every answer in a thread is wallpaper, and the
 *                  one recessed surface on a surface belongs to the record
 *   `pre-wrap`     parsed blocks carry their own breaks, so keeping it doubles
 *                  every gap
 *   the measure    inside Ask, the pane IS the measure
 *
 * ── THE STOPS ARE THE RETIRED ONES, TO THE PIXEL ────────────────────────
 * 13.5px on 1.6, an 18px by 16px panel, 12px between blocks, 68ch. They are
 * written as explicit values rather than mapped onto the nearest Meridian stop
 * because the ratchet law makes today's design the floor: rounding 13.5 to 13
 * or 18 to 16 to make the port tidier would make the surface worse, which is
 * the one thing a port may not do. `--sp-radius-panel` already aliased
 * `--mrd-r-card`, so the radius is the only value that was Meridian all along.
 *
 * `space-y-[12px]` is `> * + *`, which is what the retired rule said: space
 * BETWEEN blocks, never a trailing margin that collides with whatever the
 * caller puts underneath.
 */
export function Prose({
  children,
  markdown = false,
}: {
  children: React.ReactNode;
  markdown?: boolean;
}) {
  return (
    <div
      data-mrd=""
      data-markdown={markdown ? "true" : undefined}
      className={[
        "mt-[12px] space-y-[12px] text-[13.5px] leading-[1.6] text-mrd-body",
        markdown
          ? ""
          : "max-w-[68ch] rounded-mrd-card bg-mrd-sink px-[18px] py-[16px] whitespace-pre-wrap",
      ].join(" ")}
    >
      {children}
    </div>
  );
}
