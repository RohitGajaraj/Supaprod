/**
 * SPEC-PROJECTIONS (RPT-43): PURE deterministic projections of a spec's
 * Outcome Contract spine.
 *
 * The thesis: artifacts are projections; the ledger is the source. A PRD, an
 * FRD, a status update, or a one-pager are not documents someone hand-maintains
 * until they go stale. They are VIEWS of the one typed source of truth (the
 * Outcome Contract on the spec: intent, success metrics with their proof
 * oracle, non-goals, budget, ambiguity policy). This module turns that typed
 * contract into each named view, generated fresh on demand and stamped with a
 * generation date and a drift-state (is the spine current, or has the spec
 * moved past its last-drafted contract).
 *
 * "Competitors generate documents; Cadence deprecates documents into views."
 *
 * PURE: no db, no network, no AI. Nothing is fabricated. Sparse contract fields
 * degrade to plain "not recorded in the contract" statements rather than
 * inventing content, and the projection is a deterministic function of the
 * contract, so there is no new LLM call. NO migration, NO chokepoint.
 */

import type { OutcomeContract, ContractClause } from "@/lib/discovery.functions";

/** One numbered source backing a projection's evidence, from the contract's
 *  own evidence_links (and any citations the caller passes in). */
export type ProjectionSource = { label: string };

export type ProjectionSection = { heading: string; body: string };

export type SpecProjectionKind = "prd" | "frd" | "status" | "onepager";

export const PROJECTION_KINDS: readonly SpecProjectionKind[] = ["prd", "frd", "status", "onepager"];

/** Short tab label per projection. */
export const PROJECTION_LABEL: Record<SpecProjectionKind, string> = {
  prd: "PRD",
  frd: "FRD",
  status: "STATUS",
  onepager: "ONE-PAGER",
};

const DOC_TITLE: Record<SpecProjectionKind, string> = {
  prd: "Product requirements (PRD)",
  frd: "Functional requirements (FRD)",
  status: "Status update",
  onepager: "One-pager",
};

const PROJECTION_FOOTER =
  "Projected from this spec's Outcome Contract, generated on demand. Cadence deprecates documents into views, so nobody hand-maintains this.";

export type DriftState = "current" | "stale" | "no-contract";

export type DriftAssessment = {
  state: DriftState;
  /** Short chip label. */
  label: string;
  /** One-line plain-language explanation. */
  detail: string;
};

export type SpecProjection = {
  kind: SpecProjectionKind;
  title: string;
  sections: ProjectionSection[];
  footer: string;
  /** Numbered sources this projection's "[n]" markers point to (PRD/FRD only). */
  sources: ProjectionSource[];
};

export type SpecProjectionInput = {
  title: string;
  /** The spec's lifecycle status (draft, approved, shipped, ...). */
  status: string;
  /** ISO timestamp the spec was last updated. */
  updatedAt: string;
  /** The typed Outcome Contract spine, or null when none has been drafted. */
  contract: OutcomeContract | null | undefined;
  bodyMd?: string | null;
  /** Optional extra sources (e.g. the spec's own citations) merged into the
   *  contract's evidence_links. */
  citations?: ProjectionSource[] | null;
};

export type SpecProjectionSet = {
  /** ISO timestamp the set was generated. */
  generatedAt: string;
  /** The date portion (YYYY-MM-DD), deterministic across timezones. */
  generatedOn: string;
  contractVersion: number | null;
  drift: DriftAssessment;
  /** Empty when there is no contract to project from. */
  projections: SpecProjection[];
};

/** PURE. The date portion of an ISO string, or the raw string when it is not
 *  ISO-shaped. Slicing (not toLocaleDateString) keeps this timezone-stable. */
function isoDate(iso: string | null | undefined): string {
  if (!iso) return "";
  const s = String(iso);
  return /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s;
}

function parseTime(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = Date.parse(String(iso));
  return Number.isNaN(t) ? null : t;
}

function standingClauses(clauses: ContractClause[] | undefined): ContractClause[] {
  return (clauses ?? []).filter((c) => c && c.status !== "superseded");
}

function supersededCount(clauses: ContractClause[] | undefined): number {
  return (clauses ?? []).filter((c) => c && c.status === "superseded").length;
}

const ORACLE_LABEL: Record<NonNullable<ContractClause["oracle_kind"]>, string> = {
  eval: "graded by an eval",
  ci: "checked in CI",
  uat: "human sign-off",
  unverifiable: "watched assumption",
};

function oracleLabel(kind: ContractClause["oracle_kind"]): string {
  return kind ? ORACLE_LABEL[kind] : "proof not yet assigned";
}

