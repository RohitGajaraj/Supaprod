/**
 * The compounding feed: what shipped, how it landed, and where memory re-ranked
 * a priority because of it. Brain > Learnings.
 *
 * Ported to the --sp-* system. The surface puts this panel in a Block and
 * deliberately suppresses its own record recess on the learnings tab, so this
 * file owns the INTERIOR only, and the record speaks here.
 *
 *   KILLED the bordered Card wrapper. The surface already puts this in a Block;
 *     a bordered box inside a region is a card in a card.
 *   KILLED the uppercase mono count line and the MonoLabel error head. Both were
 *     a second heading grammar inside a section the surface already titled.
 *   KILLED the VerdictChip and the AuditTag. A chip is a coloured box saying a
 *     word; the word is enough, and green and red already carry the outcome. The
 *     audit ref is a third element on a list row and lives in LearningDetail,
 *     which is the click.
 *   KILLED the two-line clamped summary on every row. A rationale ellipsised at
 *     two lines is not a rationale, it is the shape of one. The whole memo is
 *     one click away, and the LATEST one is quoted in full by the record above.
 *   PROMOTED describeCompounding into the Record recess: memory re-scoring your
 *     calls from real outcomes is the single most differentiated claim in the
 *     product, and it gets the one lit surface rather than a paragraph.
 *
 * ATTRIBUTION. learnings.recorded_by_agent_slug is the author (the Historian, in
 * practice). A row with no slug reads "unattributed" rather than borrowing a
 * name the record does not hold.
 *
 *   KILLED the VERDICT_TONE export and its VerdictTone import (2026-07-29). The
 *     chip it fed is retired, LearningDetail no longer draws one, and nothing
 *     else in the app read it. The outcome is a WORD now, and OUTCOME below is
 *     the one map both this feed and the drill read.
 *
 * UNCHANGED: getCompounding / listLearnings, the ?tab=learnings&learning= drill
 * target, and the exported whenOf / deltaOf that LearningDetail and the tests
 * import from here.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * SCOPED TO THE ACTIVE WORKSPACE, 2026-08-10, and it was the last unscoped read
 * left on this surface.
 *
 * The leak was measured in production before it was fixed on the surface above:
 * five people belong to more than one workspace, four of them to a seeded demo
 * workspace, and one REAL account read 21 learnings of which 5 were fiction.
 * Brain's route file was scoped in that pass and THIS PANEL WAS NOT, so the
 * page ended up with two different readings of the same table on one screen:
 * the headline counted one workspace and the feed directly under it counted
 * every workspace the reader belongs to.
 *
 * That is the worst failure available on this particular surface. A wrong
 * number is recoverable. A believable number about somebody else's work,
 * printed under a heading that says the record compounds, is not auditable by
 * the person reading it.
 *
 * `listLearnings` has taken a workspaceId since it was written and this call
 * simply never passed one. Both keys now carry the workspace, so a switch
 * refetches instead of serving the previous workspace's rows, and the panel
 * shares one cache entry with the route above rather than issuing its own read.
 * Prefix invalidation still works: SettlePanel and OutcomeCard invalidate
 * ["learnings"], which matches ["learnings", ws] as a prefix.
 */
import { useServerFn } from "@tanstack/react-start";
import { Row } from "@/components/meridian/rows";
import {
  Num,
  Reading,
  ReadFailed,
  NothingYet,
  RecordSpeaks,
} from "@/components/meridian/surface-parts";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { getCompounding } from "@/lib/today.functions";
import { listLearnings } from "@/lib/outcome.functions";
import { describeCompounding } from "@/lib/moat-vis";
import { agentDisplayName } from "@/lib/agent-vocabulary";
import { useWorkspace } from "@/hooks/use-workspace";
import { AgentMark } from "@/components/meridian/marks";
import { Provenance } from "./EvidenceQuality";

/** The outcome in plain words. Green and red carry outcomes and they own these
 *  two; a mixed result is not one, so it stays monochrome. */
const OUTCOME: Record<"validated" | "missed" | "mixed", { word: string; tone: string }> = {
  validated: { word: "It worked", tone: "sp-pass" },
  missed: { word: "It missed", tone: "sp-fail" },
  mixed: { word: "Mixed", tone: "" },
};

