# The reference-pattern library

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
| **Ship** | changelog and release-notes tooling | ⬜ not yet researched |
| **Learn** | Amplitude / experiment readouts | ⬜ not yet researched |

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
someone comparing against beautifui.dev.

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

**The reference for a gate is not beautifui.dev.** It documents twenty components and none of them
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
