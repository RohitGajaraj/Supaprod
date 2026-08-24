> _Build spec, MAIN LANE 2026-08-25, produced against the real source. Every claim carries a
> file:line or says UNVERIFIED. **`the-first-run/RULINGS.md` remains the tiebreaker.**_

# RIGHT-PANE BUILD SPEC — the artifact pane, station by station

**MAIN LANE, 2026-08-25.** Governs L0-2, L0-4, L0-5 and the right half of L0-3. Read with `the-first-run/DESIGN-DIRECTION.md`. Every column below was read out of `src/integrations/supabase/types.ts` or a migration, never inferred. Where I did not verify, it says UNVERIFIED.

---

## 0. THREE CORRECTIONS TO THE BRIEF, BEFORE ANYTHING IS BUILT

**0.1 — "four of seven stations have no registered tool" is stale, and the file that said it now says the opposite.** `STATION_ARTIFACT` at `src/lib/spine/attach.ts:222` carries a non-null `createdBy` and a null `gap` for **all seven** stations. `NOTHING_LANDS_HERE` at `src/lib/spine/chain.ts:157` is now `{}` — the four excuse sentences were deleted by founder ruling 2026-08-01 and a test pins the map to `STATION_ARTIFACT.gap`. So `ChainStop.gap` (`chain.ts:203`) will be `null` on every stop this build renders. **A lane that writes a "nothing lands here" branch is writing dead code.**

**The brief's conclusion still holds, for a better-measured reason.** From `attach.ts:217-220`, verbatim:

> MEASURED 2026-08-20 … `spine_track_members` on production holds rows for six of the seven stations; **ship has none, of any kind, ever**, and `release.publish` — pinned to review, so a call always leaves an approval row — has never raised one. Meanwhile `deployments` holds 42 rows, all successful. **Shipping happens, and it happens outside the spine.**

Add 58 of 59 tracks never leaving `sense`. **"Produced nothing" is the common case.** Build it as the primary state, not the fallback.

**0.2 — the pane cannot be built from `getTrackChain` alone.** `ChainMember` (`chain.ts:168`) carries `kind`, `word`, `artifactId`, `station`, `createdAt`, `title`, `missing`. **No body, no status, no forecast, no diff.** `getTrackChain` (`track.functions.ts:819`) selects `id,title:<per-kind column>` and nothing else (`track.functions.ts:877-883`). It answers *what was filed*; the right pane's whole job is *the thing itself*. Section 1 names the one server function MAIN must build.

**0.3 — `getTrackActivity` cannot tell you which station a barren run happened at.** `buildActivity` (`src/lib/spine/activity.ts:122-126`) derives `Turn.station` from `made[0]`, the first artifact the turn filed. A run that filed nothing gets `station: null` and `stationName: ""`. So activity is useless for the "ran and produced nothing" case — which is the case. Derive station state from the chain, per §2.

---

## 1. THE ONE SERVER FUNCTION MAIN MUST BUILD

`src/lib/spine/track.functions.ts` (MAIN owns `src/lib/**`). Without it, five of seven stations render a title and nothing else.

```ts
export const getTrackArtifacts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { trackId: string }) => z.object({ trackId: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }): Promise<{ stops: StationArtifactView[] }> => { … });

export type StationArtifactView = {
  station: AgentStation;        // AGENT_STATION_ORDER, agent-vocabulary.ts:171
  label: string;                // AGENT_STATIONS[station].name — "Discover"|"Decide"|"Plan"|
                                //   "Design"|"Build"|"Ship"|"Learn" (agent-vocabulary.ts:113)
  state: StopState;             // chain.ts:188 — "passed"|"here"|"not-reached"|"waived"
  waivedReason: string | null;
  expects: { kind: string; word: string };   // STATION_ARTIFACT[station].kind + KIND_WORD (attach.ts:514)
  everDriven: boolean;          // spine_tracks.driven_at !== null
  hold: string | null;          // Track.hold, the sentence (track.functions.ts:~85)
  holdReason: string | null;    // Track.holdReason, the raw id — branch on THIS, never the prose
  items: ArtifactView[];        // [] is normal
};

export type ArtifactView = {
  kind: string; word: string; artifactId: string; createdAt: string;
  title: string | null; missing: boolean;
  fields: Record<string, unknown>;   // the exact per-kind columns in §3–§9
};
```

It reuses `buildChain` (`chain.ts:240`) for ordering and state, then does **one query per kind** with an `in` list — the pattern `getTrackChain` already uses at `track.functions.ts:867-906` — widening each select to the columns named below. Keep `ARTIFACT_SOURCE`'s per-kind title column (`chain.ts:104`): **three of the seven tables do not have a `title` at all**, and a wrong column inside a `.select()` string typechecks clean and throws at runtime (`chain.ts:61-64`).

Everything else in this spec is buildable by LANE 0 against functions that already exist.

---

## 2. THE THREE STATES, DERIVED FROM ROWS AND NOTHING ELSE

There is a fourth. Build all four.

