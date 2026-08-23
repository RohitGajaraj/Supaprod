// Pure presentation logic for the Trust Ledger (design-anatomy dim 17). No
// React, no server calls, so the trace prefixes, the status tone mapping, and
// the plain-language summary are unit-tested without a DB or a DOM. The route
// (src/routes/_authenticated.trust-ledger.tsx) and the ReceiptDetailSheet both
// read from here so a receipt reads the same on the card and in its detail.
import type { TrustReceipt, TrustReceiptKind } from "@/lib/trust-ledger.functions";
import { traceRef } from "@/components/discover/format";

/**
 * dim 17 trace-ref prefixes for a receipt (design-anatomy §4 registry). DEC is
 * the shared cross-loop prefix for decisions; ACT is the engine-only local code
 * for a decided autonomous action (an `agent_approvals` row), following the
 * kindTracePrefix pattern for objects that never leave the engine surfaces.
 */
export const RECEIPT_PREFIX: Record<TrustReceiptKind, string> = {
  decision: "DEC",
  action: "ACT",
};

/** The quiet mono ref shown on a receipt (e.g. `DEC·A1B2C3`), via the shared
 * traceRef helper so the format never drifts from the rest of the app. */
export function receiptTraceRef(r: Pick<TrustReceipt, "id" | "kind">): string {
  return `${RECEIPT_PREFIX[r.kind]}\u00b7${traceRef(r.id)}`;
}

/** A receipt status mapped to a semantic role tone. Obsidian correctness: a
 * rejected/failed receipt reads in the alert role (madder), never the soft
 * data pink that `--rose` resolves to under the dark theme. */
export type ReceiptTone = "moss" | "madder" | "muted" | "subtle";

const STATUS_TONE: Record<string, ReceiptTone> = {
  approved: "moss",
  executed: "moss",
  auto_approved: "moss",
  rejected: "madder",
  failed: "madder",
  cancelled: "muted",
  expired: "muted",
  pending: "subtle",
};

export function receiptStatusTone(status: string): ReceiptTone {
  return STATUS_TONE[status] ?? "subtle";
}

/**
 * The tone as the `Value` primitive speaks it (src/components/shell/primitives.tsx).
 *
 * PORTED 2026-07-29: this used to be `RECEIPT_TONE_VAR`, a map of raw CSS
 * variables from the retired palette. A receipt asks for a tone now and never
 * for a hue, so the stylesheet owns every mix and the detail view owns none.
 */
export const RECEIPT_VALUE_TONE: Record<ReceiptTone, "quiet" | "pass" | "fail"> = {
  moss: "pass",
  madder: "fail",
  muted: "quiet",
  subtle: "quiet",
};

/** A short, human status word for the pill (auto_approved reads "auto"). */
export function receiptStatusLabel(status: string): string {
  if (status === "auto_approved") return "auto approved";
  return status.replace(/_/g, " ");
}

/**
 * A plain-language, non-expert summary of what the ledger holds, from REAL
 * counts only (never a fabricated metric). Names the outcome the way a person
 * would say it, so the receipts surface is legible without knowing the schema.
 */
export function ledgerSummary(counts: {
  all: number;
  standing: number;
  superseded: number;
  /** Decisions proven by a recorded outcome (LOOP-PROVE). A proven receipt still
   * stands, so it folds into the standing tally and gets its own closing note. */
  proven?: number;
}): string {
  const { all, superseded } = counts;
  const proven = counts.proven ?? 0;
  const standing = counts.standing + proven;
  const provenNote = proven
    ? ` ${proven} ${proven === 1 ? "is" : "are"} proven by a recorded outcome.`
    : "";
  if (all === 0) return "Nothing on the record yet.";
  if (superseded === 0) {
    return `${all} on the record, ${all === 1 ? "and it still stands" : "all still standing"}.${provenNote}`;
  }
  return `${all} on the record. ${standing} still stand${standing === 1 ? "s" : ""}, ${superseded} ${superseded === 1 ? "was" : "were"} superseded by a later call.${provenNote}`;
}
