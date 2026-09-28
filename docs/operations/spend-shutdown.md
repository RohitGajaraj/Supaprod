# Stopping the spend: every recurring cost on a product with no users

> _Created: 2026-09-28 · Last updated: 2026-09-28_

**Why this exists.** [R-42](../../the-first-run/RULINGS.md) stopped Supaprod product work on
2026-09-23 and left the scheduled fleet running. [R-43](../../the-first-run/RULINGS.md) stopped the
fleet on 2026-09-28, and the founder then asked the wider question: **is anything else in this
project still spending money?** This is the complete answer, and it is a checklist rather than an
essay because it is meant to be worked through once and then closed.

**The audit was done by reading the repo, not by reading a bill.** No Lovable MCP and no database
credential were available to the session that wrote it: `.env` carries `SUPABASE_ACCESS_TOKEN` as the
literal placeholder `${SUPABASE_ACCESS_TOKEN}`, there is no `SUPABASE_SERVICE_ROLE_KEY`, and the
Management API returned 401. **So every "still running?" column below is a claim about what the code
schedules, not a measurement of what fired.** The verification queries in §1 are the only way to
settle it and they need the founder.

---

## 0. The short version

| # | What | Bills for | Action |
| --- | --- | --- | --- |
| 1 | **38 pg_cron jobs** | model calls, every minute in four cases | **Migration written. Apply it.** §1 |
| 2 | **GitHub Actions: `claude.yml`, `claude-code-review.yml`** | Anthropic tokens per PR or `@claude` mention | **Disable.** §2 |
| 3 | **GitHub Actions: `ci.yml`** | Actions minutes on every push to main | Optional; cheap. §2 |
| 4 | **The GitHub App webhook** | can start agent work with no cron involved | **Uninstall the App.** §3 |
| 5 | **Hosted services billing for uptime** — OpenHands on Railway, Deno Deploy, Supabase, Lovable | monthly, whether used or not | **Check and cancel.** §4 |
| 6 | **Pay-per-use API keys** (Cohere, E2B, ElevenLabs, Firecrawl, ZeroEntropy, Gemini, Qwen) | only when called | Goes quiet once §1 lands. Rotate anyway. §5 |
| 7 | **The live site** | Worker requests only | **No model spend.** Safe to leave up. §6 |

**The two that matter most and are least obvious: #4 and #5.** Stopping the crons does not stop a
webhook, and it does not stop a container that bills for being switched on.

---

## 1. The scheduled fleet — 38 jobs, and four of them fire every minute

**What is scheduled** (read from the migrations, not from `cron.job`): the 36 HTTP ticks defined in
[`20260909050000`](../../supabase/migrations/20260909050000_the_cron_jobs_are_defined_where_a_replay_would_find_them.sql),
plus `reap-stuck-job-runs` and `health-warm-tick` from
[`20260909070000`](../../supabase/migrations/20260909070000_a_ping_every_four_minutes_keeps_the_isolate_warm.sql).

**The expensive ones, by frequency:**

| Schedule | Jobs |
| --- | --- |
| **every minute** | `approvals-tick`, `event-reactor-tick`, `resume-runs` |
| **every 2 minutes** | `ci-poll-tick`, `fanout-reconcile-tick` |
| every 4–5 minutes | `health-warm-tick`, `delegate-poll-tick`, `sense-tick`, `uptime-tick` |
| every 10–30 minutes | `track-tick`, `loop-tick`, `cluster-tick`, `embed-tick`, `trigger-tick`, `goal-tick`, `cadence-eval-tick`, `reap-stuck-job-runs` |
| hourly or slower | the remaining 21 |

Each HTTP tick POSTs `https://supaprod.ai/api/public/hooks/<name>` with the cron key, and the
handlers behind several of them reach the model chokepoint. `track-tick` and `loop-tick` are the ones
that drive agent work.

**The fix, already committed:**
`supabase/migrations/20260928120000_the_engine_stops_because_nobody_is_using_it.sql`. It loops over
`cron.job` rather than a named list, because the named list was already one job short, and it raises
if anything survives. **It is applied through Lovable; committing and pushing does not apply it.**

**The immediate equivalent**, if the spend should stop before the next publish — run in the Lovable
SQL surface or the Supabase SQL editor:

```sql
DO $$
DECLARE j record;
BEGIN
  FOR j IN SELECT jobid, jobname FROM cron.job LOOP
    PERFORM cron.unschedule(j.jobid);
  END LOOP;
END $$;
```

**Apply the migration as well even if the paste is run.** Without it, any replay or re-apply of
`20260909050000` reschedules all 36 ticks.

