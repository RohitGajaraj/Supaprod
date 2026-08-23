/**
 * APPROVALS. The Engine Room's copy of the queue: an agent has stopped mid run
 * and cannot go on until a person rules on one tool call.
 *
 * PORTED 2026-07-29 onto src/components/shell/primitives.tsx, and reshaped to
 * match `src/routes/_authenticated.approvals.tsx`, which is the same queue
 * viewed from the front of the product. Two surfaces onto one queue must not
 * say it two different ways.
 *
 * WHAT IT WAS. Twenty `bento` cards stacked, each carrying its own border, its
 * own risk chip, its own args `<pre>`, and its own approve/reject/extend row.
 * That is twenty primary actions on one screen and nothing to look at first,
 * and it is the exact defect the approvals route killed:
 *
 *   "Why do we need so bigger things to display? If a user wants to know, he
 *    will click deeper."
 *
 * WHAT IT IS NOW. One Gate plus a list. The soonest-to-expire pending call is
 * the Gate, the biggest thing on the surface, with one primary action. Every
 * other pending call, and the whole resolved history, is a one-line Row that
 * never wraps. Clicking a row makes it the Gate. The end of the queue is
 * visible from the start rather than being a scroll that never resolves.
 *
 * THE COMMIT (agents/FINAL-agent-presence.md R10, which named this file).
 * Approving used to fire `toast.success("Approved · <tool> ran.")` and the card
 * vanished. A toast confirms that your click REGISTERED; a receipt renders what
 * your click CAUSED. An approval that erases itself teaches you that your
 * judgment left no trace, and judgment is the product. Every success toast here
 * is now a `Receipt` carrying the real per-item consequence. A FAILED write
 * still writes a receipt, marked failed, because never showing a success shape
 * over a failed write is the one thing that makes the successful ones
 * trustworthy.
 *
 * ONE CORRECTNESS FIX, not styling. "Approve all low risk" looped and threw on
 * the first error, so a batch that approved two of five reported only the
 * error and the two that ran were invisible. It now decides each one
 * independently and reports both halves, which is what the test file has been
 * documenting as a known gap.
 *
 * NO GLOBAL KEY HANDLER. The approvals ROUTE owns j/k/a/r because it owns the
 * whole screen. This panel is mounted inside the Engine Room, which owns its
 * own keyboard, so binding bare letters here would steal them from the room.
 * Focus moves by click.
 */
import * as React from "react";
import { Row } from "@/components/meridian/rows";
import {
  Action,
  Actions,
  Approve,
  NothingHere,
  Num,
  ReadFailed,
  Reading,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { toast } from "@/lib/notify";
import { decideApproval } from "@/lib/agent_loop.functions";
import { listGovernApprovals, extendApprovalTtl } from "@/lib/governance.functions";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  formatTrackRecord,
  type AgentTrackRecord,
  formatOutcomeRecord,
  type AgentOutcomeRecord,
} from "@/lib/agent-track-record";
import { rejectionCountFor } from "@/lib/rejection-learning";
import { Receipt } from "@/components/meridian/Receipt";
import { Gate, Pre } from "@/components/shell/primitives";
import { AgentMark } from "@/components/meridian/marks";
import { TrustGraduationsBlock } from "./TrustGraduations";
import {
  relExpiry,
  fmtMedian,
  RESOLVED_LINE,
  RISK_NOTE,
  toneForRisk,
  type GovTone,
} from "./governance-shared";

/**
 * `governance-shared.ts` still speaks the RETIRED tone vocabulary, and it is
 * pinned there by its own test suite, so the translation happens here rather
 * than by widening Meridian's five words back out to six.
 *
 * `warn` becomes `hold` and nothing else moves. Every caller of `toneForRisk`
 * means "waiting on a condition" -- a medium-risk call reaches outside and can
 * still be walked back -- which is what Meridian's amber says. Orchid would be
 * the reflex and it is wrong: it means A PERSON IS REQUIRED, and `Value` has
 * no `you` tone for exactly that reason.
 */
const MRD_TONE: Record<GovTone, "quiet" | "pass" | "fail" | "hold"> = {
  quiet: "quiet",
  pass: "pass",
  warn: "hold",
  fail: "fail",
};

type GovernApproval = Awaited<ReturnType<typeof listGovernApprovals>>["approvals"][number];

/** The risk word, in the words a person would use. The chip says the level;
 *  `RISK_NOTE` says what it would touch, and they never restate each other. */
