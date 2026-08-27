/**
 * The word a person uses for each kind of record, mid-sentence.
 *
 * WHY THIS EXISTS. Three vocabularies write kind strings into
 * `artifact_lineage` and its readers: the audit vocabulary (audit-id.ts), the
 * lineage vocabulary (lineage.functions.ts), and a handful of kinds that exist
 * only as edge-table strings. Roughly half of them are table names wearing a
 * badge - `prd`, `house_rule`, `design_memory`, `capability_change`,
 * `prd_scaffold`, `changeset`. Printed raw on a provenance row they tell the
 * reader what our schema is called and nothing about what they are looking at,
 * which is the engine talking on a surface that exists to be legible.
 *
 * LOWERCASE ON PURPOSE. These words land inside sentences ("a design rule we
 * could not read") and inside chips the stylesheet already uppercases. A
 * Title Case map cannot do both; this one does. `LineageDrawer`'s
 * `KIND_LABEL` stays as it is - it is an exhaustive `Record<ArtifactKind>`
 * over a typed union, and that exhaustiveness is a real check worth keeping.
 * The words here are taken from it, so the two never disagree.
 *
 * PURE: no server import, no DB, no component. Unit-tested in
 * artifact-words.test.ts.
 */

const ARTIFACT_WORDS: Record<string, string> = {
  // The audit vocabulary.
  signal: "thing we found",
  opportunity: "opportunity",
  decision: "decision",
  spec: "spec",
  goal: "goal",
  prototype: "prototype",
  mission: "mission",
  release: "release",
  meeting: "meeting",
  memory: "memory",
  doc: "doc",

  // The lineage vocabulary's own name for a spec. The IA word is "spec" on
  // every user-facing surface; the stored kind stays `prd`.
  prd: "spec",

  theme: "theme",
  task: "task",
  roadmap_item: "roadmap item",

  // The ones that read as schema unless they are translated.
  house_rule: "standing rule",
  design_memory: "design rule",
  capability_change: "capability change",
  changeset: "code change",
  deployment: "deployment",
  prd_scaffold: "drawing",
  prd_flow: "flow",

  // "Outcome" rather than "learning": that is the word every other surface
  // uses for the verdict on a shipped spec.
  learning: "outcome",
};

/**
 * The reader's word for a kind. A kind this map has never seen loses its
 * underscores and nothing else, so a new artifact kind reads as English on the
 * day it ships rather than waiting for a map entry. Blank input reads "record",
 * which is true of everything here and claims nothing.
 */
export function artifactWord(kind: string | null | undefined): string {
  const k = kind?.trim();
  if (!k) return "record";
  return ARTIFACT_WORDS[k] ?? k.replace(/_/g, " ");
}

/**
 * How one record backs another, in words. The edge table stores `derived_from`
 * and `design_parity`; a reader is owed the phrase, not the key. An absent
 * relation reads "linked", which is the only thing an edge with no relation
 * actually asserts.
 */
export function relationWord(relation: string | null | undefined): string {
  const r = relation?.trim();
  return r ? r.replace(/_/g, " ") : "linked";
}
