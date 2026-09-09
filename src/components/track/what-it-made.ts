import type { AgentStation } from "@/lib/agent-vocabulary";
import { STATION_ARTIFACT, joinPlainly } from "@/lib/spine/attach";
import { wordFor } from "@/lib/spine/chain";
import { releaseStanding } from "@/components/track/release-words";
import { foldedCount, prepFor } from "@/components/track/versions-of-one-thing";

/**
 * WHAT A STATION MADE FOR THE PERSON, SAID FIRST, IN THE STATION'S OWN NOUN.
 *
 * ── THE SENTENCE THAT WAS ON THE SCREEN, 2026-09-08 ────────────────────────
 * Under "What it has made", on a run whose Ship station had gone to
 * production, the line read:
 *
 *     Ship filed 4 prototypes, 1 decision and 1 release. 4 of them say the
 *     same thing.
 *
 * Two things wrong with it. Ship did not file prototypes and a decision; they
 * were attached to the stop as the context Ship worked from, and a sentence
 * that counts them as Ship's output describes the pile rather than the product.
 * And "4 of them say the same thing" reports a defect as a fact, where four
 * rows sharing one title are one thing filed four times.
 *
 * ── PRODUCT FIRST, THEN THE REST, QUIETER ──────────────────────────────────
 * `lead` is what the station itself produced, in its own noun and with the fact
 * that matters about it: *Released to production.* *Opened PR #5.* *8 drawings.*
 * `quiet` is everything else on the stop, and it is drawn fainter: what was
 * attached alongside, an earlier release, a member that no longer resolves.
 *
 * ── WHERE THE WORDS COME FROM ──────────────────────────────────────────────
 * The nouns are `wordFor`'s, the same vocabulary the chain and the driver
 * speak, with one exception already on this screen: the run map above this
 * sentence calls a prototype a *drawing* (`what-each-station-did.ts`), and the
 * two lines are read together, so this one says drawing too. The release's
 * standing comes from `releaseStanding`, so *Released* is only ever said where
 * the provider reported success, and a pasted address reads as *Said to have
 * been released*, which is the distinction `release-words.ts` exists to keep.
 *
 * ── WHY THIS IS NOT `whatItProduced` ───────────────────────────────────────
 * That sentence has the strip's shape, "Plan filed 1 spec and 2 prototypes",
 * and Start's row is pinned to agree with it clause for clause. This one is
 * the pane's, where the cards it introduces are directly beneath it and the
 * reader wants the product before the inventory. Both count through
 * `foldedCount`, so they cannot disagree about what is one thing.
 */

export type MadeMember = {
  kind: string;
  /** True only when the lookup RAN and the row was not there. */
  missing: boolean;
  title?: string | null;
  createdAt?: string;
  /**
   * The per-kind columns the pane already fetches, when the artifacts read has
   * landed. Absent on the chain's own members, and the sentence still stands
   * without them: it just cannot yet say where a release went or which PR
   * opened.
   */
  fields?: Readonly<Record<string, unknown>>;
};

export type MadeSentence = {
  /** The product, in the station's own noun. Read first. */
  lead: string;
  /** What else is on the stop, and what no longer resolves. Drawn quieter. */
  quiet: string | null;
};

function str(v: unknown): string | null {
  return typeof v === "string" && v.length > 0 ? v : null;
}

function prNumber(fields: Readonly<Record<string, unknown>> | undefined): number | null {
  const raw = fields?.pr_number;
  if (typeof raw === "number" && Number.isInteger(raw) && raw > 0) return raw;
  if (typeof raw === "string" && /^\d+$/.test(raw)) return Number(raw);
  return null;
}

/*
 * ── THE OVERRIDE THAT SAID "DRAWING" IS GONE (Lane 1, 2026-09-09) ─────────
 *
 * It read `if (kind === "prototype") return "drawing"`, and three sibling files
 * carried the same local swap. `KIND_WORD` in `lib/spine/attach.ts` is the
 * canon and says prototype; nine call sites already read it, including the run
 * screen's own What-happened list.
 *
 * So the two met on one screen. Caught live on 2026-09-09 on the served build:
 * the road under Design read "10 drawings" and the story 250px to its right
 * read "filed 10 prototypes", one object and two nouns in one glance.
 *
 * PROTOTYPE WINS, and not only because it is the canon. "Drawing" MISDESCRIBES
 * the thing. The locked positioning calls it "an interactive prototype a person
 * can click before anyone writes code" and rests a differentiator on it: their
 * preview saves rework, ours prevents it. Calling that a drawing undersells the
 * most distinctive artifact the loop files, and it is the founder's own outward
 * word besides.
 *
 * Nothing to override now: every noun here is `wordFor`'s.
 */

/** Oldest first by the instant where every member carries one; filing order otherwise. */
function newestOf<M extends MadeMember>(members: readonly M[]): M {
  if (!members.every((m) => typeof m.createdAt === "string")) return members[members.length - 1];
  return [...members].sort((a, b) => (a.createdAt as string).localeCompare(b.createdAt as string))[
    members.length - 1
  ];
}

