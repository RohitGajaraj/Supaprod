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
 */

import * as React from "react";
import { Row, Line, Who } from "@/components/meridian/rows";
import { Num, Actions } from "@/components/meridian/surface-parts";
import type { ReactNode } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";

import { listBriefItems } from "@/lib/briefs.functions";
import { setOpportunityBriefLink } from "@/lib/brief-opportunity.functions";
import { getOpportunityJudgment } from "@/lib/decision-judgment.functions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/lib/notify";
import { iceNum } from "@/lib/moat-vis";
import { formatAuditId } from "@/lib/audit-id";
import { submitPulse } from "@/lib/pulse.functions";
import { startOrchestratedMission } from "@/lib/orchestrator.functions";
import { updateOpportunity } from "@/lib/discovery.functions";
import type { CriticReview } from "@/lib/discovery.functions";
import { getTeardownShareState, setTeardownShared } from "@/lib/opportunities-share.functions";
import { StageTimeline } from "@/components/shared/StageTimeline";
import { ProductAnalyticsPanel } from "@/components/product/ProductAnalyticsPanel";
import { useWorkspace } from "@/hooks/use-workspace";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { Block, Button, Empty, Failed, Field, Input, Loading, PageHead, Record as RecordRecess, Textarea, Value } from "@/components/shell/primitives";
import { AgentMark } from "@/components/meridian/marks";
import { AgentPulse } from "@/components/shell/AgentPulse";
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
  validated: "var(--sp-pass)",
  missed: "var(--sp-fail)",
  mixed: "var(--sp-warn)",
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

/** Supporting prose inside a block. */
function P({ children }: { children: ReactNode }) {
  return (
    <p
      style={{
        margin: 0,
        fontSize: "var(--sp-text-meta)",
        lineHeight: "var(--sp-leading-body)",
        color: "var(--sp-body)",
      }}
    >
      {children}
    </p>
  );
}

/** One stated fact: a label, and under it the thing itself. ONE label, and the
 * value is never a restatement of it. */
function Stated({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ marginTop: "var(--sp-space-3)" }}>
      <span
        style={{
          display: "block",
          fontSize: "var(--sp-text-label)",
          fontWeight: "var(--sp-weight-medium)",
          color: "var(--sp-mute)",
          marginBottom: "var(--sp-space-1)",
        }}
      >
        {label}
      </span>
      <P>{children}</P>
    </div>
  );
}

/** The quiet evidence line under a claim. Numbers inside it wear mono via
 * `Num`; the words around them do not. */
function Meta({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        marginTop: "var(--sp-space-2)",
        fontSize: "var(--sp-text-label)",
        lineHeight: "var(--sp-leading-tight)",
        color: "var(--sp-mute)",
      }}
    >
      {children}
    </div>
  );
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
 */
