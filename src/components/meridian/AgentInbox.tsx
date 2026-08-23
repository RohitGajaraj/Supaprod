import * as React from "react";

import { agentDisplayName } from "@/lib/agent-vocabulary";
import { ReasonField } from "./forms";
import { AgentMark, type MarkState } from "./marks";
import { RUN_LINE, RunMeta, RunNote } from "./run-rows";
import { StatusChip, type StatusWord } from "./StatusChip";
import { Action, Actions } from "./surface-parts";

/*
 * THE AGENT INBOX: sorted by who needs you, never by who is working.
 *
 * ── THE INSTINCT THIS IS BUILT AGAINST ──────────────────────────────────
 * The reflex in an agent product is to render every agent working at once,
 * because that is the thing that looks impressive. The evidence says it is the
 * wrong surface. **Showing many agents WORKING is bad; showing many agents
 * NEEDING YOU is good.** Cursor shipped eight-way parallelism with no
 * compare-and-pick surface and per-turn review died with it. Human active focus
 * caps at three or four items, and Anthropic's own sizing guidance is blunt:
 * three focused teammates often outperform five scattered ones.
 *
 * ── AND THE REASON IT IS THE PRODUCT RATHER THAN A PANEL ────────────────
 * Across 22,000 developers over two years: throughput rose 33.7% while median
 * review time rose 441.5% and PRs merged with ZERO review rose 31.3%. Generation
 * is commoditised. **The review surface is the bottleneck, so the review surface
 * is the product.**
 *
 * That is why the grouping is by WHAT IT NEEDS FROM A PERSON and never by station
 * or by agent. A list grouped by station is a dashboard of activity: it answers
 * "what is the machine doing", which is the question nobody opens the app with.
 *
 * ── THE REFERENCE IS LINEAR'S INBOX, READ OFF ITS DOCS ──────────────────
 * Lifted, not admired: `J`/`K` and the arrows move a selection through the list
 * with ONE tab stop for the whole thing, and opening a row does not leave the
 * inbox. Both are the mechanics that turn a list into a triage surface, and both
 * are what this repo would otherwise have invented worse.
 *
 * NOT lifted: Linear groups by notification TYPE and carries read/unread.
 * An agent session has no read state, it has a NEED, and grouping by type here
 * would rebuild the activity dashboard this component exists instead of. Its
 * snooze is also replaced rather than ported: a row goes quiet on its own when
 * nothing has happened, so nobody has to tell the product "not now".
 *
 * ── WHAT THIS IS NOT ────────────────────────────────────────────────────
 * It is not `StalledWork`, and the two must not merge. That one headlines the
 * COST of work being stopped, tiered by how long, and its population is the gates.
 * This one lists every session and sorts them by what they need. They overlap on
 * one group of four, and if they ever disagree about that group the fault is in
 * whatever feeds them rather than here.
 */

/**
 * The four groups, in reading order, and the order is the component.
 *
 * `needs-input` first because it is the only one where nothing happens until a
 * person acts. `done` last because it is the only one that is finished, and a
 * finished thing at the top of an inbox is a list sorted by recency, which is the
 * default every inbox falls into and the one this is arguing against.
 */
export type InboxNeed = "needs-input" | "ready" | "working" | "done";

const GROUP_ORDER: readonly InboxNeed[] = ["needs-input", "ready", "working", "done"];

/**
 * The heading says what the group needs, in the second person where a person is
 * required and in the third where they are not. That switch is the whole
 * information design: two of these are yours and two are the machine's.
 */
const GROUP_TITLE: Record<InboxNeed, string> = {
  "needs-input": "Waiting on you",
  ready: "Ready for you to look at",
  working: "Running",
  done: "Finished",
};

/**
 * A CHIP ONLY WHERE SOMETHING IS REQUIRED OR RUNNING, which is the same rule
 * `PlanCard`, `RunTimeline`, `ToolStream` and `RunMap` all apply. A chip on every
 * row of four groups makes the group that matters invisible, and the group
 * heading already says what the row needs.
 */
