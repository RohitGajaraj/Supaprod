/**
 * One ranked bet in full. This is the depth behind a queue row, so everything
 * the row stopped drawing lives here and nothing here is a second copy of the
 * row.
 *
 * Ported off the retired system (2026-07-29). What changed, and why:
 *
 * KILL the DetailKit shell. DetailHeader drew its own chip rail and trace tail,
 *      DetailSection drew a heading register of its own, and the priority band
 *      was a bordered card sitting inside a bordered sheet. Sections are now
 *      `Block`, which is a rule rather than a box: one bordered container per
 *      region, and the sheet is the region.
 * KILL the four-cell ICE strip. Four tinted stat tiles for four small integers
 *      is decoration doing a sentence's job; the scores are one quiet line.
 * KILL the verdict chip, the confidence chip and the "Move to" chip in the
 *      header. What the Critic concluded is a sentence with a name in front of
 *      it, at the confidence the Critic actually disclosed. The status menu is
 *      an action, so it sits with the actions.
 * KILL the designation's stock explanation. It said what to do, and the
 *      ranking's own `nextAction` says what to do about THIS bet. Two of those
 *      is the same sentence twice (hard ban 10); the specific one wins.
 * KEEP every server function, query key, mutation and prop. The brief link
 *      still writes through setOpportunityBriefLink and still invalidates
 *      ["opportunities"] and ["brief-alignment"]; the judgment read still uses
 *      ["opportunity-judgment", id].
 *
 * THE MOMENT. The precedent is the record speaking, so it renders in the
 * record recess, the one lit surface in the product, rather than as another
 * paragraph. It arrives at the only instant it can change an outcome: while
 * you are looking at the bet and deciding what to do with it.
 *
 * ATTRIBUTION. Every claim in here says who made it. The teardown wears the
 * Critic's mark, the recorded decision wears the mark of the agent that made
 * it, and a bet nobody has reviewed says so instead of going quiet.
 *
 * ---------------------------------------------------------------------------
 * 2026-08-02, two additions, both of them holes rather than taste:
 *
 * ADD the ICE editor, in place of the read-only "Impact 7 · Confidence 6 · Ease
 *     5 · ICE 6.0" sentence. `updateOpportunity` has accepted those three
 *     numbers since it was written and nothing anywhere sent one, so the record
 *     could tell a person the ranking was wrong and give them no way to say so.
 *     `ice_score` is a generated column and is still never written.
 * ADD "What it promised": roadmap_bucket, roadmap_outcome, roadmap_measure and
 *     roadmap_last_agent_slug, four real columns this sheet did not draw. A
 *     product lead could read the whole record and not learn what had been
 *     committed in their name, or how anyone would check it. Where a lane
 *     carries no outcome or no measure, that gap is named rather than left as a
 *     blank, because roadmap.functions.ts's own governance rule says a placed
 *     commitment must carry both.
 *
 * ---------------------------------------------------------------------------
 * 2026-08-18, MERIDIAN. Every component came off `shell/primitives`: `Block` is
 * `Region`, `Button` is `Action` (and `Approve` nowhere in here, see below),
 * `Empty` is `NothingYet`, `Failed` is `ReadFailedLine` -- the bare half of the
 * pair every time, because every failed read in this file renders inside a
 * region that already draws a container and the standard caps a region at one
 * bordered box -- `Loading`
 * is `Reading`, `PageHead` is `PageHeading`, `Record` is `RecordSpeaks`, and
 * `Field`/`Input`/`Textarea` come from `meridian/forms`. The three local
 * shapes -- `P`, `Stated` and `Meta` -- kept their anatomy and lost their
 * `--sp-*` tokens.
 *
 * THE OVERLAY STAYS, AND IT IS A DECISION. `shell/primitives.tsx` and
 * `governance/CriticBadge.tsx` both record the standing ruling that this system
 * has no pane, slide-over or drawer primitive and that the absence is
 * deliberate. Meridian has none either. The ruling's third reason is the one
 * that decides it: "a pane is not a stylesheet. It is a focus trap, a scroll
 * lock, Escape, focus returned to whatever opened it, and the page behind it
 * made inert. Half of that is an accessibility regression wearing a
 * primitive's name." `ui/sheet` is a Radix Dialog and already supplies all of
 * it, so hand-rolling a replacement would trade working focus management for a
 * `div` -- the exact regression the ruling names. What was retired is the
 * PAINT, and the paint is what moved. The container's mechanics are not a
 * design layer.
 *
 * Rebuilding this record IN PLACE on /decide was the other honest answer and it
 * loses more than it gains: /decide is built around one question in front of
 * you right now, this record is a dozen regions deep, and the route's keyboard
 * guard (`openId` standing down the a/c/d keys while an overlay owns the
 * surface) has no meaning without an overlay to own it.
 *
 * NO `Approve` IN HERE, deliberately. Meridian spends orchid on one meaning --
 * a person is required and this control releases the thing -- and the gate that
 * is literally true of lives on the route. "Draft spec" is the primary here and
 * it is an `Action variant="primary"`: it starts work rather than releasing
 * anything that is currently held.
 *
 * AND THE TWO DROPDOWNS BECAME `Picker`, NOT `MoreMenu`. `ui/dropdown-menu` was
 * the last retired-layer import besides the sheet itself, and `MoreMenu` was
 * the obvious swap and is the wrong one for both of them: its trigger is an
 * unlabelled 26px ellipsis, and BOTH of these triggers were carrying a VALUE
 * ("Not tied to a bet" / the linked bet's title) or a named verb ("Move to").
 * Trading a displayed value for a glyph deletes information to tidy an import.
 *
 * Both are a short, exclusive list of options with a current selection, which
 * is what `Picker` is, and a native select shows its current value, opens with
 * the keyboard and needs no menu behaviour of its own. Each now sits in a
 * `Line` with a real label bound by `htmlFor`, which is two accessible names
 * the dropdown triggers never had.
 *
 * AND THE LANE CONTROL LEFT THE ACTION ROW. "Move to" was a menu among the
 * verbs at the foot of this record -- the exact placement /decide's own header
 * calls out as the reason the lane was unreachable ("buried in a Move to
 * dropdown at the bottom of the open record"). It is a labelled `Line` above
 * the actions now, matching the station, and it SHOWS where the bet sits
 * instead of only offering to change it.
 */

import * as React from "react";
import { failureLine, reasonLine } from "@/lib/error-copy";
import { Row, Line, Who } from "@/components/meridian/rows";
import { Num, Actions, Door } from "@/components/meridian/surface-parts";
import type { ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { listBriefItems } from "@/lib/briefs.functions";
import { setOpportunityBriefLink } from "@/lib/brief-opportunity.functions";
import { getOpportunityJudgment } from "@/lib/decision-judgment.functions";
import { listLearnings } from "@/lib/outcome.functions";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/lib/notify";
import { iceNum, rescoreNoteOf } from "@/lib/moat-vis";
import { formatAuditId } from "@/lib/audit-id";
import { submitPulse } from "@/lib/pulse.functions";
import { startTrack } from "@/lib/spine/track.functions";
import { jobFromOpportunity } from "@/components/start/ExampleJobs";
import { updateOpportunity } from "@/lib/discovery.functions";
import type { CriticReview } from "@/lib/discovery.functions";
import { getTeardownShareState, setTeardownShared } from "@/lib/opportunities-share.functions";
import { StageTimeline } from "@/components/shared/StageTimeline";
import { ProductAnalyticsPanel } from "@/components/product/ProductAnalyticsPanel";
import { CriticBadge } from "@/components/governance/CriticBadge";
import { useWorkspace } from "@/hooks/use-workspace";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  Action,
  NothingYet,
  PageHeading,
  Picker,
  ReadFailedLine,
  Reading,
  RecordSpeaks,
  Region,
  Value,
} from "@/components/meridian/surface-parts";
import { Field, Input, Textarea } from "@/components/meridian/forms";
import { AgentMark } from "@/components/meridian/marks";
import { AgentPulse } from "@/components/meridian/AgentPulse";
import type { VerdictWord } from "./format";
import type { Designation } from "./ranking";
import {
  BestBetStamp,
  DesignationTag,
  OPPORTUNITY_STATUSES,
  STATUS_META,
  StatusPill,
  statusLabel,
  type OpportunityStatus,
} from "./OpportunityRow";

