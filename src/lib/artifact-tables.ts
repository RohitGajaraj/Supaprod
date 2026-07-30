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
};

/**
 * Where a kind's rows live, or `undefined` when the kind has no backing table.
 * Callers must treat `undefined` as "leave it unresolved", never as "guess a table".
 */
export function artifactTable(kind: string): ArtifactTableSpec | undefined {
  return ARTIFACT_TABLES[kind];
}
