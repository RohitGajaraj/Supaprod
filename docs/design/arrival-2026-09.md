# The arrival: what an empty workspace says before any run exists

> _Created: 2026-09-03 · Last updated: 2026-09-03_

> _Written 2026-09-03 (A2, packet P-33). Walked on `supaprod.ai` against a workspace created for
> the walk, plus a source audit of every first-time state the walk could not reach._

Every walk before this one was on **Helio Labs**, a workspace with 59 decisions and 15 tracks.
The founder's own workspace, and every new customer's, starts with nothing. The bar says empty,
slow and wrong are the states that decide whether a product is trusted, and the ones designed
last. This is the first time anyone has designed this one since the fold.

The walk found more than a set of empty states. It found that **the empty state had never been
reachable**, and that the surfaces behind it had been written as though only one workspace would
ever exist.

---

## 1. The first wall: you could not make one

**A second workspace could not be created at all, and never had been.**

`workspaces` carried RLS for select, update and delete and **no INSERT policy**. The one
INSERT-capable policy was `ws owner admin manage`, whose check is
`has_workspace_role(id, ARRAY['owner','admin'])` — it asks whether the caller is already a member
of the workspace being inserted. On an insert the row does not exist and neither does its
membership, so it is false by construction. Every press of **Start another workspace** was refused.
No account on the database had ever held two non-sample workspaces.

The file's own comment said the opposite: _"RLS already permits an owner insert. Same shape as
onboarding's."_ Both halves were false. Onboarding's shape is not this one —
`ensure_user_default_workspace` is `SECURITY DEFINER`, so it bypasses RLS entirely and writes the
membership row itself. Believing the two were the same is what hid this for months.

### The half the first fix missed

`20260907010000` added the INSERT policy. **The insert still failed**, with the same 42501 and the
same sentence about the new row violating a policy — while pointing at an insert that was by then
allowed.

The read was the half that failed:

```
.insert([...]).select("id, name").single()
                ^^^^^^^^^^^^^^^^ becomes RETURNING
```

PostgreSQL applies the **SELECT** policy to a row handed back by `RETURNING`. The only one was
`ws members read`, `using (is_workspace_member(id))`, and a workspace one microsecond old has no
membership row — the row that would make it true is written by the *next* statement, and it
references the workspace being inserted.

This is why it was hard to see. The same insert **succeeds** inside a `plpgsql` block, where
nothing is returned, and **fails** at the top level with `RETURNING`. Adding a `with check (true)`
INSERT policy did not help either, which is what finally ruled the insert out as the culprit.

`20260908010000` adds `ws owner reads own`, `for select`, `using (owner_id = auth.uid())`. An owner
reading the workspace they own is correct on its own terms, and it makes a workspace whose
membership row is missing **recoverable** instead of invisible.

**Verified:** both policies applied and confirmed in `pg_policy`; the whole path probed end to end
under `set local role authenticated` with a real uid — workspace inserted and returned, membership
written, read back with its membership, slug generated. Every probe ran in a transaction and was
rolled back. Then walked live: **"A2 arrival check is ready."**

---

## 2. What the walk found the moment the wall came down

The new workspace opened, and Start showed **another workspace's ranked bets and its entire run
list**, under the new workspace's name in the switcher.

Two omissions, each sufficient alone:

- **The server.** `listRunsForStart` filtered on nothing but `status`; `listTopOpportunities`
  ordered every `opportunities` row by ICE and took twenty. Both leaned on RLS for scope. RLS
  scopes to every workspace a person *belongs to* — the right answer to "may they see this" and
  the wrong answer to **"whose desk is this"**.
- **The client.** Both `useQuery` keys named the page and not the workspace, so switching served
  the previous workspace's rows from cache under the new name.

Both are fixed, and both narrow **only when the workspace id resolves**: an id we cannot name must
not become an empty desk, because "you have nothing" is itself a claim.

> This is the shape of the whole packet. The wall was not hiding an empty state; it was hiding
> the fact that nothing behind it had ever been asked to name a workspace.

---

## 3. What an empty workspace was told about itself

Four things it said that it had not earned. All four are fixed.