/** The agent that red-teams a bet, named from the one catalog. */
const CHALLENGER = "critic";

/** A recorded outcome is an outcome, so it is one of the three colours that
 * carry one. Nothing else in this sheet reaches for a hue. */
const OUTCOME_TONE: Record<"validated" | "missed" | "mixed", string> = {
  validated: "var(--mrd-pass)",
  missed: "var(--mrd-fail)",
  /* `hold` rather than a warning. A mixed outcome is a result waiting on a
     condition to be read either way, which is what Meridian's amber says, and
     Meridian has no `warn`. */
  mixed: "var(--mrd-hold)",
};

/** The real opportunity columns the sheet reads. Never fabricated: every
 * field maps to an `opportunities` row column. */
export interface OpportunityDetailRecord {
  id: string;
  title: string;
  problem: string;
  hypothesis: string | null;
  target_user: string | null;
  impact: number;
  confidence: number;
  ease: number;
  ice_score: number | null;
  critic_review: CriticReview | null;
  status: string;
  theme_id: string | null;
  created_at: string;
  updated_at: string;
  /**
   * Written by onboarding seeding rather than by a person or an agent.
   *
   * Optional because the column is newer than this interface and the read goes
   * through `select("*")`, so an older cached payload simply omits it. Treat
   * `undefined` as "not a sample", which is the safe reading: mislabelling a
   * real bet as fiction is worse than leaving one example unmarked.
   */
  is_sample?: boolean | null;
  // RPT-47: the strategic top bet a human tied this opportunity to (nullable).
  linked_brief_item_id?: string | null;
  // PC-29 layer 3 (2026-07-17): the agent that recorded the decision behind
  // this bet's linked spec, if any (null until a spec exists and carries a
  // decision with decided_by_agent_slug set).
  decided_by_agent_slug?: string | null;
  // THE COMMITMENT, 2026-08-02. Four real `opportunities` columns that nothing
  // in this sheet rendered, which is why a product lead could read the whole
  // record and still not know what the bet had promised. `roadmap_bucket` is
  // the lane it was placed in, `roadmap_outcome` the result it promised,
  // `roadmap_measure` how that result gets checked, and
  // `roadmap_last_agent_slug` who placed it there when an agent did. They are
  // written by roadmap.functions.ts (`updateRoadmapItem`, `commitRoadmapItem`,
  // and the autonomous roadmap move), and read here. Optional, because a bet
  // that has never reached the roadmap carries none of them.
  roadmap_bucket?: string | null;
  roadmap_outcome?: string | null;
  roadmap_measure?: string | null;
  roadmap_last_agent_slug?: string | null;
}

/* ------------------------------------------------------------------ *
 * Local shapes. Neither is a primitive: one is read-only prose and the
 * other is a label over a paragraph, and the `Field` primitive labels a
 * CONTROL. Reported as a gap rather than invented as a shared shape.
 * ------------------------------------------------------------------ */

/** Supporting prose inside a region. 13px on prose leading, the same stop the
 *  system's other read-this-sentence blocks take. */
function P({ children }: { children: ReactNode }) {
  return <p className="m-0 leading-mrd-prose text-mrd-prose text-mrd-body">{children}</p>;
}

/** One stated fact: a label, and under it the thing itself. ONE label, and the
 * value is never a restatement of it.
 *
 * NOT `Field`, and that is the same call this file's own header made about it
 * before the port: `Field` labels a CONTROL and binds by name, and there is no
 * control here to bind to. A label over a paragraph is a different shape and
 * giving it a `htmlFor` pointing at nothing would be worse than having none. */
function Stated({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="mt-mrd-5">
      <span className="mb-mrd-2 block text-mrd-label font-medium text-mrd-mute">{label}</span>
      <P>{children}</P>
    </div>
  );
}

/** The quiet evidence line under a claim. Numbers inside it wear mono via
 * `Num`; the words around them do not. */
function Meta({ children }: { children: ReactNode }) {
  return <div className="mt-mrd-4 text-mrd-label leading-mrd-snug text-mrd-mute">{children}</div>;
}

/* ------------------------------------------------------------------ *
 * ICE, edited where it is read
 * ------------------------------------------------------------------ */

/** The scored range the server accepts, and the whole range it accepts. */
const SCORE_MIN = 1;
const SCORE_MAX = 10;
/** Long enough to collect a burst of arrow presses into one write, short
 *  enough that nobody sits waiting on a timer. Tab and Enter beat it anyway. */
const ICE_COMMIT_MS = 400;

type Scores = { impact: number; confidence: number; ease: number };

/** A typed score, or the number already there. Never NaN, never out of range:
 *  the server validates 1 to 10 and a rejected write is a worse answer than a
 *  clamped one. */
function clampScore(raw: string, fallback: number): number {
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(SCORE_MAX, Math.max(SCORE_MIN, n));
}

/**
 * The three scores that decide the order of the queue, settable in place.
 *
 * THE DEFECT THIS CLOSES. `updateOpportunity` has accepted impact, confidence
 * and ease since it was written and no caller anywhere sent one, so the three
 * numbers that produce the entire ranking were readable and not settable from
 * inside the product. A person who disagreed with the order had no move at all,
 * which is the opposite of a decision surface.
 *
 * `ice_score` IS NEVER WRITTEN. It is a generated column, ((impact + confidence
 * + ease) / 3), so the three inputs are the only writes and the score follows
 * from them. The line under the fields runs that same arithmetic on the draft,
 * so what it promises and what the column stores can never disagree.
 *
 * FAST AND KEYBOARD FIRST. Real number inputs, so Up and Down step a score with
 * no mouse and no menu. A short debounce folds a burst of presses into one
 * write; Tab and Enter commit at once. Focus selects the field, so typing a new
 * score replaces the old one rather than appending to it.
 *
 * IT NEVER SHOWS A NUMBER THE RECORD REFUSES. Whenever nothing of ours is in
 * flight, the stored scores win: a failed write reverts, and a write from
 * anywhere else lands here.
 *
 * ── WHY THIS IS NOT `meridian/FineTuneCard`, 2026-08-18 ─────────────────
 * It was the packet's nominated replacement and it cannot carry this control.
 * Its contract is the right one -- untouched fields read as the agent's
 * proposal, edited fields read as yours -- and three things in its render make
 * it wrong here, the first of them fatal:
 *
 *   IT ALWAYS DRAWS A LAYOUT PICKER. The row/col/grid segmented control and its
 *   "Layout" heading are unconditional, and the number fields live INSIDE that
 *   same block, so there is no way to render the fields without it. `onLayoutChange`
 *   is optional, so with no handler the glyphs would still change the card's
 *   internal state and flip its header to "Yours" -- a control that changes
 *   nothing while claiming a person overrode something. That is worse than a
 *   dead control: it is a false one, on the surface whose whole subject is
 *   whether the record can be trusted.
 *
 *   IT SEEDS ITS BASELINE ONCE, AT MOUNT, and never re-reads props. This editor's
 *   stated contract is the opposite: whenever nothing of ours is in flight the
 *   STORED scores win, so a refused write reverts. A `key` would paper over it
 *   and would also throw away a half-typed score on every re-render of the
 *   parent.
 *
 *   IT HAS NO SLOT FOR THE LINE UNDERNEATH. "ICE 7.3 · the queue is ordered by
 *   this · saving / not saved yet / that did not save" is where this control
 *   reports the projected average and all three write states. Losing it would
 *   drop states, which the port's floor rule forbids.
 *
 * Reported as a real gap: `FineTuneCard` needs its layout row to be optional
 * before any product surface can adopt it, and that is a change to a Meridian
 * component rather than to this one.
 */
