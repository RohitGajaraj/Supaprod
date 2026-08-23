import * as React from "react";
import { Row } from "@/components/meridian/rows";
import { Action, Approve, Door, Num } from "@/components/meridian/surface-parts";

import { canSendBack } from "@/components/approvals/SendBack";
import { stripAutoPrefix } from "@/components/plan/format";
import { Checkbox, Gate, SelectionBar } from "@/components/shell/primitives";
import { AgentMark } from "@/components/meridian/marks";
import type { Selection } from "@/components/shell/use-selection";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import type { ApprovalQueueItem } from "@/lib/approvals-queue.functions";
import { isModalOpen } from "@/lib/overlay";
import { ago } from "./when";

/**
 * THE DECISIONS WAITING ON YOU, IN THE TWO SHAPES THEY ARE ALLOWED TO TAKE.
 *
 * ONE CALL ON ARRIVAL. Founder ruling, binding at any volume: this surface must
 * never present more than one decision when you land on it. Forty pending
 * approvals rendered as forty rows is not a queue, it is a bill; the ceiling on
 * this product is human attention, not screen space, and a morning brief that
 * spends it before the reader has chosen to spend it has already failed. So
 * arrival is one call, a count, and a door.
 *
 * WALKING THE QUEUE IS A MODE YOU ENTER, NOT A PLACE YOU GO, and that is the
 * second half of the ruling. The door used to be a navigation to /approvals,
 * which is a different surface with its own copy, its own key handler and — for
 * a while — a different letter for the same verb. That split is exactly how
 * this product came to print a shortcut hint for a key that was bound to
 * nothing on the screen the hint appeared on. Here the door flips a boolean:
 * same items, same handler, same verbs, same letters, one component. A copy
 * split cannot happen between two states of one component.
 *
 * WHAT EXPANDS, EXPANDS IN PLACE. In the walking mode the focused row is not
 * decorated, it is REPLACED by the open call, so there is exactly one question,
 * one set of evidence and one set of verbs on screen at any moment — in either
 * mode, drawn by the same `OpenCall` below. A reader never has to hold two
 * questions at once, and the two modes cannot drift apart, because there is
 * only one of them.
 *
 * THE KEYBOARD LIVES HERE, WITH THE KEYCAPS IT LABELS. `key-model.ts` names
 * this file as Today's keyboard source, and the reason is the defect that
 * registry exists to stop: `shortcut="a"` on a Button renders a `<kbd>` and
 * binds nothing at all, which is how this product once shipped a gear
 * promising a key that fired nothing. The listener and the caps are in one
 * file so a reviewer can see both in one screen, and `key-model.test.ts` reads
 * this file to check they agree.
 *
 * IT IS ALSO ONLY MOUNTED WHERE THE KEYS MEAN SOMETHING. The caller renders
 * this component only when a decision is actually open, so there is no window
 * in which `a` is armed over an empty queue or a read still in flight.
 */

export type QueueVerbs = {
  approve: (item: ApprovalQueueItem) => void;
  decline: (item: ApprovalQueueItem) => void;
  snooze: (item: ApprovalQueueItem) => void;
  /** Only ever called for a kind `canSendBack` accepts. */
  sendBack: (item: ApprovalQueueItem) => void;
  /** True while a settle is in flight, so no verb can be pressed twice. */
  busy: boolean;
};

/** The same three verbs, over everything currently selected. */
export type BulkVerbs = {
  approve: () => void;
  decline: () => void;
  snooze: () => void;
};

/**
 * The tick box on one row.
 *
 * RANGE-SELECT NEEDS THE MODIFIER AND `Checkbox` CANNOT HAND IT OVER. The
 * primitive's `onChange` is `(next: boolean) => void`, deliberately — a
 * checkbox reports a value, not an event — but `useSelection.toggle` needs to
 * know whether Shift was down to extend from the last row touched. So the
 * modifier is caught on the way IN, on the wrapper, and read back inside
 * `onChange`. Capture phase, because the input's change fires after the
 * mousedown that produced it, and the keyboard path (Space) is caught the same
 * way so shift-Space extends a range exactly as shift-click does.
 */
