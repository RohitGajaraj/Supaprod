/**
 * BD-1 / ARD-rides-dispatch, the PURE work-order fold for the Outcome
 * Contract's machine-readable form (the ARD, `@/lib/ard-schema`).
 *
 * When a spec carries a compiled contract, its ARD document travels INSIDE the
 * dispatch work order as a clearly delimited fenced JSON block after the prose,
 * so the engine receives the identical acceptance contract Supaprod checks the
 * build against, not a re-parsed prose summary. No DB, no env, no I/O here;
 * `dispatchStudioSession` does the fetching and calls these helpers.
 */
import type { ArdDocument } from "@/lib/ard-schema";

/** ~8k chars: the honest work-order budget for the embedded ARD JSON. */
export const ARD_BLOCK_MAX_CHARS = 8000;

/**
 * PURE. The standing (non-superseded, non-blank) clause texts of a contract
 * section, the `acceptanceCriteria` a `BuildSpec` carries. Structural on
 * purpose (any `{ text, status }` array) so callers never need the full
 * `ContractClause` type to use it.
 */
export function standingClauseTexts(
  clauses: ReadonlyArray<{ text?: unknown; status?: unknown }> | null | undefined,
): string[] {
  if (!Array.isArray(clauses)) return [];
  const out: string[] = [];
  for (const c of clauses) {
    if (!c || c.status !== "standing" || typeof c.text !== "string") continue;
    const text = c.text.trim();
    if (text) out.push(text);
  }
  return out;
}

/**
 * PURE. Render the ARD document as the delimited work-order block: a headline
 * naming the contract, then the fenced JSON. Token-capped honestly: pretty
 * JSON when it fits, compact JSON when pretty does not, and when even compact
 * exceeds the cap the JSON is cut at the cap with an explicit truncation
 * notice after the fence (never a silent mid-document cut).
 */
export function formatArdWorkOrderBlock(
  ard: ArdDocument,
  capChars: number = ARD_BLOCK_MAX_CHARS,
): string {
  const header = `THE CONTRACT (ARD v${ard.ard_version}), every clause carries its oracle`;
  const pretty = JSON.stringify(ard, null, 2);
  const json = pretty.length <= capChars ? pretty : JSON.stringify(ard);
  if (json.length <= capChars) {
    return `${header}\n\`\`\`json\n${json}\n\`\`\``;
  }
  const sliced = json.slice(0, capChars);
  return [
    `${header}\n\`\`\`json\n${sliced}\n\`\`\``,
    `(ARD truncated: the full document is ${json.length} chars, over the ${capChars}-char work-order budget, so the JSON above is cut mid-document. Read the full contract on the spec's Contract tab or fetch it with the MCP get_ard tool.)`,
  ].join("\n");
}
