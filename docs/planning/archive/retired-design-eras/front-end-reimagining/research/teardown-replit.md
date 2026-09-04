# Teardown: Replit Agent (Agent 4 era, mid-2026)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Research stream for the front-end reimagining (Phase R). Written 2026-07-19 from live web sources, not training memory.
> Current state verified: **Agent 4** launched 2026-03-11 ("Built for Creativity"); effort-based pricing rolled out to all users June 18 to July 2, 2026; Design Mode replaced by the Design Canvas; the old Autonomy Level setting has been removed. Sources listed at the end.

## Product snapshot

Replit is the prompt-to-app platform: describe an app, the Agent plans it, builds it, tests it in a real browser, and ships it, all inside one workspace (chat pane + editor + live preview + shell). Agent 3 (Sept 2025) was the autonomy release: 200+ minute unsupervised runs with self-testing. Agent 4 (March 2026) deliberately reversed the framing: "put human creativity at the center." Its four pillars: Design Freely (infinite canvas, parallel design variants), Move Faster (parallel sub-agents with visible progress), Ship Anything (web, mobile, slides, data apps in one project), Build Together (multi-user requests, agent-coordinated). That arc, autonomy first, then re-centering the human, is the exact arc Supaprod's charter already commits to (humans decide at gates), so Replit's current UI is a preview of where every agent product converges.

---

## 1. Agent management UX

### What Replit does

- **Autonomy levels are gone.** The four-level Autonomy Level selector (Low/Medium/High/Max) that shipped with Agent 3 has been removed from the Agent settings dropdown. What replaced it is outcome-named modes plus per-request toggles:
  - **Modes (top-level selector):** Lite ("Optimized for quick edits"), Economy ("Optimized for cost"), Power ("Optimized for capability"). Note the naming: each mode is named for what the user gets, never for the mechanism.
  - **Per-request toggles under the mode selector:** **App Testing** (agent tests the app in a browser, on by default), **High effort** ("most capable frontier models" with "deeper, more deliberate reasoning", may cost up to ~2x, Economy and Power only), **Turbo** ("2.5x faster responses", about 2x cost, Pro/Enterprise only).
  - **Code review is no longer a setting.** It became automatic and mandatory; the configurability was removed.
- **Custom Instructions** (Pro/Enterprise): always-on workspace-level guidance, set in Workspace Settings, then Customization. "Write them once, and the Agent applies them to every project in the workspace, automatically." Used for team conventions: secret handling, code style, compliance.
- **Skills**: contextual instruction sets that load only when relevant. Each skill is a folder with a `SKILL.md` (name, description, instructions; the description "is the only thing the agent reads when deciding whether to use a skill"). Users can upload skills, write them, or have the Agent write them conversationally. Invocation is automatic by relevance, or manual via `/skill-name` or a "+" button in the chat composer.
- **How the agent reports what it did:** every request ends in a named checkpoint summarizing the completed work; after a test pass "the Agent will reply back with a summary of its tests, and fix any issues that it detected"; a completed Agent 4 task presents "the work log, test results, and a live preview of the changes" for review.
- **Voice Mode** (June 2026): tap the microphone in the Agent chat box, speak the prompt, Replit transcribes to editable text.

### Read for Supaprod

Replit tried the "autonomy slider" and retired it within two product generations. The stable shape is: a small set of outcome-named modes, plus at most two or three per-request toggles, plus automatic non-negotiable quality steps. The Custom Instructions vs Skills split (always-on workspace knowledge vs load-on-demand task knowledge) is a clean, proven information architecture for charter requirement 9 (agents manageable: skills, tool grants, approval modes, workspace + per-product knowledge).

## 2. Checkpoints and rollback

### What Replit does

- A **checkpoint** is "a complete snapshot of your Replit App state created automatically by Agent at key development milestones." It bundles: project files, the AI conversation context, environment configuration, **Agent memory** ("the AI's understanding of your project architecture and patterns"), and database contents at that moment.
- Checkpoints surface in three places: the Agent chat (inline cards with descriptions and a rollback option), the Git pane (as real commits), and a **History view** (timeline icon in Agent chat showing the whole progression).
- **Rollback flow:** find the checkpoint, click **Rollback to here**, review a rollback warning, confirm. Everything after that point is removed. **The database is excluded by default**; restoring it is an explicit opt-in under "Additional rollback options." Production databases are never touched by this flow (separate point-in-time restore).
- **Roll-forward exists.** The timeline is bidirectional; if you rolled back too far you can move forward again, until you make new changes, at which point the abandoned future becomes an alternate branch.
- **Checkpoint = billing unit.** One checkpoint per request; the checkpoint card is where the cost of that unit of work attaches (see section 3).

