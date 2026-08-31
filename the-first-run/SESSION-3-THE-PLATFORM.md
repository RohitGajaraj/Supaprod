# S3 · THE PLATFORM — Claude Code, worktree `supaprod-platform`, branch `lane/platform`

**Read [`OPERATING-MODEL-5-SESSIONS.md`](./OPERATING-MODEL-5-SESSIONS.md) in full first.** It carries
the user lens, the definition of "truly agentic", the git-only coordination protocol, work-safety
rules and both gates. Then read [`SURFACE-MAP.md`](./SURFACE-MAP.md) for every route you own and what
happens to it.

**You own everything between "a person signs up" and "they are working" — and everything that makes
this a product a company can actually buy.** S1 and S2 build the thing. You build the way in and the
reasons a company can put real work through it.

> ## ⚠ YOUR SCOPE CHANGED ON 2026-08-31. READ THIS BEFORE YOUR FIRST UNIT.
>
> **The public and marketing surface is FROZEN** — operating model §0.7, ruled by the founder. It is
> still in your prefix and you are still its owner; **you do not improve it.** Twenty routes and
> ~380KB of component, listed in §0.7, are opened only for a false claim, a wrong legal page, a
> broken page, or a request from the founder by name.
>
> **And the sixty seconds is measured SIGNED IN, not on the landing page.** That correction is §0.7
> and it changes what this brief used to ask you for. The judged moment is signup → the product
> already working, not a stranger reading a hero.
>
> **Your weight goes to the platform:** the verdict reaching a person who left, the boundary binding,
> what counts as done, gates that can be declared, connectors reached where they are needed, the sad
> paths, search and export. Those are the items on your queue and they are ranked in §0.7's list.

---

## What you own (write nothing else)

**BUILD HERE.** `src/components/onboarding/**` · `settings/**` · `billing/**` · `admin/**` ·
`system/**` · `governance/**` · `engine-room/**` · `connections/**` · `notifications/**` ·
`src/styles/**` except `meridian.css`
Routes: `settings` · `onboarding` · `admin.*` · `integrations` · `notifications` · `boundary` ·
`govern` · `guardrails` · `engine-room` · `budgets` · `approvals` · `login` · `signup` ·
`forgot-password` · `checkout*`

**YOURS, BUT FROZEN — §0.7.** `src/components/landing/**` · `public/**` · `plg/**` · `supaprod/**` ·
`brief/**` · `product/**`, and the routes `index` `product` `pricing` `faq` `demo` `film` `investors`
`proof` `trust` `security` `privacy` `terms` `subprocessors` `updates` `brief` `ard` `d.$slug`
`p.$slug` `p.teardown` `t.$slug` `admin.landing`. **You are the owner so that nobody else touches
them, not so that you improve them.** Four exceptions only, in §0.7. A unit spending here is rejected
at the gate.

**The auth routes are NOT frozen** — `login`, `signup`, `forgot-password`, `reset-password`,
`join.$token`, `checkout*` are the door into the platform and they are job 3 below.

**You do not WRITE the database** — but as of 2026-08-31 this lane runs Claude Code and **may READ
Postgres itself** via the Lovable MCP's `query_database`, so a count no longer costs a request and a
wait. A write, a migration or a deploy is still an ask. Every count, row and query is a request file in coordination/requests/<you>/. You have Playwright, every
skill and plugin in your session, and the whole repo to read.

---

## The sixty seconds — signed in, and it is the second acceptance criterion

A person who has never seen this product **signs in** and, **inside sixty seconds, without being told
anything, knows what it is doing for them and wants to come back.** The founder judges this on the
running product, **on the signed-in surface** (§0.7). A landing page cannot pass or fail it: the thing
being judged is whether the product explains itself *by doing something*.

**It is one of your four jobs, not the thing that outranks them.** This brief used to say nothing you
build matters more; §0.7 replaced that ranking. Job 1 below outranks it, because a promise S1 is
already making on screen is untrue until you ship it.

