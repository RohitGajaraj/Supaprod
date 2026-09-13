/**
 * What the crew is doing about it, inside the thread.
 *
 * REUSED, NOT REBUILT. `getAskMissionCanvas` (CMD-0) already returns exactly
 * this: live loop steps, the run's pending tool gates, the memories the run
 * recalled, and the Critic's verdict. It was written for `AskPanel.tsx`, which
 * is retired, so it has been live server code with no reader. Its own header
 * says it is deliberately leaner than `getStudioSession` because it was built
 * for a narrow panel and polled every 4s. That is this panel.
 *
 * The two things it gives that nothing else does:
 *  - MEMORY RECALLS. What the crew actually read out of the workspace's memory
 *    before it acted. That is the record speaking, sourced from
 *    `memory_recall_log` joined to `agent_memory`, so it can be quoted without
 *    anything being made up.
 *  - STEERING. `steerStudioSession` lands a `steer` row the loop injects as
 *    operator guidance at its next step. Correcting the crew WITHOUT stopping
 *    it is the governance canon expressed as a control, and if Ask started the
 *    run then correcting it should not mean going to find the run.
 */

import * as React from "react";
import {
  Action,
  Approve,
  Num,
  Actions,
  ReadFailedLine,
  RecordSpeaks,
} from "@/components/meridian/surface-parts";
import { LoadingState } from "@/components/meridian/LoadingState";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAskMissionCanvas } from "@/lib/ask-canvas.functions";
import { steerStudioSession } from "@/lib/studio.functions";
import { decideApproval } from "@/lib/agent_loop.functions";
import { ACTION_LABEL } from "@/lib/agent-vocabulary";
import type { LoopStep } from "@/lib/ai/loop.server";
import { Receipt } from "@/components/meridian/Receipt";
import { Textarea } from "@/components/meridian/forms";
import { useTimezone } from "@/hooks/use-timezone";
import { clockInZone } from "@/lib/time-of-day";

const POLL_MS = 4000;

/**
 * Statuses a run never leaves. Everything else, including the queued and
 * in_progress states a freshly dispatched mission passes through, means the
 * card should keep watching.
 *
 * Deliberately an "is it finished" set rather than an "is it working" one: a
 * status nobody anticipated then keeps the card live instead of freezing it,
 * and that is the safe direction to be wrong in.
 */
const TERMINAL_RUN_STATUS = new Set([
  "completed",
  "completed_with_failures",
  "failed",
  "cancelled",
  "halted",
]);

/**
 * Plain words for a run that is not currently working, in the voice of the
 * sentence they land in ("The run is ... after 4 steps"). `agent_runs.status`
 * is a column value, not something a person says, so it never reaches the
 * page: "completed_with_failures" is the engine talking.
 *
 * An unrecognised status reads "still going" rather than the raw word, which
 * is both honest (the poll above keeps watching anything outside the terminal
 * set) and the safe direction to be wrong in.
 */
const RUN_WORD: Record<string, string> = {
  queued: "queued",
  in_progress: "still going",
  waiting_approval: "waiting on you",
  blocked: "waiting on you",
  completed: "finished",
  done: "finished",
  completed_with_failures: "finished, with failures",
  failed: "failed",
  cancelled: "cancelled",
  halted: "stopped",
};

function runWord(status: string): string {
  return RUN_WORD[status] ?? "still going";
}

/** Plain words for one loop step. Never "thinking": an agent works. */
function stepLine(step: LoopStep): string {
  if (step.kind === "tool_call") return ACTION_LABEL[step.name] ?? "working";
  return "working it out";
}

function clock(zone: string): string {
  return clockInZone(new Date().toISOString(), zone);
}

type Note = { key: string; verb: string; consequence: string; failed?: boolean; at: string };

