# IA Proposal A - ONE ROOM

> _Created: 2026-07-28 · Last updated: 2026-08-03_

> Stance: the product IS the loop, so there is one place. Every other surface is a peel-back
> layer off it, not a departure from it.
> Written against verified code, 2026-07-28. Where this doc names a file, line count, or
> behaviour, it was read this session, not taken from a doc.

---

## 0. The diagnosis this design answers

The founder said he cannot tell where to start, what to do, why, how to end, or how to run a
partial journey. Read against the code, that is not a vagueness problem. It is four concrete
structural defects:

| # | Defect | Evidence in code |
| --- | --- | --- |
| D1 | **Two shells fight over one app.** | `src/routes/_authenticated.tsx:157-180` picks shell A vs shell B from a hardcoded pathname allowlist. Cross a boundary and the chrome, the nav model, the shortcuts, and the account menu all change under you. |
| D2 | **The nav rail confuses two orthogonal axes.** | `src/lib/nav-model.ts` puts `Discover..Learn` (WHERE IN THE LOOP) in the same list as `Brain` and `Pulse` (WHAT IS BEHIND THE LOOP). Nothing tells you these are different kinds of thing, so neither reads as anything. |
| D3 | **Destinations exist to make a story true.** | `/decide` is 70 lines with zero queries of its own - a header wrapped around `OpportunityQueue`, the exact component `/discover?tab=queue` renders. `/ship` and `/learn` mount lazy panels (`ShipHistoryPanel`, `ChangelogPanel`, `AnnouncementsPanel`, `LearningsPanel`, `ImpactLedgerPanel`) whose only own query is a presence chip. Three rail rows own nothing. |
| D4 | **Depth is reachable but not visible.** | `MissionShellView.tsx:307-344` renders Crew, Under the hood, Artifacts and Threads as `hidden sm:flex` text buttons in `var(--ink-subtle)` with no count, no shortcut, and no URL. That is exactly how the 2026-07-18 rebuild lost its depth. A button that exists but advertises nothing is hidden. |

**The thesis of this proposal:** D1-D3 are cured by collapsing to one room. D4 is the thing that
killed the last attempt, and it is cured by a *different mechanism from navigation* - a permanent,
counted, keyed, URL-addressable index of depth that never leaves the screen. The rest of this
document is mostly about D4, because that is where the burden of proof sits.

---

## 1. THE DESTINATIONS

### 1.1 The count

**One.**

```
/$workspaceSlug/$productSlug          The Room
```

That is the entire top-level nav. There is no rail, no tab bar of pages, no "home" that is not
the room. Signed in, you are in the room; you leave it only by signing out.

### 1.2 The four things that are not destinations, and what makes them not destinations

I am not playing a word game. Here is the honest full inventory of everything addressable, and
the test each one passes.

**The test for "destination":** does going there *replace the screen and change the chrome*?
If yes it is a destination. If the Spine, the Thread, the Composer and the depth rail all stay
live and only a region changes, it is a layer.

| Kind | Count | What it is | Passes the test? |
| --- | --- | --- | --- |
| **Destination** | 1 | `/$ws/$product` - The Room | - |
| **Workbench children** | 4 | `/$ws/$product/spec/$id`, `/mission/$id`, `/trace/$id`, `/prototype/$id` | No. Same TopBar, same Spine, same depth rail. Only the Thread and Canvas swap. Back returns to the exact canvas state. |
| **Depth panes** | 7 | `?pane=` (6) + `?gate=` (1). Over-panels sliding across the Canvas | No. Spine, Thread, Composer stay live behind them. |
| **Config overlay** | 1 | `?config=<group>&section=<id>` - Settings and Admin | No. Full-screen scrim; the room is still mounted and Escape returns you exactly where you were. |
| **Resolvers** | 3 | `/m`, `/m/$productId`, and one legacy catch-all. Never render; always rewrite to a room URL | No. They are plumbing and live for one frame. |
| **Unauthenticated** | n | `/login`, `/signup`, `/join/$token`, the public pages | Out of scope. |

### 1.3 The room's name, in the user's words

Not "Mission Control" (ours, and it names a NASA metaphor nobody asked for). Not "Today" (a
calendar word for a thing that is not a calendar). Not "Dashboard".

The room is named **after the product you are in**. The TopBar reads `Helio Labs / Relay`, and
that is the destination's name. Ask a PM where they work and they say "I'm in Relay", not "I'm
in Mission Control". The chrome carries the mark and the switcher; the *place* is the product.

The four canvas-region names, in the user's words, appear only as labels on the thing itself:

| Region | On-screen name | Answers |
| --- | --- | --- |
| Spine | `01 Discover ... 07 Learn` | Where in the loop is this? |
| Thread | *(unlabelled - it is the conversation)* | What is going on, and what does it want from me? |
| Canvas | the stage's own name | What is the work in front of me? |
| Composer | "Ask or tell Supaprod to do something" | What do I want next? |

### 1.4 What I rejected, and why

| Rejected | Why it is not a destination |
| --- | --- |
| **Today** | It is the disease, not the cure. `_authenticated.today.tsx` is 1543 lines pulling `getGreeting`, `getTodayLanes`, `getApprovalsQueue`, `listFanoutBatches`, `listLearnings`, `getProductContext`, `getAgentFleet` - a dashboard *about* the loop, sitting next to the loop, guaranteeing that everything appears twice and nothing connects. Its own onboarding exits point here (`ObsidianOnboarding.tsx:684,1132`; `MissionOnboarding.tsx:63,72`) while the landing sends returning users to `/m`, which is the three-way split. A dashboard is what you build when you do not trust your product to be legible. The room is legible. |
| **Discover / Decide / Plan / Design / Build / Ship / Learn as seven pages** | Seven pages is seven contexts, seven headers, seven scroll positions, and seven chances to lose the artifact you were carrying. The Spine already renders all seven, always, with per-stage state (`Spine.tsx`, `StageLoopState`). Making them pages duplicates the Spine and then contradicts it. They become **canvas faces**, which is what `faces.tsx` already built. |
| **Decide, Ship, Learn** (specifically) | They own nothing. Founder's own rule: a destination that exists to make a story true is a defect. Confirmed above (D3). They die hardest. |
| **Approvals** | One count, one source. It is already `["approvals","queue",workspaceId]` shared by `RoomChrome.tsx:238`, `MissionShellView` NeedsYouPill, the Spine's ember gate nodes, and `/approvals`. A destination makes the fourth copy. It becomes the ember tray. |
| **Brain** | The hardest call, because the investor canon names it as layer 03. But a destination is where you *go to work*; the Brain is what you *consult while working*. Sending someone out of the loop to read what the loop knows is the exact "not connecting" the founder described. It becomes the largest depth pane, opened over the canvas, so a decision's precedent sits beside the decision. Layer 03 does not need a URL of its own to be a pillar; it needs to be present at the moment of judgment, which a destination cannot do and a pane can. |
| **Engine Room / Pulse** | `/engine-room` is 4 rooms x 5-7 views = 22 sub-views behind a rail behind a nav item labelled with a word ("Pulse") that does not appear in its own URL. It splits into two panes on a real distinction the user already feels: **what happened** (Record) and **how it is running** (Spend + Quality + Safety). |
| **Settings** | 3433 lines, 5 groups, 16 sections - and every one of them is a thing you configure *so the room behaves differently*. Linear, Vercel and Notion all overlay settings over the app for exactly this reason: you want to see what you changed. It becomes the config overlay. |
| **Admin console** | Operator work on a different subject (the platform, not your product). It stays deep on purpose - see §2.4. |
| **Threads / Artifacts** | Already shipped as routes (`ThreadsSurface.tsx`, `ArtifactsSurface.tsx`) reached from `hidden sm:flex` text buttons. They are archives - lists you scan, then return. Perfect panes; terrible destinations. |
| **A Cmd+K palette as "the nav"** | Search is a power tool, not an information architecture. It answers "take me to a thing I can already name". It cannot answer "what should I do". It ships (§6.6) but it is not the IA. |

