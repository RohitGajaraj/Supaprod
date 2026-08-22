# The surfaces that are not stations: a redesign

> _Created: 2026-08-22 · Last updated: 2026-08-22_

Direction: [`../planning/initiatives/agent-first-platform.md`](../planning/initiatives/agent-first-platform.md).
Contract: [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md).
Standing brief and review log: [`agent-first-surface-brief.md`](./agent-first-surface-brief.md).

## What this is, and why it exists

The platform initiative covers the seven stations in depth and gives every other surface about
ten lines each — a diagnosis, not a design. This document is the design for everything else:
navigation, workspace and products, Brain, Guardrails, Settings, notifications, integrations,
and the flows that belong to no single surface.

**It is a design, not an audit.** Every surface below gets four things: what it costs a person
today in numbers, what it should become and by which of *remove · merge · contextualize ·
agent-enable*, what must not be lost, and what an agent should be able to read or do there.

### How to read it

- **Every claim carries a `file:line` or a query.** Where a number came from the database it is
  labelled as measured, with the date.
- **Demo is split from real on `workspaces.is_sample`.** 21 workspaces exist; 12 are samples and
  **9 are real**. Every "real" figure below is scoped to those 9.
- **`signals.is_sample` is not usable for this and must not be used.** Measured 2026-08-22: 1,341
  signals sit in sample workspaces flagged `is_sample = false`, and 20 sit in real workspaces
  flagged `is_sample = true`. The two flags agree on **zero** rows. Scope on the workspace.

### The rules this design obeys

- **Ratchet law 1** ([`DESIGN-SYSTEM.md:104`](./DESIGN-SYSTEM.md)) forbids *"hiding information,
  dropping a state"* as an answer. A proposal that gets simpler by showing less is refused, and
  three proposals below deliberately add states rather than remove them.
- **The Engine-Room doctrine** ([`../conventions/engine-room-doctrine.md`](../conventions/engine-room-doctrine.md))
  keeps depth reachable on demand and never in the way. One door, not many; name the outcome,
  not the mechanism.
- **One board.** Status lives in `docs/planning/SOURCE-OF-TRUTH.md`. Nothing here is a status list.
- **Today is not a dashboard** ([`../conventions/home-and-today-ia.md:12`](../conventions/home-and-today-ia.md)).
- **Workspace and product management is inline, never a dedicated route**
  ([`../conventions/inline-management.md`](../conventions/inline-management.md)).
- **A skipped station is a decision on the record with a reason, never a silent omission.**

---

## The size of the thing being redesigned

Measured 2026-08-22 by reading the source.

| Surface | Places to be | Controls a person can meet | Writes |
| --- | --- | --- | --- |
| Settings (`_authenticated.settings.tsx`, 2,907 lines) | 16 sections in 4 groups | **161** | ~56 |
| Guardrails / Engine Room (`_authenticated.engine-room.tsx`, 619 lines) | 4 rooms, **23** tabs | **~124** | 45 mutation sites |
| Brain (`_authenticated.brain.tsx`, 1,824 lines) | 5 tabs, 10 legacy ids folding in | **~44** at rest, ~90 with drills | 17 write paths |
| **Total** | **44 named places** | **~329** | — |

Navigation on top of that: the rail draws **4** rows plus **4** unlabelled foot icons
(`src/components/shell/AppFrame.tsx:314-383`, foot at `:1909-2010`), while `PRIMARY_NAV` declares
**12** destinations (`src/lib/nav-model.ts:230`) and the keyboard declares **40** keys — 13
navigation chords (`nav-model.ts:323-360`), 4 global (`src/lib/key-model.ts:234`), 23
surface-local across 9 surfaces (`key-model.ts:81`).

Of 113 route files: **60 are real surfaces, 49 are redirect stubs, 4 are layouts.**

None of this is the problem on its own. The Engine Room's 23 tabs are 23 real questions with 23
real tables behind them, correctly named for outcomes and correctly kept behind one door. The
problem is what the next two sections describe.

---

## The two facts that drive this redesign

Both were named in the platform initiative. Both are re-verified here against the live database
on 2026-08-22, and both turn out to be worse and more interesting than recorded.

### Fact 1 — the same absent row means four different things

`user_notification_preferences` has no default-row trigger and no seeding migration
(`supabase/migrations/20260620020000_user_notification_preferences.sql` — column defaults only,
no `INSERT`, no trigger; the seven later migrations touching the table add columns and never a
row). Opening the pane does not create one either: `getNotificationPreferences` is a pure
`SELECT` (`src/lib/notifications.functions.ts:225-229`) and the only `upsert` is behind a Save
button that is `disabled` unless a control was actually changed
(`src/components/settings/NotificationsSection.tsx:276`, dirty flag at `:143`).

**Measured:** 16 users, **1** preferences row. That row belongs to `demo@redcadence.app`.

Four pieces of code read that absent row and three of them disagree with the fourth:

| Reader | What an absent row means | Line |
| --- | --- | --- |
| The Settings pane's own display | **all on**, digests daily, every category | `notifications.functions.ts:232-249` |
| The in-app feed | **on** (`?? true`) | `notifications.functions.ts:70-73` |
| Instant email | **on** (`if (!prefs) return true`) | `notifications.functions.ts:375` |
| The digest job | **never**, the user is not in the scan at all | `notifications.functions.ts:680-686` |

So the pane tells 15 of 16 users that all four digest categories are on — its headline literally
reads *"4 of the four things that can interrupt you currently do"*
(`NotificationsSection.tsx:199`) — and those 15 will never receive a digest. The only way to make
the displayed state true is to switch something off and back on.

