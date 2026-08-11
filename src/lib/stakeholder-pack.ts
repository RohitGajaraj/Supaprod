/**
 * STAKEHOLDER-PACK (v11 #19) — PURE composer for audience-tuned persuasion artifacts.
 *
 * v11 pains research, GAP #1: Supaprod already PRODUCES the evidence (a decision + its
 * receipts: what changed, why, the proof, who approved it, whether it still stands), but a
 * PM still has to hand-build the deck that wins each room. This module turns one decision +
 * its receipts into the artifact each audience actually needs — the same facts, re-framed:
 *   - exec:  bottom-line first (the call, what it stands on, the ask), minimal mechanism.
 *   - eng:   the rationale, constraints, and provenance — the "why" engineers will challenge.
 *   - board: the strategic framing + governance + standing — trust, not implementation.
 *
 * It reuses the Trust Ledger's receipt fields (no new data) and the humanized-output voice.
 * PURE: no db, no network, no AI; the composition + rendering are unit-verifiable. The server
 * adapter passes a normalized brief in. NO migration, NO chokepoint.
 */

import type { ReceiptEdge } from "@/lib/trust-ledger.functions";

export type PackAudience = "exec" | "eng" | "board";

export const PACK_AUDIENCES: readonly PackAudience[] = ["exec", "eng", "board"];

const AUDIENCE_LABEL: Record<PackAudience, string> = {
  exec: "Executive",
  eng: "Engineering",
  board: "Board",
};

/** The receipt fields a pack is composed from — a subset of the Trust Ledger's TrustReceipt. */
export type DecisionBrief = {
  title: string;
  rationale: string | null;
  /** decision status (pending|approved|rejected|shipped|...). */
  status: string;
  /** the agent slug that proposed/made the call, or null for a human-led call. */
  actor: string | null;
  /** true when a human pressed approve/reject. */
  humanDecided: boolean;
  /** ISO timestamp the decision was made. */
  occurredAt: string;
  /** originating artifact label (mission / prd / meeting), when known. */
  sourceLabel: string | null;
  /** count of lineage edges touching this decision (provenance richness). */
  evidenceCount: number;
  /** bitemporal standing: still current, or replaced by a later decision. */
  outcome: "standing" | "superseded";
  /** recorded outcome verdict, when an outcome was logged against the decision. */
  verdict?: string | null;
  metricLabel?: string | null;
  metricValue?: string | null;
  /** RPT-12: the walkable evidence behind evidenceCount, so a claim of "backed
   *  by N pieces of evidence" survives as N *citable* pieces once the pack
   *  leaves the app (copy/download), not a number nobody can trace. Empty
   *  when the decision has no lineage edges. */
  evidenceItems?: ReceiptEdge[];
};

export type PackSection = { heading: string; body: string };

export type StakeholderPack = {
  audience: PackAudience;
  title: string;
  sections: PackSection[];
  footer: string;
  /** RPT-12: the numbered citation list backing this pack's "[n]" markers,
   *  rendered as a Sources section so exported/copied markdown is
   *  self-contained. Empty when the decision has no lineage evidence. */
  citations: ReceiptEdge[];
};

const POSITIVE = new Set(["validated", "confirmed", "win"]);
const NEGATIVE = new Set(["missed", "invalidated", "refuted", "loss"]);

/** Plain-language standing line, shared across audiences. */
function standingLine(brief: DecisionBrief): string {
  if (brief.outcome === "superseded") {
    return "This decision has since been revised by a later call (kept for the record, not current).";
  }
  return "This is the current standing decision.";
}

/** Plain-language outcome line from a recorded verdict, or null when none. */
function outcomeLine(brief: DecisionBrief): string | null {
  const v = typeof brief.verdict === "string" ? brief.verdict.trim().toLowerCase() : "";
  if (!v) return null;
  const metric =
    brief.metricLabel && brief.metricValue ? ` (${brief.metricLabel}: ${brief.metricValue})` : "";
  if (POSITIVE.has(v)) return `Recorded outcome: validated${metric}.`;
  if (NEGATIVE.has(v))
    return `Recorded outcome: it missed${metric}, and that is on the record too.`;
  return `Recorded outcome: mixed${metric}.`;
}

