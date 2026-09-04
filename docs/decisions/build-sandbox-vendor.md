# The build sandbox: why E2B, why not Cloudflare, and what would change our mind

> _Created: 2026-08-03 · Last updated: 2026-08-03_

> _Decided 2026-08-03, founder-authorised. Supersedes the sandbox recommendation in
> [`launch-gates-seat-limits-and-sandbox.md`](./launch-gates-seat-limits-and-sandbox.md),
> which said Cloudflare. That document is otherwise still correct and its cost analysis
> still holds; only the vendor choice is overturned, and the reason is a fact we did not
> have when it was written._

---

## What we are buying, in one sentence

A place for a Supaprod build agent to run the tests it just wrote, get an exit code back
in seconds, and iterate, **before** it opens a pull request.

Today it cannot. `ExecProvider` (`src/lib/exec/provider.ts`) is scaffolded and the only
wired backend is the GitHub Actions floor, which runs in the customer's repo **after a
push**. So the agent can read a verdict and cannot produce one. Every check costs a push
and a CI wait, measured in minutes, and an agent that must push to learn anything cannot
iterate at all.

## Why this matters more than it sounds

On 2026-08-02 nine separately shipped features were found doing nothing in production.
On 2026-08-03 five more surfaced: memory recall unresolvable, retrieval ambiguous, a
quarter of the cron fleet being killed, an unpriced model draining five accounts,
embeddings down for 21 hours. **Every one of the fourteen passed typecheck and tests.**

That number is the argument, but read it carefully, because it also bounds what a sandbox
buys. A sandbox closes "the agent cannot verify its own code". **Not one of those fourteen
would have been caught by it**: all fourteen were code that was fine sitting on production
state that was wrong, and all fourteen were found by querying the live database. The
sandbox is necessary and it is not sufficient, and anyone treating it as the answer to
"why do we keep shipping dead features" has misread the evidence.

## The decision

**E2B, on the free tier, wired behind the existing `ExecProvider` seam. No purchase yet.**

## Why E2B over Cloudflare, and the fact that changed it

The earlier document recommended Cloudflare Sandbox SDK on the grounds that "the app
already deploys to Cloudflare Workers, so no new vendor, no new billing relationship, and
the same account."

**That premise is false.** Lovable owns the Workers deployment: the app serves from
`supaprod.lovable.app`, and `wrangler whoami` in this repo reports *not authenticated*. We
hold a Cloudflare account for DNS and the registrar (`supaprod.ai`, `supaprod.com`), which
is not the same thing as holding the Workers account the app runs on. So **Cloudflare is a
new billing relationship too**, and its single largest advantage evaporates.

With that gone, the comparison is decided on fit:

| | fit for our job | cost shape | verdict |
| --- | --- | --- | --- |
| **E2B** | Purpose-built for executing untrusted AI-generated code. Isolation is the product, not a feature bolted on. | Free tier: **one-time $100 credit, no card required**, 1-hour max session, 20 concurrent sandboxes. Pro $150/mo: 24-hour sessions, 100 concurrent, expandable to 1,100. Usage metered per second on CPU/RAM/storage on both. | **Chosen** |
| **Cloudflare Sandbox SDK** | Capable. Its distinctive win is serving a live preview from our own domain, which we argue below we do not need. | Workers Paid ~$5/mo plus per vCPU-second and GiB-second. | Second choice |
| **Vercel Sandbox** | Weakest. Nothing of ours runs on Vercel, so it is a second platform for one capability. | Per active CPU-hour plus memory. | No |
| **Modal / Fly Machines / Daytona** | Capable general compute, but shaped for workloads rather than for agent sandboxes. | Per second. | Not worth a new vendor |
| **GitHub Actions** (today's floor) | Already wired, always available. | $0 | Keep as the fallback, never as the destination |

## Live preview: why it is not a reason to choose a vendor

This was the one axis on which Cloudflare beat E2B, so it is worth being explicit about
why it does not decide anything.

"Live preview" means the built app actually running at a clickable URL, as opposed to the
$0 self-contained sandboxed iframe the Build surface renders today (`previewsBuilds` on
`ExecProvider`).

- **The agent does not need it.** It needs exit codes and stdout from `bun test` and
  `tsc`. It never looks at a rendered page.
- **The user mostly does not need it from us**, and this is the sharp part: our build
  agent works in **the customer's own repo** and merges through `studio.pr.merge`. Any
  real team already has preview deploys wired to their pull requests. A preview from us
  duplicates infrastructure they own, and is *less* trustworthy than theirs precisely
  because it is not their real deploy pipeline.
- **The general test**, worth reusing on other build-versus-buy calls: ask who owns the
  deploy pipeline for this artifact. If the customer does, do not rebuild it.

**When this flips.** If Supaprod ever hosts customer applications itself (the Supaprod
Cloud direction in `docs/strategy/byo-build-and-supaprod-cloud.md`), we own the pipeline
and live preview becomes ours to serve. That is the trigger to add Cloudflare, and it is a
product decision, not an infrastructure one.

## Is this a trial we will regret, or the long-term answer?

The long-term answer, with one honest caveat.

- The workload is exactly E2B's product, and 20 concurrent sandboxes on the free tier
  against zero current users is not a constraint we can feel yet.
- **The switching cost is already paid.** `ExecProvider` exists with `e2b`,
  `cloudflare-sandbox` and `vercel` as reserved ids resolving back to the $0 floor, so a
  vendor change is one implementation behind an existing interface rather than a rewrite.
  This is the seam earning its keep, and it is why "just try it" carries almost no risk.
- **The caveat, stated so nobody is surprised later.** E2B Pro is $150/month against
  Cloudflare Workers Paid at roughly $5/month plus metered compute. If our need stays
  narrow, running *our own agent's* code rather than *a customer's* code, Cloudflare is
  materially cheaper at scale. The question that decides it is whether untrusted
  third-party code ever executes. Revisit at the point we either take a paying customer
  whose repo we execute, or exceed the free credit.

## What was needed to start, and what was deliberately not bought

Sign up at e2b.dev. **No credit card, one-time $100 of credits.** One `E2B_API_KEY`, set
locally in the git-ignored `.env` and as a production secret through Lovable, the same
path `COHERE_API_KEY` took.

Nothing is purchased. That is intentional: the free tier is enough to wire the backend and
prove it end to end, so the upgrade decision gets made against measured usage instead of a
guess. This is the same discipline the Cohere incident taught, from the other direction:
that key was a **trial** key capped at 1,000 calls a month, it silently exhausted, and
embeddings were dead for 21 hours before anyone knew. So the standing rule for any new
provider is now: **know which tier the key is on, and know what happens at the wall,
before it is load-bearing.**

**Set the spend cap on day one, whichever vendor we are on.** The failure mode of an agent
with compute is an expensive loop, not a broken build.

## WIRED 2026-08-03. What the live API actually does, and what is still unproven

The key was provisioned the same day and the backend shipped in commit `2ea9f4e9`
(`src/lib/exec/e2b.server.ts`, the `studio.checks.run` tool, 46 tests). A smoke test
against a real sandbox taught four things, none of which are in the docs and one of
which would have produced a false green:

1. **A non-zero exit THROWS.** `commands.run("exit 7")` raises `CommandExitError`
   carrying `exitCode`; it does not return a result with a non-zero code. Code that
   assumed the return value would have treated every failing test suite as an
   infrastructure error, and an infrastructure error that is not mapped carefully
   becomes "nothing to gate on", which allows the merge.
2. **Bun is not in the default template.** The image carries node v20.9.0, npm,
   python 3.11.6 and git. `which bun` finds nothing. Bun is installed during setup;
   a custom E2B template would make that a one-time cost rather than per-run, and it
   is the first optimisation to make once this is used in anger.
3. **Sandbox creation is about 500ms**, and a full create-run-kill round trip about
   2 seconds. Fast enough to sit inside an agent's loop, which was the open question.
4. **git is present**, so cloning needs no extra install.

**The second false green, and it was in our own code, not E2B's.**
`overallFromChecks([])` returns `neutral`, and `mergeReadinessFromCi("neutral")`
ALLOWS the merge, because for the GitHub Actions floor an empty check list honestly
means "this repo has no CI configured". For a sandbox it means "nothing was
verified", and a sandbox that fails to boot produces zero results too. Left alone it
would have read as permission to merge unreviewed code. `execVerdictFromRun` now maps
both an infrastructure failure and an empty result set to an explicit refusal.

**What is NOT verified.** The SDK is proven against the live API from Bun and the
seam is proven by unit tests, but it has not been exercised inside workerd. It
bundles into its own chunk and the build is green; the first real mission run is what
will confirm the Cloudflare runtime. Do not report this as production-proven until
then.

**Spend cap: deliberately not set.** The founder set no cap because there is no card
on file and the account holds a one-time $100 credit, so the credit is itself the
ceiling. That is sound, and it moves the whole burden onto the in-code bounds: every
path kills the sandbox in a `finally`, and every sandbox carries a create-time
`timeoutMs` so a lost kill (a Worker torn down mid-run, a real failure mode in this
codebase) cannot bill indefinitely. **If a card is ever added, set the cap that day.**

## What we do after it works

1. Wire `e2b` behind `ExecProvider` and make the Build agent run tests before opening a
   PR rather than after pushing.
2. Feed the result into the same `studio-ci.ts` verdict the merge gate already reads, so
   an `ExecProvider` verdict and `studio.pr.merge` can never disagree about what green
   means.
3. Measure real usage against the $100, and only then decide between staying free,
   E2B Pro, or moving to Cloudflare on cost.
4. Re-open the live-preview question **only** if Supaprod Cloud ships.

## The thing this does not fix, restated because it will be tempting to forget

A sandbox verifies code. It does not verify that a shipped feature is doing anything in
production. That gap is what produced all fourteen defects above, and it is closed by
different work: the feature-liveness sweep, `error_events`, the stuck-run reaper added on
2026-08-03, and the habit of reading the live database before believing the code. Do not
let a green sandbox restore the confidence that a green test suite did not deserve.
