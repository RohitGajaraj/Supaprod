/**
 * OBS-09 / LOOM W2: pure view-model for the Engine Room glance. No React, no
 * server calls. EngineRoomSurface fetches the read queries and hands their
 * outputs here.
 *
 * Honesty law (DESIGN-LOOM §9b): numbers are real or absent. The old
 * FALLBACK_VERDICT prototype literals ("$482 of $600 · trending +12%") are
 * gone; a builder is only called once its inputs have genuinely loaded, and
 * the surface renders a skeleton (loading) or an error card (failure) until
 * then. A dead backend must never read as "all clear."
 *
 * Spend figures, one truth per line (audit: three contradictory figures):
 * - When a cap is set, the glance verdict reads the budget meter
 *   (ai_budgets.*_usd_used vs its cap) - the same number that actually gates
 *   AI calls - and says so ("monthly cap"). State (watch/healthy) derives
 *   from that same pair, never from a second source.
 * - When no cap is set, the verdict reads the analytics rollup (ai_events,
 *   7 days) and labels its window ("this week").
 * - The old glance line mixed both sources plus a cross-window trend in one
 *   sentence; the trend now lives only in the Spend room's TREND view, where
 *   it is labeled "vs the week before."
 */

/**
 * `unconfigured` is NOT a third shade of trouble, it is the absence of a
 * control, and it was added 2026-08-06 because the Safety room could not say
 * it. `buildSafetyGlance` keyed its state on `incidentCount > 0` alone, so a
 * workspace that had never switched a single guardrail on returned `healthy`,
 * the overview counted it toward "All four rooms are clear", and the one room
 * whose whole job is to say what the machine is allowed to do reported that
 * nothing had gone wrong as though that were the same as being set up.
 *
 * Seventeen of the twenty-one workspaces in the live database have zero
 * guardrail rules, so this was the MAJORITY reading, not an edge case. Nothing
 * caught it because every test in this file's Safety block passed a non-empty
 * `rules` array, so the zero-rule branch had never once been executed.
 */
export type RoomState = "healthy" | "watch" | "unconfigured";
export type RoomKey = "spend" | "quality" | "safety" | "record";

/**
 * One number a room already holds, brought out to the door.
 *
 * FOUNDER RULING 2026-08-06, and it reverses the ruling of 2026-07-29 that is
 * written into `.sp-row[data-tight]` in primitives.css ("if a user wants to
 * know, he will click deeper"). Tonight: "We have four sections but those are
 * NOT SPEAKING TO THE VOLUMES AND DEPTH until and unless the user clicks and
 * checks." Both rulings are about the same tension and the newer one wins HERE,
 * on the overview, because this surface exists to route a suspicion and a name
 * with one verdict on it is not enough evidence to choose a door with. The list
 * rows elsewhere in the product keep the older ruling.
 *
 * Every figure is read out of a query the glance ALREADY makes. Nothing here
 * costs a round trip, which is the reason these numbers were computed and
 * thrown away rather than never fetched.
 */
export interface GlanceFigure {
  /** Plain, lower case, no colon. Names the fact, never the mechanism. */
  label: string;
  /** Already formatted. A figure with no real number is omitted, never zeroed. */
  value: string;
  /** One clause that bounds the number: its window, its share, its direction. */
  note?: string;
}

/** The most recent real thing that happened in a room, with its own timestamp. */
export interface GlanceLatest {
  /** What happened, in plain words, from the row itself. */
  what: string;
  /** ISO from the source row. Null when that row genuinely carries no time. */
  at: string | null;
}

export interface RoomGlance {
  key: RoomKey;
  name: string;
  question: string;
  verdict: string;
  state: RoomState;
  /**
   * The single next step when a room is on watch, phrased in plain language
   * and pointing at a plain tab label. Derived from the same real state as
   * `state` (never fabricated); absent on a healthy room.
   */
  action?: string;
  /**
   * The volumes behind the verdict, in reading order. Empty when the caller
   * passed none of the optional inputs, so an older caller keeps the old,
   * smaller card rather than getting a strip of blanks.
   */
  figures: GlanceFigure[];
  /** The room's newest dated event, when it has one. */
  latest?: GlanceLatest;
}

/**
 * THE TWO READ CEILINGS THE GLANCE HAS TO KNOW ABOUT, because a count that is
 * really a ceiling must be rendered as a floor ("200+"), and both the query
 * that sets the ceiling and the builder that words it have to agree on the
 * number. They lived as a literal in exactly one of those two places, which is
 * how the Record verdict came to print `listTraces`'s cap as an exact total:
 * the live workspace logs over 15,000 AI events in seven days and this read
 * returns at most 200 traces, so "200 runs this week" was the ceiling wearing a
 * total's clothes.
 *
 * They sit in the pure module rather than beside the queries so that the
 * builders' own tests can assert the wording against the same constant the
 * surface passes in.
 */
export const TRACE_READ_LIMIT = 200;

/**
 * `getGuardrailOverview`'s own `.limit(100)` on its recent-activity hit list.
 * The live sandbox workspace has 7,141 recorded hits, so a bare "100" on the
 * Safety card understates it by two orders of magnitude. `getGuardrailHitCount`
 * exists for the exact all-time figure and costs a round trip, which is why the
 * glance states a floor instead of fetching one.
 */
export const GUARDRAIL_HIT_READ_LIMIT = 100;

