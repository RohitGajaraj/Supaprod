/**
 * Opportunity Trace: Walk lineage backward from changesets/missions/releases to source opportunities.
 *
 * Enables displaying the "origin bet" through the workflow chain (Plan→Build→Ship),
 * letting users trace decisions back to their source signal and reasoning.
 *
 * Data flow:
 *   Opportunity → Spec (PRD via opportunity_id)
 *   Spec → Mission (via prd→mission lineage edge)
 *   Mission → Changeset (via mission_id)
 *   Changeset → Release (via changeset_id in changelog)
 */

import type { SupabaseClient } from "@supabase/supabase-js";

export type OpportunityTrace = {
  id: string;
  title: string;
};

/**
 * Trace a spec (PRD) backward to its source opportunity.
 * Direct lookup via opportunity_id column on prds table.
 */
export async function traceOpportunityForSpec(
  supabase: SupabaseClient,
  specId: string,
): Promise<OpportunityTrace | null> {
  const { data, error } = await supabase
    .from("prds")
    .select("opportunity_id")
    .eq("id", specId)
    .maybeSingle();

  if (error || !data) return null;

  const opportunityId = (data as { opportunity_id: string | null }).opportunity_id;
  if (!opportunityId) return null;

  const { data: opp, error: oppErr } = await supabase
    .from("opportunities")
    .select("id,title")
    .eq("id", opportunityId)
    .maybeSingle();

  if (oppErr || !opp) return null;

  return {
    id: (opp as { id: string; title: string }).id,
    title: (opp as { id: string; title: string }).title,
  };
}

/**
 * Trace a mission backward to its source opportunity via the spec it was dispatched from.
 * Walks: mission ← prd (via lineage edge) ← opportunity (via opportunity_id)
 */
export async function traceOpportunityForMission(
  supabase: SupabaseClient,
  missionId: string,
): Promise<OpportunityTrace | null> {
  // Walk lineage: find the spec (prd) that dispatched this mission
  const { data: edges, error: edgeErr } = await supabase
    .from("artifact_lineage")
    .select("parent_kind,parent_id")
    .eq("child_kind", "mission")
    .eq("child_id", missionId)
    .eq("relation", "dispatched")
    .maybeSingle();

  if (edgeErr || !edges) return null;

  const edge = edges as { parent_kind: string; parent_id: string };
  if (edge.parent_kind !== "prd") return null;

  // Now trace the spec to its opportunity
  return traceOpportunityForSpec(supabase, edge.parent_id);
}

/**
 * Trace a changeset backward to its source opportunity via its mission and spec.
 * Walks: changeset ← mission (via mission_id) ← prd (via lineage) ← opportunity
 */
export async function traceOpportunityForChangeset(
  supabase: SupabaseClient,
  changesetId: string,
): Promise<OpportunityTrace | null> {
  // Get the mission from the changeset
  const { data: changeset, error: csErr } = await supabase
    .from("studio_changesets")
    .select("mission_id")
    .eq("id", changesetId)
    .maybeSingle();

  if (csErr || !changeset) return null;

  const missionId = (changeset as { mission_id: string | null }).mission_id;
  if (!missionId) return null;

  // Trace the mission to opportunity
  return traceOpportunityForMission(supabase, missionId);
}

/**
 * Trace a changelog entry (release) backward to its source opportunity.
 * Walks: changelog ← changeset ← mission ← prd ← opportunity
 */
export async function traceOpportunityForRelease(
  supabase: SupabaseClient,
  changelogEntryId: string,
): Promise<OpportunityTrace | null> {
  // Get the changeset from the changelog entry
  const { data: entry, error: entErr } = await supabase
    .from("changelog_entries")
    .select("changeset_id")
    .eq("id", changelogEntryId)
    .maybeSingle();

  if (entErr || !entry) return null;

  const changesetId = (entry as { changeset_id: string | null }).changeset_id;
  if (!changesetId) return null;

  // Trace the changeset to opportunity
  return traceOpportunityForChangeset(supabase, changesetId);
}