This is the clearest case in the product of a surface whose **absence** is invisible. Nothing is
broken, nothing errors, nothing is missing from any screen. The screen is confidently wrong.

Three things compound it, all verified:

- **The window is burned before the send.** `generateDigest` stamps `last_digest_sent_at` at
  `notifications.functions.ts:583-586`, *above* the empty-check at `:588` and the `sendEmail` at
  `:606`. An empty digest, a missing key or a bounce all move the clock 20 hours forward.
- **Quiet hours run on a timezone nobody has set.** The gate reads `profile.timezone || "UTC"`
  and working hours 9-18 (`:777-780`). Measured: of 16 profiles, **0** have moved working hours
  off the default and **0** have set a timezone. For a user in IST that gate means "quiet" from
  20:30 to 14:30 local.
- **One channel of the three does not exist.** `getNotifications` — the whole in-app feed,
  `notifications.functions.ts:55-200` — has **zero callers anywhere in `src/`**. The four
  `in_app_*` columns are written by the pane and read only by a function nothing calls.

### Fact 2 — nothing is feeding the loop, and the product is feeding itself

The loop is running on real data. On 2026-08-22 it produced 17 signals. **All 17 have
`source: 'agent'`.** On 2026-08-21 it produced 222, of which 209 were `agent`.

The sharper measurement is `signals.source_kind`, which unlike the free-text `source` column
(61 distinct values) is a controlled vocabulary. Scoped to the 9 real workspaces, across the
product's entire history:

| `source_kind` | Rows | Most recent |
| --- | --- | --- |
| `manual` | 24 | **2026-08-22** |
| *(null)* | 13 | 2026-07-19 |
| `pull_connector` | 6 | 2026-07-09 |
| `web_scout` | 5 | 2026-07-01 |
| `mcp_source` | 1 | 2026-07-09 |

**Twelve signals have ever arrived from an external source into a real workspace, and the most
recent was 44 days ago.** Everything since is the product writing into its own notebook.

The connector surface is not a settings page. It is the thing that decides whether the product
has anything to think about. Its current state, measured:

- `connections`: **5** rows, all `connected` — github ×2, linear, salesforce, slack — last
  verified between 2026-07-09 and 2026-07-25. None has delivered a signal since.
- `user_integrations`: **5** rows, **4** of them `disconnected`.
- `scout_targets`: **0**. `sync_mappings`: **0**. `user_calendar_connections`: **0**.
- `scout_runs`: **98**, last on 2026-07-25. **21** recorded `outcome = 'changed'` and **none of
  the 98 produced a signal** — `signal_id` is null on every row.
- `mcp_connections`: all **4** rows carry `last_error = "MCP server error: 401"`, the most recent
  stamped **today, 2026-08-22 13:20**, six calls today. That column is written at
  `src/lib/connectors/mcp/ingest.server.ts:129` and the only read of the table
  (`:101-105`) selects `calls_today, calls_window_started_at`. **`last_error` is write-only.**
  Nothing, admin included, reports it.

And then the finding that makes this a design problem rather than a sales problem:

- `src/routes/api/public/ingest-signals.ts` accepts any POST carrying a workspace ingest token
  and turns it into signals. No OAuth, no connector build, no founder gate. Zapier, a form, a
  shell script, anything.
- **`ingest_tokens` has 0 rows.**
- The control that issues one lives on `/sync`, which is linked from exactly three places, one of
  them a deliberately quiet link inside a Settings pane
  (`src/components/connections/AccountConnectionsSection.tsx:816`, styled `LINK_AS_QUIET_CONTROL`).

**The product's cheapest path to real data is one route hop away from every surface that would
motivate it, and it has never been used once.** That is an information-architecture failure with
a measurable output, and it is the highest-leverage fix in this document.

---

## Navigation and the shell

### What it costs today

- The rail draws **4** rows — Today · Runs · Brain · Guardrails (`AppFrame.tsx:314-383`) — plus
  **4** unlabelled foot icons (board, theme, settings gear, keyboard sheet, `:1909-2010`).
- `PRIMARY_NAV` declares **12** destinations (`nav-model.ts:230`). **8 of them have no rail row**
  — Discover, Decide, Plan, Design, Build, Ship, Learn, Agents. They are reachable only by chord,
  by the station strip, or from inside Settings.
- **13 navigation chords** exist for those 12 destinations plus Settings (`nav-model.ts:323-360`).
  A person can therefore learn a key for a door that is not drawn.
- **49 redirect stubs.** The target table `src/lib/legacy-redirects.ts:127` holds 38 entries and
  declares itself the single source of truth at `:1-6`, but **only 3 of the 49 stubs import it**;
  46 hard-code their own target.
- **That drift has already happened twice.** `_authenticated.budgets.tsx:6` and
  `_authenticated.analytics.tsx:6` both redirect to a bare `{ room: "spend" }`, dropping the
  `view` their own table declares at `legacy-redirects.ts:192-193`. `/analytics` lands on "Over
  time" instead of "Full usage".
- **A third redirect lands somewhere that cannot answer.** `/meetings` and `/calendar` forward to
  `/brain?tab=calendar`, which `LEGACY_TABS` folds to `decisions`
  (`_authenticated.brain.tsx:487-498`) — the decision list, which renders no meeting.
  Acknowledged in the source at `:1191-1198`.