export const ROOM_QUESTIONS: Record<RoomKey, string> = {
  spend: "What is this costing me?",
  quality: "Is the machine still good?",
  safety: "What is it allowed to do?",
  record: "What exactly happened?",
};

export const ROOM_NAMES: Record<RoomKey, string> = {
  spend: "Spend",
  quality: "Quality",
  safety: "Safety",
  record: "Record",
};

/**
 * The naming model (founder ruling 2026-07-07): every Engine Room sub-view
 * wears a PLAIN outcome label on the surface, with the TECHNICAL term kept
 * underneath, subtly, so a PM reads the outcome and an engineer still finds
 * the system word. `id` is the ?view= routing contract (unchanged); `label`
 * is what shows on the tab; `technical` is the quiet trace rendered at the
 * foot of the view ("the engine calls this ..."); `descriptor` is the one
 * plain line that says what the view answers.
 */
export interface RoomTabMeta {
  id: string;
  label: string;
  technical: string;
  descriptor: string;
  /**
   * ENGINEERING TOOLING, NOT A PRODUCT SURFACE. The address still answers and
   * the view still renders; no tab is drawn for it while you are standing
   * somewhere else.
   *
   * WHY THIS FLAG EXISTS. Twenty-seven writes reach the Engine Room, and NINE
   * of them are eval-suite and prompt-version CRUD. A product lead who opens
   * this to ask "how well is the machine scoring" was being shown a suite
   * editor and a prompt-version manager as peers of their own quality score.
   * Those nine writes are real and worth keeping; they belong to whoever runs
   * the workspace, which is Admin, and `/admin/quality` mounts the very same
   * components rather than copying them.
   *
   * MARKING RATHER THAN DELETING is deliberate. `?view=suites` is linked from
   * the `/evals` legacy redirect and from the calibration panel's own rows, so
   * removing the entry would strand saved links to prove a point about the nav.
   * A door that is not advertised still opens.
   */
  operator?: true;
}

