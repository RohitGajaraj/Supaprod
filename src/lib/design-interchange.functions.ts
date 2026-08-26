/**
 * Design Memory Interchange: schema definition and round-trip parsers for design.md.
 *
 * Enables export of Memory/Brain data to design.md format (Supaprod doc convention)
 * and import of external design.md files into the memory graph.
 *
 * Schema: sections for principles, components, patterns, tokens, interactions,
 * audit trail with dates + sources.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Design Memory document schema (internal representation).
 */
export interface DesignMemoryDocument {
  title: string;
  version: string;
  created_at: string;
  updated_at: string;
  principles: DesignPrinciple[];
  components: DesignComponent[];
  patterns: DesignPattern[];
  tokens: DesignToken[];
  interactions: DesignInteraction[];
  audit: AuditEntry[];
}

export interface DesignPrinciple {
  id: string;
  name: string;
  description: string;
  rationale?: string;
  evidence?: string[];
}

export interface DesignComponent {
  id: string;
  name: string;
  category: string;
  spec: string;
  visual_ref?: string;
  status: "draft" | "approved" | "implemented";
}

export interface DesignPattern {
  id: string;
  name: string;
  use_case: string;
  anatomy: string;
  do_dont?: { do: string[]; dont: string[] };
}

export interface DesignToken {
  id: string;
  category: "color" | "spacing" | "typography" | "motion" | "elevation";
  name: string;
  value: string;
  description?: string;
}

export interface DesignInteraction {
  id: string;
  scenario: string;
  affordance: string;
  feedback: string;
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  author: string;
  notes?: string;
}

/**
 * Parse a design.md document and extract structured memory.
 * Handles the Supaprod design.md convention (markdown with YAML frontmatter).
 */
