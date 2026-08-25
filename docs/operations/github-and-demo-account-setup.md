# Getting Supaprod demo-ready: GitHub, accounts, and what an accelerator sees

> _Written 2026-08-25 by MAIN LANE, from live measurement. Every number here has
> its query beside it._

## The short version

**Demo from `harbor@supaprod.ai`.** It is the only account that is both
unsuspended and has anything connected. Do not demo from `demo@redcadence.app` or
`demo2@redcadence.app` — **both are suspended** — and be aware that the six other
`@supaprod.ai` accounts have **no integrations at all**.

## What is actually true today

```sql
SELECT u.email, p.suspended,
  (SELECT count(*) FROM connections c WHERE c.user_id=u.id) AS all_conns,
  (SELECT string_agg(b.resource_id,', ') FROM connection_bindings b
     JOIN workspaces w ON w.id=b.workspace_id
    WHERE w.owner_id=u.id AND b.provider ILIKE '%github%') AS repo
FROM auth.users u LEFT JOIN profiles p ON p.id=u.id;
```

| Account | Suspended | Connections | GitHub repo bound |
| --- | --- | --- | --- |
| `demo@redcadence.app` | **yes** | 1 | — |
| `demo2@redcadence.app` | **yes** | 0 | — |
| **`harbor@supaprod.ai`** | no | **1** | `RohitGajaraj/relay-homeowner-app` |
| `compass@` · `explore@` · `lantern@` · `meridian@` · `voyage@` · `ember@` | no | **0** | — |

**Two consequences worth stating plainly.**

1. **An accelerator signing in as `explore@` (YC's), `compass@` (Betaworks) or
   `lantern@` (Campus Founders) sees an Integrations page with nothing connected.**
   Not just GitHub — nothing.
2. **The autonomous loop has been running in a workspace owned by a suspended
   account.** `0b792d52` ("My workspace") belongs to `demo2@`, which has **zero**
   GitHub connections, so `resolveGitHub` falls past the workspace binding and past
   the user connection to the legacy `GITHUB_REPO` env var — which is why every
   Build failure reads `GitHub 401 on /repos/RohitGajaraj/Test-Project-Cadence`.
   **All nine of those 401s carry `user_id = 22a73000` (demo2). Not one repo call
   has ever been made as `harbor@`.**

So the 401 is demo2's fallback path failing. **Whether harbor's own GitHub
connection works is untested** — it has never been exercised. Both connections
point at the same App installation (`142608030`), so if that installation was
removed from GitHub, harbor's is dead too; if it is still installed, harbor's may
be fine and only demo2 was ever broken.

## Step 1 — the ten-second check that decides everything else

Sign in as `harbor@supaprod.ai` (password in `demo-credentials.md:82`; the "STALE
PASSWORDS" banner in that file is **wrong** for the `@supaprod.ai` accounts — see
its own section below) and open **`/integrations`**.

- **If it says _"GitHub setup pending. An admin must register the GitHub App and
  set `GITHUB_APP_ID` and `GITHUB_APP_SLUG`"_** → the server env vars are missing.
  **Nothing else can work until those are set in Lovable**, and no amount of repo
  or install work helps. This is the first thing to fix.
- **If GitHub appears with a Connect / Reconfigure control** → the App is
  registered and you only need to install it on a repo. Go to step 2.

## Step 2 — install the app on a repo

`startGithubAppConnect` (`connections.functions.ts:297`) sends you to:

```
https://github.com/apps/<GITHUB_APP_SLUG>/installations/new?state=<signed>
```

Click **Connect** in the product rather than visiting that URL by hand — the
`state` is HMAC-signed and ties the install back to your user. Then:

1. Choose the account/org that owns the repo.
2. Grant it **only the repo you want the loop to build in.** A fresh empty repo is
   fine and is the safer choice for a demo.
3. Approve. GitHub redirects back and the connection is written.

## Step 3 — bind the repo to the workspace (the step that is easy to miss)

A connection alone is not enough. `resolveGitHub` resolves
**workspace binding → user connection → env**, and the binding is what NAMES the
repo. A workspace with no binding falls through to whatever `GITHUB_REPO` happens
to say — which is exactly how the live workspace ended up pointed at a repo nobody
uses.

**Tell MAIN once the connection exists and I will write the binding**, or use the
Connectors UI if it exposes a repo picker.

## Step 4 — prove it, do not assume it

The only real test is a run. Drive one track in that workspace as far as `build`
and read `tool_calls`:

```sql
SELECT created_at, tool_name, ok, left(coalesce(error,'(ok)'),120)
  FROM tool_calls WHERE tool_name LIKE 'repo.%'
 ORDER BY created_at DESC LIMIT 5;
```

An `ok = true` on `repo.tree` is proof. Anything else is not.

## What each account is for

| Account | Use it for |
| --- | --- |
| `harbor@` | **Rehearsal and agent testing.** Disposable, re-clonable, and the account any automated verification should use |
| `voyage@` · `meridian@` | Unassigned demo accounts — safe to burn approvals on |
| `compass@` | **Live with Betaworks AI Camp — do not touch** |
| `lantern@` | **Live with Campus Founders (decision 2026-08-28) — do not touch** |
| `explore@` | **The account YC holds — do not touch** |
| `demo@` / `demo2@` | **Suspended. Retired. Do not demo from these** |

## About the "STALE PASSWORDS" banner in `demo-credentials.md`

It is wrong for the seven `@supaprod.ai` accounts, and that was measured rather
than assumed:

- Each password was compared against the live `auth.users.encrypted_password`
  bcrypt hash via `extensions.crypt()`. **All seven matched** on 2026-08-25.
- `git show a71409d84` — the commit that added the banner — touched **only** that
  markdown file, +19/-1, and changed **no password value**, with no migration.
- Only four migrations ever write `encrypted_password`; the newest is
  `20260725120000`. Nothing rotates them after 2026-07-25.

The banner describes the `@redcadence.app` logins, which genuinely were rotated
and suspended.

## The one thing only you can do

Everything above except **step 1 and step 2** can be done from this side. The App
install needs your GitHub account, and the env vars need Lovable's dashboard.
Tell MAIN what `/integrations` says and the rest follows.
