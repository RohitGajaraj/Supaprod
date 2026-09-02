// AMBIENT-TRIGGER (v11 #4) - the pure self-initiation policy: given accumulated workspace
// state (signal clusters that grew, recorded outcomes), decide which missions to
// self-originate, with NO database, NO AI call, NO I/O. Deterministic + unit-testable. The
// `trigger-tick` cron is the thin server glue that loads state, calls this, and writes the
// proposed missions + their Trust-Ledger receipts.
//
// This is the complement to the event reactor (reactor.functions.ts), which reacts to
// DISCRETE events (signal.created, opportunity.scored). AMBIENT-TRIGGER reacts to ACCUMULATED
// STATE crossing a threshold - the "self-driving" behavior: no human start.
//
// Reversibility governance (v11): a proposal is only ever a PROPOSED mission (a status the
// resume-runs executor ignores), so the policy commits ZERO AI spend and nothing irreversible
// happens until a human/founder promotes it to running. `reversible` is carried so a future
// activation policy can auto-run reversible internal missions while always HITL-gating the rest.
//
// Idempotency: each proposal's TITLE is its stable identity (it embeds the cluster name or the
// outcome summary, so it is unique per trigger source). The tick passes the titles of already
// open `[auto]` missions; a proposal whose title is already open is dropped. The title is the
// only anchor recoverable from `missions` (no metadata column), so dedup keys on it.

export type ThemeState = {
  id: string;
  title: string;
  frequency: number;
  severity: number;
  status: string;
  /**
   * How new this cluster is against everything the workspace already holds, 0..1.
   * Written by the embedding sweeper alongside `themes.novelty_basis`.
   *
   * NULL is a real and common state, not an error: a theme is inserted before it
   * is embedded, so it has no novelty until the next sweeper pass. It is
   * deliberately treated as "unknown", never as "new" — see `RE_DISCOVERY`.
   */
  novelty?: number | null;
  /**
   * P-14 (A-QUEUE.md), R-35's ruling: a cluster over the gate writes or
   * updates an `opportunities` row (the bet Start can show), never a mission.
   * `confidence` and `summary` are what that write needs beyond what a
   * mission proposal ever read from a theme, mirroring
   * `promoteThemeToOpportunity`'s own field-by-field mapping so an automatic
   * bet and a human-promoted one are made of the same theme the same way.
   *
   * Optional, not required: every existing fixture in this file's own test
   * suite builds a `ThemeState` without them, and this file's contract is
   * that ANY input shape is handled rather than assumed. `trigger-tick.ts`'s
   * live query always selects both; a missing value here degrades to a
   * neutral opportunity write (see the cluster branch below) rather than a
   * type error blind to what a test fixture actually carries.
   */
  confidence?: number;
  summary?: string;
  project_id?: string | null;
  product_id?: string | null;
};

export type OutcomeState = {
  id: string;
  verdict: string;
  summary: string;
  opportunity_id?: string | null;
};

/** Signal-volume counts passed by trigger-tick for Watch/Listen threshold checks.
 *  Both fields are bounded to the SAME 24h window so a workspace with a large
 *  historical backlog does not trigger perpetual re-proposals. */
export type SignalSenseState = {
  /** Signals inserted in the last 24 hours (all sources). */
  newSignalCount: number;
  /** Pull-connector signals inserted in the last 24 hours (source_kind='pull_connector'). */
  customerSignalCount: number;
};

export type TriggerProposal = {
  kind: "cluster" | "missed-outcome" | "watch-scan" | "customer-listen";
  /** Stable identity = the mission title; the tick dedups open missions on this. */
  title: string;
  goal: string;
  rationale: string;
  /** True = internal analysis (re-rank / review / investigate), safe to auto-run later.
   *  All current proposals are reversible; the field exists so an activation policy can
   *  always HITL-gate an irreversible one. */
  reversible: boolean;
  /** Higher = more urgent; the tick originates the top-N by this. */
  priority: number;
  /** Pre-assigned agent slug (discovery-scout / customer-insights). Tick looks up the
   *  UUID and sets current_agent_id so the mission arrives pre-routed to the right
   *  Sense agent. Absent for cluster/missed-outcome proposals (no default assignment). */
  agentSlug?: string;
  /**
   * P-14 (A-QUEUE.md), R-35: present ONLY on `kind: "cluster"`. The tick reads
   * this instead of creating a mission -- a cluster over the gate becomes (or
   * refreshes) one `opportunities` row, keyed on `themeId` so the same theme
   * never writes a second bet. Fields mirror `promoteThemeToOpportunity`'s own
   * mapping (`discovery.functions.ts`) so an automatic bet and a human-promoted
   * one are built from a theme the same way.
   */
  opportunity?: {
    themeId: string;
    /** The theme's own name, truncated the same way the title's wrapped
     *  form is -- the bet's title, not "Investigate the "..." cluster". */
    name: string;
    problem: string;
    impact: number;
    confidence: number;
    ease: number;
    projectId: string | null;
    productId: string | null;
  };
};

