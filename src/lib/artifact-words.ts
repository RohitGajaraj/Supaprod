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
 * Title Case map cannot do both; this one does. `KIND_LABEL` below is the
 * Title Case form: an exhaustive `Record<ArtifactKind>` over a typed union,
 * and that exhaustiveness is a real check worth keeping. It lived in
 * `LineageDrawer.tsx` until that drawer's only mount (/decide) went with P-14
 * and the drawer itself was deleted (2026-09-08); the map is the part every
 * surface still reads. The words here are taken from it, so the two never
 * disagree.
 *
 * PURE: no server import, no DB, no component. Unit-tested in
 * artifact-words.test.ts.
 */
import type { ArtifactKind } from "@/lib/lineage.functions";

/** The Title Case word for each kind, read after a word ("1 Finding", "How this finding connects"). */
export const KIND_LABEL: Record<ArtifactKind, string> = {
  /*
   * "Finding", not "What we found", and the reason is one line below at the
   * heading: this map is read through `.toLowerCase()` into "How this {label}
   * connects across the product lifecycle." The heading form rendered "How this
   * what we found connects", which is the same defect as "1 what we found" with
   * a demonstrative in place of a number. Section 12 offers the heading form and
   * it is correct over a panel; it is wrong the moment anything puts a word in
   * front of it. `a-counted-word-is-a-noun-not-a-heading` watches this map, so a
   * heading form cannot creep back in.
   */
  signal: "Finding",
  theme: "Theme",
  opportunity: "Opportunity",
  // LOOM W2: the IA word is "spec" on every user-facing surface; the
  // ArtifactKind stays `prd` (internal identifier, CLAUDE.md disclaimer).
  prd: "Spec",
  roadmap_item: "Roadmap item",
  task: "Task",
  meeting: "Meeting",
  decision: "Decision",
  mission: "Build session",
  house_rule: "House rule",
  design_memory: "Design memory",
  // "Mockup", not "Prototype": the generator forbids <script> and produces one
  // static screen, so the word promised interactivity the artifact does not
  // have. The DB kind is unchanged; this is the reader's word for it.
  prototype: "Mockup",
  capability_change: "Capability change",
  // Added 2026-08-02 with the four kinds a live census found stored but declared
  // nowhere. Plain words, per the voice convention: what the thing IS to a
  // product manager, not the table it came from. "Outcome" rather than
  // "learning", because that is the word every other surface uses for the
  // verdict on a shipped spec.
  learning: "Outcome",
  deployment: "Deployment",
  changeset: "Code change",
  prd_scaffold: "Drawing",
  prd_flow: "Flow",
};

const ARTIFACT_WORDS: Record<string, string> = {
  // The audit vocabulary.
  // §12: a practitioner does not say "signals". Display word only; the stored
  // `artifact_kind` is still `signal`.
  signal: "finding",
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
