/**
 * WHOSE LESSON IS THIS, decided once instead of implicitly by every writer.
 *
 * ── THE QUESTION, AND WHY THE SCHEMA CANNOT ANSWER IT ──────────────────
 * A workspace holding more than one product is already the majority state
 * rather than a future case: 11 of 17 workspaces have more than one product and
 * 7 have four. So every lesson written down now has to answer a question nothing
 * in the store asks: does this hold for the product it was learned in, or for
 * all of them.
 *
 * The `scope` column looks like it answers that and does not. In production it
 * holds `agent` (1,083 rows), `workspace` (81) and `global` (11), which is a
 * statement about WHICH AGENTS may reach a row. Useful, and a different
 * question. None of the three says whose evidence it is, and no writer has ever
 * had a rule to follow, so each one picked a scope by feel and they disagree.
 *
 * ── GETTING IT WRONG COSTS SOMETHING IN BOTH DIRECTIONS ────────────────
 * TOO WIDE is the dangerous one. Evidence leaking between products makes the
 * director rank product B on measurements taken on product A, so it is not just
 * noise, it is wrong. And for an agency running three clients inside one
 * workspace, one client's numbers reaching another client's ranking is a
 * confidentiality breach. That is why the default here is the narrow one and why
 * `promotable: false` on an evidence kind is the assertion the tests lead with.
 *
 * TOO NARROW is quieter and still expensive. Scoping METHOD to a product means
 * every product re-learns the same lesson from scratch, and the compounding
 * claim is dead the moment that is true. "Check the window before blaming
 * deliverability" is true everywhere; there is nothing product-shaped about it.
 *
 * ── THE RULE, WHICH MAPS ONTO THE `kind` COLUMN ALREADY THERE ──────────
 * Evidence is product-scoped and never promotes. Method is workspace-scoped and
 * promotes deliberately. The default is product, because that is the safe
 * direction and promotion is meant to be an act somebody performs.
 *
 * ── THE RULING NAMES FOUR KINDS. THE STORE WRITES SEVEN ────────────────
 * This is worth reading before trusting either the ruling or this file, because
 * the two do not line up and pretending they did would leave a hole.
 *
 * The ruling's table lists `reflection`, `correction`, `precedent` and `note`.
 * The column has no CHECK constraint, so it is free text, and shipped writers
 * put seven values in it:
 *
 *   reflection   an agent reflecting on a run       reflection.server.ts
 *   note         whatever the remember tool was given   tools/registry.server.ts
 *   outcome      a settled verdict, distilled       memory.server.ts
 *   correction   a person corrected the agent       spine/correction.server.ts
 *   fact         seeded, workspace-shaped           onboarding/seed-workspace.server.ts
 *   preference   seeded, how this team works        onboarding/seed-workspace.server.ts
 *   precedent    no shipped writer produces it today
 *
 * TWO CONSEQUENCES, AND THE FIRST ONE MATTERS.
 *
 * The ruling calls `precedent` "a settled outcome". Settled outcomes are NOT
 * written as `precedent`. They are written as `outcome`, and the read side
 * agrees: the precedent engine filters on `kind === "outcome"`. So the kind the
 * ruling names as the evidence case is the one no writer produces, and the one
 * that actually carries evidence went unnamed. Both are treated as evidence
 * here. Naming only the ruling's four would have left every real settled outcome
 * falling through to the unknown default, which is safe by luck rather than by
 * design, and luck is not a confidentiality guarantee.
 *
 * `fact` and `preference` are not in the ruling at all, so their placement is a
 * judgment and is flagged as one. `preference` is method by the ruling's own
 * definition, being about how work is done rather than what happened to
 * anything. `fact` is treated as ambiguous alongside `note`, because a fact can
 * as easily be "we are a two person team" as "our churn is 4%", and only one of
 * those travels.
 *
 * ── WHAT THE TWO OUTPUT FIELDS ACTUALLY MEAN ───────────────────────────
 * `scope` is the retrieval boundary: which products may reach this row.
 *
 * `promotable` is narrower than it sounds. It means this row is ELIGIBLE TO BE
 * PROPOSED for promotion, never that it has been promoted. Promotion is a
 * governed event with a person in it, and the staging table and approval flow it
 * runs through already exist. So `promotable: true` opens a proposal that
 * somebody rules on, and `promotable: false` means the proposal is never offered
 * at all.
 *
 * `reason` is written to be read by that person, in that prompt. It is a
 * sentence, not a token, and it says what the row is rather than which branch
 * produced it.
 *
 * ── PURE, AND THE TESTS ENFORCE IT RATHER THAN ASKING ──────────────────
 * No I/O, no database, no clock, no imports at all. The rows arrive from
 * whatever loaded them, because who supplied them is not this module's business
 * and a query in here would make the rule untestable. The test reads this file's
 * own source to check that, since a type checker cannot see the difference
 * between a pure module and one convenient import later.
 */

