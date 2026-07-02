# Parallel build — Lane 3 report

> Lane 3 (`parallel/lane-3`, worktree `cadence-lane-3`). Preferred: Governance, then Cockpit; roams the whole board. Driver: continuous `/loop` in this terminal. Full rules: `docs/operations/autonomous-build-loop.md` §15-16.

## 2026-06-25 — SANDBOX #23: ExecProvider seam made load-bearing (founder-directed pick)

Founder directed: "start with #23 - SANDBOX." The seam (`src/lib/exec/provider.ts`, shipped ◐ 2026-06-21) was scaffolded but **parallel** to the real merge gate — both it and the chokepoint-pinned `registry.server.ts` read `studio-ci.ts` directly, so it was in no decision path. The natural wiring target (`studio.pr.merge` at `registry.server.ts:1702`) is chokepoint-pinned to the core lane, so I took the spec's sanctioned alternative ("or a preview surface") through the **un-pinned** server data path.

**What shipped:**
- `src/lib/exec/provider.ts` — added `label` to `ExecProvider` (human name; engine-room "name the place, not the mechanism"), the `ExecGate` type, and a pure `execGateFromChecks(checks, preferred?)` helper.
- `src/lib/studio.functions.ts` — `StudioCi` gains a `gate` field derived through the seam in `getStudioSession` (`overallFromChecks(checks)` equals the stored snapshot `overall`, so it cannot drift from the verdict chip).
- `src/components/studio/CiPanel.tsx` — surfaces the plain-language merge readiness (`gate.reason`, coral only on real failure) + `ran on · {providerLabel}` provenance at the point of merge decision (v11 CORE-UX-TRUST). Guarded on `checks > 0`.
- `src/lib/exec/provider.test.ts` — +6 tests (label + `execGateFromChecks`).

**Gates:** tsc 0 · bun test 1547 (`provider.test.ts` 15) · build red only at the known pre-existing lovable-tagger ESM config-load baseline (unrelated). Touches ZERO chokepoint-pinned + ZERO founder-only surfaces (no spend, no secret, no `registry.server.ts`, no new dep).

**4-lens adversarial Workflow review (drift · type-breakage · doctrine-UX · security): 3 ship + 1 blocker FOUND & FIXED.** The doctrine lens caught that the neutral/empty-checks `gate.reason` ("No CI is configured…") rendered above, and contradicted, the existing "No checks reported yet" line — and was factually wrong on a fresh PR during the open→CI-start window. Fixed by guarding the whole gate block on `ci.checks.length > 0`, so the misleading neutral verdict can never render.

