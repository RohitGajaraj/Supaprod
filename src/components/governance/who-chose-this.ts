/**
 * DID SOMEBODY CHOOSE THIS, OR DID WE ASSUME IT.
 *
 * On the screen that exists to answer "what can these agents do without asking
 * me", the difference between a permission a person GRANTED and one the
 * platform ASSUMED is the whole question. The governance canon's fourth floor
 * already states the rule for the numeric bars -- "a default the user never set
 * is our choice, so the surface names it as ours rather than presenting it as
 * their policy" -- and `oursNote()` says exactly that beside each of them.
 *
 * The tool list said nothing. Every row rendered identically whether a person
 * had ruled on it or never seen it.
 *
 * `BoundaryTool.chosen` is `!is_default`, computed from whether this account
 * has an `agent_tools` row for the tool. It has been available since F-139 and
 * no surface read it.
 *
 * MEASURED ON THE LIVE DATABASE, 2026-08-27: 97 `agent_tools` rows across 16
 * workspaces, every one edited after creation and the most recent today. So
 * people do move this. What they have not moved is the platform's guess, and
 * on this screen that is most of it.
 *
 * ── IT COUNTS AND DOES NOT SCOLD ──────────────────────────────────────────
 * A default nobody has ruled on is not a mistake. Most of them are correct and
 * re-deciding all of them would be worse than leaving them. The sentence says
 * how many are ours so a person can tell the two apart, and stops there.
 */

export interface Chooseable {
  chosen?: boolean;
}

/**
 * How many of a block's rows are the platform's default, said in `oursNote`'s
 * own voice so one idea has one wording across the screen.
 *
 * Null when every row was chosen -- there is nothing to disclose -- and null
 * when the block is empty, because a count over nothing is not a fact.
 */
export function oursNotYours(tools: readonly Chooseable[] | null | undefined): string | null {
  if (!tools || tools.length === 0) return null;

  /*
   * `chosen === false` and not `!chosen`. An older read that predates the field
   * carries `undefined`, which means WE CANNOT TELL, and counting that as "ours"
   * would put a disclosure on a row nobody can vouch for. Absent is not false;
   * that distinction is the same three-state discipline `gatesLiveWork` and
   * `didAlone` are built on.
   */
  const ours = tools.filter((t) => t.chosen === false).length;
  if (ours === 0) return null;

  if (ours === tools.length) {
    return tools.length === 1
      ? "This is what we ship, not something you set."
      : "These are what we ship, not settings anybody here has made.";
  }
  return `${ours} of these ${ours === 1 ? "is" : "are"} what we ship, not ${ours === 1 ? "one" : "settings"} anybody here has made.`;
}