---

## 2. THE HOME TABLE

**Two laws, enforced by test (`surface-registry.test.ts`, rewritten - see §8 P8):**

- **No orphans.** Every server-function domain and every mounted component names exactly one home,
  and that home must be expressible as a real URL string.
- **No second homes.** A capability appears in exactly one place. It may be *linked* from many
  places (that is §5, the interlinks) but it is *rendered* in one.

**Click convention.** Login lands you in the room with zero clicks (§3). So "1 click" means one
click from the room as it opens. Keyboard equivalents are given because they are the real answer
for a daily user.

### 2.1 The Spine and the seven canvas faces - 1 click each

The Canvas shows exactly one stage face. `?stage=` selects it; the Spine and keys `1`-`7` set it.

| Stage | URL | Absorbs (real code) | Clicks |
| --- | --- | --- | --- |
| 01 Discover | `?stage=discover` | `/discover` + `DiscoverSurface` (Signals), `/discovery`, `/opportunities`, `researcher.functions` targets, `AudioTranscriptPanel` recordings lane, meetings-as-signal | 1 (`1`) |
| 02 Decide | `?stage=decide` | `OpportunityQueue` (from `/decide` and `/discover?tab=queue`), teardown verdicts, `gauntlet`, `contradiction-auditor`, `shared-premise`, `decision-currency` | 1 (`2`) |
| 03 Plan | `?stage=plan&view=` | `/plan` + `PlanSurface` five views (`goals`, `loops`, `roadmap`, `specs`, `stakeholders`), `/prds`, `/roadmap`, `/stakeholder`, `task-graph` | 1 (`3`) |
| 04 Design | `?stage=design` | `/design` Prototypes pane, `design-scaffold`, `flows`, `design-interchange`, the design gate | 1 (`4`) |
| 05 Build | `?stage=build&view=` | `/build` three lenses (`missions`, `agent`, `lane`), `/cockpit`, `/missions`, `/studio`, `/fleet`, `/delegate`, `design-parity.functions` on the changeset card | 1 (`5`) |
| 06 Ship | `?stage=ship` | `ShipHistoryPanel`, `ChangelogPanel`, `AnnouncementsPanel`, `deployments`, `launch-plan`, `changelog-heartbeat` | 1 (`6`) |
| 07 Learn | `?stage=learn` | `OutcomesPanel`, `LearningsPanel`, `SupportPanel`, `ImpactLedgerPanel`, `/outcome`, `funnel`, `goals`, `pm-impact`, `product-analytics` | 1 (`7`) |

> **Note on `/design`:** its *Brand Kit* half does not come here. Brand is configuration
> (`DesignMemoryPanel`), and `settings-sections.ts` already has a `brand` section under Workspace.
> Brand Kit goes there; Prototypes come to face 04. The route dies.

### 2.2 The depth rail - the answer to D4

A **48px strip on the right edge of the room, present on every room surface and every workbench
child, at every breakpoint, never `hidden`.** Seven tiles, each an icon plus a live mono count.
Hovering or focusing expands the strip to 240px and reveals the full question label; the label is
always in `aria-label` and the tooltip. Clicking opens a **420px over-panel** across the Canvas.
The Spine stays. The Thread stays. The Composer stays. The URL gains `?pane=`.

