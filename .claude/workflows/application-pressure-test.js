export const meta = {
  name: "application-pressure-test",
  description:
    "Draft, fact-verify and adversarially pressure-test every field of any outward application",
  whenToUse:
    "Before submitting ANY outward application. Pass args {program, applyUrl, deadline, selectsFor, clusters:[{key,title,fields,extra}], panel?}. Derives live numbers itself so it never ships a stale figure. Returns paste-ready copy plus what the panel would still push on.",
  phases: [
    { title: "Facts", detail: "derive live numbers and load canon" },
    { title: "Draft", detail: "one agent per field cluster" },
    { title: "Verify", detail: "every claim checked against repo, git and database" },
    { title: "Pressure", detail: "adversarial reader panel scores the whole application" },
    { title: "Final", detail: "assemble, de-duplicate, report surviving weaknesses" },
  ],
};

// =====================================================================================
// WHY THIS EXISTS
//
// Three failures produced this harness, and each phase answers one of them.
//
// 1. Applications went out carrying numbers nobody could reproduce, and three of them
//    turned out to be seed data. -> Phase "Facts" derives every number at run time and
//    hands downstream agents a sheet they may not deviate from.
//
// 2. A retired claim escaped six phrase-sweeps in one day because it travelled under a
//    new wording. -> Phase "Verify" checks CLAIMS against the code and the canon, not
//    strings against a banned list.
//
// 3. An adversarial reader panel improved the copy and did not make it true: a synthesis
//    step attributed another company's experiment to the founder and all three readers
//    rated that sentence the strongest in the field, because a false sentence that fits
//    the argument reads as the best one. -> Verify runs BEFORE Pressure, and Final is
//    forbidden from inventing a fact to close a weakness the panel names.
//
// USAGE
//   Workflow({ name: 'application-pressure-test', args: { ... } })
// or from a script file with the same args shape.
// =====================================================================================

const REPO = "/Users/rohitgajaraj/Projects/My Projects/My Builds/Supaprod";

const a = args || {};
const PROGRAM = a.program || "this programme";
const APPLY_URL = a.applyUrl || "(not given)";
const DEADLINE = a.deadline || "(not given)";
const SELECTS_FOR =
  a.selectsFor || "Not supplied. Infer it from the questions themselves and say what you inferred.";

if (!a.clusters || !a.clusters.length) {
  throw new Error(
    "application-pressure-test needs args.clusters: [{key, title, fields, extra}]. " +
      "fields = the questions verbatim with their word limits. extra = programme-specific guidance.",
  );
}
const CLUSTERS = a.clusters;

// -------------------------------------------------------------------------------------
phase("Facts");
// -------------------------------------------------------------------------------------

const FACT_SCHEMA = {
  type: "object",
  properties: {
    commits: { type: "string", description: 'the "5,000+" rounded form used in copy' },
    commits_exact: { type: "number" },
    migrations: { type: "string" },
    migrations_exact: { type: "number" },
    weeks: { type: "string", description: 'word form, e.g. "ten weeks"' },
    first_commit_date: { type: "string" },
    outside_users: { type: "string" },
    revenue: { type: "string" },
    live_mechanisms: {
      type: "array",
      description:
        "mechanisms verified present AND reachable today, each with the check that proves it",
      items: {
        type: "object",
        properties: {
          claim: { type: "string" },
          evidence: { type: "string" },
          scope_limit: { type: "string" },
        },
        required: ["claim", "evidence"],
      },
    },
    wired_but_never_run: {
      type: "array",
      description:
        "mechanisms that exist in code and have never produced a row. State the mechanism, never a history.",
      items: { type: "string" },
    },
    real_connectors: { type: "array", items: { type: "string" } },
    stub_connectors: { type: "array", items: { type: "string" } },
    retired_claims: {
      type: "array",
      description: "claims the canon has falsified, each with the replacement",
      items: {
        type: "object",
        properties: { never_say: { type: "string" }, say_instead: { type: "string" } },
        required: ["never_say", "say_instead"],
      },
    },
    banned_words: { type: "array", items: { type: "string" } },
    numbers_that_must_not_be_used: { type: "array", items: { type: "string" } },
    founder_bio_facts: { type: "array", items: { type: "string" } },
    market_evidence: {
      type: "array",
      description:
        "each dated and attributed. Attribution matters: a fact attributed to the wrong person is a fabrication.",
      items: { type: "string" },
    },
    live_urls: { type: "array", items: { type: "string" } },
  },
  required: [
    "commits",
    "migrations",
    "weeks",
    "outside_users",
    "revenue",
    "live_mechanisms",
    "retired_claims",
    "banned_words",
  ],
};