What that forbids: a tour, a tooltip, a checklist of setup steps, a "connect your tools first" wall, an
empty dashboard, a modal explaining the concept. **In a closed loop every action is the only one that
makes sense; a surface that needs explaining is the defect.**

What it requires: the product is **already doing something** by the time the first paint settles. One
sentence in, and work visibly starts. Ferndesk names its agent on the first screen; Gemini starts the
research before the modal closes. Signup, workspace and everything else either happens invisibly
around that or happens later.

---

## §J0 · Your reading list, in this order

1. [`OPERATING-MODEL-5-SESSIONS.md`](./OPERATING-MODEL-5-SESSIONS.md) — every rule. **§0.7 redefines
   your job; read it twice.** §4 is the coordination protocol, amended 2026-08-31.
2. **This file, §J1–§J5.**
3. [`SURFACE-MAP.md`](./SURFACE-MAP.md) — what you own, and **what of yours is FROZEN**.
4. [`SPEC-AI-NATIVE-SDLC.md`](./SPEC-AI-NATIVE-SDLC.md) §3 E, §3 F, §3 H — yours.
5. [`RANKED-BACKLOG.md`](./RANKED-BACKLOG.md) — #2 stays first, then #18 and #19.
6. [`SPEC-CONNECTORS.md`](./SPEC-CONNECTORS.md) — the connect control, and mention consent.
7. [`../docs/strategy/positioning-locked-2026-08.md`](../docs/strategy/positioning-locked-2026-08.md)
   — **the banned words, before you write a single line of copy.**
8. `docs/lanes/QUEUE-S3.md` and `coordination/answers/S3/`.

> **Why the anchors exist.** `/goal` accepts 4,000 characters and this brief has no limit, so the
> prompt block names `§J0`–`§J5` and carries only the ranking and the non-negotiables. **The
> operative text of every job is here, in full.**

---

## §J1-J5 · Your five standing jobs, in this order

**The order is the ranking** (§0.7). Job 1 is a promise another lane is already making on
screen; job 2 is what a company needs before it puts real work through this. The route fold is last
because it removes rather than adds, and §0.5 still wants the count going down.

### §J1 · The verdict reaches a person who left the page — authorised gap #2, and it is first

**Nothing today reaches a person who closed the tab.** No notification, no email, no push, no digest
carries a verdict to somebody who is not looking. The whole frontier is async — submit and leave, the
result comes to you — and we require attendance and call it visible agency.

**Why this is job 1 and not job 3.** S1 ships the sentence *"I'm on it — you can leave this page"* on
the run surface. **Until you ship this, that sentence is a claim the product cannot keep**, and
standard #7 is the one that deletes a feature rather than sending it back. Two lanes are holding one
promise between them; yours is the half that makes it true.

**One channel, done properly, end to end. Email is the recommendation** — no device permission, no app
install, and the founder can receive one today. The message names **what was predicted beside what
happened**, because that pairing is the product. One place to turn it off.

**The trigger is not yours.** The send fires from the spine when a verdict lands and `src/lib/**` is
S0's — file `coordination/requests/S3/verdict-notify-trigger.md` naming the event and the payload
fields, and build the preference surface, the template and the delivery settings against that
contract. **Grep for an existing mailer, `resend`, or a notification table first; about twenty
connector providers already exist including Gmail and Outlook.**

**Acceptance:** a real verdict produces a real email to a real address, **verified by receiving one,
not by a green unit test.**

### §J2 · Operate: the boundary, set once, widened by class

This is the third of the six verbs (§11 of the operating model) and it is where the product becomes
enterprise-credible rather than a toy.

`THE-ONE-SCREEN.md` already ruled the shape: **four routes for one concept — `engine-room`,
`guardrails`, `govern`, `boundary` — become one sentence in the footer and one settings page.** The
footer says what the AI teammates may do right now; the page is where you widen or narrow it.

The engine exists and has never been plugged in: `resolveApprovalPolicy` (**zero callers**, and its own
header says *"a long approvals queue is a policy failure to surface, not a workload to render"*),
`autonomy-policy.ts`, spend and token caps on `agent_runs`, escalation state on `agent_approvals`, a
four-rung trust arc, and **120 of 323 approvals with real human answers** — so there is something to
widen on. **Wire it. Do not rebuild it.**

