// CNV-03 · the ARD (Agent Requirements Document) — the public, versioned wire
// format for the Outcome Contract (CNV-01/CNV-02/CNV-04). Pure — no DB, no
// network. The typed source of truth stays `OutcomeContractSchema` in
// discovery.functions.ts; this module only wraps it in a portable envelope
// and mirrors it as a plain JSON Schema for consumers that are not
// TypeScript/Zod (external coding agents, non-JS MCP clients).
//
// "ARD" is the published name of the standard; the mechanics underneath are
// the same Outcome Contract Supaprod itself already enforces (intent, success
// metrics with their proof oracle, non-goals, budget, ambiguity policy) — a
// dispatched coding agent (Devin/OpenHands/Claude Agent SDK adapters, or any
// MCP client) receives the identical acceptance contract Supaprod checks
// against, not a re-parsed prose summary.
import { OutcomeContractSchema, type OutcomeContract } from "@/lib/discovery.functions";

export const ARD_SCHEMA_VERSION = "0.1";
export const ARD_SCHEMA_PATH = "/api/public/ard/schema";

/** SW-4 / mission 3.4: the design contract riding a Build dispatch. The
 *  workspace's standing design memory (tokens, type, spacing, principles),
 *  the spec's flow graph, and the gate-reviewed scaffold mockup travel as
 *  structured fields, not just prose, so a dispatched engine receives the
 *  same design contract the human design gate approved. */
export interface ArdDesignSection {
  memory: Array<{ category: string; title: string; content: string }>;
  flow_steps: unknown | null;
  scaffold_html: string | null;
}

/** The portable ARD document: an Outcome Contract plus export provenance. */
export interface ArdDocument {
  ard_version: string;
  schema_url: string;
  spec_id: string;
  spec_title: string;
  exported_at: string;
  contract: OutcomeContract;
  /** Present when the design station has anything to hand the build. */
  design?: ArdDesignSection;
}

const CONTRACT_CLAUSE_JSON_SCHEMA = {
  type: "object",
  description:
    "A single, individually-supersedable requirement clause (a success metric or a non-goal).",
  properties: {
    id: { type: "string", format: "uuid" },
    text: { type: "string", minLength: 1, maxLength: 2000 },
    status: { type: "string", enum: ["standing", "superseded"] },
    superseded_by: { type: ["string", "null"], format: "uuid" },
    oracle_kind: {
      type: ["string", "null"],
      enum: ["eval", "ci", "uat", "unverifiable", null],
      description:
        "How this clause is proven: eval = graded by an LLM judge, ci = covered by the standard CI gate, uat = a human ticks a checklist item, unverifiable = filed as a watched assumption. Null until compiled.",
    },
    oracle_ref: { type: ["string", "null"], maxLength: 2000 },
    uat_checked: { type: "boolean" },
    uat_checked_at: { type: ["string", "null"], format: "date-time" },
    measures_decision_id: {
      type: ["string", "null"],
      format: "uuid",
      description:
        "P-150: the decision whose forecast this clause measures. Set at Plan alongside decisions.forecast_clause_id; never matched by prose. Absent means nobody linked this clause to a forecast.",
    },
    created_at: { type: "string", format: "date-time" },
  },
  // `superseded_by`/`oracle_kind`/`oracle_ref` are `.nullable()` (not
  // `.optional()`) on `ContractClauseSchema`, so Zod requires the KEY present
  // (value may be null). `uat_checked`/`uat_checked_at` ARE `.optional()`, so
  // they are correctly left out of `required` here.
  required: ["id", "text", "status", "superseded_by", "oracle_kind", "oracle_ref", "created_at"],
} as const;

/**
 * PURE. The formal JSON Schema (draft 2020-12) for the ARD envelope, mirroring
 * `OutcomeContractSchema` field-for-field. `ard-schema.test.ts` guards against
 * drift: it builds a document containing only this schema's `required` keys
 * and asserts `parseArdDocument` (the live Zod validator) accepts it, so the
 * two `required` lists can never silently diverge again. `origin` makes `$id`
 * an absolute, dereferenceable URL as the JSON Schema spec expects.
 */
