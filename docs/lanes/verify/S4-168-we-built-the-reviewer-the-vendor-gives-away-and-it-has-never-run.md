# S4-168 — we built the reviewer the vendor gives away, it has never run, and no argument was written for building it

> _Created: 2026-08-31 · Last updated: 2026-08-31_

> _S4 · 2026-08-31 ~11:3x UTC · Lovable project `371dd588`, all `SELECT`, plus source reads. No dev
> server, no browser, no row written._

**This is the §FRAMEWORK check I owe every pass and had not run this session: the two things §0.8
tells me to catch are an UNARGUED DEPARTURE and REBUILDING WHAT THE VENDOR GIVES AWAY. This is the
second one, and it is the largest instance on the tree.**

## What the framework says

`SPEC-AI-NATIVE-SDLC.md` §4.3, in its own words:

> *"Their Stage 5 and Stage 6 name **Managed Code Review**, **Claude Security** … **Adopting the
> playbook means CONSUMING those, not rebuilding them.** A lane that builds a code-review board, a
> vulnerability-triage screen or a scan-results surface **has departed from the playbook while
> believing it is following it.**"*

And §4.2 permits exactly three refusals, each argued. **Building our own code reviewer is not one of
them.** The nearest register row says only:

> | AI review of every PR, humans on regulated and critical code | **ADOPTED as posture** | This is our own review-gate model. **Do not build a surface for it (§4.3)** |

**That row forbids a surface and never argues the reviewer.** It asserts *"this is our own
review-gate model"* as though the ownership question had been settled somewhere. It has not been.

## What we have actually built

`src/lib/build/code-review.server.ts` — 242 lines, plus a pure half in `code-review.ts` — runs
deterministic checks and then **a real model call** (`callModel`, `surface: "judge"`, budgeted and
cost-attributed) against a system prompt that reviews the staged diff for, in its own order:

**SECURITY** (missing authorization, unescaped input reaching a query, a tenancy boundary widened,
unsafe deserialization) · **CORRECTNESS** · **ERROR HANDLING** · **SCOPE** · **CONVENTION**

returning per-file, per-line findings and an approve / revise / block verdict.

**That is Managed Code Review and the review half of Claude Security, rebuilt in-house, paid for per
diff.**

## And it has never run. Not once.

`tool_calls`, every `studio.*` tool, all time:

| tool | calls, ever |
| --- | --- |
| `studio.commit` | 48 |
| `studio.stage` | 46 |
| `studio.fix.commit` | 15 |
| `studio.pr.open` | 9 |
| `studio.pr.merge` | 7 |
| `studio.tests.plan` | 6 |
| **`studio.checks.run`** | **1** |
| `studio.unstage` | 1 |
| **`studio.review`** | **0** |
| **`studio.secrets.scan`** | **0** |
| **`studio.deps.audit`** | **0** |

**0 of 51 changesets carry a `code_review`. Thirty-six of them reached a pull request or beyond, and
nine pull requests were opened and seven were merged — none reviewed, none secret-scanned, none
dependency-audited by the tools built to do exactly that.**

`ArtifactPane.tsx:1301` already says this in a comment — *"`studio.review` has never once run
successfully (0 of 45 changesets carry a review)"* — and **the comment is right and now understated:
it is 0 of 51.** Confirmed against the table rather than taken from the comment, because a stale
comment is the defect this lane has filed three times this week.

**Why it never ran is F-147 and is already fixed** — no brief named it, and S0 wired it into the Build
checking seat today at `driver.ts:375`. The newest changeset is 2026-08-27, so every zero above
predates that fix. **I am not re-filing F-147.**

## The finding, stated precisely

**The remedy chosen for F-147, today, was to wire OUR reviewer in. Nobody asked whether the vendor's
should be consumed instead, and §4.2 carries no argument for the choice.** That is an unargued
departure, made today, at the exact seam §4.3 names — and it is about to start costing a model call
per staged diff for the first time in the product's life.

**The burden of proof is on the refusal, and there is no refusal written.** §0.8: *"A session does not
ask 'should we take this?' — it asks 'can I argue why not?', writes the argument into
`SPEC-AI-NATIVE-SDLC.md` §4.2, and adopts if it cannot. **An unargued departure is drift, and S0
rejects it at the gate.**"* A fourth refusal is allowed. **It has to be written, or the reviewer is
drift that has been running under the register's blessing.**

**I am not saying the reviewer should be deleted.** There are real arguments available — it reviews a
diff that is *staged and not yet committed*, which is earlier than a PR-based service can reach, and
that may be exactly the point. **That is a good argument and it is not written down anywhere.** My
job is to say it is missing, not to make it.

### What is NOT a departure, and it deserves saying

**`studio.deps.audit` is exemplary and should be the model for the other two.** Its own description:
*"Reads **GitHub's own Dependabot alerts** (computed from the committed manifests against the GitHub
Advisory Database) … Reports 'not available' honestly when the repo has Dependabot off or the
credential lacks the scope; **that is never the same as clean.**"* **It consumes a vendor, correlates,
and refuses to turn absence into an all-clear.** That is §4.3 followed exactly.

`studio.secrets.scan` is borderline and I am not filing it. It matches in-house rules against added
lines and `studio.commit` enforces the same scan as a hard refusal, so it is a **blocking gate at a
seam**, not the "scan-results surface" §4.3 names.

## A second thing this read settles, for Tier 0.5

`RANKED-BACKLOG.md` Tier 0.5 and F-148 say the Test gate is missing because *"real execution exists at
`studio.checks.run`, but it is one skippable instruction with no gate behind it."*

**Measured: `studio.checks.run` has been called ONCE, ever, against 48 commits, 9 opened pull requests
and 7 merges.** That is the number that proves "skippable", and it belongs in F-148. **Seven merges
went in with the checks tool having run one time in the product's life.**

## Tier 0, verified as it lands, which is my standing instruction

| | | |
| --- | --- | --- |
| **0.1** deploy `main`, then drive one track | deploy **VERIFIED LANDED** ([S4-163](./S4-163-the-deploy-landed-and-the-spin-stopped-inside-a-minute-of-it.md)) | the track has **not** been driven |
| **0.2** unblock the three parked changesets | **DONE by S0, and it went wrong** — both repair runs staged a revert ([S4-164](./S4-164-both-repair-runs-staged-a-revert-and-called-it-a-fix.md)) | PR #1 closed correctly |
| 0.3 · 0.4 · 0.5 | not started | 0.5's key number is above |

## Owner

**S0** — §4.2 is S0's register, the reviewer is `src/lib/build/**`, and §0.8 makes S0 the gate that
rejects an unargued departure. **The ask is one paragraph in §4.2, not a code change.**

No approval answered, nothing pressed, no row written, no product code.
