# FINAL IA - The Room

> The deciding architect's ruling, 2026-07-28. Winner: **A (ONE ROOM)**, with named grafts from
> B (Work and Mind) and C (Verbs, Not Nouns) folded in.
> Every file, line number, enum and line count below was read or run against live code this
> session. Where a proposal's claim was wrong, this document says so and carries the corrected
> fact, not the claim.
>
> This supersedes `ia-a-one-room.md`, `ia-b-work-and-mind.md`, `ia-c-verbs-not-nouns.md`.
> Those three stay as the reasoning record. This one is the build contract.

---

## 0. THE RULING

### 0.1 Winner: A, ONE ROOM

One destination: `/$workspaceSlug/$productSlug`. Everything else is a region of that room, a
param on it, a child route wearing its chrome, or an overlay over it. Signed in, you are in the
room. You leave it by signing out.

### 0.2 Why A wins, against the five tests

| Test | A | B | C |
| --- | --- | --- | --- |
| **1. Ten-second** | **Wins.** First frame draws the whole machine: seven numbered stages on the Spine, a Thread that says what is happening, an ember that says what is yours, seven journey cards that say what you can ask for. The anatomy teaches; copy confirms. | Same Work body, so nearly as strong, minus a ten-second tax on the word "Mind" (a second top-level whose meaning is not self-evident on frame one). | **Loses.** Landing is `/working`, a reverse-chron list of runs, and the seven-stage loop is invisible until a run is open (the Trace is per-run). A brand-new user with zero runs sees an empty list plus a Deck of commands. A command catalogue teaches what you can type, not what the machine is. This is an activity feed with a better input, and an activity feed is the dashboard failure in different clothes. |
| **2. Partial-journey** | Strong. `?journey=j3` lights the slice, dims the rest, caps the Thread, hands off at the end. Three doors in. A journey is a filter on the room, so it costs nothing. | Identical mechanism (same Work body). Tie. | Strong, and holds the single best idea in the three docs: a journey is a property of **one run**, so a partial journey visibly *is* a partial run. But entry is Ask-only, so you must already know the verb. |
| **3. No-orphan, ≤2 clicks** | **Wins.** One deliberate failure class: Admin's 9 surfaces at 3 clicks, argued and correct. Everything else at 1 or 2. | Worse: 16 Settings sections at 3 clicks (defended), researcher targets at 4, and `/artifacts` dissolved into `Cmd+K` with no browsable home - a real orphan by its own law. | **Worst.** All of Tune (16 settings sections plus the engine room's ~22 views) at 3 clicks by browsing, "1 click by Ask". That is depth behind a palette, by the author's own admission. |
| **4. Coherence, ONE shell** | **Wins, cleanly.** One frame, one interior. Settings is an overlay over the still-mounted room; Admin is a gated group inside that overlay; the four workbench children wear the same TopBar, Spine and rail. There is no second frame anywhere. | One `AppFrame` but **four interiors**: Work body, Mind's 5-tab row, Settings' 200px group rail, Admin's 200px rail. Three smuggled sub-navigations. Worse: Mind is workspace-scoped while Work is product-scoped, so the product switcher changes meaning when you cross the top-level toggle. | One AppFrame, but `/tune/<group>?view=` is a second nav model, `/open/$kind/$id` a third interior, and the product-scoped room survives only as a legacy redirect to `/working?w=&p=`. That flattens a tenancy model the DB and `room-url.ts` already enforce. |
| **5. Depth without domination or palettes** | **Wins, and this is the decisive margin.** The depth rail: 48px, permanent, counted, keyed, addressable, non-destructive. It is the only mechanism in the three documents that answers the actual failure mode. A's framing is correct and is the thesis of this whole rebuild: **hidden is not a function of depth, it is a function of silence.** The 2026-07-18 rebuild lost depth to recessed `hidden sm:flex` buttons with no count, no key, no URL. The original 10-rail lost depth to rows that never changed. A tile carrying "3 waiting · 2 working · 1 room on watch" is louder than a rail row can be, at one region of shell instead of a whole nav model. | Mixed. Depth gets a whole top-level half (over-prominent for receipts and spend) while Settings depth sits at 3 clicks (under-prominent). The prominence is allocated backwards. | **Fails the named test.** Depth is at 3 clicks in `/tune`, rescued by search. This is precisely how 2026-07-18 died. |

A wins 4 of 5 outright and ties the fifth. That is not a close call, and I am not softening it.

### 0.3 What A got wrong, and what the losers fix

A is the right skeleton with three real defects, all repaired below by graft:

1. **A missed the actual root cause of "everything is broken and not connecting."** B found it in
   code and I verified it: `ARTIFACT_KINDS` in `src/lib/lineage.functions.ts:7-21` ends at
   `capability_change` and does **not** contain `changeset`, `deployment`, `outcome`, `learning`,
   or `belief`. `GRAPH_NODE_KINDS` in `src/lib/knowledge-graph-view.ts:18-29` is shorter still: 10
   kinds, dropping `house_rule`, `prototype` and `capability_change`. **The back half of the loop
   writes no lineage at all.** The chain physically stops at the spec. A describes a beautiful
   entity graph in its §5 and never notices that half of it cannot be persisted. This is the single
   most valuable finding across the three documents and it is now Phase 3, a hard gate.
2. **A treats the Brain as content behind a 420px pane, and its landing is four storage tabs.**
   The investor canon bans "where the record lives" framing. B's Beliefs surface - rows that are
   claims about the future, carrying confidence, a streak, what they changed, and when they
   stopped you - is the correct front for that pane, and `gate-signals.functions.ts` is the
   orphaned code that makes it true. Grafted.
3. **A conflates two different things on one Spine.** A's Spine is product loop state
   (`getLoopState`); a journey is a highlight over it. But "where the product is" and "where this
   piece of work is" are different questions and they collide the moment two runs are in flight.
   C's per-run Trace is the correct rendering. Grafted as Spine mode 2.

---

## 1. THE DESTINATIONS

### 1.1 The count: one

```
/$workspaceSlug/$productSlug          The Room
```

The room is named after the product you are in. The TopBar reads `Helio Labs / Relay`, and that
is the destination's name. Not "Mission Control" (our word, a NASA metaphor nobody asked for).
Not "Today" (a calendar word for a thing that is not a calendar). Not "Dashboard".

### 1.2 The test for "destination"

Does going there replace the screen and change the chrome? If yes it is a destination. If the
Spine, the Thread, the Composer and the depth rail stay live and only a region changes, it is a
layer.

| Kind | Count | What | Destination? |
| --- | --- | --- | --- |
| **Destination** | 1 | `/$ws/$product` | - |
| **Workbench children** | 5 | `spec/$id`, `mission/$id`, `trace/$id`, `prototype/$id`, `map` | No. Same TopBar, same Spine, same rail. Thread and Canvas swap. |
| **Depth panes** | 7 | `?pane=` (6) + `?gate=` (1) | No. Over-panels; everything behind stays live. |
| **Config overlay** | 1 | `?config=<group>&section=<id>` | No. Full-screen scrim over a still-mounted room; Escape returns exactly. |
| **Resolvers** | n | `/m`, `/m/$productId`, one legacy catch-all | No. Plumbing, alive for one frame. |
| **Unauthenticated** | n | `/login`, `/signup`, `/start` first-run, `/join/$token`, `/p/$slug`, `/d/$slug`, `/t/$slug`, `/proof`, public pages | Out of scope. |

### 1.3 The chrome, drawn

```
┌────────────────────────────────────────────────────────────────────────────────┬────┐
│ ◈  helio-labs / relay ▾                              ⌘K   Ask ⌘J   ⚙   ◉      │ ◆3 │
├────────────────────────────────────────────────────────────────────────────────┤ 12 │
│ 01 Discover ─ 02 Decide ─ 03 Plan ─ 04 Design ─[05 Build]─ 06 Ship ─ 07 Learn  │  7 │
│    done         done        done      done      working      ·        ·        │  4 │
├───────────────────────────┬────────────────────────────────────────────────────┤  · │
│ THREAD              380px │ CANVAS                                             │  2 │
│                           │                                                    │  · │
│ ▸ Briefing                │  the stage face, or a workbench child              │  ! │
│ ▸ Challenge, 09:14        │                                                    │    │
│ ▸ NEEDS YOU               │                                                    │    │
│   [Approve] [Send back]   │                                                    │    │
├───────────────────────────┴────────────────────────────────────────────────────┤    │
│ ● Engineer is writing tests · 2 agents working · Stop everything               │    │
├────────────────────────────────────────────────────────────────────────────────┤    │
│ [ Ask or tell Supaprod to do something ]   next?  tear down  PRD  build  land   │    │
└────────────────────────────────────────────────────────────────────────────────┴────┘
                                                                          the depth rail, 48px
```

Six regions, fixed, never conditionally rendered: **TopBar · Spine · Thread · Canvas ·
WorkingStrip · Composer**, plus the **depth rail** on the right edge.

### 1.4 The Spine has two modes (graft from C)

The Spine is state, never navigation. It renders in one of two modes and always says which:

| Mode | When | Source | What it shows |
| --- | --- | --- | --- |
| **Product** (default) | no run focused | `getLoopState` | where this *product* is in its loop; per-stage state, receipts, gate counts |
| **Run** | `?focus=mission:*` or any workbench child, or `?journey=` active | that run's slice | where this *piece of work* is; the slice lit, everything else present and dim |

The mode label sits at the Spine's left edge in mono: `PRODUCT` or `RUN · mission #182`. Clicking
the label returns to product mode. This is the fix for the conflation A never noticed: two
questions, two modes, one drawing, always labelled.

### 1.5 What was rejected, and why

| Rejected | Why |
| --- | --- |
| **Today** | The disease, not the cure. `_authenticated.today.tsx` is 1543 lines pulling `getGreeting`, `getTodayLanes`, `getApprovalsQueue`, `listFanoutBatches`, `listLearnings`, `getProductContext`, `getAgentFleet` - a dashboard *about* the loop sitting next to the loop, guaranteeing everything appears twice and nothing connects. A dashboard is what you build when you do not trust your product to be legible. |
| **Seven stages as seven pages** | Seven contexts, seven headers, seven scroll positions, seven chances to lose the artifact you were carrying. The Spine already renders all seven with per-stage state. Pages duplicate the Spine and then contradict it. They become canvas faces, which `faces.tsx` already built (102KB of it). |
| **Decide, Ship, Learn specifically** | They own nothing. `/decide` is a header around `OpportunityQueue`, the exact component `/discover?tab=queue` renders, with zero queries of its own. `/ship` and `/learn` mount lazy panels that also render inside `/brain`; their only own query is a presence chip. A destination that exists to make a story true is a defect. |
| **Approvals as a destination** | One count, one source. Already `["approvals","queue",workspaceId]` shared by `RoomChrome.tsx:238`, `MissionShellView`'s NeedsYouPill, the Spine's ember nodes, and `/approvals`. A destination makes a fourth copy. B is also right that its good state is empty, and a destination that is empty most days trains you to stop looking. It is the ember tray. |
| **Brain as a destination** | A destination is where you go to work; the Brain is what you consult while working. Sending someone out of the loop to read what the loop knows is exactly the "not connecting" being complained about. It is the largest depth pane, opened over the canvas, so a decision's precedent sits beside the decision. Layer 03 does not need a URL of its own to be a pillar; it needs to be present at the moment of judgment, which a destination cannot do and a pane can. |
| **B's "Mind" as a second half** | Correct diagnosis, wrong prescription. Its content wins (see the Beliefs graft); its placement loses. A workspace-scoped half beside a product-scoped half breaks the switcher's meaning, and three sub-navigations inside one frame is the two-shell disease at smaller scale. |
| **C's five verbs** | The labels are genuinely better English than ours ("Waiting" beats "Approvals"). But `/working` as a landing hides the loop, and `/tune` at 3 clicks hides the depth. Verbs win as *composer intents and journey names*, which is where they are grafted. |
| **Engine Room / "Pulse"** | 4 rooms × 5-7 views = 22 sub-views behind a rail behind a nav label ("Pulse") that appears in no URL and no user's vocabulary. Splits on a distinction users already feel: **what happened** (Record) vs **how it is running** (Spend, Quality, Safety). |
| **Settings as a destination** | 3433 lines, 5 groups, 16 sections, every one a thing you configure *so the room behaves differently*. Linear, Vercel and Notion all overlay settings for that reason: you want to see what you changed. It becomes the config overlay. |
| **A palette as the IA** | Search answers "take me to a thing I can name". It cannot answer "what should I do". It ships (§6.6) and it is never load-bearing. |

