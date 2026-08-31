/**
 * TAKE THIS: WHAT ONE STATION FILED, AS A FILE A PERSON CAN HAND TO SOMEBODY.
 *
 * ── THE ONE CONTROL, AND THE RULING THAT LIMITS IT TO ONE ─────────────────
 * `RANKED-BACKLOG.md`, "THE ARTIFACT QUESTION IS SETTLED — build no management
 * surface": `ArtifactPane` already exists, is mounted, is reached from six call
 * sites and has ten kind-specific renderers, so the ruling is **add exactly one
 * control** to its `Region` header, scoped to the station tab shown. Not a
 * settings page (four artifacts are not a setting), not a per-station route
 * (R-01), and **not a global list** — that surface was built, orphaned, audited
 * and redirected away on 2026-07-30, and rebuilding it is the repo's signature
 * defect.
 *
 * ── WHY THIS COMPOSES A BRIEF AND DOES NOT EMIT `intent.md` ───────────────
 * `SPEC-STATION-MODEL-AND-ARTIFACTS.md` §2 specifies real artifacts with YAML
 * frontmatter, and **gap #20 puts those emitters in S0's prefix**, not mine.
 * Inventing a frontmatter block here would give one idea two formats — the
 * exact defect F-150 was, at file scale — and the emitter would then have to
 * match a shape a component made up.
 *
 * So this hands over **what the station actually filed, as prose a person
 * reads**, which is §4.1's third purpose for an artifact ("what a customer takes
 * away on export") and needs no schema. **When S0's emitters land this control
 * serves the real file instead**, and its callers do not change, because what a
 * person presses stays "Take this" either way.
 *
 * ── AND WHY IT IS A FILE RATHER THAN A CLIPBOARD COPY ─────────────────────
 * `CopyRunSummary` (`TrackRun.tsx`) already puts the WHOLE RUN on the clipboard
 * for a PR thread, and that is queue item 24. This is the other half and it is
 * deliberately not the same gesture: one station, and a thing you keep. Two
 * controls doing the same job with different names would be worse than either.
 *
 * ── NO FRONTMATTER, NO SECTION HEADINGS ON SCREEN ─────────────────────────
 * §4.1: "A person never sees YAML, a filename, or a section heading from §2."
 * Nothing in this module reaches a surface — the pane shows the artifact as a
 * card and this is what is behind the control. The file itself may have
 * headings, because a file a person opens in an editor is not a screen in this
 * product.
 */

import { sdlcWordsFor } from "@/components/track/sdlc-words";
import type { AgentStation } from "@/lib/agent-vocabulary";

/** The per-kind columns a station's card renders, as the pane already holds them. */
export type FieldValue = unknown;

export type FiledItem = {
  kind: string;
  /** The plain word for the kind, from the one vocabulary the driver uses. */
  word: string;
  title: string | null;
  /** True only when the lookup RAN and the row was not there. */
  missing: boolean;
  fields: Record<string, FieldValue>;
};

export type StationFileInput = {
  /** The work's own title, which is the opening sentence a person recognises. */
  trackTitle: string;
  /** The station's display name. Never the slug (R-01). */
  stationLabel: string;
  /**
   * The station's id, used ONLY to look up the playbook's word for it. Not
   * rendered: R-01 stands, a raw slug never reaches a reader.
   */
  station?: AgentStation;
  /** What this station is for, when the pane knows it. */
  expects: string | null;
  /** Why nothing can land here, when the chain says so. */
  gap: string | null;
  /** The person's own words when they waived it. */
  waivedReason: string | null;
  items: FiledItem[];
  /** The one address this work has. */
  url: string;
};

/** The columns worth putting in a handed-over file, per kind, longest first. */
const BODY_FIELDS: readonly string[] = [
  "body_md",
  "summary",
  "detail",
  "rationale",
  "description",
  "goal",
  "content",
  "verdict",
  "status_reason",
];

/**
 * The longest a title can be and still read as a name rather than as the thing
 * itself. Set from what the data does: theme names on the driven track run 20
 * to 60 characters, and the one that broke the file was a 120-character quote.
 */
