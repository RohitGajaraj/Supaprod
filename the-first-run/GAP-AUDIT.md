# Platform gap audit — 2026-08-25
> _Five parallel sweeps: first-run, tenancy/security, failure states, settings/connectors,
> accessibility. Every finding carries `file:line` or a measurement. **MOBILE ITEMS ARE DROPPED**
> per R-19; accessibility is kept at full weight. `RULINGS.md` remains the tiebreaker._

## The five headlines

- The first ninety seconds never start a run: `/start` is a live redirect stub, every new account is force-routed to `/onboarding` before any landing resolves, and the one sentence onboarding collects is spent on a Critic teardown that creates zero tracks — while the app-wide composer creates missions, not tracks, so `/track/$trackId` still has zero inbound links in the entire repo.

- The spine track — the product's central object — has no tenant: `startTrack` writes `workspace_id = NULL`, which drops it out of the cron sweep that walks tracks, bills its AI spend to the operator's personal account, and exempts it from the workspace pause switch and spend ceiling. Its RLS is creator-only, so no teammate can open a colleague's run and no removal revokes access; and an approval is answerable by exactly one named individual, which is why 90 of them died unanswered.

- The failure vocabulary is fully built and almost entirely unread: 57 of 59 live tracks carry a hold reason, and the run's own page renders none of it, the retry control is hidden on the four holds it was written for, and the track spend ceiling is off in all 21 workspaces because an un-backfilled NULL is being read as a deliberate "no ceiling".

- Settings and admin are the best-reviewed surfaces in the repo (every one carries its five answers in its header) — the rot is behind them: commercial and governance mechanisms that are built, tested, and switched off or unread. Direct answer on the four guardrail doors: only TWO are live. `/guardrails` (8 lines) and `/govern` (64 lines) are already one-hop redirects into `/engine-room`. `/engine-room` survives as the single door (nav labels it "Guardrails", nav-model.ts:250). `/boundary` (1131 lines) has NO rail door — `AppFrame.rail-covers-keys.test.ts:194` asserts `railOwnerOf("/boundary")` is null — and is reached only from `/crew:516` and `BoundaryStatement.tsx:89`, which itself renders INSIDE `SafetyRoom.tsx:120`; so the Safety room's own "What is allowed" tab (engine-room-glance.ts:256) answers its question by linking the reader out of the room. `/boundary` folds into `/engine-room?room=safety&view=rules` and becomes a redirect like the other two. `/approvals` stays as R-04 overflow and loses its primary rail row (nav-model.ts:130-141, added 2026-08-24, one day before R-04 ruled it must not be primary). That consolidation is already BUILD-QUEUE item 13, so it is not re-filed below.

- The design contract's contrast and focus claims verify — core text pairs measure 4.98–17.88:1 and the focus ring 6.71–7.36:1 in both themes, so nobody needs to chase those. What does not verify is anything that MOVES: 22 files in src poll or stream, 27 carry aria-live, and the intersection is empty — the run transcript, the thing the whole product exists to let a person watch, is silent to assistive tech. Beyond that the pattern is the repo's own: the affordances exist and are not wired. `Action` has had a `busy` prop since the 196-call-site audit and 65 of 105 pending sites still do not pass it; `shell.css` documents the phone-nav hole it created and names the fix it never built; Meridian ships no breakpoint while a spec tells lanes to stack below one.

---

## MAIN — 20 findings

### [BLOCKER · L] Make Ask start a track, or stop the dock promising to build

**Evidence:** src/routes/api/chat.ts:1130 names `CALL startTrackCore WITH THIS ROUTE` as deliberately fenced off; the branch creates an agent mission instead and streams 'On it. **{mission.title}** is open and the crew is starting on it now' (chat.ts:1140-1142). The two doors into it: AskDock.tsx:91 'What should we build?' mounted app-wide at _authenticated.tsx:232, and AskComposer.tsx:65/:74 'Tell Supaprod what to build...' calling `openAsk` (src/lib/ask-open.ts:53). Neither writes a `spine_track`. `grep -rn 'track/\$trackId' src/` returns two hits, both inside src/routes/_authenticated.track.$trackId.tsx itself — nothing in the product links to a run.

**What a person hits:** Every authenticated screen carries a box that says it will build something. Typing into it opens a chat and creates a mission — a different object the run workbench, TrackChain and TrackActivity cannot see. This is why 59 tracks have ever existed: the composer people actually use does not make them.

**Fix:** The route is already computed at chat.ts:830 via `routeIntent`. Call `startTrackCore` (src/lib/spine/promote.server.ts:321 shows the exact call shape) with that route, and return the track id on the SSE frame beside `mission_id` so the pane can link to /track/$id. If the mission/track question named in that comment is not ready to settle tonight, the interim is one string change: the dock stops saying 'what should we build' and says what it does — it opens a conversation.

### [BLOCKER · M] Stamp the workspace on a track at creation, so the driver can see it

**Evidence:** src/lib/spine/track.functions.ts:272 inserts `workspace_id: data.workspaceId ?? null`; `startTrack` (:293-312) never passes one, so the explicit NULL overrides the column default `current_user_default_workspace()` (supabase/migrations/20260801130000_spine_tracks.sql:56). The only UI caller is TrackStart.tsx:77, mounted live at _authenticated.plan.index.tsx:893. The sweep that walks tracks filters `.not("workspace_id", "in", excluded)` (src/routes/api/public/hooks/track-tick.ts:93) — in SQL `NULL NOT IN (...)` is NULL, so every NULL-workspace row is dropped from the batch, and `sampleWorkspaceIds` is never empty in production because every account is seeded an Explore workspace.

**What a person hits:** A person clicks "Start work", the track is created, and the cron that is supposed to walk it through the seven stations never picks it up. It sits at station one forever, with no error anywhere. This is the mechanical explanation for 58 tracks entering the first station and zero reaching the last, and it will apply identically to the /start landing in backlog item 2.

**Fix:** In `startTrackCore` drop the explicit `?? null` so the column default fires, and add `workspaceId` to `startTrack`'s input validator gated through the membership check that already exists — `resolveWorkspaceId` at src/lib/audio.functions.ts:78-98, which proves a client-supplied workspace id against `workspace_members` on the RLS client. Promote that helper next to `applyWorkspaceScope` in src/lib/workspace-scope.ts rather than writing a third copy (briefs.functions.ts:35 is the second). Then backfill existing NULL rows from `spine_tracks.user_id` via `current_user_default_workspace`.

### [BLOCKER · S] Bill a track's AI spend to the workspace's account, not the operator's personal one

**Evidence:** src/lib/ai/runtime.server.ts:1091-1107 — `resolveCreditAccountId` reads `workspaces.account_id` only when `workspaceId` is truthy; otherwise it falls through to `supabase.rpc("ensure_user_default_account", { _user_id: userId })`. The driver passes `workspace_id: row.workspace_id ?? undefined` (src/lib/spine/driver.server.ts:330) and every UI-started track carries NULL (finding 1). The out-of-credit hold that stops a run is at driver.server.ts:1452.

**What a person hits:** An employee at a paying customer starts a run; the model calls are drawn against that employee's own personal credit pool instead of the account the company pays for. Their pool empties, the track holds with `out-of-credit`, and the workspace's own balance is untouched and shows nothing wrong. On the buyer's side, spend they are incurring never appears on any invoice or usage view.

**Fix:** Fixing finding 1 fixes this, because the account resolution is already correct once `workspace_id` is present — this is the reason finding 1 is a blocker rather than tidy-up. Add a regression test asserting `resolveCreditAccountId` is never reached with a null workspace from `driveTrackOnce`, so a future refactor cannot reintroduce the fallback silently.

### [BLOCKER · S] Make the workspace pause switch and spend ceiling bind a track that has no workspace

**Evidence:** src/lib/spine/driver.server.ts:150-151 — `isPaused` returns `false` when `workspaceId` is null, which is the opposite of the fail-closed direction its own comment (:161-163) claims. Same shape guards the two human controls: `if (raw.workspace_id)` at src/lib/spine/track.functions.ts:450 (advanceTrack) and :622 (retryStation). `driveTrackNow` (:1139-1238), the button a person actually presses and the one that spends money, checks the kill switch not at all. src/lib/spine/track-caps.server.ts:78 — `if (!workspaceId) return DEFAULT_TRACK_SPEND_CAP_USD`, so `workspaces.default_track_spend_cap_usd` is never read.