export function AskRunCard({ missionId, initials }: { missionId: string; initials: string }) {
  const fetchCanvas = useServerFn(getAskMissionCanvas);
  const steer = useServerFn(steerStudioSession);
  const decide = useServerFn(decideApproval);

  const [steerDraft, setSteerDraft] = React.useState("");
  const [steering, setSteering] = React.useState(false);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const zone = useTimezone();
  const note = (n: Omit<Note, "key" | "at">) =>
    setNotes((prev) => [{ ...n, key: `${Date.now()}-${prev.length}`, at: clock(zone) }, ...prev]);

  const canvas = useQuery({
    queryKey: ["ask-canvas", missionId],
    queryFn: () => fetchCanvas({ data: { missionId } }),
    /* Stop polling the moment the run stops. Motion confirms; a settled run has
     * nothing left to confirm.
     *
     * Tested the RIGHT way round, and that is the fix. This asked "is it
     * running" and stopped for everything else, which silently included every
     * status a run holds BEFORE it runs: a mission dispatched from Ask is
     * queued, then in_progress, and only sometimes literally "running". So on
     * the one path this card exists for, the poll never installed at all and
     * the card sat on its first empty read forever.
     *
     * Asking "is it finished" instead means an unrecognised or brand-new status
     * keeps the card live rather than freezing it, which is the safe direction
     * to be wrong in: a card that polls a little too long costs a request, one
     * that stops too early lies about the work. */
    refetchInterval: (q) => {
      const status = q.state.data?.run?.status;
      if (!status) return POLL_MS; // dispatched, no run row yet: keep looking
      return TERMINAL_RUN_STATUS.has(status) ? false : POLL_MS;
    },
  });

  if (canvas.isError) {
    return (
      <ReadFailedLine onRetry={() => void canvas.refetch()} error={canvas.error}>
        The run did not report back. Nothing here is a claim about what it did.
      </ReadFailedLine>
    );
  }
  if (canvas.isLoading) return <LoadingState label="Reading the run." />;

  const data = canvas.data;
  if (!data) return null;

  const running = data.run?.status === "running";
  const steps = data.run?.steps ?? [];
  const last = steps.length > 0 ? steps[steps.length - 1] : null;
  const pending = data.approvals.filter((a) => a.status === "pending");
  const critic = data.criticVerdict;

  async function sendSteer() {
    const message = steerDraft.trim();
    if (!message || steering) return;
    setSteering(true);
    try {
      await steer({ data: { missionId, message } });
      setSteerDraft("");
      note({
        verb: "You steered it",
        consequence: "The crew reads this at its next step. The run keeps going.",
      });
    } catch (e) {
      note({
        verb: "It was not steered",
        consequence: e instanceof Error ? e.message : "The message did not reach the run.",
        failed: true,
      });
    } finally {
      setSteering(false);
    }
  }

  async function settle(approvalId: string, verdict: "approve" | "reject", tool: string) {
    try {
      await decide({ data: { approvalId, decision: verdict } });
      note({
        verb: verdict === "approve" ? "You approved it" : "You sent it back",
        consequence:
          verdict === "approve"
            ? `The crew goes ahead with ${ACTION_LABEL[tool] ?? "this action"}.`
            : `The crew leaves ${ACTION_LABEL[tool] ?? "this action"} alone and carries on.`,
      });
      void canvas.refetch();
    } catch (e) {
      note({
        verb: "Nothing changed",
        consequence: e instanceof Error ? e.message : "The write did not go through.",
        failed: true,
      });
    }
  }

  return (
    <>
      <div className="sp-ctx-body">
        {running ? (
          <>
            The crew is on it, {last ? stepLine(last) : "starting"}. Step <Num>{steps.length}</Num>{" "}
            so far.
          </>
        ) : data.run ? (
          <>
            The run is <Num>{runWord(data.run.status)}</Num> after <Num>{steps.length}</Num>{" "}
            {steps.length === 1 ? "step" : "steps"}.
          </>
        ) : (
          "The run has not reported a step yet."
        )}
      </div>

      {/* What it read before it acted. Real rows out of memory_recall_log, so
          the one lit surface in the product is carrying a fact, not a flourish. */}
      {data.memoryRecalls.slice(0, 2).map((m) => (
        <RecordSpeaks key={m.id} evidence={m.kind}>
          {m.content}
        </RecordSpeaks>
      ))}

      {critic ? (
        <div className="sp-ctx-body">
          The Critic says <Num>{critic.verdict}</Num>. {critic.summary}
        </div>
      ) : null}

      {pending.map((a) => (
        <div key={a.id} style={{ marginTop: "var(--mrd-s5)" }}>
          <div className="sp-ctx-name">
            It is waiting on you to allow {ACTION_LABEL[a.tool_name] ?? "this action"}.
          </div>
          {a.rationale ? <div className="sp-ctx-sub">{a.rationale}</div> : null}
          <Actions>
            {/* TIER: clause 2, releases the held gate */}
            <Approve onClick={() => void settle(a.id, "approve", a.tool_name)}>Allow it</Approve>
            {/* TIER: clause 1, writes the reject verdict */}
            <Action onClick={() => void settle(a.id, "reject", a.tool_name)}>Not this one</Action>
          </Actions>
        </div>
      ))}

      {running ? (
        <div style={{ marginTop: "var(--mrd-s5)" }}>
          <Textarea
            rows={2}
            value={steerDraft}
            placeholder="Correct it without stopping it"
            aria-label="Steer this run"
            onChange={(e) => setSteerDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendSteer();
              }
            }}
          />
          <Actions>
            {/* TIER: clause 1, sends the steer row; busy is its own write, the empty draft stays disabled */}
            <Action busy={steering} disabled={!steerDraft.trim()} onClick={() => void sendSteer()}>
              Steer it
            </Action>
          </Actions>
        </div>
      ) : null}

      {notes.map((n) => (
        <Receipt
          key={n.key}
          initials={initials}
          verb={n.verb}
          consequence={n.consequence}
          time={n.at}
          failed={n.failed}
        />
      ))}
    </>
  );
}
