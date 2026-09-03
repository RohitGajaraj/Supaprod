/**
 * THE QUESTION, ASKED WHERE THE WORK IS.
 *
 * Item 1 of the build queue, per SPEC-CONSENT.md. The measured defect it
 * exists to end: 90 approval requests raised into /approvals since July --
 * 42 cancelled, 38 expired, 10 pending, ZERO ever approved (R-04). A question
 * that has to be found does not get answered. This card renders a run's own
 * pending gates INSIDE the run, at `spine_tracks.pending_gates` -- the one edge
 * that exists; `agent_approvals` has no track back-reference and every other
 * join is the time-window guess this repo rejected twice by name.
 *
 * EVERY SENTENCE IS DERIVED (SPEC-CONSENT §2.2). The question comes from
 * `gateHeadline`, the consequence from `toolConsequence`, "what decides the
 * risk" from `assessTool`, "if you do nothing" from `expiryNote`, and the age
 * from `stoppedFor`. No tool name renders anywhere (§2.4) and no sentence on
 * this card describes a tool in our own words.
 *
 * ANSWERING RESUMES THE RUN (§4.2) or the card is the /approvals queue with
 * better typography. On a settle that releases the run the parent's drive
 * mutation fires -- sequentially, after the decide resolves, because
 * `harvestAnsweredGates` must read stamped rows. A gate that came back
 * `approved` but not yet `executed` does NOT resume: the driver would hold
 * again at the same gate and burn a seat saying so.
 */
import * as React from "react";
import { failureLine } from "@/lib/error-copy";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import {
  decideTrackGate,
  decideTrackGateClass,
  getTrackGates,
  type TrackGate,
} from "@/lib/spine/track.functions";
import { snoozeApprovalItem } from "@/lib/approvals-queue.functions";
import {
  AGENT_STATIONS,
  agentDisplayName,
  castByStation,
  type AgentStation,
} from "@/lib/agent-vocabulary";
import {
  assessTool,
  gateHeadline,
  REVERSIBILITY_LABEL,
  toolConsequence,
} from "@/lib/tool-consequences";
import { expiryDefaultFor, expiryNote } from "@/lib/ai/approval-expiry";
import { isOverdue, stoppedFor } from "@/components/meridian/stopped-for";
import { formatExpiryDeadline } from "@/components/track/expiry-deadline";
import { Action, ReadFailedLine, RecordSpeaks } from "@/components/meridian/surface-parts";
import { ReasonField } from "@/components/meridian/forms";

/** Who asked, resolved through the display vocabulary with the roster fallback. */
function whoAsked(g: TrackGate): string {
  const station = AGENT_STATIONS[g.station as AgentStation]?.name ?? g.station;
  const who = g.agentSlug ? agentDisplayName(g.agentSlug) : castByStation(g.station)[0]?.name;
  return who ? `${station} · ${who}` : `${station} · An agent on this run`;
}

/** What settling the call causes, read off the row's ACTUAL status, never the click. */
function settledLine(status: string): string {
  if (status === "executed") return "It ran.";
  if (status === "failed") return "It ran and did not finish.";
  if (status === "approved") return "Answered. The call is still running.";
  return "It will not run.";
}

/** Statuses after which the run may be picked back up (SPEC-CONSENT §4.3). */
function releasesRun(status: string): boolean {
  return status !== "approved" && status !== "pending";
}

/**
 * ── `approvals/CallGate.tsx` RETIRED INTO ITS LAST CALLER (P-53) ─────────
 *
 * CallGate's own shell -- question, risk, facts, declared default, the
 * waiting clock, then the controls -- with `_authenticated.approvals.tsx`'s
 * simpler Approve/Decline/Snooze migrated to `Ask`. TrackConsent's own
 * answer area is not a binary ask: numbered custom buttons, an inline
 * decline-reason field, a class-wide "answer all N" action and a snooze that
 * stays a fourth verb rather than the declared default's own action. None of
 * that fits `Ask`'s fixed question/risk/reason/fallback/answer/decline
 * shape, which has no `children` slot at all (its own header: a children
 * slot "would let the next surface reorder it"). Rather than force it or
 * leave `CallGate` alive for one caller, this is `CallGate`'s exact render,
 * moved here since this is the only place it is still needed. The order and
 * every rule behind it are unchanged -- see the original file's history for
 * why each one exists (P-37, P-51): question, then risk, then the facts,
 * then the declared default, then the waiting clock, then the controls.
 */
