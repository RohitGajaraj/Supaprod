# SURFACE MAP — every route in this repo, its owner, and what happens to it

> _Written 2026-08-26 by MAIN under the founder's instruction: "every single surface needs to be
> reviewed and mapped correctly. Make sure you have assigned every single surface to some agent."_
>
> **113 product routes. Not one is unassigned.** Owner is who may write it. Disposition is what
> happens to it under `OPERATING-MODEL-5-SESSIONS.md` §0.5 — there are three surfaces (the run, the
> board, settings) and everything else is a view inside one of them or it goes.
>
> **S0 rules on every DELETE and every FOLD before it happens.** A lane proposes in
> `coordination/requests/<S>/`; S0 answers in `coordination/answers/<S>/`. **A route folded without
> its callers redirected is a 404 in production**, so the fold and the redirect ship in one commit.

**Dispositions:** `KEEP` one of the three surfaces, or genuinely load-bearing · `FOLD → x` becomes a
view inside x, route redirects · `DELETE` nothing survives, callers redirected to the nearest real
surface · `AUDIT` real work exists behind it, its shape is undecided — S0 rules before a lane touches it.

---

## THE RUN — S1. One piece of work, from handover to verdict.

| Route | Disposition | Plain name on surface |
| --- | --- | --- |
| `_authenticated.track.$trackId.tsx` | **KEEP** — this is the run | *(the work itself)* |
| `_authenticated.start.tsx` | **KEEP** — the door, the assign gesture | Start something |
| `_authenticated.discover.tsx` | FOLD → run, Discover view | What we found |
| `_authenticated.discovery.tsx` | DELETE — duplicate of the above | — |
| `_authenticated.opportunities.tsx` | FOLD → run, Discover view | What we found |
| `_authenticated.decide.tsx` | FOLD → run, Decide view | The call, and what we expect |
| `_authenticated.plan.index.tsx` | FOLD → run, Plan view | The plan |
| `_authenticated.plan.spec.$id.tsx` | FOLD → run, right pane. **Carries a live integration caller** — `createLinearIssuesFromTasks`. The fold moves it into the run; it does not drop it | The plan |
| `_authenticated.prds.tsx` · `prds.index.tsx` · `prds.$id.tsx` | FOLD → run, Plan view. Three routes for one object | The plan |
| `_authenticated.design.tsx` | FOLD → run, Design view | The design |
| `_authenticated.build.index.tsx` · `build.$missionId.tsx` | FOLD → run, Build view | The change |
| `_authenticated.studio.index.tsx` · `studio.$missionId.tsx` | FOLD → run, Build view | The change |
| `_authenticated.ship.tsx` | FOLD → run, Ship view | Going out |
| `_authenticated.learn.tsx` | FOLD → run, Learn view | What actually happened |
| `_authenticated.outcome.tsx` | FOLD → run, Learn view | What actually happened |
| `_authenticated.artifacts.tsx` | FOLD → run, right pane | What was made |
| `_authenticated.approvals.tsx` | FOLD → asked in place (R-04). Survives only as overflow for skipped asks | Waiting for you |
| `_authenticated.chat.tsx` | FOLD → the composer in the run | — |

**S1's rule:** a station is a **view inside the run**, never a route a person navigates to. The
station names stay (Discover · Decide · Plan · Design · Build · Ship · Learn); the routes do not.

---

## THE BOARD — S2. Every piece of work at once.

