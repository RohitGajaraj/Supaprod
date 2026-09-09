// O1 / DBR-1 v1 - the pure core of the knowledge-graph explorer.
//
// This module is SERVER-FREE on purpose so it is unit-testable in isolation
// (bun:test). It turns raw `artifact_lineage` rows into a typed, bounded,
// deterministically-laid-out `{ nodes, edges }` graph centred on a focus node.
//
// Design notes (full spec: docs/features/knowledge-graph-explorer.md):
//  - DERIVED, not stored: every edge already exists in `artifact_lineage`
//    (auto-written by recordLineage). v1 never fabricates an edge.
//  - Bounded like getProvenance (MAX_NODES / MAX_DEPTH) so a huge or cyclic
//    graph can never run away; `truncated` tells the UI it was capped.
//  - Deterministic layout (no Math.random): same input always renders the same,
//    which also makes the layout testable.
//  - The supersession SEAM is shaped but empty: `relation` already admits
//    'supersedes' | 'contradicts' and every edge carries `validTo` (always null
//    in v1). The day the inference engine writes those, they render unchanged.

export const GRAPH_NODE_KINDS = [
  "signal",
  "theme",
  "opportunity",
  "prd",
  "roadmap_item",
  "task",
  "meeting",
  "decision",
  "mission",
  "design_memory",
  // Added 2026-08-02 from a live census of artifact_lineage, which held THIRTEEN
  // kinds against the ten declared here. This list gates `focusKind`, so a kind
  // missing from it could be walked THROUGH by the traversal but never focused
  // ON. `learning` is the one that mattered: 146 occurrences, second only to
  // `decision`, and the graph could not be opened on a recorded outcome. For a
  // product that sells "we remember how it turned out", the outcome was the one
  // thing you could not start from.
  "learning",
  "deployment",
  "changeset",
  "prd_scaffold",
  "prototype",
  "prd_flow",
] as const;
export type GraphNodeKind = (typeof GRAPH_NODE_KINDS)[number];

export const GRAPH_RELATIONS = [
  "promoted",
  "cites",
  "derived-from",
  "depends-on",
  "validates",
  "supersedes",
  "contradicts",
] as const;
export type GraphRelation = (typeof GRAPH_RELATIONS)[number];

/* ------------------------------------------------------------------ *
 * Relation families: one MEANING per family, however it was spelled.
 * ------------------------------------------------------------------ */

/**
 * THE DUPLICATE-SPELLING RULING (2026-08-02).
 *
 * A live census of `artifact_lineage` found SIXTEEN distinct relation strings
 * standing for about thirteen meanings, because two writers disagree on both
 * spelling and voice:
 *
 *   `derived_from` (14 rows) and `derived-from` (12 rows) are ONE relation. The
 *   app writes the hyphen form (`flows.functions.ts:165`); the Helio demo seed
 *   (`supabase/migrations/20260725130000_helio_demo_seed_rich.sql`) writes the
 *   underscore form. Nothing tells them apart, and GRAPH_RELATIONS above declared
 *   only the hyphen, so half of that relation fell through as an unknown string
 *   with no label and no legend entry.
 *
 *   `promoted`/`promotes`, `validates`/`validated_by`, `supersedes`/`superseded_by`
 *   and `contradicts`/`contradicted_by` are one relation written from opposite ends
 *   of the same edge. The active spelling puts the ACTOR on the parent; the `_by`
 *   spelling puts the actor on the child.
 *
 * WHAT WE DO, and what we deliberately refuse to do:
 *
 *   WE DO NOT REWRITE THE ROW. `GraphEdge.relation` still carries the stored
 *   string byte for byte. The record is evidence, and a read surface that quietly
 *   corrects its own source has stopped being a record. The fix at rest is a
 *   migration, and it is written up rather than smuggled in here: see
 *   GRAPH-NEEDS-MIGRATION.md at the repo root.
 *
 *   WE DO NOT FLIP THE EDGE. Reversing parent and child so a label reads nicely
 *   would rewrite the topology, and every other reader of `artifact_lineage` walks
 *   the same rows expecting the stored direction (the Critic's contradiction
 *   history, the trust ledger, the loop-closure moat).
 *
 *   WE NORMALISE AT READ TIME into a FAMILY plus an INVERTED flag. The family is
 *   the meaning; `inverted` says which end of the stored edge is the actor. That
 *   one flag is the whole difference between a legend and a lie: under
 *   `supersedes` the CHILD is the belief that stopped being current, under
 *   `superseded_by` it is the PARENT, and until now the second case (21 rows, more
 *   than the 8 the active spelling has) was not counted as a revision at all.
 */
export type RelationFamilySpec = {
  /** Plain words for the legend. Never the stored string. */
  label: string;
  /** Completes "<source> ___ <target>" on a NON-inverted edge. */
  fromSource: string;
  /** Completes "<target> ___ <source>" on a NON-inverted edge. */
  fromTarget: string;
  /**
   * True when the family asserts that one end's belief STOPPED BEING CURRENT.
   * Wider than `supersedes`/`contradicts` on purpose: a bet that was killed is a
   * belief that ended, and the record should say so on the canvas.
   */
  revises: boolean;
};