| Rendered state | Derivation |
| --- | --- |
| **has not run** | `state === "not-reached"`, or `state === "here" && everDriven === false` |
| **ran, produced nothing** | `items.length === 0` && (`state === "passed"` \|\| (`state === "here" && everDriven === true`)) |
| **produced something** | `items.length > 0` — regardless of state |
| **waived** | `state === "waived"` → render `waivedReason` verbatim, in the person's own words. Never an empty pane. |

`state` comes from `buildChain` (`chain.ts:271-278`): index-vs-current, with `passed` also covering the station a closed track stopped on. `everDriven` is `spine_tracks.driven_at`.

**Copy rules for the two empty states.** *Has not run*: name the station and what it will make — `"Plan has not run yet. It turns the decision into a spec."` *Ran and produced nothing*: `"Plan ran and filed no spec."` plus `hold` when non-null, and **nothing else**. Do not explain, do not apologise, do not draw a skeleton row. `STATION_ARTIFACT[station].gap` is `null` everywhere; there is no reason to render.

**`missing === true`** (the lookup ran and the row was not there — `track.functions.ts:917`) renders `"This <word> is no longer there"`, per `TrackChain.tsx:59-62`. Keep it; never drop it.

---

## 3. `sense` — displayed **"Discover"**

**(1) Artifact.** `attach.ts:224`:
```ts
sense: { kind: "signal", table: "signals", createdBy: "signals.log", gap: null },
```
**It also collects `theme`.** `TOOL_PRODUCTS` (`attach.ts:169-170`) maps `research.synthesize` and `cluster.trigger` to `{kind:"theme", table:"themes", idField:"theme_ids", many:true}`. Two kinds land here. That is the ruling's *"signals as they land, grouping into themes as they cluster."*

**(2) Tables and columns.**
- Membership: `spine_track_members(track_id, artifact_kind, artifact_id, station, created_at)`, PK `(track_id, artifact_kind, artifact_id)` — `supabase/migrations/20260801130000_spine_tracks.sql:103-112`.
- `signals` (`types.ts:7302`): `id`, **`title` is `string | null`**, `content` NOT NULL, `source`, `source_kind`, `url`, `tags string[]`, `sentiment`, `theme_id`, `reference_urls Json`, `restated_count`, `last_restated_at`, `external_id`, `is_sample`, `created_at`.
- `themes` (`types.ts:8208`): `id`, `title` NOT NULL, `summary` NOT NULL, `status`, `status_reason`, `frequency`, `severity`, `confidence`, `novelty`, `last_signal_at`, `dismissed_at_frequency`, `created_at`.
- `ARTIFACT_SOURCE.signal = {table:"signals", title:"title", body:"content"}` (`chain.ts:105`); `.theme = {table:"themes", title:"title", body:"summary"}` (`chain.ts:106`).

**(3) Three states.**
- *Not run*: `"Discover has not run yet. It reads the world and surfaces what changed."`
- *Ran, nothing*: `"Discover ran and filed nothing."` + `hold`.
- *Produced*: signal cards, then theme cards, oldest first (`byTime`, `chain.ts:221`).
  - **Signal card** — lead: `title ?? content.slice(0,120)`. **`signals.title` is nullable**, so `TrackChain`'s fallback to the kind word renders a column of identical rows reading "Signal". Use `content`. Body: `content` in `<Prose markdown={false}>` (`Prose.tsx:129`). Meta line: `source` · `source_kind ?? "unknown"` · `relativeTime(created_at)`. `url` → `ActionLink` when non-null. `tags` → chips. `theme_id` non-null → one line `"clustered"`; name the theme **only** if that theme is also a member of this track. Never fetch it.
  - **Theme card** — lead `title`, body `summary`, meta `frequency` signals · severity `severity` · confidence `confidence`. `status === "dismissed"` → show `status_reason`.

**(4) Inline action.**
- Signal: **Discard** → `deleteSignal` (`src/lib/discovery.functions.ts:430`), input `{id: uuid}`. Writes: `DELETE FROM signals WHERE id = $1`, RLS-scoped, `.select("id")` checked; throws `"That signal was not removed. It may not be yours to delete."` **This is a hard delete and it orphans the `spine_track_members` row** — the member then returns `missing: true` and the card must switch to the missing line. That is correct per `chain.ts:34-38`; do not "fix" it by hiding the row.
- **There is no "keep" write.** Keeping is the default; no column records it. Do not add one.
- Theme: **Dismiss (+ reason)** → `setThemeStatus` (`discovery.functions.ts:665`), input `{theme_id: uuid, status: "new"|"dismissed", reason?: string ≤400}`. Writes `themes.status`, `themes.status_reason`, `themes.dismissed_at_frequency`, plus a `stage_events` row and a gate signal via `setThemeStatusCore`. Returns `reasonRecorded` — render whether the reason was stored.
- **DESIGN-DIRECTION's "rename a theme" has no write path.** The only `from("themes").update` in `src/lib/` is `discovery.functions.ts:747`, inside `setThemeStatusCore`, and it writes status/reason only. **LANE 0 must not invent `renameTheme`.** Ship Dismiss, or file a request in `coordination/requests/`.

