/**
 * Decide. Redesigned, not re-skinned (SURFACE-JUSTIFICATION.md).
 *
 * The prototype does not draw this surface, so it owes the five answers. Pass
 * one ported it onto the primitives; this pass makes every element earn its
 * place, and deletes the ones that could not.
 *
 * 1. WHO IS HERE, AND WHY. A product lead who has been told the ranking moved
 *    and now has to say yes or no to the bet at the top of it. One call, in
 *    front of them, right now. They are not here to browse a portfolio.
 *
 * 2. THE ONE THING IT EXISTS FOR. To settle one ranked bet with the account's
 *    own record in front of them. Nowhere else in the product puts the bet,
 *    the challenge, and what happened last time we reasoned this way on one
 *    screen at the moment of the call. Everything else here supports that or
 *    was cut.
 *
 * 3. KEEP / MOVE / KILL:
 *    KEEP  the Gate. The whole surface is one question with one primary answer.
 *    KEEP  the record recess, directly under the Gate. The record contradicting
 *          you at the moment you decide is the single differentiated moment in
 *          this product; a side rail would demote it to a statistic.
 *    KEEP  the ranked queue below, and the "why it ranks here" context, which
 *          is the only place the order explains itself.
 *    KILL  the "What the record says" block heading. It labelled a component
 *          that already announces itself, and inserted a third heading register
 *          between the question and the queue (hard ban 10).
 *    KILL  the "Behind this one" context section. It counted the queue that is
 *          rendered in full immediately below it, zero clicks away.
 *    KILL  the "Send it back" button. It needed a tooltip to explain its own
 *          label, and two adjacent ways to not-decide make the decision harder,
 *          not easier. Parking is one click away in the full record's status
 *          menu, which owns every status.
 *    KILL  ICE from the queue rows, and the word "Ranked" in front of the rank.
 *          A score is the ranking's internal input; it belongs to the one bet
 *          in focus, where the context column already carries it.
 *    KILL  the error Gate and the empty-state Gate. A failed read is not a
 *          decision and does not get the surface's biggest treatment, and both
 *          restated a headline sitting two lines above them.
 *    KILL  the queue block when there is no queue. A heading over one line of
 *          "that is the whole queue" is a panel doing nothing, standing between
 *          the reader and the question they came to answer.
 *
 * 4. ONE CLICK AWAY. A queue row is the bet's title plus one different fact
 *    (its rank and what the reviewer concluded), and it never wraps. The
 *    problem statement, the teardown, the brief link, the status menu, delete
 *    and lineage all live behind "Open the full record".
 *
 * 5. THE MOMENT, AND THE CONFUSION. The moment is the recess speaking: the
 *    last time we reasoned this way, here is what actually happened. It arrives
 *    unasked, at the only instant it can change an outcome. The confusion to
 *    avoid is two competing "not now" paths and a wall of scores, which is what
 *    the pass-one surface still had.
 *
 * Every write survives: the same deterministic comparator, the same server
 * functions and query keys, the same k/c/x keys, and the same detail sheet.
 *
 * ---------------------------------------------------------------------------
 * 2026-08-02. Founder: "certain cards are not clickable and details, whatever
 * is required, I feel left out. I don't know where to find them, and I do not
 * have their entire information as a user." Four things were true, and each one
 * is a hole rather than a taste:
 *
 * 1. A QUEUE ROW OPENED NOTHING. It called setSelectedId, which only re-pointed
 *    the Gate, and the sheet was hard-wired to the Gate's bet, so pressing any
 *    row in the ranking could never show that bet's record. The row now opens
 *    the record it belongs to, and the Gate keeps its own door in the row's
 *    trailing action slot, outside the clickable region.
 * 2. ICE WAS READ-ONLY IN PRACTICE. `updateOpportunity` has always accepted
 *    impact, confidence and ease and no caller anywhere sent one, so the three
 *    numbers that produce this entire order could be read and not changed. They
 *    are editable in the context column, beside the ranking they cause.
 * 3. NOW, NEXT AND LATER WERE BURIED. The only control that set them was a
 *    "Move to" menu at the foot of the open record. The placement is a control
 *    on this surface now, next to the call that needs it.
 * 4. THE ROW NEVER SAID WHICH LANE A BET WAS IN, which stopped being tolerable
 *    the moment the lane became settable from here.
 *
 * What did NOT change: the comparator, the server functions, the query keys,
 * the k/c/x keys, the Gate's one primary answer, and the record recess sitting
 * directly under the question.
 *
 * ---------------------------------------------------------------------------
 * 2026-08-06. Three things this surface promised and did not do. All three are
 * doors, not taste, and each one is written out in full at its own site:
 *
 * 1. PLACING A BET MOVED NOTHING BUT A WORD. The lane control wrote
 *    `opportunities.status` and /plan's board reads `opportunities.roadmap_bucket`,
 *    so "Placing it moves the roadmap" was contradicted one click later by an
 *    empty Now lane, and a bet placed in Next was not on Plan at all. The write
 *    is two calls now, `updateOpportunity` then the lenient `updateRoadmapItem`,
 *    and the receipt names the board it reached. See `laneBucketFor`.
 * 2. THE TEARDOWN WAS A SENTENCE ABOUT A TEARDOWN. The Critic's risks, kill
 *    criteria and missing evidence were already on `critic_review` and rendered
 *    only for a spec; the station that rules on the bet showed a 240-character
 *    summary and a verdict word. `CriticBadge` is mounted in the context column,
 *    on the opportunity branch it has always carried.
 * 3. THE RECESS COULD NOT BE CHECKED. The one surface that claims the record
 *    learned from you had no onClick, so the claim had no evidence behind it.
 *    It opens the outcome recorded on THIS bet, or the Learnings record when
 *    this bet has none of its own; it never invents an id. Not the mirrored bet
 *    the citation names -- that one's ids are filtered out and collapsed to a
 *    string upstream, and the door's label says which record it is opening.
 *
 * ---------------------------------------------------------------------------
 * 2026-08-06, second pass. THE SENTENCE THAT STATES THE MOAT WAS FICTION FOR
 * EVERY USER IN THE DATABASE, and the one element that could have proved it was
 * gated behind the thing a new account cannot have. Four sites, each written
 * out in full where it lives:
 *
 * 1. THE SUBTITLE CLAIMED A RE-RANK THAT NEVER HAPPENED HERE. `lastRescoreAt`
 *    was max(created_at) over an unfiltered, cross-workspace learnings read, so
 *    the timestamp came from whichever workspace had the newest row -- usually
 *    the seeded Explore one. It is read from a workspace-scoped,
 *    moved-a-score-only query now, and the no-outcomes-yet branch says what the
 *    order IS built from rather than hedging the claim it cannot make. Scoping
 *    was only half of it: the workspace a re-rank is scoped TO can itself be the
 *    seeded example, so there is a third true sentence for that case, and the
 *    claim is withheld entirely until the flag that decides between them can be
 *    read. See `workspaceKnown` and `inExampleWorkspace`.
 * 2. "ENOUGH HISTORY TO CITE HONESTLY" COUNTED OTHER PEOPLE'S WORKSPACES. Same
 *    read, same defect, one screen further down: it decided whether to spend an
 *    embedding per visible bet.
 * 3. CORROBORATION WAS READ IN A NARROWER SCOPE THAN THE BETS. Themes came from
 *    a product-scoped list, bets from an unscoped one, so about half the
 *    theme-linked bets showed no signal count at all and the queue reordered
 *    when the product picker moved, with nothing saying why.
 * 4. THE ICE DELTA WAS GATED ON A CITATION A FIRST OUTCOME CANNOT PRODUCE. The
 *    record recess now renders on EITHER the citation or the delta, so the
 *    first outcome a person ever settles is visibly the one that moved the bet.
 *
 * What did NOT change: the comparator, the server functions, the k/c/x keys,
 * the Gate's one primary answer, and the recess sitting directly under it.
 *
 * ---------------------------------------------------------------------------
 * 2026-08-06, third pass. THE STATION COULD BE ANSWERED AND SHOWED NO SIGN OF
 * IT. Every one of these is written out in full at its own site; this is the
 * index.
 *
 * 1. "KEEP IT" LEFT NO MARK ON THE STATION. `placeKeptBetInNext` wrote
 *    `roadmap_bucket` and not `status`, and every place this surface shows a
 *    placement reads `status`; this handler then invalidated nothing at all. So
 *    a person kept a bet, came back, and found it ranked #1 with its pill
 *    reading Backlog and its primary button still reading "Keep it". Both
 *    columns are written now, and both caches are dropped. See `draftSpec`.
 * 2. THE GATE KEPT ASKING THE QUESTION IT HAD JUST ANSWERED. Nothing removes a
 *    settled bet from the ranking and the comparator cannot: ICE is its first
 *    term and dropping a bet does not change ICE. A skip list, and the receipt
 *    names the bet the question moved to. See `settledRef`.
 * 3. "CHALLENGE IT" SENT THE READER TO TODAY FOR A TEARDOWN TODAY CANNOT SHOW.
 *    It lands on the bet's own row and opens in the column beside the call.
 * 4. THE LANE CONTROL FILED A JUDGMENT PER ARROW KEY. `Choices` fires on every
 *    arrow and on a click of the lane already set, and each one reached
 *    `recordJudgment`. See `LanePicker`.
 * 5. THE DROP RECEIPT ASSERTED THE CALL REACHED THE RECORD AND NOTHING CHECKED.
 *    `updateOpportunity` reports the judgment now, the receipt says which of the
 *    two happened, and a Door opens the decision it wrote.
 * 6. THE HANDOFF REPORTED WHETHER THE BET REACHED PLAN AND THIS SURFACE THREW
 *    THE REPORT AWAY. `r.placement` and `r.existing` are read before the
 *    navigation.
 * 7. NO DOOR TO NAME A BET AT THE STATION THAT RULES ON BETS. `runWedgeTeardown`
 *    did the whole thing in one call and onboarding was its only caller. See
 *    `NameABet`.
 *
 * What did NOT change: the comparator, the query keys, the a/c/d keys, the
 * Gate's one primary answer, and the recess sitting directly under it.
 *
 * ---------------------------------------------------------------------------
 * 2026-08-10. THE QUEUE WAS A DEMONSTRATION OF A QUEUE. Five of these six are
 * things the station promised and could not do; the sixth is the one idea here
 * that no shipped competitor has. Each is written out in full at its own site.
 *
 * 1. THE SKIP LIST WAS SESSION-ONLY AND THE ONE PATH THAT MATTERS UNMOUNTS THE
 *    ROUTE. Keeping a bet navigates to the spec it just wrote, so press `a`,
 *    read it, come back, and the same bet was #1 again asking the same
 *    question. The comment here called that "the honest scope for a fact
 *    nothing is written to the record", and the premise was false: a keep
 *    writes `roadmap_bucket` and a drop writes `status`. See
 *    `answeredOnTheRecord`.
 * 2. THE FRICTION WAS INVERTED. Delete asked before removing one row; "Keep it"
 *    spent THREE model calls off a bare `a` with nothing in between. The cheap
 *    reversible act was guarded and the expensive one was not. See `keepBet`.
 * 3. NO FILTER, NO SEARCH, NO SORT, NO BULK: `const others = ranked`, five
 *    visible, an "All 31". A product lead could not answer "which has the
 *    Critic flagged" or "where is the checkout one" without reading every row.
 *    See `lensed`, `ordered`, `picked` and `dropMany` -- and note that bulk
 *    offers ONLY the drop, for the reason in 2.
 * 4. THE ICE EDITOR WAS THE FIFTH HEADING IN THE RIGHT RAIL. It is the only
 *    control on the surface that changes the order the whole page is about, and
 *    four read-only reasons stood above it. It leads the column now.
 * 5. THE ROWS COULD NOT BE SCANNED. Status was an agent's face and a sentence
 *    per row, so "Critic says ship" was the commonest string on the page and
 *    the two rows in trouble competed with it. Status is a ring that survives
 *    greyscale, magnitude is a numeral plus a 2px bar on one shared scale, and
 *    the verdict sentence is EXCEPTION-ONLY. A batch header states the whole
 *    distribution above the list, which is what makes rank 1 worth trusting:
 *    without it a reader has no way to ask what rank 12 looks like.
 * 6. RANK THE MOVEMENT, NOT THE MAGNITUDE. Every ranked queue studied shows a
 *    current value; none shows what changed. `learnings.prior_ice` / `new_ice`
 *    is a real previous score, so a moved bet carries its signed delta and the
 *    list can be ordered by what the record re-scored. It is the only element
 *    on this station that makes the compounding claim in the subtitle
 *    falsifiable. Offered only when something has actually moved. See
 *    `movementByOpp`.
 *
 * AND THE VOCABULARY. /today says "decision"; this station still said "call".
 * Measured over 5.72M words of operator conversation, "decision" runs at 562.8
 * per million and "call" is not the noun operators reach for -- and the table
 * this surface writes to is the decision log, so the screen was using a
 * different word from its own record.
 *
 * What did NOT change: the comparator, the server functions, the query keys,
 * the a/c/d keys, the Gate's one primary answer, and the recess sitting
 * directly under it.
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Num } from "@/components/meridian/surface-parts";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/lib/notify";
import { isModalOpen } from "@/lib/overlay";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  deleteOpportunity,
  generatePrd,
  getThemePrecedent,
  listOpportunities,
  listThemes,
  runCriticReview,
  runWedgeTeardown,
  updateOpportunity,
} from "@/lib/discovery.functions";
import { listLearnings } from "@/lib/outcome.functions";
import { updateRoadmapItem, type RoadmapBucket } from "@/lib/roadmap.functions";
import { getProvenance } from "@/lib/lineage.functions";
import { getPrecedentCitations } from "@/lib/decision-judgment.functions";
import { getBriefAlignment } from "@/lib/brief-opportunity.functions";
import { alignmentForOpportunity } from "@/lib/brief-opportunity";
import { iceNum, rescoreNoteOf, round1 } from "@/lib/moat-vis";
import { verdictFor, withTimeout, type VerdictWord } from "@/components/discover/format";
import { outcomeSupportFromCounts, rankOpportunities } from "@/components/discover/ranking";
import {
  BestBetStamp,
  DesignationTag,
  STATUS_META,
  StatusPill,
  type OpportunityStatus,
} from "@/components/discover/OpportunityRow";
import {
  IceEditor,
  OpportunityDetailSheet,
  type OpportunityDetailRecord,
} from "@/components/discover/OpportunityDetailSheet";
import { VerdictBadge } from "@/components/discover/VerdictBadge";
import { CriticBadge } from "@/components/governance/CriticBadge";
import { LineageDrawer } from "@/components/supaprod/LineageDrawer";
import { Actions, Block, Button, Choices, CtxBody, CtxHead, CtxRow, Door, Empty, Failed, Field, Input, Loading, Gate, Line, PageHead, Receipt, Record as RecordRecess, Row, SelectionBar, Surface } from "@/components/shell/primitives";
import { AgentMark } from "@/components/meridian/marks";
import { useSelection } from "@/components/shell/use-selection";
import {
  BatchHeader,
  ScoreMeter,
  SelectBox,
  StatusRing,
  type RingFill,
  type RingTone,
} from "@/components/decisions/queue-instruments";
import { AgentPulse } from "@/components/shell/AgentPulse";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { CrewWorking } from "@/components/shell/CrewWorking";
import { stillWaiting } from "@/lib/query-state";
import "@/styles/decide.css";

/** The agent that red-teams a call, named from the one catalog so this page
 *  never hard-codes a display name that the catalog can rename. */
const CHALLENGER = "critic";

/** How many bets sit under the gate before the queue asks to be expanded. */
const VISIBLE_OTHERS = 5;

/**
 * THE PLACEMENT, ON THE SURFACE THAT MAKES IT.
 *
 * Now, Next and Later were reachable from exactly one control in the product: a
 * "Move to" dropdown at the bottom of the open record, behind two clicks and a
 * scroll. So the station where a person settles a bet could say yes, could say
 * challenge it, and could say drop it, and could not say WHEN. That is half a
 * decision, and it is the half a roadmap is made of.
 *
 * Four of the six statuses, not six. `shipped` is written when something ships,
 * by the work, never by a judgment made here. `dropped` already has its own verb
 * inside the Gate, where it belongs: dropping a bet is a call, not a placement,
 * and two ways to say the same thing on one screen is the confusion this surface
 * was rebuilt to remove.
 */
const LANES: { id: OpportunityStatus; label: string; title: string }[] = [
  { id: "now", label: "Now", title: "Work starts on it in the cycle running today" },
  { id: "next", label: "Next", title: "Committed, and it starts once Now clears" },
  { id: "later", label: "Later", title: "Agreed in principle, with no cycle behind it" },
  { id: "backlog", label: "Backlog", title: "Kept on the record, with nothing promised" },
];

/**
 * THE LANE IS TWO COLUMNS, AND THIS SURFACE WAS ONLY WRITING ONE.
 *
 * `opportunities` carries a placement twice. `status` is the lifecycle word this
 * station has always written through `updateOpportunity`; `roadmap_bucket` is the
 * column the board on /plan actually reads -- `getRoadmap` in roadmap.functions.ts
 * maps `roadmap_bucket` into `RoadmapItem.bucket`, and touches `status` only to
 * exclude shipped and dropped rows. So picking Now here moved the word and not
 * the board: /plan drew an empty Now lane under the headline "One bet is
 * committed but sits in no lane", and a bet placed in Next was not on Plan at
 * all. The two columns disagreeing one click apart is the same class of defect
 * the `status` comment in roadmap.functions.ts already documents.
 *
 * `undefined` means "this call is not a placement, leave the lane alone", and
 * dropping is the case that needs it: `getRoadmap` already excludes a dropped row
 * by status, so clearing its bucket would throw away the lane it was in and a bet
 * put back into the ranking would come back unplaced.
 */
function laneBucketFor(status: OpportunityStatus): RoadmapBucket | null | undefined {
  if (status === "now" || status === "next" || status === "later") return status;
  if (status === "backlog") return null;
  return undefined;
}