/** Who-and-how the call was made, framed for trust. RPT-12: when the evidence
 *  is walkable (evidenceItems present), the count carries real "[n]" markers
 *  citing each piece by number instead of a bare, untraceable count. */
function provenanceLine(brief: DecisionBrief): string {
  const who = brief.humanDecided
    ? "A person reviewed and approved it"
    : brief.actor
      ? `Proposed by the ${brief.actor} agent`
      : "Recorded in the decision log";
  const items = brief.evidenceItems ?? [];
  const markers = items.length > 0 ? " " + items.map((_, i) => `[${i + 1}]`).join("") : "";
  const evidence =
    brief.evidenceCount > 0
      ? `, backed by ${brief.evidenceCount} linked piece${brief.evidenceCount === 1 ? "" : "s"} of evidence${markers}`
      : "";
  const src = brief.sourceLabel ? `, originating from ${brief.sourceLabel}` : "";
  return `${who}${evidence}${src}.`;
}

/** PURE. Render the numbered Sources list a pack's "[n]" markers point to, or
 *  "" when the decision has no walkable evidence. */
function renderSources(citations: ReceiptEdge[]): string {
  if (citations.length === 0) return "";
  const lines = ["## Sources"];
  citations.forEach((c, i) => lines.push(`[${i + 1}] ${c.label}`));
  return lines.join("\n");
}

function whyBody(brief: DecisionBrief): string {
  return brief.rationale?.trim()
    ? brief.rationale.trim()
    : "No rationale was recorded for this decision.";
}

/**
 * PURE. Compose one audience-tuned pack from a decision brief. Same facts, different lead and
 * emphasis per audience; always honest (sparse fields degrade to plain statements).
 */
export function composeStakeholderPack(
  brief: DecisionBrief,
  audience: PackAudience,
): StakeholderPack {
  const sections: PackSection[] = [];
  const outcome = outcomeLine(brief);

  if (audience === "exec") {
    sections.push({ heading: "The decision", body: brief.title });
    sections.push({
      heading: "Where it stands",
      body: [standingLine(brief), outcome].filter(Boolean).join(" "),
    });
    sections.push({ heading: "Why it matters", body: whyBody(brief) });
    sections.push({ heading: "How confident we are", body: provenanceLine(brief) });
  } else if (audience === "eng") {
    sections.push({ heading: "What changed", body: brief.title });
    sections.push({ heading: "Rationale and constraints", body: whyBody(brief) });
    sections.push({ heading: "Evidence", body: provenanceLine(brief) });
    sections.push({
      heading: "Status",
      body: [`Decision status: ${brief.status}.`, standingLine(brief), outcome]
        .filter(Boolean)
        .join(" "),
    });
  } else {
    // board
    sections.push({ heading: "Strategic decision", body: brief.title });
    sections.push({ heading: "The case", body: whyBody(brief) });
    sections.push({
      heading: "Evidence and governance",
      body: provenanceLine(brief),
    });
    sections.push({
      heading: "Standing and outcome",
      body: [standingLine(brief), outcome].filter(Boolean).join(" "),
    });
  }

  return {
    audience,
    title: `${AUDIENCE_LABEL[audience]} brief: ${brief.title}`,
    sections,
    footer: "Generated by Supaprod from this decision and its evidence.",
    citations: brief.evidenceItems ?? [],
  };
}

/** PURE. All three audience packs from one brief. */
export function composeAllPacks(brief: DecisionBrief): Record<PackAudience, StakeholderPack> {
  return {
    exec: composeStakeholderPack(brief, "exec"),
    eng: composeStakeholderPack(brief, "eng"),
    board: composeStakeholderPack(brief, "board"),
  };
}

/** PURE. Render a pack as a clean, copy-anywhere Markdown artifact in Supaprod's voice. */
export function renderPackMarkdown(
  pack: StakeholderPack,
  opts: { asOf?: string | null } = {},
): string {
  const lines: string[] = [`# ${pack.title}`];
  if (opts.asOf?.trim()) lines.push(`As of ${opts.asOf.trim()}`);
  lines.push("");
  for (const s of pack.sections) {
    lines.push(`## ${s.heading}`);
    lines.push(s.body || "·");
    lines.push("");
  }
  const sources = renderSources(pack.citations);
  if (sources) {
    lines.push(sources);
    lines.push("");
  }
  lines.push(`_${pack.footer}_`);
  return lines.join("\n");
}