const facts = await agent(
  `You are building the fact sheet that every other agent in this
workflow must write from. Anything not on your sheet does not go into the application.

Repo: ${REPO}

DERIVE, do not recall:
  git -C "${REPO}" rev-list --count origin/main
  ls "${REPO}"/supabase/migrations/*.sql | wc -l
  git -C "${REPO}" log --reverse --format='%ad' --date=short | sed -n 2p   # first REAL commit; line 1 is template scaffold
Then compute elapsed weeks to today. In COPY the numbers appear rounded down with a
plus ("5,000+"), never exact, so a figure cannot go stale mid-review or mismatch GitHub.

READ these and extract the binding rules:
  ${REPO}/docs/strategy/positioning-locked-2026-08.md   (canon: the five beats, retirements, vocabulary rulings)
  ${REPO}/docs/pitch/applications/README.md             (the binding language rules and the retired-claims table)
  ${REPO}/docs/pitch/applications/answer-bank.md        (live numbers card, the five laws, the customer-evidence rule)
  ${REPO}/docs/pitch/verified-numbers.md                (every number with its query, and the retired list)
  ${REPO}/docs/planning/SOURCE-OF-TRUTH.md              (section 0 only: what shipped, what is gated)
  ${REPO}/CLAUDE.md                                     (vocabulary canon)

THE DISTINCTION THAT DOES THE MOST WORK, and you must apply it to every mechanism:
a writer that exists and has not run is a product waiting for a user; a hop with no
writer is a hole. Put the first kind in live_mechanisms ONLY if it is also REACHABLE by a
reviewer today (merged AND deployed). Put anything merged-but-unpublished, or built-but-
never-exercised, in wired_but_never_run. A reviewer clicks the URL.

For every live mechanism also record scope_limit. "Immutable" that covers three columns
of eleven with a service role exempt is a scope overclaim, and scope overclaims are the
most common way an honest application becomes a false one.

For connectors, check which providers are real and which are stubAdapter in
${REPO}/src/lib/connectors/providers/index.server.ts. Never let a stub be implied to work.

Return the sheet. Be exhaustive on retired_claims and banned_words: those are what stop a
falsified claim reaching a reviewer under a new wording.`,
  { label: "facts:derive", phase: "Facts", effort: "high", schema: FACT_SCHEMA },
);

if (!facts)
  throw new Error("Fact derivation failed. Nothing downstream can be trusted, so stopping.");

log(
  `facts: ${facts.commits} commits, ${facts.migrations} migrations, ${facts.weeks}, ${facts.live_mechanisms.length} live mechanisms, ${(facts.wired_but_never_run || []).length} wired-not-run`,
);

