# CADENCE PRODUCTION-READINESS AUDIT — MASTER INVENTORY

> _Created: 2026-07-04 · Last updated: 2026-07-04_
> _Synthesis of 17 auditor outputs (per-route code audits, feature-doc inventory, link graph, portal theme root-cause, lost-features git check, design reference extraction, live production tour). Date: 2026-07-04._

---

## 1. ROUTE LEDGER

Legend: **theme** = obsidian / parchment / mixed / na (redirect). **live-state** = live-tour result (demo@redcadence.app, ~5s wait). **verdict** = keep / fix / fold / delete. Conflicts between code audit and live tour are noted inline.

### 1a. Live surfaces & layouts

| Path | Kind | Theme | Linked from | Live state | Defects (summary) | Verdict | Rename |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `(root layout)` \_\_root.tsx | layout | mixed | n/a | OK | Lovable og:image on vendor CDN; 404/error pages render parchment inside dark app | fix | — |
| `(authed layout)` \_authenticated.tsx | layout | obsidian | n/a | OK | getSession() localStorage-only gate; expired session shows shell until first 401. Portal scope bug lives here (see §3 D-01) | keep | — |
| `/` | public | na (own violet system) | logo links everywhere | OK | ssr:false (crawlers see empty body); og:url/og:image hardcoded to cadence-flow-beta.lovable.app; full-reload redirect for signed-in | fix | — |
| `/today` | surface | obsidian | PRIMARY_NAV 01, palette, 9+ components, 3 redirects | OK (real content) | False hardcoded consequence copy on tool-run approvals; fragile shortcut deps; fake "Drafting your brief" promise; fixed 1.7fr/1fr grid no responsive fallback. Live: ipapi.co CORS failure every load | keep | — |
| `/discover` | surface | obsidian | PRIMARY_NAV 02, palette, 10+ components, 4 redirects | OK ("The evidence desk", designed empty states) | No validateSearch though 3 redirects pass ?tab=; no fetch timeout → hung server fn = permanent skeleton (root of the "/discovery stuck skeleton" report; live tour shows the NEW failure is the localhost leak, see /discovery); draft-spec dead-ends into parchment /prds/$id; hardcoded hexes bypass tokens | fix | — |
| `/plan` | surface | obsidian | PRIMARY_NAV 03, palette, redirects | OK | Ignores ?view=roadmap from /roadmap redirect; dead ToastProvider mount noted | keep | — |
| `/build` | surface | obsidian | PRIMARY_NAV 04, palette, 10+ components, 5 redirects | OK — but live shows alarming banners: "Loop stalled · 7 calls expired", "AI error budget spent, 7.07% of calls succeeded", 0/13 agents active | PRD picker dead-end when none approved (no link to /plan); bare "Loading missions…" text | keep | — |
| `/build/$missionId` | surface | **parchment** | 15+ inbound links (the busiest detail page) | OK | Last parchment screen on Build spine — visible design-system jump from /build; tab-switch search clobber; SteerComposer accepts steers on failed/halted missions | fix | — |
| `/knowledge` | surface | mixed | PRIMARY_NAV 05 "Brain", palette, 9 redirects, many components | OK ("Your record.") | 4 of 10 tab panels unported (MemoryList, CalendarPanel, DocsPanel, InsightsPanel — parchment classes + Sparkles icon); brain counts NOT workspace-scoped (stale cross-workspace numbers); ?meeting param leaks across tab switches; count strip has no skeleton | fix | — |
| `/engine-room` | surface | obsidian | ENGINE_ROOM_DOOR, palette, 8 redirects | OK | **Fabricated prototype literals shown as real data while loading** ("$482 of $600 · trending +12%"); query errors swallowed → dead backend renders "all clear"; 9 eager queries incl. heavy 30d traces; drills bounce OUT to parchment /govern | keep | — |
| `/govern` | surface | mixed (parchment) | AttentionBell, banners, engine-room drills, 4 redirects | OK (team roster etc. real) | **Duplicate "Engine Room"** vs /engine-room, two themes one name; 15 tabs vs "13" comment (band-filter could hide tabs); badges only enabled on-tab; parchment inside obsidian scope | **fold** into /engine-room | fold, no name |
| `/traces` | layout+redirect | na | MessageMeta, /observe | OK → /govern?tab=traces | Inconsistent target: only OBS-10 stub still pointing at parchment /govern, not /engine-room?room=record | fix | — |
| `/traces/$traceId` | surface | mixed | MissionOrchestratorDetail, TracesPanel, Safety/Record rooms, IncidentsPanel | OK | Back link always parchment /govern even when arrived from Obsidian Record room; tool-calls joined by created_at only (no event_id); otherwise best-in-audit states | keep | `/activity/$traceId` (or unify Trace/Traces/Activity naming) |
| `/prds` | layout | na | back-link from prds.$id | OK | pass-through only | keep | — |
| `/prds/$id` | surface | **parchment** | SignalFeed, OpportunityQueue, SpecDetail/Composer, LearningDetail, DecisionsPanel, LineageDrawer | OK | No error state (failure = "PRD not found", no retry); "All PRDs" back-link lies (→ /plan); provenance buttons drop signal id; tasksQ fetches ALL tasks under global key; fully parchment on the Plan spine | fix | `/specs/$id` or `/plan/spec/$id` |
| `/settings` | surface | mixed | AppShell dropdown, 10+ components, 3 redirects | OK. **Live: ?tab=plan silently ignored (param is ?section=); /briefing landing shows Workspace fields, not clearly the brief — section targeting unreliable** | **Fake Connect button** (hardcodes status 'connected', no OAuth); AdminDoor full-reload; CreditsTab shows hardcoded 9-bundle fallback prices users can click; parchment classes across older tabs | fix | — |
| `/sync` | surface | **parchment** | Engine Room menu (only shell path), palette, ColdStartOnramp | OK | Bindings section duplicated with Settings > Connections; mResolve no onError; pull/push disabled for all but 3 providers; wholly pre-Obsidian styling; path /sync vs label "Connectors" | fix | `/connectors` |
| `/trust-ledger` | surface | mixed | Engine Room menu, DataSubstrateCard | OK | Hardcoded `#fff` fallbacks → bright white blocks in dark shell; one-click public share with no confirm and no unshare; seal duplicated in 3 homes | fix | "Receipts" |
| `/admin` (layout + Overview) | layout+surface | obsidian / **mixed (Overview unported)** | AppShell dropdown (admin-gated) | not toured | amIAdmin error → admin sees non-admin card; Overview is the lone parchment straggler (bento/btn classes, light-paper hexes); adminListAdmins errors read as "No admins yet."; catalog error silent | fix | — |
| `/admin/ai-costs` | surface | obsidian | admin TABS "Spend", /admin/proof | not toured | Silent MV staleness, no freshness stamp or recompute; URL/tab/content mismatch | keep | `/admin/spend` |
| `/admin/observability` | surface | obsidian | admin TABS "Health" | not toured | setGate no onError; raw failure_kind enums | keep | `/admin/health` |
| `/admin/people` | surface | obsidian | admin TABS | not toured | Undebounced per-keystroke search; errors → fake "No users match."; error = blank drawer; 5 mutations without onError | fix | — |
| `/admin/platform` | surface | obsidian | admin TABS | not toured | Errors masquerade as empty states (flags/audit/banner); free-text JSON flag payload unvalidated; HostingPocPanel loses deployed URL + is dev scaffolding; mutations no onError | keep (remove/gate PoC panel) | — |
| `/admin/pricing` | surface | obsidian | admin TABS | not toured | **Zero loading/error state on a money surface** — error indistinguishable from empty catalog; unsaved-row drift after failed upsert; negative/NaN prices accepted | fix | — |
| `/admin/proof` | surface | obsidian | admin TABS | not toured | getProofSurfaceExtras errors fully silent ('-' stats); receipts rollup returns null on error; fixed 3-col grids | keep | — |
| `/admin/workspaces` | surface | obsidian | admin TABS | not toured | Error = permanent "reading workspace…" skeleton; role/remove/delete/restore mutations unchecked (destructive!); undebounced search; **hardcoded `@redcadence.app` demo-domain check (retired-brand token in gating logic)** | fix | — |
| `/onboarding` | surface | obsidian | auth gate (onboarded=false) | OK (sparse but intentional) | OAuth round-trip may restart onboarding at arrival (local useState phase); hardcoded FALLBACK_BELIEF | keep | — |
| `/obsidian-specimen` | surface | obsidian | none (orphan) | **Live: reachable, renders full specimen** | Self-labeled DEV ONLY but no env gate — any prod user who guesses the URL sees internal design jargon | **delete** (or gate behind import.meta.env.DEV) | — |
| `/login` | public | parchment | landing, pricing, auth gate | OK | none | keep | — |
| `/signup` | public | parchment | landing CTAs, pricing, PreSignupCTA | not toured | **Drops plan/credits/billing params from pricing** (purchase intent lost); 6-char password floor; profiles upsert unchecked | fix | — |
| `/forgot-password` | public | parchment | login | not toured | none (enumeration-safe) | keep | — |
| `/reset-password` | public | parchment | email link | not toured | Two hash/session races can bounce a valid recovery link to the app or the "expired" state | fix | — |
| `/pricing` | public | parchment | landing x4, trust, nudges | not toured | 4-col grid unusable on mobile; connector chips imply universal write-back; CTA params dead at /signup | fix | — |
| `/subprocessors` | public | parchment | **nothing links to it** | not toured | Orphan trust page — needs footer link from / and /pricing | keep | — |
| `/ard` | public | parchment | **nothing links in** | not toured | schema_url hardcodes cadence.app while app serves from lovable.app (canonical URL may 404); undiscoverable | keep | — |
| `/trust` | public | ? | **orphan** (only a description string in AppShell) | not toured | not audited route-level; orphaned | keep + link | — |
| `/checkout/return` | surface | mixed (unthemed) | Stripe returnUrl | not toured | Logged-out poll hangs forever on "Confirming your payment"; no-session state is a dead end; outside both theme scopes | fix | — |
| `/d/$slug` | public | parchment | trust-ledger share links | not toured | Generic Lovable og-image on the viral share surface; otherwise the reference implementation | keep | — |
| `/p/$slug` | public | parchment | AnnouncementsPanel href | not toured | No head()/loader → shares unfurl as "Cursor for Product Managers" + Lovable image; useEffect-only fetch (crawlers see nothing); transient error renders as "private or not found" | fix | — |
| `/t/$slug` | public | parchment | WedgeTeardown share URLs (orphaned component) | not toured | Serves already-shared teardowns, but no UI can create new /t links (see §2/§5) | keep | — |
| `/join/$token` | public | parchment | invite email, login/signup round-trip | not toured | Post-join doesn't switch active workspace — "You are in" may show a different workspace | keep | — |

