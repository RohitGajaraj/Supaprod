/**
 * INSTRUMENT: REWORK — the KPI to watch when agents do most of the building.
 *
 * Market research across 679 documents landed on one measure, and it is not
 * speed. Verbatim from the source: "The KPI I'd watch isn't speed. It's rework:
 * clarification loops, reopened tickets, spec/design mismatches, review burden,
 * first-pass acceptance." Rework is unpaid work, so this number reads as RELIEF
 * rather than throughput. It goes down when the machine stops making a person
 * do the same thing twice.
 *
 * This is the pure half, so the same rollup answers the server read, any
 * surface, and the tests. The read half is `./rework.functions`.
 *
 * FOUR OF THE FIVE ARE REAL. Clarification loops are named as absent rather
 * than faked, for the same reason `run-analytics` carries a
 * `retriesNotMeasured` flag: a zero in a dashboard reads as "this does not
 * happen", and the honest statement is that nothing counts them.
 *
 * ------------------------------------------------------------------
 * THE THREE WAYS THIS INSTRUMENT COULD LIE, AND WHAT STOPS EACH
 * ------------------------------------------------------------------
 *
 * 1. IT HAS ALMOST NO HISTORY. `human_gate_events` started filling on
 *    2026-08-10. Before that the capture rate was zero: 113 rows existed, 112
 *    were demo seed on a single seed timestamp, and the ONE row a real human
 *    produced carried `workspace_id = NULL`, so every workspace-scoped reader
 *    was blind to it. A confident-looking rate over three events is the first
 *    thing this instrument would get wrong, so the window and the counted row
 *    count travel with every number and `belowConfidenceFloor` says out loud
 *    when the sample cannot carry a rate.
 *
 * 2. ZERO MEANS TWO OPPOSITE THINGS. `summarizeGateSignals` returns
 *    `correctionRate: 0` for an EMPTY corpus, which is the same value it
 *    returns for an agent whose every draft was accepted as written. Rolled up
 *    naively, that reports PERFECTION for agents nobody has ever checked. So
 *    every rate here is `number | null`, null exactly when the denominator is
 *    zero, and every block carries an explicit `measured` boolean. A surface
 *    that reads null renders "not measured"; a surface that reads 0 is entitled
 *    to render "every gate needed a correction", because that is now the only
 *    thing 0 can mean.
 *
 * 3. THE CORPUS IS MOSTLY FICTION. Seven seeded "Helio Labs" workspaces hold
 *    112 of the 113 gate events. Counting them does not merely inflate the
 *    instrument, it replaces it. They are excluded here, in the pure rollup,
 *    rather than in the SQL, and `isDemoWorkspaceId` explains why that
 *    placement is load-bearing.
 *
 * Reconciliation is a rule, not an aspiration: per-agent and per-subject totals
 * sum to the counted total, and anything that cannot be attributed lands in a
 * named bucket instead of being dropped. A breakdown that disagrees with the
 * total beside it on the same screen is how a person learns to stop trusting a
 * dashboard.
 */
import { summarizeGateSignals } from "@/lib/gate-signals";

/** The day real gate capture began. Everything before it is seed or silence. */
export const REWORK_CAPTURE_BEGAN_AT = "2026-08-10";

/**
 * How many scored gates a rate needs before a surface may present it as a rate.
 *
 * This is a stated convention, not a statistical claim: below twenty gates a
 * single decision moves the number by more than five points, which is more
 * movement than any reader would attribute to one event. Under the floor the
 * counts are still true and still worth showing; the RATE is what must not be
 * drawn as if it meant something.
 */
export const REWORK_CONFIDENCE_FLOOR = 20;

/**
 * The verdict `sendBackApprovalItem` writes when a human returns a gate to its
 * revisable state. Kept as one constant because the capture site
 * (approvals-queue.functions.ts step 4) and this reader must never drift: a
 * renamed verdict would silently take the reopen count to zero, and zero
 * reopens is a claim this instrument is not allowed to make by accident.
 */
