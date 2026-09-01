// The workspace automation flags, and the rules that decide what each one costs.
//
// THIS FILE IMPORTS NOTHING ON PURPOSE, so the catalogue below is reachable from
// a test, from a server function, and from a client component without dragging
// the AI runtime or createServerFn into any of them.
//
// WHY IT EXISTS AT ALL. `workspaces.auto_derive_enabled` shipped 2026-06-30 with
// `NOT NULL DEFAULT false` and, for six weeks, NO WRITER ANYWHERE IN THE REPO.
// Two live cron jobs read it as a filter -- calibrate-tick and
// assumption-watch-tick -- so both selected zero rows on every run, on schedule,
// reporting healthy, forever. Measured in production on 2026-08-14: 21
// workspaces, 0 with the flag on. Everything downstream was dead with it:
// insight resolution, brier scoring, the 72h generator throttle, and the whole
// FC-01 forecast audit, which is the mechanism the product's positioning rests
// on. A column that is only ever read is not a setting, it is a permanent `false`
// spelled in a way that looks configurable.

/**
 * THE SWEEP THAT FOUND THE SECOND ONE. Once the guard test below existed it
 * immediately turned up `auto_scout_enabled` in the identical state: read as a
 * filter by scout-tick (hourly) and competitor-tick (weekly), written by
 * nothing, 0 of 21 workspaces enabled. Two live cron jobs, same empty loop.
 *
 * Four other gating columns were checked and are healthy, so this is a real
 * distinction and not a blanket indictment: `auto_cluster_enabled` and
 * `design_stage_enabled` have writers and are on for all 21 workspaces;
 * `auto_sense_enabled` and `auto_trigger_enabled` are written by
 * onboarding/first-ingest.server.ts. Only the two below were unreachable.
 */

/** A workspace flag that gates background work. */
export type AutomationFlag = {
  /** The `workspaces` column. */
  column:
    | "auto_sense_enabled"
    | "auto_derive_enabled"
    | "auto_trigger_enabled"
    | "auto_scout_enabled"
    | "cold_start_promotion_enabled";
  /** What a person is actually turning on. Practitioner words, not column names. */
  label: string;
  /**
   * Whether flipping this on causes recurring model spend. This is the single
   * fact that decides whether an agent may arm a flag on its own initiative or
   * has to ask, so it lives in the catalogue rather than in a comment somewhere.
   */
  costsModelCalls: boolean;
  /** What stops happening while it is off. Written for the person deciding. */
  darkWhenOff: string;
  /**
   * A PLATFORM capability this flag needs, beyond the workspace's own switch.
   *
   * WHY THIS EXISTS, and it is the same defect one level up. `auto_derive_enabled`
   * was a column that could be read and never written, so "off" was permanent and
   * looked configurable. This is the mirror image: a flag that CAN be turned on,
   * is turned on, and still does nothing, because the thing it drives is gated on
   * a platform secret nobody in the workspace can see.
   *
   * `scout-tick` and `researcher-tick` both return early when
   * `FIRECRAWL_API_KEY` is unset. They say so honestly, in a JSON body that goes
   * to pg_cron and is read by nobody, and the early return happens BEFORE the
   * job ledger is opened, so not even a run is recorded. Meanwhile the workspace
   * switch reads on. So a person can arm market watching, be told it is armed,
   * and never once be told that the platform cannot do it.
   *
   * Absent means the workspace switch is the only condition, which is true of
   * most of them.
   */
  requiresPlatform?: {
    /** The env var, named so an operator knows exactly what to set. */
    key: string;
    /** What is missing, in the words a person reads. Never the variable name. */
    missing: string;
  };
};

/**
 * What a flag is ACTUALLY doing, which is not always what its switch says.
 *
 * Three states rather than two, because "off" and "on but it cannot run" need
 * different things from a person and a two-state model has to call one of them by
 * the other's name. `grounded` is the one that did not exist: armed, willing, and
 * held down by something outside the workspace.
 */
