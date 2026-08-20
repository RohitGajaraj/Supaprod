/**
 * The lineage pane: where a thing came from, and what it caused.
 *
 * WHY IT LOOKS COMPLETELY DIFFERENT NOW. This shipped on 2026-07-13 and was
 * never mounted. `grep '<AuditLineageSheet'` returned nothing, in any file, for
 * seventeen days, which means `openLineage()` has been firing a window event
 * with no listener the entire time and `BetCard`'s audit tag has been a control
 * that does nothing when pressed. A previous session found that and recorded it
 * rather than fixing it.
 *
 * It could not simply be mounted, either. It was built in the Loom v4 system
 * the rebuild replaced: `loom-press`, the shadcn `Sheet`, Geist Pixel (retired
 * by founder ruling), and twelve legacy tokens (`--text-body`, `--hairline`,
 * `--raised`, `--ember`, `--madder`). Mounting it as it stood would have
 * dragged the old design into the new shell, which is the one thing the founder
 * has said must never happen again.
 *
 * TWO THINGS THE PORT CHANGED ON PURPOSE, beyond tokens:
 *
 * 1. NO EMBER. The original painted the ref and every timeline dot ember.
 *    Ember means "waiting on you" and nothing else in this system, and a
 *    lineage trail is not waiting on you: it is the record, already settled.
 *    The trail reads in ink and rule, which is what the record deserves.
 *
 * 2. THE PANE, NOT A MODAL SHEET. Same geometry as Ask, because it is the same
 *    kind of thing: a column you consult beside the work rather than a dialog
 *    that takes the screen. A person tracing provenance is comparing it against
 *    what they were already looking at, and a modal makes that impossible.
 *
 * WHAT IT STILL CANNOT DO, and it is the interesting half. `getEntityLineage`
 * follows FOREIGN-KEY COLUMNS on the entity's own row, so it walks one hop
 * outward and cannot answer "what did this cause". The bidirectional walk over
 * `artifact_lineage` lives in `lib/lineage-graph.ts` and a parallel lane is
 * building its server layer. This pane renders what resolves today and gains
 * the forward chain when that lands; it does not pretend to have it now.
 */

import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

import { OPEN_MODAL_SELECTOR } from "@/lib/overlay";
import { getEntityLineage } from "@/lib/audit-lineage.functions";
import { getLineageGraph, type LineageNodeView } from "@/lib/lineage-graph.functions";
import type { LineageStep } from "@/lib/lineage-graph";
import { getMissionChain } from "@/lib/trust-chain.functions";
import { MissionChain } from "@/components/trust/MissionChain";
import { NothingHere, Num, ReadFailed, Reading } from "@/components/meridian/surface-parts";
import { stripAutoPrefix } from "@/components/plan/format";
import { artifactWord, relationWord } from "@/lib/artifact-words";

export const OPEN_LINEAGE_EVENT = "supaprod:open-lineage";

/* ------------------------------------------------------------------ *
 * The paint, on Meridian
 *
 * WHERE THE 28 CLASS NAMES WENT. This pane's rules lived in
 * `src/styles/shell.css` under a `sp-` vocabulary Cadence/ink retired. They
 * already PAINTED in Meridian tokens, so nothing on screen was wrong; that is
 * exactly why the naming layer was worth moving. A second vocabulary that
 * renders identically to the first is where the next divergence comes from.
 *
 * ONE CLASS SURVIVES AND IT IS LOAD BEARING. `AskPane.tsx` lists the literal
 * selector `".sp-lineage"` in its `KEEPS_IT_OPEN` pointerdown list, because this
 * pane is summoned FROM Ask and covers it. Drop the class off the root and every
 * press inside this pane dismisses the conversation that asked for the trace.
 * `AskPane.test.tsx` builds its own synthetic `<div class="sp-lineage">` fixture,
 * so it stays green whatever this file renders: nothing would catch it. The
 * root's geometry rule stays in `shell.css` with it, because `--sp-header-h`,
 * `--sp-pane-ask-w` and `--sp-pane-inset` are a layout contract this pane SHARES
 * with Ask, and a copy of a shared number is two numbers for one fact.
 *
 * THE TRAP THAT DECIDED HALF OF THESE STRINGS, verified against the compiler
 * rather than reasoned about. `text-mrd-body` is BOTH a colour and the 14px type
 * stop: `--color-mrd-body` in `@theme inline` and an `@utility` of the same name,
 * emitted as one rule carrying `font-size` AND `color`. So `text-mrd-base
 * text-mrd-body` on one element renders at 14px, not 13px, because Tailwind
 * emits `.text-mrd-base` first. The answer here is inheritance: each timeline row
 * carries the body ink and its children state only their own size, so no element
 * ever wears both names at once.
 * ------------------------------------------------------------------ */