| Route | Disposition | Plain name on surface |
| --- | --- | --- |
| `_authenticated.tsx` | **KEEP** — the shell, the rail, the cursor layer mounts here | — |
| `_authenticated.today.tsx` | **KEEP** — this becomes the board | Work |
| `_authenticated.runs.index.tsx` · `runs.$missionId.tsx` | FOLD → board | Work |
| `_authenticated.missions.index.tsx` · `missions.$missionId.tsx` | FOLD → board | Work |
| `_authenticated.m.index.tsx` · `m.$productId.tsx` | FOLD → board. Shorthand routes for the same object | Work |
| `_authenticated.cockpit.tsx` | DELETE | — |
| `_authenticated.fleet.tsx` | DELETE | — |
| `_authenticated.swarm.tsx` | DELETE | — |
| `_authenticated.observe.tsx` | DELETE | — |
| `_authenticated.briefing.tsx` | FOLD → board | Work |
| `_authenticated.tasks.tsx` | FOLD → board | Work |
| `_authenticated.roadmap.tsx` | FOLD → board, a filter over work | Work |
| `_authenticated.calendar.tsx` | FOLD → board. What is due back, and when the window closes | What is coming back |
| `_authenticated.crew.tsx` | FOLD → the presence layer, not a page | Your team |
| `_authenticated.agents.tsx` | FOLD → the presence layer, not a page | Your team |
| `_authenticated.delegate.tsx` | FOLD → the assign gesture, on the board and in the run | Assign |
| `_authenticated.traces.tsx` · `traces.$traceId.tsx` | FOLD → the run's activity, and the board's what-changed | Activity |
| `_authenticated.threads.tsx` | DELETE — a collaboration surface, killed by R-04 | — |
| `_authenticated.inbox.tsx` | DELETE — fold anything real into *Waiting for you* | — |
| `_authenticated.sync.tsx` | AUDIT — **and it is not empty.** `src/lib/sync.functions.ts` calls `pullLinearIssue` and `pushLinearIssue`. **Folding it must move the caller, never drop it** (`SPEC-CONNECTORS.md` §1) | — |
| `_authenticated.drift.tsx` | DELETE | — |
| `_authenticated.impact.tsx` | FOLD → the verdict in the run | What actually happened |
| `_authenticated.stakeholder.tsx` | DELETE | — |

**S2's rule:** seven doors onto "what is happening" become one. **Nothing on the board is read-only** —
every row offers the next action (R-03).

---

## SETTINGS, ACCOUNT AND PLATFORM — S3.

| Route | Disposition | Plain name on surface |
| --- | --- | --- |
| `_authenticated.settings.tsx` | **KEEP** — the one settings page | Settings |
| `_authenticated.onboarding.tsx` | AUDIT → most of it should disappear into `/start`. Nothing is set up before something happens | — |
| `_authenticated.engine-room.tsx` | FOLD → settings section | What it's allowed to do |
| `_authenticated.guardrails.tsx` | FOLD → same section | What it's allowed to do |
| `_authenticated.govern.tsx` | FOLD → same section | What it's allowed to do |
| `_authenticated.boundary.tsx` | FOLD → same section | What it's allowed to do |
| `_authenticated.budgets.tsx` | FOLD → settings section | Spending |
| `_authenticated.notifications.tsx` | **KEEP** as a settings section **and build the delivery** — gap #2, nothing reaches a person who left | Notifications |
| `_authenticated.integrations.tsx` | FOLD → settings section, **and reached at the moment of need** in the run, never browsed first | Connections |
| `_authenticated.brain.tsx` | FOLD → a line inside the run before a decision, plus one honest settings view | What we've learned |
| `_authenticated.memory.tsx` | FOLD → same | What we've learned |
| `_authenticated.knowledge.tsx` | FOLD → same | What we've learned |
| `_authenticated.track-record.tsx` | FOLD → one surface | Track record |
| `_authenticated.trust-ledger.tsx` | FOLD → same. `ledger` is banned vocabulary | Track record |
| `_authenticated.evals.tsx` · `eval-health.tsx` | FOLD → admin | Quality |
| `_authenticated.analytics.tsx` | FOLD → admin | — |
| `_authenticated.docs.tsx` | DELETE — in a closed loop a docs page is the defect | — |
| `_authenticated.prompts.tsx` | DELETE — internal | — |
| `_authenticated.changelog.tsx` | AUDIT → public surface or delete; S0 rules | Updates |
| `_authenticated.meetings.tsx` · `meetings.$id.tsx` | AUDIT — S0 rules what is behind them | — |
| `_authenticated.$workspaceSlug.$productSlug.tsx` | AUDIT — the workspace/product addressing scheme. **S0 rules before anyone touches it**; it is the tenancy boundary | — |
| `_authenticated.admin.tsx` + `.index` `.people` `.invites` `.workspaces` `.pricing` `.platform` `.routing` `.proof` `.landing` `.observability` `.ai-costs` | **KEEP** as admin, but **audit each: which hold real work and which are empty rooms.** Report the count | Admin |

