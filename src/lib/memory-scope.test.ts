/**
 * THE ONE ASSERTION THAT MATTERS IS "EVIDENCE NEVER PROMOTES", and everything
 * else in this file supports it.
 *
 * That single line is a confidentiality guarantee written as a test. A workspace
 * can hold three clients' products, and a measurement taken on one of them
 * reaching another one's ranking is not a ranking bug, it is a breach. So it is
 * not enough that the evidence branch returns what somebody expected once: it is
 * swept over every origin a row could arrive with, including the ones that look
 * like permission to travel.
 *
 * THE SECOND HALF IS THE OPPOSITE FAILURE, which is quieter and still fatal.
 * Method has to travel. If a reflection is pinned to one product then every
 * product re-learns the same lesson and the compounding claim is dead, so the
 * method cases are asserted as firmly as the evidence ones.
 *
 * THE PURITY ASSERTION IS NOT DECORATION. This module's whole value is that the
 * scope rule can be reasoned about without a database. `tsc` cannot tell a pure
 * module from one convenient import later; reading the source can.
 */
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";

import {
  AMBIGUOUS_KINDS,
  EVIDENCE_KINDS,
  MEMORY_KINDS_IN_USE,
  METHOD_KINDS,
  classifyMemoryKind,
  isEvidenceKind,
  originOnlyNarrows,
  resolveMemoryScope,
  scopeForKindAlone,
  type MemoryOrigin,
  type MemoryScopeInput,
} from "./memory-scope";

/**
 * Every origin a row can arrive with. Eight of them, and the interesting ones are
 * the three that look like an instruction to travel.
 */
const ORIGINS: (MemoryOrigin | undefined)[] = [
  undefined,
  {},
  { outcomeDerived: true },
  { outcomeDerived: false },
  { declaredScope: "workspace" },
  { declaredScope: "product" },
  { outcomeDerived: true, declaredScope: "workspace" },
  { outcomeDerived: false, declaredScope: "workspace" },
];

describe("evidence never promotes, which is the confidentiality guarantee", () => {
  it("keeps every evidence kind with its product, whatever its origin says", () => {
    /*
     * THE ASSERTION THIS FILE EXISTS FOR. `{ declaredScope: "workspace" }` is in
     * the sweep on purpose: it is somebody, or something, asking for a
     * measurement to be shared across products, and the answer has to be no
     * rather than "no unless asked nicely".
     */
    const offences: string[] = [];
    for (const kind of EVIDENCE_KINDS) {
      for (const origin of ORIGINS) {
        const out = resolveMemoryScope({ kind, origin });
        if (out.scope !== "product" || out.promotable) {
          offences.push(`${kind} + ${JSON.stringify(origin)} -> ${JSON.stringify(out)}`);
        }
      }
    }
    expect(
      offences,
      "a measurement taken on one product was offered to the rest of the workspace",
    ).toEqual([]);
  });

  it("has evidence kinds to sweep, so a broken import cannot pass this file", () => {
    expect(EVIDENCE_KINDS.length).toBeGreaterThan(1);
    expect(EVIDENCE_KINDS).toContain("outcome");
    expect(EVIDENCE_KINDS).toContain("precedent");
  });

  it("treats a settled result as evidence even when it was labelled as method", () => {
    /*
     * THE HOLE THE `kind` COLUMN LEAVES. It has no CHECK constraint, so a writer
     * can distil a verdict and label it `reflection`. The label would then carry
     * a measurement across products. The outcome flag beats the label, and it
     * beats a declaration alongside it.
     */
    for (const kind of METHOD_KINDS) {
      const out = resolveMemoryScope({ kind, origin: { outcomeDerived: true } });
      expect(out.scope, kind).toBe("product");
      expect(out.promotable, kind).toBe(false);
    }
    const declared = resolveMemoryScope({
      kind: "note",
      origin: { outcomeDerived: true, declaredScope: "workspace" },
    });
    expect(declared.scope).toBe("product");
    expect(declared.promotable).toBe(false);
  });

  it("names `outcome` as evidence, which the ruling did not", () => {
    /*
     * THE MISMATCH BETWEEN THE RULING AND THE CODE, pinned so it cannot drift
     * back. The ruling calls `precedent` "a settled outcome". Nothing writes
     * `precedent`; settled outcomes are written as `outcome`, and the precedent
     * engine reads `kind === "outcome"`. Had only the ruling's four been named,
     * every real settled outcome would have fallen to the unknown default, which
     * is the right answer reached by accident.
     */
    expect(isEvidenceKind("outcome")).toBe(true);
    expect(classifyMemoryKind("outcome")).toBe("evidence");
  });
});