### 1b. Redirect stubs (~35; all live-verified working unless noted)

| Path | Target | Live | Notes / defects |
| --- | --- | --- | --- |
| `/agents` | /govern?tab=team | OK — real roster | Agent inspector shows "No runs/memories recorded yet" for ALL agents (live) |
| `/swarm` | /govern?tab=team | OK | redundant twin of /agents; delete together when traffic dies |
| `/fleet` | /build?view=agent | OK | zod-validated, lands on tab |
| `/delegate` | /build?view=lane | OK | — |
| `/cockpit` | /build | OK | legacy ?tab=agents intent lost (3-line fix possible) |
| `/missions` | /build | OK | — |
| `/missions/$missionId` | /build/$missionId | OK | param-preserving — the model stub |
| `/studio`, `/studio/$missionId` | /build(/$id) | OK | $missionId stub's TAB whitelist misses 'preview' → tab dropped |
| `/prds` (index) | /plan | OK | — |
| `/discovery` | /discover?tab=signals | **BROKEN LIVE**: briefly loads then hard-navigates to `http://localhost:8080/login`. Route file is correct (relative redirect); leak is in SSR redirect resolution of the deployed build | dead ?tab param; code-audit's "permanent skeleton" superseded by live localhost-leak finding — both recorded |
| `/opportunities` | /discover?tab=opportunities | OK | ?tab never read by /discover |
| `/product` | fan-out (discover/plan/knowledge) | OK | tab intent lost at /discover//plan targets |
| `/roadmap` | /plan?view=roadmap | OK | dead ?view param |
| `/stakeholder` | /plan | OK | no anchor to StakeholderPackPanel |
| `/memory` `/learn` `/docs` `/changelog` `/impact` | /knowledge?tab=… | all OK | targets valid |
| `/calendar` `/meetings` `/meetings/$id` | /knowledge?tab=calendar(&meeting=) | OK | exemplary param forwarding |
| `/outcome` | /knowledge?tab=learnings | OK | legacy sub-tab param dropped (acknowledged) |
| `/analytics` | /engine-room?room=spend | **BROKEN LIVE**: 1st visit = 100% blank page (zero DOM); 2nd visit = hard redirect to `http://localhost:8080/today`. Same SSR localhost-origin leak. Route file correct | code audit said "working redirect" — live tour wins; SSR/deploy-layer bug |
| `/briefing` | /settings?section=brief | OK-ish | live: landing showed Workspace/invitations, not clearly the brief — section targeting unreliable |
| `/budgets` | /engine-room?room=spend | OK | live copy contradiction: "$0 of $3,000 · +111% · HEALTHY" vs "$0.01 this week" vs Build's $0.21 |
| `/prompts` | /engine-room (bare) | OK but lossy | **no prompts destination exists** — PromptsPanel only at hand-typed /govern?tab=prompts (see §2) |
| `/observe` | tab-aware → spend/quality/traces | OK | bare /observe → Spend room is semantically odd |
| `/evals` `/eval-health` `/drift` `/guardrails` | /engine-room quality/safety views | all OK | clean single-hops |
| `/governance` | /govern?tab=… | OK | will double-hop once /govern folds; repoint then |
| `/chat` | /today | OK | drops thread deep links; no hint Ask (⌘J) replaced chat |
| `/inbox` `/tasks` | /today | OK | — |
| `/notifications` | /settings?section=notifications | OK (alert matrix renders) | — |
| `/integrations` | /settings?section=interop | OK | — |

---

## 2. HOMELESS FEATURES

Features/routes a real user cannot reach by clicking (link-graph navReachable + orphans, joined with route ledger and feature inventory).

### (a) Real features needing a visible home