**(5) Server function.** `getTrackChain` gives title only. `listSignals` (`discovery.functions.ts:237`) is `select("*")` but workspace-wide, `limit(200)`, **no id filter**; `listThemes` (`:477`) is `limit(300)`, same. Neither can serve one track. → `getTrackArtifacts`.

---

## 4. `decide` — displayed **"Decide"**

**(1) Artifact.** `attach.ts:225-236`:
```ts
decide: {
  kind: "decision",
  table: "decisions",
  createdBy: "decision.record",
  gap: null,
},
```

**(2) Tables and columns.** `decisions` (`types.ts:2714-2749`): `id`, `title` NOT NULL, `rationale` nullable, `status`, `alternatives_considered Json`, `auto_origin bool`, `source_kind`, `decided_by_agent_slug`, `created_at`, `is_public`, `share_slug`, `prd_id`, `mission_id`, `cited_by_count`, and the eleven forecast columns: `forecast_claim`, `forecast_how_we_will_know`, `forecast_horizon_date`, `forecast_resolution`, `forecast_resolution_rationale`, `forecast_resolved_at`, `forecast_resolved_by_agent_slug`, `forecast_next_check_at`, `forecast_deferred_count`, `forecast_deferred_at`, `forecast_resolution_suggestion Json`.
`ARTIFACT_SOURCE.decision = {table:"decisions", title:"title", body:"rationale"}` (`chain.ts:120`).
`alternatives_considered` is written as `z.array(z.string().min(1).max(500)).min(1).max(10)` — `src/lib/ai/tools/registry.server.ts:4051`. **If it is not an array of strings, render nothing. Do not coerce.**

**(3) Three states.**
- *Not run*: `"Decide has not run yet. It records the call, what it rejected, and what it expects to happen."`
- *Ran, nothing*: `"Decide ran and recorded no decision."` + `hold`.
- *Produced* — the decision card, in this order:
  1. `title` — the call.
  2. `status` chip via `StatusChip` (`StatusChip.tsx:36,63`): `pending` → `you` / "Waiting on you"; `approved` → `pass`; `rejected` → `fail`.
  3. `rationale` in `<Prose markdown={false}>`.
  4. **"Rejected"** — each string in `alternatives_considered`. This is the field that makes a decision a decision; `decision.record` refuses a call without one.
  5. **The forecast block** — the StackAI panel, drawn as one call carrying versions:
     - claim `forecast_claim` · observable `forecast_how_we_will_know` · due `forecast_horizon_date`
     - verdict `forecast_resolution`: `null` + horizon in future → `"Not due until <date>"`; `null` + horizon past → `"Due <n> days ago, not graded"`; non-null → the word.
     - **who believed it**: `decided_by_agent_slug` + `auto_origin`. **Render this always.** All 14 live forecasts carry `auto_origin=true`; a person reading "what we believed" is entitled to know a machine believed it. `"Recorded by the strategist agent"` vs `"Recorded by you"`.
     - `forecast_deferred_count` when `> 0`.
  6. `forecast_claim === null` → the empty state IS the control. See (4).

**(4) Inline action.** Two, gated on state.
- **Forecast absent** → **"Say what you expect"** → `setDecisionForecast` (`src/lib/decisions.functions.ts:597`). Schema `setDecisionForecastSchema` (`:529`): `{decisionId: uuid, forecast_claim: string 1..500, forecast_how_we_will_know: string 1..500, forecast_horizon_date: ISO 8601 datetime **with offset**}`. Writes those three columns.
  **Write-once, enforced twice**: `setDecisionForecastImpl` refuses when `forecast_claim` is already non-null, and the DB trigger `enforce_forecast_immutable` (`supabase/migrations/20260810160431_788887fc-9b19-492a-a718-8722c1d01f4d.sql:80,124`) blocks the update. Say so on the form *before* the press: `"Once recorded this cannot be edited."` Refusals arrive as prose from `forecastRefusal` (`decisions.functions.ts:113`) — all three parts or none; a horizon already past is refused. Render the returned message; never restate it.
  **This is the highest-value control on the whole pane.** 0 human-authored forecasts exist in the live workspace. This control is the only thing that can move that number off zero.
- **Forecast present and `status === "pending"`** → **Approve / Reject** → `updateDecision` (`decisions.functions.ts:604`), input `{id: uuid, status: "pending"|"approved"|"rejected"}`. Writes `decisions.status` + a `stage_events` row via `recordStageEvent`. **"Approve" is correct here** — the click unblocks the call.
- **No settle/grade control at Decide.** That is Learn's.

**(5) Server function.** `getTrackChain` resolves `title` only. **No forecast column reaches any surface through it.** `listDecisions` (`decisions.functions.ts:155`) *does* select all six forecast fields (its select string is at `:196`) but is a workspace list with **no id filter**, `limit ≤200`. → `getTrackArtifacts`.

---

## 5. `define` — displayed **"Plan"**

**(1) Artifact.** `attach.ts:237`:
```ts
define: { kind: "prd", table: "prds", createdBy: "prd.draft", gap: null },
```