| Tile | Label (the user's words) | Key | URL | Owns |
| --- | --- | --- | --- | --- |
| ◆ ember | **Your call** | `g` | `?gate=open` | The approvals queue (`getApprovalsQueue`, `decideApprovalItem`, `sendBackApprovalItem`), all 10 gate families, plus a second section **Heads up** for `notifications` + `announcements` (this is where `AttentionBell.tsx` finally mounts), plus **What your calls taught us** (`gate-signals.functions.getGateSignals`) |
| 1 | **What we know** | `k` | `?pane=brain` | `/brain`'s four tabs (Decisions, Learnings, Docs, Graph) + `memory`, `memory-candidates`, `MemoryList`, `MemoryReviewQueue`, `MemoryView`, `MemoryExpiryBanner`, `decision-precedent`, `brain-insights`, `knowledge-graph-*`, `strategy-registry`, `playbooks` |
| 2 | **What happened** | `r` | `?pane=record` | Engine Room's Record room whole: `verify`, `receipts` (the tamper-evident ledger + share controls), `traces` (`TracesPanel`), `approvals` log, `support`. Plus `ExecutedCard`, `lineage`, `audit-lineage`, `trust-chain`, `artifact-rewind` |
| 3 | **What we made** | `m` | `?pane=made` | `ArtifactsSurface` - prototypes, specs, docs, mockups, releases, with versions and rename/delete |
| 4 | **What we said** | `t` | `?pane=threads` | `ThreadsSurface` - every conversation, `conversations`, `?c=<id>` |
| 5 | **Who is working** | `c` | `?pane=crew` | `CrewDrawer` (the 13: Chief of Staff + 12 cast), `agent-fleet`, `agent-runs`, `agent-scorecard`, `capabilities`, `swarm`, `fanout`, `orchestrator`, `ambient`, `product-context`, live activity |
| 6 | **How it is running** | `e` | `?pane=engine` | Engine Room's other three rooms: Spend (trend, by-agent, caps, usage, `CostPerOutcomeChip`), Quality (score, calibration, suites, drift, self-improvement, prompts, proof), Safety (rules, controls, team-trust, house-rules, routines, incidents) |

Why this is genuinely not hidden - the five properties the recessed doors lacked:

1. **Permanent.** It is a region of the shell, not a set of buttons in a header's overflow. It has
   a fixed pixel budget and it is never conditionally rendered.
2. **Counted.** Every tile carries live state: gates waiting, unreviewed memory candidates, new
   receipts since your last look, agents working right now, rooms on watch. A tile with a number
   on it advertises its contents. `nav-model.ts`'s ten rows carried nothing.
3. **Keyed.** `g k r m t c e`. Digits belong to the Spine (`1`-`7`), letters to the rail. Two
   axes, two keyboards, no collision. This is the shortcut law from `nav-model.ts:174-191`
   corrected: today `8` = Brain and `9` = Pulse sit in the same numeric space as the stages,
   which is exactly the axis confusion of D2.
4. **Addressable.** `?pane=brain&view=graph&item=dec_88` is a link you can paste to a colleague.
   The recessed doors produced no URL at all for Crew.
5. **Non-destructive.** Opening one does not throw away where you were. That is why it can be one
   click for everything - there is nothing to lose by clicking.

**Sub-tabs inside a pane are `?view=`; a row opened inside a pane is `?item=`.** So the deepest
depth in the app - a single trace step inside the Record pane - is 3 clicks and one URL:
`?pane=record&view=traces&item=trc_9`. Or 1 click if you arrive from the receipt that names it.

### 2.3 The config overlay - Settings

A **gear** sits immediately left of the account chip in the TopBar. One click opens a full-screen
overlay over the room (the room stays mounted; Escape returns you to the exact canvas state).
`settings-sections.ts` already models this correctly and does not change: 5 groups, 16 sections,
every legacy `?section=` id preserved by `normalizeSection`.

| Group | Sections | URL | Clicks |
| --- | --- | --- | --- |
| You | profile, notifications | `?config=you&section=profile` | 2 |
| Workspace | workspace (Brief & voice), brand, products, memory | `?config=workspace&section=brand` | 2 |
| Agents | staff (Roster), autonomy (Autonomy & approvals), ai (Models & keys) | `?config=agents&section=autonomy` | 2 |
| Connections & Data | connections (Sources, incl. `ProviderCard` + `ApiKeyConnectDialog`), sync (Sync & bindings, absorbing all of `/sync` + `ProductBindingPicker`), interop (Agent access / MCP), data (Your data) | `?config=connections&section=sync` | 2 |
| Plan & Usage | billing, credits, health (Diagnostics) | `?config=plan&section=credits` | 2 |

**One correction to the existing model.** `settings-sections.ts` places `memory` under Workspace,
while `/brain?tab=learnings` renders agent memory and `/memory` redirects to `/brain?tab=memory`.
That is the three-homes bug the brief names. **Resolution: Memory has exactly one home - the
Brain pane, `?pane=brain&view=memory`.** The `memory` section id is removed from
`SETTINGS_GROUPS` and added to `LEGACY_SECTION_MAP` pointing at a redirect that opens the pane.
What stays in Settings is only the *policy* (retention window, auto-promote on/off), which is
configuration, not content, and it lives under Workspace as `memory-policy`.

### 2.4 Admin - the one deliberate 3-click path

| Surface | URL | Clicks |
| --- | --- | --- |
| Admin overview | `?config=admin&section=overview` | 3 |
| People, Workspaces, Platform, Routing, Pricing, Health (observability), Spend (ai-costs), Proof (incl. `ActivationFunnelPanel`) | `?config=admin&section=<id>` | 3 |

**Why deeper is right here, stated plainly.** Admin is not a lens on your product; it is operator
work on a different subject entirely - other people's workspaces, platform pricing, model routing.
It is role-gated (`amIAdmin`). Putting it two clicks from every PM's daily surface is how you get
an accidental pricing change. Three clicks behind a gear, inside a gated group, is the correct
friction. The `/admin/*` paths survive forever as resolvers so an operator's bookmark still works
in one hop.

### 2.5 The workbench children - the deep work surfaces

**The modal-vs-page law:** if a thing can be worked on for more than a minute, or handed to
someone outside the loop, it is a **page**. Otherwise it is a **param on the room**.

Four things pass that test. Each gets a real child route that wears the same room chrome - same
TopBar, same Spine, same depth rail - with the Thread column replaced by that object's own
sequence and the Canvas given to the work.

| Child | URL | Replaces | Thread column becomes | Clicks |
| --- | --- | --- | --- | --- |
| Spec editor | `/$ws/$product/spec/$specId?tab=` | `/plan/spec/$id` (1084 lines), `/prds/$id` | The spec's provenance: citations, the signals it came from, the decision that authorized it | 2 (Plan face → row) |
| Mission | `/$ws/$product/mission/$missionId` | `/build/$missionId` (870), `/missions/$id`, `/studio/$id` | The mission's step log, live | 2 (Build face → row) |
| Trace | `/$ws/$product/trace/$traceId` | `/traces/$traceId` (861) | The run's steps, replayable | 2 (Record pane → row) or 1 from any receipt |
| Prototype | `/$ws/$product/prototype/$id` | the `/design` prototype viewer | The design critic's notes and the gate verdict | 2 (Design face → row) |

This is the direct answer to *"even if you click deep link subpages, everything should be in the
same thing"*. A trace opened from a Slack link renders with the Spine lit at the stage that
produced it, the depth rail on the right with its counts, and the product switcher in the
TopBar. There is no such thing as arriving somewhere that is not the room.

### 2.6 Everything currently homeless - assigned

**The 13 unmounted components** (verified this session: zero references anywhere in `src/`):

| Component | Home | Clicks |
| --- | --- | --- |
| `supaprod/AttentionBell.tsx` (97, real notifications query) | Gates tray → **Heads up** section | 1 (`g`) |
| `audio/AudioTranscriptPanel.tsx` (393, complete transcription backend) | Two doors, one render: the **composer mic verb** dictates; the **Discover face → Recordings lane** lists and opens transcripts, and `extractActionsFromTranscript` promotes a line to a signal | 1 |
| `observe/TracesPanel.tsx` | Record pane → **Every run** | 1 (`r`) |
| `today/ExecutedCard.tsx` | Record pane → **What just happened** | 1 (`r`) |
| `today/CostPerOutcomeChip.tsx` | Engine pane → Spend → **Over time** (cost stays out of the room by the honesty rule; the Engine pane is where it lives) | 1 (`e`) |
| `connections/ProviderCard.tsx` | Settings → Connections → Sources | 2 |
| `connections/ApiKeyConnectDialog.tsx` | Settings → Connections → Sources (the paste-a-key path) | 3 |
| `connections/ProductBindingPicker.tsx` | Settings → Connections → Sync & bindings | 2 |
| `plg/MemoryExpiryBanner.tsx` | Brain pane → Memory (banner) **and** a gate card when memory is within 7 days of expiry | 1 (`k`) |
| `today/PendingApprovalsBar.tsx` | **Deleted.** The Gates tray and the ember tile are the one count. | - |
| `admin/ActivationFunnelPanel.tsx` | Admin → Proof | 3 |
| `supaprod/CookingBanner.tsx`, `supaprod/AmbientChip.tsx`, `obsidian/today/MachineNow.tsx` | **Deleted.** All three are pre-`WorkingStrip` attempts at the same job. `WorkingStrip.tsx` does it correctly and honestly (no cost figures, honest time only). | - |
| `supaprod/AiWorking.tsx` | The `WorkingStrip` live-locus indicator and the Composer's in-flight state | 0 (ambient) |

**The 4 orphaned server-function domains:**

| Domain | Exports | Home | Clicks |
| --- | --- | --- | --- |
| `researcher.functions` | `getResearcherTargets`, `updateResearcherTargets` | Discover face → **Watching** strip, edited inline (the Engine-Room doctrine's "name the outcome, not the mechanism": the label is "What the crew is watching", not "researcher targets") | 1 |
| `design-parity.functions` | `getDesignParity`, `checkDesignParity` | Build face → changeset card → **Matches the design** row; failure opens the diff against the mockup | 1 |
| `gate-signals.functions` | `getGateSignals` (the write half is already wired from `discovery.functions` and `agent_loop.functions`) | Gates tray footer → **What your calls taught us** | 1 (`g`) |
| `delegate-poll.functions` | `pollDelegateRun` | **Deleted.** Delegate folded into Build's By-Lane lens; the poller has no caller and no future one. | - |

**The four broken legacy redirects - fixed, with one correction to the brief:**

| Path | Reality (verified) | Fix |
| --- | --- | --- |
| `/impact` | Redirects to `/brain?tab=insights` → `LEGACY_TABS` folds `insights` → `decisions`, but `ImpactLedgerPanel` is only mounted on `/learn`. Genuinely broken. | → `?stage=learn&view=impact` |
| `/calendar` | → `/brain?tab=calendar` → folds to `decisions`; `CalendarPanel` is unmounted. Broken. | → `?stage=discover&view=meetings` |
| `/meetings/$id` | Same fold, and `?meeting=` is silently dropped. Broken. | → `?stage=discover&view=meetings&item=<id>` |
| `/briefing` | **Not broken.** It redirects to `/settings?section=brief`, and `LEGACY_SECTION_MAP` maps `brief` → `workspace`. It resolves to Workspace → Brief & voice today. | → `?config=workspace&section=workspace` (unchanged behaviour, new URL) |
| `/start` | Renders a real one-question onboarding component and nothing links to it. | The component becomes the room's **first-light Thread card** (§3.2). The route dies. |

**The remaining named surfaces:**

| Surface | Home | Clicks |
| --- | --- | --- |
| `/sync` (842) | Settings → Connections → Sync & bindings | 2 |
| `/settings` (3433) | The config overlay | 1-2 |
| `/today` (1543) | Dissolved: greeting + `IntelBriefPanel` + `getProductContext` → the **Thread briefing card**; `JudgmentLane` → the **Gates tray**; `WatchLane` → **Discover face**; `ReceiptsStrip` → **Record pane**; `ColdStartOnramp` → **first light**; `DeskRail`/PM Desk → the **WorkingStrip + Composer** | - |
| `/approvals` (270) | The Gates tray | 1 (`g`) |
| `/threads`, `/artifacts` | Panes 4 and 3 | 1 |
| `/engine-room` (4 rooms x N) | Split: Record → pane 2, Spend/Quality/Safety → pane 6 | 1 |
| `/traces` (bare list) | Record pane → Every run | 1 |
| `/onboarding`, `/start` | First light, in the room | 0 |

**Nothing is homeless. Nothing has two homes.** The one deliberate duplication in the whole design
is the *gate object*, which by design renders three ways from one query - the ember Spine node,
the tray card, and the inline card in the Thread. That is `ApprovalsTray.tsx`'s existing "one
object, three renderings, one count, one source" contract and it is correct: a gate must be
visible where the work is, not only where the queue is.

---

## 3. THE LANDING DECISION

### 3.1 The rule

> **Every authenticated session, first frame, every time, for everyone: the room.**
> `/$workspaceSlug/$productSlug`

The current three-way disagreement is resolved by deleting two of the three answers:

| Today | Tomorrow |
| --- | --- |
| Login → `window.location.assign("/")` → landing detects session → `window.location.replace("/m")` → resolve → room | Login → `/m` directly (one hop, no public-page bounce), `/m` resolves last-active product and replaces with the room URL |
| Onboarding completion → `/today` (`ObsidianOnboarding.tsx:684,1132`, `MissionOnboarding.tsx:63,72`) | There is no onboarding completion event, because there is no onboarding route (§3.2) |
| `nav-model.ts` "home" → `/today` | There is no nav model |

`/m` and `/m/$productId` are kept **forever** as resolvers. Every recorded demo, pasted link and
bookmark keeps working, exactly as `room-url.ts` already documents.

### 3.2 What a brand-new user sees

The same shell. Not a wizard, not a different route, not a full-viewport chromeless page. The
room, in its **first-light** state.

| Region | First light |
| --- | --- |
| TopBar | Mark, `Your workspace / your first product`, gear, account, depth rail on the right with all counts at zero and one at `1` |
| Spine | All seven stages present and quiet. This is the single most important pixel in the product: on the first frame you can see the whole thing you bought. |
| Thread | One card: **"What are you building?"** - this is the `/start` component (`MissionOnboarding`), mounted here instead of stranded. One sentence in, `saveBrief` runs, `finish()` marks the profile onboarded, and the card is replaced by the crew's first briefing. Skipping is a link, not a wall. |
| Canvas | The **seven journey cards**, full size (§4). Not chips in a popover - cards. "What should we build next", "Just write the PRD", "Tear this idea down", "Build this feature", "Launch what we shipped", "How did it land", and "Take it from signal to shipped". Each card carries its own `startState` line from `journeys.ts` so it says what it needs from you before you click. |
| WorkingStrip | "Nobody is working yet. Pick a journey or just say what you want." |
| Composer | Focused, empty, placeholder `Tell Supaprod what you are building.` |

The `needsOnboarding` gate in `_authenticated.tsx:34-39` stops throwing a redirect and instead
sets `?first=1` on the room URL, which is what turns the Thread's first card on. A user who
refuses to answer is not trapped, and a user who answers never changes context.

### 3.3 What a returning user sees, in the first second

Same regions, same pixels, different content. Resolution order, all from data that already exists:

1. **Spine** paints from `getLoopState` - real per-stage state, real receipts, real gate counts.
2. **Canvas** opens on the stage the Spine says is live. If a journey is active
   (`?journey=` persisted), the slice is lit and the canvas lands on the slice's first unfinished
   stage. If gates are waiting, the ember tile pulses but the canvas does **not** hijack - a queue
   is not an agenda.
3. **Thread** shows the briefing card (`getGreeting` + `briefs.functions.getProductContext`,
   both already live on `/today`), then any inline gate, then the last exchange.
4. **Depth rail** paints its counts. This is the "what changed while I was gone" answer, and it is
   the reason the counts are load-bearing rather than decorative.

**The first second says three things without being read:** where the product is in its loop (the
Spine), what the machine is doing (the WorkingStrip), and what is waiting on you (the ember).
That is "where do I start, what do I do, why" answered structurally.

---

## 4. THE JOURNEYS

`src/lib/journeys.ts` already encodes J0-J7 with verified wiring (`wiredVia`, test-enforced) and
handoffs. It is the most valuable unused asset in the codebase. This design promotes it from a
composer-chip data file to **the primary interaction model**.

### 4.1 The mechanic

Picking a journey does three things, all reversible, all in the URL:

1. Lights that journey's Spine slice; stages outside it dim but stay present
   (`isStageDimmed`, already built).
2. Moves the Canvas to the slice's first stage (`journeyActivation`, already built).
3. Puts a **journey cap** at the top of the Thread: the journey's `startState`, the current step,
   and - always - an "Or do the whole loop" escape.

`?journey=j3` persists it across reload and deep links. Clearing it un-dims the Spine. **This is
the founder's "only certain journeys instead of the entire lifecycle", and in a one-room design
it costs nothing to build, because a journey is a *filter on the room*, not a different app.**

Three doors into every journey, all one click: a journey card on the canvas, a Spine node, or
typing intent in the Composer (`journeyForIntent` already matches "what should we build next",
"tear it down", "prd", "launch", "how did it land").

### 4.2 The seven slices, wired

Legend: **M** = the machine acts. **H** = the human decides. A journey is never allowed to end
without a door.

---

**J1 - "What should we build next?"** · `?journey=j1` · Spine `01→02`

| Step | Where | Who | What |
| --- | --- | --- | --- |
| Start | Discover face | H | Say it, or click the card. Works from zero: with no sources, the Researcher fetches market signal first (`researcher.functions` targets). |
| 1 | Discover face | M | `clusterSignals` groups raw signal into themes; Watch lane shows sources moving |
| 2 | Discover face | M | Themes become ranked bets with evidence chains |
| 3 | Decide face | M | `runCriticReview` red-teams the top bets; `getBriefAlignment` scores each against your brief |
| 4 | **Gate** - ember Spine node 02, tray card, and inline in the Thread | **H** | Keep or kill each bet. `decideApprovalItem`. |
| End | Decide face | - | A ranked, Critic-reviewed bet list; the approved bet at the top with its evidence chain |
| **Next** | Thread handoff (`journeyHandoffFor`, built) | - | Two doors: **"Tear it down first"** (J2) or **"Write the spec"** (J3) |

**J2 - "Tear this idea down"** · `?journey=j2` · Spine `02`

| Step | Where | Who | What |
| --- | --- | --- | --- |
| Start | Decide face, with a bet or spec in `?focus=` | H | Requires an artifact - honest scoping, per the catalog's GAP note. From free text, the composer first creates the opportunity, then tears it down; the Thread says so. |
| 1 | Decide face | M | `runWedgeTeardown` builds the strongest case against |
| 2 | Decide face | M | `dispatchExploration` fans out counter-evidence across the crew |
| 3 | **Gate** | **H** | `decideFanoutBatch` - accept, reject, or send back each branch of the teardown |
| End | Decide face | - | A teardown verdict on the record, attached to the idea permanently |
| **Next** | Thread handoff | - | **"Write the spec anyway"** (J3) or **"Kill it"** (records the decision, returns to Discover) |

**J3 - "Just write the PRD"** · `?journey=j3` · Spine `03`

| Step | Where | Who | What |
| --- | --- | --- | --- |
| Start | Plan face, or the composer from an approved bet, **or a bare idea typed with no upstream at all** | H | The founder's named slice. No discovery required. |
| 1 | Plan face | M | `generatePrd` drafts; citations resolve against the Brain live |
| 2 | **Spec workbench** `/spec/$id` | H+M | Edit alongside `prdAssist`. Thread column shows provenance: which signals, which decision. |
| 3 | Spec workbench | M | `generateTaskGraph` decomposes into work |
| 4 | **Gate** | **H** | Approve the spec. Assumptions go on watch with dates. |
| End | Spec workbench | - | An approved, cited spec with assumptions on watch and a task graph |
| **Next** | Thread handoff | - | **"Design it"** (J5) where the design stage is on, else **"Build it"** (J4) |

**J5 - "Design this"** · `?journey=j5` · Spine `04`

| Step | Where | Who | What |
| --- | --- | --- | --- |
| Start | Design face with a spec in `?focus=` | H | Spec may be draft or approved |
| 1 | Design face | M | `generateDesignScaffold` produces the prototype in your brand (Brand Kit from Settings → Workspace → Brand) |
| 2 | Prototype workbench | M | `runScaffoldDesignCritic` reviews against the brand and the spec |
| 3 | **Gate** | **H** | `decideDesignGate`. Approve, or send back with a note. |
| End | Prototype workbench | - | An approved mockup bound to the spec. Build inherits it. |
| **Next** | Thread handoff | - | **"Build it"** (J4) |

**J4 - "Build this feature"** · `?journey=j4` · Spine `05`

| Step | Where | Who | What |
| --- | --- | --- | --- |
| Start | Build face with an approved spec | H | No repo? `canDispatchToRepo` says so and `provisionRepoForSpec` offers to create one in your GitHub. Never a dead end. |
| 1 | Build face | M | `dispatchStudioSession` - agents write real code |
| 2 | **Mission workbench** `/mission/$id` | M | Live steps; WorkingStrip carries the verb; checkpointing loop pauses at tool-approval boundaries |
| 3 | **Gate** (inline, mid-run) | **H** | Approve a tool call the agent needs. Resume. |
| 4 | Mission workbench | M | CI runs; `checkDesignParity` reports whether the code matches the approved mockup |
| 5 | **Gate** | **H** | Review the changeset. Approve → PR opens on your repo. |
| End | Mission workbench | - | Applied changeset, green CI, preview URL, PR opened |
| **Next** | Thread handoff | - | **"Launch it"** (J6) |

**J6 - "Launch what we shipped"** · `?journey=j6` · Spine `06`

| Step | Where | Who | What |
| --- | --- | --- | --- |
| Start | Ship face with a shippable changeset | H | |
| 1 | **Gate** | **H** | `promoteToProduction` - preview to production is a human call, always |
| 2 | Ship face | M | `generateReleaseNotes` + `generateLaunchKit` + `generateLaunchPlan` |
| 3 | Ship face | H | Copy out. **Honest edge:** nothing is published or scheduled from here; the UI offers copy, never "send". |
| 4 | Ship face | M | Arms the outcome check with a date, from the spec's outcome contract |
| End | Ship face | - | Live in production, changelog written, launch copy in hand, outcome check armed |
| **Next** | Thread handoff | - | **"See how it lands"** (J7), which is dated - the Thread says *when* it will come back to you |

**J7 - "How did it land?"** · `?journey=j7` · Spine `07`

| Step | Where | Who | What |
| --- | --- | --- | --- |
| Start | **The gate finds you.** This is the only journey whose primary entry is `gate`, not a chip: the armed outcome check fires and lands in the Gates tray on its date. | M | `checkPrdShipped` |
| 1 | Learn face | M | `getOutcomeData` assembles what happened against the outcome contract |
| 2 | Learn face | **H** | `recordOutcome`. **Honest edge:** human-attested. The UI says "record how it landed", never "we measured how it landed". |
| 3 | Learn face | M | Challenged assumptions flag; the learning writes to the Brain |
| End | Learn face | - | The outcome on the record; the learning in the Brain; assumptions that failed are flagged |
| **Next** | Thread handoff | - | **"What should we build next?"** (J1) - and the Discover face now carries this learning as an input. The loop closes visibly, on the Spine, as the `07→01` return edge lights. |

**J0 - "Take it from signal to shipped"** · `?journey=j0` · Spine `01→07`

Not a separate machine - the chain `j1 → j2 → j3 → j5 → j4 → j6 → j7`, with each DONE flowing
into the next START automatically instead of waiting for a click. Human gates still stop it. The
whole run reads left to right on the Spine as one lit slice. This is the demo.

### 4.3 The no-dead-end law

Three enforcement points, all already have code:

1. **Every journey terminal has a `handoff`** with a `suggestedNextJourneyId`
   (`journeys.ts`, type-enforced, no journey may omit it).
2. **Every empty state is a `WarmSlot`** that names who acts next and carries an action, never a
   shrug (`primitives`, already the convention).
3. **Every error state is a `RoomDeadEnd`-shaped surface that wears the chrome** - doors, switcher
   and sign-out still present (`$workspaceSlug.$productSlug.tsx:104-138` already does this
   correctly and is the model for all of them).

---

## 5. THE INTERLINKS

This is the "what needs to be interlinked" answer.

**The link grammar - three link types, three visual treatments, and a user can tell them apart
before clicking. This is the direct answer to "if I click this, what will happen?"**

| Type | Renders as | What happens | Never |
| --- | --- | --- | --- |
| **Trace link** (backward, "where did this come from") | A mono chip, e.g. `SIG-204`, `SPEC-52`, `trc_9` | Opens that entity in a **pane or peel over the current canvas**. You do not lose your place. | Never navigates away |
| **Move link** (forward, "the next step") | An ember `NextLine` door with a verb, e.g. "Write the spec" | **Moves the room**: sets `?stage=` and `?focus=`, lights the journey slice | Never opens a modal |
| **Deep link** (sideways, "the full workbench") | A quiet "Open" affordance on a row | Navigates to a **workbench child** (spec/mission/trace/prototype) | Never a modal that traps state |

Rule: **backward is always a peel, forward is always a move.** Learn it once and every link in the
product is predictable. That is the whole answer to the founder's question.

### 5.1 The entity graph

Each row: what it links FORWARD to, what it links BACK to, and which links are clickable doors in
the UI. **D** marks a rendered, clickable door. Everything unmarked is a real data relation that
is queryable but deliberately not surfaced as chrome (the restraint budget).

| Entity | Home surface | FORWARD to | BACK to |
| --- | --- | --- | --- |
| **Signal** | Discover face | **D** Bet it clustered into · **D** Spec that cites it · Learning that re-scored it | **D** Source (connector / meeting / recording / support ticket) · **D** Raw item |
| **Bet** (opportunity) | Decide face | **D** Decision (keep/kill) · **D** Teardown verdict · **D** Spec generated from it · Roadmap slot | **D** Signals it clusters (count chip → peels the evidence chain) · **D** Brief alignment score |
| **Decision** | Brain pane → Decisions (record) · rendered at the gate where it is made | **D** Spec it authorized · **D** Outcome that judged it · Precedent it set for future decisions | **D** The bet or spec it ruled on · **D** Evidence chain · **D** Receipt in the ledger · **D** Who decided, when |
| **Spec** | Spec workbench | **D** Prototype · **D** Mission · **D** Task graph · **D** Outcome contract · **D** Stakeholder pack | **D** Bet · **D** Decision that approved it · **D** Citations (each opens its signal or Brain doc) · **D** Assumptions on watch |
| **Prototype** | Prototype workbench | **D** Mission that inherits it · **D** Design-parity check on the changeset · Artifact entry | **D** Spec · **D** Brand kit version used · **D** Design critic notes · **D** Gate verdict |
| **Mission** | Mission workbench | **D** Changeset · **D** Trace of every step · Preview URL | **D** Spec · **D** Prototype · **D** Agent that ran it (→ Crew pane) · **D** Tool approvals granted mid-run |
| **Changeset** | Build face + Mission workbench | **D** PR · **D** Deployment · **D** Design-parity verdict | **D** Mission · **D** Spec's task graph nodes it satisfies · **D** Files touched |
| **Deployment** | Ship face | **D** Changelog entry · **D** Announcement · **D** Outcome check (armed, with its date) | **D** Changeset · **D** PR · **D** Who promoted it, when (receipt) |
| **Outcome** | Learn face | **D** Learning · **D** Assumptions it confirmed or broke · **D** Impact ledger entry | **D** Spec's outcome contract · **D** Deployment · **D** The original decision (the loop's closing link, and the single most important door in the product) |
| **Learning** | Brain pane → Learnings | **D** Memory it promotes to (via the review gate) · **D** Future bets it re-scores · Playbook proposal | **D** Outcome · **D** Spec · **D** Decision it judges in hindsight |
| **Memory** | Brain pane → Memory | **D** Every agent run that read it (→ traces) · **D** Decisions it informed | **D** Learning or human capture it came from · **D** The gate that approved it · **D** Its expiry |

### 5.2 The four cross-cutting spines

Four things thread through every entity above and get one consistent rendering each:

| Spine | Rendering | Reached from |
| --- | --- | --- |
| **Receipt** | A `ReceiptLine` on every artifact card: who, what, when, with a mono id | **D** → Record pane, that receipt, its tamper seal, its trace |
| **Trace** | A `trc_*` chip on anything an agent produced | **D** → `/trace/$id` workbench |
| **Agent** | An `AgentChip` on every machine-authored thing | **D** → Crew pane, that agent, its runs and its scorecard |
| **Gate** | The ember `GateChip` - one object, three renderings (Spine node, tray card, inline Thread card) | **D** → the artifact under judgment, at its stage |

### 5.3 The two closure links that make it a loop and not a pipeline

Both must be built, both are currently missing, and they are the difference between a workflow
tool and a company brain:

1. **Outcome → the original Decision.** Standing on a recorded outcome, one click reaches the
   decision that caused it, with the evidence that was available *at the time*. This is what makes
   the Brain a judgment record rather than a document store.
2. **Bet → the Learnings that re-score it.** Standing on a new bet in Discover, the Brain
   volunteers *"you shipped something like this in March; here is how it landed"* - unprompted, in
   the Thread, before you decide. This is the investor-canon promise ("it warns before you repeat
   what was wrong") and it is the one place the product is allowed to interrupt you.

---

## 6. DEEP LINKS AND SUB-PAGES

### 6.1 The URL scheme, complete

```
/$workspaceSlug/$productSlug
    ?stage=   discover|decide|plan|design|build|ship|learn     which canvas face
    &view=    <stage-specific>                                 sub-view within the face
    &journey= j0..j7                                           the lit Spine slice
    &focus=   <kind>:<id>                                      the entity open on the canvas
    &pane=    brain|record|made|threads|crew|engine            the open depth pane
    &pview=   <pane-specific>                                  sub-tab within the pane
    &item=    <id>                                             the row open inside the pane
    &gate=    open|<gateId>                                    the gates tray
    &config=  you|workspace|agents|connections|plan|admin      the config overlay
    &section= <SectionId>                                      section within the overlay
    &first=   1                                                first-light state
    &q=       <string>                                         palette / in-pane search

/$workspaceSlug/$productSlug/spec/$specId?tab=
/$workspaceSlug/$productSlug/mission/$missionId
/$workspaceSlug/$productSlug/trace/$traceId?step=
/$workspaceSlug/$productSlug/prototype/$prototypeId
```

**Typed focus.** `?focus=spec:SPEC-52`, `bet:op_9f2`, `signal:sig_88`, `decision:dec_12`,
`mission:ms_44`, `outcome:out_3`. The type prefix is load-bearing: it lets the room infer the
stage when `?stage=` is absent, and it makes an unknown id fail with a specific message rather
than a generic one.

### 6.2 Orthogonality - the rule that makes this composable

`stage`, `pane`, `gate` and `config` are **independent**. Any combination is legal and renders
sensibly, because each owns a different region:

- `?stage=plan&pane=brain` - writing a spec with the Brain open beside it. This is the product.
- `?stage=build&gate=open` - approving a mid-run tool call without leaving the mission.
- `?stage=learn&config=workspace&section=brand` - the config overlay scrims the room; Escape and
  you are exactly back on Learn.

No combination is disallowed, no combination requires a special case, and no combination loses
state. That is what "everything is in the same thing" means mechanically.

### 6.3 Modal vs page - the law

| Shape | Use for | Examples |
| --- | --- | --- |
| **Page** (workbench child route) | Anything worked on for more than a minute, or handed to someone outside the loop | Spec editor, mission, trace, prototype |
| **Pane** (`?pane=`, over-panel, 420px) | Anything scanned, referenced, or picked from while working | Brain, Record, Made, Threads, Crew, Engine |
| **Tray** (`?gate=`, over-panel, ember) | Judgment. Distinct chrome because judgment is a distinct act. | Approvals |
| **Overlay** (`?config=`, full-screen scrim) | Configuration that changes how the room behaves | Settings, Admin |
| **Peel** (in-place expand, no URL) | Reading one more level of the row you are already on | A receipt's detail, a citation's source text, an assumption's history |
| **Dialog** (no URL, focus-trapped) | Confirm, name, or destroy. Nothing else. | Rename artifact, confirm delete, paste an API key |

**The prohibition:** no dialog may contain a form longer than three fields, and no dialog may be
the only place a capability lives. Everything else is addressable. `useConfirm` / `usePrompt`
already enforce the shape.

### 6.4 What happens on a deep link whose parent state is missing

Ranked, and every branch ends somewhere real:

| Missing | Behaviour |
| --- | --- |
| No workspace/product in the URL (`/settings?section=x`, `/brain`, any legacy path) | The legacy resolver mounts, calls the same last-active-product resolution `/m` uses, and **replaces** the URL with the new room URL carrying the translated params. One frame, no flash of a wrong shell. |
| Product slug unknown, or a workspace you cannot see | The `RoomDeadEnd` pattern already in `$workspaceSlug.$productSlug.tsx:104-138`: honest line, honest hint, a door back - **wearing the room chrome**, so the switcher and sign-out are present. RLS makes "does not exist" and "not yours" indistinguishable on purpose; the copy does not leak which. |
| `?focus=spec:SPEC-52` and the spec is gone | The Plan face renders its list normally, with an inline honest note at the top: "That spec is gone or you cannot see it." The list beneath it is the recovery. Never a blank, never a bounce. |
| `?focus=` with no `?stage=` | Stage is inferred from the type prefix and written into the URL. |
| `?stage=design` but design is off for the workspace | The Spine renders `04` as skipped-by-policy (not missing), the Canvas explains it in one line and offers the door that turns it on: Settings → Workspace. |
| `?pane=record&item=trc_9`, trace deleted or from another workspace | Pane opens on its list; a dismissible line names what was not found. |
| `?view=` or `?pview=` unknown | Falls back to the surface's first tab, silently. This is already `ROOM_TABS[room][0].id` behaviour and it is correct. |
| `?config=admin` and you are not an admin | The overlay opens on the group index with Admin absent. No error, no 403 page - you simply do not have that group. |
| Any param the schema does not know | Dropped by `validateSearch`. Already the room's behaviour and it is the right one. |
| `/trace/$id` under the *wrong* product | Resolve the trace's real product, switch the room to it, and rewrite the URL. Say so in one line in the Thread: "Switched to Relay - that run belongs there." |

### 6.5 Legacy - one resolver, not 41 stubs

All 39 verified pure-redirect stubs plus `/prds` and `/trust-ledger` collapse into a single
`src/lib/legacy-resolver.ts` and one catch-all route. It holds one table: old path (+ old search)
→ new room search. It replaces `legacy-redirects.ts`'s static map, the 14-way `?tab=` branch in
`/govern`, the 6-way branch in `/product`, and the param-forwarding stubs. Every old URL still
resolves in one hop, forever, and there is exactly one file that answers "where did X go".

### 6.6 The palette - mounting what already exists

`CommandPalette.tsx` is 454 lines of a complete JUMP / SETTINGS / ACT / RECENT / ASK / CATALOG
palette with zero importers, and search is currently unreachable because Cmd+K opens the composer.
Fixed by splitting the two keys, which are two different questions:

| Key | Opens | Question |
| --- | --- | --- |
| `⌘K` | The palette | "Take me to a thing I can name" - any entity, stage, pane, setting, journey, agent |
| `⌘J` | The composer | "Do something for me" - the existing `supaprod:open-ask` path, unchanged |

Every palette result navigates by writing room params. Nothing in the palette can reach a place
the rail and the Spine cannot; it is an accelerator, never a second IA.

---

## 7. WHAT DIES

### 7.1 Routes deleted outright (component gone; path becomes a resolver entry)

| Route | Lines | Absorbed by |
| --- | --- | --- |
| `_authenticated.today.tsx` | 1543 | Thread briefing + Gates tray + Discover face + Record pane + first light |
| `_authenticated.decide.tsx` | 70 | `?stage=decide` (it already only wrapped `OpportunityQueue`) |
| `_authenticated.ship.tsx` | - | `?stage=ship` |
| `_authenticated.learn.tsx` | - | `?stage=learn` |
| `_authenticated.discover.tsx` | - | `?stage=discover` |
| `_authenticated.plan.index.tsx` | - | `?stage=plan&view=` |
| `_authenticated.design.tsx` | 322 | Prototypes → `?stage=design`; Brand Kit → `?config=workspace&section=brand` |
| `_authenticated.build.index.tsx` | 989 | `?stage=build&view=` |
| `_authenticated.brain.tsx` | 698 | `?pane=brain` |
| `_authenticated.engine-room.tsx` | - | Record room → `?pane=record`; the other three → `?pane=engine` |
| `_authenticated.approvals.tsx` | 270 | `?gate=open` |
| `_authenticated.threads.tsx` / `.artifacts.tsx` | - | `?pane=threads` / `?pane=made` |
| `_authenticated.traces.tsx` | - | `?pane=record&pview=traces` |
| `_authenticated.sync.tsx` | 842 | `?config=connections&section=sync` |
| `_authenticated.settings.tsx` | 3433 | `?config=` (the renderers move intact; only the frame changes) |
| `_authenticated.admin.tsx` + 9 admin routes | ~4000 | `?config=admin&section=` |
| `_authenticated.onboarding.tsx`, `_authenticated.start.tsx` | - | First light, in the room |
| The 39 verified pure-redirect stubs + `/prds` + `/trust-ledger` | ~41 files | One `legacy-resolver.ts` + one catch-all |

### 7.2 Routes that move (not deleted - re-homed under the room)

| From | To |
| --- | --- |
| `/plan/spec/$id` (1084) | `/$ws/$product/spec/$specId` |
| `/build/$missionId` (870) | `/$ws/$product/mission/$missionId` |
| `/traces/$traceId` (861) | `/$ws/$product/trace/$traceId` |
| *(new, from `/design`)* | `/$ws/$product/prototype/$prototypeId` |

### 7.3 Components deleted

| Component | Lines | Absorbed by |
| --- | --- | --- |
| `supaprod/AppShell.tsx` | 1033 | `RoomChromeShell` + the depth rail |
| `supaprod/TopBar.tsx`, `supaprod/PageHeader.tsx` | - | `RoomTopBar` + `CanvasFace`'s `SurfaceHeader` |
| `supaprod/FocusDock.tsx` | - | `WorkingStrip`. It already fights the composer for the bottom-center of the screen (`_authenticated.tsx:210-216` documents the collision). |
| `supaprod/CookingBanner.tsx`, `supaprod/AmbientChip.tsx`, `obsidian/today/MachineNow.tsx` | - | `WorkingStrip` |
| `today/PendingApprovalsBar.tsx` | - | The ember tile + Gates tray |
| `today/*` lanes, hero, desk rail | - | Redistributed per §2.6 |
| `mission/RoomChrome.tsx`'s duplicate `ProductSwitcher` | - | One `ProductSwitcher`, one file. It is currently written twice - `RoomChrome.tsx:57-131` and `MissionShellView.tsx:122-201` - near-identically. Two copies of the workspace switcher is the shell split in miniature. |

### 7.4 Modules deleted or rewritten

| Module | Fate |
| --- | --- |
| `src/lib/nav-model.ts` | **Deleted.** Ten destinations in three zones is the thing being removed. |
| `src/lib/legacy-redirects.ts` | **Deleted**, replaced by `legacy-resolver.ts` (§6.5) |
| `src/lib/delegate-poll.functions.ts` | **Deleted.** No caller, no future caller. |
| `src/lib/surface-registry.ts` | **Rewritten, kept.** It is the no-orphan enforcement - precisely the "nothing homeless" test the founder is demanding. Its `home` vocabulary retargets to the new IA (`stage/*`, `pane/*`, `child/*`, `config/*`, `tray`, `composer`) and its test gains one assertion: **every `home` must be constructible into a real URL by `room-url.ts`.** That turns it from documentation into a compiler for the IA. |
| `src/lib/room-url.ts` | **Extended**, keeping every existing guarantee, and becomes the single URL builder for all params in §6.1. Nothing constructs a room URL by string concatenation. |
| `src/components/supaprod/CommandPalette.tsx` | **Kept and finally mounted** (§6.6) |

### 7.5 Concepts killed

| Concept | Why |
| --- | --- |
| **Two shells** | The `_authenticated.tsx:157-180` allowlist is deleted. One shell, no branch. |
| **"Today"** | A dashboard next to the loop guarantees duplication. |
| **"Pulse"** as a nav label | A label that hid `/engine-room`, appearing in no URL and in no user's vocabulary. |
| **Stage-shaped wrappers with no data** | The `/decide`, `/ship`, `/learn` pattern. Enforced going forward: a canvas face must own at least one query the room does not already make. |
| **The recessed door** (`hidden sm:flex`, `--ink-subtle`, no count, no key, no URL) | The specific mechanism that lost depth on 2026-07-18. Replaced by the rail. Banned by name. |
| **Memory's three homes** | One home: `?pane=brain&view=memory`. Policy only in Settings. |
| **`⌘K` opening the composer** | Two questions, two keys. |
| **Full-viewport chromeless onboarding** | The reason a brand-new user's first authenticated screen is a retired shell. |

---

## 8. THE MIGRATION

Nine phases. Every phase ships. **The invariant: at the end of every phase, every URL that worked
at the start of that phase still works.** The order is chosen so the irreversible step (P3, deleting
the old shell) happens only after depth is already visible (P2) - reverse those two and you rebuild
the 2026-07-18 failure exactly.

| P | Ships | Work | Risk gate |
| --- | --- | --- | --- |
| **P0** | Nothing visible | Extend `room-url.ts` to build every param in §6.1. Add `pane`, `pview`, `item`, `gate`, `config`, `section`, `focus`, `first` to the room's `validateSearch` as accepted no-ops. Write `legacy-resolver.ts` with today's mapping and point the existing 41 stubs at it (behaviour identical). | Route tests green; `legacy-redirects.test.ts` ported and passing against the new resolver |
| **P1** | **One shell** | Delete the pathname allowlist in `_authenticated.tsx`. Every authenticated route renders inside `RoomChromeShell`. Legacy page bodies render full-width where the Canvas will go. Delete the duplicate `ProductSwitcher`. Nothing has moved yet - but the shell disagreement, the bounce to the retired rail, and the stranded account menu are all gone in one release. | Every one of the ~68 routes renders with a TopBar, a switcher and a sign-out |
| **P2** | **Depth becomes visible** | Build the 48px rail with all seven tiles and their live counts. Each tile opens the **existing** surface inside the over-panel - `/brain`'s body, the Engine Room's rooms, `ApprovalsTray`, `ThreadsSurface`, `ArtifactsSurface`, `CrewDrawer`. Routes still exist and still work. Bind `g k r m t c e`. | A user can reach Crew, Record, Engine and Threads without knowing a URL - the thing that has never been true |
| **P3** | **One landing** | Login → `/m` (drop the public-page bounce). `needsOnboarding` sets `?first=1` instead of redirecting. Mount `MissionOnboarding` as the first-light Thread card. `/today` becomes a resolver entry. **Delete `AppShell.tsx` and `nav-model.ts`.** | The three-way landing disagreement is closed; there is one first frame |
| **P4** | **The seven faces**, one stage per ship | Move each stage's body into its `faces.tsx` face, in this order: **Plan → Build → Discover → Decide → Learn → Ship → Design**. (Plan and Build first: they are the largest, most-used, and highest-risk, and they prove the pattern while there is still a fallback. Decide/Ship/Learn are nearly free - they own no data.) An unmigrated stage's face renders a door to its old route, so a half-migrated Spine is honest, not broken. | Each stage: the face makes the same queries as the route it replaced, verified against the route file |
| **P5** | **The workbench children** | `spec`, `mission`, `trace`, `prototype` move under the room with the shared chrome. Old paths become resolver entries carrying every param (`?tab=`, `?step=`, ids). | A pasted `/plan/spec/$id?tab=contract` link lands on the same tab, in the room |
| **P6** | **The config overlay** | Settings becomes `?config=`; the 16 section renderers move unchanged. Admin becomes the gated sixth group. `/settings` and `/admin/*` become resolvers. Move `memory` out of Settings into the Brain pane, leaving `memory-policy` behind. | Every `?section=` id, including all legacy aliases in `LEGACY_SECTION_MAP`, still lands |
| **P7** | **The graph and the journeys** | Wire every **D** door in §5.1, including the two closure links in §5.3. Promote journey cards to the first-light canvas and the journey cap to the Thread. Mount `CommandPalette` on `⌘K`. Mount the 13 orphan components and the 3 orphan server-fn domains at their assigned homes. | A click-path audit walks every **D** door; `journeys.test.ts` still verifies every `wiredVia` export exists |
| **P8** | **The delete** | Remove every route, component and module in §7. Collapse the 41 stubs into the one catch-all. Rewrite `surface-registry.ts` and its test to the new home vocabulary with the URL-constructibility assertion. Delete `delegate-poll.functions.ts`. | `surface-registry.test.ts` green: every domain has exactly one home, every home is a real URL |
| **P9** | **The proof** | An automated click-path test that, from a fresh login, reaches every entry in the §2 home table within its stated click budget, and asserts no surface is reachable by two distinct paths. | The home table becomes an executable contract instead of a document that rots |

---

## 9. The burden of proof, answered directly

The stance's assigned burden was: show that admin, engine room, settings and the ledger are
genuinely reachable and do not feel hidden.

| Depth | Reachable in | Advertises itself by | Addressable as |
| --- | --- | --- | --- |
| **The ledger** (tamper-evident receipts, traces, approvals log) | 1 click (`r`), or 0 from any receipt chip on any artifact | A permanent rail tile with a count of receipts since your last look | `?pane=record&pview=receipts&item=<id>` |
| **The engine room** (spend, quality, safety, routines, incidents) | 1 click (`e`) | A permanent rail tile that turns amber when any of the four rooms is on watch, carrying that room's one-line action | `?pane=engine&pview=drift` |
| **The crew** (13 agents, trust, runs, scorecards) | 1 click (`c`), or 0 from any `AgentChip` anywhere | A permanent rail tile with a count of agents working right now | `?pane=crew&item=critic` |
| **Settings** (5 groups, 16 sections) | 1 click to the overlay, 2 to any section | A gear in the fixed TopBar position every product on earth puts it | `?config=agents&section=autonomy` |
| **Admin** (9 surfaces) | 3 clicks, deliberately | A gated group in the config overlay; absent entirely for non-admins | `?config=admin&section=pricing` |

The distinction that matters, and the one the last rebuild missed: **hidden is not a function of
depth. It is a function of silence.** A left-rail item that never changes is silent. A right-edge
tile that says "3 waiting, 2 working, 1 room on watch" is louder than a rail row could ever be,
and it costs one region of the shell instead of a whole navigation model.

One room. Seven faces. Seven tiles. One overlay. Four workbenches. Everything else is a link with
a grammar you learn once.