/** Which products may reach a row. Two values, because the question is binary. */
export type MemoryScope = "product" | "workspace";

/**
 * WHERE A ROW CAME FROM, at the two facts that change the answer.
 *
 * A provenance union was the first shape here (`run | person | seed | outcome`)
 * and was cut: four of its five values would have changed nothing, and a field
 * with no consumer does not ship. Both of these have one.
 */
export interface MemoryOrigin {
  /**
   * True when this row was distilled from a settled verdict, whatever its kind
   * says. A measurement stays a measurement even when the writer labelled it
   * loosely, so this overrides the kind rather than informing it.
   */
  outcomeDerived?: boolean;
  /**
   * The scope somebody stated for a kind that cannot decide on its own. Read for
   * the ambiguous kinds, and read for a narrowing on any other kind. It can
   * never widen an evidence row, which is the point of the whole file.
   */
  declaredScope?: MemoryScope;
}

export interface MemoryScopeInput {
  /** An `agent_memory.kind` value. Free text in the column, so anything can arrive. */
  kind: string;
  /** Omit for a row with nothing recorded about where it came from. */
  origin?: MemoryOrigin;
}

export interface MemoryScopeDecision {
  scope: MemoryScope;
  /** Eligible to be PROPOSED for promotion. Never "already promoted". */
  promotable: boolean;
  /** One sentence, for the person the promotion prompt will show it to. */
  reason: string;
}

/** How a kind answers the question, before anything about its origin is read. */
export type MemoryKindClass = "evidence" | "method" | "ambiguous" | "unknown";

/**
 * A MEASUREMENT. Never promotes, whatever else is true about the row.
 *
 * `outcome` is here because it is what settled verdicts are actually written as,
 * and `precedent` because the ruling names it and production holds 28 rows of
 * it even though nothing in the current code writes one.
 */
export const EVIDENCE_KINDS: readonly string[] = ["outcome", "precedent"];

/**
 * HOW TO WORK. True across products, so it may be proposed for the workspace.
 *
 * `preference` is the judgment in this list. The other two are the ruling's.
 */
export const METHOD_KINDS: readonly string[] = ["reflection", "correction", "preference"];

/**
 * GENUINELY EITHER. Takes a declared scope and defaults to product without one.
 *
 * `note` is the ruling's; `fact` is placed here rather than with method because a
 * fact is as often about one product as about the team holding it.
 */
export const AMBIGUOUS_KINDS: readonly string[] = ["note", "fact"];

/**
 * Every kind this file places, for a test that wants to sweep the real
 * vocabulary rather than the four the ruling happened to name. Six of the seven
 * have a live writer; `precedent` is carried because production holds rows of it.
 */
export const MEMORY_KINDS_IN_USE: readonly string[] = [
  ...EVIDENCE_KINDS,
  ...METHOD_KINDS,
  ...AMBIGUOUS_KINDS,
];

const REASONS = {
  evidence:
    "This is a measurement taken on one product, so it stays with that product and is never offered to the rest of the workspace. What happened to one product is not evidence about another.",
  outcomeDerived:
    "This came out of a settled result, so it is a measurement about the product it was settled in however it was labelled, and it stays there.",
  method:
    "This is about how to work rather than about what happened to one product, so it holds across the workspace and can be put forward as a standing rule.",
  declaredProduct:
    "Somebody kept this with the product it was written in, so it is not put forward to the rest of the workspace.",
  declaredWorkspace:
    "Somebody said this holds across the whole workspace, so it can be put forward as a standing rule.",
  ambiguousDefault:
    "Nothing says whether this holds for one product or for all of them, so it stays with the product it was written in until somebody says it travels.",
  unknown:
    "Nothing here says what sort of lesson this is, so it stays with the product it was written in rather than being assumed to hold everywhere.",
} as const;

/** Lower-case and trimmed, because the column is free text and callers vary. */
function normalizeKind(kind: string): string {
  return typeof kind === "string" ? kind.trim().toLowerCase() : "";
}

/**
 * Which of the four cases a kind falls into.
 *
 * Exported because a caller rendering a promotion queue needs the same grouping
 * this module decides on, and two tables that disagree is the defect this file
 * exists to end.
 */
