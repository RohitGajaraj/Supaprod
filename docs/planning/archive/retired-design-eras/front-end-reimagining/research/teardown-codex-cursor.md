# Teardown: OpenAI Codex (app) and Cursor (2.x/3.x) - mid-2026 state

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Research stream for the front-end reimagining (charter: `../problem-statement.md`).
> All product claims below verified against mid-2026 web sources (listed at the end). Focus: how an agent-session product presents tasks/sessions, the composer, live progress, diffs/terminal, visibility while agents run, review/approve flows, onboarding, keyboard model, and what makes each feel zero-learning-curve.

## 1. What each product is now (mid-2026)

**OpenAI Codex** is no longer one tool but a family of surfaces sharing one account: the terminal CLI, an IDE extension, a cloud agent that opens PRs, a GitHub bot summoned by mention, and since late 2025 a dedicated **Codex desktop app** (macOS, Windows since 2026-03-04). OpenAI positions the app explicitly as "a command center for agents, not a chat window." GPT-5.5 is the recommended model; 2026 changelog themes are persisted goals, browser verification, automatic approval reviews, plugin workflows, and stronger permission profiles.

**Cursor** shipped 2.0 on 2025-10-29 (its own Composer frontier model, a multi-agent interface, native browser) and 3.0 in early 2026 (Composer 2, larger background-agent capacity, Agents Window, Design Mode). The editor's navigation was reorganized "around agents instead of files." Background agents run in cloud VMs, work on a branch, and land as PRs while you keep coding; a web dashboard (cursor.com/agents) and an iOS app (public beta, paid plans) control the same fleet from anywhere.

Both products converged on the same shape: **a roster of concurrent agent sessions, each isolated in a git worktree, each ending in a review-and-approve moment.** That convergence is the single most important market signal for Supaprod's Mission Control.

## 2. How tasks and sessions are presented

### Codex app
- **Thread = session.** Each agent runs in its own thread "so context and diffs stay contained." Threads are grouped by **project** in the sidebar; you switch between tasks without losing context. One mental object (the thread) holds the conversation, the plan, the sources, the artifacts, and the diff.
- **Task sidebar** (Platform 26.415, 2026-04): a real-time panel per thread showing (a) the **decomposed plan with current step**, (b) **sources consulted** (files, URLs, context), (c) **generated artifacts as they appear**. Its stated purpose: "a concise overview of the task's state, useful when returning to a thread after a break." That is the re-entry problem solved structurally, not with a summary paragraph.
- **Artifact viewer**: non-code outputs (PDFs, spreadsheets, presentations) render inline in the thread; "inspect the output and request revisions in the same thread." No context switch to see what was made.
- Worktrees are built in and invisible: multiple agents on the same repo, no branch chaos, never surfaced as git plumbing to the user.

### Cursor
- **Sidebar of agents and plans** replaces the file tree as the primary navigation. Each agent card shows what it is doing; you "focus on the outcomes you want while agents take care of the details." One toggle returns you to the classic IDE, so the old mental model is never destroyed, only demoted.
- **Agents Window** (Cmd+Shift+A, Cursor 3): a unified control room across local, worktree, and cloud agents, with live progress, mid-run intervention (edit instructions while running), and kill.
- **Up to 8 parallel agents on a single prompt**, each in "its own isolated copy of your codebase." Also best-of-n: run multiple models on the same problem and pick the winning result. Parallelism is a first-class UI concept, not a power feature.
- Background agents surface identically on desktop, web dashboard, and phone. iOS shows agent status as **lock-screen Live Activities** and sends push notifications "when an agent finishes, needs input, or is ready for review." You can review demos, screenshots, logs, and diffs from the phone and merge the PR there.

**Reading:** both products discovered that the session list IS the home screen. Neither has a dashboard of metrics as the landing surface; the landing surface is "what is running, what needs me, what finished."

## 3. The composer

- **Codex**: one input box per thread. Skills are attached inline with `$skill-name` syntax; slash commands exist; MCP tool approvals are scoped in-line ("allow in this chat" vs "allow across chats"). The composer is also where Automations are written: trigger + prompt + execution mode + skills, all in plain language plus a few pickers.
- **Cursor**: one prompt box; files and directories appear as **inline pills**; the agent "self-gathers context without needing to manually attach it," which shrank the composer's cognitive load dramatically (the old @-mention ritual became optional). **Voice input** with user-defined spoken submit keywords. **Plan Mode** via Shift-Tab: plan with one model, build with another, plan in foreground or background, or spawn parallel plans to compare.

**Reading:** the winning composer pattern in 2026 is: one box, plain language, context self-gathered, escalation modes (plan vs act) reachable by a single modifier, structured objects (files, skills) rendered as pills rather than syntax. This directly validates the charter's "one natural-language input model" and gives it a concrete grammar.

## 4. Live progress and staying visible while agents run