function IceEditor({
  opportunity,
  disabled = false,
  idPrefix = "ice",
}: {
  opportunity: OpportunityDetailRecord;
  disabled?: boolean;
  /** Unique per mounted editor. The queue surface and the open record can both
   *  hold one, and two labels pointing at one id is a broken label. */
  idPrefix?: string;
}) {
  const qc = useQueryClient();
  const fUpdate = useServerFn(updateOpportunity);

  const committed = React.useMemo<Scores>(
    () => ({
      impact: opportunity.impact,
      confidence: opportunity.confidence,
      ease: opportunity.ease,
    }),
    [opportunity.impact, opportunity.confidence, opportunity.ease],
  );

  const [draft, setDraft] = React.useState<Scores>(committed);
  const timer = React.useRef<number | null>(null);

  const save = useMutation({
    mutationFn: (next: Scores) => fUpdate({ data: { id: opportunity.id, ...next } }),
    // The same key Decide and Discover read, so the queue re-ranks itself the
    // moment the score lands rather than on the next visit.
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["opportunities"] }),
    onError: (e: Error) => toast.error(e.message),
  });
  const mutate = save.mutate;
  const saving = save.isPending;

  React.useEffect(() => {
    if (timer.current !== null || saving) return;
    setDraft(committed);
  }, [committed, saving]);

  const commit = React.useCallback(
    (next: Scores) => {
      if (timer.current !== null) {
        window.clearTimeout(timer.current);
        timer.current = null;
      }
      if (
        next.impact === committed.impact &&
        next.confidence === committed.confidence &&
        next.ease === committed.ease
      ) {
        return;
      }
      mutate(next);
    },
    [committed, mutate],
  );

  // Read by the unmount flush below, which runs once and therefore cannot close
  // over the render that scheduled the pending write.
  const latest = React.useRef({ draft, commit });
  React.useEffect(() => {
    latest.current = { draft, commit };
  });

  // A burst still in the debounce must not be lost because the record closed.
  React.useEffect(
    () => () => {
      if (timer.current === null) return;
      window.clearTimeout(timer.current);
      timer.current = null;
      latest.current.commit(latest.current.draft);
    },
    [],
  );

  function edit(key: keyof Scores, value: number) {
    const next = { ...draft, [key]: value };
    setDraft(next);
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      timer.current = null;
      commit(next);
    }, ICE_COMMIT_MS);
  }

  function score(key: keyof Scores, label: string) {
    const id = `${idPrefix}-${key}-${opportunity.id}`;
    return (
      <div style={{ flex: "1 1 76px", minWidth: 76 }}>
        <Field label={label} htmlFor={id}>
          <Input
            id={id}
            type="number"
            inputMode="numeric"
            min={SCORE_MIN}
            max={SCORE_MAX}
            step={1}
            value={draft[key]}
            disabled={disabled}
            className="px-2"
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => edit(key, clampScore(e.target.value, draft[key]))}
            onBlur={() => commit(latest.current.draft)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              e.preventDefault();
              commit(latest.current.draft);
            }}
          />
        </Field>
      </div>
    );
  }

  const dirty =
    draft.impact !== committed.impact ||
    draft.confidence !== committed.confidence ||
    draft.ease !== committed.ease;
  // PostgREST can serialize the `numeric` ice_score column as a string rather
  // than a number (the generated Supabase type lies), so iceNum coerces it the
  // same way moat-vis.ts and decision-judgment.functions.ts do for this column.
  const stored = iceNum(opportunity.ice_score);
  const projected = (draft.impact + draft.confidence + draft.ease) / 3;
  const shown = dirty ? projected : (stored ?? projected);

  return (
    <>
      <div className="flex items-end gap-mrd-4">
        {score("impact", "Impact")}
        {score("confidence", "Confidence")}
        {score("ease", "Ease")}
      </div>
      <Meta>
        {"ICE "}
        <Num>{shown.toFixed(1)}</Num>
        {" · the queue is ordered by this"}
        {saving ? " · saving" : null}
        {!saving && dirty ? " · not saved yet" : null}
        {!saving && !dirty && save.isError ? (
          <>
            {" · "}
            <span className="text-mrd-fail">that did not save</span>
          </>
        ) : null}
      </Meta>
    </>
  );
}

/** The bet's trace id, and the one thing you can actually do with it.
 *
 * REPLACES `AuditTag`, and the replacement removes a DEAD CONTROL rather than
 * restyling one. `AuditTag`'s primary click called `openLineage`, which
 * dispatches a window event that only `AuditLineageSheet` listens for, and that
 * sheet is mounted in exactly one place: `supaprod/AppShell.tsx`, which nothing
 * imports since the shell rebuild. So on every ported surface the trace chip
 * looked like a door and opened nothing. The same defect is live in the other
 * sixteen files that render `AuditTag`; reported rather than fixed here,
 * because those files belong to other lanes.
 *
 * Nothing is lost. This sheet already carries a working lineage door on the
 * "Where it came from" heading, which opens the drawer the route mounts. What
 * survives is the id itself, in mono because an identifier is data, and the
 * copy, which was the only part of the chip that ever worked.
 */
function TraceRef({ id }: { id: string }) {
  const tag = formatAuditId("opportunity", id);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1400);
    return () => window.clearTimeout(t);
  }, [copied]);

  return (
    <>
      <Num>{tag}</Num>{" "}
      {/* `Door`, which is the system's word-inside-a-sentence control: this sits
          in the middle of a meta line, so a real button would break the line's
          rhythm and `.sp-block-more` was the retired layer's version of exactly
          this shape. */}
      <Door
        title="Copy the full id"
        onClick={() => {
          void navigator.clipboard?.writeText(id);
          setCopied(true);
        }}
      >
        {copied ? "Copied" : "Copy id"}
      </Door>
    </>
  );
}

/** Was the teardown any good.
 *
 * REPLACES `PulsePrompt`, which rendered two emoji buttons. Emoji in chrome is
 * a hard ban, and a thumb is not a word: it cannot say WHAT was useful, which
 * is the whole reason the optional note exists underneath it. Same server
 * function, same `PulseSurface`, same two-step shape (the reaction submits on
 * its own so no feedback is lost if the note is never written).
 *
 * No toast. The settled state says what was recorded, in place, which is the
 * same reason every judgment on this surface leaves something behind.
 */
