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
  /**
   * WHICH KIND, so the chip can carry an honest dot.
   *
   * `running` earns the live blue the shell already uses for work in motion
   * (`.sp-live-dot[data-state="running"]`), because that is literally what it
   * means there; reusing it keeps one meaning for one colour instead of
   * inventing a decorative palette for a suggestion strip. `done` and
   * `use-case` carry no dot: nothing is happening, so nothing should glow.
   */
  kind: "running" | "done" | "use-case";
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

/** How many grounded chips at most. Raised from 3 when the two stacked lists
 *  became a three-row marquee: a scrolling strip has room for more than a
 *  static column did, and the grounded ones are the valuable half. */
const MAX = 6;

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
  const add = (subject: string, question: string, prompt: string, kind: Starter["kind"]) => {
    const key = subject.toLowerCase();
    if (out.length >= MAX || seen.has(key)) return;
    seen.add(key);
    out.push({ subject, question, prompt, kind });
  };

  // 1. Work in motion, NAMED. The rail says "Runs 1"; this says which one.
  for (const m of source.missions ?? []) {
    if (!WORKING.has(m.status)) continue;
    const title = clean(m.title);
    if (title) {
      add(title, "What is the crew doing on it?", `What is the crew doing on ${title}?`, "running");
    }
  }

  // 2. The most recent things that finished, which is the other half of "what
  //    changed" and the half a person can act on.
  const finished = (source.missions ?? [])
    .filter((m) => !WORKING.has(m.status) && !!m.completed_at)
    .sort((a, b) => (b.completed_at ?? "").localeCompare(a.completed_at ?? ""));
  for (const m of finished) {
    const title = clean(m.title);
    if (title)
      add(title, "What changed when it finished?", `What changed when ${title} finished?`, "done");
  }

  return out;
}

/**
 * WHAT YOU COULD ASK, IN A PRODUCT MANAGER'S WORDS, AND NEVER THE SAME LIST.
 *
 * Two founder rulings, 2026-07-30, and the second one is the harder of the two.
 *
 * ONE, THE VOCABULARY. *"Product managers would be my primary users and power
 * users of this platform. The language should be in the product manager's
 * language: what impact it's going to get, what happened in this Q3, what is
 * the next feature in roadmap, what is the agent doing, and slightly on the
 * business side as well. By that way we will connect more to the users, so that
 * power users will feel this platform is built for me."*
 *
 * TWO, AND IT GOVERNS THE SHAPE OF THIS WHOLE MODULE. *"This is not a one time
 * template. It should be revising based on the context what they're working on,
 * and it should be really connected with what they're working on. So you should
 * design the system in that way. Never going to be a static message ever."*
 *
 * So there is NO constant list any more. What a person is offered is derived
 * from the surface they are standing on, every time the pane opens. Standing on
 * a run you are asked run questions and the word "run" is in them; standing on
 * a spec you are asked whether it is ready to build; standing on a decision you
 * are asked whether the bet paid off. The scope chip in the header and these
 * lines are now the same fact said twice, which is what "connected to what
 * they're working on" has to mean if it is going to mean anything.
 *
 * THE GUARDRAIL, and it is the reason this list is shorter than it could be.
 * PM language pulls hard toward metrics: revenue, ARR, NPS, MAU, conversion.
 * This workspace does not hold any of those, so a chip promising them would
 * teach a PM in one press that the product talks a good game and cannot answer.
 * Every line below is answerable from something the record genuinely stores:
 * decisions and their rationale, outcome verdicts (`loadDecisionPrecedent`
 * grades a past bet VALIDATED or MISSED, which is what makes "did it land" a
 * real question), opportunities and their ICE ranking, signal clusters, specs,
 * runs with their steps and metered cost, and the approvals queue. Business
 * FRAMING, workspace FACTS. That is the line, and it is not a compromise: "did
 * this bet pay off" is a better PM question than "what was our ARR" anyway,
 * because it is the one the record can actually settle.
 */

/** A capability line. Named `capability` and not `useCase` because a helper
 *  called `useCase` reads as a React hook to the linter, and to a person. */
const capability = (text: string): Starter => ({
  subject: null,
  question: text,
  prompt: text,
  kind: "use-case",
});

/**
 * The questions a PM has about ONE RUN. Delivery and cost, because that is what
 * you want from work already in flight: where is it, what is left, what did it
 * cost me, and is anything of mine holding it up.
 */
const RUN_PROMPTS = [
  "Where is this, and what is left?",
  "What is holding this up?",
  "What has this cost so far?",
  "What did this change, and who does it affect?",
];