/**
 * THE MACHINE VOICE: mono, uppercase, at the data stop.
 *
 * DELIBERATELY NOT `Eyebrow`, which is Meridian's micro-label and the obvious
 * reach. Eyebrow is 10px sans at weight 650 and its own docblock calls itself
 * "the ONE place mono is not used" for a label. Adopting it here would take
 * 11.5px down to 10px, and shrinking type is forbidden as a port answer; it
 * would also drop the mono face that marks these lines as the record speaking
 * rather than a person. The face was decided when this pane came off Loom v4.
 * The port moves the vocabulary, not the design.
 */
const MACHINE_LABEL = "font-mrd-mono text-mrd-data tracking-mrd-label text-mrd-mute uppercase";

/** A timeline dot. It carries no rule of its own: the line down to the next row
 *  belongs to the row (`TIMELINE_ROW`), so the last row draws nothing into
 *  nothing. Each caller adds its own top margin, which is 6px on the trail and
 *  5px on the chain and was never one number. */
const MARK = "size-[7px] flex-none rounded-full bg-mrd-line";

/** Back and Close. Quiet by default and NOT Meridian's `Action`, which is a 32px
 *  control on a 9px radius: dropping two of those into a baseline-aligned pane
 *  header would grow it by half again and change a geometry this pane shares
 *  with Ask deliberately. */
const HEAD_BTN =
  "rounded-mrd-xs px-mrd-2 py-mrd-1 text-mrd-label text-mrd-mute hover:bg-mrd-hover hover:text-mrd-ink";

/** The chain, read as ONE column. `m-0 p-0 list-none` is stated rather than left
 *  to preflight because `src/styles.css` is 3,700 lines of unlayered legacy
 *  selectors and unlayered CSS beats `@layer base` whatever it says. */
const CHAIN = "m-0 mt-mrd-4 list-none p-0";

/** Never a silent stop: a chain that merely hit a depth cap must not read as a
 *  chain that ended. */
const MORE = "m-0 mt-mrd-4 text-mrd-label text-mrd-mute";

/** One row of a timeline: the dot, the rule down to the next row, and the body
 *  ink every child inherits rather than naming. See the `text-mrd-body` trap. */
const TIMELINE_ROW =
  "relative flex gap-[12px] text-mrd-body before:absolute before:left-[3px] before:w-px before:bg-mrd-line-soft last:pb-0 last:before:hidden";

/**
 * A connected id is a door, so it looks like one.
 *
 * `fontSize` is inline and that is the point rather than a shortcut. The chip
 * needs the 11.5px data stop AND the body ink, and `text-mrd-body` carries a
 * font-size of its own, so any pairing of the two utilities resolves by
 * emission order. An inline declaration beats the utilities layer outright, so
 * this is 11.5px whatever Tailwind decides to emit first.
 */
function TraceRef({ id, onFollow }: { id: string; onFollow: (next: string) => void }) {
  return (
    <button
      type="button"
      className="rounded-mrd-xs border border-mrd-line px-mrd-3 py-px tracking-mrd-label text-mrd-body transition-[color,border-color] duration-[var(--mrd-d-press)] ease-[var(--mrd-ease)] hover:border-mrd-ink hover:text-mrd-ink"
      style={{ fontSize: "var(--mrd-t-data)" }}
      onClick={() => onFollow(id)}
      title={`Trace ${id}`}
    >
      <Num>{id}</Num>
    </button>
  );
}

/** Open the lineage pane for an audit id from anywhere. */
export function openLineage(ref: string) {
  window.dispatchEvent(new CustomEvent(OPEN_LINEAGE_EVENT, { detail: { ref } }));
}