### The three verification queries, and what a correct answer looks like

```sql
-- 1. Did the stop land? MUST return 0.
SELECT count(*) AS still_scheduled FROM cron.job;

-- 2. Did the migration itself apply? MUST return one row.
SELECT version FROM supabase_migrations.schema_migrations
 WHERE version = '20260928120000';

-- 3. Has anything run since? Newest row should predate the stop.
SELECT max(start_time) AS last_run,
       count(*) FILTER (WHERE start_time > now() - interval '1 hour') AS runs_last_hour
  FROM cron.job_run_details;
```

**Reading them.** Query 1 returning `0` is the only thing that proves the spend stopped. If query 2
returns nothing but query 1 returns 0, the paste was run and the migration is still pending — apply
it. If query 1 returns a number greater than 0, nothing has been stopped yet.

**Rollback**, if the fleet is ever wanted again: re-run `20260909050000` and `20260909070000`. Both
are idempotent and neither was deleted.

---

## 2. GitHub Actions — two of the three spend real tokens

**[FACT] No workflow is scheduled.** `grep 'schedule:' .github/workflows/` returns nothing, so
nothing here fires on a timer. All three are event-driven.

| Workflow | Fires on | Spends | Verdict |
| --- | --- | --- | --- |
| `claude.yml` | `@claude` in an issue, comment, or review | **Anthropic API tokens**, per invocation | **Disable.** Nothing should be asking an agent to work on a stopped product |
| `claude-code-review.yml` | every PR opened, synchronized, reopened, or marked ready | **Anthropic API tokens**, per PR and per push to a PR | **Disable.** A single PR with several pushes invokes it several times |
| `ci.yml` | every push to `main`, every PR | **Actions minutes** (`tsc --noEmit` + `bun test` over 1,220 test files) | Optional. It has `cancel-in-progress` concurrency and no model calls. Cheap, and it is the only thing that would catch a broken commit |

**How to disable** without deleting anything: GitHub → Actions → select the workflow → **⋯ → Disable
workflow**. Reversible in one click, and it leaves the files in the tree.

**Also check:** GitHub → Settings → Secrets and variables → Actions. If an `ANTHROPIC_API_KEY` is
stored there, it is the thing the two Claude workflows spend. Disabling the workflows is enough;
removing the secret is belt and braces.

---

## 3. The GitHub App webhook — the one that survives every cron being stopped

**[FACT]** `src/routes/api/public/hooks/github-webhook.ts` exists and is a public, event-driven
endpoint. `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_SLUG` and `GITHUB_WEBHOOK_SECRET`
are all configured.

**Why it matters.** A webhook is not a cron. If the GitHub App is still installed on any repository,
a push, a PR, or a check completing on that repository delivers an event to this endpoint, and the
Build and CI paths behind it can start work. **Stopping all 38 scheduled jobs does not close this
door.**

**Action:** GitHub → Settings → Applications → Installed GitHub Apps → the Supaprod app →
**Uninstall**. Alternatively, in the App's own settings, uncheck every webhook event. Uninstalling is
cleaner and is what a stopped product wants.

**Not verified:** which repositories the App is installed on. The repo records the bound repo as a
starter template plus `relay-homeowner-app`
([A1-REPORT](../../the-first-run/A1-REPORT.md) checkpoints, 2026-09-04), but installation state lives
on GitHub, not here.

---

## 4. Services that bill for being switched on, not for being used

**This is the section most likely to hold a surprise**, because none of it stops when the crons do.

| Service | Evidence it exists | Likely billing | Action |
| --- | --- | --- | --- |
| **OpenHands on Railway** | `OPENHANDS_ENDPOINT=…openhands-production-909d.up.railway.app`, `OPENHANDS_API_KEY`, `DELEGATE_OUTBOUND_ENABLED` in `.env`; `delegate-poll-tick` polls it | **Railway bills for a running service by the hour.** A deployed container costs money while it is up, with zero traffic | **Check the Railway project and delete or pause the service.** Highest-priority item in this table |
| **Deno Deploy** | `DENO_DEPLOY_ACCESS_TOKEN`; Ship promotes to `*.deno.net`; the repo records hitting the **10-app plan cap** (A1-REPORT, 2026-09-04) | Paid plan if above the free tier | Check the plan. Delete the promoted demo apps; drop to free |
| **Supabase** | the project itself | ~$25/mo Pro floor ([procurement-inventory](./procurement-inventory.md)) | Keep while the data is wanted. `pg_cron` and `pg_net` run regardless of the app, which is why §1 is the real fix |
| **Lovable Pro** | the only deploy path; hosts the site | ~$25/mo ([procurement-inventory](./procurement-inventory.md)) | Keep only if the site should stay up. §6 |
| **`supaprod.ai` domain** | live | ~$160/yr, annual | Nothing to do now. Decide at renewal |
| **Cloudflare** | one Worker, via Lovable | Workers free tier at this traffic | Leave |
| Sentry · Better Stack · Resend | [procurement-inventory](./procurement-inventory.md) §11–12 | **free tiers** | Leave |

