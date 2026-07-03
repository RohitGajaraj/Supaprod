import { describe, it, expect } from "bun:test";
import { z } from "zod";
import { toolInputSchema, buildNativeToolDefs } from "./tool-schemas.server";
import { TOOL_REGISTRY } from "./tools/registry.server";

describe("toolInputSchema", () => {
  it("converts a flat scalar schema with no $schema/$ref noise", () => {
    const schema = toolInputSchema(z.object({ title: z.string(), count: z.number().optional() }));
    expect(schema.$schema).toBeUndefined();
    expect(schema.type).toBe("object");
    const props = schema.properties as Record<string, { type: string }>;
    expect(props.title.type).toBe("string");
    expect(props.count.type).toBe("number");
    expect(schema.required).toEqual(["title"]);
  });

  it("preserves a zod .default() as a JSON-Schema default keyword", () => {
    const schema = toolInputSchema(z.object({ limit: z.number().default(20) }));
    const props = schema.properties as Record<string, { default?: number }>;
    expect(props.limit.default).toBe(20);
  });

  it("translates an open z.record() to a valid, non-strict object schema (the documented OpenAI-strict-mode caveat)", () => {
    const schema = toolInputSchema(
      z.object({ context: z.record(z.string(), z.unknown()).optional() }),
    );
    const props = schema.properties as Record<
      string,
      { type: string; additionalProperties: unknown }
    >;
    expect(props.context.type).toBe("object");
    // additionalProperties is an open (non-false) value — a valid schema Anthropic/gateway accept.
    expect(props.context.additionalProperties).not.toBe(false);
  });

  it("agent.handoff's real context field (a z.record) converts without throwing", () => {
    const def = TOOL_REGISTRY["agent.handoff"];
    expect(def).toBeDefined();
    expect(() => toolInputSchema(def.argsSchema)).not.toThrow();
  });

  it("studio.stage's real schema converts without throwing (the op-conditional content field stays enforced only by run(), matching today's behavior — no regression)", () => {
    const def = TOOL_REGISTRY["studio.stage"];
    expect(def).toBeDefined();
    const schema = toolInputSchema(def.argsSchema);
    expect(schema.type).toBe("object");
  });
});

describe("buildNativeToolDefs", () => {
  it("builds one entry per known tool name, in order", () => {
    const defs = buildNativeToolDefs(["tasks.create", "notes.create"]);
    expect(defs.map((d) => d.name)).toEqual(["tasks.create", "notes.create"]);
    for (const d of defs) {
      expect(d.description.length).toBeGreaterThan(0);
      expect(d.input_schema.type).toBe("object");
    }
  });

  it("silently skips a name absent from TOOL_REGISTRY (prompt construction, not validation — the loop's own Unknown tool check is the real gate)", () => {
    const defs = buildNativeToolDefs(["tasks.create", "not.a.real.tool"]);
    expect(defs).toHaveLength(1);
    expect(defs[0].name).toBe("tasks.create");
  });

  it("returns every currently registered tool without throwing (a real end-to-end sweep across all 44 tools)", () => {
    const names = Object.keys(TOOL_REGISTRY);
    expect(() => buildNativeToolDefs(names)).not.toThrow();
    const defs = buildNativeToolDefs(names);
    expect(defs).toHaveLength(names.length);
  });
});
