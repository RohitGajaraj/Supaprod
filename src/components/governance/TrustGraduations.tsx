/**
 * TRUST GRADUATIONS. The agent asking for its own promotion.
 *
 * SW-4 / mission 3.10 TRUST RAMP: a proposal is the system asking to loosen ONE
 * (agent, tool) gate after a clean streak. Accepting is the only thing that
 * changes the mode (loop.server.ts overlays it next run); declining records the
 * no and the streak starts over from the next decided approval.
 *
 * PORTED 2026-07-29 onto src/components/shell/primitives.tsx. What it was: a
 * stack of `bento` cards, each with its own border, its own ember icon and its
 * own pair of ghost buttons, so five proposals were five equal primary actions
 * and nothing to look at first. What it is now: the same shape Crew's
 * `Proposals` uses, because it is the same moment, and the product should not
 * say it two different ways on two surfaces.
 *
 *   · Exactly ONE proposal is live at a time, drawn as a `Gate`. It is the
 *     biggest thing in the block and it carries one primary action, so the end
 *     of the queue is visible from the start.
 *   · The rest are one-line `Row`s that take the Gate's place as it is settled.
 *   · Deciding leaves a `Receipt`, never a toast. This is the whole point
 *     (agents/FINAL-agent-presence.md R10): a toast confirms that your click
 *     registered, a receipt renders what your click CAUSED. An approval that
 *     erases itself teaches you that your judgment left no trace, and judgment
 *     is the product.
 */
import * as React from "react";
import { Row } from "@/components/meridian/rows";
import { Action, Approve, Num, ReadFailedLine, Region } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { agentDisplayName } from "@/lib/agent-vocabulary";
import { Gate, Receipt } from "@/components/shell/primitives";
import { AgentMark } from "@/components/meridian/marks";
import {
  listTrustGraduationProposals,
  decideTrustGraduation,
  type TrustGraduationProposal,
} from "@/lib/trust.functions";

/** The mode as a phrase inside a sentence. Mechanism words (auto, confirm,
 *  review) are the correct technical whisper in the Engine Room and never the
 *  words a person reads. Same vocabulary as the Crew surface. */
const MODE_PHRASE: Record<TrustGraduationProposal["to_mode"], string> = {
  auto: "on its own",
  confirm: "only after asking you",
  review: "only after your review",
};

/** Plain-words relative time. Mono is applied by the row, not here. */
function ago(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

type Decided = {
  accept: boolean;
  agentSlug: string;
  toolName: string;
  mode: TrustGraduationProposal["to_mode"];
  at: string;
};

export function TrustGraduationsBlock({
  /** May this block draw the `Gate`, the one primary action on the surface?
   *
   *  Approvals passes false whenever a tool call is already stopped mid run,
   *  because that call has an agent waiting on it and a graduation has no clock
   *  at all. Two Gates at once would be two primary actions and neither would
   *  read as the one thing asking. When it cannot lead, every proposal renders
   *  as a row and the decision moves one click away, to Crew. */
  lead = true,
}: {
  lead?: boolean;
} = {}) {
  const fList = useServerFn(listTrustGraduationProposals);
  const fDecide = useServerFn(decideTrustGraduation);
  const qc = useQueryClient();

  const q = useQuery({ queryKey: ["trust-graduations"], queryFn: () => fList() });
  const [decided, setDecided] = React.useState<Decided[]>([]);

  const decide = useMutation({
    mutationFn: (v: { proposalId: string; accept: boolean }) => fDecide({ data: v }),
  });

  // A read that FAILED is not an empty state. "Nothing is asking" and "we could
  // not find out what is asking" are different facts, and a person acts
  // differently on each.
  if (q.isError) {
    return (
      <Region title="Asking for more room">
        <ReadFailedLine onRetry={() => void q.refetch()}>
          The proposals did not load, so nothing below is the real queue.
        </ReadFailedLine>
      </Region>
    );
  }

  const pending = (q.data ?? []).filter((p) => p.status === "pending");
  if (q.isLoading) return null;
  if (pending.length === 0 && decided.length === 0) return null;

  // Exactly one thing asks at a time, so there is one primary action on the
  // screen. The rest are one-line rows that take the Gate's place as it settles.
  // When this block cannot lead, nothing is the Gate and every proposal is a row.
  const [live, behind] = lead ? [pending[0], pending.slice(1)] : [undefined, pending];

  function settle(accept: boolean) {
    if (!live) return;
    decide.mutate(
      { proposalId: live.id, accept },
      {
        onSuccess: () => {
          setDecided((d) => [
            ...d,
            {
              accept,
              agentSlug: live.agent_slug,
              toolName: live.tool_name,
              mode: accept ? live.to_mode : live.from_mode,
              at: new Date().toISOString(),
            },
          ]);
          void qc.invalidateQueries({ queryKey: ["trust-graduations"] });
        },
      },
    );
  }

  const liveName = live ? agentDisplayName(live.agent_slug) : "";

  return (
    <>
      {live ? (
        <Gate
          question={`Let ${liveName} run ${live.tool_name} ${MODE_PHRASE[live.to_mode]}?`}
          lines={[
            <>
              It has done this <Num>{live.clean_streak}</Num> times in a row and you changed
              nothing.
            </>,
            <>
              Today it runs {MODE_PHRASE[live.from_mode]}. It is asking to run{" "}
              {MODE_PHRASE[live.to_mode]}.
            </>,
            <>The hard floors hold either way. A one way door still comes back to you.</>,
            ...(live.rationale ? [<>{live.rationale}</>] : []),
          ]}
        >
          <Approve busy={decide.isPending} onClick={() => settle(true)}>
            Give it the room
          </Approve>
          <Action busy={decide.isPending} onClick={() => settle(false)}>
            Not yet
          </Action>
        </Gate>
      ) : null}

      {behind.length > 0 ? (
        <Region
          title={live ? "Behind it" : "Asking for more room"}
          sub={
            live
              ? "Settle the one above and the next takes its place."
              : "Each one has run cleanly enough times to propose it stops asking. None of them is blocking anything, so they wait until the queue above is clear."
          }
        >
          {behind.map((p) => (
            <Row
              key={p.id}
              marks={<AgentMark slug={p.agent_slug} state="waiting" />}
              lead={
                <>
                  {agentDisplayName(p.agent_slug)} wants to run {p.tool_name}{" "}
                  {MODE_PHRASE[p.to_mode]}.
                </>
              }
              sub={
                <>
                  <Num>{p.clean_streak}</Num> clean in a row
                </>
              }
              time={ago(p.created_at)}
              tight
            />
          ))}
        </Region>
      ) : null}

      {decide.isError ? <ReadFailedLine>{(decide.error as Error).message}</ReadFailedLine> : null}

      {/* THE COMMIT. No arrow is drawn: nothing picks this up, it is a standing
          rule from now on, and an arrow to nowhere is worse than no arrow. */}
      {decided.map((d, i) => (
        <Receipt
          key={`${d.at}-${i}`}
          verb={d.accept ? "You gave it the room" : "You said not yet"}
          consequence={
            <>
              {agentDisplayName(d.agentSlug)} runs {d.toolName} {MODE_PHRASE[d.mode]}
              {d.accept ? " from now on." : " still."}
            </>
          }
          time={ago(d.at)}
        />
      ))}
    </>
  );
}