function releaseLine(releases: readonly MadeMember[]): string {
  const newest = newestOf(releases);
  const f = newest.fields ?? {};
  const env = str(f.environment);
  const to = env ? ` to ${env}` : "";
  switch (releaseStanding(str(f.status)).tone) {
    case "pass":
      return `Released${to}.`;
    case "hold":
      return `Said to have been released${to}.`;
    case "fail":
      return `The release${to} did not go out.`;
    case "agent":
      return `Going out${to}.`;
    default:
      // The provider's word is one this build has not seen, or the artifacts
      // read has not landed yet. A count claims nothing it cannot show.
      return `${foldedCount(releases, wordFor("deployment", releases.length))}${
        releases.length === 1 ? to : ""
      }.`;
  }
}

/**
 * The sentence, or null when there is nothing honest to say.
 *
 * Null when nothing present resolves, for the reason `whatItProduced` gives:
 * `StationPanel` owns the empty case and says it better, naming the noun the
 * station was supposed to file and deferring to the hold line where the hold
 * already said it.
 */
export function whatItMade(input: {
  station: AgentStation;
  label: string;
  members: readonly MadeMember[];
  /** A seat is working this stop right now, so an absence is "yet". */
  running?: boolean;
}): MadeSentence | null {
  const { station, label, members, running = false } = input;
  const present = members.filter((m) => !m.missing);
  const gone = members.length - present.length;
  if (present.length === 0) return null;

  const ownKind: string | null = STATION_ARTIFACT[station]?.kind ?? null;
  const own = new Set<string>(ownKind ? [ownKind] : []);
  // Discover produces both; a cluster is its output and not something attached.
  if (station === "sense") own.add("theme");

  const of = (kind: string) => present.filter((m) => m.kind === kind);
  const extras: string[] = [];
  let lead: string | null = null;

  switch (station) {
    case "sense": {
      const found = of("signal");
      const clusters = of("theme");
      if (found.length > 0) {
        lead = `Found ${found.length} ${found.length === 1 ? "thing" : "things"}.`;
      }
      if (clusters.length > 0) {
        const line = `${foldedCount(clusters, wordFor("theme", clusters.length))}.`;
        if (lead) extras.push(line);
        else lead = line;
      }
      break;
    }
    case "build": {
      const changes = of("changeset");
      const prs = changes.map((m) => prNumber(m.fields)).filter((n): n is number => n !== null);
      if (prs.length > 0) {
        lead = `Opened ${joinPlainly(prs.map((n) => `PR #${n}`))}.`;
        const rest = changes.length - prs.length;
        if (rest > 0) {
          extras.push(`${rest} more ${wordFor("changeset", rest)} without a pull request.`);
        }
      } else if (changes.length > 0) {
        lead = `${foldedCount(changes, wordFor("changeset", changes.length), prepFor("changeset"))}.`;
      }
      break;
    }
    case "ship": {
      const releases = of("deployment");
      if (releases.length > 0) {
        lead = releaseLine(releases);
        if (releases.length > 1) {
          const n = releases.length - 1;
          extras.push(`${n} earlier ${wordFor("deployment", n)}.`);
        }
      }
      break;
    }
    default: {
      if (ownKind) {
        const mine = of(ownKind);
        if (mine.length > 0) {
          lead = `${foldedCount(mine, wordFor(ownKind, mine.length), prepFor(ownKind))}.`;
        }
      }
    }
  }

  if (!lead) {
    /*
     * Members on the stop and none of them the station's own product. Said
     * as an absence of the product, never as a filing of what was attached:
     * "Ship filed 4 prototypes" is the sentence this file replaces.
     */
    const yet = running ? " yet" : "";
    lead =
      station === "sense"
        ? `Found nothing${yet}.`
        : `No ${ownKind ? wordFor(ownKind, 1) : "product"} from ${label}${yet}.`;
  }

  const byKind = new Map<string, MadeMember[]>();
  for (const m of present) {
    if (own.has(m.kind)) continue;
    byKind.set(m.kind, [...(byKind.get(m.kind) ?? []), m]);
  }
  const alongside = [...byKind].map(([kind, ms]) =>
    foldedCount(ms, wordFor(kind, ms.length), prepFor(kind)),
  );

  const quiet = [...extras];
  if (alongside.length > 0) quiet.push(`Alongside, ${joinPlainly(alongside)}.`);
  /*
   * A MEMBER THE LOOKUP MISSED IS SAID, NOT SUBTRACTED. `missing` means the row
   * was looked for and was not there, which is a fact about this work rather
   * than about our reading, and the chain already refuses to hide those.
   */
  if (gone === 1) quiet.push("One more no longer resolves to anything we can show.");
  else if (gone > 1) quiet.push(`${gone} more no longer resolve to anything we can show.`);

  return { lead, quiet: quiet.length > 0 ? quiet.join(" ") : null };
}