export const ROOM_TAB_META: Record<RoomKey, RoomTabMeta[]> = {
  spend: [
    {
      id: "trend",
      label: "Over time",
      technical: "Cost trend",
      descriptor: "What you are spending, week over week.",
    },
    {
      id: "by-agent",
      label: "By agent",
      technical: "Agent spend breakdown",
      descriptor: "Which agents are costing you the most.",
    },
    {
      id: "caps",
      label: "Limits",
      technical: "Budget caps",
      descriptor: "The ceilings that stop spend from running away.",
    },
    {
      id: "usage",
      label: "Full usage",
      technical: "Analytics rollup",
      descriptor: "Every call, model, and token, itemized.",
    },
    // The activation funnel (old "funnel" tab) is an operator metric, not a
    // customer answer; it moved to the admin observability surface
    // (IA 2026-07-11). Deep links with ?view=funnel fall back to the trend view.
  ],
  quality: [
    /*
     * ── DIAGNOSTICS GOT ITS DOOR BUILT, 2026-08-17 ────────────────────────────
     * On 2026-08-17 I took the Diagnostics door out of the Settings rail with the
     * comment "the door is drawn from the Engine Room instead". Nothing in the Engine
     * Room drew it. Nothing anywhere linked `?section=health`. So a live report -- two
     * real server reads, `getReliabilitySlo` and `getRunawayMissions` -- was reachable
     * only by typing a URL, which is this repo's most expensive defect and I introduced
     * it while claiming the opposite.
     *
     * Founder: "certain features are kept doorless, and there is no option to reach
     * that. Users or agents, if they want to go into these settings, it's not there at
     * all."
     *
     * The REASONING for moving it was sound and is unchanged: Settings is where a person
     * states what they want, and Diagnostics reports whether the machine is achieving
     * it, which is the engine-room doctrine's own dividing line. DiagnosticsSection's
     * own header says it "stays until the Engine room's Quality room can carry the whole
     * question". This is that room, so the answer is to finish the move rather than to
     * put the door back where the reasoning says it does not belong.
     *
     * It leads the room because "is it me or is it you" is the first question anybody
     * arrives at Quality holding, and it is the cheapest one to answer.
     */
    {
      id: "diagnostics",
      label: "Is it me or you?",
      technical: "Reliability SLO and runaway missions",
      descriptor:
        "Whether the platform is having a bad day, before you go looking at your own work.",
    },
    {
      id: "score",
      label: "Right now",
      technical: "Eval pass rate",
      descriptor: "How well the machine is scoring today.",
    },
    {
      id: "calibration",
      label: "By surface",
      technical: "Calibration",
      descriptor: "Pass rate and eval guard status for each AI surface.",
    },
    {
      id: "suites",
      label: "What we test",
      technical: "Eval suites",
      descriptor: "The checks we run the machine against.",
      // Six of the nine engineering writes. Lives at /admin/quality now.
      operator: true,
    },
    {
      id: "drift",
      label: "Is it slipping?",
      technical: "Drift",
      descriptor: "Whether quality is quietly degrading over time.",
    },
    {
      id: "self-improvement",
      label: "What to fix",
      technical: "Self-improvement",
      descriptor:
        "What Supaprod flags to improve about its own quality, from real signals (RPT-50).",
    },
    {
      id: "prompts",
      label: "Its instructions",
      technical: "Prompts",
      descriptor: "The instructions the agents actually run on.",
      // The other three. Lives at /admin/quality now.
      operator: true,
    },
    {
      id: "proof",
      label: "Stress tests",
      technical: "Gauntlet",
      descriptor: "How it holds up against hard, adversarial cases.",
    },
  ],
  safety: [
    {
      id: "rules",
      label: "What is allowed",
      technical: "Guardrails",
      descriptor: "The limits on what agents can say or do.",
    },
    {
      id: "controls",
      label: "Emergency controls",
      technical: "Pause and kill switch",
      descriptor: "Stop the machine now, if you have to.",
    },
    {
      id: "team",
      label: "Who can act",
      technical: "Agent roster and trust",
      descriptor: "Each agent and how much rope it has.",
    },
    {
      id: "house-rules",
      label: "Your policies",
      technical: "House rules",
      descriptor: "The standing rules you set for this workspace.",
    },
    {
      id: "routines",
      // Plain rename, not the id echoed back (the glance test's own rule).
      label: "Runs on its own",
      technical: "Background jobs",
      descriptor: "What runs on its own, and your switch over each one.",
    },
    {
      id: "incidents",
      label: "What went wrong",
      technical: "Incidents",
      descriptor: "Times a guardrail tripped or a limit was hit.",
    },
  ],
  record: [
    {
      // RPT-31: the Agent Inbox, one manager-grade cockpit unifying pending
      // approvals, the just-happened log, and every applied change to verify or
      // roll back.
      id: "verify",
      label: "What just happened",
      technical: "Verification cockpit",
      descriptor:
        "Approvals waiting on you, the just-happened log, and every applied change to verify or roll back.",
    },
    {
      // TRUST-LEDGER MERGE (IA spine 2026-07-11): the Trust Ledger surface is
      // the Record room's front tab. Receipts, traces, and the approvals
      // record are the one Record answer; the tamper seal and public-share
      // controls live here on the receipts tab. /trust-ledger 301s to this
      // room, so its old deep links land on this front tab.
      id: "receipts",
      label: "Paper trail",
      technical: "Audit trail",
      descriptor:
        "Every decision and action on the record, with its evidence, share controls, and the tamper seal.",
    },
    {
      id: "traces",
      label: "Every run",
      technical: "Traces",
      descriptor: "A replayable record of every agent run.",
    },
    {
      id: "approvals",
      label: "Your decisions",
      technical: "Approval log",
      descriptor: "What you approved or declined, and when.",
    },
    // The "ledger" tamper-check tab folded into the receipts tab's seal panel
    // (one Record answer); an old ?view=ledger link falls back to receipts,
    // where the same tamper check lives.
    {
      id: "support",
      label: "From your users",
      technical: "Support signals",
      descriptor: "Tickets and feedback flowing back into the loop.",
    },
    /*
     * INCIDENTS BELONG WITH THE RECORD, and this is what unblocks the Safety
     * fold rather than a tidy-up.
     *
     * S0 ruled the four-route fold in A-006 with one rule that decides this: a
     * fold removes a DOOR, never a CAPABILITY. The Safety room has six views
     * and five of them have somewhere to go -- the boundary, guardrails, house
     * rules and routines all moved onto the settings pane, and "who can act"
     * already has its own settings section. Incidents had nowhere, and it
     * rendered in exactly one place, so redirecting Safety would have deleted
     * it.
     *
     * It belongs HERE because it is a log of what already happened, which is
     * the Record room's whole subject -- it sits beside the paper trail and
     * every run rather than beside the controls that decide what is allowed
     * next. That is the same line I drew in U-038 and U-047 when the spend log
     * and the event queue stayed behind while their controls moved.
     *
     * MOUNTED, NOT MOVED. Safety keeps `?view=incidents` answering until its
     * own phase completes, which is the ruling's own sequencing.
     */
    {
      id: "incidents",
      label: "What went wrong",
      technical: "Incidents",
      descriptor: "Safety incidents, with what tripped and when.",
    },
  ],
};

/** The plain label for a room's view id (falls back to the id if unknown). */
export function tabLabel(room: RoomKey, viewId: string): string {
  return ROOM_TAB_META[room].find((t) => t.id === viewId)?.label ?? viewId;
}

/**
 * WHICH TABS ARE DRAWN, as opposed to which addresses answer.
 *
 * Two different questions, and conflating them is how a nav either advertises
 * engineering tooling to a product lead or strands every saved link. Resolution
 * always reads the FULL list (`ROOM_TAB_META[room]`); only drawing goes through
 * here.
 *
 * An operator view is drawn while it is the ACTIVE one. A strip that hides the
 * tab you are currently standing on loses the reader their place in order to
 * make a point about the nav, which is a worse defect than the one it fixes.
 *
 * Extracted from the route's JSX so the rule can be asserted without a DOM.
 * Inline, it was one more piece of behaviour that could only be checked by
 * opening the page and remembering what to look for.
 */
export function drawnRoomTabs(room: RoomKey, activeView: string): RoomTabMeta[] {
  return ROOM_TAB_META[room].filter((t) => !t.operator || t.id === activeView);
}

function fmtUsd(n: number): string {
  if (n >= 1000) return `$${Math.round(n).toLocaleString("en-US")}`;
  if (n >= 10) return `$${n.toFixed(0)}`;
  // Small real amounts must not round to a fabricated "$0".
  return `$${n.toFixed(2)}`;
}

/** A whole count, grouped. Never abbreviated, because the exact figure IS the
 *  fact on a card about volume: "16k calls" and "15,577 calls" answer different
 *  questions, and only the second one can be checked. */