- No breadcrumb exists. Scope lives in `localStorage` only (`src/hooks/use-workspace.tsx:176`,
  `:190`), never in the URL, so a link cannot carry it.

### What it should become

**The 12-row collapse already shipped and is not re-proposed.** Three changes on top of it.

**1. Generate the stubs from the table — `merge`.** The target is written twice, and it has
already drifted twice. Each stub calls one `redirectFor(path)` helper reading
`legacy-redirects.ts`, and `legacy-redirects.test.ts` asserts against the stubs rather than
against the table it was generated from. This is a mechanical change to 46 small files that makes
the whole defect class impossible.

**2. Reveal the eight undrawn destinations at the moment the chord is armed — `contextualize`.**
`GotoShortcuts` already stamps `data-chord="armed"` on `<html>` and reveals keycaps on visible
doors (`src/components/supaprod/GotoShortcuts.tsx:88`). Extend that stamp to render the eight
destinations that have a chord and no door, as a transient list, for the 2,000 ms the chord
window is open (`:55`). Nothing new is learned and nothing is added to the resting screen; a
capability that already exists becomes visible exactly when it is relevant.

**3. Put scope in the search params, not in the route — `contextualize`.** The product-scoped URL
space was removed for a good reason: `$workspaceSlug.$productSlug` swallowed every unmatched
two-segment URL and made not-found unreachable
(`_authenticated.$workspaceSlug.$productSlug.tsx:3-29`). Do not restore it. Instead let
scope-sensitive surfaces accept `?ws=` and `?product=`, defaulting to `localStorage` when absent.
A query contract cannot swallow a route.

### What must not be lost

All 49 addresses. All 13 chords. All 8 undrawn destinations — they are reachable today and the
reveal makes them more reachable, not less. The not-found route, which is why the two-segment
route stays retired.

### The agent's side

Navigation is a human concern and needs no tool. But the **station path** is not: which stations
a piece of work visited, which it skipped, and the reason recorded for each skip. That is a
founder ruling with no external reader. `stage_events` holds it and no tool exposes it. Add
`get_work_path(work_id)` returning the stations visited and skipped with reasons, so "a skipped
station is a decision on the record" becomes checkable from outside the product rather than
asserted inside it.

---

## Workspace and products

### What it costs today

The management surface is inline, as the convention requires, and most of it is not wired.

| Operation | Server function | UI caller | State |
| --- | --- | --- | --- |
| Create workspace | raw insert, `src/lib/onboarding.functions.ts:77`, name hard-coded `"My Workspace"` | **none** | no UI anywhere |
| Rename workspace | `src/lib/workspaces.functions.ts:9` | **none** | dead, 0 call sites |
| Delete workspace | `workspaces.functions.ts:23` | **none** | dead, 0 call sites |
| Leave workspace | `workspaces.functions.ts:32` | **none** | dead, 0 call sites |
| Transfer ownership | `workspaces.functions.ts:58` | `MembersCard.tsx:161` | wired |
| Create product | `src/lib/projects.functions.ts:167` | `ProductsTab.tsx:194`, `:257` | wired |
| Archive / restore / export / delete product | `projects.functions.ts:270`, `:334`, `:206` | `ProductsTab.tsx:241-274` | wired |
| **Rename product** | `projects.functions.ts:233` | **none** | dead, 0 call sites |
| **Move product between workspaces** | `projects.functions.ts:249` | **none** | dead, 0 call sites |

**The evidence that this matters:** 7 of the 9 real workspaces are named "My Workspace" or "My
workspace". Nobody has ever renamed one because nobody can.

`ScopeMenu.tsx:43-51` states that *"Rename, transfer, delete and leave … live on Settings, with
the confirmation and the consequence spelled out, and this menu is the door to them"*, and its
link goes to `?section=workspace` (`:174-181`). That pane contains **transfer only**
(`MembersCard.tsx:299-305`). Three of the four named operations do not exist.

The switcher also hides itself: the workspace row renders only when `workspaces.length > 1`
(`ScopeMenu.tsx:125`) and the product row only when `products.length > 1` (`:152`, via
`use-workspace.tsx:210`). With one of each the entire scope concept is invisible.

There are **no subprojects**. `projects` has no `parent_id`
(`src/integrations/supabase/types.ts:6265`); the hierarchy is a flat two levels,
accounts → workspaces → projects. The table is `projects`, the word on screen is "product", and
the RPCs are `move_product` and `product_in_workspace`.

### What it should become

**1. Wire rename, in the menu that already promises it — `agent-enable` the claim by making it
true.** Both server functions exist and are tested by nothing. Rename belongs in the ScopeMenu
row itself, which is the inline placement the convention asks for, and it turns a false statement
in the code into a true one. Product rename goes on the product row in `ProductsTab`, beside the
five actions already there.

**2. Contextualize the Products pane out of the index until it has content.** A workspace with
one product does not need a pane offering archive, restore, export and delete on its only
product. Move "New product" into the ScopeMenu as one row; let the Products pane draw a door in
Settings once a second product exists or a mission has been attached to one.
**Why the capability survives:** the create action moves rather than disappears, the pane keeps
its address so `?section=products` still answers, and the other five actions are meaningless in
the state where the door is hidden.

**3. Do not build a workspace-create UI yet, and say so.** One workspace per account is the
current shape and nothing measured argues against it. This is listed as a deliberate non-change
so the next reader does not re-derive it as a gap.

### What must not be lost

