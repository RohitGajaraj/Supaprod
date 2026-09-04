# Teardown: Lovable and v0 by Vercel (state as of July 2026)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Research stream for the Supaprod front-end reimagining. All external claims verified via live web sources 2026-07-19 (listed at the end). Focus areas per assignment: prompt-to-artifact flow, chat beside live preview, credit/cost disclosure (the founder-mandated Lovable pattern, documented precisely), project knowledge / custom instructions, first-run experience and example prompts, presentation of generated design work.

Both products solve the exact comprehension problem the charter names: a first-time user lands, types one sentence, and within a minute sees a real artifact being built in front of them. Neither needs a tour. The anatomy teaches.

---

## 1. Lovable (mid-2026)

### 1.1 First-run experience

- Homepage is a single prompt box under the tagline "Create apps and websites by chatting with AI." Three-step story: (1) Start with an idea, describe it or drop in screenshots and docs; (2) watch it transform into a working prototype in real time; (3) refine with simple feedback, ship with one click.
- The prompt box accepts attachments (screenshots, docs) at step zero. There is a template library (e-commerce, SaaS, blogs, portfolios) and a remix/community layer for starting from an existing project instead of a blank prompt.
- There is no onboarding wizard. The first prompt IS the onboarding: the user is dropped straight into the workspace and watches the agent build.

### 1.2 Prompt-to-artifact flow and the workspace layout

- Two-pane workspace: chat/agent panel on the left, live preview of the running app on the right. The preview re-renders as the agent works, so "the machine's work is always visible" is literally the default view.
- **Build mode** (formerly Agent mode) is the default execution mode. While it works, the chat shows **visible tasks**: the current step, which files are being modified, which tools are in use (search, web fetch, image generation, browser checks), and progress through multi-step implementations. A **Details view** lets the user follow along step by step; code, preview, and logs populate live.
- After completion the response surfaces **file diffs and summaries**, so review happens before moving on.
- **Prompt queue**: while the agent works, new prompts stack in a visible queue above the chat input. The queue can be paused/resumed, reordered, edited, and items repeated up to 50 times. The user never waits to think.
- **Chat/Plan mode** is the cheap thinking mode: the AI answers, plans, and (since the Feb 2026 update) shows "a detailed plan of what it intends to build" before execution. Designers use Plan mode explicitly as a design review checkpoint, i.e. a human gate before spend.
- Error handling is autonomous: the agent inspects logs, runtime output, and network activity and iterates on fixes until resolved or clarified, using verification tools (browser testing, frontend tests). Failures do not dead-end into the user.

### 1.3 The credit/cost disclosure pattern (founder-mandated pattern, documented precisely)

This is the exact mechanism, from Lovable's own docs:

1. **Nothing inline.** No credit figure appears on or next to a response in the chat while working or after completion.
2. **One click deeper:** "Click the three-dot menu below any Lovable response in the chat to see its exact cost." The kebab menu on the individual message is the single per-action cost door.
3. **Pricing shape behind it:** Plan/Chat mode is flat (every message costs 1 credit, fully predictable). Build mode is variable by work actually done: docs give illustrative examples of 0.50 credits (button styling tweak), 0.90 (component removal), 1.20 (auth logic), 2.00 (landing page with generated images). Cost drivers are named in plain language: number of files modified, complexity of logic changes, amount of codebase exploration, and use of tools (verification, browser checks, web search, image generation).
4. **Balance and history live in Settings, not in the work surface:** Settings -> Plans & credit usage. The Credit balance dialog has a **Breakdown** tab (each grant with its expiry date) and a **History** tab (credit activity up to 12 months back).
5. **Grants and expiry:** Free gets 5 build credits daily (max 30/month); Pro ($25/mo) and Business ($50/mo) get 5 daily with no cap plus monthly plan credits; 20 Cloud credits and 4 AI credits monthly on all plans. Daily/monthly grants do not roll over; monthly plan credits expire after 2 months; top-ups last 12 months. Spend order is expiring-first, automatically.

