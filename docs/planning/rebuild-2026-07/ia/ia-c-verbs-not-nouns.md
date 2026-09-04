# IA-C: Verbs, Not Nouns

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> The complete information architecture and interaction wiring for the Supaprod authenticated app, rebuilt from zero.
> Stance: organise around what a person is trying to DO right now. The machine routes them to the surface.
> Written 2026-07-28. Grounded against live code, not docs.

---

## 0. The stance, stated once

Every rejected rebuild organised the app around **things the product has**. The 2026-07-13 rail is stage-shaped (seven lifecycle nouns pretending to be places). The Mission Control top bar is place-shaped (Mission Control, Approvals, Brain, Settings). Both make the user translate an intention into a location before anything happens, and the translation table lives nowhere except the founder's head. That is why he cannot find the start.

The fix is not a better menu. It is to stop asking for the translation.

**Three laws govern everything below.**

**Law 1: The input is always on screen.** A docked Ask bar sits at the bottom of every authenticated surface, on every route, with no exception. It is not an accessory, not a slide-over, not a shortcut. It is the primary navigation surface. `⌘K` focuses it from anywhere; it never opens a second competing input (the "one input model per screen" rule already enforced in `Composer.tsx`).

**Law 2: A destination is a question a human asks out loud.** Not a lifecycle stage, not an object type, not a room name. Five destinations, each phrased as an action. If a destination exists to make a story true rather than because it owns a query, it is deleted. Today `/decide` has zero queries of its own, `/ship` and `/learn` each own one presence chip. Those are the defect this document exists to prevent recurring.

**Law 3: The loop is a property of a piece of work, not a set of pages.** The seven stages never appear as navigation. They appear as **the Trace**: a ribbon attached to one run, showing that run's slice lit and the rest dim. You learn the lifecycle by watching your own work move through it.

### The burden of proof: how a brand-new user learns the shape

A verb-first app fails when the verb surface is a blinking cursor. That is what got the 2026-07-18 rebuild called "any-AI-chat-app". Four always-on teaching devices, none of which is a menu, answer that:

| Device | What it teaches | Built from |
| --- | --- | --- |
| **The Deck** | The full inventory of what the product can do, in plain words, browsable and grouped by the question each verb answers. An empty Ask bar shows the Deck, never a blank field. This is the table of contents. | `CommandPalette.tsx` (454 lines, currently zero importers), `palette-catalog.ts` (20 entries), `palette-sections.ts` `ACT_VERBS`, `SuggestionPopover.tsx`, `JourneyChips.tsx` |
| **The Trace** | The seven-stage lifecycle, and where this specific run sits inside it. Shape by state, not by nav. | `Spine.tsx` (`SPINE_STAGES`, `resolveLoopState`, `isStageDimmed`), `loop-state.functions.ts` |
| **Context chips** | What is worth doing *here, now*. Three to five chips above the Ask bar, recomputed per surface and per selection. The machine routing you, made visible. | `JourneyChips.tsx` + `journeyForIntent()` |
| **The Rejoin line** | That nothing ends. Every terminal state renders one forward door. | `journeyHandoffFor()` in `journey-wiring.ts`, `NextLine` in `primitives` |

The Deck carries the enforcement law that `journeys.ts` already established: **every verb in the Deck names the server functions it runs on, and a test opens each file and fails when the export is missing.** A verb that is not wired does not appear. This is why the Deck is a credible table of contents and a marketing page is not.

---

## 1. THE DESTINATIONS

### The answer: five, and the fifth is recessed

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ ◈ Supaprod   helio-labs / relay ▾    Working   Waiting ③   Recall     ⚙ Tune  ◉  │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                              (surface)                                           │
│                                                                                  │
├──────────────────────────────────────────────────────────────────────────────────┤
│  Find what to build   ·   Write a spec   ·   Ask about this run                   │
│  ┌────────────────────────────────────────────────────────────────────┐  ┌────┐  │
│  │ Ask anything, or name the work.                                    │  │ ⌘K │  │
│  └────────────────────────────────────────────────────────────────────┘  └────┘  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

| # | Label | The sentence a user says | Route | Owns |
| --- | --- | --- | --- | --- |
| 1 | **Ask** | "I want to do a thing." | no route; docked bar + `⌘K` + `?ask=` on any URL | The Deck, free text, object search, run kickoff |
| 2 | **Working** | "What is happening, and what did it make?" | `/working` | Every run, live or finished, and everything runs produced |
| 3 | **Waiting** | "What needs me?" | `/waiting` | Every gate. The one count. The human's whole job |
| 4 | **Recall** | "What do we know? What did we decide?" | `/recall` | Decisions, learnings, memory, docs, graph, impact, changelog |
| 5 | **Tune** | "Change how it works." | `/tune` | Config, agents, sources, plan, machine health, platform admin |

**Why five.** One input, three states of work (running / blocked on me / remembered), one configuration. That is the complete set of things a person does inside an operating system for building product. Adding a sixth means one of these five stopped owning something.

