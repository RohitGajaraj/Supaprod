# Teardown: Linear and Raycast (mid-2026 state)

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> Research stream for the Supaprod front-end reimagining. Written 2026-07-19 against live sources (Linear changelog through 2026-07-02, Raycast v2 beta). Focus: calm enterprise craft, density done right, command surfaces, keyboard-first patterns, empty states and onboarding, delight inside a professional tool, notification/inbox models, and what earns the "premium" feel.

Sources verified via web: [Linear changelog](https://linear.app/changelog), [Linear 2026 UI refresh](https://linear.app/changelog/2026-03-12-ui-refresh), [Linear Agent](https://linear.app/changelog/2026-03-24-introducing-linear-agent), [Coding sessions](https://linear.app/changelog/2026-06-11-coding-sessions), [Triage docs](https://linear.app/docs/triage), [Inbox docs](https://linear.app/docs/inbox), [Raycast v2](https://www.raycast.com/new), [Raycast Action Panel manual](https://manual.raycast.com/action-panel), [Aliases and hotkeys](https://manual.raycast.com/command-aliases-and-hotkeys), [Raycast AI](https://www.raycast.com/core-features/ai), [Unsung on the confetti cannon](https://unsung.aresluna.org/raycasts-confetti-cannon/).

---

## 1. Where each product is in mid-2026

### Linear

Linear in 2026 is no longer "an issue tracker with taste." It has become the closest existing product to Supaprod's own thesis, which makes this teardown double as competitive intel:

- **Linear Agent** (2026-03-24, public beta on all plans): built into the product, understands roadmap, issues, and code, synthesizes context, recommends, and takes action. Triggered automatically when issues enter Triage.
- **Code Intelligence** (2026-05-14): the agent gets controlled repo access so it reasons about how the product actually works, not just what issues say.
- **Coding sessions** (2026-06-11): Linear Agent writes code via Claude Code and Codex, cloud sessions with diff review, "triage, plan, review, and ship, all in Linear." Uses AI credits.
- **Linear Diffs** (2026-05-28): native code review with a Review Inbox and real-time agent iteration on changes.
- **Releases** (2026-04-30): release planning with CI/CD integration and agent-generated release notes.
- **Agent-assisted project updates** (2026-06-18): "Write with Agent" drafts a status update by reading recent changes plus the linked Slack channel; the human refines. This is a human-gate pattern applied to comms.
- **2026-03-12 UI refresh**: "a calmer, more consistent interface." Headers, navigation, and view controls unified across issues, projects, reviews, and documents; icons redrawn; **the sidebar made slightly dimmer so the main content area stands out**. Note the direction of travel: as the product got an order of magnitude more capable, the chrome got quieter.

The strategic read: Linear is expanding from tracking into doing (plan to ship inside one tool), but it starts from the issue graph and adds agents. Supaprod starts from the agent loop and adds the record. Linear's agent is an assistant inside a human workflow; Supaprod's humans are gates inside an agent workflow. That difference is the story the Mission Control face must make legible in 10 seconds, because "Linear has agents too" is now a live objection.

### Raycast

- **Raycast v2** ("The launcher, relaunched", macOS Tahoe + Apple Silicon, beta mid-2026): fully rebuilt UI, AI Chat with "skills, agents, and memory all in one place," Quick AI on Tab, built-in dictation, file search in root, reorganized settings, inline configuration of hotkeys and aliases. Ships alongside v1 so nobody is forced to migrate mid-beta, with setup import during onboarding.
- **Windows** public beta since late 2025, growing fast; **iOS** companion syncing AI chats.
- **AI Extensions + MCP**: at-mention syntax (`@github`, `@notion`) turns the launcher into a natural-language dispatcher over tools. Teams share AI command libraries and prompt templates.
- Model roster is current-frontier (GPT-5.5, Claude Opus 4.8 class) behind one subscription.

The strategic read: Raycast proved a **single text field can be the front door to hundreds of capabilities** without the product feeling empty, because the field is surrounded by visible, learnable structure (sections, actions, shortcuts). That is exactly the tightrope the rejected Ink rebuild fell off ("depth behind the palette read as empty").

---

## 2. Calm enterprise craft: what actually produces the "premium" feel

Neither product's premium feel comes from decoration. It comes from five measurable behaviors:

1. **Speed as the first design token.** Linear's founding metric is sub-100ms interaction (local-first sync, optimistic UI everywhere). Raycast's whole category is "faster than opening the app." Premium = the tool never makes you wait for it to think about UI. Every animation is under ~200ms and interruptible.
2. **Chrome recedes, content advances.** Linear's 2026 refresh literally dimmed the sidebar. Raycast is a floating panel over your work with no chrome at all. The hierarchy rule: navigation is a shade darker/dimmer than content, borders are 1px and low-contrast, elevation is done with subtle layered shadows (Raycast borrows macOS window-chrome shadows to make surfaces read as pressed or raised glass), not with heavy cards.
3. **One accent, spent deliberately.** Linear's purple appears in tiny doses (selection, brand moments); status is carried by a small fixed semantic set (backlog gray, in-progress yellow, done purple/green, blocked red) applied to 12 to 14px glyphs, never to backgrounds. Raycast Red (#FF6363) is spent almost exclusively on the brand stripe; the working UI is grayscale. This matches Supaprod's ember-is-the-human's-move rule exactly, and validates it.
4. **Typography does the density work.** Both are dark-first, one sans throughout, 12 to 13px body in dense lists, tabular numerals for anything countable. Raycast's specific tricks for dark UI legibility: body text at weight 500 rather than 400, and slight positive letter-spacing (0.2 to 0.4px) so dense dark surfaces still feel airy.
5. **Consistency as a feature.** The 2026 Linear refresh was almost entirely "make headers, nav, and view controls identical across surface types." Users experience consistency as calm. The rejected rebuild's "half-cooked, internally inconsistent" verdict is the inverse of this. A single header/toolbar anatomy shared by every Canvas face is worth more than any individual visual idea.

## 3. Information density done right (Linear)

- **Row anatomy is fixed and metadata is glyphs.** A Linear issue row is: priority glyph, ID in mono, title (the only prose), then right-aligned icon cluster (labels, project, due, assignee avatar). Nothing wraps. Density comes from replacing words with a learnable 14px iconography, not from shrinking words.
- **Group headers as wayfinding.** Long lists are always grouped (by status, project, assignee) with sticky, count-bearing headers. You scan headers, not rows.
- **Peek before commit.** Hovering/space gives preview; click opens the full record; the list never disappears under you. Two levels of depth, matching the charter's "drawer peeks one level, room is two levels."
- **Views are saved objects.** Any filter combination becomes a named, shareable view (2026: shareable filtered views). Density is user-tunable, not designer-imposed.
- **Progressive property disclosure.** An issue shows 3 properties in a row, 8 in the peek, everything in the detail. The same object renders at three fidelities. This is precisely the CanvasFace contract idea: one object, multiple resolutions.

## 4. Command surfaces: Linear's Cmd+K vs Raycast's launcher, and the lesson for the one Composer

These are two different species and Supaprod's Composer must be a third:

- **Linear Cmd+K is contextual.** It acts on the current selection first ("Assign to...", "Move to project...") then falls back to global navigation and creation. Its power is that context is implicit: what you have selected is what the command applies to. It is an accelerator for people who already know the product; Linear never uses it as the primary teaching surface.
- **Raycast's root search is the whole product.** Everything (apps, commands, AI, files, clipboard) resolves through one ranked field. What keeps it from feeling empty: (a) frecency ranking so the first paint is your own recent life, not a blank field; (b) **the Action Panel (Cmd+K inside the launcher)**: the primary action is displayed at the top and runs on plain Enter, every action shows its shortcut on the right so you learn to skip the panel over time, and actions are grouped in labeled sections; (c) aliases (type "gpr" to jump to a command) and global hotkeys assignable inline from the Action Panel, no settings trip; (d) **deeplinks**: every command has a copyable URL, so workflows are shareable and automatable.
- **Raycast AI at-mentions** are the best current pattern for "one natural-language input that can also invoke tools": `@github open PRs` mixes prose and capability addressing in one line, with the mention rendered as a typed chip.

Lessons for the Composer (the charter's one input replacing Ask/palette/chip):

1. **Enter must always have one obvious primary meaning**, shown before you press it (Raycast's "primary action at top, Enter runs it"). The Composer should render its interpretation as a removable intent chip above/inside the field ("Ask", "Run journey: Write the PRD", "Go to Traces") before execution. Ambiguity is resolved visibly, never silently.
2. **Context is implicit input.** Whatever the Canvas is showing is the selection; the Composer acts on it by default, Linear-style. "Tear this down" while a PRD face is open needs no object naming.
3. **The empty Composer is never empty.** First paint = journey chips + recent/suggested actions ranked by frecency, exactly why Raycast's root never reads as a void.
4. **Teach shortcuts at the point of use.** Every action surfaced in the Composer/tray shows its key inline. Both products grow keyboard users this way rather than via a shortcut cheatsheet.
5. **Deeplink every journey and face.** A URL for "PRD journey, step 3, product X" makes journeys shareable, resumable, and testable by the surface-registry CI.

## 5. Keyboard-first patterns worth copying wholesale

- **Two-key mnemonics for navigation** (Linear: `G then I` inbox, `G then T` triage, `O then P` open project). Faster to learn than chords, self-describing (Go, Open). Supaprod: `G` then stage number 1 to 7 walks the Spine; `G A` Approvals; `G B` Brain.
- **Single-letter verbs on the selected object** (Linear: `A` assign, `P` priority, `H` snooze; Raycast: plain Enter = primary). In the Approvals tray this is load-bearing: `1` approve, `2` request changes, `3` decline, `H` snooze, `J/K` next/prev, mirroring Linear Triage's exact keymap so PMs arrive pre-trained.
- **`?` overlays the shortcut map, filtered to current context.** Both products do a variant of this.
- **Everything in a menu shows its shortcut.** The UI is its own training program.

## 6. Notification and inbox models: Triage is the blueprint for Approvals

Linear runs two distinct queues, and the distinction itself is the insight:

- **Inbox** = FYI stream (mentions, status changes). `U` read/unread, `H` snooze, `J/K` traverse. Zero obligation.
- **Triage** = decision queue. Items enter automatically (integrations, outside-team submissions, Sentry/Slack); a human works it down with four keyed verdicts: Accept (1), Duplicate/merge (2), Decline (3), Snooze (H). Nothing enters the team's real workflow without passing this gate, and triage items are excluded from normal views until accepted.
- **Triage Intelligence**: an LLM pre-analyzes each incoming item against workspace history and suggests properties, duplicates, and related issues, so the human verdict is a confirm/override, not research.
- **Triage Responsibility**: named humans own the queue, with rotation via PagerDuty/OpsGenie et al. Accountability is explicit, not ambient.
- **2026 addition**: agent workflows can fire automatically when an issue enters triage.

Mapping to Supaprod: Approvals is Triage, not Inbox. Each gate card should carry (a) the agent's pre-analysis and recommendation with receipts, (b) three or four keyed verdicts, (c) snooze with resurface-on-activity, (d) a named owner. The Working strip and Thread are Inbox-class (ambient, zero-obligation); the Approvals tray is Triage-class (finite, owned, keyboard-speedrunnable). Blurring the two classes is how products become notification hells.

GAP: Supaprod has no snooze/defer semantics on approval gates (resurface at a chosen time or when the mission produces new activity). Linear treats snooze as a first-class triage verb; a PM who cannot say "not now, re-ask me after standup" will either rubber-stamp or bottleneck the agents.

GAP: Supaprod has no named approval ownership or rotation. In a multi-human workspace, "who is the gatekeeper for this product this week" is unassigned, so gates will sit. Linear's Triage Responsibility (with on-call handoff) is the model.

GAP: Supaprod gate cards do not consistently carry an agent recommendation with evidence ("approve, because X, Y; risk Z") the way Triage Intelligence pre-chews every item. The decision should default to confirm/override, never to research.

## 7. Empty states and onboarding

- **Linear onboards into a working object graph**, not a blank canvas: sample issues/projects you triage and edit as the tutorial, then delete. The product teaches by being used on disposable-but-real data. (This validates the charter's demo-seed-per-journey requirement; make the seed the onboarding.)
- **Empty states are the next action, one line, one button.** Empty Triage says the equivalent of "No issues to triage" plus how issues arrive. Never illustration-heavy, never dead-ends.
- **Raycast onboarding is one rehearsal of the core gesture**: hotkey, type, Enter, and famously fires the **confetti command** as the success beat (the CEO built it after being denied a real confetti cannon; it deliberately sits first in docs as the un-failable test command). The lesson is structural: onboarding = perform the ONE core loop once with a guaranteed, slightly joyful success. For Supaprod: first-run = one real mini-journey ("What should we build next?" on seeded data) ending in the user approving one gate and visibly setting agents in motion. That signature moment IS the tour; the skippable guided tour is a supplement.
- **Raycast v2 imports your v1 setup during onboarding** and runs alongside the old app. Migration respect is part of craft.

## 8. Delight and personality inside a professional tool

The shared formula: **base register is austere, so tiny warm signals read loudly.**

- Raycast: confetti on celebratory moments only; a slightly playful writing voice in release notes ("Same shortcut. New everything"); named personality in changelog art. Never inside error paths or dense work surfaces.
- Linear: personality lives in motion (the sub-perceptual ease of every transition), in changelog craft (their changelog is a marketing asset), and in copy that is direct and slightly dry, never exclamatory. No mascots, no emoji in UI chrome.
- Both put delight at **completion boundaries**: something finished, shipped, celebrated. Neither decorates waiting states with cuteness; waiting states get precise progress language instead.

For Supaprod: the rotating verb deck belongs on the Working strip (precision-flavored variety, sharp-PM register), and the one confetti-class moment should be reserved for a mission shipping through 06 Ship. One signature celebratory beat, not ambient whimsy, matches the "one Arc-school touch per surface" budget already in the Tempo contract.

## 9. What Linear-2026 means competitively (brief, for the pitch room's benefit)

Linear now sells "triage, plan, review, ship, all in Linear" with agent coding sessions, repo intelligence, releases, and agent-drafted updates. What it still does not do: tell you WHAT to build from signals, run a persistent product-loop with the agent as the driver, or maintain a decision-and-outcome memory that compounds. Supaprod's face must foreground exactly those three, because everything else on the screen now has a Linear lookalike.

---

## What Supaprod should steal

Concrete, implementable, ranked:

1. **Approvals tray = Linear Triage, verb for verb.** Keyed verdicts (1 approve / 2 request changes / 3 decline / H snooze), J/K traversal, agent pre-analysis with receipts on every card so the human confirms or overrides instead of researching, snooze that resurfaces on time or new activity, and a named gate owner per product. Exclude gated work from "done" views until approved, exactly as Triage items stay out of normal views.
2. **Composer = Raycast Action Panel semantics.** Interpretation shown as a removable intent chip before Enter; plain Enter always runs the visible primary meaning; `@` mentions for agents/tools/products rendered as typed chips; journey chips + frecency-ranked recents as the never-empty first paint; every listed action shows its shortcut inline.
3. **Two-key Go navigation + single-letter verbs, globally.** `G 1..7` walks the Spine stages, `G A` Approvals, `G B` Brain, `?` shows a context-filtered shortcut overlay. Selected-object verbs match Linear's (A assign, H snooze, C create). Zero new conventions to invent; PMs arrive trained.
4. **Dim the chrome, fix the anatomy.** Adopt Linear's 2026 refresh moves directly: nav/sidebar a step dimmer than the Canvas, one identical header/toolbar anatomy across all seven CanvasFaces, metadata as a fixed glyph grammar (single-line rows, right-aligned icon clusters, mono IDs, tabular numerals). Dark-surface legibility via weight 500 body and +0.2 to 0.4px letter-spacing rather than larger type.
5. **Three-fidelity object rendering.** Every core object (mission, gate, trace, PRD, run) renders as row glyph-line, peek card, and full face from one component contract. This is the depth-without-clutter mechanism, and it is how Linear makes density calm.
6. **Deeplink everything.** Every journey, stage, face, and gate gets a stable URL (Raycast deeplinks); the surface-registry CI test asserts each registered capability has one. Shareability and testability in one move.
7. **Onboarding = one seeded journey ending at one approved gate.** Perform the core loop once on demo-seeded data with a guaranteed success beat (the agents visibly springing to work on approval is the confetti moment). Empty states everywhere are one sentence + the one next action, never a dead-end.
8. **Speed budget as a design token.** Sub-100ms perceived response for local interactions, optimistic updates on every verdict, all motion under ~200ms and interruptible. This is the single biggest contributor to the premium feel in both products and costs no visual design at all.
9. **Snooze as a universal verb.** Not just approvals: any Thread item, briefing, or suggestion can be deferred with resurface conditions. Calm products let users say "later" precisely.
10. **Positioning line the anatomy must prove:** Linear added agents to a tracker; Supaprod put gates on an agent. The Spine (machine color flowing, ember where a human is needed) is the visual argument; the pitch-room objection bank should add "How is this not Linear Agent?" with this answer.

GAP: (repeat for the collector) no snooze/defer semantics on gates; no named gate ownership/rotation; no standing agent recommendation-with-receipts on every gate card. Plus one more:

GAP: Supaprod has no alias/hotkey layer for its journeys (Raycast lets users bind any command to an alias or global key inline). Power users cannot yet make "teardown" mean "run the Critic journey on the current product," which is cheap stickiness with the Composer already in place.