export const SEND_BACK_VERDICT = "sent_back";

/**
 * The seven seeded Helio Labs workspaces, by the shape of their ids.
 *
 * Mirrors the SQL predicate the rest of the codebase uses,
 * `workspace_id::text like '_0000000-0000-4000-8000-000000000000'`, where `_`
 * matches exactly one character. Matched on id rather than on name on purpose:
 * a workspace name is editable in-product by anyone with access, so a name
 * match reopens the leak the moment somebody renames one. These ids are fixed
 * by the seed migration and cannot drift.
 */
export const DEMO_WORKSPACE_ID_PATTERN = /^.0000000-0000-4000-8000-000000000000$/;

/**
 * True for a seeded demo workspace, and FALSE for a null workspace.
 *
 * The null case is the whole reason this filter lives in TypeScript rather than
 * in the query. `WHERE workspace_id::text NOT LIKE '_0000000-...'` evaluates to
 * NULL for a null workspace_id, so Postgres drops that row — and the single
 * gate event a real human has ever produced is exactly a row with a null
 * workspace_id. A SQL-side exclusion would have discarded the only real
 * evidence in the table while claiming to remove the fake evidence.
 */
export function isDemoWorkspaceId(id: string | null | undefined): boolean {
  if (typeof id !== "string") return false;
  return DEMO_WORKSPACE_ID_PATTERN.test(id.trim().toLowerCase());
}

/** One `human_gate_events` row, as much of it as this rollup needs. */
export type ReworkGateRow = {
  gate_type?: string | null;
  agent_slug?: string | null;
  workspace_id?: string | null;
  subject_type?: string | null;
  verdict?: string | null;
  created_at?: string | null;
};

/** One `prds` row, as much of it as the spec/design divergence check needs. */
export type ReworkSpecRow = {
  status?: string | null;
  design_gate_status?: string | null;
  workspace_id?: string | null;
  is_sample?: boolean | null;
};

/** The bucket a row lands in when its agent was never recorded. */
export const UNATTRIBUTED = "(unattributed)";
/** The bucket a row lands in when its subject was never recorded. */
export const UNSPECIFIED_SUBJECT = "(unspecified)";

/* ==================================================================
 * COMPONENT 1 — FIRST-PASS ACCEPTANCE
 * ================================================================== */

/**
 * How often an agent's draft survived the gate as written.
 *
 * Computed from `summarizeGateSignals`, which already owns the definition of a
 * correction (rejection, edit and override are the human intervening; a clean
 * approval is the agent having been right). That definition is NOT restated
 * here — one source of truth for what counts as a correction is the only thing
 * that keeps the approvals tray's own chip and this rate from ever naming
 * different numbers for the same events.
 */
export type AcceptanceStats = {
  /** The agent whose drafts these gates judged, or `(unattributed)`. */
  agentSlug: string;
  /** Every gate a human decided on this agent's work. */
  gatesTouched: number;
  /** Gates the agent passed as drafted. */
  acceptedFirstPass: number;
  /** Gates where the human had to change, reject or override something. */
  corrected: number;
  /**
   * acceptedFirstPass / gatesTouched, or NULL when nothing was measured.
   *
   * Never zero-for-empty. Zero here means the measured thing happened and went
   * badly every single time, which is a claim worth drawing. Null means nobody
   * has ever checked this agent, which is a different claim and gets different
   * pixels.
   */
  firstPassAcceptanceRate: number | null;
  /** False exactly when gatesTouched is 0. */
  measured: boolean;
  /** True when measured but the sample is under REWORK_CONFIDENCE_FLOOR. */
  belowConfidenceFloor: boolean;
};

/* ==================================================================
 * COMPONENT 2 — REVIEW BURDEN
 * ================================================================== */

