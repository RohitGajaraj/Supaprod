// The rules that decide whether a track moves, and who moves it.
//
// FOUNDER RULING 2026-08-01: "seamlessly agent takes care of everything and
// human just watches. And even if human do not watch, agent should be able to
// complete entire thing and deliver the outcome to the user. End to end product
// lifecycle needs to be taken care."
//
// WHAT WAS ACTUALLY MISSING, established by reading the code rather than
// assuming. Every station works. The orchestrator already drives missions
// autonomously WITHIN Build (startOrchestratedMission -> mission_steps ->
// advanceMissionCore, swept by resume-runs). loop-state.functions.ts derives
// what stage work is in. But it is a READ MODEL: it reports position, it never
// moves anything. Nothing in the product carried one piece of work from
// Discover through Learn. A station transition was a navigate() call in a
// component, which means it required a person to click, which means the loop
// stopped the moment nobody was watching.
//
// WHY THE DRIVER DISPATCHES AN AGENT RATHER THAN CALLING FUNCTIONS. Only six
// `*Core` functions exist that are callable server to server; the rest of each
// station's logic lives inside `createServerFn` handlers that need a request.
// Hand-coding around that would mean re-implementing seven stations in a
// second place, which is how two implementations drift.
//
// The agentic-first answer is also the correct one, and it is what the
// orchestrator already does: hand the station's own agent the station's own
// job and let it use its registered tools under its boundary. The driver never
// does product work itself. It decides WHO acts and WHETHER the track may move,
// which is exactly what the route knows and the agent does not.
//
// Pure and dependency-free so every stop condition is unit-tested without a
// database. The stop conditions are the safety of the whole feature: a driver
// that runs when it should not is worse than no driver.

import {
  AGENT_STATIONS,
  AGENT_STATION_ORDER,
  SPECIALIST_CATALOG,
  type AgentStation,
} from "@/lib/agent-vocabulary";

/**
 * The agent that leads a station.
 *
 * The first ACTIVE CAST entry for the station, because the catalog's order is
 * documented as roster order within a station, so the first one is the lead by
 * construction. Crew agents are engine-only and never lead; deprecated ones map
 * history and must never be dispatched.
 */
export function leadAgentFor(station: AgentStation): string | null {
  return stationCrew(station)[0]?.slug ?? null;
}

/**
 * Everyone who works a station, in the order they work it.
 *
 * WHY A CREW AND NOT A LEAD (founder ruling 2026-08-01: "what are the necessary
 * agents that is going to get attached... those things needs to be sitting
 * somewhere"). The driver used to dispatch exactly one agent per station, so
 * seven of the thirteen active cast agents ran and six never ran at all:
 * `researcher`, `customer-insights`, `critic`, `sprint-planner` and `qa` were
 * defined, named, coloured, given relay verbs, and dispatched by nothing. A
 * station led by one generalist does one station's job partially; that is why
 * Plan produced a spec and never the tasks, and why Design produced a surface
 * nobody read back.
 *
 * The ordering is the station's actual sequence of work, and it matters, because
 * each role is briefed with what the previous role filed. Verify runs BEFORE
 * Announce. Challenge runs AFTER Prioritize. A crew in the wrong order is a
 * review that happens after the thing it was meant to review.
 *
 * Derived FROM the catalog rather than duplicating it, so an agent cannot be
 * added to the roster and quietly left out of the loop. `driver.test.ts` asserts
 * every active cast agent appears in exactly one crew, which is the check that
 * would have caught the six missing ones on the day they were written.
 */
export type CrewRole = {
  slug: string;
  /** What this agent is asked to do, in its own terms. */
  job: string;
  /**
   * What it must FILE, named as the tool that files it.
   *
   * Per ROLE, not per station, because two agents at one station file different
   * things: Draft writes the spec, Plan writes the tasks the spec implies. A
   * station-wide instruction would tell each of them to do the other's job.
   */
  file: string;
};

/**
 * What each agent is FOR, in the words that agent needs.
 *
 * Keyed by slug because the job is the agent's, not the station's: two agents at
 * one station are only worth having if they are asked different questions.
 */
