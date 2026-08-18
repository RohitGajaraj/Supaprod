/**
 * THE SPEC, AS IT READS. The document half of /plan/spec/$id, lifted out of the
 * route because a renderer is not a page and the route was carrying 60 lines of
 * type scale inline.
 *
 * ============================================================================
 * WHY THIS FILE EXISTS AT ALL: THE CITATIONS WERE NEVER RENDERED.
 * ============================================================================
 *
 * The spec body printed `[1]`, `[2]`, `[3]` as LITERAL CHARACTERS. The route
 * overrode p / h1 / h2 / h3 / ul / ol / li / strong / code and nothing anywhere
 * handled a citation marker, so an agent-authored spec whose whole claim is that
 * its assertions carry evidence rendered that evidence as punctuation. Meanwhile
 * `splitCitationMarkers()` sat in src/components/plan/format.ts, written and
 * unit-tested, with ZERO consumers, and a chip with a hover excerpt sat in
 * src/components/obsidian/citation.tsx, unreachable from anywhere.
 *
 * THE OBSIDIAN CHIP IS DELIBERATELY NOT IMPORTED, and this is the one place that
 * decision is recorded. It is drawn in the RETIRED token system (`--link`,
 * `--raised`, `--hairline-strong`, `--font-mono`, `--radius-panel`,
 * `--shadow-overlay`) and its popover carries `backdropFilter: blur(20px)`,
 * which is the glass this surface's own docblock records banning: "The retired
 * action bar was sticky and blurred, which is the glass ban." Importing it would
 * have put a blurred pane in a second colour vocabulary inside the one region on
 * this page that is the document. So the INTERACTION is borrowed from it exactly
 * (a real `<button>`, a popover on hover AND focus through `group-focus-within`
 * rather than a Radix HoverCard, which does not reliably open on keyboard focus)
 * and the SKIN is Meridian's. It was `--sp-*` until the port below; that file is
 * still another lane's to retire.
 *
 * ============================================================================
 * WHAT A MARKER IS ALLOWED TO CLAIM
 * ============================================================================
 *
 * A `[4]` on a spec whose `citations` array holds three entries is a marker with
 * nothing behind it, and agent-written prose produces those. It renders as plain
 * text with the reason on hover, never as a chip: a chip is a promise that
 * pressing it shows you the evidence, and an affordance is a promise. Nothing is
 * invented to fill the gap.
 *
 * A marker that DOES resolve carries a provenance dot, using the tokens ink.css
 * defines for exactly this and which had one consumer in the whole product. The
 * mapping is narrow on purpose:
 *   MINE       the source is a row in this workspace's own record: a signal
 *              somebody said, a meeting, a doc, a note. Ember, which in this
 *              shell marks the human and nothing else.
 *   BORROWED   a source kind this product has no route for and cannot show you.
 *              Neutral, and the weakest of the three, which is the honest read.
 * INFERRED is deliberately unreachable here. It would mean "an agent reasoned
 * this", and a citation is by definition pointing at something rather than
 * reasoning; the unsupported case is the unresolved marker above, which gets no
 * dot rather than a wrong one.
 *
 * ============================================================================
 * WHY `meridian/Prose` IS NOT THE CONTAINER HERE, HAVING READ IT
 * ============================================================================
 *
 * `Prose` is Meridian's agent-written-prose block and it carries a `markdown`
 * flag for exactly this shape: parsed elements rather than a raw string. It was
 * the obvious home for this document and it was checked against it rather than
 * assumed into it, and it loses on two counts that the ratchet law calls floor:
 *
 *   THE BODY WOULD SHRINK. `Prose` is `text-[13.5px]` on `leading-[1.6]`,
 *   fixed in the component with no way to say otherwise. This document is 14px
 *   on 1.55. A port may not make a surface worse to make itself tidier, and
 *   half a pixel off the body size of the longest read in the product is
 *   exactly that.
 *
 *   THE MEASURE WOULD GO. `markdown` drops the 68ch cap on purpose -- "inside
 *   Ask, the pane IS the measure" -- and here the ARTICLE is the measure.
 *   `PROSE_MEASURE` is exported and the Write textarea is bound to the same
 *   number, so dropping it would rewrap the whole document the moment a writer
 *   switched between Read and Write and lose the place they were looking at.
 *
 * `Prose` would also add `mt-[12px]` and 12px between every block on top of the
 * margins this ladder already sets. So the document keeps its own container and
 * the RETIRED TOKENS come off it instead, which is what the port was for. If
 * `Prose` ever takes a size and a measure, this is its first caller.
 *
 * ============================================================================
 * THE TYPE LADDER, AND WHY THE MEASURE IS TIGHTER THAN THE NORM
 * ============================================================================
 *
 * Set from the document research rather than from taste. The measure is 70
 * characters against the 80-95 usually recommended for continuous prose, because
 * this document is not read continuously: it is AUDITED, the eye returning to the
 * left margin at every claim to check what carries a citation and what does not.
 * A short line makes that return cheap. Title 1.55x body and H2 1.3x, both
 * computed off ONE body size so the ladder is a single decision, and a hairline
 * rule above every H2 so a reader scrolling fast can see where one section
 * stops.
 *
 * THAT ANCHOR USED TO BE `--sp-text-body`, a retired token, and it is now the
 * literal it resolved to. Meridian bridges no type scale and no weight scale at
 * all, so every step here is written as the number it already rendered at
 * rather than rounded onto a nearby Meridian stop. Same reasoning as
 * `meridian/Prose` and `meridian/MoreMenu`, which both say so in their own
 * headers: today's design is the floor.
 */
