# S4-021 · F-101's second defect is not one bad row — the surface is built to hide the owner

> _Verified 2026-08-26 by S4 on `lane/proof` at the merged tree `8753765dd` (origin/main
> `071b81710`). Static, no database — every claim below is a file and a line you can open._

## The claim being tested

F-101 (`0f48365b8`) reports, as a defect independent of the GitHub 401:

> *"that binding's `resource_label` reads `RohitGajaraj/helio-prism-build` while its `resource_id`
> is `Supaprod/relay-homeowner-app`. The screen and the record disagree. Anyone reading the
> connector surface is told the build targets a repo it does not target, and that survives the 401
> being fixed."*

**CONFIRMED — and the reproduction is wider than the row.** F-101 reads as one stale value on one
binding. It is a property of the display and of the write path, and it will keep producing the same
class of lie on rows that are not stale at all.

## 1 · The label wins at every render site, and the id is never shown beside it

Four sites, all `resource_label ?? resource_id`. The `??` means the id appears **only when the
label is null** — so wherever a label exists, the true resource is not on screen anywhere:

| File | Line | Rendered |
| --- | --- | --- |
| `src/components/connections/ProductBindingsSection.tsx` | 168 | `{binding.resource_label ?? binding.resource_id} · overrides the workspace default` |
| `src/components/connections/AccountConnectionsSection.tsx` | 512 | `reads {b.resource_label ?? b.resource_id}` |
| `src/components/connections/AccountConnectionsSection.tsx` | 1123 | `lead={b.resource_label ?? b.resource_id}` |
| `src/components/connections/WorkspaceBindingsSection.tsx` | 130 | `{binding.resource_label ?? binding.resource_id}` |

`AccountConnectionsSection.tsx:1125-1128` states the intent in its own comment — *"The registry's
own word for this resource … never the stored key."* Hiding the key is deliberate. That is a
reasonable instinct for a human-readable label and it is the exact mechanism by which the screen
can be confidently wrong.

## 2 · Nothing ties the label to the id — the validator permits any string

`src/lib/connections.functions.ts:760-762`:

```ts
resourceKind: z.string().min(1).max(60),
resourceId:   z.string().min(1).max(300),
resourceLabel: z.string().min(1).max(300).optional(),
```

`resourceLabel` is free text with no relation to `resourceId`. Every write site sets the two from
two separate caller-supplied fields in the same statement and validates neither against the other —
`connections.functions.ts:794-795, 813-814, 883-884, 902-903` and
`connectors/product-binding.functions.ts:187-188, 207-208`. **There is no code path anywhere in the
repo that could ever bring a wrong label back into agreement with its id**, because no reader
compares them and no writer derives one from the other.

## 3 · Even the correct path writes a label that hides the owner, on purpose

`src/lib/connectors/product-binding.functions.ts:319-331`, the auto-bind after a repo is created:

```ts
const resourceId = `${repoRef.owner}/${repoRef.repo}`;
…
resource_id: resourceId,
resource_label: repoRef.repo,
```

The id carries `owner/repo`; the label carries **`repo` alone**. So on a binding created by the
product's own happy path, the surface renders the bare repo name and drops the owner — and the
owner is precisely the field that separates `RohitGajaraj/helio-prism-build` from
`Supaprod/relay-homeowner-app`. **A person reading the connector surface cannot tell which
organisation's repository the build targets. Not for the stale row: for any row.**

This is the answer to "is anything on screen theatre" in its quietest form. Nothing here is
fabricated and no timer is involved. The surface simply shows a string that no invariant ties to
the thing it names, in preference to the string that does.

## 4 · What would fix it, stated so the owner can judge the cost

Not mine to build (S3 owns `connections/**`), and named only so the verdict is actionable: render
the id as the fact and the label as the annotation — `lead={resource_id}` with the label as `sub` —
or, at minimum, stop dropping the owner at `product-binding.functions.ts:328` by writing
`resource_label: resourceId`. The second is one line and removes the whole class.

## 5 · A second thing I found while reading, which I could not settle without the database

`product-binding.functions.ts:319-331` calls `.upsert({...}, { ignoreDuplicates: false })` with
**no `onConflict` target**, while `connection_bindings`' uniqueness is enforced entirely by
*partial* unique indexes on other columns:

- `connection_bindings_ws_provider_kind_key (workspace_id, provider, resource_kind) WHERE product_id IS NULL`
  — `supabase/migrations/20260612080000_f_conn_connector_platform.sql:81-83`
- `connection_bindings_ws_product_provider_kind_uq (workspace_id, product_id, provider, resource_kind) WHERE product_id IS NOT NULL`
  — `supabase/migrations/20260611205118_681cf70c…sql:58-60`
- `connection_bindings_product_provider_kind_key (product_id, provider, resource_kind) WHERE product_id IS NOT NULL`
  — `supabase/migrations/20260626240000_byo_p1b_product_binding.sql:35-37`

PostgREST defaults the conflict target to the primary key. No `id` is supplied, so a fresh id is
generated and the `ON CONFLICT (id)` arm can never fire — which means the intended
"update the binding that is already there" is not the statement being executed, and a second
`createRepo` for the same product should meet a unique violation on a partial index instead. With
`.throwOnError()` that reaches the caller as a raw error.

**I am not claiming this as a defect.** It is a reading of PostgREST's conflict-target default that
I cannot execute here, and R-11 cuts both ways: an unverified mechanism from me is worth no more
than an unverified mechanism from a builder. **The narrowest reproduction, for whoever holds the
database:** call `createRepo` twice for the same `(workspace_id, product_id, provider='github',
resource_kind='repo')` and record whether the second call updates the row or raises
`23505 unique_violation`.

## Verdict

**CONFIRMED, and widened.** F-101's second defect is real, and it is not a stale row — it is the
display rule (`label ?? id`, four sites) plus an unconstrained label plus a happy path that writes
the owner out of the label. Severity: **misleads**, at the one surface whose entire job is to say
what the machine is pointed at. It survives the 401 being fixed, exactly as F-101 said, and it also
survives the stale row being corrected, which F-101 did not say.

**Open, and honestly open:** §5 above needs a database to settle and I have none — see
`coordination/requests/S4/no-database-and-no-env-on-this-machine.md`.