| Feature | Current state | Suggested home |
| --- | --- | --- |
| **Tasks CRUD** | GONE ENTIRELY: `createTask/updateTask/deleteTask` in `src/lib/tasks.functions.ts` have zero UI consumers; /tasks → /today which dropped the tasks widget | Today task list (restore capture/edit) or delete the dead server fns |
| **Prompt management (PromptsPanel)** | DORMANT: only renders at hand-typed `/govern?tab=prompts`; /prompts redirects to bare /engine-room; not in ⌘K | Engine Room Quality room "Prompts" view + ⌘K entry |
| **Wedge / Critic teardown** (v9 launch wedge, strategy canon) | `WedgeTeardown.tsx` zero importers since OBS-04; server fn `runWedgeTeardown` alive; new /t share links cannot be created | Discover (evidence desk) or first-run/Today onramp |
| **Teardown sharing (/t/$slug creation)** | Toggle only lived in unmounted WedgeTeardown | Rides wedge re-home |
| **@-mention an agent** | Server parse live in /api/chat; AskPanel dropped the mention picker — zero UI affordance | AskPanel @-picker |
| **PLG memory-retention nudge** | `MemoryExpiryBanner.tsx` zero importers; `getMemoryExpiry` alive | Today banner slot or Settings > Credits |
| **Cold-start onramp** | `ColdStartOnramp.tsx` orphaned (coach marks are partial replacement) | Today empty-workspace state |
| **FocusNext / InsightRail** ("Focus on this next" intelligence head) | Orphaned since OBS-04; foresight risk line survives only in daily brief | Today right column or Brain Insights |
| **ORCH-DELEGATE PRD→Linear dispatch** | `dispatchPRDToLinear` zero callers | prds.$id action row (or delete if superseded by createLinearIssuesFromTasks) |
| **Calendar via ⌘K** | nav-model comment promises "reached from Brain and the ⌘K palette" — palette never indexed it | palette-catalog entry |
| **Trust Ledger via ⌘K** | Door link only; not palette-indexed | palette-catalog entry |
| **Public trust pages** `/trust`, `/subprocessors`, `/ard` | True orphans — zero inbound links | Landing + pricing footer links |

### (b) Duplicates / legacy to fold or delete

| Item | Issue | Action |
| --- | --- | --- |
| `/govern` vs `/engine-room` | Two differently-themed surfaces both titled "Engine Room" | Finish OBS port of 15 panels, then redirect /govern → /engine-room |
| WorkspaceBindingsSection | Renders in BOTH /sync and Settings > Connections | One home (Settings), /sync becomes catalog + conflicts only, or vice-versa |
| Integrity seal | Rendered in /trust-ledger, RecordRoom, DataSubstrateCard (3 homes) | One canonical seal + links |
| `/agents` + `/swarm` | Identical redirect targets | Delete both when legacy traffic dies |
| `/admin/ai-costs` vs `/admin/proof` | Same MV data, rollup vs tables | Keep (by design, cross-linked) but rename ai-costs → spend |
| ~28 URL-compat-only redirect stubs | No live in-app links (all except /budgets /tasks /roadmap /meetings(+$id) /missions/$missionId /traces /prds) | Keep until legacy traffic dies; delete in one batch |
| `SupportPanel.tsx` (learn/) | Zero importers; superseded by SupportSignalsPanel | Delete file |
| Swarm HUD (F-AGENT-4) | Dismantled; fragments live in roster/Build | Mark doc superseded; delete dead code |

### (c) Dev-only to hide

| Item | Action |
| --- | --- |
| `/obsidian-specimen` | Gate behind `import.meta.env.DEV` or delete pre-launch |
| HostingPocPanel (`/admin/platform`, BYO-P5b) | Remove or flag-gate; explicitly non-user-facing scaffolding |
| "Checkout is in preview" banner (live: pinned to EVERY page incl. onboarding + specimen) | Scope to billing surfaces or remove for demo accounts |

---

## 3. DEFECT REGISTER

Deduped across code audits + live tour + portal root-cause. Severity: **B**locker / **M**ajor / **m**inor.

### Blockers

| ID | Sev | Surface | Evidence | Suggested fix |
| --- | --- | --- | --- | --- |
| D-01 | B | All portaled UI (dialogs, popovers, selects, tooltips, dropdowns, sheets, drawer, ⌘K palette, toasts) | Portal theme escape — full root cause & plan below | Move `data-obsidian` to `document.documentElement` (plan below) |
| D-02 | B | `/analytics`, `/discovery` on PROD | Live tour: /analytics = blank page then hard redirect to `http://localhost:8080/today`; /discovery hard-navigates to `http://localhost:8080/login`. Route files use correct relative `redirect()` — the absolute-localhost Location comes from the SSR/deploy layer | Find where the deployed worker resolves redirect origins (likely a baked dev origin in the SSR build or an env misconfig); add a prod smoke test asserting no `localhost` in any Location header |
| D-03 | B | `/pricing` → `/signup` | signup never reads `plan/credits/billing` params (zero readers in src); paid-plan intent silently discarded | Persist params through signup → post-onboarding checkout continuation |
| D-04 | B | Settings > Connections | "Workspace tool sync" Connect calls upsertIntegration with hardcoded `status:'connected'`, `account_label:'Connected via Lovable'` — no OAuth runs (claim outruns wiring, violates founding mandate) | Remove button or wire to real connector gateway flow |
| D-05 | B | `/engine-room` | FALLBACK_VERDICT prototype literals ("$482 of $600 · trending +12%", "1,284 traces · ledger intact") render as real data during loading; query errors coerce to healthy "nothing burning" | Real loading state; surface errors per room; never ship fabricated numbers |
| D-06 | B | `/admin/pricing` | No loading/error state — transient error looks like an empty catalog on a money surface; admin could "fix" it destructively | Add loading + error states; validate prices (no negative/NaN) |
| D-07 | B | `/admin/workspaces` | setRole/remove/softDel/restore never check `{error}` and have no onError — failed ownership transfer/delete shows success path | Check result shape + onError toasts on all destructive mutations |
| D-08 | B | `/checkout/return` | Logged-out during poll → "Confirming your payment" forever, no timeout/retry/login prompt; no-session state has no exit | Timeout + login prompt + link home |
| D-09 | B | `/reset-password` | Two races: recovery link creates a session → beforeLoad bounces user before they set a password; Supabase can consume the hash → valid link shows "invalid or expired" | Listen for `PASSWORD_RECOVERY` auth event; stop blanket-redirecting signed-in users |
| D-10 | B | Live prod telemetry (Build, Spend, Fleet) | "Loop stalled · 7 calls expired · 19 in queue"; "AI error budget spent, 7.07% of calls succeeded this week"; spend contradictions ($0 vs $0.01 vs $0.21/$0.23; "+111% trending" next to HEALTHY) | Fix underlying loop/cron health + reconcile spend sources; these read as broken product to any first-time viewer |

#### D-01 in full: portal theme-escape root cause & fix plan

**Root cause (confirmed):**

1. `src/routes/_authenticated.tsx:53` — `<div data-obsidian>` wraps the authenticated tree (plain in-tree div, not html/body).
2. `src/styles.css:1635-1860` — all Obsidian tokens AND the shadcn semantic bridge (`--background`, `--popover`, `--primary`, `--border`, `--ring`, sidebar vars, legacy remaps) defined only under `[data-obsidian]`. Unscoped `:root` (line 106) = light parchment; `.dark` (line 231) = parchment-dark on `<html>`.
3. Every floating primitive portals to `document.body`, outside the scope → resolves `:root` parchment values. Confirmed with no `container` prop: `dialog.tsx:36`, `alert-dialog.tsx:32`, `popover.tsx:16`, `select.tsx:67`, `tooltip.tsx:18`, `dropdown-menu.tsx:61`, `context-menu.tsx:59`, `sheet.tsx:61`, `drawer.tsx:36` (vaul), `menubar.tsx:97`, `command.tsx:26`. Worse: `CommandPalette.tsx:140` uses raw `DialogPrimitive.Portal` and styles with `background: var(--raised)` — a raw Obsidian token undefined at `:root`, so the ⌘K background computes invalid/transparent. Sonner `Toaster` in `__root.tsx:198` was never inside the scope at all.
4. Theme interplay: `[data-obsidian]` (0,1,0) ties `.dark` (0,1,0) on specificity; later-in-file Obsidian wins inside the app, so the shell is permanently Obsidian — but portals live outside, so the light/dark toggle is the ONLY thing affecting them; default light = the reported parchment-portal bug.