/**
 * The lifecycle write landed and only the lane write failed. Carried on the
 * error itself rather than in a second piece of state, so the receipt can say
 * WHICH HALF moved: "It did not move" would be a lie about the status, and the
 * two writes are two round-trips that can genuinely disagree (the roadmap write
 * scopes on `user_id` explicitly, `updateOpportunity` leans on RLS alone).
 */
type LaneWriteError = Error & { laneOnly?: true };

/** The server caps a citation request at 12 ids; never ask for more. */
const MAX_PRECEDENT_IDS = 12;

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

/**
 * What the reviewer concluded, in a sentence rather than a chip -- AND ONLY
 * WHEN THERE IS A REVIEWER.
 *
 * `verdictFor` (components/discover/format.ts:175-184) consults
 * `critic_review.verdict` FIRST and otherwise falls through to the lane:
 * `now`/`shipped` reads SHIP, `dropped` reads KILL, `next`/`later` reads WATCH.
 * "Otherwise" is WIDER THAN "absent", which is how this paragraph used to state
 * it: `verdictFor` takes the Critic's word only when it is exactly "ship",
 * "revise" or "kill", so a stored value it does not recognise falls through
 * just as an absent one does. See `criticGaveTheVerdict` below, which is the
 * only correct source for the third argument.
 * Every one of those was rendered here as "<Critic> says ship" -- a judgement
 * attributed by name to an agent that had never opened the bet, on the row a
 * person scans to choose which bet to open. Only the `PENDING` tail was
 * handled, and PENDING is reached solely when there is neither a review NOR a
 * status this mapping names (a `backlog` bet, or one carrying no status at
 * all), so the whole middle of the fall-through spoke in the Critic's voice.
 *
 * THE VERDICT WORD IS NOT DROPPED. It is the comparator's second term
 * (components/discover/ranking.ts:321) whichever way it was derived, so hiding
 * it would make the order less explicable rather than more honest. The sentence
 * names its source instead, and `reviewed` is passed in rather than re-derived
 * so this function stays pure over the same input `verdictFor` read.
 */
function verdictSentence(verdict: VerdictWord, name: string, reviewed: boolean): string {
  if (verdict === "PENDING") return "not reviewed yet";
  if (!reviewed) return `not reviewed yet, and its lane reads ${verdict.toLowerCase()}`;
  return `${name} says ${verdict.toLowerCase()}`;
}

/** The three words `verdictFor` will actually take from `critic_review`, in the
 *  exact form it compares them. Kept beside the predicate that uses them. */
const CRITIC_VERDICT_WORDS: readonly string[] = ["ship", "revise", "kill"];

/**
 * DID THE CRITIC ACTUALLY SPEAK THE WORD ON SCREEN? This is the only correct
 * source for `verdictSentence`'s third argument, and computing it any other way
 * puts back the defect that function exists to remove.
 *
 * The call site used to pass `Boolean(o.critic_review?.verdict)`, which asks
 * whether the column holds any truthy string -- a different question.
 * `verdictFor` (components/discover/format.ts:176-179) takes the Critic's word
 * only when it is EXACTLY one of the three below and otherwise falls through to
 * the lane. So a `critic_review` carrying anything else set `reviewed = true`
 * while the word beside it came from the lane: a judgement attributed by name
 * to an agent that did not give it, which is exactly the misattribution
 * `verdictSentence` was written to stop.
 *
 * NOT TRIMMED AND NOT LOWER-CASED, which is the point rather than an oversight.
 * `verdictFor` compares raw and exact, so normalising here would make this
 * predicate MORE permissive than the function it describes and reopen the same
 * hole from the other side. That the repo normalises before trusting this
 * column elsewhere (`["ship","revise","kill"].includes(r.verdict.trim())`,
 * inside `formatBetTeardown` in src/lib/discovery.functions.ts) is itself the
 * evidence that a jsonb column written by a model is not trusted to hold only
 * those three.
 *
 * CITED BY SYMBOL, NOT LINE, for the reason `lastRescoreAt` gives further down
 * this file: discovery.functions.ts is under concurrent edit. This citation
 * read `:2351`, true at c0be8bfb, and has moved twice since -- once in a landed
 * commit, then again in an uncommitted tree that shifted it between two greps a
 * minute apart. A line number here has a shelf life measured in commits.
 *
 * The parameter is typed structurally on purpose. `CriticReview["verdict"]` is
 * declared as the three-word union, so a nominal type here would make this
 * check look statically pointless; the value is parsed out of jsonb at
 * runtime and the declared union is a hope, not a guarantee.
 *
 * UNREACHABLE ON TODAY'S DATA, and written for the day it is not. The claim
 * that matters is the one that does not rot: OF THE OPPORTUNITIES CARRYING A
 * `critic_review`, ZERO HOLD A WORD OUTSIDE THE THREE. Re-measured through the
 * Lovable MCP on 2026-08-06: 48 of 294, all three-word exact (revise 26, ship
 * 14, kill 8), none other. The counts drifted within that same day -- an
 * earlier pass wrote 47 of 292 with revise 25 -- so read the invariant and
 * treat the pair of integers as the date-stamped sample it is.
 */
function criticGaveTheVerdict(review: { verdict?: string | null } | null | undefined): boolean {
  const v = review?.verdict;
  return typeof v === "string" && CRITIC_VERDICT_WORDS.includes(v);
}

/**
 * ICE IS A THREE-NUMBER AVERAGE AND ITS CEILING IS TEN.
 *
 * `ice_score` is a generated column, `(impact + confidence + ease) / 3`, each
 * term 1..10. Saying so is not pedantry: a bare "7.3" on a row is the exact
 * failure the queue research names -- a reader cannot tell whether it is good,
 * and cannot tell whether the next row's 8.1 is meaningfully better. The meter
 * states the ceiling in its own title and draws the bar against it, so a glance
 * down the column is worth something.
 */
const ICE_CEILING = 10;

/**
 * THE RED TEAM'S STATE, AS A SHAPE.
 *
 * Every ranked queue studied encodes status as a hue, and every one of them
 * loses it in greyscale. Linear's ring was the single exception found in ~200
 * products: how much of the ring is filled IS the state, and the colour only
 * confirms it.
 *
 * COLOUR IS EXCEPTION-ONLY HERE, which is Vanta's discipline rather than a
 * taste. A bet the Critic cleared gets a quiet full ring and NO hue: if
 * everything clear is green, green stops meaning anything and the two rows that
 * are actually in trouble have to compete with it. So only `revise` and `kill`
 * carry a colour, and they are consequently rare enough to find by scanning.
 *
 * `reviewed` IS NOT `Boolean(critic_review)`, and passing the wrong thing here
 * puts back the misattribution `verdictSentence` exists to stop: `verdictFor`
 * falls through to the LANE whenever the stored word is not exactly ship,
 * revise or kill, so a ring painted from a lane-derived verdict would attribute
 * a judgment to an agent that never gave one. When the Critic did not speak,
 * the fill still reflects the lane -- that IS what the comparator ranked on --
 * and the tone stays neutral and the label says where the word came from.
 */
function redTeamRing(
  verdict: VerdictWord,
  reviewed: boolean,
  name: string,
): { fill: RingFill; tone: RingTone; label: string } {
  const source = reviewed
    ? `${name} says ${verdict.toLowerCase()}`
    : `its lane reads ${verdict.toLowerCase()}, ${name} has not reviewed it`;
  if (verdict === "PENDING") {
    return {
      fill: "empty",
      tone: "quiet",
      label: `Not reviewed. ${name} has not opened this bet.`,
    };
  }
  if (verdict === "KILL") {
    return { fill: "struck", tone: reviewed ? "fail" : "quiet", label: source };
  }
  if (verdict === "REVISE") {
    return { fill: "part", tone: reviewed ? "warn" : "quiet", label: source };
  }
  if (verdict === "WATCH") {
    return { fill: "part", tone: "quiet", label: source };
  }
  return { fill: "full", tone: "quiet", label: source };
}

/**
 * A BET THE RECORD SAYS HAS ALREADY BEEN ANSWERED.
 *
 * THE DEFECT THIS CLOSES. The skip list one screen down is session-only, and
 * its own comment admits it: "it lives for as long as this mount does". Keeping
 * a bet navigates to the spec it just wrote, which UNMOUNTS this route, so the
 * single commonest path through this station -- press `a`, read the spec, come
 * back -- returned the reader to the identical Gate asking about the bet they
 * had just kept. The one place the answer survived was the record, and nothing
 * here read it.
 *
 * THREE COLUMNS, AND THEY ARE NOT EQUALLY STRONG, so the strength is written
 * down rather than flattened:
 *   - `dropped` and `shipped` are terminal. `LANES` offers neither, `getRoadmap`
 *     excludes both, and this file's own `dropBet` refuses a second drop. There
 *     is no reading under which one of these is still an open question.
 *   - `roadmap_bucket` is WEAKER and is included deliberately. It is what
 *     `placeKeptBetInNext` writes on a keep, so it is the only trace a keep
 *     leaves that survives the navigation. It is also written by an ordinary
 *     lane press, which is a placement rather than a settle -- but a bet you
 *     have placed in a lane is still a bet you have answered, and "which bet
 *     have I not looked at" is exactly the question the default selection is
 *     asking.
 *
 * IT IS A PREFERENCE, NEVER A FILTER. Every one of these bets stays in the
 * ranking, keeps its rank and can be pulled back under the Gate with "Decide
 * it". All this does is decide which one opens when nobody has chosen.
 */
function answeredOnTheRecord(opp: OpportunityDetailRecord): boolean {
  return opp.status === "dropped" || opp.status === "shipped" || Boolean(opp.roadmap_bucket);
}

/** What the ranking is being narrowed to. Kept out of the URL: it is a way of
 *  looking at the queue, not a place in the product -- the same call Discover's
 *  merge picker made about its own filter. */
type Lens = "all" | "waiting" | "flagged" | "cleared";

const LENSES: { id: Lens; label: string; title: string }[] = [
  { id: "all", label: "All", title: "Every ranked bet" },
  {
    id: "waiting",
    label: "Awaiting review",
    title: "No teardown on the record yet, so the verdict beside it came from its lane",
  },
  { id: "flagged", label: "Flagged", title: "The Critic asked for a revision, or said kill it" },
  { id: "cleared", label: "Cleared", title: "The Critic read it and said ship" },
];

/** How the ranking is ordered. "Score" is the deterministic comparator and is
 *  the default; "moved" is the one this product can offer and no shipped
 *  competitor does. See `ordered`. */
type Order = "score" | "moved";

/** Long enough to collect a burst of arrow presses into one write, short enough
 *  that nobody sits waiting on a timer. Blur and unmount beat it anyway. The
 *  same number `IceEditor` settled on (ICE_COMMIT_MS), for the same reason. */
const LANE_COMMIT_MS = 400;

/**
 * THE LANE COMMITS ON SETTLE, NOT ON EVERY KEY THE ARROWS PASS THROUGH.
 *
 * `Choices` fires `onPick` on a click of the option that is ALREADY on, and on
 * EVERY arrow (primitives.tsx, `onKeyDown` calls `onPick(next.id)` before it
 * moves focus). This control used to hand each of those straight to
 * `setStatus.mutate`, and `updateOpportunity` records a judgment for every
 * status it is handed. `judgmentFor` has no no-op guard -- `recordStageEvent`
 * does (`if (ev.from != null && ev.from === ev.to) return;`) and the judgment
 * beside it does not.
 *
 * So: focus Backlog, press ArrowRight three times to reach Later, and the
 * decision ledger gained an approval reading "Kept at the gate, from backlog to
 * now" and a second reading "Kept at the gate, from now to next" -- two lanes
 * the person only arrowed PAST, filed as calls they made. Clicking the lane a
 * bet is already in filed "Kept at the gate, from next to next". The gate has
 * produced ONE judgment in the product's history; this is the path that would
 * have filled that table with calls nobody made, on the one table Learn grades
 * outcomes against.
 *
 * TWO GUARDS, AND THEY CLOSE DIFFERENT HOLES. The debounce collects a burst of
 * arrows into the lane the person stopped on; the equality check kills the
 * click-the-selected-lane duplicate outright, which no amount of waiting would
 * catch. Mirroring the stage-event guard inside `judgmentFor` is worth doing too
 * and does NOT cover the arrow-transit case, where each write names a different
 * lane and is a perfectly well-formed transition.
 *
 * THE KEYBOARD STAYS LIVE, which is the constraint the comment at the mount site
 * protects: a radio group that disables itself mid-decision throws focus to the
 * body and loses the arrow keys.
 *
 * THE STORED LANE WINS whenever nothing of ours is pending, so a refused write
 * reverts rather than leaving a lane on screen the record refused, and a lane
 * set from the open record lands here. `pending` is in the dependency list for
 * exactly the refusal case: `stored` does not change when a write fails, so an
 * effect keyed on it alone would never run and the failed lane would stay lit.
 */
function LanePicker({
  opportunity,
  pending,
  onCommit,
}: {
  opportunity: OpportunityDetailRecord;
  /** A write on THIS bet is in flight. */
  pending: boolean;
  onCommit: (status: OpportunityStatus) => void;
}) {
  const stored = opportunity.status as OpportunityStatus;
  const [draft, setDraft] = React.useState<OpportunityStatus>(stored);
  const timer = React.useRef<number | null>(null);
  // Read by the blur and unmount flushes, which run once and therefore cannot
  // close over the render that scheduled the pending write.
  const latest = React.useRef({ stored, draft, onCommit });
  React.useEffect(() => {
    latest.current = { stored, draft, onCommit };
  });

  React.useEffect(() => {
    if (timer.current === null && !pending) setDraft(stored);
  }, [stored, pending]);

  const commit = React.useCallback((next: OpportunityStatus) => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    if (next === latest.current.stored) return;
    latest.current.onCommit(next);
  }, []);

  // An arrowed lane still inside the debounce must not be lost because the Gate
  // moved on to the next bet and took this control with it.
  React.useEffect(
    () => () => {
      if (timer.current === null) return;
      window.clearTimeout(timer.current);
      timer.current = null;
      commit(latest.current.draft);
    },
    [commit],
  );

  return (
    // `display: contents`, so the wrapper carries the focusout listener and
    // changes no layout: `.sp-line-control` is a flex row and `Choices` stays
    // its direct child. focusout bubbles, which is what makes this work at all;
    // React's onBlur is that event, not the non-bubbling `blur`.
    <span
      style={{ display: "contents" }}
      onBlur={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
        commit(latest.current.draft);
      }}
    >
      <Choices
        label="Where this bet sits"
        value={draft}
        options={LANES}
        onPick={(status) => {
          setDraft(status);
          if (timer.current !== null) window.clearTimeout(timer.current);
          timer.current = window.setTimeout(() => {
            timer.current = null;
            commit(status);
          }, LANE_COMMIT_MS);
        }}
      />
    </span>
  );
}

/**
 * NAMING A BET, AT THE STATION THAT RULES ON BETS.
 *
 * THE HOLE. The only route into this station was Discover: capture a signal,
 * cluster it, promote the cluster. That is the right path for a bet the record
 * produced, and it is a three-step detour for the person who arrives with the
 * bet already in their head -- the mid-chain entry the founder's non-linear
 * ruling describes, and the commonest way a product lead actually turns up.
 * The empty state named Discover and offered nothing else, so on a fresh
 * workspace this station could only be watched, never used.
 *
 * A WORKING SERVER FUNCTION NO SURFACE COULD REACH is this repo's named
 * signature defect, and `runWedgeTeardown` was one: it records a stated idea
 * verbatim as an opportunity with neutral ICE and red-teams it in the same round
 * trip, and its only caller in the entire product was onboarding
 * (ObsidianOnboarding.tsx). One press does what the three-step detour does, and
 * lands the new bet under the Gate with a teardown already attached, which is
 * the strongest version of this station's own claim.
 *
 * NEUTRAL ICE IS NOT A SCORE, and the copy says so rather than letting the queue
 * imply one. `runWedgeTeardown` writes impact, confidence and ease all at 5
 * because the person has not scored the bet; the ICE editor in the context
 * column is where that gets settled, and the Critic's `missing_evidence` is most
 * of what a first-run bet is worth.
 *
 * THE VERDICT MAY BE NULL. `runWedgeTeardown` returns `review: null` when the AI
 * gateway is unavailable, and the idea is still saved. The receipt says which of
 * the two happened rather than promising a teardown that is not there.
 */
function NameABet({ pending, onName }: { pending: boolean; onName: (idea: string) => void }) {
  const [idea, setIdea] = React.useState("");
  const id = "decide-name-a-bet";
  // The server takes 3 to 200 characters and rejects the rest; a button that
  // fires a refusal is worse than one that waits.
  const ready = idea.trim().length >= 3 && idea.trim().length <= 200;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready || pending) return;
        onName(idea.trim());
        setIdea("");
      }}
    >
      <Field label="The bet, in your words" htmlFor={id}>
        <Input
          id={id}
          value={idea}
          maxLength={200}
          disabled={pending}
          placeholder="Skip the address re-confirm when nothing changed"
          onChange={(e) => setIdea(e.target.value)}
        />
      </Field>
      <Actions>
        {/* `type="submit"`, so Enter in the field is the same press as the
            button. `Button` defaults to type="button" and spreads its rest
            props after it, so this overrides rather than fights it. */}
        <Button variant="primary" type="submit" disabled={!ready || pending}>
          Name it and tear it down
        </Button>
      </Actions>
    </form>
  );
}