export function IceEditor({
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
            style={{ padding: "0 8px" }}
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
      <div style={{ display: "flex", gap: "var(--sp-space-2)", alignItems: "flex-end" }}>
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
            <span style={{ color: "var(--sp-fail)" }}>that did not save</span>
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
      <button
        type="button"
        className="sp-block-more"
        title="Copy the full id"
        onClick={() => {
          void navigator.clipboard?.writeText(id);
          setCopied(true);
        }}
      >
        {copied ? "Copied" : "Copy id"}
      </button>
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
  // which is already a flex row: an `Actions` inside it carries a 16px top
  // margin and would drop them off the line they belong to.
  if (!verdict) {
    return (
      <Line label="Was this teardown useful?">
        <Button disabled={react.isPending} onClick={() => react.mutate(true)}>
          Yes
        </Button>
        <Button disabled={react.isPending} onClick={() => react.mutate(false)}>
          No
        </Button>
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
        <Textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What made you say that?"
          aria-label="Why the teardown was or was not useful"
          rows={2}
          style={{ height: "auto", minHeight: 60, padding: "10px 12px", resize: "vertical" }}
        />
        <Actions>
          <Button type="submit" disabled={note.trim().length < 2 || sendNote.isPending}>
            {sendNote.isPending ? "Adding it" : "Add the reason"}
          </Button>
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

  if (state.isPending) return <Loading>Checking whether this is public.</Loading>;

  if (state.isError) {
    return (
      <Failed onRetry={() => void state.refetch()}>
        Could not read whether this teardown is public, so nothing here says either way.
      </Failed>
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

  const failure = toggle.isError ? (toggle.error as Error).message : null;

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
              <a
                href={teardownLink(slug)}
                target="_blank"
                rel="noreferrer"
                style={{ color: "var(--sp-ink)", wordBreak: "break-all" }}
              >
                {teardownLink(slug)}
              </a>
            </Meta>
            <Actions>
              <Button onClick={() => copy(slug)}>{copied ? "Copied" : "Copy the link"}</Button>
              <Button
                variant="ghost"
                disabled={disabled || toggle.isPending}
                onClick={() => toggle.mutate(false)}
                title="Takes the page down. Anyone holding the link gets nothing."
              >
                {toggle.isPending ? "Making it private" : "Make it private"}
              </Button>
            </Actions>
          </>
        ) : (
          <>
            {/* is_public with no slug is not a state the migration can produce
                (share_slug carries a CSPRNG default and a unique index), so it
                is reported rather than papered over with a dead copy button. */}
            <Failed>
              This is marked public but carries no link, so there is nothing to hand anyone.
            </Failed>
            <Actions>
              <Button
                variant="ghost"
                disabled={disabled || toggle.isPending}
                onClick={() => toggle.mutate(false)}
              >
                {toggle.isPending ? "Making it private" : "Make it private"}
              </Button>
            </Actions>
          </>
        )}
        {failure ? <Failed>{failure}</Failed> : null}
      </>
    );
  }

  const publishable = hasPublishableVerdict(opportunity.critic_review);

  return (
    <>
      <Stated label="Publish this teardown">
        It goes on the open web at a link that needs no account. What a reader gets:
      </Stated>
      <ul
        style={{
          margin: "var(--sp-space-1) 0 0",
          paddingLeft: "1.1em",
          fontSize: "var(--sp-text-meta)",
          lineHeight: "var(--sp-leading-body)",
          color: "var(--sp-body)",
        }}
      >
        {PUBLISHED_FIELDS.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
      <Meta>
        {WITHHELD_FIELDS} You can make it private again at any time, and the link dies with it.
      </Meta>
      {publishable ? (
        <Actions>
          <Button
            disabled={disabled || toggle.isPending}
            onClick={() => toggle.mutate(true)}
            title="Puts this teardown on the open web and gives you the link"
          >
            {toggle.isPending ? "Publishing it" : "Publish it and get the link"}
          </Button>
        </Actions>
      ) : (
        <Meta>
          {`${agentDisplayName(CHALLENGER)} has not reached a verdict on this bet, so the public page would have nothing to render. Challenge it first and this becomes publishable.`}
        </Meta>
      )}
      {failure ? <Failed>{failure}</Failed> : null}
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
      <Block title="Precedent">
        <Failed onRetry={() => void q.refetch()}>
          Could not read this bet's judgment. {(q.error as Error).message}
        </Failed>
      </Block>
    );
  }

  return (
    <>
      <Block
        title="Precedent"
        sub={
          precedents.length > 0
            ? "The last time we reasoned this way, here is what happened."
            : undefined
        }
      >
        {q.isPending ? (
          <P>Recalling past outcomes.</P>
        ) : precedents.length > 0 ? (
          precedents.map((p) => (
            <RecordRecess
              key={p.memoryId}
              evidence={
                <>
                  <span style={{ color: OUTCOME_TONE[p.verdict] }}>{p.verdict}</span>
                  {p.title ? ` · ${p.title}` : ""}
                </>
              }
            >
              {p.summary}
            </RecordRecess>
          ))
        ) : (
          <Empty>
            No recorded outcome matches this bet yet. Ship one and the record recalls it here the
            next time a bet looks like this.
          </Empty>
        )}
      </Block>

      <Block title="Considered against">
        {q.isPending ? (
          <P>Reading the queue.</P>
        ) : peers.length > 0 ? (
          peers.map((a) => (
            <Line key={a.id} label={a.title}>
              {a.ice != null ? (
                <>
                  <Num>{a.ice.toFixed(1)}</Num>
                  {" ICE"}
                </>
              ) : (
                <span style={{ fontSize: "var(--sp-text-label)", color: "var(--sp-mute)" }}>
                  unscored
                </span>
              )}
            </Line>
          ))
        ) : (
          <Empty>Nothing else is live in the queue right now.</Empty>
        )}
      </Block>
    </>
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
  const linkedBet = topBets.find((b) => b.id === linkedId) ?? null;

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

  return (
    <Line
      label="Strategic bet"
      sub="A challenged assumption on the bet you tie it to sinks this one in the ranking."
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button disabled={setLink.isPending}>
            <span
              style={{
                display: "block",
                maxWidth: "16ch",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {linkedBet ? linkedBet.title : "Not tied to a bet"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setLink.mutate(null)}>
            Not tied to a bet
          </DropdownMenuItem>
          {topBets.map((b) => (
            <DropdownMenuItem key={b.id} onClick={() => setLink.mutate(b.id)}>
              {b.title}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
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
  const fStartMission = useServerFn(startOrchestratedMission);
  const challengerName = agentDisplayName(CHALLENGER);

  // The bet, handed to the crew as real work. Same server function, same goal
  // text and same destination the retired one-item menu used, so nothing about
  // what the loop receives changes.
  const handOff = useMutation({
    mutationFn: () => {
      if (!opportunity) throw new Error("No bet is open.");
      const ref = opportunity.id.slice(0, 8).toUpperCase();
      return fStartMission({
        data: {
          goal: `Red-team this opportunity before it is committed to: "${opportunity.title}" (ref ${ref})`,
          title: opportunity.title.slice(0, 200),
        },
      });
    },
    onSuccess: (res) => {
      onOpenChange(false);
      // Straight to the run's own surface, which is where the seven-stage
      // strip lives. This used to go to /build?mission=, a URL that now only
      // redirects, so it cost the person an extra hop on the way in.
      navigate({ to: "/runs/$missionId", params: { missionId: res.mission_id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const criticConfidence = opportunity?.critic_review?.confidence ?? null;
  const updatedAgo = opportunity ? ago(opportunity.updated_at) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md overflow-y-auto">
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
          <div style={{ paddingBottom: "var(--sp-space-4)" }}>
            {/* The close control floats at the top right of the sheet, so the
                title keeps clear of it rather than running underneath. */}
            <div style={{ paddingRight: "28px" }}>
              <PageHead
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
            <Block title="Why it ranks here">
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
            </Block>

            {/* Provenance: honest, from theme_id only. The lineage door sits on
                the heading, and only when there is a theme to trace back to. */}
            <Block
              title="Where it came from"
              more={opportunity.theme_id ? "View lineage" : undefined}
              onMore={onViewLineage}
            >
              <P>
                {opportunity.theme_id
                  ? "Promoted from a Discover theme, with its signals attached."
                  : "Promoted directly. No theme backs it."}
              </P>
            </Block>

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
              <Block title="This is an example">
                <P>
                  It came with your workspace so this station had something to show. It is not from
                  your product, and nothing here has been learned from your record.
                </P>
              </Block>
            ) : null}

            {/* The bet itself: real fields, blanks skipped. */}
            {opportunity.problem ||
            opportunity.hypothesis ||
            opportunity.target_user ||
            opportunity.decided_by_agent_slug ? (
              <Block title="The bet">
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
              </Block>
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
            <Block title="What it promised">
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
                      <span style={{ color: "var(--sp-warn)" }}>
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
                <Empty>
                  Nothing is committed yet. Put it in a lane on the roadmap with the outcome it
                  promises and how you will measure it, and both land here.
                </Empty>
              )}
            </Block>

            {/* The teardown. One row that says who concluded what, and under it
                what they actually found. Never a chip: a verdict with no author
                is an assertion nobody signed. */}
            <Block title="The teardown">
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
              {opportunity.critic_review?.summary ? (
                <TeardownPulse targetId={opportunity.id} />
              ) : null}
              {/* The door onto /t/<slug>. It sits under the verdict because
                  this is the one surface where the exact words that would go
                  public are already on screen, so the disclosure above the
                  button is checkable by looking up rather than a promise. */}
              <PublishTeardown opportunity={opportunity} disabled={busy} />
            </Block>

            {/* SW-7 step 3: the bet's judgment. Precedent recall in the record
                recess, then the queue it was ranked against. */}
            <OpportunityJudgmentBlocks opportunityId={opportunity.id} />

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

            <Block title="Activity">
              <Line label="Promoted">
                <Num>{day(opportunity.created_at)}</Num>
              </Line>
              <Line label="Last changed">
                <Num>{day(opportunity.updated_at)}</Num>
              </Line>
            </Block>

            {/* One primary, and only one. Delete is separated by distance
                rather than by colour: red carries an outcome here, not an
                intent, and ember marks the human. */}
            <Block>
              <Actions
                trailing={
                  <Button variant="ghost" onClick={onDelete} disabled={busy}>
                    Delete
                  </Button>
                }
              >
                <Button variant="primary" onClick={onDraftSpec} disabled={busy || draftPending}>
                  {draftPending ? "Drafting the spec" : "Draft spec"}
                </Button>
                <Button onClick={onChallenge} disabled={busy || challengePending}>
                  {challengePending ? "Challenging it" : "Challenge it"}
                </Button>
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button disabled={busy}>Move to</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {OPPORTUNITY_STATUSES.map((s) => (
                      <DropdownMenuItem key={s} onClick={() => onSetStatus(s)}>
                        {STATUS_META[s].label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                {/* PC-29 layer 6: hand the bet to the crew as real work.
                    It was `AskInContext`, a dropdown of exactly one item behind
                    a bot icon, whose one item read "Red-team this" and sat two
                    controls away from "Challenge it". Two controls whose labels
                    say the same thing is hard ban 10, and the two are genuinely
                    different machinery: Challenge runs the Critic and writes
                    back into this sheet, this starts a mission and leaves for
                    Build. So the label now names the difference, and a one-item
                    menu is a button.
                    No toast: landing on the mission IS the consequence, and a
                    toast on top of a navigation is the click confirming
                    itself. */}
                <Button
                  disabled={busy || handOff.isPending}
                  onClick={() => handOff.mutate()}
                  title="Starts a mission with this bet attached, and opens it in Build"
                >
                  {handOff.isPending ? "Starting the mission" : "Start a mission"}
                </Button>
              </Actions>
            </Block>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