export type AutomationRunState = "off" | "grounded" | "on";

/**
 * PURE. Resolve a flag's switch and the platform's readiness into one answer.
 *
 * `platformReady` is three-valued on purpose. `null` means nobody checked, and it
 * is read as READY, which is the opposite of how this codebase treats an unknown
 * elsewhere and is deliberate: this function feeds a label, not a gate. Reporting
 * "your Scout cannot run" because a readiness probe failed would be inventing an
 * outage, and a client that has no way to read a server env var would otherwise
 * show every flag as grounded.
 */
export function automationRunState(input: {
  flag: AutomationFlag;
  enabled: boolean;
  platformReady?: boolean | null;
}): AutomationRunState {
  if (!input.enabled) return "off";
  if (!input.flag.requiresPlatform) return "on";
  return input.platformReady === false ? "grounded" : "on";
}

export const AUTOMATION_FLAGS: readonly AutomationFlag[] = [
  {
    column: "auto_sense_enabled",
    label: "Read connected sources on a schedule",
    costsModelCalls: false,
    darkWhenOff: "Connected sources are never polled, so no new signals arrive on their own.",
  },
  {
    column: "auto_trigger_enabled",
    label: "Propose work from what it reads",
    costsModelCalls: false,
    darkWhenOff: "Signals accumulate and nothing is ever proposed from them.",
  },
  {
    column: "auto_derive_enabled",
    label: "Grade its own calls and settle due forecasts",
    costsModelCalls: true,
    darkWhenOff:
      "Insights are never resolved or scored, and a due forecast reaches the desk with no drafted verdict. The desk itself still works: settling by hand is not gated on this.",
  },
  {
    column: "cold_start_promotion_enabled",
    label: "Start work before the evidence piles up",
    costsModelCalls: true,
    darkWhenOff:
      "A new workspace waits, and it waits forever. Work starts on its own only once eight signals say the same thing, and a workspace holding fewer than eight signals in total can never reach that bar, so nothing is ever proposed from what it already knows. Measured 2026-08-22: no real workspace has ever started work this way. With this on, the frequency bar scales with how much this workspace has actually said, never below three, and severity and confidence are untouched.",
  },
  {
    column: "auto_scout_enabled",
    label: "Watch competitors and the wider market",
    costsModelCalls: true,
    darkWhenOff:
      "Scout and competitor sweeps select this workspace never, so market movement is only ever noticed by a person going to look for it.",
    // The one flag whose switch is not the only condition. Both sweeps behind it
    // stop before they start when the crawler is unconfigured.
    requiresPlatform: {
      key: "FIRECRAWL_API_KEY",
      missing:
        "Reading the open web is not switched on for this platform yet, so market watching stays armed and idle until an admin sets it up.",
    },
  },
];

export function automationFlag(column: string): AutomationFlag | undefined {
  return AUTOMATION_FLAGS.find((f) => f.column === column);
}

/**
 * Pure. Every flag whose name appears as a `.eq(<column>, true)` read filter in
 * the codebase must also appear here, and every flag here must be settable.
 * `automationFlagColumns` is what the guard test compares against, so adding a
 * gating column without a way to turn it on fails a test rather than going
 * quietly dark for six weeks.
 */
export const automationFlagColumns: readonly string[] = AUTOMATION_FLAGS.map((f) => f.column);

/** Every platform capability the catalogue depends on, deduplicated. */
export const AUTOMATION_PLATFORM_KEYS: readonly string[] = [
  ...new Set(
    AUTOMATION_FLAGS.map((f) => f.requiresPlatform?.key).filter((k): k is string => Boolean(k)),
  ),
].sort();

/**
 * Does arming this flag need a person who can approve spend?
 *
 * Kept as a function rather than read inline so the answer is stated in one
 * place. A caller arming flags in a batch -- onboarding, a seed, a repair
 * script -- can ask this instead of hardcoding which ones are safe.
 */
export function needsSpendApproval(column: string): boolean {
  return automationFlag(column)?.costsModelCalls ?? true;
}
