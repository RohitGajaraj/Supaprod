/**
 * BRN-01: the operable brain. What you can DO to a node you selected in the
 * graph, dispatched through the existing loop rather than previewed:
 *   decision            reopen it (status back to pending) and publish its receipt
 *   opportunity / spec  run the Critic against it
 *   MISSION_KINDS       start a mission from it, behind a confirm
 *
 * The mission action used to be offered on ANY kind and fired on one click. Two
 * things were wrong with that. It was drawn on records where following up is
 * not a thing you can do (an outcome, a deployment, a design rule), and it was
 * the one control here that spends money with no guard, while its own receipt
 * said it "spends credits until it finishes or you stop it". Both fixed below:
 * MISSION_KINDS gates which nodes draw it, useConfirm states the cost first.
 *
 * Kept as a self-contained sibling of GraphNodeStory (own server functions, own
 * mutations) so the story panel stays a pure read view.
 *
 * Ported to the shell primitives, 2026-07-29. What went, and why:
 *   KILLED the local ActionButton, which hand-rolled the focus ring, set mono
 *     for a LABEL, and appended a literal "->" to every one of them. Button is
 *     the primitive; the arrow was decoration on a control that already looks
 *     like a control.
 *   KILLED the "working..." label with an ellipsis character. Plain words.
 *   KILLED the stacked one-per-line layout with its own top rule. Actions is
 *     the row, and it puts the destructive-adjacent one at a distance rather
 *     than at equal weight.
 *   KILLED every consequential-write TOAST. Reopening a decision moves a
 *     settled call back to unsettled, running the Critic writes a verdict onto
 *     the artifact, and starting a mission spends real money. None of those are
 *     four-second facts (agents/FINAL-agent-presence.md R10). Each leaves a
 *     Receipt carrying what the server actually returned, and the mission's
 *     receipt draws the handoff arrow to the crew that picked the work up. The
 *     clipboard copy keeps its toast: copying changes nothing, so there is
 *     nothing for a receipt to record.
 *
 * UNCHANGED: updateDecision, getDecisionShareState / setDecisionShared,
 * runCriticReview, startOrchestratedMission, every invalidation key, and the
 * navigation to the started mission.
 */
import { useState } from "react";
import { Actions, Action } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "@/lib/notify";
import { updateDecision } from "@/lib/decisions.functions";
import { getDecisionShareState, setDecisionShared } from "@/lib/decisions-share.functions";
import { runCriticReview } from "@/lib/discovery.functions";
import { startOrchestratedMission } from "@/lib/orchestrator.functions";
import type { GraphNode, GraphNodeKind } from "@/lib/knowledge-graph-view";
import { artifactWord } from "@/lib/artifact-words";
import { useConfirm } from "@/hooks/use-confirm";
import { Receipt } from "@/components/shell/primitives";

/**
 * The kinds "Start a mission from this" is offered on.
 *
 * The action hands the node to the Orchestrator as real work and spends credits
 * until the crew finishes, so it only belongs on records that name work still
 * to be done. Everything left out is either a record of something that already
 * happened (learning, deployment, changeset, meeting, mission) or a standing
 * constraint rather than a job (design_memory), or a fragment generated off a
 * spec whose parent spec is the thing you would actually hand over
 * (prd_scaffold, prd_flow, prototype). "Follow up on: <that>" produces a goal
 * nobody can act on and a bill for finding that out.
 *
 * ABSENCE, not a disabled button. A greyed control with no explanation tells
 * you a verb exists here and refuses to say why you cannot use it; the kinds
 * below simply do not draw it.
 */
const MISSION_KINDS: readonly GraphNodeKind[] = [
  "signal", // an input nobody has acted on yet
  "theme", // a cluster of those, same thing at one remove
  "opportunity", // a bet that has not been taken
  "prd", // the spec, i.e. the thing to build
  "roadmap_item", // committed work with no run behind it
  "task", // the smallest unit of work there is
  "decision", // a settled call still has to be carried out
];

function copyShareLink(slug: string) {
  const url = `${typeof window !== "undefined" ? window.location.origin : ""}/d/${slug}`;
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    // Copying is not a write. Nothing changed, so a toast is the honest
    // instrument and a receipt would be claiming a consequence there is not.
    navigator.clipboard.writeText(url).then(
      () => toast.success("Public link copied"),
      () => toast.message(url),
    );
  } else {
    toast.message(url);
  }
}

type Settled = {
  id: string;
  verb: string;
  consequence: string;
  failed?: boolean;
  handoff?: { slug: string; name?: string | null } | null;
};