**Two recorded signals worth knowing before you look.** The **Cohere account had no payment method
and embeddings had been failing since 2026-09-01**, and **Deno Deploy was at its 10-app cap**
(A1-REPORT checkpoint 12:30 IST 2026-09-04). Both suggest some of this had already stopped working on
its own, which is cheaper than it sounds and is also why the bill is the only honest source here.

---

## 5. Pay-per-use keys — quiet once §1 lands, rotate anyway

**[INFERENCE]** These bill only when something calls them, and the only thing calling them was the
fleet. Once §1 is applied they go to zero without any further action:

`COHERE_API_KEY` (embeddings) · `E2B_API_KEY` (sandboxes) · `ELEVENLABS_API_KEY` ·
`FIRECRAWL_API_KEY` · `ZEROENTROPY_API_KEY` · `GEMINI_API_KEY` · `AI_PROVIDER_QWEN_KEY` ·
`CANNY_API_KEY` · `HUBSPOT_ACCESS_TOKEN` · `SLACK_BOT_TOKEN` · the Linear, Microsoft, Salesforce and
Google OAuth client secrets.

**Rotate or revoke them anyway**, for a reason that is not cost: they sit in a local `.env` on a
product nobody is working on, and a leaked key on a dormant project is discovered late. Revoking also
makes it impossible for a forgotten scheduler to spend quietly.

**Not a cost, but worth doing in the same sitting:** `.env` is 6.4KB of live credentials for twelve
third parties. It is gitignored and was never committed — verified: `git log --all -- .env` is empty.

---

## 6. The live site spends nothing on models. It can stay up.

**[FACT]** The public surfaces were checked for anything that could invoke a model from an
unauthenticated request, and none can:

- **`/p/teardown` is retired.** It is a permanent redirect and nothing else, and has been since the
  founder's 2026-08-22 call (`src/routes/p.teardown.tsx:1`,
  [`../decisions/public-teardown-retired-2026-08.md`](../decisions/public-teardown-retired-2026-08.md)).
  This was the one public surface that used to run a model for a stranger with no signup.
- **`/demo`** reads a real workspace read-only.
- **`/t/$slug`** and **`/d/$slug`** are read-only projections over rows already written, behind RLS.
- **Signup closed 2026-08-07**, so no new account can start work.
- **No `scheduled()` handler in the Worker** and **no `triggers`/`crons` key in `wrangler.jsonc`** —
  Cloudflare fires nothing on a timer. Every `setInterval` in `src/` is browser-side and only runs
  while a person has a tab open.
- **No Supabase Edge Functions.** `supabase/` holds `config.toml` and `migrations` only.

**So leaving supaprod.ai up costs Worker requests and the Lovable plan, and no model tokens.** That is
a presentation decision, not a spend decision.

---

## 7. What this audit could not verify, stated plainly

Nothing below is a claim that something is safe. It is a list of things only the founder can read:

- **Whether `cron.job` is empty.** §1's queries settle it. Everything in §1 is read from migrations.
- **Whether the 2026-09-28 migration applied.** Query 2 in §1.
- **Any actual bill, from any vendor.** No spend figure in this document is measured. The only model
  costs ever recorded in the repo are tiny — one track at **$0.263044**, one release run at **3,606
  credits ≈ $0.78**, one whole workspace at **$1.08** — which suggests the fleet's model spend was
  small and that §4's uptime billing is the larger number. **That is an inference, not a bill.**
- **Whether the Railway service is up**, and what it has cost.
- **Which repositories the GitHub App is installed on.**
- **Whether the two Claude workflows have fired recently.** GitHub → Actions shows the run history.

## Related

- [`../../the-first-run/RULINGS.md`](../../the-first-run/RULINGS.md) — R-42 stopped the product, R-43 stopped the fleet
- [`../strategy/direction-search-2026-09.md`](../strategy/direction-search-2026-09.md) — what comes next, and what is kept from the codebase
- [`./procurement-inventory.md`](./procurement-inventory.md) — what each vendor was chosen for and its plan
- [`./session-handoff.md`](./session-handoff.md) — the 2026-09-28 entry, with the paste-now SQL
