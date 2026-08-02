/**
 * Artifact kind -> the table its rows live in, and the column holding its human title.
 *
 * THE single source of truth for that mapping. Four title-hydration paths used to carry
 * private copies of it (`lineage.functions.ts`, `knowledge-graph-explorer.functions.ts`,
 * `knowledge-graph-view.functions.ts`, `ai/shared-premise.server.ts`); they all read this
 * module now, so a schema fact is corrected in one place instead of four.
 *
 * Server-free and import-free on purpose: a `.ts`, a `.functions.ts`, and a `.server.ts`
 * can all pull it in without dragging a server module into a client bundle.
 *
 * Every table and column below was verified against `src/integrations/supabase/types.ts`.
 * That check is not optional: tsc does not typecheck a PostgREST `.select()` string, so a
 * wrong table or column compiles clean and only fails at runtime, silently, as an
 * artifact that never resolves a title.
 *
 * ABSENT ON PURPOSE: `roadmap_item`. There is no `roadmap_items` table. It appears
 * nowhere in `types.ts`, no migration in `supabase/migrations/` ever created it, and a
 * live probe answers PGRST205 "Could not find the table 'public.roadmap_items' in the
 * schema cache". A roadmap item is an `opportunities` row carrying a `roadmap_bucket`
 * (now / next / later, written by `roadmap.functions.ts`), so `opportunities` cannot
 * stand in for the kind: that table holds every plain, un-bucketed opportunity too, and
 * none of the hydration paths above can filter by bucket. A mapping that resolves to the
 * wrong rows is worse than no mapping, so the kind resolves to nothing and its nodes come
 * back unresolved. That is the honest answer until a real roadmap artifact exists.
 * `lineage-graph.functions.ts` omits it for the same reason.
 *
 * The kind itself stays a valid vocabulary member (`ARTIFACT_KINDS`, `GRAPH_NODE_KINDS`)
 * so stored edges and UI labels keep parsing. As of this writing no code path writes a
 * `roadmap_item` lineage edge and no live row uses the kind.
 */

export type ArtifactTableSpec = {
  /** Postgres table the rows of this kind live in. */
  table: string;
  /** Column on that table holding the human-readable title. */
  titleCol: string;
};

export const ARTIFACT_TABLES: Readonly<Record<string, ArtifactTableSpec>> = {
  signal: { table: "signals", titleCol: "title" },
  theme: { table: "themes", titleCol: "title" },
  opportunity: { table: "opportunities", titleCol: "title" },
  prd: { table: "prds", titleCol: "title" },
  task: { table: "tasks", titleCol: "title" },
  meeting: { table: "meetings", titleCol: "title" },
  decision: { table: "decisions", titleCol: "title" },
  mission: { table: "missions", titleCol: "title" },
  house_rule: { table: "house_rules", titleCol: "rule_text" },
  design_memory: { table: "design_memory", titleCol: "title" },
  prototype: { table: "prototypes", titleCol: "name" },
  capability_change: { table: "capability_changes", titleCol: "description" },
  // Added 2026-08-02 after a live census of artifact_lineage found four kinds
  // being WRITTEN that this map had never heard of, so their nodes reached the
  // knowledge graph with no title and rendered blank.
  //
  // `learning` is the serious one: 146 occurrences, the second most connected
  // kind in the whole graph after `decision`. In a product whose claim is that
  // it remembers what happened, the recorded outcome was the one node a reader
  // could not read. Its human sentence is `summary` (there is no `title`
  // column on `learnings`).
  learning: { table: "learnings", titleCol: "summary" },
  changeset: { table: "studio_changesets", titleCol: "title" },
};

/**
 * Kinds that appear in `artifact_lineage` and are deliberately left unmapped,
 * for the same reason `roadmap_item` is: no column on their table is a human
 * title, and a mapping that resolves to the wrong text is worse than none.
 *
 * `deployment` (42 live occurrences): `deployments` carries environment, status,
 * commit_sha and deploy_url, and no name. `environment` would label every node
 * "production" and distinguish nothing, which is a worse read than an honest
 * blank. Its real identity is environment plus commit, which this single-column
 * contract cannot express; widening the contract is the fix, not guessing here.
 *
 * `prd_scaffold` (12 live occurrences): `prd_scaffolds` is html plus a parent
 * `prd_id`. A scaffold is identified by the spec it belongs to, never by itself,
 * so its title should be resolved through its parent once hydration can follow
 * a foreign key. Recorded rather than silently ignored.
 */
export const UNMAPPED_LINEAGE_KINDS = ["deployment", "prd_scaffold", "roadmap_item"] as const;

/**
 * Where a kind's rows live, or `undefined` when the kind has no backing table.
 * Callers must treat `undefined` as "leave it unresolved", never as "guess a table".
 */
export function artifactTable(kind: string): ArtifactTableSpec | undefined {
  return ARTIFACT_TABLES[kind];
}
