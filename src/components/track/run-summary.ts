/*
 * THE SUMMARY A REVIEWER PASTES (item 24). Built from rows the run wrote --
 * route, states, filed titles, the hold sentence -- never a JSON dump. One
 * line per DISTINCT thing: a station re-drafting its prototype five times is
 * one fact here, not five identical titles. A body that leaked into a title
 * field is bounded; the link carries the whole record.
 */
export function summaryText(input: {
  title: string;
  stationName: string;
  hold: string | null;
  stops: Array<{ label: string; state: string; nouns: string[] }>;
  url: string;
}): string {
  const lines: string[] = [];
  lines.push(`${input.title} (a Supaprod run)`);
  lines.push(`Where it is: ${input.stationName}`);
  if (input.hold) lines.push(`Why it is stopped: ${input.hold}`);
  const walked = input.stops.filter((s) => s.nouns.length > 0);
  if (walked.length > 0) {
    lines.push("What each step filed:");
    for (const s of walked) {
      const counted = new Map<string, number>();
      for (const raw of s.nouns) {
        const noun = raw.length > 120 ? `${raw.slice(0, 120)}...` : raw;
        counted.set(noun, (counted.get(noun) ?? 0) + 1);
      }
      const parts = [...counted].map(([noun, n]) => (n > 1 ? `${noun} (${n} filings)` : noun));
      lines.push(`- ${s.label}: ${parts.join(", ")}`);
    }
  }
  lines.push(input.url);
  return lines.join("\n");
}