const RISK_WORD: Record<string, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

function riskWord(risk: string): string {
  return RISK_WORD[risk] ?? `${risk} risk`;
}

/** A settled call, held for the session. The durable record is the trust
 *  ledger; duplicating it here would be a second source of the same truth. */
type SettledReceipt = {
  key: string;
  verb: string;
  consequence: React.ReactNode;
  at: string;
  failed?: boolean;
};

function clockNow(): string {
  return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function ApprovalsPanel() {
  const fList = useServerFn(listGovernApprovals);
  const fDecide = useServerFn(decideApproval);
  const fExtend = useServerFn(extendApprovalTtl);
  const qc = useQueryClient();
  const navigate = useNavigate();

  const q = useQuery({ queryKey: ["govern-approvals"], queryFn: () => fList() });

  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const [receipts, setReceipts] = React.useState<SettledReceipt[]>([]);

  const inv = React.useCallback(() => {
    void qc.invalidateQueries({ queryKey: ["govern-approvals"] });
    void qc.invalidateQueries({ queryKey: ["governance"] });
  }, [qc]);

  const addReceipt = React.useCallback((r: Omit<SettledReceipt, "key" | "at">) => {
    setReceipts((prev) => [{ ...r, key: `${Date.now()}-${prev.length}`, at: clockNow() }, ...prev]);
  }, []);

  const decide = useMutation({
    mutationFn: (v: { approvalId: string; decision: "approve" | "reject"; tool: string }) =>
      fDecide({ data: { approvalId: v.approvalId, decision: v.decision } }),
    onSuccess: (r, v) => {
      // No toast. The receipt IS the confirmation, and it says what the click
      // caused rather than that it registered.
      addReceipt(
        v.decision === "approve"
          ? {
              verb: "You approved",
              consequence: r.executed ? (
                <>{v.tool} ran.</>
              ) : (
                <>{v.tool} is cleared. The agent runs it on its next step.</>
              ),
            }
          : {
              verb: "You declined",
              consequence: <>Nothing ran. The record now shows you said no to {v.tool}.</>,
            },
      );
      inv();
    },
    onError: (e: Error, v) => {
      // A failed write still writes a receipt, and it goes honest immediately.
      addReceipt({
        verb: "Nothing was recorded",
        consequence: (
          <>
            {v.tool} was left where it was. {e.message}
          </>
        ),
        failed: true,
      });
      inv();
    },
  });

  // Each id decided independently, so a batch that half succeeds reports both
  // halves. The old loop threw on the first error and the ones that had already
  // run were invisible.
  const approveAll = useMutation({
    mutationFn: async (items: { id: string; tool: string }[]) => {
      const ran: string[] = [];
      const failed: { tool: string; message: string }[] = [];
      for (const it of items) {
        try {
          await fDecide({ data: { approvalId: it.id, decision: "approve" } });
          ran.push(it.tool);
        } catch (e) {
          failed.push({ tool: it.tool, message: (e as Error).message });
        }
      }
      return { ran, failed };
    },
    onSuccess: ({ ran, failed }) => {
      if (ran.length > 0) {
        addReceipt({
          verb: ran.length === 1 ? "You approved one call" : `You approved ${ran.length} calls`,
          consequence: <>{ran.join(", ")} ran.</>,
        });
      }
      if (failed.length > 0) {
        addReceipt({
          verb: failed.length === 1 ? "One was not recorded" : `${failed.length} were not recorded`,
          consequence: <>{failed.map((f) => `${f.tool}: ${f.message}`).join(". ")}</>,
          failed: true,
        });
      }
      inv();
    },
    onError: (e: Error) => {
      addReceipt({
        verb: "Nothing was recorded",
        consequence: e.message,
        failed: true,
      });
      inv();
    },
  });

  const extend = useMutation({
    mutationFn: (v: { approvalId: string; tool: string }) =>
      fExtend({ data: { approvalId: v.approvalId, additionalHours: 24 } }),
    onSuccess: (_r, v) => {
      addReceipt({
        verb: "You put it back on the clock",
        consequence: <>{v.tool} has 24 more hours before it expires on its own.</>,
      });
      inv();
    },
    // An extension is not a judgment, so a failure here is a plain error rather
    // than a receipt about a decision nobody made.
    onError: (e: Error) => toast.error(e.message),
  });

  const all = React.useMemo(() => q.data?.approvals ?? [], [q.data]);
  const pending = React.useMemo(
    () =>
      all
        .filter((a) => a.status === "pending")
        .sort((x, y) => (x.expires_at ?? "9999").localeCompare(y.expires_at ?? "9999")),
    [all],
  );
  const resolved = React.useMemo(() => all.filter((a) => a.status !== "pending"), [all]);
  const lowRisk = React.useMemo(() => pending.filter((a) => a.risk === "low"), [pending]);

  // The queue is worked soonest-to-expire first, and that one is the Gate until
  // you pick another. A focused id that has since been settled falls back.
  const focused = React.useMemo(
    () => pending.find((a) => a.id === focusedId) ?? pending[0] ?? null,
    [pending, focusedId],
  );
  const behind = React.useMemo(
    () => pending.filter((a) => a.id !== focused?.id),
    [pending, focused],
  );

  const median = q.data?.medianResponseMs;

  if (q.isError) {
    return (
      <ReadFailed onRetry={() => void q.refetch()}>
        The queue did not load, so nothing here is the real count.
      </ReadFailed>
    );
  }

  if (q.isLoading) {
    return <Reading>Reading the queue.</Reading>;
  }

  return (
    <>
      {focused ? (
        <FocusedCall
          a={focused}
          track={q.data?.trackByAgent?.[focused.agent_slug ?? ""] ?? null}
          outcome={q.data?.outcomeByAgent?.[focused.agent_slug ?? ""] ?? null}
          declines={rejectionCountFor(
            q.data?.rejectionsByKey,
            focused.agent_slug,
            focused.tool_name,
          )}
          busy={decide.isPending}
          extending={extend.isPending}
          onApprove={() =>
            decide.mutate({
              approvalId: focused.id,
              decision: "approve",
              tool: focused.tool_name,
            })
          }
          onReject={() =>
            decide.mutate({
              approvalId: focused.id,
              decision: "reject",
              tool: focused.tool_name,
            })
          }
          onExtend={() => extend.mutate({ approvalId: focused.id, tool: focused.tool_name })}
          onOpenMission={
            focused.mission_id
              ? () =>
                  void navigate({
                    to: "/build/$missionId",
                    params: { missionId: focused.mission_id as string },
                  })
              : undefined
          }
        />
      ) : (
        <NothingHere>
          Nothing is waiting on you. The agents are running inside their lanes, and when one needs a
          decision to run a tool it lands here, soonest to expire on top.
        </NothingHere>
      )}

      {/* A graduation is a policy change with no clock on it; a tool approval is
          an agent stopped mid run. So the tool call leads whenever there is one,
          and the proposals fall back to rows behind it. Two gates at once would
          be two primary actions and neither would be the one thing asking. */}
      <TrustGraduationsBlock lead={!focused} />

      {receipts.length > 0 ? (
        <Region title="What you settled">
          {receipts.map((r) => (
            <Receipt
              key={r.key}
              verb={r.verb}
              consequence={r.consequence}
              time={r.at}
              failed={r.failed}
            />
          ))}
        </Region>
      ) : null}

      {behind.length > 0 ? (
        <Region
          title="Waiting behind it"
          sub={
            <>
              {/* `behind`, not `pending`. This counted `pending`, which INCLUDES
                  the call already drawn as the Gate above, so four pending calls
                  read as one Gate, three rows, and the words "4 waiting". The
                  same queue seen from Settings > Controls subtracts the Gate
                  before it counts, so the two views of one queue disagreed about
                  how many calls were outstanding. A count under a heading counts
                  the thing the heading names. */}
              <Num>{behind.length}</Num> waiting
              {median != null ? (
                <>
                  , and you usually answer in <Num>{fmtMedian(median)}</Num>
                </>
              ) : null}
              . Open one to make it the call in front of you.
            </>
          }
          /* `act`, not `toggle` or `goTo`: this settles calls. It reveals
             nothing about this region and it leaves for nowhere, so an
             `aria-expanded` here would announce a state that does not exist.
             `acting` is the half the retired `more` could not say -- the batch
             takes a round trip per call, and without it a second press starts a
             second batch over the same queue. */
          act={lowRisk.length > 1 ? `Approve the ${lowRisk.length} low risk ones` : undefined}
          onAct={
            lowRisk.length > 1
              ? () => approveAll.mutate(lowRisk.map((a) => ({ id: a.id, tool: a.tool_name })))
              : undefined
          }
          acting={approveAll.isPending}
        >
          {behind.map((a) => (
            <Row
              key={a.id}
              marks={<AgentMark slug={a.agent_slug} state="waiting" />}
              lead={
                <>
                  {agentDisplayName(a.agent_slug)} wants to run {a.tool_name}.
                </>
              }
              sub={
                <>
                  {riskWord(a.risk)}
                  {a.mission_title ? <>, in {a.mission_title}</> : null}
                </>
              }
              time={relExpiry(a.expires_at)?.text ?? null}
              tight
              onClick={() => setFocusedId(a.id)}
            />
          ))}
        </Region>
      ) : null}

      {resolved.length > 0 ? (
        <Region title="Already settled" sub="The last 50 calls this account decided, newest first.">
          {resolved.map((a) => {
            const line = RESOLVED_LINE[a.status];
            return (
              <Row
                key={a.id}
                marks={<AgentMark slug={a.agent_slug} state="quiet" />}
                lead={
                  <>
                    {agentDisplayName(a.agent_slug)} and {a.tool_name}
                  </>
                }
                sub={
                  line ? (
                    <Value tone={MRD_TONE[line.tone]}>{line.text}</Value>
                  ) : (
                    <Value tone="quiet">{a.status}</Value>
                  )
                }
                tight
              />
            );
          })}
        </Region>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * The one call in front of you
 * ------------------------------------------------------------------ */

function FocusedCall({
  a,
  track,
  outcome,
  declines,
  busy,
  extending,
  onApprove,
  onReject,
  onExtend,
  onOpenMission,
}: {
  a: GovernApproval;
  track: AgentTrackRecord | null;
  outcome: AgentOutcomeRecord | null;
  declines: number;
  busy: boolean;
  extending: boolean;
  onApprove: () => void;
  onReject: () => void;
  onExtend: () => void;
  onOpenMission?: () => void;
}) {
  const name = agentDisplayName(a.agent_slug);
  const trackLabel = formatTrackRecord(track);
  const outcomeLabel = formatOutcomeRecord(outcome);
  const expiry = relExpiry(a.expires_at);

  // One fact per line, and never four ways of saying one. Each entry below is a
  // different thing the person needs before they can rule.
  const lines: React.ReactNode[] = [];
  if (a.rationale) lines.push(<span key="why">{a.rationale}</span>);
  lines.push(
    <span key="risk">
      <Value tone={MRD_TONE[toneForRisk(a.risk)]}>{riskWord(a.risk)}</Value>
      {". "}
      {RISK_NOTE[a.risk] ?? "How far this reaches is not recorded."}
    </span>,
  );
  if (a.mission_title) lines.push(<span key="mission">It is part of {a.mission_title}.</span>);
  if (trackLabel || outcomeLabel) {
    lines.push(
      <span key="record">
        Its record with you: {trackLabel ?? "no decided calls yet"}
        {outcomeLabel ? `, and ${outcomeLabel} turned out right` : ""}.
      </span>,
    );
  }
  if (declines > 0) {
    lines.push(
      <span key="declines">
        You have said no to this pairing <Num>{declines}</Num> times before.
      </span>,
    );
  }
  if (expiry) {
    lines.push(
      <span key="expiry">
        {expiry.expired
          ? `It ${expiry.text}, so nothing runs until you decide or put it back on the clock.`
          : `It ${expiry.text}.`}
      </span>,
    );
  }
  if (a.error) lines.push(<span key="error">The last attempt errored: {a.error}</span>);

  return (
    <>
      <Gate question={`Let ${name} run ${a.tool_name}?`} lines={lines}>
        <Approve busy={busy} onClick={onApprove}>
          Approve, and it runs
        </Approve>
        <Action busy={busy} onClick={onReject}>
          Decline, and nothing runs
        </Action>
      </Gate>

      <Actions
        trailing={
          <Action variant="quiet" busy={extending} onClick={onExtend}>
            Give it 24 more hours
          </Action>
        }
      >
        {onOpenMission ? (
          <Action variant="quiet" onClick={onOpenMission}>
            Open the mission
          </Action>
        ) : null}
      </Actions>

      {/* The exact payload. One click away rather than on the surface: it is
          what an engineer opens to check the call, and it is never what a
          product lead reads to make it. */}
      <details>
        <summary className="sp-block-more">The exact payload</summary>
        <Pre>{JSON.stringify(a.args, null, 2)}</Pre>
      </details>
    </>
  );
}