function DecideSurface() {
  // The spine, lit on this station. One shared query across all seven
  // (use-spine-strip.ts), so an always-on strip costs one request, not seven.
  useSpineStrip("decide");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const confirm = useConfirm();
  // No `activeProductId`. The bets on this station are read unscoped, so the
  // themes beside them are too — see the themes query below.
  //
  // `activeWorkspace` is read for ONE question, which turns out to have two
  // halves: whether the workspace the reader is standing in is the seeded
  // example, and whether that is knowable yet at all. The page subtitle makes
  // the product's strongest claim about this workspace's own history; that claim
  // reads differently when the history was shipped with the account, and it must
  // not be made at all while we cannot tell the two apart. See
  // `inExampleWorkspace` and `workspaceKnown` immediately below.
  const { activeWorkspaceId, activeWorkspace } = useWorkspace();
  /**
   * TRUTHINESS, NEVER `!== false`. `Workspace.is_sample` is `boolean | null |
   * undefined` because the workspaces query selects `*`, so an older read
   * schema simply has no such key. Treating an unknown flag as "example" would
   * caveat a real workspace's real record, which is the worse of the two
   * errors and is the same rule the bet rows follow (`o.is_sample ?`).
   */
  const inExampleWorkspace = activeWorkspace?.is_sample === true;
  /**
   * AND WHETHER THE FLAG CAN BE READ AT ALL YET, WHICH IS A THIRD STATE THE
   * BOOLEAN ABOVE CANNOT HOLD.
   *
   * `activeWorkspaceId` is restored from localStorage on mount, BEFORE the
   * workspaces query resolves (use-workspace.tsx:114-118), and `activeWorkspace`
   * is `workspaces.find(...) || null` off that same unresolved list. So on every
   * cold load there is a window in which the workspace-scoped `rescores` read
   * below can answer while the row carrying `is_sample` has not arrived, and
   * `activeWorkspace?.is_sample === true` is false because the ROW is missing
   * rather than because the workspace is real. In that window the subtitle would
   * print the unqualified re-rank sentence about a seeded record -- the exact
   * claim the block at the PageHead exists to stop, and reachable for the 3 of
   * 16 users whose alphabetically-first workspace is a seeded one (re-measured
   * 2026-08-06).
   *
   * So the claim is withheld until the row is in hand. A FAILED workspaces read
   * holds it withheld forever, and that is the correct direction rather than an
   * oversight: it under-claims a re-rank that did happen and can never assert
   * one that did not, which is the same trade the `rescores` query's own note
   * argues for one screen down. The sentence that shows instead is true in every
   * state, so nothing on screen is waiting on this.
   */
  const workspaceKnown = activeWorkspace !== null;

  const fOpps = useServerFn(listOpportunities);
  const fThemes = useServerFn(listThemes);
  const fLearnings = useServerFn(listLearnings);
  const fBriefAlignment = useServerFn(getBriefAlignment);
  const fCitations = useServerFn(getPrecedentCitations);
  const fCritic = useServerFn(runCriticReview);
  const fDraftSpec = useServerFn(generatePrd);
  const fUpdate = useServerFn(updateOpportunity);
  // The lenient roadmap write, the same one the /plan drag board uses. NOT
  // `commitRoadmapItem`: that one enforces the H2 rule (a bucket commitment must
  // carry a declared outcome AND measure) and would throw on every press of a
  // lane here, where nothing asks for either.
  const fRoadmapMove = useServerFn(updateRoadmapItem);
  // The one-call entry: record a stated bet verbatim and red-team it in the same
  // round trip. See `NameABet`.
  const fWedge = useServerFn(runWedgeTeardown);
  const fDelete = useServerFn(deleteOpportunity);
  const fThemePrecedent = useServerFn(getThemePrecedent);
  const fProvenance = useServerFn(getProvenance);

  // Same keys as before, so the detail sheet's own writes and the Discover
  // surface keep sharing one cache.
  const opps = useQuery({ queryKey: ["opportunities"], queryFn: () => withTimeout(fOpps()) });
  /**
   * THE THEMES ARE READ IN THE SAME SCOPE THE BETS ARE, AND THEY WERE NOT.
   *
   * This query used to pass `{ productId: activeProductId }`, which makes
   * `listThemes` filter `project_id.eq.<product> OR project_id.is.null`. The
   * bets beside it come from `listOpportunities`, which has NO product filter
   * at all. So `themeById` was missing every theme belonging to another
   * product, and both of its readers -- the ranking's corroboration tie-break
   * and `activeSignals`, the "N signals in the record" line in the context
   * column -- resolved silently to 0 for those bets. An earlier version of this
   * note measured that as "9 theme-linked bets split across two products, so
   * roughly half were zeroed", and re-measuring it through the Lovable MCP on
   * 2026-08-06 makes it both too small and too kind: 83 bets carry a theme_id
   * that still resolves to a live theme, spread across 16 products, and 118 of
   * the 257 themes carry a non-null `project_id` while the scoped read admitted
   * only the picked product plus the nulls. For the largest single caller -- 15
   * theme-linked bets across 3 products -- 9, 10 or 11 of the 15 lost their
   * count, the figure depending entirely on which product the picker had
   * auto-selected. Switching the picker reordered the queue with nothing on
   * screen saying why, and the screen could print four things a customer
   * actually said and, one heading down, no count at all.
   *
   * Two lists disagreeing about scope is the defect; matching them is the fix.
   * The unscoped read is a strict SUPERSET of the scoped one, so no bet loses a
   * count it had, and the key is `"all-products"` rather than `activeProductId`
   * because `["themes", <product>]` is Discover's cache entry and the two
   * queries must not overwrite each other's answer.
   *
   * THE CEILING IS STILL THERE, BUT IT IS NO LONGER SILENT. `listThemes` caps
   * at 300, so past that ceiling the map has no entry for whichever themes fall
   * outside the window. WHICH ones changed under this note on 2026-08-06 and
   * the note did not: that read ordered by `frequency` descending, so the
   * ceiling cost the LEAST-corroborated themes; it orders by `created_at`
   * descending now, so it costs the OLDEST ones instead. For this map that is a
   * straight trade of one wrong count for another, quiet themes admitted and
   * long-lived ones dropped, and `listThemes`' own docblock says so from the
   * other side. Cite the SYMBOL rather than a line: the old citation here
   * (:445-449) went stale the moment that docblock was written.
   *
   * What changed later the same day is that the same read now returns an exact
   * `total`, so this surface can count the bets it is ranking blind instead of
   * describing the problem in a comment nobody reading the queue will see. Two
   * places say it: `rankedOnUnseenCluster` puts it in the headline, and the
   * context column names it under "What backs it" rather than rendering an
   * empty space, which on this screen reads as "nothing backs it". The ORDER is
   * deliberately unchanged, because there is no honest number to sort an
   * unknown by. Removing the ceiling is still the real fix and still lives one
   * file away; what is closed here is the surface lying about it.
   *
   * An earlier version of this note said "a workspace past 300 themes", and
   * that is narrower than the real trigger: `listThemes` carries no workspace
   * clause at all, so the 300 is applied to the caller's whole RLS-visible
   * theme set -- the union across every workspace they belong to, seeded ones
   * included. And dropping the product clause makes the ceiling MORE reachable,
   * not less: the scoped read filtered on `project_id` BEFORE the limit, so it
   * spent its 300 rows on one product. That is the price of the fix above and
   * it is worth paying, because a wrong count today beats a missing count at a
   * ceiling nobody is near. Re-measured on 2026-08-06: 257 themes in the entire
   * database, so no caller is within 43 rows of it. The durable fix is a
   * `theme_frequency` join on `listOpportunities` (same file, which already does
   * exactly this shape of two-hop JS join for `decided_by_agent_slug`), after
   * which this query and `themeById` both go away.
   */
  const themes = useQuery({
    queryKey: ["themes", "all-products"],
    queryFn: () => withTimeout(fThemes({ data: { productId: null } })),
  });
  /**
   * EVERYTHING THE PERSON HAS LEARNED, ANYWHERE. Deliberately unfiltered, and
   * it feeds only the two maps below, both of which are keyed by an id
   * (`opportunity_id`, `opportunity_theme_id`). `listOpportunities` is itself
   * unscoped -- the queue on this station shows every bet RLS admits,
   * including the seeded Explore workspace's -- so narrowing this read would
   * strip the rescore note and the outcome-support term off exactly the rows
   * that are still rendered. A cross-workspace learning that matches nothing
   * on screen is inert; one that matches is about a bet the reader is looking
   * at.
   */
  const learnings = useQuery({
    queryKey: ["learnings"],
    queryFn: () => withTimeout(fLearnings()),
  });
  /**
   * THE ONE READ THAT IS ALLOWED TO SAY "THIS WORKSPACE RE-RANKED ITSELF".
   *
   * `lastRescoreAt` used to be max(created_at) over the unfiltered read above,
   * and it drives the page subtitle -- the sentence that states the moat, on
   * the station that IS the moat. Two things were wrong with it at once. The
   * `learnings` RLS policy admits every workspace the caller belongs to and
   * every account is handed a seeded Explore workspace at signup, so the
   * timestamp was routinely lifted out of a workspace the reader was not
   * standing in: 70 of the 103 learnings whose workspace still exists live in
   * an `is_sample` workspace (a further 16 point at a workspace row that has
   * since been deleted, which an earlier version of this note folded into the
   * same count). And a learning that moved no score still set it, though only
   * 49 of 119 carry a `new_ice` at all. Queried per user, `max(created_at)
   * where not is_sample and new_ice is not null` was NULL for every user in
   * the database while the unfiltered max was non-null for at least eight of
   * them. Every one of those eight was being told their queue had been
   * re-ranked off a recorded outcome. None of them had recorded one.
   *
   * Both narrowings are applied SERVER-SIDE, before `order(created_at desc)
   * limit(50)`, so this returns the newest 50 OF THE FILTERED SET and its max
   * is the real max rather than the max of whatever survived a client filter.
   * `workspaceId: null` (no workspace picked yet) is the same as omitting it
   * server-side -- `if (data.workspaceId) q = q.eq("workspace_id", ...)` inside
   * `listLearnings`, src/lib/outcome.functions.ts, cited BY SYMBOL for the same
   * reason FocusNext.tsx cites `getFocusNext` that way: that file is under
   * concurrent edit and a bare line number here goes stale on the next commit.
   * This one already had, TWICE, inside a single day -- and the second time was
   * self-inflicted, which is the part worth carrying: the very commit that
   * wrote this note added lines ABOVE the statement it cites, and the
   * replacement number was copied across from the review rather than re-derived
   * against the file, so a note written to end citation drift shipped citation
   * drift. No line number is given here for that reason. That is exactly
   * why this must ALSO be `enabled`-gated: an ungated call with a null id would
   * fall back to the cross-workspace read this whole query exists to stop being
   * believed.
   *
   * A REFUSED READ RENDERS AS "NOTHING HAS RE-RANKED", AND THAT IS THE SAFE
   * DIRECTION, not an oversight. `lastRescoreAt` reads
   * `rescores.data?.learnings ?? []`, so a thrown read, a timeout (the
   * `withTimeout` wrapper rejects) and a genuinely empty workspace are
   * indistinguishable here and all three land on the subtitle branch that makes
   * no claim. The house rule this repo keeps -- a discarded error is never
   * evidence of absence -- bites when absence is used to ASSERT something; here
   * absence only withholds the assertion, so the failure mode is under-claiming
   * a re-rank that happened, never claiming one that did not. The same
   * reasoning is written out under "A REFUSED READ IS NOT AN EMPTY WORKSPACE"
   * in `getFocusNext` (src/lib/brain/insights.functions.ts), for the Today
   * card's calm gate. What is NOT covered: nothing on screen says the read
   * failed, so a reader whose queue really was re-ranked sees the fresh-workspace
   * sentence instead. Surfacing `rescores.error` in the subtitle would need a
   * fourth branch and a copy call nobody has made.
   *
   * WHAT THIS FILTER STILL DOES NOT SEPARATE: whether the workspace itself is a
   * seeded example. That is handled in the subtitle rather than here, because
   * the honest answer is a different sentence and not a smaller number of rows
   * -- see `inExampleWorkspace` at the PageHead below.
   */
  const rescores = useQuery({
    queryKey: ["learnings", "moved-score", activeWorkspaceId],
    queryFn: () =>
      withTimeout(fLearnings({ data: { workspaceId: activeWorkspaceId, movedScoreOnly: true } })),
    enabled: Boolean(activeWorkspaceId),
  });
  const briefAlignment = useQuery({
    queryKey: ["brief-alignment"],
    queryFn: () => withTimeout(fBriefAlignment()),
  });

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [showAll, setShowAll] = React.useState(false);
  /**
   * THE THREE CONTROLS A QUEUE IS NOT A QUEUE WITHOUT.
   *
   * This station had none of them: `const others = ranked`, unfiltered,
   * unsearchable, in one fixed order, capped at five with a "show all". That is
   * a demonstration of a queue rather than a queue -- a product lead with
   * thirty ranked bets could not answer "which ones has the Critic flagged" or
   * "where is the one about checkout" without reading every row.
   *
   * None of them is in the URL. A lens, a search and an order are ways of
   * LOOKING at the ranking, not places in the product, and putting them in the
   * address bar would make a shared link mean something different for the
   * person who receives it. Same reading Discover's merge filter took.
   */
  const [lens, setLens] = React.useState<Lens>("all");
  const [order, setOrder] = React.useState<Order>("score");
  const [q, setQ] = React.useState("");
  const [openId, setOpenId] = React.useState<string | null>(null);
  const [lineageId, setLineageId] = React.useState<string | null>(null);
  // A Set, not a scalar: any in-flight write on a bet keeps that bet's actions
  // disabled, and a second bet's write can never re-enable the first.
  const [busyIds, setBusyIds] = React.useState<Set<string>>(new Set());
  const setBusy = React.useCallback((id: string, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  const rows: OpportunityDetailRecord[] = React.useMemo(
    () => opps.data?.opportunities ?? [],
    [opps.data],
  );

  const themeById = React.useMemo(() => {
    const map = new Map<string, { frequency: number }>();
    for (const t of themes.data?.themes ?? []) map.set(t.id, { frequency: t.frequency });
    return map;
  }, [themes.data]);

  const latestLearningByOpp = React.useMemo(() => {
    const list = learnings.data?.learnings ?? [];
    const map = new Map<string, (typeof list)[number]>();
    for (const l of list) {
      if (!l.opportunity_id) continue;
      const prev = map.get(l.opportunity_id);
      if (!prev || new Date(l.created_at) > new Date(prev.created_at)) {
        map.set(l.opportunity_id, l);
      }
    }
    return map;
  }, [learnings.data]);

  /**
   * WHICH BETS THE RECORD ACTUALLY MOVED, AND BY HOW MUCH.
   *
   * THE IDEA, AND WHY NO SHIPPED PRODUCT HAS IT. Every ranked queue studied
   * renders a CURRENT value: today's score, today's order. That is the right
   * thing to show somebody seeing the queue for the first time and the wrong
   * thing to show somebody who saw it on Friday. A product lead opening this on
   * Tuesday does not need twelve rationales re-read; they need to know which
   * two rows changed their mind. So the queue can be ordered by MOVEMENT, and
   * every moved row carries its signed delta beside its score.
   *
   * IT IS REAL DATA OR IT IS NOTHING. `learnings` stores `prior_ice` and
   * `new_ice` on the outcome that caused a re-score, which is a genuine
   * previous value written by the loop rather than a diff computed at render
   * time. A learning with either endpoint missing, or a sub-0.1 drift that
   * rounds to no move at all, is not a movement and is dropped -- the same test
   * `rescoresOf` applies in moat-vis.ts, applied here through the same two
   * helpers so the arrow on the row and the sentence in the recess can never
   * disagree about whether something moved.
   *
   * WHAT IT ALSO BUYS, beyond the ordering: a re-score stops being a silent
   * mutation. It is the only element on this station that makes the compounding
   * claim in the page subtitle falsifiable, because a reader can point at the
   * row and the number that moved it.
   *
   * ON TODAY'S DATA THIS IS MOSTLY EMPTY, and that is reported rather than
   * hidden. The `rescores` query's own note counts it: of the learnings in the
   * database carrying a `new_ice`, effectively all sit in seeded workspaces. So
   * the "Recently moved" order is offered ONLY when at least one bet on screen
   * has genuinely moved -- see `movedCount` at the ordering control. An order
   * that silently equals the default is a control that lies about having done
   * something.
   */
  const movementByOpp = React.useMemo(() => {
    const map = new Map<string, { delta: number; at: string }>();
    for (const [id, l] of latestLearningByOpp) {
      const prior = iceNum(l.prior_ice);
      const next = iceNum(l.new_ice);
      if (prior === null || next === null) continue;
      const delta = round1(round1(next) - round1(prior));
      if (delta === 0) continue;
      map.set(id, { delta, at: l.created_at });
    }
    return map;
  }, [latestLearningByOpp]);

  /** The newest outcome recorded IN THIS WORKSPACE that actually moved a
   *  score. Null is the honest answer for a workspace that has settled nothing
   *  yet, and the subtitle has a true sentence for that case. */
  const lastRescoreAt = React.useMemo(() => {
    const list = rescores.data?.learnings ?? [];
    if (list.length === 0) return null;
    return list.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b))
      .created_at;
  }, [rescores.data]);

  // The reinforcement seam: what actually happened to past bets on the same
  // evidence moves the order of new ones.
  const outcomeSupportByTheme = React.useMemo(() => {
    const counts = new Map<string, { validated: number; missed: number }>();
    for (const l of learnings.data?.learnings ?? []) {
      const themeId = l.opportunity_theme_id;
      if (!themeId) continue;
      if (l.verdict !== "validated" && l.verdict !== "missed") continue;
      const c = counts.get(themeId) ?? { validated: 0, missed: 0 };
      if (l.verdict === "validated") c.validated += 1;
      else c.missed += 1;
      counts.set(themeId, c);
    }
    const map = new Map<string, number>();
    for (const [themeId, c] of counts) {
      map.set(themeId, outcomeSupportFromCounts(c.validated, c.missed));
    }
    return map;
  }, [learnings.data]);

  const ranked = React.useMemo(
    () =>
      rankOpportunities(
        rows,
        (o) => (o.theme_id ? (themeById.get(o.theme_id)?.frequency ?? 0) : 0),
        (o) => (o.theme_id ? (outcomeSupportByTheme.get(o.theme_id) ?? 0) : 0),
        (o) =>
          alignmentForOpportunity(o.linked_brief_item_id, briefAlignment.data?.alignment ?? {}),
      ),
    [rows, themeById, outcomeSupportByTheme, briefAlignment.data],
  );

  // The call in front of you: the strongest bet, unless you picked another one
  // out of the queue below.
  //
  // AN EXAMPLE NEVER OPENS THE STATION OVER REAL WORK. `ranked[0]` alone put
  // whatever scored highest in the Gate, and the seeded bets score well -- they
  // were written to look like good bets. So a user with their own opportunities
  // could arrive at Decide and be asked to rule on fiction, with their own work
  // sitting further down a queue they had no reason to scroll.
  //
  // NOT a filter. On a fresh workspace the examples are all there is, and an
  // empty station teaches nothing; the Gate labels them in its first line and
  // that is what the label is for. This only settles what goes FIRST, and only
  // when the person has not chosen for themselves.
  //
  // AND A BET THIS SESSION HAS ALREADY SETTLED NEVER OPENS THE GATE AGAIN.
  // Nothing removes a settled bet from the ranking (`const others = ranked`),
  // and the comparator cannot: ICE is its FIRST term and dropping a bet does not
  // change ICE, so the highest-scoring bet stayed at rank #1 after you killed
  // it. Press `d`, read the receipt, and the identical Gate was in front of you
  // asking "Keep it / Challenge it / Drop it" about the bet you had just
  // dropped. The Receipt primitive's own docblock describes moving on as the
  // norm across this product -- "the queue dropped it, the Gate's question
  // silently became the next call" -- and Decide was the station behind.
  //
  // A SKIP LIST, NOT A FILTER, for the same reason the example rule is one: the
  // settled bet stays in the ranking where the person can see what they did and
  // press "Decide it" to bring it back, and once EVERY bet has been settled the
  // last two fallbacks put the queue back exactly as it was rather than emptying
  // the station.
  //
  // IT USED TO LIVE ONLY FOR AS LONG AS THIS MOUNT DOES, and that was the whole
  // hole. Keeping a bet NAVIGATES to the spec it just wrote, which unmounts this
  // route, so the commonest path through the station -- press `a`, read the
  // spec, come back -- emptied the set and put the kept bet back at #1 with its
  // primary button still reading "Keep it". The comment that stood here called
  // that "the honest scope for a fact nothing is written to the record", and the
  // premise was wrong: a keep writes `roadmap_bucket`, a drop writes
  // `status: "dropped"`, and both survive a navigation. `answeredOnTheRecord`
  // reads them, so the durable half of the answer now comes from the record and
  // the set below only has to cover the gap between a press and its refetch.
  //
  // THE REF IS THE SOURCE OF TRUTH AND THE STATE IS ITS SHADOW. Two settles
  // inside one render pass would both read a `settledIds` that React has not
  // committed yet, and the second would forget the first; a ref is read and
  // written in the same tick. The state exists only so the memo above re-runs,
  // and it is always handed the very set the ref now holds.
  const settledRef = React.useRef<Set<string>>(new Set());
  const [settledIds, setSettledIds] = React.useState<ReadonlySet<string>>(() => settledRef.current);
  // SIX FALLBACKS, IN STRENGTH ORDER, and every one of them is a preference
  // rather than a filter: the station must never empty itself, so the last two
  // put the whole queue back exactly as it was.
  const active = React.useMemo(
    () =>
      ranked.find((r) => r.opp.id === selectedId) ??
      ranked.find(
        (r) => !settledIds.has(r.opp.id) && !answeredOnTheRecord(r.opp) && !r.opp.is_sample,
      ) ??
      ranked.find((r) => !settledIds.has(r.opp.id) && !answeredOnTheRecord(r.opp)) ??
      ranked.find((r) => !settledIds.has(r.opp.id) && !r.opp.is_sample) ??
      ranked.find((r) => !settledIds.has(r.opp.id)) ??
      ranked.find((r) => !r.opp.is_sample) ??
      ranked[0] ??
      null,
    [ranked, selectedId, settledIds],
  );
  // THE SELECTED BET STAYS IN THE QUEUE (founder, 2026-08-01). Filtering it out
  // meant the Gate changed under you with nothing on screen connecting it to
  // the row you pressed, and the queue silently renumbered around the gap.
  // `Row` already carries `focused`, so keeping it costs one prop.
  const others = ranked;

  /**
   * WHICH BETS ARE ON SCREEN, AFTER THE LENS AND THE SEARCH.
   *
   * `ranked` is untouched, on purpose. It is what the Gate, the skip list and
   * `settleAndAdvance` all read, and a lens is a way of LOOKING at the queue --
   * if narrowing the list also moved the question, a person filtering to
   * "Flagged" would find the Gate had silently swapped the bet under it. So the
   * filter applies to the LIST and to nothing else, and the rank on every row
   * stays the rank the comparator gave it rather than its position in the
   * filtered view.
   */
  const lensed = React.useMemo(() => {
    const needle = q.trim().toLowerCase();
    return others.filter((r) => {
      const o = r.opp;
      if (needle) {
        const hay = `${o.title ?? ""} ${o.problem ?? ""}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      if (lens === "all") return true;
      const spoke = criticGaveTheVerdict(o.critic_review);
      // "Awaiting review" is about the CRITIC, not about the verdict word. A
      // bet in the Now lane reads SHIP through `verdictFor`'s fall-through with
      // nobody having opened it, and calling that reviewed is the exact
      // misattribution `verdictSentence` exists to stop.
      if (lens === "waiting") return !spoke;
      if (!spoke) return false;
      const v = verdictFor(o);
      if (lens === "cleared") return v === "SHIP";
      return v === "REVISE" || v === "KILL";
    });
  }, [others, lens, q]);

  /** How many of the bets on screen the record has actually moved. The
   *  "Recently moved" order is offered only above zero: an order that silently
   *  equals the default is a control that claims to have done something. */
  const movedCount = React.useMemo(
    () => lensed.filter((r) => movementByOpp.has(r.opp.id)).length,
    [lensed, movementByOpp],
  );

  /**
   * MOVEMENT FIRST, THEN THE COMPARATOR.
   *
   * A stable partition rather than a sort with a fabricated key: rows the
   * record moved come first, newest movement first, and everything else keeps
   * the deterministic order it already had. Nothing invents a movement for a
   * bet that has none, and nothing reorders inside the unmoved group, so
   * switching back to "Highest score" is exactly the list you left.
   */
  const ordered = React.useMemo(() => {
    if (order === "score" || movedCount === 0) return lensed;
    const moved = lensed.filter((r) => movementByOpp.has(r.opp.id));
    const still = lensed.filter((r) => !movementByOpp.has(r.opp.id));
    moved.sort(
      (a, b) =>
        new Date(movementByOpp.get(b.opp.id)!.at).getTime() -
        new Date(movementByOpp.get(a.opp.id)!.at).getTime(),
    );
    return [...moved, ...still];
  }, [lensed, order, movedCount, movementByOpp]);

  const visibleOthers = showAll ? ordered : ordered.slice(0, VISIBLE_OTHERS);

  /**
   * BULK TRIAGE, over the order actually on screen.
   *
   * The ids are `ordered`'s, so a shift-range means "every row between these
   * two AS I AM LOOKING AT THEM" rather than as the comparator happened to rank
   * them, and `useSelection` intersects with them on every read -- so narrowing
   * the lens with rows ticked drops the ones that left rather than acting on
   * something the person can no longer see.
   */
  const orderedIds = React.useMemo(() => ordered.map((r) => r.opp.id), [ordered]);
  const picked = useSelection(orderedIds);

  /**
   * WHAT THE WHOLE QUEUE LOOKS LIKE, counted off the rows already in hand.
   *
   * Counted over `others` rather than over `ordered`, and that is the point: a
   * distribution that moved when the lens moved would be a description of the
   * filter rather than of the queue, and the reason this header exists is that
   * a ranked list with no distribution over it invites a reader to trust rank 1
   * without asking what rank 12 looks like.
   */
  const spread = React.useMemo(() => {
    let cleared = 0;
    let flagged = 0;
    let waiting = 0;
    let moved = 0;
    for (const r of others) {
      // NOT `movementByOpp.size`. The learnings read is deliberately unscoped
      // (see its own note), so the map holds outcomes for bets that are not in
      // this queue at all, and a header counting them would claim a re-rank of
      // rows nobody can see.
      if (movementByOpp.has(r.opp.id)) moved += 1;
      if (!criticGaveTheVerdict(r.opp.critic_review)) {
        waiting += 1;
        continue;
      }
      if (verdictFor(r.opp) === "SHIP") cleared += 1;
      else flagged += 1;
    }
    return { cleared, flagged, waiting, moved };
  }, [others, movementByOpp]);

  // The account's own record, cited at decision time, fetched only for what is
  // actually on screen and only once there is enough history to cite honestly.
  const visibleIds = React.useMemo(() => {
    const ids = [active?.opp.id, ...visibleOthers.map((r) => r.opp.id)].filter((id): id is string =>
      Boolean(id),
    );
    return ids.slice(0, MAX_PRECEDENT_IDS);
  }, [active, visibleOthers]);
  /**
   * "Enough history to cite honestly" IS A FACT ABOUT THIS WORKSPACE, and this
   * counted every workspace the caller belongs to. On a real-but-empty
   * workspace the count was made up almost entirely of the seeded Explore
   * rows, so the citation query fired -- and paid for an embedding per visible
   * bet -- on a record that holds nothing of the reader's own.
   *
   * Split client-side rather than with a second round trip: `listLearnings`
   * now returns `workspace_id` on every row unconditionally, exactly so a
   * caller can attribute rows without re-reading. THE ONE CASE THIS GETS
   * WRONG, stated rather than hidden: the read above is the newest 50 across
   * all workspaces, so a caller whose seeded rows outnumber that window would
   * count 0 of their own and the citations would stay unfetched. It
   * under-claims, never over-claims, and it is unreachable on today's data
   * (119 learnings in the entire database, re-counted 2026-08-06). If it ever
   * bites, this wants its own `fLearnings({ data: { workspaceId } })` read.
   *
   * A REFUSED `learnings` READ ALSO LANDS HERE AS ZERO, and that is deliberate
   * rather than an unchecked error. `learnings.data?.learnings ?? []` makes a
   * thrown read, a timeout and a genuinely empty workspace indistinguishable,
   * so all three decline to spend an embedding per visible bet. The repo's rule
   * -- a discarded error is never evidence of absence -- bites when absence is
   * used to ASSERT something; here absence only withholds. The same read backs
   * `latestLearningByOpp`, so on a failed read `activeRescore` is null too and
   * the record recess below goes silent rather than making a claim off nothing.
   */
  const hasEnoughOutcomes =
    activeWorkspaceId !== null &&
    (learnings.data?.learnings ?? []).filter((l) => l.workspace_id === activeWorkspaceId).length >=
      3;
  const citations = useQuery({
    queryKey: ["opportunity-precedent-citations", visibleIds],
    queryFn: () => fCitations({ data: { ids: visibleIds } }),
    enabled: hasEnoughOutcomes && visibleIds.length > 0,
  });

  // The root signals this bet rests on, walked up the lineage graph. Keyed on
  // the opportunity, because that is what the walk starts from; an earlier
  // draft keyed a product-wide read on the theme id, so two bets on one product
  // held separate cache entries for identical data.
  const provenance = useQuery({
    queryKey: ["provenance", "opportunity", active?.opp?.id],
    queryFn: () => fProvenance({ data: { kind: "opportunity" as const, id: active!.opp!.id } }),
    enabled: Boolean(active?.opp?.id),
    staleTime: 5 * 60_000,
  });

  // Novelty and prior theme resemblance for the active opportunity's theme.
  const themePrecedent = useQuery({
    queryKey: ["theme-precedent", active?.opp?.theme_id],
    queryFn: () => fThemePrecedent({ data: { theme_id: active!.opp!.theme_id } }),
    enabled: !!active?.opp?.theme_id,
  });

  /** The distinct sources behind THIS bet, from its own linked signals. */
  const provenanceSources = React.useMemo(
    () => [
      ...new Set(
        (provenance.data?.source_signals ?? [])
          .map((s) => s.source)
          .filter((v): v is string => Boolean(v)),
      ),
    ],
    [provenance.data],
  );

  /** What the last judgment on this surface caused (anti-slop.md 5). */
  const [receipt, setReceipt] = React.useState<{
    verb: string;
    consequence: React.ReactNode;
    failed?: boolean;
  } | null>(null);

  const challengerName = agentDisplayName(CHALLENGER);

  /**
   * THE RANKING AND THE BET IN FOCUS, READ FROM INSIDE A MUTATION CALLBACK.
   *
   * A settle resolves one round trip after the press, and the handler has to
   * answer two questions about the state as it is THEN: which bet the Gate
   * should move to, and whether the bet that was acted on is the one under the
   * question. A ref rather than the closed-over values, because "the options
   * object is refreshed on every render" is a property of react-query rather
   * than of this file, and a stale ranking here would advance the Gate to a bet
   * that is no longer in the queue.
   */
  const latest = React.useRef({ ranked, activeId: active?.opp.id ?? null });
  React.useEffect(() => {
    latest.current = { ranked, activeId: active?.opp.id ?? null };
  });

  /**
   * MOVE THE GATE ON, AND SAY WHERE IT WENT.
   *
   * Called by every path that SETTLES a bet: keep, drop, delete. Not by the lane
   * control, because a placement is not a settle -- it answers when, and the
   * question stays the same one. Not by a challenge either: a teardown is
   * evidence FOR the call, and moving the Gate off the bet the moment its
   * evidence arrives would be the opposite of the point.
   *
   * `selectedId` is cleared rather than pointed at the next bet, so the default
   * rule in `active` picks it -- one place decides what the Gate shows, and the
   * skip list, the example rule and the fallbacks all keep applying. Pointing
   * `selectedId` at a computed id would be a second, quieter copy of that rule.
   *
   * Returns the title of the bet the Gate lands on, or null when this was the
   * last unsettled one, so the receipt can name it instead of leaving the person
   * to notice the question changed underneath them.
   */
  const settleAndAdvance = React.useCallback((id: string): string | null => {
    const seen = new Set(settledRef.current);
    seen.add(id);
    settledRef.current = seen;
    setSettledIds(seen);
    setSelectedId(null);
    const list = latest.current.ranked;
    // The same strength order `active` uses, and it has to be: if the Gate
    // advanced to a bet the record already says was answered, the reader would
    // be asked a question they had settled last week the moment they pressed a
    // key. Kept as a copy rather than shared because this one reads the ref's
    // set inside a callback that must not close over render state.
    const next =
      list.find((r) => !seen.has(r.opp.id) && !answeredOnTheRecord(r.opp) && !r.opp.is_sample) ??
      list.find((r) => !seen.has(r.opp.id) && !answeredOnTheRecord(r.opp)) ??
      list.find((r) => !seen.has(r.opp.id) && !r.opp.is_sample) ??
      list.find((r) => !seen.has(r.opp.id)) ??
      null;
    return next?.opp.title ?? null;
  }, []);

  /** " Next: <title>." for a receipt, or the empty string when the queue is
   *  settled out. Written once because three receipts end the same way. */
  const nextLine = (title: string | null) =>
    title ? ` Next: ${title}.` : " That was the last unsettled bet in the queue.";

  const challenge = useMutation({
    mutationFn: (id: string) =>
      fCritic({ data: { target_kind: "opportunity" as const, target_id: id } }),
    onMutate: (id) => setBusy(id, true),
    /**
     * IT NEVER LANDED ON TODAY, AND THIS LINE SENT PEOPLE THERE. Verbatim, what
     * stood here: "<Critic> is red-teaming it. The teardown lands on Today,
     * receipts attached." `runCritic` makes exactly one write and it is to the
     * bet's own row (`critic_review`, src/lib/ai/critic.server.ts). Nothing on
     * Today reads an opportunity's `critic_review` -- the only critic content
     * that surface renders is the onboarding one-shot out of sessionStorage, and
     * today.tsx says so in as many words: "Today cannot see that write". So the
     * copy walked the reader off the one surface that had the answer.
     *
     * IT LANDS HERE. This handler invalidates ["opportunities"], and
     * `CriticBadge` is mounted in this page's context column on the opportunity
     * branch, where it opens the risks, the kill criteria and the missing
     * evidence in place.
     *
     * A RECEIPT, NOT A TOAST, and past tense. `onSuccess` fires after the run has
     * finished, so "is red-teaming it" described a thing that had already
     * happened; and a toast confirms a click while a receipt renders what the
     * click caused, which is the difference this product is built on. It also
     * stays on screen next to the teardown it is pointing at.
     */
    onSuccess: (_r, id) => {
      const title = rows.find((o) => o.id === id)?.title ?? "The bet";
      const underTheGate = id === latest.current.activeId;
      setReceipt({
        verb: "You challenged it",
        consequence: underTheGate
          ? `${challengerName} tore ${title} down. Its risks, kill criteria and missing evidence are on the record, open in the column beside the question.`
          : `${challengerName} tore ${title} down. Its risks, kill criteria and missing evidence are on the record. Press "Decide it" on its row to open them beside the question.`,
      });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  const draftSpec = useMutation({
    mutationFn: (id: string) => fDraftSpec({ data: { opportunity_id: id } }),
    onMutate: (id) => {
      setBusy(id, true);
      toast("Drafting the spec. It lands in Plan when it is ready.");
    },
    onSuccess: (r, id) => {
      /**
       * THE KEEP LEFT NO MARK ON THE STATION, AND THIS HANDLER IS HALF OF WHY.
       * It invalidated nothing at all, so the queue behind it kept serving the
       * pre-keep row: a person who kept a bet and came back found it still
       * ranked #1, its pill reading Backlog and its primary button still reading
       * "Keep it". `placeKeptBetInNext` writes `status` as well as
       * `roadmap_bucket` now (src/lib/discovery.functions.ts), and both keys have
       * to be dropped for either column to show. ["roadmap"] is the board on
       * /plan, which reads the bucket this keep just wrote.
       */
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      void qc.invalidateQueries({ queryKey: ["roadmap"] });
      settleAndAdvance(id);
      /**
       * AND THE OTHER HALF: THE HANDLER REPORTS AND THIS READ ONLY `r.prd.id`.
       * `generatePrd` returns `{ prd, existing, placement }`, and `placement`
       * carries a written sentence for the case where the lane write was
       * REFUSED: "The lane did not move, so this bet is not on the Plan board
       * yet. The spec was written and is safe." The Gate one screen up promises
       * the opposite ("Keeping it drafts the spec and moves it into Plan"), so a
       * refused lane navigated the person to a spec, told them the roadmap had
       * moved, and left the board empty.
       *
       * THIS IS NOT THE ONLY CALLER THAT PASSES AN `opportunity_id`, which an
       * earlier draft of this note claimed. /plan's coverage door passes one too
       * (`draftSpec` in _authenticated.plan.index.tsx) and it discards
       * `placement` exactly as this handler used to. It is not the same defect
       * there and does not need the same fix: that door is only ever offered for
       * a bet already sitting in Now, so `placeKeptBetInNext` returns before it
       * writes anything and there is no lane for it to have refused. /decide is
       * the only caller that can reach a bet with no lane, so it is the only one
       * whose promise the report can contradict. DiscoverSurface passes a
       * `brief` and no bet at all, so its `placement` is null.
       *
       * A TOAST RATHER THAN THE RECEIPT, and it is the one place on this surface
       * where that is the right instrument: this handler navigates away, so a
       * Receipt set here unmounts in the same tick and is never read. The toast
       * survives the route change and arrives on the spec, which is where the
       * person now is.
       */
      const note = r.placement && !r.placement.moved ? r.placement.note : null;
      if (note) toast(note);
      else if (r.existing) {
        toast("This bet already had a spec. This is the one the first press wrote, not a second.");
      }
      void navigate({
        to: "/plan/spec/$id",
        params: { id: r.prd.id },
        search: { tab: "contract" },
      });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  /** Claimed by each lane press; only the holder of the newest number writes the
   *  roadmap bucket. See the comment inside `setStatus.mutationFn`. */
  const laneSeq = React.useRef(0);

  const setStatus = useMutation({
    // TWO WRITES, because the placement lives in two columns and /plan reads the
    // one this surface was not writing (see `laneBucketFor`). The lifecycle goes
    // first: it is what this station has always meant by a lane, it carries the
    // stage event and the judgment record inside `updateOpportunity`, and the
    // roadmap write is the one that can be skipped for a non-placement.
    mutationFn: async ({ id, status }: { id: string; status: OpportunityStatus }) => {
      /**
       * ONLY THE NEWEST PRESS WRITES THE LANE, OR THE FIX RE-CREATES ITS OWN BUG.
       *
       * `Choices.onKeyDown` (primitives.tsx) calls `onPick` on EVERY arrow, and
       * this control is deliberately not disabled in flight -- a radio group that
       * disables itself mid-decision throws focus to the body and loses the arrow
       * keys, which is the worse failure. That was harmless while this was one
       * column write. It is not harmless now that it is two: holding ArrowRight
       * fires several overlapping pairs, and if press 3's status lands after
       * press 4's bucket, `status` and `roadmap_bucket` end up naming different
       * lanes -- the exact divergence between /decide and /plan this change
       * exists to close.
       *
       * A sequence token fixes it without taking the keyboard away. Every press
       * claims the next number; after its status write lands, a press that is no
       * longer the newest declines to touch the lane and leaves it to the one
       * that is. The newest press always writes BOTH, in order, so the two
       * columns converge on it.
       */
      const seq = ++laneSeq.current;
      const result = await fUpdate({ data: { id, status } });
      const bucket = laneBucketFor(status);
      if (bucket !== undefined && seq === laneSeq.current) {
        try {
          await fRoadmapMove({ data: { id, bucket } });
        } catch (e) {
          const err: LaneWriteError = new Error((e as Error).message);
          err.laneOnly = true;
          throw err;
        }
      }
      return result;
    },
    onMutate: ({ id }) => setBusy(id, true),
    onSuccess: (r, { id, status }) => {
      const title = rows.find((o) => o.id === id)?.title ?? "The bet";
      const bucket = laneBucketFor(status);
      // A DROP IS A SETTLE AND A PLACEMENT IS NOT. Dropping answers the Gate's
      // question, so the Gate moves on; picking a lane answers WHEN, and the
      // question it was asked under stays the same one.
      const nextTitle = status === "dropped" ? settleAndAdvance(id) : null;
      /**
       * WHETHER THE CALL ACTUALLY REACHED THE RECORD, ASKED RATHER THAN ASSUMED.
       *
       * "and so does the call" was asserted on every drop and nothing on either
       * side had checked. `recordJudgment` returns on failure and logs, and
       * `updateOpportunity` used to hand the caller nothing about it. That is not
       * a hypothetical: the insert was refused by `decisions_source_kind_check`
       * for the entire life of the product, and this receipt said "and so does
       * the call" on every single press. The constraint is widened now, so the
       * sentence is usually true, which is exactly what makes an unchecked
       * assertion worth closing rather than trusting.
       *
       * The settle is NEVER blocked on it, per the existing contract: the
       * person's judgment is the fact and the record of it is a consequence, so
       * a refusal changes what the receipt SAYS and nothing else.
       */
      const decisionId = r.judgment && r.judgment.recorded ? r.judgment.decisionId : null;
      setReceipt({
        verb: status === "dropped" ? "You dropped it" : "You placed it",
        consequence:
          // It does NOT leave the queue, which is what this line used to claim:
          // nothing filters a dropped bet out of the ranking, so the old wording
          // was contradicted by the list directly underneath it. The row now
          // carries its lane, so a dropped bet reads as dropped and can be put
          // back with one press.
          //
          // A placement now names the board it reached, because it reaches one:
          // the old line stopped at "sits in Now" and the person who then opened
          // Plan found that sentence contradicted by an empty lane.
          status === "dropped" ? (
            <>
              {/* "DECISION", NOT "CALL", and the whole station moved with it.
                  Measured over 5.72M words of operator conversation: "decision"
                  runs at 562.8 per million and is the noun operators actually
                  reach for; /today already says it. This station was the last
                  one still saying "call", which made one product speak two
                  languages about one act -- and the record it writes to is
                  literally the decision log, so the surface was using a
                  different word from the table it fills. */}
              {decisionId
                ? `${title} is dropped. Its evidence stays on the record, and so does the decision.`
                : `${title} is dropped and its evidence stays on the record. The reason did not reach the decision log, so there is nothing to open: the drop itself stands.`}
              {nextLine(nextTitle)}
              {/* THE STATION'S JOB IS STATED AS "with a reason that lands on the
                  record", and until this door there was no way to go and see the
                  reason it wrote. `/brain?tab=decisions&decision=<id>` is a route
                  the brain surface's own `validateSearch` already accepts and
                  renders as `DecisionDetail`. */}
              {decisionId ? (
                <>
                  {" "}
                  <Door
                    title="Opens the decision this drop wrote, on the brain"
                    onClick={() =>
                      void navigate({
                        to: "/brain",
                        search: { tab: "decisions", decision: decisionId },
                      })
                    }
                  >
                    Read the decision
                  </Door>
                </>
              ) : null}
            </>
          ) : bucket === undefined ? (
            `${title} sits in ${STATUS_META[status].label}.`
          ) : bucket === null ? (
            // "holding no lane on the board" was too soft: `RoadmapColumns`
            // draws Now, Next and Later and nothing else, so a bucket-null
            // bet is not lane-less on that board, it is absent from it. A
            // reader who opened Plan hunting for a Backlog column found
            // neither the column nor the bet.
            `${title} sits in Backlog, which the board in Plan does not draw: it shows Now, Next and Later only.`
          ) : (
            `${title} sits in ${STATUS_META[status].label}, and it is in that lane on the board in Plan.`
          ),
      });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      // The board on /plan reads its own key off `getRoadmap`; without this it
      // keeps serving the lane the bet was in before this press until something
      // else refetches it.
      void qc.invalidateQueries({ queryKey: ["roadmap"] });
    },
    onError: (e: Error, { id, status }) => {
      const title = rows.find((o) => o.id === id)?.title ?? "The bet";
      setReceipt(
        (e as LaneWriteError).laneOnly
          ? {
              verb: "Only half of it moved",
              consequence: `${title} reads as ${STATUS_META[status].label} here, and the board in Plan did not get the lane: ${e.message}`,
              failed: true,
            }
          : { verb: "It did not move", consequence: e.message, failed: true },
      );
      // The lifecycle write landed in the lane-only case, so the queue is stale
      // whichever half failed.
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      // AND SO IS THE BOARD, in that same lane-only case. `getRoadmap` carries
      // `opportunities.status` straight through into `RoadmapItem.status`, and
      // /plan's headline counts committed-but-unplaced bets off that field. The
      // status write DID land here, so leaving ["roadmap"] alone means the
      // failure receipt on this surface and the board one click away report
      // different placements until something else refetches. Fired on both
      // branches: a refetch that finds nothing changed costs one read, and
      // splitting it by `laneOnly` would make this a second place that decides
      // which half landed.
      void qc.invalidateQueries({ queryKey: ["roadmap"] });
    },
    onSettled: (_d, _e, { id }) => setBusy(id, false),
  });

  const del = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onMutate: (id) => setBusy(id, true),
    onSuccess: (_r, id) => {
      const title = rows.find((o) => o.id === id)?.title ?? "The bet";
      // A delete is a settle too: the row is gone the moment the refetch lands,
      // and until it does the ranking still holds it. Advancing here means the
      // Gate never spends a frame asking about a bet that no longer exists.
      const nextTitle = settleAndAdvance(id);
      setReceipt({
        verb: "You deleted it",
        consequence: `${title} is gone from the queue. The signals behind it are untouched.${nextLine(nextTitle)}`,
      });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (e: Error) =>
      setReceipt({ verb: "It was not deleted", consequence: e.message, failed: true }),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  /**
   * A BET NAMED HERE, NOT FETCHED FROM DISCOVER. See `NameABet` above for why
   * this door exists at all.
   *
   * It lands UNDER THE GATE rather than in the queue: the person just said what
   * the bet is, so the call is the next thing, and `setSelectedId` is the one
   * control this surface already has for choosing what the Gate asks about.
   */
  const nameBet = useMutation({
    mutationFn: (idea: string) => fWedge({ data: { idea } }),
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      setSelectedId(r.opportunity.id);
      const verdict = r.review?.verdict ?? null;
      setReceipt({
        verb: "You named a bet",
        // NEUTRAL, NOT UNSCORED, and the difference matters on a station that
        // orders by ICE: `runWedgeTeardown` writes 5/5/5 because nobody has
        // scored it, so the bet enters the ranking mid-table rather than at the
        // top, and the ICE editor beside the Gate is where that gets settled.
        consequence: verdict
          ? `${r.opportunity.title} is on the record, scored neutrally at 5/5/5, and ${challengerName} says ${verdict}. It is the question above, with the teardown in the column beside it.`
          : `${r.opportunity.title} is on the record, scored neutrally at 5/5/5. ${challengerName} could not be reached, so it carries no teardown: challenge it when you want one.`,
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const activeOpp = active?.opp ?? null;
  const busy = activeOpp ? busyIds.has(activeOpp.id) : false;

  /**
   * DROPPING A BET THAT IS ALREADY DROPPED WRITES A SECOND REJECTION.
   *
   * `updateOpportunity` records a judgment for every status it is handed and
   * `judgmentFor` has no no-op guard, so pressing `d` twice filed two rejections
   * for one call. Reachable in one press before the Gate learned to move on, and
   * still reachable now by pressing "Decide it" on a dropped row.
   *
   * IT REFUSES WITH A RECEIPT RATHER THAN GOING QUIET OR GOING DARK. A disabled
   * "Drop it" would take an affordance away and a silent no-op teaches the
   * person their keypress does nothing; this says what is already true and where
   * the way back is.
   */
  const dropBet = React.useCallback(
    (opp: OpportunityDetailRecord) => {
      if (opp.status === "dropped") {
        setReceipt({
          verb: "It was already dropped",
          consequence: `${opp.title} was dropped before this press, so nothing was written twice. Picking a lane below brings it back into the ranking.`,
        });
        return;
      }
      setStatus.mutate({ id: opp.id, status: "dropped" });
    },
    [setStatus],
  );

  /**
   * THE FRICTION WAS INVERTED, AND THIS IS THE SIDE THAT WAS WRONG.
   *
   * Delete asked "Delete this bet?" behind a confirm and cost one row. "Keep
   * it" -- one press of `a`, no confirm, no second thought -- ran `generatePrd`,
   * which is THREE model calls in sequence: the title, the spec body, then the
   * outcome contract. The cheap reversible act was guarded and the expensive
   * one was not, on the surface whose own gate line already admits what it
   * spends ("spec, then the outcome contract").
   *
   * It is also the act that most often ran by accident: `a` is a bare letter,
   * this station opens with a bet already under the Gate, and until the skip
   * list learned to read the record a person who came back from the spec found
   * the same bet still asking.
   *
   * NOT `destructive`. Keeping a bet is not a deletion and dressing it in the
   * red confirm would spend a signal reserved for irreversible loss. The body
   * carries the cost, in the units that are actually spent, and the confirm
   * label is the verb rather than "OK": a person must be able to answer this
   * dialog by reading only the button.
   *
   * THE KEYBOARD IS SAFE ACROSS IT. `useConfirm` renders a Radix alert dialog,
   * which `isModalOpen()` recognises through `[role="alertdialog"]`, so the
   * gate keys stand down for as long as the question is on screen -- the same
   * property `askDelete` leans on, and the one the confirm-guard test pins.
   */
  const keepBet = React.useCallback(
    async (opp: OpportunityDetailRecord) => {
      const ok = await confirm({
        title: "Keep this bet?",
        body: `Keeping "${opp.title}" writes its spec, its body and its outcome contract (three model runs) and moves it into the Next lane on the Plan board. Dropping it or challenging it costs a fraction of that, so this is the expensive answer.`,
        confirmLabel: "Keep it and draft the spec",
      });
      if (ok) draftSpec.mutate(opp.id);
    },
    [confirm, draftSpec],
  );

  /**
   * DROPPING A BATCH, WHICH IS THE ONE VERB THAT MAY BE BULK HERE.
   *
   * A Head of Product arriving to thirty ranked bets, most of them noise from a
   * connector sweep, had exactly one path: thirty presses. `useSelection` and
   * `SelectionBar` were built for this and this station had no caller.
   *
   * KEEP IS NOT OFFERED IN BULK AND NEVER WILL BE. It is three model calls per
   * bet; the paragraph above `keepBet` is about making ONE of those cost more
   * than a click, and a bulk version would make twenty of them cost less. The
   * same reasoning bars a bulk challenge, which is one Critic run each.
   * Dropping is a single column write, it is reversible from the lane control
   * on the row, and it is what a queue actually needs to be cleared.
   *
   * IT STILL ASKS. Twenty rejections filed against the decision log in one
   * press is not the same act as one, and the confirm names the number.
   *
   * `allSettled`, because a refusal on one bet must not throw away the other
   * nineteen, and the receipt reports the count that landed rather than the
   * verb that was attempted.
   */
  const dropMany = useMutation({
    mutationFn: async (ids: string[]) => {
      const results = await Promise.allSettled(
        ids.map((id) => fUpdate({ data: { id, status: "dropped" as OpportunityStatus } })),
      );
      const done = results.filter((r) => r.status === "fulfilled").length;
      const refused = results.find((r) => r.status === "rejected");
      return {
        done,
        failed: ids.length - done,
        why:
          refused && refused.status === "rejected"
            ? ((refused.reason as Error)?.message ?? "The record refused the write.")
            : null,
      };
    },
    onSuccess: (r, ids) => {
      for (const id of ids) settleAndAdvance(id);
      picked.clear();
      setReceipt({
        verb: r.failed === 0 ? "You dropped them" : "Most of them were dropped",
        consequence:
          r.failed === 0
            ? `${r.done} bet${r.done === 1 ? "" : "s"} dropped. Their evidence stays on the record and so do the decisions. Picking a lane on any of those rows brings it back into the ranking.`
            : `${r.done} of ${ids.length} were dropped. ${r.failed} were not: ${r.why} Those are still in the ranking below.`,
        failed: r.failed > 0,
      });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
      void qc.invalidateQueries({ queryKey: ["roadmap"] });
    },
    onError: (e: Error) =>
      setReceipt({ verb: "None of them moved", consequence: e.message, failed: true }),
  });

  const askDropMany = React.useCallback(
    async (ids: string[]) => {
      const ok = await confirm({
        title: `Drop ${ids.length} bet${ids.length === 1 ? "" : "s"}?`,
        body: `Each one files a rejection against the decision log with your name on it. Their evidence stays on the record, and any of them can be brought back by picking a lane on its row.`,
        destructive: true,
        confirmLabel: `Drop ${ids.length}`,
      });
      if (ok) dropMany.mutate(ids);
    },
    [confirm, dropMany],
  );

  /* THE RECORD OPENS ON THE BET YOU PRESSED, NOT ON THE ONE UNDER THE GATE.
     Until now the sheet read `activeOpp` whatever row had been pressed, so it
     was only ever a second view of the bet already in focus and every other row
     in the queue had no way to show its own record at all. Founder: "certain
     cards are not clickable and details, whatever is required, I feel left out."
     He was reading it exactly right.

     The ranking entry is resolved for the OPENED bet, so its rank, designation,
     rationale and next action are its own rather than the focused bet's, and
     every write the sheet fires is addressed to it. The Gate is untouched: it
     still holds whichever bet you chose to decide. */
  const openRanked = React.useMemo(
    () => ranked.find((r) => r.opp.id === openId) ?? null,
    [ranked, openId],
  );
  const openOpp = openRanked?.opp ?? null;
  const openBusy = openId ? busyIds.has(openId) : false;
  const openVerdict = openOpp ? verdictFor(openOpp) : "PENDING";

  /* Returns what the person answered, because the caller has to know. The
     record behind this dialog may only be dismissed on a yes; on a no, the
     caller leaves it standing. Swallowing the boolean here is what forced the
     caller to guess, and the guess it made is the defect written out at the
     onDelete handler below. */
  const askDelete = React.useCallback(
    async (opp: OpportunityDetailRecord) => {
      const ok = await confirm({
        title: "Delete this bet?",
        body: `This removes "${opp.title}" permanently. Its lineage and any linked signals stay, but the bet itself is gone.`,
        destructive: true,
        confirmLabel: "Delete bet",
      });
      if (ok) del.mutate(opp.id);
      return ok;
    },
    [confirm, del],
  );

  // The keycaps the gate promises. A keycap that does nothing is a lie, so
  // they are bound here rather than drawn for looks. Bare letters, so they
  // stand down whenever focus is in a field or an overlay is open.
  React.useEffect(() => {
    if (!activeOpp || busy || openId || lineageId) return;
    const id = activeOpp.id;
    const onKey = (e: KeyboardEvent) => {
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

      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      /**
       * ONE ALPHABET ACROSS EVERY GATE (founder ruling). `a` accepts and `d`
       * declines on Today, Design, Crew and Discover; this station was the last
       * one speaking its own language: `k` to keep, `x` to drop.
       *
       * THE COLLISION THIS ENDS, and it was the worst one in the product. `k`
       * MOVED THE CURSOR on /approvals and COMMITTED here -- the same key,
       * one surface apart, one of them harmless and the other spending money
       * to draft a spec. Muscle memory built on either surface was actively
       * dangerous on the other.
       *
       * `c` for Challenge stays. It is the only verb of the three that is not
       * an accept or a decline, its letter is the first letter of the word, and
       * it collides with nothing now the chord owns navigation.
       */
      // `a` GOES THROUGH THE CONFIRM, and that is the one behaviour change to
      // this handler. It used to fire three model calls off a bare letter with
      // nothing between the press and the spend; see `keepBet`. `void`, because
      // a keydown listener cannot await and the dialog owns what happens next.
      if (e.key === "a") void keepBet(activeOpp);
      else if (e.key === "c") challenge.mutate(id);
      // Through `dropBet`, not straight to the mutation: a second `d` on a bet
      // that is already dropped must not file a second rejection. See its
      // docblock.
      else if (e.key === "d") dropBet(activeOpp);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeOpp, busy, openId, lineageId, keepBet, challenge, dropBet]);

  const loading = stillWaiting(opps);

  /**
   * HOW MANY RANKED BETS REST ON A CLUSTER THIS PAGE CANNOT SEE.
   *
   * `listThemes` reads the newest 300 and nothing narrows that to a workspace,
   * so past the ceiling `themeById` simply has no entry. The ranker at :873
   * then scores those bets `?? 0`, which is not "few signals" but "we did not
   * look", and the two are indistinguishable on screen. A bet resting on a
   * long-lived cluster therefore sinks to the bottom of the one queue whose
   * entire job is the order.
   *
   * The note above this component said that was unfixable from here and one
   * file away. It is not, as of 2026-08-06: `listThemes` now returns an exact
   * `total` beside its page, so the surface can COUNT the bets it is ranking
   * blind and say so. This does not change the order, because there is no
   * honest number to sort an unknown by. It stops the order being quietly
   * wrong, which is the part that was costing a person their trust in it.
   */
  const rankedOnUnseenCluster = React.useMemo(
    // `ranked` wraps the record rather than extending it, so the opportunity is
    // `r.opp`. Reaching for `r.theme_id` compiles to undefined under a looser
    // type and would have counted zero forever.
    () => ranked.filter((r) => r.opp.theme_id && !themeById.has(r.opp.theme_id)).length,
    [ranked, themeById],
  );

  // A fact assembled from real counts. It never claims a number it does not
  // have, and it stays silent while the counts are still loading.
  const headline = React.useMemo(() => {
    if (loading) return "Decide";
    if (opps.error) return "The bets did not load.";
    const n = ranked.length;
    if (n === 0) return "Nothing is ranked yet.";
    if (n === 1) return "One bet is ranked, and it is waiting on you.";
    const base = `${n} bets ranked, strongest first.`;
    // Silent when the window covers everything, which is every workspace under
    // 300 clusters, so the common case reads exactly as it did before.
    if (rankedOnUnseenCluster === 0) return base;
    return `${base} ${rankedOnUnseenCluster} rest on a cluster outside the newest 300 this reads, so they rank low for want of a count rather than for want of evidence.`;
  }, [loading, opps.error, ranked.length, rankedOnUnseenCluster]);

  const activeVerdict = activeOpp ? verdictFor(activeOpp) : "PENDING";
  const activeSignals = activeOpp?.theme_id
    ? (themeById.get(activeOpp.theme_id)?.frequency ?? null)
    : null;
  const activeLearning = activeOpp ? latestLearningByOpp.get(activeOpp.id) : undefined;
  const activeRescore = activeLearning ? rescoreNoteOf(activeLearning) : null;
  const activeCitation = activeOpp ? (citations.data?.citations[activeOpp.id] ?? null) : null;
  const rescoredAgo = ago(lastRescoreAt);
  /**
   * WHOSE RECORD THE RECESS IS SPEAKING FROM. The page subtitle was taught to
   * say this one screen up; the recess below makes a STRONGER and more specific
   * version of the same claim -- "An outcome recorded on this bet moved its
   * score", plus a signed ICE delta -- and said nothing about provenance at all.
   *
   * IT IS NOT COVERED BY ANYTHING ELSE ON THE PAGE, which is what makes it the
   * one to close. `activeRescore` derives from `latestLearningByOpp`, which
   * reads the DELIBERATELY unfiltered `["learnings"]` query above; the widened
   * entry condition (`activeCitation || activeRescore`) means it renders without
   * passing `hasEnoughOutcomes`, so the workspace attribution that guards the
   * citation path never applies to it. The per-row and Gate "Example" marks are
   * not a mitigation either. Re-measured through the Lovable MCP on 2026-08-06:
   * 49 learnings carry a `new_ice`; 48 of them sit in an `is_sample` workspace,
   * the 49th points at a workspace row that has since been deleted, and ZERO
   * sit in a real one. All 48 hang off an opportunity, and NOT ONE of those 48
   * opportunities carries `is_sample = true`. `opportunities.is_sample` is
   * populated and
   * working -- 20 of 292 true, 0 null -- so those bets are simply unmarked, and
   * `active` defaults to `ranked.find((r) => !r.opp.is_sample)`, which makes
   * them eligible to be the DEFAULT selection. Both reads are unscoped, so this
   * is reachable while standing in a real workspace, not only inside the
   * example.
   *
   * A THIRD TRUE SENTENCE, NOT A SUPPRESSION, which is the same call the
   * subtitle made and the same one the ratchet requires. The re-score did
   * happen and the delta is real; what was missing is where it came from. So
   * nothing is hidden and one clause is added, and it is null -- silent -- only
   * when the outcome was recorded in the very workspace the reader is standing
   * in AND that workspace is known not to be a seeded example.
   *
   * `workspace_id` is on every learning row unconditionally (`listLearnings`
   * returns it whether or not a `workspaceId` was passed, exactly so a caller
   * can attribute rows without a second read), so this costs no query.
   *
   * WHAT THIS DELIBERATELY DOES NOT TOUCH: the CITATION body. That path is
   * gated on `hasEnoughOutcomes`, which is workspace-attributed but not
   * sample-attributed, so in a seeded workspace it can still assemble a
   * precedent out of invented history. Qualifying an assembled string from
   * `getPrecedentCitations` means writing launch copy for the station's most
   * differentiated element, and that is a founder call rather than a side
   * effect of this one. It is in the handoff.
   */
  const rescoreProvenance: string | null = (() => {
    if (!activeRescore) return null;
    const learningWs = activeLearning?.workspace_id ?? null;
    // Either id missing means we cannot compare them, and an unattributed claim
    // must say so rather than default to the flattering reading.
    if (learningWs === null || activeWorkspaceId === null) {
      return "Which workspace that outcome was recorded in is not known here yet.";
    }
    if (learningWs !== activeWorkspaceId) {
      return "That outcome was recorded in another workspace, not the one you are standing in.";
    }
    // Same workspace, but `is_sample` lives on the workspaces row and that read
    // resolves after the id is restored from localStorage. Until it lands the
    // honest answer is the same one the subtitle gives: not yet known.
    if (!workspaceKnown) {
      return "Whether this workspace is the seeded example is not known here yet.";
    }
    return inExampleWorkspace
      ? "That outcome was recorded in this example workspace, so it did not come from your product."
      : null;
  })();

  return (
    <Surface
      context={
        /* A WRAPPER WITH ONE JOB: carry the measure when this column stacks
           under the work column instead of standing beside it. See the single
           rule in styles/decide.css for the numbers that made it necessary.
           A fragment here would have nothing for that rule to reach. */
        activeOpp ? (
          <div className="decide-ctx">
            {/* THE SCORE COMES FIRST, AND IT WAS FIFTH.
                This column carried, in order: who touched it, why it ranks here,
                what it resembles, what people said, what backs it, and only THEN
                the three numbers that produce the order the whole page is about.
                Everything above it was a reason; this is the only control on the
                surface that changes the thing being reasoned about, and a person
                who wanted to move a bet up the queue had to scroll past four
                headings to find out they could.

                It is also the answer to the sentence at the top of the page.
                The subtitle says the queue is "Ordered by ICE score first"; the
                editor for that score now sits directly under a heading saying so
                rather than at the bottom of a rail.

                The reasons did not go away. They follow, in the same order they
                were in, because the order among THEM was right -- a person reads
                the score, then who has touched it, then why it ranks where it
                does. What was wrong was the control being last. */}
            <CtxHead>The score this order is made of</CtxHead>
            <IceEditor opportunity={activeOpp} disabled={busy} idPrefix="queue-ice" />
            <CtxBody>
              Impact, confidence and ease, each out of <Num>{ICE_CEILING}</Num>. Their average is
              what the queue sorts on first, so a change here re-ranks the list below the moment it
              lands.
            </CtxBody>

            <CtxHead>Who has touched it</CtxHead>
            {activeOpp.decided_by_agent_slug ? (
              <CtxRow
                mark={<AgentMark slug={activeOpp.decided_by_agent_slug} state="idle" />}
                name={agentDisplayName(activeOpp.decided_by_agent_slug)}
                sub="recorded the last decision on it"
              />
            ) : null}
            {/* THE TEARDOWN, NOT A SENTENCE ABOUT IT.
                This row used to read "Critic says revise at 62% confidence" and
                that was the whole of the Critic on this surface, alongside the
                Gate's 240-character summary. The risks, the kill criteria and
                the missing evidence are all already written to
                `opportunities.critic_review` by `runCritic`, and nothing on the
                one station where a person rules on the bet could open them: the
                red team's actual case lived only on the spec surface, which is
                downstream of the call it was supposed to inform.

                `CriticBadge` is that reader, and it has always carried the
                opportunity branch (`target.kind === "opportunity"` picks the
                "Risks / Kill criteria / Missing evidence" labels over the spec
                wording). It opens IN PLACE under the chip, so nothing slides
                over the question above it.

                Deliberately NOT <CtxRow>, for the reason written out at the same
                mount on `_authenticated.plan.spec.$id.tsx`: CtxRow wraps its
                slots in .sp-ctx-name / .sp-ctx-sub, both display:block with
                their own size and colour, which is right for a name and wrong
                for a control. Convert both the day CtxRow grows an unstyled
                slot, not before. */}
            {activeOpp.critic_review ? (
              <div className="sp-ctx-row">
                <AgentMark slug={CHALLENGER} state="idle" />
                <span>
                  <span className="sp-ctx-name">{challengerName}</span>
                  <CriticBadge
                    review={activeOpp.critic_review}
                    target={{ kind: "opportunity", id: activeOpp.id }}
                    /* The key this surface already reads the bets on, so a
                       re-run lands in the queue, the Gate and this column at
                       once rather than in one of the three. */
                    invalidateKey={["opportunities"]}
                  />
                </span>
              </div>
            ) : null}
            {!activeOpp.decided_by_agent_slug && !activeOpp.critic_review ? (
              <CtxBody>
                Nobody has reviewed it. Challenging it puts a teardown on the record before you call
                it.
              </CtxBody>
            ) : null}

            <CtxHead>Why it ranks here</CtxHead>
            <CtxBody>
              {active?.rationale}
              {active?.designation ? `. Reads as a ${active.designation}` : ""}.
            </CtxBody>

            {/* WHAT THIS RESEMBLES, as a claim rather than an arithmetic.
              An earlier draft of this block printed the raw cosine similarity
              as "72% match", and that number is wrong twice over: a 0.72
              cosine is not seventy-two percent of anything a reader would
              recognise, and no product in this class puts a similarity score
              on an auto-generated cluster at all. The useful thing is the
              prior cluster's NAME, which is clickable evidence; the number is
              our own internals shown to someone who cannot act on it. */}
            {themePrecedent.data?.priorTheme ? (
              <>
                <CtxHead>What this resembles</CtxHead>
                <CtxBody>
                  The record has been here before, on {themePrecedent.data.priorTheme.title}.
                </CtxBody>
              </>
            ) : null}

            {/* THE EVIDENCE THIS BET RESTS ON, verbatim.
              Until 2026-08-01 the entire evidence display on this surface was a
              count, and the count was `themeById.get(theme_id)?.frequency`: an
              integer written once at cluster time. Discover's Gate promised
              "this evidence travels with it" and nothing on this screen could
              show one sentence a customer actually said.

              It can now, because `promoteThemeToOpportunity` writes a direct
              signal -> opportunity lineage edge per member, so `getProvenance`
              reaches the root signals from here rather than dead-ending at the
              theme. A previous draft of this block put WORKSPACE-WIDE source
              coverage under the heading "What is feeding this", which reads as
              a claim about this bet and is not one. Coverage is a Discover
              question; at the moment of the call what matters is what these
              specific people said. */}
            {provenance.data?.source_signals?.length ? (
              <>
                <CtxHead>What people actually said</CtxHead>
                {provenance.data.source_signals.slice(0, 4).map((s) => (
                  <CtxRow
                    key={s.id}
                    name={(s.content ?? s.title ?? "").slice(0, 96)}
                    sub={
                      <>
                        {s.source ?? "unattributed"}, <Num>{ago(s.created_at)}</Num>
                      </>
                    }
                  />
                ))}
                {provenance.data.source_signals.length > 4 ? (
                  <CtxBody>
                    <Num>{provenance.data.source_signals.length - 4}</Num> more said the same thing.
                  </CtxBody>
                ) : null}
              </>
            ) : null}

            <CtxHead>What backs it</CtxHead>
            {activeSignals !== null ? (
              <CtxBody>
                <Num>{activeSignals}</Num> {activeSignals === 1 ? "signal" : "signals"} in the
                record
              </CtxBody>
            ) : activeOpp?.theme_id ? (
              /* IT HAS A CLUSTER AND WE DID NOT LOOK IT UP, which is not the
                 same as having no evidence and used to render as nothing at
                 all. Under "What backs it", an empty space reads as "nothing
                 backs it" on the one screen where that judgement is the whole
                 point. It says which it is now, and admits the ranking
                 consequence rather than leaving the person to wonder why a bet
                 they know is well evidenced is sitting near the bottom. */
              <CtxBody>
                Its cluster is outside the newest 300 this page reads, so the count is not on screen
                and the bet is ranked as if it had none.
              </CtxBody>
            ) : null}
            {/* THE SCORE STOPS BEING A READ-ONLY FACT.
                This column printed "ICE 7.3" and nothing on the surface could
                change it, on the one station whose entire job is the order those
                three numbers produce. `updateOpportunity` has always accepted
                them and nothing ever sent one. Three fields, arrow keys, and the
                queue re-ranks itself the moment a score lands.

                IT MOVED TO THE TOP OF THIS COLUMN. It sat here, under the fifth
                heading, "where the number was already being read" -- which was
                the right instinct about ADJACENCY and the wrong answer about
                RANK. The reasons above it are all read-only; this is the one
                control that changes the order, and it was the last thing on the
                rail. Only one editor is mounted, so nothing here is duplicated
                and no second `queue-ice` id exists. */}
            <CtxBody>
              <Button variant="ghost" onClick={() => setLineageId(activeOpp.id)}>
                View the evidence
              </Button>
            </CtxBody>
          </div>
        ) : null
      }
    >
      {/* THE AUTONOMOUS PATH, VISIBLE. Renders nothing unless an agent is
          genuinely mid-run, so it costs no space when the crew is idle and
          cannot show a step that did not happen. Every other pulse on this
          station is gated on a mutation the reader's own click started;
          this one is bound to the run. See use-live-agents.ts. */}
      <CrewWorking />
      {/**
       * THE SENTENCE THAT STATES THE MOAT, AND IT HAS TO BE EARNED EVERY TIME.
       *
       * "Re-ranked N ago, on its own, off a recorded outcome" is the strongest
       * claim this product makes, on the station the claim is about. It was
       * printed off `max(created_at)` over a cross-workspace, unfiltered
       * learnings read, so on launch day every user in the database would have
       * read it in their own empty workspace, on a timestamp lifted from a
       * seeded row in the Explore workspace they were handed at signup.
       * Nothing had been re-ranked. `lastRescoreAt` now comes from the
       * workspace-scoped, moved-a-score-only read, so this branch is reached
       * only when an outcome recorded HERE genuinely moved a score.
       *
       * AND "HERE" IS NOT ALWAYS THE READER'S OWN RECORD, WHICH IS THE HALF
       * THAT WAS FIXED SECOND. The audit's filter was `not is_sample AND
       * new_ice is not null`; what landed first was the workspace scope alone,
       * and the missing half was neither done nor written down. Nothing in
       * src/components/shell/ reads `is_sample` -- the only marks anywhere in
       * the product are per-row ("This is an example" on the Gate, "Example" on
       * each queue row) -- so a PAGE-level claim about this workspace's history
       * stood with nothing qualifying it.
       *
       * Re-measured 2026-08-06 through the Lovable MCP, because "reachable"
       * deserved a number rather than an argument:
       *   - 49 learnings in the database carry a `new_ice`. 48 sit in an
       *     `is_sample` workspace (Sample workspace 24, Sample sandbox 12,
       *     Explore workspace 12); the 49th points at a workspace row that has
       *     since been deleted, so no live session can select it. ZERO sit in a
       *     real workspace. Today the only way to reach a re-rank sentence AT
       *     ALL is to be standing in an example.
       *   - `use-workspace.tsx` sorts workspaces by name ascending and falls
       *     back to `workspaces[0]`, so a cold load with no stored id opens
       *     whichever sorts first. Of the 16 users who belong to any workspace,
       *     3 land in a sample one that way, and for ONE of those three it is
       *     "Explore workspace" -- which holds 12 moved-score learnings. That
       *     user is the reason this branch exists: until it did, they were shown
       *     the unqualified sentence. Present tense here would now be the false
       *     kind of comment, because the branch below is what they read.
       * (Every figure in this block was re-derived on 2026-08-06 rather than
       * restated: 119 learnings, 49 with a `new_ice`, 48 of those in a sample
       * workspace -- Sample workspace 24, Sample sandbox 12, Explore workspace
       * 12 -- one pointing at a deleted workspace row, ZERO in a real one, and
       * 3 of 16 users cold-loading into a sample workspace.)
       * (`seedSampleWorkspace` would make this the norm rather than the
       * exception, but it is still gated behind SAMPLE_WORKSPACE_ENABLED=1 and
       * returns null otherwise, so today's six sample workspaces arrived by
       * other routes. It is a reason to fix this before the flag flips, not a
       * reason the defect is hypothetical.)
       *
       * THE ANSWER IS A THIRD TRUE SENTENCE, NOT A SUPPRESSED SECOND ONE. The
       * re-rank did happen and saying so is not the error; implying it was
       * learned from the reader's own product is. So the example branch keeps
       * the fact and the elapsed time and adds what the unqualified version
       * left the reader to assume. The repo's own precedent runs the same way:
       * `getFocusNext` filters `is_sample` themes out rather than softening the
       * card's wording, because there the claim has no honest version -- here
       * it does.
       *
       * THE FIRST BRANCH IS NOT A HEDGE, AND IT IS NOT AN APOLOGY. The honest
       * version of "we re-ranked your queue" is never "we may have re-ranked
       * your queue" -- a weaker claim about the same thing teaches nothing.
       * It is a different, true sentence: what the order is actually built
       * from today, and what changes once an outcome lands.
       *
       * "FIRST, THEN" RATHER THAN A LIST, because the list would be wrong. The
       * comparator in components/discover/ranking.ts:319-331 runs NINE
       * comparisons: five ranking terms in strict order -- ICE, the verdict,
       * brief alignment, recorded-outcome support, then corroboration -- and
       * then four tie-breaks that only separate bets those five have already
       * tied (confidence, impact, oldest first, then id). An earlier version of
       * this note said the range "has five terms in strict order", which is a
       * fair summary of the first five and a wrong count of the block it points
       * at; the range is what made the claim checkable, so the count is
       * corrected rather than the range dropped.
       *
       * The sentence names the three a reader can see and act on WITHOUT
       * LEAVING THIS SCREEN: the ICE editor in the context column, the verdict
       * badge above it, and the signal count under "What backs it". Naming
       * three of five with a plain "and" would read as the whole chain and
       * quietly misstate it -- and the shipped sentence USED to do exactly
       * that: "Ordered by ICE score first, then the verdict on each bet and the
       * signals behind it" joins three with "then ... and ...", which puts
       * corroboration, the FIFTH term, where a reader takes it for the third.
       * It now stops after the two terms it can place correctly and says the
       * signals count further down, which names all three and orders only what
       * it can. The complete per-bet answer is one line away, under "Why it
       * ranks here".
       *
       * "THE VERDICT ON EACH BET", NOT "THE CRITIC'S VERDICT". The second sort
       * term is `verdictRankOf(verdictFor(opp))`, and `verdictFor`
       * (components/discover/format.ts:175-184) only consults
       * `critic_review.verdict` FIRST -- absent one it falls through to the
       * lane, so `now`/`shipped` reads SHIP, `dropped` reads KILL and
       * `next`/`later` reads WATCH. A bet the Critic has never opened can be
       * ranked up that tier by its placement alone. Naming the Critic in the
       * page's headline claim asserted a review that may not exist; naming the
       * verdict names exactly what the comparator reads and exactly what the
       * badge on each row shows.
       *
       * "ICE SCORE", NOT "YOUR ICE SCORES". On the workspace this station opens
       * in by default every bet in the queue is seeded and its ICE was written
       * by the seeder, so the possessive is the same size of over-claim the
       * rest of this block exists to remove. The code does order by ICE and the
       * editor for it is in the context column; whose it is, is not something
       * this sentence can know.
       *
       * It also stops being said the moment the reader settles an outcome on
       * Learn, at which point one of the branches above replaces it and names
       * the day. And it stays true while the read is still in flight -- or has
       * failed, see the query's own note -- which the flat assertion "nothing
       * has been re-ranked yet" would not be.
       *
       * IT IS ALSO WHAT SHOWS WHILE WE DO NOT YET KNOW WHOSE RECORD THIS IS.
       * `!workspaceKnown` shares this branch, which is why the condition reads
       * as a disjunction rather than a nested third case: the choice between the
       * two re-rank sentences below turns entirely on `is_sample`, and until the
       * workspaces row carrying it lands there is no honest way to make that
       * choice. Making it early would default to the unqualified version, which
       * is precisely the sentence this pass removed. See `workspaceKnown`.
       */}
      <PageHead
        title={headline}
        sub={
          rescoredAgo === null || !workspaceKnown ? (
            "Ordered by ICE score first, then the verdict on each bet. The signals behind it count too, further down the order. Record an outcome on Learn and it re-ranks off that too."
          ) : inExampleWorkspace ? (
            rescoredAgo === "now" ? (
              "Re-ranked just now, on its own, off an outcome recorded in this example workspace. That is the loop working, on a record that did not come from your product."
            ) : (
              <>
                Re-ranked <Num>{rescoredAgo}</Num> ago, on its own, off an outcome recorded in this
                example workspace. That is the loop working, on a record that did not come from your
                product.
              </>
            )
          ) : rescoredAgo === "now" ? (
            "Re-ranked just now, on its own, off an outcome recorded in this workspace."
          ) : (
            <>
              Re-ranked <Num>{rescoredAgo}</Num> ago, on its own, off an outcome recorded in this
              workspace.
            </>
          )
        }
      />

      {/* A failed read is not a decision, so it never wears the Gate. The
          headline above already says it did not load; this line carries the
          reason, which is different information, and the way back. */}
      {opps.error ? (
        <Failed onRetry={() => void opps.refetch()}>{(opps.error as Error).message}</Failed>
      ) : loading ? (
        <Loading>Reading the bets on the table.</Loading>
      ) : activeOpp ? (
        <Gate
          /* Keyed on the bet, so picking another row in the ranking REMOUNTS the
             Gate and it plays its entrance. Without a key React updates this in
             place and the question, the evidence and the buttons all change with
             no motion at all. */
          key={activeOpp.id}
          question={activeOpp.title}
          lines={[
            /**
             * SAY IT BEFORE ASKING THEM TO JUDGE IT.
             *
             * Onboarding writes four invented opportunities into the user's
             * real workspace so Decide has something to show on day one. Until
             * 2026-08-05 nothing said so anywhere: `track-seeds.ts` believed
             * the label lived in the project name and a description column that
             * does not exist, and no surface joined the project name. So the
             * first thing a visitor met here was a gate asking them to keep or
             * drop a bet about a product they do not have, and pressing "Keep
             * it" spent real model credits writing a spec for fiction.
             *
             * It is the FIRST line deliberately. A person reads the question,
             * then the facts, then presses a key; a disclaimer below the
             * evidence would arrive after the decision was already forming.
             */
            ...(activeOpp.is_sample
              ? [
                  <span key="sample">
                    <b>This is an example.</b> It came with your workspace so this station had
                    something to show. It is not from your product, and nothing here has been
                    learned from your record.
                  </span>,
                ]
              : []),
            /* Which of the queue this is. The row below says where it sits;
               this says the Gate is showing that row. Suppressed at one bet,
               because "1 of 1" is a fact about nothing. */
            ...(ranked.length > 1
              ? [
                  <span key="rank">
                    <Num>{active?.rank ?? 1}</Num> of <Num>{ranked.length}</Num> in the ranking.
                  </span>,
                ]
              : []),
            ...(activeOpp.problem ? [<span key="problem">{activeOpp.problem}</span>] : []),
            ...(activeOpp.critic_review?.summary
              ? [
                  /* INLINE FLOW, NOT A FLEX ROW (2026-08-10, measured in the
                     browser). This was `flex items-center gap-2`, which made
                     the badge, the challenger's name and the summary three
                     flex items. A summary long enough to wrap became a tall
                     block, the badge floated centred against the middle of it,
                     and the text started 190px right of where every other
                     bullet in the same list starts. One item in a list of five
                     had its own left edge.
                     The badge is `inline-flex` (ui/badge.tsx), so it already
                     flows inside a sentence. Dropping the flex wrapper lets the
                     whole bullet wrap as one paragraph on the list's own text
                     column, which is what the other four do. */
                  <span key="critic">
                    <VerdictBadge
                      verdict={activeVerdict}
                      confidence={activeOpp.critic_review.confidence}
                    />{" "}
                    <b>{challengerName}</b> {activeOpp.critic_review.summary}
                  </span>,
                ]
              : []),
            /* What backs THIS bet, counted from the signals actually linked to
               it. An earlier draft counted the workspace's connected sources
               here and called them "Backed by", which asserts something about
               this one bet that the number does not support: it would have read
               the same on a bet with no evidence at all. */
            ...(provenanceSources.length > 0
              ? [
                  <span key="sources">
                    <Num>{provenance.data?.source_signals?.length ?? 0}</Num> signal
                    {(provenance.data?.source_signals?.length ?? 0) === 1 ? "" : "s"} behind it,
                    from <Num>{provenanceSources.length}</Num> separate source
                    {provenanceSources.length === 1 ? "" : "s"}:{" "}
                    {provenanceSources.slice(0, 2).join(", ")}
                    {provenanceSources.length > 2 ? " and more" : ""}.
                  </span>,
                ]
              : []),
            /* WHAT IT COSTS, SAID BEFORE THE PRESS RATHER THAN AFTER IT. The
               line used to stop at "drafts the spec and moves it into Plan",
               which describes the outcome and not the spend. Three model runs
               is the fact that makes this the expensive answer of the three on
               offer, and it is the reason the button asks again. */
            /* Parentheses rather than a dash pair. Em dashes are banned in
               copy, and these two were the last in the app because they were
               written as `&mdash;` entities: every sweep tonight grepped for
               the literal character and walked straight past them. */
            <span key="consequence">
              Keeping it writes the spec, its body and its outcome contract (three model runs) and
              moves it into Plan. It asks once before it spends. Nothing ships from here.
            </span>,
          ]}
        >
          <Button
            variant="primary"
            shortcut="a"
            disabled={busy}
            onClick={() => void keepBet(activeOpp)}
          >
            Keep it
          </Button>
          <Button shortcut="c" disabled={busy} onClick={() => challenge.mutate(activeOpp.id)}>
            Challenge it
          </Button>
          <Button shortcut="d" disabled={busy} onClick={() => dropBet(activeOpp)}>
            Drop it
          </Button>
          <Button variant="ghost" disabled={busy} onClick={() => setOpenId(activeOpp.id)}>
            Open the full record
          </Button>
          {/* Both of the first two buttons dispatch an agent, and until now the
              only sign of it was the buttons greying out. "Keep it" runs
              `generatePrd`, which is THREE chokepoint calls (a title, the body,
              then the outcome contract) and the slowest act on this surface;
              "Challenge it" runs the Critic. Greyed buttons and no other change
              is exactly the state the founder described as static.

              It lives INSIDE the Gate, after the verbs, because the Gate is the
              biggest thing on the surface and a person who just pressed a button
              there is still looking at it. Putting the indicator below the
              recess would ask them to go find it. */}
          {draftSpec.isPending || challenge.isPending ? (
            <AgentPulse
              label={draftSpec.isPending ? "Drafting the spec" : "The Critic is challenging it"}
              seed={draftSpec.isPending ? "product-manager" : "critic"}
              detail={
                draftSpec.isPending ? (
                  <>{activeOpp.title} · spec, then the outcome contract</>
                ) : (
                  <>{activeOpp.title} · against what the record already settled</>
                )
              }
            />
          ) : null}
        </Gate>
      ) : (
        /* Day one. The headline already says nothing is ranked, so this says
           the next different thing: who acts, and where.

           TWO ROUTES IN, NOT ONE. This block used to offer Discover and nothing
           else, which is the right path for a bet the record produced and a
           three-step detour for the person who arrives with the bet already in
           their head. Discover keeps the ghost button because it is still the
           stronger route when there IS evidence; naming a bet is the primary
           here because on a station with nothing ranked, the reader has none. */
        <>
          <Empty>
            Promote a signal on Discover and it lands here, scored and ranked against the record. Or
            name the bet you already have in mind and rule on it now.
          </Empty>
          <NameABet pending={nameBet.isPending} onName={(idea) => nameBet.mutate(idea)} />
          {nameBet.isPending ? (
            <AgentPulse
              label={`${challengerName} is tearing it down`}
              seed={CHALLENGER}
              detail={<>the bet you just named, against what the record already settled</>}
            />
          ) : null}
          <Actions>
            <Button variant="ghost" onClick={() => void navigate({ to: "/discover" })}>
              Go to the signals
            </Button>
          </Actions>
        </>
      )}

      {/* Unlabelled and directly under the question: the recess announces
          itself, and a heading between the call and its precedent would put a
          third register in the way of the one moment that matters here.

          AND IT OPENS RECORDED OUTCOMES, WHICH IS NOT THE SAME AS THE ONE IT
          QUOTES. This is the one surface in the product that claims the moat
          out loud -- it says the record has been here before and tells you what
          happened -- and it was rendered with no onClick at all, so the claim
          could not be checked. A sentence that says "we learned this from your
          own outcomes" and cannot show you one of them is asking to be taken on
          faith, which is exactly what the compounding claim cannot afford.

          Two destinations, both real, never a guess, and NEITHER is the bet the
          body names as the closest mirror. `getPrecedentCitations` excludes this
          bet's own outcomes from the precedents and then hands this surface one
          assembled string, so the mirrored bet's memoryId and opportunityId --
          both carried on `JudgmentPrecedent` -- are gone by the time they get
          here. Opening it needs those ids kept through the citation, which is a
          change in decision-judgment.functions.ts, not on this route.

          So: when an outcome has been recorded against THIS bet we hold its id
          (`activeLearning`, the same row whose ICE delta is already printed as
          this recess's evidence line), and the door opens that one outcome
          through the drill Today, CompoundingPanel and graph-doors.ts all use:
          /brain?tab=learnings&learning=<id>. When there is none, the door opens
          the Learnings record itself rather than inventing an id it does not
          have. The title says which of the two it is, so the label never
          promises the mirrored bet.

          AND IT NO LONGER WAITS FOR A CITATION TO SHOW THE LOOP WORKING.
          `activeRescore` -- "+2.0 after 'churn spiked'" -- is the ONE element on
          this station that shows a recorded outcome moved THIS bet's score, and
          it was passed as this recess's `evidence`, which meant it only ever
          rendered when `activeCitation` was non-null. That citation needs three
          settled outcomes AND an embedded outcome memory on a DIFFERENT bet
          scoring past the similarity floor, and `assemblePrecedentBlock`
          deliberately filters this bet's own outcomes out, so a person's FIRST
          outcomes structurally cannot produce one. The effect was that settling
          your first outcome genuinely re-scored the bet and reordered the queue
          -- and said nothing, for exactly as long as you had too little history
          to be cited, which is precisely when you most need to see it work.

          So the entry condition is EITHER, and the citation is the body when
          there is one. When there is not, the body states the thing the
          evidence line is proof of, in a sentence rather than a delta. */}
      {activeCitation || activeRescore ? (
        <RecordRecess
          evidence={activeRescore ?? undefined}
          /* THE LABEL NAMES THE DESTINATION, NOT THE SENTENCE ABOVE IT.
             This used to read "Open the outcome this was learned from", and
             that promised the mirrored bet the body names. It cannot deliver
             it: `getPrecedentCitations` filters this bet's own outcomes OUT of
             the precedents (`p.opportunityId !== o.id`) and then collapses the
             survivors to a string, so the mirrored bet's id never reaches this
             surface. What the door actually holds is `activeLearning`, the
             latest outcome recorded ON this bet -- a different record, and the
             one whose ICE delta is printed as this recess's evidence line. */
          title={
            activeLearning ? "Open the outcome recorded on this bet" : "Open your recorded outcomes"
          }
          onClick={() =>
            void navigate({
              to: "/brain",
              search: activeLearning
                ? { tab: "learnings", learning: activeLearning.id }
                : { tab: "learnings" },
            })
          }
        >
          {/* `||`, matching the guard above, not `??`. An empty citation string
              is falsy for the entry condition, so `??` here would let it
              through as a blank body on a recess that only rendered because
              the rescore was there. */}
          {activeCitation || "An outcome recorded on this bet moved its score."}
          {/* AND WHOSE RECORD IT IS, when that is not the reader's own. Appended
              rather than substituted: the claim above is true and stays whole,
              and this says the one thing it left the reader to assume. Null on
              the only path where the unqualified sentence is complete -- an
              outcome recorded in this very workspace, known not to be the
              seeded example. See `rescoreProvenance`. */}
          {rescoreProvenance ? ` ${rescoreProvenance}` : null}
        </RecordRecess>
      ) : null}

      {/* WHEN, said on the surface that decides it.
          The Gate answers whether; this answers when, and it is the half that
          used to be buried in a "Move to" menu at the foot of the open record.
          It is a Line rather than three more buttons in the Gate because it is a
          placement you set, not a call you make: label left, control right, one
          decision, one tab stop, and the arrow keys move inside it. It sits
          after the recess so the record still speaks directly under the
          question, which is the one thing this surface is built around. */}
      {activeOpp ? (
        <Line
          label="Where it sits"
          sub={
            activeOpp.status === "dropped"
              ? "It is dropped right now. Picking a lane brings it back into the ranking."
              : activeOpp.status === "shipped"
                ? "It shipped. Picking a lane puts it back in front of the team."
                : "Placing it moves the roadmap. Nothing is drafted and nothing ships from here."
          }
        >
          {/* NOT disabled while a write is in flight, unlike the Gate's verbs.
              Those dispatch an agent and a second press costs a real run; a
              radio group that disables itself mid-decision throws focus to the
              body and loses the arrow keys, which is the worse failure.
              This USED to say "one cheap column write where the last press
              wins", and that stopped being true the moment the lane became two
              writes: arrows fire one pair per keypress and they can interleave.
              The sequence token in `setStatus.mutationFn` is what makes the last
              press win now, so this control can stay live.

              AND IT NO LONGER WRITES ONE PER KEYSTROKE. `Choices` used to hand
              every arrow and every click of the already-selected lane straight
              to this mutation, and each of those reached `recordJudgment`.
              `LanePicker` holds the arrowed value and commits on settle; the
              sequence token above stays, because a debounce narrows the window
              for interleaving pairs and does not close it. Keyed on the bet, so
              the Gate moving on resets the draft rather than carrying one bet's
              half-made choice onto the next. */}
          <LanePicker
            key={activeOpp.id}
            opportunity={activeOpp}
            pending={busy}
            onCommit={(status) => setStatus.mutate({ id: activeOpp.id, status })}
          />
        </Line>
      ) : null}

      {/* What your last call caused. It stays on screen instead of sliding
        away, because a judgment that erases itself teaches you your judgment
        left no trace, and judgment is the product. */}
      {receipt ? (
        <Receipt verb={receipt.verb} consequence={receipt.consequence} failed={receipt.failed} />
      ) : null}

      {/* Only when there is genuinely a queue behind the gate. With one bet
          ranked, a heading over an empty line is a panel that says nothing the
          headline has not already said, and it sits between the reader and the
          one question they came to answer. */}
      {others.length > 1 ? (
        <Block
          title="The ranking"
          /* WHAT A ROW DOES, SAID ONCE, IN THE ONE PLACE A PERSON IS ABOUT TO
             DO IT. The rows carry two different verbs now, and an affordance
             nobody can name is an affordance nobody uses. */
          sub="Press a bet to open its whole record. Decide it puts that bet under the question above. Tick rows to drop a batch of them."
          more={
            ordered.length > VISIBLE_OTHERS
              ? showAll
                ? "Show fewer"
                : `All ${ordered.length}`
              : undefined
          }
          onMore={() => setShowAll((v) => !v)}
        >
          {/* WHAT THE WHOLE QUEUE LOOKS LIKE, before any of it is read.
              A ranked list with no distribution over it asks the reader to
              trust rank 1 without ever asking what rank 12 looks like, and that
              was this station: five rows, an "All 31", and no way to know
              whether the Critic had read any of them. Every count is off rows
              already in hand and every zero is dropped, because a tile reading
              0 spends a column of attention to say nothing happened. */}
          <BatchHeader
            facts={[
              {
                n: others.length,
                label: others.length === 1 ? "bet ranked" : "bets ranked",
                always: true,
              },
              {
                n: spread.cleared,
                label: "red-team cleared",
                title: `${challengerName} read them and said ship`,
              },
              {
                n: spread.flagged,
                label: "flagged",
                tone: "warn",
                title: `${challengerName} asked for a revision, or said kill it`,
              },
              {
                n: spread.waiting,
                label: "awaiting review",
                title: "No teardown on the record, so the verdict beside them came from their lane",
              },
              {
                n: spread.moved,
                label: "moved by an outcome",
                title:
                  "A recorded outcome changed the score on these, which is what the delta beside each one measures",
              },
            ]}
          />

          {/* THE THREE CONTROLS, IN THE LIST THEY ACT ON. Not in a toolbar over
              the page: they narrow this block and nothing else, and the Gate
              above deliberately does not move when they do. */}
          <Line label="Show" sub={LENSES.find((l) => l.id === lens)?.title}>
            <Choices
              label="Which bets to show"
              value={lens}
              options={LENSES}
              onPick={(id) => setLens(id)}
            />
          </Line>
          {/* RANK THE MOVEMENT, NOT THE MAGNITUDE -- offered only when there IS
              movement. Every ranked queue shows a current value; a person
              returning on Tuesday needs the two rows that changed their mind,
              not twelve rationales re-read. Withheld at zero because an order
              that silently equals the default is a control that lies. */}
          {spread.moved > 0 ? (
            <Line
              label="Order"
              sub={
                order === "score"
                  ? "The comparator's own order: ICE first, then the verdict."
                  : "The bets a recorded outcome moved, newest first, then the rest as they were."
              }
            >
              <Choices
                label="How to order the ranking"
                value={order}
                options={[
                  {
                    id: "score" as Order,
                    label: "Highest score",
                    title: "The deterministic order",
                  },
                  {
                    id: "moved" as Order,
                    label: "Recently moved",
                    title: "What the record re-scored since you last looked",
                  },
                ]}
                onPick={(id) => setOrder(id)}
              />
            </Line>
          ) : null}
          <Field label="Find a bet" htmlFor="decide-queue-find">
            <Input
              id="decide-queue-find"
              value={q}
              placeholder="Any part of its name, or of the problem it states"
              onChange={(e) => setQ(e.target.value)}
              /* Escape clears the field rather than reaching the gate keys,
                 which stand down over an INPUT anyway. A search box you cannot
                 empty from the keyboard is a filter that traps the list. */
              onKeyDown={(e) => {
                if (e.key === "Escape" && q) {
                  e.preventDefault();
                  setQ("");
                }
              }}
            />
          </Field>

          <SelectionBar selection={picked} total={ordered.length} noun="bet">
            {/* One verb, and it is the cheap reversible one. See `dropMany`:
                keeping is three model runs a bet and challenging is one, so
                neither may ever be spent by a single press on a batch. */}
            <Button disabled={dropMany.isPending} onClick={() => void askDropMany([...picked.ids])}>
              {dropMany.isPending ? "Dropping them" : "Drop them"}
            </Button>
          </SelectionBar>

          {/* A NARROWED LIST THAT FINDS NOTHING SAYS SO. Without this the block
              rendered its header, its controls and then nothing at all, which
              reads as a broken list rather than as an answered question. It is
              an Empty and never a Failed: the read succeeded, the filter is
              what emptied it, and the sentence names which one. */}
          {ordered.length === 0 ? (
            <Empty>
              {q.trim() ? (
                <>
                  Nothing among the <Num>{others.length}</Num> ranked bets matches &ldquo;{q.trim()}
                  &rdquo;
                  {lens === "all" ? "" : `, under ${LENSES.find((l) => l.id === lens)?.label}`}.
                </>
              ) : (
                <>
                  None of the <Num>{others.length}</Num> ranked bets is{" "}
                  {LENSES.find((l) => l.id === lens)?.label.toLowerCase()}.
                </>
              )}
            </Empty>
          ) : null}

          {visibleOthers.map((r) => {
            const o = r.opp;
            const spoke = criticGaveTheVerdict(o.critic_review);
            const verdict = verdictFor(o);
            const ring = redTeamRing(verdict, spoke, challengerName);
            const moved = movementByOpp.get(o.id) ?? null;
            const focused = o.id === active?.opp.id;
            return (
              <Row
                key={o.id}
                tight
                /* THE SHAPE CARRIES THE STATE, and it replaced the agent mark
                   rather than joining it. What stood here was `AgentMark` for
                   whoever last touched the bet, which is a fact about
                   PROVENANCE on a row a person scans to make a DECISION: it
                   answered "who" when the scanning question is "has this been
                   red-teamed, and did it pass". Attribution has not been lost --
                   the context column's "Who has touched it" carries it for the
                   bet under the question, which is the only place it changes
                   what anyone does.

                   Empty ring: nobody has reviewed it. Part: watch, or revise.
                   Full: cleared. Struck: kill. It survives greyscale, which no
                   coloured pill does. */
                marks={<StatusRing small fill={ring.fill} tone={ring.tone} label={ring.label} />}
                lead={o.title}
                // One line, one different fact: where it sits, what it scored,
                // what KIND of bet it is, what the reviewer concluded when that
                // is not the ordinary answer, and which lane it is in.
                //
                // THE SCORE IS BACK ON THE ROW, and the note that took it off is
                // wrong rather than merely old. It read "the score that produced
                // the rank is the ranking's own input and belongs to the bet in
                // focus", which would be right if the rank told you the gap: it
                // does not. #3 above #4 is one place either way whether the two
                // are 9.1 and 2.0 or 7.3 and 7.2, and those are opposite facts
                // about how much the order is worth trusting. A numeral plus a
                // 2px bar on one shared scale is what makes that visible, it
                // costs no row height, and it is the encoding the queue research
                // found across the products that got this right.
                //
                // AND IT CARRIES WHAT MOVED IT. `moved` is a real previous score
                // out of `learnings.prior_ice`, never a diff computed here. See
                // `movementByOpp`.
                sub={
                  <>
                    {/* SAID ON EVERY ROW, not only on the one in focus.
                        The gate above already tells you when the bet it is
                        ASKING about is an example. The list did not, and the
                        list is where a person forms their impression of what
                        is in their workspace: four invented bets sitting
                        unmarked among their own, each with a rank and a lane
                        and a verdict, read as four things their product
                        actually needs. Measured on the live database while
                        wiring this: 20 sample opportunities across 5
                        workspaces, and `select("*")` has been carrying the
                        flag to the client the whole time.

                        First in the line, for the same reason it is the gate's
                        first line: a person scanning stops at the rank, and a
                        caveat after the verdict arrives once the impression is
                        already formed. */}
                    {o.is_sample ? (
                      <>
                        <b>Example</b>
                        {" · "}
                      </>
                    ) : null}
                    <Num>#{r.rank}</Num>
                    {" · "}
                    <ScoreMeter
                      value={o.ice_score ?? 0}
                      ceiling={ICE_CEILING}
                      decimals={1}
                      delta={moved?.delta ?? null}
                      what="ICE"
                    />
                    {" · "}
                    {r.isBestBet ? (
                      <BestBetStamp />
                    ) : (
                      <DesignationTag designation={r.designation} />
                    )}
                    {(r.isBestBet || r.designation) && " · "}
                    {/* EXCEPTION-ONLY, which is Vanta's discipline and the
                        reason the ring above can be trusted at a glance. Every
                        row used to print a verdict sentence, so "Critic says
                        ship" was the commonest string on the page and the two
                        rows in actual trouble had to compete with it for
                        attention. A cleared bet now says nothing here: its ring
                        is full, its title says who cleared it, and silence is
                        the correct amount of noise for the ordinary case.

                        The sentence stays for exactly the cases where something
                        is NOT ordinary -- revise, kill, and never-reviewed --
                        and it keeps its honesty guard. The third argument is
                        that guard: `verdictFor` falls back to the lane, so the
                        row must say which of the two it is reading, and it is
                        `criticGaveTheVerdict` rather than
                        `Boolean(o.critic_review?.verdict)` because the guard has
                        to ask the same question `verdictFor` asks -- see that
                        function's docblock. */}
                    {!spoke || verdict === "REVISE" || verdict === "KILL" ? (
                      <>
                        {verdictSentence(verdict, challengerName, spoke)}
                        {o.status ? " · " : ""}
                      </>
                    ) : null}
                    {o.status ? <StatusPill status={o.status} /> : null}
                  </>
                }
                time={ago(o.updated_at)}
                focused={focused}
                // THE ROW OPENS THE RECORD. It used to re-select the Gate, which
                // is why a person could press every bet in the queue and never
                // reach one of their details.
                onClick={() => setOpenId(o.id)}
                // And the Gate keeps its own door, outside the row's clickable
                // region so it is never a button inside a button. Disabled with
                // a reason on the bet already under the question, rather than
                // hidden: a control that appears and disappears down a list
                // reads as a rendering bug.
                action={
                  <>
                    <Button
                      variant="ghost"
                      disabled={focused || busyIds.has(o.id)}
                      title={
                        focused
                          ? "This bet is already under the question above"
                          : "Puts this bet under the question at the top"
                      }
                      onClick={() => setSelectedId(o.id)}
                    >
                      Decide it
                    </Button>
                    {/* The tick lives in the trailing slot beside the verb
                        rather than in the leading one, because the leading slot
                        now carries the red-team ring and that is the fact a
                        person scans for. It is outside the clickable region, so
                        choosing rows for a batch never also opens a record. */}
                    <SelectBox
                      id={o.id}
                      label={`Select ${o.title}`}
                      selection={picked}
                      disabled={busyIds.has(o.id)}
                    />
                  </>
                }
              />
            );
          })}
        </Block>
      ) : null}

      {/* AND THE SAME DOOR WHEN THERE IS A QUEUE, because the mid-chain entry
          is not a day-one problem. A person who arrives with a bet in their head
          has it whether or not the ranking is empty, and putting the composer
          only on the empty state would mean the station stops accepting new bets
          the moment it has one. Below the ranking rather than above it: the call
          in front of you outranks the next one you might make.

          Not rendered on the empty branch, which mounts its own copy inside the
          empty state where the sentence explaining it already lives. */}
      {activeOpp ? (
        <Block
          title="Name a bet"
          sub="Records it verbatim, scores it neutrally, and red-teams it in the same press. No trip through Discover."
        >
          <NameABet pending={nameBet.isPending} onName={(idea) => nameBet.mutate(idea)} />
          {nameBet.isPending ? (
            <AgentPulse
              label={`${challengerName} is tearing it down`}
              seed={CHALLENGER}
              detail={<>the bet you just named, against what the record already settled</>}
            />
          ) : null}
        </Block>
      ) : null}

      <LineageDrawer
        open={!!lineageId}
        onOpenChange={(open) => !open && setLineageId(null)}
        kind="opportunity"
        id={lineageId}
        title={rows.find((o) => o.id === lineageId)?.title}
      />
      {/* The record of whichever bet was opened, with that bet's own ranking
          context, and every write addressed to it. It reads the entry already
          resolved by the ranking rather than re-deriving one. */}
      <OpportunityDetailSheet
        open={!!openOpp}
        onOpenChange={(open) => !open && setOpenId(null)}
        opportunity={openOpp}
        verdict={openVerdict}
        rank={openRanked?.rank}
        designation={openRanked?.designation}
        rationale={openRanked?.rationale}
        nextAction={openRanked?.nextAction}
        busy={openBusy}
        challengePending={challenge.isPending && openBusy}
        draftPending={draftSpec.isPending && openBusy}
        onChallenge={() => openOpp && challenge.mutate(openOpp.id)}
        onDraftSpec={() => openOpp && draftSpec.mutate(openOpp.id)}
        onViewLineage={() => {
          if (!openId) return;
          setLineageId(openId);
          setOpenId(null);
        }}
        onSetStatus={(status) => openOpp && setStatus.mutate({ id: openOpp.id, status })}
        /* THE GUARD HAS TO SURVIVE THE QUESTION IT IS GUARDING.
           This handler used to call setOpenId(null) and only then await
           askDelete, and openId is the only thing standing between the confirm
           dialog and the gate keys: the effect that binds k, c and x returns
           early while a record is open. Clearing it first re-armed all three
           for the entire life of "Delete this bet?", and they are addressed to
           `activeOpp`, the bet under the Gate, not to the bet the dialog names.

           "x" was the expensive one. It is the obvious way to wave a dialog
           away, it was still DRAWN on the keycaps behind the scrim, so it read
           as the offered exit, and pressing it dropped a different bet than the
           one you were reading while the question about this one was still on
           screen. The receipt then named a bet the person had not touched, and
           the delete they came for went ahead as well the moment they answered.

           Nothing caught it because both statements are correct in isolation
           and they sit in the order anyone would write them. The only thing
           separating them is an await, which occupies no line in a diff. Tests
           did not see it either: it needs a modal owned by ConfirmProvider and
           a window keydown owned by this route to be live at the same instant,
           and no test in the suite had ever put both on screen together.

           Held on openId rather than on a second `confirming` flag, because
           openId already carries the fact the effect actually cares about,
           which is that an overlay owns this surface's keyboard. A parallel
           flag would be a second source of truth for one fact, the effect would
           have to check both, and the next overlay added here would have to
           remember all of them. This is the same shape as onViewLineage above,
           which hands the guard to lineageId before it lets go of openId, so
           the keyboard is never unowned for a frame.

           The record now closes only on a yes. On a no you are back on the bet
           you were reading, which is what Cancel means; it used to vanish for a
           deletion that never happened. */
        onDelete={() => {
          if (!openOpp) return;
          void askDelete(openOpp).then((deleted) => {
            if (deleted) setOpenId(null);
          });
        }}
      />
    </Surface>
  );
}

export const Route = createFileRoute("/_authenticated/decide")({
  component: DecideSurface,
  head: () => ({ meta: [{ title: "Decide · Supaprod" }] }),
  errorComponent: ({ error }) => {
    console.error("[Decide] route crashed:", error);
    return (
      <Surface>
        <PageHead
          title="Decide did not load."
          sub="The ranked bets and their history are safe on the record."
        />
        <Failed onRetry={() => window.location.reload()} retryLabel="Reload">
          The surface crashed while rendering.
        </Failed>
      </Surface>
    );
  },
});