The tenancy spine — account → workspace → product, with RLS keyed on membership in the database
rather than in application code. That is what makes autonomy safe here and it is not changing.
The soft-delete column and the admin-side equivalents at `_authenticated.admin.workspaces.tsx`
also stay: they are the recovery path.

### The agent's side

One tool exists, `list_workspaces` (`src/lib/mcp/tools/list_workspaces.ts:5`), returning `id,
name, plan_tier, created_at` — and it lives on the *other* MCP server, the auto-generated one at
`/mcp`, which shares nothing with the 18 loop tools at `/api/mcp`. **No tool reads products at
all.** An agent asked "what are we working on" cannot answer.

Add `list_products(workspace_id)`, and move `list_workspaces` onto the same server as the loop
tools. Two servers with two auth models and two different `search_signals` schemas is the real
defect here; the missing product tool is a symptom of it.

---

## Brain

### What it costs today

Five tabs — Decisions · **Outcomes** · Artifacts · **Written** · Graph
(`_authenticated.brain.tsx:468-469`, labels `:502-513`), with 10 legacy ids folding in
(`:476-498`). Two labels differ from their ids on purpose, which is the doctrine working.

Before a person reaches any tab, the page renders five regions above the tab strip and up to ~14
controls: `CrewWorking` (`:1363`), `RecordHead` (`:1364`), `RetentionLine` (`:1390`),
`RecordSpeaks` (`:1421-1446`), guidance rows (`:1503-1523`), `StandingRules` (`:1535`), a graph
preview with four controls (`:1573-1616`), and a substrate disclosure with four count cells
(`:1770-1806`).

Controls at rest, per tab: decisions **7**, outcomes **9**, artifacts **10**, written **12**,
graph **~6** — about **44**, or **~90** counting every expandable sub-state and drill.

The route itself is clean: 5 queries, **0 mutations**. All 17 write paths live in lazily-loaded
panels. One of them fires on a read — opening any decision drill inserts into `learning_citations`
(`src/lib/decision-judgment.functions.ts:303-310`).

**Two defects worth designing around.**

*The scope is ambiguous, and it is live.* `DecisionsPanel` builds its query input without
`workspaceId` (`src/components/knowledge/DecisionsPanel.tsx:195-198`), and
`listDecisions` only filters when it is present (`src/lib/decisions.functions.ts:170`). So the
Decisions tab reads RLS-wide across every workspace the user belongs to, while the counts in the
head above it were deliberately workspace-scoped in the 2026-08-10 pass
(`_authenticated.brain.tsx:1071-1097`). **Measured: 4 of 16 users have decisions in two
workspaces** — including the demo account, which is what a visitor is shown. For those four the
header and the list disagree.

*The number the whole forecast argument rests on is computed and thrown away.*
`insights.brier_score` is written at `src/lib/brain/calibrate-insights.server.ts:199` and read by
**nothing** in `src/`. Measured: 136 insights, 35 resolved, **28 carrying a calibration score
that no surface renders.**

**What Brain actually holds for real users**, scoped to the 9 real workspaces:

| Table | Real rows | All rows |
| --- | --- | --- |
| `decisions` | 60 | 295 |
| `agent_memory` | 67 | 1,487 |
| `insights` | 8 | 136 |
| `house_rules` | 4 | 17 |
| `learnings` | **0** | 133 |
| `rag_chunks` | **0** | 17 |

The Outcomes tab is empty for every real user, and it is the tab the product's central claim
rests on.

### What it should become

**1. Merge Decisions and Outcomes into one tab — `merge`.** They are one object at two moments:
a decision carrying a forecast, and the same decision once it settled. Today they are two doors
and the second opens on an empty room for every real user. One list with a verdict column is how
anyone reads this anyway.
**Why nothing is lost:** every row survives, both drill panels keep their addresses (`?decision=`
and `?learning=` both still answer), and the memory review queue becomes a filter on the same
list rather than a separate composer — a candidate memory is a row awaiting a verdict, which is
exactly the shape already there.

**2. Render the calibration number on the record head — `remove` a gap rather than a feature.**
It is already computed on 28 rows, it is the one number that makes the forecast argument visible
to the person paying for it, and no surface shows it. It belongs as a sentence with its count on
the head, not a score badge: *of the N forecasts that have come due, here is how close they were.*
**This is the highest-value single change in this document**, because everything else here makes
the product lighter and this one makes its central claim legible.

**3. Pass `workspaceId` — fix the scope, do not hide it.** Then the head and the list agree. If a
cross-workspace read turns out to be wanted, it becomes a deliberate filter with a label, not an
accident that four users are already living with.

**4. Give `?tab=calendar` a destination that can answer — `remove`.** A redirect that lands on a
surface unable to render the thing you asked for is worse than a not-found, because it looks like
an answer. Point `/meetings` and `/calendar` at Today, where meetings render.

### What must not be lost

Two patterns on this surface are the best examples in the product of ratchet law 1 applied
correctly, and they should be copied outward rather than touched:

- **`recordIsBlank()`** (`_authenticated.brain.tsx:1004-1025`) requires every read to have
  *resolved* before it will declare the record empty — `null` is unknown, not empty (`:1021`).
  That distinction is the difference between "nothing has happened yet" and "we could not read",
  and most surfaces in this product get it wrong.
- **The substrate disclosure suppresses zeros rather than printing them** (`:1225`), and when
  everything is zero it renders a `NeedsSetup` prompt instead of a grid of noughts
  (`:1791-1806`).

Also kept: all five tabs' distinct reads, the 10 legacy ids, and the graph's replay-over-time
control — which is the only place in the product where the record's growth is visible as a fact
rather than a claim.