export const RELATION_FAMILIES: Readonly<Record<string, RelationFamilySpec>> = {
  promoted: {
    label: "Promoted",
    fromSource: "promoted into",
    fromTarget: "was promoted from",
    revises: false,
  },
  "derived-from": {
    label: "Derived",
    fromSource: "gave rise to",
    fromTarget: "came from",
    revises: false,
  },
  informs: {
    label: "Informed",
    fromSource: "informed",
    fromTarget: "was informed by",
    revises: false,
  },
  cites: { label: "Cited", fromSource: "cites", fromTarget: "is cited by", revises: false },
  "grounded-in": {
    label: "Grounded",
    fromSource: "is grounded in",
    fromTarget: "grounds",
    revises: false,
  },
  validates: {
    label: "Validated",
    fromSource: "validated",
    fromTarget: "was validated by",
    revises: false,
  },
  measures: {
    label: "Measured",
    fromSource: "measured",
    fromTarget: "was measured by",
    revises: false,
  },
  dispatched: {
    label: "Dispatched",
    fromSource: "dispatched",
    fromTarget: "was dispatched by",
    revises: false,
  },
  "depends-on": {
    label: "Depends",
    fromSource: "depends on",
    fromTarget: "is needed by",
    revises: false,
  },
  "relates-to": {
    label: "Related",
    fromSource: "relates to",
    fromTarget: "relates to",
    revises: false,
  },
  supersedes: {
    label: "Replaced",
    fromSource: "replaced",
    fromTarget: "was replaced by",
    revises: true,
  },
  contradicts: {
    label: "Contradicted",
    fromSource: "contradicts",
    fromTarget: "is contradicted by",
    revises: true,
  },
  kills: { label: "Killed", fromSource: "killed", fromTarget: "was killed by", revises: true },
  /**
   * DECLARED 2026-08-11, when this relation stopped being rare.
   *
   * `decided` has been written since the judgment gate was built
   * (`opportunity -> decision`) and was never listed here, so it fell through
   * to the generic path and drew twelve real edges as "links to". Closing the
   * `prd -> decision` and `mission -> decision` writer gap points every future
   * decision receipt at this family — 105 of 154 real decisions are
   * mission-sourced — so the largest population of edges in the graph would
   * have been the one with no sentence.
   *
   * PARENT is the artifact the call was made about, CHILD is the decision, in
   * all three shapes. Not inverted.
   */
  decided: {
    label: "Decided",
    fromSource: "was decided by",
    fromTarget: "is the call on",
    revises: false,
  },
};

/**
 * Every spelling seen in the live table or written anywhere in `src/`, mapped to
 * its family and to which end of the stored edge acts.
 *
 * `informed-by` IS THE ONE EXCEPTION and it is listed rather than left to the
 * generic `-by` rule below, because the seed uses that suffix against its own
 * convention. Every `informed_by` row runs earlier artifact -> later artifact
 * (`learning -> decision`, "the loop closes: outcomes feed the next call"), so the
 * PARENT is the thing doing the informing and the edge is NOT inverted. The
 * `_by` in the name describes the child's relation to the parent, whereas in
 * `validated_by`, `measured_by`, `superseded_by`, `contradicted_by` and `killed_by`
 * it describes the parent's relation to the child. Guessing here would have put
 * forty-nine edges the wrong way round, so it is pinned to the evidence.
 */
const RELATION_ALIASES: Readonly<Record<string, { family: string; inverted: boolean }>> = {
  promoted: { family: "promoted", inverted: false },
  promotes: { family: "promoted", inverted: false },
  "derived-from": { family: "derived-from", inverted: false },
  derived: { family: "derived-from", inverted: false },
  from: { family: "derived-from", inverted: false },
  "informed-by": { family: "informs", inverted: false },
  informs: { family: "informs", inverted: false },
  cites: { family: "cites", inverted: false },
  references: { family: "cites", inverted: false },
  "grounded-in": { family: "grounded-in", inverted: false },
  validates: { family: "validates", inverted: false },
  "validated-by": { family: "validates", inverted: true },
  measures: { family: "measures", inverted: false },
  "measured-by": { family: "measures", inverted: true },
  dispatched: { family: "dispatched", inverted: false },
  "depends-on": { family: "depends-on", inverted: false },
  "relates-to": { family: "relates-to", inverted: false },
  supports: { family: "relates-to", inverted: false },
  documents: { family: "relates-to", inverted: false },
  supersedes: { family: "supersedes", inverted: false },
  revised: { family: "supersedes", inverted: false },
  "superseded-by": { family: "supersedes", inverted: true },
  contradicts: { family: "contradicts", inverted: false },
  "contradicted-by": { family: "contradicts", inverted: true },
  kills: { family: "kills", inverted: false },
  "killed-by": { family: "kills", inverted: true },
  // `decided` is written by every door that records a call against an artifact:
  // the judgment gate (opportunity), the spec-approval capture (prd), and the
  // mission completion receipt (mission). Listed rather than left to the
  // fall-through so this table keeps its own claim — every spelling written
  // anywhere in src/ appears here.
  decided: { family: "decided", inverted: false },
};

/**
 * PURE. Fold a stored relation string into its family and its direction.
 *
 * Separator-blind first (`derived_from` and `derived-from` land in one bucket),
 * then the alias table, then a generic rule for anything nobody has taught it: a
 * spelling ending in `-by` is the passive voice of its stem, so a relation this
 * file has never heard of still reads the right way round instead of becoming a
 * second unnamed colour on the legend.
 */
export function canonicalRelation(raw: string | null | undefined): {
  family: string;
  inverted: boolean;
} {
  const r = classifyRelation(raw).replace(/_/g, "-");
  const known = RELATION_ALIASES[r];
  if (known) return known;
  if (r.endsWith("-by") && r.length > 3) {
    const stem = r.slice(0, -3);
    const viaStem = RELATION_ALIASES[stem];
    if (viaStem) return { family: viaStem.family, inverted: !viaStem.inverted };
    return { family: stem, inverted: true };
  }
  return { family: r, inverted: false };
}

