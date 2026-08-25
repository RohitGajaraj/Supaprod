# PRODUCT-TRUTH.md — The One Problem We Solve

> **One-page product thesis. Authority: complete.**
>
> **Updated:** 2026-08-25  
> **Locked by:** AUDIT.md findings + 59 track autopsy + founder positioning-locked-2026-08.md

---

## Who the User Is

**The founder who ships.**

Not "product teams" or "engineering leads." The person who decides what happens next — who has said the words "we're going to do X" and is now accountable for whether X actually happened, not just claimed to have happened.

They are burned out because they are:
- **Running code review by committee** — three days to merge, agentic code that is 5.3x longer, and nobody owns the risk. **The PRs stack because humans are the bottleneck.**
- **Grading outcomes in isolation** — "Did we hit the retention target?" is a question they answer today by reading Slack, checking SQL, maybe a spreadsheet. **No artifact says what they believed would happen, recorded before the outcome was known.** If they got it right, they can't prove it. If they got it wrong, they can't learn it.
- **Re-coordinating the same decisions** — Notion says the plan. GitHub shows the code. Slack has the debate. No surface says "here's what we chose to do, why we chose it, how we'll know." Decisions are reconstructed on every reboot.
- **Watching change get lost** — A feature ships. Someone documents it. Documentation becomes stale because the product moved. The change is never traced to the decision that caused it or the outcome it produced.

**They are not confused. They are not lazy. They are running a loop with a broken feedback system.**

---

## The One Painful Job (What They Actually Do Every Day)

**Did the change do what we thought it would do?** And if it didn't, **why**, so next time we can be better.

That job has five gates today, and humans block every one:

1. **Approve the PR** — *"Is this what we asked for?"* A person reads 300 lines of code they didn't write, against a spec that may have changed, against a design they never saw. Three days. Code review is not insight; it's blame avoidance.

2. **Track the deployment** — *"Did this actually ship?"* The fact that code merged and CI passed tells them nothing about whether it reached production or what version is live. They check Slack, or a dashboard, or ask the team. Five minutes of their time, every day.

3. **Wait for the outcome** — *"How did users respond?"* If it's a retention feature, they wait three months. If it's a bug fix, they wait a week. They have no way to know during that time whether the hypothesis was right, wrong, or somewhere between. **They cannot steer because they cannot see.**

4. **Grade what happened** — *"Did we win or lose?"* They read the metric. They compare it to what they predicted. If they predicted, they compare. If they didn't, they guess whether they expected it. **There is no artifact. It is an oral history.** Slack archaeology.

5. **Learn the lesson** — *"What does this tell us about how we work?"* They try. They write a retro. Nobody has time. Or they do, and six months later the team makes the same bet again because **nothing that was learned became accessible to the decision-maker at decision time.** The knowledge was burned into muscle memory in one person's head, or written into a doc nobody reads, or lost when that person left.

**That's the job. That loop is broken.**

---

## What They Suffer Today Without Us

**Guesswork presented as rigor.**

- **Code review by committee instead of code review by evidence.** Every PR is a gauntlet. No person can hold in their head whether a change is doing what it was supposed to do. So they check for style, they check for obvious bugs, and they hope the author understood the goal. **It takes weeks. It costs confidence. People burn out.**

- **Outcome grading that cannot compound.** Every bet is made in isolation. They ask "will this work?" and at some point get "yes" or "no" back. But "yes" from what evidence? "No" because of what, exactly? **They cannot compare outcomes across bets.** They cannot ask "what kind of change succeeds here?" because the traces of past changes — the record of what was predicted, what was observed, what was learned — **is noise in Slack.**

- **No history of what was believed before the outcome was known.** This is the killer. A competitor could steal every line of code, every design, every workflow. But they cannot steal the record of what this team believed would happen at the moment of the call, because **nothing captured it.** It lives in the decision, it lives in the code, it lives nowhere else. And if they could, that record would be worth more than the code, because it's why the code was written.

- **Authority without recourse.** The founder decides. The team executes. But the founder is the only person who can grind through all five gates at the end to know whether they were right. They are not absent from the work; they are overloaded by it. **They are the bottleneck on their own feedback loop.**

---

## What SupaProd Does Instead: The Loop That Closes

**One screen. One sentence. Seven stations. The feedback loop runs.**

A founder types: *"Add dark mode so users on low-light environments don't get headaches."*

The system does the rest:

1. **Sense** — Agent reads signals, clusters them into themes, shows the founder what they know. *"Seventeen users mentioned eye strain. Two asked for dark mode directly."*

2. **Decide** — Founder records the forecast: *"I predict eye strain complaints will drop 40% in markets with less ambient light, and we'll know by October."* This is not filed for later. **It is filed NOW, before the outcome is known. This is the moat.**

3. **Plan** — Agent drafts the spec. Founder edits it once. Non-goals get called out: *"Not supporting custom themes, not persisting across sessions."* This spec is what every later station reads, not the title.

4. **Design** — Agent prototypes. Founder approves or sends back one note: *"Empty state is wrong."* No iteration cycle; design is unblocked the moment it can be.