- Codex's task sidebar keeps **plan step, sources, and artifacts** continuously synchronized with the agent's work; you never scroll chat history to find out what happened.
- Cursor's agent sidebar shows per-agent state; the embedded browser lets the agent visibly test its own work; **sandboxed terminals** stream command output but any non-allowlisted command "will automatically run in a sandbox with read/write access to your workspace and no internet access," so watching an agent run feels safe by default.
- Off-screen visibility is treated as part of the product: Cursor uses OS-native surfaces (Live Activities, push) rather than requiring the app to be open; Codex Automations post results into a **Triage inbox** so unattended work is never lost.

**Reading:** "the machine's work always visible" (charter requirement 4) is implemented by both as a *structured* live panel (plan, sources, outputs), never as a raw log. The raw terminal exists one level down.

## 5. Diffs, terminal output, review and approve

- **Codex diff review**: the diff lives in the thread; inline commenting on the diff continues the same conversation; inline **editing inside the diff** (2026); expand/collapse all files; open in external editor for manual surgery; then stage, commit, push, or open a PR without leaving the app. The **PR review pane** pulls GitHub reviewer comments into the app so external feedback becomes agent instructions ("select specific feedback and ask the agent to address it within the same thread").
- **Codex review queue (Triage)**: automation outputs "land in the Triage section of the sidebar. Runs with findings appear as inbox items, filterable by all runs or unread only." Four verbs per item: **Review the diff, Approve (stage/commit/push/PR), Revise (continue the thread), Reject (discard).** This is the cleanest human-gate grammar shipping anywhere today.
- **Cursor review**: aggregated multi-file changes viewable "without needing to jump between individual files"; quick review with drill-down "into the code when you need to"; background agents always terminate in a PR with a work summary, making GitHub's own review surface the final gate.

**Reading:** both companies concluded the approve moment must offer exactly the four verbs above, must show the evidence (diff) in place, and must let "revise" be a continuation of the same conversation, not a new task.

## 6. Onboarding and the zero-learning-curve recipe

Neither product runs an elaborate tour. The observed recipe:

1. **One borrowed mental model.** Codex borrows "chat threads in a sidebar" (everyone knows it from ChatGPT/Slack); Cursor borrows VS Code and lets you flip back to it. New concepts (worktrees, sandboxes, parallelism) are hidden behind familiar ones and never require setup.
2. **First action = type a sentence.** Connect a repo, describe a task, watch it run. The first five minutes contain zero configuration decisions; models, isolation mode, and sandbox level all have safe defaults.
3. **Progressive disclosure of danger.** Sandbox levels (read-only, workspace-write, full access) and MCP approval scopes appear only at the moment an agent asks for more power, phrased as an in-context approval, not a settings page.
4. **Tiny keyboard surface.** Cursor's whole new-world keyboard model is roughly three chords: Cmd+Shift+A (Agents Window), Cmd+D (Design Mode), Shift+Tab (Plan Mode), plus voice. Codex leans on slash commands and `$skills` in the composer. Nobody ships a 40-shortcut cheat sheet for the agent surfaces.
5. **The product teaches by showing its own work.** The live plan panel doubles as instruction: a new user learns what the agent can do by watching the plan decompose.

## 7. Where they are weak (Supaprod's openings)