/** PURE. The legend word for a family, including one nobody has declared yet. */
export function relationLabel(family: string): string {
  const spec = RELATION_FAMILIES[family];
  if (spec) return spec.label;
  const words = family.replace(/[-_]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Linked";
}

/**
 * PURE. The phrase that completes a sentence starting at ONE end of the edge.
 * `side` names which end you are standing on, and `inverted` swaps the voice, so
 * `decision --validated_by--> learning` reads "was validated by" from the
 * decision and "validated" from the learning, off the same row.
 */
export function relationPhrase(
  family: string,
  inverted: boolean,
  side: "source" | "target",
): string {
  const spec = RELATION_FAMILIES[family];
  if (!spec) return side === "source" ? "links to" : "is linked from";
  return (side === "source") !== inverted ? spec.fromSource : spec.fromTarget;
}

/**
 * PURE. True when the relation asserts that one end's belief stopped being
 * current, in ANY spelling.
 *
 * DELIBERATELY NOT `isSuperseding`. That predicate stays exactly as narrow as it
 * was because three modules outside this surface depend on its precise meaning
 * (`ai/contradiction-history.ts` reads the CHILD as the prior belief, which is
 * true of `supersedes` and false of `superseded_by`). This is the wider,
 * direction-aware question the canvas needs, and it is a different name so the
 * two can never be confused for one another.
 */
export function revisesBelief(raw: string | null | undefined): boolean {
  return RELATION_FAMILIES[canonicalRelation(raw).family]?.revises === true;
}

/** A row as it comes out of `artifact_lineage` (the fields we read). */
export type RawLineageEdge = {
  id: string;
  parent_kind: GraphNodeKind;
  parent_id: string;
  child_kind: GraphNodeKind;
  child_id: string;
  relation: string | null;
  rationale: string | null;
  created_at: string | null;
  /**
   * WHO drew this link. Already a column on `artifact_lineage` and already
   * populated (the seed stamps `discovery-scout`, `critic`, `data-analyst`,
   * `strategist`, `qa`; the supersession engine stamps its own slug). It was
   * never selected, so the graph rendered a shape with no author: a reader could
   * see that two things were connected and had no way to ask who said so.
   */
  created_by_agent?: string | null;
  /**
   * Bi-temporal stamp (DBR-1.5): the time this supersession assertion stopped
   * being current, because a LATER outcome reversed it (invalidate-don't-delete).
   * Present only once the migration's `valid_to` column is live; absent (undefined)
   * before then, in which case the edge reads as still-current. Always null on a
   * non-supersession edge.
   */
  valid_to?: string | null;
  /**
   * Edge-confidence provenance (DBR-EDGE-CONF), written into the `inference` jsonb by the
   * supersession engine. Present only on engine-written supersession edges once the column
   * is live; absent on promoted/human edges and before the migration. Read fail-safe.
   */
  inference?: { confidence?: number; tier?: string } | null;
};

/**
 * How a recorded outcome turned out. The three words the `learnings.verdict`
 * column actually holds, and the product's whole claim in one field: the record
 * does not just remember that you shipped, it remembers whether it worked.
 */
export type OutcomeVerdict = "validated" | "missed" | "mixed";

export function isOutcomeVerdict(v: unknown): v is OutcomeVerdict {
  return v === "validated" || v === "missed" || v === "mixed";
}

export type GraphNode = {
  /** `${kind}:${id}` - the stable graph key. */
  key: string;
  kind: GraphNodeKind;
  id: string;
  title: string;
  /** Degree within the included subgraph (drives node size). */
  influence: number;
  /** Earliest incident-edge timestamp, the truthful "valid from". */
  createdAt: string | null;
  /** Graph distance from the focus node (0 = focus). */
  ring: number;
  x: number;
  y: number;
  /**
   * Set on a `learning` node whose verdict the server could read, null on every
   * other kind and on any learning whose verdict did not load. Never guessed:
   * an unread verdict stays null rather than defaulting to "validated", because
   * a product that quietly paints unknown outcomes as wins is the one thing this
   * surface must never do.
   */
  outcome: OutcomeVerdict | null;
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  /** The STORED string, byte for byte. Never normalised: the record is evidence. */
  relation: GraphRelation | string;
  /** The meaning behind the spelling. See the duplicate-spelling ruling above. */
  family: string;
  /** True when the CHILD is the actor in the family's sentence (`superseded_by`). */
  inverted: boolean;
  /**
   * True when this edge says a belief stopped being current, in any spelling.
   * Wider and more correct than `superseding`, which only ever matched the two
   * active-voice spellings the engine writes.
   */
  revises: boolean;
  rationale: string | null;
  /** The agent that drew the link, when the row records one. */
  createdByAgent: string | null;
  /** = the edge's created_at; the honest time axis. */
  validFrom: string | null;
  /**
   * Bi-temporal: when this supersession assertion stopped being current (a later
   * outcome reversed it). Null while the assertion still holds, and null on every
   * non-supersession edge / before the migration is live (the seam was empty in v1).
   */
  validTo: string | null;
  /**
   * True for the two ACTIVE-VOICE spellings the supersession engine writes.
   * Kept unchanged for the readers that depend on its narrowness; prefer
   * `revises` for anything that asks "did a belief end here".
   */
  superseding: boolean;
  /**
   * The invalidate-don't-delete property made visible: a supersession edge whose
   * own assertion was later reversed (`validTo` stamped). It stays on the canvas as
   * faded history rather than being deleted. False until the engine + migration run.
   */
  retired: boolean;
  /**
   * Edge-confidence (DBR-EDGE-CONF): how trustworthy the supersession engine judged this
   * edge, from its `inference` provenance. Null on non-supersession edges and on edges
   * written before the confidence layer (so the canvas only ever fades a genuinely-scored,
   * low-confidence revision, never an unscored one).
   */
  confidence: number | null;
  confidenceTier: "strong" | "tentative" | "drop" | string | null;
};

export type KnowledgeGraph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  focusKey: string | null;
  stats: { nodeCount: number; edgeCount: number; rootSignals: number; maxRing: number };
  truncated: boolean;
};

export type GraphBounds = { maxNodes: number; maxDepth: number };
export const DEFAULT_BOUNDS: GraphBounds = { maxNodes: 80, maxDepth: 8 };

const RING_GAP = 120;

export function nodeKey(kind: string, id: string): string {
  return `${kind}:${id}`;
}

/** A node addressed by kind + id - the graph focus. */
export type GraphFocus = { kind: GraphNodeKind; id: string };

/**
 * PURE. Pick a lineage-anchored focus from raw lineage rows: the CHILD of the
 * most-recently-created edge (the "newer" artifact in a promoted/derived link).
 *
 * Used as a FALLBACK focus by getKnowledgeGraph: the auto-focus is the caller's
 * most recent decision, but a workspace's lineage may live entirely off that
 * decision (e.g. signal->theme promotions with no decision attached). Without this
 * fallback the canvas wrongly reads "No lineage to map yet" even though edges exist.
 * Anchoring on a node that actually participates in lineage guarantees the graph
 * draws whenever the workspace has ANY edge. Returns null on empty/malformed input.
 */
export function pickLineageFocus(rows: RawLineageEdge[] | null | undefined): GraphFocus | null {
  let best: RawLineageEdge | null = null;
  for (const r of Array.isArray(rows) ? rows : []) {
    if (!r || typeof r.child_kind !== "string" || typeof r.child_id !== "string" || !r.child_id) {
      continue;
    }
    if (!best || (r.created_at ?? "") > (best.created_at ?? "")) best = r;
  }
  return best ? { kind: best.child_kind, id: best.child_id } : null;
}

