/**
 * The Boundary. The one place a person says what their crew may do alone.
 *
 * FOUNDER RULING 2026-08-01, and the positioning it serves, ratified the same
 * day:
 *
 *   "Agents that run the whole product loop without asking permission, because
 *    you set the boundary once, and every crossing is on the record."
 *
 * 1. WHO IS HERE, AND WHY. Someone accountable for what a fleet of agents does
 *    in their company, who needs to answer one question out loud: what can
 *    these things do without me? Today that answer is spread across four Engine
 *    Room rooms and a settings page, so nobody can say it.
 *
 * 2. THE ONE THING IT EXISTS FOR. To turn a permission model into a policy you
 *    set once. Everything on this surface is a boundary, and moving one does
 *    not block any work that is running.
 *
 * 3. WHY IT IS A FIRST-CLASS SURFACE AND NOT AN ENGINE ROOM VIEW. The
 *    Engine-Room doctrine puts machinery behind one door, and this looks like
 *    machinery. It is not. GOVERNANCE-PRINCIPLE.md names it as its own
 *    surface, and the argument is that machinery is what the product does to
 *    itself, while a boundary is what a person decides. The doctrine governs
 *    the first; the governance canon governs the second, and it outranks the
 *    gate-centric assumption everywhere it disagrees.
 *
 * 4. WHY THIS IS A LEAD AND NOT A CATCH-UP (docs/design/REFERENCE-PATTERNS.md,
 *    verified against official docs 2026-08-01). Five products have converged
 *    on exactly this model and every one of them keeps it in a FILE: Cursor's
 *    permissions.json, Claude Code's settings.json, Codex's config.toml, VS
 *    Code's chat.tools.terminal.autoApprove. Cursor went further and
 *    DEPRECATED per-action approval in 3.5, and OpenAI's stated reason for
 *    building an approval-reviewer agent is that "approval friction harms
 *    security" because it drives people to Full Access and rubber-stamping.
 *    The whole market agrees policy beats permission. **Not one of them shows
 *    the policy as a surface a person can read.** That is the opening.
 *
 * 5. THE THREE QUESTIONS, IN THE FOUNDER'S OWN WORDS. "What agents may do
 *    alone, what needs them, and what nobody may do." Those are the three
 *    blocks, in that order, because that is the order of the question a person
 *    actually asks.
 *
 * 6. WHAT IS DELIBERATELY NOT HERE. No approval queue: this surface never
 *    shows a pending item, because the moment it did it would become the thing
 *    it exists to shrink. No per-tool risk score printed as a number, for the
 *    same reason the Discover pass refused a confidence percentage: a number
 *    invites an argument about the number. Risk appears only where it
 *    CONSTRAINS you, as a floor that explains why a control is missing.
 *
 * 7. THE FLOORS ARE READ FROM THE REAL RESOLVER. `getBoundary` computes each
 *    bucket from the same `toolRisk`, `HIGH_RISK_FORCE_REVIEW` and
 *    `HIGH_RISK_MIN_CONFIRM` the agent loop enforces. A boundary screen that
 *    disagrees with the engine is worse than no boundary screen.
 *
 * VOICE: never greet, always report. The first line is a count out of the
 * record, and it is phrased as capability rather than as configuration.
 */

import { createFileRoute } from "@tanstack/react-router";
import { Row, Line } from "@/components/meridian/rows";
import { Num } from "@/components/meridian/surface-parts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  getBoundary,
  getDeclinedLedger,
  setWorkspaceAutonomyPolicy,
  setWorkspaceSpendPolicy,
} from "@/lib/governance.functions";
import type { BoundaryTool } from "@/lib/governance.functions";
import {
  AUTONOMY_BOUNDS,
  SHIPPED_AUTONOMY_POLICY,
  type AutonomyField,
  type AutonomyPolicy,
} from "@/lib/autonomy-policy";
import type { BoundaryEvent } from "@/lib/boundary-ledger";
import { relativeTime } from "@/lib/memory-view";
import { updateToolMode } from "@/lib/agent_loop.functions";
import { humanWriteError } from "@/lib/roles.functions";
import { TrustGraduationsBlock } from "@/components/governance/TrustGraduations";
import { AutomationBoundary } from "@/components/governance/AutomationBoundary";
import { Block, CtxBody, CtxHead, Empty, Failed, Input, Loading, MoreItem, MoreMenu, PageHead, Receipt, Value } from "@/components/shell/primitives";
import { Surface } from "@/components/meridian/Surface";

/** How many tools a block shows before it counts the rest. A boundary is read,
 *  not browsed, and forty rows in one block is a settings page again. */
const VISIBLE = 8;

type BoundaryReceipt = { verb: string; consequence: React.ReactNode; failed?: boolean };

/** What a floor forbids, in plain words. Never the mechanism name. */
function floorLine(floor: BoundaryTool["floor"]): string | null {
  if (floor === "review") return "Always yours to approve. This one cannot be handed over.";
  if (floor === "confirm") return "Can never run silently.";
  return null;
}

