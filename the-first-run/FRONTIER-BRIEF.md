> _Director's brief, 2026-08-25. Produced by a four-agent workflow: how the frontier labs
> actually ship, a user-lens validation against our own corpus, and a search for unclaimed
> positions. **It refutes MAIN LANE's ruling R-01 and one claim in `REIMAGINING.md`.**_

# DIRECTOR'S BRIEF — 2026-08-25

---

## 1. IF ANTHROPIC SHIPPED SUPAPROD

**The governing observation.** Anthropic shipped the ticking checklist, measured it, and then turned it off. `TodoWrite` is "**Disabled by default** in favor of `TaskCreate`, `TaskGet`, `TaskList`, `TaskUpdate`" ([tools-reference](https://code.claude.com/docs/en/tools-reference)), and on current models "**Claude keeps track of multi-step work without a written checklist, and Claude Code doesn't provide the tools that fill this list, so it stays empty**" ([interactive-mode](https://code.claude.com/docs/en/interactive-mode)). The progress UI everyone copies was scaffolding for a weaker model. Not one frontier agentic product renders a lifecycle coordinate.

**What is on screen.**

- One text box, on the surface the person is already on. Rewrite `src/routes/_authenticated.today.tsx` to `PageHeading + RunComposer + JobCards + YourRuns`, exactly as `SPEC-ONRAMP.md` §1.2 specifies, and let the run begin in that same view.
- An append-only stream of what the agent did, with the thing it made rendered inline at the moment it is made. Antigravity states the reason: "**You do not need to carefully monitor every individual tool call or step synchronously; instead, you review high-level deliverables at key milestones**" ([artifacts](https://antigravity.google/docs/artifacts)). That is backlog item 3, and it is the only item in the top five nobody can argue with.
- A footer that carries **mode**, not position. Claude Code's footer says `⏵⏵ accept edits on`, `⏸ plan mode on`, and a PR link with a coloured underline for review state. It never says step 3 of 7.
- The ask sitting in the stream, in front of the call it blocks, answerable with one key, where one of the answers is permanent — "Yes, and don't ask again" writes a durable rule to `.claude/settings.local.json` scoped to that repository and command ([permissions](https://code.claude.com/docs/en/permissions)).

**What is deleted.**

- `/approvals` as a destination. In all six shipped systems the agent physically cannot proceed past the ask, which is what makes it get answered. An approval capable of expiring was never in the path of anything, and 38 of the 90 expired.
- The seven-row station display, i.e. backlog item 5. This is the exact element Anthropic removed. Keep a single line naming the current action and the last thing produced.
- The briefing dashboard. `DESIGN-DIRECTION.md` already called it "a beautiful read-only status board for a machine you cannot touch."
- Most of the 48 redirect routes (I count 50 of 85 files under `src/routes/_authenticated*` containing a redirect). Symphony's non-goals list "**Rich web UI or multi-tenant control plane**" and "**Prescribing a specific dashboard or terminal UI implementation**" ([SPEC.md §2.2](https://github.com/openai/symphony)). They rented Linear's board rather than build one.
- The `track` record created before the person has had anything. Antigravity was the only product in the set that required a container object first, and in 2.0 it shipped the bypass — "**Conversations outside of projects** — Start quick, one-off conversations outside of any Project" ([features](https://antigravity.google/docs/features)). They built it, measured it, and added the escape hatch.

**The first sixty seconds.** Land on a box. Type a sentence, or click one of four job cards. The run starts in the same view — no navigation, no configuration, no workspace picker. The first tool call renders within seconds and the first artifact renders where the tool call is. If it needs a person, it asks there, once, and the answer covers the class. If nobody is there, it does not stall: Claude Code's unattended path denies and continues — "**the action doesn't run and Claude keeps working… Claude Code doesn't stop the run**" — and a classifier answers in the human's place, backed off after "3 times in a row or 20 times total".

**One correction to the framing.** Wispr Flow is not the short-onboarding example. Its setup is the **longest** in this set — seven steps, "**Most people are set up in about 5 minutes**" ([setup guide](https://docs.wisprflow.ai/articles/3152211871-setup-guide)). What it spends those five minutes on is rehearsal of one gesture, ending in unassisted practice, with an explicit "Skip onboarding". What it buys is a product with no destination — "Hold down your shortcut key in any app to dictate." The lesson is not *shorter*. The lesson is *ends with the person performing the core act alone, and then has nowhere to go back to*.

---

## 2. THE USER, IN ONE SENTENCE

**The corpus cannot support the sentence this product is built for, and that is the finding.**

There is no place in 679 documents where a named person, unprompted, describes the problem Supaprod exists to solve. `docs/research/customer-voice.md:5` says it in the repo's own words: "We have run **zero first-party discovery interviews**." The three closest quotes all ask for something else:

- u/southasianhero — "I've been using cursor and chatgpt enterprise but **work is still disconnected**." Wants connection.
- u/1029394756abc — "**this is completely out of my wheelhouse to just figure it out**." Wants setup done for him.
- Sarah, chatprd.ai/reviews — "better to be down on paper **for someone else to potentially action** than for me **to leave and loose a a few years worth of knowledge**." Wants handoff and departure cover. She never asks whether she was right. `REIMAGINING.md:160` cites this as proof the record of intent is the missing artifact. It is not. It is the one external quote the moat rests on, and it says something different.

**The one sentence the evidence does carry, and it belongs to someone else.**

> "An agent wrote this and I have to merge it, and I cannot tell from the diff what it was supposed to do."

That person is the tech lead in `RULINGS.md` R-05 and `REIMAGINING.md:102`. The pain is measured by third parties: review time +441.5% while throughput rose 33.7% across 22,000 developers (Faros AI); agentic PRs 5.3x longer pickup (LinearB 2026). It is the only pain in the corpus with a number we did not generate ourselves.

**What would produce the missing sentence.** Send the 25 messages in `docs/pitch/design-partner-kit.md`. The kit was verified live 2026-07-10 and shows **0/25 sent** — 46 days. `market-validation-2026-08.md` §7.1 already wrote the test and the standard: "five to ten first-party conversations with buyers who have a budget line, or one signed pilot. **Nothing in secondary research substitutes for this.**" Ask one question that only somebody with the problem can answer: *the last time an agent's output landed on you, what did you have to reconstruct before you could accept it?* Nothing you build this week changes what you know. Those messages do.

---

## 3. THE VALIDATION

| # | Item | Verdict |
|---|---|---|
| 4 | Starting a track lands you on it | **Ship first.** One line at `TrackStart` (`_authenticated.plan.index.tsx:893`). `/track/$trackId` has zero inbound links in the repo — the only way to reach the product's one address is to type a UUID (`SPEC-ONRAMP.md` §0.3). Items 1, 3 and 5 all render on a route no human can reach. It is ranked fourth and it gates the other three. |
| 3 | The artifact pane | **Ship.** The only item whose absence a user would name unprompted, and it serves both candidate buyers identically. |
| 2 | Landing becomes 4 job cards | **Ship, after the workspace fix.** Card 1's sub says "It reads your sources first." A track with `workspace_id = null` has no sources, and `SPEC-ONRAMP.md` §0.2 says every UI-started track is one. Shipping the card before the fix is advertising a call the server function cannot make. |
| 1 | Inline consent card | **Cut as specified.** R-04 justifies it with the 90 dead gates. `ROOT-CAUSE.md`, same folder, same day, traces those 90 to a `resolveToolMode` defect and concludes "**the gate is closed: this tool is not gated today**." The residue is 9 tracks frozen against gates the system would no longer raise — one UPDATE, not a component. Build an inline ask when something actually asks, which today it does not. |
| 5 | The run's step list | **Cut.** It is founder-sourced (R-08); no practitioner in the 25-person cohort, in `customer-voice.md`, or in the 5.9M-word sweep asks to watch an agent work. It is also the precise element Anthropic disabled by default. And with 45 of 59 tracks unmoved since 2026-08-21, it would render a frozen list. The real defect behind R-08 — 9 tracks held `waiting-on-a-person` with 0 attempts, "the product decided it needed a human, stopped, and never told anyone" — argues for a notification, not a seven-row display. |

**What replaces item 5.** `src/components/meridian/run-rows.tsx` is 23,407 bytes and is the one Meridian file with no importer outside its own module and tests (I verified all 47 files). Mount it as a single current-action strip. Do not build a second one.

---

## 4. THE ANGLE WE ARE MISSING

**Sell the bounded mandate, not the record of a decision.**

Anthropic put the number on it: developers "use AI in roughly 60% of their work, but report being able to 'fully delegate' only 0–20% of tasks" ([2026 Agentic Coding Trends Report](https://resources.anthropic.com/2026-agentic-coding-trends-report)). That 40-point spread is the largest unpriced thing in agentic delivery. The product is: an agent gets a stated authority — a spend ceiling, a blast radius, a tool set, an expiry — acts inside it without asking, and comes back with what it did, what it cost, and what it expected to be true. The forecast survives, but it stops being the pitch and becomes the mechanism by which the authority widens or narrows.

**Why it is defensible.** GitHub's agent control plane went GA on 26 Feb 2026 with `actor_is_agent`, `agent.task` session events, and enterprise agent definitions ([changelog](https://github.blog/changelog/2026-02-26-enterprise-ai-controls-agent-control-plane-now-generally-available/)). It records what happened. It carries no pre-execution approval, no per-agent permission grain, and no notion of authority changing on evidence. HumanLayer raised $500K pre-seed selling the SDK for *asking* — decorators, Slack/SMS routing, timeouts. Nobody sells the policy that decides *whether to ask*.

**What we already have, and this is the part that should change your night.** The policy is written. `src/lib/ai/approval-policy.ts:230` — `resolveApprovalPolicy` — is the module whose own header says "a long approvals queue is a policy failure to surface, not a workload to render", carries the demotion invariant ("nothing a record contains can return a laxer decision than the axis default"), and cites the measured case: "53 pending approvals, 39 of them over a day old, 14 missions blocked, the oldest standing at 627 hours. Read against the record, only 26% of all 313 approvals ever raised were for something a human genuinely had to rule on."

**It has zero callers.** The only reference to it anywhere in `src/` outside its own file is line 281, inside the same module. The live path is `resolveToolMode` (`loop.server.ts:170`) → `resolveApprovalMode` (`trust.server.ts:225`) plus risk floors, and it never consults the policy. The strongest asset in this repo is an import statement away from being real. `MERIDIAN-ADOPTION.md` already names this, in one clause, and nothing downstream moved: "`resolveApprovalPolicy` has zero callers."

Alongside it: `src/lib/autonomy-policy.ts` (the two autonomy thresholds lifted into workspace policy with an escalate-only carve-out); `agent_runs.mission_spend_cap_usd / mission_token_cap / halted_reason / failure_kind / attempt`; `agent_approvals.escalation_state / escalated_to / expires_at / snoozed_until`; `trust.server.ts` `Arc` at four rungs with `resolveApprovalMode` composing tool mode against it. That is a mandate engine. Four companies would need six months. It is built and unplugged.

**What would have to be true for this to be wrong.**

1. GitHub adds pre-execution approval and per-agent permissions to Agent HQ within two quarters. They have the audit log, the session events and the policy API. One changelog entry. Most likely killer, and free to check.
2. Buyers post-Kiro want a brake, not an enabler. A brake is a compliance line item at a tenth the price.
3. Track record does not predict. Models version weekly; if standing has no forecasting power the mandate cannot earn its own expansion.
4. The click permanently belongs to Slack and the PR, and a separate application never gets it. Your 0-of-90 is the first datapoint on that side.
5. **New, and specific to us.** The engine reads a record of past answers. Ours is empty of real ones — 313 approvals raised, zero ever approved. Its own first rule is `record.approved === 0 && record.rejected >= APPROVAL_DEMOTE_N → disabled`. Wire it against today's data and it has nothing to widen on, and on any reading where a cancellation counts as a refusal it starts switching tools **off**. The mandate cannot begin from this history. It begins from the first workspace that actually answers.

Test 1 and 4 first. Neither requires building anything.

---

## 5. WHERE YOU ARE STILL WRONG

Separate from what you were already told — that the forecasts are all agent-authored, that none are graded, that Cloverpop is unnamed, that the product is over-built.

**a. You are running a strategy review on a product that has never run once.** Four unwiring defects, each with a line number, and none of them strategic:

- `startTrackCore` accepts `workspaceId` (`track.functions.ts:248`) and writes it (`:272`). The server function wrapping it validates only `title, shape, origin, productId, projectId` (`:294-303`) and passes no workspace (`:305-313`).
- `driver.server.ts:674` — `if (!row.workspace_id) return null;` — Build can never create a mission.
- `driver.server.ts:844` — `externalEvidence` returns `null` on a null workspace, and `:826-829` says null is read as *not satisfied*, so Discover starves and escalates.
- The agent prompt carried no date until tonight's `loop.server.ts` fix, so `decision.record` refused every forecast horizon as past.

Any one of these ends a track. All four were live for the whole three months. "59 tracks, zero reached learn" is not a signal about the seven-station model, about the market, or about the moat. It is the measurement of a track that could not physically leave station one. Do not let a strategy conclusion be drawn from it, including by you.

**b. The gate fired on exactly the wrong tool, and you have read that backwards.** `defaults.ts:188` sets `release.publish: { mode: "review", enabled: true }` — the single intended gate in the entire loop, and `attach.ts` says why: "a production deploy is irreversible and customers see it, which is the one place a person genuinely belongs." It has **never raised an approval row**. Meanwhile `cluster.trigger`, which four independent sources in this repo say must never be gated, raised 90. The queue's whole production history is the reversible tool asking 90 times and the irreversible one asking zero. This is not a queue-placement problem and it is not evidence that people will not answer. It is an inverted gate. Your own doctrine sentence — "a long approvals queue is a policy failure to surface" — described this precisely and the code that implements it was never called.

**c. "Shipping happens outside the spine" is a missing writer, not a philosophical finding.** `deployments` has `changeset_id`, `product_id`, `workspace_id` — no `mission_id`, no `track_id`. The only bridge from a deployment back to a track is `deployments.changeset_id → studio_changesets.mission_id → agent_runs.mission_id → agent_runs.track_id`, four hops with a nullable last one. Nothing writes a `spine_track_members` row at ship because `release.publish` never fires, and `release.publish` never fires because the run never gets there. 42 successful deployments and zero ship members is one absent write, not a truth about where work lives.

**d. Your tiebreaker contradicts the spec you are building against tonight, and you wrote both.** `RULINGS.md:3` — "If any two documents in this repo disagree, this file wins." R-05 names the buyer as "a person accountable for merging output they did not write." `SPEC-ONRAMP.md:60-63` writes card 1 as "I have a problem and I do not know what to build." No tech lead types that sentence. `README.md:140` makes the Critic teardown the front door; `positioning-locked-2026-08.md:95` lists a Critic that renders a verdict on the user's feature under **Refuse to build**. `v11-guiding-star.md:532` diagnosed exactly this in August — "Persona count: 7 vs 2 vs 1" — and today it is five. The persona is not drifting by accident; it widens every time a document is added, and the binding file has not stopped it.

**e. "Earn it" is written and structurally cannot happen.** `suggestArc` (`trust.server.ts:204`) advances an agent on a score whose legs are dead: the approvals leg reads 0 approved of 313; the outcomes leg needs `learnings` joined to `decisions` through `prd_id` with, per `:441`, "no FK exists between learnings and decisions"; the evals leg was a flat constant, documented at `:55-64` as "Agents have been graduating on a constant." Meanwhile `:518` defaults `arc` to `"trusted"` when no autonomy row exists, while `suggestArc` returns `"observing"` under three samples — so the displayed rung and the suggested rung disagree by construction. Separately, `ROOT-CAUSE.md` blames the `"observing"` branch for the 90 gates while the autonomy rows are reported as `trusted`. One query settles which, and it should be run before anyone builds on either.

**f. You write the disproof and do not run it.** Three instances, same shape. `market-validation-2026-08.md` §7.1 names the remedy and 0/25 messages went out in 46 days. `03-customer-discovery-and-validation.md` names S1's kill signal — "They say the rig IS the fun part" — never fired at a named person. `positioning-locked-2026-08.md` §2 calls AI-identity segmentation "the substantive move" and there is no signup field, no product surface, no outreach template, and no line in the discovery doc that segments on it. Four accelerators said no during that window. A locked ruling with no downstream artifact is a belief, not a decision.

**g. One live discrepancy to settle before a lane builds on it.** `src/integrations/supabase/types.ts` types `spine_tracks.workspace_id` as non-null in the Row, while `SPEC-ONRAMP.md` §0.2 states every UI-started track carries null. Given that Lovable has lost `schema_migrations` rows before, the generated types may be stale — but two governing documents currently disagree about the column that gates two stations. One `SELECT count(*) FROM spine_tracks WHERE workspace_id IS NULL` ends it.

---

## 6. THE TEN THINGS TO DO NEXT

1. **MAIN** — add `workspaceId` to `startTrack`'s validator and handler (`track.functions.ts:294-313`); one line, and it unblocks Build and Discover for every track ever started from the UI.
2. **LANE 1** — navigate to `/track/:id` after create (`TrackStart`, `_authenticated.plan.index.tsx:893`); one line, and it gives the product an address a person can reach.
3. **MAIN** — reset the five `given-up` tracks and clear the nine stale `pending_gates`, and paste both statements into the unit file.
4. **MAIN** — drive one track from `sense` to `learn` with every query recorded; it is the only number that changes any conversation you are currently having.
5. **FOUNDER** — send the 25 design-partner messages tonight; zero code, and nothing you build this week tells you as much.
6. **LANE 0** — mount `src/components/meridian/run-rows.tsx` as a single current-action strip and cut backlog item 5's seven-row display.
7. **LANE 0** — ship the artifact pane against `decisions` (item 3); it is the only top-five item a user would ask for unprompted.
8. **LANE 1** — ship the composer and four cards (item 2) once #1 lands, with the forecast-hole line printed from the route.
9. **MAIN** — import `resolveApprovalPolicy` at `loop.server.ts:170`, move the ask into the run, and stop `/approvals` being a destination; cut item 1's card until something actually asks.
10. **MAIN** — write the `spine_track_members` row at ship from the deployment, then grade one forecast so the arc has a real leg to stand on.
---

# MAIN LANE's verification — three claims in this brief are FALSE

_Checked against production 2026-08-25 02:2x, before any lane could build on them. The brief is
excellent and most of it holds; these three do not, and one of them undercuts its own §4._

```sql
SELECT count(*) FILTER (WHERE workspace_id IS NULL)  AS null_workspace,   -- 0
       count(*)                                       AS total_tracks,     -- 59
       (SELECT count(*) FROM agent_approvals WHERE tool_name='release.publish')      AS publish_asks, -- 0
       (SELECT count(*) FROM agent_approvals)                                        AS all_approvals, -- 323
       (SELECT count(*) FROM agent_approvals WHERE status IN ('approved','executed')) AS ever_approved -- 120
FROM spine_tracks;
```

**1. "Every UI-started track carries a null workspace" — FALSE today.** `workspace_id IS NULL` is
**0 of 59**. The generated types are right and `SPEC-ONRAMP.md` §0.2 is wrong. **The code defect may
still be real but latent**: `startTrack`'s validator genuinely does not accept `workspaceId`
(`track.functions.ts:294-313`), so a track created through that path *would* land null — there just
are not any yet, because every existing track came from the promotion sweep, which does pass it.
**Fix it before the on-ramp ships, not because rows are broken now but because item 2 and item 4 will
start creating tracks through exactly that path.** Its ranking as the #1 action is wrong; its
substance is right.

**2. "313 approvals raised, zero ever approved" — FALSE, and this one matters most.** **120 of 323
approvals have been approved or executed.** People answer approvals here 37% of the time. The
zero-approval figure is true of **`cluster.trigger` alone** (90 raised, 0 approved), which is my own
measurement generalised past its evidence.

**This undercuts §4's killer caveat #5.** The mandate engine's record is *not* empty, so
`resolveApprovalPolicy` would not start switching tools off, and it has 120 real answers to widen
on. **The angle in §4 gets stronger, not weaker.** It also means the 0-of-90 is not evidence that
people will not answer — it is evidence that *this one gate* was inverted, which is the brief's own
finding (b).

**3. "`release.publish` has never raised an approval row" — TRUE, and confirmed: 0.** The single
intended gate in the loop, on the one irreversible act, has never fired — while a tool four sources
say must never be gated raised 90. **The gate is inverted.** This is the sharpest finding in the
brief and it survives checking.

## What I am NOT overturning

R-01 (stations as a progress display) is **challenged, seriously**, by §1: Anthropic shipped the
ticking checklist, measured it, and disabled it — *"Claude keeps track of multi-step work without a
written checklist."* That is real evidence against backlog item 5 and I have not dismissed it.
**But it is a founder-level call about what the product IS**, not a defect to patch at 02:30 while he
sleeps, and R-09 says anything irreversible waits. **Item 5 is moved to BLOCKED pending his ruling**,
with this brief as the argument against it. Items 1–4 do not depend on it.
