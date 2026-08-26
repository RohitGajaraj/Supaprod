# S4-055 · The field exists so the shell can label demo data. The shell does not label it.

> _S4, 2026-08-27, live database plus code, read only. **My first read of this was wrong and the data
> corrected it before I wrote it up.** Both versions are here, because the wrong one is the tempting
> one._

## What I thought I had, and why it was wrong

Thirteen workspaces hold open tracks, and **seven of them are named "Helio Labs"** (six
`is_sample = true`, one real). Two more are both named "Sample workspace". My first inference was a
workspace picker showing "Helio Labs" seven times with no way to tell them apart.

**The data says no.** Checking which workspaces any single user can actually see:

```sql
SELECT m.user_id, count(*), string_agg(w.name || CASE WHEN w.is_sample THEN ' [sample]' ELSE ' [real]' END, ' | ')
FROM workspace_members m JOIN workspaces w ON w.id = m.workspace_id
GROUP BY m.user_id HAVING count(*) > 1;
```

| user | what the menu shows |
| --- | --- |
| `22a73000…` | `Explore workspace [sample] \| Helio Labs [sample] \| My workspace [real]` |
| `45a746ff…` | `Demo workspace [sample] \| Helio Labs [sample] \| My Workspace [real]` |
| `9e7958c5…` | `Helio Labs [sample] \| Sample sandbox [sample]` |

**Nobody sees more than one "Helio Labs".** The duplicate names are spread across separate owners, so
the collision I expected is not live. **Recorded so nobody re-derives it from the workspace table and
reaches the same wrong conclusion I did.**

## The finding that IS there

**Every user with more than one workspace has demo data in their menu, and nothing says so.**

`ScopeMenu.tsx:132-147` renders exactly one thing per workspace:

```tsx
{workspaces.map((w) => (
  <button … >
    {w.name}
  </button>
))}
```

No tag, no grouping, no distinction. And **the field to do it with is already on the client.**
`use-workspace.tsx:17-21` carries it, with a comment that states the intent outright:

> *"Sample-data honesty: true for the rich seeded 'Sample workspace' **so the shell can label it
> (a tag + a banner)**."*

**The tag and the banner were designed, the field was plumbed through to the component, and the
render omits both.** That is not a missing feature. It is a finished feature that stops one line
short.

For two of the three users, **two of their three workspaces are demo**. For the third, **both are**,
so that person has no real workspace at all and nothing on screen distinguishes what they are looking
at from their own work.

## Why this belongs in the premium queue rather than a backlog

A person cannot tell demo data from their own. Everything downstream inherits that: a count, a
verdict, a track, a learning. **This is the same class as the theatre findings** and arguably worse,
because theatre shows a state that is not real while this shows real state from a workspace the
person did not realise was a fixture.

It also touches the honesty item in the canon's own definition of premium: *"nothing on screen that
the data cannot prove"*, and the data here can prove it. It is right there in the row.

**Frontier check:** no product at the named bar ships a workspace switcher that mixes demo and real
without a mark. Linear labels a demo workspace. So does Notion, so does Figma.

## The fix, which is one line and already scoped

`ScopeMenu.tsx`, inside the existing `.map`:

```tsx
{w.name}
{w.is_sample ? <span className="…">Sample</span> : null}
```

The comment in `use-workspace.tsx` also promises a **banner**, which is a larger call and S3's to make.
The tag is the part that stops a person mistaking a fixture for their own work, and it costs a line.

## Verdict

**CONFIRMED, and smaller than my first draft.** Not a duplicate-name collision, which the data
refutes. It is that `is_sample` reaches the client specifically to be shown and is not shown, on a
menu where two of three entries are typically demo.

**Owner: S3** (`src/components/shell/**`). I have changed nothing.
