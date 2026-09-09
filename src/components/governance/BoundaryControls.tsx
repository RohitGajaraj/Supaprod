/**
 * THE BOUNDARY CONTROLS, AS A COMPONENT (request 022).
 *
 * Lifted verbatim from the /boundary route so the Engine Room's Safety room
 * can host them and the route can fold without stranding the platform's only
 * tool-mode editor -- a capability reachable from nowhere being this repo's
 * dominant defect, committed deliberately rather than by accident.
 *
 * Everything here is policy a person decides, not machinery: per-tool modes,
 * the automation bars, the trust graduations an agent earned, the ceilings,
 * and the declined ledger that proves the boundary holds. The floors are read
 * from the real resolver (`getBoundary`), never restated client-side.
 */
import { Row, Line } from "@/components/meridian/rows";
import {
  NothingHere,
  Num,
  PageHeading,
  ReadFailed,
  ReadFailedLine,
  Reading,
  Region,
  Toggle,
  Value,
} from "@/components/meridian/surface-parts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import * as React from "react";

import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  getBoundary,
  getDeclinedLedger,
  getGovernanceOverview,
  setWorkspaceAutonomyPolicy,
  setWorkspacePause,
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
import { CHECK_NAMES } from "@/lib/exec/check-names";
/* The label logic is pure and lives beside `ceiling-reality` and `who-chose-this`
   for the same reason: this file's module scope pulls six server functions, so a
   sentence a person reads should not need the page mocked to be tested. */
import { crossingLabel, type RecordTone } from "@/components/governance/what-the-record-can-say";
import { relativeTime } from "@/lib/memory-view";
import { updateToolMode } from "@/lib/agent_loop.functions";
/* THE SENTENCE THAT LETS THE POLICY BIND. `resolveApprovalPolicy` can switch a
   tool off once a workspace has refused it every time, and S0 deliberately did
   NOT wire it to the gate, because a tool that stops working with no
   explanation is the dead end R-20 §5 forbids. The policy already writes the
   sentence for the person; `getApprovalPolicyState` is the read that carries it
   out, and this file is the surface it was queued to. See A-004. */
import { getApprovalPolicyState } from "@/lib/approvals-queue.functions";
import { humanWriteError } from "@/lib/roles.functions";
import { TrustGraduationsBlock } from "@/components/governance/TrustGraduations";
import { AutomationBoundary } from "@/components/governance/AutomationBoundary";
import { ceilingReality, TRACKS } from "@/components/governance/ceiling-reality";
import { whereTheCrewStands } from "@/components/governance/where-the-crew-stands";
import { unansweredGates, whatBecameOfThem } from "@/components/governance/gates-nobody-answered";
import { whatTheyActuallyDid } from "@/components/governance/what-they-actually-did";
import { oursNotYours } from "@/components/governance/who-chose-this";
import { Link } from "@tanstack/react-router";
import { Field, Input } from "@/components/meridian/forms";
import { MoreItem, MoreMenu } from "@/components/meridian/MoreMenu";
import { Receipt } from "@/components/meridian/Receipt";

/** How many tools a block shows before it counts the rest. A boundary is read,
 *  not browsed, and forty rows in one block is a settings page again. */
const VISIBLE = 8;

/**
 * The two halves of "you set this, and this is what happens", in the words the
 * menu itself uses so a person can match a row to the control that moved it.
 *
 * Kept as two maps rather than one sentence builder because the SET half is a
 * choice a person made and the RUNS half is what the loop does with it, and
 * collapsing them would let a future edit change one voice into the other.
 */
const SET_WORD: Record<BoundaryTool["mode"], string> = {
  auto: "run alone",
  confirm: "come to you first",
  review: "wait for you every time",
  off: "be off",
};

const WHAT_RUNS: Record<BoundaryTool["runsAs"], string> = {
  auto: "it runs without asking you.",
  confirm: "it comes to you first.",
  review: "it waits for you every time.",
  off: "it is off.",
};

type BoundaryReceipt = { verb: string; consequence: React.ReactNode; failed?: boolean };

/** What a floor forbids, in plain words. Never the mechanism name. */
function floorLine(floor: BoundaryTool["floor"]): string | null {
  if (floor === "review") return "Always yours to approve. This one cannot be handed over.";
  if (floor === "confirm") return "Can never run silently.";
  return null;
}

/**
 * THE FIVE WORDS A VALUE MAY WEAR, STILL READ OFF THE COMPONENT THAT PAINTS THEM.
 *
 * The tone now comes from `what-the-record-can-say`, which is pure and therefore
 * cannot import React to derive this. **So the link is kept as an assertion
 * rather than dropped:** if Meridian's five status words ever change, this line
 * fails to compile here instead of the pure module shipping a tone nothing
 * paints. That was the whole point of not restating the union, and extracting
 * the logic must not quietly cost it.
 */
type ValueTone = NonNullable<React.ComponentProps<typeof Value>["tone"]>;
const _toneStillMatchesMeridian: RecordTone extends ValueTone ? true : never = true;
void _toneStillMatchesMeridian;

/** The subject of a boundary event in a person's words, not the tool's identifier. */
function readableSubject(e: BoundaryEvent): string {
  if (e.kind === "refused") return e.subject;
  return e.subject.replace(/_/g, " ");
}

type LedgerData = {
  events: BoundaryEvent[];
  waiting: number;
  windowDays: number;
  truncated: boolean;
};