**(2) Tables and columns.** `prds` (`types.ts:5899`): `id`, `title` NOT NULL, `body_md` NOT NULL, `status` (`"draft"|"review"|"approved"|"shipped"`), `contract Json`, `critic_review Json`, `citations Json`, `opportunity_id`, `design_gate_status`, `github_issue_url`, `outcome Json`, `outcome_check_by`, `shipped_at`, `model`, `is_sample`, `created_at`, `updated_at`.
`ARTIFACT_SOURCE.prd = {table:"prds", title:"title", body:"body_md"}` (`chain.ts:107`).

**(3) Three states.**
- *Not run*: `"Plan has not run yet. It turns the decision into a spec."`
- *Ran, nothing*: `"Plan ran and filed no spec."` + `hold`.
- *Produced*: the spec **rendered as itself** — `<Prose markdown>` over `body_md` (`Prose.tsx:129`, prop `markdown?: boolean`). Header: `title` + status chip (`draft` quiet · `review` `you` · `approved` `pass` · `shipped` `pass`) + `"saved <relativeTime(updated_at)>"`. `critic_review` non-null → a collapsed *"What the critic said"*. `contract` parsing clean against `OutcomeContractSchema` (`discovery.functions.ts:2176`) → render `contract.intent` and each `success_metrics[].text` with its `oracle_kind` (`"eval"|"ci"|"uat"|"unverifiable"`). That is the checkable half and it is the thing this product sells.
- **The label is "Plan", never "Define".** `AGENT_STATIONS.define.name = "Plan"` (`agent-vocabulary.ts:139`). Leaking `define` is the exact defect recorded at `agent-vocabulary.ts:118-127`.

**(4) Inline action.** **Edit a section** → `savePrd` (`discovery.functions.ts:2913`), input `{id: uuid, title?: ≤200, body_md?: ≤50_000, status?: "draft"|"review"|"approved"|"shipped", contract?: OutcomeContract}`. Writes `prds.title`/`body_md`/`status`/`contract`.
**There is no section-level patch and no section model on the row.** An edit sends the whole `body_md` back. *"Ask for one to be redone"* is `steerTrack`, not `savePrd` — see §7(4).
Refusal to render verbatim: approving a spec whose contract has metrics but none verifiable throws `"Can't approve this spec yet. <reason>"` (`discovery.functions.ts:~2955`, `gradeOutcomeContract`).

**(5) Server function.** **`getPrd` already exists and is id-keyed** — `discovery.functions.ts:2137`, input `{id: uuid}`, returns `{prd: <full row via select("*")>}`. **This is the one station whose artifact renders today with no new server function. Use it.**

---

## 6. `design` — displayed **"Design"**

**(1) Artifact.** `attach.ts:238-246`:
```ts
design: {
  kind: "prototype",
  table: "prototypes",
  // WAS a gap, and the excuse for it had reached the UI: the chain panel told
  // people "design is done with people today", which is the wrapper story
  // told in our own product. Deleted, and the tool built instead.
  createdBy: "design.draft",
  gap: null,
},
```

**(2) Tables and columns.** `prototypes` (`types.ts:6687`): `id`, **`name` NOT NULL — there is no `title` column**, `description` nullable, `entry_path` NOT NULL, `share_slug` NOT NULL, `is_public`, `prd_id`, `created_at`, `updated_at`. **No status, no body.** The files live in `prototype_files(path, content, language, prototype_id)` — read at `src/routes/p.$slug.tsx:52-53`.
`ARTIFACT_SOURCE.prototype = {table:"prototypes", title:"name", body:"description"}` (`chain.ts:121`). Selecting `title` here compiles and fails at runtime — `chain.ts:112-119` says exactly this.

**(3) Three states.**
- *Not run*: `"Design has not run yet. It registers a prototype against the spec."`
- *Ran, nothing*: `"Design ran and filed no prototype."` + `hold`.
- *Produced*: `name`, `description`, then **the live preview** — a sandboxed `<iframe srcDoc>` built the way `routes/p.$slug.tsx` builds it (`buildSrcDoc`, `p.$slug.tsx:~20-36`: inlines `<link rel=stylesheet>` and `<script src>` from the file list, resolved against `entry_path`). **Label the frame** so it is never mistaken for the real product — the one rule taken from `mistral-live-preview.webp`. `is_public === true` → also offer `/p/<share_slug>`.
- **UNVERIFIED**: I did not confirm every `prototypes` row has matching `prototype_files` rows. Empty file list → `"This prototype has no files to show."` **Never an empty white iframe.**

**(4) Inline action.** **Rename** → `renamePrototype` (`src/lib/prototypes.functions.ts:163`), input `{id: uuid, name: 1..200}`, writes `prototypes.name` and `prototypes.updated_at`. It is the only non-destructive write on the table. `deletePrototype` (`:181`) and `togglePrototypeShare` (`:142`) are the others — **share publishes to the open internet and does not belong on a run pane.**

**(5) Server function.** None is id-keyed. `listPrototypes` (`prototypes.functions.ts:39`) is a workspace list, `limit(50)`, and its select omits both `description` and `entry_path`. → `getTrackArtifacts`, which for this kind needs a **second** read of `prototype_files`.

