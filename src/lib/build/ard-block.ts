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
import type { ArdDocument, ArdDesignSection } from "@/lib/ard-schema";
import { ARD_SCAFFOLD_HTML_CAP } from "@/lib/build/design-gate";

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
 * One whole key the budget could not afford, named inside the JSON itself so a
 * reading agent learns what is missing from the document it is holding rather
 * than from prose it may never parse.
 */
export interface ArdBlockOmission {
  /** Dotted path of the key removed, e.g. "design.scaffold_html". */
  key: string;
  /** The JSON size of what was removed, so the reader can judge the loss. */
  chars: number;
  /** Where the full value is still available. */
  recover: string;
}

/**
 * What is actually fenced into a work order: the ARD, minus whatever the
 * budget could not afford, plus the receipt naming the difference. It is a
 * budgeted PROJECTION of an ARD document, not an ARD document — which is why
 * dropped keys are deleted rather than nulled. `design.scaffold_html: null`
 * means "the design station never drew one"; an absent key plus an
 * `omitted_for_budget` entry means "one exists and is fetchable elsewhere".
 * Collapsing those two into `null` would have the block quietly claim there
 * was no mockup, which is a claim about work the product did not do.
 */
export type BudgetedArdBlock = ArdDocument & { omitted_for_budget?: ArdBlockOmission[] };

const MCP_RECOVERY = "the MCP get_ard tool, which returns this key in full";
const DESIGN_TAB_RECOVERY = `the spec's Design tab, or ${MCP_RECOVERY}`;
const CONTRACT_TAB_RECOVERY = `the spec's Contract tab, or ${MCP_RECOVERY}`;

/**
 * The order whole keys are surrendered in, most disposable first.
 *
 * The ordering is a judgement about what the build cannot proceed without.
 * `design.scaffold_html` leads because it is the single largest value in the
 * document by an order of magnitude AND the same markup now also rides its own
 * `html` fence (`formatScaffoldHtmlBlock`, reached through
 * `formatDesignDispatchSections`) on BOTH dispatch paths, so dropping it here
 * usually costs the reader nothing at all. `contract.success_metrics` is absent
 * from this ladder on purpose: those clauses ARE the acceptance criteria the
 * build is graded against, and a document that has surrendered them has stopped
 * being a contract.
 *
 * "BOTH PATHS" IS NEW, AND THIS SENTENCE USED TO SAY "ON THE STUDIO PATH".
 * It was accurate when written and it was also the reason the Build Console
 * path lost the mockup: `assembleBuilderGoal` (build.functions.ts) never called
 * `formatScaffoldHtmlBlock`, so on that path the first rung of this ladder
 * surrendered the ONLY copy of the markup the design gate exists to produce.
 * The justification named a safety net that one of the two callers did not
 * have. It has one now, and the safety net is what makes this rung first —
 * so if a third dispatch path is ever written without that fence, this rung's
 * ordering is wrong for it and this comment is the notice.
 */
type LadderRung = {
  key: string;
  recover: string;
  /** Removes the key and returns the JSON size freed, or 0 if it was not there. */
  drop: (doc: BudgetedArdBlock) => number;
};

/** Size of a value as it would have cost inside the document. */
function jsonSize(value: unknown): number {
  if (value === undefined) return 0;
  try {
    return JSON.stringify(value)?.length ?? 0;
  } catch {
    return 0;
  }
}

/** True for values whose removal costs the reader nothing (there was nothing there). */
function isEmptyValue(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "string") return value.trim() === "";
  return false;
}

function dropDesignKey(doc: BudgetedArdBlock, key: keyof ArdDesignSection): number {
  const design = doc.design as Record<string, unknown> | undefined;
  if (!design || !(key in design)) return 0;
  const value = design[key];
  // TypeScript marks these keys required on `ArdDesignSection`, so the delete
  // needs the index-signature view. The cast is local and the shape is checked
  // by the `key in design` guard above.
  delete design[key];
  // An empty or absent value is deleted silently: recording an omission for a
  // scaffold that was never drawn would send the reader chasing a mockup that
  // does not exist, which is the same defect as a false progress claim.
  return isEmptyValue(value) ? 0 : jsonSize(value);
}

