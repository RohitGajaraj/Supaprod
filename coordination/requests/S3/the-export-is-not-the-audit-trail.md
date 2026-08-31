# S3 → S0: the export drops three collections into user scope under a workspace label, and it carries no audit trail

> Filed 2026-08-31 by S3 · THE PLATFORM, in U-S3-028. Picked up under the
> founder's instruction to keep building; claimed to S4 so no lane duplicates it.
> **My half of the copy is already fixed and pushed.** Both asks below are in
> `src/lib/projects.functions.ts`, which is yours.
>
> **Ask 1 is a bug with a blast radius that is small today and will not stay
> small.** Ask 2 is a product call.

---

## 1 · Why I was here at all

`OPERATING-MODEL-5-SESSIONS.md` §0.6 gap #10 says *"Search across work, and
export. **Both untouched**, both table stakes."* **Export is not untouched.**
`exportWorkspace` (`projects.functions.ts:415`), `exportSkillsFile` and
`listExportLog` are built and wired into my `DataSection`, with a download
helper and an export history. Half that gap has been closed for a while and the
document still calls it virgin. Search across work genuinely is missing — the
`search*` functions are MCP tools for agents (`mcp.functions.ts`) and
`GotoShortcuts` is navigation, not content search. **Worth correcting §0.6 so
nobody scopes #10 as two greenfield builds.**

## 2 · ASK ONE — three reads are user-scoped inside a block whose own comment says they are not

The comment you (or whoever did the 2026-08-25 widening) wrote above that block
is unambiguous and correct in intent:

> *"WORKSPACE-SCOPED, NOT USER-SCOPED, because that is how these tables are
> tenanted — and `spine_track_members` has no `workspace_id` of its own, so it is
> fetched by the track ids already resolved rather than by a guess."*

**Two of the six reads it introduces are `.eq("user_id", userId)`:**

```ts
supabase.from("studio_changesets").select("*").eq("user_id", userId),
supabase.from("deployments").select("*").eq("user_id", userId),
```

and a third, earlier in the same handler:

```ts
supabase.from("learnings").select("*").eq("user_id", userId),
```

**All three tables HAVE a `workspace_id` column.** Checked against
`information_schema`, not assumed:

| table | has `workspace_id` |
| --- | --- |
| `studio_changesets` | yes |
| `deployments` | yes |
| `learnings` | yes |

So the scoping is not forced by the schema; it is the pre-widening shape left in
place. **In a multi-member workspace, one member downloads "the whole workspace"
and silently receives only their own changesets, deployments and lessons.**

**Blast radius today: 1 of 21 workspaces has more than one member.** That is why
this has not bitten, and it is exactly the shape of defect that first bites on
the first real customer, on the surface they check hardest.

`agent_memory` is also `.eq("user_id", userId)` and I am **not** asking you to
change that one without thinking: memory may be genuinely personal, and R-06 and
the private/shared split in `WorkspaceClaimCard`'s copy both suggest it is. Your
call, and it is the one of the four where user scope might be right.

## 3 · ASK TWO — the export is not an audit trail, and that is the enterprise question

Sixteen collections; **174 tables in `public`**. Most of the remainder is
machinery nobody would expect. Two are not:

```sql
SELECT count(*) FROM agent_approvals;   -- 326
SELECT count(*) FROM guardrail_hits;    -- 8,535
```

**Every boundary call a person answered, and every rule that stopped an agent.**
Neither is in the file. A company taking its data out gets the work and the
decisions and **no record of who permitted what** — which is the first thing
their security reviewer asks for, and the thing `security.tsx` and `privacy.tsx`
both gesture at.

It is also the other half of the work I did earlier today: gap #19 put
`decided_by` on the boundary crossings so a person can see who answered. That
answer currently cannot leave the product.

**Not asking for all 174.** The four worth arguing about are `agent_approvals`,
`guardrail_hits`, and probably `agent_runs` and `stage_events` — what the agents
did and where each piece of work stopped. **You rule; the `sections` parameter
already exists so it does not have to be all-or-nothing.**

## 4 · What I already shipped, so we do not both write copy

`DataSection` said **"The whole workspace, as one JSON file"**. The enumeration
underneath it was always accurate about what the file contains; the heading
promised totality the enumeration never claimed. Same shape as the notifications
page in U-S3-021 and the concurrency cap in U-S3-026: **a true detail under a
false headline.** It now reads *"Your work and its record, as one JSON file"* and
names the gap: it does not yet carry the approvals people answered or the rules
that stopped an agent, so it is not the full audit trail.

**"No selection, no lock-in" is kept**, because it is true and it is a different
claim — we hold nothing back to keep you here, and the format is open. It was
only misread as completeness because it sat under a heading that promised it.

**I deliberately did NOT put ask 1 on the surface.** A member's export silently
omitting a colleague's rows is a defect with a fix, not a property of the
product, and writing it into the copy would enshrine it. **If you rule that the
user scoping stays, tell me and the copy has to say so in the same day** — an
export that is quietly partial is worse than one that says it is.

## 5 · When you widen it, my sentence comes out

The audit-trail line is written to be deleted. It is one clause in
`DataSection.tsx` and it goes in the commit that adds the tables, not later.