### Read for Supaprod

Replit's core trust primitive is that **the unit of agent work, the unit of narrative, the unit of undo, and the unit of billing are the same object**. One card in the conversation is simultaneously "here is what I did," "click to un-do all of it," and (one hover deeper) "here is what it cost." Supaprod's pass/receipt model should adopt exactly this collapse: a receipt is not just a record, it is a restore point.

## 3. Cost disclosure (feeds the cost-quiet pattern)

### What Replit does

- **Effort-based pricing:** each completed request produces one checkpoint billed by the effort (time and computation) it took. Simple edits typically under $0.25; complex builds bundle into one larger checkpoint. "One checkpoint per request eliminates intermediate checkpoints and reduces billing noise."
- **Where cost appears, layer by layer:**
  1. **Inline in chat: no figure.** The checkpoint card carries a small usage icon, not a price.
  2. **Hover:** "View costs for individual checkpoints by hovering over the usage icon" in the Agent tab. Cost is one deliberate gesture away, never ambient.
  3. **Usage page** (`replit.com/usage`): itemized billing for the period across Agent and all other services.
  4. **Controls in Account, then Billing:** usage alerts (notify at spend thresholds) and budget limits ("Set hard caps to prevent unexpected charges").
- **When cost appears:** only after the checkpoint completes and is debited. There is no pre-quote and no live meter during the run. High effort and Turbo state their multipliers ("up to ~2x", "about 2x") at the toggle, which is the only forward-looking cost signal in the product.
- **The criticism to learn from:** third-party reviews call this "Replit's effort-based pricing casino" specifically because "you don't see the price until after the checkpoint is created and debited," and the docs admit charges can occur "even if there's not a checkpoint shown." Quiet became opaque at the two points where money moved without a visible artifact.

### Read for Supaprod

Replit independently converged on the founder-mandated pattern: no inline figures, detail one click (one hover) deeper, itemization on a dedicated page, caps in settings. Steal the three-layer disclosure exactly. Avoid the two trust leaks: never charge credits without an artifact that names the work, and give any expensive toggle an honest relative label ("up to 2x") rather than either a scary live meter or silence.

## 4. Work visibility while the agent runs

### What Replit does

- **Workspace anatomy:** Agent chat pane on one side, live preview (or, when building automations, an admin test dashboard) on the other; editor, shell, Git, and every other tool are tabs/panes the user can open but is never forced into. "Splits" make the whole layout user-composable. Novices can live entirely in chat + preview; experts pull up code and shell alongside.
- **The task board (Agent 4):** a request is decomposed into discrete tasks with "a title, description, and a detailed plan you can inspect." The user clicks **Accept tasks** or **Revise plan**. Tasks then flow across a four-column board: **Drafts, Active, Ready, Done**, "left to right as it progresses, so you can see at a glance what's planned, what Agent is working on, what's ready for your review, and what's finished." Two projections of the same state: **Thread view** (chat with live status indicators per task) and **Board view** (the kanban).
- **Isolation and merge:** every task runs in an isolated copy of the project; "nothing touches your main project until you explicitly approve it." Completed tasks present work log + test results + live preview, with **Apply changes to main version** or **Dismiss**. Conflicting tasks are flagged and resolved by agent-assisted merge. Core users run 1 task at a time; Pro runs up to 10 in parallel.
- **The agent visibly tests its own work:** with App Testing on (default), "the Agent will periodically decide to test your application. You'll be able to see a browser preview within the Agent pane, showing the Agent's cursor as it clicks around the app," checking buttons, forms, APIs, even logging in through Replit Auth to test the auth flow. It then replies with a test summary and fixes what it found. This runs on a proprietary REPL-plus-browser verification system built to catch "Potemkin interfaces," features that look functional but are not.
- **"The machine is working" feeling:** made felt through motion of cards across the board, live status chips on thread items, the visible test cursor, and streaming narration in chat. Never through raw logs by default; the shell and editor exist for those who want them.

### Read for Supaprod

This is the strongest validation available for the Mission Control anatomy. Replit's chat-plus-preview is the Thread-plus-Canvas; the task board is the Spine made horizontal; Ready-for-review is the Approvals tray; Accept tasks / Revise plan is the gate card. Two lessons stand out: (a) the same work state gets two projections, conversational and spatial, and the user chooses; (b) the single most trust-building visual in the product is the agent's cursor testing its own app, a literal receipt being earned on screen.

## 5. First-run and mobile

### What Replit does