export function GateCard({
  question,
  subject,
  since,
  now,
  lines,
  risk,
  declaredDefault,
  consequenceTitle,
  children,
}: {
  question: string;
  subject?: string | null;
  since: number | null;
  now: number;
  lines: string[];
  risk?: string | null;
  declaredDefault?: string | null;
  consequenceTitle?: string;
  children?: React.ReactNode;
}) {
  const overdue = since !== null && isOverdue(since, now);
  return (
    <section
      data-mrd=""
      className="rounded-mrd-pane border border-mrd-line bg-mrd-sheet px-mrd-6 py-mrd-6 shadow-mrd-card"
    >
      <h2 className="text-mrd-h3 leading-mrd-tight font-medium text-mrd-ink">{question}</h2>
      {subject ? <p className="mt-mrd-1 text-mrd-small text-mrd-mute">{subject}</p> : null}

      {risk ? (
        <p className="mt-mrd-4 leading-mrd-prose text-mrd-prose text-mrd-ink">{risk}</p>
      ) : null}

      {lines.length > 0 ? (
        <div className="mt-mrd-4 rounded-mrd-card bg-mrd-sink px-mrd-5 py-mrd-4">
          <ul className="flex flex-col gap-mrd-3">
            {lines.map((line, i) => (
              <li key={i} className="leading-mrd-prose text-mrd-prose text-mrd-body">
                {line}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {declaredDefault ? (
        <p
          title={consequenceTitle}
          className="font-mrd-mono mt-mrd-4 text-mrd-data leading-mrd-prose text-mrd-mute"
        >
          {declaredDefault}
        </p>
      ) : null}

      {since !== null ? (
        <p
          title={new Date(since).toLocaleString()}
          className={`font-mrd-mono mt-mrd-4 text-mrd-data tabular-nums text-mrd-mute ${
            overdue ? "font-semibold" : ""
          }`}
        >
          Waiting on you for {stoppedFor(since, now)}.
        </p>
      ) : (
        <p className="mt-mrd-4 text-mrd-data text-mrd-faint">
          How long this has been waiting is not known.
        </p>
      )}

      {children ? <div className="mt-mrd-5 flex flex-wrap gap-mrd-3">{children}</div> : null}
    </section>
  );
}

export function TrackConsent({
  trackId,
  onAnswered,
}: {
  trackId: string;
  /** Fires the parent's drive mutation AFTER a decide resolves and settles. */
  onAnswered?: () => void;
}) {
  const fGates = useServerFn(getTrackGates);
  const fDecide = useServerFn(decideTrackGate);
  const fDecideClass = useServerFn(decideTrackGateClass);
  const fSnooze = useServerFn(snoozeApprovalItem);
  const qc = useQueryClient();

  const q = useQuery({
    queryKey: ["track-gates", trackId],
    queryFn: () => fGates({ data: { trackId } }),
    // The transcript's cadence exactly, so the question and what the agents did
    // can never be one poll apart (SPEC-CONSENT §1.4).
    refetchInterval: 10_000,
  });

  /** Per-gate flight state, so only the answered row goes busy. */
  const [answeringId, setAnsweringId] = React.useState<string | null>(null);
  /** The gate whose decline field is open. Declining records a reason or nothing. */
  const [decliningId, setDecliningId] = React.useState<string | null>(null);
  /** Whether the reason field currently targets the CLASS rather than the instance. */
  const [declineAll, setDeclineAll] = React.useState(false);
  /**
   * THE CLASS AN ANSWER COVERED, SAID BACK (queue item 1's acceptance). A
   * widening that is stated at press time but never confirmed afterwards reads
   * as an instance answer once the card settles -- and a person who does not
   * know they widened their own policy cannot narrow it again.
   */
  const [answeredClassOf, setAnsweredClassOf] = React.useState<number | null>(null);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["track-gates", trackId] });
    void qc.invalidateQueries({ queryKey: ["track-activity", trackId] });
    void qc.invalidateQueries({ queryKey: ["spine-track-chain"] });
    void qc.invalidateQueries({ queryKey: ["track-artifacts", trackId] });
  };

  const decide = useMutation({
    mutationFn: (input: {
      approvalId: string;
      verdict: "approve" | "reject";
      reason?: string;
      steer?: boolean;
    }) => fDecide({ data: { trackId, ...input } }),
    onSuccess: (res) => {
      setAnsweringId(null);
      setDecliningId(null);
      setDeclineAll(false);
      invalidate();
      // SEQUENTIAL, NOT PARALLEL (SPEC-CONSENT §4.2): harvest reads stamped
      // rows, so the walk starts only after the decide has fully landed AND
      // the status says the run may move. An approved-not-yet-executed row
      // would hold again at the same gate.
      if (onAnswered && releasesRun(res.status)) onAnswered();
    },
    onError: () => setAnsweringId(null),
  });

  const decideClass = useMutation({
    mutationFn: (input: { toolName: string; verdict: "approve" | "reject"; reason?: string }) =>
      fDecideClass({ data: { trackId, ...input } }),
    onSuccess: () => {
      setAnsweringId(null);
      setDecliningId(null);
      setDeclineAll(false);
      // Only a SETTLED class answer gets the echo -- never the click.
      if (classCountRef.current !== null) {
        setAnsweredClassOf(classCountRef.current);
        classCountRef.current = null;
      }
      invalidate();
      if (onAnswered) onAnswered();
    },
    onError: () => {
      setAnsweringId(null);
      classCountRef.current = null;
    },
  });

  /** The reach of the class answer in flight, remembered for the settled echo. */
  const classCountRef = React.useRef<number | null>(null);

  /** Fires the class answer; its reach is echoed only once the server settles. */
  const answerClass = (
    gateId: string,
    toolName: string,
    verdict: "approve" | "reject",
    count: number,
    reason?: string,
  ) => {
    setAnsweringId(gateId);
    classCountRef.current = count;
    decideClass.mutate({ toolName, verdict, reason });
  };

  /*
   * DEFERRAL IS REAL, SO IT HAS A REAL CONTROL (§3.6): there is no dismiss
   * here -- the run is stopped until this is answered, and a close button that
   * leaves the work frozen is the /approvals queue one inch smaller. A snooze
   * writes a row, and the gate STAYS on the card at full weight with its
   * snoozed line, because hiding it would reproduce the original defect one
   * layer down.
   */
  const snooze = useMutation({
    mutationFn: (approvalId: string) =>
      fSnooze({ data: { kind: "tool_call" as const, id: approvalId, hours: 24 } }),
    onSuccess: () => {
      setAnsweringId(null);
      invalidate();
    },
    onError: () => setAnsweringId(null),
  });

  /**
   * FOCUS MOVES HERE THE MOMENT A GATE OPENS (P-16, R-19's keyboard clause).
   *
   * The card above already fixed the SIGHTED version of "rendered nothing when
   * a question arrived" -- `RecordSpeaks` during the read, `aria-live="polite"`
   * on the settled list once it renders. Neither moves a keyboard reader's
   * focus, so a person tabbed away from this pane while a run was walking on
   * its own had no way to discover a question landed short of tabbing back
   * past everything else on the page. `ArtifactPane` already does exactly this
   * for a context change inside its own pane (see its header, D-7.2); this is
   * the same rule for the region whose whole job is "does this run need me".
   *
   * Keyed on a 0-to-something TRANSITION, never on "open.length > 0" directly:
   * this component re-renders every 10s poll while a gate is pending, and
   * yanking focus back here on every poll would fight a person already reading
   * the card or typing a decline reason.
   */
  const consentRef = React.useRef<HTMLDivElement>(null);
  const hadOpenGateRef = React.useRef(false);
  /**
   * THE FIRST GATE'S OWN ANSWER BUTTONS, SCROLLED INTO VIEW ON ARRIVAL
   * (P-36, A-QUEUE.md). The founder opened the tablet track's run specifically
   * to answer PR #4's merge gate and could not find the button: `.focus()`
   * above has always passed `preventScroll: true`, on purpose, for a landing
   * mid-read -- a gate that opens WHILE a person is already reading something
   * else on this pane must not yank their scroll position, which is exactly
   * the P-16 reasoning this effect still carries. But arriving fresh at a page
   * that ALREADY has an open gate is a different case: there is nothing on
   * this pane yet to interrupt, and the whole reason the person is here is to
   * answer it. `hasResolvedOnceRef` tells the two apart -- only the arrival
   * case scrolls, and only far enough to bring the actual buttons into view
   * (`block: "nearest"`, not the card's own top, which can sit well above the
   * fold on a long consequence block).
   *
   * KEYED ON `q.isSuccess`, NOT ON MOUNT. React's own first render happens
   * synchronously, before this query's promise has resolved even once, so a
   * ref meant to mean "arriving" that flips to `false` on that empty first
   * pass has already gone false by the time real data -- and the real
   * transition -- ever arrives. `isSuccess` only turns true once this query
   * has actually answered.
   */
  const hasResolvedOnceRef = React.useRef(false);
  const firstGateActionsRef = React.useRef<HTMLDivElement>(null);
  const openCount = q.data && !q.data.unreadable ? q.data.open.length : 0;
  React.useEffect(() => {
    if (!q.isSuccess) return;
    if (openCount > 0 && !hadOpenGateRef.current) {
      const arrivingAtAnOpenGate = !hasResolvedOnceRef.current;
      consentRef.current?.focus({ preventScroll: true });
      if (arrivingAtAnOpenGate) {
        firstGateActionsRef.current?.scrollIntoView({ block: "nearest" });
      }
    }
    hadOpenGateRef.current = openCount > 0;
    hasResolvedOnceRef.current = true;
  }, [openCount, q.isSuccess]);

  /*
   * ── THE ONE REGION THAT ANSWERS "DOES THIS NEED ME" WAS SILENT (2026-09-01)
   *
   * This returned `null` for the whole first read. On a surface whose entire
   * job is watching a run happen, the card that says "your agent has stopped
   * to ask you something" rendered NOTHING for between about 200ms and the
   * full 10s poll -- and rendered exactly the same nothing when there was
   * genuinely no question. Two opposite facts, one blank space.
   *
   * Every sibling in this pane already knew better: `TrackActivity` says
   * "Reading what happened.", `TrackChain` and `ArtifactPane` both word their
   * wait. This one did not, and it is the highest-stakes of the four, because
   * a person who sees nothing here concludes the run does not need them and
   * leaves.
   *
   * `RecordSpeaks` rather than a bare line, so the wait sits in the same frame
   * the answer will arrive in and the region does not jump when it lands.
   */
  if (q.isLoading || (!q.data && !q.isError)) {
    return <RecordSpeaks>Checking whether this run needs you.</RecordSpeaks>;
  }
  if (q.isError) {
    // FAIL LOUD, NEVER FAIL EMPTY: silence here would tell a person their run
    // needs nothing when nobody could read the table at all (RL0-020).
    return (
      <ReadFailedLine error={q.error}>
        The questions this run is waiting on could not be read, so answer nothing until this clears.
      </ReadFailedLine>
    );
  }

  const { open, settled, unreadable } = q.data;
  if (unreadable) {
    return (
      <ReadFailedLine>
        The questions this run is waiting on could not be read, so answer nothing until this clears.
      </ReadFailedLine>
    );
  }
  if (open.length === 0 && settled.length === 0) return null;

  const now = Date.now();

  return (
    /*
     * QUESTIONS ARRIVE ASYNCHRONOUSLY -- a drive can open a gate while the
     * person watches. A polite region means the arrival is SAID rather than
     * silently appearing; additions only, so settled churn does not chatter.
     */
    <div
      ref={consentRef}
      className="flex flex-col gap-mrd-5"
      aria-live="polite"
      /* -1: a focus TARGET, not a tab stop. The card's own controls are the
         tab stops; this only receives focus programmatically, the instant a
         gate opens, the same contract ArtifactPane's panel uses. */
      tabIndex={-1}
      aria-label={open.length > 0 ? "Your agent has stopped to ask you something" : undefined}
    >
      {open.length === 0 && settled.length > 0 ? (
        <p className="text-mrd-small font-medium text-mrd-body">
          Answered. Picking the work back up.
        </p>
      ) : null}

      {open.map((g, i) => {
        const c = toolConsequence(g.toolName);
        const declared = g.expiryDefault ?? expiryDefaultFor(g.toolName);
        const expiresAtIso = g.expiresAtMs !== null ? new Date(g.expiresAtMs).toISOString() : null;
        // MAIN's ruling (INBOX answer 6): the sentence carries the friendly
        // form; the exact instant rides in the title attribute, where
        // CallGate's own age line already puts it.
        const expiresAtShown = formatExpiryDeadline(g.expiresAtMs);
        const classCount = g.classPendingElsewhere + 1;
        const approveAllAllowed = declared === "proceed";
        const busy = answeringId === g.approvalId;

        return (
          <GateCard
            key={g.approvalId}
            question={gateHeadline(g.toolName)}
            subject={whoAsked(g)}
            since={g.askedAtMs}
            now={now}
            /*
             * ── THE SLOTS, AFTER A1 WALKED THE SERVED BUILD (P-37, 17:12) ──
             *
             * Every one of these was already on the card and three of them were
             * in the wrong place, which is why the order looked wrong on screen
             * while the component's order was right. `consequence` was carrying
             * the DEFAULT sentence, so the thing a person read second was
             * "Cancelled unrun: nobody answered by...", and the actual risk sat
             * in `lines` as a fact among facts.
             *
             * risk               the reversibility and its undo. Second, in
             *                    prose, because it is what changes the answer.
             * lines              why it asks, named as the seat's.
             * declaredDefault    what happens if nobody answers. Mono, last.
             *
             * AND ONE LINE IS GONE. "What decides the risk: it cannot be undone"
             * restates the risk line directly above it in different words, which
             * is the dump this packet is removing: two sentences for one fact
             * teaches a reader to skim both.
             */
            risk={`${REVERSIBILITY_LABEL[c.reversible]} · ${c.undo}`}
            lines={[
              ...(g.rationale ? [`Why it asks: ${g.rationale}`] : []),
              ...(g.snoozedUntilMs !== null
                ? ["You set this aside earlier. The run is still stopped."]
                : []),
            ]}
            declaredDefault={expiryNote(g.toolName, declared, expiresAtShown ?? expiresAtIso)}
            consequenceTitle={expiresAtIso ?? undefined}
          >
            <div
              className="flex w-full flex-col gap-mrd-3"
              // Only the first (oldest, topmost) open gate's own buttons are
              // the scroll target on arrival -- see firstGateActionsRef above.
              ref={i === 0 ? firstGateActionsRef : undefined}
            >
              {/* Two verdicts, drawn PlanGate's way: borderless rows, hover
                  wash, inset ring, mono digit. Each commits on press -- there
                  is no Submit between the choice and the effect (§3.6). */}
              <div role="group" aria-label="Your answer">
                <button
                  type="button"
                  data-mrd=""
                  disabled={busy}
                  /*
                   * NAMED EXPLICITLY (P-16 interim, A1 live 2026-09-02 22:18):
                   * the button reads as "button, button" to a screen reader
                   * without this -- an explicit `aria-label` is guaranteed to
                   * win over whatever computed the two visible child spans
                   * into no name at all, rather than a fix that depends on
                   * fixing content the accessibility tree already had.
                   */
                  aria-label={`Let it run. ${REVERSIBILITY_LABEL[c.reversible]}. ${c.undo}`}
                  onClick={() => {
                    setAnsweringId(g.approvalId);
                    decide.mutate({ approvalId: g.approvalId, verdict: "approve" });
                  }}
                  className="flex w-full items-start gap-mrd-3 rounded-mrd-ctl px-mrd-4 py-mrd-3 text-left transition-colors enabled:hover:bg-mrd-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)] disabled:cursor-default disabled:opacity-45"
                  style={{ transitionDuration: "var(--mrd-d-press)" }}
                >
                  <span
                    aria-hidden
                    className="font-mrd-mono mt-px shrink-0 text-mrd-data tabular-nums text-mrd-faint"
                  >
                    1
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-mrd-small font-medium text-mrd-ink">Let it run</span>
                    <span className="max-w-[62ch] text-mrd-data leading-mrd-prose text-mrd-mute">
                      {`${REVERSIBILITY_LABEL[c.reversible]}. ${c.undo}`}
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  data-mrd=""
                  disabled={busy}
                  aria-label="Don't run it. Nothing runs. It stays on the record, and the agent working this run is told why."
                  onClick={() => {
                    setDeclineAll(false);
                    setDecliningId(decliningId === g.approvalId ? null : g.approvalId);
                  }}
                  className="mt-mrd-2 flex w-full items-start gap-mrd-3 rounded-mrd-ctl px-mrd-4 py-mrd-3 text-left transition-colors enabled:hover:bg-mrd-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)] disabled:cursor-default disabled:opacity-45"
                  style={{ transitionDuration: "var(--mrd-d-press)" }}
                >
                  <span
                    aria-hidden
                    className="font-mrd-mono mt-px shrink-0 text-mrd-data tabular-nums text-mrd-faint"
                  >
                    2
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-mrd-small font-medium text-mrd-ink">Don't run it</span>
                    <span className="max-w-[62ch] text-mrd-data leading-mrd-prose text-mrd-mute">
                      {`Nothing runs. It stays on the record, and the agent working this run is told why.`}
                    </span>
                  </span>
                </button>
              </div>

              {decliningId === g.approvalId ? (
                <ReasonField
                  id={`gate-reason-${g.approvalId}`}
                  label={
                    declineAll ? `Why turn down all ${classCount}?` : "What should it do instead?"
                  }
                  hint={
                    declineAll
                      ? `Recorded beside every one of the ${classCount} calls.`
                      : "It goes to the agent working this run and stays on the record beside this call."
                  }
                  placeholder="Group only the last two weeks, and leave the archived findings out"
                  commitLabel={
                    declineAll
                      ? `Turn down all ${classCount} in this workspace`
                      : "Don't run it, do this instead"
                  }
                  cancelLabel="Back to the answers"
                  busy={busy}
                  onCommit={(reason) => {
                    setAnsweringId(g.approvalId);
                    if (declineAll) {
                      answerClass(g.approvalId, g.toolName ?? "", "reject", classCount, reason);
                    } else {
                      decide.mutate({
                        approvalId: g.approvalId,
                        verdict: "reject",
                        reason,
                        steer: true,
                      });
                    }
                  }}
                  onCancel={() => setDecliningId(null)}
                />
              ) : null}

              {/* THE CLASS, WITH ITS REACH PRINTED ON THE BUTTON (§3.3). A
                  widening that is stated is not a silent one. Approve-all only
                  where silence would already have run each of them; turning the
                  whole class down opens the same reason field above. */}
              {classCount > 1 ? (
                <div className="flex flex-wrap items-center gap-mrd-3 border-t border-mrd-line-soft pt-mrd-3">
                  {approveAllAllowed ? (
                    <Action
                      busy={busy}
                      onClick={() =>
                        answerClass(g.approvalId, g.toolName ?? "", "approve", classCount)
                      }
                    >
                      {`Answer all ${classCount} questions like this one in this workspace`}
                    </Action>
                  ) : null}
                  {!approveAllAllowed ? (
                    <Action
                      variant="quiet"
                      onClick={() => {
                        setDeclineAll(true);
                        setDecliningId(g.approvalId);
                      }}
                    >
                      {`Answer all ${classCount} the same way`}
                    </Action>
                  ) : null}
                </div>
              ) : null}

              {/* Deferral, stated as what it is: aside for a day, run still
                  stopped. Quiet, because it unblocks nothing. */}
              {g.snoozedUntilMs === null ? (
                <div>
                  <Action
                    variant="quiet"
                    busy={busy}
                    onClick={() => {
                      setAnsweringId(g.approvalId);
                      snooze.mutate(g.approvalId);
                    }}
                  >
                    Set it aside for a day
                  </Action>
                </div>
              ) : null}

              {/* A refusal comes back as words from the server; repeating them
                  is the only honest option, because the client knows strictly
                  less than the handler did. */}
              {/* The comment above is right that a refusal comes back as words
                  from the server and repeating them is the only honest option.
                  It holds only while the words WERE written for a person, and
                  the same channel also carries transport strings. `failureLine`
                  keeps the refusal and drops the machine's half. */}
              {decide.error ? (
                <RecordSpeaks>
                  {failureLine(
                    "Your answer was not recorded, so the call still stands.",
                    decide.error,
                  )}
                </RecordSpeaks>
              ) : null}
              {decideClass.error ? (
                <RecordSpeaks>
                  {failureLine(
                    "Your answer was not recorded, so the call still stands.",
                    decideClass.error,
                  )}
                </RecordSpeaks>
              ) : null}
            </div>
          </GateCard>
        );
      })}

      {/*
       * WHAT ALREADY SETTLED, NEWEST FIRST. Rendered, never hidden (§4.3):
           an answer made in another tab still happened and still shows. */}
      {answeredClassOf !== null ? (
        <p role="status" aria-live="polite" className="mrd-meta">
          {`Answered all ${answeredClassOf} like this one in this workspace. The same call will not ask again.`}
        </p>
      ) : null}
      {settled.map((g) => (
        <p key={`settled-${g.approvalId}`} className="mrd-meta">
          {settledLine(g.status)} · {whoAsked(g)} · waited {stoppedFor(g.askedAtMs, now)}
        </p>
      ))}
    </div>
  );
}

export default TrackConsent;