Net effect: the work surface stays entirely about the work; money questions have exactly two homes (per-message kebab, Settings), and both are one intentional click away. This matches Supaprod charter requirement 5 verbatim.

### 1.4 Project knowledge / custom instructions

- Two tiers, both capped at 10,000 characters:
  - **Workspace knowledge**: shared rules across all projects in a workspace, editable only by owners/admins. Best for coding standards, naming, preferred libraries, architecture patterns, testing requirements, brand guidelines.
  - **Project knowledge**: per-project context, editable by anyone with edit permission. Best for the app's purpose, personas, schema, architecture decisions, domain terms, design guidelines.
- Edited at Settings -> Knowledge (workspace) and Project settings -> Knowledge (project). Changes apply immediately, mid-conversation.
- On conflict, project knowledge wins over workspace knowledge.
- The agent also reads repo instruction files (AGENTS.md, CLAUDE.md); root AGENTS.md is always read regardless of session length.
- **Knowledge vs skills**: knowledge is always in context; workspace **skills** load on demand for specific tasks only. This two-speed model keeps the always-on context small.

### 1.5 How Lovable presents generated design work

- **Visual Edits**: click any element in the live preview and modify it directly (text, colors, spacing, padding, margins, borders, shadows, icons) without spending agent credits on trivia. A newer unified **Design View** adds dedicated design tools so it feels less code-like.
- **Themes**: a centralized panel controlling colors, typography, and spacing with live preview across the whole app; reviewers compare it to design-system management in Figma. Design identity is fed once, centrally, then everything the agent generates obeys it.
- Plan mode doubles as the design gate: the plan is reviewed before pixels are generated.

---

## 2. v0 by Vercel (mid-2026)

### 2.1 First-run experience and example prompts

- Chat-first home: sign in, start a new chat or create a project, "describe what you want to build in your preferred language." Documented example prompts: "A todo app with add, edit, and delete functionality"; "A landing page for a SaaS product with hero section and pricing"; "A dashboard showing user analytics with charts"; "A contact form that sends emails." Concrete, outcome-shaped, one line each.
- Inputs beyond text: screenshots, files, and Figma imports.
- After the first prompt, v0 generates a working app; the workspace offers a **code editor / visual preview toggle** and conversational iteration ("Add a search bar to the product list"). The Feb 2026 update added Git integration, a VS Code-style editor, database connectivity, and agentic workflows, moving v0 from component toy to production platform.
- Onboarding arc mirrors Lovable: generate -> iterate (code or design) -> connect services (Supabase, Neon, Upstash, AI providers) -> publish on Vercel.

### 2.2 Projects and instructions

- A **Project** is one cohesive app that many chats contribute to; the project shares deployment, hosting, domains, and env vars across its chats. Chats are cheap and disposable; the project is the durable thing.
- **Instructions** (rules and instructions were unified into one concept): created via the **plus button in the prompt bar** -> New Instruction -> title + rule text. Saved to the account, available across all chats and projects. Applied by checking them in the plus-button menu; checked instructions stay applied until unchecked. Two built-in presets ship by default: **"Be Concise"** and **"Plan Mode"** (require approval before code is written).
- The key UI idea: instructions are toggleable chips at the input, not buried config. The user composes behavior at the point of prompting.

### 2.3 Design Mode (how v0 presents design work)

- Entered from the prompt-form toolbar (or Option+D / Alt+D). It overlays design tools on top of the running app in the Preview tab.
- Select any element in the live preview, tweak styles via a visual panel and/or natural-language micro-instructions: typography, color, backgrounds, layout (margin/padding), borders, opacity, corner radius, shadows, plus direct text editing.
- **Before/after preview toggle** before applying. Applying produces a **new chat version**, so a design tweak is a first-class, revertable, diffable step in the same thread as everything else. No separate design tool, no export/import seam.

### 2.4 v0 credits and cost disclosure (the cautionary tale)