/**
 * How much gate-standing the machine asked of a human, over a stated window.
 *
 * Every `human_gate_events` row IS a gate a person had to stop and look at, so
 * the burden is the row count. The window travels with it because a count with
 * no window is not a burden, it is a number.
 */
export type ReviewBurden = {
  gatesTouched: number;
  /** The subset that cost more than a glance: the human changed something. */
  gatesRequiringCorrection: number;
  /** Every subject type, not a top-N: a truncated list would not sum to the
   *  total printed beside it. */
  bySubjectType: Array<{ subjectType: string; gates: number }>;
  /** The window the caller asked for, in days. */
  windowDays: number | null;
  /** gatesTouched / windowDays. Null when unmeasured or the window is unknown. */
  gatesPerDay: number | null;
  /**
   * Days between the first and last counted event.
   *
   * Reported beside `gatesPerDay` because right now they disagree violently:
   * capture began on 2026-08-10, so a 30-day window divides today's gates by
   * thirty and produces a per-day burden that never happened on any day. A
   * surface reading `observedSpanDays: 0` should say "all of them today", not
   * draw a monthly average.
   */
  observedSpanDays: number | null;
  measured: boolean;
};

/* ==================================================================
 * COMPONENT 3 — REOPENED
 * ================================================================== */

/**
 * Work that had to come back. A send-back returns a gate to its revisable
 * state with the operator's note, which is a reopen by any definition.
 */
export type ReopenedStats = {
  /** Send-backs visible in the gate stream. */
  reopens: number;
  byAgent: Array<{ agentSlug: string; reopens: number }>;
  bySubjectType: Array<{ subjectType: string; reopens: number }>;
  /**
   * Rows carrying the send-back verdict on a gate type that is not a
   * correction. Zero in practice, because the capture site writes
   * `gateType: "rejection"` — but it is counted rather than discarded, so that
   * `reopens + reopenVerdictOnNonCorrectionGate` always accounts for every
   * send-back-shaped row the rollup saw.
   */
  reopenVerdictOnNonCorrectionGate: number;
  /**
   * `approval_feedback` rows in the same window, or null when the caller did
   * not read them.
   *
   * This is the corroborating count and it is deliberately NOT the headline.
   * `approval_feedback` carries no workspace_id, so its rows cannot be scoped
   * to a workspace and cannot have demo seed excluded from them. It is worth
   * reporting because it is the only count that includes send-backs on
   * human-drafted items, and worth labelling because it cannot be cleaned.
   */
  sendBackNotesRecorded: number | null;
  /**
   * TRUE always. `sendBackApprovalItem` writes its gate event only when
   * `attribution.agentDrafted` is true, so a human sending back their own draft
   * leaves a note and no event. That send-back is real rework and this count
   * does not contain it. Stated as a flag rather than corrected with a guess,
   * because the size of the gap is itself unmeasured.
   */
  gateEventReopensUndercount: true;
  measured: boolean;
};

/* ==================================================================
 * COMPONENT 4 — SPEC / DESIGN MISMATCH
 * ================================================================== */

/**
 * Where the design gate and the spec's own status contradict each other.
 *
 * A rejected design gate on a spec that reads approved or shipped is a
 * divergence: two records of the same decision disagree, and somebody is going
 * to build against the wrong one.
 *
 * The undecided cases are held apart from the divergent ones rather than folded
 * in. A pending design gate on an approved spec is a gate nobody has reached
 * yet, which is ordinary; counting it as a mismatch would report divergence for
 * every spec that simply has not got there.
 */
export type SpecDesignMismatch = {
  specsScanned: number;
  specsFromDemo: number;
  specsCounted: number;
  /** Design gate rejected while the spec itself reads approved or shipped. */
  divergent: number;
  /** Spec decided, design gate still pending. Not a divergence; not yet news. */
  designGateUndecided: number;
  /** Spec decided, design gate approved. The two records agree. */
  aligned: number;
  /** Spec still draft or in review: an undecided spec has nothing to diverge from. */
  specUndecided: number;
  /** A design_gate_status outside the three the CHECK constraint permits.
   *  Bucketed, never silently treated as pending. */
  unclassifiable: number;
  /** divergent / specsCounted, or null when nothing was counted. */
  divergenceRate: number | null;
  measured: boolean;
};

