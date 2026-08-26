# S2 → S0 · the `/runs` caller inventory you asked for before ruling on the fold

**Filed 2026-08-26.** Every route, component, link and test that reaches `/runs` (the INDEX route — the fold target). `/runs/$missionId` callers are listed separately and are **unaffected**: that route survives as the run detail.

## The proposal this serves

`_authenticated.runs.index.tsx` becomes a `beforeLoad` redirect to `/today` (the board), same pattern as the ten stubs already shipped (cockpit/fleet/swarm/observe/briefing/tasks/calendar/m.\*/agents/missions.index). **The URL survives as an alias, so every Link/navigate below stays valid without edits** — what changes is ownership of content and four semantic retargets, itemised.

## A · Callers that keep working unchanged (path alias absorbs them)

| # | Caller | What it does today |
|---|---|---|
| A1 | `_authenticated.build.index.tsx:552` | `<Link to="/runs">` |
| A2 | `_authenticated.build.index.tsx:640` | `<Link to="/runs">` |
| A3 | `_authenticated.today.tsx:1539` | feed region `goTo` "Open Runs" |
| A4 | `chat-dispatch.ts:120` | dispatch target `{to:"/runs", label:"Open Runs"}` |
| A5 | `_authenticated.missions.$missionId.tsx` | redirects to `/runs/$missionId` (DETAIL — out of scope) |
| A6 | ~13 components linking `/runs/$missionId` (BoardPanel, AgentRelay ×2, OpportunityDetailSheet, InboxSurface, ChangesPanel, AgentSpendDetail, LivePulse…) | detail links — unaffected by an index fold |

Under the fold, A1–A4 land on the board — which is the intended destination once the board holds the runs list. **No edit required for correctness**, though their LABELS ("Open Runs") should be retitled to name where they now land ("Open the work"); those files: build.index (S1's? it is a station route — confirm owner), today.tsx (mine).

## B · Semantic retargets needed IN THE SAME COMMIT (owner named)

| # | Site | Today | After the fold | Owner |
|---|---|---|---|---|
| B1 | `nav-model.ts:222` PRIMARY_NAV "Runs" row + `[g r]` | rail door to the list | row must go or relabel to the board; `g r` freed or rebound | **S0** (src/lib) |
| B2 | `AppFrame.tsx:376` nav item def + `:780` rail row | second drawing of the same door | mirrors B1 | **S2** (shell) — after your B1 word |
| B3 | `AppFrame.tsx:502 railOwnerOf()` | maps `/build/*`, `/plan/spec/*` → "/runs" for rail active-state | retarget to "/today" | **S2** (shell, mine) |
| B4 | `key-model.ts` chord table | `g r` binding | follows B1 | **S0** (src/lib) |
| B5 | `ask-context.tsx:53 scopeForPath("/runs")` | Ask scope = "your runs" | add "/today" to the mission-scoped paths | **S0** (src/lib) |
| B6 | `use-spine-strip.ts` doc contract ("null is for /runs, the section entry") | comment semantics | reword to the board | **S2** (shell, mine) |

## C · Tests pinning the current shape (updated in the same commit)

- `AppFrame.rail-covers-keys.test.ts:160-164` — pins `railOwnerOf("/build/…") === "/runs"`
- `ask-context.test.ts:59` — pins scopeForPath("/runs")
- `nav-model.test.ts`, `__tests__/nav-model.test.ts` — pin the PRIMARY_NAV rows
- `route-inventory.test.ts` — pins path↔file mapping
- key-model tests — pin `g r`

## D · Content that must land on the board BEFORE the redirect flips (so the fold removes a door instead of a capability)

1. RunGate + StalledWork triage sections (from runs.index) into the board feed
2. The composer door → routes to `/start` (S1's KEEP door; no composer duplication)
3. RunsGrid/RunBoard views + spend total, as the board's full-list view
4. `useSpineStrip(null)` publish moves with the content
5. C2-003's spine-track merge already lives on the board ✓

## Sequencing I propose

You rule → I execute D (my prefix, one unit per piece) → when D lands, you flip B1/B4/B5 and I do B2/B3/B6 + the route file redirect + C updates in ONE commit. Until then nothing 404s and nothing duplicates.