function Pick({ item, selection }: { item: ApprovalQueueItem; selection: Selection }) {
  const shift = React.useRef(false);
  const title = stripAutoPrefix(item.title);
  return (
    <span
      className="today-pick"
      onMouseDownCapture={(e) => {
        shift.current = e.shiftKey;
      }}
      onKeyDownCapture={(e) => {
        shift.current = e.shiftKey;
      }}
    >
      <Checkbox
        checked={selection.has(item.id)}
        onChange={() => selection.toggle(item.id, { shiftKey: shift.current })}
        label={`Select: ${title}`}
      />
    </span>
  );
}

/**
 * One decision, opened: who raised it, what it asks, what backs it, and the
 * verbs. This is the whole of what a call looks like on this surface, and both
 * modes render THIS — see the note at the top of the file.
 *
 * `pick` is the row's tick box, passed in only while walking. On arrival there
 * is nothing to select it against.
 */
function OpenCall({
  item,
  position,
  total,
  verbs,
  onOpenAgent,
  pick,
}: {
  item: ApprovalQueueItem;
  position: number;
  total: number;
  verbs: QueueVerbs;
  onOpenAgent: (slug: string) => void;
  pick?: React.ReactNode;
}) {
  /* The evidence opens HERE. This used to read "N more facts are attached in
     Approvals", which is a sentence that names a door and is not one: the
     reader had to leave the decision to finish reading the argument for it.
     Mounted with the call's id as its key by the caller, so a call opened to
     full depth never hands its depth to the next one. */
  const [showAll, setShowAll] = React.useState(false);
  const facts = showAll ? item.evidence : item.evidence.slice(0, 3);
  const hidden = item.evidence.length - facts.length;

  return (
    <div className="today-open">
      <div className="today-open-meta">
        {pick}
        {item.agentSlug ? (
          <Door
            title="Open this agent in the crew"
            onClick={() => onOpenAgent(item.agentSlug as string)}
          >
            <span className="today-open-who">
              {/* The ONE blink on the surface. Every other mark in the list
                  wears `waiting`, which is the same ember standing still. */}
              <AgentMark slug={item.agentSlug} state="gate" />
              <span>{agentDisplayName(item.agentSlug)}</span>
            </span>
          </Door>
        ) : (
          <span>{agentDisplayName(item.agentSlug)}</span>
        )}
        <span>{item.projectName ?? item.project ?? "This workspace"}</span>
        {item.impact ? <span>{item.impact}</span> : null}
        <span className="today-open-pos">
          <Num>{position}</Num> of <Num>{total}</Num>
        </span>
      </div>

      <Gate
        question={stripAutoPrefix(item.title)}
        linesLabel={item.evidence.length ? "Why this needs your call" : undefined}
        lines={[
          ...facts.map((line, i) => <span key={`fact-${i}`}>{stripAutoPrefix(line)}</span>),
          ...(hidden > 0
            ? [
                <Door key="all" title="Open the rest here" onClick={() => setShowAll(true)}>
                  Show all <Num>{item.evidence.length}</Num> facts
                </Door>,
              ]
            : []),
          <span key="consequence">{item.approveConsequence}</span>,
        ]}
      >
        {/* TIER: Approve. The click releases a decision held for you - the work
            is stopped until it lands. */}
        <Approve shortcut="a" busy={verbs.busy} onClick={() => verbs.approve(item)}>
          Approve
        </Approve>
        {/* ABSENT, NEVER DISABLED. Only `spec` and `design_gate` can be revised;
            every other kind throws on the server. A disabled control with no
            path forward is worse than no control, so the verb simply is not
            drawn — the rule `canSendBack` exists to enforce. */}
        {canSendBack(item.kindKey) ? (
          // TIER: Action, default face. Settles the held call by returning it -
          // the negative verdict, not the release.
          <Action
            busy={verbs.busy}
            onClick={() => verbs.sendBack(item)}
            title="Return it to the agent with a note saying what to fix"
          >
            Send back
          </Action>
        ) : null}
        {/* TIER: Action, default face. Declines the held call - a verdict, not
            the affirmative release. */}
        <Action shortcut="d" busy={verbs.busy} onClick={() => verbs.decline(item)}>
          Decline
        </Action>
        {/* TIER: Action, quiet face. Defers the call; nothing is settled. */}
        <Action variant="quiet" shortcut="z" busy={verbs.busy} onClick={() => verbs.snooze(item)}>
          Snooze
        </Action>
      </Gate>
    </div>
  );
}