const REGISTER = `
=========================== THE FOUNDER'S REGISTER (BINDING) ===========================

### THE TWO RULES THAT OVERRIDE EVERYTHING ELSE

**1. WRITE FROM THE USER'S LENS, NOT THE FOUNDER'S.**
When describing what the product does, the subject is the product team using it, never
the founder. "The weak bets get argued down before I see them" is wrong: a reviewer does
not care what the founder sees. Say what the PM gets.

And "you" must be unambiguous. In a product sentence, "you" reads to a reviewer as
THEMSELVES, which makes the claim confusing. If a sentence needs a person, name them
("the PM", "the team"). Reserve "I" for the questions actually about the founder: how
long you have worked on this, who writes the code, why you picked the idea.

**2. THE OUT-LOUD TEST.**
Before any sentence ships, ask: would I say this out loud, in these words, to a partner
sitting across a table who wants to know what this is? If it would sound rehearsed,
inflated or like a deck, rewrite it the way you would actually say it.

**3. DESCRIBE THE PRODUCT BY WHAT A TEAM FEEDS IT AND GETS BACK, NEVER BY THE PLUMBING.**
The connector list is what it plugs into, not what it does, and writing from the
inventory silently narrows the product. "A team connects the places their user feedback
sits" is wrong twice over: the inputs are user feedback AND product analytics AND sales
and support conversations AND market and competitor movement AND the direction the team
has already chosen, and naming four integrations implies the set stops there.

Before shipping any product sentence, ask what the fullest true version of the input is,
then whether the sentence covers it. Under-describing is as much a defect as overclaiming
and it is far harder to notice, because a narrow sentence still reads as true.

Corollaries the founder named directly:
- No drama words, no invented programme vocabulary, no category language.
- Never make the plan sound small. "One person at a time" reads as no ambition. State
  the intent at the scale you actually mean.
- If a claim is heavy, ask whether it is even true today before polishing it. A sentence
  that sounds impressive and cannot be defended is worse than a plain one that can.

- SHORT BLOCKS, two to three lines. NEVER long paragraphs.
- Precise, on point, concise, slightly polite. NEVER braggy.
- ZERO filler, zero hedging, zero blurb. A reviewer reads thousands per cycle at a few
  minutes each. Anything not load-bearing costs the read.
- ANSWER THE QUESTION ACTUALLY ASKED. Never drift, and never state the same fact in two
  fields. Repetition is the single thing reviewers name most often as padding.
- NO NEGATIVE FRAMING and no self-flagellation. Banned specifically: any phrasing that
  apologises for having no usage history, because it invites "so why is it not in front
  of anyone", which reads as the founder's own failure. The rule is only that we may not
  CLAIM an accrued record. It never required volunteering that there is none.
- Avoid filler-clause constructions built on "why / which / were". Declarative sentences,
  one fact each.
- Never use programme-category words (incubator, accelerator) inside the copy.
- NO EM DASH and no en dash anywhere in a paste block.
- Delete any sentence that stays true with a competitor's name swapped in.
- Never confess an error the reviewer never saw. Check whether a mistake actually reached
  THIS programme before volunteering it.
`;

const SHEET = `
=========================== THE FACT SHEET (do not deviate) ===========================
${JSON.stringify(facts, null, 2)}
${REGISTER}
=========================== THE PROGRAMME ===========================
Programme: ${PROGRAM}
Apply URL: ${APPLY_URL}
Deadline: ${DEADLINE}
What it selects for: ${SELECTS_FOR}
`;

// -------------------------------------------------------------------------------------
phase("Draft");
// -------------------------------------------------------------------------------------

const DRAFT_SCHEMA = {
  type: "object",
  properties: {
    fields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          answer: { type: "string", description: "paste-ready, no commentary" },
          note: { type: "string", description: "one line for the founder on the choice made" },
          founder_input_needed: {
            type: "string",
            description: "empty if none. Never invent instead of asking.",
          },
        },
        required: ["id", "question", "answer", "note"],
      },
    },
  },
  required: ["fields"],
};

const VERIFY_SCHEMA = {
  type: "object",
  properties: {
    fields: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          question: { type: "string" },
          answer: { type: "string" },
          note: { type: "string" },
          verification: { type: "string", description: "what was checked and what changed" },
          claims_removed: { type: "array", items: { type: "string" } },
          founder_input_needed: { type: "string" },
        },
        required: ["id", "question", "answer", "verification"],
      },
    },
  },
  required: ["fields"],
};

