/**
 * THE THREE FILES A TEAM ON THE PLAYBOOK ALREADY KEEPS IN ITS REPO.
 *
 * ── PROVENANCE, AND WHY THE HEADINGS ARE NOT MINE TO INVENT ───────────────
 * Anthropic's AI-native SDLC playbook (adopted 2026-08-31,
 * `the-first-run/SPEC-AI-NATIVE-SDLC.md` §2 and §3C) names `intent.md`,
 * `spec.md` and `plan.md` as the committed handoffs between its stages. A team
 * following it holds those three files, and every leading indicator it defines
 * is the gap between two of their git timestamps.
 *
 * Today Plan files a `prds` row and some tasks: real work, and nothing a person
 * can drop into their repo. This renders what we already hold into the shape
 * they already keep, so the output needs no adapter.
 *
 * ── THE FIVE INTENT FIELDS ARE QUOTED, NOT PARAPHRASED ────────────────────
 * The spec quotes the playbook: **problem statement · proposed outcome ·
 * affected users and systems · constraints · open questions.**
 *
 * P-21's own scope line paraphrased these as "problem · who it is for ·
 * constraints · what success looks like · non-goals", and A1 withdrew that on
 * 2026-09-03: the paraphrase drops `open questions`, which the spec singles out
 * as *"the field we would never have thought of: it is the one that makes a
 * handoff honest rather than confident"*, and adds `non-goals`, which belongs to
 * P-02's Outcome Contract rather than to intent. The five below are the source's.
 *
 * ── AN ABSENT FIELD SAYS SO. IT IS NEVER OMITTED. ─────────────────────────
 * Every decision on the database today has none of these, because the column
 * arrives with this packet. A renderer that dropped the empty headings would
 * produce a file that looks complete and is not, and a team reading it in their
 * own repo has no way back to us to find out which. So a missing field keeps its
 * heading and says what is missing, which is also the only form that tells the
 * agent filling them in what is left.
 *
 * Pure, and takes plain values rather than rows: the same rendering has to run
 * on the server when Build stages the files and in the browser when the Plan tab
 * draws them, and a shape that reaches for a database client cannot do both.
 */

/** What the originator and the agent agreed the work is, in the playbook's five. */
export type Intent = {
  problem_statement?: string | null;
  proposed_outcome?: string | null;
  affected_users_and_systems?: string | null;
  constraints?: string | null;
  open_questions?: string | null;
};

/** The bet, carried into `intent.md` verbatim so the repo holds what was graded. */
export type IntentForecast = {
  claim?: string | null;
  /** `forecast_how_we_will_know`: the observable that settles it. */
  observable?: string | null;
  /** `forecast_horizon_date`, rendered as the calendar day it names. */
  horizon?: string | null;
};

/** The playbook's five, in its order, with the heading each one is written under. */
export const INTENT_FIELDS: ReadonlyArray<{ key: keyof Intent; heading: string }> = [
  { key: "problem_statement", heading: "Problem statement" },
  { key: "proposed_outcome", heading: "Proposed outcome" },
  { key: "affected_users_and_systems", heading: "Affected users and systems" },
  { key: "constraints", heading: "Constraints" },
  { key: "open_questions", heading: "Open questions" },
];

/** Said in the file itself, where the reader is, rather than left blank. */
const NOT_YET = "_Not recorded yet._";

function section(heading: string, body: string | null | undefined): string {
  const text = typeof body === "string" ? body.trim() : "";
  return `## ${heading}\n\n${text || NOT_YET}\n`;
}

/**
 * `intent.md` — the playbook's Stage 1 handoff, our Decide.
 *
 * The forecast rides in it because that is the thing this product grades and the
 * repo should carry what the verdict was measured against. It is quoted
 * verbatim: a forecast reworded on the way out is a different claim, and the
 * whole value of holding it in the repo is that it cannot drift from the one on
 * the record.
 */