/** Normalise a raw relation string; empty becomes the `promoted` default. */
export function classifyRelation(raw: string | null | undefined): GraphRelation | string {
  const r = (raw ?? "").trim().toLowerCase();
  return r || "promoted";
}

export function isSuperseding(relation: string): boolean {
  return relation === "supersedes" || relation === "contradicts";
}

/**
 * The kind and id a `kind:id` key carries.
 *
 * CENSUSED 2026-09-09 (Lane 1's `sourceMark` find: a cast doing a check's
 * job). This one is a cast, and it stays one, with its reason stated rather
 * than left silent. The keys are assembled by this module's own writers from
 * `GRAPH_NODE_KINDS`, so an unknown kind means the graph's own round trip is
 * broken, which is a different fault from a caller sending rubbish. The
 * honest response is neither to drop the node, which hides one that exists,
 * nor to draw it as a kind that does not exist and say nothing. It is to say
 * so: the check is here and it reports, and the value passes through unchanged
 * so the drawing is exactly what it was.
 */
function parseKey(key: string): { kind: GraphNodeKind; id: string } {
  const idx = key.indexOf(":");
  const raw = idx < 0 ? key : key.slice(0, idx);
  if (!(GRAPH_NODE_KINDS as readonly string[]).includes(raw)) {
    console.error(`knowledge graph: key "${key}" carries a kind nothing defines: "${raw}"`);
  }
  return { kind: raw as GraphNodeKind, id: idx < 0 ? "" : key.slice(idx + 1) };
}

/**
 * Project raw lineage rows into a typed, bounded, laid-out graph around `focusKey`.
 * Fail-safe: malformed input yields the focus node alone (or an empty graph),
 * never throws.
 */
export function projectGraph(
  rawEdges: RawLineageEdge[],
  titleMap: Map<string, string>,
  focusKey: string,
  bounds: GraphBounds = DEFAULT_BOUNDS,
  /**
   * Node key -> recorded verdict, for the `learning` nodes whose verdict the
   * server could read. Optional and additive: every existing caller passes four
   * arguments and gets a graph whose outcomes are all null, which is exactly the
   * honest reading of "we did not look".
   */
  outcomes?: Map<string, OutcomeVerdict> | null,
): KnowledgeGraph {
  const maxNodes = bounds?.maxNodes ?? DEFAULT_BOUNDS.maxNodes;
  const maxDepth = bounds?.maxDepth ?? DEFAULT_BOUNDS.maxDepth;

  const clean = (Array.isArray(rawEdges) ? rawEdges : []).filter(
    (e): e is RawLineageEdge =>
      !!e &&
      typeof e.parent_kind === "string" &&
      typeof e.parent_id === "string" &&
      typeof e.child_kind === "string" &&
      typeof e.child_id === "string" &&
      !!e.parent_id &&
      !!e.child_id,
  );

  const withKeys = clean.map((e) => ({
    raw: e,
    sourceKey: nodeKey(e.parent_kind, e.parent_id),
    targetKey: nodeKey(e.child_kind, e.child_id),
  }));

  // Undirected adjacency for the breadth-first ring assignment.
  const adj = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    const s = adj.get(a) ?? new Set<string>();
    s.add(b);
    adj.set(a, s);
  };
  for (const e of withKeys) {
    link(e.sourceKey, e.targetKey);
    link(e.targetKey, e.sourceKey);
  }

  // BFS from the focus, bounded by depth + node count.
  const ringByKey = new Map<string, number>([[focusKey, 0]]);
  let frontier = [focusKey];
  let truncated = false;
  let depth = 0;
  while (frontier.length && depth < maxDepth) {
    depth++;
    const next: string[] = [];
    let capped = false;
    for (const k of [...frontier].sort()) {
      for (const nb of [...(adj.get(k) ?? new Set<string>())].sort()) {
        if (ringByKey.has(nb)) continue;
        if (ringByKey.size >= maxNodes) {
          truncated = true;
          capped = true;
          break;
        }
        ringByKey.set(nb, depth);
        next.push(nb);
      }
      if (capped) break;
    }
    frontier = next;
  }
  if (frontier.length > 0) truncated = true; // unexplored nodes beyond the cap

  const included = ringByKey;
  const includedEdges = withKeys.filter(
    (e) => included.has(e.sourceKey) && included.has(e.targetKey),
  );

  // Degree (influence) + earliest incident timestamp per node.
  const degree = new Map<string, number>();
  const createdAtByKey = new Map<string, string | null>();
  const bump = (key: string, ts: string | null) => {
    degree.set(key, (degree.get(key) ?? 0) + 1);
    const cur = createdAtByKey.get(key);
    if (ts && (cur == null || ts < cur)) createdAtByKey.set(key, ts);
    else if (!createdAtByKey.has(key)) createdAtByKey.set(key, ts);
  };
  for (const e of includedEdges) {
    bump(e.sourceKey, e.raw.created_at);
    bump(e.targetKey, e.raw.created_at);
  }

  // Group by ring for a deterministic radial layout.
  const keysByRing = new Map<number, string[]>();
  for (const [key, ring] of included) {
    const arr = keysByRing.get(ring) ?? [];
    arr.push(key);
    keysByRing.set(ring, arr);
  }

  const nodes: GraphNode[] = [];
  for (const [ring, keysRaw] of [...keysByRing.entries()].sort((a, b) => a[0] - b[0])) {
    const keys = [...keysRaw].sort();
    const n = keys.length;
    keys.forEach((key, i) => {
      const { kind, id } = parseKey(key);
      let x = 0;
      let y = 0;
      if (ring > 0) {
        const radius = ring * RING_GAP;
        const angle = (2 * Math.PI * i) / n + ring * 0.35;
        x = radius * Math.cos(angle);
        y = radius * Math.sin(angle);
      }
      nodes.push({
        key,
        kind,
        id,
        title: titleMap.get(key) ?? "",
        influence: degree.get(key) ?? 0,
        createdAt: createdAtByKey.get(key) ?? null,
        ring,
        x,
        y,
        outcome: outcomes?.get(key) ?? null,
      });
    });
  }

  const edges: GraphEdge[] = includedEdges.map((e) => {
    const relation = classifyRelation(e.raw.relation);
    const { family, inverted } = canonicalRelation(relation);
    const revises = RELATION_FAMILIES[family]?.revises === true;
    const superseding = isSuperseding(relation);
    // Only a REVISION edge can be "retired"; a stray valid_to on any other
    // relation is ignored so the flag never lies. Gated on `revises` rather than
    // `superseding` so a `superseded_by` row that was itself later reversed reads
    // as history instead of silently ignoring its own stamp.
    const validTo =
      revises && typeof e.raw.valid_to === "string" && e.raw.valid_to.trim()
        ? e.raw.valid_to
        : null;
    // Edge-confidence (DBR-EDGE-CONF): only a revision edge can carry it, so a stray
    // inference blob on any other relation is ignored and the canvas never mis-fades.
    const inf =
      revises && e.raw.inference && typeof e.raw.inference === "object" ? e.raw.inference : null;
    const confidence = inf && typeof inf.confidence === "number" ? inf.confidence : null;
    const confidenceTier = inf && typeof inf.tier === "string" ? inf.tier : null;
    const agent = typeof e.raw.created_by_agent === "string" ? e.raw.created_by_agent.trim() : "";
    return {
      id: e.raw.id,
      source: e.sourceKey,
      target: e.targetKey,
      relation,
      family,
      inverted,
      revises,
      rationale: e.raw.rationale ?? null,
      createdByAgent: agent || null,
      validFrom: e.raw.created_at ?? null,
      validTo,
      superseding,
      retired: validTo !== null,
      confidence,
      confidenceTier,
    };
  });

  return {
    nodes,
    edges,
    focusKey: nodes.length ? focusKey : null,
    stats: {
      nodeCount: nodes.length,
      edgeCount: edges.length,
      rootSignals: nodes.filter((nd) => nd.kind === "signal").length,
      maxRing: nodes.reduce((m, nd) => Math.max(m, nd.ring), 0),
    },
    truncated,
  };
}

