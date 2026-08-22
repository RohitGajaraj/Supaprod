# Reading the DeepSeek Harness: what to take, what not to, and why

> _Created: 2026-08-22_

**Read this before opening `deepseek-ai/deepseek-harness` again.** The question has been answered once,
at depth, and the answer is unlikely to change: 29 agents, 804 tool calls, all 40 packages and roughly
546k lines read from source rather than from READMEs, with an adversarial check behind every proposed
lift.

## The short version, so nobody re-derives it

**Can we copy it? Legally yes, practically no, and the reason is not licensing.**

- **Licence: MIT.** Reuse is permitted with attribution: the notice travels with any copied file and
  `THIRD_PARTY_NOTICES.md` gains an entry. Our own [`tech-stack.md`](../../decisions/tech-stack.md)
  policy is "lean permissive OSS, flag copyleft", so MIT clears the bar. **This is not the blocker.**
- **The blocker is the runtime, and it is measured.** **1,327 of 2,101 files (63%) import their own DI
  framework, `cordis`**; **463 files (22%) import `node:` builtins**; and the repo pins
  `engines: node ^22.19 || >=24`. **We run on Cloudflare Workers.** Copying one file drags the framework
  in with it.
- **21 adversarial checks, zero survivors as "copy this file."** Six rejected outright, nine idea-only,
  six survived as *adapt* — and every one of those six means "take the shape, write it ourselves in our
  own idioms", typically 20 to 60 lines.

**Theirs is a harness, ours is a product.** That distinction decides most cases. A harness exists to host
arbitrary agents, so a plugin system is its core value. Our roster is 16 deliberately paired agents, and
the pairing is the thing the evidence says protects us. Adopting their extensibility would be buying
something we have decided not to want.

**Do not ask for Node or a plugin framework on the strength of this read.** The one thing a long-lived
host buys, agent state surviving a process boundary, we already have.
[`durable-runtime.md`](../../decisions/durable-runtime.md) records that Durable Objects were weighed and
rejected on 2026-06-03 for reasons that still hold, and our checkpoints are rows a person can inspect,
portable off Cloudflare entirely.

## What the read actually bought

**Four live defects in our own code, found by reading someone else's.** Two were severe and are fixed the
same day: a **shell injection carrying a write-scoped GitHub token** in `src/lib/exec/e2b.server.ts`, and
**a scheduler dead for five weeks while reporting green 144 times a day** in `loop-tick.ts`.

That is the honest return: **not a lift, a mirror.** Budget the next one of these accordingly, and expect
its value to be what it shows you about your own code.

---

# Can we copy the DeepSeek Harness?

## The direct answer: no, and the reason is not licensing

MIT permits it. Our own stack policy (`docs/decisions/tech-stack.md`) leans permissive, so the licence clears our bar. The question is whether it is a good idea, and it is not — not wholesale, and not close to wholesale.

Seven readers went through all 40 packages, 2,472 files, ~546k lines, and read the source rather than the READMEs. They proposed 34 specific lifts. We then ran adversarial checks on the 21 highest-value ones, each check trying to kill the claim with a file:line from our own repo.

**Result: 21 checks, zero survivors as "copy this file."** Six were rejected outright. Nine came back as idea-only — take the vocabulary, write our own code. Six survived as *adapt*, and every one of those six is "take the shape, write it ourselves in our own idioms," typically 20–60 lines.

Three reasons the code does not travel:

1. **It is a long-lived local process and we are not.** Their plugin host (cordis) holds registries in `Map`s and `WeakMap`s keyed on live objects. Every continuation on Cloudflare Workers is a cold start. Their in-memory compare-and-set is atomic because it is single-threaded JS in one process; ours is two isolates, which is why Postgres row serialization is the right primitive here and they had to simulate it.
2. **Their durability is a file and ours is a database.** Session persistence is `node:fs` JSONL or `node:sqlite`; credentials are chokidar-watched YAML with cross-process file locks; the sandbox is bwrap/Landlock/Seatbelt confinement of processes on the operator's own machine. None of that exists on Workers, and none of it is a problem we have.
3. **On the axes that matter most to us, we are ahead, not behind.** Their entire permission model is one session-wide binary (`ask` | `never`) plus a sandbox mode. Ours derives a gate per tool from two axes across 59 catalogued tools, models reversibility and blast radius, and demotes a tool after repeated rejections. Their search ranking has no outcome feedback of any kind. See "Where we are ahead" below — that list is longer than the take list.

