# Settings IA — Account / Workspace / Personal rubric (WM-F7)

> _Created: 2026-06-22 · Last updated: 2026-07-07_

> Status · ✅ Rubric decided + documented 2026-06-22 (Lane 2). The Settings surface (`/settings`, `src/routes/_authenticated.settings.tsx`) is built + live-tested; this is the "clear rubric for where each setting lives" the WM-F7 row calls for, so a new setting always lands in the right scope and never drifts. · Owner: the tenancy lane

## The rubric (the one rule)

A setting belongs to exactly ONE of four scopes. Ask, in order:

1. **Does it follow the signed-in USER across every workspace and account?** (their identity, their personal credentials) → **Personal.**
2. **Is it the billing ENTITY — money, plan, or something shared across all the account's workspaces?** → **Account.**
3. **Is it config for the ACTIVE workspace — its brief, its people, its agents, its connectors, its data?** → **Workspace.**
4. **Is it platform-wide, read-only status?** → **System.**

The first "yes" wins. This mirrors the data model: a user has accounts; an account has workspaces; the active workspace is the working context (see [`../../src/hooks/use-workspace.tsx`](../../src/hooks/use-workspace.tsx) and the WM-F8b query-scope tiers in [`../../src/hooks/workspace-query-scope.ts`](../../src/hooks/workspace-query-scope.ts), which already split caches into user-global vs account-global vs workspace-scoped on the same lines).

## Where each current tab lives

The live Settings tabs (`TABS` in the settings route) map cleanly onto the rubric:

| Tab (id) | Scope | Why |
| --- | --- | --- |
| **Profile** (`profile`) | Personal | the user's identity; same in every workspace |
| **Models** (`ai`) | Personal | personal BYO model keys + model preferences (user-level, like `api-keys` / `mcp-tokens`) |
| **Accounts** (`connections`) | Account | account-level connected provider logins (connect once, use across the account's workspaces) |
| **Plan** (`billing`) | Account | the subscription — billing entity (moved to the account in WM-M2) |
| **Credits** (`credits`) | Account | credit balance / usage / top-ups — the account's spendable pool |
| **Workspace** (`workspace`) | Workspace | the active workspace's brief / mission / members / invites / roles |
| **Staff** (`staff`) | Workspace | the workspace's agent roster (agents carry `workspace_id` since WM-F1) |
| **Integrations** (`interop`) | Workspace | per-workspace connector resource bindings |
| **Data** (`data`) | Workspace | export / retention / right-to-be-forgotten for the active workspace's data |
| **Health** (`health`) | System | platform health / readiness, read-only, cross-cutting |

## Consequences (use this when adding a setting)

- **Account-global caches** (Accounts/Plan/Credits) must clear on a **cross-account** workspace switch but survive a same-account one — already enforced by `accountChangedOnSwitch` (WM-F8b).
- **Personal** settings never clear on any switch (`USER_GLOBAL_QUERY_KEY_ROOTS`).
- **Workspace** settings clear on every switch.
- A new tab/section names its scope here in the SAME change, so the rubric never rots.

## Deliberately NOT done (optional, design-pass)

The tabs are a single flat `TabRow` today (live-tested, working). VISUALLY grouping them under "Personal · Account · Workspace · System" headers is a presentation polish for the founder-prompted design pass — it does not change the rubric or any behavior, so it is intentionally left out of this scope per the velocity ruling (no speculative UI churn on a tested surface). The decision — where each setting lives — is made and recorded here, which is the WM-F7 deliverable.

## Design + first-class-object pass (2026-07-07)

A consumer/enterprise-grade functional + design audit of the Settings and `/sources` surfaces (the `settings_connections` pass) brought the connections and workspace-binding surfaces up to the design-anatomy bar without touching the (closed) monetization block:

- **Connected accounts (`AccountConnectionsSection`):** a connected provider card now shows its real recency (`VERIFIED 3H AGO` from `connections.last_verified_at`, or `SYNCED …` from `user_calendar_connections.last_sync_at`), via the shared `latestIso` + `relTimeCaps` helpers, so a live connection reads as a first-class object with a status pill AND a last-synced time. Cards with no timestamp yet keep their flow label (no invented time).
- **Workspace bindings (`WorkspaceBindingsSection`, rendered on `/sources` and summarized in Settings > Connections):** migrated off shadcn/Tailwind utility classes (`text-amber-400`, `text-emerald-500`, `bg-secondary/40`) and the ember-misusing `text-primary` onto Obsidian semantic tokens, matched to the rest of `/sources`. Each binding is now a first-class row: provider brand mark (`ProviderLogo`), a `Bound` / `Reconnect needed` status pill (moss / madder), the bound resource + account, a `bound <relTimeCaps>` recency, and a clear Unbind affordance, with proper skeleton / error-with-retry / not-connected states.
- **Product bindings (`ProductBindingsSection`):** the same ember-misuse (`text-primary`) and raw-Tailwind-hue (`text-emerald-500`) fixes.
- **OAuth-gated flows stay honestly parked.** No connect flow is faked. A provider whose founder-registered OAuth client env is absent (`GITHUB_APP_ID`/`GITHUB_APP_SLUG`, a gateway `clientIdEnv`, or `LOVABLE_API_KEY`) renders as a calm "coming soon"/"not configured" state (`AccountConnectionsSection.statusFor` + `ConnectorDetail`), never an implied Connect promise. See `docs/features/README.md` and `connections.functions.ts` `deriveProviderAvailability`.

Build note: [`planning/archive/build-log.md`](../planning/archive/build-log.md) §4 (2026-07-07 entry).