> **SUPERSEDED 2026-08-21 — the palette is retired, not mounted.** The clause is left standing so the reversal can be checked. Every job it reserved the palette for is now done by something mounted (`GotoShortcuts`, `RailFind`, `ShortcutSheet`), and ⌘K is Ask's by the founder's 2026-07-30 call, so it had no key left. Record and the case for keeping it: `docs/decisions/palette-retired-2026-08.md`.


---

## 2. THE HOME TABLE

**Two laws, enforced by test:**

- **No orphans.** Every server-function domain and every mounted component names exactly one home,
  and that home must be constructible as a real URL string by `room-url.ts`.
- **No second homes.** A capability is *rendered* in one place. It may be *linked* from many
  (that is §5).

**Click convention.** Login lands you in the room with zero clicks. "1 click" means one click from
the room as it opens. Keyboard equivalents are the real answer for a daily user.

### 2.1 The Spine and the seven canvas faces - 1 click each

`?stage=` selects the face; the Spine and keys `1`-`7` set it.

| Stage | URL | Absorbs | Keys |
| --- | --- | --- | --- |
| 01 Discover | `?stage=discover` | `/discover` + `DiscoverSurface` signals, `/discovery`, `/opportunities`, researcher targets ("What the crew is watching"), the Recordings lane (`AudioTranscriptPanel`), meetings-as-signal, `/today`'s `WatchLane` | `1` |
| 02 Decide | `?stage=decide` | `OpportunityQueue` (from `/decide` and `/discover?tab=queue`), teardown verdicts, `gauntlet`, `contradiction-auditor`, `shared-premise`, `decision-currency`, `fanout` parallel exploration, `FirstTeardownCard` | `2` |
| 03 Plan | `?stage=plan&view=` | `/plan` + `PlanSurface` five views (`goals`, `loops`, `roadmap`, `specs`, `stakeholders`), `/prds`, `/roadmap`, `/stakeholder`, `task-graph` | `3` |
| 04 Design | `?stage=design` | `/design` Prototypes half, `design-scaffold`, `flows`, `design-interchange`, the design gate, `design-parity` result | `4` |
| 05 Build | `?stage=build&view=` | `/build` three lenses (`missions`, `agent`, `lane`), `/cockpit`, `/missions`, `/studio`, `/fleet`, `/delegate`, `new-build` repo provisioning, `CompositeReviewCard` | `5` |
| 06 Ship | `?stage=ship` | `ShipHistoryPanel`, `ChangelogPanel`, `AnnouncementsPanel`, `deployments`, `launch-plan`, `changelog-heartbeat` | `6` |
| 07 Learn | `?stage=learn` | `OutcomesPanel`, `LearningsPanel`, `SupportPanel`, `ImpactLedgerPanel`, `/outcome`, `funnel`, `goals`, `pm-impact`, `product-analytics` | `7` |

> `/design`'s **Brand Kit** half does not come here. Brand is configuration (`DesignMemoryPanel`),
> and `settings-sections.ts` already has a `brand` section under Workspace. Brand Kit goes there;
> Prototypes come to face 04. The route dies.

**The face law, enforced:** a canvas face must own at least one query the room does not already
make. This is the rule that makes `/decide`, `/ship` and `/learn` impossible to recreate. Faces
02, 06 and 07 satisfy it because they now own the queries their old routes never made (the queue's
own filters, deployments, outcome data) rather than mounting panels that render elsewhere.

### 2.2 The depth rail - the answer to the failure that killed the last rebuild

A **48px strip on the right edge, present on every room surface and every workbench child, at
every breakpoint, never `hidden`.** Seven tiles, each an icon plus a live mono count. Hover or
focus expands the strip to 240px and reveals the question label; the label is always in
`aria-label` and the tooltip. Clicking opens a **420px over-panel** across the Canvas. The Spine,
Thread, Composer and WorkingStrip all stay live. The URL gains `?pane=`.

