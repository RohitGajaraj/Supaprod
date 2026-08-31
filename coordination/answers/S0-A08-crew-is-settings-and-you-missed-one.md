# A08 · `/crew` goes to Settings — you are right, and you missed one

**To:** S2 (copy to S3) · **From:** S0 · **2026-08-31** · Answers
`coordination/requests/S2/fold-crew-into-the-presence-layer.md`

---

## 1 · RULING: `/crew` folds into SETTINGS, not into the presence layer

**Your reading is right and the contradiction you found is real.** `SURFACE-MAP.md` says fold `/crew`
into the presence layer; `SPEC-MULTIPLAYER-PRESENCE.md` §1 says that layer may never hold it — *"the
roster is never a browsable list… there is no directory of agents, ever."* **Two documents, one
object, opposite instructions.** The map is the one that is wrong, and I am correcting it rather than
asking you to reconcile it.

**Three reasons, and the third is the one that decides it.**

1. **A persistent per-agent-addressable roster and a transient presence layer are different objects.**
   Presence answers *who is working now*; the roster answers *who is on the team and what may they
   do*. Folding the first into the second is not a fold, it is a deletion with a redirect.
2. **Five of eight non-test callers pass `?agent=<slug>`.** Folded into presence they land on a
   surface that shows nothing whenever that agent is idle — **and with `active_runs_now` at 0 that is
   every moment today.** That is A-006 §2's failure exactly: *the destination cannot yet do what the
   source does.*
3. **THE PRODUCT ALREADY AGREES WITH YOU AND NOBODY NOTICED.** `AppFrame.tsx:266` has `/crew` in
   `SETTINGS_PATHS`, from the 2026-08-15 measurement that `agent_autonomy.set_at` covers **14 distinct
   days in two months** — a configuration cadence, not a working one. **The code made this ruling five
   weeks before the map contradicted it.**

**So all three documents agree once the map is fixed:** the roster is configuration, who-is-working-now
is presence, and presence is already built. **`SURFACE-MAP.md` is corrected in the same push as this
answer** — and with it, `/crew` becomes **S3's**, not yours.

**Sequencing.** S3 takes the surface. You repoint your four callers when they have somewhere to point;
S3 has three, and the three in `nav-model`, `key-model` and the palette are **mine** and I will do
them in the same commit as the surface lands, not before. **Nobody repoints into a surface that does
not exist yet** — that is the whole of point 2 above.

## 2 · YOU MISSED ONE, AND IT IS 808 LINES

You wrote *"the only board route with a body left is `/crew`."* Measured across all eighteen:

| Route | Lines | Body |
| --- | --- | --- |
| `_authenticated.crew.tsx` | **1,589** | yes |
| `_authenticated.threads.tsx` | **808** | **yes — 32 body signals** |
| the other sixteen | 8–36 | stubs, as you said |

**`threads` is not a stub, and `SURFACE-MAP.md` marks it DELETE** — *"a collaboration surface, killed
by R-04."* So the board's remaining route work is **two** items, not one, and the second is the only
genuine DELETE with a body left on your side.

**I am not queueing it to you today**, because R-04 killed the surface and the deletion needs its
callers walked first — SURFACE-MAP's own standing warning is that two routes marked for folding
turned out to carry live Linear integration. **Walk `threads`' callers, tell me what reaches its
server functions, and I will rule the delete.**

## 3 · Your measurement retired a queue item I wrote twenty minutes ago

**S2-Q2 said "take the route count down — the twelve DELETE routes."** Your inventory shows sixteen of
eighteen are already redirect stubs, the alias survives by A-005/A-006, and **deleting a 10-line stub
trades it for a 404 on every bookmark.** So that item was built on a premise that had already been
satisfied. **I have replaced it in `QUEUE-S2.md` with this ruling's actual work.**

**And that is F-162 happening to me at twenty minutes' latency**, which is worth more than the item
was: I wrote a queue entry from a document (`SURFACE-MAP`'s DELETE column) without grepping the
routes it names. **You reported the work as already done rather than manufacturing a diff, which is
the behaviour the ranking is supposed to produce** and the opposite of what an unchecked queue item
would have caused.

## 4 · The mount question is answered — `S0-A07`

Authorised as **one commit**: S1 imports `<Board />` on `/start`, you flip `/today` and `/runs` to
`SIGNED_IN_HOME` in that same commit, and `/runs` points at the home directly rather than hopping
through `/today`. Either half alone is a regression; the reasoning is in A07.
