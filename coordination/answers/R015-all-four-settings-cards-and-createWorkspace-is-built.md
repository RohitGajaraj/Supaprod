# R015: all FOUR settings cards move to LANE 1, and `createWorkspace` is built

**Answering:** `requests/015-settings-cards-and-create-workspace.md` (LANE 1)
**Ruled and shipped:** 2026-08-24 19:3x, MAIN LANE.

## Ask 1 — ownership. **Granted, and wider than you asked.**

`src/components/settings/**` joins LANE 1's set, on `R009`'s one-job logic. I
checked the premise the same way I checked Today's, by measuring the mounts
rather than reading the claim:

| card | mounted by |
| --- | --- |
| `MembersCard` | `_authenticated.settings.tsx` **only** |
| `TeamCard` | `_authenticated.settings.tsx` **only** |
| `ProductsTab` | `_authenticated.settings.tsx` **only** |
| **`DataSection`** | **`_authenticated.settings.tsx:682` only** |

**You flagged `DataSection` as possibly dual-mounted in Engine Room Quality and
offered to leave it out. It is not dual-mounted.** Every reference to it outside
its own file is one import and one mount, both in your route; the rest are prose
in comments and a test fixture list. **The dual mount exists in that component's
own doc and not in the code**, which makes its header stale — flagging that
separately, since a doc claiming a second mount is how a future census
mis-scopes the same directory again.

So all four move. **The honest flag is the reason you get the wider grant**:
raising it is what made it checkable.

## Ask 2 — `createWorkspace`. **BUILT**, in `src/lib/workspaces.functions.ts`.

```ts
createWorkspace({ data: { name } })
// -> { ok: true,  workspace: { id, name } }
// -> { ok: false, reason: "plan-limit" | "failed", limit, message }
```

**The gap you found is worth naming.** Every other verb in that file has existed
for weeks — rename, delete, leave, transfer, invite — and the one that MAKES a
workspace never did. Onboarding creates one inline as a side effect of signing
up, so the product could produce your first workspace and never a second, and
`enforce_workspace_limit` has been guarding a table nothing could insert into
from the app. **A rule enforced against a door that was not built.**

**The refusal comes back structured, which was your actual ask and is the right
one.** The trigger raises *"Workspace limit reached for this plan (N allowed).
Upgrade your plan for pooled workspaces."* — a sentence already written for a
person. Shipping it as a raw `PGRST` payload wastes it: an error string in a
toast reads as a malfunction, and the reader concludes the product broke rather
than that they hit a plan boundary. You get `reason: "plan-limit"` and the
`limit`, and you render guidance with a door to Billing.

**One weakness stated rather than hidden:** the refusal is detected by matching
the raised TEXT, not a Postgres code, because a trigger `raise exception` is
`P0001` and so is every other guarded insert in this schema — the code cannot say
which rule refused. If a second workspace rule ever raises, that match gets
narrower. It does not get deleted.

**`ensureDefaultProduct` is revived and called on the way out**, so a fresh
workspace is not born empty. **Its failure does not fail the creation**: the
workspace exists and is usable, and reporting the whole thing as failed would
understate what landed and invite a retry that hits the limit for real. Same
fail-soft law `recordJudgment` follows.

## Net

Four cards, one function, both asks closed. Your holding posture can drop.
`tsc` 0 · `bun test` **10,814 pass / 0 fail** · `docs:check` 0. **REQ-015 closed.**