**Why Tune is visually recessed.** It is the only destination you enter to *change the machine* rather than to *do the work*. It sits in the right cluster with the account chip, not the left cluster with the work verbs. It is still a top-level destination because deep-linking into a settings sub-page has to be first class (the founder's explicit complaint), and because burying config in an avatar menu is how `/briefing` ended up pointing at a section id that does not exist.

**Why Ask has no route.** A route implies you can be somewhere else and therefore not asking. You are always able to ask. It is state (`?ask=<text>`), not a place. That single decision is the difference between a command palette (an accessory) and a command surface (navigation).

### Label defence, one line each

- **Working** beats "Runs", "Missions", "Activity". Present participle, so it names the state not the object. Reads true when empty ("nothing working") and when busy.
- **Waiting** beats "Approvals", "Inbox", "Decide". "Approvals" is our word for our workflow. "Waiting" is the user's word for their reality, and it carries the ⓷ count honestly.
- **Recall** beats "Brain", "Memory", "Knowledge". Brain is brand canon for the *system* and stays in copy ("your company brain remembers this"), but as a nav label it is a noun that names a container. Recall is what you actually do to it. It also matches the investor tagline's third verb: know, ship, **remember**.
- **Tune** beats "Settings", "Admin", "Engine Room". Settings implies a form. Tune implies you are adjusting a machine that is running, which is the truth of this product.
- **Ask** stays "Ask". It is already the word in the code (`AskProvider`, `supaprod:open-ask`, `use-ask-stream`) and already the word on the button.

### What I rejected, and why

| Rejected | Why it is a defect under this stance |
| --- | --- |
| **The seven loop stages as destinations** (`/discover`, `/decide`, `/plan`, `/design`, `/build`, `/ship`, `/learn`) | A stage is a state a piece of work is in, not a place a person goes. The code already proves it: `/decide` fires zero queries and renders the same `OpportunityQueue` that `/discover?tab=queue` renders. `/ship` and `/learn` mount lazy panels that also render inside `/brain`, and their only own query is a presence chip. Three of seven destinations exist purely to make the "seven-stage loop" story legible in a rail. The story is real; the rail is the wrong place to tell it. The Trace tells it better because it tells it about *your* work. |
| **Object destinations** (Specs, Prototypes, Missions, Artifacts, Threads, Signals) | They answer "where is the file", which is a question you only ask after the app has already failed to bring the file to you. They collapse into lenses on Working, all URL-addressable, none in the nav. |
| **"Mission Control" as a destination** | It names chrome, not an action. Its three regions split cleanly: Spine to the Trace, Thread to Ask, Canvas to the run view. Nothing is lost and one place-name dies. |
| **"Today"** | A time is not a verb, and a dashboard is what you ship when you cannot decide what the app is for. Its 1543 lines redistribute with zero loss (table in §3). |
| **"Engine Room" / "Pulse"** | It is a lens on machine health, which is two different questions wearing one door: "is it healthy, change it" (Tune) and "what exactly did this run do and cost" (Working). Its four rooms split accordingly, and the split is an improvement: **Record belongs with the work, not with the config.** Receipts filed under settings is why the ledger feels buried. |
| **A separate "Discover" destination** | Discovering is continuous machine work. The human's two real verbs are "show me what came in" (`/working?lens=signals`) and "what should we build next" (an Ask verb that starts a run). Neither needs a door. |
| **Splitting Waiting into Approvals + Notifications** | Two counts is zero counts. One queue, one count, one source (`getApprovalsQueue`). Notifications become a quiet news strip inside Waiting with a dot, never a number. |
| **A sixth destination for the crew / agents** | The crew is *who does the work*, visible as attribution on every receipt and as a drawer (`?drawer=crew`) from any run. Managing them is Tune > Agents. A roster page nobody visits twice is not a destination. |

---

## 2. THE HOME TABLE

**The exclusivity law.** Every capability has exactly one **HOME**: the surface that owns the query and renders it. It may have any number of **DOORS**: clickable links from elsewhere that navigate to the home. Doors are the interlink graph (§5) and are encouraged. A second home is a bug. Today Memory has three homes (`/settings?section=memory`, `/brain?tab=memory`, and the unmounted `MemoryView.tsx`); below it has one.

**Click paths** are counted from the landing screen, `/working`, immediately after login. Click 1 is a top-bar destination or an on-screen row. Click 2 is a lens, tab, or row inside it.

### 2.1 Ask (no route, present everywhere)

| Capability | Home | Reached by | Clicks | Absorbed from |
| --- | --- | --- | --- | --- |
| The Deck (verb catalogue, grouped) | Ask bar, empty state | `⌘K` or click the bar | 1 | `CommandPalette.tsx` (dead), `palette-catalog.ts`, `ACT_VERBS` |
| Journey kickoff (J0..J7) | Ask > **Do** group | type or pick a chip | 1 | `JourneyChips.tsx`, `journeys.ts` |
| Object search by name | Ask > **Open** group | type a name | 1 | `palette-recents.ts`, new cross-entity search |
| Settings jump by name | Ask > **Change** group | type "budget", "keys", "brand" | 1 | `SETTINGS_ROWS` in the dead palette |
| Free-text answer, streamed | Ask > **Answer** row (always last) | `Enter` | 1 | `use-ask-stream`, `Thread.tsx` |
| Dictation | mic in the Ask bar | click mic | 1 | `use-voice`, already wired in `Composer.tsx` |
| Past conversations | `/working?lens=asks`; permalink `/open/thread/$id` | Working > Asks | 2 | `/threads`, `ThreadsSurface.tsx` (633 lines) |

### 2.2 Working (`/working`) - "what is happening, and what did it make"

The list is **runs**, newest first. A run is one intent moving through a slice of the loop. Lenses are query params on the same list, never separate routes.

| Capability | Home | Clicks | Absorbed from |
| --- | --- | --- | --- |
| All runs, live and finished | `/working` (default lens) | 0 | `/build` (989), `/missions`, `/cockpit`, `/m` |
| **The run view** (Trace + Thread + stage face + Ask) | `/open/run/$id` | 1 | `/build/$missionId` (870), the whole Mission Control room (`MissionShell` + `MissionShellView` + `faces.tsx` 2781 lines) |
| By agent | `/working?lens=agents` | 2 | `/fleet`, `FleetView`, `computeAgentFleet` |
| By lane | `/working?lens=lanes` | 2 | `/delegate`, `DelegateBoard`, `computeDelegateDesk` |
| What it made (artifacts) | `/working?lens=made` | 2 | `/artifacts`, `ArtifactsSurface.tsx` (362) |
| What came in (signals) | `/working?lens=signals` | 2 | `/discover?tab=signals`, `/discovery` |
| What went out (releases) | `/working?lens=releases` | 2 | `/ship` (dies), `ShipHistoryPanel`, `deployments.functions.ts` |
| Every agent run, replayable | `/working?lens=traces` | 2 | `/traces`, **`TracesPanel.tsx` (189, unmounted)** |
| Trace detail | `/open/trace/$id` | 3 | `/traces/$traceId` (861) |
| Done while you were away | `/working?lens=runs&filter=unattended` | 2 | **`ExecutedCard.tsx` (547, unmounted)**, `getRecentExecutedUnattended` |
| Live agent count strip | Working strip, docked above Ask on every surface | 0 | **`CookingBanner.tsx` (120, unmounted)**, `getLiveRunCounts`; **`AiWorking.tsx` (unmounted)** for the loader |
| The live verb line for a running stage | Working strip, inside the run view | 0 | **`MachineNow.tsx` (128, unmounted)** |
| Prototypes list | `/working?lens=made&kind=proto` | 2 | `/design`'s Prototypes pane |
| Prototype detail + share slug | `/open/proto/$id` | 3 | `PrototypeRow`, `prototypes.functions.ts` |
| Meeting recordings, transcripts, extracted actions | `/open/transcript/$id`, listed at `/working?lens=made&kind=transcript` | 2 | **`AudioTranscriptPanel.tsx` (386, unmounted)** + all four exports of `audio.functions.ts`. Also an Ask verb: "Turn a recording into signals" |
| Cost of this run | receipt footer on `/open/run/$id` | 1 | **`CostPerOutcomeChip.tsx` (109, unmounted)**, `getCostPerOutcome` |
| Design parity check | chip on the run view's Design face | 1 | **`design-parity.functions.ts` (orphan)**: `getDesignParity`, `checkDesignParity` |

### 2.3 Waiting (`/waiting`) - "what needs me"

One queue. Workspace-wide. Ten kinds, all already returned by `getApprovalsQueue`.

| Capability | Home | Clicks | Absorbed from |
| --- | --- | --- | --- |
| The gate queue, all kinds | `/waiting` | 1 | `/approvals` (270), `ApprovalsTray.tsx` (317) |
| Filter by kind | `/waiting?kind=<kindKey>` | 2 | `FilterTabs.tsx` |
| **The judgment view** (the case, evidence chain, receipt, approve / send back / decline) | `/open/gate/$id` | 2 | new; composed from `ApprovalCard` + `getProvenance` + `getLineage` |
| Keep or kill a ranked bet | `/waiting?kind=opportunity` | 2 | `/decide` (dies), `OpportunityQueue` |
| Spec approval | `/waiting?kind=spec` | 2 | today buried in `/plan` |
| Design gate | `/waiting?kind=design_gate` | 2 | `decideDesignGate` |
| Memory candidates | `/waiting?kind=memory_candidate` | 2 | `memory-candidates.functions.ts` |
| House rules | `/waiting?kind=house_rule` | 2 | `house-rules.functions.ts` |
| Trust graduations | `/waiting?kind=trust_graduation` | 2 | `trust.functions.ts` |
| Tool-call confirms | `/waiting?kind=tool_call` | 2 | the agent loop's `confirm`/`review` modes |
| Assumption challenges | `/waiting?kind=assumption_challenge` | 2 | `/learn`'s challenged-assumption flags |
| Playbook proposals | `/waiting?kind=playbook_proposal` | 2 | `playbooks.functions.ts` |
| Why you decided (the pattern behind your calls) | "Your pattern" panel on `/open/gate/$id` | 2 | **`gate-signals.functions.ts` (orphan)**: `recordGateSignal`, `getGateSignals` |
| The stakes summary strip | pinned strip on `/working` when count > 0 | 0 | **`PendingApprovalsBar.tsx` (271, unmounted)**, `summarizeGateStakes` |
| News (things to see, not decide) | `/waiting?kind=news`, quiet dot never a count | 2 | **`AttentionBell.tsx` (97, unmounted)**, `getNotifications`, `announcements.functions.ts` |
| Your decision log | `/recall?view=decisions` (a **door**, not a second home) | 2 | Engine Room > Record > "Your decisions" |

### 2.4 Recall (`/recall`) - "what do we know"

| Capability | Home | Clicks | Absorbed from |
| --- | --- | --- | --- |
| Decisions | `/recall` (default view) | 1 | `/brain?tab=decisions` |
| Learnings and outcome memos | `/recall?view=learnings` | 2 | `/brain?tab=learnings`, `/learn`'s `LearningsPanel`, `/outcome` |
| **Memory (THE one home)** | `/recall?view=memory` | 2 | **`MemoryView.tsx` (201, unmounted)** + `/settings?section=memory` + `/brain?tab=memory` + `/memory`. Three homes collapse to one |
| Memory expiry warning | banner on `/recall?view=memory` | 2 | **`MemoryExpiryBanner.tsx` (85, unmounted)**, `getMemoryExpiry` |
| Docs and the standing brief | `/recall?view=docs` | 2 | `/docs`, `/knowledge`, `/brain?tab=docs` |
| Knowledge graph | `/recall?view=graph` | 2 | `/brain?tab=graph`, `GraphPanel` |
| Impact ledger | `/recall?view=impact` | 2 | `/impact` (**currently broken**: folds to Decisions, panel lives on `/learn`), `ImpactLedgerPanel` |
| Changelog | `/recall?view=changelog` | 2 | `/changelog`, `ChangelogPanel` |
| Announcements and launch copy | `/recall?view=changelog` | 2 | `AnnouncementsPanel` |
| Support signals coming back | `/recall?view=support` | 2 | `SupportPanel`, Engine Room > Record > "From your users" |
| Meetings and calendar | `/recall?view=meetings` | 2 | `/calendar`, `/meetings` (**currently broken**: drops `?meeting=`) |
| A meeting | `/open/meeting/$id` | 3 | `/meetings/$id` (**currently broken**) |
| Decision precedent lookup | inline on `/open/decision/$id` | 3 | `decision-precedent.functions.ts` |
| Public share of a decision | share control on `/open/decision/$id` -> `/d/$slug` | 3 | already live |

### 2.5 Tune (`/tune`) - "change how it works"

Seven groups. Group 7 renders only for platform admins (`amIAdmin`). Every existing `?section=` id and every existing `?room=&view=` pair keeps resolving (§6).

| Group | Route | Owns | Absorbed from |
| --- | --- | --- | --- |
| **You** | `/tune/you` | Profile, theme, what Supaprod sends you (briefing schedule, notification prefs) | `/settings?section=profile\|notifications`, `/briefing` (**currently broken**: points at a nonexistent section id) |
| **Workspace** | `/tune/workspace` | Brief and voice, brand kit, products, teammates and invites | `/settings?section=workspace\|brand\|products`, `/design`'s Brand Kit pane (`DesignMemoryPanel`) |
| **Agents** | `/tune/agents` | Roster and blurbs, autonomy and approval modes, models and BYO keys, guardrails, house rules, emergency stop, background routines, researcher watch targets | `/settings?section=staff\|autonomy\|ai`, `/engine-room?room=safety` (all six views), `/agents`, `/swarm`, `/guardrails`, `/governance`, **`researcher.functions.ts` (orphan)** |
| **Sources** | `/tune/sources` | Connected accounts, workspace and product bindings, sync, webhook ingest, agent access (MCP), your data and exports | `/settings?section=connections\|sync\|interop\|data`, `/sync` (842), `/integrations`, **`ProviderCard.tsx`**, **`ProductBindingPicker.tsx`**, **`ApiKeyConnectDialog.tsx`** (all three unmounted) |
| **Plan** | `/tune/plan` | Plan, credits, top-ups, spend trend, spend by agent, budget caps, full usage, diagnostics | `/settings?section=billing\|credits\|health`, `/engine-room?room=spend` (all four views), `/budgets`, `/analytics` |
| **Machine** | `/tune/machine` | Eval pass rate, calibration by surface, eval suites, drift, self-improvement queue, prompts, gauntlet | `/engine-room?room=quality` (all seven views), `/evals`, `/eval-health`, `/drift`, `/prompts` |
| **Platform** (admin only) | `/tune/platform` | People and roles, tenants, pricing and vouchers, incidents and observability, proof and moat, AI costs, model routing, activation funnel | `/admin` (354 + 187 layout), `/admin/people` (854), `/admin/workspaces` (640), `/admin/pricing` (636), `/admin/observability` (427), `/admin/proof` (318), `/admin/ai-costs` (249), `/admin/routing` (122), **`ActivationFunnelPanel.tsx` (342, unmounted)** |

Every group has a 2-click floor: click 1 Tune, click 2 the group. Sections inside a group are `?view=` on the group route, so a section is 3 clicks by browsing and **1 click by Ask** ("budget caps" typed into the bar lands on `/tune/plan?view=caps`). That is the justification for depth beyond 2: config is the one place where recall-by-name beats browsing, and Ask makes recall-by-name a single action.

### 2.6 The homeless, resolved

Every item from the ground truth that had no door now has one.

| Item | Status before | HOME now |
| --- | --- | --- |
| `AudioTranscriptPanel.tsx` (386) + 4 server fns | complete backend, zero doors anywhere | `/open/transcript/$id` + Ask verb "Turn a recording into signals" + `/working?lens=made&kind=transcript` |
| `CommandPalette.tsx` (454) | zero importers; search unreachable | Ask, the Deck |
| `AttentionBell.tsx` (97) | zero importers; no bell exists in the live UI | `/waiting?kind=news` |
| `TracesPanel.tsx` (189) | zero importers | `/working?lens=traces` |
| `MemoryView.tsx` (201) | zero importers, and memory had 3 other homes | `/recall?view=memory`, the only home |
| `ExecutedCard.tsx` (547) | zero importers | `/working?lens=runs&filter=unattended` |
| `PendingApprovalsBar.tsx` (271) | zero importers | the pinned Waiting strip on `/working` |
| `CookingBanner.tsx` (120) | zero importers | the Working strip, every surface |
| `MachineNow.tsx` (128) | zero importers | the Working strip inside `/open/run/$id` |
| `CostPerOutcomeChip.tsx` (109) | zero importers | run receipt footer + `/tune/plan?view=usage` |
| `MemoryExpiryBanner.tsx` (85) | zero importers | `/recall?view=memory` |
| `ActivationFunnelPanel.tsx` (342) | zero importers | `/tune/platform?view=activation` |
| `ProviderCard.tsx`, `ProductBindingPicker.tsx`, `ApiKeyConnectDialog.tsx` | zero importers | `/tune/sources` (card, bindings row, connect modal) |
| `AmbientChip.tsx` (213) + `ambient.functions.ts` | zero importers; fetches weather | **Deleted.** Weather is not a product capability. See §7 |
| `researcher.functions.ts` (orphan) | no UI | `/tune/agents?view=watch` + Ask verb "Watch a competitor" |
| `design-parity.functions.ts` (orphan) | no UI | parity chip on the run view Design face + `/tune/workspace?view=brand` |
| `gate-signals.functions.ts` (orphan) | no UI | "Your pattern" on `/open/gate/$id` |
| `delegate-poll.functions.ts` (orphan) | dead poller | **Deleted.** Superseded by the `BuildDriver` dispatch path. See §7 |
| `/start` (`MissionOnboarding`) | real component, unreachable, nothing links to it | the only first-run route. See §3 |

---

## 3. THE LANDING DECISION

Today there is a three-way disagreement in code: `login.tsx:100` sends to `/`; `index.tsx:130` detects a session and replaces to `/m`; `/m/index` resolves the last product and opens the room; but `ObsidianOnboarding.tsx:684,1132` and `MissionOnboarding.tsx:63,72` all exit to `/today`, and `nav-model.ts` names `/today` as home. A brand-new user's first authenticated screen is the retired shell.

**Resolved: one shell, one landing, no state-dependent branching.**

| Who | First authenticated screen | Why |
| --- | --- | --- |
| **Returning user** | `/working` | The most recent run is the top row. If `getApprovalsQueue().length > 0`, the Waiting strip pins above it with the stakes summary and a single "Take these" button. The Ask bar is docked and focused-on-`/`. Time to comprehension: one glance, one sentence per row. |
| **Brand-new user, mid-onboarding** | `/start` | One question, chromeless. `MissionOnboarding` already renders this; it is currently unreachable. `_authenticated.tsx` `beforeLoad` sends `needsOnboarding` users here instead of `/onboarding`. |
| **Brand-new user, onboarding just finished** | `/open/run/$id` of the run onboarding kicked off | The first thing they see is **the machine working for them**, with the Trace lit on the J1 slice. Not a dashboard, not a tour. |
| **Brand-new user, empty workspace, no run** | `/working`, same shell, same URL | The empty state is the Deck rendered inline and expanded, with three starter verbs and one line: "What do you want to do first?" No illustration, no separate route, no `WarmSlot` special case. |

**Explicit rule: the landing route never changes based on state.** A landing that redirects differently depending on queue length or product count is exactly the incoherence the founder described. `/working` always. The *content* adapts; the address does not.

**Changes required to make this true:**

| File | Line | Change |
| --- | --- | --- |
| `src/routes/login.tsx` | 100 | `window.location.assign("/")` becomes `assign("/working")` |
| `src/routes/index.tsx` | 130 | session detect replaces to `/working`, not `/m` |
| `src/routes/_authenticated.tsx` | 37 | `redirect({ to: "/onboarding" })` becomes `redirect({ to: "/start" })` |
| `src/components/onboarding/ObsidianOnboarding.tsx` | 684, 1132 | route deleted with the component (§7) |
| `src/components/mission/MissionOnboarding.tsx` | 63, 72 | `navigate({ to: "/today" })` becomes `navigate({ to: "/open/run/$id" })` with the kicked-off run |
| `src/lib/nav-model.ts` | whole file | deleted (§7) |

---

## 4. THE JOURNEYS

Every journey below is grounded in `src/lib/journeys.ts`, whose `wiredVia` list is test-enforced against real exports. The founder named six partial slices plus the full loop; all seven exist as data already.

**Universal grammar, true for all seven:**
- **Start** is always the Ask bar. Type it, or pick the chip. There is no other entrance to learn.
- The run is created immediately and gets a URL: `/open/run/$id`. Everything after happens on that one screen. The Trace lights the slice; stages outside it stay visible and dim.
- **The machine works. The human judges at gates.** A gate always renders inline in the run's Thread *and* appears in `/waiting`. Same object, two doors, one count.
- **Nothing dead-ends.** The `journeyHandoffFor()` line renders at the Thread tail with exactly one forward door.

### J1 - "What should we build next?"

| Step | Screen | Machine does | Human does |
| --- | --- | --- | --- |
| 1 | Ask bar, anywhere | matches intent to J1 (`journeyForIntent`), creates the run | types it, or picks the chip |
| 2 | `/open/run/$id`, Trace lit 01-02 | Scout clusters signals (`clusterSignals`); Researcher fetches market signal if the workspace has none | watches, or leaves |
| 3 | same, Discover face | Critic reviews each cluster (`runCriticReview`), ICE-scores, ranks | reads the ranked list |
| 4 | same, gate card in Thread **and** `/waiting?kind=opportunity` | posts the gate (`getBriefAlignment` supplies the alignment read) | **keeps or kills each bet** (`decideApprovalItem`) |
| 5 | Rejoin line | offers "Tear this down first" (J2) and "Write the spec" (J3) | picks one, or stops |

**Ends at:** a ranked, Critic-reviewed bet list with the approved bet at the top of the queue and its evidence chain attached. **Terminal doors:** J2, J3, `/open/bet/$id`.

### J2 - "Tear this idea down"

| Step | Screen | Machine does | Human does |
| --- | --- | --- | --- |
| 1 | Ask bar **with an object attached** (a bet or spec) | requires the attachment; the Deck row is disabled with an honest reason when nothing is selected | picks the target |
| 2 | `/open/run/$id`, Trace lit 02 | Critic runs the wedge teardown (`runWedgeTeardown`); fans out parallel explorations (`dispatchExploration`) | reads the strongest case against |
| 3 | same | posts each exploration verdict | **accepts or rejects the batch** (`decideFanoutBatch`) |
| 4 | Rejoin line | offers "Write the spec" (J3) | picks, or kills the bet |

**Ends at:** a teardown verdict on the record, permanently attached to the idea. **Terminal doors:** J3, `/open/bet/$id`, `/recall?view=decisions`.

**Honest gap, stated in the UI:** there is no one-call "paste raw text and tear it down" seam. The verb requires an existing artifact. The Deck row says so rather than failing after the click.

### J3 - "Just write the PRD"

| Step | Screen | Machine does | Human does |
| --- | --- | --- | --- |
| 1 | Ask bar | accepts an approved bet **or** a bare typed idea | types it |
| 2 | `/open/run/$id`, Trace lit 03 | PRD Writer drafts with citations (`generatePrd`) | reads |
| 3 | same, Plan face | assist edits on request (`prdAssist`); builds the task graph (`generateTaskGraph`) | edits inline, asks for changes |
| 4 | gate card + `/waiting?kind=spec` | posts the spec gate | **approves the spec** |
| 5 | Rejoin line | offers "Design this" (J5) where the workspace has the design stage on, else "Build this feature" (J4) | picks |

**Ends at:** an approved, cited spec with assumptions on watch and a task graph. **Terminal doors:** J5, J4, `/open/spec/$id`.

### J4 - "Build this feature"

| Step | Screen | Machine does | Human does |
| --- | --- | --- | --- |
| 1 | Ask bar, or the J3 rejoin door | checks repo reachability (`canDispatchToRepo`); offers to create one (`provisionRepoForSpec`) if none | confirms the repo |
| 2 | `/open/run/$id`, Trace lit 05 | Builder dispatches the session (`dispatchStudioSession`); plan, files changed, terminal, CI strip all stream into the Build face | watches, or leaves and comes back |
| 3 | tool gates inline + `/waiting?kind=tool_call` | pauses on any tool in `confirm` or `review` mode | **approves the tool call** |
| 4 | same, diff panel | applies the changeset, runs CI, opens the PR, publishes the preview URL | reviews the diff, opens the preview |
| 5 | Rejoin line | offers "Launch what we shipped" (J6) | picks |

**Ends at:** applied changeset, green CI, a preview URL, a PR open on the user's repo. **Terminal doors:** J6, `/open/changeset/$id`, the PR (external).

### J5 - "Design this"

| Step | Screen | Machine does | Human does |
| --- | --- | --- | --- |
| 1 | Ask bar, or the J3 rejoin door | attaches the spec | picks the spec |
| 2 | `/open/run/$id`, Trace lit 04 | UX Architect generates the scaffold in the workspace brand (`generateDesignScaffold`) | views the prototype |
| 3 | same | Design Critic reviews (`runScaffoldDesignCritic`); parity check against brand (`checkDesignParity`) | reads the critique |
| 4 | gate card + `/waiting?kind=design_gate` | posts the design gate | **approves the mockup** (`decideDesignGate`) |
| 5 | Rejoin line | offers "Build this feature" (J4), which inherits the mockup | picks |

**Ends at:** an approved mockup bound to the spec. **Terminal doors:** J4, `/open/proto/$id`.

### J6 - "Launch what we shipped"

| Step | Screen | Machine does | Human does |
| --- | --- | --- | --- |
| 1 | Ask bar, or the J4 rejoin door | attaches the changeset | picks |
| 2 | `/open/run/$id`, Trace lit 06 | Release promotes preview to production (`promoteToProduction`) | **approves the promotion** |
| 3 | same, Ship face | writes release notes (`generateReleaseNotes`), the launch kit (`generateLaunchKit`), the launch plan (`generateLaunchPlan`) | edits, copies out |
| 4 | same | arms the outcome check with a date | **sets the date** |
| 5 | Rejoin line | offers "How did it land?" (J7), scheduled for the armed date | accepts or changes the date |

**Ends at:** live in production, changelog written, launch copy in hand, outcome check armed. **Terminal doors:** J7, `/open/release/$id`, `/recall?view=changelog`.

**Honest gap, stated in the UI:** the launch kit is drafts with copy-out. Nothing is published or scheduled from here. The buttons say "Copy", never "Post".

### J7 - "How did it land?"

| Step | Screen | Machine does | Human does |
| --- | --- | --- | --- |
| 1 | the armed date fires a gate into `/waiting?kind=assumption_challenge`, or Ask bar | pulls outcome data (`getOutcomeData`), confirms shipped (`checkPrdShipped`) | opens the gate |
| 2 | `/open/run/$id`, Trace lit 07 | shows the outcome contract next to what actually happened; flags challenged assumptions | **records the verdict** (`recordOutcome`) |
| 3 | same | writes the learning into the brain; links it back to the spec, the bet, and the originating signals | reads the compounding line |
| 4 | Rejoin line | offers "What should we build next?" (J1), now with this learning in the ranking | picks |

**Ends at:** the outcome recorded, the learning on the record, challenged assumptions flagged. **Terminal doors:** J1, `/recall?view=learnings`, `/recall?view=impact`.

**Honest framing, binding:** human-attested, not measured. The UI says "record how it landed", never "we measured how it landed".

### J0 - "Take it from signal to shipped"

Not a separate machine. The chain `J1 -> J2 -> J3 -> J5 -> J4 -> J6 -> J7` (`FULL_LOOP_CHAIN`), each slice's DONE flowing into the next START on one run id, one Trace, all seven stages lit. J5 participates only where `design_stage_enabled`; J2 is the optional adversarial beat and can be skipped from its own rejoin line.

**Ends at:** the loop closes at Learn and reads left to right on one Trace as a single slice. That is the demo, and it is the same screen a real user works on.

### The dead-end audit

| Terminal state | Forward door |
| --- | --- |
| Run finished, journey done | `journeyHandoffFor()` line, one door |
| Run failed | "Try again with what we learned" (re-dispatch, same intent, failure context attached) + "Ask why" |
| Gate declined | "Tell it what to do instead" (opens Ask prefilled with the decline reason) |
| Empty list, any lens | the Deck inline with the three verbs that would fill this list |
| Deep link to a missing object | named dead-end plus one door (§6) |
| Zero products in the workspace | Ask, prefilled: "Tell Supaprod what you are building" |
| Onboarding finished | the run it started |

---

## 5. THE INTERLINKS

This is the answer to "what are the set of features that needs to be interlinked".

**The backbone already exists and is under-used.** `artifact_lineage` (parent_kind, parent_id, child_kind, child_id, relation, rationale, **created_by_agent**, ai_event_id) with `ARTIFACT_KINDS` = signal, theme, opportunity, prd, roadmap_item, task, meeting, decision, mission, house_rule, design_memory, prototype, capability_change. `getLineage()` returns both directions with hydrated peer titles. `getProvenance()` walks the tree back to originating signals. `getEntityLineage()` gives the audit chain.

**The rule that fixes the disconnection.** Every entity detail view renders a **Chain strip**: back-links on the left, forward-links on the right, each one a clickable door with the peer title and the agent that made the edge. No entity view ships without it. This is one shared component (`ChainStrip`) reading `getLineage`, not eleven bespoke implementations.

| Entity | Route | Links FORWARD to | Links BACK to | Clickable doors in the UI |
| --- | --- | --- | --- | --- |
| **Signal** | `/open/signal/$id` | theme, bet | source (connection), meeting, transcript | ChainStrip both sides; "Source" chip opens `/tune/sources`; "Rank these" starts J1 |
| **Theme** | `/open/theme/$id` | bet | signals (many) | ChainStrip; "Signals (7)" expands inline, each row a door |
| **Bet** (opportunity) | `/open/bet/$id` | decision, spec, teardown verdict | theme, signals, learning that raised it | ChainStrip; "Evidence" opens the provenance tree; "Tear down" starts J2; "Write the spec" starts J3; "Keep or kill" opens `/open/gate/$id` |
| **Decision** | `/open/decision/$id` | spec, house rule, memory | bet, gate signal, precedent decisions | ChainStrip; "Precedent" lists prior similar decisions; "Share" mints `/d/$slug`; "Your pattern" opens the gate-signal read |
| **Spec** (prd) | `/open/spec/$id` | task graph, prototype, run, changeset, outcome contract | decision, bet, cited signals, cited docs | ChainStrip; every citation is a door to its signal or doc; "Design this" J5; "Build this" J4; "Assumptions on watch" opens the challenge rows |
| **Prototype** | `/open/proto/$id` | changeset (Build inherits it) | spec, brand kit (design_memory) | ChainStrip; "Brand" opens `/tune/workspace?view=brand`; "Parity" shows the `checkDesignParity` read; public `/p/$slug` share |
| **Run** (mission) | `/open/run/$id` | changeset, deployment, artifacts, receipts | spec, bet, the intent that started it, the journey slice | the Trace itself is navigation (each stage node opens its face); ChainStrip in the run header; "Every step" opens `/open/trace/$id` |
| **Changeset** | `/open/changeset/$id` | deployment, PR (external), capability change | run, spec, prototype | ChainStrip; "Diff" inline; "PR" external; "Promote" starts J6 |
| **Deployment** (release) | `/open/release/$id` | outcome, changelog entry, announcement | changeset, spec, launch plan | ChainStrip; "What changed" opens the changeset; "How did it land" starts J7; "Changelog" opens `/recall?view=changelog` |
| **Outcome** | `/open/outcome/$id` | learning, challenged assumptions, impact entry | deployment, spec's outcome contract | ChainStrip; "The contract" opens the spec anchor; "Record it" is the gate; "Impact" opens `/recall?view=impact` |
| **Learning** | `/open/learning/$id` | memory, future bet rankings, house rule | outcome, spec, originating signals (via `getProvenance`) | ChainStrip; "It changed this" lists the rankings this learning now weights; "Make it a rule" opens the house-rule gate |
| **Memory** | `/recall?view=memory`, row-level `/open/memory/$id` | every future run that cited it | learning, decision, doc, manual capture | ChainStrip; "Cited in (12)" lists runs, each a door; "Forget" (`forgetMemory`) with the confirm |
| **House rule** | `/open/rule/$id` | gates it now blocks or auto-approves | decision, learning | ChainStrip; "It stopped this" lists blocked gates |
| **Trace** | `/open/trace/$id` | receipt, cost, tool calls | run, agent | ChainStrip; each step opens its tool call; "Replay" |
| **Receipt** | `?drawer=receipt&id=` over any surface | the tamper seal, the public share | run, trace, agent, artifact | kebab on any artifact; the seal check inline |
| **Agent** | `?drawer=crew&agent=` over any surface | its runs, its scorecard, its grants | station, the runs it authored | crew drawer from any run; "What it may do" opens `/tune/agents` |
| **Meeting / transcript** | `/open/meeting/$id`, `/open/transcript/$id` | signals extracted, action items | calendar source, the recording | ChainStrip; "Extract signals" runs `extractActionsFromTranscript` |
| **Source** (connection) | `/tune/sources?connector=$p` | signals it produced, bindings | provider, credential chain | "What came in from here" opens `/working?lens=signals&source=$p` |

**Attribution is a link, everywhere.** `artifact_lineage.created_by_agent` is already populated and already selected by `getLineage`. Every ChainStrip row renders the agent chip (`AgentChip`), and every agent chip opens the crew drawer at that agent. That single wiring makes the 13-agent crew visible on every screen without a crew destination.

---

## 6. DEEP LINKS AND SUB-PAGES

### 6.1 The scheme

| Shape | Rule | Example |
| --- | --- | --- |
| Destination | one flat path segment, a verb | `/working` `/waiting` `/recall` `/tune` |
| Group (Tune only) | second segment | `/tune/agents` |
| Lens, tab, view, filter | **always a query param, never a route** | `/working?lens=traces` `/recall?view=memory` `/waiting?kind=spec` `/tune/plan?view=caps` |
| Object permalink | `/open/$kind/$id`, one namespace, zero exceptions | `/open/spec/9f2a...` `/open/run/...` `/open/gate/...` |
| Transient overlay | `?drawer=<name>` on the current URL | `?drawer=crew` `?drawer=receipt&id=...` |
| Ask prefill | `?ask=<text>` on any URL | `/working?ask=write%20the%20spec` |
| Scope override | `?w=<slug>&p=<slug>` on list routes | `/working?w=helio-labs&p=relay` |
| Legacy readable room | `/$workspaceSlug/$productSlug` kept alive forever, resolves to `/working?w=&p=` | `/helio-labs/relay` |

**Why `/open/$kind/$id` and not nine separate namespaces.** One rule guarantees total coverage: every kind in `ARTIFACT_KINDS` plus the eight runtime kinds (run, changeset, release, outcome, trace, gate, thread, transcript) is addressable, so an orphan permalink is structurally impossible. It is also readable pasted into Slack: `supaprod.ai/open/spec/checkout-retry`. The generic route resolves the kind, picks the renderer, and always renders the ChainStrip; specialised renderers (the 1084-line spec editor, the run view) register against their kind.

### 6.2 Modal versus page versus drawer

| Rule | Binding |
| --- | --- |
| **Anything with its own data fetch is a page.** | If it calls a server function to render, it gets a URL. No exceptions. This is the rule `/plan`'s seven child panels break today. |
| **Modals are transient only.** | Confirm, compose, connect. No fetch, no deep link, dismiss loses nothing. `ApiKeyConnectDialog` is the correct shape; `MissionSlideOver` is not. |
| **Drawers are addressable overlays.** | `?drawer=` restores over the parent page on reload, so a shared link opens the drawer in context rather than stranding the reader. Crew, receipt details, agent scorecard. |
| **Tabs never remount the shell.** | `?lens=` / `?view=` / `?kind=` change the body only. Already the pattern in `RoomSurface.validateRoomSearch`. |
| **Filters are additive and preserved.** | `navigate({ search: (prev) => ({...prev, lens}) })`, the functional form. Never a plain object; that bug is already documented at `_authenticated.build.index.tsx:661`. |

### 6.3 Deep link into missing parent state

**Resolve, never bounce.** The one existing good precedent is `_authenticated.$workspaceSlug.$productSlug.tsx`, which points the workspace context at the routed workspace before reading any product. Generalise it.

| Situation | Behaviour |
| --- | --- |
| Object exists, different workspace, you are a member | switch workspace context silently, render the object, flash the switcher |
| Object exists, you are not a member | named dead-end: "You do not have access to this spec." One door: "Ask to be added". Never leak whether it exists (RLS already gives the same answer for absent and forbidden) |
| Object id is malformed or gone | "That link points at something that is not here any more." Two doors: "Search for it" (opens Ask prefilled with the id) and "Back to Working" |
| Unknown `?lens=` / `?view=` / `?kind=` | fall back to the surface's default view, keep the path, strip the bad param from the URL. Same law `validateRoomSearch` and `normalizeSection` already implement |
| Legacy `?section=` / `?room=&view=` | mapped forward by a single table (`legacy-search.ts`), preserving all sixteen `SectionId`s and all four `RoomKey`s with their views |
| `/open/run/$id` where the run is still queued | render the run view with the Trace at 00 and the Thread showing "queued". Never a spinner-only screen |
| A drawer param with no parent data | drop the drawer, render the parent, no error |

**The four currently broken redirects, fixed:**

| Broken today | Fixed |
| --- | --- |
| `/briefing` points at a settings section id that does not exist | `/tune/you?view=sends` (a real section that owns the briefing schedule) |
| `/calendar` folds to Decisions and drops `?meeting=` | `/recall?view=meetings`, `?meeting=` forwarded as `/open/meeting/$id` |
| `/meetings/$id` folds to Decisions and drops the id | `/open/meeting/$id` |
| `/impact` folds to Decisions but its panel lives on `/learn` | `/recall?view=impact`, where `ImpactLedgerPanel` actually renders |

---

## 7. WHAT DIES

### 7.1 Routes deleted

| Route(s) | Absorbed by |
| --- | --- |
| `/today` (1543) | `/working` (the loop pulse becomes the Trace, the spotlight and needs-judgment become the Waiting strip, the desk composers become Ask verbs, tasks become `/working?lens=mine`) |
| `/decide` (zero own queries) | `/waiting?kind=opportunity` |
| `/ship`, `/learn` (presence chip only) | `/working?lens=releases`, `/recall?view=learnings\|impact\|support` |
| `/discover`, `/discovery`, `/opportunities`, `/product` | `/working?lens=signals` + the J1 verb + `/waiting?kind=opportunity` |
| `/plan`, `/prds`, `/prds/$id`, `/roadmap`, `/stakeholder` | `/open/spec/$id`, `/working?lens=made&kind=spec`, roadmap as a `?view=` on `/recall`, stakeholder pack as an Ask verb |
| `/plan/spec/$id` (1084) | `/open/spec/$id` (same renderer, new address) |
| `/design` (322) | Brand Kit to `/tune/workspace?view=brand`; Prototypes to `/working?lens=made&kind=proto` |
| `/build`, `/build/$missionId`, `/cockpit`, `/missions`, `/missions/$id`, `/studio`, `/studio/$id`, `/fleet`, `/delegate` | `/working` and `/open/run/$id` |
| `/brain`, `/knowledge`, `/memory`, `/docs`, `/impact`, `/changelog`, `/calendar`, `/meetings`, `/meetings/$id`, `/outcome` | `/recall` (+ `/open/meeting/$id`) |
| `/engine-room`, `/govern`, `/agents`, `/swarm`, `/analytics`, `/budgets`, `/drift`, `/evals`, `/eval-health`, `/prompts`, `/guardrails`, `/observe`, `/trust-ledger`, `/traces` | `/tune/agents`, `/tune/plan`, `/tune/machine`, `/working?lens=traces` |
| `/traces/$traceId` (861) | `/open/trace/$id` |
| `/approvals` (270) | `/waiting` |
| `/settings` (3433), `/notifications`, `/briefing`, `/integrations` | `/tune/*` (seven groups) |
| `/sync` (842) | `/tune/sources?view=bindings` |
| `/admin`, `/admin/*` (nine files, 4200 lines) | `/tune/platform?view=*` |
| `/m`, `/m/$productId`, `/m/index` | `/working`; `/m/$productId` kept as a permanent 301 to `/working?p=` |
| `/threads`, `/artifacts` | `/working?lens=asks`, `/working?lens=made` |
| `/tasks`, `/inbox`, `/chat` | `/working?lens=mine`, `/waiting`, Ask |
| `/onboarding` | `/start` |
| **All 41 `throw redirect` stubs** | `src/lib/legacy-redirects.ts` becomes a single forward map consulted by one catch-all, not 41 route files |

### 7.2 Components and modules deleted

| File | Reason | Absorbed by |
| --- | --- | --- |
| `src/components/supaprod/AppShell.tsx` (1033) | the 236px 10-destination rail is the stage-shaped IA in code | one shell (§8 step 1) |
| `src/components/mission/RoomChrome.tsx` (282) | the 4-door top bar is place-shaped | the same one shell; `RoomTopBar` survives as its ancestor |
| `src/lib/nav-model.ts` (246) | `PRIMARY_NAV` is the seven-stage rail as data | a new `destinations.ts` with five verbs |
| `src/components/supaprod/FocusDock.tsx` | fixed bottom-center, collides with the docked composer (found in live smoke 2026-07-19) | the Working strip |
| `src/components/supaprod/AmbientChip.tsx` + `src/lib/ambient.functions.ts` | weather is not a product capability | nothing. Deleted outright |
| `src/lib/delegate-poll.functions.ts` | dead poller, superseded by `BuildDriver` dispatch | nothing. Deleted outright |
| `src/components/onboarding/ObsidianOnboarding.tsx` | the retired-shell onboarding, exits to `/today` | `MissionOnboarding` at `/start` |
| `src/components/obsidian/MissionSlideOver.tsx` | a data-fetching overlay with no URL, breaking the page rule | `/open/run/$id` |
| `src/components/today/*` (the dashboard set) | `/today` dies | Waiting strip, Working strip, Working lenses |
| `src/components/supaprod/TopBar.tsx`, `PageHeader.tsx` (the Obsidian pair) | per-page chrome duplicated across ~68 routes | one `SurfaceHeader` |
| `src/lib/palette-recents.ts` local-storage recents | superseded by real cross-entity search | Ask > Open |

### 7.3 Concepts retired

| Concept | Why | What replaces it |
| --- | --- | --- |
| **The nav rail** | the 236px 10-destination zone list is the disease | a 52px top bar with five verbs and a docked input |
| **Two shells chosen by a pathname allowlist** (`_authenticated.tsx:146-185`) | any route added outside the allowlist silently renders in the retired shell. That is how a brand-new user's first screen ended up in the wrong app | one shell for every authenticated route, with two body modes: chromeless (`/start`) and normal. No allowlist |
| **"Stage as destination"** | the root cause of `/decide`, `/ship`, `/learn` | the Trace, scoped to a run |
| **"Room" as a place-name** | Mission Control, Engine Room, the four rooms | verbs |
| **`Cmd+K` opening the composer while a full palette exists unmounted** | search is currently unreachable | `⌘K` focuses the Ask bar, which shows the Deck |
| **Two counts** (approvals badge and a notification bell) | one count one source is already law and already violated by having a bell component nobody mounted | one count on Waiting; news is a dot |
| **Surface registry `status: 'planned'`** (109 of 168 entries) | a registry that records intent rather than truth stops being enforcement | every entry must be `live` after migration; the test fails on any `planned` |

---

## 8. THE MIGRATION

Nine steps. After each one the app builds, ships, and is navigable. No step leaves a dangling surface.

### Step 1 - One shell, no allowlist
Delete the `isReimaginedSurface` pathname allowlist in `_authenticated.tsx`. Introduce `AppFrame` (top bar with five verbs + docked Ask + Working strip) and mount it for every authenticated route, with a single `chromeless` escape for `/start`. `AppShell` and `RoomChrome` both still exist and both still render their bodies; only the outer frame changes. **Ship-safe because:** every existing route keeps its URL and its content; it just gains a coherent frame. The five verbs point at the old routes for now (`Working -> /build`, `Waiting -> /approvals`, `Recall -> /brain`, `Tune -> /settings`).

### Step 2 - Ask becomes real
Mount the Deck: revive `CommandPalette.tsx` as the Ask bar's empty state, merge `SuggestionPopover` rows and `JourneyChips` into it, bind `⌘K` to focus (not to a second overlay). Add the `?ask=` param. Add the `wiredVia` test to `palette-catalog.ts` so no Deck row can point at a dead route. **Ship-safe because:** additive. Nothing moves.

### Step 3 - Waiting
Rename `/approvals` to `/waiting`, add `?kind=` filters for all ten `kindKey`s, fold `OpportunityQueue` in as `?kind=opportunity`, build `/open/gate/$id`, mount `PendingApprovalsBar` as the pinned strip and `AttentionBell` as the news dot, wire `gate-signals.functions.ts` into the judgment view. Delete `/decide`. **Ship-safe because:** `/approvals` and `/decide` become forward maps; the queue is one component that already exists.

### Step 4 - `/open/$kind/$id` and the ChainStrip
Build the generic permalink route and the shared `ChainStrip` on `getLineage`. Register the existing renderers against their kinds: spec (`/plan/spec/$id`'s 1084 lines, moved not rewritten), run (`/build/$missionId`), trace (`/traces/$traceId`), plus new thin renderers for signal, bet, decision, proto, changeset, release, outcome, learning, memory, rule, meeting, transcript. Old routes forward. **Ship-safe because:** each renderer moves one at a time behind a forward map.

### Step 5 - Working
Build `/working` as the run list with lenses. Port the Mission Control room to `/open/run/$id` (Trace from `Spine`, Thread from `Thread.tsx`, stage faces from `faces.tsx`, all unchanged internally). Mount the six unmounted Working components (`TracesPanel`, `ExecutedCard`, `CookingBanner`, `MachineNow`, `CostPerOutcomeChip`, `AudioTranscriptPanel`). Fold `/build`, `/artifacts`, `/threads`, `/fleet`, `/delegate`, `/discover?tab=signals`, `/ship`'s history. **This is the largest step; it is fifth on purpose:** by now the frame, the input, the gates, and the permalinks all exist, so the run view has somewhere to link out to from day one.

### Step 6 - Recall
Build `/recall` from `/brain`'s four tabs plus `/learn`'s four panels plus `/ship`'s changelog and announcements. Mount `MemoryView` and `MemoryExpiryBanner` as the single memory home; delete the settings `memory` section and the `/brain?tab=memory` tab in the same commit (three homes to one, atomically). Fix the four broken redirects. Delete `/learn`, `/ship`, `/brain`, `/impact`, `/changelog`, `/calendar`, `/meetings`.

### Step 7 - Tune
Build the seven groups. `/settings`'s five groups map one-to-one onto You, Workspace, Agents, Sources, Plan with `SectionId` preserved. `/engine-room`'s four rooms split: Spend into Plan, Quality into Machine, Safety into Agents, **Record into Working and Waiting** (traces to `?lens=traces`, receipts to the receipt drawer, approval log to `/recall?view=decisions`, support to `/recall?view=support`). `/admin/*` becomes Platform. `/sync` becomes Sources > Bindings. `/design`'s Brand Kit becomes Workspace > Brand. Mount `ProviderCard`, `ProductBindingPicker`, `ApiKeyConnectDialog`, `ActivationFunnelPanel`, and `researcher.functions.ts`. Write `legacy-search.ts` mapping every old `?section=` and `?room=&view=` forward.

### Step 8 - The landing flip
Change the four entry points (§3 table). `/start` becomes the only first-run route; `/onboarding` and `ObsidianOnboarding` die. `MissionOnboarding` exits to the run it started. `/today` dies. **Do this only after steps 5 and 6**, so `/working` and `/recall` are real before anyone lands on them.

### Step 9 - Deletion and enforcement
Delete all 41 redirect stub files, replaced by one catch-all reading a single forward map. Delete `AppShell`, `RoomChrome`, `nav-model.ts`, `FocusDock`, `AmbientChip`, `ambient.functions.ts`, `delegate-poll.functions.ts`, `MissionSlideOver`, `src/components/today/*`, the Obsidian `TopBar`/`PageHeader` pair. Then turn the enforcement on:

| Test | Fails when |
| --- | --- |
| `surface-registry.test.ts` | any entry is `status: 'planned'`, or any `*.functions.ts` on disk has no entry, or any entry has no `opensFrom` |
| `destinations.test.ts` | the top bar has anything other than the five verbs, or a feature added a nav item |
| `deck.test.ts` | a Deck row's named server function does not exist (the `journeys.ts` `wiredVia` law, extended to the whole catalogue) |
| `permalinks.test.ts` | an `ARTIFACT_KIND` has no `/open/$kind/$id` renderer |
| `chain.test.ts` | an entity renderer does not mount `ChainStrip` |
| `one-home.test.ts` | two surfaces claim the same capability as HOME |
| `no-dead-end.test.ts` | a terminal state renders without a forward door |

---

## 9. The one-paragraph answer to the founder

You start in the Ask bar, which is on every screen and never empty: it shows you every verb the product can do, in your words. You pick one, or type one. The machine makes a run and gives it an address. On that one screen you watch the Trace light only the stages your verb touches, so a partial journey looks like a partial journey and the full loop looks like the full loop. Everything the machine does leaves a receipt with the agent's name on it, and every receipt is a door to the thing before it and the thing after it. When it needs you, one number appears next to Waiting, and that number is your entire job. When it is done, one line offers the next move. If you want to look something up you go to Recall; if you want to change how it behaves you go to Tune. There are five words in the navigation, they are all things you do, and none of them is a filing cabinet.