### Account, auth and money — S3

`login.tsx` · `signup.tsx` · `forgot-password.tsx` · `reset-password.tsx` · `join.$token.tsx` ·
`checkout.tsx` · `checkout.return.tsx` — **KEEP, all of them.** Ask S0 for a Mobbin reference before
designing any of these; it is the one session with that access.

**One trap:** an OAuth signup leaves no password, so no agent can ever fill that form again on the
founder's behalf. **Make email + password work first.**

### Public and marketing — S3

`index.tsx` · `product.tsx` · `pricing.tsx` · `faq.tsx` · `demo.tsx` · `film.tsx` · `investors.tsx` ·
`proof.tsx` · `trust.tsx` · `security.tsx` · `privacy.tsx` · `terms.tsx` · `subprocessors.tsx` ·
`updates.tsx` · `brief.tsx` · `ard.tsx` · `d.$slug.tsx` · `p.$slug.tsx` · `p.teardown.tsx` ·
`t.$slug.tsx` — **KEEP, AND FROZEN AS OF 2026-08-31.** So is `_authenticated.admin.landing.tsx`, and
so are `src/components/landing/**` · `public/**` · `plg/**` · `supaprod/**` · `brief/**` ·
`product/**`.

**FROZEN means S3 owns them so that nobody else touches them, not so that S3 improves them.**
Operating model §0.7, ruled by the founder: every lane's weight goes to platform strength until the
acceptance is met. **Four exceptions and nothing else is one** — a live page states something false, a
legal or security page is wrong, the page is broken, or the founder asks by name. A unit spending here
is rejected at S0's gate.

**Nothing outward-facing ships without the founder's approval**, and that still holds for the four
exceptions. Copy obeys `docs/strategy/positioning-locked-2026-08.md` — and the claims audit found the
worst vocabulary drift was in the shop window, not the product.

---

## PLATFORM INTERNALS — S0 only.

| Route | Disposition |
| --- | --- |
| `src/routes/api/**` (`chat.ts`, `mcp.ts`, `plan-gate.ts`, `public/`, `stripe/`) | **KEEP.** S0 alone |
| `mcp.ts` (root) · `[.mcp]` · `[.well-known]` · `[.]lovable.oauth.consent.tsx` | **KEEP.** S0 alone |
| `_authenticated.meridian.tsx` | **KEEP** — the design-system gallery. S0 owns Meridian |
| `__root.tsx` | **KEEP.** S0 alone |

---

## The count, and what it is for

| | Routes |
| --- | --- |
| KEEP | 41 |
| FOLD | 45 |
| DELETE | 12 |
| AUDIT — S0 rules first | 6 |
| S0 internals | 9 |

**Roughly 113 product routes become roughly 41, and most of those are public pages and auth.** The
signed-in product is three surfaces. **The measure of a good session is that this count went down** —
and every fold must land with its redirect in the same commit.

**If a route is not in this table, it was added after 2026-08-26 and needs an owner. File it.**

**Standing warning, learned the same day this map was written.** I marked two routes for folding before
checking what called into them, and both carry live Linear integration. **Before you fold or delete
anything, grep for what reaches its server functions** — the route is the door, not the feature, and a
fold that drops a caller is a silent regression that typechecks. Anything reached from
`src/routes/api/public/hooks/sense-tick.ts` deserves the same care; it is the cron the whole evidence
path hangs off.