### The agent's side

Brain is the surface an agent should read most and it exposes the least. Two of its panels have a
tool — `get_governing_decision` (`src/lib/mcp-protocol.ts:160`) and `get_contradiction_history`
(`:173`) — both reading `decisions` and `artifact_lineage` only. `house_rules`, `agent_memory`,
`memory_recall_log`, `brief_items` and `artifact_versions` have **no agent-facing tool at all**.

Add three reads:

- `get_standing_rules(workspace_id)` — what am I bound by.
- `search_memory(query)` — what do we already know about this.
- `get_brief(workspace_id)` — what are we trying to do.

These are not new capability. They are exactly what `loop.server.ts:756` already injects into
every internal agent's system prompt. An external agent is currently asked to do the work without
the context the internal ones get by default; publishing these three closes that gap and costs no
new machinery.

---

## Guardrails (the Engine Room)

### What it costs today

Four rooms and **23 tabs**, defined in one place (`src/lib/engine-room-glance.ts:151`):

| Room | Question | Tabs |
| --- | --- | --- |
| Spend | *What is this costing me?* | 4 |
| Quality | *Is the machine still good?* | **8** |
| Safety | *What is it allowed to do?* | 6 |
| Record | *What exactly happened?* | 5 |

Controls: overview **9**, spend **~20**, quality **~40**, safety **~29**, record **~26** —
about **124** including the chassis, across **45** mutation sites. Guardrail rules, budgets,
prompt versions, eval suites, drift baselines, event subscriptions, the workspace kill switch,
approvals and release rollbacks are all written from inside this door.

**Only one room can say "not set up."** `unconfigured` is assigned at exactly one site
(`engine-room-glance.ts:821`) and only for Safety, keyed on zero *enabled* rules. Spend, Quality
and Record report `healthy` when they have never been configured at all — Record is hardcoded
`"healthy"` at `:1013`. This is the same failure Safety already fixed and documented at
`:24-37`: seventeen of twenty-one workspaces had zero guardrail rules and the overview counted
them toward "All four rooms are clear."

**Roughly 800 lines are dead:** `EngineRoomGlance` (exported, never mounted,
`EngineRoomSurface.tsx:232`), `EngineRoomContainer` (`:32`, zero references), `RoomCard.tsx` (228
lines, imported only by its own test), `ConnectionStrip.tsx` (288 lines, zero references), and
the `RoomDetail` component itself (`RoomDetail.tsx:187` — only its helpers are imported).

### What it should become

**1. Give all four rooms the third state — `contextualize`, and it makes the surface bigger.**
The `unconfigured` state exists, is right, and is implemented once. A Record room that has never
sealed anything reporting "healthy" is exactly the error Safety already corrected: the absence of
trouble read as evidence of health. Spend with no cap, Quality with no suite, Record with nothing
sealed — each should say so, using the same `unset` pattern from `:820` applied at `:598`, `:741`
and `:1013`. **Ratchet law 1 protects states; this adds three.**

**2. Land the glance card's action on the tab that explains the verdict — `contextualize`.**
The card already computes a next step and knows why a room is on watch
(`engine-room-glance.ts:845-856`). Today clicking it lands on the room's front tab, which is
arbitrary. Routing it to the tab that produced the verdict costs nothing — the data is computed
and discarded.

**3. Fix the two drifted redirects.** `_authenticated.budgets.tsx:6` and
`_authenticated.analytics.tsx:6` drop the `view` their table declares. Covered by the navigation
change above; named here because this is where the damage lands.

**4. Delete the five dead exports.** ~800 lines. **Why nothing is lost:** nothing renders them,
and one of them (`EngineRoomGlance`) still contains a "While you worked" strip the route's own
header records as deliberately killed (`_authenticated.engine-room.tsx:33-38`) — so it is not
merely dead, it is a live contradiction of a ruling.

### What must not be lost — the cut I refuse

**The 23 tabs do not merge.** Every one is a distinct question with a distinct table behind it.
They are named for outcomes, not mechanisms — *"Is it me or you?"*, *"Is it slipping?"*, *"Its
instructions"*, *"What is allowed"* — which is the doctrine working as designed. They are already
behind one door, with a four-card glance whose whole job is to route a suspicion to the right one.

Compressing eight quality tabs into three would be getting simpler by showing less, which ratchet
law 1 forbids and which the Engine-Room doctrine explicitly does not ask for: the doctrine says
depth is reachable on demand and never in the way, and 23 tabs behind a glance card satisfy both
halves. The learning burden here is real but it is paid by operators who came looking, not by
every visitor.

### The agent's side

**Zero.** No tool reads spend, budgets, guardrail rules, eval suites, drift, traces or incidents.
An agent cannot ask what rules bind it, what it has spent, or whether it is about to hit a cap.

This is the most consequential gap in the document. The product's safety argument is that policy
is set in advance and enforced at the chokepoint on every call — and the thing being governed
cannot read its own boundary. Two read tools close it:

- `get_my_boundary()` — the rules, caps and tool modes that apply to this token.
- `get_my_spend()` — what this token has cost, against what limit.

Neither needs a new gate. A token can already observe everything these return by being subject to
it; the only thing being added is the ability to read it before acting rather than discovering it
by being blocked.

---

## Settings

### What it costs today

**161 distinct controls** across **16 sections** in **4 groups**, of which **~56** write to a
server. Twelve sections draw a door; four are address-only (`credits` and `sync` fold into
another pane, `health` and `memory` draw no door and have no fold —
`src/lib/settings-sections.ts:362`, `:376`, `:395`, `:496`).

