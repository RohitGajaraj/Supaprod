/**
 * Discover. The depth pass, 2026-08-01.
 *
 * The 2026-07-30 pass got the SHAPE right (one call in focus, evidence in the
 * context column, no competing panels) and stopped there. What it left is a
 * station with one verb on it. This pass gives it the other three, shows the
 * five scored dimensions the database was already holding, and makes the
 * surface stop promising something the write did not keep.
 *
 * REFERENCE, NAMED BEFORE BUILDING (founder ruling 2026-08-01: lift the proven
 * pattern rather than invent one). A cluster is structurally an issue group, so
 * the model is SENTRY'S ISSUE STREAM crossed with LINEAR'S TRIAGE INBOX:
 *   - Sentry: raw events group into an issue; the row carries volume, distinct
 *     users, first seen, last seen and a state the SYSTEM can move on its own.
 *     "Users affected" is a separate number from "events" because 40 reports
 *     from one account and 40 from 40 accounts are the same volume and the
 *     opposite decision.
 *   - Linear: one item in focus with the queue still scannable beside it, and
 *     DIGIT KEYS are dispositions (1 keep, 2 merge, 3 decline), letters are
 *     properties. That split is why its triage feels fast.
 *   - Productboard: the most common real outcome is "this is more evidence for
 *     something already in flight", which had no expression here at all.
 *
 * DELIBERATELY NOT LIFTED, and the reason matters. None of those products puts
 * a numeric confidence score on an auto-generated cluster; Enterpret says so
 * outright and substitutes explainability. So `themes.confidence` stays off
 * this surface. A percentage invites an argument about the percentage. The
 * evidence and the ability to undo are what a person actually acts on.
 *
 * 1. WHO IS HERE, AND WHAT THEY CAME TO DO. A product lead who has been told
 *    the crew read something. The 2026-07-30 header said they came "to put the
 *    strongest of it into the queue as a bet", and that was optimistic: they
 *    came to TRIAGE. Most clusters are noise, a duplicate, or more weight for a
 *    bet already running. Promotion is the rare terminal case, and building the
 *    surface around the rare case is what made it shallow.
 *
 * 2. THE ONE THING THIS SURFACE EXISTS FOR. To turn accumulated evidence into a
 *    judgment, and to leave the judgment on the record whichever way it went. A
 *    record that only holds the yeses is a highlight reel.
 *
 * 3. WHAT THIS PASS ADDED, and what was already here.
 *    FIXED the surface's own broken promise. The Gate said "this evidence
 *          travels with it" and only ONE theme -> opportunity lineage edge was
 *          written, so /decide showed a stale integer and the walk back could
 *          not reach a single quote. promoteThemeToOpportunity now writes an
 *          edge per member signal, and carries the theme's product scope, which
 *          it also dropped.
 *    ADDED the brain, on the surface that computes it. cluster.server.ts calls
 *          computeNovelty on every insert and stores the basis on the row, and
 *          none of it was ever rendered. The Record now speaks here, one
 *          station EARLIER than /decide, because killing a repeat at Discover
 *          costs nothing and killing it at Decide has already spent a critic
 *          run and a person's attention.
 *    ADDED the ranking the repo already wrote. brain/score.ts is a pure, tested
 *          severity x recency x novelty function. The surface sorted on raw
 *          `frequency`, which is the one dimension that says nothing about
 *          whether a thing is new or urgent.
 *    ADDED distinct sources as a first-class number beside volume, per Sentry.
 *    ADDED decline and merge, with digit keys, and a Receipt for each.
 *    ADDED source coverage, which closes a genuine asymmetry: an AGENT has had
 *          `sources.status` since 2026-06-30 and the human standing on the
 *          surface those signals feed had no equivalent anywhere in the product.
 *    KEPT  every 2026-07-30 decision. The SignalFeed panel stays dead, market
 *          watch stays gone, capture stays one box, and the queue deep links
 *          still redirect to /decide. Those were right.
 *
 * 4. ONE CLICK AWAY. A row is its title and one different fact, and it never
 *    wraps. Focus moves with the arrow keys and the list stays on screen, which
 *    is the whole point of triage: you judge this cluster relative to the ones
 *    around it, so a modal or a full-page detail would break the comparison.
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is the record saying "you
 *    decided this in March and it missed" while the thing is still a cluster
 *    and not yet a bet. The confusion to avoid is a wall of scores: five
 *    numbers per row is not depth, it is a spreadsheet, and the founder's
 *    complaint about scatter is exactly that failure one step later.
 *
 * 6. THE MANUAL PASS, 2026-08-02. The station had exactly one way for a person
 *    to put something in: a three-line box that split on newlines. Everything
 *    else they might be holding, a document somebody sent them, a call
 *    transcript, a page of research, had no door here at all. Worse, the box was
 *    hidden behind `!signalsEmpty`, so a brand new workspace was told to connect
 *    a source and given no way to write down the thing it had just heard.
 *
 *    WHAT THIS PASS DID, and it is mostly wiring rather than building:
 *    FIXED the write path. `createSignal` and `bulkImportSignals` built raw
 *          `signals` rows and inserted them, so a hand-captured signal was the
 *          only kind in the product with no `source_kind`, no `external_id`, no
 *          `stage_events` trail and no embedding until the next sweep. Both go
 *          through `writeSignals` now, the same sink every connector uses, via a
 *          pure producer at `src/lib/sources/manual.ts`.
 *    USED  `bulkImportSignals`, which had existed since F3 and which NOTHING in
 *          src/routes or src/components had ever called. The box looped
 *          `createSignal` once per line instead, so forty pasted lines opened
 *          forty sequential requests and a failure halfway left no report of
 *          what had landed. One call now.
 *    ADDED the longer form, in place inside the same Block: a document or a
 *          transcript, named, kept whole as ONE signal, typed in or read out of
 *          a plain-text file. Not a pane, not a drawer, not a slide-over, which
 *          primitives.tsx bans outright and which this is the textbook case for.
 *    ADDED provenance in words. The context column printed `note`,
 *          `pull_connector`, `transcript_action` at a person, which are our
 *          column values. A quote a colleague typed and a quote a connector
 *          pulled at 4am are the same shape on screen and are not the same
 *          level of evidence.
 *    ADDED a Receipt where capture used to fire a toast, and it reports all
 *          three of the sink's counts: what landed, what was already on the
 *          record, and what the injection screen refused.
 *
 *    DELIBERATELY NOT BUILT: PDF and DOCX reading. Nothing in this repo parses
 *    either format, and the honest move is to say so in the composer rather than
 *    accept the file and fail after the upload. The picker offers only formats
 *    that really are text.
 *
 * 7. THE DOORS PASS, 2026-08-02. Founder verdict on the product: "certain cards
 *    are not clickable and details, whatever is required, I feel left out. I
 *    don't know where to find them." This surface was the clearest case: every
 *    fact it showed was true, attributed, and inert.
 *
 *    FIXED a deep link that had been broken for two audits while a comment on
 *          the other end claimed it was repaired. /plan/spec/$id sends
 *          `?focus=<signalId>`; this route's validator returned only `tab`, so
 *          the router discarded the id before render, and nothing here read it
 *          anyway. It resolves to the cluster now, and the quote it named leads
 *          the evidence list.
 *    FIXED the scroll order. The ranking sat under the Gate plus up to two
 *          Record recesses plus a receipt, roughly 570px, so the list this
 *          surface exists to triage against was below the fold on a 1440x900
 *          screen. It now sits directly under the Gate, which is a single
 *          column's version of the split view Linear proves. The full reasoning,
 *          and what the reversal costs, is on the Record below.
 *    ADDED a door on every source in the coverage list, and on the quiet-source
 *          line, which is the most actionable sentence on the page and led
 *          nowhere. Captured-by-hand keeps none: it is not a connector.
 *    ADDED a door on each verbatim quote, to the ticket or thread it was lifted
 *          from. `signals.url` has been on the row since the table was created
 *          and no surface had ever rendered it.
 *    ADDED a door on the precedent Record, to the prior bet's own chain in the
 *          graph, and on the weaker prior-cluster claim, which moves the focus.
 *
 * 8. THE CLOSING PASS, 2026-08-06. Five of the six things this file fixed were
 *    the surface disagreeing with its own record.
 *
 *    FIXED the paragraph that used to stand here. It read "a dismissed cluster
 *          here can never grow: clusterSignalsCore only ever reads signals with
 *          a null theme_id and creates NEW themes, so nothing joins an existing
 *          one and `last_signal_at` is frozen at creation", and filed
 *          conditional decline as a KNOWN NEXT STEP blocked elsewhere. Every
 *          clause of it has been false since migration
 *          20260802170000_theme_growth_and_conditional_decline.sql.
 *          `clusterSignalsCore` attaches leftover unclustered signals to
 *          EXISTING themes by embedding similarity, writes `last_signal_at` on
 *          each attach, and re-opens a declined cluster through
 *          `shouldEscalate(dismissed_at_frequency, newFrequency)`. Conditional
 *          decline is live. Sentry's archive-until-it-escalates is the thing we
 *          have, and the bar is stricter than Sentry's: a declined cluster has
 *          to clear BOTH a multiple and an absolute step over the count it was
 *          declined at (ESCALATION_MULTIPLE and ESCALATION_ABSOLUTE, both
 *          imported below rather than retyped).
 *    FIXED the second half of that, which is the half a person can see. The
 *          decline receipt said only "Its evidence is still on the record, and
 *          the call is too", so the fact that makes declining SAFE, that it
 *          returns on its own if it grows, was known to the clusterer and to
 *          nobody standing here. It says it now, in the escalation rule's own
 *          numbers, imported rather than retyped.
 *    FIXED `?focus=`, which missed for every SETTLED cluster, which is every
 *          cluster a spec or a lineage node can name. It resolved the id
 *          against `ranked`, and `ranked` drops dismissed, merged and promoted,
 *          so the link from a spec's "Why this spec exists" resolved to null and
 *          the surface silently opened on the top of the ranking instead. That
 *          is verbatim the defect the route file claims to have repaired. The id
 *          resolves against the whole theme set now, and a settled cluster gets
 *          a line above the Gate saying which way it went, with the door to its
 *          own chain.
 *    ADDED the un-decline, which the server has always accepted (`setThemeStatus`
 *          takes "new" and clears `dismissed_at_frequency` and `escalated_at` on
 *          the way back) and which no surface in the product could reach. A
 *          mis-pressed `d` was terminal. The Settled block below the ranking
 *          lists what was declined and merged and puts each one back, which is
 *          also the record holding the noes rather than a highlight reel.
 *    FIXED the merge picker, which could only reach twelve bets, ranked by ICE
 *          across every workspace, with no way to search. It filters, it
 *          expands, and it offers only bets in the cluster's OWN workspace,
 *          because `attachThemeToOpportunity` now refuses the rest.
 *    FIXED the ranking row, which printed `pull_connector` at a person and
 *          invented a confidence bucket for clusters that carry no confidence.
 *          See the note on the row itself.
 *
 * 9. THE INSTRUMENT PASS, 2026-08-10. The station was honest and it was not
 *    legible: every fact on it was a sentence, so the ranking could only be
 *    read one row at a time, and one of those sentences was stronger than the
 *    column behind it.
 *
 *    FIXED the novelty claim, which asserted a prior it could not produce. The
 *          bottom bucket read "the record has seen this before" -- naming a
 *          thing -- off one float, with no count, no name and no door, while
 *          the Record recess below it can be empty at the same instant.
 *          `noveltyRead` says how much a cluster RESEMBLES the record and never
 *          which thing; when `getThemePrecedent` has actually named something,
 *          the recess says so and opens it, and the Gate line now points at it.
 *    ADDED a batch header. A ranked list with no distribution over it invites
 *          the reader to trust rank 1 without asking what rank 12 looks like.
 *          Four counts, all off rows already in hand, and a bucket at zero is
 *          not drawn.
 *    ADDED status as SHAPE. The row's leading slot held the rank as a bare
 *          digit, which restated the reader's own position in an ordered list.
 *          It carries the novelty ring now -- the only encoding in ~200 shipped
 *          products that survives greyscale untouched -- and the rank moved into
 *          the line below, where restating it is free.
 *    ADDED the score the order is actually made of. This list has sorted on
 *          `scoreTheme` since 2026-08-01 and showed none of it, so the ranking
 *          asked to be taken on trust. A numeral out of 100 and a 2px bar on one
 *          shared scale. NO movement arrow: `themes` stores no previous score
 *          and inventing one would be the surface asserting a history it does
 *          not hold. Decide can show a delta because `learnings` keeps
 *          `prior_ice`; this station has no equivalent column.
 *    ADDED bulk decline. Every queue in this product was one-at-a-time, and a
 *          night of connector traffic makes a ranking whose bottom half is
 *          noise. Decline only: keeping spends a Critic run per cluster and
 *          merging needs a target bet per cluster, so neither may be one press.
 *    ADDED a worked example on the empty desk, which is the majority view. The
 *          first-run screen said connect a source and gave no idea what the
 *          thing being filled would look like when full. It is a drawing, it
 *          carries no id, it cannot be acted on, and it says so three times.
 *
 * VOICE: never greet, always report. The first line is a count that came out of
 * the record, or an honest statement that there is nothing in it yet.
 */

import { AutomationBoundary } from "@/components/governance/AutomationBoundary";
import { endedSessionOn, failureLine, reasonLine } from "@/lib/error-copy";
import { wordFor } from "@/lib/spine/chain";
import { Row, Line } from "@/components/meridian/rows";
import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useNavigate } from "@tanstack/react-router";

import { AgentRelay } from "@/components/agents/AgentRelay";
import { useWorkspace } from "@/hooks/use-workspace";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { isModalOpen } from "@/lib/overlay";
import { scoreTheme } from "@/lib/brain/score";
// The escalation bar, imported rather than retyped. theme-growth.ts is the pure
// decision layer the clusterer runs, and it says so itself: "the number in the
// copy can never drift from the number in the decision". A surface that hard
// coded "twice as many" would be a second copy of a rule it does not own.
import { ESCALATION_ABSOLUTE, ESCALATION_MULTIPLE } from "@/lib/ai/theme-growth";
import {
  MAX_BODY_CHARS,
  READABLE_EXTENSIONS,
  isReadableFileName,
  typedCandidates,
} from "@/lib/sources/manual";
import {
  attachThemeToOpportunity,
  bulkImportSignals,
  clusterSignals,
  createSignal,
  generatePrd,
  getSenseCoverage,
  getThemePrecedent,
  getWorkspaceClusterSettings,
  listOpportunities,
  listSignals,
  listThemes,
  promoteThemeToOpportunity,
  setThemeStatus,
  toggleAutoCluster,
  renameTheme,
} from "@/lib/discovery.functions";
import { getAgentFleet } from "@/lib/agent-fleet.functions";
import { getLineage } from "@/lib/lineage.functions";
import {
  isSampleWorkspaceEnabled,
  triggerSampleWorkspace,
} from "@/lib/onboarding/onboarding.functions";
/*
 * THE TWO THAT STAYED, AND WHY THE RETIRED LINE SURVIVES AT ALL.
 *
 * `Record` is the lit recess, and Meridian's `RecordSpeaks` cannot carry it.
 * Two things would be lost, not one: the DOOR (`onClick`/`title`, which both
 * call sites below use to open the prior bet's chain or move the focus onto the
 * earlier cluster) and the LAMP. RecordSpeaks says so in its own header --
 * "NOT THE SAME COMPONENT as Brain's RecordSpeaks or Runs' Recess, which are
 * recesses with a diamond and a lead-size claim... Meridian permits ONE lit
 * object in the product and Brain holds the licence." Swapping would demote the
 * one differentiated moment on this station AND make a claim that names a prior
 * decision unreachable, which is the exact defect the doors pass in section 7
 * of this file's header was opened to close.
 *
 * `SelectionBar` is a different component from Meridian's `SelectionActions`
 * despite the near-name. This one takes a `Selection` of ROWS and states a
 * count with verbs beside it; that one attaches to a text `Range` a reader has
 * highlighted in prose and hands the passage to an agent. Its API has no
 * `selection`, no `total` and no `noun`, and its `phase`/`workingLabel`/`error`
 * describe an edit coming back from a model. Nothing here maps onto it.
 *
 * Both are reported rather than forced. Everything else on this surface is
 * Meridian.
 */
import { RecordSpeaks } from "@/components/brain/record-parts";
import { BulkBar } from "@/components/meridian/surface-parts";
import { AgentMark, type MarkState } from "@/components/meridian/marks";
import { SourceMark } from "@/components/meridian/source-marks";
// Meridian design system: surface components replace retired shell/primitives
import {
  Action,
  Actions,
  Chevron,
  Figure,
  NothingYet,
  Num,
  PageHeading,
  ReadFailed,
  ReadFailedLine,
  Reading,
  Region,
  Toggle,
  Value,
} from "@/components/meridian/surface-parts";
import { Surface } from "@/components/meridian/Surface";
import { Choices, Field, Input, Textarea } from "@/components/meridian/forms";
import { MoreItem, MoreMenu } from "@/components/meridian/MoreMenu";
import { Receipt } from "@/components/meridian/Receipt";
import { Ask } from "@/components/meridian/Ask";
import { Quiet } from "@/components/meridian/Quiet";
import { CtxBody, CtxHead, CtxRow } from "@/components/meridian/ContextColumn";
import { useSelection } from "@/components/shell/use-selection";
import {
  BatchHeader,
  ScoreMeter,
  SelectBox,
  StatusRing,
  type RingFill,
} from "@/components/decisions/queue-instruments";
import { capturedByHand, signalPreview, sourceLabel, withTimeout } from "./format";
import { CrewWorking } from "@/components/shell/CrewWorking";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { stillWaiting } from "@/lib/query-state";

/** The crew that reads for this desk, most relevant first. The fleet already
 * comes back attention-first, so the first one present is the one worth
 * naming in the context column. */
const SENSE_AGENTS = ["discovery-scout", "researcher"];

/** How much evidence the ONE cluster in focus shows before it says "and N
 *  more". Four quotes is enough to see the pattern; twelve is a wall. The cap
 *  belongs to this rail alone: the full member list for the focused cluster
 *  renders in the Gate, which carries every signal this desk holds. */
const QUOTES_IN_FOCUS = 4;

/**
 * The rationale every founding member carried before routing reasons became
 * concrete (cluster.server.ts, before the same change that reads them back
 * here). It states the what ("clustered") and never the why, so reading it
 * back under a source label would render a sub-line that answers nothing.
 * Treated as no stored reason: members clustered before the change show no
 * line at all rather than a placeholder. Never fabricate one either.
 */
const LEGACY_CLUSTER_REASON = "Clustered into theme";

/** How many sources the coverage line names before it counts the rest. */
const SOURCES_IN_CONTEXT = 5;

/** How much of the ranking is on screen before it asks. Six is roughly one
 *  screen beside the gate; past that the surface becomes a scroll, which is the
 *  complaint this cap exists to answer. */
const VISIBLE_CLUSTERS = 6;

/** How many bets the merge picker draws before it asks. Twelve is what the
 *  picker already showed; the difference is that it is no longer the CEILING.
 *  It was a bare `.slice(0, 12)` on a list ordered by ICE across every
 *  workspace, so the thirteenth bet was unreachable from this station by any
 *  means, including knowing its name. */
const BETS_IN_PICKER = 12;

/** How many settled clusters the record shows before it asks. Settled work is
 *  reference material rather than a queue, so it opens short. */
const SETTLED_VISIBLE = 5;

/** The three ways a cluster leaves the ranking. Kept beside `ranked`'s filter,
 *  which is the other half of the same fact: what this set holds is exactly
 *  what that filter drops. */
const SETTLED_STATUSES = new Set(["dismissed", "merged", "promoted"]);

/** What a settled cluster's status means in the person's own words, and what
 *  it means for whether it can be re-opened. */
function settledWord(status: string): string {
  if (status === "promoted") return "It became a bet";
  if (status === "merged") return "It was merged into a bet you already had";
  return "You said it was not a pattern";
}

/**
 * THE LABEL, EDITABLE BEFORE IT PROPAGATES. Promotion copies the theme title
 * verbatim into the bet, so this is the one edit that happens before a
 * cluster's words become a bet's words and then a decision's words. Title
 * required, summary optional - both are the cluster's own words, so no gate
 * signal fires.
 */