function fmtCount(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/**
 * Token totals only. This is the one figure on the surface that runs to eight
 * digits (the live workspace burned 22 million tokens in a week), and a
 * grouped "22,157,443" is read as noise rather than as a size. Everything
 * else keeps its digits, because a count you can act on you must be able to
 * read exactly.
 */
function fmtCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  return fmtCount(n);
}

/**
 * OBS-15: zero-fills a sparse day-bucketed series (as returned by
 * getAnalyticsOverview's `daily`, which only carries an entry for a day that
 * had at least one event) into a fixed-length window of `days` entries
 * ending at `asOfMs` (defaults to Date.now()), oldest first. A day with no
 * bucket entry is a real zero, not a gap: without this, a chart that plots
 * the sparse array by index draws a quiet day as if it were adjacent to its
 * neighbors, implying a smooth trend across days that never happened.
 */
export function zeroFillDaily(
  daily: readonly { day: string; cost: number }[],
  days: number,
  asOfMs = Date.now(),
): number[] {
  const byDay = new Map(daily.map((d) => [d.day, d.cost]));
  const out: number[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = new Date(asOfMs - i * 86400000).toISOString().slice(0, 10);
    out.push(byDay.get(key) ?? 0);
  }
  return out;
}

export interface SpendGlanceInput {
  /** `getBudgetOverview().global`: real DB row, `null` when unconfigured. */
  global: {
    daily_usd_cap: number | string | null;
    monthly_usd_cap: number | string | null;
    daily_usd_used?: number | string | null;
    monthly_usd_used?: number | string | null;
  } | null;
  /** `getAnalyticsOverview({ days: 7 }).summary.totalCost`: this week's spend. */
  costThisWeek: number;
  /**
   * The workspace's per-run ceiling (`workspaces.default_mission_spend_cap_usd`,
   * default 10 USD, null only when a human deliberately cleared it).
   *
   * Added 2026-08-03. This room used to say "no cap set" whenever the ai_budgets
   * meter was unconfigured, which is a true statement about ONE control read as a
   * claim about all of them. Meanwhile every workspace in the database carried a
   * 10 USD per-run ceiling, /build displayed it, and /runs said "Nothing caps
   * this yet" a third time. Three surfaces, three answers, and the reassuring one
   * was wrong. A governance surface that understates its own controls teaches the
   * user to distrust it in both directions.
   */
  missionCapUsd?: number | null;

  /* ---- the volumes, all of them already in the two reads above ---- */

  /** `getAnalyticsOverview.summary.totalRuns`: AI calls in the 7-day window. */
  callsThisWeek?: number;
  /** `getAnalyticsOverview.summary.totalTokens`. */
  tokensThisWeek?: number;
  /** `getAnalyticsOverview.summary.errors`: calls whose status was not `ok`. */
  failedThisWeek?: number;
  /** `getAnalyticsOverview.byModel`, already sorted by runs; re-sorted here by cost. */
  byModel?: readonly { model: string; runs: number; cost: number }[];
  /** `getAnalyticsOverview.daily`: sparse day buckets over the same window. */
  daily?: readonly { day: string; cost: number }[];
  /**
   * `getAnalyticsOverview.windowIsWhole`: false when the capped read dropped
   * its oldest days. DEFAULTS TO FALSE, so a caller that has not been taught to
   * pass it gets NO trend rather than a possibly fabricated one. Silence is the
   * safe default here; a wrong direction of travel is not.
   */
  windowIsWhole?: boolean;
  /** Injectable clock, so the day-over-day figure is testable. */
  asOfMs?: number;
}

/**
 * The day-over-day figure, and why it is YESTERDAY against THE DAY BEFORE
 * rather than today against yesterday.
 *
 * Today's bucket is a partial day: at 09:00 it holds nine hours of spend, and
 * comparing it to a complete day reports a collapse that has not happened.
 * Both days here are complete, both are real buckets from the same read, and
 * the note names which two days they are. This is the only trend the glance can
 * state without a second query — a true week-over-week comparison needs a
 * 14-day read, and that read lives in the Spend room's "Over time" view, where
 * it is labeled "vs the week before."
 */
function dayOverDay(
  daily: readonly { day: string; cost: number }[],
  asOfMs: number,
  windowIsWhole: boolean,
): GlanceFigure | null {
  /**
   * A CAPPED READ CANNOT STATE A TREND, because the days it is missing are
   * exactly the days it would compare against.
   *
   * `getAnalyticsOverview` reads `created_at DESC` under a cap, so when the cap
   * bites it is the OLDEST events that fall out and the earliest buckets vanish
   * from `daily`. `zeroFillDaily` then supplies 0 for them -- correctly, since
   * a day with no rows read has no rows to show -- and this function read that
   * 0 as a real figure. The card could print "up from $0.00 the day before"
   * about a day that was simply never looked at. That is a fabricated trend,
   * and it is worse than no trend: a person acts on a rise that did not happen.
   */
  if (!windowIsWhole) return null;

  const filled = zeroFillDaily(daily, 3, asOfMs);
  const before = filled[0];
  const yesterday = filled[1];
  if (before === undefined || yesterday === undefined) return null;

  /**
   * THE DAYS ARE NAMED, NOT CALLED "YESTERDAY", and that is a correctness fix
   * rather than a wording preference.
   *
   * The buckets are keyed on `created_at.slice(0, 10)`, which is UTC. The label
   * "yesterday" is a claim about the READER'S calendar. For anyone east of UTC
   * the two disagree for part of every day: in IST, before 05:30 local, the
   * bucket labelled "yesterday" is the day before last. The founder is in IST,
   * so this was wrong on his screen for five and a half hours out of every
   * twenty-four, silently.
   *
   * A date is true in every timezone. It is also more useful on a card someone
   * reads at a glance, because it needs no arithmetic from the reader.
   */
  const dayNames = zeroFillDailyKeys(daily, 3, asOfMs);
  const label = shortDay(dayNames[1]);
  const beforeName = shortDay(dayNames[0]);
  const note =
    yesterday > before
      ? `up from ${fmtUsd(before)} on ${beforeName}`
      : yesterday < before
        ? `down from ${fmtUsd(before)} on ${beforeName}`
        : before === 0
          ? `nothing on ${beforeName} either`
          : `level with ${beforeName}`;
  return { label, value: fmtUsd(yesterday), note };
}

