import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { Action, ReadFailed } from "@/components/meridian/surface-parts";
import { serverMessage } from "@/components/shell/server-message";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { toast } from "@/lib/notify";
import {
  isRevisableKind,
  sendBackApprovalItem,
  type ApprovalKind,
} from "@/lib/approvals-queue.functions";
import { APPROVALS_QUEUE_PREFIX } from "@/lib/query-keys";

/**
 * SEND BACK: return work to an agent with a note saying what to fix.
 *
 * WHY THIS SURFACE EXISTS AT ALL. `sendBackApprovalItem` shipped weeks ago,
 * fully guarded, and had ZERO reachable doors: its only caller lived in the
 * retired mission tree, which no route could render. Meanwhile /today drew a
 * "Send back" button that navigated to /approvals, and /approvals had no
 * send-back control and no note field. A capability with no door does not
 * exist, and this one was worse than absent because it was advertised.
 *
 * WHY THE NOTE IS THE WHOLE SCREEN AND NOT A BOX UNDER TWO BUTTONS.
 *
 * A send-back writes a `human_gate_events` row carrying this note verbatim as
 * `diff_summary`, and it is the ONLY gate in the product that records a REASON
 * rather than a verdict. Self-improve reads that sentence back, unedited, when
 * it drafts a proposal against an agent. So this is not a form field: it is the
 * single highest-signal piece of text the product ever collects, and the only
 * place a human states in their own words what a machine got wrong.
 *
 * Three things follow, and they are why this is a sheet rather than a prompt:
 *
 *  · The note gets the room. A one-line input tells a person to write one line.
 *  · The placeholder teaches what a useful note is instead of naming the field.
 *    An operator's first line carries almost all the value -- the strongest
 *    advice on written argument in our research is that the opening paragraph
 *    decides whether the reader is persuaded -- and the agent reading this has
 *    no other context about why it was wrong.
 *  · It is REQUIRED, and not merely by the schema. The server refuses an empty
 *    note as "a decline wearing guidance's clothes", which is exactly right: a
 *    reversal with no reason teaches nothing and is a decline with extra steps.
 *
 * WHY THE VERB IS ABSENT RATHER THAN DISABLED ELSEWHERE. Only `spec` and
 * `design_gate` can be revised; every other kind throws. A disabled control
 * with no path forward is worse than no control, so callers ask
 * `canSendBack(kind)` and simply do not draw the button. See that export below.
 */

/** Whether this kind can be sent back at all. Callers must not render the verb
 *  when this is false -- absence, never a disabled button. Delegates to the
 *  server's own predicate so the two can never disagree about which kinds are
 *  revisable. */
export function canSendBack(kind: ApprovalKind): boolean {
  return isRevisableKind(kind);
}

/** The server's own limit, mirrored so the field can show a budget rather than
 *  refusing a paste after the fact. */
const MAX = 2000;
/** Below this, a note is almost certainly "no" with extra characters. Not
 *  enforced -- the server's floor is 1 -- but it is where the hint appears. */
const THIN = 12;