/** A cluster earns a mission when it is unaddressed AND has crossed an attention threshold. */
export const CLUSTER_FREQUENCY_THRESHOLD = 5;
export const CLUSTER_SEVERITY_THRESHOLD = 4;
/** New signals in the last 24h that warrant a Watch (discovery-scout) scan. */
export const WATCH_SIGNAL_THRESHOLD = 10;
/** Customer feedback signals (pull_connector) that warrant a Listen (customer-insights) scan. */
export const LISTEN_SIGNAL_THRESHOLD = 5;
/** Statuses that mean a theme is still worth acting on (not already handled). */
const OPEN_THEME_STATUSES = new Set(["new", "open", "active", "investigating"]);
/** Max proposals one tick will originate, so a backlog spike cannot flood missions. */
export const MAX_PROPOSALS_PER_TICK = 5;

/** All auto-originated missions carry this title prefix, so the tick can find + dedup them. */
export const AUTO_TITLE_PREFIX = "[auto]";

// ---------------------------------------------------------------------------
// RE_DISCOVERY — the gate that stops the brain asking a question it already asked
// ---------------------------------------------------------------------------
//
// THE DEFECT THIS EXISTS TO KILL, measured on the live Helio Labs workspace
// (2026-08-05): 18 of 37 pending calls were the same three problems under new
// names. "Alert fatigue" was raised as a fresh call SEVEN times across two days;
// "redundant data entry" seven times; "outage vs firmware reboot" four times.
//
// The brain had already worked out that each was a repeat and wrote the number
// down. `themes.novelty` on those rows: 0.250 (0.875 similar to a theme already
// held), 0.400 (0.800), 0.423, 0.494. Then `evaluateTriggers` opened a new call
// anyway, because ThemeState did not carry novelty and dedup was exact-title
// only. `trigger-tick` did not even SELECT the column.
//
// That is the product's own claim failing in production. Supaprod "learns and
// guides, it never merely remembers"; a loop that re-derives alert fatigue seven
// times and asks the human to investigate each one is doing neither. Worse, the
// same workspace had ALREADY COMMITTED to "Daily notification digest with an
// urgent-only override" on 2026-07-06 and went on proposing the same work for
// four more weeks.
//
// TWO GATES, because they fail in opposite directions and one alone is a trap:
//
//  1. THE NOVELTY GATE (semantic). Precise, and only available once the sweeper
//     has embedded the theme.
//  2. THE NEAR-TITLE GATE (deterministic). Cheap, pure, always available, and
//     catches the case novelty cannot: a theme with novelty still NULL. Two rows
//     titled "Alert Fatigue Leading to Muted Notifications" landed on one day,
//     both with novelty NULL, and exact-title dedup let the second through
//     because the OPEN MISSION titles differed by a word.
//
// WHY UNKNOWN NOVELTY FAILS OPEN, and this is the load-bearing call. Gating on
// `novelty != null` would silence the entire sensing layer the moment the
// embedder went down, and the embedder HAS gone down here (ai_events had no
// `embed` row for a day, 2026-08-03). A brain that goes quiet is far worse than
// one that occasionally repeats itself, and this repo's recorded failure mode is
// exactly that class: four silent failures each hiding the next. So an unknown
// novelty still raises the call, and the deterministic gate is what keeps it
// honest in the meantime.