/** The day keys `zeroFillDaily` fills, in the same order, so a caller can name
 *  the buckets it is comparing instead of describing them relative to a
 *  calendar it cannot see. */
function zeroFillDailyKeys(
  daily: readonly { day: string; cost: number }[],
  span: number,
  asOfMs: number,
): string[] {
  void daily;
  const keys: string[] = [];
  for (let i = span - 1; i >= 0; i--) {
    keys.push(new Date(asOfMs - i * 86400000).toISOString().slice(0, 10));
  }
  return keys;
}

/** "2026-08-05" as "5 Aug". Unambiguous in every timezone, and short enough to
 *  sit where a relative word used to. */
function shortDay(key: string | undefined): string {
  if (!key) return "the day before";
  const [, m, d] = key.split("-");
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const mi = Number(m) - 1;
  if (!months[mi] || !d) return key;
  return `${Number(d)} ${months[mi]}`;
}

export function buildSpendGlance(input: SpendGlanceInput): RoomGlance {
  const { global, costThisWeek } = input;
  const monthlyCap = global?.monthly_usd_cap != null ? Number(global.monthly_usd_cap) : 0;
  const dailyCap = global?.daily_usd_cap != null ? Number(global.daily_usd_cap) : 0;

  // Assembled once and shared by both branches below, because the volumes are
  // the same facts whether or not a cap happens to be configured. Only the
  // cap-share figure is branch-specific.
  const figures: GlanceFigure[] = [];
  if (input.callsThisWeek !== undefined) {
    figures.push({
      label: "calls",
      value: fmtCount(input.callsThisWeek),
      note: "in the last 7 days",
    });
  }
  if (input.tokensThisWeek !== undefined) {
    figures.push({ label: "tokens", value: fmtCompact(input.tokensThisWeek) });
  }
  if (input.daily) {
    const trend = dayOverDay(input.daily, input.asOfMs ?? Date.now(), input.windowIsWhole === true);
    if (trend) figures.push(trend);
  }
  if (input.byModel && input.byModel.length > 0) {
    // By COST, not by runs. The read hands them over sorted by runs, and the
    // question this room asks is "what is this costing me", so a chatty cheap
    // model must not be named as the reason for the bill.
    const top = [...input.byModel].sort((a, b) => b.cost - a.cost)[0]!;
    figures.push({
      label: "costliest model",
      value: top.model,
      note: `${fmtUsd(top.cost)} across ${fmtCount(top.runs)} calls`,
    });
  }
  // Only when there ARE failures. "0 failed calls" is a reassurance the other
  // figures already give, and a figure that is always zero trains the eye to
  // skip the row it lives in.
  if (input.failedThisWeek !== undefined && input.failedThisWeek > 0) {
    figures.push({
      label: "failed calls",
      value: fmtCount(input.failedThisWeek),
      note: "in the last 7 days",
    });
  }

  if (monthlyCap > 0 || dailyCap > 0) {
    // One source: the budget meter that actually gates calls, cap + used
    // from the same row, window named in the sentence.
    const monthly = monthlyCap > 0;
    const cap = monthly ? monthlyCap : dailyCap;
    const used = Number((monthly ? global?.monthly_usd_used : global?.daily_usd_used) ?? 0);
    const state: RoomState = used / cap >= 0.8 ? "watch" : "healthy";
    return {
      key: "spend",
      name: ROOM_NAMES.spend,
      question: ROOM_QUESTIONS.spend,
      verdict: `${fmtUsd(used)} of ${fmtUsd(cap)} ${monthly ? "monthly" : "daily"} cap`,
      state,
      action:
        state === "watch"
          ? "Near the ceiling. Raise it in Limits, or find the top spender in By agent."
          : undefined,
      figures: [
        {
          label: "of the cap",
          value: `${Math.round((used / cap) * 100)}%`,
          note: monthly ? "used this month" : "used today",
        },
        ...figures,
      ],
    };
  }
  // No period budget. Say what DOES bound spend rather than implying nothing does.
  const perRun = input.missionCapUsd;
  return {
    key: "spend",
    name: ROOM_NAMES.spend,
    question: ROOM_QUESTIONS.spend,
    verdict:
      perRun != null
        ? `${fmtUsd(costThisWeek)} this week · no weekly cap · ${fmtUsd(perRun)} a run`
        : `${fmtUsd(costThisWeek)} this week · nothing caps this`,
    state: "healthy",
    figures,
  };
}