const NAME_MAX = 80;

function text(v: FieldValue): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length > 0 ? t : null;
}

/**
 * The longest readable column this row carries, or null.
 *
 * Longest rather than first, because the kinds do not share a shape: a spec's
 * substance is `body_md`, a theme's is `summary`, a task's is `detail`, and a
 * row can carry two of them with one of them a stub.
 */
export function bodyOf(item: FiledItem): string | null {
  let best: string | null = null;
  for (const key of BODY_FIELDS) {
    const t = text(item.fields[key]);
    if (t && (best === null || t.length > best.length)) best = t;
  }
  return best;
}

/**
 * A FILENAME A PERSON CAN FIND AGAIN.
 *
 * Station first because a person taking three of these has three files about
 * one piece of work, and the station is what tells them apart. ASCII only: this
 * lands in someone's Downloads folder and then usually in a repo.
 */
export function fileNameFor(trackTitle: string, stationLabel: string): string {
  const slug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48)
      .replace(/-+$/g, "");
  const station = slug(stationLabel) || "station";
  const title = slug(trackTitle);
  return title ? `${station}-${title}.md` : `${station}.md`;
}

/**
 * THE FILE. Readable prose, never a JSON dump — brief unit 9's words, and the
 * same rule `summaryText` states for the clipboard half.
 *
 * ── AN EMPTY STATION STILL PRODUCES A FILE, AND SAYS IT IS EMPTY ──────────
 * The tempting version disables the control when nothing was filed. It is
 * wrong for the same reason §2.1 gives about `Open questions`: **an empty list
 * is a defect, not a clean bill**, and a control that vanishes takes the
 * evidence of the gap with it. 81 of 106 tracks are sitting at Discover having
 * filed nothing, and a person who wants to send somebody *"look, this station
 * produced nothing and here is what it was supposed to produce"* is the exact
 * person this control is for.
 *
 * ── A MEMBER THE LOOKUP MISSED IS NAMED, NOT DROPPED ──────────────────────
 * `missing` means the row was looked for and was not there, which is a
 * different fact from never having existed. The chain's own rule is to keep
 * those as titles rather than hide them, and a file that quietly omitted them
 * would be a cleaner-looking lie than the screen it came from.
 */
