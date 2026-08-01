/**
 * The one way to ask "what can this account's agents do, and how".
 *
 * WHY IT IS ONE FUNCTION. When `agent_tools` held one row per user per tool,
 * every surface could just select from it, and six of them did: the loop, the
 * settings list, the boundary, the per-agent boundary, the receipt renderer and
 * the trust ramp. Moving to platform defaults plus overrides means a raw select
 * on that table now returns only the DEVIATIONS, so every one of those surfaces
 * would silently report a shrinking list, and two of them would report none at
 * all. Six call sites each doing their own merge is six chances to do it
 * differently; the merge lives here instead.
 *
 * The pure part is in ./defaults.ts and is unit-tested without a database. This
 * module only adds the read and the registry's display metadata, which is why it
 * is `.server.ts`: `registry.server.ts` is worker-only.
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import { TOOL_REGISTRY } from "@/lib/ai/tools/registry.server";
import {
  TOOL_DEFAULTS,
  UNLISTED_TOOL_DEFAULT,
  resolveToolAccess,
  type ToolMode,
} from "@/lib/ai/tools/defaults";

export type EffectiveTool = {
  tool_name: string;
  display_name: string;
  description: string;
  category: string;
  mode: ToolMode;
  enabled: boolean;
  /** True when no override exists, so the value in force is the platform's. */
  is_default: boolean;
};

/** Every override this account has stored. Absent rows are not denials. */
async function loadOverrides(supabase: SupabaseClient, userId: string) {
  const { data } = await supabase
    .from("agent_tools")
    .select("tool_name,mode,enabled")
    .eq("user_id", userId);
  return (data ?? []) as Array<{ tool_name: string; mode: string | null; enabled: boolean | null }>;
}

/**
 * The full tool list for an account, platform policy with its overrides applied.
 *
 * Includes tools the account has switched OFF, flagged by `enabled`, because the
 * settings and boundary surfaces have to render a disabled tool in order to let
 * somebody switch it back on. The loop uses `resolveToolAccess` directly, which
 * drops them.
 */
export async function loadAccountTools(
  supabase: SupabaseClient,
  userId: string,
): Promise<EffectiveTool[]> {
  const overrides = await loadOverrides(supabase, userId);
  const byName = new Map(overrides.map((o) => [o.tool_name, o]));

  return Object.values(TOOL_REGISTRY)
    .map((def) => {
      const base = TOOL_DEFAULTS[def.name] ?? UNLISTED_TOOL_DEFAULT;
      const over = byName.get(def.name);
      return {
        tool_name: def.name,
        display_name: base.label,
        description: def.description,
        category: def.category,
        mode: ((over?.mode as ToolMode | null) ?? base.mode) as ToolMode,
        enabled: over?.enabled === false ? false : base.enabled,
        is_default: !over,
      };
    })
    .sort((a, b) => a.category.localeCompare(b.category) || a.tool_name.localeCompare(b.tool_name));
}

/**
 * Effective mode per tool, for callers that only need the number.
 *
 * A tool absent from the map is one the account has switched off, which is
 * different from one it has no opinion about; the latter is present, carrying
 * the platform default.
 */
export async function loadToolModes(
  supabase: SupabaseClient,
  userId: string,
): Promise<Map<string, ToolMode>> {
  const access = resolveToolAccess(
    Object.keys(TOOL_REGISTRY),
    await loadOverrides(supabase, userId),
  );
  return new Map(access.map((a) => [a.tool_name, a.mode]));
}