/* ==================================================================
 * THE CORPUS ITSELF
 * ================================================================== */

export type ReworkCorpus = {
  /** Rows handed to the rollup. */
  gateEventsScanned: number;
  /** Rows thrown out as seeded demo data. Checked FIRST, so a demo row with an
   *  unrecognised gate_type is counted here and not twice. */
  gateEventsFromDemo: number;
  /** Real rows whose gate_type is not one the vocabulary recognises. They
   *  cannot be scored and are never quietly counted as clean approvals. */
  gateEventsUnscorable: number;
  /** What every number in this rollup is actually computed over. */
  gateEventsCounted: number;
  measured: boolean;
  belowConfidenceFloor: boolean;
  confidenceFloor: number;
  /** The day capture began, so a surface can say how young this is. */
  captureBeganAt: string;
  firstEventAt: string | null;
  lastEventAt: string | null;
};

export type ReworkWindow = {
  days: number | null;
  sinceIso: string | null;
  untilIso: string | null;
};

export type ReworkRollup = {
  window: ReworkWindow;
  corpus: ReworkCorpus;
  /** Every agent seen, plus the overall figure. Sums to corpus.gateEventsCounted. */
  firstPassAcceptance: {
    byAgent: AcceptanceStats[];
    overall: AcceptanceStats;
  };
  reviewBurden: ReviewBurden;
  reopened: ReopenedStats;
  specDesignMismatch: SpecDesignMismatch;
  /**
   * TRUE. Nothing in this product counts a clarification loop.
   *
   * A clarification loop is the round trip where an agent (or a person) has to
   * ask what was meant before work can continue, and there is no record of one
   * anywhere: `human_gate_events` captures only decisions on a finished draft,
   * `agent_runs` carries no question-and-answer turn, threads store messages
   * with no marker for which ones were a request for clarification, and the
   * only "clarifying_questions" in the codebase is a field the spec drafter
   * asks the MODEL to produce inside one generated document — never stored,
   * never counted, never resolved.
   *
   * A proxy was deliberately not invented. The plausible ones — counting
   * message turns before a first artifact, or treating every edit gate as a
   * misunderstanding — would put a real-looking number on a screen that nothing
   * in the database supports, and the number would move for reasons unrelated
   * to clarification. This flag exists so a surface says "not measured" instead
   * of drawing a zero, because a drawn zero reads as "this does not happen",
   * which is a claim we cannot support.
   */
  clarificationLoopsNotMeasured: true;
};

export type ReworkInput = {
  gateEvents: readonly ReworkGateRow[];
  specs?: readonly ReworkSpecRow[];
  /** Count of `approval_feedback` rows in the window; null when not read. */
  sendBackNotes?: number | null;
  window?: Partial<ReworkWindow>;
};

/* ------------------------------------------------------------------ */

function rate(numerator: number, denominator: number): number | null {
  return denominator === 0 ? null : numerator / denominator;
}

/**
 * Descending by count, then by name so ties are stable between reads.
 *
 * Deliberately NOT truncated to a top-N, unlike `run-analytics`'s failure kinds:
 * these lists are printed under a total they are supposed to explain, and a
 * truncated breakdown under a total is one a reader can see does not add up.
 */
