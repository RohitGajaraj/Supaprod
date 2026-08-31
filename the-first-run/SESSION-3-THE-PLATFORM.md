# S3 · THE PLATFORM — Claude Code, worktree `supaprod-platform`, branch `lane/platform`

> _Re-ranked 2026-08-31: FOUR standing jobs became FIVE, and the public surface was FROZEN.
> §J0 is your reading list, §J1–§J5 are the jobs in ranked order. The `/goal` prompt names them
> by number and carries nothing else, because it has 4,000 characters and this file has no limit._

**Read [`OPERATING-MODEL-5-SESSIONS.md`](./OPERATING-MODEL-5-SESSIONS.md) in full first.** It carries
the user lens, the definition of "truly agentic", the coordination protocol, work-safety
rules and both gates. Then read [`SURFACE-MAP.md`](./SURFACE-MAP.md) — `§FROZEN` for what you may not
touch and `§S3` for every route you own.

---

## §J0 · Your reading list, in this order

1. [`OPERATING-MODEL-5-SESSIONS.md`](./OPERATING-MODEL-5-SESSIONS.md) — every rule. **§0.7 redefines
   your job; read it twice.** §4 is the coordination protocol, amended 2026-08-31.
2. **This file, §J1–§J5.**
3. [`SURFACE-MAP.md`](./SURFACE-MAP.md) — `§FROZEN` and `§S3`.
4. [`SPEC-AI-NATIVE-SDLC.md`](./SPEC-AI-NATIVE-SDLC.md) §3 E, §3 F, §3 H — yours.
5. [`RANKED-BACKLOG.md`](./RANKED-BACKLOG.md) — #2 stays first, then #18 and #19.
6. [`SPEC-CONNECTORS.md`](./SPEC-CONNECTORS.md) — the connect control, and mention consent.
7. [`../docs/strategy/positioning-locked-2026-08.md`](../docs/strategy/positioning-locked-2026-08.md)
   — **the banned words, before you write a single line of copy.**
8. `docs/lanes/QUEUE-S3.md` and `coordination/answers/S3/`.

---

## §FROZEN · The public and marketing surface, frozen 2026-08-31

**You still own it, so that nobody else touches it. You do not improve it.** The enumerated list of
frozen routes and directories is [`SURFACE-MAP.md`](./SURFACE-MAP.md) `§FROZEN`.

**Four exceptions, and nothing else is one:**

1. A live page states something **FALSE**.
2. A **legal or security** page is wrong.
3. The page is **BROKEN**.
4. The **founder asks by name**.

**A correction is one sentence.** If your fix is longer than the claim it corrects, it is a redesign,
and it waits. **S0 rejects a unit that spends here.**

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

**You do not WRITE the database.** A write, a migration or a deploy is a request file in
`coordination/requests/S3/`. **You MAY read Postgres yourself** via the Lovable MCP's
`query_database` — that changed on 2026-08-31 when this lane moved to Claude Code, and it means you
no longer wait on S0 for a count. You have Playwright, every skill, plugin and MCP in your session
reminder, and the whole repo to read.

---

## The sixty seconds, which is the second acceptance criterion

**CORRECTED 2026-08-31: the sixty seconds is measured SIGNED IN, not on the landing page.** The
judged moment is **signup → the product already working, with nothing to fill in first**. A landing
page cannot pass or fail it. The earlier wording — "nothing you build matters more than this" —
is replaced by the ranking in §J1–§J5.

A person who has just signed up and has never seen this product, **inside sixty seconds, without
being told anything, knows what it is doing for them and wants to come back.** The founder judges
this on the running product.

What that forbids: a tour, a tooltip, a checklist of setup steps, a "connect your tools first" wall, an
empty dashboard, a modal explaining the concept. **In a closed loop every action is the only one that
makes sense; a surface that needs explaining is the defect.**

What it requires: the product is **already doing something** by the time the first paint settles. One
sentence in, and work visibly starts. Ferndesk names its agent on the first screen; Gemini starts the
research before the modal closes. Signup, workspace and everything else either happens invisibly
around that or happens later.

---

## Your five standing jobs — §J1 to §J5, and the order IS the ranking

> **Re-ranked 2026-08-31.** The door used to be first. It is now third, because a verdict that
> reaches nobody makes a sentence another lane is shipping into a lie.

### §J1 · The verdict reaches a person who left the page — authorised gap #2

