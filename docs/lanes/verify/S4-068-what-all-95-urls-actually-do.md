# S4-068 · What all 95 URLs actually do, measured rather than read off the file tree

> _S4, 2026-08-27. Every routable path opened signed in against a database that does not exist.
> `bun run e2e/helpers/surface-census.mjs`, 95 paths, one pass._

## The headline

**95 paths: 51 render, 43 redirect, 0 reach nothing, 0 never rendered.**

**Nothing in this router is dead.** Every route file resolves to something a person can use or to a
deliberate redirect. That is worth knowing before a fold, because "119 routes" reads like a scrapyard
and it is not one.

**And the fold is already 45% done, which nobody had counted.** 43 of 95 paths are redirects today.

## Where the 43 redirects land, which is the shape of the product that is emerging

| destination | paths folded into it |
| --- | --- |
| `/engine-room` | **14** |
| `/brain` | 6 |
| `/today` | 4 |
| `/start` · `/settings` · `/plan` | 3 each |
| `/learn` · `/build` | 2 each |
| `/ship` · `/security` · `/discover` · `/demo` · `/decide` · `/crew` | 1 each |

`/engine-room` has absorbed fourteen routes on its own. If any surface is at risk of becoming a
drawer, it is that one, and it is the one to look at next.

## The gap against the target, stated plainly

The operating model wants **three surfaces**. The measurement says **51 render**. The distance is
not 119 and it is not 3; it is 51, and 43 of the 95 have already been walked.

## Method, and what "renders" does and does not mean

Measured against a **dead database on purpose**: the question is what the ROUTE does, not what the
data says, and no workspace can skew it. So **"renders" means the path resolves and draws its own
surface, including its honest failure state. It does NOT mean the surface works with data.**

Signed in via `e2e/helpers/dead-backend-session.mjs`, so the guard is satisfied without credentials.

**The one row marked `login` is `/login` itself**, which landed on `/login`. That is the classifier
being literal, not a finding.

## What I am not claiming

- **A redirect is not automatically a completed fold.** The census records where a path lands, not
  whether the destination absorbed the work that used to live there.
- **Query-string views are invisible to this.** S3 notes `/engine-room?view=suites` and
  `?view=prompts` still answer but deliberately draw no tab. A path census cannot see that.
- **One pass, one machine, one night.**

## The full table

| path | what it does | first words |
| --- | --- | --- |
| `/` | renders | Supaprod Film Demo Pricing Security Sign in Join the beta M FOR PRODUC |
| `/admin` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/admin/ai-costs` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/admin/invites` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/admin/landing` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/admin/observability` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/admin/people` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/admin/platform` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/admin/pricing` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/admin/proof` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/admin/quality` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/admin/routing` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/admin/workspaces` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/agents` | redirect -> /crew | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/analytics` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/approvals` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/ard` | renders | Supaprod llms.txt Agent card Sign in INTEROP STANDARD |
| `/artifacts` | redirect -> /brain | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/boundary` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/brain` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/brief` | renders | Home Share SUPAPROD BRIEF For product managers who ship with agents. S |
| `/briefing` | redirect -> /settings | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/budgets` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/build` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/calendar` | redirect -> /brain | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/changelog` | redirect -> /ship | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/chat` | redirect -> /start | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/checkout` | renders | Back to plans Start with Pro One author, and the whole record is yours |
| `/checkout/return` | renders | Back to plans Start with Pro One author, and the whole record is yours |
| `/cockpit` | redirect -> /today | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/crew` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/decide` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/delegate` | redirect -> /build | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/demo` | renders | Supaprod Sign in Request access See the whole loop. Supaprod tells you |
| `/design` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/discover` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/discovery` | redirect -> /discover | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/docs` | redirect -> /brain | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/drift` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/engine-room` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/eval-health` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/evals` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/faq` | renders | Supaprod ← Back to home HELP Frequently asked questions Last updated A |
| `/film` | renders | Supaprod Request access THE FILM |
| `/fleet` | redirect -> /today | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/forgot-password` | renders | This page is taking a moment |
| `/govern` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/guardrails` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/impact` | redirect -> /learn | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/inbox` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/integrations` | redirect -> /settings | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/investors` | renders | Home Share SUPAPROD BRIEF For product managers who ship with agents. S |
| `/knowledge` | redirect -> /brain | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/learn` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/login` | login | This page is taking a moment |
| `/m` | redirect -> /start | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/meetings` | redirect -> /brain | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/memory` | redirect -> /brain | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/meridian` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/missions` | redirect -> /today | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/notifications` | redirect -> /settings | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/observe` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/onboarding` | renders | Waking your workspace… |
| `/opportunities` | redirect -> /decide | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/outcome` | redirect -> /learn | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/p/teardown` | redirect -> /demo | Supaprod Sign in Request access See the whole loop. Supaprod tells you |
| `/plan` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/prds` | redirect -> /plan | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/pricing` | renders | Supaprod Sign in PRICING Free to start, once you are in. Pick the capa |
| `/privacy` | renders | Supaprod ← Back to home LEGAL Privacy policy Last updated August 7, 20 |
| `/product` | renders | Supaprod Film Demo Pricing Security Sign in Join the beta M HOW IT WOR |
| `/prompts` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/proof` | renders | This page hit an error. Missing Supabase environment variable(s): SUPA |
| `/reset-password` | renders | This page is taking a moment |
| `/roadmap` | redirect -> /plan | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/runs` | redirect -> /today | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/security` | renders | Supaprod ← Back to home TRUST Security Last updated July 10, 2026 We a |
| `/settings` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/ship` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/signup` | renders | This page is taking a moment |
| `/stakeholder` | redirect -> /plan | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/start` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/studio` | redirect -> /build | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/subprocessors` | renders | Supaprod TRUST Sub-processors The third parties that process customer  |
| `/swarm` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/sync` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/tasks` | redirect -> /start | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/terms` | renders | Supaprod ← Back to home LEGAL Terms of service Last updated July 10, 2 |
| `/threads` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/today` | renders | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/traces` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/track-record` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/trust` | redirect -> /security | Supaprod ← Back to home TRUST Security Last updated July 10, 2026 We a |
| `/trust-ledger` | redirect -> /engine-room | Supaprod Ask ⌘K ? New work item Today g o Approvals g v Work g w Runs  |
| `/updates` | renders | Supaprod ← Back to home PRODUCT Changelog Last updated August 10, 2026 |

**95 paths: 51 render, 43 redirect, 0 reach nothing, 1 bounced to login, 0 never rendered.**