**What a person hits:** An owner hits "pause everything" in Engine Room and the runs people started from the UI keep going, keep dispatching agents and keep spending. The ceiling the workspace set is replaced by a built-in $5 default the customer never chose. This is the one control a risk officer asks about first, and today it is a suggestion.

**Fix:** Change `isPaused` to fail closed on a null workspace (return true) once finding 1 has backfilled the column, and add the same `isPaused` call to `driveTrackNow` before the seat loop — it already imports from `driver.server.ts`, so this is one call, not a new mechanism. Replace the `if (raw.workspace_id)` guards in advanceTrack/retryStation with an unconditional call to the same helper so there is one pause reader rather than three.

### [BLOCKER · S] Turn the un-set track spend ceiling back on — every workspace in production runs uncapped

**Evidence:** `resolveTrackSpendCap` (src/lib/spine/track-caps.server.ts:94) reads `if (raw === null) return null;` with the comment "A workspace that deliberately cleared its ceiling gets none. That is a human decision on the record, not an accident, so it is obeyed." But the column was added with no default and no backfill: supabase/migrations/20260802000000_track_spend_ceiling.sql:52, `add column if not exists default_track_spend_cap_usd numeric;`. Live prod: `select count(*), count(default_track_spend_cap_usd) from workspaces` → 21 workspaces, 0 with a value. `select count(spend_cap_usd) from spine_tracks` → 0 of 59. So the un-migrated NULL is being read as a deliberate "no ceiling" and `DEFAULT_TRACK_SPEND_CAP_USD = 5.0` (track-caps.server.ts:53) never applies. `over-budget` appears zero times in the live `last_hold` distribution.

**What a person hits:** The ceiling THE-ONE-SCREEN calls "the ceiling where the autonomy is" is off everywhere. An agent can walk a track through seven stations, three retries each, with nothing summing the spend — and /boundary tells the buyer "No ceiling. Work continues through every station until it finishes" (_authenticated.boundary.tsx:899) as if they chose that. It is the first question an enterprise risk officer asks and we currently fail it.

**Fix:** One hand-written migration, applied individually per R-09: `update public.workspaces set default_track_spend_cap_usd = 5.00 where default_track_spend_cap_usd is null;` then `alter table public.workspaces alter column default_track_spend_cap_usd set default 5.00;` so new workspaces are born capped. Reversible by setting the column back to null. Do NOT change track-caps.server.ts:94 — its fail-closed doctrine is right; the data was never written.

### [BLOCKER · M] Re-validate connectors on a tick, and let the run name the broken one instead of saying "connect a source"