**Nothing today reaches somebody who closed the tab** — no notification, no email, no push, no
digest. S1 is shipping the sentence *"I'm on it, you can leave this page"* on the run surface, and
**until you ship this, that sentence is a claim the product cannot keep.** Standard #7 deletes
features that claim what they do not do, so this outranks everything else you own.

**One channel, done properly, end to end. Email is the recommendation.**

- The message **names what was PREDICTED beside what HAPPENED**, because that pairing is the
  product. A notification that says only "your run finished" is not this job.
- **Acceptance: a real verdict produces a real email to a real address, and you verify it BY
  RECEIVING ONE.** A green unit test is not the acceptance and never was.
- The trigger fires from the spine, and `src/lib/**` is S0's — **file the ask** in
  `coordination/requests/S3/`.
- **Grep for an existing mailer before you write one.** Around twenty connector providers already
  exist, Gmail and Outlook among them. `coordination/answers/S3/A-001`, `A-002`, `A-003` and `A-005`
  are prior rulings on exactly this: the email palette, the trigger, and how you receive one.
- The mention-consent rule in `SPEC-AGENT-COMMS.md` §5 **does not bend.**

### §J2 · What the teammates may do, and what counts as DONE — one page, three parts

**(a) The fold, already ruled.** `engine-room`, `guardrails`, `govern` and `boundary` are four doors
onto one idea. They become **one sentence in the footer and one settings page**.
`resolveApprovalPolicy` **is now wired** at `src/lib/approvals-queue.functions.ts:1904` — the
"zero callers" line in the older draft of this brief is **stale, and you treat it as done.**

**(b) NEW, gap #18: nothing anywhere says what counts as DONE.** Anthropic's `REVIEW.md` is written
by *the customer's tech lead* — which review passes, the severity definitions, the exclusions. **Ours
are hardcoded by us.** That is the question a company actually argues about, and it is **one more
section on this page, not a destination of its own.**

**(c) NEW, gap #19: a gate the customer DECLARES, sitting above the policy we infer.** Allow / ask /
block, declared by them, above the policy we infer from their answers. **Keep the inference; add the
declaration.** And **an approval must record WHO answered**: `agent_approvals.decided_by` is NULL on
**18 of 176** answered calls.

**Explain the ladder by ENVIRONMENT**, because that is a sentence a person says out loud — *dev moves
freely, staging is intermediate, production is gated.* **ONE explanation of the existing ladder,
never a second ladder**; `trust-ramp.ts` stays the only thing that promotes. **An unset ceiling is
"unset" or its real number, NEVER "unlimited" (R-22).**

### §J3 · The door: signup → working, with nothing in between

Account creation, workspace creation, invite and member management. **The workspace is not a thing the
user creates before they can start** — Antigravity required a project, measured it, and shipped the
bypass. Create it behind them. Ask for a name later, or never.

**One trap that is specific and expensive:** a Google/OAuth signup leaves no password, so no agent can
ever fill that form again on the founder's behalf. If you are building a signup flow the founder will
use, make email+password work first.

### §J2-legacy · Operate: the boundary, set once, widened by class (superseded by §J2 above)

This is the third of the six verbs (§11 of the operating model) and it is where the product becomes
enterprise-credible rather than a toy.

`THE-ONE-SCREEN.md` already ruled the shape: **four routes for one concept — `engine-room`,
`guardrails`, `govern`, `boundary` — become one sentence in the footer and one settings page.** The
footer says what the AI teammates may do right now; the page is where you widen or narrow it.

The engine exists. **`resolveApprovalPolicy` is now WIRED** — corrected 2026-08-31; it has a live
caller at `src/lib/approvals-queue.functions.ts:1904`, a second at `:1905`, and a guard asserting the
loop source still contains the call, so the wire cannot be quietly cut. **Anyone reading the old
"zero callers" wording here should treat that job as done rather than re-wiring it.** Its own
header says *"a long approvals queue is a policy failure to surface, not a workload to render"*;
alongside it sit
`autonomy-policy.ts`, spend and token caps on `agent_runs`, escalation state on `agent_approvals`, a
four-rung trust arc, and **120 of 323 approvals with real human answers** — so there is something to
widen on. **What remains is the FOLD and the two new declarations in §J2, not the wiring.**

An unset ceiling is the default, **never "unlimited"** (R-22). Say the real number or say it is unset.

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

### §J5 · The route fold — 119 routes, and what they should be

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

Sit a stranger down with no explanation. If at sixty seconds they ask "so what does this do?" — or if
they had to fill anything in before something happened — this failed, whatever else shipped.