| Section | Controls | Writes | Section | Controls | Writes |
| --- | --- | --- | --- | --- | --- |
| billing (+credits) | 32 | ~15 | ai | 14 | 5 |
| workspace | 21 | 6 | brand | 12 | 3 |
| notifications | 18 | 1 | products | 8 | 5 |
| connections (+drill) | 18 | 8 | interop | 8 | 2 |
| autonomy | 14 | 6 | staff | 3 | **0** |
| profile | 9 | 1 | data | 2 | 2 |
| | | | health, memory | 1 each | **0** |

The information architecture itself is good and is the most carefully argued file in the repo
(`settings-sections.ts` opens with 130 lines of reasoning for the grouping, the ordering and the
landing pane). This section does not re-litigate it. What follows is what the IA cannot fix.

**Two panes exist only to apologise for themselves.** `memory` renders one sentence and one
button saying memory moved to Brain (`_authenticated.settings.tsx:1381-1394`). `health` renders
one sentence and one button saying diagnostics moved to the Engine Room (`:1356-1379`) — and the
real `DiagnosticsSection` is imported at `:256` and never rendered, a dead import. Both already
draw no door. `settings-sections.ts:93-98` already calls the first one out: *"A pane that exists
to apologise for itself is dead weight; it should be a redirect."*

**Five settings are wired to nothing at one end or the other.**

| # | Setting | The problem | Line |
| --- | --- | --- | --- |
| 1 | Mission concurrency cap | shown as a "standing limit", is a hardcoded constant with no setter | `governance.functions.ts:464`, rendered `ControlsPanel.tsx:533` |
| 2 | Budget USD caps | Notifications offers a "Budget" category and the digest reads the caps, but the only editor is in the Engine Room | `notifications.functions.ts:126` vs `rooms/SpendRoom.tsx:162` |
| 3 | MCP write scopes | `issueMCPToken` accepts `scopes`; the pane sends only `workspace_id, slug, rate_limit_per_min`, so the 6 write tools are ungrantable from the UI | `mcp.functions.ts:83` vs `IntegrationsTab.tsx:126-132` |
| 4 | Avatar mark | 8-swatch picker whose only consumer is its own preview; `Avatar.tsx` is mounted nowhere | `_authenticated.settings.tsx:920-940`, admitted at `:885-902` |
| 5 | `profiles.role` | still in the update schema and the type, read by nothing; UI capture removed 2026-08-17 | `profile.functions.ts:30`, `:63` |

**Two panes under-report what they control.** `IntegrationsTab.tsx:56-68` lists **8** tool names
under "What a token can call". There are **18**. It is a hand-maintained literal rather than a
read of `MCP_READ_TOOL_NAMES` (`mcp-protocol.ts:208`), and it has drifted — it is missing four
read tools and all six write tools, and its subtitle still describes a retired `append_decision`
tool. The A2A agent card is a second external entry point with no mention on the pane at all.

**Working hours and timezone are settings nobody has ever changed that silently govern
delivery.** Measured: 0 of 16 profiles have moved either, and the digest's quiet-hours gate reads
both (`notifications.functions.ts:777-780`).

### What it should become

**1. Turn `memory` and `health` into redirects — `remove`.** Two panes, two dead imports, two
addresses that currently answer with an apology. **Why nothing is lost:** the addresses keep
answering; they just arrive somewhere useful instead of explaining that they cannot help. Delete
the dead `DiagnosticsSection` import at `:256`.

**2. Derive the "what a token can call" list — `remove` the hand-maintained copy.** Read
`MCP_READ_TOOL_NAMES` and the write registry, and mark the write tools as needing a scope. This
is the same defect as the redirect table: the truth written twice, one copy drifted.

**3. Grant scopes from the pane, or stop shipping the write tools — `agent-enable`.** Six
governed write tools exist, are double-gated, are tested, and cannot be granted from the UI.
Measured: 3 tokens have ever been issued, **all three revoked the same day, `last_used_at` null
on all three**. The pane should offer the scopes with their consequences spelled out. Until it
does, the write half of the machine door is unreachable by design accident rather than by policy.

**4. Retire the avatar picker and `profiles.role` — `remove`.** A control whose only effect is on
its own preview is not a setting. **Why nothing is lost:** nothing reads either, and the route's
own comment already says so.

**5. Move the budget caps editor's *door* into Settings, not the editor — `contextualize`.**
The caps belong in the Engine Room, where they are, beside the spend they govern. But
Notifications offers a Budget category and the digest quotes the cap, so the person configuring
alerts needs a way through. One door on the Notifications pane, not a second editor.

### What must not be lost

The four-group IA and every `?section=` address, including the folds. It is argued in detail, it
was arrived at by reversing an earlier ruling on measured evidence, and nothing here disturbs it.
The `staff` pane stays read-only — its header records the deliberate removal of the per-agent
tool-reach control (`_authenticated.settings.tsx:1399-1421`) and that removal was right; the
roster is a read, and `/crew` is where it is edited.

### The agent's side

**Zero tools.** No agent can read the brief, the autonomy boundary, what is connected, or what it
costs. `get_brief` is proposed under Brain and `get_my_boundary` under Guardrails; between them
they cover what an agent legitimately needs from this surface. Settings itself should stay
human-only for writes — an agent that can rewrite its own boundary is not governed.

---

## Notifications

### What it costs today

