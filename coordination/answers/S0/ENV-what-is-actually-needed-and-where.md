# The env values: two were on this machine all along, one is genuinely missing

> Written 2026-08-26 by S0. **Corrected twice by the founder, and both corrections were right.**
> First: Supabase is managed by Lovable, not by us. Second: there IS a local `.env` — I had only
> searched the conductor worktrees, and it lives in the main checkout.

## What was actually wrong with my ask

I escalated three values to the founder. **Two of them were sitting on this machine**, in
`/Users/rohitgajaraj/Projects/My Projects/My Builds/Supaprod/.env`, which is gitignored and
therefore invisible to every worktree that was cloned rather than copied. I searched
`/Users/rohitgajaraj/conductor/**` and concluded "no `.env` anywhere". **The conclusion was true of
where I looked and false of the machine**, which is the same error shape as F-80 and F-84 — a
measurement reported as broader than its own scope.

Three lanes sat blocked on browser proof for hours because of it, and that is my failure, not theirs.

## Fixed, 2026-08-26

`.env` copied into every current-generation worktree that lacked one (v3, v4, v5). Verified:
`VITE_SUPABASE_PUBLISHABLE_KEY` present at 210 chars, and `git status` still cannot see the file —
`.gitignore:28` covers it, so **it can never be committed**.

| Value | State | Where it lives |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | **SET** | local `.env` (also derivable: `supabase/config.toml`) |
| `VITE_SUPABASE_PROJECT_ID` | **SET** | local `.env` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | **SET** (210 chars) | local `.env` — public by design, ships in every browser |
| `E2E_DEMO_PASSWORD` | **SET** (21 chars) | local `.env` — with `E2E_DEMO_EMAIL` beside it |
| **`RESEND_API_KEY`** | **ABSENT** | **belongs in Lovable project secrets, not here** |

**Archival worktrees (v1, v2, and the bare `supaprod/` set) were deliberately skipped.** Copying
credentials into stale trees nobody is working in is spread, not help.

## The one that is genuinely missing, and why it is the one worth doing

`RESEND_API_KEY` is **not a local value**. `.env.example` says it outright: *"Production only. Set
`RESEND_API_KEY` in the platform env so it reaches the worker."* `email.server.ts:26` reads it and
**no-ops silently without it** — every send returns `{sent: false, reason: "email delivery not
configured"}`. Putting it in a local `.env` would do nothing.

**It belongs in Lovable project secrets**, which `get_project_knowledge` names as the system of
record for secrets.

**What it unblocks:** gap #2, end to end. The column, the trigger and the dispatch all landed today.
The only thing between a finished track and a person's inbox is that key. S4's verdict S4-011 names
why it is the right next proof: *"it exercises the loop's last verb without pressing anything into
production."* **It is the cheapest end-to-end test this product has.**

## What I am still NOT asking for

The **service-role key** and a **Supabase personal access token**. Neither is needed: the first
bypasses RLS and must stay a Lovable secret, and the second is for the Supabase MCP, which I do not
use — I reach the database through Lovable, which is correct given Lovable owns it.

## For the migration off Lovable

The founder's stated plan is that the app and its database eventually come to us. **This table is
the list of what has to move**, and the local-vs-platform split above is the seam that will need
rethinking: today "platform env" means Lovable's worker and nothing else.