export interface QualityGlanceInput {
  /**
   * `getEvalHealth().health` - the ONE quality truth. The audit found a
   * three-way conflict (header "Evals 81" - a suite's average score - vs the
   * room's "PASS RATE 75%" vs a raw "unknown · watch" note); the glance now
   * reads the same pass-rate report the room's score card renders, so the
   * header and the card can never disagree.
   */
  passRate: number | null;
  totalRuns: number;
  verdict: "healthy" | "watch" | "at-risk" | "no-data";
  /** `getDriftOverview().openIncidents` */
  driftOpenCount: number;

  /* ---- the volumes, all of them already in the two reads above ---- */

  /** `getEvalHealth().health.avgScore`: mean judge score, 0-100, null when none scored. */
  avgScore?: number | null;
  /** `getEvalHealth().health.errorRate`: runs that errored / total runs, 0-1. */
  errorRate?: number;
  /** `getEvalHealth().health.suites.length`: how many checks are defined at all. */
  suiteCount?: number;
  /** `getEvalHealth().health.flakySuites.length`: suites whose result flips run to run. */
  flakyCount?: number;
  /** `getEvalHealth().health.trend`: recent runs against the prior ones. */
  trend?: "improving" | "declining" | "stable" | "unknown";
  /** `getDriftOverview().openIncidents[0]` - the newest one, for the dated line. */
  latestDrift?: {
    surface?: string | null;
    metric?: string | null;
    delta_pct?: number | string | null;
    detected_at?: string | null;
  } | null;
}

/** Quality's figures, shared by the no-data branch and the scored branch: a
 *  workspace with no eval runs still has suites defined and drift watching, and
 *  hiding those made the empty state look like a dead room rather than an
 *  unexercised one. */
function qualityFigures(input: QualityGlanceInput): GlanceFigure[] {
  const figures: GlanceFigure[] = [];
  if (input.avgScore != null) {
    figures.push({
      label: "average score",
      value: String(Math.round(input.avgScore)),
      // The scale is named because 85 and 0.85 are the same fact and only one
      // of them is readable; `eval_runs.avg_score` is stored 0-100.
      note: "out of 100, judged",
    });
  }
  if (input.trend && input.trend !== "unknown") {
    figures.push({ label: "trend", value: input.trend, note: "recent runs vs the ones before" });
  }
  if (input.suiteCount !== undefined) {
    figures.push({ label: "suites", value: fmtCount(input.suiteCount), note: "checks defined" });
  }
  if (input.errorRate !== undefined && input.errorRate > 0) {
    figures.push({
      label: "errored",
      value: `${Math.round(input.errorRate * 100)}%`,
      note: "of runs did not finish",
    });
  }
  if (input.flakyCount !== undefined && input.flakyCount > 0) {
    figures.push({
      label: "flaky suites",
      value: fmtCount(input.flakyCount),
      note: "pass then fail on the same checks",
    });
  }
  if (input.driftOpenCount > 0) {
    figures.push({
      label: "drift open",
      value: fmtCount(input.driftOpenCount),
      note: "measures that moved off their baseline",
    });
  }
  return figures;
}

/** The newest open drift incident as a dated line. Every clause comes off the
 *  row; a drift row missing its surface or its metric contributes the clauses
 *  it does have and no invented ones. */
function driftLatest(d: QualityGlanceInput["latestDrift"]): GlanceLatest | undefined {
  if (!d) return undefined;
  const where = d.surface ? ` on ${d.surface}` : "";
  const delta = d.delta_pct == null ? null : Number(d.delta_pct);
  const moved =
    delta == null || Number.isNaN(delta)
      ? ""
      : ` moved ${delta > 0 ? "+" : ""}${Math.round(delta)}%`;
  const what = d.metric ? `${d.metric}${where}${moved}` : `Drift${where}${moved}`;
  return { what, at: d.detected_at ?? null };
}

export function buildQualityGlance(input: QualityGlanceInput): RoomGlance {
  const { passRate, totalRuns, verdict, driftOpenCount } = input;
  const driftOpen = driftOpenCount > 0;
  const driftWord = driftOpen ? "drift open" : "no drift";
  const figures = qualityFigures(input);
  const latest = driftLatest(input.latestDrift);
  if (passRate == null || totalRuns === 0 || verdict === "no-data") {
    return {
      key: "quality",
      name: ROOM_NAMES.quality,
      question: ROOM_QUESTIONS.quality,
      verdict: `No eval runs yet · ${driftWord}`,
      state: driftOpen ? "watch" : "healthy",
      figures,
      latest,
    };
  }
  // State derives from the same report as the number (never a second source).
  const state: RoomState = verdict !== "healthy" || driftOpen ? "watch" : "healthy";
  return {
    key: "quality",
    name: ROOM_NAMES.quality,
    question: ROOM_QUESTIONS.quality,
    verdict: `Pass rate ${Math.round(passRate * 100)}% across ${totalRuns} run${totalRuns === 1 ? "" : "s"} · ${driftWord}`,
    state,
    action:
      state === "watch"
        ? driftOpen
          ? "Quality may be slipping. Open Is it slipping? to see what moved."
          : "Open What we test to see which checks are failing."
        : undefined,
    figures,
    latest,
  };
}