function fmt(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

/**
 * One node in the chain, in the record's own words.
 *
 * `resolved` is a separate fact from `title` and the distinction is the whole
 * honesty of this row. `deployments` has no title-like column, so a perfectly
 * readable deployment yields `title: null`. Without `resolved` that is
 * indistinguishable from "a kind we cannot name" and from "RLS hid it": three
 * different facts collapsing into one blank. Each gets its own sentence.
 */
/** Find a walked node's resolved view. */
function nodeOf(
  graph: { nodes: LineageNodeView[] },
  ref: { kind: string; id: string },
): LineageNodeView | null {
  return graph.nodes.find((n) => n.kind === ref.kind && n.id === ref.id) ?? null;
}

type ChainEntry = { node: LineageNodeView; relation: string | null; focus: boolean };

/**
 * The two walks, flattened into ONE story: origin at the top, time running down
 * through the focus.
 *
 * DE-DUPLICATED, and that is not tidiness. This graph has cycles by design (a
 * learning re-opens the decision that produced it, which is the loop closing
 * and the most valuable edge in the product), so the same node is legitimately
 * reachable in both directions. Rendering both hits shows a person the same
 * spec twice in one column and reads as a bug. Upstream wins the tie, because
 * a thing's origin is the more surprising fact about it.
 */
export function chainOf(graph: {
  focus: LineageNodeView;
  upstream: LineageStep[];
  downstream: LineageStep[];
  nodes: LineageNodeView[];
}): ChainEntry[] {
  const seen = new Set<string>([`${graph.focus.kind}:${graph.focus.id}`]);
  const take = (ref: { kind: string; id: string }, relation: string | null): ChainEntry | null => {
    const key = `${ref.kind}:${ref.id}`;
    if (seen.has(key)) return null;
    const node = nodeOf(graph, ref);
    if (!node) return null;
    seen.add(key);
    return { node, relation, focus: false };
  };

  // Furthest ancestor first: the walk reports nearest-first, and reading a
  // cause after its effect is backwards.
  const up = [...graph.upstream]
    .sort((a, b) => b.distance - a.distance)
    .map((step) => take(step.from, step.relation))
    .filter((e): e is ChainEntry => e !== null);

  const down = [...graph.downstream]
    .sort((a, b) => a.distance - b.distance)
    .map((step) => take(step.to, step.relation))
    .filter((e): e is ChainEntry => e !== null);

  if (up.length === 0 && down.length === 0) return [];
  return [...up, { node: graph.focus, relation: null, focus: true }, ...down];
}

function ChainNode({
  node,
  relation,
  onFollow,
}: {
  node: LineageNodeView;
  relation: string | null;
  onFollow: (ref: string) => void;
}) {
  const word = artifactWord(node.kind);
  const label = node.title
    ? stripAutoPrefix(node.title)
    : node.resolved
      ? `A ${word} with no title on the record`
      : `A ${word} we could not read`;
  return (
    <li className={`${TIMELINE_ROW} pb-[14px] before:top-[14px] before:bottom-0`}>
      <span className={`mt-[5px] ${MARK}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className={MACHINE_LABEL}>
          {word}
          {relation ? <span className="text-mrd-faint"> · {relationWord(relation)}</span> : null}
        </div>
        {/* A node we could not read is dimmed, never hidden. A missing node
            silently shortens the chain and nobody can tell; a dim one says so. */}
        <div
          className={`mt-mrd-1 text-mrd-base leading-[1.35] ${node.resolved ? "" : "text-mrd-mute italic"}`}
        >
          {label}
        </div>
        <div className="mt-mrd-2 flex flex-wrap items-center gap-[8px] text-mrd-label text-mrd-mute">
          {node.status ? <span>{node.status}</span> : null}
          {node.ref ? <TraceRef id={node.ref} onFollow={onFollow} /> : null}
        </div>
      </div>
    </li>
  );
}

export function AuditLineageSheet() {
  const [ref, setRef] = useState<string | null>(null);
  /** Where the walk started, so a person can get back after following links. */
  const [trail, setTrail] = useState<string[]>([]);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const r = (e as CustomEvent<{ ref?: string }>).detail?.ref;
      if (r) {
        setRef(r);
        setTrail([]);
      }
    };
    window.addEventListener(OPEN_LINEAGE_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_LINEAGE_EVENT, onOpen);
  }, []);

  /**
   * ESCAPE CLOSES THE TRAIL, AND NOTHING BEHIND IT.
   *
   * THE DEFECT THIS PREVENTS, and it cost a person their place in the engine
   * room. Standing in a room with Ask open and a trail traced, ONE Escape ran
   * all three handlers in a single dispatch: this one closed the trail, AskPane's
   * closed the pane, and the room's (`_authenticated.engine-room.tsx`) navigated
   * back out of the room. The person meant to close one thing and lost three,
   * including the room they were reading. All three listened on `window` in the
   * BUBBLE phase, so which ran first was decided by the order their effects
   * happened to mount, and the room's mounts first because the room is already on
   * screen before anyone traces anything. The room's own `e.defaultPrevented`
   * check could not rescue it: this handler does call preventDefault, but it ran
   * last, after the damage.
   *
   * NOTHING CAUGHT IT because each handler is correct read on its own, and the
   * three live in three files that never import each other. A type cannot see a
   * listener ordering, and no test had ever pressed one key with two layers open.
   *
   * THE FIX IS A LADDER BUILT OUT OF THE PROPAGATION PATH, so the order is a
   * property of the DOM instead of a property of mount order:
   *
   *   window capture    this pane (z-index 62, the topmost surface in the shell)
   *   document capture  MoreMenu, a popover that opens inside Ask (primitives.tsx)
   *   document bubble   AskPane (z-index 60)
   *   window bubble     the engine room, the page underneath all of it
   *
   * Every rung but the last calls stopPropagation, so exactly one layer hears
   * one press no matter what mounted when; the room is last and has nothing left
   * to stop. MoreMenu already worked this way and is the model for all of it.
   *
   * NO FIELD GUARD, deliberately. The bare-key house pattern stands a shortcut
   * down whenever focus is in a field because a letter typed into a textarea is
   * text; Escape is a dismissal in every surface a person has ever used, and this
   * pane is read with focus anywhere on the page.
   */
  useEffect(() => {
    if (ref === null) return;
    const onKey = (e: KeyboardEvent) => {
      /**
       * TWO GUARDS THIS HANDLER SHIPPED WITHOUT, and each one made Escape close
       * more than the person asked for.
       *
       * `defaultPrevented`: without it, a layer that has already claimed the
       * press is ignored and this closes as well. The shortcut sheet does claim
       * it, on window capture, so one Escape shut the sheet AND wiped the trail
       * underneath it -- the exact "one press, three layers" defect this file's
       * own header says it exists to end, reintroduced one rung down.
       *
       * `OPEN_MODAL_SELECTOR`: a window CAPTURE listener always outranks Radix,
       * whose dismissable layer listens on `document`. So with a real dialog
       * open over this pane, Escape reached here first, stopped propagation and
       * cleared the trail while the dialog stayed on screen. Standing down under
       * a modal is what gives Radix back its own key. Same selector the chord
       * and the shortcut sheet use, imported rather than copied: this repo has
       * already paid twice for a guard that existed in two ages.
       */
      if (e.key !== "Escape" || e.defaultPrevented) return;
      if (document.querySelector(OPEN_MODAL_SELECTOR)) return;
      e.preventDefault();
      e.stopPropagation();
      setRef(null);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [ref]);

  const fLineage = useServerFn(getEntityLineage);
  const q = useQuery({
    queryKey: ["audit-lineage", ref],
    queryFn: () => fLineage({ data: { ref: ref as string } }),
    enabled: ref !== null,
  });
  const d = q.data;

  // A mission's real lineage IS its trust chain (signal to outcome), so when
  // the resolved entity is a mission that nine-link chain renders beneath the
  // generic walk rather than duplicating it.
  /* THE FORWARD HALF, which is the reason any of this was built.
   *
   * `getEntityLineage` above follows FK columns on the entity's own row: one
   * hop, outward only. It can say what a thing points AT and never what it
   * CAUSED. The founder asked for both directions explicitly: "it has come
   * from this design spec, from this PRD, and this originated from this
   * signal. And past that, what has happened after this build."
   *
   * `getLineageGraph` walks `artifact_lineage` both ways. Its own module
   * documents why it refuses to validate kinds: the forward half of a real
   * chain is `changeset` and `deployment`, which appear in NEITHER kind
   * vocabulary, so a validating walk answers "this caused nothing" about a
   * mission that shipped. */
  const fGraph = useServerFn(getLineageGraph);
  const graphQ = useQuery({
    queryKey: ["lineage-graph", d?.kind ?? null, d?.entityId ?? null],
    /* DEPTH 3, and this is a rendering decision the live data forced.
     *
     * At the default depth 6 the founder's own chain came back with 24 nodes,
     * duplicated, and a CHANGESET presented as the mission's ancestor. Both
     * are the loop: walking up from the mission eventually re-enters the
     * forward half through `learning -> decision`, so "where did this come
     * from" wraps around into "what it caused". The data is right and the
     * story is nonsense.
     *
     * Three hops is what the founder actually described: "it came from this
     * design spec, from this PRD, and this originated from this signal", and
     * "what happened after this build". That is the causal neighbourhood, and
     * it is shallow enough that the loop cannot close inside it. The walk
     * still reports `truncated`, so the pane says the chain continues rather
     * than implying it ends. */
    queryFn: () =>
      fGraph({ data: { kind: d?.kind as string, id: d?.entityId as string, maxDepth: 3 } }),
    enabled: Boolean(d?.found && d?.kind && d?.entityId),
  });

  const fChain = useServerFn(getMissionChain);
  const chainQ = useQuery({
    queryKey: ["audit-lineage-chain", d?.entityId ?? null],
    queryFn: () => fChain({ data: { missionId: d?.entityId as string } }),
    enabled: Boolean(d?.found && d?.kind === "mission" && d?.entityId),
  });

  if (ref === null) return null;

  /** Follow a connected entity, remembering where we came from. */
  const follow = (next: string) => {
    setTrail((t) => [...t, ref]);
    setRef(next);
  };
  const back = () => {
    setTrail((t) => {
      const prev = t[t.length - 1];
      if (prev) setRef(prev);
      return t.slice(0, -1);
    });
  };

  return (
    /* `sp-lineage` is a HOOK, not paint: AskPane reads that exact selector to
       decide a press in here must not dismiss it. See the note at the top of
       this file. `data-mrd` is what gives every control below Meridian's focus
       ring; without it they take the legacy one, because the unlayered
       `[data-obsidian] :focus-visible` rule beats every layer. */
    <aside className="sp-lineage" data-mrd="" role="complementary" aria-label="Lineage">
      <header className="flex flex-none items-baseline gap-mrd-4 border-b border-mrd-line-soft px-mrd-5 py-[14px]">
        {/* The id is mono because it is an identifier, and identifiers are read
            character by character. It is NOT Geist Pixel: that face was retired,
            and it was doing brand work in a slot that needs legibility. */}
        <span className="text-mrd-data tracking-mrd-label text-mrd-ink">
          <Num>{(d?.ref ?? ref).replace("·", " · ")}</Num>
        </span>
        {d?.found || d?.ambiguous ? (
          <span className="text-mrd-label text-mrd-mute">
            {d.label} · {d.stage}
          </span>
        ) : null}
        <span className="flex-1" />
        {trail.length > 0 ? (
          <button type="button" className={HEAD_BTN} onClick={back}>
            Back
          </button>
        ) : null}
        <button type="button" className={HEAD_BTN} onClick={() => setRef(null)}>
          Close
        </button>
      </header>

      <div className="flex-1 overflow-auto p-mrd-5">
        {q.isLoading ? (
          <Reading>Tracing the record.</Reading>
        ) : q.isError ? (
          <ReadFailed onRetry={() => void q.refetch()}>
            Could not trace this id. {(q.error as Error)?.message}
          </ReadFailed>
        ) : d?.ambiguous ? (
          /* SIX CHARACTERS ARE NOT ENOUGH TO NAME ONE ROW, and until now this
           * branch did not exist, so the pane fell through to "no record for
           * this tag" while SIX rows matched it. That copy was not merely
           * unhelpful, it was false, and it sent a person to check an id that
           * was correct.
           *
           * Worse, before the resolver was fixed the pane did not even get
           * here: it silently rendered whichever colliding row came back
           * first, with a real title and a real chain, and nothing on screen
           * said it had chosen. I verified this pane earlier in the session
           * against MIS·600000 and reported it resolved to "Ship the checkout
           * and notification pass". That tag matches THREE missions. My
           * verification was true about the rendering and wrong about the
           * resolution.
           *
           * Choosing re-enters on the uuid, never on the tag, because the uuid
           * path is exact and the tag path is what collided. */
          <>
            <p className="mt-0 mb-[14px] text-mrd-body leading-[1.5]">
              This tag matches <strong>{d.candidateCount}</strong> records. Six characters are not
              enough to name one, so nothing has been chosen.
            </p>
            <ol className={CHAIN}>
              {d.candidates.map((c) => (
                <li
                  className={`${TIMELINE_ROW} pb-[14px] before:top-[14px] before:bottom-0`}
                  key={c.entityId}
                >
                  <span className={`mt-[5px] ${MARK}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <button
                      type="button"
                      className="block p-0 text-left text-mrd-base leading-[1.35] hover:text-mrd-ink hover:underline"
                      onClick={() => follow(c.entityId)}
                    >
                      {c.title ? stripAutoPrefix(c.title) : "Untitled"}
                    </button>
                    <div className="mt-mrd-2 flex flex-wrap items-center gap-[8px] text-mrd-label text-mrd-mute">
                      {c.status ? <span>{c.status}</span> : null}
                      {c.createdAt ? <span>{fmt(c.createdAt)}</span> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            {d.candidateCount > d.candidates.length ? (
              <p className={MORE}>
                Showing the first {d.candidates.length} of {d.candidateCount}.
              </p>
            ) : null}
          </>
        ) : !d || !d.found ? (
          <NothingHere>
            No record for {d?.ref ?? ref} in this workspace. Audit ids are scoped to your
            workspaces, so an id from somewhere else, or a mistyped one, shows nothing.
          </NothingHere>
        ) : (
          <>
            <h3 className="mt-0 mb-mrd-2 text-mrd-base leading-[1.35] font-medium text-mrd-ink">
              {stripAutoPrefix(d.title)}
            </h3>
            <div className="mb-[18px] text-mrd-label text-mrd-mute">
              {d.status ? <span>{d.status}</span> : null}
              {d.status && d.createdAt ? <span aria-hidden="true"> · </span> : null}
              {d.createdAt ? <span>recorded {fmt(d.createdAt)}</span> : null}
            </div>

            {/* The walk. Every connected entity is itself a tag you can follow,
              which is the whole point: the record is a graph, not a row. */}
            <ol className="m-0 list-none p-0">
              {d.steps.map((s, i) => (
                <li
                  className={`${TIMELINE_ROW} pb-mrd-5 before:top-[15px] before:bottom-[2px]`}
                  key={`${s.label}-${i}`}
                >
                  <span className={`mt-mrd-3 ${MARK}`} aria-hidden="true" />
                  <div className="min-w-0 flex-1">
                    <div className={MACHINE_LABEL}>
                      {s.label}
                      {s.at ? <span className="text-mrd-faint"> · {fmt(s.at)}</span> : null}
                    </div>
                    <div className="mt-[3px] flex flex-wrap items-center gap-[8px] text-mrd-base">
                      <span>{stripAutoPrefix(s.detail)}</span>
                      {s.ref ? <TraceRef id={s.ref} onFollow={follow} /> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>

            {/* THE CHAIN, read as one story rather than two lists.
              The founder described it in one breath: "it has come from this
              design spec, from this PRD, and this originated from this signal,
              and past that, what has happened after this build." So the origin
              is at the top and time runs downward THROUGH the focus, which is
              how a person narrates causation. Two headed lists would make the
              reader assemble that order themselves. */}
            {graphQ.data?.found && chainOf(graphQ.data).length > 0 ? (
              <div className="mt-mrd-6">
                <div className={MACHINE_LABEL}>The chain</div>
                <ol className={CHAIN}>
                  {chainOf(graphQ.data).map((entry) =>
                    entry.focus ? (
                      /* Where you are, marked by WEIGHT and size rather than
                         colour: the focus is a position in the story, not a
                         status, and colour in this system carries status. */
                      <li
                        className={`${TIMELINE_ROW} pb-[14px] before:top-[14px] before:bottom-0`}
                        key="focus"
                      >
                        <span
                          className="mt-[5px] -ml-px size-[9px] flex-none rounded-full bg-mrd-ink"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <div className={MACHINE_LABEL}>{entry.node.kind} · you are here</div>
                          <div className="mt-mrd-1 text-mrd-base leading-[1.35] font-medium text-mrd-ink">
                            {stripAutoPrefix(d.title)}
                          </div>
                        </div>
                      </li>
                    ) : (
                      <ChainNode
                        key={`${entry.node.kind}-${entry.node.id}`}
                        node={entry.node}
                        relation={entry.relation}
                        onFollow={follow}
                      />
                    ),
                  )}
                </ol>
                {graphQ.data.truncated ? (
                  <p className={MORE}>
                    The chain continues past this. Follow an id above to keep walking.
                  </p>
                ) : null}
              </div>
            ) : null}

            {d.kind === "mission" && chainQ.data ? (
              <div className="mt-mrd-6">
                <div className={MACHINE_LABEL}>Trust chain</div>
                <MissionChain chain={chainQ.data} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
