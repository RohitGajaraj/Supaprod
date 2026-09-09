/**
 * WHAT KIND OF WORK A TYPED SENTENCE IS, SO ASK STOPS GUESSING "NEW".
 *
 * ── THE DEFECT (F-222, Lane 1, handed over 2026-09-09) ─────────────────────
 * `AskPane`'s hand-over passed `shape: "new-capability"` as a literal and no
 * `origin` at all. `new-capability` is the ONE shape that waives nothing
 * (`SHAPES` in route.ts), so **every sentence typed into Ask opened a full
 * seven-station run** — "fix the broken login" walked Discover, Decide, Plan
 * and Design before anything touched Build. The home had the same defect until
 * Lane 1 put a route picker beside its composer; Ask cannot take that fix,
 * because its hand-over fires from intent detection on submit rather than from
 * a row with space for a control, and a select bolted onto a conversation pane
 * is interrogation rather than anticipation.
 *
 * ── SO IT IS DERIVED AND SAID, NOT ASKED ───────────────────────────────────
 * `ask-intent.ts` set the precedent in this exact pane and states the rule this
 * file follows: *"This module does not take the decision away from the server.
 * It picks the DEFAULT of a control the person can see and flip before they
 * press anything."* Pure, cheap, no model call, runs on every keystroke.
 *
 * The place it is SAID is the hint line under the composer, which already
 * exists and already fires on exactly the drafts that would hand over. It read
 * "This starts a run and spends credits." and now names the shape and the
 * station the work enters at, so a person reads what is about to happen before
 * they press and rewords if it is wrong. Nothing new is asked of them.
 *
 * ── WHY THE DEFAULT IS `existing-feature` AND NOT `new-capability` ─────────
 * The two are not symmetric and the cost of being wrong is not symmetric.
 * `new-capability` waives nothing and runs all seven stations; `existing-feature`
 * enters at Decide, which is where the forecast is captured, so it still gets
 * the one thing this product calls its moat. A person typing into Ask is
 * standing inside a workspace, looking at a product that exists, talking about
 * it. Treating that as a greenfield capability is the expensive guess, and it
 * was the one being made every time.
 *
 * So `new-capability` now requires the sentence to SAY it is new. The other
 * three shapes are recognised on their own words, and everything unclaimed
 * lands on `existing-feature`.
 *
 * ── WHAT THIS IS NOT ───────────────────────────────────────────────────────
 * Not a classifier anybody should trust for anything but a default. It is a
 * word list, it is wrong on sentences that describe a state without naming it,
 * and it is deliberately readable rather than clever so a person reading the
 * file can predict what it will do. The correction is the person's own words:
 * they see the answer before they press.
 *
 * Pure and dependency-free apart from the shape vocabulary itself.
 */
import type { WorkShape } from "@/lib/spine/route";

/**
 * SOMETHING IS BROKEN NOW, and it is tested first because it OUTRANKS the
 * others when a sentence carries both. "Fix the broken login button" names an
 * interface and an incident; the incident is what makes it urgent and what
 * decides the route, and a person who says something is broken has told you
 * more than a person who says it is a button.
 *
 * The status codes carry an optional plural because people write them that way:
 * "the reset password link 404s" is how a real report of a broken link reads,
 * and a bare `\b404\b` does not match it. Caught by the test, not by review.
 */
const INCIDENT =
  /\b(broken|breaks|broke|down|outage|failing|fails|failed|crash(es|ing|ed)?|regress(ion|ed)?|hotfix|urgent|stopped working|not working|does ?n[o']t work|can ?not (log ?in|sign ?in|check ?out|load|open)|(?:404|500|502|503)s?|timing out|times out)\b/i;

/**
 * NOBODY SEES IT DIRECTLY. Verbs of maintenance and the nouns of the machine
 * room. Second because a refactor is never also an incident by these words, and
 * because "rename the button" is a rename first: it changes no behaviour.
 *
 * Safe to derive: this shape enters at Decide and keeps it, so a sentence
 * misread as maintenance still captures its forecast.
 */
const UNDER_THE_HOOD =
  /\b(refactor|migrat(e|ion)|upgrade|downgrade|rename|dedupe|de-?duplicat\w*|index(es|ing)?|performance|latency|slow(er)?|memory leak|dependenc(y|ies)|clean ?up|tech(nical)? debt|test coverage|logging|instrument\w*|type ?check|lint)\b/i;

/*
 * ── `interface-change` IS NEVER DERIVED HERE, AND THE REASON IS THE MOAT ───
 *
 * There WAS a word list, it was written first, and the test killed it. Two
 * production titles scored it: *"Let a homeowner reschedule an installer visit
 * from the order page"* came back `interface-change` on the word "page", and
 * *"Make OTA notifications visually distinct."* came back `existing-feature`
 * because it happened to use none of the listed nouns. The list was both too
 * eager and too blind on the same run.
 *
 * That is a bad classifier, and it would be a tolerable one for most shapes.
 * It is not tolerable for this one. `interface-change` WAIVES DECIDE
 * (`SHAPES` in route.ts), and route.ts's own comment states the consequence:
 * the forecast is captured by `decision.record` at Decide, and *"a route that
 * waives Decide is a route that structurally CANNOT capture the one thing this
 * product claims as its moat"*. It cannot be un-waived for this shape either
 * without contradicting a second waiver's reason, which that comment also
 * works through.
 *
 * **So a false positive here does not cost three stations. It costs the
 * forecast, silently, on a run nobody chose that route for.** A word list may
 * not make that trade on a person's behalf. The shape stays reachable from the
 * home's picker, where a human says it out loud; it is not reachable from a
 * regex reading a sentence somebody typed into a conversation.
 *
 * The three below are safe in a way this one is not: `incident-fix` and
 * `under-the-hood` both enter at Decide and keep it, and `new-capability`
 * waives nothing at all.
 */

/**
 * NEW, AND THE SENTENCE HAS TO SAY SO.
 *
 * Deliberately NOT the verb "add". "Add a saved-address option to checkout" is
 * a change to a checkout that exists, and treating every "add" as greenfield is
 * exactly the guess that produced this file. What survives here is a phrase
 * that asserts the thing does not exist yet.
 */
const NEW_CAPABILITY =
  /\b(we do ?n[o']t have|there is no|there ?'s no|we have no|from scratch|brand ?new|introduce a|introduce an|new (product|surface|feature|capability|integration)|greenfield|net ?new)\b/i;

/**
 * The shape a sentence looks like, for use as a DEFAULT and nothing else.
 *
 * FIRST MATCH WINS, in the order the lists are declared, and the order is the
 * argument. An empty or whitespace draft returns the default rather than null,
 * because the caller wants a shape to show and "no shape yet" is not a thing
 * the hint line can say.
 */
export function shapeOfTheWork(draft: string): WorkShape {
  const text = (draft ?? "").trim();
  if (!text) return "existing-feature";
  if (INCIDENT.test(text)) return "incident-fix";
  if (UNDER_THE_HOOD.test(text)) return "under-the-hood";
  if (NEW_CAPABILITY.test(text)) return "new-capability";
  /*
   * THE DEFAULT, AND IT IS A CHOICE RATHER THAN A FALLBACK. See the header:
   * a person typing into Ask is inside a workspace talking about a product that
   * exists, and `existing-feature` still enters at Decide, so the forecast is
   * captured either way. Being wrong here costs three stations; being wrong the
   * other way costs seven.
   */
  return "existing-feature";
}
