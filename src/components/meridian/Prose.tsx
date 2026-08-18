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
 *
 * ── THE ELEMENT RULES CAME WITH IT, AND THE FIRST DRAFT LEFT THEM BEHIND ─
 * This shipped as a CONTAINER only: size, leading, ink, panel. Every rule for
 * what is INSIDE it -- headings, bold, lists, inline code, code blocks, links,
 * quotes -- stayed in `primitives.css` under `.sp-prose`, and two agents
 * independently refused to adopt this component because of it.
 *
 * They were right, and the failure would have been silent and total. Tailwind's
 * preflight zeroes `ul { list-style: none; padding: 0 }` and `a {
 * text-decoration: inherit }`, so pointing `Answer.tsx` at a container with no
 * element rules does not degrade the markdown, it DELETES it: every bullet,
 * every heading step, every code chip and every link underline in every
 * assistant answer in Ask and in threads. That is the exact defect the founder
 * reported on 2026-07-30, when `###` printed literally and nothing on screen
 * said "this is the top of a section".
 *
 * So the rules are here now, as a component-local sheet on `--mrd-*`, following
 * the same precedent `CodeDiff` used rather than editing the shared retired
 * stylesheet. Hand-rolling them at each call site was the alternative and is
 * what this component exists to prevent: two copies of the product's prose
 * typography drift on the first heading anybody restyles.
 *
 * Two decisions carried over verbatim because both are founder rulings:
 *   NO LEFT RULE ON A QUOTE. A 2px bar down the edge with muted text beside it
 *       is the most recognisable machine-written blockquote there is. Quoted
 *       material sits on the same sunken ground the code block uses, which is
 *       already this file's idiom for "this came from somewhere else".
 *   EMPHASIS IS A STEP UP THE INK RAMP, never a colour: the prose sits on
 *       `--mrd-body` and the emphasised words on `--mrd-ink`, so it survives
 *       greyscale and spends none of the colour budget.
 *
 * `<hr>` keeps its rule, and that is not a contradiction of the 2026-08-18
 * ruling against hairlines. That ruling is about dividers the SYSTEM imposes
 * between sections. An `<hr>` is a divider the AUTHOR wrote, so it is content,
 * and rule 1 protects content.
 */
const PROSE_RULES = `
.mrd-prose > * + * { margin-top: 12px; }
.mrd-prose > :first-child { margin-top: 0; }

.mrd-prose h3 {
  color: var(--mrd-ink);
  font-weight: 600;
  font-size: 14px;
  line-height: 1.5;
  margin-top: 20px;
}
.mrd-prose h3[data-level="1"] { font-size: 19px; letter-spacing: -0.019em; line-height: 1.32; }
.mrd-prose h3[data-level="2"] { font-size: 14px; }
.mrd-prose h3[data-level="3"] { font-size: 13.5px; }

.mrd-prose strong, .mrd-prose b { color: var(--mrd-ink); font-weight: 600; }
.mrd-prose em, .mrd-prose i { font-style: italic; }

.mrd-prose ul, .mrd-prose ol { padding-left: 18px; margin-top: 8px; }
.mrd-prose ul { list-style: disc; }
.mrd-prose ol { list-style: decimal; }
.mrd-prose li { margin-top: 4px; }
.mrd-prose li::marker { color: var(--mrd-mute); }
.mrd-prose li > ul, .mrd-prose li > ol { margin-top: 4px; }

.mrd-prose code {
  font-family: var(--mrd-mono);
  font-size: 12px;
  color: var(--mrd-ink);
  background: color-mix(in oklab, var(--mrd-ink) 8%, transparent);
  border-radius: var(--mrd-r-xs);
  padding: 1px 5px;
  overflow-wrap: anywhere;
}
.mrd-prose pre {
  background: var(--mrd-sink);
  border-radius: var(--mrd-r-card);
  padding: 12px;
  overflow-x: auto;
  margin-top: 12px;
}
.mrd-prose pre code { background: none; padding: 0; border-radius: 0; overflow-wrap: normal; white-space: pre; }

.mrd-prose a {
  color: var(--mrd-ink);
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-color: var(--mrd-mute);
  overflow-wrap: anywhere;
}
.mrd-prose a:hover { text-decoration-color: var(--mrd-ink); }

.mrd-prose blockquote {
  background: var(--mrd-sink);
  border-radius: var(--mrd-r-card);
  padding: 12px;
  color: var(--mrd-mute);
}
.mrd-prose hr { border: 0; border-top: 1px solid var(--mrd-line-soft); margin-top: 16px; }
`;
export function Prose({
  children,
  markdown = false,
}: {
  children: React.ReactNode;
  markdown?: boolean;
}) {
  return (
    <>
      {/* `href` + `precedence` lets React hoist and de-duplicate this, so N
          Prose blocks on one page emit one sheet rather than N. */}
      <style href="mrd-prose" precedence="medium">
        {PROSE_RULES}
      </style>
      <div
        data-mrd=""
        data-markdown={markdown ? "true" : undefined}
        className={[
          "mrd-prose text-[13.5px] leading-[1.6] text-mrd-body",
          /* The markdown container drops the panel, the measure, the pre-wrap AND
           the outer margin, exactly as `.sp-prose[data-markdown]` did: inside
           Ask the pane IS the measure, and the turn above already spaced it. */
          markdown
            ? "mt-0"
            : "mt-[12px] max-w-[68ch] rounded-mrd-card bg-mrd-sink px-[18px] py-[16px] whitespace-pre-wrap",
        ].join(" ")}
      >
        {children}
      </div>
    </>
  );
}
