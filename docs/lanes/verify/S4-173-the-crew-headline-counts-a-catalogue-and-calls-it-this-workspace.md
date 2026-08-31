# S4-173 — standing questions 2 and 4: the crew headline counts a code catalogue and calls it "here"

> _S4 · 2026-08-31 ~14:3x UTC · `bash e2e/check-motion.sh --signed-in /brain /decide /crew /approvals`,
> dead backend, dummy env on a dead port. **Dev server taken and released — the harness reports
> `:8080` clear and the dummy `.env` removed.** No row written, nothing pressed._

Completing the pass: S4-172 answered questions 1 and 3. **These are 2 and 4.**

---

## Standing question 2 — theatre. One found, and three surfaces cleared.

**Found: `/crew` states a workspace fact it cannot know, two lines above admitting the read failed.**

The rendered page, against a dead backend:

> # 16 agents work here.
> The boundary did not load.
>
> ⚠ **The crew did not load, so nothing below is the real boundary.**

**The headline is not derived from a row.** `_authenticated.crew.tsx:345`:

```ts
const all = React.useMemo(rosterCatalog, []);          // static, empty deps
```

`rosterCatalog()` (`:321`) dedupes `castEntries()`, a **catalogue defined in the source**. It makes no
query — no `useQuery`, no `useServerFn`, no Supabase. The live read is a different thing entirely,
`crew = useQuery(… listCrew …)` at `:338`, and it is the one that failed.

`:509` renders the headline from **`all.length`**, never from `crew.data`:

```ts
: `${count(all.length)} agents work here.`
```

**So "16 agents work here" is the number of agent identities compiled into the product, printed as a
fact about this workspace.** It renders identically whether the workspace has sixteen agents, one, or
none, and whether the backend answered or died. **A count that survives a dead backend is not a
count of anything that exists** — which is standing question 2's definition, word for word.

### What the component gets RIGHT, because this is a near miss rather than a careless screen

**Three of its four failure states are handled, carefully:**

- `:438` — the subtitle becomes *"The boundary did not load."* rather than a stale number.
- `:516` — a `ReadFailed` card: *"The crew did not load, so nothing below is the real boundary."*
- `:423` — a documented `SlowRead` with a retry past fifteen seconds, measured at 6.9s on the running
  product.

**And the boundary summary is guarded too**, which matters most because it is a safety claim.
`onDefaults = all.length - present.length` mixes the static catalogue with the live read, so on a dead
backend it would compute 16 − 0 = 16 and render *"16 run without asking you. 16 of the 16 have never
been narrowed here."* **It does not render, because `sub` is replaced first.** That guard is doing
real work and I am recording it rather than only the miss.

### Why the headline slipped, and it is worth naming

**The headline was never reading the data, so it never looked like a read that could fail.** Every
guard in this file protects something that queries. `all.length` queries nothing, so it was not on the
list of things that could be wrong.

`:504` carries a careful comment about this exact line — *"SAY WHAT SIXTEEN OF. The title read '16
work here.', which omits the noun entirely"* — so somebody thought hard about the **wording** of the
number and nobody asked whether **sixteen was true here**. That is the same shape as `InboxSurface`'s
*"Nothing here is sample data"* (S4-166): the sentence was improved while its premise went unchecked.

**The fix is one conditional and it is not mine to make.** Owner: whoever holds
`src/routes/_authenticated.crew.tsx` — S3 reports `/crew` moved to them in S0's A08.

### CHALLENGED BY S3, CHECKED AGAINST LIVE DATA, AND THE ANSWER IS WORSE THAN FILED

**S3 pushed back correctly**, on the caveat I had written myself: with 283 agent rows in the
database, 16 might be the true catalogue count, making this *"prints a source constant that happens
to be right"* — a real but much weaker finding. **That was the right challenge and it is settled by a
query rather than an argument.**

Distinct agent names per owner, every owner in the database:

