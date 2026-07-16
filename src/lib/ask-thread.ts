// PC-36 G - the pure half of the Ask thread's conversation anatomy, split
// out of AskPanel.tsx per the house convention (logic in a lib file, thin
// JSX in the component) so it is unit-testable without the component graph.

/** First markdown-stripped line of an answer, for promoted record titles (PC-36 E). */
export function answerTitle(text: string, max = 280): string {
  const line =
    text
      .split("\n")
      .map((l) =>
        l
          .replace(/^#{1,6}\s+/, "")
          .replace(/[*_`>]/g, "")
          .trim(),
      )
      .find((l) => l.length > 0) ?? "Ask answer";
  return line.slice(0, max);
}

/** Mono short-day label for thread day dividers, e.g. "TODAY" or "JUL 14". */
export function dayLabel(at: number, now = Date.now()): string {
  const d = new Date(at);
  const today = new Date(now);
  if (d.toDateString() === today.toDateString()) return "TODAY";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }).toUpperCase();
}

/** Whether a day divider belongs between two consecutive thread messages. */
export function needsDayDivider(prevAt: number | undefined, at: number): boolean {
  if (prevAt === undefined) return false;
  return new Date(prevAt).toDateString() !== new Date(at).toDateString();
}