/**
 * PURE (DBR-EDGE-CONF). Summarize the edge-confidence of the CURRENT supersession revisions:
 * among non-retired supersedes/contradicts edges that carry an engine confidence tier, how
 * many are strong vs tentative. Retired (reversed) and unscored edges are excluded, so the
 * canvas only ever claims the trust it actually has.
 */
export function summarizeEdgeConfidence(edges: GraphEdge[]): {
  scored: number;
  strong: number;
  tentative: number;
} {
  let strong = 0;
  let tentative = 0;
  for (const e of edges) {
    if (!e.revises || e.retired || !e.confidenceTier) continue;
    if (e.confidenceTier === "strong") strong++;
    else if (e.confidenceTier === "tentative") tentative++;
  }
  return { scored: strong + tentative, strong, tentative };
}

/**
 * PURE. Which END of a revision edge is the belief that stopped being current,
 * or null when the edge is not a revision at all.
 *
 * The whole reason `inverted` exists. `supersedes` puts the newer belief on the
 * parent, so the retired one is the target; `superseded_by` puts the older belief
 * on the parent, so the retired one is the source. Reading the direction off the
 * row is the difference between "this call was overturned" and pointing at the
 * call that did the overturning.
 */
export function revisedEndpoint(edge: GraphEdge): string | null {
  if (!edge.revises) return null;
  return edge.inverted ? edge.source : edge.target;
}

/** The other end. Whatever replaced, contradicted or killed the revised belief. */
export function revisingEndpoint(edge: GraphEdge): string | null {
  if (!edge.revises) return null;
  return edge.inverted ? edge.target : edge.source;
}

export type RelationTally = {
  family: string;
  label: string;
  count: number;
  revises: boolean;
};

/**
 * PURE. How many edges of each MEANING are on the canvas.
 *
 * Counts by family, so `derived_from` and `derived-from` are one line rather than
 * two, and `supersedes` and `superseded_by` are one line rather than two halves
 * of a mechanic neither of which looked significant on its own. Deterministic
 * order: commonest first, then alphabetical, so the legend does not reshuffle
 * itself between renders of the same graph.
 */