- **Structure before chat.** The first screen is not an empty chat box: app-type options (web app, mobile app, automation, etc.) sit beside the prompt field, plus example prompts. An **Improve Prompt** button rewrites a thin idea into a detailed, agent-friendly spec before anything runs.
- **Plan before build.** The Agent responds to the first prompt with a plan and (for apps) an early visual preview; the user approves or revises the plan before the build starts. Only after approval does the split-screen workspace open. First working preview typically lands in minutes; reviewers consistently cite roughly half an hour to a complete small app.
- **Guided first mobile app:** a hands-on example project ("Pace Mobile," a phone-first running tracker) walks the App Store path before the user commits their own idea.
- **Mobile:** the iOS/Android Replit app supports vibe-coding web apps with the Agent on the phone (chat + preview); full native app builds with Expo previews and guided App Store submission stay on desktop. Voice Mode lowers the entry bar further.

### Read for Supaprod

Replit answers "where do I start, what happens next" by making the first screen a choice of destinations plus a promise of a plan, and by refusing to build until the plan is approved. That is the founder's core test, solved with a plan-gate as the very first gate. The Improve Prompt button is a one-click bridge from vague intent to strong input; cheap to build on the existing runtime.

## 6. Other things worth stealing (enterprise lens)

- **Design Canvas** (replaced Design Mode): an infinite board where every frame is a **live running browser instance, not a screenshot**, interactive at mobile 390x844 / tablet 768x1024 / desktop 1280x720. The Agent spins up four parallel sub-agents to generate design variants side by side; picking one writes it back to the live codebase in a single action. Freehand strokes, shapes, and sticky notes stack on frames as first-class objects; resize, inline edit, and color changes work without triggering a full agent loop.
- **Secrets UX, including its failure mode:** a Secrets pane with App Secrets (per app) and Account Secrets (cross-app, linked per app); values encrypted; the Agent surfaces "a simple UI flow to connect" when an integration needs credentials instead of asking users to paste keys into chat. The documented top failure: workspace secrets do not carry to deployments automatically, the number one cause of deployed apps failing. Supaprod must keep one credential store that every runtime resolves from (the existing `resolveProviderAuth` chain already does this; keep it that way through the rebuild).
- **Deployment rollbacks** exist as a separate, equally one-click surface from the deployments pane, distinct from workspace checkpoints.
- **Package Firewall** (June 2026): malicious/compromised packages blocked at install across package managers, and the Agent "adapt[s] its plan to use safer alternatives when something is blocked." A security control the agent narrates around, not a modal the user must dismiss.
- **Multiplayer (Agent 4):** one shared project, no fork-and-merge; every collaborator gets "their own chat thread, their personal planning space," while all tasks land on the shared board; the Agent sequences and merges. Enterprise adds guest access.
- **Reach:** a Claude connector (create/update/discuss Replit apps from inside Claude), MCP servers, and Agent web search. The agent platform is itself becoming an MCP citizen.

---

## What Supaprod should steal

Concrete, implementable, mapped to the Mission Control anatomy.

