/**
 * THE WAY IN, AND IT HAS TO KNOW SOMETHING.
 *
 * Founder ruling, 2026-07-30: the suggestions on Ask's empty state must be
 * *"aligned with the product, what it is working on and what the content is
 * there. It cannot be just blind one. It needs to know the knowledge about the
 * product."*
 *
 * What stood there was three sentences that would have been identical in an
 * empty workspace and in a workspace with forty runs in flight: "What changed in
 * Helio Labs?", "What is waiting on me?", "Why did we decide this?". Every one of
 * them is answerable, and not one of them is evidence that anything read the
 * workspace. "What is the crew doing on Ship SSO login for Beacon?" is a
 * different kind of object: you cannot write it without having looked.
 *
 * THE RULE THAT OUTRANKS FILLING THE SPACE. Two true prompts beat six invented
 * ones, and one invented one is worse than an empty panel. This surface's whole
 * claim is that it answers from the workspace's own record; a made-up run title
 * in the very first thing a person reads teaches them, correctly, that the
 * citations further down are also decoration. So every prompt below is built
 * from a row a server function actually returned, the count is however many
 * facts there were, and a read that FAILED contributes nothing rather than
 * degrading into a generic line (a failure is not an absence).
 *
 * WHY RUNS AND NOT THE APPROVALS QUEUE, which was the obvious other source and
 * is deliberately absent. Founder ruling, same day: *"approval should not go
 * under Ask... If I click Ask, it should open a fresh window, no approvals
 * waiting for me, nothing like that."* Ask ANSWERS ABOUT approvals when asked
 * and renders the real cards then (ask-actions.ts, AskTurn); it does not CARRY
 * them. A starter that read out a queue title would be the queue arriving on
 * this surface through a side door, and a count in a suggestion is still a
 * count. Runs are a different fact: what the crew is doing is what this
 * workspace IS, and nobody has to act on it.
 *
 * WHY IT IS PURE, AND WHY IT COSTS NOTHING. No new server function and no new
 * query: the read is already in flight for the shell's own chrome, on the same
 * cache key the rail's run count uses (`["shell","missions",workspaceId]`). Ask
 * joins that cache rather than opening a second read of the same table. Keeping
 * the derivation here, away from React, is what lets the "no fact, no prompt"
 * rule be asserted by a test instead of by a comment.
 */

/**
 * TWO LINES, NOT ONE SENTENCE. Founder, on the first cut of this: the prompts
 * were "not logically put" and did not read well. He was right, and the defect
 * was the shape rather than the sourcing: "What is the crew doing on Ship SSO
 * login for Beacon?" buries a nine-word proper noun in the middle of a
 * question, so the eye has to finish the whole line before it knows what the
 * line is about. Split in two, the subject leads and the question follows it,
 * which is how every list in this product already works. `prompt` is what
 * actually lands in the composer, so what gets SENT is still a whole sentence.
 */
export type Starter = {
  /** The real thing this is about. Null on a use case, which names nothing. */
  subject: string | null;
  /** The short question, read as a second line under the subject. */
  question: string;
  /** What lands in the composer on a press. Always a complete sentence. */
  prompt: string;
};

/** The fields this module needs off a mission row. Structurally satisfied by
 *  `MissionListRow`, narrowed here so a test does not have to build one. */
export type StarterMission = {
  title: string;
  status: string;
  completed_at: string | null;
};

/** Missions the shell counts as genuinely in motion (AppFrame's own set).
 *  `queued` is deliberately absent: nobody is turning on a queued run, so
 *  "what is the crew doing on it" would have no answer. */
const WORKING = new Set(["running", "in_progress"]);

/** Small on purpose. This is a way in, not a menu, and a fourth line pushes the
 *  composer under the fold in a 392px pane. */
const MAX = 3;

/** A title is going into a sentence a person will read and then send. Model and
 *  user text both land in `missions.title`, so it can be long, empty, or carry
 *  the newlines that would break the prompt across two lines in a button. */