No table; the feed is computed on read from `agent_approvals`, `agent_runs`, `ai_budgets` and
`drift_incidents` (`notifications.functions.ts:17-24`). `/notifications` redirects to
`?section=notifications` (`_authenticated.notifications.tsx:9`).

The pane offers **18 controls** (`NotificationsSection.tsx`): a 4 × 3 grid of category × channel
buttons (`:210-224`), a frequency picker (`:232-242`), a stakeholder-update toggle and its
conditional audience picker (`:248-272`), Save (`:276`), and two localStorage-only toggles for
sound and haptics (`:289-311`).

Of the three channels, **one does not exist** (`getNotifications`, zero callers), and one
**reaches 1 of 16 users** (the digest). Only instant email works for everyone, and it works by
taking the opposite default branch from the digest.

Everything else is Fact 1 above.

### What it should become

**1. Put the default in the database — `remove` three of the four copies.** A `DEFAULT` on the
table plus a row seeded at user creation makes all four readers agree, and it makes the pane's
own headline true. This is the smallest change in the document and it fixes the most users.
*Alternative considered and rejected:* having `sendDueDigests` read `profiles` and left-join
preferences. It works, and it leaves the default written in four places, which is how this
happened.

**2. Stamp `last_digest_sent_at` after a successful send.** Move `:583-586` below the send and
write it only on success. A failed send should be retried on the next tick, which is what the
code's own comment already promises.

**3. Mount the in-app feed — `agent-enable` a channel that is already built.** Twelve toggles
where eight do something is worse than eight. There are two honest ways to close the gap and only
one of them is right. Deleting the `in_app_*` columns would quietly narrow what the product
promises. Mounting the feed costs nothing: it is 145 lines of working, tested
(`src/lib/notifications.test.ts`) code with no consumer, and Today is where it belongs. **This is
a mount, not a build.**

**4. Ask for the timezone at the moment it matters — `contextualize`.** Not a settings field that
0 of 16 people have filled. The first time a digest is due for a user with no timezone, send it
and ask in the mail: *we sent this at 9am UTC — when should we send it?* The job already resolves
the recipient's address; it can carry a signed link that sets the field in one click.

### What must not be lost

**The per-category granularity.** Four categories × three channels is not excessive. Approvals,
health, budget and drift are genuinely different urgencies, and someone who wants budget mail but
not drift mail is a real person with a real preference. The defect is that one channel is
fictional, not that there are three. Collapsing the grid to "email me: yes/no" would be the
lossy simplification this document exists to refuse.

Also kept: the quiet-hours gate itself, and its explicit carve-out that instant sends bypass it
(`notifications.functions.ts:622-626`) — a critical incident at 2am must still reach you.

### The agent's side

No tool, no route. An agent's only current way to reach a person is to write a row somewhere and
hope a surface renders it — which, for the in-app channel, nothing does.

Add `notify(kind, title, detail)` as a governed write tool, subject to the same per-category
preference every other sender obeys. It needs a scope and it needs a rate limit, because the
ability to interrupt a person is exactly the kind of power the write gate exists for.

---

## Integrations and connectors

### What it costs today

The catalog is good work: `src/lib/connectors/catalog.ts` derives one de-duplicated, categorised
list of 18-20 connectors across 10 categories from the registry, with a flow label and a resource
label each, and it exists specifically because the connectors were previously *"scattered across
three surfaces and re-rendered in three different shapes, with no grouping"* (`catalog.ts:1-15`).

That fix landed in the model and not in the addresses. The surface is still three places:

- Settings → Connectors (`?section=connections`) — the catalog and the account list.
- Settings → Agent access (`?section=interop`) — MCP token issuance.
- `/sync` (655 lines) — per-source binding **and** the workspace ingest token.

**`/integrations` redirects to `?section=interop`** (`_authenticated.integrations.tsx:12`). A
person typing that address to connect Slack lands on the machine-token pane.

Everything else is Fact 2 above: 5 connections that have delivered nothing in 44 days, 0 scout
targets, 98 scout runs that produced 0 signals, a 401 repeating today into a write-only column,
and an open ingest door with 0 tokens issued behind a quiet link.

### What it should become

**1. One address for "what feeds this workspace" — `merge`.** Connectors, bindings and the ingest
token are one errand. `settings-sections.ts:395` already declares `sync` as folding into
`connections`; the code does not yet do it. Complete the fold, and point `/integrations` at
`?section=connections` rather than `interop`.
**Why nothing is lost:** `/sync`'s three linkers keep working through the redirect, and the
Connectors pane gains the bindings it was already pointing at.

**2. Derive connector status from delivery, not from the handshake — `contextualize`.** Five rows
say `connected` and none has produced a signal in 44 days. "Connected" should mean *brought
something in on <date>*, and a source that has gone quiet should say *connected, nothing since
<date>*. Both facts are already in the database — `signals.source_kind` joined to the provider,
and `connections.last_verified_at`. **This adds a state rather than removing one**, and it is the
same correction the Safety room made when it learned to say "not set up".

**3. Surface `last_error` — `remove` the blindness.** One column, already written on every failed
call, currently invisible while a 401 repeats daily. It belongs on the connector row, and a
repeating one belongs in the Safety room as an incident. After Fact 1 this is the clearest case
in the product of an absence nobody can see.