| distinct agents | owners |
| --- | --- |
| 22 | 1 |
| 19 | 3 |
| 17 | **12** |
| **16** | **0** |

**Sixteen owners, and not one of them has sixteen agents.** The nearest true value is 17, which is
what 12 of the 16 have. **So the headline is wrong for 100% of accounts** — off by one for
three-quarters of the user base and by six for one of them — on the page whose entire subject is who
is working for you.

**It is not a constant that happens to be right. It is a constant that is wrong for everyone**, and
the dead-backend render simply made it visible. Verdict stands as **CONFIRMED**, and the live check
strengthened it.

### Cleared, and worth recording because question 2 ends features

**`/brain`, `/decide` and `/approvals` show no theatre.** All four surfaces **settled** — nothing
redrew after render, so no label is advanced by a clock. And `/brain` is the one I expected to fail,
given F-157 (**0 of 369 decisions ever cited**, 133 of 135 learnings seed). It reads:

> # The record is still here.
> You are not signed in any more.
> ⚠ Everything the record holds is still here, exactly as it was.

**No learning count, no hit rate, no confidence figure.** All seven stations read `count unavailable`.
**The signed-in brain is honest.** F-157's theatre is on the public Replay and nowhere else, which
strengthens rather than weakens that finding: the product does not repeat its marketing's claim to
its own users.

### A §12 update to S4-167, measured on the rail in this screenshot

**Two of the four rail words I filed have been fixed since.** The rail now reads
**Work · Waiting for you · Brain · Threads · Guardrails**:

| S4-167 said | now |
| --- | --- |
| `Today` AND `Work` as two destinations | **fixed** — `Today` is gone, folded into `Work`, which was the map's *"The board. One name."* |
| `Approvals` | **fixed** — now **"Waiting for you"**, exactly the map's target |
| `Brain` | still there |
| `Guardrails` | still there |
| `Threads`, marked DELETE in `SURFACE-MAP.md:69` | still there |

**Half the map is applied. The half that remains is the half §12 assigned to S0 to rule.**

---

## Standing question 4 — the sixty seconds, and I cannot run it as written

**§0.7 measures it from signup to the product already working. I cannot do that, and the reason is a
rule rather than a difficulty: signup is a database write, and my brief says I do not write the
database.** Creating an account creates rows — a user, a workspace, a seeded roster — in the
production backend this local server points at. **Recorded as blocked rather than approximated,
because a sixty-second figure taken some other way would be quoted as if it were this one.**

**What I CAN measure without writing anything is the signed-in first paint**, and it is worth having:

| surface | time to settle, dead backend |
| --- | --- |
| `/decide` | **8.9s** |
| `/approvals` | **9.7s** |
| `/crew` | **10.1s** |
| `/brain` | **11.7s** |

**Between 8.9 and 11.7 seconds to settle with NOTHING to fetch.** Every read behind these failed
immediately; this is the shell, the rail and the station strip alone. **A sixth to a fifth of the
sixty-second budget is spent before any data could arrive**, and on a live backend the reads are added
to that, not hidden inside it.

**I am not filing that as a defect** — it is a dev-server build with no production optimisation, and
S1 has already measured `/approvals` at 8.1s and `/decide` at 9.4s on the running product with the
same instrument, so the figure is consistent rather than new. **It is recorded as the part of question
4 that can be answered without a write.**

**What is still owed on question 4:** a real signup, timestamped at 10s / 30s / 60s. That needs either
a founder-approved account creation or a credential for an existing seeded account. **S1 hit the same
wall today** — *"the demo login belongs to one real workspace… I hold no seeded account's
credentials"* — so this is a standing gap across two lanes rather than my omission.

## Hygiene

Dev server taken on **8080** and released; the harness reports the port clear and its dummy `.env`
removed. **8080, not 5173** — nothing in this repository binds 5173, which is A6's subject.
Screenshots are in `docs/screenshots/`, gitignored, none committed. No row written, nothing pressed,
no approval answered.
