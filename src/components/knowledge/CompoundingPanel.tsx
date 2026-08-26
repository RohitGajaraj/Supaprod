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
        onRetry={() => {
          void q.refetch();
          void lq.refetch();
        }}
      >
        {((q.error ?? lq.error) as Error)?.message ?? "The learnings did not load."}
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

      <div style={{ marginTop: "var(--mrd-s5)" }}>
        {learnings.map((l) => {
          const delta = deltaOf(l);
          const outcome = OUTCOME[l.verdict];
          return (
            <Row
              key={l.id}
              tight
              marks={<AgentMark slug={l.recorded_by_agent_slug} state="quiet" />}
              lead={l.opportunity_title ?? "An outcome memo"}
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
                   * THE CLAIM ITSELF IS NOT PRINTED HERE ON PURPOSE. Row is one
                   * or two lines by founder ruling and depth is a click away;
                   * a forecast sentence would truncate and push the verdict off
                   * the line. What belongs at a glance is whether the pairing
                   * EXISTS, which is checkable in three words. The sentence is
                   * one click into the memo.
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
                  {l.forecast_claim ? "against a written call" : "no call was written"}
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
