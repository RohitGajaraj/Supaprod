# S4-184 — the fold is 49 of 85 done, and what remains is the expensive half

> _S4 · 2026-09-01 ~04:2x IST · route files, `SURFACE-MAP.md` dispositions and line counts. No dev
> server, no row written, nothing pressed. **A platform-level read at the founder's steer, from a
> user's view rather than a defect's.**_

**The operating model's §0.5 names the structural defect as *"three surfaces, not 119 routes"*. This
measures where that stands, and the honest answer is better than the route count suggests and worse
than "mostly done".**

## What a person actually has

| | |
| --- | --- |
| signed-in route files | **85** |
| of those, **redirect stubs** | **49** |
| **real surfaces a person can land on and stay** | **36** |

**The consolidation largely shipped.** `cockpit`, `fleet`, `swarm`, `observe`, `drift`,
`stakeholder`, `docs`, `prompts`, `discovery` and forty others are one-line redirects, not surfaces.
**Counting route files and reporting 85 doors would have been wrong**, and it is the first thing I
checked because it is the number that looks alarming.

**Where they land, counted:** `/engine-room` **15** · `/brain` 10 · `/settings` 4 · `/today` 3 ·
`/plan` 3 · `/build` 3 · `/threads` 2 · `/ship` 2.

## What remains is the seven stations, and they are the largest thing in the product

**Every per-station route is marked FOLD and every one is still a full surface:**

| route | lines | disposition |
| --- | --- | --- |
| `decide` | **3,667** | FOLD |
| `ship` | **3,565** | FOLD |
| `plan.spec.$id` | **2,984** | FOLD |
| `design` | **2,189** | FOLD |
| `brain` | **2,019** | FOLD |
| `crew` | **1,589** | FOLD |
| `plan.index` | **1,273** | FOLD |
| `learn` | **1,067** | FOLD |
| `approvals` | **904** | FOLD |
| `build.index` | **810** | FOLD |

**~20,000 lines of route marked to fold into one board.** By contrast `today` is 47 lines and
`discover` is 127 — those two have already folded, and their size is what a folded station looks
like.

**So the fold is not stalled. It is 49 stubs done and the ten hardest surfaces left**, and the ten
left are hard precisely because they are where the work actually is.

## The one destination that carries three names

**`/engine-room` receives 15 redirects — more than double any other — and §12's rename map opens with
its row:**

> *Engine Room · Guardrails · Govern · Boundary · Safety → **What it's allowed to do*** — *"Four
> routes and a mood for one idea."*

Today that single destination is:

- reachable at the path **`/engine-room`** — banned word
- labelled in the rail **"Guardrails"** (`AppFrame.tsx:525`) — banned word, *same row of the map*
- drawn with **`IconEngine`** — named after the first

**I checked whether it was reachable at all before writing this, and it is** — the rail's Guardrails
row points at it. **That is worth saying because the alarming version ("15 redirects to a destination
with no nav entry") was my first reading and it was wrong.**

**S2 has renamed the label to "What it's allowed to do" on `lane/control`.** That fixes one of the
three. **The path is what a person copies into Slack**, and changing it is a real decision with a real
cost — external links and bookmarks — so it is a product call, not a cleanup.

## Two routes marked DELETE that are not stubs

- **`threads.tsx` — 808 lines, live, in the primary rail.** Already filed (S4-167). And
  `SPEC-AGENT-COMMS.md` §3 argues *from its deletion in the past tense* — *"noise is what
  `_authenticated.threads.tsx` was deleted for"* — which is false on this tree and is load-bearing for
  closing the message vocabulary at seven.
- **`inbox.tsx` — marked DELETE, and S1 has been building it all day** (RUN-104, RUN-106, RUN-126,
  `InboxSurface`). **The plan says delete and the work says build.** That is a contradiction between
  two lanes' sources of truth rather than a defect in either, and only S0 can settle it.

## What I would tell the founder, in one paragraph

**The route sprawl is mostly solved and the remaining half is the real product.** Forty-nine doors
became redirects; thirty-six surfaces remain; ten of those are the seven stations plus their detail
pages, they carry ~20,000 lines, and folding them is the actual work `THE-ONE-SCREEN.md` describes
rather than a tidy-up. **The cheap wins are done.** What is left will not get cheaper by waiting, and
two of the three names on the product's busiest destination are words we have already ruled against.

## Owner

**S0** for the `inbox` DELETE-versus-build contradiction and for whether `/engine-room`'s **path**
changes. **S2** for the rail label, already in flight. **S3** for the station surfaces they hold.
**Nothing here is mine to fix and none of it is filed as a defect** — it is a measurement of where the
plan and the tree disagree.

No product code written. No dev server, no row written, nothing pressed.