/** Same "when" rhythm as LearningDetail: time today, "Yesterday", else "Jun 9". */
export function whenOf(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOfDay = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
  if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** ICE delta of one learning, or null when it did not move a ranking.
 * Mirrors moat-vis rescoresOf (round to 0.1, jitter is not a move). */
export function deltaOf(l: {
  prior_ice: number | string | null;
  new_ice: number | string | null;
}): number | null {
  const p = l.prior_ice == null ? null : Number(l.prior_ice);
  const n = l.new_ice == null ? null : Number(l.new_ice);
  if (p == null || n == null || !Number.isFinite(p) || !Number.isFinite(n)) return null;
  const d = Math.round((n - p) * 10) / 10;
  return d === 0 ? null : d;
}

/**
 * The month strip: verdict counts for this month and the two before it,
 * oldest first, computed from the outcomes already on screen.
 *
 * WHY NOT buildTimeline from brain-insights.functions.ts: that module imports
 * runtime.server and calibrate-insights.server at its top level, so reaching
 * into it from a client component would drag the AI chokepoint into the
 * browser bundle to borrow twenty lines of arithmetic. The bucketing here is
 * the learnings-only slice of it (ISO month key, fixed window) and nothing
 * more; if the two ever need to agree on more than that, the shared half
 * moves to a client-safe module rather than this file growing an import.
 *
 * Month keys are UTC slices of the ISO timestamp, matching monthKey there.
 */
export type MonthTally = {
  key: string;
  label: string;
  validated: number;
  missed: number;
  mixed: number;
};

export function monthStrip(
  learnings: { verdict?: string | null; created_at: string }[],
  now: Date = new Date(),
): MonthTally[] {
  const keys: string[] = [];
  for (let i = 2; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  const tally = new Map<string, MonthTally>(
    keys.map((k) => [
      k,
      {
        key: k,
        label: new Date(`${k}-01T00:00:00Z`).toLocaleDateString([], {
          month: "short",
          timeZone: "UTC",
        }),
        validated: 0,
        missed: 0,
        mixed: 0,
      },
    ]),
  );
  for (const l of Array.isArray(learnings) ? learnings : []) {
    const b = typeof l.created_at === "string" ? tally.get(l.created_at.slice(0, 7)) : undefined;
    if (!b) continue;
    if (l.verdict === "validated") b.validated++;
    else if (l.verdict === "missed") b.missed++;
    else if (l.verdict === "mixed") b.mixed++;
  }
  return keys.map((k) => tally.get(k)!);
}

/** Who wrote this down. The column is nullable, so an unsigned row says so. */
function recordedBy(slug: string | null): string {
  return slug ? `${agentDisplayName(slug)} recorded it` : "unattributed";
}

/**
 * WHAT THIS ROW IS, in the best name the record actually holds for it.
 *
 * ── TWENTY-FOUR ROWS SAID "An outcome memo" (2026-09-02) ────────────────────
 * The lead was `l.opportunity_title ?? "An outcome memo"`, and the lead is the
 * only line on the row at ink weight -- the one a reader scans down. Measured
 * on the live record: of the twelve outcomes on the workspace this was read on,
 * ZERO carry an `opportunity_id`, so the join returns no title and every single
 * row led with the identical four words. A value printed identically on every
 * row distinguishes nothing; twelve rows of it is a list with no index.
 *
 * `opportunity_title` being null is not an accident to be papered over either.
 * An outcome can be recorded against a spec, or by an agent with nothing linked
 * at all, and those are ordinary rows rather than broken ones. So the fallback
 * is a LADDER through what such a row does hold, ordered by how much of an
 * identity each thing is:
 *
 *   1. The bet's title. The row's real name when it has one.
 *   2. `metric_label`. What the outcome was measured on ("checkout
 *      completion", "lost checklist rate"). A name, and it is already on the
 *      row and rendered nowhere.
 *   3. The memo. Not a name, and the last resort for exactly that reason -- but
 *      it is the ONLY thing left that tells one of these rows from another, and
 *      a row that cannot be told from its neighbour is worse than a row led by
 *      a sentence. `Row`'s `tight` clips it to one line and hands the whole
 *      string to the tooltip, and the row's own click opens `LearningDetail`,
 *      which prints the memo in full. That is the case `rows.tsx` names as the
 *      one where the clip is right: "a scan line whose full content has a
 *      detail view to open".
 *
 * THIS IS NOT THE CLAMPED SUMMARY COMING BACK. The header above records that
 * being killed, and the reasoning holds: a two-line ellipsised rationale under
 * every row is the shape of a rationale rather than one. This is a different
 * thing -- a one-line lead, on the rows that have no other name, where the
 * alternative is four words that are the same on all of them.
 *
 * On the workspace measured, this takes the screen from twelve identical leads
 * to twelve distinct ones: seven named by their metric, five by their memo.
 */
function leadOf(l: {
  opportunity_title?: string | null;
  metric_label?: string | null;
  summary?: string | null;
}): string {
  const title = l.opportunity_title?.trim();
  if (title) return title;
  const metric = l.metric_label?.trim();
  if (metric) return metric;
  /* Collapsed, because a memo typed into a textarea carries newlines and a
     lead is one line by construction. */
  const memo = l.summary?.replace(/\s+/g, " ").trim();
  if (memo) return memo;
  return "An outcome memo";
}

export function CompoundingPanel() {
  const navigate = useNavigate();
  const fetchCompounding = useServerFn(getCompounding);
  const fetchLearnings = useServerFn(listLearnings);
  const { activeWorkspaceId } = useWorkspace();
  // Character-identical to the route above's key, so this is a second consumer
  // of one request rather than a second request, and the headline and the feed
  // can never read from two different scopes on one screen.
  const q = useQuery({
    queryKey: ["compounding", activeWorkspaceId],
    queryFn: () => fetchCompounding({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
  });
  const lq = useQuery({
    queryKey: ["learnings", activeWorkspaceId],
    queryFn: () => fetchLearnings({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
  });

  const summary = q.data?.summary;
  const headline = summary ? describeCompounding(summary) : null;
  const learnings = lq.data?.learnings ?? [];
  const rescoreCount = learnings.filter((l) => deltaOf(l) != null).length;
  const strip = monthStrip(learnings);
  // A window with nothing in it is not a fact worth three empty cells: if every
  // outcome on screen is older than two months, the strip stays silent rather
  // than performing recency that is not there.
  const stripHasSignal = strip.some((m) => m.validated + m.missed + m.mixed > 0);

  /**
   * A COLD LOAD MUST NOT PAINT AN EMPTY BOX WITH A HEADING ON IT.
   *
   * This was `return null`, and the surface mounts this panel INSIDE a Block it
   * has already drawn, so on every first visit the reader got a bordered region
   * with a title and nothing whatsoever in it, for as long as two requests took.
   * That is the empty state's shape worn by a read still in flight, which is the
   * exact confusion the three primitives exist to prevent. Loading is the third
   * fact and it says so in words.
   */
  if (q.isLoading || lq.isLoading) return <Reading>Reading what the outcomes taught.</Reading>;

  // A load failure must read as a failure, not as "the loop produced nothing".
  if (q.isError || lq.isError) {
    return (
      <ReadFailed
        error={q.error ?? lq.error}
        onRetry={() => {
          void q.refetch();
          void lq.refetch();
        }}
      >
        The learnings did not load.
      </ReadFailed>
    );
  }

  if (!learnings.length) {
    return (
      <NothingYet>
        No outcomes recorded yet. When you record what a shipped bet actually did, the memo lands
        here and memory re-ranks the priority it touched.
      </NothingYet>
    );
  }

  return (
    <div>
      {/* The record speaking. One number per meaning: the claim counts what
          memory re-scored, the evidence counts what is listed below, so the two
          can never read as a contradiction. */}
      {headline ? (
        <RecordSpeaks
          evidence={
            <>
              <Num>{learnings.length}</Num>
              {learnings.length === 50 ? " most recent outcomes · " : " recorded outcomes · "}
              <Num>{rescoreCount}</Num> re-ranked a priority
            </>
          }
        >
          {headline}
        </RecordSpeaks>
      ) : null}

      {/* What the last three months taught, oldest first. One line, computed
          from the outcomes already fetched above; no second read. Monochrome
          on purpose: the per-row words below carry colour, and an aggregate
          wearing it would outshout the rows it summarises. */}
      {stripHasSignal ? (
        <div className="text-mrd-small text-mrd-mute" style={{ marginTop: "var(--mrd-s5)" }}>
          {strip.map((m, i) => {
            const counts: [number, string][] = [
              [m.validated, "worked"],
              [m.missed, "missed"],
              [m.mixed, "mixed"],
            ];
            return (
              <span key={m.key}>
                {i > 0 ? " · " : ""}
                {m.label}:{" "}
                {counts.some(([n]) => n > 0) ? (
                  <>
                    {counts
                      .filter(([n]) => n > 0)
                      .map(([n, word], j) => (
                        <span key={word}>
                          {j > 0 ? ", " : ""}
                          <Num>{n}</Num> {word}
                        </span>
                      ))}
                  </>
                ) : (
                  "nothing recorded"
                )}
              </span>
            );
          })}
        </div>
      ) : null}

      {/*
       * HOW OFTEN THE LOOP ACTUALLY CLOSES, stated rather than counted by eye.
       *
       * An outcome graded against a forecast written before anyone knew the
       * answer is the whole claim of this product. An outcome with no forecast
       * behind it is still a real outcome, and it is NOT that claim. This feed
       * showed both identically, so the one number that says whether the loop
       * is closing was invisible on the page built to show it.
       *
       * Measured on the live record while this was written: 42 of 163 outcomes
       * had a written expectation. That is not a footnote, it is most of the
       * feed, and a reader is owed it.
       *
       * Counted off the same `learnings` the rows below render, never a second
       * query, so the sentence and the rows cannot disagree. The population is
       * named for the same reason it is on the decisions list: this is what is
       * on screen, not a claim about the whole record.
       */}
      {learnings.length > 0 ? (
        <p
          style={{
            marginTop: "var(--mrd-s5)",
            fontSize: "var(--mrd-t-micro)",
            color: "var(--mrd-mute)",
          }}
        >
          <Num>{learnings.filter((l) => l.forecast_claim).length}</Num> of{" "}
          <Num>{learnings.length}</Num>{" "}
          {learnings.length === 1 ? "outcome here was" : "outcomes here were"} graded against an
          expectation written before the result was known.
          {learnings.filter((l) => l.forecast_claim).length === 0
            ? " None of them can show whether the call was right."
            : null}
        </p>
      ) : null}

      <div style={{ marginTop: "var(--mrd-s5)" }}>
        {learnings.map((l) => {
          const delta = deltaOf(l);
          const outcome = OUTCOME[l.verdict];
          return (
            <Row
              key={l.id}
              tight
              marks={<AgentMark slug={l.recorded_by_agent_slug} state="quiet" />}
              lead={leadOf(l)}
              // A different fact from the lead, never more of it: how it landed,
              // who wrote it down, and whether it moved a ranking. The memo
              // itself is one click away.
              // TWO MARKS, BECAUSE THE ROW CARRIES TWO GRADES OF EVIDENCE AND
              // DREW THEM IDENTICALLY. The verdict is the workspace's own: a
              // bet shipped and somebody said how it landed. The re-rank next
              // to it is the engine's arithmetic on top of that, which is a
              // weaker thing, and it is the number this page leans on hardest
              // when it claims the record compounds. Marking them apart is what
              // makes that claim checkable instead of merely stated -- and on a
              // young record the ember is what is missing, which is the honest
              // reading of a workspace nobody has lived in yet.
              sub={
                <>
                  <Provenance source="mine" />
                  <span className={outcome.tone || undefined}>{outcome.word}</span>
                  {" · "}
                  {recordedBy(l.recorded_by_agent_slug)}
                  {/*
                   * WAS THERE A CALL TO GRADE THIS AGAINST, and it is the one
                   * fact this feed was missing. A verdict on its own is a
                   * status word. The forecast written at Decide, before anyone
                   * knew the answer, is the half no competitor can reconstruct
                   * afterwards, and this feed existed to show the record
                   * compounding while carrying only the second half of it.
                   *
                   * THE CLAIM ITSELF IS PRINTED HERE NOW, reversing what this
                   * comment used to say. It argued the row should carry only
                   * whether the pairing EXISTS, because a forecast sentence
                   * would truncate and push the verdict off the line.
                   *
                   * The founder asked for the opposite in plain words: see what
                   * they expected BESIDE what actually happened. "against a
                   * written call" tells a reader a forecast exists without
                   * telling them what it said, which is the pairing described
                   * rather than shown -- on the one feed that exists to show it.
                   *
                   * The length objection was real and is answered rather than
                   * ignored: the claim truncates ITSELF, so it can never push
                   * anything off the line, and the verdict is rendered BEFORE
                   * it and cannot be displaced. That is the pattern
                   * DecisionsPanel already uses for the same sentence on the
                   * other half of the pair, so the two now read alike.
                   *
                   * AND THE ABSENT CASE IS STATED RATHER THAN LEFT BLANK. A
                   * waived Decide (F-61) genuinely has nothing to compare
                   * against, and saying so is what stops a reader assuming we
                   * simply did not look. Marked `mine` rather than `inferred`
                   * because it is a fact about the record, not arithmetic on
                   * top of it.
                   */}
                  {" · "}
                  <Provenance source="mine" />
                  {l.forecast_claim ? (
                    <>
                      {"expected: "}
                      <span
                        title={l.forecast_claim}
                        style={{
                          display: "inline-block",
                          maxWidth: 260,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          verticalAlign: "bottom",
                        }}
                      >
                        {l.forecast_claim}
                      </span>
                    </>
                  ) : (
                    "no call was written"
                  )}
                  {delta != null ? (
                    <>
                      {" · "}
                      <Provenance source="inferred" />
                      {"re-ranked "}
                      <Num>
                        {delta >= 0 ? "+" : ""}
                        {delta.toFixed(1)}
                      </Num>{" "}
                      ICE
                    </>
                  ) : null}
                </>
              }
              time={whenOf(l.created_at)}
              onClick={() =>
                navigate({ to: "/brain", search: { tab: "learnings", learning: l.id } })
              }
            />
          );
        })}
      </div>
    </div>
  );
}