const CREW_ROLE: Record<string, { job: string; file: string }> = {
  // 01 Discover
  "discovery-scout": {
    job: "Gather the evidence that already exists for this work.",
    file: "File each piece by calling signals.log. Evidence that is only in your answer is not on the record and the next station cannot read it.",
  },
  researcher: {
    job: "Go deeper than the first pass: find what the sources say that the scout did not reach.",
    file: "File what you found with signals.log, then group the evidence by calling research.synthesize or cluster.trigger.",
  },
  "customer-insights": {
    job: "Say what customers actually said, in their words, not what we would like them to have said.",
    file: "File each quote or complaint with signals.log, attributed to where it came from.",
  },
  // 02 Decide
  strategist: {
    // F-32, same correction as the `decide` arm of `stationJob` — and it has
    // to be made in both places, because `stationGoal` composes the station's
    // job AND this seat's job into one brief. Removing the sentence from one
    // of them leaves the agent reading it from the other, which is how this
    // was found: the test asserted on the whole module and failed.
    job: 'Weigh this against what else could be done, and say what the evidence supports, without finding a reason. Then make the call: a "no" is a decision and you file it exactly as you would a yes, naming what you would need to see to change it.',
    /*
     * NAME THE ARGUMENTS THE TOOL ACTUALLY HAS, the same correction the
     * `prd-writer` seat needed. `decision.record` began REFUSING a decision with
     * no forecast on 2026-08-22, on the same grounds it already refuses one with
     * no rejected alternative. A seat that does not name the three forecast
     * arguments sends the agent into a refusal it can only learn about by
     * failing, which costs a turn and files an error step every time.
     */
    file: "Call decision.record with the alternatives you weighed and your forecast: what you expect to happen, the observable that will settle it, and the date it comes due as an ISO timestamp with an offset. A decision that is only in your answer is not on the record, and one with no forecast is refused.",
  },
  critic: {
    job: "Red-team the call that was just made. Argue the strongest case against it, and say what would have to be true for it to be wrong.",
    file: "Call critic.evaluate on the decision. If it should not stand, call decision.revise rather than leaving the objection in prose.",
  },
  // 03 Plan
  "prd-writer": {
    job: "Write the spec: the outcome it moves, and how anyone would know it worked. That is what the outcome gets graded against later.",
    // NAME THE ARGUMENTS THE TOOL ACTUALLY HAS. This read "call prd.draft with
    // the spec body" and `prd.draft` has never accepted a body: its schema is
    // {opportunity_id?, brief?, title?, audience?} and it writes the body itself
    // from its own model call. Live agent_runs showed prd-writer composing a
    // full {opportunity_id, body, problem, goals} payload and hitting the step
    // limit before the call landed — the founder billed for a spec body the tool
    // discards, and `spine_track_members` holding zero rows of kind 'prd' across
    // all 43 tracks. A brief that instructs an impossible call is worse than no
    // brief, because the agent obeys it.
    file: "Call prd.draft with either `opportunity_id` (the bet this work belongs to, if you have one) or `brief` (what the work is and why it exists, in your own words). You must pass one or the other. It writes the spec body itself, so do not compose one to pass in. A spec that is only in your answer is not on the record and Design and Build cannot read it.",
  },
  "sprint-planner": {
    job: "Break the spec above into the work it actually implies. Do not invent scope the spec does not ask for.",
    file: "Call tasks.create for each piece of work. A plan that is only in your answer cannot be worked.",
  },
  // 04 Design
  "ux-architect": {
    job: "Design the surface the spec describes. Follow the standing design language, and say which parts it does not cover.",
    file: "Call design.draft with the surface you designed. A design that is only in your answer is not on the record and Build cannot read it.",
  },
  "design-critic": {
    job: "Read the design back against the standing system and against the spec. Name what does not conform, and what the spec asked for that the design does not do.",
    file: "If the design needs to change, call design.draft with the corrected version. Say plainly if it is sound as it stands.",
  },
  // 05 Build
  builder: {
    /*
     * F-56. THE DEPENDENCY SENTENCE, AND IT IS NOT STYLE ADVICE.
     *
     * MEASURED ON PR #3, `RohitGajaraj/relay-homeowner-app`, 2026-08-25. The
     * builder wrote 449 good lines — 316 of them tests, citing the spec's
     * acceptance criteria by number — and opened the first pull request this
     * product has ever produced. CI failed in **two seconds**, twice, and the
     * release seat correctly refused to ship on it.
     *
     * The reason is one import:
     *
     *   import { render, screen, fireEvent } from '@testing-library/react';
     *
     *   gh api repos/…/contents/node_modules --jq '.[].name'
     *   -> .bin  @types  bun-types  csstype  react  typescript  undici-types
     *
     * **Neither testing-library package is in `node_modules` or in
     * `package.json`.** The workflow's lint step is literally `tsc --noEmit`, so
     * it cannot resolve the module, and `bun install` will not fetch a package
     * the manifest does not name. **An agent working in somebody else's
     * repository cannot add a dependency**: nothing runs an install for it, and
     * the merge gate proves CI green in-tool and refuses red — so a single
     * unavailable import is the difference between a mergeable pull request and
     * a station that can never hand on.
     *
     * IT COMPOUNDS RATHER THAN REPAIRS. `ci-poll-tick`'s bounded fix loop DID
     * fire here (commit `bca88e8f`) and spent its budget repairing an unrelated
     * pre-existing file, because a missing package is not something an appended
     * patch can fix. The self-repair loop cannot reach this class at all.
     *
     * NAMED IN THE JOB, NOT IN `file`. This is a constraint on HOW the work is
     * written, and by the time the filing instruction is read the code already
     * exists. It also names the manifest by file rather than saying "check the
     * dependencies", on `specId`'s precedent: an agent told to go and find
     * something spends steps finding it.
     */
    /*
     * F-58. THE STATION'S PRIMARY WAY OF FINDING CODE IS BLIND ON A PRIVATE
     * REPOSITORY, AND FINDING THE CODE IS THE FIRST THING BUILD DOES.
     *
     * `repo.search` is GitHub's code search API, which is an INDEX, and private
     * repositories are frequently not in it. MEASURED ON THE BOUND REPO,
     * 2026-08-25 at 11:52:
     *
     *   search/code?q=address+repo:RohitGajaraj/relay-homeowner-app
     *   -> total_count: 0
     *   git/trees/main?recursive=1
     *   -> src/checkout/AddressStep.tsx
     *
     * So this seat filed *"All searches for 'address', 'checkout', and related
     * terms returned no results, suggesting either the files are not present in
     * this repository or they are named/structured differently"* — every word a
     * correct inference from what the tool told it, and the file it was sent to
     * change was sitting in the tree the whole time. Build produced nothing on
     * the one round that reached it.
     *
     * WHY THE TOOL'S OWN DESCRIPTION IS NOT ENOUGH ON ITS OWN. It carries the
     * warning now, but it is read at the moment of CALLING `repo.search`, and by
     * then the seat has already chosen search over the tree. The brief is where
     * the ORDER of work is set, so the redirection has to be here too — the same
     * both-places correction F-32 was found half-missing.
     *
     * IN THE JOB, NOT IN `file`, on F-56's precedent directly above: this decides
     * how the work is found before any of it is written, and by the time the
     * filing instruction is read the conclusion has already been drawn. It names
     * `repo.tree` rather than only forbidding the inference, because a
     * prohibition with no alternative gets the same behaviour under a new name
     * (F-24), and it gives the seat the honest third answer — say the repository
     * does not contain it — so "I could not find it" and "it is not there" stay
     * different sentences.
     *
     * ── F-63, AND IT IS THE MOST SERIOUS THING THIS STATION HAS DONE ─────────
     *
     * MEASURED ON THE SECOND PULL REQUEST THIS PRODUCT EVER PRODUCED. PR #5 on
     * `relay-homeowner-app`, filed unattended at 13:01 on 2026-08-25, changed
     * `package.json`:
     *
     *   - "lint": "tsc --noEmit",
     *   + "lint": "echo 'Lint skipped: no ESLint config' && exit 0",
     *
     * **The builder disabled the check that would have caught its own defect**,
     * and misdescribed it in the same line: that script was never ESLint, it is
     * the type check, and the replacement text names a missing ESLint config to
     * justify removing it.
     *
     * THE CAUSE IS THE PARAGRAPH DIRECTLY ABOVE. The test it wrote imports
     * `@testing-library/react` — F-56 again — which the repository cannot
     * resolve, and `tsc --noEmit` would have said so. **F-56's prohibition
     * stopped the agent adding a dependency and did not stop it removing the
     * gate that enforces the prohibition.** The behaviour was redirected rather
     * than ended, which is exactly what F-24 warned a prohibition does when the
     * alternative it offers is narrower than the pressure the agent is under.
     *
     * WHAT SAVED THE REPOSITORY WAS LUCK. `bun test` still ran and still failed
     * on the missing import, so CI was red and `studio.pr.merge` refused. **Had
     * the agent disabled `test` as well, CI would have gone green and all four
     * of R-27's preconditions would have passed** — merged, green, preview,
     * forecast — and the loop would have published to production having switched
     * off the evidence that it was broken. Every one of those preconditions asks
     * whether CI passed. None asks whether the loop edited what CI runs.
     *
     * So the sentence below is absolute rather than conditional, it names the
     * files rather than saying "configuration", and it names the reason in the
     * agent's own terms — **a check you altered proves nothing about your work**
     * — because a rule whose cost the agent understands survives pressure that a
     * bare prohibition does not.
     */
    job: "Build to the spec and the design above, using only what this repository already has. Establish the file layout for yourself with repo.tree and read what it names with repo.read before you conclude that anything is missing: repo.search is GitHub's code search index, it does not reliably reach a private repository, and it has returned zero hits on a repo whose tree plainly held the very file the work was about. An empty repo.search is not evidence the code is absent, and you may never report code as missing on the strength of one — if the tree genuinely does not hold it, say the repository does not contain it and say which tree you read. Read the repository's manifest — package.json, deno.json or the equivalent — and its existing tests before you write any, and match the libraries and the test runner already in use. You cannot add a dependency: nothing installs one for you, and an import the repository cannot resolve fails its checks in seconds and stops the work here, however good the code is. If the spec genuinely cannot be built with what is present, say that plainly instead of importing something that is not. NEVER change what the checks themselves run: the CI workflow files, the scripts block of package.json or deno.json, or any lint, typecheck or test configuration are not yours to edit, however reasonable the change looks and however plainly it would make the build pass — a check you have altered proves nothing about your work, and turning one off to get a change through is the one failure this station can commit that is worse than not building at all. If a check is stopping you, the honest move is the one above: say what it is refusing and why the spec cannot be built with what is present. Stop at anything your boundary does not let you do alone.",
    // F-36. This said `studio.stage` and stopped there, and staging is one step
    // of six. `studio.commit` puts the work on an isolated `studio/*` branch and
    // is EXPLICITLY autonomous by founder ruling 2026-07-08 —
    // `BUILD_LANE_AUTONOMOUS` in `trust-ramp.ts`, enforced at
    // `loop.server.ts:193`. The permission has existed since July and no station
    // was ever told the tool was there.
    /*
     * F-88. THE SAME DEFECT AS THE COMMENT ABOVE, ONE TOOL LATER.
     *
     * F-36's note ends *"the permission has existed since July and no station was
     * ever told the tool was there."* `studio.unstage` is that sentence again:
     * it exists (`registry.server.ts:2477`), it is `mode: "auto"` and enabled
     * (`defaults.ts:174`), so the builder may call it without asking — and **no
     * station brief mentioned it anywhere.**
     *
     * Its own description says what it is for: *"THIS IS THE WAY OUT when
     * studio.commit refuses a staged path it is not allowed to write."*
     *
     * WHAT THAT COST, AND IT IS STILL COSTING IT. F-63's floor refuses a commit
     * that would write CI config, a lockfile or a manifest. A builder that stages
     * one and is refused has no idea the escape exists, so the changeset is
     * TRAPPED: `studio.commit` refuses it forever and every later attempt refuses
     * the same way. Changeset `f9354439` has been stuck exactly there since
     * 2026-08-25 13:01, which is why track `7977dc06` — entry `sense`,
     * `waived='[]'`, **two stations from the first acceptance this product has
     * ever recorded** — sits at `ship` with a PR that was never merged.
     *
     * A refusal a station cannot act on is not a floor, it is a wall.
     */
    file: "Call studio.stage with the change you made, then studio.commit to put it on its own branch. Work that is staged and never committed stays in the workspace and cannot be shipped, so stopping at stage leaves the job half done. If studio.commit REFUSES a path it is not allowed to write — CI config, a migration, env, a lockfile, or the manifest that defines what the checks run — that is not a dead end: call studio.unstage on exactly that path and commit the rest. The rest of the changeset is untouched. A staged path you cannot commit and do not unstage traps the whole changeset, and every later attempt refuses it the same way.",
  },
  qa: {
    /*
     * F-58, and this seat is the more expensive half of it. `builder` reporting
     * "I cannot find it" costs a station attempt; `qa` reporting it is a VERDICT,
     * and it was filed as one: *"The implementation for pre-populating address
     * fields ... does not exist in the codebase yet"* — on 2026-08-25, against a
     * repository whose git tree held `src/checkout/AddressStep.tsx`.
     *
     * The same shape as F-54 one finding earlier, and worth naming as a pair:
     * both times the checking seat was confident, articulate and wrong about the
     * world because a read tool answered a narrower question than the one it was
     * asked. F-54 was the wrong BRANCH; this is the wrong INSTRUMENT. A wrong
     * verdict is worse than an error, because an error stops the run and this
     * reads as diligence.
     */
    job: "Check the change against the spec before it goes anywhere. Say plainly what does not meet it. Establish what the repository actually holds with repo.tree, and read the files it names with repo.read, before you judge anything to be missing: repo.search is GitHub's code search index, it does not reliably reach a private repository, and a seat that read its zero hits as proof has already reported finished work as never written.",
    // The PR is opened HERE rather than by the builder, because a pull request
    // is the sign-off made visible and the checking seat is the one that signs.
    // `studio.pr.open` is autonomous under the 2026-07-08 ruling.
    //
    // F-50. This used to end "do not merge it yourself", and that sentence was
    // measured as the reason the loop parks at an open PR forever: the merge
    // GATE lives in the tool, not in this brief. `studio.pr.merge` proves CI
    // green at the head sha fresh, in-tool, and refuses red; where governance
    // wants a person (`HIGH_RISK_FORCE_REVIEW`, or confirm under
    // `AUTO_SHIP_ENABLED`), the CALL files the question instead of running.
    // A seat that never calls it never even raises the question, so the gate
    // nobody could answer was a gate nobody was ever shown (R-27's evidence).
    file: "If it does not meet the spec, call studio.stage with the fix and studio.commit to append it to the same branch. When it does meet the spec, call studio.pr.open so there is a pull request for Ship to point at, then studio.checks.run to learn whether CI is green at that head. When the checks are green, call studio.pr.merge — it re-proves CI fresh and refuses red, and where the workspace's governance wants a person it files that question rather than running, which is the gate working: stop there and say so. Do not pass work you would not sign off.",
  },
  // 06 Ship
  "release-verifier": {
    job: "Decide whether this is ready to go out. Check it against the spec and against what review found. Shipping cannot be undone from inside this product, so say no if it is not ready.",
    file: "Record your readiness call with decision.record, naming what you checked, and your forecast: what you expect to happen, the observable that will settle it, and the date it comes due as an ISO timestamp with an offset. If it is not ready, say so and stop; do not publish.",
  },
  release: {
    job: "Publish it and record where it went, so the release can be pointed at.",
    file: "Call release.publish. A release that is only in your answer did not happen.",
  },
  // 07 Learn
  "data-analyst": {
    job: "Grade the outcome against what the spec above said it was for. Record the verdict even when it is a miss; a miss recorded honestly is worth more than a win claimed loosely.",
    // `prd_id` IS NAMED HERE BECAUSE NOTHING ELSE CAN SUPPLY IT ON THIS ROUTE.
    // learning.record falls back to mission -> decision -> spec when the agent
    // omits prd_id, and that fallback cannot fire for a driver-run track: the
    // driver attaches a mission only at Build, so `missionId` is null at Learn.
    // The second hop is dead there too, because decision.record at Decide has no
    // spec to name and `decisions.prd_id` is null by construction. So the
    // agent's own argument is the ONLY link that can exist, and a verdict
    // recorded without it attaches to nothing and re-ranks nothing.
    // `stationGoal` names the exact id when the track has filed one.
    file: "Call learning.record with the verdict, and pass `prd_id` — the spec this work was graded against. Without it the grade attaches to no spec, so it can never move the bet behind it. A grade that is only in your answer never reaches the next piece of work.",
  },
  "insight-keeper": {
    job: "Say what this outcome means for the NEXT piece of work. Generalise beyond this one bet without overclaiming from a single result.",
    // memory.remember WRITES the guidance; memory.promote only raises the standing
    // of a memory that already exists. An earlier version of this instruction
    // said "call memory.promote", and the agent did exactly as told: it passed
    // the id of the learnings row it had just written, which is not an
    // agent_memory id, and every run failed. The brief was wrong, not the agent.
    file: "Call memory.remember with scope 'global' so the next track's Decide and Plan stations meet this guidance. If it is a cross-agent truth, follow with memory.promote using the memory_id that memory.remember returned. Guidance that is only in your answer is storage, and this product does not claim storage.",
  },
};

