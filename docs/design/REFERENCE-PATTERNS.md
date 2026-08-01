# The reference-pattern library

> _Created 2026-08-01. **Standing rule (founder): research is captured here so it is never done
> twice.** Before researching a surface's reference class, read this file. After researching one,
> add it here in the same session._

**The rule this file serves** (founder ruling 2026-08-01): for each surface, research the best
proven product in that category and lift its **information model and verbs** outright, even close
to literally. Originality is not the goal; an experience customers already know is. Name the
reference and the pattern before building, then express it in our own `--sp-*` primitives and
voice. We copy the model and the verbs. We never copy the visual style.

Unlike the audit files beside this one, **the contents of this file are verified research against
official product documentation**, with URLs. Treat it as reliable.

## The reference class per station

| Station | Reference class | Status |
| --- | --- | --- |
| **Discover** | Sentry issue stream · Linear Triage · Productboard Insights · Enterpret / Unwrap / Dovetail | ✅ researched 2026-08-01, below |
| **Decide** | inherits Discover's triage verbs; Linear's split view | ✅ partially, below |
| **Plan** | Linear cycles / Productboard roadmap | ⬜ not yet researched |
| **Design** | Figma (Dev Mode, prototyping, Make) · v0 · Claude Artifacts · Lovable | 🟡 in flight |
| **Build** | Cursor (Composer/Agent) · Claude Code · GitHub Copilot Workspace · Devin | 🟡 in flight |
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

# DESIGN and BUILD

🟡 **Research in flight as of 2026-08-01.** Covering: Cursor Composer/Agent, Claude Code, GitHub
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