/**
 * Novelty at or below this is a RE-DISCOVERY, not a discovery.
 *
 * Calibrated against the live re-discoveries rather than guessed. Novelty falls
 * as similarity to a known theme rises, and on the observed rows the two track
 * as roughly novelty = 2 * (1 - similarity):
 *
 *   suppress   0.250 (0.875 similar)   0.400 (0.800)   0.423 (0.789)   0.494 (0.753)
 *   allow      0.821 (0.383 similar)
 *
 * 0.5 sits in the gap, and corresponds to about 0.75 cosine similarity. A theme
 * three quarters identical to one the workspace already holds is the same
 * problem wearing a new sentence.
 */
export const NOVELTY_FLOOR = 0.5;

/** Overlap at or above this between two cluster names means they name one problem. */
export const TITLE_OVERLAP_FLOOR = 0.6;

/**
 * Words that carry no topic. Without this, "Leads to" and "Causes" alone push
 * unrelated clusters over the overlap floor and a real signal gets swallowed,
 * which is the one outcome worse than a duplicate.
 */
const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "with",
  "by",
  "from",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "that",
  "this",
  "these",
  "those",
  "it",
  "its",
  "as",
  "into",
  "during",
  "causes",
  "causing",
  "leads",
  "leading",
  "cause",
  "cluster",
  "investigate",
  "issue",
  "issues",
  "problem",
  "problems",
  // The boilerplate every auto title carries. Without these the wrapper words
  // are the comparison: two unrelated clusters both reduced to {"auto"} and
  // scored a perfect 1.0 against each other, which suppressed real work. Caught
  // by the existing cap test, so the guard for it is already in the suite.
  "auto",
]);

/** Topic words of a cluster name, lowercased and de-duplicated. */
function topicWords(title: string): Set<string> {
  return new Set(
    (title || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w)),
  );
}

/**
 * How much two cluster names say the same thing, 0..1 (Jaccard over topic words).
 *
 * Pure and deterministic by design: this file's whole contract is NO database,
 * NO AI call, NO I/O, and the gate has to keep working when the embedder does not.
 *
 * Exported for the tests, which prove it separates the real live collisions
 * ("Alert Fatigue Leading to Muted Notifications" against "Alert Fatigue Leading
 * to Feature Disengagement") from genuinely different clusters.
 */
export function titleOverlap(a: string, b: string): number {
  const A = topicWords(a);
  const B = topicWords(b);
  if (A.size === 0 || B.size === 0) return 0;
  let shared = 0;
  for (const w of A) if (B.has(w)) shared += 1;
  const union = A.size + B.size - shared;
  return union === 0 ? 0 : shared / union;
}

// ---------------------------------------------------------------------------
// SF-AUTOTRIGGER — auto-promotion policy (pure, no I/O)
// ---------------------------------------------------------------------------

/** Max missions the auto-trigger may promote in a 24h window per workspace.
 *  Keeps AI spend bounded (~$0.03 × cap). Founder-confirmed: 2/day. */
export const AUTO_TRIGGER_DAILY_CAP = 2;

/**
 * Pure eligibility check: should a just-created proposed mission be
 * auto-promoted to 'queued' without human approval?
 *
 * All four conditions must be true simultaneously:
 *  1. flagEnabled   — BRAIN_AUTO_TRIGGER=1 in env (default OFF; founder's circuit breaker)
 *  2. reversible    — the TriggerProposal is marked reversible (Watch/Listen scan kinds)
 *  3. ambientCount  — no actively mid-sprint missions in this workspace: running / in_progress /
 *                     waiting_approval (HITL-paused but active) / queued (starts imminently) /
 *                     blocked (stalled on a gate). Excludes 'proposed' (the status being created).
 *  4. autoTodayCount < AUTO_TRIGGER_DAILY_CAP — daily spend cap not yet hit
 *
 * Extracted as a pure function so it can be unit-tested without DB mocks.
 * The trigger-tick calls this after creating the proposed mission and, if true,
 * flips status→'queued' and stamps auto_trigger_source='auto'.
 */
export function shouldAutoPromote(opts: {
  flagEnabled: boolean;
  reversible: boolean;
  ambientCount: number; // mid-sprint missions (running/in_progress/waiting_approval/queued/blocked)
  autoTodayCount: number; // missions already auto-promoted today (created_at >= today UTC)
}): boolean {
  return (
    opts.flagEnabled &&
    opts.reversible &&
    opts.ambientCount === 0 &&
    opts.autoTodayCount < AUTO_TRIGGER_DAILY_CAP
  );
}

