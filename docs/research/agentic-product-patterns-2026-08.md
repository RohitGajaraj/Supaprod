# Agentic product patterns, 2026-08 — what the frontier ships, and the delegation arc we sell into

> _Created 2026-08-26 by MAIN, on the founder's instruction to research truly agentic platforms and
> **store the result so no session pays for this sweep twice**. Complements
> [`new-age-product-development-research.md`](./new-age-product-development-research.md) (which covers
> how frontier teams *build*) — this file covers how their **products behave**, and what the user is
> actually being sold. Citation rule per [`pm-voice-and-ai-tooling-research.md`](./pm-voice-and-ai-tooling-research.md) §12.4._
>
> **Read this before any "make it more agentic" work.** It is the answer to that question, dated.

---

## 1 · The nine products, and the one mechanic worth taking from each

| Product | The mechanic that works | What Supaprod takes | Source |
| --- | --- | --- | --- |
| **Claude Code** | The primary surface is a **transcript**, not a dashboard. Capability is layered — memory, hooks, skills, subagents, plugins, MCP — and each layer surfaces only at the moment it is needed; the user never meets a shelf. Permission mode is an **autonomy dial set once**, not a question per action | Confirms R-13 (left pane is a transcript). The footer is the dial. Connectors and skills are reached at the moment of need, never browsed | [arXiv 2604.14228](https://arxiv.org/html/2604.14228v1) · [Claude Code docs](https://docs.claude.com/en/docs/claude-code) |
| **Codex in ChatGPT** | A command centre with **built-in worktrees**: queue many tasks, each in its own sandbox, results arrive as **separate reviewable pull requests**. Async by default — submit and leave | The multi-run board. The returned unit is always reviewable — a diff, a decision, a spec — never "status changed to design" | [openai.com/codex](https://openai.com/codex/) |
| **Cursor 2.0 / Composer 2** | Parallel tool calling: reads up to 15 files at once before editing; the agent picks its own next steps without step-by-step prompting | Show the fan-out. Five things being read at once is more convincing than any spinner — and it is true | [MarkTechPost 2026-06-10](https://www.marktechpost.com/2026/06/10/ai-coding-agents-development-platforms-2026/) |
| **Replit Agent 4** (2026-03-11) | Parallel execution across isolated micro-VMs, and it **builds *and verifies* before letting you test**. Longer first build, fewer round trips, and users prefer it | **The most important one for us.** See §3.1 | [No Code MBA review](https://www.nocode.mba/articles/replit-agent-v2-review) |
| **Devin** (Cognition) | A persistent environment you watch live and **intervene in at any point** to redirect. A self-debugging loop: read the error, reason about the cause, apply a fix, rerun | Steer without restart. The self-debug loop is exactly what our stations lack — they stall at `MAX_STATION_ATTEMPTS` rather than reading their own failure | [Idlen review 2026](https://www.idlen.io/blog/devin-ai-engineer-review-limits-2026/) |
| **Manus 1.6** | Chat Mode beside Agent Mode: **the user picks how much autonomy this particular task gets** | The footer mode becomes choosable, not merely reported | [Manus review 2026](https://stackbuilt.co/blog/manus-ai-agent-review-2026) |
| **Linear for Agents** | You delegate by **assigning the issue to the agent** — the gesture people already have. Many in parallel, progress monitorable, agents are first-class users | Zero new vocabulary. Never teach a verb the user already knows | [linear.app/agents](https://linear.app/agents) · [Linear docs](https://linear.app/docs/agents-in-linear) |
| **Notion 3.3 Custom Agents** (2026-02-24) | Give it a job, set a trigger or a schedule, it runs unattended. "An unlimited bench of teammates" | This is the `learn` return edge: a scheduled agent that comes back when the horizon closes | [Notion releases](https://www.notion.com/releases/2026-02-24) |
| **Vercel / v0** | Surface craft as a product feature: motion that reports, empty states designed as carefully as the happy path, and **Sandbox SDK** — isolated environments a run can be handed to | The craft bar for every surface, and the mechanism for the first-party build path in [`../strategy/layer-2-build-question-2026-08.md`](../strategy/layer-2-build-question-2026-08.md) | [vercel.com](https://vercel.com) |
| **Linear** *(craft, beside the agents row below)* | Speed treated as a feature: keyboard-first everywhere, density that earns its space, no loading state a person waits on, and vocabulary borrowed from what people already say | The interaction bar. **If a surface needs a mouse or a tooltip, Linear would not have shipped it** | [linear.app](https://linear.app) |
| **Amoeba** | "World's first multiplayer IDE." Many coordinated agents on one project: shared visibility, **collision detection**, clear ownership, Mission Control, and *guide / take over / spawn parallel help* | The multi-agent surface, close to verbatim. Their framing — agents "split" duplicate work rather than repeating it — is the value line | [useamoeba.com](https://useamoeba.com/) |

**The cross-cutting design finding:** agent UX is now its own discipline, and the teams shipping well
treat the interface as **the accountability layer between user intent and autonomous action**, not a
skin applied after the model works. Four things every one of them does: say what it is doing, explain
why, offer an override at every step, and recover legibly from error.
([Fuse Labs, agent UX 2026](https://fuselabcreative.com/ui-design-for-ai-agents/))

---

## 2 · The persona, restated 2026-08-26 — the delegator, not the operator

**Founder's framing. CORRECTED 2026-08-26 — an earlier draft of this section said these six replace
the station names on screen. That was wrong and the founder rejected it. The stations (Discover,
Decide, Plan, Design, Build, Ship, Learn) stay exactly as they are. These six are things an AI
teammate must be able to DO, and the founder was explicit that the list is open:**
*"If I have to deliver my work and the entire thing is taken care of by AI teammates, they have
to assign, manage, operate, value-audit, review and ship."*

The user is **the person accountable for an outcome who is not doing the work — the work is done by a team of AI teammates.** That is a different
person from the one the seven-station model was drawn for. They do not walk a lifecycle; they run a
team they do not want to micromanage. **Six verbs, and every one of them is a gesture the user
already has from managing people.**

| Capability | What the user does | What the product must make trivial | Where it lives |
| --- | --- | --- | --- |
| **Assign** | Hands over a piece of work | One sentence, no project, no config, no connector picked first. The gesture is Linear's: give it to someone and walk away | `/start`, and assignment from anywhere a piece of work appears |
| **Manage** | Sees who has what, what is stuck, what is colliding, what to reprioritise | One glance answers: what is running, who owns it, what changed in the last minute, where two efforts overlap. Amoeba's collision detection is the bar | The multi-run board |
| **Operate** | Sets the boundaries once, then leaves | A stated authority — spend ceiling, blast radius, tool set, expiry — set once and widened by class, never re-asked per action. `resolveApprovalPolicy` and `autonomy-policy.ts` already exist with zero callers | The footer sentence, one settings page |
| **Value audit** | Asks whether it was worth it | Cost and time against what was promised at the outset. This is the forecast made operational: predicted beside actual beside what it cost | The decision record, and the verdict |
| **Review** | Looks at what came back and responds | A reviewable unit — a diff, a spec, a decision, a preview — with approve, send-one-instruction-back, and undo-a-step in place. Never a status change to acknowledge | The right pane of the run |
| **Ship** | Lets it go out | Gated by proof, not by a click (R-27). The person holds at most one gate and it is the irreversible one | Ship, and the deploy record |

**Why this matters more than it looks.** The seven stations are how the *machine* moves work; these
six are what the *team* must be able to do. Both are true at once and neither replaces the other. The
open capability register — including the eleven further capabilities the teammates need and mostly do
not have — lives in
[`the-first-run/OPERATING-MODEL-5-SESSIONS.md`](../../the-first-run/OPERATING-MODEL-5-SESSIONS.md) §11.
A user who has managed a person should be able to operate this product without being taught anything.

**The line that follows from it:** *give the work to the team, set what they may spend and touch, and
get back something you can actually review — with what it cost, and whether it did what it said.*
No category words, no "agentic", no "autonomous". The behaviour names itself.

---

## 3 · The three things every one of them does that Supaprod does not

### 3.1 They verify before they hand over

Replit builds and tests before you see it. Devin reruns until green. Codex returns a pull request that
already passed checks. **Supaprod's stations produce and advance regardless of whether what they
produced is any good.** That is the mechanism behind the `sense` graveyard and behind three months of
`entry_station='sense' AND station='learn' AND waived='[]'` returning 0.

**The change it demands:** every station gains a self-check before it may hand on, and a station that
fails its own check retries with the failure in context rather than advancing or dying at the attempt
ceiling. This is Devin's self-debug loop applied to the spine. **It is the highest-value single change
available to this product**, and it is a `src/lib/spine/**` change, so S0 owns it.

### 3.2 They let you leave

Async is the default and the result comes to you. Gemini's line is the model: *"I'm on it — you can
leave this page in the meantime."* Supaprod currently requires a person to sit and watch a run and
calls that visible agency. **Visible must not mean mandatory.** The work must be watchable and also
leavable, with the result arriving where the person already is.

### 3.3 They borrow a gesture the user already has

Assign an issue. Review a diff. Merge a pull request. Set a budget. We invented seven station names
and put them on screen. **If a surface teaches vocabulary, it has already lost the sixty seconds.**
§2's six verbs are the fix.

---

## 3.5 · The strongest objection to multi-agent visibility, and the answer

Raised publicly under a multi-agent demo (practitioner `@ishpaul_777`, 2026-08-26): *"an agent will
burn more tokens thinking about what other agent is doing than actually working on the task; git
worktrees is the right solution, not giving the agent more context which is task-unrelated."*

**Correct about agents, wrong about people, and the distinction is load-bearing:** isolation is for the
worker, visibility is for the human. A teammate never reads another teammate's transcript — that is
context pollution and token burn. The human reads all of it at once, rendered from rows that already
exist, costing the agents nothing because they are not participants in it. Collision detection is a row
comparison, never a model call; **the moment it needs one, it is wrong.** And what one teammate
genuinely needs from another is the **artifact** — the spec, the diff, the signals — never the
narrative. Full constraints, with the checks S4 runs against them:
[`../../the-first-run/SPEC-MULTIPLAYER-PRESENCE.md`](../../the-first-run/SPEC-MULTIPLAYER-PRESENCE.md) §2.5.

---

## 4 · What this does NOT change

- **The forecast at decision time remains the moat**, unchanged by any of the above. None of the nine
  products captures what a team believed would happen before the outcome was known. Cursor, Copilot,
  Devin, Codex and Claude Code all keep permissions in a config file and never mention them again at
  runtime — the near-miss is invisible everywhere else.
- **The brain stays future-tense** until one real learning exists (R-06, F-70). Notion's "unlimited
  bench of teammates" is a capability claim; ours would be a memory claim, and we have no memories yet.
- **Nothing here licenses new surfaces.** Every mechanic above lands on a surface that already exists
  or replaces one that does. 119 routes is the disease, not the runway.

---

## 5 · Sources

[arXiv: Dive into Claude Code](https://arxiv.org/html/2604.14228v1) ·
[OpenAI Codex](https://openai.com/codex/) ·
[MarkTechPost, AI coding agents 2026](https://www.marktechpost.com/2026/06/10/ai-coding-agents-development-platforms-2026/) ·
[No Code MBA, Replit Agent](https://www.nocode.mba/articles/replit-agent-v2-review) ·
[Idlen, Devin review 2026](https://www.idlen.io/blog/devin-ai-engineer-review-limits-2026/) ·
[StackBuilt, Manus review 2026](https://stackbuilt.co/blog/manus-ai-agent-review-2026) ·
[Linear for Agents](https://linear.app/agents) ·
[Notion 3.3 release notes](https://www.notion.com/releases/2026-02-24) ·
[Amoeba](https://useamoeba.com/) ·
[Fuse Labs, agent UX 2026](https://fuselabcreative.com/ui-design-for-ai-agents/) ·
[Augment Code, open-source agent orchestrators](https://www.augmentcode.com/tools/open-source-agent-orchestrators) ·
[Nimbalyst, git worktrees for coding agents](https://nimbalyst.com/blog/git-worktrees-for-ai-coding-agents-complete-guide/)