| Tile | Label (the user's words) | Key | URL | Owns |
| --- | --- | --- | --- | --- |
| ◆ ember | **Your call** | `g` | `?gate=open` | The approvals queue (`getApprovalsQueue`, `decideApprovalItem`, `sendBackApprovalItem`), all 10 gate kinds, plus **Heads up** (`notifications` + `announcements`, where `AttentionBell.tsx` finally mounts), **Done without you** (`ExecutedCard.tsx`, `getRecentExecutedUnattended`), and **What your calls taught us** (`gate-signals.functions.getGateSignals`) |
| 1 | **What we know** | `k` | `?pane=brain` | Beliefs (landing, §2.3), Calls, Learnings, Docs, Memory, and a door to the Map child. Absorbs `/brain`'s four tabs + `memory`, `memory-candidates`, `MemoryList`, `MemoryReviewQueue`, `MemoryView`, `MemoryExpiryBanner`, `decision-precedent`, `brain-insights`, `knowledge-graph-*`, `strategy-registry`, `playbooks`, `moat`, `value-receipts` |
| 2 | **What happened** | `r` | `?pane=record` | Engine Room's Record room whole: `verify`, `receipts` (the SHA-256 tamper-evident ledger + share controls), `traces` (`TracesPanel`), the approvals log, `support`. Plus `lineage`, `audit-lineage`, `trust-chain`, `artifact-rewind`, `incidents` |
| 3 | **What we made** | `m` | `?pane=made` | `ArtifactsSurface` - prototypes, specs, docs, mockups, releases, transcripts, with versions and rename/delete |
| 4 | **What we said** | `t` | `?pane=threads` | `ThreadsSurface` - every conversation, `conversations`, `?item=<threadId>` |
| 5 | **Who is working** | `c` | `?pane=crew` | `CrewDrawer` (the 13: Chief of Staff + 12 cast), `AgentActivityTimeline`, `agent-fleet`, `agent-runs`, `agent-scorecard`, `capabilities`, `swarm`, `fanout`, `orchestrator`, `ambient` runtime state, `product-context` |
| 6 | **How it is running** | `e` | `?pane=engine` | Engine Room's other three rooms: Spend (trend, by-agent, caps, usage, `CostPerOutcomeChip`), Quality (score, calibration, suites, drift, self-improvement, prompts, proof), Safety (rules, controls, team-trust, house-rules, routines) |

**The five properties the recessed doors lacked, and why this is not hiding:**

1. **Permanent.** A region of the shell with a fixed pixel budget, never conditionally rendered.
2. **Counted.** Every tile carries live state: gates waiting, unreviewed memory candidates, new
   receipts since your last look, agents working right now, rooms on watch. `nav-model.ts`'s ten
   rows carried nothing, which is why they were silent.
3. **Keyed.** `g k r m t c e`. Digits belong to the Spine (`1`-`7`), letters to the rail. Two axes,
   two keyboards, no collision. This corrects the shortcut law in `nav-model.ts`: today `8` = Brain
   and `9` = Pulse sit in the same numeric space as the stages, which is the axis confusion itself.
4. **Addressable.** `?pane=brain&pview=beliefs&item=bel_88` is a link you can paste to a colleague.
   The recessed doors produced no URL at all for Crew.
5. **Non-destructive.** Opening one never discards where you were, so one click for everything is
   safe.

**The zero-count law (the risk this mechanism carries).** A tile whose count is genuinely zero must
not render a silent grey glyph - that is the 10-rail failure at 48px. Zero renders as a hairline
dot plus the tile's *last event age* in the expanded state ("nothing since Tuesday"). A tile that
has never had content in this workspace renders its one-line invitation on expand ("no receipts
yet; they appear the first time an agent does something"). Silence is the enemy, not emptiness.

**Sub-tabs inside a pane are `?pview=`; a row opened inside a pane is `?item=`.** The deepest depth
in the app - a single trace step inside Record - is 3 clicks and one URL:
`?pane=record&pview=traces&item=trc_9`. Or 1 click arriving from the receipt that names it.

### 2.3 The Brain pane's landing is Beliefs, not tabs (graft from B)

The Brain pane opens on **Beliefs**: not a list of things we stored, a list of **things it now
believes**, every row a claim with a stake in the future.

```
What we know · Beliefs                                    3 expire in 6 days →
──────────────────────────────────────────────────────────────────────────────
This loop has closed 14 times. It stopped you 6 times, and it was right 5.

Enterprise buyers do not care about speed claims.                    strong ↑
  Held across 4 calls · last challenged 11 days ago and held
  Changed: killed "2x faster" from the Q3 positioning spec   [see the chain]

Shipping without a rollout gate costs about 2 days of firefighting.  strong ↑
  Learned from 2 outcomes · now proposed automatically at Ship
  It stopped you once: 2026-07-09, "skip the canary" was sent back

You approve Critic teardowns 9 times out of 10.                     forming ~
  It has started running them without asking on bets over $50k impact
  [Turn that off]   [Keep it]
──────────────────────────────────────────────────────────────────────────────
```

Three mechanics carry the claim, all backed by code that exists today:

1. **Beliefs have confidence and a streak.** `decision-precedent.functions.ts`,
   `memory-compounding.ts`, `brain-insights.functions.ts`.
2. **Beliefs name what they changed**, pointing at a real artifact they moved. `artifact_lineage`
   edges (`validates`, `supersedes`, `contradicts` are already in `GRAPH_RELATIONS`).
3. **Beliefs are learned from your judgment and say so.** `gate-signals.functions.ts`
   (`recordGateSignal` / `getGateSignals`) is fully written and called from nowhere. Wire it:
   every approve, send-back and decline writes a gate signal, and Beliefs renders the aggregate,
   including the moment a pattern graduates to acting alone. This is the strongest available
   exhibit for compounding and it is currently dead code.

Storage-shaped views survive as the **evidence drawer beneath a belief** (`?item=bel_x` peels raw
memory rows, docs, meeting notes, changelog). Never the front. This satisfies the investor canon's
hard rule: the brain is never storage, and "where the record lives" is banned framing.

`Calls`, `Learnings`, `Docs` and `Memory` remain as `?pview=` tabs behind Beliefs. **Memory has
exactly one home: `?pane=brain&pview=memory`.** The `memory` section id is removed from
`SETTINGS_GROUPS` and only the *policy* (retention window, auto-promote) stays in Settings as
`memory-policy`. That closes the three-homes bug (`/memory` stub, `/brain?tab=memory`,
`/settings?section=memory`, plus the unmounted `MemoryView.tsx` which now mounts here).

### 2.4 The config overlay - Settings

A **gear** sits immediately left of the account chip. One click opens a full-screen overlay over
the room (the room stays mounted; Escape returns you to the exact canvas state).
`settings-sections.ts` already models this correctly and does not change shape: 5 groups, 16
sections, every legacy `?section=` id preserved by `normalizeSection`.

| Group | Sections | URL | Clicks |
| --- | --- | --- | --- |
| You | profile, notifications | `?config=you&section=profile` | 2 |
| Workspace | workspace (Brief & voice), brand, products, memory-policy | `?config=workspace&section=brand` | 2 |
| Agents | staff (Roster, incl. researcher watch targets), autonomy (Autonomy & approvals), ai (Models & keys) | `?config=agents&section=autonomy` | 2 |
| Connections & Data | connections (Sources: `ProviderCard`, `ApiKeyConnectDialog`), sync (Sync & bindings: all of `/sync` + `ProductBindingPicker`), interop (Agent access / MCP), data (Your data) | `?config=connections&section=sync` | 2 |
| Plan & Usage | billing, credits, health (Diagnostics) | `?config=plan&section=credits` | 2 |

**Correction to B and C on prompts, guardrails, eval suites and budget caps.** B moved them into a
new Settings section; C moved them into `/tune/machine`. Both are wrong for the same reason: a
prompt, a guardrail and a cap are *how the engine runs*, and their results are read next to them.
Splitting definition from result across two destinations is how `/engine-room` became unreadable.
They stay in the **Engine pane** (`?pane=engine&pview=quality|safety|spend`), edited in place, one
click. Settings holds only account-, workspace- and connection-level policy.

**Correction to B on Settings depth.** B accepts 3 clicks for a settings section and defends it. In
this design it is 2, because the overlay opens on the group index and the section list is on the
same screen. The defence B gives ("settings are visited rarely") is the same argument that produced
`/briefing` pointing at a section id that does not exist.

### 2.5 Admin - the one deliberate 3-click path

| Surface | URL | Clicks |
| --- | --- | --- |
| Admin overview (354 + 187 layout) | `?config=admin&section=overview` | 3 |
| People (854), Workspaces (640), Platform (840), Routing (122), Pricing (636), Health/observability (427), Spend/ai-costs (249), Proof (318, incl. `ActivationFunnelPanel`) | `?config=admin&section=<id>` | 3 |

Admin is not a lens on your product; it is operator work on a different subject entirely - other
people's workspaces, platform pricing, model routing. It is role-gated (`amIAdmin`). Putting it
two clicks from every PM's daily surface is how you get an accidental pricing change. Three clicks
behind a gear inside a gated group is the correct friction. Every `/admin/*` path survives forever
as a resolver so an operator's bookmark still works in one hop.

### 2.6 The workbench children - deep work surfaces

**The modal-vs-page law:** if a thing can be worked on for more than a minute, or handed to
someone outside the loop, it is a **page**. Otherwise it is a **param on the room**.

Five things pass. Each gets a real child route wearing the same room chrome - same TopBar, same
Spine (in run mode), same depth rail - with the Thread column replaced by that object's own
sequence and the Canvas given to the work.

| Child | URL | Replaces | Thread column becomes | Clicks |
| --- | --- | --- | --- | --- |
| Spec editor | `/$ws/$product/spec/$specId?tab=` | `/plan/spec/$id` (1084) , `/prds/$id` | provenance: citations, the signals it came from, the decision that authorized it | 2 |
| Mission | `/$ws/$product/mission/$missionId?tab=` | `/build/$missionId` (870), `/missions/$id`, `/studio/$id` | the mission's step log, live | 2 |
| Trace | `/$ws/$product/trace/$traceId?step=` | `/traces/$traceId` (861) | the run's steps, replayable | 2, or 1 from any receipt |
| Prototype | `/$ws/$product/prototype/$id` | the `/design` prototype viewer | the design critic's notes and the gate verdict | 2 |
| **Map** (new, graft) | `/$ws/$product/map?focus=<kind>:<id>&depth=1\|2\|3` | `/brain?tab=graph`, `knowledge-graph-explorer` | the focused node's chain, as sentences | 2 (`k` → Map) |

**Why Map is promoted to a child and not left in the pane.** A knowledge graph at 420px is a
diagram you cannot read. It is the one Brain view that genuinely needs the canvas. It stays *inside
the room* (same chrome, Spine, rail), so this is not a second destination - it is the honest answer
to A's one real width problem.

A trace opened from a Slack link renders with the Spine in run mode lit at the stage that produced
it, the depth rail on the right with its counts, and the product switcher in the TopBar. **There is
no such thing as arriving somewhere that is not the room.**

### 2.7 The homeless, assigned - complete and verified

Every zero-importer component was re-verified this session (`grep -rl <name> src` minus its own
file). Where a proposal was wrong, the corrected fact is stated.

| Component | Lines | Importers (verified) | Home | Clicks |
| --- | --- | --- | --- | --- |
| `audio/AudioTranscriptPanel.tsx` | 386 | **0** | Two doors, one render: the **composer mic verb** dictates; **Discover face → Recordings lane** lists and opens transcripts, and `extractActionsFromTranscript` promotes a line to a signal | 1 |
| `supaprod/CommandPalette.tsx` | 454 | **2, but neither mounts the palette** - `_authenticated.tsx:4` imports only `GotoShortcuts` from it, and `_authenticated.tsx:204` calls it "the retired CommandPalette". The palette UI is dead; the file is alive as a shortcut binder. | Mounted on `⌘K` (§6.6); `GotoShortcuts` retargets to the rail/Spine keys | 0 |
| `supaprod/AttentionBell.tsx` | 97 | **0** | Gates tray → **Heads up** | 1 (`g`) |
| `today/ExecutedCard.tsx` | 547 | **0** | Gates tray → **Done without you**. The biggest orphan in the repo by line count and the best available trust artifact | 1 (`g`) |
| `observe/TracesPanel.tsx` | 189 | **0** | Record pane → **Every run** | 1 (`r`) |
| `settings/memory/MemoryView.tsx` | 201 | **1, and it is `memory.functions.ts` referencing the name in a comment, not a mount** | Brain pane → Memory. The only home | 1 (`k`) |
| `plg/MemoryExpiryBanner.tsx` | 85 | **0** | Brain pane header strip, **and** a gate card when memory is within 7 days of expiry | 1 (`k`) |
| `today/CostPerOutcomeChip.tsx` | 109 | **0** | Engine pane → Spend → Over time, **and** the receipt footer on a mission/trace child | 1 (`e`) |
| `admin/ActivationFunnelPanel.tsx` | 342 | **0** | Admin → Proof | 3 |
| `connections/ProviderCard.tsx` | 173 | **0** | Settings → Connections → Sources | 2 |
| `connections/ProductBindingPicker.tsx` | 130 | **0** | Settings → Connections → Sync & bindings | 2 |
| `connections/ApiKeyConnectDialog.tsx` | 85 | **0** | Settings → Connections → Sources (paste-a-key path) | 3 |
| `ink/AgentActivityTimeline.tsx` | 108 | **1** (a barrel, not a mount) | Crew pane → the agent's activity | 1 (`c`) |
| `build/CompositeReviewCard.tsx` | 110 | **1** (`/today`, which dies) | Gates tray → composite gates, **and** the Build face changeset card | 1 (`g`) |
| `today/FirstTeardownCard.tsx` | 689 | **1** (`/today`, which dies) | Decide face cold-start slot, wired to `gauntlet.functions.recordRitualSession` | 1 (`2`) |
| `ai/CitationList.tsx` | 53 | **1** (a barrel) | Spec workbench → every claim's citation chips | 2 |
| `decision/PrecedentNudge.tsx` | 75 | **4, and one is a real mount** - `_authenticated.plan.spec.$id.tsx` already renders it. B and C both wrongly listed it as unmounted. | Keep its spec mount; **add** the Decide-face gate card rendering (§5.4) | 1 |
| `decision/SharedPremiseNudge.tsx` | 82 | **1** (`PrecedentNudge` imports it) | The composer's contradiction warning as you type (§5.4) | 0 (ambient) |
| `today/PendingApprovalsBar.tsx` | 271 | **0** | **Deleted.** The ember tile and the Gates tray are the one count. | - |
| `supaprod/CookingBanner.tsx` | 120 | **0** | **Deleted.** Pre-`WorkingStrip` attempt at the same job. | - |
| `obsidian/today/MachineNow.tsx` | 128 | **0** | **Deleted.** Same. | - |
| `supaprod/AmbientChip.tsx` + `ambient.functions.ts` | 213 | **0** | **Deleted.** Weather is not product work; it answers none of the room's questions. | - |
| `supaprod/AiWorking.tsx` | - | live | The `WorkingStrip` live-locus indicator and the Composer in-flight state | 0 |
| `obsidian/MissionSlideOver.tsx` | - | **8** | **Deleted** in P5. A data-fetching overlay with no URL breaks the page law. Its callers move to the mission child route. | - |

**The 4 orphaned server-function domains:**

| Domain | Exports | Home | Clicks |
| --- | --- | --- | --- |
| `researcher.functions` | `getResearcherTargets`, `updateResearcherTargets` | **Two-sided, one render each, no duplication:** the *setting* is Settings → Agents → Roster → Research ("what to watch"); the *output* is the Discover face's **Watching** strip, edited inline. Per the Engine-Room doctrine the label is "What the crew is watching", never "researcher targets". | 1 / 2 |
| `design-parity.functions` | `getDesignParity`, `checkDesignParity` | Build face → changeset card → **Matches the design** row; failure opens the diff against the mockup. Result also files a Record-pane check row. | 1 |
| `gate-signals.functions` | `getGateSignals` (write half already wired from `discovery.functions` and `agent_loop.functions`) | Gates tray footer → **What your calls taught us**, and the Beliefs surface aggregate (§2.3) | 1 (`g`) |
| `delegate-poll.functions` | `pollDelegateRun` | **Deleted.** Delegate folds into Build's By-Lane lens; no caller, no future caller. | - |

**The four broken legacy redirects, fixed - with A's correction to the brief carried forward:**

| Path | Verified reality | Fix |
| --- | --- | --- |
| `/impact` | → `/brain?tab=insights`; `LEGACY_TABS` folds `insights` → `decisions`, but `ImpactLedgerPanel` only mounts on `/learn`. Genuinely broken. | → `?stage=learn&view=impact` |
| `/calendar` | → `/brain?tab=calendar` → folds to `decisions`; `CalendarPanel` unmounted; `?meeting=` silently dropped. Broken. | → `?stage=discover&view=meetings` (`&item=<id>` when present) |
| `/meetings/$id` | Same fold, id dropped. Broken. | → `?stage=discover&view=meetings&item=<id>` |
| `/briefing` | **Not broken.** It redirects to `/settings?section=brief`, and `LEGACY_SECTION_MAP` maps `brief` → `workspace`, so it resolves today. C's claim that it points at a nonexistent section id is wrong. | → `?config=workspace&section=workspace` (same behaviour, new URL). The `brief` alias stays in `LEGACY_SECTION_MAP` forever so a future prune cannot silently kill it. |
| `/start` | Renders a real one-question onboarding component (`MissionOnboarding`, 6.4KB) and nothing links to it. | Becomes the room's **first-light Thread card** (§3.2). The route dies. |

**The remaining named surfaces:**

| Surface | Home | Clicks |
| --- | --- | --- |
| `/sync` (842) | Settings → Connections → Sync & bindings | 2 |
| `/settings` (3433) | The config overlay | 1-2 |
| `/today` (1543) | Dissolved: greeting + `IntelBriefPanel` + `getProductContext` → **Thread briefing card**; `JudgmentLane` → **Gates tray**; `WatchLane` → **Discover face**; `ReceiptsStrip` → **Record pane**; `ColdStartOnramp` → **first light**; `DeskRail` → **WorkingStrip + Composer** | - |
| `/approvals` (270) | Gates tray | 1 (`g`) |
| `/threads`, `/artifacts` | Panes 4 and 3 | 1 |
| `/engine-room` (4 rooms × N) | Record → pane 2; Spend/Quality/Safety → pane 6 | 1 |
| `/traces` (bare list) | Record pane → Every run | 1 |
| `/onboarding`, `/start` | First light, in the room | 0 |

**One deliberate duplication in the whole design:** the *gate object*, which renders three ways
from one query - the ember Spine node, the tray card, and the inline card in the Thread. That is
`ApprovalsTray.tsx`'s existing "one object, three renderings, one count, one source" contract, and
it is correct: a gate must be visible where the work is, not only where the queue is.

---

## 3. THE LANDING DECISION

### 3.1 The rule

> **Every authenticated session, first frame, every time, for everyone: the room.**
> `/$workspaceSlug/$productSlug`

**And the sharper law, grafted verbatim from C: the landing route never changes based on state.
The content adapts; the address does not.** A landing that redirects differently depending on
queue length, product count or onboarding status is exactly the incoherence being complained about.

The current three-way disagreement is closed by deleting two of the three answers:

| Today | Tomorrow |
| --- | --- |
| Login → `window.location.assign("/")` → public landing detects a session → `window.location.replace("/m")` → resolve → room (two full page loads and a public-page flash) | Login navigates **in-router** to the resolved room. One hop, no bounce. |
| Onboarding completion → `/today` (`ObsidianOnboarding.tsx:684,1132`, `MissionOnboarding.tsx:63,72`) | There is no onboarding completion event, because there is no onboarding route |
| `nav-model.ts` "home" → `/today` | There is no nav model |

`/m` and `/m/$productId` are kept **forever** as resolvers, exactly as `room-url.ts` already
documents. Every recorded demo, pasted link and bookmark keeps working.

### 3.2 What a brand-new user sees

The same shell. Not a wizard, not a different route, not a full-viewport chromeless page. The room
in its **first-light** state.

| Region | First light |
| --- | --- |
| TopBar | Mark, `Your workspace / your first product`, gear, account; depth rail present with counts at zero, each carrying its one-line invitation on expand |
| Spine | All seven stages present and quiet, in product mode. **This is the single most important pixel in the product: on frame one you can see the whole thing you bought.** |
| Thread | One card: **"What are you building?"** - the `/start` component (`MissionOnboarding`) mounted here instead of stranded. One sentence in, `saveBrief` runs, `finish()` marks the profile onboarded, the card is replaced by the crew's first briefing. Skipping is a link, not a wall. |
| Canvas | The **seven journey cards**, full size (§4). Not chips in a popover. Each carries its own `startState` line from `journeys.ts`, so it says what it needs from you before you click. |
| WorkingStrip | "Nobody is working yet. Pick a journey or just say what you want." |
| Composer | Focused, empty, placeholder `Tell Supaprod what you are building.` |

The `needsOnboarding` gate in `_authenticated.tsx:34-39` stops throwing a redirect and instead sets
`?first=1` on the room URL, which turns the Thread's first card on. A user who refuses to answer is
not trapped; a user who answers never changes context.

### 3.3 The no-product and invited-user states (graft from B)

Same room, same shell, different Thread card - never a blank room and never the public landing:

| State | Thread card |
| --- | --- |
| Workspace with several products, none last-active | "helio-labs has 3 products. Which one are you here for?" plus "or start a new one" |
| Invited user, first login | "You have been added to helio-labs. Here is what the crew has been doing." Briefing card seeded from `getProductContext`, Spine painted from real state. |
| Workspace with zero products | The first-light card (§3.2) |

### 3.4 What a returning user sees in the first second

Same regions, same pixels, different content. Resolution order, all from data that exists:

1. **Spine** paints from `getLoopState` in product mode - real per-stage state, real receipts, real
   gate counts.
2. **Canvas** opens on the stage that **most recently moved**, deterministically (graft from B,
   which is sharper than A's "the stage the Spine says is live"): the stage with an active run,
   else the stage with a gate, else the furthest-right done stage. If a journey is active
   (`?journey=` persisted), the slice is lit and the canvas lands on the slice's first unfinished
   stage. **If gates are waiting the ember pulses but the canvas does not hijack - a queue is not
   an agenda.**
3. **Thread** shows the briefing card (`getGreeting` + `briefs.functions.getProductContext`, both
   live on `/today` today), then any inline gate, then the last exchange.
4. **Depth rail** paints its counts. This is the "what changed while I was gone" answer, and it is
   why the counts are load-bearing rather than decorative.

The first second says three things without being read: where the product is in its loop (the
Spine), what the machine is doing (the WorkingStrip), and what is waiting on you (the ember).

---

## 4. THE JOURNEYS

`src/lib/journeys.ts` already encodes J0-J7 with test-enforced wiring (`wiredVia`, verified by
`journeys.test.ts` which opens each named file and fails when an export is missing) plus typed
handoffs. `FULL_LOOP_CHAIN` is `["j1","j2","j3","j5","j4","j6","j7"]` (line 201). It is the most
valuable unused asset in the codebase. This design promotes it from a composer-chip data file to
**the primary interaction model**.

### 4.1 The mechanic

Picking a journey does three things, all reversible, all in the URL:

1. Lights that journey's Spine slice and switches the Spine to **run mode**; stages outside the
   slice dim but stay present (`isStageDimmed`, already built).
2. Moves the Canvas to the slice's first stage (`journeyActivation`, already built).
3. Puts a **journey cap** at the top of the Thread: the journey's `startState`, the current step,
   and always an "Or do the whole loop" escape.

`?journey=j3` persists it across reload and deep links. Clearing it returns the Spine to product
mode. **This is "only certain journeys instead of the entire lifecycle", and in a one-room design
it costs nothing to build, because a journey is a filter on the room, not a different app.**

Three doors into every journey, all one click: a journey card on the canvas, a Spine node, or
typing intent in the Composer (`journeyForIntent` already matches "what should we build next",
"tear it down", "prd", "launch", "how did it land").

### 4.2 The seven slices, wired

**M** = the machine acts. **H** = the human decides. Every journey ends with a door.

**J1 - "What should we build next?"** · `?journey=j1` · Spine `01→02`

| Step | Where | Who | What | Brain renders in place |
| --- | --- | --- | --- | --- |
| Start | Discover face | H | Say it, or click the card. Works from zero: with no sources, the Researcher fetches market signal first. | - |
| 1 | Discover face | M | `clusterSignals` groups raw signal into themes; the Watch lane shows sources moving | "you have seen this signal shape before" on repeat clusters |
| 2 | Discover face | M | Themes become ranked bets with evidence chains | - |
| 3 | Decide face | M | `runCriticReview` red-teams the top bets; `getBriefAlignment` scores each against your brief | **precedent card per bet** (`PrecedentNudge`): "3 prior calls of this shape; 2 landed" |
| 4 | **Gate** (ember Spine node 02 + tray card + inline in Thread) | **H** | Keep or kill each bet (`decideApprovalItem`) | contradiction warning if a bet fights a standing belief |
| End | Decide face | - | A ranked, Critic-reviewed bet list; the approved bet at the top with its evidence chain | the approved bet becomes a Calls row |
| **Next** | Thread handoff | - | **"Tear it down first"** (J2) or **"Write the spec"** (J3) | |

**J2 - "Tear this idea down"** · `?journey=j2` · Spine `02`

| Step | Where | Who | What |
| --- | --- | --- | --- |
| Start | Decide face, with a bet or spec in `?focus=` | H | Requires an artifact - honest scoping per the catalog GAP. From free text the composer first creates the opportunity, then tears it down, and the Thread says so. The card is disabled with a plain-words reason until a target is picked. |
| 1 | Decide face | M | `runWedgeTeardown` builds the strongest case against |
| 2 | Decide face | M | `dispatchExploration` fans out counter-evidence across the crew |
| 3 | **Gate** | **H** | `decideFanoutBatch` - accept, reject, or send back each branch |
| End | Decide face | - | A teardown verdict on the record, attached to the idea permanently |
| **Next** | Thread handoff | - | **"Write the spec anyway"** (J3) or **"Kill it"** (records the decision with its reason, returns to Discover with J1 offered) |

**J3 - "Just write the PRD"** · `?journey=j3` · Spine `03`

| Step | Where | Who | What | Brain in place |
| --- | --- | --- | --- | --- |
| Start | Plan face, the composer from an approved bet, **or a bare idea typed with no upstream at all** | H | The founder's named slice. No discovery required. | - |
| 1 | Plan face | M | `generatePrd` drafts; citations resolve against the Brain live | **citation chips on every claim** (`CitationList`) |
| 2 | **Spec workbench** `/spec/$id` | H+M | Edit alongside `prdAssist`; Thread column shows provenance | "this assumption was wrong last time" flag |
| 3 | Spec workbench | M | `generateTaskGraph` decomposes into work | - |
| 4 | **Gate** | **H** | Approve the spec. Assumptions go on watch with dates. | - |
| End | Spec workbench | - | An approved, cited spec with assumptions on watch and a task graph | |
| **Next** | Thread handoff | - | **"Design it"** (J5) where the design stage is on, else **"Build it"** (J4). Secondary: **"Share with stakeholders"** | |

**J5 - "Design this"** · `?journey=j5` · Spine `04`

| Step | Where | Who | What |
| --- | --- | --- | --- |
| Start | Design face with a spec in `?focus=` | H | Spec may be draft or approved |
| 1 | Design face | M | `generateDesignScaffold` produces the prototype in your brand (Brand Kit from Settings → Workspace → Brand) |
| 2 | Prototype workbench | M | `runScaffoldDesignCritic` reviews against the brand and the spec |
| 3 | **Gate** | **H** | `decideDesignGate`. Approve, or send back with a note. |
| End | Prototype workbench | - | An approved mockup bound to the spec. Build inherits it. |
| **Next** | Thread handoff | - | **"Build it"** (J4). Secondary: publish to a shareable `/p/$slug`. |

**J4 - "Build this feature"** · `?journey=j4` · Spine `05`

| Step | Where | Who | What |
| --- | --- | --- | --- |
| Start | Build face with an approved spec | H | No repo? `canDispatchToRepo` says so and `provisionRepoForSpec` offers to create one in your GitHub. Never a dead end. |
| 1 | Build face | M | `dispatchStudioSession` - agents write real code |
| 2 | **Mission workbench** `/mission/$id` | M | Live steps; the WorkingStrip carries the verb; the checkpointing loop pauses at tool-approval boundaries |
| 3 | **Gate** (inline, mid-run) | **H** | Approve a tool call the agent needs. Resume. Brain shows "you have approved this tool 12 times" and offers autonomy graduation. |
| 4 | Mission workbench | M | CI runs; `checkDesignParity` reports whether the code matches the approved mockup |
| 5 | **Gate** | **H** | Review the changeset. Approve → PR opens on your repo. |
| End | Mission workbench | - | Applied changeset, green CI, preview URL, PR opened |
| **Next** | Thread handoff | - | **"Launch it"** (J6). Secondary: **"Open the run"** (the trace child). |

**J6 - "Launch what we shipped"** · `?journey=j6` · Spine `06`

| Step | Where | Who | What |
| --- | --- | --- | --- |
| Start | Ship face with a shippable changeset | H | |
| 1 | **Gate** | **H** | `promoteToProduction` - preview to production is a human call, always. Brain warns "last time you skipped the canary" if it applies. |
| 2 | Ship face | M | `generateReleaseNotes` + `generateLaunchKit` + `generateLaunchPlan`, in the voice from Settings → Workspace → Brief & voice |
| 3 | Ship face | H | Copy out. **Honest edge: nothing is published or scheduled from here; the UI offers Copy, never Post or Send.** |
| 4 | Ship face | M | Arms the outcome check with a date from the spec's outcome contract |
| End | Ship face | - | Live in production, changelog written, launch copy in hand, outcome check armed |
| **Next** | Thread handoff | - | **"See how it lands"** (J7), dated - the Thread says *when* it will come back to you |

**J7 - "How did it land?"** · `?journey=j7` · Spine `07`

| Step | Where | Who | What |
| --- | --- | --- | --- |
| Start | **The gate finds you.** The only journey whose primary entry is `gate`: the armed outcome check fires into the tray on its date. | M | `checkPrdShipped` |
| 1 | Learn face | M | `getOutcomeData` assembles what happened against the outcome contract, and states plainly what it cannot measure. The assumptions this ship was meant to validate are pre-filled. |
| 2 | Learn face | **H** | `recordOutcome`. **Honest edge: human-attested. The UI says "record how it landed", never "we measured how it landed".** |
| 3 | Learn face | M | Challenged assumptions flag; the learning writes to the Brain |
| End | Learn face | - | The outcome on the record; the learning in the Brain; failed assumptions flagged |
| **Next** | Thread handoff | - | **"What should we build next?"** (J1), and the Discover face now carries this learning as an input. The loop closes visibly as the `07→01` return edge lights on the Spine. Secondary: **"See what this changed"** (Brain pane, the only journey terminal that offers a Brain door, because the journey is over). |

**J0 - "Take it from signal to shipped"** · `?journey=j0` · Spine `01→07`

Not a separate machine - the chain `j1 → j2 → j3 → j5 → j4 → j6 → j7`, each DONE flowing into the
next START automatically instead of waiting for a click. Human gates still stop it. J5 participates
only where `design_stage_enabled`; J2 is skippable from its own handoff. The whole run reads left
to right on the Spine as one lit slice. You can drop out at any seam and resume from the Spine.
This is the demo, and it is the same screen a real user works on.

### 4.3 The no-dead-end law, and the terminal register

Three enforcement points, all with code today:

1. **Every journey terminal has a `handoff`** with a `suggestedNextJourneyId` (type-enforced in
   `journeys.ts`; no journey may omit it).
2. **Every empty state is a `WarmSlot`** naming who acts next and carrying an action, never a shrug.
3. **Every error state wears the chrome** - doors, switcher and sign-out still present.
   `$workspaceSlug.$productSlug.tsx:104-138` already does this correctly and is the model.

| Terminal state | The door offered |
| --- | --- |
| bet approved | write the PRD · tear it down first |
| bet killed | what should we build next |
| teardown survived | write the PRD |
| teardown fatal | what should we build next |
| spec approved | design it · build it · share with stakeholders |
| spec sent back | the spec, with the reviewer's note at the top |
| design approved | build it · publish the prototype |
| build green | launch it · open the run |
| build red | the failing check, with "send it back" and "take it over" |
| run failed | "try again with what we learned" (re-dispatch, same intent, failure context attached) · "ask why" |
| gate declined | "tell it what to do instead" (composer prefilled with the decline reason) |
| shipped | how did it land (dated) |
| outcome recorded | what should we build next · see what this changed |
| empty pane, any tile | the tile's one-line invitation and the one action that fills it |
| empty stage face | a `WarmSlot` naming who acts next and the chip that starts them |
| empty workspace | the first-light card |
| error | the in-shell error card, the real message, retry, and a door to the room |

---

## 5. THE INTERLINKS

### 5.1 THE BLOCKING BACKEND DEFECT (graft from B, verified in code)

The graph backbone exists: `artifact_lineage` (parent_kind, parent_id, child_kind, child_id,
relation, rationale, **created_by_agent**, ai_event_id), written by `recordLineage`, read by
`getLineage`, `getProvenance`, `getEntityLineage`, `getKnowledgeGraph`.

**It cannot represent the back half of the loop. Verified this session:**

```
src/lib/lineage.functions.ts:7-21
  ARTIFACT_KINDS = signal, theme, opportunity, prd, roadmap_item, task, meeting,
                   decision, mission, house_rule, design_memory, prototype,
                   capability_change
  MISSING: changeset, deployment, outcome, learning, belief

src/lib/knowledge-graph-view.ts:18-29
  GRAPH_NODE_KINDS = signal, theme, opportunity, prd, roadmap_item, task, meeting,
                     decision, mission, design_memory
  MISSING, on top of the above: house_rule, prototype, capability_change
```

`GRAPH_RELATIONS` is already complete (`promoted`, `cites`, `derived-from`, `depends-on`,
`validates`, `supersedes`, `contradicts`). The relations are fine; **the node vocabulary is the
hole.** `recordLineage` is called from only 8 non-test modules (`studio`, `prototypes`,
`capabilities`, `discovery`, `scout/strategy-brief`, `ai/cluster`, `ai/tools/registry`,
`ai/shared-premise`) - none of them on the mission → changeset → deployment → outcome → learning →
belief path.

**This is the literal, mechanical reason the loop "does not connect" after Build.** No IA can fix
it. It is Phase 3, it is a hard gate, and no amount of front-end work substitutes for it.

Required:
1. Extend `ARTIFACT_KINDS` with `changeset`, `deployment`, `outcome`, `learning`, `belief`.
2. Bring `GRAPH_NODE_KINDS` to parity with `ARTIFACT_KINDS` (one enum derived from the other, so
   they cannot drift again).
3. Add the missing `recordLineage` calls on the back half.
4. Backfill lineage for existing rows where the parent is derivable.
5. Wire `gate-signals.functions.ts`: every `decideApprovalItem` writes a gate signal.
6. **Gate:** `getKnowledgeGraph` on a seeded workspace returns a connected graph from signal to
   belief. Today it stops at the spec.

### 5.2 The link grammar - three types, three treatments

The direct answer to "if I click this, what will happen?"

| Type | Renders as | What happens | Never |
| --- | --- | --- | --- |
| **Trace link** (backward, "where did this come from") | a mono chip: `SIG-204`, `SPEC-52`, `trc_9` | opens that entity in a **pane or peel over the current canvas**; you do not lose your place | never navigates away |
| **Move link** (forward, "the next step") | an ember `NextLine` door with a verb: "Write the spec" | **moves the room**: sets `?stage=` and `?focus=`, lights the journey slice | never opens a modal |
| **Deep link** (sideways, "the full workbench") | a quiet "Open" affordance on a row | navigates to a **workbench child** | never a modal that traps state |

**The rule: backward is always a peel, forward is always a move.** Learn it once and every link in
the product is predictable.

### 5.3 The ChainStrip (graft from C) - one component, not eleven implementations

**Every entity view renders a `ChainStrip`**: back-links on the left as sentences, forward-links on
the right as states, each carrying the peer title and the `AgentChip` for
`artifact_lineage.created_by_agent` (already populated, already selected by `getLineage`). One
shared component reading `getLineage`. No entity view ships without it; `chain.test.ts` fails the
build when one does.

Two rendering rules:

1. **A back-link renders as a sentence, not a breadcrumb.** "Building spec: Rollout gate, approved
   by you 2 days ago" is one line and the artifact names in it are the links. Breadcrumbs make a
   chain look like a hierarchy; this is a graph.
2. **A forward-link is a state, not a promise.** The spec's `Design → Build → Ship` strip shows
   each chip as live, done, or not started, with a receipt on the done ones. It never renders a
   chip for a thing that has not happened as if it were a place you can go.

That single wiring makes the 13-agent crew visible on every screen without a crew destination.

### 5.4 The entity graph

**D** marks a rendered, clickable door. Unmarked relations are queryable but deliberately not
chrome (the restraint budget).

| Entity | Home surface | FORWARD to | BACK to |
| --- | --- | --- | --- |
| **Signal** | Discover face | **D** the bet it clustered into · **D** the spec that cites it · the learning that re-scored it | **D** source (connector / meeting / recording / support ticket) · **D** raw item |
| **Bet** (opportunity) | Decide face | **D** decision (keep/kill) · **D** teardown verdict · **D** spec generated from it · roadmap slot | **D** signals it clusters (count chip peels the evidence chain) · **D** brief alignment score · **D** prior bet it supersedes |
| **Decision** | Brain pane → Calls; rendered at the gate where it is made | **D** spec it authorized · **D** outcome that judged it · **D** belief it promoted to · precedent it set | **D** the bet or spec it ruled on · **D** evidence chain · **D** receipt in the ledger · **D** who decided, when · `/d/$slug` public share |
| **Spec** | Spec workbench | **D** prototype · **D** mission · **D** task graph · **D** outcome contract · **D** stakeholder pack · **D** deployment | **D** bet · **D** decision that approved it · **D** citations (each opens its signal or Brain doc) · **D** assumptions on watch. The densest interlink surface in the product. |
| **Prototype** | Prototype workbench | **D** mission that inherits it · **D** design-parity check on the changeset · artifact entry | **D** spec · **D** brand kit version used · **D** design critic notes · **D** gate verdict · `/p/$slug` share |
| **Mission** | Mission workbench | **D** changeset · **D** trace of every step · **D** deployment · preview URL | **D** spec · **D** prototype · **D** agent that ran it (→ Crew pane) · **D** tool approvals granted mid-run |
| **Changeset** *(new kind)* | Build face + Mission workbench | **D** PR (external) · **D** deployment · **D** design-parity verdict | **D** mission · **D** spec's task-graph nodes it satisfies · **D** files touched |
| **Deployment** *(new kind)* | Ship face | **D** changelog entry · **D** announcement · **D** outcome check (armed, with its date) | **D** changeset · **D** PR · **D** who promoted it, when |
| **Outcome** *(new kind)* | Learn face | **D** learning · **D** assumptions it confirmed or broke · **D** impact ledger entry | **D** spec's outcome contract · **D** deployment · **D** the original decision. *That last one is the loop's closing link and the single most important door in the product.* |
| **Learning** *(new kind)* | Brain pane → Learnings | **D** belief it promotes to (via the review gate) · **D** house rule · **D** future bets it re-scores · playbook proposal | **D** outcome · **D** spec · **D** decision it judges in hindsight |
| **Belief** (memory) *(new kind)* | Brain pane → Beliefs | **D, and this is the whole product:** "it stopped you 2 times" and "it changed 4 specs", each a real artifact list · **D** every agent run that cited it | **D** learning or human capture it came from · **D** the gate that approved it · **D** its expiry |
| **Gate signal** | not a row of its own | belief (on graduation) | the gate, the call you made, the agent that asked. Rendered only as the aggregate under "What your calls taught us". |
| **House rule** | Engine pane → Safety | **D** gates it suppresses or auto-approves ("this rule has fired 9 times") | **D** learning · **D** belief · a human authoring it |
| **Meeting / transcript** | Discover face → Recordings | **D** signals extracted · **D** action items · **D** decision | **D** calendar source · **D** the recording |

### 5.5 The four cross-cutting spines

| Spine | Rendering | Reached |
| --- | --- | --- |
| **Receipt** | a `ReceiptLine` on every artifact card: who, what, when, mono id | **D** → Record pane, that receipt, its tamper seal, its trace |
| **Trace** | a `trc_*` chip on anything an agent produced | **D** → the trace workbench child |
| **Agent** | an `AgentChip` on every machine-authored thing, from `created_by_agent` | **D** → Crew pane, that agent, its runs and scorecard |
| **Gate** | the ember `GateChip` - one object, three renderings | **D** → the artifact under judgment, at its stage |

### 5.6 The Brain renders INTO the room at four points (graft from B)

The record is never something you navigate away to consult. Four in-place renderings, all backed by
components that exist:

| Where | What renders | Component / fn |
| --- | --- | --- |
| 02 Decide, on every bet in the queue | precedent card: "you have decided this shape 3 times; here is what happened" | `PrecedentNudge.tsx` (already mounted on the spec page; add the gate-card rendering) |
| 03 Plan, inside the spec editor | citation chips on every claim; hover reveals the source signal or prior outcome | `CitationList.tsx` (53 lines, unmounted), `lineage.functions.getProvenance` |
| Composer, as you type | "we tried this before and it did not land" contradiction warning | `contradiction-auditor.functions`, `SharedPremiseNudge.tsx` |
| 07 Learn, on the outcome form | the assumptions this ship was supposed to validate, pre-filled | `outcome.functions`, `decisions.functions.resolveAssumptionChallenge` |

Each carries a quiet **[see the chain]** affordance opening `?pane=brain` or the Map child at that
focus. It is always optional. **A journey step may read from the Brain; a journey step may never
require navigating to it.** If a design needs the user to leave the work to consult the record,
that is a defect in the work surface, not a reason to move the surface.

### 5.7 The two closure links that make it a loop and not a pipeline

Both are currently missing and both are the difference between a workflow tool and a company brain:

1. **Outcome → the original Decision.** Standing on a recorded outcome, one click reaches the
   decision that caused it, **with the evidence that was available at the time**. This is what
   makes the Brain a judgment record rather than a document store.
2. **Bet → the Learnings that re-score it.** Standing on a new bet in Discover, the Brain
   volunteers *"you shipped something like this in March; here is how it landed"* - unprompted, in
   the Thread, before you decide. This is the investor-canon promise ("it warns before you repeat
   what was wrong") and it is the **one place the product is allowed to interrupt you**.

Neither is buildable until §5.1 lands. That is why §5.1 is a gate.

---

## 6. DEEP LINKS AND SUB-PAGES

### 6.1 The URL scheme, complete

```
/$workspaceSlug/$productSlug
    ?stage=    discover|decide|plan|design|build|ship|learn     which canvas face
    &view=     <stage-specific>                                 sub-view within the face
    &journey=  j0..j7                                           the lit Spine slice, run mode
    &focus=    <kind>:<id>                                      the entity open on the canvas
    &pane=     brain|record|made|threads|crew|engine            the open depth pane
    &pview=    <pane-specific>                                  sub-tab within the pane
    &item=     <id>                                             the row open inside the pane
    &gate=     open|<kind>:<id>                                 the gates tray
    &config=   you|workspace|agents|connections|plan|admin      the config overlay
    &section=  <SectionId>                                      section within the overlay
    &first=    1                                                first-light state
    &q=        <string>                                         palette / in-pane search

/$ws/$product/spec/$specId        ?tab=doc|assumptions|tasks|lineage
/$ws/$product/mission/$missionId  ?tab=timeline|diff|checks|preview
/$ws/$product/trace/$traceId      ?step=<n>
/$ws/$product/prototype/$id
/$ws/$product/map                 ?focus=<kind>:<id>&depth=1|2|3
```

**Typed focus.** `?focus=spec:SPEC-52`, `bet:op_9f2`, `signal:sig_88`, `decision:dec_12`,
`mission:ms_44`, `outcome:out_3`, `meeting:mt_7`. The type prefix is load-bearing: it lets the room
infer the stage when `?stage=` is absent, it matches `nodeKey()` in `knowledge-graph-view.ts` so
one focus grammar spans room panels and the Map, and it makes an unknown id fail with a specific
message rather than a generic one.

### 6.2 Total addressability without a second namespace (graft from C, in A's grammar)

C's `/open/$kind/$id` guarantees an orphan permalink is structurally impossible, which is the right
guarantee, but it buys it with a second URL namespace and a generic renderer shell. Same guarantee,
A's grammar:

> **Every kind in `ARTIFACT_KINDS` (post-§5.1) plus the runtime kinds (run, changeset, release,
> trace, gate, thread, transcript, belief) is addressable, either by a specialised workbench child
> or by a registered `?focus=` renderer on the room.** `permalinks.test.ts` enumerates the enum and
> fails when a kind has neither.

Five kinds get heavyweight specialised children (spec, mission, trace, prototype, map). Every other
kind gets a thin focus renderer over the canvas, which by definition wears the chrome. No kind can
exist without a door.

### 6.3 Orthogonality - the rule that makes this composable

`stage`, `pane`, `gate` and `config` are **independent**. Any combination is legal and renders
sensibly, because each owns a different region:

- `?stage=plan&pane=brain` - writing a spec with the Brain open beside it. **This is the product.**
- `?stage=build&gate=open` - approving a mid-run tool call without leaving the mission.
- `?stage=learn&config=workspace&section=brand` - the overlay scrims the room; Escape returns you
  exactly to Learn.

No combination is disallowed, none requires a special case, none loses state. That is what
"everything is in the same thing" means mechanically.

**Escape closes exactly one layer**, innermost first: an open menu, then a dialog, then a peel,
then a pane or tray, then the overlay. `RoomDetail.tsx:209-226` already implements this correctly;
lift it into the shell and give it **one owner**.

### 6.4 Modal vs page vs pane - the law

| Shape | Use for | Examples |
| --- | --- | --- |
| **Page** (workbench child) | worked on for more than a minute, or handed to someone outside the loop, or has tabs of its own | spec, mission, trace, prototype, map |
| **Pane** (`?pane=`, 420px over-panel) | scanned, referenced, or picked from while working | Brain, Record, Made, Threads, Crew, Engine |
| **Tray** (`?gate=`, ember over-panel) | judgment. Distinct chrome because judgment is a distinct act. | approvals |
| **Overlay** (`?config=`, full-screen scrim) | configuration that changes how the room behaves | Settings, Admin |
| **Peel** (in-place expand, no URL) | reading one more level of the row you are already on | a receipt's detail, a citation's source text, an assumption's history |
| **Dialog** (no URL, focus-trapped) | confirm, name, connect, or destroy. Nothing else. | rename artifact, confirm delete, paste an API key |

**The prohibitions:**
- **Anything with its own data fetch is addressable.** If it calls a server function to render, it
  gets a URL. This is the rule `/plan`'s seven child panels break today and `MissionSlideOver`
  breaks structurally.
- No dialog may contain a form longer than three fields.
- No dialog may be the only place a capability lives.
- No `?focus=` peel opens another `?focus=` peel; the second promotes to a child page.
- Maximum depth from the room: **room → child → tab → row peel.** Four levels, hard cap.
- Tab, filter and open-panel state live in the URL, never in component state. Copying the address
  bar reproduces the screen.
- Filters are additive: `navigate({ search: (prev) => ({...prev, view}) })`, the functional form,
  never a plain object. That bug is already documented at `_authenticated.build.index.tsx:661`.
- Copy-link copies the **canonical slug form**, never the uuid form. `roomLinkFor()` already does
  this resolution.

### 6.5 Deep link whose parent state is missing

Ranked, and every branch ends somewhere real. The generalized principle, from the one good
precedent in the codebase (`$workspaceSlug.$productSlug.tsx:48-52`): **resolve, never bounce; and
hydrate the shell from the entity.**

| Missing | Behaviour |
| --- | --- |
| No workspace/product in the URL (`/settings?section=x`, `/brain`, any legacy path) | the legacy resolver mounts, runs the same last-active-product resolution `/m` uses, and **replaces** the URL with the room URL carrying translated params. One frame, no flash of a wrong shell. |
| Entity exists, parent derivable | hydrate from the entity. `spec/$id` resolves its product, workspace and stage; the frame sets workspace context, lights Spine 03 in run mode, opens the spec. **Never 404 a thing that exists just because the context was cold.** |
| Entity exists, in a different workspace you belong to | switch context silently, render it, flash the switcher, and say so in one Thread line: "Switched to Relay - that run belongs there." |
| Entity exists, you lack access | identical answer to "does not exist". RLS makes them indistinguishable on purpose; the copy does not leak which. One door: "Ask to be added." |
| Entity gone | the **gone card**, in place, wearing the chrome: "That spec was deleted on 12 Jul. Its decisions are still on the record." Plus one door forward. Never a redirect, never a blank. |
| `?focus=spec:SPEC-52` and the spec is gone | the Plan face renders its list normally with an inline honest note on top. The list beneath is the recovery. |
| `?focus=` with no `?stage=` | stage inferred from the type prefix and written into the URL |
| `?stage=design` but design is off for the workspace | the Spine renders `04` as skipped-by-policy (not missing), the Canvas explains it in one line and offers the door that turns it on |
| `?pane=record&item=trc_9`, trace deleted or foreign | pane opens on its list; a dismissible line names what was not found |
| unknown `?view=` / `?pview=` | falls back to the surface's first tab, silently, and strips the bad param. Already `ROOM_TABS[room][0].id` behaviour. |
| `?config=admin` and you are not an admin | the overlay opens on the group index with Admin absent. No error, no 403. You simply do not have that group. |
| `?journey=j4` but that journey already completed | Spine returns to product mode, the Thread carries one line: "That run finished on 12 Jul." plus its terminal handoff door. |
| any param the schema does not know | dropped by `validateSearch`. Already the room's behaviour and it is right. |
| **a retired URL** | redirect carrying **every** param, and land with **a one-line dismissible note in the frame**: "Traces now live under What happened." *(graft from B: a silent redirect is how the founder learned not to trust his own links.)* |

### 6.6 Legacy - one resolver, not 41 stubs

All 41 verified pure-redirect stubs collapse into a single `src/lib/legacy-resolver.ts` and one
catch-all route. One table: old path (+ old search) → new room search + an arrival `note`. It
replaces `legacy-redirects.ts`'s static map, the 14-way `?tab=` branch in `/govern`, the 6-way
branch in `/product`, and every param-forwarding stub. Every old URL resolves in one hop, forever,
and there is exactly one file that answers "where did X go". A test fails when any entry's target
does not exist in the home table.

### 6.7 The palette - mounting what already exists

`CommandPalette.tsx` is 454 lines of a complete JUMP / SETTINGS / ACT / RECENT / ASK / CATALOG
palette. **Verified nuance both B and C got wrong:** the file has two importers, but neither mounts
the palette - `_authenticated.tsx:4` imports only `GotoShortcuts` from it, and the comment at
`_authenticated.tsx:204` calls it "the retired CommandPalette". The palette UI is dead; the file
survives as a keybinding host.

Search is currently unreachable because `⌘K` opens the composer. Fixed by splitting two different
questions onto two keys:

| Key | Opens | Question |
| --- | --- | --- |
| `⌘K` | the palette | "take me to a thing I can name" - any entity, stage, pane, setting, journey, agent |
| `⌘J` | the composer | "do something for me" - the existing `supaprod:open-ask` path, unchanged |

`GotoShortcuts` retargets from `nav-model.ts`'s ten rows to the Spine digits and the rail letters,
derived from one table so the shown key and the bound key cannot drift (the existing DERIVATION
LAW, retargeted).

**The palette's empty state is the Deck (graft from C):** the browsable inventory of what the
product can do, in plain words, grouped by the question each verb answers, built from
`palette-catalog.ts` and `ACT_VERBS`. It carries the `journeys.ts` enforcement law extended to the
whole catalogue: **every Deck row names the server functions it runs on, and `deck.test.ts` opens
each file and fails when an export is missing.** A verb that is not wired does not appear.

**But the Deck is never load-bearing.** Everything in it is reachable from the Spine, the rail, or
the Composer without knowing a word. The palette is an accelerator, never a second IA. That is the
line C crossed and this design does not.

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
| `_authenticated.brain.tsx` | 698 | `?pane=brain` (Beliefs landing) + the Map child |
| `_authenticated.engine-room.tsx` + `components/engine-room/**` | - | Record room → `?pane=record`; the other three → `?pane=engine` |
| `_authenticated.approvals.tsx` | 270 | `?gate=open` |
| `_authenticated.threads.tsx` / `.artifacts.tsx` | - | `?pane=threads` / `?pane=made` |
| `_authenticated.traces.tsx` | - | `?pane=record&pview=traces` |
| `_authenticated.sync.tsx` | 842 | `?config=connections&section=sync` |
| `_authenticated.settings.tsx` | 3433 | `?config=` (the 16 section renderers move intact; only the frame changes) |
| `_authenticated.admin.tsx` + 9 admin routes | ~4000 | `?config=admin&section=` |
| `_authenticated.onboarding.tsx`, `_authenticated.start.tsx` | - | first light, in the room |
| the 41 pure-redirect stubs | ~41 files | one `legacy-resolver.ts` + one catch-all |

### 7.2 Routes that move (re-homed, not deleted)

| From | To |
| --- | --- |
| `/plan/spec/$id` (1084) | `/$ws/$product/spec/$specId` |
| `/build/$missionId` (870) | `/$ws/$product/mission/$missionId` |
| `/traces/$traceId` (861) | `/$ws/$product/trace/$traceId` |
| *(new, from `/design`)* | `/$ws/$product/prototype/$prototypeId` |
| *(new, from `/brain?tab=graph`)* | `/$ws/$product/map` |

### 7.3 Components deleted

| Component | Lines | Absorbed by |
| --- | --- | --- |
| `supaprod/AppShell.tsx` | 1033 | the one shell + the depth rail |
| `mission/RoomChrome.tsx`'s duplicate `ProductSwitcher` | - | one `ProductSwitcher`, one file. It is currently written twice, `RoomChrome.tsx:57-131` and `MissionShellView.tsx:122-201`, near-identically. Two copies of the workspace switcher is the shell split in miniature. |
| `supaprod/TopBar.tsx`, `supaprod/PageHeader.tsx` | - | `RoomTopBar` + `CanvasFace`'s `SurfaceHeader` |
| `supaprod/FocusDock.tsx` | - | `WorkingStrip`. It already fights the composer for the bottom-center (`_authenticated.tsx:210-216` documents the collision). |
| `supaprod/CookingBanner.tsx`, `supaprod/AmbientChip.tsx` + `ambient.functions.ts`, `obsidian/today/MachineNow.tsx` | 120 / 213 / 128 | `WorkingStrip` does the job correctly and honestly (no cost figures, honest time only). Weather is deleted outright. |
| `today/PendingApprovalsBar.tsx` | 271 | the ember tile + Gates tray |
| `today/*` lanes, hero, desk rail | - | redistributed per §2.7 |
| `obsidian/MissionSlideOver.tsx` | - | the mission workbench child (a data-fetching overlay with no URL breaks the page law) |
| `onboarding/ObsidianOnboarding.tsx` | - | first light |

### 7.4 Modules deleted or rewritten

| Module | Fate |
| --- | --- |
| `src/lib/nav-model.ts` | **Deleted.** Ten destinations in three zones is the thing being removed. `navKeyHint`'s derivation law moves to the new rail/Spine key table. |
| `src/lib/legacy-redirects.ts` | **Deleted**, replaced by `legacy-resolver.ts` with per-entry arrival notes (§6.6) |
| `src/lib/delegate-poll.functions.ts` | **Deleted.** No caller, no future caller. |
| `src/lib/ambient.functions.ts` | **Deleted** with `AmbientChip`. |
| `src/lib/surface-registry.ts` | **Rewritten, kept.** It is the no-orphan enforcement. **Verified: 91 occurrences of `planned` in the file today** - a registry that is largely aspirational cannot enforce anything, and its `home` strings name a Mission Control IA that half-shipped. Its vocabulary retargets to `stage/*`, `pane/*`, `child/*`, `config/*`, `tray`, `composer`, every entry becomes `live` or is deleted, and the test gains one assertion: **every `home` must be constructible into a real URL by `room-url.ts`.** That turns it from documentation into a compiler for the IA. |
| `src/lib/room-url.ts` | **Extended**, keeping every existing guarantee, and becomes the single URL builder for every param in §6.1. Nothing constructs a room URL by string concatenation. |
| `src/lib/lineage.functions.ts`, `src/lib/knowledge-graph-view.ts` | **Extended** per §5.1, with one enum deriving from the other so they cannot drift again. |
| `src/components/supaprod/CommandPalette.tsx` | **Kept and finally mounted** (§6.7); its Deck becomes the empty state. |

> **SUPERSEDED 2026-08-21 — the palette is retired, not mounted.** The clause is left standing so the reversal can be checked. Every job it reserved the palette for is now done by something mounted (`GotoShortcuts`, `RailFind`, `ShortcutSheet`), and ⌘K is Ask's by the founder's 2026-07-30 call, so it had no key left. Record and the case for keeping it: `docs/decisions/palette-retired-2026-08.md`.


### 7.5 Concepts killed

| Concept | Why |
| --- | --- |
| **Two shells** | The `_authenticated.tsx:146-185` allowlist is deleted. One shell, no branch. Verified today it branches on `isOnboarding`, `isMissionControl` (route-id matched) and `isReimaginedSurface` (a hand-maintained pathname list of `/threads`, `/artifacts`, `/settings`, `/approvals`, `/brain`). Any route added outside that list silently renders in the retired shell. That is how a brand-new user's first screen ended up in the wrong app. |
| **"Today"** | A dashboard next to the loop guarantees duplication. |
| **"Pulse" as a label** | One word covering spend, evals, guardrails and the ledger, appearing in no URL and no user's vocabulary. |
| **The loop as navigation** | A stage is state, not a place. Seven rail rows duplicate the Spine and then contradict it. |
| **Stage-shaped wrappers with no data** | The `/decide`, `/ship`, `/learn` pattern. Banned going forward by the face law (§2.1). |
| **The recessed door** (`hidden sm:flex`, `--ink-subtle`, no count, no key, no URL) | The specific mechanism that lost depth on 2026-07-18. Banned by name; replaced by the rail. |
| **Depth behind a palette** | The specific mechanism proposal C would have reintroduced. The palette may accelerate; it may never be the only door. |
| **Memory's three homes** | One home: `?pane=brain&pview=memory`. Policy only in Settings. |
| **"Brain" as a filing cabinet** | Four tabs of stored rows is the banned "where the record lives" framing. Beliefs is the front. ("Company brain" also stays YC's phrase, quoted and attributed, never our product noun.) |
| **`⌘K` opening the composer** | Two questions, two keys. |
| **Full-viewport chromeless onboarding** | The reason a brand-new user's first authenticated screen is a retired shell. |
| **Two counts** | One count, one source. `AttentionBell` merges into the tray as a quiet secondary section, never a second number. |
| **`surface-registry` entries with `status: 'planned'`** | A registry that records intent rather than truth stops being enforcement. After migration the test fails on any `planned`. |

---

## 8. THE MIGRATION

Ten phases. Every phase ships. **The invariant at every boundary: every URL that worked at the
start of the phase still works at the end.** The ordering is load-bearing: the irreversible step
(P3, deleting the old shell) happens only after depth is already visible (P2). Reverse those two
and you rebuild the 2026-07-18 failure exactly.

| P | Ships | Work | Gate |
| --- | --- | --- | --- |
| **P0** | nothing visible | Extend `room-url.ts` to build every param in §6.1. Add `pane`, `pview`, `item`, `gate`, `config`, `section`, `focus`, `journey`, `first` to the room's `validateSearch` as accepted no-ops. Write `legacy-resolver.ts` with today's mapping plus arrival notes; point the 41 stubs at it (behaviour identical). | route tests green; `legacy-redirects.test.ts` ported and passing against the new resolver |
| **P1** | **one shell** | Delete the pathname allowlist in `_authenticated.tsx`. Every authenticated route renders inside the room shell. Legacy page bodies render full-width where the Canvas will go. Delete the duplicate `ProductSwitcher`. Nothing has moved yet, but the shell disagreement, the bounce to the retired rail, and the stranded account menu are all gone in one release. | all ~68 routes render with a TopBar, a switcher and a sign-out. Screenshot every route. |
| **P2** | **depth becomes visible** | Build the 48px rail: seven tiles, live counts via **one batched `getRailCounts` server fn** (see risk 1), the zero-count law, `g k r m t c e`. Each tile opens the **existing** surface inside the over-panel: `/brain`'s body, the Engine Room's rooms, `ApprovalsTray`, `ThreadsSurface`, `ArtifactsSurface`, `CrewDrawer`. Routes still exist and still work. | a user reaches Crew, Record, Engine and Threads without knowing a URL - the thing that has never been true |
| **P3** | **one landing** | Login navigates in-router to the resolved room (drop the public-page bounce). `needsOnboarding` sets `?first=1` instead of redirecting. Mount `MissionOnboarding` as the first-light Thread card; add the no-product and invited states. `/today` becomes a resolver entry. **Delete `AppShell.tsx` and `nav-model.ts`.** | the three-way landing disagreement is closed; there is one first frame, and its address never varies |
| **P4** | **the graph** (backend) | §5.1 in full: extend `ARTIFACT_KINDS`, derive `GRAPH_NODE_KINDS` from it, add the back-half `recordLineage` calls (mission → changeset → deployment → outcome → learning → belief), backfill where derivable, wire `gate-signals`. | `getKnowledgeGraph` on a seeded workspace returns a connected graph from signal to belief. **Hard gate: no front-end phase after this may ship without it, because §5.6 and §5.7 are unbuildable without it.** |
| **P5** | **the seven faces**, one stage per ship | Move each stage body into its `faces.tsx` face, in order: **Plan → Build → Discover → Decide → Learn → Ship → Design.** (Plan and Build first: largest, most-used, highest-risk, and they prove the pattern while a fallback still exists. Decide/Ship/Learn are nearly free - they own no data today.) An unmigrated stage's face renders a door to its old route, so a half-migrated Spine is honest, not broken. Add Spine run mode. | each face makes at least the same queries as the route it replaced, verified file against file; the face law holds |
| **P6** | **the workbench children** | `spec`, `mission`, `trace`, `prototype`, `map` move under the room with shared chrome. Old paths become resolver entries carrying every param. Delete `MissionSlideOver`. | a pasted `/plan/spec/$id?tab=contract` lands on the same tab, in the room |
| **P7** | **the config overlay** | Settings becomes `?config=`; the 16 section renderers move unchanged. Admin becomes the gated sixth group. `/settings` and `/admin/*` become resolvers. Move `memory` out of Settings into the Brain pane, leaving `memory-policy`. Fold `/sync` in whole; mount `ProviderCard`, `ProductBindingPicker`, `ApiKeyConnectDialog`. | every `?section=` id including every `LEGACY_SECTION_MAP` alias still lands. `settings-sections.test.ts` extended, not replaced. |
| **P8** | **the graph doors and the journeys** | Wire every **D** door in §5.4 through one `ChainStrip`. Build the two closure links (§5.7) and the four in-place Brain renderings (§5.6). Promote journey cards to the first-light canvas and the journey cap to the Thread. Mount `CommandPalette` on `⌘K` with the Deck as its empty state. Mount every remaining orphan at its §2.7 home. Build the Beliefs surface. | a click-path audit walks every **D** door; `journeys.test.ts` still verifies every `wiredVia`; `deck.test.ts` green |
| **P9** | **the delete and the proof** | Remove every route, component and module in §7. Collapse the 41 stubs. Rewrite `surface-registry.ts` to the new vocabulary with the URL-constructibility assertion and zero `planned`. Then turn on the full enforcement battery (§9) and run the click-path proof from a cold login. | §9 green; `bun run build` clean; no route file over 900 lines except the settings section renderers |

---

## 9. THE ENFORCEMENT BATTERY (graft from C)

The home table becomes an executable contract instead of a document that rots.

| Test | Fails when |
| --- | --- |
| `surface-registry.test.ts` | any `*.functions.ts` on disk has no entry · any entry has no `opensFrom` · any entry is `status: 'planned'` · **any `home` is not constructible into a real URL by `room-url.ts`** |
| `one-home.test.ts` | two surfaces claim the same capability as HOME |
| `destinations.test.ts` | the shell exposes anything other than the room, the seven Spine stages, the seven rail tiles and the gear · a feature added a nav item |
| `permalinks.test.ts` | a kind in `ARTIFACT_KINDS` (post-P4) has neither a workbench child nor a registered `?focus=` renderer |
| `chain.test.ts` | an entity renderer does not mount `ChainStrip` |
| `lineage-parity.test.ts` | `GRAPH_NODE_KINDS` and `ARTIFACT_KINDS` diverge |
| `deck.test.ts` | a Deck row's named server function does not exist (the `journeys.ts` `wiredVia` law extended to the whole catalogue) |
| `journeys.test.ts` | *(exists)* a journey's `wiredVia` names a missing export, or a journey omits its `handoff` |
| `no-dead-end.test.ts` | a terminal state renders without a forward door |
| `legacy-resolver.test.ts` | an old path's target does not exist in the home table |
| `click-path.test.ts` | from a cold login, any row in the §2 home table exceeds its stated click budget, **or any surface is reachable by two distinct paths** |
| `face-law.test.ts` | a canvas face makes no query the room does not already make |

---

## 10. THE BURDEN OF PROOF, ANSWERED

| Depth | Reachable in | Advertises itself by | Addressable as |
| --- | --- | --- | --- |
| **The ledger** (tamper-evident receipts, traces, approvals log) | 1 click (`r`), or 0 from any receipt chip on any artifact | a permanent rail tile counting receipts since your last look | `?pane=record&pview=receipts&item=<id>` |
| **The engine room** (spend, quality, safety, prompts, guardrails, caps, routines) | 1 click (`e`) | a permanent rail tile that turns amber when any of the three rooms is on watch, carrying that room's one-line action | `?pane=engine&pview=quality` |
| **The crew** (13 agents, trust, runs, scorecards) | 1 click (`c`), or 0 from any `AgentChip` anywhere | a permanent rail tile counting agents working right now | `?pane=crew&item=critic` |
| **The brain** (beliefs, calls, learnings, docs, memory) | 1 click (`k`), plus 4 in-place renderings you never navigate to | a permanent rail tile counting unreviewed memory candidates and expiring beliefs | `?pane=brain&pview=beliefs&item=<id>` |
| **The graph** | 2 clicks (`k` → Map) | the "see the chain" affordance on every belief, citation and receipt | `/$ws/$product/map?focus=spec:SPEC-52&depth=2` |
| **Settings** (5 groups, 16 sections) | 1 click to the overlay, 2 to any section | a gear in the fixed TopBar position every product on earth puts it | `?config=agents&section=autonomy` |
| **Admin** (9 surfaces) | 3 clicks, deliberately | a gated group in the config overlay; absent entirely for non-admins | `?config=admin&section=pricing` |

**The distinction the last rebuild missed: hidden is not a function of depth. It is a function of
silence.** A left-rail row that never changes is silent. A palette entry nobody types is silent. A
right-edge tile that says "3 waiting · 2 working · 1 room on watch" is louder than a rail row could
ever be, and it costs one region of the shell instead of a whole navigation model.

---

## 11. STILL HOMELESS (honest list)

Five things this architecture does not fully home. Each has a proposed resolution, none is
pretended away.

| # | Homeless | Why it falls out | Proposed resolution (not yet ruled) |
| --- | --- | --- | --- |
| H1 | **The workspace-level view.** A workspace with 3 products has a *switcher* and no *surface*. There is no answer to "what is happening across all my products" and no cross-product Brain. B caught this by making Mind workspace-scoped, and paid for it with a scope discontinuity. | one destination, product-scoped | a **scope toggle** on the Brain, Record and Crew panes ("this product / all products"), defaulting to product. The Brain genuinely should compound across products; the Spine genuinely should not. The *list* of products stays in Settings → Workspace → Products. Decide before P2, because the rail counts must know their scope. |
| H2 | **Cross-product search.** The palette is product-scoped in current code. | same root cause | the same scope toggle inside `⌘K`. Cheap, but it must be built, not assumed. |
| H3 | **A notification archive.** `AttentionBell`'s query lands in the tray's Heads up section, which shows current notices. Anything older has no browsable home. | the tray is a queue, not a record | an "Earlier" filter on the Heads up section, backed by the same query with a date range. Low stakes, but name it or it becomes the next orphan. |
| H4 | **Share-control placement.** `/p/$slug`, `/d/$slug`, `/t/$slug` and `/proof` exist and are minted from somewhere. This document homes the *reading* of each entity but never fully specifies where the mint-a-share-link control lives on every kind. | share is cross-cutting like receipts, and was not given a spine | make it a fifth cross-cutting spine (§5.5): a kebab on every shareable artifact card and on every workbench child header, one component, one `?share=` peel. |
| H5 | **The Deck's only doors are `⌘K` and the empty composer.** A user who never presses `⌘K` and never empties the composer never sees the full inventory of what the product can do. The seven journey cards on first light are a subset. | the Deck is grafted from a palette-first design into a room-first one | acceptable **only** because nothing in the Deck is uniquely reachable through it. But add one non-palette door: a quiet "Everything Supaprod can do" link in the first-light canvas and in the Composer's overflow. Then it is a catalogue, not a hiding place. |

---

## 12. THE REAL RISKS

| # | Risk | Why it is real | Mitigation |
| --- | --- | --- | --- |
| R1 | **The rail's counts are seven live queries on every room render.** Cloudflare Workers have a subrequest budget, and seven polling queries plus the room's own loaders will show up as jank and cost. | the counts are the entire thesis of the winning design; if they are slow or stale the rail degrades into seven silent glyphs, i.e. the 10-rail failure at 48px | **one batched `getRailCounts` server fn**, one query key, 60s stale time, optimistic decrement on gate decisions, and a skeleton that never shows a wrong number. This is a P2 gate, not a P9 cleanup. |
| R2 | **The zero-count rail is the original disease.** A tile that reads `0` forever is exactly a rail row that never changes. | the mechanism's power is entirely in the counts being meaningful | the zero-count law (§2.2): never a silent glyph; a hairline dot plus last-event age, or the tile's one-line invitation. Verify with a genuinely empty seeded workspace before P2 ships. |
| R3 | **One route absorbing 7 faces + 7 panes + 5 children.** `faces.tsx` is already 102KB. The room risks becoming a 5000-line surface and a single enormous bundle. | this is the predictable failure mode of one-destination IAs | hard CI file-size gate; lazy chunk per face and per pane; the room route itself must stay a composition shell that owns no rendering. Settings' 3433 lines must never be in the room's initial chunk. |
| R4 | **Twelve orthogonal search params, all combinations legal.** `validateSearch` correctness, browser-back semantics, and Escape layering are each easy to get subtly wrong, and the bugs are the "if I click this, what happens" complaint returning in a new form. | orthogonality is the design's mechanical promise; a leaky param is a broken promise | one owner for the Escape stack (lifted from `RoomDetail.tsx:209-226`), one URL builder (`room-url.ts`, no string concatenation anywhere), and an explicit back-button matrix test in P9. |
| R5 | **P4 is a backend phase in the middle of a UI rebuild, and it is a hard gate.** Extending two enums, adding six write paths and backfilling lineage is real work with real migration risk, and every visible payoff (§5.6, §5.7, Beliefs) sits behind it. | the temptation to ship the pretty phases first and defer P4 is enormous, and deferring it produces a beautiful room where nothing connects - the exact complaint | keep P4 before P5. If it slips, the faces still ship, but Beliefs, the closure links and the in-place Brain renderings must **not** ship as stubs. Empty is honest; fake is not. |
| R6 | **Deleting `/today` removes the only surface the founder's demos, screenshots and recorded videos know.** P3 flips the landing before P5 migrates the faces, so there is a window where the room is the landing and several stages are doors to old routes. | this window is deliberate (depth-first ordering) but it is a real degraded period | the unmigrated-face door must be a first-class `WarmSlot` with the stage's own words, not a redirect notice. And re-record the demo after P5, not before. |
| R7 | **`?config=` overlays a still-mounted room.** 3433 lines of settings render while the room's queries stay live. | memory pressure and duplicate polling on lower-end machines | suspend the room's polling (not its mount) while `?config=` is open; the room's state is preserved, its network is not. |
| R8 | **Admin at 3 clicks behind a gear and a role gate.** Operators will complain, loudly, in week one. | it is a deliberate friction choice and deliberate choices are the ones that get relitigated | hold the line, and make every `/admin/*` bookmark resolve in one hop forever. If it still hurts, the escape valve is a pinned palette entry, never a nav row. |
| R9 | **`surface-registry.ts` has 91 `planned` markers today.** Turning the "no planned" assertion on at P9 will surface dozens of capabilities whose stated home was aspirational. | the registry has been documenting intent, not truth, so its current green is not evidence of anything | run the assertion in report-only mode from P0 so the real number is known at the start, not discovered at the end. |
| R10 | **The Spine's two modes could read as two Spines.** If the `PRODUCT` / `RUN` label is subtle, users will think the product regressed when a run dims five stages. | the mode switch is the graft that resolves a conflation; a poorly-signalled fix is worse than the conflation | the mode label is mono, always present, always clickable to return to product mode, and switching modes animates rather than cuts. Test it with someone who has two runs in flight. |
| R11 | **One-room means no surface for a customer with many products.** H1 is a risk as well as a gap: it will surface as a complaint the moment a real customer has three products, which is plausibly before September. | the design optimizes for the single-product PM, which is the right first user and not the only one | rule on H1's scope toggle before P2 rather than after launch. |

---

## 13. ONE PARAGRAPH FOR THE FOUNDER

You sign in and you are in the room for the product you were last in, always, at the same address
every time. Across the top is where you are. Down the middle-left is what is going on and what it
wants from you. In the middle is the work. Along the right edge, always, are seven tiles with live
numbers on them: what needs your call, what we know, what happened, what we made, what we said, who
is working, how it is running. Nothing is behind a menu you have to remember. The seven stages are
drawn once, as state, so a partial journey looks like a partial journey and the whole loop looks
like the whole loop, on the same drawing. Every machine action leaves a receipt with an agent's name
on it, and every receipt is a door to the thing before it and the thing after it. When the machine
needs you, one ember appears and that is your entire job. When something finishes, one line offers
the next move. To change how it behaves you press the gear, and the room stays behind it so you can
see what you changed. There is one place, seven faces, seven tiles, one overlay, five workbenches,
and a link grammar you learn once: backward peels, forward moves.