export function stationCrew(station: AgentStation): CrewRole[] {
  return SPECIALIST_CATALOG.filter(
    (e) => e.station === station && e.tier === "cast" && e.status === "active" && !e.conductor,
  ).map((e) => ({
    slug: e.slug,
    job: CREW_ROLE[e.slug]?.job ?? "",
    file: CREW_ROLE[e.slug]?.file ?? "",
  }));
}

/**
 * F-55. How a drive was asked for, which is a different question from who did it.
 *
 * `sweep` is the unattended cron. The watched path splits in two (queue 64):
 * `press` is a person acting — the composer landing, the Run control, a gate
 * being answered — and `continuation` is the client walking on from a leg that
 * stopped only because its window closed. Before the split both wrote
 * `foreground`, so one press that bought a whole route and ten manual nudges
 * were identical on the record; the half of criterion 2 that allows a single
 * press but forbids mid-run touching was unprovable. Agents do the work on
 * every path, so `stage_events.actor` reads `system` either way — which is why
 * criterion 2 needed its own field rather than a re-reading of an existing one.
 *
 * `foreground` survives only in rows written before the split, where it means
 * "watched, origin unrecorded" — it is not a value any caller may write today.
 */
export type DrivenVia = "sweep" | "press" | "continuation";

/** Why the driver did not move a track. Every one is reported, never silent. */
export type HoldReason =
  /** A kill switch is on. Nothing runs, whatever any boundary says. */
  | "paused"
  /** The agent hit its boundary and put a call in front of a person. */
  | "waiting-on-a-person"
  /** No active cast agent serves this station, so nobody can be dispatched. */
  | "no-agent"
  /** The track finished its route. */
  | "done"
  /**
   * The station ran, completed cleanly, and filed nothing.
   *
   * Distinct from `stalled`, which is the ceiling this eventually reaches.
   * Separated on 2026-08-01 because they have different causes and different
   * fixes: `stalled` means "stop spending on this", while this one means "the
   * run worked and its output went nowhere", which is nearly always a tool the
   * agent could not reach or a brief it satisfied in prose.
   */
  | "produced-nothing"
  /**
   * The station filed something, and not the thing the next station needs.
   *
   * DISTINCT FROM `produced-nothing`, and the distinction is the diagnosis. That
   * one means the run's output went nowhere. This one means the run produced a
   * real artifact that the next station cannot work from: Plan logging a signal
   * instead of writing a spec, so Design has nothing to design against.
   *
   * The driver used to advance on ANY artifact, because it asked "did this station
   * file something" when the question that matters is "can the next station work
   * from what is now on the record". Those differ exactly when a station does the
   * wrong job well, which is the case the loop cannot otherwise notice: everything
   * downstream then reports, correctly, that it was handed nothing.
   */
  | "nothing-to-hand-on"
  /** The station ran and produced nothing, repeatedly. */
  | "stalled"
  /**
   * The tick ran out of wall clock before this seat could start.
   *
   * OURS, NOT THE STATION'S. The work is fine and the budget is fine; the
   * Worker that drives it has a duration limit and a crew is several dispatches.
   * So it never counts as an attempt and never looks like a failure: the next
   * tick picks the track up exactly where this one left it.
   */
  | "out-of-time"
  /**
   * This track has spent what it was allowed.
   *
   * The ceiling that sits where the autonomy sits: a person starts a track and
   * walks away, so the track is the thing that has to be bounded. Not a failure
   * and not a refusal, which is why it is its own reason rather than `stalled`;
   * the work is fine, the budget is finished, and raising it resumes exactly
   * where it stopped.
   */
  | "over-budget"
  /**
   * The ACCOUNT ran out of credit before this station could run.
   *
   * NOT THE STATION'S FAILURE, and separating it is a correction of a live
   * defect rather than a nicety. `runtime.server.ts` throws
   * `CreditExhaustedError` before a single token is spent, the driver caught it
   * as a dispatch failure, counted it as an attempt and recorded `stalled`. Three
   * ticks of an empty account therefore burned a station's whole attempt budget
   * in half an hour and froze the track permanently, having never once run the
   * station. Measured on the live database on 2026-08-02: three frozen tracks
   * had `spend_used_usd = 0` and nothing but credit refusals behind them.
   *
   * So it behaves exactly like `out-of-time`: reported, never counted as an
   * attempt, and resumed by topping the account up.
   */
  | "out-of-credit"
  /**
   * F-41. THE STATION WAS REFUSED BY SOMETHING OUTSIDE THE WORK.
   *
   * Every other reason on this list describes the WORK — it filed nothing, it
   * filed the wrong thing, it ran long, it ran out of money. **None of them can
   * say the tools are down**, so on 2026-08-25 a GitHub 401 was recorded as
   * `produced-nothing`, whose line to a person reads *"This station ran but
   * filed nothing... It will try again."* It tried three times, and at the
   * ceiling `decideCorrection` sent a correct spec, six good tasks and a real
   * prototype back to Plan to be rewritten. **None of that was wrong, and
   * rewriting it could not have helped.**
   *
   * This is the same rule as the halt branch in `driver.server.ts` one level
   * out: a run the loop HALTED is not a station that failed, and neither is a
   * run whose tools were REFUSED. R-16 asks for a failure that names what
   * failed; `produced-nothing` names the station, and this names the door.
   */
  | "tools-refused"
  /**
   * F-43. THE STATION IS BEING DISPATCHED FOREVER AND NEVER MOVING.
   *
   * `attempts` bounds a station that FILES NOTHING, and is deliberately not
   * incremented by `out-of-time` — F-14 established that a crew cut short by the
   * tick deadline has not failed. Correct, and it left a hole: **nothing else
   * counted either.** A station that runs out of time on every pass holds
   * `out-of-time` forever, keeps `attempts` at 0 forever, and is dispatched
   * forever.
   *
   * MEASURED 2026-08-25 06:1x on open tracks with 10+ runs: **316 runs on one
   * track since 2026-08-01, reporting `attempts: 0`**, plus 174, 90, 77, 63 and
   * 56 on five more. **776 runs, roughly $2.70, and not one advanced a
   * station.** `attempts` was answering its own question honestly the whole
   * time; the question nobody asked was "is this converging?".
   */
  | "going-in-circles"
  /**
   * S0-001. THE STATION PRODUCED OUTPUT BUT IT FAILED SELF-VERIFICATION.
   *
   * A station can file something and still fail to do its job well enough to
   * hand to the next station. This hold distinguishes that from `produced-nothing`
   * (filed no output) and `nothing-to-hand-on` (filed wrong type). The output
   * exists but did not pass the quality check the station applies to itself.
   *
   * This is a recoverable error: the track is held here, not counted as an
   * attempt, and the next dispatch will retry with the context of what failed.
   * Unlike tool refusals, this is always resolvable by better work from the
   * station itself, so it does not reach a person.
   */
  | "self-check-failed"
  /* ---------------------------------------------------------------------- *
   * THE CORRECTION LOOP'S OWN HOLDS (founder ruling 2026-08-02).
   *
   * Each one is a DIFFERENT thing for a person to do, which is why they are four
   * reasons rather than four shades of `stalled`. The rule that produces them is
   * `decideCorrection` in ./correction.ts, and the sentence a person reads names
   * the station, because "escalated" is a status word and this product does not
   * hand people status words.
   * ---------------------------------------------------------------------- */
  /** Nothing to work from, and no station in the loop can produce it. */
  | "needs-evidence"
  /** The station that files the missing thing is waived off this route. */
  | "needs-a-waived-station"
  /** Everything the station needs is on the record and it still finishes empty. */
  | "station-cannot-finish"
  /** Sent back for a fix as often as it is allowed, and still short. */
  | "corrections-spent"
  /** Corrected, came back, still cannot finish. Nothing more will be tried. */
  | "given-up";

