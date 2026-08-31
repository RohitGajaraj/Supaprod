/**
 * THE GOLDEN SET'S ADMISSION TEST — gap #24, and the set it guards is EMPTY.
 *
 * The playbook's third principle is "trust, but verify", and its mechanic is a
 * set of verified pairs a change is tested against, so a fix is checked against
 * the records that already failed instead of being proved by hand one at a
 * time. QUEUE-S4 states the rule that shaped this: "Build it from real graded
 * runs -- a golden set built from a broken pipeline encodes the breakage", and
 * "no case is seeded, and if that leaves the set nearly empty, the set says
 * nearly empty."
 *
 * So the admission test was written first and the cases second. There are none.
 *
 * THE FOUR TESTS, each a column rather than a judgement:
 *   1. the workspace is not is_sample
 *   2. forecast_resolution is not null
 *   3. forecast_resolved_by_agent_slug is not null   <- a human verdict is a
 *      fine outcome and a useless test case, because the thing under test is
 *      whether the LOOP grades correctly
 *   4. forecast_resolved_at carries a real time of day, not 00:00:00
 *
 * Test 4 is the one that turned this into a finding. All twelve real
 * resolutions in the database sit at midnight UTC with zero microseconds --
 * twelve for twelve -- which a grader firing at a horizon does not do. It is
 * the same instrument that found 98 planted learning_citations sharing one
 * microsecond suffix, and 7,225 planted guardrail_hits sharing a microsecond a
 * month apart.
 *
 * THIS SCRIPT DOES NOT READ THE DATABASE. S4 may read Postgres but a check that
 * needs a credential is a check nobody runs, and the numbers below were measured
 * and are quoted with their query in README.md. What this guards is the FILE:
 * that no case was ever added which fails a test, and that nobody quietly
 * emptied the tests to fill it.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SET = join(HERE, "..", "golden", "cases.json");

/** Every test a case must pass. Removing one is the failure this guards against. */
const ADMISSION = [
  "workspace_is_not_sample",
  "forecast_is_resolved",
  "resolved_by_an_agent",
  "resolved_at_is_not_a_date_literal",
];

let set;
try {
  set = JSON.parse(readFileSync(SET, "utf8"));
} catch (e) {
  console.error(`REFUSING: could not read ${SET} -- ${e.message}`);
  process.exit(2);
}

const cases = Array.isArray(set.cases) ? set.cases : null;
if (cases === null) {
  console.error("REFUSING: cases.json has no `cases` array. The set is malformed, not empty.");
  process.exit(2);
}

console.log("THE GOLDEN SET -- gap #24\n");
console.log("Admission, measured 2026-08-31 against project 371dd588:");
console.log("  forecasts recorded ............... 192");
console.log("  ...resolved at all ...............  91");
console.log("  ...on a real workspace ...........  12");
console.log("  ...graded by an AGENT ............   0");
console.log("  ...with a real resolution time ...   0   <- all twelve read 00:00:00+00\n");

if (cases.length === 0) {
  console.log(`The set is EMPTY, and that is the finding rather than a gap in the work.`);
  console.log(`Nothing has ever been graded by the loop, so there is no verified pair to`);
  console.log(`test a change against. The nearest real candidate is d2263583's forecast,`);
  console.log(`due 2026-10-15.\n`);
  console.log(`DO NOT fill this by lowering a test. Each of the four exists because a`);
  console.log(`specific number here turned out to be seed data when somebody checked.`);
  process.exit(0);
}

/*
 * A case that exists must carry every admission test as an explicit true, and
 * must name the run it came from and the date it was graded -- QUEUE-S4's own
 * acceptance. A case that cannot say where it came from is not evidence.
 */
const bad = [];
for (const c of cases) {
  const missing = ADMISSION.filter((t) => c[t] !== true);
  if (missing.length > 0) bad.push({ id: c.id ?? "(unnamed)", why: `fails ${missing.join(", ")}` });
  if (!c.from_run) bad.push({ id: c.id ?? "(unnamed)", why: "names no run it came from" });
  if (!c.graded_at) bad.push({ id: c.id ?? "(unnamed)", why: "names no date it was graded" });
}

console.log(`${cases.length} case(s) in the set.`);
if (bad.length === 0) {
  console.log("Every case passes all four admission tests and names its run and grading date.");
  process.exit(0);
}

console.error(`\n${bad.length} case(s) should never have been admitted:\n`);
for (const b of bad) console.error(`  ${b.id}: ${b.why}`);
console.error(
  "\nA golden set built from a broken pipeline encodes the breakage. Remove the case,\n" +
    "or explain in README.md why the test no longer applies -- never both quietly.",
);
process.exit(1);
