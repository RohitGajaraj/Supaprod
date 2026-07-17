import { expect, test, describe } from "bun:test";
import { buildArdJsonSchema, buildArdDocument, parseArdDocument } from "./ard-schema";
import type { OutcomeContract } from "./discovery.functions";

const CONTRACT: OutcomeContract = {
  version: 1,
  intent: "Ship the thing",
  evidence_links: [],
  success_metrics: [
    {
      id: "11111111-1111-1111-1111-111111111111",
      text: "p95 latency under 200ms",
      status: "standing",
      superseded_by: null,
      oracle_kind: "ci",
      oracle_ref: "Covered by the standard CI gate",
      created_at: "2026-07-01T00:00:00.000Z",
    },
  ],
  non_goals: [],
  budget: { estimate: "2 days", blast_radius: null },
  ambiguity_policy: null,
  drafted_by: "human",
  drafted_at: "2026-07-01T00:00:00.000Z",
};

describe("buildArdJsonSchema (CNV-03) — the published JSON Schema for the ARD envelope", () => {
  test("$id is an absolute URL under the given origin", () => {
    const schema = buildArdJsonSchema("https://supaprod.app");
    expect(schema.$id).toBe("https://supaprod.app/api/public/ard/schema");
    expect(schema.$schema).toContain("json-schema.org");
  });

  // Regression guard: an earlier version of this schema's `required` lists
  // were a strict subset of what `OutcomeContractSchema` actually requires
  // (missing `superseded_by`/`oracle_kind`/`oracle_ref` on a clause and
  // `budget`/`ambiguity_policy` on the contract), so a document that
  // satisfied the PUBLISHED schema was rejected by the real importer. This
  // builds a document containing ONLY the keys the published schema's
  // `required` arrays list and asserts the live Zod validator still accepts
  // it — if the two ever diverge again in this direction, this fails.
  test("a document built from only the published required keys is accepted by parseArdDocument", () => {
    const schema = buildArdJsonSchema("https://supaprod.app");
    const clauseRequired = (
      schema.properties.contract.properties.success_metrics.items as { required: readonly string[] }
    ).required;
    const contractRequired = schema.properties.contract.required;

    const sample: Record<string, unknown> = {
      id: "33333333-3333-3333-3333-333333333333",
      text: "Sample clause",
      status: "standing",
      superseded_by: null,
      oracle_kind: null,
      oracle_ref: null,
      created_at: "2026-07-01T00:00:00.000Z",
    };
    const minimalClause = Object.fromEntries(clauseRequired.map((k) => [k, sample[k]]));

    const contractSample: Record<string, unknown> = {
      version: 1,
      intent: "Minimal intent",
      budget: null,
      ambiguity_policy: null,
      drafted_by: "human",
      drafted_at: "2026-07-01T00:00:00.000Z",
      success_metrics: [minimalClause],
    };
    const minimalContract = Object.fromEntries(
      [...contractRequired, "success_metrics"].map((k) => [k, contractSample[k]]),
    );

    const result = parseArdDocument({ contract: minimalContract });
    expect(result.ok).toBe(true);
  });
});

describe("buildArdDocument (CNV-03) — wraps a contract in the portable ARD envelope", () => {
  test("stamps version, schema_url, and the given spec identity", () => {
    const doc = buildArdDocument(
      "https://supaprod.app",
      "22222222-2222-2222-2222-222222222222",
      "My spec",
      CONTRACT,
      "2026-07-03T00:00:00.000Z",
    );
    expect(doc.ard_version).toBe("0.1");
    expect(doc.schema_url).toBe("https://supaprod.app/api/public/ard/schema");
    expect(doc.spec_id).toBe("22222222-2222-2222-2222-222222222222");
    expect(doc.contract).toEqual(CONTRACT);
  });
});

describe("parseArdDocument (CNV-03) — the import gate", () => {
  test("round-trips a full ARD envelope produced by buildArdDocument", () => {
    const doc = buildArdDocument("https://supaprod.app", "id", "title", CONTRACT);
    const result = parseArdDocument(JSON.parse(JSON.stringify(doc)));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.contract).toEqual(CONTRACT);
  });

  test("also accepts a bare Outcome Contract with no envelope", () => {
    const result = parseArdDocument(JSON.parse(JSON.stringify(CONTRACT)));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.contract).toEqual(CONTRACT);
  });

  test("rejects a non-object", () => {
    const result = parseArdDocument("not an object");
    expect(result.ok).toBe(false);
  });

  test("rejects a contract missing required fields", () => {
    const result = parseArdDocument({ contract: { intent: "no version or drafted_by" } });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.length).toBeGreaterThan(0);
  });
});