An unset ceiling is the default, **never "unlimited"** (R-22). Say the real number or say it is unset.

**Two sections this page is missing, both new on 2026-08-31 and both yours** — read
[`SPEC-AI-NATIVE-SDLC.md`](./SPEC-AI-NATIVE-SDLC.md) §3 E and §3 H before you design the page, because
they change its shape rather than being bolted on afterwards:

- **What counts as DONE (gap #18).** This page answers what the AI teammates may **do**. Nothing
  anywhere answers what counts as **done**, and that is the question a company actually argues about.
  Anthropic's playbook has the customer's tech lead write it: the review passes, the severity
  definitions, the exclusions. **Ours are hardcoded by us.** One more section here, not a destination.
- **A gate you can declare, and an approver with a name (gap #19).** Their model is a rule the
  customer writes — allow, ask, or block — sitting **above** the policy we infer from their answers.
  Keep the inference (`resolveApprovalPolicy`, now wired at
  `src/lib/approvals-queue.functions.ts:1904`) and put the declared rule on top of it. And a
  production act should record **who** approved it: `agent_approvals.decided_by` is NULL on **18 of
  176** answered calls.
- **Explain the ladder by environment, because that is a sentence a person says out loud** — dev
  moves freely, staging is intermediate, production is gated. **One explanation of the existing
  ladder, never a second ladder**: `trust-ramp.ts` stays the only thing that promotes.

### §J3 · The door: signup → working, with nothing in between

Account creation, workspace creation, invite and member management. **The workspace is not a thing the
user creates before they can start** — Antigravity required a project, measured it, and shipped the
bypass. Create it behind them. Ask for a name later, or never.

**One trap that is specific and expensive:** a Google/OAuth signup leaves no password, so no agent can
ever fill that form again on the founder's behalf. If you are building a signup flow the founder will
use, make email+password work first.

### §J4 · The rest of a real product

Settings (one page, not eleven). Notifications — including *how the verdict reaches a person who left
the page*, which is the async property the whole frontier ships and we do not. Billing and the plan
surface. Search. Admin. Export. Connectors **reached at the moment they are needed** — Discover finding
nothing says *"I have no sources for this. Connect one?"* inline, with the connect control right there.
**Never a shelf you browse first.**

**The sad path is your territory and it is where cheap products are exposed.** Empty, loading, failed,
held, permission-denied, offline. An empty state that does not say what to do next is a fail under
R-20 §5, and four of seven stations commonly produce nothing. Accessibility is not deferred (R-19);
mobile is.

### §J5 · 119 routes, and what they should be

`REIMAGINING.md` argues nine surfaces. Most of the deletable ones are in your prefix. **Map which of
your routes fold into which, propose it in coordination/requests/ with the reasoning, and let S0 rule.** Never delete
a route unilaterally, and never leave a fold half-done — a route folded without its callers redirected
is a 404 in production.

---

## The traps in your area, already paid for

- **A fix in one field is not a fix.** A defect is a shape, not a location. After any copy or
  validation fix, sweep every field mechanically — reading them one at a time cannot see it.
- **Pin the claim, not the spelling.** A guard on a literal string fails when copy improves and passes
  when meaning breaks. Found six times in one day.
- **A form may only accept what it watched you type.** Some forms revert anything set
  programmatically, and a loose verification selector once matched the wrong field and reported a
  false revert.
- **Never write a banned word onto a surface.** `receipts`, `ledger`, `company brain`, `decision
  layer`, `unattended`, `first run`, `provenance` are banned everywhere; *audit trail* and *shared
  brain* stay. *Approve* only where a click **unblocks** something; *review* where it only shows you
  something. **Never claim accumulated learning in the present tense.** Canon:
  `docs/strategy/positioning-locked-2026-08.md`.

---

## Before anything, every session and every unit

```bash
git fetch origin && git rebase origin/main
cat docs/lanes/NOW-*.md          # what every other session is on, right now
```

**Never start work on a stale checkout.** Five sessions push continuously; a thirty-minute-old
worktree is already behind, and a "clean" verification measured against it is measured against a tree
that exists nowhere. **If another session's NOW line names what you were about to start, do not start
it** — take the next item and say why in coordination/requests/.

Then rewrite your own one-line `docs/lanes/NOW-<you>.md`, and append your unit block to
`docs/lanes/log/<you>.md` when you commit. **Those two files are yours alone — never write another
session's, and never write `docs/lanes/BUILDLOG.md`, which S0 rolls up.**

## The craft bar

**OpenAI, Anthropic, Google, Perplexity, Vercel and Linear.** For your surfaces specifically:
**Vercel** for empty-state craft, motion and the sandbox shape; **Linear** for settings density,
speed and delegation-by-assignment. **Not Vercel's marketing site — that surface is frozen (§0.7).** **Only S0 reaches Mobbin**, so file `coordination/requests/<you>/design-<surface>.md` and S0
commits the reference into `docs/design/reference-2026-08-26/` — see `SURFACE-MAP.md`. **Never
eyeball a design; port the mechanics from a real source** (R-20 §7).

## Plain words, on every surface you touch

Operating model §12 is a law, not a copy preference: **if a person would not say the word out loud to
a colleague, it does not go on a surface.** Engine Room, guardrails, govern, boundary, cockpit,
fleet, swarm, artifacts, signals, trust ledger — all out, with the rename map in §12. The station
names (Discover, Decide, Plan, Design, Build, Ship, Learn) **stay as they are**; they are already
plain. Apply the map inside your prefix and file an ask for anything outside it. **A word renamed in
one place and left stale in another has made the problem worse.**

## Research, when you hit something you do not know

Operating model §14. **At the moment of need, by you, time-boxed to the decision you actually face —
and written down once.** Look first: `docs/research/` for market, product or design;
`docs/research/integrations/<tool>.md` for an API; `FINDINGS-LEDGER.md` before re-investigating any
defect. **If a file answers it, read it and stop.**

Need access to a tool? One line naming three things — the tool, the exact scope, what it unblocks — in
`coordination/requests/<you>/access-<tool>.md`. **S0 answers or escalates within the unit. Keep
building while you wait**, and say in your NOW line what you are waiting on.

**And whether something already exists here is not a research question — it is a grep, and it takes
thirty seconds.** About twenty connector providers, 121 Meridian components and a full MCP server are
already in this repo.

## The dev server. Read this one twice.

**Founder's instruction, repeated across sessions and now binding on all five:** *"Do not start the
dev server until it is required. Once your job is done, close it, because of RAM. When too many dev
servers are open the system hangs."*

**Five sessions on one laptop means five times the risk, and this machine has already been driven to a
restart by it** — while the founder was asleep. R-21, and it is a gate, not housekeeping:

```bash
lsof -ti:5173 || true          # BEFORE you start one. If anything is listening, do not start another.
bun run dev                     # only for a check that genuinely needs a browser
kill $(lsof -ti:5173)           # THE MOMENT the check is done. Not at unit end. Not at session end.
```

- **One dev server on this machine at a time.** If the port is busy, another session holds it — read
  the `NOW-*.md` files, use their server if the check is in their prefix, or file a request.
- **Say so in your NOW line while you hold one** (`DEVSERVER` in the status field), and clear it the
  moment you stop it. That is the only way five sessions can see each other's load.
- **A unit is not finished while a server it started is still alive**, and a unit claiming a browser
  check without recording that it stopped the server is rejected on review.
- Kill orphans before you start: a server from a crashed session looks exactly like a live one.

---

## What would prove you wrong

**Sign a stranger in** with no explanation. If at sixty seconds they ask "so what does this do?" — or
if they had to fill anything in before something happened — this failed, whatever else shipped.

And the second test, which is new and is the one your queue is actually ranked on: **a verdict lands
while nobody is looking at the tab, and it reaches the person anyway.** Until that is true, S1's
"you can leave this page" is a claim the product cannot keep, and standard #7 deletes features that
claim what they do not do.