5. **Build** — Agent writes the code. CI runs. Checks show passing. Diff shows what was written. **This is not a PR review gauntlet; this is the agent showing its work.** Founder approves the diff or stops it. If it matches the spec, it goes forward.

6. **Ship** — The code ships to production. Metrics start flowing in. The deployed commit is recorded.

7. **Learn** — The outcome comes in. *"Eye strain complaints: down 38%. We were right."* This is recorded **against the forecast made in station 2, before the outcome was known.** The system now knows: this founder was right on this kind of change. The calibration can compound. The lesson is wired into the next call.

**No founder touched the code. No person read a 300-line diff. No committee approved anything. No one was waiting to be unblocked. The loop ran in three days, and the result is a decision and its outcome on the same record.**

---

## Why This Is 10x

| Factor | Before | With SupaProd |
| --- | --- | --- |
| **Time to feedback** | 3–12 weeks (wait for outcome) | 2–3 days (forecast recorded, outcome graded on schedule) |
| **Gradeability** | "Did we win?" — answered by re-reading metrics | "Did we win?" — answered by comparing forecast to outcome, with confidence and evidence |
| **Learning compound** | Lessons live in Slack, die with the person | Lessons live on the record, wired into the next decision |
| **Code review** | 3 days, committee, blame avoidance | 30 min, agent, evidence-driven (diffs, checks, spec match) |
| **Authority cost** | Founder runs all five gates (bottleneck) | Founder runs one gate (merge approval) |
| **Replicability** | Decisions are oral history, reconstructed on every boot | Decisions are receipts, traceable end-to-end |

---

## What We Delete (And Why)

**Everything that is not the loop.**

#### Deleted: "Collaboration surfaces"

Chat, comments, threads, @ mentions, reactions. **Collaboration is overhead.** What we need is consent, and consent is asked in place: at the moment a station needs a person's call, not in a side channel where it dies in the backlog. R-01 (founder ruling): *"Consent is asked in place, at the station that raised it, or it does not get answered."* Deleted five UI patterns built to ask approval in threads.

#### Deleted: "Decision library" and "PRD templates"

Every PRD template is an attempt to nail down what a good PRD looks like. But the spec is not the output of SupaProd; it is an input. The agent writes it. The founder edits it. There is no template because there is no decision to be made about form — only about content. Deleted: `decision-library.tsx` (dead code), three template UI patterns, one routing system built to navigate a library that should never exist.

#### Deleted: "Settings and tuning"

SupaProd ships with one config: *"What does this workspace believe?"* That's `workspace_briefs`, and it is filled once at init. Every other "setting" is a disguise for a decision the founder should not be making because it is not theirs to make — it belongs to the loop. *"Auto-publish PRs?"* That is the ship gate deciding, not a toggle. *"How much evidence before proposing?"* That is the sense station deciding. Deleted: 14 toggle patterns, 6 tuning UIs, every "advanced settings" route.

#### Deleted: "Long-form onboarding" and "educational UI"

SupaProd is a closed loop. A founder opens it and they know what to do because every action is the only action that makes sense at that moment. Coach marks are insulting. Feature tours are filler. Help text is what you read when you are lost. Nothing here should make you lost. Deleted: one 14-step onboarding flow, 47 help tooltips, "learn mode" UI (killed), the "demo workspace" that was supposed to teach by example (it taught nothing because the example was fake).

---

## The Shape of the Product (Now)

**Left pane:** Transcript of what the agent just did, what it produced, the handoff. Text. Inline artifacts (a spec, a diff, a decision). The one question, in place. Newest entry at the bottom, still ticking. Live.

**Right pane:** The current artifact. Spec — rendered as readable text. Diff — side by side, human-parsable. Decision — the claim and the forecast. Prototype — in a frame, rendered as itself, not as a link. Deployment — steps with clocks, then what actually went out. Outcome — the metric, the forecast, side by side, one number: win or lose.

**Footer:** What the agent may do right now (running) or is waiting on (your approval). One button: Stop.

**One screen. The person never navigates. The artifact is always the current truth.**

---

## Acceptance: The Loop Runs (Proof)

A person types one sentence.

Without navigating, they watch the work carried from station 1 to station 6.

They answer one question (merge gate).

They are told: "This shipped. It did what you predicted." Or: "This shipped. It did not."

**That is success. Nothing less.**

---

## The Wiring (Current State)

**Stations 1–5:** Fully wired, fully autonomous, proven by AUDIT.md findings. Sense, Decide, Plan, Design, Build all run unattended.

**Station 6 (Ship):** Wired, gated on human merge approval (correct). ci-poll-tick auto-deploys preview. Track member would be written once publish fires.

**Station 7 (Learn):** Wired, unreachable only because no track has shipped yet (time + deployment). Mechanics are built; no trigger needed.

**What's missing:** F-25 (parallelism) and F-26 (continuous watch) make it unwatchable. The loop runs; watching it is painful. Fix those, then optimize.

**Proof path:** Start one track in harbor. Run through 5 stations. Approve merge. Watch ship. Verify track_members written. Done.