/**
 * How a boundary event ended, said as an outcome rather than as a status.
 *
 * "Allowed" and not "approved", because the reader's question is what happened
 * to the work, not what the person clicked. `blocked` is the only tone="fail"
 * case: a rule refusing something is the boundary at full strength, and it is
 * the one row a reader should be able to find without reading.
 */
function outcomeLabel(e: BoundaryEvent): {
  text: string;
  tone: "quiet" | "pass" | "warn" | "fail";
} {
  switch (e.outcome) {
    case "allowed":
      return { text: "You allowed it", tone: "pass" };
    case "declined":
      return { text: "You said no", tone: "warn" };
    case "expired":
      return { text: "Ran out of time", tone: "warn" };
    case "blocked":
      return { text: "Stopped by a rule", tone: "fail" };
    default:
      return { text: "Waiting on you", tone: "quiet" };
  }
}

/** The subject of a boundary event in a person's words, not the tool's identifier. */
function readableSubject(e: BoundaryEvent): string {
  if (e.kind === "refused") return e.subject;
  return e.subject.replace(/_/g, " ");
}

/**
 * The declined ledger: every moment an agent reached the boundary and stopped.
 *
 * WHY IT IS ON THIS SURFACE AND NOT ITS OWN. The positioning is "you set the
 * boundary once, and every crossing is on the record". A policy screen with no
 * record is a claim; a record with no policy screen is a log. They are one
 * argument and they belong in one place, policy first, then the proof.
 *
 * WHY IT DOES NOT LIST WHAT IS WAITING, which is a rule this surface already
 * set for itself: the moment it renders a pending item with an action beside
 * it, it becomes the approval queue it exists to shrink. So a waiting call is
 * reported as a COUNT and named as a cost, and the queue stays at /approvals
 * where deciding is the job. The record shows what the boundary DID.
 */
function DeclinedLedger({
  q,
  open,
  onToggle,
}: {
  q: { data?: LedgerData; isLoading: boolean; isError: boolean };
  open: boolean;
  onToggle: () => void;
}) {
  // A record that fails to load must say so rather than render as "nothing ever
  // happened". Silence and innocence look identical, and only one is true.
  if (q.isError) {
    return (
      <Block title="What they did not do">
        <Empty>The record could not be read. Your boundary is unchanged.</Empty>
      </Block>
    );
  }
  if (q.isLoading || !q.data) {
    return (
      <Block title="What they did not do">
        <Loading>Reading the record.</Loading>
      </Block>
    );
  }

  const { events, waiting, windowDays, truncated } = q.data;
  // Decided and blocked only. See the note above on why waiting is a count.
  const settled = events.filter((e) => e.outcome !== "waiting");
  const shown = open ? settled : settled.slice(0, VISIBLE);
  // Read once per render so every row in the list ages against the same clock.
  const now = Date.now();

  return (
    <Block
      title="What they did not do"
      sub={`Every time an agent reached your boundary and stopped, over the last ${windowDays} days. This is what pays for the autonomy.`}
      more={settled.length > VISIBLE ? (open ? "Show fewer" : `All ${settled.length}`) : undefined}
      onMore={onToggle}
    >
      {settled.length === 0 ? (
        <Empty>
          Nothing has reached your boundary in {windowDays} days. Either your crew has not run, or
          everything it did was already inside what you allow.
        </Empty>
      ) : (
        shown.map((e) => {
          const o = outcomeLabel(e);
          return (
            <Row
              key={e.id}
              tight
              lead={
                e.kind === "asked"
                  ? `${e.agent ?? "An agent"} wanted to ${readableSubject(e)}`
                  : readableSubject(e)
              }
              // The agent's own words for why, so the reader judges the request
              // and not just the verb. A rule hit says which way it travelled.
              sub={[relativeTime(e.at, now), e.wanted, e.outcomeReason].filter(Boolean).join(" · ")}
              action={<Value tone={o.tone}>{o.text}</Value>}
            />
          );
        })
      )}

      {waiting > 0 ? (
        <Line
          label={
            waiting === 1 ? "One call is waiting on you" : `${waiting} calls are waiting on you`
          }
          sub="Each one is an interruption your current boundary is charging. Deciding them happens in Approvals, not here."
        >
          <Num>{waiting}</Num>
        </Line>
      ) : null}

      {truncated ? (
        <Line
          label="This is the most recent part of the record"
          sub="Older crossings are not shown here. The full record is kept."
        />
      ) : null}
    </Block>
  );
}

type LedgerData = {
  events: BoundaryEvent[];
  waiting: number;
  windowDays: number;
  truncated: boolean;
};

/* ------------------------------------------------------------------ *
 * The two bars the platform crosses on its own
 * ------------------------------------------------------------------ */

/** A whole percent, for the three numbers stored as a fraction. */
const pct = (n: number) => Math.round(n * 100);

/**
 * One number on the policy, as a control you can actually reach.
 *
 * Uncontrolled with a `key` on the stored value, which is the same shape the
 * ceilings above use plus the one thing they lack: after a write lands, the
 * field is remounted from the record rather than still showing what it showed
 * on first paint. A boundary screen that disagrees with the record is the exact
 * defect this whole surface was built against.
 *
 * A NULL VALUE IS AN EMPTY FIELD, not a number standing in for one. The
 * carve-out has no shipped value, and pre-filling it with a plausible impact
 * would mean that focusing the field and tabbing away silently invented a
 * boundary nobody stated. Only a real change writes anything.
 */