describe("method travels, or nothing compounds", () => {
  it("puts every method kind at the workspace and lets it be put forward", () => {
    for (const kind of METHOD_KINDS) {
      const out = resolveMemoryScope({ kind });
      expect(out.scope, kind).toBe("workspace");
      expect(out.promotable, kind).toBe(true);
    }
  });

  it("covers the two the ruling named and the one that is a judgment", () => {
    expect(METHOD_KINDS).toContain("reflection");
    expect(METHOD_KINDS).toContain("correction");
    // `preference` is placed here rather than by the ruling, which does not
    // mention it. It is seeded as how this team works, which is method by the
    // ruling's own definition.
    expect(METHOD_KINDS).toContain("preference");
  });

  it("still lets a person keep a method lesson with one product", () => {
    // Narrowing is always available, because it can only ever be safe.
    const out = resolveMemoryScope({
      kind: "reflection",
      origin: { declaredScope: "product" },
    });
    expect(out.scope).toBe("product");
    expect(out.promotable).toBe(false);
  });
});

describe("the ambiguous kinds take a declaration and default to product", () => {
  it("defaults to product with nothing declared", () => {
    for (const kind of AMBIGUOUS_KINDS) {
      for (const origin of [undefined, {}]) {
        const out = resolveMemoryScope({ kind, origin });
        expect(out.scope, `${kind} + ${JSON.stringify(origin)}`).toBe("product");
        expect(out.promotable, kind).toBe(false);
      }
    }
  });

  it("widens only when somebody says so", () => {
    for (const kind of AMBIGUOUS_KINDS) {
      const out = resolveMemoryScope({ kind, origin: { declaredScope: "workspace" } });
      expect(out.scope, kind).toBe("workspace");
      expect(out.promotable, kind).toBe(true);
    }
  });

  it("holds `fact` as ambiguous rather than as method", () => {
    /*
     * A JUDGMENT, AND THE ONE MOST LIKELY TO BE ARGUED WITH. `fact` is seeded at
     * workspace scope, which reads like an argument for method. It is placed here
     * because a fact is as often "our churn is 4%" as "we are a two person team",
     * and only the second travels. Ambiguous means it can still be declared, so
     * nothing is lost, and the undeclared case fails safe.
     */
    expect(classifyMemoryKind("fact")).toBe("ambiguous");
    expect(resolveMemoryScope({ kind: "fact" }).scope).toBe("product");
  });
});