function dropContractKey(doc: BudgetedArdBlock, key: "evidence_links" | "non_goals"): number {
  const contract = doc.contract as unknown as Record<string, unknown> | undefined;
  if (!contract || !(key in contract)) return 0;
  const value = contract[key];
  delete contract[key];
  return isEmptyValue(value) ? 0 : jsonSize(value);
}

const DROP_LADDER: LadderRung[] = [
  {
    key: "design.scaffold_html",
    recover: DESIGN_TAB_RECOVERY,
    drop: (doc) => dropDesignKey(doc, "scaffold_html"),
  },
  {
    key: "design.flow_steps",
    recover: DESIGN_TAB_RECOVERY,
    drop: (doc) => dropDesignKey(doc, "flow_steps"),
  },
  {
    key: "design.memory",
    recover: DESIGN_TAB_RECOVERY,
    drop: (doc) => dropDesignKey(doc, "memory"),
  },
  {
    key: "contract.evidence_links",
    recover: CONTRACT_TAB_RECOVERY,
    drop: (doc) => dropContractKey(doc, "evidence_links"),
  },
  {
    key: "contract.non_goals",
    recover: CONTRACT_TAB_RECOVERY,
    drop: (doc) => dropContractKey(doc, "non_goals"),
  },
];

/** The last resort before over-budget: how much of a clause's own text survives. */
export const CLAUSE_TEXT_FLOOR = 240;
const CLAUSE_TRIM_MARK = " …[clause text trimmed for the work-order budget]";

/**
 * Shorten the remaining clause texts in place. Trimming a STRING keeps the
 * document parseable, which is the whole difference between this and the
 * character slice it replaces: a cut inside a JSON string literal destroys the
 * document, a shorter string literal does not.
 */
function trimClauseTexts(doc: BudgetedArdBlock): number {
  const contract = doc.contract as unknown as Record<string, unknown> | undefined;
  if (!contract) return 0;
  let saved = 0;
  for (const section of ["non_goals", "success_metrics"] as const) {
    const clauses = contract[section];
    if (!Array.isArray(clauses)) continue;
    for (const clause of clauses) {
      if (!clause || typeof clause !== "object") continue;
      const row = clause as Record<string, unknown>;
      const text = row.text;
      if (typeof text !== "string" || text.length <= CLAUSE_TEXT_FLOOR) continue;
      const trimmed = `${text.slice(0, CLAUSE_TEXT_FLOOR)}${CLAUSE_TRIM_MARK}`;
      /**
       * NEVER LENGTHEN A CLAUSE WHILE CALLING IT TRIMMED.
       *
       * THE DEFECT, caught in review before it shipped. CLAUSE_TRIM_MARK is 49
       * characters and CLAUSE_TEXT_FLOOR is 240, so every clause between 241
       * and 288 characters was REPLACED BY A LONGER STRING. `saved` went
       * negative, the `saved > 0` guard below turned that into 0, and so no
       * receipt was written at all -- but the mutation had already happened.
       * Measured: thirty 245-character success metrics grew the document from
       * 12,994 to 14,279 characters, with `omitted_for_budget` undefined.
       *
       * WHY IT IS WORSE THAN A WASTED BUDGET. The builder received an
       * acceptance criterion that had been ALTERED, carrying a mark saying it
       * was shortened for space, when it had been lengthened. That is a
       * sentence reporting work the code did not do, inside the one document
       * the build is graded against, in the exact key this ladder exists to
       * protect. The over-budget notice then quoted the inflated size back as
       * evidence that everything optional had already been dropped.
       *
       * Nothing caught it: the invariant test only asserts the fence parses,
       * and the shortening test uses a 4,000-character clause, safely on the
       * far side of the boundary where the arithmetic still works.
       */
      if (trimmed.length >= text.length) continue;
      saved += text.length - trimmed.length;
      row.text = trimmed;
    }
  }
  return saved > 0 ? saved : 0;
}