/* ------------------------------------------------------------------ *
 * The declined ledger: every moment an agent reached the boundary and
 * stopped. Policy first, then the proof; they are one argument.
 * ------------------------------------------------------------------ */

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
      <Region title="What they did not do">
        <ReadFailedLine>The record could not be read. Your boundary is unchanged.</ReadFailedLine>
      </Region>
    );
  }
  if (q.isLoading || !q.data) {
    return (
      <Region title="What they did not do">
        <Reading>Reading the record.</Reading>
      </Region>
    );
  }

  const { events, waiting, windowDays, truncated } = q.data;
  // Decided and blocked only. Waiting is reported as a count below: the moment
  // this renders a pending item with an action beside it, it becomes the
  // approval queue it exists to shrink.
  const settled = events.filter((e) => e.outcome !== "waiting");
  const shown = open ? settled : settled.slice(0, VISIBLE);
  // Read once per render so every row in the list ages against the same clock.
  const now = Date.now();

  return (
    <Region
      title="What they did not do"
      sub={`Every time an agent reached your boundary and stopped, over the last ${windowDays} days. This is what pays for the autonomy.`}
      toggle={
        settled.length > VISIBLE ? (open ? "Show fewer" : `All ${settled.length}`) : undefined
      }
      onToggle={onToggle}
      toggled={open}
    >
      {settled.length === 0 ? (
        <NothingHere>
          Nothing has reached your boundary in {windowDays} days. Either your crew has not run, or
          everything it did was already inside what you allow.
        </NothingHere>
      ) : (
        shown.map((e) => {
          const o = crossingLabel(e);
          return (
            <Row
              key={e.id}
              tight
              lead={
                e.kind === "asked"
                  ? `${e.agent ?? "An agent"} wanted to ${readableSubject(e)}`
                  : readableSubject(e)
              }
              /*
               * THE QUALIFIER GOES IN THE SUB, NOT THE STATUS WORD. `Value` is a
               * short status and "Allowed, and the record does not name who"
               * would wrap it into a paragraph. The status stays a word and the
               * sentence that weakens it sits on the same line as the rest of
               * what is known about the row, which is where a person reading the
               * trail is already looking.
               *
               * `o.caveat` rather than a second test of `decidedBy` here: which
               * outcomes can lack an answerer is one rule, and it lives in
               * `what-the-record-can-say` with the label it qualifies.
               */
              sub={[relativeTime(e.at, now), e.wanted, e.outcomeReason, o.caveat]
                .filter(Boolean)
                .join(" · ")}
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
    </Region>
  );
}

/* ------------------------------------------------------------------ *
 * The two bars the platform crosses on its own
 * ------------------------------------------------------------------ */

/** A whole percent, for the three numbers stored as a fraction. */
const pct = (n: number) => Math.round(n * 100);

/**
 * One number on the policy, as a control you can actually reach.
 *
 * Uncontrolled with a `key` on the stored value: after a write lands, the
 * field remounts from the record rather than still showing what it showed on
 * first paint. A NULL VALUE IS AN EMPTY FIELD, not a number standing in for
 * one -- only a real change writes anything.
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

export function BoundaryControls({
  /**
   * Suppress the "Everything is paused" readout, for a page that already
   * carries the pause SWITCH itself.
   *
   * WHY A PROP RATHER THAN A DELETE. Settings now renders this panel beside
   * ControlsPanel, which owns the switch (setWorkspacePause). Two places
   * stating the same fact is a defect twice over: it is redundant, and the two
   * reads can disagree while one query is stale, which is how a person comes to
   * distrust both. But this panel ALSO renders alone at /engine-room?room=safety
   * where there is no switch, and deleting the readout would leave that surface
   * with no pause signal at all. So the caller that has a better answer says so,
   * and the caller that does not keeps the readout.
   *
   * The SWITCH wins over the READOUT when both are present: a control that shows
   * its own state is strictly better than a line that shows state and offers
   * nothing, which would leave a person reading "paused" and hunting for where
   * to change it.
   */
  pauseShownElsewhere = false,
  /**
   * True when the surface mounting this panel already draws a page heading, as
   * settings does -- its title is the door's own name and has to stay that.
   * The posture sentence then renders at region level instead of as a second
   * page title. See the note beside `posture` below.
   */
  headingShownElsewhere = false,
}: {
  pauseShownElsewhere?: boolean;
  headingShownElsewhere?: boolean;
} = {}) {
  const qc = useQueryClient();
  const { activeWorkspaceId } = useWorkspace();
  const fBoundary = useServerFn(getBoundary);
  const fLedger = useServerFn(getDeclinedLedger);
  const fSetMode = useServerFn(updateToolMode);
  const fSetCap = useServerFn(setWorkspaceSpendPolicy);
  const fSetAutonomy = useServerFn(setWorkspaceAutonomyPolicy);
  const fSetPause = useServerFn(setWorkspacePause);

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

  /**
   * WHAT THE WORK ACTUALLY COST, read under the key ControlsPanel already uses.
   *
   * THE IDENTICAL KEY AND THE IDENTICAL SERVER FUNCTION, so TanStack hands both
   * panels one cache entry rather than two reads that merely agree today.
   * Settings mounts this panel and ControlsPanel on the same pane, and two
   * copies of a spend figure that can disagree while one is stale is how a
   * person learns to trust neither.
   *
   * Independent of `b` on purpose, like the two reads above it: if this fails,
   * the ceiling a person came here to move still moves. It only ever ADDS a
   * sentence, so its silence costs nothing and never asserts anything.
   */
  const fOverview = useServerFn(getGovernanceOverview);
  const overview = useQuery({
    queryKey: ["governance", "overview", activeWorkspaceId],
    queryFn: () => fOverview({ data: { workspaceId: activeWorkspaceId ?? null } }),
  });
  const spent = ceilingReality(overview.data?.runs);

  /* Same independence, for the same reason: if this read fails, the settings a
     person came here to change still work. It is scoped to the workspace
     because one team's refusals must never quiet another team's tools. */
  const fPolicy = useServerFn(getApprovalPolicyState);
  const policy = useQuery({
    queryKey: ["approval-policy-state", activeWorkspaceId],
    queryFn: () => fPolicy({ data: { workspaceId: activeWorkspaceId as string } }),
    enabled: !!activeWorkspaceId,
  });

  /* MOVING A BOUNDARY IS A DECISION, NOT A PREFERENCE. Friction is scaled to
   * consequence rather than applied evenly: granting autonomy stops you,
   * revoking confirms but is never styled destructive, and TIGHTENING stays
   * one click because making a boundary tighter must never be harder than
   * leaving it loose. */
  const confirm = useConfirm();
  const askBeforeMoving = React.useCallback(
    async (tool: BoundaryTool, mode: "auto" | "confirm" | "off"): Promise<boolean> => {
      if (mode === "confirm") return true;
      if (mode === "auto") {
        return confirm({
          title: `Let agents run ${tool.label} on their own?`,
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
    // THIS HANDLER WAS MISSING ENTIRELY once: a refused write produced no
    // receipt and no change while the old receipt stayed saying it had worked.
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
  /* The same pair for the whole piece of work. TRACKS carries `seesHalts:
     false`, so the sentence reports a cost and claims nothing about halting. */
  const trackSpent = ceilingReality(data?.trackSpend, TRACKS);
  /* How often a gate dies here, with the population in the sentence. */
  const gateHistory = whatBecameOfThem(data?.gateHistory);

  // Never null, even before the read lands: the shipped numbers ARE the policy
  // until a workspace says otherwise, so there is no such thing as "no policy".
  const autonomy: AutonomyPolicy = data?.autonomy ?? SHIPPED_AUTONOMY_POLICY;
  const chose = (f: AutonomyField) => autonomy.chosen.includes(f);
  const total = data ? data.alone.length + data.asks.length + data.never.length : 0;

  /* ONLY THE TOOLS WHOSE ANSWER THE RECORD ACTUALLY MOVED. The read returns
     every tool this workspace has ever ruled on, but a tool sitting at its
     shipped default is not a finding and listing it would bury the two that
     are. `tightenedFromDefault` is the server's own comparison, and it can only
     ever mean "stricter": the policy is proved never to loosen. */
  const changedByAnswers = (policy.data?.tools ?? []).filter((t) => t.tightenedFromDefault);

  /* The registry name is an identifier, and §12 says a word a person would not
     say out loud does not go on a surface. The boundary read already carries
     the label for every tool it knows, so this borrows it and falls back to the
     raw name rather than inventing a second naming rule. */
  const toolLabel = (name: string): string => {
    const all = data ? [...data.alone, ...data.asks, ...data.never] : [];
    return all.find((t) => t.name === name)?.label ?? name;
  };

  /*
   * THE SERVER NOW ANSWERS THIS, AND THE HAND-ROLLED PREDICATE THAT USED TO IS
   * GONE.
   *
   * It read `mode === "confirm" && toolRisk(name) === "low" && floor === null`,
   * quoting the one branch of `resolveToolMode` that clears a low-risk tool
   * inline. That branch is real, and it was a small fraction of the gap. The
   * arc dial is the big door: `resolveApprovalMode` turns EVERY `confirm` tool
   * into `auto` on a trusted arc, all 93 `agent_autonomy` rows are trusted and
   * `loadAgentArc` defaults the rest to trusted. Over the 74 registered tools
   * the stored buckets read 52 auto and the resolver reads 68.
   *
   * Reproducing that here would have meant a second copy of the safety
   * composition living in a component, drifting from the one the loop runs.
   * `getBoundary` now calls the real resolver and returns `runsAs` beside
   * `mode`, so this file states no policy of its own -- it reads one field and
   * shows where the two disagree.
   *
   * TWO CORRECTIONS ON THE RECORD, because the comment that stood here was
   * wrong for one commit. It claimed `BoundaryTool.risk` was the mode
   * relabelled and the predicate could never fire. The relabelling was real but
   * belonged to `listGovernApprovals` -- a different server function in the same
   * file -- where it was understating fourteen tools on the approvals screen and
   * is now fixed. `getBoundary` has always set `risk: toolRisk(name)`.
   */
  const alone = React.useMemo(() => data?.alone ?? [], [data?.alone]);
  const asks = React.useMemo(() => data?.asks ?? [], [data?.asks]);
  /*
   * WHAT ACTUALLY HAPPENS TO A GATE, off the same overview read as the ceiling.
   * "Each of these costs one interruption" assumes somebody answers it; across
   * every approval this database has ever written, roughly one in three was
   * never answered at all. See gates-nobody-answered.ts.
   */
  const unanswered = unansweredGates(overview.data?.approvals, toolLabel);
  /* The proof beside the policy: what the block above has actually let through.
     See what-they-actually-did.ts for what the sentence may and may not claim. */
  const did = whatTheyActuallyDid(data?.didAlone, toolLabel);
  /** What the whole page resolves against, said in the trust dial's own words. */
  const standing = whereTheCrewStands(data?.arcCounts);
  /** Set to ask you, and does not. The one thing this screen must never leave
   *  a person to discover from a run. */
  const looserThanSet = React.useMemo(() => alone.filter((t) => t.mode !== "auto"), [alone]);

  // One mutation for all six numbers: they are one policy, and six mutations
  // would be six ways for the surface and the record to disagree.
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
        consequence: humanWriteError(e, "It is still where it was."),
        failed: true,
      }),
  });

  /**
   * THE KILL SWITCH, AND THIS IS NOW ITS ONLY EDITOR (S0 ruling A-006 §2).
   *
   * It used to live on ControlsPanel while this panel drew a read-only
   * "Everything is paused" line, and the two were mounted on the same settings
   * pane. Two editors of one switch is worse than two names for one
   * destination: a stale readout beside a live toggle can tell a person the
   * OPPOSITE of the truth about whether their agents are running, and that is
   * the one fact on this page nobody may be wrong about.
   *
   * It belongs here because this panel is the boundary editor, and stopping
   * everything is the outermost boundary there is. ControlsPanel keeps a
   * readout that names where the switch lives.
   */
  const [pauseReason, setPauseReason] = React.useState("");
  const setPause = useMutation({
    mutationFn: (next: boolean) =>
      fSetPause({
        data: { workspaceId: activeWorkspaceId!, paused: next, reason: pauseReason || null },
      }),
    /*
     * OPTIMISTIC, BECAUSE INVALIDATING ALONE LEFT A GAP A PERSON COULD SEE
     * (P-17 follow-up 2, A1 live 2026-09-02 22:03).
     *
     * `onSuccess` already invalidated `["boundary"]`, which is correct and
     * necessary -- but invalidate only marks the query stale; the toggle stays
     * on its OLD `data.paused` until the refetch that follows actually lands.
     * A1 pressed it and watched the knob sit left, unmoved, for three seconds
     * while `ControlsPanel`'s own readout (a separate render off the same
     * key, but only re-rendering once ITS refetch resolves too) had already
     * flipped. The switch was never wrong -- the write landed immediately --
     * it was SLOW TO SAY SO, on the one control this page states nobody may
     * be wrong about.
     *
     * `onMutate` sets the cache to the value being written the instant the
     * press happens, `onError` rolls it back to the exact snapshot if the
     * write fails, and `onSuccess`'s invalidate still runs after -- so the
     * toggle shows the truth optimistically now and the real server row
     * once the refetch confirms it, never a value nobody asked for.
     */
    onMutate: async (next: boolean) => {
      const key = ["boundary", activeWorkspaceId] as const;
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData(key);
      qc.setQueryData(key, (old: typeof b.data) => (old ? { ...old, paused: next } : old));
      return { previous };
    },
    onSuccess: (_r, next) => {
      setReceipt({
        verb: next ? "You stopped the crew" : "You let the crew run",
        // Resume copy stays honest: a halted run does not pick itself back up,
        // the agents simply become dispatchable again.
        consequence: next
          ? "Every agent is holding mid-step. Nothing was lost, and nothing runs until you turn this back on."
          : "They can be dispatched again. Runs that were already halted do not pick themselves back up.",
      });
      setPauseReason("");
      void qc.invalidateQueries({ queryKey: ["boundary"] });
      void qc.invalidateQueries({ queryKey: ["governance"] });
    },
    onError: (e: Error, _next, context) => {
      if (context) qc.setQueryData(["boundary", activeWorkspaceId], context.previous);
      setReceipt({
        verb: "That switch did not save",
        consequence: humanWriteError(e, "The crew is as it was."),
        failed: true,
      });
    },
  });

  /** One block of the boundary. The menu offers only the moves a floor allows,
   *  and where a move is forbidden the row says why instead of showing a
   *  control that does nothing. */
  /*
   * Every block discloses how much of it is ours rather than theirs. Appended
   * inside `block` rather than at each call site so no block can be added
   * without it: the disclosure is a property of showing a policy list, not a
   * decision three callers make separately.
   */
  /**
   * A REGION SUB IS ONE SENTENCE, AND THE EVIDENCE GETS ITS OWN LINES.
   *
   * This is a correction to my own work over the last day. The evidence on this
   * screen arrived one unit at a time and each new sentence was appended to the
   * block's `sub`, because that was where the last one went. Rendered, the
   * "what they do alone" heading carried FIVE sentences:
   *
   *   No approval, no interruption. This is where the leverage is. Your crew
   *   has done these 412 times without asking in the last 30 days. The most
   *   recent was Commit code. 16 of these are set to come to you first and will
   *   not, because every agent starts out running alone except on the risky
   *   calls. You can lower that per agent. 12 of these are what we
   *   ship, not settings anybody here has made.
   *
   * Every clause is true and the paragraph is unreadable, which is the founder's
   * complaint about this surface in his own words: plain, simple, and it must
   * still do the job. A wall under a heading does not do the job -- nobody
   * reads the fourth sentence of a sub.
   *
   * So the `sub` keeps the one line that says what the block IS, and each fact
   * becomes a `Line`: a label somebody can scan and a second line that explains
   * it. Same words, same order, four times as likely to be read. Nothing is
   * dropped, which matters -- every one of those sentences exists because the
   * screen was claiming something it could not prove without it.
   */
  const block = (
    key: string,
    title: string,
    sub: string,
    tools: BoundaryTool[],
    empty: string,
    facts: { label: string; sub?: string }[] = [],
  ) => {
    const ours = oursNotYours(tools);
    const open = showAll[key] ?? false;
    const shown = open ? tools : tools.slice(0, VISIBLE);
    const lines = [...facts, ...(ours ? [{ label: ours }] : [])];
    return (
      <Region
        title={title}
        sub={sub}
        toggle={tools.length > VISIBLE ? (open ? "Show fewer" : `All ${tools.length}`) : undefined}
        onToggle={() => setShowAll((s) => ({ ...s, [key]: !open }))}
        toggled={open}
      >
        {/* The evidence first, because it is what the reader came to check, and
            the settings under it are what they came to change. */}
        {lines.map((f) => (
          <Line key={f.label} label={f.label} sub={f.sub} />
        ))}
        {tools.length === 0 ? (
          <NothingHere>{empty}</NothingHere>
        ) : (
          shown.map((t) => (
            <Row
              key={t.name}
              tight
              lead={t.label}
              /*
               * The different fact, in priority order: where the SET value and
               * the running one disagree, then what a floor forbids, then what
               * the tool does.
               *
               * The disagreement leads because it is the only one of the three
               * a person can be wrong about without knowing. A row reading
               * "Come to me first" in a block headed "What they do alone" is a
               * contradiction the reader will resolve in whichever direction
               * they already believed, and the reassuring direction is the one
               * that gets them hurt.
               */
              sub={
                t.mode !== t.runsAs
                  ? `Set to ${SET_WORD[t.mode]}, and it does not: ${WHAT_RUNS[t.runsAs]}`
                  : (floorLine(t.floor) ?? t.what ?? t.category)
              }
              action={
                /* `hold` AND NOT THE ORCHID: this tool waits on you every
                   single time and there is deliberately no control beside it,
                   because the floor forbids the move. Orchid promises a control
                   that shifts the thing; amber says the condition it is held
                   on, which is you. */
                t.floor === "review" ? (
                  <Value tone="hold">Yours</Value>
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
      </Region>
    );
  };

  /**
   * THE POSTURE SENTENCE, AND WHY IT STOPS BEING A PAGE HEADING.
   *
   * "Your crew does N of M things without asking" is the single most useful
   * line on this panel: it is the whole question answered in one sentence, from
   * the same read as the controls under it. It must not be lost.
   *
   * But this panel is now mounted inside a page that already has a heading --
   * settings, whose title is the door's own name and has to stay that by the
   * door-and-page guard -- so it was drawing a SECOND page title directly under
   * the first. Two page titles on one pane is two h1s for a screen reader and,
   * on a failed read, it was the largest thing on the screen saying the same
   * thing a line under it already said.
   *
   * So the caller says whether a heading is already above it. The sentence
   * survives either way; only its level changes.
   */
  /*
   * ON A FAILED READ THE POSTURE SAYS NOTHING, because the block below reports
   * it properly with the reason and the way out. Rendered, the two together
   * read "The boundary could not be read." and then "Your session ended. Sign
   * in again" as two loose lines -- one cause, stated twice, in two shapes.
   */
  const posture = b.isLoading ? (
    "Boundary"
  ) : b.isError ? null : total === 0 ? (
    "No crew has been given anything to do yet."
  ) : (
    <>
      Your crew does <Num>{alone.length}</Num> of <Num>{total}</Num> things without asking.
    </>
  );
  const postureSub =
    total > 0
      ? "Set once, in advance. Moving a boundary never interrupts work that is already running."
      : undefined;

  return (
    <div data-mrd="" className="flex flex-col gap-mrd-6">
      {headingShownElsewhere ? (
        posture ? (
          <div>
            <p className="text-mrd-base text-mrd-ink">{posture}</p>
            {postureSub ? <p className="text-mrd-small text-mrd-mute">{postureSub}</p> : null}
          </div>
        ) : null
      ) : (
        <PageHeading
          title={
            b.isLoading ? (
              "Boundary"
            ) : b.isError ? (
              "Boundary"
            ) : total === 0 ? (
              "No crew has been given anything to do yet."
            ) : (
              <>
                Your crew does <Num>{alone.length}</Num> of <Num>{total}</Num> things without
                asking.
              </>
            )
          }
          sub={postureSub}
        />
      )}

      {/*
       * WORKSPACE-WIDE POLICY, and OUTSIDE the `b` guards deliberately: these
       * switches do not depend on that read and must not disappear because a
       * different query broke. On a failed boundary read they are the only
       * thing left a person can still act on, which is when stopping scheduled
       * work matters most.
       *
       * I MOVED THIS DOWN AND PUT IT BACK. Read order argues for it: the three
       * blocks about unattended work -- what may START on a schedule, on what
       * evidence, and how a run may END the same way -- are one family, and
       * this one sits at the top while the other two sit at the bottom. But
       * every candidate position further down is INSIDE the `!data` guard, so
       * grouping them costs the property above, and a reading-order preference
       * does not outrank a control staying reachable when the page around it
       * has failed. Left where it is on purpose, with the reason written down
       * so the next person does not spend the same hour on it.
       */}
      <AutomationBoundary workspaceId={activeWorkspaceId ?? null} />
      {b.isError ? (
        /* One block, not a headline plus a loose line: what is still true, then
           the reason and the control, both from the primitive. */
        <ReadFailed error={b.error} onRetry={() => void b.refetch()}>
          The boundary could not be read, so nothing here is what your crew is actually allowed to
          do. Nothing has moved.
        </ReadFailed>
      ) : b.isLoading ? (
        <Reading>Reading what your crew is allowed to do.</Reading>
      ) : !data ? null : (
        <>
          {/*
           * WHERE THE CREW STANDS, ABOVE EVERYTHING THE RUNG DECIDES.
           *
           * A person reads "your crew does 68 of 74 things without asking" and
           * has no way from this page to learn WHY, or that a dial exists. It
           * is not the per-tool settings below: 16 of those 68 are set to come
           * to you first and run anyway. It is the level every agent sits on,
           * which `resolveApprovalMode` composes with each tool's mode before
           * the loop runs anything.
           *
           * A FACT HERE, A CONTROL ON THE ROSTER. The dial belongs to the agent, and
           * two editors of one setting is the defect A-006 §2 spent a phase
           * removing from this very panel. So this states it and opens the
           * door.
           */}
          {standing.said ? (
            <Region
              title="Where your crew stands"
              sub="One level per agent, and it decides every setting below before the loop reads it."
            >
              <Line label={standing.said}>
                {/* THE ROSTER IS THE OTHER HALF OF THIS PAGE (fifth review,
                    2026-09-09). This pane moved from Settings to Team, so a
                    door reading "Change it on Crew" both used the rail's
                    retired word and lit as current beside the row it was
                    standing on. It names the dial's own home and clears the
                    tab; `includeSearch` stops it announcing itself current
                    from the boundary tab of the same route. */}
                <Link
                  to="/crew"
                  search={{}}
                  activeOptions={{ includeSearch: true }}
                  className="text-mrd-small underline underline-offset-4"
                >
                  Change it per agent
                </Link>
              </Line>
            </Region>
          ) : null}

          {receipt ? (
            <Receipt
              verb={receipt.verb}
              consequence={receipt.consequence}
              failed={receipt.failed}
            />
          ) : null}

          {/* THE QUEUE EATING ITSELF: an agent asking for more room is the one
              thing worth deciding on a surface about what agents may do alone.
              It leads here exactly as it led on /boundary. */}
          <TrustGraduationsBlock />

          {/*
           * HOW THE THREE BUCKETS BELOW WERE DECIDED, IN THE SENTENCE A PERSON
           * SAYS OUT LOUD. `SPEC-AI-NATIVE-SDLC.md` §3 F, owner S3.
           *
           * THE SPEC ASKED FOR SOMETHING WE DO NOT HAVE, AND THIS IS THE HONEST
           * FOLD RATHER THAN THE LITERAL ONE. It says to explain the ladder "by
           * environment", after Anthropic's: dev deploys freely, staging is
           * intermediate, production is gated on a named approval. **Ours has no
           * environment axis.** Traced 2026-08-31: `axisDefault`
           * (`src/lib/ai/approval-policy.ts:158`) decides on exactly two things,
           * `toolConsequence(tool).reversible` and `isExternalTool(tool)`. The
           * word "production" appears nowhere in it.
           *
           * SO WHY THE PRODUCTION SENTENCE BELOW IS STILL TRUE. `opsImpact` is a
           * real, live axis, it just is not this one: `assessTool`
           * (`tool-consequences.ts:1537`) scores five axes and takes the MAXIMUM,
           * and `OPS_SCORE.production` is 2, the top. So a deploy is treated as
           * the most consequential kind of act. It lands there because it cannot
           * be undone from inside the product and customers see it -- which is
           * `ship.deploy`'s own recorded effect -- and not because of the word.
           * That distinction is the whole point of saying it here: a customer
           * who believes we gate on the environment NAME will expect a staging
           * deploy to be waved through, and it is not the name we read.
           *
           * ONE EXPLANATION OF THE EXISTING LADDER, NEVER A SECOND LADDER, which
           * §3 F is explicit about and this repo has already paid for twice. No
           * new control, no new state, no new bucket: this Region renders two
           * static sentences describing the rule the three Regions beneath it
           * already obey. `trust-ramp.ts` stays the only thing that promotes.
           *
           * NOT A THIRD VOICE ON THE PER-TOOL REASON. `axisDefault` writes a
           * sentence per tool and "What your answers changed" renders it
           * verbatim, deliberately. This says the RULE once, at the top; it does
           * not restate any tool's own reason, because two wordings for one
           * decision is the defect that pattern exists to avoid.
           */}
          <Region
            title="How these three were decided"
            sub="Two questions about the act itself, asked before your crew's level is read at all. Nothing here is about who is asking or how well it has done."
          >
            <Line
              label="Can it be undone from inside the product"
              sub="If it cannot, a person signs off every time and no track record changes that. If undoing it only half works, it stays gated until you have watched it enough times to let it run."
            />
            <Line
              label="Does it leave your workspace"
              sub="Anything reaching a system outside it is gated even when it can be undone, because the thing it touched is not ours to put back."
            />
            <Line
              label="A deploy is the strictest case, and not because of the word"
              sub="Shipping to where customers see it cannot be undone from in here, so it sits at the top of both questions at once. We do not read the environment's name, so a staging deploy is not waved through for being called staging."
            />
          </Region>

          {block(
            "alone",
            "What they do alone",
            [
              "No approval, no interruption. This is where the leverage is.",
              did.said
                ? did.tool
                  ? `${did.said} The most recent was ${did.tool}.`
                  : did.said
                : null,
              looserThanSet.length > 0
                ? `${looserThanSet.length} of these ${looserThanSet.length === 1 ? "is" : "are"} set to come to you first and will not, because every agent starts out running alone except on the risky calls. You can lower that per agent.`
                : null,
            ]
              .filter(Boolean)
              .join(" "),
            alone,
            "Nothing runs without you yet. Every one of these is a person in the loop.",
          )}

          {block(
            "asks",
            "What still comes to you",
            "Each of these costs one interruption every time it happens.",
            asks,
            "Nothing asks. Your crew runs the loop on its own.",
            /* The whole history first, because it carries the denominator, then
               the named tools from the capped read. One says how often a gate
               dies here; the other says which ones. */
            [
              ...(gateHistory ? [{ label: gateHistory }] : []),
              ...(unanswered.said
                ? [{ label: unanswered.said, sub: unanswered.act ?? undefined }]
                : []),
            ],
          )}

          {block(
            "never",
            "What nobody may do",
            "Off for agents and for people. Turning one back on is a decision on the record.",
            data.never,
            "Nothing is switched off.",
          )}

          {/*
           * WHAT COUNTS AS DONE (gap #18, `SPEC-AI-NATIVE-SDLC.md` §3 E).
           *
           * THE QUESTION THIS PAGE WAS MISSING. Everything above answers what the
           * teammates may DO. **Nothing anywhere answered what counts as DONE**,
           * and that is the question a company actually argues about. Anthropic's
           * playbook has the customer's tech lead write it: the review passes, the
           * severity definitions, the exclusions. Ours are chosen by us, and until
           * this Region existed we had never said so out loud.
           *
           * ONE SECTION HERE, NOT A DESTINATION, which §3 E is explicit about. A
           * page for it would be the eleventh settings page §J4 exists to prevent.
           *
           * NAMES IMPORTED, NEVER RETYPED. `CHECK_NAMES` is the same list
           * `defaultChecks()` builds the runner's spec from, lifted into a pure
           * module for exactly this by S0 so a component can read it without
           * dragging server code into the bundle. Typing "typecheck, test, lint"
           * here instead would be the one-idea-two-vocabularies defect, and the
           * second copy is always the one that goes stale silently.
           *
           * WHAT IT MAY NOT CLAIM, AND THIS IS F-148. It says what gets RUN. It
           * does NOT say the run is enforced: `studio.checks.run` is implemented
           * and briefed, and the Build-to-Ship advance is not yet refused on a red
           * verdict. `check-names.ts` states that limit in its own header and this
           * copy obeys it. Naming the three honestly is worth shipping now;
           * claiming they block a release is not, and would be the same class of
           * overclaim as the notifications page in U-S3-021.
           *
           * NO EDITOR YET, AND THE ABSENCE IS STATED RATHER THAN IMPLIED. Letting
           * the customer WRITE this is gap #18 proper and needs storage. Until
           * then the fourth floor's rule applies exactly as it does to every
           * number above: a default the customer never set is our choice, and the
           * surface says so in our own voice instead of presenting it as theirs.
           */}
          <Region
            title="What counts as done"
            sub="Before your crew opens a pull request it runs these, in this order. We chose them, not you, and there is nowhere yet to change them."
          >
            {CHECK_NAMES.map((c) => (
              <Line key={c.name} label={c.says} />
            ))}
            <Line
              label="This is what gets run, not a gate that blocks a release"
              sub="A red result is on the record and reviewable, and nothing today refuses the step to Ship because of one. Treat these as what your crew checks, not as a bar it has to clear."
            />
          </Region>

          {/* WHY A TOOL WENT QUIET, and it is the half that makes the policy
              safe to bind. Refuse the same request enough times and
              `resolveApprovalPolicy` switches that tool off rather than asking
              an eighth time. That is correct, and it is also an invisible state
              change until something says it out loud, which is why S0 shipped
              the reader and held the gate wiring back for this surface (A-004).
              The policy's own sentence is rendered VERBATIM: it is written for
              the person the gate would have interrupted, and rewording it here
              would put a second voice on one decision. */}
          <Region
            title="What your answers changed"
            sub="Turn the same request down every time and the crew stops asking. Anything that went quiet says so here, with the count behind it."
          >
            {policy.isLoading ? (
              <Reading>Reading what your answers changed.</Reading>
            ) : policy.isError ? (
              <ReadFailedLine error={policy.error} onRetry={() => void policy.refetch()}>
                {humanWriteError(
                  policy.error,
                  "That did not come back, so this is not a claim that nothing changed.",
                )}
              </ReadFailedLine>
            ) : changedByAnswers.length === 0 ? (
              <NothingHere>
                Nothing has gone quiet. Every tool is doing what the settings above say, and one you
                turn down three times running will appear here naming itself.
              </NothingHere>
            ) : (
              changedByAnswers.map((t) => (
                <Row
                  key={t.tool}
                  tight
                  lead={toolLabel(t.tool)}
                  sub={t.reason}
                  action={
                    <Value>
                      <Num>{t.rejected}</Num> turned down, <Num>{t.approved}</Num> approved
                    </Value>
                  }
                />
              ))
            )}
          </Region>

          {/*
           * THE CEILING, AND THE KILL SWITCH, DRAWN FOR EVERYONE.
           *
           * This whole region was inside `data.isOwner`, so a member saw
           * NOTHING: not the ceiling, not the track cap, and not whether agents
           * are currently running. That last one is the most important fact on
           * the page, and a member could not tell.
           *
           * It also fails the safe reading. R-22 says an unset ceiling is the
           * default and never "unlimited", and absent values resolve to the
           * SAFE reading -- but a member shown no ceiling at all concludes
           * there is no limit, which is the unsafe reading arrived at by
           * omission rather than by a claim.
           *
           * `getBoundary` already returns capUsd, trackCapUsd, paused and the
           * caller's `role` to everyone, with a comment on `role` saying it is
           * there "so the surface can say why a control is absent". The reader
           * was built for this and the surface never used it.
           *
           * So the facts are shown to everyone and only the CONTROLS are
           * gated, with a line naming who may move them. Seeing the boundary is
           * the question this page exists to answer; changing it is a
           * privilege.
           */}
          <Region
            title="The ceiling"
            sub="What the work may spend before it stops, whatever else it is allowed to do, and what it has actually been costing."
          >
            {/*
             * "DOLLARS ONE RUN MAY SPEND" NAMED THE WRONG SCOPE, and it named
             * it smaller than the truth.
             *
             * The gate is `mission_cap_state`, which compares this ceiling to
             * the SUM of `spend_used_usd` across every run sharing a
             * `mission_id`, falling back to the single run only when there is
             * no mission (runtime.server.ts:269). The RPC's own comment records
             * why: the column "was a per-run ceiling wearing a mission name",
             * so a ten hop goal got ten separate ceilings and could spend ten
             * times the number on screen with every check passing. That was
             * fixed in the engine. The label was not, so the screen still
             * promises a per-step brake for a whole-goal one.
             *
             * "Goal" and not "mission": ControlsPanel already tells a person
             * the first run "starts when you give the crew a goal", and §12
             * forbids putting a third noun on one object.
             *
             * The second sentence is what the founder asked this screen for --
             * what you expected beside what actually happened. It is measured
             * per RUN and says "runs", because these rows carry no mission id
             * to sum by; see ceiling-reality.ts on why understating is the safe
             * direction for an amount spent.
             */}
            <Line
              label="Dollars one goal may spend"
              sub={
                <>
                  {data.capUsd === null ? (
                    "No ceiling. A goal continues until it finishes or something else stops it."
                  ) : (
                    <>
                      <Num>${data.capUsd.toFixed(2)}</Num>, counted across every agent the goal is
                      handed to rather than per step. Work that reaches it halts and says so, and
                      the halt is on the record.
                    </>
                  )}
                  {spent.said ? <span className="mt-1 block">{spent.said}</span> : null}
                </>
              }
            >
              {!data.isOwner ? (
                <Value>{data.capUsd === null ? "not set" : `$${data.capUsd.toFixed(2)}`}</Value>
              ) : (
                <Input
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={data.capUsd ?? undefined}
                  aria-label="Dollars one goal may spend before it stops"
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
              )}
            </Line>
            {/* THE ONE THAT ACTUALLY BOUNDS UNATTENDED SPEND: the ceiling on
                  the whole piece of work, across every station and retry. */}
            <Line
              label="Dollars one piece of work may spend"
              sub={
                <>
                  {data.trackCapUsd === null ? (
                    "No ceiling. Work continues through every station until it finishes."
                  ) : (
                    <>
                      <Num>${data.trackCapUsd.toFixed(2)}</Num> across every station, every agent
                      and every retry. Work that reaches it stops and waits, and raising this
                      carries on from where it stopped.
                    </>
                  )}
                  {/* The other half, which this line went without in U-088
                      because no reader returned per-track spend. It says
                      nothing about STOPPING: `spine_tracks` has no halt column,
                      so the run line's "none of them stopped here" would be a
                      claim out of a field that does not exist here. */}
                  {trackSpent.said ? <span className="mt-1 block">{trackSpent.said}</span> : null}
                </>
              }
            >
              {!data.isOwner ? (
                <Value>
                  {data.trackCapUsd === null ? "not set" : `$${data.trackCapUsd.toFixed(2)}`}
                </Value>
              ) : (
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
              )}
            </Line>
            {/*
             * THE SWITCH ITSELF, not a line reporting one set elsewhere.
             *
             * It reads `data.paused` from the SAME `getBoundary` read as
             * every other row in this panel, so the control and the state it
             * shows cannot drift apart -- which is precisely what could
             * happen while a second editor lived on another panel.
             *
             * Drawn whatever the state, because "nothing is stopped" is a
             * fact a person came here to confirm, and a switch that appears
             * only once it is thrown is a switch nobody can find in advance.
             */}
            <Line
              label="Agents may run"
              sub={
                data.paused
                  ? "A kill switch is on for this workspace, so nothing runs whatever the boundary says."
                  : "Turn this off and every agent holds mid-step. Nothing is lost."
              }
            >
              {data.isOwner ? (
                <Toggle
                  checked={!data.paused}
                  disabled={setPause.isPending}
                  label="Agents may run"
                  onChange={() => setPause.mutate(!data.paused)}
                />
              ) : (
                <Value tone={data.paused ? "fail" : undefined}>
                  {data.paused ? "Paused" : "Running"}
                </Value>
              )}
            </Line>
            {data.isOwner ? (
              <Field
                label={data.paused ? "Why you are resuming" : "Why you are pausing"}
                htmlFor="boundary-pause-reason"
              >
                <Input
                  id="boundary-pause-reason"
                  value={pauseReason}
                  onChange={(e) => setPauseReason(e.target.value)}
                  disabled={setPause.isPending}
                  placeholder="Optional. It lands in the audit trail."
                />
              </Field>
            ) : (
              /* WHY THE CONTROLS ARE ABSENT, said rather than left to be
                   inferred. `role` arrives from getBoundary for exactly this. */
              <Line
                label="Who can move these"
                sub={`An owner or an admin. You are a ${data.role ?? "member"} in this workspace, so you can see the boundary and not change it.`}
              />
            )}
          </Region>

          {/* THE TWO BARS THE PLATFORM CROSSES ON ITS OWN. Both were constants
              nobody could see; the canon's fourth floor says a default the user
              never set must be visible and changeable.
     *
     * VISIBLE TO EVERYONE, CHANGEABLE BY AN OWNER. This block was inside
     * `data.isOwner`, so a member could not see what starts without them --
     * which is the single thing on this page a member most needs to know,
     * since it is the work that begins with nobody clicking. The canon line
     * directly above says a default the user never set must be VISIBLE and
     * changeable, and hiding it from most of the workspace failed the first
     * half of its own rule.
     *
     * The fields render for everyone and disable for anyone who cannot write,
     * which is this codebase's house pattern for a control you may not use
     * (AccountConnectionsSection dims a connector nobody can connect). A
     * disabled field still shows the number, which is the point. The line
     * below names who may move it. */}
          <Region
            title="What starts without you"
            sub="A cluster of evidence becomes a piece of work on its own when it clears all three. Nobody clicks, and the work begins spending against the ceiling above. Clear a field to hand it back to us."
          >
            {/*
             * ── THE BAR IN ONE SENTENCE, WITH THIS WORKSPACE'S OWN NUMBERS ──
             *
             * The three fields below each carry their own number and their own
             * argument, which is right for changing one. It is the wrong shape
             * for the question a person actually arrives with: *"when various
             * signals are queued, bucketed and themed, how do I decide which one
             * to hack on?"* (founder, 2026-09-02). Half of that answer is the
             * pin on the run list; the other half is knowing where the line IS,
             * and the line was only readable by adding three fields together.
             *
             * Composed from `autonomy`, which is the resolved policy the sweep
             * itself runs on -- not `SHIPPED_AUTONOMY_POLICY` -- so a workspace
             * that moved a floor reads its own number here. A sentence quoting
             * the default at a workspace that changed it would be the kind of
             * number that looks measured and is not.
             */}
            <p className="mrd-meta">
              {`Runs open on their own when a cluster is seen ${autonomy.minFrequency} ${
                autonomy.minFrequency === 1 ? "time" : "times"
              }, at severity ${autonomy.minSeverity} or worse, with the grouping ${pct(
                autonomy.minConfidence,
              )}% sure. Nothing below that line starts itself.`}
            </p>

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
                disabled={setAutonomy.isPending || !data.isOwner}
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
                disabled={setAutonomy.isPending || !data.isOwner}
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
                disabled={setAutonomy.isPending || !data.isOwner}
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
          </Region>

          <Region
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
                disabled={setAutonomy.isPending || !data.isOwner}
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
                disabled={setAutonomy.isPending || !data.isOwner}
                onCommit={(next) =>
                  setAutonomy.mutate({
                    field: "settleStakesSpan",
                    next: next === null ? null : next / 100,
                  })
                }
              />
            </Line>

            {/* THE CARVE-OUT IS SAID OUT LOUD: a threshold is an argument
                    about evidence; this is a sentence about what an agent may
                    never be the one to decide. It only ever takes a call back. */}
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
                value={autonomy.neverSettleAboveImpact}
                bounds={AUTONOMY_BOUNDS.neverSettleAboveImpact}
                step={1}
                disabled={setAutonomy.isPending || !data.isOwner}
                onCommit={(next) => setAutonomy.mutate({ field: "neverSettleAboveImpact", next })}
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
          </Region>

          <DeclinedLedger
            q={ledger}
            open={showAll.ledger ?? false}
            onToggle={() => setShowAll((s) => ({ ...s, ledger: !(s.ledger ?? false) }))}
          />
        </>
      )}
    </div>
  );
}
