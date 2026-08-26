# SPEC-CONNECTORS — the tools at every station, and how an agent acts in them

> _Written 2026-08-26 by MAIN from the founder's direction: "we need to integrate with various tools at
> various stages. Linear, Jira, and build needs to be taken care of from that side. If some ticket
> needs to be raised, approved and taken care of, and if for agents some inbox needs to be managed —
> how are you going to take care of that? Think globally and holistically. It should be complete,
> actual building, not just closing the gap and reskinning."_
>
> **Read §1 before proposing anything. Most of this is already built.**

---

## 1 · What already exists, measured today, and it changes the brief entirely

I went looking to design a connector layer and found one. **Measured 2026-08-26 by inspection:**

> ### ⇢ AUDITED BY S0, 2026-08-26 — the route-by-route number job 1c owed, and it refines the line below
>
> *"About twenty providers are already written"* is true of the **catalogue** and not of the
> **wiring**. `registry.ts` declares **20**. `providers/index.server.ts:38` maps them to adapters:
>
> - **14 real** — github · intercom · stripe · slack · zendesk · hubspot · salesforce · canny ·
>   productboard · linear · notion · google_docs · figma · jira
> - **6 `stubAdapter`**, which answer *"adapter not implemented"* — google_calendar · google_tasks ·
>   microsoft_outlook · **gmail** · microsoft_mail · firecrawl
> - **4 hold a live connection in production** (`SELECT provider, status, count(*) FROM connections
>   GROUP BY 1,2`): github 2 · salesforce 1 · linear 1 · slack 1. All four have real adapters, so
>   nothing in use is currently broken.
>
> **The honest headline is 14 of 20 wired, 4 in use.**
>
> **Against the four that carry the loop, three already have real code:**
> 1. **An issue tracker in and out — BUILT AND REACHABLE.** `src/lib/linear.functions.ts` (11.3KB)
>    exports `listLinearTeams`, `searchLinearIssues`, `importLinearIssue`,
>    `createLinearIssuesFromTasks`, `pullLinearIssue`, `pushLinearIssue`; `sync.functions.ts:577,678`
>    calls pull and push, and it is reached from route `_authenticated.sync.tsx` and
>    `components/ship/WhatShipped.tsx`. **Do not rebuild this — verify it against a real Linear
>    workspace and fix what breaks.**
> 2. **The repository handback** — `github-repo.server.ts` and `gitlab-repo.server.ts` exist.
> 3. **Slack or email to a person who left** — Slack has ingest **and** digest
>    (`slack-digest.server.ts`). **Email does not: `gmail` is a `stubAdapter` even though
>    `pull-ingestors.server.ts:48` wires `ingestGmailSignals`.** See F-81.
> 4. **One analytics source for the verdict — GENUINELY MISSING**, and it is the one that closes the
>    moat. This is Decide's metric probe (§1b), and the grader has processed zero workspaces in its
>    life (F-51).
>
> So the remaining connector work is **narrower than this spec reads**: finish email, prove Linear
> against a real workspace, and build the verdict's metric source.

**~20 provider integrations, already written**, in `src/lib/connectors/providers/`:
GitHub (`github.server.ts` 14.3KB, `github-repo.server.ts` 12.6KB, ingest, signals) · GitLab ·
**Jira** (`jira.server.ts`) · **Linear** (`src/lib/linear.functions.ts`, with `pullLinearIssue`,
`pushLinearIssue`, `importLinearIssue`, `createLinearIssuesFromTasks`) · Slack (ingest + digest) ·
Figma · Stripe · Zendesk · Intercom · HubSpot · Salesforce · Canny · Productboard · Gmail ·
Outlook — most with their own tests.

**A generic MCP client**, in `src/lib/connectors/mcp/`: `client.server.ts`, `ingest.server.ts`,
`registry.ts`, `types.ts`, with tests.