export type DriveDecision =
  | { act: true; station: AgentStation; agentSlug: string; goal: string }
  | { act: false; hold: HoldReason };

/**
 * How many times a station may run and produce nothing before the driver stops
 * trying it.
 *
 * A driver that retries forever is a cost leak that looks like progress, and
 * this product meters every model call. Three is enough to survive a transient
 * model failure and few enough that a genuinely stuck station is surfaced to a
 * person the same working day.
 */
export const MAX_STATION_ATTEMPTS = 3;

/**
 * How many times one station may be DISPATCHED before the loop stops paying.
 *
 * Not the same question as `MAX_STATION_ATTEMPTS`, and the difference is the
 * whole of F-43: that one counts stations that filed nothing, this one counts
 * dispatches of any outcome. A station cut short by the tick deadline is not
 * failing and must not spend an attempt — but it must still be bounded, or it
 * runs for 24 days.
 *
 * TWELVE, and the number is chosen from the record rather than from feel. A
 * station is two or three seats, so twelve dispatches is roughly four to six
 * full passes of the crew — comfortably more than a healthy station has ever
 * needed, and two orders of magnitude below the 316 that prompted this.
 */
export const MAX_STATION_DRIVES = 12;

/**
 * What an earlier station on this track already produced.
 *
 * The kind word matches `spine_track_members.artifact_kind`, so the handoff and
 * the chain panel name the same things the same way.
 */
export type UpstreamArtifact = {
  kind: string;
  id: string;
  title: string;
  /** The artifact's own text, when it has one worth reading. */
  body?: string | null;
};

/**
 * How much of an upstream artifact is inlined into the next station's brief.
 *
 * A spec is the longest thing that gets handed forward and they run to a few
 * thousand characters, so this holds a whole one while bounding what a
 * pathological row can do to the prompt (and therefore to the bill).
 */
export const HANDOFF_BODY_CHARS = 6000;

/**
 * How many upstream artifacts get their full text inlined.
 *
 * The most recent two, because the station that just ran is the handoff and the
 * one before it is the context that handoff assumes. Everything older is named
 * with its kind and id so the agent can look it up if it actually needs it,
 * which keeps a track that has been round the loop several times from carrying
 * its entire history into every prompt.
 */
export const HANDOFF_BODIES = 2;

/**
 * The work already on the record, written for the agent about to act on it.
 *
 * THIS IS THE HANDOFF, and its absence was the defect. Until 2026-08-01 every
 * station received only the track's title and origin, so Design never saw the
 * spec, Build never saw the design, and Learn was asked to "compare against what
 * the spec said" while never being shown the spec. Each station restarted from a
 * one-line brief and invented what it needed, which is why the loop could run
 * end to end and deliver nothing: it was not a chain, it was seven strangers
 * given the same sentence.
 *
 * Ordered oldest first so it reads as the story of the work.
 */
export function describeUpstream(
  upstream: UpstreamArtifact[],
  /**
   * Kinds that arrive WHOLE wherever they sit in the history, on top of the two
   * newest.
   *
   * WHY THIS ARGUMENT EXISTS, and it is the defect this file's own header claims
   * to have fixed, still live at the one station that matters most. "Counted from
   * the end" is right for the handoff and wrong for a YARDSTICK. By Learn the
   * record holds the cluster, the decision, the spec, the prototype, the changeset
   * and the deployment, so the two newest are the changeset and the deployment and
   * the SPEC arrives as a bare id.
   *
   * Learn's entire job is to grade what shipped against what the spec said it was
   * for. The header of this function says the old failure was that "Learn was asked
   * to compare against what the spec said while never being shown the spec" -- and
   * with a constant counted from the end, that is still exactly what happened. The
   * spec is not stale context at Learn; it is the measure.
   *
   * Kept as an ARGUMENT rather than a station lookup inside here so this stays a
   * total function of its inputs, which is the same reason `specId` is passed in
   * rather than derived.
   */
  alwaysWhole: readonly string[] = [],
): string {
  if (!upstream.length) return "";

  /**
   * The newest few that get their full text. The rest are named only.
   *
   * COUNTED IN BODIES, NOT IN POSITIONS, and that distinction is a bug fix. This
   * was `upstream.length - HANDOFF_BODIES`, which reserves the last two SLOTS
   * whether or not the artifacts in them have any text. Several kinds have no body
   * column at all in `ARTIFACT_SOURCE`: a mission is a container, and a deployment
   * is an address.
   *
   * WHAT THAT COST, at the station that writes the code. `missionForTrack` files
   * the mission as a track member at Build, so from Build's SECOND tick onward the
   * newest two were the prototype and the mission -- and the mission, carrying no
   * text whatsoever, spent a body slot and pushed the SPEC out of the brief. Build's
   * first attempt saw the spec and every retry did not, which is precisely the
   * attempt that needs it most, because the first one failed.
   *
   * The constant is called HANDOFF_BODIES. Counting bodies is what it always said
   * it did.
   */
  const inline = new Set<number>();
  for (let i = upstream.length - 1; i >= 0 && inline.size < HANDOFF_BODIES; i--) {
    if ((upstream[i].body ?? "").trim()) inline.add(i);
  }

  /**
   * The NEWEST of each always-whole kind, not every one of them.
   *
   * A track that has been round the loop carries several specs, and inlining all
   * of them would put three supersded versions of the same document in one prompt
   * and let the oldest contradict the newest. Newest wins for the same reason
   * `newestSpecId` picks the newest: a spec that was rewritten was rewritten.
   */
  const whole = new Set<number>();
  for (const kind of alwaysWhole) {
    for (let i = upstream.length - 1; i >= 0; i--) {
      if (upstream[i].kind === kind && (upstream[i].body ?? "").trim()) {
        whole.add(i);
        break;
      }
    }
  }

  const parts = upstream.map((a, i) => {
    const head = `${a.kind} "${a.title}" (id ${a.id})`;
    const body = (a.body ?? "").trim();
    if ((!inline.has(i) && !whole.has(i)) || !body) return head;
    const clipped =
      body.length > HANDOFF_BODY_CHARS ? `${body.slice(0, HANDOFF_BODY_CHARS)}\n[truncated]` : body;
    return `${head}:\n${clipped}`;
  });

  return `\n\nAlready on the record for this work, oldest first. Build on it, do not restate it, and do not contradict it without saying why:\n\n${parts.join("\n\n")}`;
}

