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
import { NothingHere, ReadFailed, Reading } from "@/components/meridian/surface-parts";
import { stripAutoPrefix } from "@/components/plan/format";
import { artifactWord, relationWord } from "@/lib/artifact-words";

export const OPEN_LINEAGE_EVENT = "supaprod:open-lineage";

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
    <li className="sp-chain-node" data-resolved={node.resolved ? "true" : "false"}>
      <span className="sp-chain-mark" aria-hidden="true" />
      <div className="sp-chain-body">
        <div className="sp-chain-kind">
          {word}
          {relation ? <span className="sp-chain-rel"> · {relationWord(relation)}</span> : null}
        </div>
        <div className="sp-chain-title">{label}</div>
        <div className="sp-chain-meta">
          {node.status ? <span>{node.status}</span> : null}
          {node.ref ? (
            <button
              type="button"
              className="sp-trail-ref"
              onClick={() => onFollow(node.ref as string)}
              title={`Trace ${node.ref}`}
            >
              {node.ref}
            </button>
          ) : null}
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
    <aside className="sp-lineage" role="complementary" aria-label="Lineage">
      <header className="sp-lineage-head">
        <span className="sp-lineage-ref">{(d?.ref ?? ref).replace("·", " · ")}</span>
        {d?.found || d?.ambiguous ? (
          <span className="sp-lineage-kind">
            {d.label} · {d.stage}
          </span>
        ) : null}
        <span className="sp-lineage-spacer" />
        {trail.length > 0 ? (
          <button type="button" className="sp-lineage-btn" onClick={back}>
            Back
          </button>
        ) : null}
        <button type="button" className="sp-lineage-btn" onClick={() => setRef(null)}>
          Close
        </button>
      </header>

      <div className="sp-lineage-body">
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
            <p className="sp-lineage-ambig">
              This tag matches <strong>{d.candidateCount}</strong> records. Six characters are not
              enough to name one, so nothing has been chosen.
            </p>
            <ol className="sp-chain">
              {d.candidates.map((c) => (
                <li className="sp-chain-node" key={c.entityId}>
                  <span className="sp-chain-mark" aria-hidden="true" />
                  <div className="sp-chain-body">
                    <button
                      type="button"
                      className="sp-lineage-pick"
                      onClick={() => follow(c.entityId)}
                    >
                      {c.title ? stripAutoPrefix(c.title) : "Untitled"}
                    </button>
                    <div className="sp-chain-meta">
                      {c.status ? <span>{c.status}</span> : null}
                      {c.createdAt ? <span>{fmt(c.createdAt)}</span> : null}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
            {d.candidateCount > d.candidates.length ? (
              <p className="sp-chain-more">
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
            <h3 className="sp-lineage-title">{stripAutoPrefix(d.title)}</h3>
            <div className="sp-lineage-meta">
              {d.status ? <span>{d.status}</span> : null}
              {d.status && d.createdAt ? <span aria-hidden="true"> · </span> : null}
              {d.createdAt ? <span>recorded {fmt(d.createdAt)}</span> : null}
            </div>

            {/* The walk. Every connected entity is itself a tag you can follow,
              which is the whole point: the record is a graph, not a row. */}
            <ol className="sp-trail">
              {d.steps.map((s, i) => (
                <li className="sp-trail-step" key={`${s.label}-${i}`}>
                  <span className="sp-trail-mark" aria-hidden="true" />
                  <div className="sp-trail-body">
                    <div className="sp-trail-label">
                      {s.label}
                      {s.at ? <span className="sp-trail-at"> · {fmt(s.at)}</span> : null}
                    </div>
                    <div className="sp-trail-detail">
                      <span>{stripAutoPrefix(s.detail)}</span>
                      {s.ref ? (
                        <button
                          type="button"
                          className="sp-trail-ref"
                          onClick={() => follow(s.ref as string)}
                          title={`Trace ${s.ref}`}
                        >
                          {s.ref}
                        </button>
                      ) : null}
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
              <div className="sp-lineage-chain">
                <div className="sp-trail-label">The chain</div>
                <ol className="sp-chain">
                  {chainOf(graphQ.data).map((entry) =>
                    entry.focus ? (
                      <li className="sp-chain-node" data-focus="true" key="focus">
                        <span className="sp-chain-mark" aria-hidden="true" />
                        <div className="sp-chain-body">
                          <div className="sp-chain-kind">{entry.node.kind} · you are here</div>
                          <div className="sp-chain-title">{stripAutoPrefix(d.title)}</div>
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
                  <p className="sp-chain-more">
                    The chain continues past this. Follow an id above to keep walking.
                  </p>
                ) : null}
              </div>
            ) : null}

            {d.kind === "mission" && chainQ.data ? (
              <div className="sp-lineage-chain">
                <div className="sp-trail-label">Trust chain</div>
                <MissionChain chain={chainQ.data} />
              </div>
            ) : null}
          </>
        )}
      </div>
    </aside>
  );
}