**4. Give the ingest door a door — `contextualize`, and this is the promotion that matters.** The
workspace ingest token is the only way to get data in from something we have not built a
connector for, the OAuth connectors are founder-gated (`catalog.ts:1-15`), and it is currently
behind a quiet link on a route with three inbound edges. It belongs at the top of Connectors,
beside the catalog, named for what it does rather than what it is: *send us anything — a webhook,
a script, a Zap.* Measured, this is the difference between a workspace that can have data today
and one that cannot.

### What must not be lost

**The catalog's categorisation and its flow labels.** Eighteen connectors as a flat list was the
original defect; the catalog fixed it and a promotion must not flatten it again. The ingest token
goes *above* the categorised catalog, not instead of it.

Also kept: the OAuth-only rule for real connectors (Engine-Room doctrine, operating rule 4 — the
user never touches keys). The ingest token is not a counter-example: it is a token we issue, not
a credential they paste.

### The agent's side

No tool lists connections, their status, their scopes or their last delivery. An agent asked "why
do we have no data on X" cannot look — while `ingest_signal` already exists as a write tool, so
an agent can push a signal in but cannot see whether anything else is pushing.

Add `list_sources(workspace_id)` returning each source with its last delivery and its last error.
That single tool would have made today's repeating 401 visible to the first agent that asked.

---

## Cross-surface flows

The platform initiative's table covers the station-to-station flows. These are the ones that
belong to no station and are broken between the surfaces above.

| Flow | State | Where it breaks |
| --- | --- | --- |
| A connector fails → a person hears | **Open** | `last_error` written `connectors/mcp/ingest.server.ts:129`, read by nothing |
| The scout sees a change → a signal | **Open** | 21 `changed` runs, 0 with a `signal_id`; 0 targets to watch |
| A digest comes due → a person | **Open for 15 of 16** | no row exists; `notifications.functions.ts:680-686` |
| A forecast settles → the record head | **Open** | `brier_score` written `calibrate-insights.server.ts:199`, read by nothing |
| A room was never set up → the overview | **Half open** | only Safety can say it, `engine-room-glance.ts:821` |
| The chosen workspace → Brain's list | **Broken, live for 4 of 16** | `DecisionsPanel.tsx:195-198` |
| An agent needs its boundary → Guardrails | **Open** | no tool exists |

**Six of the seven are one shape: something is measured, written, and never read.** Four are
literally a column with a writer and no reader. That is the cheapest class of fix in this
document — no new capability, no new screen, no new vocabulary — and closing it would change more
about how the product feels than any of the structural work above.

It is also the class that will keep recurring, because nothing currently fails when a column
loses its last reader. The durable fix is a test, not a sweep: for the small set of columns the
product's claims rest on — `brier_score`, `last_error`, `signal_id` on a scout run,
`forecast_resolution` — assert that a reader exists.

---

## What I refused to cut, and why

Four things were candidates and survive deliberately.

1. **The Engine Room's 23 tabs.** Argued in full above. They are 23 real questions behind one
   door with a router in front of them. Merging them would be the lossy simplification ratchet
   law 1 forbids, and the doctrine asks for depth on demand, which this already is.
2. **The 4 × 3 notification grid.** The defect is that one channel is fictional, not that three
   channels is too many. Fix the channel.
3. **The 49 redirect stubs.** They are cheap, they keep saved links alive, and deleting them
   would break addresses for no gain. What gets fixed is that their targets are written twice.
4. **Brain's `recordIsBlank` and zero-suppression.** Not only kept — proposed as the pattern the
   other surfaces should copy.

And one non-change recorded so it is not re-derived: **one workspace per account.** Nothing
measured argues against it, and building a create flow before anyone has asked would be adding a
surface to solve a problem that has not appeared.

---

## Build order

Ordered by measured effect per unit of work, not by surface.

| # | Change | Surface | Why first |
| --- | --- | --- | --- |
| 1 | Default row for notification preferences | Notifications | Fixes 15 of 16 users; smallest diff in the document |
| 2 | Stamp the digest clock after a successful send | Notifications | Same file; prevents a silent 20-hour hole |
| 3 | Promote the ingest token into Connectors | Integrations | The only path to real data that is not founder-gated |
| 4 | Surface `last_error` on the connector row | Integrations | A 401 is repeating today and nobody can see it |
| 5 | Render the calibration number on the record head | Brain | Makes the central claim visible; already computed |
| 6 | Pass `workspaceId` in `DecisionsPanel` | Brain | A correctness bug live for 4 of 16 users |
| 7 | `unconfigured` for all four rooms | Guardrails | Three rooms currently report health they have not earned |
| 8 | Generate redirect stubs from the table | Navigation | Closes a defect class that has already drifted twice |
| 9 | `get_my_boundary` and `get_my_spend` | Guardrails | The governed cannot read their own boundary |
| 10 | Merge Decisions and Outcomes | Brain | Largest single reduction in places to be |

Items 1, 2, 4, 5 and 6 are each a handful of lines against code that already exists. They are
listed first because this document's own argument is that most of what is missing has already
been built and is simply not read.

## What would falsify this

- If `signals.source_kind` starts showing `pull_connector` rows in real workspaces at any
  meaningful rate, Fact 2 is stale and the integrations argument weakens.
- If a seeded default row does not change the digest count, the diagnosis in Fact 1 is wrong and
  the delivery path has a second gate nobody has found.
- If the Engine Room's 23 tabs turn out to be unreachable in practice — measurable as tab views
  per operator per week — the refusal to merge them should be revisited on that evidence rather
  than on this argument.

Every number here is re-derivable. The database claims come from queries against the live project
on 2026-08-22, scoped on `workspaces.is_sample`; the source claims carry `file:line`.