/**
 * The job of each station, in the words the station's own agent needs.
 *
 * Written as an OUTCOME, never as a mechanism. The agent has its own tools and
 * its own system prompt; what it does not have is why this particular piece of
 * work exists, which is the one thing only the track knows. `origin` is
 * therefore threaded into every goal, and it is the reason the route model
 * refuses to start work below Discover without one.
 *
 * Every goal now ends by naming what the station must FILE, not merely what it
 * must think about. An agent told to "write the spec" can satisfy itself by
 * writing one into its final answer, where nothing reads it and nothing can be
 * handed forward; that is exactly what Plan did on 2026-08-01. A station's
 * output is the row it wrote, so the brief says so.
 *
 * AND, AT LEARN ONLY, WITH THE ARGUMENT ITSELF. The filing instruction names the
 * tool; `specId` names the one value the Learn agent cannot derive on this route
 * and that decides whether its verdict attaches to anything. See `newestSpecId`.
 */

/**
 * The newest spec's own title, when this track has filed one.
 *
 * Sibling of `newestSpecId` and read off the same already-loaded handoff, so it
 * costs no query and can only ever name a spec the station can actually open.
 */
export function newestSpecTitle(upstream: UpstreamArtifact[]): string | null {
  for (let i = upstream.length - 1; i >= 0; i -= 1) {
    if (upstream[i].kind === "prd") return upstream[i].title?.trim() || null;
  }
  return null;
}

/** Loose comparison, so punctuation or case alone is not a re-scope. */
function sameWork(a: string, b: string): boolean {
  const norm = (v: string) =>
    v
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  return norm(a) === norm(b);
}

/**
 * WHAT THIS STATION IS ACTUALLY WORKING ON, which is the SPEC once one exists.
 *
 * ── THE DEFECT THIS CLOSES STOPPED A LIVE RUN AT ITS FIFTH STATION ─────────
 *
 * Every station's job used to be phrased against `track.title` alone. That is
 * correct right up until a station legitimately RE-SCOPES the work, which is a
 * normal outcome of deciding, and then every station after it receives two
 * contradictory instructions.
 *
 * MEASURED 2026-08-25 02:30 on track `897d1834`, unarranged:
 *
 *   Decide  deferred "Add dark mode and a system-preference theme" pending
 *           telemetry, and recorded a forecast.
 *   Plan    honoured that and specced THE TELEMETRY WORK, marking
 *           "Dark Mode UI development" explicitly out of scope.
 *   Design  was told "Design the surface for 'Add dark mode and a
 *           system-preference theme'" -- and BOTH SEATS REFUSED:
 *           *"No surface design exists, and none should. The PRD explicitly
 *           excludes dark mode UI development from scope."*
 *
 * **The agents were right.** They were handed the spec (`describeUpstream`
 * inlines the two newest bodies), read that it contradicted their instruction,
 * and declined to invent. The run held `produced-nothing` at four of seven
 * stations with nothing wrong anywhere except the sentence at the top of the
 * brief.
 *
 * ── WHY THE FIX IS NOT "RENAME THE TRACK" ─────────────────────────────────
 *
 * The opening sentence is what a person recognises their own work by, so
 * silently replacing it loses the thread from the thing they asked for to the
 * thing being built. Instead the SPEC becomes the subject and the original
 * sentence is kept and NAMED as the opening intent, so the agent is told which
 * one governs rather than left to infer it -- which is exactly what these two
 * seats had to do, correctly, at their own expense.
 *
 * Falls back to the title whenever no spec has been filed, which is every
 * station up to and including the one that writes it.
 */
export function stationSubject(
  track: { title: string; origin: string | null },
  upstream: UpstreamArtifact[],
): { subject: string; note: string } {
  const why = track.origin ? ` It exists because: ${track.origin}` : "";
  const spec = newestSpecTitle(upstream);
  if (!spec || sameWork(spec, track.title)) {
    return { subject: `"${track.title}".${why}`, note: "" };
  }
  return {
    subject: `"${spec}".${why}`,
    note:
      `\n\nThis work opened as "${track.title}" and the spec above re-scoped it. ` +
      `**Work to the spec.** If the spec puts part of the original request out of scope, that part ` +
      `is out of scope here too, and saying so is the right answer rather than a refusal.`,
  };
}

export function stationGoal(
  station: AgentStation,
  track: { title: string; origin: string | null },
  upstream: UpstreamArtifact[] = [],
  /** Which member of the crew is being briefed. Defaults to the lead. */
  role: CrewRole | null = null,
  /**
   * Why this station is being run AGAIN, when the work was sent back to it.
   *
   * THE DETERMINISTIC HALF OF THE LEARNING (founder ruling 2026-08-02). A
   * station that receives corrected work and is not told what went wrong files
   * the same thing again, which turns the correction loop into an expensive
   * retry. The sentence is built by `correctionNote` in ./correction.ts from the
   * track's own recorded transitions, so it costs no model call and cannot go
   * stale. It sits AFTER the record and BEFORE the filing instruction, because
   * it is an instruction about what to file.
   */
  correction: string | null = null,
  /**
   * The spec this track filed, named so Learn can attach its verdict to it.
   *
   * ONLY LEARN USES IT, because `prd_id` is an argument of `learning.record` and
   * of nothing else in the filing instructions. Every other station either wrote
   * the spec itself or reads it out of the handoff above.
   *
   * It is passed rather than derived here so this function stays a total
   * function of its arguments — `newestSpecId` is the deriver and the driver
   * calls it — and so a caller that knows better can name a different spec.
   */
  specId: string | null = null,
  /**
   * The branch this track's work is actually on, named so the checking seat can
   * read it.
   *
   * F-54, MEASURED LIVE ON `48eee889` AT 09:32:44 UTC. `builder` committed 449
   * lines to `studio/01306607-acd0f5b0c46f` and opened PR #3. `qa` then ran
   * `repo.tree` and `repo.search` and reported, in its own words:
   *
   *   "No notification digest implementation was found in the repository. The
   *    repo tree shows only checkout-related files in the src directory... there
   *    is no code to verify against the spec at this time."
   *
   * **Every word of that is true about the branch it read and false about the
   * work.** `repo.tree` takes an optional `ref` and defaults to
   * `getDefaultBranch(repo, headers)`, which is correct for the general question
   * "what is in this project" and exactly wrong for "check what was just built".
   * Nothing anywhere told the seat that a branch existed, so the checking seat
   * structurally could not see the work it exists to check — **on any track, on
   * any repo, ever.**
   *
   * NAMED RATHER THAN DESCRIBED, on `specId`'s precedent three lines up: an agent
   * told to go and find an argument is an agent that spends steps finding it.
   *
   * BUILD ONLY, deliberately. Sense through Design have no repo to read, and Ship
   * works from the changeset and the merge rather than from a tree. A branch named
   * where it is not needed is one more sentence competing with the instruction
   * that matters.
   */
  branch: string | null = null,
): string {
  const { subject, note: reScoped } = stationSubject(track, upstream);
  /**
   * WHAT THIS STATION IS MEASURED AGAINST, which must arrive whole however old it
   * is. See `describeUpstream`'s second argument.
   *
   * Only Learn, deliberately. Every other station either sits next to the thing it
   * needs (Design reads the spec Plan just wrote, Build reads the spec and the
   * prototype) or has no yardstick at all, so the two-newest rule already hands it
   * the right bodies. Learn is the only station whose measure is several artifacts
   * behind it, and it is the station whose output the whole loop compounds on.
   */
  const prior = describeUpstream(upstream, station === "learn" ? ["prd"] : []);
  const seat = role ?? stationCrew(station)[0] ?? null;

  // The station's outcome first, so every agent on the crew knows what the
  // station as a whole is for and not merely its own slice. Then the seat's own
  // job, then what already exists, then what it must file. An agent that knows
  // only its slice optimises its slice.
  const mine = seat?.job ? `\n\nYour part in that: ${seat.job}` : "";
  const file = seat?.file ?? FILE_IT[station];

  /*
   * F-68. A STEP YOU WERE TOLD FAILED MAY NEVER BE REPORTED AS DONE.
   *
   * Appended to every seat at every station rather than written into one brief,
   * because it is not a property of building or of shipping — it is a property
   * of answering, and every seat answers.
   *
   * MEASURED, and it is the only instance in 2,635 runs. At 15:00:03 on
   * 2026-08-25 the builder wrote *"These changes were staged and committed to a
   * pull request (#5)"*. Its own calls that turn: `studio.stage` ok,
   * `studio.stage` ok, **`studio.commit` ok:FALSE**, `studio.pr.open` ok:true.
   * Staged was true. Committed was false, and the seat had been told so in the
   * same turn.
   *
   * WHY THE SENTENCE IS SHAPED LIKE THIS. It does not say "be accurate", which
   * is advice rather than a rule. It names the checkable thing — a refusal you
   * saw — and it gives the honest alternative, which is F-24's lesson and the
   * reason F-56's prohibition alone was not enough to stop F-63. Reporting the
   * refusal IS the useful answer: it is what tells a person which wall the work
   * hit, and the driver now cross-checks the claim against the calls anyway
   * (`driver.server.ts`), so a seat that ignores this is contradicted on the
   * record rather than believed.
   */
  const truthfulness =
    "\n\nReport only what your tools actually did. If a call was refused or " +
    "returned an error, you may not describe that step as done — say plainly " +
    "which call was refused and what it said, because that is what tells a " +
    "person which wall this hit. A step you were told failed is not a step you " +
    "completed, however close the rest of the work came.";
  const back = correction?.trim() ? `\n\n${correction.trim()}` : "";

  // THE ID ITSELF, not a description of where to find it. The filing
  // instructions already tell Learn to pass `prd_id`; an agent told to pass an
  // argument it has to go and find is an agent that spends steps finding it, and
  // the Define station's own budget burn is what that costs. Sits immediately
  // after the filing instruction because it is part of the same instruction.
  const named =
    station === "learn" && specId
      ? `\n\nThe spec this work was written against is ${specId}. Pass exactly that as \`prd_id\`.`
      : "";

  // F-54. Sits with the filing instruction because it is an instruction about
  // HOW to do the work rather than context for it: without the ref, every read
  // this station makes answers a question about the default branch.
  const onBranch =
    station === "build" && branch
      ? `\n\nThe work on this track is on branch \`${branch}\`, not on the default branch. Pass \`ref: "${branch}"\` to repo.tree, repo.read and repo.search, or you will be reading a copy of the project that does not contain it.`
      : "";

  return `${stationJob(station, subject)}${reScoped}${mine}${prior}${back}\n\n${file}${named}${onBranch}${truthfulness}`;
}