describe("an unrecognised kind falls to product rather than throwing", () => {
  it("gives a new kind nobody anticipated the cautious answer", () => {
    for (const kind of ["hunch", "postmortem", "forecast", "ANOMALY"]) {
      const out = resolveMemoryScope({ kind });
      expect(out.scope, kind).toBe("product");
      expect(out.promotable, kind).toBe(false);
    }
  });

  it("survives an empty, blank or absurd kind", () => {
    for (const kind of ["", "   ", "\n", "note note", "outcome!"]) {
      expect(() => resolveMemoryScope({ kind })).not.toThrow();
      expect(resolveMemoryScope({ kind }).scope, JSON.stringify(kind)).toBe("product");
    }
  });

  it("does not let a declaration promote a kind it cannot classify", () => {
    /*
     * The unknown case is NOT the ambiguous case, and conflating them is the
     * plausible mistake. An unknown kind carries no evidence that it is safe to
     * share, so a declaration on it narrows and never widens. A writer who wants
     * a new kind to travel adds it to the method list, in the open.
     */
    const out = resolveMemoryScope({ kind: "hunch", origin: { declaredScope: "workspace" } });
    expect(out.scope).toBe("product");
    expect(out.promotable).toBe(false);
  });

  it("reads a kind case-insensitively and ignores surrounding space", () => {
    // The column is free text and callers vary, so " Reflection " and
    // "reflection" must not resolve to opposite scopes.
    expect(resolveMemoryScope({ kind: " Reflection " })).toEqual(
      resolveMemoryScope({ kind: "reflection" }),
    );
    expect(resolveMemoryScope({ kind: "OUTCOME" }).promotable).toBe(false);
  });
});

describe("the invariant: an origin may only ever narrow a kind that already decided", () => {
  const KINDS = [...MEMORY_KINDS_IN_USE, "hunch", "", "Precedent"];

  it("holds over every kind crossed with every origin", () => {
    /*
     * Not a fuzz test in the statistical sense. An exhaustive sweep of a small
     * space, which is stronger for a pure function of one string and two optional
     * flags. The ambiguous kinds are exempted inside `originOnlyNarrows`, because
     * a declaration widening them is the feature rather than the leak.
     */
    const offences: string[] = [];
    for (const kind of KINDS) {
      for (const origin of ORIGINS) {
        const input: MemoryScopeInput = { kind, origin };
        if (!originOnlyNarrows(input)) {
          offences.push(`${kind} + ${JSON.stringify(origin)} -> ${JSON.stringify(resolveMemoryScope(input))}`);
        }
      }
    }
    expect(offences, "something in an origin WIDENED a scope that was already decided").toEqual([]);
  });

  it("sweeps a space big enough to be worth sweeping", () => {
    // Without this the loop above could pass by iterating nothing.
    expect(KINDS.length).toBeGreaterThan(8);
    expect(ORIGINS.length).toBeGreaterThan(6);
  });

  it("reports the kind's own scope independently of any origin", () => {
    expect(scopeForKindAlone("reflection")).toBe("workspace");
    expect(scopeForKindAlone("outcome")).toBe("product");
    expect(scopeForKindAlone("note")).toBe("product");
    expect(scopeForKindAlone("hunch")).toBe("product");
  });
});

describe("every reason is a sentence somebody could read in a promotion prompt", () => {
  const CASES: MemoryScopeInput[] = [
    { kind: "outcome" },
    { kind: "precedent" },
    { kind: "reflection" },
    { kind: "correction" },
    { kind: "preference" },
    { kind: "note" },
    { kind: "fact" },
    { kind: "hunch" },
    { kind: "reflection", origin: { outcomeDerived: true } },
    { kind: "reflection", origin: { declaredScope: "product" } },
    { kind: "note", origin: { declaredScope: "workspace" } },
  ];

  it("reads as English rather than as a status code", () => {
    for (const input of CASES) {
      const { reason } = resolveMemoryScope(input);
      expect(reason.length, `${input.kind} has no reason`).toBeGreaterThan(40);
      expect(reason.endsWith("."), `${input.kind}: "${reason}"`).toBe(true);
      expect(reason[0], `${input.kind} starts lowercase`).toBe(reason[0].toUpperCase());
    }
  });

  it("names no mechanism the reader has no way to know", () => {
    /*
     * Engine-Room doctrine: a label names the outcome, never the machine. A
     * reason carrying a column name, a table or the field it set would be the
     * engine leaking into the sentence a person is asked to rule on.
     */
    for (const input of CASES) {
      const { reason } = resolveMemoryScope(input);
      for (const leak of [
        "agent_memory",
        "product_id",
        "workspace_id",
        "memory_candidates",
        "house_rules",
        "promotable",
        "declaredScope",
        "outcomeDerived",
        "kind",
      ]) {
        expect(reason, `"${reason}" leaks ${leak}`).not.toContain(leak);
      }
    }
  });

  it("carries no em dash or en dash, because a person reads it", () => {
    for (const input of CASES) {
      const { reason } = resolveMemoryScope(input);
      expect(reason).not.toContain("\u2014");
      expect(reason).not.toContain("\u2013");
    }
  });

  it("gives a different sentence to each situation rather than one hedge for all", () => {
    const reasons = new Set(CASES.map((input) => resolveMemoryScope(input).reason));
    expect(reasons.size).toBeGreaterThan(5);
  });

  it("says WHY it stayed put, not merely that it did", () => {
    // The whole point of the sentence is that a person can disagree with it, and
    // they cannot disagree with "scope: product".
    expect(resolveMemoryScope({ kind: "outcome" }).reason).toContain("measurement");
    expect(resolveMemoryScope({ kind: "reflection" }).reason).toContain("how to work");
  });
});

