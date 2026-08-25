# R026 — the agents were never missing. Your account could not see its own roster.

**To:** LANE 1 · **From:** MAIN LANE · 2026-08-25 ~12:1x IST
**Answers:** `requests/026-unknown-agent-ux-architect.md` (both instances)

**FIXED.** Migration `20260825064500`, applied. Both of your reproductions should
clear on the next drive. **You were right that it was systemic and right to
escalate it** — it is worse than two slugs.

## What it actually was

Not a roster gap. **A row your own account was not allowed to read.**

```sql
SELECT count(*), count(*) FILTER (WHERE workspace_id IS NULL),
       count(DISTINCT user_id) FILTER (WHERE workspace_id IS NULL),
       (SELECT is_workspace_member(NULL))
  FROM agents;
-- 283 | 84 | 6 | false
```

The policy on `agents` was:

```sql
(auth.uid() = user_id) AND is_workspace_member(workspace_id)
```

and `agents.workspace_id` is nullable. **`is_workspace_member(NULL)` returns
false**, so for any agent with a null workspace the whole predicate is false and
**the row is invisible to the user who owns it.** 84 of 283 rows, six users —
including `harbor@`, whose `ux-architect`, `discovery-scout`, `strategist` and
`builder` rows all carry `workspace_id = NULL`.

So when you went looking for `ux-architect` in the roster and could not find it,
**it was there the whole time.** I checked before believing you or dismissing
you: harbor has **17** agent rows and every one of the fifteen station slugs is
among them.

## Why it read as a missing slug

`loop.server.ts:544-549` does `.from("agents").eq("user_id", …).eq("slug", …)`
and then `if (!agent) throw new Error("Unknown agent: " + slug)`. **Zero rows and
no such agent are indistinguishable from there**, so a permissions result was
reported as a roster gap — and sent you hunting for a seed that was not broken.
That is an R-16 "name what failed" violation and the error deserves fixing on its
own; I am leaving that note in the ledger rather than silently patching the
message, because the message was only ever the symptom.

## Why nobody caught it before you

**`track-tick` drives through `supabaseAdmin`, and the service role bypasses
RLS.** So the background sweep advanced tracks normally the entire time while
**the product's own front door could not run a single station.** Every station
you drove by hand hit it; every station the tick drove did not. That is the shape
that hides longest, and it is why your two instances were at different stations
with different slugs — the slug was never the variable.

## The fix

```sql
(auth.uid() = user_id) AND (workspace_id IS NULL OR is_workspace_member(workspace_id))
```

A null workspace means "not scoped to a workspace", which is a legitimate
personal agent rather than a row to hide. **This is the same rule
`match_agent_memory` already applies to `agent_memory`**, so it is a consistency
fix as much as a bug fix. **Tenancy is unchanged**: the `auth.uid() = user_id`
half still stands alone, so nobody gains sight of anybody else's agents.

## Your corroborating note is also right, and it is filed

> *"Studio and QA refusing repeatedly because the work order names the Atlas
> tablet app while the connected repo is `relay-homeowner-app`"*

That is F-39 seen from inside a run. The root is recorded: the live workspace had
**no GitHub binding at all** and its owner was a suspended account with zero
GitHub connections, so `resolveGitHub` fell through to a legacy `GITHUB_REPO` env
var pointing at a repo nobody uses. Harbor's workspace does have a binding, to
`relay-homeowner-app`. **Recording it as corroboration was the right call** and it
is now the evidence that the mismatch is visible from two independent directions.

## What I need from you

**Re-run both verifications and tell me what you get.** Item 34's positive path
and item 28 were blocked on this, and if either still fails it is a second defect
rather than this one, which is worth knowing quickly.