### The strip that reproached the person for arriving

`Arriving.tsx` renders, on a workspace that has never been given anything to read:

> _0 findings this week from 0 sources · 0 clusters forming · none has crossed the bar yet_

Four counts and a verdict against a promotion bar the person has never seen or set. The file's own
header states the rule it broke: _"a strip reading '0 findings this week' over a product that has
never been given anything to read is a reproach rather than a fact."_ Its guard,
`if (!line) return null`, **could never fire** — clauses drop only on `null`, and `0` is not
`null`.

The August guard for this pinned the exact reproach sentence as correct behaviour.

**Now:** no sources *and* no signals says nothing at all. A quiet week over **connected** sources
still speaks, which is the case the principle was actually written for.

### The four signals and two opportunities nobody mentioned

Onboarding invented four signals and two opportunities about a product it had been told nothing
about, wrote them to the same tables real evidence lands in, and counted them back to the person as
their own. The project was named _"Example: Mobile App Roadmap"_.

The August guard held that the invented rows were **labelled** as examples. It now holds the
stronger and simpler property: **nothing invented is written at all.** Counts are zero because zero
is the number, and the project takes the workspace's name.

`seedWorkspaceFromContext` is untouched and must stay: it builds from what the **person** said
about their own product. That is the whole distinction — derived from their words, not invented
about a product we know nothing about.

### The three cards that pretended to be ranked work

The three _"Or start one of these"_ cards were hardcoded sentences rendered through the same card,
the same line and the same **Start it** as real ranked bets, all calling the same handler — which
starts a real run. Only the invisible `aria-label` differed.

So a new workspace's first offer was indistinguishable from work the product had ranked for it, and
pressing one filed a real run about a checkout, a sign-up form or an address step the person may not
have — spending a model budget reasoning about a feature nobody has.

**Now the verb is the difference**, because it is the only promise the card makes:

| | what it is | what pressing it does | its verb |
|---|---|---|---|
| a real bet | this workspace's own work, ranked from its own evidence | starts the run | **Start it** |
| an example | a sentence we wrote | loads it into the composer, selected, to be edited | **Use this sentence** |

The examples stay, because an empty workspace offering only a blank box teaches nothing. What they
must not do is pose as the workspace's own.

### A workspace its owner did not belong to

`createWorkspace` never wrote the owner's `workspace_members` row. Every other surface reads through
`is_workspace_member`, so the workspace was invisible to all of them. It now writes the row, and
**fails loudly** if it cannot: a workspace without its owner's membership is unreadable and
unfixable from any surface, since there is no screen that can add you to a workspace you cannot see.

---

## 4. The sample workspace, and why its door is not honest

P-33 asks that where the sample workspace is the right first thing to show, the door to it be made
honest. It is not, in four separate ways — each verified in source, none yet fixed.

1. **It is not a preview, it is a move.** _"Explore a sample workspace"_ makes the seeded workspace
   the person's **active** workspace and writes that id to `localStorage`
   (`use-workspace.tsx:175`), so every later visit lands there by default. The copy directly above
   the button says _"Yours stays empty."_ No return door is named anywhere in the receipt.
2. **The data is not labelled, though the copy promises it is.** The same sentence promises
   _"labelled example data"_. `seed_sample_workspace` inserts every theme, signal, opportunity and
   spec **with no `is_sample` column**, so it takes the `false` default and the product's own
   row-level Example marks never fire.
3. **The shell does not say where you are.** `ScopeMenu` renders `activeWorkspace.name` alone, with
   no sample tag. After the door moves someone, a workspace full of an invented company's decisions
   is indistinguishable from their own.
4. **Four comments claim otherwise.** `seed-workspace.server.ts:270`, `use-workspace.tsx:17-21`
   (_"so the shell can label it (a tag + a banner)"_), `_authenticated.tsx:174` and a migration all
   assert the shell renders a sample tag and banner. **No component or route reads the
   workspace-level `is_sample` flag at all.**

This is the largest remaining piece of the arrival, and it is the next thing to build.

---

## 5. Found by the audit, and all six now closed