/**
 * THE LEGEND TEACHES ONLY THE KEYS THAT HAVE NO CONTROL TO SIT ON.
 *
 * `a`, `d` and `z` are printed on the buttons themselves by `Button shortcut`,
 * so naming them again here would be one label saying one thing twice (hard ban
 * 10). `j`, `k` and Escape have nowhere else to be named, and this is the only
 * place they appear.
 *
 * It renders only where those keys are genuinely live: `j`/`k` are pointless
 * with one item, and Escape leaves a mode you are not in. The surface has been
 * bitten once by copy that taught a key bound to nothing, and the fix is not to
 * write better copy, it is to derive the copy from the binding.
 */
function Keys({ walking, many }: { walking: boolean; many: boolean }) {
  if (!many && !walking) return null;
  return (
    <p className="today-keys">
      {many ? (
        <>
          <kbd>j</kbd>
          <kbd>k</kbd> {walking ? "move" : "walk the queue"}
        </>
      ) : null}
      {walking ? (
        <>
          {many ? " · " : null}
          <kbd>Esc</kbd> leaves the queue
        </>
      ) : null}
    </p>
  );
}

export function DecisionQueue({
  items,
  focused,
  onFocus,
  walking,
  onWalk,
  onLeave,
  selection,
  verbs,
  bulk,
  onOpenAgent,
}: {
  /** Every decision waiting, in the order the reader will walk them. */
  items: ApprovalQueueItem[];
  /** The one that is open. Never null: the caller guarantees a non-empty list. */
  focused: ApprovalQueueItem;
  onFocus: (id: string) => void;
  /** True once the reader has deliberately entered the queue. */
  walking: boolean;
  onWalk: () => void;
  onLeave: () => void;
  selection: Selection;
  verbs: QueueVerbs;
  bulk: BulkVerbs;
  onOpenAgent: (slug: string) => void;
}) {
  const index = Math.max(
    0,
    items.findIndex((i) => i.id === focused.id),
  );

  /**
   * THE KEYBOARD. Every binding this surface has ever had is preserved letter
   * for letter — `a` approves, `d` declines, `z` snoozes — and the two guards
   * in front of them are the house pattern, unchanged.
   *
   * WHY THE GUARDS COME FIRST AND WHAT THEY COST WHEN THEY DO NOT. `e.key` on
   * a Cmd+A keydown is exactly "a": the modifier lives on a separate field, so
   * a handler that reads only `key` turns select-all into an approval, and
   * `decideApprovalItem` writes to the record with no undo. The modal check is
   * the same defect one layer up: press `?`, read the row that says "a —
   * approves the call in front of you", press `a`, and the call behind the
   * scrim is settled by the sheet that documented the key. The send-back sheet
   * declares `aria-modal`, so this covers it too and a person typing a note
   * cannot decline the thing they are writing about.
   *
   * `j` AND `k` WALK THE QUEUE IN BOTH MODES, which is the point of them being
   * here rather than only in the walking list. On arrival they swap which
   * single decision is open, so a person can look through all forty without
   * ever seeing two at once; while walking they move the open row down the
   * list. Same items, same verbs, same letters — which is why a shortcut
   * printed on a button is always bound to the decision that button belongs
   * to. That equivalence is the whole reason the queue is a mode rather than a
   * second surface.
   *
   * ESCAPE LEAVES ONE LAYER PER PRESS. `SelectionBar` owns Escape while a
   * selection is live, so this stands down until the selection is empty and
   * the second press leaves the queue.
   */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (isModalOpen()) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))
      ) {
        return;
      }

      if (e.key === "Escape") {
        if (!walking || selection.count > 0) return;
        e.preventDefault();
        onLeave();
        return;
      }

      if (items.length === 0) return;
      const at = Math.max(
        0,
        items.findIndex((i) => i.id === focused.id),
      );

      if (e.key === "j") {
        e.preventDefault();
        onFocus(items[Math.min(items.length - 1, at + 1)].id);
        return;
      }
      if (e.key === "k") {
        e.preventDefault();
        onFocus(items[Math.max(0, at - 1)].id);
        return;
      }

      if (verbs.busy) return;
      if (e.key === "a") verbs.approve(focused);
      else if (e.key === "d") verbs.decline(focused);
      else if (e.key === "z") verbs.snooze(focused);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [items, focused, walking, onLeave, onFocus, selection.count, verbs]);

  if (!walking) {
    return (
      <>
        <OpenCall
          key={focused.id}
          item={focused}
          position={index + 1}
          total={items.length}
          verbs={verbs}
          onOpenAgent={onOpenAgent}
        />
        <div className="today-after">
          {items.length > 1 ? (
            <Door onClick={onWalk} title="See every one, and settle several at once">
              Walk the queue · <Num>{items.length - 1}</Num> more
            </Door>
          ) : null}
          <Keys walking={false} many={items.length > 1} />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="today-queue-head">
        <Door onClick={onLeave} title="Back to one decision at a time">
          One at a time
        </Door>
        {/* SelectionBar only appears once something is picked, which leaves a
            person holding forty decisions no way to start. This is that start,
            and it stands down the moment the bar can offer it instead. */}
        {selection.count === 0 && items.length > 1 ? (
          <Door onClick={selection.selectAll} title="Select every decision in this list">
            Select all <Num>{items.length}</Num>
          </Door>
        ) : null}
      </div>

      <SelectionBar selection={selection} total={items.length} noun="decision">
        {/* TIER: Approve. Bulk-releases every selected decision. */}
        <Approve busy={verbs.busy} onClick={bulk.approve}>
          Approve
        </Approve>
        {/* TIER: Action, quiet face. Defers the selection; nothing settles. */}
        <Action variant="quiet" busy={verbs.busy} onClick={bulk.snooze}>
          Snooze
        </Action>
        {/* TIER: Action, default face. Declines the selection - a verdict. */}
        <Action busy={verbs.busy} onClick={bulk.decline}>
          Decline
        </Action>
      </SelectionBar>

      <div className="today-queue">
        {items.map((item, i) =>
          item.id === focused.id ? (
            <OpenCall
              key={item.id}
              item={item}
              position={i + 1}
              total={items.length}
              verbs={verbs}
              onOpenAgent={onOpenAgent}
              pick={<Pick item={item} selection={selection} />}
            />
          ) : (
            <Row
              key={item.id}
              tight
              marks={<AgentMark slug={item.agentSlug} state="waiting" />}
              lead={stripAutoPrefix(item.title)}
              sub={`${agentDisplayName(item.agentSlug)} · ${item.projectName ?? item.project ?? "This workspace"}`}
              time={ago(item.timestamp)}
              onClick={() => onFocus(item.id)}
              action={<Pick item={item} selection={selection} />}
            />
          ),
        )}
      </div>

      <Keys walking many={items.length > 1} />
    </>
  );
}