const verifiedClusters = await pipeline(
  CLUSTERS,

  (c) =>
    agent(
      `${SHEET}

Write this cluster of the ${PROGRAM} application.

FIELDS (verbatim questions, with limits):
${c.fields}

CLUSTER GUIDANCE:
${c.extra || "(none)"}

Read from the repo whatever you need to get a fact right, but the fact sheet above wins
over anything you read. If a field genuinely needs something only the founder has, put it
in founder_input_needed. Never invent a number, a user, a conversation or a quote.`,
      { label: `draft:${c.key}`, phase: "Draft", schema: DRAFT_SCHEMA },
    ),

  (drafted, c) =>
    agent(
      `${SHEET}

You are a VERIFICATION pass, not an editor. Here are drafted answers for the
"${c.title}" cluster of the ${PROGRAM} application.

${JSON.stringify(drafted, null, 2)}

YOUR ONLY JOB is to find every factual claim and check it. Use Bash, Grep and Read against
${REPO}. Check git for counts and dates. Check src/ for whether a mechanism has a writer
and whether that writer has ever run. Check the canon for whether a claim was retired.

FOUR ERROR CLASSES, in the order they have actually bitten:

1. MISATTRIBUTION. A synthesis step once credited another company's experiment to the
   founder, and three independent readers all scored that sentence the strongest in its
   field, because a false sentence that fits the argument reads as the best one. Check
   every "someone did X" against who actually did X. Assume one is wrong here.

2. SCOPE OVERCLAIM. "Blocks every edit" where it covers three columns of eleven with a
   service role exempt. "Runs end to end" where a hop has no writer. Narrow the sentence
   to what the code does, or cut it.

3. THE CLAIM UNDER A NEW WORDING. A retired claim escaped six phrase-sweeps in one day
   because every banned word had been removed from it. Do not grep for words. Find the
   sentence that says why a competitor cannot catch up, wherever it appears, and test the
   CLAIM against the canon.

4. UNSUPPORTED DEMAND. "Teams already asking", "users tell us", any implied traction.
   If no artifact proves it, it is a fabrication regardless of how modest it sounds.

Also flag: any present-tense claim of accumulated learning or usage history; any banned
word; any em dash; any stub connector implied to work; any number not reproducible by a
command; any fact stated in two fields.

Return the SAME structure with each answer CORRECTED IN PLACE, plus a verification string
per field. If a claim cannot be verified, REMOVE it. Do not soften it, because a softened
false claim is still false and now also reads as hedging.`,
      { label: `verify:${c.key}`, phase: "Verify", effort: "high", schema: VERIFY_SCHEMA },
    ),
);

const allFields = verifiedClusters.filter(Boolean).flatMap((v) => v.fields || []);
if (!allFields.length) throw new Error("No fields survived drafting and verification.");
log(`${allFields.length} fields drafted and fact-verified`);

// -------------------------------------------------------------------------------------
phase("Pressure");
// -------------------------------------------------------------------------------------

const DEFAULT_PANEL = [
  {
    key: "serial-founder-vc",
    lens: `You are a four-time founder with two exits who now writes pre-seed cheques and
sits on a screening panel. You have read tens of thousands of applications. You can smell
a founder padding a field from the first clause. You do not care about ambition
statements. You care whether this person has seen something true that others have not,
and whether they can be trusted with money. You are hostile to anything reading as
marketing.`,
  },
  {
    key: "time-poor-partner",
    lens: `You are a partner mid-cycle with under three minutes per application including
any video. You scan for users, usage, velocity, one non-obvious thing, and what is next.
You reward founders who answer the question asked and punish narrative. You notice
immediately when two fields say the same thing, and it costs the applicant more than a
weak sentence would.`,
  },
  {
    key: "technical-diligence",
    lens: `You run technical diligence. Your entire job is to find the sentence doing more
work than the underlying build supports, and to catch anything a five-second check would
falsify. You WILL click the URLs. You assume every mechanism claim is aspirational until
the wording proves otherwise. You have seen "immutable", "end to end" and "governed" used
loosely a thousand times.`,
  },
];

