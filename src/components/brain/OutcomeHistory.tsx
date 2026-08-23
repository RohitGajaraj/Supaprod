/**
 * THE LEARN FACE'S DEPTH HALF. Brain > Outcomes, mounted beside
 * CompoundingPanel.
 *
 * WHY THIS FILE EXISTS. The founder named Learn among the stations needing
 * depth: show what was learned, from what evidence, with what score movement,
 * connected back to the bet it graded. Judged against the Decide sheet's
 * OutcomeHistoryBlock (src/components/discover/OpportunityDetailSheet.tsx),
 * the Outcomes tab had three gaps, and this closes them without touching the
 * files other lanes own:
 *
 *   1. WHY WAS MISSING PER ROW. The feed (knowledge/CompoundingPanel.tsx)
 *      deliberately killed the clamped summary -- right for an index row --
 *      so the recorded memo existed only behind the ?learning= drill. Every
 *      row here carries the memo in full.
 *   2. THE BET WAS TWO CLICKS AWAY. Feed row -> drill -> "Trace it in the
 *      graph". Here the row's own click opens the bet, reusing the exact
 *      door LearningDetail.tsx:220 already wired (/brain?tab=graph with
 *      focusKind/focusId). /decide exposes no search param for opening a
 *      specific bet, so the graph focus is the one honest destination.
 *   3. NO VERDICT SPLIT. The feed counts total outcomes and how many
 *      re-ranked; nothing said how many paid off against missed. This draws
 *      the split and the net ICE movement, computed by moat-vis's
 *      rescoresOf/round1 -- the same arithmetic describeCompounding prints.
 *
 * REUSED, NOT INVENTED: the sheet block's anatomy (RecordSpeaks rows,
 * evidence = verdict in OUTCOME_TONE colour + rescoreNoteOf delta note, body
 * = recorded summary), its cache discipline (this read is CHARACTER-IDENTICAL
 * to CompoundingPanel's ["learnings", workspace] key, so mounting this costs
 * zero extra requests on the tab), and its silence contract: while pending,
 * on error and when there are no rows this renders null, because the host
 * surface above already owns the loading, failed and empty states for these
 * exact reads -- the same reasoning that block records for staying quiet on
 * a refused read.
 *
 * NOT SAID TWICE: when no outcome has moved a ranking this region draws no
 * "not yet" line, because the guidance region above the tabs already admits
 * exactly that on every tab.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { listLearnings } from "@/lib/outcome.functions";
import { rescoreNoteOf, rescoresOf, round1 } from "@/lib/moat-vis";
import { useWorkspace } from "@/hooks/use-workspace";
import { Figure, Region } from "@/components/meridian/surface-parts";
import { RecordLine } from "@/components/brain/record-parts";
import { whenOf } from "@/components/knowledge/CompoundingPanel";

/** Same map, same values, as the sheet block's OUTCOME_TONE: the three hues
 *  that carry an outcome, mixed reading as hold because a mixed result waits
 *  on a condition to be read either way. */
const OUTCOME_TONE: Record<"validated" | "missed" | "mixed", string> = {
  validated: "var(--mrd-pass)",
  missed: "var(--mrd-fail)",
  mixed: "var(--mrd-hold)",
};

/** What came back, in the route's own words (recordHeadline's verdictLine). */
function verdictWord(verdict: "validated" | "missed" | "mixed"): string {
  if (verdict === "validated") return "paid off";
  if (verdict === "missed") return "did not pay off";
  return "came back mixed";
}

type Row = {
  id: string;
  opportunity_id: string | null;
  verdict: "validated" | "missed" | "mixed";
  summary: string;
  metric_label: string | null;
  metric_value: string | null;
  prior_ice: number | string | null;
  new_ice: number | string | null;
  created_at: string;
  opportunity_title: string | null;
};

export function OutcomeHistory() {
  const navigate = useNavigate();
  const { activeWorkspaceId } = useWorkspace();
  const fLearnings = useServerFn(listLearnings);
  // Character-identical to CompoundingPanel's key on this same tab: a cache
  // read, never a second request. Scoped like the panel's, not the Decide
  // sheet's bare key, because HERE the hosting surface fills the scoped one.
  const q = useQuery({
    queryKey: ["learnings", activeWorkspaceId],
    queryFn: () => fLearnings({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
    select: (d) => (d?.learnings ?? []) as unknown as Row[],
  });

  const rows = q.data ?? [];
  if (q.isPending || q.isError || rows.length === 0) return null;

  const paidOff = rows.filter((l) => l.verdict === "validated").length;
  const missed = rows.filter((l) => l.verdict === "missed").length;
  const mixed = rows.filter((l) => l.verdict === "mixed").length;
  const moved = rescoresOf(rows);
  const netIce = round1(moved.reduce((sum, r) => sum + r.delta, 0));

  return (
    <Region
      title="What the outcomes taught"
      sub="Every memo on the record, newest first. Click a row to open the bet it graded."
    >
      {/* The score so far, drawn only in facts we hold: a verdict class with
          none of its kind draws nothing, and the net movement appears only
          when something actually moved. */}
      <p className="mb-mrd-4 text-mrd-label leading-mrd-snug text-mrd-mute">
        <Figure>{rows.length}</Figure> outcomes recorded
        {paidOff > 0 ? (
          <>
            {" · "}
            <span className="text-mrd-pass">
              <Figure>{paidOff}</Figure> paid off
            </span>
          </>
        ) : null}
        {mixed > 0 ? (
          <>
            {" · "}
            <Figure>{mixed}</Figure> mixed
          </>
        ) : null}
        {missed > 0 ? (
          <>
            {" · "}
            <span className="text-mrd-fail">
              <Figure>{missed}</Figure> did not pay off
            </span>
          </>
        ) : null}
        {moved.length > 0 && netIce !== 0 ? (
          <>
            {" · priorities moved a net "}
            <Figure>
              {netIce > 0 ? "+" : ""}
              {netIce.toFixed(1)}
            </Figure>{" "}
            ICE
          </>
        ) : null}
        .
      </p>

      <div className="flex flex-col">
        {rows.map((l) => {
          const note = rescoreNoteOf(l);
          return (
            <RecordLine
              key={l.id}
              lead={l.opportunity_title ?? "An outcome memo"}
              sub={
                <>
                  <span style={{ color: OUTCOME_TONE[l.verdict] }}>{verdictWord(l.verdict)}</span>
                  {note ? <> · {note}</> : null}
                  {l.metric_label && l.metric_value ? (
                    <>
                      {" · "}
                      {l.metric_label} {l.metric_value}
                    </>
                  ) : null}
                  <span className="mt-0.5 block text-mrd-body text-mrd-prose">
                    {l.summary || "No memo was written down."}
                  </span>
                </>
              }
              time={whenOf(l.created_at)}
              onClick={
                l.opportunity_id
                  ? () =>
                      navigate({
                        to: "/brain",
                        search: {
                          tab: "graph",
                          focusKind: "opportunity",
                          focusId: l.opportunity_id!,
                        },
                      })
                  : undefined
              }
            />
          );
        })}
      </div>
    </Region>
  );
}