function PolicyNumber({
  id,
  label,
  value,
  bounds,
  step,
  disabled,
  onCommit,
}: {
  id: string;
  label: string;
  /** What the field shows, in the unit the reader sees. Null renders empty. */
  value: number | null;
  bounds: { min: number; max: number };
  step: number;
  disabled?: boolean;
  /** Null means "clear it": back to the number we ship, or no carve-out. */
  onCommit: (next: number | null) => void;
}) {
  return (
    <Input
      // Remounted when the record changes, so the field shows what was stored
      // rather than what it showed on first paint. A boundary screen that
      // disagrees with the record is the defect this surface exists against.
      key={`${id}:${value ?? "unset"}`}
      id={id}
      type="number"
      min={bounds.min}
      max={bounds.max}
      step={step}
      defaultValue={value ?? ""}
      aria-label={label}
      style={{ width: 88, textAlign: "right" }}
      disabled={disabled}
      onBlur={(e) => {
        const raw = e.currentTarget.value.trim();
        if (raw === "") {
          // Emptying a field is how you hand it back, and it is only a write
          // when there is something of yours to hand back.
          if (value !== null) onCommit(null);
          return;
        }
        const next = Number(raw);
        // A value outside the range is refused rather than pulled to the edge:
        // silently enforcing a boundary nobody stated is the failure this
        // surface exists to prevent.
        if (!Number.isFinite(next) || next < bounds.min || next > bounds.max) return;
        if (next === value) return;
        onCommit(next);
      }}
    />
  );
}

/** What a number that is ours rather than theirs has to say for itself.
 *  Governance canon, fourth floor: a default the user never set is our choice,
 *  so the surface names it as ours rather than presenting it as their policy. */
function oursNote(committed: boolean): string {
  return committed ? "" : " This is the number we ship, not one you set.";
}

/** What the move actually causes, in the same words the blocks use. Never
 *  "Saved": a receipt renders what your click caused, not that it registered. */
function autonomyConsequence(
  field: AutonomyField,
  next: number | null,
  policy: AutonomyPolicy,
): string {
  const shipped = SHIPPED_AUTONOMY_POLICY;
  switch (field) {
    case "minFrequency":
      return next === null
        ? `Back to ours: a cluster needs ${shipped.minFrequency} signals behind it before it becomes work.`
        : `A cluster now becomes work once ${next} independent signals say it. Fewer than that and it waits for you.`;
    case "minSeverity":
      return next === null
        ? `Back to ours: only clusters at ${shipped.minSeverity} out of 5 or worse start on their own.`
        : `Only clusters that hurt at ${next} out of 5 or worse start on their own now.`;
    case "minConfidence":
      return next === null
        ? `Back to ours: the clustering has to be ${pct(shipped.minConfidence)}% sure before work starts.`
        : `The clustering now has to be ${pct(next)}% sure the signals belong together before work starts.`;
    case "settleFloor":
      return next === null
        ? `Back to ours: a verdict nothing rides on needs ${pct(shipped.settleFloor)}% of the evidence.`
        : `An agent may now settle a verdict nothing rides on at ${pct(next)}% of the evidence.`;
    case "settleStakesSpan": {
      const floor = policy.settleFloor;
      return next === null
        ? `Back to ours: a verdict with everything riding on it needs ${pct(floor + shipped.settleStakesSpan)}%.`
        : `A verdict with everything riding on it now needs ${pct(Math.min(1, floor + next))}% of the evidence.`;
    }
    case "neverSettleAboveImpact":
      return next === null
        ? "No impact is carved out any more. Every bet is judged on its evidence."
        : `No agent settles a bet above impact ${next} again, whatever the evidence says.`;
  }
}

