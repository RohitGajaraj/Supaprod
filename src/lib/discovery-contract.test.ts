import { expect, test, describe } from "bun:test";
import { supersedeClause } from "./discovery.functions";
import type { ContractClause } from "./discovery.functions";

const NOW = "2026-07-02T23:00:00.000Z";

function clause(over: Partial<ContractClause> = {}): ContractClause {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    text: "Original clause",
    status: "standing",
    superseded_by: null,
    oracle_kind: null,
    oracle_ref: null,
    created_at: "2026-07-01T00:00:00.000Z",
    ...over,
  };
}

describe("supersedeClause (CNV-01) — clauses are individually supersedable, never overwritten in place", () => {
  test("marks the prior clause superseded and appends a new standing replacement", () => {
    const c = clause();
    const result = supersedeClause([c], c.id, "New clause text", NOW);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ id: c.id, status: "superseded" });
    expect(result[0].text).toBe("Original clause"); // never mutated in place
    expect(result[1]).toMatchObject({ text: "New clause text", status: "standing", created_at: NOW });
    expect(result[0].superseded_by).toBe(result[1].id);
    expect(result[1].id).not.toBe(c.id);
  });

  test("leaves other clauses in the array untouched", () => {
    const a = clause({ id: "aaaaaaaa-1111-1111-1111-111111111111", text: "A" });
    const b = clause({ id: "bbbbbbbb-1111-1111-1111-111111111111", text: "B" });
    const result = supersedeClause([a, b], a.id, "A revised", NOW);
    expect(result.find((c) => c.id === b.id)).toEqual(b);
  });

  test("throws when the clause id does not exist", () => {
    const c = clause();
    expect(() => supersedeClause([c], "does-not-exist", "x", NOW)).toThrow("Clause not found");
  });

  test("throws when the clause is already superseded (no double-supersession)", () => {
    const c = clause({ status: "superseded", superseded_by: "some-other-id" });
    expect(() => supersedeClause([c], c.id, "x", NOW)).toThrow("already superseded");
  });

  test("new clause id is a fresh uuid, never colliding with the input", () => {
    const c = clause();
    const result = supersedeClause([c], c.id, "x", NOW);
    expect(result[1].id).toMatch(/^[0-9a-f-]{36}$/);
  });
});
