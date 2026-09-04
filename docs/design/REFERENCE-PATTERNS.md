# The reference-pattern library

> _Created: 2026-08-01 · Last updated: 2026-08-26_

> _Created 2026-08-01. **Standing rule (founder): research is captured here so it is never done
> twice.** Before researching a surface's reference class, read this file. After researching one,
> add it here in the same session._

**The rule this file serves** (founder ruling 2026-08-01): for each surface, research the best
proven product in that category and lift its **information model and verbs** outright, even close
to literally. Originality is not the goal; an experience customers already know is. Name the
reference and the pattern before building, then express it in **Meridian** — `--mrd-*` tokens from
[`../../src/styles/meridian.css`](../../src/styles/meridian.css), composed from
[`../../src/components/meridian/`](../../src/components/meridian/) — and in our voice. We copy the model and
the verbs. We never copy the visual style.

> _Corrected 2026-08-19. This line said `--sp-*` for five days after that vocabulary was retired, which made
> the file that teaches every future researcher teach a dead system. The correction at the foot of the
> Discover section already said so; a reader hits this line 886 lines earlier._

Unlike the audit files beside this one, **the contents of this file are verified research against
official product documentation**, with URLs. Treat it as reliable.

## The reference class per station

| Station | Reference class | Status |
| --- | --- | --- |
| **Discover** | Sentry issue stream · Linear Triage · Productboard Insights · Enterpret / Unwrap / Dovetail | ✅ researched 2026-08-01, below |
| **Decide** | inherits Discover's triage verbs; Linear's split view | ✅ partially, below |
| **Plan** | Linear cycles / Productboard roadmap · Basecamp hill charts · Productboard Spark · Linear's agent-session API · GitHub Spec Kit · Anthropic Citations | ✅ researched 2026-08-20, below |
| **Design** | Figma Dev Mode + Make · v0 · Lovable · Uizard · Stitch | ✅ researched 2026-08-01, below |
| **Build** | GitHub Copilot · Devin · Cursor · Claude Code · Codex | ✅ researched 2026-08-01, below |
| **Ship** | Linear Releases · Vercel Rolling Releases and Instant Rollback · LaunchDarkly guarded rollouts · Statsig Release Pipelines · GitHub Releases and environment protection rules · Sentry release health · Datadog deployment tracking · LaunchNotes | ✅ researched 2026-08-20, below |
| **Learn** | Amplitude Experiment readouts · Statsig Pulse and Release Pipelines · Eppo experiment status and decision criteria · GrowthBook Decision Framework · Metaculus scoring and resolution · Good Judgment · incident.io post-mortems · Jeli · ADR practice | ✅ researched 2026-08-20, below |
| **Brain** (layer 03, not a station, and the reason it was in no row until now) | Guru verification · Glean Assistant citations and knowledge graph · Notion AI Connectors and Q&A · Obsidian local graph · Cursor rules and memories · Claude Code `CLAUDE.md` and auto memory · Windsurf Cascade Memories · ChatGPT saved memories · Perplexity numbered citations · the ThoughtWorks context-graph entry | ✅ researched 2026-08-20, below. **Four of the named references are counter-examples rather than templates** |

---

# DISCOVER: signal triage and opportunity discovery

Researched 2026-08-01 against official docs. **Structural insight: a cluster is an issue group.**
Raw signals are events, the cluster is the issue, and the station's real job is triage. Promotion
is the rare terminal verb, which is why building the surface around promotion made it shallow.

## The merged information model for one cluster row

**Tier 1, the row is useless without these**

| # | Field | Lifted from |
| --- | --- | --- |
| 1 | label + one-line description, auto-generated from member content, human-editable, and **read back by the classifier** | Dovetail (themes from highlight content; tag descriptions drive the AI), Enterpret |
| 2 | signal volume in window **plus delta vs the prior window** | Unwrap (Group Trend), Sentry (events), Enterpret (Duration A/B) |
| 3 | **distinct accounts affected**, never the same number as volume | Sentry (users affected), Linear (customer count) |
| 4 | weighted value: revenue or tier attached to those accounts | Linear (customer revenue as a row property), Productboard (CIS) |
| 5 | **state, from a closed vocabulary the system can move on its own** | Sentry (six states, exactly one at a time) |
| 6 | provenance badge: agent-created vs human-created, and filterable | Unwrap (Group Type filter), Linear ("you always know what came from the system") |

**Tier 2**: sparkline with anomaly markers · first seen / last seen · rank plus whether it is
system-computed or human-pinned · downstream link count · source mix · owner.

**Tier 3, focused pane only**: segment concentration · representative quote with the highlight
preserved · membership count and cluster stability · **why these grouped** (inspectable trace) ·
time in current state.