const GROUP_CHIP: Partial<Record<InboxNeed, { status: StatusWord; word: string }>> = {
  "needs-input": { status: "you", word: "Needs you" },
};

/** The mark's own state, so the presence layer agrees with the group. */
const MARK_STATE: Record<InboxNeed, MarkState> = {
  "needs-input": "gate",
  ready: "waiting",
  working: "running",
  done: "verified",
};

/**
 * WHEN A RUNNING SESSION COUNTS AS IDLE, and the number is derived rather than
 * chosen.
 *
 * `track-tick` drives the spine every ten minutes. So a session that has moved
 * inside the last tick is live by the system's own clock, and one that has not is
 * idle by it. Picking a rounder number would have been a taste call about
 * something the product already decides.
 */
export const IDLE_AFTER_MS = 10 * 60 * 1000;

/**
 * HOW MANY IDLE ROWS BEFORE THEY COLLAPSE. Three, and it is the same three the
 * whole component is arguing from: active human focus caps at three or four
 * items, so the fourth idle row is the one that starts costing attention without
 * paying anything back.
 */
export const IDLE_COLLAPSE_AT = 3;

export type AgentSession = {
  id: string;
  /** The work, in a reader's words. Never a tool, never a run id. */
  title: string;
  need: InboxNeed;
  /**
   * WHAT IT IS DOING, AS A PRESENT PARTICIPLE. "reading Intercom",
   * "waiting on you", "opening the pull request". Never an adjective and never a
   * status word: "blocked" tells a reader a category, "waiting on your answer
   * about the migration" tells them what to do.
   *
   * The component does not compose this and deliberately cannot: only the caller
   * knows what the agent is actually touching, and inventing a generic sentence
   * per group is how ten screens end up with one sentence between them.
   *
   * ── IT IS A NODE RATHER THAN A STRING, 2026-08-22, AND THAT IS THE SAME
   *    ARGUMENT ONE STEP FURTHER ────────────────────────────────────────────
   * The first caller outside the gallery is Today, whose rows already say their
   * state through `RunState` — a component, not a word, because in that mapping
   * the HUE is load-bearing: orchid says a person is required, azure says a
   * machine is working, and `cancelled` and `halted` are two facts sharing one
   * state. Flattening that to a string would have kept the sentence and dropped
   * the distinction, which is exactly the "hiding information" ratchet law 1
   * forbids, done quietly at a type boundary.
   *
   * So the type widened rather than the caller narrowing. What did NOT change is
   * whose sentence it is: still the caller's, still never composed here.
   */
  activity: React.ReactNode;
  /** Epoch ms of the last thing that happened. Drives idle; never a string. */
  at: number;
  agentSlug?: string | null;
  /** The question, when the session is asking one. Shown on `needs-input` only. */
  asking?: string;
  /**
   * IT BROKE. A separate axis from `need`, deliberately, and the reason is a law
   * rather than a convenience.
   *
   * There is no fifth group for failure and there must not be. Grouping is by what
   * a session needs from a person; failing is an OUTCOME, and an outcome is not a
   * need. A failed run still has to say which of the four it wants: most sit in
   * `ready`, because the machine has finished and it is now your turn, and one that
   * stopped mid-way asking what to do next is `needs-input`.
   *
   * FOUND BY BUILDING THE COMPOSED CASES the acceptance asks for, which is what
   * that requirement is for. "One agent failed" had nowhere to live in a four-value
   * union, and the tempting fix was a fifth group. That would have mixed the two
   * axes and made "failed and waiting on you" unrenderable.
   */
  failed?: boolean;
  /** Opens the session. Omitted, the row is not a control. */
  onOpen?: () => void;
  /**
   * ANSWER WITHOUT LEAVING. Omitted, no reply field is drawn, which is the same
   * rule `PlanCard` follows for its gate: a plausible-looking control on a row
   * nobody can answer is the affordance failure this system keeps finding.
   */
  onReply?: (text: string) => void;
};