export function GraphNodeActions({ node }: { node: GraphNode }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const confirm = useConfirm();

  const [settled, setSettled] = useState<Settled[]>([]);
  const commit = (s: Omit<Settled, "id">) =>
    setSettled((prev) => [{ id: `${Date.now()}-${prev.length}`, ...s }, ...prev]);

  const fReopen = useServerFn(updateDecision);
  const reopen = useMutation({
    mutationFn: () => fReopen({ data: { id: node.id, status: "pending" as const } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["decisions"] });
      commit({
        verb: "You reopened this call",
        consequence: `"${node.title || "It"}" is unsettled again. It goes back to Today to be decided, and agents stop treating it as settled.`,
      });
    },
    onError: (e: Error) =>
      commit({
        verb: "You tried to reopen this call",
        consequence: e.message || "The write failed. It is still settled.",
        failed: true,
      }),
  });

  const [shareLoading, setShareLoading] = useState(false);
  const fShareState = useServerFn(getDecisionShareState);
  const fSetShared = useServerFn(setDecisionShared);
  const share = useMutation({
    mutationFn: async () => {
      setShareLoading(true);
      try {
        const state = await fShareState({ data: { id: node.id } });
        if (state.is_public && state.share_slug) return state;
        return await fSetShared({ data: { id: node.id, isPublic: true } });
      } finally {
        setShareLoading(false);
      }
    },
    onSuccess: (res) => {
      if (res.share_slug) {
        copyShareLink(res.share_slug);
        commit({
          verb: "You published this call",
          consequence:
            "Anyone with the link can read it and its rationale. The link is on your clipboard.",
        });
      } else {
        commit({
          verb: "You tried to publish this call",
          consequence: "Sharing lights up after the next sync applies the share columns.",
          failed: true,
        });
      }
    },
    onError: (e: Error) =>
      commit({
        verb: "You tried to publish this call",
        consequence: e.message || "The write failed. It is still private.",
        failed: true,
      }),
  });

  const fCritic = useServerFn(runCriticReview);
  const critic = useMutation({
    mutationFn: () =>
      fCritic({
        data: { target_kind: node.kind as "opportunity" | "prd", target_id: node.id },
      }),
    onSuccess: ({ review }) => {
      commit({
        verb: "You sent this to the Critic",
        // The real verdict the server returned, not a confirmation of the click.
        consequence: `It came back ${review.verdict}. The full review is on the ${artifactWord(node.kind)}.`,
        handoff: { slug: "critic", name: "Critic" },
      });
    },
    onError: (e: Error) =>
      commit({
        verb: "You tried to send this to the Critic",
        consequence: e.message || "The review did not run. Nothing was written.",
        failed: true,
      }),
  });

  const fStartMission = useServerFn(startOrchestratedMission);
  const startMission = useMutation({
    mutationFn: () =>
      fStartMission({
        data: {
          goal: `Follow up on: ${node.title || `this ${artifactWord(node.kind)}`}`,
          title: node.title,
        },
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["missions"] });
      commit({
        verb: "You started a mission",
        consequence: `The crew is working on "${node.title || `this ${artifactWord(node.kind)}`}" and it spends credits until it finishes or you stop it.`,
        handoff: { slug: "orchestrator", name: "Orchestrator" },
      });
      // Straight to the run's own surface, which is where the seven-stage
      // strip lives. This used to go to /build?mission=, a URL that now only
      // redirects, so it cost the person an extra hop on the way in.
      navigate({ to: "/runs/$missionId", params: { missionId: res.mission_id } });
    },
    onError: (e: Error) =>
      commit({
        verb: "You tried to start a mission",
        consequence: e.message || "Nothing started, and nothing was spent.",
        failed: true,
      }),
  });

  const isDecision = node.kind === "decision";
  const isReviewable = node.kind === "opportunity" || node.kind === "prd";
  const canStartMission = MISSION_KINDS.includes(node.kind);

  // The subject of the mission, in the same words its goal and its receipt use.
  const subject = node.title || `this ${artifactWord(node.kind)}`;

  // Starting a mission is the only action here that spends money, and the
  // receipt below already admits it runs until it finishes or you stop it. That
  // is a fact you are owed BEFORE the click, not after it. The Critic and the
  // publish stay unguarded on purpose: a confirm on every button is a confirm
  // nobody reads.
  async function confirmAndStartMission() {
    const ok = await confirm({
      title: node.title
        ? `Start a mission on "${node.title}"?`
        : `Start a mission on this ${artifactWord(node.kind)}?`,
      body: `The crew picks up "${subject}" now and works on it without you. It spends credits the whole time it runs, and it does not stop until it finishes or you stop it.`,
      confirmLabel: "Start the mission",
    });
    if (ok) startMission.mutate();
  }

  return (
    <>
      <Actions
        // Reopening a settled call undoes a judgment, so it sits at a distance
        // rather than beside the two things that move work forward.
        trailing={
          isDecision ? (
            <Action busy={reopen.isPending} onClick={() => reopen.mutate()}>
              {reopen.isPending ? "Reopening" : "Reopen the call"}
            </Action>
          ) : undefined
        }
      >
        {canStartMission ? (
          <Action busy={startMission.isPending} onClick={() => void confirmAndStartMission()}>
            {startMission.isPending ? "Starting" : "Start a mission from this"}
          </Action>
        ) : null}
        {isReviewable ? (
          <Action busy={critic.isPending} onClick={() => critic.mutate()}>
            {critic.isPending ? "Reviewing" : "Send it to the Critic"}
          </Action>
        ) : null}
        {isDecision ? (
          <Action
            disabled={share.isPending || shareLoading}
            onClick={() => share.mutate()}
            title="Make this decision public and copy a shareable link"
          >
            {/* Same label as DecisionDetail's share control, and for the same
                reason: this makes the decision public and copies a link. */}
            {share.isPending || shareLoading ? "Publishing" : "Share this decision"}
          </Action>
        ) : null}
      </Actions>

      {settled.map((s) => (
        <Receipt
          key={s.id}
          verb={s.verb}
          consequence={s.consequence}
          handoff={s.handoff}
          failed={s.failed}
        />
      ))}
    </>
  );
}