**Options evaluated:** (b) Radix `container` props — reject (threads refs through ~12 primitives, sonner/vaul differ, reintroduces clipping/stacking issues, silently regresses on shadcn re-adds). (c) `:root:has([data-obsidian])` selector list — viable second choice (zero JS, wins specificity) but three selectors in permanent lockstep, per-frame `:has()` cost, and still misses `color-scheme`/`::selection`/`:focus-visible` for portals.

**(a) RECOMMENDED — attach the attribute to `<html>`:**

1. `src/routes/_authenticated.tsx` — in `AuthedLayout`:
   ```tsx
   useLayoutEffect(() => {
     document.documentElement.setAttribute("data-obsidian", "");
     return () => document.documentElement.removeAttribute("data-obsidian");
   }, []);
   ```
   Change `<div data-obsidian>` to plain `<div>` (avoids double-match for use-density's querySelector). Update the OBS-02 comment: scope rides `<html>` while authenticated so body-mounted portals (Radix, sonner, vaul) inherit tokens.
2. `src/hooks/use-density.ts` — comment update only; optionally hard-code `document.documentElement`.
3. `src/styles.css` — no change required; optional note at OBS-01 header.
4. `src/components/cadence/CommandPalette.tsx` — no change; it is the canary (verify ⌘K background first).
5. Verify: dropdown/select/tooltip/dialog on an authed page, ⌘K, a sonner toast, vaul drawer; then /login and public landing in same session (attribute must be gone); onboarding (inside AuthedLayout, intentionally Obsidian).

Safety: landing/login never mount AuthedLayout; unmount cleanup is synchronous with commit (logout restores parchment same paint); subtree is `ssr:false` so SSR is a non-issue; `html/body background` now resolves to true canvas-black (overscroll improvement). Residual: theme toggle becomes fully inert inside the app — flag to founder to hide it under Obsidian. Note: a working-tree modification implementing a portal theme fix already exists in `_authenticated.tsx` from another session — reconcile before applying.

### Majors

| ID | Sev | Surface | Evidence | Fix |
| --- | --- | --- | --- | --- |
| D-11 | M | ~15 surfaces (epidemic) | **Error-as-empty-state**: `{error}` responses collapse to `[]`/undefined → "No admins yet." / "No users match." / "No workspaces." / "No flags yet." / "No entries." / "No active banner." / blank People drawer / stuck "reading workspace…" / "PRD not found." / proof '-' stats / p.$slug "private or not found" | One shared pattern: check `{error}` shape, render error + retry distinct from empty; add onError toasts to ALL mutations (people x5, workspaces x4, platform, sync mResolve, observability setGate, build) |
| D-12 | M | `/discover` | No request timeout: hung server fn (h3-swallowed-500 class) → react-query never settles → permanent skeleton | Fetch timeout so hangs reject; add validateSearch for ?tab |
| D-13 | M | `/build/$missionId` | Full parchment on Obsidian spine; tab-switch clobbers search params (plain-object navigate); steers accepted on failed/halted missions | Obsidian port; functional search updater; disable SteerComposer on terminal states |
| D-14 | M | `/prds/$id` | Parchment island; no error state; back-link mislabeled; provenance loses signal id; global ['tasks'] cache collision | Port + error state + scoped query key |
| D-15 | M | `/knowledge` | 4 unported panels; brain counts not workspace-scoped (queryKeys omit activeWorkspaceId); ?meeting leaks across tabs | Port panels; add workspace id to keys; clear drills on tab switch |
| D-16 | M | Engine Room drills | QualityRoom/SpendRoom/traces back-links bounce Obsidian → parchment /govern mid-flow | Complete the /govern fold |
| D-17 | M | `/` landing | ssr:false — crawlers see empty body; hardcoded `cadence-flow-beta.lovable.app` og:url/og:image; window.location.replace full reload | Prerender/SSR; env-driven canonical URL |
| D-18 | M | Social metadata (root, p.$slug, d.$slug) | Lovable-hosted gpt-engineer og:image, `twitter:site @Lovable`, default description "Cursor for Product Managers." contradicts positioning; p.$slug has no head() at all | Self-hosted brand image; correct handle/description; port p.$slug to d.$slug pattern (SSR loader + dynamic head) |
| D-19 | M | `/pricing` | repeat(4,1fr) grid crushes on mobile; connector chips imply write-back for all providers | Responsive grid; honest write-back labeling |
| D-20 | M | `/settings` | ?tab=plan silently ignored (live-verified STILL BROKEN — app uses ?section=); section targeting for 'brief' unreliable; CreditsTab hardcoded price-ladder fallback clickable; AdminDoor full page reload | Accept tab as alias of section; gate fallback prices; router navigate |
| D-21 | M | `/trust-ledger` | `var(--surface-1, #fff)` / `var(--surface, #fff)` → white blocks in dark shell; one-click public share, no confirm, no unshare | Kill #fff fallbacks; add confirm + unshare |
| D-22 | M | Admin searches | People + Workspaces fire server query per keystroke, no debounce | 250-300ms debounce |
| D-23 | M | `/admin/workspaces` | Hardcoded `@redcadence.app` (retired-brand token) gates demo reset | Move to config/flag |
| D-24 | M | Redirect param graveyard | /discover and /plan have no validateSearch; ~6 redirects pass dead ?tab/?view params; /product legs lose section intent; /cockpit?tab=agents intent lost; studio $id stub misses 'preview' tab | Either honor params (anchors/scroll) or strip them; add 'preview' to studio TABS |
| D-25 | M | `/traces` bare redirect + $traceId back-link | Only stub family still landing on parchment /govern instead of /engine-room?room=record | Repoint both |
| D-26 | M | `/today` | Tool-run approvals reuse PRD consequence copy "Opens the pull request · nothing ships without you" — can be false | Per-kind consequence copy |
| D-27 | M | `/today` live | ipapi.co fetch blocked by CORS on every load (geo lookup never succeeds in prod) | Proxy server-side or remove |
| D-28 | M | Every page live | "Checkout is in preview" banner pinned everywhere incl. onboarding/specimen | Scope banner |
| D-29 | M | `/join/$token` | Post-accept lands in last-active workspace, not the joined one | Switch active workspace on accept |
| D-30 | M | `/signup` | 6-char password floor; unchecked profiles upsert can misroute onboarding gate | Strength policy; check upsert |
| D-31 | M | `/admin/ai-costs` | MV staleness silent; no freshness timestamp or manual recompute | Freshness stamp + recompute action |
| D-32 | M | Root error pages | 404/error render parchment (shadcn semantic classes) when hit inside dark app | Theme-aware error pages |
| D-33 | M | `/ard` | Published schema_url hardcodes cadence.app; may 404 for standard adopters | Env-driven canonical origin |
| D-34 | M | `/agents` roster live | Inspector shows "No runs recorded yet"/"No memories" for ALL agents despite mission history existing | Verify inspector queries against live schema (echo of schema-drift class fixed in 00560f8b) |

### Minors

| ID | Surface | Evidence |
| --- | --- | --- |
| D-40 | `/admin` layout | Claim-admin CTA lacks Button primitive/focus ring |
| D-41 | `/admin/platform` | HostingPocPanel lastUrl lost on nav |
| D-42 | `/build` | PRD-picker dead end (no link to /plan); bare loading text |
| D-43 | `/engine-room` | 9 eager queries; 30d/200-row listTraces used only for a count |
| D-44 | `/govern` | TABS=15 vs comment "13"; band filter could orphan tabs; badges only fire on-tab |
| D-45 | `/traces/$traceId` | tool_calls joined by created_at (no event_id) — interleave risk |
| D-46 | `/knowledge` | Count strip reflow, no skeleton; Sparkles icon violates no-iconography law |
| D-47 | `/today` | Keyboard shortcut effect stale-closure risk; grid not responsive; brief empty-state false promise |
| D-48 | `/sync` | Pull/push permanently disabled for all but 3 providers (tooltip-only explanation) |
| D-49 | `/chat` redirect | Loses thread deep links; no coach mark pointing at Ask |
| D-50 | `/onboarding` | OAuth return may restart flow (local phase state) — verify live |
| D-51 | `/admin/proof` | Fixed 3-col grids crush on narrow windows |
| D-52 | localhost copy | React "state update on unmounted component" error (verify if present in prod) |
| D-53 | `_authenticated` | Expired cached session passes gate until first 401 |
| D-54 | `/prompts` redirect | Lossy — lands on glance with no prompts anchor |

---

## 4. FEATURE INVENTORY

96 features from docs/features/. Discoverability: **nav** (rail/shell) · **in-surface** (click path exists) · **cmdk-only** · **backend-only** (by design) · **not-surfaced** (⚠ regressed/orphaned) · **dormant** (gated off).

| Feature | Host route(s) | Discoverability | Flag |
| --- | --- | --- | --- |
| A2A handoff | /build/$missionId | in-surface | doc routes stale (/missions) |
| Admin console | /admin/\* | nav (dropdown, gated) | |
| Agent blast-radius (FND-0.5) | /settings?section=staff | in-surface | |
| Agent experience (roster/faces/relay) | /govern?tab=team | in-surface | 2 clicks off rail |
| Agent-Native Layer (llms.txt/MCP) | /api/mcp + TopBar toggle | in-surface | |
| AGT-01 native tool-calling | — | dormant | env-gated off by design |
| **@-mention agents** | — | **not-surfaced** ⚠ | picker dropped in OBS-12 |
| Ambient Precedent | /prds/$id | in-surface | OpportunityDetail seam orphaned |
| AFD observability | /admin/observability, /admin/ai-costs | in-surface | dormant until gate+keys; doc header stale |
| App health endpoint | api only | backend-only | |
| Auth flows | /login /signup etc. | in-surface | |
| Billing DB hygiene | — | backend-only | |
| Billing rail (Stripe) | /settings?section=billing, /pricing, /checkout/return | in-surface | sandbox-only |
| BLD-04 delegate-out | — | dormant | env-gated |
| Brain Insights | /knowledge (default tab) | nav | |
| Brain/researcher chat | AskPanel ⌘J | cmdk-only | doc stale (/chat retired) |
| Agent inspector (C4/E7) | /govern?tab=team | in-surface | doc route stale; live shows no data (D-34) |
| Command Canvas | AskPanel | cmdk-only | CMD-2 founder-blocked |
| AGT-02 consent scopes | — | backend-only | active |
| ENG-06 cost per outcome | /govern?tab=analytics, /build | in-surface | Today glance dropped (stale doc) |
| Credit engine go-live | /admin | backend-only | metering ON; Stripe round-trip unproven |
| Credits surface | /settings?section=credits | in-surface | |
| Critic agent | /prds/$id, Ask | in-surface | |
| D4 mission cancel+replay | /build/$missionId | in-surface | |
| BRN-02 data substrate card | /settings?section=data | in-surface | |
| Decision Brain (umbrella) | /knowledge | nav | vision doc |
| DSN-04 design contract rides Build | — | backend-only | parity fns have NO UI trigger |
| DSN-01 design memory | /knowledge?tab=design | in-surface | |
| Egress secret guard | — | backend-only | |
| Eval coverage | /govern?tab=evals | in-surface | CI floor dormant |
| F-AGENT-1 orchestrator | /build | nav | doc routes stale |
| F-AGENT-2 memory/reflection | /knowledge?tab=memory, /govern?tab=team | in-surface | reflections panel GONE with /agents |
| F-AGENT-3 event reactor | /govern?tab=controls | in-surface | functionally cold (1 event row) |
| **F-AGENT-4 Swarm HUD** | — | **not-surfaced** ⚠ | dismantled; doc fully stale |
| F3 continuous discovery | /discover | nav | auto-cluster cron gated off |
| Firecrawl floor | — | backend-only | SearXNG dormant |
| DSN-03 flow before screens | /prds/$id | in-surface | |
| OPS-01 flow mode | AppShell footer | in-surface | sounds may silently no-op |
| FS-01/04 foresight | /today (brief line) | in-surface | half-dormant; InsightRail orphaned ⚠ |
| BLD-GATE-SYNC | — | backend-only | |
| Gauntlet metrics | /govern?tab=gauntlet | in-surface | |
| GitHub issue approval | /today, /prds/$id | in-surface | doc surfaces stale |
| H2 governed roadmap commits | /plan | nav | RoadmapBoard deleted, rule survives |
| RF-04 house rules | /govern?tab=house-rules | in-surface | empty until steward clusters |
| Ingest webhook | /sync | backend-only | token UI on /sync |
| FND-0.7 injection defense | /govern?tab=guardrails | in-surface | |
| DBR-1 knowledge-graph explorer | /knowledge?tab=graph | in-surface | |
| L2 announcements | /knowledge?tab=changelog, /p/$slug | in-surface | 0 rows on prod |
| JNY-04 launch plan | /prds/$id | in-surface | |
| LCH-01 launch kit | /build/$missionId | in-surface | outbound send founder-gated |
| Loop runs itself | — | backend-only | |
| M1 support triage | /govern?tab=support | in-surface | SupportPanel.tsx orphaned (dup) |
| M-B memory view | /knowledge?tab=memory | in-surface | doc route stale |
| Migration lint | — | backend-only | |
| MA-1 model-agnostic routing | /build composer, /settings | in-surface | |
| O1 provenance | /prds/$id | in-surface | OpportunityDetail host deleted |
| AFD-02 observability façade | — | backend-only | doc "DOCUMENTATION ONLY" stale — code exists |
| OBS-PORT G14 | the app itself | in-surface | in progress |
| W6 onboarding tracks | /onboarding | in-surface (gate-only) | |
| **ORCH-DELEGATE PRD→Linear** | — | **not-surfaced** ⚠ | dispatchPRDToLinear zero callers |
| Outcome Contract (CNV-01..04) | /prds/$id | in-surface | |
| P7 incidents | /govern?tab=incidents | in-surface | |
| PII egress floor | — | backend-only | |
| RF-05 playbook selection | — | backend-only | |
| **PLG memory-retention nudge** | — | **not-surfaced** ⚠ | MemoryExpiryBanner zero importers |
| Scribe RAG citations | /prds/$id, /plan | in-surface | |
| M-C pricing/entitlements | /pricing, /settings, /admin/pricing | in-surface | live charging founder-gated |
| RF-07 prompt optimization | /govern?tab=prompts | backend-only-ish ⚠ | panel unreachable by click (see §2a) |
| PRF-01 proof surface | /admin/proof | in-surface (admin) | |
| Q1-MCP server | /settings?section=interop | backend-only | Q2 write dormant |
| R3 notifications | /govern?tab=attention, /settings | in-surface | |
| WM-F3 RBAC | — | backend-only | |
| RELIABILITY-SLO | /build header, /settings health | in-surface | deep breakdown unbuilt |
| DATA-RETENTION-b erasure | — | dormant | flag off by design |
| RUNAWAY-DETECT | /build, /govern?tab=incidents | in-surface | auto-pause founder-gated |
| Sandbox spine | /build/$missionId | in-surface | paid microVMs not wired |
| Settings IA | /settings | nav | |
| SF-AUTOTRIGGER | — | dormant | env kill-switch off |
| SF-MCP inbound signals | — | dormant | ships dark, env unset |
| Shareable links /d /t | /d/$slug, /t/$slug, /knowledge | in-surface | ⚠ /t creation impossible (WedgeTeardown unmounted) |
| Signal fabric / sense engine | /discover | backend-only | FocusNext/InsightRail orphaned ⚠ |
| Skill-pack export | /api/mcp | backend-only | |
| AGT-03 speculative prep | /prds/$id | in-surface | |
| JNY-05 stakeholder digest | /settings, /sync | in-surface | Slack leg tier-gated |
| JNY-02 strategic brief | /today | in-surface | |
| Stripe monetization layer | /pricing, /checkout/return, /settings | dormant | key-gated by founder ruling |
| Studio/Build engine | /build | nav | |
| Sub-processor registry | /subprocessors, /settings | in-surface | public page orphaned (no links in) |
| H1 task graph | /prds/$id | in-surface | mission bridge deferred |
| JNY-03 test station | /build/$missionId | in-surface | conditional on contract |
| Trust score & autonomy dial | /govern?tab=team | in-surface | 2 clicks deep |
| Trust Ledger | /trust-ledger | nav (door) | not in ⌘K |
| U6 data export | /settings | in-surface | live-verified |
| Web access tools | — | backend-only | |
| **Wedge (Critic teardown)** | — | **not-surfaced** ⚠ | doc claims Shipped; UI is dead code |
| Workspaces & tenancy | /settings, /join/$token, /admin/workspaces | nav | doc status stale (shipped) |

**Totals:** 96 features · 57 user-visible with a click path · 7 not-surfaced/orphaned regressions (⚠ @-mention, Swarm HUD, ORCH-DELEGATE, PLG nudge, wedge, /t creation, FocusNext/InsightRail) · ~22 backend-only by design · ~10 dormant/founder-gated · ~12 docs with stale routes/status.

---

## 5. LOST FEATURES (git-history findings)

Sources: `git show 2a256fc1^:src/lib/nav-model.ts`, `src/lib/legacy-redirects.ts`, OBS-10 §6, obsidian-port.md.

| Pre-port surface | Where it lives now | Verdict |
| --- | --- | --- |
| Today (`/`) | `/today` (OBS-04) | has-home (see drop list) |
| Ask (`/chat`, 1558-line page) | ⌘J AskPanel; /chat→/today | has-home (ember CTA deferred by design) |
| Product (`/product`, 6 tabs) | Branching redirect; all 10 components/product/\* deleted after 9 write actions ported | has-home |
| Missions family (/missions /cockpit /fleet /delegate /swarm) | /build (+views); swarm→/govern?tab=team | has-home |
| Brain family (/memory /docs /learn /outcome /impact /changelog) | /knowledge 10 tabs | has-home |
| Approvals (Trust row) | Calls on Today + /govern?tab=approvals | has-home |
| Spend (Trust row) | /engine-room?room=spend | has-home |
| Engine Room (/govern) | /engine-room door; /govern = permanent drill layer (17 live tabs) | has-home |
| Trust Ledger | Door link | has-home (not in ⌘K) |
| Connectors (/sync) | Door link | has-home; OBS-13 fold to Settings incomplete |
| Calendar dock | Brain Calendar tab | has-home — but NOT in palette-catalog, contradicting nav-model's own comment |
| Stakeholder / Roadmap / PRDs | /plan + /prds/$id | has-home |
| Evals/drift/guardrails/budgets/analytics/observe/governance/agents/traces | Engine Room rooms / /govern tabs / /traces | has-home |
| Notifications / Briefing / Integrations | /settings sections | has-home |
| **Prompts (/prompts, PromptsPanel)** | Redirects to bare /engine-room (no prompts room); panel only at hand-typed /govern?tab=prompts; zero inbound links, not in ⌘K | **dormant** |
| **Tasks (/tasks)** | Redirects to /today which dropped the tasks widget; createTask/updateTask/deleteTask have ZERO UI consumers | **gone-entirely** |

**Genuinely LOST (OBS-04 drop list, `_authenticated.today.tsx:40-56` — "a later item re-homes them if warranted"; none did). Orphans in `src/components/today/` with zero importers:**

- `WedgeTeardown.tsx` — the v9 Critic-teardown launch wedge; strategy canon's wedge has no UI entry point
- `ColdStartOnramp.tsx` — new-workspace onramp (coach marks only partially replace)
- `FocusNext.tsx`, `InsightRail.tsx` — focus-next + insight rail
- `ExecutedCard.tsx`, `CostPerOutcomeChip.tsx`, `StatusUpdateDialog.tsx`, `PendingApprovalsBar.tsx`, `DecisionCard.tsx` (last two conceptually replaced by CallCard)
- Command-center Bottlenecks / Top-priorities tiles — no equivalent
- **"Not now" defer verb on approvals** — retired; calls can only be approved/declined, never snoozed
- `AutonomyCard` survives (imported by GauntletMetricsPanel)

Other notes: ⌘K catalog indexes only 11 entries — Calendar, Trust Ledger, Prompts, meetings, swarm absent despite OBS-10 justifying folds with "rare → ⌘K". Deleted parchment onboarding was an intentional OBS-14 replacement. OBS-10's "deliberately left live" list is now empty; /govern, /prds/$id, /traces(+$id) reclassified permanent drill doors.

Key files: `src/lib/nav-model.ts`, `src/lib/legacy-redirects.ts`, `src/routes/_authenticated.today.tsx`, `src/components/today/`, `src/lib/tasks.functions.ts`, `src/lib/palette-catalog.ts`.

---

## 6. DESIGN PRINCIPLES (verbatim extraction — feeds the v4 design spec)

Sources: [IC] = Interface Craft (Josh Puckett; principles from public descriptions + published work), [DD] = Devouring Details / Rauno Freiberg's public corpus (interfaces.rauno.me + "Invisible Details of Interaction Design"), [2026] = mid-2026 state-of-the-art sweep (Linear redesign notes, Muzli dark-mode token guide, trend reports).

### A. Typography

1. [2026] Pair a display cut with a text cut of the same family: Linear uses Inter Display for headings (more expressive) and regular Inter for body/UI, plus Berkeley Mono for code/data. One family, two optical sizes — cohesion without monotony.
2. [DD] Never use font weights below 400 in a UI; headings sit best at 500-600, not 700+. Weight restraint reads premium; heavy bold reads cheap.
3. [DD] Font weight must never change on hover/selected states (causes layout shift); change color or background instead.
4. [DD] `font-variant-numeric: tabular-nums` on ALL numbers in tables, timers, counters, metrics — non-negotiable in a PM tool full of counts and dates.
5. [DD] `-webkit-font-smoothing: antialiased` + `text-rendering: optimizeLegibility` globally; subset fonts to used glyphs.
6. [DD] Fluid display sizing with `clamp()` (e.g. `clamp(48px, 5vw, 72px)`) for marketing/hero only; app chrome uses a fixed scale.
7. [2026] Dark-mode typography compensates: slightly heavier body weight than light mode (400→450 with a variable font), slightly more line-height, and text at off-white rather than pure white.
8. [2026] Practical dark app scale: UI text 13px/1.4 base (Linear-class density), secondary 12px, headings 15-20px at weight 500-590, page titles rarely above 24px. Small-but-crisp is the premium signal, not large type.

### B. Color temperature + contrast (dark)

9. [2026] Never pure black. Linear's floor is `#010102` (near-black with a faint blue cast); the general safe range is `#0A0A0A`-`#161616`. Pick ONE temperature cast (cool blue for tool-like; Cadence's Obsidian likely warm-neutral) and keep every gray on that cast — mixed-temperature grays are the #1 amateur tell.
10. [2026] Four-surface elevation ladder, each step +5-8% luminance: base bg → panel/card/sidebar → nested/hover surface → overlay (modal/popover/tooltip). Linear's actual ladder: `#0f1011`, `#141516`, `#18191a`, `#191a1b` over the `#010102` floor — note how tiny the steps are; restraint in lift is the craft.
11. [2026] Text ladder: primary off-white `#E0E0E0`-`#F0F0F0` (never `#FFFFFF`), secondary ~60-70% opacity of primary, tertiary/disabled ~40%. Minimum 4.5:1 contrast for body; let secondary text do hierarchy work instead of size changes.
12. [2026] Accents in dark mode: preserve hue, boost luminance, increase saturation 10-20% vs the light-mode value (e.g. `#0070F3` → `#4A9EFF`). Desaturated light-mode accents go muddy on dark.
13. [2026] One chromatic accent, period. Linear carries its entire brand with a single lavender-blue `#5e6ad2`; everything else is the gray ladder + semantic red/green used only for meaning. (Maps directly to Cadence's Ember-only-for-humans / Glacier-machine rule.)
14. [2026] Generate the theme, don't hand-pick 98 grays: Linear derives its whole palette from three variables (base color, accent, contrast) in LCH — perceptually uniform lightness steps, and a "contrast" knob gives free high-contrast accessibility themes. Use OKLCH in CSS today.
15. [2026] In dark mode, limit blue-channel weighting in generated neutrals (Linear explicitly reduced chroma of blue in calculations) — over-blue grays look like 2019 dashboards.

### C. Spacing rhythm

16. [2026] 4px base grid; component padding on 8/12/16; section gaps 24/32. Linear-class density means 8-12px vertical rhythm inside lists, not 16+.
17. [DD] No dead zones in lists: rows must be contiguous click targets — grow `padding`, never `margin`, between interactive list items.
18. [DD] Input decorations (icons inside fields) are absolutely positioned over the input's padding and forward clicks/focus to the input — the whole visual field is the target.
19. [IC] Density with air: the "uncommon care" look comes from tight internal spacing + generous page margins (content column breathes; controls are compact). Consistent asymmetry beats uniform padding.

### D. Depth / material

20. [2026] Shadows do not read on dark backgrounds — hierarchy comes from surface luminance lift + hairline borders, not drop shadows. Linear "trusts surface lift and hairline borders to carry every bit of hierarchy."
21. [2026] Hairline borders: 1px at low-alpha white (`rgba(255,255,255,0.06-0.10)`) on elevated surfaces; a slightly brighter top edge (inset 1px highlight) fakes light-from-above and reads as machined material.
22. [2026] Overlays (menus, modals) get the lightest surface + a soft large-radius ambient shadow (e.g. `0 8px 32px rgba(0,0,0,0.35)`) — the one place shadow still works, because it darkens the scrim area behind.
23. [DD] Large `blur()` values are a perf trap and gradient-on-dark surfaces band — if you use glows/gradients, use radial gradients and dither/noise, and keep backdrop-blur regions small.
24. [2026] Calm over theatrics: 2026 direction is explicitly away from glassmorphism/streamer-gradient excess toward flat matte surfaces with precise edges — "the end of visual theatrics." Reserve any glow for the single accent, at rest-state opacity under ~15%.

### E. Motion / micro-interaction

25. [DD] Cap UI transition durations at ~200ms; anything longer must be interruptible. Under 300ms absolute ceiling [2026].
26. [DD] Scale proportionally to element size: dialogs animate 0.8→1 scale+opacity; buttons press to ~0.96. Small things move small distances.
27. [DD] High-frequency, low-novelty interactions get NO animation: command menus, app-switch-level surfaces, keyboard-driven menus appear instantly. "After the hundredth time, the same animation becomes cognitive burden." Animate the rare, not the routine.
28. [DD] But confirm state changes even in instant UIs: macOS menus appear without motion, yet the chosen item "briefly blinks the accent color" on select before the menu fades — feedback without latency.
29. [DD] A touch of delay improves sequences; some interactions feel better with zero motion. Stagger list/children entrances by ~20-40ms per item, never more.
30. [DD] Immediate manipulation, then animate: apply the user's delta instantly (drag, pinch, resize) and only animate the settle past a threshold. Never make the user wait for an animation to see their input registered.
31. [DD] Interruptibility is the responsiveness test: any animation the user must wait out (iOS Settings push) reads sluggish; any they can redirect mid-flight (App Switcher) reads fast.
32. [DD] Spatial origin: things launch from where they live — popovers scale from their trigger's corner (`transform-origin` set to the anchor), detail views slide from the direction of their list. Motion explains the spatial model.
33. [DD] Trigger thresholds: lightweight/reversible actions trigger during the gesture (past a distance); destructive/committing actions trigger only on release. Peek-then-commit.
34. [DD] Theme switches must not animate (kill transitions during the swap); pause looping animations off-screen; toggle `will-change` only during the animation.
35. [IC] Morph, don't modal: controls should transform in place (button morphs into the form/card it opens; edit happens directly on the card) rather than spawning dialogs. Shared-element continuity is the signature premium move.
36. [2026] Default easing: `cubic-bezier(0.25, 0.1, 0.25, 1)`-class ease-out for entrances, ease-in-out ~150ms for hovers/color, springs (subtle, high damping) only for direct-manipulation settle. Nothing linear except opacity crossfades.

### F. Interaction details (hover/press/focus)

37. [DD] Hover: background lift one surface step (the +5-8% luminance token), 100-150ms ease; never weight/size changes. Gate all hover styles behind `@media (hover: hover)`.
38. [DD] Press: scale ~0.96-0.98 + slight surface darken, instant on down (0ms in, ~150ms out).
39. [DD] Focus: box-shadow ring, not `outline` (follows radius); visible only for keyboard (`:focus-visible`). Style `::selection` deliberately (accent-tinted).
40. [DD] Keyboard depth: sequential focusable lists navigable with ↑/↓, deletable with ⌘Backspace; dropdowns open on `mousedown` not `click` (saves ~100ms perceived); nested menus use a "prediction cone" so diagonal mouse travel doesn't close the submenu.
41. [DD] Interactive elements: `user-select: none`; decorative layers `pointer-events: none`; disable buttons after submit; toggles act immediately with no confirm; disabled buttons never get tooltips.
42. [DD] Extend drag targets beyond visual bounds (sliders, resize handles) so the gesture survives finger/cursor drift; min 16px input font on touch to stop iOS zoom.
43. [DD] Fitts's law: put highest-frequency actions at edges/corners of their container (unlimited target depth), and radial/near-cursor placement for contextual actions.

### G. Information hierarchy

44. [2026] Hierarchy through luminance, not size: in dark UIs the four text opacities + four surface steps do 90% of hierarchy; type-size changes are the last resort. A screen should still make sense in grayscale (matches Cadence's grayscale test).
45. [DD] Two-column long-form pattern: persistent navigation/minimap beside scrollable content; progress and location always visible without a click.
46. [2026] Icons follow the text ladder (neutral icons at secondary-text luminance; Linear explicitly re-tuned icon lightness per mode); colored icons only when the color IS the information.
47. [DD] Feedback appears at the point of action, not global toasts: inline checkmark replaces the copy icon; failing input gets highlighted; optimistic local update with rollback + explanation on error.
48. [DD] Empty states are actionable: prompt creation, offer templates — never a blank void.

### H. Attention-to-detail patterns worth stealing

49. [DD] The "invisible detail" audit: for every interaction ask (a) what's the real-world metaphor, (b) is it interruptible, (c) does frequency justify its motion, (d) is feedback under the finger/cursor. Ship the boring instant version for daily-path actions.
50. [IC] Sound as material (optional, high-craft tier): custom sounds that respond dynamically to input velocity/state (Puckett × Dunsterville) — for Cadence, at most a single completion sound, user-off by default.
51. [DD] Optical over mathematical: nudge icons in buttons 0.5-1px against text baseline; caret/loupe-style helpers appear only while relevant and self-dismiss.
52. [DD] SVG favicon with `prefers-color-scheme`; unset gradients on `::selection` of gradient text; `img` tags (not CSS bg) for meaningful images.
53. [IC] "Uncommon care" ethos → systematic critique: every screen gets a pass for micro-interactions, motion restraint, and one detail nobody asked for. The library's whole thesis: polish is 40+ small deliberate decisions, not a skin.
54. [2026] Perceived performance is design: optimistic updates, instant menus, 0ms-in hover — the 2026 premium bar (Linear/Vercel) is "feels local." Any spinner over 300ms needs a skeleton in the surface-2 tone, shimmer subtle or absent.
55. [2026] Token architecture: express the entire theme as semantic tokens (bg/surface-1..4, text-1..3, border-hairline, accent, semantic-{red,amber,green}) generated from 3 seeds in OKLCH — this is what makes the whole system consistent and lets you ship contrast variants for free.

Caveats: interfacecraft.dev and devouringdetails.com are paywalled behind JS-rendered marketing pages, so [IC]/[DD] items come from the authors' public corpus — Rauno's interfaces.rauno.me guidelines and "Invisible Details" essay are substantively the DD material; Interface Craft yielded fewer public specifics (items 19, 35, 50, 53 plus its ethos).

Sources: interfacecraft.dev · interfaces.rauno.me · rauno.me/craft/interaction-design · devouringdetails.com · Linear "How we redesigned the Linear UI" · Muzli Dark Mode Design Systems · FontOfWeb Linear tokens · LogRocket Linear design · Envato 2026 UX/UI trends · tech-rz Dark Mode 2026 · Dive Club Josh Puckett · MOGE Interface Craft overview.

---

## 7. COPY ISSUES (by surface)

**Terminology splits (systemic):**

- PRD vs spec: /build says "No approved PRDs yet", /prds/$id title says Spec, back link "All PRDs", empty state "Empty PRD" — the IA word is **spec**; unify.
- Plan tiers: People tab uses raw slugs (free/pro/max/team/enterprise), Pricing tab brands them Cluster/Constellation/Galaxy, public /pricing shows internal 'team' as "Business" — three naming schemes for one ladder.
- Trace/Traces/Activity: browser title "Activity", crumb "Traces", surface "Trace".
- /sync path vs "Connectors" label vs browser title.

**Per surface:**

- `/today`: "ICE 6.2 to 7.4" scoring jargon in WhatChanged.
- `/discover`: "ranked by ICE"; "Plug in Intercom" hardcodes one vendor; "Scout" agent codename in helper text.
- `/build`: "plans a 1-6 step DAG"; "approval(s)" garbled plural toast.
- `/build/$missionId`: "the outcome loop re-scores"; "work order" internal vocabulary.
- `/prds/$id`: "chain truncated at the depth cap"; "Capture as decision" + raw path tooltip '/knowledge?tab=decisions'.
- `/knowledge`: "the compounding product memory", "one brain", "Human lenses on the brain", "re-scored opportunities and outcome memos", kicker "Loop · Brain" — mechanism-named.
- `/engine-room`: "Come back when a chip turns marigold" (design-token insider language); "Your calls never live here" ('calls' ambiguous with API calls); all-caps mechanism sub-tabs (TREND/CAPS/SUITES/LEDGER).
- `/govern`: "Quality checks" vs "Quality" indistinguishable tabs; "gauntlet" mechanism name; "a stalled loop", "the weekly steward distills", "at the chokepoint"; "Retry · reloads the surface".
- `/traces/$traceId`: "hops", "gated", "injected into system prompt" (plumbing-named label).
- `/settings`: "Two-way sync ships in 5.2b" (internal version); "Retry · reloads the surface"; raw price_lookup_key + enum strings in ledger.
- `/sync`: "Webhook ingest" mechanism name; raw "local v3 ↔ remote v5" counters + provider enums.
- `/trust-ledger`: "Trust Ledger" + kicker "Govern · Trust" mechanism-named; raw enum statuses (auto_approved) uppercased.
- `/admin` Overview: "Credits engine / Metering is ON" (should be "Charging for AI use"); admins vs People tabs confusable, nothing explains.
- `/admin/ai-costs`: footer "Turn on refresh_observability_mvs() in Supabase Cron" — raw mechanism in UI.
- `/admin/observability`: "Full guide in docs/runbooks/observability.md" — unclickable repo path; raw env-var names as labels.
- `/admin/platform`: "Pull kill switches · post banners"; raw table/column names ("agent_memory rows... expires_at... nightly cron prunes"); raw secret names (CLOUDFLARE_DEPLOY_HOOK_URL, DENO_DEPLOY_TOKEN) in copy/toasts.
- `/admin/pricing`: "Cluster (Pro)" double-naming reads garbled.
- `/admin/proof`: "Babysitting tax", "Supersessions caught", "the moat catching its own drift", "falsifiable predictions with an expired horizon", intro names its own codename — on an "investor-safe" panel.
- `/admin/workspaces`: reset copy leaks "TEST-SEED and DEMO-SEED-RICH migrations in the Supabase SQL editor".
- Auth pages: "agents execute · you govern" mechanism-first tagline x4; signup "Cadence red-teams your calls" insider jargon; founders@cadence.dev unverified.
- Root meta: description "Cursor for Product Managers." contradicts landing positioning; twitter:site "@Lovable".
- Landing: static "Confidence 84%", "activation +8%" read as fabricated live metrics.
- `/pricing`: "decision memory compounding instead of expiring" concept-heavy subhead.
- `/checkout/return`: "checkout session" Stripe vocabulary (against its own comment).
- `/p/$slug`: "Unavailable" heading unhelpfully terse.
- `/ard`: "proof oracle", "supersession" undefined on first use.
- `/obsidian-specimen`: entire page is internal jargon (fine if dev-gated).
- Live spend copy: "$0 of $3,000 · trending +111%" next to HEALTHY next to "$0.01 this week" — contradiction reads as broken.
