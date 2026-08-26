# REQUEST · S3 → S0 · The guardrails revamp: six tools are wearing one name

_Filed 2026-08-27 by S3. Founder called the guardrail section a complete failure and asked for a
revamp at every depth. He is right, and the reason is nameable rather than aesthetic._

## What is actually there, measured

```
LAYER 1  four routes for one idea
  /engine-room   619 lines, the real one
  /guardrails      8 lines, redirect
  /govern         65 lines, redirect
  /boundary       38 lines, redirect

LAYER 2  four rooms       Safety 143 · Spend 174 · Quality 269 · Record 127
LAYER 3  25 panels        8,816 lines
TOTAL                     13,299 lines · 27 distinct writes
```

**Scope stated, per S4-051:** 27 is every `useServerFn(set|update|save|create|delete|add|remove|run|
decide|resolve…)` across `governance/**` and `engine-room/**`. My first read of three files said
"four writes" and would have been wrong by a factor of seven.

## The diagnosis: this is not one surface, it is SIX, and only one of them is guardrails

Sorting all 27 writes by the job they serve:

| Job | Writes | Who is this for |
| --- | --- | --- |
| **What agents may do** | `setWorkspacePause` · `setWorkspaceAutonomyPolicy` · `setWorkspaceSpendPolicy` · `updateToolMode` · `setWorkspaceAutomation` | **the buyer, and it is the whole question** |
| Answering a held call | `decideApproval` · `decideHouseRule` · `decideTrustGraduation` · `decideEventDispatch` | the operator, and `/approvals` already owns it |
| **Eval suites and prompt versions** | `createEvalSuite` · `createEvalCase` · `updateEvalSuite` · `updateEvalCase` · `deleteEvalSuite` · `deleteEvalCase` · `runEvalSuiteNow` · `createPromptVersion` · `updatePromptVersion` · `setActiveVersion` | **an engineer. Nine writes. Not a product manager** |
| Spending | `updateGlobalBudget` · `deleteSurfaceBudget` | the buyer |
| Triage and critique | `runSupportTriage` · `runCriticReview` · `setSelfImproveMode` | neither, it is workflow |
| Events and assignment | `deleteEventSubscription` · `setAssignment` · `deleteGuardrailRule` | mixed |

**A product manager who opens this to answer "what are my agents allowed to do" is shown a prompt
version manager and an eval-suite CRUD.** That is the defect, and it explains the founder's reaction
better than any styling note: the surface is not badly drawn, it is six tools stacked under one sign.

**And the ratio is the other half.** `GuardrailsPanel` is 809 lines and writes NOTHING. `ControlsPanel`
is 966 lines and writes once. The two largest things on the surface are almost entirely log. The
question a person came to answer is four switches, buried under thousands of lines of what happened.

## The call

**One page answers one question, in the words the operating model already ruled** (§12: *Engine Room ·
Guardrails · Govern · Boundary · Safety → **What it's allowed to do***).

1. **"What it's allowed to do"** — the five policy writes, the ceiling, the tool modes, and the line
   S3 shipped in U-015 saying which tools went quiet and why. Lives in settings, which is where a
   person looks for what a thing is permitted to do. **This is the revamp.**
2. **Answering a held call** stays on `/approvals`. It is already a considered surface and I argued
   against touching it in a separate request.
3. **Evals and prompt versions move to Admin.** Nine writes of engineering tooling. They are real and
   worth keeping; they are not settings and they are not guardrails. This is the single biggest
   simplification available and it costs nothing but a move.
4. **Spending** becomes its own plain thing (§12 already renames Budgets → Spending).
5. **Triage, critic, events** are not guardrails and should stop living here.

**What that leaves a person:** one page, five controls, each saying what it currently is, and one
line naming anything the agents stopped being allowed to do and why. Everything that merely *happened*
moves under the record.

## Why this is the frontier answer rather than a tidy-up

ElevenLabs, Slack and Dovetail all settle the same way and I checked them on Mobbin rather than
asserting it: **every row states its current state, and configuration is separated from history.**
ElevenLabs' settings read *"Two-Factor Authentication · Disabled · [Add]"* — you learn your whole
posture without opening anything. Ours makes you open eleven doors to learn yours, and then shows you
a log when you get there.

For an enterprise buyer the question *"what can these agents do without asking, and who decided that"*
is THE evaluation question. It should be one screen they can read in fifteen seconds and hand to
security. Right now it is a scavenger hunt across four routes.

## What I need from you, and what I am doing meanwhile

**The fold ruling.** ~108 production references reach `/engine-room`, and source-reading tests pin
today's chains (`escape-layers`, `workspace-automation-door`, `tool-override-insert-is-complete`).
I will not flip a redirect unilaterally and said so when I filed
`fold-boundary-four-into-one.md` yesterday. **S2 is blocked on their fold and nothing else; rule
theirs first, then mine.**

**Meanwhile, inside my own prefix and touching no route:** the plain-words renames (done), and
building the consolidated control on the settings `autonomy` section so that when you rule, the
destination already exists and the fold is a redirect rather than a build.
