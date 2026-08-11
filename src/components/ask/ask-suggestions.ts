/**
 * WHAT EACH SUGGESTION DOES, AND WHICH STATION IT BELONGS TO.
 *
 * Founder, 2026-08-11, on the Ask pane: *"This is one of the core parts of the
 * engine. Here you can do everything out of those seven stations. There is no
 * thought given to it at all."* And on the strip specifically: *"that tells
 * users what all you can do. With one click you can just click that and execute
 * those actions, and it is real-time data feeding from the workspace, not
 * randomly seeded."*
 *
 * The capability was right and the execution was not. A three-row marquee of
 * capsules clipped every sentence it carried: measured in a browser at 1280px on
 * 2026-08-11, a 392px pane showed "d this bet pay off?", "Did this b" and "at
 * did we learn the last time we tried this?" at the same moment, and because
 * four prompts were dealt round robin into three rows the seamless-loop copies
 * put THE SAME suggestion on screen twice at once. Half the offers were
 * unreadable and some of the readable ones were duplicates.
 *
 * WHAT THIS MODULE ADDS, and it is the half the strip never had: a suggestion
 * that says what pressing it will DO, and which of the seven stations it comes
 * out of. That is the founder's own sentence turned into something on screen.
 *
 * THE TWO FACTS, AND WHY NEITHER IS A GUESS.
 *
 * 1. WHAT IT DOES is `defaultIntent`, the SAME pure function the composer uses
 *    to set its own fork. So a row filed under "Handed to the crew" is filed
 *    there because the composer will show "Hand it over" the instant the
 *    sentence lands in it. The label cannot disagree with the product, because
 *    it is reading the product's own classifier rather than a second opinion.
 *
 * 2. WHICH STATION is read off the SCOPE, which is the same input
 *    `contextualStarters` used to choose the prompts in the first place.
 *    Standing on a spec you are offered spec questions, and a spec is Plan.
 *    That is not a classifier over English, it is the switch that produced the
 *    list, read a second time. The one case where the scope spans stations is
 *    the workspace default, and only there is there a table.
 *
 * AND IT FAILS TO NOTHING. An unrecognised prompt gets NO station rather than a
 * guessed one, which is the same rule `ask-starters.ts` applies to a failed
 * read: an absence is honest and an invention is not. `ask-suggestions.test.ts`
 * asserts that every prompt `contextualStarters` can currently emit resolves, so
 * drift shows up as a red test rather than as a quietly blank tag.
 */

import { defaultIntent } from "@/lib/ask-intent";
import type { Starter } from "@/lib/ask-starters";
import type { AgentStation } from "@/lib/agent-vocabulary";

/**
 * WHICH STATION THE CAPABILITY LINES ON THIS SURFACE COME OUT OF.
 *
 * Mirrors `contextualStarters`'s own switch, including its `one` test, because
 * they have to answer the same question the same way: a LIST of runs is a
 * workspace question wearing a narrower label, so it falls through exactly as
 * the prompts do. Null means the offered set genuinely spans stations, and the
 * per-prompt table below is the only thing entitled to narrow it.
 */
export function stationForScope(scopeKind: string | null, scopeLabel: string): AgentStation | null {
  const one = scopeLabel.startsWith("this ");
  switch (scopeKind) {
    case "mission":
      // A run in flight is Build: the station where the crew is working, not
      // Ship, which is where a finished change goes out.
      return one ? "build" : null;
    case "prd":
      return "define";
    case "decision":
      return "decide";
    case "doc":
    case "note":
    case "finding":
      return "learn";
    default:
      // Discover carries a label and no kinds (resolveScope), so it is
      // recognised the same way `contextualStarters` recognises it.
      return scopeLabel === "Discover" ? "sense" : null;
  }
}

/**
 * THE ONE TABLE, AND IT COVERS EXACTLY THE ONE SET THAT SPANS STATIONS.
 *
 * `WORKSPACE_PROMPTS` is what a PM standing in their own workspace is offered,
 * with no single object in front of them, and it is deliberately drawn from
 * across the loop. Every other set is a station's worth of questions and is
 * answered by `stationForScope` above without a literal in sight.
 *
 * These are classifications of what the question is ABOUT, not of the words in
 * it. "What is at risk of slipping" is a Ship question because slipping is a
 * delivery fact; "what are users asking for" is Discover because demand is what
 * Discover reads. Anything not listed gets no tag.
 */
const STATION_BY_WORKSPACE_PROMPT: Record<string, AgentStation> = {
  "What should we build next, and why that?": "decide",
  "What shipped this quarter, and did it land?": "learn",
  "Which bets paid off, and which missed?": "learn",
  "What is the crew working on right now?": "build",
  "What needs my call before it can move?": "decide",
  "What are users asking for most right now?": "sense",
  "What is at risk of slipping?": "ship",
  "Draft the spec for our next bet and hand it to the crew": "define",
};

/** The station a single capability line belongs to, scope first and the table
 *  only where the scope could not say. */
export function stationForStarter(
  starter: Starter,
  scopeKind: string | null,
  scopeLabel: string,
): AgentStation | null {
  return (
    stationForScope(scopeKind, scopeLabel) ?? STATION_BY_WORKSPACE_PROMPT[starter.prompt] ?? null
  );
}

/** One headed group of suggestions. The heading says what pressing anything
 *  inside it will do, which is the fact a person needs BEFORE the click, not
 *  after it. */
export type SuggestionGroup = {
  id: "running" | "landed" | "ask" | "hand";
  /** What the rows under it do. Never a restatement of the rows themselves. */
  label: string;
  /** The one line of consequence, where there is one worth saying. */
  note: string | null;
  items: Starter[];
};

/**
 * FOUR GROUPS, IN THE ORDER A PERSON CARES ABOUT THEM, AND EMPTY ONES ARE GONE.
 *
 * Grounded first and split in two, because "a run that is happening now" and "a
 * run that just finished" are different enough to be worth different headings:
 * one is a status question and the other is an outcome question. Then the
 * capability lines, split by what the composer will do with them.
 *
 * NOTHING IS INVENTED AND NOTHING IS PADDED. Every row in the first two groups
 * names a mission row `listMissions` returned; the last two name nothing at all,
 * which is what makes them safe to show when the workspace read failed. A group
 * with no items does not render, so a quiet workspace shows two groups rather
 * than two empty headings.
 */
export function groupSuggestions(offers: readonly Starter[]): SuggestionGroup[] {
  const groups: SuggestionGroup[] = [
    { id: "running", label: "Work in motion", note: null, items: [] },
    { id: "landed", label: "Just landed", note: null, items: [] },
    { id: "ask", label: "Answered from the record", note: null, items: [] },
    {
      id: "hand",
      label: "Handed to the crew",
      // The SAME sentence the footer prints at the moment of commitment
      // (AskPane's hint line), said here one step earlier. A row that spends
      // money must say so before it is pressed, not after.
      note: "These start a run and spend credits.",
      items: [],
    },
  ];
  const by = (id: SuggestionGroup["id"]) => groups.find((g) => g.id === id)!;

  for (const item of offers) {
    if (item.kind === "running") by("running").items.push(item);
    else if (item.kind === "done") by("landed").items.push(item);
    else if (defaultIntent(item.prompt) === "instruction") by("hand").items.push(item);
    else by("ask").items.push(item);
  }

  return groups.filter((g) => g.items.length > 0);
}