export function parseDesignMd(markdown: string): DesignMemoryDocument {
  const doc: DesignMemoryDocument = {
    title: "Imported Design Memory",
    version: "1.0",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    principles: [],
    components: [],
    patterns: [],
    tokens: [],
    interactions: [],
    audit: [],
  };

  // Simple regex-based extraction; a real parser would use a markdown AST.
  const titleMatch = markdown.match(/^#\s+(.+?)$/m);
  if (titleMatch) {
    doc.title = titleMatch[1];
  }

  // Extract principles section (## Principles)
  const principlesMatch = markdown.match(/^##\s+Principles\s*\n([\s\S]*?)(?=^##\s+|\Z)/m);
  if (principlesMatch) {
    const principlesText = principlesMatch[1];
    const items = principlesText.split(/^###\s+/m).slice(1);
    items.forEach((item, idx) => {
      const [name, ...rest] = item.split("\n");
      const description = rest
        .filter((line) => line.trim().length > 0 && !line.startsWith("**"))
        .join("\n")
        .trim();
      if (name.trim()) {
        doc.principles.push({
          id: `principle-${idx}`,
          name: name.trim(),
          description: description,
        });
      }
    });
  }

  // Extract components section (## Components)
  const componentsMatch = markdown.match(/^##\s+Components\s*\n([\s\S]*?)(?=^##\s+|\Z)/m);
  if (componentsMatch) {
    const componentsText = componentsMatch[1];
    const items = componentsText.split(/^\|\s+/m).slice(1);
    items.forEach((item, idx) => {
      const cols = item.split(/\s*\|\s*/).slice(0, 4);
      if (cols.length >= 2) {
        doc.components.push({
          id: `component-${idx}`,
          name: cols[0]?.trim() || `Component ${idx}`,
          category: cols[1]?.trim() || "general",
          spec: cols[2]?.trim() || "",
          status: "draft",
        });
      }
    });
  }

  // Extract tokens section (## Design Tokens)
  const tokensMatch = markdown.match(/^##\s+Design Tokens\s*\n([\s\S]*?)(?=^##\s+|\Z)/m);
  if (tokensMatch) {
    const tokensText = tokensMatch[1];
    const lines = tokensText.split("\n");
    lines.forEach((line, idx) => {
      const match = line.match(/^-\s+`(.+?)`:\s+(.+?)(?:\s*—\s*(.+))?$/);
      if (match) {
        const [, name, value, description] = match;
        const category = name.includes("color")
          ? ("color" as const)
          : name.includes("space")
            ? ("spacing" as const)
            : name.includes("type") || name.includes("font")
              ? ("typography" as const)
              : ("motion" as const);
        doc.tokens.push({
          id: `token-${idx}`,
          category,
          name,
          value,
          description,
        });
      }
    });
  }

  // Add audit entry for import
  doc.audit.push({
    timestamp: new Date().toISOString(),
    action: "import",
    author: "system",
    notes: "Imported from design.md file",
  });

  return doc;
}

/**
 * Render a DesignMemoryDocument back to design.md format.
 * Produces the canonical Supaprod design.md structure.
 */
export function renderDesignMd(doc: DesignMemoryDocument): string {
  const lines: string[] = [];

  lines.push(`# ${doc.title}`);
  lines.push(
    `\n> _Created: ${new Date(doc.created_at).toLocaleDateString()} · Last updated: ${new Date(doc.updated_at).toLocaleDateString()}_\n`,
  );

  if (doc.principles.length > 0) {
    lines.push("## Principles\n");
    doc.principles.forEach((p) => {
      lines.push(`### ${p.name}\n`);
      lines.push(`${p.description}\n`);
      if (p.rationale) {
        lines.push(`**Rationale:** ${p.rationale}\n`);
      }
    });
  }

  if (doc.components.length > 0) {
    lines.push("## Components\n");
    lines.push("| Component | Category | Spec | Status |");
    lines.push("|-----------|----------|------|--------|");
    doc.components.forEach((c) => {
      lines.push(`| ${c.name} | ${c.category} | ${c.spec} | ${c.status} |`);
    });
    lines.push("");
  }

  if (doc.patterns.length > 0) {
    lines.push("## Patterns\n");
    doc.patterns.forEach((p) => {
      lines.push(`### ${p.name}\n`);
      lines.push(`**Use case:** ${p.use_case}\n`);
      lines.push(`**Anatomy:** ${p.anatomy}\n`);
    });
  }

  if (doc.tokens.length > 0) {
    lines.push("## Design Tokens\n");
    doc.tokens.forEach((t) => {
      lines.push(`- \`${t.name}\`: ${t.value}${t.description ? ` — ${t.description}` : ""}`);
    });
    lines.push("");
  }

  if (doc.audit.length > 0) {
    lines.push("## Audit Trail\n");
    doc.audit.slice(-5).forEach((entry) => {
      lines.push(
        `- ${new Date(entry.timestamp).toISOString().split("T")[0]}: ${entry.action} (${entry.author})${entry.notes ? `: ${entry.notes}` : ""}`,
      );
    });
    lines.push("");
  }

  return lines.join("\n").trim();
}

/**
 * Server function: import design.md and upsert to the memory graph.
 */
export const importDesignMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) =>
    z.object({ markdown: z.string().max(200_000), workspaceId: z.string().uuid() }).parse(i),
  )
  .handler(async ({ data }) => {
    // Parse the markdown into structured memory.
    const doc = parseDesignMd(data.markdown);

    // TODO: wire to memory graph via memory.functions.ts
    // This is the hook point for upserting doc into decision_memory table,
    // scoped to the workspace and tagged as "design" source.

    return {
      success: true,
      parsed: doc,
      message: "Design memory imported",
    };
  });

/**
 * Server function: export memory to design.md format.
 */
export const exportDesignMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((i: unknown) => z.object({ workspaceId: z.string().uuid() }).parse(i))
  .handler(async ({ context }) => {
    const { userId } = context;

    // TODO: fetch the memory graph and assemble into DesignMemoryDocument
    // For now, return a sample doc.
    const sampleDoc: DesignMemoryDocument = {
      title: "Design Memory Export",
      version: "1.0",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      principles: [
        {
          id: "p1",
          name: "One primary CTA per screen",
          description: "Clarity and intent. Every screen has one obvious next action.",
        },
      ],
      components: [
        {
          id: "c1",
          name: "Button",
          category: "control",
          spec: "32/36/40px height, Geist Sans label, ember accent as primary",
          status: "implemented",
        },
      ],
      patterns: [],
      tokens: [
        {
          id: "t1",
          category: "color",
          name: "accent-primary",
          value: "#FF6B2C",
          description: "Supaprod ember brand",
        },
      ],
      interactions: [],
      audit: [
        {
          timestamp: new Date().toISOString(),
          action: "export",
          author: userId,
          notes: "Exported from Design Memory",
        },
      ],
    };

    const markdown = renderDesignMd(sampleDoc);

    return {
      success: true,
      markdown,
      filename: `design-memory-${new Date().toISOString().split("T")[0]}.md`,
    };
  });