**Status: SANDBOX → ◐ (~70%).** Remaining (gated, NOT autonomous from this lane): the Cloudflare Sandbox SDK adapter (founder compute-spend, sourcing-map call #4) + routing the `studio.pr.merge` gate itself through the seam (`registry.server.ts` chokepoint, behaviour-identical today). Commit `7bb9947a90` (rebased + pushed to main).

**Then: board dry.** `bash scripts/lane.sh next` reports no eligible Tier-1/Tier-3 ⬜/◐ item unclaimed + not done. The only non-Gated open row is DEF-04 (◐), whose autonomous slice is ledger-done and whose remainder is chokepoint-pinned + founder-spend-gated (the same gates). Lanes 1 & 2 are actively building (EMBED-CHOKEPOINT, CONN-STATUS-UX). Long-polling per protocol; recheck ~25 min.

## 2026-07-02 15:42 — Board dry (dependency-blocked): OBS foundation in flight

Cycle: `git fetch` + rebase (22 commits behind → caught up) → `lane.sh reap` → `lane.sh next`.

`bash scripts/lane.sh next` returned 8 ids: `OBS-PORT, OBS-04, OBS-05, OBS-06, OBS-07, OBS-08, OBS-09, OBS-10` — the entire remaining Tier-1/Tier-3 open pool (Tier 2 OBS-11..15 and the 4 Gated rows are correctly excluded). None are actually buildable this cycle:

- `OBS-PORT` is the initiative-tracking row only ("no feature work rides along ... this row tracks the initiative") — no distinct buildable slice.
- `OBS-04` through `OBS-09` each state **"Needs OBS-03"** in the row text (core primitives: Button/StatusDot/VerdictChip/CallCard/MissionRow/etc.) — hard sequential dependency, not yet built.
- `OBS-10` (IA consolidation) states **"After 04..09"** — depends transitively on the same block.

Live ledger (`lane.sh board`): lane1 holds `OBS-02` (shell, 10m in), lane2 holds `OBS-03` (primitives, 6m in) — both actively building the exact foundation that unblocks 04-10. Lanes 0 and 4 are also idle for the same reason. Building any of 04-10 now would mean coding against primitives that don't exist yet (rework risk, contradicts "surgical changes only").

**Not forcing premature work. Long-polling per protocol** (`docs/operations/autonomous-build-loop.md` §15.6 — a hard dependency stated in the row text is the documented "another lane's area" skip case, not a lazy "looks dry" judgment). Recheck in ~25 min: once `OBS-03` lands, `OBS-04` through `OBS-09` become genuinely parallelizable across lanes 0/3/4.

## 2026-07-02 16:35 — BYO-P5 P5b: Deno Deploy PoC (founder-directed pick while OBS-02/03 in flight)

Board was genuinely dry for autonomous Tier-1/3 work (all 8 eligible items hard-blocked on lane1/lane2's OBS-02/OBS-03 foundation). Founder, present in-session, directed picking up BYO-P5's P5b slice instead of long-polling: he chose the Deno Deploy path (P5a-poc already proved it live at $0) over Cloudflare (still blocked on a founder-owned account).

**Shipped:** `src/lib/hosting/hosting-poc.{ts,functions.ts,test.ts}` — `provisionHostingPoc`, a founder-only server fn that deploys a real, minimal static shell for one of the admin's own Products via the existing `denoDeployProvider`. RLS (`auth.uid() = user_id` on `projects`) means it can only ever target a project the caller themselves owns. 8 new tests.

**Adversarial review (3 parallel lenses: security, correctness, doctrine) — 2 real findings, both fixed:**
1. Correctness: a bare `catch{}` around `provisionApp` was swallowing ANY failure (bad token, quota, outage), not just the intended "already provisioned" conflict; `deploy()` itself was unguarded against a thrown error. Fixed — a real failure's message now survives if the retry-deploy also fails.
2. Security (byproduct, not this feature's own bug): the admin gate this code first mirrored — `triggerDeploy` in `build.functions.ts`, the existing K1-deploy button — checks `profiles.plan_tier`, a column that doesn't exist on `profiles` at all (only `workspaces`/`accounts` have it). That button has never worked for anyone since it shipped. Fixed both this new code and `triggerDeploy` to gate via `user_roles` (the mechanism `amIAdmin`/`/admin/*` actually use). Extended my ledger claim (by hand-editing the ledger's own meta file, not git-tracked) to cover the opportunistic `build.functions.ts` fix.

**Not yet wired to a UI.** `src/routes/_authenticated.admin.platform.tsx` (the natural home, mirrors its `DeployPanel`) overlaps lane1's active `OBS-02` claim on `src/routes/_authenticated.*.tsx` — a mechanical block, not a decision. Next buildable slice once that clears.

**Gates:** `bunx tsc --noEmit` 0 / `bun test` 1883/1883 (150 files). Committed + pushed to main; claim released (BYO-P5 → ◐, named remainder). Dashboard tally recomputed: 239/260 = 91.9% strict / 239.95/260 = 92.3% weighted.

**Note (session correction):** confirmed via the live `CLAUDE.md` on disk that the post-push `sync-pcv4.sh` step was retired 2026-07-02 (v5 is now the sole canonical repo push target); stopped running it after this point. The earlier 3 pushes this session ran it harmlessly (a no-op local mirror refresh) before this was caught.

**Returning to the lane loop:** re-checking `lane.sh next` for OBS-02/OBS-03 completion.

## 2026-07-02 17:20 — BYO-P5 P5b: UI wiring lands (the deferred slice)

Once OBS-02 shipped (lane1) and released its broad `src/routes/_authenticated.*.tsx` claim, re-claimed `BYO-P5` for just `_authenticated.admin.platform.tsx` and wired `HostingPocPanel` (Product picker + deploy button + live-URL link, mirrors `DeployPanel`). Gates: tsc 0 / bun test 1901/1901. P5b is now fully complete; BYO-P5 stays ◐ overall (P5c onward needs the founder's own Cloudflare/Supabase account, explicitly gated — not this lane's call to proceed on unprompted).

Marked `lane.sh done BYO-P5` (no autonomous slice remains for this lane right now). Returning to the mechanical loop.

## 2026-07-02 18:35 — OBS-05: Build ported to Obsidian (mission rows + slide-over)

Picked OBS-05 next in rank once OBS-02/OBS-03 both shipped and unblocked the whole OBS-04..09 tier. Full detail in `docs/planning/byo-p5-managed-runtime-plan.md`... wait, wrong doc — see `plan.md`'s 2026-07-02 OBS-05 entry and the dashboard row for the complete writeup.

**Adversarial review (3 lenses) — 4 real findings, 1 critical, all fixed:**
1. **Critical (correctness):** slide-over header read `missions.status`, row read `agent_runs.status` — disjoint vocabularies. `missions.status="blocked"` (the real gate-waiting value, never `"waiting_approval"`) fell through every branch of my mapping to a false "SHIPPED" for up to ~60s after every gate answer, including a reject. Fixed: derive from the latest run's status instead, hardened both mapping fns against `blocked`/`cancelled`/`completed_with_failures`/`proposed`/unknown (all now fail safe to "queued", never "done"). 2 new regression tests lock this exact scenario.
2. **Design:** Start button was ember (restraint-budget violation — only the gate's Approve should be ember on this screen). Fixed to neutral `--surface-raised`.
3. **Design:** gate-consequence copy drifted from the spec's exact middot-separated string. Fixed verbatim.
4. **Accessibility:** step dots had `word=""` + `aria-hidden`, zero status indication for screen readers. Fixed to carry the real `STATUS_WORD`.

**Self-caught mid-build:** a `perl -CSD` encoding slip mojibake-corrupted middots to `Â·` across 4 files during a humanized-output cleanup pass; caught by my own follow-up grep before the adversarial review ran, fixed cleanly with Python.

**Gates:** tsc 0 / bun test 1936/1936 (153 files, 50 obsidian-scoped). Committed + pushed to main; claim released (OBS-05 → ✅). Dashboard tally: 242/292 = 82.9% strict / 243.50/292 = 83.4% weighted.

**Note:** received a duplicate/stale replay of an earlier BYO-P5 instruction mid-session (that work was already committed, pushed, and verified several turns prior) — confirmed via `git log`/`git grep` before taking any action, did not redo it.

**Returning to the lane loop:** checking `lane.sh next` for the next eligible OBS surface (OBS-06 is claimed by lane2; OBS-07/08/09 or the v12 front items are candidates).