/** Deep clone through JSON: the document is about to be stringified anyway, so
 *  anything this cannot survive could never have been fenced in the first place. */
function cloneDocument(ard: ArdDocument): BudgetedArdBlock {
  return JSON.parse(JSON.stringify(ard)) as BudgetedArdBlock;
}

/** Pretty when it fits, compact when pretty does not, null when neither does. */
function renderWithinCap(doc: unknown, capChars: number): string | null {
  const pretty = JSON.stringify(doc, null, 2);
  if (pretty.length <= capChars) return pretty;
  const compact = JSON.stringify(doc);
  return compact.length <= capChars ? compact : null;
}

/**
 * PURE. Render the ARD document as the delimited work-order block: a headline
 * naming the contract, then the fenced JSON.
 *
 * THE FENCE IS VALID JSON AT EVERY SIZE. That invariant is the point of this
 * function and it was not held before 2026-08-05. The previous implementation
 * met the budget with `json.slice(0, capChars)`, and the shape of a real
 * document made that fatal rather than merely lossy: an approved mockup (up to
 * 20,000 chars, `ARD_SCAFFOLD_HTML_CAP`) is serialised as the last field of the
 * last key, so an 8,000-char slice of a 17,475-char mockup cut inside a JSON
 * string literal. That single unterminated string invalidated the ENTIRE fenced
 * block, taking the acceptance criteria and the outcome contract down with it
 * even though both are small and sat thousands of characters earlier in the
 * document. The dispatched agent got a fence it could not parse and silently
 * built from the prose alone — which is exactly the failure the ARD exists to
 * prevent, so nothing downstream noticed. The recovery the truncation notice
 * pointed at did not work either: `get_ard` returned an envelope with no design
 * section at all until the same date.
 *
 * So the budget is met by dropping WHOLE KEYS in `DROP_LADDER` order instead,
 * each removal recorded by name in `omitted_for_budget` inside the JSON and
 * repeated in prose after the fence. If even the fully-stripped document is
 * over budget it is sent WHOLE and parseable with a plain notice, because a
 * document that is 200 chars too long is a cost and a document that does not
 * parse is a loss.
 */
export function formatArdWorkOrderBlock(
  ard: ArdDocument,
  capChars: number = ARD_BLOCK_MAX_CHARS,
): string {
  const header = `THE CONTRACT (ARD v${ard.ard_version}), every clause carries its oracle`;
  const doc = cloneDocument(ard);
  const omitted: ArdBlockOmission[] = [];

  let json = renderWithinCap(doc, capChars);
  for (const rung of DROP_LADDER) {
    if (json !== null) break;
    const chars = rung.drop(doc);
    if (chars > 0) {
      omitted.push({ key: rung.key, chars, recover: rung.recover });
      doc.omitted_for_budget = omitted;
    }
    json = renderWithinCap(doc, capChars);
  }

  if (json === null) {
    const chars = trimClauseTexts(doc);
    if (chars > 0) {
      omitted.push({
        key: "contract clause text (shortened, not removed)",
        chars,
        recover: CONTRACT_TAB_RECOVERY,
      });
      doc.omitted_for_budget = omitted;
    }
    json = renderWithinCap(doc, capChars);
  }

  // Every rung spent and still over: send it whole. Compact, parseable, and
  // honest about the overage — never a slice.
  const overBudget = json === null;
  if (json === null) json = JSON.stringify(doc);

  const out = [`${header}\n\`\`\`json\n${json}\n\`\`\``];
  if (omitted.length > 0) {
    const listed = omitted.map((o) => `${o.key} (${o.chars} chars)`).join(", ");
    out.push(
      `(ARD budgeted to ${capChars} chars: ${omitted.length} key${omitted.length === 1 ? "" : "s"} dropped to fit: ${listed}. The JSON above is complete and parseable exactly as it stands; every dropped key is named inside it under "omitted_for_budget" with where to fetch it.)`,
    );
  }
  if (overBudget) {
    out.push(
      `(ARD over budget: with every optional key dropped the document is still ${json.length} chars, over the ${capChars}-char work-order budget. It is sent whole rather than cut, because a cut JSON document takes the acceptance criteria down with it.)`,
    );
  }
  return out.join("\n");
}