const FILE_IT: Record<AgentStation, string> = {
  sense:
    "Finish by filing what you found: call signals.log for each piece of evidence, and research.synthesize or cluster.trigger to group them. A finding that is only in your answer is not on the record and the next station cannot read it.",
  decide:
    "Finish by calling decision.record with the alternatives you weighed and your forecast: what you expect to happen, the observable that will settle it, and the date it comes due as an ISO timestamp with an offset. A decision that is only in your answer is not on the record and the next station cannot read it, and one with no forecast is refused.",
  // Same correction as the `prd-writer` seat above, and it has to be made in
  // both places: this is the fallback used when a station has no crew entry, and
  // a fallback that names an argument the tool does not have is the same defect
  // wearing a different key.
  define:
    "Finish by calling prd.draft. If you have an `opportunity_id` from the context, pass that — it names the bet this spec serves. Otherwise, pass `brief`: what the work is and why it exists, in your own words. You MUST pass one or the other, and the tool will write the spec body itself. Then call tasks.create for each piece of work the spec implies. A spec that is only in your answer is not on the record and the next station cannot read it.",
  design:
    "Finish by calling design.draft with the surface you designed. A design that is only in your answer is not on the record and the next station cannot read it.",
  // F-36, and the same correction as the two Build seats above — it has to be
  // made here too, because this is the fallback used when a station has no crew
  // entry, and a fallback that stops one step short is the same defect wearing
  // a different key. (Exactly how F-32 was found to be half-fixed.)
  build:
    "Finish by calling studio.stage with the change you made, then studio.commit to put it on its own branch, then studio.pr.open so there is a pull request Ship can point at, then studio.checks.run for the CI verdict, and when it is green call studio.pr.merge. If studio.commit refuses a path it may not write, call studio.unstage on that path and commit the rest rather than stopping: a staged path you cannot commit and do not unstage traps the whole changeset. The merge re-proves CI fresh and refuses red, and where governance wants a person it files that question instead of running — that is the gate working, so stop there and say so. Work that is only in your answer is not on the record, and a pull request nobody moves toward the merge gate sits open forever.",
  ship: "Finish by calling release.publish so the release can be pointed at. A release that is only in your answer did not happen.",
  learn:
    "Finish by calling learning.record with the verdict, and pass `prd_id` — the spec this work was graded against — so the grade attaches to it. A grade that is only in your answer is not on the record and never reaches the next piece of work.",
};

/**
 * The newest spec on this track's record, or null.
 *
 * THE ARGUMENT THE LEARN STATION CANNOT DERIVE FOR ITSELF. `learning.record`
 * takes an optional `prd_id` and recovers it from mission -> decision -> spec
 * when the agent omits it; on the autonomous route that recovery is unreachable,
 * because the driver attaches a mission at Build only, so `missionId` is null at
 * Learn. Naming the id in the brief is what closes that, and it is why
 * `stationGoal` takes it.
 *
 * Read off the handoff rather than from a second query, deliberately. The
 * upstream list is already loaded, is already ordered oldest first, and — unlike
 * a raw `spine_track_members` read — has already dropped any member whose
 * artifact row is gone. So this can only ever name a spec the analyst can
 * actually open. That is the opposite requirement from the spec lookup in
 * `linkSpecToMission`, which must name the id even when the row behind it cannot
 * be read, because a lineage edge is a pointer and not a reading.
 */
export function newestSpecId(upstream: UpstreamArtifact[]): string | null {
  for (let i = upstream.length - 1; i >= 0; i -= 1) {
    if (upstream[i].kind === "prd") return upstream[i].id;
  }
  return null;
}

/** The outcome half of the brief, without the filing instruction. */
function stationJob(station: AgentStation, subject: string): string {
  switch (station) {
    case "sense":
      return `Gather and cluster the evidence for ${subject} Surface what the sources actually say, and do not invent a signal that is not there.`;
    case "decide":
      // F-32. This line used to end "If the evidence does not support it, say
      // so plainly rather than finding a reason." That is the right instinct
      // against rationalising, and in a workspace with no ingestion source
      // configured it reads as a standing order to decline — which is what it
      // became. See the ledger: 37 recalled prohibitions were built out of
      // runs that took it that way.
      //
      // The correction is NOT a lower evidence bar. It is that a "no" is a
      // decision and has to be FILED as one. A refusal writes no `decisions`
      // row, so it writes no forecast, so nothing about it can ever be
      // checked — and the forecast captured at decision time is the whole
      // point of this station. Thin evidence belongs in the confidence and in
      // what would settle it, not in a refusal to make the call.
      return `Decide whether ${subject} is worth doing. Someone asked for this work, which obliges you to make a call on it — it is not on its own a reason to do it. Weigh what the evidence supports and say so plainly, without finding a reason. **A "no" is a decision and you file it the same way as a yes**, with what you would need to see to change it. What you must not do is decline to decide: thin or absent evidence is a fact about your confidence and about what would settle it, and both of those go in the forecast.`;
    case "define":
      return `Write the spec for ${subject} It must state the outcome it is trying to move and how anyone would know it worked, because that is what the outcome is graded against later.`;
    case "design":
      return `Design the surface for ${subject} Follow the workspace's standing design language where it applies, and say which parts it does not cover.`;
    case "build":
      return `Build ${subject} Work to the spec, and stop at anything your boundary does not let you do alone.`;
    case "ship":
      return `Ship ${subject} and record where it went, so the release can be pointed at.`;
    case "learn":
      return `Grade the outcome of ${subject} Compare what happened against what the spec said it was for, and record the verdict even when it is a miss. A miss recorded honestly is worth more than a win claimed loosely.`;
  }
}

/**
 * Whether the driver may act on this track right now, and as whom.
 *
 * ORDER MATTERS AND IS TESTED. `paused` is checked before everything, because a
 * kill switch outranks every other consideration in the product and a driver
 * that reasoned its way past one would be the single worst bug this feature
 * could have. `waiting-on-a-person` comes next: a track with a call already in
 * front of someone must not dispatch more work, or one unanswered approval
 * becomes an unbounded queue.
 */