function rankedEntries(counts: Map<string, number>): Array<[string, number]> {
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function bump(m: Map<string, number>, k: string): void {
  m.set(k, (m.get(k) ?? 0) + 1);
}

function nonEmpty(v: string | null | undefined): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

function acceptance(
  agentSlug: string,
  approved: number,
  corrected: number,
  total: number,
): AcceptanceStats {
  return {
    agentSlug,
    gatesTouched: total,
    acceptedFirstPass: approved,
    corrected,
    // Derived from the counts rather than from `1 - correctionRate`, so the
    // published rate is exact arithmetic on integers and cannot drift from the
    // counts printed beside it by a float subtraction.
    firstPassAcceptanceRate: rate(approved, total),
    measured: total > 0,
    belowConfidenceFloor: total > 0 && total < REWORK_CONFIDENCE_FLOOR,
  };
}

/** The spec statuses that represent a decision the design gate could contradict. */
const DECIDED_SPEC_STATUSES: ReadonlySet<string> = new Set(["approved", "shipped"]);

function daysBetween(firstIso: string | null, lastIso: string | null): number | null {
  if (!firstIso || !lastIso) return null;
  const a = Date.parse(firstIso);
  const b = Date.parse(lastIso);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.abs(b - a) / (24 * 60 * 60 * 1000);
}

/**
 * Roll a window of gate events and specs up into the rework instrument.
 *
 * Pure and total: it never throws, and every stream it is not given degrades to
 * an explicitly unmeasured block rather than to a zero.
 */
export function rollUpRework(input: ReworkInput): ReworkRollup {
  const scanned = input.gateEvents.length;

  // Demo first, so each excluded row is excluded for exactly one stated reason
  // and scanned = demo + unscorable + counted always holds.
  const real: ReworkGateRow[] = [];
  let fromDemo = 0;
  for (const r of input.gateEvents) {
    if (isDemoWorkspaceId(r.workspace_id)) fromDemo += 1;
    else real.push(r);
  }

  // `summarizeGateSignals` owns what a correction is, and it silently skips a
  // row whose gate_type it does not recognise. That skip is exactly the
  // unscorable count, recovered here from the difference rather than by
  // re-deciding the vocabulary in this file.
  const signals = summarizeGateSignals(real);
  const counted = signals.overall.total;
  const unscorable = real.length - counted;

  const bySubject = new Map<string, number>();
  const reopenByAgent = new Map<string, number>();
  const reopenBySubject = new Map<string, number>();
  let reopens = 0;
  let reopenOnNonCorrection = 0;
  let firstEventAt: string | null = null;
  let lastEventAt: string | null = null;

  for (const r of real) {
    const gateType = nonEmpty(r.gate_type);
    // Same skip as the summarizer's: an unscorable row is not evidence of
    // anything, so it contributes to no breakdown and to no denominator.
    if (
      gateType !== "approval" &&
      gateType !== "rejection" &&
      gateType !== "edit" &&
      gateType !== "override"
    ) {
      continue;
    }

    const subject = nonEmpty(r.subject_type) ?? UNSPECIFIED_SUBJECT;
    bump(bySubject, subject);

    const at = nonEmpty(r.created_at);
    if (at) {
      if (firstEventAt === null || at < firstEventAt) firstEventAt = at;
      if (lastEventAt === null || at > lastEventAt) lastEventAt = at;
    }

    if (nonEmpty(r.verdict) === SEND_BACK_VERDICT) {
      if (gateType === "approval") {
        reopenOnNonCorrection += 1;
      } else {
        reopens += 1;
        bump(reopenByAgent, nonEmpty(r.agent_slug) ?? UNATTRIBUTED);
        bump(reopenBySubject, subject);
      }
    }
  }

  const overall = acceptance(
    "(overall)",
    signals.overall.approved,
    signals.overall.corrected,
    signals.overall.total,
  );

  const byAgent = Object.entries(signals.perAgent)
    .map(([slug, s]) => acceptance(slug, s.approved, s.corrected, s.total))
    .sort((a, b) => b.gatesTouched - a.gatesTouched || a.agentSlug.localeCompare(b.agentSlug));

  const windowDays = input.window?.days ?? null;
  const observedSpanDays = daysBetween(firstEventAt, lastEventAt);

  const corpus: ReworkCorpus = {
    gateEventsScanned: scanned,
    gateEventsFromDemo: fromDemo,
    gateEventsUnscorable: unscorable,
    gateEventsCounted: counted,
    measured: counted > 0,
    belowConfidenceFloor: counted > 0 && counted < REWORK_CONFIDENCE_FLOOR,
    confidenceFloor: REWORK_CONFIDENCE_FLOOR,
    captureBeganAt: REWORK_CAPTURE_BEGAN_AT,
    firstEventAt,
    lastEventAt,
  };

  const reviewBurden: ReviewBurden = {
    gatesTouched: counted,
    gatesRequiringCorrection: signals.overall.corrected,
    bySubjectType: rankedEntries(bySubject).map(([subjectType, gates]) => ({ subjectType, gates })),
    windowDays,
    gatesPerDay: counted === 0 || !windowDays || windowDays <= 0 ? null : counted / windowDays,
    observedSpanDays,
    measured: counted > 0,
  };

  const reopened: ReopenedStats = {
    reopens,
    byAgent: rankedEntries(reopenByAgent).map(([agentSlug, reopens]) => ({ agentSlug, reopens })),
    bySubjectType: rankedEntries(reopenBySubject).map(([subjectType, reopens]) => ({
      subjectType,
      reopens,
    })),
    reopenVerdictOnNonCorrectionGate: reopenOnNonCorrection,
    sendBackNotesRecorded: input.sendBackNotes ?? null,
    gateEventReopensUndercount: true,
    measured: counted > 0,
  };

  return {
    window: {
      days: windowDays,
      sinceIso: input.window?.sinceIso ?? null,
      untilIso: input.window?.untilIso ?? null,
    },
    corpus,
    firstPassAcceptance: { byAgent, overall },
    reviewBurden,
    reopened,
    specDesignMismatch: rollUpSpecDesign(input.specs ?? []),
    clarificationLoopsNotMeasured: true,
  };
}

/**
 * Classify each spec's design gate against the spec's own status.
 *
 * Exported so the divergence check can be tested and reused on its own; a
 * surface that only has specs to hand should not have to fabricate an empty
 * gate stream to get an answer.
 *
 * Demo exclusion is BOTH tests, not either: `prds.is_sample` marks rows the
 * seed path flagged, and the workspace-id shape catches the seeded Helio Labs
 * clones, which carry `is_sample = false` and would otherwise walk straight
 * through the flag.
 */
export function rollUpSpecDesign(rows: readonly ReworkSpecRow[]): SpecDesignMismatch {
  let fromDemo = 0;
  let divergent = 0;
  let designGateUndecided = 0;
  let aligned = 0;
  let specUndecided = 0;
  let unclassifiable = 0;

  for (const r of rows) {
    if (r.is_sample === true || isDemoWorkspaceId(r.workspace_id)) {
      fromDemo += 1;
      continue;
    }
    const status = (nonEmpty(r.status) ?? "").toLowerCase();
    if (!DECIDED_SPEC_STATUSES.has(status)) {
      specUndecided += 1;
      continue;
    }
    switch ((nonEmpty(r.design_gate_status) ?? "").toLowerCase()) {
      case "rejected":
        divergent += 1;
        break;
      case "pending":
        designGateUndecided += 1;
        break;
      case "approved":
        aligned += 1;
        break;
      default:
        // The column is `text NOT NULL DEFAULT 'pending'` with a CHECK, so this
        // should be unreachable. It is bucketed rather than folded into
        // "pending" because a value that escaped the constraint is news, and
        // quietly reading it as the benign case would hide that.
        unclassifiable += 1;
    }
  }

  const counted = rows.length - fromDemo;
  return {
    specsScanned: rows.length,
    specsFromDemo: fromDemo,
    specsCounted: counted,
    divergent,
    designGateUndecided,
    aligned,
    specUndecided,
    unclassifiable,
    divergenceRate: rate(divergent, counted),
    measured: counted > 0,
  };
}