---

## Every component directory, and who may write it

Same law: one writer per path. 50 directories, none unassigned.

| Directory | Owner | Note |
| --- | --- | --- |
| `src/components/meridian/**` | **S0** | The design system. A lane authors a primitive locally and files it; S0 reviews it hard against R-20's eight before it enters |
| `src/components/ui/**` | **S0** | The shadcn base. Nobody else touches it |
| `src/components/track/**` · `spine/**` · `presence/**` · `decisions/**` · `learn/**` · `ask/**` · `discover/**` | **S1** | The run |
| `src/components/plan/**` · `prds/**` · `design/**` · `build/**` · `ship/**` · `studio/**` | **S1** | Station views inside the run. Folded, not separate |
| `src/components/shell/**` · `runs/**` · `today/**` · `observe/**` · `crew/**` · `agents/**` · `traces/**` · `mission/**` · `missions/**` · `cockpit/**` | **S2** | The board, the rail, the cursor layer |
| `src/components/onboarding/**` · `settings/**` · `billing/**` · `admin/**` · `system/**` · `governance/**` · `engine-room/**` · `connections/**` · `notifications/**` | **S3** | The platform |
| `src/components/landing/**` · `public/**` · `plg/**` | **S3 — FROZEN (§0.7)** | Owned so nobody touches it |
| `src/components/brain/**` · `memory/**` · `knowledge/**` · `trust/**` | **S3** | *What we've learned* and *Track record*. **Honest emptiness until a real learning exists** (R-06, F-70) |
| `src/components/approvals/**` · `inbox/**` | **S1** | Folds into asked-in-place; S1 owns the fold because the ask lives in the run |
| `src/components/chat/**` · `threads` | **S1** | Folds into the composer |
| `src/components/product/**` · `supaprod/**` · `brief/**` | **S3 — FROZEN (§0.7)** | Public and marketing |
| `src/components/machine/**` · `ink/**` | **S0** | AUDIT — `ink` is a retired design system's name. S0 rules whether either survives |
| `src/components/shared/**` | **S0** | Cross-cutting. A lane proposes, S0 places it |
| `src/components/__tests__/**` | shared | Each session owns the tests for its own components |
| `e2e/**` | **S4** | Nobody else writes an end-to-end test |
| `src/lib/**` · `supabase/**` | **S0** | Server, spine, tools, migrations |
| `src/styles/**` except `meridian.css` | **S3** | `meridian.css` is S0's |

**If a directory is not in this table, it was added after 2026-08-26. File an ask before writing in it.**

---

## Design references — the one thing every lane must route through S0

**Only S0 can reach Mobbin MCP** (600k+ screens from teams who ship world-class product). The four
OpenCode sessions cannot, and **guessing at a design instead of asking is exactly the "eyeballed, not
ported" failure R-20 §7 calls a fail.**

**So, before designing any surface that does not already have a reference:**

1. The lane files `coordination/requests/<S>/design-<surface>.md` — the surface, what the person is
   trying to do on it, the states it must cover (empty, loading, failed, held, permission-denied), and
   what it must not become.
2. **S0 pulls Mobbin, and commits the reference into `docs/design/reference-2026-08-26/<surface>/`** —
   the images plus a written note of the mechanics worth taking. **The mechanics in words are the
   deliverable**, because R-20 §7 requires porting from a real source rather than eyeballing a
   screenshot.
3. S0 answers in `coordination/answers/<S>/design-<surface>.md` naming the committed path.
4. The lane pulls, reads, builds.

**S0 does this proactively for the surfaces it knows are coming** — the auth pages, signup,
onboarding, the board, the empty states — rather than waiting to be asked. **A lane blocked on a
reference is S0's failure.**

The same route serves anything else only S0 can reach: a database count, a deploy, a migration, a
founder ruling, a video or creative asset from a media MCP, a Lovable read. **File it, keep working on
something else, and check for the answer on your next pull.**