export interface SafetyGlanceInput {
  /** `getGuardrailOverview().rules` */
  rules: Array<{ enabled: boolean }>;
  /** `getIncidents().count` */
  incidentCount: number;
  /** `getIncidents().capped`: true when the merged read hit its ceiling, so
   *  `incidentCount` is a floor. DEFAULTS TO UNDEFINED (falsy), so a caller not
   *  yet taught to pass it reports the number plainly rather than claiming a
   *  cap it has not checked. */
  incidentsCapped?: boolean;

  /* ---- the volumes, all of them already in the two reads above ---- */

  /**
   * `getGuardrailOverview().floor.length`: the code-owned rules that screen
   * every call in every workspace whether or not anyone configured guardrails
   * (`lib/ai/guardrail-floor.ts`). This number is the reason the unconfigured
   * state below is a prompt rather than an alarm: nothing you set is running,
   * but personal data, credentials and injection are still being screened.
   */
  floorCount?: number;
  /** `getGuardrailOverview().hits`: the recent-activity list, capped by the read. */
  hits?: readonly {
    rule_name?: string | null;
    action?: string | null;
    created_at?: string | null;
  }[];
  /** The cap `getGuardrailOverview` puts on that list, so a full page reads "100+". */
  hitLimit?: number;
  /** `getIncidents().incidents`, newest first (that function sorts before it slices). */
  incidents?: readonly { title?: string | null; at?: string | null }[];
}

export function buildSafetyGlance(input: SafetyGlanceInput): RoomGlance {
  const configured = input.rules.length;
  const onCount = input.rules.filter((r) => r.enabled).length;

  /**
   * THE DEFECT THIS BRANCH FIXES. `state` used to be
   * `incidentCount > 0 ? "watch" : "healthy"` and nothing else, so a workspace
   * with no guardrails switched on and nothing yet broken came back healthy,
   * and the overview headline counted it into "All four rooms are clear." Zero
   * enabled rules is not a clear room, it is a room nobody has set up, and the
   * cost of reading it as clear is that the one surface asking "what is it
   * allowed to do" answers "everything" in the voice it uses for "all good".
   *
   * The trigger is ZERO ENABLED rules, not zero rows. A workspace that
   * configured nine rules and then switched all nine off is in exactly the same
   * position as one that configured none, and keying on `rules.length` would
   * have called the first one healthy — the same bug one step to the left.
   *
   * An incident still outranks it. Something that actually went wrong is more
   * urgent than something that was never set up, and the action below names
   * both when both are true, so neither fact is lost to the other.
   */
  const unset = onCount === 0;
  const state: RoomState = input.incidentCount > 0 ? "watch" : unset ? "unconfigured" : "healthy";

  /**
   * THE FLOOR SAYS SO, on the line a person reads to decide if anything is
   * wrong.
   *
   * `incidentCount` is what the read RETURNED, and that read is capped twice
   * over: forty after the merge, and each of its five sources limited to twenty
   * before it. A workspace with a hundred cost incidents said "40 incidents"
   * here, in the verdict, as though that were the number. Same defect as the
   * trace count that printed "200 runs this week" when 200 was the limit, and
   * the same fix, so the two read alike.
   */
  const incidentFigure = `${input.incidentCount}${input.incidentsCapped ? "+" : ""}`;
  const incidentClause = `${incidentFigure} incident${input.incidentCount === 1 ? "" : "s"}`;
  const verdict = !unset
    ? `${onCount} guardrail${onCount === 1 ? "" : "s"} on · ${incidentClause}`
    : configured === 0
      ? `No guardrails set · ${incidentClause}`
      : `${configured} guardrail${configured === 1 ? "" : "s"} set, none switched on · ${incidentClause}`;

  // "What is allowed" is the plain label of the `rules` tab (ROOM_TAB_META
  // above), which is where guardrails are actually created and toggled. The
  // sentence names the tab rather than the mechanism, per the naming model.
  const setUpStep =
    configured === 0
      ? "Nothing you set is screening this workspace. Add your first rule in What is allowed."
      : "Every rule you set is switched off. Turn one on in What is allowed.";
  const action =
    input.incidentCount > 0
      ? unset
        ? `${setUpStep} Then open What went wrong to see what already slipped through.`
        : "Open What went wrong to see which guardrail tripped and why."
      : unset
        ? setUpStep
        : undefined;

  const figures: GlanceFigure[] = [];
  if (input.floorCount !== undefined && input.floorCount > 0) {
    figures.push({
      label: "always on",
      value: fmtCount(input.floorCount),
      note: "screen every call whatever you set",
    });
  }
  if (configured > 0) {
    figures.push({
      label: "your rules",
      value: fmtCount(configured),
      note: configured > onCount ? `${configured - onCount} switched off` : "all switched on",
    });
  }
  if (input.hits) {
    // The read caps this list, so a full page is a floor and must say so. A
    // bare "100" here would understate a workspace with 7,141 recorded hits by
    // two orders of magnitude, which is the exact shape of a number with no row
    // behind it: the rows exist, the count does not describe them.
    const capped = input.hitLimit !== undefined && input.hits.length >= input.hitLimit;
    figures.push({
      label: "calls a rule caught",
      value: capped ? `${fmtCount(input.hitLimit!)}+` : fmtCount(input.hits.length),
      note: "recent",
    });
  }

  const newest = input.incidents?.[0];
  return {
    key: "safety",
    name: ROOM_NAMES.safety,
    question: ROOM_QUESTIONS.safety,
    verdict,
    state,
    action,
    figures,
    latest: newest?.title ? { what: newest.title, at: newest.at ?? null } : undefined,
  };
}