function BoundarySurface() {
  const qc = useQueryClient();
  const { activeWorkspaceId } = useWorkspace();
  const fBoundary = useServerFn(getBoundary);
  const fLedger = useServerFn(getDeclinedLedger);
  const fSetMode = useServerFn(updateToolMode);
  const fSetCap = useServerFn(setWorkspaceSpendPolicy);
  const fSetAutonomy = useServerFn(setWorkspaceAutonomyPolicy);

  const [receipt, setReceipt] = React.useState<BoundaryReceipt | null>(null);
  const [showAll, setShowAll] = React.useState<Record<string, boolean>>({});

  const b = useQuery({
    queryKey: ["boundary", activeWorkspaceId],
    queryFn: () => fBoundary(),
  });

  // The ledger loads independently of the boundary itself. If the record fails
  // to read, the policy a person came here to set still renders: the evidence
  // is what makes the boundary believable, not what makes it usable.
  const ledger = useQuery({
    queryKey: ["boundary-ledger", activeWorkspaceId],
    queryFn: () => fLedger(),
  });

  /* MOVING A BOUNDARY IS A DECISION, NOT A PREFERENCE, and until 2026-08-10 it
   * was the least guarded control in the product. Every mode change on this
   * surface fired straight into the mutation on one click, while deleting a
   * feature flag two routes away carries a full typed confirmation. So granting
   * an agent the right to act with no human present was cheaper than removing a
   * toggle -- an inversion nobody chose, which is how the most consequential
   * control in an autonomous system ends up as the quietest one.
   *
   * Friction is scaled to consequence rather than applied evenly, because a
   * confirmation on everything is a confirmation on nothing: people learn the
   * rhythm and click through the one that mattered.
   *
   *   auto    GRANTS autonomy. An agent will act with nobody watching. This is
   *           the only direction where the cost of being wrong is unbounded, so
   *           it is the one that stops you.
   *   off     REVOKES entirely. Safe in direction but disruptive in effect: it
   *           can strip a capability from work already in flight, and it binds
   *           the human too. Confirmed, but never styled destructive -- turning
   *           something off is not a destruction, and dressing it in red would
   *           teach people that safety is dangerous.
   *   confirm THE SAFE MIDDLE, and it stays one click. Deliberate: making a
   *           boundary TIGHTER must never be harder than leaving it loose, or
   *           the interface quietly argues for the riskier setting.
   */
  const confirm = useConfirm();
  const askBeforeMoving = React.useCallback(
    async (tool: BoundaryTool, mode: "auto" | "confirm" | "off"): Promise<boolean> => {
      if (mode === "confirm") return true;
      if (mode === "auto") {
        return confirm({
          title: `Let agents run ${tool.label} on their own?`,
          // States what changes, then what it costs, then the way back -- the
          // way back last, so it is the thought a person leaves with. The
          // wording matches the block headings on this page rather than
          // inventing a second vocabulary for the same three modes.
          body: `From now on ${tool.label} runs without stopping to ask you, including while you are away. You can move it back to "Come to me first" at any time, and work already running is not affected.`,
          confirmLabel: "Let them do it alone",
        });
      }
      return confirm({
        title: `Turn ${tool.label} off for everyone?`,
        body: `Nobody may do it, including you, until it is turned back on. Anything already relying on it stops asking and starts failing.`,
        confirmLabel: "Turn it off",
      });
    },
    [confirm],
  );

  const move = useMutation({
    mutationFn: (v: { tool: BoundaryTool; mode: "auto" | "confirm" | "off" }) =>
      fSetMode({
        data: {
          toolName: v.tool.name,
          mode: v.mode,
          enabled: v.mode !== "off",
          // The workspace whose boundary is on screen. Without it the server
          // falls back to this user's DEFAULT workspace, so the boundary you
          // moved would not be the boundary that binds the run you are watching.
          workspaceId: activeWorkspaceId ?? undefined,
        },
      }),
    onSuccess: (_r, v) => {
      // The consequence is what the boundary now LETS THROUGH, in the same
      // words the blocks use, never "Saved."
      setReceipt({
        verb: "You moved the boundary",
        consequence:
          v.mode === "auto"
            ? `${v.tool.label} runs without asking you.`
            : v.mode === "off"
              ? `${v.tool.label} is off. Nobody may do it, including you.`
              : `${v.tool.label} comes to you first.`,
      });
      void qc.invalidateQueries({ queryKey: ["boundary"] });
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "The boundary did not move",
        // Never the raw error. humanWriteError turns an RLS refusal or a
        // constraint violation into a sentence; without it this surface printed
        // `new row violates row-level security policy for table "agent_tools"`
        // into a receipt, handing a person the mechanism and an internal table
        // name instead of the outcome.
        consequence: humanWriteError(e, "It is still where it was."),
        failed: true,
      }),
  });

  const setTrackCap = useMutation({
    mutationFn: (cap: number | null) => fSetCap({ data: { track_cap_usd: cap } }),
    onSuccess: (_r, cap) => {
      setReceipt({
        verb: "You moved the ceiling on a piece of work",
        consequence:
          cap === null
            ? "Work now runs through every station until it finishes. Nothing stops it on spend."
            : `Work that spends $${cap.toFixed(2)} across its stations stops and waits for you.`,
      });
      void qc.invalidateQueries({ queryKey: ["boundary"] });
    },
    // THIS HANDLER WAS MISSING ENTIRELY. A refused or failed track-ceiling write
    // produced no receipt, no toast and no change: the control silently did
    // nothing while the previous receipt stayed on screen saying it had worked.
    // A spend ceiling that appears to accept a value and did not is worse than
    // no ceiling, because it is believed.
    onError: (e: Error) =>
      setReceipt({
        verb: "The ceiling on a piece of work did not move",
        consequence: humanWriteError(e, "It is still where it was."),
        failed: true,
      }),
  });

  const setCap = useMutation({
    mutationFn: (cap: number | null) => fSetCap({ data: { cap_usd: cap } }),
    onSuccess: (_r, cap) => {
      setReceipt({
        verb: "You moved the ceiling",
        consequence:
          cap === null ? (
            "A run now continues until it finishes. Nothing stops it on spend."
          ) : (
            <>
              A run now halts at <Num>${cap.toFixed(2)}</Num>.
            </>
          ),
      });
      void qc.invalidateQueries({ queryKey: ["boundary"] });
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "The ceiling did not move",
        consequence: humanWriteError(e, "It is still where it was."),
        failed: true,
      }),
  });

  const data = b.data;
  // Never null, even before the read lands: the shipped numbers ARE the policy
  // until a workspace says otherwise, so there is no such thing as "no policy".
  const autonomy: AutonomyPolicy = data?.autonomy ?? SHIPPED_AUTONOMY_POLICY;
  const chose = (f: AutonomyField) => autonomy.chosen.includes(f);
  const total = data ? data.alone.length + data.asks.length + data.never.length : 0;

  /* THE STORED SETTING AND THE RUNNING SYSTEM DISAGREE, AND THIS SURFACE HAS TO
   * REPORT THE RUNNING SYSTEM.
   *
   * `getBoundary` buckets purely on the stored mode: auto -> alone, off ->
   * never, everything else -> asks. But the loop demotes a low-risk `confirm`
   * tool with no floor to auto and runs it inline, so those tools were being
   * listed under "What still comes to you" while nothing ever came.
   *
   * On any other screen that is a wrong label. On THIS one it is the whole
   * product failing: the single question this page exists to answer is what
   * runs without a person, and the headline count -- "your crew does N of M
   * things without asking" -- was reading N off `alone` alone and therefore
   * UNDER-reporting the crew's real reach. A person deciding whether to walk
   * away from a running agent was being told a smaller number than the truth.
   * An over-report would be merely alarming; an under-report is the direction
   * that gets someone hurt.
   *
   * The predicate quotes the one branch of `resolveToolMode` that does this, and
   * reads `risk` and `floor` off the boundary's own rows rather than recomputing
   * either -- one client-side restatement of one server rule, in one place. The
   * same predicate is used by the Settings pane, so the two surfaces cannot
   * disagree about it.
   *
   * THE REAL FIX IS SERVER-SIDE, in getBoundary's bucketing loop
   * (src/lib/governance.functions.ts:967-968), and it is logged for the
   * engineering lane. This corrects the report in the meantime rather than
   * leaving the most consequential number in the product quietly wrong. */
  const runsAloneDespiteAsking = (t: BoundaryTool) =>
    t.mode === "confirm" && t.risk === "low" && t.floor === null;
  const demoted = React.useMemo(
    () => (data?.asks ?? []).filter(runsAloneDespiteAsking),
    [data?.asks],
  );
  const trulyAlone = React.useMemo(
    () => [...(data?.alone ?? []), ...demoted],
    [data?.alone, demoted],
  );
  const trulyAsks = React.useMemo(
    () => (data?.asks ?? []).filter((t) => !runsAloneDespiteAsking(t)),
    [data?.asks],
  );

  // The two bars the platform crosses on its own. One mutation for all six
  // numbers: they are one policy, and six mutations would be six ways for the
  // surface and the record to disagree.
  const setAutonomy = useMutation({
    mutationFn: (v: { field: AutonomyField; next: number | null }) =>
      fSetAutonomy({ data: { [v.field]: v.next } }),
    onSuccess: (_r, v) => {
      setReceipt({
        verb: "You moved the boundary",
        consequence: autonomyConsequence(v.field, v.next, autonomy),
      });
      void qc.invalidateQueries({ queryKey: ["boundary"] });
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "The boundary did not move",
        // Never the raw error. humanWriteError turns an RLS refusal or a
        // constraint violation into a sentence; without it this surface printed
        // `new row violates row-level security policy for table "agent_tools"`
        // into a receipt, handing a person the mechanism and an internal table
        // name instead of the outcome.
        consequence: humanWriteError(e, "It is still where it was."),
        failed: true,
      }),
  });

  /** One block of the boundary. The menu offers only the moves a floor allows,
   *  and where a move is forbidden the row says why instead of showing a
   *  control that does nothing. */
  const block = (key: string, title: string, sub: string, tools: BoundaryTool[], empty: string) => {
    const open = showAll[key] ?? false;
    const shown = open ? tools : tools.slice(0, VISIBLE);
    return (
      <Block
        title={title}
        sub={sub}
        more={tools.length > VISIBLE ? (open ? "Show fewer" : `All ${tools.length}`) : undefined}
        onMore={() => setShowAll((s) => ({ ...s, [key]: !open }))}
      >
        {tools.length === 0 ? (
          <Empty>{empty}</Empty>
        ) : (
          shown.map((t) => (
            <Row
              key={t.name}
              tight
              lead={t.label}
              // The different fact: what it does, or what the floor forbids.
              sub={floorLine(t.floor) ?? t.what ?? t.category}
              action={
                t.floor === "review" ? (
                  <Value tone="warn">Yours</Value>
                ) : (
                  <MoreMenu label={`Move the boundary for ${t.label}`}>
                    {t.mode !== "auto" && t.floor !== "confirm" ? (
                      <MoreItem
                        onClick={() => {
                          void (async () => {
                            if (await askBeforeMoving(t, "auto")) {
                              move.mutate({ tool: t, mode: "auto" });
                            }
                          })();
                        }}
                      >
                        Let them do it alone
                      </MoreItem>
                    ) : null}
                    {/* Tightening stays one click. See askBeforeMoving. */}
                    {t.mode !== "confirm" ? (
                      <MoreItem onClick={() => move.mutate({ tool: t, mode: "confirm" })}>
                        Come to me first
                      </MoreItem>
                    ) : null}
                    {t.mode !== "off" ? (
                      <MoreItem
                        onClick={() => {
                          void (async () => {
                            if (await askBeforeMoving(t, "off")) {
                              move.mutate({ tool: t, mode: "off" });
                            }
                          })();
                        }}
                      >
                        Nobody may do this
                      </MoreItem>
                    ) : null}
                  </MoreMenu>
                )
              }
            />
          ))
        )}
      </Block>
    );
  };

  return (
    <Surface
      context={
        <>
          <CtxHead>How a boundary works</CtxHead>
          <CtxBody>
            Policy is set here, in advance, and it never blocks work that is already running. A gate
            is the exception, not the loop.
          </CtxBody>
          {data ? (
            <>
              <CtxHead>What cannot be handed over</CtxHead>
              <CtxBody>
                Anything the product cannot undo from inside itself stays yours: a production
                deploy, anything a customer sees, and spend past the ceiling. Those floors are not
                settings.
              </CtxBody>
            </>
          ) : null}
        </>
      }
    >
      <PageHead
        title={
          b.isLoading ? (
            "Boundary"
          ) : b.isError ? (
            "The boundary could not be read."
          ) : total === 0 ? (
            "No crew has been given anything to do yet."
          ) : (
            <>
              Your crew does <Num>{trulyAlone.length}</Num> of <Num>{total}</Num> things without
              asking.
            </>
          )
        }
        sub={
          total > 0
            ? "Set once, in advance. Moving a boundary never interrupts work that is already running."
            : undefined
        }
      />

      {/* WORKSPACE-WIDE POLICY, ABOVE THE PER-TOOL EXCEPTIONS. These four
          switches decide what runs on a schedule at all; the tool modes below
          decide how much of it happens without asking. Read in that order it is
          one page; read the other way a person tunes exceptions to a loop that
          is switched off.

          IT IS OUTSIDE THE `b` GUARDS DELIBERATELY. The boundary read below can
          fail, and when it does this page shows a failure state and nothing
          else. These switches do not depend on that read, and the automation
          flags are the one thing on this page that can be dark for six weeks
          without anybody noticing, so they must not disappear because a
          different query broke. */}
      <AutomationBoundary workspaceId={activeWorkspaceId ?? null} />
      {b.isError ? (
        <Failed onRetry={() => void b.refetch()}>
          {(b.error as Error)?.message ?? "The reason did not come back with the error."}
        </Failed>
      ) : b.isLoading ? (
        <Loading>Reading what your crew is allowed to do.</Loading>
      ) : !data ? null : (
        <>
          {receipt ? (
            <Receipt
              verb={receipt.verb}
              consequence={receipt.consequence}
              failed={receipt.failed}
            />
          ) : null}

          {/* THE QUEUE EATING ITSELF, and it belongs above the boundary rather
            than inside it. `maybeProposeTrustGraduations` watches clean
            approval streaks and proposes that an agent be handed a tool it has
            never once been refused on. That offer was already built and already
            rendered, but only inside the approvals queue, which means the one
            mechanism for SHRINKING the queue was visible only to someone who
            had gone to work it. Here it leads: on a surface about what agents
            may do alone, an agent asking for more room is the one thing worth
            deciding, and accepting it is a policy change rather than a piece of
            work approved. That distinction is why this does not violate the
            no-pending-items rule above: the queue decides work, the boundary
            decides boundaries. */}
          <TrustGraduationsBlock />

          {block(
            "alone",
            "What they do alone",
            demoted.length > 0
              ? `No approval, no interruption. This is where the leverage is. ${demoted.length} of these ${demoted.length === 1 ? "is" : "are"} set to ask you first and will not, because the loop clears low-risk tools inline.`
              : "No approval, no interruption. This is where the leverage is.",
            trulyAlone,
            "Nothing runs without you yet. Every one of these is a person in the loop.",
          )}

          {block(
            "asks",
            "What still comes to you",
            "Each of these costs one interruption every time it happens.",
            trulyAsks,
            "Nothing asks. Your crew runs the loop on its own.",
          )}

          {block(
            "never",
            "What nobody may do",
            "Off for agents and for people. Turning one back on is a decision on the record.",
            data.never,
            "Nothing is switched off.",
          )}

          {/* The ceiling. It belongs on the boundary because a spend limit IS a
            boundary, and because arguing for more autonomy without one is the
            single version of this story a risk officer will refuse. */}
          {data.isOwner ? (
            <Block
              title="The ceiling"
              sub="What one run may spend before it stops, whatever else it is allowed to do."
            >
              <Line
                label="Dollars one run may spend"
                sub={
                  data.capUsd === null ? (
                    "No ceiling. A run continues until it finishes or something else stops it."
                  ) : (
                    <>
                      <Num>${data.capUsd.toFixed(2)}</Num>. A run that reaches it halts and says so,
                      and the halt is on the record.
                    </>
                  )
                }
              >
                <Input
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={data.capUsd ?? undefined}
                  aria-label="Dollars one run may spend before it stops"
                  style={{ width: 96, textAlign: "right" }}
                  disabled={setCap.isPending}
                  onBlur={(e) => {
                    const raw = e.currentTarget.value.trim();
                    const next = raw === "" ? null : Number(raw);
                    if (next !== null && (!Number.isFinite(next) || next <= 0)) return;
                    if (next === data.capUsd) return;
                    setCap.mutate(next);
                  }}
                />
              </Line>
              {/* THE ONE THAT ACTUALLY BOUNDS UNATTENDED SPEND. A person starts
                a track and walks away; it walks seven stations with a crew of
                two or three at each, and only Build opens a mission, so the run
                ceiling above bounded each dispatch separately and nothing summed
                them. This is the ceiling on the whole piece of work. */}
              <Line
                label="Dollars one piece of work may spend"
                sub={
                  data.trackCapUsd === null ? (
                    "No ceiling. Work continues through every station until it finishes."
                  ) : (
                    <>
                      <Num>${data.trackCapUsd.toFixed(2)}</Num> across every station, every agent
                      and every retry. Work that reaches it stops and waits, and raising this
                      carries on from where it stopped.
                    </>
                  )
                }
              >
                <Input
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={data.trackCapUsd ?? undefined}
                  aria-label="Dollars one piece of work may spend before it stops"
                  style={{ width: 96, textAlign: "right" }}
                  disabled={setTrackCap.isPending}
                  onBlur={(e) => {
                    const raw = e.currentTarget.value.trim();
                    const next = raw === "" ? null : Number(raw);
                    if (next !== null && (!Number.isFinite(next) || next <= 0)) return;
                    if (next === data.trackCapUsd) return;
                    setTrackCap.mutate(next);
                  }}
                />
              </Line>
              {data.paused ? (
                <Line
                  label="Everything is paused"
                  sub="A kill switch is on for this workspace, so nothing runs whatever the boundary says."
                >
                  <Value tone="fail">Paused</Value>
                </Line>
              ) : null}
            </Block>
          ) : null}

          {/* THE TWO BARS THE PLATFORM CROSSES ON ITS OWN, and they belong
            here for the same reason the ceiling does. Both were constants
            nobody could see: one decides when a cluster of evidence turns
            itself into work that starts spending, the other decides when an
            agent puts a verdict on a shipped bet instead of asking you. The
            canon's fourth floor says a default the user never set is our
            choice rather than their policy, so it has to be visible and
            changeable, and this is the surface where a person reads what their
            crew may do alone. */}
          {data.isOwner ? (
            <>
              <Block
                title="What starts without you"
                sub="A cluster of evidence becomes a piece of work on its own when it clears all three. Nobody clicks, and the work begins spending against the ceiling above. Clear a field to hand it back to us."
              >
                <Line
                  label="Signals that must say it"
                  htmlFor="bar-frequency"
                  sub={`${autonomy.minFrequency} or more independent signals. One complaint is not a theme, and below this a cluster waits for you to start it by hand.${oursNote(chose("minFrequency"))}`}
                >
                  <PolicyNumber
                    id="bar-frequency"
                    label="Signals a cluster needs before it becomes work"
                    value={autonomy.minFrequency}
                    bounds={AUTONOMY_BOUNDS.minFrequency}
                    step={1}
                    disabled={setAutonomy.isPending}
                    onCommit={(next) => setAutonomy.mutate({ field: "minFrequency", next })}
                  />
                </Line>

                <Line
                  label="How much it has to hurt"
                  htmlFor="bar-severity"
                  sub={`${autonomy.minSeverity} out of 5 or worse for the people who reported it. An annoyance never opens work on its own.${oursNote(chose("minSeverity"))}`}
                >
                  <PolicyNumber
                    id="bar-severity"
                    label="Severity a cluster needs before it becomes work, 1 to 5"
                    value={autonomy.minSeverity}
                    bounds={AUTONOMY_BOUNDS.minSeverity}
                    step={1}
                    disabled={setAutonomy.isPending}
                    onCommit={(next) => setAutonomy.mutate({ field: "minSeverity", next })}
                  />
                </Line>

                <Line
                  label="How sure the grouping has to be"
                  htmlFor="bar-confidence"
                  sub={`${pct(autonomy.minConfidence)}% sure these signals belong together. Below it the work would start from a brief that is three unrelated complaints stapled together.${oursNote(chose("minConfidence"))}`}
                >
                  <PolicyNumber
                    id="bar-confidence"
                    label="Percent sure the grouping has to be before work starts"
                    value={pct(autonomy.minConfidence)}
                    bounds={{ min: 0, max: 100 }}
                    step={5}
                    disabled={setAutonomy.isPending}
                    onCommit={(next) =>
                      setAutonomy.mutate({
                        field: "minConfidence",
                        next: next === null ? null : next / 100,
                      })
                    }
                  />
                </Line>

                <Line
                  label="What moving these costs you, both ways"
                  sub="Lower them and work starts on evidence you have not read yet, and it spends before you see it. Raise them and real themes sit in Discover until you notice them and start them by hand. Neither direction is the safe one."
                />
              </Block>

              <Block
                title="What an agent may settle on its own"
                sub="When a shipped bet's outcome window closes, an agent either puts the verdict on the record or hands the call to you. This is where that line sits."
              >
                <Line
                  label="Evidence a verdict needs when nothing rides on it"
                  htmlFor="bar-settle-floor"
                  sub={`${pct(autonomy.settleFloor)}% of the case a full one would carry. Below that the verdict comes to you even when it costs almost nothing to be wrong.${oursNote(chose("settleFloor"))}`}
                >
                  <PolicyNumber
                    id="bar-settle-floor"
                    label="Percent of the evidence a verdict needs when nothing rides on it"
                    value={pct(autonomy.settleFloor)}
                    bounds={{ min: 0, max: 100 }}
                    step={5}
                    disabled={setAutonomy.isPending}
                    onCommit={(next) =>
                      setAutonomy.mutate({
                        field: "settleFloor",
                        next: next === null ? null : next / 100,
                      })
                    }
                  />
                </Line>

                <Line
                  label="How much higher the bar climbs when a lot rides on it"
                  htmlFor="bar-settle-span"
                  sub={`A big bet whose verdict re-ranks other bets needs ${pct(Math.min(1, autonomy.settleFloor + autonomy.settleStakesSpan))}% instead, which nothing short of a number that was read plus two weeks of usage plus the merged change on file can clear.${oursNote(chose("settleStakesSpan"))}`}
                >
                  <PolicyNumber
                    id="bar-settle-span"
                    label="Percent the evidence bar climbs by when everything rides on the verdict"
                    value={pct(autonomy.settleStakesSpan)}
                    bounds={{ min: 0, max: 100 }}
                    step={5}
                    disabled={setAutonomy.isPending}
                    onCommit={(next) =>
                      setAutonomy.mutate({
                        field: "settleStakesSpan",
                        next: next === null ? null : next / 100,
                      })
                    }
                  />
                </Line>

                {/* THE CARVE-OUT IS SAID OUT LOUD. The founder asked to be able
                  to state "never settle a bet above impact 8" rather than have
                  it fall out of a number he tuned, and the two are genuinely
                  different: a threshold is an argument about evidence, and this
                  is a sentence about what an agent may never be the one to
                  decide. It only ever takes a call back, never hands one over. */}
                <Line
                  label="Never settle a bet above this impact"
                  htmlFor="bar-carve-out"
                  sub={
                    autonomy.neverSettleAboveImpact === null
                      ? "No carve-out. Every bet is judged on its evidence alone, however big it is. Name an impact here and nothing above it is ever settled by an agent."
                      : `Nothing scored above ${autonomy.neverSettleAboveImpact} is ever settled by an agent, whatever the evidence says. Bets at ${autonomy.neverSettleAboveImpact} and below still answer to the bar above. Clear the field to drop the carve-out.`
                  }
                >
                  <PolicyNumber
                    id="bar-carve-out"
                    label="The impact above which an agent never settles a verdict"
                    // Empty when there is no carve-out. A pre-filled impact
                    // would let a focus and a tab invent one.
                    value={autonomy.neverSettleAboveImpact}
                    bounds={AUTONOMY_BOUNDS.neverSettleAboveImpact}
                    step={1}
                    disabled={setAutonomy.isPending}
                    onCommit={(next) =>
                      setAutonomy.mutate({ field: "neverSettleAboveImpact", next })
                    }
                  />
                </Line>

                <Line
                  label="Three calls stay yours whatever these say"
                  sub="A bet nothing was ever attached to that could check it. A win or a miss with no number actually read. And a miss that would hold another agent's promotion on a soft signal. Those are floors, not settings, so no number here can lower them."
                />

                <Line
                  label="What moving these costs you, both ways"
                  sub="Lower them and verdicts land on your record without you, and a wrong one compounds into every future recommendation. Raise them and every shipped bet waits in Learn for a judgment only you can give, which is the approvals queue coming back under a different name."
                />
              </Block>
            </>
          ) : null}

          <DeclinedLedger
            q={ledger}
            open={showAll.ledger ?? false}
            onToggle={() => setShowAll((s) => ({ ...s, ledger: !(s.ledger ?? false) }))}
          />
        </>
      )}
    </Surface>
  );
}

export const Route = createFileRoute("/_authenticated/boundary")({
  component: BoundarySurface,
  head: () => ({ meta: [{ title: "The boundary · Supaprod" }] }),
  errorComponent: ({ error }) => (
    <Surface>
      <PageHead
        title="The boundary did not load."
        sub={(error as Error)?.message ?? "The reason did not come back with the error."}
      />
      <Block>
        <Empty>
          Nothing changed. Your crew is still working to the boundary you last set, which is the
          safe way for this screen to fail.
        </Empty>
      </Block>
    </Surface>
  ),
});