On the second half of your question — "make our product truly agentic": nothing in these packages does that. The harness is a CLI agent host for one developer on one machine. The capability gaps that would actually make our agents more effective are the ones our own board already names, and the read confirms them from the outside rather than closing them.

## What the read actually bought us

The most valuable output was not a lift. It was four live defects in our code, three of which a second pass verified independently, and two of which I re-verified myself before writing this.

**1. The loops scheduler has been dead since 2026-07-16.** `src/routes/api/public/hooks/loop-tick.ts:35` selects a column named `supaprod`. The column is `cadence` (`supabase/migrations/20260708150000_sw4_loop_mode.sql:18`). Commit c5d479fd6 ("Rename product Cadence -> Supaprod") replaced the word inside the select string. PostgREST answers 42703, and `loop-tick.ts:47` lists 42703 in its swallow set and returns `{ok:true, processed:0, note:"loops not migrated yet"}`. It has run 144 times a day since. A loop runs exactly once, inline at creation, then never again. I verified both files directly. **This is the single highest-severity thing in the whole exercise and it has nothing to do with the harness.**

**2. Shell injection carrying the write-scoped GitHub token.** `src/lib/exec/e2b.server.ts:212` interpolates `ref` unquoted into `git clone --depth 1 --branch ${ref} "https://x-access-token:$SUPAPROD_GIT_TOKEN@github.com/..."`. `ref` falls back to the customer repo's `default_branch` straight from the GitHub API, and no application code ever writes `studio_changesets.branch`, so the API value is the only path. `git check-ref-format --branch` accepts `a;id`, `a$(id)`, `` a`id` ``, `a|id`, `a&&id` and `a'id`. That command is the one step with the token in env, and it runs *before* the `git remote set-url` scrub and the `! grep -q "x-access-token"` assertion. The 17-line comment directly above it declares "THE TOKEN IS NEVER INTERPOLATED INTO A COMMAND STRING" — true of the token, false of the value two words to its left. I verified this file directly.

**3. The system prompt and the executor disagree about tool modes.** `src/lib/ai/loop.server.ts:691` builds the `tools` array; `:692` derives `modeOf`; the SW-4 trust ramp overwrites `modeOf` at `:706-708`. The prompt renders from `tools` (`:764`), the executor reads `modeOf` (`:1532`). After an accepted graduation the prompt says "(write, confirm)" while the tool actually runs `auto`. Same names, divergent modes, permissive direction. Two-line fix plus a regression test.

**4. The cron manifest and the live fleet have drifted.** `cron.liveness-tick` is scheduled (`supabase/migrations/20260802220000_liveness_tick_cron.sql:30-32`), routed and instrumented, and absent from `EXPECTED_JOBS`. `assumption-watch-tick` runs `0 */4 * * *` against a manifest entry of "hourly" with a 4-hour staleness window — window equals cadence, so it will flap. `delegate-poll-tick` is `*/5` against "every minute". Four different fleet counts appear across the repo (35, 29, 36, 37).

Also worth a look: `studio.checks.run` calls E2B directly via `e2bAvailable()`, while `WIRED_PROVIDERS` at `src/lib/exec/provider.ts:240` still contains only `githubActionsProvider` — so the merge-gate seam will name GitHub Actions as the backend even for checks that executed in E2B. That may be a deliberate spend gate rather than a bug; the comment at `:242-250` reads that way. Worth one look, not a lane.

## The one design worth the whole read

**The single biggest value here is a design, not code, and it is one rule applied at six places: nothing may fail, cut, or refuse silently.**

Every surviving borrow is an instance of it. That is the through-line, and it is the thing to internalise even if we ship none of the individual items:

- A truncation carries a count and a handle, so the model can tell something was cut and ask for the rest.
- A block carries a durable code and a normalised message, so "why did this not run" is queryable instead of grepped out of Worker logs.
- A refusal that nobody answered is its own recorded outcome, not a collapse into approve-or-cancel.
- A write that could not be confirmed is a third value, not an absence — because absence is what our watchdog reads as "late."
- An ask has a settlement, so "waiting on you" is a fact a cold reader can query.
- A gate row records what proved a human decided, not just that one did.

We already practise this in places and the code says so. What the harness does is practise it consistently, at the type level, in six places where we currently drop the information on the floor. That consistency is worth more to us than any file in the repo.

## Take list, in order of value to us

### 1. Quote the ref, and allowlist it (adapt — hours)
**Harness ref:** `packages/e2b/e2b/src/index.ts:27` (`quoteE2BShellArg`, 3 lines).
**Our gap:** `src/lib/exec/e2b.server.ts:212`, above.
**Take:** the algorithm, not the file. A 3-line POSIX single-quote wrapper is a universal idiom — we would write it identically having never seen this repo, and copying it as a file would drag an attribution obligation onto something that is not proprietary insight. Write `quoteShellArg` next to the existing `escapeRe` at `e2b.server.ts:109`, apply it to `ref` only (`repo` is already safe — every path runs it through the `/^[\w.-]+\/[\w.-]+$/` check at `src/lib/connectors/providers/github.server.ts:32`), and pair it with an allowlist on `ref`, since a git ref is a constrained value. The existing test at `src/lib/exec/e2b.server.test.ts:250-252` asserts `toContain("--branch feat/a")` and will need updating.

### 2. Never truncate a tool result silently (adapt — a day for the notice, the retrieval tool separately)
**Harness ref:** `packages/spill/spill-policy/src/index.ts:130-188`.
**Our gap:** `src/lib/ai/loop.server.ts:1708-1711` does `xmlEscape(JSON.stringify(result)).slice(0, 2000)` with no count and no handle. Same cut on the approval-resume path at `:2160`. The full result is already persisted twice — `tool_calls.result` at `:1693` and inside the checkpoint at `:1703` — and the model gets no handle to either. `studio.repo.read` returns up to 120,000 bytes per path, so a real file is amputated mid-token and unreachable for the rest of the run.
**Take four rules, not their code:** (a) every cut carries an explicit omitted count; (b) reserve the notice's cost inside the cap before computing the preview budget, in whatever unit you slice in; (c) a storage failure must never turn a successful tool call into an error — and, our inversion, must never emit a handle either; (d) keep the store behind a seam so `tool_calls.result` today can become R2 later.
**Two traps their code hides:** their best-effort rule works because their store *rejects* on failure. `supabase.from(...).insert()` resolves with `{ error }` and never throws, and all three of our call sites discard it (`loop.server.ts:1686`, `:1720`) — the exact bug class our own comment at `:1670-1682` documents, on a table measured at zero rows on 2026-08-22. Ported verbatim, the catch never fires and the model gets a pointer to a row that was never written. Second, their preview is a head/tail byte split over plain text; ours is `JSON.stringify` output, so a naive split hands the model two fragments with unbalanced braces. Also fix the ordering while you are in there: we escape *then* slice, so a cut can land inside `&amp;`.
**Scoped honestly:** the notice is the cheap half. The handle is inert until a tool exists to dereference it, and that is separate work — schema, approval classification, tenancy-stamped read, tests.

### 3. Per-agent tool visibility: the `{allow, deny}` shape and two validation rules (adapt — hours of code, days of product decision)
**Harness ref:** `packages/core/tools/src/index.ts:680` (`ToolRestriction`), `:1079` and `:1091` (the two validation rules).
**Our gap:** tool resolution reads overrides `.eq("user_id", userId)` only (`src/lib/ai/loop.server.ts:685-689`). The sole per-agent axis is `capToolsByRisk` (`src/lib/agent-tool-cap.ts:24`), a three-value blast-radius tier that cannot say "Reviewer sees exactly these six." No migration sets `max_tool_risk`, so today it is null everywhere and all 59 tools reach all 16 agents — roughly 3.7k tokens of tool descriptions in every prompt.
**Take:** the `{allow?, deny?}` shape on the existing per-agent key (`agent_tool_modes(user_id, agent_slug, tool_name)`), because `deny` composes with the risk tier instead of replacing it; and the two validation rules verbatim as rules — refuse an empty filter as a materialized-empty-config bug, and throw on a filter naming an unknown tool *with the known list in the message*. The second closes a live hole: `resolveToolAccess` silently ignores an override row naming a tool that does not exist.
**Do not take** their scope-chain intersection or their own-layer exemption. The chain needs nested ad-hoc scopes; our sub-agents are named, pre-registered, depth-capped at 1 (`registry.server.ts:4904`), and re-resolve from their own row. The own-layer exemption solves a problem our `ORCHESTRATION_CONTROL_FLOW_TOOLS` exemption at `loop.server.ts:1512` already solves.
**One ruling stands in the way and must be argued explicitly, not slipped in:** `defaults.ts:228-231` carries the scar of the outage where an absent row meant "you may not" and eleven of sixteen accounts lost their Plan station. An allowlist is by construction "absent means denied." Defensible on a different axis — platform capability vs per-agent remit — but it needs your call.
**Free win while in there:** the same resolution is copy-pasted at `loop.server.ts:691`, `:2029` and `crew.functions.ts:415`, and the comment at `:2021-2023` admits the invariant is held by discipline. Extract one `resolveAgentToolView()`. Worth doing on its own merits.

### 4. `structuredContent` and annotations on our MCP results (adapt — hours to a day; defer the expensive half)
**Harness ref:** `packages/mcp/mcp-client/src/tools.ts:221`, `:283`, `:350-353`.
**Our gap:** `outputSchema`, `structuredContent` and `annotations` appear zero times in `src/lib/mcp-protocol.ts` and `src/routes/api/mcp.ts`. `buildToolCallResult` (`src/lib/mcp-protocol.ts:642`) returns a JSON-stringified text blob. Any real MCP consumer calling our 912-line server gets untyped text.
**Adopt now:** annotations on the catalog, and `structuredContent` alongside the existing text. Their client accepts `structuredContent` with no advertised schema. Our own Lovable-generated server already does exactly this half (`src/lib/mcp/tools/search_signals.ts:14,31`) — on this one axis the generated server beats the hand-built one, which is a real input to the question of which surface survives a collapse.
**Defer:** advertising `outputSchema`. Once advertised, MCP 2025-06-18 makes conformance a MUST, and their client hard-throws on a violation with no degradation path. We have nothing to derive those schemas from — `src/lib/mcp.functions.ts:201` is `searchSignals(supabaseClient: any, ...)` returning `data || []` off a hand-written select whose own comment records a prior column drift. Eighteen hand-written schemas over `any`-typed rows is not mechanical.

### 5. Tail-keep and a `truncated` flag on captured build output (adapt — hours)
**Harness ref:** `packages/subprocess/subprocess/src/types.ts:24`.
**Our gap:** `src/lib/exec/e2b.server.ts:83-87` keeps the first 20,000 chars. For `bun test` and `tsc` the diagnostic payload is at the end.
**Correct the aim:** the model never sees 20,000 chars anyway — the 2,000-char cut in item 2 governs that. The consumer that *does* get the full clamp is the human reader at `src/components/studio/RunReturn.tsx:267,276`. That is where the win is. Take `{ text, truncated }` as the return shape instead of our in-band `"...[truncated N chars]"` string, which any consumer would have to regex for. Note a second head cut at `e2b.server.ts:344` and that the existing test passes either way, so add an assertion or it ships untested.

### 6. Advance a recurring loop from its target, not from its finish (idea-only — 3 lines, *after* the column fix)
**Harness ref:** `packages/schedule/schedule/src/domain.ts:519-551`.
**Our gap:** `src/lib/loops.shared.ts:54-57` returns `from + ms` and `src/lib/loops.server.ts:130` passes `finishedAt`, so every loop drifts by its own run duration plus tick latency, permanently.
**Take the rule, not the function:** step from `new Date(loop.next_run_at)` and floor to the latest due occurrence. Their code is two-thirds range validation for a four-digit-year log format and folds over an append-only change stream; zero characters survive. Their catch-up advantage is also backwards for us — we store one scalar `next_run_at` and select `.lte(now)`, so a backlog is structurally impossible, and anchoring is what *creates* the missed occurrences their `Math.floor` then mitigates. Fix the `supaprod`/`cadence` column first, confirm the tick selects rows, then correct the anchor. Shipping the arithmetic first changes nothing observable — the classic quiet-job trap.

### 7. Vocabulary to borrow when we next touch approvals (idea-only — free)
Four namings, each of which we currently express as an absence:

- **Durable intent vs authority that must be re-established** (`packages/goal/goal/src/types.ts:70-71`). We already implement both unnamed — `missions.status` is the durable phase, `resolveApprovalMode` per tool call in the fresh isolate is the re-derived authority, and `agent_approvals.execution_claimed_at` (`supabase/migrations/20260814120000_...sql:66-72`) is the durable single-shot claim. Borrow the words when writing the per-run autonomy override that `src/routes/api/plan-gate.ts:86-94` already scopes.
- **A blocked state that carries a code, not a log line** (`packages/goal/goal/src/types.ts:50-56`). We compute a `preflightBlock` with five codes at `src/routes/api/chat.ts:685-753` and its only durable trace is a `console.warn` at `:761-765`. *(Unverified by a second pass — worth one grep before dispatching.)*
- **A refusal nobody answered is its own outcome** (`packages/interaction/user-approval/src/types.ts:29`, four values including `unavailable`). Our `ExpiryDefault = "proceed" | "cancel"` (`src/lib/ai/approval-expiry.ts:70`) collapses silence into an action, so the record cannot afterwards distinguish a person's approval from a clock's. For a product whose moat is the forecast captured at decision time, that distinction is the whole point. *(Unverified.)*
- **Refill an escalation budget on human attention, not on a clock** (`packages/jobs/tool-jobs/src/index.ts:224-229` — the count clears only on a message whose source is a user). Our only analogue is a timestamp watermark. One field, genuinely better idea.

Two more, both hours, both unverified by a second pass and both worth a grep first: recording *what proved* a human decided as a typed value on the gate row (`human_gate_events` has no such column, `supabase/migrations/20260711030000_rpt32_human_gate_events.sql:9-25`), and putting the previous step's `run_id` into the outgoing handoff's existing `artifacts`/`evidence_ids` fields so step N+1 can reach step N's output — a named defect at `src/lib/ai/fanout.server.ts:112-115`, closable with columns we already have.

## What we should not take, and why

- **Cordis, the plugin host itself.** 2,693 lines, MIT, and notably no `node:` imports so it would technically run on Workers. Adopting a dependency-injection plugin host to answer a per-agent capability question is a rewrite in service of a problem we do not have. We have route handlers.
- **Anything with a filesystem or a resident process.** `session-persistence-sqlite`, `spill-local`, `credentials-local` (935 lines of chokidar and file locks), `sandbox-local`, `packages/fs`, `packages/shell`, `packages/sdk`'s `child_process.spawn` client, the tmux and file-reference context packages, `code-runtime` (`node:worker_threads`), `packages/extensions` (`node:vm`, whose own header admits "this is not containment"). Unrunnable, and mostly solving confinement of untrusted code on the operator's own machine — we run three fixed commands in a disposable remote VM.
- **`packages/acp` and `packages/sdk`.** stdio JSON-RPC for a trusted local process with literally zero auth (`authMethods: []`, no-op `authenticate()`). The inverse of our problem.
- **Their compare-and-set on a revisioned record.** Their atomicity is single-threaded JS and their durability is a JSONL file. Ported here it leaves the race exactly as open as it is today, plus a revision column. The race *is* real — `subject_ref` is plain nullable text with no unique constraint — and the fix our own `plan-gate.ts:323` already specifies is one unique index plus a 23505 catch. Hours, in-house pattern, no new table.
- **The deny>ask>allow merge lattice.** Twenty pure lines that would run fine here, and they model an *open* set of untrusted shell-hook authors where order-independence must be structural. `resolveToolMode` composes four named in-repo sources of which exactly one tightens and three deliberately loosen. Folding it monotonically would delete the loosening the product depends on.
- **Argument canonicalization for dedup.** `agent_approvals.args` is `jsonb`; Postgres key-sorts recursively on write. I had the checker prove it on production. The function is already free at the storage layer.
- **The tool-name namespacer.** Our two MCP servers are two endpoints with two catalogs and zero intra-catalog duplicates. Applied as a server rule it would double-prefix names at conforming clients and break the byte-identical back-compat constraint at `src/lib/mcp-protocol.ts:10-15`.
- **Their native-tool-calling story as an argument for flipping our flag.** We already have `buildNativeToolDefs` (`src/lib/ai/tool-schemas.server.ts:53`), wired at `loop.server.ts:1243`, covered by two test files and documented. And the harness does not hold the position it was cited for — `packages/core/tools/src/ts-types.ts:273-292` renders tool schemas into the prompt as TypeScript in every non-native mode. That is a second-order finding worth keeping: it argues for reopening our own "render argument schemas into the prompt" option, which is one of the three the board already lists.
- **The npm-monorepo overhead.** Typert decorators, tsdown configs, dual-namespace entry points, bilingual READMEs per package. We ship one Worker.

## Where we are ahead — do not throw these away

- **Outcome-aware ranking.** `match_agent_memory` re-ranks vector candidates on the recorded verdict, with importance weighting and a 72h decay (`supabase/migrations/20260802190000_...sql:192-197`). Their search ranks on match count, document length, time. There is no outcome feedback anywhere in `session-query`, and their result filter type has no quality dimension at all. This is our biggest lead and it is not close.
- **Approvals.** Two axes across 59 tools, three-valued reversibility with plain-language effect and undo (`src/lib/tool-consequences.ts:12`), a track record that demotes a rung after three consecutive rejections. Theirs is one session-wide binary plus a sandbox mode, and their UI can show the tool name and a free-text reason and nothing about what happens if you say yes. There is also no growing allowlist anywhere in their 40 packages — grep for always-allow, remember, persistent-rule returns nothing relevant. The only escape from being asked again is flipping the whole session to full access.
- **The gate interaction.** Three answers with a mandatory reason on send-back, and the plan re-derived from `{shape, station, origin}` rather than trusted from the client, so what a person answered about and what is recorded cannot diverge. Theirs is two options, optional feedback, delivered to the model by throwing an Error whose message is the feedback string.
- **Runaway detection and step budgeting.** Five independent breach signals graded by severity; arc-aware, DAG-size-aware, ceiling-capped budgets. Theirs is one config integer defaulting to 256, applied identically to every agent.
- **Durability and multi-tenancy.** Workspace-scoped RLS rows with split read/write policies. Their session row has no owner, user or tenant column; their job registry deletes every record when its owner disposes. Our weakest surface is more durable than their strongest.
- **The default-vs-override tool policy**, and the build-time gate that fails when a registered tool has no policy entry. Nothing in their registry checks that. Ours was paid for in a real outage and the lesson is in the code.
- **`failureFromResult`** treats a resolved non-2xx as a failure regardless of what the handler author intended. Their registry settles on whatever the producer resolves with, so a producer that resolves `completed` after failing writes `completed`. That is the lie our own comment documents and we fixed.
- **`EXPECTED_JOBS`, the liveness registry, and `isMissingDatabaseObject`.** They have no concept of a job that *should* run — a schedule exists there only because a model created one. Ours can say a job is missing; theirs structurally cannot.
- **Credential scoping on clone, the false-green refusal on an empty check set, checkpoint-before-provider-call, argument validation with a model repair loop, and stable string refusal codes on top of numeric JSON-RPC codes.** All ours, all better, all confirmed by the comparison.

**Two honest corrections against ourselves.** `resolveApprovalPolicy` (`src/lib/ai/approval-policy.ts:230`) has no caller outside its own test — our two-axis design is better than theirs as designed and is currently an index nothing reads. And the `describe("Tool mode resolution")` block in `loop.server.test.ts:333-366` is six `// TODO` stubs with zero assertions, so the branch ordering the docstring spends 25 lines defending is not tested. Both of those are more urgent than anything on the take list.