export function buildArdJsonSchema(origin: string) {
  return {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    $id: `${origin}${ARD_SCHEMA_PATH}`,
    title: "Supaprod Agent Requirements Document (ARD)",
    description:
      "The published wire format for Supaprod's Outcome Contract. A typed, versioned acceptance contract a spec carries: intent, success metrics with their proof oracle, non-goals, a budget, and an ambiguity policy. The same contract Supaprod itself checks a build against.",
    type: "object",
    properties: {
      ard_version: {
        type: "string",
        description:
          "The ARD schema version this document conforms to (semver-ish, currently 0.1).",
      },
      schema_url: { type: "string", format: "uri" },
      spec_id: { type: "string", format: "uuid" },
      spec_title: { type: "string" },
      exported_at: { type: "string", format: "date-time" },
      contract: {
        type: "object",
        properties: {
          version: { type: "integer", minimum: 1 },
          intent: { type: "string", maxLength: 2000 },
          evidence_links: {
            type: "array",
            items: {
              type: "object",
              properties: {
                source_kind: { type: "string", maxLength: 40 },
                source_id: { type: "string", maxLength: 100 },
                title: { type: ["string", "null"], maxLength: 200 },
              },
              required: ["source_kind", "source_id"],
            },
          },
          success_metrics: { type: "array", items: CONTRACT_CLAUSE_JSON_SCHEMA },
          non_goals: { type: "array", items: CONTRACT_CLAUSE_JSON_SCHEMA },
          budget: {
            type: ["object", "null"],
            properties: {
              estimate: { type: ["string", "null"], maxLength: 200 },
              blast_radius: { type: ["string", "null"], maxLength: 500 },
            },
          },
          ambiguity_policy: { type: ["string", "null"], maxLength: 1000 },
          drafted_by: { type: "string", enum: ["agent", "human"] },
          drafted_at: { type: "string", format: "date-time" },
        },
        // `budget`/`ambiguity_policy` are `.nullable()` (not `.optional()`) on
        // `OutcomeContractSchema`, so the key must be present (value may be
        // null). `evidence_links`/`success_metrics`/`non_goals` all carry
        // `.default([])`, which Zod treats as optional on input, so they are
        // correctly left out of `required` here.
        required: ["version", "intent", "budget", "ambiguity_policy", "drafted_by", "drafted_at"],
      },
      design: {
        type: "object",
        description:
          "Optional design contract riding a Build dispatch (mission 3.4): the workspace's standing design memory, the spec's flow graph, and the gate-reviewed scaffold mockup.",
        properties: {
          memory: {
            type: "array",
            items: {
              type: "object",
              properties: {
                category: { type: "string" },
                title: { type: "string" },
                content: { type: "string" },
              },
              required: ["category", "title", "content"],
            },
          },
          flow_steps: {
            description: "The spec's flow graph steps (DSN-03), shape-free by design.",
          },
          scaffold_html: { type: ["string", "null"] },
        },
        required: ["memory", "flow_steps", "scaffold_html"],
      },
    },
    required: ["ard_version", "spec_id", "contract"],
  } as const;
}

/**
 * PURE. Wrap a spec's Outcome Contract in the portable ARD envelope. This is
 * the "export" half — the same object a spec's Contract tab downloads, and
 * what the MCP `get_ard` tool returns to a dispatched agent.
 */
export function buildArdDocument(
  origin: string,
  specId: string,
  specTitle: string,
  contract: OutcomeContract,
  exportedAt: string = new Date().toISOString(),
  design?: ArdDesignSection | null,
): ArdDocument {
  return {
    ard_version: ARD_SCHEMA_VERSION,
    schema_url: `${origin}${ARD_SCHEMA_PATH}`,
    spec_id: specId,
    spec_title: specTitle,
    exported_at: exportedAt,
    contract,
    ...(design ? { design } : {}),
  };
}

export type ArdParseResult = { ok: true; contract: OutcomeContract } | { ok: false; error: string };

/**
 * PURE. The "import" half — validate an arbitrary JSON value against the
 * published contract schema and return the typed contract, or a human-
 * readable error. Accepts either a full ARD envelope (`{ contract: {...} }`)
 * or a bare Outcome Contract object, so a caller can hand-author just the
 * contract body without wrapping it. This is the only gate a pasted/uploaded
 * ARD document passes through before it can reach `savePrd` — the same
 * `OutcomeContractSchema` Supaprod's own draft/apply flow already enforces, so
 * an imported contract can never be less strict than an agent-drafted one.
 */
export function parseArdDocument(json: unknown): ArdParseResult {
  if (typeof json !== "object" || json === null) {
    return { ok: false, error: "Expected a JSON object" };
  }
  const candidate =
    "contract" in json && typeof (json as { contract?: unknown }).contract === "object"
      ? (json as { contract: unknown }).contract
      : json;
  const parsed = OutcomeContractSchema.safeParse(candidate);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const path = issue?.path?.length ? `${issue.path.join(".")}: ` : "";
    return { ok: false, error: `${path}${issue?.message ?? "Invalid Outcome Contract"}` };
  }
  return { ok: true, contract: parsed.data };
}
