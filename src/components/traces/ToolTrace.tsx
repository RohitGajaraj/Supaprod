import { Thinking, type ThinkingRow } from "@/components/meridian/Thinking";

/*
 * WHICH TOOLS THIS TRACE TOUCHED, in one line until asked.
 *
 * ── WHY THIS IS NOT THE HOP LIST A SECOND TIME ──────────────────────────
 * The hop list below it is the surface, and it is strictly time ordered across
 * both kinds of hop, because the loop never writes `tool_calls.event_id` and
 * time order is the only join that is honest. That ordering is right and it
 * costs the reader one thing: at forty hops there is no way to answer "which
 * tools did this run use" without scrolling the whole record and holding the
 * answer in your head. This answers it in one line, costs one line when nobody
 * asks, and hands each name back to the hop it belongs to on a click.
 *
 * It does NOT group tools under the model call that made them. That grouping is
 * exactly the false hierarchy this surface refuses to draw, because the only
 * evidence for it would be a timestamp.
 *
 * ── NOTHING THAT FAILED HIDES BEHIND THE FOLD ───────────────────────────
 * A fold that is shut by default may only ever hide things that are fine. So
 * the shut line counts the failures itself, and the hop list underneath still
 * carries each failed tool at full strength with its error text. Without the
 * count in the summary this component would be a way to not notice a failure,
 * which is worse than not having it.
 *
 * ── NO REASONING VARIANT, AND THAT IS A GAP RATHER THAN A CHOICE ────────
 * Thinking also draws reasoning, and this surface has none to draw: the loop
 * writes no reasoning text against a trace, and the run is where the thinking
 * between calls lives. Rendering the Reasoning variant off output previews
 * would be inventing a register, so it is left undrawn and reported instead.
 */

export type ToolTraceItem = {
  id: string;
  name: string;
  ok: boolean;
  /** Already formatted by the surface, so the one duration formatter on this
   *  page stays the one duration formatter on this page. */
  took: string;
};

export function ToolTrace({
  tools,
  onPick,
}: {
  tools: ToolTraceItem[];
  onPick: (id: string) => void;
}) {
  if (tools.length === 0) return null;

  const failed = tools.filter((t) => !t.ok).length;
  const rows: ThinkingRow[] = tools.map((t) => ({
    primary: t.name,
    secondary: t.ok ? t.took : `failed · ${t.took}`,
    mono: true,
  }));

  const ran = tools.length === 1 ? "Ran 1 tool" : `Ran ${tools.length} tools`;

  return (
    <div className="mt-mrd-5 mb-mrd-6">
      <Thinking
        variant="Coding"
        rows={rows}
        // The component's own settled label is already "Ran N tools", so this
        // overrides only when there is a failure the shut line has to carry.
        summary={failed > 0 ? `${ran}, ${failed} failed` : undefined}
        onSelectRow={(_row, i) => onPick(tools[i].id)}
      />
    </div>
  );
}

export default ToolTrace;