- Both are **repo-centric and code-only**. The "task" has no upstream (why build this) or downstream (did it land). Supaprod's 7-stage loop is exactly the missing spine; Codex/Cursor are competitors only for stage 05 Build.
- Neither has a **decision memory**. A Codex thread or Cursor agent forgets the product; every task restarts context (Cursor's codebase index is code context, not product context).
- **Triage/review queues are flat inboxes.** Nothing communicates which approval is load-bearing for the roadmap. Supaprod's Approvals tray can rank gates by journey consequence.
- **Parallelism without narrative.** Eight agents running is impressive and disorienting; there is no story of how the eight results compose into one product outcome. The Spine + Thread model can own that narrative.

## 8. What Supaprod should steal

Concrete, implementable recommendations, mapped to the Mission Control anatomy:

1. **Thread-as-container (Codex).** Make every mission/run a single object that holds conversation, live plan, sources consulted, artifacts, and the diff/receipt. Never make the user assemble a task's state from multiple surfaces. In Mission Control: a Thread entry expands to a drawer that carries all five.
2. **The task sidebar triple: plan, sources, artifacts (Codex 26.415).** The Canvas's working state for any running stage should always show (a) the decomposed plan with the current step highlighted, (b) what the agent is reading (signals, tickets, files), (c) outputs appearing live. This is also the re-entry answer: returning to a room after a day must land on this triple, not chat history.
3. **The four-verb gate: Approve, Revise, Reject, Open the evidence (Codex Triage).** Standardize every Supaprod gate card on exactly these verbs. Revise must continue the same thread with a sentence, never spawn a new task. Approve should visibly set agents in motion (the charter's signature moment).
4. **Unread-filterable approvals inbox (Codex Triage).** The Approvals tray gets all/unread filtering and treats each item as an inbox row with the four verbs inline. Add what Codex lacks: sort by journey consequence, not recency.
5. **Composer grammar (Cursor).** One box; entities (products, features, PRDs, agents, journeys) render as pills; the system self-gathers context so pills are optional; Shift-Tab style modifier toggles plan-first vs act; journey chips are the Supaprod equivalent of Cursor's mode toggle. Voice later, but design the submit model to allow it.
6. **Progressive permission asks (both).** Never front-load tool/MCP/approval-mode configuration. Default every agent to the safe mode; when an agent needs more, ask inline with a scoped choice ("allow for this run" / "always for this workspace"), mirroring Codex's MCP approval scoping. The Agents settings page is the ledger of those grants, not the place they are made.
7. **Aggregated multi-file diff with inline comment-to-instruct (both).** The Build face's review view shows all changed files in one scroll, expand/collapse all, and a comment on any hunk becomes an instruction to the agent in the same thread. Steal Codex's "select feedback, ask the agent to address it."
8. **Sandbox badge on terminal output (Cursor).** Whenever the Build face streams commands, show a small badge stating the isolation level (sandboxed, no network / workspace / full). It converts scary terminal output into evidence of safety and answers the trust question before it is asked.
9. **OS-level and away-from-app visibility (Cursor mobile).** Push/notification when a run finishes, needs input, or is ready for review; the notification deep-links to the exact gate card. Live-Activity-style persistent status is the model for the always-on Working strip: state it as "3 agents working, 1 waiting on you," clickable.
10. **Worktree-grade invisibility of infrastructure (both).** Users never see branch names, worktrees, or VM plumbing unless they open the receipt. Supaprod equivalents (BuildDriver runs, model routing, RAG retrievals) stay one click deep, matching the quiet-costs rule.
11. **Best-of-n as a user-facing choice (Cursor).** For high-stakes generative moments (PRD draft, teardown, design direction), offer "generate 2 candidates, pick one" as a chip in the composer. Cursor proved users understand and love model/candidate fan-out when it is one click.
12. **Teach by showing the plan (both).** Skip the tutorial for the working state; the decomposing plan IS the tutorial. Spend the opt-in tour budget only on the room anatomy (Spine, Thread, Canvas, Composer, tray), roughly five stops.

## 9. GAP lines (genuine Supaprod product gaps found via this teardown)

GAP: Supaprod has no mid-run intervention: Cursor lets users edit instructions or terminate an agent while it runs; our runs are currently start-then-wait, with no steer or stop affordance surfaced.
GAP: No inbound feedback loop from shipped artifacts: Codex pulls GitHub PR reviewer comments back into the agent thread as actionable instructions; Supaprod has nothing that turns external review comments (GitHub, stakeholder notes) into agent revise instructions on the originating mission.
GAP: No scheduled automations surface: Codex Automations (cron/webhook/manual trigger + prompt + isolation + skills) landing in a triage inbox is a shipped pattern; Supaprod's loop has no user-creatable recurring agent task with results routed to Approvals.
GAP: No away-from-app notification channel: neither push, email digest, nor deep links exist for "an agent finished / needs you," which caps the async value of a gate-based product.
GAP: No artifact viewer contract for non-code outputs: threads cannot inline-render PDFs/decks/sheets an agent produces; the CanvasFace covers stage faces but not arbitrary artifact preview inside the Thread.
GAP: No best-of-n candidate generation anywhere in the loop, despite the engine's model-routing layer making it cheap to offer.

## Sources

- https://openai.com/index/introducing-the-codex-app/ and https://openai.com/index/introducing-upgrades-to-codex/
- https://developers.openai.com/codex/changelog
- https://learn.chatgpt.com/docs/features (Codex/ChatGPT app feature docs)
- https://codex.danielvaughan.com/2026/04/17/codex-app-workspace-pr-review-task-sidebar-artifact-viewer/
- https://codex.danielvaughan.com/2026/04/08/codex-desktop-automations/
- https://kingy.ai/news/the-codex-app-super-guide-2026-from-hello-world-to-worktrees-skills-mcp-ci-and-enterprise-governance/
- https://dev.to/damogallagher/openai-shipped-a-codex-macos-app-multi-agent-threads-built-in-git-worktrees-3aoh
- https://cursor.com/blog/2-0 and https://cursor.com/changelog/2-0
- https://cursor.com/changelog/ios-mobile-app
- https://baeseokjae.github.io/posts/cursor-3-guide-2026/
- https://www.digitalapplied.com/blog/cursor-3-deep-dive-agents-composer-review-2026
- https://zackproser.com/blog/openai-codex-review-2026 and https://zackproser.com/blog/cursor-agents-review