function Row({
  session,
  selected,
  entry = false,
  replying,
  onAskReply,
  onCloseReply,
}: {
  session: AgentSession;
  selected: boolean;
  /** The list's single resident tab stop while nothing is selected. See the
   *  argument at the call site: without it the inbox is unreachable by keyboard. */
  entry?: boolean;
  replying: boolean;
  onAskReply: () => void;
  onCloseReply: () => void;
}) {
  const who = session.agentSlug ? agentDisplayName(session.agentSlug) : null;
  /* The outcome outranks the need on the chip: "Failed" is the thing to read
     first, and the group heading is already saying what it needs. */
  const chip: { status: StatusWord; word: string } | undefined = session.failed
    ? { status: "fail", word: "Failed" }
    : GROUP_CHIP[session.need];

  return (
    <>
      <div
        data-mrd=""
        id={`agent-inbox-row-${session.id}`}
        /*
         * ONE TAB STOP FOR THE WHOLE LIST, which is Linear's mechanic and the
         * difference between a triage surface and a list of links. Sixty sessions
         * would otherwise be sixty tab stops between the inbox and anything after
         * it.
         *
         * `role="option"` on a DIV rather than an `<li>`, and the whole component
         * is divs for the same reason: an `option` has to be a descendant of its
         * `listbox` with only `group` in between, and the reply field puts a form
         * inside a row. A `<ul>` of `<li>` carrying that markup is invalid where
         * this is merely plain.
         */
        tabIndex={selected || entry ? 0 : -1}
        role="option"
        aria-selected={selected}
        /*
         * NO FOCUS HANDLER, AND ITS ABSENCE IS THE FIX FOR A LIVE HANG.
         *
         * It had one: focus set the selection, and `move()` set the selection and
         * then moved focus. That is a two-way binding, and with the accelerator's
         * text-control guard removed it looped until the test runner was killed
         * rather than failing. Found by planting that guard, which is the only
         * reason it was found at all: the loop needs a keystroke to arrive from
         * inside the reply field, which nothing does while the guard holds.
         *
         * A latent infinite loop in a component meant to render sixty rows is worth
         * more than the convenience it bought. `move()` is now the ONE writer of the
         * selection, and clicking a row opens it rather than selecting it, which is
         * what a click on an inbox row means anyway.
         */
        onClick={() => session.onOpen?.()}
        className={`flex w-full items-start gap-mrd-3 rounded-mrd-ctl px-mrd-3 py-mrd-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mrd-focus)] ${
          session.onOpen ? "cursor-pointer hover:bg-mrd-hover" : ""
        }`}
        style={{ transitionDuration: "var(--mrd-d-press)" }}
      >
        <AgentMark
          slug={session.agentSlug}
          state={session.failed ? "failed" : MARK_STATE[session.need]}
        />

        <span className="flex min-w-0 flex-1 flex-col">
          <span className={RUN_LINE}>
            {/* `min-w-0 truncate` on the title is what keeps a 90-character piece
                of work from pushing the chip off the row. */}
            <span className="min-w-0 truncate text-mrd-label font-medium text-mrd-ink">
              {session.title}
            </span>
            {chip ? <StatusChip status={chip.status}>{chip.word}</StatusChip> : null}
          </span>

          {/* The participle, and the agent that owns it, in one line: the format
              is `Research · reading Intercom`, applied to every row including the
              ones where the agent is unknown. */}
          <RunMeta>
            {who ? `${who} · ` : ""}
            {session.activity}
          </RunMeta>

          {session.asking ? <RunNote>{session.asking}</RunNote> : null}

          {replying && session.onReply ? (
            <ReasonField
              id={`agent-inbox-reply-${session.id}`}
              label={`Answer ${who ?? "this"}`}
              hint="It goes back to the run as your answer, and the work carries on from there."
              placeholder="Use the shorter verify step, and leave the migration for later"
              commitLabel="Send it"
              cancelLabel="Not now"
              onCommit={(text) => {
                session.onReply?.(text);
                onCloseReply();
              }}
              onCancel={onCloseReply}
            />
          ) : session.onReply ? (
            <Actions className="mt-mrd-2">
              <Action
                variant="quiet"
                onClick={(event) => {
                  /* The row is a control too, and this is inside it. Without this
                     the reply opens and the row navigates in the same click. */
                  event.stopPropagation();
                  onAskReply();
                }}
              >
                Answer it
              </Action>
            </Actions>
          ) : null}
        </span>
      </div>
    </>
  );
}