/**
 * The proposal's title, and it is now just the title.
 *
 * This used to return `[auto] ${label}`. The marker was a DEDUP KEY living in a
 * DISPLAY column, which is the design flaw behind three separate leaks to the
 * founder, and it was reaching further than any screen: it went into AI prompts
 * and into embeddings, so "[auto]" became a literal token in the brain's own
 * semantic memory, shared by every auto-raised decision.
 *
 * Provenance moved to real columns in migration 20260805120000
 * (`decisions.auto_origin`, `missions.auto_trigger_source`), which also stripped
 * the marker from all 195 existing rows. The tick now finds its own open work by
 * that column instead of by this prefix, so both halves changed together.
 *
 * AUTO_TITLE_PREFIX and isAutoMissionTitle are deliberately KEPT below rather
 * than deleted: a row written before the migration, or restored from an older
 * backup, can still carry the marker, and stripAutoPrefix on the read path is
 * the belt to this migration's braces.
 */
function autoTitle(label: string): string {
  return label;
}

function truncate(s: string, n: number): string {
  const t = (s || "").trim();
  return t.length <= n ? t : `${t.slice(0, n - 1)}…`;
}

/** True if a mission title was produced by this policy (so the tick collects only ours). */
export function isAutoMissionTitle(title: string | null | undefined): boolean {
  return typeof title === "string" && title.startsWith(`${AUTO_TITLE_PREFIX} `);
}

/**
 * Decide which missions to self-originate. Pure + deterministic.
 *  - themes: clusters with frequency/severity/status.
 *  - outcomes: recorded learnings (verdict).
 *  - signals: optional Watch/Listen signal-volume counts for sense-agent proposals.
 *  - openTitles: titles of `[auto]` missions already open (any non-terminal status) so a
 *    trigger never double-originates.
 * Returns the top MAX_PROPOSALS_PER_TICK by priority, never throwing on any input shape.
 */