- Five tiers: Free ($0 with $5 monthly credits, 7 messages/day cap), Premium ($20/mo), Team ($30/user/mo), Business ($100/user/mo), Enterprise. Four in-house models (Mini, Pro, Max, Max Fast) from $1/$5 to $10/$50 per 1M input/output tokens.
- Usage is metered on raw input and output tokens converting to credits, not per-task. Context counts as input: chat history, source files, and platform knowledge all bill, so longer conversations silently cost more.
- Disclosure surfaces: a usage page at v0.app/chat/settings/usage, and model costs on hover in the model selector. There is no clean per-message "this cost X" kebab equivalent; users reconstruct spend from the usage page.
- Result: the January 2026 restructure raised typical generation costs 200-300% (community reports of $1.00-$4.00 per complex prompt, up from ~$1.50 flat), and the community thread on it runs multiple pages of anger. The lesson is not "tokens bad" but: **exposing raw token mechanics pushes the anxiety onto the user; task-shaped, rounded credit costs disclosed after the fact (Lovable) feel fair even when variable.**

---

## 3. Shared patterns worth naming

1. **One input, one artifact, side by side.** Both products are a conversation pane beside a live artifact pane. The artifact IS the progress bar. This is the strongest available answer to the charter's "10-second comprehension" and "machine's work always visible" requirements, and both ship it with zero navigation chrome (v0: chat + project switcher; Lovable: chat + preview + settings).
2. **Streaming task anatomy.** Neither shows a spinner. Both show named steps, touched files, and tools in use, collapsible into a details view, ending in a diff + summary card. Trust comes from legible work, not claims.
3. **Plan-then-act as the money gate.** Both converged on a cheap/flat planning mode and an expensive/variable execution mode, with the plan reviewed by the human before spend. That is exactly Supaprod's gate concept, discovered independently by both competitors for cost reasons.
4. **Design edits are versions in the thread**, not a separate world. Select element -> tweak -> before/after -> new version, revertable like any other step.
5. **Knowledge is layered and quiet.** Workspace-level and project-level standing context, edited in Settings, always applied; heavier behaviors (skills/instructions) load on demand or by toggle.

---

## 4. What Supaprod should steal

Concrete, implementable, mapped to the Mission Control anatomy:

