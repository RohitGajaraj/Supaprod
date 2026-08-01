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
import { iceNum, rescoreNoteOf } from "@/lib/moat-vis";
import { verdictFor, withTimeout, type VerdictWord } from "@/components/discover/format";
import { outcomeSupportFromCounts, rankOpportunities } from "@/components/discover/ranking";
import type { OpportunityStatus } from "@/components/discover/OpportunityRow";
import {
  OpportunityDetailSheet,
  type OpportunityDetailRecord,
} from "@/components/discover/OpportunityDetailSheet";
import { LineageDrawer } from "@/components/supaprod/LineageDrawer";
import {
  Actions,
  AgentMark,
  Block,
  Button,
  Empty,
  Failed,
  Gate,
  Num,
  PageHead,
  Record as RecordRecess,
  Row,
  Surface,
} from "@/components/shell/primitives";
import { useSpineStrip } from "@/components/shell/use-spine-strip";

/** The agent that red-teams a call, named from the one catalog so this page
 *  never hard-codes a display name that the catalog can rename. */
const CHALLENGER = "critic";

/** How many bets sit under the gate before the queue asks to be expanded. */
const VISIBLE_OTHERS = 5;
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
  const others = React.useMemo(
    () => ranked.filter((r) => r.opp.id !== active?.opp.id),
    [ranked, active],
  );
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
      toast.success("Spec drafted.");
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
    onSuccess: (_r, { status }) => {
      toast.success(status === "dropped" ? "Dropped." : `Moved to ${status}.`);
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, { id }) => setBusy(id, false),
  });

  const del = useMutation({
    mutationFn: (id: string) => fDelete({ data: { id } }),
    onMutate: (id) => setBusy(id, true),
    onSuccess: () => {
      toast.success("Deleted.");
      void qc.invalidateQueries({ queryKey: ["opportunities"] });
    },
    onError: (e: Error) => toast.error(e.message),
    onSettled: (_d, _e, id) => setBusy(id, false),
  });

  const activeOpp = active?.opp ?? null;
  const busy = activeOpp ? busyIds.has(activeOpp.id) : false;

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
    if (loading) return "Reading the ranked bets.";
    if (opps.error) return "The bets did not load.";
    const n = ranked.length;
    if (n === 0) return "Nothing is ranked yet.";
    if (n === 1) return "One bet is ranked, and it is waiting on you.";
    return `${n} bets ranked, strongest first.`;
  }, [loading, opps.error, ranked.length]);

  const activeVerdict = activeOpp ? verdictFor(activeOpp) : "PENDING";
  const activeIce = activeOpp ? iceNum(activeOpp.ice_score) : null;
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
            <div className="sp-ctx-head">Who has touched it</div>
            {activeOpp.decided_by_agent_slug ? (
              <div className="sp-ctx-row">
                <AgentMark slug={activeOpp.decided_by_agent_slug} state="idle" />
                <span>
                  <span className="sp-ctx-name">
                    {agentDisplayName(activeOpp.decided_by_agent_slug)}
                  </span>
                  <span className="sp-ctx-sub">recorded the last call on it</span>
                </span>
              </div>
            ) : null}
            {activeOpp.critic_review ? (
              <div className="sp-ctx-row">
                <AgentMark slug={CHALLENGER} state="idle" />
                <span>
                  <span className="sp-ctx-name">{challengerName}</span>
                  <span className="sp-ctx-sub">
                    {verdictSentence(activeVerdict, challengerName)}
                    {typeof activeOpp.critic_review.confidence === "number" ? (
                      <>
                        {" at "}
                        <Num>{Math.round(activeOpp.critic_review.confidence * 100)}%</Num>
                        {" confidence"}
                      </>
                    ) : null}
                  </span>
                </span>
              </div>
            ) : null}
            {!activeOpp.decided_by_agent_slug && !activeOpp.critic_review ? (
              <div className="sp-ctx-body">
                Nobody has reviewed it. Challenging it puts a teardown on the record before you call
                it.
              </div>
            ) : null}

            <div className="sp-ctx-head">Why it ranks here</div>
            <div className="sp-ctx-body">
              {active?.rationale}
              {active?.designation ? `. Reads as a ${active.designation}` : ""}.
            </div>

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
                <div className="sp-ctx-head">What this resembles</div>
                <div className="sp-ctx-body">
                  The record has been here before, on {themePrecedent.data.priorTheme.title}.
                </div>
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
                <div className="sp-ctx-head">What people actually said</div>
                {provenance.data.source_signals.slice(0, 4).map((s) => (
                  <div key={s.id} className="sp-ctx-row">
                    <span>
                      <span className="sp-ctx-name">
                        {(s.content ?? s.title ?? "").slice(0, 96)}
                      </span>
                      <span className="sp-ctx-sub">
                        {s.source ?? "unattributed"}, <Num>{ago(s.created_at)}</Num>
                      </span>
                    </span>
                  </div>
                ))}
                {provenance.data.source_signals.length > 4 ? (
                  <div className="sp-ctx-body">
                    <Num>{provenance.data.source_signals.length - 4}</Num> more said the same thing.
                  </div>
                ) : null}
              </>
            ) : null}

            {activeSignals !== null || activeIce !== null ? (
              <>
                <div className="sp-ctx-head">What backs it</div>
                <div className="sp-ctx-body">
                  {activeSignals !== null ? (
                    <>
                      <Num>{activeSignals}</Num> {activeSignals === 1 ? "signal" : "signals"} in the
                      record
                    </>
                  ) : null}
                  {activeSignals !== null && activeIce !== null ? " · " : null}
                  {activeIce !== null ? (
                    <>
                      ICE <Num>{activeIce.toFixed(1)}</Num>
                    </>
                  ) : null}
                </div>
                <div className="sp-ctx-body">
                  <Button variant="ghost" onClick={() => setLineageId(activeOpp.id)}>
                    View the evidence
                  </Button>
                </div>
              </>
            ) : null}
          </>
        ) : null
      }
    >
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
      ) : loading ? null : activeOpp ? (
        <Gate
          question={activeOpp.title}
          lines={[
            ...(activeOpp.problem ? [<span key="problem">{activeOpp.problem}</span>] : []),
            ...(activeOpp.critic_review?.summary
              ? [
                  <span key="critic">
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

      {/* Only when there is genuinely a queue behind the gate. With one bet
          ranked, a heading over an empty line is a panel that says nothing the
          headline has not already said, and it sits between the reader and the
          one question they came to answer. */}
      {others.length > 0 ? (
        <Block
          title="The other bets"
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
            return (
              <Row
                key={o.id}
                tight
                marks={<AgentMark slug={mark} state={mark ? "idle" : "quiet"} />}
                lead={o.title}
                // One line, one different fact: where it sits and what the
                // reviewer concluded. The score that produced the rank is
                // the ranking's own input and belongs to the bet in focus.
                sub={
                  <>
                    <Num>#{r.rank}</Num>
                    {" · "}
                    {verdictSentence(verdictFor(o), challengerName)}
                  </>
                }
                time={ago(o.updated_at)}
                onClick={() => setSelectedId(o.id)}
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
      {/* The sheet only ever opens on the bet under the gate, so it reads the
          ranking context already resolved for it rather than re-deriving one. */}
      <OpportunityDetailSheet
        open={!!openId}
        onOpenChange={(open) => !open && setOpenId(null)}
        opportunity={openId ? activeOpp : null}
        verdict={activeVerdict}
        rank={active?.rank}
        designation={active?.designation}
        rationale={active?.rationale}
        nextAction={active?.nextAction}
        busy={busy}
        challengePending={challenge.isPending && busy}
        draftPending={draftSpec.isPending && busy}
        onChallenge={() => activeOpp && challenge.mutate(activeOpp.id)}
        onDraftSpec={() => activeOpp && draftSpec.mutate(activeOpp.id)}
        onViewLineage={() => {
          if (!openId) return;
          setLineageId(openId);
          setOpenId(null);
        }}
        onSetStatus={(status) => activeOpp && setStatus.mutate({ id: activeOpp.id, status })}
        onDelete={() => {
          if (!activeOpp) return;
          setOpenId(null);
          void askDelete(activeOpp);
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
