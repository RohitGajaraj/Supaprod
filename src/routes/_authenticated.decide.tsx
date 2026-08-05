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
 */

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as React from "react";

import { useConfirm } from "@/hooks/use-confirm";
import { useWorkspace } from "@/hooks/use-workspace";
import { toast } from "@/lib/notify";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import {
  deleteOpportunity,
  generatePrd,
  getThemePrecedent,
  listOpportunities,
  listThemes,
  runCriticReview,
  updateOpportunity,
} from "@/lib/discovery.functions";
import { listLearnings } from "@/lib/outcome.functions";
import { getProvenance } from "@/lib/lineage.functions";
import { getPrecedentCitations } from "@/lib/decision-judgment.functions";
import { getBriefAlignment } from "@/lib/brief-opportunity.functions";
import { alignmentForOpportunity } from "@/lib/brief-opportunity";
import { rescoreNoteOf } from "@/lib/moat-vis";
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
import { LineageDrawer } from "@/components/supaprod/LineageDrawer";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Choices,
  CtxBody,
  CtxHead,
  CtxRow,
  Empty,
  Failed,
  Loading,
  Gate,
  Line,
  Num,
  PageHead,
  Receipt,
  Record as RecordRecess,
  Row,
  Surface,
} from "@/components/shell/primitives";
import { AgentPulse } from "@/components/shell/AgentPulse";
import { useSpineStrip } from "@/components/shell/use-spine-strip";
import { CrewWorking } from "@/components/shell/CrewWorking";

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

/** What the reviewer concluded, in a sentence rather than a chip. */
function verdictSentence(verdict: VerdictWord, name: string): string {
  return verdict === "PENDING" ? "not reviewed yet" : `${name} says ${verdict.toLowerCase()}`;
}

