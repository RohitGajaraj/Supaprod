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
import { failureLine } from "@/lib/error-copy";
import { Action, Actions, Approve, RecordSpeaks } from "@/components/meridian/surface-parts";
import { ReasonField } from "@/components/meridian/forms";

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

  /*
   * ── A PRESS THE SERVER REFUSED, SHOWN NOWHERE (P-115, live 06:04-06:08
   * UTC 09-04) ────────────────────────────────────────────────────────────
   * `decideTrackGate`'s own server-side rule (§ below its schema) is
   * "declining records why": a reject with no `reason` never reaches the
   * handler, it fails the input validator. This banner sent bare
   * `{approvalId, verdict: "reject"}` with no reason field to fill one, so
   * every decline here failed the same way, three times, silently -- no
   * message rendered, because this component had no `decide.error` slot to
   * put one in. `TrackConsent`'s card already has the reason field and
   * already works; this is that exact field, moved here.
   *
   * `decliningId` rather than a bare boolean: the field's own open/closed
   * state is keyed to the gate it is for, so a re-render after the gate
   * rotates (this banner always shows only `q.data.open[0]`) cannot leave a
   * stale field open for a call nobody is looking at.
   */
  const [decliningId, setDecliningId] = React.useState<string | null>(null);
  /** The server's OWN soft-failure list (queue item 2): a decide can return
   *  200 with `problems` non-empty -- the verdict landed but a side effect
   *  (the note, the run signal) did not. Neither this banner nor the reason
   *  field's own commit path checked it before; both silences are the same
   *  defect, thrown or not. */
  const [problems, setProblems] = React.useState<string[]>([]);

  const decide = useMutation({
    mutationFn: (input: { approvalId: string; verdict: "approve" | "reject"; reason?: string }) =>
      fDecide({ data: { trackId, ...input, steer: input.verdict === "reject" } }),
    // Cleared here, not just set on success: a stale `problems` message from
    // a prior press must not sit under an unrelated later one.
    onMutate: () => setProblems([]),
    onSuccess: (res) => {
      setDecliningId(null);
      setProblems(res.problems);
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
      className="mt-mrd-4 flex flex-col gap-mrd-3 rounded-mrd-ctl bg-mrd-lift px-mrd-4 py-mrd-3 text-mrd-base text-mrd-body"
    >
      <div className="flex flex-wrap items-center gap-mrd-4">
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
            busy={decide.isPending}
            onClick={() =>
              setDecliningId(decliningId === gate.approvalId ? null : gate.approvalId)
            }
          >
            Don&apos;t run it
          </Action>
        </Actions>
      </div>

      {/*
       * A REJECT WITH NO REASON IS IMPOSSIBLE FROM HERE (the packet's own
       * guard): the only path from this banner to `decide.mutate` with
       * `verdict: "reject"` is `ReasonField`'s `onCommit`, which never fires
       * on an empty string (its own contract, see `forms.tsx`). There is no
       * other reject control on this component.
       */}
      {decliningId === gate.approvalId ? (
        <ReasonField
          id={`gate-banner-reason-${gate.approvalId}`}
          label="What should it do instead?"
          hint="It goes to the agent working this run and stays on the record beside this call."
          commitLabel="Don't run it, do this instead"
          cancelLabel="Back to the answers"
          busy={decide.isPending}
          onCommit={(reason) =>
            decide.mutate({ approvalId: gate.approvalId, verdict: "reject", reason })
          }
          onCancel={() => setDecliningId(null)}
        />
      ) : null}

      {/* A refusal comes back as words from the server; repeating them is the
          only honest option, the same rule TrackConsent's own decline follows. */}
      {decide.error ? (
        <RecordSpeaks>
          {failureLine("Your answer was not recorded, so the call still stands.", decide.error)}
        </RecordSpeaks>
      ) : null}
      {problems.length > 0 ? (
        <RecordSpeaks>{problems.join(" ")}</RecordSpeaks>
      ) : null}
    </div>
  );
}

export default GateBanner;