/** PURE. Render a numbered clause list, optionally annotating each clause with
 *  how it is proven. Degrades to a plain "none recorded" line. */
function clauseList(clauses: ContractClause[], opts: { withOracle?: boolean } = {}): string {
  if (clauses.length === 0) return "None recorded in the contract.";
  return clauses
    .map((c, i) => {
      const oracle = opts.withOracle ? ` (${oracleLabel(c.oracle_kind)})` : "";
      return `${i + 1}. ${c.text}${oracle}`;
    })
    .join("\n");
}

function budgetLines(contract: OutcomeContract): string {
  const b = contract.budget;
  if (!b) return "No budget or blast radius recorded in the contract.";
  const parts: string[] = [];
  if (b.estimate && b.estimate.trim()) parts.push(`Estimate: ${b.estimate.trim()}`);
  if (b.blast_radius && b.blast_radius.trim()) parts.push(`Blast radius: ${b.blast_radius.trim()}`);
  return parts.length ? parts.join("\n") : "No budget or blast radius recorded in the contract.";
}

function intentBody(contract: OutcomeContract): string {
  const t = (contract.intent ?? "").trim();
  return t ? t : "No intent recorded in the contract.";
}

function ambiguityBody(contract: OutcomeContract): string {
  const t = (contract.ambiguity_policy ?? "").trim();
  return t ? t : "No ambiguity policy recorded in the contract.";
}

/** PURE. Merge the contract's own evidence_links with any caller-supplied
 *  citations into a deduped, ordered source list. */
function contractSources(contract: OutcomeContract, extra: ProjectionSource[]): ProjectionSource[] {
  const fromContract: ProjectionSource[] = (contract.evidence_links ?? []).map((e) => ({
    label: (e.title && e.title.trim() ? e.title.trim() : `${e.source_kind} ${e.source_id}`).trim(),
  }));
  const seen = new Set<string>();
  const out: ProjectionSource[] = [];
  for (const s of [...fromContract, ...extra]) {
    const label = s.label.trim();
    if (!label || seen.has(label)) continue;
    seen.add(label);
    out.push({ label });
  }
  return out;
}

/**
 * PURE. Assess whether the projections are generated from a current spine.
 * The Outcome Contract is the source; a projection is never stale relative to
 * it. The drift-state instead reports whether the SPINE is current: if the
 * spec was edited after the contract was last drafted, the typed contract may
 * be behind the spec body and the views should be treated with that caveat.
 */
export function assessDrift(input: SpecProjectionInput): DriftAssessment {
  const { contract, updatedAt } = input;
  if (!contract) {
    return {
      state: "no-contract",
      label: "No contract",
      detail:
        "This spec has no Outcome Contract yet. Draft one on the Contract tab and these views generate from it automatically.",
    };
  }
  const draftedT = parseTime(contract.drafted_at);
  const updatedT = parseTime(updatedAt);
  if (draftedT !== null && updatedT !== null && updatedT > draftedT) {
    return {
      state: "stale",
      label: "Contract behind spec",
      detail: `The Outcome Contract was last drafted on ${isoDate(
        contract.drafted_at,
      )}, but the spec changed on ${isoDate(
        updatedAt,
      )}. Re-draft the contract to refresh these views.`,
    };
  }
  const v = typeof contract.version === "number" ? contract.version : null;
  const versionPart = v ? ` (version ${v})` : "";
  const draftedPart = isoDate(contract.drafted_at)
    ? `, drafted ${isoDate(contract.drafted_at)}`
    : "";
  return {
    state: "current",
    label: "In sync",
    detail: `Generated from the current Outcome Contract${versionPart}${draftedPart}.`,
  };
}

function buildPrd(
  input: SpecProjectionInput,
  contract: OutcomeContract,
  sources: ProjectionSource[],
): SpecProjection {
  return {
    kind: "prd",
    title: `${DOC_TITLE.prd}: ${input.title}`,
    sections: [
      { heading: "Overview", body: intentBody(contract) },
      { heading: "Success metrics", body: clauseList(standingClauses(contract.success_metrics)) },
      { heading: "Non-goals", body: clauseList(standingClauses(contract.non_goals)) },
      { heading: "Budget and blast radius", body: budgetLines(contract) },
      { heading: "Resolving ambiguity", body: ambiguityBody(contract) },
    ],
    footer: PROJECTION_FOOTER,
    sources,
  };
}