const PANEL = a.panel && a.panel.length ? a.panel : DEFAULT_PANEL;

const PANEL_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string", enum: ["would_interview", "borderline", "would_pass"] },
    verdict_reason: { type: "string" },
    per_field: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          score: { type: "number" },
          problem: { type: "string" },
          rewrite_suggestion: { type: "string" },
        },
        required: ["id", "score"],
      },
    },
    repetition_across_fields: { type: "array", items: { type: "string" } },
    sentences_true_of_any_competitor: { type: "array", items: { type: "string" } },
    weakest_three_fields: { type: "array", items: { type: "string" } },
    single_change_that_would_flip_me: {
      type: "string",
      description: "must be a real action the founder can take, never better wording",
    },
  },
  required: [
    "verdict",
    "verdict_reason",
    "per_field",
    "weakest_three_fields",
    "single_change_that_would_flip_me",
  ],
};

const ASSEMBLED = allFields.map((f) => `### ${f.id} - ${f.question}\n${f.answer}`).join("\n\n");

const panel = (
  await parallel(
    PANEL.map(
      (p) => () =>
        agent(
          `${p.lens}

Here is a complete application to ${PROGRAM}.
${SELECTS_FOR === "Not supplied. Infer it from the questions themselves and say what you inferred." ? "" : `That programme selects for: ${SELECTS_FOR}`}

${ASSEMBLED}

Score every field 0-10 at your real reading pace. Be brutal and specific: quote the exact
sentence when you flag something.

Name every fact repeated across two fields. Name every sentence that would read
identically on a competitor's application. Then give your verdict and the ONE change that
would most move you.

That change must be a REAL ACTION the founder can take, not a rewrite. "Say it better" is
not an answer. "Put one user in front of me" is.`,
          { label: `panel:${p.key}`, phase: "Pressure", effort: "high", schema: PANEL_SCHEMA },
        ),
    ),
  )
).filter(Boolean);

if (!panel.length)
  throw new Error("No panel verdicts returned; refusing to assemble unreviewed copy.");

// -------------------------------------------------------------------------------------
phase("Final");
// -------------------------------------------------------------------------------------

const final = await agent(
  `${SHEET}

A full application to ${PROGRAM} was drafted, fact-verified, then scored by ${panel.length}
adversarial readers.

THE FACT-VERIFIED APPLICATION:
${JSON.stringify(allFields, null, 2)}

THE PANEL:
${JSON.stringify(panel, null, 2)}

Produce the FINAL application as markdown, field by field, exactly this shape:

## <field id> - <the question verbatim>
\`\`\`
<paste-ready answer>
\`\`\`
**Panel:** <one line: scores, and what changed here>

RULES:
- Fix EVERY problem the panel named and remove EVERY cross-field repetition. When one
  fact belongs in two fields, keep it in the field whose QUESTION asks for it and cut it
  from the other.
- Honour every register rule and every prohibition on the fact sheet.
- DO NOT INVENT A FACT TO CLOSE A WEAKNESS. If the panel wants something we cannot
  support, say so in the Panel line. This rule exists because the failure that created
  this workflow was a synthesis step inventing a flattering attribution, and no evaluator
  caught it.
- Where a field needs the founder, write [FOUNDER: <exact ask>] inside the block.

Then add "## What the panel would still push on": at most six bullets, each a surviving
weakness with the REAL ACTION that fixes it, plus every panel member's verdict verbatim.`,
  { label: "assemble", phase: "Final", effort: "max" },
);

return {
  program: PROGRAM,
  deadline: DEADLINE,
  facts,
  final,
  verdicts: panel.map((p) => ({
    verdict: p.verdict,
    why: p.verdict_reason,
    flip: p.single_change_that_would_flip_me,
    weakest: p.weakest_three_fields,
    repetition: p.repetition_across_fields,
    generic_sentences: p.sentences_true_of_any_competitor,
  })),
};