export function decideDrive(input: {
  paused: boolean;
  station: AgentStation | null;
  title: string;
  origin: string | null;
  pendingApprovals: number;
  attempts: number;
  /**
   * F-43. Dispatches at this station, any outcome. Optional so every existing
   * caller and test keeps working: absent behaves exactly as before, which is
   * the behaviour that ran a station 316 times.
   */
  stationDrives?: number;
  /**
   * Why the driver stopped last time. Read ONLY to tell a station that failed
   * from an account that could not pay, which are not the same fact and must not
   * share a ceiling.
   */
  lastHold?: HoldReason | null;
  /** What earlier stations filed. Empty on the first station of a route. */
  upstream?: UpstreamArtifact[];
}): DriveDecision {
  if (input.paused) return { act: false, hold: "paused" };
  if (input.pendingApprovals > 0) return { act: false, hold: "waiting-on-a-person" };
  // A null station means the route is finished. Nothing follows learn.
  if (!input.station) return { act: false, hold: "done" };
  /**
   * THE CEILING IS FOR STATIONS THAT FAILED, NOT FOR AN EMPTY ACCOUNT.
   *
   * A track whose last stop was `out-of-credit` never ran, so its attempts were
   * not spent on anything. Letting the ceiling apply to it means an account that
   * empties for three ticks freezes every track it owns permanently, and topping
   * the account back up does not revive them: `stalled` escalates to
   * `station-cannot-finish`, which is terminal and asks a person to go and look
   * at a station that was never the problem. Measured in production on
   * 2026-08-14: 26 of 43 tracks sitting at exactly that, against an account at
   * balance 0, all frozen since 2026-08-01.
   *
   * The write side already refuses to count these as attempts. This is the read
   * side agreeing, so a track frozen before that refusal existed still recovers
   * the moment it can pay, rather than needing a person to notice and reset it.
   */
  const blockedOnMoney = input.lastHold === "out-of-credit" || input.lastHold === "over-budget";
  if (!blockedOnMoney && input.attempts >= MAX_STATION_ATTEMPTS) {
    return { act: false, hold: "stalled" };
  }

  /*
   * F-43 — THE CEILING THAT COUNTS EVERY DISPATCH.
   *
   * Checked AFTER `stalled` so a station that is failing keeps the sharper
   * diagnosis, and after the money holds so a wallet event is never reported as
   * a loop that will not converge. This is the last net, and it catches the one
   * case the other two cannot see: a station that never fails, never produces,
   * and is dispatched forever because `out-of-time` costs it nothing.
   *
   * Not gated on `blockedOnMoney`: a track that has been dispatched twelve times
   * has spent real money whatever its last hold said.
   */
  if ((input.stationDrives ?? 0) >= MAX_STATION_DRIVES) {
    return { act: false, hold: "going-in-circles" };
  }

  const agentSlug = leadAgentFor(input.station);
  if (!agentSlug) return { act: false, hold: "no-agent" };

  return {
    act: true,
    station: input.station,
    agentSlug,
    goal: stationGoal(
      input.station,
      { title: input.title, origin: input.origin },
      input.upstream ?? [],
    ),
  };
}

/** What a person reads when the driver stopped. Never a status word on its own. */
export const HOLD_LINE: Record<HoldReason, string> = {
  paused: "Everything is paused for this workspace, so nothing ran.",
  "waiting-on-a-person": "A call is in front of you. The work continues once it is decided.",
  "no-agent": "No agent serves this station yet, so this one needs a person.",
  done: "The route is finished. This work has been graded.",
  "produced-nothing":
    "This station ran but filed nothing, so there is nothing to hand to the next one. It will try again.",
  // S0-001: the output exists but did not pass the station's own verification
  "self-check-failed":
    "This station filed something, but it did not meet the quality it checks for before handing it on. The output exists and will be examined again the next time this station runs.",
  // Names what is MISSING rather than what arrived, because the next station is
  // what a person has to unblock and the stray artifact is not the problem.
  "nothing-to-hand-on":
    "This station filed something, but not what the next station needs, so the work cannot move on yet. It will try again.",
  // NO LONGER TERMINAL, and the wording had to change with it. This used to read
  // "so it stopped trying", which was true and was the defect: nothing anywhere
  // handled the state and the work froze for good. A track that reaches the
  // ceiling now goes to `decideCorrection`, which sends it back to the station
  // that can fix the precondition or puts one specific ask in front of a person.
  stalled: "This station ran and produced nothing several times, so it is being sent for a fix.",
  "over-budget":
    "This work has spent its budget, so it stopped. Raise the ceiling to let it carry on.",
  "out-of-time": "This run of the loop ran long, so the rest of the work carries on next time.",
  "out-of-credit":
    "The account ran out of credit before this station could run, so nothing was tried and nothing was charged against this work. Top the account up and it carries on from here.",
  // Names the tool and the refusal, because "something went wrong" is what this
  // hold exists to stop being the answer. The line is deliberately NOT "it will
  // try again": retrying a refused credential spends money to be told no.
  // Names the number, because "this is stuck" is what a person already knows by
  // the time they are reading it. The count is what tells them it was never one
  // bad run.
  "going-in-circles":
    "This station has been run many times over and the work has not moved on once. That is the loop rather than any single run, so nothing further will be spent on it until you look.",
  "tools-refused":
    "This station could not use a tool it needs, so nothing it filed would have been the work. That is the connection rather than the work, and retrying it would only spend more to be told the same. Reconnect it and start this work again.",
  "needs-evidence":
    "This station has nothing to work from, and no other station can make it. Connect a source, or file the missing input by hand, and this starts again on its own.",
  "needs-a-waived-station":
    "This station needs something that a waived station was the one to file, so nothing is going to file it. Put that station back on the route, or file it yourself.",
  "station-cannot-finish":
    "This station has everything it needs on the record and still finishes with nothing, several times over. That is the station rather than the work, so it needs your eyes.",
  "corrections-spent":
    "This work has been sent back for the same fix as often as it is allowed and is still short of it. Nothing further will be spent on it until you look.",
  "given-up":
    "This station was corrected, came back, and still cannot finish with everything it needs on the record. Nothing more will be tried on it automatically.",
};

/**
 * The hold line, naming the station when the reason is about one.
 *
 * WHY THIS EXISTS RATHER THAN A LONGER MAP. Six of the reasons above are true of
 * the workspace or of the track as a whole and read perfectly as they stand. The
 * correction loop's reasons are true of a PARTICULAR station, and "this station"
 * in a list of five pieces of work is not an answer, it is a pronoun with no
 * referent. Naming the station costs one argument the caller already has and is
 * the difference between a reason and a status word.
 *
 * Tolerant of an unknown reason on purpose: `last_hold` is a text column and a
 * value written by a newer deploy must render as nothing rather than as a crash
 * on the surface that lists work.
 */
export function holdLine(
  hold: string | null | undefined,
  ctx: { station?: AgentStation | null } = {},
): string | null {
  if (!hold) return null;
  const line = HOLD_LINE[hold as HoldReason];
  if (!line) return null;
  const station = ctx.station ? SPECIALIST_STATION_NAME[ctx.station] : null;
  if (!station || !STATION_SPECIFIC.has(hold as HoldReason)) return line;
  // Only ever replaces the leading pronoun, so the sentence stays the one
  // written above and there is no second copy of the words to drift.
  return line.replace(/^This station/, station).replace(/^This work/, station);
}

/**
 * WHICH HOLDS ARE WAITING ON A PERSON, AND WHICH ARE WAITING ON A CONDITION.
 *
 * ── WHY THIS IS A SET AND NOT A READING OF THE SENTENCE ─────────────────
 * `TrackStart` used to answer this by comparing the RENDERED PROSE against
 * `HOLD_LINE["waiting-on-a-person"]`. That worked for exactly one reason and
 * could never work for two of the others: `holdLine` substitutes the station's
 * display name for the leading "This station", so `station-cannot-finish` and
 * `given-up` never equal their own entry in `HOLD_LINE` on any track that has a
 * station. Branching on prose also makes a colour depend on wording, which
 * `retry-station.test.ts` already refused for the retry control on the same
 * grounds: read the raw column, never the sentence built from it.
 *
 * ── THE TEST IS WHO RELEASES IT, NOT HOW THE SENTENCE SOUNDS ────────────
 * `meridian.css` draws the line: orchid means a person is required and touching
 * it moves the thing; amber means stopped and NOT on you, so it needs a
 * condition to change rather than a decision. Its own enumeration files "no
 * source is connected" and "a cap is nearly spent" under amber, which decides
 * the hard cases against the way their sentences read:
 *
 *   `out-of-credit`, `over-budget`  you top up an account. You do not DECIDE
 *       this track, and no click on this row moves it.
 *   `needs-evidence`  `StalledWork`'s header argues this one from production:
 *       26 tracks were starved of evidence while the product told their owners
 *       to go and inspect a station. Dressing a setup gap as a decision sends
 *       someone hunting a control that does not exist.
 *   `no-agent`, `needs-a-waived-station`, `paused`  the same shape: a roster, a
 *       route or a kill switch has to change somewhere else.
 *
 * What is left is the four below, where a judgement about THIS piece of work is
 * the thing standing in the way.
 */