function buildFrd(
  input: SpecProjectionInput,
  contract: OutcomeContract,
  sources: ProjectionSource[],
): SpecProjection {
  return {
    kind: "frd",
    title: `${DOC_TITLE.frd}: ${input.title}`,
    sections: [
      { heading: "Functional intent", body: intentBody(contract) },
      {
        heading: "Acceptance criteria",
        body: clauseList(standingClauses(contract.success_metrics), { withOracle: true }),
      },
      { heading: "Out of scope", body: clauseList(standingClauses(contract.non_goals)) },
      { heading: "Risk and blast radius", body: budgetLines(contract) },
      { heading: "Ambiguity policy", body: ambiguityBody(contract) },
    ],
    footer: PROJECTION_FOOTER,
    sources,
  };
}

function buildStatus(input: SpecProjectionInput, contract: OutcomeContract): SpecProjection {
  const metrics = standingClauses(contract.success_metrics);
  const withOracle = metrics.filter((c) => c.oracle_kind).length;
  const pending = metrics.length - withOracle;
  const revised = supersededCount(contract.success_metrics) + supersededCount(contract.non_goals);
  const proving =
    metrics.length === 0
      ? "No success metrics are on record in the contract yet."
      : `${metrics.length} success metric${metrics.length === 1 ? "" : "s"} on record. ${withOracle} ${
          withOracle === 1 ? "has" : "have"
        } a proof oracle assigned, ${pending} still to be classified.`;
  const revisions =
    revised === 0
      ? "No clauses have been superseded."
      : `${revised} clause${revised === 1 ? "" : "s"} superseded and kept for the record.`;
  return {
    kind: "status",
    title: `${DOC_TITLE.status}: ${input.title}`,
    sections: [
      { heading: "The bet", body: intentBody(contract) },
      { heading: "Where it stands", body: `Spec status: ${input.status || "unknown"}.` },
      { heading: "What we are proving", body: proving },
      { heading: "Revisions", body: revisions },
    ],
    footer: PROJECTION_FOOTER,
    sources: [],
  };
}

function buildOnePager(input: SpecProjectionInput, contract: OutcomeContract): SpecProjection {
  const topMetrics = standingClauses(contract.success_metrics).slice(0, 3);
  const topNonGoals = standingClauses(contract.non_goals).slice(0, 3);
  const ask =
    contract.budget && contract.budget.estimate && contract.budget.estimate.trim()
      ? contract.budget.estimate.trim()
      : "No cost estimate recorded in the contract.";
  return {
    kind: "onepager",
    title: `${DOC_TITLE.onepager}: ${input.title}`,
    sections: [
      { heading: "The bet", body: intentBody(contract) },
      { heading: "What success looks like", body: clauseList(topMetrics) },
      { heading: "What we are not doing", body: clauseList(topNonGoals) },
      { heading: "The ask", body: ask },
    ],
    footer: PROJECTION_FOOTER,
    sources: [],
  };
}

/**
 * PURE. Compose the full set of projections from a spec's Outcome Contract,
 * stamped with a generation date and a drift-state. When there is no contract,
 * `projections` is empty (nothing is fabricated) and the drift-state says so.
 */
export function composeSpecProjections(
  input: SpecProjectionInput,
  generatedAt: string = new Date().toISOString(),
): SpecProjectionSet {
  const drift = assessDrift(input);
  const contract = input.contract;
  const contractVersion =
    contract && typeof contract.version === "number" ? contract.version : null;
  if (!contract) {
    return {
      generatedAt,
      generatedOn: isoDate(generatedAt),
      contractVersion: null,
      drift,
      projections: [],
    };
  }
  const sources = contractSources(contract, input.citations ?? []);
  const projections: SpecProjection[] = [
    buildPrd(input, contract, sources),
    buildFrd(input, contract, sources),
    buildStatus(input, contract),
    buildOnePager(input, contract),
  ];
  return {
    generatedAt,
    generatedOn: isoDate(generatedAt),
    contractVersion,
    drift,
    projections,
  };
}

/** PURE. Render a projection as a clean, copy-anywhere Markdown artifact,
 *  stamped with the generation date and drift-state. */
export function renderProjectionMarkdown(
  projection: SpecProjection,
  stamp: { generatedOn: string; drift: DriftAssessment },
): string {
  const lines: string[] = [`# ${projection.title}`];
  lines.push(`Generated on ${stamp.generatedOn} · ${stamp.drift.label}`);
  lines.push(stamp.drift.detail);
  lines.push("");
  for (const s of projection.sections) {
    lines.push(`## ${s.heading}`);
    lines.push(s.body || "·");
    lines.push("");
  }
  if (projection.sources.length > 0) {
    lines.push("## Sources");
    projection.sources.forEach((s, i) => lines.push(`[${i + 1}] ${s.label}`));
    lines.push("");
  }
  lines.push(`_${projection.footer}_`);
  return lines.join("\n");
}