## Attribution, if we do copy a file

We currently would not. Every survivor is a shape or a rule written in our own idioms, so no MIT-licensed source travels and no `THIRD_PARTY_NOTICES.md` entry is triggered. That is itself the tell that this is a design borrow rather than a code lift.

If that changes — if anyone lifts a function body verbatim — the rule is: the copyright notice and MIT licence text travel *with the file*, in the file, and `THIRD_PARTY_NOTICES.md` gets an entry naming the upstream repo, the commit, and the specific files. Not a footnote in a commit message.

## What I would do, in order

1. **Fix `loop-tick.ts:35`** (`supaprod` → `cadence`) and confirm the tick actually selects rows before touching anything else about loops. Hours.
2. **Quote and allowlist `ref`** in the clone command. Hours.
3. **Fix the prompt/executor mode divergence** — render the prompt from the same post-overlay collection the executor dispatches on, at both `loop.server.ts:764` and `:2051`. Two lines plus a test.
4. **Reconcile the cron fleet** against the live scheduler, not against migration text. Read `cron.job` through a `SECURITY DEFINER` function — 49 migrations already query it — and diff against `EXPECTED_JOBS` and the hooks route tree. A prior migration already tried text-matching and recorded that it matched 9 of 14. Days.
5. **Then** the take list, starting with the omission notice on tool results.

Items 1–4 are ours. Item 5 is the only part where the harness earns credit, and even there what crosses is a rule, not a file.