export function stationFile(input: StationFileInput): string {
  const lines: string[] = [];
  lines.push(`# ${input.stationLabel}: ${input.trackTitle}`);
  lines.push("");

  /*
   * ── THEIR WORD FOR THIS STATION, AND IT BELONGS HERE AND NOWHERE ELSE ────
   * Gap #26 is the translation §STATIONS says our refusal to renumber has to
   * pay for: *"a customer asking 'where is my spec.md' is answered in their
   * words."* This file is exactly that reader -- it is what gets handed to
   * somebody else's builder, and that builder is the one who speaks the
   * playbook.
   *
   * AND IT IS NOT A UI VIOLATION, which is the rule I checked before writing
   * it. §4.5 rule 4 bans `intent.md`, `spec.md` and `sdlc.stage` from becoming
   * UI vocabulary -- they are "file names and machine fields". A handed-over
   * FILE is neither a screen nor UI; it is the machine field's own home. The
   * pane still shows the artifact as a card and this line never appears there.
   *
   * ONE VOCABULARY AT A TIME still holds: our heading above is ours, and this
   * is a single translation line that says which of THEIRS it corresponds to.
   * The two are not interleaved, and the line is absent where they have no
   * counterpart -- Discover borrows nothing, because their playbook starts with
   * a person who already knows the problem.
   */
  if (input.station) {
    const theirs = sdlcWordsFor(input.station);
    if (theirs) {
      lines.push(
        theirs.artifact
          ? `On the AI-native SDLC this is the ${theirs.stage} stage, and this file is its ${theirs.artifact}.`
          : `On the AI-native SDLC this is the ${theirs.stage} stage.`,
      );
      lines.push("");
    }
  }

  if (input.waivedReason) {
    lines.push(`This station was taken off the route. Reason given: ${input.waivedReason}`);
    lines.push("");
  }

  const present = input.items.filter((i) => !i.missing);
  const missing = input.items.filter((i) => i.missing);

  if (present.length === 0) {
    lines.push(
      input.expects
        ? `This station has filed nothing. It is where the ${input.expects} is written.`
        : "This station has filed nothing.",
    );
    if (input.gap) lines.push(input.gap);
    lines.push("");
  }

  /*
   * ── DEDUPED, AND THE FIRST DRAFT OF THIS FILE WAS NOT ────────────────────
   * Driven on track `425e6887` before this existed: the Discover file came out
   * at 26KB with the same piece of evidence printed three times and nine
   * consecutive sections all headed "finding". `summaryText` had already
   * solved exactly this for the clipboard half and says so in its own header
   * -- "One line per DISTINCT thing: a station re-drafting its prototype five
   * times is one fact here, not five identical titles" -- and this file simply
   * did not read that rule before repeating the mistake it was written for.
   *
   * Keyed on title AND body, because two findings can share a body and differ
   * in name, and a repeat is REPORTED rather than silently dropped: how many
   * times a station filed the same thing is a fact about the run.
   */
  const seen = new Map<string, { item: FiledItem; body: string | null; times: number }>();
  for (const item of present) {
    const body = bodyOf(item);
    const key = `${item.title ?? ""}\u0000${body ?? ""}`;
    const at = seen.get(key);
    if (at) at.times += 1;
    else seen.set(key, { item, body, times: 1 });
  }

  const repeats = (n: number) => (n > 1 ? ` (filed ${n} times)` : "");

  /*
   * ── TITLED THINGS GET A SECTION; UNTITLED ONES GET ONE LIST ──────────────
   * A signal carries no title at all, so heading each one with its KIND gave a
   * document with nine identical headings and no way to scan it. The split is
   * the reader's: something with a name is a thing you look up, something
   * without one is evidence you read in a run.
   */
  const named = (e: { item: FiledItem }) => {
    const t = (e.item.title ?? "").trim();
    /*
     * A SENTENCE IS NOT A NAME, and the driven file proved it: one section was
     * headed with a whole customer quote, `## Good product. I turned off all
     * the alerts in week two because there were several a day...`. Some signal
     * rows carry their content in `title`, so the titled/untitled split has to
     * be about whether the string reads as a NAME rather than about whether
     * the column is populated. Over the cap it is evidence, and evidence goes
     * in the list with the rest of it.
     */
    return t.length > 0 && t.length <= NAME_MAX;
  };
  const titled = [...seen.values()].filter(named);
  const untitled = [...seen.values()].filter((e) => !named(e));

  for (const { item, body, times } of titled) {
    lines.push(`## ${(item.title ?? "").trim()}${repeats(times)}`);
    lines.push("");
    lines.push(body ?? `No detail was recorded beyond the ${item.word}'s name.`);
    lines.push("");
  }

  if (untitled.length > 0) {
    lines.push("## What this step filed");
    lines.push("");
    for (const { item, body, times } of untitled) {
      const line = body ?? item.title?.trim() ?? `A ${item.word} with no detail recorded.`;
      lines.push(`- ${line}${repeats(times)}`);
    }
    lines.push("");
  }

  if (missing.length > 0) {
    lines.push("## Looked for and not found");
    lines.push("");
    for (const m of missing) {
      lines.push(`- ${m.title ?? m.word} (a ${m.word} this step recorded, since deleted)`);
    }
    lines.push("");
  }

  lines.push(`The whole run: ${input.url}`);
  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n")}\n`;
}

/**
 * What the control says AFTER it acts, because "the control says what it
 * copied" is brief unit 9's requirement and a silent download is a control a
 * person cannot tell worked.
 */
export function tookItLine(fileName: string, filedCount: number): string {
  const what =
    filedCount === 0
      ? "It says this step filed nothing"
      : filedCount === 1
        ? "It carries the one thing this step filed"
        : `It carries the ${filedCount} things this step filed`;
  return `Saved ${fileName}. ${what}.`;
}