**The plumbing**: `catalog.ts` · `registry.ts` · `resolve.server.ts` · `crypto.server.ts` (credential
encryption) · `oauth-refresh.server.ts` · `repo-provider.ts` · `product-binding.functions.ts` ·
`gateway-era.server.ts`. Tables: `connectors`, `connector_access`, `connector_requests`,
`connector_limit*`, `connector_cap_probe`, and `external_id` / `external_url` / `external_handle`
columns already on the objects that need them.

**A generic ingestion contract**: `src/lib/sources/ingestor.ts` + `kinds.ts` + `sink.server.ts` — one
shape for any evidence source, so a new source is an adapter rather than a feature.

**And Supaprod is already an MCP server**: route `src/routes/[.mcp]/` (`list-tools.ts`,
`invoke-tool`), `src/lib/mcp.functions.ts`, `mcp-protocol.ts`, `mcp-auth.server.ts`, and write tools
with tests — `record_decision`, `draft_spec`, `settle_outcome`, `ingest_signal`.

**Who actually calls it, verified rather than assumed:**

| Entry point | Reached from |
| --- | --- |
| `pullLinearIssue` · `pushLinearIssue` | `src/lib/sync.functions.ts` |
| `createLinearIssuesFromTasks` | `src/routes/_authenticated.plan.spec.$id.tsx` |
| the MCP client | `src/routes/api/public/hooks/sense-tick.ts` (the cron) · `src/lib/design-memory.functions.ts` |
| the pull ingestors | `src/lib/onboarding/first-ingest.server.ts` · `sense-tick.ts` |

**So the default move here is the same as everywhere else in this phase: WIRE WHAT EXISTS.** A unit
that adds a provider must name, in its unit file, which of the twenty it checked first and why it did
not serve. **A session that writes a second Jira client has wasted a night.**

### CORRECTION to `SURFACE-MAP.md`, and it is mine

I marked `_authenticated.sync.tsx` as **AUDIT** and `_authenticated.plan.spec.$id.tsx` as
**FOLD → run**. Both carry **live integration callers** — Linear pull/push and issue creation from
tasks. **Folding either without carrying those forward deletes working integration surface.** The
disposition stands; the fold must move the caller, not drop it. Same for anything reached from
`sense-tick.ts`, which is the cron the whole evidence path hangs off.

---

## 2 · The architecture, and it is one path with one exception

**MCP is the universal connector, and we already have the client.** The customer's tools increasingly
ship MCP servers — Notion, Linear, GitHub, Figma, Stripe, Sentry all do. **A generic MCP client plus a
scope policy is one integration that becomes all of them**, and it is how this repo itself reaches
Lovable, Mobbin and Playwright.

**So the order of preference for reaching any tool, and it is not negotiable:**

1. **The tool's MCP server, through our existing client.** No new code, a scope policy, done.
2. **The generic ingestion contract** (`sources/ingestor.ts` + `kinds.ts`), for anything that is only
   a stream of evidence. An adapter, not a feature.
3. **A bespoke provider**, only when the tool has no MCP server and needs writes or non-trivial auth.
   **Twenty of these already exist. Check the list before you write the twenty-first.**

**And the reverse direction is already built and is the cheapest handback we have:** Supaprod is an
MCP server, so **the customer's own agents — Claude Code, Cursor, Codex — can read our decisions and
write outcomes back without us integrating with anything.** That is handback mechanism zero, it is
live, and `SPEC-BUILD-PATHS.md` §3 should be read with it in mind.

---

## 3 · The map — which tool matters at which station, and what the agent must be able to DO

Direction matters more than the tool name. **Read is cheap and safe; write is where the design work is.**