export function SendBackSheet({
  open,
  item,
  onClose,
  onSent,
}: {
  open: boolean;
  item: { id: string; sourceId: string; kindKey: ApprovalKind; title: string } | null;
  onClose: () => void;
  /** Fired ONLY on a successful send, before the sheet closes.
   *
   *  ADDED because the first caller could not tell a send from a cancel:
   *  `onClose` fires identically on both, so /today had no way to write the
   *  receipt it writes for every other settle verb, and a send-back was the one
   *  action on that surface that left no trace in the session record. The sheet
   *  toasts either way, but a toast is not a record — it is gone in four
   *  seconds and the surface's whole argument is that what you did is on the
   *  record.
   *
   *  Deliberately carries the note back. The caller's receipt should be able to
   *  say what was asked for, not merely that something was asked, and the note
   *  is the only part of a send-back that is the human's own words. */
  onSent?: (sent: { note: string }) => void;
}) {
  const trap = useFocusTrap(open);
  const qc = useQueryClient();
  const send = useServerFn(sendBackApprovalItem);
  const [note, setNote] = React.useState("");
  const [failure, setFailure] = React.useState<string | null>(null);
  const fieldRef = React.useRef<HTMLTextAreaElement | null>(null);

  // A fresh sheet is a fresh note. Carrying the last one over would let someone
  // send a reason written about a different piece of work.
  React.useEffect(() => {
    if (open) {
      setNote("");
      setFailure(null);
    }
  }, [open, item?.id]);

  // The note is the point of the sheet, so the caret starts in it.
  React.useEffect(() => {
    if (open) fieldRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // One Escape closes one layer. The shell has been bitten by a single
      // press collapsing three at once; this sheet does not join them.
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  const mutation = useMutation({
    mutationFn: (vars: { id: string; kind: ApprovalKind; note: string }) =>
      send({ data: { id: vars.id, kind: vars.kind, note: vars.note } }),
    onSuccess: (_result, vars) => {
      toast.success("Sent back with your note. The agent will revise it.");
      void qc.invalidateQueries({ queryKey: APPROVALS_QUEUE_PREFIX });
      // Before onClose, so a caller writing a receipt is writing it about a
      // send that actually landed rather than about a sheet that shut.
      onSent?.({ note: vars.note });
      onClose();
    },
    onError: (e) => {
      /* The server raises three carefully-worded refusals here that name real
         doors -- a shipped spec cannot be sent back, an already-draft spec has
         nothing to send back, an unrevisable kind should be declined instead.
         All three were unreachable while no door existed, so this surface is
         the first thing that can ever show them. They are shown VERBATIM
         rather than replaced with a generic failure, which is the whole reason
         serverMessage exists.

         Kept in the sheet rather than fired as a toast: the person still has an
         unsent note in front of them, and a toast that disappears while their
         words sit in a box they cannot submit is the worst of both. */
      setFailure(serverMessage(e) ?? "This did not send. Your note is still here.");
    },
  });

  if (!open || !item) return null;

  const trimmed = note.trim();
  const empty = trimmed.length === 0;
  const thin = !empty && trimmed.length < THIN;
  const over = trimmed.length > MAX;
  const blocked = empty || over || mutation.isPending;

  return (
    <div
      className="sp-sendback"
      role="dialog"
      aria-modal="true"
      aria-label={`Send back: ${item.title}`}
      ref={trap}
    >
      <button
        type="button"
        className="sp-sendback-scrim"
        aria-label="Close without sending"
        onClick={onClose}
      />
      <div className="sp-sendback-panel">
        {/* What is going back, stated once and quietly. The note is the content
            of this screen; the object is context for it. */}
        <div className="sp-sendback-head">
          <span className="sp-ctx-head">Sending back</span>
          <span className="sp-sendback-title">{item.title}</span>
        </div>

        <label className="sp-sendback-label" htmlFor="sendback-note">
          What should it fix?
        </label>
        <textarea
          id="sendback-note"
          ref={fieldRef}
          className="sp-sendback-note"
          value={note}
          maxLength={MAX + 200}
          onChange={(e) => {
            setNote(e.target.value);
            if (failure) setFailure(null);
          }}
          onKeyDown={(e) => {
            // Send on Cmd/Ctrl+Enter, the same chord every composer in this
            // product uses. Enter alone makes a new line, because this is prose.
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !blocked) {
              e.preventDefault();
              mutation.mutate({ id: item.sourceId, kind: item.kindKey, note: trimmed });
            }
          }}
          /* The placeholder teaches rather than labels. The agent that reads
             this has no other account of why its work was wrong, and a note
             saying "not right" costs the same to write as one that names the
             thing and is worth nothing. */
          placeholder="Name the specific thing that is wrong, and what right looks like. This goes to the agent in your words, and it is what it learns from."
          aria-describedby="sendback-hint"
        />

        <div className="sp-sendback-foot">
          <span className="sp-sendback-hint" id="sendback-hint">
            {over ? (
              <span className="sp-fail">
                {trimmed.length.toLocaleString()} characters. The limit is {MAX.toLocaleString()}.
              </span>
            ) : empty ? (
              // Stated as a fact about what a send-back IS, not as a validation
              // error. The person has not done anything wrong yet.
              "A send-back carries a reason. Without one it is a decline."
            ) : thin ? (
              "That will be read by an agent as your whole explanation."
            ) : trimmed.length > MAX - 200 ? (
              `${(MAX - trimmed.length).toLocaleString()} characters left.`
            ) : (
              "Cmd + Enter sends it."
            )}
          </span>
          <div className="sp-sendback-acts">
            <Action variant="quiet" onClick={onClose}>
              Cancel
            </Action>
            <Action
              disabled={blocked}
              onClick={() =>
                mutation.mutate({ id: item.sourceId, kind: item.kindKey, note: trimmed })
              }
            >
              {mutation.isPending ? "Sending back" : "Send it back"}
            </Action>
          </div>
        </div>

        {failure ? <ReadFailed>{failure}</ReadFailed> : null}
      </div>
    </div>
  );
}