import { useId, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import type { Citation } from "@/components/product/CitationsCard";
import { firstProseOffset, splitCitationMarkers } from "@/components/plan/format";

/** Just the part of the hast node this file reads. react-markdown hands every
 *  component the source node; typing the whole tree here to reach one number
 *  would drag hast's types into a rendering file for no gain. */
type MdNode = { position?: { start?: { offset?: number } } };

/**
 * The measure. 68-72 is the band the research gives; 70 is the middle of it.
 * Exported because the writing state has to match it, or switching Write to Read
 * would reflow the whole document and lose the writer's place.
 */
export const PROSE_MEASURE = "70ch";

/** Body size is the anchor for every step, so the ladder is one decision. */
const BODY = "14px";
const H1 = `calc(${BODY} * 1.55)`;
const H2 = `calc(${BODY} * 1.3)`;
const H3 = `calc(${BODY} * 1.1)`;

/**
 * The rest of the retired scale, at the values it resolved to.
 *
 * `--sp-leading-body` 1.55, `--sp-leading-tight` 1.5, `--sp-leading-gate` 1.32,
 * `--sp-track-gate` -0.019em, `--sp-weight-strong` 600, `--sp-weight-medium`
 * 500. Colour and radius are NOT in this list, because ink.css already aliased
 * those to Meridian and they are written as `var(--mrd-*)` below, which is the
 * token that was actually painting.
 */
const LEAD_BODY = 1.55;
const LEAD_TIGHT = 1.5;
const LEAD_GATE = 1.32;
const TRACK_GATE = "-0.019em";
const W_STRONG = 600;
const W_MEDIUM = 500;

/** The retired space scale, at its own values. 4 / 8 / 12 / 16 / 20 / 32. */
const S1 = "4px";
const S2 = "8px";
const S3 = "12px";
const S4 = "16px";
const S5 = "20px";
const S8 = "32px";

type Provenance = "mine" | "borrowed";

/**
 * Which kinds this product can actually show you. `linkFor` in CitationsCard
 * routes exactly signal, doc and meeting; `note` has no route but is still a row
 * a person wrote in this workspace, so it is theirs. Anything else is a kind
 * this surface cannot open and must not claim.
 */
const OWN_RECORD = new Set(["signal", "doc", "meeting", "note"]);

/**
 * `--sp-eviq-mine` resolved through `--sp-gate`, which ink.css aliases to
 * `--mrd-you`: orchid, "a person is required", the one thing that token is
 * allowed to mean. A source out of this workspace's own record IS somebody's,
 * so the meaning survives the token swap intact. `--sp-eviq-borrowed` resolved
 * through `--sp-mute`, which is `--mrd-mute`.
 */
const PROVENANCE_HUE: Record<Provenance, string> = {
  mine: "var(--mrd-you)",
  borrowed: "var(--mrd-mute)",
};

/** The left rule's weight. `--sp-eviq-rule`, and ink.css calls it invariant. */
const EVIDENCE_RULE = "2px";

const PROVENANCE_MEANING: Record<Provenance, string> = {
  mine: "From this workspace's own record.",
  borrowed: "A source of a kind this product cannot open for you.",
};

function provenanceOf(kind: string): Provenance {
  return OWN_RECORD.has(kind) ? "mine" : "borrowed";
}

/**
 * One resolved marker: the number, and the source under it on hover and on
 * focus. A `<button>` because it is reachable by keyboard and announces itself;
 * it deliberately does NOT navigate, because the full reference list sits
 * directly under the document with the real links on it, and a chip that
 * teleported you out of a ten-minute read would be working against the one job
 * this surface has.
 */
function CitationChip({ n, source }: { n: number; source: Citation }) {
  const popoverId = useId();
  const prov = provenanceOf(source.source_kind);
  const title = source.title?.trim() || `Untitled ${source.source_kind}`;
  return (
    <span className="group" style={{ position: "relative", display: "inline-block" }}>
      {/* MERIDIAN'S DOOR PAINT, WHICH IS WHAT `.sp-block-more` WAS. The dotted
          underline going solid on hover, the ink step, the small radius: the
          retired quiet action and Meridian's `Door` are the same object, and
          `primitives.css` says so in as many words ("A DOOR IS THE SAME QUIET
          ACTION, INSIDE A RUNNING SENTENCE. It wears `.sp-block-more`").

          The classes are written out rather than the `Door` COMPONENT being
          imported, because `Door` fixes no size and this one has to: it is a
          superscript marker at 11.5px in the data face, sitting inside a
          sentence set at 14px, and a door that inherited the line would render
          the marker at body size. */}
      <button
        type="button"
        aria-describedby={popoverId}
        className="rounded-mrd-xs text-mrd-body underline decoration-mrd-line decoration-dotted underline-offset-[3px] transition-colors hover:text-mrd-ink hover:decoration-mrd-edge hover:decoration-solid"
        style={{
          fontFamily: "var(--mrd-mono)",
          fontSize: "11.5px",
          verticalAlign: "super",
          lineHeight: 1,
          padding: "0 1px",
          transitionDuration: "var(--mrd-d-press)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 4,
            height: 4,
            borderRadius: "50%",
            background: PROVENANCE_HUE[prov],
            marginRight: 3,
            verticalAlign: "middle",
          }}
        />
        [{n}]
      </button>
      <span
        id={popoverId}
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        style={{
          width: "min(20rem, 60vw)",
          background: "var(--mrd-float)",
          border: "1px solid var(--mrd-line)",
          borderRadius: "var(--mrd-r-card)",
          // The provenance runs the height of the excerpt as the 2px left rule
          // the evidence vocabulary specifies, rather than repeating the dot.
          borderLeft: `${EVIDENCE_RULE} solid ${PROVENANCE_HUE[prov]}`,
          boxShadow: "var(--mrd-shadow-float)",
          padding: `${S3} ${S4}`,
          transitionProperty: "opacity",
          transitionDuration: "var(--mrd-d-press)",
          transitionTimingFunction: "var(--mrd-ease)",
        }}
      >
        <span
          style={{
            display: "block",
            fontSize: "13px",
            fontWeight: W_STRONG,
            color: "var(--mrd-ink)",
          }}
        >
          {title}
        </span>
        {source.snippet ? (
          <span
            style={{
              display: "block",
              marginTop: S1,
              fontSize: "13px",
              lineHeight: LEAD_TIGHT,
              color: "var(--mrd-body)",
            }}
          >
            {source.snippet}
          </span>
        ) : null}
        <span
          style={{
            display: "block",
            marginTop: S2,
            fontSize: "12.5px",
            color: "var(--mrd-mute)",
          }}
        >
          {PROVENANCE_MEANING[prov]}
        </span>
      </span>
    </span>
  );
}

/**
 * A marker the spec's own citation list cannot answer for. Plain text, the
 * reason on hover, and no affordance at all: it is a defect in the document, and
 * dressing it as evidence would be the surface lying on the agent's behalf.
 */
function BrokenMarker({ n }: { n: number }) {
  return (
    <span
      title="This spec cites a source it does not carry. Nothing is behind this number."
      style={{
        fontFamily: "var(--mrd-mono)",
        fontSize: "11.5px",
        color: "var(--mrd-mute)",
      }}
    >
      [{n}]
    </span>
  );
}

/**
 * Walk whatever react-markdown handed us and replace `[n]` inside TEXT NODES
 * only. Anything already turned into an element (a link, a code span, emphasis)
 * is passed through untouched, which is what keeps a bracketed number inside a
 * code fence from becoming a chip.
 */
function withCitations(children: ReactNode, byIndex: Map<number, Citation>): ReactNode {
  if (typeof children === "string") {
    const segments = splitCitationMarkers(children);
    // The overwhelmingly common case: no markers at all, so no array is built
    // and the string is returned as itself.
    if (segments.length === 1 && segments[0].type === "text") return children;
    return segments.map((seg, i) =>
      seg.type === "text" ? (
        <span key={i}>{seg.value}</span>
      ) : byIndex.has(seg.index) ? (
        <CitationChip key={i} n={seg.index} source={byIndex.get(seg.index)!} />
      ) : (
        <BrokenMarker key={i} n={seg.index} />
      ),
    );
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => (
      <span key={i} style={{ display: "contents" }}>
        {withCitations(child, byIndex)}
      </span>
    ));
  }
  return children;
}