export function AgentInbox({
  sessions,
  now = Date.now(),
  label = "What the crew needs from you",
  maxPerGroup,
  groupNote,
}: {
  sessions: AgentSession[];
  /** Injectable so this renders deterministically in a test or a screenshot. */
  now?: number;
  label?: string;
  /**
   * HOW MANY ROWS OF A GROUP STAND OPEN, and the rest go behind one control that
   * says how many they are. Omitted, every row stands, which is what a dedicated
   * inbox surface wants.
   *
   * ── WHY IT EXISTS, AND WHY IT IS NOT A CAP ──────────────────────────────
   * Added for Today, which is a SCAN BAND rather than a list: it draws four
   * sections above the fold and its whole job is deciding what not to show. The
   * lanes this replaced showed three rows each, and the defect measured there on
   * 2026-08-11 was not the three — it was that the heading counted four and the
   * body drew three, with nothing on the surface reconciling them.
   *
   * So this is the IDLE COLLAPSE one level up, deliberately the same mechanic
   * and not a second one: the count is on screen with no press, the control says
   * how many are behind it, and it opens IN PLACE. Nothing here ever renders
   * `slice(0, n)` and stops, because a list that quietly shows five of nine is a
   * list nobody can trust.
   */
  maxPerGroup?: number;
  /**
   * ONE SENTENCE UNDER A GROUP'S HEADING, saying what that group COSTS.
   *
   * The heading says what a group needs and the count says how many. Neither can
   * say the thing a reader actually weighs before choosing which group to open:
   * that undoing a shipped run costs a rollback, that a running one is waiting on
   * an agent and not on you, that nothing has happened yet on a pending call so
   * undo is free. Today's lanes carried exactly those three sentences, one per
   * lane, and they are the reason that surface reads as judgement rather than as
   * a count.
   *
   * SO IT IS A SLOT AND NOT A TABLE IN THIS FILE. The sentence is a claim about
   * the caller's own population — Today's runs are reversible in ways an
   * approvals queue's are not — and a default written here would be one sentence
   * shared by ten screens, which is the failure `activity` is already guarded
   * against. A group with nothing to say passes nothing and draws nothing.
   */
  groupNote?: Partial<Record<InboxNeed, React.ReactNode>>;
}) {
  const [selected, setSelected] = React.useState<string | null>(null);
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null);
  const [idleOpen, setIdleOpen] = React.useState(false);
  /* Which groups have their overflow open. A list rather than one value: two
     groups can be open at once, and forcing them to take turns would be a rule
     the reader has to discover by having a section close under them. */
  const [openGroups, setOpenGroups] = React.useState<InboxNeed[]>([]);
  const groupOpen = (need: InboxNeed) => openGroups.includes(need);
  const toggleGroup = (need: InboxNeed) =>
    setOpenGroups((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need],
    );

  /*
   * IDLE IS A PROPERTY OF A RUNNING SESSION AND OF NOTHING ELSE. A session
   * waiting on a person has not gone quiet, it is waiting, and hiding it because
   * nothing has happened for ten minutes would hide the only rows that matter.
   */
  const isIdle = (s: AgentSession) =>
    s.need === "working" && !s.failed && now - s.at >= IDLE_AFTER_MS;

  const grouped = GROUP_ORDER.map((need) => {
    const rows = sessions.filter((s) => s.need === need);
    const idle = need === "working" ? rows.filter(isIdle) : [];
    const collapse = idle.length > IDLE_COLLAPSE_AT;
    /* Newest first inside a group. Between groups the order is the need. */
    const standing = (collapse ? rows.filter((s) => !isIdle(s)) : rows).sort((a, b) => b.at - a.at);
    /* The cut is taken AFTER the sort and AFTER the idle split, so what stands
       open is the newest live work rather than whatever the filter happened to
       reach first, and the quiet ones keep their own control and their own
       sentence rather than being absorbed into a bare count. */
    const cut = maxPerGroup ?? standing.length;
    return {
      need,
      rows: standing.slice(0, cut),
      over: standing.slice(cut),
      idle: collapse ? idle.sort((a, b) => b.at - a.at) : [],
    };
  }).filter((g) => g.rows.length > 0 || g.over.length > 0 || g.idle.length > 0);

  /* The flattened visible order, which is what the keyboard moves through. A row
     behind a closed control is not on screen, so `j` may not land on it. */
  const order = grouped.flatMap((g) => [
    ...g.rows.map((r) => r.id),
    ...(groupOpen(g.need) ? g.over.map((r) => r.id) : []),
    ...(idleOpen ? g.idle.map((r) => r.id) : []),
  ]);

  const move = (delta: number) => {
    if (order.length === 0) return;
    /*
     * NEVER TAKE FOCUS OFF A TEXT CONTROL, and this guard is here rather than only
     * at the keydown handler because THIS is the dangerous act.
     *
     * Bisected 2026-08-20: with the keydown guard removed, a keystroke arriving
     * from inside the reply field reached this function, the `focus()` below pulled
     * focus out of an input carrying `autoFocus`, and the suite HUNG rather than
     * failing. Removing the `focus()` call made the hang go away, which is what
     * identified it. A test that hangs cannot tell a defect from broken
     * infrastructure, and a component that renders sixty rows must not have a loop
     * one missing guard away.
     *
     * So the two guards protect different things and both are needed. The one at
     * the keydown handler stops `preventDefault` swallowing a letter somebody is
     * typing. This one makes the loop impossible however `move` is reached.
     */
    const active = document.activeElement as HTMLElement | null;
    const tag = active?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || active?.isContentEditable) return;
    const at = selected ? order.indexOf(selected) : -1;
    const next = at === -1 ? 0 : (at + delta + order.length) % order.length;
    const id = order[next]!;
    setSelected(id);
    /* Focus follows selection rather than the other way round, so the browser's
       own scroll-into-view does the scrolling and this does not reimplement it. */
    document.getElementById(`agent-inbox-row-${id}`)?.focus();
  };

  if (sessions.length === 0) {
    /*
     * A GOOD STATE, DRAWN QUIETLY, and the same choice `StalledWork` makes: an
     * empty inbox is the thing everyone wants, so it gets one sentence and
     * silence rather than an illustration and a call to action.
     *
     * `data-mrd` on the early return too, or its controls lose the focus ring.
     */
    return (
      <div data-mrd="" className="w-full max-w-[560px] font-mrd">
        <p className="text-mrd-base font-medium text-mrd-body">Nothing needs you.</p>
        <p className="mt-1 max-w-[62ch] text-mrd-small leading-mrd-prose text-mrd-mute">
          No run is waiting on an answer and nothing is asking to be looked at. When one is, it
          arrives here rather than in a notification you have to go and find.
        </p>
      </div>
    );
  }

  return (
    <div
      data-mrd=""
      className="w-full max-w-[560px] font-mrd"
      /*
       * `J`/`K` AS WELL AS THE ARROWS, lifted from Linear's inbox rather than
       * invented. Guarded off text controls for the same reason `PlanGate`'s
       * number keys are: the reply field is inside this subtree, and "j" is a
       * letter somebody is trying to type.
       */
      onKeyDown={(event) => {
        if (event.metaKey || event.ctrlKey || event.altKey) return;
        const el = event.target as HTMLElement | null;
        const tag = el?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || el?.isContentEditable) return;
        if (event.key === "ArrowDown" || event.key === "j") {
          event.preventDefault();
          move(1);
        }
        if (event.key === "ArrowUp" || event.key === "k") {
          event.preventDefault();
          move(-1);
        }
      }}
    >
      <div role="listbox" aria-label={label} className="flex flex-col gap-mrd-5">
        {grouped.map((group) => {
          const rowProps = (session: AgentSession) => ({
            session,
            selected: selected === session.id,
            /*
             * THE WAY IN, AND WITHOUT IT THE LIST HAD NONE.
             *
             * A roving tabindex needs exactly one resident `0`, and this one had
             * none until something was selected. Every row read `-1`, the wrapper
             * carrying the keydown handler has no `tabIndex` of its own, and the
             * listbox computed `-1` too, so measured in a real browser **25
             * consecutive Tab presses never landed inside the inbox.** The only
             * way in was a mouse, and clicking focuses a row without selecting it
             * on purpose (see the note on the missing focus handler above), so the
             * keyboard shortcuts stayed unreachable until a click and then a `j`.
             *
             * `entry` is true for the FIRST row in the flattened visible order
             * while nothing is selected, and false the instant something is. So
             * the count of tabbable rows is exactly one at every moment, which is
             * the whole contract, and Tab lands on the top of the list, which is
             * the row a triage surface should hand you first.
             */
            entry: selected === null && order[0] === session.id,
            replying: replyingTo === session.id,
            onAskReply: () => setReplyingTo(session.id),
            onCloseReply: () => setReplyingTo(null),
          });

          return (
            <div key={group.need} role="group" aria-label={GROUP_TITLE[group.need]}>
              {/*
               * The count is on the heading rather than on each row, because the
               * number a person wants is how many are waiting, and repeating a
               * total per row is how a list starts shouting.
               */}
              <h3 className="mb-mrd-2 flex items-baseline gap-2 px-mrd-3 mrd-eyebrow">
                {GROUP_TITLE[group.need]}
                <span className="font-mrd-mono tabular-nums text-mrd-faint">
                  {group.rows.length + group.over.length + group.idle.length}
                </span>
              </h3>

              {/* What the group costs, in the caller's words. Normal weight under
                  a medium-weight heading, so it reads as the heading's second
                  line rather than as a second heading. */}
              {groupNote?.[group.need] ? (
                <p className="mb-mrd-2 max-w-[62ch] px-mrd-3 text-mrd-data leading-mrd-prose text-mrd-mute">
                  {groupNote[group.need]}
                </p>
              ) : null}

              {group.rows.map((session) => (
                <Row key={session.id} {...rowProps(session)} />
              ))}

              {/*
               * THE ROWS PAST THE CUT, and the heading above already counted
               * them. One control, the real number, and it opens in place — see
               * `maxPerGroup` for why this is the idle mechanic one level up
               * rather than a second collapse with its own manners.
               */}
              {group.over.length > 0 ? (
                <>
                  <Actions className="px-mrd-3 py-mrd-2">
                    <Action variant="quiet" onClick={() => toggleGroup(group.need)}>
                      {groupOpen(group.need) ? "Show fewer" : `${group.over.length} more`}
                    </Action>
                  </Actions>
                  {groupOpen(group.need)
                    ? group.over.map((session) => <Row key={session.id} {...rowProps(session)} />)
                    : null}
                </>
              ) : null}

              {/*
               * THE COLLAPSED IDLE ROWS, AND THE NUMBER IS REAL. Past three, they
               * become one line rather than being dropped: silent truncation is
               * the defect this repo has already recorded twice, and a list that
               * quietly shows five of nine is a list nobody can trust. It says how
               * many and it opens.
               */}
              {group.idle.length > 0 ? (
                <>
                  <Actions className="px-mrd-3 py-mrd-2">
                    <Action variant="quiet" onClick={() => setIdleOpen((v) => !v)}>
                      {idleOpen
                        ? "Hide the quiet ones"
                        : `${group.idle.length} agents have gone quiet`}
                    </Action>
                  </Actions>
                  {idleOpen
                    ? group.idle.map((session) => <Row key={session.id} {...rowProps(session)} />)
                    : null}
                </>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AgentInbox;
