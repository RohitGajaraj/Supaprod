# Parallel build — Lane 1 report

> _Created: 2026-06-22 · Last updated: 2026-07-07_

> Lane 1 (`parallel/lane-1`, worktree `cadence-lane-1`). Preferred: Cockpit, then Governance; roams the whole board. Driver: continuous `/loop` in this terminal. Full rules: `docs/operations/autonomous-build-loop.md` §15-16.

## 2026-06-25 (22:00) — M1/LRN-01 increment 2: Support signals UI shipped

**181/213 done (85.0% strict / 86.6% weighted).**

Built the Engine Room > Quality & insight > "Support signals" panel — closes the support→Discover feedback loop. Outcome-named per Engine-Room doctrine ("Support signals", "Recurring themes", not "triage"/"clusters").

**What shipped:** `src/components/governance/SupportSignalsPanel.tsx` (~325 lines) — paste area for support tickets, import + triage buttons, `ClusterCard` sub-component with theme/ticket-count/subjects preview and per-cluster "Reply template" toggle. Wired to existing `src/lib/support-triage.functions.ts` (list, bulkImport, runTriage, draftReply). Added "support" tab to `src/lib/engine-room-bands.ts` (quality-insight band, 13→14 tabs); updated tab test in lockstep (14 tabs, `bandForTab("support")`). Registered in `src/routes/_authenticated.govern.tsx` (TABS array + GOVERN_DESC + render switch — validateSearch auto-handles via `TABS.some()`).

**Code-review findings fixed:** (1) `r.body` → `r.reply` (DraftVerdict uses `.reply`, not `.body`); (2) dead `fmt` function removed; (3) no `dangerouslySetInnerHTML` — XSS-safe by design (all text via JSX).

**Gates:** tsc 0 · 9/9 band tests pass · code-review clean. **Commit:** `e4108cf698`. Code on origin/main.

---

## 2026-06-25 (21:00) — LANDING-PAGE-V11: public landing page shipped

**178/213 done (83.6% strict / 85.7% weighted). v11 Tier-1 front all 21 items ✅.**

Built `src/routes/index.tsx` — a standalone public route at `/` (NOT inside `_authenticated` layout). Authenticated users get a client-side redirect to `/missions` in `beforeLoad`; unauthenticated visitors see the full 5-section page (hero, three pillars, trust ledger mockup with verdict badges, what it is not, who it is for + footer). All Ember Editorial tokens; mobile-safe overflow wrapper on the ledger table.

Code-review workflow caught 3 issues; all fixed before commit: (1) title had em dash → changed to colon `"Cadence: Decision and outcome OS for product teams"`, (2) `--moss-success`/`--madder` CSS vars not defined in styles.css → replaced with `--emerald`/`--rose` (both defined), (3) ledger table not mobile-safe → added `overflowX: "auto"` wrapper + `minWidth: 480` on inner grid.

**Gates:** tsc 0 · 1541 tests pass · code-review clean. **Commits:** `d99e0e7811` (landing page) + `d2502429a6` (dashboard close). Code on origin/main.

**Board status after close:** Tier 1 = 0 (all 21 ✅). Next picks are Tier 3 (DEF-04 ◐ gated-remainder, REPO-DECLUTTER-V11 ✅) and Tier 4. `bash scripts/lane.sh next` returns exit 2 (board dry) — long-polling.

---

## 2026-06-22 (17:51) — FINAL closure of the former-Lovable monetization/credit/billing block (founder-directed)

The founder flagged this was the **3rd** re-map of Lovable's monetization work ("is it not documented properly, or not logically closed?") and ruled: close it logically + permanently, mark done where done, leave a note, never re-pick.

- **Diagnosis (the real cause):** an 8-agent adversarial verification workflow (evidence + file:line per item) confirmed every block item was build-complete or had a tiny buildable slice; the only real remainder is **founder go-live config**. They kept being re-picked for ONE mechanical reason — they sat at `◐`+Tier-1/3, which is *exactly* `lane.sh next`'s eligibility. A **logical-closure failure**, not a docs-content gap. (`lane.sh done` is pruned after 48h, so closure had to live in the register row.)
- **Built the 3 genuinely-buildable slices** (commit 48ff382cf3): **M-C-BILLING-TESTS** — extracted the top-up cap (duplicated across 2 fns, a verifier-flagged UI-vs-backend drift risk) into one pure `topUpCycleCap()` + an SQL↔TS parity guard; **WM-M18** — guarded downgrade-confirm dialog (`useConfirm` on paid→paid downgrade); **WM-M6** — verified 5-tier model live in-app + fixed the stale public-pricing comment. Adversarial review caught + fixed a self-introduced 5000→2500 cap drift before commit. Gate: tsc 0, lint clean, `bun test` 1085 pass.
- **Closed the whole block to terminal states** (commit 71f99906ce): ✅ `M-C-PRICE`/`WM-M3`/`WM-M13`/`WM-M15` (+ the 3 above); Gated 👤 `WM-M9` (chokepoint), `WM-M17`/`WM-M19` (founder numbers). Authoritative 🔒 do-not-re-pick banners in the dashboard At-a-glance, SSOT §0, AGENTS.md §3; session-decisions entry. `lane.sh done` on all 7 ✅.
- **Reconciled by-priority Done to ✅** (commit 18e8518aed, founder TASK 2): re-ran `rerank-dashboard.py` (its `classify()` maps ✅→Done) so by-priority **Done = 132 == ✅ status = 132** (was 81 vs 125). Emptied the dead `Lovable` set in the script. New tally: **179 rows; strict 132/179 = 73.7%, weighted 144.38/179 = 80.7%**.
- **Net:** the monetization/credit/billing/admin block is build-complete + gate-green and will NEVER re-surface in `lane.sh next` (no item is `◐`+Tier-1/3 anymore). The only open monetization work is the founder's, in SSOT §4. **Breadcrumb:** Settings → Plan (downgrade confirm) · `/pricing` · Settings → Credits.

## 2026-06-22 (15:57) — DBR-3e: decision precedent cited in chat/Ask

The 5th "value at every step" moment — the brain now volunteers DECISION precedent IN CONVERSATION.
- One file (`src/routes/api/chat.ts`): a fail-safe block loads `loadDecisionPrecedent` for the user's message and pushes a `formatDecisionPrecedent` block into the chat answer's `systemParts`, so the assistant grounds in the workspace's own outcome history ("you shipped a similar bet and it missed").
- **Adversarial review (code-reviewer) on the live chat route = SHIP_WITH_FIXES; folded all 3:** verdict tags flagged as labels not `[n]` citations; added the passive-text/no-injection rider; a min-length floor (>= 4 words) so trivial messages skip the embed.
- **Gates:** tsc 0 · `bun test` 1064/1064 · eslint + prettier clean. Collision-safe (chat.ts not chokepoint-pinned).
- **◐ render-on-publish**, byte-identical until the workspace has outcome memories. Four of the five "value at every step" moments are now live (Critic, nudge, currency banner, chat). **Breadcrumb:** any chat (Ask) conversation on a decision question.

---

## 2026-06-22 (15:39) — DBR-3d: decision-currency banner (flag the VIEWED decision)