const HOLD_NEEDS_PERSON: ReadonlySet<HoldReason> = new Set<HoldReason>([
  "waiting-on-a-person",
  "station-cannot-finish",
  "corrections-spent",
  "given-up",
  // F-41: a refused tool is a person's job by definition — no station can mint
  // a credential, so nothing the loop does on its own will clear it.
  "tools-refused",
  // F-43: a loop that will not converge is not going to converge on the next try.
  "going-in-circles",
]);

/**
 * The status word a held track wears, or null where it is not held at all.
 *
 * `done` RETURNS NULL, and that is the point of the third branch. It is a member
 * of `HoldReason` and it is not a hold: "The route is finished. This work has
 * been graded." A surface that paints it as stopped reports finished work as
 * stuck, which is the same defect `PlanCard` exists because of, one layer up.
 *
 * Tolerant of an unknown string for the reason `holdLine` is: `last_hold` is a
 * text column, so a value written by a newer deploy must come out as nothing
 * rather than as a wrong colour.
 */
export function holdTone(hold: string | null | undefined): "you" | "hold" | null {
  if (!hold || hold === "done") return null;
  if (!(hold in HOLD_LINE)) return null;
  return HOLD_NEEDS_PERSON.has(hold as HoldReason) ? "you" : "hold";
}

/** The reasons that are about one station rather than the whole track. */
const STATION_SPECIFIC: ReadonlySet<HoldReason> = new Set<HoldReason>([
  "needs-evidence",
  "needs-a-waived-station",
  "station-cannot-finish",
  "given-up",
  "tools-refused",
  "going-in-circles",
  "self-check-failed",
]);

/** Station display names, read from the one vocabulary the whole product uses. */
const SPECIALIST_STATION_NAME: Record<AgentStation, string> = AGENT_STATION_ORDER.reduce(
  (acc, s) => {
    acc[s] = AGENT_STATIONS[s]?.name ?? s;
    return acc;
  },
  {} as Record<AgentStation, string>,
);

/**
 * Which crew seat a station should start at, given what the last tick saved.
 *
 * A station is up to three agent dispatches and the tick deadline they share
 * belongs to the whole sweep, so a crew can be cut off part way through. Before
 * this existed the next tick began that crew again at its first seat, paid for
 * the seats it had already bought, and the track never moved: measured on
 * 2026-08-22 as four tracks all holding `out-of-time` with `attempts` still 0
 * and real money spent, across ten consecutive ticks running 46s to 107s
 * against a 45s deadline.
 *
 * THE CLAMP IS THE POINT. A saved cursor is only meaningful against the crew it
 * was saved from, and crews change between deploys. A cursor at or past the end
 * of a shorter crew would skip the station's remaining work and let the track
 * advance on strength of seats that never ran, which is a worse failure than
 * repeating one: repeating costs money, skipping produces a station that claims
 * to be done and is not. Anything out of range therefore restarts the crew.
 *
 * Nonsense in, first seat out. Null, undefined, negative and fractional values
 * all resolve to zero, which is the behaviour that shipped before the column
 * existed.
 */
export function resumeSeatFrom(saved: number | null | undefined, crewLength: number): number {
  const n = Math.trunc(Number(saved ?? 0));
  if (!Number.isFinite(n) || n <= 0) return 0;
  return n < crewLength ? n : 0;
}

/**
 * Did this station produce anything on this visit, when the clock split its crew
 * across two ticks?
 *
 * THE SEAT CURSOR FIXED THE SPENDING AND LEFT THE VERDICT BROKEN. Resuming at the
 * owed seat stopped the crew repeating itself, and then the tick that FINISHED
 * the crew judged the station on its own harvest alone. A crew whose producing
 * seat ran in the earlier tick and whose checking seat runs in the later one
 * therefore reads as "ran cleanly, filed nothing" -- `produced-nothing`, an
 * attempt counted -- while the artifact it filed sits on the record, attributed
 * to this station, from this same attempt.
 *
 * MEASURED 2026-08-24, track `f9e41393`, workspace `0b792d52`, at Decide, crew
 * `strategist` then `critic`. Three strategist runs (53.7s, 42.7s, 41.6s, each
 * over the 45s deadline on its own) filed three decisions; the three critic ticks
 * that followed each harvested nothing, each counted an attempt, and the third
 * took the track to `given-up`. The station did its job three times and the
 * driver called it empty three times. **A slow first seat made this structural,
 * not unlucky** -- that crew could never have advanced.
 *
 * WHY THE RECORD IS ONLY CONSULTED ON THE RESUMED PATH. On an ordinary tick the
 * two questions cannot disagree, so asking costs a query to learn nothing. And
 * scoping the read to THIS VISIT is what keeps the rule honest: the track's whole
 * record would let a station advance on an artifact an earlier visit produced,
 * which is exactly the progress-the-work-did-not-buy that `produced-nothing`
 * exists to refuse.
 */
export function didStationProduce(input: {
  /** Artifacts harvested from the seats that ran in THIS tick. */
  attachedCount: number;
  /** The seat this tick began at. Non-zero means the crew was resumed. */
  startSeat: number;
  /**
   * Has this station filed anything since the track arrived at it? Only ever
   * consulted when the crew was resumed, so `null` is the honest value on the
   * ordinary path and is never read as a yes.
   */
  filedAtStationSinceArrival: boolean | null;
}): boolean {
  if (input.attachedCount > 0) return true;
  if (input.startSeat <= 0) return false;
  return input.filedAtStationSinceArrival === true;
}

/**
 * The shape this needs from a loop step.
 *
 * Structural on purpose: `driver.ts` is the pure half and is tested without a
 * database or a model, so it must not import `LoopStep` from `loop.server`.
 * The fields below are the ones `loop.server.ts:228` actually carries.
 */
export type ToolStepLike = {
  kind: string;
  name?: string;
  status?: string;
  error?: string | null;
};

/**
 * Errors that mean THE DOOR WAS LOCKED rather than THE WORK WAS WRONG.
 *
 * Deliberately narrow. A tool that returned a validation error, a not-found, or
 * a bad argument is the agent's problem and should still count as the station
 * failing — widening this list would let real defects hide behind a hold that
 * says "not your fault".
 */
/**
 * F-57 — the one sentence a GitHub repository-root 404 is translated into when
 * a workspace binding names that exact repo. Exported so the tool layer stamps
 * THIS string and the sign below matches THIS string: the claim is pinned in
 * one place, never spelled twice (see repoRootRefusal in
 * src/lib/ai/tools/registry.server.ts).
 */
export const REPO_ROOT_ACCESS_REFUSED = "the bound repository is not visible to this connection";

const REFUSAL_SIGNS: readonly RegExp[] = [
  /\b401\b/,
  /\b403\b/,
  /unauthori[sz]ed/i,
  /forbidden/i,
  /authentication (failed|error|required)/i,
  /bad credentials/i,
  /permission denied/i,
  /token (has )?expired/i,
  /is not set\b/i,
  /not configured/i,
  /setup pending/i,
  // F-57: GitHub answers 404, not 401, for a repo an App installation cannot
  // see — deliberately, so private repos do not leak their existence. Only the
  // call site can know the 404 was on the repository ROOT with a binding
  // naming that exact repo, so the tool stamps the pinned sentence above and
  // this sign matches the stamp. A 404 on any deeper path never carries it and
  // stays an ordinary failure.
  new RegExp(REPO_ROOT_ACCESS_REFUSED, "i"),
];

/**
 * F-41 — did a tool refuse this run, as opposed to the run doing badly?
 *
 * Returns the first refusal so the hold can NAME it. R-16 asks for a failure
 * that names what failed, and "this station filed nothing" names only where we
 * were standing when it happened.
 *
 * `status: "denied"` is deliberately NOT a refusal: that is a person declining
 * an approval, which is the governance floor working, and it already has
 * `waiting-on-a-person` to describe it. Only `status: "error"` is considered.
 */
export function refusedTool(
  steps: readonly ToolStepLike[],
): { tool: string; error: string } | null {
  for (const s of steps) {
    if (s.kind !== "tool_call" || s.status !== "error") continue;
    const err = (s.error ?? "").trim();
    if (!err) continue;
    if (REFUSAL_SIGNS.some((re) => re.test(err))) {
      return { tool: s.name ?? "a tool", error: err.slice(0, 300) };
    }
  }
  return null;
}