describe("it is pure, and stays pure", () => {
  const source = readFileSync(new URL("./memory-scope.ts", import.meta.url), "utf8");
  /*
   * COMMENTS ARE STRIPPED BEFORE ANY SCAN, and that is not tidiness. This
   * module's header explains the rule by NAMING the things it must not touch:
   * the database, the store's table, the server boundary. A raw-source scan for
   * those names would match the explanation and fail on prose that is the
   * documentation working. So both scans below read code only.
   */
  const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");

  it("imports nothing at all, which is the strongest form of this check", () => {
    /*
     * Unlike its sibling policy module, this one needs no collaborator, so the
     * import list is not filtered, it is empty. An empty list is asserted
     * alongside a sanity check on the code itself, so a regex that stopped
     * matching cannot pass this by finding nothing.
     */
    const imports = [...code.matchAll(/from\s+"([^"]+)"/g)].map((m) => m[1]);
    expect(imports, `it imports ${imports.join(", ")}`).toEqual([]);
    expect(code).toContain("export function resolveMemoryScope");
    expect(code.length).toBeGreaterThan(1500);
  });

  it("reaches no database, no server module and no network", () => {
    for (const banned of [
      "supabase",
      ".server",
      "functions",
      "runtime",
      "fetch(",
      "await ",
      "async ",
      "process.env",
    ]) {
      expect(code.toLowerCase(), `it references ${banned}`).not.toContain(banned.toLowerCase());
    }
  });

  it("reads no clock and rolls no dice", () => {
    // A scope rule that varied by time or by luck could not be reviewed, and a
    // promotion prompt showing a different answer on a reload is worthless.
    for (const banned of ["Date.now(", "new Date(", "Math.random("]) {
      expect(code, `it calls ${banned}`).not.toContain(banned);
    }
  });

  it("returns the same answer for the same input, every time", () => {
    const input: MemoryScopeInput = { kind: "note", origin: { declaredScope: "workspace" } };
    const first = resolveMemoryScope(input);
    for (let i = 0; i < 50; i++) expect(resolveMemoryScope(input)).toEqual(first);
  });

  it("does not mutate what it was handed", () => {
    const origin: MemoryOrigin = { outcomeDerived: false, declaredScope: "workspace" };
    const copy = { ...origin };
    resolveMemoryScope({ kind: "note", origin });
    expect(origin).toEqual(copy);
  });

  it("keeps the three kind lists disjoint, so no kind has two answers", () => {
    // Four status words that overlap is how four status normalisers ended up
    // disagreeing elsewhere in this repo. One kind, one class.
    const all = [...EVIDENCE_KINDS, ...METHOD_KINDS, ...AMBIGUOUS_KINDS];
    expect(new Set(all).size).toBe(all.length);
    expect(MEMORY_KINDS_IN_USE.length).toBe(all.length);
  });
});