/** The approved mockup's own fence gets the same budget the design station
 *  applies when it loads one (`ARD_SCAFFOLD_HTML_CAP`), so the two cannot drift. */
export const SCAFFOLD_BLOCK_MAX_CHARS = ARD_SCAFFOLD_HTML_CAP;

/**
 * THE HEADER CLAIMS ONLY WHAT IS TRUE OF EVERY MOCKUP THAT REACHES HERE.
 *
 * It read "THE APPROVED MOCKUP (a human passed this markup through the design
 * gate)". That is not knowable at this point and is often false.
 * `loadDesignDispatchContext` reads `prd_scaffolds` by `prd_id` alone, and that
 * table has no status column at all -- approval lives on `prds.design_gate_status`
 * -- while `designGateBlocksDispatch` returns false whenever the design stage is
 * switched off, which is a live user toggle that also fails open on a read
 * error. So with the stage off, a mockup nobody reviewed, or one that was
 * REJECTED, was handed to the builder under a sentence asserting a human had
 * approved it.
 *
 * The instruction is the valuable half and it is true either way: build against
 * this markup. The provenance claim was the half that could be a lie, so it is
 * the half that goes. Saying less is not a weaker prompt; a builder that trusts
 * a false approval builds the wrong thing with confidence.
 */
export const SCAFFOLD_BLOCK_HEADER =
  "THE MOCKUP FOR THIS SPEC, from the design station; build the UI against this markup: same structure, same states, same copy";

/**
 * PURE. Render the gate-approved scaffold as its OWN fenced `html` section.
 *
 * Markup inside a JSON string is what made the ARD truncation fatal rather than
 * merely lossy, because the escaping means any cut lands inside a string
 * literal. Given its own fence the mockup stops competing with the acceptance
 * contract for one budget, arrives as markup a coding agent can read directly
 * instead of as an escaped blob it must first unescape, and — because HTML is
 * not a balanced-delimiter format the way JSON is — a cut here costs trailing
 * markup and nothing else.
 */
export function formatScaffoldHtmlBlock(
  html: string,
  capChars: number = SCAFFOLD_BLOCK_MAX_CHARS,
): string {
  const trimmed = html.trim();
  if (!trimmed) return "";
  const body = trimmed.length <= capChars ? trimmed : trimmed.slice(0, capChars);
  // A scaffold that itself contains a triple backtick would close our fence
  // early and spill markup into the work order as prose. Markdown allows a
  // longer fence to contain a shorter one, so count what is inside and open
  // wider. Nothing caught this before because every scaffold to date has been
  // generated HTML, which has no reason to contain a code fence — until one
  // documents a code block.
  const longestRun = [...trimmed.matchAll(/`+/g)].reduce((n, m) => Math.max(n, m[0].length), 0);
  const fence = "`".repeat(Math.max(3, longestRun + 1));
  const out = [`${SCAFFOLD_BLOCK_HEADER}\n${fence}html\n${body}\n${fence}`];
  if (body.length < trimmed.length) {
    out.push(
      `(Mockup truncated: the approved markup is ${trimmed.length} chars, over the ${capChars}-char budget for this block, so the tail is missing. Open the spec's Design tab, or call the MCP get_ard tool, for the whole thing.)`,
    );
  }
  return out.join("\n");
}