| Station | Tool | Direction | What the agent does there |
| --- | --- | --- | --- |
| **Assign** (before Discover) | **Linear · Jira** | **in** | **An issue assigned to Supaprod becomes a piece of work.** See §4 — this is the most valuable single integration in this spec |
| | Slack · email | in | A message or thread becomes a piece of work, with its source attached |
| **Discover** | Slack · Zendesk · Intercom · Gmail · Outlook · Canny · Productboard · HubSpot · Salesforce · Stripe · GitHub issues | in | Read evidence, attach it with author, time and url. All eleven adapters exist |
| | anything | in | **A connector dry-run before connecting** — show what it would pull, write nothing (`SPEC-BUILD-PATHS.md` §2.3) |
| **Decide** | analytics · warehouse | in | **Prove the forecast's metric is readable today.** The highest-value probe in the product |
| **Plan** | **Linear · Jira** | **out** | **Raise the ticket, with the acceptance criteria and the forecast on it.** `createLinearIssuesFromTasks` exists and is reached from one route |
| | Notion · Confluence | out | Write the spec where the org already reads specs |
| **Design** | **Figma** | in / out | Read a file or frame; write a comment. `figma.server.ts` exists |
| **Build** | **GitHub · GitLab** | in / out | Open a PR, read checks, read the merge. Or hand the brief to the customer's builder (`SPEC-BUILD-PATHS.md` §3.4) |
| **Ship** | deploy provider | in | Read the deploy record. **The preview deploy is the proof R-27 gates production on** |
| | Slack · changelog | out | Say what went out, where |
| **Learn** | analytics · warehouse | in | Read the named metric on the horizon date. **The one integration that is not optional** |
| **Everywhere** | Slack · email · push | out | **The ask, and the verdict, reaching a person who left the page.** Gap #2, and nothing does it today |

**Note what carries the loop.** Four integrations, and without them it cannot close: **an issue
tracker** (in and out), **a repository** (the handback), **an analytics source** (the verdict), and
**Slack or email** (reaching a person who left). Everything else is upside. **Build those four
properly before the sixteenth evidence adapter.**

---

## 4 · Work arriving from outside — the "inbox" question, answered without building an inbox

**The founder's point:** *"if for agents some inbox needs to be managed, all those things come into the
picture."* Yes — but the answer is not a destination.

**The gesture is native to the source system, and this is the whole design.** You assign the Linear or
Jira issue to Supaprod, exactly as you would assign it to a person. That is Linear's own pattern for
agents, it requires the user to learn nothing, and **it means our product is reached from the tool they
already have open.** Notion's shape confirms it: give it a job, set a trigger, it runs.

- **Inbound work is a column on the board, never a page.** §0.5 of the operating model: three surfaces.
  `_authenticated.inbox.tsx` is deleted, and anything real in it folds into *Waiting for you*.
- **The source object stays the source of truth for its own fields.** We do not fight Jira over a status
  field. **One owner per field, declared** — they own priority, assignee and their own workflow state;
  we own the decision, the forecast, the spec and the verdict, and we write those back as a link and a
  comment rather than by overwriting their columns.
- **Round-tripping is a stated contract, not a mirror.** `pullLinearIssue` and `pushLinearIssue`
  already exist. Finish them against the rule above rather than building a sync engine, because a
  bidirectional mirror between two systems of record is the classic way to corrupt both.

---

## 5 · An agent writing into somebody else's tool — the governance, and it is not optional

This is the part that makes it enterprise-grade rather than a demo. **Every external write goes through
the same machinery the internal ones do** — `TOOL_DEFAULTS`, the boundary, the audit trail — and there
is no separate path.

**Mode by reversibility, which is the rule the repo already uses:**

| Act | Mode | Why |
| --- | --- | --- |
| Read anything in scope | `auto` | No side effect |
| Create an issue, post a comment, open a PR, attach a file | `auto` | Reversible, attributable, and the person sees it in the run |
| Change something a human owns — reassign, reprioritise, close, edit their text | `confirm` | It is their object |
| Merge, promote, deploy, spend money | `review` or the one human gate | Irreversible or costly. R-27: production is gated by proof |
| Delete anything in a customer system | **never** | Not offered, not implemented |

**Five rules on top, each from something already learned here:**