> **The finding that changed our build: not one of these products puts a numeric confidence score
> on an auto-generated cluster.** Enterpret substitutes explainability ("every classification is
> explainable and editable"), Linear substitutes a reasoning trace, Amplitude substitutes "the
> records driving it". **Ship evidence and reversibility, not a percentage.** A percentage invites
> an argument about the percentage.

## The triage verb set

`[L]` = lifted verbatim from Linear. Digits are dispositions (mutually exclusive, terminal, one
keystroke, no modifier); letters are properties; Shift inverts. **That split is why Linear's
triage feels fast and Sentry's does not.**

| Verb | Key | Required effect on the data |
| --- | --- | --- |
| Promote | `1` `[L]` | creates the bet; links the cluster **and every member signal**; future matching signals attach to the bet, not to a new row |
| Merge into | `2` / `MM` `[L]` | merge at **rule level, not row level**; volumes and account sets union; both ids stay resolvable forever so old citations do not rot; reversible |
| Decline | `3` `[L]` | state -> declined with a **required reason**; signals retained and searchable; does not reopen unless an escalation threshold is crossed |
| Snooze | `H` `[L]` | hides until **whichever comes first**: a time, new activity, or a threshold (volume N, accounts N, revenue $N). Never an unconditional forever. |
| Split / unmerge | `Shift 2` | must work at **signal granularity**; Sentry's inability to separate events inside one fingerprint is the failure to avoid |
| Relabel | `R` | edits label **and the description the classifier reads**; previews what enters and leaves before commit |
| Exclude this signal | `Backspace` `[L]` | per-signal removal recorded as a negative example; the signal survives, only membership dies |
| Resolve / shipped | `E` | a later matching signal produces **`regressed` on the same row**, not a new row |
| Link as evidence | `L` | adds weight to an existing bet rather than creating a competitor row (the Productboard move) |
| Annotate the timeline | `N` | attach "we shipped X here" to a window on the trend chart; this is what makes a chart interpretable six months later |
| Undo | `Cmd Z` | **every verb above, including agent-executed ones** |

Navigation: `J`/`K` or arrows move focus with the list still visible; `Enter` opens; `Esc`
returns; `X` selects, `Shift+click` ranges.

## The three patterns most worth lifting

1. **A state machine where the SYSTEM, not the human, moves the row back.** Sentry's six states
   plus two automatic transitions: resolved-then-recurs-in-a-newer-release -> `Regressed`;
   archived-then-volume-spikes-past-forecast -> `Escalating`. Archive is not "hide", it is
   **"hide until escalating / N occurrences / N users affected"**. This makes "no" cheap because
   "no" is conditional, and it converts triage from a queue into **standing conditions an agent
   can execute against**, which is exactly the shape our governance canon asks for.
2. **Split-view triage with digit dispositions and snooze-until-condition.** A modal or full-page
   detail breaks the comparison that triage *is*: you judge this cluster relative to the ones
   around it. And snooze-until-*condition* beats snooze-until-*date* because the date is a guess
   about when the condition will occur.
3. **Weighted evidence that rolls up and drills back down to the quote.** Productboard's
   importance-weighted sum (+0/+1/+2/+3), decomposed by company and segment, split into direct vs
   underlying, drillable to the highlighted sentence. Linear supplies the missing half: customer
   revenue as a first-class row property and sort key. Raw volume is the worst available proxy:
   **40 tickets from one enterprise and 40 from 40 accounts are the same number and opposite
   decisions.** Learn from Productboard's documented ceiling too: CIS cannot be weighted per
   customer, so build per-account weighting in from day one.

## What these products get WRONG for an agent-operated product

These are the anti-patterns. Do not copy them.

1. **Sentry's manual priority override is permanent.** Once a human sets priority it is never
   auto-adjusted again. Under policy a human touch is a *bounded* instruction: a pin needs an
   expiry or a condition, and the agent must keep computing the true rank underneath and say when
   the two diverge.
2. **Linear's suggestion pane is a permission request wearing a UI.** It takes 1 to 4 minutes then
   waits for accept/decline. The reasoning trace is excellent and worth lifting; the *waiting* is
   not. Under policy the agent applies within the boundary and logs, and the pane becomes an
   after-the-fact "here is what I did and why", with **dissent, not consent**, as the interaction.
3. **"Accept" as a mandatory queue step.** Productboard's *Mark processed* is a manual read
   receipt with zero downstream effect. If a human must press a key on every row to certify it
   exists, agents have added a queue rather than removed one.
4. **Zendesk's irreversible merge.** "Ticket merges cannot be reversed." No verb an agent can
   execute may be irreversible. Every clustering verb needs signal-level reversal and a stored
   pre-image.
5. **Sentry merges teach the classifier nothing.** "We don't infer any new grouping rules from how
   you merge issues", so the human corrects the same mis-grouping forever. Unwrap has the right
   model: a manual correction teaches the AI. **In an agent product, a correction that does not
   change future behaviour is a bug.**
6. **Invisible forecast thresholds.** Archive-until-escalating fires off a forecast the user never
   sees or sets. Under policy the threshold IS the policy: readable, settable, and stated on the
   row ("returns at 25 signals or 5 new accounts").
7. **Permanent suppression** (Archive forever, Delete and Discard Forever) with no owner, no
   expiry, no review. This is how a real problem becomes invisible to both human and agent.
8. **Nobody shows what the agent DECLINED to do.** Every product here shows agent suggestions or
   output; none shows the boundary being respected, the cluster the agent nearly promoted and did
   not, and why. **In a product whose pitch is autonomy under policy, the near-misses are the
   evidence that the policy is real, and no incumbent has built that surface.** This is ours to
   take.

## Worth stealing for the agent story specifically

**Sentry Seer's settings** are the closest thing in the market to policy-as-configuration for an
agentic loop: a per-project **stopping point** (Stop after Root Cause -> after Plan -> after PR
Drafted), an **actionability threshold** ("Highly Actionable and Above"), and eligibility gates
(>=10 events within 14 days). A boundary set in advance that does not interrupt, expressed in two
dropdowns. It is the right shape for our per-tool auto/confirm/off with risk floors, and it is a
live shipping product a risk officer can be pointed at.

## What we built from this (2026-08-01)

Adopted: the cluster-as-issue model · volume and distinct sources as two separate numbers · digit
dispositions `1` keep / `2` merge / `3` decline · the selected row staying in the list · Linear's
split-view focus · Productboard's link-to-existing-bet.
**Deliberately not adopted:** the confidence percentage (see the finding above).
**Known blocked:** conditional decline ("until it escalates") needs clustering to merge into
existing themes; `clusterSignalsCore` only reads signals with a null `theme_id`.

## Sources

Sentry: [Issues](https://docs.sentry.io/product/issues/) ·
[States & Triage](https://docs.sentry.io/product/issues/states-triage/) ·
[Issue Priority](https://docs.sentry.io/product/issues/issue-priority/) ·
[Issue Views](https://docs.sentry.io/product/issues/issue-views/) ·
[Merging Issues](https://docs.sentry.io/concepts/data-management/event-grouping/merging-issues/) ·
[Seer Issue Fix](https://docs.sentry.io/product/ai-in-sentry/seer/issue-fix/).
Linear: [Triage](https://linear.app/docs/triage) ·
[Triage Intelligence](https://linear.app/docs/triage-intelligence) ·
[how we built it](https://linear.app/now/how-we-built-triage-intelligence) ·
[Display Options](https://linear.app/docs/display-options) · [Inbox](https://linear.app/docs/inbox) ·
[Customer Requests](https://linear.app/docs/customer-requests).
Productboard: [link feedback via insights](https://support.productboard.com/hc/en-us/articles/360056354514) ·
[Customer Importance Score](https://support.productboard.com/hc/en-us/articles/360058215013).
Enterpret: [Taxonomy](https://helpcenter.enterpret.com/en/articles/12665751-what-is-the-taxonomy) ·
[Anomalies](https://helpcenter.enterpret.com/en/articles/8824926).
Unwrap: [Explore](https://docs.unwrap.ai/dashboard_pages/explore/) · [Filters](https://docs.unwrap.ai/filters/).
Dovetail: [Dovetail AI](https://docs.dovetail.com/help/dovetail-ai) ·
[tags](https://docs.dovetail.com/academy/capture-themes-with-tags).
Zendesk: [merging tickets](https://support.zendesk.com/hc/en-us/articles/4408882445594).
Amplitude: [Root Cause Analysis](https://amplitude.com/docs/analytics/root-cause-analysis).

---

# BUILD: making agent work visible, steerable and approvable

Researched 2026-08-01 against official GitHub and VS Code documentation. **Copilot Workspace is
SUNSET** (technical preview ended 2025-05-30; `copilot-workspace.githubnext.com` no longer
resolves in DNS). Do not cite it as a live product. Its functional successor is the Copilot cloud
agent, though GitHub never published a succession statement.

Naming note: GitHub renamed **"Copilot coding agent"** to **"Copilot cloud agent"**; current doc
paths use `/cloud-agent/`. Both names appear in live surfaces.

## THE HEADLINE FINDING, and it validates our governance canon

> **The agent never blocks mid-run for approval. It blocks at the boundary.**

Copilot cloud agent runs to completion autonomously, then stops at four hard edges
([risks-and-mitigations](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/risks-and-mitigations)):

1. **Workflows do not run** until a human with write access clicks **Approve and run workflows**.
2. **The agent cannot mark its own PR "Ready for review"**, and cannot approve or merge.
3. **The person who asked for the work cannot approve it.** Their approval does not count toward
   required approvals.
4. **MCP tools are NOT gated at all**: "Copilot will be able to use the tools provided by the
   server autonomously, and will not ask for your approval before using them."

That is policy-in-advance, expressed as irreversibility floors, from the largest shipping
agentic-coding product in the world. It is the same shape as our `toolRisk` hard floors and the
governance canon's four floors, and it is a live product a risk officer can be pointed at.

Also: the agent **cannot push to your default branch**. It only pushes to a `copilot/` branch it
created, and it "can only perform simple push operations. It cannot directly run `git push`."
Session ceiling: **59 minutes**, hard.

## The approval ladder (VS Code) — the anti-queue mechanism

Per-tool confirmation offers a **scope**, not just a yes: **Allow in this Session** ·
**Allow in this Workspace** · **Allow always**
([v1.99](https://code.visualstudio.com/updates/v1_99)). Approval is remembered at session,
workspace or application level. This is how a permission prompt becomes a policy: you answer once
and the class of action stops asking.

A **per-session permission level** picker sits above it
([approvals](https://code.visualstudio.com/docs/agents/approvals)):

| Level | Behaviour |
| --- | --- |
| **Default Approvals** | configured settings; tools needing approval show a dialog |
| **Assisted permissions** (experimental) | **an LLM judge decides**; approved calls run automatically, others prompt |
| **Bypass Approvals** | auto-approves everything, no dialogs |
| **Autopilot** | auto-approves everything **and auto-answers the agent's clarifying questions** |

Terminal commands use a **regex allowlist**, `chat.tools.terminal.autoApprove`, where `true`
auto-approves and `false` always requires approval. Default deny rules ship for `rm`, `rmdir`,
`del`, `kill`, `curl`, `wget`, `eval`, `chmod`, `chown`. Step ceiling:
`chat.agent.maxRequests`, default **25**.

## Steering a run in flight

While a request is running the send button becomes a dropdown with exactly three verbs
([copilot-chat](https://code.visualstudio.com/docs/copilot/chat/copilot-chat)):
**Add to Queue** · **Steer with Message** · **Stop and Send**. Default configurable via
`chat.requestQueuing.defaultAction`.

Our `steerStudioSession` is the same idea; we lack the queue-vs-interrupt distinction.

## The edit review flow

- Per edit: **Keep** / **Undo**, with Up/Down to navigate between edits.
- Batch: **Keep All** / **Undo All**.
- **Add Feedback** on a code range, then **Submit Feedback** to send accumulated comments back to
  the agent. ([review-code-edits](https://code.visualstudio.com/docs/copilot/chat/review-code-edits))
- The Agents window has a **Changes** panel (edited files + diff statistics) and a **Files** tab,
  with **Commit**, **Merge**, **Checkout**, **Discard**.
- Checkpoints: `chat.checkpoints.enabled` default `true`, snapshots at key points so you can roll
  back.

## How in-progress work is shown (cloud agent)

The PR **is** the review surface, and progress is expressed as artifacts rather than as a spinner:

- an **eyes emoji reaction** appears on the comment that started the session;
- a **"Copilot has started work"** timeline event, with a **View session** link;
- **session logs stream live** and carry "the agent's reasoning and validation steps... making it
  easy to trace decisions";
- the agent **pushes commits to a draft PR as it works** and **rewrites the PR description**;
- the agents page (`github.com/copilot/agents`) shows real-time status across every running task.

**The pattern worth stealing:** a blocked network request is written **into the PR body**, showing
"the blocked address and the command that tried to make the request". The boundary violation is
recorded where the work is, permanently, rather than as a transient warning.

## Batching as the anti-queue move

> "it's best to batch them by clicking **Start a review**, rather than clicking **Add single
> comment**. You can then submit all of your comments at once, triggering Copilot to work on your
> entire review, rather than working on individual comments separately."

Also: the agent responds **only** when explicitly `@copilot`-mentioned by someone with write
access, so "you can leave notes and thoughts in pull request comments without Copilot
interpreting them as commands." Addressing is opt-in, which is what stops a conversation becoming
a command queue.

## Copilot code review, and the one governance fact that matters

Copilot **always leaves a "Comment" review, never "Approve" or "Request changes"**, and its
reviews **do not count toward required approvals**. An AI reviewer that could approve would
quietly dissolve the review requirement. Ours must obey the same rule.

## What to take, and what we already have

**Take:** the approval SCOPE ladder (once / session / workspace / always) as the mechanism that
turns a prompt into policy · the session-level permission dial · the three steering verbs · the
blocked-boundary written into the artifact · batched feedback · the AI reviewer that cannot
approve.
**We already have:** per-hunk accept/reject and touch-list scope enforcement in `ChangesPanel`,
which is at or above this bar · mid-run steering · a spend ceiling (they use a step ceiling).
**We lack:** the queue-vs-steer distinction, checkpoints/rollback, and the approval scope ladder.

## Verification caveats, preserved honestly

The researcher flagged ten items it could NOT confirm. The load-bearing ones: the exact current
VS Code confirmation button strings (only the v1.99 set is officially quoted; current docs
describe scopes in prose), the checkpoint restore label, `COPILOT_AGENT_FIREWALL_*` variables
(superseded by UI settings, legacy configs still honored), and the Copilot Workspace sunset date
(from the search index of the official page, not a rendered fetch, though the dead DNS
corroborates the shutdown). Verify in-product before quoting any string as current.

---

# BUILD, second reference: Devin (Cognition)

Researched 2026-08-01 against live official docs. Devin is the most complete autonomous-agent
product surface in the market and it answers the question our governance canon most needs
answered: **how do you gate autonomy without building an approvals queue.**

## The five ideas most worth stealing

### 1. Confidence gates the autonomy, not the human's calendar

> "At multiple points in each session, Devin will express its confidence: at the start, after
> creating a plan, whenever it answers a question about the code. **When Devin doesn't have green
> confidence (i.e. yellow or red), it will wait for user approval before proceeding with its plan.
> If it's green, it proceeds automatically.**"
> ([release-notes/2025](https://docs.devin.ai/release-notes/2025), Devin 2.1)

**The gate is a derived signal, not a fixed step.** That is exactly the governance-canon shape:
policy set in advance, permission asked only on exception. And Cognition reports the signal is
"highly correlated with success", so it is load-bearing rather than decorative.

The same glyphs appear on ticket scoping, and crucially can be produced **in bulk without
spending a session**: "get Confidence Scores for multiple issues at once, without starting actual
Devin sessions... prioritize having Devin work on the highest-confidence tasks."

### 2. The 30-second default: a gate that degrades to autonomous

> "For more complex tasks, click **'Wait for my approval'** so that Devin waits for your feedback
> on its full plan. **By default, if you don't click 'Wait for my approval', Devin waits 30 seconds
> for your input before proceeding.**"

**This is the single best pattern in the whole research for beating the approvals-queue failure
mode.** A timed gate that expires into autonomy is not a queue: you can intervene, and if you are
not there the work continues. The default is configurable in Settings. Steering does not end at
the gate either: "You can still send feedback and adjust Devin's plan **even after it has started
working**."

### 3. Retrieval-triggered memory, not dumped context

Knowledge items REQUIRE a **Trigger Description**, and the stated principle is:

> "**Devin retrieves Knowledge when relevant, not all at once or all at the beginning.** Be sure to
> make your retrieval trigger highly relevant to the contents."
> ([knowledge](https://docs.devin.ai/product-guides/knowledge))

Three-state pin, which is a clean policy-scope model we should copy for house rules: pinned to **no
repo** (retrieved only when judged relevant) · **one repo** (always used there) · **all repos**.
Knowledge is also **suggested by the agent from your chat feedback**, and you **edit before saving
or dismiss** it. That is dissent-not-consent, applied to memory.

### 4. Cost made legible as a t-shirt size, on two axes

Session Insights sizes a session XS to XL on **ACUs** *and* on **user message count**, and takes
**the larger of the two**. So "you nagged it thirty times" reads as unhealthy just as loudly as
"it burned forty units". L or XL is flagged unhealthy. The docs even supply the interpretation:
high spend with few messages means "worked autonomously but struggled"; many messages with low
spend means "frequent interruptions or course corrections".
([session-insights](https://docs.devin.ai/product-guides/session-insights))

Per-PR cost is a **hover pill**: t-shirt size on the surface, exact total plus job count on hover.

### 5. The spend cap is a SOFT block

Hitting the per-PR auto-review limit **only pauses automatic reviews**; manual reviews still work,
and re-enabling on a specific PR exempts that PR.
([devin-review](https://docs.devin.ai/work-with-devin/devin-review))

**This is the shape our `default_mission_spend_cap_usd` should take.** A ceiling that stops
everything is a kill switch; a ceiling that stops the *automatic* path and leaves the deliberate
one open is a boundary. Note also the carve-out: review spend does not count against
per-organization session limits, so a governance function is never starved by a build budget.

## Where Devin blocks on a human, and where it does not

**Verified blocking triggers**: plan approval when confidence is not green · the explicit "Wait for
my approval" gate · credentials requested mid-session (session-scoped, "not saved for any future
sessions") · **network access requests for specific domains, surfaced for approval** so you need
not preconfigure every domain · CAPTCHA / MFA / OAuth (human takes over the browser) · launching
child sessions ("proposes the sessions for your approval before launching them") · a stacked-PR
conflict that "reflects a substantive decision" (it resolves the rest silently) · hitting an ACU
limit.

**Notably there is NO approval gate before pushing or opening a PR.** The only documented push
guardrails are ones the user writes into a playbook's **Forbidden Actions** section, verbatim from
the official example: "NEVER force push on branches!", "Do NOT push directly to the main branch."

That is a genuinely different philosophy from GitHub's, and the contrast is the useful part:
**GitHub blocks at irreversible edges; Devin blocks on low confidence and on things it cannot do
itself.** Ours should do both.

## The instruction layering, which is better than ours

Three named layers with a documented division of labour
([instructing-devin-effectively](https://docs.devin.ai/essential-guidelines/instructing-devin-effectively)):

| Layer | What it is | When |
| --- | --- | --- |
| **Knowledge** | "tips, advice, and instructions Devin can reference in all sessions" | general conventions, retrieved on trigger |
| **Playbooks** | "**like a custom system prompt for a repeated task**" | step-by-step procedures for a specific task |
| **Skills** | `SKILL.md` committed to the repo at `.agents/skills/<name>/`, on the open Agent Skills standard | reusable procedures that live with the code |

Playbook section vocabulary, worth copying wholesale for our house rules: **Procedure** (one step
per line, imperative, action verb, "mutually exclusive and collectively exhaustive") ·
**Specifications** (postconditions) · **Advice and Pointers** ("correct Devin's priors") ·
**Forbidden Actions** ("any action Devin should absolutely not take") · **What's Needed From User**.

Playbooks carry **version history with revert**. Skills are **self-authoring**: after learning
something, Devin "will suggest creating or updating a skill", surfaced in the session timeline with
a **Create PR** button.

## The session surface

Tabs: **Progress** (a unified log of "all shell commands, code edits, and browser activity") ·
**Shell** · **IDE** (an interactive embedded VS Code) · **Desktop** (the interactive browser,
renamed from "Browser") · **Tasks** (the live todo list).

**Time travel is a first-class affordance**: commands run later in the session are **greyed out**,
and clicking any command jumps the whole workspace to that point in time.

**Takeover is explicit and racy, and the docs admit it**: "Click to stop the session to take over",
then "**Make sure that Devin is paused before taking over the IDE to avoid simultaneous,
conflicting changes**". The inverse control is **"Follow Devin"**, which highlights actions live.

**Waiting is shown in the browser tab**: the favicon carries a status dot, "green when Devin is
working, **orange when it's waiting for you**", so a blocked session is visible without switching
tabs. Cheap, and we have nothing like it.

Message handling while busy is modelled properly: queue by preference, send the next queued message
with Enter in an empty composer, and queued messages default to sending the moment the agent frees
up. There is also an **`(aside)` / `!aside`** prefix that makes the agent **ignore** a message, so
you can comment on a run in-thread without commanding it.

## The CLI permission model, which is the most granular in the market

Five named modes with a published per-tool matrix: **Normal** · **Accept Edits** · **Smart** ·
**Bypass** · **Autonomous (sandbox)**. Per approval you may allow **once, for the session, or
permanently for the project**. **Smart mode delegates the judgment**: "a fast model judges whether
the action is safe to run unattended", with a hard never-auto-approve list (package installs,
mutating git, `rm`/`sudo`, `kubectl delete`, anything touching dotenv or key material).
And the line that matters most: **"Smart, Bypass, and Autonomous modes do not override
organization-level permissions."** Personal autonomy can never exceed org policy.
([cli/reference/permissions](https://docs.devin.ai/cli/reference/permissions))

## Verification caveats, preserved

The researcher flagged eight unverified items. The ones that matter: **"1 ACU is about 15 minutes"
is stale** and must not be repeated (the current definition is effort/inference-based, not
temporal); there is no "Edit plan" button (plan editing is conversational); "Planner" is a legacy
tab name; and no wall-clock session timeout is published.

---

# THE APPROVAL PATTERN, across the whole market

Researched 2026-08-01 across Cursor, VS Code Copilot, Claude Code, Codex, Devin and Windsurf. This
section is the most convergent evidence in the library, and **it validates the 2026-07-29
governance ruling almost line for line.**

## The single strongest data point

> **Cursor DEPRECATED "Ask Every Time" in version 3.5.**
> ([cursor.com/docs/agent/security/run-modes](https://cursor.com/docs/agent/security/run-modes))

The market leader removed per-action approval as an option. Not de-emphasised: removed.

## Everyone landed on the same four-rung ladder

| Product | Rungs, exact names |
| --- | --- |
| **Cursor** | Auto-review (default) -> Allowlist -> Run Everything |
| **VS Code Copilot** | Default Approvals -> Assisted permissions (LLM judge) -> Bypass -> Autopilot |
| **Devin Desktop / Windsurf** | Disabled -> Allowlist Only -> Auto -> Turbo |
| **Claude Code** | default -> acceptEdits -> plan -> auto -> dontAsk -> bypassPermissions |
| **Codex** | read-only -> workspace -> danger-full-access, plus custom profiles |

Policy lives in a FILE in every case, with the same grammar: allow / ask / deny, **deny wins**, and
an admin tier that outranks the user's. Cursor: team dashboard > `permissions.json` > IDE settings,
and once a key is set the IDE editor goes read-only.

## The three mechanisms worth naming

**1. A classifier as the boundary, steered in plain English.** Cursor sends every non-allowlisted
shell, MCP and fetch call to a classifier subagent that allows, redirects or escalates. Cursor says
in its own docs that the classifier **"is not a security boundary"** and errs in both directions.
That honesty is worth copying verbatim.

**2. A reviewer AGENT instead of a human at the boundary.** Codex `approvals_reviewer =
"auto_review"` routes eligible requests to a separate agent that sees a compact transcript plus the
exact request and grades it against intent, environment, policy and likely impact. OpenAI's
published numbers ([alignment.openai.com/auto-review](https://alignment.openai.com/auto-review/)):

> **roughly 200x fewer interruptions** · 99.1% approval rate on escalated actions · 90.3% detection
> of overeager risky actions · 99.3% detection of prompt-injection attacks

With a **rejection circuit breaker** (abort after 3 consecutive or 10 rolling denials) and
`/approve` to override one specific denial, which is itself still reviewed.

**And OpenAI's stated reason for building it is the thesis of our governance canon:**

> **"Approval friction harms security"** because it drives users to Full Access mode,
> over-permissive rules, and rubber-stamping under reviewer fatigue.

**3. Hard floors above every mode.** Cursor keeps Browser Protection, File-Deletion Protection and
External-File Protection always-approval regardless of run mode. Claude Code hook `exit 2` blocks
outrank allow rules. Devin Desktop admins set a **maximum auto-execution level** capping what a
member may choose. This is our `toolRisk` floor, independently arrived at four times.

## Spend as policy, not as a dashboard

Only Devin makes budget a per-automation policy field (ACU limit per session, invocation limit per
window, network allowlist). Cursor's are admin-tier and **deliberately soft "to avoid blocking
users"**, with alerts at 50/80/100%. Both write the ceiling in advance; neither asks a human at
spend time.

> **The researcher's verdict, and it changes our roadmap framing: "the missing
> `mission_spend_cap_usd` is not a catch-up item, it is a LEAD item. A workspace-default spend
> ceiling that fires, with the exceeded-cap event written to the record, is something no competitor
> ships, and it is the one thing that makes the autonomy argument survivable in front of a risk
> officer."**

---

# BUILD: the information model, ranked

**Tier 1, cannot ship without:** the plan as a live MUTABLE document (Cursor's is a real document
with dirty tracking, inline editing and export, not a chat ornament) · the live diff applied-then-
reviewed (**Cursor's default polarity is REJECT, not approve**) · the changed-file list with a
navigation spine · **tool calls at adjustable density** (Cursor's Compact / Balanced / Detailed,
uncontested and the right answer to "the trace is too noisy") · terminal output inline.

**Tier 2:** per-run cost as a workflow affordance · **the commit that links to its own session
log** · checkpoints as an axis SEPARATE from git (Claude Code keeps 100, 30-day retention, and
honestly reports `Restored the code, but skipped N files`) · multi-agent state at a glance ·
tests/CI and the failure loop.

## The verb set, with the bindings that are stable across products

`Cmd/Ctrl+Return` accept or send-now · `Cmd+Backspace` reject · `Esc` interrupt WITHOUT discarding
· `Shift+Tab` cycle autonomy mode (Cursor and Claude Code agree) · `Ctrl+B` background a task.

Verbs we lack: **Stage to accept** (VS Code: staging in source control implicitly accepts pending
edits, so git becomes the accept gesture and there is no second approval, the cleverest verb in the
set) · **Steer with Message** landing at the next tool boundary rather than the next turn ·
**Queue** with drag-reorder · **Rewind** with Claude Code's menu (Restore code and conversation /
Restore conversation / Restore code / Summarize from here / Never mind), the best-articulated menu
anywhere · **Fork** the conversation · **Split PRs** into logical slices with a backup snapshot ·
**Retry a denial** (Claude Code `/permissions` Recently denied tab, press `r`).

## The genuine market gaps in Build

- **No product ships a first-class "loop until green."** Cursor tells you to build it from hooks
  (`loop_limit` default 5). **Nobody records "iteration 1 failed this test, iteration 2 changed
  this, iteration 3 passed" as inspectable history.** An agent that retries invisibly is exactly
  what makes people demand approval gates back.
- **Non-blocking clarification** exists only in Cursor 2.4: the agent asks and **keeps working**,
  incorporating the answer when it arrives. This is the most important single verb for a policy
  product, because the ask stops being a gate.

---

# DESIGN: the fidelity ladder and "what it replaces"

## The headline finding: the AI-native tools DELETED the fidelity ladder

Only legacy-lineage tools expose fidelity as a control. Figma Make, v0, Lovable and Artifacts have
none: **the preview IS the artifact.** What replaced the ladder is a pre-code **planning rung**
(Figma Make Plan mode, Lovable Plan mode, v0 Plan Mode).

**Uizard is the model to steal: fidelity is a VIEW ON ONE DOCUMENT, not a separate document.** One
toggle repaints the same project as a black-and-white hand-drawn sketch or a finished mockup. And
Figma's Config 2026 **Code Layers** points at the successor: individual LAYERS promoted from static
to live, per layer, rather than the whole document switching.

## "What it replaces": Figma Dev Mode Compare changes is the reference, and NOBODY in the AI category copied it

([help.figma.com/.../15023193382935](https://help.figma.com/hc/en-us/articles/15023193382935-Compare-changes-in-Dev-Mode))
In one modal: **Side by side** and **Overlay with a transparency slider** · a timeline of file
history including autosaves · per-layer tags **Edited / Added / Deleted**, click to zoom · selecting
an edited layer shows **the previous version's property values beside the current** · **and the code
diff between the two versions**.

> **Across every AI generator there is no visual before/after between two committed versions.** v0
> and Figma Make have one only for UNCOMMITTED staged edits. This is the founder's exact ask
> (2026-08-01, "you should know what it is replacing") and it is an open position in the market.

Figma branch review is the same grammar for approval, and its documented limitation is instructive:
**merge is all-or-nothing**, no way to select individual changes.

## How a change is requested: three models, one clearly winning

**Stage -> before/after -> Apply -> new version.** v0 Design mode and Figma Make converged on this
INDEPENDENTLY within a year, **including the economics: direct manipulation is free while staged;
only the commit costs.** v0: pending edits with Undo / Redo / Reset and a **Before / after preview**
toggle that "temporarily toggles off all pending edits so you can compare with the original", then
**Apply** serializes them into "a diffable, reviewable, revertable chat version". Figma Make,
2026-07-30: "Edits stack up in the chat panel first, **staged and credit-free**, until you apply
them."

Lovable's preview toolbar is the richest taxonomy: **Select elements** `S` · **Edit text inline**
`T` (**free up to 100 edits/user/day**) · **Draw annotation** `D` · **Add a comment** `C`.
**The under-copied insight: a text change is a DATA edit, not a generation, so it does not invoke
the agent at all.**

## Design-system enforcement, and the provenance gap

1. **Lovable is the only product with an automated adherence check.** It scans generated output for
   raw colour literals where a token belongs, custom re-implementations of system components, and
   inline style overrides, then **"automatically retries to correct them before finishing the
   generation."**
2. **v0 has the strongest stated constraint**: "If a component, prop, or token cannot be verified
   from the sources, v0 should not use it." Plus the best onboarding ritual: it **builds a small
   starter app using your design system to prove it understood.**
3. **Figma Code Connect** is the only real ground truth, but lives on the inspect side.
4. **Stitch's `docs/design/archive/ember-editorial-landing.md`**, an agent-friendly markdown file of design rules. The most portable idea
   in the category and the closest to our own conventions.

> **THE UNIVERSAL GAP: not one product renders provenance.** Nothing labels a generated element
> "this is your `<Button variant="primary">`" versus "this one I invented". Lovable enforces
> silently, v0 constrains in the prompt, Figma proves it only in Inspect. **No product shows the
> user, on the generated surface, which parts came from the system and which were improvised.**
> That is the clearest unclaimed position in this market, and for a product whose brain is supposed
> to GUIDE rather than store, showing where the agent improvised is exactly where the brain should
> speak up.

## Handoff

Figma treats handoff as a **representation** problem (Inspect, per-language snippets, variables per
layer, Ready for dev / Completed / Changed statuses, the compare modal, and an MCP server exposing
`get_code` and `get_variable_defs`). Every AI generator treats it as a **transport** problem: the
code is the spec, push it to a repo. **Nobody does both.**

---

# WHAT THE WHOLE MARKET GETS WRONG (the openings)

1. **The default polarity is still "the human is a reviewer", not "the human sets boundaries."**
   Nothing treats NOT reviewing as the normal outcome. For us the diff cannot be the destination; it
   is the exhibit attached to an outcome, opened when the outcome or the record is contested.
2. **Policy is a settings file, so it is invisible at the moment it matters.** None of these
   products shows, in the run, WHICH POLICY let this happen or which would have stopped it. Claude
   Code's `/permissions` with its Recently denied tab is the seed of the right idea and nobody grew
   it into a product surface.
3. **The queue is never offered for deletion.** No product reads your approval history and proposes
   a policy. Devin's Suggested Knowledge is the right mechanic pointed at the wrong object. Our
   governance canon's "you approved 14 of these without changes, let Engineer do it alone?"
   **exists nowhere.**
4. **Everything above the floor is per-tool-call. Nothing is per-OUTCOME.** Every allowlist gates
   commands and tools; none gates consequences. "Never ship anything a customer sees without a named
   owner" is not expressible in any of these grammars. Codex's reviewer agent is the only mechanism
   reasoning about impact rather than syntax, and it is a model, not a policy.
5. **Cost is a billing page, not a boundary.** See the spend verdict above.
6. **Provenance is invisible in the design lane.**
7. **There is no ledgered failure loop.**

**Six of those seven are things our architecture already has the pieces for.** That is the strategic
read of this entire library.

---

# DESIGN, remaining

🟡 **Still to research as of 2026-08-01.** Covering: Cursor Composer/Agent, Claude Code, GitHub
Copilot Workspace and Devin for how in-progress agent work is made visible (what streams, the file
list, per-hunk diff review, terminal permission, tests and CI, steering mid-run); and Figma
(Dev Mode, prototyping, Make), v0, Claude Artifacts and Lovable for the fidelity ladder, how a
design is compared against what it REPLACES, and how a design system is enforced during
generation. **Append the result here when it lands rather than leaving it in a session.**

Known already from the codebase rather than from research:
- Our Build review is closer to Cursor than expected. `ChangesPanel` has a Monaco diff, per-hunk
  accept/reject, reject-a-staged-file, and touch-list scope enforcement.
- Our Design station already renders a genuinely interactive prototype (`DrawingStage`, a
  sandboxed iframe with scripts and forms allowed on purpose), plus a fidelity spectrum and a
  design critic.
- The open question the research must answer is **"what it replaces"**: before/after against the
  existing screen, which we do not have.

---

# TODAY: the command brief

Researched 2026-08-09 against official Stripe and Linear product documentation. **Reference model: Stripe Home's overview plus unresolved attention, combined with Linear's contextual action rows.** Today should tell a person what changed, put the first unresolved call beside its evidence and verbs, then let them drill into the underlying work without turning the front door into a configurable dashboard or a notification inbox.

## The information model and verbs

1. **A factual opening state.** Stripe Home begins with current business performance and important unresolved items. Supaprod's equivalent is the count that genuinely needs the person, followed immediately by the first call.
2. **One contextual action row.** Linear keeps preview and action in the same reading flow. Evidence, consequence, and Approve / Decline / Snooze stay attached to the call instead of splitting provenance into a distant rail.
3. **Compact changed-evidence rows.** Each volunteered insight carries its own action and dismissal. The user can act without opening a separate inbox, while the underlying decision or theme remains one click away.
4. **Drill down, do not decorate.** Supporting counts open the queue, run, or outcome behind them. No metric exists only to make the page look busy.

## Deliberately rejected

- **Stripe's configurable widgets.** Today is a brief, not a dashboard the user must arrange.
- **Linear's notification-inbox framing.** Supaprod guides the next call; it does not hand the user another queue to maintain.
- **Hero metrics and card grids.** The dominant object is the real decision, not a decorative number.

Sources: [Stripe Dashboard basics](https://docs.stripe.com/dashboard/basics) · [Linear contextual Inbox actions](https://linear.app/changelog/2020-03-11-issue-relations) · [Linear drillable dashboards](https://linear.app/changelog/2025-07-24-dashboards).

Content was rephrased for compliance with licensing restrictions.

---

# STEP 0 RESEARCH: PREMIUM UI PATTERNS (2026-08-10)

Researched 2026-08-10 against official product documentation. **Supaprod 36-hour premium redesign sprint.** Nine core pattern classes extracted; reference products: Stripe, Linear, Figma, Vercel, Anthropic, Google, Sentry.

**Research method:** Official documentation + shipped product inspection. Mobbin MCP unavailable; substituted with direct source research. Same rigor, same citation discipline.

---

## APP SHELLS & LAYOUT SYSTEMS

**Convergent pattern:** Three-region shell (header, sidebar, content).

**Proven references:**
- Stripe Dashboard: Dense cards in content pane; grid-based
- Linear: Sidebar + right detail panel; context in header
- Figma: Canvas-centric (sidebar + inspector, not traditional nav)
- Vercel: Top-bar heavy (context + actions)
- Anthropic Claude: Minimal nav; canvas-first (like Figma)

**Key findings:**
- **Sidebar auto-collapses on tablet** (icons only, hover labels)
- **Context-aware sub-nav in header** (which workspace/file/deployment?)
- **Sticky header** (rarely sticky sidebar)
- **Selection = background shift on neutral ramp** (no color)
- **Reject breadcrumbs** (title + back button is clearer)

**For Supaprod:** Three-region shell with collapsible rail. Header for context. No breadcrumbs.

---

## NAVIGATION: SIDEBAR vs TOP-BAR vs TABS

**Best reference:** Linear (sidebar nav fully designed)

**Pattern:**
- **Workspace context** at top of sidebar (logo + name)
- **Primary sections** (Issues, Projects, Cycles, Pages)
- **Secondary** (Recent, Drafts, Inbox)
- **Settings** at bottom
- **Icons + label** at full width; icons only when collapsed
- **Hover label** (tooltip, 200ms delay) on collapsed state
- **Selection** = background color shift (--sp-sheet → --sp-lift), no decoration
- **Active section** carries visual weight but no color

**For Supaprod:** Sidebar with collapsible-to-icons. Header for workspace/project context. Hover labels on collapsed nav.

---

## COMMAND PALETTES / GLOBAL SEARCH

**Best references:** Linear (⌘K), Figma (⌘K), Claude Code (⌘K commands)

**Convergent pattern:**
- **⌘K to open** (Ctrl+K Windows)
- **Recent items first**, then categories
- **Fuzzy search** (type "bob" → find "Bob's Project")
- **Keyboard-only** (arrow keys, J/K, Enter)
- **Escape to close**
- **Frecency ranking** (frequency + recency combined)

**For Supaprod:** Implement ⌘K with recent stations/items + fuzzy search across decisions/bets/outcomes. Keyboard-only. Enter executes.

---

## DATA-DENSE TABLES WITH INLINE ACTIONS

**Best reference:** Linear Issues table

**Pattern:**
- **40px row height** (compact by default)
- **Density toggle** in settings (Compact 32px / Normal 40px / Spacious 48px)
- **Essential columns visible**; scroll for others
- **Inline actions** (hover menu, three-dot icon)
- **Row selection** (checkbox + Shift+click range)
- **Sorting** via column headers (↑ ↓ indicators)
- **No pagination** (infinite scroll or load-more)
- **Status color on left edge** or in column (never text-only)
- **Hover state:** background shift (--sp-sheet → --sp-lift)

**For Supaprod:** Linear model. 40px rows. Density toggle in settings. Sorting. Infinite scroll. Status color always present.

---

## MODALS / DIALOGS

**Best reference:** Linear (clean anatomy) + Anthropic (minimalism)

**Pattern:**
- **Centered modal**, max-width 480px
- **Backdrop blur** + semi-transparent overlay
- **Header** (title + close button X)
- **Scrollable body** (if > ~400px)
- **Footer** (primary + secondary actions)
- **Escape closes** (no confirmation unless data loss)
- **Animation:** Fade-in or slide-up (250ms ease-out)
- **Tab focus trap** (focus cycles within modal)

**For Supaprod:** Use Linear anatomy with Anthropic's minimalism. Centered, 480px, header + body + footer. Blur backdrop.

---

## FORMS / INPUT VALIDATION

**Best references:** Stripe Checkout, Linear Issue creation, Anthropic Claude

**Pattern:**
- **Inline validation** (on blur, not keystroke)
- **Error message + red border** (not just text)
- **Helper text below field** (font-size-xs, --text-muted)
- **Required indicator** (asterisk or label)
- **Focus state:** border + subtle shadow
- **Submit button disabled until valid**
- **Char counter** for bounded fields
- **Full-width fields** (no two-column layouts)

**For Supaprod:** Blur validation. Error below. Helper text. Required indicator. Focus ring. Disabled submit. Char counter.

---

## EMPTY / LOADING / ERROR / SUCCESS STATES

**Best references:** Linear (empty + error), Figma (loading), Anthropic (success)

**Pattern:**
- **Empty:** Illustration (optional) + title + description + CTA (centered, full pane)
- **Loading:** Skeleton loaders (same height/width as content) + pulse animation (1.5s ease-in-out), never spinner alone
- **Error:** Banner + title + description + Retry/Back action (specific error message, not "Error 500")
- **Success:** Toast notification (4s auto-dismiss), not permanent overlay

**For Supaprod:** Empty = centered card with CTA. Loading = skeletons + pulse. Error = banner + action. Success = toast.

---

## NOTIFICATIONS / TOASTS

**Best reference:** Linear (comprehensive)

**Pattern:**
- **Position:** bottom-right
- **Size:** 360px wide, auto height
- **Icon** (16px, left): ✓ green (success), ✕ red (error), ℹ blue (info), ⚠ amber (warning)
- **Title** + optional description
- **Close button** (X, top-right)
- **Auto-dismiss:** 4–6 seconds (extend if has action)
- **Animation:** Slide-in from bottom-right (250ms ease-out)
- **Stack vertically** (max 3 visible)

**For Supaprod:** Bottom-right. Icon + title + description. Auto-dismiss 4s. Color by type. Stack vertically.

---

## AUTHENTICATION FLOWS

**Best references:** Linear (four-step), Anthropic (passwordless), Google (OAuth)

**Pattern:**
- **Email → Verify → Password → Workspace**
- **Email verification:** Link in email (or skip, verify later)
- **Password strength indicator** (Weak/Medium/Strong)
- **Passwordless option** (email link) as secondary
- **Skip onboarding** (return to setup later)
- **OAuth optional** (GitHub for developers)

**For Supaprod:** Email-first with passwordless secondary. Verification link. Password strength. Can skip onboarding.

---

## DESIGN DECISIONS LOCKED FOR STEP 2

1. ✅ **Three-region shell** (header, sidebar, content)
2. ✅ **Sidebar nav** (collapsible to icons, context in header)
3. ✅ **⌘K command palette** (recent + search, keyboard-only)
4. ✅ **40px table rows** (Linear density, density toggle optional)
5. ✅ **Linear modal pattern** (Anthropic minimalism)
6. ✅ **Inline form validation** (blur, error below)
7. ✅ **Skeleton loaders** (no spinners alone)
8. ✅ **Toast notifications** (bottom-right, auto-dismiss)
9. ✅ **Email-first auth** (OAuth optional, passwordless secondary)

**Status:** STEP 0 complete. 9 pattern classes researched. All decisions are cited. Ready for STEP 1 audit and STEP 2 design system.


---

# BEAUTIFUL UI: 19 primitives for agentic interfaces

Researched and captured 2026-08-14. **This section used to be the only correction of the `--sp-*`
instruction that stood in this file's own header; the header itself was fixed on 2026-08-19 and now
says Meridian, so the two agree.** The founder retired every prior design system on 2026-08-14 (v1, v2, v3,
Obsidian, Tempo, Cadence/ink) and instructed that the platform be designed fresh. New work is
expressed in **Meridian** (`src/styles/meridian.css`, `--mrd-*`). `--sp-*` is life support for
surfaces not yet migrated: never extend it, drop it as each surface moves, delete it when the last
one does.

## The source, and how to re-check it

| | |
| --- | --- |
| **Origin** | <https://www.beautifului.dev/> |
| **Author** | Turbo, a product design studio, credited on the site foot |
| **Licence** | MIT, stated on the source page |
| **Captured** | 2026-08-14, all 19 components |
| **Method** | each component's own **"View code"** panel on that page, read as text |

**If you are an agent and you need a component's source: open that URL, find the component by
name, press "View code".** The panel carries the real source including the author's design notes,
which are usually the reason a value is what it is. Two ways of getting it that produce wrong
answers, both tried: reading the rendered demo and inferring the code, and screenshotting the
panel and transcribing it. Neither survives contact with the timings.

One extraction note worth keeping. The in-page scripting route returns the source through a
content filter that rejects it; `get_page_text` with the code panel open returns it intact. That
is a tooling quirk, not a permissions one.

## Why this reference class at all

It is the only published set built for the thing this product actually is: an interface where a
machine works and a person adjudicates. Every component in it answers a question our audit found
unanswered somewhere in the app. It is not a style to admire; it is a parts bin that matches our
holes.

## The Meridian mapping

Their code is Tailwind against their own theme. Ours is Tailwind v4 (`@tailwindcss/vite`), so it
compiles nearly verbatim once the names are mapped. Porting is mechanical:

| Theirs | Ours | Note |
| --- | --- | --- |
| `"use client"` | *delete* | this app is TanStack Router, not Next |
| `text-ink` / `var(--ink)` | `text-mrd-ink` / `var(--mrd-ink)` | |
| `text-ink-2` / `var(--ink-2)` | `text-mrd-body` / `var(--mrd-body)` | |
| `text-ink-3` / `var(--ink-3)` | `text-mrd-mute` / `var(--mrd-mute)` | |
| `bg-inset` | `bg-mrd-sink` | |
| `bg-hover`, `bg-hover-2` | `bg-mrd-hover` | they carry two, we carry one |
| `bg-line`, `border-line` | `bg-mrd-line`, `border-mrd-line` | |
| `border-line-strong` | `border-mrd-edge` | |
| `text-green` | `text-mrd-pass` | outcome only |
| `text-red` | `text-mrd-fail` | outcome only |
| `bg-orange` | `text-mrd-you` | see the colour rule below |
| `bg-accent` | `bg-mrd-agent` | their accent is categorical, not brand |
| `rounded-control` | `rounded-mrd-ctl` | ours is `ctl`, not `control` |
| `@keyframes X` | `mrd-X` | prefixed; `spin` and `fade-in` already exist elsewhere |

**Do not reuse their token names.** `--ink` is already declared four times in `src/styles.css` at
four different values, inside the `[data-obsidian]` layer mounted on `<html>` for the whole
authenticated app. That layer's blocks share specificity and resolve by source order, and its own
header records two production bugs caused by exactly that. Aliasing onto `--ink` loses that fight
silently, in one theme only.

**Both themes come free, and nothing is written twice.** `--mrd-*` is redefined under
`[data-theme="light"]` and `@theme inline` emits the `var()` reference rather than a frozen copy,
so one component renders correctly on both grounds. If you find yourself writing a light variant
of a component, stop: the mapping is wrong somewhere.

**Where their colour meets our rule.** Meridian carries one semantic law: warm gold means a person
is required, cool blue means a machine is working, green and red are outcome. Their palette is
decorative in places (three categorical dot colours in a search trace). Map by MEANING, not by
matching hue: an "attention" orange becomes `--mrd-you`, an agent-activity colour becomes
`--mrd-agent`. A component that ends up with four hues doing no semantic work has been ported
wrong.

## The 19, and where each one belongs here

Placement is grounded in the surface audit of 2026-08-14, so each row names a real hole rather
than a guess. Status is kept current as they land.

| # | Component | What it is | Where it goes, and the gap it closes | Status |
| --- | --- | --- | --- | --- |
| 01 | **Loading State** | pixel grid, shimmer label, live elapsed timer | Everywhere an agent genuinely runs. Closes the founder's stated top gap ("live agent status, the only core USP"): the shipped state says *what* is being read, never *how long*, so a slow job and a hung job are the same pixels. Bare loading states at `runs.$missionId` and `traces.$traceId` first. | ✅ ported |
| 02 | **Thinking** | expandable trace: steps, reasoning, search, coding | `traces.$traceId`, the single rawest file in the app (1.1:1 primitive to raw div). Also the step list on `runs.$missionId`. | ✅ ported |
| 03 | **Streaming Text** | streamed answer with inline sources and follow-ups | The Ask pane. Also Brain, where precedent is currently a list and should be an answer with its sources attached. | ✅ ported |
| 04 | **Approval Card** | the human-in-the-loop question, asked before acting | `/approvals`, Today's "Ready for your review" lane, and the Decide gate. All three read the same queue today with three different keyboards. | ✅ ported |
| 05 | **Tool Chips** | tool calls and code edits as compact chips | Build. This is the founder's backlog item 2 verbatim: expanding a touched file "opens something he cannot locate, with unexplained blank space above it". | ✅ ported |
| 06 | **Task Rows** | live agent task status: running, failed, completed | `/runs`, and Today's four lanes. Today renders a raw DB enum (`halted`, `blocked`) straight into the Stuck row. | ✅ ported |
| 07 | **Chat** | tabbed chat panel with reasoning replies | The Ask pane body. | ✅ ported |
| 08 | **Prompt Bar** | composer with @ sources, / commands, model picker | The Ask composer. Ruling stands: Ask lives top right and opens a pane; the bottom composer strip is rejected. | ✅ ported |
| 09 | **Recommendation Card** | agent suggestion with a confidence meter | Decide, under the gate. Also the forecast desk, where a model that returned unparseable output currently renders identically to a considered judgment. | ✅ ported |
| 10 | **Context Cards** | retrieved knowledge chunks with their sources | Brain precedent, and Decide's evidence recess. Evidence is capped at four with no way to spot-check quality. | ✅ ported |
| 11 | **Diff Table** | proposed edits sweeping through tabular data | Design's proposed changes, and spec revisions. | ✅ ported |
| 12 | **Records Table** | dense grid with tags, sorting, relationship status | `runs.index` and the Decide queue. | ✅ ported |
| 13 | **Filter Table** | status chips that reorganise live data | The missing dense-data affordance. Design renders **every** drawing uncapped and unsearchable; Ship has five independent expand toggles and no filter; Build has no search on a workspace-wide list. | ✅ ported |
| 14 | **Sidebar Nav** | workspace navigation with quick search | The rail. Founder backlog item 6: auto-collapse once the spine is familiar, with instant hover tooltips. | ✅ ported |
| 15 | **Search** | command search with live filtering and an empty state | The command palette, and the absent search on the spec list, Design and Ship. | ✅ ported |
| 16 | **Insight Cards** | paged insights with scrub-ready live charts | Learn. Note the honesty constraint: never claim accumulated learning in the present tense. | ✅ ported |
| 17 | **Code Block** | agent-written code streaming in line by line | `traces.$traceId`, whose current `<pre>` has no overflow and no max height despite its own comment claiming both. | ✅ ported |
| 18 | **Fine-tune Card** | the agent adjusts design properties in an inspector | Design, as the fidelity and property inspector. | ✅ ported |
| 19 | **Selection Actions** | highlight a passage, hand it to the agent | Prose surfaces: the spec, the PRD, the release document. | ✅ ported |

## Standing constraints that override anything lifted

1. **Vocabulary.** Never *receipts, ledger, company brain, decision layer, unattended, first run,
   provenance*. Never *remembers, stores, logs* as verbs of the brain. *Audit trail* and *shared
   brain* are correct. Never claim accumulated learning in the present tense.
2. **Never mechanism as a label.** Their demos name columns (`Via`, `Span id`). That is right only
   in the engine room's drill layer, where the reader is an engineer, and wrong everywhere else.
3. **Empty is the primary case, not the afterthought.** Production holds 296 decisions with one
   forecast and zero resolutions, and `agent_memory` holds zero rows of kind `outcome`. Every
   component lands on an empty workspace first. Design the zero and one-row cases before the dense
   one; the dense one is hypothetical today.
4. **A failed read is never an empty state.** It must not wear one's clothes, and it must offer a
   way out.

## All 19 landed, 2026-08-14. What we deliberately changed, and why

`src/components/meridian/`, 20 files, roughly 7,950 lines, **zero hardcoded colours**: every
colour in every component resolves to a `--mrd-*` token, verified by sweep. The twentieth,
`StalledWork.tsx`, is not from the reference; it was designed from a production finding and is
described below.

**Read this section before "fixing" anything back to match the source.** Each item below is a
place where the reference is wrong for this product, and every one of them looks like a bug to
someone comparing against beautifului.dev.

### Timing

- **Streaming Text reveals about 3x slower than the source.** Founder note, 2026-08-14: it read as
  mechanical rather than as something being written. The source reveals per WORD at 55ms; ours
  reveals per CHARACTER at 30ms, so a word lands roughly every 175ms and longer words take longer,
  which is most of what makes text read as writing. Sentence stops hold 260ms, commas 110ms.
  Jitter is plus or minus 20 percent derived from the chunk index, never from a random source, so
  the curve is deterministic and `chunkDelay` is exported for a test to pin it. **Do not speed this
  back up.**
- **Approval Card's 480ms auto-advance is removed.** It turned the page before a reader could
  change their mind, on a control that releases an agent.
- **Only a running task spins.** A blocked row is deliberately still: a closed ring, not an arc,
  because there is no progress to report on stopped work.

### Colour, where the source would have lied in our semantics

- **The confidence meter is neutral, not green.** Green reports an OUTCOME here, so a green meter
  would claim the recommendation had already worked. It also stated its value twice, as bar count
  and as hue, which fails the greyscale test. Bar count is the whole signal.
- **`confidence: null` draws no meter at all.** A meter at zero is still a measurement. Production
  writes an unparseable model response as confidence zero, so drawing an empty meter would repeat
  that lie in a new font. Null gets a hollow ring, its own sentence, and the verb **Review** rather
  than **Approve**, because it only shows you something.
- **Fine-tune Card's green "Edited" is gone.** An edit is not an outcome. The header reads
  **Proposed** or **Yours**, naming ownership instead of an event.
- **Status chips and tags carry no colour.** They are counts, not semantics. Twelve hardcoded tag
  hexes became one neutral tag.
- **The primary button stays neutral**, never inverted ink and never accented. A saturated primary
  was tried and rejected twice in this product's history for spending the one accent on chrome.

### Bugs in the reference, fixed rather than ported

- **Sorting compared printed strings**, so "9 days ago" sorted ahead of "2 months ago" and the
  column looked like it worked. Ours compares values.
- **A second textarea was rendered when the composer wrapped**, so React unmounted the first and
  dropped focus and caret mid-sentence at exactly the keystroke that triggered the wrap. Now one
  textarea reordered by CSS.
- **A number input bound straight to its clamped value**, so with a minimum of 40 you could not
  clear and retype: 150 came out as 4015. It now keeps a typed draft.
- **A `<label>` wrapped two controls**, so its implicit association silently landed on one of them.
- **A "no results" panel was gated on a query longer than two characters**, so a short
  non-matching query rendered blank.
- **A resting list sliced silently to five rows.**

### States the reference does not distinguish, and we must

Every list now separates four facts that this product has been collapsing into two: **nothing
exists**, **a filter excluded everything**, **the read failed**, and **the list is capped**. The
third must never wear the second's clothes and must offer a way out; the fourth must print a real
number rather than truncating in silence.

### The twentieth component

**`StalledWork.tsx`** has no counterpart in the reference. It came from a production measurement on
2026-08-14: twelve approval gates pending, the oldest for 86 hours, each holding up one named piece
of work, and nothing anywhere told anyone. The diagnosis was not that the queue looked bad. It was
that **a pending approval is a row in a list rather than a stalled piece of work with a cost**. Age
therefore drives emphasis, through elevation and weight as well as hue so it survives greyscale,
and the card names what is not happening. Work stopped for want of a source carries **no accent**,
because connecting one is a setup act rather than a decision, and dressing it as a decision sends
someone hunting a button that does not exist.

### A note on extracting the source

With six agents on that page at once it never reached document idle, and the "View code" panel
could not be clicked. Two agents independently fell back to the page's own server-rendered payload,
which is the same string the panel renders, and **both validated the method** by diffing their
extraction of Loading State against the port already committed here. Both recorded the method in
their file headers rather than claiming a panel read. If you are re-extracting, do it with ONE
browser tab, or use the payload and say so.

---

## The permission prompt, read off Claude Code, for `PlanGate` (K-23, 2026-08-20)

**The reference for a gate is not beautifului.dev.** It documents twenty components and none of them
is a permission prompt, which is the same kind of gap its missing form controls were: it is a
vocabulary for agentic interfaces and this decision belongs to the class of things a coding agent
does. So the reference named before building was **Claude Code's own permission prompt**, on the
grounds that it is the most-used agent gate in this market and the one whose failure modes have been
measured at scale rather than argued about.

### The information model, lifted

| | The prompt | What `PlanGate` does with it |
| --- | --- | --- |
| Shape | a numbered list of answers, two or three | three answers, numbered 1 to 3 |
| Each answer | a full sentence, not a verb | label plus a consequence in plain words |
| Keyboard | the digit takes the answer | the digit takes it, from anywhere on the card |
| Accent | **none.** No answer is styled as preferred | none, and the `you` status is a chip instead |
| Frame | no borders. A plain list, the row under the pointer lights up | borderless rows, hover wash, inset focus ring |
| Refusal | *"No, and tell Claude what to do differently"* | "Keep planning", which opens a reason field |

**The third answer is the one worth copying most exactly, and it is the one most products get
wrong.** Refusing and redirecting are the same act. Splitting them into a reject button and a
separate instruction box produces the state everybody has seen: work stopped, nobody told it why,
and the next attempt is identical to the one that was refused. Ours will not commit that answer
without a note, for the same reason a skipped station cannot be recorded without one.

**No accent is a design position rather than a missing style.** Every answer releases the gate, so
either all three carry the accent, which is three accents and therefore none, or no answer does. A
house favourite among them is also the product making the call it is asking the reader to make.

### Two things NOT taken from it

- **Its scope.** The prompt asks about one tool call. `PlanGate` asks about a whole plan, once,
  because a step-level gate cannot be rescued by better design: 93% of permission prompts get
  approved, and our own record is worse at six agents on a 100% approval rate with eleven tools
  asked 130 times and answered zero times. A gate that gets clicked through manufactures the
  appearance of review and produces none of it.
- **Its position in the flow.** The prompt interrupts. This one sits before anything runs, which is
  what makes "Keep planning" free and therefore honest.

### What only a render showed, and it changed the component twice

Both corrections came from serving the built stylesheet and measuring, not from the test suite,
which was green through both defects.

1. **The answers were bordered cards first.** Rendered, that put **four bordered containers in one
   region** (the plan card plus three answers) where the anti-slop standard allows one, and it made
   the answers visually heavier than the plan they are about. Borderless rows with a hover wash: one
   bordered container in the region, measured.
2. **`Spend` rendered at its own 320px default under a 520px plan and above 520px answers.** The
   label sits left and the figures sit hard right, so at 320 both amounts landed in the middle of
   the column with nothing aligned to them. `Spend` gained a `measure` prop and the gate passes the
   column's own width; every child's right edge is now at the same pixel.

### A defect this exposed in `RunMap`, which is not this item's to fix

`RunMap` inside a 520px column: `scrollWidth` 684 against `clientWidth` 520, so **164px and one of
four stations are hidden**, with `scrollbar-width: none` from `.mrd-fade-scroll` and
`mask-image: none` because `RunMap` never applies `edgeMask`. **The route truncates with no
affordance of any kind.** It has never shown because the gallery gives it the full page width.
The fix is the same shared `useScrollEdges` extraction that `Dialog` wanted in K-03 and that
`RunTimeline.tsx` already carries a comment asking for.

---

## Linear's Inbox, for `AgentInbox` (K-24, 2026-08-20)

Read off [Linear's own docs](https://linear.app/docs/inbox) rather than off a screenshot, for the same
reason every other port here is: the mechanics are the hard part and a picture loses all of them.

### Lifted

| | Linear | `AgentInbox` |
| --- | --- | --- |
| Moving through the list | `J` / `K` or the arrows | the same four keys |
| Tab stops | one for the list | one, via a roving `tabIndex` |
| Reading an item | opens "in a special Inbox view", never leaves | expands in place, no route change |
| Truncation | caps at 2,000 and **says so** | folds past three and prints the count |

**The single tab stop is the mechanic worth naming.** Sixty sessions would otherwise be sixty tab
stops between the inbox and anything after it, which is the difference between a triage surface and a
list of links.

### Not lifted, and each omission is a decision

- **Linear groups by notification TYPE.** Ours groups by what a session needs from a person. Grouping
  by type would rebuild the activity dashboard this component exists against.
- **Read / unread.** An agent session has no read state, it has a need. Porting read/unread would add
  a second axis that competes with the only one that matters.
- **Snooze.** Replaced rather than ported: a row goes quiet on its own after one `track-tick`, so
  nobody has to tell the product "not now". Linear's snooze is a person doing that work by hand.

### What planting found, which is the part worth reading

**The suite HUNG rather than failing.** With the keyboard accelerator's text-control guard removed, a
keystroke from inside the reply field reached the selection-mover, whose `focus()` pulled focus out of
an input carrying `autoFocus`. Removing the `focus()` call made the hang go away, which is what
identified it.

Two lessons, both general:

1. **A test that hangs cannot tell a defect from broken infrastructure.** The fix belongs at the
   dangerous act rather than at one caller: the guard now sits inside the mover, so the loop is
   impossible however it is reached, and the caller's guard is left in place because it protects a
   different thing (`preventDefault` swallowing a letter somebody is typing).
2. **Focus and selection must have one writer.** This had two: focus set the selection and the mover
   set the selection and then moved focus. Two-way bindings on focus are how lists loop.

---

# PLAN: turning a decision into a spec somebody could build from

Researched 2026-08-20 against official product documentation. **Structural insight: a spec is not a
document with sections, it is a set of unknowns with an order.** The named reference class in the
table above (Linear cycles, Productboard roadmap) is a planning surface for *work already
understood*, and Plan's job starts one step earlier, when nobody yet knows what the work is. That
mismatch is why the four questions in the brief split cleanly: two of them the named class answers
well, one it barely touches, and one it does not address at all.

## Verdict on the named class first, because two of the four questions needed a different reference

| Question | Does Linear cycles / Productboard roadmap answer it? | What actually answers it |
| --- | --- | --- |
| 1. Scope without a Gantt chart | **Yes, and better than expected.** Linear's cycle graph makes scope a moving line rather than a bar, and its date fields are granular *by certainty*. Productboard's releases are explicitly buckets, not dates. | Linear projects and cycle graph · Productboard releases · **Basecamp's hill chart**, which is the only one that shows progress without counting anything |
| 2. How a spec shows its citations | **No.** A roadmap card carries counts and links, not claim-level attribution. Productboard's evidence link runs feedback into a feature (already captured in the Discover section), which is the inverse direction: evidence to item, not sentence to source. | **Anthropic's Citations API** is the only fully specified claim-level model found, and Productboard **Spark** is the only product that ships spec-grade grounding. **A named gap: nobody in the planning category renders a cited spec.** |
| 3. Sequencing | **Yes, and it is the strongest part of Linear's model:** ordered milestones with optional dates, blocked / blocking relations, and a dependency that can be marked *violated*. | Linear milestones and project dependencies, plus **Shape Up's ordering rule** for which unknown to attack first |
| 4. A spec while an agent is still writing it | **No. The roadmap surface has no concept of it.** | **Linear's Agent Session and Agent Activity API** (a state machine derived from what the agent emitted), **Productboard Spark** (the closest live competitor to this station), and **GitHub Spec Kit** for how an unfinished spec marks its own holes |

**Two references earned their place and were named nowhere in this file before today.** Basecamp's hill chart, because
it is the only shipped answer to "show me where this stands" that refuses both task counts and
estimates, and both of those are the failure modes our surface would otherwise walk into. And
Productboard Spark, because it is a generally available agent that drafts specs from clustered
signal and hands them to a coding agent, which is this station's job description; ignoring it would
mean designing Plan without reading the nearest competitor's manual.

## The merged information model for one spec

**Tier 1, the spec is not usable without these**

| # | Field | Lifted from |
| --- | --- | --- |
| 1 | one-line intent, plus the decision it descends from, resolvable both ways | Linear (a project is "units of work that have a clear outcome", issues attach to exactly one) |
| 2 | **scope as a list of named vertical slices, not a task list.** Each slice is a thing somebody can click and try | Shape Up ("integrate one slice"; scopes give the project its vocabulary) |
| 3 | **dates whose granularity matches the certainty**: year, half, quarter, month, or exact day, chosen per spec | Linear timeframes ("select start and target dates that match your level of certainty") |
| 4 | per-slice position on the unknown-to-known axis, held separately from percent done | Basecamp hill chart (uphill is figuring out, downhill is executing) |
| 5 | **non-goals, captured as an answered judgment call rather than an empty heading** | Spark (it asks the in-scope and out-of-scope question rather than guessing) |
| 6 | **open questions as typed markers carrying the question text**, blocking promotion until answered | Spec Kit (`[NEEDS CLARIFICATION: specific question]`, plus a checklist item that none remain) |
| 7 | each success claim with the oracle that will settle it | ours already; Spark stores goals and metrics in the spec and reads them back at 7, 14 and 30 days |
| 8 | **citations at claim level: the quoted span plus a location that resolves back to it** | Anthropic Citations API (`cited_text` with a char, page, or block range) |
| 9 | **state from a closed vocabulary the system moves**, derived from the last thing that happened | Linear agent sessions (six states, inferred from the last emitted activity, never self-declared) |
| 10 | **health as a signal that decays when nobody speaks**: On track / At risk / Off track, and an explicit missing-update state | Linear initiative and project updates (staleness marks a project when the last update was On Track and one is overdue) |

**Tier 2**: sequencing edges (`Blocked by` / `Blocking`, each able to read *violated*) · milestone
order, independent of whether any milestone has a date · capacity read from the trailing three
cycles rather than from anyone's opinion · progress that starts counting when work *starts*, not
only when it completes · a scope line that rises when scope is added · version history with revert ·
release bucket in the Now / Next / Later family · exactly one lead.

**Tier 3, focused pane only**: the agent's evolving step list · the thought and action stream with
each action's result · what the draft was grounded in (Spark reads the codebase before writing) ·
superseded clauses, kept resolvable · and the divergence between the snapshot taken when a cycle
closed and the live list, which Linear documents rather than hides.

> **The finding that most changes our build: the market's planning surfaces carry a citation
> *count*, and its AI surfaces carry a citation *pointer*, and only the pointer survives being
> questioned.** Anthropic's model returns the cited sentence itself and a resolvable range into the
> source, and states that the extracted span is a guaranteed valid pointer to the document rather
> than something the model wrote. Our `ProjectionSource` is `{ label: string }`. A label is a claim
> that a source exists. **Plan's specs are read by the next agent and by Learn six months later, so
> a citation that cannot be resolved to a span is a footnote, not evidence.**

## The verb set

`[L]` Linear · `[P]` Productboard · `[S]` Spark · `[B]` Basecamp / Shape Up · `[K]` Spec Kit ·
`[A]` Anthropic Citations. Marked verbs are lifted close to literally, including the name.

| Verb | Required effect on the data |
| --- | --- |
| Slice `[B]` | adds a named scope to the spec. A scope may exist with **no tasks under it yet**, and that is a real state meaning "work known to exist, not yet discovered", not an empty list |
| Split a scope `[B]` | when one slice cannot be described as uphill or downhill because parts of it differ, it must break into slices that move independently. **Stuck is sometimes a boundary error, not a work problem** |
| Move on the hill `[B]` | records the position and a timestamp, so the second-order view (is this moving?) exists. A slice that has not moved reads as stuck **without anybody having to say so** |
| Set a timeframe `[L]` | writes a date *and its granularity*. A quarter is stored as a quarter and never rendered as a day |
| Blocked by / Blocking `[L]` | a typed edge, not a note. When the blocker resolves, **the edge demotes itself to `Related` automatically** rather than sitting there as a stale flag |
| Flag violated `[L]` | computed, not entered: a dependency whose dates now contradict the order reads red on sight, and is filterable as a class |
| Order milestones `[L]` | drag order is meaningful **with or without dates**, which is what lets sequencing exist before scheduling does |
| Promote a milestone `[L]` | a milestone that outgrew itself converts into its own project, and the properties it carries over are suggested from its content |
| Bucket `[P]` | assigns to a Now / Next / Later style container. Productboard's own guidance is to keep the near term granular and go broader further out, and **to avoid committing to narrow timeframes beyond the short term** |
| Mark clarification needed `[K]` | writes a typed open question with the question spelled out. The rule is stated as *do not guess*: an unspecified thing is marked, never assumed |
| Answer a clarification `[K]` `[S]` | resolves one marker, and the answer is attributed to the person who gave it. Promotion out of draft requires the set to be empty |
| Steer `[S]` | injects an instruction into a run in flight, redirecting the draft **without stopping and restarting it** |
| Queue `[S]` | holds the next message until the current turn ends, so typing is not an interrupt |
| Accept / reject an edit `[S]` | per-change, on the agent's highlighted diff into the document. **Ours must not expire, see the anti-patterns below** |
| Revert `[S]` `[L]` | version history on the document, and on Linear's side an update stream that records property changes (target date, lead, milestones) alongside the prose |
| Post an update `[L]` | one health word from a closed set plus prose. Silence is a state the system reports on its own |
| Cite `[A]` | attaches a span and a resolvable location to a specific sentence, not to the document |
| Hand off `[S]` | exports the spec to the tracker while **the spec stays the live source**, rather than the copy in the tracker becoming the truth |

## The four questions, answered

### 1. Scope without a Gantt chart

Three mechanics, and each one removes a reason to draw bars.

**Scope is a line, not a set of bars.** Linear's cycle graph draws total scope as its own line
against a target line, so **work added mid-cycle is visible as the scope line rising** rather than
as everything silently reflowing. Scope is measured in estimate points where estimates are on and
falls back to issue count where they are not, which is the honest degradation: the surface still
works when nobody estimates.

**Precision is a property of the date, not of the renderer.** Linear stores a timeframe at the
granularity you chose, and Productboard sizes a timeline card to at least one full unit of the
timeline's own interval, so an item cannot be drawn looking more precise than the plan is. A Gantt
chart's real defect is not the bars, it is that every bar claims day-level precision it does not
have.

**And the strongest answer refuses counting entirely.** Basecamp's argument is worth restating
because it applies directly to an agent-written plan: a list of tasks with none outstanding is
ambiguous between *finished* and *nobody has found the rest of the work yet*, and to-do lists grow
as a team learns. Estimates cannot express that either, because the same four-hour estimate means
something different on familiar work than on work nobody has done. So the hill chart replaces
percent-done with **position between unknown and known**, per slice. Two further mechanics come with
it and both are ours to take: a dot that has not moved is a raised hand, which lets a person be
stuck without volunteering that they are, and progress is legible at the second order, where the
question is what is moving rather than what is done.

### 2. How a spec shows its citations

**The named class does not answer this and we should stop expecting it to.** Productboard's link
between feedback and a feature is real and already captured in the Discover section, but it points
the other way: it says this item has 40 pieces of evidence behind it. It does not say *this sentence
came from that sentence*.

The two references that do answer it:

**Anthropic's Citations API supplies the data model outright.** Response text is split into blocks,
and any block may carry a list of citations. Each citation carries the quoted span plus a typed
location: a character range for text, a page range for a PDF, or a content-block index for chunks
the caller defined. Four properties of that design are the ones worth lifting.

1. **The span is extracted, not generated.** The docs' own comparison with prompting a model to
   cite says the parsed form is guaranteed to point at the supplied document, which is the whole
   difference between a citation and a plausible-looking reference.
2. **Granularity is a decision made at ingest.** Automatic chunking is by sentence; a caller who
   needs different granularity supplies its own blocks. Our themes, signals and prior decisions are
   already chunk-shaped, so this maps onto the existing model rather than needing a new one.
3. **Some content is readable but not citable.** A document's `title` and `context` are passed to
   the model and explicitly cannot be cited from. That separation is exactly what we need between a
   spec's framing and the evidence under it.
4. **Citations stream with the text.** They arrive as a delta on the block being written, so a
   half-written spec is cited as far as it has been written. There is no uncited draft that gets
   footnoted at the end, which is the state a reviewer cannot judge.

**Spark supplies the product-level claim**, and it is the competitive fact of this pass: its stated
difference from a general assistant is that every output traces back to the feedback or signal
behind it and can be verified before anyone acts on it, and that a spec is grounded in the codebase
so it does not contradict how the product already works. **The gap left open is that grounding is
described as a property of the whole document, not as a pointer on a line.** That is the seam.

### 3. Sequencing

**Linear expresses order as a constraint graph and a rank, and dates are downstream of both.**
Milestones are ordered by dragging and a date is optional, so a plan can be fully sequenced before
it is scheduled at all. Issue relations are typed (`blocked`, `blocking`, `related`, `duplicate`),
and the mechanic worth copying most exactly is that **a blocking relation demotes itself to
`related` once the blocker resolves**: the constraint disappears when it stops being true, without
anyone tidying up. Project-level dependencies then add the computed half: a dependency line reads
blue when it holds and **red when it has been violated**, violation is a filter, and dragging a
project bumps the backlog and planned work downstream of it while a modifier holds the chain still.

Cycles add the automatic behaviour: unfinished work rolls into the next cycle on its own, backlog
and cancelled work does not, and there is no way to keep unfinished work sitting in a closed cycle.
Capacity on a not-yet-started cycle is a dial computed from the last three completed cycles, or from
team size when there is no track record yet, which is the right shape for a number the product
asserts rather than asks for.

**Shape Up supplies what Linear deliberately does not: which unknown to attack first.** The rule is
three tests on a candidate first slice, and they are already in imperative form. **Core**, meaning
the rest of the work is meaningless without it. **Small**, or carving it off buys nothing.
**Novel**, so it eliminates uncertainty rather than adding finished work. The reasoning behind it
transfers directly to an agent plan: routine work expands to fill whatever time it is given, while
genuinely unknown work is where the schedule actually breaks, so the scariest slice goes first and
the screw-tightening goes last.

### 4. What a spec looks like while an agent is still writing it

**Linear's Agent Session and Agent Activity API is the most complete published model of this state,
and it is a specification rather than a screenshot.** What to lift:

- **Six session states, and the agent does not set them**: `pending`, `active`, `error`,
  `awaitingInput`, `complete`, `stale`. Linear derives the state from the last activity emitted.
  A surface that asks an agent to declare "I am working" has a second source of truth for the one
  fact a reader most needs.
- **Five activity types with fixed shapes**, validated server-side and rejected when malformed:
  `thought`, `elicitation` (it needs an answer), `action` with `action` / `parameter` / an optional
  `result`, `response` (terminal), `error`. **An action that has started and an action that finished
  are the same object with the result filled in**, which is why a run reads as a history rather than
  as a log of two half-related events.
- **A user's message is a type the agent cannot produce.** `prompt` activities are user-generated
  only. Attribution is enforced by the schema, not by convention.
- **The activity stream is the readable record, and comments are not.** The best-practices page says
  outright to reconstruct a conversation from activities rather than comments, because comments are
  editable and may have changed, while activities are frozen at the time they were written.
  **That is our own doctrine arriving from somebody else's API docs: what was believed at the moment
  of the call only exists if something wrote it down then, in a form that cannot be edited
  afterwards.**
- **Ephemeral is a property of the cheap activity types only.** `thought` and `action` may be marked
  ephemeral and replaced by whatever comes next; `elicitation`, `response` and `error` may not. The
  transient half of a run is allowed to disappear and the load-bearing half is not.
- **The plan is a checklist that is expected to change.** The Agent Plan API (technology preview)
  holds an array of steps with `pending` / `inProgress` / `completed` / `canceled`, and the agent is
  expected to add, change and remove entries as it discovers work. **Discovery is modelled as normal
  rather than as plan failure**, which is the same point the hill chart makes about growing to-do
  lists.
- **Two timers, and both are about the reader.** A first activity within 10 seconds or the session
  shows as unresponsive; 30 minutes without one and it goes stale, recoverable by emitting anything.
  Waiting is never left unexplained.
- **Uncertainty resolves into a question, not a percentage.** `issueRepositorySuggestions` returns
  ranked candidates with confidence scores, and the documented behaviour is to proceed when
  confident and otherwise send the short list back as an elicitation. Note this does not contradict
  the Discover finding that nobody scores a cluster: the score here is on machine-checkable set
  membership, and it is spent on choosing between asking and proceeding rather than shown as a
  number for the reader to argue with.

**Spark shows the same problem solved inside a document rather than a session.** The agent's edits
land in the spec highlighted for accept or reject; version history reverts; a message can be queued
or injected mid-turn with **Steer**; and a thread badge distinguishes *there is something new* from
**waiting on you**, in orange. Chats carry the agent's reasoning under each prompt so a reader can
see what the draft was built from.

**Spec Kit answers the narrower question of what the half-written spec says about its own holes**,
and the answer is a typed marker with the question written into it, backed by a rule that the model
must mark rather than assume, and a completeness checklist whose first item is that no markers
remain. It also separates the artifacts by what they are for: the spec holds what and why, the plan
holds how, and detail that would drown the plan is pushed into companion files. Its gate mechanic is
worth noting for our Decide station too: a failed simplicity gate does not block, it demands a
written justification.

## What these products get wrong for an agent-operated product

Anti-patterns. Do not copy them.

1. **Spark's un-answered edits are accepted for you, and the highlights do not survive a reload.**
   Its own limitations section states that changes not accepted or rejected are accepted
   automatically, and that highlights persist only for the current browser session. **This is the
   single worst pattern found in the pass**, because it converts "I have not looked yet" into "I
   approved this", and then removes the evidence that the sentence came from an agent at all. Under
   our canon an unreviewed agent edit stays attributed forever; the fallback for silence is
   *unreviewed*, never *approved*.
2. **Spark's chats are private and cannot be shared, while the documents are shared.** So the
   collaborative artifact is the spec and the reasoning that produced it is the one thing nobody
   else can read. The reasoning is the part Learn needs.
3. **The roadmap is a view and the truth is elsewhere.** Productboard's own guidance is to edit on
   grid boards and use roadmaps for alignment. That is a sound answer for a human tool and the wrong
   one here: if the plan surface cannot be acted on, an agent working the plan is working somewhere
   the reader is not looking.
4. **Health is self-reported by the person with the most incentive to round up.** Linear's health
   word is chosen by the lead. The decay signal is the good half and we take it; the missing half is
   a computed second opinion. **Ours must be able to say the lead says On track and the evidence
   says otherwise**, which is available to us and not to them because we hold the forecast.
5. **Hill position is dragged by hand.** The chart's honesty depends entirely on the person moving
   the dot, and Basecamp says as much: team members with the context drag the scopes into position.
   For an agent-run slice, position must be derived from what the agent has actually closed, with the
   manual drag surviving only as an override that is visible as one.
6. **Cycle rollover carries no reason.** Unfinished work moves to the next cycle automatically, and
   nothing records why it did not finish. That is the cheapest learning signal in the whole station
   and every tool here throws it away.
7. **Fixed vocabularies you cannot extend where extension is the point.** Productboard's release
   statuses are three, unnameable and unremovable; Linear's project dependency supports end to start
   only; the milestone focus marker cannot be turned off even when several run in parallel, per
   Linear's own FAQ. A computed marker a user cannot correct is a small version of the permanent
   priority override the Discover section rejects.
8. **Nobody shows what the plan chose *not* to do, or what it dropped and why.** Non-goals exist as
   a field in several tools and as an interrogation in exactly one (Spark asks). None of them keeps a
   dropped slice resolvable with the reason attached. Same opening as the declined-cluster gap in
   Discover, and the same reason it matters: the record of what was refused is what makes the record
   of what was chosen worth reading.

## What this means for our Plan surface, stated as directives rather than status

Verified from the repo only. Production behaviour is not checked here.

- `src/lib/spec-projections.ts` already carries the right spine: an Outcome Contract of intent,
  success clauses with a proof oracle, non-goals, budget and an ambiguity policy, projected on
  demand into PRD, FRD, status and one-pager views with a drift state of `current`, `stale` or
  `no-contract`, and clauses that can be `superseded` rather than deleted. **The drift chip is the
  same instinct as Linear's staleness marker and it is already better, because it is computed.**
- **`ProjectionSource = { label: string }` is the gap this research names most sharply.** Numbered
  `[n]` markers already exist in the PRD and FRD projections; what is missing is the span and the
  resolvable location behind each number. Anthropic's three location types are the shape to copy.
- **The `ambiguity policy` field on the contract is our `[NEEDS CLARIFICATION]` and should be
  rendered as one**: each open question spelled out on the spec, blocking promotion, answered by a
  named person, and never silently assumed.
- **Nothing in the current model expresses a slice's position between unknown and known.** Percent
  complete and status are both downhill-phase instruments. This is a Meridian question as much as a
  data one, since it needs a token for a two-phase axis and none exists.
- The verbs to add first, in the order the research argues for: mark clarification needed, split a
  slice, and record the reason a slice moved out of a cycle.

## Sources

Linear: [Projects](https://linear.app/docs/projects) ·
[Cycles](https://linear.app/docs/use-cycles) ·
[Cycle graph](https://linear.app/docs/cycle-graph) ·
[Project milestones](https://linear.app/docs/project-milestones) ·
[Issue relations](https://linear.app/docs/issue-relations) ·
[Project dependencies](https://linear.app/docs/project-dependencies) ·
[Initiative and Project updates](https://linear.app/docs/project-updates) ·
[Developing the Agent Interaction](https://linear.app/developers/agent-interaction) ·
[Interaction Best Practices](https://linear.app/developers/agent-best-practices).
Productboard: [Productboard Spark](https://support.productboard.com/hc/en-us/articles/44571897288723-Productboard-Spark) ·
[Plan releases to decide what to deliver when](https://support.productboard.com/hc/en-us/articles/360058214113-Plan-releases-to-decide-what-to-deliver-when) ·
[Timeline boards](https://support.productboard.com/hc/en-us/articles/25194944993939-Timeline-boards-Flexible-time-based-roadmaps) ·
[Quick start guide: Roadmaps](https://support.productboard.com/hc/en-us/articles/29983922254739-Quick-start-guide-Roadmaps) ·
[Time horizons](https://support.productboard.com/hc/en-us/articles/4403428374675-Time-horizons-Snap-timeline-cards-to-weeks-months-or-quarters) ·
[Track progress on roadmaps](https://support.productboard.com/hc/en-us/articles/4573645378707-Track-progress-on-roadmaps).
Basecamp: [Shape Up, Show Progress](https://basecamp.com/shapeup/3.4-chapter-13) ·
[Shape Up, Get One Piece Done](https://basecamp.com/shapeup/3.2-chapter-11).
GitHub: [Spec Kit, spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md) ·
[Spec Kit docs](https://github.github.com/spec-kit/index.html).
Anthropic: [Citations](https://docs.claude.com/en/docs/build-with-claude/citations).

Content was rephrased for compliance with licensing restrictions.

---

# SHIP: making the one call that cannot be undone feel safe rather than fast

Researched 2026-08-20 against official product documentation. **Structural insight: nothing in this
market treats shipping as an event. Every one of them treats a release as an object with a
lifecycle, and the promote is one transition inside it.** That is the difference that matters for
our surface, because Ship currently models a release as a row that either has a production address
or does not, and every question the brief asks turns out to be a question about a state the object
does not yet have.

The second finding is a correction to the named class. **Changelog and release-notes tooling answers
the last third of this station and none of the first two thirds**, and the reference that answers
the rest shipped four months ago: Linear added Releases on 2026-04-30, and its own framing is the
sentence this station needs, that an item being Done does not mean it reached customers. Reading it
is not optional, since it is the nearest thing in the market to what Ship is supposed to be.

## Verdict on the named class first, and one question needs its premise corrected

| Question | Does changelog and release-notes tooling answer it? | What actually answers it |
| --- | --- | --- |
| 1. Blast radius before the click | **No.** A changelog tool starts after the thing is live; its subject is the audience, not the risk. LaunchNotes' cohorts are the one part that is about blast radius, and it is the blast radius of the *announcement* | **Vercel Rolling Releases** (blast radius as a number you set rather than a thing you estimate) · **GitHub environment protection rules** (blast radius as the environment a job references) · **Linear Releases** (blast radius as the set of work items in it) · **GitHub Releases** (the comparison range is chosen, never inferred) |
| 2. How a flag-gated rollout is expressed | **No, and the question needs restating.** See the note below: nothing in this product serves two variations of itself to customers, so a percentage rollout is not expressible on the substrate we have | **Statsig Release Pipelines** is the cleanest published model of a phased release with a gate per phase · **LaunchDarkly guarded rollouts** add the metric as the gate · **Vercel stages** add the traffic fraction |
| 3. Green deploy, gate still closed | **No.** | **LaunchDarkly flag statuses** and **Statsig's gate lifecycle**, which both derive the answer from runtime evaluation and never from the configuration · **Sentry release health**, where adoption is a separate number from deployment · **Linear's status automations**, which move an item on release completion rather than on merge |

**The premise correction, stated plainly because a recommendation built on it would be a claim
outrunning its wiring.** There is a `feature_flags` table in this product and it is an operator kill
switch, not a customer release gate: `src/lib/ai/supersession.server.ts` reads it through the
`get_flag` RPC so one SQL statement can turn a mechanic on without a redeploy, and
`/admin/platform` is the only surface that lists flags. Its payload field is even placeholdered as
`{"rolloutPct":10}`, which is the shape of a rollout percentage and has no evaluator behind it.
Ship's own deploy path promotes a whole app to one production address, so there is no second
variation for a fraction of traffic to reach. **So question 2 is answered here in the form the
substrate can carry, which is phases across environments rather than fractions of traffic, and
question 3 is answered as "the deploy landed and nothing says it is reaching anyone", which is the
same problem with the evaluation half removed.** The percentage form is kept as ROADMAP in the
directives at the end.

## The merged information model for one release

**Tier 1, the release is not usable without these**

| # | Field | Lifted from |
| --- | --- | --- |
| 1 | **the contents: the set of work items this release delivers, resolvable in both directions** | Linear Releases (a release is a name, a commit SHA and a set of issues; an item shows its release in its own sidebar, and items are filterable by release, stage or pipeline) |
| 2 | the commit, plus **the commit it is being compared against, chosen rather than inferred** | GitHub Releases (a previous tag is selected when drafting, which fixes the range the notes describe) |
| 3 | **the pipeline it belongs to, typed continuous or scheduled**, with an owning team | Linear release pipelines (one pipeline per product and environment combination, with path filters deciding which commits belong) |
| 4 | deploy status from a closed vocabulary, **held separately from whether anything is reaching users** | LaunchDarkly flag statuses (derived from requests received, not from configuration) · Sentry (adoption is its own number) |
| 5 | **the previous release this one can return to, named before the promote rather than after** | Vercel Instant Rollback (the dialog shows the current production deployment and the eligible ones to return to) |
| 6 | the share of traffic currently served, where a product serves more than one build at once | Vercel stages (each stage is a larger fraction, the last is always 100%) |
| 7 | **the metrics being watched, chosen before the rollout starts and stored on the release** | LaunchDarkly guarded rollouts · Statsig safeguards (an alert is attached to a targeting rule, with an action) |
| 8 | health after the fact: crash-free rate, and **adoption as a share of sessions on this version** | Sentry release health (healthy, crashed, errored, abnormal, plus adoption stage markers on the graph) |
| 9 | **who caused it**, and for a gated release who let it through | Vercel and GitHub both record the actor; GitHub's reviewing-deployments flow records the approval and the bypass |
| 10 | **the configuration frozen at the moment of the promote** | Vercel (every promotion snapshots the project configuration, and later changes apply only to future releases, never to one in progress) |

**Tier 2**: draft and pre-release as two independent flags, since one means not published and the
other means published and not stable · the latest label as a separate act from publishing · notes
generated from the item set with a template chosen per pipeline · a changelog assembled
chronologically from those notes · abort as a first-class resolution distinct from rollback · soak
time per phase · a deploy marker written onto the time series so later charts can be read against it
· rollback detection, meaning the platform notices when the version now serving is one that served
before · the announcement's audience.

**Tier 3, focused pane only**: per-metric monitoring with the confidence interval and the number of
contexts served at each point · a version-to-version comparison against the immediately previous
version · adoption stage change markers on the release graph · code references, so the release can
say whether the old path is still in the codebase · assets attached while the release is still a
draft, before it becomes immutable · the escape hatch for reaching a stage serving zero percent.

> **The finding that most changes our build: every product here separates "deployed" from
> "delivered", and not one of them writes down what the team expected before the release went
> out.** LaunchDarkly and Statsig come closest, because the metrics and thresholds a guarded rollout
> watches are chosen before it starts, which is a forecast in everything but the name. Neither keeps
> the claim after the rollout resolves: the threshold is a control that fires and then stops being
> interesting. **Our contract's standing success clauses are exactly that claim, they already exist
> at promote time, and nothing attaches them to the release.** That is the seam, and it is the same
> seam the Plan section found in a different shape.

> **The second finding, and it is the answer to "how do you make an irreversible act safe".** Not one
> of these products answers with a heavier confirmation. Three mechanics do the work instead:
> **make it partial** (a fraction, a phase, one environment), **freeze what it is about** so the
> thing being decided cannot change underneath the decision, and **name the way back before the way
> forward**. Vercel puts all three in one paragraph: the config snapshots at promotion, only one
> rolling release may be in flight at a time, and the rollback target is shown in the promote dialog.

## The verb set

`[L]` Linear Releases · `[V]` Vercel · `[G]` GitHub · `[LD]` LaunchDarkly · `[ST]` Statsig ·
`[S]` Sentry · `[D]` Datadog · `[LN]` LaunchNotes. Marked verbs are lifted close to literally,
including the name.

| Verb | Required effect on the data |
| --- | --- |
| Promote `[V]` `[L]` | points the production address at an existing build rather than rebuilding it. Vercel keeps this **separate from the endpoints that start and complete a staged rollout**, on the stated ground that each step in a pipeline should have one explicit purpose |
| Advance `[V]` | moves to the next stage, which must serve a larger fraction than the current one. The final stage is full promotion, and reaching it ends the release's in-flight state |
| Extend `[LD]` | when too few contexts have been served to judge, **the current stage extends itself instead of advancing**. Waiting is a computed outcome, not a person forgetting |
| Abort `[V]` | resolves the release without shipping it. **A distinct verb from rollback**, because one ends an attempt and the other undoes an arrival |
| Roll back `[V]` | reassigns the address to a previous build with no rebuild. Two consequences that must be said out loud: **configuration is not rebuilt with it**, and the project stays in a rolled-back state where the next push does not replace what is serving |
| Return to it `[V]` | a rolled-back release stays in the list, marked and disabled, and can be rolled back to again. **Nothing is deleted by being undone** |
| Freeze `[L]` | stops new work items being added to a stage that has started. The contents of a release stop moving before the release does |
| Require review `[ST]` | a phase does not begin until an authorised person approves it, and **a phase may carry both a review and a timer, where the timer only starts counting after the approval** |
| Soak `[ST]` / Wait `[G]` | time as the gate. GitHub's wait timer is an integer count of minutes up to 43,200, and the waiting job reads as Waiting rather than as running |
| Guard `[LD]` `[ST]` | attaches metrics to the release before it starts, with an action on regression: pause, roll back to zero, or notify. **The threshold is written down before the outcome is known** |
| Bypass `[G]` | forces pending work past a protection rule. Available, and recorded |
| Generate notes `[G]` `[L]` | GitHub assembles merged pull requests, contributors and a full-changelog link; Linear generates from the item set of one release, or a range of releases on a continuous pipeline, with the format set per pipeline |
| Draft, then publish `[G]` | assemble everything while it is still a draft, because publishing is the point after which it cannot be edited. **The recommended order exists because the act is irreversible**, which is exactly this station's problem |
| Mark pre-release `[G]` | published and explicitly not stable. Orthogonal to draft, and the two are routinely confused |
| Set as latest `[G]` | a separate decision from publishing, defaulting to semantic version order when nobody makes it |
| Mark the deploy `[D]` | writes the version onto the time series, so every later chart can be read against the moment it changed |
| Compare versions `[D]` | this version against the immediately previous one by default, any two within a window on request |
| Detect a rollback `[D]` | the platform notices that the version now serving is one that ran before, without anyone declaring it |
| Send to a cohort `[LN]` | targets named groups of subscribers directly, on top of whoever subscribed to the category |
| Retire the gate `[LD]` `[ST]` | a flag with no evaluation traffic, no code references and enough age is offered for archive; a retired Statsig gate returns false and stops charging for exposures |

## The three questions, answered

### 1. How a release's blast radius is shown before the click

Four mechanics, and the useful thing is that they are four different definitions of blast radius.
Our station needs the first and the fourth, and cannot express the second.

**Blast radius as the contents.** Linear's release is a name, a commit and a set of work items, and
membership is decided by path filters over the commits rather than by anyone remembering to attach
anything. That makes "what is in this" answerable at the moment of the decision, which is the
question a person actually asks before promoting. **Ship's promote gate today quotes the preview
address, the merge time and the cost sentence, and says nothing about contents.** The parts are on
the same screen: `listAppliedChanges` returns a real file count derived from `studio_changes` rows,
and the linked spec carries standing non-goals. The release document assembles all of it and renders
it one region below, which is after the click rather than before it.

**Blast radius as a fraction.** Vercel's answer is that you do not estimate it, you choose it: a new
production deployment serves a configured share of visitors, the rest keep the previous one, and the
release stays there for as long as you want while you compare metrics between the two. This is the
strongest answer in the market and it is not available to us, for the reason in the premise note
above.

**Blast radius as the environment.** GitHub expresses it as the environment a job references, and
hangs the protections off the environment rather than off the deploy: required reviewers, up to six
users or teams with only one approval needed, a wait timer, and custom rules that time out after 30
days. **The mechanic worth taking is that the protection is a property of the destination, not of the
act.** A person does not decide each time whether this deploy needs review; they decided once, about
production, which is the difference between policy and permission.

**Blast radius as the range.** GitHub's draft flow asks which previous tag to compare against, so
what the release claims to contain is a decision rather than an inference. Combined with immutable
releases, where the guidance is to draft first, attach everything, and only then publish, the whole
shape is: assemble while it is still cheap to change, and make the irreversible step the last and
smallest one.

### 2. How a flag-gated rollout is expressed

**Statsig Release Pipelines is the model to lift, because it is a phase list where every phase
carries its own gate and the gates are of exactly three kinds: a person, a clock, or a metric.** A
pipeline is a named object holding one or more phases; each phase has release rules, a required
environment, and optional condition targeting; and a phase's transition is Require Review, a time
interval, or both, with the timer starting only once the approval lands. A pipeline with a rollout in
flight cannot be edited until that rollout completes or is aborted, which is the same
freeze-the-decision instinct Vercel expresses as a config snapshot.

LaunchDarkly supplies the metric gate. A guarded rollout increases traffic in stages while watching
selected metrics, and a detected regression pauses the release and notifies rather than silently
continuing. Two details are worth copying exactly. **The metrics are attached before the rollout
starts**, so the standard is set while the outcome is unknown. And **a stage that has not served
enough contexts to be judged extends itself** rather than advancing on the clock, which is a
computed "we do not know yet" in a product that could easily have shrugged and moved on.

Vercel supplies the traffic gate and one hard-won lesson about it: a stage configured at zero percent
is not hidden. Anyone can force themselves onto the canary with a query parameter, and the docs say
so outright. **A rollout stage is not an access control**, and a surface that implies otherwise is
selling a permission it does not hold.

**What this means for a product that deploys one build to one address.** The phase list survives, the
percentage does not. Our `deployments.environment` column already carries preview, staging and
production, and the live workspace holds rows in all three, so a release can be expressed as an
ordered walk across environments with a gate per step. The three gate kinds all map onto things this
product has: a person is the existing `Approve` on the promote, a clock is expressible, and a metric
is the spec's own success clause with its proof oracle. That is a phased release without a flag
evaluator, and it is honest about what it is.

### 3. What the surface says when the deploy is green and the gate is still closed

**The whole market answers this the same way, and it is a discipline rather than a feature: the
answer is derived from runtime evidence, never from the configuration.**

LaunchDarkly's flag statuses are the sharpest version. New, active, launched and inactive are not
configuration states: inactive means the flag is over seven days old and has not been requested in
the last seven days, and launched means requests are arriving, it is serving one variation, and
nothing has been reconfigured for a week. **A flag that is switched on and never evaluated does not
read as on.** Statsig's gate lifecycle draws the same line from the other end: a gate nobody
evaluates stops producing exposure events, and that silence is what marks it safe to remove from the
code.

Sentry separates the same two facts for a deployed build. A release has a version and an
environment, and adoption is a separate measurement, the share of sessions occurring on that
release, with adoption stage changes drawn as markers on the release graph. Deployed and adopted are
different numbers, and the health chart is read against the marker rather than against the calendar.

Linear says it in product terms and its recommended automation is the one to copy: set the Git
automation to move an item into a started status called Merged when the pull request merges, and let
the release completing be what marks it done, so downstream integrations fire when the change is
available to customers and not when the code landed. **The status that means "shipped" is written by
the release, not by the merge.**

**Ours, and the seam.** `pickProductionDeploy` in `src/components/ship/WhatShipped.tsx` already
refuses anything looser than environment production and status success, and its header explains why
in exactly these terms: a failed rollout announced as live is the defect. `whereItIs` then spends
eleven separate sentences keeping "an address a person can open" apart from "a status a provider
reported", including one for a production deploy that succeeded and recorded no address. **That is
the right instinct already built.** What none of it can say is whether anyone is arriving. The
smallest honest addition is not a metric: it is a check that the production address answers, which is
this substrate's version of an evaluation signal, and it is the difference between "we deployed it"
and "it is serving".

## What these products get wrong for an agent-operated product

Anti-patterns. Do not copy them.

1. **A one-click undo that undoes only part of the change.** Vercel's Instant Rollback reassigns
   domains rather than rebuilding, and the docs note that things like environment variables are not
   rebuilt with it. So the code returns and the configuration does not. **The most dangerous control
   in the whole set is the one labelled as a complete reversal that is a partial one**, and a surface
   offering it owes the sentence saying which half comes back.
2. **A rollback quietly changes what the next push does.** Taking Vercel's rollback turns off
   automatic assignment of production domains and leaves the project in a rolled-back state until
   somebody promotes again. That is a policy change made by an incident-response click, and it is
   documented rather than surfaced. Under our canon a default the user never set has to be visible
   and changeable.
3. **The named-reviewer queue, with a bypass instead of a policy.** GitHub's required reviewers is up
   to six people of whom one must approve, a job waits in Waiting for as long as 30 days before
   failing, and the pressure valve is a documented force-through. **That is the approvals queue our
   governance ruling rejects**, and the bypass proves it: the queue was never the safety mechanism,
   it was the thing people learned to route around.
4. **Timers standing in for evidence.** A wait timer is a guess about when the signal arrives, and
   the numbers in this market give the guess away: GitHub's timer is minutes, while Statsig's own
   recommendation for watching topline metrics after a rollout is on the order of a fortnight. A
   soak short enough to tolerate is too short to be evidence, so a timer should gate *attention*,
   never conclusions.
5. **The forecast is spent and thrown away.** The threshold on a guarded rollout is the most valuable
   artifact in these products and it exists only as a trigger. Once the rollout resolves, nothing
   holds what was expected next to what happened. Every one of these tools could tell you the
   release was fine and none of them can tell you whether anyone was right.
6. **Generated release notes describe the diff, not the reason.** GitHub assembles merged pull
   requests and contributors; Linear generates from the item set. Both are lists of what changed.
   **Nothing in the class generates a release note from the specification it was built against**,
   which is what makes a note worth forwarding to someone who was not in the room.
7. **The changelog is organised by build process.** Linear's changelog is per pipeline, which is
   correct for a team watching its own deploys and wrong for a customer, who does not know that iOS
   nightly and the web app are different pipelines. A public stream has to be assembled per product.
8. **A rolled-back release carries no reason.** Datadog will detect that a rollback happened by
   noticing the version now serving ran before, which is a good computed fact with the interesting
   half missing. **Why it was rolled back is the cheapest learning signal on this station** and
   nothing in the class keeps it. Same gap as the cycle-rollover reason in the Plan section.
9. **A stage serving nobody is treated as hidden.** Vercel is honest that a zero percent canary is
   reachable by anyone who sets a query parameter. The anti-pattern is not the cookie, it is the
   temptation to describe a rollout stage as if it controlled access.

## What this means for our Ship surface, stated as directives rather than status

Verified from the repo only. Nothing here was checked against production, and each directive is
tagged for how much wiring it needs: **PROVEN** means every row it reads is already read on this
station, **WIRING** means a column or an edge has to exist first, **ROADMAP** means the substrate is
not there at all.

**The constraint every directive below obeys.** AGENTS.md records that the signal to shipped to
learned chain is broken at Build, which writes no changeset or deployment edges. The map in
`src/lib/spine/attach.ts` does declare both, `studio.stage` to `studio_changesets` and
`release.publish` to `deployments`, and the note beside it records a 2026-08-20 measurement that
`spine_track_members` holds no ship row of any kind and that `release.publish`, pinned to review so
a call always leaves an approval row, has never raised one. **So the edge is declared and has never
carried a release.** The two statements disagree on paper and agree in effect: no recommendation here
assumes a deploy lineage exists, and every one that would need it is tagged WIRING or ROADMAP.

- **PROVEN. Move the contents above the Approve.** `gate-order-is-an-invariant.test.tsx` already
  pins the shape this needs, that a gate asks, then shows its reasons through `lines`, then offers
  the control, and it pins all four of this station's gates to that order. Adding the file count from
  `listAppliedChanges` and the spec's standing non-goals to the promote gate's `lines` is additive
  and cannot violate it. The reference is Linear's release contents plus GitHub's chosen comparison
  range: **before an irreversible click, the surface should say what is in the thing, not only where
  it is and what it will cost.**
- **PROVEN. Name the way back before the way forward.** Vercel's promote dialog shows the deployment
  currently serving and the ones eligible to return to. `releaseStates` is sorted newest release
  first and every live release carries `productionUrl` and `productionAt`, so the release the
  rollback would land on is a fact this station holds and never states.
- **PROVEN. Say who promoted it.** `deployments.triggered_by` has three writers (`"promote"` in
  `deployments.functions.ts`, `"ci-poll-tick"` in the hook, and an agent value through
  `lib/deployments.ts`) and no reader on any surface. The release document's sign-off section shows
  only the design gate, so the document whose whole claim is that every line traces to a row is
  silent about the one act on this station that reaches customers.
- **PROVEN. Give a rollback a state on the release.** `rollbackRelease` is an intent: it stages the
  inverse changeset and opens a run that still has to clear its gates. Nothing on the release rows
  changes when it is taken, so `whereItIs` keeps reading "In production" and the release document
  keeps saying it is live at that address. Vercel's model is the lift and it is the gentle one:
  **the rolled-back release stays in the list, marked, and remains something you can return to.**
- **WIRING. A release needs contents, plural.** `changelog_entries` carries one `prd_id` and one
  `changeset_id`, so "what shipped in this" cannot be answered for more than one item, and the
  release document's own gap list already says out loud that a release not linked to a spec cannot
  state what it promised. Linear's release-to-item set is the shape, and path filters are how
  membership is decided without anyone attaching anything by hand.
- **WIRING. Snapshot the promise at promote time.** Vercel snapshots project configuration at
  promotion so a change made later cannot apply to a release already in flight. Our equivalent is
  the spec's standing success clauses, and `standingClauses` in `WhatShipped.tsx` already reads
  exactly the right set for exactly the right reason, that a superseded clause is a metric the team
  walked away from. **Copying those clauses onto the release at the moment of the promote is what
  lets Learn grade against what was promised then rather than against the contract as it later
  stands**, and it is the one directive here that is about the moat rather than about the station.
- **WIRING. Separate deployed from reaching anyone.** Adoption in Sentry's sense needs sessions we do
  not collect, but the weaker form is available: a check that the production address answers, stored
  next to the deploy row. That single field is what turns "a production deploy succeeded" into "it is
  serving", and it is the substrate's nearest equivalent to a flag status derived from evaluation
  traffic.
- **ROADMAP. Phases with a gate per phase.** Statsig's pipeline of phases, each gated by a person, a
  clock or a metric, with the clock starting only after the approval, expressed over our existing
  preview, staging and production environments rather than over traffic fractions. It needs a phase
  object that does not exist. This is also where the station's policy story lands: **the gate belongs
  to the destination, the way GitHub hangs protection rules off an environment, so a person sets it
  once about production instead of being asked every time.**
- **ROADMAP. Guarded progression.** Metrics attached before the release starts, a regression pausing
  it, and a stage that extends itself when too little has been observed to judge. Every part of this
  needs the observation half first.
- **ROADMAP. Traffic fractions and variation serving.** Recorded so nobody designs it twice: this
  product promotes one build to one address, so a percentage rollout is not expressible and should
  not be drawn on a surface as though it were.
- **The verbs to add first, in the order the research argues for:** name the contents at the gate,
  name the rollback target at the gate, and record the reason a release was rolled back.

## Sources

Linear: [Releases](https://linear.app/docs/releases) ·
[Releases changelog entry](https://linear.app/changelog/2026-04-30-releases) ·
[linear-release CLI](https://github.com/linear/linear-release).
Vercel: [Rolling Releases](https://vercel.com/docs/rolling-releases) ·
[Instant Rollback](https://vercel.com/docs/deployments/instant-rollback) ·
[Promoting a deployment](https://vercel.com/docs/deployments/promoting-a-deployment) ·
[Rolling back a production deployment](https://vercel.com/docs/deployments/rollback-production-deployment).
LaunchDarkly: [Guarded rollouts](https://launchdarkly.com/docs/home/releases/guarded-rollouts) ·
[Managing guarded rollouts](https://launchdarkly.com/docs/home/releases/managing-guarded-rollouts) ·
[Setting up contexts for guarded rollouts](https://launchdarkly.com/docs/home/releases/context-kinds) ·
[Flag statuses and lifecycle stages](https://launchdarkly.com/docs/home/flags/flag-status) ·
[Code references](https://launchdarkly.com/docs/home/flags/code-references) ·
[List feature flag statuses (API)](https://launchdarkly.com/docs/eu-docs/api/feature-flags/get-feature-flag-statuses).
Statsig: [Create and manage Release Pipelines](https://docs.statsig.com/release-pipeline/create-and-manage/) ·
[Safeguards overview](https://docs.statsig.com/feature-flags/safeguards-overview) ·
[Create a Safeguard](https://docs.statsig.com/feature-flags/safeguards-create) ·
[Managing Feature Gate lifecycles](https://docs.statsig.com/feature-flags/feature-flags-lifecycle).
GitHub: [Managing releases in a repository](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository) ·
[Automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes) ·
[Deployments and environments](https://docs.github.com/en/actions/reference/deployments-and-environments) ·
[Reviewing deployments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments) ·
[Custom deployment protection rules](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/configuring-custom-deployment-protection-rules).
Sentry: [Release Health](https://docs.sentry.io/product/releases/health/) ·
[Release Details](https://docs.sentry.io/product/releases/release-details/) ·
[Session Health](https://docs.sentry.io/product/insights/frontend/session-health/).
Datadog: [Deployment Tracking](https://docs.datadoghq.com/tracing/services/deployment_tracking/) ·
[Automatic Faulty Deployment Detection](https://docs.datadoghq.com/watchdog/faulty_deployment_detection/) ·
[Rollback Detection](https://docs.datadoghq.com/continuous_delivery/features/rollbacks_detection/).
LaunchNotes: [Organizing announcements and roadmap items](https://help.launchnotes.com/en/articles/5125625-how-do-i-organize-announcements-and-roadmap-items-to-match-my-product-structure) ·
[Sending announcements to a specific group of subscribers](https://help.launchnotes.com/en/articles/13975253-how-do-i-send-announcements-to-a-specific-group-of-subscribers).

Content was rephrased for compliance with licensing restrictions.

---

# LEARN: grading a claim that was written down before the outcome was known

Researched 2026-08-20 against official product documentation. **Structural insight: this market
splits in two, and the split is not statistical. An experiment readout settles a question about the
world. A forecast resolution settles a question about the forecaster. Learn has to do both in one
act, and the two halves need different states, different words and different non-answers.** Every
analytics and experiment product researched here does the first and refuses the second on purpose,
and the products that do the second are not product tooling at all.

**This section builds on the seam the Ship section ended on rather than rediscovering it.** That pass
found that every product in the release category separates deployed from delivered, that guarded
rollouts come closest to a forecast because their metrics are chosen before the rollout starts, and
that not one of them keeps the claim after the rollout resolves. Learn is where that claim would be
graded, so the question here is not whether the gap exists. It is what a surface does with a claim it
has kept: which states it needs, what it may not let a person edit, and what has to move when the
claim is settled. **The forecasting platforms have answered all three for twenty years and no product
tool has read their manual.**

## Three premise corrections before anything else, because two of them change what may be recommended

**1. The lesson path has the two edges the brief says it lacks, in the database, and does not have
them in the generated types.** The brief carries K-75's measurement that no product column exists
anywhere on the lesson path. Measured against
[`../../src/integrations/supabase/types.ts`](../../src/integrations/supabase/types.ts) that is still
exactly right: `learnings` carries `prd_id`, `opportunity_id`, `mission_id` and `workspace_id` and no
`product_id` and no `decision_id`, and `agent_memory` carries no `product_id`. The findings register
says the opposite and says it precisely: `learnings.decision_id` and `learnings.product_id` were
added and applied on 2026-08-19 by `20260819181000`, `agent_memory.product_id` by
`20260819182000`, both migrations are in the tree, and the register records the column as
**CLOSED (schema)** with nothing writing it yet. **Both statements are true of different artifacts,
and the disagreement is the finding: the columns exist on the database and are invisible to the type
checker, so code that reads `learnings.decision_id` fails `tsc` today while succeeding at runtime.**
That is the mirror image of the trap section's warning that `tsc` passes a column name that does not
exist. Every directive below that needs either edge is tagged WIRING for that reason, and the first
thing the wiring needs is a regenerated `types.ts`.

**2. A forecast on this product carries no credence, so no Brier score is computable for it.** The
`decisions` table holds `forecast_claim`, `forecast_how_we_will_know`, `forecast_horizon_date`,
`forecast_next_check_at`, `forecast_deferred_at`, `forecast_deferred_count`, `forecast_resolution`,
`forecast_resolution_rationale`, `forecast_resolution_suggestion`, `forecast_resolved_at` and
`forecast_resolved_by_agent_slug`. **There is no column for how likely the team thought it was.**
Meanwhile `insights` carries `claim`, `confidence`, `resolution` and `brier_score`,
`computeBrierScore` in
[`../../src/lib/brain/calibrate-insights.server.ts`](../../src/lib/brain/calibrate-insights.server.ts)
is written and unit-tested against six cases including the clamp and the null fallback, and the
register records `insights.brier_score` among nine columns written by a tick and read by nothing,
calling it the sharpest of the nine. **So the product scores the claims it generates itself and
cannot score the claims a person records, which is the inverse of the arrangement the positioning
argues for.** The forecasting references below are all about the second case, so every
calibration recommendation is tagged WIRING or ROADMAP and names the missing column.

**3. The named class answers one of the brief's three questions and barely touches the other two.**
Amplitude is the right reference for showing a hypothesis against a result and the wrong one for
everything about a track record, because an experiment platform deliberately holds no opinion about
whether the person who wrote the hypothesis is usually right. That is a product decision rather than
an oversight, and the anti-patterns section argues it is the correct decision for them and the wrong
one for us.

## Verdict on the named class first

| Question | Does Amplitude and the experiment-readout class answer it? | What actually answers it |
| --- | --- | --- |
| 1. How a forecast is shown against its outcome | **Partly, and the good half is very good.** Amplitude's Summary card states the experiment's hypothesis and whether it reached significance, assembled from what was entered during the design and rollout phases rather than re-asked. What it cannot show is the belief's strength, because none was recorded as a number | **Amplitude's Summary card** for the shape · **Metaculus** for the only complete published model of a stated belief scored against a resolution · **Eppo's decision criteria in a protocol** and **GrowthBook's target MDE** for the standard being fixed before the data arrives |
| 2. How *not yet conclusive* is expressed without reading as failure | **Yes for the statistical case, and it is the strongest answer in the market.** Amplitude ships `Inconclusive` as a badge beside `Significant` and `Not Significant`, GrowthBook greys the middle band of Chance to Win instead of colouring it, and both refuse to compute anything at all below a data floor | **GrowthBook** (a grey band and a `~X days left` status, so waiting is a computed number rather than an absence) · **Eppo's `Wrap Up`** state · **Metaculus's `Ambiguous` and `Annulled`**, which are the deeper answer: two different non-verdicts, split by whether the world was unclear or the claim was, and neither one scores |
| 3. How a readout shows what it changed downstream | **No, and the class says so about itself.** Amplitude's closing guidance is to decide whether to run another test or promote the winner, which is advice rather than a link. Nothing writes back | **incident.io**, which has spent several published posts diagnosing exactly this failure and names the cure · **ADR practice**, for the append-only supersession model · **Metaculus Conditional Pairs**, for a claim that another claim's resolution settles automatically |

**Two references earned their place and are named nowhere in this file before today.** Metaculus,
because its scoring and resolution documentation is the only complete specification found of a belief
recorded before an outcome and graded after it, which is the sentence the strategy uses to describe
this station. And incident.io, because the reference class whose artifact is a learning rather than a
fix has already published its own post-mortem on why learnings change nothing, and the diagnosis
lands on our surface exactly.

## The merged information model for one settled claim

**Tier 1, the readout is not usable without these**

| # | Field | Lifted from |
| --- | --- | --- |
| 1 | **the claim, in the words it was written in, frozen and not editable once the clock is running** | Metaculus (changing a question after it opens is highly discouraged, and edits are noted in the body; only admins may touch resolution terms once forecasting has begun) |
| 2 | **the observable that will settle it, written before the outcome and standing on its own** | Metaculus (the resolution criteria are self-contained instructions, and the background material is explicitly not used for resolution) · ours already, as `forecast_how_we_will_know` and the contract's proof oracle |
| 3 | **the strength of the belief, as a number, recorded at the same moment as the claim** | Metaculus (a probability, which is what makes a score possible at all) · Amplitude and GrowthBook (a target effect size, which is the same commitment stated as a threshold) |
| 4 | the date it comes due, chosen when the claim is made | Metaculus open, close and resolve dates, three separate dates with three separate meanings · Statsig's guidance to pick the readout date at launch and disregard the statistics until then |
| 5 | **the outcome, from a closed vocabulary that includes at least two ways of not settling** | Metaculus (Yes, No, Ambiguous, Annulled) · Amplitude (Significant, Not Significant, Inconclusive) |
| 6 | **two independent axes on the result: against the previous state, and against the number that was promised** | Amplitude (`Above Control` / `Below Control` and `Above Goal` / `Below Goal` are separate badges that can appear together) |
| 7 | who or what settled it, and under whose authority | Metaculus Resolution Councils (for the highest-impact questions the resolver is named in the criteria in advance) · Eppo (a decision is a person filling out an outcome, and the state does not advance without it) · ours already, as `forecast_resolved_by_agent_slug` and `outcome->>settled_by` |
| 8 | **a data floor below which no verdict is offered at all** | Amplitude (no p-value or interval until 100 users and 25 conversions per variant) · GrowthBook (nothing before the minimum runtime, defaulting to three days) · LaunchDarkly's extend, already captured in the Ship section |
| 9 | the score, and the track record it joins | Metaculus (a resolved question yields a score, and scores across many questions become the measure) |
| 10 | **what the settled result changed, as a link rather than as prose** | incident.io (a follow-up that lives in the learning document is already dying) · ADR practice (a superseding record links back to the one it replaced) |

**Tier 2**: the reason a claim was deferred, and how many times · the resolution history with a reason
per reopen · a health or data-quality panel kept apart from the result · the reason a claim was
withdrawn rather than settled · the settled claim's own supersession edge · notifications on the
events that need a person (the date arrived, the standard was met, the data went wrong) · the segment
or slice the result held in, held separately from the headline · a same-shape comparison against the
immediately previous claim of the same kind.

**Tier 3, focused pane only**: the confidence interval and the observation count behind each number ·
the belief's history over time, including where it was withdrawn · the aggregate against the
individual · the per-slice breakdown that answers whether the effect was uniform · the model's own
draft of the verdict with its reasoning and its own confidence · the arithmetic of the score.

> **The finding that most changes our build: the whole market fixes the standard before the data
> arrives, and every one of them does it with a stored field rather than with a convention.** Eppo
> puts primary metrics, guardrails and the criteria for recommending a rollout into a **protocol**,
> and its own writing gives the reason in one image: drawing the target after seeing where the shots
> landed is how a team finds patterns that are not there. GrowthBook stores a **target minimum
> detectable effect** per metric and will not render a decision until that precision is reached.
> Amplitude assembles the readout from the design and rollout phases so the hypothesis on the result
> screen is the one that was typed before the test ran. **Our contract's success clauses with their
> proof oracles are already this artifact, and `gradeOutcomeContract` already refuses to sign off a
> spec whose every standing clause is unfalsifiable, which is a stronger gate than anything in this
> class.** What is missing is one number: nothing anywhere records how likely the team thought it
> was. Without that, a settled claim can say right or wrong and can never say well or badly
> calibrated, and the calibration half is the part no model arrives holding.

> **The second finding, and it is the answer to the brief's hardest question.** Nobody solves
> *not yet conclusive* with a gentler word. They solve it structurally, and there are three separate
> mechanics doing it. **Refuse to speak below a floor**, so an early result is not a weak result, it
> is not a result. **Give waiting a number**, which is GrowthBook's `~X days left` computed from
> power rather than from anyone's patience. And **split the non-verdict by whose fault it was**, which
> is Metaculus's `Ambiguous` for a world that stayed unclear against `Annulled` for a claim that was
> underspecified or whose assumption was overturned. Neither of the two scores, both are terminal,
> and the second one is a judgment about the claim rather than about the team. **We have one
> non-verdict, "too early to tell", and it is a date move rather than a state**, so a claim that was
> unanswerable as written has nowhere to land except a miss.

## The verb set

`[A]` Amplitude · `[ST]` Statsig · `[E]` Eppo · `[G]` GrowthBook · `[M]` Metaculus ·
`[GJ]` Good Judgment · `[I]` incident.io · `[ADR]` architecture decision records. Marked verbs are
lifted close to literally, including the name.

| Verb | Required effect on the data |
| --- | --- |
| Set the criteria `[E]` `[G]` | writes the metrics, the guardrails and the standard for a positive call **onto the claim, before it can be judged**. Eppo holds it as a reusable protocol so a team states it once for a class of decisions rather than per decision, which is the difference between policy and permission on this station |
| Set the target effect `[G]` | the smallest movement worth acting on, per metric, stored. It decides **how long the claim waits**, and it is what makes "we have enough to judge" computable instead of arguable |
| Reaffirm `[M]` | records the same belief again, now. **Not a change, a fresh timestamp on an unchanged view**, so a standing belief and a stale one are different rows rather than the same row read charitably |
| Withdraw `[M]` | stops a belief accruing from this moment without erasing what it already earned, and **draws as a break in the timeline rather than as a gap**. Nothing retroactive: the aggregate it fed on earlier days still says what it said |
| Auto-withdraw `[M]` | a belief nobody has reaffirmed within a set fraction of the claim's life is withdrawn by the system, with a warning first. **Silence expires on its own** rather than being read as continued agreement |
| Make the decision `[E]` | the act that moves a claim to its terminal state, carrying both an outcome and a decision, and **the state cannot reach terminal without it**. Eppo's `Concluded` is defined as a decision having been made, never as a date having passed |
| Resolve `[M]` | settles the claim against the stated observable and releases the score. Only an authorised resolver may do it, and for the highest-impact claims **that resolver is named in the criteria before anyone forecasts** |
| Annul `[M]` | terminal, unscored, and it says **the claim was at fault**: underspecified, or an assumption it rested on was overturned. A distinct verb from resolving it wrongly, and the distinction is the whole point |
| Resolve ambiguous `[M]` | terminal, unscored, and it says **the world stayed unclear**. Reserved for conflicting evidence or a source that went missing, never for a claim that was badly written |
| Re-resolve `[M]` | a settled claim may be settled again when the first settlement was wrong on the evidence available, and **a claim may state up front that it will re-resolve** if initial reporting is later corrected |
| Reopen `[E]` | returns a concluded claim to the reviewable state so the dates and the decision can be edited. Eppo allows it and records no reason; ours requires one, see the directives |
| Extend the window `[G]` `[A]` | the claim waits longer because the data has not arrived, expressed as **days remaining computed from the target**, never as a status that reads like a stall |
| Refuse to judge `[A]` | below the data floor the product **produces no interval and no verdict at all**, and says which floor was not met. Not a low-confidence answer, no answer |
| Flag the data, not the result `[A]` `[G]` | traffic imbalance, double exposure and low power are their own panel with their own remedies, so **a broken measurement never reads as a negative outcome** |
| Group by `[A]` | asks whether the result held the same way for everyone, in one control rather than by re-filtering. The honest form of "it worked" is often "it worked for these and not those" |
| Supersede `[ADR]` | writes a **new** record that replaces the old one and links both ways. The replaced record keeps its text and gains a status, because **it is the answer to why the earlier call was ever made** |
| Own the follow-up `[I]` | a consequence gets a named person, wording specific enough to act on, and **a home in the tool people already open**. incident.io's diagnosis is that the four ways a follow-up dies are no owner, the wrong tool, vague wording and no cadence |
| Theme across claims `[I]` | reads patterns across many settled claims rather than one, because **the second occurrence is the finding** and a single readout cannot show it |
| Score `[M]` `[GJ]` | grades the stated belief against the outcome and adds it to a track record. Weighted by how long the belief stood, so a call made early and held is worth more than one made late |

## The three questions, answered

### 1. How a forecast is shown against its outcome

**Amplitude gives the layout and the discipline behind it.** The Summary card states the hypothesis
and then says whether it reached significance, and the load-bearing sentence in the documentation is
that Experiment reuses what was entered during the design and rollout phases so nothing is asked
twice. That is the anti-retrofit mechanic expressed as a convenience: **the hypothesis on the readout
is the one that was typed before the run, because there is no second field to type it into.** Our
equivalent already exists and is already read: `standingClauses` in `WhatShipped.tsx` pulls the spec's
standing success clauses, `PromisedMetric` carries a clause's text with the oracle that will settle
it, and `SettlePanel` seeds the metric label from the promise rather than from a blank field
(`seedMetricLabel` prefers the launch plan's metric, then the first clause whose head reads as a
label).

**The badge set is where Amplitude is ahead of us, and it is one line of difference.** It ships
`Significant` and `Not Significant` for the statistical question, `Inconclusive` for the primary
metric, and then **two more pairs that are about meaning rather than about statistics**:
`Above Control` or `Below Control`, and `Above Goal` or `Below Goal`, which may appear at the same
time. So "the number moved and still missed the target" is one readout with two badges rather than an
argument. **Ours collapses both axes into one of three words.** `VERDICT_SAYS` gives "it worked", "it
did not work" and "the signal was mixed", `learnings.verdict` is constrained on the database to those
three keys, and the two facts a person needs on this station, better than before and as good as
promised, are folded into whichever of the three feels closest. The contract already holds the goal;
`prior_ice` and `new_ice` on `learnings` already hold the movement.

**Metaculus supplies the half the experiment class refuses, and refuses on purpose.** A belief is a
probability, a resolved question yields a score, and the sequence of scores becomes a track record
whose whole value is that it accumulated across unrelated questions over years. Three properties of
that design transfer, and the third is the one nobody would think of.

1. **The score is weighted by how long the belief stood**, which Metaculus calls coverage. A
   prediction that was standing for one day of a five-day question earns a fifth of the coverage. So
   **a call made early and held is worth more than the same call made once the answer was obvious**,
   and a late change of mind cannot quietly claim the whole question. Ours has one belief with one
   timestamp and no notion of how long it stood.
2. **Withdrawing is a first-class act with no retroactive effect.** Stopping a belief stops the score
   and the coverage from that moment, keeps everything already earned, and does not remove the
   belief from the aggregate it fed on earlier days. Withdrawals are drawn on the timeline as
   crosses, so **the absence is a mark rather than a gap**.
3. **A stale belief expires by default.** Auto-withdrawal removes a forecast after a configurable
   fraction of the question's life unless the forecaster reaffirms it, with a reminder first, and the
   stated reason is to keep stale beliefs out of both the individual's accuracy and the aggregate.
   The verb that pairs with it, **Reaffirm**, is the cheapest and most useful thing in this whole
   pass: it is a click that means *I still think this*, and it exists so that a belief nobody has
   restated cannot pass for a current one. The Plan section found Linear marking a project stale when
   an update is overdue; this is the same instinct with teeth, because the stale belief is not merely
   flagged, it stops counting.

### 2. How *not yet conclusive* is expressed without reading as failure

**The market's answer is three mechanics, and none of them is a kinder word.**

**Refuse to speak below a floor.** Amplitude computes no p-value and no confidence interval for a
binary metric until each variant has 100 users and 25 conversions, and for other metrics until 100
users per variant. GrowthBook shows no decision and no days-remaining estimate before the
organisation's minimum runtime, defaulting to three days, and its only two statuses available that
early are `Unhealthy` and `No data`. Statsig tells readers plainly not to make decisions inside the
first 24 hours and to disregard the statistical interpretation until the target duration is reached.
**The pattern is that an early result is not a weak result, it is not a result**, and the surface says
which floor has not been met rather than showing a number with a caveat.

**Give waiting a number.** GrowthBook's `~X days left` is computed from how much data the target
effect still needs, and the documentation attaches the three usual causes to it: too many goal
metrics, a target effect too small for the traffic, or too little traffic. **So the waiting state
carries its own diagnosis**, which is what stops it reading as a stall. Eppo's `Wrap Up` is the other
half: the end date has passed, results are no longer updating, and the requirements for a decision
were never met. That is a distinct state from `Ready for Review`, and having both is what lets a
surface say "this one is judgeable now" and "this one ran out of road" without one word covering both.

**Colour the middle band grey.** GrowthBook's Chance to Win greens above 95%, reds below 5%, and
**greys everything between rather than tinting it toward either end**. That is our colour law arriving
from somebody else's docs: `pass` and `fail` report an outcome that happened, and an inconclusive
result is not a bad outcome, it is a claim still under a condition, which is precisely what
`--mrd-hold` is declared to mean. Our `PromotionCard` reached the same place for the same reason and
its file says so at length.

**And the deepest answer is Metaculus's, because it splits the non-verdict by fault.** A question can
resolve `Ambiguous`, which means reality stayed unclear: reporting conflicted, or the source that was
supposed to settle it stopped publishing. Or it can be `Annulled`, which means reality was clear and
**the question was not**: it was underspecified, or an assumption it rested on was overturned, or its
outcomes were so imbalanced that only one of them was ever really reachable. Neither is scored,
both are terminal, and the documentation is explicit that the reason for having two rather than one is
fairness to the people being scored. **Ours has one non-verdict and it is not a state at all.**
`deferOutcomeCheck` and `deferForecastCheck` move a date and write nothing to the verdict column,
which `buildDeferPatch` pins by the absence of a key and a test asserts on the patch object rather
than through a stubbed query. That is the right build for "the evidence is not in yet". It is the
wrong build, and the only build available, for "this claim could never have been settled as written",
which today has to be recorded as a miss against whoever made the call.

### 3. How a readout shows what it changed downstream

**The experiment class does not answer this, and its own closing advice is the proof.** Amplitude's
next-steps guidance is that no experiment is a failure and the reader should consider running another
test or promoting the winner. Sound advice, and it is advice: nothing on the readout points at a
thing that changed because of it.

**incident.io has published the diagnosis, and it is about our surface as much as theirs.** Its
argument is that a follow-up written into the review document is already dying, and it names four
causes: no named owner, the wrong tracking tool, wording too vague to act on, and no cadence that
brings it back. The cure it argues for is the one worth lifting exactly: **the consequence lives in
the tool people open every day, not in the document that recorded the learning.** It also argues,
against a common view in its own field, that separating the learning discussion from the action
discussion does more harm than good, because the two are inseparable in practice. And its
blameless framing supplies the sentence this station needs when a verdict lands badly: a human error
is where the investigation starts, not where it ends.

**ADR practice supplies the shape of the write-back.** An accepted record is immutable; a changed
decision is a **new** record that supersedes it, and the superseded one keeps its text and gains a
status plus a link both ways. The reason given is the one this product argues for elsewhere: the
replaced record is the answer to why the earlier call was ever made. `spec-projections.ts` already
does this with `superseded` clauses, and the Plan section already found that nothing in the planning
class keeps a dropped slice resolvable with its reason. Same mechanic, one station later.

**Metaculus Conditional Pairs are the most interesting downstream mechanic found, and nothing in
product tooling has anything like it.** A conditional claim is defined against a parent claim, and
when the parent resolves, **the branch that assumed the other outcome is annulled automatically and
the surviving branch inherits the child's resolution**. So settling one claim settles others without
anybody revisiting them. That is the loop closing, expressed as a typed edge rather than as a
re-ranking, and it is the sharpest available answer to the brief's extra requirement that a settled
result must be shown to change something else.

**Ours, and the honest reading of it.** Two write-backs are real and one of them is genuinely the
best-built part of this product.

The first is ranking. `applyOutcome` moves the decision's confidence by
`VERDICT_CONFIDENCE_DELTA`, clamps it to the one-to-ten axis, recomputes ICE through `iceOf`, and
writes `prior_ice` and `new_ice` onto the learning, so a settled verdict changes where the bet it came
from sits in what Discover and Decide rank next. The register lists that chain as wired and reading.
`overturnMove` handles the case where a verdict replaces one, so an overturn does not double-count.
The second is retrieval: `20260703000000_rf02_outcome_weighted_retrieval.sql` reweights
`match_agent_memory` so a validated memory sorts ahead of a missed one at the same distance, which
means **a settled verdict changes what the next agent is handed** rather than only what a person can
look up.

The third path is the one the brief's extra criterion is really asking about, and it exists and does
not surface here. An approved house rule is injected into every agent's system prompt at the
chokepoint through `renderHouseRulesBlock` in `loop.server.ts`, `house_rules.source_learning_ids`
records which settled learnings it was distilled from, and
[`../../src/lib/brain-standing.functions.ts`](../../src/lib/brain-standing.functions.ts) states the
chain in its own header. **So the strongest downstream consequence a learning can have is a standing
rule that changes every future run, and it is rendered on `/engine-room?room=safety` and in the
approvals queue, not on Learn.** `HouseRulesPanel` also renders it as a **count**, "distilled from 3
learnings", with no way to reach the three. That is the same count-versus-pointer gap the Plan
section named about citations, in a second place, and the register's note that a settled forecast
re-ranks nothing because every reader of it is a display or a queue filter is the third.

## What these products get wrong for an agent-operated product

Anti-patterns. Do not copy them.

1. **The draft verdict is shown before the person answers, which anchors the answer it is meant to
   inform.** This one is ours rather than theirs, and the reference is what makes it visible:
   Metaculus hides the community prediction when a question first opens, stating outright that the
   purpose is to stop the earliest forecasts from grounding later ones. `ForecastDeskPanel` renders
   "A draft says it came true" with its rationale directly above the three verdict buttons, and
   `SettlePanel` seeds the form fields from the drafted verdict. **The three-state
   `suggestionQuality` split is exactly the right instinct and it solves a different problem**: it
   keeps a considered draft apart from a parse failure dressed as one. What neither solves is that a
   person reading a confident draft is no longer an independent judge of the claim. The cheap fix is
   ordering, and it is the one the Ship section already argued for at its gate: the facts, then the
   answer, then the draft.
2. **A track record measured on a person is a track record that gets quietly abandoned.** This is the
   canon's own ruling arriving from the outside. Corporate prediction markets at Google beat expert
   forecasts and died anyway because the transparency exposed the people who could have kept them,
   and Metaculus's entire apparatus of coverage, withdrawal and annulment exists to make scoring
   feel fair to volunteers who chose to be scored. **A product team did not choose.** So the score
   belongs on the claim and on the loop, offered as something the next call can use, and it must
   never be the headline of a person's page. Good Judgment's own framing is the safe one: a belief is
   a hypothesis under test, not a possession.
3. **Editing the standard after the result is in, which every product forbids and none prevents.**
   Metaculus's rule is the tightest: once a question opens, changing it is highly discouraged, edits
   are noted in the body and the comments, and an ambiguity discovered after close is held to a
   higher standard of evidence than one raised while it was open. Eppo and GrowthBook let the
   decision criteria and the target effect be customised per experiment at any time. **Nothing in
   this class makes the standard immutable at the moment the clock starts**, which is the one
   guarantee that would make the record worth more than the memory of it.
4. **Retroactive closure, and the exact condition under which it is dishonest.** Metaculus allows a
   claim's clock to be wound back after the fact only when the outcome is independent of the timing,
   gives a rocket launch as the safe case and a snap election as the unsafe one, and says it will
   ignore an inappropriate retroactive clause even when a question specifies it. **That is the
   sharpest published statement of the retrofit failure mode**, and the general form is the one to
   hold: any adjustment made after the outcome is known has to be shown to be independent of the
   outcome, or it is scoring yourself.
5. **A deferral one half of the system cannot see.** Ours, and the register records it: a person
   pressing "too early to tell" on a spec outcome writes `outcome_check_by`, which only the human
   queue reads, and the agent sweep settles the bet anyway. So the one control a person has for
   saying *not yet* is invisible to the thing most likely to overrule them. The forecast half was
   built correctly and shares its filter through `dueCheckFilter`, precisely so the desk query and
   the tick query cannot disagree about what is due, with the comment recording that writing the
   clause twice is how the spec queue got it wrong in one of its two halves. **One station, two
   deferral mechanics, one of them right.**
6. **A verdict that a data problem can produce.** Amplitude keeps Data Quality as its own card with
   its own remedies, and GrowthBook makes `Unhealthy` and `No data` statuses that outrank every
   result status and appear before the minimum runtime. Ours has no equivalent: a bet whose metric
   was never instrumented and a bet that genuinely did not work arrive at the same three buttons.
   The empty-state handling in the route is honest about a missing draft and names what was absent
   when asked, which is the right instinct one step short of a state.
7. **The consequence filed where the learning lives.** incident.io's four causes of a dead follow-up
   are worth checking ourselves against one by one, and we fail two: a distilled rule has no named
   owner, and it is not shown on the station where the learning was settled. We pass the other two,
   because `house_rules` sits in the same review substrate as everything else a person approves and
   the steward pass brings undistilled learnings back on a cadence.
8. **Themes across claims are a separate product, sold separately.** Jeli's positioning is that the
   value is in patterns across incidents rather than in any one review, and incident.io's list view
   exists to make a body of post-mortems filterable. Both treat the single readout as the atom and
   the pattern as a later, optional read. **For a station whose claim is that the record guides the
   next call, the second occurrence is the whole point**, so cross-claim reading cannot be a
   downstream feature.
9. **A reopen with no reason.** Eppo lets a concluded experiment return to `Ready for Review` so the
   dates and the decision can be edited, and records nothing about why. Ours is better and it is
   worth saying so, since this file exists to stop the same research twice: `forecast_resolution_log`
   carries a non-null `reason` alongside the resolution being replaced, the person who reopened it
   and when, so an overturned verdict keeps the verdict it overturned. **That is the one place on
   this station where we are ahead of every reference in the class.**

## What this means for our Learn surface, stated as directives rather than status

Verified from the repo only. Nothing here was checked against production, and each directive is
tagged for how much wiring it needs: **PROVEN** means every row it reads is already read on this
station, **WIRING** means a column or an edge has to exist first, **ROADMAP** means the substrate is
not there at all.

**The constraint every directive below obeys.** AGENTS.md records the signal to shipped to learned
chain as broken in two places, and the Ship section measured the second precisely: the edges are
declared in `src/lib/spine/attach.ts`, `spine_track_members` holds no ship row of any kind, and
`deployments` holds 42 successful rows. **So Learn cannot grade against a deploy lineage, and nothing
below assumes one.** The register adds two more limits that bind here: a settled forecast re-ranks
nothing because all four of its readers are displays or queue filters, and `/decide` writes no
`decisions` row at all, so the claims this station would grade are almost entirely agent-recorded.
One of 304 decisions carries a forecast and none has ever resolved.

- **PROVEN. Put the promise above the answer, and the draft below it.** The gate order test already
  pins the shape, that a gate asks, shows its reasons through `lines`, then offers the control, and
  `PromisedMetric` already carries each clause's text with its oracle. Amplitude's Summary card is
  the reference: **the claim and its observable read first, the verdict buttons next, and the drafted
  verdict last**, so the draft informs a judgment that has already been formed rather than seeding
  it. This is a reordering of parts that are all on the screen today, and it closes the anchoring
  anti-pattern above without removing the draft.
- **PROVEN. Say both things a verdict means.** `learnings` already holds `prior_ice` and `new_ice`,
  and the contract already holds the standing clauses. Amplitude's split is the lift: **against what
  was there, and against what was promised, as two statements that can disagree.** Today a bet that
  moved the metric and missed the target has to be squeezed into "the signal was mixed", which is the
  one verdict of the three that tells a later reader nothing about which half failed.
- **PROVEN. Name what the verdict changed, on this station, with a link.** `getImpactLedger` already
  reports how far priority moved and how many calls were later replaced, which is the aggregate. What
  is missing is the specific: the rule the learning was distilled into. `house_rules` carries
  `source_learning_ids`, `getActiveHouseRulesForWorkspace` already reads by workspace, and
  `HouseRulesPanel` already renders a rule with its count. **A settled learning that became a
  standing rule should say so where it was settled, and the rule should resolve back to the learning
  rather than counting it.** incident.io's diagnosis is the argument, and the count-versus-pointer
  correction is the Plan section's.
- **PROVEN. Add Reaffirm to the desk.** A forecast that has come due, been deferred and come back
  twice is currently indistinguishable from one nobody has thought about since it was written.
  `forecast_deferred_count` is already read and rendered by `deferredNote`. Metaculus's verb is the
  cheap half: **a click that records the belief again, now**, so the desk can tell a held belief from
  a forgotten one. The expiry half is ROADMAP below.
- **WIRING. One column, and it is the moat's column: how likely the team thought it was.** A
  credence on `decisions` beside `forecast_claim`, written at the same moment and never afterwards.
  `computeBrierScore` already exists, is unit-tested and is running nightly against `insights`, so
  **the scoring half of calibration is built and is pointed at the wrong table.** Without this number
  a settled claim can only ever say right or wrong. With it, the track record the strategy rests on
  is computable from rows we already write. This is the single highest-value item in this pass.
- **WIRING. Two non-verdicts, split by fault.** Metaculus's `Ambiguous` for a world that stayed
  unclear and `Annulled` for a claim that was underspecified or whose assumption was overturned,
  both terminal, both unscored, both distinct from the existing date move. The verdict CHECK on
  `learnings` permits exactly three values and the register already carries a related defect, that
  `learning.record` invites the agent to say `uncertain` and an obedient agent gets a constraint
  violation. **So the vocabulary is already one value short of what its own tool description
  promises, and this is the principled way to widen it** rather than adding a fourth synonym for
  failure. `gradeOutcomeContract` supplies the annulment test for free: a claim whose every standing
  clause graded `unverifiable` was never settleable, and the grade was computed before the spec was
  approved.
- **WIRING. Write the learning back against the decision it graded.** `learnings.decision_id` exists
  on the database, is absent from `types.ts`, and the register says nothing writes it while
  `trust.server.ts` still rebuilds the edge in JavaScript. **The canon's sentence about a verdict
  being written back against the decision that caused it is the one this column exists for**, so the
  order is regenerate the types, then write the column at `applyOutcome`, then read it. Until it is
  written, a settled outcome reaches its decision only through `prd_id`, and the register notes that
  `prd_id` does not identify a decision.
- **WIRING. A lesson has to be able to say which product it came from.** `learnings.product_id` and
  `agent_memory.product_id` exist on the database with a derivation trigger and a CHECK refusing a
  product on `reflection` and `correction`, and neither is in `types.ts`. `resolveMemoryScope`
  already decides the question the columns answer, already defaults an unknown kind to product, and
  `PromotionCard` already calls it so a card cannot offer to promote a measurement however it was
  labelled. **The rule is built and enforced at the surface, and the column it rules on is invisible
  to the compiler.** Nothing new is designed here; the types are regenerated and the writers stamp
  it.
- **WIRING. Give a data problem its own state, above every result.** GrowthBook's `Unhealthy` and
  `No data` outrank all result statuses and appear before any minimum runtime. Our nearest available
  form needs no analytics: a bet whose contract graded `hazy` or `empty`, or whose promised clauses
  carry no oracle, **cannot produce a verdict worth writing**, and `gradeOutcomeContract` already
  says which of the two it is and why in one sentence written for the owner. Surfacing that on the
  desk turns a bet nobody can judge into a state instead of a guess.
- **ROADMAP. Persist the third promotion answer.** `decideMemoryCandidate` takes `approve` and
  `reject` only, so "never put this forward again" cannot be stored as distinct from "not yet", while
  `PromotionCard` already renders three answers and puts the destructive one in the trailing slot.
  Metaculus's annulment is the argument for why the third answer has to be terminal rather than a
  quieter no: **an item that keeps returning to a queue is a queue that teaches people to stop
  reading it**, which is the governance canon's own objection to approvals.
- **ROADMAP. Expiry on a belief nobody has restated.** Metaculus auto-withdraws a forecast after a
  configurable fraction of the claim's life unless it is reaffirmed, warns first, and keeps
  everything already earned. `plg-memory-expiry.ts` and `agent_memory.expires_at` show the shape
  exists elsewhere in this product. It needs the credence and the standing-time model first, because
  withdrawing a belief that was never scored costs nothing and proves nothing.
- **ROADMAP. Coverage, meaning how long a belief stood.** The weighting that makes an early held call
  worth more than a late one. It needs a belief history rather than one column, so it needs the
  credence, a timestamp per restatement, and the withdraw verb. Recorded here so nobody designs the
  score before the thing it scores.
- **ROADMAP. A claim another claim's resolution settles.** Metaculus Conditional Pairs, where
  resolving a parent annuls the branch that assumed otherwise and the survivor inherits the child's
  resolution. This is the strongest closed-loop mechanic in the pass and it needs a typed edge
  between claims that does not exist.
- **The verbs to add first, in the order the research argues for:** record how likely we think it is,
  annul a claim that was never settleable, and reaffirm a belief that is still held.

## Sources

Amplitude: [Learn from your experiment](https://amplitude.com/docs/feature-experiment/workflow/experiment-learnings) ·
[The Experiment Analysis view](https://www.amplitude.com/docs/faq/experiment-analysis) ·
[Post-experiment steps](https://www.amplitude.com/docs/en/web-experiment/post-experiment) ·
[Feature Experiment overview](https://www.amplitude.com/docs/feature-experiment/overview).
Statsig: [How to Read Experiment Results](https://docs.statsig.com/pulse) ·
[Read Results](https://docs.statsig.com/statsig-warehouse-native/features/interpreting-results/read-results) ·
[FAQ on using Pulse](https://docs.statsig.com/experiments/interpreting-results/faq) ·
[Frequentist Sequential Testing](https://docs.statsig.com/experiments-plus/sequential-testing).
Eppo: [Experiment status](https://docs.geteppo.com/experiment-analysis/reading-results/experiment-status/) ·
[Recommended Decision Defaults](https://docs.geteppo.com/administration/recommended-decisions/) ·
[Experiment Protocols](https://docs.geteppo.com/experiment-analysis/configuration/protocols/) ·
[Mastering Experimentation Methods](https://www.geteppo.com/blog/mastering-experimentation-methods-design-to-analysis).
GrowthBook: [Experiment Decision Framework](https://docs.growthbook.io/app/experiment-decisions) ·
[Understanding Experiment Results](https://docs.growthbook.io/app/experiment-results) ·
[Hypothesis Testing Explained](https://www.growthbook.io/insights/hypothesis-testing).
Metaculus: [Metaculus FAQ](https://www.metaculus.com/faq/) ·
[Medals FAQ](https://www.metaculus.com/help/medals-faq/) ·
[Track Record](https://www.mintlify.com/Metaculus/metaculus/guides/track-record).
Good Judgment: [Beliefs as Hypotheses](https://goodjudgment.com/superforecasters-toolbox-beliefs/) ·
[Common Questions about Good Judgment and Superforecasters](https://goodjudgment.com/common-questions-good-judgment-superforecasters/).
incident.io: [Why post-mortem action items die](https://incident.io/blog/why-post-mortem-action-items-die) ·
[Why do post-mortem action items fail](https://incident.io/blog/why-do-post-mortem-action-items-fail-how-to-make-incident-follow-ups-actually-get-done) ·
[SRE incident post-mortem best practices](https://incident.io/blog/sre-incident-postmortem-best-practices) ·
[Why I like discussing action items in incident reviews](https://incident.io/blog/why-i-like-discussing-actions-items-in-incident-reviews) ·
[Managing your post-mortems](https://docs.incident.io/post-incident/postmortem-management).
Jeli: [Jeli Incident Analysis](https://www.pagerduty.com/platform/jeli/incident-analysis/) ·
[Get Started with Jeli Post-Incident Reviews](https://support.pagerduty.com/main/docs/get-started-with-jeli).
ADR practice: [Architecture Decision Record](https://martinfowler.com/bliki/ArchitectureDecisionRecord.html) ·
[Maintain an architecture decision record (Azure Well-Architected Framework)](https://learn.microsoft.com/en-us/azure/well-architected/architect-role/architecture-decision-record) ·
[Architectural decision record process (AWS Prescriptive Guidance)](https://docs.aws.amazon.com/prescriptive-guidance/latest/architectural-decision-records/adr-process.html).

Content was rephrased for compliance with licensing restrictions.

---

# BRAIN: showing what a system has learned without claiming more than it did

Researched 2026-08-20 against official product documentation. **Structural insight: this is the only
one of the eight where the reference class is mostly a set of counter-examples, and the reason is a
single verb. Every product here models itself as a place that HOLDS things: a card, a note, a file, a
saved memory. That framing is what makes them undefensible and it is what the canon bans, so the
useful reading of this class is not "copy their surface" but "they solved retrieval display and none
of them solved the thing that makes retrieval worth trusting."** Four of the ten named references are
counter-examples rather than templates, and they are marked as such below.

**The one exception is the category's own definition, and it is the most valuable sentence found in
this whole pass.** ThoughtWorks placed **context graph** at Assess in April 2026 and defined it
against the obvious neighbour: unlike GraphRAG, which builds from a static document corpus, **a
context graph maintains temporal validity on every edge, so a superseded fact is invalidated rather
than overwritten**, and it is worth assessing for agentic applications needing persistent recall
across sessions or traceable decision reasoning. That is a precise description of `supersededContent`
in `src/lib/ai/memory.server.ts`, which appends a note and keeps the prior verdict verbatim on the
argument that *"we called it validated in March and it was missed by June"* is the highest-signal
thing this product owns.

**So the code to do the thing the category is named for exists, and it has never run. Corrected
2026-08-21 against production, because the first draft of this paragraph said we already do it, which
described an intention as a practice.** Measured across all 1,297 rows of `agent_memory`: **zero
contain `[Superseded]`, zero contain any form of "supersed", and zero carry kind `outcome`** (the table
holds `reflection` 1,195, `precedent` 28, `note` 25, `correction` 11). The last figure explains the
others, because `supersededContent` has exactly one caller and it sits inside the outcome-memory path,
**so the function cannot have fired: the kind it writes has never been written.** And `agent_memory`
carries **no supersession column of any kind**, no `superseded_by`, `superseded_at`, `valid_from` or
`valid_until`, its only temporal column being a TTL. **So "in a string rather than on an edge" is right
for a stronger reason than the first draft gave: there is no edge to put it on.** A reader who took the
original sentence to the ROADMAP directive would have designed the edge and never noticed that nothing
writes the string, which is why the honest version leads instead.

## Three premise corrections, because two of them change what may be recommended

**1. The item says Brain is in no reference row. That was true and the gap is wider than a row.** Brain
is not a station, it is layer 03, and the seven station rows are all *surfaces where work happens*.
Brain is the surface where **what the work taught** is read, so its reference class was never going to
come from product tooling: it comes from enterprise knowledge search, from note graphs, and from how
coding agents display what they pulled in. The row added at the top of this file names all ten.

**2. `precedent` is one of the six node types in the industry's own context-graph enumeration, and
nothing in this repo writes it.** K-73 found the absence and read it as a naming slip between a ruling
and its writers. Read against the category definition it is more than that: the enumeration is
decisions, policies, exceptions, **precedents**, evidence and outcomes, and `precedent` is exactly the
node that says *this was settled before, this way*. `memory-scope.ts` carries it in `EVIDENCE_KINDS`
because production holds 28 rows of it, and `decision-precedent.server.ts` filters on
`kind === "outcome"` instead. **So the product has a precedent engine that does not read the precedent
kind, and a precedent kind no writer produces.** That is a wiring gap rather than a vocabulary one.

**3. The `scope` column looks like it answers the retrieval-boundary question and answers a different
one.** Measured in `memory-scope.ts` against production: `agent` 1,083 rows, `workspace` 81, `global`
11, and all three are statements about **which agents may reach a row**, never about whose evidence it
is. The product-versus-workspace question is answered by `resolveMemoryScope` on top of the `kind`
column, and **11 of 17 workspaces already hold more than one product while 7 hold four**, so this is
the majority state rather than a future case. Any recommendation about showing scope on a surface has
to name which of the two questions it is showing.

## Verdict on the named class first, and one question has no answer in it at all

| Question | Does the knowledge-surface class answer it? | What actually answers it |
| --- | --- | --- |
| 1. Showing what the system knows without becoming a search box | **No, and this is the flat no.** Glean, Guru and Notion AI are all search boxes by design, and their own framing is a company brain you query. A box that answers questions is the correct shape for *"where is the invoice policy"* and the wrong shape for *"what has this team learned"*, because the second has no query: the reader does not know what to ask | **Obsidian's LOCAL graph**, for the constrained-neighbourhood read, and its own community's verdict on the global graph as the counter-example · **Guru's trust indicator**, for a per-item freshness state shown without being asked · **Claude Code's `/memory`**, for making what the machine wrote inspectable at all |
| 2. Showing a retrieved memory at the point it influenced something | **Partly, and the good part is very good.** Glean puts a citation immediately after the statement that needs backing, and its **deep-linked citations resolve to the exact passage** rather than to the document | **Glean deep-linked citations** · **Perplexity's numbered inline citations** · **Cursor's context pills and Claude Code's visible file reads**, which show what was pulled in *before* the answer rather than after it |
| 3. Showing it learned something without claiming more than it did | **No, and two of them claim considerably more.** Cursor's own community documentation of the memories mechanism describes it as internal and not something the user sees or interacts with; Guru's marketing calls a connected corpus a company brain | **Claude Code**, which is the one honest reference: its docs state the two memory systems are treated **as context rather than as enforced configuration**, and `/memory` shows a toggle · **Guru's verification lapse**, where stale content is deprioritised in AI answers rather than hidden or claimed |

## The merged information model for one thing the brain holds

**Tier 1, the row is not trustworthy without these**

| # | Field | Lifted from |
| --- | --- | --- |
| 1 | **the lesson in the words it was written in, never rewritten** | the context-graph definition (a superseded fact is invalidated, not overwritten) · ours in code, in `supersededContent`, and **not yet in any row** |
| 2 | **what settled it, resolvable to the exact passage and not to the artifact** | Glean deep-linked citations · Perplexity numbered citations |
| 3 | **whose lesson it is: the product it was learned in, or the whole workspace** | ours already, in `resolveMemoryScope`, and the only field here with no reference-class equivalent, because none of these products has a tenancy question inside one customer |
| 4 | **a freshness state a reader can see without asking**, and a verb to renew it | Guru verification and its trust indicator · Metaculus Reaffirm, carried forward from the Learn pass |
| 5 | **written by a person, or written by the machine**, as two different things | Cursor rules against memories · Claude Code `CLAUDE.md` against auto memory |
| 6 | **whether it has been used, and whether using it went well** | ours already, and stronger than the class: `memory_recall_log` plus the outcome-weighted rerank |
| 7 | the temporal validity of the edge, so a chain can be walked as at a date | the context-graph definition, which is the only source that states it |
| 8 | **what reads it next**, named rather than counted | incident.io, carried forward from the Learn pass |
| 9 | an importance the reader can see, since it is already in the ranking | ours already, in `agent_memory.importance` |
| 10 | **the kind, from a vocabulary the read side agrees with** | ours, and currently the weakest link: see premise correction 2 |

**Tier 2**: the count of times it was recalled, apart from the last time · the supersession chain as
links in both directions · the run that wrote it · the agent that wrote it, apart from the person who
approved it · a per-kind view, so evidence and method are never read as one list · the reason a lesson
is not promotable, in the words the promotion prompt uses · a stale marker distinct from a superseded
one.

**Tier 3, focused pane only**: the embedding neighbourhood of one lesson · the rerank arithmetic that
put one row above another · the recall log for one row across every trace that pulled it · the graph
at depth two from one node · which lessons a given standing rule was distilled from.

> **The finding that most changes our build, and it is a comparison we win.** Guru's freshness model
> is the closest thing in this class to a memory that decays, and **its trigger is a clock**: a card
> comes due, a named verifier confirms it in one click or updates it and re-verifies, and a lapsed
> card is deprioritised in AI answers. Our equivalent is `match_agent_memory` after RF-02, and **its
> trigger is an outcome**: a row whose metadata carries a missed verdict sinks below an equally
> similar row that carries a validated one, with the decay term on `last_used_at` as a second, smaller
> input. **An outcome-weighted rerank is a strictly better signal than a calendar, because a lesson
> does not become wrong by ageing, it becomes wrong by being contradicted.** What Guru has and we do
> not is the part a reader can see: a trust indicator on the item, and a verb to renew it. **We have
> the better mechanism and no surface for it, which is the exact inversion of this class.**

> **The second finding, and it is the one that would embarrass us.** Every reference in this class
> shows what it retrieved. Glean cites after the sentence that needs backing and deep-links to the
> passage; Perplexity numbers its sources inline; Cursor draws a pill per attached file; Claude Code
> prints the file reads as it makes them. **Our retrieval is invisible at the moment it acts.**
> `recallMemoryRefs` returns lines that are injected into the system prompt, `logMemoryRecall` writes
> a `memory_recall_log` row per recalled id keyed on the trace, and the correlation key is the trace
> rather than the event **for a stated and correct reason** (one recall's lines are baked into the
> prompt once and reused by every model call in the run's step loop). So the product already knows,
> per run, exactly which lessons shaped it. **Nothing renders that.** The reader sees an answer and
> the record separately, and the join between them exists in a table nobody reads on a surface.

## The verb set

`[CG]` the context-graph definition · `[GU]` Guru · `[GL]` Glean · `[NO]` Notion AI · `[OB]` Obsidian ·
`[CU]` Cursor · `[CC]` Claude Code · `[WS]` Windsurf · `[PX]` Perplexity. Marked verbs are lifted close
to literally, including the name.

| Verb | Required effect on the data |
| --- | --- |
| Invalidate `[CG]` | marks a fact false **from a date**, on the edge, without touching the text of the fact. The whole distinction the category is named for, and the reason it is not an overwrite |
| Verify `[GU]` | a named person confirms an item is still true, in one press, **and that press is a fresh timestamp rather than an edit**. The item carries a visible indicator of the result |
| Lapse `[GU]` | verification expires on an interval and the item is **deprioritised in generated answers**, not hidden and not deleted. Silence is not read as continued agreement |
| Evaluate on a schedule `[GU]` | an agent reviews the corpus nightly, flags what looks stale, and **leaves a transparent log of every decision it made**. The log is the product, not the flagging |
| Cite after the claim `[GL]` `[PX]` | the reference sits immediately after the statement that needs backing, never collected at the end, so **the reader never has to work out which source supports which sentence** |
| Deep-link to the passage `[GL]` | the citation resolves to the exact supporting passage rather than to the document containing it. Available only where the answer is grounded in real content, and it falls back rather than faking one |
| Enforce permission at retrieval `[GL]` | access is applied **during** retrieval rather than filtered afterwards, so a cited source is one the reader may open. Our tenancy analogue is `resolveMemoryScope` and the RPC's workspace clause |
| Attach `[CU]` `[NO]` | a person puts a specific thing into the working set for one exchange, and it is drawn as an object they can see and remove |
| Distinguish rule from memory `[CU]` `[CC]` | two records with two authors: what a person wrote as standing instruction, and what the machine wrote from experience. **Loaded together and labelled apart** |
| Treat as context, not configuration `[CC]` | the honest framing, and stated in the docs rather than implied: what is loaded informs the model and does not bind it. **The one place this class refuses to overclaim** |
| Inspect and toggle `[CC]` | one command shows every file the machine has been writing into, with a switch. A machine-written record a person cannot read is not a record they can trust |
| Read the local neighbourhood `[OB]` | show what THIS node connects to at depth one or two, not the whole corpus. Its own community's verdict is that the constrained view is the useful one |

## The three questions, answered

### 1. Showing what the system knows without becoming a search box

**The class has no answer, and saying so is more useful than a template.** Glean, Guru and Notion AI
are query surfaces: you arrive with a question and they ground an answer in your own content, with
citations and permissions. That is the right shape for a factual lookup and the wrong shape for this
station, because **a person opening Brain has no query**. They are not asking where a policy is. They
are asking what has been learned, which is a question you cannot type because you do not know the
answer's shape.

**Obsidian is the closest thing to an answer and its own community supplied the correction.** The
global graph is widely reported as unusable in practice: node positions change on every load, nodes
overlap, and at any real size it is a decorative blob. The **local** graph is what people actually
use, on the stated ground that *which notes this note links to* is constrained enough to focus on. The
forum thread arguing this is titled after the complaint it answers. **So the lift is not "draw the
graph", it is "draw the neighbourhood of one thing"**, and it comes with a documented warning about
the version we would otherwise reach for first.

**Guru supplies the other half, and it is the half that needs no query at all.** A verified card
carries a trust indicator, so a reader learns something about reliability **before** asking anything,
and a lapsed card is deprioritised in generated answers rather than silently equal to a fresh one.
That is a per-item state visible at rest, which is what a station full of lessons needs and what a
search box structurally cannot give.

**Ours, and it is further along than this comparison suggests.** `_authenticated.brain.tsx` is already
not a search box: it leads with a headline computed from the record (`recordHeadline`), carries
`guidanceLines` for what the record would tell you next, renders `StandingRules` and `CrewCarries`,
and holds a graph preview plus tabs for decisions, outcomes and documents. `recordIsBlank` exists so
an empty record says so rather than rendering an empty frame. **The gap is not the shape of the
surface, it is that no row on it carries a state.** A lesson on Brain today reads the same whether it
has been recalled forty times and validated, or written once and contradicted since.

### 2. Showing a retrieved memory at the point it influenced something

**This is where the class is genuinely ahead of us and the fix is small.**

**Glean's rule is the one to lift verbatim: the citation goes immediately after the statement that
needs backing.** Not gathered into a footer, not a source list beside the answer. And **deep-linked
citations resolve to the exact passage** that supports the sentence, with a documented fallback to an
ordinary citation where the answer is not grounded in real content, so the mechanism never invents a
precision it does not have. Perplexity's numbered inline citations are the same instinct in a
consumer surface.

**The coding agents answer a different half of the question and it is the half we are missing
entirely: they show the retrieval BEFORE the answer.** Cursor draws attached files as pills in the
prompt, and its rules are documented as being included at the start of the model context. Claude Code
prints its file reads as it makes them. **So a reader watching either one can see the working set
being assembled, which means a wrong retrieval is visible while it is still cheap.** In our loop the
recalled lines go into the system prompt and the reader sees nothing at all.

**And we hold the join that would make this exact, which none of these products has.** `memory_recall_log`
records every recalled memory id against the trace that recalled it, and RF-03 upgrades those rows
from `ignored` to `used` or `contradicted` when a rating arrives for any event in the trace. **So for
any run, the product can already say which lessons were in front of the model and whether the run they
shaped turned out well.** That is a stronger claim than a citation, because a citation says *this
supported the sentence* while this says *this shaped the work, and here is how the work went.* It is
written, it is keyed correctly, and it is rendered nowhere.

### 3. Showing it learned something without claiming more than it did

**Two of the references are the warning rather than the model, and the canon predicted both.**

The clearest counter-example is the framing of an internal memory mechanism as something the user
neither sees nor interacts with, which appears in Cursor's own community documentation of how the
memories system is meant to be described to a model. **A record a person cannot inspect is a claim
rather than a record**, and it is the precise failure the ban on *"remembers"* protects against: the
verb asserts a capability whose evidence is unavailable. The second is the marketing use of a company
brain to describe a set of connectors over existing content, where the honest description is grounded
permission-aware answers over your own documents.

**Claude Code is the one reference that gets this right, and it does it with two moves.** Its
documentation states that the two memory systems are loaded at the start of every conversation and
treated **as context rather than as enforced configuration**, which is a deliberate and published
under-claim about what loading something achieves. And `/memory` renders the files with a toggle, so **what the
machine wrote about your project is inspectable and switchable off.** The split it draws is the same
one this product already has, between a rule a person wrote and a lesson the machine distilled, and it
is worth noting that this repo's own `AGENTS.md` is that artifact.

**Guru's third move is the schedule.** Its agent evaluates content nightly and leaves a transparent
log of every decision it made, so the claim being made is not *the corpus is good*, it is *here is what
was checked and what it concluded*. **That is the shape of an honest learning claim: the process is
visible and the conclusion is dated.**

**Ours, and the honest reading.** The canon's rule is that we never claim accumulated learning in the
present tense, and the surface currently honours it structurally: `recordIsBlank` and `guidanceLines`
mean an empty record says what it is. What is missing is the positive form. **When there IS something
to show, the surface has no way to say how strongly it holds**, because no row carries a recall count,
a validation state or a date it was last confirmed, even though the ranking behind it reads all three.

## What these products get wrong for an agent-operated product

Anti-patterns. Do not copy them.

1. **The global graph, which the community has already ruled on.** Positions shift on every load,
   nodes overlap, and past a small size it carries no information. Brain's own graph preview is the
   place this would land, and Obsidian's own forums are the argument for keeping it a local
   neighbourhood.
2. **A freshness clock standing in for a truth signal.** Guru's verification interval is configurable
   per card precisely because evergreen content should not keep coming due, which concedes the point:
   **age is a proxy and a weak one.** We have the stronger signal already, and adopting the clock
   alongside it would let a stale-but-validated lesson outrank a fresh contradicted one.
3. **A machine-written record the reader cannot open.** Named above. The correction is one command.
4. **Company brain as a claim rather than as a description.** The canon keeps **shared brain** and it
   earns it by being the thing agents actually read at the chokepoint. What must not follow is the
   adjacent claim that connecting sources constitutes learning.
5. **Citations collected at the end of an answer.** Glean's own guidance puts the reference after the
   statement, and the reason is that a footer makes the reader do the matching. Anywhere this product
   renders a grounded answer, a source list at the bottom is the version to refuse.
6. **A verify press that is also an edit.** Guru separates confirming from updating: one press means
   *still true*, and changing the content is a different act that then needs its own confirmation.
   Collapsing them makes a track record uninterpretable, because you cannot tell a belief that held
   from a belief that was quietly rewritten.
7. **Overwriting a superseded fact**, which is the thing the category is defined against and which
   this product already avoids. Recorded here so nobody optimises `supersededContent` into a rewrite.
8. **A depth that lets the walk wrap around.** The Ship and Learn passes both found loops in this
   graph by design, since a learning re-opens the decision that produced it.
   `AuditLineageSheet.tsx` already caps its walk at depth 3 for exactly this reason, having found a
   changeset presented as a mission's ancestor at the default depth. Any Brain graph read inherits
   that constraint.

## What this means for our Brain surface, stated as directives rather than status

Verified from the repo only. Nothing here was checked against production, and each directive is tagged
for how much wiring it needs: **PROVEN** means every row it reads is already read or written on this
path, **WIRING** means a column or an edge has to exist first, **ROADMAP** means the substrate is not
there at all.

**The constraint every directive obeys.** The chain is broken in two places and the Learn pass
measured the second precisely, so **nothing below grades against a deploy lineage.** And the honesty
rule binds hardest on this station of all eight: the loop is wired and proven and begins accruing on
first real use, and no directive here may render a sentence that outruns that.

- **PROVEN. Render what a run read.** `memory_recall_log` already holds the join, keyed on the trace
  for a stated reason, and RF-03 already upgrades a row to `used` or `contradicted` from a rating.
  Every part of *"these six lessons were in front of the model, and this is how the run went"* is
  written. **This is the highest-value item in the pass and it needs no new column**, which makes it
  the rare case where the moat claim and the cheap change are the same change.
- **PROVEN. Put a state on every row Brain draws.** `importance`, `last_used_at` and the verdict in
  `metadata` are all read by the rerank today, and none is shown. Guru's trust indicator is the
  reference, our signal is the better one, and the surface currently spends none of it.
- **WIRING, and it was tagged PROVEN in the first draft, which was wrong.** Make the supersession chain
  walkable on the surface. `rememberOutcome` writes `metadata.supersedes` naming what a row replaced and
  marks each replaced row with the note naming its successor, **so the chain is bidirectional in the
  code and exists in no row**: zero of 1,297 rows carry the mark, because the kind that path writes has
  never been written. **The order is therefore write one real outcome row first, then render the chain**,
  and a surface built before that would render an empty view of a real mechanism. The context-graph
  definition is still the argument for why this is the station's most defensible view once it has data.
- **PROVEN. Name what a standing rule was distilled from, rather than counting it.** The Learn pass
  found `HouseRulesPanel` rendering "distilled from 3 learnings" with no way to reach the three, and
  `house_rules.source_learning_ids` holds the ids. Same count-versus-pointer correction, third
  occurrence across three passes.
- **WIRING. A verb that renews a lesson, and a state for a lapsed one.** Guru's verify, and Metaculus's
  Reaffirm from the Learn pass, are the same act: **a press that means still true and writes a fresh
  timestamp without editing the text.** `last_used_at` is not it, because recall is not confirmation.
  It needs one column and it makes silence stop reading as agreement.
- **WIRING. Write the `precedent` kind, or stop carrying it.** Premise correction 2: the precedent
  engine filters on `outcome`, no writer produces `precedent`, and production holds 28 rows of it. One
  of the two has to move, and the category's own enumeration argues for making the kind real rather
  than deleting it.
- **WIRING. A citation that resolves to a passage.** Glean's deep link, in our terms, is a recalled
  lesson that opens the settled outcome it came from at the line that settled it. `metadata` already
  carries `learning_id`, `prd_id` and `opportunity_id`, so the artifact resolves; the passage does not.
- **ROADMAP. Temporal validity on the edge rather than in the text.** The category's defining property.
  `supersededContent` is written to achieve the honesty of it inside a content string, which would mean
  **a reader can see that a fact was superseded and a query cannot filter on when.** Moving it onto an
  edge is what would let the record be read as at a date, and it is a schema change rather than a
  surface one. **Do not start here.** `agent_memory` carries no supersession column at all, so there is
  no edge to move it to, and nothing writes the string either: **designing the edge before one real row
  exists is the trap this directive is ordered last to avoid.**
- **ROADMAP. Two authors, labelled apart, on one surface.** Cursor's rules against memories and Claude
  Code's `CLAUDE.md` against auto memory. We have both halves in `house_rules` and `agent_memory` and
  Brain does not draw the distinction, which matters because a person may overrule one of them and not
  the other.
- **The verbs to add first, in the order the research argues for:** show what a run read, put the state
  we already compute onto the row, and add the press that means still true.

**One thing this pass could not settle, said plainly rather than padded.** `agent_memory` holds 879
reflection rows, 28 precedent, 26 note, 8 correction and **zero of kind `outcome`**, which is the kind
the precedent engine reads. `memory.server.ts` documents why at length: on the only settle path that
has ever run in production the memory write was skipped before it started, because `prdId` was
required and 84 of 119 learnings carry none. That parameter is nullable now and the docblock records
the remaining cost, that a spec-less verdict never supersedes and is never superseded because there is
no correct key to chain it on. **So the pool the Critic's red team reads has never held a row, and
whether it does now is a production question rather than a repo one.** Every directive above is written
so that it is worth building either way, but the first one to check is that.

## Sources

The category: [Context graph, Thoughtworks Technology Radar Vol.34](https://www.thoughtworks.com/en-gb/radar/techniques/context-graph) ·
[Technology Radar Vol.34](https://www.thoughtworks.com/radar) ·
[Macro trends in the tech industry, April 2026](https://www.thoughtworks.com/insights/blog/technology-strategy/macro-trends-tech-industry-april-2026).
Guru: [Verification](https://www.getguru.com/features/verification) ·
[What is Verification?](https://help.getguru.com/docs/what-is-verifcation) ·
[How content is verified](https://help.getguru.com/docs/verifying-and-unverifying-cards) ·
[Verifying Cards in Slack](https://help.getguru.com/docs/verifying-guru-cards-in-slack) ·
[Knowledge Agent Quality setup](https://help.getguru.com/docs/knowledge-agent-quality-setup-guide).
Glean: [Citations](https://docs.glean.com/user-guide/assistant/glean-chat/glean-chat-citations/glean-citations) ·
[Deep-linked citations](https://docs.glean.com/user-guide/assistant/glean-chat/glean-chat-citations/deep-linked-citations) ·
[Deep-linked citations, developer guide](https://developers.glean.com/guides/chat/deep-linked-citations) ·
[How Glean accesses information](https://docs.glean.com/user-guide/assistant/how-glean-accesses-info) ·
[How knowledge graphs work](https://www.glean.com/blog/knowledge-graph-agentic-engine).
Cursor: [Rules](https://docs.cursor.com/context/rules) ·
[Best practices for coding with agents](https://cursor.com/blog/agent-best-practices) ·
[Rules versus memories, community thread](https://forum.cursor.com/t/best-way-to-provide-context-rules-vs-memories/132960).
Claude Code: [How Claude remembers your project](https://docs.anthropic.com/en/docs/claude-code/claudemd) ·
[Memory, localised docs stating the context-not-configuration position](https://code.claude.com/docs/fr/memory).
Obsidian: [You all say the graph is useless, let me show you how to use it](https://forum.obsidian.md/t/you-all-say-the-graph-is-useless-let-me-show-you-how-to-use-it/116738) ·
[What is the point of the graph view](https://forum.obsidian.md/t/whats-the-point-of-the-graph-view-how-are-you-using-it/71316/19) ·
[The power of the local graph](https://thesweetsetup.com/the-power-of-obsidians-local-graph/).

Content was rephrased for compliance with licensing restrictions.

## ChatPRD full-feature walkthrough (Claire Vo, youtube.com/watch?v=-V6bzSwYUZY)

> _Added: 2026-08-24 · Source: full transcript scraped via yt-dlp subtitles_

Competitor named by the founder for the Plan/authoring station. Its whole
model, from the transcript:

**Setup as context.** Profile (name/company/role + AI-drafted bio and
"instructions about you") is always-on context for every generation.
Preferences include feedback personality - "I like it to be mean to me"
ships as professional-and-strict. Templates are first-class: out-of-box
plus import (PDF/paste/manual), team-shareable so an org generates
against one structure.

**The core loop.** Projects hold shared instructions + files; "every
chat in your project populates the knowledge base ... every chat gets
smarter." The help-me-write-a-document flow asks clarifying questions
when context is thin and drafts straight when rich ("it knows so much
about me"), streams outline then document into a split view, follows the
chosen template exactly, and stops at "85 or 90 percent of what you
need" by design. A Google-Docs-style live editor takes AI edits and
chat-driven revisions that stay aware of the document.

**Handoff is the payoff.** One click turns a finished doc into an
optimized prompt sent WITH its supporting documentation to v0 (deepest),
Lovable, Bolt, Magic Patterns. Slack and Linear bots, Drive/Notion/
Confluence export-import, and an MCP client close the ecosystem.

**What validates us:** their "every chat gets smarter" is marketed
exactly where our Brain sits - but their record has no forecast captured
at decision time and no verdict written back against the decision that
caused it. They compound context; we compound graded judgment.

**What to lift:** (1) adaptive interrogation - ask when thin, draft when
rich; (2) the honest 85-90% framing of generated output; (3) per-target
optimized handoff prompts rather than raw links; (4) template sharing
for org-consistent generation. Already ours in stronger form: decision-
time forecasts, verdict write-back, agent-read tools on the record.
