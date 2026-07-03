/**
 * AGT-01 - structured-output protocol upgrade. Translates a tool's existing
 * zod `argsSchema` (already the enforcement point for every tool call today)
 * into the JSON-Schema shape native provider tool-calling APIs expect
 * (Anthropic's `input_schema`, OpenAI-compat's `function.parameters`).
 *
 * This is additive, read-only infrastructure: it does not change how any
 * tool is defined or validated. `argsSchema.safeParse` in loop.server.ts
 * stays the real enforcement point regardless of which protocol produced the
 * args (native tool-call or the legacy JSON-in-text envelope).
 *
 * Known limitation (deliberate, not a bug): `z.record()` fields (the open
 * `context` map on agent.handoff/agent.spawn) translate to
 * `{"type":"object","additionalProperties":{}}`, a valid JSON Schema that
 * Anthropic's tool_use and generic OpenAI-compat/gateway dispatch both
 * accept. OpenAI's *strict* function-calling mode specifically rejects this
 * (it requires `additionalProperties:false` + every property enumerated) -  * this codebase does not use OpenAI's strict mode (no official SDK is
 * imported anywhere in runtime.server.ts; every provider call is a raw
 * fetch), so this is a documented non-issue for every route this ships on
 * today, not an unhandled edge case.
 */
import { zodToJsonSchema } from "zod-to-json-schema";
import { TOOL_REGISTRY, type ToolDef } from "./tools/registry.server";

export type NativeToolDef = {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
};

/**
 * Convert one tool's zod `argsSchema` into a plain JSON-Schema object safe to
 * hand a provider as a tool's input schema. `$refStrategy: "none"` inlines
 * everything (no `$ref`/`definitions`) since every registered tool's schema
 * is small and non-recursive - providers vary in `$ref` support, inlining
 * sidesteps that variance entirely. The `$schema` meta key zod-to-json-schema
 * adds is stripped: it describes the JSON-Schema dialect, not the tool.
 */
export function toolInputSchema(argsSchema: ToolDef["argsSchema"]): Record<string, unknown> {
  const full = zodToJsonSchema(argsSchema, { $refStrategy: "none" }) as Record<string, unknown>;
  const { $schema: _drop, ...rest } = full;
  return rest;
}

/**
 * Build native tool-call definitions for a list of enabled tool names,
 * mirroring exactly the enabled-tool set `describeToolsForPrompt` renders as
 * text today (same source list, same tools - only the wire shape differs).
 * A name absent from TOOL_REGISTRY is silently skipped (the loop's own
 * "Unknown tool" check downstream is the real enforcement; this is prompt
 * construction, not validation).
 */
export function buildNativeToolDefs(toolNames: Iterable<string>): NativeToolDef[] {
  const defs: NativeToolDef[] = [];
  for (const name of toolNames) {
    const def = TOOL_REGISTRY[name];
    if (!def) continue;
    defs.push({
      name: def.name,
      description: def.description,
      input_schema: toolInputSchema(def.argsSchema),
    });
  }
  return defs;
}