function DecideSurface() {
  // The spine, lit on this station. One shared query across all seven
  // (use-spine-strip.ts), so an always-on strip costs one request, not seven.
  useSpineStrip("decide");
  const navigate = useNavigate();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const { activeProductId } = useWorkspace();

  const fOpps = useServerFn(listOpportunities);
  const fThemes = useServerFn(listThemes);
  const fLearnings = useServerFn(listLearnings);
  const fBriefAlignment = useServerFn(getBriefAlignment);
  const fCitations = useServerFn(getPrecedentCitations);
  const fCritic = useServerFn(runCriticReview);
  const fDraftSpec = useServerFn(generatePrd);
  const fUpdate = useServerFn(updateOpportunity);
  const fDelete = useServerFn(deleteOpportunity);
  const fThemePrecedent = useServerFn(getThemePrecedent);
  const fProvenance = useServerFn(getProvenance);

  // Same keys as before, so the detail sheet's own writes and the Discover
  // surface keep sharing one cache.
  const opps = useQuery({ queryKey: ["opportunities"], queryFn: () => withTimeout(fOpps()) });
  const themes = useQuery({
    queryKey: ["themes", activeProductId],
    queryFn: () => withTimeout(fThemes({ data: { productId: activeProductId } })),
  });
  const learnings = useQuery({
    queryKey: ["learnings"],
    queryFn: () => withTimeout(fLearnings()),
  });
  const briefAlignment = useQuery({
    queryKey: ["brief-alignment"],
    queryFn: () => withTimeout(fBriefAlignment()),
  });

  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [showAll, setShowAll] = React.useState(false);
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

  const lastRescoreAt = React.useMemo(() => {
    const list = learnings.data?.learnings ?? [];
    if (list.length === 0) return null;
    return list.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b))
      .created_at;
  }, [learnings.data]);

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
  const active = React.useMemo(
    () => ranked.find((r) => r.opp.id === selectedId) ?? ranked[0] ?? null,
    [ranked, selectedId],
  );
  // THE SELECTED BET STAYS IN THE QUEUE (founder, 2026-08-01). Filtering it out
  // meant the Gate changed under you with nothing on screen connecting it to
  // the row you pressed, and the queue silently renumbered around the gap.
  // `Row` already carries `focused`, so keeping it costs one prop.
  const others = ranked;
  const visibleOthers = showAll ? others : others.slice(0, VISIBLE_OTHERS);

  // The account's own record, cited at decision time, fetched only for what is
  // actually on screen and only once there is enough history to cite honestly.
  const visibleIds = React.useMemo(() => {
    const ids = [active?.opp.id, ...visibleOthers.map((r) => r.opp.id)].filter((id): id is string =>
      Boolean(id),
    );
    return ids.slice(0, MAX_PRECEDENT_IDS);
  }, [active, visibleOthers]);
  const hasEnoughOutcomes = (learnings.data?.learnings.length ?? 0) >= 3;
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

  const challenge = useMutation({
    mutationFn: (id: string) =>
      fCritic({ data: { target_kind: "opportunity" as const, target_id: id } }),
    onMutate: (id) => setBusy(id, true),
    onSuccess: () => {
      toast(`${challengerName} is red-teaming it. The teardown lands on Today, receipts attached.`);
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
    onSuccess: (r) => {
      // No success toast: this navigates straight to the spec it just wrote, and
      // arriving at the artifact is a stronger receipt than a word about it.
      // The rule's narrow exception, where the changed surface IS the receipt.
      void navigate({
        to: "/plan/spec/$id",
        params: { id: r.prd.id },
        search: { tab: "contract" },
      });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: OpportunityStatus }) =>
      fUpdate({ data: { id, status } }),
    onMutate: ({ id }) => setBusy(id, true),
    onSuccess: (_r, { id, status }) => {
      const title = rows.find((o) => o.id === id)?.title ?? "The bet";
      setReceipt({
        verb: status === "dropped" ? "You dropped it" : "You placed it",
        consequence:
          // It does NOT leave the queue, which is what this line used to claim:
          // nothing filters a dropped bet out of the ranking, so the old wording
          // was contradicted by the list directly underneath it. The row now
          // carries its lane, so a dropped bet reads as dropped and can be put
          // back with one press.
          status === "dropped"
            ? `${title} is dropped. Its evidence stays on the record, and so does the call.`
            : `${title} sits in ${STATUS_META[status].label}.`,
      });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (e: Error) =>
      setReceipt({ verb: "It did not move", consequence: e.message, failed: true }),
    onSettled: (_d, _e, { id }) => setBusy(id, false),
  });

  const del = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onMutate: (id) => setBusy(id, true),
    onSuccess: (_r, id) => {
      const title = rows.find((o) => o.id === id)?.title ?? "The bet";
      setReceipt({
        verb: "You deleted it",
        consequence: `${title} is gone from the queue. The signals behind it are untouched.`,
      });
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (e: Error) =>
      setReceipt({ verb: "It was not deleted", consequence: e.message, failed: true }),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  const activeOpp = active?.opp ?? null;
  const busy = activeOpp ? busyIds.has(activeOpp.id) : false;

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

  const askDelete = React.useCallback(
    async (opp: OpportunityDetailRecord) => {
      const ok = await confirm({
        title: "Delete this bet?",
        body: `This removes "${opp.title}" permanently. Its lineage and any linked signals stay, but the bet itself is gone.`,
        destructive: true,
        confirmLabel: "Delete bet",
      });
      if (ok) del.mutate(opp.id);
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
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      if (e.key === "k") draftSpec.mutate(id);
      else if (e.key === "c") challenge.mutate(id);
      else if (e.key === "x") setStatus.mutate({ id, status: "dropped" });
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeOpp, busy, openId, lineageId, draftSpec, challenge, setStatus]);

  const loading = opps.isLoading;

  // A fact assembled from real counts. It never claims a number it does not
  // have, and it stays silent while the counts are still loading.
  const headline = React.useMemo(() => {
    if (loading) return "Decide";
    if (opps.error) return "The bets did not load.";
    const n = ranked.length;
    if (n === 0) return "Nothing is ranked yet.";
    if (n === 1) return "One bet is ranked, and it is waiting on you.";
    return `${n} bets ranked, strongest first.`;
  }, [loading, opps.error, ranked.length]);

  const activeVerdict = activeOpp ? verdictFor(activeOpp) : "PENDING";
  const activeSignals = activeOpp?.theme_id
    ? (themeById.get(activeOpp.theme_id)?.frequency ?? null)
    : null;
  const activeLearning = activeOpp ? latestLearningByOpp.get(activeOpp.id) : undefined;
  const activeRescore = activeLearning ? rescoreNoteOf(activeLearning) : null;
  const activeCitation = activeOpp ? (citations.data?.citations[activeOpp.id] ?? null) : null;
  const rescoredAgo = ago(lastRescoreAt);

  return (
    <Surface
      context={
        activeOpp ? (
          <>
            <CtxHead>Who has touched it</CtxHead>
            {activeOpp.decided_by_agent_slug ? (
              <CtxRow
                mark={<AgentMark slug={activeOpp.decided_by_agent_slug} state="idle" />}
                name={agentDisplayName(activeOpp.decided_by_agent_slug)}
                sub="recorded the last call on it"
              />
            ) : null}
            {activeOpp.critic_review ? (
              <CtxRow
                mark={<AgentMark slug={CHALLENGER} state="idle" />}
                name={challengerName}
                sub={
                  <>
                    {verdictSentence(activeVerdict, challengerName)}
                    {typeof activeOpp.critic_review.confidence === "number" ? (
                      <>
                        {" at "}
                        <Num>{Math.round(activeOpp.critic_review.confidence * 100)}%</Num>
                        {" confidence"}
                      </>
                    ) : null}
                  </>
                }
              />
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
            ) : null}
            {/* THE SCORE STOPS BEING A READ-ONLY FACT.
                This column printed "ICE 7.3" and nothing on the surface could
                change it, on the one station whose entire job is the order those
                three numbers produce. `updateOpportunity` has always accepted
                them and nothing ever sent one. It sits here, where the number
                was already being read, rather than behind a control that would
                have to be found: three fields, arrow keys, and the queue
                re-ranks itself the moment a score lands. */}
            <IceEditor opportunity={activeOpp} disabled={busy} idPrefix="queue-ice" />
            <CtxBody>
              <Button variant="ghost" onClick={() => setLineageId(activeOpp.id)}>
                View the evidence
              </Button>
            </CtxBody>
          </>
        ) : null
      }
    >
      {/* THE AUTONOMOUS PATH, VISIBLE. Renders nothing unless an agent is
          genuinely mid-run, so it costs no space when the crew is idle and
          cannot show a step that did not happen. Every other pulse on this
          station is gated on a mutation the reader's own click started;
          this one is bound to the run. See use-live-agents.ts. */}
      <CrewWorking />
      <PageHead
        title={headline}
        sub={
          rescoredAgo === null ? (
            "Scores re-rank on their own whenever a new signal or outcome lands."
          ) : rescoredAgo === "now" ? (
            "Re-ranked just now, on its own, off a recorded outcome."
          ) : (
            <>
              Re-ranked <Num>{rescoredAgo}</Num> ago, on its own, off a recorded outcome.
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
                  <span key="critic" className="flex items-center gap-2">
                    <VerdictBadge
                      verdict={activeVerdict}
                      confidence={activeOpp.critic_review.confidence}
                    />
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
            <span key="consequence">
              Keeping it drafts the spec and moves it into Plan. Nothing ships from here.
            </span>,
          ]}
        >
          <Button
            variant="primary"
            shortcut="k"
            disabled={busy}
            onClick={() => draftSpec.mutate(activeOpp.id)}
          >
            Keep it
          </Button>
          <Button shortcut="c" disabled={busy} onClick={() => challenge.mutate(activeOpp.id)}>
            Challenge it
          </Button>
          <Button
            shortcut="x"
            disabled={busy}
            onClick={() => setStatus.mutate({ id: activeOpp.id, status: "dropped" })}
          >
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
           the next different thing: who acts, and where. */
        <>
          <Empty>
            Promote a signal on Discover and it lands here, scored and ranked against the record.
          </Empty>
          <Actions>
            <Button variant="ghost" onClick={() => void navigate({ to: "/discover" })}>
              Go to the signals
            </Button>
          </Actions>
        </>
      )}

      {/* Unlabelled and directly under the question: the recess announces
          itself, and a heading between the call and its precedent would put a
          third register in the way of the one moment that matters here. */}
      {activeCitation ? (
        <RecordRecess evidence={activeRescore ?? undefined}>{activeCitation}</RecordRecess>
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
              Those dispatch an agent and a second press costs a real run; this
              is one cheap column write where the last press wins. And a radio
              group that disables itself mid-decision throws focus to the body
              and loses the arrow keys, which is a worse failure than a double
              write nobody can perceive. */}
          <Choices
            label="Where this bet sits"
            value={activeOpp.status as OpportunityStatus}
            options={LANES}
            onPick={(status) => setStatus.mutate({ id: activeOpp.id, status })}
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
          sub="Press a bet to open its whole record. Decide it puts that bet under the question above."
          more={
            others.length > VISIBLE_OTHERS
              ? showAll
                ? "Show fewer"
                : `All ${others.length}`
              : undefined
          }
          onMore={() => setShowAll((v) => !v)}
        >
          {visibleOthers.map((r) => {
            const o = r.opp;
            const mark = o.decided_by_agent_slug ?? (o.critic_review ? CHALLENGER : null);
            const focused = o.id === active?.opp.id;
            return (
              <Row
                key={o.id}
                tight
                marks={<AgentMark slug={mark} state={mark ? "idle" : "quiet"} />}
                lead={o.title}
                // One line, one different fact: where it sits, what KIND of bet
                // it is, what the reviewer concluded, and which lane it is in.
                // The score that produced the rank is the ranking's own input and
                // belongs to the bet in focus. The designation is the queue's
                // read-at-a-glance verb: ranking.ts has always derived it, but
                // until now nothing on the surface rendered it, so a scanning
                // user saw an ordered list with no stated reason why one bet
                // outranks the next. The lane joined it on 2026-08-02: Now, Next
                // and Later are settable from this surface, so the queue has to
                // be able to say which one a bet is already in.
                sub={
                  <>
                    <Num>#{r.rank}</Num>
                    {" · "}
                    {r.isBestBet ? (
                      <BestBetStamp />
                    ) : (
                      <DesignationTag designation={r.designation} />
                    )}
                    {(r.isBestBet || r.designation) && " · "}
                    {verdictSentence(verdictFor(o), challengerName)}
                    {o.status ? (
                      <>
                        {" · "}
                        <StatusPill status={o.status} />
                      </>
                    ) : null}
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
                }
              />
            );
          })}
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
        onDelete={() => {
          if (!openOpp) return;
          const target = openOpp;
          setOpenId(null);
          void askDelete(target);
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