/**
 * The rendered spec.
 *
 * `lede` marks the first paragraph. The research is unusually specific about
 * this one: a famed operator on written argument spent a week of three on the
 * first paragraph of a brief, "the chance I would win the case... would go
 * through the roof". On a document read silently under a clock with nobody to
 * explain it, the opening sentence is the only text guaranteed to be read, so it
 * gets a step of size and the full ink rather than sitting at body weight in the
 * middle of a wall.
 */
export function SpecProse({
  body,
  citations,
}: {
  body: string;
  citations: Citation[] | null | undefined;
}) {
  const byIndex = new Map<number, Citation>();
  for (const c of citations ?? []) byIndex.set(c.n, c);

  /**
   * Where the lede is, rather than whether it has been drawn yet.
   *
   * The obvious implementation is a `let ledeDrawn = false` flipped by the first
   * paragraph the renderer reaches, and it is wrong in a way that only shows up
   * sometimes: React can render a subtree twice for one commit, and the second
   * pass would find the flag already set and style nothing. Markdown nodes carry
   * their source position, so the first paragraph is identified by WHERE IT IS,
   * which is the same answer on every pass. See `firstProseOffset`.
   */
  const ledeAt = firstProseOffset(body);

  const components = {
    h1: ({ children }: { children?: ReactNode }) => (
      <h1
        style={{
          fontSize: H1,
          fontWeight: W_STRONG,
          letterSpacing: TRACK_GATE,
          lineHeight: LEAD_GATE,
          color: "var(--mrd-ink)",
          margin: `0 0 ${S4}`,
        }}
      >
        {withCitations(children, byIndex)}
      </h1>
    ),
    // THE HAIRLINE ABOVE EVERY SECTION. A ten-minute read is skimmed before it
    // is read, and a rule is what tells a skimmer where one argument stops. It
    // is `--mrd-line-soft`, the system's rule between sections, so it says
    // exactly what it says everywhere else in the product.
    h2: ({ children }: { children?: ReactNode }) => (
      <h2
        style={{
          fontSize: H2,
          fontWeight: W_STRONG,
          lineHeight: LEAD_TIGHT,
          color: "var(--mrd-ink)",
          margin: `${S8} 0 ${S3}`,
          paddingTop: S4,
          borderTop: "1px solid var(--mrd-line-soft)",
        }}
      >
        {withCitations(children, byIndex)}
      </h2>
    ),
    h3: ({ children }: { children?: ReactNode }) => (
      <h3
        style={{
          fontSize: H3,
          fontWeight: W_MEDIUM,
          color: "var(--mrd-ink)",
          margin: `${S5} 0 ${S2}`,
        }}
      >
        {withCitations(children, byIndex)}
      </h3>
    ),
    p: ({ children, node }: { children?: ReactNode; node?: MdNode }) => {
      const lede = ledeAt !== null && node?.position?.start?.offset === ledeAt;
      return (
        <p
          style={
            lede
              ? {
                  margin: `0 0 ${S4}`,
                  fontSize: H3,
                  lineHeight: LEAD_BODY,
                  color: "var(--mrd-ink)",
                }
              : { margin: `0 0 ${S3}` }
          }
        >
          {withCitations(children, byIndex)}
        </p>
      );
    },
    ul: ({ children }: { children?: ReactNode }) => (
      <ul style={{ margin: `0 0 ${S3}`, paddingLeft: 20, listStyle: "disc" }}>{children}</ul>
    ),
    ol: ({ children }: { children?: ReactNode }) => (
      <ol style={{ margin: `0 0 ${S3}`, paddingLeft: 20, listStyle: "decimal" }}>{children}</ol>
    ),
    li: ({ children }: { children?: ReactNode }) => (
      <li style={{ margin: "0 0 5px" }}>{withCitations(children, byIndex)}</li>
    ),
    strong: ({ children }: { children?: ReactNode }) => (
      <strong style={{ color: "var(--mrd-ink)", fontWeight: W_STRONG }}>
        {withCitations(children, byIndex)}
      </strong>
    ),
    // A quoted customer sentence is the commonest thing an agent-drafted spec
    // block-quotes, so it carries the provenance rule rather than a decorative
    // bar: it is somebody's own words, out of this workspace's record.
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote
        style={{
          margin: `0 0 ${S3}`,
          paddingLeft: S3,
          borderLeft: `${EVIDENCE_RULE} solid ${PROVENANCE_HUE.mine}`,
          color: "var(--mrd-body)",
        }}
      >
        {children}
      </blockquote>
    ),
    code: ({ children }: { children?: ReactNode }) => (
      <code
        style={{
          fontFamily: "var(--mrd-mono)",
          fontSize: "12px",
          background: "var(--mrd-sink)",
          borderRadius: "var(--mrd-r-xs)",
          padding: "1px 5px",
        }}
      >
        {children}
      </code>
    ),
  };

  return (
    <article
      style={{
        maxWidth: PROSE_MEASURE,
        fontSize: BODY,
        lineHeight: LEAD_BODY,
        color: "var(--mrd-body)",
      }}
    >
      <ReactMarkdown components={components}>{body}</ReactMarkdown>
    </article>
  );
}
