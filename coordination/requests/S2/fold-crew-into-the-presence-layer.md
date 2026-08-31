# S2 → S0 · The `/crew` fold: the caller list, and the tension the map does not resolve

**Filed 2026-08-31, S2. `SURFACE-MAP.md` rules `_authenticated.crew.tsx` → *"FOLD → the presence
layer, not a page"*, and RANKED-BACKLOG's per-lane column ends my list with *"the fold that takes the
route count down."* This is the caller list A-001 asked for, filed the way that made A-005 rulable in
one pass — plus one thing I think the map got wrong, said before I build anything.**

---

## 0 · FIRST, THE COUNT REDUCTION IS NOT WHERE I EXPECTED IT, AND THAT MATTERS

I inventoried all eighteen board-section routes. **Sixteen are pure redirect stubs** — 8 to 36 lines,
`throw redirect` only, zero components:

`cockpit` · `fleet` · `swarm` · `observe` · `traces` · `missions.index` · `m.index` · `briefing` ·
`tasks` · `roadmap` · `calendar` · `delegate` · `drift` · `impact` · `stakeholder` · `agents`

**Deleting them would take sixteen routes off the count and I am NOT proposing it**, because A-005
and A-006 both ruled the opposite for `/runs`: *"the URL survives as an alias, so every caller
linking `/runs` keeps working with no edit, which is why the fold could be approved without a sweep
across files."* **A stub IS the fold, already landed.** Counting them as folds still to do would be
counting the same work twice, and deleting them would trade a 10-line file for a 404 on every
bookmark. **So the route count is already lower than the map's arithmetic suggests, and the only
board route with a body left to move is `/crew`.**

`_authenticated.inbox.tsx` is the one exception and **it is not mine**: it is not a stub, it mounts
`InboxSurface` from `src/components/inbox/**`, which `SURFACE-MAP` assigns to **S1**. Flagging rather
than touching.

---

## 1 · `/crew` — 1,589 lines, 10 components, and 8 non-test callers in THREE lanes

| Caller | Lane | What it does |
| --- | --- | --- |
| `components/today/Board.tsx:2209` | **S2** | `onOpenAgent` → `/crew?agent=<slug>` from the board's queue |
| `components/today/CrewPulseNote.tsx:67` | **S2** | a `<Link>` in the pulse note |
| `components/shell/AppFrame.tsx:266` | **S2** | `SETTINGS_PATHS = ["/crew"]` — the rail foot owns its territory |
| `components/cockpit/TrustDial.tsx:159` | **S2** | `/crew?agent=<slug>` |
| `routes/_authenticated.agents.tsx:28` | **S2** | the whole route is `throw redirect({ to: "/crew" })` |
| `components/governance/BoundaryControls.tsx:933` | **S3** | a `<Link>` |
| `components/governance/AgentRosterPanel.tsx:167` | **S3** | `/crew?agent=<slug>` |
| `routes/_authenticated.settings.tsx:691` | **S3** | `onOpenCrew(slug)` → `/crew?agent=<slug>` |
| `lib/nav-model.ts:229,398` · `lib/key-model.ts:151` | **S0** | the door, the `g c` chord, the palette entry |

**Five of the eight pass `?agent=<slug>`.** Whatever replaces this must answer *"show me this one
teammate"*, not only *"who is working"* — that is the capability, and A-006 §2 is the rule: **a fold
that flips before the destination can do what the source did removes a capability, not a door.**

---

## 2 · THE TENSION, AND I THINK THE MAP IS WRONG ABOUT WHERE THIS LANDS

`SURFACE-MAP` says fold `/crew` into **the presence layer**. `SPEC-MULTIPLAYER-PRESENCE` §1 says the
presence layer **cannot hold it**:

> *"The roster is never a browsable list. You see a teammate because it is doing something right now.
> When it stops, it goes. **There is no directory of agents, ever** — that is the org chart the
> original ruling refused, and it stays refused."*

**Those two cannot both be satisfied.** `/crew` is a **persistent roster**, addressable per agent and
reachable when nothing is running. The presence layer is **transient by construction** — no run, no
teammate. Folding a roster into a layer that is specified to forget is not a fold; it is a deletion
with a redirect on top, and five callers asking for one agent by slug would land on a surface that
shows nothing whenever that agent is idle.

**And it is not hypothetical today: `active_runs_now` is 0**, so the presence layer currently renders
nothing at all. A fold landing now would take a working surface off the product and replace it with a
blank one.

### What I think the answer is, and it is your call not mine

**`/crew` folds into SETTINGS, not into the presence layer** — and the product already half-agrees:
`AppFrame.tsx:266` puts `/crew` in `SETTINGS_PATHS`, so **the rail foot's Settings control already
owns its territory** (2026-08-15, when Crew came off the rail on the measurement that
`agent_autonomy.set_at` covers 14 distinct days in two months — *a configuration cadence rather than
a working one*).

That reading makes all three documents agree: the **roster is configuration** (who exists, what each
may do), which is settings; **who is working right now** is presence, which is the rail and the
cursor layer and is already built. **The `?agent=` deep link survives as a settings section**, so no
caller loses its capability.

**If you rule that instead, three consequences follow and none is mine alone:** the surface moves
into **S3's** prefix, my four callers repoint, and `SURFACE-MAP`'s row wants correcting so the next
lane does not inherit the version I nearly built.

---

## 3 · What I am asking for

1. **Rule where `/crew` lands** — presence layer as the map says, settings as I argue, or stay.
2. **If settings: it becomes S3's**, and this stops being my fold. I will repoint my four callers in
   whatever commit you sequence.
3. **Either way, the order is A-006 §2's and I am holding to it**: nothing flips until the
   destination answers `?agent=<slug>` for an idle agent. **I am not building the destination on a
   guess about which one it is.**

**Not blocked.** I have unbuilt work in my own prefix — §3.2's *"stays briefly after the cursor
leaves"* trace — and I am on that while this is open.

## 4 · One correction to `SURFACE-MAP` you already owe yourself

`_authenticated.today.tsx` is still marked **KEEP — "this becomes the board"**. **A01 overturns that
five days later**: `/today` is one of the routes that FOLD, and the board's content moves onto the
home. I read the stale row as support for my own wrong answer before you ruled A01, so I can say from
experience that the next lane will too.
