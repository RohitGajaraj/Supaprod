/**
 * DSN-04: the design contract rides the BuildSpec (v12 §6).
 *
 * `studio.functions.ts`'s `dispatchStudioSession` folds the workspace's
 * standing design language (DSN-01) and the PRD's flow graph (DSN-03) into
 * the mission goal, so the building agent sees the same design contract a
 * human reviewer would. This module closes the return half: once a mission's
 * changeset comes back with a PR, `checkDesignParity` records a lightweight
 * parity signal — did the returning work actually mention the tokens or flow
 * states it was handed — as a real `artifact_lineage` edge, the same
 * idempotent-receipt pattern JNY-03's test station uses for `test_verdict`.
 *
 * Deliberately "lightweight": this checks the changeset's own recorded
 * title/summary text for the tokens/flow-state vocabulary it was given, not
 * a full PR diff (BuildDriver, the seam that would let Cadence fetch and
 * grade a diff against the design contract mechanically, does not exist in
 * code yet — see docs/strategy/build-driver-and-dispatch.md). A real, honest
 * signal today; a deeper check is BuildDriver's job later.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  getActiveDesignMemoryForWorkspace,
  type DesignMemoryRow,
} from "@/lib/design-memory.functions";

export type PrdFlowRow = { steps: Array<{ label?: string }>; edges: unknown[] } | null;

/** PURE. Renders a PRD's flow graph as a text block for the mission goal. Empty/missing flow renders nothing. */
export function formatFlowContext(flow: PrdFlowRow): string {
  if (!flow || !Array.isArray(flow.steps) || flow.steps.length === 0) return "";
  const labels = flow.steps.map((s) => s.label).filter((l): l is string => !!l);
  if (labels.length === 0) return "";
  return [
    "User flow (the states/steps this spec walks through, in order - use these, not an invented path):",
    ...labels.map((l, i) => `  ${i + 1}. ${l}`),
  ].join("\n");
}

export type DesignParityVerdict = "aligned" | "unverified" | "no_context";

export type DesignParitySignal = {
  verdict: DesignParityVerdict;
  matched: string[];
  expected: string[];
};

/**
 * PURE. The lightweight parity check: how many of the design categories and
 * flow-step labels the mission was handed actually show up (case-insensitive
 * substring) in the changeset's own title + summary text. `no_context` when
 * the PRD had nothing to check against (no design memory, no flow) - never a
 * false "unverified" for a spec that legitimately had no design contract.
 */
export function computeDesignParity(changesetText: string, expected: string[]): DesignParitySignal {
  const uniqueExpected = Array.from(new Set(expected.filter((e) => e.trim().length > 0)));
  if (uniqueExpected.length === 0) return { verdict: "no_context", matched: [], expected: [] };
  const haystack = changesetText.toLowerCase();
  const matched = uniqueExpected.filter((e) => haystack.includes(e.toLowerCase()));
  return {
    verdict: matched.length > 0 ? "aligned" : "unverified",
    matched,
    expected: uniqueExpected,
  };
}

// Match on the design memory's own `title` (e.g. "Accent color", "Button
// styles"), never the bare `category` bucket ("type", "voice", "pattern") —
// those are generic English words that would false-positive-match almost any
// changeset summary ("type" hits "TypeScript", "voice" hits "invoice"), the
// exact opposite of a meaningful parity signal. `title` is what the building
// agent actually saw via `formatDesignMemoryContext`, so matching on it keeps
// the return-side check honest about what was handed over.
function designMemoryTitles(rows: DesignMemoryRow[]): string[] {
  return rows.map((r) => r.title.trim()).filter((t) => t.length > 0);
}

type MissionChangeset = {
  id: string;
  prd_id: string | null;
  title: string | null;
  summary: string | null;
  pr_url: string | null;
};

async function resolveMissionChangeset(
  supabase: SupabaseClient,
  missionId: string,
): Promise<MissionChangeset | null> {
  const { data } = await supabase
    .from("studio_changesets")
    .select("id,prd_id,title,summary,pr_url")
    .eq("mission_id", missionId)
    .not("prd_id", "is", null)
    .neq("status", "abandoned")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as MissionChangeset | null) ?? null;
}

export type DesignParityResult =
  | { available: false; reason: "no_prd" | "no_pr_yet" }
  | { available: true; signal: DesignParitySignal; alreadyRecorded: boolean };

async function loadDesignParity(
  supabase: SupabaseClient,
  missionId: string,
): Promise<{
  result: DesignParityResult;
  changeset: MissionChangeset | null;
  prdId: string | null;
}> {
  const changeset = await resolveMissionChangeset(supabase, missionId);
  if (!changeset || !changeset.prd_id) {
    return { result: { available: false, reason: "no_prd" }, changeset, prdId: null };
  }
  if (!changeset.pr_url) {
    return {
      result: { available: false, reason: "no_pr_yet" },
      changeset,
      prdId: changeset.prd_id,
    };
  }

  const { data: prd } = await supabase
    .from("prds")
    .select("workspace_id")
    .eq("id", changeset.prd_id)
    .single();
  const workspaceId = (prd as { workspace_id?: string } | null)?.workspace_id ?? null;

  const [designMemory, flowRow] = await Promise.all([
    workspaceId ? getActiveDesignMemoryForWorkspace(supabase, workspaceId) : Promise.resolve([]),
    supabase.from("prd_flows").select("steps,edges").eq("prd_id", changeset.prd_id).maybeSingle(),
  ]);
  const flow = (flowRow.data as PrdFlowRow) ?? null;
  const expected = [
    ...designMemoryTitles(designMemory),
    ...(flow?.steps ?? []).map((s) => s.label).filter((l): l is string => !!l),
  ];
  const changesetText = `${changeset.title ?? ""} ${changeset.summary ?? ""}`;
  const signal = computeDesignParity(changesetText, expected);

  const { data: existing } = await supabase
    .from("artifact_lineage")
    .select("id")
    .eq("parent_kind", "mission")
    .eq("parent_id", missionId)
    .eq("relation", "design_parity")
    .limit(1)
    .maybeSingle();

  return {
    result: { available: true, signal, alreadyRecorded: !!existing },
    changeset,
    prdId: changeset.prd_id,
  };
}

export const getDesignParity = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ missionId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as SupabaseClient;
    const { result } = await loadDesignParity(supabase, data.missionId);
    return result;
  });

export const checkDesignParity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ missionId: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    const supabase = context.supabase as SupabaseClient;
    const userId = context.userId as string;
    const { result, prdId } = await loadDesignParity(supabase, data.missionId);
    if (!result.available) return { ok: false as const, reason: result.reason };
    if (!prdId) return { ok: false as const, reason: "no_prd" as const };

    if (!result.alreadyRecorded) {
      const { signal } = result;
      const rationale =
        signal.verdict === "no_context"
          ? "Design parity: no design memory or flow to check against."
          : signal.verdict === "aligned"
            ? `Design parity: aligned. Matched ${signal.matched.length} of ${signal.expected.length} expected design/flow reference(s).`
            : `Design parity: unverified. None of ${signal.expected.length} expected design/flow reference(s) appeared in the returning changeset's title or summary.`;
      const { error } = await supabase.from("artifact_lineage").insert({
        user_id: userId,
        parent_kind: "mission",
        parent_id: data.missionId,
        child_kind: "prd",
        child_id: prdId,
        relation: "design_parity",
        rationale,
      });
      if (error) throw new Error(error.message);
    }
    return { ok: true as const, signal: result.signal };
  });