/**
 * The questions a PM has about A SPEC. Readiness and evidence: is it buildable,
 * who actually asked for it, what did we deliberately leave out.
 */
const SPEC_PROMPTS = [
  "Is this ready to build?",
  "Who asked for this, and how strong is the signal?",
  "What did we cut from this, and why?",
  "Turn this into a run and start it",
];

/**
 * The questions a PM has about A DECISION. This is the company brain's home
 * ground: not what we chose, but what we knew, whether it worked, and what
 * would change our mind.
 */
const DECISION_PROMPTS = [
  "Why did we decide this, and what did we know then?",
  "Did this bet pay off?",
  "What would change our mind?",
  "What did we learn the last time we tried this?",
];

/** Standing on the record itself: precedent, and what it adds up to. */
const BRAIN_PROMPTS = [
  "Which bets paid off, and which missed?",
  "What did we learn the last time we tried this?",
  "What do we believe that we have not tested?",
];

/** Standing on discovery: demand, and what it is worth building. */
const SIGNAL_PROMPTS = [
  "What are users asking for most right now?",
  "Which of these is worth building, and why that one?",
  "Draft the spec for the top one and hand it to the crew",
];

/**
 * The default, and the broadest: a PM standing in their own workspace with no
 * one object in front of them. Quarter, roadmap, bets, and the crew, which is
 * the four-word summary of the job.
 */
const WORKSPACE_PROMPTS = [
  "What should we build next, and why that?",
  "What shipped this quarter, and did it land?",
  "Which bets paid off, and which missed?",
  "What is the crew working on right now?",
  "What needs my call before it can move?",
  "What are users asking for most right now?",
  "What is at risk of slipping?",
  "Draft the spec for our next bet and hand it to the crew",
];

/** What the pane knows about where the person is standing. */
export type StarterContext = {
  /** `scope.kinds?.[0]`: mission, prd, decision, doc, note, finding, or null. */
  scopeKind: string | null;
  /** What the chip calls it: "this run", "your specs", "Discover". Used to tell
   *  ONE object ("this run") from a LIST of them ("your runs"), which want
   *  different questions. */
  scopeLabel: string;
};

/**
 * The offered questions for the surface in front of you.
 *
 * Never a constant. The scope chip and this list are derived from the same
 * resolution, so walking from Today to a run to a spec changes what Ask offers
 * on each arrival, and the pane stops looking like it was written once.
 */
export function contextualStarters(ctx: StarterContext): Starter[] {
  const one = ctx.scopeLabel.startsWith("this ");
  switch (ctx.scopeKind) {
    // A single run wants delivery questions; a LIST of runs is really a
    // workspace question wearing a narrower label, so it falls through.
    case "mission":
      return (one ? RUN_PROMPTS : WORKSPACE_PROMPTS).map(capability);
    case "prd":
      return (one ? SPEC_PROMPTS : SPEC_PROMPTS).map(capability);
    case "decision":
      return DECISION_PROMPTS.map(capability);
    case "doc":
    case "note":
    case "finding":
      return BRAIN_PROMPTS.map(capability);
    default:
      // Discover carries a label and no kinds on purpose (see resolveScope), so
      // it is recognised by its label rather than by a kind it does not have.
      if (ctx.scopeLabel === "Discover") return SIGNAL_PROMPTS.map(capability);
      return WORKSPACE_PROMPTS.map(capability);
  }
}

/* ------------------------- the marquee ---------------------------- */

/** Three, fixed. Founder ruling: "two or three rows we fix in. Three rows
 *  should be good enough." */
export const MARQUEE_ROWS = 3;

/**
 * Deal every chip into one of three rows, round robin.
 *
 * ROUND ROBIN RATHER THAN IN BLOCKS, so the grounded chips (which come first
 * and are the ones actually worth reading) end up spread one per row instead of
 * all three crowded into the top row while the other two carry only generic
 * lines. Each chip appears in exactly ONE row: the repetition a marquee needs
 * to loop is done at render time, not here, so nothing is duplicated in the
 * accessibility tree.
 */
export function marqueeRows(items: readonly Starter[], rows = MARQUEE_ROWS): Starter[][] {
  const out: Starter[][] = Array.from({ length: rows }, () => []);
  items.forEach((item, i) => out[i % rows].push(item));
  // A row with nothing in it would animate an empty strip, which reads as a
  // rendering fault. Drop it and let the surface show two rows, or one.
  return out.filter((row) => row.length > 0);
}

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