export function intentMd(input: {
  title: string;
  intent?: Intent | null;
  forecast?: IntentForecast | null;
  /**
   * The spec contract's own intent sentence.
   *
   * ── WHY THIS EXISTS, AND WHY IT IS NOT SLOTTED INTO A HEADING (P-112) ──
   * `decisions.intent` is the structured five-field object these headings are
   * built from, and it is populated on FIVE of 422 decisions. So this file's
   * headline sections read "not recorded yet" almost always -- while the same
   * work's intent sits in the spec's contract, written out, one row away.
   *
   * It is rendered as its own statement rather than filed under
   * `proposed_outcome` or `problem_statement`, because it was not written to
   * answer either of those questions and putting it under one would be this
   * file deciding what the author meant. It says where it came from instead.
   */
  contractIntent?: string | null;
}): string {
  const i = input.intent ?? {};
  const f = input.forecast ?? {};
  const stated = input.contractIntent?.trim();
  const parts = [
    `# ${input.title.trim() || "Untitled"}\n`,
    ...(stated ? [`## Intent\n\n${stated}\n\n_From the spec's outcome contract._\n`] : []),
    ...INTENT_FIELDS.map((field) => section(field.heading, i[field.key])),
  ];
  /*
   * The forecast is one section with three named lines rather than three
   * sections, because they are one statement: what we expect, how we will know,
   * and when. Split apart they read as three unrelated facts and the horizon
   * loses the claim it belongs to.
   */
  const bet = [
    f.claim?.trim() ? `**What we expect:** ${f.claim.trim()}` : null,
    f.observable?.trim() ? `**How we will know:** ${f.observable.trim()}` : null,
    f.horizon?.trim() ? `**Due:** ${f.horizon.trim().slice(0, 10)}` : null,
  ].filter(Boolean);
  parts.push(`## Forecast\n\n${bet.length > 0 ? bet.join("\n\n") : NOT_YET}\n`);
  return parts.join("\n");
}

/**
 * `spec.md` — the playbook's Stage 2 handoff, our Plan.
 *
 * The body is the spec's own markdown, passed through untouched. It is the
 * author's document and this file is a wrapper, not an editor: reformatting it
 * would put our headings over their words, which is the thing
 * `spec-contract.ts` already refuses to do for the same reason.
 */
export function specMd(input: {
  title: string;
  body?: string | null;
  /** The Outcome Contract's standing success metrics, when the row carries any. */
  measures?: readonly string[] | null;
  nonGoals?: readonly string[] | null;
}): string {
  const parts = [`# ${input.title.trim() || "Untitled"}\n`];
  const body = input.body?.trim();
  parts.push(body ? `${body}\n` : `${NOT_YET}\n`);
  const list = (items: readonly string[] | null | undefined) =>
    items && items.length > 0 ? items.map((m) => `- ${m}`).join("\n") : NOT_YET;
  /*
   * Only drawn when the row HAS them. 117 of 119 specs carry an empty
   * `contract`, and a "How we will know" heading over "not recorded yet" on
   * every one of them is a form telling a reader the product failed, when the
   * truth is that this spec was written before the contract existed.
   */
  if (input.measures?.length) parts.push(`## How we will know\n\n${list(input.measures)}\n`);
  if (input.nonGoals?.length) parts.push(`## Non-goals\n\n${list(input.nonGoals)}\n`);
  return parts.join("\n");
}

/** One unit of work, as `tasks` holds it. */
export type PlanTask = {
  title: string;
  detail?: string | null;
  status?: string | null;
};

/**
 * `plan.md` — the playbook's Stage 3 handoff, our Build's input.
 *
 * A checklist, because that is what it is used as: the agent works down it and a
 * person reads how far it got. `- [x]` for work already done is the one piece of
 * state markdown carries natively, and a reader of the file in their own repo
 * gets it with no key.
 */
export function planMd(input: { title: string; tasks?: readonly PlanTask[] | null }): string {
  const tasks = input.tasks ?? [];
  const head = `# ${input.title.trim() || "Untitled"}\n`;
  if (tasks.length === 0) return `${head}\n## Steps\n\n${NOT_YET}\n`;
  const lines = tasks.map((t) => {
    const done = (t.status ?? "").toLowerCase() === "done";
    const detail = t.detail?.trim();
    /* Indented under its own item so the checklist survives being pasted
       somewhere that renders markdown, which is the point of the format. */
    return `- [${done ? "x" : " "}] ${t.title.trim()}${detail ? `\n  ${detail.replace(/\n/g, "\n  ")}` : ""}`;
  });
  return `${head}\n## Steps\n\n${lines.join("\n")}\n`;
}

/** Where the three live in a customer's repo. Ours, namespaced, so dropping
 *  them in cannot collide with files the team already keeps. */
export const PLAYBOOK_DIR = ".supaprod";
export const PLAYBOOK_FILES = ["intent.md", "spec.md", "plan.md"] as const;
export const playbookPath = (name: (typeof PLAYBOOK_FILES)[number]) => `${PLAYBOOK_DIR}/${name}`;
