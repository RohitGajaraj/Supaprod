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
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getAskMissionCanvas } from "@/lib/ask-canvas.functions";
import { steerStudioSession } from "@/lib/studio.functions";
import { decideApproval } from "@/lib/agent_loop.functions";
import { ACTION_LABEL } from "@/lib/agent-vocabulary";
import type { LoopStep } from "@/lib/ai/loop.server";
import {
  Actions,
  Button,
  Failed,
  Loading,
  Num,
  Receipt,
  Record,
  Textarea,
} from "@/components/shell/primitives";

const POLL_MS = 4000;

/** Plain words for one loop step. Never "thinking": an agent works. */
function stepLine(step: LoopStep): string {
  if (step.kind === "tool_call") return ACTION_LABEL[step.name] ?? "working";
  return "working it out";
}

function clock(): string {
  return new Date().toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

type Note = { key: string; verb: string; consequence: string; failed?: boolean; at: string };

export function AskRunCard({ missionId, initials }: { missionId: string; initials: string }) {
  const fetchCanvas = useServerFn(getAskMissionCanvas);
  const steer = useServerFn(steerStudioSession);
  const decide = useServerFn(decideApproval);

  const [steerDraft, setSteerDraft] = React.useState("");
  const [steering, setSteering] = React.useState(false);
  const [notes, setNotes] = React.useState<Note[]>([]);
  const note = (n: Omit<Note, "key" | "at">) =>
    setNotes((prev) => [{ ...n, key: `${Date.now()}-${prev.length}`, at: clock() }, ...prev]);

  const canvas = useQuery({
    queryKey: ["ask-canvas", missionId],
    queryFn: () => fetchCanvas({ data: { missionId } }),
    // Stop polling the moment the run stops. Motion confirms; a settled run has
    // nothing left to confirm.
    refetchInterval: (q) => (q.state.data?.run?.status === "running" ? POLL_MS : false),
  });

  if (canvas.isError) {
    return (
      <Failed onRetry={() => void canvas.refetch()}>
        The run did not report back. Nothing here is a claim about what it did.
      </Failed>
    );
  }
  if (canvas.isLoading) return <Loading>Reading the run.</Loading>;

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
            The run is <Num>{data.run.status}</Num> after <Num>{steps.length}</Num>{" "}
            {steps.length === 1 ? "step" : "steps"}.
          </>
        ) : (
          "The run has not reported a step yet."
        )}
      </div>

      {/* What it read before it acted. Real rows out of memory_recall_log, so
          the one lit surface in the product is carrying a fact, not a flourish. */}
      {data.memoryRecalls.slice(0, 2).map((m) => (
        <Record key={m.id} evidence={m.kind}>
          {m.content}
        </Record>
      ))}

      {critic ? (
        <div className="sp-ctx-body">
          The Critic says <Num>{critic.verdict}</Num>. {critic.summary}
        </div>
      ) : null}

      {pending.map((a) => (
        <div key={a.id} style={{ marginTop: "var(--sp-space-4)" }}>
          <div className="sp-ctx-name">
            It is waiting on you to allow {ACTION_LABEL[a.tool_name] ?? a.tool_name}.
          </div>
          {a.rationale ? <div className="sp-ctx-sub">{a.rationale}</div> : null}
          <Actions>
            <Button variant="primary" onClick={() => void settle(a.id, "approve", a.tool_name)}>
              Allow it
            </Button>
            <Button onClick={() => void settle(a.id, "reject", a.tool_name)}>Not this one</Button>
          </Actions>
        </div>
      ))}

      {running ? (
        <div style={{ marginTop: "var(--sp-space-4)" }}>
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
            <Button disabled={!steerDraft.trim() || steering} onClick={() => void sendSteer()}>
              Steer it
            </Button>
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