function TeardownPulse({ targetId }: { targetId: string }) {
  const fSubmit = useServerFn(submitPulse);
  const [verdict, setVerdict] = React.useState<"useful" | "not_useful" | null>(null);
  const [note, setNote] = React.useState("");
  const [noteSent, setNoteSent] = React.useState(false);

  const react = useMutation({
    mutationFn: (useful: boolean) => fSubmit({ data: { surface: "teardown", targetId, useful } }),
    onSuccess: (_r, useful) => setVerdict(useful ? "useful" : "not_useful"),
    onError: (e: Error) => toast.error(e.message),
  });

  const sendNote = useMutation({
    mutationFn: () =>
      fSubmit({
        data: {
          surface: "teardown",
          targetId,
          useful: verdict === "useful",
          note: note.trim(),
        },
      }),
    onSuccess: () => setNoteSent(true),
    onError: (e: Error) => toast.error(e.message),
  });

  // Two buttons rather than `Choices`: nothing is picked yet and each one
  // SUBMITS. `Choices` is a value you set and read back, and its "one" mode
  // needs a current pick to hold the roving tab stop, which a question nobody
  // has answered does not have. They sit straight in the Line's control slot,
  // which is already a flex row; an `Actions` around them would be a second
  // flex row inside one that already exists.
  if (!verdict) {
    return (
      <Line label="Was this teardown useful?">
        <Action busy={react.isPending} onClick={() => react.mutate(true)}>
          Yes
        </Action>
        <Action busy={react.isPending} onClick={() => react.mutate(false)}>
          No
        </Action>
      </Line>
    );
  }

  if (noteSent) {
    return (
      <Line label="Was this teardown useful?">
        <Value>Recorded, with your note.</Value>
      </Line>
    );
  }

  return (
    <>
      <Line label="Was this teardown useful?">
        <Value tone={verdict === "useful" ? "pass" : "quiet"}>
          Recorded: {verdict === "useful" ? "useful" : "not useful"}
        </Value>
      </Line>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (note.trim().length >= 2 && !sendNote.isPending) sendNote.mutate();
        }}
      >
        {/* `aria-label` and no `Field`, deliberately: the question is already
            asked by the `Line` above and a second visible label would be the
            same sentence twice. Meridian's `Field` binds by NAME and renders its
            control as a sibling, so wrapping this one would need a `htmlFor`
            pointing at a label that repeats the line above it. */}
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What made you say that?"
          aria-label="Why the teardown was or was not useful"
          rows={2}
        />
        {/* `mt-mrd-4` written here rather than baked into `Actions`: Meridian's
            row sets no outer margin, so the composition says where the space
            goes. The retired one carried 16px of its own. */}
        <Actions className="mt-mrd-4">
          <Action type="submit" disabled={note.trim().length < 2 || sendNote.isPending}>
            {sendNote.isPending ? "Adding it" : "Add the reason"}
          </Action>
        </Actions>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Publishing the teardown
 * ------------------------------------------------------------------ */

/**
 * PUBLISH THE TEARDOWN. The door onto the /t/<slug> page.
 *
 * THE DEFECT THIS CLOSES. Every part of the shareable teardown was built and
 * deployed and none of it was reachable: the SSR route with verdict-aware
 * preview cards (routes/t.$slug.tsx), the safe anon projection, the per-IP
 * limiter, the RLS policy, the column grants, and a PreSignupCTA with a
 * "teardown" variant already written for it. `getTeardownShareState` and
 * `setTeardownShared` had zero call sites anywhere outside their own file, so
 * nothing in the product could flip a bet public and no teardown ever had been.
 *
 * WHY HERE, AND NOT SOMEWHERE ELSE. Three surfaces could have held it:
 *   - A workspace or account settings screen. Wrong: sharing is per bet, not
 *     per workspace, and a person deciding whether THIS teardown is worth
 *     showing anyone is not in settings and is not carrying the teardown in
 *     their head when they get there.
 *   - The queue row (OpportunityRow) or its menu. Wrong: the row deliberately
 *     stopped drawing the teardown, so the control would be offering to publish
 *     something the surface is not showing. Publishing what you cannot see is
 *     the one press this should never be.
 *   - This block, under the verdict itself. Right: it is the only place in the
 *     product where the exact words that would go public are already on screen,
 *     next to the Critic's mark that signed them. The disclosure below is then
 *     a claim the reader can check by looking up, not a promise to trust.
 *
 * SHARING IS PUBLISHING, so the consequence is stated BEFORE the press, in the
 * fields it actually is, and the read comes from `getTeardownShareState` rather
 * than being assumed from a local flag.
 */

/** Exactly what a reader with the link gets. Every entry is a field
 *  `getPublicTeardown` selects and `t.$slug.tsx` draws; nothing here is a
 *  category or a guess. If that projection ever widens, this widens with it. */
const PUBLISHED_FIELDS: string[] = [
  "the title of this bet",
  "the Critic verdict, and the confidence behind it",
  "the summary the Critic wrote",
  "the risks it listed",
  "what it said would kill this",
  "what it said you cannot prove yet",
  "the date the bet was raised",
];

/** The columns anon is never granted, named so the sentence is checkable
 *  against the migration rather than reassuring. */
const WITHHELD_FIELDS =
  "The problem, the hypothesis, the target user, your impact, confidence and ease scores, and every workspace, project and owner id stay behind the login.";

/** A verdict the public page can actually render. `getPublicTeardown` returns
 *  null for anything else, so publishing without one would mint a live link to
 *  a page that reads "Not available". */
function hasPublishableVerdict(review: CriticReview | null): boolean {
  const v = review?.verdict;
  return v === "ship" || v === "revise" || v === "kill";
}

