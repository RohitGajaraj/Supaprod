# The admin surfaces: controls that render, fire, and change nothing

> _Created: 2026-08-14 · Last updated: 2026-08-14_

> _Audit pass, 2026-08-14. Raw output, saved as it finished._

**The pattern across all eleven admin tabs: the controls are not broken, they are disconnected.** Each one renders, calls a real server function, writes a real row, shows a receipt, and changes nothing about how the product behaves. An operator using this console believes they have acted.

No dead links anywhere: all 11 tabs resolve to real routes. The gate is render-time only, which is defensible because every RPC re-checks `has_role` server-side.

## P0 — inert controls

**1. "Block sign-in" does not block sign-in.** `people.tsx:573` → `admin_set_user_suspended` sets `profiles.suspended`. **Nothing reads that column** — not the auth middleware, not `login.tsx`, not `_authenticated.tsx`, no migration. The receipt says *"They cannot start a new session."* The account keeps signing in, and the row then shows a `sign-in blocked` badge in fail tone reporting a block that is not happening.

**2. "Put them on a different plan" writes a column nobody reads.** `people.tsx:616` writes `subscriptions.plan_override_tier`. Runtime entitlements resolve from `workspaces.plan_tier` / `accounts.plan_tier`. **`plan_override_tier` has no reader in `src/` or in any migration** except this page displaying back what it wrote. "Clear the override" is the same no-op. Voucher redemption writes the same dead column.

**3. The entire Invitations panel is inert.** The label says "emails link" and the toast says "Invitation sent"; `adminCreateInvitation` only inserts a row. **No email is sent** — `sendInviteEmail` has exactly one caller and it is the Settings path, not this one. The token it mints is **unredeemable**: its only reader `get_invitation_by_token` is called from nowhere, and signup accepts a different table entirely. A row here can never reach `accepted`; only a cron expires it.

**4. "Add domain, auto-accepts signups" changes no signup behaviour.** `auto_approve_domains` is touched only by its own admin CRUD. No signup path consults it. Its empty state — *"All signups go to manual review"* — is false in both halves: nothing auto-approves, and there is no manual-review path either.

**5. Workspace "Credits" is a hardcoded zero rendered in red.** `admin_search_workspaces` selects **`0::bigint` as balance_credits`**. Every workspace on the platform reads 0, in fail tone, under the copy "At zero, its runs stop." The file header asserts the opposite and is wrong.

**6. The memory-expiry switch can never move.** `admin_set_memory_expiry_enabled` writes an audit row with `target_kind='app_settings'`, which is **not in the CHECK constraint**. The violation aborts the function, so the `app_settings` upsert two lines above **rolls back with it**. The operator gets a raw Postgres constraint message where the page promised a boundary.

**7. The observability toggle has the identical defect, and a larger blast radius.** Same illegal `target_kind`. So `observability_enabled()` stays at its seeded `false`, `observabilityGateOn()` is permanently false, and every vendor call no-ops. **PostHog, Sentry and Better Stack can never receive anything, keys or no keys.**

**8. The system banner is written and read by nobody.** The only consumers of `getActiveBanner` are the two admin pages themselves. Nothing in `_authenticated.tsx` reads `system_banner`. So *"A notice sits above every screen for every signed-in person"* and the toast *"Everyone sees it now."* are both false. An operator publishes an outage notice and no user sees it.

**9. The materialized views behind Spend and Proof are never refreshed.** `refresh_observability_mvs()` has **zero callers** — no cron, no code, and no entry in `EXPECTED_JOBS`, so the watchdog is structurally blind to it. On a new instance the views are populated empty at CREATE and never again. On this instance every figure is frozen at 2026-07-11. The page claims *"recomputed overnight, so if this series stops moving, the nightly job has stopped and Health says so."* Health cannot say so.

**10. The routing console's only two controls are write-only.** `setSurfacePin` writes a flag whose only reader is the same file's own table read. The chokepoint still resolves through `capability.ts`. To the file's credit it says so out loud, but this is a whole admin tab whose entire action surface is inert.

## P1

- **The production deploy leaves no audit row.** `build.functions.ts:1244` inserts into `admin_audit_log` with `admin_id`, `target_id`, `meta` — the table has `actor_user_id`, `target_kind` (NOT NULL), `payload`. Two columns do not exist, one NOT NULL is missing, and the result is never error-checked. The insert fails on every deploy. The only irreversible action on the page is the one action that never reaches the ledger below it.
- **The feature-flag form is write-only for every key but one.** The only runtime reader of `feature_flags` is `supersessionEnabled`, for a single hardcoded key. Any key an operator invents is persisted, rendered with a working-looking switch, and consulted by nothing, while the toast says "Saved. It applies to everyone from now."
- **"Closed by a result" on Spend is the supersession rate, which means the opposite.** It counts decisions the loop *revised*. `/admin/proof` labels the same source correctly. On Spend, high churn reads as a good outcome.
- **`getActiveBanner` swallows its error**, so the index can print "Nothing else needs you" on a failed read — precisely what the file header says the page exists to refuse.
- **Pending signup approvals is a queue with no writer.** Nothing inserts into `signup_approvals`. "Approve, grants access" only flips a state column; it grants nothing.
- **Demo reset cannot succeed**, for two independent reasons: it gates on `profiles.plan_tier = 'admin'`, which no migration ever sets, and it inserts audit columns that do not exist.
- **The mint form performs the clamp its own comment says it refuses.** The Mint button is an `onClick` on a plain `div` with no `form`, so `min={1}` is never enforced; a typed `0` becomes unlimited uses and an unparseable date becomes never-expires.

## P2

Reason strings always sent empty so every audit row reads "No detail recorded" · `auditDetail` reads payload keys the RPCs never write, so ownership transfer always renders blank · counts printed against a hard `.limit(100)` · comment drift (three files disagree on the tab count).

## Zod-strip check

**None found.** Every admin server function uses an identity validator, so nothing is silently dropped. The one hand-rolled validator rewrites rather than strips, and is covered above.