1. **The Lovable cost pattern, verbatim (charter req 5).** Spec: zero cost figures inline on any mission, run, gate card, or chat response. Every agent response / mission card gets a kebab (three-dot) menu; one item, "Details," opens a panel showing exact credit cost plus the plain-language drivers (files touched, tools used: web search, image gen, browser verification). Balance and history live only in Settings -> Plan & credits, with a Breakdown tab (grants + expiry dates) and a History tab (12 months of activity). Spend expiring credits first, automatically. Round costs to task-shaped credit numbers (0.5, 1.2, 2.0), never raw tokens; hide the model economics entirely. Do NOT copy v0's token metering or usage-page-only disclosure; that pattern generated a 200-300% perceived price shock and community revolt.
2. **Streaming task anatomy for the Working strip and Thread.** When agents run, the Thread shows: current step name, artifact/files being touched, tool in use, with a collapsible Details view (step-by-step log) and a closing diff/summary card at the gate. This is the receipt mechanism Lovable proves works; wire it to our existing traces so claim never outruns wiring.
3. **Prompt queue above the Composer.** While the machine works, new Composer inputs stack visibly (reorder, edit, remove, pause). Kills the "wait for the agent" dead time and makes the one-input model feel powerful.
4. **Journey chips as example prompts.** v0's four one-line example prompts are its whole onboarding. Our Composer journey chips should read exactly like that: outcome-shaped single sentences ("What should we build next?", "Just write the PRD for X", "Tear this idea down"). First-run shows them pre-populated; the first click starts a real journey against seeded demo data, so the first minute is watching agents work, not reading a tour.
5. **Two-tier Knowledge in Settings (charter req 9).** Workspace knowledge + per-product knowledge, each a single ~10k-char editable text surface at Settings -> Knowledge, applied immediately, project wins on conflict. Brand guidelines feed (charter req 8) is a third named section beside them. Copy Lovable's split of always-on knowledge vs on-demand skills for the agent-skills manager.
6. **Toggleable instruction chips at the Composer (v0's plus button).** Saved instructions applied per-message by checking chips at the input, with sensible presets ("Plan first", "Be concise"). Gives power users composable control without a settings dive, and folds naturally into the one-input model.
7. **Design face = select, tweak, before/after, version (charter req 8).** On the interactive prototype CanvasFace: click an element, visual style panel + natural-language micro-edit, before/after toggle, apply creates a new version in the Thread, revertable. Plus a Themes-style central brand token panel (fed from Settings brand guidelines) with live preview, so every generated screen obeys the identity automatically.
8. **Plan mode as the visible design/spend gate.** Before any expensive stage run, the agent posts its plan as a gate card in the Thread; approval is the signature moment that visibly sets agents in motion (charter req 11). Flat/cheap to discuss, variable to execute, exactly the two-mode economics both competitors converged on.
9. **Autonomous error recovery, surfaced not silent.** When a build/verify step fails, agents inspect logs and iterate visibly in the task stream (Lovable's loop) instead of surfacing a raw failure to the user; escalate to a gate only when clarification is genuinely needed. Nothing dead-ends.
10. **The artifact is the progress bar.** The Canvas must be rendering the actual work product (evidence, spec, prototype, code) while agents run, Lovable-preview style, not a status list. Auto-follow the work; let the user click away without stopping it.

---

## 5. Gaps discovered

GAP: Supaprod's runtime logs tokens and cost at the chokepoint (runtime.server.ts) but has no user-facing per-response cost Details view; the founder-mandated Lovable kebab-menu pattern is unwired end to end (no per-message cost attribution surface, no Breakdown/History credit dialog in Settings).
GAP: No prompt queue: today's input surfaces block or drop input while agents are working; the reimagined Composer needs visible queueing with reorder/edit.
GAP: No toggleable per-message instruction mechanism (v0-style saved instruction chips at the input); custom behavior currently requires prompt retyping or settings-level changes.
GAP: No before/after visual diff for design outputs; the Design face has no select-element -> tweak -> compare -> version loop, which is table stakes in both competitors.
GAP: No first-run seeded example-journey chips: a brand-new workspace opens empty instead of offering one-line outcome prompts that run against demo data.
GAP: No central Themes-style brand token panel that generated design work provably obeys; brand guidelines exist as docs, not as an enforced live-preview control surface.

---

## Sources

- https://docs.lovable.dev/introduction/plans-and-credits (credit disclosure, three-dot menu, grants, Breakdown/History tabs)
- https://docs.lovable.dev/features/agent-mode (Build mode task display, Details view, queue, error loop, cost drivers)
- https://docs.lovable.dev/features/knowledge (workspace/project knowledge, limits, precedence, skills)
- https://lovable.dev/ and https://lovable.dev/pricing (first-run, plans)
- https://lovable.dev/blog/agent-mode-beta, https://lovable.dev/blog/chat-mode-and-questions (mode history)
- https://muz.li/blog/lovable-for-designers-the-complete-guide-to-building-apps-with-ai-2026/ (Visual Edits, Design View, Themes, Plan mode as design gate)
- https://v0.app/docs/quickstart (first-run, example prompts, code/preview toggle)
- https://v0.app/docs/design-mode (Design Mode anatomy, before/after, versions)
- https://v0.app/docs/instructions (plus-button instructions, presets)
- https://v0.app/docs/projects, https://v0.app/docs/pricing, https://vercel.com/blog/updated-v0-pricing (projects model, token-metered credits, model tiers)
- https://uibakery.io/blog/vercel-v0-pricing-explained-what-you-get-and-how-it-compares, https://www.nocode.mba/articles/v0-pricing, https://community.vercel.com/t/updated-v0-pricing/10612 (2026 pricing restructure and community reaction)
- https://www.banani.co/blog/lovable-pricing-and-credits, https://www.superblocks.com/blog/lovable-dev-pricing (credit cost examples by task complexity)
