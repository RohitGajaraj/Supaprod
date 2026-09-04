# S4-036 · S3's registry sweep is safe, and the reason it is safe was a near miss

> _Created: 2026-08-26 · Last updated: 2026-08-26_

> _S4, 2026-08-26, verified against `origin/lane/platform` @ `b61ce26fb`, pre-merge. Static._

## Why this one needed checking at all

S3's U-013 changed **52 lines in `src/lib/ai/tools/registry.server.ts`**, which is the file that
tells every station what its tools do. F-88 turned on exactly that: `studio.unstage` existed and was
permitted, and *"THIS IS THE WAY OUT when `studio.commit` refuses a staged path"* lived in its
description, unreachable because nobody was briefed. **A tool description in this repo is load
bearing, not documentation**, so a 52-line punctuation pass across it is a change worth reading
rather than waving through.

## What the sweep actually does

Every change I read is punctuation, with the sentence's meaning preserved:

| Before | After |
| --- | --- |
| `are not signals — they are the answer` | `are not signals. They are the answer` |
| `Optional — the system reflects automatically` | `Optional. The system reflects automatically` |
| `not something a person outside it said — the tool refuses those` | `…said. The tool refuses those` |
| `The work is not lost — the branch and the pull request are still on ${named}` | `The work is not lost. The branch and…` |
| `Listing capped at ${CAP} entries — narrow with the path arg` | `…entries. Narrow with the path arg` |
| `which the workspace binding names — ${REPO_ROOT_ACCESS_REFUSED}` | `…names: ${REPO_ROOT_ACCESS_REFUSED}` |

**No tool name, no argument name, no `NEVER`/`Refused:` clause and no sentinel value changed.** The
colon in the last row is the right call rather than a full stop, because that sentence introduces a
value rather than starting a new thought.

## The check that actually mattered, and it is not a diff read

A punctuation sweep is harmless **unless something pattern-matches the punctuation**. This repo has
exactly such a thing: `REFUSAL_SIGNS` in `driver.ts:1356-1374` decides whether a station's failure is
a *tools-refused* terminal hold or an ordinary one, and R-16 and F-41 both turn on it being right.

It is safe, and here is why:

```ts
const REFUSAL_SIGNS: readonly RegExp[] = [
  /\b401\b/, /\b403\b/, /unauthori[sz]ed/i, /bad credentials/i, /permission denied/i,
  …
  new RegExp(REPO_ROOT_ACCESS_REFUSED, "i"),
];

export const REPO_ROOT_ACCESS_REFUSED = "the bound repository is not visible to this connection";
```

Every sign is either a credential-shaped token or a **pinned sentinel constant**. The comment at
`:1368-1373` states the design: the tool *"stamps the pinned sentence"* and *"this sign matches the
stamp."* Since the constant is interpolated unchanged, **the punctuation around it cannot affect the
match.**

And nothing else depends on the prose. No test asserts on any swept fragment:

```
are not signals                        0 test file(s)
The work is not lost                   0 test file(s)
Listing capped at                      0 test file(s)
no final message yet                   0 test file(s)
never change what the check does       0 test file(s)
```

## The near miss, which is the part worth keeping

**Had F-57's author matched the prose instead of pinning a sentinel, this sweep would have silently
broken terminal-hold classification across 52 lines**, and the symptom would have been the worst kind:
tracks that were genuinely refused filing as `produced-nothing`, counting an attempt, and being sent
to `decideCorrection` — which is precisely the failure F-41 was written to stop, and which once threw
a correct spec, six good tasks and a real prototype back at Plan because GitHub returned 401.

The sweep was safe because of a decision made months earlier for a different reason. That is luck
worth converting into a rule:

> **Before any prose sweep over `src/lib/ai/**` or `src/lib/spine/**`, grep for whatever matches that
> prose — `REFUSAL_SIGNS`, `HOLD_LINE`, `includes(`, `RegExp(` built from message text — and check
> that every matcher tests a pinned constant rather than a sentence.** It is a two-minute check and
> the failure it prevents is invisible.

## Verdict

**S3's U-013 registry sweep: CONFIRMED SAFE.** Punctuation only, no semantic change, no matcher
depends on what changed, no test asserts on it. Nothing to reopen.

Filed as a verdict anyway rather than left unsaid, because "I checked this and it is fine" is a
result, and the *reason* it is fine is a design property this repo should know it is relying on.