export interface RecordGlanceInput {
  /** `listTraces({ days: 7, limit: 200 }).traces.length` (window named in the verdict). */
  traceCount: number;
  /** `getLedgerSeal().available`: the fingerprint computed cleanly. */
  ledgerVerifies: boolean;

  /* ---- the volumes, all of them already in the two reads above ---- */

  /**
   * The `limit` the caller passed to `listTraces`. When the count reaches it,
   * the count is a FLOOR, not a total, and the verdict says "200+".
   *
   * Found while putting these volumes on the surface: `listTraces` reads a
   * capped number of rows and returns at most `limit` traces, and the verdict
   * printed that ceiling as an exact figure ("200 runs this week").
   *
   * NO LIVE FIGURE IS QUOTED HERE, and the omission is deliberate. An earlier
   * draft of this comment cited a whole-table count as evidence the ceiling was
   * being hit. It was not evidence of anything a USER sees: `ai_events` is
   * gated by `is_workspace_member(workspace_id)`, so no caller can read the
   * whole table, and the figure any one workspace can reach is far below it.
   * A number in a comment is read as a measurement, so a number that cannot be
   * reproduced from the reader's own seat does not belong in one. The defect is
   * real whether or not the cap is being hit today, which is the argument that
   * actually carries.
   *
   * Optional so the existing callers and their expectations are unchanged; the
   * surface passes it.
   */
  traceLimit?: number;
  /** `listTraces().traces` - the same rows the count came from. */
  traces?: readonly {
    spans?: number;
    errors?: number;
    title?: string | null;
    root_surface?: string | null;
    last_at?: string | null;
  }[];
  /** `getLedgerSeal().count`: how many receipts the fingerprint covers. */
  sealCount?: number;
  /** `getLedgerSeal()` reads at most SEAL_LIMIT receipts. True when it hit
   *  that ceiling, so `sealCount` is a floor and the fingerprint covers the
   *  newest slice rather than the whole ledger. Falsy by default, so a caller
   *  not yet taught to pass it never claims a cap it has not checked. */
  sealCapped?: boolean;
}

export function buildRecordGlance(input: RecordGlanceInput): RoomGlance {
  const capped = input.traceLimit !== undefined && input.traceCount >= input.traceLimit;
  const traceLabel = `${input.traceCount.toLocaleString("en-US")}${capped ? "+" : ""}`;

  const figures: GlanceFigure[] = [];
  if (input.traces) {
    const spans = input.traces.reduce((s, t) => s + (t.spans ?? 0), 0);
    const errored = input.traces.filter((t) => (t.errors ?? 0) > 0).length;
    if (spans > 0) {
      figures.push({
        label: "steps recorded",
        // The window is named on the note rather than left implied, because
        // this sum is over the traces the read returned, which is the capped
        // set when the workspace is busy.
        value: fmtCount(spans),
        note: `across ${traceLabel} run${input.traceCount === 1 ? "" : "s"}`,
      });
    }
    if (errored > 0) {
      figures.push({
        // SINGULAR WHEN IT IS ONE, because the card reads it aloud as a
        // sentence: the figure and its label sit together, so "1 runs that hit
        // an error" is a grammatical error on the surface, not in a log. The
        // sibling figure two lines up already pluralises its note; this one did
        // not pluralise its label, and one errored run is the commonest reading
        // there is on a healthy workspace.
        label: `run${errored === 1 ? "" : "s"} that hit an error`,
        value: fmtCount(errored),
        note: "at least one failed step",
      });
    }
  }
  if (input.sealCount !== undefined && input.sealCount > 0) {
    /**
     * "COVERED BY THE FINGERPRINT" IS A CLAIM ABOUT COVERAGE, and the read
     * behind it is capped at SEAL_LIMIT receipts.
     *
     * So on a ledger longer than the cap the figure was a ceiling AND the note
     * asserted the fingerprint covered the whole thing, when it covered the
     * most recent slice. That is the more expensive half: a number being a
     * floor is a smaller lie than a guarantee being wrong, and this note is the
     * one a person would quote in an audit.
     *
     * Capped, the figure carries its "+" and the note says what the fingerprint
     * really covers. Uncapped, both read exactly as before.
     */
    const sealCapped = input.sealCapped === true;
    figures.push({
      label: "records sealed",
      value: `${fmtCount(input.sealCount)}${sealCapped ? "+" : ""}`,
      note: !input.ledgerVerifies
        ? "fingerprint did not compute"
        : sealCapped
          ? "the newest are covered by the fingerprint"
          : "covered by the fingerprint",
    });
  }

  const newest = input.traces?.[0];
  const newestName = newest?.title ?? newest?.root_surface ?? null;
  return {
    key: "record",
    name: ROOM_NAMES.record,
    question: ROOM_QUESTIONS.record,
    // Record is always healthy when the ledger verifies (extensions §5); a
    // broken fingerprint is a Call on Today, never a silent room state.
    verdict: `${traceLabel} run${input.traceCount === 1 ? "" : "s"} this week · ${input.ledgerVerifies ? "audit trail intact" : "audit trail unverified"}`,
    state: "healthy",
    figures,
    latest: newestName ? { what: newestName, at: newest?.last_at ?? null } : undefined,
  };
}