function teardownLink(slug: string): string {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}/t/${slug}`;
}

export function PublishTeardown({
  opportunity,
  disabled = false,
}: {
  opportunity: OpportunityDetailRecord;
  disabled?: boolean;
}) {
  const qc = useQueryClient();
  const fState = useServerFn(getTeardownShareState);
  const fSet = useServerFn(setTeardownShared);
  const key = React.useMemo(() => ["teardown-share", opportunity.id], [opportunity.id]);
  const [copied, setCopied] = React.useState(false);

  const state = useQuery({
    queryKey: key,
    queryFn: () => fState({ data: { id: opportunity.id } }),
  });

  const toggle = useMutation({
    mutationFn: (isPublic: boolean) => fSet({ data: { id: opportunity.id, isPublic } }),
    // The server hands back the row it just wrote, slug included, so the state
    // shown after the press is the state the database holds, never an optimistic
    // guess about it.
    onSuccess: (res) => qc.setQueryData(key, res),
  });

  React.useEffect(() => {
    if (!copied) return;
    const t = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copy = React.useCallback((slug: string) => {
    const url = teardownLink(slug);
    // Copying changes nothing, so it leaves no receipt. When the clipboard is
    // blocked the link itself is put in front of the person to take by hand,
    // which is why it is also printed above.
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(url).then(
        () => setCopied(true),
        () => toast.message(url),
      );
    } else {
      toast.message(url);
    }
  }, []);

  if (state.isPending) return <Reading>Checking whether this is public.</Reading>;

  if (state.isError) {
    /* `ReadFailedLine` and not `ReadFailed`: this renders INSIDE "The teardown"
       region, which already draws its own container, and the standard caps a
       region at one bordered box. */
    return (
      <ReadFailedLine onRetry={() => void state.refetch()} error={state.error}>
        Could not read whether this teardown is public, so nothing here says either way.
      </ReadFailedLine>
    );
  }

  const s = state.data;
  if (!s) return null;

  // The write is unavailable, not the idea. Say which.
  if (!s.available) {
    return (
      <Stated label="Publish this teardown">
        Publishing lights up once the next sync applies the share columns to this workspace.
      </Stated>
    );
  }

  const failure = toggle.isError
    ? failureLine("That did not change, so it is still as it was.", toggle.error)
    : null;

  if (s.is_public) {
    const slug = s.share_slug;
    return (
      <>
        <Stated label="This teardown is public">
          Anyone with this link can read it, with no account and no sign in.
        </Stated>
        {slug ? (
          <>
            <Meta>
              {/* Still an anchor and still `target="_blank"`: this is an OUTBOUND
                  address, and `Door`'s own note says the element follows the
                  destination rather than the paint. It takes the door's
                  treatment by hand for that reason. */}
              <a
                href={teardownLink(slug)}
                target="_blank"
                rel="noreferrer"
                className="break-all text-mrd-ink underline decoration-dotted underline-offset-2 transition-colors hover:decoration-solid"
              >
                {teardownLink(slug)}
              </a>
            </Meta>
            <Actions className="mt-mrd-4">
              <Action onClick={() => copy(slug)}>{copied ? "Copied" : "Copy the link"}</Action>
              <Action
                variant="quiet"
                disabled={disabled || toggle.isPending}
                onClick={() => toggle.mutate(false)}
                title="Takes the page down. Anyone holding the link gets nothing."
              >
                {toggle.isPending ? "Making it private" : "Make it private"}
              </Action>
            </Actions>
          </>
        ) : (
          <>
            {/* is_public with no slug is not a state the migration can produce
                (share_slug carries a CSPRNG default and a unique index), so it
                is reported rather than papered over with a dead copy button. */}
            <ReadFailedLine>
              This is marked public but carries no link, so there is nothing to hand anyone.
            </ReadFailedLine>
            <Actions className="mt-mrd-4">
              <Action
                variant="quiet"
                disabled={disabled || toggle.isPending}
                onClick={() => toggle.mutate(false)}
              >
                {toggle.isPending ? "Making it private" : "Make it private"}
              </Action>
            </Actions>
          </>
        )}
        {failure ? <ReadFailedLine>{failure}</ReadFailedLine> : null}
      </>
    );
  }

  const publishable = hasPublishableVerdict(opportunity.critic_review);

  return (
    <>
      <Stated label="Publish this teardown">
        It goes on the open web at a link that needs no account. What a reader gets:
      </Stated>
      <ul className="mt-mrd-2 list-disc pl-[1.1em] leading-mrd-prose text-mrd-prose text-mrd-body">
        {PUBLISHED_FIELDS.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <Meta>
        {WITHHELD_FIELDS} You can make it private again at any time, and the link dies with it.
      </Meta>
      {publishable ? (
        <Actions className="mt-mrd-4">
          <Action
            disabled={disabled || toggle.isPending}
            onClick={() => toggle.mutate(true)}
            title="Puts this teardown on the open web and gives you the link"
          >
            {toggle.isPending ? "Publishing it" : "Publish it and get the link"}
          </Action>
        </Actions>
      ) : (
        <Meta>
          {`${agentDisplayName(CHALLENGER)} has not reached a verdict on this bet, so the public page would have nothing to render. Challenge it first and this becomes publishable.`}
        </Meta>
      )}
      {failure ? <ReadFailedLine>{failure}</ReadFailedLine> : null}
    </>
  );
}

/** What the reviewer did, as a verb rather than a chip. */
function verdictVerb(verdict: VerdictWord): string {
  return verdict === "PENDING" ? "has not reviewed it yet" : `says ${verdict.toLowerCase()}`;
}

/** The disclosed confidence, folded into the sentence it qualifies. Absent
 * (not zero) until the Critic has actually given one. */
function confidenceTail(confidence: number | null | undefined): ReactNode {
  if (confidence == null) return null;
  return (
    <>
      {" at "}
      <Num>{Math.round(confidence * 100)}%</Num>
      {" confidence"}
    </>
  );
}

/** An absolute day, for the activity ledger. The relative age is already in
 * the header, so this carries the other half of the fact. */
function day(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "unknown" : d.toLocaleDateString();
}

/** Plain-words relative time. */
function ago(iso?: string | null): string | null {
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

/** SW-7 step-3 oracle: the best bet shows its precedent ("last time we
 * reasoned this way, here is what happened", the same Ambient Precedent recall
 * the decision card uses) and the live queue it was ranked against. Honest
 * states throughout: a failed read is a failure and says so, an empty result
 * is empty and says who fills it, and neither wears the other's clothes. */
function OpportunityJudgmentBlocks({ opportunityId }: { opportunityId: string }) {
  const fJudgment = useServerFn(getOpportunityJudgment);
  const q = useQuery({
    queryKey: ["opportunity-judgment", opportunityId],
    queryFn: () => fJudgment({ data: { id: opportunityId } }),
  });

  const precedents = q.data?.precedents ?? [];
  const peers = q.data?.consideredAgainst ?? [];

  // A read that FAILED is not an empty state. It used to render "No recorded
  // outcome matches this bet yet", which is a different fact entirely.
  if (q.isError) {
    return (
      <Region title="Precedent">
        <ReadFailedLine onRetry={() => void q.refetch()} error={q.error}>
          {reasonLine("Could not read this bet's judgment.", q.error)}
        </ReadFailedLine>
      </Region>
    );
  }

  return (
    <>
      <Region
        title="Precedent"
        sub={
          precedents.length > 0
            ? "The last time we reasoned this way, here is what happened."
            : undefined
        }
      >
        {q.isPending ? (
          <Reading>Recalling past outcomes.</Reading>
        ) : precedents.length > 0 ? (
          <div className="flex flex-col gap-mrd-5">
            {precedents.map((p) => (
              <RecordSpeaks
                key={p.memoryId}
                evidence={
                  <>
                    <span style={{ color: OUTCOME_TONE[p.verdict] }}>{p.verdict}</span>
                    {p.title ? ` · ${p.title}` : ""}
                  </>
                }
              >
                {p.summary}
              </RecordSpeaks>
            ))}
          </div>
        ) : (
          /* `NothingYet` and never `NothingHere`: this sits inside a region that
             already draws its own container, and two boxes around one sentence
             is a frame. */
          <NothingYet>
            No recorded outcome matches this bet yet. Ship one and the record recalls it here the
            next time a bet looks like this.
          </NothingYet>
        )}
      </Region>

      <Region title="Considered against">
        {q.isPending ? (
          <Reading>Reading the queue.</Reading>
        ) : peers.length > 0 ? (
          peers.map((a) => (
            <Line key={a.id} label={a.title}>
              {a.ice != null ? (
                <Value>
                  <Num>{a.ice.toFixed(1)}</Num>
                  {" ICE"}
                </Value>
              ) : (
                /* `Value` with no tone, which is the quiet ink. "unscored" is a
                   fact about the value, not an outcome, so it takes no hue. */
                <Value>unscored</Value>
              )}
            </Line>
          ))
        ) : (
          <NothingYet>Nothing else is live in the queue right now.</NothingYet>
        )}
      </Region>
    </>
  );
}

/**
 * Every outcome recorded on THIS bet, newest first, read out of the shared
 * ["learnings"] cache the hosting surface already fills -- no second read of
 * the table. Same anatomy as the Precedent rows above: the verdict word in
 * its outcome tone and the signed ICE delta as evidence, the recorded summary
 * as the body. The delta is `rescoreNoteOf`, the same helper the route uses,
 * so a sub-0.1 drift renders nothing rather than "+0.0 after ...".
 *
 * QUIET UNTIL THERE IS SOMETHING TO SAY: no matched rows renders null, never
 * an empty shell. A failed read stays quiet here too, deliberately unlike the
 * Precedent region above it -- that one REPLACES its whole subject on failure,
 * while this block is additive depth whose host surface already owns
 * reporting a refused learnings read.
 */
function OutcomeHistoryBlock({ opportunityId }: { opportunityId: string }) {
  const fLearnings = useServerFn(listLearnings);
  const q = useQuery({
    queryKey: ["learnings"],
    queryFn: () => fLearnings({ data: {} }),
    select: (d) => (d?.learnings ?? []).filter((l) => l.opportunity_id === opportunityId),
  });

  const rows = q.data ?? [];
  if (rows.length === 0) return null;

  return (
    <Region
      title="Outcomes on this opportunity"
      sub="What came back once it was live, newest first."
    >
      {rows.map((l) => {
        const note = rescoreNoteOf(l);
        return (
          <RecordSpeaks
            key={l.id}
            evidence={
              <>
                <span style={{ color: OUTCOME_TONE[l.verdict] }}>{l.verdict}</span>
                {note ? ` · ${note}` : ""}
              </>
            }
          >
            {l.summary}
          </RecordSpeaks>
        );
      })}
    </Region>
  );
}

/**
 * RPT-47: tie this opportunity to a strategic top bet, the human action that
 * lets a watched assumption feed the ranking. A standing bet lifts the
 * opportunity in the queue; if that bet's assumption is later challenged, the
 * opportunity sinks. Never inferred: the operator chooses. Hidden until at
 * least one top bet exists to tie to, so it never offers an empty choice.
 *
 * It is a boundary you set, so it is a sentence with a control at the end of
 * it rather than a panel: the `Line` shape, one per line, divided.
 */
function BriefLinkLine({ opportunity }: { opportunity: OpportunityDetailRecord }) {
  const qc = useQueryClient();
  const fList = useServerFn(listBriefItems);
  const fSetLink = useServerFn(setOpportunityBriefLink);

  const bets = useQuery({ queryKey: ["brief-items"], queryFn: () => fList({ data: {} }) });
  const topBets = (bets.data ?? []).filter((b) => b.kind === "top_bet");
  const linkedId = opportunity.linked_brief_item_id ?? null;

  const setLink = useMutation({
    mutationFn: (briefItemId: string | null) =>
      fSetLink({ data: { opportunityId: opportunity.id, briefItemId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      void qc.invalidateQueries({ queryKey: ["brief-alignment"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (topBets.length === 0) return null;

  const id = `brief-link-${opportunity.id}`;

  return (
    /* `htmlFor` ADDED. The dropdown trigger this replaces had no accessible name
       at all: it was a button whose only content was the linked bet's title, so
       a screen reader announced the VALUE and never the question. `Line` binds
       its label by name, the same way Meridian's `Field` does. */
    <Line
      label="Strategic opportunity"
      htmlFor={id}
      sub="A challenged assumption on the opportunity you tie it to sinks this one in the ranking."
    >
      {/* A `Picker`, not a `MoreMenu`. This control CARRIES A VALUE -- which top
          bet this one is tied to -- and a native select shows it, opens with the
          keyboard, and needs none of the menu behaviour the retired dropdown
          brought with it. The empty option is a real choice ("not tied"), not a
          placeholder, so it has a value of its own rather than a blank. */}
      <Picker
        id={id}
        value={linkedId ?? ""}
        disabled={setLink.isPending}
        className="max-w-[22ch]"
        onChange={(e) => setLink.mutate(e.target.value === "" ? null : e.target.value)}
      >
        <option value="">Not tied to a bet</option>
        {topBets.map((b) => (
          <option key={b.id} value={b.id}>
            {b.title}
          </option>
        ))}
      </Picker>
    </Line>
  );
}

export interface OpportunityDetailSheetProps {
  open: boolean;
  onOpenChange: (next: boolean) => void;
  opportunity: OpportunityDetailRecord | null;
  verdict: VerdictWord;
  onChallenge: () => void;
  onDraftSpec: () => void;
  onViewLineage: () => void;
  onSetStatus: (status: OpportunityStatus) => void;
  onDelete: () => void;
  /** Deterministic-ranking context for this bet (from ranking.ts), all
   * optional: the 1-based queue position, the short rationale, and the
   * recommended next action. Absent members render nothing. */
  rank?: number;
  rationale?: string;
  nextAction?: string;
  /** The system-derived bet designation (from ranking.ts), shown on the
   * ranking's evidence line so a human or an agent reads what the bet is.
   * Absent renders nothing. */
  designation?: Designation;
  /** Any mutation in flight for this bet: disables every action so a second
   * click can never double-fire. */
  busy?: boolean;
  /** The Critic challenge is in flight. */
  challengePending?: boolean;
  /** The spec draft is in flight. */
  draftPending?: boolean;
}

/**
 * The full record for one ranked bet, on the primitives, in the order an
 * operator reads it: what it is and where it stands, why it ranks where it
 * does, where it came from, the bet itself, what the Critic found, what the
 * record remembers, what it was ranked against, its history, and only then
 * what you can do about it.
 */
export function OpportunityDetailSheet({
  open,
  onOpenChange,
  opportunity,
  verdict,
  onChallenge,
  onDraftSpec,
  onViewLineage,
  onSetStatus,
  onDelete,
  rank,
  rationale,
  nextAction,
  designation,
  busy = false,
  challengePending = false,
  draftPending = false,
}: OpportunityDetailSheetProps) {
  const { activeWorkspaceId } = useWorkspace();
  const navigate = useNavigate();
  const fStartTrack = useServerFn(startTrack);
  const challengerName = agentDisplayName(CHALLENGER);

  /*
   * P-29 (A-QUEUE.md). THE SAME DOOR START'S OWN CARDS USE, not a second one.
   *
   * This used to dispatch through `startOrchestratedMission`, which creates a
   * `missions` row and no `spine_tracks` row -- R-35's gap, still live on a
   * real button until this packet (found by the P-14 leftover-reference
   * sweep). `jobFromOpportunity` is the exact conversion Start's own
   * top-opportunity cards already use (`ExampleJobs.tsx`); calling `startTrack`
   * with it means this button creates a real track, drivable by the sweep and
   * addressable at `/track/:id`, the same as every other way into the loop.
   */
  const startIt = useMutation({
    mutationFn: () => {
      if (!opportunity) throw new Error("No bet is open.");
      // `jobFromOpportunity` reads only `title`/`problem`; `iceScore` and
      // `shipped` are unused by it and named here only to satisfy
      // `TopOpportunity`'s shape. This sheet's own "Start it" is never
      // reachable for a bet that already shipped (P-126), so `shipped` is
      // always null here regardless of what the real record says.
      const job = jobFromOpportunity({
        id: opportunity.id,
        title: opportunity.title,
        problem: opportunity.problem,
        iceScore: opportunity.ice_score,
        shipped: null,
        runningTrackId: null,
      });
      return fStartTrack({
        data: {
          title: job.sentence.slice(0, 200),
          shape: job.shape,
          origin: job.shape !== "new-capability" ? job.sentence : undefined,
          workspaceId: activeWorkspaceId ?? undefined,
        },
      });
    },
    onSuccess: (res) => {
      if (res.track) {
        // No toast: landing on the run IS the consequence, the same rule
        // Start's own card press follows -- a toast on top of a navigation is
        // the click confirming itself twice.
        onOpenChange(false);
        navigate({
          to: "/track/$trackId",
          params: { trackId: res.track.id },
          search: { start: true },
        });
        return;
      }
      // `res.track === null` is a real refusal (startTrackCore's own
      // validation), not a thrown error -- the sheet has no inline problem
      // list the way Start's composer does, so the toast is this surface's
      // only way to say what went wrong.
      toast.error(res.problems.join(" ") || "The track could not be started.");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const criticConfidence = opportunity?.critic_review?.confidence ?? null;
  const updatedAgo = opportunity ? ago(opportunity.updated_at) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {/* `data-mrd` on the overlay's own root. A Radix sheet portals OUT of the
          surface that opened it, so Meridian's focus treatment and its
          neutralisation of the legacy app-wide ring do not reach anything in
          here unless the attribute is set on this element. `font-mrd` for the
          same reason: the face is inherited, and this subtree has no Meridian
          ancestor to inherit it from. */}
      {/*
       * ── THE SHEET SIZES TO THE SCREEN NOW (2026-09-01) ────────────────────
       *
       * FOUNDER: *"it needs to dynamically adapt based on the type of monitors
       * or screens I am using ... not just limited to these four sizes."*
       *
       * This carried `sm:max-w-md` -- ONE breakpoint at 640px and a hard 448px
       * ceiling above it. So the full detail of a ranked bet was 448px wide on
       * a 13in laptop and 448px wide on a 32in monitor, with the rest of the
       * screen dimmed behind it. This is also the surface every truncated row
       * on Discover sends a person to, which makes it the worst place in the
       * flow to be narrow: the reader arrives specifically because something
       * did not fit.
       *
       * `min(94vw, clamp(420px, 38vw, 760px))` is continuous. 420px is the
       * floor at which the two-column stats inside stop wrapping; 760px is the
       * ceiling past which the prose in here exceeds a readable measure and a
       * wider sheet would be worse rather than better; 38vw is the proportion
       * between them, so every width in between gets a value and no screen size
       * is named. `min(94vw, ...)` keeps the 6% gutter on a phone, which is what
       * the `w-3/4` default was protecting and is the one thing not to lose.
       *
       * An inline `width` rather than a utility because the value is an
       * expression: it also has to BEAT the component's own
       * `w-3/4 sm:max-w-sm` default, and a same-specificity utility would be
       * decided by stylesheet order -- the exact ambiguity the type-size guard
       * was just added for.
       */}
      <SheetContent
        side="right"
        data-mrd=""
        style={{ width: "min(94vw, clamp(420px, 38vw, 760px))", maxWidth: "none" }}
        className="overflow-y-auto bg-mrd-sheet font-mrd text-mrd-prose text-mrd-body"
      >
        {/* Accessible name and description for the dialog. The visible head
            below carries the same title, so this stays screen-reader only. */}
        <SheetHeader className="sr-only">
          <SheetTitle>{opportunity?.title ?? "Opportunity"}</SheetTitle>
          <SheetDescription>
            One ranked bet in full: where it came from, why it ranks where it does, and what the
            Critic found.
          </SheetDescription>
        </SheetHeader>

        {opportunity ? (
          /* THE RECORD'S OWN RHYTHM, WHICH THE RETIRED LAYER USED TO OWN.
             `.sp-block` gave every section 36px above it, 28px of padding and a
             1px rule; Meridian's `Region` sets no margin at all, on purpose --
             the composition owns its rhythm -- so a straight swap would have run
             twelve regions together. `gap-mrd-7` is 40px, the step the space
             ramp reserves for the gap BETWEEN groups and the one Crew,
             Approvals, Brain, Design and Build all took for exactly this. It is
             fewer pixels than 36+28 and it reads as more separation, because
             what did the separating there was the rule, and 40px of clean space
             says the same thing without drawing a line across a 448px column
             twelve times. Picking a private number here instead would be the
             "a sheet per station" mistake in spacing form. */
          <div className="flex flex-col gap-mrd-7 pb-mrd-5">
            {/* The close control floats at the top right of the sheet, so the
                title keeps clear of it rather than running underneath. */}
            <div className="pr-7">
              <PageHeading
                title={opportunity.title}
                sub={
                  <>
                    <StatusPill status={opportunity.status} />
                    {" · "}
                    {challengerName} {verdictVerb(verdict)}
                    {confidenceTail(criticConfidence)}
                    {updatedAgo ? (
                      <>
                        {" · moved "}
                        <Num>{updatedAgo}</Num>
                        {" ago"}
                      </>
                    ) : null}
                    {" · "}
                    <TraceRef id={opportunity.id} />
                  </>
                }
              />
            </div>

            {/* Why it ranks here. The ranking's own reason, then the one
                recommended move, then the numbers that produced the order. */}
            <Region title="Why it ranks here">
              {rationale ? <P>{rationale}</P> : null}
              {nextAction ? <Stated label="Recommended next">{nextAction}</Stated> : null}
              {rank != null || designation ? (
                <Meta>
                  {rank != null ? <Num>#{rank}</Num> : null}
                  {rank != null && designation ? " · " : null}
                  {designation === "best bet" ? <BestBetStamp /> : null}
                  {designation && designation !== "best bet" ? (
                    <DesignationTag designation={designation} />
                  ) : null}
                </Meta>
              ) : null}
              {/* The three numbers that produced the rank above, settable here
                  rather than stated here. They used to be a read-only sentence,
                  which told a person the order was wrong and gave them no way to
                  say so. `ice_score` is generated from them, so nothing writes
                  it directly. */}
              <IceEditor opportunity={opportunity} disabled={busy} idPrefix="record-ice" />
              <BriefLinkLine opportunity={opportunity} />
            </Region>

            {/* Provenance: honest, from theme_id only. The lineage door sits on
                the heading, and only when there is a theme to trace back to. */}
            {/* `goTo`, not `toggle` and not `act`. It LEAVES this region for the
                lineage chain, which is a destination with a name; `toggle` would
                emit `aria-expanded` for a disclosure that does not exist here,
                and `act` would announce work being dispatched when nothing runs.
                Offered only when there is a theme to trace back to. */}
            <Region
              title="Where it came from"
              goTo={opportunity.theme_id ? "View lineage" : undefined}
              onGoTo={onViewLineage}
            >
              <P>
                {opportunity.theme_id
                  ? "Promoted from an Arriving theme, with its findings attached."
                  : "Promoted directly. No theme backs it."}
              </P>
            </Region>

            {/* AN EXAMPLE SAYS SO BEFORE THE BET IT IS PRETENDING TO BE.
                This sheet declared `is_sample` on its own interface and
                rendered it nowhere -- the column existed, the read carries it
                through `select("*")`, and the one surface a person opens to
                STUDY a bet before acting on it stayed silent. Above "The bet"
                deliberately: this is the surface someone reads in full, so the
                caveat has to arrive before the problem statement rather than
                after it. Undefined reads as not-a-sample, per the field's own
                note: mislabelling a real bet as fiction is worse than leaving
                one example unmarked. */}
            {opportunity.is_sample ? (
              <Region title="This is an example">
                <P>
                  It came with your workspace so this station had something to show. It is not from
                  your product, and nothing here has been learned from your record.
                </P>
              </Region>
            ) : null}

            {/* The bet itself: real fields, blanks skipped. */}
            {opportunity.problem ||
            opportunity.hypothesis ||
            opportunity.target_user ||
            opportunity.decided_by_agent_slug ? (
              <Region title="The opportunity">
                {opportunity.problem ? (
                  <Stated label="Problem">{opportunity.problem}</Stated>
                ) : null}
                {opportunity.hypothesis ? (
                  <Stated label="Hypothesis">{opportunity.hypothesis}</Stated>
                ) : null}
                {opportunity.target_user ? (
                  <Stated label="Target user">{opportunity.target_user}</Stated>
                ) : null}
                {/* PC-29 layer 3 (2026-07-17): decided_by_agent_slug, rendered
                    as attribution rather than as another labelled string, so
                    the agent that made the call carries its own mark. */}
                {opportunity.decided_by_agent_slug ? (
                  <Row
                    marks={<AgentMark slug={opportunity.decided_by_agent_slug} state="idle" />}
                    lead={
                      <>
                        <Who>{agentDisplayName(opportunity.decided_by_agent_slug)}</Who> recorded
                        the decision behind this bet
                      </>
                    }
                  />
                ) : null}
              </Region>
            ) : null}

            {/* WHAT WE COMMITTED, AND HOW IT GETS CHECKED.
                Four real columns this sheet never drew: the lane the bet was
                placed in, the outcome that placement promised, how that outcome
                gets measured, and who placed it. A product lead could read the
                whole record and still not know what had been promised in their
                name, which is the one thing a roadmap commitment IS.

                The governance rule is roadmap.functions.ts's own
                (`validateCommitment`): a Now, Next or Later placement must carry
                a declared outcome AND a measure. So a placement missing either
                is not drawn as a blank, it is named as the gap it is. */}
            <Region title="What it promised">
              {opportunity.roadmap_bucket ||
              opportunity.roadmap_outcome ||
              opportunity.roadmap_measure ? (
                <>
                  <Line
                    label="Roadmap lane"
                    sub={
                      opportunity.roadmap_bucket
                        ? undefined
                        : "It carries a promise and sits in no lane, so nothing schedules it."
                    }
                  >
                    <Value>
                      {opportunity.roadmap_bucket
                        ? statusLabel(opportunity.roadmap_bucket)
                        : "Not placed"}
                    </Value>
                  </Line>
                  {opportunity.roadmap_outcome ? (
                    <Stated label="Outcome it promised">{opportunity.roadmap_outcome}</Stated>
                  ) : null}
                  {opportunity.roadmap_measure ? (
                    <Stated label="How we will know">{opportunity.roadmap_measure}</Stated>
                  ) : null}
                  {opportunity.roadmap_bucket &&
                  (!opportunity.roadmap_outcome || !opportunity.roadmap_measure) ? (
                    <Meta>
                      {/* `--mrd-hold`, which is what `--sp-warn` became. The
                          commitment is stopped on a CONDITION -- somebody has to
                          declare the outcome or the measure -- and that is
                          exactly what Meridian's amber says. */}
                      <span className="text-mrd-hold">
                        {!opportunity.roadmap_outcome && !opportunity.roadmap_measure
                          ? "No outcome and no measure are declared, so nothing can check whether this worked."
                          : !opportunity.roadmap_outcome
                            ? "No outcome is declared, so the measure has nothing to test."
                            : "No measure is declared, so the promised outcome cannot be checked."}
                      </span>
                    </Meta>
                  ) : null}
                  {/* Who placed it. An agent that moved a commitment signs it,
                      the same way every other claim in this sheet does; a human
                      move clears the slug, so silence here means a person. */}
                  {opportunity.roadmap_last_agent_slug ? (
                    <Row
                      marks={<AgentMark slug={opportunity.roadmap_last_agent_slug} state="idle" />}
                      lead={
                        <>
                          <Who>{agentDisplayName(opportunity.roadmap_last_agent_slug)}</Who> placed
                          it in this lane
                        </>
                      }
                    />
                  ) : null}
                </>
              ) : (
                <NothingYet>
                  Nothing is committed yet. Put it in a lane on the roadmap with the outcome it
                  promises and how you will measure it, and both land here.
                </NothingYet>
              )}
            </Region>

            {/* The teardown. One row that says who concluded what, and under it
                what they actually found. Never a chip: a verdict with no author
                is an assertion nobody signed. */}
            <Region title="The teardown">
              <Row
                marks={
                  <AgentMark
                    slug={CHALLENGER}
                    state={opportunity.critic_review ? "idle" : "quiet"}
                  />
                }
                lead={
                  <>
                    <Who>{challengerName}</Who> {verdictVerb(verdict)}
                    {confidenceTail(criticConfidence)}
                  </>
                }
                sub={
                  opportunity.critic_review?.summary ??
                  "Challenge it and the teardown lands on the record, with its evidence attached."
                }
              />
              {/* THE FULL CASE, under the sentence that signs it. The Row keeps
                  the attribution and the visible summary; the badge's face adds
                  the risk count and opens the risks, kill criteria, missing
                  evidence and review board in place -- the part of the teardown
                  nothing here used to reach. Mounted only when a review exists:
                  with none, the badge would offer its own "Ask the Critic"
                  write beside this sheet's "Challenge it", two controls doing
                  one verb. The opened disclosure restating the summary is the
                  review reading as a document, the same on every surface that
                  mounts it, so the Row's summary stays. */}
              {opportunity.critic_review ? (
                <div className="mt-mrd-4">
                  <CriticBadge
                    review={opportunity.critic_review}
                    target={{ kind: "opportunity", id: opportunity.id }}
                    invalidateKey={["opportunities"]}
                  />
                </div>
              ) : null}
              {opportunity.critic_review?.summary ? (
                <TeardownPulse targetId={opportunity.id} />
              ) : null}
              {/* The door onto /t/<slug>. It sits under the verdict because
                  this is the one surface where the exact words that would go
                  public are already on screen, so the disclosure above the
                  button is checkable by looking up rather than a promise. */}
              <PublishTeardown opportunity={opportunity} disabled={busy} />
            </Region>

            {/* SW-7 step 3: the bet's judgment. Precedent recall in the record
                recess, then the queue it was ranked against. */}
            <OpportunityJudgmentBlocks opportunityId={opportunity.id} />

            {/* What actually came back on THIS bet, in the same recess. Quiet
                until an outcome exists. */}
            <OutcomeHistoryBlock opportunityId={opportunity.id} />

            {/* Stage history: real per-transition rows; renders nothing until
                the first transition lands. */}
            <StageTimeline entityType="opportunity" entityId={opportunity.id} />

            {/* Post-ship product analytics for this bet (adoption vs. the
                outcome it declared). Self-fetches; renders nothing until real
                analytics exist. */}
            {activeWorkspaceId ? (
              <ProductAnalyticsPanel
                opportunityId={opportunity.id}
                workspaceId={activeWorkspaceId}
              />
            ) : null}

            <Region title="Activity">
              <Line label="Promoted">
                <Num>{day(opportunity.created_at)}</Num>
              </Line>
              <Line label="Last changed">
                <Num>{day(opportunity.updated_at)}</Num>
              </Line>
            </Region>

            {/* WHERE IT SITS, AS A LABELLED LINE RATHER THAN A MENU IN THE
                ACTION ROW.
                This was a "Move to" dropdown standing among the verbs at the
                foot of this record, which is the exact placement /decide's own
                header names as the reason the lane was unreachable: "the only
                control that set them was a Move to menu at the bottom of the
                open record, behind two clicks and a scroll".
                It is a placement you SET, not a call you make, so it takes the
                same shape the station gives it: label left, control right, one
                tab stop, and it shows where the bet sits instead of only
                offering to change it. Six statuses rather than four, because
                unlike the Gate's lane picker this record is also where a
                shipped or dropped bet is corrected. */}
            <Line
              label="Where it sits"
              htmlFor={`record-lane-${opportunity.id}`}
              sub="Placing it moves the roadmap. Nothing is drafted and nothing ships from here."
            >
              <Picker
                id={`record-lane-${opportunity.id}`}
                value={opportunity.status}
                disabled={busy}
                onChange={(e) => onSetStatus(e.target.value as OpportunityStatus)}
              >
                {OPPORTUNITY_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {STATUS_META[st].label}
                  </option>
                ))}
              </Picker>
            </Line>

            {/* One primary, and only one. Delete is separated by distance
                rather than by colour: red carries an outcome here, not an
                intent, and orchid marks the human.
                NO `Approve` ON THIS ROW. Orchid is spent on one meaning and the
                gate it is true of lives on the route; "Draft spec" starts work
                rather than releasing anything currently held, so it is the
                neutral primary. */}
            <Region>
              <Actions
                trailing={
                  <Action variant="quiet" onClick={onDelete} busy={busy}>
                    Delete
                  </Action>
                }
              >
                <Action variant="primary" onClick={onDraftSpec} disabled={busy || draftPending}>
                  {draftPending ? "Drafting the spec" : "Draft spec"}
                </Action>
                <Action onClick={onChallenge} disabled={busy || challengePending}>
                  {challengePending ? "Challenging it" : "Challenge it"}
                </Action>
                {/* The label already changes; this says WHAT is being worked on
                    and proves the work is still moving. A changed label is a
                    one-time event and reads as frozen thirty seconds later,
                    which is the whole complaint the indicator exists to answer.
                    Both of these are chokepoint calls: `generatePrd` and the
                    Critic. */}
                {draftPending || challengePending ? (
                  <AgentPulse
                    label={draftPending ? "Drafting the spec" : "The Critic is challenging it"}
                    seed={draftPending ? "product-manager" : "critic"}
                    compact
                    detail={opportunity?.title}
                  />
                ) : null}
                {/* PC-29 layer 6: hand the bet to the crew as real work.
                    It was `AskInContext`, a dropdown of exactly one item behind
                    a bot icon, whose one item read "Red-team this" and sat two
                    controls away from "Challenge it". Two controls whose labels
                    say the same thing is hard ban 10, and the two are genuinely
                    different machinery: Challenge runs the Critic and writes
                    back into this sheet, this starts a track and leaves for the
                    run. So the label now names the difference, and a one-item
                    menu is a button.
                    "Start it" (P-29, A-QUEUE.md), Start's own sentence for the
                    same action on the same object, because pressing this bet
                    here and pressing its card there are now the one door. */}
                <Action
                  disabled={busy || startIt.isPending}
                  onClick={() => startIt.mutate()}
                  title="Starts a track with this bet as its first sentence, and opens the run"
                >
                  {startIt.isPending ? "Starting it" : "Start it"}
                </Action>
              </Actions>
            </Region>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
