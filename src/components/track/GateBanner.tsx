/**
 * THE PENDING GATE, ONE PRESS AWAY FROM WHEREVER THE PERSON ACTUALLY IS
 * (P-36, A-QUEUE.md).
 *
 * ── WHY THIS EXISTS, NAMED PRECISELY ──────────────────────────────────────
 * The founder opened the tablet track's run to answer PR #4's merge gate and
 * could not find the pull request or the answer. `TrackConsent.tsx` already
 * renders the full question, its evidence and its two verdict buttons -- but
 * inside `.mrd-workbench-pane`, a scroller that can hold thousands of pixels
 * of transcript above and below it. Scrolled to it once, or scrolled past it
 * later, and the buttons are gone from view with nothing on screen saying
 * there is a control below (or above). `TrackConsent`'s own scroll-into-view
 * fix (P-36) solves ARRIVAL; it cannot solve staying answerable after the
 * person keeps reading.
 *
 * This mounts in `mrd-workbench-header` -- the FIXED row above
 * `.mrd-workbench-panes`, per `.mrd-workbench { grid-template-rows: auto
 * minmax(0, 1fr); }` -- which is what makes "one press away from anywhere"
 * literal rather than a CSS `position: sticky` bet inside a scroller this
 * session has no browser to verify. Nothing here is new Meridian: `Approve`
 * and `Action` are the exact primitives Meridian already keeps for this
 * exact meaning (`Approve`'s own header: "the work is stopped until it is
 * pressed... a run merges its changeset"), composed in a track-owned file,
 * not added to `meridian/**`.
 *
 * ── ONE QUERY, ONE ANSWER, NEVER TWO ──────────────────────────────────────
 * Keyed on the SAME `["track-gates", trackId]` react-query key
 * `TrackConsent` already polls -- not a second read that could drift from
 * what the full card shows, the same discipline P-18/P-18a/P-18b spent this
 * whole day enforcing elsewhere. Answering from here calls the SAME
 * `decideTrackGate` mutation the card's own buttons call; this is a second
 * DOOR onto one fact, not a second fact.
 *
 * ── WHY ONLY THE OLDEST GATE, AND WHY NO EVIDENCE ─────────────────────────
 * `CallGate`'s own header rule is "ONE QUESTION, THEN THE FACTS, THEN THE
 * ACTIONS" and "ONE PRIMARY, AND ONLY ONE" -- a header-row banner has no room
 * for the facts a real decision needs (reversibility, consequence, why it
 * asks), so it names the question and points down, rather than repeating a
 * verdict shorn of the evidence behind it. The full card is still the one
 * place that actually decides; this is the door that says one is waiting.
 */
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { decideTrackGate, getTrackGates } from "@/lib/spine/track.functions";
import { gateHeadline } from "@/lib/tool-consequences";
import { Action, Actions, Approve } from "@/components/meridian/surface-parts";

export function GateBanner({ trackId }: { trackId: string }) {
  const fGates = useServerFn(getTrackGates);
  const fDecide = useServerFn(decideTrackGate);
  const qc = useQueryClient();

  // Same key TrackConsent polls -- react-query dedupes identical keys into
  // one cache entry and one request, so mounting this costs nothing extra.
  const q = useQuery({
    queryKey: ["track-gates", trackId],
    queryFn: () => fGates({ data: { trackId } }),
    refetchInterval: 10_000,
  });

  const decide = useMutation({
    mutationFn: (input: { approvalId: string; verdict: "approve" | "reject" }) =>
      fDecide({ data: { trackId, ...input } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["track-gates", trackId] });
      void qc.invalidateQueries({ queryKey: ["track-activity", trackId] });
      void qc.invalidateQueries({ queryKey: ["spine-track-chain"] });
      void qc.invalidateQueries({ queryKey: ["track-artifacts", trackId] });
    },
  });

  if (!q.data || q.data.unreadable) return null;
  const gate = q.data.open[0];
  if (!gate) return null;

  return (
    <div
      data-mrd=""
      role="region"
      aria-label="Waiting on you"
      className="mt-mrd-4 flex flex-wrap items-center gap-mrd-4 rounded-mrd-ctl bg-mrd-lift px-mrd-4 py-mrd-3 text-mrd-base text-mrd-body"
    >
      <span className="flex min-w-0 items-center gap-1.5">
        <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-mrd-you" />
        <span className="min-w-0 truncate font-medium text-mrd-ink">
          {gateHeadline(gate.toolName)}
        </span>
      </span>
      <Actions className="ml-auto">
        <Approve
          busy={decide.isPending}
          onClick={() => decide.mutate({ approvalId: gate.approvalId, verdict: "approve" })}
        >
          Let it run
        </Approve>
        <Action
          disabled={decide.isPending}
          onClick={() => decide.mutate({ approvalId: gate.approvalId, verdict: "reject" })}
        >
          Don&apos;t run it
        </Action>
      </Actions>
    </div>
  );
}

export default GateBanner;