export function classifyMemoryKind(kind: string): MemoryKindClass {
  const k = normalizeKind(kind);
  if (!k) return "unknown";
  if (EVIDENCE_KINDS.includes(k)) return "evidence";
  if (METHOD_KINDS.includes(k)) return "method";
  if (AMBIGUOUS_KINDS.includes(k)) return "ambiguous";
  return "unknown";
}

/** Whether a kind is a measurement, and therefore may never cross a product. */
export function isEvidenceKind(kind: string): boolean {
  return classifyMemoryKind(kind) === "evidence";
}

/**
 * Whether one row holds for its product or for the whole workspace, and whether
 * it may be put forward as a standing rule.
 *
 * ── THE ORDER OF THE CHECKS IS THE DESIGN ──────────────────────────────
 * Evidence is settled first and nothing later can loosen it. That covers the
 * case where a row was labelled as method, or as a note, and was really a
 * measurement: the outcome flag beats the label, and it beats a declaration too.
 * A person may narrow anything and may widen only what is genuinely undecided.
 *
 * An unknown kind resolves to product rather than throwing. A new writer landing
 * a kind nobody here anticipated should get the cautious answer, not an
 * exception in a retrieval path.
 */
export function resolveMemoryScope(input: MemoryScopeInput): MemoryScopeDecision {
  const kindClass = classifyMemoryKind(input.kind);
  const origin = input.origin;

  /*
   * ── EVIDENCE, SETTLED BEFORE ANYTHING ELSE IS READ ───────────────────
   * Two ways in, and both land in the same place. The kind says measurement, or
   * the row came from a settled result and the kind was not specific enough to
   * say so. Neither a declaration nor a later branch can move this, because the
   * cost of being wrong here is a client seeing another client's numbers.
   */
  if (kindClass === "evidence") {
    return { scope: "product", promotable: false, reason: REASONS.evidence };
  }
  if (origin?.outcomeDerived) {
    return { scope: "product", promotable: false, reason: REASONS.outcomeDerived };
  }

  /*
   * ── A DECLARATION MAY NARROW ANYTHING ────────────────────────────────
   * Checked before the kind's own answer so that a person who kept a lesson with
   * its product gets what they asked for. Narrowing is always safe, so this
   * needs no per-kind exception.
   */
  if (origin?.declaredScope === "product") {
    return { scope: "product", promotable: false, reason: REASONS.declaredProduct };
  }

  if (kindClass === "method") {
    return { scope: "workspace", promotable: true, reason: REASONS.method };
  }

  /*
   * ── AND MAY WIDEN ONLY WHAT WAS UNDECIDED ────────────────────────────
   * The one place a declaration adds scope rather than removing it, and it is
   * exactly the case the ruling reserved for it: a kind that carries no signal
   * about whether it travels. Everything else falls to product.
   */
  if (kindClass === "ambiguous" && origin?.declaredScope === "workspace") {
    return { scope: "workspace", promotable: true, reason: REASONS.declaredWorkspace };
  }

  return kindClass === "ambiguous"
    ? { scope: "product", promotable: false, reason: REASONS.ambiguousDefault }
    : { scope: "product", promotable: false, reason: REASONS.unknown };
}

/**
 * The scope a kind carries on its own, with nothing known about the row.
 *
 * Exported so the invariant below can be stated against something rather than
 * against a remembered expectation.
 */
export function scopeForKindAlone(kind: string): MemoryScope {
  return classifyMemoryKind(kind) === "method" ? "workspace" : "product";
}

/**
 * Whether an origin could only ever have NARROWED the answer.
 *
 * True for every kind that already answers the question, and deliberately not
 * asserted for the ambiguous kinds, where a declaration widening the scope is
 * the entire reason the declaration exists. Kept here rather than only in the
 * test so the property travels with the module it constrains, and so a caller
 * wiring real rows can check its own data against it.
 *
 * A `false` from this means an evidence row was handed a workspace scope or made
 * promotable by something in its origin, which is the confidentiality failure
 * this file is for. It should be unreachable, and the sweep in the tests is how
 * that stays true rather than how it is hoped.
 */
export function originOnlyNarrows(input: MemoryScopeInput): boolean {
  const kindClass = classifyMemoryKind(input.kind);
  if (kindClass === "ambiguous") return true;

  const resolved = resolveMemoryScope(input);
  if (scopeForKindAlone(input.kind) === "product" && resolved.scope === "workspace") return false;
  if (kindClass !== "method" && resolved.promotable) return false;
  return true;
}