1. **Every external write is recorded with which teammate did it, what it targeted, and under whose
   authority** — that is the audit trail, and it is the thing an enterprise buyer actually checks.
2. **Never notify a human on the customer's behalf without explicit consent.** An agent that
   @-mentions people in Slack is a reputational incident, not a feature. Posting into a channel the
   customer nominated is fine; tagging individuals is a separate, explicit permission.
3. **Narrowest scope that answers the question.** A product that asks for a whole codebase to tell you
   whether your bet worked has mispriced the trade. The repository app needs four events: PR opened,
   checks, merged, deployed.
4. **The ask happens in place** (R-04). A connector permission is requested at the moment it is needed,
   inside the run, with the connect control right there — **never as a shelf you browse first**, and
   never as a queued approval. 90 queued approvals since July, **zero ever answered.**
5. **A refused write is not a failed station** (R-26). Say which door is locked, name it, offer the
   next action, and do not retry silently. There is already a test named
   `mcp-a-refused-write-is-not-a-successful-one.test.ts`; that standard applies outward too.

---

## 6 · How the research gets done — the founder's actual question

> *"Individually, would S1 to S4 or S0 to S4 do that research while building? Whatever comes into the
> picture while they're building, they should ask, and they should build it. We can give the Linear
> access if they want."_

**Ruled: research happens at the moment of need, by the session that needs it, and it is written down
once so nobody pays for it twice.** No up-front integration research phase — that produces a document
nobody reads and a backlog nobody builds.

**The protocol, four steps:**

1. **Check `docs/research/integrations/` first.** If a file for that tool exists, read it and stop
   researching. **This is the whole point of the folder.**
2. **Time-box the research to the decision you actually face.** Not "everything about the Jira API" —
   *"can I create an issue with a custom field, and what scope does that need?"* Record the answer, the
   endpoint, the scope string, the rate limit, and the date, in
   `docs/research/integrations/<tool>.md`, linked from that folder's index in the same commit.
3. **Ask for access in one line, and name three things**: the tool, the exact scope, and what it
   unblocks. `coordination/requests/<S>/access-<tool>.md`. **S0 provides it or escalates to the
   founder in the same unit** — anything involving money, a customer's real data, or a credential the
   founder holds personally goes to him, and everything else S0 answers itself.
4. **Keep building while you wait.** A blocked integration is not a blocked unit; do the part that does
   not need the credential, and say in your NOW line what you are waiting on.

**S0's standing duty:** for tools it can already reach, it does not wait to be asked. It pulls the
reference, commits it, and tells the lane it is there — the same protocol as Mobbin and beautifului.dev
in `SURFACE-MAP.md`.

---

## 7 · Ownership and order

| Piece | Owner | Order |
| --- | --- | --- |
| **Audit what of §1 is actually wired**, route by route, and report the number | **S0** | **First. Nothing else in this spec starts before this.** ~20 providers exist and the surface map nearly folded two routes that call them |
| The four that carry the loop: issue tracker in/out · repository handback · analytics for the verdict · Slack-or-email reaching a person who left | **S0** | Second, in that order |
| Inbound assignment — an issue assigned to Supaprod becomes work, as a column on the board | **S0** the intake, **S2** the column | Second |
| The ask-in-place connect control, and the *Connections* section | **S3** | With the above. **Never a shelf** |
| Connector dry-run surface | **S1** surface, **S0** the probe | With `SPEC-BUILD-PATHS.md` §2.3 |
| External-write governance in `TOOL_DEFAULTS` + the audit trail | **S0** | With the first write |
| Proving no external write happens outside its stated mode, and no cursor or count is theatre | **S4** | Standing |

---

## 8 · What would prove this wrong

If a session builds a twenty-first provider before anyone has audited the twenty that exist, this spec
failed as a document. **And if the four that carry the loop are not done before the sixteenth evidence
adapter, we have optimised for a demo rather than a closed loop** — which is exactly how three months
produced 93 tracks and zero verdicts.