export function evaluateTriggers(
  state: { themes?: ThemeState[]; outcomes?: OutcomeState[]; signals?: SignalSenseState },
  openTitles: ReadonlySet<string> = new Set(),
  opts?: { freqThreshold?: number; sevThreshold?: number; max?: number },
): TriggerProposal[] {
  const freqT = opts?.freqThreshold ?? CLUSTER_FREQUENCY_THRESHOLD;
  const sevT = opts?.sevThreshold ?? CLUSTER_SEVERITY_THRESHOLD;
  const max = opts?.max ?? MAX_PROPOSALS_PER_TICK;
  const out: TriggerProposal[] = [];

  /**
   * IS THE NOVELTY PIPELINE ALIVE? Decided from the batch itself, so this stays
   * pure and needs no health endpoint.
   *
   * If ANY theme carries a novelty score, the sweeper is running, and a theme
   * still showing NULL is simply one it has not reached yet. Raising a call on
   * that theme now is raising it blind, so it waits for the next tick, by which
   * time it will have a score and can be judged properly.
   *
   * If NO theme carries a score the sweeper is down (it has been), and waiting
   * would silence sensing entirely. So every theme is judged on the
   * deterministic gate alone and the loop keeps running.
   */
  const noveltyPipelineAlive = (state.themes ?? []).some(
    (t) => t && typeof t.novelty === "number" && Number.isFinite(t.novelty),
  );
  /** Cluster names already spoken for: open missions, plus this tick's own picks. */
  const spokenFor: string[] = [...openTitles];

  for (const t of state.themes ?? []) {
    if (!t || typeof t.id !== "string") continue;
    if (!OPEN_THEME_STATUSES.has((t.status || "").toLowerCase())) continue;
    const freq = Number(t.frequency) || 0;
    const sev = Number(t.severity) || 0;
    if (freq < freqT && sev < sevT) continue;

    // GATE 1, semantic. The brain already scored this as a repeat; honour it.
    const novelty = typeof t.novelty === "number" && Number.isFinite(t.novelty) ? t.novelty : null;
    if (novelty !== null && novelty <= NOVELTY_FLOOR) continue;
    // Scored themes exist, so an unscored one is mid-sweep rather than new.
    if (novelty === null && noveltyPipelineAlive) continue;

    const name = truncate(t.title || "untitled", 80);
    const title = autoTitle(`Investigate the "${name}" cluster`);
    if (openTitles.has(title)) continue;
    // GATE 2, deterministic. Catches the repeat whose novelty is not in yet, and
    // the second near-identical cluster inside a single tick, which exact-title
    // dedup let straight through.
    if (spokenFor.some((seen) => titleOverlap(seen, title) >= TITLE_OVERLAP_FLOOR)) continue;
    spokenFor.push(title);
    out.push({
      kind: "cluster",
      title,
      goal: `A recurring signal cluster ("${name}") has grown past the attention threshold. Review the clustered signals, decide whether it warrants an opportunity, and re-rank if so.`,
      rationale: `Self-initiated: the "${name}" cluster crossed the attention threshold (frequency ${freq}, severity ${sev}) with no active mission. Reversible internal review, so proposed for activation.`,
      reversible: true,
      priority: freq + sev * 2,
      // Same mapping `promoteThemeToOpportunity` uses by hand: impact from
      // severity (capped at the 10-point ceiling), confidence scaled to the
      // same 10-point scale, ease left neutral because nobody has scored how
      // hard this bet is to act on yet.
      opportunity: {
        themeId: t.id,
        name,
        problem: t.summary || name,
        impact: Math.min(10, sev * 2),
        confidence: Math.round((t.confidence ?? 0) * 10),
        ease: 5,
        projectId: t.project_id ?? null,
        productId: t.product_id ?? null,
      },
    });
  }

  for (const o of state.outcomes ?? []) {
    if (!o || typeof o.id !== "string") continue;
    if ((o.verdict || "").toLowerCase() !== "missed") continue;
    const summary = truncate(o.summary || "a recorded bet", 60);
    const title = autoTitle(`Re-evaluate after a missed outcome: "${summary}"`);
    if (openTitles.has(title)) continue;
    out.push({
      kind: "missed-outcome",
      title,
      goal: `A recorded outcome missed: "${summary}". Re-evaluate the governing decision and re-rank the affected priorities so the miss informs the next move.`,
      rationale: `Self-initiated: a recorded outcome was marked missed ("${summary}"). Re-evaluation is reversible internal analysis, so proposed for activation.`,
      reversible: true,
      priority: 50, // a real miss outranks a merely-large cluster
    });
  }

  // Watch proposal: enough new signals arrived to warrant a Watch (discovery-scout) scan.
  const newCount = state.signals?.newSignalCount ?? 0;
  if (newCount >= WATCH_SIGNAL_THRESHOLD) {
    const title = autoTitle("Watch: review recent signals");
    if (!openTitles.has(title)) {
      out.push({
        kind: "watch-scan",
        title,
        goal: `${newCount} new signals arrived in the last 24 hours. Review and frame what changed. Identify emerging clusters, surface framed opportunities, and log anything worth tracking.`,
        rationale: `Self-initiated: ${newCount} new signals crossed the Watch threshold (${WATCH_SIGNAL_THRESHOLD}). Dispatched to the Watch agent (discovery-scout) for review and framing.`,
        reversible: true,
        priority: 30,
        agentSlug: "discovery-scout",
      });
    }
  }

  // Listen proposal: enough customer feedback signals arrived to warrant clustering.
  const customerCount = state.signals?.customerSignalCount ?? 0;
  if (customerCount >= LISTEN_SIGNAL_THRESHOLD) {
    const title = autoTitle("Listen: cluster customer feedback");
    if (!openTitles.has(title)) {
      out.push({
        kind: "customer-listen",
        title,
        goal: `${customerCount} customer feedback signals from connected sources need clustering. Group them into named themes with verbatim quotes and counts, ready for the Strategist to rank.`,
        rationale: `Self-initiated: ${customerCount} customer feedback signals crossed the Listen threshold (${LISTEN_SIGNAL_THRESHOLD}). Dispatched to the Listen agent (customer-insights) for theme clustering.`,
        reversible: true,
        priority: 25,
        agentSlug: "customer-insights",
      });
    }
  }

  out.sort((a, b) => b.priority - a.priority);
  return out.slice(0, max);
}
