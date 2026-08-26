# S3 · THE PLATFORM — OpenCode, worktree `supaprod-platform`, branch `lane/platform`

**Read [`OPERATING-MODEL-5-SESSIONS.md`](./OPERATING-MODEL-5-SESSIONS.md) in full first.** It carries
the user lens, the definition of "truly agentic", the git-only coordination protocol, work-safety
rules and both gates. Then read [`SURFACE-MAP.md`](./SURFACE-MAP.md) for every route you own and what
happens to it.

**You own everything between "a stranger arrives" and "they are working" — and everything that makes
this a product a company can actually buy.** S1 and S2 build the thing. You build the reason a person
gets to it at all, and the reason they are still there in a month.

---

## What you own (write nothing else)

`src/components/onboarding/**` · `settings/**` · `billing/**` · `admin/**` · `system/**` ·
`governance/**` · `engine-room/**` · `connections/**` · `plg/**` · `public/**` · `landing/**` ·
`src/styles/**` except `meridian.css`
Routes: `settings` · `onboarding` · `admin.*` · `integrations` · `notifications` · `boundary` ·
`govern` · `guardrails` · `engine-room` · `budgets` · `approvals` · `login` · `signup` ·
`forgot-password` · `checkout*`

You have **no database**. Every count, row and query is a request file in coordination/requests/<you>/. You have Playwright, every
skill and plugin in your session, and the whole repo to read.

---

## The sixty seconds, which is the second acceptance criterion

A person who has never seen this product opens it and, **inside sixty seconds, without being told
anything, knows what it is doing for them and wants to come back.** The founder judges this on the
running product. Nothing you build matters more than this.

What that forbids: a tour, a tooltip, a checklist of setup steps, a "connect your tools first" wall, an
empty dashboard, a modal explaining the concept. **In a closed loop every action is the only one that
makes sense; a surface that needs explaining is the defect.**

What it requires: the product is **already doing something** by the time the first paint settles. One
sentence in, and work visibly starts. Ferndesk names its agent on the first screen; Gemini starts the
research before the modal closes. Signup, workspace and everything else either happens invisibly
around that or happens later.

---

## Your four standing jobs

### 1 · The door: signup → working, with nothing in between

Account creation, workspace creation, invite and member management. **The workspace is not a thing the
user creates before they can start** — Antigravity required a project, measured it, and shipped the
bypass. Create it behind them. Ask for a name later, or never.

**One trap that is specific and expensive:** a Google/OAuth signup leaves no password, so no agent can
ever fill that form again on the founder's behalf. If you are building a signup flow the founder will
use, make email+password work first.

### 2 · Operate: the boundary, set once, widened by class

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

### 3 · The rest of a real product

Settings (one page, not eleven). Notifications — including *how the verdict reaches a person who left
the page*, which is the async property the whole frontier ships and we do not. Billing and the plan
surface. Search. Admin. Export. Connectors **reached at the moment they are needed** — Discover finding
nothing says *"I have no sources for this. Connect one?"* inline, with the connect control right there.
**Never a shelf you browse first.**

**The sad path is your territory and it is where cheap products are exposed.** Empty, loading, failed,
held, permission-denied, offline. An empty state that does not say what to do next is a fail under
R-20 §5, and four of seven stations commonly produce nothing. Accessibility is not deferred (R-19);
mobile is.

### 4 · 119 routes, and what they should be

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
Vercel for the marketing and empty-state craft, Linear for settings density and speed. **Only S0 reaches Mobbin**, so file `coordination/requests/<you>/design-<surface>.md` and S0
commits the reference into `docs/design/reference-2026-08-26/` — see `SURFACE-MAP.md`. **Never
eyeball a design; port the mechanics from a real source** (R-20 §7).

## Plain words, on every surface you touch

Operating model §12 is a law, not a copy preference: **if a person would not say the word out loud to
a colleague, it does not go on a surface.** Engine Room, guardrails, govern, boundary, cockpit,
fleet, swarm, artifacts, signals, trust ledger — all out, with the rename map in §12. The station
names (Discover, Decide, Plan, Design, Build, Ship, Learn) **stay as they are**; they are already
plain. Apply the map inside your prefix and file an ask for anything outside it. **A word renamed in
one place and left stale in another has made the problem worse.**

---

## What would prove you wrong

Sit a stranger down with no explanation. If at sixty seconds they ask "so what does this do?" — or if
they had to fill anything in before something happened — this failed, whatever else shipped.