export function summarizeRelations(edges: GraphEdge[]): RelationTally[] {
  const counts = new Map<string, number>();
  for (const e of Array.isArray(edges) ? edges : []) {
    counts.set(e.family, (counts.get(e.family) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([family, count]) => ({
      family,
      label: relationLabel(family),
      count,
      revises: RELATION_FAMILIES[family]?.revises === true,
    }))
    .sort((a, b) => b.count - a.count || a.family.localeCompare(b.family));
}

/**
 * One moment where the workspace changed its mind, phrased from the record.
 * This is the compounding claim made countable: not "here are some edges" but
 * "on this date, this belief stopped being current, and here is who said so and
 * why".
 */
export type BeliefChange = {
  /** The lineage edge id: this row is the evidence, and it is addressable. */
  id: string;
  family: string;
  label: string;
  /** When the revision was asserted. */
  at: string | null;
  /** When the revision was ITSELF reversed, or null while it still holds. */
  retiredAt: string | null;
  retired: boolean;
  /** The belief that stopped being current. */
  revisedKey: string;
  revisedTitle: string;
  /** What replaced, contradicted or killed it. */
  revisedByKey: string;
  revisedByTitle: string;
  /** WHY, in the words stored on the edge. */
  rationale: string | null;
  /** WHO said so. */
  agent: string | null;
  confidence: number | null;
  confidenceTier: string | null;
};

/**
 * PURE. The time axis of the graph's thinking, newest first.
 *
 * The canvas could already DRAW a revision; nothing could READ one. A dashed
 * madder thread tells you something changed and refuses to say what, when, or on
 * whose say-so, which is a picture of a brain rather than a brain. This turns the
 * same edges into dated sentences, and it keeps the reversed ones (invalidate,
 * never delete) so the reader can see the workspace change its mind twice.
 */
export function buildBeliefChanges(graph: KnowledgeGraph): BeliefChange[] {
  const titleOf = new Map<string, string>();
  for (const n of graph?.nodes ?? []) titleOf.set(n.key, n.title);

  const out: BeliefChange[] = [];
  for (const e of graph?.edges ?? []) {
    const revised = revisedEndpoint(e);
    const by = revisingEndpoint(e);
    if (!revised || !by) continue;
    out.push({
      id: e.id,
      family: e.family,
      label: relationLabel(e.family),
      at: e.validFrom,
      retiredAt: e.validTo,
      retired: e.retired,
      revisedKey: revised,
      revisedTitle: titleOf.get(revised) ?? "",
      revisedByKey: by,
      revisedByTitle: titleOf.get(by) ?? "",
      rationale: e.rationale,
      agent: e.createdByAgent,
      confidence: e.confidence,
      confidenceTier: e.confidenceTier,
    });
  }
  // Newest first, and a stable tiebreak on the edge id so two revisions written
  // in the same transaction do not swap places between renders.
  return out.sort((a, b) => (b.at ?? "").localeCompare(a.at ?? "") || a.id.localeCompare(b.id));
}

/** A recorded outcome, and the calls that led to it. */
export type OutcomeTrail = {
  outcomeKey: string;
  outcomeTitle: string;
  verdict: OutcomeVerdict;
  /** When the outcome landed. */
  at: string | null;
  decisions: {
    key: string;
    title: string;
    /** Steps through the graph from the outcome back to this call. */
    hops: number;
    /** True when a single stored edge joins the call to the outcome. */
    direct: boolean;
  }[];
};

const OUTCOME_KIND: GraphNodeKind = "learning";
const TRAIL_KIND: GraphNodeKind = "decision";
const DEFAULT_TRAIL_HOPS = 3;

/**
 * PURE. "Show me every decision that led to a missed outcome."
 *
 * The product's claim is that it remembers how things turned out, and until the
 * `learning` kind became nameable there was no way to ask this question at all:
 * 146 outcome nodes rendered blank and could not be focused. Now that they can,
 * this walks BACKWARDS from each outcome carrying the asked-for verdict and
 * names the calls within `maxHops` of it.
 *
 * UNDIRECTED on purpose. The stored direction of an outcome edge depends on which
 * writer made it (`decision --validated_by--> learning` runs one way,
 * `learning --informed_by--> decision` the other), so walking only downstream
 * would answer this question correctly for one half of the data and silently
 * return nothing for the other half. Bounded, deterministic, and fail-safe: a
 * graph with no scored outcomes yields an empty list rather than a claim.
 */
export function findOutcomeTrails(
  graph: KnowledgeGraph,
  opts: { verdicts?: readonly OutcomeVerdict[]; maxHops?: number } = {},
): OutcomeTrail[] {
  const wanted = new Set<OutcomeVerdict>(opts.verdicts ?? ["missed"]);
  const maxHops = Math.max(1, opts.maxHops ?? DEFAULT_TRAIL_HOPS);
  const nodes = graph?.nodes ?? [];
  const edges = graph?.edges ?? [];
  if (nodes.length === 0) return [];

  const byKey = new Map(nodes.map((n) => [n.key, n]));
  const adj = new Map<string, Set<string>>();
  const directPairs = new Set<string>();
  const join = (a: string, b: string) => {
    const s = adj.get(a) ?? new Set<string>();
    s.add(b);
    adj.set(a, s);
  };
  for (const e of edges) {
    if (e.retired) continue; // a reversed link is history, never a live trail
    join(e.source, e.target);
    join(e.target, e.source);
    directPairs.add(`${e.source}|${e.target}`);
    directPairs.add(`${e.target}|${e.source}`);
  }

  const trails: OutcomeTrail[] = [];
  for (const outcome of nodes) {
    if (outcome.kind !== OUTCOME_KIND) continue;
    if (!outcome.outcome || !wanted.has(outcome.outcome)) continue;

    const seen = new Map<string, number>([[outcome.key, 0]]);
    let frontier = [outcome.key];
    const found: OutcomeTrail["decisions"] = [];
    for (let hop = 1; hop <= maxHops && frontier.length; hop++) {
      const next: string[] = [];
      for (const k of [...frontier].sort()) {
        for (const nb of [...(adj.get(k) ?? [])].sort()) {
          if (seen.has(nb)) continue;
          seen.set(nb, hop);
          next.push(nb);
          const n = byKey.get(nb);
          if (n?.kind === TRAIL_KIND) {
            found.push({
              key: nb,
              title: n.title,
              hops: hop,
              direct: directPairs.has(`${outcome.key}|${nb}`),
            });
          }
        }
      }
      frontier = next;
    }

    trails.push({
      outcomeKey: outcome.key,
      outcomeTitle: outcome.title,
      verdict: outcome.outcome,
      at: outcome.createdAt,
      // Closest call first, then alphabetical, so the ordering is stable.
      decisions: found.sort((a, b) => a.hops - b.hops || a.key.localeCompare(b.key)),
    });
  }

  return trails.sort(
    (a, b) => (b.at ?? "").localeCompare(a.at ?? "") || a.outcomeKey.localeCompare(b.outcomeKey),
  );
}

/**
 * The honest time axis: keep only what was already true as of `asOf` (an ISO
 * timestamp). ISO strings compare lexicographically, so no Date parsing needed.
 * The focus node is always kept so the view never goes blank.
 */
export function filterByTime(graph: KnowledgeGraph, asOf: string | null): KnowledgeGraph {
  if (!asOf) return graph;

  const edges = graph.edges.filter((e) => !e.validFrom || e.validFrom <= asOf);
  const live = new Set<string>();
  for (const e of edges) {
    live.add(e.source);
    live.add(e.target);
  }
  if (graph.focusKey) live.add(graph.focusKey);

  const nodes = graph.nodes.filter(
    (n) => live.has(n.key) && (n.key === graph.focusKey || !n.createdAt || n.createdAt <= asOf),
  );
  const nodeKeys = new Set(nodes.map((n) => n.key));
  const finalEdges = edges
    .filter((e) => nodeKeys.has(e.source) && nodeKeys.has(e.target))
    // Bi-temporal honesty: a revision assertion reversed AFTER `asOf` was still
    // current as of that instant, so it reads retired only once `validTo <= asOf`.
    .map((e) => (e.revises && e.validTo ? { ...e, retired: e.validTo <= asOf } : e));

  return {
    ...graph,
    nodes,
    edges: finalEdges,
    stats: {
      nodeCount: nodes.length,
      edgeCount: finalEdges.length,
      rootSignals: nodes.filter((nd) => nd.kind === "signal").length,
      maxRing: nodes.reduce((m, nd) => Math.max(m, nd.ring), 0),
    },
  };
}

export type StalenessResult = {
  /** Node keys whose most recent supporting evidence is older than the threshold. */
  staleKeys: Set<string>;
  staleCount: number;
  /** Nodes that have ANY dated evidence (the honest denominator). */
  datedCount: number;
  thresholdDays: number;
};

const DAY_MS = 86_400_000;
export const DEFAULT_STALE_DAYS = 90;

/**
 * O3 (drift slice): flag facts whose most recent supporting evidence has gone
 * stale. A node is stale when its NEWEST incident edge (the last time anything
 * reinforced it) is older than `thresholdDays` relative to `nowMs`. Pure and
 * deterministic - `nowMs` is injected so it is testable - and HONEST: nodes
 * with no dated evidence are never counted, never guessed. This is the
 * deterministic half of fact-currency; outcome-driven contradiction (the
 * supersession engine) is the deferred other half.
 */
export function computeStaleness(
  graph: KnowledgeGraph,
  opts: { thresholdDays?: number; nowMs: number },
): StalenessResult {
  const thresholdDays = opts?.thresholdDays ?? DEFAULT_STALE_DAYS;
  const cutoff = opts.nowMs - thresholdDays * DAY_MS;

  // Newest supporting timestamp per node (max incident edge validFrom).
  const latest = new Map<string, number>();
  const consider = (key: string, iso: string | null) => {
    if (!iso) return;
    const t = Date.parse(iso);
    if (Number.isNaN(t)) return;
    const cur = latest.get(key);
    if (cur === undefined || t > cur) latest.set(key, t);
  };
  for (const e of graph.edges) {
    consider(e.source, e.validFrom);
    consider(e.target, e.validFrom);
  }
  // Fall back to the node's own createdAt when it has no incident edge.
  for (const n of graph.nodes) {
    if (!latest.has(n.key)) consider(n.key, n.createdAt);
  }

  const staleKeys = new Set<string>();
  let datedCount = 0;
  for (const n of graph.nodes) {
    const t = latest.get(n.key);
    if (t === undefined) continue; // undated -> not counted
    datedCount++;
    if (t < cutoff) staleKeys.add(n.key);
  }

  return { staleKeys, staleCount: staleKeys.size, datedCount, thresholdDays };
}

export type ContradictionDriftResult = {
  /** Node keys whose most recent supporting edge is a CURRENT supersession. */
  driftedKeys: Set<string>;
  /** Count of nodes whose belief has been contradicted/superseded and that revision is still in effect. */
  driftedCount: number;
  /** Total nodes in the graph (denominator for UI display). */
  nodeCount: number;
};

/**
 * O3 (contradiction drift, outcome-driven half): flag facts whose most recent
 * supporting evidence is a CURRENT (non-retired) `supersedes` or `contradicts`
 * edge. These nodes represent beliefs that have been revised by a later outcome,
 * and the revision is still in effect (not itself reversed and retired). Pure and
 * deterministic. This uses the bi-temporal plumbing (the `retired` boolean, set by
 * DBR-1.5 when the migration's `valid_to` column is live) to distinguish CURRENT
 * revisions from reversed-and-retired ones (the invalidate-don't-delete moat).
 */
export function computeContradictionDrift(graph: KnowledgeGraph): ContradictionDriftResult {
  const driftedKeys = new Set<string>();

  // A node is "drifted" when a CURRENT revision edge names it as the belief that
  // stopped being current.
  //
  // THIS USED TO READ `e.target` UNCONDITIONALLY, and that was wrong for half the
  // data. It is only the target under the active-voice spellings the engine
  // writes; under `superseded_by`, `contradicted_by` and `killed_by` (35 live
  // rows against the active spellings' 16) the parent is the revised belief, and
  // those rows were not reaching this loop at all. `revisedEndpoint` reads the
  // direction off the edge instead of assuming it.
  for (const e of graph.edges) {
    if (e.retired) continue; // a reversed revision is history, not a current claim
    const revised = revisedEndpoint(e);
    if (revised) driftedKeys.add(revised);
  }

  return {
    driftedKeys,
    driftedCount: driftedKeys.size,
    nodeCount: graph.nodes.length,
  };
}

// ───────────────────────────────────────────────────────────────────────────
// DBR-1.5 read-side (F-IA-BRAIN-GRAPH): make the supersession mechanic legible.
//
// The supersession engine writes typed `supersedes`/`contradicts` edges between a
// decision and a prior belief when a recorded outcome reverses it (the moat's
// signature mechanic). The canvas already styles those edges (madder, dashed), but
// the node-story panel never said WHAT they mean. This pure helper turns the raw
// lineage rows getLineage already returns into a plain-language "decision history":
// for a selected node, which beliefs it revised, and whether it was itself revised
// by a later outcome. Migration-free (reads only `relation`, already present) and
// fail-safe (no such edges -> empty story -> the section simply doesn't render).
// ───────────────────────────────────────────────────────────────────────────

/** How a supersession edge reads relative to the SELECTED node. */
export type SupersessionDirection =
  "superseded-by" | "contradicted-by" | "killed-by" | "supersedes" | "contradicts" | "kills";

// Plain words on every user-facing chip (Loom W3, quality register: no
// "superseded/supersession" jargon in the UI; the relation values themselves
// stay untouched in the data).
const SUPERSESSION_LABEL: Record<SupersessionDirection, string> = {
  "superseded-by": "Replaced by",
  "contradicted-by": "Contradicted by",
  "killed-by": "Killed by",
  supersedes: "Replaces",
  contradicts: "Contradicts",
  kills: "Killed",
};

/**
 * Per revision family: how it reads when the SELECTED node is the one doing the
 * revising, and how it reads when the selected node is the one being revised.
 * Which of the two applies is computed from the stored edge's direction, never
 * from the spelling, so `supersedes` and `superseded_by` produce the same
 * sentence about the same pair of artifacts.
 */
const REVISION_VOICE: Record<
  string,
  { active: SupersessionDirection; passive: SupersessionDirection }
> = {
  supersedes: { active: "supersedes", passive: "superseded-by" },
  contradicts: { active: "contradicts", passive: "contradicted-by" },
  kills: { active: "kills", passive: "killed-by" },
};

/** A single supersession relationship, phrased from the selected node's point of view. */
export type SupersessionLink = {
  /** Stable key = the lineage edge id. */
  id: string;
  direction: SupersessionDirection;
  /** Human phrase, e.g. "Superseded by". */
  label: string;
  /** The other artifact's display title (may be empty if unhydrated). */
  peerTitle: string;
  peerKind: string;
  peerId: string;
  /** True when this link means the selected node's OWN belief was revised by a later outcome. */
  retiresSelf: boolean;
  /**
   * Bi-temporal: this supersession assertion is no longer current (its `valid_to`
   * was stamped because a later outcome reversed it). Invalidate-don't-delete, so
   * the retired belief stays visible as history. False until the engine + the
   * migration's `valid_to` column are live (the field is simply absent before then).
   */
  retired: boolean;
  /** When the assertion stopped being current (ISO), or null while it still holds. */
  retiredAt: string | null;
};

export type SupersessionStory = {
  links: SupersessionLink[];
  /** The node's belief is CURRENTLY superseded/contradicted (excludes reversed-and-retired revisions). */
  revised: boolean;
};

/** The minimal lineage-row shape this helper needs (a superset of getLineage's rows). */
export type LineageRowLike = {
  id: string;
  relation?: string | null;
  peer_title?: string | null;
  parent_kind?: string | null;
  parent_id?: string | null;
  child_kind?: string | null;
  child_id?: string | null;
  /** Bi-temporal stamp; present once the DBR-1.5 migration is live, else undefined. */
  valid_to?: string | null;
};

/**
 * PURE. True for any relation that says a belief stopped being current.
 *
 * WIDENED 2026-08-02, and the widening is the point. It used to match only the
 * two active-voice spellings, so `superseded_by` (21 live rows, more than
 * `supersedes` has), `contradicted_by` and `killed_by` were read as ordinary
 * lineage: they showed up in "What it came from" as a bare relation word and
 * never once in "What this replaced". A workspace whose thinking had visibly
 * changed thirty-five times displayed sixteen of them.
 *
 * This is the same question `revisesBelief` answers, kept as its own exported
 * name because `GraphNodeStory` uses it as the FILTER that stops a revision
 * appearing twice, and that pairing has to move in lockstep with
 * `buildSupersessionStory` below or a row renders in both lists at once.
 */
export function isSupersessionRelation(raw: string | null | undefined): boolean {
  return revisesBelief(raw);
}

/**
 * PURE. Build the selected node's supersession "decision history" from the
 * `ancestors` (edges INTO the node, peer is the parent) and `descendants`
 * (edges OUT, peer is the child) that getLineage returns.
 *
 * Direction logic (an edge always reads parent --relation--> child):
 *  - ancestor + `supersedes`  => parent supersedes THIS node => "Superseded by parent" (self revised)
 *  - ancestor + `contradicts` => "Contradicted by parent" (self revised)
 *  - descendant + `supersedes`  => THIS node supersedes child => "Supersedes child"
 *  - descendant + `contradicts` => "Contradicts child"
 *
 * Self-revised links are listed first, and CURRENT links before retired ones (the
 * bi-temporal `valid_to`): a reversed-and-retired assertion stays visible as history
 * but is de-emphasized. Fail-safe on malformed / non-array input; dedups by edge id
 * so a self-loop can't double-count.
 */
export function buildSupersessionStory(
  ancestors: LineageRowLike[] | null | undefined,
  descendants: LineageRowLike[] | null | undefined,
): SupersessionStory {
  const links: SupersessionLink[] = [];
  const seen = new Set<string>();

  const collect = (rows: LineageRowLike[] | null | undefined, peerSide: "parent" | "child") => {
    for (const r of Array.isArray(rows) ? rows : []) {
      if (!r || typeof r.id !== "string" || seen.has(r.id)) continue;
      const { family, inverted } = canonicalRelation(r.relation);
      const voice = REVISION_VOICE[family];
      if (!voice) continue;
      // The stored edge always runs parent -> child. The ACTOR is the parent
      // unless the spelling inverted it. `peerSide` names where the PEER sits, so
      // the selected node sits on the other one.
      const selfIsParent = peerSide === "child";
      const actorIsParent = !inverted;
      const direction = selfIsParent === actorIsParent ? voice.active : voice.passive;
      seen.add(r.id);
      const peerKind = (peerSide === "parent" ? r.parent_kind : r.child_kind) ?? "";
      const peerId = (peerSide === "parent" ? r.parent_id : r.child_id) ?? "";
      const retiredAt = typeof r.valid_to === "string" && r.valid_to.trim() ? r.valid_to : null;
      links.push({
        id: r.id,
        direction,
        label: SUPERSESSION_LABEL[direction],
        peerTitle: (r.peer_title ?? "").trim(),
        peerKind,
        peerId,
        retiresSelf: direction.endsWith("-by"),
        retired: retiredAt !== null,
        retiredAt,
      });
    }
  };

  collect(ancestors, "parent");
  collect(descendants, "child");

  // Current links before retired ones, and within each group the links that
  // revise the SELECTED node's own belief first, because that is the sentence the
  // reader came for. "Self-revised first" used to be a side effect of walking the
  // ancestors first, which held only while the vocabulary was active-voice: an
  // ancestor carrying `superseded_by` means the selected node did the replacing,
  // not that it was replaced, so the position no longer implies the direction.
  const rank = (l: SupersessionLink) => (l.retired ? 2 : 0) + (l.retiresSelf ? 0 : 1);
  const ordered = links
    .map((l, i) => ({ l, i }))
    .sort((a, b) => rank(a.l) - rank(b.l) || a.i - b.i)
    .map(({ l }) => l);

  // "Revised" reflects the node's belief RIGHT NOW: a self-retiring link that has
  // itself been reversed (retired) no longer means the belief is currently revised.
  return { links: ordered, revised: ordered.some((l) => l.retiresSelf && !l.retired) };
}