function RenameClusterForm({
  theme,
  onDone,
}: {
  theme: { id: string; title: string; summary: string | null };
  onDone: () => void;
}) {
  const fRename = useServerFn(renameTheme);
  const [title, setTitle] = React.useState(theme.title);
  const [summary, setSummary] = React.useState(theme.summary ?? "");
  const save = useMutation({
    mutationFn: () =>
      fRename({
        data: {
          theme_id: theme.id,
          title: title.trim(),
          summary: summary.trim() === (theme.summary ?? "").trim() ? undefined : summary.trim(),
        },
      }),
    onSuccess: onDone,
  });
  const canSave = title.trim().length > 0 && title.trim() !== theme.title && !save.isPending;
  return (
    <form
      className="mb-mrd-2 flex flex-col gap-mrd-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) save.mutate();
      }}
    >
      <Field label="Name it what it is" htmlFor={`rename-${theme.id}`}>
        <Input
          id={`rename-${theme.id}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />
      </Field>
      <Field label="One-line summary (optional)" htmlFor={`rename-sum-${theme.id}`}>
        <Input
          id={`rename-sum-${theme.id}`}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          maxLength={4000}
        />
      </Field>
      {save.isError ? (
        <p className="text-mrd-fail text-mrd-base">
          {failureLine("That did not save, so nothing changed.", save.error)}
        </p>
      ) : null}
      <Actions>
        <Action type="submit" disabled={!canSave}>
          {save.isPending ? "Renaming" : "Rename"}
        </Action>
        <Action variant="quiet" onClick={onDone}>
          Keep the old words
        </Action>
      </Actions>
    </form>
  );
}

/**
 * SAY WHY, OR DON'T. The one-line reason a person can attach AFTER declining -
 * the keyboard verb stays instant, so the common case never grows a modal, and
 * the words arrive whenever they arrive. Optional by construction: skipping it
 * is legal and the row simply carries no reason. status_reason was accepted by
 * the server since the column landed and no UI ever sent one; this is the
 * sender.
 */
function DeclineReasonLine({ themeId, title }: { themeId: string; title: string }) {
  const fSetStatus = useServerFn(setThemeStatus);
  const [why, setWhy] = React.useState("");
  const save = useMutation({
    mutationFn: () =>
      fSetStatus({ data: { theme_id: themeId, status: "dismissed", reason: why.trim() } }),
  });
  const canSave = why.trim().length > 0 && !save.isPending;
  if (save.isSuccess) return null;
  return (
    <form
      className="mt-mrd-2 flex items-center gap-mrd-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSave) save.mutate();
      }}
    >
      <div className="min-w-0 flex-1">
        <Input
          aria-label={`Why is ${title} not a pattern?`}
          placeholder="Say why, so future-you remembers (optional)"
          value={why}
          onChange={(e) => setWhy(e.target.value)}
        />
      </div>
      <Action type="submit" variant="default" disabled={!canSave}>
        {save.isPending ? "Saving" : "Save reason"}
      </Action>
    </form>
  );
}

/** Plain-words relative time, whole phrase, so it never reads "now ago". */
function since(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return null;
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

/** The fleet's own words for what an agent is doing, in the mark's words.
 *  State is never a hue; the mark owns that. */
function markState(state: string): MarkState {
  if (state === "working") return "running";
  if (state === "attention") return "gate";
  return "idle";
}

const plural = (n: number) => (n === 1 ? "" : "s");

/**
 * Novelty as a CLAIM, never as a percentage -- AND NEVER AS A CLAIM THE COLUMN
 * CANNOT BACK.
 *
 * `themes.novelty` is a 0..1 remap of cosine similarity against decision memory
 * and prior themes, computed once at cluster time. Printing "0.34" would be
 * printing our own arithmetic at someone; the useful reading is the sentence it
 * implies.
 *
 * WHAT THE BOTTOM BUCKET USED TO SAY, AND WHY IT WAS TOO STRONG. It read "the
 * record has seen this before", which asserts a PRIOR: a specific earlier
 * cluster or decision, of which the row named none, counted none and opened
 * none. The Record recess under the Gate can be empty at the same moment the
 * row makes the claim -- `getThemePrecedent` is a separate read, fired only for
 * the cluster in focus, and it returns nothing for most clusters. So on a
 * scanning row the surface was stating a fact from one float that the surface
 * could not then show.
 *
 * The three sentences below are what a similarity number on its own supports:
 * how much this RESEMBLES what is already on the record, and nothing about
 * which thing. When there genuinely is a named prior, the Record recess says so
 * in its own words and opens it, one screen down. That division -- the number
 * makes the weak claim, the read makes the strong one -- is the same one this
 * file already applies to `themes.confidence`, which it refuses to render at
 * all.
 *
 * The `fill` is the row's status ring. It is an ordinal on ONE axis, novelty,
 * and it is the shape rather than a hue for the reason queue-instruments.tsx
 * sets out: it has to survive greyscale.
 */
type NoveltyRead = {
  /** The claim, in the weakest form the number supports. */
  claim: string;
  fill: RingFill;
  /** Where the number came from, said in full on hover, so the claim is
   *  checkable rather than oracular. */
  basis: string;
};

const NOVELTY_BASIS =
  "Scored when this theme was built, against your settled decisions and every earlier theme. Open it to see what it resembles.";

/**
 * ALL THREE CLAIMS ARE VERB PHRASES, and that is a constraint rather than a
 * preference. The top bucket used to read "unlike anything on the record",
 * which is an adjective phrase, while the other two were verb phrases -- so no
 * single connective could carry the set. The Gate joined them with "and it is",
 * which reads correctly on the top bucket and produces "and it is partly
 * resembles the record" on the other two, i.e. on the common case.
 *
 * Anything added here has to fit "…and it ___." and "___. <basis>" both,
 * because those are the two frames the string is rendered in: the Gate joins it
 * as a clause, and the ranking row's status ring uses it as that ring's
 * accessible name with the basis after it. The row does NOT also print it as
 * "· ___" any more -- it did, beside a ring already saying the same sentence,
 * which was one row stating one fact twice.
 */
function noveltyRead(novelty: number | null | undefined): NoveltyRead | null {
  if (typeof novelty !== "number") return null;
  if (novelty >= 0.75)
    return { claim: "resembles nothing on the record", fill: "full", basis: NOVELTY_BASIS };
  if (novelty >= 0.4)
    return { claim: "partly resembles the record", fill: "part", basis: NOVELTY_BASIS };
  return { claim: "closely resembles the record", fill: "empty", basis: NOVELTY_BASIS };
}

/** How much of the ranking a batch header can honestly bucket. Kept beside
 *  `noveltyRead` because it is the same three buckets counted rather than
 *  named, and a fourth for the clusters that carry no novelty at all -- which
 *  is a real state the header must not fold into "closely resembles". */
function noveltyBucket(
  novelty: number | null | undefined,
): "new" | "partial" | "seen" | "unscored" {
  if (typeof novelty !== "number") return "unscored";
  if (novelty >= 0.75) return "new";
  if (novelty >= 0.4) return "partial";
  return "seen";
}

type ReceiptState = {
  verb: string;
  consequence: React.ReactNode;
  handoff?: { slug: string | null; name?: string | null } | null;
  failed?: boolean;
};

export function DiscoverSurface({
  /**
   * WHAT THE LINK NAMED. A signal id (what /plan/spec/$id sends when you click
   * a row under "Why this spec exists") or a theme id. Optional, so every
   * existing link into /discover behaves exactly as it did.
   *
   * It resolves to the CLUSTER, because a single quote is not a call and this
   * surface only ever asks about clusters. The quote itself is then lifted to
   * the top of the evidence list, so the thing the link named is the thing you
   * see rather than something merely related to it.
   */
  focus,
  /**
   * `?capture=1` — land ON the capture box rather than merely on this station.
   *
   * The box is at the bottom of this surface by deliberate design, below the
   * ranked reading, so every control labelled "Capture a finding" that
   * navigated to a bare `/discover` put the person on the right page with the
   * thing they came for off screen. Same defect `?focus=` had and the same
   * repair; the route's header carries both.
   */
  // Aliased: `capture` is already the name of the capture MUTATION below, and
  // the URL param is the thing that has to keep this spelling.
  capture: captureOnArrival,
}: {
  focus?: string;
  capture?: boolean;
} = {}) {
  // The spine, lit on this station. One shared query across all seven
  // (use-spine-strip.ts), so an always-on strip costs one request, not seven.
  useSpineStrip("sense");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { activeProductId, activeWorkspaceId, setActiveWorkspaceId, refreshWorkspaces } =
    useWorkspace();

  const fSignals = useServerFn(listSignals);
  const fThemes = useServerFn(listThemes);
  const fFleet = useServerFn(getAgentFleet);
  const fCluster = useServerFn(clusterSignals);
  const fCreate = useServerFn(createSignal);
  const fBulk = useServerFn(bulkImportSignals);
  const fPromote = useServerFn(promoteThemeToOpportunity);
  const fDraftSpec = useServerFn(generatePrd);
  const fSampleEnabled = useServerFn(isSampleWorkspaceEnabled);
  const fTriggerSample = useServerFn(triggerSampleWorkspace);
  const fCoverage = useServerFn(getSenseCoverage);
  const fPrecedent = useServerFn(getThemePrecedent);
  const fSetStatus = useServerFn(setThemeStatus);
  const fAttach = useServerFn(attachThemeToOpportunity);
  const fOpportunities = useServerFn(listOpportunities);
  const fClusterSettings = useServerFn(getWorkspaceClusterSettings);
  const fToggleAuto = useServerFn(toggleAutoCluster);

  /** Which cluster is the call in front of you. Same idea as the approvals
   *  queue: exactly one thing asks at a time, the rest are one-line rows. */
  const [focusedId, setFocusedId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState("");
  /**
   * Where `?capture=1` lands: the capture box itself, scrolled to and focused.
   *
   * A CALLBACK REF RATHER THAN AN EFFECT, because the box is not on screen when
   * this component first renders. It is gated behind `!loadError && !loading &&
   * !picking`, so an effect would have to name all three as dependencies, guess
   * right about which one released it, and would then re-run on every unrelated
   * change to any of them. The ref fires when the textarea actually attaches,
   * which is the one moment the landing is possible.
   *
   * HONOURED ONCE, for the same reason the `?focus=` landing is honoured once:
   * the link decides where you arrive, and the moment you scroll or click
   * somewhere else you have decided instead. A landing that reasserted itself on
   * every refetch would drag the page back off whatever you chose.
   *
   * `scrollIntoView` with no `behavior` is a jump rather than a smooth scroll,
   * so there is no reduced-motion leak: a jump has no animation for
   * `prefers-reduced-motion` to need to suppress. (This reason used to be
   * borrowed by citing the command palette's row-into-view effect, which was
   * retired on 2026-08-21; it is stated here directly now, because a reason
   * that lives in another file dies with it.) `preventScroll` on the
   * focus stops the browser doing a second, worse scroll of its own immediately
   * afterwards.
   */
  const captureLanded = React.useRef(false);
  const captureBox = React.useCallback(
    (el: HTMLTextAreaElement | null) => {
      if (!el || !captureOnArrival || captureLanded.current) return;
      captureLanded.current = true;
      el.scrollIntoView({ block: "center" });
      el.focus({ preventScroll: true });
    },
    [captureOnArrival],
  );
  /**
   * The longer-form capture, revealed IN PLACE inside the same Block.
   *
   * A note and a document are not two answers to a question about our storage
   * (the box above already takes one line or twenty without asking), they are two
   * different things a person is holding: a sentence they remember, versus a file
   * somebody sent them. The second one needs a name, a body that keeps its
   * paragraphs, and a way to say whether it is a document or a meeting
   * transcript, because that is what the row's provenance will say afterwards.
   *
   * Revealed, never floated: primitives.tsx bans the pane, the drawer and the
   * slide-over, and this is exactly the case its note describes, a lane that
   * wanted one and built the thing in place instead.
   */
  const [bodyOpen, setBodyOpen] = React.useState(false);
  const [bodyKind, setBodyKind] = React.useState<"document" | "transcript">("document");
  const [bodyTitle, setBodyTitle] = React.useState("");
  const [bodyText, setBodyText] = React.useState("");
  /** What the file picker said, when it had something to say. Never a toast: a
   *  rejected file is a state of this composer, not a passing announcement. */
  const [fileNote, setFileNote] = React.useState<{ text: string; failed: boolean } | null>(null);
  const [fileReading, setFileReading] = React.useState(false);
  const fileInput = React.useRef<HTMLInputElement | null>(null);
  // Scroll target for the comprehension strip's cluster segment; focus follows
  // the jump so a keyboard reader is not left above where they landed.
  const rankingAnchor = React.useRef<HTMLDivElement | null>(null);
  /** The merge picker, opened IN PLACE rather than in a pane. primitives.tsx
   *  bans the slide-over and says a lane that wanted one built its detail view
   *  in place instead, "and that is the better surface". */
  const [picking, setPicking] = React.useState(false);
  /** What the person typed to find the bet they mean. Kept out of the URL: it
   *  is a way of looking at the list, not a place in the product. */
  const [betFilter, setBetFilter] = React.useState("");
  /** The ranking's own find field. The list is fully client-side (listThemes
   *  caps at 300), so the filter is a substring over title and summary - the
   *  same shape the merge picker's betFilter uses, so the two find fields
   *  cannot grow different behaviours. */
  const [clusterFilter, setClusterFilter] = React.useState("");
  /** Rename-in-place for the focused cluster: closed until More for... names
   *  it. A bad label propagates - promotion copies the title verbatim - so
   *  the edit sits one menu item before that door. */
  const [renaming, setRenaming] = React.useState(false);
  /** Whether the whole set of candidate bets is on screen, or the first twelve. */
  const [showAllBets, setShowAllBets] = React.useState(false);
  /** Whether the whole ranking is on screen, or the first six of it. */
  const [showAllClusters, setShowAllClusters] = React.useState(false);
  /** Whether the settled clusters are listed, or only counted. Opened
   *  automatically the moment a decline puts something in there, so the undo is
   *  in front of the person who just pressed the key rather than behind a
   *  control they have to find. */
  const [showSettled, setShowSettled] = React.useState(false);
  /** And whether that list is the first few or all of it. Two levels because a
   *  workspace that has triaged for a month has more settled clusters than live
   *  ones, and a wall of them under the ranking is the scatter complaint the
   *  ranking's own cap exists to answer. */
  const [showAllSettled, setShowAllSettled] = React.useState(false);
  /** The settled cluster a `?focus=` link named, dismissed by the person. The
   *  notice is not a toast and does not time out; this is the only thing that
   *  takes it off screen, and pressing it is a decision, not a wait.
   *
   *  KEYED TO THE LINK, NOT TO THE MOUNT. Dismissing answers ONE link, and
   *  /discover does not remount between them: the lineage drawer and Today's
   *  next-step both navigate within the route, so `focus` changes underneath a
   *  living component. Without the reset below, dismissing the notice for
   *  cluster A silently swallowed it for cluster B, which is the same "landed
   *  somewhere else with nothing saying why" this notice was added to end. */
  const [linkNoticeClosed, setLinkNoticeClosed] = React.useState(false);
  React.useEffect(() => {
    setLinkNoticeClosed(false);
  }, [focus]);
  /** What the last judgment caused. Replaces the success toast the surface used
   *  to fire, per anti-slop.md §5: a toast confirms the click registered, a
   *  Receipt renders what the click DID. */
  const [receipt, setReceipt] = React.useState<ReceiptState | null>(null);

  // Shared cache with FleetView's "By Agent" tab (same queryKey): a cache read
  // here, not a second network call, when both are mounted on one workspace.
  const fleet = useQuery({
    queryKey: ["agent-fleet", activeWorkspaceId],
    queryFn: () => fFleet({ data: { workspaceId: activeWorkspaceId } }),
  });
  const watcher = fleet.data?.fleet.agents.find((a) => SENSE_AGENTS.includes(a.slug)) ?? null;

  /*
   * P-75b (A-QUEUE.md): THE WORKSPACE BELONGS IN THE KEY AND IN THE CALL,
   * same rule `coverage` just below already follows and `signals`/`themes`
   * did not -- without it a switch to an empty workspace kept reading the
   * PREVIOUS workspace's rows (`listSignals`/`listThemes` took only a
   * product, never a workspace, so a workspace with no product of its own
   * read every row RLS would show, every OTHER workspace's included). The
   * query keys still carry `activeProductId` too, unchanged: a product
   * switch inside the same workspace still has to refetch.
   */
  const signals = useQuery({
    queryKey: ["signals", activeWorkspaceId, activeProductId],
    queryFn: () =>
      withTimeout(
        fSignals({ data: { workspaceId: activeWorkspaceId, productId: activeProductId } }),
      ),
  });
  const themes = useQuery({
    queryKey: ["themes", activeWorkspaceId, activeProductId],
    queryFn: () =>
      withTimeout(
        fThemes({ data: { workspaceId: activeWorkspaceId, productId: activeProductId } }),
      ),
  });
  const coverage = useQuery({
    /* The workspace belongs in the key and in the call. Without it a switch
       served the previous workspace's coverage under the new one's name, and
       the first fetch after the switch answered across every workspace anyway
       (P-33, the same shape as Start's). */
    queryKey: ["sense-coverage", activeWorkspaceId ?? null, activeProductId],
    queryFn: () =>
      fCoverage({ data: { productId: activeProductId, workspaceId: activeWorkspaceId ?? null } }),
  });

  /** This station's boundary. RLS scopes the read to a workspace the caller
   *  owns, so `is_owner` false simply means the line is not theirs to set and
   *  it is not drawn. */
  const clusterSettings = useQuery({
    queryKey: ["cluster-settings", activeWorkspaceId],
    queryFn: () => fClusterSettings(),
  });

  const autoSense = useMutation({
    mutationFn: (enabled: boolean) => fToggleAuto({ data: { enabled } }),
    onSuccess: (_r, enabled) => {
      // A boundary change is a write with a consequence, so it earns a Receipt
      // like every other write on this surface. The consequence is what the
      // boundary now lets through, never "Saved".
      setReceipt({
        verb: enabled ? "You let it read on its own" : "You took the reading back",
        consequence: enabled
          ? "New findings group without waiting for you. Nothing is promoted without you."
          : "Nothing is grouped until you press the button yourself.",
      });
      void qc.invalidateQueries({ queryKey: ["cluster-settings"] });
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "The boundary did not move",
        consequence: failureLine("Nothing changed.", e),
        failed: true,
      }),
  });

  const rows = React.useMemo(() => signals.data?.signals ?? [], [signals.data]);
  type SignalRow = (typeof rows)[number];
  const loadError = (signals.error ?? themes.error) as Error | null;

  /*
   * ONE ENDED SESSION, SAID ONCE. Measured against a token that no longer
   * answers: this surface drew "Your session ended. Sign in again and this will
   * load." three times with three doors, because three regions each answered
   * for their own read and all three failed for the same reason.
   *
   * Only an ended session collapses. A read that failed for a real reason keeps
   * its own region's honesty, because there the detail IS what the reader needs
   * -- which half is real is the whole question.
   */
  const endedSession = endedSessionOn(signals.error, themes.error);
  // An answer that has not arrived is not the answer "none". This surface is
  // where that was found on production: a workspace with 97 signals, 41 themes
  // and 34 opportunities rendered the first-run "Connect a source" screen for a
  // beat. The reasoning, and the two other stations it also hit, are in
  // `@/lib/query-state`. BOTH queries belong here: the headline counts signals
  // and the ranking counts themes, so waiting on only one still lets the other
  // read as empty.
  const loading = stillWaiting(signals, themes);

  /** Member signals per cluster, grouped from data already in hand. Newest
   *  first, because listSignals returns newest first. */
  const membersByTheme = React.useMemo(() => {
    const map = new Map<string, SignalRow[]>();
    for (const s of rows) {
      if (!s.theme_id) continue;
      const arr = map.get(s.theme_id) ?? [];
      arr.push(s);
      map.set(s.theme_id, arr);
    }
    return map;
  }, [rows]);

  /**
   * Ranked by the brain's own score, not by raw volume.
   *
   * `scoreTheme` is severity x recency x novelty-vs-memory, pure and unit
   * tested, and it existed for a month while this surface sorted on
   * `b.frequency - a.frequency`. Volume is the one dimension that cannot tell
   * you whether a thing is urgent or whether you already answered it.
   *
   * `nowMs` is hoisted out of the comparator so every row is scored against one
   * instant; scoring inside the sort would compare rows against slightly
   * different clocks and is not a stable ordering.
   *
   * Dismissed and merged clusters leave the ranking. They are not deleted and
   * their evidence is untouched; they have simply been judged.
   */
  const ranked = React.useMemo(() => {
    const all = themes.data?.themes ?? [];
    const nowMs = Date.now();
    return all
      .filter((t) => {
        const st = (t.status ?? "new") as string;
        // `promoted` belongs here for the same reason the other two do: the
        // cluster has been settled and re-asking costs a duplicate bet and a
        // second Critic pass. It was the one settled state nothing wrote, so
        // the queue kept offering it. Kept in step with INELIGIBLE_STATUSES in
        // @/lib/spine/promote, which the autonomous sweep reads.
        return st !== "dismissed" && st !== "merged" && st !== "promoted";
      })
      .map((t) => {
        const members = membersByTheme.get(t.id) ?? [];
        // The newest member we actually hold beats the stored column, which
        // cluster.server.ts writes once at creation and never updates.
        const lastAt = members[0]?.created_at ?? t.last_signal_at ?? t.created_at;
        return {
          theme: t,
          members,
          lastAt,
          sources: new Set(members.map((s) => s.source)).size,
          score: scoreTheme(
            {
              severity: t.severity,
              confidence: t.confidence,
              createdAt: t.created_at,
              lastSignalAt: lastAt,
              novelty: t.novelty,
              // HOW MANY PEOPLE SAID IT. Absent until 2026-08-03, which is why a
              // single competitor blog post from 5 days ago sat above 40
              // homeowners reporting the same support burden: frequency was only
              // a tie-break AFTER the score, and floats never tie.
              frequency: t.frequency,
            },
            nowMs,
          ),
        };
      })
      .sort((a, b) => b.score - a.score || b.theme.frequency - a.theme.frequency);
  }, [themes.data, membersByTheme]);

  const unclustered = React.useMemo(() => {
    const known = new Set((themes.data?.themes ?? []).map((t) => t.id));
    return rows.filter((s) => !s.theme_id || !known.has(s.theme_id)).length;
  }, [rows, themes.data]);

  const signalsEmpty = !loading && !loadError && rows.length === 0;

  /**
   * WHICH CLUSTER THE LINK MEANT, resolved against the RECORD rather than
   * against the queue.
   *
   * Two shapes arrive at `?focus=`: a signal id (the spec page sends one per
   * row) and, for anything that links a cluster directly, a theme id. Both
   * resolve here.
   *
   * THIS USED TO CHECK `ranked`, AND THAT MADE IT MISS EVERY LINK WORTH
   * FOLLOWING. `ranked` drops dismissed, merged and promoted clusters, and
   * since 2026-08-06 promotion writes `status: "promoted"`
   * (discovery.functions.ts). A spec exists BECAUSE its bet exists, so the
   * cluster behind any spec is promoted by definition, and every one of the
   * three callers points at exactly that: /plan/spec/$id sends a signal id from
   * "Why this spec exists", LineageDrawer sends a signal or theme id, and
   * Today's FocusNext sends a theme id. The resolver returned null for all of
   * them, the effect below fell through to `ranked[0]`, and the person landed
   * on an unrelated cluster with nothing on screen naming the miss. That is
   * word for word the defect _authenticated.discover.tsx says it repaired:
   * "Clicking a signal on a spec landed you on whichever cluster happened to
   * rank first, with nothing saying why."
   *
   * So the id is resolved against the whole theme set, and being SETTLED is
   * reported rather than treated as not-found. `null` is now reserved for an id
   * that names nothing at all: a signal that was never clustered, a cluster in
   * another product's scope, or a stale link.
   */
  const focusResolved = React.useMemo(() => {
    if (!focus) return null;
    const all = themes.data?.themes ?? [];
    const byId = (id: string | null | undefined) =>
      id ? (all.find((t) => t.id === id) ?? null) : null;
    const direct = byId(focus);
    if (direct) return direct;
    const signal = rows.find((s) => s.id === focus);
    return byId(signal?.theme_id);
  }, [focus, rows, themes.data]);

  /** The link named a cluster that has already been judged. Not an error and
   *  not a miss: the honest answer is which way it went, and the door to the
   *  chain that came out of it. */
  const focusSettled =
    focusResolved && SETTLED_STATUSES.has((focusResolved.status ?? "new") as string)
      ? focusResolved
      : null;

  /** The cluster the link named AND that is still a live call. Only this one
   *  moves the Gate. */
  const focusTarget = focusResolved && !focusSettled ? focusResolved.id : null;

  /** Honoured ONCE. The deep link decides where you land; the moment you press
   *  a row, you have decided instead, and a link that kept reasserting itself
   *  on every refetch would drag the Gate back off whatever you chose. */
  const focusHonoured = React.useRef(false);

  // The focus always points at something that exists. It opens on what the link
  // named when a link named something, and otherwise on the top-ranked cluster,
  // which is the call worth making.
  React.useEffect(() => {
    if (ranked.length === 0) {
      setFocusedId(null);
      return;
    }
    if (focusTarget && !focusHonoured.current) {
      focusHonoured.current = true;
      setFocusedId(focusTarget);
      return;
    }
    if (!ranked.some((r) => r.theme.id === focusedId)) setFocusedId(ranked[0].theme.id);
  }, [ranked, focusedId, focusTarget]);

  const focusedIndex = ranked.findIndex((r) => r.theme.id === focusedId);
  const focused = focusedIndex >= 0 ? ranked[focusedIndex] : null;
  // Annotated, not inferred. `focused?.members ?? []` is `SignalRow[] | never[]`,
  // a union of two array types, and calling `.map` on a union hands the callback
  // an `unknown` element. Reading the source off a member looked type safe and
  // was not, which is why the provenance line needed the annotation to compile.
  //
  // THE QUOTE THE LINK NAMED LEADS. Only four quotes are drawn before the list
  // says "and N more", so a deep link that landed on the right cluster could
  // still leave the exact sentence somebody clicked invisible underneath the
  // fold of its own evidence list.
  const focusedMembers: SignalRow[] = React.useMemo(() => {
    const members: SignalRow[] = focused?.members ?? [];
    const at = focus ? members.findIndex((s) => s.id === focus) : -1;
    if (at <= 0) return members;
    return [members[at], ...members.slice(0, at), ...members.slice(at + 1)];
  }, [focused, focus]);
  const focusedSources: string[] = [...new Set(focusedMembers.map((s) => s.source))];

  /** True when the cluster claims more members than this desk actually holds.
   *  `listSignals` returns the newest 200 signals in the workspace and no total,
   *  so the theme's own server-side `frequency` is the only count the client can
   *  be measured against -- the same honesty the ranking owes when its read is
   *  one page of a larger record. */
  const memberShortfall = !!focused && focused.theme.frequency > focusedMembers.length;

  /**
   * What the record already knows about the cluster in focus.
   *
   * Enabled only when something is focused, and keyed on the theme, so moving
   * the focus is one cheap read rather than a refetch of the whole surface. The
   * server function is fail-safe by contract, so a quiet brain renders nothing
   * rather than erroring a surface whose main job still works.
   */
  const precedent = useQuery({
    queryKey: ["theme-precedent", focused?.theme.id],
    queryFn: () => fPrecedent({ data: { theme_id: focused!.theme.id } }),
    enabled: Boolean(focused?.theme.id),
    staleTime: 5 * 60_000,
  });

  /**
   * WHY EACH MEMBER LANDED IN THIS CLUSTER, READ BACK FROM THE RECORD.
   *
   * cluster.server.ts writes a routing rationale onto every signal->theme
   * lineage edge: founding members cite the theme they founded, attached
   * members cite their similarity match. Until now nothing on Discover read
   * any of it back. `getLineage` is the reader the record already has, so
   * this goes through it rather than a second bespoke read of the same table,
   * keyed on the theme in focus the way the precedent read above is, so
   * moving down the ranking is one cheap read.
   */
  const fLineage = useServerFn(getLineage);
  const memberLineage = useQuery({
    queryKey: ["theme-member-lineage", focused?.theme.id],
    queryFn: () => fLineage({ data: { kind: "theme", id: focused!.theme.id } }),
    enabled: Boolean(focused?.theme.id),
    staleTime: 5 * 60_000,
  });

  /** Signal id -> the reason it was filed under this cluster, when one exists.
   *  Ancestors are the edges INTO the theme; anything whose parent is not a
   *  signal (or that carries only the legacy placeholder) has no reason to
   *  show and gets none. First edge wins; both writers use one relation. */
  const reasonBySignal = React.useMemo(() => {
    const map = new Map<string, string>();
    for (const e of memberLineage.data?.ancestors ?? []) {
      if (e.parent_kind !== "signal") continue;
      const why = e.rationale?.trim();
      if (!why || why === LEGACY_CLUSTER_REASON) continue;
      if (!map.has(e.parent_id)) map.set(e.parent_id, why);
    }
    return map;
  }, [memberLineage.data]);

  /** The open bets, read only while the merge picker is up. */
  const opportunities = useQuery({
    /* P-75: the key carries the workspace and so does the call. A key without
       it shares one cache entry across every workspace a person holds. */
    queryKey: ["opportunities", activeWorkspaceId ?? null],
    queryFn: () => fOpportunities({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
    enabled: picking,
  });

  /**
   * WHAT THIS CLUSTER'S EVIDENCE IS ALLOWED TO BACK.
   *
   * The picker used to offer the first twelve rows of `listOpportunities`,
   * which applies no product filter and no workspace filter at all: it is every
   * bet row-level security admits, which for anyone in more than one workspace
   * is the union across all of them, ordered by ICE. Two things were wrong at
   * once. A bet in another workspace was OFFERED, and merging into it moved
   * evidence across a tenant boundary (`attachThemeToOpportunity` refuses that
   * outright now, so leaving it in the list would be a door onto a refusal).
   * And the thirteenth bet was unreachable from this station by any means,
   * including knowing its name, which is what the filter below fixes.
   *
   * PRODUCT SCOPE IS THE SOFTER CLAUSE, deliberately. A theme carrying a
   * `project_id` prefers its own product's bets, but bets with no product of
   * their own stay offered, which is the same reading `listSignals` and
   * `listThemes` already take of a product-scoped view: workspace-level rows
   * are not hidden, they are simply not filed under a product.
   */
  const betCandidates = React.useMemo(() => {
    const all = opportunities.data?.opportunities ?? [];
    const open = all.filter((o) => o.status !== "shipped" && o.status !== "dropped");
    if (!focused) return { open, inWorkspace: open, inScope: open };
    const themeWorkspace = focused.theme.workspace_id;
    const themeProject = focused.theme.project_id;
    // The two clauses are kept apart because they empty the list for different
    // reasons, and the empty state has to say which one it was. "There are no
    // bets" when there are twenty in the next product along is the surface
    // hiding its own filter.
    const inWorkspace = open.filter(
      (o) => !themeWorkspace || !o.workspace_id || o.workspace_id === themeWorkspace,
    );
    const inScope = inWorkspace.filter(
      (o) => !themeProject || !o.project_id || o.project_id === themeProject,
    );
    return { open, inWorkspace, inScope };
  }, [opportunities.data, focused]);

  /** The picker opens clean. A filter left over from the last merge would hide
   *  a list the person has not looked at yet, which is the twelve-row ceiling
   *  wearing different clothes. Keyed on close rather than on open so it covers
   *  every exit: Never mind, Escape from the surface, Escape from the field,
   *  and a merge that went through. */
  React.useEffect(() => {
    if (!picking) {
      setBetFilter("");
      setShowAllBets(false);
    }
  }, [picking]);

  /** What the person typed, matched against the one thing they can see. */
  const betMatches = React.useMemo(() => {
    const q = betFilter.trim().toLowerCase();
    if (!q) return betCandidates.inScope;
    return betCandidates.inScope.filter((o) => (o.title ?? "").toLowerCase().includes(q));
  }, [betCandidates, betFilter]);

  /**
   * THE NOES, WHICH THE RECORD IS SUPPOSED TO HOLD AS WELL AS THE YESES.
   *
   * `ranked` drops these three statuses and nothing else on the station showed
   * them, so a person could decline twenty clusters and have no way to see what
   * they had decided. The three are listed together because they are one fact
   * from the reader's side, "already judged", and the row says which way each
   * went. Newest judgment first is not available (nothing stamps a settled-at
   * time on the row), so this keeps the read's own order, which is newest
   * cluster first.
   */
  const settledClusters = React.useMemo(() => {
    return (themes.data?.themes ?? []).filter((t) =>
      SETTLED_STATUSES.has((t.status ?? "new") as string),
    );
  }, [themes.data]);

  /**
   * HOW MUCH OF THE RECORD THIS PAGE IS.
   *
   * Both numbers come from the read rather than from a constant here, which is
   * the point: this file already carries a note explaining why it refuses to
   * restate `listSignals`' `.limit(200)` as a literal, because "a second copy
   * of `200` in this file is a number that goes stale the day the server's
   * changes". `listThemes` returns its own total now, so the surface can state
   * the shortfall without knowing the cap.
   */
  const themeWindow = themes.data?.themes.length ?? 0;
  const themeTotal = themes.data?.total ?? themeWindow;

  /** Clusters this station already turned into bets, counted off rows in hand.
   *  It feeds the comprehension strip's last segment; nothing here is fetched
   *  or derived beyond what the themes read above already returned. */
  const promotedCount = React.useMemo(
    () =>
      (themes.data?.themes ?? []).filter((t) => ((t.status ?? "new") as string) === "promoted")
        .length,
    [themes.data],
  );

  /**
   * WHAT THE WHOLE RANKING LOOKS LIKE, counted before it is listed.
   *
   * A ranked list with no distribution over it asks the reader to trust rank 1
   * without ever asking what rank 12 looks like. Every count here comes off
   * rows already in hand -- no extra read, no derived guess -- and the
   * `unscored` bucket is the one that has to exist: a cluster carrying no
   * `novelty` is a different fact from one that resembles the record, and
   * folding the two would make the other three counts lies.
   */
  const rankedVisible = React.useMemo(() => {
    const q = clusterFilter.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter(
      (r) =>
        r.theme.title.toLowerCase().includes(q) ||
        (r.theme.summary ?? "").toLowerCase().includes(q),
    );
  }, [ranked, clusterFilter]);

  const spread = React.useMemo(() => {
    let fresh = 0;
    let partial = 0;
    let seen = 0;
    let unscored = 0;
    for (const r of rankedVisible) {
      const bucket = noveltyBucket(r.theme.novelty);
      if (bucket === "new") fresh += 1;
      else if (bucket === "partial") partial += 1;
      else if (bucket === "seen") seen += 1;
      else unscored += 1;
    }
    return { fresh, partial, seen, unscored };
  }, [ranked]);

  /**
   * BULK TRIAGE, over the ranking's own order.
   *
   * The ids are `ranked`'s and not the visible slice's, so a shift-range means
   * what a person expects across a "Show all" and a selection survives the fold
   * closing again. `useSelection` intersects with these on every read, so a
   * cluster that gets promoted by the autonomous sweep while it is ticked
   * simply leaves the selection rather than being acted on after it has gone.
   */
  const rankedIds = React.useMemo(() => ranked.map((r) => r.theme.id), [ranked]);
  const picked = useSelection(rankedIds);

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["signals"] });
    void qc.invalidateQueries({ queryKey: ["themes"] });
    void qc.invalidateQueries({ queryKey: ["opportunities"] });
    void qc.invalidateQueries({ queryKey: ["sense-coverage"] });
  };

  // SW-6 cold start: from an empty desk a user can move into a SEPARATE Explore
  // workspace to look around, instead of staring at nothing. It never fills
  // their real workspace with example data. Dormant unless the founder turns
  // SAMPLE_WORKSPACE_ENABLED on. On success we switch the user into it.
  //
  // THAT SWITCH IS WHY THE COPY ON THE DOOR READS AS IT DOES. This is not a
  // preview mounted beside the person's own desk, and it is not view state:
  // `setActiveWorkspaceId` writes the id to `localStorage`
  // (`use-workspace.tsx:175`) and clears every workspace-scoped query, so the
  // person stays in the sample on every later visit until they pick their own
  // workspace out of the switcher in the top bar. A door that relocates you has
  // to say that it relocates you and has to name the way back. The Gate's lines
  // below do both; the wiring here is unchanged.
  const sampleEnabledQ = useQuery({
    queryKey: ["sample-workspace-enabled"],
    queryFn: () => fSampleEnabled(),
    enabled: signalsEmpty,
  });
  const sampleMutation = useMutation({
    mutationFn: () => fTriggerSample(),
    onSuccess: (res) => {
      refreshWorkspaces();
      const id = (res as { workspaceId?: string | null } | undefined)?.workspaceId;
      if (id) setActiveWorkspaceId(id);
      void qc.invalidateQueries({ queryKey: ["signals"] });
    },
  });
  const sampleOffered = signalsEmpty && (sampleEnabledQ.data?.enabled ?? false);

  // ---- The three dispositions. Digits, per Linear: mutually exclusive,
  // terminal, one keystroke. Each one renders what it caused. ----

  const promote = useMutation({
    mutationFn: (themeId: string) => fPromote({ data: { theme_id: themeId } }),
    onSuccess: (res, themeId) => {
      const title = ranked.find((r) => r.theme.id === themeId)?.theme.title ?? "this theme";
      const carried = (res as { evidence?: number } | undefined)?.evidence ?? 0;
      setReceipt({
        verb: "You kept it",
        consequence: (
          <>
            {title} is now a ranked bet on Decide, carrying <Num>{carried}</Num> signal
            {plural(carried)} of evidence. The Critic scores it next.
          </>
        ),
        handoff: { slug: "critic", name: "Critic" },
      });
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "It did not go through",
        consequence: failureLine("Nothing changed.", e),
        failed: true,
      }),
  });

  /**
   * DECLINE IS ONE KEYSTROKE, SO IT HAS TO SAY WHAT IT IS AND WHAT UNDOES IT.
   *
   * The consequence used to end at "Its evidence is still on the record, and
   * the call is too", which is true and is not the thing that makes declining
   * safe. Two facts were missing and both are the surface's to tell:
   *
   *   1. IT COMES BACK ON ITS OWN. `setThemeStatus` stores
   *      `dismissed_at_frequency`, and the clusterer re-opens the cluster when
   *      `shouldEscalate` passes, which needs it to have BOTH doubled and grown
   *      by at least three. Both numbers are imported from the rule itself, so
   *      this sentence cannot drift from the behaviour it describes.
   *   2. YOU CAN PUT IT BACK YOURSELF, immediately. The Settled block below is
   *      opened here rather than waiting to be found, because the person who
   *      needs it most is the one who just pressed `d` by mistake.
   */
  const decline = useMutation({
    mutationFn: (v: { themeId: string; reason?: string }) =>
      fSetStatus({
        data: { theme_id: v.themeId, status: "dismissed", reason: v.reason || undefined },
      }),
    onSuccess: (_r, v) => {
      const themeId = v.themeId;
      const entry = ranked.find((r) => r.theme.id === themeId);
      const title = entry?.theme.title ?? "this theme";
      const at = entry?.theme.frequency ?? 0;
      setReceipt({
        verb: "You said it is not a pattern",
        consequence: (
          <>
            {title} left the ranking. Its evidence is still on the record, and the call is too. You
            declined it at <Num>{at}</Num> signal{plural(at)}, so it comes back on its own once it
            reaches <Num>{Math.max(at * ESCALATION_MULTIPLE, at + ESCALATION_ABSOLUTE)}</Num>. It is
            under Settled below until then, and you can put it back yourself.
            <DeclineReasonLine themeId={themeId} title={title} />
          </>
        ),
      });
      setShowSettled(true);
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "It did not go through",
        consequence: failureLine("Nothing changed.", e),
        failed: true,
      }),
  });

  /**
   * THE UN-DECLINE, WHICH THE SERVER HAS ALWAYS ACCEPTED AND NOTHING COULD
   * REACH.
   *
   * `setThemeStatus` takes `"new"` as well as `"dismissed"` and clears
   * `dismissed_at_frequency` and `escalated_at` on the way back, so a second
   * decline is measured from where the cluster actually stands rather than from
   * a stale reading. A grep across src/ found exactly one caller of that
   * function, this file, and it only ever sent `"dismissed"`. So the way back
   * was a working server function with no door in the product, which is this
   * repo's signature defect, and a mis-pressed `d` was terminal.
   *
   * It sends `"new"` for a MERGED cluster too, which is the only value the
   * validator accepts and is the right one: back in the ranking as an open
   * call. The evidence edges the merge wrote are left alone on purpose, because
   * they are true statements about what backs that bet whether or not the
   * cluster is still settled, and the receipt says so rather than implying the
   * merge was undone as well.
   */
  const undecline = useMutation({
    mutationFn: (v: { themeId: string; title: string; from: string }) =>
      fSetStatus({ data: { theme_id: v.themeId, status: "new" } }),
    onSuccess: (_r, v) => {
      setReceipt({
        verb: "You put it back",
        consequence:
          v.from === "merged" ? (
            <>
              {v.title} is an open call again. The evidence it already lent to that bet stays lent:
              putting the cluster back does not take it away.
            </>
          ) : (
            <>
              {v.title} is an open call again, and the count it was declined at has been cleared, so
              it is measured from where it stands now.
            </>
          ),
      });
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "It did not go back",
        consequence: failureLine("Nothing changed.", e),
        failed: true,
      }),
  });

  /**
   * DECLINING TWENTY AT ONCE, WHICH USED TO BE TWENTY KEYPRESSES.
   *
   * A sweep of every queue in this product found not one multi-select anywhere,
   * and this station is where that costs most: a night of connector traffic
   * produces a ranking whose bottom half is noise, and the only path through it
   * was `j` `d` `j` `d`. `useSelection` and `SelectionBar` exist for exactly
   * this and had no caller here.
   *
   * DECLINE IS THE ONLY VERB OFFERED IN BULK, and that is a considered limit
   * rather than a first slice.
   *   - Keeping spends a Critic run per cluster and creates a bet per cluster.
   *     Twenty of those from one press is a bill and a queue nobody asked for;
   *     the whole point of the friction rule on the other station is that a
   *     model call should cost more than a click, and this would invert it
   *     twenty-fold.
   *   - Merging needs a target bet PER cluster. One bet for twenty clusters is
   *     a different act with a different meaning, and offering it here would
   *     quietly perform it.
   * Declining is cheap, it is one column write each, and it is the one
   * disposition this surface can already undo from the Settled block below.
   *
   * IT REPORTS WHAT LANDED, NOT WHAT IT SET OUT TO DO. `Promise.allSettled`,
   * because a row-level-security refusal on one cluster must not throw away the
   * nineteen that went through, and a person who ticked twenty needs to know
   * the number rather than a verb.
   */
  const declineMany = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => fSetStatus({ data: { theme_id: id, status: "dismissed" } })),
      );
      const done = results.filter((r) => r.status === "fulfilled").length;
      const firstRefusal = results.find((r) => r.status === "rejected");
      return {
        done,
        failed: ids.length - done,
        why:
          firstRefusal && firstRefusal.status === "rejected"
            ? ((firstRefusal.reason as Error)?.message ?? "The record refused the write.")
            : null,
      };
    },
    onSuccess: (r, ids) => {
      picked.clear();
      setReceipt({
        verb: r.failed === 0 ? "You said they are not patterns" : "Most of them went through",
        consequence:
          r.failed === 0 ? (
            <>
              <Num>{r.done}</Num> cluster{plural(r.done)} left the ranking. Their evidence is still
              on the record and so are the calls. Each one comes back on its own if it grows, and
              they are under Settled below until then.
            </>
          ) : (
            <>
              <Num>{r.done}</Num> of <Num>{ids.length}</Num> left the ranking. <Num>{r.failed}</Num>{" "}
              did not: {r.why} Those are still in the list below.
            </>
          ),
        failed: r.failed > 0,
      });
      setShowSettled(true);
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "None of them moved",
        consequence: failureLine("Nothing changed.", e),
        failed: true,
      }),
  });

  /**
   * MERGE REPORTS THE HALF THAT LANDED, NOT THE VERB IT SET OUT TO DO.
   *
   * `attachThemeToOpportunity` writes two things in sequence: the evidence
   * edges onto the bet, then the cluster's own `merged` status. The second one
   * used to be an unchecked `await`, so a write refused by row-level security
   * resolved silently (supabase-js resolves a refusal rather than throwing) and
   * this receipt printed "You merged it" over a cluster that was still in the
   * ranking and still mergeable into a second bet.
   *
   * The server tells the truth about both halves now, and so does this. The
   * partial outcome is real and worth naming: the bet DID gain the evidence,
   * the cluster did NOT leave the queue, and the person needs to know the
   * second part or they will press `m` again and duplicate the edges under a
   * different parent. It wears the failed treatment, because a disposition that
   * did not dispose is trouble rather than a variation.
   */
  const attach = useMutation({
    mutationFn: (v: { themeId: string; oppId: string }) =>
      fAttach({ data: { theme_id: v.themeId, opportunity_id: v.oppId } }),
    onSuccess: (res) => {
      const r = res as {
        opportunity: { id: string; title: string };
        evidence: number;
        settled: boolean;
        unsettledReason: string | null;
      };
      setPicking(false);
      setReceipt(
        r.settled
          ? {
              verb: "You merged it",
              consequence: (
                <>
                  <Num>{r.evidence}</Num> signal{plural(r.evidence)} now back {r.opportunity.title}.
                </>
              ),
            }
          : {
              verb: "Half of it went through",
              consequence: (
                <>
                  <Num>{r.evidence}</Num> signal{plural(r.evidence)} now back {r.opportunity.title},
                  and the cluster did not close, so it is still in the ranking below.{" "}
                  {r.unsettledReason ?? ""} Merging it again would back the same bet twice.
                </>
              ),
              failed: true,
            },
      );
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "It did not go through",
        consequence: failureLine("Nothing changed.", e),
        failed: true,
      }),
  });

  // The spec brief aggregates every member quote plus the cluster summary,
  // byte-identical to what the retired panel sent, so the drafted spec does
  // not change shape because the surface did.
  const draftSpec = useMutation({
    mutationFn: async (themeId: string) => {
      const entry = ranked.find((r) => r.theme.id === themeId);
      const brief = `Theme: ${entry?.theme.title ?? ""}\n${
        entry?.theme.summary ? `Summary: ${entry.theme.summary}\n` : ""
      }Evidence:\n${(entry?.members ?? []).map((m) => `- "${m.content}" (${m.source})`).join("\n")}`.slice(
        0,
        4000,
      );
      const r = await fDraftSpec({ data: { brief } });
      return { id: r.prd.id };
    },
    onSuccess: (r) => {
      navigate({ to: "/plan/spec/$id", params: { id: r.id }, search: { tab: "contract" } });
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "It did not go through",
        consequence: failureLine("Nothing changed.", e),
        failed: true,
      }),
  });

  const cluster = useMutation({
    mutationFn: () => fCluster({ data: { productId: activeProductId } }),
    onSuccess: (r) => {
      setReceipt({ verb: "You ran the reading", consequence: r.message });
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "It did not go through",
        consequence: failureLine("Nothing changed.", e),
        failed: true,
      }),
  });

  /**
   * WHAT A CAPTURE LEFT BEHIND, in the sink's own numbers.
   *
   * `writeSignals` reports three counts and every one of them is a different
   * fact a person needs: what landed, what was already on the record (the
   * external_id dedup, which is why re-uploading a file is safe), and what the
   * injection screen refused to store. Rolling those into one "Captured." was
   * the surface deciding on the user's behalf that two of the three did not
   * happen.
   */
  function captureConsequence(r: {
    inserted: number;
    skipped: number;
    quarantined: number;
  }): React.ReactNode {
    const parts: React.ReactNode[] = [];
    if (r.inserted > 0) {
      parts.push(
        <React.Fragment key="in">
          <Num>{r.inserted}</Num> signal{plural(r.inserted)} joined the record and{" "}
          {r.inserted === 1 ? "is" : "are"} waiting to be read with everything else.
        </React.Fragment>,
      );
    }
    if (r.skipped > 0) {
      parts.push(
        <React.Fragment key="skip">
          <Num>{r.skipped}</Num> {r.skipped === 1 ? "was" : "were"} already on the record, so
          nothing was duplicated.
        </React.Fragment>,
      );
    }
    if (r.quarantined > 0) {
      parts.push(
        <React.Fragment key="quar">
          <Num>{r.quarantined}</Num> {r.quarantined === 1 ? "was" : "were"} refused: the text
          carries instructions aimed at the agents rather than an observation.
        </React.Fragment>,
      );
    }
    if (parts.length === 0)
      return "Nothing was captured. Every line was too short to be a finding.";
    // Joined here rather than by leading spaces inside each fragment, so a
    // sentence that happens to be the only one never opens with a stray space.
    return (
      <>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {i > 0 ? " " : null}
            {part}
          </React.Fragment>
        ))}
      </>
    );
  }

  // One control, one or many. A single line captures one signal; paste twenty
  // lines and each becomes its own signal. The old surface asked you to pick a
  // mode first, which is a question about our storage, not about your work.
  //
  // ONE ROUND TRIP now, and through a server function that already existed.
  // This looped `createSignal` per line, so pasting forty lines opened forty
  // sequential requests and a failure halfway left twenty captured with no
  // report of which twenty. `bulkImportSignals` has done exactly this job since
  // F3 and nothing in src/routes or src/components had ever called it.
  const capture = useMutation({
    mutationFn: (text: string) =>
      fBulk({
        data: {
          text,
          // The channel token is a fact about the material, not a mode the person
          // picked: one line is a note, many lines is a paste, and the row says so
          // afterwards without anyone having answered a question.
          source: typedCandidates(text).length > 1 ? "paste" : "note",
          project_id: activeProductId,
        },
      }),
    onSuccess: (r) => {
      setReceipt({ verb: "You captured what you heard", consequence: captureConsequence(r) });
      setDraft("");
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({
        verb: "Nothing was captured",
        consequence: failureLine("Nothing changed.", e),
        failed: true,
      }),
  });

  /** A document or a transcript: one signal, kept whole, named. */
  const captureBody = useMutation({
    mutationFn: () =>
      fCreate({
        data: {
          content: bodyText,
          kind: bodyKind,
          source: bodyKind,
          title: bodyTitle.trim() || undefined,
          project_id: activeProductId,
        },
      }),
    onSuccess: (r) => {
      const noun = bodyKind === "transcript" ? "transcript" : "document";
      // THREE OUTCOMES, THREE SENTENCES. The sink can store it, recognise it as
      // one it already holds, or refuse it at the injection screen, and calling
      // the third one "added" would be the surface reporting a write that never
      // happened. The refusal is not a failure of the person, so it does not
      // wear the failed treatment; it is a fact about the file.
      const verb =
        r.inserted > 0
          ? `You added a ${noun}`
          : r.quarantined > 0
            ? `That ${noun} was not stored`
            : `That ${noun} was already here`;
      setReceipt({
        verb,
        consequence: (
          <>
            {captureConsequence(r)}
            {r.dropped > 0 ? (
              <>
                {" "}
                It ran <Num>{r.dropped}</Num> characters past what one signal holds, and that tail
                was not stored.
              </>
            ) : null}
          </>
        ),
      });
      // The composer only closes on a real write. A refusal or a duplicate leaves
      // the text exactly where it is, because closing it would throw away the
      // thing the person still has to decide what to do with.
      if (r.inserted > 0) {
        setBodyOpen(false);
        setBodyTitle("");
        setBodyText("");
        setFileNote(null);
      }
      invalidate();
    },
    onError: (e: Error) =>
      setReceipt({
        verb: `The ${bodyKind === "transcript" ? "transcript" : "document"} was not added`,
        consequence: failureLine("Nothing changed.", e),
        failed: true,
      }),
  });

  /**
   * Read a plain-text file into the composer rather than uploading it.
   *
   * The text becomes the body a person can still edit, which is the honest shape
   * given what this repo can actually parse: there is no PDF or DOCX reader
   * anywhere in it, so the picker offers only formats that really are text, and
   * says so when something else is chosen instead of failing after the fact.
   */
  async function readFile(file: File) {
    setFileNote(null);
    if (!isReadableFileName(file.name)) {
      setFileNote({
        text: `${file.name} is not a format this can read yet. Plain text works: ${READABLE_EXTENSIONS.join(", ")}. For a PDF or a Word file, open it and paste the text in.`,
        failed: true,
      });
      return;
    }
    setFileReading(true);
    try {
      const text = await file.text();
      if (!text.trim()) {
        setFileNote({ text: `${file.name} has no text in it.`, failed: true });
        return;
      }
      setBodyText(text.slice(0, MAX_BODY_CHARS));
      if (!bodyTitle.trim()) setBodyTitle(file.name.replace(/\.[^.]+$/, ""));
      setFileNote({
        text:
          text.length > MAX_BODY_CHARS
            ? `Read ${file.name}, and kept the first ${MAX_BODY_CHARS.toLocaleString()} characters. Edit it before you capture.`
            : `Read ${file.name}. Edit it before you capture.`,
        failed: false,
      });
    } catch (e) {
      setFileNote({
        text: failureLine(`${file.name} could not be read, so nothing went into the composer.`, e),
        failed: true,
      });
    } finally {
      setFileReading(false);
    }
  }

  const captureReady = draft.trim().length >= 2;
  const bodyReady = bodyText.trim().length >= 2;
  const busy =
    promote.isPending ||
    decline.isPending ||
    attach.isPending ||
    undecline.isPending ||
    // A bulk decline can settle the cluster under the Gate, so the single-item
    // verbs stand down for the same reason they do during a single decline.
    declineMany.isPending;

  /**
   * The triage keyboard. Digits dispose, arrows move, Escape backs out.
   *
   * Guarded against every field on the surface, because the capture box is a
   * textarea sitting on the same screen and a person typing "1 more thing" must
   * not promote a bet. `metaKey`/`ctrlKey`/`altKey` are excluded so browser and
   * OS shortcuts keep working.
   */
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable)
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      /**
       * AND NOT WHILE SOMETHING IS OPEN OVER THIS SURFACE.
       *
       * The sharpest case is the shortcut sheet itself: press `?`, read the row
       * that says "a -- Approves the call in front of you", press `a`, and the
       * call behind the scrim is settled. The sheet documents the key and then
       * leaves it armed. `BoardPanel` has the identical shape and opens on an
       * ordinary rail click.
       *
       * The field guards above cannot help: both overlays are made of BUTTONs
       * and a scrim, so focus is never in an INPUT, TEXTAREA or SELECT. The
       * chord handler has stood down under this exact selector for hours; the
       * gates never learned to.
       */
      if (isModalOpen()) return;

      if (e.key === "Escape" && picking) {
        e.preventDefault();
        setPicking(false);
        return;
      }
      // The longer capture composer closes on Escape too, so a person who
      // opened it by mistake is never stuck reaching for the mouse.
      if (e.key === "Escape" && bodyOpen) {
        e.preventDefault();
        setBodyOpen(false);
        setFileNote(null);
        return;
      }
      /**
       * THE COMPOSER SUSPENDS THE TRIAGE KEYBOARD, and this is a correctness
       * guard rather than a nicety.
       *
       * The exclusion above only covers INPUT, TEXTAREA, SELECT and
       * contenteditable. The composer also holds BUTTONS: the kind picker (a
       * radio group that owns the arrow keys itself), the file chooser, the
       * submit. With focus on any of them, "3" reached this handler and
       * declined whatever cluster happened to be in front of you, and an arrow
       * key both moved the radio group and moved the ranking. A destructive
       * disposition fired from a form that has nothing to do with disposition
       * is the exact class of defect a digit-key surface has to be sure about.
       */
      if (!focused || busy || picking || bodyOpen) return;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const next = ranked[Math.min(focusedIndex + 1, ranked.length - 1)];
        if (next) setFocusedId(next.theme.id);
        return;
      }
      if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prev = ranked[Math.max(focusedIndex - 1, 0)];
        if (prev) setFocusedId(prev.theme.id);
        return;
      }
      /**
       * LETTERS, NOT DIGITS, and this station was the last place in the product
       * that broke the rule.
       *
       * FOUNDER RULING 2026-08-05: "if you are using alphanumeric in between it
       * really confuses the user. Either you go with numbers or you go with
       * alphabets." Navigation was converted to the `g` chord that day. This
       * handler was missed, and it was the worst place to miss it.
       *
       * WHY HERE WAS WORST. The rows immediately below this gate are numbered
       * 1 to 6 (`marks={<Num>{i + 1}</Num>}`), and the station marker above
       * reads 01. So a person looking at the third row in the ranking and
       * pressing `3` to pick it DECLINED the first one instead -- a digit
       * meaning position in one place and disposition in another, six pixels
       * apart, with the destructive reading winning. AppFrame's own comment
       * promises "the marker is a bare mono number and the key is in a keycap";
       * on this one screen that safeguard was doing nothing.
       *
       * THE LETTERS ARE THE PRODUCT'S, not chosen for this file. `a` accepts
       * and `d` declines on Today, Design and Crew, so they mean the same thing
       * here: `a` accepts the cluster as a bet, `d` declines it. `m` is the one
       * new letter and it is the first letter of what it does -- merge into a
       * bet you already have.
       */
      if (e.key === "a") {
        e.preventDefault();
        promote.mutate(focused.theme.id);
      } else if (e.key === "m") {
        e.preventDefault();
        setPicking(true);
      } else if (e.key === "d") {
        e.preventDefault();
        decline.mutate({ themeId: focused.theme.id });
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [focused, focusedIndex, ranked, busy, picking, bodyOpen, promote, decline]);

  /**
   * THE HEADLINE NAMES THE NOUN IT COUNTS, and for two audits it named another.
   *
   * `rows` is raw signals (line 412) and `ranked` is clustered themes (line
   * 452) -- the comment on `loading` above has said exactly that since it was
   * written -- and all four branches below said "opportunities". An opportunity
   * is a different and LATER noun in this product: it has its own table, and it
   * is what /decide counts. So one workspace read "97 opportunities imported"
   * here and "31 bets ranked, strongest first." one station to the right, on a
   * product whose whole claim is that it keeps ONE record. Re-measured live
   * through the Lovable MCP on 2026-08-06: 453 signals, 257 themes, 292
   * opportunities, which is three different numbers for the three nouns. That
   * third figure moves under you -- it read 289 when this paragraph was first
   * written and 292 the same day -- which is why the date is on it and why
   * nothing downstream should be derived from it.
   *
   * PROMOTION IS ONE INLET, NOT THE ONLY ONE, and this paragraph said the
   * opposite until 2026-08-06: that an opportunity "exists only once a cluster
   * is promoted". `createOpportunity` in discovery.functions.ts inserts one
   * with no `theme_id` at all, and 209 of the 292 above carry none. The
   * argument is unaffected -- a later, separate noun with its own table and its
   * own count is exactly why the headline must not borrow its name -- but a
   * reader must not leave here thinking the opportunity table is a log of
   * promotions.
   *
   * CLUSTER, NOT THEME, is the word a person reads for a row of `themes`. The
   * button below says "Cluster them now", the Gate beside it explains that
   * "Clustering groups the ones saying the same thing", and /boundary already
   * says "only clusters at 3 out of 5 or worse start on their own". "Theme" is
   * our column name and appears in no sentence a user is shown.
   *
   * THE RANKED-EMPTY BRANCH SAYS "none in the ranking", not "none clustered
   * yet", because `ranked` also drops dismissed, merged and promoted clusters
   * (line 456). A workspace that has judged every cluster it built would
   * otherwise be told it had never built one. What to do next is the Gate
   * directly below, which offers the reading; the headline states the fact.
   *
   * THE ONE NUMBER HERE THAT CAN SATURATE, and the copy now says which number
   * it is. `listSignals` ends its read with a page limit (cited by symbol, not
   * line: discovery.functions.ts is under active edit), so `rows.length` is the
   * size of a PAGE and this branch used to present it as the intake total: "200
   * signals in" on a workspace holding two thousand, and 200 forever after,
   * because the page size does not grow with the record. Measured 2026-08-06
   * the largest production workspace held 98 signals, so it was not live -- but
   * a sentence that becomes a lie at a threshold is a lie waiting on traffic,
   * and this station's whole argument is that the record is not edited.
   *
   * "The newest N" is what is true at every N. It names the slice without
   * naming the cap, which is the constraint that kept this unfixed before: a
   * second copy of the limit as a literal in this file is a number that goes
   * stale the day the server's changes, and that is the rot this repo keeps
   * paying for. Nothing here restates it. The same sentence shape appears twice
   * more -- the comprehension strip and the Gate's "signals captured" -- and
   * both are fixed the same way, because a defect is a shape rather than a
   * location.
   *
   * The durable fix is still in the read: return a total beside the page, the
   * way `listThemes` already does, and this can state the shortfall outright.
   */
  const headline: React.ReactNode = loading ? (
    "Reading what has come in."
  ) : loadError ? (
    "The record could not be read."
  ) : rows.length === 0 ? (
    "Your sources have sent nothing yet."
  ) : ranked.length === 0 ? (
    <>
      The newest <Num>{rows.length}</Num> signal{plural(rows.length)}, none in the ranking.
    </>
  ) : ranked.length === 1 ? (
    "One cluster needs your decision."
  ) : (
    <>
      <Num>{ranked.length}</Num> clusters need your decisions.
    </>
  );

  const cov = coverage.data;
  const claim = noveltyRead(focused?.theme.novelty);
  /* TWO CLAUSES ONLY WHEN THERE ARE TWO FACTS. The Gate said "First heard 1d
     ago, most recently 1d ago" -- a span is IDENTICAL BY CONSTRUCTION on any
     cluster built from one signal, because the theme is created at the moment
     the signal it holds arrives, and it is identical again on any cluster whose
     signals all landed inside one `since` bucket, which for a cluster older
     than a day means all of them on the same day. So the commonest cluster on
     the desk spent a whole line of the Gate saying one thing twice and dressing
     it as a range. Compared on the RENDERED string rather than on the
     timestamps, because the rendered string is what a reader can tell apart:
     two moments nine hours apart both read "1d ago", and printing them as a
     span would be the surface claiming a spread it is not showing. */
  const firstHeard = since(focused?.theme.created_at);
  const lastHeard = since(focused?.lastAt);
  const heardInOneBreath = firstHeard === lastHeard;
  const seenBefore = precedent.data?.precedent ?? [];
  const priorTheme = precedent.data?.priorTheme ?? null;
  /** Whether the precedent read has actually NAMED something. The Gate's
   *  novelty clause is allowed to be stronger when it has, because the recess
   *  directly below it then carries the name and the door. */
  const precedentNamed = seenBefore.length > 0 || Boolean(priorTheme);

  /* WHETHER THE CONTEXT COLUMN HAS ANYTHING TO SAY, decided here rather than
     left to the prop.
     `context={<>...</>}` was a lie to `Surface`: a JSX fragment is an object
     and an object is truthy, so the `{context ? <aside className="sp-ctx"> :
     null}` test in primitives.tsx passed on EVERY render, including the ones
     where all four sections below evaluate to null. The result was a 316px
     bordered aside holding a starfield gradient and nothing else -- on a
     workspace with no sources, on the first paint of every visit before the
     reads land, and permanently on a failed fleet read.
     /decide computes the same answer before the prop (`context={activeOpp ?
     ... : null}`); this does it the same way, with one flag per section so the
     condition here can never drift from what the section actually renders. */
  const fleetFailed = fleet.isError;
  /* A FAILED COVERAGE READ IS NOT AN INTAKE WITH NOTHING IN IT, and until now
     the two were the same pixel. `fleet` six lines up has carried an error arm
     since it was written, with a comment stating the principle -- two different
     facts, and a person acts differently on each -- while `coverage` had none.
     When `getSenseCoverage` failed, `cov` was undefined, `hasCoverage` went
     false, and the whole "What is feeding this" section left the rail silently,
     taking the quiet-source warning with it. The rest of the column still drew,
     so the reader saw an intact context rail with no warning in it and
     concluded their intake was healthy -- which is the exact outcome that
     section exists to prevent, per its own note: a source that has gone quiet
     is invisible unless something says so. */
  const coverageFailed = coverage.isError;
  const hasCoverage = !!cov && cov.sources.length > 0;
  /** The sources the rail actually draws a row for. */
  const shownSources = cov ? cov.sources.slice(0, SOURCES_IN_CONTEXT) : [];
  /* THE QUIET SOURCES A READER CANNOT ALREADY SEE, which is the only set the
     summary line below the list can tell anyone anything about.
     `getSenseCoverage` sorts by `recent` descending and a quiet source is one
     with `recent === 0`, so the quiet ones sit at the BOTTOM of the list and
     are the first to fall past `SOURCES_IN_CONTEXT`. That makes the summary
     valuable exactly when something is hidden and pure restatement when
     nothing is: every drawn quiet source already says "quiet for 7d, sent N
     before that" on its own row, so a summary counting those same rows put a
     fourth source-shaped row in a rail whose own header had just said three.
     Nothing is suppressed by this -- a quiet source is an exception and every
     one of them is still named, either on its row or in this line. */
  const hiddenQuiet = cov ? cov.sources.slice(SOURCES_IN_CONTEXT).filter((s) => s.quiet) : [];
  /* WHETHER THE WATCHING HAS ANYTHING TO SAY, computed separately from whether
     any signal ever arrived, because the case that matters most is exactly the
     one where those two disagree.
     A scout erroring on every target produces NO signals, so `cov.sources` is
     empty, so `hasCoverage` is false -- and the section below used to be gated on
     `hasCoverage` alone. **The workspace whose watching is most broken is the
     workspace this section would have said nothing to.** That is the shape of
     defect this whole surface keeps paying for: the reader who needs the warning
     is the one the condition excludes. */
  const scout = cov?.watching;
  const hasWatching = !!scout && (scout.unread || scout.targets > 0 || scout.checks > 0);
  const hasEvidence = !!focused && focusedMembers.length > 0;
  const hasContext =
    !!watcher || fleetFailed || coverageFailed || hasCoverage || hasWatching || hasEvidence;

  /* The comprehension strip renders only over landed reads, so every number on
     it is one the page can actually show; a segment whose region is absent
     renders as plain text rather than a control that does nothing. */
  const rankingShown = !picking && ranked.length > 1;
  const stripSources = !coverageFailed && hasCoverage;
  const showStrip = !loading && !loadError && !signalsEmpty && (stripSources || ranked.length > 0);
  /* "The newest N", not "N signals in", for the reason set out in full above
     `headline`: `rows.length` is the size of one page of `listSignals` and this
     said it was the intake total. Same fix, no copy of the cap. */
  const clustersFacts = (
    <>
      The newest <Num>{rows.length}</Num> signal{plural(rows.length)}, <Num>{ranked.length}</Num>{" "}
      cluster{plural(ranked.length)} open
      {unclustered > 0 ? (
        <>
          , <Num>{unclustered}</Num> loose
        </>
      ) : null}
    </>
  );

  /*
   * ONE FACT, ONE DOOR, AND NOTHING DRAWN UNDERNEATH IT.
   *
   * When the session is gone every read on this desk fails, so there is no
   * ranking to show, no evidence to weigh and no bet to decide. Drawing the
   * regions anyway gave three identical sign-in doors under a headline that
   * could not be true. The honest page is the fact, what is still true, and
   * the way back.
   *
   * The title carries the reassurance rather than the failure: what a person
   * fears on the desk that holds their sources is that the record of what came
   * in has gone, and it has not.
   */
  if (endedSession) {
    return (
      <Surface>
        <div className="flex flex-col items-start gap-mrd-5">
          <PageHeading
            title="Your sources are still here."
            sub={`Nothing that came in has been lost. ${endedSession}`}
          />
          <Action onClick={() => window.location.assign("/login")}>Sign in</Action>
        </div>
      </Surface>
    );
  }

  return (
    /*
     * `rhythm` BECAUSE THIS PAGE'S SECTIONS WERE TOUCHING (2026-09-01).
     * Measured on the rendered surface at 1512px: eight top-level sections with
     * gaps of 10, 0, 0, 0, 0, 0, 0 between them. `Surface` supplied none (see
     * its `rhythm` prop for why it cannot default it on) and this page supplied
     * none either, so the heading, the sources, the review queue, the ranking,
     * Settled, Capture and the boundary were rendered flush against one another.
     */
    <Surface
      rhythm
      context={
        hasContext ? (
          <>
            {watcher ? (
              <>
                <CtxHead>Reading for you</CtxHead>
                <CtxRow
                  mark={
                    <AgentMark
                      slug={watcher.slug}
                      name={watcher.name}
                      state={markState(watcher.state)}
                    />
                  }
                  name={agentDisplayName(watcher.slug, watcher.name)}
                  sub={
                    since(watcher.lastActiveAt) ? (
                      <>
                        last read <Num>{since(watcher.lastActiveAt)}</Num>
                      </>
                    ) : (
                      "has not read anything yet"
                    )
                  }
                />
              </>
            ) : fleetFailed ? (
              /* THE FLEET READ FAILED, AND THAT IS NOT "no agent is reading".
               This branch did not exist: `watcher` is derived from
               `fleet.data`, so an errored read left it null and the section
               rendered nothing, which said the same thing a workspace with no
               Sense agent says. Two different facts, and a person acts
               differently on each -- the primitives file makes that binding.
               It also kept the rail alive for the retry, which was the other
               half of the defect: with no branch here a failed read produced
               an empty rail with no way to ask again. */
              <>
                <CtxHead>Reading for you</CtxHead>
                {/* ReadFailedLine, not ReadFailed: the bordered half of that
                    pair draws its own box, and this sits inside the context
                    rail under a CtxHead that already frames it. Two containers
                    around one sentence is a frame, and the rail is 316px wide. */}
                <ReadFailedLine onRetry={() => void fleet.refetch()} error={fleet.error}>
                  Who is reading for you did not load.
                </ReadFailedLine>
              </>
            ) : null}

            {/* WHAT IS FEEDING THIS DESK. The agent has had `sources.status`
            since 2026-06-30 and the person reading its output had nothing.
            A ranking is only as trustworthy as the intake behind it, and a
            source that has gone quiet is invisible unless something says so.

            Reads `hasCoverage` rather than restating the test, so the flag that
            decides whether the aside is drawn at all and the test that decides
            whether this section renders are the same expression. */}
            {coverageFailed ? (
              /* The same rule the fleet branch above states, applied to the read
                 that carries the quiet-source warning. A silent section here is
                 read as "your intake is fine", which is the most reassuring
                 possible rendering of a read that produced no information. */
              <>
                <CtxHead>What is feeding this</CtxHead>
                <ReadFailedLine onRetry={() => void coverage.refetch()} error={coverage.error}>
                  What is feeding this desk did not load, so nothing here would name a source that
                  has gone quiet.
                </ReadFailedLine>
              </>
            ) : (hasCoverage || hasWatching) && cov ? (
              <>
                <CtxHead>What is feeding this</CtxHead>
                {(hasCoverage ? shownSources : []).map((s) => (
                  <CtxRow
                    key={s.source}
                    /* The mark, so a reader recognises the source before reading
                       its name. Brand where we have the brand, kind otherwise. */
                    source={s.source}
                    /* The readable name, not the column value. `getSenseCoverage`
                     groups on `source_kind || source`, so this list used to read
                     "pull_connector" and "manual" at a person, which are our
                     words for our lanes and nobody else's words for anything. */
                    name={sourceLabel(s.source)}
                    title={
                      capturedByHand(s.source)
                        ? s.source
                        : "Open this source in Settings, Connections"
                    }
                    /* THE DOOR TO THE CONNECTOR. A row here says a source has gone
                     quiet, which is the most actionable fact in the column, and
                     it led nowhere: the only way to act on it was to remember
                     that connectors live three clicks away in Settings.

                     The grouping key rides along as `?connector=`. Settings
                     already resolves that against the provider registry and
                     falls back to the list for anything it does not recognise,
                     which is exactly right here: the key is a LANE token
                     ("pull_connector") for anything the sink stamped and a
                     provider token ("github") for the older rows, so the link
                     lands on the connector when we can name it and on the
                     connector list when we cannot.

                     Captured by hand is not a connector and gets no door.
                     Its way in is the capture box on this same page, and
                     pointing it at Connections would be a promise the
                     destination cannot keep. */
                    onClick={
                      capturedByHand(s.source)
                        ? undefined
                        : () =>
                            navigate({
                              to: "/settings",
                              search: { section: "connections", connector: s.source },
                            })
                    }
                    sub={
                      s.quiet ? (
                        <>
                          quiet for <Num>7d</Num>, sent <Num>{s.prior}</Num> before that
                        </>
                      ) : (
                        <>
                          <Num>{s.recent}</Num> in <Num>7d</Num>
                          {s.lastAt ? (
                            <>
                              , last <Num>{since(s.lastAt)}</Num>
                            </>
                          ) : null}
                        </>
                      )
                    }
                  />
                ))}
                {cov.sources.length > SOURCES_IN_CONTEXT ? (
                  <CtxBody>
                    <Num>{cov.sources.length - SOURCES_IN_CONTEXT}</Num> more source
                    {plural(cov.sources.length - SOURCES_IN_CONTEXT)}.
                  </CtxBody>
                ) : null}
                {/* THE MOST ACTIONABLE LINE ON THE PAGE, and it was a paragraph.
                A source that used to deliver and has stopped is the one fact
                here that says DO SOMETHING, and it said it with no way to do
                anything. It names which sources went quiet on its second line,
                because "3 sources" and "GitHub, Intercom, Zendesk" are
                different facts and only the second one tells you whether to
                care.

                IT COUNTS THE ONES YOU CANNOT SEE NOW, not all of them. Gated on
                `cov.quietCount` it drew whenever anything anywhere was quiet,
                including when every quiet source was already drawn as its own
                row saying "quiet for 7d, sent N before that" a few pixels above
                -- and because it is a CtxRow it wears the same shape as a
                source, so a rail whose header had just listed three sources
                showed four source-shaped rows and the fourth was a restatement
                of the third. It is drawn only when it holds a name the list
                does not, and it says "of them" because the "N more sources"
                line directly above is the set it counts inside; that line is
                present whenever this one is, by construction -- there can only
                be a hidden source when the list overflowed. Nothing is
                suppressed: a quiet source is an exception, and every one of
                them is still named, either on its own row or here. */}
                {hiddenQuiet.length > 0 ? (
                  <CtxRow
                    name={
                      <>
                        <Num>{hiddenQuiet.length}</Num> of them used to deliver and{" "}
                        {hiddenQuiet.length === 1 ? "has" : "have"} not this week
                      </>
                    }
                    sub={hiddenQuiet.map((s) => sourceLabel(s.source)).join(", ")}
                    title="Open Connections in Settings"
                    onClick={() =>
                      navigate({ to: "/settings", search: { section: "connections" } })
                    }
                  />
                ) : null}

                {/* WHETHER THE WATCHING ITSELF IS WORKING, which the scout has
                been writing down on every run since 2026-06-30 and nothing has
                ever read. `scout_runs` carries an `outcome` per target and its
                CHECK constraint allows `error` and `skipped-cap`; the only query
                against the table summed `fetch_count` for the daily cap.

                THIS IS NOT A SECOND OPINION ON THE ROWS ABOVE, it is the fact
                they cannot carry. `quiet` up there is computed from signals
                alone, so a source whose every fetch errors delivers nothing and
                reads as quiet -- and "quiet" means the source has nothing new
                for you, when the truth is that we could not reach it. One is
                somebody else's product going still and the other is ours being
                broken, and they were the same row.

                THE THREE UNHAPPY OUTCOMES NEED DIFFERENT THINGS, so they are
                three rows and never one count. Ordered worst first, because the
                rail is narrow and the reader stops early. */}
                {scout && scout.unread ? (
                  /* The read that carries the failure warning failed. Same rule
                     as the two branches above it: a silent section here reads as
                     "your watching is fine", which is the most reassuring
                     possible rendering of a read that produced no information. */
                  <CtxRow
                    name="Whether your sources were checked did not load"
                    sub="the sources above are still accurate"
                  />
                ) : scout ? (
                  <>
                    {scout.errors > 0 ? (
                      <CtxRow
                        name={
                          <Value tone="fail">
                            <Num>{scout.errors}</Num> check{plural(scout.errors)} could not read the
                            source
                          </Value>
                        }
                        /* THE CAUSE, not just the count, because they send a
                           person to different places. `detail` is the scout's
                           own error string and it is the most specific thing
                           anyone has about why. Clipped, since the rail is 316px
                           and the row is one line. */
                        sub={
                          scout.lastErrorDetail
                            ? `most recent: ${scout.lastErrorDetail.slice(0, 90)}`
                            : "no reason was recorded"
                        }
                        title={scout.lastErrorDetail ?? undefined}
                      />
                    ) : null}

                    {scout.capped > 0 ? (
                      /* AMBER AND NOT RED, AND NOT ORCHID EITHER, which is the
                         one colour decision on this row worth writing down.
                         Red reports an outcome, and a capped check is not a
                         failure: the scout worked exactly as configured and the
                         configuration is what ran out. Orchid promises that a
                         person is REQUIRED, and nobody is -- the cap will reset
                         tomorrow on its own. Amber is "waiting on a condition",
                         the condition is the cap, and the door below is how you
                         change the condition rather than a demand that you do.
                         Painting this as a fault is the exact amber/orchid
                         confusion K-18 found on the gates. */
                      <CtxRow
                        name={
                          <Value tone="hold">
                            the daily cap stopped <Num>{scout.capped}</Num> check
                            {plural(scout.capped)} early
                          </Value>
                        }
                        sub="raise it in Settings, or leave it and they run tomorrow"
                        title="Open Connections in Settings"
                        onClick={() =>
                          navigate({ to: "/settings", search: { section: "connections" } })
                        }
                      />
                    ) : null}

                    {scout.checks > 0 && scout.errors === 0 && scout.capped === 0 ? (
                      /* THE HEALTHY CASE, AND IT DOES NOT SHOUT. No tone at all:
                         `unchanged` is the ordinary state of a source that is
                         being watched properly, and a green mark on it would
                         spend the outcome colour on nothing happening. It is
                         here at all because "we checked and there was nothing"
                         and "we did not check" are different facts, and without
                         this row the absence of a warning meant both. */
                      <CtxRow
                        name={
                          <>
                            <Num>{scout.checks}</Num> check{plural(scout.checks)} in <Num>7d</Num>,
                            none failed
                          </>
                        }
                        sub={
                          since(scout.lastCheckAt)
                            ? `last ${since(scout.lastCheckAt)}`
                            : "watching your sources"
                        }
                      />
                    ) : null}

                    {scout.checks === 0 && scout.targets > 0 ? (
                      /* NOTHING THIS WEEK, AND THAT IS NOT EVIDENCE OF A FAULT,
                         which is why it carries no tone and makes no claim.
                         Measured in `scout/diff.ts`: `backoffNext` multiplies the
                         cadence by `min(2 ** consecutiveUnchanged,
                         MAX_BACKOFF_FACTOR)` and the factor caps at 8, so a
                         WEEKLY target that keeps coming back unchanged
                         legitimately waits up to 56 days between checks. A dead
                         cron and a healthy backed-off target look identical over
                         seven days, and `scout_runs` cannot tell them apart. So
                         this says WHEN and lets the reader judge, rather than
                         guessing WHETHER and telling somebody their watcher is
                         broken when it is resting. */
                      <CtxRow
                        name={
                          <>
                            <Num>{scout.targets}</Num> source{plural(scout.targets)} watched, none
                            checked this week
                          </>
                        }
                        sub={
                          since(scout.lastCheckAt)
                            ? `last checked ${since(scout.lastCheckAt)}; a quiet source is checked less often`
                            : "nothing has been checked yet"
                        }
                        title="Open Connections in Settings"
                        onClick={() =>
                          navigate({ to: "/settings", search: { section: "connections" } })
                        }
                      />
                    ) : null}
                  </>
                ) : null}
              </>
            ) : null}

            {/* The evidence, and it belongs to the ONE cluster in focus. This
            is what the whole signal feed panel was for; here it is doing
            the job it was actually needed for, verbatim and attributed.

            Reads `hasEvidence` for the reason the section above reads
            `hasCoverage`: one expression, used twice. */}
            {hasEvidence && focused ? (
              <>
                <CtxHead>What backs this</CtxHead>
                {focusedMembers.slice(0, QUOTES_IN_FOCUS).map((s) => (
                  <CtxRow
                    key={s.id}
                    /* Which source this sentence was lifted out of, said as a
                       mark rather than as more words. The founder's case: "this
                       is coming from Intercom, this is coming from Slack". */
                    source={s.source}
                    /*
                     * ── THE QUOTE IS NO LONGER CUT BEFORE CSS SEES IT ────────
                     * (2026-09-01, found by opening a cluster rather than by
                     * reading this file.)
                     *
                     * This read `signalPreview(s.content, 96)`. Measured on the
                     * expanded cluster: the rendered evidence ended *"...not on
                     * a phone. The address…"* -- a customer's verbatim sentence,
                     * hard-cut in JavaScript, with no `title`, no expand and
                     * nowhere else on the page carrying the rest.
                     *
                     * TWO CUTS WERE STACKED AND THE FIRST ONE WAS THE HARMFUL
                     * ONE. `CtxRow` already truncates `name` with CSS, at the
                     * width the rail actually has. A JS cut in front of that
                     * throws characters away BEFORE the browser gets to decide,
                     * so on a wide rail the row had room it was not allowed to
                     * use, and the discarded text was unrecoverable either way.
                     * Handing over the whole string lets the visible cut happen
                     * at the real width and keeps the words in the DOM.
                     */
                    name={s.content}
                    /* THE QUOTE OPENS THE THING IT CAME FROM. `signals.url` has
                     held the ticket, the thread or the review this sentence was
                     lifted out of since the table was created, and no surface
                     ever rendered it, so the evidence under a call was a wall of
                     quotes you had to take on trust. A new tab rather than a
                     navigation: the address belongs to somebody else's product,
                     and leaving triage to read one comment loses the queue.

                     A signal with no url keeps no door, which is most hand
                     captured ones: there is nowhere to send you, and a row that
                     lights up and does nothing is the defect this whole pass is
                     about. */
                    /*
                     * ── ONE `title` SLOT, TWO JOBS, AND THE QUOTE COMES FIRST ─
                     * This carried only the URL, so the single recovery path
                     * for a cut quote was spent naming a destination -- on the
                     * one section whose entire job is to show the evidence
                     * verbatim. This file's own header already calls that "the
                     * worst" case and fixed half of it (the NAME had been the
                     * URL); the quote was still cut and the title still gone.
                     *
                     * Both now, quote first, because the sentence is the thing
                     * a person is being asked to trust and the address is
                     * secondary. The row's door is unchanged -- an `onClick`
                     * that opens the source in a new tab -- so nothing was
                     * traded away to make room.
                     *
                     * A `title` is a floor and not the answer: absent on touch,
                     * absent for a keyboard reader. It is the right instrument
                     * HERE because this is a dense rail row whose full content
                     * opens on click, and the alternative -- a `Reveal` in every
                     * quote of an evidence list -- would put a control on every
                     * row of a scan column.
                     */
                    title={s.url ? `${s.content}\n\nOpens the source: ${s.url}` : s.content}
                    onClick={
                      s.url
                        ? () => {
                            window.open(s.url as string, "_blank", "noopener,noreferrer");
                          }
                        : undefined
                    }
                    /* WHERE THIS ONE CAME FROM, in words. A quote a colleague
                     typed by hand and a quote a connector pulled at 4am are the
                     same shape on screen and are not the same level of
                     evidence, and the raw token ("note", "pull_connector") was
                     our column value rather than a sentence.

                     AND WHETHER IT IS REAL, which this one line did not say
                     while every sibling did. The `is_sample` chain marks the
                     ranking row below, the Gate above it, and the source bet on
                     a spec -- and stopped at the individual quote, which is the
                     most literal thing on the surface: the sentence itself, with
                     where it came from beside it. Re-measured live through the
                     Lovable MCP on 2026-08-06: 20 of 453 signals are samples,
                     and 13 of those 20 carry neither the `manual` lane nor a
                     hand-captured channel, so `capturedByHand` returned false
                     and every one of the 13 printed ", sensed". Two are
                     `source: "analytics"` with a null `source_kind`, which is
                     how the rail came to read "Analytics, sensed, 2m ago" under
                     an invented number on a workspace with no connector attached
                     at all.

                     NOT "seeded signals carry a channel and no lane", which is
                     what this comment claimed until 2026-08-06 and is false for
                     8 of the 20: seven are stamped `source_kind: "manual"` and
                     one `"web_scout"`. The exact split above is the claim worth
                     keeping, and it is a statement about the seed as it stands
                     today rather than an invariant -- change which lanes the
                     seed migration stamps and the 13 moves, while the branch
                     below stays right, because it keys on `is_sample` and not
                     on the lane.

                     "Sensed" is a claim that we read this out of the user's own
                     tools, so a sample row does not make it, and carries the
                     same Example mark in the same words the ranking row uses.
                     The channel stays: it is what the seed says it is imitating,
                     and the mark in front of it qualifies the whole line.
                     `listSignals` selects `*`, so the column is already here. */
                    sub={
                      <>
                        {s.is_sample ? (
                          <>
                            <b>Example</b>
                            {" · "}
                          </>
                        ) : null}
                        {sourceLabel(s.source, s.source_kind)}
                        {s.is_sample || capturedByHand(s.source, s.source_kind)
                          ? ""
                          : ", sensed"}, <Num>{since(s.created_at)}</Num>
                      </>
                    }
                  />
                ))}
                {focusedMembers.length > QUOTES_IN_FOCUS ? (
                  <CtxBody>
                    <Num>{focusedMembers.length - QUOTES_IN_FOCUS}</Num> more say the same thing.
                  </CtxBody>
                ) : null}
              </>
            ) : null}
          </>
        ) : null
      }
    >
      {/* THE AUTONOMOUS PATH, VISIBLE, ON STATION 01. Renders nothing unless a
          mission row in this workspace is running, so it costs no space when
          the crew is idle and cannot show a step that did not happen. It sits
          above the headline for the same reason it does on Decide, Build and
          Ship: the crew line is about the workspace, and the station's own
          reporting starts below the title.

          IT IS NOT THE LINE BELOW IT, and the two never say the same thing.
          `AgentRelay variant="station" station="sense"` reports only agents
          whose station resolves to sense, in the swarm HUD's own read; this
          reports any mission mid-run, whichever station it is standing on, so
          an Engineer building while you read clusters is finally visible from
          here. Both are honest about their own scope, which is why they can
          share a surface.

          WHAT IT DOES NOT COVER, said plainly so nobody assumes otherwise:
          clustering. `clusterSignals` reaches `clusterSignalsCore`, which
          touches signals, themes and lineage and writes no mission row at all,
          so pressing "Cluster them now" is still reported by the button's own
          label and nothing else. See use-live-agents.ts. */}
      <CrewWorking station="sense" />
      {/*
       * THE PAGE'S OWN NAME, ADDED FOR P-14a. `headline` below has always
       * carried this page's ONLY title, and it is computed -- "Discover"
       * while loading, then a count-based sentence -- so the page had no
       * FIXED name outside the browser tab. Nothing computed changes:
       * `headline`/its own `sub` still carry every fact they did, one level
       * down (`level={2}`), so this is additive rather than a rewrite of
       * what the page reports.
       */}
      <PageHeading station="sense" title="Findings" sub="What came in, and what it is becoming." />
      <PageHeading
        level={2}
        title={headline}
        sub={
          ranked.length > 0
            ? "Ordered by how severe, how recent, and how new to the record each one is."
            : undefined
        }
      />

      {/* THE STATION IN ONE ROW: what flows in, what it groups into, where the
          work goes next. Each segment opens the region it names; a segment
          whose region is not on screen renders as plain text instead. */}
      {showStrip ? (
        <div className="mt-mrd-4 flex flex-wrap items-center gap-x-mrd-3 gap-y-mrd-1 text-mrd-small text-mrd-mute">
          {stripSources && cov ? (
            <>
              <button
                type="button"
                onClick={() => navigate({ to: "/settings", search: { section: "connections" } })}
                title="Open Connections in Settings"
                className="flex items-center gap-mrd-2 rounded-mrd-xs transition-colors hover:text-mrd-ink"
              >
                {cov.sources.slice(0, 3).map((s) => (
                  <SourceMark key={s.source} source={s.source} size={14} />
                ))}
                <span>
                  <Num>{cov.sources.length}</Num> source{plural(cov.sources.length)} feeding this
                  desk
                </span>
              </button>
              <Chevron />
            </>
          ) : null}

          {ranked.length > 0 ? (
            <>
              {rankingShown ? (
                <button
                  type="button"
                  onClick={() => {
                    const el = rankingAnchor.current;
                    if (!el) return;
                    el.scrollIntoView({ block: "start" });
                    el.focus({ preventScroll: true });
                  }}
                  title="Show the ranking"
                  className="rounded-mrd-xs text-left transition-colors hover:text-mrd-ink"
                >
                  {clustersFacts}
                </button>
              ) : (
                <span>{clustersFacts}</span>
              )}
              <Chevron />
            </>
          ) : null}

          <button
            type="button"
            /* P-14 (A-QUEUE.md ruling, R-34): /decide is deleted -- the
               ranked queue's home is Start's "Or start one of these" (top
               three by ICE) and Find anything › Findings. */
            onClick={() => navigate({ to: "/start", search: {} })}
            title="Open Start"
            className="rounded-mrd-xs transition-colors hover:text-mrd-ink"
          >
            {promotedCount > 0 ? (
              <>
                <Num>{promotedCount}</Num> became bet{plural(promotedCount)}
              </>
            ) : (
              "none became bets yet"
            )}
          </button>
        </div>
      ) : null}

      {/* The live line, present only while Sense actually has a run going.
        It renders nothing when the stage is quiet. */}
      <AgentRelay variant="station" station="sense" workspaceId={activeWorkspaceId} />

      {/* THE LINK LANDED, AND THE CLUSTER IT NAMED IS ALREADY JUDGED.

        This sits ABOVE the Gate because it is about the thing the person
        clicked, and the Gate is now showing something else. Without it the
        surface silently swapped their question for the top of the ranking,
        which is the exact complaint the route file records against the old
        behaviour: "landed you on whichever cluster happened to rank first,
        with nothing saying why".

        THE DOOR IS THE GRAPH, NOT THE QUEUE, for the same reason the precedent
        Record below sends people there. A promoted cluster's bet may since have
        shipped or been dropped, so it is not on /decide, and sending someone to
        a list that does not contain the thing they clicked is a worse dead end
        than no link at all. `theme` is a declared graph kind, and what the
        graph draws is the cluster with everything that led to it and everything
        that came out of it, which for a promoted cluster IS the bet. */}
      {focusSettled && !linkNoticeClosed && !loadError && !loading ? (
        <Region title="That cluster has already been judged">
          {/* NothingYet, the bare half: this sits under a Region heading that
              already frames it, and Meridian caps a region at one bordered box.
              `NothingHere` is for where the region itself is missing. */}
          <NothingYet
            action={
              <>
                <Action
                  variant="primary"
                  onClick={() =>
                    navigate({
                      to: "/outcomes",
                      search: { tab: "graph", focusKind: "theme", focusId: focusSettled.id },
                    })
                  }
                >
                  Open its chain
                </Action>
                <Action variant="quiet" onClick={() => setLinkNoticeClosed(true)}>
                  Dismiss
                </Action>
              </>
            }
          >
            {focusSettled.title}. {settledWord((focusSettled.status ?? "new") as string)}, so it is
            not in the ranking and the call below is a different one.
          </NothingYet>
        </Region>
      ) : null}

      {loadError ? (
        /* ReadFailed, the BORDERED half, and this is the one place on the
           surface that earns it. When this branch renders there is no region
           left on screen -- the ranking, the settled list, the capture box and
           the boundary all guard on `!loadError` -- so the box is the only
           thing drawing a boundary, which is exactly the case its header names.
           It also carries the sentence the bare line could not: nothing has
           been changed and nothing has been lost. */
        <ReadFailed
          onRetry={() => {
            if (signals.error) void signals.refetch();
            if (themes.error) void themes.refetch();
          }}
          error={loadError}
        >
          {/*
           * THIS RENDERED `loadError.message` AND IT WAS THE LAST ONE IN THIS
           * PREFIX. Photographed against a genuinely expired session, /discover
           * read: "The record could not be read." then "Unauthorized: Invalid
           * token" then the reassurance then a Try again that could never work.
           * The headline eleven hundred lines up already states the failure, so
           * the raw string was not even filling a gap -- it was the second
           * sentence, and it was the log.
           *
           * The headline keeps the state; this carries the consequence, plus
           * the server's own sentence where the server wrote one for a person.
           * `error` gets S0's wayOut, so an ended session is handed a sign-in
           * door rather than a retry against a dead token.
           */}
          {reasonLine("Nothing below would be right, so nothing is shown.", loadError)}
        </ReadFailed>
      ) : loading ? (
        /* One wait line per page: the heading above already says what is
           being read, so the list holds its place silently. */
        <div aria-hidden className="min-h-[96px]" />
      ) : signalsEmpty ? (
        <div className="flex flex-col gap-mrd-3">
          {/* P-53: not a picker. "Which source should it read first?" had one
              real answer -- none is connected yet -- so this is the zero
              state it always was, `Quiet` rather than a choice among options
              with no shared fact between them. */}
          <Quiet
            says="Nothing is connected yet, so there is nothing to read."
            whatWillAppear="Reading starts the moment a source is linked, or capture something yourself below: a note, a pasted list, a document, a transcript. Nothing has to be connected first."
            action={
              // P-63: the sentence above already tells the capture box below
              // is the other door; this is the one that leaves the page.
              <Action
                onClick={() => navigate({ to: "/settings", search: { section: "connections" } })}
              >
                Connect a source
              </Action>
            }
          />
          {/*
           * THE SAMPLE DOOR NOW SAYS WHAT PRESSING IT DOES, because the
           * sentence that stood here said close to the opposite of the code
           * under it. It read: "The sample opens a separate Explore
           * workspace of labelled example data. Yours stays empty." Two
           * things were wrong with that and only one of them was a word.
           *
           *   1. "OPENS ... YOURS STAYS EMPTY" reads as a preview standing
           *      beside the person's own desk. It is not one. The mutation
           *      above calls `setActiveWorkspaceId(id)` on success, which
           *      writes that id to `localStorage` (`use-workspace.tsx:175`),
           *      so the press is a MOVE and a sticky one: every later visit
           *      lands in the sample until the person switches back. Their
           *      own workspace does stay empty, which is why that fact is
           *      kept, but standing alone it invited the reading that they
           *      were still standing in it.
           *   2. "LABELLED" WAS A PROMISE THE ROWS CANNOT KEEP.
           *      `seed_sample_workspace` inserts every theme, signal,
           *      opportunity and spec with no `is_sample` column, so each
           *      row takes the `false` default and the row-level Example
           *      marks this very surface renders (the `is_sample` branches
           *      further down) never fire. Measured in production: 2,144
           *      rows across sample workspaces, none marked. A separate
           *      migration fixes the seed for FUTURE workspaces, and the
           *      rows already seeded stay unmarked, so a labelling promise
           *      made here would be false for the person reading it today.
           *
           * What IS true today is what gets said instead. The WORKSPACE
           * carries the flag (`seed-workspace.server.ts:276` writes
           * `is_sample: true` on the workspace row), the switcher in the top
           * bar renders that workspace, and the switcher is the way back.
           * Named the way a person names it, not by its component.
           */}
          {sampleOffered ? (
            <p className="mrd-copy text-mrd-mute">
              The sample is a move, not a preview: it switches you into a separate Explore workspace
              of example data, and later visits land there until you switch back. Your own workspace
              is not touched and stays empty.
              {/* THE RETURN DOOR, on its own line rather than tucked into the
                 sentence above, because the person who needs it is the one who
                 has already been moved and is looking for the way out, not
                 re-reading the paragraph that moved them. It carries the
                 correction from (2) as well: the rows in there look like every
                 other row, so the only honest label to point at is the
                 workspace's, and that is the one thing the shell does show. */}{" "}
              Nothing inside it is marked as an example, so the workspace switcher at the top is
              what tells you where you are. Pick your own workspace there to come back.
            </p>
          ) : null}
          {/* Was "The sample workspace did not open. Try again." The switch
             happens only in `onSuccess`, so on this branch the person has
             not been moved anywhere. Saying so is the difference between a
             retry and a hunt through the switcher for a workspace they were
             never put into. */}
          {sampleMutation.isError ? (
            <p className="mrd-copy text-mrd-fail">
              The sample workspace did not open, so you are still in your own. Try again.
            </p>
          ) : null}
          <Actions>
            {/* `Action`, not `Approve`, and rendered beside `Quiet` rather
                than inside it. Orchid is spent on the one control that
                RELEASES something held, and this one navigates: the
                connecting happens in Settings, two screens later. A person
                who reads this as the act itself has been told something
                false about what their click does. */}
            <Action
              variant="primary"
              onClick={() => navigate({ to: "/settings", search: { section: "connections" } })}
            >
              Connect a source
            </Action>
            {sampleOffered ? (
              /* THE VERB HAS TO MATCH THE EVENT. These labels read "Explore a
                 sample workspace" and "Opening the sample", and both words are
                 the preview reading that the code does not support: the mutation
                 makes the seeded workspace ACTIVE and persists that choice, so
                 "explore" and "open" promised a look through a window and
                 delivered a relocation. The labels name the switch now, so the
                 button, the line above it and `setActiveWorkspaceId` all describe
                 the same thing happening. Label only: the wiring is untouched. */
              <Action busy={sampleMutation.isPending} onClick={() => sampleMutation.mutate()}>
                {sampleMutation.isPending ? "Switching you over" : "Switch to the sample"}
              </Action>
            ) : null}
          </Actions>
        </div>
      ) : picking && focused ? (
        /* THE MERGE PICKER, in place. Productboard's link-to-feature move: the
           most common real outcome is that a cluster is more weight for a bet
           already running, not a new one.

           NOT a `Choice`: the pickable options are the "Open bets" Region
           below (its own filter field and rows), not anything this card
           carries. This is the instruction sitting above that list, with one
           cancel -- a plain heading rather than any of the three named
           shapes, none of which fits a card with no options and no real
           binary answer of its own (P-53). */
        <div className="flex flex-col gap-mrd-2">
          <p className="mrd-title text-mrd-ink">Which bet does this belong to?</p>
          <p className="mrd-copy text-mrd-mute">
            Its <Num>{focused.theme.frequency}</Num> signal{plural(focused.theme.frequency)} will
            back that bet instead of starting a new one.
          </p>
          <Actions>
            <Action onClick={() => setPicking(false)}>Never mind</Action>
          </Actions>
        </div>
      ) : focused ? (
        // P-53: not a picker (the header's own inventory named this one
        // wrong -- there is no set of options here, only one theme and a
        // real Approve/decline). `Ask` covers the shape; see below for what
        // moved out of it and why.
        <React.Fragment
          /* Keyed on the theme, so moving the focus down the ranking REMOUNTS
             this fragment and the card plays its entrance. Updated in place,
             the biggest element on the station swaps its question and its
             evidence with no motion. */
          key={focused.theme.id}
        >
          {(() => {
            // `Ask.reason` is one prose string (its own header, and no
            // `lines`-style array), so the several short facts join into one
            // paragraph. Only the member list below does not fit a string at
            // all -- it stays JSX, and RENDERS BEFORE `Ask` for the same
            // reason it lived between the question and the buttons before:
            // "evidence pulled out below the Approve is the exact regression
            // [Gate] was rebuilt to prevent." `Ask` has no slot to put it in
            // once the buttons are inside the card, so the fix is order, not
            // a slot: the evidence still reads before the decision.
            const reason = [
              focused.theme.is_sample
                ? "This is an example. It came with your workspace so this station had something to show. It is not from your product, and nothing here has been learned from your record."
                : null,
              ranked.length > 1 ? `${focusedIndex + 1} of ${ranked.length} in the ranking.` : null,
              `${focused.theme.frequency} ${wordFor("signal", focused.theme.frequency)} from ${focusedSources.length} separate source${plural(focusedSources.length)}${
                focusedSources.length > 0
                  ? `: ${focusedSources
                      .slice(0, 3)
                      .map((s) => sourceLabel(s))
                      .join(", ")}`
                  : ""
              }.`,
              `${heardInOneBreath ? `Heard ${firstHeard}` : `First heard ${firstHeard}, most recently ${lastHeard}`}${claim ? `, and it ${claim.claim}` : ""}${claim && precedentNamed ? ", named below" : ""}.`,
              focused.theme.summary ?? null,
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <>
                {/* THE FULL MEMBER LIST FOR THE ONE CLUSTER IN FOCUS, not just
                    the four quotes the rail keeps. The rail stays capped on
                    purpose -- it is the glance while you scan the ranking --
                    and this is the read once you have stopped: every signal
                    this desk holds for the theme, each marked with where it
                    came from and when.

                    Rows are Meridian Row rather than CtxRow: the rail's row
                    truncates its name to one line by contract, and a member
                    list whose whole job is showing what the signal says
                    cannot be one line deep. */}
                {focusedMembers.length > 0 || memberShortfall ? (
                  <div>
                    <div className="flex flex-wrap items-baseline justify-between gap-mrd-inline">
                      <CtxHead>Every finding in this cluster</CtxHead>
                      {/* THE CLAIM STOPS WHERE THE READ STOPS. `listSignals`
                          returns the newest 200 signals in the workspace and says
                          nothing about what it dropped, so a loud cluster can hold
                          more members than this desk was handed. When it does, the
                          header names the slice, the way the ranking admits its
                          own page further down. */}
                      {memberShortfall ? (
                        <span className="text-mrd-tiny text-mrd-mute">
                          Showing the newest <Num>{focusedMembers.length}</Num> of{" "}
                          <Num>{focused.theme.frequency}</Num> signals.
                        </span>
                      ) : null}
                    </div>
                    {focusedMembers.length > 0 ? (
                      <div className="mt-mrd-3 max-h-[320px] overflow-y-auto pr-mrd-1">
                        {focusedMembers.map((s) => {
                          const memberReason = reasonBySignal.get(s.id);
                          return (
                            <Row
                              key={s.id}
                              marks={<SourceMark source={s.source} size={16} />}
                              lead={signalPreview(s.content, 320)}
                              sub={
                                <>
                                  {s.is_sample ? (
                                    <>
                                      <b>Example</b>
                                      {" · "}
                                    </>
                                  ) : null}
                                  {sourceLabel(s.source, s.source_kind)}
                                  {s.is_sample || capturedByHand(s.source, s.source_kind)
                                    ? ""
                                    : ", sensed"}
                                  {/* WHY IT LANDED HERE, the answer to "why did
                                     it route into this cluster". Read back from
                                     the lineage edge the clusterer wrote at
                                     attach or founding time; a member with no
                                     stored reason renders nothing rather than a
                                     guess. One line quieter than the source
                                     label above it. */}
                                  {memberReason ? (
                                    <span className="block text-mrd-tiny text-mrd-mute">
                                      {memberReason}
                                    </span>
                                  ) : null}
                                </>
                              }
                              time={since(s.created_at)}
                              /* The same door the rail's quotes carry: the url is
                                 the ticket, thread or review this sentence was
                                 lifted out of, opened in a new tab because the
                                 address belongs to somebody else's product. A hand
                                 capture with nowhere to go keeps no door. */
                              onClick={
                                s.url
                                  ? () => {
                                      window.open(s.url as string, "_blank", "noopener,noreferrer");
                                    }
                                  : undefined
                              }
                            />
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <Ask
                  question={focused.theme.title}
                  reason={reason}
                  fallback={{ kind: "irreversible" }}
                  // The one Approve on this station. Meridian spends orchid on
                  // a single meaning -- a person is required -- and this
                  // cluster sits unjudged until somebody presses it. `Ask`
                  // carries no `shortcut` (no Meridian edits beyond Gate's
                  // deletion); `a`/`d` still work, bound on the page.
                  answer={{
                    label: promote.isPending ? "Making it a bet" : "Make it a bet",
                    busy,
                    onPress: () => promote.mutate(focused.theme.id),
                  }}
                  // The decline is NOT a second Approve even though it also
                  // settles. Red reports an outcome in this system and orchid
                  // means a person is required, so neither is available to
                  // mark an intention, and two accents in one row is how an
                  // accent stops meaning anything.
                  decline={{
                    label: "Not a pattern",
                    onPress: () => decline.mutate({ themeId: focused.theme.id }),
                  }}
                />

                {/* "Add to an existing bet" is a real third verdict (P-50's
                    ruling on exactly this shape), not the declared default
                    made pressable, so it is not `Ask.fallbackAction` -- it
                    renders beside the card instead. */}
                <Actions>
                  <Action busy={busy} shortcut="m" onClick={() => setPicking(true)}>
                    Add to an existing bet
                  </Action>
                  <MoreMenu label={`More for ${focused.theme.title}`}>
                    <MoreItem
                      onClick={() => {
                        setRenaming(true);
                      }}
                    >
                      Rename it
                    </MoreItem>
                    <MoreItem onClick={() => draftSpec.mutate(focused.theme.id)}>
                      {draftSpec.isPending ? "Drafting the spec" : "Draft the spec directly"}
                    </MoreItem>
                  </MoreMenu>
                </Actions>
                {renaming ? (
                  <RenameClusterForm
                    theme={{
                      id: focused.theme.id,
                      title: focused.theme.title,
                      summary: (focused.theme.summary as string | null) ?? null,
                    }}
                    onDone={() => {
                      setRenaming(false);
                      invalidate();
                    }}
                  />
                ) : null}
              </>
            );
          })()}
        </React.Fragment>
      ) : (
        <div className="flex flex-col gap-mrd-3">
          {/* P-53, the clearest zero state in this file: nothing is held, so
              there is nothing to release, and `Quiet` says exactly that. The
              cluster action renders beside it -- `Quiet` refuses an action
              slot on purpose (its own header: "there is nothing to do, and a
              button here is a door onto an empty room"), and this dispatches
              a model run rather than answering a question the state does not
              ask. */}
          <Quiet
            says="Nothing is waiting on a call."
            whatWillAppear={
              /* "The newest N" for the third and last time in this file: see the
                 note above `headline`. `rows.length` is a page of `listSignals`,
                 and on the desk that has not clustered anything yet this is the
                 only count a person is given, so it is the worst place of the
                 three to state a total we did not read. */
              `The newest ${rows.length} signal${plural(rows.length)} captured${
                unclustered > 0 ? `, ${unclustered} of them not yet read together` : ""
              }. Clustering groups the ones saying the same thing, then ranks them by how severe, how recent, and how new to the record each one is.`
            }
          />
          <Actions>
            <Action variant="primary" busy={cluster.isPending} onClick={() => cluster.mutate()}>
              {cluster.isPending ? "Reading them together" : "Cluster them now"}
            </Action>
          </Actions>
        </div>
      )}

      {/* What your last judgment caused. One at a time, and it survives until
        the next one, so the surface never erases the trace of a decision.

        IT STAYS WELDED TO THE GATE. The reorder below moved the ranking up
        past the Record recess; the receipt did not travel with it, because a
        receipt reports what the buttons directly above it just did, and a
        receipt six rows away from the control that caused it is a receipt
        nobody reads. It costs one line of height and only after you act. */}
      {receipt ? (
        <Receipt
          verb={receipt.verb}
          consequence={receipt.consequence}
          handoff={receipt.handoff}
          failed={receipt.failed}
        />
      ) : null}

      {/* EMPTY IS THE MAJORITY VIEW, AND IT WAS ANSWERED WITH INSTRUCTIONS.
        A workspace with no signals got a Gate saying connect a source, a
        capture box, and no idea at all what the thing it was being asked to
        fill would look like when it was full. That is the shape of the
        station's most common first impression.

        A WORKED EXAMPLE, NOT MORE COPY, and that is measured rather than
        preferred: "example" is the single highest-frequency term across 5.72M
        words of operator conversation. Operators reason in examples. Two
        sentences describing a ranking row teach less than one drawn row.

        IT IS NOT DATA AND IT NEVER TOUCHES THE RECORD. Nothing here is read,
        written, counted or ranked: it is a drawing of a row, it carries no id,
        it is not clickable, it has no tick, and it renders only while the
        workspace genuinely holds nothing. The one thing this product must never
        do is put invented rows where real ones go, so the block says what it is
        in its title, in its subtitle, and on the row itself. */}
      {signalsEmpty && !picking ? (
        <Region
          title="What the ranking will show"
          sub="A drawing, not a row. Nothing here is in your record, and nothing here can be acted on."
        >
          <Row
            tight
            marks={
              <StatusRing small fill="full" label="Illustration: resembles nothing on the record" />
            }
            lead="Address re-confirm loses people at checkout"
            sub={
              <>
                <b>Illustration</b>
                {" · "}
                <Num>#1</Num>
                {" · "}
                <ScoreMeter value={72} ceiling={100} what="Severity, recency and novelty" />
                {" · "}7 signals · Support inbox (4), Sales call (3) · resembles nothing on the
                record
              </>
            }
            time="2h ago"
          />
          <CtxBody>
            The ring is how much of it the record has met before: filled is new, half is a partial
            match, empty means it closely resembles something already settled. The number is
            severity, recency and novelty folded together, out of 100, and the bar is the same scale
            on every row. Your own rows will carry the same three facts, from your own sources.
          </CtxBody>
        </Region>
      ) : null}

      {/* The bets a cluster can be merged into. Rendered only in picker mode,
        so the surface still shows one question at a time.

        IT COULD REACH TWELVE OF THEM, AND THAT WAS THE WHOLE DISPOSITION. The
        list was `listOpportunities` sliced at twelve, ordered by ICE across
        every workspace the caller belongs to, with no search. The bet a person
        came here to merge into was reachable only if it happened to score in
        the top twelve, and a workspace of any age has more than twelve open
        bets. Merge is the disposition this file names as the MOST common real
        outcome of triage, so the commonest outcome had the weakest control on
        the station.

        Three things fixed together, because any one alone still fails: it is
        scoped to what the cluster may actually back (see `betCandidates`), it
        is searchable, and the cap is a fold rather than a ceiling. */}
      {picking && focused ? (
        <Region
          title="Open bets"
          sub="Its evidence joins the one you pick. Only bets this cluster is allowed to back are listed."
          toggle={
            betMatches.length > BETS_IN_PICKER
              ? showAllBets
                ? "Show fewer"
                : `Show all ${betMatches.length}`
              : undefined
          }
          onToggle={() => setShowAllBets((v) => !v)}
          toggled={showAllBets}
        >
          <Field label="Find the opportunity" htmlFor="merge-opportunity-filter">
            <Input
              id="merge-opportunity-filter"
              value={betFilter}
              onChange={(e) => setBetFilter(e.target.value)}
              placeholder="Type any part of its name"
              autoFocus
              /* Escape closes the picker from INSIDE the field too. The global
                 handler stands down over any INPUT, which is correct for the
                 disposition keys and would otherwise have trapped a person who
                 had just typed into the only control here. */
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setPicking(false);
                }
              }}
            />
          </Field>
          {/* AN UNANSWERED READ IS NOT AN EMPTY QUEUE, and this block was the
              last surface in the product still saying otherwise.

              It guarded on `opportunities.isLoading`, which in react-query v5
              is `isPending && isFetching`. This query is `enabled: picking`, so
              on the first frame after the picker opens it is pending and NOT
              yet fetching: `isLoading` is false, `data` is undefined, and the
              block fell straight through to "There are no bets yet, so there is
              nothing to merge into." A claim of absence, made from a read that
              had not happened, on the frame a person is most likely to see.
              An errored read produced exactly the same sentence, forever.

              `stillWaiting` answers the not-yet case. The error branch comes
              FIRST, and until 2026-08-11 it had to: the helper was
              `isPending || data === undefined`, and react-query leaves `data`
              undefined after a cold failure, so a failed read spun here for ever
              instead of ever saying what went wrong. The helper now stands down
              on a failed read, so that necessity is gone and the order is kept
              on its own merits. Same order Ship uses.

              This was the second of the two surfaces the budget in
              an-empty-read-is-not-an-empty-workspace.test.ts still allowed;
              that constant comes down to 1 in the same commit. */}
          {opportunities.isError ? (
            <ReadFailedLine
              onRetry={() => void opportunities.refetch()}
              error={opportunities.error}
            >
              {opportunities.error instanceof Error
                ? opportunities.error.message
                : "The open bets did not load."}
            </ReadFailedLine>
          ) : stillWaiting(opportunities) ? (
            <Reading>Reading the queue.</Reading>
          ) : betCandidates.open.length === 0 ? (
            <NothingYet>
              There are no bets yet, so there is nothing to merge into. Keeping it makes the first
              one.
            </NothingYet>
          ) : betCandidates.inWorkspace.length === 0 ? (
            /* THE HONEST VERSION OF AN EMPTY LIST, and it names WHICH filter
               emptied it. There are bets; none of them is one this cluster's
               evidence may back. Saying "no bets" would send the person looking
               for a list they can already see on /decide. */
            <NothingYet>
              <Num>{betCandidates.open.length}</Num> open bet
              {plural(betCandidates.open.length)}, and none belongs to this cluster&rsquo;s
              workspace, so none of them can take its evidence. Keeping it makes a bet here instead.
            </NothingYet>
          ) : betCandidates.inScope.length === 0 ? (
            <NothingYet>
              <Num>{betCandidates.inWorkspace.length}</Num> open bet
              {plural(betCandidates.inWorkspace.length)} in this workspace, and none is filed under
              the same product as this cluster. Keeping it makes a bet under that product instead.
            </NothingYet>
          ) : betMatches.length === 0 ? (
            <NothingYet>
              Nothing among the <Num>{betCandidates.inScope.length}</Num> open bet
              {plural(betCandidates.inScope.length)} matches that.
            </NothingYet>
          ) : (
            (showAllBets ? betMatches : betMatches.slice(0, BETS_IN_PICKER)).map((o) => (
              <Row
                key={o.id}
                tight
                lead={o.title}
                sub={o.status ?? "backlog"}
                onClick={() => attach.mutate({ themeId: focused.theme.id, oppId: o.id })}
              />
            ))
          )}
          {!showAllBets && betMatches.length > BETS_IN_PICKER ? (
            <CtxBody>
              <Num>{betMatches.length - BETS_IN_PICKER}</Num> more match, below the fold.
            </CtxBody>
          ) : null}
        </Region>
      ) : null}

      {/* The ranking, one line each: the title, and the facts that differ
        between them. Clicking makes it the call in front of you.

        THE SELECTED ROW STAYS IN THE LIST (founder, 2026-08-01: "when I click
        on any bets the top section changes... somewhere that distinction needs
        to be there that it's getting changed and this is what it is"). An
        earlier version filtered the focused cluster OUT, so the Gate changed
        under you with nothing on screen connecting it to the row you pressed,
        and the list silently renumbered. Keeping it in place and marked is how
        Linear's split view reads, and `Row` already carries `focused`, so this
        costs one prop and no new component. The rank on the Gate is the other
        half: it says WHICH of the ranking you are looking at.

        CAPPED AND EXPANDABLE (founder, same message: "it says twenty three
        bets, and below if I see there are only five or six... should we give
        something like see more"). It was the inverse here, uncapped, so a
        workspace with thirty clusters was thirty rows of scroll, which is the
        scatter complaint one step later. Six, then ask. */}
      {!picking && ranked.length > 1 ? (
        <div ref={rankingAnchor} tabIndex={-1}>
          <Region
            title="The ranking"
            /* j AND k WERE BOUND AND DRAWN NOWHERE, which is the same defect as
             the seven stations carrying live chords with no keycap: a person
             could only find these by reading the source. The list they move
             through is the one place the hint belongs, and it is the same
             pair /approvals uses for the same job. */
            sub="j and k move the focus. The one in focus is the one the keys act on. Tick rows to decline a batch of them at once."
            toggle={
              rankedVisible.length > VISIBLE_CLUSTERS
                ? showAllClusters
                  ? "Show fewer"
                  : `Show all ${rankedVisible.length}`
                : undefined
            }
            onToggle={() => setShowAllClusters((v) => !v)}
            toggled={showAllClusters}
          >
            {/* THE FIND FIELD, exactly when the list outgrows one screen - the
              same threshold that summons "Show all". Searching three clusters
              is noise; finding one of thirty by its name is the job. Mirrors
              the merge picker's field: same component, same Escape-stands-down
              behaviour, substring over title and summary. */}
            {ranked.length > VISIBLE_CLUSTERS ? (
              <Field label="Find a cluster" htmlFor="ranking-filter">
                <Input
                  id="ranking-filter"
                  value={clusterFilter}
                  onChange={(e) => setClusterFilter(e.target.value)}
                  placeholder="Type any part of its name"
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setClusterFilter("");
                    }
                  }}
                />
              </Field>
            ) : null}
            {clusterFilter && rankedVisible.length === 0 ? (
              <CtxBody>
                Nothing named that. The find matches titles and summaries; the cluster may be
                settled, under Settled below.
              </CtxBody>
            ) : null}
            {/* WHAT THE READER IS ABOUT TO SCAN, before they scan it. The counts
              are the three novelty buckets the rows themselves use plus the
              clusters carrying no novelty at all, so the header and the rows can
              never disagree: they read one function. A bucket at zero is not
              drawn, because a count of nothing changes nothing a person does. */}
            <BatchHeader
              facts={[
                /* THE TOTAL, ONLY WHEN THE FIND FIELD HAS CHANGED IT. This was
                 unconditional and it printed the phrase "125 clusters open"
                 verbatim on a screen where the comprehension strip, a few
                 hundred pixels up, had already printed "125 clusters open" --
                 the identical words and the identical numeral, twice, with the
                 headline above that stating the same count a third time in
                 different words. Unfiltered, `rankedVisible.length` IS
                 `ranked.length`, so the entry could not tell a reader anything
                 the page had not; filtered, it is a number nothing else on the
                 surface holds, so that is when it is drawn.

                 A ZERO IS NEVER DRAWN HERE, which is why this drops out of the
                 array rather than setting `always: false` -- `BatchHeader`
                 keeps any fact with `n > 0` regardless. When the find matches
                 nothing, "Nothing named that" is already on screen six pixels
                 above and "0 clusters open" underneath it was the same defect
                 in miniature. The four novelty buckets each carry their own
                 subject (see below), so the header still reads as sentences
                 with this gone. */
                ...(rankedVisible.length > 0 && rankedVisible.length !== ranked.length
                  ? [
                      {
                        n: rankedVisible.length,
                        label: rankedVisible.length === 1 ? "cluster found" : "clusters found",
                        always: true,
                        title:
                          "Matching your find, and still waiting on a judgment. Declined, merged and promoted ones are under Settled.",
                      },
                    ]
                  : []),
                /* EVERY LABEL CARRIES ITS OWN SUBJECT, because the entry above it
                 may not be drawn. These three used to read "unlike anything on
                 the record" / "partly resemble it" / "closely resemble it", and
                 the "it" in the last two pointed at "the record" in the first.
                 A bucket at zero is dropped -- the rule stated at the top of
                 this Block and again at line 204 -- so on any workspace where
                 nothing scores >= 0.75, which is a mature workspace's ordinary
                 state, the header read "12 clusters open · 3 partly resemble it
                 · 9 closely resemble it" and the only noun left for "it" was
                 "clusters". The reader was told three clusters resemble the
                 clusters.

                 The verb also agrees with the count now. "1 partly resemble it"
                 was wrong in the old copy too, and is easy to miss because the
                 one-cluster case is rare after the first week. */
                {
                  n: spread.fresh,
                  label:
                    spread.fresh === 1
                      ? "resembles nothing on the record"
                      : "resemble nothing on the record",
                  title: "Scored furthest from your settled decisions and every earlier cluster.",
                },
                {
                  n: spread.partial,
                  label:
                    spread.partial === 1
                      ? "partly resembles the record"
                      : "partly resemble the record",
                },
                {
                  n: spread.seen,
                  label:
                    spread.seen === 1
                      ? "closely resembles the record"
                      : "closely resemble the record",
                  title:
                    "Worth killing here: a repeat caught as a cluster costs nothing, and the same repeat caught on Decide has already spent a Critic run.",
                },
                {
                  n: spread.unscored,
                  label:
                    spread.unscored === 1 ? "carries no novelty score" : "carry no novelty score",
                  title:
                    "Clustered before the brain scored novelty, or scored while it was unavailable. Not the same as resembling nothing.",
                },
              ]}
            />

            {/* The bulk bar takes the list's own header slot rather than floating
              over it, per `useSelection`'s own note: everything that floats here
              would land on the "Show all" control directly below the rows.

              NO CONFIRMATION, DELIBERATELY, and the asymmetry with /decide is
              the rule rather than an oversight. Friction is proportional to what
              an act SPENDS and to how hard it is to take back.

              THE OLD REASONING HERE WAS "this spends nothing", AND THAT WENT
              FALSE (corrected 2026-08-10). `setThemeStatus` now writes three
              columns, not one, and RPT-32 made a decline file a `rejection`
              against `customer-insights` in `human_gate_events`. That row is
              append-only: putting the cluster back restores the surface but
              never unfiles the correction. So this does spend something, and
              the previous justification no longer holds.

              It still takes no dialog, for a better reason. What it spends is a
              CORRECTION TO THE MACHINE, and that is the thing this product
              wants more of, not less. Decide's bulk drop asks first because
              each row files a judgment on somebody's bet, with a person's name
              on it; declining a cluster files feedback on how well the
              clusterer clustered. Charging friction for teaching the agent
              taxes precisely the behaviour the brain is built to read back,
              and a dialog people learn to click through is worse than no
              dialog at all.

              The surface act stays cheap: the Settled block six rows down puts
              any of them back with one press, and the clusterer re-opens a
              declined cluster on its own once it grows past the escalation
              bar. */}
            {/* LEFT ON THE RETIRED LAYER, DELIBERATELY. Meridian's
              `SelectionActions` shares three quarters of the name and none of
              the job: it takes a text `Range` a reader has highlighted in prose
              and a container to measure against, and its phases describe an
              agent's edit coming back. This bar takes a `Selection` of rows and
              a total. There is no prop on that component that can hold either,
              and forcing it would mean rebuilding the row-selection bar inside
              a text-selection component. Reported instead. Its verb is a
              Meridian `Action` regardless, because a control that paints itself
              does not care what container it sits in. */}
            <BulkBar selection={picked} total={ranked.length} noun="cluster">
              <Action
                disabled={busy || declineMany.isPending}
                onClick={() => declineMany.mutate([...picked.ids])}
              >
                {declineMany.isPending ? "Declining them" : "Not patterns"}
              </Action>
            </BulkBar>

            {(showAllClusters ? rankedVisible : rankedVisible.slice(0, VISIBLE_CLUSTERS)).map(
              (entry, i) => {
                /**
                 * WHERE ITS EVIDENCE CAME FROM, IN WORDS, and this row printed our
                 * column values at a person: `${count} from ${source}` rendered "3
                 * from pull_connector, 1 from transcript_action". `sourceLabel` was
                 * already imported into this file for exactly that and is called
                 * four lines away inside the Gate, so the row was the one place the
                 * translation was skipped.
                 *
                 * GROUPED BY THE LABEL, not by the raw token, because the label is
                 * what is on screen: `source_kind: "manual"` with a null `source`
                 * and `source: "note"` are one phrase to a reader, and two lines
                 * saying "A note you wrote" would be the surface exposing its own
                 * storage a second way.
                 */
                const byLabel = new Map<string, number>();
                entry.members.forEach((m) => {
                  const label = sourceLabel(m.source, m.source_kind);
                  byLabel.set(label, (byLabel.get(label) ?? 0) + 1);
                });
                const sourceList = Array.from(byLabel.entries())
                  .map(([label, count]) => `${label} (${count})`)
                  .join(", ");

                /**
                 * NOVELTY AS A CLAIM, WHERE AN INVENTED CONFIDENCE USED TO BE.
                 *
                 * WHAT WAS HERE. `entry.theme.confidence ?? 0.5` bucketed into
                 * high / medium / low and painted green, amber or red inline. Four
                 * separate defects in one expression, and the file's own header
                 * names three of them:
                 *   - This surface's REFERENCE section says outright that no
                 *     comparable product puts a numeric confidence on an
                 *     auto-generated cluster and that "`themes.confidence` stays
                 *     off this surface". The row printed it anyway, one bucket
                 *     removed from a percentage, which invites exactly the argument
                 *     the header refuses to have.
                 *   - The `?? 0.5` printed "medium confidence" for a cluster
                 *     carrying no confidence at all. That is not a rounding, it is
                 *     the surface stating a fact the record does not hold.
                 *   - `fontSize`, `fontWeight` and a literal `--sp-pass` /
                 *     `--sp-warn` / `--sp-fail` on a span break primitives.tsx on
                 *     two counts: "Nothing here carries a literal colour or size"
                 *     and "State is never a hue".
                 *   - And the comment above it claimed the level was "based on
                 *     score, severity, novelty, frequency" when it read one column.
                 *
                 * WHAT REPLACES IT, because a row losing a fact is a row that got
                 * weaker. `noveltyRead` is this file's sanctioned way of speaking
                 * about the brain's number: a sentence rather than an arithmetic,
                 * derived from `themes.novelty`, which is real and is one of the
                 * three terms `scoreTheme` actually ranks on. It returns null when
                 * the column is null, so a cluster with no novelty stored says
                 * nothing instead of guessing, and the Gate has shown this same
                 * claim for the cluster in focus since 2026-08-01. Saying it on the
                 * row is what lets a person choose what to open before opening it.
                 *
                 * AND IT NO LONGER ASSERTS A PRIOR IT CANNOT PRODUCE. See
                 * `noveltyRead`: the bottom bucket used to read "the record has seen
                 * this before", which names a thing, and the row named none.
                 */
                const rowClaim = noveltyRead(entry.theme.novelty);

                /**
                 * THE SCORE THE ORDER IS ACTUALLY MADE OF, on the row it ordered.
                 *
                 * `scoreTheme` returns (0,1] and this list has been sorted on it
                 * since 2026-08-01 while showing nothing of it, so the ranking asked
                 * to be taken on trust: rank 1 was above rank 6 for a reason the
                 * surface kept to itself. Rendered as an integer out of 100 with the
                 * ceiling stated in the meter's own title, never as a bare decimal,
                 * and the 2px bar is what makes two rows comparable at a glance.
                 *
                 * NO MOVEMENT ARROW HERE, and it is absent because the data is. A
                 * theme carries one `novelty` and one `severity`, both written once
                 * at cluster time; nothing anywhere stores what this cluster scored
                 * yesterday. Decide can show a delta because `learnings` keeps
                 * `prior_ice` and `new_ice`; this station has no equivalent column,
                 * and inventing one from the render would be the surface asserting
                 * a history it does not hold.
                 */
                const rowScore = Math.round(entry.score * 100);

                return (
                  <Row
                    key={entry.theme.id}
                    tight
                    focused={entry.theme.id === focusedId}
                    /* THE SHAPE CARRIES THE STATE, and the numeral moved off this
                   slot to make room for it. The rank was here as a bare mono
                   digit and it was the LEAST useful thing on the row: the list
                   is already in rank order, so the number restated the reader's
                   own position in it. What the slot holds now is the one fact
                   the order turns on that a person cannot see -- how much of
                   this the record has met before -- as a ring that survives
                   greyscale. The rank still appears, in the line below, where
                   restating it costs nothing. */
                    marks={
                      <StatusRing
                        small
                        fill={rowClaim?.fill ?? "empty"}
                        label={
                          rowClaim
                            ? `${rowClaim.claim}. ${rowClaim.basis}`
                            : "No novelty score on this cluster"
                        }
                      />
                    }
                    lead={entry.theme.title}
                    sub={
                      <>
                        {/* SAY IT ON THE ROW, not only in the Gate. The person scans
                        the ranking to choose what to open; a label that appears
                        only after they have opened it arrives too late to have
                        saved them the trip. Same word as Decide uses on its own
                        list rows, so one vocabulary covers both stations. */}
                        {entry.theme.is_sample ? (
                          <>
                            <b>Example</b>
                            {" · "}
                          </>
                        ) : null}
                        <Num>#{i + 1}</Num>
                        {" · "}
                        <ScoreMeter
                          value={rowScore}
                          ceiling={100}
                          what="Severity, recency and novelty"
                        />
                        {" · "}
                        {entry.theme.frequency} signal{plural(entry.theme.frequency)}
                        {sourceList ? ` · ${sourceList}` : ""}
                        {/* THE NOVELTY CLAIM IS NOT REPEATED HERE. It used to
                       close this line as `· <claim>` while the status ring at
                       the head of the same row carried the identical sentence
                       as its accessible name and its hover title -- one row,
                       one fact, said twice. The ring is the version that
                       survives greyscale AND is announced to a screen reader
                       (`role="img"`, `aria-label`), and it says more than the
                       tail did: the basis rides along with it. The tail was
                       the copy that could go, so it went. */}
                        {/* THE CLUSTER CAME BACK ON ITS OWN. escalated_at is written
                       by the clusterer's reopen path and was read by nothing -
                       a re-opened declined cluster silently rejoined the
                       ranking with no memory of the earlier no. */}
                        {entry.theme.escalated_at ? (
                          <> · returned after declining {since(entry.theme.escalated_at)}</>
                        ) : null}
                      </>
                    }
                    time={since(entry.lastAt)}
                    onClick={() => setFocusedId(entry.theme.id)}
                    /* The tick sits outside the clickable region, so choosing a
                   cluster for a batch never also moves the Gate onto it. */
                    action={
                      <SelectBox
                        id={entry.theme.id}
                        label={`Select ${entry.theme.title}`}
                        selection={picked}
                        disabled={busy}
                      />
                    }
                  />
                );
              },
            )}
            {!showAllClusters && rankedVisible.length > VISIBLE_CLUSTERS ? (
              <CtxBody>
                <Num>{rankedVisible.length - VISIBLE_CLUSTERS}</Num> more below the fold.
              </CtxBody>
            ) : null}
            {/* THE READ IS A PAGE, AND IT SAYS SO. `listThemes` returns the newest
            page of clusters plus the exact total behind it, so this is the one
            honest place to admit that the ranking is not the whole record. It
            was silent before, and worse than silent: the window used to be
            selected by `frequency`, so the clusters dropped by the read were
            the least corroborated ones, which is the axis the ranking exists to
            argue against. Recency-bounded now, and counted.

            THREE NUMBERS, NOT TWO, because the page and the ranking are not the
            same set. `themeWindow` is how many clusters the READ returned;
            `ranked` is that page minus the dismissed, merged and promoted ones.
            Saying "this ranks the newest 300" beside a "Show all 212" control
            six pixels up is the surface disagreeing with itself, which is the
            defect the rest of this pass exists to close. */}
            {themeTotal > themeWindow ? (
              <CtxBody>
                The record holds <Num>{themeTotal}</Num> clusters. This reads the newest{" "}
                <Num>{themeWindow}</Num> of them and ranks the <Num>{ranked.length}</Num> still
                open.
              </CtxBody>
            ) : null}
          </Region>
        </div>
      ) : null}

      {/* WHAT YOU ALREADY DECIDED, which the station could not show at all.

        "A record that only holds the yeses is a highlight reel" is section 2 of
        this file's own header, and until now the surface kept none of the noes
        where a person could see them: `ranked` drops dismissed, merged and
        promoted, and nothing else listed them. Twenty declines left no trace on
        the station that made them.

        IT IS ALSO THE DOOR THE UN-DECLINE NEVER HAD. `setThemeStatus` has
        accepted "new" since it was written and no surface in the product ever
        sent it, so a mis-pressed `d` was terminal. Each row carries the way
        back, and Row's `action` slot is exactly the right shape for it: a
        control belonging to THIS row, outside the clickable region, so it is
        never a button inside a button.

        A PROMOTED CLUSTER GETS NO UNDO, and that is not an omission. Its bet
        exists, with a Critic run and lineage behind it; putting the cluster
        back in the ranking would invite a second bet from the same evidence,
        which is the exact duplication `promoted` was added to stop. The door it
        gets is its chain. */}
      {!picking && !loading && !loadError && settledClusters.length > 0 ? (
        <Region
          title="Settled"
          sub="Judged and out of the ranking. Their evidence is untouched, and a declined cluster comes back on its own if it grows enough."
          toggle={
            showSettled
              ? "Hide them"
              : settledClusters.length === 1
                ? "Show the one"
                : `Show the ${settledClusters.length}`
          }
          onToggle={() => setShowSettled((v) => !v)}
          toggled={showSettled}
        >
          {showSettled ? (
            <>
              {(showAllSettled ? settledClusters : settledClusters.slice(0, SETTLED_VISIBLE)).map(
                (t) => {
                  const status = (t.status ?? "new") as string;
                  // LAST HEARD IS SAID IN WORDS, NOT PUT IN THE TIME SLOT. On
                  // every other row on this station the trailing time is when
                  // the cluster last grew; on a settled row a bare "3d ago"
                  // beside "You said it was not a pattern" reads as when the
                  // judgment was made, which is a fact no column on `themes`
                  // holds. Naming it removes the ambiguity, and for a declined
                  // cluster it is the number that says whether it is on its way
                  // back.
                  const heard = since(t.last_signal_at ?? t.created_at);
                  return (
                    <Row
                      key={t.id}
                      tight
                      /* THE SHAPE SAYS SETTLED BEFORE THE WORDS DO, and it says
                         it in the same slot the live rows use, so a person who
                         has learned the ring on the ranking above reads this
                         list without learning anything new. `struck` is a ring
                         with a bar through it rather than a fuller ring,
                         because "over" must never look like "further along".
                         Promoted wears `pass` -- green carries outcomes and a
                         cluster that became a bet is the good one. The other
                         two stay neutral: declining is not a failure. */
                      marks={
                        <StatusRing
                          small
                          fill="struck"
                          tone={status === "promoted" ? "pass" : "quiet"}
                          label={settledWord(status)}
                        />
                      }
                      lead={t.title}
                      sub={
                        <>
                          {settledWord(status)}
                          {/* THE REASON OUTLIVES THE RECEIPT. status_reason was
                             accepted by the server and read by no one; the row
                             is where the judgment lives, so this is where the
                             words for it render. */}
                          {t.status_reason ? `, because ${t.status_reason}` : ""} · {t.frequency}{" "}
                          signal{plural(t.frequency)}
                          {heard ? ` · last heard ${heard}` : ""}
                        </>
                      }
                      onClick={() =>
                        navigate({
                          to: "/outcomes",
                          search: { tab: "graph", focusKind: "theme", focusId: t.id },
                        })
                      }
                      action={
                        status === "promoted" ? undefined : (
                          <Action
                            busy={busy}
                            onClick={() =>
                              undecline.mutate({ themeId: t.id, title: t.title, from: status })
                            }
                          >
                            Put it back
                          </Action>
                        )
                      }
                    />
                  );
                },
              )}
              {settledClusters.length > SETTLED_VISIBLE ? (
                /* `mt-mrd-4` is said here rather than baked into the component.
                   Meridian's `Actions` sets no outer margin on purpose -- its
                   header records that the two versions it replaced decided the
                   space above themselves and a caller who wanted it elsewhere
                   could not say so -- and the retired `.sp-acts` this row used
                   to wear carried 16px. Without it the control sits flush
                   against the last row. */
                <Actions className="mt-mrd-4">
                  <Action variant="quiet" onClick={() => setShowAllSettled((v) => !v)}>
                    {showAllSettled
                      ? "Show fewer"
                      : `Show all ${settledClusters.length} settled clusters`}
                  </Action>
                </Actions>
              ) : null}
            </>
          ) : null}
        </Region>
      ) : null}

      {/* THE RECORD SPEAKING, and it belongs here as much as on /decide.
        cluster.server.ts already embeds every theme and scores it against
        decision memory and prior themes; until now nothing rendered the answer.
        Catching a repeat while it is still a cluster costs nothing.

        IT SITS UNDER THE RANKING NOW, and that is a reversal of the earlier
        note here, made deliberately and for a measured reason. The old
        placement put the Gate, then up to two recesses, then a receipt above
        the list: roughly 570px before the first cluster row, which at 1440x900
        with the top bar and the spine strip is the whole viewport. So the
        surface's PRIMARY job, comparing this call against the ones around it,
        was below the fold on every screen, which is the opposite of the triage
        pattern this file names as its reference. Linear puts the list beside
        the item; a single column's version of beside is directly under.

        What the reversal costs is that the recess is now one short scroll away
        rather than immediately visible, and that is the cheaper loss: the
        warning matters at the moment of disposition, and the disposition
        buttons are still on the Gate above it, still reached by keys 1, 2 and
        3, and the recess still moves with the focus. What the old order cost
        was a person not knowing there was a ranking at all.

        Kept as the one lit surface, and NOT moved into the context rail, which
        would demote the single differentiated moment in the product to a
        statistic. */}
      {/* LEFT ON THE RETIRED LAYER. `RecordSpeaks` takes `children` and
        `evidence` and nothing else, so porting this would silently delete the
        `onClick` and `title` below -- the door onto the prior bet's chain,
        which section 7 of this header exists to have opened -- and would also
        drop the lamp, which RecordSpeaks refuses by name ("Meridian permits ONE
        lit object in the product and Brain holds the licence"). A swap that
        loses a door and a light to gain a shorter import is not a port. */}
      {focused && !picking && seenBefore.length > 0
        ? seenBefore.slice(0, 2).map((p) => (
            <RecordSpeaks
              key={p.id}
              evidence={
                <>
                  {p.verdict === "validated"
                    ? "it paid off"
                    : p.verdict === "missed"
                      ? "it did not pay off"
                      : "the result was mixed"}
                </>
              }
              /* THE PRIOR BET OPENS. The strongest sentence on the surface named
                 a bet you already made and gave you no way to go and look at
                 it, which is the exact gap Record's own onClick was added for.

                 The graph, not the queue, and the difference is honest rather
                 than convenient: a bet with an outcome attached has usually
                 shipped or been dropped, so it is no longer IN the ranked queue
                 on /decide, and sending someone to a list that does not contain
                 the thing they clicked is a worse dead end than no link at all.
                 The knowledge graph focuses any lineage node by kind and id,
                 `opportunity` is one of its declared kinds, and what it draws is
                 the bet with everything that led to it and everything that came
                 out of it, which is what "go and look at that one" means here.

                 Precedent that carries no opportunity id keeps no door. */
              title={p.opportunityId ? "Open that opportunity and its chain" : undefined}
              onClick={
                p.opportunityId
                  ? () =>
                      navigate({
                        to: "/outcomes",
                        search: {
                          tab: "graph",
                          focusKind: "opportunity",
                          focusId: p.opportunityId as string,
                        },
                      })
                  : undefined
              }
            >
              {p.title ? (
                <>
                  You have reasoned this way before, on {p.title}, and {p.summary}
                </>
              ) : (
                p.summary
              )}
            </RecordSpeaks>
          ))
        : null}

      {/* The weaker claim, and only when there is no outcome to show instead.
        "You have clustered this shape before" is worth saying and is not the
        same sentence as "here is how it went".

        It opens the earlier cluster the same way a row does, by moving the
        focus, and ONLY when that cluster is still in the ranking. A prior
        cluster that has since been declined or merged is not a call anybody
        can make, so naming it stays a fact and never becomes a promise. */}
      {/* Same refusal as the recess above, same two reasons: this one carries a
        door too, onto the earlier cluster, and only when that cluster is still
        in the ranking. */}
      {focused && !picking && seenBefore.length === 0 && priorTheme ? (
        <RecordSpeaks
          evidence={<>clustered separately</>}
          title={
            ranked.some((r) => r.theme.id === priorTheme.id)
              ? "Put that earlier cluster in front of you"
              : undefined
          }
          onClick={
            ranked.some((r) => r.theme.id === priorTheme.id)
              ? () => setFocusedId(priorTheme.id)
              : undefined
          }
        >
          This closely repeats an earlier cluster, {priorTheme.title}.
        </RecordSpeaks>
      ) : null}

      {/* Capture is the way in when no connector covers what you just heard.
        One box: one line captures one signal, twenty pasted lines capture
        twenty. The loose count is the only other thing worth saying here,
        and it carries its own action rather than a separate panel.

        NOW OFFERED ON AN EMPTY DESK TOO. It used to be hidden behind
        `!signalsEmpty`, so the first thing a new workspace saw was a Gate
        saying "connect a source" and no way at all to write down the thing
        they had just been told on a call. A product whose whole promise is
        that evidence compounds cannot make the first piece of evidence
        unreachable, and "wait for a connector" is not an answer to "I heard
        something ten minutes ago".

        LONGER MATERIAL HAS ITS OWN DOOR, revealed in this same Block. A file
        or a transcript needs a name and a body that keeps its paragraphs, and
        it is one signal rather than one per line, which the box above cannot
        express without lying about what it is doing. */}
      {!loadError && !loading && !picking ? (
        <Region
          title="Capture what you heard"
          sub={
            signalsEmpty
              ? "Nothing is connected yet, and you do not have to wait for that. Write down what you already know."
              : undefined
          }
          // Offered here only once clusters exist. With none, the Gate above
          // IS the cluster call, and two of them would be two subjects.
          act={
            ranked.length > 0 && unclustered > 0
              ? cluster.isPending
                ? "Reading them together"
                : `Cluster the loose ${unclustered}`
              : undefined
          }
          onAct={() => cluster.mutate()}
          acting={cluster.isPending}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (captureReady && !capture.isPending) capture.mutate(draft);
            }}
          >
            <Textarea
              // Where `?capture=1` lands. See `captureBox` above.
              ref={captureBox}
              value={draft}
              // Held at the same ceiling the server enforces, so a very long
              // paste is trimmed while it is still editable rather than coming
              // back as a validation error after the round trip.
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_BODY_CHARS))}
              placeholder="What did you hear, and where from? One per line."
              aria-label="Capture a finding"
              rows={3}
              // KEPT AS MEASURED, not rounded onto Meridian's ramp. These four
              // are the height a three-line capture box was tuned to; the
              // component's own floor is 80px and its padding is 10/8, so
              // dropping them would move the box a reader has used. The ratchet
              // law makes today's drawing the floor, and a refactor is not a
              // licence to redraw it.
              style={{ height: "auto", minHeight: 76, padding: "10px 12px", resize: "vertical" }}
            />
            {/* `mt-mrd-4`: Meridian's Actions sets no outer margin, and without
              it these sit flush against the box above. Same reason as the
              settled row's control. */}
            <Actions className="mt-mrd-4">
              <Action type="submit" disabled={!captureReady || capture.isPending}>
                {capture.isPending ? "Capturing" : "Capture"}
              </Action>
              {/* The door to the longer form. It is a toggle rather than a
                second panel, and it says which state it is in, so it is never
                a control that opens something you cannot close. */}
              <Action
                aria-expanded={bodyOpen}
                onClick={() => {
                  setBodyOpen((v) => !v);
                  setFileNote(null);
                }}
              >
                {bodyOpen ? "Close the longer one" : "Add a document or transcript"}
              </Action>
            </Actions>
          </form>

          {bodyOpen ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (bodyReady && !captureBody.isPending) captureBody.mutate();
              }}
            >
              {/* WHAT IT IS, and this is not a question about our storage: a
                meeting transcript and a written document are different kinds
                of evidence, they read differently, and the row afterwards says
                which one it was. Two options, so it is the words themselves
                rather than a select.

                STILL A LINE RATHER THAN A FIELD, and the reason changed under
                the port. Meridian's `Field` no longer wraps its children: it is
                a div that binds by NAME, through `htmlFor` pointing at one
                control id. A radio group has no single id to point at, so a
                Field here would render a `<label for>` with nothing on the
                other end of it -- an orphan name rather than the double-firing
                label the retired Field produced. Line without `htmlFor` renders
                its label as a span, which is correct, and `Choices` carries its
                own accessible name through `label`. Two names on one control is
                a defect, not belt and braces.

                `mode="one"` is now stated rather than defaulted, and that is
                the point of the prop: `one` is a radio group with one tab stop
                and arrow keys, `any` is independent toggles. These two options
                are one decision. */}
              <Line label="What you are adding">
                <Choices
                  mode="one"
                  label="What you are adding"
                  value={bodyKind}
                  onChange={(id) => setBodyKind(id)}
                  options={[
                    { id: "document" as const, label: "A document" },
                    { id: "transcript" as const, label: "A transcript" },
                  ]}
                />
              </Line>

              <Field label="What to call it" htmlFor="capture-body-title">
                <Input
                  id="capture-body-title"
                  value={bodyTitle}
                  onChange={(e) => setBodyTitle(e.target.value)}
                  placeholder={
                    bodyKind === "transcript"
                      ? "Churn call with Northwind, March 4"
                      : "Q3 research readout"
                  }
                  maxLength={200}
                />
              </Field>

              <Field label="The text itself" htmlFor="capture-body-text">
                <Textarea
                  id="capture-body-text"
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value.slice(0, MAX_BODY_CHARS))}
                  placeholder={
                    bodyKind === "transcript"
                      ? "Paste the transcript, or choose a file below."
                      : "Write it here, paste it, or choose a file below."
                  }
                  rows={8}
                  style={{
                    height: "auto",
                    minHeight: 168,
                    padding: "10px 12px",
                    resize: "vertical",
                  }}
                />
              </Field>

              {/* The file picker. A bare file input is unstyleable and reads as
                a different product, so the button is the affordance and the
                input is the mechanism. It is still a real input, so the
                keyboard and assistive tech reach it through the button. */}
              <input
                ref={fileInput}
                type="file"
                accept={READABLE_EXTENSIONS.join(",")}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  // Cleared so choosing the same file twice fires again.
                  e.target.value = "";
                  if (file) void readFile(file);
                }}
              />

              {/* The file is an alternative way to FILL the box above, not a
                second way to submit, so it sits with the field it fills rather
                than in the action row. The sub line is the one place this
                surface admits a limit: naming the formats it cannot read is
                what stops a person picking a PDF and finding out afterwards.
                A rejected file replaces that sentence in place, because a
                refusal is a state of this composer and not an announcement
                that erases itself while you are still looking for it. */}
              <Line
                label="Or read it in from a file"
                sub={
                  fileNote ? (
                    <span className={fileNote.failed ? "text-mrd-fail" : undefined}>
                      {fileNote.text}
                    </span>
                  ) : (
                    <>
                      Plain text only: {READABLE_EXTENSIONS.join(", ")}. A PDF or a Word file has to
                      be opened and pasted, because nothing here can read one yet.
                    </>
                  )
                }
              >
                <Action busy={fileReading} onClick={() => fileInput.current?.click()}>
                  {fileReading ? "Reading the file" : "Choose a file"}
                </Action>
              </Line>

              <Actions
                className="mt-mrd-4"
                trailing={
                  <Action
                    variant="quiet"
                    onClick={() => {
                      setBodyOpen(false);
                      setBodyTitle("");
                      setBodyText("");
                      setFileNote(null);
                    }}
                  >
                    Discard it
                  </Action>
                }
              >
                <Action type="submit" disabled={!bodyReady || captureBody.isPending}>
                  {captureBody.isPending
                    ? "Capturing"
                    : bodyKind === "transcript"
                      ? "Capture the transcript"
                      : "Capture the document"}
                </Action>
              </Actions>
            </form>
          ) : null}
        </Region>
      ) : null}

      {/* THE BOUNDARY FOR THIS STATION, and it belongs on the station rather
        than three clicks away in Settings.

        GOVERNANCE-PRINCIPLE.md, the founder ruling this obeys: "policy is set
        in advance and does not block", and "the machinery already exists; it
        needs promoting from a settings page to the centre of the product."
        This is the literal case it names. `toggleAutoCluster` and
        `getWorkspaceClusterSettings` have existed since the F3 work, the
        `cluster-tick` cron reads the flag every tick, and NOTHING in src/routes
        or src/components ever called either one. Unattended sensing was built
        end to end and the human had no switch anywhere in the product.

        It is one line with a switch on the end, not a panel, because a boundary
        is a sentence you set once. It does not block anything, and the second
        line reports what the boundary has actually been doing rather than
        restating the first (hard ban 10). */}
      {clusterSettings.data?.is_owner && !picking && !loading && !loadError ? (
        <Region title="The boundary">
          {/* No `htmlFor`: Toggle renders a `<button role="switch">`, and
            Line's own contract says a `<label for>` pointing at a button would
            make the label a second way to fire it, which is wrong for a control
            that acts rather than holds a value. The Toggle carries its own
            accessible name through `label` instead. */}
          {/* LABEL CORRECTED 2026-08-15. It read "Read new signals without
            asking", and this switch does not read anything: `toggleAutoCluster`
            writes `auto_cluster_enabled`, which decides whether captured signals
            are GROUPED on a schedule. Reading connected sources is
            `auto_sense_enabled`, a different column with a different cron job.

            So somebody who wanted their sources polled turned this on, was told
            "On", and nothing was ever read. The sub-line half-admitted it by
            saying "nothing clusters", but the label is the part a person acts on,
            and a label that promises the wrong mechanism is worse than a vague
            one. The reading switch now sits underneath, where the question is
            actually asked. */}
          <Line
            label="Group new findings without asking"
            sub={
              clusterSettings.data.enabled ? (
                clusterSettings.data.last_run_at ? (
                  <>
                    On. Last grouped <Num>{since(clusterSettings.data.last_run_at)}</Num>, and it
                    keeps going without waiting for you.
                  </>
                ) : (
                  "On. It has not had a batch to group yet."
                )
              ) : (
                "Off, so nothing is grouped until you press the button yourself."
              )
            }
          >
            {/* `busy` alongside `disabled`, which the retired Switch could not
              say. The two are separate in Meridian and the cursor follows
              `busy`: a switch a person is simply not allowed to move must not
              promise them it is about to finish something. Here it genuinely is
              -- the write is in flight -- so both are true and both are stated,
              and the control announces `aria-busy` while it waits. */}
            <Toggle
              checked={clusterSettings.data.enabled}
              onChange={(next) => autoSense.mutate(next)}
              label="Group new findings without asking"
              disabled={autoSense.isPending}
              busy={autoSense.isPending}
            />
          </Line>
        </Region>
      ) : null}
      {/* THE READING SWITCH, ON THE STATION WHOSE JOB IS READING.
        It governs `auto_sense_enabled`, which decides whether connected sources
        are polled on a schedule, and until now it existed nowhere a person could
        reach except a governance page two sections away. Somebody standing on
        Discover asking "why has nothing new arrived" was two sections from the
        answer, on the one station where the question is obvious.

        THE SAME COMPONENT /boundary RENDERS, filtered to this one flag rather
        than reimplemented. A second control for one column is how two switches
        for one setting come to disagree, which is the defect corrected directly
        above this line. */}
      {!picking && !loading && !loadError ? (
        <AutomationBoundary
          workspaceId={activeWorkspaceId ?? null}
          only={["auto_sense_enabled"]}
          title="Reading your sources"
          sub="Whether connected sources are read on a schedule, without you asking each time."
        />
      ) : null}
    </Surface>
  );
}