1. **Make the receipt the undo.** Every pass/receipt in the Thread is a named restore point: a card with what was done, a "Rewind to here" action behind a confirm-with-warning, a bidirectional timeline view, and data/DB changes excluded from rewind by default with explicit opt-in. One object = narrative unit = undo unit = (hover) cost unit.
2. **Three-layer cost quiet, verbatim.** (1) No figures inline anywhere, a small neutral usage glyph on receipt/mission cards at most; (2) hover or one click reveals that unit's credit cost; (3) a single Usage page itemizes everything; (4) Settings holds threshold alerts and a hard budget cap. Plus the honesty rule: never debit credits without an artifact in the Thread that names the work, and label any expensive toggle with a relative multiplier ("up to 2x"), never an absolute price.
3. **Kill autonomy sliders; ship outcome-named modes plus per-request toggles.** Replit retired its four-level autonomy setting. Supaprod's Composer settings should offer at most: a mode named for the outcome ("Quick pass" / "Standard" / "Deep work"), a "High effort" toggle, and per-tool approval modes kept where they are. Quality steps that should never be optional (self-review, verification) are not settings at all.
4. **Adopt the Drafts / Active / Ready / Done grammar for mission slices**, rendered on the Spine and mirrored in the Thread. "Ready" is exactly the Approvals tray. Give the same state two projections, conversational (Thread) and spatial (Spine/board), like Replit's Thread view vs Board view, and let Accept plan / Revise plan be the first gate card of every journey. This directly answers the founder's "where to start, what happens next" test.
5. **Show the machine testing its own work.** In the Build and Ship canvas faces, render a small live pane where the verification agent drives the built artifact (cursor visible), then posts a plain-language test summary into the Thread as part of the receipt. This is the single highest-trust moment in Replit and the cheapest genuine differentiation from a chat log.
6. **Isolated candidate work + Apply/Dismiss.** Agent work on a slice runs against an isolated copy; the gate card presents work log + verification results + live preview, with "Apply" and "Dismiss." Nothing touches the product's main state without the human's explicit action. This is the charter's "approving a gate visibly sets agents in motion" signature moment, with its inverse: dismissing costs nothing.
7. **Split agent knowledge into always-on Instructions and load-on-demand Skills.** Workspace-level Custom Instructions (applied to every mission automatically) and per-task Skills (folder + manifest, description-driven auto-loading, manual invocation from the Composer via "/" or "+"). This is the proven shape for charter requirement 9; place it in Settings, then Agents.
8. **First screen = journeys, not an empty box.** Named journey chips beside the Composer (the charter's slices), example prompts, and a "Sharpen this" action that expands a thin ask into a strong brief before any credits are spent. The plan gate always precedes execution.
9. **Design stage: live variant frames on a canvas.** For the Design canvas face, render interactive prototype frames (live, not screenshots) at three breakpoints, generate 2 to 4 variants in parallel, and make "choose this one" the single action that carries the variant forward into the spec/build. Annotations (notes, strokes) as first-class objects on frames.
10. **Multiplayer shape for later:** one shared mission room, per-collaborator threads, one shared board, agent-sequenced merging. Do not build fork-and-merge for humans; Replit tried and replaced it.

## GAP lines

GAP: Supaprod has no checkpoint/rewind primitive. Receipts record work but nothing lets a user restore the product state (spec, decisions, artifacts) to before a pass as one unit; Replit bundles files + conversation + agent memory + optional DB into every restorable checkpoint.

GAP: No visible self-verification loop. Supaprod agents do not test their own output in a way the user can watch (browser-driving the built artifact, then posting a test summary); the claim-never-outruns-wiring rule wants exactly this receipt.

GAP: No isolated candidate execution with Apply/Dismiss. Gate approval today approves a decision, but agent output is not staged in an isolated copy that merges into the product's main state only on explicit apply.

GAP: No per-request effort control. There is no user-facing "High effort" (deeper reasoning, stated relative cost) toggle on a mission or ask; effort is currently invisible and unsteerable.

GAP: No user-authored skill/instruction system for Supaprod's agents (workspace-level always-on instructions exist in concept via product knowledge, but load-on-demand skills with descriptions, manual invocation, and an authoring UI do not).

GAP: No hard budget cap or threshold-alert controls surfaced in the credits UX (verify against `docs/strategy/pricing/pricing-architecture.md`; if the rail bills without a cap setting and alerts, that is a launch-blocking trust gap under effort-style billing).

GAP: No voice input path into the one-input Composer.

## Anti-patterns observed (do not import)

- Charging for work with no visible artifact ("there is still a charge even if there's not a checkpoint shown"): the single loudest complaint about Replit's pricing.
- Price revealed only after debit with no relative signal beforehand; pair quiet with predictability.
- Two secret stores (workspace vs deployment) that silently diverge; the top cause of failed deploys.
- Autonomy as a four-level abstract slider; users could not map levels to outcomes, and it was removed.

## Sources

- https://replit.com/blog/introducing-agent-3-our-most-autonomous-agent-yet
- https://replit.com/blog/introducing-agent-4-built-for-creativity
- https://replit.com/blog/whats-changed-agent3-to-agent4
- https://docs.replit.com/replitai/autonomy-level (documents the removal; current modes and toggles)
- https://docs.replit.com/core-concepts/agent/checkpoints-and-rollbacks
- https://docs.replit.com/core-concepts/agent/task-system
- https://docs.replit.com/billing/ai-billing
- https://replit.com/blog/effort-based-pricing and https://replit.com/blog/effort-based-pricing-recap
- https://replit.com/blog/custom-skills
- https://replit.com/blog/automated-self-testing
- https://docs.replit.com/learn/design/canvas
- https://docs.replit.com/core-concepts/project-editor/app-setup/secrets
- https://docs.replit.com/build/mobile-app and https://replit.com/mobile-apps
- https://releasebot.io/updates/replit (June 2026 changelog: Voice Mode, Package Firewall, Claude connector, MCP, web search)
- Critique sources: https://www.banani.co/blog/replit-pricing, https://www.softr.io/blog/replit-pricing, https://www.superblocks.com/blog/replit-review, https://tessl.io/blog/replits-agent-4-coordinates-multiple-ai-agents-to-build-apps-in-parallel/
