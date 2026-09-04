# Two launch gates: seat limits, and a sandbox to run tests in

> _Created: 2026-08-02 · Last updated: 2026-08-03_

> _Written 2026-08-02. Both are founder decisions with real money or real user impact
> attached. Neither blocks anything today. Both block the same thing: charging people._

---

## 1. Seat and tier limits are switched off, and turning them on needs one thing first

`limit_gates_enabled()` returns **false**, and it gates four enforcers, not one:
`enforce_workspace_seat_limit` (new today), `enforce_workspace_limit`,
`enforce_product_limit`, and the seat check inside `create_workspace_invitation`.

So today no tier limit fires anywhere. That is the correct state while nobody is paying,
and it is the wrong state the moment somebody is.

**Why it cannot simply be flipped.** Ten accounts already hold more than their tier
allows. Every one is a demo or founder account, so nothing is at risk, but the numbers
are real:

| Account | Tier | Workspaces (limit) | Products (limit) |
| --- | --- | --- | --- |
| explore@supaprod.ai | free | 2 (1) | 6 (2) |
| demo@redcadence.app | pro | 2 (unlimited) | 6 (3) |
| harbor, compass, lantern, meridian, voyage | free | 1 to 2 (1) | 4 (2) |
| ember, demo2, santacruzz656 | free | 2 (1) | 1 to 2 (2) |

The triggers are BEFORE INSERT, so existing rows survive a flip untouched. What breaks
is the next insert: **no new product or workspace could be created in any of those
accounts**, including the ones used for investor demos.

**The prerequisite, and it is one step.** Put the demo accounts on a tier that matches
what they hold. `team` is the honest choice: they demonstrate shared memory, which is a
Team capability, and a "Free" badge on an investor demo is itself wrong.

**Why that step is not done here.** `accounts.plan_tier` is protected. An UPDATE from
anything that is not `service_role` is silently reverted by a billing-column trigger, the
same pattern that protects `workspaces.plan_tier`. That protection is correct and should
stay: a plan tier is something Stripe and the platform admin path set, never an ad-hoc
write. The supported route is `admin_override_user_plan(_uid, _tier, _expires_at,
_reason)`, run as an authenticated platform admin.

**Recommendation.** Leave the gate off until the tier change goes through the admin path.
Flipping first would freeze the demos, and forcing the tier change past a protection that
exists for good reason would be worse than the problem it solves. Once tiers are right,
the flip is one statement:

```sql
create or replace function public.limit_gates_enabled()
returns boolean language sql immutable set search_path to 'public' as $$ select true $$;
```

---

## 2. A sandbox, so build agents can run the tests they write

**What is missing.** `ExecProvider` (`src/lib/exec/provider.ts`) is scaffolded and the
only wired implementation is the GitHub Actions floor, which runs in the customer's repo
**after a push**. So a build agent can read CI results and cannot run anything itself: no
tests, no typecheck, no lint, no dependency audit that executes.

The Build lane shipped four verification tools today (code review, secret scan, test plan,
dependency audit) and deliberately refused to fake the executing ones, because a tool that
claims to have run the suite would be a lie with a green tick on it.

**Why it matters more than it sounds.** This session found nine separately shipped
features that were doing nothing in production, every one of which passed typecheck and
tests. The gap between "tests passed" and "the feature works" is the single most expensive
thing in this codebase right now. An agent that can run its own tests before opening a PR
is the first line of defence; one that can only read CI afterwards is not.

### The three candidates

| | Fit | Shape of the cost | Note |
| --- | --- | --- | --- |
| **Cloudflare Sandbox SDK** | Closest. The app already deploys to Cloudflare Workers, so no new vendor, no new billing relationship, and the same account. | Workers Paid plan (~5 USD/month, already needed) plus container compute billed per vCPU-second and GiB-second. | Recommended for this product on fit alone. |
| **E2B** | Purpose-built for running untrusted AI-generated code. Best isolation story. | Per-second sandbox billing, with a free credit allowance to start. | The right answer if customer code ever runs, rather than ours. |
| **Vercel Sandbox** | Good if any part of the stack moves to Vercel. Today nothing is. | Per active CPU-hour plus memory. | Weakest fit here: a second platform for one capability. |

**Prices move, so treat the shapes above as shapes.** Confirm current rates before
committing; the ordering of fit does not depend on them.

### What it actually costs you, for the demo

This is the part worth being concrete about, because the instinct is to assume it is
expensive and it is not at this stage.

A test run for this repo is roughly two minutes on two vCPUs, so about 240 vCPU-seconds.
At the order of magnitude these providers charge, that is **fractions of a cent per run**.

- 100 build runs a month: **well under 1 USD**
- 1,000 build runs a month: **a few USD**
- Continuous heavy use by a real team: **tens of USD**

So for demos and early users this is a rounding error, and the honest answer to "should we
turn it on just for the demo" is that the cost is not the reason to wait. The reasons to
wait are that it is a new dependency to operate and a new place where code executes, and
neither is urgent this week.

### The alternative worth considering

**Do nothing new, and lean harder on CI.** Instead of a sandbox, have the agent push to a
branch and read the existing GitHub Actions result before opening the PR, rather than
after. It costs nothing, uses infrastructure that already exists, and closes most of the
gap.

What it does not give you: a fast inner loop. Every check costs a push and a CI wait,
measured in minutes rather than seconds, and an agent that must push to learn anything
cannot iterate. It is the right stopgap and the wrong destination.

**Recommendation.** Not this week. When it is picked up, Cloudflare on fit, with a spend
cap set at the account level from day one, since the failure mode of an agent with compute
is an expensive loop rather than a broken build.

> ### ⛔ SUPERSEDED 2026-08-03: the vendor is E2B, not Cloudflare
>
> The Cloudflare recommendation above rests on "no new vendor, no new billing
> relationship, and the same account". **That premise is false and was not known when this
> was written.** Lovable owns the Workers deployment (the app serves from
> `supaprod.lovable.app`; `wrangler whoami` reports *not authenticated*). Our Cloudflare
> account covers DNS and the registrar only. So Cloudflare is a new billing relationship
> too, and its single largest advantage here disappears.
>
> With that gone the choice goes to fit, and **E2B wins**: executing untrusted
> AI-generated code is its product rather than a feature, and its free tier is a one-time
> $100 of credits with no card required. The one axis Cloudflare still wins, serving a
> live preview from our own domain, turns out not to matter, because the build agent works
> in the **customer's** repo and their pull requests already have their own preview
> deploys.
>
> Everything else on this page still stands, including the cost analysis and the spend-cap
> rule. Full reasoning, the comparison table, the caveat about E2B Pro at $150/month, and
> the conditions that would flip us back to Cloudflare:
> [`build-sandbox-vendor.md`](./build-sandbox-vendor.md).

---

## What is not blocked by either of these

Everything else. The seat design, the workspace claim, the memory sharing and the
verification tools all shipped and work with the gate off and no sandbox. These two are
about charging money and about closing the verification loop, in that order.
