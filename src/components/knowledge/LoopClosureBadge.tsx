/**
 * LOOP-PROVE (v11 #5): is the decision loop actually closing. An outcome-named
 * headline, the engine's own gap line when it is not closing, and the stage
 * trail behind both (decisions, outcomes, revision links, resolved forward).
 *
 * Self-contained, mirroring the Trust Ledger's SealPanel: it owns its
 * getLoopClosure query and returns null while pending, on error, or on an empty
 * graph, so it never clutters its host or shows a meaningless "cold" for a
 * brand-new workspace. Read-only, no AI chokepoint.
 *
 * Ported to the shell primitives, 2026-07-29. What went, and why:
 *   KILLED the `bento` card, `--geist-space-2x`, `--ink`, `--ink-subtle`,
 *     `--ink-faint`, `--emerald` and `--marigold`. None resolve against this
 *     shell.
 *   KILLED the WARMTH DOT. Three hues on a dot, one of them a hue this system
 *     does not have, saying the thing the headline says in words directly
 *     beside it (hard ban 10). State is never a hue; the outcome is a word, and
 *     only a genuinely closing or genuinely cold loop spends a colour.
 *   KILLED the decorative Activity icon floating at the end of the title row.
 *     It introduced nothing and named nothing.
 *   KILLED the ChevronRight drawn between every trail step. Four icons carrying
 *     punctuation is decoration at icon weight.
 *
 * UNCHANGED: getLoopClosure, the ["loop-closure", activeWorkspaceId] key and
 * its deliberate workspace scoping (an unscoped call falls back server-side to
 * the DEFAULT workspace, which is how this funnel once contradicted the Beliefs
 * card), summarizeLoopClosure, and the trail's per-step vocabulary.
 */
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { getLoopClosure } from "@/lib/moat.functions";
import { summarizeLoopClosure } from "@/lib/moat/loop-closure-display";
import type { LoopWarmth } from "@/lib/moat/loop-closure";
import { useWorkspace } from "@/hooks/use-workspace";
import { Block, Num } from "@/components/shell/primitives";

/** The outcome, and the one class that carries it. A loop that is warming is
 *  not an outcome yet, so it stays monochrome. */
const TONE: Record<LoopWarmth, string> = {
  warm: "sp-pass",
  warming: "",
  cold: "sp-warn",
};

// One number per meaning (the audit's contradiction fix): the engine's
// "revised" counts supersession LINKS in the lineage graph (an outcome that
// replaced any artifact), not decisions currently marked revised, which is a
// different number belonging to the Beliefs card. The trail says which it means.
function trailLabel(label: string, value: number): string {
  if (label === "revised") return value === 1 ? "revision link" : "revision links";
  if (label === "resolved") return "resolved forward";
  return label;
}

export function LoopClosureBadge() {
  // Scoped to the ACTIVE workspace, the same scope as every other number on
  // this page.
  const { activeWorkspaceId } = useWorkspace();
  const fLoop = useServerFn(getLoopClosure);
  const q = useQuery({
    queryKey: ["loop-closure", activeWorkspaceId],
    queryFn: () => fLoop({ data: { workspaceId: activeWorkspaceId ?? undefined } }),
  });

  const report = q.data;
  // Calm by default: while loading, on error, or on a workspace with no
  // decisions at all, show nothing rather than a spinner or a meaningless cold
  // reading. The host owns the primary loading and empty states, so this
  // component's absence claims nothing on its own.
  if (!report || (report.counts?.decisions ?? 0) === 0) return null;

  const s = summarizeLoopClosure(report);

  return (
    <Block
      title={s.label}
      // The engine's own gap line. A different fact from the headline, never a
      // restatement of it.
      sub={<span className={TONE[s.tone] || undefined}>{s.detail}</span>}
    >
      <p className="sp-loading">
        {s.trail.map((step, i) => (
          <span key={step.label}>
            {i > 0 ? " · " : ""}
            <Num>{step.value}</Num> {trailLabel(step.label, step.value)}
          </span>
        ))}
      </p>
    </Block>
  );
}
