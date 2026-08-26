# S2 → all lanes · Em dashes and en dashes are out of user-facing copy, and there is now a gate

> Filed 2026-08-26 by S2. **This touched files outside my prefix**, on a direct founder
> instruction, while no other session was running. Read this before your next rebase.

## The instruction

Founder, 2026-08-26: no em dashes or en dashes anywhere a user can see. It was not
hypothetical, they were reading them in the running app.

## Why it needed two mechanisms rather than one

The dashes come from two different places and a fix for either alone would have looked complete
and left the problem live.

**Hardcoded strings.** `/start` said *"Edit it freely — it starts however you leave it."*
`InsightCards` used a bare `"—"` as its empty-value placeholder. Ten more like it.

**Agent-written prose, which is the bigger half.** Measured live in the database:
`decisions.rationale` rows carry the register unmistakably, for example *"This is not a hypothesis
— it is a confirmed systemic failure"* and *"The only stated justification — 'someone asked' — is
explicitly insufficient"*. That text is persisted and rendered, so it is the product's voice in
front of a customer.

There is no single prompt to edit for the second half: agents write it into tool arguments
(`decision.record`'s `rationale` is "Why you made this call", filled freely by the model).

## What changed

**Copy, twelve strings.** `src/components/today/overlaps.ts` (2, mine),
`src/components/meridian/InsightCards.tsx`, `src/components/track/SteerComposer.tsx`,
`src/components/track/TrackRun.tsx`, `src/lib/ai/approval-expiry.ts`,
`src/lib/ai/loop.server.ts` (2), `src/lib/changelog.functions.ts`,
`src/routes/_authenticated.start.tsx`, `src/routes/_authenticated.meridian.tsx`. Each was rewritten
as a sentence, not swapped for a hyphen: *"Paused, waiting on operator..."*, *"This change has not
merged yet. It is 'x', so there is no release to publish."*

**A rule every agent now reads.** `src/lib/ai/house-style.ts` exports `PLAIN_PUNCTUATION_RULE`,
appended to the rules block in both of `loop.server.ts`'s prompt assemblies.

**The prompts themselves were cleaned in the same change**, and this is the part worth keeping.
A rule saying "no em dashes" inside a prompt full of them is a weak instruction: a model copies the
register it is shown more reliably than it follows a line it is told. `"Never invent IDs — read
them"` became `"Never invent IDs. Read them"`, and `"STRICT JSON only — one step at a time —"` lost
its dashes too.

**A gate.** `src/__tests__/no-em-dashes-in-user-facing-copy.test.ts` fails the suite on any dash in
`src/components` or `src/routes` outside a comment.

## Two limits, said plainly

**Comments are exempt and that is deliberate.** This repo documents its reasoning in long prose and
carries roughly 3,900 dashes in comments. They compile to nothing. Forcing them into hyphens would
damage the one artefact that makes this codebase legible and would protect nobody.

**Rows already written are untouched.** The four `decisions.rationale` rows measured today still
contain their dashes. Cleaning them is a write to production data and I did not make it
unasked. Whoever owns that call: it is an UPDATE over a handful of rows, and the rule above stops
new ones arriving.

## One thing I deliberately did NOT change

`src/lib/design-interchange.functions.ts:148` uses an em dash as a **parser delimiter**
(`/^-\s+`(.+?)`:\s+(.+?)(?:\s*—\s*(.+))?$/`), matched by writers at lines 225 and 234. It is a
machine interchange format, not prose. Changing one side without the other would break
round-tripping of every existing document, so the pair was left alone.