---

## 7. `build` — displayed **"Build"**

**(1) Artifact.** `attach.ts:247-259`:
```ts
build: {
  kind: "changeset",
  table: "studio_changesets",
  createdBy: "studio.stage",
  // … The honest fix was not to reword the entry, it was to give the driver a
  // mission (`missionForTrack` in driver.server.ts, created once per track and
  // stored as a member so Build ticks reuse it). The gap is closed rather than
  // documented, so this is null again, this time truthfully.
  gap: null,
},
```

**(2) Tables and columns.** `studio_changesets` (`types.ts:7731`): `id`, `title` NOT NULL, `summary`, `repo` NOT NULL, `branch`, `base_sha`, `status`, `pr_number`, `pr_url`, `prd_id`, `mission_id`, `code_review Json`, `fix_attempts`, `branch_sync_attempts`, `release_notes`, `release_notes_at`, `created_at`, `updated_at`.
The diff is `studio_changes` (`types.ts:7600`): `id`, `changeset_id`, `path`, `op`, `base_content`, `new_content`, `base_sha`, `updated_at`.
`ARTIFACT_SOURCE.changeset = {table:"studio_changesets", title:"title", body:"summary"}` (`chain.ts:109`).
A **`mission`** member may also sit here — `KIND_WORD.mission = {one:"run", many:"runs"}` (`attach.ts:522`), `ARTIFACT_SOURCE.mission = {table:"missions", title:"title"}` (`chain.ts:110`). Render it as one quiet line, not a card: `attach.ts:520` says it is real membership and is said rather than hidden.

**(3) Three states.**
- *Not run*: `"Build has not run yet."`
- *Ran, nothing*: `"Build ran and filed no code change."` + `hold`.
- *Produced*: `title` + `summary`; then `repo` · `branch` · status chip; then the diff; then the checks.
  - **Diff** → `getChangesetDiff` (`src/lib/studio.functions.ts:1281`), input `{changesetId: uuid}`, returns `{changes: Array<{id, path, op, base_content, new_content, updated_at}>}` ordered by `path`. Per file: `path`, `op`, a count from `base_content` vs `new_content` through `Diffstat` (`surface-parts.tsx:1254`), body through `CodeBlock` (`CodeBlock.tsx:134`). **`CodeBlock` takes `lines: CodeToken[][]`, not a string** (`CodeToken = {t: string; c?: CodeTone}`, `CodeBlock.tsx:69`) — tokenise, or pass one `{t: <line>}` per line. Props: `filename` (required), `language?`, `streaming?`, `maxHeight?`, `emptyLabel?`.
  - **Checks**: `fix_attempts` and `branch_sync_attempts` when `> 0` are honest integers. `code_review` is `Json` and its shape is **UNVERIFIED** — read defensively, render nothing rather than guess.

