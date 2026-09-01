/**
 * HOW THE OUTCOMES SPLIT. Brain > Outcomes, mounted under CompoundingPanel.
 *
 * ── THIS FILE USED TO DRAW A SECOND COPY OF THE FEED ABOVE IT (2026-09-02) ──
 *
 * It was written to close three gaps the founder named against the Decide
 * sheet's OutcomeHistoryBlock, and it closed them by listing every outcome a
 * second time, in its own vocabulary, directly beneath the list
 * `CompoundingPanel` had just drawn. On a real workspace that was twelve rows
 * printed twice on one screen, the same twelve, where the panel said "It
 * worked" and this said "paid off".
 *
 * The three gaps, checked one at a time against the record rather than against
 * the header that claimed them:
 *
 *   1. THE MEMO PER ROW. Real, and it reversed a ruling the panel above states
 *      in its own header: the clamped summary was killed there deliberately,
 *      because "a rationale ellipsised at two lines is not a rationale, it is
 *      the shape of one", and the whole memo is one click away at
 *      LearningDetail. Reversing that in the region underneath does not close a
 *      gap, it holds both positions at once. The memo is back to being one
 *      click away, and the panel's row lead now falls through to it when the
 *      record holds no other name for the row, which is the case that made the
 *      memo worth surfacing in the first place.
 *   2. THE BET, ONE CLICK AWAY. Not closed. Every row here carried
 *      "Click a row to open the bet it graded" in the region sub and opened the
 *      graph only when `opportunity_id` was set. Measured on the live record,
 *      2026-09-02: of the twelve outcomes on the workspace this was read on,
 *      ZERO carry an opportunity_id, so no row was clickable and the sentence
 *      promising it was false on all twelve. The panel's own row click
 *      (?tab=learnings&learning=) has no such condition and works on every row.
 *   3. NO VERDICT SPLIT. Real, and still unclosed anywhere else. Nothing on the
 *      tab says how many of the outcomes paid off against how many did not. The
 *      panel's headline counts re-scores, its evidence line counts the total,
 *      and its month strip splits by month rather than over the record.
 *
 * So the list is gone and the split is what is left. That is the whole of this
 * file now.
 *
 * WHAT IS DELIBERATELY NOT SAID HERE. The total ("12 outcomes recorded") and
 * the net ICE movement, both of which this region used to print. The panel
 * above states each of them already -- the total in `RecordSpeaks`'s evidence,
 * the net ICE inside `describeCompounding`'s headline -- and two computations
 * of one number on one screen is how the two come to disagree.
 *
 * THE READ IS STILL FREE. The query key stays CHARACTER-IDENTICAL to
 * CompoundingPanel's ["learnings", workspace], so this is a second consumer of
 * one request rather than a second request, and
 * `finished-work-that-never-reached-a-screen.test.ts` asserts exactly that.
 * The silence contract is unchanged too: pending, failed and empty all render
 * null, because the panel above owns those three states for this same read.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { listLearnings } from "@/lib/outcome.functions";
import { useWorkspace } from "@/hooks/use-workspace";
import { Figure, Region } from "@/components/meridian/surface-parts";

type Row = {
  verdict: "validated" | "missed" | "mixed";
};

export function OutcomeHistory() {
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

  /* Drawn only in facts we hold: a verdict class with none of its kind draws
     nothing at all, rather than a zero standing in for a finding. */
  const split: { key: string; count: number; word: string; tone: string }[] = [
    { key: "validated", count: 0, word: "paid off", tone: "text-mrd-pass" },
    { key: "mixed", count: 0, word: "came back mixed", tone: "" },
    { key: "missed", count: 0, word: "did not pay off", tone: "text-mrd-fail" },
  ];
  for (const l of rows) {
    const bucket = split.find((s) => s.key === l.verdict);
    if (bucket) bucket.count++;
  }
  const shown = split.filter((s) => s.count > 0);

  return (
    <Region title="How the outcomes landed">
      <p className="text-mrd-label leading-mrd-snug text-mrd-mute">
        {shown.map((s, i) => (
          <span key={s.key}>
            {i > 0 ? " · " : null}
            <span className={s.tone || undefined}>
              <Figure>{s.count}</Figure> {s.word}
            </span>
          </span>
        ))}
        .
      </p>
    </Region>
  );
}