Verified by an adversarial audit of the surfaces the live walk could not reach (each finding
refuted by an independent pass before being kept).

> **All six were fixed by the P-33 work that this section was written to queue, and this heading
> said "Not yet fixed" for a day after they were.** Re-checked against the source on 2026-09-03,
> one by one, before this note was written: `getStandingRecord` now filters by workspace
> (`brain-standing.functions.ts:165-172`); `RetentionLine` takes `recordIsEmpty`
> (`_authenticated.outcomes.tsx:1660`); both "Saved" buttons gate on `save.isSuccess`; the export
> line requires `closed.decisionsClosed > 0 || closed.prsShipped > 0` (`DataSection.tsx:287`);
> `ArtifactPane` reports a running station before it reports one that has never run
> (`ArtifactPane.tsx:2831`); and the source count is scoped and keyed by workspace
> (`ArtifactPane.tsx:2827-2837`).
>
> **A document that lists closed defects as open costs the next lane a re-investigation, which is
> exactly what the findings ledger exists to prevent.** Kept rather than deleted, because the
> evidence below is the record of what was wrong and each entry names the class it belonged to.

**Counts that belong to the person, printed as the workspace's.** `getStandingRecord` counts with
`.eq("user_id", userId)` and **no workspace filter**, while the list underneath it is
workspace-scoped. So an empty workspace can print _"A run has read 118 of these back · 587 recalls
on the record"_ directly above _"Nothing learned yet."_ The same number gates
`recordIsBlank`, so on a genuinely empty workspace the designed zero state — _"How the first thing
gets onto the record"_ — **never fires**, and the page stacks four consecutive admissions instead.
This is the same defect class as §2, in a second place.

**A record that is expiring before it exists.** `RetentionLine` is mounted unconditionally and is
the one region the zero-state collapse does not stand down, so it sits under _"Nothing is on the
record yet."_ and warns that a record the person does not have fades in 30 days.

**Two buttons that claim a save that never happened.** The brief and notifications panes both rest
at the label **"Saved"** when `dirty` is false — directly under headings that have just said
_"Nothing set"_ and _"Nobody has changed any of these."_

**Zeros boasted as receipts.** The export line reads _"including the 0 decisions closed and 0 pull
requests shipped here"_, because `getValueReceipts` returns an object of zeros and an object of
zeros is truthy, making the fallback written for exactly this case unreachable.

**A station that says it has not run while it is running.** `driven_at` is stamped only on the
driver's *exit* paths, so for the whole first leg the right pane says _"Discover has not run yet"_
at the same moment the left pane says _"Scout is working."_ Beside it, a region titled _"What it
has made"_ instructs the person to _"press an artifact in the record beside this"_ when the record
beside it says nothing is recorded yet — the exact failure that file's own comment forbids three
lines above.

**The one remedy, withheld at the one moment.** The count deciding whether an empty workspace is
offered a source to connect is taken with **no workspace filter** and cached under a
workspace-free key, so a member of any other workspace with targets resolves to `sources-exist` and
the empty workspace is offered nothing.

---

## 6. What the arrival is actually made of

One sentence, because it is the thing to keep:

> **Every defect here is the same defect.** A number was printed because it could be computed, not
> because it had been measured; a claim was made because a template had a slot, not because
> anything had happened. The empty workspace is where the difference between *computed* and
> *measured* stops being philosophical, because every single one of those numbers is zero and every
> template slot is empty — and a product that fills them anyway is telling the person, in its first
> thirty seconds, that it will say things it does not know.

`0` and "we have not looked" are different facts. A strip, a count, a heading or a button that
prints the first for the second has not been designed for the state that decides whether it is
trusted.

---

## Provenance

- **Walked live** on `supaprod.ai`: workspace creation, Start, the switcher, Settings → About your
  company. Screenshot-free by repo rule.
- **Probed** against production Postgres for §1, every write inside a rolled-back transaction.
- **Audited in source** for §4 and §5, by an adversarially-verified pass (38 agents; every finding
  independently refuted before being kept). §5 is deliberately listed with file-level evidence
  rather than fixed, so the next packet has somewhere to start.