**(4) Inline action.** Three, and only one of them is an approval.
- `pr_url` non-null → an `ActionLink` out. **A link, not an approval** — the merge gate lives on GitHub.
- **The gate** (this is L0-1 landing in the Build pane). When the track holds a pending gate whose `agent_approvals.tool_name` is `studio.pr.open` / `studio.pr.merge` / `github.pr.open` / `delegate.openhands`, render `CallGate` (`src/components/approvals/CallGate.tsx:56` — LANE 0's territory, reuse it, do not rebuild): `question`, `subject`, `since`, `now`, `lines: string[]`, `hiddenLineCount`, `consequence`, `children`. Fill `consequence` from `gateHeadline(tool_name)` (`src/lib/tool-consequences.ts:753`) and one line from `REVERSIBILITY_LABEL[toolConsequence(tool).reversible]` + `.undo` (`:758`, `:570`). **Never the tool name on screen** — that is a ruling stated at `tool-consequences.ts:747-751`.
  Write: `resolveApproval` (`src/lib/governance.functions.ts:668`), input `{approvalId: uuid, decision: "approved"|"rejected", reason?: ≤2000}`. **Approving also executes the tool.** Rejecting writes `agent_approvals.status` and `decision_reason` — that satisfies BUILD-QUEUE L0-1 acceptance (3). Use this, not `decideApprovalItem` (`approvals-queue.functions.ts:1247`), which is the queue's ten-kind router.
  **"Decide all"** (the Cofounder detail, and the answer to the 90 dead gates) is already served server-side by `decideApprovalItems` (`approvals-queue.functions.ts:1316`, `{verdict, items: [{kind, id}]}`, max `MAX_BULK_DECISIONS = 50`, per-item `{decided[], refused[{reason}]}`). It is **not** a Meridian gap. What is missing is a read that returns *the class* — same `tool_name`, same workspace, still pending. File that as a request.
- **"Send one instruction back"** → `steerTrack` (`track.functions.ts:1009`), input `{trackId: uuid, message: string 1..2000}`. Writes `agent_messages {user_id, workspace_id, track_id, kind: "steer", payload: {message}}`. **2000 is the loop's own injection cap** — accepting more takes text the product discards. Refuses on a `done`/`abandoned` track with a sentence; render it.

**(5) Server function.** `getChangesetDiff` exists and is id-keyed — usable today. The changeset **row** (`title`, `summary`, `repo`, `branch`, `status`, `pr_url`, `code_review`) reaches no surface through any id-keyed read; `getTrackChain` gives `title` only. → `getTrackArtifacts`.

---

## 8. `ship` — displayed **"Ship"**

**(1) Artifact.** `attach.ts:260-272`:
```ts
ship: {
  kind: "deployment",
  table: "deployments",
  // WAS a gap. `release.publish` calls the SAME promote path a person does,
  // rather than adding a second way to ship that could disagree with the
  // first. It is pinned to review and is the only gate in the loop: a
  // production deploy is irreversible and customers see it, which is the one
  // place a person genuinely belongs.
  createdBy: "release.publish",
  gap: null,
},
```

**(2) Tables and columns.** `deployments` (`types.ts:2851`): `id`, `changeset_id`, `commit_sha` NOT NULL, `deploy_url` nullable, `deployed_at`, `environment`, `provider`, `status`, `triggered_by`, `created_at`, `updated_at`.
**There is no title, name or label column.** `chain.ts:126-130`:
```ts
deployment: {
  table: "deployments",
  title: "deploy_url",
  parent: { table: "studio_changesets", column: "title" },
},
```
`getTrackChain` already resolves the borrowed name and prefers it over the URL (`track.functions.ts:877-899`). Keep that: a release named by its hostname is the one artifact in the loop a person cannot recognise on sight (`chain.ts:70-81`).

**(3) Three states — and this is the station where "nothing" is the measured norm.** Zero `spine_track_members` rows at `ship`, ever, against 42 successful `deployments` rows (`attach.ts:217-220`).
- *Not run*: `"Ship has not run yet."`
- *Ran, nothing*: `"Ship ran and filed no release."` + `hold`. **Do not go looking for a deployment by time window to fill the gap.** `attach.ts`'s entire header is the argument against it, and a member row naming the wrong artifact is a false claim about whose work something is.
- *Produced*: the deploy steps with a live clock — `emergent-live-steps.webp` drawn literally. Lead: borrowed changeset title. Then `environment` · `provider`, `status` as the chip, `commit_sha.slice(0,7)`, `deploy_url` as an `ActionLink` when non-null, `deployed_at` when non-null. While `status` is non-terminal, a running clock from `useElapsed(Date.parse(created_at))` (`src/components/meridian/use-elapsed.ts:39`) — **pass `startedAt`**, or the timer reports the age of the component, not the age of the work (`use-elapsed.ts:18-22`).

**(4) Inline action.**
- **Roll back** → `rollbackRelease` (`studio.functions.ts:1754`), input `{changesetId: uuid, reason: string 1..500}`, returns `{rollbackId, revertChangesetId, revertMissionId}`. **It undoes nothing directly**: it stages a revert changeset and a revert mission and drives them through Build's rails, each step confirm-gated. Label it `"Open a revert"`, never `"Undo"`.
- **There is no "hold" write.** DESIGN-DIRECTION's *hold* has no column and no function anywhere in `src/lib/`. The true equivalent is the gate: `release.publish` is pinned to review (`attach.ts:266-271`), so a ship about to happen is a pending `agent_approvals` row, and the honest hold is **Reject** on that gate via `resolveApproval`. **LANE 0 must not invent a hold flag.**
- `promoteToProduction` (`src/lib/deployments.functions.ts:1257`, input `{changesetId: uuid}`) exists and **actually ships**. Do not put it on a run pane without a gate in front of it.

**(5) Server function.** `getTrackChain` returns the borrowed title and nothing else — no `environment`, `provider`, `status`, `commit_sha`, `deploy_url`, `deployed_at`. **`listDeployments` (`deployments.functions.ts:446`) takes `{workspaceId?, productId?, changesetId?, limit?}` and derives the workspace from the changeset when `changesetId` is given** — so it is usable for the Ship pane today, because the pane has the changeset from the Build member. Prefer it over inventing a read.

---

## 9. `learn` — displayed **"Learn"**

**(1) Artifact.** `attach.ts:273-283`:
```ts
learn: {
  kind: "learning",
  table: "learnings",
  // WAS a gap. The nightly outcome sweep still writes its own learnings; this
  // gives the station's agent the same ability during a run, so a track that
  // reaches Learn produces the verdict instead of waiting on a cron that
  // knows nothing about it.
  createdBy: "learning.record",
  gap: null,
},
```

**(2) Tables and columns — this pane joins TWO rows.**
- `learnings` (`types.ts:4748`): `id`, `summary` NOT NULL, `verdict` NOT NULL **CHECK IN ('validated','missed','mixed')** (`supabase/migrations/20260611161500_f_v5_loop_close_learnings.sql:21`), `decision_id`, `prd_id`, `opportunity_id`, `mission_id`, `metric_label`, `metric_value`, `prior_ice`, `new_ice`, `recorded_by_agent_slug`, `created_at`, `is_sample`.
  `ARTIFACT_SOURCE.learning = {table:"learnings", title:"summary", body:"summary"}` (`chain.ts:125`) — summary is both name and body, on purpose.
- **"Predicted X · actually Y" is not on `learnings`. It is on `decisions`**: `forecast_claim` (predicted) and `forecast_resolution` + `forecast_resolution_rationale` + `forecast_resolved_at` + `forecast_resolved_by_agent_slug` (actually). So the Learn pane reads the track's **`learning` member and the track's `decide` member together.**
- `forecast_resolution_log` (`types.ts:3813`): `id`, `decision_id`, `workspace_id`, `resolution`, `resolution_rationale`, `resolved_at`, `resolved_by_agent_slug`, `reopened_by`, `reopened_at`, `reason`. **0 rows ever.** It is written by exactly one path — `reopenForecastImpl` (`src/lib/forecast.functions.ts:264`) — which requires a settled verdict to reopen, and nothing has ever settled.
- `prior_ice` / `new_ice` are `numeric` and **arrive as strings over PostgREST**. Coerce with `Number()`.

**(3) Three states — the ungraded state is the design, not the fallback.**
- *Not run*: `"Learn has not run yet."` 59 tracks, none has reached it.
- *Ran, nothing*: `"Learn ran and recorded nothing."` + `hold`.
- *Produced, ungraded* — **14 forecasts, 0 graded, earliest horizon 2026-09-05.** Render the forecast as a standing commitment:
  - predicted → `forecast_claim`
  - how we will know → `forecast_how_we_will_know`
  - due → `forecast_horizon_date`
  - actually → **nothing yet**, and name which nothing it is: `"Not due until <date>"` when horizon is future, `"Due <n> days ago and not graded"` when past. **Never an em-dash placeholder, never a fabricated verdict.** BUILD-QUEUE L0-5 requires exactly this honest empty state.
- *Produced and graded*:
  - predicted → `forecast_claim`
  - actually → `forecast_resolution` (`"hit"|"miss"|"inconclusive"`) + `forecast_resolution_rationale`, stamped `forecast_resolved_at`, attributed `forecast_resolved_by_agent_slug` or `"you"` when null
  - what we now believe → the learning's `summary`, `verdict` as the chip (`validated` → `pass`, `missed` → `fail`, `mixed` → `hold`), with `metric_label` / `metric_value` beside it when non-null, and `prior_ice → new_ice` when both non-null
  - beneath: the version list from `getForecastHistory` (`forecast.functions.ts:464`, input `{decisionId: uuid}`, returns `{history: ForecastHistoryEntry[]}` = `{resolution, rationale, resolvedAt, resolvedByAgentSlug, reopenedAt, reopenedBy, reason}`). **It returns `{history: []}` for every decision in this product today. An empty version list renders as nothing at all — not as "v0".**

**(4) Inline action.** Three, and the fourth one people will ask for does not exist.
- **Ungraded and due** → `settleForecast` (`forecast.functions.ts:405`), input `{decisionId: uuid, resolution: "hit"|"miss"|"inconclusive", rationale: string 1..1000}`. Writes `forecast_resolution`, `forecast_resolution_rationale`, `forecast_resolved_at`, `forecast_resolved_by_agent_slug` via `buildSettlePatch`. **This is M-3 on the build queue and it has never been done once.**
- **Ungraded and not due** → `deferForecastCheck` (`:424`), input `{decisionId: uuid, days: int 1..365, default 14}`. Writes `forecast_next_check_at`, `forecast_deferred_count`.
- **Graded and wrong → "Disagree"** → `reopenForecast` (`:438`), input `{decisionId: uuid, reason: trimmed string 3..1000}`. Appends the prior verdict to `forecast_resolution_log` **first**, then clears `forecast_resolution`, `forecast_resolution_rationale`, `forecast_resolved_at`, `forecast_resolved_by_agent_slug`, `forecast_next_check_at`. The reason is required at 3 characters by both the schema and the DB constraint `forecast_resolution_log_reason_not_blank` (`supabase/migrations/20260814140000_a_wrong_verdict_nobody_can_correct_is_also_a_false_entry.sql:50`), so **the control cannot be a bare button** — it opens a reason field or it does not ship.
- **"Agree" has no write and must not pretend to have one.** Agreeing with a verdict changes no column. Render agreement as the absence of a disagree, or file a request. Do not add a fake control.

**(5) Server function.** `getForecastHistory` exists and is id-keyed — usable today. `listLearnings` (`src/lib/outcome.functions.ts:2075`) filters `{workspaceId?, movedScoreOnly?}` only, `limit(50)`, **no id filter**. `listDueForecasts` (`forecast.functions.ts:399`) is the Learn *desk's* workspace-wide read and answers "what is due", not "what did this track predict". → `getTrackArtifacts` must return the learning row **and** the track's decision forecast columns.

---

## 10. MERIDIAN GAPS — MAIN builds these in `src/components/meridian/`

Two real gaps. Two things a lane will assume are gaps and are not.

**GAP 1 — a step row with a running clock.** `RunMap` (`RunMap.tsx:83`) has `RunMapMode = "editable"|"live"|"replay"` and `RunMapStation = {station, state: PlanStepState, outcome?, hold?, waivedReason?, steps?}` and draws a chip on `active`/`failed`/`needs-approval` (`RunMap.tsx:118-121`). **It has no clock.** `RunTimeline.TimelineEvent.durationMs` (`RunTimeline.tsx:122`) is a *settled* duration. `useElapsed` (`use-elapsed.ts:39`) exists and nothing composes the two. The Emergent reference is `⟳ Building Package… 04:29` — a **running** clock on the active step. Request: extend `RunMapStation` with `startedAt?: number`, and render `useElapsed(startedAt)` on the `active` station only.

**GAP 2 — a version list.** Nothing in `meridian/` draws a stamped list of versions (`stackai-version-history.webp`: `v0…v5`, each stamped, one `Live`, one `Draft`). `getForecastHistory` returns the data; there is no primitive for it. Request: `<VersionList entries={{label, at, state}[]} />`.

**NOT A GAP — the inline question card.** `CallGate` (`src/components/approvals/CallGate.tsx:56`) is the shipped anatomy and it is in **LANE 0's** own territory. `Gate` (`meridian/Gate.tsx:52`, `{question, lines, linesLabel, children}`) and `ApprovalCard` (`meridian/ApprovalCard.tsx:111`, `{questions: ApprovalQuestion[], subject?, confirmLabel?, onApprove}`) both exist. Reuse; do not rebuild.

**NOT A GAP — the tabbed right pane** (Lindy's `Browser | Terminal`). `Tabs` (`meridian/Tabs.tsx:88`, `{group, label, tabs: TabDef<Id>[], active, onSelect, rule?}`) and `TabPanel` (`:197`) exist.

**Also present and to be used, not re-derived:** `Prose` (`markdown?`), `CodeBlock`, `Diffstat` (`surface-parts.tsx:1254`), `StatusChip`, `Value`, `Row`/`Line` (`rows.tsx:82`/`:226`), `Region`/`Action`/`Actions`/`ActionLink`, `Reading`/`ReadFailedLine`/`NothingYet`/`EmptyRegion`, `RecordSpeaks`, `AgentPulse`.

---

## 11. WHAT MUST NOT HAPPEN

1. **No optimistic render.** The pane draws a row the run wrote. `getTrackChain` marks `missing` only when a lookup **succeeded** and the row was absent (`track.functions.ts:808-814`); an errored or unmapped lookup leaves `missing: false` and `title: null` and claims nothing. Preserve that distinction — collapsing it reports healthy artifacts as destroyed.
2. **No time-window queries.** Never "what appeared near this track in time". `attach.ts:23-49` is the argument and it is settled.
3. **No station id on screen.** `sense` is **Discover**, `define` is **Plan**. `agent-vocabulary.ts:118-127` records the leak this caused. Stations are a progress display inside one run, never a menu.
4. **No `--sp-*`, `--ds-*`, `--text-*`, `--hairline`, `--raised`, `data-obsidian`, no raw colour.** `bun test` fails a new file that carries one and fails an existing file that grows its count.
5. **Branch on `holdReason`, never on `hold`.** `holdLine` rewrites two reasons to name their station, so the prose no longer equals its own entry (`track.functions.ts:~92-101`). A guard on a sentence breaks when the copy improves.
6. **Gates before push:** `bunx tsc --noEmit`, `bun test`, `bun run lint`, never piped into `tail`. 12 failures are pre-existing.

## 12. FILES CITED

`src/lib/spine/attach.ts` · `src/lib/spine/chain.ts` · `src/lib/spine/activity.ts` · `src/lib/spine/track.functions.ts` · `src/lib/spine/driver.server.ts` · `src/lib/agent-vocabulary.ts` · `src/lib/decisions.functions.ts` · `src/lib/forecast.functions.ts` · `src/lib/discovery.functions.ts` · `src/lib/prototypes.functions.ts` · `src/lib/studio.functions.ts` · `src/lib/deployments.functions.ts` · `src/lib/outcome.functions.ts` · `src/lib/governance.functions.ts` · `src/lib/approvals-queue.functions.ts` · `src/lib/tool-consequences.ts` · `src/lib/ai/tools/registry.server.ts` · `src/integrations/supabase/types.ts` · `src/components/track/TrackRun.tsx` · `src/components/spine/TrackChain.tsx` · `src/components/spine/TrackActivity.tsx` · `src/components/approvals/CallGate.tsx` · `src/components/meridian/{RunMap,RunTimeline,ToolStream,PlanGate,PlanCard,Gate,ApprovalCard,Tabs,Prose,CodeBlock,StatusChip,rows,surface-parts,use-elapsed}.tsx` · `src/routes/_authenticated.track.$trackId.tsx` · `src/routes/p.$slug.tsx` · `supabase/migrations/{20260801130000_spine_tracks,20260810160431_788887fc-9b19-492a-a718-8722c1d01f4d,20260814140000_a_wrong_verdict_nobody_can_correct_is_also_a_false_entry,20260611161500_f_v5_loop_close_learnings}.sql`

No file was edited. No dev server was started.