function clean(title: string | null | undefined): string | null {
  const flat = (title ?? "").replace(/\s+/g, " ").trim();
  if (!flat) return null;
  return flat.length > 64 ? `${flat.slice(0, 63).trimEnd()}...` : flat;
}

export type StarterSource = {
  /** `listMissions` rows, or null when that read failed or has not landed. */
  missions: StarterMission[] | null;
};

/**
 * Up to three questions, each one naming something that is really there.
 *
 * Work in motion first, because that is what a person walks in wondering about,
 * then the most recent thing that landed. Duplicate subjects are dropped: a run
 * that restarted can appear twice, and asking the same question in two different
 * shapes is worse than asking it once.
 */
export function starterPrompts(source: StarterSource): Starter[] {
  const out: Starter[] = [];
  const seen = new Set<string>();
  const add = (subject: string, question: string, prompt: string) => {
    const key = subject.toLowerCase();
    if (out.length >= MAX || seen.has(key)) return;
    seen.add(key);
    out.push({ subject, question, prompt });
  };

  // 1. Work in motion, NAMED. The rail says "Runs 1"; this says which one.
  for (const m of source.missions ?? []) {
    if (!WORKING.has(m.status)) continue;
    const title = clean(m.title);
    if (title) add(title, "What is the crew doing on it?", `What is the crew doing on ${title}?`);
  }

  // 2. The most recent thing that finished, which is the other half of "what
  //    changed" and the half a person can act on.
  const done = (source.missions ?? [])
    .filter((m) => !WORKING.has(m.status) && !!m.completed_at)
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""))[0];
  const doneTitle = clean(done?.title);
  if (doneTitle) {
    add(doneTitle, "What changed when it finished?", `What changed when ${doneTitle} finished?`);
  }

  return out;
}

/**
 * WHAT THIS SURFACE CAN DO, which is a different question from what is
 * happening in the workspace, and the founder asked for both.
 *
 * *"We need to give something more of a use case here, like how Perplexity
 * shows. It just crawls down all the use cases so that user knows. Or you can
 * have two, three examples on the use cases more so that the user knows exactly
 * what he should be asking on."*
 *
 * THESE NAME NOTHING, AND THAT IS WHY THEY ARE ALLOWED TO BE CONSTANT. The
 * grounded list above may not invent a run title; this list has no titles to
 * invent. Each line is a CAPABILITY that is wired in this pane today, and the
 * three are deliberately one per mode rather than three flavours of one:
 *
 *   1. the approvals capability. Asking this is exactly the moment the founder
 *      said the real gate cards should appear, settleable inline, and it is now
 *      the only way they appear, so this line is also the door to them.
 *   2. the record. The thing that makes this a company brain rather than a chat
 *      box: it answers from the workspace's own history and cites what it read.
 *   3. the fork. Ask does not only answer, it can hand the work over and start a
 *      real run, which is the half of the composer nobody discovers unaided.
 *
 * Kept to three. Perplexity can crawl a long list because its subject is the
 * entire web; this pane is 392px wide and a fourth line pushes the composer
 * under the fold, which costs more than a fourth example is worth.
 */
export const USE_CASES: readonly Starter[] = [
  {
    subject: null,
    question: "What needs my call, and why?",
    prompt: "What needs my call, and why?",
  },
  {
    subject: null,
    question: "Why did we decide this?",
    prompt: "Why did we decide this?",
  },
  {
    subject: null,
    question: "Draft a spec for this and hand it to the crew",
    prompt: "Draft a spec for this and hand it to the crew",
  },
] as const;

/**
 * Whether we are entitled to say "nothing has run here yet".
 *
 * Only when the read LANDED and came back empty. A failed read produces no
 * prompts either, and the difference between "there is nothing" and "we could
 * not find out" is the difference this codebase has a whole primitive for.
 */
export function starterStateIsKnownEmpty(source: StarterSource): boolean {
  return source.missions !== null && source.missions.length === 0;
}