Governing-decision (3a/3b/3c) flagged stale PRECEDENTS; this flags the decision you're VIEWING if IT has been superseded/contradicted — so you never unknowingly act on a stale decision.
- New `getDecisionCurrency` server fn (resolves the viewed entity's own currency via the shared `resolveGoverningForNodes`) + a fail-safe `DecisionCurrencyBanner` above the precedent nudge on the opportunity detail + PRD page ("superseded by 'X'. Act on the current one, not this.").
- **Self-reviewed** (glue on already-reviewed engine); folded a real UI copy bug (double "by"). No new test (reuses the 32 governing tests).
- **Gates:** tsc 0 · `bun test` 1064/1064 · eslint clean on my files (1 pre-existing PRD-page warning, not mine) · prettier clean. Collision-safe (only CHOKEPOINT was claimed).
- **◐ render-on-publish**, byte-identical until the entity is graph-marked stale. **Breadcrumb:** opportunity detail / PRD page → banner above the nudge.

---

## 2026-06-22 (15:25) — DBR-3c: NAME the governing decision

Completes "return the governing DECISION, not the nearest text": the Critic block + precedent nudge now NAME the replacement by title ("replaced by 'New checkout flow'"), not an opaque id.
- Optional `governingTitle` on `GoverningDecisionItem`; fail-safe server resolver `attachGoverningTitles` (batch `prds`/`opportunities` lookup, RLS-scoped, zero query when no stale items) threaded through `resolveGoverningForNodes` → both surfaces get titles with **no `critic.server.ts` change**. +1 test (32).
- **Self-reviewed** (additive on already-reviewed code); table/column names confirmed by existing call sites; folded a real tsc fix (Supabase builder is `PromiseLike`, not `Promise`).
- **Gates:** tsc 0 · `bun test` 1059/1059 (+1) · eslint + prettier clean (5 files). Collision-safe (disjoint from Lane 2's `knowledge-graph-view.*`).
- **Context:** the moat is now armed live (founder published the migration; Lane 2's DB-backed flag), so DBR-3a/3b/3c light up automatically as edges accrue once THIS build publishes. **◐ render-on-publish.**

---

## 2026-06-22 (15:10) — DBR-3b: governing-decision on the proactive precedent nudge

Continuing "go deeper now". DBR-3a put governing-decision in the Critic; **DBR-3b extends it to the proactive precedent nudge** so a stale precedent is flagged the moment the brain surfaces it.
- Extracted the closure loader to a reusable `src/lib/ai/governing-decision.server.ts` (`resolveGoverningForNodes`); refactored `runCritic` onto it (DRY, behavior-preserved).
- `getDecisionPrecedent` annotates each precedent with its governing decision; `PrecedentNudge.tsx` flags "Superseded/Contradicted" inline. Pure `findGoverningFor` (+4 tests → 31).
- **Adversarial review (code-reviewer) = SHIP_WITH_FIXES, all 3 folded:** skip a redundant query; **fixed a silent frontier truncation** (`.slice(0,50)` → chunked + 500-node cap); documented prd-first single-match.
- **Gates:** tsc 0 · `bun test` 1034/1034 (+4) · eslint + prettier clean (6 files). Collision-safe (disjoint from Lane 2's `supersession.*`).
- **◐ not ✅:** dormant + byte-identical until publish + `DECISION_BRAIN_SUPERSESSION` on. **Breadcrumb:** opportunity detail / PRD page → Precedent nudge.

---

## 2026-06-22 (14:45) — Decision Brain depth: DBR-3a governing-decision retrieval (founder "go deeper now")

**Directive (founder, this run):** run the autonomous loop; start with core USP / moat / foundational items; surface where founder input is genuinely needed. The #1 item is the Decision Brain; its autonomous increments are all shipped-but-dormant and the next depth was founder-parked "enrichment," so that fork was surfaced with 3 options. Founder chose **"go deeper now."**

**Shipped ◐ — DBR-3a governing-decision retrieval** (the moat's "current belief, not the similar old one"):
- NEW pure `src/lib/ai/governing-decision.ts` — `resolveGoverning` (supersedes-chain walk, current-only, cycle-guarded), `selectGoverningDecisions`, `formatGoverningDecisions`, `nextSupersessionFrontier`; **27 unit tests**.
- DRIVEN into `runCritic` (`critic.server.ts`) via a bounded fail-safe forward-closure loader (`loadSupersedesClosure`) so the chain reaches the TRUE current decision, then a corrective "Governing decision" prompt block (distinct from DBR-2, which only lists edges).
- **3-lens adversarial review (ultracode) = SHIP_WITH_FIXES;** the one cross-lens should-fix (similarity-bounded edges truncated multi-hop → could name a stale intermediate as "current") was **fixed at root** with the closure loader + a loop-simulation test.
- **Gates:** tsc 0 · `bun test` 1030/1030 (+5) · eslint clean (3 files). Build stays red locally (node 20.9 < 20.19, pre-existing) → offline gates only.
- **◐ not ✅:** dormant + byte-identical until the founder publishes (applies the DBR-1.5 migration) + flips `DECISION_BRAIN_SUPERSESSION`; the live Critic-cites-a-governing-decision path verifies then.

**Also this cycle:** cleared two stale prettier-only files from the tree (`NotificationsTab`, `billing-webhook`) as a standalone style commit so the lane started clean. **Collision-safe:** Lane 2 concurrently built `supersession-confidence` (disjoint globs).

**Pending founder publish-verify:** open the Critic on an opportunity/spec after publishing + flag-on + a seeded supersession edge; confirm the verdict cites the current governing decision over the superseded match.

**Next DBR-3 (autonomous):** richer typed-edge auto-extraction (`validates`/`cites`/`depends-on`). **Founder-gated:** the deep-graph enrichment (storage crossover, viz-at-scale, ambient aggressiveness).

---

## 2026-06-22 — Founder partial-closure cruise (live-verify on the published app)

**Directive (founder, this session):** cruise the partial (`◐`) items one by one; if a partial needs building (incl. frontend + wiring) build it fully; do not punt "Lovable" items to Lovable — pick them up and close them; logically/live test, mark ✅ in the dashboard + registry with proper docs; stay collision-safe with the other live session.

**Key enabler:** the published app at `https://cadence-flow-beta.lovable.app` is **current with `origin/main`** (the deploy screenshot is at the HEAD commit), so each `◐` was verified against **real production data** (demo account `demo@redcadence.app`) via Playwright + Supabase/Lovable SQL + direct HTTP — not just unit mocks. Local build stays red (node 20.9 < 20.19), so offline gates = `bunx tsc --noEmit` + `bun test`.

### Closed → ✅ (12 items, each pushed to main individually)

| Item | Register | How verified live |
| --- | --- | --- |
| APP-HEALTH | #50 | `curl /api/public/health` → 200 `{status:ok, checks:{worker:ok,database:ok}}` |
| SUBPROC-DISCLOSURE | #49 | public `/subprocessors` SSR registry (infra + catalog-derived model providers) |
| EVAL-COVERAGE | #52 | `/govern?tab=evals` coverage chips + one-click guard opens pre-targeted form |
| RELIABILITY-SLO | #55 | Missions glance "86.42%" = exact live 7d `ok/(ok+error)` **+ success-synonym code fix** |
| RELIABILITY-GLANCE | #53 | "Heads up · AI error budget spent" fires correctly (budget exhausted) |
| RUNAWAY-DETECT | #54 | glance popover "No spinning missions detected" (correct vs 21 live missions) |
| RUNAWAY-INCIDENTS | #29 | Engine Room → Incidents renders live (2 real `execution` incidents) |
| ENG-06 | #32 | Analytics "COST PER OUTCOME $0.0039" + per-agent/per-model roll-up |
| F3 | #34 | Lumen signals feed renders real Scout-clustered themes (conf 82/91/74) |
| U6 | #44 | clicked Download → real 483 KB RLS-scoped JSON (counts match demo seed exactly) |
| LRN-04 | #39 | mission detail "COMPOUNDING · 8 prior memories" (consult) + "FILES THIS AS A DECISION" (write) |
| FND-0.5 | #46 | Tool-reach selector live on every agent; migration applied (live DB); enforcement wired (`loop.server.ts` `capToolsByRisk` :259/:926) |

**One real code fix (RELIABILITY-SLO):** live 30-day data showed `normalizeStatus` counted 17 seed `success` rows as errors (75.66% vs true 84.66%). Fixed `src/lib/reliability/slo.ts` to recognize success-synonyms as `ok` (fail-visible preserved for genuinely-unknown), +1 regression test; reliability suite 57 pass, tsc 0; proven on live data.

### Findings handed to the founder (not mine to close)
- **Credit/billing UI is live in Stripe test mode** (pricing tiers, plan "Active · renews Jul 21", Credits balance/grant/top-ups/caps/attribution) — but **Metering is OFF** ("Metering is off while we finish the credits rollout"). The credit **debit engine** (WM-M12) is dormant behind that one flag. Flipping metering is a **founder action** and is the single gate to the credit engine going live.
- The Lovable-owned billing items (WM-M6/M16/M18/M-C-PRICE-SYNC, etc.) are mid-flight in the live Lovable builder; their remainders are genuine Lovable-build or founder-flag, documented rather than over-flipped.

### Next buildable slices (collision-safe, for the continued loop)
- **D4b** — rich side-by-side checkpoint-diff (original vs replay) on `/missions/$id`; cancellation + replay-and-branch already shipped + live-verified. Files: `missions.$missionId.tsx` + a new component + `missions.functions.ts` (none chokepoint-pinned).
- Avoid: chokepoint AI core (`runtime/loop/registry/cache/memory.server.ts`, pinned), Lane 2's L2/announcements/`p.$slug` + tenancy/workspace area.

### Collision notes
- One rebase conflict resolved cleanly (kept Lane 2's AMBIENT-ARC ✅ + my ENG-06 ✅).
- Every close: ledger `claim` → flip own row → commit explicit paths + WHY → ff-push → `done`-mark.

## Cycle (2026-06-24, autonomous loop) — TEST-SEED ✅
- **TEST-SEED (v11 #1, Tier 1 Foundational)** — minimal deterministic dev/test seed. New migration `20260624030000_test_seed_dev_surfaces.sql`: per demo account, one closed outcome→supersession→governing-decision loop (2 opps, 2 decisions, 16 learnings cohort, 16 memory rows, 3 lineage edges incl. live `supersedes` + bitemporal retired). Schema verified live via Lovable MCP; applied + verified live (supersedes 0→1, memory-depth lift now computes ~55-63 pts, Trust Ledger/memory/provenance render). Idempotent (sentinel), demo-scoped, lint-clean. `lane.sh done TEST-SEED`.

## Cycle (2026-06-24, autonomous loop) — AMBIENT-SENSE ◐
- **AMBIENT-SENSE (v11 #3, Tier 1 Sense)** — sensing front-half feeding cluster-tick. New pure tagger `src/lib/sensing/normalize.ts` (13 tests) + `sense-tick` cron (mirrors cluster-tick) + migration `20260624040000_ambient_sense.sql` (auto_sense flag, applied live via Lovable). Rule-based, zero AI spend, off-by-default. Adversarial fix: workspace-scoped. Route-tree + supabase types hand-registered (node20 blocks the vite generator). Gate: tsc 0, 1214 tests, lint clean. ◐ + `lane.sh done`; remainder founder-gated (real source, cron schedule, AI enrichment).

## Cycle (2026-06-24, autonomous loop) — AMBIENT-TRIGGER ◐
- **AMBIENT-TRIGGER (v11 #4, Tier 1 Sense)** — self-driving policy layer. Pure `src/lib/sensing/trigger.ts` (`evaluateTriggers`, 10 tests) + `trigger-tick` cron: self-originates `proposed` missions (zero spend, resume-runs ignores them = reversibility gate) + Trust-Ledger `decisions` receipts when clusters/outcomes cross a threshold. Migration `20260624050000_ambient_trigger.sql` (auto_trigger flag, applied live; demo input verified 6 clusters/8 missed). tsc 0, 1238 tests, lint clean. Route+types hand-registered. ◐ + `lane.sh done`; remainder founder-gated (cron, execution/promotion, competitor source).

## 2026-06-25 — INTEROP-V11 Q2 governed inbound WRITE (founder-lifted gate)

Founder lifted the Q2 scopes/audit gate ("pick up the founder-gated items"). Built the outward GOVERNED WRITE surface, dormant + reversible:
- Migration `20260625140000`: `mcp_tokens.scopes text[]`, `interop_write_enabled()` (default false) + `admin_set_interop_write_enabled` (admin-gated), `issue_mcp_token` +`_scopes`.
- `ingest_signal` write tool reusing the LIVE signals insert + the `screenIngestText` injection screen (verified prod schema, so no append_decision-style drift).
- Two locks: per-token `write:signal` scope AND the global dormant gate; `tools/list` scope-filtered; `tools/call` re-checks (defence in depth); legacy flat path can't write; gate fails closed; every attempt audited.
- A2A card advertises the governed `discovery.ingest_signal` skill honestly.
- Gate: tsc 0; 77 MCP tests pass (new mcp.functions.test.ts + 14 protocol tests). `bun run build` not used as gate (known node20/ESM lovable-tagger failure in lane worktrees).
- Remaining (founder): apply migration on publish, mint a write-scoped token, flip `admin_set_interop_write_enabled(true)`.

### 2026-06-25 (cont.) — INTEROP-V11 Q2 VALIDATED + closed properly (founder pushback)

Founder challenged: don't mark ✅ just because asked — validate it works. Did:
- Applied migration `20260625140000` to the LIVE prod DB via Lovable MCP; verified objects (scopes col, gate fns, issue_mcp_token single 6-arg overload).
- Functionally round-tripped on real Postgres: gate read false→true→false; token mint persists scopes=['write:signal']; the exact ingestSignal signals insert lands with content-fallback. Cleaned up (DB dormant, 0 tokens).
- Full suite green: bun test 1490/0, tsc 0; 3-lens adversarial security review clean (authz/tenant/injection) + 2 fail-mode fixes folded.
- CAUGHT A REAL GAP checking the published hub: main had the ✅ flag but NOT the Q2 code (it lived only on parallel/lane-1) → published hub couldn't have the feature. Landed the actual code + migration on origin/main (overlay of the 8 feature files onto main, tsc+72 MCP tests green, pushed). Main now consistent: code + migration + ✅.
- Remaining = founder PUBLISH only (live worker still on pre-Q2 build 4f4dc478). After publish: mint a write:signal token + admin_set_interop_write_enabled(true) to activate; dormant + read-only until then.

### 2026-06-25 (cont.) — board dry → long-polling

`bash scripts/lane.sh next` = exit 2 (BOARD DRY). State: every Tier-1/Tier-3 ⬜/◐ autonomous item is done or claimed — SEC-INGEST-INJECTION ✅, INTEROP-V11 ✅ (this session, live-validated + on main), DBR (H1) held by lane 2 (DBR-4 MCP/A2A, on the mcp.* files), M1 👤 Gated (founder), CHOKEPOINT pinned. Remaining work is founder-gated (needs a key / OAuth / provider / chokepoint edit / taste call) or dormant-low-value (M1's project_id triage slice fires on no live caller). Both this session's features (INTEROP-V11 Q2 + lane-2 DBR-3i) + the land-on-main standing rule are on `origin/main`; lane↔main at 0 delta; nothing dangling. Long-polling ~25 min for a new row / released claim / founder push. Founder next action: publish `main` (deploys INTEROP-V11 Q2 + DBR-3i; the Q2 migration is already applied + dormant) + the gated activations.

### 2026-06-25 (new session) — board dry confirmed, long-polling

New session started. `bash scripts/lane.sh next` = exit 2 (BOARD DRY). Re-verified: all Tier-1/Tier-3 open items are Gated/Deferred/Parked. No new rows in the dashboard since last session. State: lane-1 branch is 0 commits ahead/behind origin/main after rebase. Remaining founder-gated actions: SANDBOX provider pick, BLD-04 OPENHANDS_ENDPOINT + key, FIRECRAWL-FLOOR SearXNG deploy, Stripe live keys, DBR_ENTITY_ALIASING wrangler secret (already activated per dashboard), EMBED-CHOKEPOINT attended session. Long-polling ~25 min.

### 2026-06-30 (21:00) — board dry confirmed (v11 build front 100% complete), long-polling

New session — loop woke up. `bash scripts/lane.sh next` = exit 2 (BOARD DRY). Re-verified full dashboard: **233/243 = 95.9% strict / 96.7% weighted done.**

**State:** Every Tier-1 and Tier-3 ⬜/◐ item is either ✅, in the DONE ledger, or Gated. The v11 build front (#1-21) is 100% complete. Signal Fabric all autonomous slices shipped (Phase 0-3; SF-INSIGHT-HEAD Phase 3 ◐ [~90%] with Watch/Research/Listen sense agent wiring founder-gated on `loop.server.ts` chokepoint). 0 commits ahead/behind origin/main.

**10 non-done rows:**
- 5 ⬜ Gated: WM-M9 (chokepoint edit), BYO-P5 (founder strategic call), CMD-H2 (parked), SF-MCP (greenlight + tokens), SF-AUTOTRIGGER (BRAIN_AUTO_TRIGGER flag + autonomy-posture call)
- 3 ◐ partial: SF-INSIGHT-HEAD [~90%] in DONE ledger (chokepoint-gated); SANDBOX [~55%] Gated (provider pick); BLD-04 [~55%] in DONE ledger (OPENHANDS_ENDPOINT key)
- 2 ⏭️ Deferred

**Founder unblocks to resume autonomous building:**
1. Apply migration `20260630122000` to live Supabase → types regenerate → derive-tick proxy workaround cleaned up
2. Unlock SF-MCP (Gated → Tier 1) — agentic MCP source adapter, architected ready
3. Unlock SF-AUTOTRIGGER (Gated → Tier 1) — governed auto-trigger, needs `BRAIN_AUTO_TRIGGER` env var call
4. Ungate SANDBOX (Gated ◐ → autonomous) — Cloudflare Sandbox SDK + OPENHANDS provider pick
5. Flip `WM-M9` chokepoint removal (attended session, removes BYOK from self-serve) 

Long-polling ~25 min for new rows, founder unlock, or configuration push.

## 2026-07-02 (17:07) — OBS-02 ✅ shipped: Obsidian app shell (rail + top bar + keyboard)

**Picked via `bash scripts/lane.sh next`** (v3 Obsidian port front, OBS-01→02→03 strictly ordered foundation; OBS-01 already ✅). Claimed `OBS-02` with globs covering `nav-model.ts`/`.test.ts`, `AppShell.tsx`, `TopBar.tsx`, `CommandPalette.tsx`, the new `Surface.tsx`, `_authenticated.tsx`, and every `_authenticated.*.tsx` route.

**Built:** hoisted `AppShell` once into `_authenticated.tsx` (was wrapped per-page in 21 routes — mechanically unwrapped to `<>...</>` Fragments + dropped the import). Reshaped `nav-model.ts` to the Obsidian iconography law (mono index `01`-`05`, no lucide; Ask off the rail, Discover/Plan added as interim `/product`-tab-scoped destinations). Rewrote `AppShell.tsx` (236px rail, Butterfly header, footer trio) and `TopBar.tsx` (52px bar) to the exact `obsidian-port/OBS-02.md` token values. New `src/components/obsidian/Surface.tsx` container. Rewrote `CommandPalette.tsx`'s `GotoShortcuts` from a vim `g`-chord to `1`-`5` + `g`. Cleaned up 11 routes' dead `listProjects`/`projects` queries left dangling by the unwrap.

**Adversarial review (dispatched TypeScript reviewer) caught 2 real regressions, both fixed before commit:** the shell hoist would have silently wrapped the full-viewport, no-shell `/onboarding` route (exposing all nav + shortcuts pre-onboarding) — now explicitly excluded; and `FlowWidget` (the app's only Flow-mode entry point) would have been fully orphaned by the new 3-row footer anatomy — kept, unstyled, in the user-chip row rather than dropped. Also fixed: a `navItemActive` bare/tab-scoped double-active bug (Discover+Plan both highlighting on `/product?tab=roadmap`), a malformed CSS border value, and 2 stale comments.

**Concurrency note:** lane 2 was building OBS-03 (primitives) in parallel on largely disjoint files; a routine `git fetch` + rebase surfaced a real conflict in `feature-dashboard.md`'s shared header/rows (both lanes' "Last updated" stamps + both lanes' OBS-02/OBS-03 rows) — resolved by hand, preserving both lanes' content (never blanket `--ours`/`--theirs`), per the standing merge-conflict rule.

**Gates:** `tsc --noEmit` 0 · `bun test` 1892/1892 pass · `bash scripts/dashboard-tally.sh` recomputed. `bun run build`/`dev` untested in-worktree (documented pre-existing `lovable-tagger` ESM/CJS bug in every lane worktree, confirmed again this cycle even on a newer local Node via `nvm`, so it is a package bug not a Node-version issue — not this diff's concern per OBS-02.md §12).

Files: `src/lib/nav-model.ts`, `src/lib/nav-model.test.ts`, `src/components/cadence/AppShell.tsx`, `src/components/cadence/TopBar.tsx`, `src/components/cadence/CommandPalette.tsx`, `src/components/obsidian/Surface.tsx` (new), `src/routes/_authenticated.tsx`, 21 `src/routes/_authenticated.*.tsx` routes, `public/assets/butterfly-ember.svg` (new), `docs/planning/feature-dashboard.md`, `docs/features/obsidian-port.md`, `docs/strategy/session-decisions.md`, `plan.md`.

Claim released (`lane.sh done OBS-02`) — unblocks lane 2's deferred `/obsidian-specimen` route (its glob was waiting on this one) and OBS-04..09. Continuing to the next eligible item.

## 2026-07-02 (17:52) — OBS-04 ✅ shipped: Today ported to Obsidian (the ritual)

Picked via `bash scripts/lane.sh next` (OBS-04, next in the Obsidian port front, unblocked once OBS-03's primitives shipped). Claimed with globs `src/routes/_authenticated.today.tsx,src/components/today/*`.

Full rewrite of Today on the OBS-03 primitives: Hero, LoopStrip, the calls queue as canonical CallCards, a progress bar, WhatChanged, a reskinned brief, and the one Loop Health aurora + machine-right-now. Cross-object sync on answering a call rewrites the queue/badge/hero/progress/linked-mission with no reload. Mounted `ToastProvider` (Toast's first consumer) in the shared `_authenticated.tsx` layout.

Adversarial review (dispatched TypeScript reviewer) caught 3 real bugs, all fixed before commit: a dead mission deep link (wrong route/search key), silently-dropped Critic evidence on spec/opportunity calls, and two panels (brief, bottlenecks) dropped outside the spec's authorized list — reconciled (brief restored, bottlenecks confirmed genuinely out of IA and documented).

Gates: tsc 0, 1909/1909 tests. Claim released; unblocks OBS-05..09 (parallelize per lane) and OBS-14. Continuing.

## 2026-07-03 (02:xx) — Overnight session: OBS-PORT closed, DSN-01 + DSN-02 shipped; board dry, long-polling

**272/292 done (93.2% strict / 95.1% weighted) at last recompute — moves fast under 4 concurrent lanes, check the live dashboard headline for the current number.**

Founder directive: run autonomously overnight, priority order untouched → partial → founder-gated-with-autonomous-slice, claim before touching anything (4 lanes running), close items with full doc-loop, write a handoff and long-poll when the board goes dry.

**OBS-PORT (bookkeeping close, no feature work):** the umbrella tracking row only ever pointed at its 15 OBS-01..15 sub-items (12 shipped, 3 shipped-partial with no further autonomous slice). Retired it from the ledger; `lane.sh done` auto-flipped it to `✅` (the same known can't-tell-partial-from-full bug as OBS-10/OBS-13); corrected to `◐ [~80%]` in the same commit.

**DSN-01 shipped — Design memory (v12 §6, Tier 1).** The workspace's design language as standing, supersedable decisions (tokens/type/spacing/principles/voice/patterns), seeded by URL import / pasted constitution / defaults, binding into every DEF-04 scaffold and learning back from approve/reject. Mirrors the `house_rules` standing-decision pattern exactly (migration `20260703140000_dsn01_design_memory.sql`). A dispatched `ecc:security-reviewer` caught 2 real SSRF issues (unvalidated redirect, an IPv4-mapped-IPv6 bypass) and a prompt-injection framing gap in the URL-import path — all fixed before it shipped, plus a genuine bug fix in `scripts/dashboard-tally.sh` itself found while re-running it (its bracket-weighting check was an exact-match that silently zero-weighted every `[~NN%]`-annotated partial row).

**DSN-02 shipped — The Critic's design lens (v12 §6, Tier 1).** Heuristic evaluation (hierarchy, accessibility floors, IA laws) plus consistency-vs-design-memory, folded into `runCritic` for every PRD and exposed standalone for DEF-04 scaffolds via a "Check design consistency" button. Reuses DSN-01's `formatDesignMemoryContext` unchanged, exactly as planned when DSN-01 shipped. Closes the v12 design leg's full Tier-1 pair in one session.

**Live-verified DSN-01 end to end** since the founder said he was going to sleep and had already applied all migrations up to that point (before DSN-01 landed): applied the `design_memory` migration directly via the Lovable MCP (Supabase MCP unauthorized this session, matching prior-session precedent), confirmed RLS + both policies live, ran a real insert/select/delete round-trip against a live workspace, confirmed Lovable had auto-synced to the pushed commit, and triggered `deploy_project` per the founder's standing authorization to publish through Lovable for testing.

**Gates (both items):** tsc 0 throughout; `bun test` climbed from 2121 → 2175 pass across the session as concurrent lanes' tests merged in; 23 new tests of my own (16 design-memory, 7 design-critic).

**Rebase overhead note (for whoever picks up the pattern next):** with 4 lanes hammering `feature-dashboard.md`'s shared headline/by-priority/by-status summary blocks simultaneously, nearly every push this session needed 1-3 rounds of conflict resolution on those specific blocks (never on the per-item rows, which auto-merge fine via the ledger's disjoint-glob discipline). Landed on a faster resolution pattern: take the incoming (already-more-current) side wholesale for these derived-number blocks rather than hand-splicing both branches' prose, then do ONE fresh `bash scripts/dashboard-tally.sh` run and patch just the numbers/in-dev lists. A real, permanent fix for `dashboard-tally.sh`'s bracket-weighting bug shipped as part of this (see DSN-01 above) so the script's own raw output is trustworthy again; the remaining conflict *frequency* is inherent to 4 lanes editing the same handful of summary lines and not something a single lane can fix alone.

**Board checked dry after DSN-02** (`bash scripts/lane.sh next` → exit 2, no eligible Tier-1/Tier-3 row). Before accepting that, investigated the two most promising untouched Tier-2 rows by hand (per the founder's "also check founder-gated items for an autonomous slice" instruction) rather than skipping them on a label alone:
- **DSN-04** (design contract rides the BuildSpec) — its described mechanism explicitly routes "through the BuildDriver seam," which is founder-gated (board group G13, phases BD-1..BD-6, decided 2026-06-28 per CLAUDE.md). Real blocker, not a quick close.
- **AGT-03** (speculative reversible prep) — dispatched a research agent first: confirmed AGT-02 is NOT a blocker and the write side (staging a prep cache when a contract is drafted) is fully buildable outside the 5 pinned chokepoint files. But the actual latency-overlap benefit the spec describes can only be realized by having `runAgentLoop` (pinned) consult that cache instead of doing its own fresh fetch — without that, a "prep" write-path with no real consumer is closer to busywork than a shipped feature. Judged this not worth a shallow/dishonest partial ship; recommend re-scoping AGT-03 as attended-chokepoint work (same class as AGT-01/AGT-02) rather than autonomously forcing it tonight.

**Long-polling per doctrine** (`ScheduleWakeup`, ~25 min) rather than hard-stopping — other lanes may open new Tier-1/3 rows, or a founder-gated item may get unblocked by a fresh look in the morning.

## 2026-07-03 (03:xx) — Scheduled recheck: DSN-03 closed, board dry again

**276/292 done (94.5% strict / 96.1% weighted) at last recompute.**

Woke from the scheduled long-poll to a formatting-only diff on the DSN-01/DSN-02 files (editor format-on-save, no logic change; committed as a trivial cleanup) and a real code refactor from another lane: AGT-03 (speculative reversible prep) had landed, adding scaffold persistence (`prd_scaffolds`) via `persistScaffold`/`getPersistedScaffold`/`prepareScaffoldSpeculative` in `design-scaffold.functions.ts`. That was a substantive rebase conflict (a real refactor, not a formatting collision) — took the incoming version wholesale since it was a strict superset of my prior DSN-02 code plus the new persistence layer.

**That scaffold-persistence landing directly unblocked DSN-03's own documented remainder.** DSN-03 (flow before screens, lane2) had shipped its flow-generation half earlier this session but explicitly could not wire the "scaffold derives from flow" `artifact_lineage` edge because no scaffold row existed to point an edge at — a genuine, honestly-documented prerequisite gap, not a lane-collision block. With AGT-03's `prd_scaffolds` table now real, re-claimed DSN-03 and closed it: added `recordScaffoldDerivedFromFlow` to `persistScaffold`, writing a second lineage edge (`prd_flow` derived-from `prd_scaffold`) whenever a scaffold is saved and the PRD already has a generated flow. Fires for both the manual generate path and AGT-03's speculative prep path. Non-fatal, matches the existing PRD-to-flow edge's discipline exactly.

Concurrently, lane4 shipped DSN-04 (the design contract rides into Build) in the same rebase window — **the full v12 design leg (DSN-01 through DSN-04) is now closed**, spanning three different lanes across one overnight session.

**Gates:** tsc 0 throughout; `bun test` climbed 2175 → 2197 as concurrent lane tests merged in.

**Board re-scanned exhaustively before long-polling again**, not just taken on `lane.sh next`'s word: every remaining ⬜/◐ row was checked against its own documented remainder. All of them are genuine, already-investigated founder blockers — OBS-PORT/OBS-10/OBS-13/OBS-15 (Obsidian-port remainders, previously closed out to their honest ceiling), JNY-05 (its last 15% needs a registered Slack OAuth connector and a Business-tier write-back ruling this session has no standing to make), SANDBOX/BYO-P5 (founder-gated infra), and the rest (WM-M9, CMD, RF-06/07, AGT-01/02, DSN-05) explicitly Gated. No shallow or forced work taken to manufacture activity.

**Long-polling again** per doctrine.

## 2026-07-03 (05:xx) — Final recheck: cross-lane dry confirmed, stopping for the night

**276/292 done (94.5% strict / 96.1% weighted).**

Woke to two commits since the last check, both from other sessions/lanes and both clean merges (zero conflicts): a real security fix (`e0c96592`, trailing-dot SSRF bypass in `isPublicHost` — `new URL().hostname` preserves a trailing dot verbatim, but every check in that function was exact-match/`.endsWith()`, so appending "." to any blocked host silently bypassed the guard on `importDesignMemoryFromUrl`; fixed with a regression test, found by an automated background review, not by me, but landing on code this lane shipped tonight so noted here for the record) and lane3's own cross-lane dry confirmation (`eeb6ec2c`) reporting `bash scripts/lane.sh list` shows zero active claims from any lane besides the permanent `CHOKEPOINT` pin, and independently corroborating that every remaining `◐` row's blocker is genuine (not repeating its own prior reasoning, but citing OBS-PORT's retirement note verbatim as independent evidence).

Confirmed the same from this lane's side: `lane.sh next` still returns exit 2, `lane.sh list` shows only the pinned chokepoint claim, working tree clean and fully synced with `origin/main`, tsc 0.

**Stopping the long-poll loop here, per the founder's own stated stopping condition** (stop once the board is dry, with a handoff note) **and the cross-lane corroboration that all four lanes are genuinely idle** — continuing to poll every ~25 minutes overnight with a confirmed-dry board across every lane would not surface new work; the founder's morning review is what unblocks the remainder, not another recheck cycle.

### This lane's full session account (all items, in order)

1. **OBS-PORT retired** (bookkeeping only) — the umbrella tracking row's 15 sub-items were all already accounted for (12 done, 3 shipped-partial with no further autonomous slice); corrected a `lane.sh done` auto-flip mislabel back to the honest `◐ [~80%]`.
2. **DSN-01 shipped** — design memory: standing, supersedable design-language decisions binding into DEF-04 scaffolds. A dispatched security review caught and fixed 2 real SSRF issues (unvalidated redirect, IPv4-mapped-IPv6 bypass) plus a prompt-injection framing gap before it shipped. Live-verified end to end via the Lovable MCP (migration applied, RLS + round-trip confirmed) since the founder was asleep before it landed, then triggered a publish per his standing authorization.
3. **DSN-02 shipped** — the Critic's design lens: heuristic + consistency-vs-design-memory findings, folded into `runCritic` for PRDs and exposed standalone for DEF-04 scaffolds.
4. **DSN-03 closed** (lane2 shipped the flow-generation half earlier; this lane closed its documented remainder) — the "scaffold derives from flow" lineage edge, unblocked once a concurrent lane's AGT-03 added scaffold persistence.
5. **A real, previously-undiagnosed bug fixed in `scripts/dashboard-tally.sh`** — its bracket-weighting check was an exact match that silently zero-weighted every `[~NN%]`-annotated partial row; fixed to a prefix match, restoring trust in the script's own output for every lane.
6. Investigated (not shipped, judgment call documented) **DSN-04** and **AGT-03** by hand before accepting board-dry the first time — both turned out to have real structural blockers at that point (a founder-gated BuildDriver seam and a pinned-chokepoint dependency respectively); both were later closed autonomously by other lanes once the actual buildable slice became clear, confirming the caution was warranted rather than overcautious.

Every item: `tsc --noEmit` 0, full test suite green at each checkpoint (2121 → 2197 across the session as concurrent lane tests merged in), full doc-loop (dashboard row + feature doc + `plan.md` + `SOURCE-OF-TRUTH.md` cursor), committed with an explicit WHY, rebased through repeated concurrent-lane conflicts, pushed to `origin/main`, claim released via the ledger every time.

**Nothing left mid-build. No claim held. Founder's morning punch list is lane3's `eeb6ec2c` note** (JNY-05 Slack OAuth + Business-tier ruling, OBS-10's URL-rename sign-off, OBS-13's visual pass needing a working `bun run dev`, OBS-15's remainder) — this lane's own findings agree with it in full, nothing to add.

## 2026-07-03 (post-session audit) — Independent re-verification of the entire Gated/Deferred bucket (rows 43-53)

Founder asked, after the session's handoff: why are rows 44 (WM-M9) through 53 (BUILD-DRIVER) fully untouched? Ran an 11-agent workflow (rows 43-53, SANDBOX through BUILD-DRIVER) that independently re-checked each item against the LIVE codebase — not the dashboard's own prose — then adversarially re-verified every case where an agent believed it found a buildable autonomous slice, since a false positive here would waste a future lane's whole session.

**Verdict: all 10 items are correctly classified.** Every one needs one of: an edit to a pinned CHOKEPOINT file (WM-M9, RF-06, RF-07, AGT-02, and BUILD-DRIVER's chokepoint half), a founder-only business/pricing/taste decision already recorded and not yet reversed (SANDBOX's spend deferral, CMD H2's scope park, BYO-P5's account-opening + isolation sign-off, BUILD-DRIVER's greenlight), an OAuth app registration only the founder can make (DSN-05 — see below, worse than documented), or a "do not build" architectural veto already fully discharged by other shipped features (F-COCKPIT-MACHINE-MODE).

**One genuinely new finding, folded into DSN-05's row:** live-queried the Lovable connector gateway directly and confirmed Figma is not in Lovable's hosted OAuth2 connector list at all — only its local-desktop MCP list, which cannot serve a server-side multi-tenant import. DSN-05 needs a bespoke non-gateway OAuth flow built from scratch, not just a founder registering with an existing gateway pattern.

**Three near-misses worth recording so a future session doesn't retread them:**
- **RF-07** (eval-driven prompt optimization): first-pass audit found its 3 stated pieces (eval judge, versioned prompt tables, auto-pickup) already shipped, and proposed a small new "bridge" file to close the gap with no chokepoint edit. Adversarial re-check found the bridge needs a new AI call-type literal defined inside the pinned `runtime.server.ts` (or an ill-fitting reuse of an existing one, itself a real design call) — and, decisively, `SOURCE-OF-TRUTH.md` explicitly lists RF-07 in a "Founder decision list" distinct from the file-lock mechanism, which three separate overnight lane sessions already independently chose not to touch. Stays Gated.
- **AGT-01** (structured-output protocol upgrade): first-pass audit proposed a standalone, unwired native-tool-schema translation module outside the pinned files, framing it as the same "speculative prep" pattern AGT-03 shipped. Adversarial re-check found the schema claim didn't hold for several real tools (nested/record/default fields needing per-provider design decisions), and — more decisively — this exact prep pattern was already tried and explicitly rejected earlier tonight for AGT-03's sibling case ("busywork, not a shipped feature"; see this file's earlier entry). The audit had inverted that precedent into an endorsement. Stays Gated.
- **BYO-P5**: audit proposed finishing 4 unimplemented methods on the already-shipped Deno Deploy PoC adapter. Adversarial re-check found the claim undercounted scope (5 broken methods not 4), one method has no matching Deno API endpoint at all, "rollback" is materially harder than portrayed, and two of the four target methods (`setEnvVar`/`readEnvVars`) are explicitly named in the project's own BYO-P5 plan doc as carrying security-invariant obligations tied to the still-founder-gated P5c phase. Stays Gated.

No code changed in this audit — it is a documentation/verification pass only. Files touched: `docs/planning/feature-dashboard.md` (DSN-05 row) + this report.

## 2026-07-03 (OBS-13 closing pass, founder-authorized) — the three deferred Tier-2 design slices, then board-dry again

Founder asked directly what was pending on OBS-13 (why `[~70%]`, not 100%). Per the standing loop rule Tier-2 design items are founder-prompted, not self-picked — this question WAS that prompt. Answered with the exact three deferred slices from the 2026-07-02 partial ship (documented in `obsidian-port.md` §13's own risk-note allowance), then the founder chose "all three slices" when asked how far to take it.

Claimed `OBS-13` after clearing a stale `lane.sh done` DONE-marker from 2026-07-02 (the same known can't-tell-partial-from-full bug already documented against OBS-10/OBS-PORT — no other lane held an active claim, confirmed via `lane.sh list` before clearing).

**1. The §8 connection-card anatomy**, built directly (not delegated — foundational, wanted tight control): three new additive `StatusDot` states (`live`/`stale`/`failing`, moss/marigold/madder, each with the spec's literal `0 0 10px` glow) added to the shared `status.tsx`; `ConnectionRow.tsx` rewritten to the full anatomy (mono scope/owner/last-sync/permissions line, one primary action per row, Verify/Remove kept as quiet secondary text rather than dropped).

**2. The 7 admin sub-pages + the Plan pane**, dispatched as a Workflow (pipeline: redraw → adversarial verify per file, 16 agents total) given the scale (2651 lines across 7 independent route files + ~1650 lines of coupled billing UI). Verification caught 2 real, fixable defects the redraw agents introduced: `admin.ai-costs.tsx`'s new summary line was a banned triple-adjective listicle ("faster, more reliable, and cheaper" — the exact pattern `humanized-output.md` names); `admin.platform.tsx` colored its generic banner "warn" severity marigold, which the design contract reserves for in-review status only (a real one-job-per-role-color violation, not a nitpick since it's an explicit hard law, not a style preference). Both fixed by hand after the workflow returned, along with two smaller opportunistic cleanups the verifiers flagged (a stray em dash in agent-authored header comments; a pre-existing banned "unlock" buzzword sitting inside the exact region already being touched).

**Judgment calls made, not left to the agents:** kept Verify/Remove capability on connection rows despite the spec's literal "ONE action" language, reasoning that a hard anatomy law governs the primary CTA slot, not every affordance on the row, and dropping real capability to satisfy a literal reading would be a regression the spec never asked for. Dropped the old per-row "manage repos →" GitHub shortcut as now-redundant once the workspace-bindings shelf sits in the same Connections pane (not flagged by any verifier — a scope call I made independently, documented in the ship note for whoever reviews next).

Rebase after the Workflow's push-heavy stretch hit one conflict (the OBS-13 row itself, against my own earlier claim-flip commit already on `origin/main`) — resolved by keeping the closing pass's content, the strict superset.

Gates: `tsc --noEmit` 0 project-wide, `bun test` 2198/2198 pass, `bun run lint` clean (0 errors after one prettier auto-fix on two files), lucide grep clean across every touched file, `bun run build` hits only the known pre-existing node20-vs-lovable-tagger ESM failure (unrelated). Full doc-loop: `obsidian-port.md`, the dashboard register row + headline tally (`dashboard-tally.sh`: 277/292 ✅, 280.95/292 weighted), `plan.md` §4. Landed on `main` (fast-forward push, verified HEAD byte-for-byte equal to `origin/main`, spot-checked real symbols present). Claim marked `done` in the ledger.

**Board re-checked mechanically after this closure: genuinely dry again** (`lane.sh next` → exit 2, only `CHOKEPOINT` held). Long-polling per the standing rule; no other in-flight work from this item.

**Recheck (~25 min later, scheduled wakeup):** `git fetch` shows zero new commits on `origin/main`; register still 292 rows, same 13 open/partial rows (OBS-PORT/OBS-10 Tier 1, OBS-15/JNY-05 Tier 2, the 9 Gated rows already exhaustively audited in the post-session audit above) — no re-audit needed since nothing changed. `lane.sh next` still exit 2. Long-polling again.


## 2026-07-03 - AGT-01 + AGT-02: a founder-attended edit to the pinned AI chokepoint

Founder asked directly, by name, to pick up AGT-01 and AGT-02 and close them. Both had sat `⬜ Gated: attended chokepoint work` / `approval semantics in the pinned loop` since 2026-07-02 - the one dashboard gate class the autonomous `lane.sh next` picker structurally cannot clear itself, since the ledger's `CHOKEPOINT` pin permanently reserves `src/lib/ai/{runtime,loop,cache}.server.ts` (and 2 siblings) against every numbered lane's claim, by design, as a safety guard against concurrent/incidental edits to the highest-blast-radius code in the product. A direct founder request naming these rows IS the unlock that gate exists to wait for - handled it as an attended session, not a bypass of the ledger's intent.

**Research fanned out to parallel agents; the actual chokepoint edit was written and reasoned through directly, not delegated.** Given the single-point-of-failure blast radius (every agent surface in the product runs through `executeLoop`/`callModel`), this was the one piece of work this session where "dispatch it to an agent and review after" felt like the wrong risk tradeoff versus writing it myself with full context, then subjecting it to genuinely independent adversarial review.

**AGT-02 (Consent scopes) ships live, no flag.** A new exported `resolveToolMode()` extracts the loop's full mode-composition chain out of `executeLoop`'s prior inline block, so the safety-floor ORDERING itself is unit-tested (8 new tests), not just the predicates it calls. Once a mission's own Outcome Contract is approved, its genuinely reversible tool calls auto-clear from `confirm` to `auto` - sticky `review` and both hand-curated safety-floor sets stay explicitly, unconditionally excluded by name (not just chain position), which matters concretely for `calendar.create` (classified reversible yet must never auto-clear).

**AGT-01 (native tool-calling) ships dormant, one env var from live.** Retires the regex-parsed JSON-in-text loop protocol in favor of native provider tool-calling, behind `AGENT_NATIVE_TOOLCALLING` (unset by default) - the exact activation pattern this codebase already established for `STUDIO_AUTO_SHIP`. Built the real capability (zod-to-json-schema tool translation covering all 44 registered tools with zero per-tool special-casing needed, contrary to what a prior audit had feared; native wiring in all 3 non-streaming provider dispatch helpers), not a stub, but let the founder time the production cutover rather than flip a wire-protocol change for every live agent run in the same session it was written.

**What the adversarial review actually caught, and why this is worth remembering as a pattern.** A 4-lens review (safety-floor preservation / backward-compat / real Anthropic-OpenAI wire-format correctness / loop-integration-integrity), each finding independently re-verified by a second pass before being accepted, caught 2 confirmed-blocking defects a self-review had missed: (1) the AGT-02 contract-approval lookup assumed a `missions.prd_id` column that does not exist anywhere in the schema - confirmed against the generated Supabase types and an explicit comment already sitting in this repo's own `test-station.functions.ts`. The query would have silently returned a PostgREST error the code never inspected, leaving `contractApproved` permanently `false` in production while the capability looked fully wired. Fixed to the correct, already-established `studio_changesets.mission_id -> prd_id` link. (2) A native tool call with no accompanying prose leaves the provider's text output empty; the loop was pushing that empty string as the turn's assistant conversation history - the review's verify pass went further than the original finding and confirmed this is a genuine, code-checkable path to an Anthropic 400 (the Messages API rejects empty non-final message content) on the very next step, which would have crashed the first agent run where a tool-tuned model replied with a bare tool call after the flag was ever flipped on. Fixed with a non-empty `{thought, action}` fallback at all 6 `conv.push` sites. Neither defect was reachable in production today (one is dormant-by-default, the other only fires under specific model behavior), but both would have silently broken the feature - or crashed a run the moment it was actually exercised - and neither was the kind of thing `tsc`, lint, or hand-written unit tests (which supply their own well-formed inputs) would ever catch. This is the concrete case for genuinely adversarial, independently-verified review on chokepoint work specifically, not a self-check.

**A self-inflicted process mistake, caught and fixed before it became a bigger one.** After the first commit, ran a bulk find-and-replace to strip the 100+ em dashes the new docs/comments/tests had introduced (a real humanized-output violation on my own authored content, not just platform output) - but the first attempt's "collapse double spaces" regex also silently collapsed every 2-space/4-space code indentation down to a single space across 13 files. Caught it before pushing by re-reading the diff, reverted completely via `git checkout`, and redid the fix twice more: once correctly preserving indentation but (on inspection) discovered it had swept 2,374 dashes across the ENTIRE historical content of `plan.md`/`feature-dashboard.md`/`session-decisions.md` - files with years of prior sessions' em-dash-heavy prose that were never part of this session's work - which is exactly the "no retroactive cleanup" convention this repo has stated multiple times. Reverted again and redid it a third time, surgically: diffed against the pre-session commit to identify precisely which lines this session actually added, and touched only those. Recorded here because it is the kind of near-miss worth a future session not repeating: a bulk text-processing "fix" against a large shared file needs the same scoping discipline as a code change, and a script's blast radius should be verified against a real diff before it's trusted, not just against its own printed summary.

**Rebase landed one more legitimate conflict**: another lane closed OBS-15 and JNY-05 (the v12 design leg's remaining Tier-2 pair) concurrently, plus claimed OBS-10 as `🔨 In Dev`. Resolved by keeping both lanes' prose narratives (mine prepended as newest) and re-running `dashboard-tally.sh` fresh on the fully-merged register rather than hand-summing either side's stale partial view - the tally's own documented rule for exactly this situation. True combined state: 281/292 done, 283.30/292 weighted (97.0%).

Gates: `tsc --noEmit` 0, `bun test` 2253/2253 pass (30 new tests), `bunx eslint` clean on every touched/new file, zero em/en dashes remain in any line this session added. Full doc-loop: two new feature docs (`consent-scopes.md`, `agent-native-toolcalling.md`), both dashboard rows to `✅`, `session-decisions.md` (a major architectural decision, recorded as the precedent for how a lane should handle a future founder-attended chokepoint request), `plan.md` §4, this report. Landed on `main` (fast-forward, verified HEAD byte-for-byte equal to `origin/main`, spot-checked `resolveToolMode`/`resolveModelAction`/`toolInputSchema` present).

Resuming the standard lane loop (fetch, rebase, reap, `lane.sh next`) immediately after this entry.

## 2026-07-03: RF-07 closed - a mis-gated row, and a genuinely messy rebase

Founder said "pick this next: RF-07" (twice - the first time was interrupted mid-research by "stop it", respected immediately with no further action; the second re-issue continued the same investigation). RF-07 sat `⬜ Gated: attended chokepoint work` since 2026-07-02 on a prior audit's assumption that its drafting AI call needed a new `CallSurface` literal in the pinned `runtime.server.ts`. Deep research (4-agent parallel workflow) found two already-shipped precedents - LRN-02's Historian verdict drafter and this session's own RF-04 (`house-rules-tick.ts`) - reusing the existing `judge` surface for the same draft-only shape with no chokepoint edit at all. Built RF-07 the same way: `src/lib/prompt-optimization.functions.ts` mines a prompt template's matching eval suite for graded failures (scoped to the active version, real judged failures only via `status = 'failed'`, not the broader `passed = false` which would count ungraded infra-error rows), drafts a revised system prompt, inserts one new `prompt_versions` draft row - zero edits to any of the 5 pinned chokepoint files, confirmed via `git diff --stat`.

A dedicated 3-lens adversarial review made the CallSurface-reuse decision itself one of the three lenses, not just safety/correctness - it confirmed the reuse holds up on the merits (every place `runtime.server.ts` branches on the surface string is gated by a `CallOpts` field RF-07 already sets correctly). Caught one confirmed-blocking defect (mining conflated ungraded infra-error rows with real judged failures) plus 4 real-but-minor issues (evidence not scoped to the active version; a moderate injection-flag silently swallowed; idempotency keyed on editable free-text notes; a duplicate-eval-suite edge case) - all fixed before commit.

**The rebase was the hard part, not the code.** Landing this hit FOUR separate concurrent pushes in a row (CMD-0, then WM-M9, then OBS-10, then a docs-only OBS-10 follow-up) - each one re-conflicting the same giant "Overall completion" summary paragraph in `feature-dashboard.md` (a single markdown line accumulating years of prepended history). Two of my own conflict-resolution passes introduced real bugs, both caught before push by re-running `scripts/dashboard-tally.sh` and cross-checking the row count against 292: (1) an over-eager `.rstrip('\n')` in a Python resolution script concatenated two table rows onto one physical line, making one invisible to the tally's line-anchored regex (this exact bug recurred a second time, since it was baked into an already-created commit that got replayed fresh on a later rebase - fixed forward both times); (2) a naive longest-common-suffix merge produced a genuinely duplicated "Total features / By priority class / By status table" block, not just a formatting quirk - caught by grepping for the section marker and finding 2-3 occurrences where there should be exactly 1, fixed with a full reconstruction of that region rather than a patch. The lesson, now recorded in `session-decisions.md`: after ANY rebase-conflict resolution touching this file, verify the row count is exactly 292 (not 291 or 293) and grep for duplicate section markers BEFORE trusting the numbers - never assume a Python string-merge script got the boundaries right on the first try.

Final state: 284/292 done, 287.00/292 weighted (98.3%). Gates: `tsc --noEmit` 0, `bun test` 2296/2296 pass (23 new tests), `bunx eslint` clean. Full doc-loop: new feature doc (`prompt-optimization.md`), dashboard row + tables recomputed fresh (not hand-incremented), `session-decisions.md` (the corrected-audit-finding precedent), `plan.md` §4, this report. Landed on `main` (verified HEAD byte-for-byte equal to `origin/main`, spot-checked `proposePromptOptimization`/the registered route/the dashboard row all present). Claim released.

Resuming the standard lane loop (fetch, rebase, reap, `lane.sh next`) immediately after this entry.

## 2026-07-07: SW-6 claimed (production ship seam) - SW-2 handed to the goal session

Founder redirect at cycle start: SW-2 (build/test/ship spine) was already being driven by the main "goal" session; lane 1's earlier claim would have duplicated it. Released SW-2 in the ledger, re-attributed its dashboard row to `In Dev (goal, 2026-07-07)` on origin/main (kept In-Dev so no lane re-picks it), and claimed **SW-6: production ship (mission 3.12 cold start, tenant safety, failure floor, config truth + 3.13 felt journey)**. Claim pushed to main by lane.sh; ledger note names the handoff. Globs: observability lib, health endpoint, onboarding/signup/login routes, onboarding components. Building now.