**Evidence:** `verifyConnection` (src/lib/connections.functions.ts:390) is the ONLY writer of `status:"error"` (line 419) and its only caller is a manual "Test it" button (src/components/connections/AccountConnectionsSection.tsx:252). 35 `*-tick.ts` jobs exist in src/routes/api/public/hooks/ and zero re-validate a connection. `externalEvidence` (src/lib/spine/driver.server.ts:831-870) decides `needs-evidence` by counting `signals` rows only, never by reading connection status; the hold then renders "Connect a source" (src/lib/spine/driver.ts:682). Env-fallback connectors are worse: AccountConnectionsSection.tsx:625 asserts "Reading on a workspace credential an admin set" purely from the env var being SET — the exact defect connections.functions.ts:432-439 records as already having happened (Salesforce's token expired months ago while the pill said Active).

**What a person hits:** Their Slack token expires. Discover files nothing, the track stops, and the product tells them to connect a source while Settings shows Slack connected. The file's own comment says this "wastes their time and their trust". This is station 1, which 58 of 59 tracks entered.

**Fix:** Add `connection-health-tick.ts` beside the 35 existing hooks, calling the same `getProviderAdapter(...).validate(materializeAuth(row))` path `verifyConnection` already uses, writing `status`/`status_detail`/`last_verified_at`. Then give `externalEvidence` a third return state (sources present, all failing) so `HOLD_LINE["needs-evidence"]` can name the connector and offer Reconnect. Wire `verifyEnvCredential` (line 440) into the same tick so the "Active" pill stops being an assertion.

### [HIGH · M] Scope spine_tracks RLS to workspace membership, not to the creator alone

**Evidence:** supabase/migrations/20260801130000_spine_tracks.sql:125-127 — `CREATE POLICY "own tracks all" ON public.spine_tracks FOR ALL USING (auth.uid() = user_id)`. No workspace clause, and no later migration changes it (the only other reference is 20260801090150, same policy body). `spine_track_members` (:130-138) inherits it. Every other workspace table uses the dual key `auth.uid() = user_id AND public.is_workspace_member(workspace_id)` — see 20260619220000_wm_f1b_agent_workspace_hardening.sql:110-112.

**What a person hits:** Two things at once. A teammate cannot open the run their colleague started — `/track/:id` is a link that returns "not found" for everybody but the author, so the one linkable address the route was built for (its own header: "a finished run can be sent to somebody") cannot actually be sent to anybody. And in the other direction, removing someone from the workspace does not revoke their access: `removeWorkspaceMember` (src/lib/workspaces.functions.ts:214) deletes the membership row, but a user_id-only policy keeps every track they created readable and drivable forever.

**Fix:** One migration replacing the policy with the dual-key shape already installed on `agent_approvals` and `agent_runs` in 20260619220000: `USING (public.is_workspace_member(workspace_id) AND (auth.uid() = user_id OR true))` for SELECT, keeping writes on the creator. It must land after finding 1's backfill, or every existing NULL-workspace track becomes unreadable to its own author.

### [HIGH · M] Let someone other than the person who was asked answer a consent gate

**Evidence:** supabase/migrations/20260619220000_wm_f1b_agent_workspace_hardening.sql:120-123 — `agent_approvals` policy is `auth.uid() = user_id AND public.is_workspace_member(workspace_id)` for ALL. `decideApprovalItem` (src/lib/approvals-queue.functions.ts:1247-1251) and `decideApprovalItems` (:1316-1320) both run on `context.supabase`, the RLS-scoped client, so the policy is the enforcement. src/lib/roles.functions.ts:9 states the intended model — "admin: ... approve actions" — and no code implements it.

**What a person hits:** 90 approvals raised for one internal tool, zero ever answered. The database explains why: an approval is answerable only by the exact individual it was raised for. The workspace owner cannot answer it, an admin cannot answer it, and if that person is on holiday or has left, the run behind it is blocked permanently with no path to unblock. Backlog item 1 puts the ask inline in the run, which is right, but inline or queued it is still answerable by one person only.

**Fix:** Add a second SELECT/UPDATE policy admitting owner and admin of the approval's workspace, mirroring the role predicate already installed by 20260805130000_role_aware_writes_on_governance_tables.sql, and surface the refusal through `writeDeniedReason` (src/lib/governance.functions.ts:242) so a member who cannot answer is told why instead of seeing a silent zero-row success. Ship before item 1, or the inline consent card inherits the same dead end at a nicer address.

### [HIGH · S] Stop the track reads from reporting a database failure as "you have no work"

**Evidence:** src/lib/spine/track.functions.ts:330-331 (`listTracks` catch → `return []`), :347-348 (`getTrack` catch → `return null`), :789-790 (`attachToTrack` → `{ ok: false }` with no reason), :923-924 (`getTrackChain` → empty chain), :967-968 (`getTrackActivity` → `{ turns: [] }`). Fifteen catch blocks in the file, and none of them distinguishes the pre-migration table-missing case the header justifies (:22-27) from a live error.

**What a person hits:** When the read genuinely fails — an RLS change, an expired token, a schema drift — the person sees an empty run with no steps and no message, identical to a track that has honestly done nothing yet. This is the second failure START-HERE names as having cost three months: the system stops and cannot say so. It also makes every verification pass unreliable, because an empty pane is not evidence of anything.

**Fix:** Narrow each catch to the documented pre-migration code only (`42P01`, which track-tick.ts:104-107 already handles correctly by name) and let anything else return a typed refusal the surface can render. `DriveNowResult.stopped` already carries a refusal vocabulary; extend the same shape to the read fns rather than inventing a second error channel.

### [HIGH · S] Stop rendering a failed database read as "nothing here yet" — let the existing isError branches fire

**Evidence:** `getTrackActivity` swallows every error: `} catch { return { turns: [] }; }` (src/lib/spine/track.functions.ts:967-968). React Query therefore never sees a rejection, so `q.isError` in TrackActivity.tsx:96 is unreachable for any DB failure and the component falls through to TrackActivity.tsx:115, "Nothing is recorded against this work yet." Same shape in `getTrackChain` (track.functions.ts:924, returns `{track:null, chain:empty}` → TrackChain.tsx:132 renders "That work could not be found") and `listTracks` (track.functions.ts:330-331, returns `[]` → an empty work list). The `ReadFailedLine` components are already imported and already written in both files. 284 instances of `} catch {` across src/lib.

**What a person hits:** When the database is unreachable the product tells a person their run has no history and their work list is empty. It is a confident false statement at the exact moment the person most needs to know the screen cannot be trusted — and it is indistinguishable from a genuinely new track.

**Fix:** In track.functions.ts, make the three read handlers rethrow rather than swallow (or return a `{ readFailed: true }` discriminant the components branch on). `getTrackActivity`:967, `getTrackChain`:924, `listTracks`:330. No UI work is needed for the first two — TrackActivity.tsx:96 and TrackChain.tsx:117 already render the correct sentence the moment the promise rejects.

### [HIGH · M] Record every stop as an event — `last_hold` is one mutable column with no history

**Evidence:** The driver overwrites a single column on every path out of a tick: `.update({ last_hold: ... })` at src/lib/spine/driver.server.ts:988, 1105, 1367, 1387, 1423, 1457, 1499, 1559, and clears it at 937/1586/1593. Nothing appends. `stage_events` is the trail (`recordStageEvent`, used by advanceTrack and retryStation) and carries only forward moves for tracks: live prod `select entity_type,to_stage,count(*) from stage_events group by 1,2` returns spine_track rows only for decide 34, sense 20, design 17, define 17 — 88 transitions, ZERO hold rows. `select table_name from information_schema.tables where table_name ilike '%hold%'` returns nothing. Meanwhile 397 agent_runs carry `failure_kind='model_error'` and `error_events` shows `spine.driver.missionForTrack` failing 14 times, latest 2026-08-23.

**What a person hits:** Nobody can answer "why did the agent stop working on this, and when" — not the person whose work it is, not us. A track that held `needs-evidence` for three days then flipped to `out-of-time` has erased its own diagnosis, so we cannot tell whether a fix worked. For an enterprise buyer this is the audit trail, and the audit trail records only the steps that succeeded.

**Fix:** Widen `stage_events` to accept a hold event for `spine_track` (its CHECK was already widened once for spine_track in migration 20260801150000) and have the driver write one row wherever it writes `last_hold` — from/to the same station, `actor: 'system'`, the reason in the payload. Copy `retryStation`'s call shape at track.functions.ts:675-683, which already writes a same-station stage_event with `actor: 'human'`. Then `readCorrections` (correction.server.ts:76) has a real history to read instead of one overwritten column.

### [HIGH · M] Make spine_tracks readable by the workspace, not only its author

**Evidence:** supabase/migrations/20260801130000_spine_tracks.sql:126-127: `CREATE POLICY "own tracks all" ON public.spine_tracks FOR ALL USING (auth.uid() = user_id)`. The table has a `workspace_id` column and indexes on it (same file, lines 114-116), but no policy uses it; `spine_track_members` inherits the same per-user rule at lines 132-139. `listTracks` and `getTrack` (track.functions.ts:317-350) pass no workspace filter and rely entirely on that policy. The route's own header (src/routes/_authenticated.track.$trackId.tsx:23-25) states the test it was built against: "a finished run can be sent to somebody, and a tab inside another page cannot be sent to anybody."

**What a person hits:** A colleague in the same workspace who opens a shared run link gets "That work could not be found" (TrackChain.tsx:132). One person's runs are invisible to their team, which makes the single linkable address useless for the thing it was built for and makes the product single-player at the exact layer an enterprise buyer evaluates.

**Fix:** One migration replacing both policies with the workspace-membership shape the rest of the schema already uses — `USING (workspace_id in (select workspace_id from workspace_members where user_id = auth.uid()))` for SELECT, keeping `auth.uid() = user_id` on WITH CHECK for writes so authorship stays attributed. Grep an existing workspace-scoped policy in supabase/migrations/ and copy it verbatim rather than inventing a second predicate. Verify with a two-user SELECT before and after.

### [HIGH · S] Carry the failure reason into the transcript — `failed` and `halted` both render as the bare word "stopped"

**Evidence:** `OUTCOME` (src/lib/spine/activity.ts:79-86) maps both `failed` and `halted` to `"stopped"`, and the `Turn` type (activity.ts:71-77) has no field for a cause at all. `getTrackActivity`'s select (track.functions.ts:950) reads `id,agent_slug,agent_name,status,output,created_at,spend_used_usd` — it does not read `failure_kind` or `halted_reason`, both of which exist on `agent_runs`. TrackActivity.tsx:75-81 renders that as the single word "stopped". Live prod: 561 `failed` runs and 730 `completed_with_failures` runs carry a `track_id`; 397 of them have `failure_kind='model_error'`; the 8 halted runs are the only ones with a `halted_reason` and one of them is on a track. `failure_kind` is read nowhere outside aggregate observability (observability.functions.ts:106, run-analytics.functions.ts:65).

**What a person hits:** Two thirds of every run attached to a track did not complete cleanly, and the transcript — the surface R-13 made the whole left pane — tells the person one word. They cannot tell a model error from a missing tool from a boundary refusal, so they cannot fix any of them.

**Fix:** In track.functions.ts:950 add `failure_kind,halted_reason` to the select, and in activity.ts add `failure: { kind: string | null; halted: string | null } | null` to `Turn`, populated at activity.ts:136 beside `outcome`. That is the whole MAIN half and it is one file each. File the L0 follow-up as the seam: TrackActivity's `sub` (TrackActivity.tsx:141-160) appends the reason after the station name, using the same trim it already applies to `said`.

### [HIGH · M] Give the auto-approval audit trail a reader — three writers, zero readers

**Evidence:** `recordAutoApproval` writes `AUTO_APPROVED_ACTION = "decision.auto_approved"` into `workspace_audit_log` (src/lib/decision-gate.server.ts:56, :83) from three call sites: src/lib/ai/handoff.server.ts:827, src/lib/ai/tools/registry.server.ts:4249, src/routes/api/public/hooks/trigger-tick.ts:453. Grepping `AUTO_APPROVED_ACTION` or `decision.auto_approved` outside that one file returns zero hits. The only reads of the table anywhere (src/lib/workspace-claim.functions.ts:147, :910) filter `.in("action", CLAIM_ACTIONS)`, which excludes it. No route or component reads the table at all.

**What a person hits:** An agent approved its own draft and shipped a decision the buyer never saw. They ask why. The answer was written down at the moment it happened — the gate's verbatim reason, the agent slug, the mission — and there is no surface, export or query in the product that can show it to them. R-16 names an audit trail as one of the four enterprise-buyer tests.

**Fix:** Add `listWorkspaceAudit(workspaceId, {actions?, since?, limit})` in src/lib/ (the RLS already lets workspace members read the table; no elevation needed) returning action, actor, `detail.reason`, `detail.agent_slug`, timestamp. Reuse `Receipt` (src/components/meridian/Receipt.tsx), which MembersCard already renders for the same shape. LANE 1 then mounts it under Settings → Your data as "What happened without you" — the seam is the server fn, nothing else crosses.

### [HIGH · S] Widen StalledWork's `reason` to the real HoldReason union so a stopped run states its actual cause

**Evidence:** src/components/meridian/StalledWork.tsx:96 types `reason?: "you" | "source"`, and lines 212-216 render the hardcoded sentence "No source is connected, so there is nothing for this to read" for EVERY item whose reason is not "you". Meanwhile src/lib/spine/driver.ts:660-692 carries 11 distinct hold reasons with correct, already-written sentences (`out-of-credit`, `over-budget`, `needs-a-waived-station`, `corrections-spent`, …), and `holdTone` (driver.ts:775-779) returns "you" | "hold" | null — a value StalledWork cannot accept. The branch is currently unreachable in production because `/approvals` never passes `reason` (src/routes/_authenticated.approvals.tsx:316-322); it goes live the moment the run surface uses this component.

**What a person hits:** A run that stopped because the account ran out of credit is told "No source is connected." They go and connect a source, and it stops again. R-13 makes the transcript the left pane and this is the component that reports its stops — it will be wrong on 10 of the 11 ways a run can stop.

**Fix:** Change `StalledItem.reason` to `HoldReason` (imported from src/lib/spine/driver.ts) and render `HOLD_LINE[reason]` instead of the literal string; keep the accent keyed on `HOLD_NEEDS_PERSON` (driver.ts:754). Every sentence already exists — this is wiring, not writing. The `/meridian` gallery fixtures (src/routes/_authenticated.meridian.tsx:1089) need their `reason` values updated in the same commit.

### [HIGH · S] Make the digest job read the Digest routine switch, or take the switch off the surface

**Evidence:** src/lib/routines-catalog.ts:68-74 defines `{id: "digest", name: "Daily digest", jobName: "digest-tick"}`, and RoutinesPanel draws it a real `Toggle` writing `workspace_routine_prefs` (src/lib/routines.functions.ts, toggleRoutine). src/routes/api/public/hooks/digest-tick.ts is 23 lines and never reads `workspace_routine_prefs` and never calls `markRoutineRun` — it calls `sendDueDigests(supabaseAdmin)` unconditionally. All 8 other catalog jobs import `markRoutineRun` from src/lib/routines.server.ts (cluster, derive, researcher, outcome, scout, competitor, steward, sense). Because `markRoutineRun` never fires for digest, its last-run line renders `relativeTime(null)` = "not yet tracked" permanently.

**What a person hits:** Someone turns off the Daily digest for their workspace on the Safety room's "Runs on its own" tab, and the digest keeps sending. The row also says the routine has never run, which is false. This is a governance surface — a control that lies here is the one that costs the most trust.

**Fix:** In digest-tick.ts, gate `sendDueDigests` per workspace on `workspace_routine_prefs.enabled` for `routine_id = 'digest'` and call `markRoutineRun("digest", workspaceId)` — copy the exact shape from sense-tick.ts:225 and 315, which already does both. Do not add a new helper.

### [HIGH · M] Stop using `disabled` to carry a permission reason or a busy state — 54 controls hide the reason in a title nobody can reach

**Evidence:** 54 `<Action>`/`<Approve>`/`<button>` call sites combine `disabled` with a `title` that is the only statement of why. Enterprise-critical instances: `src/components/governance/GuardrailsPanel.tsx:409`, `:512`, `:794` all read `title={writeDenied ?? undefined}` on a disabled control — a permission denial. Also `EvalsPanel.tsx:379` ("Name it first"), `CommitCeremony.tsx:161`, `HouseRulesPanel.tsx:228` (`title={decideWrite.reason}`). A disabled button is not focusable, so `title` never fires from the keyboard and never fires on touch. Separately, `CONTROL_DEAD = "disabled:cursor-default disabled:opacity-45"` (`src/components/meridian/surface-parts.tsx:427`) measured through oklch→sRGB: label-vs-face is 3.56:1 (dark/primary), 2.74:1 (dark/default), 2.62:1 (light/primary), 2.16:1 (light/default) — the paint assumes the WCAG "inactive component" exemption, which does not hold for a control that is only busy or only permission-blocked.

**What a person hits:** An enterprise user whose role denies a write gets a grey button and no reason at all — no reason by keyboard, no reason on a tablet, and 2.16:1 grey text if they can hover. R-16 requires "a failure that says what failed"; this is a failure that says nothing. The same control is also the one that says "unavailable" for the whole round trip of a save.

**Fix:** Add a `reason?: string` prop to `Action` and `Approve` in `src/components/meridian/surface-parts.tsx:548` and `:626`. When `reason` is set, render `aria-disabled="true"` instead of `disabled` (so the control stays focusable and announces), keep `onClick` inert, and expose the text through `aria-describedby` pointing at an `sp-sr-only` span (class exists, `src/styles/primitives.css:1969`). Leave `disabled` for genuinely inactive controls. Then convert the 54 sites — start with the three `writeDenied` sites in `GuardrailsPanel.tsx`, which are the permissions story an enterprise buyer opens first.

### [MEDIUM · S] Scope the learnings read to the workspace the reader is standing in

**Evidence:** src/lib/outcome.functions.ts:2087 — `if (data.workspaceId) q = q.eq("workspace_id", data.workspaceId)`, so omitting it returns every workspace the caller belongs to. Two callers omit it: src/routes/_authenticated.decide.tsx:1035 and src/components/discover/OpportunityDetailSheet.tsx:1017, both keyed `["learnings"]` with no workspace segment. Four other call sites do pass it (LearningDetail.tsx:189, CompoundingPanel.tsx:180, OutcomeHistory.tsx:87, learn.tsx:345). The route's own comment at decide.tsx:2273-2288 records the measurement: 49 learnings carry a `new_ice`, 48 of them sit in a sample workspace, and the unscoped read makes them reachable while standing in a real one.

**What a person hits:** A consultant or contractor who belongs to two customers' workspaces sees one customer's recorded outcomes rendered while standing in the other's. It is not a cross-tenant breach — RLS still bounds it to the caller's own memberships and the surface was taught to add a provenance clause — but "rows from another client's workspace on this screen, mitigated by a sentence" is not an answer that survives a security review.

**Fix:** Pass `activeWorkspaceId` from `useWorkspace()` at both call sites and key them `["learnings", activeWorkspaceId]`, which is what the four correct callers already do and what the WM-F8 switch-clearing in src/hooks/workspace-query-scope.ts assumes. Where a cross-workspace match is genuinely wanted, ask for it explicitly rather than by omission.

### [MEDIUM · M] Extend ROUTINES_CATALOG to cover what actually runs unattended — the tab shows 9 of 35 jobs as if it were the list

**Evidence:** src/lib/routines-catalog.ts holds 9 entries. `ls src/routes/api/public/hooks/*-tick.ts` excluding tests returns 35 files. Only 8 of those 35 read `workspace_routine_prefs` at all. The tab that renders the 9 is labelled "Runs on its own" with the descriptor "What runs on its own, and your switch over each one" (src/lib/engine-room-glance.ts:283-288), inside the Safety room whose question is "What is it allowed to do?" (:124). Nothing on the panel states that the list is partial, and RoutinesPanel's header calls it "The platform's background pg_cron jobs" — all of them, by its own words.

**What a person hits:** A buyer walked through the governance surface is shown nine jobs and a switch for each, and concludes that is everything running unattended in their workspace. Twenty-six more jobs — including the ones that spend money and write to their record — run with no switch and no row. That is the exact claim an enterprise security review is built to catch.

**Fix:** Extend ROUTINES_CATALOG with every tick that touches workspace data or spends credits (loop-tick, track-tick, embed-tick, memory-tick, retention-tick, drift-tick, eval-tick, calibrate-tick and the rest), each with its `jobName` and cron string, and add the `workspace_routine_prefs` guard + `markRoutineRun` to each tick using the sense-tick.ts:225/:315 pattern. Where a job genuinely must not be switchable (retention, credit accounting), give it a catalog entry that says so rather than omitting it — an absent row is what makes the list read as complete.

### [MEDIUM · S] Publish breakpoint tokens in meridian.css — the only design system has no breakpoint, and item 8 is about to invent one

**Evidence:** `src/styles/meridian.css` is 2402 lines and contains exactly two `@media` blocks, both `prefers-reduced-motion` (`:2066`, `:2394`). Zero width media queries. One of 47 `.tsx` files in `src/components/meridian/` uses any responsive prefix — `surface-parts.tsx:425`, `max-md:min-h-11 max-md:min-w-11`, which is the system's only touch-target rule and is undocumented. Meanwhile `shell.css` (the retired paint layer) carries 12 width breakpoints at three different values (640, 860, 900, 1100), and `SPEC-LAYOUT.md:85` tells LANE 1 to stack the workbench "below the Meridian breakpoint" — a thing that does not exist. Across all of `src`, 25 of 475 `.tsx` files use any responsive prefix; 6 of 114 route files do.

**What a person hits:** Nobody hits this directly — it is the mechanism by which the next five surfaces each break at a different width. `run-rows.tsx` exists because three authors built one run view three ways and every check passed; this is the same shape, on the axis nobody has an automated check for. Backlog item 8 (two-pane at /track/:id) and item 2 (/start) will each pick their own number this week.

**Fix:** Add the stops to `meridian.css` beside the spacing scale as tokens (`--mrd-bp-stack: 760px`, `--mrd-bp-narrow: 900px`, `--mrd-bp-phone: 640px`) using the numbers already argued for in `SPEC-LAYOUT.md:85` and `shell.css:2129`, and document them in `docs/design/DESIGN-SYSTEM.md` with the container-query-not-media-query rule the spec already states (`SPEC-LAYOUT.md:85`: "Because it is a container query, the split survives the rail collapsing — a media query would fight it"). Also document `max-md:min-h-11` as the system's touch-target minimum so the next control does not lose it. Do this before item 8 unblocks, not after.

---

## LANE0 — 11 findings

### [BLOCKER · M] Start a track from the one sentence onboarding already collects

**Evidence:** src/components/onboarding/ObsidianOnboarding.tsx:1076-1170 — `mFinish` takes the typed belief, runs `runWedgeTeardown`/`runCriticReview`, writes an opportunity, stashes the review in sessionStorage and calls `finishOnboarding()`, then navigates to /today (:1180). No `startTrack` import exists anywhere under src/components/onboarding/. `startTrack` (src/lib/spine/track.functions.ts:293) has exactly one UI caller in the repo — TrackStart.tsx:77, mounted at src/routes/_authenticated.plan.index.tsx:893 behind roughly six clicks.

**What a person hits:** The product asks a brand-new person for exactly one sentence in its first sixty seconds — the R-18 clause 4 moment — and spends it on a one-shot teardown. They land on /today with an opportunity row and no run, and there is no surface anywhere that turns that sentence into work walking the stations.

**Fix:** After the teardown resolves, call the existing `startTrack` server fn with `{ title: belief.slice(0,200), shape: "new-capability", origin: belief }` and make the results screen's primary control navigate to `/track/$trackId` with that id. `new-capability` is the only shape that keeps `decide` on the route (src/lib/spine/route.ts:189), so the forecast survives. Do not build a new composer for this — the belief input at :1580 is already the field.

### [BLOCKER · S] Stop hiding the retry control on the four holds it was built to clear

**Evidence:** src/components/spine/TrackStart.tsx:465-466 sets `waitingOnAPerson = holdTone(t.holdReason) === "you"`; line 535 renders the MoreMenu only when `!waitingOnAPerson`, and the `retryStation` item ("Let X try again") is inside it at TrackStart.tsx:561-572. `holdTone` (src/lib/spine/driver.ts:770-775) returns "you" for FOUR reasons, not one: HOLD_NEEDS_PERSON (driver.ts:754-759) = waiting-on-a-person, station-cannot-finish, corrections-spent, given-up. `retryStation`'s own header (src/lib/spine/track.functions.ts:567-575) says it exists precisely because "a track holding `station-cannot-finish` or `given-up`, both of which no code path clears, was dead to its owner". Live prod (select last_hold, count(*) from spine_tracks group by 1): given-up 4, corrections-spent 2 — 6 tracks whose only escape hatch is rendered `null`.

**What a person hits:** Six pieces of work in the live workspace are permanently frozen with zero controls on them. The person fixed the real cause outside the product, comes back to say so, and the button that would say it is not drawn. Their only options are skip the station that failed or close the work.

**Fix:** In TrackStart.tsx replace the `waitingOnAPerson` gate on line 535 with a narrower test on the raw reason: hide the menu only for `holdReason === "waiting-on-a-person"` (answering the call is the move there), and keep it for station-cannot-finish, corrections-spent and given-up. Nothing new is built — `retryStation` and `release.mutate` are already imported and wired at TrackStart.tsx:47/80.

### [BLOCKER · M] Show the hold on /track/:trackId — wire the existing getTrack, which has zero callers

**Evidence:** `getTrack` (src/lib/spine/track.functions.ts:335-350) returns the full Track including `hold` (the rendered sentence from `holdLine`) and `holdReason` (the raw column) via `rowToTrack` (track.functions.ts:151-154). Grep for `getTrack` across src/ excluding its own file and tests: ZERO importers. `TrackRun.tsx:48` imports only `driveTrackNow`; the page composes TrackRun → TrackChain → TrackActivity and none of the three reads `spine_tracks.last_hold`. Live prod: 57 of 59 tracks carry a non-null `last_hold` (out-of-time 23, needs-evidence 17, waiting-on-a-person 9, given-up 4, produced-nothing 2, corrections-spent 2). The one linkable address a piece of work has says nothing about any of it until you press "Run it now".

**What a person hits:** A person opens their run's own page and sees a route, a transcript, and a button. Nothing tells them the run gave up four days ago, why, or whether it is on them. Silence and "still working" look identical — the exact defect RULINGS.md names as costing three months.

**Fix:** In TrackRun.tsx add a `useQuery` on `getTrack` keyed `["spine-track", trackId]` and render `track.hold` as the region's lead sentence with a `StatusChip` toned by `holdTone(track.holdReason)` — both helpers already exported from @/lib/spine/driver and already used this way in TrackStart.tsx:465-546. Invalidate that key alongside the two existing ones in the drive mutation's `onSuccess` (TrackRun.tsx:83-85). Put the `retryStation` control on it too, so the release lives where the work is rather than at /plan.

### [BLOCKER · S] Wrap the run transcript and the walk result in live regions so a screen reader hears the run move

**Evidence:** 22 files in src poll or stream (`refetchInterval`/`EventSource`/`getReader`); 27 files carry `aria-live`. The intersection is EMPTY — not one asynchronously-updating surface announces. The core case: `src/components/spine/TrackActivity.tsx:91` refetches every 10s and has zero `aria-live`/`role="status"` in 178 lines; `src/components/track/TrackRun.tsx:104` renders `STOPPED_LINE[result.stopped]` ("It reached the end of its route.") and `:112` renders every station step, both in plain `<Row>`s. `src/components/meridian/run-rows.tsx` — the vocabulary R-13 rules the transcript must use — has 0 importers and 0 live regions.

**What a person hits:** A blind or low-vision person presses "Run it now" on /track/:id and hears nothing again, ever. The agent works, hands off, files artifacts, finishes or stalls — total silence. The one sentence the whole product exists to deliver ("it reached the end of its route") is never spoken. The product goal says the person *watches* the work carried to the last station; for this user there is nothing to watch and nothing to hear.

**Fix:** Wire the pattern Meridian already ships: `Reading` (`surface-parts.tsx:932-937`) and `ReadFailedLine` (`:1098-1104`) are already `role="status" aria-live="polite"`. In `TrackActivity.tsx`, wrap the `ordered.map` output in a `<div role="log" aria-live="polite" aria-relevant="additions">` so each new turn announces once. In `TrackRun.tsx:100-121`, put the result block in `role="status" aria-live="polite"` so the stop reason and step lines announce when the walk returns. Do NOT announce the whole list on every 10s poll — key the log on additions only. File `coordination/requests/mrd-live.md` asking MAIN to promote it to a `Live` primitive so the other 20 polling surfaces get it once.

### [HIGH · L] Give every empty state a door out, and stop Approvals describing agents that are not running

**Evidence:** 216 `<NothingYet>`/`<NothingHere>` instances across 86 files; 50 pass an `action` prop and 166 do not, counted by walking each element to its closing tag. In LANE 0's path: 129 instances, 96 with no action. The two a brand-new account reaches first from the rail (AppFrame.tsx:319-410) — src/components/governance/ApprovalsPanel.tsx:326, 'Nothing is waiting on you. The agents are running inside their lanes, and when one needs a decision to run a tool it lands here', on an account where nothing has ever run; and src/routes/_authenticated.threads.tsx:700, 'Nothing has been asked in this workspace yet.', with no control at all. surface-parts.tsx:994-1008 already takes `action` and its header says it is omitted only 'wherever there is genuinely nowhere to go'.

**What a person hits:** A new person clicks the rail, hits four surfaces in a row that each tell them something is absent, and is handed nothing to press on any of them. Approvals goes further and describes agents working inside lanes on a workspace where no agent has ever run — the exact sentence class R-03 rejected.

**Fix:** Sweep the 96 in src/components/** mechanically in one pass, not one at a time: each either gets an `action` naming where to go, or is deleted with the reason in the unit file. ApprovalsPanel:326 must stop asserting activity — say what is true (nothing has run here yet) and carry the control that starts one. The remaining 69 of 86 in src/routes/** are the identical defect on LANE 1's path and should be filed as its own item so no two writers share a file.

### [HIGH · S] Stop Settings promising "Forget" — no control exists and the RPC behind it is inert

**Evidence:** src/components/settings/DataSection.tsx:77-80 renders, as a first-class Line under "What archive, delete and forget each mean" (:218-225): "Forget — Removes something from the brain itself. A deliberate, warned step of its own, never a side effect of tidying up." There is no Forget control anywhere: grep for `forget` across src/routes/_authenticated.brain.tsx and src/lib/memory*.ts returns nothing. src/lib/compliance/erasure.ts:21-23 only names the RPCs as string constants; no code anywhere calls `.rpc("forget_workspace")` or `.rpc("forget_account")`, and the RPC itself is a strict no-op because `right_to_erasure_enabled()` returns false (supabase/migrations/20260621012900_data_retention_b_right_to_erasure.sql:51-56).

**What a person hits:** A buyer doing a data-protection review reads a page that describes three deletion tiers and can only perform two. Export works; erasure is a paragraph. The pane's own five-question header bans "a control that cannot do the thing it draws" — this is the same defect one step earlier, copy that draws a capability with no control at all.

**Fix:** In DataSection.tsx, mark the Forget tier the way Enterprise already marks unbuilt capability ("Planned, not yet shipped: …", src/lib/entitlements.ts:487) and say erasure is an operator action requested through support today — which is true, since the RPC is service-role only by design. Keep Archive and Delete unchanged. Name the seam in the unit file: MAIN owes `requestErasure` + flipping `right_to_erasure_enabled()`, which is a founder call on live data and must not be assumed.

### [HIGH · M] Show the plan cap and the current count where the object is created — every cap on the pricing grid is switched off

**Evidence:** src/lib/entitlements.ts:527 sells Free as "2 products, 1 workspace" and :453 sells Business at $50/mo on "Unlimited products and workspaces". Both product and workspace caps are dormant: `limit_gates_enabled()` returns false (supabase/migrations/20260619200000_wm_m5_tier_limit_gates.sql:33) and every check honours it (src/lib/limits.functions.ts:80-96). Seats are the same story — supabase/migrations/20260802200000_enforce_seat_limit_on_membership.sql:16-23 records "4 members across 2 `pro` accounts, against a limit of 1" as the live state. Nothing in the UI shows a count against a cap before the write: src/components/settings/ProductsTab.tsx:95-105 catches the create error and toasts `e.message`, discarding `LimitReachedError.upsellTier` (which does not survive the server-fn boundary anyway). Consumer counts outside entitlements.ts: `productLimit` 0, `workspaceLimit` 0, `approvalLanes` 0 (sold at :447), `topUpCapPerCycle` 0, `criticEverywhere` 0. The connector cap is the one live exception — enforced at src/lib/connections.functions.ts:214 plus its own trigger, outside the flag.

**What a person hits:** Free gets everything Business is priced on, so nobody upgrades for the reason the grid gives. When the flag is eventually flipped, existing accounts hit a wall they were never shown a count against — the first time they learn a limit exists is when a create fails.

**Fix:** In ProductsTab and MembersCard/TeamCard, render the cap beside the count using data both already load: `entitlementsFor(tier)` is a pure import from src/lib/entitlements.ts, product count comes from the existing `getPortfolio` query, member count from `listWorkspaceMembers`. One Line each: "2 of 2 products on Free." Same treatment in PlanPicker for the lines with zero enforcement — mark them the way :487 already marks unbuilt Enterprise capability. Name the seam: MAIN owns whether `limit_gates_enabled()` flips, which is a founder call on live accounts.

### [HIGH · M] Pass `busy` at the 65 Action/Approve call sites that still disable on a pending flag and announce nothing

**Evidence:** `src/components/meridian/surface-parts.tsx:564-566` records the count: "Counted 2026-08-21: 196 `Action` call sites disable on a pending flag and **not one** announced it." Re-measured today across all 629 `Action`/`Approve`/`ActionLink` call sites: 105 disable on a pending-ish flag, 40 now pass `busy`, **65 still do not** (50 in LANE 0 paths, 10 in LANE 1). The two that matter most are the gates the docstring at `:640-643` singles out as "the control that spends the longest saying nothing": `src/components/learn/SettlePanel.tsx:781` `<Approve disabled={settle.isPending || ...}>` and `src/routes/_authenticated.plan.spec.$id.tsx:1869` `<Approve disabled={approve.isPending || save.isPending}>`. Others: `TrackStart.tsx:392`, `CommitCeremony.tsx:161`, `DecisionDetail.tsx:381`, `OutcomeCard.tsx:301`, `NotificationsSection.tsx:276`.

**What a person hits:** Press Approve, and a screen reader says "unavailable" for the entire round trip — for the whole time the thing is actually working. "Unavailable" and "working on it" are different facts and only one is true. On the gate controls this is the moment a person commits to a decision, and the product tells them their own click failed.

**Fix:** Mechanical, one prop, no design decision. `busy` implies `disabled`, so where the flag is a single pending reference (`disabled={save.isPending}`) replace it with `busy={save.isPending}`. Where it is mixed (`disabled={!dirty || save.isPending}`) keep `disabled={!dirty}` and add `busy={save.isPending}` — the component ORs them at `surface-parts.tsx:590-592`. Sweep every field mechanically rather than one at a time; a defect this shape hides in the ones you did not look at. Take the 55 sites under `src/components/**` (excluding `meridian/` and `shell/`); file the 10 route-level ones to LANE 1.

### [MEDIUM · S] Narrow the onboarding phase restore to the two phases that still render

**Evidence:** src/components/onboarding/ObsidianOnboarding.tsx:255 — `type Phase = "critic" | "results"`. The initializer at :669-679 reads `sessionStorage.getItem("supaprod.onboarding.phase")` and accepts `"arrival"`, `"product"` and `"data"`, casting them straight to `Phase`. Only :1313 and :1492 render; the component's final statement is `return null` at :1717. The file's own header at :1197-1207 confirms those three phases died on 2026-08-10. Onboarding is chromeless (_authenticated.tsx:125, :196-202) and the gate re-redirects to /onboarding on every navigation (:69-74).

**What a person hits:** A person whose tab still holds one of the three retired phase values sees a completely blank viewport — no rail, no header, no control, no text — and every navigation puts them straight back on it. There is no way out of the account except clearing site data.

**Fix:** One line at :672-678: accept only `"critic"` and `"results"`, fall through to `"critic"` otherwise. While in there, delete the dead `elapsed` stopwatch the file names at :693-704 — it wakes every 500ms, sets state and renders to nothing because no caller passes `Frame`'s `showTimer` prop.

### [MEDIUM · M] Redraw onboarding in Meridian — it holds half the retired --ds-* tokens left in the product

**Evidence:** src/components/onboarding/ObsidianOnboarding.tsx carries 47 `--ds-*` usages, more than the other eleven files under src/components + src/routes combined (~45 between them; next highest is Primitives.tsx at 16). `INPUT_STYLE` at :279-290 and the verdict palette at :1494-1511 are raw Tempo, and :275-277 depends on the `[data-obsidian] :focus-visible` rule for its focus ring. `--ds-*` is retired under BUILD-QUEUE acceptance rule 4; it still resolves only because src/styles.css:1769-1900 keeps the Tempo scale on `:root` and 66 `[data-obsidian]` rules survive in that file.

**What a person hits:** The first sixty seconds of the product are drawn in a design system nothing after them uses — different input chrome, different greys, a different focus ring — so the app appears to change identity the moment a person finishes onboarding. It is also the surface that silently breaks the day the Tempo layer is removed, and no existing user will ever report it.

**Fix:** Port only what this screen actually draws, to primitives that already exist: `Action` (imported at :15), `Input` from meridian/forms.tsx for the belief box, `Value` for the verdict stamp, `Region`/`Row` for the results sections. If the hero belief field has no Meridian equivalent, file `coordination/requests/mrd-composer.md` — GAP-2 in SPEC-ONRAMP asks for exactly that component — and use a local one meanwhile per R-17. Never widen the baseline to pass the ratchet.

### [MEDIUM · S] Say what failed when a run refuses to start

**Evidence:** src/components/track/TrackRun.tsx:97-98 — `run.isError ? <Row lead="The walk could not start. Nothing was moved." /> : null`. The thrown message is discarded. The server side has real sentences to give it: `driveTrackNow` returns `stopped: "not-found"` and the driver's hold reasons include `over-budget` (src/lib/spine/track-caps.server.ts, driver.server.ts:1387) and `out-of-credit` (driver.server.ts:1452), and the route's own errorComponent (_authenticated.track.$trackId.tsx:30-38) likewise renders "This run did not load" over a console.error.

**What a person hits:** The run stops and the person is told only that it stopped. "Your credits ran out", "this workspace is paused" and "the server is down" all render as the same nine words, so there is nothing to act on and no reason to press the button a second time. Every one of those causes is one the person could actually fix.

**Fix:** Render the error's message alongside the lead line, and map the known hold reasons to their own sentence the way `STOPPED_LINE` (TrackRun.tsx:57-63) already maps the five `stopped` bounds — extend that existing record rather than adding a second copy string table.

---

## LANE1 — 9 findings

### [BLOCKER · S] Delete the beforeLoad redirect on /start before LANE 1 builds the landing there

**Evidence:** src/routes/_authenticated.start.tsx:13-16 — `beforeLoad: () => { throw redirect({ to: "/onboarding" }); }`, unconditional. Its `component` is MissionOnboarding (src/components/mission/MissionOnboarding.tsx, 155 lines); `grep -rn MissionOnboarding src/` shows this route file is its only importer, so it has been unreachable dead code. src/routes/_authenticated.tsx:125 also classes `/start` as chromeless onboarding (`pathname === "/start"`), so anything built there renders with no AppFrame, no rail and no GlobalComposer (:195-202, :232).

**What a person hits:** The founder opens /start to compare the new landing against /today side by side — the entire reason R-15 chose that URL — and gets bounced to /onboarding. Nothing the lane built is on screen, and the bounce looks like a broken build rather than a gate.

**Fix:** Remove the beforeLoad block and swap `component: MissionOnboarding` for the new landing; delete MissionOnboarding.tsx, whose only importer is that line. Then rule explicitly on _authenticated.tsx:125: if /start stays in the `isOnboarding` branch it has no rail, so backlog item 10 ('a live run is one click from any surface') cannot be true on the landing itself.

### [BLOCKER · M] Point the first-run gate at the new landing — item 2's acceptance is unmeasurable while /onboarding wins

**Evidence:** src/routes/_authenticated.tsx:69-74 throws `redirect({ to: "/onboarding" })` for any account with `profiles.onboarded === false` (src/lib/onboarding-gate.ts:36-61), before any other route resolves. R-15 §2 says promotion is 'one line' in that beforeLoad, pointing it at /start 'instead of /today' — but that beforeLoad contains no /today redirect at all; it only redirects to /login and /onboarding. /today is actually reached from `SIGNED_IN_HOME` in login.tsx:26/:63 and signup.tsx:47/:141, seven `throw redirect({ to: "/today" })` sites, and 23 `to: "/today"` navigations.

**What a person hits:** A genuinely new account never sees the new landing — it sees the Critic screen. The click count recorded for item 2's acceptance ('New user reaches a running track in one click, zero configuration') will have been measured on a returning user, which is not the claim.

**Fix:** Two decisions, both cheap. (a) In _authenticated.tsx's beforeLoad, send `needsOnboarding` accounts to `/start` rather than `/onboarding` once /start renders the landing — the new landing IS the onboarding (LIVE-PREVIEW.md §4 already rules this). (b) Correct R-15's promotion note: flipping the signed-in home is the two `SIGNED_IN_HOME` constants plus the seven redirect sites, not one line. Record the real number before anyone plans against 'one reversible line'.

### [HIGH · S] Point the first brief's two doors at a run instead of at /decide and the chat pane

**Evidence:** src/routes/_authenticated.today.tsx:1404-1412 — the CriticBrief a new account sees on arrival (handed over via `supaprod.onboarding.criticReview`, written at ObsidianOnboarding.tsx:1160, read at today.tsx:1208) offers `onOpen={() => navigate({ to: "/decide" })}` and `onAnother={() => { setCriticResult(null); openAsk(); }}`. Its two controls are at today.tsx:406-408. /decide is a station-named route used as navigation, which R-01 bans outright; `openAsk` starts no track (finding above).

**What a person hits:** This is the single moment a new person has given the product a sentence and received a real result. Both ways forward lead away from any run — one into a station page named after our internal model, the other into a chat that produces nothing. The first brief is a dead end dressed as a beginning.

**Fix:** `onOpen` starts a track from `result.idea` (the same string already on the handoff object) and navigates to /track/$trackId; `onAnother` reopens the composer that starts a track rather than `openAsk`. Both are one-line changes inside a file LANE 1 already owns, and both become trivial once the onboarding-side `startTrack` call lands.

### [HIGH · M] Give held work a home on the landing — no post-auth surface reads spine_tracks

**Evidence:** `grep -rln "spine_tracks|listTracks|spine/track.functions" src/routes/ src/components/today/ src/components/shell/` returns only `_authenticated.track.$trackId.tsx` and the two api hook files. `_authenticated.today.tsx` (imports, lines 15-53) reads missions, approvals, learnings and forecasts — never a track. `useSpineStrip` (src/components/shell/use-spine-strip.ts:50-58) counts `listStudioSessions`, a different object. The only surface that lists tracks is `TrackStart`, mounted once at `_authenticated.plan.index.tsx:893`, and `listTracks` caps at 50 (track.functions.ts:327) against 58 open tracks live — so 8 are invisible even there. Live prod, the reasons `holdTone` calls "on you": waiting-on-a-person 9 + given-up 4 + corrections-spent 2 = 15 tracks waiting on a person right now.

**What a person hits:** Fifteen pieces of work are stopped waiting on a decision and the post-auth home mentions none of them. The person has to already know to navigate to /plan — a station-named door R-01 bans as navigation — to discover their own work gave up. This is R-04's dead approvals queue repeated for holds.

**Fix:** This constrains queue item 2 rather than duplicating it: the new `/start` landing must open with the held-work row before the job cards, or it ships a home that hides fifteen stuck runs. Call the existing `listTracks`, filter client-side on `holdTone(t.holdReason) === "you"`, render each as one row linking to `/track/:id` — the same `Row` + `StatusChip` shape TrackStart.tsx:470-546 already uses. Ask MAIN to raise the `.limit(50)` at track.functions.ts:327 and add a hold filter, since that file is MAIN's path.

### [HIGH · M] Give a phone a door: below 640px the authenticated product has no navigation at all

**Evidence:** `src/styles/shell.css:2129-2131` sets `.sp-rail { display: none }` at `max-width: 640px`, and `:1678-1681` hides `.sp-collapse` at the same width, so the control that reveals the rail goes with it. Nothing replaces either — there is no bottom bar, no drawer, no menu button (`grep -rn "bottom-nav|tabbar|sp-bottom"` returns nothing). The file's own comment at `:2098-2127` admits it: "seven doors are still missing on the size of screen most of a launch day arrives on... Until that lands this rule is a known hole, not a finished decision." Gone: Runs, Brain, Crew, Engine room, the board, the theme toggle, the shortcut sheet.

**What a person hits:** Someone opens Supaprod on their phone and can reach exactly two places — Today (the brand link) and Settings (via ScopeMenu). They cannot open a run, cannot reach approvals, cannot get to the Engine Room. R-04's whole thesis is that a question gets answered where the person is; the person with a pending gate is frequently on a phone, and there they cannot even find the run.

**Fix:** Build the sheet `shell.css:2114-2126` already specifies and costs almost no new CSS: a header button in `AppFrame.tsx` (beside `.sp-lede`, where `.sp-collapse` used to sit) opening an overlay that reuses the ShortcutSheet geometry — `.sp-keys` / `.sp-keys-scrim` / `.sp-keys-sheet` — with the same `<nav className="sp-nav">` and `<div className="sp-railfoot">` the rail already renders. One CSS line in the same commit: scope the `.sp-navlabel` / `.sp-navcount` `display:none` rules (the `[data-rail="narrow"]` pair at `:1317-1320` and the bare pair in the 900px block) to `.sp-rail`, or every row in the sheet arrives with its name hidden. `ShortcutSheet.tsx` already does the focus trap and Escape, so copy it, do not invent it.

### [HIGH · S] Add a skip link and move focus into <main> on every route change — 85 routes currently drop focus to the body

**Evidence:** `src/components/shell/AppFrame.tsx:2060` renders `<main className="sp-work" key={pathname}>`. The `key` forces a full remount on every navigation, so whatever was focused is destroyed and focus falls to `<body>`. There is no `id`, no `tabIndex={-1}`, and no effect anywhere in AppFrame that focuses on `pathname` change. Repo-wide grep for "skip to main", "skip to content", "skip-link", "skipnav" across `src/**/*.tsx` and all CSS returns ZERO hits. 85 `_authenticated.*` route files. The header + rail put roughly 7 controls plus 6 nav links plus 7 station chips ahead of the content.

**What a person hits:** A keyboard-only user navigates to a run and lands nowhere — the next Tab starts at the brand logo, and they tab through ~20 chrome controls to reach the run again. Every single navigation. A screen-reader user gets no announcement that the page changed at all, because a SPA title swap is not announced. In an 85-route product this is the difference between usable and unusable.

**Fix:** Three small edits in `AppFrame.tsx`. (1) Before `<header className="sp-top">` at `:1532`, add an `<a href="#work">Skip to the work</a>` styled off-screen with `.sp-sr-only` (`src/styles/primitives.css:1969`) and revealed on `:focus`. (2) Give the main `id="work" tabIndex={-1}` and drop nothing else. (3) Add `useEffect(() => { workRef.current?.focus(); }, [pathname])` plus an `sp-sr-only` `role="status" aria-live="polite"` node that renders the route's own title — every route already declares one (`_authenticated.track.$trackId.tsx:29` `head: () => ({meta:[{title:"Run · Supaprod"}]})`), so read it rather than hand-typing a second copy.

### [MEDIUM · S] Point /admin/ai-costs at the live spend read — two surfaces both called "Spend" answer from different sources

**Evidence:** The admin tab labelled "Spend" (src/routes/_authenticated.admin.tsx:72) reads `getMoatMetrics` (src/routes/_authenticated.admin.ai-costs.tsx:88), which selects from the materialized view `mv_agent_cost_per_decision` (src/lib/observability.functions.ts:242) — recomputed overnight, per that page's own header. The Engine Room room named "Spend" (src/lib/engine-room-glance.ts:129) reads `getAgentSpendBreakdown` (src/components/engine-room/rooms/SpendRoom.tsx:109), which queries live `ai_events` over a `days` window (src/lib/analytics.functions.ts:285-291). Both render per-agent cost. No test compares them and only one of the two says how stale it is.

**What a person hits:** An operator checking why an AI bill jumped opens two surfaces with the same name and gets two different per-agent numbers, up to 24 hours apart, with nothing on screen explaining which to believe. This repo's own rule is that a number without its query is not evidence — here there are two queries and neither is named.

**Fix:** Have the admin Spend tab call the existing `getAgentSpendBreakdown` for the per-agent block (same server fn, same query key, no new read), and keep `mv_agent_cost_per_decision` only for cost-per-DECISION, which is the one thing it computes that the live read does not. Print the window on both blocks ("last 14 days, live" / "recomputed overnight"). No new server function.

### [MEDIUM · S] Fix or drop `role="tablist"` on the station strip — it promises arrow-key navigation and delivers seven extra tab stops

**Evidence:** `src/components/shell/AppFrame.tsx:1668` sets `role={(strip.mode ?? "tab") === "tab" ? "tablist" : "group"}` and `:1715-1716` gives each of the seven chips `role="tab"` with `aria-selected`. There is no roving `tabIndex` anywhere in the strip and no arrow-key handler in the file (the only `ArrowUp`/`ArrowDown` in 2078 lines are at `:912-915`, in the run finder). No `aria-controls` and no `role="tabpanel"` exists. `use-spine-strip.ts` mounts a strip on every authenticated surface, so this ships everywhere, not only on runs.

**What a person hits:** A screen reader announces "tab 1 of 7" and the user presses the right arrow, as the pattern requires. Nothing happens. Meanwhile every keyboard user pays seven extra Tab presses in the header before reaching content on every authenticated screen — on top of the rail. The ARIA is worse than none, because it makes a promise the keyboard breaks.

**Fix:** Cheapest correct move: drop to the branch that already exists and is honest. `:1717` already renders `aria-pressed={on}` for the board's `role="group"` mode — use `role="group"` + `aria-pressed` in both modes and the contract is true with no new keyboard code. If the tab semantics are wanted, add roving tabindex (`tabIndex={on ? 0 : -1}`) plus Left/Right/Home/End on the container, which is ~15 lines. Either way this also removes six of the seven header tab stops, which is the friction half of the win.

### [MEDIUM · S] Keep the station's "waiting on you" count when the strip narrows — below 880px only a colour survives

**Evidence:** `src/styles/shell.css:636-640` — `@container spinestrip (max-width: 880px) { .sp-stage-state { display: none } }`. `.sp-stage-state` is the node at `AppFrame.tsx:1778` carrying `{stage.note}` ("9 runs waiting on you"). `display:none` removes it from the accessible tree too, so the chip's accessible name — which the comment at `:1765-1767` says is "01 Discover, 9 runs waiting on you" and calls "the most valuable thing on the chip" — silently loses the count. The status dot that repeats it is `aria-hidden` by design (`AppFrame.tsx:1780-1782`). The strip is a container query on `.sp-strip`, which spans the full app width, so 880px container ≈ 880px viewport: a laptop in a split window, or any tablet.

**What a person hits:** This is the one place the design contract spends colour on "something needs you" (R-12). At 880px and below, the count is gone from the screen and gone from the accessible name, and the only remaining signal is a coloured dot that is hidden from assistive tech and invisible to anyone with a colour vision deficiency. A person with nine things waiting on them sees a slightly warmer chip.

**Fix:** Do not delete the fact, only the visible line. In `AppFrame.tsx`, add a sibling `<span className="sp-sr-only">{stage.note}</span>` next to `.sp-stage-state` (the class is defined at `src/styles/primitives.css:1969`, and the same trick is already used ten lines up at `:1772` for the shortcut hint). `.sp-sr-only` is not inside the container query, so the count survives the collapse in the accessible name at every width. Optionally give the dot a shape variant rather than only a hue, the way `.sp-stage-mark` already carries station identity by silhouette.
