/**
 * A STORED SOURCE NAME, AS A PERSON SHOULD READ IT.
 *
 * ── WHY THIS IS SEPARATORS AND NOTHING ELSE ───────────────────────────────
 * `signals.source` is not a closed vocabulary. Measured on production across
 * 1,483 rows, it holds at least: `agent`, `analytics`, `sales-call`, `support`,
 * `NPS survey`, `nps`, `interview`, `workspace_brief`, `slack`, `github`,
 * `app-store`, `session replay archive` and `competitive_research` -- snake
 * case, kebab case, spaces and mixed capitals, all at once.
 *
 * So a lookup table is the wrong shape: every source it did not anticipate
 * would fall through to a wrong label, which is exactly what `sourceLabel` in
 * `memory-candidates` would have done here. It maps user/agent/outcome and
 * returns "Proposed" for everything else, so `competitive_research` would have
 * rendered as **Proposed**, which is not what the row says.
 *
 * ── AND IT DOES NOT TOUCH CASE ────────────────────────────────────────────
 * Title-casing would turn `NPS survey` into `Nps Survey`. The row's own
 * capitals are the best information available about how the source is written,
 * so only the separators change: an underscore or a hyphen between two letters
 * becomes a space, because those are machine punctuation and a person reading
 * "competitive_research" is reading a column value rather than a source.
 */
export function sourceWords(source: string): string {
  return source.replace(/[_-]+(?=[A-Za-z0-9])/g, " ").trim();
}
